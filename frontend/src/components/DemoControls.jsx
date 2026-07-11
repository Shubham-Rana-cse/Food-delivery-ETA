import { Dices, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { randomCourier, VEHICLE_TYPES } from '../data/addresses'

const WEATHERS = ['Sunny', 'Cloudy', 'Fog', 'Stormy', 'Windy', 'Sandstorms']
const TRAFFIC = ['Low', 'Medium', 'High', 'Jam']

function Slider({ label, hint, value, min, max, step, onChange, format }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-ink-700">{label}</span>
        <span className="font-mono text-xs tabular-nums text-brand-600">{format ? format(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-brand-600"
      />
      {hint && <span className="mt-0.5 block text-[11px] text-ink-300">{hint}</span>}
    </label>
  )
}

function Segmented({ label, options, value, onChange, formatOption }) {
  return (
    <div>
      <span className="text-xs font-semibold text-ink-700">{label}</span>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`chip ${value === opt ? 'chip-active' : ''}`}
          >
            {formatOption ? formatOption(opt) : opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function DemoControls({ courier, setCourier, overrides, setOverrides, context }) {
  const [open, setOpen] = useState(false)

  const patchCourier = (patch) => setCourier((c) => ({ ...c, ...patch }))
  const patchOverride = (patch) => setOverrides((o) => ({ ...o, ...patch }))

  return (
    <section className="rounded-xl border border-black/[.07] bg-ink-900/[.02]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <SlidersHorizontal size={15} className="text-ink-500" />
        <span className="text-sm font-semibold">Tune the inputs</span>
        <span className="ml-auto text-xs text-ink-500">{open ? 'Hide' : 'Show'}</span>
      </button>

      {!open && (
        <p className="px-4 pb-3 text-xs text-ink-500">
          {courier.name} · {courier.Delivery_person_Age} yrs · ★{courier.Delivery_person_Ratings} ·{' '}
          {courier.multiple_deliveries} stop(s) — assigned automatically, like a real app.
        </p>
      )}

      {open && (
        <div className="space-y-5 border-t border-black/[.07] px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="label-eyebrow">Assigned courier</p>
              <p className="text-sm font-semibold">{courier.name}</p>
            </div>
            <button
              onClick={() => setCourier(randomCourier())}
              className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold transition hover:border-brand-600 hover:text-brand-600"
            >
              <Dices size={13} /> Reassign
            </button>
          </div>

          <Slider
            label="Courier age"
            hint="Training range 20–39. Ranked 5th in feature importance."
            value={courier.Delivery_person_Age}
            min={20}
            max={39}
            step={1}
            onChange={(v) => patchCourier({ Delivery_person_Age: v })}
          />

          <Slider
            label="Courier rating"
            hint="Strongest single feature (0.225). Flattens above 4.5."
            value={courier.Delivery_person_Ratings}
            min={2.5}
            max={5}
            step={0.1}
            onChange={(v) => patchCourier({ Delivery_person_Ratings: Number(v.toFixed(1)) })}
            format={(v) => `★ ${v.toFixed(1)}`}
          />

          <Slider
            label="Orders bundled on this trip"
            hint="0 → 3. Monotonic: each extra stop adds real minutes."
            value={courier.multiple_deliveries}
            min={0}
            max={3}
            step={1}
            onChange={(v) => patchCourier({ multiple_deliveries: v })}
          />

          <Segmented
            label="Vehicle condition"
            options={[0, 1, 2]}
            value={courier.Vehicle_condition}
            onChange={(v) => patchCourier({ Vehicle_condition: v })}
            formatOption={(v) => ['Poor (0)', 'Fair (1)', 'Good (2)'][v]}
          />

          <Segmented
            label="Vehicle"
            options={VEHICLE_TYPES}
            value={courier.Type_of_vehicle}
            onChange={(v) => patchCourier({ Type_of_vehicle: v })}
            formatOption={(v) => v.replace('_', ' ')}
          />

          <div className="space-y-4 rounded-lg border border-dashed border-black/15 p-3">
            <p className="label-eyebrow">Override what the app detected</p>

            <Segmented
              label={`Weather (detected: ${context?.weather ?? '—'})`}
              options={WEATHERS}
              value={overrides.Weather_conditions ?? context?.weather}
              onChange={(v) => patchOverride({ Weather_conditions: v })}
            />

            <Segmented
              label={`Traffic (detected: ${context?.road_traffic_density ?? '—'})`}
              options={TRAFFIC}
              value={overrides.Road_traffic_density ?? context?.road_traffic_density}
              onChange={(v) => patchOverride({ Road_traffic_density: v })}
            />

            <Slider
              label={`Order hour (now: ${context?.order_hour ?? '—'}:00)`}
              hint="Dinner rush 17–21 costs the most minutes."
              value={overrides.order_hour ?? context?.order_hour ?? 12}
              min={0}
              max={23}
              step={1}
              onChange={(v) => patchOverride({ order_hour: v })}
              format={(v) => `${String(v).padStart(2, '0')}:00`}
            />

            <label className="flex cursor-pointer items-center justify-between">
              <span>
                <span className="text-xs font-semibold text-ink-700">Festival day</span>
                <span className="block text-[11px] text-ink-300">Adds ~19 min. Only 2% of training rows.</span>
              </span>
              <input
                type="checkbox"
                checked={(overrides.Festival ?? context?.festival) === 'Yes'}
                onChange={(e) => patchOverride({ Festival: e.target.checked ? 'Yes' : 'No' })}
                className="h-4 w-8 cursor-pointer appearance-none rounded-full bg-black/15 transition checked:bg-brand-600"
              />
            </label>

            <button
              onClick={() => setOverrides({})}
              className="text-xs font-semibold text-ink-500 underline underline-offset-2 hover:text-brand-600"
            >
              Reset to detected values
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
