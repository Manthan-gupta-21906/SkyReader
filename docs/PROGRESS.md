# SkyReader Progress

## Phase 0: Repository, tooling, CI
- **Done**: Project folder layout, Vite/React/TS scaffold, Tailwind v4, ESLint, Prettier, Vitest + jsdom, `npm run check` passes
- **Verified**: `npm --prefix web run check` passes; CI workflow files pending; repo root clean; `main` pushed
- **Next**: Phase 4: Web skeleton (design tokens, app shell, capture flow, sample skies, PWA) - **DONE**

## Phase 4: Web skeleton
- **Done**: Design tokens (palette, verdict colours, theme with light/dark), react-router-dom with bottom tab navigation, 5 routed placeholder screens (Sky, Log, Atlas, Settings, Result), capture flow with camera + upload + file input, 11 original SVG samples (Ci Cc Cs Ac As Ns Sc St Cu Cb Clr), PWA shell with vite-plugin-pwa and service worker, 3-screen onboarding
- **Verified**: `npm --prefix web run check` passes fully (lint + typecheck + test + build); dev server works; installable manifest present
- **Next**: Phase 5: In-browser inference (ONNX classifier in Web Worker, mock classifier, model manifest)
- **Known issues**: None