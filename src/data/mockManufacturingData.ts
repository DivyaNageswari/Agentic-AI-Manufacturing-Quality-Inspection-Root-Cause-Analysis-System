import type {
  ProductConfig,
  ProductionBatch,
  TelemetryPoint,
  VisualInspectionItem,
  QualityIncident,
  RcaAnalysis,
  CapaPlan,
  QualityReviewReport,
  HistoricalIncidentCase,
  EpistemicItem,
  HumanAuditEntry,
  CapaEffectivenessRecord,
} from '../types/index.ts';

export const INITIAL_PRODUCTS: ProductConfig[] = [
  {
    id: 'prod-1',
    productCode: 'PRD-AERO-701',
    name: 'Aerospace High-Pressure Turbine Spindle Housing',
    category: 'Aerospace Precision Machining',
    description: 'Inconel 718 alloy housing for Stage-1 jet turbine assembly, requiring sub-10 micron circularity and micro-crack detection.',
    aqlLevel: 'Level III (0.25% AQL - Safety Critical)',
    sampleSizePerSubgroup: 5,
    criticalToQualityPoints: [
      'Bore Internal Diameter: 85.000 mm ± 0.015 mm',
      'Flange Surface Roughness Ra: ≤ 0.40 µm',
      'True Position of 8-Bolt Hole Pattern: ⌀0.030 mm MMC',
      'Zero Surface Micro-Cracks > 50 µm length',
    ],
    tolerances: [
      { parameter: 'Bore Inner Diameter', unit: 'mm', nominal: 85.000, usl: 85.015, lsl: 84.985, warningMarginPct: 20 },
      { parameter: 'Flange Perpendicularity', unit: 'mm', nominal: 0.000, usl: 0.012, lsl: 0.000, warningMarginPct: 25 },
      { parameter: 'Surface Roughness Ra', unit: 'µm', nominal: 0.250, usl: 0.400, lsl: 0.100, warningMarginPct: 15 },
      { parameter: 'Wall Thickness', unit: 'mm', nominal: 12.500, usl: 12.580, lsl: 12.420, warningMarginPct: 20 },
    ],
  },
  {
    id: 'prod-2',
    productCode: 'PRD-AUTO-502',
    name: 'Common-Rail Diesel Injection Nozzle Body',
    category: 'Automotive Powertrain',
    description: 'High-alloy tool steel injector nozzle subjected to 2,500 bar cyclic pressure with ultra-tight seat seat sealing.',
    aqlLevel: 'Level II (0.65% AQL)',
    sampleSizePerSubgroup: 5,
    criticalToQualityPoints: [
      'Orifice Diameter: 0.145 mm ± 0.003 mm',
      'Needle Guide Bore: 4.000 mm ± 0.002 mm',
      'Seat Angle: 60.00° ± 0.05°',
    ],
    tolerances: [
      { parameter: 'Orifice Diameter', unit: 'mm', nominal: 0.145, usl: 0.148, lsl: 0.142, warningMarginPct: 15 },
      { parameter: 'Needle Guide Bore', unit: 'mm', nominal: 4.000, usl: 4.002, lsl: 3.998, warningMarginPct: 20 },
      { parameter: 'Seat Angle', unit: 'deg', nominal: 60.00, usl: 60.05, lsl: 59.95, warningMarginPct: 20 },
    ],
  },
  {
    id: 'prod-3',
    productCode: 'PRD-MED-108',
    name: 'Titanium Orthopedic Femoral Stem',
    category: 'Medical Implantable Devices',
    description: 'Medical grade Ti-6Al-4V ELI implant stem with porous plasma spray bone-ingrowth collar.',
    aqlLevel: '100% Inspection Protocol (Class III Medical)',
    sampleSizePerSubgroup: 5,
    criticalToQualityPoints: [
      'Neck Taper Diameter: 12.000 mm ± 0.008 mm',
      'Porous Coating Thickness: 350 µm ± 50 µm',
      'Passivation Acid Residue: < 0.01 mg/cm²',
    ],
    tolerances: [
      { parameter: 'Neck Taper Diameter', unit: 'mm', nominal: 12.000, usl: 12.008, lsl: 11.992, warningMarginPct: 20 },
      { parameter: 'Porous Coating Thickness', unit: 'µm', nominal: 350, usl: 400, lsl: 300, warningMarginPct: 15 },
    ],
  },
];

export const INITIAL_BATCHES: ProductionBatch[] = [
  {
    id: 'batch-001',
    batchNumber: 'LOT-2026-AERO-08',
    productCode: 'PRD-AERO-701',
    productName: 'Aerospace High-Pressure Turbine Spindle Housing',
    lineId: 'CNC Line A-1 (Mori Seiki 5-Axis)',
    operatorId: 'OP-442 (K. Vance, Sr. Machinist)',
    material: 'Inconel 718 Superalloy',
    shift: 'Shift 1 (Day 06:00 - 14:00)',
    startTime: '2026-10-02T06:00:00Z',
    endTime: '2026-10-02T14:30:00Z',
    totalUnits: 120,
    inspectedUnits: 65,
    passedUnits: 51,
    quarantinedUnits: 14,
    defectCount: 14,
    yieldPercentage: 78.46,
    status: 'QUARANTINED',
    humanSignOff: {
      approvedBy: 'Dr. Marcus Sterling (Lead Quality Engineer)',
      role: 'Staff Quality Metrologist & ASQ CQE',
      timestamp: '2026-10-02T14:30:00Z',
      status: 'QUARANTINED',
      notes: 'Automated containment invoked due to Bore ID exceeding USL and Spindle vibration spike at 11:45. Quarantined for physical CMM verification.',
    },
  },
  {
    id: 'batch-002',
    batchNumber: 'LOT-2026-AUTO-14',
    productCode: 'PRD-AUTO-502',
    productName: 'Common-Rail Diesel Injection Nozzle Body',
    lineId: 'Micro-EDM Cell B-3',
    operatorId: 'OP-109 (S. Gupta)',
    material: 'Tool Steel 16MnCr5 (Hardened 62 HRC)',
    shift: 'Shift 1 (Day 06:00 - 14:00)',
    startTime: '2026-10-02T07:15:00Z',
    totalUnits: 500,
    inspectedUnits: 250,
    passedUnits: 247,
    quarantinedUnits: 3,
    defectCount: 3,
    yieldPercentage: 98.8,
    status: 'ACTIVE',
  },
  {
    id: 'batch-003',
    batchNumber: 'LOT-2026-MED-04',
    productCode: 'PRD-MED-108',
    productName: 'Titanium Orthopedic Femoral Stem',
    lineId: 'Cellular Cleanroom Line D-2',
    operatorId: 'OP-882 (H. Lindqvist)',
    material: 'Titanium Ti-6Al-4V ELI (ASTM F136)',
    shift: 'Shift 3 (Night 22:00 - 06:00)',
    startTime: '2026-10-01T22:00:00Z',
    endTime: '2026-10-02T06:00:00Z',
    totalUnits: 80,
    inspectedUnits: 80,
    passedUnits: 80,
    quarantinedUnits: 0,
    defectCount: 0,
    yieldPercentage: 100.0,
    status: 'PASSED',
    humanSignOff: {
      approvedBy: 'Elena Gomez (Lead Medical QA)',
      role: 'Medical Device QA Manager',
      timestamp: '2026-10-02T06:45:00Z',
      status: 'APPROVED',
      notes: '100% CMM and optical inspection passed. Batch released for plasma sterilization.',
    },
  },
  {
    id: 'batch-004',
    batchNumber: 'LOT-2026-AERO-07',
    productCode: 'PRD-AERO-701',
    productName: 'Aerospace High-Pressure Turbine Spindle Housing',
    lineId: 'CNC Line A-1 (Mori Seiki 5-Axis)',
    operatorId: 'OP-442 (K. Vance)',
    material: 'Inconel 718 Superalloy',
    shift: 'Shift 2 (Swing 14:00 - 22:00)',
    startTime: '2026-10-01T06:00:00Z',
    endTime: '2026-10-01T18:00:00Z',
    totalUnits: 120,
    inspectedUnits: 120,
    passedUnits: 118,
    quarantinedUnits: 2,
    defectCount: 2,
    yieldPercentage: 98.33,
    status: 'COMPLETED',
  },
];

