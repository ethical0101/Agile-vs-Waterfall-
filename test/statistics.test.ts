import { describe, it, expect } from 'vitest';
import { calculateSummaryStats, performTTest, formatCurrency } from '../src/utils/statistics';

describe('calculateSummaryStats', () => {
  it('returns zeros for empty array', () => {
    const res = calculateSummaryStats([]);
    expect(res.count).toBe(0);
    expect(res.mean).toBe(0);
  });

  it('calculates mean, median, sd correctly', () => {
    const values = [10, 20, 30, 40, 50];
    const res = calculateSummaryStats(values);
    expect(res.count).toBe(5);
    expect(res.mean).toBeCloseTo(30);
    expect(res.median).toBe(30);
    expect(res.min).toBe(10);
    expect(res.max).toBe(50);
  });
});

describe('performTTest', () => {
  it('returns interpretation and numeric fields', () => {
    const g1 = [100, 110, 90, 95, 105];
    const g2 = [150, 140, 160, 155, 145];
    const res = performTTest(g1, g2);
    expect(res.meanDifference).toBeLessThan(0);
    expect(typeof res.pValue).toBe('number');
    expect(res.confidenceInterval.length).toBe(2);
    expect(res.interpretation).toMatch(/difference/);
  });
});

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(123456)).toBe('$123,456');
  });
});
