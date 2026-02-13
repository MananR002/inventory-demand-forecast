/**
 * Insights Generator Layer: produces human-readable summary and signals for inventory decisions.
 * This final layer synthesizes outputs from demand/risk/cost layers into actionable insights.
 * status, summary, demandSignal, variabilitySignal, bufferSignal, reorderSignal, costSignal, recommendation.
 * Placed in separate insights/ folder for layered architecture.
 * Reuses forecast data (no dup logic); backward-compatible.
 * @param {Object} forecastData - Output from calculateInventoryForecast (or similar).
 * @returns {Object} insights - Human-readable { status, summary, signals..., recommendation }.
 * Defensive for robustness.
 */
function generateInsights(forecastData) {
  // Defensive: if invalid forecast, return safe defaults
  if (!forecastData || typeof forecastData !== 'object' || !forecastData.avgDailyDemand) {
    return {
      status: 'unknown',
      summary: 'Insufficient data for insights.',
      demandSignal: 'Demand data unavailable.',
      variabilitySignal: 'Variability unknown.',
      bufferSignal: 'No buffer info.',
      reorderSignal: 'Reorder status unknown.',
      costSignal: 'Cost optimization unknown.',
      recommendation: 'Gather more data.'
    };
  }

  const {
    avgDailyDemand,
    demandStdDev,
    safetyStock,
    reorderPoint,
    eoq,
    riskLevel,
    daysRemaining
  } = forecastData;

  // Derive signals (human-readable, realistic)
  // demandSignal: e.g., "Demand stable around 11.43 units per day"
  const demandSignal = `Demand stable around ${avgDailyDemand} units per day.`;

  // variabilitySignal: based on stdDev (e.g., low/med/high var)
  let variabilitySignal = 'Low variability (stable demand).';
  if (demandStdDev > 3) {
    variabilitySignal = 'High variability - monitor closely for stockouts.';
  } else if (demandStdDev > 1) {
    variabilitySignal = 'Moderate variability (plan buffer).';
  }  // Full branch cov via tests (low/med/high var cases)

  // bufferSignal: safety protects X days (safety / avg)
  const bufferDays = avgDailyDemand > 0 ? (safetyStock / avgDailyDemand).toFixed(1) : 0;
  const bufferSignal = `Safety stock protects ${bufferDays} days of demand.`;

  // reorderSignal: e.g., "Reorder triggered at 64.78 units"
  const reorderSignal = `Reorder triggered at ${reorderPoint} units.`;

  // costSignal: EOQ efficiency
  const costSignal = `EOQ of ${eoq} units optimizes ordering/holding costs.`;

  // status + summary based on risk
  let status = 'stable';
  let summary = 'Inventory levels are healthy.';
  let recommendation = 'Monitor stock levels.';
  if (riskLevel === 'high') {  // Uses string (compat); enum optional
    status = 'critical';
    summary = 'High stockout risk - act now to avoid shortages.';
    recommendation = 'Reorder immediately and review suppliers.';
  } else if (riskLevel === 'medium') {
    status = 'caution';
    summary = 'Moderate risk - proactive monitoring advised.';
    recommendation = 'Plan reorder soon.';
  }

  return {
    status,
    summary,
    demandSignal,
    variabilitySignal,
    bufferSignal,
    reorderSignal,
    costSignal,
    recommendation
  };
}

module.exports = generateInsights;
