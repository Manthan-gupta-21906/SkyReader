import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CLOUD_CLASSES, type CloudInfo } from '../domain/cloud-data'
import { computeSampleAdvice } from '../advice/engine'

export default function Sky() {
  const navigate = useNavigate()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }, [])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleAnalyze = () => {
    setIsAnalyzing(true)
    // Simulate analysis with a random cloud type (real model would go here)
    setTimeout(() => {
      const randomCloud = CLOUD_CLASSES[Math.floor(Math.random() * CLOUD_CLASSES.length)]
      navigate('/result', { state: { cloud: randomCloud, photoUrl: previewUrl } })
      setIsAnalyzing(false)
    }, 1500)
  }

  const handleSampleSky = (cloud: CloudInfo) => {
    const advice = computeSampleAdvice(cloud)
    navigate('/result', { state: { cloud, advice, isDemo: true } })
  }

  const handleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1920, height: 1080 },
        audio: false,
      })
      stream.getTracks().forEach(t => t.stop())
      // In a real app, we'd open a camera view here
      fileRef.current?.click()
    } catch {
      fileRef.current?.click()
    }
  }

  const reset = () => {
    setSelectedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  // Featured sample skies for demo
  const featuredClouds = CLOUD_CLASSES.filter(c =>
    ['Clr', 'Cu', 'Cb', 'Ns', 'Ci', 'As'].includes(c.code)
  )

  return (
    <section className="max-w-3xl mx-auto px-4 py-6">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          <span className="glow-text">Read the Sky</span>
        </h1>
        <p className="text-[var(--color-space-100)] text-base md:text-lg max-w-md mx-auto">
          Take one photo, know your clouds, and decide if it's a good time to go outside.
        </p>
      </div>

      {/* Capture Area */}
      {!selectedFile ? (
        <div className="space-y-4">
          {/* Camera Button */}
          <button onClick={handleCamera} className="btn btn-primary btn-lg w-full">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Take a Sky Photo
          </button>

          {/* Upload Zone */}
          <div
            className={`upload-zone glass-card ${isDragging ? 'drag-active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload a sky photo"
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.1)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-aurora-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
                </svg>
              </div>
              <div>
                <p className="text-[var(--color-star-white)] font-medium">Upload a photo</p>
                <p className="text-[var(--color-space-200)] text-sm">Drag & drop or click to browse</p>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleUpload}
              className="hidden"
              aria-hidden="true"
            />
          </div>

          {/* Capture tip */}
          <div className="glass-card-subtle p-4 flex items-start gap-3">
            <span className="text-lg">💡</span>
            <p className="text-sm text-[var(--color-space-100)]">
              <strong className="text-[var(--color-star-white)]">Tip:</strong> Point at the sky or horizon.
              Keep the sun out of the frame for the best classification.
            </p>
          </div>
        </div>
      ) : (
        /* Photo Preview */
        <div className="space-y-4">
          <div className="glass-card overflow-hidden">
            <img
              src={previewUrl!}
              alt="Your sky photo"
              className="w-full h-64 object-cover"
            />
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-star-white)] font-medium">{selectedFile.name}</p>
                <p className="text-xs text-[var(--color-space-200)]">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button onClick={reset} className="btn btn-secondary btn-sm">
                Change
              </button>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            className="btn btn-primary btn-lg w-full"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Reading the sky...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Analyze Sky
              </>
            )}
          </button>
        </div>
      )}

      {/* Divider */}
      <div className="divider my-8" />

      {/* Sample Skies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-star-white)]">
            Try a Sample Sky
          </h2>
          <span className="text-xs text-[var(--color-space-200)]">Demo mode</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {featuredClouds.map((cloud) => {
            const sampleAdvice = computeSampleAdvice(cloud)
            return (
              <button
                key={cloud.code}
                onClick={() => handleSampleSky(cloud)}
                className="glass-card p-4 text-left transition-all hover:scale-[1.02] cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{cloud.icon}</span>
                  <span className={`badge badge-${cloud.altitude_band === 'vertical' ? 'vertical' : cloud.altitude_band}`}>
                    {cloud.altitude_band}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-star-white)] group-hover:text-[var(--color-aurora-cyan)] transition-colors">
                  {cloud.name}
                </h3>
                <p className="text-xs text-[var(--color-space-200)] mt-1 line-clamp-2">
                  {cloud.how_to_spot}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`badge badge-${sampleAdvice.verdict === 'go' ? 'go' : sampleAdvice.verdict === 'go_with_care' ? 'care' : sampleAdvice.verdict === 'wait' ? 'wait' : 'stay'}`}>
                    {sampleAdvice.verdictLabel}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Privacy Note */}
      <div className="mt-8 text-center">
        <p className="text-xs text-[var(--color-space-200)] flex items-center justify-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          Your photo never leaves your device. Privacy first.
        </p>
      </div>
    </section>
  )
}