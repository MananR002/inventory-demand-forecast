/**
 * Inventory Management System
 * A utility library for short-term demand estimation and stockout risk detection.
 */

// Import utility functions
const calculateAverageDemand = require('./calculateAverageDemand');
const calculateDaysRemaining = require('./calculateDaysRemaining');
const detectStockoutRisk = require('./detectStockoutRisk');

/**
 * Main function to calculate demand forecast and inventory risk.
 * @param {number[]} historicalDemand - Array of historical daily demand data.
 * @param {number} currentStock - Current stock level.
 * @param {number} leadTime - Supplier lead time in days.
 * @returns {Object} Forecast results including avg demand, days remaining, and risk level.
 */
function calculateInventoryForecast(historicalDemand, currentStock, leadTime) {
  const avgDailyDemand = calculateAverageDemand(historicalDemand);
  const daysRemaining = calculateDaysRemaining(currentStock, avgDailyDemand);
  const riskLevel = detectStockoutRisk(daysRemaining, leadTime);

  return {
    avgDailyDemand: Number(avgDailyDemand.toFixed(2)), // Round for readability
    daysRemaining: daysRemaining === Infinity ? 'Infinite' : Number(daysRemaining.toFixed(2)),
    riskLevel,
    recommendation: riskLevel === 'high' ? 'Reorder immediately' : 'Monitor stock levels'
  };
}

// Export all functions and the main calculator
module.exports = {
  calculateAverageDemand,
  calculateDaysRemaining,
  detectStockoutRisk,
  calculateInventoryForecast
};
