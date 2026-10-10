# SkyReader: UI/UX Design Document

*Companion to the SkyReader PRD. Design principles, flows, screens and states for a website that gets people to look up, then put the phone away.*

## 1. Design principles

1. **Look up, then log off.** One main action (take a photo), a result in seconds, then the app gets out of the way.
2. **Answer first, explain second.** The verdict is the biggest thing on screen; reasons and details sit underneath.
3. **Teach as you go.** Every result explains the cloud in two plain sentences, so users learn to read the sky.
4. **Honest uncertainty.** Show confidence, alternatives, and an "unsure" state. Never present the verdict as an official forecast.
5. **Outdoor-readable and responsive.** High contrast, large type, big touch targets; same app works on a phone in sunlight and on a laptop for demos.

## 2. Visual language

| Element | Spec |
| --- | --- |
| Palette | Sky blue `#3B82C4`, deep dusk `#1E2A44`, cloud white `#F7F9FC`, storm slate `#5B6577`, sun amber `#F2A33A`, alert red `#D64545`, go green `#3C9A5F` |
| Verdict colors | Go: green; Go with care: amber; Wait: orange-red; Stay in: red. Always paired with an icon and text, never color alone |
| Type | Humanist sans-serif; 28 px verdict, 20 px cloud name, 16 px body, 14 px captions |
| Imagery | The user's own photo as the hero; simple line icons for weather |
| Motion | Soft fade and slide for results; no heavy animation; respect reduced-motion setting |
| Themes | Light, dark, and automatic |

## 3. Information architecture

```
Home (Capture)
 |- Result (cloud, verdict, weather, why)
 |- Save to Sky Log
Sky Log
 |- Observation detail -> Outcome check
Cloud Atlas
 |- Cloud detail (how to spot it, what it means)
Settings (location, units, privacy, data)
```

Navigation: bottom tab bar on mobile (**Sky | Log | Atlas | Settings**), left rail or top bar on desktop.

## 4. Core flow: photo to verdict

1. Open the site. Home shows a large **Take a sky photo** button and an **Upload** link.
2. A short capture tip appears the first time: "Point at the sky or horizon. Keep the sun out of the frame."
3. After the photo, a crop box lets the user trim buildings or trees (skippable).
4. A progress state ("Reading the sky...", under 2 seconds) shows the photo.
5. The result screen appears with the verdict card first.
6. The user can save to the log, see why, open the atlas entry, or retake.

## 5. Screens

### Home / Capture

- Top: location chip ("Near you, rounded") and offline indicator.
- Center: large camera button; secondary "Upload a photo" and "Try a sample sky".
- Bottom: last observation card with its verdict.

### Result

- **Verdict card (top):** icon, verdict word (Go / Go with care / Wait / Stay in), one-line summary, a score ring.
- **Cloud card:** the photo with the cloud name, confidence bar, and two alternates. If confidence is low: "Not sure. This looks like X or Y."
- **What it usually means:** two plain sentences.
- **Next 6 hours strip:** small timeline of rain chance, wind gusts, UV and temperature.
- **Why this verdict:** the top two or three reasons as short lines, and a suggestion ("Take a light jacket; be back by 5 pm").
- **Actions:** Save to log, Learn more (atlas), Retake.
- **Footer note:** "Not an official forecast."

### Sky Log

- Chronological cards: thumbnail, cloud, verdict, time, small outcome badge once checked (Tip held up / Tip missed / Pending).
- Filter by cloud type or date; export CSV.

### Observation detail

- Photo, cloud, weather snapshot at the time, verdict, and the outcome check (what actually happened over the next few hours).

### Cloud Atlas

- Grid of the 10 genera with a simple altitude diagram (high, mid, low).
- Detail page: how to spot it, typical weather, what to do outdoors, and reference photos with license credit.

### Settings

- Location mode (precise-rounded / manual city / off), units (C or F, km/h or mph), theme, clear data, export, model info and licenses.

## 6. States and edge cases

| State | Behavior |
| --- | --- |
| Camera permission denied | Explain why, show the upload option instead |
| Not a sky photo | "I can't see much sky here. Try pointing upward." with example thumbnails |
| Low confidence | Show top-3, label as uncertain, still give a verdict based on weather |
| Photo and weather disagree | Show a note ("Sky looks clear but rain chance is high"), weather wins |
| Offline, weather cached | Show cached time ("Forecast from 40 min ago") |
| Offline, no cache | Cloud result only, plus a manual "How does it feel outside?" chooser |
| Model still downloading | Progress bar on first run; sample photos work once loaded |
| Thunderstorm signal | Red banner: "Storm risk. Avoid open ground and high places." |

## 7. Accessibility

- Verdict conveyed by word, icon and color; works for color-blind users.
- Screen-reader labels for every control, the verdict card, and chart summaries.
- Keyboard navigation on desktop; focus states visible.
- Minimum 44 px touch targets; text scales with system settings.
- Alt text for atlas photos; reduced-motion support.

## 8. Onboarding (3 screens, skippable)

1. "Look up. Take one photo. Know if it's a good time to go out."
2. "Your photo stays on your device. Only a rounded location is used for weather."
3. Choose location mode and install to home screen (optional).

## 9. Wireframe sketch: Result (mobile)

```
+--------------------------------+
|  Near you        [offline?]    |
+--------------------------------+
|  ( 68 )  GO WITH CARE          |
|  Dry now; showers likely after |
|  4 pm.                         |
+--------------------------------+
| [ your sky photo ]             |
| Altostratus   74%  ####-       |
| also: Stratus 14%, Cirrus 7%   |
| Usually means rain within hrs  |
+--------------------------------+
| Next 6h  rain 10 20 45 60 ...  |
|          gust 18 20 24 26 ...  |
+--------------------------------+
| Why: rain chance rising, thick |
| veil of cloud, wind picking up |
| Tip: carry a jacket, be back   |
| by 4 pm.                       |
+--------------------------------+
| [Save to log] [Atlas] [Retake] |
| Not an official forecast.      |
+--------------------------------+
| Sky | Log | Atlas | Settings   |
+--------------------------------+
```

## 10. Desktop layout notes

- Two-column result: photo and cloud card on the left; verdict, weather strip and reasons on the right.
- Drag-and-drop upload area on Home.
- A "demo mode" with sample skies from different weather situations so the site can be shown anywhere, even indoors.
