# Orion — Structure Notes

Rebuild of Orion (from the B.Tech report by Pratibha Sharma &
Shubhnish Verma, ABSSIT Meerut) in the NEW structure from the architecture
PDF *Orion — MERN Stack Architecture*: one root project
`farm-picked/` with two fully separate apps. Business logic was ported
from the earlier verified builds; the folder layout is new and follows the
PDF.

## Final tree (abridged)

```
farm-picked/
├── README.md  STRUCTURE_NOTES.md  .gitignore
├── backend/                       Node + Express (port 5000)
│   ├── package.json  .env.example  README.md
│   ├── src/
│   │   ├── server.js  app.js      (app: cors, /api/v1 routes, health, 404, error handler)
│   │   ├── config/     database.js (Mongoose connect), env.js (env validation)
│   │   ├── models/     User, Category, Product, Cart, Order, Payment,
│   │   │               Address, Feedback, ContactRequest  (*.model.js)
│   │   ├── modules/    auth, users, products, categories, cart, orders,
│   │   │               payments, addresses, feedback, contact, admin
│   │   │               (each: .routes.js .controller.js .service.js .validation.js)
│   │   ├── middleware/ authenticate.js (JWT→401), authorize.js (role→403),
│   │   │               validate.js, errorHandler.js ({success:false,message})
│   │   ├── utils/      pricing.js, pagination.js, token.js, ApiError.js,
│   │   │               constants.js, sendEmail.js (Resend + DEV MODE)
│   │   └── seed/       seed.js, seedData.js (30 products)
│   └── tests/          api.test.js (36 tests), helpers.js
└── frontend/                      React + Vite + Tailwind (port 5173)
    ├── package.json  .env.example  README.md  index.html
    ├── tailwind.config.js  postcss.config.js  vite.config.js  public/
    └── src/
        ├── main.jsx  App.jsx  index.css (@tailwind + tiny custom)
        ├── assets/logo.svg
        ├── components/ common (Loader, Toast, Pagination, RatingStars),
        │               layout (Navbar, Footer),
        │               products (ProductCard, ProductSection, CategoryTiles)
        ├── layouts/    PublicLayout, CustomerLayout, AdminLayout
        ├── pages/      user (7), customer (7), admin (9),
        │               auth (Login, Register, VerifyEmail)
        ├── routes/     AppRoutes, ProtectedRoute, AdminRoute
        ├── services/   api, authService, productService, cartService,
        │               orderService, customerService, adminService
        ├── context/    AuthContext, CartContext
        ├── hooks/      useAuth, useCart, useFetch
        └── utils/      format.js, validators.js
```

Every backend module ships all four files (routes/controller/service/
validation) — none were omitted. Collections follow the PDF list; the
PDF's separate `customerprofiles` collection is implemented as profile
fields + addresses on the single User model (the PDF also states user
data is stored in one users collection — one model, `role: customer|admin`).

## API endpoints — 54

Counted from the route files: health 1 · auth 8 · users 2 · categories 5 ·
products 6 · cart 5 · addresses 4 · orders 5 · payments 2 · feedback 2 ·
contact 1 · admin 13. Full table in `backend/README.md`.

## Email OTP verification (Resend) — flow

1. `POST /auth/register` → user created with `isEmailVerified=false`; a
   6-digit OTP is generated, stored **SHA-256 hashed**
   (`emailOtpHash`, `emailOtpExpiresAt` +10 min, `emailOtpAttempts`,
   `emailOtpLastSentAt`) and emailed via **Resend** (official `resend`
   package, branded HTML template). Response: 201, **no token**.
2. `POST /auth/verify-email {email, otp}` → checks hash, expiry and the
   **5-attempt** limit; success clears the OTP fields, sets
   `isEmailVerified=true`, returns JWT + user (login shape).
3. `POST /auth/resend-otp {email}` → fresh OTP (old one invalidated),
   **60-second cooldown → 429**.
4. `POST /auth/login` → **403 "Email not verified…"** for unverified
   accounts. The seeded admin is pre-verified; registered customers are not.
