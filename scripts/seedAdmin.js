require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const SALT_ROUNDS = 12;

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is not defined');
    process.exit(1);
  }

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for seeding');

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const admin = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        name: 'Admin',
        email: email.toLowerCase(),
        role: 'admin',
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

    console.log('Admin user seeded successfully');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Role:  ${admin.role}`);
    console.log('  Password: (set via ADMIN_PASSWORD in .env)');
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedAdmin();
