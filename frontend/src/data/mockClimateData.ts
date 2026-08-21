import { LocationProfile, SensorNode, CriticalAsset, EarlyWarningAlert, SMEProfile, DepartmentIncident } from '../types/climate';

export const GLOBAL_HOTSPOTS: LocationProfile[] = [
  {
    id: 'thames-london',
    name: 'London & Thames Catchment',
    region: 'Greater London',
    country: 'United Kingdom',
    coordinates: [51.5074, -0.1278],
    elevationM: 14,
    population: 8982000,
    primaryRisk: 'flood',
    vulnerabilityIndex: 68,
    riverBasin: 'Thames & Lea Estuary',
    criticalAssetsCount: 42
  },
  {
    id: 'valencia-turia',
    name: 'Valencia & Turia Basin',
    region: 'Comunidad Valenciana',
    country: 'Spain',
    coordinates: [39.4699, -0.3763],
    elevationM: 15,
    population: 792000,
    primaryRisk: 'flood',
    vulnerabilityIndex: 82,
    riverBasin: 'Turia & Júcar Watershed',
    criticalAssetsCount: 36
  },
  {
    id: 'houston-bayou',
    name: 'Houston & Galveston Bay',
    region: 'Texas',
    country: 'United States',
    coordinates: [29.7604, -95.3698],
    elevationM: 13,
    population: 2304000,
    primaryRisk: 'coastal_surge',
    vulnerabilityIndex: 79,
    riverBasin: 'Buffalo & San Jacinto Bayous',
    criticalAssetsCount: 58
  },
  {
    id: 'nairobi-basin',
    name: 'Nairobi & Athi River Basin',
    region: 'Nairobi County',
    country: 'Kenya',
    coordinates: [-1.2921, 36.8219],
    elevationM: 1795,
    population: 4397000,
    primaryRisk: 'drought',
    vulnerabilityIndex: 74,
    riverBasin: 'Nairobi-Athi Drainage',
    criticalAssetsCount: 29
  },
  {
    id: 'tokyo-delta',
    name: 'Tokyo & Kanto Basin',
    region: 'Kanto',
    country: 'Japan',
    coordinates: [35.6762, 139.6503],
    elevationM: 40,
    population: 13960000,
    primaryRisk: 'flood',
    vulnerabilityIndex: 62,
    riverBasin: 'Tone & Arakawa River Network',
    criticalAssetsCount: 65
  },
  {
    id: 'mumbai-basin',
    name: 'Mumbai & Mithi Watershed',
    region: 'Maharashtra',
    country: 'India',
    coordinates: [19.076, 72.8777],
    elevationM: 8,
    population: 12480000,
    primaryRisk: 'flood',
    vulnerabilityIndex: 88,
    riverBasin: 'Mithi River Basin',
    criticalAssetsCount: 51
  },
  {
    id: 'sao-paulo-tiete',
    name: 'São Paulo & Tietê Corridor',
    region: 'São Paulo',
    country: 'Brazil',
    coordinates: [-23.5505, -46.6333],
    elevationM: 760,
    population: 12330000,
    primaryRisk: 'drought',
    vulnerabilityIndex: 71,
    riverBasin: 'Alto Tietê Basin',
    criticalAssetsCount: 44
  }
];

