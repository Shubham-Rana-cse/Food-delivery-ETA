import { Star } from 'lucide-react'
import { cuisineOf } from '../data/restaurants'

export default function RestaurantCard({ restaurant, distanceKm, onSelect }) {
  const cuisine = cuisineOf(restaurant.cuisineId)

  return (
    <button
      onClick={() => onSelect(restaurant)}
      className="card group overflow-hidden text-left"
    >
      <div
        className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${restaurant.accent}`}
      >
        <span className="text-5xl transition-transform duration-300 group-hover:scale-110">
          {restaurant.glyph}
        </span>
        <span className="absolute bottom-2 left-2 rounded-md bg-white/85 px-2 py-0.5 font-mono text-[10px] text-ink-700">
          {distanceKm.toFixed(1)} km
        </span>
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-bold leading-tight">{restaurant.name}</h3>
          <span className="flex shrink-0 items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {restaurant.rating}
            <Star size={9} fill="currentColor" />
          </span>
        </div>

        <p className="mt-1 truncate text-xs text-ink-500">{restaurant.tagline}</p>

        <div className="mt-2.5 flex items-center justify-between text-xs text-ink-500">
          <span>{cuisine?.label}</span>
          <span>₹{restaurant.priceForTwo} for two</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1 border-t border-dashed border-black/10 pt-2.5">
          <span className="label-eyebrow">sets</span>
          <code className="font-mono text-[10px] text-ink-500">City={restaurant.city}</code>
          <code className="font-mono text-[10px] text-ink-500">· distance_km</code>
        </div>
      </div>
    </button>
  )
}
