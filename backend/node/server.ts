import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

let incidentLog: Array<{
  id: string;
  title: string;
  hazardType: 'flood' | 'drought' | 'heatwave' | 'wildfire' | 'storm';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  location: string;
  coordinates: [number, number];
  reportedAt: string;
  status: 'active' | 'in_progress' | 'mitigated' | 'resolved';
  department: 'Emergency Management' | 'Public Works' | 'Healthcare' | 'Agriculture' | 'SME Liaison';
  assignedTo: string;
  actionsTaken: string[];
  automatedDispatchSent: boolean;
}> = [
  {
    id: "INC-8491",
    title: "River Basalt Stage 3 Flash Inundation Warning",
    hazardType: "flood",
    severity: "critical",
    location: "Lower Valley District & Industrial Park",
    coordinates: [51.5074, -0.1278],
    reportedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: "in_progress",
    department: "Emergency Management",
    assignedTo: "Commander Vance & Team Alpha",
    actionsTaken: [
      "Deployed automated telemetry stream-gauge warning sirens",
      "Evacuated low-lying SME warehousing zone 4",
      "Activated mobile high-volume flood water pumps"
    ],
    automatedDispatchSent: true
  },
  {
    id: "INC-8492",
    title: "Agricultural Zone Soil Moisture Critical Deficit (12%)",
    hazardType: "drought",
    severity: "high",
    location: "Eastern Irrigation Basin & Grain Corridors",
    coordinates: [51.48, -0.05],
    reportedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    status: "active",
    department: "Agriculture",
    assignedTo: "Dr. Aris (Agronomy Division)",
    actionsTaken: [
      "Notified 45 local farming collectives via CAP broadcast",
      "Scheduled regulated emergency aquifer allocation tier-2"
    ],
    automatedDispatchSent: true
  },
  {
    id: "INC-8493",
    title: "Urban Heat Island Grid Overload Alert (41.5°C Index)",
    hazardType: "heatwave",
    severity: "high",
    location: "Downtown Commercial Core & Central Transit",
    coordinates: [51.52, -0.14],
    reportedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    status: "in_progress",
    department: "Healthcare",
    assignedTo: "Metro Paramedic Rapid Response",
    actionsTaken: [
      "Opened 6 municipal public cooling shelters with emergency hydration",
      "Dispatched grid load-shedding protocol to municipal substation #3"
    ],
    automatedDispatchSent: true
  }
];

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/climate/live", async (req, res) => {
  try {
    const lat = parseFloat((req.query.lat as string) || "51.5074");
    const lon = parseFloat((req.query.lon as string) || "-0.1278");

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm,soil_temperature_0cm&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;

    const floodUrl = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge,river_discharge_mean,river_discharge_median,river_discharge_max,river_discharge_min&forecast_days=7`;

    const [weatherRes, floodRes] = await Promise.allSettled([
      fetch(weatherUrl).then((r) => r.json()),
      fetch(floodUrl).then((r) => r.json())
    ]);

    const weatherData = weatherRes.status === "fulfilled" ? weatherRes.value : null;
    const floodData = floodRes.status === "fulfilled" ? floodRes.value : null;

    res.json({
      success: true,
      coordinates: { lat, lon },
      weather: weatherData,
      flood: floodData,
      fetchedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Error fetching live climate data:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch live meteorological data",
      fallback: true
    });
  }
});

app.get("/api/incidents", (_req, res) => {
  res.json({ success: true, incidents: incidentLog });
});

app.post("/api/incidents", (req, res) => {
  try {
    const { title, hazardType, severity, location, coordinates, department, assignedTo, actionsTaken } = req.body;
    const newIncident = {
      id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
      title: title || "Automated Climate Anomaly Alert",
      hazardType: hazardType || "flood",
      severity: severity || "moderate",
      location: location || "Sector 7",
      coordinates: coordinates || [51.5074, -0.1278],
      reportedAt: new Date().toISOString(),
      status: "active" as const,
      department: department || "Emergency Management",
      assignedTo: assignedTo || "Automated Dispatch System",
      actionsTaken: actionsTaken || ["Dispatched automated early warning beacon", "Logged in municipal resilience ledger"],
      automatedDispatchSent: true
    };
    incidentLog.unshift(newIncident);
    res.json({ success: true, incident: newIncident });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.patch("/api/incidents/:id", (req, res) => {
  const { id } = req.params;
  const { status, actionsTaken, assignedTo } = req.body;
  const item = incidentLog.find((i) => i.id === id);
  if (!item) {
    return res.status(404).json({ success: false, error: "Incident not found" });
  }
  if (status) item.status = status;
  if (actionsTaken) item.actionsTaken = [...item.actionsTaken, ...(Array.isArray(actionsTaken) ? actionsTaken : [actionsTaken])];
  if (assignedTo) item.assignedTo = assignedTo;
  res.json({ success: true, incident: item });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "frontend", "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Terra Intelligence Platform running on http://localhost:${PORT}`);
  });
}

startServer();
