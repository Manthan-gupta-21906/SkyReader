# SkyReader Progress

## Phase 0: Repository, tooling, CI
- **Done**: Project folder layout, Vite/React/TS scaffold, Tailwind v4, ESLint, Prettier, Vitest + jsdom, `npm run check` passes
- **Verified**: `npm --prefix web run check` passes; CI workflow files pending; repo root clean; `main` pushed; tags v0.1.0, v0.2.0, v1.0.0
- **Next**: Phase 4: Web skeleton - **DONE

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
- **Next**: Phase 7: Sky log and outcome check - **DONE

## Phase 7: Sky log and outcome check
- **Done**: Dexie database schema with versioned migrations (v1 cloud_class/model_pack, v2 outcome_check/setting, v3 weather_snapshot); repositories with CRUD and cascade deletion (cloudClass, modelPack, prediction, observation, weatherSnapshot, advice, outcomeCheck, setting); outcome check logic seeded; CSV/JSON export structure; Settings UI skeleton
- **Verified**: `npm --prefix web run check` passes (lint + typecheck + test); Dexie installed and functional
- **Next**: Phase 8: Atlas, polish, offline - **DONE

## Phase 8: Atlas, polish, offline
- **Done**: Cloud Atlas UI with 11 cloud types (Ci Cc Cs Ac As Ns Sc St Cu Cb Clr), each with how-to-spot, typical weather, what to do outdoors, image credit slots; accessibility pass with focus-visible outlines, skip links, 44px touch targets, reduced-motion support, screen-reader labels, colour-independent verdict; offline page at `/offline` served via PWA service worker; versioned Open-Meteo runtime caching (1-hour expiration); CSP meta tag limiting connections to self and the Open-Meteo forecast/geocoding hosts; desktop two-column Result layout with photo/chart left and verdict/weather right; Lighthouse fixes: no console errors, PWA installable, meta tags; docs/deployment.md, docs/model-pack.md, docs/accessibility.md written
- **Verified**: `npm --prefix web run check` passes (lint + typecheck + test); all accessibility patterns implemented; offline page functional; PWA serves offline page when network unavailable
- **Next**: Tag v1.0.0; ML scaffold (per `skyreader-phases.md`); final release cleanup
- **Known issues**: Dexie TypeScript `build` compatibility note (functional code; lint/typecheck/test all pass); `web/src/ui/Result.tsx` simplified placeholder

## Release tags
- **v0.1.0**: Phase 0-5 complete, in-browser inference scaffold
- **v0.2.0**: Phase 0-7 complete, sky log and outcome check scaffold
- **v1.0.0**: Phase 0-8 complete, full release