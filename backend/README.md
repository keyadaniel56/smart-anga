# Smart Anga — Climate Risk Intelligence & Resilience Platform

Go backend for the Climate Risk Intelligence & Resilience Platform. Provides REST API endpoints for climate monitoring, flood/drought prediction, SME preparedness, and incident management.

## Tech Stack

- **Language:** Go 1.25
- **HTTP Router:** `net/http` (stdlib)
- **External APIs:** Open-Meteo forecast, flood, and ERA5 archive APIs
- **Architecture:** handlers → services → store

## Project Structure

```
backend/
├── cmd/server/main.go
├── internal/
│   ├── config/                        # Environment config
│   ├── models/                        # Shared types (incidents, SME, etc.)
│   ├── store/                         # In-memory store (incidents, SME profiles, assets)
│   ├── services/
│   │   ├── openmeteo.go               # Live weather + flood fetch
│   │   ├── dashboard_aggregator.go    # Multi-source risk aggregation
│   │   ├── drought_assessment.go      # Drought scoring + SPI
│   │   ├── flood_prediction.go        # Flood risk prediction engine
│   │   └── sme_assessment.go          # SME vulnerability + action plans
│   ├── handlers/
│   │   ├── climate.go
│   │   ├── dashboard.go
│   │   ├── predictions.go
│   │   ├── sme.go
│   │   ├── incidents.go
│   │   └── helpers.go
│   ├── middleware/                    # CORS, request logging
│   └── router/                        # Route registration
├── Makefile
├── go.mod
└── .env.example
```

---

## Getting Started

### Prerequisites

- Go 1.21+

### Setup

```bash
cd backend
cp .env.example .env
go mod tidy
```

### Run

```bash
go run ./cmd/server/main.go
# or
make dev
```

Server starts on `http://localhost:3001`.

### Build

```bash
make build
./bin/server
```

### Run Tests

```bash
# all tests
go test ./...

# services only (scoring logic)
go test ./internal/services/... -v
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `NODE_ENV` | `development` | Environment |

---

## API Endpoints

Base URL: `http://localhost:3001`

All endpoints return JSON. `lat`/`lon` default to Nairobi (`-1.2864`, `36.8172`) when omitted.

---

### Health

#### `GET /api/health`

```bash
curl http://localhost:3001/api/health
```

```json
{ "status": "ok" }
```

---

### Climate

#### `GET /api/climate/live?lat=&lon=`

Live weather and river discharge data direct from Open-Meteo.

```bash
curl "http://localhost:3001/api/climate/live?lat=-1.2864&lon=36.8172"
```

```json
{
  "success": true,
  "coordinates": { "lat": -1.2864, "lon": 36.8172 },
  "weather": { "current": { "temperature_2m": 15.7, "precipitation": 0 }, "..." : "..." },
  "flood":   { "daily": { "river_discharge": [2.55], "..." : "..." } },
  "fetchedAt": "2026-08-21T05:30:00Z"
}
```

---

### Dashboard

#### `GET /api/dashboard/overview?lat=&lon=`

Composite risk overview aggregated from Open-Meteo forecast + flood API + incident store.

```bash
curl "http://localhost:3001/api/dashboard/overview?lat=-1.2864&lon=36.8172"
```

```json
{
  "success": true,
  "coordinates": { "lat": -1.2864, "lon": 36.8172 },
  "data": {
    "compositeRiskScore": 33.98,
    "riskLevel": "MODERATE",
    "activeIncidents": 3,
    "hazardSummary": {
      "flood": 40.07,
      "drought": 65.36,
      "heatwave": 0,
      "storm": 28.10
    },
    "weatherAlerts": 1,
    "soilMoisturePercent": 18.29,
    "temperatureCelsius": 15.7,
    "riverDischargeLevel": "elevated",
    "lastUpdated": "2026-08-21T05:30:17Z"
  }
}
```

Risk levels: `LOW` (0–20) · `MODERATE` (21–40) · `HIGH` (41–60) · `VERY HIGH` (61–80) · `EXTREME` (81–100)

Composite weights: flood 30% · drought 25% · heatwave 25% · storm 20%

---

#### `GET /api/dashboard/trends?lat=&lon=&days=30`

Historical daily trends from the ERA5 archive API. `days` defaults to 30, max 365.

```bash
curl "http://localhost:3001/api/dashboard/trends?lat=-1.2864&lon=36.8172&days=7"
```

