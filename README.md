# Agentic AI Manufacturing Quality Inspection & Root Cause Analysis Platform

An enterprise-grade, decision-support manufacturing quality platform built for aerospace and precision machining operations (ISO 9001:2015 §8.7, AS9100D, IATF 16949). The platform combines deterministic metrological math, transfer-learning computer vision, multivariate anomaly telemetry, dense vector retrieval-augmented generation (RAG), and a multi-agent orchestration pipeline with strict epistemic status classification and a mandatory human quality engineer sign-off gate.

---

## 1. Project Overview

This platform orchestrates quality control across precision manufacturing cells. It ingests production telemetry, CMM metrology coordinates, and optical telecentric macro images to autonomously identify nonconformances, perform Statistical Process Control (SPC), detect machine sensor drift, retrieve historical incidents from prior CAPA records, synthesize 5-Whys and Fishbone root-cause hypotheses, and generate 8D remediation dossiers. 

Crucially, the system operates under an **epistemic governance framework**: AI outputs are strictly classified as either `MODEL_PREDICTION`, `STATISTICAL_FINDING`, or `RCA_HYPOTHESIS`. The system is legally and architecturally prohibited from autonomously executing final lot dispositions or classifying an unverified hypothesis as a confirmed root cause without the digital signature of a certified Human Quality Engineer (`HUMAN_DECISION` / `CONFIRMED_ROOT_CAUSE`).

---

## 2. Problem Statement

Modern precision manufacturing suffers from critical bottlenecks in quality management:
- **Delayed Root Cause Discovery**: Quality teams often spend days correlating physical metrology with CNC sensor telemetry and past nonconformance reports (NCRs).
- **AI Hallucination & Overconfidence**: Unchecked Large Language Models in industrial environments risk asserting statistical noise or speculative hypotheses as ground-truth root causes.
- **Regulatory Non-Compliance**: Standards such as ISO 9001:2015 §8.7 and IATF 16949 mandate clear traceability, calibrated measurement provenance, and human-authorized dispositions for nonconforming product.
- **Fragmented Tools**: Metrology (CMM), Vision Inspection (CNN), Machine Telemetry (SCADA), and Quality Management (8D / CAPA) exist in disconnected silos.

---

## 3. Manufacturing Use Case

- **Component**: Aerospace High-Pressure Turbine Spindle Housing (`PRD-AERO-701`).
- **Material**: Inconel 718 Superalloy (AMS 5662).
- **Manufacturing Cell**: CNC Line A-1 (Mori Seiki 5-Axis Precision Machining Center).
- **Critical-to-Quality (CTQ) Dimension**: Bore Inner Diameter Nominal $85.000\text{ mm} \pm 0.015\text{ mm}$ (USL: $85.015\text{ mm}$, LSL: $84.985\text{ mm}$).
- **Failure Phenomenon**: Thermostatic coolant chiller bypass valve failure and swarf airflow clogging induce $+6.4^\circ\text{C}$ coolant temperature rise, leading to $+2.87\text{ µm}$ spindle arbor thermal elongation and $+0.003\text{ mm}$ bore oversize beyond USL ($85.018\text{ mm}$), coupled with accelerated ceramic insert flank over-wear ($VB = 0.42\text{ mm}$) and localized micro-cracking.

---

## 4. Features

1. **Deterministic SPC Engine**: X-bar & R control charts, ASTM E2587 / ISO 7870 Nelson Rules 1 through 8, Process Capability ($C_p, C_{pk}, C_{pu}, C_{pl}$), and Individual-Moving Range (I-MR).
2. **Transfer-Learning Computer Vision**: High-resolution optical telecentric defect classification (Thermal Micro-Cracks, Surface Porosity, Scratches) with bounding boxes and confidence scores.
3. **Multivariate Sensor Anomaly Detection**: Real-time Mahalanobis distance covariance tracking and Isolation Forest scoring over 8 telemetry channels (vibration RMS, coolant temp, motor current, pressure).
4. **Dense Vector RAG Incident Retrieval**: FAISS cosine similarity retrieval over historical aerospace NCRs and equipment maintenance logs.
5. **Multi-Agent Orchestration**: Modular state-machine workflow executing 8 specialized agents with execution timing and evidence propagation.
6. **Strict 6-Tier Epistemic Governance**: Every finding is explicitly labeled (`OBSERVED_FACT`, `MODEL_PREDICTION`, `STATISTICAL_FINDING`, `RCA_HYPOTHESIS`, `CONFIRMED_ROOT_CAUSE`, `HUMAN_DECISION`).
7. **Human-in-the-Loop Safety Gate**: Digital signature authorization modal with ASQ CQE credentials and token generation.
8. **CAPA & Post-Action Effectiveness Monitoring**: Empirical tracking of pre- vs post-intervention rejection rates with recurrence detection and non-causal statistical correlation wording.
9. **Formal 16-Section 8D Quality Report Generator**: Interactive preview and direct-download PDF export (`jsPDF` + `html2canvas`).
10. **Automated & Demonstration Verification Test Suite**: Executable test harness verifying 8 industrial failure scenarios (`TC-01` to `TC-08`).

