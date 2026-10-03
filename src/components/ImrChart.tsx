import React, { useState } from 'react';
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
import { ImrControlChartResult, ImrDataPoint } from '../types';
import { EpistemicBadge } from './EpistemicBadge';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
  Sliders,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  imrData: ImrControlChartResult;
}

export const ImrChart: React.FC<Props> = ({ imrData }) => {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [showSpecLimits, setShowSpecLimits] = useState<boolean>(true);
  const [showControlLimits, setShowControlLimits] = useState<boolean>(true);

  const selectedPoint = selectedPointIndex !== null
    ? imrData.points.find((p) => p.index === selectedPointIndex)
    : imrData.points[imrData.points.length - 1];

  // Formatting for charts
  const yDomainPadding = 0.005;
  const minY = Math.min(imrData.lsl, imrData.lclIndividual, ...imrData.points.map((p) => p.individualValue)) - yDomainPadding;
  const maxY = Math.max(imrData.usl, imrData.uclIndividual, ...imrData.points.map((p) => p.individualValue)) + yDomainPadding;

  const maxMr = Math.max(
    imrData.uclMovingRange,
    ...imrData.points.map((p) => p.movingRange || 0)
  ) * 1.15;

  return (
    <div className="space-y-6">
      {/* Capability & Process Status Header Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Individuals & Moving Range (I-MR) Control Chart
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                Sequential Metrology (ASTM E2587)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoring parameter: <span className="font-semibold text-slate-700">{imrData.parameterName}</span> ({imrData.unit}) · Total Samples: {imrData.totalSamples}
            </p>
          </div>

          {/* Toggle Display Controls */}
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
              <input
                type="checkbox"
                checked={showControlLimits}
                onChange={(e) => setShowControlLimits(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="font-medium text-[11px]">Statistical Limits (LCL/UCL)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
              <input
                type="checkbox"
                checked={showSpecLimits}
                onChange={(e) => setShowSpecLimits(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
              />
              <span className="font-medium text-[11px]">Specification Limits (LSL/USL)</span>
            </label>
          </div>
        </div>

        {/* 4 Key Metric Scorecards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          {/* Cp Card */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-sans">
              <span>Potential Capability (Cp)</span>
              <span className="text-[10px] text-slate-400">Tolerance / 6σ</span>
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {imrData.hasSufficientData && imrData.cp !== null ? imrData.cp.toFixed(3) : 'INSUFFICIENT DATA'}
            </div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">
              {imrData.hasSufficientData ? 'Formula: (USL - LSL) / (6 * σ)' : 'Requires ≥ 10 samples'}
            </div>
          </div>

          {/* Cpk Card */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-sans">
              <span>Process Capability (Cpk)</span>
              <span className="text-[10px] text-slate-400">Centering Penalty</span>
            </div>
            <div
              className={`text-xl font-bold mt-1 ${
                !imrData.hasSufficientData
                  ? 'text-slate-400'
                  : (imrData.cpk || 0) >= 1.33
                  ? 'text-emerald-700'
                  : (imrData.cpk || 0) >= 1.0
                  ? 'text-amber-600'
                  : 'text-rose-700'
              }`}
            >
              {imrData.hasSufficientData && imrData.cpk !== null ? imrData.cpk.toFixed(3) : 'INSUFFICIENT DATA'}
            </div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">
              {imrData.hasSufficientData
                ? `Benchmark: ≥ 1.33 (${imrData.capabilityStatus})`
                : 'Insufficient sample count'}
            </div>
          </div>

          {/* Process Control Status (Statistical) */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
            <div className="text-slate-500 text-[11px] font-sans">Statistical Stability</div>
            <div className="mt-1 flex items-center gap-1.5">
              {imrData.processControlStatus === 'IN_CONTROL' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-emerald-700">IN CONTROL</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-bold text-rose-700">OUT OF CONTROL</span>
                </>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">
              Voice of the Process (3σ)
            </div>
          </div>

          {/* Specification Conformance (Engineering) */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
            <div className="text-slate-500 text-[11px] font-sans">Engineering Specification</div>
            <div className="mt-1 flex items-center gap-1.5">
              {imrData.specificationViolations.length === 0 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-emerald-700">CONFORMING</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-bold text-rose-700">
                    {imrData.specificationViolations.length} NONCONFORMANCES
                  </span>
                </>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">
              Voice of Customer (Drawing Tolerance)
            </div>
          </div>
        </div>

        {/* Legend Explaining Statistical Limits vs Specification Limits */}
        <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-900">
                CRITICAL DISTINCTION: Statistical Control Limits vs. Engineering Specification Limits
              </span>
              <p className="text-[11px] text-blue-800 leading-relaxed mt-0.5">
                <strong>Control Limits (LCL / UCL, blue dashed)</strong> represent the natural 3-sigma voice of the manufacturing process (Mean ± 2.66 × MR-bar). Points outside are <em>statistical special causes</em>.<br />
                <strong>Specification Limits (LSL / USL, purple solid)</strong> represent the customer engineering tolerance. Points outside are <em>engineering nonconformances</em> that must be scrapped or quarantined.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 1. INDIVIDUALS CHART (X Chart) */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              1. Individuals Chart (X) — Sequential Part Diameters
            </h4>
            <span className="text-[10px] font-mono text-slate-500">
              Center Line X̄ = {imrData.mean.toFixed(4)} mm · σ = {imrData.sigma.toFixed(4)} mm
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono">
            {showSpecLimits && (
              <span className="text-purple-700 font-semibold flex items-center gap-1">
                <span className="w-3 h-0.5 bg-purple-600 inline-block"></span>
                <span>USL {imrData.usl.toFixed(3)} / LSL {imrData.lsl.toFixed(3)}</span>
              </span>
            )}
            {showControlLimits && (
              <span className="text-blue-700 font-semibold flex items-center gap-1">
                <span className="w-3 h-0.5 border-t border-dashed border-blue-600 inline-block"></span>
                <span>UCL {imrData.uclIndividual.toFixed(4)} / LCL {imrData.lclIndividual.toFixed(4)}</span>
              </span>
            )}
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={imrData.points}
              margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  setSelectedPointIndex(e.activePayload[0].payload.index);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="sampleId" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis
                domain={[minY, maxY]}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(v) => v.toFixed(3)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data: ImrDataPoint = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded shadow-xl text-xs space-y-1 font-mono border border-slate-700">
                        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex justify-between gap-4">
                          <span>{data.sampleId} ({data.timestamp})</span>
                          <span className={data.isOutOfSpec ? 'text-rose-400' : 'text-emerald-400'}>
                            {data.isOutOfSpec ? 'OUT OF SPEC' : 'CONFORMING'}
                          </span>
                        </div>
                        <div>Measured $X_i$: <span className="font-bold text-white">{data.individualValue.toFixed(4)} mm</span></div>
                        <div>Moving Range ($MR$): {data.movingRange !== null ? `${data.movingRange.toFixed(4)} mm` : 'N/A (First point)'}</div>
                        {data.isOutOfControlIndividual && (
                          <div className="text-amber-400 text-[11px] font-bold">
                            ⚠️ STATISTICAL CONTROL LIMIT BREACH
                          </div>
                        )}
                        {data.isOutOfSpec && (
                          <div className="text-rose-400 text-[11px] font-bold">
                            🚫 ENGINEERING SPECIFICATION VIOLATION (USL: {imrData.usl.toFixed(3)})
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* SPECIFICATION LIMITS (Voice of Customer / Engineering Drawing) */}
              {showSpecLimits && (
                <>
                  <ReferenceLine
                    y={imrData.usl}
                    stroke="#9333ea"
                    strokeWidth={2}
                    label={{ value: `USL (${imrData.usl.toFixed(3)})`, fill: '#9333ea', fontSize: 10, position: 'right' }}
                  />
                  <ReferenceLine
                    y={imrData.lsl}
                    stroke="#9333ea"
                    strokeWidth={2}
                    label={{ value: `LSL (${imrData.lsl.toFixed(3)})`, fill: '#9333ea', fontSize: 10, position: 'right' }}
                  />
                  <ReferenceLine
                    y={imrData.nominal}
                    stroke="#a855f7"
                    strokeDasharray="2 2"
                    strokeWidth={1}
                    label={{ value: `Nominal (${imrData.nominal.toFixed(3)})`, fill: '#a855f7', fontSize: 9, position: 'left' }}
                  />
                </>
              )}

              {/* STATISTICAL CONTROL LIMITS (Voice of Process / 3σ) */}
              {showControlLimits && (
                <>
                  <ReferenceLine
                    y={imrData.uclIndividual}
                    stroke="#2563eb"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: `UCL (${imrData.uclIndividual.toFixed(4)})`, fill: '#2563eb', fontSize: 10, position: 'insideTopLeft' }}
                  />
                  <ReferenceLine
                    y={imrData.centerLineIndividual}
                    stroke="#0284c7"
                    strokeWidth={1.5}
                    label={{ value: `CL X̄ (${imrData.centerLineIndividual.toFixed(4)})`, fill: '#0284c7', fontSize: 10, position: 'insideTopLeft' }}
                  />
                  <ReferenceLine
                    y={imrData.lclIndividual}
                    stroke="#2563eb"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: `LCL (${imrData.lclIndividual.toFixed(4)})`, fill: '#2563eb', fontSize: 10, position: 'insideBottomLeft' }}
                  />
                </>
              )}

              {/* Measurement Line */}
              <Line
                type="monotone"
                dataKey="individualValue"
                stroke="#0f172a"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isSpecFail = payload.isOutOfSpec;
                  const isControlFail = payload.isOutOfControlIndividual;

                  if (isSpecFail) {
                    return (
                      <circle
                        key={props.key}
                        cx={cx}
                        cy={cy}
                        r={5.5}
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    );
                  }
                  if (isControlFail) {
                    return (
                      <circle
                        key={props.key}
                        cx={cx}
                        cy={cy}
                        r={4.5}
                        fill="#f59e0b"
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
                      r={3}
                      fill="#0284c7"
                      stroke="#ffffff"
                      strokeWidth={1}
                    />
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. MOVING RANGE CHART (MR Chart) */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              2. Moving Range Chart (MR) — Point-to-Point Variability
            </h4>
            <span className="text-[10px] font-mono text-slate-500">
              Center Line MR̄ = {imrData.movingRangeMean.toFixed(4)} mm · UCL_mr = {imrData.uclMovingRange.toFixed(4)} mm
            </span>
          </div>

          <span className="text-[10px] font-mono text-slate-400">
            MR_i = |X_i - X_(i-1)|
          </span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={imrData.points}
              margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="sampleId" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis domain={[0, maxMr]} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => v.toFixed(4)} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data: ImrDataPoint = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded shadow text-xs font-mono">
                        <div>{data.sampleId}</div>
                        <div>MR: <span className="font-bold text-emerald-400">{data.movingRange !== null ? `${data.movingRange.toFixed(4)} mm` : 'N/A'}</span></div>
                        {data.isOutOfControlMr && <div className="text-amber-400">⚠️ MR Exceeds UCL_mr</div>}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <ReferenceLine
                y={imrData.uclMovingRange}
                stroke="#dc2626"
                strokeDasharray="4 4"
                label={{ value: `UCL_mr (${imrData.uclMovingRange.toFixed(4)})`, fill: '#dc2626', fontSize: 10, position: 'insideTopLeft' }}
              />
              <ReferenceLine
                y={imrData.centerLineMovingRange}
                stroke="#0d9488"
                strokeWidth={1.5}
                label={{ value: `MR̄ (${imrData.centerLineMovingRange.toFixed(4)})`, fill: '#0d9488', fontSize: 10, position: 'insideTopLeft' }}
              />

              <Line
                type="monotone"
                dataKey="movingRange"
                stroke="#0d9488"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.isOutOfControlMr) {
                    return <circle key={props.key} cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#fff" strokeWidth={1.5} />;
                  }
                  return <circle key={props.key} cx={cx} cy={cy} r={3} fill="#0d9488" />;
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. EPISTEMIC & SPECIFICATION AUDIT LEDGER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Statistical Findings */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-slate-800">Statistical Process Findings</span>
              <span className="text-[10px] font-mono text-slate-500">({imrData.statisticalFindings.length})</span>
            </div>
            <EpistemicBadge type="STATISTICAL_FINDING" size="sm" />
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {imrData.statisticalFindings.length === 0 ? (
              <p className="text-xs text-emerald-700 font-medium py-2">
                ✓ No special cause variation detected. Process is in statistical control.
              </p>
            ) : (
              imrData.statisticalFindings.map((finding, idx) => (
                <div key={idx} className="p-2 rounded bg-amber-50/70 border border-amber-200 text-xs font-mono text-amber-900">
                  {finding}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Specification Violations */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-slate-800">Engineering Specification Violations</span>
              <span className="text-[10px] font-mono text-slate-500">({imrData.specificationViolations.length})</span>
            </div>
            <EpistemicBadge type="OBSERVED_FACT" size="sm" />
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {imrData.specificationViolations.length === 0 ? (
              <p className="text-xs text-emerald-700 font-medium py-2">
                ✓ 100% of measurements are within drawing tolerances (LSL - USL).
              </p>
            ) : (
              imrData.specificationViolations.map((violation, idx) => (
                <div key={idx} className="p-2 rounded bg-rose-50/70 border border-rose-200 text-xs font-mono text-rose-900 font-medium">
                  {violation}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
