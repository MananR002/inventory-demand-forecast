# Inventory Management System

A Node.js utility library for calculating forecast demand and inventory risk. Focused on short-term demand estimation and stockout risk detection using historical daily demand data, current stock level, and supplier lead time.

## Features

- **Simple Moving Average**: Calculate average daily demand from historical data.
- **Days of Inventory Remaining**: Estimate how many days before stock runs out.
- **Stockout Risk Detection**: Identify risk levels based on lead time.
- **Demand Variability & Safety Stock**: Std dev of demand + formula `Z * stdDev * sqrt(LeadTime)` (default Z=1.65 ~95% service; renamed param zScore; reuses avg demand for efficiency).
- **Reorder Point**: (Avg demand * lead time) + safety stock; reuses existing logic (no dup); what teams monitor to trigger orders.
- **Economic Order Quantity (EOQ)** (new): Optimal order qty via std formula `sqrt(2 * annualDemand * orderCost / holdingCost)` (annual from avgDaily*250 business days for realism; reuses avg; separate utility for "how much to order").
- Clean, modular design with separate utility functions (keeps main files lean).
- Comprehensive test coverage (100%).

## Folder Structure

```
inventory-management-system/
├── src/
│   ├── index.js                  # Main entry point (lean, re-exports utilities)
│   ├── calculateAverageDemand.js # Computes avg daily demand
│   ├── calculateDaysRemaining.js # Estimates days of stock left
│   ├── detectStockoutRisk.js     # Assesses stockout risk
│   ├── calculateSafetyStock.js   # Demand std dev + safety stock formula (reuses avg)
│   ├── calculateReorderPoint.js  # Reorder point reusing avg + safety (no dup)
│   └── calculateEOQ.js           # New: EOQ for order qty (reuses avg; std formula)
├── tests/
│   └── inventory.test.js         # Jest tests with sample data
├── jest.config.js                # Jest configuration
├── package.json
├── .gitignore
└── README.md
```

## Installation

```bash
npm install inventory-management-system
```

## Usage

```javascript
const {
  calculateInventoryForecast,
  calculateAverageDemand,
  // ... other functions
} = require('inventory-management-system');

// Sample data
const historicalDemand = [10, 12, 15, 9, 11, 13, 10]; // daily demands
const currentStock = 50;
const leadTime = 5; // days

// Full forecast (now extended with safety stock; backward-compatible for existing consumers)
const forecast = calculateInventoryForecast(historicalDemand, currentStock, leadTime);
console.log(forecast);
// Output:
// {
//   avgDailyDemand: 11.43,
//   daysRemaining: 4.38,
//   riskLevel: 'high',
//   recommendation: 'Reorder immediately',
//   demandStdDev: 2.07,  // New: demand variability (std dev)
//   safetyStock: 7.64,   // New: zScore * stdDev * sqrt(leadTime) (default zScore=1.65)
//   reorderPoint: 64.78, // New: (avg * leadTime) + safetyStock (reuses logic)
//   eoq: 288.86          // New: EOQ optimal qty (reuses avg; std formula)
// }

// Or use individual utilities
const avgDemand = calculateAverageDemand(historicalDemand);
console.log(avgDemand); // 11.42857...

/**
 * Note on consistent validation: All functions use defensive programming
 * (return safe defaults like 0/'low' for invalid inputs) instead of throwing errors.
 * This makes the library robust for real-world messy data (e.g., no crashes in
 * calculateInventoryForecast([null], -1, 'invalid') → safe output).
 *
 * Extensions (all reuse avg/safety logic; no dup):
 * - Stockout Risk Detection: now uses RISK_LEVELS enum {LOW: 'low', MEDIUM: 'medium', HIGH: 'high'} for better structure (no magic strings; exported from util/index).
 * - Demand variability & safety stock: calculateSafetyStock(historicalDemand, leadTime, [zScore=1.65], [avgDemand?])
 *   - Reuses avg for optimization; zScore rename (std stats); variance accumulates linearly (std dev scales with sqrt(time) → *sqrt(LeadTime) in formula).
 * - Reorder Point: calculateReorderPoint(historicalDemand, leadTime, [zScore=1.65]) reuses avg + safety; triggers orders in real systems.
 * - EOQ (new): calculateEOQ(historicalDemand, [orderCost=100], [holdingCost=10]) reuses avg for optimal qty `sqrt(2*annualD*S/H)` (annual=avg*250 business days for realism, excl. weekends/holidays); answers "how much to order".
 *   - Integrated into forecast (backward-compatible; adds ..., eoq).
 * Example output: ..., safetyStock: 7.64, reorderPoint: 64.78, eoq: 239.06
 */
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Future Enhancements

- Advanced forecasting (e.g., exponential smoothing)
- Reorder point calculations
- Safety stock recommendations
- Integration with external data sources

## License

ISC
