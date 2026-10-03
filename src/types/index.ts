export type EpistemicType =
  | 'OBSERVED_FACT'
  | 'MODEL_PREDICTION'
  | 'STATISTICAL_FINDING'
  | 'RCA_HYPOTHESIS'
  | 'CONFIRMED_ROOT_CAUSE'
  | 'HUMAN_DECISION';

export interface EpistemicItem {
  id: string;
  type: EpistemicType;
  title: string;
  detail: string;
  source: string;
  timestamp: string;
  confidence?: number;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface ToleranceSpec {
  parameter: string;
  unit: string;
  nominal: number;
  usl: number; // Upper Specification Limit
  lsl: number; // Lower Specification Limit
  warningMarginPct?: number;
}

export interface ProductConfig {
  id: string;
  productCode: string;
  name: string;
  category: string;
  description: string;
  tolerances: ToleranceSpec[];
  aqlLevel: string; // e.g., 'Level II (0.65% AQL)'
  sampleSizePerSubgroup: number;
  criticalToQualityPoints: string[];
}

export type BatchStatus = 'ACTIVE' | 'PASSED' | 'WARNING' | 'QUARANTINED' | 'COMPLETED';

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  productCode: string; // Part Number
  productName: string; // Product
  lineId: string; // Machine
  operatorId: string;
  material: string;
  shift: string;
  startTime: string; // Production Start
  endTime?: string; // Production End
  totalUnits: number; // Quantity
  inspectedUnits: number;
  passedUnits: number;
  quarantinedUnits: number;
  defectCount: number;
  yieldPercentage: number;
  status: BatchStatus;
  humanSignOff?: {
    approvedBy: string;
    role: string;
    timestamp: string;
    status: 'APPROVED' | 'QUARANTINED' | 'REJECTED';
    notes: string;
  };
}

export interface DimensionalInspectionRecord {
  componentId: string;
  measuredDiameterMm: number;
  nominalMm: number;
  toleranceMm: number;
  lslMm: number;
  uslMm: number;
  deviationMm: number;
  status: 'CONFORMING' | 'NONCONFORMING';
  timestamp?: string;
  notes?: string;
}

export interface TelemetryPoint {
  timestamp: string;
  // 8 Required Process Parameters:
  temperatureC: number; // Temperature (°C)
  pressureBar: number; // Pressure (bar)
  spindleSpeedRpm: number; // Spindle Speed (RPM)
  feedRateMmMin: number; // Feed Rate (mm/min)
  machineVibrationMmS: number; // Machine Vibration (mm/s RMS)
  toolUsageMinutes: number; // Tool Usage (cumulative minutes)
  cycleTimeS: number; // Cycle Time (seconds)
  motorCurrentA: number; // Motor Current (Amperes)

  // Backward-compatible aliases:
  coolantTempC?: number;
  hydraulicPressureBar?: number;
  vibrationMmS?: number;

  // Anomaly metrics:
  anomalyScore: number;
  isAnomaly: boolean;
  anomalyType?: 'SUDDEN_SPIKE' | 'UNUSUAL_COMBINATION' | 'GRADUAL_DRIFT' | 'ABNORMAL_VIBRATION' | 'TOOL_OVERUSE';
  parametersInvolved?: string[];
  evidence?: string;
  anomalyReasons?: string[];
}

export interface ProcessAnomalyRecord {
  id: string;
  timestamp: string;
  anomalyScore: number;
  status: 'NORMAL' | 'ANOMALY';
  parametersInvolved: string[];
  parameterValues: Record<string, number>;
  anomalyType: 'SUDDEN_SPIKE' | 'UNUSUAL_COMBINATION' | 'GRADUAL_DRIFT' | 'ABNORMAL_VIBRATION' | 'TOOL_OVERUSE';
  evidence: string;
  epistemicType: 'STATISTICAL_FINDING';
  thresholdViolation?: boolean;
}

export interface ImrDataPoint {
  index: number;
  sampleId: string;
  timestamp: string;
  individualValue: number; // X_i
  movingRange: number | null; // MR_i = |X_i - X_{i-1}|
  isOutOfSpec: boolean; // Outside LSL / USL (Engineering Specification Limit)
  isOutOfControlIndividual: boolean; // Outside LCL_x / UCL_x (Statistical Control Limit)
  isOutOfControlMr: boolean; // Outside UCL_mr (Statistical Control Limit)
  violatedRule?: string;
  notes?: string;
}

