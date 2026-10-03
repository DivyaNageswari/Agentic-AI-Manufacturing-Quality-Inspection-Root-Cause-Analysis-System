import React, { useState } from 'react';
import type {
  CapaPlan,
  CapaActionItem,
  CapaEffectivenessRecord,
  CapaEffectivenessRating,
} from '../types/index.ts';
import { EpistemicBadge } from '../components/EpistemicBadge.tsx';
import { CapaEffectivenessMonitoring } from '../components/CapaEffectivenessMonitoring.tsx';
import {
  ShieldCheck,
  Plus,
  Lock,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertCircle,
  FileCheck,
  FileSignature,
  Sparkles,
  Layers,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Target,
  Calendar,
  FileText,
  BadgeAlert,
  Activity,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

interface Props {
  capa: CapaPlan;
  effectiveness?: CapaEffectivenessRecord;
  onOpenApprovalModal: (
    title: string,
    entityType: any,
    entityId: string,
    defaultDecision?: any,
    defaultNotes?: string
  ) => void;
  onAddAction?: (action: Partial<CapaActionItem>) => void;
  onTriggerCapaGeneration?: () => Promise<void>;
  onUpdateActionStatus?: (actionId: string, status: CapaActionItem['status']) => void;
  onUpdateEffectiveness?: (
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

export const CapaPage: React.FC<Props> = ({
  capa,
  effectiveness,
  onOpenApprovalModal,
  onAddAction,
  onTriggerCapaGeneration,
  onUpdateActionStatus,
  onUpdateEffectiveness,
  onCreateRecurrenceIncident,
  onNavigateToIncidents,
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIONS' | 'EFFECTIVENESS'>('ACTIONS');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CONTAINMENT' | 'CORRECTIVE' | 'PREVENTIVE'>('ALL');
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form State
  const [newActionType, setNewActionType] = useState<'CONTAINMENT' | 'CORRECTIVE' | 'PREVENTIVE'>('CORRECTIVE');
  const [newDescription, setNewDescription] = useState('');
  const [newResponsibleRole, setNewResponsibleRole] = useState('Tooling & Metrology Engineer');
  const [newDueDate, setNewDueDate] = useState('2026-10-10');
  const [newEvidence, setNewEvidence] = useState('Optical microscope inspection record & calibration log.');
  const [newEffectivenessResult, setNewEffectivenessResult] = useState('Target: Flank wear VB < 0.12 mm across 30 consecutive parts.');

  const isApproved = capa.status === 'APPROVED' && capa.humanApproval?.approved;

  const filteredActions = capa.actions.filter((a) => {
    if (selectedFilter === 'ALL') return true;
    return a.type === selectedFilter;
  });

  const containmentCount = capa.actions.filter((a) => a.type === 'CONTAINMENT').length;
  const correctiveCount = capa.actions.filter((a) => a.type === 'CORRECTIVE').length;
  const preventiveCount = capa.actions.filter((a) => a.type === 'PREVENTIVE').length;

  const handleGenerateCapa = async () => {
    if (!onTriggerCapaGeneration) return;
    setIsGenerating(true);
    try {
      await onTriggerCapaGeneration();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim()) return;

    if (onAddAction) {
      const nextId = `CAPA-ACT-00${capa.actions.length + 1}`;
      onAddAction({
        id: `act-${Date.now()}`,
        actionId: nextId,
        type: newActionType,
        description: newDescription,
        action: newDescription,
        responsibleRole: newResponsibleRole,
        responsibleName: 'Assigned Engineering Lead',
        dueDate: newDueDate,
        targetDate: newDueDate,
        status: 'PENDING',
        evidence: newEvidence,
        evidenceDocumentation: newEvidence,
        completionDate: undefined,
        effectivenessResult: newEffectivenessResult,
        verificationMetric: newEffectivenessResult,
      });
    }

    setShowAddActionModal(false);
    setNewDescription('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              CAPA Management & Remediation Agent
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
              {capa.isoStandardReference}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Agentic CAPA: Formulates Containment, Corrective, and Preventive actions based on RCA findings with mandatory human review.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onTriggerCapaGeneration && (
            <button
              onClick={handleGenerateCapa}
              disabled={isGenerating}
              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isGenerating ? 'Synthesizing CAPA...' : 'Generate CAPA from RCA'}</span>
            </button>
          )}

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold ${
              isApproved
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {isApproved ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-amber-600" />}
            <span>STATUS: {capa.status.replace(/_/g, ' ')}</span>
          </span>
        </div>
      </div>

      {/* Top Main Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-1">
        <button
          onClick={() => setActiveTab('ACTIONS')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'ACTIONS'
              ? 'border-blue-600 text-blue-700 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Remediation Action Items ({capa.actions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('EFFECTIVENESS')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'EFFECTIVENESS'
              ? 'border-blue-600 text-blue-700 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4 text-blue-600" />
          <span>Effectiveness Monitoring & Recurrence</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
            8.2% → 1.1% Rejection
          </span>
        </button>
      </div>

      {/* If EFFECTIVENESS tab is selected */}
      {activeTab === 'EFFECTIVENESS' && effectiveness && (
        <CapaEffectivenessMonitoring
          effectiveness={effectiveness}
          onUpdateEvaluation={(rating, notes, engName, badge) => {
            if (onUpdateEffectiveness) {
              onUpdateEffectiveness(rating, notes, engName, badge);
            }
          }}
          onCreateRecurrenceIncident={onCreateRecurrenceIncident}
          onNavigateToIncidents={onNavigateToIncidents}
        />
      )}

      {/* If ACTIONS tab is selected */}
      {activeTab === 'ACTIONS' && (
        <div className="space-y-6">
          {/* Mandatory Human Gating Warning Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-950 flex items-start gap-2.5 shadow-xs">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900">
                QUALITY-ENGINEER MANDATE: AI-generated findings are decision-support recommendations and require quality-engineer review.
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                The AI must never automatically approve final product disposition. In accordance with ISO 9001:2015 §8.7 and AS9100D,
                all Containment actions, Corrective actions, and Preventive remediations remain recommendations until an authorized Quality Engineer
                applies a verified digital signature.
              </p>
            </div>
          </div>

          {/* CAPA Plan Overview & Metrics */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold uppercase">
                    Plan ID: {capa.id}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Incident Ref: {capa.incidentId}</span>
                  <span className="text-xs text-slate-500 font-mono">Lot: {capa.batchId}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{capa.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddActionModal(true)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 rounded border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Action Item</span>
                </button>

                {!isApproved ? (
                  <button
                    onClick={() =>
                      onOpenApprovalModal(
                        `CAPA Approval: ${capa.title}`,
                        'CAPA',
                        capa.id,
                        'APPROVED',
                        `Authorized remediation plan under ISO 9001 §10.2. Target Cpk ≥ ${capa.targetCpkPostAction}.`
                      )
                    }
                    className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    <span>Approve CAPA</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold font-mono px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Digitally Signed by {capa.humanApproval?.engineerName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Causal Findings & Verification Target */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2 bg-slate-50/70 p-3.5 rounded border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-800 block text-[11px] uppercase font-mono">
                  RCA Findings Input to CAPA Agent:
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">{capa.rootCauseSummary}</p>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded border border-slate-200 flex flex-col justify-center text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Post-CAPA Cpk Target</span>
                <span className="text-2xl font-bold font-mono text-emerald-700 mt-0.5">
                  ≥ {capa.targetCpkPostAction.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">ASTM E2587 · 3 Batches</span>
              </div>
            </div>
          </div>

          {/* Action Type Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setSelectedFilter('ALL')}
                className={`px-3 py-1.5 font-semibold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>All Actions ({capa.actions.length})</span>
              </button>

              <button
                onClick={() => setSelectedFilter('CONTAINMENT')}
                className={`px-3 py-1.5 font-semibold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedFilter === 'CONTAINMENT'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>1. Containment ({containmentCount})</span>
              </button>

              <button
                onClick={() => setSelectedFilter('CORRECTIVE')}
                className={`px-3 py-1.5 font-semibold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedFilter === 'CORRECTIVE'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>2. Corrective ({correctiveCount})</span>
              </button>

              <button
                onClick={() => setSelectedFilter('PREVENTIVE')}
                className={`px-3 py-1.5 font-semibold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedFilter === 'PREVENTIVE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>3. Preventive ({preventiveCount})</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Each action item records: ID, Type, Description, Role, Due Date, Status, Evidence, Completion Date, Effectiveness Result
            </div>
          </div>

          {/* Action Items Cards */}
          <div className="space-y-4">
            {filteredActions.map((action, idx) => {
              const actionIdentifier = action.actionId || `CAPA-ACT-00${idx + 1}`;
              const isDone = action.status === 'COMPLETED' || action.status === 'VERIFIED';

              let badgeColor = 'bg-purple-100 text-purple-800 border-purple-300';
              if (action.type === 'CONTAINMENT') badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
              if (action.type === 'PREVENTIVE') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';

              return (
                <div
                  key={action.id || idx}
                  className={`bg-white rounded-lg border shadow-xs transition-all overflow-hidden ${
                    isDone ? 'border-emerald-300 bg-emerald-50/10' : 'border-slate-200'
                  }`}
                >
                  {/* Card Top: Action ID, Type & Status */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-[11px] px-2 py-0.5 rounded bg-white border border-slate-300">
                        Action ID: {actionIdentifier}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded font-mono font-bold text-[10px] border ${badgeColor}`}>
                        Type: {action.type}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        Role: <strong className="text-slate-800">{action.responsibleRole}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due Date: {action.dueDate || action.targetDate || '2026-10-10'}</span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : action.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        Status: {action.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Body: Description */}
                  <div className="p-4 space-y-3.5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">
                        Description:
                      </span>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5 leading-relaxed">
                        {action.description || action.action}
                      </p>
                    </div>

                    {/* Evidence & Completion / Effectiveness Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                      {/* Evidence */}
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase font-mono">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Evidence Documentation:</span>
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {action.evidence || action.evidenceDocumentation || 'Inspection protocol log filed in QA archive.'}
                        </p>
                      </div>

                      {/* Effectiveness Result & Completion Date */}
                      <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-[11px] uppercase font-mono">
                            <Target className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Effectiveness Result:</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-800">
                            Completed: {action.completionDate || 'In Progress'}
                          </span>
                        </div>
                        <p className="text-emerald-950 text-[11px] leading-relaxed font-sans">
                          {action.effectivenessResult || action.verificationMetric || 'Verification ongoing against ISO 9001 §10.2 criteria.'}
                        </p>
                      </div>
                    </div>

                    {/* Quick Status Update Buttons and Effectiveness View */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-500 font-mono">Responsible: {action.responsibleName || action.responsibleRole}</span>
                      
                      <div className="flex items-center gap-2">
                        {/* Direct link to effectiveness monitoring comparison if completed */}
                        {isDone && (
                          <button
                            onClick={() => setActiveTab('EFFECTIVENESS')}
                            className="px-2.5 py-1 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Activity className="w-3 h-3 text-blue-600" />
                            <span>View Before vs After Metrics</span>
                          </button>
                        )}

                        {onUpdateActionStatus && (
                          <>
                            {action.status !== 'COMPLETED' && (
                              <button
                                onClick={() => onUpdateActionStatus(action.id, 'COMPLETED')}
                                className="px-2.5 py-1 text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Mark Completed</span>
                              </button>
                            )}
                            {action.status !== 'IN_PROGRESS' && action.status !== 'COMPLETED' && (
                              <button
                                onClick={() => onUpdateActionStatus(action.id, 'IN_PROGRESS')}
                                className="px-2.5 py-1 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Clock className="w-3 h-3" />
                                <span>Mark In Progress</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Custom Action Item Modal */}
      {showAddActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Add CAPA Remediation Action Item</h3>
              <button
                onClick={() => setShowAddActionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Action Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CONTAINMENT', 'CORRECTIVE', 'PREVENTIVE'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewActionType(t)}
                      className={`py-1.5 text-xs font-semibold rounded border transition-colors cursor-pointer ${
                        newActionType === t
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. Inspect cutting tool and verify tool offset..."
                  rows={2}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded text-xs text-slate-800 font-sans focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                    Responsible Role
                  </label>
                  <input
                    type="text"
                    value={newResponsibleRole}
                    onChange={(e) => setNewResponsibleRole(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Evidence Documentation
                </label>
                <input
                  type="text"
                  value={newEvidence}
                  onChange={(e) => setNewEvidence(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Effectiveness Result / Verification Target
                </label>
                <input
                  type="text"
                  value={newEffectivenessResult}
                  onChange={(e) => setNewEffectivenessResult(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddActionModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded cursor-pointer"
                >
                  Add Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

