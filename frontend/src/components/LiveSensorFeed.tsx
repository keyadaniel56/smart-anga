import React, { useState } from 'react';
import { 
  Cpu, 
  Battery, 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
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
import { RiskBadge } from './ui/RiskBadge';
import { useTranslation } from '../context/LanguageContext';

interface LiveSensorFeedProps {
  sensors: SensorNode[];
  onAddSensorReading: (sensorId: string, newValue: number) => void;
  onResolveAnomaly: (sensorId: string) => void;
}

export const LiveSensorFeed: React.FC<LiveSensorFeedProps> = ({
  sensors,
  onAddSensorReading
}) => {
  const { t } = useTranslation();
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
      <div className="bg-surface-800/80 border border-surface-600 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 border border-teal-800/30 text-teal-800 flex items-center justify-center shadow-xs">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-ink-900 font-serif">
                {t('sensors.heading', 'Live Weather & River Sensors')}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-mono font-bold tracking-wide border border-teal-800/30">
                {t('sensors.badge', 'LIVE SENSORS')}
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-0.5">
              {t('sensors.subheading', 'Live readings from river height gauges, soil moisture probes, and weather stations')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-surface-800 text-ink-700 px-3 py-1.5 rounded-xl border border-surface-600 font-mono">
            {sensors.length} {t('sensors.activeNodes', 'Sensors Online')}
          </span>
          {anomaliesCount > 0 && (
            <RiskBadge level="high" size="md" label={`${anomaliesCount} ${t('sensors.anomalyAlerts', 'Unusual Readings')}`} />
          )}
        </div>
      </div>

      {/* Sensor Grid & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sensor List */}
        <div className="bg-surface-700/90 border border-surface-600 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-surface-600 text-xs font-bold text-ink-500 font-mono">
            <span>{t('sensors.listHeading', 'Weather & Water Gauges')}</span>
            <span className="text-[10px] text-forest-600">{t('sensors.pollingInterval', 'Updates every 10s')}</span>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {sensors.map((sensor) => {
              const isSelected = selectedSensor?.id === sensor.id;

              return (
                <div
                  key={sensor.id}
                  onClick={() => {
                    setSelectedSensor(sensor);
                    setManualErrorWarning(null);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-forest-50/80 border-forest-700/40 shadow-xs'
                      : 'bg-surface-800/60 border-surface-600 hover:bg-surface-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1.5">
                    <span className="font-mono text-forest-600 font-bold">{sensor.id}</span>
                    <RiskBadge level={sensor.status} size="xs" label={sensor.status} />
                  </div>
                  <div className="font-bold text-ink-900 text-xs truncate font-serif">{sensor.name}</div>
                  <div className="text-[11px] text-ink-500 mt-1 flex items-center justify-between font-mono">
                    <span className="font-bold text-ink-900">
                      {sensor.currentValue} {sensor.unit}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-ink-300">
                      <Battery className="w-3 h-3 text-forest-600" /> {sensor.batteryPct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Sensor Detail */}
        {selectedSensor && (
          <div className="lg:col-span-2 bg-surface-700/90 border border-surface-600 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-600">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-forest-600 font-bold bg-forest-50 px-2 py-0.5 rounded-md border border-forest-800/30">
                    {selectedSensor.id}
                  </span>
                  <span className="text-xs text-ink-500">({selectedSensor.locationName})</span>
                </div>
                <h3 className="text-lg font-bold text-ink-900 font-serif mt-1">{selectedSensor.name}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-ink-500 block font-mono">{t('sensors.currentReading', 'Latest Reading')}</span>
                <span className="text-2xl font-extrabold font-mono text-forest-600">
                  {selectedSensor.currentValue} <span className="text-xs text-ink-500 font-sans">{selectedSensor.unit}</span>
                </span>
              </div>
            </div>

            {/* 24-Hour Telemetry History Chart */}
            <div>
              <div className="flex items-center justify-between text-xs text-ink-500 mb-2 font-mono">
                <span className="font-semibold">{t('sensors.historyHeading', '24-Hour Reading History')}</span>
                <span>{t('sensors.normalRange', 'Normal')}: {selectedSensor.normalRange[0]} - {selectedSensor.normalRange[1]} {selectedSensor.unit}</span>
              </div>
              <div className="h-60 w-full bg-surface-950/80 p-3 rounded-2xl border border-surface-600">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedSensor.history} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e2d6" />
                    <XAxis dataKey="timestamp" stroke="#6f7a72" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#6f7a72" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e2d6', borderRadius: '0.875rem', color: '#191c1a', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    <Line type="monotone" dataKey="value" stroke="#0f5b5b" strokeWidth={2.5} dot={{ fill: '#0f5b5b', r: 3 }} name={selectedSensor.name} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Manual Calibration Form */}
            <div className="bg-surface-800/80 p-4 sm:p-5 rounded-2xl border border-surface-600 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-900 font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-forest-600" />
                  {t('sensors.manualFormHeading', 'Manual Gauge Reading with Typo Check')}
                </h4>
                <span className="text-[10px] text-ink-300 font-mono">{t('sensors.validationDesc', 'Checks for reasonable numbers')}</span>
              </div>

              {manualErrorWarning && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{manualErrorWarning}</span>
                </div>
              )}

              <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder={`${t('sensors.manualPlaceholder', 'Enter reading in')} ${selectedSensor.unit}...`}
                  value={manualInputVal}
                  onChange={(e) => setManualInputVal(e.target.value)}
                  className="w-full sm:flex-1 bg-surface-700 border border-surface-500 rounded-xl px-3.5 py-2.5 text-xs text-ink-900 placeholder-ink-400 focus:outline-none focus:border-forest-700 font-mono"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2.5 bg-forest-900 hover:bg-forest-800 text-ink-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('sensors.saveReadingBtn', 'Check and Save Reading')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
