import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from 'recharts';
import { TelemetryPoint } from '../types';
import { EpistemicBadge } from './EpistemicBadge';
import { Activity, AlertTriangle, ShieldCheck, Thermometer, Gauge, Zap } from 'lucide-react';

interface Props {
  telemetry: TelemetryPoint[];
  lineName?: string;
}

export const ProcessTelemetryChart: React.FC<Props> = ({
  telemetry,
  lineName = 'CNC Line A-1 (Mori Seiki 5-Axis)',
}) => {
  const [selectedSensor, setSelectedSensor] = useState<'all' | 'coolant' | 'vibration' | 'pressure' | 'rpm'>('all');

  const anomalyPoints = telemetry.filter((t) => t.isAnomaly);
  const latestPoint = telemetry[telemetry.length - 1] || telemetry[0];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 text-sm">
              Multivariate Process Monitoring & Sensor Drift Telemetry
            </h3>
            <EpistemicBadge type="STATISTICAL_FINDING" size="sm" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Machine: <span className="font-semibold text-slate-700">{lineName}</span> · 40 Continuous Telemetry Samples (15m intervals)
          </p>
        </div>

        {/* Current Sensor Real-Time Readout Badges */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">
            <span className="text-slate-500 text-[10px] block">COOLANT TEMP</span>
            <span className={`font-bold ${(latestPoint.coolantTempC ?? latestPoint.temperatureC ?? 22.0) > 25 ? 'text-rose-600' : 'text-slate-800'}`}>
              {(latestPoint.coolantTempC ?? latestPoint.temperatureC ?? 22.0).toFixed(1)}°C
            </span>
          </div>
          <div className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">
            <span className="text-slate-500 text-[10px] block">VIBRATION RMS</span>
            <span className={`font-bold ${(latestPoint.vibrationMmS ?? latestPoint.machineVibrationMmS ?? 1.2) > 2.5 ? 'text-rose-600' : 'text-slate-800'}`}>
              {(latestPoint.vibrationMmS ?? latestPoint.machineVibrationMmS ?? 1.2).toFixed(2)} mm/s
            </span>
          </div>
          <div className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">
            <span className="text-slate-500 text-[10px] block">ANOMALY SCORE</span>
            <span className={`font-bold ${latestPoint.anomalyScore > 3.0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {latestPoint.anomalyScore.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-500 font-medium">Channel View:</span>
        <button
          onClick={() => setSelectedSensor('all')}
          className={`px-2.5 py-1 rounded border transition-colors ${
            selectedSensor === 'all'
              ? 'bg-slate-900 text-white border-slate-900 font-semibold'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Synchronized Multi-Channel
        </button>
        <button
          onClick={() => setSelectedSensor('coolant')}
          className={`px-2.5 py-1 rounded border transition-colors ${
            selectedSensor === 'coolant'
              ? 'bg-amber-600 text-white border-amber-700 font-semibold'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Coolant Temp (°C)
        </button>
        <button
          onClick={() => setSelectedSensor('vibration')}
          className={`px-2.5 py-1 rounded border transition-colors ${
            selectedSensor === 'vibration'
              ? 'bg-rose-600 text-white border-rose-700 font-semibold'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Spindle Vibration (mm/s)
        </button>
        <button
          onClick={() => setSelectedSensor('pressure')}
          className={`px-2.5 py-1 rounded border transition-colors ${
            selectedSensor === 'pressure'
              ? 'bg-blue-600 text-white border-blue-700 font-semibold'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Hydraulic Pressure (bar)
        </button>
      </div>

      {/* Recharts Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={telemetry} margin={{ top: 10, right: 25, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as TelemetryPoint;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded shadow-lg text-xs space-y-1 border border-slate-700">
                      <div className="font-semibold text-blue-400">{d.timestamp} UTC</div>
                      <div>Coolant Temp: <span className="font-mono text-amber-300 font-bold">{d.coolantTempC}°C</span> (Spec: 20-22°C)</div>
                      <div>Spindle Vibration: <span className="font-mono text-rose-300 font-bold">{d.vibrationMmS} mm/s</span></div>
                      <div>Hydraulic Pressure: <span className="font-mono text-blue-300 font-bold">{d.hydraulicPressureBar} bar</span></div>
                      <div>Spindle Speed: <span className="font-mono text-slate-200">{d.spindleSpeedRpm} RPM</span></div>
                      <div>Mahalanobis Anomaly Score: <span className="font-mono text-amber-400 font-bold">{d.anomalyScore}</span></div>
                      {d.isAnomaly && d.anomalyReasons && (
                        <div className="pt-1 text-rose-400 border-t border-slate-800">
                          {d.anomalyReasons.join(', ')}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Anomaly Interval Shading */}
            <ReferenceArea
              x1={telemetry[20]?.timestamp}
              x2={telemetry[32]?.timestamp}
              fill="#fee2e2"
              fillOpacity={0.4}
              stroke="#fca5a5"
              strokeDasharray="3 3"
            />

            {(selectedSensor === 'all' || selectedSensor === 'coolant') && (
              <Line
                type="monotone"
                dataKey="coolantTempC"
                name="Coolant Temp (°C)"
                stroke="#d97706"
                strokeWidth={2}
                dot={false}
              />
            )}

            {(selectedSensor === 'all' || selectedSensor === 'vibration') && (
              <Line
                type="monotone"
                dataKey="vibrationMmS"
                name="Vibration (mm/s)"
                stroke="#e11d48"
                strokeWidth={2}
                dot={false}
              />
            )}

            {(selectedSensor === 'all' || selectedSensor === 'pressure') && (
              <Line
                type="monotone"
                dataKey="hydraulicPressureBar"
                name="Hydraulic Pressure (bar)"
                stroke="#2563eb"
                strokeWidth={1.5}
                dot={false}
              />
            )}

            {selectedSensor === 'rpm' && (
              <Line
                type="monotone"
                dataKey="spindleSpeedRpm"
                name="Spindle Speed (RPM)"
                stroke="#059669"
                strokeWidth={2}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Anomaly Detection Diagnostic Breakdown */}
      {anomalyPoints.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1">
          <div className="flex items-center justify-between text-slate-800 font-semibold">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Multivariate Anomaly Agent Diagnostics:</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Mahalanobis Distance with PCA Residual Tracking
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Strong cross-correlation detected between <span className="font-semibold text-amber-700">Coolant Temperature (elevated +6.4°C)</span> and <span className="font-semibold text-rose-700">Spindle Vibration RMS (+2.7 mm/s)</span> between 11:30 and 12:45 UTC. Thermal expansion of the spindle arbor directly accounts for the concurrent out-of-spec bore diameter.
          </p>
        </div>
      )}
    </div>
  );
};
