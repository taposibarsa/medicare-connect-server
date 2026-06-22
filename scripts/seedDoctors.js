require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'Doctor@123';

const SAMPLE_DOCTORS = [
  {
    name: 'Dr. Sarah Mitchell',
    email: 'sarah.mitchell@medicareconnect.com',
    specialization: 'Cardiology',
    qualifications: 'MD, FACC',
    experience: 15,
    consultationFee: 120,
    hospitalName: 'City Heart Center',
    availableDays: ['Monday', 'Wednesday', 'Friday'],
    availableSlots: ['09:00', '10:00', '11:00', '14:00'],
  },
  {
    name: 'Dr. James Chen',
    email: 'james.chen@medicareconnect.com',
    specialization: 'Neurology',
    qualifications: 'MD, PhD',
    experience: 12,
    consultationFee: 150,
    hospitalName: 'NeuroCare Institute',
    availableDays: ['Tuesday', 'Thursday'],
    availableSlots: ['09:30', '11:00', '15:00'],
  },
  {
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@medicareconnect.com',
    specialization: 'Pediatrics',
    qualifications: 'MD, FAAP',
    experience: 10,
    consultationFee: 90,
    hospitalName: "Children's Wellness Clinic",
    availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
    availableSlots: ['08:00', '09:00', '10:00', '11:00'],
  },
  {
    name: 'Dr. Michael Okafor',
    email: 'michael.okafor@medicareconnect.com',
    specialization: 'Orthopedics',
    qualifications: 'MD, FAAOS',
    experience: 18,
    consultationFee: 130,
    hospitalName: 'Metro Orthopedic Hospital',
    availableDays: ['Wednesday', 'Friday'],
    availableSlots: ['10:00', '11:30', '14:00', '16:00'],
  },
  {
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@medicareconnect.com',
    specialization: 'Dermatology',
    qualifications: 'MD, FAAD',
    experience: 8,
    consultationFee: 100,
    hospitalName: 'Skin Health Center',
    availableDays: ['Monday', 'Wednesday', 'Saturday'],
    availableSlots: ['09:00', '10:30', '13:00'],
  },
  {
    name: 'Dr. David Thompson',
    email: 'david.thompson@medicareconnect.com',
    specialization: 'General Medicine',
    qualifications: 'MD, MBBS',
    experience: 20,
    consultationFee: 80,
    hospitalName: 'Community Health Hospital',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    availableSlots: ['08:30', '09:30', '10:30', '11:30'],
  },
  {
    name: 'Dr. Lisa Park',
    email: 'lisa.park@medicareconnect.com',
    specialization: 'Gynecology',
    qualifications: 'MD, FACOG',
    experience: 14,
    consultationFee: 110,
    hospitalName: "Women's Care Medical Center",
    availableDays: ['Tuesday', 'Thursday', 'Saturday'],
    availableSlots: ['09:00', '11:00', '14:00'],
  },
];

const seedDoctors = async () => {
  const uri = process.env.MONGODB_URI;
  const password = process.env.SEED_DOCTOR_PASSWORD || DEFAULT_PASSWORD;

  if (!uri) {
    console.error('MONGODB_URI is not defined');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for doctor seeding');

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    let created = 0;
    let skipped = 0;

    for (const sample of SAMPLE_DOCTORS) {
      const email = sample.email.toLowerCase();

      const existingDoctor = await Doctor.findOne({ doctorName: sample.name });
      if (existingDoctor) {
        skipped += 1;
        continue;
      }

      const user = await User.findOneAndUpdate(
        { email },
        {
          name: sample.name,
          email,
          role: 'doctor',
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

      await Doctor.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          doctorName: sample.name,
          specialization: sample.specialization,
          qualifications: sample.qualifications,
          experience: sample.experience,
          consultationFee: sample.consultationFee,
          hospitalName: sample.hospitalName,
          availableDays: sample.availableDays,
          availableSlots: sample.availableSlots,
          verificationStatus: 'verified',
        },
        {
          upsert: true,
          returnDocument: 'after',
          setDefaultsOnInsert: true,
        }
      );

      created += 1;
      console.log(`  Seeded: ${sample.name} (${sample.specialization})`);
    }

    console.log(`\nDoctor seed complete — ${created} created, ${skipped} skipped`);
    console.log(`Default doctor password: ${password}`);
  } catch (error) {
    console.error('Doctor seed failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedDoctors();
