# Smart Anga - Climate Risk Intelligence & Resilience Platform Backend

Go backend for the Climate Risk Intelligence & Resilience Platform. Provides REST API endpoints for climate monitoring, incident management, and real-time weather/flood data.

## Track 6: Climate Risk Intelligence & Resilience Platform

Helping communities and organizations understand, monitor, and respond to climate-related risks including floods, droughts, heatwaves, and other extreme weather events.

## Tech Stack

- **Language:** Go 1.25
- **HTTP Router:** `net/http` (stdlib)
- **External APIs:** Open-Meteo (weather & flood data)
- **Architecture:** Clean architecture (handlers, services, store, models)

## Project Structure

```
backend/
├── cmd/server/main.go          # Entry point, graceful shutdown
├── internal/
│   ├── config/                  # Environment configuration
│   ├── models/                  # Data types and request schemas
│   ├── store/                   # In-memory incident store
│   ├── services/                # External API integrations
│   │   └── openmeteo.go         # Open-Meteo weather + flood API
│   ├── handlers/                # HTTP request handlers
│   │   ├── incidents.go         # Incident CRUD
│   │   ├── climate.go           # Live climate data
│   │   └── helpers.go           # Shared utilities
│   ├── middleware/               # CORS, logging
│   └── router/                  # Route registration
├── Makefile
├── go.mod
└── .env.example
```

## Getting Started

### Prerequisites

- Go 1.25+

### Setup

```bash
cd backend
cp .env.example .env
go mod tidy
```

### Run

```bash
make dev
# or
go run ./cmd/server
```

Server starts on `http://localhost:3001`.

### Build

```bash
make build
./bin/server
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/climate/live?lat=&lon=` | Live weather + flood data |
| `GET` | `/api/incidents` | List all incidents |
| `POST` | `/api/incidents` | Create a new incident |
| `PATCH` | `/api/incidents/{id}` | Update an incident |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `NODE_ENV` | `development` | Environment mode |

## Incident Types

- **Hazard Types:** flood, drought, heatwave, wildfire, storm
- **Severity Levels:** low, moderate, high, critical
- **Status:** active, in_progress, mitigated, resolved
- **Departments:** Emergency Management, Public Works, Healthcare, Agriculture, SME Liaison
