const {
  calculateAverageDemand,
  calculateDaysRemaining,
  detectStockoutRisk,
  calculateSafetyStock,  // New utility for demand std dev + safety stock
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

  /**
   * New tests for safety stock extension (demand variability + formula).
   * Ensures folder structure (separate utility) and backward compat.
   * Uses top-level sample data for DRY.
   */
  describe('calculateSafetyStock', () => {
    // Sample data for std dev / safety tests (aligns with other sample data)
    // mean ≈11.43, sample stdDev ≈2.07 (var=25.81/6≈4.30)
    // sampleLeadTime from top-level scope


    test('computes demand std dev and safety stock with default Z=1.65', () => {
      // demandStdDev uses sample std dev (precise calc: ~2.0744 →2.07)
      // safetyStock = 1.65 * ~2.0744 * sqrt(5) ≈7.635 →7.64 (JS toFixed rounding)
      const result = calculateSafetyStock(sampleHistoricalDemand, sampleLeadTime);
      expect(result.demandStdDev).toBe(2.07);
      expect(result.safetyStock).toBeCloseTo(7.64, 2);  // Flexible for float rounding
    });

    test('uses custom serviceLevelZ (e.g., for different service levels)', () => {
      // ~99% Z; expect close for safetyStock rounding
      const result = calculateSafetyStock(sampleHistoricalDemand, sampleLeadTime, 2.33);  // ~99% Z
      expect(result.demandStdDev).toBe(2.07);
      expect(result.safetyStock).toBeCloseTo(10.79, 2);
    });

    test('returns zeros for invalid/empty/negative inputs (defensive consistency)', () => {
      // [] hits outer array check
      expect(calculateSafetyStock([], 5)).toEqual({ demandStdDev: 0, safetyStock: 0 });
      // Non-empty but all invalid hits inner n===0 (covers uncovered branch)
      expect(calculateSafetyStock([-1, 'bad', null], 5)).toEqual({ demandStdDev: 0, safetyStock: 0 });
      expect(calculateSafetyStock('invalid', 5)).toEqual({ demandStdDev: 0, safetyStock: 0 });
      expect(calculateSafetyStock(sampleHistoricalDemand, -1)).toEqual({ demandStdDev: 0, safetyStock: 0 });
      expect(calculateSafetyStock(sampleHistoricalDemand, 5, -1)).toEqual({ demandStdDev: 0, safetyStock: 0 });
    });

    test('handles single data point (stdDev=0, no variability)', () => {
      expect(calculateSafetyStock([10], 5)).toEqual({ demandStdDev: 0, safetyStock: 0 });
    });
  });

  describe('calculateInventoryForecast', () => {
    test('computes full forecast for sample data', () => {
      // Backward compat test: call with original 3 args (uses default Z=1.65)
      // Original fields unchanged; new fields added for safety stock extension
      const forecast = calculateInventoryForecast(sampleHistoricalDemand, sampleCurrentStock, sampleLeadTime);
      // Note: avgDailyDemand = 80/7 ≈11.4286 →11.43; daysRemaining=50/11.4286≈4.375→4.38
      expect(forecast.avgDailyDemand).toBe(11.43);
      expect(forecast.daysRemaining).toBe(4.38);
      expect(forecast.riskLevel).toBe('high'); // 4.38 < 5
      expect(forecast.recommendation).toBe('Reorder immediately');
      // New fields (do not break shape)
      expect(forecast.demandStdDev).toBe(2.07);  // From safety stock utility
      expect(forecast.safetyStock).toBeCloseTo(7.64, 2);   // Default Z=1.65 (JS rounding)
    });

    // New test: forecast with custom Z (still backward compat for old calls)
    test('computes forecast with custom serviceLevelZ', () => {
      const forecast = calculateInventoryForecast(sampleHistoricalDemand, sampleCurrentStock, sampleLeadTime, 2.33);
      expect(forecast.demandStdDev).toBe(2.07);
      expect(forecast.safetyStock).toBeCloseTo(10.79, 2);  // Custom Z (JS rounding)
      // Original fields unchanged
      expect(forecast.riskLevel).toBe('high');
    });

    test('handles zero demand case', () => {
      const forecast = calculateInventoryForecast([0, 0, 0], 50, 5);
      expect(forecast.riskLevel).toBe('low');
      expect(forecast.daysRemaining).toBe('Infinite');
    });

    // Updated for safety stock extension: main forecast now includes new fields
    // but gracefully handles invalid inputs defensively (no throws, safe defaults)
    // Original shape/behavior preserved for consumers
    test('handles invalid inputs defensively in full forecast', () => {
      const forecast = calculateInventoryForecast('invalid', -10, -5);  // Triggers avg=0, days=0, risk=low, safety=0
      expect(forecast.avgDailyDemand).toBe(0);
      expect(forecast.daysRemaining).toBe(0);  // From calculateDaysRemaining
      expect(forecast.riskLevel).toBe('low');  // From detectStockoutRisk
      expect(forecast.recommendation).toBe('Monitor stock levels');
      // New fields default safely
      expect(forecast.demandStdDev).toBe(0);
      expect(forecast.safetyStock).toBe(0);
    });
  });
});
