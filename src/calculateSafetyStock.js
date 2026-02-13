/**
 * Calculates demand variability (std dev) and safety stock for inventory risk management.
 * Std Dev uses sample standard deviation (suitable for demand forecasting from historical data).
 * Safety stock = Z * DemandStdDev * sqrt(LeadTime), where Z is service level factor (default 1.65 for ~95% service).
 * This extends short-term estimation without breaking existing APIs.
 * @param {number[]} historicalDemand - Array of historical daily demand values.
 * @param {number} leadTime - Supplier lead time in days.
 * @param {number} [serviceLevelZ=1.65] - Optional Z-score for service level (e.g., 1.28 for 90%, 2.33 for 99%).
 * @returns {Object} { demandStdDev: number, safetyStock: number } - Rounded for readability; 0 for invalid/edge cases.
 */
function calculateSafetyStock(historicalDemand, leadTime, serviceLevelZ = 1.65) {
  // Defensive validation for consistency with other utilities (return safe defaults)
  if (!Array.isArray(historicalDemand) || historicalDemand.length === 0 ||
      typeof leadTime !== 'number' || leadTime < 0 ||
      typeof serviceLevelZ !== 'number' || serviceLevelZ < 0) {
    return { demandStdDev: 0, safetyStock: 0 };
  }

  // Reuse avg calc? But for std dev, compute mean inline (or could import, but keep utility self-contained)
  const validDemands = historicalDemand.filter(d => typeof d === 'number' && d >= 0);
  const n = validDemands.length;
  if (n === 0) {
    return { demandStdDev: 0, safetyStock: 0 };
  }

  // Step 1: Mean (aligns with calculateAverageDemand)
  const mean = validDemands.reduce((acc, d) => acc + d, 0) / n;

  // Step 2: Sample variance (divide by n-1 for n>1; common for demand variability)
  // For n=1, stdDev=0 (no variability)
  let variance = 0;
  if (n > 1) {
    const sumSquaredDiffs = validDemands.reduce((acc, d) => acc + Math.pow(d - mean, 2), 0);
    variance = sumSquaredDiffs / (n - 1);
  }
  const demandStdDev = Math.sqrt(variance);

  // Step 3: Safety stock formula
  // sqrt(leadTime) accounts for variability over lead time period
  const safetyStock = serviceLevelZ * demandStdDev * Math.sqrt(leadTime);

  // Round for consistency/readability with other outputs (e.g., avgDailyDemand)
  return {
    demandStdDev: Number(demandStdDev.toFixed(2)),
    safetyStock: Number(safetyStock.toFixed(2))
  };
}

module.exports = calculateSafetyStock;
