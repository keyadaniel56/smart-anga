import React, { useState, useEffect } from 'react';
import { 
  NavigationTabType, 
  LocationProfile, 
  LiveWeatherData, 
  SensorNode, 
  CriticalAsset, 
  EarlyWarningAlert, 
  DepartmentIncident, 
  SMEProfile
} from './types/climate';
import { 
  DEFAULT_LOCATIONS, 
  DEFAULT_SENSORS, 
  DEFAULT_CRITICAL_ASSETS, 
  DEFAULT_ALERTS, 
  DEFAULT_INCIDENTS,
  DEFAULT_SME_PROFILES,
  generateLocationData
} from './data/mockClimateData';
import { 
  fetchLiveWeather, 
  fetchDepartmentIncidents, 
  updateDepartmentIncident,
  subscribeToStatusChanges 
} from './services/api';

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
import { RiskBadge } from './components/ui/RiskBadge';
import { RiskDial } from './components/ui/RiskDial';
import { EmptyState } from './components/ui/EmptyState';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTranslation } from './context/LanguageContext';
import { 
  ArrowRight,
  FileText,
  Radio,
  WifiOff,
  AlertCircle,
  X
} from 'lucide-react';

export default function App() {
  const { t } = useTranslation();
  const [currentLocation, setCurrentLocation] = useState<LocationProfile>(DEFAULT_LOCATIONS[0]);
  const [activeTab, setActiveTab] = useState<NavigationTabType>('overview_gis');
  
  const [liveWeather, setLiveWeather] = useState<LiveWeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(false);

  const [sensors, setSensors] = useState<SensorNode[]>(DEFAULT_SENSORS);
  const [assets, setAssets] = useState<CriticalAsset[]>(DEFAULT_CRITICAL_ASSETS);
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>(DEFAULT_ALERTS);
  const [incidents, setIncidents] = useState<DepartmentIncident[]>(DEFAULT_INCIDENTS);
  const [smeProfiles, setSmeProfiles] = useState<SMEProfile[]>(DEFAULT_SME_PROFILES);
  const [incidentsConnected, setIncidentsConnected] = useState<boolean>(true);

  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToStatusChanges((status) => {
      setIsLive(status.live);
      if (!status.live && status.msg) setToastMessage(status.msg);
    });
    return () => { unsubscribe(); };
  }, []);

  useEffect(() => {
    const loadWeather = async () => {
      setWeatherLoading(true);
      setWeatherError(false);
      const data = await fetchLiveWeather(
        currentLocation.coordinates[0], 
        currentLocation.coordinates[1], 
        currentLocation.name
      );
      if (data) setLiveWeather(data);
      else setWeatherError(true);
      setWeatherLoading(false);
    };
    loadWeather();
  }, [currentLocation]);

  useEffect(() => {
    if (currentLocation.id.startsWith('geocoded-') || !DEFAULT_LOCATIONS.find(l => l.id === currentLocation.id)) {
      const data = generateLocationData(currentLocation);
      setSensors(data.sensors);
      setAlerts(data.alerts);
      setIncidents(data.incidents);
      setAssets(data.assets);
      setSmeProfiles(data.smeProfiles);
    }
  }, [currentLocation]);

  useEffect(() => {
    const loadIncidents = async () => {
      try {
        const serverIncidents = await fetchDepartmentIncidents();
        if (serverIncidents && serverIncidents.length > 0) {
          setIncidents(serverIncidents);
          setIncidentsConnected(true);
        }
      } catch {
        setIncidentsConnected(false);
      }
    };
    loadIncidents();
  }, []);

  const handleUpdateIncidentStatus = async (id: string, status: DepartmentIncident['status'], actionText?: string) => {
    const target = incidents.find(i => i.id === id);
    const updatedActions = actionText && target ? [...target.actionsTaken, actionText] : target?.actionsTaken;
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status, actionsTaken: updatedActions || inc.actionsTaken } : inc));
    await updateDepartmentIncident(id, { status, actionsTaken: updatedActions });
  };

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
      actionsTaken: incidentData.actionsTaken || ['Dispatched tactical taskforce', 'Pre-alerted local SME corridor'],
      automatedDispatchSent: true
    };
    setIncidents(prev => [newIncident, ...prev]);
    setActiveTab('early_warning');
  };

  const handleBroadcastAlert = (newAlert: EarlyWarningAlert) => {
    setAlerts(prev => [newAlert, ...prev]);
  };

  const handleAddSensorReading = (sensorId: string, newValue: number) => {
    setSensors(prev => prev.map(s => {
      if (s.id === sensorId) {
        const newPoint = { timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), value: newValue };
        const updatedHistory = [...s.history.slice(1), newPoint];
        const [min, max] = s.normalRange;
        const isCritical = newValue > max * 1.2 || newValue < min * 0.8;
        const isWarning = newValue > max || newValue < min;
        return { ...s, currentValue: newValue, history: updatedHistory, status: isCritical ? 'critical' : isWarning ? 'warning' : 'optimal', isAnomalyDetected: false };
      }
      return s;
    }));
  };

  const handleResolveAnomaly = (sensorId: string) => {
    setSensors(prev => prev.map(s => s.id === sensorId ? { ...s, isAnomalyDetected: false, status: 'optimal' } : s));
  };

  const activeAlertsList = alerts.filter(a => a.active);
  const firstThreeAlerts = activeAlertsList.slice(0, 3);
  const resilienceScore = Math.max(20, Math.min(95, 100 - Math.round(currentLocation.vulnerabilityIndex * 0.4)));
  const activeIncidentsList = incidents.filter(i => i.status === 'active' || i.status === 'in_progress');

  return (
    <ErrorBoundary>
      <div id="climate-resilience-app" className="h-screen flex flex-col bg-surface-950 text-ink-900 font-sans antialiased selection:bg-teal-500/20 selection:text-forest-900 relative overflow-hidden">
        
        {!isLive && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 px-4 py-2 text-xs flex items-center justify-center gap-2 font-medium tracking-wide animate-in slide-in-from-top duration-200 z-50">
            <WifiOff className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
            <span>Using cached data: Telemetry Link Down.</span>
          </div>
        )}

        <Header
          locations={DEFAULT_LOCATIONS}
          currentLocation={currentLocation}
          onSelectLocation={setCurrentLocation}
          activeAlerts={alerts}
          liveWeather={liveWeather}
          weatherLoading={weatherLoading}
          activeIncidentCount={activeIncidentsList.length}
        />

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          <NavigationTabs
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            activeAlertsCount={activeAlertsList.length}
            activeIncidentsCount={activeIncidentsList.length}
            anomaliesDetectedCount={sensors.filter(s => s.isAnomalyDetected).length}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-7 min-w-0 overflow-y-auto pb-20 lg:pb-6">
            {activeTab === 'overview_gis' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Catchment Context Card */}
                <div className="bg-white/80 border border-sand-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-forest-100 text-forest-800 text-[10px] font-mono font-bold tracking-wider border border-forest-200">
                        {t('overview.liveMonitorBadge', 'LIVE MONITORING')}
                      </span>
                      <span className="text-xs text-ink-500 font-mono">
                        {t('overview.monitoredArea', 'Area')}: <strong className="text-ink-900">{currentLocation.name}, {currentLocation.country}</strong>
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-ink-900 font-serif tracking-tight">
                      {t('overview.mainHeading', 'Community Weather Risks & Emergency Readiness')}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <RiskBadge
                      level={currentLocation.vulnerabilityIndex > 75 ? 'critical' : currentLocation.vulnerabilityIndex > 60 ? 'high' : currentLocation.vulnerabilityIndex > 40 ? 'moderate' : 'low'}
                      size="md"
                      label={`Hazard Index ${currentLocation.vulnerabilityIndex}/100`}
                    />
                  </div>
                </div>

                {/* Location Summary Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/80 border border-sand-200 rounded-2xl p-4 shadow-sm text-center">
                    <p className="text-[10px] uppercase text-ink-500 font-bold tracking-wider font-mono mb-1">Population</p>
                    <p className="text-xl font-bold font-mono text-ink-900">{currentLocation.population ? (currentLocation.population >= 1000000 ? `${(currentLocation.population / 1000000).toFixed(1)}M` : currentLocation.population >= 1000 ? `${(currentLocation.population / 1000).toFixed(0)}K` : currentLocation.population.toLocaleString()) : '—'}</p>
                    <p className="text-[10px] text-ink-400 mt-0.5">{currentLocation.region}</p>
                  </div>
                  <div className="bg-white/80 border border-sand-200 rounded-2xl p-4 shadow-sm text-center">
                    <p className="text-[10px] uppercase text-ink-500 font-bold tracking-wider font-mono mb-1">Elevation</p>
                    <p className="text-xl font-bold font-mono text-ink-900">{currentLocation.elevationM}m</p>
                    <p className="text-[10px] text-ink-400 mt-0.5">Above Sea Level</p>
                  </div>
                  <div className="bg-white/80 border border-sand-200 rounded-2xl p-4 shadow-sm text-center">
                    <p className="text-[10px] uppercase text-ink-500 font-bold tracking-wider font-mono mb-1">Primary Risk</p>
                    <p className="text-xl font-bold font-mono capitalize text-ink-900">{currentLocation.primaryRisk.replace('_', ' ')}</p>
                    <p className="text-[10px] text-ink-400 mt-0.5">{currentLocation.riverBasin || 'Regional Assessment'}</p>
                  </div>
                  <div className="bg-white/80 border border-sand-200 rounded-2xl p-4 shadow-sm text-center">
                    <p className="text-[10px] uppercase text-ink-500 font-bold tracking-wider font-mono mb-1">Assets Protected</p>
                    <p className="text-xl font-bold font-mono text-forest-800">{currentLocation.criticalAssetsCount || assets.length}</p>
                    <p className="text-[10px] text-ink-400 mt-0.5">Critical Infrastructure</p>
                  </div>
                </div>

                {/* Bento Grid: Alerts + Map + Resilience */}
                <div className="grid grid-cols-12 gap-5">
                  {/* Early Warning Feed */}
                  <div className="col-span-12 lg:col-span-3 bg-white/80 border border-sand-200 rounded-3xl p-5 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-sand-200">
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
                          <h2 className="text-xs font-bold text-ink-500 uppercase tracking-wider font-mono">
                            {t('overview.earlyWarningFeed', 'Early Warning Feed')}
                          </h2>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-forest-800 bg-sand-100 px-2 py-0.5 rounded-md border border-sand-200">
                          {activeAlertsList.length} Active
                        </span>
                      </div>
                      {firstThreeAlerts.length === 0 ? (
                        <EmptyState title="No Active Warnings" description="All sensors at normal levels." />
                      ) : (
                        <div className="space-y-3">
                          {firstThreeAlerts.map((alert) => (
                            <div key={alert.id} className={`p-3.5 rounded-2xl border transition-all ${
                              alert.severity === 'Emergency' ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                              : alert.severity === 'Warning' ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                              : 'bg-sand-50/90 border-sand-200 text-ink-800'
                            }`}>
                              <div className="flex justify-between items-start mb-1.5">
                                <RiskBadge level={alert.severity} size="xs" label={`${alert.severity} ${alert.hazard}`} />
                                <span className="text-ink-400 text-[10px] font-mono">
                                  {new Date(alert.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="text-xs font-bold text-ink-900 leading-snug">{alert.title}</div>
                              <p className="text-[11px] text-ink-600 mt-1 line-clamp-2 leading-relaxed">{alert.headline || alert.instruction}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-sand-200">
                      <button onClick={() => setActiveTab('early_warning')} className="w-full py-2.5 bg-forest-900 hover:bg-forest-800 text-sand-50 transition-colors rounded-xl text-xs font-bold uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 shadow-sm">
                        <span>View All Incidents</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* GIS Map */}
                  <div className="col-span-12 lg:col-span-6 bg-white border border-sand-200 rounded-3xl overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sand-200 bg-sand-50/50">
                      <div>
                        <h2 className="text-base font-bold text-ink-900 font-serif">Area Risk & Water Map</h2>
                        <p className="text-ink-500 text-xs">{currentLocation.name} — {currentLocation.riverBasin || 'Catchment Basin'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <RiskBadge level="critical" size="xs" label="Flood Zones" />
                        <RiskBadge level="moderate" size="xs" label="Drought Zones" />
                      </div>
                    </div>
                    <div className="flex-1 relative min-h-[380px] bg-sand-100">
                      <RiskMap location={currentLocation} sensors={sensors} assets={assets} incidents={incidents} onSearchLocation={setCurrentLocation} />
                    </div>
                    {/* Weather Bar */}
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-sand-50/80 border-t border-sand-200">
                      <div className="text-center">
                        <p className="text-[10px] uppercase text-ink-500 font-bold tracking-wider font-mono">Humidity</p>
                        <p className="text-base sm:text-lg font-bold font-mono text-ink-900">{liveWeather ? `${liveWeather.humidity}%` : weatherLoading ? '...' : '68%'}</p>
                      </div>
                      <div className="text-center border-l border-sand-200">
                        <p className="text-[10px] uppercase text-ink-500 font-bold tracking-wider font-mono">Wind Speed</p>
                        <p className="text-base sm:text-lg font-bold font-mono text-ink-900">{liveWeather ? `${liveWeather.windSpeedKmh} km/h` : weatherLoading ? '...' : '14 km/h'}</p>
                      </div>
                      <div className="text-center border-l border-sand-200">
                        <p className="text-[10px] uppercase text-ink-500 font-bold tracking-wider font-mono">Rainfall</p>
                        <p className="text-base sm:text-lg font-bold font-mono text-cyan-700">{liveWeather ? `${liveWeather.precipitationMm} mm` : weatherLoading ? '...' : '0.0 mm'}</p>
                      </div>
                      <div className="text-center border-l border-sand-200">
                        <p className="text-[10px] uppercase text-ink-500 font-bold tracking-wider font-mono">Air Pressure</p>
                        <p className="text-base sm:text-lg font-bold font-mono text-forest-800">{liveWeather ? `${liveWeather.surfacePressureHpa} hPa` : weatherLoading ? '...' : '1014 hPa'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Resilience Score */}
                  <div className="col-span-12 lg:col-span-3 bg-white/80 border border-sand-200 rounded-3xl p-5 flex flex-col justify-between shadow-sm">
                    <div>
                      <h2 className="text-xs font-bold text-ink-500 uppercase tracking-wider font-mono mb-4 pb-2 border-b border-sand-200">
                        Community Readiness Score
                      </h2>
                      <div className="flex flex-col items-center justify-center my-2">
                        <RiskDial score={resilienceScore} size={150} label="Readiness Index" invertColor={true} />
                        <div className="mt-5 w-full space-y-3.5">
                          <div>
                            <div className="flex justify-between text-[11px] font-bold text-ink-700 mb-1">
                              <span>Building & Drainage Protection</span>
                              <span className="font-mono text-forest-800 font-bold">{Math.min(98, 100 - Math.floor(currentLocation.vulnerabilityIndex * 0.3))}%</span>
                            </div>
                            <div className="w-full h-2 bg-sand-200 rounded-full overflow-hidden">
                              <div className="h-full bg-forest-700 rounded-full transition-all duration-500" style={{ width: `${Math.min(98, 100 - currentLocation.vulnerabilityIndex * 0.3)}%` }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[11px] font-bold text-ink-700 mb-1">
                              <span>Community Readiness</span>
                              <span className="font-mono text-amber-700 font-bold">{Math.max(25, 100 - Math.floor(currentLocation.vulnerabilityIndex * 0.8))}%</span>
                            </div>
                            <div className="w-full h-2 bg-sand-200 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${Math.max(25, 100 - currentLocation.vulnerabilityIndex * 0.8)}%` }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[11px] font-bold text-ink-700 mb-1">
                              <span>Sensor Coverage</span>
                              <span className="font-mono text-cyan-700 font-bold">{Math.min(95, 40 + sensors.filter(s => s.status !== 'offline').length * 12)}%</span>
                            </div>
                            <div className="w-full h-2 bg-sand-200 rounded-full overflow-hidden">
                              <div className="h-full bg-cyan-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(95, 40 + sensors.filter(s => s.status !== 'offline').length * 12)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-sand-200 text-[11px] text-ink-500 flex items-center justify-between">
                      <span>Sendai Safety Standard</span>
                      <span className={`font-semibold font-mono ${resilienceScore >= 60 ? 'text-forest-800' : resilienceScore >= 40 ? 'text-amber-700' : 'text-rose-700'}`}>
                        {resilienceScore >= 60 ? 'Tier-1 Compliant' : resilienceScore >= 40 ? 'Tier-2 Monitor' : 'Tier-3 Alert'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lower Bento: Forecast + Data Status */}
                <div className="grid grid-cols-12 gap-5">
                  {/* Weather Forecast Chart */}
                  <div className="col-span-12 lg:col-span-8 bg-white/80 border border-sand-200 rounded-3xl p-5 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-sand-200">
                        <h2 className="text-xs font-bold text-ink-500 uppercase tracking-wider font-mono">
                          {liveWeather?.daily?.time ? '12-Day Precipitation & Temperature Forecast' : 'Historical Weather Pattern'}
                        </h2>
                        <div className="flex items-center gap-3 text-[10px] font-mono">
                          <span className="flex items-center gap-1 text-forest-800"><span className="w-2 h-2 rounded-full bg-forest-700"></span> Precip</span>
                          <span className="flex items-center gap-1 text-rose-700"><span className="w-2 h-2 rounded-full bg-rose-600"></span> Heat Surge</span>
                        </div>
                      </div>
                      <div className="flex items-end gap-2 sm:gap-3 h-32 px-1 pt-4">
                        {(liveWeather?.daily?.time || []).slice(0, 12).map((day, idx) => {
                          const precip = liveWeather?.daily?.precipitationSum?.[idx] ?? 0;
                          const tMax = liveWeather?.daily?.tempMax?.[idx] ?? 25;
                          const isHeatSurge = tMax > 32;
                          const maxPrecip = Math.max(...(liveWeather?.daily?.precipitationSum || [1]));
                          const barH = Math.max(8, (precip / Math.max(maxPrecip, 1)) * 80 + (isHeatSurge ? 15 : 0));
                          const barColor = isHeatSurge ? 'bg-rose-500' : precip > maxPrecip * 0.6 ? 'bg-forest-600' : 'bg-sand-300';
                          const dateLabel = new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          return (
                            <div key={idx} onMouseEnter={() => setHoveredMonth(`${dateLabel}: ${precip}mm, ${tMax}°C`)} onMouseLeave={() => setHoveredMonth(null)} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer">
                              <div style={{ height: `${barH}%` }} className={`w-full ${barColor} group-hover:brightness-95 rounded-t-md transition-all relative`}>
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-mono bg-ink-900 text-sand-50 px-1.5 py-0.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                  {dateLabel}: {precip}mm{isHeatSurge ? `, ${tMax}°C` : ''}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {(!liveWeather?.daily?.time || liveWeather.daily.time.length === 0) && Array.from({ length: 12 }, (_, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer">
                            <div style={{ height: `${20 + Math.sin(i * 0.8) * 30 + Math.random() * 20}%` }} className={`w-full ${i === 4 || i === 7 ? 'bg-rose-400' : 'bg-sand-300'} rounded-t-md transition-all relative`}></div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-2.5 text-[10px] text-ink-400 uppercase font-bold font-mono px-1">
                        {(liveWeather?.daily?.time || []).slice(0, 12).filter((_, i) => i % 2 === 0).map((d, i) => (
                          <span key={i}>{new Date(d).toLocaleDateString('en-US', { month: 'short' })}</span>
                        ))}
                        {(!liveWeather?.daily?.time || liveWeather.daily.time.length === 0) && <><span>JAN</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span><span>NOV</span></>}
                      </div>
                    </div>
                    <div className="text-[11px] text-ink-500 font-mono mt-3 pt-2 border-t border-sand-200 flex justify-between">
                      <span>{liveWeather?.daily?.time ? 'Open-Meteo 12-Day Forecast' : 'Historical Climate Baseline'}</span>
                      <span className="text-ink-900 font-semibold">{hoveredMonth || 'Hover bar for detail'}</span>
                    </div>
                  </div>

                  {/* Data Status */}
                  <div className="col-span-12 lg:col-span-4 bg-white/80 border border-sand-200 rounded-3xl p-5 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-sand-200">
                        <span className="text-xs font-bold text-ink-500 uppercase tracking-wider font-mono">Live Data Feed Status</span>
                        {(!incidentsConnected || weatherError) && !weatherLoading ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] rounded-full border border-amber-200 font-bold font-mono">DEGRADED</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] rounded-full border border-emerald-200 font-bold font-mono">CONNECTED</span>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-ink-700 font-medium">Weather Data Feed</span>
                          <span className={`font-mono text-[10px] font-bold flex items-center gap-1 ${weatherError && !weatherLoading ? 'text-amber-600' : 'text-emerald-700'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${weatherError && !weatherLoading ? 'bg-amber-500' : 'bg-emerald-600 animate-pulse'}`}></span>
                            {weatherLoading ? 'Syncing...' : liveWeather ? 'Live Feed' : 'Unavailable'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-ink-700 font-medium">Emergency Dispatch</span>
                          <span className={`font-mono text-[10px] font-bold ${!incidentsConnected ? 'text-amber-600' : 'text-emerald-700'}`}>
                            {incidentsConnected ? `${incidents.length} Synced` : 'Cached Only'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-ink-700 font-medium">Local Weather Sensors</span>
                          <span className="font-mono text-[10px] text-emerald-700 font-bold">{sensors.length} Online</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-ink-700 font-medium">Protected Buildings</span>
                          <span className="font-mono text-[10px] text-ink-500 font-bold">{assets.length} Monitored</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-sand-200 flex items-center justify-between text-[10px] text-ink-500 font-mono">
                      <span>Last sync: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-emerald-700 font-bold">{sensors.filter(s => s.status !== 'offline').length}/{sensors.length} Sensors Online</span>
                    </div>
                  </div>
                </div>

                {/* Module Navigation Shortcuts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div onClick={() => setActiveTab('flood_prediction')} className="bg-white/80 hover:bg-white border border-sand-200 hover:border-cyan-400 rounded-3xl p-5 transition-all cursor-pointer shadow-xs hover:shadow-md group">
                    <div className="flex items-center justify-between text-xs text-cyan-800 mb-1.5 font-bold font-mono">
                      <span className="uppercase tracking-wider text-[10px]">LIVE RIVER FLOW</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="font-bold text-ink-900 text-sm font-serif">River Flow & Flood Water Forecast</div>
                    <p className="text-xs text-ink-500 mt-1 leading-relaxed">Live river height, flood overflow limits, and water pump status</p>
                  </div>
                  <div onClick={() => setActiveTab('drought_assessment')} className="bg-white/80 hover:bg-white border border-sand-200 hover:border-amber-400 rounded-3xl p-5 transition-all cursor-pointer shadow-xs hover:shadow-md group">
                    <div className="flex items-center justify-between text-xs text-amber-800 mb-1.5 font-bold font-mono">
                      <span className="uppercase tracking-wider text-[10px]">DROUGHT MONITOR</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="font-bold text-ink-900 text-sm font-serif">Drought Tracking & Farm Water Advisory</div>
                    <p className="text-xs text-ink-500 mt-1 leading-relaxed">Soil dryness levels, water reservoir levels, and watering guidelines</p>
                  </div>
                  <div onClick={() => setActiveTab('sme_preparedness')} className="bg-white/80 hover:bg-white border border-sand-200 hover:border-forest-400 rounded-3xl p-5 transition-all cursor-pointer shadow-xs hover:shadow-md group">
                    <div className="flex items-center justify-between text-xs text-forest-800 mb-1.5 font-bold font-mono">
                      <span className="uppercase tracking-wider text-[10px]">BUSINESS SAFETY</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="font-bold text-ink-900 text-sm font-serif">Small Business Weather Readiness</div>
                    <p className="text-xs text-ink-500 mt-1 leading-relaxed">Practical protection steps, backup power, and recovery plans</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'flood_prediction' && <FloodPredictionModule location={currentLocation} liveWeather={liveWeather} sensors={sensors} onTriggerEmergencyDispatch={handleCreateIncident} />}
            {activeTab === 'drought_assessment' && <DroughtAssessmentModule location={currentLocation} sensors={sensors} onTriggerAgriculturalAlert={handleCreateIncident} />}
            {activeTab === 'vulnerability_var' && <VulnerabilityDashboard location={currentLocation} assets={assets} />}
            {activeTab === 'early_warning' && (
              <EarlyWarningModule alerts={alerts} incidents={incidents} onBroadcastAlert={handleBroadcastAlert} onUpdateIncidentStatus={handleUpdateIncidentStatus} onCreateIncident={handleCreateIncident} />
            )}
            {activeTab === 'sme_preparedness' && <SMEPreparednessModule location={currentLocation} />}
            {activeTab === 'scenario_simulator' && <ScenarioSimulator location={currentLocation} />}
            {activeTab === 'sensor_telemetry' && <LiveSensorFeed sensors={sensors} onAddSensorReading={handleAddSensorReading} onResolveAnomaly={handleResolveAnomaly} />}
          </main>
        </div>

        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-ink-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-50 border border-ink-700 max-w-sm animate-in slide-in-from-bottom duration-300">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1 text-xs">
              <strong className="block font-semibold mb-0.5">API Sync Notice</strong>
              <span className="text-ink-300">{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-ink-400 hover:text-white p-0.5 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
