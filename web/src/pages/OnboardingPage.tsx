/**
 * Onboarding Page – Introduction walkthrough and privacy overview.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { STORAGE_KEYS } from '../config/constants'

const ONBOARDING_STEPS = [
  {
    icon: '🔭',
    title: 'Look up. Take one photo.',
    subtitle: "Know if it's a good time to go out.",
    body: 'Point at the sky or horizon. Keep the sun out of the frame. In seconds, SkyReader classifies cloud genera and delivers an outdoor verdict.',
    visual: '🌤️ → 📸 → ✅',
  },
  {
    icon: '🔒',
    title: 'Your photo stays on your device.',
    subtitle: 'Privacy by design.',
    body: 'Photos are never uploaded to a remote server. Model inference runs entirely within your browser runtime. Only coarse coordinates (~10 km) query weather data.',
    visual: '📱 🔐 🛡️',
  },
  {
    icon: '⚙️',
    title: 'Customize & install.',
    subtitle: 'Make it yours.',
    body: 'Choose your outdoor activity profile, units, and dark theme. Install SkyReader as a PWA on your home screen for rapid offline availability.',
    visual: '🌙 📐 📲',
  },
] as const

export function OnboardingPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)

  const completeOnboarding = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, 'true')
    } catch {
      // Ignore
    }
    navigate('/')
  }

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      completeOnboarding()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1)
  }

  const stepData = ONBOARDING_STEPS[currentStep]

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        {/* Skip button */}
        <div className="flex justify-end mb-8">
          <button
            onClick={completeOnboarding}
            className="text-xs text-[var(--color-space-200)] hover:text-[var(--color-star-white)] transition-colors cursor-pointer"
          >
            Skip →
          </button>
        </div>

        {/* Visual Header */}
        <div className="mb-8">
          <div
            className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-6 shadow-xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(129,140,248,0.15))',
            }}
          >
            <span className="text-5xl filter drop-shadow">{stepData.icon}</span>
          </div>

          <div className="flex justify-center gap-2 text-3xl mb-6">
            {stepData.visual.split(' ').map((emoji, i) => (
              <span
                key={i}
                className="inline-block"
                style={{
                  animation: `pageIn 0.5s ${i * 0.15}s cubic-bezier(0.4, 0, 0.2, 1) both`,
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold text-[var(--color-star-white)] mb-2">
          {stepData.title}
        </h1>
        <p className="text-base font-medium glow-text mb-3">{stepData.subtitle}</p>
        <p className="text-sm text-[var(--color-space-100)] leading-relaxed mb-8">
          {stepData.body}
        </p>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === currentStep ? '24px' : '8px',
                background:
                  i === currentStep ? 'var(--color-aurora-cyan)' : 'rgba(255,255,255,0.15)',
                boxShadow: i === currentStep ? '0 0 8px var(--color-aurora-cyan)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="btn btn-secondary flex-1 cursor-pointer"
            style={{ opacity: currentStep === 0 ? 0.3 : 1 }}
          >
            Back
          </button>
          <button onClick={handleNext} className="btn btn-primary flex-1 cursor-pointer">
            {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>

        {/* Branding Footer */}
        <p className="mt-8 text-xs text-[var(--color-space-300)] flex items-center justify-center gap-1.5">
          <span>🔭</span>
          <span className="glow-text font-semibold">SkyReader</span>
          <span>· Read the sky, then log off.</span>
        </p>
      </div>
    </section>
  )
}