// Rich multivariate telemetry data with an induced anomaly interval
export const GENERATE_MOCK_TELEMETRY = (): TelemetryPoint[] => {
  const points: TelemetryPoint[] = [];
  const baseTime = new Date('2026-10-02T08:00:00Z').getTime();

  for (let i = 0; i < 40; i++) {
    const time = new Date(baseTime + i * 15 * 60 * 1000).toISOString();
    // Simulate process drift & chatter spike between index 22 and 32
    const isDrifting = i >= 20 && i <= 32;
    const isSpike = i >= 25 && i <= 29;

    const spindleSpeedRpm = 10000 + (Math.sin(i / 3) * 60) + (isSpike ? -380 : (Math.random() * 20 - 10));
    const coolantTempC = 22.0 + (i * 0.18) + (isDrifting ? 4.2 + (Math.random() * 1.5) : (Math.random() * 0.4));
    const hydraulicPressureBar = 140.0 + (Math.cos(i / 4) * 1.8) + (isSpike ? -14.5 : (Math.random() * 0.8));
    const vibrationMmS = 1.1 + (isDrifting ? 1.8 : 0.2) + (isSpike ? 2.4 : Math.random() * 0.15);
    const feedRateMmMin = 450 + (isSpike ? -40 : Math.random() * 8);
    const cycleTimeS = 112 + (isDrifting ? 8.5 : Math.random() * 2);

    // Multivariate Mahalanobis / PCA anomaly score
    let anomalyScore = 0.8 + (Math.random() * 0.4);
    const reasons: string[] = [];

    if (coolantTempC > 26.0) {
      anomalyScore += (coolantTempC - 26.0) * 1.2;
      reasons.push(`Coolant temp elevated (${coolantTempC.toFixed(1)}°C > 26.0°C threshold)`);
    }
    if (vibrationMmS > 2.5) {
      anomalyScore += (vibrationMmS - 2.5) * 2.0;
      reasons.push(`Spindle bearing vibration RMS exceeding ISO 10816 Zone C (${vibrationMmS.toFixed(2)} mm/s)`);
    }
    if (hydraulicPressureBar < 132.0) {
      anomalyScore += (132.0 - hydraulicPressureBar) * 0.6;
      reasons.push(`Hydraulic chuck clamping pressure dropped (${hydraulicPressureBar.toFixed(1)} bar)`);
    }

    const isAnomaly = anomalyScore >= 3.0;

    points.push({
      timestamp: time.substring(11, 16),
      temperatureC: Number(coolantTempC.toFixed(1)),
      pressureBar: Number(hydraulicPressureBar.toFixed(1)),
      spindleSpeedRpm: Math.round(spindleSpeedRpm),
      feedRateMmMin: Math.round(feedRateMmMin),
      machineVibrationMmS: Number(vibrationMmS.toFixed(2)),
      toolUsageMinutes: Math.round(20 + i * 2.5),
      cycleTimeS: Number(cycleTimeS.toFixed(1)),
      motorCurrentA: Number((18.5 + (isSpike ? 6.5 : Math.random() * 0.8)).toFixed(2)),

      coolantTempC: Number(coolantTempC.toFixed(1)),
      hydraulicPressureBar: Number(hydraulicPressureBar.toFixed(1)),
      vibrationMmS: Number(vibrationMmS.toFixed(2)),
      anomalyScore: Number(anomalyScore.toFixed(2)),
      isAnomaly,
      anomalyReasons: reasons.length > 0 ? reasons : undefined,
    });
  }

  return points;
};

// Initial raw subgroup measurement data for SPC (Bore ID of PRD-AERO-701)
// Nominal: 85.000 mm, USL: 85.015 mm, LSL: 84.985 mm
export const SAMPLE_SPC_SUBGROUPS_DATA: number[][] = [
  [85.002, 85.001, 84.998, 85.004, 85.000], // Subgroup 1
  [84.999, 85.003, 85.001, 85.002, 84.997], // Subgroup 2
  [85.001, 85.000, 85.005, 84.999, 85.002], // Subgroup 3
  [85.004, 85.002, 85.006, 85.003, 85.001], // Subgroup 4
  [85.003, 85.005, 85.004, 85.002, 85.006], // Subgroup 5
  [85.005, 85.004, 85.007, 85.006, 85.003], // Subgroup 6
  [85.006, 85.008, 85.005, 85.007, 85.009], // Subgroup 7 - Upward trend starts (Rule 3)
  [85.008, 85.009, 85.007, 85.010, 85.008], // Subgroup 8
  [85.009, 85.011, 85.010, 85.012, 85.009], // Subgroup 9
  [85.011, 85.012, 85.014, 85.010, 85.013], // Subgroup 10
  [85.013, 85.014, 85.015, 85.012, 85.016], // Subgroup 11
  [85.016, 85.018, 85.015, 85.019, 85.017], // Subgroup 12 - Rule 1 Breach (> UCL and > USL!)
  [85.017, 85.016, 85.019, 85.015, 85.018], // Subgroup 13 - Out of Control
];

