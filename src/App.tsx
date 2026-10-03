import React, { useState, useEffect } from 'react';
import {
  ProductConfig,
  ProductionBatch,
  TelemetryPoint,
  VisualInspectionItem,
  QualityIncident,
  RcaAnalysis,
  CapaPlan,
  CapaActionItem,
  QualityReviewReport,
  EpistemicItem,
  SpcCalculationResult,
  HumanAuditEntry,
  CapaEffectivenessRecord,
  CapaEffectivenessRating,
} from './types';
import { Header } from './components/Header';
import { Sidebar, PageId } from './components/Sidebar';
import { HumanApprovalModal } from './components/HumanApprovalModal';
import { calculateSpcMetrics } from './agents/spcEngine';

// Seed Mock Data
import {
  INITIAL_PRODUCTS,
  INITIAL_BATCHES,
  GENERATE_MOCK_TELEMETRY,
  SAMPLE_SPC_SUBGROUPS_DATA,
  INITIAL_VISUAL_INSPECTION_ITEMS,
  INITIAL_INCIDENT,
  INITIAL_RCA_ANALYSIS,
  INITIAL_CAPA_PLAN,
  INITIAL_CRITIC_REVIEW,
  INITIAL_EPISTEMIC_LEDGER,
  INITIAL_HUMAN_AUDIT_TRAIL,
  INITIAL_EFFECTIVENESS_MONITORING,
} from './data/mockManufacturingData';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { ProductConfigPage } from './pages/ProductConfigPage';
import { BatchesPage } from './pages/BatchesPage';
import { InspectionCenterPage } from './pages/InspectionCenterPage';
import { VisualInspectionPage } from './pages/VisualInspectionPage';
import { ProcessMonitoringPage } from './pages/ProcessMonitoringPage';
import { SpcDashboardPage } from './pages/SpcDashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { RcaPage } from './pages/RcaPage';
import { CapaPage } from './pages/CapaPage';
import { AiReviewPage } from './pages/AiReviewPage';
import { ReportsPage } from './pages/ReportsPage';
import { TestResultsPage } from './pages/TestResultsPage';
import { AgentExecutionPanel } from './components/AgentExecutionPanel';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [activeLine, setActiveLine] = useState<string>('CNC Line A-1 (Mori Seiki 5-Axis)');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Domain State
  const [products, setProducts] = useState<ProductConfig[]>(INITIAL_PRODUCTS);
  const [batches, setBatches] = useState<ProductionBatch[]>(INITIAL_BATCHES);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>(GENERATE_MOCK_TELEMETRY());
  const [visualItems, setVisualItems] = useState<VisualInspectionItem[]>(INITIAL_VISUAL_INSPECTION_ITEMS);
  const [incidents, setIncidents] = useState<QualityIncident[]>([INITIAL_INCIDENT]);
  const [rca, setRca] = useState<RcaAnalysis>(INITIAL_RCA_ANALYSIS);
  const [capa, setCapa] = useState<CapaPlan>(INITIAL_CAPA_PLAN);
  const [criticReview, setCriticReview] = useState<QualityReviewReport>(INITIAL_CRITIC_REVIEW);
  const [epistemicLedger, setEpistemicLedger] = useState<EpistemicItem[]>(INITIAL_EPISTEMIC_LEDGER);
  const [auditTrail, setAuditTrail] = useState<HumanAuditEntry[]>(INITIAL_HUMAN_AUDIT_TRAIL);
  const [effectiveness, setEffectiveness] = useState<CapaEffectivenessRecord>(INITIAL_EFFECTIVENESS_MONITORING);

  // Deterministic SPC State (Bore ID of PRD-AERO-701)
  const [spcData, setSpcData] = useState<SpcCalculationResult>(() =>
    calculateSpcMetrics(
      SAMPLE_SPC_SUBGROUPS_DATA,
      85.000,
      85.015,
      84.985,
      'Bore Inner Diameter',
      'mm'
    )
  );

  // Human Approval Modal State
  const [approvalModalState, setApprovalModalState] = useState<{
    isOpen: boolean;
    title: string;
    entityType: 'BATCH' | 'CAPA' | 'ROOT_CAUSE' | 'QUARANTINE_RELEASE';
    entityId: string;
    defaultDecision?: 'APPROVED' | 'REJECTED' | 'QUARANTINED' | 'CONFIRMED';
    defaultNotes?: string;
  }>({
    isOpen: false,
    title: '',
    entityType: 'BATCH',
    entityId: '',
  });

  // Fetch live sync from full-stack server on mount
  useEffect(() => {
    fetch('/api/data')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('API offline');
      })
      .then((data) => {
        if (data.products) setProducts(data.products);
        if (data.batches) setBatches(data.batches);
        if (data.telemetry) setTelemetry(data.telemetry);
        if (data.visualItems) setVisualItems(data.visualItems);
        if (data.incidents) setIncidents(data.incidents);
        if (data.rcaAnalyses && data.rcaAnalyses[0]) setRca(data.rcaAnalyses[0]);
        if (data.capaPlans && data.capaPlans[0]) setCapa(data.capaPlans[0]);
        if (data.criticReviews && data.criticReviews[0]) setCriticReview(data.criticReviews[0]);
        if (data.effectiveness) setEffectiveness(data.effectiveness);
        if (data.epistemicLedger) setEpistemicLedger(data.epistemicLedger);
        if (data.humanAuditTrail) setAuditTrail(data.humanAuditTrail);
      })
      .catch((err) => {
        console.log('Running with local in-memory fallback state:', err);
      });
  }, []);

  // Handlers for Human Quality Engineer Sign-Off Gate
  const handleOpenApprovalModal = (
    title: string,
    entityType: 'BATCH' | 'CAPA' | 'ROOT_CAUSE' | 'QUARANTINE_RELEASE',
    entityId: string,
    defaultDecision: 'APPROVED' | 'REJECTED' | 'QUARANTINED' | 'CONFIRMED' = 'APPROVED',
    defaultNotes = ''
  ) => {
    setApprovalModalState({
      isOpen: true,
      title,
      entityType,
      entityId,
      defaultDecision,
      defaultNotes,
    });
  };

  const handleConfirmApproval = async (payload: {
    engineerName: string;
    licenseBadgeId: string;
    decision: 'APPROVED' | 'REJECTED' | 'QUARANTINED' | 'CONFIRMED';
    notes: string;
    digitalSignatureToken: string;
  }) => {
    const timestamp = new Date().toISOString();

    // Call backend API if online
    try {
      await fetch('/api/human-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId: approvalModalState.entityId,
          entityType: approvalModalState.entityType,
          decision: payload.decision,
          engineerName: payload.engineerName,
          licenseBadgeId: payload.licenseBadgeId,
          notes: payload.notes,
          digitalSignatureToken: payload.digitalSignatureToken,
        }),
      });
    } catch (e) {
      console.warn('Backend approval dispatch notice:', e);
    }

    // Update Client State
    if (approvalModalState.entityType === 'BATCH') {
      setBatches((prev) =>
        prev.map((b) =>
          b.id === approvalModalState.entityId
            ? {
                ...b,
                status: payload.decision === 'APPROVED' ? 'PASSED' : (payload.decision === 'QUARANTINED' ? 'QUARANTINED' : 'ACTIVE'),
                humanSignOff: {
                  approvedBy: payload.engineerName,
                  role: `Staff Quality Metrologist (${payload.licenseBadgeId})`,
                  timestamp,
                  status: payload.decision === 'APPROVED' ? 'APPROVED' : (payload.decision === 'QUARANTINED' ? 'QUARANTINED' : 'REJECTED'),
                  notes: payload.notes,
                },
              }
            : b
        )
      );
    }

    if (approvalModalState.entityType === 'CAPA') {
      setCapa((prev) => ({
        ...prev,
        status: payload.decision === 'APPROVED' ? 'APPROVED' : 'DRAFT',
        humanApproval: {
          approved: payload.decision === 'APPROVED',
          engineerName: payload.engineerName,
          licenseBadgeId: payload.licenseBadgeId,
          timestamp,
          comments: payload.notes,
          signatureDigitalToken: payload.digitalSignatureToken,
        },
      }));
    }

    if (approvalModalState.entityType === 'ROOT_CAUSE') {
      setRca((prev) => ({
        ...prev,
        hypotheses: prev.hypotheses.map((h) =>
          h.id === approvalModalState.entityId
            ? {
                ...h,
                status: payload.decision === 'CONFIRMED' ? 'CONFIRMED_ROOT_CAUSE' : 'REFUTED',
                epistemicType: payload.decision === 'CONFIRMED' ? 'CONFIRMED_ROOT_CAUSE' : 'RCA_HYPOTHESIS',
                confirmedBy: payload.engineerName,
                confirmedAt: timestamp,
                verificationNotes: payload.notes,
              }
            : h
        ),
      }));

      // Elevate in global epistemic ledger
      setEpistemicLedger((prev) => [
        {
          id: `ep-${Date.now()}`,
          type: payload.decision === 'CONFIRMED' ? 'CONFIRMED_ROOT_CAUSE' : 'OBSERVED_FACT',
          title: `Root Cause Physical Confirmation: ${payload.notes.slice(0, 50)}...`,
          detail: payload.notes,
          source: `${payload.engineerName} (${payload.licenseBadgeId})`,
          timestamp,
          verifiedBy: payload.engineerName,
          verifiedAt: timestamp,
        },
        ...prev,
      ]);
    }

    // Record into Human Audit Trail
    const auditFinding =
      approvalModalState.entityType === 'BATCH'
        ? `Lot Disposition Check: ${approvalModalState.title}`
        : approvalModalState.entityType === 'CAPA'
        ? `CAPA Authorization: ${approvalModalState.title}`
        : `Root Cause Physical Sign-Off: ${approvalModalState.title}`;

    const newAuditEntry: HumanAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp,
      agent:
        approvalModalState.entityType === 'CAPA'
          ? 'CAPA Formulation Agent'
          : approvalModalState.entityType === 'ROOT_CAUSE'
          ? 'Root Cause Analysis Agent'
          : 'Dimensional Compliance Agent',
      finding: auditFinding,
      humanDecision: payload.decision,
      reviewerComment: payload.notes || `${payload.decision} confirmed by authorized Quality Engineer.`,
      engineerName: payload.engineerName,
      licenseBadgeId: payload.licenseBadgeId,
      entityId: approvalModalState.entityId,
      entityType: approvalModalState.entityType === 'ROOT_CAUSE' ? 'ROOT_CAUSE' : (approvalModalState.entityType === 'CAPA' ? 'CAPA' : 'BATCH'),
    };
    setAuditTrail((prev) => [newAuditEntry, ...prev]);
  };

  // RCA Agentic Reasoning invocation
  const handleTriggerRcaReasoning = async (prompt?: string) => {
    try {
      const res = await fetch('/api/agent/rca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: incidents[0]?.id || 'inc-001',
          batchId: batches[0]?.id || 'batch-001',
          userPrompt: prompt,
        }),
      });
      if (res.ok) {
        const updatedRca = await res.json();
        setRca(updatedRca);
      }
    } catch (err) {
      console.warn('RCA agent fetch:', err);
    }
  };

  // Visual verdict update
  const handleUpdateVisualVerdict = async (
    itemId: string,
    verdict: 'CONFIRMED_DEFECT' | 'FALSE_POSITIVE' | 'PASSED_OVERRIDE',
    notes: string
  ) => {
    try {
      await fetch('/api/vision/verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visualItemId: itemId,
          verdict,
          inspectorName: 'Dr. Marcus Sterling (Lead QA)',
          notes,
        }),
      });
    } catch (e) {
      console.warn('Visual verdict dispatch:', e);
    }

    setVisualItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              humanVerdict: verdict,
              humanInspector: 'Dr. Marcus Sterling (Lead QA)',
              inspectionNotes: notes,
              status: verdict === 'PASSED_OVERRIDE' ? 'CONFORMING' : 'NON_CONFORMING',
            }
          : item
      )
    );
  };

  // Incident creation
  const handleCreateIncident = async (newInc: Partial<QualityIncident>) => {
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInc),
      });
      if (res.ok) {
        const created = await res.json();
        setIncidents((prev) => [created, ...prev]);
        return;
      }
    } catch (e) {
      console.warn('Incident create dispatch:', e);
    }

    const fallbackInc: QualityIncident = {
      id: `inc-${Date.now()}`,
      incidentCode: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      batchId: newInc.batchId || 'LOT-2026-AERO-08',
      productCode: 'PRD-AERO-701',
      lineId: 'CNC Line A-1 (Mori Seiki 5-Axis)',
      severity: newInc.severity || 'HIGH',
      status: 'INVESTIGATING',
      title: newInc.title || 'Shopfloor Nonconformance',
      description: newInc.description || 'Logged by Quality Engineer.',
      observedFacts: ['Sensor log anomaly recorded.'],
      immediateContainment: 'Quarantine lot and halt machining cell.',
      affectedUnitsCount: 14,
      scrapCostEstimateUsd: 28000,
    };
    setIncidents((prev) => [fallbackInc, ...prev]);
  };

  // Add Action Item to CAPA
  const handleAddCapaAction = (newAct: any) => {
    const act = {
      id: `act-${Date.now()}`,
      ...newAct,
    };
    setCapa((prev) => ({
      ...prev,
      actions: [...prev.actions, act],
    }));
  };

  // Update Status of individual CAPA Action
  const handleUpdateCapaActionStatus = (actionId: string, status: any) => {
    const timestamp = new Date().toISOString().substring(0, 10);
    setCapa((prev) => ({
      ...prev,
      actions: prev.actions.map((act) =>
        act.id === actionId || act.actionId === actionId
          ? {
              ...act,
              status,
              completionDate: status === 'COMPLETED' ? timestamp : act.completionDate,
            }
          : act
      ),
    }));
  };

  // Agentic CAPA Formulation from RCA Findings
  const handleTriggerCapaGeneration = async () => {
    try {
      const res = await fetch('/api/agent/capa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: incidents[0]?.id || 'inc-001',
          rcaId: rca.id || 'rca-001',
          batchId: batches[0]?.id || 'batch-001',
        }),
      });
      if (res.ok) {
        const generated = await res.json();
        setCapa(generated);
      }
    } catch (e) {
      console.warn('CAPA generation fallback:', e);
    }
  };

  // 1. Confirm Defect (Quality Engineer Decision Gate)
  const handleConfirmDefect = async (itemId: string, comment: string) => {
    const item = visualItems.find((v) => v.id === itemId);
    const partNo = item?.partSerialNumber || itemId;
    const defectNames = item?.defects?.map((d) => `${d.defectClass} (${(d.confidence * 100).toFixed(1)}%)`).join(', ') || 'Visual surface defect';
    await handleUpdateVisualVerdict(itemId, 'CONFIRMED_DEFECT', comment);
    const newEntry: HumanAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agent: 'Visual Inspection Agent',
      finding: `Surface anomaly on ${partNo}: ${defectNames}`,
      humanDecision: 'CONFIRMED DEFECT',
      reviewerComment: comment,
      engineerName: 'Dr. Marcus Sterling',
      licenseBadgeId: 'QA-88214',
      entityId: itemId,
      entityType: 'DEFECT',
    };
    setAuditTrail((prev) => [newEntry, ...prev]);
  };

  // 2. Reject Defect (Quality Engineer Decision Gate)
  const handleRejectDefect = async (itemId: string, comment: string) => {
    const item = visualItems.find((v) => v.id === itemId);
    const partNo = item?.partSerialNumber || itemId;
    await handleUpdateVisualVerdict(itemId, 'FALSE_POSITIVE', comment);
    const newEntry: HumanAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agent: 'Visual Inspection Agent',
      finding: `Inspection item ${partNo}`,
      humanDecision: 'REJECTED (FALSE POSITIVE)',
      reviewerComment: comment,
      engineerName: 'Dr. Marcus Sterling',
      licenseBadgeId: 'QA-88214',
      entityId: itemId,
      entityType: 'DEFECT',
    };
    setAuditTrail((prev) => [newEntry, ...prev]);
  };

  // 3. Confirm RCA Hypothesis into Confirmed Root Cause
  const handleConfirmRcaHypothesis = async (hypothesisId: string, comment: string) => {
    const hypo = rca.hypotheses.find((h) => h.id === hypothesisId);
    const hypoText = hypo?.hypothesis || hypo?.hypothesisStatement || hypothesisId;
    const timestamp = new Date().toISOString();

    setRca((prev) => ({
      ...prev,
      hypotheses: prev.hypotheses.map((h) =>
        h.id === hypothesisId
          ? {
              ...h,
              status: 'CONFIRMED_ROOT_CAUSE',
              epistemicType: 'CONFIRMED_ROOT_CAUSE',
              confirmedBy: 'Dr. Marcus Sterling',
              confirmedAt: timestamp,
              verificationNotes: comment,
            }
          : h
      ),
    }));

    const newEntry: HumanAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp,
      agent: 'Root Cause Analysis Agent',
      finding: `Hypothesis: ${hypoText}`,
      humanDecision: 'CONFIRMED ROOT CAUSE',
      reviewerComment: comment,
      engineerName: 'Dr. Marcus Sterling',
      licenseBadgeId: 'QA-88214',
      entityId: hypothesisId,
      entityType: 'ROOT_CAUSE',
    };
    setAuditTrail((prev) => [newEntry, ...prev]);
  };

  // 4. Reject RCA Hypothesis
  const handleRejectRcaHypothesis = async (hypothesisId: string, comment: string) => {
    const hypo = rca.hypotheses.find((h) => h.id === hypothesisId);
    const hypoText = hypo?.hypothesis || hypo?.hypothesisStatement || hypothesisId;
    const timestamp = new Date().toISOString();

    setRca((prev) => ({
      ...prev,
      hypotheses: prev.hypotheses.map((h) =>
        h.id === hypothesisId
          ? {
              ...h,
              status: 'REFUTED',
              epistemicType: 'RCA_HYPOTHESIS',
              verificationNotes: comment,
            }
          : h
      ),
    }));

    const newEntry: HumanAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp,
      agent: 'Root Cause Analysis Agent',
      finding: `Hypothesis: ${hypoText}`,
      humanDecision: 'REJECTED ROOT CAUSE',
      reviewerComment: comment,
      engineerName: 'Dr. Marcus Sterling',
      licenseBadgeId: 'QA-88214',
      entityId: hypothesisId,
      entityType: 'ROOT_CAUSE',
    };
    setAuditTrail((prev) => [newEntry, ...prev]);
  };

  // 5. Request Re-Analysis
  const handleRequestReAnalysis = async (targetEntity: string, comment: string) => {
    const timestamp = new Date().toISOString();
    const newEntry: HumanAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp,
      agent: 'Quality Reviewer / Critic Agent',
      finding: `Re-analysis requested for: ${targetEntity}`,
      humanDecision: 'REQUESTED RE-ANALYSIS',
      reviewerComment: comment,
      engineerName: 'Dr. Marcus Sterling',
      licenseBadgeId: 'QA-88214',
      entityId: targetEntity,
      entityType: 'RE_ANALYSIS',
    };
    setAuditTrail((prev) => [newEntry, ...prev]);
    await handleTriggerRcaReasoning(comment);
  };

  // 6. Approve CAPA Plan
  const handleApproveCapa = async (capaId: string, comment: string) => {
    const timestamp = new Date().toISOString();
    setCapa((prev) => ({
      ...prev,
      status: 'APPROVED',
      humanApproval: {
        approved: true,
        engineerName: 'Dr. Marcus Sterling',
        licenseBadgeId: 'QA-88214',
        timestamp,
        comments: comment,
        signatureDigitalToken: `SIG-SHA256-${Date.now().toString(36).toUpperCase()}`,
      },
    }));

    const newEntry: HumanAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp,
      agent: 'CAPA Formulation Agent',
      finding: `CAPA Plan ${capa.id}: ${capa.title}`,
      humanDecision: 'APPROVED CAPA',
      reviewerComment: comment,
      engineerName: 'Dr. Marcus Sterling',
      licenseBadgeId: 'QA-88214',
      entityId: capaId,
      entityType: 'CAPA',
    };
    setAuditTrail((prev) => [newEntry, ...prev]);
  };

  // 7. Reject CAPA Plan
  const handleRejectCapa = async (capaId: string, comment: string) => {
    const timestamp = new Date().toISOString();
    setCapa((prev) => ({
      ...prev,
      status: 'DRAFT',
      humanApproval: {
        approved: false,
        engineerName: 'Dr. Marcus Sterling',
        licenseBadgeId: 'QA-88214',
        timestamp,
        comments: comment,
        signatureDigitalToken: `REJECT-${Date.now().toString(36).toUpperCase()}`,
      },
    }));

    const newEntry: HumanAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp,
      agent: 'CAPA Formulation Agent',
      finding: `CAPA Plan ${capa.id}: ${capa.title}`,
      humanDecision: 'REJECTED CAPA',
      reviewerComment: comment,
      engineerName: 'Dr. Marcus Sterling',
      licenseBadgeId: 'QA-88214',
      entityId: capaId,
      entityType: 'CAPA',
    };
    setAuditTrail((prev) => [newEntry, ...prev]);
  };

  // 8. Add Reviewer Comment / Note
  const handleAddAuditComment = async (agent: string, finding: string, decision: string, comment: string) => {
    const newEntry: HumanAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agent,
      finding,
      humanDecision: decision,
      reviewerComment: comment,
      engineerName: 'Dr. Marcus Sterling',
      licenseBadgeId: 'QA-88214',
    };
    setAuditTrail((prev) => [newEntry, ...prev]);
  };

  // 9. Update CAPA Effectiveness Evaluation
  const handleUpdateEffectiveness = (
    rating: CapaEffectivenessRating,
    notes: string,
    engName: string,
    badgeId: string
  ) => {
    const timestamp = new Date().toISOString();
    setEffectiveness((prev) => ({
      ...prev,
      humanEvaluation: {
        rating,
        engineerName: engName,
        licenseBadgeId: badgeId,
        timestamp,
        notes,
        digitalSignature: `SIG-SHA256-${badgeId.replace(/[^A-Z0-9]/gi, '')}-${Date.now().toString().slice(-6)}`,
      },
    }));

    const newEntry: HumanAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp,
      agent: 'CAPA Effectiveness Monitoring Agent',
      finding: `CAPA Effectiveness Evaluated: ${rating} (Rejection ${effectiveness.beforeStats.rejectionRate}% → ${effectiveness.afterStats.rejectionRate}%)`,
      humanDecision: rating.toUpperCase(),
      reviewerComment: notes,
      engineerName: engName,
      licenseBadgeId: badgeId,
      entityId: effectiveness.capaId,
      entityType: 'CAPA',
    };
    setAuditTrail((prev) => [newEntry, ...prev]);
  };

  // 10. Recurrence Detection & Incident Creation
  const handleCreateRecurrenceIncident = (payload: {
    title: string;
    description: string;
    batchId: string;
    severity: 'HIGH' | 'CRITICAL';
    observedFacts: string[];
    immediateContainment: string;
  }) => {
    const timestamp = new Date().toISOString();
    const newInc: QualityIncident = {
      id: `inc-${Date.now().toString().slice(-4)}`,
      incidentCode: `INC-2026-REC-0${Math.floor(1 + Math.random() * 9)}`,
      timestamp,
      batchId: payload.batchId,
      productCode: 'PRD-AERO-701',
      lineId: 'CNC Line A-1 (Mori Seiki 5-Axis)',
      severity: payload.severity || 'HIGH',
      status: 'INVESTIGATING',
      title: payload.title,
      description: payload.description,
      observedFacts: payload.observedFacts,
      immediateContainment: payload.immediateContainment,
      affectedUnitsCount: 4,
      scrapCostEstimateUsd: 18000,
      capaId: capa.id,
      rootCauseId: rca.id,
    };

    setIncidents((prev) => [newInc, ...prev]);

    // Also update batches status if matching batch exists
    setBatches((prev) =>
      prev.map((b) =>
        b.batchNumber === payload.batchId || b.id === payload.batchId
          ? { ...b, status: 'QUARANTINED', quarantinedUnits: 4 }
          : b
      )
    );

    // Record audit trail
    const auditEntry: HumanAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp,
      agent: 'Recurrence Detection Engine',
      finding: `Recurrence Detected on Batch ${payload.batchId}: Created Incident ${newInc.incidentCode}`,
      humanDecision: 'ESCALATED RECURRENCE',
      reviewerComment: `Immediate line halt and quarantine applied following post-CAPA defect recurrence.`,
      engineerName: 'Dr. Marcus Sterling',
      licenseBadgeId: 'ASQ-CQE-84912',
      entityId: newInc.id,
      entityType: 'DEFECT',
    };
    setAuditTrail((prev) => [auditEntry, ...prev]);
  };

  // Rerun Critic Audit
  const handleRerunAudit = async () => {
    try {
      const res = await fetch('/api/agent/critic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId: incidents[0]?.id || 'inc-001' }),
      });
      if (res.ok) {
        const rep = await res.json();
        setCriticReview(rep);
      }
    } catch (e) {
      console.warn('Critic audit rerun notice:', e);
    }
  };

  // Create Batch
  const handleCreateBatch = (newB: Partial<ProductionBatch>) => {
    const batch: ProductionBatch = {
      id: `batch-${Date.now()}`,
      batchNumber: newB.batchNumber || `LOT-2026-PROD-${Math.floor(10 + Math.random() * 90)}`,
      productCode: newB.productCode || 'PRD-AERO-701',
      productName: newB.productName || 'Aerospace High-Pressure Turbine Spindle Housing',
      lineId: newB.lineId || 'CNC Line A-1 (Mori Seiki 5-Axis)',
      material: newB.material || 'Inconel 718 Superalloy',
      shift: newB.shift || 'Shift 1 (Day 06:00 - 14:00)',
      startTime: newB.startTime || new Date().toISOString(),
      endTime: newB.endTime,
      totalUnits: newB.totalUnits || 100,
      inspectedUnits: newB.inspectedUnits || 0,
      passedUnits: newB.passedUnits || 0,
      quarantinedUnits: newB.quarantinedUnits || 0,
      defectCount: newB.defectCount || 0,
      yieldPercentage: newB.yieldPercentage ?? 100,
      status: newB.status || 'ACTIVE',
      operatorId: newB.operatorId || 'OP-442 (K. Vance)',
    };
    setBatches((prev) => [batch, ...prev]);
  };

  // Recalculate SPC
  const handleRecalculateSpc = (customData?: number[][]) => {
    const dataToUse = customData || SAMPLE_SPC_SUBGROUPS_DATA;
    const computed = calculateSpcMetrics(dataToUse, 85.000, 85.015, 84.985, 'Bore Inner Diameter', 'mm');
    setSpcData(computed);
  };

  const lines = [
    'CNC Line A-1 (Mori Seiki 5-Axis)',
    'Micro-EDM Cell B-3',
    'Cellular Cleanroom Line D-2',
    'High-Speed Grinding Cell C-4',
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        activeLine={activeLine}
        onSelectLine={setActiveLine}
        lines={lines}
        onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      {/* Main Body with Sidebar + Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Navigation */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => {
            setCurrentPage(page);
            setIsMobileSidebarOpen(false);
          }}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          counts={{
            incidents: incidents.filter((i) => i.status !== 'CLOSED').length,
            quarantinedBatches: batches.filter((b) => b.status === 'QUARANTINED').length,
            pendingCapa: capa.status === 'PENDING_APPROVAL' ? 1 : 0,
            spcViolations: spcData.activeViolations.length,
          }}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {currentPage === 'dashboard' && (
            <DashboardPage
              batches={batches}
              incidents={incidents}
              spcData={spcData}
              epistemicLedger={epistemicLedger}
              telemetry={telemetry}
              capa={capa}
              visualItems={visualItems}
              rca={rca}
              onNavigate={setCurrentPage}
              onOpenApprovalModal={handleOpenApprovalModal}
            />
          )}

          {currentPage === 'agent-workflow' && (
            <AgentExecutionPanel
              onOpenApprovalModal={handleOpenApprovalModal}
            />
          )}

          {currentPage === 'product-config' && (
            <ProductConfigPage products={products} />
          )}

          {currentPage === 'batches' && (
            <BatchesPage
              batches={batches}
              onCreateBatch={handleCreateBatch}
              onOpenApprovalModal={handleOpenApprovalModal}
            />
          )}

          {currentPage === 'inspection-center' && (
            <InspectionCenterPage
              batches={batches}
              visualItems={visualItems}
              spcData={spcData}
              onOpenApprovalModal={handleOpenApprovalModal}
            />
          )}

          {currentPage === 'visual-inspection' && (
            <VisualInspectionPage
              visualItems={visualItems}
              onUpdateVerdict={handleUpdateVisualVerdict}
              onOpenApprovalModal={handleOpenApprovalModal}
            />
          )}

          {currentPage === 'process-monitoring' && (
            <ProcessMonitoringPage telemetry={telemetry} />
          )}

          {currentPage === 'spc-dashboard' && (
            <SpcDashboardPage
              spcData={spcData}
              onRecalculate={handleRecalculateSpc}
            />
          )}

          {currentPage === 'incidents' && (
            <IncidentsPage
              incidents={incidents}
              onNavigate={setCurrentPage}
              onCreateIncident={handleCreateIncident}
            />
          )}

          {currentPage === 'rca' && (
            <RcaPage
              rca={rca}
              incidents={incidents}
              onTriggerRcaReasoning={handleTriggerRcaReasoning}
              onOpenApprovalModal={handleOpenApprovalModal}
            />
          )}

          {currentPage === 'capa' && (
            <CapaPage
              capa={capa}
              effectiveness={effectiveness}
              onOpenApprovalModal={handleOpenApprovalModal}
              onAddAction={handleAddCapaAction}
              onTriggerCapaGeneration={handleTriggerCapaGeneration}
              onUpdateActionStatus={handleUpdateCapaActionStatus}
              onUpdateEffectiveness={handleUpdateEffectiveness}
              onCreateRecurrenceIncident={handleCreateRecurrenceIncident}
              onNavigateToIncidents={() => setCurrentPage('incidents')}
            />
          )}

          {currentPage === 'ai-review' && (
            <AiReviewPage
              review={criticReview}
              auditTrail={auditTrail}
              visualItems={visualItems}
              rca={rca}
              capa={capa}
              onConfirmDefect={handleConfirmDefect}
              onRejectDefect={handleRejectDefect}
              onConfirmRcaHypothesis={handleConfirmRcaHypothesis}
              onRejectRcaHypothesis={handleRejectRcaHypothesis}
              onRequestReAnalysis={handleRequestReAnalysis}
              onApproveCapa={handleApproveCapa}
              onRejectCapa={handleRejectCapa}
              onAddComment={handleAddAuditComment}
              onRerunAudit={handleRerunAudit}
              onOpenApprovalModal={handleOpenApprovalModal}
            />
          )}

          {currentPage === 'reports' && (
            <ReportsPage
              incident={incidents[0] || INITIAL_INCIDENT}
              rca={rca}
              capa={capa}
              batch={batches[0] || INITIAL_BATCHES[0]}
              spcData={spcData}
              product={products[0]}
              visualItems={visualItems}
              telemetry={telemetry}
              effectiveness={effectiveness}
              auditTrail={auditTrail}
            />
          )}

          {currentPage === 'test-results' && <TestResultsPage />}
        </main>
      </div>

      {/* Global Human Approval Modal */}
      <HumanApprovalModal
        isOpen={approvalModalState.isOpen}
        onClose={() => setApprovalModalState((prev) => ({ ...prev, isOpen: false }))}
        title={approvalModalState.title}
        entityType={approvalModalState.entityType}
        entityId={approvalModalState.entityId}
        defaultDecision={approvalModalState.defaultDecision}
        defaultNotes={approvalModalState.defaultNotes}
        onConfirm={handleConfirmApproval}
      />
    </div>
  );
}
