/**
 * Calculates Economic Order Quantity (EOQ) for optimal order size decisions.
 * Standard formula: EOQ = sqrt( (2 * D * S) / H ), where:
 *   - D = annual demand (derived as avgDailyDemand * daysPerYear; now defaults to 250 business days for realism)
 *   - S = order/setup cost per order
 *   - H = holding cost per unit per year
 * Reuses calculateAverageDemand internally to avoid dup and align with forecast.
 * Use this for "how much to order" alongside reorder point/"when to order".
 * @param {number[]} historicalDemand - Array of historical daily demand values (for avg).
 * @param {number} [orderCost=100] - Cost per order (S; default placeholder).
 * @param {number} [holdingCost=10] - Holding cost per unit/year (H; default placeholder).
 * @param {number} [daysPerYear=250] - Days to annualize demand (250 business/working days typical; excludes weekends/holidays for better model accuracy).
 * @returns {Object} { annualDemand: number, eoq: number } - Rounded; 0 for invalid/edge cases.
 * Defensive for consistency; EOQ minimizes total inventory costs.
 */
// Hoist require for reuse (clean/efficient like calculateReorderPoint; no cycles)
const calculateAverageDemand = require('./calculateAverageDemand');

function calculateEOQ(historicalDemand, orderCost = 100, holdingCost = 10, daysPerYear = 250) {
  // Defensive validation for consistency with other utilities (return safe defaults)
  // (EOQ invalid if costs <=0 or bad demand data)
  if (!Array.isArray(historicalDemand) || historicalDemand.length === 0 ||
      typeof orderCost !== 'number' || orderCost <= 0 ||
      typeof holdingCost !== 'number' || holdingCost <= 0 ||
      typeof daysPerYear !== 'number' || daysPerYear <= 0) {
    return { annualDemand: 0, eoq: 0 };
  }

  // Reuse avg daily demand util (aligns with forecast/safety/reorder; avoids dup calc)
  const avgDailyDemand = calculateAverageDemand(historicalDemand);

  // If avg=0, EOQ=0 (no demand)
  if (avgDailyDemand === 0) {
    return { annualDemand: 0, eoq: 0 };
  }

  // Derive annual demand D = avgDaily * daysPerYear
  // Default 250 business days improves realism (excludes weekends/holidays vs 365)
  const annualDemand = avgDailyDemand * daysPerYear;

  // EOQ formula: sqrt(2DS/H) - optimal order qty to balance ordering/holding costs
  // (square root ensures math stability; common simplification for daily data)
  const eoq = Math.sqrt((2 * annualDemand * orderCost) / holdingCost);

  // Round for consistency/readability with other outputs (e.g., safetyStock, reorderPoint)
  return {
    annualDemand: Number(annualDemand.toFixed(2)),
    eoq: Number(eoq.toFixed(2))
  };
}

module.exports = calculateEOQ;
