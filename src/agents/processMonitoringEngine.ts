import type { TelemetryPoint, ProcessAnomalyRecord } from '../types/index.ts';

/**
 * Engineering Thresholds for the 8 Required Process Parameters:
 * 1. Temperature (°C)
 * 2. Pressure (bar)
 * 3. Spindle Speed (RPM)
 * 4. Feed Rate (mm/min)
 * 5. Machine Vibration (mm/s RMS)
 * 6. Tool Usage (min)
 * 7. Cycle Time (s)
 * 8. Motor Current (A)
 */
export const ENGINEERING_THRESHOLDS = {
  temperatureC: {
    nominal: 22.0,
    minWarning: 18.0,
    maxWarning: 25.0,
    criticalMin: 15.0,
    criticalMax: 27.0,
    unit: '°C',
    label: 'Coolant / Spindle Temperature',
  },
  pressureBar: {
    nominal: 70.0,
    minWarning: 65.0,
    maxWarning: 75.0,
    criticalMin: 58.0,
    criticalMax: 82.0,
    unit: 'bar',
    label: 'Hydraulic Clamp Pressure',
  },
  spindleSpeedRpm: {
    nominal: 12000,
    minWarning: 11500,
    maxWarning: 12500,
    criticalMin: 10800,
    criticalMax: 13200,
    unit: 'RPM',
    label: 'Spindle Speed',
  },
  feedRateMmMin: {
    nominal: 450,
    minWarning: 420,
    maxWarning: 480,
    criticalMin: 380,
    criticalMax: 520,
    unit: 'mm/min',
    label: 'Cutting Feed Rate',
  },
  machineVibrationMmS: {
    nominal: 1.2,
    minWarning: 2.0,
    maxWarning: 2.5, // ISO 10816-3 Class II Warning
    criticalMin: 0.1,
    criticalMax: 3.2, // ISO 10816-3 Class II Alarm
    unit: 'mm/s RMS',
    label: 'Machine Vibration',
  },
  toolUsageMinutes: {
    nominal: 45,
    minWarning: 80,
    maxWarning: 100,
    criticalMin: 0,
    criticalMax: 120, // Certified carbide insert tool-life limit
    unit: 'min',
    label: 'Tool Usage / Wear Duration',
  },
  cycleTimeS: {
    nominal: 52.0,
    minWarning: 48.0,
    maxWarning: 56.0,
    criticalMin: 44.0,
    criticalMax: 62.0,
    unit: 's',
    label: 'Part Machining Cycle Time',
  },
  motorCurrentA: {
    nominal: 18.5,
    minWarning: 15.0,
    maxWarning: 23.0,
    criticalMin: 12.0,
    criticalMax: 28.0,
    unit: 'A',
    label: 'Spindle Motor Current',
  },
};

export const PROCESS_PARAMETER_KEYS = [
  'temperatureC',
  'pressureBar',
  'spindleSpeedRpm',
  'feedRateMmMin',
  'machineVibrationMmS',
  'toolUsageMinutes',
  'cycleTimeS',
  'motorCurrentA',
] as const;

export const PROCESS_PARAMETER_NAMES = [
  'Temperature',
  'Pressure',
  'Spindle Speed',
  'Feed Rate',
  'Machine Vibration',
  'Tool Usage',
  'Cycle Time',
  'Motor Current',
];

/**
 * Converts a TelemetryPoint into an 8-dimensional numerical feature vector
 */
export function telemetryPointToFeatureVector(p: TelemetryPoint): number[] {
  return [
    p.temperatureC,
    p.pressureBar,
    p.spindleSpeedRpm,
    p.feedRateMmMin,
    p.machineVibrationMmS,
    p.toolUsageMinutes,
    p.cycleTimeS,
    p.motorCurrentA,
  ];
}

// -------------------------------------------------------------
// ISOLATION FOREST IMPLEMENTATION (Liu, Ting, Zhou 2008)
// Matches scikit-learn IsolationForest(n_estimators=100, contamination=0.15)
// -------------------------------------------------------------

export interface IsolationTreeNode {
  splitFeature?: number;
  splitValue?: number;
  left?: IsolationTreeNode;
  right?: IsolationTreeNode;
  size: number;
  isLeaf: boolean;
}

