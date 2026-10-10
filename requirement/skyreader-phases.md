# SkyReader: Build Phases

Step-by-step plan from idea to a deployed, field-tested website. Each phase ends with something that runs and an exit check, so you never carry a half-working system forward. Timing assumes about two weekends of building plus a week of field testing; stretch it if needed.

## Overview

| Phase | Focus | Output |
|---|---|---|
| 0 | Setup and scope | Repo, class list, decisions locked, empty site deployed |
| 1 | Data | Clean, split cloud dataset + own phone photos |
| 2 | Baseline | First classifier and numbers |
| 3 | Fine-tune and export | Calibrated ONNX model pack |
| 4 | Web skeleton | Camera/upload, layout, routing, PWA shell |
| 5 | In-browser inference | Photo to cloud type, offline |
| 6 | Weather and advice engine | Verdict with reasons |
| 7 | Sky log and outcome check | Saved observations, tip accuracy |
| 8 | Atlas, polish, offline | Cloud atlas, accessibility, installable PWA |
| 9 | Field test | Real skies, honest accuracy report |
| 10 | Write-up | Challenge post with live link and results |

---

## Phase 0: Setup and scope

**Tasks**
- Create the repo with `web/`, `ml/`, `docs/` folders.
- Lock the class list (10 genera + clear sky) and decide whether to add contrail or haze.
- Choose the frontend (React or Svelte) and the host (Cloudflare Pages, Netlify or GitHub Pages).
- Deploy an empty "Hello SkyReader" page over HTTPS on day one.
- Start `LICENSES.md` and record every dataset, model and API you plan to use.

**Exit check:** a public URL is live; class list and stack decisions are written in `docs/`.

---

## Phase 1: Data

**Tasks**
- Collect public ground-based cloud/sky datasets and check each license and label scheme.
- Map every dataset's labels to your 11 classes; drop or merge anything ambiguous.
- Remove duplicates and near-duplicates; check a sample of labels by eye against the atlas.
- Split by source and location (not random image) into train/val/test.
- Photograph your own skies (different times, weather, angles) for a phone-photo test set, and gather a "not sky" set (rooms, streets, trees, faces).

**Exit check:** `dataset/` with metadata CSV, split files, per-class counts, and a separate phone-photo test set.

---

## Phase 2: Baseline

**Tasks**
- Train a quick baseline: frozen pretrained backbone + linear head.
- Compute top-1, top-3, per-class recall and the confusion matrix.
- Test on the phone-photo set and note the gap versus the clean test set.
- Try two backbones (for example MobileNetV3 and a small ViT feature extractor).

**Exit check:** a results table comparing backbones; pick one to carry forward.

---

## Phase 3: Fine-tune and export

**Tasks**
- Fine-tune the chosen model: head first, then unfreeze the last blocks at a lower learning rate.
- Add augmentation (crop, jitter, blur, JPEG, occlusion, glare).
- Add temperature scaling and tune the reject threshold with the "not sky" set.
- Export to ONNX, quantize (compare fp32, fp16, int8), and verify output parity.
- Build the model pack: `model.onnx`, `manifest.json`, labels, attributions.

**Exit check:** model under 15 MB, top-1 target met on the clean test set, phone-photo numbers recorded, pack verifies.

---

## Phase 4: Web skeleton

**Tasks**
- Set up routing and the tab layout (Sky, Log, Atlas, Settings), responsive for phone and desktop.
- Implement camera capture, upload and a simple crop step.
- Add theme (light, dark, auto) and the base design tokens.
- Add the web app manifest and a minimal service worker.
- Add "Try a sample sky" using bundled example photos so the demo works anywhere.

**Exit check:** the deployed site opens the camera on a phone, accepts uploads on desktop, and installs to the home screen.

---

## Phase 5: In-browser inference

**Tasks**
- Port preprocessing to the browser and verify against Python golden images.
- Load `onnxruntime-web` in a Web Worker; prefer WebGPU when available, fall back to WASM.
- Apply calibration and the reject threshold; return top-3.
- Cache the model with the service worker and show first-load progress.
- Measure latency on a desktop and a mid-range phone.

