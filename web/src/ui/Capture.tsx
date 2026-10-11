import { useState } from 'react'

export default function Capture() {
  const [hasCamera, setHasCamera] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1920, height: 1080 },
        audio: false,
      })
      setHasCamera(true)
      stream.getTracks().forEach((track) => track.stop())
    } catch {
      setCameraError('Camera permission denied. Please use the upload option instead.')
    }
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setCameraError('Please select an image file.')
      return
    }
    setSelectedFile(file)
    setCameraError(null)
  }

  return (
    <section className="p-4 max-w-md mx-auto">
      <h2>Capture a Sky Photo</h2>

      {cameraError && (
        <p className="text-red-600 text-sm mb-4">{cameraError}</p>
      )}

      {hasCamera && (
        <p className="text-muted mb-4">Camera active - pointing at sky</p>
      )}

      {!hasCamera && !cameraError && (
        <>
          <button
            onClick={handleCamera}
            className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-accent text-primary hover:bg-accent/90 transition-colors mb-4"
          >
            Take a photo
          </button>

          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="mt-2 block w-full rounded-md border border-dashed border-muted p-4 text-center text-muted hover:border-primary"
          />
          <p className="text-xs text-muted mt-1">or drag & drop an image here</p>
        </>
      )}

      {selectedFile && (
        <div className="mt-6">
          <p className="text-muted mb-2">Photo selected: {selectedFile.name}</p>
          <button
            onClick={() => setSelectedFile(null)}
            className="text-sm text-accent hover:underline"
          >
            Retake
          </button>
        </div>
      )}
    </section>
  )
}