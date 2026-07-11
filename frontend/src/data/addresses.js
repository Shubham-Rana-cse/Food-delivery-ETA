// Saved addresses, like the ones a real account would have. Coordinates are
// chosen so that every restaurant/address pair lands inside the 1.47-20.97 km
// window the model was actually trained on.

export const ADDRESSES = [
  { id: 'home', label: 'Home', line: '12 Rajpur Road, Dehradun', lat: 30.345, lng: 78.057, icon: 'home' },
  { id: 'work', label: 'Work', line: 'IT Park, Sahastradhara Road', lat: 30.39, lng: 78.07, icon: 'briefcase' },
  { id: 'friend', label: "Sahil's place", line: 'Clement Town, Dehradun', lat: 30.265, lng: 78.0, icon: 'map-pin' },
]

export const VEHICLE_TYPES = ['motorcycle', 'scooter', 'electric_scooter']

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const between = (min, max) => min + Math.random() * (max - min)

// Weighted to match the training marginals in report §4.2 so the "random"
// courier the app assigns is a plausible one, not a uniform draw.
const weighted = (pairs) => {
  const total = pairs.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [value, w] of pairs) {
    if ((r -= w) <= 0) return value
  }
  return pairs[pairs.length - 1][0]
}

export function randomCourier() {
  return {
    Delivery_person_Age: Math.round(between(18, 50)),
    Delivery_person_Ratings: Number(between(4.2, 5.0).toFixed(1)),
    multiple_deliveries: weighted([[1, 27060], [0, 14530], [2, 1920], [3, 343]]),
    Vehicle_condition: weighted([[0, 1], [1, 1], [2, 1]]),
    Type_of_vehicle: weighted([
      ['motorcycle', 25627],
      ['scooter', 14692],
      ['electric_scooter', 3534],
    ]),
    name: pick(['Ravi Kumar', 'Aman Sharma', 'Priya Negi', 'Rohit Dhasmana', 'Sunil Mahtre', 'Kavya Singh']),
  }
}
