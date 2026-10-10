# SkyReader: Architecture

A static website (installable PWA) that classifies a sky photo in the browser and combines the result with live weather to give a "should I go out?" verdict. There is no application server; the only external calls are the weather API and model file downloads.

## 1. System context

```
              +------------------------------+
              |      User (phone or PC)      |
              +--------------+---------------+
                             | photo / upload / tap
                  +----------v-----------+
                  |  SkyReader PWA       |   served as static files
                  |  (runs in browser)   |   from Cloudflare/Netlify/GitHub Pages
                  +----------+-----------+
      +----------------------+----------------------+
      |                      |                      |
+-----v------+       +-------v-------+      +-------v--------+
| ML engine  |       | Advice engine |      | Local storage  |
| onnxruntime|       | (rules, TS)   |      | IndexedDB /    |
| -web       |       |               |      | sqlite-wasm    |
+-----+------+       +-------+-------+      +-------+--------+
      |                      |                      |
      |              +-------v--------+             |
      |              | Weather client |             |
      |              | + cache        |             |
      |              +-------+--------+             |
      |                      | rounded lat/lon only |
      |              +-------v--------+             |
      |              | Open-Meteo API |  (external)
      |              +----------------+
      |
  model_pack (ONNX + manifest), cached by the service worker
```

## 2. Layers

| Layer | Responsibility | Tech |
|---|---|---|
| UI | Screens, camera, crop, charts, theming | React/Svelte + Tailwind |
| State | App state, async flows, error handling | Zustand or Redux Toolkit, or Svelte stores |
| Domain | Use cases: Classify, GetWeather, Advise, SaveObservation, CheckOutcome, Export | TypeScript modules |
| ML | Image preprocessing, ONNX inference, calibration, reject logic | onnxruntime-web (WASM/WebGPU) in a Web Worker |
| Advice | Cloud signal + weather -> score, verdict, reasons | Pure TypeScript functions |
| Data | DB access, weather cache, pack manager | IndexedDB / sqlite-wasm |
| Platform | PWA install, offline caching, background sync-lite | Service worker, Cache API |

Dependencies point inward: UI -> State -> Domain -> ML / Advice / Data.

## 3. Photo to verdict data flow

```
Take photo / upload
  -> Preprocess (resize, center-crop, normalize)   [Web Worker]
  -> ONNX inference -> logits
  -> Temperature scaling -> probabilities
  -> Reject check (max prob < threshold => "unsure")
  -> Top-3 classes

In parallel:
  Location (rounded) -> Weather client -> cache hit? use : fetch Open-Meteo
  -> next-6h snapshot

Advice engine(cloud top-3, weather snapshot)
  -> penalties -> score -> verdict -> hard rules -> reasons + suggestion
  -> Result screen
  -> (optional) save: observation, predictions, snapshot, advice
```

Latency budget: preprocess < 100 ms, inference < 500 ms desktop / 1.5 s phone, weather from cache < 50 ms (network fetch < 1 s), advice < 10 ms.

## 4. Outcome check flow

```
App opens
  -> find observations older than 3 h without an outcome
  -> fetch recent-hours weather for that place and time window
  -> compare: did it rain, max gust, thunder?
  -> classify the original verdict: held_up / missed / inconclusive
  -> store outcome_check
  -> update the tip_accuracy summary
```

This closes the loop and produces the honest hit-rate number for the write-up.

## 5. Components

| Component | Interface (sketch) | Notes |
|---|---|---|
| `CameraCapture` | `capture(): Blob` | `getUserMedia` with file-input fallback |
| `Preprocessor` | `toTensor(image): Float32Array` | Must match training; spec in `manifest.json` |
| `Classifier` | `predict(tensor): Probabilities` | Runs in a worker; session reused |
| `Calibrator` | `apply(logits, T)` | Temperature scaling |
| `WeatherClient` | `getSnapshot(lat, lon): Snapshot` | Rounds coordinates, caches, handles errors |
| `AdviceEngine` | `advise(clouds, snapshot): Advice` | Deterministic; unit-tested |
| `OutcomeChecker` | `check(observation): Outcome` | Uses recent-hours weather data |
| `ObservationRepo` | `save`, `list`, `delete`, `export` | DB access |
| `PackManager` | `load`, `verify(sha256)`, `swap` | Reads `manifest.json` |
| `AtlasContent` | `get(classCode)` | Static JSON + reference images |

