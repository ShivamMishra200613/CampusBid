# CampusBid — Production Deployment Guide

This guide provides exact, step-by-step instructions to deploy CampusBid to production using free-tier cloud providers:

- **Database:** MongoDB Atlas (M0 Free Tier)
- **Backend API & Real-time WebSockets:** Render (Free Web Service)
- **Frontend SPA:** Vercel (Hobby Tier)

---

## Architecture Overview

```
 [Browser / Mobile Client]
            │
            ├── HTTPS ──> Vercel CDN (React 19 SPA, Tailwind CSS)
            │
            └── WSS / HTTPS ──> Render Web Service (Express 4, Socket.IO)
                                        │
                                        └── TLS ──> MongoDB Atlas M0 Cluster
```

---

## Step 1: MongoDB Atlas Database Setup

1. **Create Account & Cluster:**
   - Sign up or log in at [cloud.mongodb.com](https://cloud.mongodb.com).
   - Create a new project named `CampusBid`.
   - Deploy a free database: Choose **M0 Free Tier**, provider **AWS**, region `ap-south-1` (Mumbai) or closest to your location.

2. **Configure Database Access:**
   - In the left sidebar, navigate to **Security** → **Database Access**.
   - Click **Add New Database User**.
   - Authentication Method: **Password**.
   - Username: `campusbid_admin`.
   - Password: Click **Autogenerate Secure Password** and copy it safely.
   - Built-in Role: **Read and write to any database**. Click **Add User**.

3. **Configure Network Access:**
   - In the left sidebar, navigate to **Security** → **Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) since cloud hosts (Render/Vercel) have dynamic outbound IP ranges.
   - Click **Confirm**.

4. **Copy MongoDB Connection URI:**
   - Navigate to **Databases** → Click **Connect** next to your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the connection string. It resembles:
     ```
     mongodb+srv://campusbid_admin:<password>@cluster0.abcde.mongodb.net/campusbid?retryWrites=true&w=majority&appName=Cluster0
     ```
   - Replace `<password>` with your database user password, and set the database name to `campusbid`.

---

## Step 2: Render Server Deployment (Express + Socket.IO)

