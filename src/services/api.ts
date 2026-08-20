import { DepartmentIncident, GeminiRiskAssessment, GeminiScenarioSimulation, SMEActionPlan, AuditReportData, LiveWeatherData } from '../types/climate';

export async function fetchLiveClimate(lat: number, lon: number, locationName?: string): Promise<LiveWeatherData | null> {
  try {
    const res = await fetch(`/api/climate/live?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error('API request failed');
    return await res.json();
  } catch (err) {
    console.warn('Fallback to local weather calculation:', err);
    return null;
  }
}

export const fetchLiveWeather = fetchLiveClimate;

export async function fetchIncidents(): Promise<DepartmentIncident[]> {
  try {
    const res = await fetch('/api/incidents');
    if (!res.ok) throw new Error('Failed to load incidents');
    const data = await res.json();
    return data.incidents || [];
  } catch (err) {
    console.error('Error fetching incidents:', err);
    return [];
  }
}

export const fetchDepartmentIncidents = fetchIncidents;

export async function createIncident(incidentData: Partial<DepartmentIncident>): Promise<DepartmentIncident | null> {
  try {
    const res = await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incidentData)
    });
    if (!res.ok) throw new Error('Failed to create incident');
    const data = await res.json();
    return data.incident || null;
  } catch (err) {
    console.error('Error creating incident:', err);
    return null;
  }
}

export async function updateIncident(id: string, updates: Partial<DepartmentIncident>): Promise<DepartmentIncident | null> {
  try {
    const res = await fetch(`/api/incidents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update incident');
    const data = await res.json();
    return data.incident || null;
  } catch (err) {
    console.error('Error updating incident:', err);
    return null;
  }
}

export const updateDepartmentIncident = updateIncident;

export async function generateGeminiRiskAssessment(payload: {
  locationName: string;
  coordinates: [number, number];
  liveConditions: any;
  sectorFocus?: string;
  timeframe?: string;
}): Promise<GeminiRiskAssessment | null> {
  try {
    const res = await fetch('/api/gemini/risk-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to generate risk assessment');
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Risk assessment error:', err);
    return null;
  }
}

export async function assessClimateRisk(payload: {
  location: any;
  liveWeather: any;
  activeSensors: any;
  criticalAssets: any;
}): Promise<GeminiRiskAssessment | null> {
  return generateGeminiRiskAssessment({
    locationName: payload.location.name,
    coordinates: payload.location.coordinates,
    liveConditions: {
      temperature: payload.liveWeather?.temperature || 24,
      precipitation: payload.liveWeather?.precipitationMm || 5,
      humidity: payload.liveWeather?.humidity || 65,
      activeAlertsCount: 3
    }
  });
}

export async function simulateClimateScenario(payload: {
  location: string;
  baseline: any;
  precipitationDeltaPct: number;
  temperatureDeltaC: number;
  droughtDurationWeeks: number;
  riverLevelMultiplier: number;
}): Promise<GeminiScenarioSimulation | null> {
  try {
    const res = await fetch('/api/gemini/scenario-simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to simulate scenario');
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Scenario simulation error:', err);
    return null;
  }
}

export async function generateSMEActionPlan(payload: {
  businessName: string;
  industry: string;
  employeeCount: string;
  location: string;
  primaryThreats: string[];
  currentMeasures: any;
}): Promise<SMEActionPlan | null> {
  try {
    const res = await fetch('/api/gemini/action-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to generate action plan');
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('SME action plan error:', err);
    return null;
  }
}

export async function sendChatMessageToCopilot(messages: { role: string; text: string }[], context: any): Promise<string> {
  try {
    const res = await fetch('/api/gemini/chat-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context })
    });
    if (!res.ok) throw new Error('Chat failed');
    const json = await res.json();
    return json.reply || 'No response received.';
  } catch (err: any) {
    console.error('Chat error:', err);
    return 'Unable to connect to Climate Copilot server at this moment.';
  }
}

export async function sendClimateChatMessage(payload: {
  message: string;
  locationContext: string;
  conversationHistory: { role: string; text: string }[];
}): Promise<string> {
  const allMessages = [
    ...payload.conversationHistory,
    { role: 'user', text: payload.message }
  ];
  return sendChatMessageToCopilot(allMessages, { location: payload.locationContext });
}

export async function generateInstitutionalAuditReport(payload: {
  location: any;
  hazards: any;
  sensors: any;
  smeProfiles: any;
  incidents: any;
}): Promise<AuditReportData | null> {
  try {
    const res = await fetch('/api/gemini/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to generate report');
    const json = await res.json();
    return json.report || null;
  } catch (err) {
    console.error('Report generation error:', err);
    return null;
  }
}
