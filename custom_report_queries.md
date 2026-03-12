# Custom Report Queries Analysis

Based on the `savedQueries` schema provided, the MongoDB query engine can easily handle dynamic dates, fixed dates, and any combination of flat property matches inside the `query` object. Here is a breakdown of what businesses can do immediately, and what would require minor schema bumps to achieve.

## Phase 1: Supported Out-of-the-Box

These reports perfectly match the current schema using `querySubType: "FIND"` combined with the dynamic/fixed `.dateFields` arrays and flat `.query` matching.

### 1. The "Aged Debt" Tracker (Dynamic Dates)
* **Goal**: Find unpaid invoices that passed their due date over a certain period ago.
* **Schema Implementation**: 
  - `query`: `{ "status": "OVERDUE", "billType": "INVOICE" }`
  - `dateFields`: `[{ accessor: "dueDate", dateBehaviour: "dynamic", dynamicPreset: "custom", customNumber: 30, customUnit: "days" }]`

### 2. Quarterly Tax Filing Export (Fixed Dates)
* **Goal**: Isolate purely PAID invoices for a specific historical quarter to export for tax compliance (e.g., Q1 2025).
* **Schema Implementation**:
  - `query`: `{ "status": "PAID" }`
  - `dateFields`: `[{ accessor: "invoiceDate", dateBehaviour: "fixed", fixedDateRange: { $gte: "2025-01-01", $lte: "2025-03-31" } }]`

### 3. VIP Client Ledger (Exact Match)
* **Goal**: Track all billing history for a single major client.
* **Schema Implementation**:
  - `query`: `{ "clientProfile": { "$oid": "CLIENT_ID_HERE" } }`
  - `dateFields`: `[]` (No date limits, pull entire history)

### 4. International Subscription Revenue (Nested/Array Match)
* **Goal**: Track all non-INR recurring invoices.
* **Schema Implementation**:
  - `query`: `{ "currency": "USD", "recurringInvoice.isCreatedFromRecurring": true }`

### 5. High-Value Project Milestones (Tags Match)
* **Goal**: Track retainer checks or milestone payments by checking the string arrays.
* **Schema Implementation**:
  - `query`: `{ "tags": "Milestone-Payment", "status": "PARTIALLY_PAID" }`

---

## Phase 2: Useful Queries Requiring Minor Schema Enhancements

While the current schema guarantees we can *find* the right documents, true custom reporting often requires dictating *how* the data is presented. Here are highly requested reports that need slight feature expansions:

### 1. "My View" - Column Selection & Ordering
* **Report**: "Sales Rep View" (Only showing Invoice Number, Client Name, and Total). 
* **The Gap**: Currently, your spec mentions inheriting column selections from `localStorage`. If User A saves a report and User B opens it on a different machine, User B won't see the columns User A intended.
* **Enhancement**: Add a `displayColumns: ["invoiceNumber", "billedTo.name", "totals.total"]` string array to the `savedQueries` schema so the column presentation is forcefully saved with the report.

### 2. "Top Debtors" - Default Sorting
* **Report**: "Highest Unpaid Invoices" (Sorted strictly by Total Amount descending).
* **The Gap**: Similar to columns, if sorting relies on local state, the "Report" is just a filter, not a true presentation. 
* **Enhancement**: Add a `sortConfig: { field: "totals.total", order: -1 }` property to automatically sort the results when the saved query is clicked.

### 3. Complex "OR" Conditions ($in / $or)
* **Report**: "Action Required" (Invoices that are either OVERDUE *or* UNPAID).
* **The Gap**: Standard dashboard filter components usually generate flat `AND` queries. Creating an `OR` view requires the frontend to be able to push `{ $in: ["OVERDUE", "UNPAID"] }` into the `query.status` payload.
* **Enhancement**: Ensure the UI's filter component can construct and save `$in` arrays into the `.query` object for status dropdowns.

### 4. Aggregations (Sum, Average, Group By)
* **Report**: "Monthly Revenue by Client" or "Total Unpaid Tax Amount".
* **The Gap**: The schema currently hardcodes `querySubType: "FIND"`. "FIND" returns raw rows. High-level dashboard reports usually require aggregated math (e.g., returning one row per client with a summed total).
* **Enhancement**: Introduce `querySubType: "AGGREGATE"`. Add an `aggregations: [{ type: "SUM", field: "totals.amount", groupBy: "clientProfile" }]` object to the schema to allow the backend to run `$group` pipelines instead of basic `$match` pipelines.