export const INITIAL_SENSORS: SensorNode[] = [
  {
    id: 'SN-THAMES-01',
    name: 'Basalt River Gauge - Station Alpha',
    type: 'river_stage',
    locationName: 'Upstream Basin Reach #4',
    coordinates: [51.52, -0.16],
    currentValue: 4.82,
    unit: 'm elevation',
    normalRange: [1.2, 3.8],
    status: 'critical',
    batteryPct: 94,
    lastUpdated: '1 min ago',
    history: [
      { timestamp: '00:00', value: 2.4 },
      { timestamp: '04:00', value: 2.9 },
      { timestamp: '08:00', value: 3.5 },
      { timestamp: '12:00', value: 4.1 },
      { timestamp: '16:00', value: 4.6 },
      { timestamp: '20:00', value: 4.82 }
    ],
    isAnomalyDetected: false
  },
  {
    id: 'SN-SOIL-02',
    name: 'Agricultural Zone Agro-Moisture Array',
    type: 'soil_moisture',
    locationName: 'Eastern Sector Farm Corridor',
    coordinates: [51.49, -0.04],
    currentValue: 14.2,
    unit: '% saturation (0-25cm)',
    normalRange: [30.0, 55.0],
    status: 'warning',
    batteryPct: 88,
    lastUpdated: '3 mins ago',
    history: [
      { timestamp: '00:00', value: 22.0 },
      { timestamp: '04:00', value: 20.1 },
      { timestamp: '08:00', value: 17.5 },
      { timestamp: '12:00', value: 15.8 },
      { timestamp: '16:00', value: 14.7 },
      { timestamp: '20:00', value: 14.2 }
    ],
    isAnomalyDetected: false
  },
  {
    id: 'SN-HEAT-03',
    name: 'Urban Core Wet-Bulb Heat Sensor',
    type: 'wet_bulb_temp',
    locationName: 'Commercial Business District Central',
    coordinates: [51.51, -0.11],
    currentValue: 31.4,
    unit: '°C WBGT',
    normalRange: [18.0, 28.0],
    status: 'warning',
    batteryPct: 99,
    lastUpdated: 'Just now',
    history: [
      { timestamp: '00:00', value: 22.1 },
      { timestamp: '04:00', value: 21.0 },
      { timestamp: '08:00', value: 26.4 },
      { timestamp: '12:00', value: 30.1 },
      { timestamp: '16:00', value: 32.2 },
      { timestamp: '20:00', value: 31.4 }
    ],
    isAnomalyDetected: false
  },
  {
    id: 'SN-RAIN-04',
    name: 'Radar-Calibrated Catchment Pluviometer',
    type: 'precipitation',
    locationName: 'Highland Drainage Ridge',
    coordinates: [51.54, -0.08],
    currentValue: 38.6,
    unit: 'mm / 6-hour accum',
    normalRange: [0.0, 20.0],
    status: 'critical',
    batteryPct: 91,
    lastUpdated: '2 mins ago',
    history: [
      { timestamp: '00:00', value: 2.1 },
      { timestamp: '04:00', value: 6.4 },
      { timestamp: '08:00', value: 14.8 },
      { timestamp: '12:00', value: 25.2 },
      { timestamp: '16:00', value: 34.0 },
      { timestamp: '20:00', value: 38.6 }
    ],
    isAnomalyDetected: false
  },
  {
    id: 'SN-AQUIFER-05',
    name: 'Deep Aquifer Piezometer Well #12',
    type: 'groundwater_level',
    locationName: 'Valley Water District Wellfield',
    coordinates: [51.47, -0.15],
    currentValue: -18.4,
    unit: 'm below surface',
    normalRange: [-12.0, -5.0],
    status: 'warning',
    batteryPct: 82,
    lastUpdated: '10 mins ago',
    history: [
      { timestamp: '00:00', value: -16.2 },
      { timestamp: '04:00', value: -16.8 },
      { timestamp: '08:00', value: -17.4 },
      { timestamp: '12:00', value: -17.9 },
      { timestamp: '16:00', value: -18.2 },
      { timestamp: '20:00', value: -18.4 }
    ],
    isAnomalyDetected: false
  }
];