1. **Create Account:**
   - Sign up at [render.com](https://render.com) using your GitHub account.

2. **Create Web Service:**
   - Click **New +** → **Web Service**.
   - Connect your GitHub repository: `ShivamMishra200613/CampusBid`.
   - Set the following configuration parameters:
     - **Name:** `campusbid-api`
     - **Region:** `Oregon (US West)` or `Singapore`
     - **Root Directory:** `server`
     - **Runtime:** `Node`
     - **Build Command:** `npm ci`
     - **Start Command:** `node src/server.js`
     - **Plan Type:** `Free`

3. **Configure Environment Variables in Render:**
   In the **Environment Variables** tab, add:

   | Variable           | Value                             | Description                                      |
   | ------------------ | --------------------------------- | ------------------------------------------------ |
   | `NODE_ENV`         | `production`                      | Enables production optimizations & logging       |
   | `PORT`             | `10000`                           | Render internal listener port                    |
   | `MONGO_URI`        | `mongodb+srv://...`               | Your MongoDB Atlas connection URI from Step 1    |
   | `JWT_SECRET`       | _(64-char random string)_         | Secret for signing HS256 tokens                  |
   | `JWT_EXPIRES_IN`   | `7d`                              | Token lifetime                                   |
   | `CLIENT_ORIGIN`    | `https://campusbid-pi.vercel.app` | _Update with your actual Vercel URL from Step 3_ |
   | `AUCTION_SWEEP_MS` | `10000`                           | Sweeper interval (10 seconds)                    |
   | `ADMIN_EMAIL`      | `admin@ves.ac.in`                 | Seeded admin email                               |
   | `ADMIN_PASSWORD`   | `YourSecureAdminPass123!`         | Initial administrator password                   |

4. **Health Check Path:**
   - Under **Advanced**, set **Health Check Path** to `/health`.
   - Click **Create Web Service**.
   - Once deployed, copy your service URL (e.g., `https://campusbid-api.onrender.com`).

---

## Step 3: Vercel Frontend Deployment (React SPA)

1. **Create Account:**
   - Sign up at [vercel.com](https://vercel.com) using your GitHub account.

2. **Import Project:**
   - Click **Add New...** → **Project**.
   - Import `ShivamMishra200613/CampusBid`.
   - Configure project settings:
     - **Framework Preset:** `Vite`
     - **Root Directory:** `client`
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`

3. **Configure Environment Variables in Vercel:**
   - Under **Environment Variables**, add:
     - `VITE_API_URL`: `https://campusbid.onrender.com/api/v1` (Your Render backend URL with `/api/v1`)
     - `VITE_SOCKET_URL`: `https://campusbid.onrender.com` (Optional override; client automatically derives this origin from `VITE_API_URL`)
   - Click **Deploy** (or trigger a Redeploy if already imported).

4. **Sync CORS Origin in Render:**
   - Copy your live Vercel domain (e.g., `https://campusbid-pi.vercel.app`).
   - In Render Dashboard → `campusbid` web service → **Environment**.
   - Ensure `CLIENT_ORIGIN` matches your exact Vercel URL:
     - `CLIENT_ORIGIN`: `https://campusbid-pi.vercel.app` (no trailing slash)
   - Click **Save Changes** (Render will automatically restart the service).

---

## Step 4: Initial Database Seeding

Run the seed script from your local terminal targeting the MongoDB Atlas production cluster:

```bash
cd server
NODE_ENV=development MONGO_URI="mongodb+srv://campusbid_admin:<password>@cluster0.abcde.mongodb.net/campusbid?retryWrites=true&w=majority" npm run seed
```

> **Note:** The seed script requires `NODE_ENV=development` as a safety guard to prevent accidental production wipeouts. Running it once initializes the collections with demo students, products, bids, and the administrator account.

---

## Understanding Free-Tier Cold Starts & WebSockets

### 1. Render Free-Tier Cold Starts

- **Behavior:** Render free web services spin down after 15 minutes of inactivity.
- **Wake-up Time:** When a user visits the app after a sleep period, the first request may take 30 to 50 seconds to complete while the container boots.
- **Remedy / Presentation Tip:** 5 minutes before your viva demonstration, visit `https://campusbid-api.onrender.com/health` in your browser. This will wake up the instance so it remains warm and blazing fast during your evaluation.

### 2. WebSockets & Fallback

- Render free tier natively supports WebSocket connections through Socket.IO.
- CampusBid configures `transports: ['websocket', 'polling']`, ensuring seamless fallback to HTTP long-polling if a collegiate proxy or firewall blocks WebSocket traffic.

---

## Smoke-Test Verification Checklist

Once deployed, execute this 5-minute smoke test to verify full end-to-end functionality:

- [ ] **Health Check:** Open `https://<render-url>/health` in your browser. Returns `{"status":"ok","database":"connected",...}` with HTTP 200.
- [ ] **Catalog Page:** Open `https://<vercel-url>/`. Seeded auction listings appear with images, categories, and current bids.
- [ ] **Student Registration:** Click "Sign In" → "Create an account". Register a new user with `@ves.ac.in`. Successfully lands on Home authenticated.
- [ ] **Search & Filter:** Type a keyword in search and toggle a category filter. Catalog filters instantly.
- [ ] **Place a Bid:** Open any live auction listing. Place a bid above the minimum increment. Current bid flashes and updates immediately.
- [ ] **Real-time Across 2 Tabs:** Open the same live auction in an Incognito window. Place a higher bid. The first window updates the price and recent bid log without refreshing.
- [ ] **Admin Login:** Log in as `admin@ves.ac.in`. Navigate to `/admin`. Analytics KPIs, pending approvals, and user directory load accurately.