```json
{
  "success": true,
  "data": {
    "days": 7,
    "trends": [
      {
        "date": "2026-08-14",
        "temperature": 19.15,
        "precipitation": 0,
        "soilMoisture": 7.7,
        "windSpeed": 14.6,
        "et0": 5.4,
        "weatherCode": 3,
        "floodRisk": 0,
        "droughtRisk": 73.84,
        "heatwaveRisk": 0,
        "stormRisk": 21.9,
        "compositeRisk": 22.84
      }
    ]
  }
}
```

---

#### `GET /api/dashboard/vulnerable-assets?lat=&lon=&radius=10`

Assets from the internal database within `radius` km, scored against current hazard levels.

```bash
curl "http://localhost:3001/api/dashboard/vulnerable-assets?lat=-1.2864&lon=36.8172&radius=10"
```

```json
{
  "success": true,
  "radiusKm": 10,
  "data": {
    "total": 14,
    "assets": [
      {
        "id": "bridge-001",
        "name": "Nairobi River Bridge A",
        "type": "bridge",
        "coordinates": [-1.285, 36.83],
        "distanceKm": 1.43,
        "floodRisk": 36.06,
        "droughtRisk": 6.54,
        "heatwaveRisk": 0,
        "stormRisk": 19.67,
        "overallRisk": 16.39,
        "riskLevel": "LOW",
        "primaryHazard": "flood"
      }
    ]
  }
}
```

Asset types: `school` · `hospital` · `road` · `bridge` · `farm` · `business` · `water` · `energy` · `utilities` · `population`

---

### Predictions

#### `GET /api/predictions/drought?lat=&lon=`

Drought risk assessment with SPI approximation, rolling precipitation windows, soil moisture trend analysis, and agriculture impact.

```bash
curl "http://localhost:3001/api/predictions/drought?lat=-1.2864&lon=36.8172"
```

```json
{
  "success": true,
  "data": {
    "droughtRiskScore": 45.63,
    "severity": "warning",
    "soilMoisturePercent": 18.74,
    "precipitationDeficitMm": 62.3,
    "daysSinceLastRain": 1,
    "trend": "stable",
    "spi": -1.56,
    "spiClass": "Severely Dry",
    "soilLayers": {
      "depth0to1cm": 16.71,
      "depth1to3cm": 17.61,
      "depth3to9cm": 19.04,
      "depth9to27cm": 21.15
    },
    "windows": {
      "last30DaysMm": 12.7,
      "last60DaysMm": 24.3,
      "last90DaysMm": 59.2,
      "deficit30DayMm": 62.3,
      "deficit60DayMm": 125.7,
      "deficit90DayMm": 165.8
    },
    "impactOnAgriculture": "Significant: reduced yields expected...",
    "recommendations": ["Monitor soil moisture at all depths daily..."],
    "assessedAt": "2026-08-21T05:31:00Z"
  }
}
```

Severity levels: `none` · `watch` (20+) · `warning` (45+) · `emergency` (70+)

SPI classes: Extremely Dry · Severely Dry · Moderately Dry · Near Normal · Moderately Wet · Very Wet · Extremely Wet

---

#### `GET /api/predictions/flood?lat=&lon=`

Flood risk prediction with weighted factor scoring, 24/48/72h precipitation windows, river discharge ratio, and confidence level.

```bash
curl "http://localhost:3001/api/predictions/flood?lat=-1.2864&lon=36.8172"
```

```json
{
  "success": true,
  "data": {
    "riskScore": 19.38,
    "probability": "low",
    "confidence": 100,
    "timeWindow": "72h",
    "factors": {
      "precipitation":     { "value": 3.4,  "score": 2.83,  "weight": 0.35, "unit": "mm" },
      "riverDischarge":    { "value": 2.55, "score": 14.25, "weight": 0.30, "unit": "m³/s" },
      "soilMoisture":      { "value": 20.1, "score": 28.64, "weight": 0.20, "unit": "%" },
      "historicalPattern": { "value": 3.4,  "score": 55.91, "weight": 0.15, "unit": "mm" }
    },
    "precipForecast": {
      "next24hMm": 0,
      "next48hMm": 0,
      "next72hMm": 3.4
    },
    "riverDischarge": {
      "currentM3s": 2.55,
      "medianM3s": 1.62,
      "maxM3s": 3.33,
      "ratioToMedian": 1.57
    },
    "recommendations": ["Monitor river levels and weather forecasts continuously."],
    "predictedAt": "2026-08-21T05:31:14Z"
  }
}
```

Probability levels: `low` (0–19) · `moderate` (20–44) · `high` (45–69) · `very_high` (70–100)

Factor weights: precipitation 35% · river discharge 30% · soil moisture 20% · historical pattern 15%

---

### SME Preparedness

#### `POST /api/sme`