export interface ImrControlChartResult {
  parameterName: string;
  unit: string;
  totalSamples: number;
  hasSufficientData: boolean; // Minimum 10 samples required for reliable capability
  
  // Statistical Limits (Voice of the Process)
  mean: number; // X-bar (Center Line)
  movingRangeMean: number; // MR-bar (Center Line of Moving Range)
  sigma: number; // Estimated standard deviation = MR-bar / d2 (d2=1.128 for n=2)
  uclIndividual: number; // X-bar + 2.66 * MR-bar
  lclIndividual: number; // X-bar - 2.66 * MR-bar
  centerLineIndividual: number; // X-bar
  uclMovingRange: number; // 3.267 * MR-bar
  lclMovingRange: number; // 0
  centerLineMovingRange: number; // MR-bar

  // Specification Limits (Voice of the Customer / Engineering Tolerance)
  lsl: number; // Lower Specification Limit
  usl: number; // Upper Specification Limit
  nominal: number; // Target Nominal

  // Process Capability Indices
  cp: number | null; // (USL - LSL) / (6 * sigma)
  cpk: number | null; // min((USL - mean)/(3*sigma), (mean - LSL)/(3*sigma))
  capabilityStatus: 'CAPABLE' | 'MARGINAL' | 'INCAPABLE' | 'INSUFFICIENT_DATA';
  processControlStatus: 'IN_CONTROL' | 'OUT_OF_CONTROL';

  points: ImrDataPoint[];
  statisticalFindings: string[];
  specificationViolations: string[];
}

export interface DefectBoundingBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  defectClass: 'Micro-Scratch' | 'Surface Porosity' | 'Pitting' | 'Thermal Crack' | 'Burr Deformation' | 'Foreign Inclusion';
  confidence: number; // 0.00 - 1.00
  areaMm2: number;
}

export interface VisualInspectionItem {
  id: string;
  batchId: string;
  partSerialNumber: string;
  timestamp: string;
  imageUrl: string;
  componentType: string;
  status: 'CONFORMING' | 'NON_CONFORMING' | 'REQUIRES_REVIEW';
  defects: DefectBoundingBox[];
  cnnModelVersion: string;
  architecture: string; // e.g., 'ResNet50-FPN Transfer Learning'
  epistemicType: EpistemicType;
  humanVerdict?: 'CONFIRMED_DEFECT' | 'FALSE_POSITIVE' | 'PASSED_OVERRIDE';
  humanInspector?: string;
  inspectionNotes?: string;
}

export interface SpcSubgroup {
  subgroupId: number;
  timestamp: string;
  samples: number[];
  mean: number;
  range: number;
  stdDev: number;
  ucl: number;
  cl: number;
  lcl: number;
  isOutOfControl: boolean;
  violatedRules: number[]; // Nelson rules 1-8
}

export interface SpcCalculationResult {
  parameterName: string;
  unit: string;
  sampleSizeN: number;
  subgroupCount: number;
  grandMeanXBarBar: number;
  meanRangeRBar: number;
  estimatedSigma: number;
  uclX: number;
  clX: number;
  lclX: number;
  uclR: number;
  clR: number;
  lclR: number;
  usl: number;
  lsl: number;
  nominal: number;
  cp: number;
  cpk: number;
  cpu: number;
  cpl: number;
  pp?: number;
  ppk?: number;
  status: 'STABLE' | 'WARNING' | 'OUT_OF_CONTROL';
  activeViolations: Array<{
    subgroupId: number;
    ruleNumber: number;
    ruleName: string;
    description: string;
  }>;
  subgroups: SpcSubgroup[];
}

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';

export interface QualityIncident {
  id: string;
  incidentCode: string;
  timestamp: string;
  batchId: string;
  productCode: string;
  lineId: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  observedFacts: string[];
  immediateContainment: string;
  affectedUnitsCount: number;
  scrapCostEstimateUsd: number;
  rootCauseId?: string;
  capaId?: string;
}

export interface FiveWhysStep {
  step: number;
  question: string;
  answer: string;
  epistemicType: EpistemicType;
  evidence: string;
  verified: boolean;
}

export interface FishboneCategory {
  category: 'Machine' | 'Method' | 'Material' | 'Manpower' | 'Measurement' | 'Milieu';
  factors: Array<{
    id: string;
    factor: string;
    epistemicType: EpistemicType;
    evidence: string;
    isKeyDriver: boolean;
  }>;
}

