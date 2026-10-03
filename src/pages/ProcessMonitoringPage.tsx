import React, { useState, useMemo } from 'react';
import { TelemetryPoint, ProcessAnomalyRecord } from '../types';
import { EpistemicBadge } from '../components/EpistemicBadge';
import {
  generateProcessDataset,
  extractAnomalyRecords,
  ENGINEERING_THRESHOLDS,
} from '../agents/processMonitoringEngine';
import {
  Activity,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Flame,
  Gauge,
  Zap,
  Clock,
  Wrench,
  RotateCcw,
  Sparkles,
  Info,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';

interface Props {
  telemetry?: TelemetryPoint[];
}

export const ProcessMonitoringPage: React.FC<Props> = ({ telemetry: initialTelemetry }) => {
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>(() =>
    initialTelemetry && initialTelemetry.length > 0 ? initialTelemetry : generateProcessDataset()
  );

  const [activeParam, setActiveParam] = useState<keyof typeof ENGINEERING_THRESHOLDS>('machineVibrationMmS');
  const [anomalyFilter, setAnomalyFilter] = useState<'ALL' | 'ANOMALIES_ONLY'>('ALL');
  const [activeTab, setActiveTab] = useState<'trends' | 'table' | 'correlation'>('trends');

  // Compute anomaly records
  const anomalyRecords = useMemo(() => extractAnomalyRecords(telemetry), [telemetry]);

  // Current latest values (last point in stream)
  const latest = telemetry[telemetry.length - 1] || telemetry[0];

  // Simulation controls for all 5 required anomaly detection patterns:
  const handleInjectSuddenAnomaly = () => {
    setTelemetry((prev) => {
      const copy = [...prev];
      const last = { ...copy[copy.length - 1] };
      last.pressureBar = 57.5; // Abrupt hydraulic pressure loss
      last.spindleSpeedRpm = 10750; // Spindle RPM collapse
      last.isAnomaly = true;
      last.anomalyScore = 0.94;
      last.anomalyType = 'SUDDEN_SPIKE';
      last.parametersInvolved = ['Pressure', 'Spindle Speed'];
      last.evidence = '[STATISTICAL_FINDING] Sudden transient anomaly: Acute hydraulic line pressure drop (57.5 bar < critical 58.0 bar) coupled with instantaneous spindle RPM lag.';
      copy[copy.length - 1] = last;
      return copy;
    });
  };

  const handleInjectUnusualCombination = () => {
    setTelemetry((prev) => {
      const copy = [...prev];
      const last = { ...copy[copy.length - 1] };
      last.feedRateMmMin = 405; // Low feed rate
      last.motorCurrentA = 26.4; // High motor current load!
      last.cycleTimeS = 59.8; // Extended cycle time
      last.isAnomaly = true;
      last.anomalyScore = 0.89;
      last.anomalyType = 'UNUSUAL_COMBINATION';
      last.parametersInvolved = ['Feed Rate', 'Motor Current', 'Cycle Time'];
      last.evidence = '[STATISTICAL_FINDING] Unusual parameter combination: Unusually low feed rate (405 mm/min) coinciding with high spindle current (26.4 A) indicates severe chip buildup or galling.';
      copy[copy.length - 1] = last;
      return copy;
    });
  };

  const handleInjectDrift = () => {
    setTelemetry((prev) => {
      return prev.map((p, idx) => {
        if (idx >= 20) {
          const drift = (idx - 20) * 0.75;
          const temp = Number((22.0 + drift).toFixed(2));
          return {
            ...p,
            temperatureC: temp,
            coolantTempC: temp,
            isAnomaly: temp > 25.0,
            anomalyScore: temp > 25.0 ? 0.76 : p.anomalyScore,
            anomalyType: 'GRADUAL_DRIFT',
            parametersInvolved: ['Temperature'],
            evidence: `[STATISTICAL_FINDING] Gradual thermal expansion drift (+${(temp - 22.0).toFixed(1)}°C) detected over consecutive cutting cycles. Clogged coolant chiller.`,
          };
        }
        return p;
      });
    });
  };

  const handleInjectAbnormalVibration = () => {
    setTelemetry((prev) => {
      const copy = [...prev];
      const last = { ...copy[copy.length - 1] };
      last.machineVibrationMmS = 3.85; // Critical vibration spike
      last.motorCurrentA = 25.5;
      last.isAnomaly = true;
      last.anomalyScore = 0.95;
      last.anomalyType = 'ABNORMAL_VIBRATION';
      last.parametersInvolved = ['Machine Vibration', 'Motor Current'];
      last.evidence = '[STATISTICAL_FINDING] Abnormal vibration: Acute cutting chatter harmonic at 3.85 mm/s RMS (breaches ISO 10816-3 Class II critical alarm 3.2 mm/s).';
      copy[copy.length - 1] = last;
      return copy;
    });
  };

  const handleInjectToolOveruse = () => {
    setTelemetry((prev) => {
      const copy = [...prev];
      const last = { ...copy[copy.length - 1] };
      last.toolUsageMinutes = 135; // > 120 min max certified life
      last.motorCurrentA = 26.8;
      last.isAnomaly = true;
      last.anomalyScore = 0.96;
      last.anomalyType = 'TOOL_OVERUSE';
      last.parametersInvolved = ['Tool Usage', 'Motor Current'];
      last.evidence = '[SPECIFICATION_VIOLATION] Abnormal tool usage: Tool in-cut time (135 min) breached certified tool-life limit (120 min). Critical flank wear VB=0.42 mm.';
      copy[copy.length - 1] = last;
      return copy;
    });
  };

  const handleResetNominal = () => {
    setTelemetry(generateProcessDataset());
  };

  // Helper for parameter threshold status
  const getThresholdStatus = (param: keyof typeof ENGINEERING_THRESHOLDS, val: number) => {
    const t = ENGINEERING_THRESHOLDS[param];
    if ('criticalMax' in t && val >= (t as any).criticalMax) return 'CRITICAL';
    if ('criticalMin' in t && val <= (t as any).criticalMin) return 'CRITICAL';
    if ('maxWarning' in t && val >= (t as any).maxWarning) return 'WARNING';
    if ('minWarning' in t && val <= (t as any).minWarning) return 'WARNING';
    return 'NOMINAL';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Process Monitoring & Multivariate Anomaly Detection
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 font-semibold">
              Isolation Forest (Scikit-Learn) + Thresholds
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous real-time telemetry across 8 critical cutting parameters: Temperature, Pressure, RPM, Feed Rate, Vibration, Tool Usage, Cycle Time, and Current.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleInjectSuddenAnomaly}
            className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded shadow-xs transition-colors flex items-center gap-1"
            title="Inject sudden step anomaly (pressure loss & RPM drop)"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>1. Sudden Anomaly</span>
          </button>

          <button
            onClick={handleInjectUnusualCombination}
            className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded shadow-xs transition-colors flex items-center gap-1"
            title="Inject unusual parameter combination (low feed + high current)"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>2. Unusual Combo</span>
          </button>

          <button
            onClick={handleInjectDrift}
            className="px-2.5 py-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded shadow-xs transition-colors flex items-center gap-1"
            title="Inject gradual coolant thermal runaway"
          >
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>3. Gradual Drift</span>
          </button>

          <button
            onClick={handleInjectAbnormalVibration}
            className="px-2.5 py-1 text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded shadow-xs transition-colors flex items-center gap-1"
            title="Inject abnormal vibration (ISO 10816-3 critical alarm 3.85 mm/s)"
          >
            <Activity className="w-3.5 h-3.5 text-orange-600" />
            <span>4. Abnormal Vibration</span>
          </button>

          <button
            onClick={handleInjectToolOveruse}
            className="px-2.5 py-1 text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded shadow-xs transition-colors flex items-center gap-1"
            title="Inject tool usage wear limit breach (> 120 min)"
          >
            <Wrench className="w-3.5 h-3.5 text-purple-600" />
            <span>5. Tool Overuse</span>
          </button>

          <button
            onClick={handleResetNominal}
            className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded shadow-xs transition-colors flex items-center gap-1"
            title="Reset telemetry to nominal steady-state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 8 PARAMETER CARDS (REQUIRED BY PROMPT) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 1. Temperature */}
        {(() => {
          const status = getThresholdStatus('temperatureC', latest.temperatureC);
          return (
            <div
              onClick={() => setActiveParam('temperatureC')}
              className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeParam === 'temperatureC'
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Temperature</span>
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    status === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800'
                      : status === 'WARNING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {status}
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {latest.temperatureC.toFixed(1)} <span className="text-xs font-normal text-slate-500">°C</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Nominal: 22.0°C (Max: 25.0°C)
              </div>
            </div>
          );
        })()}

        {/* 2. Pressure */}
        {(() => {
          const status = getThresholdStatus('pressureBar', latest.pressureBar);
          return (
            <div
              onClick={() => setActiveParam('pressureBar')}
              className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeParam === 'pressureBar'
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-blue-500" />
                  <span>Pressure</span>
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    status === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800'
                      : status === 'WARNING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {status}
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {latest.pressureBar.toFixed(1)} <span className="text-xs font-normal text-slate-500">bar</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Nominal: 70.0 bar (Min: 65.0)
              </div>
            </div>
          );
        })()}

        {/* 3. Spindle Speed */}
        {(() => {
          const status = getThresholdStatus('spindleSpeedRpm', latest.spindleSpeedRpm);
          return (
            <div
              onClick={() => setActiveParam('spindleSpeedRpm')}
              className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeParam === 'spindleSpeedRpm'
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Spindle Speed</span>
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  {status}
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {latest.spindleSpeedRpm} <span className="text-xs font-normal text-slate-500">RPM</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Nominal: 12,000 RPM (±500)
              </div>
            </div>
          );
        })()}

        {/* 4. Feed Rate */}
        {(() => {
          const status = getThresholdStatus('feedRateMmMin', latest.feedRateMmMin);
          return (
            <div
              onClick={() => setActiveParam('feedRateMmMin')}
              className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeParam === 'feedRateMmMin'
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Feed Rate</span>
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    status === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {status}
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {latest.feedRateMmMin} <span className="text-xs font-normal text-slate-500">mm/min</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Nominal: 450 mm/min
              </div>
            </div>
          );
        })()}

        {/* 5. Machine Vibration */}
        {(() => {
          const status = getThresholdStatus('machineVibrationMmS', latest.machineVibrationMmS);
          return (
            <div
              onClick={() => setActiveParam('machineVibrationMmS')}
              className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeParam === 'machineVibrationMmS'
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                  <span>Machine Vibration</span>
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    status === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800 font-bold'
                      : status === 'WARNING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {status}
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {latest.machineVibrationMmS.toFixed(2)} <span className="text-xs font-normal text-slate-500">mm/s</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                ISO 10816 Alarm: 3.2 mm/s
              </div>
            </div>
          );
        })()}

        {/* 6. Tool Usage */}
        {(() => {
          const status = getThresholdStatus('toolUsageMinutes', latest.toolUsageMinutes);
          return (
            <div
              onClick={() => setActiveParam('toolUsageMinutes')}
              className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeParam === 'toolUsageMinutes'
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-purple-600" />
                  <span>Tool Usage</span>
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    status === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800'
                      : status === 'WARNING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {status}
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {latest.toolUsageMinutes} <span className="text-xs font-normal text-slate-500">min</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Tool Life Limit: 120 min max
              </div>
            </div>
          );
        })()}

        {/* 7. Cycle Time */}
        {(() => {
          const status = getThresholdStatus('cycleTimeS', latest.cycleTimeS);
          return (
            <div
              onClick={() => setActiveParam('cycleTimeS')}
              className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeParam === 'cycleTimeS'
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cycle Time</span>
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  {status}
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {latest.cycleTimeS.toFixed(1)} <span className="text-xs font-normal text-slate-500">s</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Takt Target: 52.0 s (±4.0)
              </div>
            </div>
          );
        })()}

        {/* 8. Motor Current */}
        {(() => {
          const status = getThresholdStatus('motorCurrentA', latest.motorCurrentA);
          return (
            <div
              onClick={() => setActiveParam('motorCurrentA')}
              className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                activeParam === 'motorCurrentA'
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Motor Current</span>
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    status === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800'
                      : status === 'WARNING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {status}
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {latest.motorCurrentA.toFixed(1)} <span className="text-xs font-normal text-slate-500">A</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Full-Load Warning: 23.0 A
              </div>
            </div>
          );
        })()}
      </div>

      {/* Tabs Switcher: Trend Charts vs Anomaly Table */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('trends')}
            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'trends'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Telemetry Trend Charts ({ENGINEERING_THRESHOLDS[activeParam].label})</span>
          </button>

          <button
            onClick={() => setActiveTab('table')}
            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'table'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Anomaly Event Ledger ({anomalyRecords.length} Detected)</span>
          </button>
        </div>

        {/* Epistemic Label */}
        <div className="pb-2">
          <EpistemicBadge type="STATISTICAL_FINDING" size="sm" />
        </div>
      </div>

      {/* TAB 1: TREND CHARTS */}
      {activeTab === 'trends' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-xs text-slate-900">
                {ENGINEERING_THRESHOLDS[activeParam].label} Time-Series Trend
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Unit: {ENGINEERING_THRESHOLDS[activeParam].unit} · Nominal: {ENGINEERING_THRESHOLDS[activeParam].nominal} · 40 Frames
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Select Parameter:</span>
              <select
                value={activeParam}
                onChange={(e) => setActiveParam(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1 font-mono text-slate-800"
              >
                {Object.entries(ENGINEERING_THRESHOLDS).map(([key, t]) => (
                  <option key={key} value={key}>
                    {t.label} ({t.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={telemetry} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => typeof v === 'number' ? v.toFixed(1) : v}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const point: TelemetryPoint = payload[0].payload;
                      const val = (point as any)[activeParam];
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded shadow-xl text-xs space-y-1 font-mono border border-slate-700">
                          <div className="font-bold border-b border-slate-800 pb-1 flex justify-between gap-4">
                            <span>{point.timestamp}</span>
                            <span className={point.isAnomaly ? 'text-rose-400' : 'text-emerald-400'}>
                              {point.isAnomaly ? 'ANOMALY DETECTED' : 'NORMAL'}
                            </span>
                          </div>
                          <div>Value: <span className="font-bold text-white">{val} {ENGINEERING_THRESHOLDS[activeParam].unit}</span></div>
                          <div>Isolation Forest Score: <span className="font-bold text-amber-400">{point.anomalyScore}</span></div>
                          {point.anomalyType && (
                            <div className="text-rose-400 text-[11px] font-bold">
                              Type: {point.anomalyType.replace(/_/g, ' ')}
                            </div>
                          )}
                          {point.evidence && (
                            <div className="text-slate-300 text-[10px] mt-1 pt-1 border-t border-slate-800">
                              {point.evidence}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Threshold Reference Lines */}
                {'nominal' in ENGINEERING_THRESHOLDS[activeParam] && (
                  <ReferenceLine
                    y={ENGINEERING_THRESHOLDS[activeParam].nominal}
                    stroke="#0284c7"
                    strokeWidth={1.5}
                    label={{ value: `Nominal (${ENGINEERING_THRESHOLDS[activeParam].nominal})`, fill: '#0284c7', fontSize: 10, position: 'insideTopLeft' }}
                  />
                )}
                {'maxWarning' in ENGINEERING_THRESHOLDS[activeParam] && (
                  <ReferenceLine
                    y={(ENGINEERING_THRESHOLDS[activeParam] as any).maxWarning}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: `Warning (${(ENGINEERING_THRESHOLDS[activeParam] as any).maxWarning})`, fill: '#f59e0b', fontSize: 10, position: 'insideTopLeft' }}
                  />
                )}
                {'criticalMax' in ENGINEERING_THRESHOLDS[activeParam] && (
                  <ReferenceLine
                    y={(ENGINEERING_THRESHOLDS[activeParam] as any).criticalMax}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    strokeWidth={2}
                    label={{ value: `Critical Alarm (${(ENGINEERING_THRESHOLDS[activeParam] as any).criticalMax})`, fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey={activeParam}
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.isAnomaly) {
                      return (
                        <circle
                          key={props.key}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill="#ef4444"
                          stroke="#ffffff"
                          strokeWidth={1.5}
                        />
                      );
                    }
                    return (
                      <circle
                        key={props.key}
                        cx={cx}
                        cy={cy}
                        r={2.5}
                        fill="#0284c7"
                      />
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 2: ANOMALY TABLE */}
      {activeTab === 'table' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Multivariate Anomaly Detection Ledger ({anomalyRecords.length} Events)
              </h3>
              <p className="text-[11px] text-slate-500">
                Scikit-Learn Isolation Forest multidimensional outlier scoring & engineering boundary triggers
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Filter:</span>
              <select
                value={anomalyFilter}
                onChange={(e) => setAnomalyFilter(e.target.value as any)}
                className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-700"
              >
                <option value="ALL">Show All Anomalies ({anomalyRecords.length})</option>
                <option value="ANOMALIES_ONLY">Critical Only</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Anomaly Score</th>
                  <th className="py-3 px-4">Anomaly Type</th>
                  <th className="py-3 px-4">Parameters Involved</th>
                  <th className="py-3 px-4">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {anomalyRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.id}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{item.timestamp}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                      {item.anomalyScore.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-800">
                      {item.anomalyType.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.parametersInvolved.map((p) => (
                          <span
                            key={p}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[10px] font-medium border border-slate-200"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px] font-mono text-slate-700 max-w-sm leading-relaxed">
                      {item.evidence}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