5. No `RESEND_API_KEY` → **DEV MODE**: the email service logs
   `[DEV MODE — no RESEND_API_KEY] OTP for <email>: <otp>` to the console
   and (only when NODE_ENV ≠ production) records the mail in an in-memory
   array the tests read. There is **no HTTP endpoint that returns OTPs**.
6. Frontend: Register → `/verify-email` screen (6-box OTP input, Verify,
   Resend with 60 s countdown) → session adopted → Customer Dashboard.
   Login shows a "Verify email" link on the not-verified error.
7. Setup + the honest Resend test-mode limitation (free/test mode delivers
   only to the Resend account owner's email until a domain is verified)
   are documented in root + backend READMEs.

## What the admin can manage (all server-enforced)

- Dashboard + sales statistics (revenue excl. cancelled, orders by status,
  top products, low stock)
- Products: create / edit / stock update / deactivate
- Categories: create / edit / delete (deactivates when products exist)
- **Customers: list (search + pagination), view one with their orders &
  total spent, block / unblock.** A blocked customer cannot log in and
  their existing tokens are refused (403). The admin cannot block their
  own account. Customers are never hard-deleted — order history is kept.
- Orders: list with status filter, advance status along the lifecycle
  (no skipping), cancel (restores stock)
- Payment records: list, filter by status/method
- Feedback: list, delete/moderate
- Contact requests: list, mark resolved, delete
- Own account security: change password (bcrypt)

## Verification — REAL results (run on this machine, 2026-10-23)

- **Backend tests:** `npx jest --runInBand --forceExit` in `backend/`
  (same as `npm test`) → **Test Suites: 1 passed, Tests: 36 passed,
  36 total, exit 0.** Covers: seed logins, wrong password 401, /me;
  **9 OTP tests** (register-unverified + OTP recorded in dev mode, login
  blocked 403, wrong OTP, resend 429 cooldown, correct OTP verifies + JWT,
  login after verify, resend invalidates old OTP, expired OTP rejected,
  register validation/duplicate); public catalogue (30 products, search,
  category filter); role guards (guest 401 on cart/orders/profile,
  customer 403 on admin, admin-login rejects customer); cart re-pricing,
  order totals with tampered client totals ignored, stock decrement,
  free delivery above ₹499, over-stock rejection, cross-customer 404,
  my orders + profile, address CRUD; admin dashboard stats, category CRUD,
  product CRUD + stock, **customer block → login 403 → unblock**, admin
  self-block refusal, lifecycle no-skip + cancel restores stock, payments
  list/filter + my-payments, feedback submit/list/delete, contact
  submit/resolve/delete, change-password.
  - Two environment notes: (1) the first run failed because
    mongodb-memory-server could not download its MongoDB binary (network
    TLS error) — the binary cached by the earlier project was copied into
    this project's cache and the suite then passed; on a normal machine
    `npm install`/`npm test` downloads it automatically.
    (2) One real bug found & fixed by the suite: `connectDB()` now reuses
    an already-active Mongoose connection instead of reconnecting.
- **Boot smoke test:** seeded an in-memory MongoDB, then spawned the real
  `node src/server.js` as a separate process (port 5055) and curled it:
  server logged "Orion API listening on port 5055"; `GET /health` →
  `{success:true}`; `GET /products?limit=100` → **total 30**; demo login
  → success (role customer, isEmailVerified true); wrong password → 401;
  guest `GET /cart` → 401. **Passed.**
- **Frontend:** `npm install` OK; `npm run build` (Vite 5.4) →
  **89 modules transformed, build exit 0** (dist/index.html 0.50 kB,
  CSS 22.38 kB — Tailwind really compiled, JS 281.86 kB).
  `npm run preview` → `GET /` **200** (correct page title), `GET /login`
  200 (SPA fallback), JS asset 200.
- **Not run:** a browser click-through of the new frontend against the
  new backend (no browser session in this environment). All screens call
  the real API through the services layer; the API contract they use is
  the one covered by the 36 backend tests + smoke test above.

## Gaps / decisions, plainly labelled

- **Payments are mock records.** No live gateway (Razorpay/Stripe) is
  integrated — card/UPI create a Payment row marked `paid` via a mock
  gateway reference; COD is `pending-collection` until delivery. Real
  gateway keys + webhooks are future work.
- **Images are URLs.** Product `imageUrl` is a stored URL (emoji fallback
  in the UI). No Cloudinary upload pipeline is implemented — the PDF lists
  "Cloudinary or equivalent" as the storage choice; wiring uploads needs
  an account + keys from the user.
- **Delivery slots** are fixed windows (7–10 AM, 12–3 PM, 5–8 PM) stored
  on the order — there is no separate slot-capacity collection (the PDF's
  collection list does not include one).
- **OTP hashing uses SHA-256** (fast hash + 10-minute expiry + 5-attempt
  cap + cooldown), as permitted by the brief ("bcrypt or sha256").
- The `resend` package is pinned at `^4.0.0` (its current API:
  `new Resend(key)`, `resend.emails.send(...)`).
- Frontend has **no mock/offline mode** by design (API-first per the
  PDF): without the backend running, pages show a clear "could not reach
  the API" error state.

## Update — Orion rebrand (name + logo only)
- The project is rebranded **Orion** (formerly Farm Picked): new constellation-O + leaf logo in `frontend/src/assets/logo.svg` (lockup) and `logo-icon.svg` (icon, also `frontend/public/favicon.svg`); brand name updated across navbar, layouts, footer, auth pages, About/Contact/Services/Feedback, page title, and the backend OTP email template + `EMAIL_FROM` default (`Orion <onboarding@resend.dev>`). Routes, API URLs and storage keys are unchanged.
- UI/design is unchanged from the original build — the rebrand swaps only the logo graphic and the name text in the same positions and styles (dark admin sidebar, original dashboard cards).
- Product images are real uploads, not URLs: the admin product form uploads via `POST /api/v1/products/upload-image` (Multer, images only, **max 5 MB**) and stores the returned `imageUrl` on the product. Files are stored locally in `backend/uploads/products/` and served at `/uploads/...`. Storage is isolated in `backend/src/utils/imageStorage.js` — swap that one module to Cloudinary later (no route/UI changes needed). Uploaded files themselves are not part of the source ZIP (only `uploads/products/.gitkeep`).

## Update — Guests are view-only + Customer panel (like Admin)

- **Guests (not logged in) are view-only.** They can browse/search the
  catalogue, open product details, and read pages/reviews — but there is
  NO guest cart anywhere in the app:
  - `CartContext` is server-cart only; `add()` returns
    `{ needsLogin: true }` for guests and nothing is ever written to a
    guest/local cart (localStorage holds only the session token + user).
  - `ProductCard` and the Product Detail page show a **"🔑 Login to
    Order"** button to guests (clicking it also toasts and routes to
    `/login` with an explanatory message). Logged-in customers keep the
    normal "Add to Cart".
  - The navbar cart link for guests points to `/login` and shows no
    badge/count (guests have no count). Customers see `/cart` + badge.
  - `/cart` and `/checkout` sit behind `ProtectedRoute`: a guest opening
    them is redirected to `/login`; the backend cart API also 401s
    without a token (verified in the backend test suite).
