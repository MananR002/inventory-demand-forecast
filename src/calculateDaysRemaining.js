/**
 * Estimates how many days of inventory remain before stock runs out,
 * assuming demand continues at the average daily rate.
 * @param {number} currentStock - Current stock level.
 * @param {number} avgDailyDemand - Average daily demand.
 * @returns {number} Estimated days remaining. Returns 0 for invalid inputs (<=0 stock, non-numbers) or Infinity if demand is 0.
 * This defensive approach ensures consistency with calculateAverageDemand for robust utility usage.
 */
function calculateDaysRemaining(currentStock, avgDailyDemand) {
  // Defensive validation for consistency: return 0 for any invalid/non-numeric inputs
  // (matches calculateAverageDemand's style for real-world data handling)
  if (typeof currentStock !== 'number' || typeof avgDailyDemand !== 'number') {
    return 0;
  }
  if (currentStock <= 0) {
    return 0;
  }
  if (avgDailyDemand <= 0) {
    return Infinity; // Stock will never run out if no demand
  }
  return currentStock / avgDailyDemand;
}

module.exports = calculateDaysRemaining;
