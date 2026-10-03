import React, { useState } from 'react';
import type {
  QualityReviewReport,
  HumanAuditEntry,
  VisualInspectionItem,
  RcaAnalysis,
  CapaPlan,
} from '../types/index.ts';
import { EpistemicBadge } from '../components/EpistemicBadge.tsx';
import { AgentExecutionPanel } from '../components/AgentExecutionPanel.tsx';
import {
  Cpu,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  GitCommit,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Layers,
  AlertTriangle,
  FileSignature,
  FileText,
  Clock,
  RotateCcw,
  Check,
  X,
  MessageSquare,
  Search,
  Filter,
  Eye,
  Microscope,
  Beaker,
  UserCheck,
  HelpCircle,
} from 'lucide-react';

interface Props {
  review: QualityReviewReport;
  auditTrail: HumanAuditEntry[];
  visualItems: VisualInspectionItem[];
  rca: RcaAnalysis;
  capa: CapaPlan;
  onConfirmDefect?: (itemId: string, comment: string) => Promise<void> | void;
  onRejectDefect?: (itemId: string, comment: string) => Promise<void> | void;
  onConfirmRcaHypothesis?: (hypothesisId: string, comment: string) => Promise<void> | void;
  onRejectRcaHypothesis?: (hypothesisId: string, comment: string) => Promise<void> | void;
  onRequestReAnalysis?: (targetEntity: string, comment: string) => Promise<void> | void;
  onApproveCapa?: (capaId: string, comment: string) => Promise<void> | void;
  onRejectCapa?: (capaId: string, comment: string) => Promise<void> | void;
  onAddComment?: (agent: string, finding: string, decision: string, comment: string) => Promise<void> | void;
  onRerunAudit?: () => Promise<void>;
  onOpenApprovalModal?: (
    title: string,
    entityType: 'BATCH' | 'CAPA' | 'ROOT_CAUSE' | 'QUARANTINE_RELEASE',
    entityId: string,
    defaultDecision?: 'APPROVED' | 'REJECTED' | 'QUARANTINED' | 'CONFIRMED',
    defaultNotes?: string
  ) => void;
}

