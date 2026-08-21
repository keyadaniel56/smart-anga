import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Info,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  Users
} from 'lucide-react';
import { SMEProfile, LocationProfile } from '../types/climate';
import { DEFAULT_SME_PROFILES } from '../data/mockClimateData';
import { RiskDial } from './ui/RiskDial';
import { RiskBadge } from './ui/RiskBadge';
import { useTranslation } from '../context/LanguageContext';

interface SMEPreparednessModuleProps {
  location: LocationProfile;
}

export const SMEPreparednessModule: React.FC<SMEPreparednessModuleProps> = ({
  location
}) => {
  const { t } = useTranslation();
  const [smeProfiles, setSmeProfiles] = useState<SMEProfile[]>(DEFAULT_SME_PROFILES);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(DEFAULT_SME_PROFILES[0].id);

  const selectedProfile = smeProfiles.find(p => p.id === selectedProfileId) || smeProfiles[0];

  const toggleMeasure = (field: keyof SMEProfile) => {
    setSmeProfiles(prev => prev.map(p => {
      if (p.id === selectedProfile.id) {
        const newVal = !p[field];
        // Calculate updated readiness score locally
        const measures = [
          field === 'hasFloodBarriers' ? newVal : p.hasFloodBarriers,
          field === 'hasBackupGenerator' ? newVal : p.hasBackupGenerator,
          field === 'hasSupplyChainRedundancy' ? newVal : p.hasSupplyChainRedundancy,
          field === 'hasClimateInsurance' ? newVal : p.hasClimateInsurance
        ];
        const activeCount = measures.filter(Boolean).length;
        const newScore = Math.round(35 + (activeCount / 4) * 55);

        return {
          ...p,
          [field]: newVal,
          readinessScore: newScore
        };
      }
      return p;
    }));
  };

  return (
    <div id="sme-preparedness-container" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white/80 border border-sand-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-forest-200 text-forest-800 flex items-center justify-center shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-ink-900 font-serif">
                {t('sme.heading', 'Local Business Disaster Readiness')}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 text-[10px] font-mono font-bold tracking-wide border border-forest-200">
                {t('sme.badge', 'BUSINESS RESILIENCE')}
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-0.5">
              {t('sme.subheading', 'Readiness score, flood barrier setup, and backup power checklists for shops')}
            </p>
          </div>
        </div>

        {/* Clear Unobtrusive Session Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs self-start md:self-auto shadow-2xs">
          <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span className="text-[11px] font-medium">
            <strong className="font-semibold">{t('sme.sessionNoticeTitle', 'Live Checklist Test')}:</strong> {t('sme.sessionNoticeDesc', 'Checking items updates the readiness score in memory for testing.')}
          </span>
        </div>
      </div>

      {/* Main Grid: Profile Archetypes & Selected Business Diagnostic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SME Profiles Selector */}
        <div className="bg-white/80 border border-sand-200 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-sand-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 font-mono">
              {t('sme.profilesHeading', 'Example Local Businesses')}
            </h3>
            <span className="text-[10px] font-mono text-ink-400">{smeProfiles.length} {t('sme.businessesCount', 'Businesses')}</span>
          </div>

          <div className="space-y-2.5">
            {smeProfiles.map((p) => {
              const isSelected = selectedProfile.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProfileId(p.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-forest-50/70 border-forest-300 shadow-xs'
                      : 'bg-sand-50/60 border-sand-200 hover:bg-sand-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-ink-900">
                    <span className="truncate mr-2">{p.name}</span>
                    <RiskBadge
                      level={p.readinessScore >= 70 ? 'low' : p.readinessScore >= 50 ? 'moderate' : 'high'}
                      size="xs"
                      label={`${p.readinessScore}%`}
                    />
                  </div>
                  <div className="text-[11px] text-ink-500 mt-1 flex items-center gap-2">
                    <span>{p.industry}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Users className="w-3 h-3 text-ink-400" /> {p.headcount} {t('sme.staff', 'Staff')}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    {p.primaryHazards.map((h, i) => (
                      <span key={i} className="text-[10px] bg-white text-ink-700 px-2 py-0.5 rounded-md border border-sand-200 font-medium">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected SME Diagnostic Details & Interactive Controls */}
        <div className="lg:col-span-2 bg-white/90 border border-sand-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200">
                  {selectedProfile.id}
                </span>
                <span className="text-xs text-ink-500">{selectedProfile.location}</span>
              </div>
              <h3 className="text-lg font-bold text-ink-900 font-serif mt-1">{selectedProfile.name}</h3>
              <div className="text-xs text-ink-500 mt-0.5 flex items-center gap-3">
                <span>{t('sme.groundElevation', 'Ground Height')}: <strong className="text-ink-900 font-mono">{selectedProfile.facilityElevationM}m</strong></span>
                <span>•</span>
                <span>{t('sme.lastCheck', 'Safety Check')}: <strong className="text-ink-700 font-mono">{selectedProfile.lastAuditDate}</strong></span>
              </div>
            </div>

            {/* RiskDial for SME Readiness Score */}
            <div className="flex items-center gap-3 bg-sand-50 p-2.5 rounded-2xl border border-sand-200 self-start sm:self-auto">
              <RiskDial
                score={selectedProfile.readinessScore}
                size={90}
                label={t('sme.readyDialLabel', 'Ready')}
                invertColor={true}
              />
              <div className="pr-2">
                <div className="text-xs font-bold text-ink-900">{t('sme.readinessScore', 'Readiness Score')}</div>
                <div className="text-[10px] text-ink-500 font-mono">{t('sme.safetyTier', 'Safety Tier 2')}</div>
              </div>
            </div>
          </div>

          {/* Interactive Resilience Controls (Local React State Toggle) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500 font-mono">
                {t('sme.checklistHeading', 'Emergency Protection Checklist (Click to Toggle)')}
              </h4>
              <span className="text-[11px] text-ink-400 font-mono">{t('sme.clickToToggle', 'Click to update score')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Demountable Flood Barriers */}
              <div 
                onClick={() => toggleMeasure('hasFloodBarriers')}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all select-none ${
                  selectedProfile.hasFloodBarriers 
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs' 
                    : 'bg-sand-50/80 border-sand-200 text-ink-600 hover:bg-sand-100'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-ink-900">{t('sme.floodBarriers', 'Moveable Flood Gates')}</div>
                  <div className="text-[11px] text-ink-500 mt-0.5">{t('sme.floodBarriersDesc', 'Protects doors and loading areas from flood water')}</div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedProfile.hasFloodBarriers}
                  readOnly
                  className="w-4 h-4 rounded text-forest-800 accent-forest-700 pointer-events-none"
                />
              </div>

              {/* Backup Emergency Microgrid */}
              <div 
                onClick={() => toggleMeasure('hasBackupGenerator')}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all select-none ${
                  selectedProfile.hasBackupGenerator 
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs' 
                    : 'bg-sand-50/80 border-sand-200 text-ink-600 hover:bg-sand-100'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-ink-900">{t('sme.backupGenerator', 'Backup Emergency Generator')}</div>
                  <div className="text-[11px] text-ink-500 mt-0.5">{t('sme.backupGeneratorDesc', 'Keeps power and refrigeration running during blackouts')}</div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedProfile.hasBackupGenerator}
                  readOnly
                  className="w-4 h-4 rounded text-forest-800 accent-forest-700 pointer-events-none"
                />
              </div>

              {/* Dual-Sourced Supply Chain */}
              <div 
                onClick={() => toggleMeasure('hasSupplyChainRedundancy')}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all select-none ${
                  selectedProfile.hasSupplyChainRedundancy 
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs' 
                    : 'bg-sand-50/80 border-sand-200 text-ink-600 hover:bg-sand-100'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-ink-900">{t('sme.backupSuppliers', 'Backup Product Suppliers')}</div>
                  <div className="text-[11px] text-ink-500 mt-0.5">{t('sme.backupSuppliersDesc', 'Alternative vendors located outside flooded zones')}</div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedProfile.hasSupplyChainRedundancy}
                  readOnly
                  className="w-4 h-4 rounded text-forest-800 accent-forest-700 pointer-events-none"
                />
              </div>

              {/* Parametric Climate Insurance */}
              <div 
                onClick={() => toggleMeasure('hasClimateInsurance')}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all select-none ${
                  selectedProfile.hasClimateInsurance 
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs' 
                    : 'bg-sand-50/80 border-sand-200 text-ink-600 hover:bg-sand-100'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-ink-900">{t('sme.climateInsurance', 'Emergency Flood & Heat Insurance')}</div>
                  <div className="text-[11px] text-ink-500 mt-0.5">{t('sme.climateInsuranceDesc', 'Automatic fast cash payout if heavy rainfall or heat triggers alert')}</div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedProfile.hasClimateInsurance}
                  readOnly
                  className="w-4 h-4 rounded text-forest-800 accent-forest-700 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Continuity Recommendations */}
          <div className="bg-sand-50/80 border border-sand-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-forest-900 uppercase tracking-wider font-mono">
              <Sparkles className="w-4 h-4 text-teal-600" />
              {t('sme.recommendationHeading', 'Recommended Next Steps for Business Safety')}
            </div>
            <p className="text-xs text-ink-700 leading-relaxed">
              {t('sme.recommendationText', 'Keep electrical outlets and valuable equipment at least 1.5 meters above the ground, and arrange a mutual backup plan with nearby shop owners.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