export const CRITICAL_ASSETS: CriticalAsset[] = [
  {
    id: 'AST-PWR-01',
    name: 'Valley Substation 132kV Grid Node',
    category: 'energy_substation',
    coordinates: [51.512, -0.15],
    elevationM: 7.2,
    floodBreachThresholdM: 4.5,
    heatToleranceC: 40.0,
    estimatedAssetValueMillionsUSD: 48.5,
    riskRating: 'Severe',
    backupPowerPresent: true,
    protectiveMeasures: ['Demountable Flood Barriers', 'Automatic SCADA Breakers', 'Thermal Redundancy Coolers']
  },
  {
    id: 'AST-MED-02',
    name: 'St. Jude Metropolitan Trauma Center',
    category: 'hospital',
    coordinates: [51.522, -0.09],
    elevationM: 18.4,
    floodBreachThresholdM: 6.2,
    heatToleranceC: 44.0,
    estimatedAssetValueMillionsUSD: 180.0,
    riskRating: 'Moderate',
    backupPowerPresent: true,
    protectiveMeasures: ['Dual Diesel Microgrid', 'Chilled Water Storage', 'Elevated ER Loading Bay']
  },
  {
    id: 'AST-H2O-03',
    name: 'Eastern Estuary Water Purification Plant',
    category: 'water_treatment',
    coordinates: [51.485, -0.02],
    elevationM: 4.1,
    floodBreachThresholdM: 3.9,
    heatToleranceC: 42.0,
    estimatedAssetValueMillionsUSD: 95.0,
    riskRating: 'Severe',
    backupPowerPresent: true,
    protectiveMeasures: ['Perimeter Berm Dyke', 'Emergency Submersible Pumps']
  },
  {
    id: 'AST-SME-04',
    name: 'Riverside Industrial SME Logistics Park',
    category: 'sme_cluster',
    coordinates: [51.498, -0.17],
    elevationM: 5.5,
    floodBreachThresholdM: 4.2,
    heatToleranceC: 38.0,
    estimatedAssetValueMillionsUSD: 62.0,
    riskRating: 'High',
    backupPowerPresent: false,
    protectiveMeasures: ['Modular Sandbag Staging', 'Elevated Inventory Racks']
  },
  {
    id: 'AST-AGR-05',
    name: 'Meridian Organic Grain & Greenhouse Belt',
    category: 'agricultural_zone',
    coordinates: [51.465, -0.05],
    elevationM: 22.0,
    floodBreachThresholdM: 8.0,
    heatToleranceC: 36.0,
    estimatedAssetValueMillionsUSD: 34.0,
    riskRating: 'High',
    backupPowerPresent: false,
    protectiveMeasures: ['Precision Drip Regulators', 'Soil Mulch Moisture Retention']
  }
];

export const INITIAL_ALERTS: EarlyWarningAlert[] = [
  {
    id: 'EWS-2026-0801',
    hazard: 'Flood',
    severity: 'Emergency',
    title: 'RED ALERT: Flash Inundation Warning for Low-Lying Districts',
    headline: 'Upstream Basin discharge exceeded 95th percentile. River stage rising at 22cm/hr.',
    instruction: 'Activate commercial flood gates, evacuate sub-grade SME basements, and move heavy logistics machinery to zone 3 high ground.',
    affectedDistricts: ['Valley Reach #4', 'Riverside SME Hub', 'Estuary Marsh Sector'],
    issuedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    channelsBroadcasted: ['Sirens', 'SMS Cell Broadcast', 'Mobile Push', 'WhatsApp Business', 'EAS Radio'],
    active: true
  },
  {
    id: 'EWS-2026-0802',
    hazard: 'Extreme Heat',
    severity: 'Warning',
    title: 'AMBER ADVISORY: Hazardous Urban Heat Island & WBGT Spike',
    headline: 'Wet-bulb temperatures projected to hit 32°C. High heat stroke vulnerability for outdoor workforce.',
    instruction: 'Enforce 15-minute hydration breaks per hour for construction/field teams. Public cooling shelters open at transit hubs.',
    affectedDistricts: ['Downtown Metro Core', 'Commercial South Sector'],
    issuedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    channelsBroadcasted: ['SMS Cell Broadcast', 'Mobile Push'],
    active: true
  },
  {
    id: 'EWS-2026-0803',
    hazard: 'Drought',
    severity: 'Watch',
    title: 'YELLOW WATCH: Agricultural Soil Moisture Deficit Stage 2',
    headline: 'Consecutive 28-day precipitation shortfall. Reservoir capacity down to 38%.',
    instruction: 'Implement Tier-2 drip irrigation rationing. Review crop moisture stress indices.',
    affectedDistricts: ['Eastern Agricultural Belt', 'Valley Water District'],
    issuedAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    channelsBroadcasted: ['WhatsApp Business', 'Mobile Push'],
    active: true
  }
];