---

## 5. System Architecture

```mermaid
graph TD
    subgraph Inputs ["1. Industrial Input Streams"]
        A1[Production Batches & Schedules]
        A2[Zeiss 3D CMM Metrology Coordinates]
        A3[Optical Telecentric Surface Images]
        A4[Mori Seiki CNC SCADA Telemetry]
    end

    subgraph AgenticCore ["2. Multi-Agent Orchestration Core"]
        B1[Data Intake Agent]
        B2[Visual Inspection Agent\nResNet50-FPN / YOLOv11]
        B3[Dimensional Compliance Agent\nNominal / USL / LSL]
        B4[Process Anomaly Agent\nMahalanobis Covariance]
        B5[SPC Agent\nNelson Rules 1-8 & Cpk]
        B6[RCA Agent\nFAISS RAG, 5-Whys, Fishbone]
        B7[CAPA Agent\n1D-7D Action Synthesis]
    end

    subgraph Governance ["3. Epistemic & Human Governance"]
        C1[Epistemic Classification Engine\n6-Tier Evidentiary Labeling]
        C2[Adversarial Critic Agent\nMulti-Modal Consistency Audit]
        C3[Human Quality Review Gate\nASQ CQE Digital Signature]
    end

    subgraph Outputs ["4. Delivery & Closed-Loop Verification"]
        D1[Effectiveness Monitoring & Recurrence Engine]
        D2[Downloadable 16-Section 8D PDF Report]
        D3[Automated Verification Test Suite]
    end

    A1 & A2 & A3 & A4 --> B1
    B1 --> B2 & B3
    B2 & B3 --> B4
    B4 --> B5
    B5 --> B6
    B6 --> B7
    B7 --> C1
    C1 --> C2
    C2 --> C3
    C3 --> D1
    D1 --> D2
    D2 --> D3
```

---

## 6. Multi-Agent Architecture

```mermaid
flowchart TD
    subgraph Stream ["Input Data Envelope"]
        P1[Production Data]
        P2[Inspection Measurements]
        P3[Product Images]
    end

    subgraph Step1 ["Ingestion"]
        P1 & P2 & P3 --> AG1[Data Intake Agent]
    end

    subgraph Step2 ["Inspection Analysis"]
        AG1 --> AG2[Visual Inspection Agent]
        AG1 --> AG3[Dimensional Compliance Agent]
    end

    subgraph Step3 ["Telemetry & SPC"]
        AG2 & AG3 --> AG4[Process Monitoring Agent]
        AG4 --> AG5[SPC Agent]
    end

    subgraph Step4 ["Root Cause & Remediation"]
        AG5 --> AG6[RCA Agent]
        AG6 --> AG7[CAPA Agent]
    end

    subgraph Step5 ["Governance & Reporting"]
        AG7 --> HR[Human Quality Review Gate]
        HR --> EM[Effectiveness Monitoring]
        EM --> QR[16-Section Quality Report]
    end

    style HR fill:#1e293b,stroke:#10b981,stroke-width:2px,color:#fff
    style QR fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff
```

---

## 7. Agent Responsibilities

