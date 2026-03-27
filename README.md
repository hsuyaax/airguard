# AirGuard

**Hyper-local, real-time air quality intelligence for Delhi's 250 wards.**

Built by **Team AKX** for **India Innovates 2026** — Municipal Corporation of Delhi.

---

## What It Does

AirGuard maps air pollution to the ward level across Delhi using live CPCB station data, satellite imagery, and predictive ML models. It provides:

- **250-ward AQI heatmap** interpolated from 28 live CPCB stations via IDW/Kriging
- **8-type source apportionment** (road dust, construction, biomass, traffic, industrial, secondary aerosols, waste burning, diesel generators)
- **48-hour PM2.5 forecasts** with confidence intervals (Prophet + LSTM)
- **AI-powered enforcement notices** citing Air Act 1981 (Groq Llama-3.3 70B)
- **What-if policy simulator** with 9 interventions and per-source impact
- **Command center** for MCD officers with decision queue and compliance tracking
- **Equity-first alerts** prioritizing schools and hospitals in red zones
- **Citizen complaint portal** for ground-truth pollution reporting
- **PDF briefing generator** for daily commissioner reports

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js 16 Frontend (Clerk Auth + Supabase)            │
│  10 dashboard pages + 15 API routes + landing + auth    │
└──────────────────────────┬──────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌───────────┐    ┌───────────┐    ┌───────────┐
   │ WAQI API  │    │ OWM API   │    │ Groq API  │
   │ 28 stations│    │ Weather   │    │ LLM Gen   │
   └───────────┘    └───────────┘    └───────────┘
         │
         ▼
   ┌───────────────────────────────────────────────┐
   │  Supabase (PostgreSQL)                        │
   │  stations, readings, complaints, notices,     │
   │  aqi_history, weather, alert_log              │
   └───────────────────────────────────────────────┘
         │
         ▼ (optional)
   ┌───────────────────────────────────────────────┐
   │  FastAPI ML Backend (Python)                  │
   │  XGBoost, Prophet, LSTM, Kriging, LOSO CV     │
   └───────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Recharts |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| Maps | Leaflet, SVG isometric 3D |
| AQI Data | WAQI API (28 Delhi CPCB stations) |
| Weather | OpenWeatherMap |
| AI/LLM | Groq (Llama-3.3 70B) |
| ML Models | XGBoost, Prophet, LSTM, IDW, Kriging |
| ML Backend | FastAPI + Python (optional) |

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-username/airguard.git
cd airguard
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Fill in your API keys in `.env.local`:

