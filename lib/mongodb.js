import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.warn('MONGODB_URI is not configured.');
}

let client;
let clientPromise;

if (uri) {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb() {
  if (!clientPromise) {
    throw new Error('MONGODB_URI is not configured');
  }

  const connectedClient = await clientPromise;

  const dbName = process.env.MONGODB_DB || 'prep-master';

  return connectedClient.db(dbName);
}
