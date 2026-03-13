const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const { createSavedQueryDoc } = require('./savedQueryContract.cjs');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

const getObjId = (hex) => new ObjectId(hex.padEnd(24, '0'));

const clientIds = {
  alphaCorp: String(getObjId('5b000000000000000000001')),
  betaRetail: String(getObjId('5b000000000000000000002')),
};

const sampleQueries = [
  createSavedQueryDoc({
    displayName: 'Sample Fixed Invoice Report',
    description: 'Fixed invoice date window with canonical client ObjectId filters',
    query: {
      billType: 'INVOICE',
      status: { $in: ['UNPAID', 'OVERDUE'] },
      client: {
        $in: [clientIds.alphaCorp],
        $inOptions: [{ label: 'Alpha Corp', value: clientIds.alphaCorp }],
      },
      invoiceDate: {
        $gte: '2026-01-01',
        $lte: '2026-12-31',
      },
    },
    dateFields: [
      {
        accessor: 'invoiceDate',
        dateBehaviour: 'fixed',
        fixedDateRange: {
          $gte: '2026-01-01',
          $lte: '2026-12-31',
        },
      },
    ],
    systemSource: 'setup-saved-queries',
  }),
  createSavedQueryDoc({
    displayName: 'Sample Dynamic Due Report',
    description: 'Dynamic due date report using the canonical custom_period preset',
    query: {
      billType: 'INVOICE',
      status: { $in: ['UNPAID', 'OVERDUE'] },
      client: {
        $in: [clientIds.betaRetail],
        $inOptions: [{ label: 'Beta Retailers', value: clientIds.betaRetail }],
      },
    },
    dateFields: [
      {
        accessor: 'dueDate',
        dateBehaviour: 'dynamic',
        dynamicPreset: 'custom_period',
        customDirection: 'next',
        customNumber: 70,
        customUnit: 'days',
      },
    ],
    systemSource: 'setup-saved-queries',
  }),
  createSavedQueryDoc({
    displayName: 'Legacy Client Name Report',
    description: 'Legacy report fixture used to verify migration and backward compatibility',
    query: {
      billType: 'INVOICE',
      'billedTo.name': {
        $in: ['Alpha Corp'],
        $inOptions: [{ label: 'Alpha Corp', value: 'Alpha Corp' }],
      },
    },
    dateFields: [
      {
        accessor: 'invoiceDate',
        dateBehaviour: 'dynamic',
        dynamicPreset: 'custom',
        customNumber: 10,
        customUnit: 'weeks',
      },
    ],
    systemSource: 'setup-saved-queries-legacy',
  }),
];

async function createSavedQueries() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected correctly to MongoDB Atlas');

    const db = client.db('invoices');
    const col = db.collection('savedQueries');

    console.log('Clearing existing setup sample saved queries...');
    await col.deleteMany({
      '_systemMeta.source': { $in: ['setup-saved-queries', 'setup-saved-queries-legacy'] },
    });

    console.log(`Inserting ${sampleQueries.length} sample saved queries into the "savedQueries" collection...`);
    const result = await col.insertMany(sampleQueries);
    console.log(`Documents successfully inserted with ids: ${Object.values(result.insertedIds).join(', ')}`);
  } catch (err) {
    console.error('Error seeding data:', err.stack);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

createSavedQueries();