## 6. Suggested project structure

```
skyreader/
  web/
    src/
      ui/            # screens, components, theme
      state/         # stores
      domain/        # use cases, types
      ml/            # preprocess, worker, classifier, calibration
      advice/        # rules, penalties, text templates, tests
      weather/       # client, cache, mapping
      data/          # db, repositories, migrations, export
      atlas/         # cloud descriptions and images
    public/
      models/        # model.onnx, manifest.json (or hosted externally)
      sw.js          # service worker
      manifest.webmanifest
  ml/
    notebooks/       # data prep, training, evaluation
    scripts/         # download, clean, augment, export, parity test
    packs/           # built model packs
  docs/              # PRD, TRD, UI/UX, schema, this file, phases
  LICENSES.md
```

## 7. ML training architecture (off-device)

```
Public cloud datasets + own phone photos
  -> dedupe, label check, split by source/location
  -> augmentation (crop, jitter, blur, JPEG, occlusion, glare)
  -> pretrained backbone (MobileNetV3 / EfficientNet-Lite; compare DINOv2-small)
  -> fine-tune head, then last blocks
  -> evaluate (top-1/3, per-class recall, confusion, ECE, phone-photo set)
  -> temperature scaling + reject threshold
  -> export ONNX -> quantize -> parity test vs browser preprocessing
  -> build model_pack with manifest and attributions
```

## 8. Deployment architecture

```
GitHub repo --(push)--> CI (build + tests + Lighthouse)
     |
     +--> Static host (Cloudflare Pages / Netlify / GitHub Pages), HTTPS
     |
Model files: in the repo's release assets or a Hugging Face repo,
             fetched once and cached by the service worker
```

| Concern | Choice |
|---|---|
| Hosting | Static hosting, free tier, custom domain optional |
| HTTPS | Required for camera access; provided by the host |
| Caching | App shell and model cached with versioned names; new pack triggers an update prompt |
| CI | Lint, unit tests (advice engine, preprocessing parity), build, deploy preview |
| Headers | CSP limiting connections to self + weather API; cross-origin isolation only if WASM threads are needed |

## 9. Key decisions

| Decision | Choice | Reason |
|---|---|---|
| Where the photo is processed | In the browser | Privacy; no server cost; works offline |
| Model type | Small CNN fine-tuned from an open pretrained backbone | Fast, small, easy to export |
| Verdict logic | Deterministic rules, not an LLM | Explainable, testable, safe; LLM may only rephrase |
| Weather source | Open-Meteo | Open, no API key, includes hourly convective and UV data |
| Storage | IndexedDB / sqlite-wasm | Offline, private, exportable |
| Backend | None in v1 | Zero running cost and a strong privacy story |
| Delivery | PWA | One codebase for PC demo and phone field use |

## 10. Privacy boundaries

- Photos never leave the browser; only a small thumbnail is stored, and only if the user opts in.
- Location is rounded before any use and can be replaced with a manually typed place.
- No analytics or third-party scripts; external connections limited to the host, model files and the weather API.
- All data can be exported or deleted from Settings.

## 11. Failure handling

| Failure | Behavior |
|---|---|
| Camera denied or missing | Upload and sample-sky options |
| Model fails to load | Retry, then offer the atlas and manual conditions chooser |
| Not a sky photo / low confidence | "Unsure" state with tips; verdict still based on weather |
| Weather API down or offline | Use cached snapshot with its age; else manual "how does it feel" input |
| WebGPU unavailable | Automatic WASM fallback |
| Storage quota exceeded | Drop thumbnails, keep metadata, tell the user |
| Photo vs weather disagree | Show the conflict; weather drives the verdict |

## 12. Extension points

- Swap the model by shipping a new pack that follows the same manifest contract.
- Add classes (contrail, haze) by extending `cloud_class` and the pack labels.
- Add sky-coverage estimation with a segmentation model as a second pack.
- Add optional self-hosted sync without changing the local-first core.
- Add an LLM phrasing layer that rewrites the explanation text but never changes the verdict.
