require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const verifyJWT = require('./middleware/verifyJWT');
const authorizeRoles = require('./middleware/authorizeRoles');
const statsController = require('./controllers/stats.controller');

const authRoutes = require('./routes/auth.routes');
const doctorsRoutes = require('./routes/doctors.routes');
const appointmentsRoutes = require('./routes/appointments.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const paymentsRoutes = require('./routes/payments.routes');
const prescriptionsRoutes = require('./routes/prescriptions.routes');
const usersRoutes = require('./routes/users.routes');
const statsRoutes = require('./routes/stats.routes');

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
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stats', statsRoutes);

app.get(
  '/api/admin/analytics',
  verifyJWT,
  authorizeRoles('admin'),
  statsController.getAdminAnalytics
);

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
