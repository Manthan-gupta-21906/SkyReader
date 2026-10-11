/**
 * Sky Page – Viewfinder, photo capture, and AI cloud inference console.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSkyCapture, type SkyOrientation } from '../hooks/useSkyCapture'
import { useAppState } from '../state/useAppState'
import { CLOUD_CLASSES } from '../domain/clouds/cloudData'
import { computeSampleAdvice } from '../domain/advice/adviceEngine'
import { runInference, generateTopPredictions } from '../services/ml/inferenceService'
import { StatusBadge } from '../components/common/StatusBadge'
import { CameraIcon, UploadIcon, RotateIcon, CompassIcon } from '../components/icons/Icons'
import type { CloudInfo } from '../types/cloud'

export function SkyPage() {
  const navigate = useNavigate()
  const { state, setAnalysis, notify } = useAppState()
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const {
    selectedFile,
    previewUrl,
    isDragging,
    orientationMode,
    rotationAngle,
    fileInputRef,
    cameraError,
    setOrientationMode,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    rotateImage,
    startCamera,
    resetCapture,
  } = useSkyCapture()

  // Featured sample skies for demo mode
  const featuredClouds = CLOUD_CLASSES.filter((c) =>
    ['Clr', 'Cu', 'Cb', 'Ns', 'Ci', 'As'].includes(c.code)
  )

  const handleAnalyzePhoto = async () => {
    if (!selectedFile) return
    setIsAnalyzing(true)

    try {
      const inference = await runInference(selectedFile, {
        temperature: state.settings.temperature,
        rejectionThreshold: state.settings.rejectionThreshold,
        activeModelId: state.settings.activeModel,
      })

      const advice = computeSampleAdvice(inference.primary, {
        rainPenaltyScale: state.settings.rainPenaltyScale,
        enforceStormCap: state.settings.enforceStormCap,
      })

      setAnalysis({
        cloud: inference.primary,
        advice,
        topPredictions: inference.topPredictions,
        photoUrl: previewUrl,
        orientation: orientationMode,
      })

      navigate('/result', {
        state: {
          cloud: inference.primary,
          advice,
          photoUrl: previewUrl,
          orientation: orientationMode,
          topPredictions: inference.topPredictions,
        },
      })
    } catch {
      notify({
        type: 'error',
        message: 'Analysis failed. Please try again with a clearer sky photo.',
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSampleSky = (cloud: CloudInfo) => {
    const advice = computeSampleAdvice(cloud, {
      rainPenaltyScale: state.settings.rainPenaltyScale,
      enforceStormCap: state.settings.enforceStormCap,
    })
    const topPredictions = generateTopPredictions(cloud)

    setAnalysis({
      cloud,
      advice,
      topPredictions,
      isDemo: true,
    })

    navigate('/result', {
      state: {
        cloud,
        advice,
        topPredictions,
        isDemo: true,
      },
    })
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-10">
      {/* Hero Header */}
      <div className="text-center mb-8 md:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 text-xs font-medium text-[var(--color-aurora-cyan)] bg-[rgba(34,211,238,0.08)] border border-[rgba(34,211,238,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-aurora-cyan)] animate-pulse" />
          <span>In-Browser AI · No Photo Uploads · 10 WMO Genera</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">
          <span className="glow-text">Read the Sky</span>
        </h1>
        <p className="text-[var(--color-space-100)] text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Point at the clouds, capture one photo, and get an instant outdoor verdict with plain-language weather guidance.
        </p>
      </div>

      {cameraError && (
        <div className="mb-6 p-4 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-sm text-[var(--color-supernova-red)] max-w-2xl mx-auto flex items-center justify-between gap-3">
          <span>{cameraError}</span>
          <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary btn-sm">
            Browse File
          </button>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Viewfinder & Capture Console */}
        <div className="lg:col-span-7 space-y-5">
          {/* Orientation Mode Switcher */}
          <div className="glass-card p-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-space-200)] pl-1 flex items-center gap-1.5">
              <CompassIcon size={14} />
              Orientation
            </span>
            <div className="flex gap-1.5">
              {[
                { id: 'horizon' as SkyOrientation, label: 'Horizon (0°)', icon: '🌄', tip: 'Wide angle' },
                { id: 'zenith' as SkyOrientation, label: 'Zenith (90°)', icon: '🌌', tip: 'Overhead' },
                { id: 'auto' as SkyOrientation, label: 'Auto Level', icon: '🎯', tip: 'Sensor gyro' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setOrientationMode(mode.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    orientationMode === mode.id
                      ? 'bg-[var(--color-aurora-cyan)] text-[var(--color-space-900)] font-semibold shadow-md'
                      : 'text-[var(--color-space-200)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                  }`}
                  title={mode.tip}
                >
                  <span>{mode.icon}</span>
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          {!selectedFile ? (
            /* Viewfinder Console: Idle / Capture Mode */
            <div
              className={`glass-card p-6 md:p-8 relative overflow-hidden transition-all text-center border-2 ${
                isDragging
                  ? 'border-[var(--color-aurora-cyan)] bg-[rgba(34,211,238,0.06)]'
                  : 'border-dashed border-[rgba(255,255,255,0.15)] hover:border-[rgba(34,211,238,0.4)]'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Corner Brackets */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[var(--color-aurora-cyan)] opacity-70" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[var(--color-aurora-cyan)] opacity-70" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[var(--color-aurora-cyan)] opacity-70" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[var(--color-aurora-cyan)] opacity-70" />

              {/* Leveler Indicator */}
              <div className="mb-6 flex items-center justify-center gap-2">
                <div className="h-0.5 w-16 bg-[rgba(255,255,255,0.15)]" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-aurora-cyan)] bg-[rgba(34,211,238,0.1)] px-2 py-0.5 rounded border border-[rgba(34,211,238,0.25)]">
                  {orientationMode === 'zenith'
                    ? 'Zenith Angle: 90° Overhead'
                    : orientationMode === 'horizon'
                    ? 'Horizon Level: 0° Aligned'
                    : 'Sensor Gyro: Level'}
                </span>
                <div className="h-0.5 w-16 bg-[rgba(255,255,255,0.15)]" />
              </div>

              {/* Viewfinder Center Icon */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(129,140,248,0.15))',
                  border: '1px solid rgba(34,211,238,0.3)',
                }}
              >
                <CameraIcon size={36} color="var(--color-aurora-cyan)" />
              </div>

              <h2 className="text-xl font-bold text-[var(--color-star-white)] mb-1">
                Aim at the Sky & Snap
              </h2>
              <p className="text-sm text-[var(--color-space-200)] max-w-sm mx-auto mb-6">
                Drag and drop your photo here, or use the camera to scan clouds in real-time.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                <button
                  onClick={startCamera}
                  className="btn btn-primary w-full sm:w-auto flex-1 justify-center py-3"
                >
                  <CameraIcon size={18} />
                  <span>Take Sky Photo</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary w-full sm:w-auto flex-1 justify-center py-3"
                >
                  <UploadIcon size={18} />
                  <span>Browse Image</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                aria-hidden="true"
              />
            </div>
          ) : (
            /* Loaded Preview Mode */
            <div className="glass-card overflow-hidden space-y-4 p-5">
              <div className="relative rounded-xl overflow-hidden bg-[var(--color-space-900)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center min-h-[300px]">
                <img
                  src={previewUrl!}
                  alt="Sky capture preview"
                  style={{ transform: `rotate(${rotationAngle}deg)`, transition: 'transform 0.25s ease' }}
                  className="max-h-80 w-full object-contain"
                />

                <div className="absolute top-3 left-3 bg-[rgba(5,8,16,0.7)] backdrop-blur-md px-2.5 py-1 rounded-md text-xs text-[var(--color-aurora-cyan)] border border-[rgba(34,211,238,0.3)] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-aurora-green)] animate-ping" />
                  <span>Ready for Classification</span>
                </div>

                <button
                  onClick={rotateImage}
                  className="absolute bottom-3 right-3 bg-[rgba(5,8,16,0.75)] hover:bg-[rgba(5,8,16,0.95)] backdrop-blur-md text-xs text-[var(--color-star-white)] px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.2)] flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Rotate image orientation"
                >
                  <RotateIcon size={14} />
                  <span>Rotate ({rotationAngle}°)</span>
                </button>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-star-white)] truncate max-w-xs">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-[var(--color-space-200)]">
                    {(selectedFile.size / 1024).toFixed(0)} KB · Orientation: {rotationAngle % 180 === 0 ? 'Standard' : 'Rotated 90°'}
                  </p>
                </div>
                <button onClick={resetCapture} className="btn btn-secondary btn-sm">
                  Replace Photo
                </button>
              </div>

              <button
                onClick={handleAnalyzePhoto}
                disabled={isAnalyzing}
                className="btn btn-primary btn-lg w-full justify-center py-3.5 mt-2 shadow-lg"
              >
                {isAnalyzing ? (
                  <>
                    <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Running In-Browser Model Inference...</span>
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>Analyze Cloud & Compute Verdict</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Orientation Guidance */}
          <div className="glass-card-subtle p-4 flex items-start gap-3">
            <span className="text-xl">🧭</span>
            <div className="text-xs leading-relaxed text-[var(--color-space-100)]">
              <strong className="text-[var(--color-star-white)]">Orientation Tip:</strong> For best classification, keep the horizon in the lower third of the frame or tilt straight up at the zenith. Keep direct sun glare out of the frame.
            </div>
          </div>
        </div>

        {/* Right Column: Demo Sky Genera & Live Observation Guide */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--color-star-white)]">
                  Instant Demo Skies
                </h2>
                <p className="text-xs text-[var(--color-space-200)]">
                  Click any cloud genus to test advice scoring
                </p>
              </div>
              <span className="badge badge-high text-[10px]">Demo Mode</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {featuredClouds.map((cloud) => {
                const sampleAdvice = computeSampleAdvice(cloud, {
                  rainPenaltyScale: state.settings.rainPenaltyScale,
                  enforceStormCap: state.settings.enforceStormCap,
                })

                return (
                  <button
                    key={cloud.code}
                    onClick={() => handleSampleSky(cloud)}
                    className="p-3 rounded-xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.07)] border border-transparent hover:border-[rgba(34,211,238,0.3)] text-left transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl p-2 rounded-lg bg-[rgba(255,255,255,0.04)] shrink-0">
                        {cloud.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3 className="text-sm font-semibold text-[var(--color-star-white)] group-hover:text-[var(--color-aurora-cyan)] transition-colors truncate">
                            {cloud.name}
                          </h3>
                          <span className="text-[10px] text-[var(--color-space-300)] font-mono">
                            ({cloud.code})
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-space-200)] truncate">
                          {cloud.how_to_spot}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge type="verdict" verdict={sampleAdvice.verdict} label={sampleAdvice.verdictLabel} />
                      <p className="text-[10px] text-[var(--color-space-300)] mt-1 font-mono">
                        {sampleAdvice.score}/100
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Privacy Guarantee Card */}
          <div className="glass-card-subtle p-4 border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.03)] rounded-xl">
            <div className="flex items-center gap-2.5 text-xs text-[var(--color-star-white)] font-medium mb-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-aurora-green)" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>100% On-Device Privacy</span>
            </div>
            <p className="text-[11px] text-[var(--color-space-200)] leading-relaxed">
              Your sky photos never leave your browser. Classification runs locally via WebAssembly / ONNX, and weather is fetched anonymously using coarse coordinates (~10 km).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
