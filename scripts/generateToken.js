require('dotenv').config();

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const email = process.argv[2];

if (!email) {
  console.error('Usage: npm run token -- <user-email>');
  console.error('Example: npm run token -- admin@medicareconnect.com');
  process.exit(1);
}

const secret = process.env.JWT_SECRET;
const uri = process.env.MONGODB_URI;

if (!secret) {
  console.error('JWT_SECRET is not defined in .env');
  process.exit(1);
}

if (!uri) {
  console.error('MONGODB_URI is not defined in .env');
  process.exit(1);
}

const generateToken = async () => {
  try {
    await mongoose.connect(uri);

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn: '24h' }
    );

    console.log('\nJWT generated successfully\n');
    console.log(`User:  ${user.name} (${user.email})`);
    console.log(`Role:  ${user.role}`);
    console.log(`\nToken (use in Postman as Bearer token):\n`);
    console.log(token);
    console.log('\nTest endpoints:');
    console.log('  GET http://localhost:5000/api/auth/me');
    console.log('  GET http://localhost:5000/api/auth/admin-check  (admin only)');
  } catch (error) {
    console.error('Token generation failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

generateToken();
