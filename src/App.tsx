import React, { useState, useEffect } from 'react';
import { 
  NavigationTabType, 
  LocationProfile, 
  LiveWeatherData, 
  SensorNode, 
  CriticalAsset, 
  EarlyWarningAlert, 
  DepartmentIncident, 
  SMEProfile,
  GeminiRiskAssessment
} from './types/climate';
import { 
  DEFAULT_LOCATIONS, 
  DEFAULT_SENSORS, 
  DEFAULT_CRITICAL_ASSETS, 
  DEFAULT_ALERTS, 
  DEFAULT_INCIDENTS,
  DEFAULT_SME_PROFILES 
} from './data/mockClimateData';
import { fetchLiveWeather, assessClimateRisk, fetchDepartmentIncidents, updateDepartmentIncident } from './services/api';

import { Header } from './components/Header';
import { NavigationTabs } from './components/NavigationTabs';
import { RiskMap } from './components/RiskMap';
import { FloodPredictionModule } from './components/FloodPredictionModule';
import { DroughtAssessmentModule } from './components/DroughtAssessmentModule';
import { VulnerabilityDashboard } from './components/VulnerabilityDashboard';
import { EarlyWarningModule } from './components/EarlyWarningModule';
import { SMEPreparednessModule } from './components/SMEPreparednessModule';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { LiveSensorFeed } from './components/LiveSensorFeed';
import { ReportGeneratorModal } from './components/ReportGeneratorModal';
import { ClimateAIChatDrawer } from './components/ClimateAIChatDrawer';
import { 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight,
  FileText,
  Activity,
  Layers,
  CheckCircle2,
  Droplets,
  Wind,
  Gauge,
  CloudRain
} from 'lucide-react';

