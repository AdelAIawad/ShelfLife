const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
  try {
    // Try connecting to a real MongoDB instance first
    if (process.env.MONGO_URI && process.env.MONGO_URI !== 'mongodb://localhost:27017/shelflife') {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    }

    // Check if local MongoDB is available
    try {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shelflife', {
        serverSelectionTimeoutMS: 2000,
      });
      console.log('MongoDB Connected: localhost');
      return;
    } catch {
      console.log('Local MongoDB not found, starting in-memory server...');
    }

    // Fall back to in-memory MongoDB
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log('');
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  MODE: IN-MEMORY MongoDB (development)                  │');
    console.log('  │  • Database lives in RAM — wiped on every restart       │');
    console.log('  │  • Demo data re-seeds automatically                     │');
    console.log('  │  • For persistence: set MONGO_URI to a real instance    │');
    console.log('  │    (e.g. MongoDB Atlas) in .env                         │');
    console.log(`  │  Connected: ${conn.connection.host.padEnd(44)}│`);
    console.log('  └─────────────────────────────────────────────────────────┘');
    console.log('');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
