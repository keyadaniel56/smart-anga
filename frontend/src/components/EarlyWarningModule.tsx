import React, { useState } from 'react';
import { 
  Radio, 
  Megaphone, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  Smartphone, 
  MessageSquare, 
  Tv, 
  Plus,
  Layers,
  Clock
} from 'lucide-react';
import { EarlyWarningAlert, DepartmentIncident } from '../types/climate';
import { RiskBadge } from './ui/RiskBadge';

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
  onUpdateIncidentStatus
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'incident_command' | 'broadcast_studio'>('incident_command');
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
      {/* Top Header with Snap-Scrolling Subtabs on Mobile */}
      <div className="bg-white/80 border border-sand-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-center shadow-xs">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-ink-900 font-serif">
                Community Early Warning & Inter-Agency Command
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-mono font-bold tracking-wide border border-rose-200">
                CAP v1.2 MESH
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-0.5">
              Multi-channel alerting protocols, acoustic siren triggers & departmental incident response
            </p>
          </div>
        </div>

        {/* Mobile-Friendly Snap-Scrolling Subtabs */}
        <div className="flex items-center bg-sand-100 p-1.5 rounded-2xl border border-sand-200 text-xs overflow-x-auto scrollbar-none snap-x snap-mandatory">
          <button
            onClick={() => setActiveSubTab('incident_command')}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all snap-start flex items-center gap-2 ${
              activeSubTab === 'incident_command' 
                ? 'bg-forest-900 text-sand-50 shadow-xs' 
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <span>Incident Command</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
              activeSubTab === 'incident_command' ? 'bg-forest-800 text-teal-300' : 'bg-sand-200 text-ink-700'
            }`}>
              {incidents.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('broadcast_studio')}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all snap-start flex items-center gap-2 ${
              activeSubTab === 'broadcast_studio' 
                ? 'bg-forest-900 text-sand-50 shadow-xs' 
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <span>CAP Broadcast Studio</span>
          </button>
        </div>
      </div>

      {/* Broadcast Studio View */}
      {activeSubTab === 'broadcast_studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dispatch Form */}
          <div className="lg:col-span-2 bg-white/90 border border-sand-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-sand-200">
              <h3 className="text-base font-bold text-ink-900 font-serif flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-rose-700" />
                Issue Emergency Early Warning (Common Alerting Protocol)
              </h3>
              <span className="text-xs text-forest-800 font-mono font-bold">Zero-Latency Sync</span>
            </div>

            {broadcastSuccessMessage && (
              <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>{broadcastSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-ink-700 font-bold mb-1.5">Hazard Category</label>
                  <select
                    value={hazard}
                    onChange={(e) => setHazard(e.target.value as any)}
                    className="w-full bg-sand-50 border border-sand-300 rounded-xl p-2.5 text-ink-900 focus:border-forest-700 focus:outline-none"
                  >
                    <option value="Flood">🌊 Flash Flood / River Inundation</option>
                    <option value="Extreme Heat">🌡️ Extreme Heatwave / WBGT Spike</option>
                    <option value="Drought">☀️ Agricultural Drought Emergency</option>
                    <option value="Flash Storm">⚡ Severe Convective Thunderstorm</option>
                    <option value="Wildfire">🔥 Fire Weather / Wildfire Front</option>
                  </select>
                </div>

                <div>
                  <label className="block text-ink-700 font-bold mb-1.5">Severity Tier</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full bg-sand-50 border border-sand-300 rounded-xl p-2.5 text-ink-900 focus:border-forest-700 focus:outline-none"
                  >
                    <option value="Emergency">🚨 Red Emergency (Immediate Action Required)</option>
                    <option value="Warning">⚠️ Amber Warning (High Confidence Threat)</option>
                    <option value="Watch">👁️ Yellow Watch (Conditions Favorable)</option>
                    <option value="Advisory">ℹ️ Blue Advisory (Public Awareness)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-ink-700 font-bold mb-1.5">Alert Headline / Title</label>
                <input
                  type="text"
                  placeholder="e.g. FLASH INUNDATION RED ALERT: Lower Basalt Basin Evacuation Required"
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  className="w-full bg-sand-50 border border-sand-300 rounded-xl p-2.5 text-ink-900 focus:border-forest-700 focus:outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-ink-700 font-bold mb-1.5">Affected Catchments & Districts</label>
                <input
                  type="text"
                  placeholder="e.g. Valley Reach #4, Riverside SME Hub, Estuary Marsh Sector"
                  value={affectedDistricts}
                  onChange={(e) => setAffectedDistricts(e.target.value)}
                  className="w-full bg-sand-50 border border-sand-300 rounded-xl p-2.5 text-ink-900 focus:border-forest-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-ink-700 font-bold mb-1.5">Public Action Instructions</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Engage commercial flood barriers immediately. Evacuate sub-grade equipment to high ground. Avoid low-elevation bridges."
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  className="w-full bg-sand-50 border border-sand-300 rounded-xl p-2.5 text-ink-900 focus:border-forest-700 focus:outline-none"
                />
              </div>

              {/* Multi-Channel Distribution Selector */}
              <div>
                <label className="block text-ink-700 font-bold mb-2">Automated Multi-Channel Broadcast Selection</label>
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
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                          isSelected 
                            ? 'bg-forest-50 border-forest-300 text-forest-900 shadow-2xs font-bold' 
                            : 'bg-sand-50 border-sand-200 text-ink-600 hover:bg-sand-100'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-forest-800' : 'text-ink-400'}`} />
                        <span className="text-[11px] truncate">{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Broadcast Common Alerting Protocol (CAP) Message
                </button>
              </div>
            </form>
          </div>

          {/* Active Alerts History Feed */}
          <div className="bg-white/90 border border-sand-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-sand-200 flex items-center justify-between">
                <h3 className="text-base font-bold text-ink-900 font-serif">
                  Active Broadcast Ledger
                </h3>
                <span className="text-xs bg-sand-100 text-ink-700 px-2.5 py-0.5 rounded-lg font-mono border border-sand-200">
                  {alerts.length} Active
                </span>
              </div>

              <div className="space-y-3 mt-4 max-h-[440px] overflow-y-auto pr-1">
                {alerts.map((alert) => (
                  <div key={alert.id} className="bg-sand-50/80 border border-sand-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <RiskBadge level={alert.severity} size="xs" label={`${alert.severity} • ${alert.hazard}`} />
                      <span className="text-[10px] font-mono text-ink-400">{alert.id}</span>
                    </div>
                    <div className="font-bold text-ink-900 text-xs leading-tight font-serif">{alert.title}</div>
                    <p className="text-[11px] text-ink-600 line-clamp-2 leading-relaxed">{alert.instruction}</p>
                    <div className="flex items-center justify-between text-[10px] text-ink-500 pt-1.5 border-t border-sand-200 font-mono">
                      <span>Channels: {alert.channelsBroadcasted.join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incident Command Board View */}
      {activeSubTab === 'incident_command' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incident List */}
          <div className="lg:col-span-1 bg-white/90 border border-sand-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-sand-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 font-mono">
                Departmental Dispatch Log
              </h3>
              <span className="text-[10px] text-forest-800 font-mono font-bold bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200">
                LIVE SYNC
              </span>
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {incidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-forest-50/80 border-forest-300 shadow-xs'
                        : 'bg-sand-50/60 border-sand-200 hover:bg-sand-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                      <span className="font-mono text-forest-800 font-bold">{inc.id}</span>
                      <RiskBadge
                        level={inc.severity}
                        size="xs"
                        label={inc.status.replace('_', ' ')}
                      />
                    </div>
                    <div className="font-bold text-ink-900 text-xs leading-snug font-serif">{inc.title}</div>
                    <div className="text-[11px] text-ink-500 mt-1 flex items-center justify-between">
                      <span>{inc.department}</span>
                      <span className="text-[10px] text-ink-400 font-mono">{inc.assignedTo}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Incident Detail & Actions */}
          {selectedIncident && (
            <div className="lg:col-span-2 bg-white/90 border border-sand-200 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sand-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200">
                      {selectedIncident.id}
                    </span>
                    <RiskBadge level={selectedIncident.severity} size="xs" label={`${selectedIncident.severity} Severity`} />
                  </div>
                  <h3 className="text-lg font-bold text-ink-900 font-serif mt-1">{selectedIncident.title}</h3>
                </div>

                {/* Status Toggles */}
                <div className="flex items-center gap-1 bg-sand-100 p-1 rounded-xl border border-sand-200 text-xs self-start sm:self-auto">
                  {(['active', 'in_progress', 'mitigated', 'resolved'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => onUpdateIncidentStatus(selectedIncident.id, st)}
                      className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                        selectedIncident.status === st
                          ? 'bg-forest-900 text-sand-50 shadow-xs'
                          : 'text-ink-600 hover:text-ink-900'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Departmental Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-sand-50/80 p-4 rounded-2xl border border-sand-200">
                <div>
                  <span className="text-ink-400 block text-[10px] font-mono uppercase font-bold">Assigned Department</span>
                  <strong className="text-ink-900">{selectedIncident.department}</strong>
                </div>
                <div>
                  <span className="text-ink-400 block text-[10px] font-mono uppercase font-bold">Responder Unit</span>
                  <strong className="text-ink-900">{selectedIncident.assignedTo}</strong>
                </div>
                <div>
                  <span className="text-ink-400 block text-[10px] font-mono uppercase font-bold">Target Sector</span>
                  <strong className="text-ink-900">{selectedIncident.location}</strong>
                </div>
              </div>

              {/* Actions Taken Audit Trail */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500 font-mono mb-2.5">
                  Inter-Agency Response Protocol Audit Trail
                </h4>
                <div className="space-y-2">
                  {selectedIncident.actionsTaken.map((action, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs bg-sand-50/80 p-3 rounded-xl border border-sand-200">
                      <CheckCircle2 className="w-4 h-4 text-forest-700 flex-shrink-0 mt-0.5" />
                      <span className="text-ink-800 leading-snug">{action}</span>
                    </div>
                  ))}
                </div>

                {/* Add Action Input */}
                <div className="mt-3.5 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Log coordinated response action (e.g. Deployed 3 mobile flood barriers)..."
                    value={newActionInput}
                    onChange={(e) => setNewActionInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddIncidentAction()}
                    className="flex-1 bg-sand-50 border border-sand-300 rounded-xl px-3.5 py-2.5 text-xs text-ink-900 placeholder-ink-400 focus:outline-none focus:border-forest-700"
                  />
                  <button
                    onClick={handleAddIncidentAction}
                    className="px-4 py-2.5 bg-forest-900 hover:bg-forest-800 text-sand-50 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 shadow-sm"
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
