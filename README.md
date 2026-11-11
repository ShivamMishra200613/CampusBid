# CampusBid - VESIT Online Campus Auction System

CampusBid is a full-stack, real-time campus auction platform tailored specifically for college campuses (VESIT). It enables verified students (`@ves.ac.in`) to list pre-owned textbooks, lab equipment, electronics, and study materials in live reverse/forward timed auctions with instant real-time bidding, automated countdown sweeps, dispute moderation, and role-based access controls.

---

## Technology Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v3, React Router v7, Socket.IO Client, Lucide React
- **State Management**: Idiomatic React Context (`AuthContext`, `AuctionContext`, `SocketContext`, `ToastContext`) with native hooks and reducers
- **Backend**: Node.js, Express v4 (ES Modules), Mongoose v8, Socket.IO, Multer
- **Validation & Security**: Zod schemas on client and server, Bcrypt.js (cost factor 10), JSON Web Tokens (HS256), Helmet headers, Express rate limiting, and CORS origin restriction
- **Database**: MongoDB 7.0 (Mongoose ODM) with compound and text search indexes
- **Containerization & Web Server**: Multi-stage Dockerfiles (`node:22-alpine`, `nginx:alpine`), Docker Compose, Nginx reverse proxy
- **CI/CD & DevOps**: GitHub Actions (lint, build, unit/integration tests, e2e suite, container builds), Render (Express + Socket.IO API), Vercel (React SPA), MongoDB Atlas

---

## Architecture Overview

```
                      +-----------------------------+
                      |       Client Browser        |
                      |   React 19 + Tailwind CSS   |
                      +--------------+--------------+
                                     |
                         HTTP / REST | WebSocket (Socket.IO)
                                     v
                 +-------------------+-------------------+
                 |        Nginx Reverse Proxy            |
                 |      Port 8080 (Docker Compose)       |
                 +---------+-------------------+---------+
                           |                   |
               /api, /uploads, /socket.io      | / (SPA Static Assets)
                           v                   v
            +--------------------------+   +-------------------+
            |    Express API Server    |   | Nginx SPA Fallback|
            |     (Port 5000 / ESM)    |   +-------------------+
            +-------------+------------+
                          |
                   Mongoose ODM
                          v
            +--------------------------+
            |      MongoDB 7.0         |
            |  CampusBid DB Collections|
            +--------------------------+
```

---

## Quick Start: Three Ways to Run

### Method 1: Local Development (Recommended for Development)

Prerequisites: Node.js 20+, Docker (or local MongoDB on port 27017).

1. **Start MongoDB**:
   ```bash
   # Using docker-compose dev override
   docker compose -f docker-compose.dev.yml up -d mongo
   ```

2. **Configure Server**:
   ```bash
   cd server
   cp .env.example .env
   npm install
   npm run seed    # Populates test users, products, bids, and notifications
   npm run dev     # Starts Express server on http://localhost:5000
   ```

3. **Configure Client** (in a separate terminal):
   ```bash
   cd client
   cp .env.example .env
   npm install
   npm run dev     # Starts Vite dev server on http://localhost:5173
   ```
   Open `http://localhost:5173` in your browser.

---

### Method 2: Docker Compose (Full Stack Containerized)

Runs MongoDB, Express API, and Nginx reverse proxy in containerized production mode.

1. **Build and launch containers**:
   ```bash
   docker compose up --build -d
   ```

2. **Seed the database inside the container**:
   ```bash
   docker compose run --rm -e NODE_ENV=development server npm run seed
   ```

3. **Verify running containers**:
   ```bash
   curl http://localhost:8080/health
   # Returns: {"status":"ok","database":"connected","service":"CampusBid API Server",...}
   ```
   Open `http://localhost:8080` in your browser.

4. **Tear down**:
   ```bash
   docker compose down
   # To also wipe database volumes: docker compose down -v
   ```

---

### Method 3: Deployed (Render + Vercel + MongoDB Atlas)

Complete step-by-step instructions for cloud deployment are documented in [`DEPLOY.md`](./DEPLOY.md).
- **Backend API**: Deployed on Render Web Service using `render.yaml`.
- **Frontend SPA**: Deployed on Vercel using `client/vercel.json`.
- **Database**: Free shared MongoDB Atlas cluster (`M0 Sandbox`).

---

## Seeded Demo Accounts

All demo accounts are pre-configured when running `npm run seed`:

| Name | Role | Email | Password | Purpose |
| --- | --- | --- | --- | --- |
| **System Admin** | Admin | `admin@ves.ac.in` | `Admin@1234` | Full moderation queue, reports, statistics, user suspension |
| **Rahul Sharma** | Student | `rahul.sharma@ves.ac.in` | `Student@123` | Seller demo (listed Arduino Kit, Engineering Drawing Board) |
| **Priya Patel** | Student | `priya.patel@ves.ac.in` | `Student@123` | Active bidder (highest bidder on Arduino Kit) |
| **Amit Verma** | Student | `amit.verma@ves.ac.in` | `Student@123` | Outbid student (outbid on Arduino Kit, won Database Book) |
| **Sneha Kulkarni** | Student | `sneha.k@ves.ac.in` | `Student@123` | Suspended demo account (verifies immediate 403 suspension) |

> [!NOTE]
> All student registrations enforce the `@ves.ac.in` college domain restriction. Passwords require at least 8 characters with at least one number.

---

## Environment Variables

