import React, { useState } from 'react';
import { 
  Radio, 
  Megaphone, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Building2, 
  Users, 
  Layers, 
  Volume2, 
  Smartphone, 
  MessageSquare, 
  Tv, 
  Plus,
  RefreshCw
} from 'lucide-react';
import { EarlyWarningAlert, DepartmentIncident } from '../types/climate';

interface EarlyWarningModuleProps {
  alerts: EarlyWarningAlert[];
  incidents: DepartmentIncident[];
  onBroadcastAlert: (newAlert: EarlyWarningAlert) => void;
  onUpdateIncidentStatus: (id: string, status: DepartmentIncident['status'], actionText?: string) => void;
  onCreateIncident: (incident: Partial<DepartmentIncident>) => void;
}

export const EarlyWarningModule: React.FC<EarlyWarningModuleProps> = ({
  alerts,
  incidents,
  onBroadcastAlert,
  onUpdateIncidentStatus,
  onCreateIncident
}) => {
  const [activeTab, setActiveTab] = useState<'broadcast_studio' | 'incident_command'>('incident_command');
  const [selectedIncident, setSelectedIncident] = useState<DepartmentIncident | null>(incidents[0] || null);
  const [newActionInput, setNewActionInput] = useState('');

  // New Alert Broadcast Form State
  const [hazard, setHazard] = useState<EarlyWarningAlert['hazard']>('Flood');
  const [severity, setSeverity] = useState<EarlyWarningAlert['severity']>('Warning');
  const [alertTitle, setAlertTitle] = useState('');
  const [headline, setHeadline] = useState('');
  const [instruction, setInstruction] = useState('');
  const [affectedDistricts, setAffectedDistricts] = useState('Riverside Lowlands, Zone 4 SME Park');
  const [selectedChannels, setSelectedChannels] = useState<('Sirens' | 'SMS Cell Broadcast' | 'Mobile Push' | 'WhatsApp Business' | 'EAS Radio')[]>([
    'Sirens', 'SMS Cell Broadcast', 'Mobile Push'
  ]);
  const [broadcastSuccessMessage, setBroadcastSuccessMessage] = useState<string | null>(null);

  const toggleChannel = (channel: 'Sirens' | 'SMS Cell Broadcast' | 'Mobile Push' | 'WhatsApp Business' | 'EAS Radio') => {
    if (selectedChannels.includes(channel)) {
      setSelectedChannels(selectedChannels.filter(c => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim()) return;

    const newAlert: EarlyWarningAlert = {
      id: `EWS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      hazard,
      severity,
      title: alertTitle,
      headline: headline || alertTitle,
      instruction: instruction || 'Seek higher ground and follow municipal emergency directives immediately.',
      affectedDistricts: affectedDistricts.split(',').map(d => d.trim()),
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      channelsBroadcasted: selectedChannels,
      active: true
    };

    onBroadcastAlert(newAlert);
    setBroadcastSuccessMessage(`CAP Early Warning successfully broadcasted via ${selectedChannels.join(', ')}.`);
    setAlertTitle('');
    setHeadline('');
    setInstruction('');
    setTimeout(() => setBroadcastSuccessMessage(null), 5000);
  };

  const handleAddIncidentAction = () => {
    if (!selectedIncident || !newActionInput.trim()) return;
    onUpdateIncidentStatus(selectedIncident.id, selectedIncident.status, newActionInput.trim());
    setNewActionInput('');
  };

  return (
    <div id="early-warning-module-container" className="space-y-6">
      {/* Tab Switcher & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <Radio className="w-5 h-5 text-red-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Community Early Warning & Inter-Departmental Dispatch
            </h2>
            <p className="text-xs text-slate-400">
              CAP v1.2 Protocol, Automated Siren Activation, and Departmental Incident Response
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('incident_command')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'incident_command' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Incident Command Board ({incidents.length})
          </button>
          <button
            onClick={() => setActiveTab('broadcast_studio')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'broadcast_studio' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CAP Broadcast Studio
          </button>
        </div>
      </div>

      {/* Broadcast Studio View */}
      {activeTab === 'broadcast_studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dispatch Form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-red-400" />
                Issue Emergency Early Warning (Common Alerting Protocol)
              </h3>
              <span className="text-xs text-teal-400 font-mono">Zero-Latency Mesh</span>
            </div>

            {broadcastSuccessMessage && (
              <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{broadcastSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hazard Category</label>
                  <select
                    value={hazard}
                    onChange={(e) => setHazard(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="Flood">🌊 Flash Flood / River Inundation</option>
                    <option value="Extreme Heat">🌡️ Extreme Heatwave / Wet-Bulb Spike</option>
                    <option value="Drought">☀️ Agricultural Drought Emergency</option>
                    <option value="Flash Storm">⚡ Severe Convective Thunderstorm</option>
                    <option value="Wildfire">🔥 Fire Weather / Wildfire Front</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Severity Tier</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="Emergency">🚨 Red Emergency (Immediate Action Required)</option>
                    <option value="Warning">⚠️ Amber Warning (High Confidence Threat)</option>
                    <option value="Watch">👁️ Yellow Watch (Conditions Favorable)</option>
                    <option value="Advisory">ℹ️ Blue Advisory (Public Awareness)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Alert Headline / Title</label>
                <input
                  type="text"
                  placeholder="e.g. FLASH INUNDATION RED ALERT: Lower Basalt Basin Evacuation Required"
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-teal-500 focus:outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Affected Sectors & Coordinates</label>
                <input
                  type="text"
                  placeholder="e.g. Valley Reach #4, Riverside SME Hub, Estuary Marsh Sector"
                  value={affectedDistricts}
                  onChange={(e) => setAffectedDistricts(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Public Action Instructions</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Engage commercial flood barriers immediately. Evacuate sub-grade equipment to high ground. Avoid low-elevation bridges."
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Multi-Channel Distribution Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2">Automated Multi-Channel Broadcast Selection</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'Sirens' as const, label: 'Acoustic Siren Array', icon: Volume2 },
                    { id: 'SMS Cell Broadcast' as const, label: 'Cell Broadcast (WEA)', icon: Smartphone },
                    { id: 'Mobile Push' as const, label: 'Mobile App Push', icon: Radio },
                    { id: 'WhatsApp Business' as const, label: 'WhatsApp & SMS Direct', icon: MessageSquare },
                    { id: 'EAS Radio' as const, label: 'EAS Radio / TV Override', icon: Tv }
                  ].map((ch) => {
                    const Icon = ch.icon;
                    const isSelected = selectedChannels.includes(ch.id);
                    return (
                      <button
                        type="button"
                        key={ch.id}
                        onClick={() => toggleChannel(ch.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                          isSelected 
                            ? 'bg-teal-950/60 border-teal-500/80 text-teal-200' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-400' : 'text-slate-500'}`} />
                        <span className="font-medium text-[11px] truncate">{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-900/50 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Broadcast Common Alerting Protocol (CAP) Message Now
                </button>
              </div>
            </form>
          </div>

          {/* Active Alerts History Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-100">
                  Active Broadcast Ledger
                </h3>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {alerts.length} Active
                </span>
              </div>

              <div className="space-y-3 mt-3 max-h-[440px] overflow-y-auto">
                {alerts.map((alert) => (
                  <div key={alert.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        alert.severity === 'Emergency' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        alert.severity === 'Warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                      }`}>
                        {alert.severity} • {alert.hazard}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{alert.id}</span>
                    </div>
                    <div className="font-bold text-slate-200 text-xs leading-tight">{alert.title}</div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{alert.instruction}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                      <span>Channels: {alert.channelsBroadcasted.join(', ')}</span>
                      <span>Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inter-Departmental Incident Command Board */}
      {activeTab === 'incident_command' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incident List */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-200">
                Departmental Incident Dispatch Log
              </h3>
              <span className="text-[10px] text-teal-400 font-mono">Real-Time Sync</span>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedIncident?.id === inc.id
                      ? 'bg-teal-950/60 border-teal-500/70 shadow-md'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-mono text-teal-400 font-bold">{inc.id}</span>
                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                      inc.status === 'active' ? 'bg-red-500/20 text-red-300' :
                      inc.status === 'in_progress' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {inc.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="font-bold text-slate-100 text-xs leading-snug">{inc.title}</div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>{inc.department}</span>
                    <span className="text-[10px] text-slate-500">{inc.assignedTo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incident Detail & Inter-Agency Coordination Workspace */}
          {selectedIncident && (
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-400">{selectedIncident.id}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      selectedIncident.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {selectedIncident.severity} Severity
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mt-1">{selectedIncident.title}</h3>
                </div>

                {/* Status Toggles */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  {(['active', 'in_progress', 'mitigated', 'resolved'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => onUpdateIncidentStatus(selectedIncident.id, st)}
                      className={`px-2.5 py-1 rounded font-bold capitalize transition-all ${
                        selectedIncident.status === st
                          ? 'bg-teal-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Departmental Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px]">Assigned Department:</span>
                  <strong className="text-slate-200">{selectedIncident.department}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Primary Responder Unit:</span>
                  <strong className="text-slate-200">{selectedIncident.assignedTo}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Target Sector:</span>
                  <strong className="text-slate-200">{selectedIncident.location}</strong>
                </div>
              </div>

              {/* Actions Taken Audit Trail (Preventing Manual Errors) */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Inter-Departmental Response Audit Trail & Live Protocol Actions
                </h4>
                <div className="space-y-2">
                  {selectedIncident.actionsTaken.map((action, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 font-medium">{action}</span>
                    </div>
                  ))}
                </div>

                {/* Add Action Input */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Log coordinated inter-agency action (e.g. Deployed 3 sandbag barriers at substation)"
                    value={newActionInput}
                    onChange={(e) => setNewActionInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddIncidentAction()}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                  <button
                    onClick={handleAddIncidentAction}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Log Action
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
