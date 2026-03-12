const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

const sampleQuery = {
  isGlobal: false,
  business: new ObjectId("66dfea2f0be47436d6ff2ca5"),
  addedBy: new ObjectId("64c8da6b59797bccd235f770"),
  displayInChatbot: false,
  queryType: "FEATHERS_SERVICE",
  querySubType: "FIND",
  source: "DASHBOARD",
  serviceName: "invoices",
  query: {
    billType: "INVOICE"
  },
  dateFields: [
    {
      accessor: "invoiceDate",
      dateBehaviour: "fixed",
      fixedDateRange: {
        $gte: new Date("2026-01-01"),
        $lte: new Date("2026-12-31")
      },
      _id: new ObjectId("69af7b3608dd37857e047e63")
    },
    {
      accessor: "dueDate",
      dateBehaviour: "dynamic",
      dynamicPreset: "custom",
      customNumber: 10,
      customUnit: "weeks",
      _id: new ObjectId("69af7f6d08dd37857e0482de")
    }
  ],
  displayName: "test custom 1",
  isArchived: false,
  description: "",
  createdAt: new Date("2026-03-10T02:00:22.624Z"),
  updatedAt: new Date("2026-03-10T02:00:22.624Z"),
  __v: 0
};

async function createSavedQueries() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected correctly to MongoDB Atlas');
    
    const db = client.db('invoices'); 
    const col = db.collection('savedQueries');
    
    console.log(`Clearing existing documents (if any) to ensure fresh seed...`);
    await col.deleteMany({}); // Optional, assuming we just want the reference one

    console.log(`Inserting the sample queried into the "savedQueries" collection...`);
    const result = await col.insertOne(sampleQuery);
    console.log(`Document successfully inserted with _id: ${result.insertedId}`);
  } catch (err) {
    console.error('Error seeding data:', err.stack);
  } finally {
    await client.close();
  }
}

createSavedQueries();