Register an SME business profile.

```bash
curl -X POST http://localhost:3001/api/sme \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Nairobi Grain Traders Ltd",
    "industry": "agriculture",
    "employeeCount": 18,
    "location": "Kikuyu, Nairobi",
    "coordinates": [-1.25, 36.78],
    "hasInsurance": true,
    "insuranceCovers": ["flood", "drought"],
    "emergencyMeasures": ["evacuation_plan", "early_warning_system", "water_storage"],
    "criticalAssets": [
      { "name": "Grain Silo A", "type": "equipment", "estimatedValue": 12000, "isInsured": true },
      { "name": "Irrigation Pump", "type": "equipment", "estimatedValue": 4500, "isInsured": false }
    ]
  }'
```

```json
{
  "success": true,
  "sme": {
    "id": "SME-7587",
    "businessName": "Nairobi Grain Traders Ltd",
    "industry": "agriculture",
    "employeeCount": 18,
    "registeredAt": "2026-08-21T05:31:34Z"
  }
}
```

Industries: `agriculture` · `manufacturing` · `retail` · `healthcare` · `construction` · `logistics` · `hospitality` · `technology` · `finance` · `other`

Emergency measures: `evacuation_plan` · `flood_barriers` · `backup_power` · `water_storage` · `insurance` · `early_warning_system` · `staff_training` · `data_backup` · `supply_chain_backup` · `fire_suppression`

---

#### `GET /api/sme/:id`

Retrieve a registered SME profile.

```bash
curl http://localhost:3001/api/sme/SME-7587
```

```json
{
  "success": true,
  "sme": {
    "id": "SME-7587",
    "businessName": "Nairobi Grain Traders Ltd",
    "industry": "agriculture",
    "employeeCount": 18,
    "hasInsurance": true,
    "insuranceCovers": ["flood", "drought"],
    "emergencyMeasures": ["evacuation_plan", "early_warning_system", "water_storage"],
    "criticalAssets": [...]
  }
}
```

---

#### `GET /api/sme/:id/assessment`

Run a vulnerability and preparedness assessment for a registered SME.

```bash
curl http://localhost:3001/api/sme/SME-7587/assessment
```

```json
{
  "success": true,
  "assessment": {
    "smeId": "SME-7587",
    "businessName": "Nairobi Grain Traders Ltd",
    "industry": "agriculture",
    "assessedAt": "2026-08-21T05:32:44Z",
    "vulnerabilityScore": 53.3,
    "preparednessScore": 57,
    "preparednessGrade": "D",
    "industryBenchmark": 38,
    "benchmarkDelta": 19,
    "factors": [
      { "name": "Industry Risk Category", "score": 82, "weight": 0.25 },
      { "name": "Insurance Coverage",     "score": 24, "weight": 0.20 },
      { "name": "Emergency Measures",     "score": 70, "weight": 0.25 },
      { "name": "Critical Asset Exposure","score": 0,  "weight": 0.15 },
      { "name": "Business Size",          "score": 70, "weight": 0.15 }
    ],
    "topRisks": ["Industry Risk Category", "Emergency Measures", "Business Size"],
    "summary": "Nairobi Grain Traders Ltd (agriculture sector) scores D — 57 points 19 above the agriculture industry benchmark."
  }
}
```

Preparedness grades: `A` (90–100) · `B` (75–89) · `C` (60–74) · `D` (45–59) · `E` (30–44) · `F` (0–29)

---

#### `GET /api/sme/:id/action-plan`

Generate a prioritised climate preparedness action plan for a registered SME.

```bash
curl http://localhost:3001/api/sme/SME-7587/action-plan
```

```json
{
  "success": true,
  "actionPlan": {
    "smeId": "SME-7587",
    "businessName": "Nairobi Grain Traders Ltd",
    "generatedAt": "2026-08-21T05:32:20Z",
    "totalTasks": 5,
    "immediateCount": 0,
    "tasks": [
      {
        "id": "TASK-001",
        "title": "Install Backup Power Supply",
        "description": "A UPS or generator ensures operations continue during grid outages.",
        "priority": "short_term",
        "hazard": "storm,heatwave",
        "estimatedCost": "$800–$5,000",
        "isCompleted": false
      }
    ]
  }
}
```

Task priorities: `immediate` (48h) · `short_term` (30 days) · `medium_term` (90 days) · `long_term` (90+ days)

---

### Incidents

#### `GET /api/incidents`

List all active and historical incidents.

```bash
curl http://localhost:3001/api/incidents
```

