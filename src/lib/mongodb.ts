import { MongoClient } from 'mongodb';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect();
    }
    return global._mongoClientPromise;
  }

  return new MongoClient(uri).connect();
}

// Lazy — only connects when actually imported at runtime, not at build time
let _clientPromise: Promise<MongoClient> | null = null;

function clientPromise(): Promise<MongoClient> {
  if (!_clientPromise) {
    _clientPromise = getClientPromise();
  }
  return _clientPromise;
}

export default clientPromise;

export async function getDb() {
  const client = await clientPromise();
  return client.db('invoices');
}
