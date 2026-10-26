# Orion — Deployment Guide

This guide deploys the **frontend on Vercel** (already live at
https://orion-chi-nine.vercel.app/) and the **backend on Render** (free tier).
Follow it in order on your own accounts.

## Why the live site showed "Failed to fetch" and no products

The frontend is only half of the app. Its API address is the build-time
variable `VITE_API_URL`, which defaults to `http://localhost:5000/api/v1`.
On Vercel, a visitor's browser calls **their own computer's** localhost:5000,
which is empty — so every data request fails and no products or categories
load. The fix is to host the backend at a public URL and point the frontend
at it (steps 1–3 below).

**Also expected, not a bug:** the database is EMPTY by design. All dummy/demo
data was removed from the project, so even after the backend is connected,
products will NOT appear until the admin logs in and adds categories and
products (step 4).

## Step 1 — Deploy the backend on Render (free Web Service)

1. Push this project to GitHub (or use the existing repository).
2. On [Render](https://render.com/), create a **New → Web Service** and
   connect the repository.
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Instance type:** Free
4. Add these **Environment Variables** in the Render dashboard
   (never commit them to the repo):
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — any long random text
   - `RESEND_API_KEY` — your Resend API key (for registration OTP emails)
   - `ADMIN_NAME` — e.g. `Orion Admin`
   - `ADMIN_EMAIL` — the admin login email you want
   - `ADMIN_PASSWORD` — the admin login password you want
   - `CLIENT_URL` — `https://orion-chi-nine.vercel.app`
   - `PORT` — Render assigns this automatically; leave it unset if Render
     manages it, or keep the value Render provides.
5. Deploy and note the service URL, e.g.
   `https://orion-backend-xxxx.onrender.com`.

## Step 2 — Create the admin (run the seed once)

In the Render dashboard, open the service's **Shell** tab and run:

```bash
npm run seed
```

This creates ONLY the admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
If those variables are missing, the seed creates nothing and prints an
instruction — set them first, then run the seed again.

## Step 3 — Point the Vercel frontend at the backend

1. In the Vercel project settings for `orion-chi-nine.vercel.app`, add the
   environment variable:
   - `VITE_API_URL` = `https://<your-render-service-url>/api/v1`
     (replace `<your-render-service-url>` with your real Render URL).
2. **Redeploy** the Vercel project. `VITE_API_URL` is a build-time variable:
   changing it has no effect until Vercel rebuilds the frontend.

## Step 4 — Add your first products

1. Open https://orion-chi-nine.vercel.app/ and log in as the admin
   (the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from Step 1).
2. Admin panel → **Categories** → create categories (e.g. Fresh Fruits,
   Fresh Vegetables).
3. Admin panel → **Products** → add products with photos (image upload,
   up to 5 MB). Products are saved in MongoDB and immediately appear on the
   storefront for guests and customers.

## Notes

- **Direct links work:** `frontend/vercel.json` (and the copy at the repo
  root) rewrites all routes to `index.html`, so typing `/products` or
  `/login` directly no longer returns a Vercel 404.
- **Uploaded product images** are stored on the backend server's disk
  (`backend/uploads/`). On Render's free tier, disk files may be lost when
  the service restarts or redeploys. Cloudinary is the documented swap point
  in `backend/src/utils/imageStorage.js` for persistent image storage later.
- **Free-tier cold starts:** Render's free service sleeps after inactivity,
  so the first request after a pause can take ~30–60 seconds. This is normal
  and not an error in the app.
