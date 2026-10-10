# SkyReader: Backend / Data Schema

*Companion to the SkyReader TRD. There is **no required server**: the "backend" is a local database in the browser (IndexedDB, or SQLite compiled to WebAssembly). The schema below is written as SQL so it works with `sqlite-wasm` and maps directly to IndexedDB object stores. An optional self-hosted sync is described at the end.*

## 1. Entity overview

- `model_pack` 1-N `prediction` (which model made each prediction)
- `observation` 1-N `prediction` (top-K classes per photo)
- `observation` 1-1 `weather_snapshot` (weather when the photo was taken)
- `observation` 1-1 `advice` (verdict and reasons)
- `observation` 0-1 `outcome_check` (what actually happened later)
- `cloud_class` is reference data (10 genera plus clear sky)
- `setting` is a key-value table

## 2. SQL (SQLite)

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE cloud_class (
  id            INTEGER PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,     -- 'Cb', 'Ns', 'As', ...
  name          TEXT NOT NULL,            -- 'Cumulonimbus'
  altitude_band TEXT NOT NULL CHECK (altitude_band IN ('high','mid','low','vertical','none')),
  how_to_spot   TEXT,
  usual_meaning TEXT,
  signal_type   TEXT NOT NULL DEFAULT 'neutral'
                CHECK (signal_type IN ('neutral','change_coming','rain_building','rain_now','storm','low_visibility')),
  signal_weight INTEGER NOT NULL DEFAULT 0,        -- penalty used by advice engine
  is_storm_signal INTEGER NOT NULL DEFAULT 0,
  label_index   INTEGER NOT NULL UNIQUE           -- model output index
);

