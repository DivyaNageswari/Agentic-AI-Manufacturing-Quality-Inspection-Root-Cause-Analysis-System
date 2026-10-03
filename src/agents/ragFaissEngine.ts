import type { HistoricalKnowledgeRecord, KnowledgeRecordType, RcaHypothesis, EpistemicType } from '../types/index.ts';

/**
 * Historical Quality Knowledge Base containing synthetic manufacturing records
 * across all 7 required domains:
 * 1. NCR records
 * 2. Maintenance records
 * 3. Previous defect logs
 * 4. Machine incidents
 * 5. Tool wear incidents
 * 6. Inspection procedures
 * 7. SOP excerpts
 */
export const SYNTHETIC_QUALITY_KNOWLEDGE_BASE: HistoricalKnowledgeRecord[] = [
  // 1. NCR Records
  {
    id: 'kb-ncr-01',
    recordType: 'NCR',
    code: 'NCR-2024-041',
    title: 'Aerospace Housing Bore Taper & Thermal Expansion Oversize',
    productLine: 'PRD-AERO-701 Aerospace Housing (Inconel 718)',
    machineId: 'CNC Line A-1 (Mori Seiki 5-Axis)',
    symptoms: [
      'Coolant temp > 27°C',
      'Bore ID trending above USL (+0.0035 mm)',
      'Spindle vibration drift to 3.8 mm/s',
      'Chiller swarf blockage',
    ],
    rootCauseOrDetails:
      'Coolant closed-loop chiller thermostatic valve stuck at 30% bypass, causing +0.012 mm spindle thermal arbor expansion during finishing.',
    effectiveActionOrGuidance:
      'Installed duplex redundant temperature probe with automated PLC feed-hold interlock at 24.5°C; revised weekly chiller filter backwash PM.',
    content:
      'NCR-2024-041: 14 units of Inconel 718 turbine housings rejected on CMM station for bore oversize (+0.0035 mm above USL). Telemetry revealed coolant temperature drifted from 22.0°C to 28.4°C over 12 consecutive parts. Spindle vibration harmonic elevated to 3.8 mm/s RMS. Root cause traced to chiller condenser airflow blockage by aerosol swarf.',
    keywords: ['ncr', 'bore', 'spindle', 'thermal', 'chiller', 'coolant', 'inconel', 'expansion', 'vibration', 'oversize', 'usl'],
    similarityScore: 0.94,
    date: '2024-06-18',
  },
  {
    id: 'kb-ncr-02',
    recordType: 'NCR',
    code: 'NCR-2025-089',
    title: 'Bore Circularity & Concentricity Runout Under Variable Clamp Pressure',
    productLine: 'PRD-AERO-701 Aerospace Housing',
    machineId: 'CNC Line A-1 (Mori Seiki 5-Axis)',
    symptoms: [
      'Bore ovality > 0.008 mm',
      'Hydraulic pressure drop to 61 bar',
      'Jaw gripping force fluctuation',
    ],
    rootCauseOrDetails:
      'Hydraulic clamp proportional valve sticking caused asymmetric chuck gripping pressure, distorting thin-walled housing during roughing pass.',
    effectiveActionOrGuidance:
      'Replaced proportional valve spool; installed piezoelectric clamp force pressure sensor with pre-cycle check macro.',
    content:
      'NCR-2025-089: Nonconformance logged for bore circularity runout exceeding 0.006 mm limit. Chuck clamp pressure dipped to 61.2 bar (below 65 bar minimum). Thin-walled Inconel cylinder deflected under uneven three-jaw chuck force, rebounding after unclamp.',
    keywords: ['ncr', 'hydraulic', 'pressure', 'clamp', 'chuck', 'ovality', 'circularity', 'runout', 'distortion'],
    similarityScore: 0.81,
    date: '2025-04-12',
  },

  // 2. Maintenance Records
  {
    id: 'kb-maint-01',
    recordType: 'MAINTENANCE',
    code: 'WO-9912',
    title: 'Chiller Unit #2 Condenser Fin Pack Swarf De-clogging & Coolant Flush',
    productLine: 'Plant Facility / CNC Line A-1 & A-2',
    machineId: 'Mori Seiki 5-Axis Machining Center Chiller #2',
    symptoms: [
      'Chiller high-pressure refrigeration alarm',
      'Refrigerant condensing temp > 52°C',
      'Coolant delivery temp 28.5°C',
    ],
    rootCauseOrDetails:
      'Intake filter screen torn; airborne aluminum and Inconel fine swarf chips deposited on refrigeration condenser coil fin pack, reducing heat transfer by 45%.',
    effectiveActionOrGuidance:
      'Cleaned fin pack with chemical degreasing spray; replaced intake screen with 50-micron dual mesh; added weekly differential air pressure sensor check.',
    content:
      'Work Order WO-9912: Emergency maintenance response to chiller coolant over-temperature. Condenser coil face had 45% surface clogging from oil mist and fine metal swarf. Coolant reservoir was operating at 28.4°C instead of calibrated 20.0-22.0°C setpoint.',
    keywords: ['maintenance', 'chiller', 'condenser', 'swarf', 'clogging', 'filter', 'temperature', 'overheat', 'wo-9912'],
    similarityScore: 0.92,
    date: '2026-09-22',
  },
  {
    id: 'kb-maint-02',
    recordType: 'MAINTENANCE',
    code: 'PM-408',
    title: 'Spindle Bearing Vibration & Arbor Runout Laser Interferometer Calibration',
    productLine: 'CNC Line A-1 Mori Seiki 5-Axis',
    machineId: 'Spindle Unit SP-04',
    symptoms: [
      'Baseline vibration increased from 1.1 to 2.4 mm/s RMS',
      '1.8 kHz harmonic peak',
      'Thermal growth coefficient verification',
    ],
    rootCauseOrDetails:
      'Preload spring relaxation in front ceramic hybrid duplex bearing set combined with lack of thermal expansion compensation.',
    effectiveActionOrGuidance:
      'Adjusted bearing preload; re-mapped laser interferometer thermal growth curve in CNC controller parameter table D400-D420.',
    content:
      'PM-408: Scheduled spindle dynamic runout audit. Laser interferometer measured 2.9 µm radial arbor deflection per 6.0°C rise in spindle cartridge housing temperature. ISO 10816-3 baseline vibration established at 1.15 mm/s RMS nominal.',
    keywords: ['maintenance', 'spindle', 'bearing', 'vibration', 'runout', 'interferometer', 'thermal', 'expansion', 'iso 10816'],
    similarityScore: 0.86,
    date: '2025-11-15',
  },

  // 3. Previous Defect Logs
  {
    id: 'kb-def-01',
    recordType: 'DEFECT',
    code: 'DEF-2025-019',
    title: 'Stage-1 Bearing Race Surface Tearing & Thermal Micro-Cracks',
    productLine: 'PRD-AERO-701 Aerospace Housing',
    machineId: 'CNC Line A-1',
    symptoms: [
      'Optical micro-crack detection (94.2% conf)',
      'Dye-penetrant positive',
      'Surface roughness Ra > 0.8 µm',
      'Abrasive galling',
    ],
    rootCauseOrDetails:
      'Ceramic CBN insert flank wear exceeded 0.40 mm, causing intense frictional heat (> 750°C in shear zone) followed by rapid coolant quenching, triggering thermal fatigue micro-cracking.',
    effectiveActionOrGuidance:
      'Mandated maximum tool in-cut duration of 8 parts (60 min) per insert corner; integrated acoustic emission sensor for real-time chatter detection.',
    content:
      'Defect Investigation DEF-2025-019: Optical telecentric inspection and fluorescent dye-penetrant examination identified network of 40-80 µm thermal fatigue cracks on bore race. Metallurgical section showed white layer re-hardening from high friction cutting with severely worn ceramic tool.',
    keywords: ['defect', 'micro-crack', 'thermal', 'crack', 'surface', 'tearing', 'porosity', 'friction', 'cbn', 'flank', 'metallurgical'],
    similarityScore: 0.89,
    date: '2025-02-11',
  },
  {
    id: 'kb-def-02',
    recordType: 'DEFECT',
    code: 'DEF-2024-077',
    title: 'Flange Face Deep Concentric Micro-Scratches & Burr Deformation',
    productLine: 'PRD-AERO-701 Aerospace Housing',
    machineId: 'CNC Line A-1',
    symptoms: [
      'Concentric circular score lines',
      'Burr height > 0.15 mm',
      'Vision defect alert',
    ],
    rootCauseOrDetails:
      'Chipped insert nose radius dragged work-hardened Inconel chip curl across newly faced sealing surface.',
    effectiveActionOrGuidance:
      'Switched to high-pressure through-spindle coolant (70 bar) chip-breaker geometry; added automated vision camera check after roughing.',
    content:
      'Defect Report DEF-2024-077: Visual inspection flagged micro-scratches and heavy burrs along flange face. Root cause determined to be trapped swarf ribbon scratching the face during rapid retract pass.',
    keywords: ['defect', 'scratch', 'micro-scratch', 'burr', 'swarf', 'scoring', 'chip', 'flange', 'finish'],
    similarityScore: 0.74,
    date: '2024-09-30',
  },

  // 4. Machine Incidents
  {
    id: 'kb-mach-01',
    recordType: 'MACHINE_INCIDENT',
    code: 'INC-MACH-103',
    title: 'Hydraulic Chuck Clamp Pressure Pulsation & Subgroup Mean Shift',
    productLine: 'CNC Line A-1 5-Axis',
    machineId: 'Mori Seiki 5-Axis (Line A-1)',
    symptoms: [
      'Nelson Rule 2 (9 points on one side of CL)',
      'Hydraulic pressure dip below 62 bar',
      'Part axial micro-slippage',
    ],
    rootCauseOrDetails:
      'Hydraulic nitrogen accumulator bladder micro-leakage caused clamp pressure ripple during rapid axis acceleration.',
    effectiveActionOrGuidance:
      'Replaced hydraulic accumulator; added digital pressure transducer with PLC interlock to prevent spindle start if pressure < 65 bar.',
    content:
      'Machine Incident INC-MACH-103: Process control detected 9 consecutive subgroups below nominal diameter (Nelson Rule 2). Hydraulic power unit pressure pulsed between 61 bar and 72 bar during high-feed tool passes.',
    keywords: ['machine', 'hydraulic', 'pressure', 'clamp', 'chuck', 'nelson', 'shift', 'accumulator', 'spindle'],
    similarityScore: 0.68,
    date: '2025-09-29',
  },
  {
    id: 'kb-mach-02',
    recordType: 'MACHINE_INCIDENT',
    code: 'INC-MACH-055',
    title: 'Spindle Thermal Cartridge Elongation During Extended High-Speed Run',
    productLine: 'CNC Line A-1 5-Axis',
    machineId: 'Mori Seiki 5-Axis (Line A-1)',
    symptoms: [
      'Spindle housing temp 31°C',
      'Z-axis thermal growth +0.015 mm',
      'Bore finishing depth error',
    ],
    rootCauseOrDetails:
      'Ambient heatwave (shop floor 32°C) combined with dirty chiller condenser overwhelmed heat dissipation capacity.',
    effectiveActionOrGuidance:
      'Installed supplementary auxiliary refrigerated chiller; automated real-time thermal compensation matrix in CNC Fanuc 31i control.',
    content:
      'Machine Incident INC-MACH-055: Spindle arbor elongated +0.015 mm due to sustained 31°C cartridge temperature. Z-axis datum drifted +0.014 mm. Nelson Rule 3 upward monotonic trend observed on SPC charts.',
    keywords: ['machine', 'spindle', 'thermal', 'elongation', 'drift', 'z-axis', 'chiller', 'overheat', 'ambient'],
    similarityScore: 0.88,
    date: '2024-07-14',
  },

  // 5. Tool Wear Incidents
  {
    id: 'kb-tool-01',
    recordType: 'TOOL_WEAR',
    code: 'TOOL-2026-031',
    title: 'Ceramic Boring Insert Flank Over-Wear (VB > 0.42 mm) Under Heavy Cut',
    productLine: 'PRD-AERO-701 Inconel Finishing',
    machineId: 'CNC Line A-1 Mori Seiki',
    symptoms: [
      'Tool usage reached 128 minutes',
      'Motor current surged to 26.5 A',
      'Cutting chatter 3.8 mm/s',
      'VB flank wear 0.42 mm',
    ],
    rootCauseOrDetails:
      'Operator overrode automatic tool wear life counter (set to 120 min max) to complete shift, leading to severe cutting edge rubbing and workpiece thermal shock.',
    effectiveActionOrGuidance:
      'Locked tool life management macro behind supervisor password; automated tool retraction and line stop upon reaching 100 minutes cut time.',
    content:
      'Tool Incident TOOL-2026-031: Tool usage exceeded maximum certified life (128 min vs 100 min recommended, 120 min critical). Ceramic insert flank wear VB measured 0.42 mm. Resulted in high motor current load (26.5 A vs 18.5 A nominal) and chatter vibration (3.8 mm/s RMS).',
    keywords: ['tool', 'wear', 'flank', 'vb', 'overuse', 'motor', 'current', 'vibration', 'chatter', 'friction', 'ceramic', 'insert'],
    similarityScore: 0.91,
    date: '2026-03-05',
  },
  {
    id: 'kb-tool-02',
    recordType: 'TOOL_WEAR',
    code: 'TOOL-2025-092',
    title: 'Insert Cutting Corner Delamination & Chipping on Intermittent Bore Slot',
    productLine: 'PRD-AERO-701 Inconel Finishing',
    machineId: 'CNC Line A-1',
    symptoms: [
      'Motor current spike',
      'Instantaneous vibration shock 4.2 mm/s',
      'Groove wall gouging',
    ],
    rootCauseOrDetails:
      'Intermittent entry shock into lubrication cross-hole caused micro-chipping of brittle ceramic cutting corner.',
    effectiveActionOrGuidance:
      'Programmed CNC feed rate deceleration macro to 50% feed (225 mm/min) across cross-hole boundary; switched to tougher whisker-reinforced ceramic grade.',
    content:
      'Tool Incident TOOL-2025-092: Sudden tool corner fracture during internal bore interrupted cut. Acoustic vibration spiked to 4.2 mm/s. Caused step gouge in bore diameter.',
    keywords: ['tool', 'wear', 'chipping', 'fracture', 'feed', 'intermittent', 'vibration', 'shock', 'corner'],
    similarityScore: 0.72,
    date: '2025-08-19',
  },

  // 6. Inspection Procedures
  {
    id: 'kb-insp-01',
    recordType: 'INSPECTION_PROCEDURE',
    code: 'QIP-MET-04',
    title: 'CMM Coordinate Metrology Protocol for Aerospace Precision Bores',
    productLine: 'PRD-AERO-701 Aerospace Housing',
    machineId: 'Zeiss Prismo CMM Station #1',
    symptoms: [
      'Thermal soak requirement',
      'Temperature normalization at 20°C ± 0.5°C',
      'Least-squares cylinder fit',
    ],
    rootCauseOrDetails:
      'Parts measured hot immediately off CNC exhibit +0.002 to +0.004 mm false thermal expansion.',
    effectiveActionOrGuidance:
      'Mandatory 45-minute temperature soak in temperature-controlled metrology lab (20.0°C) before final acceptance CMM scan.',
    content:
      'Inspection Standard QIP-MET-04: Procedure specifies minimum 16-point circle measurement across 3 bore planes. Parts must be thermally soaked at 20°C ± 0.5°C for 45 minutes prior to dimension certification. If part temperature exceeds 22°C, apply CTE compensation: ΔD = D * α * (T - 20°C).',
    keywords: ['inspection', 'procedure', 'cmm', 'metrology', 'bore', 'temperature', 'soak', 'tolerance', 'usl', 'lsl', 'expansion'],
    similarityScore: 0.85,
    date: '2024-01-10',
  },
  {
    id: 'kb-insp-02',
    recordType: 'INSPECTION_PROCEDURE',
    code: 'QIP-VIS-12',
    title: 'Telecentric Optical Surface Defect & Micro-Crack Detection Standard',
    productLine: 'PRD-AERO-701 Bearing Surfaces',
    machineId: 'Keyence Automated Vision Cell #2',
    symptoms: [
      'Defect area classification',
      'Confidence threshold 0.85',
      'Solvent degreasing requirement',
    ],
    rootCauseOrDetails:
      'Dried coolant residue droplets can mimic surface porosity or micro-cracking.',
    effectiveActionOrGuidance:
      'Ultrasonic solvent degreasing and hot-air dry required prior to vision inspection camera capture.',
    content:
      'Inspection Standard QIP-VIS-12: High-resolution telecentric optical inspection for surface cracks and porosity. Requires multi-angle darkfield LED illumination. All automated vision flags with confidence >= 0.85 require secondary visual confirmation by certified Quality Metrologist.',
    keywords: ['inspection', 'procedure', 'vision', 'optical', 'micro-crack', 'porosity', 'defect', 'telecentric', 'camera'],
    similarityScore: 0.82,
    date: '2024-05-20',
  },

  // 7. SOP Excerpts
  {
    id: 'kb-sop-01',
    recordType: 'SOP_EXCERPT',
    code: 'SOP-AERO-MACH-12',
    title: 'Standard Operating Procedure: 5-Axis Precision Machining of Inconel 718',
    productLine: 'PRD-AERO-701 Aerospace Housing',
    machineId: 'Mori Seiki 5-Axis Line A-1',
    symptoms: [
      'Coolant concentration 8.5-10.0% Brix',
      'Chiller temp limit 24.0°C',
      'Tool life 100 min limit',
    ],
    rootCauseOrDetails:
      'Diluted coolant or coolant temp > 24°C accelerates catastrophic flank wear and causes bore thermal growth.',
    effectiveActionOrGuidance:
      'Daily refractometer brix check; automatic machine feed hold if coolant temperature exceeds 24.0°C; tool change mandatory at 100 minutes.',
    content:
      'SOP-AERO-MACH-12 §4.2: Coolant concentration must be maintained at 8.5% to 10.0% Brix using water-miscible ester emulsion. §5.1: CNC chiller setpoint must be 20.0°C; if coolant delivery temperature exceeds 24.0°C, operator must halt line immediately. §6.3: Ceramic finish boring inserts must be changed every 10 parts or 100 minutes cut time, whichever comes first.',
    keywords: ['sop', 'procedure', 'coolant', 'brix', 'concentration', 'chiller', 'temperature', 'tool', 'inconel', 'machining'],
    similarityScore: 0.90,
    date: '2025-03-01',
  },
  {
    id: 'kb-sop-02',
    recordType: 'SOP_EXCERPT',
    code: 'SOP-QA-DISP-08',
    title: 'Standard Operating Procedure: Quality Nonconformance Disposition & Quarantine',
    productLine: 'All Aerospace Precision Lines',
    machineId: 'Plant Quality Management System',
    symptoms: [
      'Mandatory quarantine tagging',
      'Human Quality Engineer sign-off gate',
      'Epistemic audit logging',
    ],
    rootCauseOrDetails:
      'Autonomous AI systems must never release or disposition safety-critical aerospace flight hardware without human sign-off.',
    effectiveActionOrGuidance:
      'Strict human-in-the-loop sign-off gate enforced under ISO 9001:2015 §8.7 and AS9100D §8.7.',
    content:
      'SOP-QA-DISP-08 §3.1: Any batch with out-of-control SPC (Nelson Rule 1 or 3) or out-of-specification CMM measurement must be quarantined immediately with red lock-out tag. AI agent recommendations are classified as RCA_HYPOTHESIS; elevation to CONFIRMED_ROOT_CAUSE requires physical verification and digital signature by a certified Quality Engineer.',
    keywords: ['sop', 'procedure', 'quarantine', 'disposition', 'human', 'sign-off', 'governance', 'iso 9001', 'epistemic'],
    similarityScore: 0.79,
    date: '2025-01-15',
  },
];

