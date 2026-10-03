import React, { useState } from 'react';
import {
  CapaEffectivenessRecord,
  CapaEffectivenessRating,
  QualityIncident,
} from '../types';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  ShieldCheck,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Activity,
  FileSignature,
  RefreshCw,
  BellRing,
  HelpCircle,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Flame,
  Check,
  Sliders,
  ExternalLink,
} from 'lucide-react';

interface Props {
  effectiveness: CapaEffectivenessRecord;
  onUpdateEvaluation: (
    rating: CapaEffectivenessRating,
    notes: string,
    engineerName: string,
    licenseBadgeId: string
  ) => void;
  onCreateRecurrenceIncident?: (payload: {
    title: string;
    description: string;
    batchId: string;
    severity: 'HIGH' | 'CRITICAL';
    observedFacts: string[];
    immediateContainment: string;
  }) => void;
  onNavigateToIncidents?: () => void;
}

export const CapaEffectivenessMonitoring: React.FC<Props> = ({
  effectiveness,
  onUpdateEvaluation,
  onCreateRecurrenceIncident,
  onNavigateToIncidents,
}) => {
  const [currentRecord, setCurrentRecord] = useState<CapaEffectivenessRecord>(effectiveness);
  const [selectedRating, setSelectedRating] = useState<CapaEffectivenessRating>(
    currentRecord.humanEvaluation?.rating || 'Effective'
  );
  const [engineerName, setEngineerName] = useState(
    currentRecord.humanEvaluation?.engineerName || 'Dr. Marcus Sterling'
  );
  const [licenseBadgeId, setLicenseBadgeId] = useState(
    currentRecord.humanEvaluation?.licenseBadgeId || 'ASQ-CQE-84912'
  );
  const [evaluationNotes, setEvaluationNotes] = useState(
    currentRecord.humanEvaluation?.notes ||
      'Bore dimensions stabilized within ±0.005 mm of nominal. Cpk improved from 0.74 to 1.58 exceeding post-action target of 1.50. Flank wear remains < 0.10 mm with zero thermal micro-cracking observed over 275 consecutive parts.'
  );
  const [showSignModal, setShowSignModal] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Recurrence Simulation State
  const [simulatedBatch, setSimulatedBatch] = useState<string>('LOT-2026-AERO-15');
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [createdIncidentAlert, setCreatedIncidentAlert] = useState<{
    code: string;
    timestamp: string;
  } | null>(null);

  const before = currentRecord.beforeStats;
  const after = currentRecord.afterStats;
  const change = currentRecord.observedChange;
  const recurrence = currentRecord.recurrenceMonitor;

  // Rating badge styling
  const getRatingBadge = (rating?: CapaEffectivenessRating) => {
    switch (rating) {
      case 'Effective':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          desc: 'Target quality achieved (Cpk ≥ 1.50; Rejection ≤ 1.5%)',
        };
      case 'Partially Effective':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          desc: 'Rejection rate reduced, but secondary variance persists',
        };
      case 'Not Effective':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
          desc: 'Quality targets missed; requires RCA revision',
        };
      case 'Requires More Monitoring':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: <Clock className="w-4 h-4 text-blue-600" />,
          desc: 'Additional production batches required for statistical significance',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: <HelpCircle className="w-4 h-4 text-slate-500" />,
          desc: 'Awaiting formal metrologist review',
        };
    }
  };

  const currentBadge = getRatingBadge(currentRecord.humanEvaluation?.rating);

  // Submit human evaluation
  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!engineerName.trim() || !licenseBadgeId.trim()) return;

    const timestamp = new Date().toISOString();
    const updatedRecord: CapaEffectivenessRecord = {
      ...currentRecord,
      humanEvaluation: {
        rating: selectedRating,
        engineerName,
        licenseBadgeId,
        timestamp,
        notes: evaluationNotes,
        digitalSignature: `SIG-SHA256-${licenseBadgeId.replace(/[^A-Z0-9]/gi, '')}-${Date.now().toString().slice(-6)}`,
      },
    };

    setCurrentRecord(updatedRecord);
    onUpdateEvaluation(selectedRating, evaluationNotes, engineerName, licenseBadgeId);
    setShowSignModal(false);
    setSaveSuccessMessage(`Effectiveness sign-off saved as "${selectedRating}" with ASQ CQE digital signature.`);
    setTimeout(() => setSaveSuccessMessage(null), 5000);
  };

  // Recurrence Simulation: Ingest batch with recurring defect
  const handleTriggerSimulatedRecurrence = () => {
    setIsSimulatingScan(true);
    setTimeout(() => {
      setIsSimulatingScan(false);
      const newEvent = {
        id: `rec-evt-${Date.now().toString().slice(-4)}`,
        detectedAt: new Date().toISOString(),
        batchNumber: simulatedBatch,
        defectType: 'Thermal Micro-Cracking & Bore Oversize (+0.0035 mm)',
        defectCount: 4,
        similarityScore: 0.94,
        severity: 'HIGH' as const,
        status: 'FLAGGED' as const,
        description: `Optical surface scanner and CMM probe flagged 4 out-of-spec parts exhibiting thermal micro-cracking and +0.0035 mm bore oversize in ${simulatedBatch}, identical to pre-CAPA signature.`,
      };

      setCurrentRecord((prev) => ({
        ...prev,
        recurrenceMonitor: {
          ...prev.recurrenceMonitor,
          recurrenceDetected: true,
          events: [newEvent, ...prev.recurrenceMonitor.events],
        },
      }));
    }, 600);
  };

  // Recurrence Resolution: Clear recurrence flag
  const handleClearRecurrence = () => {
    setCurrentRecord((prev) => ({
      ...prev,
      recurrenceMonitor: {
        ...prev.recurrenceMonitor,
        recurrenceDetected: false,
        events: prev.recurrenceMonitor.events.map((evt) => ({
          ...evt,
          status: 'DISMISSED' as const,
        })),
      },
    }));
  };

  // Create official incident from recurrence
  const handleCreateRecurrenceIncident = (eventIndex = 0) => {
    const targetEvent = currentRecord.recurrenceMonitor.events[eventIndex];
    const incidentCode = `INC-2026-REC-0${Math.floor(1 + Math.random() * 9)}`;

    if (onCreateRecurrenceIncident) {
      onCreateRecurrenceIncident({
        title: `CAPA Recurrence Alert: ${targetEvent?.defectType || 'Thermal Micro-Cracking & Bore Oversize'}`,
        description: `Recurrence detected during post-CAPA effectiveness monitoring on Batch ${targetEvent?.batchNumber || simulatedBatch}. Similar defect signature to original nonconformance LOT-2026-AERO-08 despite chiller servicing. Immediate containment required.`,
        batchId: targetEvent?.batchNumber || simulatedBatch,
        severity: 'HIGH',
        observedFacts: [
          `Recurrence of bore oversize (+0.0035 mm) detected post-CAPA implementation.`,
          `Optical inspection confirmed 4 units with thermal micro-cracks on bearing arbor.`,
          `Coolant delivery temperature logged transient spike to 25.1°C during morning shift.`,
        ],
        immediateContainment: `Line A-1 halted immediately; Lot ${targetEvent?.batchNumber || simulatedBatch} placed in Cage A-14 quarantine; 100% CMM scan triggered.`,
      });
    }

    // Mark event as INCIDENT_CREATED
    setCurrentRecord((prev) => ({
      ...prev,
      recurrenceMonitor: {
        ...prev.recurrenceMonitor,
        events: prev.recurrenceMonitor.events.map((evt, idx) =>
          idx === eventIndex
            ? { ...evt, status: 'INCIDENT_CREATED', createdIncidentId: incidentCode }
            : evt
        ),
      },
    }));

    setCreatedIncidentAlert({
      code: incidentCode,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Information Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                CAPA REF: {currentRecord.capaId.toUpperCase()}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                Action: {currentRecord.actionId || 'CAPA-ACT-002'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Completion Date: {currentRecord.completionDate}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Corrective-Action Effectiveness Monitoring & Recurrence Governance
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical before-and-after comparison of manufacturing quality metrics following CAPA completion with mandatory epistemic guardrails.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border ${currentBadge.bg}`}>
              {currentBadge.icon}
              <span>{currentRecord.humanEvaluation?.rating || 'Requires More Monitoring'}</span>
            </div>

            <button
              onClick={() => setShowSignModal(true)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileSignature className="w-3.5 h-3.5 text-amber-400" />
              <span>Evaluate & Sign Off</span>
            </button>
          </div>
        </div>

        {/* Action Title summary */}
        <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">
              Completed Corrective Action Under Verification:
            </span>
            <p className="text-slate-800 font-semibold">{currentRecord.actionTitle}</p>
          </div>
          <span className="text-[11px] font-mono px-2 py-1 rounded bg-white border border-slate-300 text-slate-600 font-bold shrink-0">
            Target: Cpk ≥ 1.50 · Rejection ≤ 1.5%
          </span>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* 2. Primary Before & After Rejection Comparison Cards (Prompt Example Exact Match) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Before Rejection Rate Card */}
        <div className="bg-white rounded-lg border border-rose-200 p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="relative space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Before Corrective Action
              </span>
              <span className="text-xs font-mono text-slate-400">Pre-Action</span>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 font-medium">Rejection Rate</div>
              <div className="text-3xl font-extrabold font-mono text-rose-600 mt-0.5">
                {before.rejectionRate.toFixed(1)}%
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
              <span>Defect Count:</span>
              <strong className="text-rose-700 font-bold">{before.defectCount} units</strong>
            </div>

            <div className="text-[10px] text-slate-500 font-mono">
              Period: {before.startDate} to {before.endDate} ({before.batchCount} batches)
            </div>
          </div>
        </div>

        {/* After Rejection Rate Card */}
        <div className="bg-white rounded-lg border border-emerald-200 p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="relative space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                After Corrective Action
              </span>
              <span className="text-xs font-mono text-emerald-600 font-bold">Post-Action</span>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 font-medium">Rejection Rate</div>
              <div className="text-3xl font-extrabold font-mono text-emerald-600 mt-0.5">
                {after.rejectionRate.toFixed(1)}%
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
              <span>Defect Count:</span>
              <strong className="text-emerald-700 font-bold">{after.defectCount} units</strong>
            </div>

            <div className="text-[10px] text-slate-500 font-mono">
              Period: {after.startDate} to {after.endDate} ({after.batchCount} batches)
            </div>
          </div>
        </div>

        {/* Observed Change Metric Card */}
        <div className="bg-white rounded-lg border border-blue-200 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Observed Change
            </span>
            <TrendingDown className="w-4 h-4 text-blue-600" />
          </div>

          <div>
            <div className="text-[11px] text-slate-500 font-medium">Rate Differential</div>
            <div className="text-3xl font-extrabold font-mono text-blue-700 mt-0.5">
              {change.rateDelta > 0 ? `+${change.rateDelta.toFixed(1)}%` : `${change.rateDelta.toFixed(1)}%`}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
            <span>Defect Reduction:</span>
            <strong className="text-blue-700 font-bold">{change.defectDelta} parts ({change.percentImprovement}%)</strong>
          </div>

          <div className="text-[10px] text-slate-500 font-mono">
            Process Capability: Cpk {before.cpk.toFixed(2)} → {after.cpk.toFixed(2)}
          </div>
        </div>

        {/* Quality Engineer Verified Disposition */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Engineer Disposition
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>

          <div>
            <div className="text-[11px] text-slate-500 font-medium">Evaluation Status</div>
            <div className="text-base font-bold text-slate-900 mt-1">
              {currentRecord.humanEvaluation?.rating || 'Requires More Monitoring'}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
            <div className="flex justify-between">
              <span>Signatory:</span>
              <span className="font-semibold text-slate-800">{currentRecord.humanEvaluation?.engineerName || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between font-mono text-[10px] text-slate-500">
              <span>Badge:</span>
              <span>{currentRecord.humanEvaluation?.licenseBadgeId || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mandatory Cautious Wording & Epistemic Non-Causation Banner */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-4 space-y-1.5 shadow-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-700 shrink-0" />
          <h4 className="font-bold text-xs text-blue-900 uppercase font-mono tracking-wide">
            {change.wording}
          </h4>
        </div>
        <p className="text-xs text-blue-950 leading-relaxed font-sans pl-6">
          <strong>Mandatory Epistemic Protocol:</strong> {change.disclaimer}
        </p>
      </div>

      {/* 4. Effectiveness Trend Chart (Recharts) */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Corrective Action Effectiveness Trend Chart</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rejection rate (%) and defect count per batch across pre-action baseline and post-action verification periods.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Pre-Action Mean (8.2%)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Post-Action Mean (1.1%)
            </span>
          </div>
        </div>

        {/* Recharts Composed Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={currentRecord.trendData} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="batchNumber"
                tick={{ fontSize: 11, fill: '#475569' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#475569' }}
                tickFormatter={(val) => `${val}%`}
                domain={[0, 20]}
                label={{ value: 'Rejection Rate (%)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#64748b' } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#475569' }}
                domain={[0, 15]}
                label={{ value: 'Defects (Units)', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#64748b' } }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-md shadow-xl text-xs space-y-1.5 border border-slate-700 max-w-xs font-sans">
                        <div className="font-mono font-bold text-amber-400 border-b border-slate-700 pb-1 flex justify-between">
                          <span>{label} ({data.date})</span>
                          <span className={data.phase === 'AFTER_ACTION' ? 'text-emerald-400' : 'text-rose-400'}>
                            {data.phase === 'AFTER_ACTION' ? 'Post-CAPA' : 'Pre-CAPA'}
                          </span>
                        </div>
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Rejection Rate:</span>
                            <span className="font-bold text-white">{data.rejectionRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Defect Count:</span>
                            <span className="font-bold text-white">{data.defectCount} units</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Inspected Volume:</span>
                            <span>{data.inspectedUnits} parts</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Process Cpk:</span>
                            <span className="text-emerald-400 font-bold">{data.cpk.toFixed(2)}</span>
                          </div>
                        </div>
                        {data.notes && (
                          <div className="text-[10px] text-rose-300 pt-1 border-t border-slate-800">
                            {data.notes}
                          </div>
                        )}
                        {data.actionMilestone && (
                          <div className="text-[10px] text-emerald-300 pt-1 border-t border-slate-800">
                            ✦ {data.actionMilestone}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />

              {/* Action Milestone Divider Line */}
              <ReferenceLine
                yAxisId="left"
                x="LOT-AERO-09"
                stroke="#2563eb"
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{
                  value: '✦ Action Completed (Oct 02/03)',
                  position: 'top',
                  fill: '#1d4ed8',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />

              {/* Target Rejection Limit (1.5%) */}
              <ReferenceLine
                yAxisId="left"
                y={1.5}
                stroke="#10b981"
                strokeDasharray="3 3"
                label={{ value: 'Target AQL (1.5%)', position: 'right', fill: '#059669', fontSize: 10 }}
              />

              {/* Defect count bars */}
              <Bar yAxisId="right" dataKey="defectCount" fill="#cbd5e1" name="Defect Count (Units)" barSize={18} />

              {/* Rejection rate line */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="rejectionRate"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#ef4444' }}
                activeDot={{ r: 6 }}
                name="Rejection Rate (%)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Breakdown Tables for Before vs After Periods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Pre-Action Period Summary */}
          <div className="border border-slate-200 rounded p-3 text-xs space-y-2 bg-slate-50/50">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="font-bold text-slate-800 font-mono text-[11px]">
                {before.periodLabel}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {before.startDate} — {before.endDate}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center py-1">
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">Inspected</span>
                <strong className="text-slate-800 text-sm font-mono">{before.totalInspected}</strong>
              </div>
              <div className="p-2 bg-white rounded border border-rose-200">
                <span className="text-[10px] text-rose-500 block font-mono">Defects</span>
                <strong className="text-rose-700 text-sm font-mono">{before.defectCount}</strong>
              </div>
              <div className="p-2 bg-white rounded border border-rose-200">
                <span className="text-[10px] text-rose-500 block font-mono">Rejection</span>
                <strong className="text-rose-700 text-sm font-mono">{before.rejectionRate}%</strong>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block">
                Primary Nonconformance Signatures:
              </span>
              {before.dominantDefects.map((d, i) => (
                <div key={i} className="flex justify-between text-[11px] text-slate-600">
                  <span>• {d.type}</span>
                  <span className="font-mono text-slate-700 font-semibold">{d.count} units ({d.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Post-Action Period Summary */}
          <div className="border border-slate-200 rounded p-3 text-xs space-y-2 bg-emerald-50/20">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
              <span className="font-bold text-emerald-950 font-mono text-[11px]">
                {after.periodLabel}
              </span>
              <span className="text-[10px] font-mono text-emerald-700">
                {after.startDate} — {after.endDate}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center py-1">
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">Inspected</span>
                <strong className="text-slate-800 text-sm font-mono">{after.totalInspected}</strong>
              </div>
              <div className="p-2 bg-white rounded border border-emerald-200">
                <span className="text-[10px] text-emerald-600 block font-mono">Defects</span>
                <strong className="text-emerald-700 text-sm font-mono">{after.defectCount}</strong>
              </div>
              <div className="p-2 bg-white rounded border border-emerald-200">
                <span className="text-[10px] text-emerald-600 block font-mono">Rejection</span>
                <strong className="text-emerald-700 text-sm font-mono">{after.rejectionRate}%</strong>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-emerald-800 font-bold uppercase block">
                Post-Action Defect Signatures:
              </span>
              {after.dominantDefects.map((d, i) => (
                <div key={i} className="flex justify-between text-[11px] text-slate-600">
                  <span>• {d.type}</span>
                  <span className="font-mono text-slate-700 font-semibold">{d.count} units ({d.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recurrence Detection Engine Panel */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                recurrence.recurrenceDetected
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  Defect Recurrence Detection Engine
                </h3>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    recurrence.recurrenceDetected
                      ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {recurrence.recurrenceDetected ? 'RECURRENCE DETECTED' : 'MONITORING ACTIVE · ZERO RECURRENCE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated similarity matcher compares new batches against historical defect signatures (thermal micro-cracking, spindle drift, bore oversize).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!recurrence.recurrenceDetected ? (
              <button
                onClick={handleTriggerSimulatedRecurrence}
                disabled={isSimulatingScan}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-700" />
                <span>{isSimulatingScan ? 'Ingesting Batch...' : 'Test Recurrence Detection (Batch LOT-15)'}</span>
              </button>
            ) : (
              <button
                onClick={handleClearRecurrence}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Monitor</span>
              </button>
            )}
          </div>
        </div>

        {/* Monitored Defect Signatures list */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] text-slate-500 font-mono font-bold">Monitored Signatures:</span>
          {recurrence.targetDefects.map((def, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200"
            >
              {def}
            </span>
          ))}
          <span className="text-[10px] text-slate-400 font-mono ml-auto">
            Tolerance Threshold: &lt; {recurrence.toleranceThresholdPercent}%
          </span>
        </div>

        {/* Incident Created Notification Banner */}
        {createdIncidentAlert && (
          <div className="bg-rose-50 border border-rose-300 text-rose-950 p-4 rounded-lg text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-2 text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>NEW QUALITY INCIDENT CREATED: {createdIncidentAlert.code}</span>
              </span>
              <span className="font-mono text-[10px] text-rose-700">{createdIncidentAlert.timestamp}</span>
            </div>
            <p className="text-[11px] text-rose-800 leading-relaxed">
              Recurrence of pre-CAPA defect pattern triggered mandatory incident creation. Affected batch placed in quarantine. RCA and containment reopened.
            </p>
            {onNavigateToIncidents && (
              <button
                onClick={onNavigateToIncidents}
                className="text-[11px] font-semibold text-rose-900 underline flex items-center gap-1 cursor-pointer hover:text-rose-950"
              >
                <span>View Incident in Incidents Log</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Recurrence Event Cards */}
        {recurrence.recurrenceDetected && recurrence.events.length > 0 && (
          <div className="space-y-3 pt-1">
            {recurrence.events.map((evt, idx) => (
              <div
                key={evt.id || idx}
                className="p-4 rounded-lg border border-rose-300 bg-rose-50/40 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-900 px-2 py-0.5 rounded bg-rose-100 border border-rose-300">
                      Batch: {evt.batchNumber}
                    </span>
                    <span className="font-semibold text-rose-950">{evt.defectType}</span>
                    <span className="text-[10px] font-mono text-rose-700">
                      ({evt.defectCount} nonconforming units)
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500">
                    Detected: {new Date(evt.detectedAt).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {evt.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-rose-200 text-xs">
                  <span className="text-[11px] font-mono text-rose-800">
                    Similarity to Original Root Cause: <strong>{(evt.similarityScore * 100).toFixed(0)}%</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {evt.status === 'INCIDENT_CREATED' ? (
                      <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1 px-2.5 py-1 bg-emerald-100 rounded border border-emerald-300">
                        <Check className="w-3.5 h-3.5" />
                        <span>Incident Logged ({evt.createdIncidentId})</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCreateRecurrenceIncident(idx)}
                        className="px-3 py-1.5 text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                        <span>Flag Recurrence & Create Incident</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clear State placeholder when zero recurrence */}
        {!recurrence.recurrenceDetected && (
          <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/20 text-xs flex items-center justify-between text-emerald-950">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Zero recurrence detected over last 6 production batches (275 consecutive units). Coolant temperature and tool wear within nominal control thresholds.
              </span>
            </div>
            <span className="font-mono text-[10px] text-emerald-700 font-bold shrink-0">
              Confidence: 99.4%
            </span>
          </div>
        )}
      </div>

      {/* 6. Human Quality-Engineer Effectiveness Evaluation Sign-Off Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Quality Engineer CAPA Effectiveness Verification
                </h3>
              </div>
              <button
                onClick={() => setShowSignModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-4">
              {/* 4 Required Evaluation Dispositions */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-2">
                  Effectiveness Evaluation Disposition (Select One)
                </label>
                <div className="space-y-2">
                  {(
                    [
                      {
                        rating: 'Effective',
                        label: 'Effective',
                        desc: 'Defect rate dropped to 1.1% (≤ 1.5% target). Cpk 1.58 achieved across verification batches.',
                        color: 'border-emerald-500 bg-emerald-50/50 text-emerald-950',
                      },
                      {
                        rating: 'Partially Effective',
                        label: 'Partially Effective',
                        desc: 'Defects reduced, but residual surface anomalies or minor drift remain present.',
                        color: 'border-amber-500 bg-amber-50/50 text-amber-950',
                      },
                      {
                        rating: 'Not Effective',
                        label: 'Not Effective',
                        desc: 'Defects continue above specification limit; requires reopening root-cause investigation.',
                        color: 'border-rose-500 bg-rose-50/50 text-rose-950',
                      },
                      {
                        rating: 'Requires More Monitoring',
                        label: 'Requires More Monitoring',
                        desc: 'Insufficient production batch volume to definitively confirm long-term statistical stability.',
                        color: 'border-blue-500 bg-blue-50/50 text-blue-950',
                      },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.rating}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedRating === opt.rating
                          ? `${opt.color} ring-1 ring-offset-1`
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="effectivenessRating"
                        value={opt.rating}
                        checked={selectedRating === opt.rating}
                        onChange={() => setSelectedRating(opt.rating)}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs block">{opt.label}</span>
                        <span className="text-[11px] text-slate-500 leading-tight block">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Engineer Name & ASQ Badge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                    Quality Engineer Name
                  </label>
                  <input
                    type="text"
                    value={engineerName}
                    onChange={(e) => setEngineerName(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                    ASQ / ISO License Badge ID
                  </label>
                  <input
                    type="text"
                    value={licenseBadgeId}
                    onChange={(e) => setLicenseBadgeId(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Technical Justification Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Technical Verification Notes & Metrology Justification
                </label>
                <textarea
                  value={evaluationNotes}
                  onChange={(e) => setEvaluationNotes(e.target.value)}
                  rows={3}
                  required
                  placeholder="Record CMM metrology readouts, FPI examination results, and statistical basis..."
                  className="w-full p-2.5 border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Warning note */}
              <div className="text-[10px] text-slate-500 font-mono border-t border-slate-100 pt-2">
                ISO 9001:2015 §10.2 requirement: Verification must evaluate evidence of nonconformance recurrence prevention.
              </div>

              {/* Form buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSignModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <FileSignature className="w-3.5 h-3.5 text-amber-300" />
                  <span>Digitally Sign & Record Evaluation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
