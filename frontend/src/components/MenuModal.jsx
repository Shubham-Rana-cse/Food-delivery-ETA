import { Minus, Plus, X } from 'lucide-react'
import { cuisineOf, typeOfOrderFor } from '../data/restaurants'

export default function MenuModal({ restaurant, cart, onAdd, onRemove, onClose, onGoToCart }) {
  if (!restaurant) return null
  const qty = (itemId) => cart.find((l) => l.item.id === itemId)?.qty ?? 0
  const total = cart.reduce((s, l) => s + l.item.price * l.qty, 0)

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-lg animate-fade-up flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${restaurant.name} menu`}
      >
        <div className={`relative flex h-28 shrink-0 items-center justify-center bg-gradient-to-br ${restaurant.accent}`}>
          <span className="text-5xl">{restaurant.glyph}</span>
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-white/85 p-1.5 transition hover:bg-white"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <div className="shrink-0 border-b border-black/[.07] px-5 py-4">
          <h2 className="text-xl font-extrabold">{restaurant.name}</h2>
          <p className="text-sm text-ink-500">{restaurant.tagline}</p>
          <p className="mt-2 font-mono text-[11px] text-ink-300">
            Type_of_order={typeOfOrderFor(restaurant)} · collected, not used by the model
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          {restaurant.menu.map((item) => (
            <div key={item.id} className="flex items-center gap-4 border-b border-black/[.05] py-3.5 last:border-0">
              <span
                className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm border-2 p-[2px] ${
                  item.veg ? 'border-emerald-600' : 'border-brand-600'
                }`}
                title={item.veg ? 'Vegetarian' : 'Non-vegetarian'}
              >
                <span className={`block h-full w-full rounded-full ${item.veg ? 'bg-emerald-600' : 'bg-brand-600'}`} />
              </span>

              <div className="flex-1">
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="text-sm text-ink-500">₹{item.price}</p>
              </div>

              {qty(item.id) === 0 ? (
                <button
                  onClick={() => onAdd(restaurant, item)}
                  className="rounded-lg border border-brand-600 px-4 py-1.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
                >
                  Add
                </button>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-brand-600 px-2 py-1 text-brand-600">
                  <button onClick={() => onRemove(item)} aria-label={`Remove one ${item.name}`}>
                    <Minus size={14} />
                  </button>
                  <span className="w-4 text-center text-sm font-semibold tabular-nums">{qty(item.id)}</span>
                  <button onClick={() => onAdd(restaurant, item)} aria-label={`Add one ${item.name}`}>
                    <Plus size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="shrink-0 border-t border-black/[.07] p-4">
            <button
              onClick={onGoToCart}
              className="flex w-full items-center justify-between rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              <span>{cart.reduce((s, l) => s + l.qty, 0)} item(s) · ₹{total}</span>
              <span>Review order →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
