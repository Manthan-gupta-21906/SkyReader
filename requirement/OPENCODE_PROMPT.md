# OpenCode Prompt: Build SkyReader

You are a senior full-stack engineer building **SkyReader**, a static, installable web app (PWA) that classifies a sky photo into a cloud type in the browser and combines it with live weather to give a "should I go out?" verdict. Work autonomously, but follow the process, rules and stop points below exactly.

---

## 0. Step zero: read everything first (no code yet)

1. List the folder `requirement/` at the repo root and **read every file in it completely**. Expected contents (names may differ slightly):
   - Product Requirements Document (PRD)
   - Technical Requirements Document (TRD)
   - UI/UX Design Document
   - Backend / Data Schema
   - `architecture.md`
   - `phases.md`
2. If any expected document is missing, unreadable, or empty, **stop and tell me which one** before doing anything else.
3. Produce a short **Understanding Report** in the chat (not committed) containing:
   - One-paragraph product summary in your own words.
   - The final stack you will use (see section 2; call out any place where the docs offer a choice and which you picked).
   - A list of **ambiguities or contradictions** between the documents, with the default you will use for each.
   - The phase list from `phases.md` and which phases you will do now (see section 6).
4. Wait for my reply of "go" only if you found a **blocking** contradiction. Otherwise continue with your stated defaults.

The documents in `requirement/` are the source of truth. If this prompt and the documents disagree, the documents win, except for the git rules in section 5, which always win.

---

## 1. What you are building

- A website that runs fully in the browser and is deployable as static files.
- Flow: user takes or uploads a sky photo -> in-browser ONNX classifier returns top-3 cloud classes (10 WMO genera + clear sky = 11 classes) with calibrated confidence and an "unsure / not a sky" reject path -> app fetches live weather for a coarse (rounded) location from Open-Meteo -> a **deterministic rule-based advice engine** combines cloud signal and weather into a score and a verdict (Go / Go with care / Wait / Stay in) with reasons and a suggestion -> user can save to a local Sky Log, later see an **outcome check** (did the tip hold up?), browse a Cloud Atlas, and export or delete their data.
- Privacy rules: photos never leave the browser; only rounded coordinates go to the weather API; no analytics or third-party trackers.
- It must work on a phone (installable, offline for everything except fresh weather) and on a desktop (for demos), with a **demo mode** using bundled sample skies.
- It is **not** an official forecast. This disclaimer must appear on the Result screen. A thunderstorm signal must never produce a plain "Go".

---

## 2. Stack (use unless the docs clearly say otherwise)

| Concern | Use |
|---|---|
| Language | TypeScript (strict mode) |
| Framework / build | React 18 + Vite |
| Styling | Tailwind CSS; design tokens as CSS variables (light, dark, auto) |
| State | Zustand |
| Routing | React Router (tabs: Sky, Log, Atlas, Settings) |
| ML inference | `onnxruntime-web` inside a Web Worker; WebGPU if available, WASM fallback |
| Storage | IndexedDB via Dexie, mirroring the tables in the schema doc (cloud_class, model_pack, observation, prediction, weather_snapshot, advice, outcome_check, setting, weather cache) |
| PWA | `vite-plugin-pwa` (Workbox): app shell, model and atlas assets cached with versioned names, update prompt |
| Weather | Open-Meteo forecast API (no key) |
| Tests | Vitest + Testing Library; Playwright for one smoke test of the main flow |
| Lint / format | ESLint + Prettier + `tsc --noEmit` |
| Git hooks | Husky + lint-staged + commitlint (Conventional Commits) |
| CI/CD | GitHub Actions: lint, typecheck, test, build; deploy to GitHub Pages (make the base path configurable so Cloudflare Pages or Netlify also work) |
| Python (ml/) | PyTorch, timm, torchvision, onnx, onnxruntime, scikit-learn |

**Verify, do not guess:** before writing the weather client and the ONNX Runtime Web setup, read the current official documentation (Open-Meteo API docs and onnxruntime-web docs) for exact parameter names, response shapes, and how to host WASM files. Pin dependency versions in `package.json` and commit the lockfile.

---

## 3. Repository layout

```
skyreader/
  requirement/            # the six source documents (do not edit them)
  web/
    src/
      ui/                 # screens, components, theme
      state/              # zustand stores
      domain/             # types and use cases
      ml/                 # preprocess, worker, classifier, calibration, mock classifier
      advice/             # rules, config, text templates, tests
      weather/            # client, cache, mapping
      data/               # dexie db, repositories, migrations, export
      atlas/              # cloud content (json) and credited reference images
    public/
      models/             # manifest.json (+ model.onnx when available)
      samples/            # bundled sample skies for demo mode
      icons/
    index.html
    vite.config.ts
  ml/
    README.md
    notebooks/            # data prep, training, evaluation (skeletons)
    scripts/              # download (license-checked), clean, split, train, export, parity test
    packs/                # built model packs (git-ignored except manifest examples)
  docs/                   # decisions, deployment notes
  .github/workflows/
  AGENTS.md
  LICENSES.md
  README.md
  .gitignore
```

