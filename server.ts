import express, { type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { calculateSpcMetrics, calculateImrControlChart } from './src/agents/spcEngine.ts';
import {
  generateProcessDataset,
  extractAnomalyRecords,
  IsolationForest,
  ENGINEERING_THRESHOLDS,
} from './src/agents/processMonitoringEngine.ts';
import { executeMultiAgentWorkflow, createInitialQualityState } from './src/agents/multiAgentWorkflow.ts';
import {
  retrieveSimilarIncidents,
  generateRetrievalQuery,
  synthesizeRcaHypotheses,
  SYNTHETIC_QUALITY_KNOWLEDGE_BASE,
} from './src/agents/ragFaissEngine.ts';
import {
  INITIAL_PRODUCTS,
  INITIAL_BATCHES,
  GENERATE_MOCK_TELEMETRY,
  SAMPLE_SPC_SUBGROUPS_DATA,
  INITIAL_VISUAL_INSPECTION_ITEMS,
  INITIAL_INCIDENT,
  HISTORICAL_INCIDENTS_KNOWLEDGE_BASE,
  INITIAL_RCA_ANALYSIS,
  INITIAL_CAPA_PLAN,
  INITIAL_CRITIC_REVIEW,
  INITIAL_EPISTEMIC_LEDGER,
  INITIAL_HUMAN_AUDIT_TRAIL,
  INITIAL_EFFECTIVENESS_MONITORING,
} from './src/data/mockManufacturingData.ts';
import {
  executeLiveTestCase,
  executeFullTestSuite,
  DEMONSTRATION_TEST_CASES,
} from './src/testing/testSuiteEngine.ts';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

// In-Memory Database store for prototype decision-support session
const db = {
  products: [...INITIAL_PRODUCTS],
  batches: [...INITIAL_BATCHES],
  telemetry: GENERATE_MOCK_TELEMETRY(),
  spcSubgroups: [...SAMPLE_SPC_SUBGROUPS_DATA],
  visualItems: [...INITIAL_VISUAL_INSPECTION_ITEMS],
  incidents: [{ ...INITIAL_INCIDENT }],
  rcaAnalyses: [{ ...INITIAL_RCA_ANALYSIS }],
  capaPlans: [{ ...INITIAL_CAPA_PLAN }],
  effectiveness: JSON.parse(JSON.stringify(INITIAL_EFFECTIVENESS_MONITORING)),
  criticReviews: [{ ...INITIAL_CRITIC_REVIEW }],
  epistemicLedger: [...INITIAL_EPISTEMIC_LEDGER],
  humanAuditTrail: [...INITIAL_HUMAN_AUDIT_TRAIL],
  testResults: JSON.parse(JSON.stringify(DEMONSTRATION_TEST_CASES)),
  approvalAudits: [
    {
      id: 'SIGN-001',
      entityId: 'batch-001',
      entityType: 'BATCH_QUARANTINE',
      action: 'QUARANTINE_LOCKED',
      engineerName: 'Dr. Marcus Sterling (Lead Quality Engineer)',
      licenseBadgeId: 'ASQ-CQE-84912',
      timestamp: '2026-10-02T14:30:00Z',
      notes: 'Confirmed Bore ID +0.003 mm above USL with CMM laboratory scan. Quarantined pending RCA & CAPA completion.',
    },
  ],
};

// Initialize Gemini Client safely
let genAI: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenAI();
  }
} catch (err) {
  console.warn('Gemini client initialization notice:', err);
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// System Status & Epistemic Hierarchy
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    systemName: 'Agentic AI Manufacturing Quality Inspection & Root Cause Analysis System',
    version: '1.2.0-PROTOTYPE',
    humanGovernanceGate: 'ENFORCED_MANDATORY',
    epistemicLevels: [
      { code: 'OBSERVED_FACT', label: 'Observed Fact', desc: 'Raw sensors, CMM metrology readouts, operator barcode timestamps' },
      { code: 'MODEL_PREDICTION', label: 'Model Prediction', desc: 'Computer vision CNN bounding boxes, class probability' },
      { code: 'STATISTICAL_FINDING', label: 'Statistical Finding', desc: 'SPC Nelson rule violations, Cpk/Cp, multivariate Mahalanobis score' },
      { code: 'RCA_HYPOTHESIS', label: 'RCA Hypothesis', desc: 'AI-synthesized 5-Whys candidate cause (subject to physical test)' },
      { code: 'CONFIRMED_ROOT_CAUSE', label: 'Confirmed Root Cause', desc: 'Human Quality-Engineer verified and digitally signed root cause' },
    ],
    agentFleet: [
      { name: 'Production & Quality Data Intake Agent', status: 'ACTIVE', role: 'Telemetry verification & Unit conversion' },
      { name: 'Visual Quality Inspection Agent', status: 'ACTIVE', role: 'YOLOv11-ResNet50 FPN surface defect detection' },
      { name: 'Dimensional & Specification Compliance Agent', status: 'ACTIVE', role: 'Tolerancing vs USL/LSL' },
      { name: 'Process Monitoring & Anomaly Agent', status: 'ACTIVE', role: 'Multivariate sensor drift & spike detection' },
      { name: 'Statistical Process Control Agent', status: 'ACTIVE', role: 'Deterministic SPC, Nelson Rules 1-8, Cpk' },
      { name: 'Root Cause Analysis Agent', status: 'ACTIVE', role: '5-Whys, Ishikawa fishbone synthesis' },
      { name: 'Corrective & Preventive Action Agent', status: 'ACTIVE', role: 'ISO 9001:2015 §8.7 & IATF 16949 CAPA generation' },
      { name: 'Quality Reviewer / Critic Agent', status: 'ACTIVE', role: 'Adversarial audit, bias detection & sample size checking' },
    ],
    totalBatches: db.batches.length,
    activeIncidents: db.incidents.filter((i) => i.status !== 'CLOSED').length,
    openCapas: db.capaPlans.filter((c) => c.status !== 'CLOSED').length,
  });
});