export const INITIAL_VISUAL_INSPECTION_ITEMS: VisualInspectionItem[] = [
  {
    id: 'vis-01',
    batchId: 'LOT-2026-AERO-08',
    partSerialNumber: 'SN-A701-08-042',
    timestamp: '2026-10-02T11:42:15Z',
    imageUrl: 'spindle_housing_defect_1.svg',
    componentType: 'Precision Inner Bore Bearing Race',
    status: 'NON_CONFORMING',
    defects: [
      {
        x: 42,
        y: 35,
        width: 18,
        height: 14,
        defectClass: 'Thermal Crack',
        confidence: 0.942,
        areaMm2: 1.85,
      },
      {
        x: 68,
        y: 52,
        width: 12,
        height: 8,
        defectClass: 'Surface Porosity',
        confidence: 0.887,
        areaMm2: 0.64,
      },
    ],
    cnnModelVersion: 'YOLOv11-DefectDet-ResNet50FPN-v2.4',
    architecture: 'Transfer-Learning CNN Backbone (ResNet-50) + Feature Pyramid Network with Focal Loss',
    epistemicType: 'MODEL_PREDICTION',
    humanVerdict: 'CONFIRMED_DEFECT',
    humanInspector: 'Dr. Marcus Sterling (Lead QA)',
    inspectionNotes: 'Micro-crack confirmed under 50x optical metallurgical microscope. Evidence of severe frictional galling and thermal shock.',
  },
  {
    id: 'vis-02',
    batchId: 'LOT-2026-AERO-08',
    partSerialNumber: 'SN-A701-08-043',
    timestamp: '2026-10-02T11:48:30Z',
    imageUrl: 'spindle_housing_defect_2.svg',
    componentType: 'Flange Mating Face',
    status: 'NON_CONFORMING',
    defects: [
      {
        x: 28,
        y: 60,
        width: 24,
        height: 10,
        defectClass: 'Micro-Scratch',
        confidence: 0.915,
        areaMm2: 2.10,
      },
      {
        x: 75,
        y: 22,
        width: 14,
        height: 12,
        defectClass: 'Burr Deformation',
        confidence: 0.893,
        areaMm2: 1.15,
      },
    ],
    cnnModelVersion: 'YOLOv11-DefectDet-ResNet50FPN-v2.4',
    architecture: 'Transfer-Learning CNN Backbone (ResNet-50) + Feature Pyramid Network with Focal Loss',
    epistemicType: 'MODEL_PREDICTION',
    humanVerdict: 'CONFIRMED_DEFECT',
    humanInspector: 'Dr. Marcus Sterling (Lead QA)',
    inspectionNotes: 'Chipped insert tool tip left concentric gouges along face seal groove.',
  },
  {
    id: 'vis-03',
    batchId: 'LOT-2026-AERO-08',
    partSerialNumber: 'SN-A701-08-044',
    timestamp: '2026-10-02T11:55:10Z',
    imageUrl: 'spindle_housing_defect_3.svg',
    componentType: 'Outer Diameter Pilot Diameter',
    status: 'REQUIRES_REVIEW',
    defects: [
      {
        x: 50,
        y: 45,
        width: 10,
        height: 10,
        defectClass: 'Foreign Inclusion',
        confidence: 0.724,
        areaMm2: 0.45,
      },
    ],
    cnnModelVersion: 'YOLOv11-DefectDet-ResNet50FPN-v2.4',
    architecture: 'Transfer-Learning CNN Backbone (ResNet-50) + Feature Pyramid Network with Focal Loss',
    epistemicType: 'MODEL_PREDICTION',
    inspectionNotes: 'Edge shadow artifact possible. Re-scan required after solvent degreasing.',
  },
  {
    id: 'vis-04',
    batchId: 'LOT-2026-AUTO-14',
    partSerialNumber: 'SN-INJ-14-118',
    timestamp: '2026-10-02T09:12:00Z',
    imageUrl: 'injector_nozzle_clean.svg',
    componentType: 'Micro-Orifice Array',
    status: 'CONFORMING',
    defects: [],
    cnnModelVersion: 'YOLOv11-DefectDet-ResNet50FPN-v2.4',
    architecture: 'Transfer-Learning CNN Backbone (ResNet-50) + Feature Pyramid Network with Focal Loss',
    epistemicType: 'MODEL_PREDICTION',
    humanVerdict: 'PASSED_OVERRIDE',
    humanInspector: 'S. Gupta (Level 2 Inspector)',
    inspectionNotes: 'Zero circularity error, EDM recast layer within 2 micron spec.',
  },
];

export const INITIAL_INCIDENT: QualityIncident = {
  id: 'inc-001',
  incidentCode: 'INC-2026-092',
  timestamp: '2026-10-02T12:05:00Z',
  batchId: 'LOT-2026-AERO-08',
  productCode: 'PRD-AERO-701',
  lineId: 'CNC Line A-1 (Mori Seiki 5-Axis)',
  severity: 'CRITICAL',
  status: 'INVESTIGATING',
  title: 'Stage-1 Spindle Housing Bore Oversize & Surface Micro-Thermal Cracks',
  description: 'During continuous finishing pass of Lot LOT-2026-AERO-08, 14 consecutive parts exhibited inner bore dimensions exceeding Upper Specification Limit (85.015 mm measured vs 85.018 mm max). Concurrent vision inspection detected thermal micro-cracking. CNC spindle vibration spiked to 3.8 mm/s RMS.',
  observedFacts: [
    'Measured Bore ID reached 85.018 mm (USL = 85.015 mm, deviation +0.003 mm)',
    'CNC Spindle Line A-1 coolant reservoir temperature measured 28.4°C (Normal operating window: 20-22°C)',
    'Spindle vibration RMS rose from 1.1 mm/s to 3.8 mm/s at 11:40 UTC',
    'Ceramic cutting insert corner wear (VB) measured 0.42 mm (allowable limit: 0.15 mm)',
    '14 parts quarantined in physical red-lock cage A-14',
  ],
  immediateContainment: '1. Machine Line A-1 immediately halted with E-Stop lockout tagout (LOTO).\n2. Quarantined all 65 machined units from batch LOT-2026-AERO-08 in bonded quarantine area.\n3. Sent 5 sample parts to CMM Lab for 3D laser metrology verification.\n4. Flushed coolant chiller heat exchanger.',
  affectedUnitsCount: 14,
  scrapCostEstimateUsd: 46200,
  rootCauseId: 'rca-001',
  capaId: 'capa-001',
};

export const HISTORICAL_INCIDENTS_KNOWLEDGE_BASE: HistoricalIncidentCase[] = [
  {
    id: 'kb-case-01',
    caseCode: 'INC-2024-041',
    title: 'Aerospace Housing Bore Taper & Thermal Expansion Drift',
    productLine: 'PRD-AERO-701 Aerospace Housing',
    failureMode: 'Bore Taper & Thermal Expansion Drift',
    symptoms: ['Coolant temp > 27°C', 'Bore ID trending above USL', 'Spindle vibration drift', 'Chiller heat exchanger clogged with brass swarf'],
    confirmedRootCause: 'Coolant closed-loop chiller thermostatic valve stuck at 30% bypass, causing thermal growth of spindle arbor (0.012 mm expansion).',
    effectiveCapa: 'Installed duplex redundant temperature probe with automated PLC feed hold interlock at 24.5°C; revised weekly chiller filter backwash PM.',
    similarityScore: 0.93,
    resolvedDate: '2024-06-18',
  },
  {
    id: 'kb-case-02',
    caseCode: 'INC-2025-019',
    title: 'Surface Tearing & Thermal Micro-Cracks',
    productLine: 'PRD-AERO-701 Aerospace Housing',
    failureMode: 'Surface Tearing & Thermal Micro-Cracks',
    symptoms: ['CBN Insert fracture', 'Vibration harmonic at 1.8 kHz', 'Surface finish Ra > 0.6 µm', 'High cutting friction'],
    confirmedRootCause: 'Ceramic insert coating delamination due to supplier batch chemical vapor deposition (CVD) adhesion defect.',
    effectiveCapa: 'Enforced supplier Certificate of Analysis (CoA) lot batch inspection; set tool-life counter limit from 15 parts to 8 parts per edge.',
    similarityScore: 0.88,
    resolvedDate: '2025-02-11',
  },
  {
    id: 'kb-case-03',
    caseCode: 'INC-2023-088',
    title: 'EDM Recast Layer Micro-Pitting',
    productLine: 'PRD-AUTO-502 Diesel Nozzle',
    failureMode: 'EDM Recast Layer Micro-Pitting',
    symptoms: ['Dielectric fluid resistivity drop', 'Porous cratering under SEM', 'Seat leakage'],
    confirmedRootCause: 'Deionized water filter conductivity saturation allowing spark arc instability.',
    effectiveCapa: 'Automated deionization cartridge resistivity monitoring with alarm at 15 MOhm-cm.',
    similarityScore: 0.62,
    resolvedDate: '2023-11-04',
  },
  {
    id: 'kb-case-04',
    caseCode: 'INC-2025-103',
    title: 'Titanium Stem Hydraulic Chuck Clamp Pressure Loss',
    productLine: 'PRD-MED-108 Titanium Stem',
    failureMode: 'Subgroup Mean Shift (Nelson Rule 2)',
    symptoms: ['9 consecutive points below centerline', 'Hydraulic chuck clamp pressure pulsation', 'Part slippage'],
    confirmedRootCause: 'Hydraulic accumulator nitrogen bladder pressure loss causing variable jaw gripping force.',
    effectiveCapa: 'Replaced hydraulic bladder; implemented real-time clamp pressure transducer validation before each cycle start.',
    similarityScore: 0.57,
    resolvedDate: '2025-09-29',
  },
];

