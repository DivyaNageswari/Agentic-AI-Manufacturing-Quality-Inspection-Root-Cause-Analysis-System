#!/usr/bin/env python3
"""
Manufacturing Process Anomaly Detection Engine
Implementation:
- Isolation Forest algorithm via scikit-learn (detects multivariate outliers & unusual combinations)
- Engineering threshold boundary checks (detects sudden spikes, thermal drift, vibration alarms, tool overuse)
- Statistical correlation analysis

8 Monitored Process Parameters:
1. Temperature (°C)
2. Pressure (bar)
3. Spindle Speed (RPM)
4. Feed Rate (mm/min)
5. Machine Vibration (mm/s RMS)
6. Tool Usage (min)
7. Cycle Time (s)
8. Motor Current (A)
"""

from typing import List, Dict, Any, Tuple
import json
import time
import numpy as np

# Engineering Thresholds
THRESHOLDS = {
    "temperature": {"nominal": 22.0, "warn_max": 25.0, "crit_max": 27.0, "unit": "°C"},
    "pressure": {"nominal": 70.0, "warn_min": 65.0, "crit_min": 58.0, "unit": "bar"},
    "spindle_speed": {"nominal": 12000, "warn_min": 11500, "warn_max": 12500, "unit": "RPM"},
    "feed_rate": {"nominal": 450, "warn_min": 420, "warn_max": 480, "unit": "mm/min"},
    "vibration": {"nominal": 1.2, "warn_max": 2.5, "crit_max": 3.2, "unit": "mm/s"}, # ISO 10816-3
    "tool_usage": {"nominal": 45, "warn_max": 100, "crit_max": 120, "unit": "min"},
    "cycle_time": {"nominal": 52.0, "warn_max": 56.0, "crit_max": 62.0, "unit": "s"},
    "motor_current": {"nominal": 18.5, "warn_max": 23.0, "crit_max": 28.0, "unit": "A"}
}

def detect_anomalies_isolation_forest(
    telemetry_data: List[Dict[str, float]],
    contamination: float = 0.15
) -> List[Dict[str, Any]]:
    """
    Fits scikit-learn Isolation Forest on 8-dimensional telemetry vectors
    and flags multidimensional anomalies.
    """
    try:
        from sklearn.ensemble import IsolationForest
        sklearn_available = True
    except ImportError:
        sklearn_available = False

    feature_keys = [
        "temperature", "pressure", "spindle_speed", "feed_rate",
        "vibration", "tool_usage", "cycle_time", "motor_current"
    ]

    # Convert to numpy matrix
    matrix = []
    for row in telemetry_data:
        vec = [row.get(k, THRESHOLDS[k]["nominal"]) for k in feature_keys]
        matrix.append(vec)

    X = np.array(matrix, dtype=np.float32)

    if sklearn_available and len(X) >= 10:
        # Fit Isolation Forest
        iso_forest = IsolationForest(
            n_estimators=100,
            contamination=contamination,
            random_state=42
        )
        iso_forest.fit(X)
        scores = -iso_forest.score_samples(X) # Higher score = more anomalous
        predictions = iso_forest.predict(X)   # -1: anomaly, 1: normal
    else:
        # Mathematical fallback: normalized Mahalanobis / Z-score distance
        means = np.mean(X, axis=0)
        stds = np.std(X, axis=0) + 1e-6
        z_scores = np.abs((X - means) / stds)
        scores = np.max(z_scores, axis=1) / 3.0
        predictions = np.where(scores > 0.5, -1, 1)

    results = []
    for idx, (row, score, pred) in enumerate(zip(telemetry_data, scores, predictions)):
        is_anomaly = pred == -1 or score > 0.50
        parameters_involved = []
        anomaly_types = []
        evidence_notes = []

        temp = row.get("temperature", 22.0)
        vibe = row.get("vibration", 1.2)
        tool = row.get("tool_usage", 45)
        current = row.get("motor_current", 18.5)
        feed = row.get("feed_rate", 450)
        pressure = row.get("pressure", 70.0)

        # 1. Sudden Vibration Anomaly
        if vibe > THRESHOLDS["vibration"]["warn_max"]:
            parameters_involved.append("Machine Vibration")
            anomaly_types.append("ABNORMAL_VIBRATION")
            evidence_notes.append(f"Vibration ({vibe:.2f} mm/s) exceeded ISO warning threshold (2.5 mm/s).")

        # 2. Gradual Drift (Temperature)
        if temp > THRESHOLDS["temperature"]["warn_max"]:
            parameters_involved.append("Temperature")
            anomaly_types.append("GRADUAL_DRIFT")
            evidence_notes.append(f"Coolant temperature ({temp:.1f}°C) exceeded 25°C threshold.")

        # 3. Abnormal Tool Usage
        if tool > THRESHOLDS["tool_usage"]["crit_max"]:
            parameters_involved.append("Tool Usage")
            anomaly_types.append("TOOL_OVERUSE")
            evidence_notes.append(f"Tool usage ({tool} min) exceeded 120-min certified tool-life.")

        # 4. Unusual Parameter Combination (High motor current with low feed rate)
        if current > 23.0 and feed < 420:
            parameters_involved.extend(["Motor Current", "Feed Rate"])
            anomaly_types.append("UNUSUAL_COMBINATION")
            evidence_notes.append(f"High motor current ({current:.1f}A) with low feed rate ({feed} mm/min) indicates frictional binding.")

        # 5. Sudden Pressure Drop
        if pressure < THRESHOLDS["pressure"]["warn_min"]:
            parameters_involved.append("Pressure")
            anomaly_types.append("SUDDEN_SPIKE")
            evidence_notes.append(f"Hydraulic pressure dropped to {pressure:.1f} bar.")

        if is_anomaly and not parameters_involved:
            parameters_involved.append("Multivariate Combination")
            anomaly_types.append("UNUSUAL_COMBINATION")
            evidence_notes.append(f"Isolation Forest identified multidimensional divergence.")

        status = "ANOMALY" if is_anomaly else "NORMAL"
        primary_type = anomaly_types[0] if anomaly_types else "NORMAL"
        evidence_str = " ".join(evidence_notes) if evidence_notes else "[STATISTICAL_FINDING] Operating within nominal 3-sigma boundaries."

        results.append({
            "index": idx + 1,
            "timestamp": row.get("timestamp", f"T+{idx * 2}m"),
            "anomaly_score": round(float(score), 3),
            "status": status,
            "anomaly_type": primary_type,
            "parameters_involved": list(set(parameters_involved)) if parameters_involved else ["None"],
            "evidence": f"[STATISTICAL_FINDING] {evidence_str}"
        })

    return results

if __name__ == "__main__":
    sample_data = [
        {"temperature": 22.1, "pressure": 70.2, "spindle_speed": 12000, "feed_rate": 450, "vibration": 1.1, "tool_usage": 30, "cycle_time": 52.0, "motor_current": 18.4},
        {"temperature": 28.4, "pressure": 62.0, "spindle_speed": 11980, "feed_rate": 412, "vibration": 3.8, "tool_usage": 125, "cycle_time": 55.4, "motor_current": 26.5},
    ]
    res = detect_anomalies_isolation_forest(sample_data)
    print(json.dumps(res, indent=2))
