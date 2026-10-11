import { Link } from 'react-router-dom'
import Capture from './Capture'

export default function Sky() {
  // Sample sky data - maps to the 11 cloud class codes
  const sampleSkies = [
    { code: 'Ci', name: 'Cirrus', description: 'Wispy high clouds' },
    { code: 'Cc', name: 'Cumulus', description: 'Classic puffy clouds' },
    { code: 'Cs', name: 'Cirrostratus', description: 'Thin high-level sheet' },
    { code: 'Ac', name: 'Altocumulus', description: 'Patchy mid-level clouds' },
    { code: 'As', name: 'Altostratus', description: 'Gray mid-level sheet' },
    { code: 'Ns', name: 'Nimbostratus', description: 'Dark, rainy cloud layer' },
    { code: 'Sc', name: 'Stratocumulus', description: 'Large rounded masses' },
    { code: 'St', name: 'Stratus', description: 'Flat, low-level layer' },
    { code: 'Cu', name: 'Cumulus', description: 'Individual puffy clouds' },
    { code: 'Cb', name: 'Cumulonimbus', description: 'Thunderstorm clouds' },
    { code: 'Clr', name: 'Clear sky', description: 'Clear, cloudless sky' },
  ]

  return (
    <section className="p-4">
      <h2>Sky Capture</h2>

      <p>
        <Link to="/result">Try a sample sky</Link> instead?
      </p>

      <Capture />

      <div className="mt-6">
        <h3>Sample Cloud Types</h3>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {sampleSkies.map((s) => (
            <div
              key={s.code}
              className="p-3 rounded-md border text-center"
              style={{ background: 'var(--cloud-white)' }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 64 64"
                fill="none"
                aria-label={s.name}
              >
                <circle cx="32" cy="32" r="28" style={{ fill: 'var(--sky-blue)' }} />
                <path
                  fill="currentColor"
                  d="M20 22v-4h-4v4h4zM44 22v-4h-4v4h4zM12 30l4-5 4 5zM28 30l4-5 4 5zM4 40l5-4 5 4zM56 40l5-4 5 4zM16 54l3 4h4l3-4zM48 54l-3 4h-4l-3-4z"
                />
              </svg>
              <p className="text-xs mt-1">{s.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}