### Server (`server/.env`)
| Variable | Description | Example / Default |
| --- | --- | --- |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | HTTP Server port | `5000` |
| `MONGO_URI` | MongoDB connection URI | `mongodb://127.0.0.1:27017/campusbid` |
| `MONGO_URI_TEST` | Test MongoDB connection URI | `mongodb://127.0.0.1:27017/campusbid_test` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `min-32-char-secure-jwt-secret` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `CLIENT_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `ADMIN_EMAIL` | Default admin email seeded | `admin@ves.ac.in` |
| `ADMIN_PASSWORD` | Default admin password seeded | `Admin@1234` |
| `AUCTION_SWEEP_MS`| Interval for sweeper to close auctions | `10000` (10 seconds) |
| `CLOUDINARY_URL` | Cloudinary storage URI (optional) | Local disk storage used when empty |

### Client (`client/.env`)
| Variable | Description | Example / Default |
| --- | --- | --- |
| `VITE_API_URL` | API base path | `/api/v1` |

---

## Verification & Testing Commands

Execute commands in their respective directories:

```bash
# 1. Run all server unit & integration test suites (60 tests across 9 suites)
cd server
npm test

# 2. Run client linter (Oxlint) and production build
cd client
npm run lint
npm run build

# 3. Run Playwright End-to-End Suite (Phase 11)
npm run e2e

# 4. Check API Health endpoint
curl http://localhost:5000/health
# Response: {"status":"ok","database":"connected","service":"CampusBid API Server"}
```

---

## Evaluation Checklist Mapping

| Checklist Item | Where It Lives | Proof in the Demo |
| --- | --- | --- |
| **Frontend with Tailwind** | `client/src/`, `tailwind.config.js` | Clean responsive UI tested at desktop and 375px mobile viewports; zero external component libraries. |
| **React & State Management** | `client/src/context/`, `client/src/api/` | `AuthContext` (JWT session restore), `AuctionContext` (filter reducer), `SocketContext`, and `ToastContext`. |
| **Backend REST API** | `server/src/routes/`, `server/src/controllers/` | Fully modular REST API matching `routes.md` and `openapi.yaml`, with Postman collection. |
| **MongoDB & Mongoose** | `server/src/models/`, `docs/database.md` | 5 Mongoose schemas (`User`, `Product`, `Bid`, `Notification`, `Report`) with compound & text indexes and `toJSON` transformations. |
| **Data Validation** | `server/src/validators/`, `client/src/utils/validators.js` | Strict Zod validation on API writes and matching client inline field error states. |
| **Authentication & Authorization** | `server/src/middleware/auth.js`, `ProtectedRoute.jsx` | `@ves.ac.in` email restriction, bcrypt hashing, JWT verification, admin guards, and suspension checking. |
| **Real-Time Features (Socket.IO)** | `server/src/sockets/`, `SocketContext.jsx` | Live auction room viewer count, instant outbid alerts, price flashes, and auction closure events. |
| **Docker Containerization** | `Dockerfile`, `docker-compose.yml`, `nginx.conf` | Multi-stage Docker builds on Alpine images; single-command startup serving SPA and reverse proxying API. |
| **DevOps & Deployment** | `.github/workflows/`, `render.yaml`, `DEPLOY.md` | Automated GitHub Actions CI pipeline, database health check, production logging, and full deployment guide. |

---

## Project Structure

```
Auction/
├── .github/
│   └── workflows/
│       ├── ci.yml               # CI: lint, build, mongo container, server tests, e2e
│       └── docker.yml           # CI: multi-stage image build checks
├── client/                      # React 19 + Tailwind CSS + Vite 8
│   ├── nginx.conf               # Production Nginx SPA & reverse proxy config
│   ├── Dockerfile               # Multi-stage client build (Node 22 -> Nginx)
│   ├── src/
│   │   ├── api/client.js        # Built-in fetch API client with ApiError
│   │   ├── components/          # Navbar, Footer, AuctionCard, Modals, ErrorBoundary
│   │   ├── context/             # AuthContext, AuctionContext, SocketContext, ToastContext
│   │   ├── pages/               # Home, Detail, Create, MyListings, MyBids, Admin, Profile
│   │   └── utils/               # Currency formatter, date helpers, validators
├── server/                      # Express 4 + Mongoose 8 (ESM)
│   ├── Dockerfile               # Multi-stage server build on node:22-alpine
│   ├── contracts/               # routes.md, openapi.yaml, postman_collection.json
│   ├── src/
│   │   ├── config/              # DB connection, environment configuration
│   │   ├── controllers/         # auth, user, product, bid, admin, notification
│   │   ├── middleware/          # auth, validate, errorHandler
│   │   ├── models/              # User, Product, Bid, Notification, Report
│   │   ├── routes/              # Sub-routers for all API resources
│   │   ├── services/            # auctionCloser sweeper, notifier
│   │   ├── sockets/             # Socket.IO rooms, connection handlers, event emitters
│   │   ├── validators/          # Zod schema definitions
│   │   ├── app.js               # Express application setup
│   │   └── server.js            # HTTP server, DB connection & sweeper startup
│   └── tests/                   # 60 integration & unit tests running on node:test
├── docs/                        # Specifications, database schema docs, evaluation guides
├── DEPLOY.md                    # Cloud deployment guide (Atlas + Render + Vercel)
├── docker-compose.yml           # Containerized full-stack definition
├── docker-compose.dev.yml       # Standalone Mongo service for dev/tests
└── README.md                    # This documentation
```
