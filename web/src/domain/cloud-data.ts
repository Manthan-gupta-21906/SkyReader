/** Cloud class seed data – 10 WMO genera plus clear sky.
 *  Maps directly to the schema in the Backend/Data Schema document.
 */

export interface CloudInfo {
  label_index: number
  code: string
  name: string
  altitude_band: 'high' | 'mid' | 'low' | 'vertical' | 'none'
  how_to_spot: string
  usual_meaning: string
  what_to_do: string
  signal_type: 'neutral' | 'change_coming' | 'rain_building' | 'rain_now' | 'storm' | 'low_visibility'
  signal_weight: number
  is_storm_signal: boolean
  icon: string
}

export const CLOUD_CLASSES: CloudInfo[] = [
  {
    label_index: 0,
    code: 'Ci',
    name: 'Cirrus',
    altitude_band: 'high',
    how_to_spot: 'Wispy, white, fibrous clouds looking like mare\'s tails or curlicues. Visible at 20,000–40,000 ft.',
    usual_meaning: 'Fair weather now; possible change soon — indicates an approaching frontal system.',
    what_to_do: 'Good for outdoor activities; carry a light jacket if windy.',
    signal_type: 'change_coming',
    signal_weight: 10,
    is_storm_signal: false,
    icon: '🌤️',
  },
  {
    label_index: 1,
    code: 'Cc',
    name: 'Cirrocumulus',
    altitude_band: 'high',
    how_to_spot: 'Small, white, puffy clouds arranged in patterns like fish scales (mackerel sky).',
    usual_meaning: 'Fair but unstable; may precede a cold front or storm within 36 hours.',
    what_to_do: 'Good for outings; watch for increasing cloud cover.',
    signal_type: 'neutral',
    signal_weight: 0,
    is_storm_signal: false,
    icon: '⛅',
  },
  {
    label_index: 2,
    code: 'Cs',
    name: 'Cirrostratus',
    altitude_band: 'high',
    how_to_spot: 'Thin, transparent white sheet covering the whole sky, often creating a halo around the sun or moon.',
    usual_meaning: 'Moisture increasing; rain possible within 12–24 hours.',
    what_to_do: 'Good for daytime outdoors; be prepared for possible evening rain.',
    signal_type: 'change_coming',
    signal_weight: 10,
    is_storm_signal: false,
    icon: '🌥️',
  },
  {
    label_index: 3,
    code: 'Ac',
    name: 'Altocumulus',
    altitude_band: 'mid',
    how_to_spot: 'White or gray patches, sheets, or layers with rounded masses or rolls. Often visible in late morning.',
    usual_meaning: 'Morning altocumulus in humid air can precede afternoon thunderstorms.',
    what_to_do: 'Good morning outings; watch for storm development by midday.',
    signal_type: 'neutral',
    signal_weight: 5,
    is_storm_signal: false,
    icon: '☁️',
  },
  {
    label_index: 4,
    code: 'As',
    name: 'Altostratus',
    altitude_band: 'mid',
    how_to_spot: 'Gray or blue-gray cloud layer covering the whole sky; sun may appear as a faint bright spot.',
    usual_meaning: 'Overcast; steady rain or snow possible within several hours.',
    what_to_do: 'Limit outdoor activities; rain likely approaching.',
    signal_type: 'rain_building',
    signal_weight: 20,
    is_storm_signal: false,
    icon: '🌧️',
  },
  {
    label_index: 5,
    code: 'Ns',
    name: 'Nimbostratus',
    altitude_band: 'low',
    how_to_spot: 'Dark, thick, uniform gray cloud layer; clearly associated with continuous rain or snow.',
    usual_meaning: 'Persistent precipitation lasting hours; may be mixed with brief clearer periods.',
    what_to_do: 'Avoid outdoors unless equipped for rain; carry waterproof gear.',
    signal_type: 'rain_now',
    signal_weight: 30,
    is_storm_signal: false,
    icon: '🌧️',
  },
  {
    label_index: 6,
    code: 'Sc',
    name: 'Stratocumulus',
    altitude_band: 'low',
    how_to_spot: 'Low, lumpy, gray clouds with blue sky visible between them, often in rows or patches.',
    usual_meaning: 'Generally fair; may produce light drizzle or mist. Stable conditions.',
    what_to_do: 'Good for outdoors; pleasant conditions likely.',
    signal_type: 'neutral',
    signal_weight: 0,
    is_storm_signal: false,
    icon: '⛅',
  },
  {
    label_index: 7,
    code: 'St',
    name: 'Stratus',
    altitude_band: 'low',
    how_to_spot: 'Featureless, uniform gray cloud layer covering the sky like fog but aloft; sun not visible.',
    usual_meaning: 'Drizzle or light snow possible; conditions may improve slowly.',
    what_to_do: 'Caution near wet surfaces; outdoor activities limited by low visibility.',
    signal_type: 'low_visibility',
    signal_weight: 10,
    is_storm_signal: false,
    icon: '🌫️',
  },
  {
    label_index: 8,
    code: 'Cu',
    name: 'Cumulus',
    altitude_band: 'low',
    how_to_spot: 'Classic "fair weather" puffy clouds with flat bases and domed tops, often with sharp outlines.',
    usual_meaning: 'Fair weather; may grow into cumulonimbus if humidity and instability increase.',
    what_to_do: 'Good for outdoors; monitor for development into towering clouds.',
    signal_type: 'neutral',
    signal_weight: 0,
    is_storm_signal: false,
    icon: '⛅',
  },
  {
    label_index: 9,
    code: 'Cb',
    name: 'Cumulonimbus',
    altitude_band: 'vertical',
    how_to_spot: 'Towering, dense clouds with anvil-shaped tops; often accompanied by lightning, thunder, heavy rain, or hail.',
    usual_meaning: 'Severe weather: lightning, torrential rain, hail, damaging winds. Immediate shelter required.',
    what_to_do: 'STAY INDOORS. Avoid open ground, tall trees, and metal structures. Seek shelter immediately.',
    signal_type: 'storm',
    signal_weight: 45,
    is_storm_signal: true,
    icon: '⛈️',
  },
  {
    label_index: 10,
    code: 'Clr',
    name: 'Clear Sky',
    altitude_band: 'none',
    how_to_spot: 'Completely cloudless sky; vivid blue (day) or deep black (night); sharp celestial object edges.',
    usual_meaning: 'Optimal conditions for sun exposure and outdoor activities; no cloud-related weather risks.',
    what_to_do: 'Excellent for all outdoor activities; apply sunscreen for sun exposure.',
    signal_type: 'neutral',
    signal_weight: 0,
    is_storm_signal: false,
    icon: '☀️',
  },
]

export function getCloudByCode(code: string): CloudInfo | undefined {
  return CLOUD_CLASSES.find(c => c.code === code)
}

export function getCloudByIndex(index: number): CloudInfo | undefined {
  return CLOUD_CLASSES.find(c => c.label_index === index)
}

/** Altitude band display labels and colors */
export const ALTITUDE_BANDS: Record<string, { label: string; position: number }> = {
  high: { label: 'High (6–12 km)', position: 10 },
  mid: { label: 'Mid (2–6 km)', position: 40 },
  low: { label: 'Low (0–2 km)', position: 70 },
  vertical: { label: 'Vertical', position: 30 },
  none: { label: 'Surface', position: 90 },
}
