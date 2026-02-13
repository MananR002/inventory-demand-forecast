/**
 * Estimates how many days of inventory remain before stock runs out,
 * assuming demand continues at the average daily rate.
 * @param {number} currentStock - Current stock level.
 * @param {number} avgDailyDemand - Average daily demand.
 * @returns {number} Estimated days remaining. Returns Infinity if demand is 0, 0 if stock <=0.
 */
function calculateDaysRemaining(currentStock, avgDailyDemand) {
  if (typeof currentStock !== 'number' || typeof avgDailyDemand !== 'number') {
    throw new Error('Both currentStock and avgDailyDemand must be numbers');
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
