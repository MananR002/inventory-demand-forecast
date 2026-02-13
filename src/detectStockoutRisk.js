/**
 * Detects stockout risk based on days remaining and supplier lead time.
 * Uses RISK_LEVELS enum for improved code structure/readability (prevents magic strings).
 * @param {number} daysRemaining - Estimated days before stock runs out.
 * @param {number} leadTime - Supplier lead time in days.
 * @returns {string} Risk level from RISK_LEVELS: HIGH if daysRemaining < leadTime, MEDIUM if within 1.5*leadTime, else LOW.
 * Returns LOW (safest default) for any invalid inputs to ensure consistency with other utilities' defensive validation.
 */

// Enum-like const for risk levels (JS best practice; improves structure, type safety in code)
const RISK_LEVELS = {
  LOW: 'low',     // No/safe risk
  MEDIUM: 'medium', // Moderate risk (monitor)
  HIGH: 'high'    // Imminent stockout risk (reorder now)
};

function detectStockoutRisk(daysRemaining, leadTime) {
  // Defensive validation for consistency: return RISK_LEVELS.LOW (no risk/safe default) for invalid/non-numeric inputs
  // (e.g., NaN, non-numbers, negative leadTime). This prevents errors in chained calls like calculateInventoryForecast
  // and aligns with calculateAverageDemand / calculateDaysRemaining returning safe defaults for real-world data.
  if (typeof daysRemaining !== 'number' || typeof leadTime !== 'number' || leadTime < 0 || daysRemaining < 0) {
    return RISK_LEVELS.LOW;
  }
  if (daysRemaining === Infinity) {
    return RISK_LEVELS.LOW; // No stockout risk if no demand
  }
  if (daysRemaining < leadTime) {
    return RISK_LEVELS.HIGH; // Imminent stockout risk
  } else if (daysRemaining < leadTime * 1.5) {
    return RISK_LEVELS.MEDIUM;
  }
  return RISK_LEVELS.LOW;
}

// Export func + enum for use elsewhere (e.g., tests/comparisons)
module.exports = { detectStockoutRisk, RISK_LEVELS };
