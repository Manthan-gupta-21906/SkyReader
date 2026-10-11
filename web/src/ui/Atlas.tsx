import { Link, useLocation } from 'react-router-dom'

export default function Atlas() {
  const location = useLocation()

  const clouds = [
    { code: 'Ci', name: 'Cirrus', altitude: 'High', howToSpot: 'Wispy, white, fibrous clouds looking like mare\'s tails or curlies. Visible at 20,000–40,000 ft.', typicalWeather: 'Fair weather, possible rain soon; indicates approaching frontal system.', whatToDo: 'Good for outdoor activities likely to remain fair; carry light jacket if windy.', imageCredit: '' },
    { code: 'Cc', name: 'Cirrocumulus', altitude: 'High', howToSpot: 'Small, white, puffy clouds arranged in patterns like fish scales (mackerel sky).', typicalWeather: 'Fair but unstable; may precede a cold front or storm within 36 hours.', whatToDo: 'Good for outings; watch for increasing cloud cover.', imageCredit: '' },
    { code: 'Cs', name: 'Cirrostratus', altitude: 'High', howToSpot: 'Thin, transparent white sheet covering the whole sky, often creating a halo around the sun or moon.', typicalWeather: 'Moisture increasing; rain possible within 12–24 hours.', whatToDo: 'Good for daytime outdoors; be prepared for possible evening rain.', imageCredit: '' },
    { code: 'Ac', name: 'Altocumulus', altitude: 'Mid', howToSpot: 'White or gray patches, sheets, or layers, often with rounded masses or rolls. Visible in late morning.', typicalWeather: 'Mackerel sky may precede afternoon thunderstorms in humid conditions.', whatToDo: 'Good morning outings; watch for storm development by midday.', imageCredit: '' },
    { code: 'As', name: 'Altostratus', altitude: 'Mid', howToSpot: 'Gray or blue-gray cloud layer covering the whole sky; sun may be visible as a bright spot. Sun halos uncommon.', typicalWeather: 'Overcast; steady rain or snow possible within several hours.', whatToDo: 'Limit outdoor activities; rain likely approaching.', imageCredit: '' },
    { code: 'Ns', name: 'Nimbostratus', altitude: 'Low', howToSpot: 'Dark, thick, uniform gray cloud layer; clearly associated with continuous rain or snow.', typicalWeather: 'Persistent precipitation lasting hours; may be mixed with brief clearer periods.', whatToDo: 'Avoid outdoors unless equipped for rain; carry waterproof gear.', imageCredit: '' },
    { code: 'Sc', name: 'Stratocumulus', altitude: 'Low', howToSpot: 'Low, lumpy, gray clouds with blue sky visible between them, often in rows or patches.', typicalWeather: 'Generally fair; may produce light drizzle or mist. Stable conditions.', whatToDo: 'Good for outdoors; pleasant conditions likely.', imageCredit: '' },
    { code: 'St', name: 'Stratus', altitude: 'Low', howToSpot: 'Featureless, uniform gray cloud layer covering the sky like fog but aloft; sun/moon not visible.', typicalWeather: 'Drizzle or light snow possible; conditions may improve slowly.', whatToDo: 'Caution near wet surfaces; outdoor activities limited by low visibility.', imageCredit: '' },
    { code: 'Cu', name: 'Cumulus', altitude: 'Low', howToSpot: 'Classic "fair weather" puffy clouds with flat bases and domed tops, often with sharp outlines. Base at ~1,000 ft.', typicalWeather: 'Fair weather; may grow into cumulonimbus (storm clouds) if humidity and instability increase.', whatToDo: 'Good for outdoors; monitor for development into towering clouds.', imageCredit: '' },
    { code: 'Cb', name: 'Cumulonimbus', altitude: 'Vertical', howToSpot: 'Towering, dense clouds with anvil-shaped tops; often accompanied by lightning, thunder, heavy rain, or hail. Base low, top high.', typicalWeather: 'Severe weather: lightning, torrential rain, hail, damaging winds. Immediate shelter required.', whatToDo: 'STAY INDOORS. Avoid open ground, tall trees, and metal structures. Seek robust shelter immediately.', imageCredit: '' },
    { code: 'Clr', name: 'Clear sky', altitude: 'None', howToSpot: 'Completely cloudless sky; vivid blue (day) or deep black (night); sharp celestial object edges.', typicalWeather: 'Optimal conditions for sun exposure and outdoor activities; no cloud-related weather risks.', whatToDo: 'Excellent for all outdoor activities; apply sunscreen for sun exposure.', imageCredit: '' },
  ]

  return (
    <section className="p-4">
      <h2>Cloud Atlas</h2>
      <p>Select a cloud type to learn how to spot it, what it typically means for weather, and what to do outdoors.</p>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {clouds.map((c) => (
          <div
            key={c.code}
            className="group rounded-md border p-4 hover:border-accent transition-colors"
            style={{ background: 'var(--cloud-white)' }}
          >
            <div className="text-xs font-medium text-muted mb-1">{c.code}</div>
            <h3 className="text-lg font-bold text-fg">{c.name}</h3>
            <p className="text-sm text-muted mb-3">{c.howToSpot}</p>
            <div className="flex justify-between text-xs">
              <span>Altitude: {c.altitude}</span>
              <Link to={`/result?cloud=${c.code}`} className={location.pathname.includes(`result`) ? 'text-accent' : 'text-muted hover:text-primary'}>
                Check conditions
              </Link>
            </div>
            <p className="mt-2 text-caption text-muted">{c.typicalWeather}</p>
            <p className="mt-1 text-caption font-medium">{c.whatToDo}</p>
            {c.imageCredit && (
              <p className="mt-2 text-caption text-muted italic">Image: {c.imageCredit}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}