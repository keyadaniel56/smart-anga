import React, { useState } from 'react';
import { 
  Waves, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Droplets, 
  CheckCircle2, 
  Radio
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Line, 
  ReferenceLine 
} from 'recharts';
import { LocationProfile, SensorNode, LiveWeatherData } from '../types/climate';
import { RiskBadge } from './ui/RiskBadge';
import { RiskDial } from './ui/RiskDial';
import { useTranslation } from '../context/LanguageContext';

interface FloodPredictionModuleProps {
  location: LocationProfile;
  liveWeather: LiveWeatherData | null;
  sensors: SensorNode[];
  onTriggerEmergencyDispatch?: (details: any) => void;
}

export const FloodPredictionModule: React.FC<FloodPredictionModuleProps> = ({
  location,
  sensors,
  onTriggerEmergencyDispatch
}) => {
  const { t } = useTranslation();
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

  const simulatedRainfallBoost = 0;

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
      {/* Top Banner */}
      <div className="bg-white/80 border border-sand-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center justify-center shadow-xs">
            <Waves className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-ink-900 font-serif">
                {t('flood.heading', 'River Flow & Flood Water Forecast')}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-mono font-bold tracking-wide border border-cyan-200">
                {t('flood.badge', 'LIVE RIVER FLOW')}
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-0.5">
              {t('flood.subheading', 'Live river height, flood overflow limits, and water pump status')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RiskBadge
            level={isBreachProjected ? 'critical' : 'high'}
            size="md"
            label={isBreachProjected ? t('flood.breachExceeded', 'River Overflow Danger') : t('flood.channelWatch', 'River Overflow Watch')}
          />
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* River Stage Elevation */}
        <div className="bg-white/80 border border-sand-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-500 mb-1">
            <span className="font-semibold uppercase tracking-wider font-mono">{t('flood.stageLevel', 'Current River Height')}</span>
            <span className="flex items-center gap-1 text-cyan-700 font-mono text-[11px] font-bold">
              <Radio className="w-3 h-3 animate-pulse text-cyan-600" /> {t('common.live', 'Live')}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-cyan-800">
              {riverSensor ? riverSensor.currentValue.toFixed(2) : '4.82'}m
            </span>
            <span className="text-xs text-rose-700 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +24 cm/hr
            </span>
          </div>
          <div className="mt-2 text-xs text-ink-600 flex items-center justify-between">
            <span>{t('flood.bankfullLimit', 'River Overflow Threshold')}: <strong>3.80m</strong></span>
            <span className="text-rose-700 font-bold font-mono">1.02m {t('flood.metersOver', 'Over Safe Limit')}</span>
          </div>
          <div className="w-full bg-sand-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-rose-600 h-full rounded-full w-[85%]"></div>
          </div>
        </div>

        {/* Catchment Saturation */}
        <div className="bg-white/80 border border-sand-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-500 mb-1">
            <span className="font-semibold uppercase tracking-wider font-mono">{t('flood.soilSaturation', 'Soil Water Saturation')}</span>
            <Droplets className="w-4 h-4 text-forest-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-forest-800">
              {catchmentSaturationPct}%
            </span>
            <span className="text-xs text-amber-700 font-semibold">{t('flood.nearCapacity', 'Nearly Full of Water')}</span>
          </div>
          <div className="mt-2 text-xs text-ink-600">
            {t('flood.runoffLabel', 'Water Runoff Risk')}: <strong className="text-ink-900 font-mono">0.82 ({t('flood.highRunoff', 'High Runoff')})</strong>
          </div>
          <div className="w-full bg-sand-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-forest-600 h-full rounded-full w-[88%]"></div>
          </div>
        </div>

        {/* Peak Inundation Forecast */}
        <div className="bg-white/80 border border-sand-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-500 mb-1">
            <span className="font-semibold uppercase tracking-wider font-mono">{t('flood.peakDischarge', 'Expected Peak Water Flow')}</span>
            <Clock className="w-4 h-4 text-ochre-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono ${isBreachProjected ? 'text-rose-700' : 'text-ochre-700'}`}>
              {peakDischarge.toFixed(0)} m³/s
            </span>
            <span className="text-xs text-ink-500 font-semibold font-mono">in ~{timeToPeakHours}h</span>
          </div>
          <div className="mt-2 text-xs text-ink-600">
            {t('flood.safeFlowLimit', 'Safe River Flow Limit')}: <strong className="text-ink-900 font-mono">250 m³/s</strong>
          </div>
          <div className="w-full bg-sand-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className={`h-full rounded-full ${isBreachProjected ? 'bg-rose-600' : 'bg-ochre-500'} w-[94%]`}></div>
          </div>
        </div>

        {/* Defense Readiness & SOP Dispatch */}
        <div className="bg-white/80 border border-sand-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-ink-500 mb-1">
              <span className="font-semibold uppercase tracking-wider font-mono">{t('flood.defenseReadiness', 'Flood Barrier Readiness')}</span>
              <ShieldCheck className="w-4 h-4 text-forest-700" />
            </div>
            <div className="text-sm font-bold text-ink-900 mt-1">
              {activeDefenses.floodGates && activeDefenses.highVolumePumps 
                ? t('flood.barrierDeployed', 'High Barriers in Place') 
                : t('flood.defensesStandby', 'Defenses on Standby')}
            </div>
            <p className="text-xs text-ink-500 mt-0.5">
              {t('flood.smeBarrierStatus', 'Local business area barriers')}: <strong>{t('common.active', 'Active')}</strong>
            </p>
          </div>
          <button
            onClick={handleTriggerFloodDispatch}
            className="mt-3 w-full py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {t('flood.dispatchSop', 'Dispatch Flood Response Team')}
          </button>
        </div>
      </div>

      {/* Hydrograph Forecast Chart */}
      <div className="bg-white/90 border border-sand-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-200">
          <div>
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-cyan-700" />
              <h3 className="text-base font-bold text-ink-900 font-serif">
                {t('flood.chartHeading', '48-Hour River Flow Forecast')}
              </h3>
            </div>
            <p className="text-xs text-ink-500 mt-0.5">
              {t('flood.chartSubheading', 'Expected river water volume compared to safe bank limits')}
            </p>
          </div>

          {/* Scenario Return Period Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-500 font-semibold font-mono">{t('flood.scenarioLabel', 'Forecast Scenario')}:</span>
            <div className="flex items-center bg-sand-100 p-1 rounded-xl border border-sand-200 text-xs">
              <button
                onClick={() => setReturnPeriodScenario('current')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  returnPeriodScenario === 'current' ? 'bg-forest-900 text-sand-50 font-bold' : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                {t('common.live', 'Live')}
              </button>
              <button
                onClick={() => setReturnPeriodScenario('10yr')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  returnPeriodScenario === '10yr' ? 'bg-forest-900 text-sand-50 font-bold' : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                10-Yr
              </button>
              <button
                onClick={() => setReturnPeriodScenario('50yr')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  returnPeriodScenario === '50yr' ? 'bg-forest-900 text-sand-50 font-bold' : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                50-Yr
              </button>
              <button
                onClick={() => setReturnPeriodScenario('100yr')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  returnPeriodScenario === '100yr' ? 'bg-rose-700 text-white font-bold' : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                100-Yr
              </button>
            </div>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-80 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hydrographData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="dischargeGradientLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0891b2" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0891b2" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e2d6" />
              <XAxis dataKey="time" stroke="#6f7a72" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="discharge" stroke="#0891b2" tick={{ fontSize: 11 }} label={{ value: t('flood.dischargeUnit', 'River Flow (m³/s)'), angle: -90, position: 'insideLeft', fill: '#0891b2', fontSize: 11 }} />
              <YAxis yAxisId="rain" orientation="right" stroke="#2563eb" tick={{ fontSize: 11 }} label={{ value: t('flood.precipUnit', 'Rainfall (mm)'), angle: 90, position: 'insideRight', fill: '#2563eb', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e2d6', borderRadius: '0.875rem', color: '#191c1a', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} 
              />
              <ReferenceLine y={250} yAxisId="discharge" label={{ value: t('flood.safeLimitLabel', 'Safe Limit (250 m³/s)'), fill: '#15803d', fontSize: 11 }} stroke="#15803d" strokeDasharray="4 4" />
              <ReferenceLine y={380} yAxisId="discharge" label={{ value: t('flood.breachLimitLabel', 'Overflow Limit (380 m³/s)'), fill: '#b91c1c', fontSize: 11 }} stroke="#b91c1c" strokeWidth={2} />
              
              <Area yAxisId="discharge" type="monotone" dataKey="discharge" stroke="#0891b2" strokeWidth={3} fillOpacity={1} fill="url(#dischargeGradientLight)" name={t('flood.dischargeUnit', 'River Flow (m³/s)')} />
              <Line yAxisId="rain" type="monotone" dataKey="rainfallMm" stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 3" name={t('flood.precipUnit', 'Rainfall (mm)')} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Live Defense Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-sand-200">
          <div className="bg-sand-50/80 border border-sand-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-ink-900">{t('flood.floodGates', 'Moveable Flood Gates')}</div>
              <div className="text-[11px] text-ink-500">{t('flood.floodGatesLocation', 'Riverside Business District')}</div>
            </div>
            <button
              onClick={() => handleToggleDefense('floodGates')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeDefenses.floodGates ? 'bg-forest-900 text-sand-50 shadow-xs' : 'bg-sand-200 text-ink-600'
              }`}
            >
              {activeDefenses.floodGates ? t('flood.deployed', 'DEPLOYED') : t('flood.standby', 'STANDBY')}
            </button>
          </div>

          <div className="bg-sand-50/80 border border-sand-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-ink-900">{t('flood.pumps', 'High-Capacity Water Pumps')}</div>
              <div className="text-[11px] text-ink-500">{t('flood.pumpsDesc', 'Pumps excess flood water away (40,000 L/min)')}</div>
            </div>
            <button
              onClick={() => handleToggleDefense('highVolumePumps')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeDefenses.highVolumePumps ? 'bg-forest-900 text-sand-50 shadow-xs' : 'bg-sand-200 text-ink-600'
              }`}
            >
              {activeDefenses.highVolumePumps ? t('flood.active', 'ACTIVE') : t('flood.offline', 'OFFLINE')}
            </button>
          </div>

          <div className="bg-sand-50/80 border border-sand-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-ink-900">{t('flood.sluice', 'Upstream Water Overflow Gate')}</div>
              <div className="text-[11px] text-ink-500">{t('flood.sluiceDesc', 'Redirects high water into natural wetlands')}</div>
            </div>
            <button
              onClick={() => handleToggleDefense('diversionSluice')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeDefenses.diversionSluice ? 'bg-forest-900 text-sand-50 shadow-xs' : 'bg-sand-200 text-ink-600'
              }`}
            >
              {activeDefenses.diversionSluice ? t('flood.open', 'OPEN') : t('flood.closed', 'CLOSED')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
