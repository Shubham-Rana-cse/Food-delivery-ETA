import { Cpu, Hand, Radar } from 'lucide-react'

// Source tells the reader where each value came from. That's the whole point of
// the panel: it makes the pipeline in report §12 visible while you shop.
const SOURCE_META = {
  auto: { Icon: Radar, tone: 'text-sky-600', label: 'detected' },
  selection: { Icon: Hand, tone: 'text-brand-600', label: 'from your choices' },
  assigned: { Icon: Cpu, tone: 'text-violet-600', label: 'assigned' },
}

function Row({ name, value, source, note }) {
  const meta = SOURCE_META[source]
  return (
    <div className="flex items-center gap-3 border-b border-black/[.05] py-2 last:border-0">
      <meta.Icon size={13} className={`shrink-0 ${meta.tone}`} />
      <div className="min-w-0 flex-1">
        <code className="block truncate font-mono text-[11px] text-ink-700">{name}</code>
        {note && <span className="text-[10px] text-ink-300">{note}</span>}
      </div>
      <code className="shrink-0 font-mono text-[11px] font-medium tabular-nums text-ink-900">
        {value}
      </code>
    </div>
  )
}

export default function ModelInputsPanel({ features, ready }) {
  return (
    <aside className="sticky top-24 rounded-2xl border border-black/[.07] bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-bold">Model inputs</h3>
        <span className="label-eyebrow">11 raw → 20 encoded</span>
      </div>
      <p className="mt-1 text-xs text-ink-500">
        {ready
          ? 'This exact row is what gets sent to LightGBM.'
          : 'Pick a restaurant to start filling this in.'}
      </p>

      <div className="mt-3">
        <Row name="distance_km" value={features.distance_km?.toFixed(2) ?? '—'} source="selection" note="haversine, restaurant → address" />
        <Row name="City" value={features.City ?? '—'} source="selection" />
        <Row name="order_hour" value={features.order_hour ?? '—'} source="auto" />
        <Row name="Weather_conditions" value={features.Weather_conditions ?? '—'} source="auto" note="Open-Meteo" />
        <Row name="Road_traffic_density" value={features.Road_traffic_density ?? '—'} source="auto" />
        <Row name="Festival" value={features.Festival ?? '—'} source="auto" />
        <Row name="Delivery_person_Age" value={features.Delivery_person_Age ?? '—'} source="assigned" />
        <Row name="Delivery_person_Ratings" value={features.Delivery_person_Ratings ?? '—'} source="assigned" />
        <Row name="multiple_deliveries" value={features.multiple_deliveries ?? '—'} source="assigned" />
        <Row name="Vehicle_condition" value={features.Vehicle_condition ?? '—'} source="assigned" />
        <Row name="Type_of_vehicle" value={features.Type_of_vehicle ?? '—'} source="assigned" />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-black/[.07] pt-2.5">
        {Object.entries(SOURCE_META).map(([key, { Icon, tone, label }]) => (
          <span key={key} className="flex items-center gap-1 text-[10px] text-ink-500">
            <Icon size={10} className={tone} /> {label}
          </span>
        ))}
      </div>

      <p className="mt-3 rounded-lg bg-ink-900/[.03] p-2.5 text-[11px] leading-relaxed text-ink-500">
        Cuisine and dish choices are recorded but not fed to the model —{' '}
        <code className="font-mono">Type_of_order</code> spread just 0.22 min across 43,853 rows, so it was dropped.
      </p>
    </aside>
  )
}