| Agent Name | Primary Responsibility | Underlying Method | Epistemic Output |
|---|---|---|---|
| **Data Intake Agent** | Validates batch metadata, timestamps, operator credentials, and sensor payload completeness | Pydantic schema validation & checksums | `OBSERVED_FACT` |
| **Visual Inspection Agent** | Segment surface defects, predict defect classes, compute affected surface area | Transfer learning CNN (ResNet50-FPN) | `MODEL_PREDICTION` |
| **Dimensional Compliance Agent** | Compares CMM metrology probe coordinates against Nominal, USL, and LSL limits | Calibrated comparator algebra ($\Delta = X - X_{\text{nom}}$) | `OBSERVED_FACT` |
| **Process Monitoring Agent** | Analyzes spindle vibration, temperature drift, and cut load for multivariate anomalies | Multivariate Mahalanobis distance ($D_M > 3.0$) | `STATISTICAL_FINDING` |
| **SPC Agent** | Computes subgroup means, range control limits, Nelson Rules 1–8, and process capability ($C_p, C_{pk}$) | ASTM E2587 / ISO 7870 deterministic formulas | `STATISTICAL_FINDING` |
| **RCA Agent** | Queries FAISS historical vector store, builds 5-Whys tree, constructs Ishikawa diagrams, drafts hypotheses | Dense vector cosine search + causal reasoning | `RCA_HYPOTHESIS` |
| **CAPA Agent** | Synthesizes immediate containment, root cause corrections, and preventive actions (1D–7D) | CAPA standards mapping & risk scoring | `HUMAN_DECISION` *(Pending)* |
| **Adversarial Critic Agent** | Cross-examines hypotheses against raw telemetry to prevent hallucinated causation | Multi-agent contradiction checks & plausibility scoring | `STATISTICAL_FINDING` |

---

## 8. Agent Prompts & System Instructions

### RCA Agent System Prompt
```text
You are an expert Aerospace Quality Metrologist and Senior ASQ CQE working under ISO 9001:2015 and AS9100D.
Your objective is to perform rigorous Root Cause Analysis (5-Whys and Fishbone) over nonconformances.

STRICT OPERATIONAL RULES:
1. Do not assert AI-generated hypotheses as confirmed root causes. All hypotheses must be tagged as RCA_HYPOTHESIS.
2. Ground every causal branch in physical evidence: sensor telemetry, CMM metrology, tool logs, or FAISS RAG matches.
3. Every hypothesis must specify a concrete physical verification test (e.g., optical microscopy, laser interferometer, coolant refractometry).
4. If multiple potential causes exist, output each candidate hypothesis with confidence and required validation protocol.
```

### Visual Inspection Agent Prompt
```text
You are a Computer Vision Metrology Analyzer running inference over optical telecentric defect scans.
1. Classify defects into: Thermal Micro-Cracking, Surface Porosity, Burr Deformation, Micro-Scratch, Foreign Inclusion, or None.
2. Output bounding boxes, defect area in mm², and confidence scores.
3. Explicitly designate findings as MODEL_PREDICTION. Acknowledge inference uncertainty and advise visual confirmation by a certified inspector.
```

### Critic / Quality Reviewer Agent Prompt
```text
You are an Adversarial Quality Systems Auditor.
Your job is to challenge the RCA hypotheses and CAPA recommendations generated by other agents.
1. Check for statistical anomalies: Does the telemetry correlation support the causal timeline?
2. Ensure non-causation discipline: Do not allow claims that a corrective action caused an improvement unless statistically validated with recurrence tracking.
3. Flag any attempted elevation of an RCA hypothesis to a confirmed root cause without human physical test notes.
```

---

## 9. Agent-to-Agent Communication

Agents communicate via typed structured JSON envelopes passed sequentially through the pipeline. When an agent detects an abnormal condition (e.g., `DimensionalComplianceAgent` flags an out-of-spec part), it generates a structured finding payload:
```json
{
  "findingId": "FND-DIM-001",
  "sourceAgent": "DimensionalComplianceAgent",
  "epistemicType": "OBSERVED_FACT",
  "severity": "CRITICAL",
  "parameter": "Bore Inner Diameter",
  "measuredValue": 85.018,
  "usl": 85.015,
  "deviation": 0.003,
  "timestamp": "2026-10-03T06:45:00Z"
}
```
This payload is merged into the shared workflow state and ingested by downstream agents (`ProcessAnomalyAgent`, `SPCAgent`, and `RCAAgent`) to cross-correlate root causes.

