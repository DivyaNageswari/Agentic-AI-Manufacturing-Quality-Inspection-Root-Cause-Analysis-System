"""
Academic & Production Quality Inspection & RCA System - Pydantic Data Contracts
Clear epistemic distinction between Observed Facts, Model Predictions,
Statistical Findings, RCA Hypotheses, and Confirmed Root Causes.
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class EpistemicType(str, Enum):
    OBSERVED_FACT = "OBSERVED_FACT"
    MODEL_PREDICTION = "MODEL_PREDICTION"
    STATISTICAL_FINDING = "STATISTICAL_FINDING"
    RCA_HYPOTHESIS = "RCA_HYPOTHESIS"
    CONFIRMED_ROOT_CAUSE = "CONFIRMED_ROOT_CAUSE"

class IncidentSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class DefectBoundingBox(BaseModel):
    x: float = Field(..., description="Top-left x as percentage 0-100")
    y: float = Field(..., description="Top-left y as percentage 0-100")
    width: float = Field(..., description="Width as percentage 0-100")
    height: float = Field(..., description="Height as percentage 0-100")
    defect_class: str
    confidence: float
    area_mm2: float

class VisionInspectionResponse(BaseModel):
    part_id: str
    status: str
    defects: List[DefectBoundingBox]
    model_version: str
    architecture: str
    epistemic_type: EpistemicType = EpistemicType.MODEL_PREDICTION
    gradcam_available: bool = True

class SpcCalculationRequest(BaseModel):
    subgroup_data: List[List[float]] = Field(..., description="Array of subgroup measurements (e.g. k=20, n=5)")
    nominal: float
    usl: float
    lsl: float
    parameter_name: str = "Dimension"
    unit: str = "mm"

class SpcViolation(BaseModel):
    subgroup_id: int
    rule_number: int
    rule_name: str
    description: str

class SpcCalculationResponse(BaseModel):
    parameter_name: str
    unit: str
    grand_mean: float
    mean_range: float
    sigma_within: float
    ucl_x: float
    cl_x: float
    lcl_x: float
    cp: float
    cpk: float
    pp: float
    ppk: float
    status: str
    violations: List[SpcViolation]
    epistemic_type: EpistemicType = EpistemicType.STATISTICAL_FINDING

class AnomalyDetectionRequest(BaseModel):
    telemetry_records: List[Dict[str, float]]
    features: List[str] = ["spindle_rpm", "coolant_temp_c", "hydraulic_pressure_bar", "vibration_rms"]
    contamination: float = 0.05

class RcaReasoningRequest(BaseModel):
    incident_id: str
    batch_id: str
    observed_facts: List[str]
    model_predictions: List[str]
    statistical_findings: List[str]
    retrieved_incidents: Optional[List[Dict[str, Any]]] = None

class RcaHypothesisModel(BaseModel):
    id: str
    statement: str
    likelihood: float
    category: str
    evidence_chain: List[str]
    suggested_physical_test: str
    epistemic_type: EpistemicType = EpistemicType.RCA_HYPOTHESIS

class CapaActionModel(BaseModel):
    id: str
    action_id: Optional[str] = None
    type: str  # CONTAINMENT, CORRECTIVE, PREVENTIVE
    description: Optional[str] = None
    action: Optional[str] = None
    responsible_role: Optional[str] = None
    responsible: Optional[str] = None
    due_date: Optional[str] = None
    target_date: Optional[str] = None
    status: Optional[str] = "PENDING"
    evidence: Optional[str] = None
    completion_date: Optional[str] = None
    effectiveness_result: Optional[str] = None
    metric: Optional[str] = None

class HumanApprovalRequest(BaseModel):
    entity_id: str
    entity_type: str  # BATCH, CAPA, ROOT_CAUSE, DEFECT, RE_ANALYSIS
    approved: bool
    engineer_name: str
    license_id: str
    notes: str
    decision: Optional[str] = None
    agent: Optional[str] = None
    finding: Optional[str] = None
    reviewer_comment: Optional[str] = None