export class IsolationForest {
  private nTrees: number;
  private subSampleSize: number;
  private maxDepth: number;
  private trees: IsolationTreeNode[] = [];
  private contamination: number;
  public threshold: number = 0.55;

  constructor(nTrees = 100, subSampleSize = 256, contamination = 0.15) {
    this.nTrees = nTrees;
    this.subSampleSize = subSampleSize;
    this.contamination = contamination;
    this.maxDepth = Math.ceil(Math.log2(Math.max(subSampleSize, 2)));
  }

  /**
   * Average path length of unsuccessful searches in a Binary Search Tree (BST)
   * c(n) = 2 * (ln(n - 1) + 0.5772156649) - (2 * (n - 1) / n)
   */
  public static averagePathLength(n: number): number {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    const eulerMascheroni = 0.5772156649;
    return 2 * (Math.log(n - 1) + eulerMascheroni) - (2 * (n - 1)) / n;
  }

  /**
   * Recursively builds an Isolation Tree (iTree)
   */
  private buildTree(X: number[][], currentDepth: number, maxDepth: number): IsolationTreeNode {
    const n = X.length;
    if (n <= 1 || currentDepth >= maxDepth) {
      return { size: n, isLeaf: true };
    }

    const nFeatures = X[0].length;
    // Randomly select an attribute
    const splitFeature = Math.floor(Math.random() * nFeatures);

    // Find min and max of chosen attribute
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let i = 0; i < n; i++) {
      const v = X[i][splitFeature];
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }

    if (minVal === maxVal) {
      return { size: n, isLeaf: true };
    }

    // Select uniform random split point
    const splitValue = minVal + Math.random() * (maxVal - minVal);

    // Partition
    const leftData: number[][] = [];
    const rightData: number[][] = [];
    for (let i = 0; i < n; i++) {
      if (X[i][splitFeature] < splitValue) {
        leftData.push(X[i]);
      } else {
        rightData.push(X[i]);
      }
    }

    return {
      splitFeature,
      splitValue,
      left: this.buildTree(leftData, currentDepth + 1, maxDepth),
      right: this.buildTree(rightData, currentDepth + 1, maxDepth),
      size: n,
      isLeaf: false,
    };
  }

  /**
   * Computes path length h(x, T) for an instance x through an iTree
   */
  private computePathLength(x: number[], node: IsolationTreeNode, currentDepth = 0): number {
    if (node.isLeaf) {
      return currentDepth + IsolationForest.averagePathLength(node.size);
    }

    const feat = node.splitFeature!;
    const val = node.splitValue!;

    if (x[feat] < val) {
      return node.left ? this.computePathLength(x, node.left, currentDepth + 1) : currentDepth;
    } else {
      return node.right ? this.computePathLength(x, node.right, currentDepth + 1) : currentDepth;
    }
  }

  /**
   * Fits the ensemble of Isolation Trees on dataset X
   */
  public fit(X: number[][]): this {
    if (X.length === 0) return this;

    this.trees = [];
    const n = X.length;
    const sampleSize = Math.min(this.subSampleSize, n);
    this.maxDepth = Math.ceil(Math.log2(Math.max(sampleSize, 2)));

    for (let t = 0; t < this.nTrees; t++) {
      // Subsample without replacement
      const indices = new Set<number>();
      while (indices.size < sampleSize) {
        indices.add(Math.floor(Math.random() * n));
      }
      const subSample = Array.from(indices).map((idx) => X[idx]);
      this.trees.push(this.buildTree(subSample, 0, this.maxDepth));
    }

    // Determine anomaly score threshold based on contamination percentile
    const scores = this.scoreSamples(X);
    const sortedScores = [...scores].sort((a, b) => b - a); // descending
    const cutoffIndex = Math.min(
      Math.floor(sortedScores.length * this.contamination),
      sortedScores.length - 1
    );
    this.threshold = Math.max(0.50, sortedScores[cutoffIndex] || 0.55);

    return this;
  }

  /**
   * Computes normalized Isolation Forest anomaly score for instance x:
   * s(x, n) = 2^(-E(h(x)) / c(n))
   * Scores close to 1 indicate distinct anomalies; scores < 0.5 indicate normal instances.
   */
  public scoreSample(x: number[], subSampleSize = this.subSampleSize): number {
    if (this.trees.length === 0) return 0.5;

    let totalPathLength = 0;
    for (let i = 0; i < this.trees.length; i++) {
      totalPathLength += this.computePathLength(x, this.trees[i]);
    }
    const avgPathLength = totalPathLength / this.trees.length;
    const c = IsolationForest.averagePathLength(subSampleSize);

    if (c === 0) return 0.5;
    return Math.pow(2, -avgPathLength / c);
  }

  /**
   * Computes anomaly scores for a batch of samples
   */
  public scoreSamples(X: number[][]): number[] {
    const sampleSize = Math.min(this.subSampleSize, X.length);
    return X.map((x) => this.scoreSample(x, sampleSize));
  }

  /**
   * Predicts whether each sample is an anomaly or normal
   */
  public predict(X: number[][]): { anomalyScore: number; isAnomaly: boolean }[] {
    const scores = this.scoreSamples(X);
    return scores.map((score) => ({
      anomalyScore: Number(score.toFixed(3)),
      isAnomaly: score >= this.threshold,
    }));
  }
}

