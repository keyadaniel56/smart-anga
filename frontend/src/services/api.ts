import { DepartmentIncident, LiveWeatherData } from '../types/climate';

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
