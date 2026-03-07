const app = require('../app');
const connectDB = require('../config/db');

// Connect to MongoDB (handles serverless environments gracefully)
connectDB();

module.exports = app;
