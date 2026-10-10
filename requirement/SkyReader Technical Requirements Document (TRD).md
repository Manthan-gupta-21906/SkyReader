# SkyReader: Technical Requirements Document (TRD)

*Companion to the SkyReader PRD. Covers the ML pipeline, in-browser inference, the weather and advice engine, performance, privacy and testing.*

## 1. Architecture

```
Photo (camera or upload)
  -> Resize/center-crop 224x224, normalize (in browser)
  -> Sky check (reject non-sky / unsure)
  -> Classifier (fine-tuned MobileNetV3 / EfficientNet-Lite, ONNX)
  -> Top-3 cloud classes + confidence

Coarse location (rounded to ~0.1 degree) -> Open-Meteo forecast (cached)

Cloud signal + weather snapshot
  -> Advice engine (rules)
  -> Verdict + reasons + plain-language explanation
  -> IndexedDB log -> later outcome check
```

The photo never leaves the browser. Only a rounded latitude and longitude are sent to the weather API.

## 2. Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Frontend | Vite + React (or Svelte) + Tailwind | Builds to static files |
| Inference | `onnxruntime-web` (WASM; WebGPU if available) | Runs the quantized model locally |
| Camera | `getUserMedia` + file input fallback | HTTPS required |
| Storage | IndexedDB (or `sqlite-wasm`) | See the Backend Schema doc |
| Offline | Service worker + Cache API (PWA) | Caches app shell, model, last forecast |
| Weather | Open-Meteo forecast API | No API key; check its terms for your use |
| Advice | Deterministic rule engine in TypeScript | Testable; optional LLM wording only |
| Optional LLM | `transformers.js` or WebLLM, small model | P2; rules are always the source of truth |
| Hosting | Cloudflare Pages, Netlify, or GitHub Pages | Static, free, HTTPS |
| Training | Python, PyTorch, timm, torchvision | Notebook on Colab or local |

## 3. Classes

11 classes: the 10 WMO cloud genera plus clear sky.

Cirrus, Cirrocumulus, Cirrostratus, Altocumulus, Altostratus, Nimbostratus, Stratocumulus, Stratus, Cumulus, Cumulonimbus, Clear sky.

Optional extras to consider: contrail, haze/smoke.

## 4. ML pipeline

1. **Data:** public ground-based sky/cloud datasets (for example CCSN, and others; verify availability and license for each) plus your own phone photos, labeled with the atlas as reference.
2. **Clean and split:** remove duplicates and near-duplicates, split by source and by day/location where possible (not random image) to avoid leakage. Hold out a separate test set of your own phone photos.
3. **Augment:** random crop and scale, flip, color jitter, brightness and contrast, blur, JPEG compression, partial occlusion (trees, buildings), sun glare.
4. **Model:** start from a pretrained ImageNet backbone (MobileNetV3-Small/Large or EfficientNet-Lite0). Train the head first, then unfreeze the last blocks at a lower learning rate. Compare a small ViT (such as DINOv2-small features plus a linear head) as an alternative.
5. **Loss and imbalance:** cross-entropy with label smoothing, class weights or capped samples per class.
6. **Evaluate:** top-1/top-3, per-class recall, confusion matrix, calibration (ECE), and accuracy on the phone-photo test set.
7. **Reject option:** train with a "not sky" set (rooms, streets, faces, grass) or use a max-softmax/energy threshold; tune the threshold on validation data.
8. **Calibration:** temperature scaling on validation logits so confidence means something.
9. **Export:** ONNX, dynamic quantization (int8) or fp16, verify output parity with the float model.
10. **Pack:** `model_pack_vN` = `model.onnx` + `labels.json` + `preprocess.json` (size, mean, std, threshold, temperature) + license and attribution file.

## 5. Advice engine

### Inputs

Cloud top-3 with calibrated probabilities, plus from Open-Meteo for the next 6 hours: precipitation probability, precipitation amount, wind speed and gusts, temperature and apparent temperature, UV index, weather code, CAPE (convective energy), cloud cover, visibility, and sunrise/sunset.

### Cloud signals (heuristics, shown to the user as "usually means")