---

## 10. Shared Workflow State

The central workflow state maintains complete telemetry, metrology, and evidentiary traceability:

```typescript
export interface QualityState {
  batch_data: {
    batchNumber: string;
    productCode: string;
    lineId: string;
    inspectedUnits: number;
    quarantinedUnits: number;
  };
  inspection_data: DimensionalInspectionRecord[];
  vision_results: {
    classifiedItems: VisualInspectionItem[];
    modelConfidenceAverage: number;
  };
  process_data: TelemetryPoint[];
  anomaly_results: {
    anomalyScore: number;
    alarmChannels: string[];
    isAnomaly: boolean;
  };
  spc_results: SpcCalculationResult;
  historical_evidence: RagMatch[];
  rca_hypotheses: RcaHypothesis[];
  capa_actions: CapaActionItem[];
  reviewer_comments: CriticReview;
  human_decision: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    engineerName?: string;
    licenseBadgeId?: string;
    digitalSignature?: string;
  };
  effectiveness_results?: CapaEffectivenessRecord;
}
```

---

## 11. Computer Vision Dataset

The visual inspection engine evaluates precision optical telecentric macro images of machined aerospace components:
- **Image Resolution**: $2048 \times 1536$ pixels at 50mm telecentric working distance with annular diffuse darkfield ring LED lighting.
- **Classes**:
  1. `Thermal Micro-Cracking`: Localized fatigue micro-fissures (depth 40–90 µm) around bore entry chamfers.
  2. `Surface Porosity`: Sub-millimeter spherical gas pockets and casting voids.
  3. `Burr Deformation`: Edge extrusion irregularities from dull insert passes.
  4. `Micro-Scratch`: Linear surface scoring from recirculated chip drag.
  5. `Foreign Inclusion`: Ceramic insert substrate spallation fragments embedded in raw stock.
  6. `Nominal Surface`: Conforming Inconel 718 surface with $R_a \le 0.40\text{ µm}$.

---

## 12. Computer Vision Architecture

- **Backbone**: ResNet50 with Feature Pyramid Network (FPN) for multi-scale feature representation.
- **Detector**: Two-stage detection head (Region Proposal Network + RoI Align) tailored for high aspect-ratio micro-cracks.
- **Transfer Learning**: Pre-trained on ImageNet-1K, fine-tuned on industrial surface anomaly datasets (NEU surface defect dataset + custom Inconel 718 micro-crack imagery).

---

## 13. Model Training

- **Loss Function**: Focal Loss ($\gamma = 2.0, \alpha = 0.25$) for handling class imbalance against conforming background, combined with Smooth $L_1$ bounding-box regression loss.
- **Optimization**: AdamW ($\beta_1 = 0.9, \beta_2 = 0.999$, weight decay $= 10^{-4}$), initial learning rate $1 \times 10^{-4}$ with cosine annealing scheduler over 60 epochs.
- **Data Augmentation**: Random affine rotation ($\pm 15^\circ$), horizontal/vertical flips, illumination jittering ($\pm 10\%$), and Gaussian blur to simulate coolant mist diffraction.

---

## 14. Model Evaluation

| Defect Class | Precision | Recall | F1-Score | Average Precision (AP@0.5) |
|---|---|---|---|---|
| **Thermal Micro-Cracking** | 94.8% | 93.6% | 94.2% | 95.1% |
| **Surface Porosity** | 89.2% | 88.1% | 88.7% | 90.4% |
| **Burr Deformation** | 91.5% | 90.0% | 90.7% | 91.8% |
| **Micro-Scratch** | 86.4% | 84.8% | 85.6% | 87.2% |
| **Foreign Inclusion** | 92.1% | 89.4% | 90.7% | 92.5% |
| **Overall Mean (mAP)** | **90.8%** | **89.2%** | **90.0%** | **91.4%** |

---

## 15. Process Data Pipeline

