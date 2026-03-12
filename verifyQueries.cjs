const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

// Emulate resolving dynamic dates on the backend
function resolveDateRange(dateFieldConfig) {
  if (dateFieldConfig.dateBehaviour === 'fixed') {
    return {
      $gte: new Date(dateFieldConfig.fixedDateRange.$gte),
      $lte: new Date(dateFieldConfig.fixedDateRange.$lte)
    };
  }

  if (dateFieldConfig.dateBehaviour === 'dynamic') {
    const now = new Date();
    let startDate = new Date();
    
    // Simplistic emulation of dynamic dates based on the schema config
    if (dateFieldConfig.dynamicPreset === 'custom' && dateFieldConfig.customUnit === 'weeks') {
        startDate.setDate(now.getDate() - (dateFieldConfig.customNumber * 7));
    } else if (dateFieldConfig.dynamicPreset === 'last_30_days') {
        startDate.setDate(now.getDate() - 30);
    }
    
    return {
      $gte: startDate,
      $lte: now
    };
  }
  return {};
}

// Compile a final MongoDB query payload from the Saved Query object
function buildMongoQuery(savedQueryDef) {
  // Base query (e.g., { billType: "INVOICE" })
  const finalQuery = { ...savedQueryDef.query };

  // Append resolved date configurations
  if (Array.isArray(savedQueryDef.dateFields)) {
    savedQueryDef.dateFields.forEach(df => {
      finalQuery[df.accessor] = resolveDateRange(df);
    });
  }

  // Enforce isolation
  if (savedQueryDef.business) {
    finalQuery.business = savedQueryDef.business;
  }

  return finalQuery;
}

async function verifyQueries() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    const db = client.db('invoices');
    
    // 1. Fetch the saved report configuration
    const savedQuery = await db.collection('savedQueries').findOne({ displayName: 'test custom 1' });
    
    if (!savedQuery) {
        console.error("Saved query not found. Run setupSavedQueries.cjs first.");
        return;
    }
    
    console.log(`\n============================`);
    console.log(`Executing Custom Report: "${savedQuery.displayName}"`);
    console.log(`============================\n`);

    // 2. Build the final query payload targeting the 'invoices' collection
    const mongoQuery = buildMongoQuery(savedQuery);
    
    console.log("Compiled MongoDB Query:");
    console.log(JSON.stringify(mongoQuery, null, 2));

    // 3. Execute the payload against the mapped serviceName output
    const targetCollection = savedQuery.serviceName || 'invoices';
    const results = await db.collection(targetCollection).find(mongoQuery).toArray();

    console.log(`\n============================`);
    console.log(`Results Found: ${results.length}`);
    console.log(`============================\n`);

    if (results.length > 0) {
        // Output a summarized glimpse of the results
        results.forEach((res, i) => {
           console.log(`Match ${i+1}:`);
           console.log(` - ID: ${res._id}`);
           console.log(` - BillType: ${res.billType}`);
           console.log(` - Invoice Number: ${res.invoiceNumber}`);
           console.log(` - Status: ${res.status}`);
           console.log(` - Invoice Date: ${res.invoiceDate}`);
           console.log(` - Due Date: ${res.dueDate}`);
           console.log(` - Total Amount: ${res.totals?.total}`);
           console.log(`----------------------------`);
        });
    }

  } catch (err) {
    console.error('Error verifying query:', err);
  } finally {
    await client.close();
  }
}

verifyQueries();
