const {
  calculateAverageDemand,
  calculateDaysRemaining,
  detectStockoutRisk,
  calculateInventoryForecast
} = require('../src/index');

describe('Inventory Management System', () => {
  // Sample data as per requirements
  const sampleHistoricalDemand = [10, 12, 15, 9, 11, 13, 10]; // 7 days
  const sampleCurrentStock = 50;
  const sampleLeadTime = 5; // days

  describe('calculateAverageDemand', () => {
    test('calculates simple moving average correctly for sample data', () => {
      const avg = calculateAverageDemand(sampleHistoricalDemand);
      expect(avg).toBe(11.428571428571429); // (10+12+15+9+11+13+10)/7 ≈ 11.43
    });

    test('returns 0 for empty array', () => {
      expect(calculateAverageDemand([])).toBe(0);
    });

    test('returns 0 for invalid input', () => {
      expect(calculateAverageDemand('invalid')).toBe(0);
    });

    test('ignores negative demands', () => {
      expect(calculateAverageDemand([10, -5, 15])).toBe(12.5);
    });

    test('returns 0 when all demands are invalid or negative', () => {
      // Covers the branch for empty validDemands array
      expect(calculateAverageDemand([-1, -2, 'invalid', null])).toBe(0);
    });
  });

  describe('calculateDaysRemaining', () => {
    test('estimates days remaining correctly', () => {
      // Use full precision avg from sample data for accurate test (50 / (80/7) ≈ 4.375)
      // This avoids hardcoded rounding mismatches seen previously
      const avgDemand = calculateAverageDemand(sampleHistoricalDemand);
      const days = calculateDaysRemaining(sampleCurrentStock, avgDemand);
      expect(days).toBeCloseTo(4.375, 3);
    });

    test('returns 0 for zero or negative stock', () => {
      expect(calculateDaysRemaining(0, 10)).toBe(0);
      expect(calculateDaysRemaining(-10, 10)).toBe(0);
    });

    test('returns Infinity for zero demand', () => {
      expect(calculateDaysRemaining(50, 0)).toBe(Infinity);
    });

    // Updated for validation consistency: now returns safe default 0 (defensive style,
    // matching calculateAverageDemand) instead of throwing. This ensures robustness
    // in the main calculateInventoryForecast function.
    test('returns 0 for invalid/non-number inputs', () => {
      expect(calculateDaysRemaining('50', 10)).toBe(0);
      expect(calculateDaysRemaining(50, '10')).toBe(0);
      expect(calculateDaysRemaining(null, undefined)).toBe(0);
    });
  });

  describe('detectStockoutRisk', () => {
    test('detects high risk when daysRemaining < leadTime', () => {
      expect(detectStockoutRisk(3, 5)).toBe('high');
    });

    test('detects medium risk when within 1.5*leadTime', () => {
      expect(detectStockoutRisk(6, 5)).toBe('medium'); // 6 < 7.5
    });

    test('detects low risk otherwise', () => {
      expect(detectStockoutRisk(10, 5)).toBe('low');
    });

    test('low risk for infinite days', () => {
      expect(detectStockoutRisk(Infinity, 5)).toBe('low');
    });

    // Updated for validation consistency: now returns 'low' (safest default) for
    // invalid/non-number/negative inputs (defensive, no throw). This aligns with
    // other utilities and prevents errors in chained calls.
    test('returns low risk (safe default) for invalid inputs', () => {
      expect(detectStockoutRisk(10, -1)).toBe('low');
      expect(detectStockoutRisk('invalid', 5)).toBe('low');
      expect(detectStockoutRisk(NaN, 5)).toBe('low');
      expect(detectStockoutRisk(10, 'invalid')).toBe('low');
      expect(detectStockoutRisk(-5, 5)).toBe('low');  // Negative days also safe default
    });
  });

  describe('calculateInventoryForecast', () => {
    test('computes full forecast for sample data', () => {
      const forecast = calculateInventoryForecast(sampleHistoricalDemand, sampleCurrentStock, sampleLeadTime);
      // Note: avgDailyDemand = 80/7 ≈11.4286 →11.43; daysRemaining=50/11.4286≈4.375→4.38
      expect(forecast.avgDailyDemand).toBe(11.43);
      expect(forecast.daysRemaining).toBe(4.38);
      expect(forecast.riskLevel).toBe('high'); // 4.38 < 5
      expect(forecast.recommendation).toBe('Reorder immediately');
    });

    test('handles zero demand case', () => {
      const forecast = calculateInventoryForecast([0, 0, 0], 50, 5);
      expect(forecast.riskLevel).toBe('low');
      expect(forecast.daysRemaining).toBe('Infinite');
    });

    // New test for validation consistency: main forecast function now gracefully
    // handles invalid inputs via defensive utilities (no throws, safe defaults)
    test('handles invalid inputs defensively in full forecast', () => {
      const forecast = calculateInventoryForecast('invalid', -10, -5);  // Triggers avg=0, days=0, risk=low
      expect(forecast.avgDailyDemand).toBe(0);
      expect(forecast.daysRemaining).toBe(0);  // From updated calculateDaysRemaining
      expect(forecast.riskLevel).toBe('low');  // From updated detectStockoutRisk
      expect(forecast.recommendation).toBe('Monitor stock levels');
    });
  });
});