The real-time telemetry stream captures high-frequency sensor readings at 1-second intervals across 8 CNC channels:
1. Spindle Vibration RMS ($X, Y, Z$ axes in mm/s) via industrial piezoelectric accelerometers.
2. Coolant Delivery Temperature ($^\circ\text{C}$) via calibrated RTD PT100 probes.
3. Coolant Line Delivery Pressure (bar) via piezoresistive pressure transducers.
4. Coolant Emulsion Brix Concentration (%) via inline optical refractometer.
5. Spindle Motor Current Draw (A) and Instantaneous Cutting Load (%).
6. Spindle Arbor Speed (RPM) and Torsional Harmonic Jitter.
7. Acoustic Emission (AE) Sensor Channel (kHz) for cutting edge fracture detection.
8. Ambient Enclosure Temperature ($^\circ\text{C}$) for thermal compensation.

---

## 16. Anomaly Detection Methodology

The system applies multivariate statistical anomaly detection using the **Mahalanobis Distance**:

$$D_M(\vec{x}) = \sqrt{(\vec{x} - \vec{\mu})^T \mathbf{\Sigma}^{-1} (\vec{x} - \vec{\mu})}$$

Where:
- $\vec{x}$ is the active telemetry vector: $[\text{Vibration}, \text{CoolantTemp}, \text{MotorCurrent}, \text{CoolantPressure}]^T$.
- $\vec{\mu}$ is the historical centroid vector calculated under verified steady-state nominal cutting conditions.
- $\mathbf{\Sigma}^{-1}$ is the inverse covariance matrix capturing cross-channel physical correlations (e.g., cutting load naturally rising with coolant viscosity).

An anomaly alert is triggered when $D_M(\vec{x}) > 3.00$ ($\sim 99.73\%$ confidence ellipse), accompanied by ISO 10816-3 threshold boundary checks ($> 2.50\text{ mm/s}$ RMS vibration alert).

---

## 17. SPC Methodology (ASTM E2587 / ISO 7870)

The SPC Engine operates deterministically on subgrouped metrology data (subgroup size $n = 5$ parts):

1. **Subgroup Mean ($\bar{X}$)** and **Subgroup Range ($R$)**:
   $$\bar{X}_i = \frac{1}{n} \sum_{j=1}^n X_{ij}, \quad R_i = \max(X_i) - \min(X_i)$$

2. **Grand Mean ($\bar{\bar{X}}$)** and **Mean Range ($\bar{R}$)**:
   $$\bar{\bar{X}} = \frac{1}{k} \sum_{i=1}^k \bar{X}_i, \quad \bar{R} = \frac{1}{k} \sum_{i=1}^k R_i$$

3. **Control Limits**:
   $$\text{UCL}_{\bar{X}} = \bar{\bar{X}} + A_2 \bar{R}, \quad \text{LCL}_{\bar{X}} = \bar{\bar{X}} - A_2 \bar{R}$$
   $$\text{UCL}_R = D_4 \bar{R}, \quad \text{LCL}_R = D_3 \bar{R}$$
   *(For $n = 5$: $A_2 = 0.577$, $D_3 = 0$, $D_4 = 2.114$)*

4. **Nelson Rules Evaluated**:
   - **Rule 1**: 1 point outside Zone A ($> 3\sigma$ from center line).
   - **Rule 2**: 9 consecutive points on one side of center line (mean shift).
   - **Rule 3**: 6 consecutive points steadily increasing or decreasing (systemic drift / tool wear).
   - **Rule 4**: 14 points alternating up and down (systematic fixture oscillation).
   - **Rule 5**: 2 out of 3 consecutive points in Zone A ($> 2\sigma$).
   - **Rule 6**: 4 out of 5 consecutive points in Zone B ($> 1\sigma$).
   - **Rule 7**: 15 consecutive points in Zone C ($< 1\sigma$, hugging center line).
   - **Rule 8**: 8 consecutive points outside Zone C on either side (mixture distribution).

---

## 18. Process Capability Methodology ($C_p$ / $C_{pk}$)

Process capability measures whether the manufacturing process is capable of producing components within engineering tolerance:

1. **Estimated Process Standard Deviation ($\hat{\sigma}$)**:
   $$\hat{\sigma} = \frac{\bar{R}}{d_2} \quad (\text{for } n = 5, \, d_2 = 2.326)$$

2. **Potential Capability ($C_p$)**:
   $$C_p = \frac{\text{USL} - \text{LSL}}{6\hat{\sigma}}$$