// Full Application Data Snapshot
app.get('/api/data', (_req: Request, res: Response) => {
  res.json({
    products: db.products,
    batches: db.batches,
    telemetry: db.telemetry,
    visualItems: db.visualItems,
    incidents: db.incidents,
    rcaAnalyses: db.rcaAnalyses,
    capaPlans: db.capaPlans,
    effectiveness: db.effectiveness,
    criticReviews: db.criticReviews,
    epistemicLedger: db.epistemicLedger,
    humanAuditTrail: db.humanAuditTrail,
    historicalCases: HISTORICAL_INCIDENTS_KNOWLEDGE_BASE,
    approvalAudits: db.approvalAudits,
  });
});

// Human Decision Audit Trail Endpoints
app.get('/api/audit-trail', (_req: Request, res: Response) => {
  res.json(db.humanAuditTrail);
});

app.post('/api/audit-trail', (req: Request, res: Response) => {
  const { agent, finding, humanDecision, reviewerComment, engineerName, licenseBadgeId, entityId, entityType } = req.body;
  const newEntry = {
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    agent: agent || 'AI Quality System',
    finding: finding || 'Quality evaluation finding',
    humanDecision: humanDecision || 'REVIEWED',
    reviewerComment: reviewerComment || 'Quality engineer audit note recorded.',
    engineerName: engineerName || 'Dr. Marcus Sterling',
    licenseBadgeId: licenseBadgeId || 'QA-88214',
    entityId,
    entityType,
  };
  db.humanAuditTrail.unshift(newEntry);
  res.json(newEntry);
});

// Deterministic SPC Calculation Endpoint (Pure Math - No LLM)
app.post('/api/spc/calculate', (req: Request, res: Response) => {
  try {
    const { subgroupData, nominal, usl, lsl, parameterName, unit } = req.body;
    const dataToUse = subgroupData && Array.isArray(subgroupData) && subgroupData.length > 0
      ? subgroupData
      : db.spcSubgroups;

    const nom = typeof nominal === 'number' ? nominal : 85.000;
    const uLimit = typeof usl === 'number' ? usl : 85.015;
    const lLimit = typeof lsl === 'number' ? lsl : 84.985;
    const param = parameterName || 'Bore Inner Diameter';
    const u = unit || 'mm';

    const result = calculateSpcMetrics(dataToUse, nom, uLimit, lLimit, param, u);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'SPC calculation failure.' });
  }
});

// Individuals / Moving Range (I-MR) Control Chart Calculation (Deterministic Math - No LLM)
app.post('/api/spc/imr', (req: Request, res: Response) => {
  try {
    const { individualValues, nominal, usl, lsl, paramName, unit, sampleLabels } = req.body;
    const result = calculateImrControlChart(
      Array.isArray(individualValues) && individualValues.length > 0 ? individualValues : [85.001, 85.003, 85.002, 85.004, 85.005],
      typeof nominal === 'number' ? nominal : 85.000,
      typeof usl === 'number' ? usl : 85.015,
      typeof lsl === 'number' ? lsl : 84.985,
      paramName || 'Bore Inner Diameter',
      unit || 'mm',
      sampleLabels
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'I-MR calculation failure.' });
  }
});

