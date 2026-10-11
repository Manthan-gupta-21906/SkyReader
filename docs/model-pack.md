# Model Pack Documentation

## Format: `web/public/models/manifest.json`

The model pack consists of `model.onnx` + `manifest.json`. Place them in `web/public/models/`.

```json
{
  "version": 1,
  "labels": {
    "Ci": "Cirrus",
    "Cc": "Cumulus",
    "Cs": "Cirrostratus",
    "Ac": "Altocumulus",
    "As": "Altostratus",
    "Ns": "Nimbostratus",
    "Sc": "Stratocumulus",
    "St": "Stratus",
    "Cu": "Cumulus",
    "Cb": "Cumulonimbus",
    "Clr": "Clear sky"
  },
  "input_size": 224,
  "preprocess": {
    "resize": "short_side",
    "crop": "center_crop",
    "mean": [0.485, 0.456, 0.406],
    "std": [0.229, 0.224, 0.225]
  },
  "calibration": {
    "temperature": 1.3,
    "reject_threshold": 0.45
  },
  "quantization": "int8",
  "license": "MIT",
  "source": "timm/mobilenetv3_small_100"
}
```

## Dropping in a Real Model

1. Replace `web/public/models/model.onnx` with your quantized (int8) model
2. Update `web/public/models/manifest.json` with correct:
   - `sha256` hash of the `.onnx` file
   - `license` information
   - `input_size` if different from 224
   - `labels` array matching the 11 class codes
3. Ensure the model's preprocessing matches the `mean`/`std` values
4. Rebuild: `npm run --prefix web build`
5. The app will auto-detect the new model on next load

## Preprocessing Parity

The browser `ml/preprocess.ts` implements the same pipeline as training:
- Resize short side to 224px (preserving aspect ratio)
- Center-crop to 224×224
- CHW float32 normalisation: (R - 0.485) / 0.229, (G - 0.456) / 0.224, (B - 0.406) / 0.225
- Temperature scaling (1.3) and reject threshold (0.45) applied post-inference

## Online / Offline Behavior

- **Online**: Fetches `model.onnx` from `web/public/models/`, loads in a Web Worker
- **Fallback**: If `model.onnx` is missing or `VITE_MOCK_MODEL=true`, the deterministic mock classifier runs (colour-statistics heuristic)
- **All outputs** are labelled "Demo model - results are not real." in the UI