**Exit check:** in airplane mode, a sample photo gives the correct top-3 within the latency budget.

---

## Phase 6: Weather and advice engine

**Tasks**
- Build the weather client for Open-Meteo: rounded coordinates, 6-hour window, error handling, caching.
- Implement the advice engine: cloud signals, penalty factors, score, verdict bands and hard rules (thunderstorm cap).
- Write table-driven unit tests covering every rule and edge case.
- Build the Result screen: verdict card, cloud card, 6-hour strip, reasons, suggestion, "not an official forecast" note.
- Handle the photo/weather disagreement and offline cache states.

**Exit check:** photo to verdict end to end; tests pass; a thunderstorm scenario never returns a plain "Go".

---

## Phase 7: Sky log and outcome check

**Tasks**
- Implement the local database (IndexedDB or sqlite-wasm) using the schema doc.
- Save observations with predictions, weather snapshot and advice; optional thumbnail.
- Build the Sky Log list and detail screens, with user correction of the cloud label.
- Implement the outcome check (3 hours later, using recent-hours weather) and the tip-accuracy summary.
- Add CSV and JSON export and "delete all data".

**Exit check:** a week of observations can be logged, reviewed, corrected and exported, and outcomes appear automatically.

---

## Phase 8: Atlas, polish and offline

**Tasks**
- Write the Cloud Atlas: how to spot each genus, what it means, an altitude diagram, credited reference photos.
- Run an accessibility pass: screen-reader labels, keyboard navigation, contrast, reduced motion.
- Finish the PWA: offline page, update prompt for new model packs, correct cache versioning.
- Run Lighthouse and fix the main performance and PWA findings.
- Add the optional small-LLM wording layer only if time allows; rules stay the source of truth.

**Exit check:** installable, fully usable offline except for fresh weather, accessibility checks pass.

---

## Phase 9: Field test

**Tasks**
- Photograph the sky at least once a day for 7-14 days across mornings, afternoons and evenings, and in different weather.
- Record for each: the app's cloud call, your own label, the verdict, and what actually happened.
- Compare accuracy on your phone photos with the clean test set and explain the gap.
- Compute the verdict hit rate from the outcome checks.
- Fix the top one or two problems (for example a threshold, a confused pair of classes, or too-harsh penalties) and retest.

**Exit check:** a filled field log, a hit-rate figure, and a short list of lessons learned.

---

## Phase 10: Write-up

**Tasks**
- Explain why open mattered: the model runs in the browser with no photo upload, open datasets and an open weather API, a swappable fine-tuned model, and zero running cost.
- Include the results table (baseline vs fine-tuned vs phone photos vs verdict hit rate).
- Add screenshots, a short demo clip, and photos of the skies you tested under.
- Publish the repo with licenses and attributions, and link the live site.

**Exit check:** challenge post submitted with honest numbers, the live link, and evidence of using it outdoors.

---

## Cut list if time runs short

Drop in this order: LLM wording layer, sqlite-wasm (use plain IndexedDB), cloud atlas reference photos, desktop two-column layout, CSV export. Never cut: in-browser classification, the advice engine with its unit tests, the outcome check, and the field test.

## Risks to watch each phase

| Phase | Risk | Quick mitigation |
|---|---|---|
| 1 | Datasets are clean and small; label schemes differ | Merge or drop ambiguous classes; add own photos |
| 3 | Overfitting; overconfident predictions | Augmentation, early stopping, temperature scaling |
| 5 | Browser preprocessing differs from training | Golden-image parity tests |
| 6 | Users over-trust the verdict | Clear "not official" label; storm cap; show reasons |
| 7 | Outcome checks are noisy for short windows | Mark ambiguous cases "inconclusive"; report that honestly |
| 9 | Field accuracy far below test accuracy | Add phone-style training images and retrain the head |