export const INITIAL_RCA_ANALYSIS: RcaAnalysis = {
  id: 'rca-001',
  incidentId: 'inc-001',
  batchId: 'LOT-2026-AERO-08',
  timestamp: '2026-10-02T13:15:00Z',
  generatedBy: 'AGENTIC_ORCHESTRATOR',
  fiveWhys: [
    {
      step: 1,
      question: 'Why did 14 Inconel spindle housings exceed the Upper Specification Limit (85.015 mm)?',
      answer: 'The CNC boring bar machined the inner diameter 0.003 mm to 0.004 mm oversized on the finishing pass.',
      epistemicType: 'OBSERVED_FACT',
      evidence: 'CMM inspection report CMM-2026-882 confirms measured bore diameter 85.018 mm.',
      verified: true,
    },
    {
      step: 2,
      question: 'Why did the boring bar machine the inner diameter oversized?',
      answer: 'Thermal expansion of the 5-axis machine spindle arbor caused a radial elongation of ~0.0035 mm combined with severe tool flank wear.',
      epistemicType: 'STATISTICAL_FINDING',
      evidence: 'Multivariate sensor correlation: Spindle thermal coefficient 11.2 µm/m°C * 0.4m arbor * 6.4°C ΔT = 2.87 µm radial displacement.',
      verified: true,
    },
    {
      step: 3,
      question: 'Why did the spindle arbor overheat by 6.4°C above steady state?',
      answer: 'The closed-loop spindle coolant chiller refrigeration condenser suffered 40% airflow blockage due to particulate swarf buildup on the intake grille.',
      epistemicType: 'OBSERVED_FACT',
      evidence: 'Maintenance physical inspection report WO-9912 logged swarf clogging on Chiller Unit #2 condenser fin pack.',
      verified: true,
    },
    {
      step: 4,
      question: 'Why did the machine continue cutting despite the chiller temperature exceeding 26.0°C?',
      answer: 'The Fanuc CNC controller safety interlock threshold for coolant over-temp was programmed at 35.0°C (standard roughing limit) rather than 24.0°C for precision aerospace finishing.',
      epistemicType: 'OBSERVED_FACT',
      evidence: 'PLC parameter ladder inspection: Address D402 = 35.0°C.',
      verified: true,
    },
    {
      step: 5,
      question: 'Why was the controller parameter set to a coarse 35.0°C threshold?',
      answer: 'Product-specific engineering parameters were not dynamically loaded from the Master Part Specification into the CNC active PLC profile during job setup.',
      epistemicType: 'RCA_HYPOTHESIS',
      evidence: 'SOP-AERO-MACH-12 revision 4 lacked an automated MES-to-PLC parameter verification gate prior to spindle activation.',
      verified: false,
    },
  ],
  fishbone: [
    {
      category: 'Machine',
      factors: [
        { id: 'f-m1', factor: 'Chiller unit condenser fin pack blocked with airborne aerosol swarf', epistemicType: 'OBSERVED_FACT', evidence: 'Physical inspection of Chiller Unit #2 showed severe clogging.', isKeyDriver: true },
        { id: 'f-m2', factor: 'Spindle arbor thermal expansion (calculated +3.5 µm runout)', epistemicType: 'STATISTICAL_FINDING', evidence: 'Correlation between coolant temp (r=0.91) and bore dimension.', isKeyDriver: true },
        { id: 'f-m3', factor: 'Spindle bearing vibration at 3.8 mm/s RMS (ISO Zone C)', epistemicType: 'OBSERVED_FACT', evidence: 'Accelerometer telemetry log Line A-1.', isKeyDriver: false },
      ],
    },
    {
      category: 'Method',
      factors: [
        { id: 'f-me1', factor: 'PLC coolant over-temp cutoff threshold set to coarse 35°C instead of 24°C', epistemicType: 'OBSERVED_FACT', evidence: 'Ladder logic parameter D402 read-out.', isKeyDriver: true },
        { id: 'f-me2', factor: 'Tool life counter set to 20 parts instead of recommended 10 for Inconel 718', epistemicType: 'OBSERVED_FACT', evidence: 'Tool offset management screen log.', isKeyDriver: true },
        { id: 'f-me3', factor: 'Lack of automated CMM feedback loop to apply dynamic cutter compensation', epistemicType: 'RCA_HYPOTHESIS', evidence: 'Manual entry currently used every 10 parts.', isKeyDriver: false },
      ],
    },
    {
      category: 'Material',
      factors: [
        { id: 'f-mat1', factor: 'Inconel 718 heat-treatment batch hardness at upper spec limit (44.5 HRC)', epistemicType: 'OBSERVED_FACT', evidence: 'Raw material mill test report Heat #IN-9082.', isKeyDriver: false },
        { id: 'f-mat2', factor: 'Coolant emulsion concentration diluted to 5.2% (recommended 8-10% for superalloys)', epistemicType: 'OBSERVED_FACT', evidence: 'Refractometer reading at 12:20 UTC.', isKeyDriver: true },
      ],
    },
    {
      category: 'Manpower',
      factors: [
        { id: 'f-mp1', factor: 'Operator did not notice gradual temperature warning on local HMI', epistemicType: 'OBSERVED_FACT', evidence: 'Operator statement during initial containment debrief.', isKeyDriver: false },
        { id: 'f-mp2', factor: 'Shift handover did not verify coolant refractometer brix reading', epistemicType: 'OBSERVED_FACT', evidence: 'Handover logbook empty for Shift 1 -> Shift 2.', isKeyDriver: false },
      ],
    },
    {
      category: 'Measurement',
      factors: [
        { id: 'f-ms1', factor: 'Shop floor air gauge calibrated at 20°C but measuring parts at 27.5°C without temp compensation', epistemicType: 'STATISTICAL_FINDING', evidence: 'Temperature difference caused 1.2 µm thermal expansion of part.', isKeyDriver: false },
        { id: 'f-ms2', factor: 'Vision CNN high confidence (94.2%) for thermal micro-cracking verified by metallography', epistemicType: 'MODEL_PREDICTION', evidence: 'YOLOv11 defect bounding box matched dye-penetrant test.', isKeyDriver: false },
      ],
    },
    {
      category: 'Milieu',
      factors: [
        { id: 'f-env1', factor: 'Shop ambient temperature rose to 29.1°C due to HVAC chiller staging lag', epistemicType: 'OBSERVED_FACT', evidence: 'Building management system log BMS-HVAC-3.', isKeyDriver: false },
      ],
    },
  ],
  hypotheses: [
    {
      id: 'hypo-1',
      hypothesis: 'Potential spindle arbor thermal expansion driven by chiller swarf clogging',
      hypothesisStatement:
        'Potential contributing factor: Airborne swarf clogging on Chiller Unit #2 condenser fin pack may have elevated coolant delivery temperature to 28.4°C, driving estimated +2.9 µm spindle thermal arbor elongation and contributing to oversized bore diameters.',
      confidence: 0.92,
      likelihoodScore: 0.92,
      category: 'Machine',
      epistemicType: 'RCA_HYPOTHESIS',
      status: 'PENDING_VERIFICATION',
      supportingEvidence: [
        'Coolant temperature climbed monotonically from 22.0°C to 28.4°C (+6.4°C thermal drift).',
        'Thermal expansion calculation indicates ΔL = α * L * ΔT = 11.2 µm/m°C * 0.40m * 6.4°C = +2.87 µm radial growth, correlating closely with observed +0.003 mm bore deviation.',
        'SPC chart exhibits Nelson Rule 3 (monotonic upward trend across 6 consecutive subgroups).',
        'Maintenance Work Order WO-9912 documented 45% surface clogging from swarf and oil mist on Chiller #2 condenser.',
        'Historical RAG match NCR-2024-041 (94% similarity) confirmed identical spindle expansion failure mode on Inconel 718.',
      ],
      contradictingEvidence: [
        'Ambient temperature in the machining bay was regulated at 21.5°C; external heat ingress did not occur.',
        'Initial 14 parts in the batch were machined within tolerance before the thermal threshold was breached.',
        'Correlation between coolant temperature and bore size does not prove sole causation without direct laser arbor measurement.',
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
        'RAG DEF-2025-019 & TOOL-2026-031',
      ],
      evidenceChain: [
        '[OBSERVED FACT] Flank wear measured at 0.42 mm (2.8x max limit).',
        '[OBSERVED FACT] Cutting vibration RMS spiked from 1.1 to 3.8 mm/s.',
        '[MODEL_PREDICTION] Visual Inspection Agent detected thermal cracking with 94.2% confidence.',
        '[OBSERVED FACT] Dye-penetrant test confirmed localized 60 µm thermal fatigue cracks.',
      ],
    },
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
        'Refractometer reading on Line A-1 sump recorded 5.2% Brix, violating SOP-AERO-MACH-12 requirement (8.5% to 10.0%).',
        'Superalloy Inconel 718 work-hardens rapidly under insufficient boundary lubrication, increasing shear zone friction.',
        'Shift handover logbook for Shift 1 -> Shift 2 showed missing coolant top-up verification.',
        'RAG SOP-AERO-12 (90% similarity) specifies automatic line stop if coolant concentration falls below 8.5%.',
      ],
      contradictingEvidence: [
        'Coolant supply pump pressure remained stable at 68.5 bar; fluid delivery volume to cutting nozzle was not interrupted.',
        'Concentration was 5.2% rather than pure water, providing partial cooling capacity.',
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
  ],
  synthesizedSummary:
    'Multi-agent analysis indicates a coupled thermo-mechanical failure: Airborne swarf clogged Chiller #2, elevating coolant to 28.4°C and driving +2.9 µm spindle thermal arbor expansion. Concurrently, diluted coolant (5.2%) accelerated ceramic tool flank wear to 0.42 mm, creating excessive cutting force and thermal micro-cracks in the bore race. Requires engineering physical verification before confirmed causation.',
  ragMatches: [
    {
      incidentId: 'NCR-2024-041',
      title: 'Aerospace Housing Bore Taper & Thermal Expansion Oversize',
      similarity: 0.94,
      historicalRootCause: 'Chiller thermostatic bypass stuck open, allowing 0.012 mm spindle thermal elongation.',
      effectiveAction: 'Installed duplex temperature probe with automated PLC feed hold interlock at 24.5°C.',
      recordType: 'NCR',
      evidenceSnippet: '14 units of Inconel 718 turbine housings rejected on CMM station for bore oversize (+0.0035 mm above USL). Telemetry revealed coolant temperature drifted from 22.0°C to 28.4°C.',
    },
    {
      incidentId: 'WO-9912',
      title: 'Chiller Unit #2 Condenser Fin Pack Swarf De-clogging & Coolant Flush',
      similarity: 0.92,
      historicalRootCause: 'Intake filter screen torn; swarf chips deposited on refrigeration condenser coil, reducing heat transfer by 45%.',
      effectiveAction: 'Cleaned fin pack with chemical degreasing spray; replaced intake screen with 50-micron dual mesh.',
      recordType: 'MAINTENANCE',
      evidenceSnippet: 'Condenser coil face had 45% surface clogging from oil mist and fine metal swarf. Coolant reservoir was operating at 28.4°C.',
    },
    {
      incidentId: 'TOOL-2026-031',
      title: 'Ceramic Boring Insert Flank Over-Wear (VB > 0.42 mm) Under Heavy Cut',
      similarity: 0.91,
      historicalRootCause: 'Tool usage exceeded maximum certified life (128 min vs 100 min limit).',
      effectiveAction: 'Locked tool life management macro behind supervisor password; automated tool retraction at 100 minutes.',
      recordType: 'TOOL_WEAR',
      evidenceSnippet: 'Tool usage reached 128 min. Resulted in high motor current load (26.5 A vs 18.5 A nominal) and chatter vibration (3.8 mm/s RMS).',
    },
    {
      incidentId: 'DEF-2025-019',
      title: 'Stage-1 Bearing Race Surface Tearing & Thermal Micro-Cracks',
      similarity: 0.89,
      historicalRootCause: 'Ceramic CBN insert flank wear exceeded 0.40 mm, causing intense frictional heat and thermal fatigue cracking.',
      effectiveAction: 'Mandated maximum tool in-cut duration of 8 parts per insert corner; added acoustic chatter detection.',
      recordType: 'DEFECT',
      evidenceSnippet: 'Optical telecentric inspection and fluorescent dye-penetrant examination identified network of 40-80 µm thermal fatigue cracks on bore race.',
    },
    {
      incidentId: 'SOP-AERO-12',
      title: 'Standard Operating Procedure: 5-Axis Precision Machining of Inconel 718',
      similarity: 0.90,
      historicalRootCause: 'Diluted coolant or coolant temp > 24°C accelerates catastrophic flank wear and causes bore thermal growth.',
      effectiveAction: 'Daily refractometer brix check; automatic machine feed hold if coolant temperature exceeds 24.0°C.',
      recordType: 'SOP_EXCERPT',
      evidenceSnippet: 'Coolant concentration must be maintained at 8.5% to 10.0% Brix. If coolant delivery temperature exceeds 24.0°C, operator must halt line immediately.',
    },
  ],
};

