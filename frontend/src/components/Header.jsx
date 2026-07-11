import { Briefcase, ChevronDown, CloudFog, CloudSun, Home, MapPin, Sun, Wind, Zap, CloudLightning } from 'lucide-react'
import { useState } from 'react'
import { ADDRESSES } from '../data/addresses'

const WEATHER_ICON = {
  Sunny: Sun,
  Cloudy: CloudSun,
  Fog: CloudFog,
  Stormy: CloudLightning,
  Windy: Wind,
  Sandstorms: Wind,
}

const ADDRESS_ICON = { home: Home, briefcase: Briefcase, 'map-pin': MapPin }

const TRAFFIC_TONE = {
  Low: 'text-emerald-600',
  Medium: 'text-amber-600',
  High: 'text-orange-600',
  Jam: 'text-brand-600',
}

export default function Header({ address, onAddressChange, context, cartCount, onOpenCart }) {
  const [open, setOpen] = useState(false)
  const Weather = WEATHER_ICON[context?.weather] ?? CloudSun

  return (
    <header className="sticky top-0 z-30 border-b border-black/[.07] bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold tracking-tight text-brand-600">tastebud</span>
          <span className="hidden text-[11px] font-medium text-ink-300 sm:inline">ETA by LightGBM</span>
        </div>

        {/* Address picker — sets delivery_lat / delivery_lng */}
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-black/[.04]"
            aria-expanded={open}
          >
            <MapPin size={16} className="text-brand-600" />
            <span className="hidden sm:block">
              <span className="block text-xs font-semibold leading-tight">{address.label}</span>
              <span className="block text-[11px] leading-tight text-ink-500">{address.line}</span>
            </span>
            <ChevronDown size={14} className={`text-ink-300 transition ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute left-0 top-full mt-2 w-72 animate-fade-up rounded-xl border border-black/10 bg-white p-1.5 shadow-xl">
              {ADDRESSES.map((a) => {
                const Icon = ADDRESS_ICON[a.icon] ?? MapPin
                return (
                  <button
                    key={a.id}
                    onClick={() => { onAddressChange(a); setOpen(false) }}
                    className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-brand-50 ${
                      a.id === address.id ? 'bg-brand-50' : ''
                    }`}
                  >
                    <Icon size={16} className="mt-0.5 text-ink-500" />
                    <span>
                      <span className="block text-sm font-semibold">{a.label}</span>
                      <span className="block text-xs text-ink-500">{a.line}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Live context strip — the three things the user never types */}
          {context && (
            <div className="hidden items-center gap-3 rounded-full border border-black/[.07] px-3 py-1.5 md:flex">
              <span className="font-mono text-xs text-ink-700">{context.local_time}</span>
              <span className="h-3 w-px bg-black/10" />
              <span className="flex items-center gap-1.5 text-xs text-ink-700">
                <Weather size={14} className="text-ink-500" />
                {context.weather}
              </span>
              <span className="h-3 w-px bg-black/10" />
              <span className={`flex items-center gap-1 text-xs font-medium ${TRAFFIC_TONE[context.road_traffic_density]}`}>
                <Zap size={13} />
                {context.road_traffic_density}
              </span>
            </div>
          )}

          <button
            onClick={onOpenCart}
            className="relative rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-40"
            disabled={cartCount === 0}
          >
            Cart
            {cartCount > 0 && (
              <span className="ml-1.5 rounded-full bg-white/25 px-1.5 py-0.5 text-[11px]">{cartCount}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
