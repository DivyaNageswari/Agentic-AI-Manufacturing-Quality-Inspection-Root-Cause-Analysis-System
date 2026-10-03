"""
Academic & Industrial Reference: scikit-learn Isolation Forest Anomaly Detection
Architecture: Liu, Ting, Zhou (2008) Isolation Forest algorithm applied to CNC cutting telemetry.

Monitored Process Parameters (8 Dimensions):
1. Temperature (°C)
2. Pressure (bar)
3. Spindle Speed (RPM)
4. Feed Rate (mm/min)
5. Machine Vibration (mm/s RMS)
6. Tool Usage (min)
7. Cycle Time (s)
8. Motor Current (A)
"""

import numpy as np
from typing import List, Dict, Any

try:
    from sklearn.ensemble import IsolationForest
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

FEATURE_NAMES = [
    "Temperature (°C)",
    "Pressure (bar)",
    "Spindle Speed (RPM)",
    "Feed Rate (mm/min)",
    "Machine Vibration (mm/s RMS)",
    "Tool Usage (min)",
    "Cycle Time (s)",
    "Motor Current (A)"
]

ENGINEERING_THRESHOLDS = {
    "temperatureC": {"nominal": 22.0, "maxWarning": 25.0, "criticalMax": 27.0},
    "pressureBar": {"nominal": 70.0, "minWarning": 65.0, "criticalMin": 58.0},
    "spindleSpeedRpm": {"nominal": 12000, "minWarning": 11500, "maxWarning": 12500},
    "feedRateMmMin": {"nominal": 450, "minWarning": 420, "maxWarning": 480},
    "machineVibrationMmS": {"nominal": 1.2, "maxWarning": 2.5, "criticalMax": 3.2},
    "toolUsageMinutes": {"nominal": 45, "maxWarning": 100, "criticalMax": 120},
    "cycleTimeS": {"nominal": 52.0, "minWarning": 48.0, "maxWarning": 56.0},
    "motorCurrentA": {"nominal": 18.5, "maxWarning": 23.0, "criticalMax": 28.0},
}


class ProcessMonitoringIsolationForest:
    """
    Production-grade scikit-learn Isolation Forest pipeline
    with dual statistical scoring and engineering threshold arbitration.
    """

    def __init__(self, n_estimators: int = 100, contamination: float = 0.15, random_state: int = 42):
        self.n_estimators = n_estimators
        self.contamination = contamination
        self.random_state = random_state
        self.model = None
        if SKLEARN_AVAILABLE:
            self.model = IsolationForest(
                n_estimators=self.n_estimators,
                max_samples="auto",
                contamination=self.contamination,
                random_state=self.random_state,
                n_jobs=-1
            )

    def fit(self, X: np.ndarray):
        """Fit isolation forest on baseline or training telemetry."""
        if self.model is not None:
            self.model.fit(X)
        return self

    def predict_point(self, point: Dict[str, float]) -> Dict[str, Any]:
        """
        Evaluates a single telemetry frame against:
        1. scikit-learn Isolation Forest anomaly score
        2. Engineering threshold boundaries
        Classifies anomaly type into:
        - SUDDEN_SPIKE
        - UNUSUAL_COMBINATION
        - GRADUAL_DRIFT
        - ABNORMAL_VIBRATION
        - TOOL_OVERUSE
        """
        feature_vector = np.array([[
            point.get("temperatureC", 22.0),
            point.get("pressureBar", 70.0),
            point.get("spindleSpeedRpm", 12000.0),
            point.get("feedRateMmMin", 450.0),
            point.get("machineVibrationMmS", 1.2),
            point.get("toolUsageMinutes", 45.0),
            point.get("cycleTimeS", 52.0),
            point.get("motorCurrentA", 18.5)
        ]])

        # 1. Isolation Forest Scoring
        if self.model is not None:
            raw_decision = self.model.decision_function(feature_vector)[0]
            # Normalize decision function to [0, 1] anomaly score:
            # raw_decision < 0 indicates anomaly in sklearn
            score = float(1.0 / (1.0 + np.exp(raw_decision * 4.0)))
            is_if_anomaly = bool(self.model.predict(feature_vector)[0] == -1)
        else:
            score = 0.20
            is_if_anomaly = False

        # 2. Engineering Threshold Verification
        temp = point.get("temperatureC", 22.0)
        vib = point.get("machineVibrationMmS", 1.2)
        tool = point.get("toolUsageMinutes", 45.0)
        current = point.get("motorCurrentA", 18.5)
        feed = point.get("feedRateMmMin", 450.0)
        pressure = point.get("pressureBar", 70.0)

        threshold_breach = False
        anomaly_type = "NORMAL"
        params_involved = []
        evidence = ""

        if vib > ENGINEERING_THRESHOLDS["machineVibrationMmS"]["criticalMax"]:
            threshold_breach = True
            anomaly_type = "ABNORMAL_VIBRATION"
            params_involved.extend(["Machine Vibration", "Motor Current"])
            evidence = f"[STATISTICAL_FINDING] Vibration ({vib:.2f} mm/s) breached ISO 10816-3 critical threshold (3.2 mm/s)."
        elif tool > ENGINEERING_THRESHOLDS["toolUsageMinutes"]["criticalMax"]:
            threshold_breach = True
            anomaly_type = "TOOL_OVERUSE"
            params_involved.extend(["Tool Usage", "Motor Current"])
            evidence = f"[SPECIFICATION_VIOLATION] Tool usage ({tool:.0f} min) breached maximum certified life (120 min)."
        elif temp > ENGINEERING_THRESHOLDS["temperatureC"]["maxWarning"]:
            threshold_breach = True
            anomaly_type = "GRADUAL_DRIFT"
            params_involved.append("Temperature")
            evidence = f"[STATISTICAL_FINDING] Thermal expansion drift: Coolant reached {temp:.1f}°C (warning > 25.0°C)."
        elif feed < 420.0 and current > 24.0:
            threshold_breach = True
            anomaly_type = "UNUSUAL_COMBINATION"
            params_involved.extend(["Feed Rate", "Motor Current"])
            evidence = f"[STATISTICAL_FINDING] Bivariate outlier: Low feed rate ({feed:.0f} mm/min) combined with elevated motor load ({current:.1f} A)."
        elif is_if_anomaly:
            anomaly_type = "SUDDEN_SPIKE"
            params_involved.append("Process Multivariates")
            evidence = f"[STATISTICAL_FINDING] Multidimensional outlier score {score:.3f} breached statistical threshold."

        is_anomaly = is_if_anomaly or threshold_breach

        return {
            "anomaly_score": round(score, 3),
            "status": "ANOMALY" if is_anomaly else "NORMAL",
            "anomaly_type": anomaly_type,
            "parameters_involved": params_involved if is_anomaly else [],
            "evidence": evidence,
            "timestamp": point.get("timestamp", "NOW")
        }


if __name__ == "__main__":
    print("Scikit-learn Isolation Forest pipeline reference loaded successfully.")