export const INITIAL_CAPA_PLAN: CapaPlan = {
  id: 'capa-001',
  incidentId: 'inc-001',
  rcaId: 'rca-001',
  batchId: 'LOT-2026-AERO-08',
  title: 'Thermo-Mechanical Stabilization & Tool Life Control for Stage-1 Spindle Finishing',
  isoStandardReference: 'ISO 9001:2015 §8.7 / §10.2',
  rootCauseSummary: 'Coupled failure of CNC chiller airflow blockage (spindle thermal expansion) and ceramic insert flank over-wear (frictional thermal micro-cracking) under diluted coolant.',
  actions: [
    {
      id: 'act-1',
      actionId: 'CAPA-ACT-001',
      type: 'CONTAINMENT',
      description: 'Hold affected batch for inspection. 100% quarantine of all 65 units from LOT-2026-AERO-08 in bonded quarantine storage with physical tamper seals; execute 100% Zeiss CMM 3D scan and fluorescent penetrant inspection (FPI).',
      action: 'Hold affected batch for inspection. 100% quarantine of all 65 units from LOT-2026-AERO-08 in bonded quarantine storage with physical tamper seals.',
      responsibleRole: 'Lead Quality Metrologist',
      responsibleName: 'Dr. Marcus Sterling',
      dueDate: '2026-10-03',
      targetDate: '2026-10-03',
      status: 'COMPLETED',
      evidence: 'Quarantine Tag #QT-2026-088 attached to physical storage rack A-14; Zeiss CMM scan log CMM-2026-882 recorded in QMS vault.',
      evidenceDocumentation: 'Quarantine Tag #QT-2026-088 attached to storage rack.',
      completionDate: '2026-10-02',
      effectivenessResult: '14 out-of-spec units quarantined; 51 conforming units segregated; zero nonconforming flight hardware released.',
      verificationMetric: '100% inspection report logged; zero nonconforming parts released to inventory.',
    },
    {
      id: 'act-2',
      actionId: 'CAPA-ACT-002',
      type: 'CORRECTIVE',
      description: 'Inspect cutting tool and verify tool offset. Ultrasonic-clean and backwash Chiller Unit #2 condenser fin pack. Re-charge coolant sump to calibrated 9.0% Brix emulsion concentration.',
      action: 'Inspect cutting tool and verify tool offset. Thoroughly ultrasonic-clean and backwash Chiller Unit #2 condenser fin pack.',
      responsibleRole: 'Senior Maintenance Technician & Tooling Specialist',
      responsibleName: 'Ray Delgado',
      dueDate: '2026-10-04',
      targetDate: '2026-10-04',
      status: 'IN_PROGRESS',
      evidence: 'Maintenance Work Order WO-9912 fin pack degreasing log; toolmaker microscope flank wear inspection report VB=0.11 mm.',
      evidenceDocumentation: 'Maintenance Work Order WO-9912 fin pack degreasing log.',
      completionDate: '2026-10-03',
      effectivenessResult: 'Coolant delivery temperature stabilized at 21.2°C; tool presetter offset recalibrated to 0.000 mm.',
      verificationMetric: 'Coolant temperature stabilizes at 21.0°C ± 0.5°C under continuous 100% spindle load.',
    },
    {
      id: 'act-3',
      actionId: 'CAPA-ACT-003',
      type: 'CORRECTIVE',
      description: 'Reprogram Fanuc 31i CNC controller safety interlock D402 from 35.0°C down to 23.5°C, triggering an immediate feed hold and audible alarm if exceeded.',
      action: 'Reprogram Fanuc 31i CNC controller safety interlock D402 from 35.0°C down to 23.5°C.',
      responsibleRole: 'CNC Applications Engineer',
      responsibleName: 'Chen Wei',
      dueDate: '2026-10-04',
      targetDate: '2026-10-04',
      status: 'COMPLETED',
      evidence: 'Ladder logic parameter D402 read-out inspection report verified by CNC lead.',
      evidenceDocumentation: 'Ladder logic parameter D402 read-out.',
      completionDate: '2026-10-03',
      effectivenessResult: 'Automated test trip simulated at 23.6°C successfully executed spindle feed-hold in 42 ms.',
      verificationMetric: 'Automated test trip at 23.6°C halts axis movement within 50 ms.',
    },
    {
      id: 'act-4',
      actionId: 'CAPA-ACT-004',
      type: 'PREVENTIVE',
      description: 'Introduce tool-life monitoring and alert threshold. Update CNC tool-life management macro to lock insert usage at maximum 10 parts per corner (down from 20) with mandatory optical tool setter pre-inspection.',
      action: 'Introduce tool-life monitoring and alert threshold. Update CNC tool-life management macro to lock insert usage at maximum 10 parts.',
      responsibleRole: 'Manufacturing Engineering Lead',
      responsibleName: 'K. Vance',
      dueDate: '2026-10-06',
      targetDate: '2026-10-06',
      status: 'PENDING',
      evidence: 'Fanuc 31i macro parameter table D400-D420 updated; SOP-AERO-MACH-12 revision 5 issued.',
      evidenceDocumentation: 'Macro parameter table D400-D420 updated.',
      completionDate: undefined,
      effectivenessResult: 'Target: Ceramic insert flank wear VB strictly < 0.12 mm at scheduled index change.',
      verificationMetric: 'Flank wear VB remains strictly < 0.12 mm at scheduled index change.',
    },
    {
      id: 'act-5',
      actionId: 'CAPA-ACT-005',
      type: 'PREVENTIVE',
      description: 'Install fine stainless swarf filtration hood on chiller air intake grilles across all Mori Seiki 5-axis machines (Lines A-1, A-2, A-3) with differential pressure sensor.',
      action: 'Install fine stainless swarf filtration hood on chiller air intake grilles across all Mori Seiki 5-axis machines with differential pressure sensor.',
      responsibleRole: 'Plant Facilities Engineer',
      responsibleName: 'S. Al-Mansoor',
      dueDate: '2026-10-15',
      targetDate: '2026-10-15',
      status: 'PENDING',
      evidence: 'Facility Work Order WO-FAC-401 design blueprint and procurement manifest.',
      evidenceDocumentation: 'Facility Work Order WO-FAC-401 design blueprint.',
      completionDate: undefined,
      effectivenessResult: 'Target: Chiller airflow maintained > 95% nominal without swarf penetration.',
      verificationMetric: 'Chiller airflow maintained > 95% nominal without swarf penetration.',
    },
  ],
  verificationCriteria: '1. Production of 3 consecutive test batches (360 parts total) with zero out-of-spec dimensions.\n2. Cpk index on Bore Inner Diameter ≥ 1.50 (USL=85.015, LSL=84.985).\n3. 100% optical and FPI inspection showing 0 micro-cracks or surface tearing.',
  targetCpkPostAction: 1.50,
  status: 'PENDING_APPROVAL',
};

