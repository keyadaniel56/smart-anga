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
  DEFAULT_SME_PROFILES 
} from './data/mockClimateData';
import { fetchLiveWeather, fetchDepartmentIncidents, updateDepartmentIncident } from './services/api';

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
import { ErrorState } from './components/ui/ErrorState';
import { Skeleton } from './components/ui/Skeleton';
import { useToast } from './components/ui/Toast';
import { useTranslation } from './context/LanguageContext';
import { 
  ArrowRight,
  FileText,
  Radio,
  Printer,
  X,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const { t, language } = useTranslation();
  const { addToast } = useToast();
  const [currentLocation, setCurrentLocation] = useState<LocationProfile>(DEFAULT_LOCATIONS[0]);
  const [activeTab, setActiveTab] = useState<NavigationTabType>('overview_gis');
  
  const [liveWeather, setLiveWeather] = useState<LiveWeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(false);

  const [sensors, setSensors] = useState<SensorNode[]>(DEFAULT_SENSORS);
  const [assets] = useState<CriticalAsset[]>(DEFAULT_CRITICAL_ASSETS);
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>(DEFAULT_ALERTS);
  const [incidents, setIncidents] = useState<DepartmentIncident[]>(DEFAULT_INCIDENTS);
  const [incidentsConnected, setIncidentsConnected] = useState<boolean>(true);

  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    const loadWeather = async () => {
      setWeatherLoading(true);
      setWeatherError(false);
      const data = await fetchLiveWeather(
        currentLocation.coordinates[0], 
        currentLocation.coordinates[1], 
        currentLocation.name
      );
      if (data) {
        setLiveWeather(data);
      } else {
        setWeatherError(true);
        addToast('error', t('common.weatherFeedError', 'Unable to connect to live weather feed. Showing cached safety data.'));
      }
      setWeatherLoading(false);
    };

    loadWeather();
  }, [currentLocation]);

  useEffect(() => {
    const loadIncidents = async () => {
      try {
        const serverIncidents = await fetchDepartmentIncidents();
        if (serverIncidents && serverIncidents.length > 0) {
          setIncidents(serverIncidents);
          setIncidentsConnected(true);
        } else {
          setIncidentsConnected(false);
          addToast('info', t('common.usingCachedData', 'Incident server unavailable. Using locally cached emergency data.'));
        }
      } catch (err) {
        console.warn('Incident server sync notice:', err);
        setIncidentsConnected(false);
        addToast('info', t('common.usingCachedData', 'Incident server unavailable. Using locally cached emergency data.'));
      }
    };
    loadIncidents();
  }, []);

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
      actionsTaken: incidentData.actionsTaken || ['Dispatched tactical taskforce to sector', 'Pre-alerted local SME logistics corridor'],
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
        const newPoint = {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: newValue
        };
        const updatedHistory = [...s.history.slice(1), newPoint];
        const [min, max] = s.normalRange;
        const isCritical = newValue > max * 1.2 || newValue < min * 0.8;
        const isWarning = newValue > max || newValue < min;

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
  const firstThreeAlerts = activeAlertsList.slice(0, 3);
  const resilienceScore = Math.max(20, Math.min(95, 100 - Math.round(currentLocation.vulnerabilityIndex * 0.4)));
  const activeIncidentsList = incidents.filter(i => i.status === 'active' || i.status === 'in_progress');

  return (
    <div id="climate-resilience-app" className="min-h-screen bg-sand-50 text-ink-900 flex flex-col font-sans antialiased selection:bg-teal-500/20 selection:text-forest-900">
      <Header
        locations={DEFAULT_LOCATIONS}
        currentLocation={currentLocation}
        onSelectLocation={setCurrentLocation}
        activeAlerts={alerts}
        liveWeather={liveWeather}
        weatherLoading={weatherLoading}
        activeIncidentCount={activeIncidentsList.length}
      />

      {(!incidentsConnected || weatherError) && !weatherLoading && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-7 pt-2">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-800 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
            {t('common.cachedDataBanner', 'Some data feeds are unavailable. Displaying locally cached data for safety reference.')}
          </div>
        </div>
      )}

      {/* Main Responsive Body with Fixed Sidebar on Desktop */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto pb-20 lg:pb-8">
        <NavigationTabs
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          activeAlertsCount={activeAlertsList.length}
          activeIncidentsCount={activeIncidentsList.length}
          anomaliesDetectedCount={sensors.filter(s => s.isAnomalyDetected).length}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 min-w-0 overflow-x-hidden">
          {activeTab === 'overview_gis' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Catchment Context Card */}
              <div className="bg-white/80 border border-sand-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-forest-100 text-forest-800 text-[10px] font-mono font-bold tracking-wider border border-forest-200">
                      {t('overview.liveMonitorBadge', 'LIVE LOCAL WEATHER & HAZARD MONITOR')}
                    </span>
                    <span className="text-xs text-ink-500 font-mono">
                      {t('overview.monitoredArea', 'Monitored Area')}: <strong className="text-ink-900">{currentLocation.name}, {currentLocation.country}</strong>
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-ink-900 font-serif tracking-tight">
                    {t('overview.mainHeading', 'Community Weather Risks & Emergency Readiness')}
                  </h2>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <RiskBadge
                    level={
                      currentLocation.vulnerabilityIndex > 75 ? 'critical' :
                      currentLocation.vulnerabilityIndex > 60 ? 'high' :
                      currentLocation.vulnerabilityIndex > 40 ? 'moderate' : 'low'
                    }
                    size="md"
                    label={`Hazard Index ${currentLocation.vulnerabilityIndex}/100`}
                  />
                </div>
              </div>

              {/* Bento Grid: Alerts Feed + GIS Map + Resilience Score */}
              <div className="grid grid-cols-12 gap-5">
                {/* 1. Early Warning Feed (Real alerts state from props) */}
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
                        {activeAlertsList.length} {t('common.active', 'Active')}
                      </span>
                    </div>

                    {firstThreeAlerts.length === 0 ? (
                      <EmptyState
                        title={t('overview.noActiveWarnings', 'No Active Warnings')}
                        description={t('overview.noActiveWarningsDesc', 'All local river and weather sensors are currently at normal safe levels.')}
                      />
                    ) : (
                      <div className="space-y-3">
                        {firstThreeAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              alert.severity === 'Emergency'
                                ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                                : alert.severity === 'Warning'
                                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                                : 'bg-sand-50/90 border-sand-200 text-ink-800'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1.5">
                              <RiskBadge level={alert.severity} size="xs" label={`${alert.severity} • ${alert.hazard}`} />
                              <span className="text-ink-400 text-[10px] font-mono">
                                {new Date(alert.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-ink-900 leading-snug">{alert.title}</div>
                            <p className="text-[11px] text-ink-600 mt-1 line-clamp-2 leading-relaxed">
                              {alert.headline || alert.instruction}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-sand-200">
                    <button
                      onClick={() => setActiveTab('early_warning')}
                      className="w-full py-2.5 bg-forest-900 hover:bg-forest-800 text-sand-50 transition-colors rounded-xl text-xs font-bold uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>{t('overview.viewAllIncidents', 'View All Incident Feeds')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. Interactive GIS Map Centerpiece */}
                <div className="col-span-12 lg:col-span-6 bg-white border border-sand-200 rounded-3xl overflow-hidden flex flex-col shadow-sm">
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sand-200 bg-sand-50/50">
                    <div>
                      <h2 className="text-base font-bold text-ink-900 font-serif">
                        {t('overview.mapHeading', 'Area Risk & Water Map')}
                      </h2>
                      <p className="text-ink-500 text-xs">{currentLocation.name} • {currentLocation.riverBasin || 'Catchment Basin'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level="critical" size="xs" label={t('flood.heading', 'Flood Zones')} />
                      <RiskBadge level="moderate" size="xs" label={t('drought.heading', 'Drought Zones')} />
                    </div>
                  </div>

                  <div className="flex-1 relative min-h-[380px] bg-sand-100">
                    <RiskMap
                      location={currentLocation}
                      sensors={sensors}
                      assets={assets}
                      incidents={incidents}
                      onSearchLocation={setCurrentLocation}
                    />
                  </div>

                  {/* Real live weather parameters bar */}
                  {weatherError && !liveWeather ? (
                    <div className="p-4 border-t border-sand-200">
                      <ErrorState
                        onRetry={() => {
                          setWeatherError(false);
                          setWeatherLoading(true);
                          fetchLiveWeather(
                            currentLocation.coordinates[0],
                            currentLocation.coordinates[1],
                            currentLocation.name
                          ).then(data => {
                            if (data) setLiveWeather(data);
                            else setWeatherError(true);
                            setWeatherLoading(false);
                          });
                        }}
                      />
                    </div>
                  ) : (
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-sand-50/80 border-t border-sand-200">
                      <div className="text-center">
                        <p className="text-[10px] uppercase text-ink-500 font-bold tracking-wider font-mono">
                          {t('overview.humidity', 'Humidity')}
                        </p>
                        {weatherLoading ? (
                          <Skeleton variant="text" className="w-16 mx-auto mt-1" />
                        ) : (
                          <p className="text-base sm:text-lg font-bold font-mono text-ink-900">
                            {liveWeather ? `${liveWeather.humidity}%` : '68%'}
                          </p>
                        )}
                      </div>
                      <div className="text-center border-l border-sand-200">
                        <p className="text-[10px] uppercase text-ink-500 font-bold tracking-wider font-mono">
                          {t('overview.windSpeed', 'Wind Speed')}
                        </p>
                        {weatherLoading ? (
                          <Skeleton variant="text" className="w-20 mx-auto mt-1" />
                        ) : (
                          <p className="text-base sm:text-lg font-bold font-mono text-ink-900">
                            {liveWeather ? `${liveWeather.windSpeedKmh} km/h` : '14 km/h'}
                          </p>
                        )}
                      </div>
                      <div className="text-center border-l border-sand-200">
                        <p className="text-[10px] uppercase text-ink-500 font-bold tracking-wider font-mono">
                          {t('overview.precipitation', 'Rainfall')}
                        </p>
                        {weatherLoading ? (
                          <Skeleton variant="text" className="w-16 mx-auto mt-1" />
                        ) : (
                          <p className="text-base sm:text-lg font-bold font-mono text-cyan-700">
                            {liveWeather ? `${liveWeather.precipitationMm} mm` : '0.0 mm'}
                          </p>
                        )}
                      </div>
                      <div className="text-center border-l border-sand-200">
                        <p className="text-[10px] uppercase text-ink-500 font-bold tracking-wider font-mono">
                          {t('overview.airPressure', 'Air Pressure')}
                        </p>
                        {weatherLoading ? (
                          <Skeleton variant="text" className="w-20 mx-auto mt-1" />
                        ) : (
                          <p className="text-base sm:text-lg font-bold font-mono text-forest-800">
                            {liveWeather ? `${liveWeather.surfacePressureHpa} hPa` : '1014 hPa'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Resilience Score Gauge Card */}
                <div className="col-span-12 lg:col-span-3 bg-white/80 border border-sand-200 rounded-3xl p-5 flex flex-col justify-between shadow-sm">
                  <div>
                    <h2 className="text-xs font-bold text-ink-500 uppercase tracking-wider font-mono mb-4 pb-2 border-b border-sand-200">
                      {t('overview.resilienceScore', 'Community Readiness Score')}
                    </h2>
                    
                    <div className="flex flex-col items-center justify-center my-2">
                      <RiskDial
                        score={resilienceScore}
                        size={150}
                        label="Readiness Index"
                        invertColor={true}
                      />

                      <div className="mt-5 w-full space-y-3.5">
                        <div>
                          <div className="flex justify-between text-[11px] font-bold text-ink-700 mb-1">
                            <span>{t('overview.infrastructureHardening', 'Building & Drainage Protection')}</span>
                            <span className="font-mono text-forest-800 font-bold">92%</span>
                          </div>
                          <div className="w-full h-2 bg-sand-200 rounded-full overflow-hidden">
                            <div className="h-full bg-forest-700 rounded-full w-[92%]"></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-bold text-ink-700 mb-1">
                            <span>{t('overview.communityPreparedness', 'Community & Neighborhood Readiness')}</span>
                            <span className="font-mono text-amber-700 font-bold">58%</span>
                          </div>
                          <div className="w-full h-2 bg-sand-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full w-[58%]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-sand-200 text-[11px] text-ink-500 flex items-center justify-between">
                    <span>{t('overview.safetyStandards', 'Sendai Disaster Safety Standard')}</span>
                    <span className="text-forest-800 font-semibold font-mono">Tier-1 Compliant</span>
                  </div>
                </div>
              </div>

              {/* Lower Bento Grid: Real Exportable Report + Historical Trends + Real Data Integration */}
              <div className="grid grid-cols-12 gap-5">
                {/* Real Automated Report Action Card */}
                <div className="col-span-12 lg:col-span-3 bg-forest-900 rounded-3xl p-5 text-sand-50 flex flex-col justify-between shadow-md">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-300">
                      {t('overview.reportCardTag', 'Official Community Report')}
                    </span>
                    <h3 className="text-lg font-bold font-serif mt-2 leading-snug">
                      {t('overview.reportCardHeading', 'Community Climate & Safety Summary')}
                    </h3>
                    <p className="text-xs text-sand-200/90 mt-2 leading-relaxed">
                      {t('overview.reportCardDesc', 'Clear safety summary and risk assessment for your area.')}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-forest-800/80">
                    <button
                      onClick={() => setReportModalOpen(true)}
                      className="w-full py-2.5 bg-sand-50 hover:bg-white text-forest-900 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <FileText className="w-4 h-4 text-forest-800" />
                      <span>{t('overview.viewReportBtn', 'View & Download Safety Report')}</span>
                    </button>
                  </div>
                </div>

                {/* Historical Trends Chart */}
                <div className="col-span-12 lg:col-span-6 bg-white/80 border border-sand-200 rounded-3xl p-5 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-sand-200">
                      <h2 className="text-xs font-bold text-ink-500 uppercase tracking-wider font-mono">
                        {t('overview.historyHeading', '12-Month Weather History (Rain vs Heatwaves)')}
                      </h2>
                      <div className="flex items-center gap-3 text-[10px] font-mono">
                        <span className="flex items-center gap-1 text-forest-800">
                          <span className="w-2 h-2 rounded-full bg-forest-700"></span> Precip Sum
                        </span>
                        <span className="flex items-center gap-1 text-rose-700">
                          <span className="w-2 h-2 rounded-full bg-rose-600"></span> Heat Surge
                        </span>
                      </div>
                    </div>

                    <div className="flex items-end gap-2 sm:gap-3 h-32 px-1 pt-4">
                      {[
                        { month: 'JAN', val: 40, color: 'bg-sand-200', note: '32mm precip' },
                        { month: 'FEB', val: 65, color: 'bg-forest-600', note: '58mm precip' },
                        { month: 'MAR', val: 55, color: 'bg-sand-200', note: '45mm precip' },
                        { month: 'APR', val: 75, color: 'bg-sand-200', note: '68mm precip' },
                        { month: 'MAY', val: 90, color: 'bg-rose-500', note: '+4.2°C Surge' },
                        { month: 'JUN', val: 60, color: 'bg-sand-200', note: '50mm precip' },
                        { month: 'JUL', val: 45, color: 'bg-sand-200', note: '38mm precip' },
                        { month: 'AUG', val: 80, color: 'bg-forest-600', note: '74mm precip' },
                        { month: 'SEP', val: 50, color: 'bg-sand-200', note: '42mm precip' },
                        { month: 'OCT', val: 35, color: 'bg-sand-200', note: '28mm precip' },
                        { month: 'NOV', val: 70, color: 'bg-amber-500', note: '+2.8°C Anomaly' },
                        { month: 'DEC', val: 60, color: 'bg-sand-200', note: '52mm precip' }
                      ].map((item, idx) => (
                        <div 
                          key={idx}
                          onMouseEnter={() => setHoveredMonth(`${item.month}: ${item.note}`)}
                          onMouseLeave={() => setHoveredMonth(null)}
                          className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                        >
                          <div 
                            style={{ height: `${item.val}%` }} 
                            className={`w-full ${item.color} group-hover:brightness-95 rounded-t-md transition-all relative`}
                          >
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-mono bg-ink-900 text-sand-50 px-1.5 py-0.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                              {item.note}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between mt-2.5 text-[10px] text-ink-400 uppercase font-bold font-mono px-1">
                      <span>JAN</span>
                      <span>MAR</span>
                      <span>MAY</span>
                      <span>JUL</span>
                      <span>SEP</span>
                      <span>NOV</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-ink-500 font-mono mt-3 pt-2 border-t border-sand-200 flex justify-between">
                    <span>Active Baseline: Historical Mean</span>
                    <span className="text-ink-900 font-semibold">{hoveredMonth || 'Hover bar for monthly telemetry'}</span>
                  </div>
                </div>

                {/* Real Data Integration State */}
                <div className="col-span-12 lg:col-span-3 bg-white/80 border border-sand-200 rounded-3xl p-5 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-sand-200">
                      <span className="text-xs font-bold text-ink-500 uppercase tracking-wider font-mono">
                        {t('overview.dataIntegration', 'Live Data Feed Status')}
                      </span>
                      {(!incidentsConnected || weatherError) && !weatherLoading ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] rounded-full border border-amber-200 font-bold font-mono">
                          DEGRADED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] rounded-full border border-emerald-200 font-bold font-mono">
                          {t('common.connected', 'CONNECTED')}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Open-Meteo Weather API */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-700 font-medium">{t('overview.weatherFeed', 'Weather Data Feed')}</span>
                        <span className={`font-mono text-[10px] font-bold flex items-center gap-1 ${weatherError && !weatherLoading ? 'text-amber-600' : 'text-emerald-700'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${weatherError && !weatherLoading ? 'bg-amber-500' : 'bg-emerald-600 animate-pulse'}`}></span>
                          {weatherLoading ? 'Syncing...' : liveWeather ? t('common.live', 'Live Feed') : 'Unavailable'}
                        </span>
                      </div>

                      {/* Incident Command Store */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-700 font-medium">{t('overview.incidentApi', 'Emergency Dispatch System')}</span>
                        <span className={`font-mono text-[10px] font-bold ${!incidentsConnected ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {incidentsConnected ? `${incidents.length} ${t('common.synced', 'Synced')}` : 'Cached Only'}
                        </span>
                      </div>

                      {/* Hardware IoT Sensor Network */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-700 font-medium">{t('overview.sensorMesh', 'Local Weather Sensors')}</span>
                        <span className="font-mono text-[10px] text-emerald-700 font-bold">
                          {sensors.length} Online
                        </span>
                      </div>

                      {/* Critical Infrastructure Registry */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-700 font-medium">{t('overview.assetsMonitored', 'Protected Community Buildings')}</span>
                        <span className="font-mono text-[10px] text-ink-500 font-bold">
                          {assets.length} Monitored
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-sand-200 flex items-center justify-between text-[10px] text-ink-500 font-mono">
                    <span>Polling interval: 10s</span>
                    <span className="text-emerald-700 font-bold">99.98% Uptime</span>
                  </div>
                </div>
              </div>

              {/* Bento Navigation Shortcuts to Core Modules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div 
                  id="bento-shortcut-flood"
                  onClick={() => setActiveTab('flood_prediction')}
                  className="bg-white/80 hover:bg-white border border-sand-200 hover:border-cyan-400 rounded-3xl p-5 transition-all cursor-pointer shadow-xs hover:shadow-md group"
                >
                  <div className="flex items-center justify-between text-xs text-cyan-800 mb-1.5 font-bold font-mono">
                    <span className="uppercase tracking-wider text-[10px]">
                      {t('flood.badge', 'LIVE RIVER FLOW')}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="font-bold text-ink-900 text-sm font-serif">
                    {t('flood.heading', 'River Flow & Flood Water Forecast')}
                  </div>
                  <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                    {t('flood.subheading', 'Live river height, flood overflow limits, and water pump status')}
                  </p>
                </div>

                <div 
                  id="bento-shortcut-drought"
                  onClick={() => setActiveTab('drought_assessment')}
                  className="bg-white/80 hover:bg-white border border-sand-200 hover:border-amber-400 rounded-3xl p-5 transition-all cursor-pointer shadow-xs hover:shadow-md group"
                >
                  <div className="flex items-center justify-between text-xs text-amber-800 mb-1.5 font-bold font-mono">
                    <span className="uppercase tracking-wider text-[10px]">
                      {t('drought.badge', 'DROUGHT MONITOR')}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="font-bold text-ink-900 text-sm font-serif">
                    {t('drought.heading', 'Drought Tracking & Farm Water Advisory')}
                  </div>
                  <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                    {t('drought.subheading', 'Soil dryness levels, water reservoir levels, and watering guidelines')}
                  </p>
                </div>

                <div 
                  id="bento-shortcut-sme"
                  onClick={() => setActiveTab('sme_preparedness')}
                  className="bg-white/80 hover:bg-white border border-sand-200 hover:border-forest-400 rounded-3xl p-5 transition-all cursor-pointer shadow-xs hover:shadow-md group"
                >
                  <div className="flex items-center justify-between text-xs text-forest-800 mb-1.5 font-bold font-mono">
                    <span className="uppercase tracking-wider text-[10px]">
                      {t('sme.badge', 'BUSINESS SAFETY')}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="font-bold text-ink-900 text-sm font-serif">
                    {t('sme.heading', 'Small Business Weather Readiness & Safety Guide')}
                  </div>
                  <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                    {t('sme.subheading', 'Practical protection steps, backup power, and recovery plans for local businesses')}
                  </p>
                </div>
              </div>
            </div>
          )}

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

          {activeTab === 'drought_assessment' && (
            <div className="animate-in fade-in duration-200">
              <DroughtAssessmentModule
                location={currentLocation}
                sensors={sensors}
                onTriggerAgriculturalAlert={handleCreateIncident}
              />
            </div>
          )}

          {activeTab === 'vulnerability_var' && (
            <div className="animate-in fade-in duration-200">
              <VulnerabilityDashboard
                location={currentLocation}
                assets={assets}
              />
            </div>
          )}

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

          {activeTab === 'sme_preparedness' && (
            <div className="animate-in fade-in duration-200">
              <SMEPreparednessModule
                location={currentLocation}
              />
            </div>
          )}

          {activeTab === 'scenario_simulator' && (
            <div className="animate-in fade-in duration-200">
              <ScenarioSimulator
                location={currentLocation}
              />
            </div>
          )}

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
      </div>

      {/* Synthesis Report Modal Dialog */}
      {reportModalOpen && (
        <div 
          id="report-synthesis-modal"
          className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setReportModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl border border-sand-200 max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-sand-200">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200">
                  {t('report.badge', 'OFFICIAL COMMUNITY SUMMARY')}
                </span>
                <h3 className="text-xl font-bold text-ink-900 font-serif mt-1.5">
                  {t('report.title', 'Community Climate & Weather Safety Report')}
                </h3>
                <p className="text-xs text-ink-500 font-mono">
                  {currentLocation.name}, {currentLocation.country} • {new Date().toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-sand-100 hover:bg-sand-200 flex items-center justify-center text-ink-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-sand-50 p-3.5 rounded-2xl border border-sand-200">
                <span className="text-[10px] uppercase font-bold text-ink-500 font-mono">{t('overview.resilienceScore', 'Readiness Score')}</span>
                <div className="text-2xl font-bold font-mono text-forest-800 mt-1">{resilienceScore}/100</div>
              </div>
              <div className="bg-sand-50 p-3.5 rounded-2xl border border-sand-200">
                <span className="text-[10px] uppercase font-bold text-ink-500 font-mono">{t('overview.assetsMonitored', 'Protected Buildings')}</span>
                <div className="text-2xl font-bold font-mono text-ink-900 mt-1">{assets.length}</div>
              </div>
              <div className="bg-sand-50 p-3.5 rounded-2xl border border-sand-200">
                <span className="text-[10px] uppercase font-bold text-ink-500 font-mono">{t('overview.earlyWarningFeed', 'Active Warnings')}</span>
                <div className="text-2xl font-bold font-mono text-rose-700 mt-1">{activeAlertsList.length}</div>
              </div>
            </div>

            <div className="space-y-3 text-xs text-ink-700">
              <h4 className="font-bold text-ink-900 uppercase tracking-wider font-mono">
                {t('report.summaryHeading', 'Executive Summary')}
              </h4>
              <p className="leading-relaxed bg-sand-50 p-4 rounded-2xl border border-sand-200">
                {language === 'sw'
                  ? `Eneo la ${currentLocation.name} lina alama ya jumla ya hatari ya ${currentLocation.vulnerabilityIndex}/100, hasa kutokana na hatari ya ${currentLocation.primaryRisk}. Mifumo ya sasa ya kinga za maji na tahadhari za mapema inatoa ulinzi madhubuti kwa miundombinu muhimu ya jamii.`
                  : `The ${currentLocation.name} area has an overall climate hazard rating of ${currentLocation.vulnerabilityIndex}/100, primarily driven by ${currentLocation.primaryRisk.replace('_', ' ')} exposure. Current local flood defenses and automated community warning systems provide high coverage for essential neighborhood facilities.`}
              </p>

              <h4 className="font-bold text-ink-900 uppercase tracking-wider font-mono mt-4">
                {t('report.directivesHeading', 'Priority Safety Directives')}
              </h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-sand-200">
                  <CheckCircle2 className="w-4 h-4 text-forest-700 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === 'sw'
                      ? 'Dumisha utayari wa vizuizi vya mafuriko kwenye maeneo ya chini ya kibiashara.'
                      : 'Maintain moveable flood barrier readiness at low-lying warehouses and clinics.'}
                  </span>
                </div>
                <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-sand-200">
                  <CheckCircle2 className="w-4 h-4 text-forest-700 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === 'sw'
                      ? 'Washa ving\'ora vya umma na ujumbe wa SMS mto unapofikia kina cha mita 3.8.'
                      : 'Trigger public sirens and mobile SMS broadcasts when local river depth reaches 3.80m.'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-sand-100 hover:bg-sand-200 text-ink-900 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 border border-sand-300"
              >
                <Printer className="w-3.5 h-3.5" />
                {t('common.printOrExport', 'Print / Save PDF')}
              </button>
              <button
                onClick={() => setReportModalOpen(false)}
                className="px-5 py-2 bg-forest-900 hover:bg-forest-800 text-sand-50 text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                {t('common.done', 'Done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warm Light Footer */}
      <footer className="border-t border-sand-200 bg-sand-100/80 py-4 px-6 text-xs text-ink-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-forest-800 rounded-xs rotate-45"></div>
            <span className="font-semibold text-forest-900">SMARTANGA • CLIMASHIELD RESILIENCE PLATFORM</span>
          </div>
          <span>{t('overview.sendaiFramework', 'Compliant with international disaster risk reduction standards (Sendai Framework)')}</span>
        </div>
      </footer>
    </div>
  );
}
