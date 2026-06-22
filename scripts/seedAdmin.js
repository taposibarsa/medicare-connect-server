require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const {
  syncBetterAuthCredential,
  syncBetterAuthUserFields,
} = require('./utils/betterAuthSeed');

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

    const admin = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        name: 'Admin',
        email: email.toLowerCase(),
        role: 'admin',
        status: 'active',
        emailVerified: true,
      },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      }
    );

    const db = mongoose.connection.db;
    await syncBetterAuthUserFields(db, admin);

    const { created } = await syncBetterAuthCredential(db, admin._id, password);

    console.log('Admin user seeded successfully');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Role:  ${admin.role}`);
    console.log(`  Better Auth credential: ${created ? 'created' : 'updated'}`);
    console.log('  Password: (set via ADMIN_PASSWORD in .env)');
    console.log('\nYou can now sign in at /login with these credentials.');
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedAdmin();
