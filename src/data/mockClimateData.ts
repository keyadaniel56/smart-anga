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


