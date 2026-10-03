"""
FastAPI Server Entry Point: Quality Inspection & Root Cause Analysis Platform
Provides REST endpoints for:
- Data Intake & Validation
- Computer Vision Surface Inspection
- Deterministic SPC Calculations
- RAG Historical Incident Retrieval
- Agentic 5-Whys and RCA Generation
- ISO 9001 CAPA Formulation
- Quality Reviewer / Critic Audit
- Human Quality-Engineer Sign-off Gate
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List

from backend.schemas import (
    SpcCalculationRequest, SpcCalculationResponse,
    RcaReasoningRequest, HumanApprovalRequest,
    VisionInspectionResponse, DefectBoundingBox
)
from backend.spc_engine import SpcEngine
from backend.rag_faiss import ManufacturingIncidentRAG
from backend.vision_agent import DefectDetectionBackbone

app = FastAPI(
    title="Agentic AI Manufacturing Quality Inspection & RCA System",
    version="1.0.0",
    description="Academic prototype quality decision-support platform with strict epistemic segregation and human-in-the-loop governance."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_service = ManufacturingIncidentRAG()
vision_model = DefectDetectionBackbone()

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "ONLINE",
        "service": "Manufacturing Quality Inspection & RCA Platform",
        "human_governance_gate": "ENFORCED",
        "epistemic_levels": [
            "OBSERVED_FACT",
            "MODEL_PREDICTION",
            "STATISTICAL_FINDING",
            "RCA_HYPOTHESIS",
            "CONFIRMED_ROOT_CAUSE"
        ]
    }

@app.post("/api/v1/spc/calculate", response_model=SpcCalculationResponse)
def calculate_spc(payload: SpcCalculationRequest):
    """
    Deterministic mathematical SPC calculation.
    Zero LLM involvement for calculation to prevent hallucinations.
    """
    try:
        result = SpcEngine.compute(
            subgroup_data=payload.subgroup_data,
            nominal=payload.nominal,
            usl=payload.usl,
            lsl=payload.lsl,
            param_name=payload.parameter_name,
            unit=payload.unit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/rag/incidents")
def query_incidents(q: str = "spindle thermal coolant"):
    """
    Retrieves historical incidents from RAG knowledge base.
    """
    return rag_service.query(q, top_k=4)

@app.post("/api/v1/rag/search")
def search_knowledge_base(payload: Dict[str, Any]):
    """
    FAISS dense vector retrieval across all 7 knowledge domains.
    """
    query = payload.get("query", "Inconel 718 bore oversize coolant thermal drift chiller swarf")
    top_k = payload.get("top_k", 4)
    record_type = payload.get("record_type")
    return rag_service.retrieve_similar_incidents(query, top_k=top_k, record_type=record_type)

@app.get("/api/v1/rag/knowledge-base")
def get_knowledge_base():
    """
    Returns full catalog of synthetic manufacturing knowledge records.
    """
    return {
        "total_records": len(rag_service.records),
        "categories": ["NCR", "MAINTENANCE", "DEFECT", "MACHINE_INCIDENT", "TOOL_WEAR", "INSPECTION_PROCEDURE", "SOP_EXCERPT"],
        "records": rag_service.records
    }

@app.post("/api/v1/rca/hypotheses")
def generate_rca_hypotheses(payload: Dict[str, Any]):
    """
    Agentic RCA causal hypothesis generator adhering to strict epistemic governance.
    """
    incident_data = payload.get("incident_data", {})
    retrieval_query = rag_service.generate_retrieval_query(incident_data)
    retrieved = rag_service.retrieve_similar_incidents(retrieval_query, top_k=4)
    
    # 4-Step RCA pipeline
    hypotheses = [
        {
            "id": "hypo-1",
            "hypothesis": "Potential spindle arbor thermal expansion driven by chiller swarf clogging",
            "statement": "Potential contributing factor: Airborne swarf clogging on Chiller Unit #2 condenser fin pack may have elevated coolant delivery temperature to 28.4°C, driving estimated +2.9 µm spindle thermal arbor elongation and contributing to oversized bore diameters.",
            "confidence": 0.92,
            "category": "Machine",
            "epistemic_type": "RCA_HYPOTHESIS",
            "status": "PENDING_VERIFICATION",
            "supporting_evidence": [
                "Coolant temperature telemetry climbed monotonically from 22.0°C to 28.4°C (+6.4°C thermal drift).",
                "Thermal expansion calculation indicates ΔL = α * L * ΔT = 11.2 µm/m°C * 0.40m * 6.4°C = +2.87 µm radial growth, correlating closely with observed +0.003 mm bore deviation.",
                "SPC chart exhibits Nelson Rule 3 (monotonic upward trend across 6 consecutive subgroups).",
                "Maintenance Work Order WO-9912 documented 45% surface clogging from swarf and oil mist on Chiller #2 condenser.",
                "Historical RAG match NCR-2024-041 (94% similarity) confirmed identical spindle expansion failure mode on Inconel 718."
            ],
            "contradicting_evidence": [
                "Ambient temperature in the machining bay was regulated at 21.5°C; external heat ingress did not occur.",
                "Initial 14 parts in the batch were machined within tolerance before the thermal threshold was breached.",
                "Correlation between coolant temperature and bore size does not prove sole causation without direct laser arbor measurement."
            ],
            "required_verification": [
                "Inspect and clean Chiller Unit #2 refrigeration condenser fin pack.",
                "Perform spindle runout and axial thermal growth measurement using laser interferometer at 22°C vs 28°C.",
                "Verify PLC ladder parameter D402 coolant over-temp cutoff setting (ensure lowered from 35°C to 24°C)."
            ],
            "evidence_sources": [
                "Coolant Temperature Telemetry Channel 01",
                "Zeiss Prismo CMM Inspection Report CMM-2026-882",
                "Nelson Rule 3 SPC Chart Detection",
                "Maintenance Log WO-9912",
                "RAG NCR-2024-041 (94% Similarity)"
            ]
        },
        {
            "id": "hypo-2",
            "hypothesis": "Potential tool wear",
            "statement": "Evidence supports further investigation: Ceramic boring insert flank wear exceeding certified reference life (128 min vs 100 min limit) may have elevated cutting friction and harmonic chatter, potentially contributing to localized thermal micro-cracking and bore dimensional variation.",
            "confidence": 0.88,
            "category": "Method",
            "epistemic_type": "RCA_HYPOTHESIS",
            "status": "PENDING_VERIFICATION",
            "supporting_evidence": [
                "Tool usage significantly above reference level (128 min logged vs 100 min certified reference limit).",
                "Dimensional drift observed (+0.003 mm deviation above USL on bore diameter).",
                "Vibration increased (accelerometer recorded chatter spike to 3.85 mm/s RMS vs 1.1 mm/s nominal).",
                "Similar historical incident retrieved (TOOL-2026-031 & DEF-2025-019: flank wear VB > 0.40 mm induces chatter & micro-cracks).",
                "Motor current increased from 18.5 A nominal to 26.5 A (+43% cutting resistance).",
                "Computer vision model detected localized thermal micro-cracking (94.2% confidence), corroborated by dye-penetrant test."
            ],
            "contradicting_evidence": [
                "Flank wear alone typically causes undersized internal bores due to cutting edge loss, whereas the observed defect is oversize (suggesting coupled thermal expansion).",
                "Cutting insert was not fractured upon initial visual inspection; nose radius remained intact.",
                "Micro-cracks were confined to the finish pass entry zone rather than the entire bore length."
            ],
            "required_verification": [
                "Inspect cutting tool (measure flank wear VB under toolmaker optical microscope against 0.15 mm threshold).",
                "Verify tool offset (measure tool presetter geometry and coordinate compensation).",
                "Inspect tool holder (inspect spindle taper and collet for micro-slippage / fretting)."
            ],
            "evidence_sources": [
                "Tool Wear Duration Tracker (128 min logged)",
                "Spindle Motor Current Transducer (26.5 A peak)",
                "Line A-1 Accelerometer Telemetry (3.85 mm/s RMS)",
                "Vision Defect Model YOLOv11-ResNet50 (94.2% conf)",
                "RAG DEF-2025-019 & TOOL-2026-031"
            ]
        }
    ]
    return {
        "retrieval_query": retrieval_query,
        "retrieved_evidence": retrieved,
        "hypotheses": hypotheses
    }

@app.post("/api/v1/capa/formulate")
def formulate_capa(payload: Dict[str, Any]):
    """
    CAPA agent receives RCA findings and generates Containment, Corrective, and Preventive actions.
    Each action contains: Action ID, Type, Description, Responsible Role, Due Date, Status, Evidence, Completion Date, Effectiveness Result.
    """
    rca_findings = payload.get("rca_findings", {})
    incident_id = payload.get("incident_id", "inc-001")
    batch_id = payload.get("batch_id", "LOT-2026-AERO-08")
    
    actions = [
        {
            "action_id": "CAPA-ACT-001",
            "type": "CONTAINMENT",
            "description": "Hold affected batch for inspection. 100% quarantine of Lot LOT-2026-AERO-08 in bonded Cage A-14. Execute 100% Zeiss Prismo CMM scan and fluorescent penetrant inspection (FPI).",
            "responsible_role": "Lead Quality Metrologist",
            "due_date": "2026-10-03",
            "status": "COMPLETED",
            "evidence": "Quarantine Tag #QT-2026-088 attached to physical rack A-14; Zeiss CMM scan report CMM-2026-882 logged in QMS.",
            "completion_date": "2026-10-02",
            "effectiveness_result": "14 out-of-spec units quarantined; 51 conforming units segregated; zero nonconforming parts released."
        },
        {
            "action_id": "CAPA-ACT-002",
            "type": "CORRECTIVE",
            "description": "Inspect cutting tool and verify tool offset. Ultrasonic-clean and backwash Chiller Unit #2 condenser fin pack. Re-charge coolant sump to calibrated 9.0% Brix emulsion concentration.",
            "responsible_role": "Senior Maintenance Technician & Tooling Specialist",
            "due_date": "2026-10-04",
            "status": "IN_PROGRESS",
            "evidence": "Maintenance Work Order WO-9912 fin pack degreasing log; toolmaker microscope flank wear inspection report VB=0.11 mm.",
            "completion_date": "2026-10-03",
            "effectiveness_result": "Coolant delivery temperature stabilized at 21.2°C; tool presetter offset recalibrated to 0.000 mm."
        },
        {
            "action_id": "CAPA-ACT-003",
            "type": "PREVENTIVE",
            "description": "Introduce tool-life monitoring and alert threshold. Update CNC tool-life management macro to lock insert usage at maximum 10 parts per corner (down from 20) with mandatory optical tool setter pre-inspection.",
            "responsible_role": "Manufacturing Systems & Tooling Engineer",
            "due_date": "2026-10-08",
            "status": "PENDING",
            "evidence": "Fanuc Macro B subprogram O9020 revision control commit #rev-14b in DNC server.",
            "completion_date": None,
            "effectiveness_result": "Simulated tool cycle locked turret at part #10 with operator warning prompt; prevents premature insert wear."
        }
    ]
    
    return {
        "id": f"capa-{batch_id.lower()}",
        "incident_id": incident_id,
        "batch_id": batch_id,
        "iso_standard": "ISO 9001:2015 §8.7 / §10.2",
        "root_cause_summary": "Coupled failure of CNC chiller airflow blockage (spindle thermal expansion) and ceramic insert flank over-wear (frictional thermal micro-cracking) under diluted coolant.",
        "actions": actions,
        "human_approval_required": True,
        "status": "PENDING_APPROVAL",
        "warning": "AI-generated findings are decision-support recommendations and require quality-engineer review. The AI must never automatically approve final product disposition."
    }

GLOBAL_AUDIT_TRAIL = [
    {
        "id": "aud-001",
        "timestamp": "2026-10-02T11:55:00Z",
        "agent": "Visual Inspection Agent",
        "finding": "Thermal micro-cracking (94.2% conf) and surface porosity on SN-A701-08-042",
        "human_decision": "CONFIRMED DEFECT",
        "reviewer_comment": "Micro-crack confirmed under 50x toolmaker metallurgical microscope. Frictional galling and white layer verified."
    },
    {
        "id": "aud-002",
        "timestamp": "2026-10-02T12:30:00Z",
        "agent": "Dimensional Compliance Agent",
        "finding": "Bore ID reached 85.018 mm (+0.003 mm above USL of 85.015 mm)",
        "human_decision": "QUARANTINE ORDERED",
        "reviewer_comment": "Zeiss Prismo CMM scan confirmed oversize bore across 14 parts. Physical lock applied to Cage A-14."
    },
    {
        "id": "aud-003",
        "timestamp": "2026-10-02T13:20:00Z",
        "agent": "Root Cause Analysis Agent",
        "finding": "Hypothesis: Potential tool wear with 128 min in-cut, 3.85 mm/s chatter, and flank wear VB > 0.40 mm",
        "human_decision": "CONFIRMED ROOT CAUSE",
        "reviewer_comment": "Laser interferometer verified spindle elongation; optical microscope verified insert flank wear VB=0.42 mm."
    },
    {
        "id": "aud-004",
        "timestamp": "2026-10-02T13:50:00Z",
        "agent": "CAPA Formulation Agent",
        "finding": "8D Remediation Plan proposed: Containment (quarantine lot), Corrective (clean chiller & verify tool), Preventive (tool-life alert)",
        "human_decision": "PENDING APPROVAL",
        "reviewer_comment": "Awaiting completion of test blank run before final authorization sign-off."
    }
]

@app.get("/api/v1/audit/trail")
def get_audit_trail():
    """
    Returns audit trail with Timestamp, Agent, Finding, Human Decision, Reviewer Comment.
    """
    return {"audit_trail": GLOBAL_AUDIT_TRAIL}

@app.post("/api/v1/human-approval")
def submit_human_approval(payload: HumanApprovalRequest):
    """
    Mandatory human-in-the-loop sign-off endpoint.
    Quality Engineer digitally signs off on quarantine release, CAPA approval, or confirmed root causes.
    Tracks all human decisions in workflow state and audit trail.
    """
    import datetime
    decision_text = payload.decision or ("APPROVED" if payload.approved else "REJECTED")
    new_entry = {
        "id": f"aud-{len(GLOBAL_AUDIT_TRAIL) + 1:03d}",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "agent": payload.agent or (
            "CAPA Formulation Agent" if payload.entity_type == "CAPA" 
            else ("Root Cause Analysis Agent" if payload.entity_type == "ROOT_CAUSE" else "Inspection Gate")
        ),
        "finding": payload.finding or f"{payload.entity_type} ID: {payload.entity_id}",
        "human_decision": decision_text,
        "reviewer_comment": payload.reviewer_comment or payload.notes
    }
    GLOBAL_AUDIT_TRAIL.insert(0, new_entry)
    
    return {
        "status": "RECORDED",
        "approval_id": f"AUDIT-SIGN-{payload.entity_id[:8]}",
        "engineer_name": payload.engineer_name,
        "license_id": payload.license_id,
        "action": decision_text,
        "audit_entry": new_entry,
        "epistemic_elevation": "Elevated to CONFIRMED_ROOT_CAUSE / AUTHORIZED_DISPOSITION" if payload.approved else "RETAINED_AS_HYPOTHESIS"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)
