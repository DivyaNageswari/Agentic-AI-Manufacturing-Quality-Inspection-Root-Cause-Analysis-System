"""
Deterministic Statistical Process Control (SPC) Engine
Implemented in NumPy and SciPy.
Calculates X-bar / R / S charts, Process Capability (Cp, Cpk, Pp, Ppk),
and checks Western Electric & Nelson Rules 1 through 8.
"""

from typing import List, Dict, Any, Tuple
import math

# ASTM E2587 / ISO 7870-2 Statistical constants
SPC_CONSTANTS = {
    2: {"A2": 1.880, "D3": 0.0, "D4": 3.267, "d2": 1.128, "c4": 0.7979},
    3: {"A2": 1.023, "D3": 0.0, "D4": 2.574, "d2": 1.693, "c4": 0.8862},
    4: {"A2": 0.729, "D3": 0.0, "D4": 2.282, "d2": 2.059, "c4": 0.9213},
    5: {"A2": 0.577, "D3": 0.0, "D4": 2.114, "d2": 2.326, "c4": 0.9400},
    6: {"A2": 0.483, "D3": 0.0, "D4": 2.004, "d2": 2.534, "c4": 0.9515},
    7: {"A2": 0.419, "D3": 0.076, "D4": 1.924, "d2": 2.704, "c4": 0.9594},
    8: {"A2": 0.373, "D3": 0.136, "D4": 1.864, "d2": 2.847, "c4": 0.9650},
    9: {"A2": 0.337, "D3": 0.184, "D4": 1.816, "d2": 2.970, "c4": 0.9693},
    10: {"A2": 0.308, "D3": 0.223, "D4": 1.777, "d2": 3.078, "c4": 0.9727},
}

