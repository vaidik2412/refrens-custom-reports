const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

// Same business/user IDs as setupSavedQueries.cjs and seedData.cjs
const BUSINESS_ID = new ObjectId("66dfea2f0be47436d6ff2ca5");
const USER_ID = new ObjectId("64c8da6b59797bccd235f770");

// Helper to create a default report document
const createReport = ({ displayName, description, nob, query, dateFields = [] }) => ({
  _id: new ObjectId(),
  isGlobal: false,
  business: BUSINESS_ID,
  addedBy: USER_ID,
  displayInChatbot: false,
  queryType: 'FEATHERS_SERVICE',
  querySubType: 'FIND',
  source: 'DASHBOARD',
  serviceName: 'invoices',
  query,
  dateFields: dateFields.map(df => ({ ...df, _id: new ObjectId() })),
  displayName,
  description: description || '',
  isArchived: false,
  isDefault: true,
  nob,
  _systemMeta: { source: 'seed-default-reports' },
  createdAt: new Date(),
  updatedAt: new Date(),
  __v: 0
});

// ============================================================================
// 18 NOB-Based Default Reports
// ============================================================================

const defaultReports = [

  // ── Knowledge Services (2) ────────────────────────────────────────────

  // KS1: Stalled Proposals
  createReport({
    displayName: 'Stalled Proposals',
    description: 'Quotations still waiting for client acceptance',
    nob: 'KNOWLEDGE_SERVICES',
    query: {
      billType: 'QUOTATION',
      invoiceAccepted: 'WAITING',
      isRemoved: false
    }
  }),

  // KS2: Advances Collected But Never Invoiced
  createReport({
    displayName: 'Advances Collected But Never Invoiced',
    description: 'Proforma invoices that were paid but never converted to a final invoice',
    nob: 'KNOWLEDGE_SERVICES',
    query: {
      billType: 'PROFORMAINV',
      status: 'PAID',
      isSourceConverted: false,
      isExpenditure: false,
      isRemoved: false
    }
  }),

  // ── S/w Product (2) ──────────────────────────────────────────────────

  // SP1: International Revenue
  createReport({
    displayName: 'International Revenue',
    description: 'Non-INR invoices raised this month — track export and foreign revenue',
    nob: 'SOFTWARE_PRODUCT',
    query: {
      billType: 'INVOICE',
      currency: { $nin: ['INR'] },
      isExpenditure: false,
      isRemoved: false
    },
    dateFields: [
      {
        accessor: 'invoiceDate',
        dateBehaviour: 'dynamic',
        dynamicPreset: 'this_month'
      }
    ]
  }),

  // SP2: Invoices Nearing Due
  createReport({
    displayName: 'Invoices Nearing Due',
    description: 'Unpaid invoices with due dates in the next 7 days',
    nob: 'SOFTWARE_PRODUCT',
    query: {
      billType: 'INVOICE',
      status: 'UNPAID',
      isExpenditure: false,
      isRemoved: false
    },
    dateFields: [
      {
        accessor: 'dueDate',
        dateBehaviour: 'dynamic',
        dynamicPreset: 'next_7_days'
      }
    ]
  }),

  // ── Contracting Services (3) ─────────────────────────────────────────

  // CS1: Open Quotation Pipeline
  createReport({
    displayName: 'Open Quotation Pipeline',
    description: 'All quotations awaiting client acceptance — track your sales pipeline',
    nob: 'CONTRACTING_SERVICES',
    query: {
      billType: 'QUOTATION',
      invoiceAccepted: 'WAITING',
      isRemoved: false
    }
  }),

  // CS2: Large Outstanding Project Payments
  createReport({
    displayName: 'Large Outstanding Project Payments',
    description: 'Unpaid or overdue invoices with balance due ≥ ₹50,000',
    nob: 'CONTRACTING_SERVICES',
    query: {
      billType: 'INVOICE',
      status: { $in: ['UNPAID', 'OVERDUE'] },
      'balance.due': { $gte: 50000 },
      isExpenditure: false,
      isRemoved: false
    }
  }),

  // CS3: Advances Received Without Final Invoice
  createReport({
    displayName: 'Advances Received Without Final Invoice',
    description: 'Proforma invoices that were paid but never converted — potential revenue leakage',
    nob: 'CONTRACTING_SERVICES',
    query: {
      billType: 'PROFORMAINV',
      status: 'PAID',
      isSourceConverted: false,
      isExpenditure: false,
      isRemoved: false
    }
  }),

  // ── Trading / Distribution (4) ───────────────────────────────────────

  // TD1: Open Purchase Orders
  createReport({
    displayName: 'Open Purchase Orders',
    description: 'Purchase orders awaiting vendor acceptance',
    nob: 'TRADING_DISTRIBUTION',
    query: {
      billType: 'PURCHASEORDER',
      invoiceAccepted: 'WAITING',
      isRemoved: false
    }
  }),

  // TD2: Buyer Credit Exposure
  createReport({
    displayName: 'Buyer Credit Exposure',
    description: 'Unpaid and overdue invoices with outstanding balance — monitor credit risk',
    nob: 'TRADING_DISTRIBUTION',
    query: {
      billType: 'INVOICE',
      status: { $in: ['UNPAID', 'OVERDUE'] },
      'balance.due': { $gt: 0 },
      isExpenditure: false,
      isRemoved: false
    }
  }),

  // TD3: E-Invoices Without IRN
  createReport({
    displayName: 'E-Invoices Without IRN',
    description: 'Active invoices where e-invoice IRN has not been generated yet',
    nob: 'TRADING_DISTRIBUTION',
    query: {
      billType: 'INVOICE',
      einvoiceGeneratedStatus: 'NOT GENERATED',
      status: { $nin: ['DRAFT'] },
      isExpenditure: false,
      isRemoved: false
    }
  }),

  // TD4: IRN Generated But EWB Missing
  createReport({
    displayName: 'IRN Generated But EWB Missing',
    description: 'Invoices with IRN generated but no E-Way Bill number — compliance gap',
    nob: 'TRADING_DISTRIBUTION',
    query: {
      billType: 'INVOICE',
      einvoiceGeneratedStatus: 'GENERATED',
      'irn.EwbNo': { $in: [null, ''] },
      isExpenditure: false,
      isRemoved: false
    }
  }),

  // ── Digital Store (2) ────────────────────────────────────────────────

  // DS1: Returns & Refunds This Month
  createReport({
    displayName: 'Returns & Refunds This Month',
    description: 'Credit notes issued this month — track returns and refund volume',
    nob: 'DIGITAL_STORE',
    query: {
      billType: 'CREDITNOTE',
      isRemoved: false
    },
    dateFields: [
      {
        accessor: 'invoiceDate',
        dateBehaviour: 'dynamic',
        dynamicPreset: 'this_month'
      }
    ]
  }),

  // DS2: Partial Payment Recovery
  createReport({
    displayName: 'Partial Payment Recovery',
    description: 'Invoices with partial payments — follow up to collect remaining balance',
    nob: 'DIGITAL_STORE',
    query: {
      billType: 'INVOICE',
      status: 'PARTIALLY_PAID',
      isExpenditure: false,
      isRemoved: false
    }
  }),

  // ── Manufacturing (3) ────────────────────────────────────────────────

  // MF1: Export Invoice Pipeline
  createReport({
    displayName: 'Export Invoice Pipeline',
    description: 'Non-INR invoices this quarter — track export revenue and receivables',
    nob: 'MANUFACTURING',
    query: {
      billType: 'INVOICE',
      currency: { $nin: ['INR'] },
      isExpenditure: false,
      isRemoved: false
    },
    dateFields: [
      {
        accessor: 'invoiceDate',
        dateBehaviour: 'dynamic',
        dynamicPreset: 'this_quarter'
      }
    ]
  }),

  // MF2: Large B2B Order Receivables
  createReport({
    displayName: 'Large B2B Order Receivables',
    description: 'Unpaid or overdue invoices ≥ ₹2,00,000 — high-value receivable tracking',
    nob: 'MANUFACTURING',
    query: {
      billType: 'INVOICE',
      status: { $in: ['UNPAID', 'OVERDUE'] },
      'totals.total': { $gte: 200000 },
      isExpenditure: false,
      isRemoved: false
    }
  }),

  // MFSO: Open Sales Orders
  createReport({
    displayName: 'Open Sales Orders',
    description: 'Sales orders not yet converted to invoices — pending fulfillment',
    nob: 'MANUFACTURING',
    query: {
      billType: 'SALESORDER',
      isSourceConverted: false,
      isRemoved: false
    }
  }),

  // ── Retail (2) ───────────────────────────────────────────────────────

  // RT1: Monthly Closed Sales
  createReport({
    displayName: 'Monthly Closed Sales',
    description: 'Fully paid invoices this month — track realized revenue',
    nob: 'RETAIL',
    query: {
      billType: 'INVOICE',
      status: 'PAID',
      isExpenditure: false,
      isRemoved: false
    },
    dateFields: [
      {
        accessor: 'invoiceDate',
        dateBehaviour: 'dynamic',
        dynamicPreset: 'this_month'
      }
    ]
  }),

  // RT2: Outstanding Credit Sales
  createReport({
    displayName: 'Outstanding Credit Sales',
    description: 'Unpaid and overdue invoices from the last 30 days — aged receivables',
    nob: 'RETAIL',
    query: {
      billType: 'INVOICE',
      status: { $in: ['UNPAID', 'OVERDUE'] },
      isExpenditure: false,
      isRemoved: false
    },
    dateFields: [
      {
        accessor: 'invoiceDate',
        dateBehaviour: 'dynamic',
        dynamicPreset: 'last_30_days'
      }
    ]
  })
];

// ============================================================================
// Seed Execution
// ============================================================================

async function seedDefaultReports() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    const db = client.db('invoices');
    const col = db.collection('savedQueries');

    // Clear only seed-default-reports (preserves user-created queries)
    const deleteResult = await col.deleteMany({ '_systemMeta.source': 'seed-default-reports' });
    console.log(`Cleared ${deleteResult.deletedCount} existing default reports`);

    console.log(`Inserting ${defaultReports.length} default reports into savedQueries...`);
    const result = await col.insertMany(defaultReports);
    console.log(`${result.insertedCount} default reports inserted successfully`);

    // Summary by NOB
    const nobCounts = {};
    defaultReports.forEach(r => {
      nobCounts[r.nob] = (nobCounts[r.nob] || 0) + 1;
    });
    console.log('\nReports by NOB:');
    Object.entries(nobCounts).forEach(([nob, count]) => {
      console.log(`  ${nob}: ${count} reports`);
    });

  } catch (err) {
    console.error('Error seeding default reports:', err.stack);
  } finally {
    await client.close();
  }
}

seedDefaultReports();
