/**
 * Calculates reorder point for inventory management: the stock level at which a new order should be placed.
 * Formula: Reorder Point = (Avg Daily Demand * Lead Time) + Safety Stock
 * Reuses existing utils (calculateAverageDemand + calculateSafetyStock) to avoid logic duplication.
 * Requires hoisted to top for best practice (avoid re-require on each call).
 * This builds on demand forecast/safety stock without breaking APIs.
 * @param {number[]} historicalDemand - Array of historical daily demand values.
 * @param {number} leadTime - Supplier lead time in days.
 * @param {number} [zScore=1.65] - Optional Z-score for safety stock (e.g., 1.28 for 90%, 2.33 for 99%).
 * @returns {Object} { avgDailyDemand: number, safetyStock: number, reorderPoint: number } - Rounded; 0 for invalid/edge cases.
 * Note: In real systems, reorder point triggers orders to cover demand during lead time + buffer.
 */
// Hoist requires for reuse (clean, efficient; no cycles)
const calculateAverageDemand = require('./calculateAverageDemand');
const calculateSafetyStock = require('./calculateSafetyStock');

function calculateReorderPoint(historicalDemand, leadTime, zScore = 1.65) {
  // Defensive validation for consistency with other utilities (return safe defaults)
  // Reuses downstream funcs' defensiveness too
  if (!Array.isArray(historicalDemand) || historicalDemand.length === 0 ||
      typeof leadTime !== 'number' || leadTime < 0 ||
      typeof zScore !== 'number' || zScore < 0) {
    return { avgDailyDemand: 0, safetyStock: 0, reorderPoint: 0 };
  }

  // Reuse existing logic to avoid duplication:
  // - Avg demand from dedicated util
  const avgDailyDemand = calculateAverageDemand(historicalDemand);
  // - Safety stock (pass avgDailyDemand for its internal optimization/reuse)
  const { safetyStock } = calculateSafetyStock(historicalDemand, leadTime, zScore, avgDailyDemand);

  // Core formula: expected demand during lead time + safety buffer
  // (ensures reorder arrives just as stock hits safety level)
  const reorderPoint = avgDailyDemand * leadTime + safetyStock;

  // Round for consistency/readability with other outputs (e.g., safetyStock)
  return {
    avgDailyDemand: Number(avgDailyDemand.toFixed(2)),
    safetyStock,
    reorderPoint: Number(reorderPoint.toFixed(2))
  };
}

module.exports = calculateReorderPoint;
