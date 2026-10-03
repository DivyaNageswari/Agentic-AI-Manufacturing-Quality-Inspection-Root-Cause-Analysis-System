import React, { useState, useMemo } from 'react';
import type { RcaAnalysis, QualityIncident, RcaHypothesis, KnowledgeRecordType } from '../types/index.ts';
import { FiveWhysTree } from '../components/FiveWhysTree.tsx';
import { FishboneDiagram } from '../components/FishboneDiagram.tsx';
import { EpistemicBadge } from '../components/EpistemicBadge.tsx';
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Beaker,
  Database,
  History,
  FileSignature,
  Layers,
  Wrench,
  Flame,
  Activity,
  Gauge,
  Microscope,
  Info,
  Clock,
  ShieldCheck,
  HelpCircle,
  BookOpen,
  RotateCcw,
  Zap,
} from 'lucide-react';
import {
  SYNTHETIC_QUALITY_KNOWLEDGE_BASE,
  retrieveSimilarIncidents,
  generateRetrievalQuery,
} from '../agents/ragFaissEngine.ts';

interface Props {
  rca: RcaAnalysis;
  incidents: QualityIncident[];
  onTriggerRcaReasoning: (prompt?: string) => Promise<void>;
  onOpenApprovalModal: (
    title: string,
    entityType: any,
    entityId: string,
    defaultDecision?: any,
    defaultNotes?: string
  ) => void;
}

