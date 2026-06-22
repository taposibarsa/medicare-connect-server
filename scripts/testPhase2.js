require('dotenv').config();

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const BASE = 'http://localhost:5000';
let passed = 0;
let failed = 0;

const assert = (name, condition, detail = '') => {
  if (condition) {
    passed += 1;
    console.log(`  PASS: ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

const getToken = async (email) => {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: email.toLowerCase() });
  await mongoose.disconnect();
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const req = async (method, path, { token, body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

const run = async () => {
  console.log('\nPhase 2 API Tests\n');

  const adminToken = await getToken('admin@medicareconnect.com');
  const patientToken = await getToken('patient@test.com');
  const doctorToken = await getToken('sarah.mitchell@medicareconnect.com');

  await mongoose.connect(process.env.MONGODB_URI);
  const sarahDoctor = await Doctor.findOne({ doctorName: 'Dr. Sarah Mitchell' });
  const jamesDoctor = await Doctor.findOne({ doctorName: 'Dr. James Chen' });
  await mongoose.disconnect();

  const doctorId = sarahDoctor?._id?.toString();
  const flowDoctorId = jamesDoctor?._id?.toString();
  const flowDoctorToken = await getToken('james.chen@medicareconnect.com');

  // Public endpoints
  let r = await req('GET', '/api/health');
  assert('GET /api/health → 200', r.status === 200);

  r = await req('GET', '/api/stats');
  assert('GET /api/stats → 200', r.status === 200 && r.data.data?.totalDoctors !== undefined);

  r = await req('GET', '/api/doctors?page=1&limit=9&search=cardio&sort=fee_asc');
  assert('GET /api/doctors search/sort/pagination', r.status === 200 && Array.isArray(r.data.data));

  r = await req('GET', '/api/doctors/featured');
  assert('GET /api/doctors/featured → 200', r.status === 200 && Array.isArray(r.data.data));

  if (doctorId) {
    r = await req('GET', `/api/doctors/${doctorId}`);
    assert('GET /api/doctors/:id → 200', r.status === 200 && r.data.data?.doctorName);
  }

  r = await req('GET', '/api/reviews');
  assert('GET /api/reviews → 200', r.status === 200);

  // Auth required
  r = await req('GET', '/api/appointments');
  assert('GET /api/appointments no token → 401', r.status === 401);

  r = await req('GET', '/api/users/me', { token: patientToken });
  assert('GET /api/users/me → 200', r.status === 200 && r.data.data?.role === 'patient');

  // Role enforcement
  r = await req('GET', '/api/users', { token: patientToken });
  assert('GET /api/users as patient → 403', r.status === 403);

  r = await req('GET', '/api/admin/analytics', { token: adminToken });
  assert('GET /api/admin/analytics as admin → 200', r.status === 200 && Array.isArray(r.data.data?.doctorPerformance));

  if (doctorId) {
    r = await req('PATCH', `/api/doctors/${doctorId}/verify`, { token: doctorToken });
    assert('PATCH verify as doctor → 403', r.status === 403);
  }

  // Appointment business rules
  if (flowDoctorId) {
    r = await req('POST', '/api/appointments', {
      token: patientToken,
      body: {
        doctorId: flowDoctorId,
        appointmentDate: '2026-09-01T00:00:00.000Z',
        appointmentTime: '09:00',
        symptoms: 'Test',
        paymentStatus: 'unpaid',
      },
    });
    assert('POST appointment unpaid → 400', r.status === 400);
    r = await req('POST', '/api/appointments', {
      token: patientToken,
      body: {
        doctorId: flowDoctorId,
        appointmentDate: '2026-09-10T00:00:00.000Z',
        appointmentTime: '11:00',
        symptoms: 'Test',
        paymentStatus: 'paid',
      },
    });
    assert('POST appointment paid → 201', r.status === 201, `got ${r.status}: ${r.data.message}`);

    const apptId = r.data.data?._id;
    const patientId = r.data.data?.patientId?._id || r.data.data?.patientId;

    r = await req('POST', '/api/appointments', {
      token: patientToken,
      body: {
        doctorId: flowDoctorId,
        appointmentDate: '2026-09-10',
        appointmentTime: '11:00',
        symptoms: 'Duplicate',
        paymentStatus: 'paid',
      },
    });
    assert('POST duplicate slot (mixed date formats) → 409', r.status === 409);

    if (apptId) {
      r = await req('PATCH', `/api/appointments/${apptId}/accept`, { token: flowDoctorToken });
      assert('PATCH accept → 200', r.status === 200);

      r = await req('PATCH', `/api/appointments/${apptId}/complete`, { token: flowDoctorToken });
      assert('PATCH complete → 200', r.status === 200);

      r = await req('POST', '/api/reviews', {
        token: patientToken,
        body: { doctorId: flowDoctorId, rating: 5, reviewText: 'Great doctor!' },
      });
      assert('POST review after completed → 201', r.status === 201);

      r = await req('POST', '/api/reviews', {
        token: patientToken,
        body: { doctorId: flowDoctorId, rating: 4, reviewText: 'Duplicate review' },
      });
      assert('POST duplicate review → 409', r.status === 409);

      r = await req('POST', '/api/prescriptions', {
        token: flowDoctorToken,
        body: {
          patientId,
          appointmentId: apptId,
          diagnosis: 'Hypertension',
          medications: [{ name: 'Med A', dosage: '10mg', duration: '7 days' }],
          notes: 'Rest well',
        },
      });
      assert('POST prescription → 201', r.status === 201, `got ${r.status}: ${r.data.message}`);
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Test runner error:', err.message);
  process.exit(1);
});
