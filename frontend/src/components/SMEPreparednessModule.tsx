import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  FileText, 
  Layers, 
  Zap, 
  ArrowRight
} from 'lucide-react';
import { SMEProfile, LocationProfile } from '../types/climate';
import { DEFAULT_SME_PROFILES } from '../data/mockClimateData';

interface SMEPreparednessModuleProps {
  location: LocationProfile;
}

export const SMEPreparednessModule: React.FC<SMEPreparednessModuleProps> = ({
  location
}) => {
  const [smeProfiles] = useState<SMEProfile[]>(DEFAULT_SME_PROFILES);
  const [selectedProfile, setSelectedProfile] = useState<SMEProfile>(DEFAULT_SME_PROFILES[0]);

  const toggleMeasure = (field: keyof SMEProfile) => {
    const updated = {
      ...selectedProfile,
      [field]: !selectedProfile[field]
    };
    setSelectedProfile(updated);
  };

  return (
    <div id="sme-preparedness-container" className="space-y-6">
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
              Diagnostic risk assessment, facility hardening, supply chain buffers, and business continuity plans
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
            Select SME Profile Archetype
          </h3>

          <div className="space-y-2">
            {smeProfiles.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProfile(p)}
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
    </div>
  );
};
