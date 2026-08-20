export type NavigationTabType = 
  | 'overview_gis'
  | 'flood_prediction'
  | 'drought_assessment'
  | 'vulnerability_var'
  | 'early_warning'
  | 'sme_preparedness'
  | 'scenario_simulator'
  | 'sensor_telemetry';

export interface LocationProfile {
  id: string;
  name: string;
  region: string;
  country: string;
  coordinates: [number, number];
  elevationM: number;
  population: number;
  primaryRisk: 'flood' | 'drought' | 'heatwave' | 'wildfire' | 'coastal_surge';
  vulnerabilityIndex: number;
  riverBasin?: string;
  criticalAssetsCount: number;
}

export interface LiveWeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitationMm: number;
  windSpeedKmh: number;
  windDirection: number;
  surfacePressureHpa: number;
  weatherCode: number;
  hourly: {
    time: string[];
    temperature: number[];
    precipitationProbability: number[];
    precipitation: number[];
    soilMoistureSurface: number[];
    soilMoistureRoot: number[];
  };
  daily: {
    time: string[];
    tempMax: number[];
    tempMin: number[];
    precipitationSum: number[];
    precipitationProbabilityMax: number[];
  };
  floodForecast?: {
    time: string[];
    riverDischarge: number[];
    riverDischargeMax: number[];
    riverDischargeMin: number[];
  };
}

export interface SensorNode {
  id: string;
  name: string;
  type: 'river_stage' | 'soil_moisture' | 'wet_bulb_temp' | 'precipitation' | 'groundwater_level';
  locationName: string;
  coordinates: [number, number];
  currentValue: number;
  unit: string;
  normalRange: [number, number];
  status: 'optimal' | 'warning' | 'critical' | 'offline';
  batteryPct: number;
  lastUpdated: string;
  history: { timestamp: string; value: number }[];
  isAnomalyDetected?: boolean;
}

export interface CriticalAsset {
  id: string;
  name: string;
  category: 'energy_substation' | 'hospital' | 'water_treatment' | 'transport_hub' | 'sme_cluster' | 'agricultural_zone';
  coordinates: [number, number];
  elevationM: number;
  floodBreachThresholdM: number;
  heatToleranceC: number;
  estimatedAssetValueMillionsUSD: number;
  riskRating: 'Low' | 'Moderate' | 'High' | 'Severe';
  backupPowerPresent: boolean;
  protectiveMeasures: string[];
}

export interface EarlyWarningAlert {
  id: string;
  hazard: 'Flood' | 'Drought' | 'Extreme Heat' | 'Flash Storm' | 'Wildfire';
  severity: 'Advisory' | 'Watch' | 'Warning' | 'Emergency';
  title: string;
  headline: string;
  instruction: string;
  affectedDistricts: string[];
  issuedAt: string;
  expiresAt: string;
  channelsBroadcasted: ('Sirens' | 'SMS Cell Broadcast' | 'Mobile Push' | 'WhatsApp Business' | 'EAS Radio')[];
  active: boolean;
}

export interface DepartmentIncident {
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
  automatedDispatchSent?: boolean;
}

export interface SMEProfile {
  id: string;
  name: string;
  industry: string;
  location: string;
  headcount: number;
  facilityElevationM: number;
  primaryHazards: string[];
  readinessScore: number;
  hasFloodBarriers: boolean;
  hasBackupGenerator: boolean;
  hasSupplyChainRedundancy: boolean;
  hasClimateInsurance: boolean;
  lastAuditDate: string;
}