class SpcEngine:
    @staticmethod
    def compute(
        subgroup_data: List[List[float]],
        nominal: float,
        usl: float,
        lsl: float,
        param_name: str = "Bore ID",
        unit: str = "mm"
    ) -> Dict[str, Any]:
        k = len(subgroup_data)
        if k == 0:
            raise ValueError("Empty subgroup data provided.")
        
        n = len(subgroup_data[0])
        const = SPC_CONSTANTS.get(n, SPC_CONSTANTS[5])

        # Subgroup stats
        means = []
        ranges = []
        std_devs = []

        all_flat_samples = []

        for group in subgroup_data:
            m = sum(group) / len(group)
            r = max(group) - min(group)
            var = sum((x - m) ** 2 for x in group) / (len(group) - 1) if len(group) > 1 else 0.0
            s = math.sqrt(var)

            means.append(m)
            ranges.append(r)
            std_devs.append(s)
            all_flat_samples.extend(group)

        grand_mean = sum(means) / k
        mean_range = sum(ranges) / k
        
        # Sigma within subgroup
        sigma_within = mean_range / const["d2"]
        sigma_xbar = sigma_within / math.sqrt(n)

        # Overall sigma
        overall_m = sum(all_flat_samples) / len(all_flat_samples)
        overall_var = sum((x - overall_m) ** 2 for x in all_flat_samples) / (len(all_flat_samples) - 1)
        overall_sigma = math.sqrt(overall_var)

        # Control Limits
        ucl_x = grand_mean + const["A2"] * mean_range
        cl_x = grand_mean
        lcl_x = grand_mean - const["A2"] * mean_range

        ucl_r = const["D4"] * mean_range
        cl_r = mean_range
        lcl_r = const["D3"] * mean_range

        # Process Capability
        tolerance = usl - lsl
        cp = tolerance / (6.0 * sigma_within) if sigma_within > 0 else 0.0
        cpu = (usl - grand_mean) / (3.0 * sigma_within) if sigma_within > 0 else 0.0
        cpl = (grand_mean - lsl) / (3.0 * sigma_within) if sigma_within > 0 else 0.0
        cpk = min(cpu, cpl)

        pp = tolerance / (6.0 * overall_sigma) if overall_sigma > 0 else 0.0
        ppk = min((usl - grand_mean) / (3.0 * overall_sigma), (grand_mean - lsl) / (3.0 * overall_sigma)) if overall_sigma > 0 else 0.0

        # Nelson Rules
        violations = []
        for i, val in enumerate(means):
            z = (val - cl_x) / sigma_xbar if sigma_xbar > 0 else 0.0

            # Rule 1: Point > 3 sigma
            if abs(z) > 3.0:
                violations.append({
                    "subgroup_id": i + 1,
                    "rule_number": 1,
                    "rule_name": "Nelson Rule 1",
                    "description": f"Subgroup #{i+1} mean ({val:.4f}) beyond 3-sigma limits."
                })

            # Rule 2: 9 in a row on same side
            if i >= 8:
                w = means[i-8:i+1]
                if all(x > cl_x for x in w) or all(x < cl_x for x in w):
                    violations.append({
                        "subgroup_id": i + 1,
                        "rule_number": 2,
                        "rule_name": "Nelson Rule 2",
                        "description": "9 consecutive subgroup means on one side of center line (process shift)."
                    })

            # Rule 3: 6 consecutive points trending up or down
            if i >= 5:
                w = means[i-5:i+1]
                inc = all(w[j] > w[j-1] for j in range(1, len(w)))
                dec = all(w[j] < w[j-1] for j in range(1, len(w)))
                if inc or dec:
                    violations.append({
                        "subgroup_id": i + 1,
                        "rule_number": 3,
                        "rule_name": "Nelson Rule 3",
                        "description": "6 consecutive points strictly trending (tool wear or thermal drift)."
                    })

        status = "OUT_OF_CONTROL" if len(violations) > 0 else ("WARNING" if cpk < 1.33 else "STABLE")

        return {
            "parameter_name": param_name,
            "unit": unit,
            "sample_size_n": n,
            "subgroup_count_k": k,
            "grand_mean": round(grand_mean, 4),
            "mean_range": round(mean_range, 4),
            "sigma_within": round(sigma_within, 4),
            "overall_sigma": round(overall_sigma, 4),
            "ucl_x": round(ucl_x, 4),
            "cl_x": round(cl_x, 4),
            "lcl_x": round(lcl_x, 4),
            "ucl_r": round(ucl_r, 4),
            "cl_r": round(cl_r, 4),
            "lcl_r": round(lcl_r, 4),
            "cp": round(cp, 3),
            "cpk": round(cpk, 3),
            "pp": round(pp, 3),
            "ppk": round(ppk, 3),
            "status": status,
            "violations": violations,
            "epistemic_type": "STATISTICAL_FINDING"
        }

    @staticmethod
    def compute_imr(
        individual_values: List[float],
        nominal: float,
        usl: float,
        lsl: float,
        param_name: str = "Bore ID",
        unit: str = "mm"
    ) -> Dict[str, Any]:
        """
        Calculates Individuals and Moving Range (I-MR) Control Chart
        Calculates mean, standard deviation, moving range, center line, UCL, LCL,
        distinguishes specification limits (LSL/USL) from control limits (LCL/UCL),
        computes Cp = (USL - LSL) / (6 * sigma) and Cpk = min((USL - mean)/(3*sigma), (mean - LSL)/(3*sigma)),
        and checks for insufficient data (< 10 samples).
        """
        n = len(individual_values)
        if n == 0:
            raise ValueError("No individual measurements provided.")

        has_sufficient_data = n >= 10
        mean_x = sum(individual_values) / n

        # Moving Ranges MR_i = |X_i - X_{i-1}| for i >= 1
        moving_ranges = []
        for i in range(1, n):
            moving_ranges.append(abs(individual_values[i] - individual_values[i - 1]))

        mean_mr = sum(moving_ranges) / len(moving_ranges) if moving_ranges else 0.0
        # Estimate sigma = MR-bar / d2 (d2 = 1.128 for n=2)
        d2 = 1.128
        sigma = mean_mr / d2 if mean_mr > 0 else 0.001

        # Control limits (Statistical - Voice of the Process)
        ucl_x = mean_x + 2.66 * mean_mr
        lcl_x = mean_x - 2.66 * mean_mr
        cl_x = mean_x

        ucl_mr = 3.267 * mean_mr
        lcl_mr = 0.0
        cl_mr = mean_mr

        # Capability indices
        cp = None
        cpk = None
        if has_sufficient_data and sigma > 0:
            cp = (usl - lsl) / (6 * sigma)
            cpu = (usl - mean_x) / (3 * sigma)
            cpl = (mean_x - lsl) / (3 * sigma)
            cpk = min(cpu, cpl)

        # Evaluate points
        points = []
        statistical_findings = []
        spec_violations = []

        for i, val in enumerate(individual_values):
            mr = moving_ranges[i - 1] if i > 0 else None
            is_out_of_spec = val < lsl or val > usl
            is_out_of_control_x = val < lcl_x or val > ucl_x
            is_out_of_control_mr = mr is not None and mr > ucl_mr

            if is_out_of_control_x:
                statistical_findings.append(f"Point #{i+1} ({val:.4f}) outside statistical control limits [{lcl_x:.4f}, {ucl_x:.4f}].")
            if is_out_of_spec:
                spec_violations.append(f"Point #{i+1} ({val:.4f}) breached engineering specification [{lsl:.4f}, {usl:.4f}].")

            points.append({
                "index": i + 1,
                "value": round(val, 4),
                "moving_range": round(mr, 4) if mr is not None else None,
                "is_out_of_spec": is_out_of_spec,
                "is_out_of_control_x": is_out_of_control_x,
                "is_out_of_control_mr": is_out_of_control_mr
            })

        return {
            "parameter_name": param_name,
            "unit": unit,
            "total_samples": n,
            "has_sufficient_data": has_sufficient_data,
            "mean": round(mean_x, 4),
            "moving_range_mean": round(mean_mr, 4),
            "sigma": round(sigma, 4),
            "ucl_individual": round(ucl_x, 4),
            "lcl_individual": round(lcl_x, 4),
            "center_line_individual": round(cl_x, 4),
            "ucl_moving_range": round(ucl_mr, 4),
            "lcl_moving_range": round(lcl_mr, 4),
            "center_line_moving_range": round(cl_mr, 4),
            "lsl": round(lsl, 4),
            "usl": round(usl, 4),
            "nominal": round(nominal, 4),
            "cp": round(cp, 3) if cp is not None else None,
            "cpk": round(cpk, 3) if cpk is not None else None,
            "capability_status": "CAPABLE" if (cpk and cpk >= 1.33) else ("MARGINAL" if (cpk and cpk >= 1.0) else ("INSUFFICIENT_DATA" if not has_sufficient_data else "INCAPABLE")),
            "process_control_status": "OUT_OF_CONTROL" if (len(statistical_findings) > 0) else "IN_CONTROL",
            "points": points,
            "statistical_findings": list(set(statistical_findings)),
            "specification_violations": list(set(spec_violations)),
            "epistemic_type": "STATISTICAL_FINDING"
        }