export const INITIAL_HUMAN_AUDIT_TRAIL: HumanAuditEntry[] = [
  {
    id: 'aud-001',
    timestamp: '2026-10-02T11:55:00Z',
    agent: 'Visual Inspection Agent',
    finding: 'Thermal micro-cracking (94.2% conf) and surface porosity on SN-A701-08-042',
    humanDecision: 'CONFIRMED DEFECT',
    reviewerComment: 'Micro-crack confirmed under 50x toolmaker metallurgical microscope. Frictional galling and white layer verified.',
    engineerName: 'Dr. Marcus Sterling',
    licenseBadgeId: 'QA-88214',
    entityId: 'vis-01',
    entityType: 'DEFECT',
  },
  {
    id: 'aud-002',
    timestamp: '2026-10-02T12:30:00Z',
    agent: 'Dimensional Compliance Agent',
    finding: 'Bore ID reached 85.018 mm (+0.003 mm above USL of 85.015 mm)',
    humanDecision: 'QUARANTINE ORDERED',
    reviewerComment: 'Zeiss Prismo CMM scan confirmed oversize bore across 14 parts. Physical lock applied to Cage A-14.',
    engineerName: 'Dr. Marcus Sterling',
    licenseBadgeId: 'QA-88214',
    entityId: 'batch-001',
    entityType: 'BATCH',
  },
  {
    id: 'aud-003',
    timestamp: '2026-10-02T13:20:00Z',
    agent: 'Root Cause Analysis Agent',
    finding: 'Hypothesis: Potential tool wear with 128 min in-cut, 3.85 mm/s chatter, and flank wear VB > 0.40 mm',
    humanDecision: 'CONFIRMED ROOT CAUSE',
    reviewerComment: 'Laser interferometer verified spindle elongation; optical microscope verified insert flank wear VB=0.42 mm.',
    engineerName: 'Dr. Marcus Sterling',
    licenseBadgeId: 'QA-88214',
    entityId: 'hypo-2',
    entityType: 'ROOT_CAUSE',
  },
  {
    id: 'aud-004',
    timestamp: '2026-10-02T13:50:00Z',
    agent: 'CAPA Formulation Agent',
    finding: '8D Remediation Plan proposed: Containment (quarantine lot), Corrective (clean chiller & verify tool), Preventive (tool-life alert)',
    humanDecision: 'PENDING APPROVAL',
    reviewerComment: 'Awaiting completion of test blank run before final authorization sign-off.',
    engineerName: 'Dr. Marcus Sterling',
    licenseBadgeId: 'QA-88214',
    entityId: 'capa-001',
    entityType: 'CAPA',
  },
];

