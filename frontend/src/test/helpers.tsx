import React from 'react';
import { render } from '@testing-library/react';
import { LanguageProvider } from '../context/LanguageContext';
import { LocationProfile, LiveWeatherData, EarlyWarningAlert } from '../types/climate';

export function renderWithProviders(ui: React.ReactElement) {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}

export const mockLocation: LocationProfile = {
  id: 'test-location',
  name: 'Test City',
  region: 'Test Region',
  country: 'Testland',
  coordinates: [51.5, -0.1],
  elevationM: 50,
  population: 100000,
  primaryRisk: 'flood',
  vulnerabilityIndex: 55,
  riverBasin: 'Test River',
  criticalAssetsCount: 20,
};

export const mockWeather: LiveWeatherData = {
  temperature: 22,
  apparentTemperature: 20,
  humidity: 65,
  precipitationMm: 1.5,
  windSpeedKmh: 12,
  windDirection: 180,
  surfacePressureHpa: 1015,
  weatherCode: 3,
  hourly: {
    time: [],
    temperature: [],
    precipitationProbability: [],
    precipitation: [],
    soilMoistureSurface: [],
    soilMoistureRoot: [],
  },
  daily: {
    time: [],
    tempMax: [],
    tempMin: [],
    precipitationSum: [],
    precipitationProbabilityMax: [],
  },
};

export const mockAlerts: EarlyWarningAlert[] = [
  {
    id: 'alert-1',
    hazard: 'Flood',
    severity: 'Warning',
    title: 'Test flood alert',
    headline: 'River levels rising',
    instruction: 'Move to higher ground',
    affectedDistricts: ['District 1'],
    active: true,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    channelsBroadcasted: ['Sirens'],
  },
];
