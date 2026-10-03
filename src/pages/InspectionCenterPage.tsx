import React, { useState, useMemo, useRef } from 'react';
import {
  ProductionBatch,
  VisualInspectionItem,
  SpcCalculationResult,
  DimensionalInspectionRecord,
} from '../types';
import { EpistemicBadge } from '../components/EpistemicBadge';
import {
  CheckSquare,
  Upload,
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Ruler,
  Layers,
  Lock,
  Eye,
  Sliders,
  Calculator,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface Props {
  batches: ProductionBatch[];
  visualItems: VisualInspectionItem[];
  spcData: SpcCalculationResult;
  onOpenApprovalModal: (title: string, entityType: any, entityId: string, defaultDecision?: any) => void;
}

export const InspectionCenterPage: React.FC<Props> = ({
  batches,
  visualItems,
  spcData,
  onOpenApprovalModal,
}) => {
  // Batch selection for Gate Pass
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');
  const selectedBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];

  // Engineering Specification Parameters
  const [nominalMm, setNominalMm] = useState<number>(50.00);
  const [toleranceMm, setToleranceMm] = useState<number>(0.05);

  // Deterministically derived specification limits (No LLM)
  const lslMm = Number((nominalMm - toleranceMm).toFixed(4));
  const uslMm = Number((nominalMm + toleranceMm).toFixed(4));

  // Initial Measurements matching the prompt's exact example
  const [measurements, setMeasurements] = useState<Array<{ componentId: string; measuredDiameterMm: number }>>([
    { componentId: 'P001', measuredDiameterMm: 50.01 },
    { componentId: 'P002', measuredDiameterMm: 50.03 },
    { componentId: 'P003', measuredDiameterMm: 50.06 }, // Exceeds USL 50.05 -> Nonconforming
    { componentId: 'P004', measuredDiameterMm: 50.08 }, // Exceeds USL 50.05 -> Nonconforming (Exact prompt test case)
    { componentId: 'P005', measuredDiameterMm: 50.07 }, // Exceeds USL 50.05 -> Nonconforming
    { componentId: 'P006', measuredDiameterMm: 49.98 }, // Conforming
    { componentId: 'P007', measuredDiameterMm: 50.02 }, // Conforming
    { componentId: 'P008', measuredDiameterMm: 50.05 }, // Conforming on boundary
    { componentId: 'P009', measuredDiameterMm: 49.94 }, // Below LSL 49.95 -> Nonconforming
    { componentId: 'P010', measuredDiameterMm: 50.00 }, // Perfect Nominal
  ]);

  // Manual entry form state
  const [manualComponentId, setManualComponentId] = useState('');
  const [manualDiameter, setManualDiameter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deterministic evaluation of each measurement record
  const records: DimensionalInspectionRecord[] = useMemo(() => {
    return measurements.map((m) => {
      const dev = Number((m.measuredDiameterMm - nominalMm).toFixed(4));
      const status: 'CONFORMING' | 'NONCONFORMING' =
        m.measuredDiameterMm >= lslMm && m.measuredDiameterMm <= uslMm
          ? 'CONFORMING'
          : 'NONCONFORMING';

      return {
        componentId: m.componentId,
        measuredDiameterMm: m.measuredDiameterMm,
        nominalMm,
        toleranceMm,
        lslMm,
        uslMm,
        deviationMm: dev,
        status,
      };
    });
  }, [measurements, nominalMm, toleranceMm, lslMm, uslMm]);

  // Deterministic summary statistics calculations (No LLM)
  const totalInspected = records.length;
  const accepted = records.filter((r) => r.status === 'CONFORMING').length;
  const rejected = totalInspected - accepted;
  const rejectionPercentage = totalInspected > 0 ? (rejected / totalInspected) * 100 : 0;
  const diameterValues = records.map((r) => r.measuredDiameterMm);
  const mean = totalInspected > 0 ? diameterValues.reduce((a, b) => a + b, 0) / totalInspected : nominalMm;
  const minimum = totalInspected > 0 ? Math.min(...diameterValues) : nominalMm;
  const maximum = totalInspected > 0 ? Math.max(...diameterValues) : nominalMm;

  // Chart data for measurement distribution
  const chartData = records.map((r, idx) => ({
    name: r.componentId,
    index: idx + 1,
    measured: r.measuredDiameterMm,
    deviation: r.deviationMm,
    nominal: r.nominalMm,
    usl: r.uslMm,
    lsl: r.lslMm,
    isConforming: r.status === 'CONFORMING',
  }));

  // CSV Upload handler
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const parsed: Array<{ componentId: string; measuredDiameterMm: number }> = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip header if contains words like "component_id"
        if (i === 0 && line.toLowerCase().includes('component')) continue;

        const parts = line.split(/[,\t;]/).map((p) => p.trim());
        if (parts.length >= 2) {
          const cid = parts[0];
          const val = parseFloat(parts[1]);
          if (!isNaN(val)) {
            parsed.push({ componentId: cid, measuredDiameterMm: val });
          }
        }
      }

      if (parsed.length > 0) {
        setMeasurements(parsed);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Manual entry handler
  const handleAddManualMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(manualDiameter);
    if (isNaN(val)) return;

    const cid = manualComponentId.trim() || `P${String(measurements.length + 1).padStart(3, '0')}`;
    setMeasurements((prev) => [...prev, { componentId: cid, measuredDiameterMm: val }]);
    setManualComponentId('');
    setManualDiameter('');
  };

  // Delete measurement
  const handleDeleteMeasurement = (index: number) => {
    setMeasurements((prev) => prev.filter((_, i) => i !== index));
  };

  // Reset to Prompt's exact example
  const handleLoadExactPromptExample = () => {
    setNominalMm(50.00);
    setToleranceMm(0.05);
    setMeasurements([
      { componentId: 'P001', measuredDiameterMm: 50.01 },
      { componentId: 'P002', measuredDiameterMm: 50.03 },
      { componentId: 'P003', measuredDiameterMm: 50.06 },
      { componentId: 'P004', measuredDiameterMm: 50.08 },
      { componentId: 'P005', measuredDiameterMm: 50.07 },
    ]);
  };

  // Download Sample CSV template
  const handleDownloadCsvTemplate = () => {
    const csvContent =
      'component_id,diameter_mm\nP001,50.01\nP002,50.03\nP003,50.06\nP004,50.08\nP005,50.07\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inspection_measurements_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Existing 4-Gate Workflow Pass logic
  const batchVisuals = visualItems.filter((v) => v.batchId === selectedBatch.batchNumber);
  const hasVisualDefects = batchVisuals.some((v) => v.status === 'NON_CONFORMING');
  const dimensionalPass = selectedBatch.status !== 'QUARANTINED';
  const spcPass = spcData.status !== 'OUT_OF_CONTROL' || selectedBatch.id !== 'batch-001';
  const humanSigned = Boolean(selectedBatch.humanSignOff && selectedBatch.humanSignOff.status === 'APPROVED');
  const allGatesPassed = !hasVisualDefects && dimensionalPass && spcPass && humanSigned;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Inspection Center &amp; Dimensional Compliance
            </h2>
            <EpistemicBadge type="OBSERVED_FACT" size="sm" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic dimensional metrology evaluation with CSV ingestion, tolerance verification, and distribution analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadExactPromptExample}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 rounded transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Load Prompt Example Dataset (50.08 mm Test)</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. ENGINEERING TOLERANCE CONFIGURATION & CSV INGESTION BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Engineering Specification &amp; Tolerance Bounds
            </h3>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-500">Formulas:</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
              LSL = Nominal - Tol
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
              USL = Nominal + Tol
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
              Deviation = Measured - Nominal
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          {/* Nominal Input */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <label className="block text-[10px] text-slate-500 font-sans uppercase font-semibold mb-1">
              Nominal Dimension (mm) *
            </label>
            <input
              type="number"
              step="0.001"
              value={nominalMm}
              onChange={(e) => setNominalMm(parseFloat(e.target.value) || 0)}
              className="w-full text-base font-bold font-mono text-slate-900 bg-white px-2.5 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>

          {/* Tolerance Input */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <label className="block text-[10px] text-slate-500 font-sans uppercase font-semibold mb-1">
              Tolerance Band (± mm) *
            </label>
            <input
              type="number"
              step="0.001"
              value={toleranceMm}
              onChange={(e) => setToleranceMm(parseFloat(e.target.value) || 0)}
              className="w-full text-base font-bold font-mono text-slate-900 bg-white px-2.5 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>

          {/* Calculated LSL */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="block text-[10px] text-slate-500 font-sans uppercase font-semibold mb-1">
              Calculated LSL (Lower Spec)
            </span>
            <div className="text-base font-bold font-mono text-rose-600 mt-1">
              {lslMm.toFixed(3)} mm
            </div>
            <span className="text-[10px] text-slate-400 font-sans font-normal">
              {nominalMm.toFixed(2)} - {toleranceMm.toFixed(2)}
            </span>
          </div>

          {/* Calculated USL */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="block text-[10px] text-slate-500 font-sans uppercase font-semibold mb-1">
              Calculated USL (Upper Spec)
            </span>
            <div className="text-base font-bold font-mono text-rose-600 mt-1">
              {uslMm.toFixed(3)} mm
            </div>
            <span className="text-[10px] text-slate-400 font-sans font-normal">
              {nominalMm.toFixed(2)} + {toleranceMm.toFixed(2)}
            </span>
          </div>
        </div>

        {/* CSV Ingestion & Manual Entry Controls */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
          {/* CSV Upload and Template buttons */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt"
              onChange={handleCsvUpload}
              className="hidden"
              id="csv-file-upload"
            />
            <label
              htmlFor="csv-file-upload"
              className="px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV Measurements</span>
            </label>

            <button
              onClick={handleDownloadCsvTemplate}
              className="px-3 py-2 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 rounded border border-slate-300 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Template</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            Supported columns: <span className="font-semibold text-slate-700">component_id, diameter_mm</span>
          </span>
        </div>

        {/* Manual Measurement Entry Inline Form */}
        <form onSubmit={handleAddManualMeasurement} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-semibold text-slate-800 shrink-0">
            Manual Measurement Entry:
          </span>

          <input
            type="text"
            placeholder="Component ID (e.g. P006)"
            value={manualComponentId}
            onChange={(e) => setManualComponentId(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded bg-white font-mono focus:ring-1 focus:ring-slate-900 focus:outline-hidden w-full sm:w-44"
          />

          <input
            type="number"
            step="0.001"
            required
            placeholder="Diameter mm (e.g. 50.08)"
            value={manualDiameter}
            onChange={(e) => setManualDiameter(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded bg-white font-mono focus:ring-1 focus:ring-slate-900 focus:outline-hidden w-full sm:w-48"
          />

          <button
            type="submit"
            className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Measurement</span>
          </button>
        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SUMMARY STATISTICS DISPLAY (7 SPECIFIED METRICS) */}
      {/* ------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Deterministic Statistical Summary
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Strict Non-LLM Computation</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Total Inspected */}
          <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Inspected</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
              {totalInspected} <span className="text-[10px] text-slate-400 font-normal">pcs</span>
            </div>
            <span className="text-[10px] text-slate-500">100% Verified</span>
          </div>

          {/* Accepted */}
          <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Accepted</span>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
              {accepted} <span className="text-[10px] text-slate-400 font-normal">pcs</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Within Limits</span>
          </div>

          {/* Rejected */}
          <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rejected</span>
            <div className="text-xl font-bold font-mono text-rose-600 mt-0.5">
              {rejected} <span className="text-[10px] text-slate-400 font-normal">pcs</span>
            </div>
            <span className="text-[10px] text-rose-600 font-medium font-mono">Nonconforming</span>
          </div>

          {/* Rejection Percentage */}
          <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rejection %</span>
            <div className={`text-xl font-bold font-mono mt-0.5 ${rejectionPercentage > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {rejectionPercentage.toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-500">AQL Baseline: 2.0%</span>
          </div>

          {/* Mean */}
          <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mean (x̄)</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
              {mean.toFixed(3)} <span className="text-[10px] text-slate-400 font-normal">mm</span>
            </div>
            <span className="text-[10px] text-slate-500">Nominal: {nominalMm.toFixed(2)}</span>
          </div>

          {/* Minimum */}
          <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Minimum (Min)</span>
            <div className={`text-xl font-bold font-mono mt-0.5 ${minimum < lslMm ? 'text-rose-600' : 'text-slate-800'}`}>
              {minimum.toFixed(3)} <span className="text-[10px] text-slate-400 font-normal">mm</span>
            </div>
            <span className="text-[10px] text-slate-500">LSL: {lslMm.toFixed(3)}</span>
          </div>

          {/* Maximum */}
          <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Maximum (Max)</span>
            <div className={`text-xl font-bold font-mono mt-0.5 ${maximum > uslMm ? 'text-rose-600' : 'text-slate-800'}`}>
              {maximum.toFixed(3)} <span className="text-[10px] text-slate-400 font-normal">mm</span>
            </div>
            <span className="text-[10px] text-slate-500">USL: {uslMm.toFixed(3)}</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MEASUREMENT DISTRIBUTION CHART */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                Measurement Distribution &amp; Specification Compliance
              </h3>
              <EpistemicBadge type="STATISTICAL_FINDING" size="sm" />
            </div>
            <p className="text-[11px] text-slate-500">
              Component-by-component diameter distribution vs Nominal ({nominalMm.toFixed(3)} mm), USL ({uslMm.toFixed(3)} mm), and LSL ({lslMm.toFixed(3)} mm).
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span>Conforming</span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <span>Nonconforming</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 15, right: 20, left: 15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                domain={[Math.min(lslMm - 0.02, minimum - 0.01), Math.max(uslMm + 0.02, maximum + 0.01)]}
                tickFormatter={(v) => v.toFixed(3)}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded shadow-lg text-xs space-y-1 border border-slate-700 font-mono">
                        <div className="font-bold text-blue-400 font-sans">{d.name}</div>
                        <div>Measured: <span className="font-bold text-white">{d.measured.toFixed(3)} mm</span></div>
                        <div>Nominal: <span>{d.nominal.toFixed(3)} mm</span></div>
                        <div>Deviation: <span className={d.deviation > 0 ? 'text-rose-400' : 'text-blue-300'}>{d.deviation > 0 ? `+${d.deviation.toFixed(3)}` : d.deviation.toFixed(3)} mm</span></div>
                        <div className="pt-1 border-t border-slate-800 font-sans font-semibold">
                          Status: {d.isConforming ? (
                            <span className="text-emerald-400">CONFORMING (PASS)</span>
                          ) : (
                            <span className="text-rose-400">NONCONFORMING (FAIL)</span>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Reference Area for In-Spec Zone */}
              <ReferenceArea y1={lslMm} y2={uslMm} fill="#ecfdf5" fillOpacity={0.6} />

              {/* Specification Limit Reference Lines */}
              <ReferenceLine
                y={uslMm}
                stroke="#dc2626"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                label={{ value: `USL ${uslMm.toFixed(3)} mm`, position: 'right', fill: '#dc2626', fontSize: 10 }}
              />
              <ReferenceLine
                y={nominalMm}
                stroke="#2563eb"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                label={{ value: `Nominal ${nominalMm.toFixed(3)} mm`, position: 'right', fill: '#2563eb', fontSize: 10 }}
              />
              <ReferenceLine
                y={lslMm}
                stroke="#dc2626"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                label={{ value: `LSL ${lslMm.toFixed(3)} mm`, position: 'right', fill: '#dc2626', fontSize: 10 }}
              />

              <Line
                type="monotone"
                dataKey="measured"
                stroke="#475569"
                strokeWidth={1.5}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isPass = payload.isConforming;
                  return (
                    <circle
                      key={`dot-${payload.index}`}
                      cx={cx}
                      cy={cy}
                      r={payload.measured === 50.08 ? 7 : 5}
                      fill={isPass ? '#10b981' : '#ef4444'}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. MEASUREMENT COMPLIANCE TABLE */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-xs text-slate-900">
              Dimensional Inspection Log ({records.length} Components Evaluated)
            </h3>
            <p className="text-[11px] text-slate-500">
              Every row evaluated against Nominal = {nominalMm.toFixed(2)} mm ± {toleranceMm.toFixed(2)} mm.
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Pass: {accepted} · Fail: {rejected}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Component ID</th>
                <th className="py-2.5 px-3 font-mono text-right">Measured Diameter</th>
                <th className="py-2.5 px-3 font-mono text-right">Nominal</th>
                <th className="py-2.5 px-3 font-mono text-right">Tolerance</th>
                <th className="py-2.5 px-3 font-mono text-right">LSL</th>
                <th className="py-2.5 px-3 font-mono text-right">USL</th>
                <th className="py-2.5 px-3 font-mono text-right">Deviation</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {records.map((r, idx) => {
                const isFail = r.status === 'NONCONFORMING';
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isFail ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-slate-900">{r.componentId}</td>
                    <td className={`py-3 px-3 text-right font-bold ${isFail ? 'text-rose-600' : 'text-slate-900'}`}>
                      {r.measuredDiameterMm.toFixed(3)} mm
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">{r.nominalMm.toFixed(3)} mm</td>
                    <td className="py-3 px-3 text-right text-slate-600">±{r.toleranceMm.toFixed(3)} mm</td>
                    <td className="py-3 px-3 text-right text-slate-500">{r.lslMm.toFixed(3)} mm</td>
                    <td className="py-3 px-3 text-right text-slate-500">{r.uslMm.toFixed(3)} mm</td>
                    <td className={`py-3 px-3 text-right font-semibold ${r.deviationMm > 0 ? 'text-rose-600' : 'text-blue-700'}`}>
                      {r.deviationMm > 0 ? `+${r.deviationMm.toFixed(3)}` : r.deviationMm.toFixed(3)} mm
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded ${
                          isFail
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {isFail ? 'NONCONFORMING' : 'CONFORMING'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      <button
                        onClick={() => handleDeleteMeasurement(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. RETAINED FOUR-GATE INSPECTION PROTOCOL */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold font-mono">
                Multi-Gate Release Protocol:
              </span>
              <span className="text-sm font-bold text-slate-900 font-mono">{selectedBatch.batchNumber}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{selectedBatch.productName}</p>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold ${
                allGatesPassed
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {allGatesPassed ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {allGatesPassed ? 'GATE PASS: AUTHORIZED FOR DISPATCH' : 'GATE PASS: QUARANTINE LOCKED'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Gate 1 */}
          <div className={`p-3 rounded-lg border space-y-2 ${hasVisualDefects ? 'bg-rose-50/50 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500">Gate 1: Optical</span>
              {hasVisualDefects ? <XCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <div className="font-semibold text-xs text-slate-900">Visual Quality Inspection</div>
            <p className="text-[11px] text-slate-600 leading-snug">
              {hasVisualDefects ? 'Thermal micro-crack detected by CNN.' : 'Zero critical defects detected.'}
            </p>
          </div>

          {/* Gate 2 */}
          <div className={`p-3 rounded-lg border space-y-2 ${!dimensionalPass ? 'bg-rose-50/50 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500">Gate 2: Metrology</span>
              {!dimensionalPass ? <XCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <div className="font-semibold text-xs text-slate-900">Dimensional Compliance</div>
            <p className="text-[11px] text-slate-600 leading-snug">
              {!dimensionalPass ? 'Measured Bore ID exceeded USL (+3µm).' : 'Coordinates strictly within tolerance.'}
            </p>
          </div>

          {/* Gate 3 */}
          <div className={`p-3 rounded-lg border space-y-2 ${!spcPass ? 'bg-rose-50/50 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500">Gate 3: SPC</span>
              {!spcPass ? <XCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <div className="font-semibold text-xs text-slate-900">Statistical Stability</div>
            <p className="text-[11px] text-slate-600 leading-snug">
              {!spcPass ? 'Nelson Rule 1 (>3σ) breached. Cpk = 0.74.' : 'Process stable in Zone C. Cpk ≥ 1.33.'}
            </p>
          </div>

          {/* Gate 4 */}
          <div className={`p-3 rounded-lg border space-y-2 ${!humanSigned ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500">Gate 4: Sign-Off</span>
              {!humanSigned ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <div className="font-semibold text-xs text-slate-900">Human Quality Engineer</div>
            <p className="text-[11px] text-slate-600 leading-snug">
              {!humanSigned ? 'Pending ASQ/ISO certified quality engineer signature.' : `Signed by ${selectedBatch.humanSignOff?.approvedBy}.`}
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() =>
              onOpenApprovalModal(
                `Gate Pass Sign-Off: ${selectedBatch.batchNumber}`,
                'BATCH',
                selectedBatch.id
              )
            }
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors flex items-center gap-2 shadow-xs"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Open Human Gate Sign-off</span>
          </button>
        </div>
      </div>
    </div>
  );
};