// -----------------------------------------------------------------------------
// DENSE VECTOR EMBEDDINGS & RETRIEVAL (FAISS IndexFlatIP Equivalent)
// -----------------------------------------------------------------------------

const EMBEDDING_DIMENSION = 64;

/**
 * Generates normalized dense embedding vector for text using term-frequency hashing
 */
function createDenseEmbedding(text: string = ''): number[] {
  const tokens = (text || '').toLowerCase().match(/\b[a-zA-Z0-9_\-\.]{2,}\b/g) || [];
  const vector = new Array(EMBEDDING_DIMENSION).fill(0);

  if (tokens.length === 0) return vector;

  tokens.forEach((t: string) => {
    let hash = 0;
    for (let i = 0; i < t.length; i++) {
      hash = (hash << 5) - hash + t.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % EMBEDDING_DIMENSION;
    vector[idx] += 1.0;
  });

  // Normalize vector to unit length for inner product (cosine similarity)
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}

// Pre-compute embeddings for knowledge base records
const KNOWLEDGE_BASE_EMBEDDINGS: number[][] = SYNTHETIC_QUALITY_KNOWLEDGE_BASE.map((rec) => {
  const corpus = `${rec.code} ${rec.title} ${rec.recordType} ${rec.keywords.join(' ')} ${rec.content} ${rec.rootCauseOrDetails}`;
  return createDenseEmbedding(corpus);
});

/**
 * Step 1: Generates an automated retrieval query from current quality incident context
 */
export function generateRetrievalQuery(incidentContext: {
  title?: string;
  defectType?: string;
  dimensionalResults?: string;
  processAnomalies?: string[];
  vibration?: number;
  toolUsage?: number;
  machineId?: string;
  material?: string;
  spcFindings?: string;
}): string {
  const terms: string[] = [];

  if (incidentContext.title) terms.push(incidentContext.title);
  if (incidentContext.defectType) terms.push(`defect ${incidentContext.defectType}`);
  if (incidentContext.dimensionalResults) terms.push(`dimensional ${incidentContext.dimensionalResults}`);
  if (incidentContext.processAnomalies && incidentContext.processAnomalies.length > 0) {
    terms.push(`process ${incidentContext.processAnomalies.join(' ')}`);
  }
  if (typeof incidentContext.vibration === 'number') {
    terms.push(`vibration ${incidentContext.vibration} mm/s chatter`);
  }
  if (typeof incidentContext.toolUsage === 'number') {
    terms.push(`tool usage ${incidentContext.toolUsage} minutes flank wear`);
  }
  if (incidentContext.machineId) terms.push(incidentContext.machineId);
  if (incidentContext.material) terms.push(incidentContext.material);
  if (incidentContext.spcFindings) terms.push(`spc ${incidentContext.spcFindings}`);

  if (terms.length === 0) {
    return 'Inconel 718 bore oversize thermal expansion chiller swarf cutting chatter tool wear';
  }

  return terms.join(' ');
}

/**
 * Steps 2 & 3: Retrieves top-k relevant historical evidence records
 * using dense vector inner-product similarity (matching FAISS IndexFlatIP)
 */
export function retrieveSimilarIncidents(
  queryText: string,
  topK = 4,
  filterType?: KnowledgeRecordType
): Array<{
  incidentId: string;
  title: string;
  recordType: KnowledgeRecordType;
  similarity: number;
  historicalRootCause: string;
  effectiveAction: string;
  evidenceSnippet: string;
  symptoms: string[];
}> {
  const queryVec = createDenseEmbedding(queryText);
  const scored: Array<{
    record: HistoricalKnowledgeRecord;
    similarity: number;
  }> = [];

  SYNTHETIC_QUALITY_KNOWLEDGE_BASE.forEach((rec, idx) => {
    if (filterType && rec.recordType !== filterType) return;

    const recVec = KNOWLEDGE_BASE_EMBEDDINGS[idx];
    // Cosine similarity on unit vectors
    let dot = 0;
    for (let d = 0; d < EMBEDDING_DIMENSION; d++) {
      dot += queryVec[d] * recVec[d];
    }

    // Keyword boost
    const qLower = queryText.toLowerCase();
    let kwMatches = 0;
    rec.keywords.forEach((kw) => {
      if (qLower.includes(kw)) kwMatches++;
    });

    const adjustedSim = Math.min(0.98, Math.max(0.42, dot * 0.75 + (kwMatches / Math.max(1, rec.keywords.length)) * 0.25));

    scored.push({
      record: rec,
      similarity: Number(adjustedSim.toFixed(3)),
    });
  });

  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK).map((s) => ({
    incidentId: s.record.code,
    title: s.record.title,
    recordType: s.record.recordType,
    similarity: s.similarity,
    historicalRootCause: s.record.rootCauseOrDetails,
    effectiveAction: s.record.effectiveActionOrGuidance,
    evidenceSnippet: s.record.content.slice(0, 240) + '...',
    symptoms: s.record.symptoms,
  }));
}

