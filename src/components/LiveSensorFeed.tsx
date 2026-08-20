import React, { useState } from 'react';
import { 
  Cpu, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Battery, 
  RefreshCw, 
  Sliders, 
  Plus, 
  ShieldCheck,
  Radio
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { SensorNode } from '../types/climate';

interface LiveSensorFeedProps {
  sensors: SensorNode[];
  onAddSensorReading: (sensorId: string, newValue: number) => void;
  onResolveAnomaly: (sensorId: string) => void;
}

export const LiveSensorFeed: React.FC<LiveSensorFeedProps> = ({
  sensors,
  onAddSensorReading,
  onResolveAnomaly
}) => {
  const [selectedSensor, setSelectedSensor] = useState<SensorNode>(sensors[0] || null);
  const [manualInputVal, setManualInputVal] = useState<string>('');
  const [manualErrorWarning, setManualErrorWarning] = useState<string | null>(null);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSensor || !manualInputVal) return;

    const val = parseFloat(manualInputVal);
    if (isNaN(val)) {
      setManualErrorWarning('Invalid numeric value entered.');
      return;
    }

    // Automated entry error validation check
    const [min, max] = selectedSensor.normalRange;
    const extremeUpper = max * 2.5;
    const extremeLower = min < 0 ? min * 2 : min * 0.2;

    if (val > extremeUpper || val < extremeLower) {
      setManualErrorWarning(
        `Automated Anomaly Filter: Value ${val} ${selectedSensor.unit} is outside reasonable physical limits (${extremeLower.toFixed(1)} to ${extremeUpper.toFixed(1)}). Please re-verify gauge.`
      );
      return;
    }

    setManualErrorWarning(null);
    onAddSensorReading(selectedSensor.id, val);
    setManualInputVal('');
  };

  const anomaliesCount = sensors.filter(s => s.isAnomalyDetected || s.status === 'critical').length;

  return (
    <div id="sensor-telemetry-container" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              IoT Sensor Telemetry & Automated Anomaly Detection
            </h2>
            <p className="text-xs text-slate-400">
              Real-time stream gauge, soil moisture, and micro-climate network with error filtering
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 font-mono">
            {sensors.length} Active Nodes
          </span>
          {anomaliesCount > 0 && (
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {anomaliesCount} Anomaly Alerts
            </span>
          )}
        </div>
      </div>

      {/* Sensor Grid & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sensor List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
            <span>Hardware Telemetry Nodes</span>
            <span className="text-[10px] text-teal-400 font-mono">Polling 10s</span>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {sensors.map((sensor) => {
              const isSelected = selectedSensor?.id === sensor.id;
              const isCritical = sensor.status === 'critical';
              const isWarning = sensor.status === 'warning';

              return (
                <div
                  key={sensor.id}
                  onClick={() => {
                    setSelectedSensor(sensor);
                    setManualErrorWarning(null);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-teal-950/60 border-teal-500/70 shadow-md'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-mono text-teal-400 font-bold">{sensor.id}</span>
                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                      isCritical ? 'bg-red-500/20 text-red-300' :
                      isWarning ? 'bg-amber-500/20 text-amber-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {sensor.status}
                    </span>
                  </div>
                  <div className="font-bold text-slate-100 text-xs truncate">{sensor.name}</div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-200">
                      {sensor.currentValue} {sensor.unit}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Battery className="w-3 h-3 text-emerald-400" /> {sensor.batteryPct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Sensor Detailed Graph & Manual Calibration */}
        {selectedSensor && (
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-teal-400 font-bold">{selectedSensor.id}</span>
                  <span className="text-xs text-slate-400">({selectedSensor.locationName})</span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">{selectedSensor.name}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Current Telemetry</span>
                <span className="text-2xl font-extrabold font-mono text-teal-300">
                  {selectedSensor.currentValue} {selectedSensor.unit}
                </span>
              </div>
            </div>

            {/* 24-Hour Telemetry History Chart */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold">24-Hour Continuous Telemetry Stream</span>
                <span>Normal Band: {selectedSensor.normalRange[0]} - {selectedSensor.normalRange[1]} {selectedSensor.unit}</span>
              </div>
              <div className="h-60 w-full bg-slate-950 p-2 rounded-xl border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedSensor.history} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: '#06b6d4', r: 3 }} name={selectedSensor.name} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Manual Calibration & Automated Error Validation Form */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Manual Gauge Logging with Automated Anomaly Filter
                </h4>
                <span className="text-[10px] text-slate-500">Eliminates manual entry errors</span>
              </div>

              {manualErrorWarning && (
                <div className="p-3 bg-amber-950/80 border border-amber-700/60 rounded-xl text-xs text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{manualErrorWarning}</span>
                </div>
              )}

              <form onSubmit={handleManualSubmit} className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder={`Enter reading in ${selectedSensor.unit}...`}
                  value={manualInputVal}
                  onChange={(e) => setManualInputVal(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Validate & Log Telemetry
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
