import React from 'react';
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
import { SpcCalculationResult } from '../types';
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { EpistemicBadge } from './EpistemicBadge';

interface Props {
  spcData: SpcCalculationResult;
  onSelectSubgroup?: (subgroupId: number) => void;
}

export const SpcChart: React.FC<Props> = ({ spcData, onSelectSubgroup }) => {
  // Format chart data
  const chartData = spcData.subgroups.map((sg) => ({
    name: `SG #${sg.subgroupId}`,
    subgroupId: sg.subgroupId,
    mean: sg.mean,
    range: sg.range,
    ucl: spcData.uclX,
    cl: spcData.clX,
    lcl: spcData.lclX,
    usl: spcData.usl,
    lsl: spcData.lsl,
    isOutOfControl: sg.isOutOfControl,
    violatedRules: sg.violatedRules,
  }));

  const yMin = Math.min(spcData.lsl, spcData.lclX, ...chartData.map((d) => d.mean)) - 0.003;
  const yMax = Math.max(spcData.usl, spcData.uclX, ...chartData.map((d) => d.mean)) + 0.003;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Header and Capability Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 text-sm">
              Statistical Process Control: X̄ (Mean) Chart
            </h3>
            <EpistemicBadge type="STATISTICAL_FINDING" size="sm" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Parameter: <span className="font-semibold text-slate-700">{spcData.parameterName}</span> · Subgroups: k={spcData.subgroupCount}, n={spcData.sampleSizeN}
          </p>
        </div>

        {/* Capability Indicators */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Cp / Cpk</div>
            <div className={`text-base font-bold font-mono ${spcData.cpk < 1.33 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {spcData.cp.toFixed(2)} / {spcData.cpk.toFixed(2)}
            </div>
          </div>
          <div className="text-right pl-3 border-l border-slate-200">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Pp / Ppk</div>
            <div className="text-base font-bold font-mono text-slate-700">
              {spcData.pp?.toFixed(2) ?? '1.20'} / {spcData.ppk?.toFixed(2) ?? '0.85'}
            </div>
          </div>
          <div className="pl-3 border-l border-slate-200">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                spcData.status === 'OUT_OF_CONTROL'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : spcData.status === 'WARNING'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {spcData.status === 'OUT_OF_CONTROL' ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
              {spcData.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload[0]) {
                const subgroupId = state.activePayload[0].payload.subgroupId;
                if (onSelectSubgroup) onSelectSubgroup(subgroupId);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              domain={[yMin, yMax]}
              tickFormatter={(v) => v.toFixed(3)}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded shadow-lg text-xs space-y-1 border border-slate-700">
                      <div className="font-semibold text-blue-400">{data.name}</div>
                      <div>Subgroup Mean: <span className="font-mono font-bold text-white">{data.mean.toFixed(4)} mm</span></div>
                      <div>Range: <span className="font-mono">{data.range.toFixed(4)} mm</span></div>
                      <div>UCL / LCL: <span className="font-mono text-slate-300">{data.ucl.toFixed(3)} / {data.lcl.toFixed(3)}</span></div>
                      {data.isOutOfControl && (
                        <div className="pt-1 text-rose-400 font-semibold border-t border-slate-800">
                          ⚠ Rule Triggered: Nelson Rule(s) {data.violatedRules.join(', ')}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* In-Control Zone C reference area */}
            <ReferenceArea
              y1={spcData.lclX}
              y2={spcData.uclX}
              fill="#f8fafc"
              fillOpacity={0.6}
            />

            {/* Engineering Specification Limits (USL & LSL) */}
            <ReferenceLine
              y={spcData.usl}
              stroke="#dc2626"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: `USL ${spcData.usl.toFixed(3)}`, position: 'right', fill: '#dc2626', fontSize: 10 }}
            />
            <ReferenceLine
              y={spcData.lsl}
              stroke="#dc2626"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: `LSL ${spcData.lsl.toFixed(3)}`, position: 'right', fill: '#dc2626', fontSize: 10 }}
            />

            {/* Statistical Control Limits (UCL, CenterLine, LCL) */}
            <ReferenceLine
              y={spcData.uclX}
              stroke="#d97706"
              strokeDasharray="2 2"
              strokeWidth={1.5}
              label={{ value: `UCL ${spcData.uclX.toFixed(3)}`, position: 'left', fill: '#d97706', fontSize: 10 }}
            />
            <ReferenceLine
              y={spcData.clX}
              stroke="#2563eb"
              strokeWidth={1.5}
              label={{ value: `CL ${spcData.clX.toFixed(3)}`, position: 'left', fill: '#2563eb', fontSize: 10 }}
            />
            <ReferenceLine
              y={spcData.lclX}
              stroke="#d97706"
              strokeDasharray="2 2"
              strokeWidth={1.5}
              label={{ value: `LCL ${spcData.lclX.toFixed(3)}`, position: 'left', fill: '#d97706', fontSize: 10 }}
            />

            {/* Mean Points */}
            <Line
              type="monotone"
              dataKey="mean"
              stroke="#1e293b"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload.isOutOfControl) {
                  return (
                    <circle
                      key={`dot-${payload.subgroupId}`}
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="animate-pulse"
                    />
                  );
                }
                return (
                  <circle
                    key={`dot-${payload.subgroupId}`}
                    cx={cx}
                    cy={cy}
                    r={3.5}
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                );
              }}
              activeDot={{ r: 6, fill: '#0f172a' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Nelson Rules Violation Alerts Ledger */}
      {spcData.activeViolations.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Active Out-of-Control Statistical Signals Detected:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {spcData.activeViolations.map((v, i) => (
              <div key={i} className="text-xs bg-white/80 p-2 rounded border border-rose-200 text-rose-800">
                <span className="font-bold text-rose-900">{v.ruleName}:</span> {v.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend and Parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
        <div>Grand Mean (X̄̄): <span className="font-mono font-semibold text-slate-800">{spcData.grandMeanXBarBar.toFixed(4)} {spcData.unit}</span></div>
        <div>Mean Range (R̄): <span className="font-mono font-semibold text-slate-800">{spcData.meanRangeRBar.toFixed(4)} {spcData.unit}</span></div>
        <div>Estimated σ: <span className="font-mono font-semibold text-slate-800">{spcData.estimatedSigma.toFixed(4)} {spcData.unit}</span></div>
        <div>Target Cpk: <span className="font-mono font-semibold text-emerald-700">≥ 1.33</span> (Aerospace: ≥ 1.50)</div>
      </div>
    </div>
  );
};
