import type { SpcCalculationResult, SpcSubgroup } from '../types/index.ts';

// Standard SPC Constants table for subgroup sizes n=2 to 10
const SPC_CONSTANTS: Record<number, { A2: number; D3: number; D4: number; d2: number; c4: number }> = {
  2: { A2: 1.880, D3: 0.0, D4: 3.267, d2: 1.128, c4: 0.7979 },
  3: { A2: 1.023, D3: 0.0, D4: 2.574, d2: 1.693, c4: 0.8862 },
  4: { A2: 0.729, D3: 0.0, D4: 2.282, d2: 2.059, c4: 0.9213 },
  5: { A2: 0.577, D3: 0.0, D4: 2.114, d2: 2.326, c4: 0.9400 },
  6: { A2: 0.483, D3: 0.0, D4: 2.004, d2: 2.534, c4: 0.9515 },
  7: { A2: 0.419, D3: 0.076, D4: 1.924, d2: 2.704, c4: 0.9594 },
  8: { A2: 0.373, D3: 0.136, D4: 1.864, d2: 2.847, c4: 0.9650 },
  9: { A2: 0.337, D3: 0.184, D4: 1.816, d2: 2.970, c4: 0.9693 },
  10: { A2: 0.308, D3: 0.223, D4: 1.777, d2: 3.078, c4: 0.9727 },
};

/**
 * Pure deterministic Statistical Process Control calculation engine.
 * Computes X-bar, R-charts, standard deviation, process capability (Cp, Cpk, Pp, Ppk),
 * and checks all 8 Nelson / Western Electric Rules.
 */
