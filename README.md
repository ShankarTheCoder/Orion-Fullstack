# Orion — Full Stack (MERN)

Online store for farm-fresh fruits & vegetables in Meerut — built from the
B.Tech project report by **Pratibha Sharma & Shubhnish Verma** (ABSS Institute
of Technology, Meerut), re-implemented on the MERN stack exactly as laid out
in *Orion — MERN Stack Architecture* (the structure PDF):

- **`frontend/`** — React + Vite + Tailwind CSS (port 5173)
- **`backend/`** — Node.js + Express + MongoDB/Mongoose (port 5000,
  REST API under `/api/v1`), JWT + bcrypt auth, **email OTP verification
  via Resend**

The project has **three modules**:

| Module | Who | What |
|---|---|---|
| **User (public)** | Anyone, no account | Home, About, Services, Contact, browse/search products, product details & reviews, register, login, send feedback / contact requests |
| **Customer** | Registered + email-verified user | Profile & addresses, cart, checkout (delivery slot, COD / card / UPI), order history & tracking, cancellations, reviews |
| **Admin** | Store administrator | Sales dashboard, products & stock, categories, **customers (view / block / unblock)**, orders & status, payment records, feedback, contact requests, account security |

Guests have **no account and no cart** — after registering and verifying
their email they become customers. Admin permissions are enforced by
Express middleware on the server, never by hiding pages.

## Deployment (live site)

The frontend is deployed on Vercel at https://orion-chi-nine.vercel.app/.
To make the live site work end-to-end, the backend must be hosted at a
public URL and the frontend pointed at it — the default
`VITE_API_URL=http://localhost:5000/api/v1` only works on a developer's own
computer, and on Vercel it causes "Failed to fetch" with no products listed.
Follow the step-by-step guide in **[DEPLOY.md](DEPLOY.md)** (Render backend
→ run the seed → set `VITE_API_URL` in Vercel → redeploy → admin adds
categories and products). Note the database starts empty by design: products
appear only after the admin adds them.

## Run it (both apps)

### 1. Backend (start this first)

```bash
cd farm-picked/backend
npm install
cp .env.example .env      # set MONGODB_URI, JWT_SECRET, RESEND_API_KEY and ADMIN_* (see below)
npm run seed              # creates ONLY the admin account from ADMIN_* in .env — nothing else
npm run dev               # http://localhost:5000  (health: GET /api/v1/health)
npm test                  # Jest + Supertest suite (uses in-memory MongoDB)
```

There is no local MongoDB bundled — point `MONGODB_URI` at your MongoDB
(local install or Atlas). The test suite does not need one.

### 2. Frontend

```bash
cd farm-picked/frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api/v1
npm run dev               # http://localhost:5173
npm run build             # production build
```

## Email OTP verification (Resend) — how it works

```
Register ─► account created UNVERIFIED ─► 6-digit OTP emailed via Resend
        ─► Verify Email screen (OTP valid 10 minutes, max 5 attempts)
        ─► verified ─► JWT issued ─► login allowed
```

- Login is **blocked with HTTP 403** until the email is verified.
- Resend OTP has a **60-second cooldown** (HTTP 429 if you ask too soon);
  a new OTP invalidates the previous one.
- OTPs are stored **hashed** (SHA-256) on the user — the plain code is
  never stored or returned by any API.

### Get your own Resend API key (2 minutes)

1. Sign up at **https://resend.com**
2. Go to **API Keys → Create API Key**
3. Paste it into `backend/.env`:
   ```
   RESEND_API_KEY=re_your_key_here
   EMAIL_FROM=Orion <onboarding@resend.dev>
   ```
4. Restart the backend.

> **Honest limitation:** with Resend's free/test setup (no verified
> domain), OTP emails are delivered **only to the email address that owns
> the Resend account**. To send OTPs to any customer's inbox, verify your
> own domain in Resend and set `EMAIL_FROM` to an address on that domain.
>
> **No key yet?** The backend does not crash — it runs in **DEV MODE** and
> prints the OTP to the server console (`[DEV MODE — no RESEND_API_KEY]`),
> so you can still register, verify and test the whole flow locally.

## First run — the store starts EMPTY

There are **no demo accounts and no sample data**. `npm run seed` creates
**only the admin** and only from your `backend/.env`:

```bash
# backend/.env — all three are REQUIRED; without ADMIN_EMAIL /
# ADMIN_PASSWORD the seed prints an error and creates nothing.
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@yourstore.com
ADMIN_PASSWORD=set-your-own-password
```

Then:

1. `npm run seed` — creates/updates that single admin (re-running it after
   editing the values updates the admin's name + password).
2. Sign in on the **one login page** (`/login`) with the admin email +
   password — you land in the admin panel.
3. **Admin → Categories** to add your categories, then **Admin →
   Products** to add real products (with an image upload, up to 5 MB).
   Everything is saved in MongoDB and lists on the storefront immediately.
4. Customers register themselves on the site (email OTP verification) —
   nobody is pre-created for them.

The role on the account decides the landing page after login (admin →
admin panel, customer → customer dashboard). Details in `backend/README.md`.

## Business rules (enforced on the server)

- Delivery charge **₹40**, **free above ₹499**; totals are always
  re-calculated from database prices at checkout — client-sent totals are
  ignored.
- Stock is checked and decremented when an order is placed, and restored
  if the order is cancelled (only from *Placed* / *Confirmed*).
- Order lifecycle: Placed → Confirmed → Packed → Out for Delivery →
  Delivered. Steps cannot be skipped.
- Every checkout creates a **Payment** record (COD → `pending-collection`,
  collected on delivery; card/UPI → mock gateway, recorded as `paid`).
  No live payment gateway is integrated.
- Admin can block/unblock customers (a blocked customer cannot log in);
  customers are never hard-deleted, so order history is preserved.

## More documentation

- `backend/README.md` — backend setup, full endpoint table
- `frontend/README.md` — frontend setup, structure, journeys
- `STRUCTURE_NOTES.md` — final tree, endpoint count, what the admin can
  manage, real test/build results and the gaps, plainly labelled