export const DEFAULT_INCIDENTS: DepartmentIncident[] = [
  {
    id: 'INC-2026-001',
    title: 'Flash Inundation Defense Deployment - Valley Reach #4',
    hazardType: 'flood',
    severity: 'critical',
    location: 'Upstream Basin Reach #4',
    coordinates: [51.52, -0.16],
    reportedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: 'in_progress',
    department: 'Public Works',
    assignedTo: 'Hydrology Crisis Unit Alpha',
    actionsTaken: [
      'Activated 40,000 L/min mobile pumps',
      'Deployed demountable flood gates at substation #1',
      'Pre-alerted low-elevation logistics & freight depot'
    ],
    automatedDispatchSent: true
  },
  {
    id: 'INC-2026-002',
    title: 'Urban Heat Island Cooling Shelter Activation',
    hazardType: 'heatwave',
    severity: 'high',
    location: 'Commercial Business District',
    coordinates: [51.51, -0.11],
    reportedAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    status: 'active',
    department: 'Healthcare',
    assignedTo: 'Public Health Taskforce 3',
    actionsTaken: [
      'Opened 4 air-conditioned hydration shelters at transit stations',
      'Dispatched mobile EMT heat check units'
    ],
    automatedDispatchSent: true
  },
  {
    id: 'INC-2026-003',
    title: 'Tier-2 Agricultural Water Rationing Broadcast',
    hazardType: 'drought',
    severity: 'moderate',
    location: 'Eastern Sector Farm Corridor',
    coordinates: [51.49, -0.04],
    reportedAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    status: 'mitigated',
    department: 'Agriculture',
    assignedTo: 'Regional Water Authority',
    actionsTaken: [
      'Initiated twilight pulsed drip irrigation scheduling',
      'Notified 14 farm co-operatives of aquifer retention thresholds'
    ],
    automatedDispatchSent: true
  }
];

export const DEFAULT_SME_PROFILES: SMEProfile[] = [
  {
    id: 'sme-01',
    name: 'Apex Precision Logistics & Warehousing',
    industry: 'Cold Chain & Freight Warehousing',
    location: 'Riverside Industrial SME Logistics Park',
    headcount: 54,
    facilityElevationM: 5.5,
    primaryHazards: ['Flash Inundation', 'Grid Blackout', 'Road Access Cutoff'],
    readinessScore: 64,
    hasFloodBarriers: true,
    hasBackupGenerator: true,
    hasSupplyChainRedundancy: false,
    hasClimateInsurance: true,
    lastAuditDate: '2026-06-15'
  },
  {
    id: 'sme-02',
    name: 'BioHarvest Greenhouse Co-op',
    industry: 'High-Value Horticultural Farming',
    location: 'Meridian Organic Grain Belt',
    headcount: 28,
    facilityElevationM: 22.0,
    primaryHazards: ['Severe Drought', 'Extreme Heat Scorching', 'Water Rationing'],
    readinessScore: 58,
    hasFloodBarriers: false,
    hasBackupGenerator: false,
    hasSupplyChainRedundancy: true,
    hasClimateInsurance: false,
    lastAuditDate: '2026-07-02'
  },
  {
    id: 'sme-03',
    name: 'Vanguard Micro-Electronics & CNC Tech',
    industry: 'Precision Manufacturing',
    location: 'Valley Light Industry Center',
    headcount: 72,
    facilityElevationM: 6.8,
    primaryHazards: ['Grid Thermal Surge', 'Basement Machine Flooding'],
    readinessScore: 78,
    hasFloodBarriers: true,
    hasBackupGenerator: true,
    hasSupplyChainRedundancy: true,
    hasClimateInsurance: true,
    lastAuditDate: '2026-08-01'
  }
];

export const DEFAULT_LOCATIONS = GLOBAL_HOTSPOTS;
export const DEFAULT_SENSORS = INITIAL_SENSORS;
export const DEFAULT_CRITICAL_ASSETS = CRITICAL_ASSETS;
export const DEFAULT_ALERTS = INITIAL_ALERTS;

// ── Generate realistic data for any searched location ──

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