export interface RcaHypothesis {
  id: string;
  hypothesis: string; // Required by prompt
  hypothesisStatement: string; // Backward compatibility
  supportingEvidence: string[]; // Required by prompt
  contradictingEvidence: string[]; // Required by prompt
  confidence: number; // Required by prompt: 0.0 - 1.0
  likelihoodScore: number; // Backward compatibility
  requiredVerification: string[]; // Required by prompt
  suggestedPhysicalTest: string; // Backward compatibility
  evidenceSources: string[]; // Required by prompt
  category: 'Machine' | 'Method' | 'Material' | 'Manpower' | 'Measurement' | 'Milieu';
  epistemicType: EpistemicType; // RCA_HYPOTHESIS until confirmed
  evidenceChain: string[];
  status: 'PENDING_VERIFICATION' | 'REFUTED' | 'CONFIRMED_ROOT_CAUSE';
  verificationNotes?: string;
  confirmedBy?: string;
  confirmedAt?: string;
}

export type KnowledgeRecordType =
  | 'NCR'
  | 'MAINTENANCE'
  | 'DEFECT'
  | 'MACHINE_INCIDENT'
  | 'TOOL_WEAR'
  | 'INSPECTION_PROCEDURE'
  | 'SOP_EXCERPT';

export interface HistoricalKnowledgeRecord {
  id: string;
  recordType: KnowledgeRecordType;
  code: string;
  title: string;
  productLine?: string;
  machineId?: string;
  symptoms: string[];
  rootCauseOrDetails: string;
  effectiveActionOrGuidance: string;
  content: string;
  keywords: string[];
  similarityScore?: number;
  date?: string;
}

export interface RcaAnalysis {
  id: string;
  incidentId: string;
  batchId: string;
  timestamp: string;
  generatedBy: 'AGENTIC_ORCHESTRATOR' | 'HUMAN_EXPERT';
  fiveWhys: FiveWhysStep[];
  fishbone: FishboneCategory[];
  hypotheses: RcaHypothesis[];
  confirmedRootCauseId?: string;
  synthesizedSummary: string;
  ragMatches: Array<{
    incidentId: string;
    title: string;
    similarity: number;
    historicalRootCause: string;
    effectiveAction: string;
    recordType?: KnowledgeRecordType;
    evidenceSnippet?: string;
  }>;
}

export interface CapaActionItem {
  id: string;
  actionId?: string; // Prompt specification: Action ID
  type: 'CONTAINMENT' | 'CORRECTIVE' | 'PREVENTIVE'; // Prompt specification: Type
  description: string; // Prompt specification: Description
  action?: string; // Backwards compatibility alias
  responsibleRole: string; // Prompt specification: Responsible Role
  responsibleName?: string;
  dueDate: string; // Prompt specification: Due Date
  targetDate?: string; // Backwards compatibility alias
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'APPROVED' | 'REJECTED'; // Prompt specification: Status
  evidence: string; // Prompt specification: Evidence
  evidenceDocumentation?: string; // Backwards compatibility alias
  completionDate?: string; // Prompt specification: Completion Date
  effectivenessResult?: string; // Prompt specification: Effectiveness Result
  verificationMetric?: string;
}

export interface HumanAuditEntry {
  id: string;
  timestamp: string;
  agent: string;
  finding: string;
  humanDecision: string;
  reviewerComment: string;
  engineerName?: string;
  licenseBadgeId?: string;
  entityId?: string;
  entityType?: 'DEFECT' | 'ROOT_CAUSE' | 'CAPA' | 'BATCH' | 'RE_ANALYSIS';
}

export interface CapaPlan {
  id: string;
  incidentId: string;
  rcaId: string;
  batchId: string;
  title: string;
  isoStandardReference: 'ISO 9001:2015 §8.7 / §10.2' | 'IATF 16949 §10.2.3' | 'AS9100D';
  rootCauseSummary: string;
  actions: CapaActionItem[];
  verificationCriteria: string;
  targetCpkPostAction: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IMPLEMENTED' | 'CLOSED';
  humanApproval?: {
    approved: boolean;
    engineerName: string;
    licenseBadgeId: string;
    timestamp: string;
    comments: string;
    signatureDigitalToken: string;
  };
}