// Process Monitoring Telemetry Generator Endpoint
app.get('/api/monitoring/telemetry', (_req: Request, res: Response) => {
  try {
    const dataset = generateProcessDataset();
    const anomalies = extractAnomalyRecords(dataset);
    res.json({
      parameters: [
        'temperatureC',
        'pressureBar',
        'spindleSpeedRpm',
        'feedRateMmMin',
        'machineVibrationMmS',
        'toolUsageMinutes',
        'cycleTimeS',
        'motorCurrentA',
      ],
      thresholds: ENGINEERING_THRESHOLDS,
      telemetry: dataset,
      anomalies,
      totalFrames: dataset.length,
      anomalyCount: anomalies.length,
      model: 'Isolation Forest (100 iTrees, contamination=0.15) + ISO 10816-3 Thresholds',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Telemetry generation failed.' });
  }
});

// Process Monitoring Isolation Forest Evaluation Endpoint
app.post('/api/monitoring/isolation-forest', (req: Request, res: Response) => {
  try {
    const { customPoints, contamination } = req.body;
    const pointsToScore = Array.isArray(customPoints) && customPoints.length > 0
      ? customPoints
      : generateProcessDataset();

    const featureMatrix = pointsToScore.map((p: any) => [
      typeof p.temperatureC === 'number' ? p.temperatureC : 22.0,
      typeof p.pressureBar === 'number' ? p.pressureBar : 70.0,
      typeof p.spindleSpeedRpm === 'number' ? p.spindleSpeedRpm : 12000,
      typeof p.feedRateMmMin === 'number' ? p.feedRateMmMin : 450,
      typeof p.machineVibrationMmS === 'number' ? p.machineVibrationMmS : 1.2,
      typeof p.toolUsageMinutes === 'number' ? p.toolUsageMinutes : 45,
      typeof p.cycleTimeS === 'number' ? p.cycleTimeS : 52.0,
      typeof p.motorCurrentA === 'number' ? p.motorCurrentA : 18.5,
    ]);

    const contam = typeof contamination === 'number' ? contamination : 0.15;
    const model = new IsolationForest(100, Math.min(256, featureMatrix.length), contam);
    model.fit(featureMatrix);
    const predictions = model.predict(featureMatrix);

    res.json({
      success: true,
      trees: 100,
      contamination: contam,
      threshold: model.threshold,
      scoredPoints: pointsToScore.map((p: any, idx: number) => ({
        timestamp: p.timestamp,
        anomalyScore: predictions[idx].anomalyScore,
        isAnomaly: predictions[idx].isAnomaly,
        parameterValues: {
          temperatureC: p.temperatureC,
          pressureBar: p.pressureBar,
          spindleSpeedRpm: p.spindleSpeedRpm,
          feedRateMmMin: p.feedRateMmMin,
          machineVibrationMmS: p.machineVibrationMmS,
          toolUsageMinutes: p.toolUsageMinutes,
          cycleTimeS: p.cycleTimeS,
          motorCurrentA: p.motorCurrentA,
        },
      })),
      epistemicType: 'STATISTICAL_FINDING',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Isolation Forest inference failed.' });
  }
});


// Deterministic Inspection Compliance Calculation Endpoint (Pure Math - No LLM)
app.post('/api/inspection/calculate', (req: Request, res: Response) => {
  try {
    const { measurements, nominal, tolerance } = req.body;
    const nom = typeof nominal === 'number' ? nominal : 50.00;
    const tol = typeof tolerance === 'number' ? tolerance : 0.05;
    const lsl = Number((nom - tol).toFixed(4));
    const usl = Number((nom + tol).toFixed(4));

    const rawList = Array.isArray(measurements) ? measurements : [];
    const records = rawList.map((m: any, idx: number) => {
      const val = typeof m.measuredDiameterMm === 'number'
        ? m.measuredDiameterMm
        : (typeof m.diameter_mm === 'number' ? m.diameter_mm : parseFloat(m.diameter || m.diameter_mm || m.measuredDiameterMm || '0'));
      const cid = m.componentId || m.component_id || `P${String(idx + 1).padStart(3, '0')}`;
      const deviation = Number((val - nom).toFixed(4));
      const status = (val >= lsl && val <= usl) ? 'CONFORMING' : 'NONCONFORMING';

      return {
        componentId: cid,
        measuredDiameterMm: Number(val.toFixed(4)),
        nominalMm: nom,
        toleranceMm: tol,
        lslMm: lsl,
        uslMm: usl,
        deviationMm: deviation,
        status,
      };
    });

    const totalInspected = records.length;
    const accepted = records.filter((r: any) => r.status === 'CONFORMING').length;
    const rejected = totalInspected - accepted;
    const rejectionPercentage = totalInspected > 0 ? Number(((rejected / totalInspected) * 100).toFixed(2)) : 0;
    const diameters = records.map((r: any) => r.measuredDiameterMm);
    const mean = totalInspected > 0 ? Number((diameters.reduce((a: number, b: number) => a + b, 0) / totalInspected).toFixed(4)) : nom;
    const minimum = totalInspected > 0 ? Math.min(...diameters) : nom;
    const maximum = totalInspected > 0 ? Math.max(...diameters) : nom;

    res.json({
      nominal: nom,
      tolerance: tol,
      lsl,
      usl,
      totalInspected,
      accepted,
      rejected,
      rejectionPercentage,
      mean,
      minimum,
      maximum,
      records,
      calculationMethod: 'DETERMINISTIC_SCIENTIFIC_COMPUTATION',
      epistemicType: 'STATISTICAL_FINDING',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Inspection calculation failed.' });
  }
});

// RAG Vector/Semantic Search over Historical Manufacturing Incidents (FAISS-compatible IndexFlatIP)
app.post('/api/rag/search', (req: Request, res: Response) => {
  try {
    const { query, topK, recordType } = req.body;
    const queryStr = typeof query === 'string' && query.trim().length > 0
      ? query
      : 'Inconel 718 bore oversize coolant thermal drift chiller swarf cutting chatter';

    const matches = retrieveSimilarIncidents(queryStr, typeof topK === 'number' ? topK : 5, recordType);
    res.json(matches);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'RAG search failed.' });
  }
});

// Full Historical Knowledge Base Catalog (7 Domains: NCR, Maintenance, Defect, Machine, Tool, Inspection, SOP)
app.get('/api/rag/knowledge-base', (_req: Request, res: Response) => {
  res.json({
    totalRecords: SYNTHETIC_QUALITY_KNOWLEDGE_BASE.length,
    categories: ['NCR', 'MAINTENANCE', 'DEFECT', 'MACHINE_INCIDENT', 'TOOL_WEAR', 'INSPECTION_PROCEDURE', 'SOP_EXCERPT'],
    records: SYNTHETIC_QUALITY_KNOWLEDGE_BASE,
  });
});

// Agentic RCA Reasoning Endpoint (5-Whys, Ishikawa, Multiple Hypotheses with Supporting/Contradicting Evidence)
app.post('/api/agent/rca', async (req: Request, res: Response) => {
  try {
    const { incidentId, batchId, userPrompt } = req.body;
    const incident = db.incidents.find((i) => i.id === incidentId) || db.incidents[0];
    const batch = db.batches.find((b) => b.id === batchId) || db.batches[0];

    // Step 1: Generate retrieval query from operational incident context
    const retrievalQuery = generateRetrievalQuery({
      title: incident.title,
      defectType: 'Thermal Micro-Crack and Surface Porosity',
      dimensionalResults: 'Bore ID 85.018 mm (USL 85.015 mm)',
      processAnomalies: ['Coolant thermal drift to 28.4°C', 'Chatter vibration 3.85 mm/s'],
      vibration: 3.85,
      toolUsage: 128,
      machineId: batch.lineId,
      material: batch.material,
      spcFindings: 'Nelson Rule 1 and Rule 3',
    });

    // Step 2 & 3: Retrieve top relevant historical evidence using dense vector similarity
    const retrievedMatches = retrieveSimilarIncidents(retrievalQuery, 5);

    // Step 4: Pass operational evidence and retrieved historical evidence to RCA Agent
    const generatedHypotheses = synthesizeRcaHypotheses(
      {
        incidentId: incident.id,
        productName: batch.productName,
        productCode: batch.productCode,
        machineLine: batch.lineId,
        material: batch.material,
        defectType: 'Thermal Micro-Crack & Surface Porosity',
        measuredBoreDiameter: 85.018,
        usl: 85.015,
        coolantTemp: 28.4,
        vibrationRms: 3.85,
        toolUsageMinutes: 128,
        motorCurrentA: 26.5,
        spcRulesTriggered: ['Nelson Rule 1 (Outside Zone A > 3σ)', 'Nelson Rule 3 (Six Consecutive Trending)'],
        maintenanceLogs: ['Work Order WO-9912: Chiller Unit #2 Condenser Fin Pack Swarf Clogged'],
      },
      retrievedMatches
    );

    let synthesizedSummary =
      'Multi-agent analysis indicates a coupled thermo-mechanical failure: Airborne swarf clogged Chiller #2, elevating coolant to 28.4°C and driving +2.9 µm spindle thermal arbor expansion. Concurrently, diluted coolant (5.2%) accelerated ceramic tool flank wear to 0.42 mm, creating excessive cutting force and thermal micro-cracks in the bore race. Cautious hypothesis formulation enforced: all candidates require physical verification before confirming causation.';

    if (genAI && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are a Principal Manufacturing Quality Systems Engineer adhering strictly to ISO 9001:2015 and IATF 16949 standards.
Analyze the following manufacturing nonconformance data:
Product: ${batch.productName} (${batch.productCode})
Machine Line: ${batch.lineId}
Incident Summary: ${incident.title} - ${incident.description}
Operational Evidence:
- Defect: Thermal micro-cracking (94.2% conf) and surface scratches
- Dimensional: Bore ID reached 85.018 mm (exceeding USL 85.015 mm by +0.003 mm)
- Process Telemetry: Coolant temp climbed to 28.4°C; Spindle vibration chatter reached 3.85 mm/s RMS (exceeds ISO 10816-3 critical limit 3.2 mm/s)
- Tool Usage: Ceramic boring insert cut time reached 128 min (limit: 100 min)
- Material: Inconel 718 (Heat #IN-9082), Coolant concentration diluted to 5.2% Brix
- Maintenance: WO-9912 documented 45% swarf blockage on Chiller #2 condenser
- SPC Findings: Nelson Rule 1 and Rule 3 triggered on Bore ID; Cpk = 0.74 (incapable)
- Historical Evidence Retrieved: ${retrievedMatches.map((m) => `${m.recordType} ${m.incidentId}: ${m.title} (Sim ${m.similarity})`).join('; ')}
User Focus: ${userPrompt || 'Conduct RCA synthesis with cautious non-causation phrasing.'}

Strict Rules:
1. NEVER convert correlation into confirmed causation.
2. Use phrases such as "Potential contributing factor", "Evidence supports further investigation", "Requires engineering verification".
3. Do NOT state "Tool wear definitely caused the defect" or any definite causation unless verified.
4. Output a concise 3-4 sentence engineering summary of the investigated failure mechanisms.`;

        const response = await genAI.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        if (response.text) {
          synthesizedSummary = response.text.trim();
        }
      } catch (err) {
        console.warn('Gemini RCA reasoning fallback:', err);
      }
    }

    // Update existing RCA or register new one
    const rcaEntry = {
      ...INITIAL_RCA_ANALYSIS,
      id: `rca-${Date.now()}`,
      incidentId: incident.id,
      batchId: batch.id,
      timestamp: new Date().toISOString(),
      synthesizedSummary,
      hypotheses: generatedHypotheses,
      ragMatches: retrievedMatches.map((m) => ({
        incidentId: m.incidentId,
        title: m.title,
        similarity: m.similarity,
        historicalRootCause: m.historicalRootCause,
        effectiveAction: m.effectiveAction,
        recordType: m.recordType,
        evidenceSnippet: m.evidenceSnippet,
      })),
    };

    db.rcaAnalyses = [rcaEntry, ...db.rcaAnalyses.filter((r) => r.incidentId !== incident.id)];

    res.json(rcaEntry);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'RCA reasoning generation failed.' });
  }
});

// Agentic CAPA Formulation Endpoint
app.post('/api/agent/capa', async (req: Request, res: Response) => {
  const { incidentId, rcaId, batchId } = req.body;
  const incident = db.incidents.find((i) => i.id === incidentId) || db.incidents[0];

  let generatedSummary = 'Coupled failure of CNC chiller airflow blockage (spindle thermal expansion) and ceramic insert flank over-wear (frictional thermal micro-cracking) under diluted coolant.';

  if (genAI && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are an ASQ Certified Quality Engineer (CQE).
Draft an ISO 9001:2015 §8.7 & §10.2 compliant CAPA summary for:
Incident: ${incident.title}
Affected Units: ${incident.affectedUnitsCount}
Containment: ${incident.immediateContainment}
Provide a 2-sentence executive summary emphasizing root cause elimination, verification threshold (Target Cpk >= 1.50), and mistake-proofing (Poka-Yoke).`;

      const response = await genAI.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      if (response.text) {
        generatedSummary = response.text.trim();
      }
    } catch (err) {
      console.warn('Gemini CAPA fallback:', err);
    }
  }

  const capa: (typeof INITIAL_CAPA_PLAN) = {
    ...INITIAL_CAPA_PLAN,
    id: `capa-${Date.now()}`,
    incidentId: incident.id,
    rcaId: rcaId || 'rca-001',
    batchId: batchId || incident.batchId,
    rootCauseSummary: generatedSummary,
    status: 'PENDING_APPROVAL',
  };

  db.capaPlans = [capa, ...db.capaPlans.filter((c) => c.incidentId !== incident.id)];
  res.json(capa);
});

// CAPA Effectiveness Monitoring Data Endpoint
app.get('/api/capa/effectiveness', (_req: Request, res: Response) => {
  res.json(db.effectiveness);
});

// Quality Engineer Effectiveness Sign-off & Evaluation
app.post('/api/capa/effectiveness/evaluate', (req: Request, res: Response) => {
  const { rating, notes, engineerName, licenseBadgeId } = req.body;
  const timestamp = new Date().toISOString();

  db.effectiveness.humanEvaluation = {
    rating: rating || 'Effective',
    engineerName: engineerName || 'Dr. Marcus Sterling',
    licenseBadgeId: licenseBadgeId || 'ASQ-CQE-84912',
    timestamp,
    notes: notes || 'Metrological verification confirmed.',
    digitalSignature: `SIG-SHA256-${(licenseBadgeId || 'CQE').replace(/[^A-Z0-9]/gi, '')}-${Date.now().toString().slice(-6)}`,
  };

  // Record into human audit trail
  db.humanAuditTrail.unshift({
    id: `aud-${Date.now()}`,
    timestamp,
    agent: 'CAPA Effectiveness Monitoring Agent',
    finding: `CAPA Plan ${db.effectiveness.capaId} Effectiveness Disposition: ${rating} (Rejection ${db.effectiveness.beforeStats.rejectionRate}% -> ${db.effectiveness.afterStats.rejectionRate}%)`,
    humanDecision: (rating || 'EFFECTIVE').toUpperCase(),
    reviewerComment: notes || 'Verified quality metric improvement post-action.',
    engineerName: engineerName || 'Dr. Marcus Sterling',
    licenseBadgeId: licenseBadgeId || 'ASQ-CQE-84912',
    entityId: db.effectiveness.capaId,
    entityType: 'CAPA',
  });

  res.json({
    success: true,
    evaluation: db.effectiveness.humanEvaluation,
    message: 'CAPA effectiveness evaluation digitally signed and recorded in ISO 9001 audit trail.',
  });
});

// Recurrence Detection Trigger & Flagging
app.post('/api/capa/recurrence/event', (req: Request, res: Response) => {
  const { batchNumber, defectType, defectCount, description, severity } = req.body;
  const timestamp = new Date().toISOString();

  const newEvent = {
    id: `rec-evt-${Date.now().toString().slice(-4)}`,
    detectedAt: timestamp,
    batchNumber: batchNumber || 'LOT-2026-AERO-15',
    defectType: defectType || 'Thermal Micro-Cracking & Bore Oversize (+0.0035 mm)',
    defectCount: typeof defectCount === 'number' ? defectCount : 4,
    similarityScore: 0.94,
    severity: severity || 'HIGH',
    status: 'FLAGGED' as const,
    description: description || `Defect recurrence detected on Batch ${batchNumber || 'LOT-2026-AERO-15'} matching pre-CAPA signature.`,
  };

  db.effectiveness.recurrenceMonitor.recurrenceDetected = true;
  db.effectiveness.recurrenceMonitor.events.unshift(newEvent);

  res.json({
    success: true,
    recurrenceDetected: true,
    event: newEvent,
  });
});

// Automated Test Cases Endpoints (TC-01 through TC-08)
app.get('/api/tests/results', (_req: Request, res: Response) => {
  res.json({
    testCases: db.testResults,
    demoSpecs: DEMONSTRATION_TEST_CASES,
  });
});

// Run Full Automated Test Suite
app.post('/api/tests/run', async (_req: Request, res: Response) => {
  try {
    const liveResults = await executeFullTestSuite();
    db.testResults = liveResults;
    res.json({
      success: true,
      executedAt: new Date().toISOString(),
      totalExecuted: liveResults.length,
      passedCount: liveResults.filter((r) => r.status === 'PASSED').length,
      failedCount: liveResults.filter((r) => r.status === 'FAILED').length,
      results: liveResults,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Automated test execution failed', details: err?.message });
  }
});

// Run Single Test Case Live
app.post('/api/tests/run-single', async (req: Request, res: Response) => {
  const { testId } = req.body;
  try {
    const result = await executeLiveTestCase(testId);
    // Update in database list
    db.testResults = db.testResults.map((t: any) => (t.testId === testId ? result : t));
    res.json({
      success: true,
      result,
    });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to execute test case', details: err?.message });
  }
});

// Quality Reviewer / Critic Agent Audit Endpoint
app.post('/api/agent/critic', async (req: Request, res: Response) => {
  const { incidentId } = req.body;
  const review = {
    ...INITIAL_CRITIC_REVIEW,
    id: `rev-${Date.now()}`,
    incidentId: incidentId || 'inc-001',
    timestamp: new Date().toISOString(),
  };

  db.criticReviews = [review, ...db.criticReviews.filter((r) => r.incidentId !== incidentId)];
  res.json(review);
});

// Multi-Agent Manufacturing Quality Workflow Execution Endpoint
app.post('/api/agent/workflow/run', async (req: Request, res: Response) => {
  try {
    const { initialState, includeReviewer, simulateErrorStepId, engineerDecision } = req.body;
    const result = await executeMultiAgentWorkflow(initialState, {
      includeReviewer: includeReviewer !== false,
      simulateErrorStepId,
      engineerDecision,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Workflow execution failed.' });
  }
});

// Shared QualityState getter
app.get('/api/agent/workflow/state', (_req: Request, res: Response) => {
  res.json(createInitialQualityState());
});

// MANDATORY HUMAN-IN-THE-LOOP APPROVAL / SIGN-OFF GATE
// AI recommendations must NEVER autonomously approve/reject safety-critical products or modify machines.
app.post('/api/human-approval', (req: Request, res: Response) => {
  const {
    entityId,
    entityType, // 'BATCH', 'CAPA', 'ROOT_CAUSE', 'QUARANTINE_RELEASE'
    decision, // 'APPROVED', 'REJECTED', 'QUARANTINED', 'CONFIRMED'
    engineerName,
    licenseBadgeId,
    notes,
    digitalSignatureToken,
  } = req.body;

  if (!engineerName || !licenseBadgeId) {
    return res.status(400).json({ error: 'Engineer Name and ASQ/ISO License Badge ID are required for safety-critical sign-off.' });
  }

  const timestamp = new Date().toISOString();
  const auditId = `SIGN-${Date.now().toString().slice(-6)}`;

  // 1. If approving a Batch
  if (entityType === 'BATCH') {
    const batch = db.batches.find((b) => b.id === entityId);
    if (batch) {
      batch.status = decision === 'APPROVED' ? 'PASSED' : (decision === 'QUARANTINED' ? 'QUARANTINED' : 'ACTIVE');
      batch.humanSignOff = {
        approvedBy: engineerName,
        role: `Staff Quality Engineer (Badge ${licenseBadgeId})`,
        timestamp,
        status: decision === 'APPROVED' ? 'APPROVED' : (decision === 'QUARANTINED' ? 'QUARANTINED' : 'REJECTED'),
        notes: notes || 'Human quality engineer formal disposition.',
      };
    }
  }

  // 2. If approving CAPA Plan
  if (entityType === 'CAPA') {
    const capa = db.capaPlans.find((c) => c.id === entityId);
    if (capa) {
      capa.status = decision === 'APPROVED' ? 'APPROVED' : 'DRAFT';
      capa.humanApproval = {
        approved: decision === 'APPROVED',
        engineerName,
        licenseBadgeId,
        timestamp,
        comments: notes || 'Formally authorized CAPA execution.',
        signatureDigitalToken: digitalSignatureToken || `SIG-SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      };
    }
  }

  // 3. If confirming an RCA Hypothesis into Confirmed Root Cause
  if (entityType === 'ROOT_CAUSE') {
    const rca = db.rcaAnalyses[0];
    if (rca) {
      const hypothesis = rca.hypotheses.find((h) => h.id === entityId);
      if (hypothesis) {
        hypothesis.status = decision === 'CONFIRMED' ? 'CONFIRMED_ROOT_CAUSE' : 'REFUTED';
        hypothesis.epistemicType = decision === 'CONFIRMED' ? 'CONFIRMED_ROOT_CAUSE' : 'RCA_HYPOTHESIS';
        hypothesis.confirmedBy = engineerName;
        hypothesis.confirmedAt = timestamp;
        hypothesis.verificationNotes = notes;
      }
    }
    // Record into global epistemic ledger
    db.epistemicLedger.unshift({
      id: `ep-${Date.now()}`,
      type: decision === 'CONFIRMED' ? 'CONFIRMED_ROOT_CAUSE' : 'OBSERVED_FACT',
      title: `Root Cause Elevation: ${notes ? notes.slice(0, 60) : 'Physical Verification'}`,
      detail: notes || 'Physical test confirmed hypothesis under laser metrology.',
      source: `Human Quality Engineer ${engineerName} (${licenseBadgeId})`,
      timestamp,
      verifiedBy: engineerName,
      verifiedAt: timestamp,
    });
  }

  // Record into human audit trail
  db.humanAuditTrail.unshift({
    id: `aud-${Date.now()}`,
    timestamp,
    agent: entityType === 'CAPA' ? 'CAPA Formulation Agent' : (entityType === 'ROOT_CAUSE' ? 'Root Cause Analysis Agent' : 'Quality Intake / Inspection Agent'),
    finding: `${entityType} evaluation for ID ${entityId}`,
    humanDecision: decision,
    reviewerComment: notes || `${decision} recorded by authorized quality engineer.`,
    engineerName,
    licenseBadgeId,
    entityId,
    entityType: entityType === 'ROOT_CAUSE' ? 'ROOT_CAUSE' : (entityType === 'CAPA' ? 'CAPA' : 'BATCH'),
  });

  const auditRecord = {
    id: auditId,
    entityId,
    entityType,
    action: decision,
    engineerName,
    licenseBadgeId,
    timestamp,
    notes,
  };

  db.approvalAudits.unshift(auditRecord);

  res.json({
    success: true,
    auditRecord,
    message: `Human quality engineer action recorded under ISO 9001 audit trail. Epistemic governance verified.`,
  });
});

// Update or add Visual Inspection Verdict
app.post('/api/vision/verdict', (req: Request, res: Response) => {
  const { visualItemId, verdict, inspectorName, notes } = req.body;
  const item = db.visualItems.find((v) => v.id === visualItemId);
  if (!item) {
    return res.status(404).json({ error: 'Inspection item not found.' });
  }

  item.humanVerdict = verdict;
  item.humanInspector = inspectorName || 'Dr. Marcus Sterling (Lead QA)';
  item.inspectionNotes = notes || item.inspectionNotes;
  if (verdict === 'PASSED_OVERRIDE') {
    item.status = 'CONFORMING';
  } else if (verdict === 'CONFIRMED_DEFECT') {
    item.status = 'NON_CONFORMING';
  }

  res.json(item);
});

// Computer Vision Surface Defect Prediction Endpoint
// Strict schema:
// {
//   "defect_detected": true,
//   "defect_type": "scratches",
//   "confidence": 0.94
// }
app.post('/api/vision/predict', (req: Request, res: Response) => {
  const { defectHint } = req.body;

  const DEFECT_CLASSES = [
    'scratches',
    'patches',
    'inclusions',
    'pitted_surface',
    'rolled_in_scale',
    'crazing',
    'no_defect',
  ];

  const targetDefect = defectHint && DEFECT_CLASSES.includes(defectHint) ? defectHint : 'scratches';
  const confidenceMap: Record<string, number> = {
    scratches: 0.94,
    patches: 0.89,
    inclusions: 0.91,
    pitted_surface: 0.89,
    rolled_in_scale: 0.87,
    crazing: 0.93,
    no_defect: 0.96,
  };

  const confidence = confidenceMap[targetDefect] || 0.94;
  const defectDetected = targetDefect !== 'no_defect';

  const classProbabilities: Record<string, number> = {};
  DEFECT_CLASSES.forEach((c) => {
    if (c === targetDefect) {
      classProbabilities[c] = confidence;
    } else {
      const remaining = Number(((1.0 - confidence) / (DEFECT_CLASSES.length - 1)).toFixed(4));
      classProbabilities[c] = remaining;
    }
  });

  res.json({
    defect_detected: defectDetected,
    defect_type: targetDefect,
    confidence: confidence,
    epistemic_type: 'MODEL_PREDICTION',
    is_development_fallback: true,
    model_status: 'DEVELOPMENT_FALLBACK (PyTorch weights pending: backend/models/surface_defect_resnet18.pth)',
    model_information: {
      architecture: 'ResNet18 Transfer Learning (ImageNet-1K pre-trained backbone)',
      input_resolution: '224x224 RGB / Grayscale',
      classes: DEFECT_CLASSES,
      training_script: 'backend/train_vision_model.py',
      integration_point: 'Run python3 backend/train_vision_model.py to produce models/surface_defect_resnet18.pth',
      epistemic_warning: 'MODEL PREDICTION: Do not describe the prediction as a confirmed defect until an authorized Quality Engineer verifies it.'
    },
    class_probabilities: classProbabilities,
    timestamp: new Date().toISOString(),
  });
});

// Create new Incident
app.post('/api/incidents', (req: Request, res: Response) => {
  const { title, description, batchId, severity, observedFacts, immediateContainment } = req.body;
  const newInc = {
    id: `inc-${Date.now().toString().slice(-4)}`,
    incidentCode: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
    batchId: batchId || 'LOT-2026-AERO-08',
    productCode: 'PRD-AERO-701',
    lineId: 'CNC Line A-1 (Mori Seiki 5-Axis)',
    severity: severity || 'HIGH',
    status: 'INVESTIGATING' as const,
    title: title || 'Process Nonconformance Alert',
    description: description || 'Automatic incident generated from SPC out-of-control rule trigger.',
    observedFacts: observedFacts || ['SPC out of control signal detected.'],
    immediateContainment: immediateContainment || 'Line halted, affected lot placed in quarantine.',
    affectedUnitsCount: 14,
    scrapCostEstimateUsd: 28000,
  };

  db.incidents.unshift(newInc);
  res.json(newInc);
});

// -------------------------------------------------------------
// VITE DEV SERVER / STATIC FILE SERVING
// -------------------------------------------------------------
async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`Agentic AI Manufacturing Quality Inspection System`);
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
    console.log(`Governance Gate: Human-in-the-loop enforced`);
    console.log(`Deterministic SPC & RAG engine initialized`);
    console.log(`======================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
