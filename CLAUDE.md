# Claude Context: Custom Reports MongoDB Setup

## Project Overview
This directory contains a standalone Node.js script environment used to seed a MongoDB Atlas `invoices` database with mock data matching the `Refrens` production schema. This is a foundational step for building a new **Custom Reports / Saved Queries** feature.

## Current State
1. **Database Location**: MongoDB Atlas (Connection string is stored securely in `.env`). 
2. **Setup Scripts**:
   - `setupDatabase.cjs`: Simplified connection check and explicit schema creation.
   - `setupSavedQueries.cjs`: Connects and seeds the `savedQueries` collection with a sample custom report configuration.
   - `verifyQueries.cjs`: Reads the `savedQueries` doc, dynamically executes the `dateFields` behavior, and queries the `invoices` collection to verify out-of-the-box functionality.
   - `seedData.cjs`: (The most complex script) Bulk inserts 20 mock `invoices` scenarios (Standard, SaaS Recurring, Inventory Produce, ZATCA Compliance).

## The Core Challenge: Schema Verification
The mock data in `seedData.cjs` was written by manually mapping properties from the complex Mongoose schema files:
- `invoices.js` 
- `invoiceItems.js`
- `documentCommonFields.js`

**We need to verify that `seedData.cjs` correctly mimics the production definitions.**

### Known Schema Quirks We Addressed:
1. `totals` is an object, not a flattened field (e.g. `totals.total`, `totals.subTotal`).
2. Exchange rates are stored in `conversionRates: { [currency]: number }` and aggregated in `totalConversions`.
3. IGST/CGST/SGST and `gstRate` are mapped individually on inside the `invoiceItems.js` array.
4. `vendorFields` are strictly indexed custom string keys (e.g., `r_str_001`, `r_num_001`).

### Important Notes
- This uses CommonJS `.cjs` to avoid module resolution collision with the `type: "module"` in `package.json`.
- Internal `@refrens/fence` JSON imports and deep dependencies natively trigger Mongoose `Maximum call stack size exceeded` errors when importing the schema directly into an isolated standalone Node script. Hence, we used `MongoClient.db().insertMany()` to bypass strict Mongoose validation for the seeding phase.

## Current Objective
Please review `seedData.cjs` extremely closely against `invoices.js`, `invoiceItems.js`, and `documentCommonFields.js` to ensure the dynamically generated payloads perfectly align with what the production API generates. Point out any missing default values, wrong types, or missing nested arrays that could break custom reporting queries later on.
