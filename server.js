/* require('dotenv').config();

const app = require('./app');
const { connectDatabase } = require('./services/databaseService');

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer(); */


// vercel change here

require('dotenv').config();

const app = require('./app');
const { connectDatabase } = require('./services/databaseService');

let isConnected = false;

async function handler(req, res) {
  try {
    if (!isConnected) {
      await connectDatabase();
      isConnected = true;
      console.log('Database connected');
    }

    return app(req, res);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Server Error');
  }
}

module.exports = handler;