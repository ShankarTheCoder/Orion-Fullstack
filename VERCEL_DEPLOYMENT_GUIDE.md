# Deploying Orion on Vercel (Frontend + Backend)

This guide walks you through deploying both the **React frontend** and the **Express backend** on [Vercel](https://vercel.com).

---

## Architecture Overview

| Component | Platform Layer | Build / Tech | Routing |
|---|---|---|---|
| **Frontend** | Static Edge Network | React 18 + Vite | Single-Page Application (`/index.html` rewrites) |
| **Backend** | Serverless Functions | Node.js + Express | Serverless function handler ([`backend/api/index.js`](file:///Users/shivshankarpandit/Desktop/orion-full-stack/backend/api/index.js)) |
| **Database** | Managed Cloud DB | MongoDB Atlas | Mongoose connection caching |

> [!NOTE]
> The recommended and cleanest way to deploy this full-stack project on Vercel is as **Two Separate Vercel Projects** connected to the same GitHub repository:
> 1. `orion-backend` (Root directory: `backend`)
> 2. `orion-frontend` (Root directory: `frontend`)
>
> This gives each service independent deployment logs, independent environment variables, and fast builds.

---

## Prerequisites

1. **GitHub Repository:** Push your latest code to GitHub:
   ```bash
   git add .
   git commit -m "Configure Vercel serverless deployment"
   git push origin main
   ```
2. **MongoDB Atlas Database:** 
   - A free cloud MongoDB cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
   - In **Atlas Network Access**: Ensure IP `0.0.0.0/0` (Allow access from anywhere) is whitelisted so Vercel's serverless functions can connect.
   - Copy your connection string, e.g.:
     `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/orion?retryWrites=true&w=majority`
3. **Vercel Account:** Sign up or log in at [vercel.com](https://vercel.com).

---

## Step 1: Deploy the Backend on Vercel

1. Log into your **Vercel Dashboard**.
2. Click **Add New… → Project**.
3. Import your **`orion-full-stack`** GitHub repository.
4. In the configuration screen:
   - **Project Name:** `orion-backend` (or your choice)
   - **Framework Preset:** Select **Other**
   - **Root Directory:** Click *Edit* and select **`backend`**
5. **Build and Output Settings:**
   - **Build Command:** Leave as default (`npm run build`)
   - **Output Directory:** Leave default
   - **Install Command:** Leave default (`npm install`)
6. **Environment Variables:**
   Expand **Environment Variables** and add the following keys:

   | Key | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Production mode |
   | `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | *(long random string)* | E.g. `orion_jwt_secret_production_key_32chars` |
   | `CLIENT_URL` | `*` *(or your frontend URL once deployed)* | Allowed CORS origin |
   | `ADMIN_NAME` | `Admin` | Initial admin account name |
   | `ADMIN_EMAIL` | `admin@yourstore.com` | Initial admin email |
   | `ADMIN_PASSWORD` | `your-secure-admin-password` | Initial admin password |
   | `RESEND_API_KEY` | *(optional)* | Your Resend API key for real OTP emails (leave empty for dev/console mode) |

7. Click **Deploy**.
8. Once deployment finishes, note your Backend URL (e.g. `https://orion-backend-xxxx.vercel.app`).
9. **Verify the Backend:**
   - Health check: `https://orion-backend-xxxx.vercel.app/api/v1/health` → returns `{"success":true,"message":"Orion API is running"}`
   - Swagger docs: `https://orion-backend-xxxx.vercel.app/api/v1/docs` → opens interactive Swagger UI!

---

## Step 2: Seed the Admin Account

Because Vercel Serverless Functions do not provide a persistent terminal shell, seed the admin account into your MongoDB Atlas database directly from your local machine:

1. In your local terminal, navigate to the `backend/` directory:
   ```bash
   cd /Users/shivshankarpandit/Desktop/orion-full-stack/backend
   ```
2. Run the seed script pointing to your MongoDB Atlas connection string:
   ```bash
   MONGODB_URI="your-mongodb-atlas-connection-string" \
   ADMIN_EMAIL="admin@yourstore.com" \
   ADMIN_PASSWORD="your-secure-admin-password" \
   npm run seed
   ```
3. You will see:
   ```
   MongoDB connected: cluster0.xxxxx.mongodb.net/orion
   Admin account ready: admin@yourstore.com (role: admin, active, email verified)
   ```
Your admin account is now created in your cloud database!

---

## Step 3: Deploy the Frontend on Vercel

1. Return to the **Vercel Dashboard**.
2. Click **Add New… → Project**.
3. Select the same GitHub repository.
4. In the configuration screen:
   - **Project Name:** `orion-frontend` (or `orion`)
   - **Framework Preset:** **Vite** (auto-detected)
   - **Root Directory:** Click *Edit* and select **`frontend`**
5. **Environment Variables:**
   Add the following environment variable:

   | Key | Value | Notes |
   |---|---|---|
   | `VITE_API_URL` | `https://<your-backend-url>.vercel.app/api/v1` | **Important:** Must include `/api/v1` at the end! |

   *(Replace `<your-backend-url>` with the URL from Step 1).*

6. Click **Deploy**.
7. Once finished, open your Frontend URL (e.g. `https://orion-frontend-xxxx.vercel.app`).

---

## Step 4: Finalize CORS Security

Now that you have both URLs:

1. Open your **Backend project** in the Vercel dashboard.
2. Go to **Settings → Environment Variables**.
3. Edit `CLIENT_URL` and set it to your frontend domain:
   ```
   CLIENT_URL = https://orion-frontend-xxxx.vercel.app
   ```
4. Trigger a **Redeploy** on the backend project for the new environment variable to take effect.

---

## Important Vercel Serverless Details

### 1. Ephemeral File Uploads
- Vercel functions run in an ephemeral serverless container where the filesystem (outside `/tmp`) is read-only and files do not persist across function invocations.
- Product images uploaded to disk (`backend/uploads/`) will disappear when the function goes idle.
- **Recommended for Production:** Use Cloudinary or AWS S3 for persistent image uploads. The backend is already architected with a single swap point in [`backend/src/utils/imageStorage.js`](file:///Users/shivshankarpandit/Desktop/orion-full-stack/backend/src/utils/imageStorage.js).

### 2. MongoDB Atlas Whitelist
- If your backend returns `500 Server Error` or times out, verify in **MongoDB Atlas** that:
  - **Network Access** has IP `0.0.0.0/0` allowed.
  - The database user credentials in `MONGODB_URI` are correct and URL-encoded if passwords contain special characters like `@` or `#`.

### 3. Client-Side Routing
- Both [`frontend/vercel.json`](file:///Users/shivshankarpandit/Desktop/orion-full-stack/frontend/vercel.json) and root [`vercel.json`](file:///Users/shivshankarpandit/Desktop/orion-full-stack/vercel.json) already contain rewrite rules:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
  This ensures direct navigation to `/products`, `/login`, `/admin/customers`, etc. does not return 404 errors.

---

## Verification Checklist

- [ ] Backend health check responds: `GET /api/v1/health`
- [ ] Swagger documentation opens: `GET /api/v1/docs`
- [ ] Frontend loads and displays navbar, banners, and categories
- [ ] Admin login (`/login`) succeeds and redirects to `/admin`
- [ ] Admin Customer CRUD (`/admin/customers`) allows viewing, creating, updating, and status toggling
- [ ] Product creation and category management works
