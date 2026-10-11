# SkyReader Web Application

In-browser cloud classification and intelligent outdoor guidance progressive web application (PWA).

## Clean Architecture Structure

```
src/
├── config/             # Typed environment variables and app constants
│   ├── env.ts          # Validated environment configuration with fallback defaults
│   └── constants.ts    # App-wide constants (verdict colors, storage keys, defaults)
├── types/              # Centralized domain and API TypeScript declarations
│   ├── cloud.ts        # Cloud genera and altitude definitions
│   ├── weather.ts      # Weather and geocoding schemas
│   ├── advice.ts       # Verdicts, scoring penalties, and recommendation results
│   ├── settings.ts     # User activity profiles, AI models, and preference interfaces
│   ├── database.ts     # Dexie IndexedDB table records
│   └── api.ts          # HTTP client request options and error payloads
├── domain/             # Framework-agnostic pure business logic
│   ├── clouds/         # 10 WMO Genera classification standards
│   └── advice/         # TRD-compliant scoring heuristics and storm rules
├── services/           # Infrastructure and API client layer
│   ├── api/            # Resilient HTTP client with retry and timeout, Weather API
│   ├── storage/        # Dexie database setup and modular repositories
│   └── ml/             # Inference service abstraction with temperature calibration
├── state/              # Centralized application state management
│   ├── AppStateContext.tsx # React Context + useReducer with LocalStorage sync
│   ├── useAppState.ts  # Custom hook for state and action dispatchers
│   └── types.ts        # Action and state shape interfaces
├── hooks/              # Custom React hooks (business logic decoupled from UI)
│   ├── useSkyCapture.ts   # Camera stream, drag-and-drop, and orientation management
│   ├── useObservations.ts # Observation statistics and filtering
│   └── useWeather.ts      # Location resolution and weather querying
├── components/         # Modular reusable components
│   ├── common/         # ScoreRing, ConfidenceBar, StatusBadge, Modal, ErrorBoundary, Toast
│   ├── icons/          # Centralized typed SVG icon library
│   └── layout/         # Responsive Navbar (desktop + mobile) and SkyBackground
├── pages/              # Clean page controllers
│   ├── SkyPage.tsx     # Viewfinder and capture console
│   ├── ResultPage.tsx  # Cloud verdict and penalties breakdown
│   ├── AtlasPage.tsx   # WMO Genera catalog with altitude guides
│   ├── LogPage.tsx     # Observation history and accuracy tracker
│   ├── SettingsPage.tsx# System preferences and IndexedDB storage inspector
│   └── OnboardingPage.tsx # Walkthrough carousel
├── utils/              # Pure utilities
│   ├── errors.ts       # Custom error classes (NetworkError, ApiError, CameraError)
│   └── formatters.ts   # Relative time, temperature, and wind speed formatters
├── test/               # Comprehensive Vitest test suite
├── App.tsx             # Root layout with ErrorBoundary, Navbar, and ToastContainer
└── main.tsx            # Bootstrap entry point with HashRouter and AppStateProvider
```

## Available Scripts

- `npm run dev`: Start the Vite local development server
- `npm run build`: Typecheck and build the production bundle with PWA assets
- `npm run test`: Run the Vitest unit and component test suite
- `npm run lint`: Lint the codebase using Oxlint
- `npm run typecheck`: Run TypeScript compiler check without emitting files
- `npm run check`: Run the full verification pipeline (`lint && typecheck && test && build`)

## Environment Variables

Copy `.env.example` to `.env` to configure local variables:

- `VITE_APP_NAME`: Application title (default: `SkyReader`)
- `VITE_API_WEATHER_BASE_URL`: Open-Meteo weather forecast endpoint
- `VITE_API_GEOCODING_BASE_URL`: Open-Meteo geocoding search endpoint
- `VITE_API_TIMEOUT_MS`: Network request timeout in milliseconds (default: `8000`)
- `VITE_API_MAX_RETRIES`: Number of automatic retries on transient errors (default: `2`)
