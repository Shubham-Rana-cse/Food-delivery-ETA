import { Loader2, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import DemoControls from './DemoControls'

export default function CartDrawer({
  open,
  onClose,
  cart,
  restaurant,
  address,
  distanceKm,
  courier,
  setCourier,
  overrides,
  setOverrides,
  context,
  onAdd,
  onRemove,
  onPlaceOrder,
  placing,
  error,
}) {
  if (!open) return null

  const total = cart.reduce((s, l) => s + l.item.price * l.qty, 0)

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md animate-fade-up flex-col bg-white"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Your order"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-black/[.07] px-5 py-4">
          <h2 className="text-lg font-extrabold">Your order</h2>
          <button onClick={onClose} className="rounded-full p-1.5 transition hover:bg-black/[.05]" aria-label="Close cart">
            <X size={18} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <ShoppingBag size={28} className="text-ink-300" />
            <p className="text-sm text-ink-500">Nothing here yet. Pick a restaurant and add a dish — the ETA needs a route to measure.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              <div>
                <p className="label-eyebrow">From</p>
                <p className="text-sm font-semibold">{restaurant?.name}</p>
                <p className="text-xs text-ink-500">
                  to {address.label} · {distanceKm.toFixed(2)} km · {restaurant?.city}
                </p>
              </div>

              <div className="rounded-xl border border-black/[.07]">
                {cart.map((line) => (
                  <div key={line.item.id} className="flex items-center gap-3 border-b border-black/[.05] px-3 py-2.5 last:border-0">
                    <span className="flex-1 text-sm">{line.item.name}</span>
                    <div className="flex items-center gap-2.5 rounded-lg border border-black/10 px-2 py-1">
                      <button onClick={() => onRemove(line.item)} aria-label={`Remove one ${line.item.name}`}>
                        <Minus size={12} />
                      </button>
                      <span className="w-4 text-center text-xs font-semibold tabular-nums">{line.qty}</span>
                      <button onClick={() => onAdd(restaurant, line.item)} aria-label={`Add one ${line.item.name}`}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="w-14 text-right text-sm tabular-nums">₹{line.item.price * line.qty}</span>
                  </div>
                ))}
              </div>

              <DemoControls
                courier={courier}
                setCourier={setCourier}
                overrides={overrides}
                setOverrides={setOverrides}
                context={context}
              />

              {error && (
                <p className="rounded-lg border border-brand-600/30 bg-brand-50 px-3 py-2.5 text-xs text-brand-700">
                  {error}
                </p>
              )}
            </div>

            <div className="shrink-0 border-t border-black/[.07] p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-sm text-ink-500">Total</span>
                <span className="text-lg font-bold tabular-nums">₹{total}</span>
              </div>
              <button
                onClick={onPlaceOrder}
                disabled={placing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {placing ? <><Loader2 size={16} className="animate-spin" /> Predicting…</> : 'Place order'}
              </button>
              <p className="mt-2 text-center text-[11px] text-ink-300">
                Placing the order runs the LightGBM model on the row above.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