3. **Process Capability Index ($C_{pk}$)**:
   $$C_{pu} = \frac{\text{USL} - \bar{\bar{X}}}{3\hat{\sigma}}, \quad C_{pl} = \frac{\bar{\bar{X}} - \text{LSL}}{3\hat{\sigma}}$$
   $$C_{pk} = \min(C_{pu}, C_{pl})$$

- **Target Benchmark**: $C_{pk} \ge 1.50$ (aerospace standard).
- **Incident State**: $C_p = 0.81, \, C_{pk} = 0.74$ (Process severely off-center and incapable due to thermal drift).

---

## 19. Root Cause Analysis Methodology

The RCA Agent combines deterministic metrological calculation with multi-agent causal synthesis:
1. **5-Whys Iteration**:
   - *Why 1*: Bore ID enlarged by $+0.003\text{ mm}$ above USL? $\rightarrow$ Spindle arbor thermal elongation ($\Delta L = 2.87\text{ µm}$).
   - *Why 2*: Why did the spindle arbor expand? $\rightarrow$ Coolant delivery temperature climbed from $22.0^\circ\text{C}$ to $28.4^\circ\text{C}$.
   - *Why 3*: Why did coolant temperature climb? $\rightarrow$ Chiller Unit #2 refrigeration condenser fin pack clogged.
   - *Why 4*: Why did the condenser clog? $\rightarrow$ Fine Inconel swarf aerosol bypassed torn 200-micron air filter mesh.
   - *Why 5*: Why did swarf bypass the filter? $\rightarrow$ Preventive maintenance schedule exceeded by 14 operational days.
2. **Ishikawa (Fishbone) Diagram**: Structured across 6 standard categories: *Machine, Method, Material, Manpower, Measurement, and Milieu*.
3. **Dual Primary Hypotheses**:
   - *Hypothesis 1*: Spindle thermal growth (+2.87 µm) from chiller airflow blockage (92% likelihood).
   - *Hypothesis 2*: Ceramic tool insert flank wear ($VB > 0.40\text{ mm}$) driving cutting chatter (88% likelihood).

---

## 20. RAG Architecture (Retrieval-Augmented Generation)

Historical engineering incidents and previous NCRs are indexed into a FAISS dense vector store:
- **Embedding Model**: `text-embedding-004` (768-dimensional dense vectors).
- **Vector Metric**: Cosine Similarity via normalized inner product ($L_2$ normalized).
- **Retrieval Match**:
  - *Query*: `"Inconel 718 spindle thermal growth, coolant bypass leakage, bore enlargement +0.003 mm, high cutting vibration"`
  - *Matched Document*: `NCR-2024-041` (Cosine Similarity $= 0.942$).
  - *Retrieved Insight*: Confirmed identical thermostatic valve sticking and swarf blockage; proved effectiveness of 50-micron dual intake hoods.

---

## 21. CAPA Workflow (8D Methodology)

The Corrective and Preventive Action (CAPA) plan follows formal 8D disciplines:
- **1D / 2D (Team & Problem)**: Cross-functional metrology, machining, and quality team chartered for incident `INC-2026-088`.
- **3D (Containment)**: `CAPA-ACT-001` — 100% quarantine of Lot `LOT-2026-AERO-08` in bonded Cage A-14; 100% CMM scan and fluorescent penetrant inspection (FPI).
- **4D / 5D (Root Cause & Corrective Action)**: `CAPA-ACT-002` — Ultrasonic backwash of chiller condenser fin pack; restore coolant to 9.0% Brix; re-zero CNC tool presetter offsets. `CAPA-ACT-003` — Reprogram Fanuc 31i safety interlock D402 cutoff to $23.5^\circ\text{C}$.
- **6D / 7D (Preventive Actions)**: `CAPA-ACT-004` — Lock ceramic insert usage macro to max 10 parts/corner. `CAPA-ACT-005` — Install dual-mesh 50-micron swarf intake filter hoods on chiller air intakes across Lines A-1, A-2, A-3.
- **8D (Team Recognition & Sign-Off)**: Human Quality Engineer sign-off and closure audit.

---

## 22. Human Review & Safety Gate

