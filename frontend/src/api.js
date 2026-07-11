const BASE = import.meta.env.VITE_API_BASE || '/api'

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, options)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`)
  return body
}

/** Time, weather, traffic and festival flag — everything the app fills in for you. */
export function fetchContext({ lat, lng }) {
  const qs = new URLSearchParams({ lat, lon: lng })
  return request(`/context?${qs}`)
}

/** Send the assembled feature row, get minutes back. */
export function predictETA(payload) {
  return request('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function checkHealth() {
  return request('/health')
}

/** Same haversine as the backend — used only to preview distance before checkout. */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLon = rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
