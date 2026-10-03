import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  ProductionBatch,
  QualityIncident,
  SpcCalculationResult,
  EpistemicItem,
  TelemetryPoint,
  CapaPlan,
  VisualInspectionItem,
  RcaAnalysis,
} from '../types';
import { EpistemicBadge } from '../components/EpistemicBadge';
import { PageId } from '../components/Sidebar';
import {
  Boxes,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  ShieldAlert,
  GitFork,
  TrendingUp,
  TrendingDown,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
  CheckSquare,
  Eye,
  Info,
  Sliders,
  Calendar,
  Zap,
  Cpu,
  Play,
} from 'lucide-react';

interface Props {
  batches: ProductionBatch[];
  incidents: QualityIncident[];
  spcData: SpcCalculationResult;
  epistemicLedger: EpistemicItem[];
  telemetry?: TelemetryPoint[];
  capa?: CapaPlan;
  visualItems?: VisualInspectionItem[];
  rca?: RcaAnalysis;
  onNavigate: (page: PageId) => void;
  onOpenApprovalModal: (title: string, entityType: any, entityId: string, defaultDecision?: any) => void;
}

export const DashboardPage: React.FC<Props> = ({
  batches,
  incidents,
  spcData,
  epistemicLedger,
  telemetry = [],
  capa,
  visualItems = [],
  rca,
  onNavigate,
  onOpenApprovalModal,
}) => {
  const activeIncident = incidents[0];
  const quarantinedBatch = batches.find((b) => b.status === 'QUARANTINED');

  // Summary Metrics
  const totalBatchesCount = batches.length;
  const totalInspected = batches.reduce((sum, b) => sum + b.inspectedUnits, 0);
  const totalAccepted = batches.reduce((sum, b) => sum + b.passedUnits, 0);
  const totalNonconforming = batches.reduce((sum, b) => sum + b.quarantinedUnits, 0);
  const rejectionRate = totalInspected > 0 ? (totalNonconforming / totalInspected) * 100 : 0;
  const activeIncidentsCount = incidents.filter((i) => i.status !== 'CLOSED').length;
  const anomalyCount = telemetry.filter((t) => t.isAnomaly).length || 13;
  const openCapaActionsCount = capa?.actions.filter((a) => a.status !== 'VERIFIED').length || 5;

  // Chart 1: Rejection Rate Trend Data (% over 7 operational shifts)
  const rejectionRateTrendData = [
    { shift: 'Shift 1 (Mon D)', rejectionRate: 1.15, threshold: 2.0 },
    { shift: 'Shift 2 (Mon N)', rejectionRate: 1.30, threshold: 2.0 },
    { shift: 'Shift 3 (Tue D)', rejectionRate: 0.95, threshold: 2.0 },
    { shift: 'Shift 4 (Tue N)', rejectionRate: 2.40, threshold: 2.0 },
    { shift: 'Shift 5 (Wed D)', rejectionRate: 7.85, threshold: 2.0 }, // Peak incident shift
    { shift: 'Shift 6 (Wed N)', rejectionRate: 3.20, threshold: 2.0 },
    { shift: 'Shift 7 (Thu D)', rejectionRate: 1.25, threshold: 2.0 },
  ];

  // Chart 2: Defect Category Distribution Data
  const defectCategoryData = [
    { name: 'Dimensional Oversize', count: 14, color: '#ef4444' },
    { name: 'Thermal Micro-Crack', count: 2, color: '#f43f5e' },
    { name: 'Surface Porosity', count: 2, color: '#f97316' },
    { name: 'Burr Deformation', count: 1, color: '#eab308' },
    { name: 'Micro-Scratch', count: 1, color: '#06b6d4' },
    { name: 'Foreign Inclusion', count: 1, color: '#8b5cf6' },
  ];

  // Chart 3: Diameter Measurement Trend Data (Part-by-part vs USL/LSL)
  const diameterMeasurementData = [
    { part: '#1', diameter: 85.001, usl: 85.015, nominal: 85.000, lsl: 84.985 },
    { part: '#2', diameter: 85.003, usl: 85.015, nominal: 85.000, lsl: 84.985 },
    { part: '#3', diameter: 85.002, usl: 85.015, nominal: 85.000, lsl: 84.985 },
    { part: '#4', diameter: 85.005, usl: 85.015, nominal: 85.000, lsl: 84.985 },
    { part: '#5', diameter: 85.004, usl: 85.015, nominal: 85.000, lsl: 84.985 },
    { part: '#6', diameter: 85.007, usl: 85.015, nominal: 85.000, lsl: 84.985 },
    { part: '#7', diameter: 85.009, usl: 85.015, nominal: 85.000, lsl: 84.985 },
    { part: '#8', diameter: 85.011, usl: 85.015, nominal: 85.000, lsl: 84.985 },
    { part: '#9', diameter: 85.013, usl: 85.015, nominal: 85.000, lsl: 84.985 },
    { part: '#10', diameter: 85.014, usl: 85.015, nominal: 85.000, lsl: 84.985 },
    { part: '#11', diameter: 85.016, usl: 85.015, nominal: 85.000, lsl: 84.985 }, // Breach
    { part: '#12', diameter: 85.018, usl: 85.015, nominal: 85.000, lsl: 84.985 }, // Critical Breach
    { part: '#13', diameter: 85.017, usl: 85.015, nominal: 85.000, lsl: 84.985 },
    { part: '#14', diameter: 85.019, usl: 85.015, nominal: 85.000, lsl: 84.985 },
  ];

  // Chart 4: Machine Vibration Trend Data (RMS mm/s)
  const vibrationTrendData = telemetry.length > 0
    ? telemetry.slice(0, 24).map((t) => ({
        time: t.timestamp,
        vibration: t.vibrationMmS,
        isoAlarm: 2.50,
      }))
    : [
        { time: '08:00', vibration: 1.10, isoAlarm: 2.50 },
        { time: '09:00', vibration: 1.15, isoAlarm: 2.50 },
        { time: '10:00', vibration: 1.25, isoAlarm: 2.50 },
        { time: '11:00', vibration: 2.10, isoAlarm: 2.50 },
        { time: '11:30', vibration: 3.40, isoAlarm: 2.50 },
        { time: '12:00', vibration: 3.80, isoAlarm: 2.50 },
        { time: '12:30', vibration: 3.10, isoAlarm: 2.50 },
        { time: '13:00', vibration: 1.80, isoAlarm: 2.50 },
      ];

  // Chart 5: Defects by Machine Data
  const defectsByMachineData = [
    { machine: 'CNC Line A-1', defects: 14, scrapCost: 46200, color: '#ef4444' },
    { machine: 'Micro-EDM Cell B-3', defects: 3, scrapCost: 4200, color: '#f59e0b' },
    { machine: 'Grinding Cell C-4', defects: 2, scrapCost: 1800, color: '#3b82f6' },
    { machine: 'Cleanroom Line D-2', defects: 0, scrapCost: 0, color: '#10b981' },
  ];

  // Chart 6: CAPA Status Distribution Data
  const capaStatusData = [
    { name: 'Containment Active', value: 1, color: '#f59e0b' },
    { name: 'In Progress', value: 1, color: '#3b82f6' },
    { name: 'Corrective Pending', value: 2, color: '#8b5cf6' },
    { name: 'Preventive Pending', value: 2, color: '#10b981' },
  ];

  // Recent Quality Events Table Data
  const recentQualityEvents = [
    {
      eventId: 'EVT-9042',
      batch: 'LOT-2026-AERO-08',
      machine: 'CNC Line A-1',
      defect: 'Bore Oversize (+0.003 mm)',
      severity: 'CRITICAL',
      date: '2026-10-02 11:45',
      status: 'QUARANTINED',
    },
    {
      eventId: 'EVT-9040',
      batch: 'LOT-2026-AERO-08',
      machine: 'CNC Line A-1',
      defect: 'Thermal Micro-Crack (1.85mm²)',
      severity: 'CRITICAL',
      date: '2026-10-02 11:42',
      status: 'QUARANTINED',
    },
    {
      eventId: 'EVT-9037',
      batch: 'LOT-2026-AERO-08',
      machine: 'CNC Line A-1',
      defect: 'Flange Face Micro-Scratch',
      severity: 'HIGH',
      date: '2026-10-02 11:48',
      status: 'QUARANTINED',
    },
    {
      eventId: 'EVT-9031',
      batch: 'LOT-2026-AUTO-14',
      machine: 'Micro-EDM Cell B-3',
      defect: 'Orifice Recast Micro-Pitting',
      severity: 'MEDIUM',
      date: '2026-10-02 09:15',
      status: 'CONTAINED',
    },
    {
      eventId: 'EVT-9024',
      batch: 'LOT-2026-MED-04',
      machine: 'Cleanroom Line D-2',
      defect: 'Coating Thickness Marginal (+20µm)',
      severity: 'LOW',
      date: '2026-10-01 23:30',
      status: 'RESOLVED',
    },
    {
      eventId: 'EVT-9018',
      batch: 'LOT-2026-AERO-07',
      machine: 'CNC Line A-1',
      defect: 'Burr on Bolt Hole #4',
      severity: 'LOW',
      date: '2026-10-01 16:10',
      status: 'RESOLVED',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Critical Nonconformance Alert */}
      {activeIncident && (
        <div className="bg-rose-50 border-l-4 border-rose-600 rounded-r-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-rose-600 text-white font-mono">
                  {activeIncident.severity} NONCONFORMANCE
                </span>
                <span className="font-mono text-xs font-semibold text-rose-900">
                  {activeIncident.incidentCode}
                </span>
                <EpistemicBadge type="OBSERVED_FACT" size="sm" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 mt-1">
                {activeIncident.title}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Batch: <span className="font-semibold text-slate-800">{activeIncident.batchId}</span> · Machine: {activeIncident.lineId} · 14 units quarantined
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('rca')}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Launch RCA Workbench</span>
            </button>
            <button
              onClick={() =>
                onOpenApprovalModal(
                  `Batch Quarantine Disposition: ${quarantinedBatch?.batchNumber || 'LOT-2026-AERO-08'}`,
                  'BATCH',
                  quarantinedBatch?.id || 'batch-001',
                  'APPROVED'
                )
              }
              className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign Quarantine Disposition</span>
            </button>
          </div>
        </div>
      )}

      {/* CAPA Effectiveness Monitoring Quick-Access Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
            <TrendingDown className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-950">
                CAPA Effectiveness Monitoring: Rejection Rate 8.2% → 1.1%
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Effective · Recurrence Monitoring Active
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Observed improvement after corrective action: -23 defects across 275 verified parts. Empirical before/after comparison with active recurrence detection.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('capa')}
          className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
        >
          <span>View Effectiveness Chart & Recurrence</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Multi-Agent Workflow Quick-Access Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Agentic AI Manufacturing Quality Inspection Workflow</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold">
                8 Active Agents
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Intake → Visual Inspection → Dimensional Compliance → Process Anomaly → SPC → RCA → CAPA → Human Review Gate
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('agent-workflow')}
          className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded shadow-xs flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Open Agent Execution Panel</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. SUMMARY CARDS (8 REQUIRED CARDS) */}
      {/* ------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Operational Quality Metrics Summary
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Shift Window: 24h Real-Time</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Total Production Batches */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Total Production Batches</span>
              <Boxes className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {totalBatchesCount} <span className="text-xs font-normal text-slate-400">lots</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Active Cells: 4/4</span>
              <span className="text-blue-700 font-semibold">100% Traced</span>
            </div>
          </div>

          {/* Card 2: Total Inspected Components */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Total Inspected Components</span>
              <CheckSquare className="w-4 h-4 text-slate-700" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {totalInspected} <span className="text-xs font-normal text-slate-400">pcs</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Sampling: AQL Level III</span>
              <span className="text-slate-600 font-mono">100% Screen</span>
            </div>
          </div>

          {/* Card 3: Accepted Components */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Accepted Components</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700">
              {totalAccepted} <span className="text-xs font-normal text-slate-400">pcs</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Conformity: {((totalAccepted / (totalInspected || 1)) * 100).toFixed(1)}%</span>
              <span className="text-emerald-700 font-semibold">Within Spec</span>
            </div>
          </div>

          {/* Card 4: Nonconforming Components */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Nonconforming Components</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-600">
              {totalNonconforming} <span className="text-xs font-normal text-slate-400">pcs</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Quarantined Cage A-14</span>
              <span className="text-rose-600 font-semibold font-mono">Bonded Lock</span>
            </div>
          </div>

          {/* Card 5: Rejection Rate */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Rejection Rate</span>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div className={`text-2xl font-bold font-mono ${rejectionRate > 2.0 ? 'text-amber-600' : 'text-emerald-700'}`}>
              {rejectionRate.toFixed(2)}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>AQL Target: ≤ 2.0%</span>
              <span className="text-amber-700 font-semibold">+1.69% Spike</span>
            </div>
          </div>

          {/* Card 6: Active Quality Incidents */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Active Quality Incidents</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-600">
              {activeIncidentsCount} <span className="text-xs font-normal text-slate-400">active</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Severity: Critical (8D)</span>
              <span className="text-rose-600 font-semibold">Investigating</span>
            </div>
          </div>

          {/* Card 7: Process Anomalies */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Process Anomalies</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-600">
              {anomalyCount} <span className="text-xs font-normal text-slate-400">events</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Mahalanobis &gt; 3.0</span>
              <span className="text-amber-700 font-semibold">Spindle Chatter</span>
            </div>
          </div>

          {/* Card 8: Open CAPA Actions */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Open CAPA Actions</span>
              <ShieldAlert className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {openCapaActionsCount} <span className="text-xs font-normal text-slate-400">tasks</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>ISO 9001 §10.2</span>
              <span className="text-blue-700 font-semibold">Pending Approval</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. "CURRENT QUALITY STATUS" EXECUTIVE SECTION */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Current Plant Quality Status</h3>
            <p className="text-xs text-slate-500">Live operational condition across 5 critical dimensions</p>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
            Real-Time Interlock Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Status 1: Production Status */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500">1. Production Status</span>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </div>
            <div className="font-bold text-xs text-slate-900">Line A-1 Quarantined</div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Lines B-3, C-4, D-2 operating nominally. Line A-1 halted under LOTO for tooling swap.
            </p>
          </div>

          {/* Status 2: Process Control Status */}
          <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-rose-800">2. Process Control</span>
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
            </div>
            <div className="font-bold text-xs text-rose-950">Out of Control (SPC)</div>
            <p className="text-[11px] text-rose-900 leading-snug">
              Nelson Rule 1 (&gt;3σ) &amp; Rule 3 breached on Bore ID. Cpk dropped to 0.74 (Target ≥ 1.33).
            </p>
          </div>

          {/* Status 3: Machine Anomaly Status */}
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-amber-800">3. Machine Anomaly</span>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </div>
            <div className="font-bold text-xs text-amber-950">Thermal Runaway Alert</div>
            <p className="text-[11px] text-amber-900 leading-snug">
              Chiller Unit #2 coolant elevated to 28.4°C (+6.4°C drift). Vibration RMS peaked at 3.8 mm/s.
            </p>
          </div>

          {/* Status 4: Inspection Status */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500">4. Inspection Status</span>
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            </div>
            <div className="font-bold text-xs text-slate-900">100% CMM &amp; Optical Gate</div>
            <p className="text-[11px] text-slate-600 leading-snug">
              YOLOv11-ResNet50 FPN and Zeiss CMM scanning all 65 machined units of Lot LOT-2026-AERO-08.
            </p>
          </div>

          {/* Status 5: CAPA Status */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-500">5. CAPA Status</span>
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            </div>
            <div className="font-bold text-xs text-slate-900">Pending Sign-off</div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Immediate containment executed (Tag #QT-2026-088). 5-point plan awaiting engineer signature.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. SIX REQUIRED RECHARTS CHARTS */}
      {/* ------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Quality Analytics &amp; Statistical Charts
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Recharts Responsive Visualizations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Chart 1: Rejection Rate Trend */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-semibold text-xs text-slate-900">1. Rejection Rate Trend</h4>
                <p className="text-[10px] text-slate-500">Shift-by-shift rejection percentage vs AQL limit</p>
              </div>
              <EpistemicBadge type="OBSERVED_FACT" size="sm" />
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rejectionRateTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rejectionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="shift" tick={{ fontSize: 9 }} stroke="#64748b" tickLine={false} />
                  <YAxis tick={{ fontSize: 9 }} stroke="#64748b" tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any) => [`${val}%`, 'Rejection Rate']}
                  />
                  <ReferenceLine y={2.0} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'AQL 2.0%', position: 'top', fill: '#dc2626', fontSize: 9 }} />
                  <Area type="monotone" dataKey="rejectionRate" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#rejectionGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Defect Category Distribution */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-semibold text-xs text-slate-900">2. Defect Category Distribution</h4>
                <p className="text-[10px] text-slate-500">Pareto classification of nonconforming features</p>
              </div>
              <EpistemicBadge type="OBSERVED_FACT" size="sm" />
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={defectCategoryData} layout="vertical" margin={{ top: 5, right: 15, left: 35, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9 }} stroke="#64748b" tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} stroke="#64748b" tickLine={false} width={85} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any) => [`${val} pcs`, 'Defects']}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {defectCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Diameter Measurement Trend */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-semibold text-xs text-slate-900">3. Diameter Measurement Trend</h4>
                <p className="text-[10px] text-slate-500">Bore ID (mm) vs USL (85.015) &amp; LSL (84.985)</p>
              </div>
              <EpistemicBadge type="STATISTICAL_FINDING" size="sm" />
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={diameterMeasurementData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="part" tick={{ fontSize: 9 }} stroke="#64748b" tickLine={false} />
                  <YAxis domain={[84.985, 85.022]} tick={{ fontSize: 9 }} stroke="#64748b" tickLine={false} tickFormatter={(v) => v.toFixed(3)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any) => [`${val} mm`, 'Diameter']}
                  />
                  <ReferenceLine y={85.015} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'USL 85.015', position: 'top', fill: '#dc2626', fontSize: 9 }} />
                  <ReferenceLine y={85.000} stroke="#2563eb" strokeDasharray="2 2" />
                  <Line type="monotone" dataKey="diameter" stroke="#1e293b" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Machine Vibration Trend */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-semibold text-xs text-slate-900">4. Machine Vibration Trend</h4>
                <p className="text-[10px] text-slate-500">Spindle accelerometer RMS (mm/s) vs ISO 10816</p>
              </div>
              <EpistemicBadge type="OBSERVED_FACT" size="sm" />
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vibrationTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vibGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="#64748b" tickLine={false} />
                  <YAxis tick={{ fontSize: 9 }} stroke="#64748b" tickLine={false} unit="mm/s" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any) => [`${val} mm/s`, 'Vibration RMS']}
                  />
                  <ReferenceLine y={2.50} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'Alarm 2.5 mm/s', position: 'top', fill: '#dc2626', fontSize: 9 }} />
                  <Area type="monotone" dataKey="vibration" stroke="#e11d48" strokeWidth={2} fillOpacity={1} fill="url(#vibGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 5: Defects by Machine */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-semibold text-xs text-slate-900">5. Defects by Machine</h4>
                <p className="text-[10px] text-slate-500">Cross-cell nonconformance counts</p>
              </div>
              <EpistemicBadge type="OBSERVED_FACT" size="sm" />
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={defectsByMachineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="machine" tick={{ fontSize: 9 }} stroke="#64748b" tickLine={false} />
                  <YAxis tick={{ fontSize: 9 }} stroke="#64748b" tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any) => [`${val} pcs`, 'Defects']}
                  />
                  <Bar dataKey="defects" radius={[4, 4, 0, 0]}>
                    {defectsByMachineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 6: CAPA Status Distribution */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="font-semibold text-xs text-slate-900">6. CAPA Status Distribution</h4>
                <p className="text-[10px] text-slate-500">Remediation action item breakdown</p>
              </div>
              <EpistemicBadge type="OBSERVED_FACT" size="sm" />
            </div>
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={capaStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {capaStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any, name: any) => [`${val} action(s)`, name]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. RECENT QUALITY EVENTS TABLE */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-xs text-slate-900">Recent Quality Events Ledger</h3>
            <p className="text-[11px] text-slate-500">Nonconformances and quarantine triggers recorded across plant lines</p>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Total Events: {recentQualityEvents.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Batch</th>
                <th className="py-2.5 px-3">Machine</th>
                <th className="py-2.5 px-3">Defect Feature</th>
                <th className="py-2.5 px-3 text-center">Severity</th>
                <th className="py-2.5 px-3 font-mono">Date / Time</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {recentQualityEvents.map((evt) => (
                <tr key={evt.eventId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">{evt.eventId}</td>
                  <td className="py-3 px-3 font-semibold text-blue-700">{evt.batch}</td>
                  <td className="py-3 px-3 font-sans text-slate-800">{evt.machine}</td>
                  <td className="py-3 px-3 font-sans font-medium text-slate-900">{evt.defect}</td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded ${
                        evt.severity === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : evt.severity === 'HIGH'
                          ? 'bg-amber-600 text-white'
                          : evt.severity === 'MEDIUM'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {evt.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">{evt.date}</td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded ${
                        evt.status === 'QUARANTINED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : evt.status === 'CONTAINED'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-sans">
                    <button
                      onClick={() => onNavigate('rca')}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
                    >
                      Inspect RCA
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. "AI QUALITY INSIGHTS" MULTI-TIER PANEL */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">AI Quality Insights &amp; Epistemic Ledger</h3>
          </div>
          <div className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 font-medium">
            Strict Epistemic Rule: Hypotheses are candidate inferences, NOT confirmed root causes.
          </div>
        </div>

        {/* 6 Epistemic Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Observed Fact */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Tier 1: Ground Truth</span>
              <EpistemicBadge type="OBSERVED_FACT" size="sm" />
            </div>
            <div className="font-bold text-xs text-slate-900">Observed Fact</div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              14 components exceeded the upper specification limit (85.018 mm measured vs 85.015 mm USL on Zeiss Prismo CMM).
            </p>
            <div className="pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-500">
              Source: CMM Stylus Probe #2 (20.0°C)
            </div>
          </div>

          {/* Card 2: Model Prediction */}
          <div className="p-3.5 rounded-lg bg-indigo-50/50 border border-indigo-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-indigo-700">Tier 2: Vision CNN</span>
              <EpistemicBadge type="MODEL_PREDICTION" size="sm" />
            </div>
            <div className="font-bold text-xs text-indigo-950">Model Prediction</div>
            <p className="text-xs text-indigo-900 leading-relaxed font-sans">
              Surface thermal micro-crack detected with 94.2% confidence on bearing race entry chamfer (ResNet50-FPN-DefectDet).
            </p>
            <div className="pt-2 border-t border-indigo-200 text-[10px] font-mono text-indigo-700">
              Confidence: 94.2% · Area: 1.85 mm²
            </div>
          </div>

          {/* Card 3: Statistical Finding */}
          <div className="p-3.5 rounded-lg bg-cyan-50/50 border border-cyan-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-cyan-700">Tier 3: Mathematical</span>
              <EpistemicBadge type="STATISTICAL_FINDING" size="sm" />
            </div>
            <div className="font-bold text-xs text-cyan-950">Statistical Finding</div>
            <p className="text-xs text-cyan-900 leading-relaxed font-sans">
              Process measurements show an abnormal shift (Nelson Rule 3: 6 consecutive points monotonically ascending; Cpk = 0.74).
            </p>
            <div className="pt-2 border-t border-cyan-200 text-[10px] font-mono text-cyan-700">
              Calculation: ASTM E2587 n=5 Subgroups
            </div>
          </div>

          {/* Card 4: RCA Hypothesis */}
          <div className="p-3.5 rounded-lg bg-amber-50/50 border border-amber-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-700">Tier 4: Causal Reasoning</span>
              <EpistemicBadge type="RCA_HYPOTHESIS" size="sm" />
            </div>
            <div className="font-bold text-xs text-amber-950">RCA Hypothesis</div>
            <p className="text-xs text-amber-900 leading-relaxed font-sans">
              Tool wear may have contributed to dimensional variation, coupled with chiller airflow swarf clogging (+2.9 µm expansion).
            </p>
            <div className="pt-2 border-t border-amber-200 text-[10px] font-mono text-amber-700 flex items-center justify-between">
              <span>Status: Subject to Physical Test</span>
              <span className="font-semibold text-amber-900">Unconfirmed (AI)</span>
            </div>
          </div>

          {/* Card 5: Confirmed Root Cause */}
          <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-700">Tier 5: Certified</span>
              <EpistemicBadge type="CONFIRMED_ROOT_CAUSE" size="sm" />
            </div>
            <div className="font-bold text-xs text-emerald-950">Confirmed Root Cause</div>
            <p className="text-xs text-emerald-900 leading-relaxed font-sans">
              Coupled failure of CNC chiller airflow blockage (spindle thermal expansion) and ceramic insert flank over-wear confirmed.
            </p>
            <div className="pt-2 border-t border-emerald-200 text-[10px] font-mono text-emerald-800 flex items-center justify-between">
              <span>Verified: Dr. Marcus Sterling</span>
              <span className="font-bold">ASQ CQE #84912</span>
            </div>
          </div>

          {/* Card 6: Human Decision */}
          <div className="p-3.5 rounded-lg bg-purple-50/50 border border-purple-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-purple-700">Tier 6: Authorization</span>
              <EpistemicBadge type="HUMAN_DECISION" size="sm" />
            </div>
            <div className="font-bold text-xs text-purple-950">Human Decision</div>
            <p className="text-xs text-purple-900 leading-relaxed font-sans">
              100% quarantine authorized on Lot LOT-2026-AERO-08 (Cage A-14); CAPA plan approved under ISO 9001:2015 §10.2.
            </p>
            <div className="pt-2 border-t border-purple-200 text-[10px] font-mono text-purple-800 flex items-center justify-between">
              <span>Disposition: QUARANTINED</span>
              <span className="font-bold">Digitally Sealed</span>
            </div>
          </div>
        </div>

        {/* Governance Callout */}
        <div className="p-3 rounded-lg bg-slate-900 text-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-emerald-300">Human Quality Engineer Gate:</strong> AI recommendations are advisory under ISO 9001 §8.7. To elevate an RCA Hypothesis to a Confirmed Root Cause, a physical verification test must be conducted and digitally signed.
            </span>
          </div>
          <button
            onClick={() => onNavigate('rca')}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded shrink-0 transition-colors flex items-center gap-1.5"
          >
            <span>Conduct Physical Test</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
