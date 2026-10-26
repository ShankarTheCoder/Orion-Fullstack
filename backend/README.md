# Orion — Backend (Node.js + Express + MongoDB)

REST API for Orion, Meerut's online farm-fresh fruits & vegetables
store. Part of the `farm-picked/` full-stack project — see the root
`README.md` and the architecture PDF (*Orion MERN Stack Architecture*).

- **Stack:** Node.js, Express.js, MongoDB + Mongoose, JWT + bcrypt
- **Modules:** User (public), Customer (authenticated), Admin (restricted) —
  authorization is enforced on the server on every protected endpoint.

## Quick start

```bash
cd farm-picked/backend
npm install
cp .env.example .env      # then edit .env (see below)
npm run seed              # creates ONLY the admin from ADMIN_* in .env — no other data
npm run dev               # http://localhost:5000  (API base: /api/v1)
npm test                  # Jest + Supertest suite (in-memory MongoDB)
```

## Environment (.env)

| Variable | Example | Notes |
|---|---|---|
| `PORT` | `5000` | API port |
| `NODE_ENV` | `development` | |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/farm_picked` | Local MongoDB or Atlas URI |
| `JWT_SECRET` | *(random secret)* | Never commit a real one |
| `JWT_EXPIRES_IN` | `7d` | |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin (the frontend) |
| `RESEND_API_KEY` | *(empty = dev mode)* | See "Email OTP" below |
| `EMAIL_FROM` | `Orion <onboarding@resend.dev>` | OTP sender |

## Email OTP verification (Resend)

New customers must verify their email before they can log in:

```
Register ──► POST /auth/register ──► account created (isEmailVerified=false)
         └─► 6-digit OTP emailed via Resend (hashed at rest, 10-min expiry)
Verify   ──► POST /auth/verify-email { email, otp } ──► verified + JWT returned
Resend   ──► POST /auth/resend-otp { email } ──► fresh OTP (60s cooldown,
             old OTP invalidated, max 5 attempts per OTP)
Login    ──► POST /auth/login ──► 403 "Email not verified…" until verified
```

**To enable real OTP emails:**

1. Sign up at [resend.com](https://resend.com) (free tier is fine).
2. Go to **API Keys → Create API Key** and copy the key.
3. Put it in `backend/.env`: `RESEND_API_KEY=re_xxxxxxxxxxxx`
4. Restart the backend. Registrations now receive a real OTP email from
   `EMAIL_FROM`.

**Honest limitation:** with Resend's free/test setup, the default sender
`onboarding@resend.dev` can only deliver to the email address that owns the
Resend account. To email *any* customer you must verify your own domain in
Resend (Domains → Add Domain → add the DNS records) and set `EMAIL_FROM` to
an address on that domain.

**Dev mode:** if `RESEND_API_KEY` is empty, no email is sent and nothing
crashes — the OTP is printed to the server console with a
`[DEV MODE — no RESEND_API_KEY]` marker so local development and the test
suite work without an account. The seeded admin (below) is pre-verified;
customers who register are not.

## The admin account — the ONLY thing the seed creates

There are **no demo accounts and no sample data**: no products, no
categories, no customers, no orders are ever seeded. The store starts
empty and is stocked by the admin through the app.

The single admin account comes from the `ADMIN_NAME`, `ADMIN_EMAIL` and
`ADMIN_PASSWORD` variables in `backend/.env` (see `.env.example`) — all
three are effectively required:

- Set them, then run `npm run seed` — the seed creates the admin with
  those values. If the admin already exists, re-running the seed
  **updates** its name and password to the env values (that is how you
  change the admin password).
- If `ADMIN_EMAIL` or `ADMIN_PASSWORD` is **missing**, the seed prints
  an error ("Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env, then
  run `npm run seed` again") and exits **without creating anything**.
  There is deliberately no default/fallback admin password.

**One login for everyone:** there is a single login page (`/login`) and a
single login endpoint (`POST /auth/login`) for customers AND the admin —
the account's role decides where the UI lands (admin → admin panel,
customer → customer dashboard). Login always checks the password against
the database; there is no env-based bypass. (`POST /auth/admin/login`
remains only as a backwards-compatible alias used by older tests.)

## API overview (base `/api/v1`)

| Area | Endpoints |
|---|---|
| Health | `GET /health` |
| Auth | `POST /auth/register`, `POST /auth/verify-email`, `POST /auth/resend-otp`, `POST /auth/login`, `POST /auth/admin/login`, `GET /auth/me`, `POST /auth/logout`, `PUT /auth/change-password` |
| Users | `GET/PUT /users/profile` |
| Products | `GET /products` (search/category/deal/sort/pagination), `GET /products/:id`, admin: `POST`, `PUT /:id`, `PATCH /:id/stock`, `DELETE /:id` |
| Categories | `GET /categories`, `GET /categories/:id`, admin: `POST`, `PUT /:id`, `DELETE /:id` |
| Cart (customer only; guests 401) | `GET /cart`, `POST /cart/items`, `PUT /cart/items/:productId`, `DELETE /cart/items/:productId`, `DELETE /cart` |
| Addresses (customer) | `GET/POST /addresses`, `PUT/DELETE /addresses/:id` |
| Orders | `GET /orders/delivery-windows`, `POST /orders`, `GET /orders/my`, `GET /orders/:id`, `PUT /orders/:id/cancel` |
| Payments | `GET /payments/my`, `POST /payments/verify` (mock gateway) |
| Feedback | `GET /feedback`, `POST /feedback` |
| Contact | `POST /contact` |
| Admin | `GET /admin/dashboard`, `GET /admin/customers`, `GET /admin/customers/:id`, `PATCH /admin/customers/:id/status`, `GET /admin/orders`, `PUT /admin/orders/:id/status`, `GET /admin/payments`, `GET /admin/payments/:id`, `GET/DELETE /admin/feedback(/:id)`, `GET /admin/contact-requests`, `PATCH /admin/contact-requests/:id/resolve`, `DELETE /admin/contact-requests/:id` |

**Business rules enforced server-side:** order totals recalculated from DB
prices (delivery ₹40, free above ₹499 — client totals are never trusted);
stock checked before ordering and decremented/restored exactly once; order
lifecycle Placed → Confirmed → Packed → Out for Delivery → Delivered, with
cancellation only from Placed/Confirmed; blocked customers cannot log in;
admins cannot block themselves.

## Project structure

```
backend/
├── src/
│   ├── config/        database.js, env.js
│   ├── models/        User.model.js, Category.model.js, Product.model.js,
│   │                  Cart.model.js, Order.model.js, Payment.model.js,
│   │                  Address.model.js, Feedback.model.js, ContactRequest.model.js
│   ├── modules/       auth/ users/ products/ categories/ cart/ orders/
│   │                  payments/ addresses/ feedback/ contact/ admin/
│   │                  (each: <name>.routes.js, .controller.js, .service.js, .validation.js)
│   ├── middleware/    authenticate.js, authorize.js, validate.js, errorHandler.js
│   ├── utils/         pricing.js, pagination.js, token.js, constants.js,
│   │                  ApiError.js, sendEmail.js (Resend OTP mailer)
│   ├── seed/          seed.js, seedData.js
│   ├── app.js
│   └── server.js
└── tests/             Jest + Supertest (mongodb-memory-server)
```
