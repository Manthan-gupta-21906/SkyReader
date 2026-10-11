import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const steps = [
  {
    icon: '🔭',
    title: 'Look up. Take one photo.',
    subtitle: 'Know if it\'s a good time to go out.',
    body: 'Point at the sky or horizon. Keep the sun out of the frame. In seconds, SkyReader tells you what the clouds are and whether to head outside.',
    visual: '🌤️ → 📸 → ✅',
  },
  {
    icon: '🔒',
    title: 'Your photo stays on your device.',
    subtitle: 'Privacy by design.',
    body: 'We never upload your photo. Classification runs entirely in your browser. Only a rounded location is used for weather — no analytics, no third-party trackers.',
    visual: '📱 🔐 🛡️',
  },
  {
    icon: '⚙️',
    title: 'Customize & install.',
    subtitle: 'Make it yours.',
    body: 'Choose your location mode, units, and theme. Install SkyReader to your home screen for instant access — it works offline too.',
    visual: '🌙 📐 📲',
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const next = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      navigate('/')
    }
  }

  const prev = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const skip = () => navigate('/')

  const current = steps[step]

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        {/* Skip button */}
        <div className="flex justify-end mb-8">
          <button onClick={skip} className="text-xs text-[var(--color-space-200)] hover:text-[var(--color-star-white)] transition-colors">
            Skip →
          </button>
        </div>

        {/* Visual */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-6"
            style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(129,140,248,0.15))' }}>
            <span className="text-5xl">{current.icon}</span>
          </div>

          <div className="flex justify-center gap-2 text-3xl mb-6">
            {current.visual.split(' ').map((emoji, i) => (
              <span
                key={i}
                className="inline-block"
                style={{
                  animation: `pageIn 0.5s ${i * 0.15}s cubic-bezier(0.4,0,0.2,1) both`,
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold text-[var(--color-star-white)] mb-2">
          {current.title}
        </h1>
        <p className="text-base font-medium glow-text mb-3">
          {current.subtitle}
        </p>
        <p className="text-sm text-[var(--color-space-100)] leading-relaxed mb-8">
          {current.body}
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? '24px' : '8px',
                background: i === step ? 'var(--color-aurora-cyan)' : 'rgba(255,255,255,0.15)',
                boxShadow: i === step ? '0 0 8px var(--color-aurora-cyan)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={prev}
            disabled={step === 0}
            className="btn btn-secondary flex-1"
            style={{ opacity: step === 0 ? 0.3 : 1 }}
          >
            Back
          </button>
          <button onClick={next} className="btn btn-primary flex-1">
            {step === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>

        {/* Brand */}
        <p className="mt-8 text-xs text-[var(--color-space-300)] flex items-center justify-center gap-1.5">
          <span>🔭</span>
          <span className="glow-text font-semibold">SkyReader</span>
          <span>· Read the sky, then log off.</span>
        </p>
      </div>
    </section>
  )
}