export const INITIAL_CRITIC_REVIEW: QualityReviewReport = {
  id: 'rev-001',
  incidentId: 'inc-001',
  rcaId: 'rca-001',
  capaId: 'capa-001',
  timestamp: '2026-10-02T13:45:00Z',
  auditScore: 92,
  confirmationBiasRisk: 'LOW',
  statisticalRigorScore: 95,
  verdict: 'APPROVED_FOR_RELEASE',
  criticAgentModel: 'QualityReviewerCritic-AuditEngine-v3.8',
  findings: [
    {
      id: 'cr-1',
      category: 'STATISTICAL_VALIDITY',
      severity: 'INFO',
      findingText: 'SPC calculation uses standard subgroup size n=5 with d2=2.326 and correctly flags Nelson Rule 1 and Rule 3 with p < 0.001 significance.',
      recommendation: 'Ensure post-CAPA capability validation collects at least 25 subgroups (k=25, n=5) to establish high-confidence Cpk.',
    },
    {
      id: 'cr-2',
      category: 'CONFIRMATION_BIAS',
      severity: 'ADVISORY',
      findingText: 'Initial hypothesis heavily weighted chiller clogging; however, tool flank wear (VB=0.42mm) and coolant dilution (5.2%) were also confirmed empirically.',
      recommendation: 'Keep all three mechanisms in the formal CAPA to prevent treating only the symptom.',
    },
    {
      id: 'cr-3',
      category: 'SAFETY_INTEGRITY',
      severity: 'INFO',
      findingText: 'Human-in-the-loop gate correctly enforced: AI did not attempt autonomous parameter overwriting on the CNC controller or release quarantined parts.',
      recommendation: 'Maintain mandatory physical signature requirement for Lead Quality Engineer before unlocking quarantine cages.',
    },
  ],
  deliberationLog: [
    {
      agentName: 'Data Intake Agent',
      role: 'Telemetry Ingestion & Schema Integrity',
      message: 'Ingested 65 inspected units and 40 telemetry timeframes. Validated unit conversions (mm, °C, bar). Flagged 14 out-of-spec parts.',
      epistemicBadge: 'OBSERVED_FACT',
      timestamp: '12:02 UTC',
    },
    {
      agentName: 'Visual Inspection Agent',
      role: 'CNN Defect Classification & Localization',
      message: 'Detected thermal micro-cracking (94.2% conf) and surface scratches on SN-A701-08-042 and 043. Segmented defect area 1.85 mm².',
      epistemicBadge: 'MODEL_PREDICTION',
      timestamp: '12:04 UTC',
    },
    {
      agentName: 'Dimensional Compliance Agent',
      role: 'Metrology vs Engineering Specification',
      message: 'Bore ID 85.018 mm breaches USL 85.015 mm (+0.003 mm delta). Flagged immediate nonconformance.',
      epistemicBadge: 'OBSERVED_FACT',
      timestamp: '12:05 UTC',
    },
    {
      agentName: 'SPC Agent',
      role: 'Deterministic Statistical Process Control',
      message: 'Subgroup #12 mean breached 3σ UCL (Nelson Rule 1). Subgroups 7-12 exhibited 6 consecutive ascending means (Nelson Rule 3). Cpk collapsed from 1.62 to 0.74.',
      epistemicBadge: 'STATISTICAL_FINDING',
      timestamp: '12:06 UTC',
    },
    {
      agentName: 'Process Monitoring Agent',
      role: 'Multivariate Anomaly Detection',
      message: 'Mahalanobis distance score peaked at 4.62 (threshold 3.0). Coolant temp (+6.4°C) and vibration (+2.7 mm/s) drove 84% of anomaly variance.',
      epistemicBadge: 'STATISTICAL_FINDING',
      timestamp: '12:07 UTC',
    },
    {
      agentName: 'RAG Retrieval Agent',
      role: 'Historical Knowledge Retrieval',
      message: 'Retrieved INC-2024-041 (93% cosine similarity) - spindle thermal growth due to chiller bypass valve failure.',
      epistemicBadge: 'OBSERVED_FACT',
      timestamp: '12:08 UTC',
    },
    {
      agentName: 'RCA Agent',
      role: 'Agentic Causal Reasoning & 5-Whys Synthesis',
      message: 'Synthesized 3 testable hypotheses linking chiller airflow restriction -> thermal expansion -> tool flank wear. Generated Ishikawa diagram.',
      epistemicBadge: 'RCA_HYPOTHESIS',
      timestamp: '12:12 UTC',
    },
    {
      agentName: 'CAPA Agent',
      role: 'Corrective & Preventive Action Formulation',
      message: 'Drafted ISO 9001:2015 §8.7 compliant 5-point action plan with target Cpk ≥ 1.50. Routing to Human Quality Engineer for approval.',
      epistemicBadge: 'RCA_HYPOTHESIS',
      timestamp: '12:15 UTC',
    },
    {
      agentName: 'Quality Reviewer / Critic Agent',
      role: 'Adversarial QA Auditing & Bias Detection',
      message: 'Audited evidence chain. Verified that mathematical formulas are deterministic. Checked for confirmation bias. Verdict: APPROVED_FOR_RELEASE with advice to verify post-CAPA Cpk over 25 subgroups.',
      epistemicBadge: 'STATISTICAL_FINDING',
      timestamp: '12:18 UTC',
    },
  ],
};

// Global epistemic ledger items for cross-system transparency
export const INITIAL_EPISTEMIC_LEDGER: EpistemicItem[] = [
  {
    id: 'ep-1',
    type: 'OBSERVED_FACT',
    title: 'Physical Bore Diameter 85.018 mm',
    detail: 'Measured on Zeiss Prismo CMM with ruby stylus probe at 20.0°C metrology room. Raw coordinate dataset recorded.',
    source: 'CMM Metrology Room #2',
    timestamp: '2026-10-02 11:58 UTC',
  },
  {
    id: 'ep-2',
    type: 'OBSERVED_FACT',
    title: 'Chiller Fin Pack Severe Swarf Contamination',
    detail: 'Physical inspection logged 40% airflow blockage on refrigeration heat exchanger coils.',
    source: 'Maintenance Work Order WO-9912',
    timestamp: '2026-10-02 12:30 UTC',
  },
  {
    id: 'ep-3',
    type: 'MODEL_PREDICTION',
    title: 'Thermal Micro-Crack Detection (94.2% Confidence)',
    detail: 'YOLOv11-ResNet50FPN vision model flagged 1.85 mm² thermal crack feature on bearing race face.',
    source: 'Visual Quality Inspection Agent',
    timestamp: '2026-10-02 11:42 UTC',
    confidence: 0.942,
  },
  {
    id: 'ep-4',
    type: 'STATISTICAL_FINDING',
    title: 'SPC Nelson Rule 1 & Rule 3 Violations',
    detail: 'Subgroup #12 mean exceeded Upper Control Limit (UCL = 85.014 mm). Subgroups 7-12 exhibited monotonic upward drift.',
    source: 'Statistical Process Control Agent',
    timestamp: '2026-10-02 12:00 UTC',
  },
  {
    id: 'ep-5',
    type: 'STATISTICAL_FINDING',
    title: 'Multivariate Anomaly Score 4.62 (Threshold 3.0)',
    detail: 'Mahalanobis distance across 6 sensor channels exceeded 99.7% confidence boundary.',
    source: 'Process Monitoring Agent',
    timestamp: '2026-10-02 11:45 UTC',
  },
  {
    id: 'ep-6',
    type: 'RCA_HYPOTHESIS',
    title: 'Spindle Thermal Growth Causing Finish Bore Oversize',
    detail: 'Thermo-mechanical model calculates +2.87 µm radial arbor elongation under 6.4°C coolant rise. Awaiting laser interferometer physical test.',
    source: 'Root Cause Analysis Agent',
    timestamp: '2026-10-02 13:15 UTC',
    confidence: 0.94,
  },
  {
    id: 'ep-7',
    type: 'CONFIRMED_ROOT_CAUSE',
    title: 'Chiller Clogging Coupled with Ceramic Tool Flank Wear',
    detail: 'Formally confirmed by Lead Quality Engineer following CMM temperature correlation and SEM tool inspection.',
    source: 'Lead Quality Engineer Sign-off',
    timestamp: '2026-10-02 15:00 UTC',
    verifiedBy: 'Dr. Marcus Sterling (Lead Quality Engineer, ASQ CQE #84912)',
    verifiedAt: '2026-10-02 15:00 UTC',
  },
];

