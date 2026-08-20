import React, { useState } from 'react';
import { 
  FlaskConical, 
  Sliders, 
  AlertTriangle, 
  TrendingUp, 
  Building2, 
  Sprout, 
  Droplets, 
  Clock, 
  ShieldCheck
} from 'lucide-react';
import { LocationProfile } from '../types/climate';

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

  return (
    <div id="scenario-simulator-container" className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Climate Stress-Testing & Cascade Simulator
            </h2>
            <p className="text-xs text-slate-400">
              Model compound climate shocks, infrastructure failure cascades, and optimal adaptation ROI
            </p>
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
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
    </div>
  );
};
