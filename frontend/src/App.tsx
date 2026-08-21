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
import { useTranslation } from './context/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WeatherSkeleton } from './components/SkeletonLoader';
import { 
  ArrowRight,
  FileText,
  Radio,
  Printer,
  X,
  CheckCircle2,
  WifiOff,       
  AlertCircle    
} from 'lucide-react';

export default function App() {
  const { t, language } = useTranslation();
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

  // Global telemetry synchronization status states
  const [isLive, setIsLive] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core status synchronization stream engine connection
  useEffect(() => {
    const unsubscribe = subscribeToStatusChanges((status) => {
      setIsLive(status.live);
      if (!status.live && status.msg) {
        setToastMessage(status.msg);
      }
    });
    return () => unsubscribe();
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
      if (data) {
        setLiveWeather(data);
      } else {
        setWeatherError(true);
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
        }
      } catch (err) {
        console.warn('Incident server sync notice:', err);
        setIncidentsConnected(false);
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
    <ErrorBoundary>
      <div id="climate-resilience-app" className="min-h-screen bg-sand-50 text-ink-900 flex flex-col font-sans antialiased selection:bg-teal-500/20 selection:text-forest-900 relative">
        
        {/* ⚠️ CACHED OFFLINE WARNING BANNER */}
        {!isLive && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 px-4 py-2 text-xs flex items-center justify-center gap-2 font-medium tracking-wide animate-in slide-in-from-top duration-200 z-50">
            <WifiOff className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
            <span>Using cached data: Telemetry Link Down. Operating on Local Monitored Cached Data Cluster safely.</span>
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
                        {t('overview.liveMonitorBadge', 'REAL-TIME TELEMETRY MATRIX')}
                      </span>
                      <span className="text-xs text-ink-500 font-mono">
                        Target Catchment: <strong className="text-ink-900">{currentLocation.name}, {currentLocation.country}</strong>
                      </span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-ink-900">
                      Integrated Climate Risk & Inter-Departmental Operations
                    </h2>
                  </div>
                </div>

<<<<<<< HEAD
                {/* Weather Metrics Card Column with integrated Skeletons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {weatherLoading ? (
                    <WeatherSkeleton />
=======
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
>>>>>>> 80014e6e339e8980f3eaef1b218d892ab0eb8a09
                  ) : (
                    <div className="bg-white border border-sand-200 rounded-2xl p-4 shadow-sm">
                      <h3 className="text-xs font-mono uppercase text-ink-500">Live Conditions</h3>
                      <p className="text-2xl font-bold mt-1 text-ink-900">
                        {weatherError ? 'Fallback Mode' : `${liveWeather?.temperature ?? '24.5'}°C`}
                      </p>
                      <p className="text-xs text-ink-600 mt-0.5">
                        {weatherError ? 'Local Offline Metric Calculation' : (liveWeather?.condition ?? 'Clear Sky Monitoring')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Map Interface Area Wrapper Layout Card */}
                <RiskMap 
                  location={currentLocation} 
                  sensors={sensors}
                  assets={assets}
                />
              </div>
            )}

            {/* Module Routing Engine System */}
            {activeTab === 'flood_prediction' && (
              <FloodPredictionModule currentLocation={currentLocation} />
            )}
            {activeTab === 'drought_assessment' && (
              <DroughtAssessmentModule currentLocation={currentLocation} />
            )}
            {activeTab === 'vulnerability_var' && (
              <VulnerabilityDashboard currentLocation={currentLocation} />
            )}
            {activeTab === 'early_warning' && (
              <EarlyWarningModule 
                alerts={alerts} 
                onBroadcastAlert={handleBroadcastAlert}
                incidents={incidents}
                onUpdateIncidentStatus={handleUpdateIncidentStatus}
                onCreateIncident={handleCreateIncident}
              />
            )}
            {activeTab === 'sme_preparedness' && (
              <SMEPreparednessModule profiles={DEFAULT_SME_PROFILES} />
            )}
            {activeTab === 'scenario_simulator' && (
              <ScenarioSimulator currentLocation={currentLocation} />
            )}
            {activeTab === 'sensor_telemetry' && (
              <LiveSensorFeed 
                sensors={sensors} 
                onAddReading={handleAddSensorReading}
                onResolveAnomaly={handleResolveAnomaly}
              />
            )}
          </main>
        </div>

        {/* 🚨 FLOATING SNACKBAR / TOAST INFRASTRUCTURE */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-ink-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-50 border border-ink-700 max-w-sm animate-in slide-in-from-bottom duration-300">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1 text-xs">
              <strong className="block font-semibold mb-0.5">API Sync Fault</strong>
              <span className="text-ink-300">{toastMessage}</span>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-ink-400 hover:text-white p-0.5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}