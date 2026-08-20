import React, { useState } from 'react';
import { 
  FlaskConical, 
  Sliders, 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  Building2, 
  Sprout, 
  Droplets, 
  Clock, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { LocationProfile, GeminiScenarioSimulation } from '../types/climate';
import { simulateClimateScenario } from '../services/api';

interface ScenarioSimulatorProps {
  location: LocationProfile;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  location
}) => {
  const [precipDelta, setPrecipDelta] = useState<number>(40);
  const [tempDelta, setTempDelta] = useState<number>(2.8);
  const [droughtWeeks, setDroughtWeeks] = useState<number>(4);
  const [riverMultiplier, setRiverMultiplier] = useState<number>(1.8);

  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<GeminiScenarioSimulation | null>(null);

  const presets = [
    {
      name: '2035 100-Yr Flash Inundation',
      precip: 55,
      temp: 1.5,
      drought: 0,
      river: 2.4
    },
    {
      name: 'Severe 8-Week Agricultural Drought',
      precip: -45,
      temp: 3.5,
      drought: 8,
      river: 0.6
    },
    {
      name: 'Compound Heat Dome & Grid Stress',
      precip: -20,
      temp: 4.2,
      drought: 6,
      river: 0.9
    }
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setPrecipDelta(p.precip);
    setTempDelta(p.temp);
    setDroughtWeeks(p.drought);
    setRiverMultiplier(p.river);
  };

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const res = await simulateClimateScenario({
        location: location.name,
        baseline: {
          elevationM: location.elevationM,
          basin: location.riverBasin || 'Regional Basin',
          population: location.population
        },
        precipitationDeltaPct: precipDelta,
        temperatureDeltaC: tempDelta,
        droughtDurationWeeks: droughtWeeks,
        riverLevelMultiplier: riverMultiplier
      });
      if (res) {
        setSimulationResult(res);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="scenario-simulator-container" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              AI Climate Stress-Testing & Cascade Simulator
            </h2>
            <p className="text-xs text-slate-400">
              Model compound climate shocks, infrastructure failure cascades, and optimal adaptation ROI with Gemini 3.7 Flash
            </p>
          </div>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-purple-950/50 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Sparkles className="w-4 h-4 text-purple-200" />
          )}
          <span>{loading ? 'Running Hydro-Climate Engine...' : 'Simulate Climate Shock'}</span>
        </button>
      </div>

      {/* Preset Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-400">Scenario Presets:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleApplyPreset(p)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Interactive Shock Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        {/* Precipitation Anomaly */}
        <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Precipitation Anomaly</span>
            <span className={`font-mono font-bold ${precipDelta > 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
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
            className="w-full accent-cyan-400 bg-slate-800 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>-50% (Drought)</span>
            <span>+100% (Deluge)</span>
          </div>
        </div>

        {/* Temperature Delta */}
        <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Thermal Anomaly</span>
            <span className="font-mono font-bold text-red-400">+{tempDelta.toFixed(1)}°C</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="6.0"
            step="0.1"
            value={tempDelta}
            onChange={(e) => setTempDelta(parseFloat(e.target.value))}
            className="w-full accent-red-500 bg-slate-800 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>+0.5°C</span>
            <span>+6.0°C (Catastrophic)</span>
          </div>
        </div>

        {/* Drought Duration */}
        <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Soil Drought Duration</span>
            <span className="font-mono font-bold text-amber-400">{droughtWeeks} Weeks</span>
          </div>
          <input
            type="range"
            min="0"
            max="16"
            step="1"
            value={droughtWeeks}
            onChange={(e) => setDroughtWeeks(parseInt(e.target.value))}
            className="w-full accent-amber-500 bg-slate-800 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0 Wks</span>
            <span>16 Wks (Severe)</span>
          </div>
        </div>

        {/* River Flow Multiplier */}
        <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">River Peak Multiplier</span>
            <span className="font-mono font-bold text-teal-400">{riverMultiplier.toFixed(1)}x Historical</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.5"
            step="0.1"
            value={riverMultiplier}
            onChange={(e) => setRiverMultiplier(parseFloat(e.target.value))}
            className="w-full accent-teal-400 bg-slate-800 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.5x</span>
            <span>3.5x (Breach)</span>
          </div>
        </div>
      </div>

      {/* Simulation Results View */}
      {simulationResult && (
        <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-5 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">
                Simulated Climate Shock Output
              </span>
              <h3 className="text-lg font-extrabold text-slate-100 mt-0.5">
                {simulationResult.scenarioName}
              </h3>
            </div>
            <span className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 font-bold text-xs uppercase font-mono">
              {simulationResult.simulatedSeverityTier}
            </span>
          </div>

          {/* Key Impact Vectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400">Inundation Area:</span>
              <div className="text-xl font-bold font-mono text-cyan-400">
                {simulationResult.hydroImpacts.floodInundationAreaSqKm} km²
              </div>
              <span className="text-[11px] text-slate-400">Drainage Overload: <strong>{simulationResult.hydroImpacts.drainageOverloadPercentage}%</strong></span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400">Breach Probability:</span>
              <div className="text-xl font-bold font-mono text-red-400">
                {simulationResult.hydroImpacts.breachProbability}%
              </div>
              <span className="text-[11px] text-slate-400">Peak Flow: <strong>{simulationResult.hydroImpacts.peakDischargeCubicMetersSec} m³/s</strong></span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400">Crop Yield Shock:</span>
              <div className="text-xl font-bold font-mono text-amber-400">
                -{simulationResult.agriculturalAndWaterImpacts.cropYieldLossForecastPct}%
              </div>
              <span className="text-[11px] text-slate-400">Reservoir: <strong>{simulationResult.agriculturalAndWaterImpacts.reservoirDepletionDays} Days Reserve</strong></span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400">Total Est. Economic Loss:</span>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {simulationResult.infrastructureAndSMEImpacts.totalEconomicLossEstimateUSD}
              </div>
              <span className="text-[11px] text-slate-400">Road Closures: <strong>{simulationResult.infrastructureAndSMEImpacts.transportRoadClosuresKm} km</strong></span>
            </div>
          </div>

          {/* Critical Cascade Sequence Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Critical Cascade Sequence of Failures
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {simulationResult.criticalCascadeSequence.map((seq, idx) => (
                <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-teal-400 font-mono">{seq.dayOrHour}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase">{seq.severity}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">{seq.event}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Optimal Mitigations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Optimal Interventions & Cost-Benefit Ratio (ROI)
            </h4>
            <div className="divide-y divide-slate-800">
              {simulationResult.optimalEmergencyMitigations.map((mit, i) => (
                <div key={i} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">{mit.domain}</span>
                    <div className="text-slate-200 font-semibold">{mit.action}</div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Timeline: {mit.timeline}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
                      CBR: {mit.costBenefitRatio}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
