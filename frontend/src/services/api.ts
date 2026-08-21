import { DepartmentIncident, LiveWeatherData } from '../types/climate';

export async function fetchLiveClimate(lat: number, lon: number, locationName?: string): Promise<LiveWeatherData | null> {
  try {
    const res = await fetch(`/api/climate/live?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error('API request failed');
    const raw = await res.json();
    
    // If already flat LiveWeatherData
    if (raw && typeof raw.temperature === 'number' && raw.hourly && raw.daily) {
      return raw as LiveWeatherData;
    }

    const weather = raw?.weather;
    const flood = raw?.flood;
    const current = weather?.current || {};
    const hourly = weather?.hourly || {};
    const daily = weather?.daily || {};
    const floodDaily = flood?.daily || {};

    // If critical current fields are missing, the backend payload is incomplete — return null
    if (current.temperature_2m == null && hourly.time == null && daily.time == null) {
      return null;
    }

    const transformed: LiveWeatherData = {
      temperature: current.temperature_2m ?? 0,
      apparentTemperature: current.apparent_temperature ?? current.temperature_2m ?? 0,
      humidity: current.relative_humidity_2m ?? 0,
      precipitationMm: current.precipitation ?? 0,
      windSpeedKmh: current.wind_speed_10m ?? 0,
      windDirection: current.wind_direction_10m ?? 0,
      surfacePressureHpa: current.surface_pressure ?? 0,
      weatherCode: current.weather_code ?? 0,
      hourly: {
        time: Array.isArray(hourly.time) ? hourly.time : [],
        temperature: Array.isArray(hourly.temperature_2m) ? hourly.temperature_2m : [],
        precipitationProbability: Array.isArray(hourly.precipitation_probability) ? hourly.precipitation_probability : [],
        precipitation: Array.isArray(hourly.precipitation) ? hourly.precipitation : [],
        soilMoistureSurface: Array.isArray(hourly.soil_moisture_0_to_1cm) ? hourly.soil_moisture_0_to_1cm : [],
        soilMoistureRoot: Array.isArray(hourly.soil_moisture_3_to_9cm) 
          ? hourly.soil_moisture_3_to_9cm 
          : Array.isArray(hourly.soil_moisture_1_to_3cm) 
          ? hourly.soil_moisture_1_to_3cm 
          : []
      },
      daily: {
        time: Array.isArray(daily.time) ? daily.time : [],
        tempMax: Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max : [],
        tempMin: Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min : [],
        precipitationSum: Array.isArray(daily.precipitation_sum) ? daily.precipitation_sum : [],
        precipitationProbabilityMax: Array.isArray(daily.precipitation_probability_max) ? daily.precipitation_probability_max : []
      },
      floodForecast: floodDaily.time && Array.isArray(floodDaily.time) ? {
        time: floodDaily.time,
        riverDischarge: Array.isArray(floodDaily.river_discharge) ? floodDaily.river_discharge : Array.isArray(floodDaily.river_discharge_mean) ? floodDaily.river_discharge_mean : [],
        riverDischargeMax: Array.isArray(floodDaily.river_discharge_max) ? floodDaily.river_discharge_max : [],
        riverDischargeMin: Array.isArray(floodDaily.river_discharge_min) ? floodDaily.river_discharge_min : []
      } : undefined
    };

    return transformed;
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
