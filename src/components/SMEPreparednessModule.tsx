import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  FileText, 
  Layers, 
  Zap, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { SMEProfile, SMEActionPlan, LocationProfile } from '../types/climate';
import { DEFAULT_SME_PROFILES } from '../data/mockClimateData';
import { generateSMEActionPlan } from '../services/api';

interface SMEPreparednessModuleProps {
  location: LocationProfile;
}

export const SMEPreparednessModule: React.FC<SMEPreparednessModuleProps> = ({
  location
}) => {
  const [smeProfiles, setSmeProfiles] = useState<SMEProfile[]>(DEFAULT_SME_PROFILES);
  const [selectedProfile, setSelectedProfile] = useState<SMEProfile>(DEFAULT_SME_PROFILES[0]);
  const [loadingAIPlan, setLoadingAIPlan] = useState(false);
  const [aiActionPlan, setAiActionPlan] = useState<SMEActionPlan | null>(null);

  // Form customizer
  const [customBusinessName, setCustomBusinessName] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [customHeadcount, setCustomHeadcount] = useState('45');

  const handleGenerateCustomPlan = async (profileToUse: SMEProfile) => {
    setLoadingAIPlan(true);
    try {
      const plan = await generateSMEActionPlan({
        businessName: customBusinessName || profileToUse.name,
        industry: customIndustry || profileToUse.industry,
        employeeCount: `${customHeadcount || profileToUse.headcount} employees`,
        location: `${profileToUse.location} (${location.name})`,
        primaryThreats: profileToUse.primaryHazards,
        currentMeasures: {
          hasFloodBarriers: profileToUse.hasFloodBarriers,
          hasBackupGenerator: profileToUse.hasBackupGenerator,
          hasSupplyChainRedundancy: profileToUse.hasSupplyChainRedundancy,
          hasClimateInsurance: profileToUse.hasClimateInsurance
        }
      });
      if (plan) {
        setAiActionPlan(plan);
      }
    } catch (err) {
      console.error('Error creating SME plan:', err);
    } finally {
      setLoadingAIPlan(false);
    }
  };

  const toggleMeasure = (field: keyof SMEProfile) => {
    const updated = {
      ...selectedProfile,
      [field]: !selectedProfile[field]
    };
    setSelectedProfile(updated);
    setSmeProfiles(smeProfiles.map(p => p.id === updated.id ? updated : p));
  };

  return (
    <div id="sme-preparedness-container" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              SME Climate Preparedness & Business Continuity Engine
            </h2>
            <p className="text-xs text-slate-400">
              Diagnostic risk assessment, facility hardening, supply chain buffers, and AI business continuity plans
            </p>
          </div>
        </div>

        <button
          onClick={() => handleGenerateCustomPlan(selectedProfile)}
          disabled={loadingAIPlan}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
        >
          {loadingAIPlan ? (
            <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
          ) : (
            <Sparkles className="w-4 h-4 text-slate-950" />
          )}
          <span>{loadingAIPlan ? 'Synthesizing DRI Action Plan...' : 'Generate AI Resilience Plan'}</span>
        </button>
      </div>

      {/* SME Profile Selector & Facility Diagnostic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SME Presets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
            Select SME Profile Archetype
          </h3>

          <div className="space-y-2">
            {smeProfiles.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProfile(p);
                  setAiActionPlan(null);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedProfile.id === p.id 
                    ? 'bg-emerald-950/50 border-emerald-500/70 shadow-md' 
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>{p.name}</span>
                  <span className="font-mono text-emerald-400">{p.readinessScore}% Score</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{p.industry} • {p.headcount} Staff</div>
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  {p.primaryHazards.map((h, i) => (
                    <span key={i} className="text-[10px] bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Facility Climate Hardening Diagnostic */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100">{selectedProfile.name}</h3>
              <p className="text-xs text-slate-400">{selectedProfile.location} • Facility Elevation: {selectedProfile.facilityElevationM}m</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Readiness Score</span>
              <span className="text-2xl font-extrabold font-mono text-emerald-400">{selectedProfile.readinessScore}/100</span>
            </div>
          </div>

          {/* Interactive Toggleable Readiness Measures */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
              Active Resilience & Business Continuity Controls
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div 
                onClick={() => toggleMeasure('hasFloodBarriers')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  selectedProfile.hasFloodBarriers ? 'bg-teal-950/40 border-teal-500/60' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">Demountable Flood Barriers</div>
                  <div className="text-[11px] text-slate-400">Protects loading docks up to 1.5m head</div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedProfile.hasFloodBarriers}
                  readOnly
                  className="rounded text-teal-500 focus:ring-0"
                />
              </div>

              <div 
                onClick={() => toggleMeasure('hasBackupGenerator')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  selectedProfile.hasBackupGenerator ? 'bg-teal-950/40 border-teal-500/60' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">Backup Emergency Microgrid</div>
                  <div className="text-[11px] text-slate-400">72-Hour diesel & battery UPS support</div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedProfile.hasBackupGenerator}
                  readOnly
                  className="rounded text-teal-500 focus:ring-0"
                />
              </div>

              <div 
                onClick={() => toggleMeasure('hasSupplyChainRedundancy')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  selectedProfile.hasSupplyChainRedundancy ? 'bg-teal-950/40 border-teal-500/60' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">Dual-Sourced Supply Chain</div>
                  <div className="text-[11px] text-slate-400">Alternative suppliers outside hazard zone</div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedProfile.hasSupplyChainRedundancy}
                  readOnly
                  className="rounded text-teal-500 focus:ring-0"
                />
              </div>

              <div 
                onClick={() => toggleMeasure('hasClimateInsurance')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  selectedProfile.hasClimateInsurance ? 'bg-teal-950/40 border-teal-500/60' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">Parametric Climate Insurance</div>
                  <div className="text-[11px] text-slate-400">Pre-triggered payout on 100mm rainfall</div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedProfile.hasClimateInsurance}
                  readOnly
                  className="rounded text-teal-500 focus:ring-0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Generated Action Plan Results */}
      {aiActionPlan && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-slate-100">
                Gemini 3.7 Climate Resilience & Business Continuity Plan
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Readiness Grade:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold text-sm border border-emerald-500/40">
                Grade {aiActionPlan.readinessGrade} ({aiActionPlan.preparednessScore}%)
              </span>
            </div>
          </div>

          {/* Business Impact Analysis (BIA) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[11px]">Est. Daily Downtime Cost:</span>
              <strong className="text-amber-400 text-sm font-mono">{aiActionPlan.businessImpactAnalysis.estimatedDailyDowntimeCost}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Recovery Time Objective (RTO):</span>
              <strong className="text-cyan-300 text-sm font-mono">{aiActionPlan.businessImpactAnalysis.recoveryTimeObjectiveHours} Hours</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Vulnerable Core Assets:</span>
              <strong className="text-slate-200 text-xs">{aiActionPlan.businessImpactAnalysis.vulnerableCriticalAssets.join(', ')}</strong>
            </div>
          </div>

          {/* Priority Checklist */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Tailored Climate Resilience Checklist
            </h4>
            <div className="divide-y divide-slate-800">
              {aiActionPlan.actionChecklist.map((item, idx) => (
                <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">{item.category}</span>
                    <div className="font-semibold text-slate-200">{item.task}</div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      Cost: {item.costTier}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {item.timeline}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      item.priority === 'Urgent' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rapid Response SOP */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
            <span className="text-teal-400 font-bold uppercase tracking-wider text-[11px] block">
              Emergency Level-3 Alert Protocol (SOP):
            </span>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">
              {aiActionPlan.emergencyProtocolSOP}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
