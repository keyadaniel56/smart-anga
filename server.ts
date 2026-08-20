import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Google GenAI Client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// In-memory inter-departmental emergency incident & task registry
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

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 2. Weather & Hydrology proxy (Open-Meteo Integration with resilient fallback)
app.get("/api/climate/live", async (req, res) => {
  try {
    const lat = parseFloat((req.query.lat as string) || "51.5074");
    const lon = parseFloat((req.query.lon as string) || "-0.1278");

    // Fetch live weather & forecast from open-meteo
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

// 3. Incident Management & Inter-departmental Coordination
app.get("/api/incidents", (req, res) => {
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

// 4. Gemini AI Endpoints
// Risk Assessment Generator
app.post("/api/gemini/risk-assessment", async (req, res) => {
  try {
    const { locationName, coordinates, liveConditions, sectorFocus, timeframe } = req.body;
    const ai = getGenAI();

    const prompt = `You are a World-Class Climate Risk Scientist & Resilience Systems Engineer for the Global Climate Resilience Observatory.
Perform an analytical, multi-hazard risk assessment and resilience audit for:
Location: ${locationName || "Metropolitan Region"} (Coordinates: ${JSON.stringify(coordinates || [51.5, -0.12])})
Sector Focus: ${sectorFocus || "Multi-Sector (Infrastructure, SME, Agriculture, Public Safety)"}
Timeframe: ${timeframe || "Immediate to 2035 projection"}
Observed Context: ${JSON.stringify(liveConditions || {})}

Provide a comprehensive, high-precision structured JSON response matching this schema:
{
  "compositeRiskScore": number (0 to 100),
  "riskRating": "Low" | "Moderate" | "High" | "Severe" | "Catastrophic",
  "hazardBreakdown": [
    { "hazard": "Inland & Flash Flood", "score": number (0-100), "status": "Stable" | "Elevated" | "Critical", "drivers": "string", "vulnerableAssets": "string" },
    { "hazard": "Drought & Water Scarcity", "score": number (0-100), "status": "Stable" | "Elevated" | "Critical", "drivers": "string", "vulnerableAssets": "string" },
    { "hazard": "Extreme Heatwave & UHI", "score": number (0-100), "status": "Stable" | "Elevated" | "Critical", "drivers": "string", "vulnerableAssets": "string" },
    { "hazard": "Wildfire & Agricultural Stress", "score": number (0-100), "status": "Stable" | "Elevated" | "Critical", "drivers": "string", "vulnerableAssets": "string" },
    { "hazard": "Supply Chain & Grid Disruption", "score": number (0-100), "status": "Stable" | "Elevated" | "Critical", "drivers": "string", "vulnerableAssets": "string" }
  ],
  "executiveSummary": "string (clear, rigorous 2-3 paragraph climate intelligence summary)",
  "vulnerabilityVector": {
    "exposureScore": number (0-100),
    "sensitivityScore": number (0-100),
    "adaptiveCapacityScore": number (0-100),
    "criticalVulnerabilities": ["string", "string", "string"]
  },
  "economicImpactProjections": {
    "estimatedAnnualLossMillions": number,
    "smeDisruptionRiskPercentage": number,
    "businessInterruptionDays": number,
    "infrastructureValueAtRiskMillions": number
  },
  "tacticalInterventions": [
    {
      "timeframe": "Immediate (0-7 Days)",
      "actions": ["string", "string", "string"],
      "responsibleDepartment": "string",
      "expectedRiskReductionPct": number
    },
    {
      "timeframe": "Short-Term (1-3 Months)",
      "actions": ["string", "string", "string"],
      "responsibleDepartment": "string",
      "expectedRiskReductionPct": number
    },
    {
      "timeframe": "Strategic Adaptation (1-3 Years)",
      "actions": ["string", "string", "string"],
      "responsibleDepartment": "string",
      "expectedRiskReductionPct": number
    }
  ],
  "communityEarlyWarningRecommendations": [
    "string", "string"
  ]
}

Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error("Gemini risk assessment error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to generate risk assessment" });
  }
});

// Climate Scenario Simulator
app.post("/api/gemini/scenario-simulate", async (req, res) => {
  try {
    const { location, baseline, precipitationDeltaPct, temperatureDeltaC, droughtDurationWeeks, riverLevelMultiplier } = req.body;
    const ai = getGenAI();

    const prompt = `You are an Advanced Climate Stress-Testing & Hydro-Meteorological Simulation Engine.
Simulate the catastrophic cascade of the following simulated climate shock parameters on ${location || "Target Metropolitan & Agricultural Basin"}:
- Precipitation Anomaly: ${precipitationDeltaPct > 0 ? `+${precipitationDeltaPct}%` : `${precipitationDeltaPct}%`}
- Temperature Anomaly: +${temperatureDeltaC}°C above 1990-2020 baseline
- Drought Duration / Soil Moisture Depletion: ${droughtDurationWeeks} consecutive weeks
- River Stage Inundation Multiplier: ${riverLevelMultiplier}x peak historical discharge

Output a precise JSON simulation report:
{
  "scenarioName": "string",
  "simulatedSeverityTier": "Tier 1: Minor" | "Tier 2: Significant" | "Tier 3: Severe" | "Tier 4: Catastrophic Extreme",
  "hydroImpacts": {
    "floodInundationAreaSqKm": number,
    "peakDischargeCubicMetersSec": number,
    "drainageOverloadPercentage": number,
    "breachProbability": number (0-100)
  },
  "agriculturalAndWaterImpacts": {
    "soilMoistureDeficitPct": number,
    "cropYieldLossForecastPct": number,
    "reservoirDepletionDays": number,
    "irrigationDeficitMm": number
  },
  "infrastructureAndSMEImpacts": {
    "substationsAtFloodRisk": number,
    "smeFacilityDisruptionsEstimated": number,
    "transportRoadClosuresKm": number,
    "totalEconomicLossEstimateUSD": string
  },
  "criticalCascadeSequence": [
    { "dayOrHour": "Hour 0-12", "event": "string", "severity": "string" },
    { "dayOrHour": "Day 2-4", "event": "string", "severity": "string" },
    { "dayOrHour": "Day 5-10", "event": "string", "severity": "string" },
    { "dayOrHour": "Day 14+", "event": "string", "severity": "string" }
  ],
  "optimalEmergencyMitigations": [
    { "domain": "Flood Defense", "action": "string", "timeline": "string", "costBenefitRatio": "string" },
    { "domain": "Grid & Utilities", "action": "string", "timeline": "string", "costBenefitRatio": "string" },
    { "domain": "SME Business Continuity", "action": "string", "timeline": "string", "costBenefitRatio": "string" },
    { "domain": "Civic Early Warning", "action": "string", "timeline": "string", "costBenefitRatio": "string" }
  ]
}

Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error("Scenario simulation error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to simulate climate scenario" });
  }
});

// Automated SME Climate Preparedness Plan Generator
app.post("/api/gemini/action-plan", async (req, res) => {
  try {
    const { businessName, industry, employeeCount, location, primaryThreats, currentMeasures } = req.body;
    const ai = getGenAI();

    const prompt = `You are a certified Disaster Recovery Institute (DRI) Climate Resilience Auditor for SMEs and critical local infrastructure.
Generate a tailored SME Climate Preparedness & Business Continuity Plan for:
Business Name: ${businessName || "Apex Manufacturing & Logistics"}
Industry: ${industry || "Manufacturing / Supply Chain"}
Headcount: ${employeeCount || "45 employees"}
Location: ${location || "Riverbank Commercial Corridor"}
Primary Hazards: ${JSON.stringify(primaryThreats || ["Flash Floods", "Power Grid Heat Stress", "Supply Chain Bottlenecks"])}
Current Readiness: ${JSON.stringify(currentMeasures || {})}

Return a comprehensive JSON plan matching:
{
  "preparednessScore": number (0-100),
  "readinessGrade": "A" | "B" | "C" | "D" | "F",
  "criticalGaps": ["string", "string", "string"],
  "businessImpactAnalysis": {
    "estimatedDailyDowntimeCost": string,
    "recoveryTimeObjectiveHours": number,
    "vulnerableCriticalAssets": ["string", "string", "string"]
  },
  "actionChecklist": [
    { "category": "Physical Facility Protection", "task": "string", "priority": "High" | "Medium" | "Urgent", "costTier": "$" | "$$" | "$$$", "timeline": "string" },
    { "category": "Supply Chain & Inventory Buffer", "task": "string", "priority": "High" | "Medium" | "Urgent", "costTier": "$" | "$$" | "$$$", "timeline": "string" },
    { "category": "Workforce Safety & Remote SOPs", "task": "string", "priority": "High" | "Medium" | "Urgent", "costTier": "$" | "$$" | "$$$", "timeline": "string" },
    { "category": "Insurance & Financial Resilience", "task": "string", "priority": "High" | "Medium" | "Urgent", "costTier": "$" | "$$" | "$$$", "timeline": "string" },
    { "category": "Data & Emergency Power Backup", "task": "string", "priority": "High" | "Medium" | "Urgent", "costTier": "$" | "$$" | "$$$", "timeline": "string" }
  ],
  "emergencyProtocolSOP": "string (bulleted rapid response protocol when a Level 3 early warning is received)",
  "climateInsuranceAdvice": "string"
}

Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error("Action plan generation error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to generate SME action plan" });
  }
});

// Interactive AI Climate Resilience Copilot
app.post("/api/gemini/chat-assistant", async (req, res) => {
  try {
    const { messages, context } = req.body;
    const ai = getGenAI();

    const formattedHistory = (messages || []).map((m: { role: string; text: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }]
    }));

    const systemInstruction = `You are TerraPulse AI, an advanced Climate Risk Intelligence, Hydrological Engineering & Disaster Resilience Copilot.
You assist emergency managers, municipal civil engineers, agricultural advisors, and SME business owners in:
- Interpreting flood hydrographs, river stage gauges, soil moisture deficits (SPEI/PDSI), and wet-bulb heat indexes
- Formulating inter-departmental emergency mobilization directives
- Recommending Nature-Based Solutions (bioswales, permeable pavements, retention ponds, mangrove buffers)
- Designing SME business continuity protocols and disaster risk reduction (DRR) strategies
- Eliminating manual coordination errors between police, healthcare, fire rescue, public works, and community volunteers.

Context Data: ${JSON.stringify(context || {})}
Be concise, highly actionable, authoritative, and structured. Use Markdown bullet points, bold key terms, and specific quantitative guidance.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: formattedHistory,
      config: {
        systemInstruction,
        temperature: 0.3,
      }
    });

    res.json({ success: true, reply: response.text || "No response generated." });
  } catch (err: any) {
    console.error("Chat copilot error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to communicate with climate copilot" });
  }
});

// Automated Institutional Audit Report Generator
app.post("/api/gemini/generate-report", async (req, res) => {
  try {
    const { location, hazards, sensors, smeProfiles, incidents } = req.body;
    const ai = getGenAI();

    const prompt = `You are the Lead Climate Resilience Auditor for an international municipal climate adaptation taskforce.
Synthesize an Institutional Climate Risk Intelligence & Operational Resilience Audit Report for:
Location: ${location?.name || "Global Metropolitan Basin"}
Active Hazards Data: ${JSON.stringify(hazards || {})}
Live Telemetry & Sensors: ${JSON.stringify(sensors || [])}
SME & Infrastructure Vulnerability: ${JSON.stringify(smeProfiles || [])}
Active Incident Logs: ${JSON.stringify(incidents || [])}

Generate a formal JSON report:
{
  "reportTitle": "string",
  "documentId": "string",
  "auditDate": "string",
  "executiveSummary": "string",
  "riskRating": "string",
  "overallResilienceIndex": number (0-100),
  "meteorologicalAndHydrologicalFindings": "string",
  "vulnerableAssetsAndInfrastructure": ["string", "string", "string"],
  "smePreparednessIndex": number (0-100),
  "interDepartmentalCoordinationReview": "string",
  "thirtySixtyNinetyDayRoadmap": {
    "day30": ["string", "string"],
    "day60": ["string", "string"],
    "day90": ["string", "string"]
  },
  "complianceAndFrameworks": ["TCFD (Task Force on Climate-Related Financial Disclosures)", "Sendai Framework for Disaster Risk Reduction", "ISO 14090 Climate Adaptation"],
  "signOffAuthority": "Senior Climate Risk Analyst, Global Resilience Platform"
}

Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, report: parsed });
  } catch (err: any) {
    console.error("Report generation error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to generate audit report" });
  }
});

// Vite middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Climate Risk Intelligence Platform running on http://localhost:${PORT}`);
  });
}

startServer();
