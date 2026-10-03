import React, { useState, useEffect } from 'react';
import {
  QualityState,
  AgentExecutionRecord,
  AgentWorkflowStatus,
  WORKFLOW_PIPELINE_STEPS,
  createInitialQualityState,
  executeWorkflowStepById,
} from '../agents/multiAgentWorkflow';
import { EpistemicBadge } from './EpistemicBadge';
import {
  Play,
  RotateCcw,
  StepForward,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Cpu,
  Layers,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Terminal,
  Activity,
  Code2,
  ChevronDown,
  ChevronUp,
  Sliders,
  ExternalLink,
  Sparkles,
  UserCheck,
} from 'lucide-react';

interface Props {
  onOpenApprovalModal?: (
    title: string,
    entityType: 'BATCH' | 'CAPA' | 'ROOT_CAUSE' | 'QUARANTINE_RELEASE',
    entityId: string,
    defaultDecision?: 'APPROVED' | 'REJECTED' | 'QUARANTINED' | 'CONFIRMED',
    defaultNotes?: string
  ) => void;
  externalQualityState?: QualityState;
  onStateUpdate?: (newState: QualityState) => void;
}

export const AgentExecutionPanel: React.FC<Props> = ({
  onOpenApprovalModal,
  externalQualityState,
  onStateUpdate,
}) => {
  const [qualityState, setQualityState] = useState<QualityState>(
    () => externalQualityState || createInitialQualityState()
  );
  const [records, setRecords] = useState<AgentExecutionRecord[]>([]);
  const [currentRunningStepIndex, setCurrentRunningStepIndex] = useState<number | null>(null);
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);
  const [includeReviewer, setIncludeReviewer] = useState<boolean>(true);
  const [simulateErrorStep, setSimulateErrorStep] = useState<string>('none');
  const [activeTab, setActiveTab] = useState<'agents' | 'state' | 'audit'>('agents');
  const [expandedAgentIndex, setExpandedAgentIndex] = useState<number | null>(null);
  const [expandedStateKey, setExpandedStateKey] = useState<string | null>('dimensional_results');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AgentWorkflowStatus>('ALL');

  // Filter steps according to whether optional reviewer is enabled
  const activeSteps = WORKFLOW_PIPELINE_STEPS.filter(
    (s) => s.id !== 'reviewer' || includeReviewer
  );

  // Initialize records with Pending status
  const initializeRecords = (stateToUse: QualityState) => {
    const initialRecords: AgentExecutionRecord[] = activeSteps.map((step) => ({
      agentName: step.agentName,
      role: step.role,
      status: 'Pending' as AgentWorkflowStatus,
      input: `Awaiting upstream shared QualityState output...`,
      toolUsed: step.toolUsed,
      output: `Pending execution in sequential state pipeline.`,
      evidence: `[PENDING] Awaiting prior agent completion.`,
      executionTimeMs: 0,
      logicType: step.logicType,
      epistemicType:
        step.logicType === 'DETERMINISTIC_NUMERICAL'
          ? 'OBSERVED_FACT'
          : step.logicType === 'COMPUTER_VISION_ML'
          ? 'MODEL_PREDICTION'
          : step.logicType === 'LLM_REASONING'
          ? 'RCA_HYPOTHESIS'
          : 'STATISTICAL_FINDING',
      stepId: step.id,
    }));
    setRecords(initialRecords);
  };

  useEffect(() => {
    initializeRecords(qualityState);
  }, [includeReviewer]);

  // Reset workflow
  const handleReset = () => {
    setIsAutoRunning(false);
    setCurrentRunningStepIndex(null);
    const freshState = createInitialQualityState();
    setQualityState(freshState);
    if (onStateUpdate) onStateUpdate(freshState);
    initializeRecords(freshState);
  };

  // Run a single step
  const executeStep = async (
    stepIdx: number,
    stateContext: QualityState
  ): Promise<{ nextState: QualityState; success: boolean }> => {
    if (stepIdx < 0 || stepIdx >= activeSteps.length) {
      return { nextState: stateContext, success: false };
    }

    const step = activeSteps[stepIdx];

    // Mark current step as running
    setRecords((prev) => {
      const copy = [...prev];
      if (copy[stepIdx]) {
        copy[stepIdx] = {
          ...copy[stepIdx],
          status: 'Running',
        };
      }
      return copy;
    });
    setCurrentRunningStepIndex(stepIdx);

    // Realistic processing delay for animation
    const delay = step.logicType === 'LLM_REASONING' ? 450 : 250;
    await new Promise((r) => setTimeout(r, delay));

    const shouldSimulateError = simulateErrorStep === step.id;

    try {
      const result = await executeWorkflowStepById(step.id, stateContext, {
        simulateError: shouldSimulateError,
        engineerDecision: stateContext.human_decision,
      });

      const updatedRecords = [...records];
      updatedRecords[stepIdx] = result.record;
      setRecords((prev) => {
        const copy = [...prev];
        copy[stepIdx] = result.record;
        return copy;
      });

      setQualityState(result.state);
      if (onStateUpdate) onStateUpdate(result.state);

      const isSuccess = result.record.status !== 'Failed';
      return { nextState: result.state, success: isSuccess };
    } catch (err: any) {
      setRecords((prev) => {
        const copy = [...prev];
        if (copy[stepIdx]) {
          copy[stepIdx] = {
            ...copy[stepIdx],
            status: 'Failed',
            error: err.message || 'Execution failed',
            output: `Step execution failed: ${err.message}`,
          };
        }
        return copy;
      });
      return { nextState: stateContext, success: false };
    }
  };

  // Step Next button handler
  const handleStepNext = async () => {
    if (isAutoRunning) return;

    // Find first pending or running step
    const nextPendingIdx = records.findIndex((r) => r.status === 'Pending' || r.status === 'Running');
    if (nextPendingIdx !== -1) {
      await executeStep(nextPendingIdx, qualityState);
    } else {
      // If all completed, restart or notify
      alert('All workflow steps have already executed! Click "Reset Workflow" to run again.');
    }
  };

  // Run full workflow automatically
  const handleRunAll = async () => {
    if (isAutoRunning) return;
    setIsAutoRunning(true);

    let currentState = qualityState;
    // If all completed, reset first
    const anyPending = records.some((r) => r.status === 'Pending');
    if (!anyPending) {
      currentState = createInitialQualityState();
      setQualityState(currentState);
      initializeRecords(currentState);
      await new Promise((r) => setTimeout(r, 100));
    }

    for (let i = 0; i < activeSteps.length; i++) {
      const step = activeSteps[i];
      // Skip if already completed unless we reset
      if (records[i]?.status === 'Completed' && anyPending) {
        continue;
      }

      const { nextState, success } = await executeStep(i, currentState);
      currentState = nextState;

      // If failed, stop execution
      if (!success) {
        break;
      }

      // If at human review gate and not signed yet, stop for human sign-off
      if (step.id === 'human_review' && !currentState.human_decision.approved) {
        // Stop and prompt human approval
        break;
      }
    }

    setCurrentRunningStepIndex(null);
    setIsAutoRunning(false);
  };

  // Helper for status badge styling
  const renderStatusBadge = (status: AgentWorkflowStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Pending</span>
          </span>
        );
      case 'Running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-300 animate-pulse">
            <Activity className="w-3 h-3 text-blue-600 animate-spin" />
            <span>Running...</span>
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'Needs Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Needs Review</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Failed</span>
          </span>
        );
    }
  };

  // Logic tag renderer
  const renderLogicTag = (logicType: AgentExecutionRecord['logicType']) => {
    switch (logicType) {
      case 'DETERMINISTIC_NUMERICAL':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold" title="Deterministic Python / NumPy / SciPy scientific computation (No LLM)">
            DETERMINISTIC NUMERICAL (NO LLM)
          </span>
        );
      case 'COMPUTER_VISION_ML':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold" title="PyTorch / OpenCV ResNet50-FPN CNN Transfer Learning">
            COMPUTER VISION ML (PYTORCH)
          </span>
        );
      case 'LLM_REASONING':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold" title="Gemini 3.8 Flash Causal Reasoning over Verified Facts">
            LLM REASONING (GEMINI 3.8 FLASH)
          </span>
        );
      case 'ADVERSARIAL_AUDITING':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold" title="Independent Adversarial Critic Agent">
            ADVERSARIAL CRITIC AUDIT
          </span>
        );
      case 'HUMAN_SAFETY_GATE':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold" title="Mandatory Human Quality Engineer Gate">
            SAFETY-CRITICAL HUMAN GATE
          </span>
        );
    }
  };

  const filteredRecords = records.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <Cpu className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Multi-Agent Quality Workflow Orchestrator</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
                    LangGraph-Style State Machine
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Coordinating 7 specialized quality agents + optional Reviewer agent across shared state with deterministic/LLM segregation.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunAll}
              disabled={isAutoRunning}
              className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isAutoRunning ? 'Executing Pipeline...' : 'Run Full Workflow'}</span>
            </button>

            <button
              onClick={handleStepNext}
              disabled={isAutoRunning}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded transition-colors flex items-center gap-1.5 shadow-xs"
              title="Execute the next pending agent in the sequence"
            >
              <StepForward className="w-3.5 h-3.5 text-slate-600" />
              <span>Step Next</span>
            </button>

            <button
              onClick={handleReset}
              disabled={isAutoRunning}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded transition-colors flex items-center gap-1.5 shadow-xs"
              title="Reset shared state and all execution logs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset State</span>
            </button>

            {/* Optional Reviewer Toggle */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeReviewer}
                onChange={(e) => setIncludeReviewer(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Reviewer Agent</span>
            </label>

            {/* Error Simulation Selector */}
            <div className="flex items-center gap-1 border border-slate-200 rounded px-2 py-1 bg-slate-50 text-xs">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Simulate:</span>
              <select
                value={simulateErrorStep}
                onChange={(e) => setSimulateErrorStep(e.target.value)}
                className="text-xs font-mono bg-transparent text-slate-700 focus:outline-none"
              >
                <option value="none">Normal (Pass)</option>
                <option value="intake">Fail Intake (Data Missing)</option>
                <option value="vision">Fail Vision (Camera Glare)</option>
                <option value="dimensional">Fail Metrology (Calibration)</option>
                <option value="process">Fail Process (Sensor Loss)</option>
                <option value="spc">Fail SPC (Sample Minimum)</option>
                <option value="rca">Fail RCA (Vector DB Timeout)</option>
                <option value="capa">Fail CAPA (Missing Containment)</option>
              </select>
            </div>
          </div>
        </div>

        {/* WORKFLOW PIPELINE VISUALIZER (Horizontal Stepper) */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Sequential Workflow State Machine
            </span>
            <div className="text-[11px] font-mono text-slate-500">
              START → Intake → Visual Inspection → Dimensional Analysis → Process Monitoring → SPC → RCA → CAPA → Human Review → Effectiveness → Report
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin">
            {activeSteps.map((step, idx) => {
              const rec = records[idx];
              const status = rec?.status || 'Pending';
              const isCurrent = currentRunningStepIndex === idx;

              return (
                <React.Fragment key={step.id}>
                  <div
                    onClick={() => setExpandedAgentIndex(idx)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all shrink-0 ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-300'
                        : status === 'Completed'
                        ? 'border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50'
                        : status === 'Needs Review'
                        ? 'border-amber-300 bg-amber-50/50 hover:bg-amber-50'
                        : status === 'Failed'
                        ? 'border-rose-300 bg-rose-50/50 hover:bg-rose-50'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        status === 'Completed'
                          ? 'bg-emerald-600 text-white'
                          : status === 'Needs Review'
                          ? 'bg-amber-600 text-white'
                          : status === 'Failed'
                          ? 'bg-rose-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {step.stepNumber}
                    </div>

                    <div className="text-left">
                      <div className="font-semibold text-slate-800 text-[11px] whitespace-nowrap">
                        {step.displayName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                        {status}
                      </div>
                    </div>
                  </div>

                  {idx < activeSteps.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Human Safety Gate Alert Banner when Human Review Gate is reached */}
      {records.find((r) => r.stepId === 'human_review')?.status === 'Needs Review' && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Human Review Gate Active — ISO 9001:2015 §8.7 Safety Compliance
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Upstream agents have completed diagnostic reasoning. AI recommendations cannot autonomously release material or approve machine adjustments. Final sign-off by a licensed Quality Engineer is required.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (onOpenApprovalModal) {
                onOpenApprovalModal(
                  'Authorize Batch Disposition & 8D CAPA Authorization',
                  'BATCH',
                  qualityState.batch_data.batch_id || 'LOT-2026-AERO-08',
                  'APPROVED',
                  'Reviewed multi-agent inspection findings and approved quarantine/rework.'
                );
              }
            }}
            className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded shadow-xs shrink-0 flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Sign Disposition as Quality Engineer</span>
          </button>
        </div>
      )}

      {/* Navigation Tabs between Execution Panel, Shared State Inspector, and Audit Trail */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('agents')}
            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'agents'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Agent Execution Log Table ({records.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('state')}
            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'state'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Shared QualityState Inspector (13 Keys)</span>
          </button>
        </div>

        {/* Status Filter for Agent Table */}
        {activeTab === 'agents' && (
          <div className="flex items-center gap-2 pb-2">
            <span className="text-[11px] text-slate-500 font-medium">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Running">Running</option>
              <option value="Completed">Completed</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: AGENT EXECUTION PANEL */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          {/* Main Execution Table / Cards */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Agent Name</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4">Input</th>
                    <th className="py-3 px-4">Tool / Function Used</th>
                    <th className="py-3 px-4">Output</th>
                    <th className="py-3 px-4">Evidence</th>
                    <th className="py-3 px-3 text-right">Execution Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredRecords.map((record, idx) => {
                    const isExpanded = expandedAgentIndex === idx;

                    return (
                      <React.Fragment key={record.agentName + idx}>
                        <tr
                          onClick={() => setExpandedAgentIndex(isExpanded ? null : idx)}
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                            record.status === 'Running' ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          {/* Agent Name */}
                          <td className="py-3.5 px-4 font-medium text-slate-900 align-top">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{record.agentName}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {record.role}
                            </div>
                            <div className="mt-1.5">{renderLogicTag(record.logicType)}</div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3 align-top whitespace-nowrap">
                            {renderStatusBadge(record.status)}
                          </td>

                          {/* Input */}
                          <td className="py-3.5 px-4 text-slate-600 align-top max-w-xs">
                            <div className="line-clamp-2 text-xs leading-relaxed font-mono text-[11px]">
                              {record.input}
                            </div>
                          </td>

                          {/* Tool / Function Used */}
                          <td className="py-3.5 px-4 align-top max-w-xs">
                            <span className="font-mono text-[11px] text-blue-700 bg-blue-50/80 px-2 py-1 rounded border border-blue-200 block truncate">
                              {record.toolUsed}
                            </span>
                          </td>

                          {/* Output */}
                          <td className="py-3.5 px-4 text-slate-800 align-top max-w-sm">
                            <div className="line-clamp-2 text-xs leading-relaxed font-medium">
                              {record.output}
                            </div>
                            {record.error && (
                              <div className="mt-1 text-[11px] font-mono text-rose-600 font-bold">
                                Error: {record.error}
                              </div>
                            )}
                          </td>

                          {/* Evidence */}
                          <td className="py-3.5 px-4 align-top max-w-xs">
                            <div className="flex items-start gap-1.5 flex-col">
                              <EpistemicBadge type={record.epistemicType} size="sm" />
                              <span className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mt-1 font-mono">
                                {record.evidence}
                              </span>
                            </div>
                          </td>

                          {/* Execution Time */}
                          <td className="py-3.5 px-3 align-top text-right font-mono text-xs text-slate-500 whitespace-nowrap">
                            {record.executionTimeMs > 0 ? `${record.executionTimeMs} ms` : '—'}
                          </td>
                        </tr>

                        {/* Collapsible Expanded Details Drawer */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70 border-b border-slate-200">
                            <td colSpan={7} className="p-4 text-xs">
                              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">{record.agentName} Deep Inspection</span>
                                    <span className="text-slate-400 font-mono text-[10px]">({record.role})</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {renderStatusBadge(record.status)}
                                    <span className="font-mono text-slate-500 text-[11px]">
                                      Latency: {record.executionTimeMs} ms
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                      Full Input Specification
                                    </div>
                                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px] whitespace-pre-wrap">
                                      {record.input}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                      Deterministic Tool / API Function Invocation
                                    </div>
                                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-blue-800 font-mono text-[11px]">
                                      {record.toolUsed}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                      Detailed Agent Output
                                    </div>
                                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-800 text-[11px] leading-relaxed">
                                      {record.output}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                      Empirical Evidence & Epistemic Audit Classification
                                    </div>
                                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-2">
                                      <EpistemicBadge type={record.epistemicType} size="sm" />
                                      <p className="text-slate-700 font-mono text-[11px] leading-relaxed">
                                        {record.evidence}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHARED QUALITYSTATE INSPECTOR */}
      {activeTab === 'state' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Shared QualityState (Central LangGraph State Object)
              </h3>
              <p className="text-xs text-slate-500">
                Immutable state blackboard updated sequentially as data flows from Intake through RCA and CAPA to Human Review.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
              13 Shared State Keys
            </span>
          </div>

          {/* State Keys Accordion */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Keys Sidebar */}
            <div className="space-y-1 md:col-span-1 border-r border-slate-100 pr-2">
              {Object.keys(qualityState).map((key) => {
                const isSelected = expandedStateKey === key;
                const value = (qualityState as any)[key];
                const count = Array.isArray(value)
                  ? `${value.length} items`
                  : typeof value === 'object' && value !== null
                  ? `${Object.keys(value).length} props`
                  : typeof value;

                return (
                  <button
                    key={key}
                    onClick={() => setExpandedStateKey(key)}
                    className={`w-full text-left px-3 py-2 rounded text-xs font-mono transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{key}</span>
                    <span
                      className={`text-[10px] ${
                        isSelected ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Value Preview Panel */}
            <div className="md:col-span-3 bg-slate-950 text-slate-200 p-4 rounded-lg font-mono text-xs overflow-auto max-h-[500px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-emerald-400 font-bold">
                  QualityState.{expandedStateKey}
                </span>
                <span className="text-[10px] text-slate-500">JSON Payload</span>
              </div>
              <pre className="text-emerald-300 text-[11px] leading-relaxed">
                {expandedStateKey && (qualityState as any)[expandedStateKey]
                  ? JSON.stringify((qualityState as any)[expandedStateKey], null, 2)
                  : '// Key is empty or uninitialized'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
