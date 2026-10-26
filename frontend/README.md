# Orion — Frontend (React + Vite + Tailwind CSS)

The storefront + customer + admin UI for Orion. Part of the
`farm-picked/` full-stack project — see the root `README.md` and the
architecture PDF (*Orion MERN Stack Architecture*).

- **Stack:** React 18, Vite 5, React Router 6, Tailwind CSS 3
- **Talks to:** the Express API in `../backend` via `VITE_API_URL`
  (default `http://localhost:5000/api/v1`). This app is **API-first** — all
  data comes from the real backend; there is no mock-data layer in this build.

## Quick start

```bash
cd farm-picked/frontend
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:5000/api/v1
npm run dev              # http://localhost:5173
npm run build            # production build into dist/
npm run preview          # serve the production build locally
```

Start the backend first (port 5000, seeded) or every page will report that
the API is unreachable.

## User journeys

- **Guest (User module):** Home, Products (search / category / deals /
  sort), Product detail + reviews, About, Services, Contact, Feedback —
  no account needed. Guests have **no cart**: adding a product sends them
  to Login with an explanation.
- **Customer:** Register → **verify email with the 6-digit OTP** (sent via
  Resend from the backend) → log in → cart, checkout (address + delivery
  slot + COD / card / UPI mock), order tracking + cancellation, profile,
  addresses, reviews.
- **Admin:** separate login → dashboard with sales statistics, products &
  stock, categories, customers (view / block / unblock), orders & status,
  payment records, feedback moderation, contact requests, account security.

## Accounts — no demo accounts

The store starts **empty**: there are no demo accounts, no one-tap demo
login buttons and no seeded products. The backend seed creates **only
the admin**, from `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` in
`backend/.env` (see the root README's "First run" section). Customers
register themselves here and must complete OTP email verification before
their first login.

## Structure

```
frontend/
├── public/  index.html  vite.config.js  tailwind.config.js  postcss.config.js
└── src/
    ├── assets/          logo.svg
    ├── components/
    │   ├── common/      Loader, Toast, Pagination, RatingStars
    │   ├── layout/      Navbar, Footer
    │   └── products/    ProductCard, ProductSection, CategoryTiles
    ├── layouts/         PublicLayout, CustomerLayout, AdminLayout
    ├── pages/
    │   ├── user/        Home, Products, ProductDetail, About, Services, Contact, Feedback
    │   ├── customer/    Dashboard, Profile, Addresses, Cart, Checkout, OrderSuccess, Orders
    │   ├── admin/       Dashboard, Products, Categories, Customers, Orders,
    │   │                Payments, Feedback, ContactRequests, Settings
    │   └── auth/        Login, Register, VerifyEmail (OTP screen)
    ├── routes/          AppRoutes, ProtectedRoute (customer), AdminRoute (admin)
    ├── services/        api.js (fetch client + JWT), authService, productService,
    │                    cartService, orderService, customerService, adminService
    ├── context/         AuthContext, CartContext
    ├── hooks/           useAuth, useCart, useFetch
    └── utils/           format.js, validators.js
```