- **Customers get a full panel like the Admin panel.**
  `src/layouts/CustomerLayout.jsx` now mirrors `AdminLayout`: dark-green
  (`bg-farm-950`) left sidebar with the Orion logo icon + "Orion" +
  **MY ACCOUNT** subtitle, emoji menu with active-item highlight
  (`bg-farm-500`), and a footer with the customer's name · CUSTOMER,
  email, and Logout. On mobile it collapses to the same farm-950 top bar
  + farm-900 horizontal menu strip Admin uses. Customer modules in the
  sidebar:
  - **Dashboard** (`/customer/dashboard`) — greeting with the customer's
    name + stat cards in the Admin dashboard style (Total Orders, Orders
    Delivered, Items in Cart, Total Spent = sum of non-cancelled orders),
    a Recent Orders list (latest 5, status pills) and quick links
    (Continue Shopping, Track Orders, Review My Cart). All figures are
    computed live via `orderService`/`customerService`/cart context.
  - **Shop Products** (`/products` — the storefront listing),
    **My Cart** (`/cart`, with count badge), **My Orders**
    (`/customer/orders`), **My Addresses** (`/customer/addresses`),
    **My Profile** (`/customer/profile`, incl. change password),
    **Feedback** (`/feedback`).
  - After login, customers land on
    `/customer/dashboard`; admins still land on `/admin`.
