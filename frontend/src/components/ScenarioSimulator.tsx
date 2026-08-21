import React, { useState } from 'react';
import { 
  FlaskConical, 
  Play, 
  RotateCcw, 
  AlertTriangle, 
  TrendingUp, 
  Building2, 
  Sprout, 
  Droplets, 
  ShieldCheck,
  Zap,
  Info,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { LocationProfile } from '../types/climate';
import { RiskBadge, RiskLevel } from './ui/RiskBadge';
import { RiskDial } from './ui/RiskDial';
import { useTranslation } from '../context/LanguageContext';

interface ScenarioSimulatorProps {
  location: LocationProfile;
}

interface SimulationResults {
  inundationAreaKm2: number;
  economicExposureMillionsUSD: number;
  cropYieldImpactPct: number;
  stressScore: number;
  cascadeRiskLevel: RiskLevel;
  mitigationActions: string[];
  simulatedAt: string;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  location
}) => {
  const { t } = useTranslation();
  const [precipDelta, setPrecipDelta] = useState<number>(40);
  const [tempDelta, setTempDelta] = useState<number>(2.8);
  const [droughtWeeks, setDroughtWeeks] = useState<number>(4);
  const [riverMultiplier, setRiverMultiplier] = useState<number>(1.8);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const presets = [
    {
      name: '2035 100-Yr Flash Inundation',
      precip: 55,
      temp: 1.5,
      drought: 0,
      river: 2.4,
      desc: 'Extreme atmospheric river and stream overtopping'
    },
    {
      name: 'Severe 8-Week Agricultural Drought',
      precip: -45,
      temp: 3.5,
      drought: 8,
      river: 0.6,
      desc: 'Extended soil moisture depletion and crop wilting'
    },
    {
      name: 'Compound Heat Dome & Grid Stress',
      precip: -20,
      temp: 4.2,
      drought: 6,
      river: 0.9,
      desc: 'High thermal anomaly with substation cooling overload'
    }
  ];

  // Deterministic calculation function
  const computeSimulation = (p: number, t: number, d: number, r: number): SimulationResults => {
    const baseArea = Math.max(12, Math.round(18.5 * (location.elevationM < 50 ? 1.4 : 0.9)));
    const precipFactor = Math.max(0.1, 1 + p / 100);
    const inundation = Math.max(1.2, Math.round(baseArea * Math.max(0.2, r * precipFactor) * 10) / 10);

    const baseExposure = 38.0;
    const exposureCoeff = ((Math.max(0, p) * 0.35) + (t * 8.5) + (d * 3.8) + (r * 16)) / 55;
    const exposure = Math.max(3.2, Math.round(baseExposure * exposureCoeff * 10) / 10);

    const cropShock = Math.min(92, Math.max(0, Math.round((d * 5.2) + (t * 6.5) - (p > 0 ? p * 0.12 : 0))));

    const rawScore = Math.round(
      (Math.max(0, p) * 0.22) + 
      (t * 7.8) + 
      (d * 3.4) + 
      ((r - 1) * 24)
    );
    const stress = Math.min(99, Math.max(8, rawScore));

    let riskLevel: RiskLevel = 'low';
    if (stress >= 75) riskLevel = 'critical';
    else if (stress >= 55) riskLevel = 'high';
    else if (stress >= 35) riskLevel = 'moderate';

    const actions: string[] = [];
    if (p > 20 || r > 1.5) {
      actions.push('Deploy moveable flood gates at business zones and position mobile water pumps.');
    }
    if (r >= 2.0) {
      actions.push('Open upstream overflow gate to redirect river water into wetlands.');
    }
    if (t >= 3.0) {
      actions.push('Open public cooling shelters and mandate regular hydration breaks for outdoor workers.');
    }
    if (d >= 4) {
      actions.push('Start farm water rationing and switch to evening drip irrigation.');
    }
    if (actions.length === 0) {
      actions.push('Maintain regular weather monitoring and sensor checks.');
    }

    return {
      inundationAreaKm2: inundation,
      economicExposureMillionsUSD: exposure,
      cropYieldImpactPct: cropShock,
      stressScore: stress,
      cascadeRiskLevel: riskLevel,
      mitigationActions: actions,
      simulatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  const [results, setResults] = useState<SimulationResults>(() => 
    computeSimulation(40, 2.8, 4, 1.8)
  );

  const handleApplyPreset = (p: typeof presets[0]) => {
    setPrecipDelta(p.precip);
    setTempDelta(p.temp);
    setDroughtWeeks(p.drought);
    setRiverMultiplier(p.river);
    setResults(computeSimulation(p.precip, p.temp, p.drought, p.river));
  };

  const handleRunSimulation = () => {
    setIsRunning(true);
    setTimeout(() => {
      setResults(computeSimulation(precipDelta, tempDelta, droughtWeeks, riverMultiplier));
      setIsRunning(false);
    }, 250);
  };

  const handleReset = () => {
    setPrecipDelta(0);
    setTempDelta(1.0);
    setDroughtWeeks(0);
    setRiverMultiplier(1.0);
    setResults(computeSimulation(0, 1.0, 0, 1.0));
  };

  return (
    <div id="scenario-simulator-container" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white/80 border border-sand-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-forest-200 text-forest-800 flex items-center justify-center shadow-xs">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-ink-900 font-serif">
                {t('simulator.heading', 'Weather ' + "'What-If'" + ' Simulator')}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 text-[10px] font-mono font-bold tracking-wide border border-forest-200">
                {t('simulator.badge', 'WEATHER SIMULATOR')}
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-0.5">
              {t('simulator.subheading', 'Test how severe storms, heatwaves, or drought would affect ' + location.name)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-sand-100 hover:bg-sand-200 text-ink-700 text-xs font-semibold transition-all border border-sand-200 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('simulator.resetBtn', 'Reset to Normal')}
          </button>
          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="px-5 py-2 rounded-xl bg-forest-900 hover:bg-forest-800 text-sand-50 text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            {t('simulator.runBtn', 'Run Simulation')}
          </button>
        </div>
      </div>

      {/* Preset Archetypes */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-ink-500 font-mono">
          {t('simulator.presetsHeading', 'Example Severe Weather Scenarios')}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(p)}
              className="bg-white/80 hover:bg-white border border-sand-200 hover:border-forest-300 p-3.5 rounded-2xl text-left transition-all shadow-xs group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-ink-900 group-hover:text-forest-900">
                <span>{p.name}</span>
                <span className="font-mono text-[10px] text-forest-700">{t('simulator.applyPreset', 'Test This')} &rarr;</span>
              </div>
              <p className="text-[11px] text-ink-500 mt-1">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Parameter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Precipitation Anomaly */}
        <div className="bg-white/80 border border-sand-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-ink-900">{t('simulator.rainfallChange', 'Rainfall Change')}</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
              precipDelta > 0 ? 'bg-cyan-50 text-cyan-800 border border-cyan-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              {precipDelta > 0 ? `+${precipDelta}%` : `${precipDelta}%`}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="100"
            step="5"
            value={precipDelta}
            onChange={(e) => setPrecipDelta(parseInt(e.target.value))}
            className="w-full accent-teal-600 bg-sand-200 cursor-pointer h-2 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-ink-400 font-mono">
            <span>-50% ({t('common.drought', 'Drought')})</span>
            <span>+100% ({t('simulator.heavyRain', 'Heavy Rain')})</span>
          </div>
        </div>

        {/* Thermal Anomaly */}
        <div className="bg-white/80 border border-sand-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-ink-900">{t('simulator.tempIncrease', 'Temperature Rise')}</span>
            <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
              +{tempDelta.toFixed(1)}°C
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="6.0"
            step="0.1"
            value={tempDelta}
            onChange={(e) => setTempDelta(parseFloat(e.target.value))}
            className="w-full accent-rose-600 bg-sand-200 cursor-pointer h-2 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-ink-400 font-mono">
            <span>+0.5°C</span>
            <span>+6.0°C ({t('simulator.extremeHeat', 'Extreme Heat')})</span>
          </div>
        </div>

        {/* Soil Drought Duration */}
        <div className="bg-white/80 border border-sand-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-ink-900">{t('simulator.droughtWeeks', 'Dry Spell Length')}</span>
            <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              {droughtWeeks} {t('simulator.weeks', 'Weeks')}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="16"
            step="1"
            value={droughtWeeks}
            onChange={(e) => setDroughtWeeks(parseInt(e.target.value))}
            className="w-full accent-amber-600 bg-sand-200 cursor-pointer h-2 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-ink-400 font-mono">
            <span>0 {t('simulator.weeks', 'Wks')}</span>
            <span>16 {t('simulator.weeks', 'Wks')} ({t('drought.severe', 'Severe')})</span>
          </div>
        </div>

        {/* River Peak Multiplier */}
        <div className="bg-white/80 border border-sand-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-ink-900">{t('simulator.riverSurge', 'River Surge Level')}</span>
            <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-forest-50 text-forest-800 border border-forest-200">
              {riverMultiplier.toFixed(1)}x Peak
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.5"
            step="0.1"
            value={riverMultiplier}
            onChange={(e) => setRiverMultiplier(parseFloat(e.target.value))}
            className="w-full accent-forest-700 bg-sand-200 cursor-pointer h-2 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-ink-400 font-mono">
            <span>0.5x</span>
            <span>3.5x ({t('simulator.overflowRisk', 'Overflow Danger')})</span>
          </div>
        </div>
      </div>

      {/* Simulated Results Section */}
      <div className="bg-white/90 border border-sand-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-sand-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-mono text-[10px] font-bold border border-amber-200">
                {t('simulator.resultsBadge', 'SIMULATION RESULTS')}
              </span>
              <span className="text-xs text-ink-500 font-mono">{t('simulator.calculatedAt', 'Simulated at')} {results.simulatedAt}</span>
            </div>
            <h3 className="text-base font-bold text-ink-900 font-serif mt-1">
              {t('simulator.resultsHeading', 'Simulated Weather Impact & Safety Advice')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-500 font-medium">{t('simulator.riskLevel', 'Overall Danger Level')}:</span>
            <RiskBadge level={results.cascadeRiskLevel} size="md" pulse={results.cascadeRiskLevel === 'critical'} />
          </div>
        </div>

        {/* 4 Quantitative Output Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Compound Stress Score Dial */}
          <div className="bg-sand-50/70 border border-sand-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 font-mono mb-1">
              {t('simulator.stressScore', 'Overall Climate Risk Score (combines all weather shocks)')}
            </span>
            <RiskDial
              score={results.stressScore}
              size={120}
              riskLevel={results.cascadeRiskLevel}
            />
            <span className="text-[11px] text-ink-500 mt-2">
              {t('simulator.stressExplainer', 'Combined risk across flood, heat, and drought')}
            </span>
          </div>

          {/* Inundation Area */}
          <div className="bg-sand-50/70 border border-sand-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-xs text-ink-500 mb-1">
              <span className="font-bold uppercase tracking-wider font-mono">{t('simulator.floodedArea', 'Expected Flooded Area')}</span>
              <Droplets className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-extrabold font-mono text-cyan-800">
                {results.inundationAreaKm2} <span className="text-sm font-sans font-medium text-ink-500">km²</span>
              </div>
              <p className="text-xs text-ink-500 mt-1">
                {t('simulator.floodedAreaDesc', 'Estimated land covered by flood water')}
              </p>
            </div>
            <div className="w-full bg-sand-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-cyan-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (results.inundationAreaKm2 / 35) * 100)}%` }}
              />
            </div>
          </div>

          {/* Economic Exposure */}
          <div className="bg-sand-50/70 border border-sand-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-xs text-ink-500 mb-1">
              <span className="font-bold uppercase tracking-wider font-mono">{t('simulator.financialRisk', 'Estimated Financial Risk')}</span>
              <DollarSign className="w-4 h-4 text-ochre-600" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-extrabold font-mono text-ochre-700">
                ${results.economicExposureMillionsUSD} <span className="text-sm font-sans font-medium text-ink-500">M</span>
              </div>
              <p className="text-xs text-ink-500 mt-1">
                {t('simulator.financialRiskDesc', 'Building repairs and business closures')}
              </p>
            </div>
            <div className="w-full bg-sand-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-ochre-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (results.economicExposureMillionsUSD / 80) * 100)}%` }}
              />
            </div>
          </div>

          {/* Crop Yield Shock */}
          <div className="bg-sand-50/70 border border-sand-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-xs text-ink-500 mb-1">
              <span className="font-bold uppercase tracking-wider font-mono">{t('simulator.cropLoss', 'Expected Harvest Loss')}</span>
              <Sprout className="w-4 h-4 text-forest-700" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-extrabold font-mono text-rose-700">
                -{results.cropYieldImpactPct}%
              </div>
              <p className="text-xs text-ink-500 mt-1">
                {t('simulator.cropLossDesc', 'Crop loss across local farms')}
              </p>
            </div>
            <div className="w-full bg-sand-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-rose-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${results.cropYieldImpactPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Recommended Mitigation Directives */}
        <div className="bg-sand-50/90 border border-sand-200 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-900 font-mono">
            <ShieldCheck className="w-4 h-4 text-forest-700" />
            {t('simulator.mitigationHeading', 'Recommended Actions for This Scenario')}
          </div>
          <div className="space-y-1.5">
            {results.mitigationActions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-ink-800 bg-white p-2.5 rounded-xl border border-sand-200 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-forest-700 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
