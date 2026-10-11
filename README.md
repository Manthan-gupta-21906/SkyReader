# SkyReader

**Analyze sky photographs to identify cloud types and get intelligent outdoor go/no-go advice — entirely on your device with no photo uploads.**

## What It Does

SkyReader classifies cloud types from photos using machine learning (ONNX model or heuristic fallback) and provides weather-based verdicts and recommendations for outdoor activities. All processing happens on-device — your photos never leave your browser.

## Key Features

| Feature | Description |
|---|---|
| **Cloud Classification** | Identifies 10 WMO cloud genera + Clear sky (Ci, Cc, Cs, Ac, As, Ns, Sc, St, Cu, Cb, Clr) |
| **Verdict Engine** | Score-based system: Go (75-100), Go with Care (50-74), Wait (25-49), Stay In (0-24) |
| **Hard Rules** | Cumulonimbus or thunderstorm weather codes cap verdict at "Wait" maximum |
| **Weather Integration** | Anonymously fetches Open-Meteo weather using coarse rounded coordinates (~10 km) |
| **100% On-Device Privacy** | Photos never leave the browser; only rounded location used for weather |
| **Offline Support** | Progressive Web App with service worker; works offline with stored data |
| **Local Database** | IndexedDB via Dexie storing observations, weather, advice, outcomes, and settings |
| **Customization** | User-tunable activity preferences, model selection, scoring rubric, and UI theme |
| **Cloud Atlas** | Reference atlas with altitude diagram and detailed cloud information |

## Technology Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **ML Inference**: ONNX Runtime with int8 quantized model
- **Database**: IndexedDB via Dexie
- **PWA**: Workbox service worker, Web App Manifest
- **Image Processing**: Canvas-based resize, center-crop, ImageNet normalization
- **Weather**: Open-Meteo API with rounded coordinates

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full architectural specifications, data flows, and design patterns.

## Getting Started

1. **Clone the repository**
2. **Install dependencies**: `npm install` (in the `web/` directory)
3. **Start development**: `npm run dev`
4. **Build for production**: `npm run build`

Open [http://localhost:5173](http://localhost:5173) to view the app.

## How It Works

1. **Capture or upload** a sky photograph
2. **Image preprocessing**: Resized to 224×224px, center-cropped, normalized with ImageNet mean/std
3. **Inference**: ONNX model runs (or heuristic fallback); top-3 cloud probabilities returned
4. **Weather fetch**: Anonymized data from Open-Meteo using rounded coordinates
5. **Advice engine**: Score computed (start 100, subtract cloud + weather penalties)
6. **Verdict**: Score bands determine Go/Go with Care/Wait/Stay In; hard rules cap at "Wait" for storms
7. **Display**: Score ring, verdict card, photo, top-3 confidence bars, penalty breakdown, suggestion, and what-to-do

## Privacy

- Photos never leave your browser
- Only coarse rounded coordinates (~10 km accuracy) are sent to Open-Meteo
- No personal data or location precision is transmitted

## Offline & PWA

SkyReader works as a Progressive Web App. Add it to your home screen for an app-like experience. Service worker caches essential assets and serves the offline fallback UI when offline.

## Cloud Types Classified

| Code | Name | Typical Altitude |
|------|------|------------------|
| Ci | Cirrus | Above 6,000 m |
| Cc | Cirrocumulus | Above 5,000 m |
| Cs | Cirrus | Above 5,000 m |
| Ac | Altocumulus | 2,000–6,000 m |
| As | Altostratus | 2,000–6,000 m |
| Ns | Nimbostratus | 2,000–6,000 m |
| Sc | Stratocumulus | Below 2,000 m |
| St | Stratus | Below 2,000 m |
| Cu | Cumulus | Below 2,000 m |
| Cb | Cumulonimbus | Up to 12,000+ m |
| Clr | Clear sky | N/A |

---

*SkyReader was built as part of HackOctober week 1. All ML runs on-device for maximum privacy.*