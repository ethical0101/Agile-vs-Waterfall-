import { StatisticalSummary, ComparisonResult } from '../types';

export const calculateSummaryStats = (values: number[]): StatisticalSummary => {
  if (values.length === 0) {
    return {
      mean: 0,
      median: 0,
      standardDeviation: 0,
      count: 0,
      min: 0,
      max: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;

  const median = count % 2 === 0
    ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
    : sorted[Math.floor(count / 2)];

  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
  const standardDeviation = Math.sqrt(variance);

  return {
    mean,
    median,
    standardDeviation,
    count,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
};

export const performTTest = (group1: number[], group2: number[]): ComparisonResult => {
  const stats1 = calculateSummaryStats(group1);
  const stats2 = calculateSummaryStats(group2);

  if (stats1.count === 0 || stats2.count === 0) {
    return {
      meanDifference: 0,
      pValue: 1,
      effectSize: 0,
      confidenceInterval: [0, 0],
      interpretation: 'Insufficient data for comparison',
    };
  }

  const meanDifference = stats1.mean - stats2.mean;

  // Welch's t-test (unequal variances)
  const pooledSE = Math.sqrt(
    (stats1.standardDeviation ** 2) / stats1.count +
    (stats2.standardDeviation ** 2) / stats2.count
  );

  const tStatistic = meanDifference / pooledSE;

  // Degrees of freedom for Welch's t-test
  const df = Math.pow(
    (stats1.standardDeviation ** 2) / stats1.count +
    (stats2.standardDeviation ** 2) / stats2.count,
    2
  ) / (
    Math.pow((stats1.standardDeviation ** 2) / stats1.count, 2) / (stats1.count - 1) +
    Math.pow((stats2.standardDeviation ** 2) / stats2.count, 2) / (stats2.count - 1)
  );

  // Simplified p-value calculation (approximation)
  const pValue = 2 * (1 - normalCDF(Math.abs(tStatistic)));

  // Cohen's d effect size
  const pooledSD = Math.sqrt(
    ((stats1.count - 1) * stats1.standardDeviation ** 2 +
     (stats2.count - 1) * stats2.standardDeviation ** 2) /
    (stats1.count + stats2.count - 2)
  );
  const effectSize = meanDifference / pooledSD;

  // 95% confidence interval
  const tCritical = 1.96; // approximation for large samples
  const marginOfError = tCritical * pooledSE;
  const confidenceInterval: [number, number] = [
    meanDifference - marginOfError,
    meanDifference + marginOfError,
  ];

  let interpretation = '';
  if (pValue < 0.001) {
    interpretation = 'Highly significant difference (p < 0.001)';
  } else if (pValue < 0.01) {
    interpretation = 'Very significant difference (p < 0.01)';
  } else if (pValue < 0.05) {
    interpretation = 'Significant difference (p < 0.05)';
  } else {
    interpretation = 'No significant difference (p ≥ 0.05)';
  }

  const effectMagnitude = Math.abs(effectSize);
  if (effectMagnitude < 0.2) {
    interpretation += ' with negligible effect size';
  } else if (effectMagnitude < 0.5) {
    interpretation += ' with small effect size';
  } else if (effectMagnitude < 0.8) {
    interpretation += ' with medium effect size';
  } else {
    interpretation += ' with large effect size';
  }

  return {
    meanDifference,
    pValue,
    effectSize,
    confidenceInterval,
    interpretation,
  };
};

// Approximation of normal CDF
const normalCDF = (x: number): number => {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
};

// Error function approximation
const erf = (x: number): number => {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};