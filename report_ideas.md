# Custom Report Ideas

Based on the feature scope for saving customized filter configurations (including dynamic dates, column selections, and sort orders), here are 15 different custom reports that businesses might create to monitor their finances, compliance, and operations.

### Accounts Receivable & Cash Flow
1. **Unpaid High-Value Invoices (Last 30 Days)**: Filters invoices mapped to "Overdue" or "Unpaid", sorts by `Total Amount -> Descending`, and uses dynamic dates (Last 30 Days) to prioritize follow-ups for major outstanding cash.
2. **Weekly Expected Collections**: Filters invoices where `Status = Unpaid` and `Due Date = This Week`. Helps sales/finance teams project short-term cash flow.
3. **Partially Paid Retainers**: Filters `Status = Partially Paid` and `Tags contains 'Retainer'`. Perfect for service agencies tracking milestone payments on long-term contracts.
4. **Client-Specific Ledger (Top Client)**: Filters `BilledTo = [Major Client Name]`. Saves the specific column selections (Amount, Paid, Due, Date) to instantly pull a mini statement for a VIP client.

### Tax & Compliance (Based on Schema Capabilities)
5. **GSTR-1 Export View (Current Month)**: Filters `BillType = Invoice`, uses dynamic dates for `This Month`, and specifically enables columns for `GSTIN`, `SubTotal`, `IGST`, `CGST`, `SGST` to streamline monthly Indian GST filing.
6. **E-Invoice Generation Pending**: Filters `isEInvoicingApplicable = true` where `eInvoicingDetails.irn` is empty or `Status != ACT`. Acts as a compliance checklist report.
7. **TDS Deducted Summary (This Quarter)**: Filters invoices where `isTdsApplied = true` with dynamic dates mapping to `This Quarter`. Useful for reconciling TDS certificates (Form 16A) with clients.
8. **ZATCA B2B Clearance Tracker (Saudi Arabia)**: Filters `Country = SA` and `zatcaDetails.cleared = false`. A specialized compliance tracker for Saudi businesses to monitor XML submission statuses.

### Sales & Performance Analysis
9. **Quarterly SaaS Renewals**: Filters `Recurring = true` or `Tags contains 'SaaS'`, setting dynamic dates to `This Quarter`. Sorts by Date. Used by customer success teams to track upcoming subscription renewals.
10. **Product Sales by Vendor Department (Custom Fields)**: Filters invoices where the custom vendor field (e.g., `r_str_002 = 'Marketing'`). Useful for internal departmental revenue tracking.
11. **Discount Impact Report**: Enables the `Discount` column and filters where `Discount > 0`, sorted by discount amount. Helps management analyze how much revenue is being traded for deal closures this month.
12. **High-Performing Sales Reps (Creator Tracking)**: Filters `Creator = [User ID]` and dates for `Last Month`. Used by account managers to track their individual monthly invoicing targets.

### Operations & Logistics
13. **Pending Dispatch/Inventory Fulfillment**: Filters `Status = Unpaid/Paid`, but includes columns for `shippedTo`, `transportDetails.eWayBillNo`, and `Items contains [Physical Product]`. Used by warehouse teams to see what needs an e-way bill generated and shipped.
14. **Direct Bank Transfers vs. Payment Gateway**: A report filtering by `payments.paymentMethod = 'NEFT/RTGS'`, analyzing the volume of offline settlements versus expensive payment gateway (Razorpay) transactions.
15. **Converted Proformas Pipeline**: Filters `linkedDocuments` where a Proforma/Estimate was the source. Tracks the conversion pipeline from quote to actual invoice `This Year`.