export const INITIAL_EFFECTIVENESS_MONITORING: CapaEffectivenessRecord = {
  id: 'eff-capa-001',
  capaId: 'capa-001',
  actionId: 'CAPA-ACT-002',
  actionTitle: 'Chiller Unit #2 Condenser Degreasing, Coolant Brix Stabilization (9.0%) & Insert Offset Zeroing',
  completionDate: '2026-10-03',
  beforeStats: {
    periodLabel: 'Before Corrective Action (Pre-Intervention)',
    startDate: '2026-09-24',
    endDate: '2026-10-02',
    batchCount: 8,
    batchNumbers: ['LOT-2026-AERO-01', 'LOT-2026-AERO-02', 'LOT-2026-AERO-03', 'LOT-2026-AERO-04', 'LOT-2026-AERO-05', 'LOT-2026-AERO-06', 'LOT-2026-AERO-07', 'LOT-2026-AERO-08'],
    totalInspected: 317,
    defectCount: 26,
    rejectionRate: 8.2, // Exactly 8.2% as specified in user prompt
    cpk: 0.74,
    dominantDefects: [
      { type: 'Thermal Micro-Cracking', count: 14, percentage: 53.8 },
      { type: 'Bore Oversize (+0.003mm)', count: 8, percentage: 30.8 },
      { type: 'Surface Scratches / Chatter', count: 4, percentage: 15.4 },
    ],
  },
  afterStats: {
    periodLabel: 'After Corrective Action (Post-Intervention)',
    startDate: '2026-10-03',
    endDate: '2026-10-10',
    batchCount: 6,
    batchNumbers: ['LOT-2026-AERO-09', 'LOT-2026-AERO-10', 'LOT-2026-AERO-11', 'LOT-2026-AERO-12', 'LOT-2026-AERO-13', 'LOT-2026-AERO-14'],
    totalInspected: 275,
    defectCount: 3,
    rejectionRate: 1.1, // Exactly 1.1% as specified in user prompt
    cpk: 1.58,
    dominantDefects: [
      { type: 'Minor Handling Scratch', count: 2, percentage: 66.7 },
      { type: 'Flange Edge Burr', count: 1, percentage: 33.3 },
      { type: 'Thermal Micro-Cracking', count: 0, percentage: 0.0 },
    ],
  },
  trendData: [
    { batchNumber: 'LOT-AERO-01', date: '09/24', phase: 'BEFORE_ACTION', rejectionRate: 3.8, defectCount: 2, inspectedUnits: 52, cpk: 1.28 },
    { batchNumber: 'LOT-AERO-03', date: '09/26', phase: 'BEFORE_ACTION', rejectionRate: 5.2, defectCount: 3, inspectedUnits: 58, cpk: 1.12 },
    { batchNumber: 'LOT-AERO-05', date: '09/28', phase: 'BEFORE_ACTION', rejectionRate: 6.8, defectCount: 4, inspectedUnits: 59, cpk: 0.98 },
    { batchNumber: 'LOT-AERO-07', date: '09/30', phase: 'BEFORE_ACTION', rejectionRate: 9.6, defectCount: 6, inspectedUnits: 62, cpk: 0.82 },
    { batchNumber: 'LOT-AERO-08', date: '10/02', phase: 'BEFORE_ACTION', rejectionRate: 16.9, defectCount: 11, inspectedUnits: 65, cpk: 0.74, notes: 'Nonconformance Incident (Chiller Clogged + Tool Flank Wear)' },
    { batchNumber: 'LOT-AERO-09', date: '10/04', phase: 'AFTER_ACTION', rejectionRate: 2.1, defectCount: 1, inspectedUnits: 48, cpk: 1.46, actionMilestone: 'CAPA Implemented: Chiller De-greased & Tool Offset Zeroed' },
    { batchNumber: 'LOT-AERO-10', date: '10/05', phase: 'AFTER_ACTION', rejectionRate: 1.9, defectCount: 1, inspectedUnits: 52, cpk: 1.51 },
    { batchNumber: 'LOT-AERO-11', date: '10/07', phase: 'AFTER_ACTION', rejectionRate: 0.0, defectCount: 0, inspectedUnits: 55, cpk: 1.64 },
    { batchNumber: 'LOT-AERO-12', date: '10/08', phase: 'AFTER_ACTION', rejectionRate: 1.7, defectCount: 1, inspectedUnits: 58, cpk: 1.58 },
    { batchNumber: 'LOT-AERO-13', date: '10/10', phase: 'AFTER_ACTION', rejectionRate: 0.0, defectCount: 0, inspectedUnits: 62, cpk: 1.66 },
  ],
  observedChange: {
    rateDelta: -7.1, // 8.2% down to 1.1%
    defectDelta: -23,
    percentImprovement: 86.6,
    wording: 'Observed improvement after corrective action',
    disclaimer: 'Do not automatically claim causation: Statistical correlation observed between corrective action implementation and decreased defect rates. External variables (ambient shop temperature, tool supplier batch, feed rate variations) must be controlled before asserting full causation.',
  },
  humanEvaluation: {
    rating: 'Effective',
    engineerName: 'Dr. Marcus Sterling',
    licenseBadgeId: 'ASQ-CQE-84912',
    timestamp: '2026-10-10T16:20:00Z',
    notes: 'Bore dimensions stabilized within ±0.005 mm of nominal. Cpk improved from 0.74 to 1.58 exceeding post-action target of 1.50. Flank wear remains < 0.10 mm with zero thermal micro-cracking observed over 275 consecutive parts.',
    digitalSignature: 'SIG-SHA256-ASQ84912-EFF-VERIFIED',
  },
  recurrenceMonitor: {
    active: true,
    targetDefects: [
      'Thermal Micro-Cracking',
      'Bore Oversize (+0.003mm)',
      'Spindle Chatter Harmonics',
      'Ceramic Tool Delamination',
    ],
    recurrenceDetected: false,
    toleranceThresholdPercent: 2.0,
    events: [],
  },
};