- No backend changes were needed for this update — cart endpoints already
  required auth; the gating is frontend + the existing server 401/403s.

## Update — Single login page + admin from .env + guests see basic details

- **One login page for admin and customer.** `/login` is the only login
  route/form: the old Customer/Admin mode toggle on the login page is gone,
  and the form posts to the single `POST /auth/login` endpoint. The
  response role drives the redirect (admin → `/admin`, customer →
  `/customer/dashboard` or the page they were sent from). Wrong
  password, blocked-account and unverified-email (→ Verify Email) handling
  is unchanged. The frontend `adminLogin` service/context helpers were
  removed; the backend `POST /auth/admin/login` route remains only as a
  backwards-compatible alias for the existing test suite — the UI never
  calls it. Login itself is always a database password check; there is no
  env-based bypass in the auth flow.
- **Admin account comes from `backend/.env`.** `.env.example` documents
  `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` ("Set your own admin
  login here, then run: npm run seed"). The seed upserts the admin: it
  creates it with the env values, or — if an admin with that email already
  exists — updates its name + password hash in place (plus role/verified/
  active), so editing the env value and re-running `npm run seed` changes
  the admin password without touching the login flow. (Superseded by the
  clean-start update below: the fallbacks and all other seeded data were
  later removed entirely.)
- **Guests see only BASIC product details** (refines the view-only update
  above: product reviews on product pages are no longer guest-visible).
  Implemented in the UI via `AuthContext` (`user == null` ⇒ guest); the
  public products API is unchanged.
  - `ProductCard`: guests see image/emoji, name, category and price/unit
    only — the stock label is rendered for logged-in users only, and the
    guest button is always an enabled "🔑 Login to Order" (never a
    stock-revealing disabled state).
  - `ProductDetail`: guests see the image, category, name, price/unit,
    quantity picker and "🔑 Login to Order", plus a "🔒 Login to see full
    details" note where the description would be. The description, stock
    line, delivery/payment promises block and the entire Customer Reviews
    section (list + write-a-review form) are NOT rendered for guests at
    all. Customers and admin see the page exactly as before.

## Update — Zepto/Blinkit-style storefront (fruits & vegetables only)

The shopping experience (public + customer storefront) now follows the
quick-commerce layout pattern of Zepto/Blinkit, in Orion's green brand.
Admin panel and the customer sidebar dashboard are unchanged; all routes,
services and role rules (guest view-only + basic details, single login,
OTP) are intact.

- **Header** (`components/layout/Navbar.jsx`): sticky white bar — Orion
  logo, a "Delivery in Meerut / Home — Meerut" block, a wide rounded
  search bar (the existing product search), and on the right: Login /
  Register for guests, the account chip for logged-in users, and a
  prominent GREEN cart button showing item count + item total for
  customers (guests' cart button routes to `/login`). A slim links row
  (Home/Products/Services/About/Contact, My Orders/My Account) sits
  under the main bar.
- **Category strip** (`components/products/CategoryStrip.jsx`):
  horizontally scrollable emoji tiles for All + the real categories from
  the API (Fruits, Vegetables). On Home they link to the category
  listing; on the Products page they drive the existing `?category=`
  filter with an active state.
- **Home**: category strip, a green gradient hero banner (fresh fruits &
  vegetables in Meerut, slot/COD chips, CSS/emoji art only), "Shop by
  Category" tiles, horizontal product SHELVES grouped by category
  (Fresh Fruits, Fresh Vegetables + Deals of the Week / Big Packs /
  ₹30 Corner rails) and an "All Products" grid.
- **Product card** (`components/products/ProductCard.jsx`): white
  rounded-2xl card, image/emoji area on top, 2-line name, category,
  "1 <unit>" pack label, bold price (+ "per unit"), and for customers a
  green-outlined **ADD** button that becomes a green **− qty +** stepper
  wired to the existing server cart (`add`/`update`; stepping below 1
  removes the item). Guests keep the basic-info rule and get a full-width
  "🔑 Login to Order" button. The catalogue has **no MRP field**, so —
  deliberately — there is no discount badge or struck-through price;
  none was invented.
- **Cart page**: Blinkit-style single items card (thumb, name, pack
  size, green stepper, line total, remove) + a **Bill details** card
  (Item total, Delivery charge ₹40 / FREE above ₹499 with the
  add-more-for-free-delivery hint, Grand total) and a delivery-info
  card. Checkout keeps all existing logic (address book, slot, COD /
  mock card / UPI) with its summary relabelled to the same Bill details
  wording. All totals remain server-computed.

## Update — Clean start: ALL dummy data removed + guest header delivery block

- **The store now starts EMPTY and real.** The seed's only job is to
  upsert the single admin from `ADMIN_NAME` / `ADMIN_EMAIL` /
  `ADMIN_PASSWORD` in `backend/.env`. It creates **no** products,
  categories, customers, orders, payments, feedback or contact requests,
  and it no longer wipes collections either.
  - `src/seed/seedData.js` (the 30 demo products dataset) is **deleted**;
    `src/seed/seed.js` was rewritten around the admin upsert only.
  - **No fallback credentials:** if `ADMIN_EMAIL` or `ADMIN_PASSWORD` is
    missing, the seed prints "Set ADMIN_EMAIL and ADMIN_PASSWORD in
    backend/.env, then run `npm run seed` again", exits non-zero and
    creates nothing.
  - `.env.example` now ships obvious placeholders for the ADMIN_* values
    with a "REQUIRED before seeding" note.
- **Tests no longer touch the seed or any demo account.** The Jest suites
  build their own fixtures via `tests/helpers.js` `createFixtures()` (1
  admin + 4 customers @test.local, 2 categories, 4 products, 4 orders
  with payments, 3 feedback) directly through the models. Suite result
  after the refactor: **41/41 passing**.
- **Frontend demo traces removed:** the Login page's one-tap demo buttons
  and displayed demo credentials are gone (the single form stays); the
  hardcoded Fruits/Vegetables fallback lists in `CategoryStrip`,
  `CategoryTiles` and the admin Products category dropdown are removed —
  they now reflect only real API data.
- **Empty states for a fresh store:** Home hides the category tiles and
  shelves and shows a "🌱 Fresh products are on the way — please check
  back soon" card; the Products page shows "No products available yet"
  when no filter is active (filtered searches keep the "no match"
  wording); the category strip shows just "All" when no categories
  exist; the admin dashboard computes live from the DB, so all-zero
  stats render normally.
- **Header delivery block is signed-in only.** The "Delivery in Meerut"
  block in `Navbar.jsx` renders only when a user is logged in
  (`AuthContext`); guests no longer see it, customers keep it in the same
  position. Other Meerut mentions (hero, About, footer) are untouched.
- **Verified live** (fresh in-memory MongoDB): seed without ADMIN_* →
  exit 1 + instruction, DB counts all 0; seed with ADMIN_* → users=1
  (only the env admin), products=0, categories=0, orders=0, and a re-run
  keeps users=1. Browser flow: guest home shows the empty state with no
  delivery block; the env admin created category "Fresh Fruits" and
  product "Alphonso Mango" (₹450/kg, stock 50, uploaded image) in the
  Admin panel, and the product immediately listed on the public
  storefront. Screenshots: `~/workspace/your_files/orion-clean-start/`.