export interface CriticAuditFinding {
  id: string;
  category: 'METHODOLOGY' | 'STATISTICAL_VALIDITY' | 'CONFIRMATION_BIAS' | 'SAFETY_INTEGRITY' | 'CONTAINMENT_ADEQUACY';
  severity: 'INFO' | 'ADVISORY' | 'WARNING' | 'CRITICAL_BLOCKER';
  findingText: string;
  recommendation: string;
}

export interface QualityReviewReport {
  id: string;
  incidentId: string;
  rcaId: string;
  capaId: string;
  timestamp: string;
  auditScore: number; // 0 - 100
  confirmationBiasRisk: 'LOW' | 'MEDIUM' | 'ELEVATED';
  statisticalRigorScore: number; // 0 - 100
  verdict: 'APPROVED_FOR_RELEASE' | 'CONDITIONAL_APPROVAL' | 'REJECT_REQUIRE_RCA_REVISION';
  findings: CriticAuditFinding[];
  criticAgentModel: string;
  deliberationLog: Array<{
    agentName: string;
    role: string;
    message: string;
    epistemicBadge: EpistemicType;
    timestamp: string;
  }>;
}

export interface HistoricalIncidentCase {
  id: string;
  caseCode: string;
  title: string;
  productLine: string;
  failureMode: string;
  symptoms: string[];
  confirmedRootCause: string;
  effectiveCapa: string;
  similarityScore?: number;
  resolvedDate: string;
}

export type CapaEffectivenessRating =
  | 'Effective'
  | 'Partially Effective'
  | 'Not Effective'
  | 'Requires More Monitoring';

export interface EffectivenessPeriodStats {
  periodLabel: string;
  startDate: string;
  endDate: string;
  batchCount: number;
  batchNumbers: string[];
  totalInspected: number;
  defectCount: number;
  rejectionRate: number; // e.g. 8.2% vs 1.1%
  cpk: number;
  dominantDefects: Array<{ type: string; count: number; percentage: number }>;
}

export interface EffectivenessTrendPoint {
  batchNumber: string;
  date: string;
  phase: 'BEFORE_ACTION' | 'AFTER_ACTION';
  rejectionRate: number; // percentage (e.g. 8.2, 1.1)
  defectCount: number;
  inspectedUnits: number;
  cpk: number;
  actionMilestone?: string;
  notes?: string;
}

export interface RecurrenceDetectionEvent {
  id: string;
  detectedAt: string;
  batchNumber: string;
  defectType: string;
  defectCount: number;
  similarityScore: number;
  severity: IncidentSeverity;
  status: 'FLAGGED' | 'INCIDENT_CREATED' | 'DISMISSED';
  createdIncidentId?: string;
  description: string;
}

export interface CapaEffectivenessRecord {
  id: string;
  capaId: string;
  actionId?: string;
  actionTitle: string;
  completionDate: string;
  beforeStats: EffectivenessPeriodStats;
  afterStats: EffectivenessPeriodStats;
  trendData: EffectivenessTrendPoint[];
  observedChange: {
    rateDelta: number; // e.g. -7.1
    defectDelta: number; // e.g. -23
    percentImprovement: number; // e.g. 86.6%
    wording: string; // "Observed improvement after corrective action"
    disclaimer: string;
  };
  humanEvaluation?: {
    rating: CapaEffectivenessRating;
    engineerName: string;
    licenseBadgeId: string;
    timestamp: string;
    notes: string;
    digitalSignature?: string;
  };
  recurrenceMonitor: {
    active: boolean;
    targetDefects: string[];
    recurrenceDetected: boolean;
    events: RecurrenceDetectionEvent[];
    toleranceThresholdPercent: number;
  };
}

export interface TestCaseRecord {
  testId: 'TC-01' | 'TC-02' | 'TC-03' | 'TC-04' | 'TC-05' | 'TC-06' | 'TC-07' | 'TC-08';
  title: string;
  scenario: string;
  input: string;
  initialState: string;
  agentsInvolved: string[];
  expectedResult: string;
  actualResult: string;
  modelOutput: string;
  evidence: string;
  status: 'PASSED' | 'FAILED' | 'PENDING';
  executionType: 'AUTOMATED_LIVE' | 'DEMONSTRATION_SPEC';
  executedAt?: string;
  durationMs?: number;
  epistemicType: EpistemicType;
  details?: Record<string, any>;
}


