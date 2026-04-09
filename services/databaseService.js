const mongoose = require('mongoose');

const AppMeta = require('../models/AppMeta');

async function bootstrapDatabase() {
  await AppMeta.updateOne(
    { key: 'bootstrap' },
    {
      $setOnInsert: {
        key: 'bootstrap',
      },
    },
    { upsert: true }
  );
}

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in the environment variables.');
  }

  await mongoose.connect(mongoUri);
  await bootstrapDatabase();

  console.log('MongoDB Atlas connected successfully');
}

module.exports = {
  connectDatabase,
};