import { useState } from 'react'

export default function Onboarding() {
  const [step, setStep] = useState(1)

  const steps = [
    {
      title: 'Look up. Take one photo. Know if it\'s a good time to go out.',
      body: 'Point at the sky or horizon. Keep the sun out of the frame.',
    },
    {
      title: 'Your photo stays on your device. Only a rounded location is used for weather.',
      body: 'We never upload your photo. No analytics, no third-party trackers.',
    },
    {
      title: 'Choose location mode and install to home screen (optional).',
      body: 'Set your preferred units, theme, and location precision.',
    },
  ]

  const prev = () => setStep((s) => Math.max(s - 1, 1))
  const next = () => setStep((s) => Math.min(s + 1, steps.length))

  if (step > steps.length) {
    return null // onboarding complete, redirect
  }

  const stepData = steps[step - 1]

  return (
    <section className="min-h-screen bg-primary p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-fg mb-4">{stepData.title}</h2>
        <p className="text-muted mb-8">{stepData.body}</p>
        <div className="flex gap-3 w-full justify-center">
          <button
            onClick={prev}
            disabled={step === 1}
            className="flex-1 rounded-md px-3 py-2 text-sm font-medium text-muted hover:text-primary transition-colors"
          >
            Prev
          </button>
          <button
            onClick={next}
            disabled={step === steps.length}
            className="flex-1 rounded-md px-3 py-2 text-sm font-medium bg-accent text-primary hover:bg-accent/90 transition-colors"
          >
            {step === steps.length ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </section>
  )
}