Create `AGENTS.md` at the repo root early. It must summarize: the product in five lines, the stack, the folder layout, how to run lint/test/build, the commit and branch rules from section 5, and the rule "read `requirement/` before large changes". Keep it under 100 lines so future sessions stay consistent.

---

## 4. Implementation requirements

### 4.1 ML (browser side)
- Preprocessing in the browser must follow `preprocess` in the model pack `manifest.json` (resize short side, center crop 224, mean/std normalization). Make it a pure function with a golden-image test.
- Classifier loads `model.onnx` in a Web Worker, reuses the session, applies **temperature scaling** and the **reject threshold** from the manifest, returns top-3 with calibrated probabilities.
- **Mock mode:** real model weights will not exist at first. Implement a `MockClassifier` selected with `VITE_MOCK_MODEL=true` (default in dev when `model.onnx` is missing) that returns plausible deterministic results for the bundled sample skies (filename-keyed). Mock results must be clearly labelled "Demo model" in the UI. **Never fabricate accuracy numbers or claim a real model exists when it does not.**
- Show a first-load progress bar while the model downloads; cache it via the service worker.

### 4.2 ML (training side, `ml/`)
- Scaffold, do not pretend to run: a training script (frozen pretrained backbone -> head -> optional unfreeze), augmentation, evaluation (top-1/top-3, per-class recall, confusion matrix, ECE), temperature scaling, reject-threshold tuning, ONNX export with int8/fp16 quantization, parity check against onnxruntime, and a pack builder that writes `manifest.json` per the schema doc.
- Dataset download scripts must **record license and source per dataset** and refuse to proceed without an explicit `--accept-license` flag. Do not download datasets automatically. Do not commit datasets or model weights over 5 MB.

### 4.3 Weather
- Weather client: round coordinates to about 0.1 degree before any request; manual city entry supported; request the next 6+ hours of precipitation probability, precipitation, wind speed and gusts, temperature, apparent temperature, UV index, CAPE, weather code, cloud cover, visibility, and daily sunrise/sunset; cache by rounded location and hour with an `expires_at` (default 60 minutes); show the cache age when offline; typed errors and retry with backoff.
- Provide a recent-hours query for the **outcome check**.

### 4.4 Advice engine (pure functions, 100% unit-tested)
- Follow the cloud-signal table, score, verdict bands and hard rules in the TRD. Put every threshold in one config file (`advice/config.ts`) with these defaults, which tests must lock in:
  - Precipitation probability (next 3 h): penalty = round(0.4 x probability), max 40.
  - Wind gusts (km/h): below 30 = 0; 30-44 = -10; 45-59 = -20; 60 and above = -30.
  - Convective energy (CAPE, J/kg): below 500 = 0; 500-999 = -25; 1000-1999 = -35; 2000 and above = -45. Thunder weather codes = -45.
  - UV index: 6-7 = -10; 8 and above = -15.
  - Apparent temperature (C): below 0 or above 40 = -25; below 5 or above 35 = -15; below 10 or above 32 = -10.
  - Daylight left under 1 hour: -10.
  - Cloud signal penalties: Cumulonimbus -30, Nimbostratus -25, Altostratus -15, Stratus -10, Cirrostratus -10, Cirrus -5, Altocumulus -5, others 0 (scale the cloud penalty by the class probability when the model is unsure).
  - Verdict bands: 75-100 Go, 50-74 Go with care, 25-49 Wait, 0-24 Stay in.
  - Hard rule: a storm signal (Cumulonimbus probability above 0.4, or thunder code, or CAPE of 1000 and above with a rising precipitation chance) caps the verdict at Wait.
  - If the photo and the weather data disagree, show the conflict; the weather data wins.
- Output: score, verdict, `hard_rule_hit`, reasons (factor, penalty, plain text), suggestion, `engine_version`.
- Text comes from templates. An LLM wording layer is **out of scope** for now; leave a clean interface for it.
- Write table-driven tests for every rule, every verdict band, the storm cap, and the disagreement case.

### 4.5 UI/UX
- Implement every screen, state and edge case in the UI/UX document: Home/Capture (camera, upload, sample sky, crop), Result (verdict card first, cloud card, what it usually means, 6-hour strip, reasons, actions, disclaimer), Sky Log and Observation detail (with outcome badge), Cloud Atlas (10 genera, how to spot, typical weather, altitude diagram, credited images), Settings (location mode, units, theme, export, delete all, model info and licenses), onboarding (3 skippable screens).
- Accessibility: verdict conveyed by word, icon and color; labels for all controls; keyboard navigation; 44 px targets; reduced-motion support.
- Responsive: bottom tab bar on mobile, side rail or top bar and a two-column Result on desktop.

### 4.6 Data
- Dexie schema equals the schema doc (table and field names preserved), with versioned migrations. Photos are not stored by default; store a small thumbnail only if the user opts in. Implement save, list, correct-label, delete (cascade), CSV and JSON export, and "delete all data".
- Outcome check: on app open, find observations older than 3 hours without an outcome, query recent-hours weather, set `held_up`, `missed` or `inconclusive`, and expose the tip-accuracy summary.

