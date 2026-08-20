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