export default function App() {
  const [currentLocation, setCurrentLocation] = useState<LocationProfile>(DEFAULT_LOCATIONS[0]);
  const [activeTab, setActiveTab] = useState<NavigationTabType>('overview_gis');
  
  // Real-time Data State
  const [liveWeather, setLiveWeather] = useState<LiveWeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [sensors, setSensors] = useState<SensorNode[]>(DEFAULT_SENSORS);
  const [assets, setAssets] = useState<CriticalAsset[]>(DEFAULT_CRITICAL_ASSETS);
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>(DEFAULT_ALERTS);
  const [incidents, setIncidents] = useState<DepartmentIncident[]>(DEFAULT_INCIDENTS);
  const [smeProfiles, setSmeProfiles] = useState<SMEProfile[]>(DEFAULT_SME_PROFILES);

  // Modals and AI State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [aiAssessment, setAiAssessment] = useState<GeminiRiskAssessment | null>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);

  // Historical trend bar hover state
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // Load weather when location changes
  useEffect(() => {
    const loadWeather = async () => {
      setWeatherLoading(true);
      const data = await fetchLiveWeather(
        currentLocation.coordinates[0], 
        currentLocation.coordinates[1], 
        currentLocation.name
      );
      if (data) {
        setLiveWeather(data);
      }
      setWeatherLoading(false);
    };

    loadWeather();
  }, [currentLocation]);

  // Load server incidents on mount
  useEffect(() => {
    const loadIncidents = async () => {
      const serverIncidents = await fetchDepartmentIncidents();
      if (serverIncidents && serverIncidents.length > 0) {
        setIncidents(serverIncidents);
      }
    };
    loadIncidents();
  }, []);

  // Quick AI risk assessment handler
  const handleRunAiAssessment = async () => {
    setLoadingAssessment(true);
    try {
      const result = await assessClimateRisk({
        location: currentLocation,
        liveWeather,
        activeSensors: sensors,
        criticalAssets: assets
      });
      if (result) {
        setAiAssessment(result);
      }
    } catch (err) {
      console.error('Error assessing climate risk:', err);
    } finally {
      setLoadingAssessment(false);
    }
  };

  // Handler for incident updates
  const handleUpdateIncidentStatus = async (id: string, status: DepartmentIncident['status'], actionText?: string) => {
    const target = incidents.find(i => i.id === id);
    const updatedActions = actionText && target ? [...target.actionsTaken, actionText] : target?.actionsTaken;
    
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          status,
          actionsTaken: updatedActions || inc.actionsTaken
        };
      }
      return inc;
    }));

    await updateDepartmentIncident(id, {
      status,
      actionsTaken: updatedActions
    });
  };

  // Handler for creating incident
  const handleCreateIncident = (incidentData: Partial<DepartmentIncident>) => {
    const newIncident: DepartmentIncident = {
      id: `INC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      title: incidentData.title || 'Emergency Flood Response Deployment',
      hazardType: incidentData.hazardType || 'flood',
      severity: incidentData.severity || 'high',
      location: incidentData.location || `${currentLocation.name} Lowlands`,
      coordinates: incidentData.coordinates || currentLocation.coordinates,
      department: incidentData.department || 'Emergency Management',
      assignedTo: incidentData.assignedTo || 'Crisis Hydrology Unit',
      status: 'in_progress',
      reportedAt: new Date().toISOString(),
      actionsTaken: incidentData.actionsTaken || ['Dispatched tactical taskforce to sector', 'Pre-alerted local SME logistics corridor']
    };

    setIncidents(prev => [newIncident, ...prev]);
    setActiveTab('early_warning');
  };

  // Handler for CAP alerts
  const handleBroadcastAlert = (newAlert: EarlyWarningAlert) => {
    setAlerts(prev => [newAlert, ...prev]);
  };

  // Sensor reading updates
  const handleAddSensorReading = (sensorId: string, newValue: number) => {
    setSensors(prev => prev.map(s => {
      if (s.id === sensorId) {
        const newPoint = {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: newValue
        };
        const updatedHistory = [...s.history.slice(1), newPoint];
        const isWarning = newValue > s.thresholds.warning && newValue <= s.thresholds.critical;
        const isCritical = newValue > s.thresholds.critical;
        return {
          ...s,
          currentValue: newValue,
          history: updatedHistory,
          status: isCritical ? 'critical' : isWarning ? 'warning' : 'optimal',
          isAnomalyDetected: false
        };
      }
      return s;
    }));
  };

  const handleResolveAnomaly = (sensorId: string) => {
    setSensors(prev => prev.map(s => s.id === sensorId ? { ...s, isAnomalyDetected: false, status: 'optimal' } : s));
  };

  const activeAlertsList = alerts.filter(a => a.active);
  const resilienceScore = Math.max(20, Math.min(95, 100 - Math.round(currentLocation.vulnerabilityIndex * 0.4)));

  return (
    <div id="climate-resilience-app" className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200 antialiased">
      {/* Header matching Bento Grid theme */}
      <Header
        locations={DEFAULT_LOCATIONS}
        currentLocation={currentLocation}
        onSelectLocation={setCurrentLocation}
        activeAlerts={alerts}
        liveWeather={liveWeather}
        weatherLoading={weatherLoading}
        onOpenReportGenerator={() => setIsReportModalOpen(true)}
        onOpenAIChat={() => setIsChatDrawerOpen(true)}
        activeIncidentCount={incidents.filter(i => i.status === 'active' || i.status === 'in_progress').length}
      />

      {/* Bento Navigation Bar */}
      <NavigationTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeAlertsCount={activeAlertsList.length}
        activeIncidentsCount={incidents.filter(i => i.status === 'active' || i.status === 'in_progress').length}
        anomaliesDetectedCount={sensors.filter(s => s.isAnomalyDetected).length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* VIEW 1: Overview & GIS with pure Bento Grid structure */}
        {activeTab === 'overview_gis' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Top Tactical Intelligence Pill */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold tracking-wider border border-emerald-500/20">
                    REAL-TIME TELEMETRY MATRIX
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Target Catchment: <strong className="text-slate-200">{currentLocation.name}, {currentLocation.country}</strong>
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Integrated Climate Risk & Inter-Departmental Operations
                </h2>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0">
                <button
                  id="run-quick-ai-btn"
                  onClick={handleRunAiAssessment}
                  disabled={loadingAssessment}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loadingAssessment ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{loadingAssessment ? 'Synthesizing...' : 'Run Gemini Assessment'}</span>
                </button>
              </div>
            </div>

            {/* AI Strategic Assessment Output (If requested) */}
            {aiAssessment && (
              <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">
                      Gemini 3.7 Threat Assessment & Priority Action Directives
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Threat Classification:</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 font-mono font-bold text-xs border border-rose-500/30 uppercase">
                      {aiAssessment.threatLevel}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Executive Threat Summary</span>
                    <p className="text-slate-300 leading-relaxed">{aiAssessment.summary}</p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Immediate Priority Actions</span>
                    <ul className="space-y-1 text-slate-300">
                      {aiAssessment.priorityActions.map((act, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">SME & Community Directives</span>
                    <div className="text-slate-300">
                      <strong>SME Action:</strong> {aiAssessment.smeRecommendations[0]}
                    </div>
                    <div className="text-slate-400 pt-1 text-[10px]">
                      Confidence: <strong className="text-emerald-400">{aiAssessment.confidenceScore}%</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BENTO GRID PRIMARY ROW */}
            <div className="grid grid-cols-12 gap-4">
              {/* BENTO CARD 1: Early Warning Feed (col-span-12 lg:col-span-3) */}
              <div className="col-span-12 lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Early Warning Feed</h2>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-rose-500/10 border-l-2 border-rose-500 p-3 rounded-r-xl">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-rose-400 text-xs font-bold uppercase">Flash Flood Risk</span>
                        <span className="text-slate-500 text-[10px] font-mono">2m ago</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-snug">
                        Precipitation anomaly detected in {currentLocation.name} basin. Peak hydrograph +1.8m.
                      </p>
                    </div>

                    <div className="bg-amber-500/10 border-l-2 border-amber-500 p-3 rounded-r-xl">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-amber-400 text-xs font-bold uppercase">Heat Anomaly</span>
                        <span className="text-slate-500 text-[10px] font-mono">14m ago</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-snug">
                        Urban thermal surge (+3.8°C) detected across commercial & logistics core.
                      </p>
                    </div>

                    <div className="bg-slate-800/40 border-l-2 border-slate-600 p-3 rounded-r-xl">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-slate-400 text-xs font-bold uppercase">Drought Monitoring</span>
                        <span className="text-slate-500 text-[10px] font-mono">1h ago</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-snug">
                        SPEI soil deficit stabilized in regional agricultural perimeter.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setActiveTab('early_warning')}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 transition-colors rounded-xl text-xs font-bold uppercase tracking-widest text-slate-200"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>

              {/* BENTO CARD 2: Regional Risk Visualization & Map (col-span-12 lg:col-span-6) */}
              <div className="col-span-12 lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex flex-col">
                {/* Subtle Dot Matrix Backdrop */}
                <div 
                  className="absolute inset-0 opacity-20 pointer-events-none" 
                  style={{
                    backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}
                ></div>

                {/* Card Header with Status Pills */}
                <div className="relative z-10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">Regional Risk Visualization</h2>
                    <p className="text-slate-400 text-xs">Interactive Multi-Hazard GIS Layer: {currentLocation.name}</p>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-3 uppercase font-bold tracking-tight">
                    <span className="text-rose-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Critical
                    </span>
                    <span className="text-amber-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Elevated
                    </span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Stable
                    </span>
                  </div>
                </div>

                {/* Embedded GIS Leaflet Map Container */}
                <div className="flex-1 relative min-h-[340px] bg-slate-950">
                  <RiskMap
                    location={currentLocation}
                    sensors={sensors}
                    assets={assets}
                    incidents={incidents}
                  />
                </div>

                {/* Bottom Bento Metric Ribbon */}
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/90 border-t border-slate-800 relative z-10">
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Humidity</p>
                    <p className="text-base sm:text-lg font-bold text-white">
                      {liveWeather ? `${liveWeather.humidity}%` : '84%'}
                    </p>
                  </div>
                  <div className="text-center border-l border-slate-800">
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Wind Vel.</p>
                    <p className="text-base sm:text-lg font-bold text-white">
                      {liveWeather ? `${liveWeather.windSpeedKmh} km/h` : '12 km/h'}
                    </p>
                  </div>
                  <div className="text-center border-l border-slate-800">
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Precipitation</p>
                    <p className="text-base sm:text-lg font-bold text-rose-400">
                      {liveWeather ? `+${liveWeather.precipitationMm} mm` : '+0.42 mm'}
                    </p>
                  </div>
                  <div className="text-center border-l border-slate-800">
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Air Quality / AQI</p>
                    <p className="text-base sm:text-lg font-bold text-emerald-400">
                      42 AQI
                    </p>
                  </div>
                </div>
              </div>

              {/* BENTO CARD 3: Resilience Score Radial Gauge (col-span-12 lg:col-span-3) */}
              <div className="col-span-12 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Resilience Score</h2>
                  
                  <div className="flex flex-col items-center justify-center my-2">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle 
                          cx="64" 
                          cy="64" 
                          r="54" 
                          stroke="currentColor" 
                          strokeWidth="8" 
                          fill="transparent" 
                          className="text-slate-800" 
                        />
                        <circle 
                          cx="64" 
                          cy="64" 
                          r="54" 
                          stroke="currentColor" 
                          strokeWidth="8" 
                          fill="transparent" 
                          strokeDasharray="339" 
                          strokeDashoffset={339 - (339 * resilienceScore) / 100} 
                          className="text-emerald-500 transition-all duration-1000 ease-out" 
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-3xl font-bold text-white">{resilienceScore}</span>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Index</p>
                      </div>
                    </div>

                    <div className="mt-6 w-full space-y-3">
                      <div>
                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                          <span>Infrastructure Hardening</span>
                          <span className="text-emerald-400">92%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full w-[92%]"></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                          <span>Community Ready</span>
                          <span className="text-amber-400">58%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full w-[58%]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Sendai Protocol Alignment</span>
                  <span className="text-emerald-400 font-semibold font-mono">Tier-1 Compliant</span>
                </div>
              </div>
            </div>

            {/* BENTO GRID SECONDARY ROW */}
            <div className="grid grid-cols-12 gap-4">
              {/* BENTO CARD 4: Automated Report Bento Box (col-span-12 lg:col-span-3) */}
              <div className="col-span-12 lg:col-span-3 bg-indigo-600 rounded-2xl p-5 text-white flex flex-col justify-between shadow-xl shadow-indigo-950/40">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-200">Automated Report</h2>
                  <p className="text-xl font-bold mt-2 leading-tight">
                    Q4 Risk Assessment & Resilience Strategy
                  </p>
                  <p className="text-xs text-indigo-100/80 mt-2">
                    Comprehensive TCFD & Sendai Framework institutional synthesis.
                  </p>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold tracking-wide">READY FOR EXPORT</p>
                      <p className="text-[10px] opacity-80 font-mono">Updated 10 mins ago</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
                  >
                    Generate PDF
                  </button>
                </div>
              </div>

              {/* BENTO CARD 5: Historical Trends: Precipitation vs Heat (col-span-12 lg:col-span-6) */}
              <div className="col-span-12 lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Historical Trends: Precipitation vs Heat Anomaly
                    </h2>
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Precip Optimal
                      </span>
                      <span className="flex items-center gap-1 text-rose-400">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span> Heat Spike
                      </span>
                    </div>
                  </div>

                  {/* 12-Month Stylized Bento Bar Chart */}
                  <div className="flex items-end gap-2 sm:gap-3 h-32 px-1 pt-4">
                    {[
                      { month: 'JAN', val: 40, color: 'bg-slate-800', note: '32mm precip' },
                      { month: 'FEB', val: 65, color: 'bg-emerald-500', note: '58mm precip' },
                      { month: 'MAR', val: 55, color: 'bg-slate-800', note: '45mm precip' },
                      { month: 'APR', val: 75, color: 'bg-slate-800', note: '68mm precip' },
                      { month: 'MAY', val: 90, color: 'bg-rose-500', note: '+4.2°C Surge' },
                      { month: 'JUN', val: 60, color: 'bg-slate-800', note: '50mm precip' },
                      { month: 'JUL', val: 45, color: 'bg-slate-800', note: '38mm precip' },
                      { month: 'AUG', val: 80, color: 'bg-emerald-500', note: '74mm precip' },
                      { month: 'SEP', val: 50, color: 'bg-slate-800', note: '42mm precip' },
                      { month: 'OCT', val: 35, color: 'bg-slate-800', note: '28mm precip' },
                      { month: 'NOV', val: 70, color: 'bg-amber-500', note: '+2.8°C Anomaly' },
                      { month: 'DEC', val: 60, color: 'bg-slate-800', note: '52mm precip' }
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        onMouseEnter={() => setHoveredMonth(`${item.month}: ${item.note}`)}
                        onMouseLeave={() => setHoveredMonth(null)}
                        className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                      >
                        <div 
                          style={{ height: `${item.val}%` }} 
                          className={`w-full ${item.color} group-hover:brightness-125 rounded-t-md transition-all relative`}
                        >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono bg-slate-950 px-1 py-0.5 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                            {item.note}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-2.5 text-[10px] text-slate-500 uppercase font-bold font-mono px-1">
                    <span>JAN</span>
                    <span>MAR</span>
                    <span>MAY</span>
                    <span>JUL</span>
                    <span>SEP</span>
                    <span>NOV</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-mono mt-3 pt-2 border-t border-slate-800 flex justify-between">
                  <span>Active Anomaly Filter: Hydro-Climatic Variance</span>
                  <span className="text-slate-300">{hoveredMonth || 'Hover bar for monthly readings'}</span>
                </div>
              </div>

              {/* BENTO CARD 6: Data Integration Hub (col-span-12 lg:col-span-3) */}
              <div className="col-span-12 lg:col-span-3 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data Integration</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-md border border-emerald-500/30 font-bold font-mono">
                      ACTIVE
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-300">NOAA Earth API</span>
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="w-full h-full bg-emerald-500"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-300">Copernicus Sentinel</span>
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="w-4/5 h-full bg-emerald-500"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs">Global Flood Pr.</span>
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-slate-600"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Next sync in 02:45s</span>
                  <span className="text-emerald-400">● 99.9% Uptime</span>
                </div>
              </div>
            </div>

            {/* BENTO GRID MODULE SHORTCUTS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div 
                id="bento-shortcut-flood"
                onClick={() => setActiveTab('flood_prediction')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 transition-all cursor-pointer shadow-lg group"
              >
                <div className="flex items-center justify-between text-xs text-cyan-400 mb-1 font-semibold">
                  <span className="uppercase tracking-wider text-[10px]">Hydrograph & Inundation</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="font-bold text-white text-sm">Flood Prediction & River Monitoring</div>
                <p className="text-xs text-slate-400 mt-1">
                  Peak discharge modeling (m³/s), 10yr/50yr/100yr return periods, and demountable flood gate activation.
                </p>
              </div>

              <div 
                id="bento-shortcut-drought"
                onClick={() => setActiveTab('drought_assessment')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 transition-all cursor-pointer shadow-lg group"
              >
                <div className="flex items-center justify-between text-xs text-amber-400 mb-1 font-semibold">
                  <span className="uppercase tracking-wider text-[10px]">SPEI Index & Soil Deficit</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="font-bold text-white text-sm">Drought Risk & Crop Resilience</div>
                <p className="text-xs text-slate-400 mt-1">
                  Multi-depth soil moisture stratigraphy (0-100cm), regional reservoir depletion, and irrigation rationing.
                </p>
              </div>

              <div 
                id="bento-shortcut-sme"
                onClick={() => setActiveTab('sme_preparedness')}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 transition-all cursor-pointer shadow-lg group"
              >
                <div className="flex items-center justify-between text-xs text-emerald-400 mb-1 font-semibold">
                  <span className="uppercase tracking-wider text-[10px]">Business Continuity Plans</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="font-bold text-white text-sm">SME Preparedness & Continuity Toolkit</div>
                <p className="text-xs text-slate-400 mt-1">
                  Facility flood-proofing diagnostics, recovery time objectives (RTO), and AI-generated continuity checklists.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Flood Prediction */}
        {activeTab === 'flood_prediction' && (
          <div className="animate-in fade-in duration-200">
            <FloodPredictionModule
              location={currentLocation}
              liveWeather={liveWeather}
              sensors={sensors}
              onTriggerEmergencyDispatch={handleCreateIncident}
            />
          </div>
        )}

        {/* VIEW 3: Drought Assessment */}
        {activeTab === 'drought_assessment' && (
          <div className="animate-in fade-in duration-200">
            <DroughtAssessmentModule
              location={currentLocation}
              sensors={sensors}
              onTriggerAgriculturalAlert={handleCreateIncident}
            />
          </div>
        )}

        {/* VIEW 4: Vulnerability & Asset VaR */}
        {activeTab === 'vulnerability_var' && (
          <div className="animate-in fade-in duration-200">
            <VulnerabilityDashboard
              location={currentLocation}
              assets={assets}
            />
          </div>
        )}

        {/* VIEW 5: Community Early Warning System & Incident Command */}
        {activeTab === 'early_warning' && (
          <div className="animate-in fade-in duration-200">
            <EarlyWarningModule
              alerts={alerts}
              incidents={incidents}
              onBroadcastAlert={handleBroadcastAlert}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
              onCreateIncident={handleCreateIncident}
            />
          </div>
        )}

        {/* VIEW 6: SME Preparedness & Business Continuity */}
        {activeTab === 'sme_preparedness' && (
          <div className="animate-in fade-in duration-200">
            <SMEPreparednessModule
              location={currentLocation}
            />
          </div>
        )}

        {/* VIEW 7: Scenario Simulator & Stress-Testing */}
        {activeTab === 'scenario_simulator' && (
          <div className="animate-in fade-in duration-200">
            <ScenarioSimulator
              location={currentLocation}
            />
          </div>
        )}

        {/* VIEW 8: Sensor Telemetry & Anomaly Filtering */}
        {activeTab === 'sensor_telemetry' && (
          <div className="animate-in fade-in duration-200">
            <LiveSensorFeed
              sensors={sensors}
              onAddSensorReading={handleAddSensorReading}
              onResolveAnomaly={handleResolveAnomaly}
            />
          </div>
        )}
      </main>

      {/* Bento-styled Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-xs rotate-45"></div>
            <span>TERRA INTELLIGENCE • CLIMASHIELD RESILIENCE OPERATIONS</span>
          </div>
          <span>Compliant with TCFD & Sendai Framework for Disaster Risk Reduction</span>
        </div>
      </footer>

      {/* Modals & AI Drawers */}
      <ReportGeneratorModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        location={currentLocation}
        sensors={sensors}
        assets={assets}
        smeProfiles={smeProfiles}
        incidents={incidents}
      />

      <ClimateAIChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        location={currentLocation}
      />
    </div>
  );
}