export function calculateSpcMetrics(
  subgroupData: number[][],
  nominal: number,
  usl: number,
  lsl: number,
  paramName = 'Critical Dimension',
  unit = 'mm',
  timestampList?: string[]
): SpcCalculationResult {
  const k = subgroupData.length;
  if (k === 0) {
    throw new Error('At least one subgroup is required for SPC computation.');
  }

  const n = subgroupData[0].length;
  const constants = SPC_CONSTANTS[n] || SPC_CONSTANTS[5];

  // 1. Calculate each subgroup's Mean (X_bar), Range (R), and Sample StdDev (s)
  const computedSubgroups: SpcSubgroup[] = subgroupData.map((samples, idx) => {
    const sum = samples.reduce((acc, v) => acc + v, 0);
    const mean = sum / samples.length;
    const minVal = Math.min(...samples);
    const maxVal = Math.max(...samples);
    const range = maxVal - minVal;

    const variance = samples.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (samples.length - 1);
    const stdDev = Math.sqrt(variance);

    const timeStr = timestampList && timestampList[idx]
      ? timestampList[idx]
      : `Subgroup #${idx + 1}`;

    return {
      subgroupId: idx + 1,
      timestamp: timeStr,
      samples,
      mean: Number(mean.toFixed(4)),
      range: Number(range.toFixed(4)),
      stdDev: Number(stdDev.toFixed(4)),
      ucl: 0,
      cl: 0,
      lcl: 0,
      isOutOfControl: false,
      violatedRules: [],
    };
  });

  // 2. Compute Grand Mean (X_bar_bar) and Mean Range (R_bar)
  const sumOfMeans = computedSubgroups.reduce((acc, sg) => acc + sg.mean, 0);
  const grandMeanXBarBar = sumOfMeans / k;

  const sumOfRanges = computedSubgroups.reduce((acc, sg) => acc + sg.range, 0);
  const meanRangeRBar = sumOfRanges / k;

  // 3. Control Limits for X-bar chart
  const uclX = grandMeanXBarBar + constants.A2 * meanRangeRBar;
  const clX = grandMeanXBarBar;
  const lclX = grandMeanXBarBar - constants.A2 * meanRangeRBar;

  // 4. Control Limits for R chart
  const uclR = constants.D4 * meanRangeRBar;
  const clR = meanRangeRBar;
  const lclR = constants.D3 * meanRangeRBar;

  // 5. Sigma estimates: within-subgroup (R-bar / d2) and overall sample standard deviation
  const estimatedSigmaWithin = meanRangeRBar / constants.d2;

  // Overall standard deviation of all pooled individual samples
  const allSamples = subgroupData.flat();
  const overallMean = allSamples.reduce((a, b) => a + b, 0) / allSamples.length;
  const overallVariance =
    allSamples.reduce((acc, val) => acc + Math.pow(val - overallMean, 2), 0) / (allSamples.length - 1);
  const overallStdDev = Math.sqrt(overallVariance);

  // Sigma of the subgroup means: sigma_xbar = sigma / sqrt(n)
  const sigmaXbar = estimatedSigmaWithin / Math.sqrt(n);

  // Fill in control limits on each subgroup
  computedSubgroups.forEach((sg) => {
    sg.ucl = Number(uclX.toFixed(4));
    sg.cl = Number(clX.toFixed(4));
    sg.lcl = Number(lclX.toFixed(4));
  });

  // 6. Evaluate Nelson / Western Electric Rules (1 through 8)
  const activeViolations: SpcCalculationResult['activeViolations'] = [];
  const means = computedSubgroups.map((sg) => sg.mean);

  for (let i = 0; i < k; i++) {
    const currentMean = means[i];
    const diffFromCl = currentMean - clX;
    const zScore = diffFromCl / sigmaXbar;

    // Rule 1: One point beyond 3 sigma (> UCL or < LCL)
    if (Math.abs(zScore) > 3.0) {
      computedSubgroups[i].violatedRules.push(1);
      computedSubgroups[i].isOutOfControl = true;
      activeViolations.push({
        subgroupId: i + 1,
        ruleNumber: 1,
        ruleName: 'Rule 1: Point Outside 3-Sigma Limits',
        description: `Subgroup #${i + 1} mean (${currentMean.toFixed(3)}) breached 3σ limits [${lclX.toFixed(3)}, ${uclX.toFixed(3)}].`,
      });
    }

    // Rule 2: Nine points in a row on the same side of the centerline
    if (i >= 8) {
      const window = means.slice(i - 8, i + 1);
      const allAbove = window.every((val) => val > clX);
      const allBelow = window.every((val) => val < clX);
      if (allAbove || allBelow) {
        computedSubgroups[i].violatedRules.push(2);
        computedSubgroups[i].isOutOfControl = true;
        activeViolations.push({
          subgroupId: i + 1,
          ruleNumber: 2,
          ruleName: 'Rule 2: Nine Points in a Row on One Side',
          description: `9 consecutive points fell strictly ${allAbove ? 'above' : 'below'} centerline, indicating process mean shift.`,
        });
      }
    }

    // Rule 3: Six consecutive points steadily increasing or steadily decreasing
    if (i >= 5) {
      const window = means.slice(i - 5, i + 1);
      let increasing = true;
      let decreasing = true;
      for (let w = 1; w < window.length; w++) {
        if (window[w] <= window[w - 1]) increasing = false;
        if (window[w] >= window[w - 1]) decreasing = false;
      }
      if (increasing || decreasing) {
        computedSubgroups[i].violatedRules.push(3);
        computedSubgroups[i].isOutOfControl = true;
        activeViolations.push({
          subgroupId: i + 1,
          ruleNumber: 3,
          ruleName: 'Rule 3: Six Consecutive Points Trending',
          description: `6 consecutive points exhibit monotonic ${increasing ? 'upward' : 'downward'} trend (tool wear/thermal drift).`,
        });
      }
    }

    // Rule 4: Fourteen consecutive points alternating up and down
    if (i >= 13) {
      const window = means.slice(i - 13, i + 1);
      let alternating = true;
      for (let w = 1; w < window.length - 1; w++) {
        const prevDiff = window[w] - window[w - 1];
        const nextDiff = window[w + 1] - window[w];
        if (prevDiff * nextDiff >= 0) {
          alternating = false;
          break;
        }
      }
      if (alternating) {
        computedSubgroups[i].violatedRules.push(4);
        computedSubgroups[i].isOutOfControl = true;
        activeViolations.push({
          subgroupId: i + 1,
          ruleNumber: 4,
          ruleName: 'Rule 4: Fourteen Alternating Points',
          description: '14 points alternating up and down continuously (systematic oscillation between fixtures/operators).',
        });
      }
    }

    // Rule 5: Two out of three consecutive points in Zone A (> 2 sigma) on same side
    if (i >= 2) {
      const window = means.slice(i - 2, i + 1);
      const above2SigmaCount = window.filter((val) => val > clX + 2 * sigmaXbar).length;
      const below2SigmaCount = window.filter((val) => val < clX - 2 * sigmaXbar).length;
      if (above2SigmaCount >= 2 || below2SigmaCount >= 2) {
        computedSubgroups[i].violatedRules.push(5);
        computedSubgroups[i].isOutOfControl = true;
        activeViolations.push({
          subgroupId: i + 1,
          ruleNumber: 5,
          ruleName: 'Rule 5: Two of Three Points in Zone A (>2σ)',
          description: '2 out of 3 consecutive points fell in the outer 2σ to 3σ zone on the same side.',
        });
      }
    }

    // Rule 6: Four out of five consecutive points in Zone B (> 1 sigma) on same side
    if (i >= 4) {
      const window = means.slice(i - 4, i + 1);
      const above1SigmaCount = window.filter((val) => val > clX + 1 * sigmaXbar).length;
      const below1SigmaCount = window.filter((val) => val < clX - 1 * sigmaXbar).length;
      if (above1SigmaCount >= 4 || below1SigmaCount >= 4) {
        computedSubgroups[i].violatedRules.push(6);
        computedSubgroups[i].isOutOfControl = true;
        activeViolations.push({
          subgroupId: i + 1,
          ruleNumber: 6,
          ruleName: 'Rule 6: Four of Five Points Beyond 1σ',
          description: '4 out of 5 consecutive points were greater than 1σ from centerline on the same side.',
        });
      }
    }
  }

  // 7. Calculate Process Capability Indices
  const toleranceSpan = usl - lsl;
  const cp = toleranceSpan / (6 * estimatedSigmaWithin);
  const cpu = (usl - grandMeanXBarBar) / (3 * estimatedSigmaWithin);
  const cpl = (grandMeanXBarBar - lsl) / (3 * estimatedSigmaWithin);
  const cpk = Math.min(cpu, cpl);

  // Overall performance indices
  const pp = toleranceSpan / (6 * overallStdDev);
  const ppu = (usl - grandMeanXBarBar) / (3 * overallStdDev);
  const ppl = (grandMeanXBarBar - lsl) / (3 * overallStdDev);
  const ppk = Math.min(ppu, ppl);

  let status: SpcCalculationResult['status'] = 'STABLE';
  if (activeViolations.length > 0) {
    status = 'OUT_OF_CONTROL';
  } else if (cpk < 1.33) {
    status = 'WARNING';
  }

  return {
    parameterName: paramName,
    unit,
    sampleSizeN: n,
    subgroupCount: k,
    grandMeanXBarBar: Number(grandMeanXBarBar.toFixed(4)),
    meanRangeRBar: Number(meanRangeRBar.toFixed(4)),
    estimatedSigma: Number(estimatedSigmaWithin.toFixed(4)),
    uclX: Number(uclX.toFixed(4)),
    clX: Number(clX.toFixed(4)),
    lclX: Number(lclX.toFixed(4)),
    uclR: Number(uclR.toFixed(4)),
    clR: Number(clR.toFixed(4)),
    lclR: Number(lclR.toFixed(4)),
    usl: Number(usl.toFixed(4)),
    lsl: Number(lsl.toFixed(4)),
    nominal: Number(nominal.toFixed(4)),
    cp: Number(cp.toFixed(3)),
    cpk: Number(cpk.toFixed(3)),
    cpu: Number(cpu.toFixed(3)),
    cpl: Number(cpl.toFixed(3)),
    pp: Number(pp.toFixed(3)),
    ppk: Number(ppk.toFixed(3)),
    status,
    activeViolations,
    subgroups: computedSubgroups,
  };
}

