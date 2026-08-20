import React, { useState } from 'react';
import { 
  Waves, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Droplets, 
  Compass, 
  CheckCircle2, 
  RefreshCw,
  Sliders,
  Radio
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Line, 
  ComposedChart, 
  ReferenceLine 
} from 'recharts';
import { LocationProfile, SensorNode, LiveWeatherData } from '../types/climate';

interface FloodPredictionModuleProps {
  location: LocationProfile;
  liveWeather: LiveWeatherData | null;
  sensors: SensorNode[];
  onTriggerEmergencyDispatch?: (details: any) => void;
}

export const FloodPredictionModule: React.FC<FloodPredictionModuleProps> = ({
  location,
  liveWeather,
  sensors,
  onTriggerEmergencyDispatch
}) => {
  const [returnPeriodScenario, setReturnPeriodScenario] = useState<'current' | '10yr' | '50yr' | '100yr'>('current');
  const [activeDefenses, setActiveDefenses] = useState<{
    floodGates: boolean;
    highVolumePumps: boolean;
    diversionSluice: boolean;
  }>({
    floodGates: true,
    highVolumePumps: false,
    diversionSluice: false
  });

  const [simulatedRainfallBoost, setSimulatedRainfallBoost] = useState<number>(0);

  // Hydrograph discharge data (m3/s over 48 hours)
  const hydrographData = [
    { time: 'T-12h', discharge: 120, safeLimit: 250, criticalThreshold: 380, rainfallMm: 4 },
    { time: 'T-8h', discharge: 165, safeLimit: 250, criticalThreshold: 380, rainfallMm: 12 },
    { time: 'T-4h', discharge: 220, safeLimit: 250, criticalThreshold: 380, rainfallMm: 24 },
    { time: 'Now', discharge: 295 + simulatedRainfallBoost * 1.5, safeLimit: 250, criticalThreshold: 380, rainfallMm: 38 },
    { time: 'T+4h', discharge: returnPeriodScenario === '100yr' ? 490 : returnPeriodScenario === '50yr' ? 420 : returnPeriodScenario === '10yr' ? 360 : 340 + simulatedRainfallBoost * 2, safeLimit: 250, criticalThreshold: 380, rainfallMm: 45 },
    { time: 'T+8h', discharge: returnPeriodScenario === '100yr' ? 580 : returnPeriodScenario === '50yr' ? 465 : returnPeriodScenario === '10yr' ? 385 : 375 + simulatedRainfallBoost * 2.4, safeLimit: 250, criticalThreshold: 380, rainfallMm: 52 },
    { time: 'T+12h', discharge: returnPeriodScenario === '100yr' ? 520 : returnPeriodScenario === '50yr' ? 430 : returnPeriodScenario === '10yr' ? 350 : 330 + simulatedRainfallBoost * 1.8, safeLimit: 250, criticalThreshold: 380, rainfallMm: 28 },
    { time: 'T+18h', discharge: returnPeriodScenario === '100yr' ? 410 : returnPeriodScenario === '50yr' ? 340 : returnPeriodScenario === '10yr' ? 290 : 270 + simulatedRainfallBoost * 1.2, safeLimit: 250, criticalThreshold: 380, rainfallMm: 14 },
    { time: 'T+24h', discharge: returnPeriodScenario === '100yr' ? 320 : returnPeriodScenario === '50yr' ? 270 : returnPeriodScenario === '10yr' ? 230 : 210, safeLimit: 250, criticalThreshold: 380, rainfallMm: 6 },
    { time: 'T+36h', discharge: 180, safeLimit: 250, criticalThreshold: 380, rainfallMm: 2 },
    { time: 'T+48h', discharge: 140, safeLimit: 250, criticalThreshold: 380, rainfallMm: 0 }
  ];

  // River stage sensor
  const riverSensor = sensors.find(s => s.type === 'river_stage') || sensors[0];
  const precipitationSensor = sensors.find(s => s.type === 'precipitation') || sensors[3];

  const peakDischarge = Math.max(...hydrographData.map(d => d.discharge));
  const isBreachProjected = peakDischarge > 380;
  const timeToPeakHours = 8;
  const catchmentSaturationPct = 88.4;

  const handleToggleDefense = (key: 'floodGates' | 'highVolumePumps' | 'diversionSluice') => {
    setActiveDefenses(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTriggerFloodDispatch = () => {
    if (onTriggerEmergencyDispatch) {
      onTriggerEmergencyDispatch({
        title: `Flash Flood Early Inundation Dispatch - ${location.riverBasin || location.name}`,
        hazardType: 'flood',
        severity: isBreachProjected ? 'critical' : 'high',
        location: `${location.name} - Catchment Lowlands`,
        coordinates: location.coordinates,
        department: 'Emergency Management',
        assignedTo: 'Hydrology Crisis Unit & Public Works',
        actionsTaken: [
          'Activated mobile high-capacity pumps (Stage 3)',
          'Pre-alerted low-elevation logistics & SME facilities',
          'Initiated catchment sluice flow diversion'
        ]
      });
    }
  };

  return (
    <div id="flood-prediction-container" className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* River Stage Elevation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">River Stage Level</span>
            <span className="flex items-center gap-1 text-cyan-400 font-mono">
              <Radio className="w-3 h-3 animate-pulse" /> Live Telemetry
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-cyan-400">
              {riverSensor ? riverSensor.currentValue.toFixed(2) : '4.82'}m
            </span>
            <span className="text-xs text-red-400 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +24 cm/hr
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Bankfull Threshold: <strong>3.80m</strong></span>
            <span className="text-red-400 font-bold">1.02m Exceeded</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-red-500 h-full rounded-full w-[85%]"></div>
          </div>
        </div>

        {/* Catchment Saturation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Catchment Saturation</span>
            <Droplets className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-teal-300">
              {catchmentSaturationPct}%
            </span>
            <span className="text-xs text-amber-300 font-semibold">Near Soil Capacity</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Soil Runoff Coefficient: <strong className="text-slate-200">0.82 (High Runoff)</strong>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-teal-500 h-full rounded-full w-[88%]"></div>
          </div>
        </div>

        {/* Peak Inundation Forecast */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Projected Peak Discharge</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono ${isBreachProjected ? 'text-red-400' : 'text-amber-400'}`}>
              {peakDischarge.toFixed(0)} m³/s
            </span>
            <span className="text-xs text-slate-300 font-semibold">in ~{timeToPeakHours}h</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Safe Channel Flow: <strong className="text-slate-200">250 m³/s</strong>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className={`h-full rounded-full ${isBreachProjected ? 'bg-red-500' : 'bg-amber-500'} w-[94%]`}></div>
          </div>
        </div>

        {/* Inundation Risk Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider">Defense Readiness</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-slate-200 mt-1">
              {activeDefenses.floodGates && activeDefenses.highVolumePumps 
                ? 'High Barrier Mitigation Active' 
                : 'Defenses Partially Deployed'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              SME low-elevation flood barriers: <strong>Engaged</strong>
            </p>
          </div>
          <button
            onClick={handleTriggerFloodDispatch}
            className="mt-3 w-full py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-red-900/40"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Dispatch Flood Response SOP
          </button>
        </div>
      </div>

      {/* Hydrograph Forecast Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-slate-100">
                Hydrological Discharge & Runoff Forecast (Hydrograph)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time streamflow vs. critical bankfull overtopping thresholds for {location.riverBasin || location.name}
            </p>
          </div>

          {/* Scenario Return Period Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Scenario:</span>
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setReturnPeriodScenario('current')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  returnPeriodScenario === 'current' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Live Baseline
              </button>
              <button
                onClick={() => setReturnPeriodScenario('10yr')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  returnPeriodScenario === '10yr' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1-in-10 Yr
              </button>
              <button
                onClick={() => setReturnPeriodScenario('50yr')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  returnPeriodScenario === '50yr' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1-in-50 Yr
              </button>
              <button
                onClick={() => setReturnPeriodScenario('100yr')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  returnPeriodScenario === '100yr' ? 'bg-red-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1-in-100 Yr
              </button>
            </div>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-80 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hydrographData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="dischargeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="discharge" stroke="#06b6d4" tick={{ fontSize: 11 }} label={{ value: 'Discharge (m³/s)', angle: -90, position: 'insideLeft', fill: '#06b6d4', fontSize: 11 }} />
              <YAxis yAxisId="rain" orientation="right" stroke="#3b82f6" tick={{ fontSize: 11 }} label={{ value: 'Rainfall (mm)', angle: 90, position: 'insideRight', fill: '#3b82f6', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px' }} 
              />
              <ReferenceLine y={250} yAxisId="discharge" label={{ value: 'Safe Channel Limit (250 m³/s)', fill: '#10b981', fontSize: 11 }} stroke="#10b981" strokeDasharray="4 4" />
              <ReferenceLine y={380} yAxisId="discharge" label={{ value: 'Major Breach Threshold (380 m³/s)', fill: '#ef4444', fontSize: 11 }} stroke="#ef4444" strokeWidth={2} />
              
              <Area yAxisId="discharge" type="monotone" dataKey="discharge" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#dischargeGradient)" name="Stream Discharge (m³/s)" />
              <Line yAxisId="rain" type="monotone" dataKey="rainfallMm" stroke="#60a5fa" strokeWidth={2} strokeDasharray="3 3" name="Precipitation (mm)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Live Hydrological Defense Controls & Simulation Adjuster */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">Demountable Flood Gates</div>
              <div className="text-[11px] text-slate-400">Protects Riverside Logistics Corridor</div>
            </div>
            <button
              onClick={() => handleToggleDefense('floodGates')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeDefenses.floodGates ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {activeDefenses.floodGates ? 'DEPLOYED' : 'STANDBY'}
            </button>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">High-Volume Mobile Pumps</div>
              <div className="text-[11px] text-slate-400">40,000 L/min Submersible Array</div>
            </div>
            <button
              onClick={() => handleToggleDefense('highVolumePumps')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeDefenses.highVolumePumps ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {activeDefenses.highVolumePumps ? 'ACTIVE' : 'OFFLINE'}
            </button>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">Upstream Retention Sluice</div>
              <div className="text-[11px] text-slate-400">Diverts 45 m³/s into Wetland Basin</div>
            </div>
            <button
              onClick={() => handleToggleDefense('diversionSluice')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeDefenses.diversionSluice ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {activeDefenses.diversionSluice ? 'OPEN (DIVERTING)' : 'CLOSED'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
