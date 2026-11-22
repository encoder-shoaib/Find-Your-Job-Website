const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
const dbName = process.env.MONGODB_DB_NAME || 'yourfindjob_db';

let client = null;
let db = null;

async function connectDB() {
  if (db) return db;
  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    db = client.db(dbName);
    console.log(`[MongoDB] Connected successfully to ${uri} (DB: ${dbName})`);
    return db;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

function getCollection(name) {
  return getDB().collection(name);
}

function isDBConnected() {
  return !!db;
}

module.exports = {
  connectDB,
  getDB,
  getCollection,
  isDBConnected,
};

