const { MongoClient } = require('mongodb');
require('dotenv').config();

const {
  buildClientValueMap,
  buildMongoQuery,
  SAVED_QUERY_CONTRACT_VERSION,
} = require('./savedQueryContract.cjs');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

async function runSavedQueryCheck(db, savedQuery, clientValueMap) {
  const mongoQuery = buildMongoQuery(savedQuery.query, savedQuery.dateFields, {
    clientValueMap,
  });

  const targetCollection = savedQuery.serviceName || 'invoices';
  const results = await db.collection(targetCollection).find(mongoQuery).limit(3).toArray();

  console.log(`\n============================`);
  console.log(`Executing Custom Report: "${savedQuery.displayName}"`);
  console.log('============================\n');
  console.log('Compiled MongoDB Query:');
  console.log(JSON.stringify(mongoQuery, null, 2));
  console.log(`\nResults Found: ${results.length}\n`);

  results.forEach((res, index) => {
    console.log(`Match ${index + 1}:`);
    console.log(` - ID: ${res._id}`);
    console.log(` - BillType: ${res.billType}`);
    console.log(` - Invoice Number: ${res.invoiceNumber}`);
    console.log(` - Status: ${res.status}`);
    console.log(` - Invoice Date: ${res.invoiceDate}`);
    console.log(` - Due Date: ${res.dueDate}`);
    console.log(` - Total Amount: ${res.totals?.total}`);
    console.log('----------------------------');
  });

  return results.length > 0;
}

async function runParityChecks(db) {
  const checks = [
    {
      label: 'Seeded docs still using legacy balance.received field',
      filter: { '_systemMeta.source': 'seed-script', 'balance.received': { $exists: true } },
      expected: 0,
    },
    {
      label: 'Seeded docs missing balance.paid',
      filter: { '_systemMeta.source': 'seed-script', 'balance.paid': { $exists: false } },
      expected: 0,
    },
    {
      label: 'Seeded docs missing recurringInvoice.frequency',
      filter: { '_systemMeta.source': 'seed-script', 'recurringInvoice.frequency': { $exists: false } },
      expected: 0,
    },
    {
      label: 'Seeded docs with legacy spaced e-invoice status',
      filter: { '_systemMeta.source': 'seed-script', einvoiceGeneratedStatus: 'NOT GENERATED' },
      expected: 0,
    },
    {
      label: 'Seeded docs with lowercase irn.irn key',
      filter: { '_systemMeta.source': 'seed-script', 'irn.irn': { $exists: true } },
      expected: 0,
    },
    {
      label: 'Seeded docs missing client object ids',
      filter: { '_systemMeta.source': 'seed-script', client: { $exists: false } },
      expected: 0,
    },
    {
      label: 'Seeded docs missing totalConversions',
      filter: { '_systemMeta.source': 'seed-script', totalConversions: { $exists: false } },
      expected: 0,
    },
    {
      label: 'Seeded docs still using flattened totalConversions.total',
      filter: { '_systemMeta.source': 'seed-script', 'totalConversions.total': { $exists: true } },
      expected: 0,
    },
    {
      label: 'Seeded docs missing shareId',
      filter: { '_systemMeta.source': 'seed-script', shareId: { $exists: false } },
      expected: 0,
    },
    {
      label: 'Seeded docs missing locale',
      filter: { '_systemMeta.source': 'seed-script', locale: { $exists: false } },
      expected: 0,
    },
    {
      label: 'Seeded docs missing paymentOptions',
      filter: { '_systemMeta.source': 'seed-script', paymentOptions: { $exists: false } },
      expected: 0,
    },
    {
      label: 'Seeded docs missing reminders',
      filter: { '_systemMeta.source': 'seed-script', reminders: { $exists: false } },
      expected: 0,
    },
    {
      label: 'Seeded docs missing vendorReminder',
      filter: { '_systemMeta.source': 'seed-script', vendorReminder: { $exists: false } },
      expected: 0,
    },
    {
      label: 'Seeded docs missing columns',
      filter: { '_systemMeta.source': 'seed-script', columns: { $exists: false } },
      expected: 0,
    },
    {
      label: 'Seeded docs missing customLabels',
      filter: { '_systemMeta.source': 'seed-script', customLabels: { $exists: false } },
      expected: 0,
    },
    {
      label: 'Seeded items missing group',
      filter: { '_systemMeta.source': 'seed-script', 'items.group': { $exists: false } },
      expected: 0,
    },
    {
      label: 'Seeded items missing hidden',
      filter: { '_systemMeta.source': 'seed-script', 'items.hidden': { $exists: false } },
      expected: 0,
    },
    {
      label: 'Seeded items missing trackingMethod',
      filter: { '_systemMeta.source': 'seed-script', 'items.trackingMethod': { $exists: false } },
      expected: 0,
    },
  ];

  let failures = 0;

  console.log('\nParity Checks:');
  for (const check of checks) {
    const count = await db.collection('invoices').countDocuments(check.filter);
    const pass = count === check.expected;
    console.log(` - ${pass ? 'PASS' : 'FAIL'}: ${check.label} (${count})`);
    if (!pass) failures += 1;
  }

  return failures;
}

async function verifyQueries() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    const db = client.db('invoices');
    const clientValueMap = await buildClientValueMap(db);
    const savedQueries = await db.collection('savedQueries').find({
      displayName: {
        $in: [
          'Sample Fixed Invoice Report',
          'Sample Dynamic Due Report',
          'Legacy Client Name Report',
        ],
      },
    }).toArray();

    if (savedQueries.length === 0) {
      console.error('Saved query fixtures not found. Run setupSavedQueries.cjs first.');
      return;
    }

    let reportFailures = 0;
    for (const savedQuery of savedQueries) {
      const hasResults = await runSavedQueryCheck(db, savedQuery, clientValueMap);
      const isUnmigratedLegacyFixture =
        savedQuery._systemMeta?.source === 'setup-saved-queries-legacy' &&
        savedQuery._migrationMeta?.version !== SAVED_QUERY_CONTRACT_VERSION;
      if (!hasResults && !isUnmigratedLegacyFixture) {
        reportFailures += 1;
      }
    }

    const parityFailures = await runParityChecks(db);
    const totalFailures = reportFailures + parityFailures;

    if (totalFailures > 0) {
      console.error(`\nVerification completed with ${totalFailures} failing check(s).`);
      process.exitCode = 1;
      return;
    }

    console.log('\nAll saved-query and parity checks passed.');
  } catch (err) {
    console.error('Error verifying query:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

verifyQueries();
