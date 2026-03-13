const { MongoClient } = require('mongodb');
require('dotenv').config();

const {
  buildClientValueMap,
  looksLikeObjectId,
  PROTOTYPE_BUSINESS_ID,
  SAVED_QUERY_CONTRACT_VERSION,
  normalizeSavedQueryDoc,
} = require('./savedQueryContract.cjs');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

function isPrototypeQuery(doc) {
  const businessId = doc.business ? String(doc.business) : null;
  const clientFilterValues = doc.query?.client?.$in;
  const hasLegacyClientNames =
    Array.isArray(clientFilterValues) &&
    clientFilterValues.some((value) => !looksLikeObjectId(value));

  return (
    businessId === String(PROTOTYPE_BUSINESS_ID) ||
    doc._systemMeta?.source?.startsWith('seed-') ||
    doc.query?.['billedTo.name'] ||
    doc.query?.creator ||
    hasLegacyClientNames ||
    doc.query?.['recurringInvoice.frequency']?.$ne === 'NONE' ||
    doc.query?.einvoiceGeneratedStatus === 'NOT GENERATED' ||
    doc.dateFields?.some((field) => field.dynamicPreset === 'custom')
  );
}

async function migrateSavedQueries() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    const db = client.db('invoices');
    const col = db.collection('savedQueries');
    const clientValueMap = await buildClientValueMap(db);
    const candidates = await col.find({ serviceName: 'invoices' }).toArray();

    let migratedCount = 0;

    for (const doc of candidates) {
      if (!isPrototypeQuery(doc)) continue;
      if (doc._migrationMeta?.version === SAVED_QUERY_CONTRACT_VERSION) continue;

      const normalized = normalizeSavedQueryDoc(doc, { clientValueMap });
      const { _id, ...updateDoc } = normalized;
      await col.updateOne(
        { _id: doc._id },
        {
          $set: updateDoc,
        },
      );
      migratedCount += 1;
    }

    console.log(`Migrated ${migratedCount} saved quer${migratedCount === 1 ? 'y' : 'ies'} to ${SAVED_QUERY_CONTRACT_VERSION}`);
  } catch (error) {
    console.error('Error migrating saved queries:', error.stack);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

migrateSavedQueries();
