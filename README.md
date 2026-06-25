# MediCare Connect — Server

Express REST API for MediCare Connect. Handles doctors, appointments, reviews, payments (Stripe), prescriptions, users, and admin analytics.

For full project documentation, setup, and JWT flow, see the [root README](../README.md).

## Quick Start

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

API base: `http://localhost:5000`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Default `5000` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `CLIENT_URL` | Yes | Frontend URL for CORS |
| `STRIPE_SECRET_KEY` | Yes (payments) | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes (payments) | From Stripe CLI or Dashboard |
| `ADMIN_EMAIL` | Seed | Admin email for `npm run seed` |
| `ADMIN_PASSWORD` | Seed | Admin password for seed script |

## Seed Scripts

```bash
npm run seed           # Admin user (Better Auth + Mongoose)
npm run seed:doctors   # Verified sample doctors
npm run seed:patient   # Test patient (patient@test.com)
```

## Stripe Webhook (local)

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

Set `STRIPE_WEBHOOK_SECRET` to the secret printed by the CLI.

## Main Routes

- `GET /api/health` — Health check
- `/api/doctors` — Public doctor listing + doctor/admin mutations
- `/api/appointments` — Role-scoped appointment management
- `/api/payments/checkout` — Stripe Checkout session (patient)
- `/api/payments/webhook` — Stripe webhook (raw body, no JWT)
- `/api/payments/confirm-session` — Post-checkout booking confirmation
- `/api/admin/analytics` — Admin dashboard charts

## Production

- Start command: `npm start`
- Set `CLIENT_URL` to your Vercel frontend URL
- Register Stripe webhook endpoint for `/api/payments/webhook`
