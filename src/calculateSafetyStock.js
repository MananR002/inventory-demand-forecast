/**
 * Calculates demand variability (std dev) and safety stock for inventory risk management.
 * Std Dev uses sample standard deviation (suitable for demand forecasting from historical data).
 * Safety stock = Z * DemandStdDev * sqrt(LeadTime), where Z is service level factor (default 1.65 for ~95% service).
 * Optimized to reuse pre-computed avg demand (from calculateAverageDemand) when provided, avoiding redundant mean calc.
 * This extends short-term estimation without breaking existing APIs/standalone use.
 * @param {number[]} historicalDemand - Array of historical daily demand values.
 * @param {number} leadTime - Supplier lead time in days.
 * @param {number} [zScore=1.65] - Optional Z-score for service level (e.g., 1.28 for 90%, 2.33 for 99%).
 * @param {number} [avgDemand] - Optional pre-computed avg daily demand (for reuse/optimization; computed internally if omitted/invalid).
 * @returns {Object} { demandStdDev: number, safetyStock: number } - Rounded for readability; 0 for invalid/edge cases.
 */
function calculateSafetyStock(historicalDemand, leadTime, zScore = 1.65, avgDemand) {
  // Defensive validation for consistency with other utilities (return safe defaults)
  if (!Array.isArray(historicalDemand) || historicalDemand.length === 0 ||
      typeof leadTime !== 'number' || leadTime < 0 ||
      // Note: zScore (renamed from serviceLevelZ) checked below; avgDemand optional so no strict check
      typeof zScore !== 'number' || zScore < 0) {
    return { demandStdDev: 0, safetyStock: 0 };
  }

  // Filter valid demands once (defensive, aligns with calculateAverageDemand)
  const validDemands = historicalDemand.filter(d => typeof d === 'number' && d >= 0);
  const n = validDemands.length;
  if (n === 0) {
    return { demandStdDev: 0, safetyStock: 0 };
  }

  // Step 1: Mean - reuse avgDemand if provided and valid (optimization for chained calls like forecast);
  // otherwise compute internally (ensures standalone utility works without breaking changes)
  let mean;
  if (typeof avgDemand === 'number' && avgDemand >= 0) {
    mean = avgDemand;  // Reuse from calculateAverageDemand (avoids redundant sum/reduce)
  } else {
    mean = validDemands.reduce((acc, d) => acc + d, 0) / n;
  }

  // Step 2: Sample variance (divide by n-1 for n>1; common for demand variability)
  // For n=1, stdDev=0 (no variability)
  // Note: Variance accumulates linearly over time, while std deviation scales with sqrt(time)
  // (this is why safety stock uses * sqrt(LeadTime) to model uncertainty during lead time)
  let variance = 0;
  if (n > 1) {
    const sumSquaredDiffs = validDemands.reduce((acc, d) => acc + Math.pow(d - mean, 2), 0);
    variance = sumSquaredDiffs / (n - 1);
  }
  const demandStdDev = Math.sqrt(variance);

  // Step 3: Safety stock formula
  // sqrt(leadTime) accounts for variability over lead time period
  // (uses renamed zScore param for standard statistical naming)
  const safetyStock = zScore * demandStdDev * Math.sqrt(leadTime);

  // Round for consistency/readability with other outputs (e.g., avgDailyDemand)
  return {
    demandStdDev: Number(demandStdDev.toFixed(2)),
    safetyStock: Number(safetyStock.toFixed(2))
  };
}

module.exports = calculateSafetyStock;