| Key | Where to get it | Required |
|-----|----------------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [clerk.com](https://dashboard.clerk.com) | Yes |
| `CLERK_SECRET_KEY` | [clerk.com](https://dashboard.clerk.com) | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | [supabase.com](https://supabase.com/dashboard) | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | Yes |
| `WAQI_API_TOKEN` | [aqicn.org](https://aqicn.org/data-platform/token/) | Yes |
| `OWM_API_KEY` | [openweathermap.org](https://openweathermap.org/appid) | Yes |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com/keys) | For AI notices |

### 3. Set up database

Paste the contents of `supabase-schema.sql` into your Supabase SQL Editor and run it. This creates 8 tables with indexes and RLS policies.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. (Optional) ML Backend

For real XGBoost/Prophet/LSTM inference:

```bash
cd ml-api
pip install -r requirements.txt
python train_all.py   # Train models
python server.py      # Start on port 8000
```

## Project Structure

```
airguard/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout (Clerk provider)
│   │   ├── sign-in/                    # Clerk sign-in
│   │   ├── sign-up/                    # Clerk sign-up
│   │   ├── dashboard/
│   │   │   ├── layout.tsx              # Dashboard shell (sidebar, topnav, ticker)
│   │   │   ├── page.tsx               # Citizen Dashboard
│   │   │   ├── admin/                 # Admin Dashboard (sources, simulator, notices)
│   │   │   ├── command/               # Command Center (decision queue, compliance)
│   │   │   ├── alerts/                # Alerts & Health Advisories
│   │   │   ├── trends/                # Historical Trends
│   │   │   ├── weather/               # Weather & Satellite
│   │   │   ├── report/                # PDF Report Generator
│   │   │   ├── complaints/            # Citizen Complaint Portal
│   │   │   ├── api-docs/              # Interactive API Documentation
│   │   │   └── about/                 # About & System Status
│   │   └── api/
│   │       ├── stations/              # Live CPCB station data
│   │       ├── wards/                 # 250-ward interpolated AQI
│   │       ├── weather/               # Delhi meteorology
│   │       ├── forecast/              # 48h PM2.5 prediction
│   │       ├── sources/               # Source apportionment
│   │       ├── simulator/             # What-if policy simulation
│   │       ├── enforcement/           # Notice generation
│   │       ├── chat/                  # AI Copilot (Groq)
│   │       ├── complaints/            # Citizen reports CRUD
│   │       ├── history/               # AQI trend history
│   │       ├── satellite/             # AOD data
│   │       ├── validate/              # LOSO cross-validation
│   │       └── vulnerability/         # Ward vulnerability index
│   ├── components/
│   │   ├── Sidebar.tsx                # Navigation sidebar
│   │   ├── TopNav.tsx                 # Glassmorphic top bar
│   │   ├── TickerTape.tsx             # Live sensor data strip
│   │   ├── AICopilot.tsx              # Floating AI chat panel
│   │   ├── NotificationBell.tsx       # Alert notifications
│   │   ├── AqiMap.tsx                 # Leaflet choropleth map
│   │   ├── Aqi3DView.tsx             # SVG isometric pillars
│   │   ├── ForecastChart.tsx          # Recharts forecast
│   │   ├── SourceChart.tsx            # Pie + bar source charts
│   │   ├── AqiHistogram.tsx           # Ward distribution
│   │   ├── WindRoseChart.tsx          # Wind direction visual
│   │   └── ...                        # Badges, legends, cards
│   └── lib/
│       ├── supabase.ts                # Supabase client setup
│       ├── db.ts                      # Database operations (8 tables)
│       ├── ingestion.ts               # WAQI + OWM API clients
│       ├── aqi.ts                     # AQI conversion, colors, categories
│       ├── enforcement.ts             # Notice generator (template + Groq)
│       ├── simulator.ts               # What-if policy engine
│       ├── forecaster.ts              # Linear/flat forecast fallback
│       ├── kriging.ts                 # Ordinary Kriging interpolation
│       ├── satellite.ts               # Synthetic AOD module
│       ├── vulnerability.ts           # Ward vulnerability index
│       ├── alerts.ts                  # GRAP alerts, health advisories
│       ├── history.ts                 # LocalStorage trend accumulator
│       ├── notifications.ts           # Browser push notifications
│       ├── ml-client.ts              # FastAPI ML backend client
│       ├── data-loader.ts            # CSV + GeoJSON file loader
│       └── ...                        # Config, types, utils
├── public/data/
│   ├── stations/delhi_stations.csv    # 39 CPCB station coordinates
│   └── geojson/delhi_wards_2022.geojson # 250 ward boundaries
├── ml-api/
│   ├── server.py                      # FastAPI ML inference server
│   ├── train_all.py                   # Model training pipeline
│   └── requirements.txt               # Python dependencies
├── supabase-schema.sql                # Database schema (8 tables)
└── .env.example                       # Environment variable template
```

## Data Sources

| Source | Type | Update Frequency |
|--------|------|-----------------|
| WAQI (aqicn.org) | AQI, PM2.5, PM10, NO2, SO2, CO | Live (~15 min) |
| OpenWeatherMap | Wind, temperature, humidity, pressure | Live |
| SAFAR (IITM) | Published source profiles | Seasonal reference |
| Sentinel-5P | Aerosol Optical Depth | Synthetic |
| Supabase | Historical readings, complaints, notices | Persistent |

## ML Models

| Model | Purpose | Validation |
|-------|---------|-----------|
| XGBoost | 8-class source classification (16 features) | 5-fold CV |
| Prophet | Per-station 48h PM2.5 forecast | Historical backtest |
| LSTM | 2-layer neural forecast (24h lookback) | Train/val split |
| IDW | Spatial interpolation (39→250 wards) | LOSO CV, R²=0.847 |
| Kriging | Variogram-based spatial interpolation | LOSO CV |
| Fingerprinting | Ratio-based source heuristic (fallback) | Expert validation |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stations` | Live CPCB station data (28 stations) |
| GET | `/api/wards` | Ward-level AQI for 250+ wards |
| GET | `/api/weather` | Current Delhi meteorology |
| GET | `/api/forecast` | 48h PM2.5 prediction |
| GET | `/api/sources` | Pollution source breakdown |
| POST | `/api/simulator` | What-if policy simulation |
| POST | `/api/enforcement` | Generate enforcement notice |
| POST | `/api/chat` | AI copilot conversation |
| GET | `/api/complaints` | List citizen reports |
| POST | `/api/complaints` | Submit pollution report |
| GET | `/api/history` | AQI trend history |
| GET | `/api/satellite` | AOD satellite data |
| GET | `/api/validate` | LOSO cross-validation metrics |
| GET | `/api/vulnerability` | Ward vulnerability index |

## Team

**Team AKX** — India Innovates 2026

- **Aayush Kumar** — Lead System Architect
- **Shourya Singh** — Data Intelligence
- **Divyansh Aggarwal** — Geospatial Engineering

## License

MIT
