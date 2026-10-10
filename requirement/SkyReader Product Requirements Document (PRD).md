# SkyReader: Product Requirements Document (PRD)

*Working name. A website that reads the sky from a photo, tells you what the clouds are, and gives a "should I go out?" tip. Built for the "Touch Grass" open-source AI challenge.*

**Assumptions (change if wrong):** installable web app (PWA) deployed as a static site; cloud classification runs in the browser with an open-weight model; weather comes from the free Open-Meteo API; advice is rule-based, with an optional small local LLM for wording.

## 1. Problem

Most weather apps show a rain percentage and an icon. They never connect *what you can see overhead* to *what is coming*, and most people cannot tell a harmless cirrus from a building cumulonimbus. The decision to go for a walk, run or hike is made with little context, and the phone keeps people indoors looking at a screen.

## 2. Vision

Look up, take one photo, put the phone away. In seconds you know what the clouds are, what they usually mean in the next few hours, and whether it is a good time to be outside.

## 3. Goals

- Classify a sky photo into one of the 10 standard cloud genera (plus clear sky) in the browser, with no upload of the photo.
- Combine the cloud signal with live weather (rain chance, wind gusts, thunderstorm energy, UV, daylight) into a clear Go / Go with care / Wait / Stay in verdict.
- Teach: every result explains the cloud in plain language, so users get better at reading the sky themselves.
- Close the loop: later, show whether the tip matched what actually happened.
- Run as a free static website with no server cost and installable on a phone.

## 4. Non-goals (v1)

- Not a forecasting engine and not a replacement for official weather warnings.
- Not safety-critical: no lightning detection, no storm-chasing advice.
- No user accounts, social feed, or photo sharing.
- No cloud height, coverage-percent or sky segmentation (stretch goal).
- No native iOS/Android app (the PWA covers phones).

## 5. Target users

| Persona | Need |
| --- | --- |
| Casual walker or runner | "Is now a good time to head out?" |
| Hiker or trekker | Early warning signs of afternoon storms or incoming fronts |
| Gardener or photographer | Understand cloud types and light, plan the day |
| Student or curious beginner | Learn to read clouds with a built-in atlas |

## 6. User stories

- As a walker, I take one photo and get a verdict in under 3 seconds.
- As a hiker, I see why a cloud type matters (for example, towering cumulonimbus means storm risk) in two plain sentences.
- As a learner, I browse a cloud atlas and compare my photo with reference examples.
- As a user, I keep a sky log of my observations over time.
- As a skeptic, I can see later whether the tip was right (rain or no rain in the next few hours).
- As a privacy-minded user, I know my photo never leaves my device.
- As a user with no signal, I can still classify a photo and see the last cached forecast.

## 7. Feature scope

| ID | Feature | Priority |
| --- | --- | --- |
| F1 | Capture or upload a sky photo; classify cloud type with top-3 and confidence | P0 |
| F2 | "Not a sky photo / unsure" rejection | P0 |
| F3 | Live weather fetch for coarse location (Open-Meteo), with caching | P0 |
| F4 | Go / Go with care / Wait / Stay in verdict with reasons | P0 |
| F5 | Plain-language explanation of the cloud and what it usually means | P0 |
| F6 | Sky log (photo thumbnail, cloud type, weather snapshot, verdict) | P1 |
| F7 | Outcome check: compare the tip with actual weather a few hours later | P1 |
| F8 | Cloud atlas (10 genera, how to spot each, typical weather) | P1 |
| F9 | PWA install and offline mode | P1 |
| F10 | Optional local LLM to phrase the tip | P2 |
| F11 | CSV export of the log | P2 |
| F12 | Sky coverage estimate (okta) via segmentation | P2 |

## 8. Success metrics

| Metric | Target |
| --- | --- |
| Top-1 accuracy, held-out test set | >= 80% |
| Top-3 accuracy, held-out test set | >= 95% |
| Top-1 accuracy on own phone photos | Report honestly; expect lower |
| Time from photo to verdict | < 3 s on a mid-range phone |
| Photo uploads to any server | 0 |
| Verdict matches next-3-hour rain outcome (own log) | Report the real hit rate |
| First load size (model + app) | < 25 MB |

## 9. Why open-source matters here

- The classifier is a small open-weight model, fine-tuned on open cloud datasets, and runs in the browser. Closed vision APIs would need uploads and API keys.
- Weather data comes from an open API with no key needed.
- The model is swappable and inspectable, so the write-up can report real numbers for each candidate backbone.
- Cost to run: zero per classification.

## 10. Risks

| Risk | Mitigation |
| --- | --- |
| Public cloud datasets are small and clean; phone photos are messy | Augment heavily, add own phone photos to the test set, report the gap |
| Cloud classes overlap visually (altostratus vs stratus, cirrostratus vs clear haze) | Show top-3, use a confidence threshold, explain the ambiguity |
| Users over-trust the verdict | Clear "not an official forecast" label; thunderstorm signals never produce a plain "Go" |
| Dataset licenses limit use | Record the license of every dataset; document it in the repo |
| Weather API requires network | Cache last forecast; allow manual "conditions" entry offline |
| Glare, buildings or trees in frame | Capture hint ("point straight up or at the horizon, avoid the sun"); crop tool |

## 11. Milestones (about two weekends plus a week of field testing)

1. **Weekend 1:** datasets, baseline, fine-tune, ONNX export.
2. **Weekend 2:** website with in-browser inference, weather, verdict, deploy.
3. **Following week:** photograph the sky daily, build the log and outcome check, write up results.

## 12. Open questions

- Which region and climate for the field test (monsoon, hill station, plains)?
- Use 10 genera only, or add "contrail" and "smoke/haze" as extra classes?
- Ship the LLM wording in v1, or rule-based text only?