/**
 * Sample sequential dimensional inspection dataset (25 consecutive parts)
 * demonstrating steady machining, followed by thermal drift and specification breaches.
 */
export const SAMPLE_INDIVIDUAL_MEASUREMENTS = [
  85.001, 85.003, 85.002, 85.004, 85.002, 85.005, 85.003, 85.006,
  85.005, 85.007, 85.008, 85.009, 85.011, 85.010, 85.012, 85.014,
  85.013, 85.015, 85.016, 85.018, 85.017, 85.019, 85.018, 85.020, 85.019
];

/**
 * Individuals and Moving Range (I-MR) Control Chart Calculation Engine
 * Computes:
 * - Individuals Chart (X): Center Line (X-bar), UCL_x, LCL_x
 * - Moving Range Chart (MR): Center Line (MR-bar), UCL_mr, LCL_mr (0)
 * - Distinction between Specification Limits (LSL / USL) and Control Limits (LCL / UCL)
 * - Cp = (USL - LSL) / (6 * sigma)
 * - Cpk = min((USL - mean)/(3*sigma), (mean - LSL)/(3*sigma))
 * - Enforces minimum data threshold (requires >= 10 samples for capability)
 */
export function calculateImrControlChart(
  individualValues: number[],
  nominal: number = 85.000,
  usl: number = 85.015,
  lsl: number = 84.985,
  paramName: string = 'Bore Inner Diameter',
  unit: string = 'mm',
  sampleLabels?: string[]
): import('../types').ImrControlChartResult {
  const n = individualValues.length;
  const MINIMUM_CAPABILITY_SAMPLES = 10;
  const hasSufficientData = n >= MINIMUM_CAPABILITY_SAMPLES;

  if (n === 0) {
    throw new Error('At least one measurement is required for I-MR computation.');
  }

  // 1. Calculate Mean of Individuals (X-bar)
  const sumX = individualValues.reduce((acc, v) => acc + v, 0);
  const meanX = sumX / n;

  // 2. Calculate Moving Ranges: MR_i = |X_i - X_{i-1}| for i >= 1
  const movingRanges: (number | null)[] = [];
  movingRanges.push(null); // First point has no preceding point
  let sumMR = 0;

  for (let i = 1; i < n; i++) {
    const mr = Math.abs(individualValues[i] - individualValues[i - 1]);
    movingRanges.push(Number(mr.toFixed(4)));
    sumMR += mr;
  }

  const movingRangeMean = n > 1 ? sumMR / (n - 1) : 0; // MR-bar

  // 3. Estimate Standard Deviation: sigma = MR-bar / d2 (d2 = 1.128 for n=2)
  const d2 = 1.128;
  const sigma = movingRangeMean > 0 ? movingRangeMean / d2 : 0.001;

  // 4. Statistical Control Limits for Individuals (X Chart)
  // UCL_x = X-bar + 2.66 * MR-bar (equivalent to X-bar + 3 * sigma)
  // LCL_x = X-bar - 2.66 * MR-bar (equivalent to X-bar - 3 * sigma)
  const uclIndividual = meanX + 2.66 * movingRangeMean;
  const lclIndividual = meanX - 2.66 * movingRangeMean;
  const centerLineIndividual = meanX;

  // 5. Statistical Control Limits for Moving Range (MR Chart)
  // UCL_mr = D4 * MR-bar = 3.267 * MR-bar
  // LCL_mr = D3 * MR-bar = 0
  const uclMovingRange = 3.267 * movingRangeMean;
  const lclMovingRange = 0;
  const centerLineMovingRange = movingRangeMean;

  // 6. Calculate Process Capability (Cp and Cpk) if sufficient data
  let cp: number | null = null;
  let cpk: number | null = null;
  let capabilityStatus: import('../types').ImrControlChartResult['capabilityStatus'] = 'INSUFFICIENT_DATA';

  if (hasSufficientData && sigma > 0) {
    // Exact formula: Cp = (USL - LSL) / (6 * sigma)
    cp = (usl - lsl) / (6 * sigma);

    // Exact formula: Cpk = min((USL - mean)/(3*sigma), (mean - LSL)/(3*sigma))
    const cpu = (usl - meanX) / (3 * sigma);
    const cpl = (meanX - lsl) / (3 * sigma);
    cpk = Math.min(cpu, cpl);

    if (cpk >= 1.33) {
      capabilityStatus = 'CAPABLE';
    } else if (cpk >= 1.0) {
      capabilityStatus = 'MARGINAL';
    } else {
      capabilityStatus = 'INCAPABLE';
    }
  }

  // 7. Evaluate Data Points for Out of Control (Statistical) vs Out of Spec (Engineering)
  const statisticalFindings: string[] = [];
  const specificationViolations: string[] = [];
  let isProcessOutOfControl = false;

  const points: import('../types').ImrDataPoint[] = individualValues.map((val, idx) => {
    const mr = movingRanges[idx];
    const isOutOfSpec = val < lsl || val > usl; // Engineering Tolerance Violation
    const isOutOfControlIndividual = val < lclIndividual || val > uclIndividual; // Statistical Control Limit Breach
    const isOutOfControlMr = mr !== null && mr > uclMovingRange; // Moving range spike

    let ruleNote = '';
    if (isOutOfControlIndividual) {
      isProcessOutOfControl = true;
      ruleNote = val > uclIndividual
        ? `Point #${idx + 1} exceeds statistical Upper Control Limit (UCL ${uclIndividual.toFixed(4)} mm)`
        : `Point #${idx + 1} falls below statistical Lower Control Limit (LCL ${lclIndividual.toFixed(4)} mm)`;
      statisticalFindings.push(`[STATISTICAL_FINDING] ${ruleNote}`);
    }

    if (isOutOfControlMr) {
      isProcessOutOfControl = true;
      const mrNote = `Point #${idx + 1} moving range (${mr?.toFixed(4)} mm) exceeds MR Control Limit (UCL_mr ${uclMovingRange.toFixed(4)} mm)`;
      statisticalFindings.push(`[STATISTICAL_FINDING] ${mrNote}`);
    }

    if (isOutOfSpec) {
      const specNote = val > usl
        ? `Point #${idx + 1} (${val.toFixed(4)} mm) breaches Upper Specification Limit (USL ${usl.toFixed(4)} mm) by +${(val - usl).toFixed(4)} mm`
        : `Point #${idx + 1} (${val.toFixed(4)} mm) breaches Lower Specification Limit (LSL ${lsl.toFixed(4)} mm) by -${(lsl - val).toFixed(4)} mm`;
      specificationViolations.push(`[SPECIFICATION_VIOLATION] ${specNote}`);
    }

    const label = sampleLabels && sampleLabels[idx]
      ? sampleLabels[idx]
      : `P-${String(idx + 1).padStart(3, '0')}`;

    return {
      index: idx + 1,
      sampleId: label,
      timestamp: `T+${(idx * 3.5).toFixed(1)}m`,
      individualValue: Number(val.toFixed(4)),
      movingRange: mr !== null ? Number(mr.toFixed(4)) : null,
      isOutOfSpec,
      isOutOfControlIndividual,
      isOutOfControlMr,
      violatedRule: ruleNote || undefined,
      notes: isOutOfSpec ? 'Scrap / Quarantine Required' : undefined,
    };
  });

  return {
    parameterName: paramName,
    unit,
    totalSamples: n,
    hasSufficientData,
    mean: Number(meanX.toFixed(4)),
    movingRangeMean: Number(movingRangeMean.toFixed(4)),
    sigma: Number(sigma.toFixed(4)),
    uclIndividual: Number(uclIndividual.toFixed(4)),
    lclIndividual: Number(lclIndividual.toFixed(4)),
    centerLineIndividual: Number(centerLineIndividual.toFixed(4)),
    uclMovingRange: Number(uclMovingRange.toFixed(4)),
    lclMovingRange: Number(lclMovingRange.toFixed(4)),
    centerLineMovingRange: Number(centerLineMovingRange.toFixed(4)),
    lsl: Number(lsl.toFixed(4)),
    usl: Number(usl.toFixed(4)),
    nominal: Number(nominal.toFixed(4)),
    cp: cp !== null ? Number(cp.toFixed(3)) : null,
    cpk: cpk !== null ? Number(cpk.toFixed(3)) : null,
    capabilityStatus,
    processControlStatus: isProcessOutOfControl ? 'OUT_OF_CONTROL' : 'IN_CONTROL',
    points,
    statisticalFindings: Array.from(new Set(statisticalFindings)),
    specificationViolations: Array.from(new Set(specificationViolations)),
  };
}

