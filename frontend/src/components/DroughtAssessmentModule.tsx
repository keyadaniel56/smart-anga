import React, { useState } from 'react';
import { 
  Sun, 
  Droplet, 
  Sprout, 
  AlertCircle, 
  ShieldAlert, 
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { LocationProfile, SensorNode } from '../types/climate';
import { RiskBadge } from './ui/RiskBadge';

interface DroughtAssessmentModuleProps {
  location: LocationProfile;
  sensors: SensorNode[];
  onTriggerAgriculturalAlert?: (details: any) => void;
}

export const DroughtAssessmentModule: React.FC<DroughtAssessmentModuleProps> = ({
  location,
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
    { layer: 'Topsoil (0-7cm)', moisturePct: 12.4, fieldCapacityPct: 35.0, status: 'Critical Deficit', color: '#b91c1c' },
    { layer: 'Crop Root Zone (7-28cm)', moisturePct: 16.8, fieldCapacityPct: 42.0, status: 'Severe Deficit', color: '#d97706' },
    { layer: 'Subsoil Aquifer (28-100cm)', moisturePct: 24.5, fieldCapacityPct: 48.0, status: 'Moderate Depletion', color: '#0f5b5b' }
  ];

  // Crop vulnerability matrix
  const cropVulnerabilities = [
    { crop: 'Winter Wheat & Barley', stage: 'Grain Filling', stressLevel: 'High (34% Loss)', risk: 'high' as const, waterDeficitMm: '62 mm', recommendation: 'Emergency drip pulse irrigation at twilight' },
    { crop: 'Corn / Maize', stage: 'Vegetative Growth', stressLevel: 'Severe (45% Loss)', risk: 'critical' as const, waterDeficitMm: '85 mm', recommendation: 'Apply reflective bio-char mulch to reduce evapotranspiration' },
    { crop: 'Horticultural Greenhouses', stage: 'Active Harvest', stressLevel: 'Moderate (18% Loss)', risk: 'moderate' as const, waterDeficitMm: '30 mm', recommendation: 'Switch to closed-loop nutrient recycled misting' },
    { crop: 'Orchards & Vineyards', stage: 'Bud Break', stressLevel: 'Moderate (22% Loss)', risk: 'moderate' as const, waterDeficitMm: '40 mm', recommendation: 'Deep root injection irrigation to bypass surface evaporation' }
  ];

  return (
    <div id="drought-assessment-container" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white/80 border border-sand-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shadow-xs">
            <Sun className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-ink-900 font-serif">
                Drought Assessment & Agro-Climatic Intelligence
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold tracking-wide border border-amber-200">
                SPEI MATRIX
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-0.5">
              Multi-horizon soil moisture telemetry, reservoir reserves & precision crop mitigation for {location.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RiskBadge
            level="high"
            size="md"
            label="Severe SPEI Drought Deficit (-1.82)"
          />
        </div>
      </div>

      {/* Top Agricultural & Drought Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SPEI Index */}
        <div className="bg-white/80 border border-sand-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-500 mb-1">
            <span className="font-semibold uppercase tracking-wider font-mono">SPEI Drought Index</span>
            <Sun className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-amber-700">
              -1.82
            </span>
            <span className="text-xs text-rose-700 font-semibold font-mono">Severe</span>
          </div>
          <div className="mt-2 text-xs text-ink-600">
            Evapotranspiration: <strong className="text-ink-900 font-mono">+3.4 mm/day</strong>
          </div>
          <div className="w-full bg-sand-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full w-[78%]"></div>
          </div>
        </div>

        {/* Root-Zone Soil Moisture */}
        <div className="bg-white/80 border border-sand-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-500 mb-1">
            <span className="font-semibold uppercase tracking-wider font-mono">Root-Zone Moisture</span>
            <Sprout className="w-4 h-4 text-forest-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-rose-700">
              16.8%
            </span>
            <span className="text-xs text-ink-500 font-mono">/ 42% Opt.</span>
          </div>
          <div className="mt-2 text-xs text-ink-600 flex items-center justify-between">
            <span>Wilting Point: <strong>14.0%</strong></span>
            <span className="text-rose-700 font-bold font-mono">+2.8% Margin</span>
          </div>
          <div className="w-full bg-sand-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-rose-600 h-full rounded-full w-[38%]"></div>
          </div>
        </div>

        {/* Reservoir Capacity */}
        <div className="bg-white/80 border border-sand-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-500 mb-1">
            <span className="font-semibold uppercase tracking-wider font-mono">Reservoir Storage</span>
            <Droplet className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-cyan-800">
              38.5%
            </span>
            <span className="text-xs text-amber-700 font-semibold font-mono">44 Days Reserve</span>
          </div>
          <div className="mt-2 text-xs text-ink-600">
            Water Allocation: <strong className="text-amber-800">{rationingTier} Rationing</strong>
          </div>
          <div className="w-full bg-sand-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-cyan-600 h-full rounded-full w-[38.5%]"></div>
          </div>
        </div>

        {/* Agro-Economic Risk Rating */}
        <div className="bg-white/80 border border-sand-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-ink-500 mb-1">
              <span className="font-semibold uppercase tracking-wider font-mono">Agro-Economic Risk</span>
              <ShieldAlert className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-sm font-bold text-ink-900 mt-1">
              Estimated Loss: <strong className="text-rose-700 font-mono">$18.4M</strong>
            </div>
            <p className="text-xs text-ink-500 mt-0.5">
              Affecting 12,400 Ha arable basin farmland
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            {(['Tier-1', 'Tier-2', 'Tier-3'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setRationingTier(tier)}
                className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  rationingTier === tier ? 'bg-amber-600 text-white shadow-xs' : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
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
        {/* SPEI Chart */}
        <div className="lg:col-span-2 bg-white/90 border border-sand-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-sand-200">
            <div>
              <h3 className="text-base font-bold text-ink-900 font-serif flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-600" />
                Standardized Precipitation-Evapotranspiration Index (SPEI)
              </h3>
              <p className="text-xs text-ink-500 mt-0.5">
                Climatological aridity anomaly track against historical drought baseline (-1.5 = Severe Threshold)
              </p>
            </div>
            <RiskBadge level="high" size="sm" label="Current: -1.82 SPEI" />
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={speiTrendData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e2d6" />
                <XAxis dataKey="month" stroke="#6f7a72" tick={{ fontSize: 11 }} />
                <YAxis domain={[-3, 1]} stroke="#6f7a72" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e2d6', borderRadius: '0.875rem', color: '#191c1a', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <ReferenceLine y={0} stroke="#a8b3ab" strokeDasharray="2 2" label={{ value: 'Normal Baseline (0.0)', fill: '#6f7a72', fontSize: 10 }} />
                <ReferenceLine y={-1.5} stroke="#b91c1c" strokeWidth={1.5} label={{ value: 'Severe Drought Threshold (-1.5)', fill: '#b91c1c', fontSize: 10 }} />
                <Line type="monotone" dataKey="spei" stroke="#d97706" strokeWidth={3} dot={{ fill: '#d97706', r: 4 }} activeDot={{ r: 6 }} name="SPEI Value" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Soil Moisture Stratigraphy */}
        <div className="bg-white/90 border border-sand-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-sand-200">
              <Layers className="w-5 h-5 text-forest-700" />
              <h3 className="text-base font-bold text-ink-900 font-serif">
                Soil Moisture Stratigraphy
              </h3>
            </div>
            <p className="text-xs text-ink-500 mt-2 mb-4">
              Real-time multi-depth agro-probe sensor telemetry across root horizons:
            </p>

            <div className="space-y-3.5">
              {soilLayers.map((layer, idx) => (
                <div key={idx} className="bg-sand-50/80 border border-sand-200 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-ink-900">{layer.layer}</span>
                    <span className="font-mono font-bold" style={{ color: layer.color }}>{layer.moisturePct}% Vol.</span>
                  </div>
                  <div className="w-full bg-sand-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(layer.moisturePct / layer.fieldCapacityPct) * 100}%`, backgroundColor: layer.color }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-ink-500">
                    <span>Field Capacity: {layer.fieldCapacityPct}%</span>
                    <span className="font-medium text-ink-700">{layer.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-sand-200 text-[11px] text-ink-500">
            Automated irrigation optimization active: <strong>Twilight pulsed cycle</strong> saving 32% evaporation.
          </div>
        </div>
      </div>

      {/* Crop Vulnerability & Resilience Matrix */}
      <div className="bg-white/90 border border-sand-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sand-200">
          <div>
            <h3 className="text-base font-bold text-ink-900 font-serif flex items-center gap-2">
              <Sprout className="w-5 h-5 text-forest-700" />
              Regional Crop Vulnerability & Yield Shock Matrix
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">
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
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Dispatch Farm Advisory
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {cropVulnerabilities.map((item, idx) => (
            <div key={idx} className="bg-sand-50/80 border border-sand-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink-900 text-sm font-serif">{item.crop}</span>
                <RiskBadge level={item.risk} size="xs" label={item.stage} />
              </div>
              <div className="flex items-center justify-between text-xs text-ink-700">
                <span>Moisture Deficit: <strong className="text-rose-700 font-mono">{item.waterDeficitMm}</strong></span>
                <span>Impact: <strong className="text-amber-800">{item.stressLevel}</strong></span>
              </div>
              <div className="text-xs text-ink-700 bg-white p-3 rounded-xl border border-sand-200">
                <span className="text-forest-800 font-bold">Action Directive: </span>
                {item.recommendation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
