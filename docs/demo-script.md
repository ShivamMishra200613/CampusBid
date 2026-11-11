# CampusBid: 10-Minute Mini Project Demonstration Script

This script provides an exact, step-by-step walkthrough for demonstrating CampusBid during the Mini Project Evaluation viva. Follow this narrative to showcase all 9 evaluation criteria smoothly within 10 minutes.

---

## Pre-Demo Checklist (2 minutes before presentation)

1. **Verify Services**: Ensure MongoDB and dev servers are running (or start via Docker Compose):
   ```bash
   # Option A: Local Dev
   docker compose -f docker-compose.dev.yml up -d mongo
   cd server && npm run seed && npm run dev
   # In another terminal:
   cd client && npm run dev
   ```
2. **Browser Windows Setup**:
   - **Window 1 (Left / Normal Window)**: Chrome at `http://localhost:5173`.
   - **Window 2 (Right / Incognito Window)**: Chrome Incognito at `http://localhost:5173`.
3. **Demo Accounts Reference**:
   | Role               | Name         | Email                    | Password          |
   | ------------------ | ------------ | ------------------------ | ----------------- |
   | Admin              | VESIT Admin  | `admin@ves.ac.in`        | `change-me-admin` |
   | Student A (Seller) | Rahul Sharma | `rahul.sharma@ves.ac.in` | `Password123`     |
   | Student B (Bidder) | Priya Patel  | `priya.patel@ves.ac.in`  | `Password123`     |
   | Student C (Bidder) | Aditya Verma | `aditya.verma@ves.ac.in` | `Password123`     |

---

## 10-Minute Demo Timeline

### [00:00 - 01:30] Introduction & Catalog Browsing

_Criteria demonstrated: Frontend with Tailwind, REST API, MongoDB/Mongoose_

- **Action (Window 1)**: Open `http://localhost:5173`.
- **What to say**:
  > _"Good morning professors. CampusBid is an exclusive, real-time auction marketplace built for VESIT students to buy and sell textbooks, electronics, and hostel gear safely. Here is the public catalog, built with an editorial Tailwind CSS design system with custom typography and warm paper tones."_
- **Action**:
  1. Click category filter pills: `Electronics & Gadgets`, then `Textbooks & Study Material`.
  2. Type in search bar: `"MacBook"`. Point out instant filtered results.
  3. Change sort order to `"Current Price: High to Low"`.
  4. Clear filters.
- **What to say**:
  > _"The catalog is queried through our Express REST API (`GET /api/v1/products`) powered by Mongoose compound indexing on status, categories, and full-text indexes on titles and descriptions."_

---

### [01:30 - 03:00] Authentication & Institutional Boundary

_Criteria demonstrated: Authentication & Authorization, Data Validation_

- **Action (Window 1)**: Click **"Sign In"** in navbar, then click **"Create an account"** (`/register`).
- **What to say**:
  > _"Security begins at the registration gate. CampusBid prevents external access by enforcing VESIT collegiate identity."_
- **Action**:
  1. Fill form with external email: `external@gmail.com`. Click **"Create Account"**.
  2. Point out instant red validation banner: _"Only @ves.ac.in email addresses are permitted."_
  3. Explain: _"This validation is enforced both client-side and server-side via Zod schema refinements."_
  4. Now click **"Sign In"** and log in as Student A (Seller):
     - Email: `rahul.sharma@ves.ac.in`
     - Password: `Password123`
  5. Point out authenticated Navbar displaying student avatar and name (_Rahul_).

---

### [03:00 - 05:30] Real-Time Multi-Client Bidding & Live Sweeper

_Criteria demonstrated: Real-Time Features (Socket.IO), Concurrency Protection_

- **Action (Window 1 & Window 2 side-by-side)**:
  - **Window 1 (Left - Priya Patel)**: Log in as `priya.patel@ves.ac.in` / `Password123`.
  - **Window 2 (Right - Aditya Verma)**: Log in as `aditya.verma@ves.ac.in` / `Password123`.
  - Both windows navigate to the same live auction: **"Engineering Mathematics & Core CS Textbooks Bundle"** (`/auctions/:id`).
- **What to say**:
  > _"Now we demonstrate real-time bidirectional WebSocket synchronization via Socket.IO across two independent browser sessions."_
