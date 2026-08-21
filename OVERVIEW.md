# Smart Anga — Climate Risk Intelligence & Resilience Platform

Smart Anga is a climate risk intelligence platform designed to help governments, emergency responders, and small businesses understand, monitor, and respond to climate hazards in real time.

It pulls live meteorological and hydrological data from [Open-Meteo](https://open-meteo.com) — a free, global weather API — and runs it through a set of risk scoring engines to produce actionable intelligence on floods, droughts, heatwaves, and storms for any location on Earth.

---

## What Problem It Solves

Climate-related disasters — floods, droughts, extreme heat — cause billions in damage every year, disproportionately affecting small businesses and communities with limited access to early warning tools. Most existing solutions are either too expensive, too technical, or built for large institutions.

Smart Anga makes climate risk intelligence accessible by:

- Providing real-time risk scores without requiring any external subscriptions or API keys
- Giving small businesses a structured way to assess their preparedness and get a concrete action plan
- Giving emergency managers a single view of active incidents, hazard levels, and vulnerable infrastructure

---

## Core Capabilities

### 1. Live Climate Monitoring
Fetches current weather conditions and river discharge data for any coordinates. Returns temperature, precipitation, wind, soil moisture, and flood indicators in a single call.

### 2. Flood Prediction
Scores flood risk on a 0–100 scale using four weighted factors:
- **Precipitation forecast** (35%) — 24/48/72h rainfall totals
- **River discharge** (30%) — current flow vs historical median
- **Soil moisture** (20%) — surface saturation reduces absorption capacity
- **Historical pattern** (15%) — how anomalous current rainfall is vs 90-day baseline

Outputs a probability label (low / moderate / high / very high), a peak risk window, and prioritised recommendations.

### 3. Drought Assessment
Scores drought severity using soil moisture across four depth layers, rolling 30/60/90-day precipitation deficits, and a Standardized Precipitation Index (SPI) approximation. Produces an agriculture impact statement and targeted recommendations based on conditions.

Severity levels: none → watch → warning → emergency

### 4. Dashboard Overview & Trends
Aggregates flood, drought, heatwave, and storm scores into a single composite risk index. The trends endpoint pulls ERA5 historical data to show how risk has evolved over up to 365 days — useful for spotting seasonal patterns or prolonged dry spells.

### 5. Vulnerable Asset Mapping
Maintains an internal database of infrastructure assets (bridges, hospitals, schools, farms, etc.). For any given location and radius, it returns all assets within range with per-hazard risk scores calculated using asset-type exposure weights — a bridge scores much higher for flood risk than a school does, for example.

### 6. SME Preparedness Assessment
Small and medium businesses can register their profile — industry, employee count, insurance coverage, emergency measures in place, and critical assets. The platform then:
- Scores their vulnerability across five factors (industry risk, insurance, emergency measures, asset exposure, business size)
- Assigns a preparedness grade (A–F) and benchmarks them against their industry average
- Generates a prioritised action plan with concrete tasks categorised as immediate (48h), short-term (30 days), medium-term (90 days), or long-term

### 7. Incident Management
Tracks climate incidents from creation through resolution. Emergency managers can log incidents with hazard type, severity, location, and assigned response teams, then update status as the situation evolves.

---

## How It Works

```
Client / Dashboard UI
        │
        ▼
  REST API (Go)
        │
   ┌────┴─────────────────────────────┐
   │                                  │
   ▼                                  ▼
Open-Meteo APIs                 Internal Store
  - Forecast API                  - Incidents
  - Flood API                     - SME profiles
  - ERA5 Archive API              - Asset database
   │
   ▼
Risk Scoring Engines
  - Flood predictor
  - Drought assessor
  - Dashboard aggregator
  - SME assessor
```

All weather data is fetched at request time — there is no background job or caching layer. The risk engines are deterministic, stateless functions that take raw API data and return structured scores.

---

## Data Sources

| Source | What it provides |
|---|---|
| Open-Meteo Forecast API | Current conditions, 7-day hourly forecast, soil moisture |
| Open-Meteo Flood API | River discharge (current, mean, max) — 7-day forecast |
| Open-Meteo ERA5 Archive | Historical daily aggregates up to 365 days back |

No API keys required. All three are free and globally available.

---

## Geographic Coverage

The platform works for any coordinates worldwide. The underlying Open-Meteo APIs have global coverage.

One caveat: the drought SPI baseline and precipitation deficit thresholds are currently calibrated for East Africa (semi-arid climate, ~2.5mm/day average). Drought severity scores will be less accurate in very wet or very arid climates until region-specific climatological normals are added.

---

## Who It's For

- **Emergency management agencies** — real-time hazard overview, incident tracking, asset vulnerability mapping
- **Small and medium businesses** — preparedness grading, actionable plans, insurance gap identification
- **Agricultural operators** — soil moisture trends, drought early warning, irrigation guidance
- **Urban planners and NGOs** — historical risk trends, infrastructure exposure analysis