| Cloud | Usual meaning | Signal |
| --- | --- | --- |
| Cumulonimbus | Thunderstorm or heavy shower risk | Strong storm signal |
| Nimbostratus | Steady rain or snow, low visibility | Rain now or soon |
| Altostratus | Thickening veil; rain often within hours | Rain building |
| Cirrostratus | Halo risk; front possibly 12-24 h away | Change coming |
| Cirrus | Fair now; change possible later | Mild change signal |
| Altocumulus | Morning altocumulus in humid air can precede afternoon storms | Watch convection |
| Stratus | Low, gray, drizzle or mist | Low visibility |
| Stratocumulus | Mostly dry, overcast | Neutral |
| Cumulus | Fair weather; may grow later in the day | Neutral, check CAPE |
| Cirrocumulus | Fair, often cold | Neutral |
| Clear sky | No cloud signal | Weather data decides |

### Score

Start at 100 and subtract penalties, then clamp to 0-100.

| Factor | Penalty rule (tunable) |
| --- | --- |
| Precipitation probability (next 3 h) | up to -40 |
| Wind gusts | -10 to -30 above thresholds |
| Convective energy (CAPE) or thunder code | -25 to -45 |
| UV index | -5 to -15 when high and no shade |
| Temperature extremes (apparent) | -10 to -25 |
| Daylight left less than 1 h | -10 |
| Cloud signal (cumulonimbus, nimbostratus, thickening altostratus) | -10 to -30 |

### Verdict

| Score | Verdict |
| --- | --- |
| 75-100 | Go |
| 50-74 | Go with care |
| 25-49 | Wait |
| 0-24 | Stay in |

**Hard rules:** a thunderstorm signal (cumulonimbus or thunder weather code) caps the verdict at "Wait" regardless of score. Contradiction between the photo and the data (clear sky but a high rain chance) is shown explicitly, and the data wins for the verdict.

### Explanation

Template text assembled from the cloud, the top two reasons, and a suggestion (what to carry, when to be back). An LLM may rephrase this text but must not change the verdict or add facts.

## 6. Performance requirements

| Requirement | Target |
| --- | --- |
| Model size (quantized) | < 15 MB |
| First load total | < 25 MB |
| Inference latency | < 500 ms desktop, < 1.5 s mid-range phone |
| Photo to verdict (weather cached) | < 3 s |
| Offline | Classification, atlas and log work; weather falls back to the cache |
| Lighthouse PWA/performance | Pass the installable PWA checks |

## 7. Privacy and security

- Photos are processed in memory and stored only as small thumbnails in IndexedDB, if the user opts in.
- Location is optional and rounded (about 0.1 degree) before any request; manual city entry is supported.
- No analytics or third-party trackers; the only external calls are the weather API and model downloads.
- Content security policy limits connections to the hosting origin and the weather API.
- One-tap "delete all data" and CSV export.

## 8. Testing

- **Preprocessing parity:** the browser's resize/normalize output must match Python (golden images).
- **Model:** held-out sources, a phone-photo test set, robustness sweep (blur, brightness, JPEG, partial occlusion).
- **Advice engine:** unit tests with table-driven cases (cloud + weather -> verdict), including every hard rule.
- **Offline:** airplane-mode test of classification, log and cached forecast.
- **Browsers:** Chrome, Firefox, Safari (desktop and mobile), plus one low-end Android.
- **Field:** photograph the sky at least once daily for a week or more, log verdict and actual outcome.

## 9. Licensing checklist

- Dataset licenses and attributions recorded in `LICENSES.md` and shipped in the model pack.
- Model backbone license verified (MobileNet/EfficientNet weights and DINOv2 have different terms).
- Open-Meteo terms and attribution requirements followed.
- App code under MIT or Apache 2.0.

## 10. Technical risks

| Risk | Mitigation |
| --- | --- |
| Browser preprocessing differs from training | Golden-image parity tests |
| Model too confident on bad photos | Temperature scaling, reject threshold |
| Quantization hurts accuracy | Compare fp32, fp16, int8 on the test sets |
| Safari/WebGPU gaps | WASM fallback is the baseline path |
| Weather API rate limits or downtime | Cache, retry with backoff, manual conditions input |
