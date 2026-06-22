require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'Patient@123';

const seedPatient = async () => {
  const email = process.env.SEED_PATIENT_EMAIL || 'patient@test.com';
  const password = process.env.SEED_PATIENT_PASSWORD || DEFAULT_PASSWORD;
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is not defined');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for patient seeding');

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const patient = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        name: 'Test Patient',
        email: email.toLowerCase(),
        role: 'patient',
        status: 'active',
        password: hashedPassword,
        emailVerified: true,
      },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      }
    );

    console.log('Patient user seeded successfully');
    console.log(`  Email:    ${patient.email}`);
    console.log(`  Role:     ${patient.role}`);
    console.log(`  Password: ${password}`);
    console.log(`\nGenerate token: npm run token -- ${patient.email}`);
  } catch (error) {
    console.error('Patient seed failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedPatient();