- **Action**:
  1. Point out the live **Viewer Count** badge in both windows updating to show active peers.
  2. In Window 1 (Priya), enter a valid bid (e.g. `₹1,600`) and click **"Place Bid"**.
  3. **Observe Window 1**: Priya immediately gets a green **"You are the highest bidder!"** badge.
  4. **Observe Window 2**: Without any page refresh, Aditya's screen flashes yellow, the current bid updates to `₹1,600`, and the bid history appends Priya's bid in real time.
  5. In Window 2 (Aditya), place a higher counter-bid: `₹1,700` and click **"Place Bid"**.
  6. **Observe Window 1**: Priya's screen instantly flips to a red alert badge: **"You've been outbid!"**, her price updates to `₹1,700`, and a toast notification pops up.
- **What to say**:
  > _"Every bid is processed via atomic `Product.findOneAndUpdate` to prevent race conditions. Socket.IO broadcasts `bid:new` to the item room and dispatches a private `notification:new` to Priya's user room."_
- **Action (Sweeper Demo)**:
  - Navigate to **"MacBook Air M1 2020"** (seeded to end within 2 minutes).
  - Watch the countdown timer reach `00h:00m:00s`.
  - Point out that the automated background sweeper (`auctionCloser.js`) closes the auction, sets the winner, and flips the UI state to **"Auction Ended"** automatically.

---

### [05:30 - 07:00] Listing Creation & Self-Bidding Prevention

_Criteria demonstrated: React State Management, REST API, Business Logic_

- **Action (Window 1 - Logged in as Rahul Sharma)**:
  1. Navigate to `/auctions/:id` for **"MacBook Air M1"** (listed by Rahul).
  2. Point out the bidding form is replaced by a notice: _"Sellers cannot bid on their own listings."_
  3. Click **"+ Add Product"** (`/create`).
  4. Fill out listing form:
     - Title: `Raspberry Pi 4 Model B (4GB RAM) + Case`
     - Category: `Electronics & Gadgets`
     - Condition: `Like New (Mint Condition)`
     - Description: `Includes official power supply, 32GB MicroSD, and aluminum case.`
     - Starting Bid: `3200`, Min Increment: `100`
     - Paste Image URL: `https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800`
  5. Click **"Publish Auction"**.
  6. Explain: _"Per our campus safety rules, listings require moderation approval before appearing in public searches."_
  7. Open **"My Listings"** (`/my-listings`) to show the new item marked with the orange **"Under Review"** status badge.

---

### [07:00 - 08:30] Administrator Moderation & User Control

_Criteria demonstrated: Authentication & Authorization (RBAC), Admin Workflows_

- **Action (Window 2)**:
  1. Log out Aditya and log in as Admin:
     - Email: `admin@ves.ac.in`
     - Password: `change-me-admin`
  2. Click **"Admin"** in the top navigation (`/admin`).
- **What to say**:
  > _"The Administrator Dashboard gives VESIT moderation staff oversight over platform KPIs, pending listing submissions, student dispute reports, and user access."_
- **Action**:
  1. Point out the 4 KPI stat cards: _Active Students_, _Total Traded Volume (₹)_, _Pending Approvals_, and _Open Reports_.
  2. In the **"Moderation Queue"**, locate Rahul's Raspberry Pi listing. Click **"Approve"**.
  3. Switch to Window 1: refresh Home page (`/`) to show the Raspberry Pi is now public and live!
  4. In Admin Dashboard, switch to **"Users & Roles"** tab.
  5. Search for a student (e.g. `Ananya`).
  6. Click **"Suspend User"** (accept confirm dialog).
  7. Explain: _"Suspended students are immediately blocked from placing bids or logging in via our database-backed JWT authentication middleware."_

---

### [08:30 - 10:00] Architecture, Docker & Code Walkthrough

_Criteria demonstrated: Docker, DevOps & CI/CD_

- **Action**: Open terminal / VS Code to conclude.
- **What to say**:
  > _"To conclude our demonstration, here is our containerized and automated infrastructure:"_
- **Code Tour**:
  1. Show [docker-compose.yml](file:///C:/VESIT/SEM-5/FSD/Auction/docker-compose.yml): multi-stage Alpine Node.js server with non-root security and Nginx SPA client container.
  2. Show [.github/workflows/ci.yml](file:///C:/VESIT/SEM-5/FSD/Auction/.github/workflows/ci.yml): GitHub Actions pipeline running 61 server tests, client builds, and all 26 Playwright browser tests.
  3. Show test command outputs:
     - Server tests: `61/61 passed`
     - Client oxlint: `0 warnings, 0 errors`
     - Playwright E2E suite: `26/26 passed 3x consecutively`
- **Concluding Statement**:
  > _"CampusBid satisfies every requirement on the evaluation checklist: robust full-stack architecture, institutional boundaries, concurrency-safe atomic bidding, real-time WebSockets, and production-ready DevOps. We are happy to answer any questions."_
