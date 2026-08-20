import React, { useState } from 'react';
import { 
  Sun, 
  Droplet, 
  Sprout, 
  AlertCircle, 
  TrendingDown, 
  ShieldAlert, 
  Calendar, 
  PieChart, 
  Activity,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { LocationProfile, SensorNode } from '../types/climate';

interface DroughtAssessmentModuleProps {
  location: LocationProfile;
  sensors: SensorNode[];
  onTriggerAgriculturalAlert?: (details: any) => void;
}

export const DroughtAssessmentModule: React.FC<DroughtAssessmentModuleProps> = ({
  location,
  sensors,
  onTriggerAgriculturalAlert
}) => {
  const [rationingTier, setRationingTier] = useState<'Tier-1' | 'Tier-2' | 'Tier-3'>('Tier-2');

  // SPEI 6-month historical & forecast trend data
  const speiTrendData = [
    { month: 'Oct 25', spei: 0.4, status: 'Normal', threshold: -1.5 },
    { month: 'Nov 25', spei: 0.1, status: 'Normal', threshold: -1.5 },
    { month: 'Dec 25', spei: -0.6, status: 'Mild Deficit', threshold: -1.5 },
    { month: 'Jan 26', spei: -1.1, status: 'Moderate Drought', threshold: -1.5 },
    { month: 'Feb 26', spei: -1.4, status: 'Moderate Drought', threshold: -1.5 },
    { month: 'Mar 26 (Now)', spei: -1.82, status: 'Severe Drought', threshold: -1.5 },
    { month: 'Apr 26 (Proj)', spei: -2.1, status: 'Extreme Drought', threshold: -1.5 },
    { month: 'May 26 (Proj)', spei: -1.9, status: 'Severe Drought', threshold: -1.5 },
    { month: 'Jun 26 (Proj)', spei: -1.5, status: 'Severe Drought', threshold: -1.5 }
  ];

  // Soil moisture depth profile
  const soilLayers = [
    { layer: 'Topsoil (0-7cm)', moisturePct: 12.4, fieldCapacityPct: 35.0, status: 'Critical Deficit', color: '#ef4444' },
    { layer: 'Crop Root Zone (7-28cm)', moisturePct: 16.8, fieldCapacityPct: 42.0, status: 'Severe Deficit', color: '#f59e0b' },
    { layer: 'Subsoil Aquifer (28-100cm)', moisturePct: 24.5, fieldCapacityPct: 48.0, status: 'Moderate Depletion', color: '#06b6d4' }
  ];

  // Crop vulnerability matrix
  const cropVulnerabilities = [
    { crop: 'Winter Wheat & Barley', stage: 'Grain Filling', stressLevel: 'High (34% Yield Loss Risk)', waterDeficitMm: '62 mm', recommendation: 'Emergency drip pulse irrigation at twilight' },
    { crop: 'Corn / Maize', stage: 'Vegetative Growth', stressLevel: 'Severe (45% Yield Loss Risk)', waterDeficitMm: '85 mm', recommendation: 'Apply reflective bio-char mulch to reduce evapotranspiration' },
    { crop: 'Horticultural Greenhouses', stage: 'Active Harvest', stressLevel: 'Moderate (18% Risk)', waterDeficitMm: '30 mm', recommendation: 'Switch to closed-loop nutrient recycled misting' },
    { crop: 'Orchards & Vineyards', stage: 'Bud Break', stressLevel: 'Moderate (22% Risk)', waterDeficitMm: '40 mm', recommendation: 'Deep root injection irrigation to bypass surface evaporation' }
  ];

  return (
    <div id="drought-assessment-container" className="space-y-6">
      {/* Top Agricultural & Drought Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SPEI Index */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">SPEI Drought Index (3-Mo)</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-amber-400">
              -1.82
            </span>
            <span className="text-xs text-red-400 font-semibold">Severe Drought</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Evapotranspiration Deficit: <strong className="text-slate-200">+3.4 mm/day</strong>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full w-[78%]"></div>
          </div>
        </div>

        {/* Root-Zone Soil Moisture */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Root-Zone Moisture</span>
            <Sprout className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-red-400">
              16.8%
            </span>
            <span className="text-xs text-slate-400 font-medium">/ 42% Opt.</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Plant Wilting Point: <strong>14.0%</strong></span>
            <span className="text-red-400 font-bold">+2.8% Margin</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-red-500 h-full rounded-full w-[38%]"></div>
          </div>
        </div>

        {/* Municipal & Farm Reservoir Capacity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Reservoir Storage</span>
            <Droplet className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-cyan-400">
              38.5%
            </span>
            <span className="text-xs text-amber-400 font-semibold">44 Days Reserve</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Water Allocation Status: <strong className="text-amber-300">{rationingTier} Rationing</strong>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-cyan-500 h-full rounded-full w-[38.5%]"></div>
          </div>
        </div>

        {/* Agricultural Risk Rating */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider">Agro-Economic Risk</span>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-sm font-bold text-slate-200 mt-1">
              Estimated Crop Value Loss: <strong className="text-red-400">$18.4M</strong>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Affecting 12,400 Ha arable basin farmland
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            {(['Tier-1', 'Tier-2', 'Tier-3'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setRationingTier(tier)}
                className={`flex-1 py-1 text-[11px] font-bold rounded ${
                  rationingTier === tier ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SPEI Drought Trend & Soil Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SPEI 6-Month Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400" />
                Standardized Precipitation-Evapotranspiration Index (SPEI)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Climatological aridity anomaly track against historical drought baseline (-1.5 = Severe Threshold)
              </p>
            </div>
            <span className="text-xs font-mono text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-1 rounded">
              Current: -1.82 SPEI
            </span>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={speiTrendData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis domain={[-3, 1]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px' }} />
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" label={{ value: 'Normal Baseline (0.0)', fill: '#64748b', fontSize: 10 }} />
                <ReferenceLine y={-1.5} stroke="#ef4444" strokeWidth={1.5} label={{ value: 'Severe Drought Boundary (-1.5)', fill: '#ef4444', fontSize: 10 }} />
                <Line type="monotone" dataKey="spei" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 6 }} name="SPEI Value" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Soil Moisture Stratigraphy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Layers className="w-5 h-5 text-teal-400" />
              <h3 className="text-base font-bold text-slate-100">
                Soil Moisture Stratigraphy
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-2 mb-4">
              Real-time multi-depth agro-probe sensor telemetry across root horizons:
            </p>

            <div className="space-y-4">
              {soilLayers.map((layer, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{layer.layer}</span>
                    <span className="font-mono font-bold" style={{ color: layer.color }}>{layer.moisturePct}% Vol.</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(layer.moisturePct / layer.fieldCapacityPct) * 100}%`, backgroundColor: layer.color }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Field Capacity: {layer.fieldCapacityPct}%</span>
                    <span className="font-medium text-slate-300">{layer.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Automated irrigation optimization active: <strong>Twilight pulsed cycle</strong> saving 32% evaporation loss.
          </div>
        </div>
      </div>

      {/* Crop Vulnerability & Resilience Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-400" />
              Regional Crop Vulnerability & Yield Shock Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live phenological stage tracking & precision drought mitigation directives
            </p>
          </div>
          <button
            onClick={() => {
              if (onTriggerAgriculturalAlert) {
                onTriggerAgriculturalAlert({
                  title: 'Agricultural Drought Soil Deficit Advisory Broadcast',
                  hazardType: 'drought',
                  severity: 'high',
                  department: 'Agriculture',
                  assignedTo: 'Agronomy Taskforce & Farm Co-ops'
                });
              }
            }}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Dispatch Farm Advisory
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {cropVulnerabilities.map((item, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-sm">{item.crop}</span>
                <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.stage}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Moisture Deficit: <strong className="text-red-400 font-mono">{item.waterDeficitMm}</strong></span>
                <span>Impact: <strong className="text-amber-400">{item.stressLevel}</strong></span>
              </div>
              <div className="text-xs text-slate-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <span className="text-teal-400 font-bold">Action Directive: </span>
                {item.recommendation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
