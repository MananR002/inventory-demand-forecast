/**
 * Inventory Management System
 * A utility library for short-term demand estimation and stockout risk detection.
 */

// Import utility functions
// Note: Each is in separate file to keep main index.js lean/clean per original structure
// ReorderPoint/EOQ reuse avg/safety (avoids dup logic; modular)
const calculateAverageDemand = require('./calculateAverageDemand');
const calculateDaysRemaining = require('./calculateDaysRemaining');
const detectStockoutRisk = require('./detectStockoutRisk');
const calculateSafetyStock = require('./calculateSafetyStock');
const calculateReorderPoint = require('./calculateReorderPoint');
const calculateEOQ = require('./calculateEOQ');

/**
 * Main function to calculate demand forecast and inventory risk.
 * All inputs are handled defensively for consistency (see utility functions for details):
 * - Invalid data returns safe defaults (e.g., avg=0, days=0, risk='low', safetyStock=0) instead of throwing.
 * Now extended with demand variability (std dev), safety stock, reorder point, and EOQ for full decisions.
 * Safety stock = Z * stdDev * sqrt(leadTime); Reorder Point = (avgDailyDemand * leadTime) + safetyStock.
 * EOQ = sqrt(2 * annualDemand * orderCost / holdingCost) (annual from avgDaily*365).
 * Z/zScore defaults to 1.65 (~95% service level) if not provided.
 * Now also reuses avgDailyDemand in safety stock calc for efficiency (no redundant mean computation).
 * This does NOT break existing output shape or calls (adds fields; optional param renamed to zScore for standard stats term).
 * @param {number[]} historicalDemand - Array of historical daily demand data.
 * @param {number} currentStock - Current stock level.
 * @param {number} leadTime - Supplier lead time in days.
 * @param {number} [zScore=1.65] - Optional Z-score for service level (e.g., 1.28 for 90%, 2.33 for 99%).
 * @param {number} [orderCost=100] - Optional order/setup cost per order (S for EOQ).
 * @param {number} [holdingCost=10] - Optional holding cost per unit/year (H for EOQ).
 * @returns {Object} Forecast results (backward-compatible extension):
 *   - avgDailyDemand, daysRemaining, riskLevel, recommendation (original fields)
 *   - demandStdDev, safetyStock, reorderPoint, eoq (new; EOQ reuses avg logic)
 */
function calculateInventoryForecast(historicalDemand, currentStock, leadTime, zScore = 1.65, orderCost = 100, holdingCost = 10) {
  // Existing calcs (unchanged for backward compat)
  const avgDailyDemand = calculateAverageDemand(historicalDemand);
  const daysRemaining = calculateDaysRemaining(currentStock, avgDailyDemand);
  const riskLevel = detectStockoutRisk(daysRemaining, leadTime);

  // Safety stock for demand variability (uses dedicated utility)
  // Pass avgDailyDemand for reuse optimization (and zScore; old param name aliased via default)
  // Standalone calls to calculateSafetyStock still work unchanged (back compat)
  const { demandStdDev, safetyStock } = calculateSafetyStock(historicalDemand, leadTime, zScore, avgDailyDemand);

  // Reorder point: leverages existing forecast/safety outputs (dedicated util reuses avg + safety
  // to avoid dup logic; e.g., expected demand during lead time + buffer)
  // This is what teams monitor in real inventory systems to trigger orders
  const { reorderPoint } = calculateReorderPoint(historicalDemand, leadTime, zScore);

  // EOQ: optimal order quantity using dedicated util (reuses avgDailyDemand internally
  // for annual demand derivation; avoids dup; balances order/holding costs)
  // EOQ helps answer "how much to order" alongside "when" (reorderPoint)
  const { eoq } = calculateEOQ(historicalDemand, orderCost, holdingCost);

  return {
    // Original fields preserved exactly (no breaking changes for consumers)
    avgDailyDemand: Number(avgDailyDemand.toFixed(2)), // Round for readability
    daysRemaining: daysRemaining === Infinity ? 'Infinite' : Number(daysRemaining.toFixed(2)),
    riskLevel,
    recommendation: riskLevel === 'high' ? 'Reorder immediately' : 'Monitor stock levels',
    // New fields for extension (EOQ added last)
    demandStdDev,
    safetyStock,
    reorderPoint,
    eoq
  };
}

// Export all functions and the main calculator
// Individual utilities allow modular use; main func ties them for convenience
module.exports = {
  calculateAverageDemand,
  calculateDaysRemaining,
  detectStockoutRisk,
  calculateSafetyStock,  // For std dev + safety stock
  calculateReorderPoint, // Reorder point reusing existing logic
  calculateEOQ,          // New: EOQ for order quantity (reuses avg)
  calculateInventoryForecast
};
