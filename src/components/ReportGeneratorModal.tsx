import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  Award,
  RefreshCw
} from 'lucide-react';
import { LocationProfile, SensorNode, CriticalAsset, SMEProfile, DepartmentIncident, AuditReportData } from '../types/climate';
import { generateInstitutionalAuditReport } from '../services/api';

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationProfile;
  sensors: SensorNode[];
  assets: CriticalAsset[];
  smeProfiles: SMEProfile[];
  incidents: DepartmentIncident[];
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  isOpen,
  onClose,
  location,
  sensors,
  assets,
  smeProfiles,
  incidents
}) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditReportData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && !report) {
      handleGenerateReport();
    }
  }, [isOpen, location]);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const generated = await generateInstitutionalAuditReport({
        location,
        hazards: {
          primaryRisk: location.primaryRisk,
          vulnerabilityIndex: location.vulnerabilityIndex
        },
        sensors,
        smeProfiles,
        incidents
      });
      if (generated) {
        setReport(generated);
      }
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!report) return;
    const text = `
=== ${report.reportTitle} ===
Document ID: ${report.documentId} | Date: ${report.auditDate}
Risk Rating: ${report.riskRating} | Overall Resilience Index: ${report.overallResilienceIndex}/100

EXECUTIVE SUMMARY:
${report.executiveSummary}

HYDROLOGICAL & METEOROLOGICAL FINDINGS:
${report.meteorologicalAndHydrologicalFindings}

VULNERABLE ASSETS & CRITICAL INFRASTRUCTURE:
${report.vulnerableAssetsAndInfrastructure.map(a => `- ${a}`).join('\n')}

30/60/90-DAY ADAPTATION ROADMAP:
[30 Days]: ${report.thirtySixtyNinetyDayRoadmap.day30.join('; ')}
[60 Days]: ${report.thirtySixtyNinetyDayRoadmap.day60.join('; ')}
[90 Days]: ${report.thirtySixtyNinetyDayRoadmap.day90.join('; ')}

Compliance: ${report.complianceAndFrameworks.join(', ')}
Sign-off: ${report.signOffAuthority}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div id="report-modal-overlay" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Institutional Climate Risk & Resilience Audit Report
              </h3>
              <p className="text-[11px] text-slate-400">
                Automated TCFD & Sendai Framework Compliant Reporting Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {report && (
              <>
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
              <div className="text-sm font-bold text-slate-200">
                Generating Institutional Resilience Audit...
              </div>
              <p className="text-xs text-slate-400 text-center max-w-sm">
                Gemini 3.7 Flash is synthesizing live catchment hydrology, asset vulnerability, and inter-departmental dispatch logs.
              </p>
            </div>
          ) : report ? (
            <div className="space-y-6 printable-report text-xs leading-relaxed">
              {/* Report Header Block */}
              <div className="border-b border-slate-700 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono text-teal-400 font-bold uppercase">
                    DOC ID: {report.documentId} • {report.auditDate}
                  </div>
                  <h1 className="text-xl font-black text-slate-100 mt-0.5">{report.reportTitle}</h1>
                  <p className="text-xs text-slate-400">Target Region: {location.name}, {location.country}</p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block">Resilience Index</span>
                    <span className="text-2xl font-extrabold font-mono text-emerald-400">{report.overallResilienceIndex}/100</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block">Risk Rating</span>
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold uppercase font-mono text-xs border border-red-500/30">
                      {report.riskRating}
                    </span>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400">1. Executive Summary & Threat Profile</h3>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                  {report.executiveSummary}
                </p>
              </div>

              {/* Hydrological & Meteorological Findings */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  2. Hydrological & Climatological Findings
                </h3>
                <p className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">
                  {report.meteorologicalAndHydrologicalFindings}
                </p>
              </div>

              {/* Vulnerable Assets & SME Preparedness */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    3. Critical Assets & High-Risk Facilities
                  </h3>
                  <ul className="space-y-1 text-slate-300">
                    {report.vulnerableAssetsAndInfrastructure.map((asset, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{asset}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    4. Inter-Departmental Coordination Review
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {report.interDepartmentalCoordinationReview}
                  </p>
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    SME Preparedness Benchmark: <strong className="text-emerald-300">{report.smePreparednessIndex}%</strong>
                  </div>
                </div>
              </div>

              {/* 30 / 60 / 90 Day Strategic Adaptation Roadmap */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  5. Actionable 30 / 60 / 90-Day Resilience Roadmap
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-xs font-bold text-teal-400 font-mono">0-30 Days: Immediate</span>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      {report.thirtySixtyNinetyDayRoadmap.day30.map((a, i) => (
                        <li key={i}>• {a}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-xs font-bold text-cyan-400 font-mono">30-60 Days: Tactical</span>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      {report.thirtySixtyNinetyDayRoadmap.day60.map((a, i) => (
                        <li key={i}>• {a}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-xs font-bold text-purple-400 font-mono">60-90 Days: Strategic</span>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      {report.thirtySixtyNinetyDayRoadmap.day90.map((a, i) => (
                        <li key={i}>• {a}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Compliance & Sign-off Block */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-400">
                <div>
                  <span className="font-semibold text-slate-300 block">Framework Standards:</span>
                  <span>{report.complianceAndFrameworks.join(' • ')}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-300 block">Lead Auditor:</span>
                  <span className="text-teal-400 font-medium">{report.signOffAuthority}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Failed to generate audit report. Please try again.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
