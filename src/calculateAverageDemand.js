/**
 * Calculates the average daily demand using a simple moving average approach.
 * @param {number[]} historicalDemand - Array of historical daily demand values.
 * @returns {number} The average daily demand. Returns 0 if array is empty or invalid.
 */
function calculateAverageDemand(historicalDemand) {
  if (!Array.isArray(historicalDemand) || historicalDemand.length === 0) {
    return 0;
  }

  // Filter out non-positive numbers and ensure valid data
  const validDemands = historicalDemand.filter(d => typeof d === 'number' && d >= 0);
  if (validDemands.length === 0) {
    return 0;
  }

  const sum = validDemands.reduce((acc, demand) => acc + demand, 0);
  return sum / validDemands.length;
}

module.exports = calculateAverageDemand;
