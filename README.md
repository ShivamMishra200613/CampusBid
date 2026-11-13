# CampusBid

A real-time campus auction platform engineered for college communities to list, discover, and bid on pre-owned textbooks, lab equipment, and electronics with instant outbid alerts and automated closing.

![CI Pipeline](https://github.com/ShivamMishra200613/CampusBid/actions/workflows/ci.yml/badge.svg)
![Docker Build](https://github.com/ShivamMishra200613/CampusBid/actions/workflows/docker.yml/badge.svg)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

---

## Screenshots

![CampusBid Auction Catalog](./docs/assets/campusbid-catalog.jpg)

_Public auction catalog featuring real-time status badges, search keyword matching, category filtering, and live bid indicators._

![CampusBid Live Auction Detail](./docs/assets/campusbid-auction.jpg)

_Live auction detail view displaying active viewers count, synchronized countdown timer, real-time bid history, and atomic bid placement._

---

## Features

### Student Side

- **College Domain Authentication**: Strict registration whitelist restricted to verified `@ves.ac.in` email addresses with bcrypt password hashing.
- **Listing Creation & Image Uploads**: Students can list items across categories (Textbooks, Lab Equipment, Electronics, Study Materials) with starting price, minimum bid increment, auction end time, and image uploads.
- **Draft & Publish Lifecycle**: Save listings as private drafts or submit them to the admin moderation queue.
- **Atomic Real-Time Bidding**: Concurrent-safe bidding requiring minimum bid increments, preventing self-bidding, and validating live auction deadlines.
- **Outbid Alerts & In-App Notifications**: Real-time Socket.IO and persisted notifications when outbid or when an auction closes.
- **Personal Dashboards**: Dedicated "My Listings" (drafts, pending, active, completed) and "My Bids" (winning, outbid, won) tracking views.
- **Listing Reporting**: Students can report inappropriate or misleading listings with moderation flags.

### Admin Side

- **Platform Analytics**: Comprehensive statistics tracking total users, active listings, completed auctions, and total platform bid volume.
- **Moderation Queue**: Review incoming student listings with one-click approval or rejection with reason.
- **Dispute Resolution**: Review user-flagged reports and take moderation actions (dismiss or remove listing).
- **User Management**: Search registered students, inspect account activity, and immediately suspend or unsuspend abusive users.

### Real-Time Engine

- **Socket.IO Rooms**: Partitioned websocket connections for auction rooms (`auction:<productId>`) and authenticated user private rooms (`user:<userId>`).
- **Live Viewer Counts**: Real-time presence tracking showing how many users are actively viewing a specific auction.
- **Instant Outbid Broadcast**: Instant price update and bid history broadcast to all auction viewers without page refresh.
- **Automated Sweeper Service**: Server-side background sweeper running every 10 seconds to close expired auctions, determine winners, and notify participants.

---

## Tech Stack

| Layer                | Technology                              | Description                                                                |
| -------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| **Frontend**         | React 19, Vite 8, React Router 7        | Single Page Application with ES Modules and sub-second Fast Refresh        |
| **Styling**          | Tailwind CSS v3                         | Utility-first responsive design supporting desktop and mobile viewports    |
| **Icons & UI**       | Google Material Symbols                 | Lightweight, accessible web icon font                                      |
| **State Management** | React Context & Hooks                   | `AuthContext`, `AuctionContext`, `SocketContext`, and `ToastContext`       |
| **Backend API**      | Node.js 22, Express 4                   | Modular REST API with ES Modules (`type: module`)                          |
| **Real-Time**        | Socket.IO 4                             | Bid broadcasts, room presence, and private notifications                   |
| **Database**         | MongoDB 7.0, Mongoose 8                 | Document storage with compound, text search, and TTL indexing              |
| **Validation**       | Zod                                     | Strict schema validation on API request bodies, params, and client inputs  |
| **Security**         | Helmet, CORS, Rate Limit                | HTTP security headers, CORS origin restriction, and IP-based rate limiting |
| **Testing**          | Node Test Runner, Supertest, Playwright | Server unit/integration tests and browser E2E test suites                  |
| **Containerization** | Docker, Docker Compose, Nginx           | Multi-stage Alpine images with Nginx reverse proxy                         |

---

## Architecture Overview

```mermaid
flowchart TD
  subgraph Client_Tier["Client Tier (Browser)"]
    SPA["React 19 SPA (Vite + Tailwind)"]
    Context["Context State (Auth, Auction, Socket, Toast)"]
    SPA --> Context
  end

  subgraph Gateway["Reverse Proxy / Web Server"]
    Nginx["Nginx Reverse Proxy (Port 8080 / Port 80)"]
  end

  subgraph Server_Tier["Server Tier (Node.js 22 / Express)"]
    API["Express 4 REST API (/api/v1)"]
    AuthMw["Auth & Validation Middleware (JWT + Zod)"]
    SocketServer["Socket.IO Server (Rooms & Events)"]
    Sweeper["Auction Sweeper (10s Interval)"]
    API --> AuthMw
  end

  subgraph Data_Tier["Data Tier"]
    Mongo[("MongoDB 7.0 Database")]
    Uploads["Local Uploads / Cloudinary"]
  end

  SPA -- "HTTP REST Requests" --> Nginx
  SPA -- "WebSockets (ws://)" --> Nginx
  Nginx -- "/api/v1, /uploads" --> API
  Nginx -- "/socket.io" --> SocketServer
  Nginx -- "Static HTML/JS/CSS" --> SPA
  AuthMw --> Mongo
  SocketServer --> Mongo
  Sweeper --> Mongo
  API --> Uploads
```

---

## Project Structure

```
CampusBid/
├── .github/
│   ├── dependabot.yml           # Automated dependency updates for npm, actions, docker
│   ├── pull_request_template.md # Standard PR checklist and template
│   └── workflows/
│       ├── ci.yml               # Automated CI: lint, build, server tests, e2e suite
│       └── docker.yml           # Multi-stage Docker image build verification
├── client/                      # React 19 frontend application
│   ├── nginx.conf               # Production Nginx reverse proxy configuration
│   ├── Dockerfile               # Multi-stage client build (Node 22 -> Nginx Alpine)
│   ├── src/
│   │   ├── api/client.js        # Native fetch API wrapper with unified error handling
│   │   ├── components/          # Reusable UI components (Navbar, Footer, AuctionCard, Toast)
│   │   ├── context/             # React context providers (Auth, Auction, Socket, Toast)
│   │   ├── pages/               # Page components (Home, AuctionDetail, CreateListing, Admin)
│   │   └── utils/               # Currency formatters, date utilities, and validators
│   └── package.json
├── server/                      # Express backend API & Socket.IO server
│   ├── Dockerfile               # Production multi-stage Node 22 Alpine image
│   ├── contracts/               # API documentation (routes.md, openapi.yaml, postman)
│   ├── src/
│   │   ├── config/              # MongoDB connection and environment configuration
│   │   ├── controllers/         # Request handlers (auth, product, bid, admin, notification)
│   │   ├── middleware/          # JWT auth, Zod validation, and centralized error handler
│   │   ├── models/              # Mongoose schemas (User, Product, Bid, Notification, Report)
│   │   ├── routes/              # Express route declarations mounted at /api/v1
│   │   ├── services/            # Auction closer sweeper and notification dispatcher
│   │   ├── sockets/             # Socket.IO connection handling, rooms, and emitters
│   │   └── validators/          # Zod request validation schemas
│   └── tests/                   # 61 server tests running against real MongoDB
├── e2e/                         # Playwright end-to-end browser test suite
├── docs/                        # Architectural documentation and evaluation guides
│   ├── assets/                  # Documentation screenshots and visuals
│   ├── database.md              # Database schemas, relationships, and indexing strategy
│   ├── demo-script.md           # 10-minute presentation walkthrough and script
│   ├── development/             # Development plan (plan.md) and progress log (progress.md)
│   ├── evaluation.md            # Comprehensive viva preparation and grading checklist
│   ├── lab0_extracted.txt       # Course lab requirements specification
│   └── pages/                   # Phase 0 screen specifications and wireframes
├── scripts/                     # Root development runner scripts
├── docker-compose.yml           # Full-stack containerized deployment
├── docker-compose.dev.yml       # Local MongoDB container for development
├── DEPLOY.md                    # Production deployment instructions (Atlas + Render + Vercel)
├── LICENSE                      # MIT License
├── package.json                 # Monorepo scripts and root configuration
└── README.md                    # Project documentation
```

---

## Getting Started

### Prerequisites

- **Node.js**: v20.0.0 or higher (v22 recommended; see `.nvmrc`)
- **npm**: v10.0.0 or higher
- **Docker & Docker Compose**: Optional for containerized workflow

---

### Run Mode 1: Local Development (Fastest)

1. **Start MongoDB**:

   ```bash
   docker compose -f docker-compose.dev.yml up -d mongo
   ```

   _Or connect to an existing local MongoDB daemon at `mongodb://127.0.0.1:27017`._

2. **Configure and Seed Server**:

   ```bash
   cd server
   cp .env.example .env
   npm install
   npm run seed
   ```

3. **Configure Client**:

   ```bash
   cd ../client
   cp .env.example .env
   npm install
   ```

4. **Start Both Services**:
   From the repository root:
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000/api/v1`
   - Health Check: `http://localhost:5000/health`

---

### Run Mode 2: Docker Compose (Full Stack Containers)

Build and run the entire stack (MongoDB, Express API, Client with Nginx reverse proxy) in isolated containers:

1. **Build and start all containers**:

   ```bash
   docker compose up --build -d
   ```

2. **Seed the database inside the container**:

   ```bash
   docker compose run --rm -e NODE_ENV=development server npm run seed
   ```

3. **Access the application**:
   - Web Application & API Proxy: `http://localhost:8080`
   - Health Check: `http://localhost:8080/health`

4. **Stop the containers**:
   ```bash
   docker compose down
   # To remove persistent database volume: docker compose down -v
   ```

---

### Run Mode 3: Deployed Cloud Production

Follow [`DEPLOY.md`](./DEPLOY.md) for complete step-by-step instructions:

- **Database**: Free MongoDB Atlas cluster (`M0 Sandbox`)
- **Backend**: Render Web Service (`render.yaml`)
- **Frontend**: Vercel Single Page App (`client/vercel.json`)

---

## Environment Variables

### Server (`server/.env`)

| Variable           | Purpose                                           | Example / Default                          | Required                            |
| ------------------ | ------------------------------------------------- | ------------------------------------------ | ----------------------------------- |
| `NODE_ENV`         | Runtime environment mode                          | `development` or `production`              | Required                            |
| `PORT`             | HTTP server port                                  | `5000`                                     | Required                            |
| `MONGO_URI`        | MongoDB connection string                         | `mongodb://127.0.0.1:27017/campusbid`      | Required                            |
| `MONGO_URI_TEST`   | MongoDB connection for testing                    | `mongodb://127.0.0.1:27017/campusbid_test` | Required for tests                  |
| `JWT_SECRET`       | Secret key for signing auth tokens (min 32 chars) | `change-me-secure-random-secret`           | Required                            |
| `JWT_EXPIRES_IN`   | Duration before JWT token expires                 | `7d`                                       | Optional (default: `7d`)            |
| `CLIENT_ORIGIN`    | Allowed client URL for CORS and WebSockets        | `http://localhost:5173`                    | Required                            |
| `ADMIN_EMAIL`      | Seeded administrator email                        | `admin@ves.ac.in`                          | Required                            |
| `ADMIN_PASSWORD`   | Seeded administrator password                     | `change-me-admin`                          | Required                            |
| `AUCTION_SWEEP_MS` | Background auction closing interval (ms)          | `10000`                                    | Optional (default: `10000`)         |
| `CLOUDINARY_URL`   | Cloudinary credentials for remote images          | `cloudinary://api_key:api_secret@cloud`    | Optional (falls back to local disk) |

### Client (`client/.env`)

| Variable          | Purpose                          | Example / Default                                    | Required |
| ----------------- | -------------------------------- | ---------------------------------------------------- | -------- |
| `VITE_API_URL`    | Base API endpoint prefix         | `/api/v1` (local) or `https://api.domain.com/api/v1` | Required |
| `VITE_SOCKET_URL` | WebSocket server origin override | Defaults automatically to origin of `VITE_API_URL`   | Optional |

---

## Available Scripts

From the repository root:

| Command                | Action                                                   |
| ---------------------- | -------------------------------------------------------- |
| `npm run dev`          | Runs both Express backend and Vite frontend concurrently |
| `npm run dev:server`   | Starts the Express server with nodemon reload            |
| `npm run dev:client`   | Starts the Vite development server                       |
| `npm run build`        | Compiles frontend production bundle into `client/dist`   |
| `npm run lint`         | Runs Oxlint linter across frontend code                  |
| `npm test`             | Runs the full 61-test backend test suite                 |
| `npm run seed`         | Seeds database with demo accounts, listings, and bids    |
| `npm run e2e`          | Runs Playwright browser end-to-end test suite            |
| `npm run e2e:ui`       | Opens Playwright Interactive UI test runner              |
| `npm run docker:up`    | Builds and starts full stack via Docker Compose          |
| `npm run docker:down`  | Shuts down Docker Compose container stack                |
| `npm run format`       | Formats all code across the repository with Prettier     |
| `npm run format:check` | Verifies code formatting without writing changes         |

---

## Testing & Quality Assurance

CampusBid enforces rigorous automated testing covering REST endpoints, concurrency, authentication, validation, and real browser workflows.

### 1. Server Unit & Integration Tests (61 Tests, 10 Suites)

Built with native Node.js test runner (`node:test`) and Supertest against a real MongoDB test instance:

```bash
npm test
```

- `auth.test.js`: Registration, login, duplicate detection, JWT validation
- `products.test.js`: Catalog filtering, product CRUD, draft publication, reports
- `bids.test.js`: Atomic `findOneAndUpdate` concurrency, minimum increment checks, self-bid rejection
- `auctionCloser.test.js`: Sweeper timer execution, winner determination, idempotency
- `admin.test.js`: Listing approval/rejection, user suspension, report resolution
- `notifications.test.js`: Unread counts, mark single read, mark all read
- `validation.test.js`: Strict Zod schema boundaries and malformed ObjectId checks
- `socket.test.js`: Real-time room isolation and event emission
- `uploads.test.js`: MIME type filtering, file size ceilings, static file serving
- `health.test.js`: Healthcheck endpoint with database status verification

### 2. Browser End-to-End Tests (Playwright)

Executes Chromium browser automation against running servers:

```bash
npm run e2e
```

- Multi-context real-time bidding synchronization across two simultaneous browser sessions
- Complete authentication, session persistence, and logout flow
- Product listing authoring, draft saving, and image uploading
- Administrator dashboard operations, approval actions, and user suspension
- Mobile responsive layout checks at 375px viewport

---

## API Overview

The backend exposes a fully documented RESTful API conforming to OpenAPI 3.0. Complete specifications are available in [`server/contracts/openapi.yaml`](./server/contracts/openapi.yaml) and [`server/contracts/routes.md`](./server/contracts/routes.md).

| Method   | Endpoint                              | Access        | Purpose                                               |
| -------- | ------------------------------------- | ------------- | ----------------------------------------------------- |
| `POST`   | `/api/v1/auth/register`               | Public        | Register new `@ves.ac.in` student                     |
| `POST`   | `/api/v1/auth/login`                  | Public        | Authenticate user and receive JWT token               |
| `GET`    | `/api/v1/users/me`                    | Authenticated | Retrieve current user profile                         |
| `GET`    | `/api/v1/products`                    | Public        | Browse live auctions with search and category filters |
| `GET`    | `/api/v1/products/:id`                | Public        | Retrieve auction details and bid history              |
| `POST`   | `/api/v1/products`                    | Authenticated | Create a new listing (draft or pending approval)      |
| `PUT`    | `/api/v1/products/:id`                | Owner         | Update listing details before first bid               |
| `DELETE` | `/api/v1/products/:id`                | Owner / Admin | Soft-delete listing                                   |
| `POST`   | `/api/v1/products/:id/bids`           | Authenticated | Place atomic bid on live auction                      |
| `GET`    | `/api/v1/notifications`               | Authenticated | Retrieve user notifications and unread count          |
| `PATCH`  | `/api/v1/notifications/:id/read`      | Authenticated | Mark notification as read                             |
| `POST`   | `/api/v1/uploads`                     | Authenticated | Upload product image (PNG/JPEG/WebP <= 5MB)           |
| `GET`    | `/api/v1/admin/stats`                 | Admin         | Get platform analytics and revenue statistics         |
| `GET`    | `/api/v1/admin/listings/pending`      | Admin         | Queue of listings awaiting approval                   |
| `POST`   | `/api/v1/admin/listings/:id/moderate` | Admin         | Approve or reject submitted listing                   |
| `PATCH`  | `/api/v1/admin/users/:id/suspend`     | Admin         | Suspend abusive user account                          |
| `GET`    | `/health`                             | Public        | Server uptime and database connectivity probe         |

---

## Real-Time Events (Socket.IO)

All real-time communication occurs over Socket.IO with automatic token-based authentication on handshake:

| Event Name              | Direction        | Payload                                                   | Description                                              |
| ----------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `auction:join`          | Client -> Server | `productId`                                               | Client joins specific auction room `auction:<productId>` |
| `auction:leave`         | Client -> Server | `productId`                                               | Client leaves specific auction room                      |
| `auction:viewers`       | Server -> Client | `{ productId, viewerCount }`                              | Broadcasts current active viewers count to room          |
| `bid:new`               | Server -> Client | `{ productId, bid, currentBid, bidCount, highestBidder }` | Broadcasts new winning bid to all auction viewers        |
| `catalog:bid_updated`   | Server -> Client | `{ productId, currentBid, bidCount }`                     | Broadcasts updated price to all catalog viewers          |
| `auction:ended`         | Server -> Client | `{ productId, winner, winningBid }`                       | Broadcasts auction conclusion to auction viewers         |
| `catalog:auction_ended` | Server -> Client | `{ productId }`                                           | Broadcasts auction conclusion to catalog viewers         |
| `notification:new`      | Server -> Client | `Notification Object`                                     | Dispatches private notification to `user:<userId>` room  |

---

## Deployment Summary

CampusBid is engineered for zero-cost cloud deployment:

- **Backend API**: Hosted on Render as a Node.js Web Service with automatic deploys and native WebSockets.
- **Frontend SPA**: Hosted on Vercel with automatic edge CDN routing and SPA rewrite rules.
- **Database**: MongoDB Atlas M0 Free Tier cluster with IP access allowlisting.

For detailed deployment steps, environment mapping, and troubleshooting, refer to [`DEPLOY.md`](./DEPLOY.md).

---

## Seeded Demo Accounts (Demo Only)

_Use these accounts for evaluation, local testing, and demonstration. All student demo accounts share the password `Password123`. The administrator password is set via the `ADMIN_PASSWORD` environment variable when seeding (never hardcoded in documentation or code)._

| Name               | Role    | Email                    | Password                                                                     | Demo Persona                                                                                 |
| ------------------ | ------- | ------------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **VESIT Admin**    | Admin   | `admin@ves.ac.in`        | Configured via `ADMIN_PASSWORD` env (default `change-me-admin` in local dev) | Platform administrator: moderation queue, dispute resolution, platform KPIs, user suspension |
| **Rahul Sharma**   | Student | `rahul.sharma@ves.ac.in` | `Password123`                                                                | Primary seller: created live auctions (MacBook Air, Mathematics textbooks, Arduino kit)      |
| **Priya Patel**    | Student | `priya.patel@ves.ac.in`  | `Password123`                                                                | Active bidder: placed leading bid on MacBook Air; active bidder on textbooks                 |
| **Aditya Verma**   | Student | `aditya.verma@ves.ac.in` | `Password123`                                                                | Competing bidder: used for dual-window live bidding demonstrations and outbid alerts         |
| **Ananya Iyer**    | Student | `ananya.iyer@ves.ac.in`  | `Password123`                                                                | Auction winner & reporter: won Calculator auction; reported flagged listing                  |
| **Sneha Kulkarni** | Student | `sneha.k@ves.ac.in`      | `Password123`                                                                | Suspended student: seeded as `isSuspended: true`; login returns HTTP 403 `ACCOUNT_SUSPENDED` |

---

## Documentation & Viva Guides

- **Evaluation Guide**: [`docs/evaluation.md`](./docs/evaluation.md) - Line-by-line mapping of all 9 viva evaluation criteria and 27 viva Q&A.
- **Database Architecture**: [`docs/database.md`](./docs/database.md) - Schemas, relationships, indexing, and data dictionary.
- **Demo Walkthrough**: [`docs/demo-script.md`](./docs/demo-script.md) - Scripted 10-minute presentation covering dual-window real-time bidding.
- **Development Plan & Progress**: [`docs/development/plan.md`](./docs/development/plan.md) - Phased implementation checklist and milestones.
- **API Specification**: [`server/contracts/openapi.yaml`](./server/contracts/openapi.yaml) - Standard OpenAPI 3.0 specification.
- **Deployment Guide**: [`DEPLOY.md`](./DEPLOY.md) - Production hosting guide for Render, Vercel, and MongoDB Atlas.

---

## License

This project is licensed under the [MIT License](./LICENSE).

---

## Author

**Shivam Mishra**  
Vivekanand Education Society's Institute of Technology (VESIT)
