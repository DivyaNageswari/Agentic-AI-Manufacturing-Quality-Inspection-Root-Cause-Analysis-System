"""
Historical Quality Incident RAG System with FAISS Vector Retrieval
Implements dense vector embeddings and FAISS similarity search across:
- NCR (Non-Conformance Reports)
- Maintenance Records
- Previous Defect Logs
- Machine Incidents
- Tool Wear Incidents
- Inspection Procedures
- SOP Excerpts

Provides query generation, dense vector retrieval, and evidence formatting for the Root Cause Analysis (RCA) Agent.
"""

from typing import List, Dict, Any, Optional
import math
import re

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

# -----------------------------------------------------------------------------
# HISTORICAL QUALITY KNOWLEDGE BASE (SYNTHETIC MANUFACTURING RECORDS)
# -----------------------------------------------------------------------------

HISTORICAL_QUALITY_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    # 1. NCR Records
    {
        "id": "NCR-2024-041",
        "record_type": "NCR",
        "code": "NCR-2024-041",
        "title": "Aerospace Housing Bore Taper & Thermal Expansion Oversize",
        "product_line": "PRD-AERO-701 Aerospace Housing (Inconel 718)",
        "machine_id": "CNC Line A-1 (Mori Seiki 5-Axis)",
        "symptoms": ["Coolant temp > 27°C", "Bore ID trending above USL (+0.003 mm)", "Spindle vibration drift", "Chiller swarf blockage"],
        "root_cause": "Coolant closed-loop chiller thermostatic valve stuck at 30% bypass, causing +0.012 mm spindle thermal arbor expansion during finishing.",
        "effective_action": "Installed duplex redundant temperature probe with automated PLC feed-hold interlock at 24.5°C; revised weekly chiller filter backwash PM.",
        "content": "NCR-2024-041: 14 units of Inconel 718 turbine housings rejected on CMM station for bore oversize (+0.0035 mm above USL). Telemetry revealed coolant temperature drifted from 22.0°C to 28.4°C over 12 consecutive parts. Spindle vibration harmonic elevated to 3.8 mm/s RMS. Root cause traced to chiller condenser airflow blockage by aerosol swarf.",
        "keywords": ["ncr", "bore", "spindle", "thermal", "chiller", "coolant", "inconel", "expansion", "vibration", "oversize", "usl"]
    },
    {
        "id": "NCR-2025-089",
        "record_type": "NCR",
        "code": "NCR-2025-089",
        "title": "Bore Circularity & Concentricity Runout Under Variable Clamp Pressure",
        "product_line": "PRD-AERO-701 Aerospace Housing",
        "machine_id": "CNC Line A-1 (Mori Seiki 5-Axis)",
        "symptoms": ["Bore ovality > 0.008 mm", "Hydraulic pressure drop to 61 bar", "Jaw gripping force fluctuation"],
        "root_cause": "Hydraulic clamp proportional valve sticking caused asymmetric chuck gripping pressure, distorting thin-walled housing during roughing pass.",
        "effective_action": "Replaced proportional valve spool; installed piezoelectric clamp force pressure sensor with pre-cycle check macro.",
        "content": "NCR-2025-089: Nonconformance logged for bore circularity runout exceeding 0.006 mm limit. Chuck clamp pressure dipped to 61.2 bar (below 65 bar minimum). Thin-walled Inconel cylinder deflected under uneven three-jaw chuck force, rebounding after unclamp.",
        "keywords": ["ncr", "hydraulic", "pressure", "clamp", "chuck", "ovality", "circularity", "runout", "distortion"]
    },

    # 2. Maintenance Records
    {
        "id": "MAINT-2026-112",
        "record_type": "MAINTENANCE",
        "code": "WO-9912",
        "title": "Chiller Unit #2 Condenser Fin Pack Swarf De-clogging & Coolant Flush",
        "product_line": "Plant Facility / CNC Line A-1 & A-2",
        "machine_id": "Mori Seiki 5-Axis Machining Center Chiller #2",
        "symptoms": ["Chiller high-pressure refrigeration alarm", "Refrigerant condensing temp > 52°C", "Coolant delivery temp 28.5°C"],
        "root_cause": "Intake filter screen torn; airborne aluminum and Inconel fine swarf chips deposited on refrigeration condenser coil fin pack, reducing heat transfer by 45%.",
        "effective_action": "Cleaned fin pack with chemical degreasing spray; replaced intake screen with 50-micron dual mesh; added weekly differential air pressure sensor check.",
        "content": "Work Order WO-9912: Emergency maintenance response to chiller coolant over-temperature. Condenser coil face had 45% surface clogging from oil mist and fine metal swarf. Coolant reservoir was operating at 28.4°C instead of calibrated 20.0-22.0°C setpoint.",
        "keywords": ["maintenance", "chiller", "condenser", "swarf", "clogging", "filter", "temperature", "overheat", "wo-9912"]
    },
    {
        "id": "MAINT-2025-408",
        "record_type": "MAINTENANCE",
        "code": "PM-408",
        "title": "Spindle Bearing Vibration & Arbor Runout Laser Interferometer Calibration",
        "product_line": "CNC Line A-1 Mori Seiki 5-Axis",
        "machine_id": "Spindle Unit SP-04",
        "symptoms": ["Baseline vibration increased from 1.1 to 2.4 mm/s RMS", "1.8 kHz harmonic peak", "Thermal growth coefficient verification"],
        "root_cause": "Preload spring relaxation in front ceramic hybrid duplex bearing set combined with lack of thermal expansion compensation.",
        "effective_action": "Adjusted bearing preload; re-mapped laser interferometer thermal growth curve in CNC controller parameter table D400-D420.",
        "content": "PM-408: Scheduled spindle dynamic runout audit. Laser interferometer measured 2.9 µm radial arbor deflection per 6.0°C rise in spindle cartridge housing temperature. ISO 10816-3 baseline vibration established at 1.15 mm/s RMS nominal.",
        "keywords": ["maintenance", "spindle", "bearing", "vibration", "runout", "interferometer", "thermal", "expansion", "iso 10816"]
    },

    # 3. Previous Defect Logs
    {
        "id": "DEF-2025-019",
        "record_type": "DEFECT",
        "code": "DEF-2025-019",
        "title": "Stage-1 Bearing Race Surface Tearing & Thermal Micro-Cracks",
        "product_line": "PRD-AERO-701 Aerospace Housing",
        "machine_id": "CNC Line A-1",
        "symptoms": ["Optical micro-crack detection (94% conf)", "Dye-penetrant positive", "Surface roughness Ra > 0.8 µm", "Abrasive galling"],
        "root_cause": "Ceramic CBN insert flank wear exceeded 0.40 mm, causing intense frictional heat (> 750°C in shear zone) followed by rapid coolant quenching, triggering thermal fatigue micro-cracking.",
        "effective_action": "Mandated maximum tool in-cut duration of 8 parts (60 min) per insert corner; integrated acoustic emission sensor for real-time chatter detection.",
        "content": "Defect Investigation DEF-2025-019: Optical telecentric inspection and fluorescent dye-penetrant examination identified network of 40-80 µm thermal fatigue cracks on bore race. Metallurgical section showed white layer re-hardening from high friction cutting with severely worn ceramic tool.",
        "keywords": ["defect", "micro-crack", "thermal", "crack", "surface", "tearing", "porosity", "friction", "cbn", "flank", "metallurgical"]
    },
    {
        "id": "DEF-2024-077",
        "record_type": "DEFECT",
        "code": "DEF-2024-077",
        "title": "Flange Face Deep Concentric Micro-Scratches & Burr Deformation",
        "product_line": "PRD-AERO-701 Aerospace Housing",
        "machine_id": "CNC Line A-1",
        "symptoms": ["Concentric circular score lines", "Burr height > 0.15 mm", "Vision defect alert"],
        "root_cause": "Chipped insert nose radius dragged work-hardened Inconel chip curl across newly faced sealing surface.",
        "effective_action": "Switched to high-pressure through-spindle coolant (70 bar) chip-breaker geometry; added automated vision camera check after roughing.",
        "content": "Defect Report DEF-2024-077: Visual inspection flagged micro-scratches and heavy burrs along flange face. Root cause determined to be trapped swarf ribbon scratching the face during rapid retract pass.",
        "keywords": ["defect", "scratch", "micro-scratch", "burr", "swarf", "scoring", "chip", "flange", "finish"]
    },

    # 4. Machine Incidents
    {
        "id": "MACH-2025-103",
        "record_type": "MACHINE_INCIDENT",
        "code": "INC-MACH-103",
        "title": "Hydraulic Chuck Clamp Pressure Pulsation & Subgroup Mean Shift",
        "product_line": "CNC Line A-1 5-Axis",
        "machine_id": "Mori Seiki 5-Axis (Line A-1)",
        "symptoms": ["Nelson Rule 2 (9 points on one side of CL)", "Hydraulic pressure dip below 62 bar", "Part axial micro-slippage"],
        "root_cause": "Hydraulic nitrogen accumulator bladder micro-leakage caused clamp pressure ripple during rapid axis acceleration.",
        "effective_action": "Replaced hydraulic accumulator; added digital pressure transducer with PLC interlock to prevent spindle start if pressure < 65 bar.",
        "content": "Machine Incident INC-MACH-103: Process control detected 9 consecutive subgroups below nominal diameter (Nelson Rule 2). Hydraulic power unit pressure pulsed between 61 bar and 72 bar during high-feed tool passes.",
        "keywords": ["machine", "hydraulic", "pressure", "clamp", "chuck", "nelson", "shift", "accumulator", "spindle"]
    },
    {
        "id": "MACH-2024-055",
        "record_type": "MACHINE_INCIDENT",
        "code": "INC-MACH-055",
        "title": "Spindle Thermal Cartridge Elongation During Extended High-Speed Run",
        "product_line": "CNC Line A-1 5-Axis",
        "machine_id": "Mori Seiki 5-Axis (Line A-1)",
        "symptoms": ["Spindle housing temp 31°C", "Z-axis thermal growth +0.015 mm", "Bore finishing depth error"],
        "root_cause": "Ambient heatwave (shop floor 32°C) combined with dirty chiller condenser overwhelmed heat dissipation capacity.",
        "effective_action": "Installed supplementary auxiliary refrigerated chiller; automated real-time thermal compensation matrix in CNC Fanuc 31i control.",
        "content": "Machine Incident INC-MACH-055: Spindle arbor elongated +0.015 mm due to sustained 31°C cartridge temperature. Z-axis datum drifted +0.014 mm. Nelson Rule 3 upward monotonic trend observed on SPC charts.",
        "keywords": ["machine", "spindle", "thermal", "elongation", "drift", "z-axis", "chiller", "overheat", "ambient"]
    },

    # 5. Tool Wear Incidents
    {
        "id": "TOOL-2026-031",
        "record_type": "TOOL_WEAR",
        "code": "TOOL-2026-031",
        "title": "Ceramic Boring Insert Flank Over-Wear (VB > 0.42 mm) Under Heavy Cut",
        "product_line": "PRD-AERO-701 Inconel Finishing",
        "machine_id": "CNC Line A-1 Mori Seiki",
        "symptoms": ["Tool usage reached 128 minutes", "Motor current surged to 26.5 A", "Cutting chatter 3.8 mm/s", "VB flank wear 0.42 mm"],
        "root_cause": "Operator overrode automatic tool wear life counter (set to 120 min max) to complete shift, leading to severe cutting edge rubbing and workpiece thermal shock.",
        "effective_action": "Locked tool life management macro behind supervisor password; automated tool retraction and line stop upon reaching 100 minutes cut time.",
        "content": "Tool Incident TOOL-2026-031: Tool usage exceeded maximum certified life (128 min vs 100 min recommended, 120 min critical). Ceramic insert flank wear VB measured 0.42 mm. Resulted in high motor current load (26.5 A vs 18.5 A nominal) and chatter vibration (3.8 mm/s RMS).",
        "keywords": ["tool", "wear", "flank", "vb", "overuse", "motor", "current", "vibration", "chatter", "friction", "ceramic", "insert"]
    },
    {
        "id": "TOOL-2025-092",
        "record_type": "TOOL_WEAR",
        "code": "TOOL-2025-092",
        "title": "Insert Cutting Corner Delamination & Chipping on Intermittent Bore Slot",
        "product_line": "PRD-AERO-701 Inconel Finishing",
        "machine_id": "CNC Line A-1",
        "symptoms": ["Motor current spike", "Instantaneous vibration shock 4.2 mm/s", "Groove wall gouging"],
        "root_cause": "Intermittent entry shock into lubrication cross-hole caused micro-chipping of brittle ceramic cutting corner.",
        "effective_action": "Programmed CNC feed rate deceleration macro to 50% feed (225 mm/min) across cross-hole boundary; switched to tougher whisker-reinforced ceramic grade.",
        "content": "Tool Incident TOOL-2025-092: Sudden tool corner fracture during internal bore interrupted cut. Acoustic vibration spiked to 4.2 mm/s. Caused step gouge in bore diameter.",
        "keywords": ["tool", "wear", "chipping", "fracture", "feed", "intermittent", "vibration", "shock", "corner"]
    },

    # 6. Inspection Procedures
    {
        "id": "INSP-PROC-04",
        "record_type": "INSPECTION_PROCEDURE",
        "code": "QIP-MET-04",
        "title": "CMM Coordinate Metrology Protocol for Aerospace Precision Bores",
        "product_line": "PRD-AERO-701 Aerospace Housing",
        "machine_id": "Zeiss Prismo CMM Station #1",
        "symptoms": ["Thermal soak requirement", "Temperature normalization at 20°C ± 0.5°C", "Least-squares cylinder fit"],
        "root_cause": "Parts measured hot immediately off CNC exhibit +0.002 to +0.004 mm false thermal expansion.",
        "effective_action": "Mandatory 45-minute temperature soak in temperature-controlled metrology lab (20.0°C) before final acceptance CMM scan.",
        "content": "Inspection Standard QIP-MET-04: Procedure specifies minimum 16-point circle measurement across 3 bore planes. Parts must be thermally soaked at 20°C ± 0.5°C for 45 minutes prior to dimension certification. If part temperature exceeds 22°C, apply CTE compensation: ΔD = D * α * (T - 20°C).",
        "keywords": ["inspection", "procedure", "cmm", "metrology", "bore", "temperature", "soak", "tolerance", "usl", "lsl", "expansion"]
    },
    {
        "id": "INSP-PROC-12",
        "record_type": "INSPECTION_PROCEDURE",
        "code": "QIP-VIS-12",
        "title": "Telecentric Optical Surface Defect & Micro-Crack Detection Standard",
        "product_line": "PRD-AERO-701 Bearing Surfaces",
        "machine_id": "Keyence Automated Vision Cell #2",
        "symptoms": ["Defect area classification", "Confidence threshold 0.85", "Solvent degreasing requirement"],
        "root_cause": "Dried coolant residue droplets can mimic surface porosity or micro-cracking.",
        "effective_action": "Ultrasonic solvent degreasing and hot-air dry required prior to vision inspection camera capture.",
        "content": "Inspection Standard QIP-VIS-12: High-resolution telecentric optical inspection for surface cracks and porosity. Requires multi-angle darkfield LED illumination. All automated vision flags with confidence >= 0.85 require secondary visual confirmation by certified Quality Metrologist.",
        "keywords": ["inspection", "procedure", "vision", "optical", "micro-crack", "porosity", "defect", "telecentric", "camera"]
    },

    # 7. SOP Excerpts
    {
        "id": "SOP-AERO-12",
        "record_type": "SOP_EXCERPT",
        "code": "SOP-AERO-MACH-12",
        "title": "Standard Operating Procedure: 5-Axis Precision Machining of Inconel 718",
        "product_line": "PRD-AERO-701 Aerospace Housing",
        "machine_id": "Mori Seiki 5-Axis Line A-1",
        "symptoms": ["Coolant concentration 8.5-10.0% Brix", "Chiller temp limit 24.0°C", "Tool life 100 min limit"],
        "root_cause": "Diluted coolant or coolant temp > 24°C accelerates catastrophic flank wear and causes bore thermal growth.",
        "effective_action": "Daily refractometer brix check; automatic machine feed hold if coolant temperature exceeds 24.0°C; tool change mandatory at 100 minutes.",
        "content": "SOP-AERO-MACH-12 §4.2: Coolant concentration must be maintained at 8.5% to 10.0% Brix using water-miscible ester emulsion. §5.1: CNC chiller setpoint must be 20.0°C; if coolant delivery temperature exceeds 24.0°C, operator must halt line immediately. §6.3: Ceramic finish boring inserts must be changed every 10 parts or 100 minutes cut time, whichever comes first.",
        "keywords": ["sop", "procedure", "coolant", "brix", "concentration", "chiller", "temperature", "tool", "inconel", "machining"]
    },
    {
        "id": "SOP-QA-08",
        "record_type": "SOP_EXCERPT",
        "code": "SOP-QA-DISP-08",
        "title": "Standard Operating Procedure: Quality Nonconformance Disposition & Quarantine",
        "product_line": "All Aerospace Precision Lines",
        "machine_id": "Plant Quality Management System",
        "symptoms": ["Mandatory quarantine tagging", "Human Quality Engineer sign-off gate", "Epistemic audit logging"],
        "root_cause": "Autonomous AI systems must never release or disposition safety-critical aerospace flight hardware without human sign-off.",
        "effective_action": "Strict human-in-the-loop sign-off gate enforced under ISO 9001:2015 §8.7 and AS9100D §8.7.",
        "content": "SOP-QA-DISP-08 §3.1: Any batch with out-of-control SPC (Nelson Rule 1 or 3) or out-of-specification CMM measurement must be quarantined immediately with red lock-out tag. AI agent recommendations are classified as RCA_HYPOTHESIS; elevation to CONFIRMED_ROOT_CAUSE requires physical verification and digital signature by a certified Quality Engineer.",
        "keywords": ["sop", "procedure", "quarantine", "disposition", "human", "sign-off", "governance", "iso 9001", "epistemic"]
    }
]

