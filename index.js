require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorHandler);

const startServer = async () => {
  await connectDB();

  app.listen(port, () => {
    console.log(`MediCare Connect server listening on port ${port}`);
  });
};

startServer();
