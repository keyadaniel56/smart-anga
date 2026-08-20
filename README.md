# Smart Anga - Climate Risk Intelligence & Resilience Platform

A full-stack climate monitoring and disaster resilience platform providing real-time climate risk assessment, flood/drought monitoring, SME business continuity planning, and incident command dispatch.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4 |
| Charts | Recharts |
| Maps | Leaflet |
| Icons | Lucide React |
| Backend (Dev) | Express.js (Node), Open-Meteo API |
| Backend (Prod) | Go 1.25, stdlib only (zero dependencies) |

## Project Structure

```
anga/
├── package.json                          # Root monorepo (workspaces)
│
├── frontend/                             # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx                # Sticky header, location selector, live clock
│   │   │   ├── NavigationTabs.tsx        # 8-tab navigation with badges
│   │   │   ├── RiskMap.tsx               # Leaflet GIS map, 6 toggleable layers
│   │   │   ├── FloodPredictionModule.tsx # Hydrograph, return periods, defense toggles
│   │   │   ├── DroughtAssessmentModule.tsx # SPEI index, soil moisture, crop matrix
│   │   │   ├── VulnerabilityDashboard.tsx # Radar chart, sector VaR, asset registry
│   │   │   ├── EarlyWarningModule.tsx    # Incident command + CAP broadcast studio
│   │   │   ├── SMEPreparednessModule.tsx # SME profiles, facility hardening toggles
│   │   │   ├── ScenarioSimulator.tsx     # Climate stress-testing sliders & presets
│   │   │   └── LiveSensorFeed.tsx        # IoT sensor list, telemetry chart, gauge logging
│   │   ├── services/
│   │   │   └── api.ts                    # REST API client (weather, incidents)
│   │   ├── types/
│   │   │   └── climate.ts                # TypeScript interfaces
│   │   ├── data/
│   │   │   └── mockClimateData.ts        # 7 global hotspots, sensors, assets, alerts
│   │   ├── App.tsx                       # Main app shell, state management, tab routing
│   │   ├── main.tsx                      # Entry point
│   │   └── index.css                     # Tailwind v4 + dark theme overrides
│   ├── index.html
│   ├── vite.config.ts                    # Dev proxy /api -> localhost:3000
│   ├── tsconfig.json
│   └── package.json
│
└── backend/
    ├── node/                             # Express dev server
    │   ├── server.ts                     # API routes + Vite middleware
    │   └── package.json
    └── (Go backend)                      # Clean-architecture production server
        ├── cmd/server/main.go
        ├── internal/
        │   ├── config/config.go
        │   ├── models/models.go
        │   ├── store/store.go
        │   ├── services/openmeteo.go
        │   ├── handlers/{climate,incidents,helpers}.go
        │   ├── middleware/middleware.go
        │   └── router/router.go
        ├── go.mod                        # Zero external dependencies
        └── Makefile
```

## Getting Started

### Prerequisites

- Node.js >= 18
- Go >= 1.21 (for production backend)

### Install Dependencies

```bash
npm install
```

### Run Development

```bash
npm run dev          # Starts both frontend and backend concurrently
npm run dev:frontend # Frontend only (Vite dev server on :5173)
npm run dev:backend  # Backend only (Express on :3000)
```

### Build for Production

```bash
npm run build
npm run start        # Serves from backend/node on port 3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/climate/live?lat=&lon=` | Live weather + flood data from Open-Meteo |
| `GET` | `/api/incidents` | List all incidents |
| `POST` | `/api/incidents` | Create new incident |
| `PATCH` | `/api/incidents/:id` | Update incident status |

## Frontend Modules

| Tab | Component | Description |
|-----|-----------|-------------|
| Overview & GIS | `RiskMap` | Interactive Leaflet map with flood, drought, heat, asset, sensor, and incident layers |
| Flood Prediction | `FloodPredictionModule` | Hydrograph chart, 10/50/100yr return periods, flood defense controls |
| Drought Assessment | `DroughtAssessmentModule` | SPEI index trends, soil moisture stratigraphy, crop vulnerability matrix |
| Vulnerability & VaR | `VulnerabilityDashboard` | Radar chart, sector value-at-risk, critical infrastructure registry |
| EWS & Dispatch | `EarlyWarningModule` | Incident command board, CAP broadcast studio with 5-channel selector |
| SME Preparedness | `SMEPreparednessModule` | SME profile selector, facility hardening diagnostic toggles |
| Climate Stress Studio | `ScenarioSimulator` | Precipitation, temperature, drought, river sliders with presets |
| IoT Sensors | `LiveSensorFeed` | Sensor telemetry, 24hr chart, manual gauge logging with anomaly detection |

## Frontend Issues

### Assigned to Bellah

#### 1. Fix Weather API Response Parsing
**Priority: High**
**File:** `frontend/src/services/api.ts`

The `fetchLiveClimate` function returns the full API envelope `{success, coordinates, weather, flood, fetchedAt}` instead of extracting the actual weather data. The frontend then reads `liveWeather.humidity` but the real data is at `liveWeather.weather.humidity`. This causes all live weather displays to show `undefined`.