export const AiReviewPage: React.FC<Props> = ({
  review,
  auditTrail,
  visualItems,
  rca,
  capa,
  onConfirmDefect,
  onRejectDefect,
  onConfirmRcaHypothesis,
  onRejectRcaHypothesis,
  onRequestReAnalysis,
  onApproveCapa,
  onRejectCapa,
  onAddComment,
  onRerunAudit,
  onOpenApprovalModal,
}) => {
  const [activeTab, setActiveTab] = useState<'reviewCenter' | 'auditTrail' | 'agents' | 'critic'>('reviewCenter');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('ALL');

  // Inline comment draft state
  const [defectComments, setDefectComments] = useState<Record<string, string>>({});
  const [hypoComments, setHypoComments] = useState<Record<string, string>>({});
  const [capaComment, setCapaComment] = useState('');
  const [customCommentModalOpen, setCustomCommentModalOpen] = useState(false);
  const [customAgent, setCustomAgent] = useState('Quality Engineer');
  const [customFinding, setCustomFinding] = useState('Final lot disposition check');
  const [customDecision, setCustomDecision] = useState('COMMENT_ADDED');
  const [customCommentText, setCustomCommentText] = useState('');

  const handleAudit = async () => {
    setIsAuditing(true);
    try {
      if (onRerunAudit) await onRerunAudit();
    } finally {
      setIsAuditing(false);
    }
  };

  // Filtered Audit Trail entries
  const filteredAuditTrail = auditTrail.filter((entry) => {
    const matchesAgent = selectedAgentFilter === 'ALL' || entry.agent === selectedAgentFilter;
    const q = auditSearchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      entry.finding.toLowerCase().includes(q) ||
      entry.humanDecision.toLowerCase().includes(q) ||
      entry.reviewerComment.toLowerCase().includes(q) ||
      entry.agent.toLowerCase().includes(q);
    return matchesAgent && matchesSearch;
  });

  const handleCustomCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCommentText.trim()) return;
    if (onAddComment) {
      onAddComment(customAgent, customFinding, customDecision, customCommentText);
    }
    setCustomCommentModalOpen(false);
    setCustomCommentText('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              AI Review Center &amp; Quality Engineer Governance Gate
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300 font-semibold">
              Human-in-the-Loop Gate (Enforced)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Decisive human authority: Review defects, evaluate RCA hypotheses, authorize CAPAs, request re-analysis, and maintain immutable audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCustomCommentModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Add Reviewer Note</span>
          </button>

          <button
            onClick={handleAudit}
            disabled={isAuditing}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAuditing ? 'Auditing Pipeline...' : 'Run Critic Audit'}</span>
          </button>
        </div>
      </div>

      {/* 2. Clear Warning Banner (Prompt Requirement) */}
      <div className="bg-amber-50/90 border-2 border-amber-300 rounded-lg p-4 text-xs text-amber-950 flex items-start gap-3 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
            <span>Mandatory Decision-Support Notice</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">
              ISO 9001:2015 §8.7
            </span>
          </div>
          <p className="font-semibold text-sm text-amber-950">
            "AI-generated findings are decision-support recommendations and require quality-engineer review."
          </p>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            The AI must never automatically approve final product disposition. Autonomous release or closing of nonconformance
            is strictly locked out. Only an ASQ-certified Quality Engineer can approve release, confirm root cause, or authorize remediation.
          </p>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('reviewCenter')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'reviewCenter'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Quality Engineer Action Center</span>
        </button>

        <button
          onClick={() => setActiveTab('auditTrail')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'auditTrail'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Audit Trail ({auditTrail.length} Records)</span>
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'agents'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Multi-Agent Workflow Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('critic')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'critic'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Reviewer Critic Audit</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
          TAB 1: QUALITY ENGINEER ACTION CENTER
         ------------------------------------------------------------- */}
      {activeTab === 'reviewCenter' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">Defect Inspections</div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                  {visualItems.filter((v) => v.humanVerdict === 'CONFIRMED_DEFECT').length} / {visualItems.length} Confirmed
                </div>
              </div>
              <Microscope className="w-7 h-7 text-blue-500 opacity-80" />
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">RCA Hypotheses</div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                  {rca.hypotheses.filter((h) => h.status === 'CONFIRMED_ROOT_CAUSE').length} / {rca.hypotheses.length} Confirmed
                </div>
              </div>
              <Beaker className="w-7 h-7 text-amber-500 opacity-80" />
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">CAPA Plan Status</div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                  {capa.status === 'APPROVED' ? 'APPROVED' : 'PENDING REVIEW'}
                </div>
              </div>
              <ShieldCheck className="w-7 h-7 text-emerald-500 opacity-80" />
            </div>
          </div>

          {/* Section 1: Defects Review */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-blue-600" />
                  <span>1. Visual &amp; Surface Defect Findings Review</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review YOLOv11 &amp; ResNet50 CNN defect detections. Quality engineer may confirm or reject each finding.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">Total: {visualItems.length} items</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visualItems.map((item) => {
                const isConfirmed = item.humanVerdict === 'CONFIRMED_DEFECT';
                const isRejected = item.humanVerdict === 'FALSE_POSITIVE';
                const draftComment = defectComments[item.id] || '';

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border space-y-3 text-xs transition-all ${
                      isConfirmed
                        ? 'border-rose-300 bg-rose-50/20'
                        : isRejected
                        ? 'border-slate-300 bg-slate-50/50 opacity-75'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{item.partSerialNumber}</span>
                        <EpistemicBadge type={item.epistemicType} size="sm" />
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isConfirmed
                            ? 'bg-rose-100 text-rose-800'
                            : isRejected
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.humanVerdict || 'PENDING_REVIEW'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-slate-800">
                        Component: <span className="font-normal text-slate-600">{item.componentType}</span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-800">
                        AI Prediction:{' '}
                        <span className="font-normal text-slate-600">
                          {item.defects.map((d) => `${d.defectClass} (${(d.confidence * 100).toFixed(1)}%)`).join(', ')}
                        </span>
                      </div>
                      {item.inspectionNotes && (
                        <div className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 p-2 rounded border border-slate-200">
                          "{item.inspectionNotes}"
                        </div>
                      )}
                    </div>

                    {/* Inline Comment Input */}
                    <div>
                      <input
                        type="text"
                        value={draftComment}
                        onChange={(e) => setDefectComments({ ...defectComments, [item.id]: e.target.value })}
                        placeholder="Add engineer comment or microscope observation..."
                        className="w-full p-2 border border-slate-200 rounded text-[11px] font-sans text-slate-800"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          if (onRejectDefect) {
                            onRejectDefect(item.id, draftComment || 'False positive optical glare confirmed under microscope.');
                          }
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3 text-slate-500" />
                        <span>Reject Defect</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onConfirmDefect) {
                            onConfirmDefect(item.id, draftComment || 'Micro-crack confirmed under 50x metallurgical microscope.');
                          }
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Confirm Defect</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: RCA Hypotheses Review */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Beaker className="w-4 h-4 text-amber-600" />
                  <span>2. RCA Causal Hypotheses Review</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm hypotheses into verified root causes, reject unsubstantiated causes, or request multi-agent re-analysis.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">Total: {rca.hypotheses.length} hypotheses</span>
            </div>

            <div className="space-y-4">
              {rca.hypotheses.map((h) => {
                const isConfirmed = h.status === 'CONFIRMED_ROOT_CAUSE';
                const isRefuted = h.status === 'REFUTED';
                const draftComment = hypoComments[h.id] || '';

                return (
                  <div
                    key={h.id}
                    className={`p-4 rounded-lg border space-y-3 text-xs transition-all ${
                      isConfirmed
                        ? 'border-emerald-400 bg-emerald-50/20'
                        : isRefuted
                        ? 'border-slate-300 bg-slate-50/60 opacity-70'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <EpistemicBadge type={h.epistemicType} size="sm" />
                        <span className="font-mono font-bold text-slate-900">{h.hypothesis || h.hypothesisStatement}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-500">
                          Confidence: {Math.round((h.confidence || 0.8) * 100)}%
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isConfirmed
                              ? 'bg-emerald-100 text-emerald-800'
                              : isRefuted
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {h.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-600 text-xs italic">"{h.hypothesisStatement}"</p>

                    {/* Supporting & Verification Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-700">Supporting Evidence:</span>
                        <ul className="space-y-0.5 text-slate-600 list-disc list-inside">
                          {(h.supportingEvidence || h.evidenceChain || []).slice(0, 2).map((e, idx) => (
                            <li key={idx}>{e}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-blue-50/60 p-2.5 rounded border border-blue-200 space-y-1">
                        <span className="font-bold text-blue-900">Required Verification:</span>
                        <ul className="space-y-0.5 text-blue-800 list-disc list-inside font-mono">
                          {(h.requiredVerification || [h.suggestedPhysicalTest]).slice(0, 2).map((v, idx) => (
                            <li key={idx}>{v}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Inline Comment Input */}
                    <div>
                      <input
                        type="text"
                        value={draftComment}
                        onChange={(e) => setHypoComments({ ...hypoComments, [h.id]: e.target.value })}
                        placeholder="Add engineer physical test report or verification notes..."
                        className="w-full p-2 border border-slate-200 rounded text-[11px] font-sans text-slate-800"
                      />
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-mono text-slate-400">
                        {isConfirmed ? `Verified by ${h.confirmedBy} on ${h.confirmedAt?.substring(0, 10)}` : 'Pending physical test sign-off'}
                      </span>

                      <div className="flex items-center gap-2">
                        {onRequestReAnalysis && (
                          <button
                            onClick={() => {
                              onRequestReAnalysis(h.id, draftComment || `Requested re-analysis for hypothesis: ${h.hypothesis}`);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3 text-slate-500" />
                            <span>Request Re-Analysis</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (onRejectRcaHypothesis) {
                              onRejectRcaHypothesis(h.id, draftComment || 'Physical test disproved hypothesis.');
                            }
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3 h-3 text-slate-500" />
                          <span>Reject Hypothesis</span>
                        </button>

                        {!isConfirmed && (
                          <button
                            onClick={() => {
                              if (onConfirmRcaHypothesis) {
                                onConfirmRcaHypothesis(
                                  h.id,
                                  draftComment || 'Laser interferometer and optical presetter verified root cause under physical test.'
                                );
                              }
                            }}
                            className="px-3 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>Confirm RCA Hypothesis</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: CAPA Review */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>3. CAPA Plan Evaluation &amp; Authorization</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorize or reject proposed 8D remediation plan under ISO 9001:2015 §8.7 and §10.2.
                </p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                  capa.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {capa.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 text-sm">{capa.title}</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  Verification Criteria: Cpk ≥ {capa.targetCpkPostAction.toFixed(2)}
                </span>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                {capa.rootCauseSummary}
              </p>

              {/* Action items count badge */}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="font-bold text-slate-700">Actions Included:</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono">
                  {capa.actions.filter((a) => a.type === 'CONTAINMENT').length} Containment
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-mono">
                  {capa.actions.filter((a) => a.type === 'CORRECTIVE').length} Corrective
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono">
                  {capa.actions.filter((a) => a.type === 'PREVENTIVE').length} Preventive
                </span>
              </div>

              {/* Reviewer Comment Field */}
              <div>
                <input
                  type="text"
                  value={capaComment}
                  onChange={(e) => setCapaComment(e.target.value)}
                  placeholder="Enter quality engineer authorization notes or rejection rationale..."
                  className="w-full p-2 border border-slate-300 rounded text-[11px] font-sans text-slate-800"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                {onRequestReAnalysis && (
                  <button
                    onClick={() => {
                      onRequestReAnalysis('capa', capaComment || 'Requesting re-formulation of CAPA with stricter tooling limits.');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Request Re-Analysis</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    if (onRejectCapa) {
                      onRejectCapa(capa.id, capaComment || 'CAPA plan rejected: requires tighter tool-life offset limits.');
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 rounded transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject CAPA</span>
                </button>

                <button
                  onClick={() => {
                    if (onApproveCapa) {
                      onApproveCapa(capa.id, capaComment || 'Formally authorized CAPA execution under ISO 9001 §10.2.');
                    }
                  }}
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileSignature className="w-3.5 h-3.5" />
                  <span>Approve CAPA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 2: AUDIT TRAIL TABLE (PROMPT REQUIREMENT)
         ------------------------------------------------------------- */}
      {activeTab === 'auditTrail' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Quality Engineer Decision Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Immutable chronological log tracking every human decision, reviewer comment, and AI finding across the workflow.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 bg-slate-100 rounded text-slate-700 font-bold">
              {filteredAuditTrail.length} Records Logged
            </span>
          </div>

          {/* Search & Agent Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                placeholder="Search audit trail by finding, decision, or comment..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded font-mono text-slate-800 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedAgentFilter}
                onChange={(e) => setSelectedAgentFilter(e.target.value)}
                className="p-2 border border-slate-300 rounded text-xs text-slate-700 bg-white"
              >
                <option value="ALL">All Agents</option>
                <option value="Visual Inspection Agent">Visual Inspection Agent</option>
                <option value="Dimensional Compliance Agent">Dimensional Compliance Agent</option>
                <option value="Process Monitoring & Anomaly Agent">Process Monitoring Agent</option>
                <option value="Statistical Process Control Agent">SPCAgent</option>
                <option value="Root Cause Analysis Agent">RCA Agent</option>
                <option value="CAPA Formulation Agent">CAPA Formulation Agent</option>
                <option value="Quality Reviewer / Critic Agent">Reviewer Agent</option>
              </select>
            </div>
          </div>

          {/* Audit Trail Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3 font-semibold">Timestamp</th>
                  <th className="p-3 font-semibold">Agent</th>
                  <th className="p-3 font-semibold">Finding</th>
                  <th className="p-3 font-semibold">Human Decision</th>
                  <th className="p-3 font-semibold">Reviewer Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAuditTrail.map((entry) => {
                  let decisionColor = 'bg-slate-100 text-slate-700';
                  if (entry.humanDecision.includes('CONFIRMED') || entry.humanDecision.includes('APPROVED')) {
                    decisionColor = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
                  } else if (entry.humanDecision.includes('REJECTED') || entry.humanDecision.includes('REFUTED')) {
                    decisionColor = 'bg-rose-100 text-rose-800 border border-rose-300';
                  } else if (entry.humanDecision.includes('QUARANTINE')) {
                    decisionColor = 'bg-amber-100 text-amber-900 border border-amber-300';
                  } else if (entry.humanDecision.includes('RE-ANALYSIS')) {
                    decisionColor = 'bg-blue-100 text-blue-800 border border-blue-300';
                  }

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Timestamp */}
                      <td className="p-3 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{entry.timestamp ? entry.timestamp.replace('T', ' ').slice(0, 19) : 'Just now'}</span>
                        </div>
                      </td>

                      {/* Agent */}
                      <td className="p-3 whitespace-nowrap font-semibold text-slate-800">
                        {entry.agent}
                      </td>

                      {/* Finding */}
                      <td className="p-3 text-slate-700 max-w-xs font-sans leading-relaxed">
                        {entry.finding}
                      </td>

                      {/* Human Decision */}
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${decisionColor}`}>
                          {entry.humanDecision}
                        </span>
                      </td>

                      {/* Reviewer Comment */}
                      <td className="p-3 text-slate-600 max-w-sm italic font-sans leading-relaxed">
                        "{entry.reviewerComment}"
                        {entry.engineerName && (
                          <span className="block not-italic text-[10px] text-slate-400 font-mono mt-0.5">
                            — {entry.engineerName} {entry.licenseBadgeId ? `(${entry.licenseBadgeId})` : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 3: MULTI-AGENT WORKFLOW EXECUTION PANEL
         ------------------------------------------------------------- */}
      {activeTab === 'agents' && (
        <AgentExecutionPanel onOpenApprovalModal={onOpenApprovalModal} />
      )}

      {/* -------------------------------------------------------------
          TAB 4: ADVERSARIAL CRITIC AUDIT SCORECARD
         ------------------------------------------------------------- */}
      {activeTab === 'critic' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Overall Audit Score</div>
              <div className="text-3xl font-bold font-mono text-slate-900 mt-1">
                {review.auditScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                Compliant with ISO 9001 §10.2
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Statistical Rigor Score</div>
              <div className="text-3xl font-bold font-mono text-blue-700 mt-1">
                {review.statisticalRigorScore}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                ASTM E2587 n=5 Subgroups
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Confirmation Bias Risk</div>
              <div className="text-3xl font-bold font-mono text-amber-600 mt-1">
                {review.confirmationBiasRisk}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Adversarial multi-hypothesis test
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Reviewer Critic Verdict</div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-2 truncate">
                {review.verdict.replace(/_/g, ' ')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Awaiting Lead Quality Sign-off
              </div>
            </div>
          </div>

          {/* Critic Findings List */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Critic Auditor Findings ({review.findings.length})</h3>
            <div className="space-y-3">
              {review.findings.map((f) => (
                <div key={f.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{f.category}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-800 font-bold">
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-slate-700">{f.findingText}</p>
                  <p className="text-[11px] text-slate-500 italic">Recommendation: {f.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Comment Modal */}
      {customCommentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Add Quality Reviewer Audit Note</h3>
              <button
                onClick={() => setCustomCommentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCustomCommentSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Agent / Target Workflow Node
                </label>
                <input
                  type="text"
                  value={customAgent}
                  onChange={(e) => setCustomAgent(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Finding / Context
                </label>
                <input
                  type="text"
                  value={customFinding}
                  onChange={(e) => setCustomFinding(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Human Decision Action
                </label>
                <select
                  value={customDecision}
                  onChange={(e) => setCustomDecision(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-800 bg-white"
                >
                  <option value="COMMENT_RECORDED">COMMENT RECORDED</option>
                  <option value="RE-ANALYSIS REQUESTED">RE-ANALYSIS REQUESTED</option>
                  <option value="PHYSICAL INSPECTION ORDERED">PHYSICAL INSPECTION ORDERED</option>
                  <option value="QUARANTINE VERIFIED">QUARANTINE VERIFIED</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Reviewer Comment
                </label>
                <textarea
                  value={customCommentText}
                  onChange={(e) => setCustomCommentText(e.target.value)}
                  rows={3}
                  required
                  placeholder="Record formal quality engineering comment..."
                  className="w-full p-2 border border-slate-300 rounded text-xs text-slate-800 font-sans"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCustomCommentModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded cursor-pointer"
                >
                  Save Comment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