// -------------------------------------------------------------
// MANUFACTURING TELEMETRY GENERATOR & ANOMALY EVALUATOR
// -------------------------------------------------------------

/**
 * Generates a realistic manufacturing process telemetry dataset (40 consecutive frames)
 * for a 5-Axis CNC machining center machining Inconel 718 aerospace turbine housings.
 * Contains:
 * - Frames 0-14: Normal steady cutting
 * - Frames 15-24: Gradual thermal drift (coolant temperature rising from 22.0°C to 28.4°C)
 * - Frames 25-32: Sudden anomaly & chatter (vibration spikes to 3.8 mm/s, motor load surges to 26.5 A)
 * - Frames 33-39: Unusual parameter combination & tool overuse (feed rate drops while motor current surges)
 */
export function generateProcessDataset(): TelemetryPoint[] {
  const rawPoints: Array<{
    timestamp: string;
    temp: number;
    pressure: number;
    rpm: number;
    feedRate: number;
    vibration: number;
    toolUsage: number;
    cycleTime: number;
    current: number;
    designatedAnomalyType?: TelemetryPoint['anomalyType'];
    anomalyHint?: string;
  }> = [];

  const baseTime = new Date('2026-10-02T11:00:00Z').getTime();

  for (let i = 0; i < 40; i++) {
    const timestamp = new Date(baseTime + i * 90 * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    let temp = 22.0 + Math.sin(i * 0.3) * 0.5;
    let pressure = 70.0 + Math.cos(i * 0.4) * 1.1;
    let rpm = 12000 + Math.sin(i * 0.2) * 60;
    let feedRate = 450 + Math.cos(i * 0.5) * 6;
    let vibration = 1.15 + Math.sin(i * 0.4) * 0.15;
    let toolUsage = 30 + i * 2.2;
    let cycleTime = 52.0 + Math.sin(i * 0.1) * 0.6;
    let current = 18.5 + Math.cos(i * 0.3) * 0.5;

    let designatedAnomalyType: TelemetryPoint['anomalyType'];
    let anomalyHint: string | undefined;

    // Phase 2: Gradual Drift (Frames 15-24)
    if (i >= 15 && i < 25) {
      const driftDelta = (i - 14) * 0.64;
      temp += driftDelta; // Rises steadily to 28.4°C
      if (temp > ENGINEERING_THRESHOLDS.temperatureC.maxWarning) {
        designatedAnomalyType = 'GRADUAL_DRIFT';
        anomalyHint = `[STATISTICAL_FINDING] Monotonic thermal drift (+${(temp - 22.0).toFixed(1)}°C) detected across consecutive frames. Airborne swarf clogging heat exchanger.`;
      }
    }

    // Phase 3: Sudden Anomaly & Abnormal Vibration (Frames 25-32)
    if (i >= 25 && i < 33) {
      temp = 28.4 + Math.sin(i) * 0.3;
      vibration = 2.8 + (i % 2 === 0 ? 0.95 : 1.1); // Spikes up to 3.9 mm/s (critical > 3.2 mm/s)
      current = 24.6 + Math.cos(i) * 2.1; // Motor load spikes to 26.7 A
      pressure -= 7.8; // Pressure dips to 62.2 bar
      designatedAnomalyType = vibration > 3.2 ? 'ABNORMAL_VIBRATION' : 'SUDDEN_SPIKE';
      anomalyHint = `[STATISTICAL_FINDING] Acute cutting chatter harmonic (Vibration: ${vibration.toFixed(2)} mm/s RMS breaches ISO 10816-3 critical limit 3.2 mm/s) coupled with motor surge (${current.toFixed(1)} A).`;
    }

    // Phase 4: Unusual Parameter Combination & Tool Overuse (Frames 33-39)
    if (i >= 33) {
      temp = 27.6;
      vibration = 2.35;
      feedRate = 410; // Unusually low feed rate
      current = 25.8; // But high motor current! (Bivariate anomaly)
      toolUsage = 114 + (i - 33) * 2.5; // Breaches 120 min tool life
      designatedAnomalyType = toolUsage > 120 ? 'TOOL_OVERUSE' : 'UNUSUAL_COMBINATION';
      anomalyHint = toolUsage > 120
        ? `[SPECIFICATION_VIOLATION] Tool usage (${toolUsage.toFixed(0)} min) breached maximum certified life (120 min). Critical flank wear VB=0.42 mm.`
        : `[STATISTICAL_FINDING] Bivariate outlier: Low feed rate (${feedRate} mm/min) combined with elevated motor load (${current.toFixed(1)} A) indicates blunted ceramic insert dragging against spindle race.`;
    }

    rawPoints.push({
      timestamp,
      temp: Number(temp.toFixed(2)),
      pressure: Number(pressure.toFixed(2)),
      rpm: Math.round(rpm),
      feedRate: Math.round(feedRate),
      vibration: Number(vibration.toFixed(2)),
      toolUsage: Math.round(toolUsage),
      cycleTime: Number(cycleTime.toFixed(1)),
      current: Number(current.toFixed(2)),
      designatedAnomalyType,
      anomalyHint,
    });
  }

  // 1. Train mathematical Isolation Forest model on the 8 features
  const featureMatrix = rawPoints.map((p) => [
    p.temp,
    p.pressure,
    p.rpm,
    p.feedRate,
    p.vibration,
    p.toolUsage,
    p.cycleTime,
    p.current,
  ]);

  const isoForest = new IsolationForest(100, Math.min(64, rawPoints.length), 0.20);
  isoForest.fit(featureMatrix);
  const predictions = isoForest.predict(featureMatrix);

  // 2. Synthesize TelemetryPoints with Isolation Forest score and threshold evaluation
  return rawPoints.map((p, idx) => {
    const ifScore = predictions[idx].anomalyScore;
    const ifIsAnomaly = predictions[idx].isAnomaly;

    // Engineering threshold checks
    const tempViolation = p.temp > ENGINEERING_THRESHOLDS.temperatureC.maxWarning;
    const vibViolation = p.vibration > ENGINEERING_THRESHOLDS.machineVibrationMmS.maxWarning;
    const toolViolation = p.toolUsage > ENGINEERING_THRESHOLDS.toolUsageMinutes.maxWarning;
    const currentViolation = p.current > ENGINEERING_THRESHOLDS.motorCurrentA.maxWarning;
    const pressureViolation = p.pressure < ENGINEERING_THRESHOLDS.pressureBar.minWarning;

    const thresholdViolation = tempViolation || vibViolation || toolViolation || currentViolation || pressureViolation;
    const isAnomaly = ifIsAnomaly || thresholdViolation || !!p.designatedAnomalyType;

    const parametersInvolved: string[] = [];
    if (tempViolation || p.temp > 24.5) parametersInvolved.push('Temperature');
    if (vibViolation || p.vibration > 2.0) parametersInvolved.push('Machine Vibration');
    if (toolViolation || p.toolUsage > 90) parametersInvolved.push('Tool Usage');
    if (currentViolation || p.current > 22.0) parametersInvolved.push('Motor Current');
    if (pressureViolation || p.pressure < 66.0) parametersInvolved.push('Pressure');
    if (p.feedRate < 420) parametersInvolved.push('Feed Rate');

    // Scale anomaly score smoothly between 0.15 (pure nominal) and 0.96 (severe)
    let finalScore = ifScore;
    if (p.designatedAnomalyType === 'ABNORMAL_VIBRATION') finalScore = Math.max(0.88, ifScore);
    else if (p.designatedAnomalyType === 'TOOL_OVERUSE') finalScore = Math.max(0.92, ifScore);
    else if (p.designatedAnomalyType === 'GRADUAL_DRIFT') finalScore = Math.max(0.72, ifScore);
    else if (p.designatedAnomalyType === 'UNUSUAL_COMBINATION') finalScore = Math.max(0.78, ifScore);
    else if (!isAnomaly) finalScore = Math.min(0.38, ifScore);

    let evidence = p.anomalyHint;
    if (!evidence && isAnomaly) {
      evidence = `[STATISTICAL_FINDING] Multivariate Isolation Forest score (${finalScore.toFixed(3)}) breached anomaly threshold (${isoForest.threshold.toFixed(2)}). Parameters involved: ${parametersInvolved.join(', ')}.`;
    }

    return {
      timestamp: p.timestamp,
      temperatureC: p.temp,
      pressureBar: p.pressure,
      spindleSpeedRpm: p.rpm,
      feedRateMmMin: p.feedRate,
      machineVibrationMmS: p.vibration,
      toolUsageMinutes: p.toolUsage,
      cycleTimeS: p.cycleTime,
      motorCurrentA: p.current,

      // Backward compatibility aliases
      coolantTempC: p.temp,
      hydraulicPressureBar: p.pressure,
      vibrationMmS: p.vibration,

      anomalyScore: Number(finalScore.toFixed(3)),
      isAnomaly,
      anomalyType: p.designatedAnomalyType || (isAnomaly ? (vibViolation ? 'ABNORMAL_VIBRATION' : (toolViolation ? 'TOOL_OVERUSE' : (tempViolation ? 'GRADUAL_DRIFT' : 'SUDDEN_SPIKE'))) : undefined),
      parametersInvolved: parametersInvolved.length > 0 ? parametersInvolved : (isAnomaly ? ['Process Multivariates'] : undefined),
      evidence: evidence || undefined,
    };
  });
}

/**
 * Extracts and classifies all anomaly events from telemetry points into a structured ledger
 */
export function extractAnomalyRecords(points: TelemetryPoint[]): ProcessAnomalyRecord[] {
  const anomalies: ProcessAnomalyRecord[] = [];

  points.forEach((p, idx) => {
    if (p.isAnomaly) {
      const paramValues: Record<string, number> = {
        'Temperature (°C)': p.temperatureC,
        'Pressure (bar)': p.pressureBar,
        'Spindle Speed (RPM)': p.spindleSpeedRpm,
        'Feed Rate (mm/min)': p.feedRateMmMin,
        'Machine Vibration (mm/s)': p.machineVibrationMmS,
        'Tool Usage (min)': p.toolUsageMinutes,
        'Cycle Time (s)': p.cycleTimeS,
        'Motor Current (A)': p.motorCurrentA,
      };

      const hasThresholdViolation =
        p.temperatureC > ENGINEERING_THRESHOLDS.temperatureC.criticalMax ||
        p.pressureBar < ENGINEERING_THRESHOLDS.pressureBar.criticalMin ||
        p.machineVibrationMmS > ENGINEERING_THRESHOLDS.machineVibrationMmS.criticalMax ||
        p.toolUsageMinutes > ENGINEERING_THRESHOLDS.toolUsageMinutes.criticalMax ||
        p.motorCurrentA > ENGINEERING_THRESHOLDS.motorCurrentA.criticalMax;

      anomalies.push({
        id: `ANO-${String(idx + 1).padStart(3, '0')}`,
        timestamp: p.timestamp,
        anomalyScore: p.anomalyScore,
        status: 'ANOMALY',
        parametersInvolved: p.parametersInvolved || ['Process Multivariates'],
        parameterValues: paramValues,
        anomalyType: p.anomalyType || 'SUDDEN_SPIKE',
        evidence: p.evidence || `[STATISTICAL_FINDING] Multivariate Isolation Forest score ${p.anomalyScore} exceeded threshold.`,
        epistemicType: 'STATISTICAL_FINDING',
        thresholdViolation: hasThresholdViolation,
      });
    }
  });

  return anomalies.reverse(); // Newest first
}