CREATE TABLE model_pack (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,            -- 'skyreader-mnv3-int8'
  version       TEXT NOT NULL,
  model_file    TEXT NOT NULL,
  sha256        TEXT NOT NULL,
  license       TEXT NOT NULL,
  input_size    INTEGER NOT NULL DEFAULT 224,
  temperature   REAL NOT NULL DEFAULT 1.0,        -- calibration
  reject_threshold REAL NOT NULL DEFAULT 0.45,    -- below this => 'unsure'
  installed_at  TEXT NOT NULL,
  is_active     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE observation (
  id           INTEGER PRIMARY KEY,
  observed_at  TEXT NOT NULL,                     -- ISO 8601 UTC
  photo_thumb  BLOB,                              -- small JPEG, optional
  lat_rounded  REAL,                              -- rounded to ~0.1 degree
  lon_rounded  REAL,
  location_mode TEXT NOT NULL DEFAULT 'rounded'
               CHECK (location_mode IN ('rounded','manual','none')),
  place_label  TEXT,                              -- user-typed or city name
  user_label_class_id INTEGER REFERENCES cloud_class(id),  -- user correction
  is_unsure    INTEGER NOT NULL DEFAULT 0,
  note         TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE prediction (
  id            INTEGER PRIMARY KEY,
  observation_id INTEGER NOT NULL REFERENCES observation(id) ON DELETE CASCADE,
  model_pack_id INTEGER NOT NULL REFERENCES model_pack(id),
  cloud_class_id INTEGER NOT NULL REFERENCES cloud_class(id),
  rank          INTEGER NOT NULL,                 -- 1 = top
  probability   REAL NOT NULL CHECK (probability BETWEEN 0 AND 1),
  latency_ms    INTEGER,
  UNIQUE (observation_id, rank)
);

CREATE TABLE weather_snapshot (
  id              INTEGER PRIMARY KEY,
  observation_id  INTEGER NOT NULL UNIQUE REFERENCES observation(id) ON DELETE CASCADE,
  source          TEXT NOT NULL DEFAULT 'open-meteo',
  fetched_at      TEXT NOT NULL,
  is_cached       INTEGER NOT NULL DEFAULT 0,
  temperature_c   REAL,
  apparent_temp_c REAL,
  precip_prob_3h  REAL,                           -- max over next 3 h, percent
  precip_mm_6h    REAL,
  wind_gust_kmh   REAL,
  wind_speed_kmh  REAL,
  uv_index        REAL,
  cape            REAL,
  weather_code    INTEGER,
  cloud_cover_pct REAL,
  visibility_m    REAL,
  hours_to_sunset REAL,
  hourly_json     TEXT                            -- next 6 h for the strip
);

CREATE TABLE advice (
  id             INTEGER PRIMARY KEY,
  observation_id INTEGER NOT NULL UNIQUE REFERENCES observation(id) ON DELETE CASCADE,
  score          INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  verdict        TEXT NOT NULL CHECK (verdict IN ('go','go_with_care','wait','stay_in')),
  hard_rule_hit  TEXT,                            -- e.g. 'storm_cap'
  reasons_json   TEXT NOT NULL,                   -- [{factor, penalty, text}]
  suggestion     TEXT,
  text_source    TEXT NOT NULL DEFAULT 'template'
                 CHECK (text_source IN ('template','llm')),
  engine_version TEXT NOT NULL
);

CREATE TABLE outcome_check (
  id              INTEGER PRIMARY KEY,
  observation_id  INTEGER NOT NULL UNIQUE REFERENCES observation(id) ON DELETE CASCADE,
  checked_at      TEXT NOT NULL,
  window_hours    INTEGER NOT NULL DEFAULT 3,
  rain_occurred   INTEGER,                        -- 0/1
  precip_mm       REAL,
  max_gust_kmh    REAL,
  thunder_occurred INTEGER,
  result          TEXT NOT NULL CHECK (result IN ('held_up','missed','inconclusive')),
  user_felt       TEXT CHECK (user_felt IN ('better','as_expected','worse'))
);

CREATE TABLE setting (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX idx_obs_time       ON observation(observed_at);
CREATE INDEX idx_pred_obs       ON prediction(observation_id);
CREATE INDEX idx_pred_class     ON prediction(cloud_class_id);
CREATE INDEX idx_outcome_result ON outcome_check(result);
```

## 3. Seed data for `cloud_class`

| label\_index | code | name | altitude | signal\_type | storm |
| --- | --- | --- | --- | --- | --- |
| 0 | Ci | Cirrus | high | change\_coming | 0 |
| 1 | Cc | Cirrocumulus | high | neutral | 0 |
| 2 | Cs | Cirrostratus | high | change\_coming | 0 |
| 3 | Ac | Altocumulus | mid | neutral | 0 |
| 4 | As | Altostratus | mid | rain\_building | 0 |
| 5 | Ns | Nimbostratus | low | rain\_now | 0 |
| 6 | Sc | Stratocumulus | low | neutral | 0 |
| 7 | St | Stratus | low | low\_visibility | 0 |
| 8 | Cu | Cumulus | low | neutral | 0 |
| 9 | Cb | Cumulonimbus | vertical | storm | 1 |
| 10 | Clr | Clear sky | none | neutral | 0 |

## 4. Useful views

```sql
-- Log with the top prediction, verdict and outcome
CREATE VIEW sky_log AS
SELECT o.id, o.observed_at, c.name AS cloud, p.probability,
       a.verdict, a.score, oc.result AS outcome
FROM observation o
JOIN prediction p ON p.observation_id = o.id AND p.rank = 1
JOIN cloud_class c ON c.id = COALESCE(o.user_label_class_id, p.cloud_class_id)
LEFT JOIN advice a ON a.observation_id = o.id
LEFT JOIN outcome_check oc ON oc.observation_id = o.id;

-- Hit rate of the tips so far
CREATE VIEW tip_accuracy AS
SELECT a.verdict,
       COUNT(*) AS checked,
       SUM(CASE WHEN oc.result = 'held_up' THEN 1 ELSE 0 END) AS held_up
FROM advice a
JOIN outcome_check oc ON oc.observation_id = a.observation_id
WHERE oc.result != 'inconclusive'
GROUP BY a.verdict;
```

## 5. Model pack manifest (`manifest.json`)

```json
{
  "name": "skyreader-mnv3-int8",
  "version": "1.0.0",
  "model": { "file": "model.onnx", "sha256": "...", "license": "...", "quantization": "int8" },
  "preprocess": { "size": 224, "resize": "short_side_256_center_crop", "mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225] },
  "calibration": { "temperature": 1.3, "reject_threshold": 0.45 },
  "labels": ["Ci", "Cc", "Cs", "Ac", "As", "Ns", "Sc", "St", "Cu", "Cb", "Clr"],
  "data_attribution": "attributions.csv"
}
```

## 6. Weather cache (IndexedDB store or table)

| Field | Meaning |
| --- | --- |
| `cache_key` | rounded lat,lon + date-hour |
| `fetched_at` | when the response was stored |
| `payload_json` | trimmed Open-Meteo response (next 24 h hourly + sunrise/sunset) |
| `expires_at` | usually 60 minutes; stale data is still shown offline with its age |

## 7. Data rules

| Rule | Detail |
| --- | --- |
| Timestamps | ISO 8601 UTC strings |
| Photos | Full-size photos are never stored by default; only a small thumbnail if the user opts in |
| Location | Always rounded before storage and before any request |
| Outcome check | Runs when the app is next opened at least 3 h after the observation, using the weather API's recent-hours data |
| Verdict versioning | `engine_version` stored so old verdicts stay interpretable after rule changes |
| Deletion | "Delete all data" clears every table and the weather cache; deleting an observation cascades to its children |

## 8. Export formats

- **CSV columns:** `observed_at, cloud, confidence, verdict, score, precip_prob_3h, wind_gust_kmh, uv_index, outcome, place_label`.
- **JSON:** the full observation graph for backup and import.

## 9. Optional sync (post-v1)

A small self-hosted service (FastAPI or a serverless function with SQLite/Postgres) mirroring `observation`, `prediction`, `weather_snapshot`, `advice` and `outcome_check`, with `updated_at` and `device_id` columns and last-write-wins conflict handling. Not needed for the challenge build.
