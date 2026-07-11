import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchContext, haversineKm, predictETA } from './api'
import CartDrawer from './components/CartDrawer'
import Header from './components/Header'
import MenuModal from './components/MenuModal'
import ModelInputsPanel from './components/ModelInputsPanel'
import ResultScreen from './components/ResultScreen'
import RestaurantCard from './components/RestaurantCard'
import { ADDRESSES, randomCourier } from './data/addresses'
import { CUISINES, RESTAURANTS } from './data/restaurants'

const CONTEXT_REFRESH_MS = 5 * 60 * 1000

export default function App() {
  const [address, setAddress] = useState(ADDRESSES[0])
  const [context, setContext] = useState(null)
  const [contextError, setContextError] = useState(null)

  const [cuisineId, setCuisineId] = useState('all')
  const [openRestaurant, setOpenRestaurant] = useState(null)
  const [cart, setCart] = useState([]) // [{ restaurant, item, qty }]
  const [cartOpen, setCartOpen] = useState(false)

  const [courier, setCourier] = useState(randomCourier)
  const [overrides, setOverrides] = useState({})

  const [result, setResult] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState(null)

  // --- Auto-collected context: time, weather, traffic, festival ------------
  const loadContext = useCallback(() => {
    fetchContext({ lat: address.lat, lng: address.lng })
      .then((c) => { setContext(c); setContextError(null) })
      .catch((e) => setContextError(e.message))
  }, [address])

  useEffect(() => {
    loadContext()
    const id = setInterval(loadContext, CONTEXT_REFRESH_MS)
    return () => clearInterval(id)
  }, [loadContext])

  // --- Derived ------------------------------------------------------------
  const cartRestaurant = cart[0]?.restaurant ?? null

  const distanceTo = useCallback(
    (r) => haversineKm(r.lat, r.lng, address.lat, address.lng),
    [address],
  )

  const visible = useMemo(
    () => (cuisineId === 'all' ? RESTAURANTS : RESTAURANTS.filter((r) => r.cuisineId === cuisineId)),
    [cuisineId],
  )

  /** The 11 raw features, assembled from selections + context + overrides. */
  const features = useMemo(() => {
    const r = cartRestaurant ?? openRestaurant
    return {
      distance_km: r ? distanceTo(r) : undefined,
      City: r?.city,
      order_hour: overrides.order_hour ?? context?.order_hour,
      Weather_conditions: overrides.Weather_conditions ?? context?.weather,
      Road_traffic_density: overrides.Road_traffic_density ?? context?.road_traffic_density,
      Festival: overrides.Festival ?? context?.festival,
      Delivery_person_Age: courier.Delivery_person_Age,
      Delivery_person_Ratings: courier.Delivery_person_Ratings,
      multiple_deliveries: courier.multiple_deliveries,
      Vehicle_condition: courier.Vehicle_condition,
      Type_of_vehicle: courier.Type_of_vehicle,
    }
  }, [cartRestaurant, openRestaurant, distanceTo, overrides, context, courier])

  // --- Cart ---------------------------------------------------------------
  const addItem = (restaurant, item) => {
    setCart((prev) => {
      // One restaurant per order, like the real thing.
      if (prev.length && prev[0].restaurant.id !== restaurant.id) {
        return [{ restaurant, item, qty: 1 }]
      }
      const existing = prev.find((l) => l.item.id === item.id)
      if (existing) return prev.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l))
      return [...prev, { restaurant, item, qty: 1 }]
    })
  }

  const removeItem = (item) =>
    setCart((prev) =>
      prev.flatMap((l) => (l.item.id !== item.id ? [l] : l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : [])),
    )

  // --- Predict ------------------------------------------------------------
  const placeOrder = async () => {
    if (!cartRestaurant || !context) return
    setPlacing(true)
    setError(null)
    try {
      const res = await predictETA({
        restaurant_lat: cartRestaurant.lat,
        restaurant_lng: cartRestaurant.lng,
        delivery_lat: address.lat,
        delivery_lng: address.lng,
        City: cartRestaurant.city,
        order_hour: features.order_hour,
        Weather_conditions: features.Weather_conditions,
        Road_traffic_density: features.Road_traffic_density,
        Festival: features.Festival,
        Delivery_person_Age: features.Delivery_person_Age,
        Delivery_person_Ratings: features.Delivery_person_Ratings,
        multiple_deliveries: features.multiple_deliveries,
        Vehicle_condition: features.Vehicle_condition,
        Type_of_vehicle: features.Type_of_vehicle,
      })
      setResult(res)
      setCartOpen(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setPlacing(false)
    }
  }

  const reset = () => {
    setResult(null)
    setCart([])
    setOverrides({})
    setCourier(randomCourier())
  }

  // --- Render -------------------------------------------------------------
  if (result) {
    return (
      <div className="min-h-screen">
        <Header address={address} onAddressChange={setAddress} context={context} cartCount={0} onOpenCart={() => {}} />
        <ResultScreen
          result={result}
          restaurant={cartRestaurant}
          address={address}
          courier={courier}
          onReset={reset}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header
        address={address}
        onAddressChange={setAddress}
        context={context}
        cartCount={cart.reduce((s, l) => s + l.qty, 0)}
        onOpenCart={() => setCartOpen(true)}
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="max-w-xl">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Order dinner. Watch a regression model guess how long it takes.
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-ink-500">
            Every tap fills one cell of a feature row. Placing the order sends that row to a LightGBM
            model trained on 40,344 Zomato deliveries — R² 0.83, mean error 3.11 minutes.
          </p>
        </div>

        {contextError && (
          <p className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            Couldn't reach the prediction service ({contextError}). Start the Flask API on port 5000,
            then reload.
          </p>
        )}

        {/* Cuisine filter — sets Type_of_order, which the model doesn't use. */}
        <div className="mt-8 flex flex-wrap gap-2">
          {CUISINES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCuisineId(c.id)}
              className={`chip ${cuisineId === c.id ? 'chip-active' : ''}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} distanceKm={distanceTo(r)} onSelect={setOpenRestaurant} />
            ))}
          </div>

          <ModelInputsPanel features={features} ready={Boolean(cartRestaurant ?? openRestaurant)} />
        </div>
      </main>

      <MenuModal
        restaurant={openRestaurant}
        cart={openRestaurant ? cart.filter((l) => l.restaurant.id === openRestaurant.id) : []}
        onAdd={addItem}
        onRemove={removeItem}
        onClose={() => setOpenRestaurant(null)}
        onGoToCart={() => { setOpenRestaurant(null); setCartOpen(true) }}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        restaurant={cartRestaurant}
        address={address}
        distanceKm={cartRestaurant ? distanceTo(cartRestaurant) : 0}
        courier={courier}
        setCourier={setCourier}
        overrides={overrides}
        setOverrides={setOverrides}
        context={context}
        onAdd={addItem}
        onRemove={removeItem}
        onPlaceOrder={placeOrder}
        placing={placing}
        error={error}
      />
    </div>
  )
}
