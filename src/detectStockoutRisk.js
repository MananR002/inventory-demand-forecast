/**
 * Detects stockout risk based on days remaining and supplier lead time.
 * @param {number} daysRemaining - Estimated days before stock runs out.
 * @param {number} leadTime - Supplier lead time in days.
 * @returns {string} Risk level: 'high' if daysRemaining < leadTime, 'medium' if within 1.5*leadTime, else 'low'.
 */
function detectStockoutRisk(daysRemaining, leadTime) {
  if (typeof daysRemaining !== 'number' || typeof leadTime !== 'number' || leadTime < 0) {
    throw new Error('Invalid inputs: daysRemaining and leadTime must be valid numbers, leadTime >=0');
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