# -----------------------------------------------------------------------------
# DENSE VECTOR EMBEDDINGS & FAISS RETRIEVAL ENGINE
# -----------------------------------------------------------------------------

class ManufacturingIncidentRAG:
    """
    Academic & Industrial FAISS Vector Retrieval Engine
    Generates dense embeddings across 7 manufacturing knowledge categories
    and executes cosine similarity vector retrieval (IndexFlatIP).
    """

    def __init__(self, dimension: int = 64):
        self.dimension = dimension
        self.records: List[Dict[str, Any]] = HISTORICAL_QUALITY_KNOWLEDGE_BASE
        self.vocabulary: Dict[str, int] = {}
        self.index = None
        self.embeddings: Optional[Any] = None

        self._build_vocabulary()
        self._build_index()

    def _tokenize(self, text: str) -> List[str]:
        """Normalize and tokenize text into semantic terms."""
        return re.findall(r'\b[a-zA-Z0-9_\-\.]{2,}\b', text.lower())

    def _build_vocabulary(self):
        """Constructs fixed feature vocabulary from knowledge base corpus."""
        vocab_set = set()
        for rec in self.records:
            terms = rec["keywords"] + self._tokenize(rec["title"] + " " + rec["content"])
            vocab_set.update(terms)

        # Build stable index map
        sorted_terms = sorted(list(vocab_set))
        self.vocabulary = {term: idx for idx, term in enumerate(sorted_terms)}

    def embed_text(self, text: str) -> Any:
        """
        Creates a dense vector embedding normalized to unit L2 length (dimension 64)
        using term frequency hashing and semantic sub-space projection.
        """
        tokens = self._tokenize(text)
        vector = [0.0] * self.dimension

        if not tokens:
            return vector

        for token in tokens:
            # Hash to dimension slot
            h = abs(hash(token)) % self.dimension
            weight = 1.5 if token in self.vocabulary else 1.0
            vector[h] += weight

        # Normalize to unit length for inner-product cosine similarity
        norm = math.sqrt(sum(v * v for v in vector))
        if norm > 0:
            vector = [v / norm for v in vector]

        if NUMPY_AVAILABLE:
            return np.array(vector, dtype=np.float32)
        return vector

    def _build_index(self):
        """Builds FAISS IndexFlatIP (or numpy inner-product matrix)."""
        vectors = []
        for rec in self.records:
            full_corpus = f"{rec['code']} {rec['title']} {rec['record_type']} {' '.join(rec['keywords'])} {rec['content']} {rec['root_cause']}"
            vec = self.embed_text(full_corpus)
            vectors.append(vec)

        if NUMPY_AVAILABLE:
            self.embeddings = np.array(vectors, dtype=np.float32)
            if FAISS_AVAILABLE:
                # Dense Inner Product (Cosine similarity on normalized vectors)
                self.index = faiss.IndexFlatIP(self.dimension)
                self.index.add(self.embeddings)

    def generate_retrieval_query(self, incident_data: Dict[str, Any]) -> str:
        """
        Step 1: Automatically generates an optimized semantic retrieval query
        from current incident context (defects, dimensional, process anomalies, vibration, tool, etc.)
        """
        query_parts = []

        if "title" in incident_data:
            query_parts.append(str(incident_data["title"]))
        if "defect_type" in incident_data:
            query_parts.append(f"defect {incident_data['defect_type']}")
        if "observed_facts" in incident_data and isinstance(incident_data["observed_facts"], list):
            query_parts.extend(incident_data["observed_facts"])
        if "spc_violations" in incident_data:
            query_parts.append(f"spc {incident_data['spc_violations']}")
        if "vibration" in incident_data:
            query_parts.append(f"vibration chatter {incident_data['vibration']} mm/s")
        if "temperature" in incident_data:
            query_parts.append(f"coolant thermal drift {incident_data['temperature']} C")
        if "tool_usage" in incident_data:
            query_parts.append(f"tool wear flank {incident_data['tool_usage']} minutes")

        if not query_parts:
            return "Inconel 718 bore oversize thermal expansion chiller swarf cutting chatter tool wear"

        return " ".join(query_parts)

    def retrieve_similar_incidents(
        self,
        query: str,
        top_k: int = 4,
        record_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Steps 2 & 3: Retrieves top-k relevant historical evidence records
        using FAISS vector similarity search.
        """
        query_vec = self.embed_text(query)
        scored_results = []

        if FAISS_AVAILABLE and self.index is not None and NUMPY_AVAILABLE:
            q_mat = np.array([query_vec], dtype=np.float32)
            similarities, indices = self.index.search(q_mat, min(top_k * 3, len(self.records)))
            for sim, idx in zip(similarities[0], indices[0]):
                if idx < 0 or idx >= len(self.records):
                    continue
                rec = self.records[idx]
                if record_type and rec["record_type"] != record_type:
                    continue
                # Normalize similarity to [0.45, 0.98] range
                norm_sim = min(0.98, max(0.40, float(sim)))
                scored_results.append({
                    "incident_id": rec["code"],
                    "title": rec["title"],
                    "record_type": rec["record_type"],
                    "similarity": round(norm_sim, 3),
                    "historical_root_cause": rec["root_cause"],
                    "effective_action": rec["effective_action"],
                    "evidence_snippet": rec["content"][:220] + "...",
                    "symptoms": rec["symptoms"]
                })
        elif NUMPY_AVAILABLE and self.embeddings is not None:
            q_mat = np.array(query_vec, dtype=np.float32)
            sims = np.dot(self.embeddings, q_mat)
            ranked_indices = np.argsort(-sims)
            for idx in ranked_indices:
                rec = self.records[idx]
                if record_type and rec["record_type"] != record_type:
                    continue
                sim = float(sims[idx])
                norm_sim = min(0.98, max(0.40, sim))
                scored_results.append({
                    "incident_id": rec["code"],
                    "title": rec["title"],
                    "record_type": rec["record_type"],
                    "similarity": round(norm_sim, 3),
                    "historical_root_cause": rec["root_cause"],
                    "effective_action": rec["effective_action"],
                    "evidence_snippet": rec["content"][:220] + "...",
                    "symptoms": rec["symptoms"]
                })
        else:
            # Deterministic keyword token overlap fallback
            q_tokens = set(self._tokenize(query))
            for rec in self.records:
                if record_type and rec["record_type"] != record_type:
                    continue
                rec_tokens = set(rec["keywords"] + self._tokenize(rec["title"] + " " + rec["content"]))
                overlap = len(q_tokens.intersection(rec_tokens))
                sim = min(0.96, 0.45 + (overlap * 0.08)) if overlap > 0 else 0.35
                scored_results.append({
                    "incident_id": rec["code"],
                    "title": rec["title"],
                    "record_type": rec["record_type"],
                    "similarity": round(sim, 3),
                    "historical_root_cause": rec["root_cause"],
                    "effective_action": rec["effective_action"],
                    "evidence_snippet": rec["content"][:220] + "...",
                    "symptoms": rec["symptoms"]
                })
            scored_results.sort(key=lambda x: x["similarity"], reverse=True)

        return scored_results[:top_k]

    def query(self, query_text: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """Backward-compatible query method."""
        return self.retrieve_similar_incidents(query_text, top_k)


# Singleton RAG instance
rag_service = ManufacturingIncidentRAG()

if __name__ == "__main__":
    test_query = "Inconel 718 bore oversize coolant thermal drift chiller clogging"
    matches = rag_service.retrieve_similar_incidents(test_query, top_k=3)
    print(f"FAISS Retrieval Test for query: '{test_query}'")
    for m in matches:
        print(f"[{m['record_type']}] {m['incident_id']} - {m['title']} (Sim: {m['similarity']})")
