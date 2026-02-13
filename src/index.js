/**
 * Inventory Management System
 * A utility library for short-term demand estimation and stockout risk detection.
 */

// Import utility functions
// Note: Each is in separate file to keep main index.js lean/clean per original structure
const calculateAverageDemand = require('./calculateAverageDemand');
const calculateDaysRemaining = require('./calculateDaysRemaining');
const detectStockoutRisk = require('./detectStockoutRisk');
const calculateSafetyStock = require('./calculateSafetyStock');

/**
 * Main function to calculate demand forecast and inventory risk.
 * All inputs are handled defensively for consistency (see utility functions for details):
 * - Invalid data returns safe defaults (e.g., avg=0, days=0, risk='low', safetyStock=0) instead of throwing.
 * Now extended with demand variability (std dev) and safety stock for better risk planning.
 * Safety stock = Z * stdDev * sqrt(leadTime); Z defaults to 1.65 (~95% service level) if not provided.
 * Now also reuses avgDailyDemand in safety stock calc for efficiency (no redundant mean computation).
 * This does NOT break existing output shape or calls (adds fields; optional param renamed to zScore for standard stats term).
 * @param {number[]} historicalDemand - Array of historical daily demand data.
 * @param {number} currentStock - Current stock level.
 * @param {number} leadTime - Supplier lead time in days.
 * @param {number} [zScore=1.65] - Optional Z-score for service level (e.g., 1.28 for 90%, 2.33 for 99%).
 * @returns {Object} Forecast results (backward-compatible extension):
 *   - avgDailyDemand, daysRemaining, riskLevel, recommendation (original fields)
 *   - demandStdDev, safetyStock (new for variability/safety)
 */
function calculateInventoryForecast(historicalDemand, currentStock, leadTime, zScore = 1.65) {
  // Existing calcs (unchanged for backward compat)
  const avgDailyDemand = calculateAverageDemand(historicalDemand);
  const daysRemaining = calculateDaysRemaining(currentStock, avgDailyDemand);
  const riskLevel = detectStockoutRisk(daysRemaining, leadTime);

  // New: Safety stock for demand variability (uses dedicated utility)
  // Pass avgDailyDemand for reuse optimization (and zScore; old param name aliased via default)
  // Standalone calls to calculateSafetyStock still work unchanged (back compat)
  const { demandStdDev, safetyStock } = calculateSafetyStock(historicalDemand, leadTime, zScore, avgDailyDemand);

  return {
    // Original fields preserved exactly (no breaking changes for consumers)
    avgDailyDemand: Number(avgDailyDemand.toFixed(2)), // Round for readability
    daysRemaining: daysRemaining === Infinity ? 'Infinite' : Number(daysRemaining.toFixed(2)),
    riskLevel,
    recommendation: riskLevel === 'high' ? 'Reorder immediately' : 'Monitor stock levels',
    // New fields for extension
    demandStdDev,
    safetyStock
  };
}

// Export all functions and the main calculator
// Individual utilities allow modular use; main func ties them for convenience
module.exports = {
  calculateAverageDemand,
  calculateDaysRemaining,
  detectStockoutRisk,
  calculateSafetyStock,  // New utility for std dev + safety stock
  calculateInventoryForecast
};