/**
 * Step 4: RCA AGENT
 * Synthesizes multiple root-cause hypotheses with:
 * - hypothesis (cautious wording: "Potential contributing factor...")
 * - supportingEvidence (bullet points)
 * - contradictingEvidence (bullet points)
 * - confidence (0.00 - 1.00)
 * - requiredVerification (concrete verification tests)
 * - evidenceSources (source telemetry, metrology, and RAG matches)
 *
 * CRITICAL RULE: Never converts correlation into confirmed causation.
 */
export function synthesizeRcaHypotheses(
  incidentContext: {
    incidentId: string;
    productName: string;
    productCode: string;
    machineLine: string;
    material: string;
    defectType?: string;
    measuredBoreDiameter?: number;
    usl?: number;
    coolantTemp?: number;
    vibrationRms?: number;
    toolUsageMinutes?: number;
    motorCurrentA?: number;
    spcRulesTriggered?: string[];
    maintenanceLogs?: string[];
  },
  retrievedEvidence: Array<{
    incidentId: string;
    title: string;
    recordType: KnowledgeRecordType;
    similarity: number;
    historicalRootCause: string;
    effectiveAction: string;
  }>
): RcaHypothesis[] {
  const hypotheses: RcaHypothesis[] = [
    // Hypothesis 1: Spindle Thermal Expansion via Chiller Condenser Airflow Blockage
    {
      id: 'hypo-1',
      hypothesis: 'Potential spindle arbor thermal expansion driven by chiller condenser swarf clogging',
      hypothesisStatement:
        'Potential contributing factor: Airborne swarf clogging on Chiller Unit #2 condenser fin pack may have elevated coolant delivery temperature to 28.4°C, driving estimated +2.9 µm spindle thermal arbor elongation and contributing to oversized bore diameters.',
      confidence: 0.92,
      likelihoodScore: 0.92,
      category: 'Machine',
      epistemicType: 'RCA_HYPOTHESIS',
      status: 'PENDING_VERIFICATION',
      supportingEvidence: [
        `Coolant temperature telemetry climbed monotonically from 22.0°C to 28.4°C (+6.4°C thermal drift).`,
        `Thermal expansion coefficient calculation indicates ΔL = α * L * ΔT = 11.2 µm/m°C * 0.40m * 6.4°C = +2.87 µm radial growth, correlating closely with observed +0.003 mm bore deviation.`,
        `SPC chart exhibits Nelson Rule 3 (monotonic upward trend across 6 consecutive subgroups).`,
        `Maintenance Work Order WO-9912 documented 45% surface clogging from swarf and oil mist on Chiller #2 condenser.`,
        `Historical RAG match NCR-2024-041 (94% similarity) confirmed identical spindle expansion failure mode on Inconel 718.`,
      ],
      contradictingEvidence: [
        `Ambient temperature in the machining bay was regulated at 21.5°C; external heat ingress did not occur.`,
        `Initial 14 parts in the batch were machined within tolerance before the thermal threshold was breached.`,
        `Correlation between coolant temperature and bore size does not prove sole causation without direct laser arbor measurement.`,
      ],
      requiredVerification: [
        'Inspect and clean Chiller Unit #2 refrigeration condenser fin pack.',
        'Perform spindle runout and axial thermal growth measurement using laser interferometer at 22°C vs 28°C.',
        'Verify PLC ladder parameter D402 coolant over-temp cutoff setting (ensure lowered from 35°C to 24°C).',
      ],
      suggestedPhysicalTest:
        'Clean condenser fin pack, run spindle dry for 45 minutes at 10,000 RPM, measure arbor runout and thermal growth with laser interferometer at 22°C vs 28°C.',
      evidenceSources: [
        'Coolant Temperature Telemetry Channel 01',
        'Zeiss Prismo CMM Inspection Report CMM-2026-882',
        'Nelson Rule 3 SPC Chart Detection',
        'Maintenance Log WO-9912 (Chiller Fin Pack)',
        'RAG NCR-2024-041 (94% Similarity)',
      ],
      evidenceChain: [
        '[OBSERVED FACT] Chiller condenser intake clogged with particulate swarf.',
        '[OBSERVED FACT] Coolant temp climbed from 22.0°C to 28.4°C.',
        '[STATISTICAL FINDING] Thermal expansion formula: ΔL = α * L * ΔT = 11.2e-6 * 400 * 6.4 = +2.87 µm radial growth.',
        '[STATISTICAL FINDING] Nelson Rule 3 detected on Bore ID trend beginning at subgroup 7.',
        '[OBSERVED FACT] CMM verified parts oversized by +3.0 µm.',
      ],
    },

    // Hypothesis 2: Potential Tool Wear (Prompt Exact Specification)
    {
      id: 'hypo-2',
      hypothesis: 'Potential tool wear',
      hypothesisStatement:
        'Evidence supports further investigation: Ceramic boring insert flank wear exceeding certified reference life (128 min vs 100 min limit) may have elevated cutting friction and harmonic chatter, potentially contributing to localized thermal micro-cracking and bore dimensional variation.',
      confidence: 0.88,
      likelihoodScore: 0.88,
      category: 'Method',
      epistemicType: 'RCA_HYPOTHESIS',
      status: 'PENDING_VERIFICATION',
      supportingEvidence: [
        'Tool usage significantly above reference level (128 min logged vs 100 min certified reference limit).',
        'Dimensional drift observed (+0.003 mm deviation above USL on bore diameter).',
        'Vibration increased (accelerometer recorded chatter spike to 3.85 mm/s RMS vs 1.1 mm/s nominal).',
        'Similar historical incident retrieved (TOOL-2026-031 & DEF-2025-019: flank wear VB > 0.40 mm induces chatter & micro-cracks).',
        'Motor current increased from 18.5 A nominal to 26.5 A (+43% cutting resistance).',
        'Computer vision model detected localized thermal micro-cracking (94.2% confidence), corroborated by dye-penetrant test.',
      ],
      contradictingEvidence: [
        'Flank wear alone typically causes undersized internal bores due to cutting edge loss, whereas the observed defect is oversize (suggesting coupled thermal expansion).',
        'Cutting insert was not fractured upon initial visual inspection; nose radius remained intact.',
        'Micro-cracks were confined to the finish pass entry zone rather than the entire bore length.',
      ],
      requiredVerification: [
        'Inspect cutting tool (measure flank wear VB under toolmaker optical microscope against 0.15 mm threshold).',
        'Verify tool offset (measure tool presetter geometry and coordinate compensation).',
        'Inspect tool holder (inspect spindle taper and collet for micro-slippage / fretting).',
      ],
      suggestedPhysicalTest:
        'Mount fresh ceramic insert on identical test blank under nominal coolant; inspect with SEM microscope to verify absence of thermal cracking.',
      evidenceSources: [
        'Tool Wear Duration Tracker (128 min logged)',
        'Spindle Motor Current Transducer (26.5 A peak)',
        'Line A-1 Accelerometer Telemetry (3.85 mm/s RMS)',
        'Vision Defect Model YOLOv11-ResNet50 (94.2% conf)',
        'RAG DEF-2025-019 (89% Similarity)',
      ],
      evidenceChain: [
        '[OBSERVED FACT] Flank wear measured at 0.42 mm (2.8x max limit).',
        '[OBSERVED FACT] Cutting vibration RMS spiked from 1.1 to 3.8 mm/s.',
        '[MODEL_PREDICTION] Visual Inspection Agent detected thermal cracking with 94.2% confidence.',
        '[OBSERVED FACT] Dye-penetrant test confirmed localized 60 µm thermal fatigue cracks.',
      ],
    },

    // Hypothesis 3: Coolant Dilution & Film Boundary Breakdown
    {
      id: 'hypo-3',
      hypothesis: 'Potential coolant emulsion dilution compromising boundary lubrication',
      hypothesisStatement:
        'Requires engineering verification: Coolant concentration dilution to 5.2% Brix (below SOP-AERO-MACH-12 minimum 8.5%) may have compromised extreme-pressure film boundary strength, potentially accelerating tool wear and amplifying cutting temperatures.',
      confidence: 0.74,
      likelihoodScore: 0.74,
      category: 'Material',
      epistemicType: 'RCA_HYPOTHESIS',
      status: 'PENDING_VERIFICATION',
      supportingEvidence: [
        `Refractometer reading on Line A-1 sump recorded 5.2% Brix, violating SOP-AERO-MACH-12 requirement (8.5% to 10.0%).`,
        `Superalloy Inconel 718 work-hardens rapidly under insufficient boundary lubrication, increasing shear zone friction.`,
        `Shift handover logbook for Shift 1 -> Shift 2 showed missing coolant top-up verification.`,
        `RAG SOP-AERO-12 (90% similarity) specifies automatic line stop if coolant concentration falls below 8.5%.`,
      ],
      contradictingEvidence: [
        `Coolant supply pump pressure remained stable at 68.5 bar; fluid delivery volume to cutting nozzle was not interrupted.`,
        `Concentration was 5.2% rather than pure water, providing partial cooling capacity.`,
      ],
      requiredVerification: [
        'Sample coolant sump fluid and perform Four-Ball Extreme Pressure lubricity test (ASTM D2783).',
        'Verify water-to-concentrate ratio using calibrated digital refractometer before and after concentrate re-dosing.',
        'Review coolant maintenance logbook and auto-mixer dosing pump flowmeter calibration.',
      ],
      suggestedPhysicalTest:
        'Perform Four-Ball Extreme Pressure lubricity test on current sump sample vs freshly mixed 9.0% concentrate.',
      evidenceSources: [
        'Optical Refractometer Sump Inspection (5.2% Brix)',
        'Shift Handover Logbook Record Shift 1-2',
        'RAG SOP-AERO-MACH-12 §4.2 (90% Similarity)',
      ],
      evidenceChain: [
        '[OBSERVED FACT] Coolant refractometer reading measured 5.2% Brix.',
        '[HISTORICAL INCIDENT] Incident INC-2024-041 showed identical lubricity failure mode on Inconel alloys.',
      ],
    },

    // Hypothesis 4: Asymmetric Hydraulic Chuck Clamping Distortion
    {
      id: 'hypo-4',
      hypothesis: 'Potential hydraulic clamp pressure ripple inducing component elastic deflection',
      hypothesisStatement:
        'Evidence supports further investigation: Hydraulic clamp pressure dips to 62.5 bar during high-feed passes may have caused subtle part elastic deformation, which upon de-clamping could contribute to roundness distortion or bore measurement variation.',
      confidence: 0.58,
      likelihoodScore: 0.58,
      category: 'Machine',
      epistemicType: 'RCA_HYPOTHESIS',
      status: 'PENDING_VERIFICATION',
      supportingEvidence: [
        `Hydraulic clamp pressure dipped to 62.5 bar during cycle frame 28 (warning threshold < 65.0 bar).`,
        `Historical RAG match NCR-2025-089 (81% similarity) showed thin-walled Inconel ovality caused by clamp pressure fluctuation.`,
      ],
      contradictingEvidence: [
        `CMM roundness scan showed uniform circularity deviation rather than classic 3-lobe tri-lobed clamp pattern.`,
        `Pressure dip was momentary (under 3 seconds) and recovered to 68.0 bar.`,
      ],
      requiredVerification: [
        'Measure dynamic clamp force using wireless sensor ring jaw gauge across full spindle RPM range.',
        'Inspect hydraulic accumulator nitrogen pre-charge pressure (verify 50 bar minimum).',
        'Verify CMM multi-plane harmonic roundness Fourier decomposition (check for 3-lobed component).',
      ],
      suggestedPhysicalTest:
        'Mount wireless load cell jaw gauge in chuck, spin to 10,000 RPM, verify gripping force stability under hydraulic valve cycling.',
      evidenceSources: [
        'Hydraulic Pressure Transducer Log (62.5 bar transient)',
        'RAG NCR-2025-089 (81% Similarity)',
      ],
      evidenceChain: [
        '[OBSERVED FACT] Hydraulic pressure dipped to 62.5 bar during cycle.',
        '[HISTORICAL INCIDENT] NCR-2025-089 logged clamping distortion on similar thin-walled housing.',
      ],
    },
  ];

  return hypotheses;
}
