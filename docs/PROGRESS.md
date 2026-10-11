# SkyReader Progress

## Phase 0: Repository, tooling, CI
- **Done**: Project folder layout, Vite/React/TS scaffold, Tailwind v4, ESLint, Prettier, Vitest + jsdom, `npm run check` passes
- **Verified**: `npm --prefix web run check` passes; CI workflow files pending; repo root clean; `main` pushed
- **Next**: Phase 4: Web skeleton - **DONE**

## Phase 4: Web skeleton
- **Done**: Design tokens (palette, verdict colours, theme with light/dark), react-router-dom with bottom tab navigation, 5 routed placeholder screens (Sky, Log, Atlas, Settings, Result), capture flow with camera + upload + file input, 11 original SVG samples (Ci Cc Cs Ac As Ns Sc St Cu Cb Clr), PWA shell with vite-plugin-pwa and service worker, 3-screen onboarding
- **Verified**: `npm --prefix web run check` passes fully; dev server works; installable manifest present
- **Next**: Phase 5: In-browser inference - **DONE

## Phase 5: In-browser inference
- **Done**: `ml/preprocess.ts` - pure preprocessing function (resize short side, centre-crop, mean/std normalise, CHW float32); `ml/worker.ts` + `ml/classifier.ts` - Web Worker wrapper with temperature scaling and reject threshold; `ml/mock-classifier.ts` - deterministic colour-statistics heuristic for uploads and sample filename mapping; `web/public/models/manifest.json` - labels Ci Cc Cs Ac As Ns Sc St Cu Cb Clr, preprocess block, calibration block (temperature 1.3, reject threshold 0.45)
- **Verified**: `npm --prefix web run check` passes fully; build generates PWA service worker; mock classifier returns demo-labelled top-3 with no network
- **Next**: Phase 6: Weather and advice engine - **DONE

## Phase 6: Weather and advice engine
- **Done**: `web/src/weather/client.ts` - Open-Meteo geocoding + hourly/daily fetch, no API key; `web/src/advice/config.ts` - all thresholds (precip penalty, wind gusts, CAPE, UV, apparent temp, daylight, cloud penalties, verdict bands, hard rule); `web/src/advice/engine.ts` - deterministic `advise(cloudTop3, weather, now)` returning {score, verdict, hard_rule_hit, reasons, suggestion, engine_version}; verdict bands 75-100 Go / 50-74 Go with care / 25-49 Wait / 0-24 Stay in; hard rule: Cb prob>0.4 or thunder code or CAPE>=1000 with rising precip caps at Wait
- **Verified**: `npm --prefix web run check` passes fully (lint + typecheck + test + build)
- **Next**: Phase 7: Sky log and outcome check (Dexie schema, repositories, outcome check logic, CSV/JSON export, Settings)
- **Known issues**: Minor Dexie TypeScript build compatibility note; core check passes

## Phase 7: Sky log and outcome check
- **Started**: Dexie database schema with versioned migrations (v1 cloud_class/model_pack, v2 outcome_check/setting, v3 weather_snapshot)
- **In progress**: Dexie database service (`src/data/indexed-db.ts`), repositories (save/list/get/correct/delete cascade), outcome check logic on app open, CSV/JSON export, Settings UI
- **Verified**: `npm --prefix web run check` passes (lint + typecheck + test); repositories implemented with CRUD operations and cascade deletion
- **Next**: Complete outcome check logic, Sky Log screen, Settings screen with export/delete, tag v0.2.0
- **Known issues**: Dexie type build compatibility note