### 4.7 Non-functional
- Targets: first load under 25 MB including the model, photo-to-verdict under 3 s, no console errors, Lighthouse PWA installable.
- Strict CSP in the deployed headers or meta where possible: connections only to self and the weather API.
- No secrets in the repo. No analytics.

---

## 5. Git and GitHub rules (these always apply)

**Setup**
1. Ensure `git` is initialized with default branch `main`. Add a thorough `.gitignore` first (node_modules, dist, .env*, Python caches, `ml/data/`, `ml/packs/*.zip`, large model files, OS and editor files).
2. If the GitHub CLI is installed and authenticated (`gh auth status`), create the remote: `gh repo create skyreader --private --source=. --remote=origin`. Otherwise **ask me for the remote URL** and wait. Never print, store or commit tokens.
3. Keep `requirement/` committed so the repo is self-explanatory.

**Commits**
- **Conventional Commits** only: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `perf:`, `build:`, `ci:`, `chore:` with an optional scope, for example `feat(advice): add storm hard-rule cap`.
- Subject line in the imperative mood, 72 characters or fewer, no trailing period. Add a body when the "why" is not obvious.
- **One logical change per commit.** Each commit must build, pass lint and typecheck, and pass the tests that exist at that point. Tests for a feature go in the same commit as the feature (or the commit just before it).
- No "wip", "fix typo", "update", or "misc" commits. If you need to correct a previous commit on a local branch, use `git commit --fixup <sha>` and `git rebase -i --autosquash` before pushing.
- Never commit generated build output, `node_modules`, datasets, large binaries, or secrets.

**Branching and pushing**
- `main` is always deployable. Work on short-lived branches named `feat/<topic>`, `fix/<topic>`, `docs/<topic>`, `chore/<topic>`.
- Rebase on `main` before merging to keep history **linear**; merge with fast-forward or squash (squash message must follow Conventional Commits).
- Push each completed phase. **Never force-push `main`.** Force-push only your own feature branch, and only with `--force-with-lease`.
- Tag milestones: `v0.1.0` after Phase 5, `v0.2.0` after Phase 7, `v1.0.0` after Phase 8.
- Add a pull request template and a CI workflow early (Phase 0), so every later push is checked.

**Suggested commit sequence (adapt as needed)**
```
chore: initialize repository with gitignore and license placeholders
docs: add project requirements and build prompt
chore(web): scaffold vite react typescript app
chore: add eslint, prettier, husky, lint-staged and commitlint
ci: add lint, typecheck, test and build workflow
ci: add github pages deployment workflow
docs: add AGENTS.md and README
feat(ui): add design tokens, theme and app shell with tab navigation
feat(data): add dexie schema, seed data and repositories
test(data): cover repositories and export
feat(ml): add preprocessing with golden-image test
feat(ml): add onnx worker, calibration and reject logic
feat(ml): add mock classifier and sample skies
feat(weather): add open-meteo client with cache
feat(advice): add rule engine config and scoring
test(advice): add table-driven rule tests
feat(ui): add capture, crop and upload flow
feat(ui): add result screen with verdict, cloud card and weather strip
feat(log): add sky log, detail view and outcome check
feat(atlas): add cloud atlas content and pages
feat(pwa): add service worker, offline handling and update prompt
feat(settings): add location, units, export and delete-all
chore(ml): scaffold training, export and pack scripts
docs: add deployment and model-pack guides
```

---

## 6. Process and stop points

Work through the phases in `phases.md`. For **this run, do Phases 0 through 8** (everything buildable without a trained model and without field data). Phases 9 (field test) and 10 (write-up) are mine.

After each phase:
1. Run lint, typecheck, tests and build; fix failures.
2. Confirm the phase's **exit check** from `phases.md`.
3. Commit following section 5 and push.
4. Print a 3-5 line status: what was done, what was verified, what is next. Then continue to the next phase without waiting, unless blocked.

**Stop and ask me** if: a document is missing, the remote URL is needed, a dependency needs a paid service or key, a license is unclear, or a decision would contradict the documents.

**Do not:** invent datasets or accuracy results, add a backend server, add analytics, store full-size photos, edit files in `requirement/`, or make the verdict depend on an LLM.

---

## 7. Definition of done for this run

- `npm run dev` works with the mock model and sample skies; `npm run build` succeeds; lint, typecheck and tests pass in CI.
- The full flow works end to end in demo mode: sample or uploaded photo -> top-3 -> weather -> verdict with reasons -> save -> log -> outcome check -> export/delete.
- Dropping a real `model.onnx` plus `manifest.json` into `web/public/models/` switches the app to the real classifier with no code changes (document this in `docs/model-pack.md`).
- The site deploys to GitHub Pages from `main` and is installable as a PWA.
- `README.md` explains what the project is, how to run it, how to swap the model, the privacy approach, licenses and attributions, and the "not an official forecast" disclaimer.
- The git history is linear, uses Conventional Commits, and every commit builds.

Begin with Step zero now.
