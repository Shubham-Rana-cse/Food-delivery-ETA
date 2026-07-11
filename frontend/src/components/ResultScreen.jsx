import { AlertTriangle, Bike, Check } from 'lucide-react'

export default function ResultScreen({ result, restaurant, address, courier, onReset }) {
  const { predicted_minutes, eta_low, eta_high, mae, features_used, warnings } = result

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 animate-fade-up">
      <div className="flex items-center gap-2 text-emerald-600">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white">
          <Check size={14} strokeWidth={3} />
        </span>
        <span className="text-sm font-semibold">Order placed</span>
      </div>

      {/* The number is the hero. Range first, point estimate second — an honest
          reading of a 3.11-minute MAE. */}
      <div className="mt-6 rounded-3xl border border-black/[.07] bg-gradient-to-b from-brand-50 to-white p-8">
        <p className="label-eyebrow">Estimated arrival</p>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="text-7xl font-extrabold leading-none tracking-tighter tabular-nums text-brand-600">
            {eta_low}–{eta_high}
          </span>
          <span className="text-xl font-semibold text-ink-500">min</span>
        </p>
        <p className="mt-3 text-sm text-ink-500">
          Point estimate <span className="font-mono font-medium text-ink-900">{predicted_minutes.toFixed(1)} min</span>,
          shown as a window of ±{mae} min — the model's mean absolute error on held-out data.
        </p>

        <div className="mt-6 flex items-center gap-3 rounded-xl bg-white p-3">
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
            <Bike size={16} />
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-600" />
          </span>
          <div className="text-xs">
            <p className="font-semibold">{courier.name} is picking up from {restaurant.name}</p>
            <p className="text-ink-500">
              Dropping at {address.label} · {features_used.distance_km} km ·{' '}
              {features_used.multiple_deliveries} stop(s) on this trip
            </p>
          </div>
        </div>
      </div>

      {warnings?.length > 0 && (
        <div className="mt-4 space-y-2">
          {warnings.map((w) => (
            <p key={w} className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
              <AlertTriangle size={14} className="mt-px shrink-0" />
              {w}
            </p>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-black/[.07] p-5">
        <h3 className="text-sm font-bold">The row the model saw</h3>
        <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
          {Object.entries(features_used).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-black/[.05] py-1.5">
              <dt className="font-mono text-[11px] text-ink-500">{k}</dt>
              <dd className="font-mono text-[11px] font-medium tabular-nums">{String(v)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <button
        onClick={onReset}
        className="mt-6 rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold transition hover:border-brand-600 hover:text-brand-600"
      >
        Order something else
      </button>
    </div>
  )
}