export const RcaPage: React.FC<Props> = ({
  rca,
  incidents,
  onTriggerRcaReasoning,
  onOpenApprovalModal,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'hypotheses' | 'evidence' | 'rag' | 'fiveWhys' | 'fishbone'>('all');
  const [ragQuery, setRagQuery] = useState(
    'Inconel 718 bore oversize coolant thermal drift chiller swarf cutting chatter tool wear'
  );
  const [selectedRecordType, setSelectedRecordType] = useState<KnowledgeRecordType | 'ALL'>('ALL');
  const [userPrompt, setUserPrompt] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const activeIncident = incidents.find((i) => i.id === rca.incidentId) || incidents[0];

  const handleRunAgent = async () => {
    setIsSynthesizing(true);
    try {
      await onTriggerRcaReasoning(userPrompt);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Live FAISS Vector Retrieval (Cosine Similarity)
  const liveRagMatches = useMemo(() => {
    if (ragQuery.trim()) {
      return retrieveSimilarIncidents(
        ragQuery,
        6,
        selectedRecordType === 'ALL' ? undefined : selectedRecordType
      );
    }
    return rca.ragMatches.filter((m) =>
      selectedRecordType === 'ALL' ? true : m.recordType === selectedRecordType
    );
  }, [ragQuery, selectedRecordType, rca.ragMatches]);

  // Step 1: Auto-generate retrieval query from current incident context
  const handleAutoGenerateQuery = () => {
    const generated = generateRetrievalQuery({
      title: activeIncident.title,
      defectType: 'Thermal Micro-Crack and Surface Porosity',
      dimensionalResults: 'Bore ID 85.018 mm (USL 85.015 mm)',
      processAnomalies: ['Coolant thermal drift to 28.4°C', 'Chatter vibration 3.85 mm/s'],
      vibration: 3.85,
      toolUsage: 128,
      machineId: activeIncident.lineId,
      material: 'Inconel 718 Superalloy',
      spcFindings: 'Nelson Rule 1 and Rule 3',
    });
    setRagQuery(generated);
  };

  // Reusable Component: Operational Evidence Grid
  const renderOperationalEvidence = () => (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              Operational Matrix
            </span>
            <h3 className="font-bold text-sm text-slate-900">
              Evidence (9 Diagnostic Inputs)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized observations from computer vision, CMM metrology, machine telemetry, tool counters, and maintenance logs
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">Incident: {activeIncident.incidentCode}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
        {/* 1. Defect Type */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase">
            <Microscope className="w-3.5 h-3.5 text-blue-600" />
            <span>Defect Type</span>
          </span>
          <div className="text-sm font-bold text-slate-900">Thermal Micro-Crack &amp; Surface Porosity</div>
          <p className="text-[11px] text-slate-600">
            CNN ResNet50-FPN activation identified micro-cracks (94.2% conf, 1.85 mm² area) on bearing race chamfer.
          </p>
        </div>

        {/* 2. Dimensional Results */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase">
            <Gauge className="w-3.5 h-3.5 text-purple-600" />
            <span>Dimensional Results</span>
          </span>
          <div className="text-sm font-bold text-rose-600">85.018 mm (+0.003 mm &gt; USL)</div>
          <p className="text-[11px] text-slate-600">
            Zeiss CMM coordinate metrology report CMM-2026-882 verified bore finished oversized vs 85.015 mm USL.
          </p>
        </div>

        {/* 3. Process Anomalies */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Process Anomalies</span>
          </span>
          <div className="text-sm font-bold text-amber-600">Thermal Runaway (+6.4°C Drift)</div>
          <p className="text-[11px] text-slate-600">
            Coolant delivery climbed from 22.0°C to 28.4°C across consecutive cycles; Isolation Forest score 0.88.
          </p>
        </div>

        {/* 4. Machine Vibration */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase">
            <Activity className="w-3.5 h-3.5 text-rose-500" />
            <span>Machine Vibration</span>
          </span>
          <div className="text-sm font-bold text-rose-600">3.85 mm/s RMS (ISO Critical)</div>
          <p className="text-[11px] text-slate-600">
            Breached ISO 10816-3 Class II critical alarm (3.2 mm/s). High harmonic chatter at 1.8 kHz during finish pass.
          </p>
        </div>

        {/* 5. Tool Usage */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase">
            <Wrench className="w-3.5 h-3.5 text-purple-600" />
            <span>Tool Usage</span>
          </span>
          <div className="text-sm font-bold text-amber-600">128 min in-cut (Limit: 100 min)</div>
          <p className="text-[11px] text-slate-600">
            Tool in-cut time exceeded 100 min warning and 120 min certified limit; flank wear measured at 0.42 mm.
          </p>
        </div>

        {/* 6. Machine Information */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase">
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            <span>Machine Information</span>
          </span>
          <div className="text-sm font-bold text-slate-900">Mori Seiki 5-Axis (Line A-1)</div>
          <p className="text-[11px] text-slate-600">
            Spindle cartridge Unit SP-04; thermal coefficient 11.2 µm/m°C across 400 mm arbor length.
          </p>
        </div>

        {/* 7. Material Information */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase">
            <Layers className="w-3.5 h-3.5 text-cyan-600" />
            <span>Material Information</span>
          </span>
          <div className="text-sm font-bold text-slate-900">Inconel 718 (Heat #IN-9082)</div>
          <p className="text-[11px] text-slate-600">
            Upper hardness limit 44.5 HRC; coolant refractometer recorded diluted 5.2% Brix (SOP requires 8.5–10%).
          </p>
        </div>

        {/* 8. Maintenance History */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase">
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span>Maintenance History</span>
          </span>
          <div className="text-sm font-bold text-slate-900">Work Order WO-9912 Logged</div>
          <p className="text-[11px] text-slate-600">
            Chiller Unit #2 condenser fin pack suffered 45% surface clogging from oil mist and fine Inconel swarf.
          </p>
        </div>

        {/* 9. SPC Findings */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>SPC Statistical Findings</span>
          </span>
          <div className="text-sm font-bold text-rose-600">Nelson Rule 1 &amp; Rule 3</div>
          <p className="text-[11px] text-slate-600">
            Point &gt; 3σ (Rule 1) and monotonic trend (Rule 3) on Bore ID; Process Capability Cpk = 0.74 (incapable).
          </p>
        </div>
      </div>
    </div>
  );

  // Reusable Component: Historical Evidence FAISS RAG Retrieval
  const renderHistoricalEvidence = () => (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              FAISS IndexFlatIP
            </span>
            <h3 className="font-bold text-sm text-slate-900">
              Historical Evidence (Vector Retrieval)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dense vector embeddings across NCRs, Maintenance Records, Defect Logs, Machine Incidents, Tool Wear, Inspection Protocols, and SOPs
          </p>
        </div>

        <button
          onClick={handleAutoGenerateQuery}
          className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded transition-colors flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-blue-600" />
          <span>Auto-Generate Query from Current Incident</span>
        </button>
      </div>

      {/* Query Bar & Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              placeholder="Search historical incidents, maintenance records, SOPs..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded font-mono text-slate-800 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setRagQuery('Inconel 718 bore oversize coolant thermal drift chiller swarf cutting chatter tool wear')}
            className="p-2 border border-slate-300 hover:bg-slate-50 rounded text-slate-600 text-xs flex items-center gap-1 cursor-pointer"
            title="Reset to default query"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-500 font-medium">Domain Filter:</span>
          {(['ALL', 'NCR', 'MAINTENANCE', 'DEFECT', 'MACHINE_INCIDENT', 'TOOL_WEAR', 'INSPECTION_PROCEDURE', 'SOP_EXCERPT'] as const).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setSelectedRecordType(cat)}
                className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                  selectedRecordType === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Matched Historical Records */}
      <div className="space-y-3 pt-2">
        <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between">
          <span>Top Matching Evidence Records ({liveRagMatches.length} retrieved):</span>
          <span>Similarity threshold: &gt; 40%</span>
        </div>

        {liveRagMatches.map((m) => (
          <div
            key={m.incidentId}
            className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-slate-900">{m.incidentId}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-800">
                  {m.recordType || 'HISTORICAL'}
                </span>
                <span className="font-semibold text-slate-800">{m.title}</span>
              </div>

              <div className="flex items-center gap-1 text-blue-700 font-mono text-xs font-bold shrink-0">
                <span>Similarity:</span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {(m.similarity * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {m.evidenceSnippet && (
              <div className="text-[11px] text-slate-600 font-mono leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                <span className="font-bold text-slate-700">Record Excerpt: </span>
                {m.evidenceSnippet}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="font-bold text-slate-700">Historical Cause: </span>
                <span className="text-slate-600">{m.historicalRootCause}</span>
              </div>
              <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
                <span className="font-bold">Effective Action / Guidance: </span>
                <span>{m.effectiveAction}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Reusable Component: Hypotheses Cards
  const renderHypothesesList = () => (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <span>Hypotheses (Agentic Multi-Hypothesis Analysis)</span>
            <span className="text-xs font-normal text-slate-500">({rca.hypotheses.length} candidates formulated)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict epistemic discipline: Each hypothesis specifies Supporting Evidence, Contradicting Evidence, and Required Engineering Verification
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {rca.hypotheses.map((h) => {
          const isConfirmed = h.status === 'CONFIRMED_ROOT_CAUSE';
          const confPercent = Math.round((h.confidence || h.likelihoodScore || 0.8) * 100);

          return (
            <div
              key={h.id}
              className={`bg-white rounded-lg border shadow-xs transition-all overflow-hidden ${
                isConfirmed
                  ? 'border-emerald-500 ring-2 ring-emerald-400 bg-emerald-50/10'
                  : 'border-slate-200'
              }`}
            >
              {/* Hypothesis Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <EpistemicBadge type={h.epistemicType} />
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                    Category: {h.category}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Confidence Meter */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-mono">Confidence:</span>
                    <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${confPercent >= 85 ? 'bg-amber-500' : 'bg-blue-500'}`}
                        style={{ width: `${confPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-900">{confPercent}%</span>
                  </div>

                  {/* Human Status */}
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                      isConfirmed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {h.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Hypothesis Statement Body */}
              <div className="p-5 space-y-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">
                    Hypothesis:
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 mt-0.5">
                    {h.hypothesis || h.hypothesisStatement}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 italic font-sans">
                    "{h.hypothesisStatement}"
                  </p>
                </div>

                {/* Dual Columns: Supporting Evidence vs Contradicting Evidence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SUPPORTING EVIDENCE */}
                  <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Supporting Evidence ({(h.supportingEvidence || h.evidenceChain || []).length})</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-emerald-950 font-sans">
                      {(h.supportingEvidence || h.evidenceChain || []).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-emerald-600 font-bold shrink-0">✓</span>
                          <span className="text-[11px]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CONTRADICTING EVIDENCE */}
                  <div className="p-3.5 rounded-lg bg-amber-50/50 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Contradicting / Counter Evidence ({(h.contradictingEvidence || []).length})</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-amber-950 font-sans">
                      {h.contradictingEvidence && h.contradictingEvidence.length > 0 ? (
                        h.contradictingEvidence.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                            <span className="text-amber-600 font-bold shrink-0">⚠</span>
                            <span className="text-[11px]">{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-[11px] text-slate-500 italic">
                          No direct contradictory evidence logged; requires verification testing to rule out competing causes.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* REQUIRED VERIFICATION */}
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950">
                    <Beaker className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Required Engineering Verification:</span>
                  </div>
                  <ul className="space-y-1 text-blue-900 text-[11px] font-mono">
                    {(h.requiredVerification && h.requiredVerification.length > 0
                      ? h.requiredVerification
                      : [h.suggestedPhysicalTest || 'Perform certified physical inspection and laser verification.']
                    ).map((step, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-blue-600 font-bold">[{idx + 1}]</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* EVIDENCE SOURCES */}
                {h.evidenceSources && h.evidenceSources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-mono uppercase">Evidence Sources:</span>
                    {h.evidenceSources.map((src, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}

                {/* HUMAN DECISION */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">Human Decision:</div>
                    {isConfirmed ? (
                      <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5 mt-0.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>
                          Confirmed Root Cause by {h.confirmedBy} on {h.confirmedAt?.substring(0, 10)}. Physical metrology verified.
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 mt-0.5">
                        Status: <span className="font-bold text-amber-700">UNCONFIRMED HYPOTHESIS</span> · Mandatory Quality Engineer sign-off required.
                      </div>
                    )}
                  </div>

                  {!isConfirmed && (
                    <button
                      onClick={() =>
                        onOpenApprovalModal(
                          `Confirm Root Cause: ${(h.hypothesis || h.hypothesisStatement).substring(0, 45)}...`,
                          'ROOT_CAUSE',
                          h.id,
                          'CONFIRMED',
                          `Laser interferometer and toolmaker microscope inspection confirmed hypothesis under physical testing.`
                        )
                      }
                      className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
                    >
                      <FileSignature className="w-3.5 h-3.5" />
                      <span>Perform Physical Verification & Confirm</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Reusable Component: Human Decision Governance Summary
  const renderHumanDecisionSection = () => {
    const confirmedCount = rca.hypotheses.filter((h) => h.status === 'CONFIRMED_ROOT_CAUSE').length;
    const pendingCount = rca.hypotheses.filter((h) => h.status !== 'CONFIRMED_ROOT_CAUSE').length;

    return (
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Human Decision &amp; Quality Engineer Governance Gate
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Enforces ISO 9001:2015 §8.7 and AS9100D safety gate: AI agents cannot unilaterally close or release nonconforming aerospace hardware.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-xs font-bold font-mono">
              Pending: {pendingCount}
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
              Confirmed: {confirmedCount}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Epistemic Segregation Policy</span>
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              AI models generate candidates labeled strictly as <span className="font-mono font-bold text-amber-900">[RCA_HYPOTHESIS]</span>.
              Elevation to <span className="font-mono font-bold text-emerald-800">[CONFIRMED_ROOT_CAUSE]</span> requires physical tool/part inspection,
              measurement against calibrated standards, and a licensed Quality Engineer's digital cryptographic sign-off.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <FileSignature className="w-3.5 h-3.5 text-emerald-600" />
              <span>Authorized Decision Authority</span>
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Lead Quality Metrologist: <span className="font-bold text-slate-900">Dr. Marcus Sterling (License #QA-88214)</span>.
              All digital signatures record an immutable audit token into the system ledger.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. CURRENT PROBLEM (HEADER & CONTEXT CARD) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Root Cause Analysis & RAG Knowledge Retrieval Agent
            </h2>
            <EpistemicBadge type="RCA_HYPOTHESIS" size="sm" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Agentic RCA: FAISS dense vector retrieval, 5-Whys recursive trace, 6-M Ishikawa synthesis, and human-in-the-loop verification.
          </p>
        </div>

        {/* Synthesize Button */}
        <button
          onClick={handleRunAgent}
          disabled={isSynthesizing}
          className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{isSynthesizing ? 'Synthesizing with Gemini...' : 'Re-Run Multi-Agent RCA Synthesis'}</span>
        </button>
      </div>

      {/* SECTION: CURRENT PROBLEM */}
      <div className="bg-slate-900 text-white rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-blue-900 text-blue-300 border border-blue-700">
                CURRENT PROBLEM: {activeIncident.incidentCode}
              </span>
              <span className="text-xs text-slate-300 font-mono">Lot {activeIncident.batchId}</span>
              <span className="text-xs text-amber-400 font-mono font-semibold">Line: CNC Line A-1 (Mori Seiki 5-Axis)</span>
              <span className="text-xs text-slate-400 font-mono">Part: PRD-AERO-701 (Inconel 718 Turbine Housing)</span>
            </div>
            <h3 className="font-bold text-sm text-slate-100">{activeIncident.title}</h3>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-800 p-2.5 rounded border border-slate-700 text-right font-mono">
              <div className="text-[10px] text-slate-400 uppercase">Nonconformance</div>
              <div className="text-sm font-bold text-rose-400">+0.003 mm &gt; USL</div>
            </div>
            <div className="bg-slate-800 p-2.5 rounded border border-slate-700 text-right font-mono">
              <div className="text-[10px] text-slate-400 uppercase">Containment</div>
              <div className="text-sm font-bold text-amber-400">QUARANTINED</div>
            </div>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono">Executive Synthesis:</span>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            {rca.synthesizedSummary}
          </p>
        </div>
      </div>

      {/* EPISTEMIC MANDATE NOTICE */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-xs text-amber-950 flex items-start gap-2.5 shadow-xs">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-900">CAUSAL GOVERNANCE MANDATE: Never Convert Correlation to Confirmed Causation</span>
          <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
            All AI-synthesized root causes are classified as <span className="font-mono font-bold text-amber-950">[RCA_HYPOTHESIS]</span> using cautious terminology:
            <em> "Potential contributing factor"</em>, <em>"Evidence supports further investigation"</em>, and <em>"Requires engineering verification"</em>.
            AI models must never declare that a parameter definitely caused a defect until an authorized Quality Engineer executes the physical test and applies a verified digital signature.
          </p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Sections (Unified View)</span>
        </button>

        <button
          onClick={() => setActiveTab('hypotheses')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'hypotheses'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Beaker className="w-3.5 h-3.5" />
          <span>Hypotheses ({rca.hypotheses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'evidence'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Operational Evidence</span>
        </button>

        <button
          onClick={() => setActiveTab('rag')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rag'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Historical Evidence (FAISS RAG)</span>
        </button>

        <button
          onClick={() => setActiveTab('fiveWhys')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'fiveWhys'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>5-Whys Recursive Trace</span>
        </button>

        <button
          onClick={() => setActiveTab('fishbone')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'fishbone'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>6-M Ishikawa Diagram</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
          TAB: ALL SECTIONS (UNIFIED EXECUTIVE REPORT)
         ------------------------------------------------------------- */}
      {activeTab === 'all' && (
        <div className="space-y-8">
          {/* Section 1: Operational Evidence Matrix */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Section 1 · Operational Evidence</h3>
            </div>
            {renderOperationalEvidence()}
          </div>

          {/* Section 2: Historical Evidence (FAISS Vector Retrieval) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Section 2 · Historical Evidence (FAISS RAG)</h3>
            </div>
            {renderHistoricalEvidence()}
          </div>

          {/* Section 3: Hypotheses with Supporting, Contradicting & Verification */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Section 3 · Root Cause Hypotheses</h3>
            </div>
            {renderHypothesesList()}
          </div>

          {/* Section 4: Human Decision Gate */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Section 4 · Human Decision &amp; Governance Gate</h3>
            </div>
            {renderHumanDecisionSection()}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB: HYPOTHESES FOCUSED VIEW
         ------------------------------------------------------------- */}
      {activeTab === 'hypotheses' && (
        <div className="space-y-6">
          {renderHypothesesList()}
          {renderHumanDecisionSection()}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB: OPERATIONAL EVIDENCE FOCUSED VIEW
         ------------------------------------------------------------- */}
      {activeTab === 'evidence' && renderOperationalEvidence()}

      {/* -------------------------------------------------------------
          TAB: HISTORICAL EVIDENCE (FAISS RAG) FOCUSED VIEW
         ------------------------------------------------------------- */}
      {activeTab === 'rag' && renderHistoricalEvidence()}

      {/* -------------------------------------------------------------
          TAB: 5-WHYS TREE
         ------------------------------------------------------------- */}
      {activeTab === 'fiveWhys' && <FiveWhysTree steps={rca.fiveWhys} />}

      {/* -------------------------------------------------------------
          TAB: FISHBONE DIAGRAM
         ------------------------------------------------------------- */}
      {activeTab === 'fishbone' && (
        <FishboneDiagram fishbone={rca.fishbone} problemStatement={activeIncident.title} />
      )}
    </div>
  );
};