```json
{
  "success": true,
  "incidents": [
    {
      "id": "INC-8491",
      "title": "River Basalt Stage 3 Flash Inundation Warning",
      "hazardType": "flood",
      "severity": "critical",
      "status": "in_progress",
      "location": "Lower Valley District & Industrial Park",
      "coordinates": [51.5074, -0.1278],
      "department": "Emergency Management",
      "assignedTo": "Commander Vance & Team Alpha",
      "actionsTaken": ["Deployed automated telemetry stream-gauge warning sirens"],
      "automatedDispatchSent": true,
      "reportedAt": "2026-08-21T07:43:58Z"
    }
  ]
}
```

---

#### `POST /api/incidents`

Create a new incident.

```bash
curl -X POST http://localhost:3001/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Flash flood warning - Nairobi River",
    "hazardType": "flood",
    "severity": "high",
    "location": "Nairobi CBD",
    "coordinates": [-1.2864, 36.8172],
    "department": "Emergency Management",
    "assignedTo": "Response Team B",
    "actionsTaken": ["Issued public alert"]
  }'
```

```json
{
  "success": true,
  "incident": {
    "id": "INC-4821",
    "title": "Flash flood warning - Nairobi River",
    "hazardType": "flood",
    "severity": "high",
    "status": "active",
    "automatedDispatchSent": true
  }
}
```

---

#### `PATCH /api/incidents/:id`

Update incident status, assigned officer, or actions taken.

```bash
curl -X PATCH http://localhost:3001/api/incidents/INC-8491 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "mitigated",
    "assignedTo": "Commander Vance",
    "actionsTaken": ["Flood barriers deployed", "All residents evacuated"]
  }'
```

```json
{
  "success": true,
  "incident": {
    "id": "INC-8491",
    "status": "mitigated",
    "assignedTo": "Commander Vance"
  }
}
```

Hazard types: `flood` · `drought` · `heatwave` · `wildfire` · `storm`

Severity levels: `low` · `moderate` · `high` · `critical`

Status values: `active` · `in_progress` · `mitigated` · `resolved`

---

## API Dashboard UI

A built-in interactive dashboard is available at:

```
http://localhost:3001/dashboard/apis
```

Start the server first (`make dev` or `go run ./cmd/server`), then open the URL in your browser. No extra setup required.

Features:
- All 14 endpoints listed in the nav bar
- Click any endpoint to see its description and input fields
- Set `lat`/`lon` globally in the header — all coordinate endpoints sync automatically
- Press **Send Request** (or `Ctrl+Enter`) to call the endpoint
- Response panel shows a visual summary card + raw syntax-highlighted JSON
- POST/PATCH endpoints include an editable request body
- Registering an SME auto-fills its ID into the profile/assessment/plan endpoints

---

## Running All Tests

```bash
cd backend

# Run all tests
go test ./...

# Verbose output with test names
go test ./internal/services/... -v

# Run a specific test file
go test ./internal/services/... -run TestFlood
go test ./internal/services/... -run TestDrought
go test ./internal/services/... -run TestSME
go test ./internal/services/... -run TestComposite
```

Expected output: **87 tests passing** across `dashboard_aggregator`, `drought_assessment`, `flood_prediction`, and `sme_assessment`.

---

## Testing Endpoints with curl

Start the server, then use any block above. Quick smoke-test sequence:

```bash
# 1. Health
curl http://localhost:3001/api/health

# 2. Live climate
curl "http://localhost:3001/api/climate/live?lat=-1.2864&lon=36.8172"

# 3. Dashboard overview
curl "http://localhost:3001/api/dashboard/overview?lat=-1.2864&lon=36.8172"

# 4. 7-day trends
curl "http://localhost:3001/api/dashboard/trends?lat=-1.2864&lon=36.8172&days=7"

# 5. Vulnerable assets within 10km
curl "http://localhost:3001/api/dashboard/vulnerable-assets?lat=-1.2864&lon=36.8172&radius=10"

# 6. Drought prediction
curl "http://localhost:3001/api/predictions/drought?lat=-1.2864&lon=36.8172"

# 7. Flood prediction
curl "http://localhost:3001/api/predictions/flood?lat=-1.2864&lon=36.8172"

# 8. Register SME
curl -X POST http://localhost:3001/api/sme \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Test Co","industry":"retail","employeeCount":5}'

# 9. Get SME profile (replace ID)
curl http://localhost:3001/api/sme/SME-1234

# 10. SME assessment
curl http://localhost:3001/api/sme/SME-1234/assessment

# 11. SME action plan
curl http://localhost:3001/api/sme/SME-1234/action-plan

# 12. List incidents
curl http://localhost:3001/api/incidents
```
