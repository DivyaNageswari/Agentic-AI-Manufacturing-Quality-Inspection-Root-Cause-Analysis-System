import React, { useState, useMemo } from 'react';
import { SpcCalculationResult } from '../types';
import { SpcChart } from '../components/SpcChart';
import { ImrChart } from '../components/ImrChart';
import { EpistemicBadge } from '../components/EpistemicBadge';
import {
  calculateImrControlChart,
  SAMPLE_INDIVIDUAL_MEASUREMENTS,
} from '../agents/spcEngine';
import {
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Calculator,
  RefreshCw,
  Layers,
  ArrowRight,
  Info,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  spcData: SpcCalculationResult;
  onRecalculate?: (customSubgroups?: number[][]) => void;
}

export const SpcDashboardPage: React.FC<Props> = ({ spcData, onRecalculate }) => {
  const [chartMode, setChartMode] = useState<'imr' | 'xbar_r'>('imr');
  const [selectedSubgroupId, setSelectedSubgroupId] = useState<number | null>(12);

  // Sequential individual measurements state for I-MR Chart
  const [individualMeasurements, setIndividualMeasurements] = useState<number[]>(
    SAMPLE_INDIVIDUAL_MEASUREMENTS
  );
  const [nominal, setNominal] = useState<number>(85.000);
  const [usl, setUsl] = useState<number>(85.015);
  const [lsl, setLsl] = useState<number>(84.985);

  // Compute I-MR chart results
  const imrResult = useMemo(
    () =>
      calculateImrControlChart(
        individualMeasurements,
        nominal,
        usl,
        lsl,
        'Bore Inner Diameter',
        'mm'
      ),
    [individualMeasurements, nominal, usl, lsl]
  );

  const selectedSubgroup =
    spcData.subgroups.find((s) => s.subgroupId === selectedSubgroupId) || spcData.subgroups[0];

  // Helper to test insufficient data constraint (< 10 samples)
  const handleSetSmallSample = () => {
    // Only 5 samples -> insufficient data test
    setIndividualMeasurements([85.001, 85.003, 85.002, 85.004, 85.003]);
  };

  const handleSetFullDataset = () => {
    setIndividualMeasurements(SAMPLE_INDIVIDUAL_MEASUREMENTS);
  };

  const nelsonRulesGuide = [
    {
      rule: 1,
      name: 'One point outside Zone A (>3σ)',
      description:
        'A single point falls outside the upper or lower control limit (UCL/LCL). Indicates an acute special-cause disruption (tool breakage, sudden thermal spike, fixture slip).',
      formula: '|X̄ - CL| > 3σ / √n',
      triggered: spcData.activeViolations.some((v) => v.ruleNumber === 1),
    },
    {
      rule: 2,
      name: 'Nine consecutive points on one side of CL',
      description:
        'Nine points in a row fall strictly above or strictly below the center line. Indicates a sustained mean shift (new raw material lot, tooling offset error, coolant batch change).',
      formula: 'X̄_i > CL for 9 consecutive i',
      triggered: spcData.activeViolations.some((v) => v.ruleNumber === 2),
    },
    {
      rule: 3,
      name: 'Six consecutive points strictly trending',
      description:
        'Six points in a row steadily increasing or steadily decreasing. Strong indicator of continuous tool flank wear, machine warm-up drift, or gradual filter clogging.',
      formula: 'X̄_i > X̄_{i-1} for 6 consecutive i',
      triggered: spcData.activeViolations.some((v) => v.ruleNumber === 3),
    },
    {
      rule: 4,
      name: 'Fourteen points alternating up and down',
      description:
        'Fourteen points alternating direction consecutively. Indicates systematic oscillation between two alternate machine spindles, alternating fixtures, or dual operators.',
      formula: '(X̄_i - X̄_{i-1})(X̄_{i+1} - X̄_i) < 0',
      triggered: spcData.activeViolations.some((v) => v.ruleNumber === 4),
    },
    {
      rule: 5,
      name: 'Two of three points in Zone A (>2σ)',
      description:
        'Two out of three consecutive points fall in the outer 2σ to 3σ zone on the same side. Early warning of process destabilization before Rule 1 triggers.',
      formula: '2 of 3 points with |X̄ - CL| > 2σ / √n',
      triggered: spcData.activeViolations.some((v) => v.ruleNumber === 5),
    },
    {
      rule: 6,
      name: 'Four of five points beyond 1σ (Zone B or beyond)',
      description:
        'Four out of five consecutive points are greater than 1σ from the center line on the same side. Indicates a moderate process shift.',
      formula: '4 of 5 points with |X̄ - CL| > 1σ / √n',
      triggered: spcData.activeViolations.some((v) => v.ruleNumber === 6),
    },
    {
      rule: 7,
      name: 'Fifteen points within Zone C (≤1σ)',
      description:
        'Fifteen consecutive points tightly clustered within 1σ of the center line. Indicates stratification, over-inspection, or data smoothing/fabrication.',
      formula: '15 points with |X̄ - CL| ≤ 1σ / √n',
      triggered: spcData.activeViolations.some((v) => v.ruleNumber === 7),
    },
    {
      rule: 8,
      name: 'Eight points outside Zone C with none in Zone C',
      description:
        'Eight consecutive points on either side of the center line, but none fall within 1σ. Indicates a mixture of two distinct statistical populations.',
      formula: '8 points with |X̄ - CL| > 1σ / √n on either side',
      triggered: spcData.activeViolations.some((v) => v.ruleNumber === 8),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Statistical Process Control (SPC) & Capability Engine
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 font-semibold">
              Deterministic NumPy / SciPy Math Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sequential Individuals / Moving Range (I-MR) charts, X-bar & R-Charts, ASTM E2587 standards, and process capability indices (Cp, Cpk).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <EpistemicBadge type="STATISTICAL_FINDING" size="sm" />
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChartMode('imr')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              chartMode === 'imr'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Individuals & Moving Range (I-MR) Chart</span>
          </button>

          <button
            onClick={() => setChartMode('xbar_r')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              chartMode === 'xbar_r'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Subgroup X̄ & R-Chart (Nelson Rules 1-8)</span>
          </button>
        </div>

        {/* Data Sample Toggle for Testing Insufficient Data constraint */}
        {chartMode === 'imr' && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[11px] text-slate-500 font-sans">Dataset:</span>
            <button
              onClick={handleSetFullDataset}
              className={`px-2 py-1 rounded border text-[11px] ${
                individualMeasurements.length >= 10
                  ? 'bg-slate-900 text-white border-slate-900 font-bold'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              Full Series (N=25)
            </button>
            <button
              onClick={handleSetSmallSample}
              className={`px-2 py-1 rounded border text-[11px] ${
                individualMeasurements.length < 10
                  ? 'bg-amber-600 text-white border-amber-600 font-bold'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
              title="Test insufficient sample constraint (N < 10)"
            >
              Sparse Test (N=5)
            </button>
          </div>
        )}
      </div>

      {/* MODE 1: INDIVIDUALS / MOVING RANGE (I-MR) CHART */}
      {chartMode === 'imr' && (
        <div className="space-y-4">
          {/* Engineering Drawing Specification Input Toolbar */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-slate-800">
                Engineering Specification Limits (Drawing / Voice of Customer):
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <label className="text-slate-600 font-medium">Nominal:</label>
                <input
                  type="number"
                  step="0.001"
                  value={nominal}
                  onChange={(e) => setNominal(parseFloat(e.target.value) || 85.0)}
                  className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs text-slate-900"
                />
                <span className="text-slate-400 font-mono text-[11px]">mm</span>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-purple-700 font-bold">LSL:</label>
                <input
                  type="number"
                  step="0.001"
                  value={lsl}
                  onChange={(e) => setLsl(parseFloat(e.target.value) || 84.985)}
                  className="w-20 px-2 py-1 bg-white border border-purple-300 rounded font-mono text-xs text-purple-900 font-semibold"
                />
                <span className="text-slate-400 font-mono text-[11px]">mm</span>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-purple-700 font-bold">USL:</label>
                <input
                  type="number"
                  step="0.001"
                  value={usl}
                  onChange={(e) => setUsl(parseFloat(e.target.value) || 85.015)}
                  className="w-20 px-2 py-1 bg-white border border-purple-300 rounded font-mono text-xs text-purple-900 font-semibold"
                />
                <span className="text-slate-400 font-mono text-[11px]">mm</span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300">
                <button
                  onClick={() => {
                    setNominal(85.0);
                    setUsl(85.015);
                    setLsl(84.985);
                  }}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[11px] font-mono text-slate-700 cursor-pointer"
                  title="Nominal 85.000 ±0.015 mm (Standard Aerospace Spec)"
                >
                  Aerospace Spec (±0.015)
                </button>
                <button
                  onClick={() => {
                    setNominal(85.0);
                    setUsl(85.008);
                    setLsl(84.992);
                  }}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[11px] font-mono text-slate-700 cursor-pointer"
                  title="Tightened tolerance ±0.008 mm"
                >
                  Tightened (±0.008)
                </button>
                <button
                  onClick={() => {
                    setNominal(85.0);
                    setUsl(85.025);
                    setLsl(84.975);
                  }}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[11px] font-mono text-slate-700 cursor-pointer"
                  title="Relaxed tolerance ±0.025 mm"
                >
                  Relaxed (±0.025)
                </button>
              </div>
            </div>
          </div>

          <ImrChart imrData={imrResult} />
        </div>
      )}

      {/* MODE 2: SUBGROUP X-BAR & R-CHART */}
      {chartMode === 'xbar_r' && (
        <div className="space-y-6">
          <SpcChart
            spcData={spcData}
            onSelectSubgroup={(id) => setSelectedSubgroupId(id)}
          />

          {/* Nelson Rules Catalog & Subgroup Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Nelson Rules Guide (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-semibold text-xs text-slate-800">
                    Nelson & Western Electric Statistical Rules Diagnostic
                  </h3>
                  <p className="text-xs text-slate-500">Automated special-cause variation pattern detectors</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400">8 Rules Evaluated</span>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-[380px] overflow-y-auto pr-1">
                {nelsonRulesGuide.map((r) => (
                  <div
                    key={r.rule}
                    className={`p-3 rounded-lg border text-xs transition-colors ${
                      r.triggered
                        ? 'bg-rose-50/80 border-rose-300 text-rose-950 font-medium'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold flex items-center gap-1.5">
                        {r.triggered ? (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>Rule {r.rule}: {r.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          r.triggered
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {r.triggered ? 'ACTIVE BREACH' : 'CLEARED'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed mb-1.5">
                      {r.description}
                    </p>
                    <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span>Formula: {r.formula}</span>
                      <span>p-value &lt; 0.003</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Subgroup Data Table (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Subgroup Metrology</span>
                  <h3 className="text-sm font-bold text-slate-900 font-mono">
                    Subgroup #{selectedSubgroup.subgroupId} ({selectedSubgroup.timestamp})
                  </h3>
                </div>
                {selectedSubgroup.isOutOfControl && (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                    Out of Control
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded border border-slate-200 text-center text-xs font-mono">
                <div>
                  <div className="text-[10px] text-slate-400">Mean (X̄)</div>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedSubgroup.mean.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Range (R)</div>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedSubgroup.range.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Std Dev (s)</div>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedSubgroup.stdDev.toFixed(4)}</div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Sample Measurements (n=5)
                </span>
                <div className="space-y-1 text-xs font-mono">
                  {selectedSubgroup.samples.map((val, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200"
                    >
                      <span className="text-slate-500">Sample #{idx + 1}:</span>
                      <span className="font-bold text-slate-900">{val.toFixed(4)} mm</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
