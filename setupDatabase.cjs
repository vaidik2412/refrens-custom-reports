const mongoose = require('mongoose');
require('dotenv').config();
const { Schema } = mongoose;

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

// A minimal schema based heavily on invoices.js to just ensure the collection is created
// For actual field validation MongoDB relies on mongoose application side, 
// so creating an empty or minimal schema is sufficient for db.createCollection()
const simpleInvoiceSchema = new mongoose.Schema({
   invoiceTitle: String,
   invoiceNumber: String,
   business: Schema.Types.ObjectId,
   status: String,
   items: [Schema.Types.Mixed],
}, { strict: false, timestamps: true });

async function setupDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB Atlas.');

    console.log('Initializing schema...');
    const Invoice = mongoose.model('invoices', simpleInvoiceSchema);

    console.log('Creating "invoices" collection base on schema...');
    await Invoice.createCollection();
    await Invoice.syncIndexes();

    console.log('Successfully created the "invoices" collection matching the schema!');
  } catch (error) {
    console.error('Error setting up the database:', error);
  } finally {
    console.log('Disconnecting from database...');
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

setupDatabase();
