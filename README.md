# Inventory Management System

A Node.js utility library for calculating forecast demand and inventory risk. Focused on short-term demand estimation and stockout risk detection using historical daily demand data, current stock level, and supplier lead time.

## Features

- **Simple Moving Average**: Calculate average daily demand from historical data.
- **Days of Inventory Remaining**: Estimate how many days before stock runs out.
- **Stockout Risk Detection**: Identify risk levels based on lead time.
- **Demand Variability & Safety Stock** (new): Std dev of demand + formula `Z * stdDev * sqrt(LeadTime)` (default Z=1.65 for ~95% service level).
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
│   └── calculateSafetyStock.js   # New: demand std dev + safety stock formula
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
//   safetyStock: 7.64    // New: Z * stdDev * sqrt(leadTime) with default Z=1.65
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
 * New: Demand variability & safety stock extension:
 * - calculateSafetyStock(historicalDemand, leadTime, [serviceLevelZ=1.65])
 * - Integrated into forecast (backward-compatible; adds demandStdDev, safetyStock fields).
 * Example output now includes: ..., demandStdDev: 2.07, safetyStock: 7.64
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
