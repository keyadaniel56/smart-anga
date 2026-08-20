import { DepartmentIncident, LiveWeatherData } from '../types/climate';

// Global application status listener engine
type AppStatusCallback = (status: { live: boolean; msg?: string }) => void;
const listeners = new Set<AppStatusCallback>();

export const subscribeToStatusChanges = (callback: AppStatusCallback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const notifyStatusChange = (live: boolean, msg?: string) => {
  listeners.forEach(cb => cb({ live, msg }));
};

export async function fetchLiveClimate(lat: number, lon: number, locationName?: string): Promise<LiveWeatherData | null> {
  try {
    const res = await fetch(`/api/climate/live?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error(`Server returned status code: ${res.status}`);
    
    const data = await res.json();
    notifyStatusChange(true); // Signal connection is online
    return data;
  } catch (err: any) {
    console.warn('Fallback to local weather calculation:', err);
    notifyStatusChange(false, `Weather Telemetry Link Broken. ${err.message || 'Displaying cached fallback.'}`);
    return null;
  }
}

export const fetchLiveWeather = fetchLiveClimate;

export async function fetchIncidents(): Promise<DepartmentIncident[]> {
  try {
    const res = await fetch('/api/incidents');
    if (!res.ok) throw new Error(`Server returned status code: ${res.status}`);
    
    const data = await res.json();
    notifyStatusChange(true); // Signal connection is online
    return data.incidents || [];
  } catch (err: any) {
    console.error('Error fetching incidents:', err);
    notifyStatusChange(false, `Incident Feeds Unavailable. ${err.message || 'Operating on static offline data cache.'}`);
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
    if (!res.ok) throw new Error(`Dispatch failed with status: ${res.status}`);
    
    const data = await res.json();
    notifyStatusChange(true);
    return data.incident || null;
  } catch (err: any) {
    console.error('Error creating incident:', err);
    notifyStatusChange(false, `Could not dispatch incident. ${err.message}`);
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
    if (!res.ok) throw new Error(`Update failed with status: ${res.status}`);
    
    const data = await res.json();
    notifyStatusChange(true);
    return data.incident || null;
  } catch (err: any) {
    console.error('Error updating incident:', err);
    notifyStatusChange(false, `Could not process update parameters. ${err.message}`);
    return null;
  }
}

export const updateDepartmentIncident = updateIncident;
