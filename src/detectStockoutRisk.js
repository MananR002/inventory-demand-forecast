/**
 * Detects stockout risk based on days remaining and supplier lead time.
 * @param {number} daysRemaining - Estimated days before stock runs out.
 * @param {number} leadTime - Supplier lead time in days.
 * @returns {string} Risk level: 'high' if daysRemaining < leadTime, 'medium' if within 1.5*leadTime, else 'low'.
 * Returns 'low' (safest default) for any invalid inputs to ensure consistency with other utilities' defensive validation.
 */
function detectStockoutRisk(daysRemaining, leadTime) {
  // Defensive validation for consistency: return 'low' (no risk/safe default) for invalid/non-numeric inputs
  // (e.g., NaN, non-numbers, negative leadTime). This prevents errors in chained calls like calculateInventoryForecast
  // and aligns with calculateAverageDemand / calculateDaysRemaining returning safe defaults for real-world data.
  if (typeof daysRemaining !== 'number' || typeof leadTime !== 'number' || leadTime < 0 || daysRemaining < 0) {
    return 'low';
  }
  if (daysRemaining === Infinity) {
    return 'low'; // No stockout risk if no demand
  }
  if (daysRemaining < leadTime) {
    return 'high'; // Imminent stockout risk
  } else if (daysRemaining < leadTime * 1.5) {
    return 'medium';
  }
  return 'low';
}

module.exports = detectStockoutRisk;