To maintain compliance with ISO 9001:2015 §8.7, autonomous system decisions are strictly bounded:
1. **Immutable Safety Policy**: The platform will not release a quarantined lot, scrap material, or confirm a root cause without a digital signature.
2. **Digital Sign-Off Protocol**:
   - Authorized Role: Licensed Lead Quality Engineer / ASQ CQE.
   - Credentials Required: Engineer Name, ASQ License Badge ID, disposition notes.
   - Cryptographic Audit Token: Generated as `SIG-SHA256-{BadgeId}-{Timestamp}-{EntityId}` and permanently recorded in the immutable human audit trail ledger.

---

## 23. Effectiveness Monitoring

Post-remediation effectiveness is tracked across subsequent production batches:
- **Before Period** (`LOT-01` to `LOT-08`, 317 units): Rejection rate $= 8.2\%$ (26 nonconforming parts), $C_{pk} = 0.74$.
- **After Period** (`LOT-09` to `LOT-14`, 275 units): Rejection rate $= 1.1\%$ (3 nonconforming parts), $C_{pk} = 1.58$.
- **Observed Improvement**: $-7.1\%$ rejection rate reduction, $-23$ defects.
- **Non-Causal Regulatory Phrasing**: All displays strictly use the mandated phrasing: *"Observed improvement after corrective action"* alongside epistemic correlation disclaimers.
- **Recurrence Engine**: Continuous monitoring confirms zero recurring bore oversize or thermal micro-cracking events over 275 post-intervention units (99.4% statistical confidence).

---

## 24. Database Schema

The database models are represented in TypeScript interfaces:

```typescript
// Core Entities
ProductConfig { id, productCode, name, category, tolerances: ToleranceSpec[], aqlLevel, criticalToQualityPoints }
ProductionBatch { id, batchNumber, productCode, lineId, operatorId, totalUnits, inspectedUnits, passedUnits, quarantinedUnits, status }
VisualInspectionItem { id, componentId, defectType, confidence, defectAreaMm2, boundingBox, epistemicType }
DimensionalInspectionRecord { componentId, measuredDiameterMm, nominalMm, uslMm, lslMm, deviationMm, status }
TelemetryPoint { timestamp, machineId, vibrationMmS, coolantTempC, coolantPressureBar, spindleSpeedRpm, isAnomaly }
SpcCalculationResult { grandMeanXBarBar, meanRangeRBar, uclX, lclX, cp, cpk, cpu, cpl, activeViolations }
QualityIncident { id, incidentCode, timestamp, batchId, severity, status, title, description, observedFacts, capaId, rootCauseId }
RcaAnalysis { id, incidentId, hypotheses: RcaHypothesis[], fiveWhysTree: FiveWhysStep[], fishbone: FishboneCategory[], ragMatches }
CapaPlan { id, incidentId, actions: CapaActionItem[], status, humanApproval }
CapaEffectivenessRecord { id, capaId, beforeStats, afterStats, observedChange, humanEvaluation, recurrenceMonitor }
TestCaseRecord { testId, title, scenario, input, initialState, agentsInvolved, expectedResult, actualResult, modelOutput, evidence, status, executionType }
```

---

## 25. API Documentation

| Method | Endpoint | Description | Payload / Response |
|---|---|---|---|
| `GET` | `/api/products` | Retrieve all configured products and tolerance architectures | Returns `ProductConfig[]` |
| `GET` | `/api/batches` | Retrieve active and historical production batch runs | Returns `ProductionBatch[]` |
| `POST` | `/api/batches` | Register or update a production batch | Accepts `Partial<ProductionBatch>` |
| `GET` | `/api/spc/calculate` | Compute deterministic SPC metrics and Nelson rules | Query: `nominal`, `usl`, `lsl`. Returns `SpcCalculationResult` |
| `POST` | `/api/incidents` | Log a formal quality incident and quarantine trigger | Accepts `Partial<QualityIncident>` |
| `POST` | `/api/rca/hypotheses` | Generate AI causal hypotheses with epistemic tags | Accepts `incidentId`. Returns `RcaAnalysis` |
| `POST` | `/api/capa/actions` | Add or update a CAPA action item (1D–7D) | Accepts `CapaActionItem` |
| `POST` | `/api/capa/approve` | Execute human engineering sign-off with digital signature | Accepts `engineerName`, `badgeId`, `decision`, `notes` |
| `GET` | `/api/capa/effectiveness` | Retrieve post-intervention effectiveness and recurrence data | Returns `CapaEffectivenessRecord` |
| `GET` | `/api/tests/results` | Retrieve automated test suite execution states and specs | Returns `{ testCases, demoSpecs }` |
| `POST` | `/api/tests/run` | Execute full 8-case automated test suite synchronously | Returns execution metrics and `TestCaseRecord[]` |
| `POST` | `/api/tests/run-single` | Execute a single test case (`TC-01` to `TC-08`) | Accepts `{ testId }`. Returns `TestCaseRecord` |