export function generateLocationData(loc: LocationProfile) {
  const [lat, lng] = loc.coordinates;
  const seed = hashStr(loc.id + loc.name);
  const rand = seededRandom(seed);

  const isCoastal = Math.abs(lat) < 30 || loc.primaryRisk === 'coastal_surge';
  const isTropical = Math.abs(lat) < 23.5;
  const isArid = loc.primaryRisk === 'drought';

  const baseOffset = 0.008;

  const sensors: SensorNode[] = [
    {
      id: `SN-RIVER-${seed.toString(16).slice(0,4).toUpperCase()}`,
      name: `Main River Stage Gauge - ${loc.region}`,
      type: 'river_stage',
      locationName: `${loc.name} Upstream Reach`,
      coordinates: [lat + rand() * baseOffset, lng + rand() * baseOffset],
      currentValue: +(1.5 + rand() * 4.5).toFixed(2),
      unit: 'm elevation',
      normalRange: [0.8, 3.2],
      status: rand() > 0.6 ? 'warning' : 'optimal',
      batteryPct: Math.floor(80 + rand() * 20),
      lastUpdated: `${Math.floor(1 + rand() * 5)} mins ago`,
      history: Array.from({ length: 6 }, (_, i) => ({
        timestamp: `${String(i * 4).padStart(2, '0')}:00`,
        value: +(1.2 + rand() * 3.5 + i * 0.3).toFixed(1)
      })),
      isAnomalyDetected: rand() > 0.85
    },
    {
      id: `SN-SOIL-${seed.toString(16).slice(0,4).toUpperCase()}`,
      name: `Soil Moisture Sensor Array - ${loc.region}`,
      type: 'soil_moisture',
      locationName: `${loc.name} Agricultural Zone`,
      coordinates: [lat - rand() * baseOffset, lng + rand() * baseOffset],
      currentValue: isArid ? +(8 + rand() * 12).toFixed(1) : +(25 + rand() * 30).toFixed(1),
      unit: '% saturation (0-25cm)',
      normalRange: isArid ? [10, 25] : [30, 55],
      status: isArid ? 'critical' : rand() > 0.5 ? 'optimal' : 'warning',
      batteryPct: Math.floor(75 + rand() * 25),
      lastUpdated: `${Math.floor(2 + rand() * 8)} mins ago`,
      history: Array.from({ length: 6 }, (_, i) => ({
        timestamp: `${String(i * 4).padStart(2, '0')}:00`,
        value: isArid ? +(10 + rand() * 8 - i * 0.5).toFixed(1) : +(30 + rand() * 20 - i * 1.2).toFixed(1)
      })),
      isAnomalyDetected: false
    },
    {
      id: `SN-HEAT-${seed.toString(16).slice(0,4).toUpperCase()}`,
      name: `Urban Heat Island WBGT Sensor`,
      type: 'wet_bulb_temp',
      locationName: `${loc.name} City Center`,
      coordinates: [lat + rand() * baseOffset * 0.5, lng - rand() * baseOffset * 0.5],
      currentValue: isTropical ? +(28 + rand() * 6).toFixed(1) : +(20 + rand() * 12).toFixed(1),
      unit: '°C WBGT',
      normalRange: [18.0, 28.0],
      status: (isTropical && rand() > 0.4) ? 'warning' : 'optimal',
      batteryPct: Math.floor(90 + rand() * 10),
      lastUpdated: 'Just now',
      history: Array.from({ length: 6 }, (_, i) => ({
        timestamp: `${String(i * 4).padStart(2, '0')}:00`,
        value: +(18 + rand() * 10 + Math.sin(i * 0.8) * 4).toFixed(1)
      })),
      isAnomalyDetected: false
    },
    {
      id: `SN-RAIN-${seed.toString(16).slice(0,4).toUpperCase()}`,
      name: `Catchment Pluviometer - ${loc.region}`,
      type: 'precipitation',
      locationName: `${loc.name} Highland Ridge`,
      coordinates: [lat + rand() * baseOffset * 1.5, lng + rand() * baseOffset * 1.5],
      currentValue: isCoastal ? +(20 + rand() * 30).toFixed(1) : +(2 + rand() * 15).toFixed(1),
      unit: 'mm / 6-hour accum',
      normalRange: [0, isCoastal ? 25 : 15],
      status: isCoastal && rand() > 0.3 ? 'critical' : 'optimal',
      batteryPct: Math.floor(85 + rand() * 15),
      lastUpdated: `${Math.floor(1 + rand() * 4)} mins ago`,
      history: Array.from({ length: 6 }, (_, i) => ({
        timestamp: `${String(i * 4).padStart(2, '0')}:00`,
        value: +(rand() * 10 + i * 2).toFixed(1)
      })),
      isAnomalyDetected: false
    },
    {
      id: `SN-AQUIF-${seed.toString(16).slice(0,4).toUpperCase()}`,
      name: `Deep Aquifer Piezometer - ${loc.region}`,
      type: 'groundwater_level',
      locationName: `${loc.name} Valley Wellfield`,
      coordinates: [lat - rand() * baseOffset, lng - rand() * baseOffset],
      currentValue: isArid ? -(15 + rand() * 10) : -(4 + rand() * 10),
      unit: 'm below surface',
      normalRange: isArid ? [-20, -8] : [-12, -3],
      status: isArid ? 'warning' : 'optimal',
      batteryPct: Math.floor(70 + rand() * 30),
      lastUpdated: `${Math.floor(5 + rand() * 15)} mins ago`,
      history: Array.from({ length: 6 }, (_, i) => ({
        timestamp: `${String(i * 4).padStart(2, '0')}:00`,
        value: isArid ? -(14 + rand() * 6 + i * 0.5) : -(5 + rand() * 6 + i * 0.3)
      })),
      isAnomalyDetected: false
    }
  ];

  const hazards: ('Flood' | 'Drought' | 'Extreme Heat' | 'Flash Storm' | 'Wildfire')[] =
    loc.primaryRisk === 'drought' ? ['Drought', 'Extreme Heat', 'Flash Storm']
    : loc.primaryRisk === 'coastal_surge' ? ['Flood', 'Flash Storm', 'Extreme Heat']
    : loc.primaryRisk === 'heatwave' ? ['Extreme Heat', 'Drought', 'Wildfire']
    : loc.primaryRisk === 'wildfire' ? ['Wildfire', 'Extreme Heat', 'Flash Storm']
    : ['Flood', 'Flash Storm', 'Extreme Heat'];

  const severityOrder: Record<string, number> = { Emergency: 4, Warning: 3, Watch: 2, Advisory: 1 };
  const severities: Array<'Emergency' | 'Warning' | 'Watch' | 'Advisory'> = ['Emergency', 'Warning', 'Watch', 'Advisory'];
  const channels: Array<'Sirens' | 'SMS Cell Broadcast' | 'Mobile Push' | 'WhatsApp Business' | 'EAS Radio'> = ['Sirens', 'SMS Cell Broadcast', 'Mobile Push', 'WhatsApp Business', 'EAS Radio'];

  const districts = [
    `${loc.name} North Sector`,
    `${loc.name} Downtown Core`,
    `${loc.name} Riverside District`,
    `${loc.name} Eastern Corridor`,
    `${loc.name} Highland Zone`
  ];

  const alertTitles: Record<string, string[]> = {
    Flood: ['FLASH FLOOD WARNING: River Stage Exceeding Critical Threshold', 'FLOOD WATCH: Upstream Catchment Saturated', 'COASTAL SURGE ALERT: High Tide Combined with Storm Runoff'],
    Drought: ['DROUGHT ADVISORY: Prolonged Precipitation Deficit', 'WATER RESTRICTION: Reservoir Levels Below 40%', 'AGRICULTURAL ALERT: Soil Moisture Critical Deficit'],
    'Extreme Heat': ['HEAT EMERGENCY: Dangerous Urban Heat Island Effect', 'HEAT WAVE WARNING: WBGT Exceeding Safe Limits', 'HEAT ADVISORY: Prolonged高温 Period Expected'],
    'Flash Storm': ['STORM WARNING: Severe Convective Activity Imminent', 'FLASH FLOOD WATCH: Intense Rainfall Expected', 'WIND ADVISORY: Damaging Gusts Projected'],
    Wildfire: ['WILDFIRE ALERT: Elevated Fire Danger Conditions', 'SMOKE ADVISORY: Air Quality Deteriorating', 'EVACUATION WATCH: Fire Front Approaching Residential Zone']
  };

  const alertHeadlines: Record<string, string[]> = {
    Flood: ['Upstream discharge at 95th percentile. River stage rising rapidly.', 'Monsoon rainfall 200% above seasonal average for 72 hours.', 'Storm surge combined with spring tide threatens low-lying areas.'],
    Drought: ['30-day cumulative rainfall deficit exceeding 60%. Reservoir storage declining.', 'Groundwater table at record low. Agricultural wells stressed.', 'Municipal water restrictions may be required within 14 days.'],
    'Extreme Heat': ['Wet-bulb temperatures projected to hit 33°C. Outdoor worker safety at risk.', 'Nighttime temperatures not dropping below 26°C for 5 consecutive nights.', 'Heat index values exceeding 42°C in urban core areas.'],
    'Flash Storm': ['Atmospheric instability producing severe thunderstorms with >50mm/hr rainfall.', 'Downdraft potential with wind gusts up to 90 km/h.', 'Hail risk for exposed infrastructure and agriculture.'],
    Wildfire: ['Fire weather index at Extreme level. Wind-driven spread possible.', 'Relative humidity below 15% with sustained winds >30 km/h.', 'Spot fire risk elevated. Ember attack possible 2km ahead of fire front.']
  };

  const activeAlerts = Math.min(3, 1 + Math.floor(rand() * 3));
  const alerts: EarlyWarningAlert[] = Array.from({ length: activeAlerts }, (_, i) => {
    const hazard = hazards[i % hazards.length];
    const sev = severities[Math.min(i, 3)];
    return {
      id: `EWS-${loc.id.slice(0,8)}-${String(i + 1).padStart(3, '0')}`,
      hazard,
      severity: sev,
      title: alertTitles[hazard][i % alertTitles[hazard].length],
      headline: alertHeadlines[hazard][i % alertHeadlines[hazard].length],
      instruction: `Monitor conditions closely. Follow local authority guidance for ${loc.region}.`,
      affectedDistricts: districts.slice(0, 2 + Math.floor(rand() * 3)),
      issuedAt: new Date(Date.now() - (20 + rand() * 200) * 60000).toISOString(),
      expiresAt: new Date(Date.now() + (6 + rand() * 48) * 3600000).toISOString(),
      channelsBroadcasted: channels.slice(0, 2 + Math.floor(rand() * 3)),
      active: true
    };
  });

  const incHazardTypes: Array<'flood' | 'drought' | 'heatwave' | 'wildfire' | 'storm'> =
    loc.primaryRisk === 'drought' ? ['drought', 'heatwave', 'storm']
    : loc.primaryRisk === 'wildfire' ? ['wildfire', 'heatwave', 'storm']
    : ['flood', 'storm', 'heatwave'];

  const incDepartments: Array<'Emergency Management' | 'Public Works' | 'Healthcare' | 'Agriculture' | 'SME Liaison'> = ['Emergency Management', 'Public Works', 'Healthcare', 'Agriculture', 'SME Liaison'];
  const incStatuses: Array<'active' | 'in_progress' | 'mitigated' | 'resolved'> = ['in_progress', 'active', 'mitigated'];
  const incSeverities: Array<'low' | 'moderate' | 'high' | 'critical'> = ['critical', 'high', 'moderate'];

  const incidents: DepartmentIncident[] = Array.from({ length: 1 + Math.floor(rand() * 3) }, (_, i) => {
    const ht = incHazardTypes[i % incHazardTypes.length];
    const dept = incDepartments[i % incDepartments.length];
    return {
      id: `INC-${loc.id.slice(0,6).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
      title: `${ht.charAt(0).toUpperCase() + ht.slice(1)} Response Deployment - ${districts[i % districts.length]}`,
      hazardType: ht,
      severity: incSeverities[i % incSeverities.length],
      location: districts[i % districts.length],
      coordinates: [lat + (rand() - 0.5) * baseOffset * 4, lng + (rand() - 0.5) * baseOffset * 4] as [number, number],
      reportedAt: new Date(Date.now() - (15 + rand() * 300) * 60000).toISOString(),
      status: incStatuses[i % incStatuses.length],
      department: dept,
      assignedTo: `${dept} Unit ${String.fromCharCode(65 + Math.floor(rand() * 6))}`,
      actionsTaken: [
        `Deployed response team to ${districts[i % districts.length]}`,
        'Initiated emergency monitoring protocol',
        'Pre-alerted adjacent zone command'
      ],
      automatedDispatchSent: true
    };
  });

  const assetCategories: Array<{ category: CriticalAsset['category']; nameSuffix: string; baseRisk: CriticalAsset['riskRating'] }> = [
    { category: 'energy_substation', nameSuffix: 'Regional Power Grid Node', baseRisk: 'Severe' },
    { category: 'hospital', nameSuffix: 'Metropolitan Medical Center', baseRisk: 'Moderate' },
    { category: 'water_treatment', nameSuffix: 'Water Purification Facility', baseRisk: 'Severe' },
    { category: 'sme_cluster', nameSuffix: 'Industrial SME Logistics Park', baseRisk: 'High' },
    { category: 'agricultural_zone', nameSuffix: 'Agricultural Production Zone', baseRisk: 'High' }
  ];

  const assets: CriticalAsset[] = assetCategories.map((ac, i) => ({
    id: `AST-${loc.id.slice(0,4).toUpperCase()}-${String(i + 1).padStart(2, '0')}`,
    name: `${loc.name} ${ac.nameSuffix}`,
    category: ac.category,
    coordinates: [lat + (rand() - 0.5) * baseOffset * 6, lng + (rand() - 0.5) * baseOffset * 6] as [number, number],
    elevationM: +(loc.elevationM * (0.5 + rand())).toFixed(1),
    floodBreachThresholdM: +(loc.elevationM * 0.4 + rand() * 3).toFixed(1),
    heatToleranceC: 36 + Math.floor(rand() * 10),
    estimatedAssetValueMillionsUSD: +(20 + rand() * 180).toFixed(1),
    riskRating: ac.baseRisk,
    backupPowerPresent: rand() > 0.3,
    protectiveMeasures: ['Emergency Barriers', 'Automated Monitoring', 'Backup Systems'].slice(0, 1 + Math.floor(rand() * 3))
  }));

  const smeProfiles: SMEProfile[] = [
    {
      id: `sme-${loc.id.slice(0,6)}-01`,
      name: `${loc.name} Logistics & Warehousing Co.`,
      industry: 'Cold Chain & Freight Warehousing',
      location: `${loc.name} Industrial Zone`,
      headcount: 30 + Math.floor(rand() * 70),
      facilityElevationM: +(loc.elevationM * 0.6).toFixed(1),
      primaryHazards: hazards.slice(0, 3).map(h => h),
      readinessScore: 40 + Math.floor(rand() * 45),
      hasFloodBarriers: rand() > 0.4,
      hasBackupGenerator: rand() > 0.3,
      hasSupplyChainRedundancy: rand() > 0.5,
      hasClimateInsurance: rand() > 0.5,
      lastAuditDate: `2026-${String(1 + Math.floor(rand() * 8)).padStart(2, '0')}-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`
    },
    {
      id: `sme-${loc.id.slice(0,6)}-02`,
      name: `${loc.name} Agriculture & Greenhouse`,
      industry: 'High-Value Farming',
      location: `${loc.name} Agricultural Belt`,
      headcount: 15 + Math.floor(rand() * 40),
      facilityElevationM: +(loc.elevationM * 1.2).toFixed(1),
      primaryHazards: hazards.slice(0, 2).map(h => h),
      readinessScore: 35 + Math.floor(rand() * 40),
      hasFloodBarriers: rand() > 0.6,
      hasBackupGenerator: rand() > 0.6,
      hasSupplyChainRedundancy: rand() > 0.4,
      hasClimateInsurance: rand() > 0.6,
      lastAuditDate: `2026-${String(1 + Math.floor(rand() * 8)).padStart(2, '0')}-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`
    },
    {
      id: `sme-${loc.id.slice(0,6)}-03`,
      name: `${loc.name} Micro-Electronics & Tech`,
      industry: 'Precision Manufacturing',
      location: `${loc.name} Tech Park`,
      headcount: 40 + Math.floor(rand() * 60),
      facilityElevationM: +(loc.elevationM * 0.8).toFixed(1),
      primaryHazards: hazards.slice(0, 2).map(h => h),
      readinessScore: 55 + Math.floor(rand() * 40),
      hasFloodBarriers: rand() > 0.3,
      hasBackupGenerator: rand() > 0.2,
      hasSupplyChainRedundancy: rand() > 0.3,
      hasClimateInsurance: rand() > 0.3,
      lastAuditDate: `2026-${String(1 + Math.floor(rand() * 8)).padStart(2, '0')}-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`
    }
  ];

  return { sensors, alerts, incidents, assets, smeProfiles };
}


