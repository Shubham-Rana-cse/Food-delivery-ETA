# Tastebud — food delivery ETA, predicted

A Zomato-style ordering UI where every interaction fills one cell of a feature row.
Placing the order sends that row to your LightGBM model (R² 0.8302, MAE 3.11 min).

```
delivery-eta/
├── backend/
│   ├── app.py                  Flask API: /api/health, /api/context, /api/predict
│   ├── predictor.py            Loads the .pkl, rebuilds training-time encoding
│   ├── weather.py              Open-Meteo → Weather_conditions category
│   ├── utils.py                haversine, traffic heuristic, festival calendar, validation
│   ├── make_dummy_model.py     Throwaway model so you can test before exporting the real one
│   ├── requirements.txt
│   ├── .env.example
│   └── models/
│       ├── lgbm_delivery_model.pkl    ← you supply
│       └── feature_columns.pkl        ← you supply
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js          Proxies /api → localhost:5000 in dev
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx             State hub: assembles the 11 raw features
        ├── index.css
        ├── api.js
        ├── data/
        │   ├── restaurants.js  Hardcoded coords, city type, cuisine, menus
        │   └── addresses.js    Saved addresses + weighted random courier
        └── components/
            ├── Header.jsx          Address picker + live time/weather/traffic strip
            ├── RestaurantCard.jsx
            ├── MenuModal.jsx
            ├── CartDrawer.jsx
            ├── DemoControls.jsx    Sliders to override any input
            ├── ModelInputsPanel.jsx  Live feature row, colour-coded by source
            └── ResultScreen.jsx     ETA window + the exact row the model saw
```

## Where each feature comes from

| Feature | Source |
|---|---|
| `distance_km` | haversine(restaurant coords, saved address coords) |
| `City` | attached to the restaurant you pick |
| `order_hour` | server clock (`Asia/Kolkata`) |
| `Weather_conditions` | Open-Meteo, WMO code → one of the six trained classes |
| `Road_traffic_density` | rush-hour curve from `order_hour` (stand-in for a traffic feed) |
| `Festival` | hardcoded date list |
| `Delivery_person_Age`, `_Ratings`, `multiple_deliveries`, `Vehicle_condition`, `Type_of_vehicle` | auto-assigned courier, overridable in **Tune the inputs** |

Cuisine is recorded and displayed, but never sent — `Type_of_order` was dropped in §6.

## Run it

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# Put lgbm_delivery_model.pkl + feature_columns.pkl in models/
# Or, to test the wiring first:
python make_dummy_model.py

python app.py            # http://localhost:5000
curl localhost:5000/api/health
```

**Frontend**

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

No CORS config needed in dev — Vite proxies `/api` to Flask.