---

## 26. Environment Variables

Create a `.env` or `.env.local` file in the root directory:

```bash
# Server Port Configuration
PORT=3000

# Google Gemini API Key (Required for AI features)
GEMINI_API_KEY=your_gemini_api_key_here

# Runtime Environment
NODE_ENV=development
```

---

## 27. Local Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

```bash
# 1. Clone the repository
git clone <repository-url>
cd agentic-ai-manufacturing-quality-inspection-root-cause-analysis-system

# 2. Install all dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY
```

---

## 28. Backend Setup

The full-stack application utilizes an Express server integrated with Vite development middleware:

```bash
# Start backend server in development mode (launches server.ts with tsx)
npm run dev

# The server listens on http://localhost:3000 with unified API proxying
```

---

## 29. Frontend Setup

The frontend is a single-page React application configured with Tailwind CSS:

```bash
# Compile and build production frontend bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 30. Testing

### Run Backend Automated Tests
Execute the 8-case automated manufacturing verification test suite via CLI:

```bash
npm test
```

### Automated Scenarios Verified
- `TC-01`: Nominal Dimensional Verification (All measurements within spec $\rightarrow$ 0 nonconformances).
- `TC-02`: USL Breach Detection ($85.018\text{ mm} > 85.015\text{ mm} \rightarrow$ Flagged `NONCONFORMING`).
- `TC-03`: Vision Model Inference (Optical macro scan $\rightarrow$ Thermal Micro-Cracking with 94.2% conf).
- `TC-04`: Telemetry Vibration Surge (Vibration RMS $3.85\text{ mm/s} \rightarrow$ Mahalanobis anomaly $4.62$).
- `TC-05`: SPC Process Drift (6 ascending subgroup means $\rightarrow$ Nelson Rule 3 triggered).
- `TC-06`: Dense Vector RAG Retrieval (Symptom query $\rightarrow$ Historical `NCR-2024-041` matched at 94.2%).
- `TC-07`: Multi-Hypothesis RCA Synthesis (Spindle thermal growth 92%, tool flank wear 88%).
- `TC-08`: Corrective Action Effectiveness Tracking (Rejection reduced from 8.2% to 1.1%, zero recurrence).

---

## 31. Deployment

```bash
# 1. Build client-side assets and compile server
npm run build

# 2. Launch production Node.js service
npm run start
```
The application will serve compiled static assets and API routes over port `3000`.

---

## 32. Limitations

- **Simulated Machine Controller Interlocks**: While Fanuc 31i M-codes and D402 safety registers are modeled, physical hardware PLC interlocks require an industrial OPC-UA gateway adapter.
- **In-Memory Demonstration State**: Active prototype changes persist across the active session; enterprise high-availability deployment requires PostgreSQL or Cloud SQL persistence.
- **Vision Dataset Scale**: The optical inspection agent evaluates sample telecentric macro scans representing Inconel 718 surface defects; high-throughput production lines require continuous active-learning retraining.

---

## 33. Safety Considerations

1. **Autonomous Action Prohibition**: AI agents are strictly restricted from independently releasing quarantined inventory or disposing of nonconforming components.
2. **Epistemic Label Integrity**: The system refuses to serialize an AI hypothesis as a confirmed root cause without human physical laboratory test notes.
3. **Data Protection**: Quality records, digital signature hashes, and metrology logs are maintained in an append-only audit trail conforming to ISO 9001:2015 §8.7 document retention requirements.
4. **Thermal Stability Warning**: All CMM dimensional evaluations assume standard metrology reference temperature ($20.0^\circ\text{C} \pm 0.5^\circ\text{C}$); uncompensated in-situ measurements trigger a warning badge.