**Task:** Transform the Open-Meteo API response into the `LiveWeatherData` interface shape. Map `response.weather.current` fields to the flat `LiveWeatherData` structure and attach `response.flood` data to `floodForecast`.

#### 2. Implement Scenario Simulator Output Panel
**Priority: High**
**File:** `frontend/src/components/ScenarioSimulator.tsx`

The simulator has 4 input sliders and 3 presets but renders no output. When the user adjusts parameters, nothing happens.

**Task:** Add an output/results section that displays:
- Estimated flood inundation area (km²)
- Projected economic exposure ($)
- Crop yield impact estimate (%)
- Infrastructure cascade risk level
- Recommended mitigation actions
- A "Run Simulation" button that computes impacts client-side based on slider values

#### 3. Persist Incident Creation to Backend
**Priority: Medium**
**File:** `frontend/src/App.tsx`

`handleCreateIncident` adds incidents to local state only. They disappear on refresh.

**Task:** Call the `createIncident` API function (already in `api.ts`) from `handleCreateIncident` so new incidents are persisted to the backend. After the POST succeeds, update local state with the server-returned incident (which includes the proper ID and timestamp).

#### 4. Connect Overview Dashboard to Live State
**Priority: Medium**
**File:** `frontend/src/App.tsx`

The Overview tab has hardcoded "Early Warning Feed" items and a static "Historical Trends" bar chart. These should reflect actual app state.

**Task:**
- Replace the hardcoded early warning feed with the first 3 items from the `alerts` state array
- Wire the "Automated Report" card to open a downloadable summary (or remove if not needed)
- Make the "Data Integration" panel reflect actual API connection status

#### 5. Fix SME Profile Toggle Persistence
**Priority: Low**
**File:** `frontend/src/components/SMEPreparednessModule.tsx`

The `toggleMeasure` function updates local React state only. There is no backend endpoint to persist SME facility changes.

**Task:** Since no backend endpoint exists yet, either:
- Add a `PATCH /api/sme/:id` endpoint to the Node backend for persisting SME profile changes, or
- Document this as a known limitation and add a visual indicator that changes are session-only

### Assigned to Tedy

#### 1. Add Real-Time Data Polling
**Priority: High**
**File:** `frontend/src/App.tsx`

All data is fetched once on mount. The UI labels say "REAL-TIME TELEMETRY" and "Polling 10s" but there is no actual polling mechanism.

**Task:**
- Add a polling interval (e.g., 30 seconds) for weather data via `fetchLiveWeather`
- Add polling for incidents via `fetchDepartmentIncidents`
- Show a "Last updated" timestamp in the header or footer
- Consider adding a visual indicator when new data arrives

#### 2. Add Incident Detail View
**Priority: High**
**File:** `frontend/src/components/EarlyWarningModule.tsx`

The Incident Command Board shows incidents but the detail view is minimal. Users cannot see the full action audit trail or edit individual actions.

**Task:**
- Expand the incident detail panel to show the full `actionsTaken` array with timestamps
- Add ability to log new actions that get persisted via the PATCH endpoint
- Show the incident lifecycle (active -> in_progress -> mitigated -> resolved) as a visual timeline

#### 3. Improve Sensor Telemetry with Live Updates
**Priority: Medium**
**File:** `frontend/src/components/LiveSensorFeed.tsx`

The sensor feed shows static mock data. Manual gauge logging works locally but has no backend persistence.

**Task:**
- Add simulated live sensor data updates (random walk within normal ranges) on a timer
- Show sensor offline/warning/critical states more prominently
- Add a "sensor health" summary bar at the top showing total online/offline/critical counts

#### 4. Add Mobile Responsive Improvements
**Priority: Medium**
**Files:** All components

Several components have layout issues on small screens:
- `RiskMap` layer controls overlap on mobile
- `VulnerabilityDashboard` radar chart is too small on phones
- `EarlyWarningModule` tab switching is cramped on mobile

**Task:**
- Make the map layer controls collapse into a hamburger menu on mobile
- Stack radar chart and VaR chart vertically on small screens
- Improve tab navigation UX on mobile (horizontal scroll with snap)

#### 5. Add Loading States and Error Boundaries
**Priority: Medium**
**Files:** `App.tsx`, `api.ts`, all components

Currently, failed API calls log to console but the UI shows no feedback. Users see stale mock data with no indication that live data failed to load.

**Task:**
- Add a global error boundary component
- Show toast/snackbar notifications when API calls fail
- Add skeleton loading states for weather data and incidents
- Show a "Using cached data" banner when live data is unavailable

#### 6. Write Component Tests
**Priority: Low**
**Files:** All components

There are zero tests in the project.

**Task:**
- Set up Vitest + React Testing Library
- Write tests for: `Header` (location selector), `NavigationTabs` (tab switching), `FloodPredictionModule` (scenario selection), `SMEPreparednessModule` (toggle controls)
- Add a test script to `frontend/package.json`

## Environment Variables

### Frontend (`frontend/.env.example`)
```
VITE_API_BASE_URL=http://localhost:3000
```

### Backend (`backend/.env.example`)
```
PORT=3000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

## License

Private - All rights reserved.
