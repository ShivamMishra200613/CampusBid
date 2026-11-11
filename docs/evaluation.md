# CampusBid: Mini Project Evaluation & Viva Defense Guide

This document maps the CampusBid codebase directly to the 9 criteria of the Mini Project Evaluation Checklist. For each criterion, you will find an architectural summary, the exact files and lines of code to open and present during the viva examination, and three likely technical viva questions with concise, technically sound answers.

---

## 1. Frontend with Tailwind CSS

### Implementation Overview

CampusBid features an editorial, collegiate aesthetic designed mobile-first without relying on generic component libraries like MUI, Bootstrap, or shadcn/ui. The design is configured via [client/tailwind.config.js](file:///C:/VESIT/SEM-5/FSD/Auction/client/tailwind.config.js) using custom typography tokens (`Newsreader`/`Playfair Display` serif headlines, `Plus Jakarta Sans` sans-serif body, and uppercase tracking labels) paired with an authentic warm mustard/paper palette (`bg-primary-container`, `surface-bright`, `on-surface`). Interactive cards, auction grids, filter tabs, modal dialogs, and countdown badges use standard utility classes. Fully responsive down to a 375 px mobile viewport with a custom collapsible mobile drawer, eliminating horizontal overflow across all breakpoints.

### Exact Files to Open

- [client/tailwind.config.js](file:///C:/VESIT/SEM-5/FSD/Auction/client/tailwind.config.js) — Custom color tokens, font families, and responsive theme extensions.
- [client/src/index.css](file:///C:/VESIT/SEM-5/FSD/Auction/client/src/index.css) — Custom utility classes (`.btn-primary`, `.btn-secondary`, `.editorial-input`, `.editorial-label`).
- [client/src/components/Navbar.jsx](file:///C:/VESIT/SEM-5/FSD/Auction/client/src/components/Navbar.jsx) — Responsive navigation with hamburger menu toggle and active route styling.
- [client/src/pages/HomePage.jsx](file:///C:/VESIT/SEM-5/FSD/Auction/client/src/pages/HomePage.jsx) — Filter pill bar, search bar, and grid layout (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).

### Likely Viva Questions & Answers

1. **Q: Why did you use Tailwind CSS instead of a pre-built component library like Material-UI or Bootstrap?**  
   _Answer:_ Tailwind provides utility-first CSS that compiles only the classes actually used in production via PurgeCSS/Vite. This keeps the production CSS bundle tiny (~36 kB uncompressed, ~7 kB gzipped) while giving complete control over the bespoke editorial typography and palette without fighting framework styling overrides or bloated runtime CSS-in-JS dependencies.
2. **Q: How did you ensure mobile responsiveness down to 375 px without layout shift or horizontal scrolling?**  
   _Answer:_ We designed mobile-first using Tailwind's default breakpoint scale (`sm:`, `md:`, `lg:`). Flexible container widths (`w-full max-w-7xl mx-auto`), responsive flex direction (`flex-col md:flex-row`), grid templates (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`), text truncation (`truncate`, `line-clamp-2`), and mobile drawers ensure zero horizontal overflow (`overflow-x-hidden` on wrappers). Verified automatically in Playwright at 375x667 viewport in `e2e/responsive.spec.js`.
3. **Q: How does Tailwind handle dark/custom themes or design token consistency?**  
   _Answer:_ In `tailwind.config.js`, we defined semantic color variables mapped to our design tokens (`surface`, `on-surface`, `primary`, `secondary`, `outline-variant`). Instead of arbitrary hex codes scattered throughout JSX, components reference semantic class names like `bg-surface text-on-surface border-outline-variant`, enforcing visual uniformity and maintainability.

---

## 2. React and State Management

### Implementation Overview

CampusBid is built with React 19 and Vite using functional components and hooks (`useState`, `useEffect`, `useCallback`, `useReducer`, `useRef`). Rather than introducing heavy external state libraries like Redux or Zustand for a medium-sized application, state is partitioned cleanly into four specialized React Contexts: `AuthContext` (JWT session hydration from `localStorage`, login/logout, user profile), `AuctionContext` (catalog querying, search/category filter reducer, listing creation, and bidding operations), `SocketContext` (WebSocket connectivity, room subscriptions, real-time message dispatch), and `ToastContext` (transient UI alerts).

### Exact Files to Open

- [client/src/context/AuthContext.jsx](file:///C:/VESIT/SEM-5/FSD/Auction/client/src/context/AuthContext.jsx) — Token storage in `localStorage` (`campusbid_token`), session hydration via `/api/v1/users/me`, login, register, and logout.
- [client/src/context/AuctionContext.jsx](file:///C:/VESIT/SEM-5/FSD/Auction/client/src/context/AuctionContext.jsx) — Filter reducer managing search queries, price ranges, sort ordering, and listing actions.
- [client/src/context/SocketContext.jsx](file:///C:/VESIT/SEM-5/FSD/Auction/client/src/context/SocketContext.jsx) — Socket.IO client lifecycle, room joining (`auction:<id>`, `user:<id>`), and event handling.
- [client/src/components/ProtectedRoute.jsx](file:///C:/VESIT/SEM-5/FSD/Auction/client/src/components/ProtectedRoute.jsx) & [client/src/components/AdminRoute.jsx](file:///C:/VESIT/SEM-5/FSD/Auction/client/src/components/AdminRoute.jsx) — Declarative routing guards.

### Likely Viva Questions & Answers

1. **Q: Why use React Context and `useReducer` instead of Redux or Zustand?**  
   _Answer:_ For this project's scope, React's native Context API combined with `useReducer` solves all global state requirements (authentication, catalog filters, active socket connection, toast notifications) with zero external bundle overhead and zero boilerplate. Redux would introduce actions, dispatchers, and slices that add cognitive complexity without demonstrable architectural benefit for a second-year college auction system.
2. **Q: How does the app handle page refresh without losing authentication state?**  
   _Answer:_ On application mount, `AuthContext` checks `localStorage` for `campusbid_token`. If present, it sets an initial loading flag and issues a `GET /api/v1/users/me` request using the token. If valid, the user state is rehydrated into React memory. If invalid or expired (401), the token is discarded from `localStorage`. Notice that only the token is stored in `localStorage`—the sensitive user object is never stored on disk to prevent stale permission attacks.
3. **Q: How do you prevent unnecessary re-renders when using Context?**  
   _Answer:_ We partitioned global state into four decoupled contexts (`AuthContext`, `AuctionContext`, `SocketContext`, `ToastContext`). A component that only listens for toast notifications does not re-render when an auction filter changes or when a socket packet arrives. Furthermore, functions exposed via context values (`placeBid`, `showToast`, `refetch`) are memoized using `useCallback`.

---

## 3. Backend REST API

### Implementation Overview

The backend is an Express 4 RESTful service using ES Modules (`"type": "module"`). It follows a strict Controller-Service-Router architectural pattern where routes define endpoints and middleware pipelines, controllers handle HTTP request parsing and response formatting, models encapsulate Mongoose persistence, and services handle asynchronous background operations. Every endpoint is versioned under `/api/v1`. Write endpoints run through Zod schema validation; protected routes run through JWT authentication middleware; admin endpoints run through role authorization guards. Standardized JSON responses follow `{ success: true, ... }` for success and `{ success: false, error: { code, message, details } }` for errors.

### Exact Files to Open

- [server/src/app.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/app.js) — Express application pipeline, CORS configuration, Helmet headers, request logging, and error handling.
- [server/src/routes/index.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/routes/index.js) — Top-level API router mounting `/auth`, `/users`, `/products`, `/admin`, `/notifications`, and `/uploads`.
- [server/src/controllers/productController.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/controllers/productController.js) — Public catalog retrieval, filtering, pagination, listing creation, and ownership-protected editing.
- [server/src/controllers/bidController.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/controllers/bidController.js) — Atomic bid placement, validation, and real-time event dispatching.
- [server/contracts/routes.md](file:///C:/VESIT/SEM-5/FSD/Auction/server/contracts/routes.md) & [server/contracts/openapi.yaml](file:///C:/VESIT/SEM-5/FSD/Auction/server/contracts/openapi.yaml) — Formal API contract specifications.

### Likely Viva Questions & Answers

1. **Q: What is the purpose of decoupling `app.js` and `server.js`?**  
   _Answer:_ `app.js` is pure and side-effect free: it defines middleware, mounts routes, and configures error handling without opening network ports, connecting to databases, or starting timers. This allows `supertest` in automated unit/integration tests to import `app` directly and execute fast in-memory HTTP requests without port collision. `server.js` is the operational entry point that connects to MongoDB, starts the HTTP and Socket.IO server on `PORT`, and schedules background sweepers.
2. **Q: How are errors handled uniformly across all routes?**  
   _Answer:_ Controllers never manually call `res.status(500)`. When a domain error occurs (e.g. invalid credentials, product not found, forbidden action), controllers instantiate an `Error` object, attach custom `statusCode` and `code` properties, and pass it to `next(err)`. The centralized error middleware in [server/src/middleware/errorHandler.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/middleware/errorHandler.js) catches all errors, handles Zod validation and Multer errors, logs them, and formats a consistent `{ success: false, error: { code, message, details } }` envelope.
3. **Q: What HTTP status codes are used across the API?**  
   _Answer:_
   - `200 OK`: Successful retrieval or update.
   - `201 Created`: Resource successfully created (new user, new listing, new bid).
   - `400 Bad Request`: Validation failure (`VALIDATION_ERROR`, `BID_TOO_LOW`, `AUCTION_ENDED`).
   - `401 Unauthorized`: Missing, invalid, or expired JWT token.
   - `403 Forbidden`: Authenticated user lacks permission (non-admin on admin route, bidding on own item).
   - `404 Not Found`: Target resource does not exist.
   - `409 Conflict`: Unique constraint violation (`USER_ALREADY_EXISTS`).
   - `503 Service Unavailable`: Database disconnected in health check.

---

## 4. MongoDB and Mongoose

### Implementation Overview

Data persistence is handled by MongoDB using Mongoose 8. The database schema consists of 5 normalized collections: `User`, `Product`, `Bid`, `Notification`, and `Report`. References (`ref: 'User'`, `ref: 'Product'`) with Mongoose `.populate()` are used for entity relationships rather than deep unbounded embedding, preventing documents from exceeding MongoDB's 16 MB BSON size limit and ensuring high-frequency bid inserts do not lock product documents. Bids are placed with single atomic `findOneAndUpdate` queries ensuring strict ACID guarantees at the document level. Indexes are strategically placed for high-frequency queries.

### Exact Files to Open

- [docs/database.md](file:///C:/VESIT/SEM-5/FSD/Auction/docs/database.md) — Complete ER diagram, schema definitions, and indexing strategies.
- [server/src/models/Product.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/models/Product.js) — Compound indexes (`status: 1, endTime: 1`), text search index, and `toJSON` transform converting `_id` to `id`.
- [server/src/models/Bid.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/models/Bid.js) — Compound index on `{ product: 1, amount: -1 }`.
- [server/src/models/User.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/models/User.js) — College email regex validation, hidden `passwordHash` (`select: false`), and indexes.

### Likely Viva Questions & Answers

1. **Q: Why did you model Bids as a separate collection instead of embedding an array of bids inside the Product document?**  
   _Answer:_ In real-world auctions, popular items may attract hundreds or thousands of bids. Embedding bids inside a single Product document causes rapid document growth, memory reallocation, and risks exceeding MongoDB's 16 MB limit. Furthermore, concurrent writes to the same array cause lock contention. A separate `Bid` collection allows appending new bids in O(1) time without rewriting the entire product document.
2. **Q: How does the system handle concurrent bids placed at the exact same millisecond (race conditions)?**  
   _Answer:_ In [server/src/controllers/bidController.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/controllers/bidController.js), bid placement does not use a read-modify-write pattern. Instead, it executes an atomic `Product.findOneAndUpdate` with filter criteria: `{ _id: productId, status: 'live', endTime: { $gt: now }, currentBid: { $lte: amount - minIncrement } }` and update `$set: { currentBid: amount, highestBidder: userId }, $inc: { bidCount: 1 }`. If two users bid simultaneously, MongoDB's document-level lock serializes them: the first succeeds, while the second fails the filter query and returns `400 BID_TOO_LOW` without corrupting state. Verified by a 10-concurrent-bids race test in `server/tests/bids.test.js`.
3. **Q: What indexes did you build and why?**  
   _Answer:_
   - `Product`: Compound index on `{ status: 1, endTime: 1 }` enables the auction sweeper to identify expired live auctions in O(log N) time. Text index on `{ title: 'text', description: 'text' }` powers keyword searches. Index on `category` powers catalog filtering.
   - `Bid`: Compound index on `{ product: 1, amount: -1 }` instantly fetches the highest and recent bids.
   - `User`: Unique index on `email` prevents duplicate registrations.
   - `Notification`: Compound index on `{ user: 1, isRead: 1, createdAt: -1 }` delivers sub-millisecond inbox queries.

---

## 5. Data Validation

### Implementation Overview

Data validation follows a defense-in-depth model: strict server validation using Zod 3 as the authoritative gatekeeper, reinforced by synchronous client-side validation for instant user feedback. Server schemas in [server/src/validators/schemas.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/validators/schemas.js) enforce strict schema boundaries (`.strict()` disallows unexpected fields), domain-specific email constraints (`@ves.ac.in` domain refinement), password complexity requirements (minimum 8 characters with at least one number and letter), positive bid increments, and valid enum values. Route middleware [server/src/validators/validate.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/validators/validate.js) executes schemas before requests ever reach controllers. On the client, [client/src/utils/validators.js](file:///C:/VESIT/SEM-5/FSD/Auction/client/src/utils/validators.js) replicates identical validation rules to provide real-time field-level errors without unnecessary network roundtrips.

### Exact Files to Open

- [server/src/validators/schemas.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/validators/schemas.js) — Zod schemas (`registerSchema`, `loginSchema`, `createProductSchema`, `placeBidSchema`, `reportSchema`).
- [server/src/validators/validate.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/validators/validate.js) — Express validation middleware extracting detailed field-level issue maps.
- [client/src/utils/validators.js](file:///C:/VESIT/SEM-5/FSD/Auction/client/src/utils/validators.js) — Client-side validators for email, password, title, price, and required inputs.
- [server/tests/validation.test.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/tests/validation.test.js) — Automated test suite verifying validation rejections.

### Likely Viva Questions & Answers

1. **Q: Why use Zod on the server if Mongoose also has built-in schema validation?**  
   _Answer:_ Mongoose validation executes late in the request lifecycle—only when attempting to save a document to the database. Zod executes at the HTTP routing boundary before any database calls, business logic, or file operations run. Zod provides TypeScript-compatible schema definitions, custom `.refine()` methods for complex logic (such as enforcing `@ves.ac.in` email format), and `.strict()` checking to strip or reject unexpected injected payload properties.
2. **Q: What happens if an attacker bypasses the frontend and sends malformed JSON or extra fields directly using curl or Postman?**  
   _Answer:_ The request hits the `validate(schema)` middleware. Because all schemas use `.strict()`, any unwholesome or unmapped field immediately causes Zod to fail parsing, returning a `400 VALIDATION_ERROR` response with `{ code: 'VALIDATION_ERROR', message: 'Validation failed', details: [...] }` without ever invoking the controller or database.
3. **Q: How do you prevent invalid MongoDB ObjectIds from crashing the server?**  
   _Answer:_ Express route parameter validation middleware [server/src/validators/validate.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/validators/validate.js) includes `validateObjectIdParam(paramName)`. It checks `mongoose.Types.ObjectId.isValid(req.params[paramName])`. If an invalid hex string is passed (e.g. `/api/v1/products/abc`), it returns `400 INVALID_ID` immediately instead of letting Mongoose throw an unhandled `CastError`.

---

## 6. Authentication and Authorization

### Implementation Overview

CampusBid implements stateless JWT (JSON Web Token) authentication signed with `HS256` secret keys. Passwords are salted and hashed using `bcryptjs` with a work factor cost of 10. The system strictly restricts registration to verified VESIT institutional emails (`@ves.ac.in`). Tokens are transmitted via the standard HTTP `Authorization: Bearer <token>` header. Two-tier Role-Based Access Control (RBAC) separates standard `student` users from the `admin` moderation cell. Authentication middleware verifies tokens against the database on every protected request, ensuring that suspended students or modified credentials take effect immediately without waiting for token expiration.

### Exact Files to Open

- [server/src/middleware/auth.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/middleware/auth.js) — `authenticate`, `requireAdmin`, and `optionalAuth` middleware.
- [server/src/controllers/authController.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/controllers/authController.js) — Registration with `@ves.ac.in` checking, bcrypt comparison, and JWT issuance.
- [server/src/controllers/adminController.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/controllers/adminController.js) — Listing approval/rejection, report resolution, and student suspension/reactivation.
- [server/tests/auth.test.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/tests/auth.test.js) — Automated tests verifying 401 unauthenticated, 403 forbidden, and ownership checks.

### Likely Viva Questions & Answers

1. **Q: Why did you choose stateless JWT authentication over server-side session cookies?**  
   _Answer:_ JWT tokens are self-contained and stateless: the server verifies signature validity (`HS256`) without maintaining session state in memory (e.g. Redis). This allows horizontal scaling and decoupled frontend hosting (client on Vercel, backend API on Render). In addition, Socket.IO WebSockets can easily authenticate during the initial handshake by passing the token in `socket.handshake.auth.token`.
2. **Q: If JWTs are stateless, how can an administrator immediately revoke access or suspend a misbehaving student?**  
   _Answer:_ In our `authenticate` middleware in [server/src/middleware/auth.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/middleware/auth.js), we do not blindly trust the decoded JWT payload. After verifying signature and expiration, we look up the user document in MongoDB. If `user.isSuspended === true`, the middleware rejects the request with `403 ACCOUNT_SUSPENDED`. This combines the convenience of JWT tokens with immediate server-side revocation capability.
3. **Q: How is authorization enforced between students to prevent horizontal privilege escalation (e.g., student A editing student B's listing)?**  
   _Answer:_ Ownership verification is enforced at the controller level. For example, in `updateProduct` and `deleteProduct`, after the `authenticate` middleware establishes `req.user.id`, the controller queries the product and asserts `product.seller.toString() === req.user.id`. If they do not match, the controller returns `403 FORBIDDEN_OWNER_ONLY`. Verified by automated test case 7 in `server/tests/auth.test.js`.

---

## 7. Real-Time Features (Socket.IO)

### Implementation Overview

CampusBid delivers real-time interactivity powered by Socket.IO on the server and `socket.io-client` on the frontend. During the initial WebSocket handshake, incoming connections are authenticated via `socket.handshake.auth.token`. Clients automatically join a private user room (`user:<userId>`) for personal alerts and can join dynamic auction rooms (`auction:<productId>`) when viewing product details. When a student places a bid over REST, the server broadcasts a `bid:new` event with the updated current bid and bidder details to all viewers in the auction room, updates live catalog cards on the Home page, and dispatches a private `notification:new` event to the previously outbid user. An automated server-side sweeper closes expired auctions and emits `auction:ended` broadcasts.

### Exact Files to Open

- [server/src/sockets/index.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/sockets/index.js) — Socket.IO server initialization, handshake authentication, room subscription management (`join:auction`, `leave:auction`), and viewer count tracking.
- [client/src/context/SocketContext.jsx](file:///C:/VESIT/SEM-5/FSD/Auction/client/src/context/SocketContext.jsx) — Frontend socket provider with auto-reconnection and outbid notification toast dispatch.
- [client/src/pages/AuctionDetailPage.jsx](file:///C:/VESIT/SEM-5/FSD/Auction/client/src/pages/AuctionDetailPage.jsx) — Real-time price updates, viewer count display, price flash animations, and outbid badges.
- [server/src/services/auctionCloser.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/services/auctionCloser.js) — Background sweeper checking expired auctions every 10 seconds and broadcasting `auction:ended`.

### Likely Viva Questions & Answers

1. **Q: Why use Socket.IO rooms instead of broadcasting events to all connected clients?**  
   _Answer:_ If we broadcast every bid placed across campus to all connected users, every client would process unneeded network packets for auctions they aren't viewing, wasting bandwidth and CPU. By using Socket.IO rooms (`auction:<productId>`), only users actively viewing that specific auction receive `bid:new` and viewer count events. Similarly, private user rooms (`user:<userId>`) ensure sensitive notifications (like outbid alerts or admin moderation warnings) are sent exclusively to the intended recipient.
2. **Q: Why are bids placed via HTTP POST rather than directly over the WebSocket connection?**  
   _Answer:_ HTTP POST provides standard idempotency, rate limiting (`express-rate-limit`), content negotiation, declarative status codes (`201`, `400`, `403`), and seamless integration with REST validation pipelines. Once the HTTP POST controller validates the bid and writes it atomically to MongoDB, it calls the Socket helper `emitNewBid()` to fan out the update via WebSockets. This separates command handling (REST) from query/event distribution (WebSockets).
3. **Q: How is auction closing handled? Does the server create a `setTimeout` for every auction?**  
   _Answer:_ No. Creating a separate in-memory `setTimeout` timer for every auction listing is dangerous: if the server restarts or crashes, all active timers in RAM are lost. Instead, CampusBid uses an interval sweeper in [server/src/services/auctionCloser.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/services/auctionCloser.js) that runs periodically (every 10 seconds via `AUCTION_SWEEP_MS`). It queries MongoDB for `{ status: 'live', endTime: { $lte: new Date() } }`, idempotently updates their status to `ended`, designates the winner, saves notifications, and broadcasts `auction:ended`.

---

## 8. Docker Containerization

### Implementation Overview

CampusBid is containerized using production-grade multi-stage Dockerfiles. The server container in [server/Dockerfile](file:///C:/VESIT/SEM-5/FSD/Auction/server/Dockerfile) uses `node:22-alpine`, installs production dependencies (`npm ci --omit=dev`), runs under the unprivileged built-in `node` user for security, and includes a native `HEALTHCHECK` probing `GET /health`. The client container in [client/Dockerfile](file:///C:/VESIT/SEM-5/FSD/Auction/client/Dockerfile) builds the Vite application in a Node stage and copies the static assets to a lightweight `nginx:alpine` image with custom Nginx reverse proxy configuration for `/api`, `/socket.io`, `/uploads`, and SPA client routing. The entire stack (MongoDB 7, Express API, Nginx frontend) runs locally via [docker-compose.yml](file:///C:/VESIT/SEM-5/FSD/Auction/docker-compose.yml) on port 8080.

### Exact Files to Open

- [server/Dockerfile](file:///C:/VESIT/SEM-5/FSD/Auction/server/Dockerfile) — Multi-stage Alpine server image with non-root security and healthcheck.
- [client/Dockerfile](file:///C:/VESIT/SEM-5/FSD/Auction/client/Dockerfile) — Multi-stage client build with Nginx reverse proxy and SPA routing.
- [client/nginx.conf](file:///C:/VESIT/SEM-5/FSD/Auction/client/nginx.conf) — Nginx configuration proxying `/api/v1` and `/socket.io` with WebSocket upgrades.
- [docker-compose.yml](file:///C:/VESIT/SEM-5/FSD/Auction/docker-compose.yml) — Production multi-container orchestration.
- [docker-compose.dev.yml](file:///C:/VESIT/SEM-5/FSD/Auction/docker-compose.dev.yml) — Lightweight MongoDB container for local dev work.

### Likely Viva Questions & Answers

1. **Q: What are the benefits of multi-stage Docker builds?**  
   _Answer:_ Multi-stage builds separate the build environment from the runtime environment. For the frontend, build tools (Node.js, Vite, Rollup, devDependencies) are discarded after the `dist/` directory is created. Only static HTML/CSS/JS and the ultra-lightweight Nginx server (~25 MB total image size) are packaged in the final container. This drastically reduces image download size, eliminates build tools from production attack surfaces, and improves deployment speed.
2. **Q: Why run the server process as the non-root `node` user in the Dockerfile?**  
   _Answer:_ By default, Docker containers run as `root` (UID 0). If an application vulnerability (such as a remote code execution exploit) is triggered, an attacker would gain root privileges inside the container, increasing the risk of container breakout and host system compromise. Switching to `USER node` enforces the principle of least privilege.
3. **Q: How does Nginx handle client-side routing in a Single Page Application (SPA)?**  
   _Answer:_ In a React Router SPA, navigating to `/auctions/123` or `/my-listings` occurs client-side. If a user refreshes the page, the browser asks Nginx for `/my-listings`. Without special configuration, Nginx returns 404 because no file named `my-listings` exists on disk. In [client/nginx.conf](file:///C:/VESIT/SEM-5/FSD/Auction/client/nginx.conf), the directive `try_files $uri $uri/ /index.html;` ensures that any unmatched path serves `index.html`, allowing React Router to hydrate and render the correct view.

---

## 9. DevOps and Deployment (CI/CD)

### Implementation Overview

CampusBid implements automated Continuous Integration and Continuous Delivery via GitHub Actions. The primary workflow [.github/workflows/ci.yml](file:///C:/VESIT/SEM-5/FSD/Auction/.github/workflows/ci.yml) triggers on every push and pull request: it lints and builds the React client, spins up a live MongoDB service container in Ubuntu, executes all 61 Node.js server tests, installs Playwright Chromium, and runs all 26 end-to-end browser tests. A companion workflow [.github/workflows/docker.yml](file:///C:/VESIT/SEM-5/FSD/Auction/.github/workflows/docker.yml) builds both Docker images to verify container configurations. Production deployment targets MongoDB Atlas for database hosting, Render for the Express/Socket.IO backend (`render.yaml`), and Vercel for the frontend SPA (`vercel.json`).

### Exact Files to Open

- [.github/workflows/ci.yml](file:///C:/VESIT/SEM-5/FSD/Auction/.github/workflows/ci.yml) — GitHub Actions pipeline with MongoDB container and Playwright testing.
- [.github/workflows/docker.yml](file:///C:/VESIT/SEM-5/FSD/Auction/.github/workflows/docker.yml) — Docker container build verification pipeline.
- [render.yaml](file:///C:/VESIT/SEM-5/FSD/Auction/render.yaml) — Infrastructure-as-code deployment configuration for Render web service.
- [client/vercel.json](file:///C:/VESIT/SEM-5/FSD/Auction/client/vercel.json) — Vercel SPA rewrite configuration.
- [DEPLOY.md](file:///C:/VESIT/SEM-5/FSD/Auction/DEPLOY.md) — Step-by-step production setup guide for MongoDB Atlas, Render, and Vercel.

### Likely Viva Questions & Answers

1. **Q: How does your GitHub Actions CI pipeline test MongoDB operations and WebSockets without external third-party services?**  
   _Answer:_ In [.github/workflows/ci.yml](file:///C:/VESIT/SEM-5/FSD/Auction/.github/workflows/ci.yml), we declare a Docker service container (`services: mongodb: image: mongo:7`). The runner exposes port 27017 locally, allowing server unit tests and Playwright end-to-end tests to execute against a real, isolated MongoDB instance using `MONGO_URI_TEST`. This guarantees identical behavior to production without external network dependencies or mock database shims.
2. **Q: Why cannot Vercel rewrites be used to proxy WebSockets (`/socket.io`) to Render in production?**  
   _Answer:_ Vercel is a serverless platform designed for stateless HTTP request-response cycles. Vercel rewrites do not support persistent stateful TCP WebSocket connections (`Upgrade: websocket`). To solve this cleanly, our frontend dynamically connects directly to the Render backend's full origin (derived from `VITE_API_URL` or `VITE_SOCKET_URL`) via `getSocketUrl()` in [client/src/context/SocketContext.jsx](file:///C:/VESIT/SEM-5/FSD/Auction/client/src/context/SocketContext.jsx), while the server configures CORS in `CLIENT_ORIGIN` to accept the Vercel domain.
3. **Q: How do you handle free-tier cold starts on Render and health monitoring?**  
   _Answer:_ Free-tier instances on Render spin down after 15 minutes of inactivity. When a request arrives, the instance cold-starts in ~30–50 seconds. We implemented a dedicated endpoint `GET /health` in [server/src/routes/health.js](file:///C:/VESIT/SEM-5/FSD/Auction/server/src/routes/health.js) that reports application uptime, environment, and MongoDB connection state (`readyState === 1`). Free ping services (such as UptimeRobot or Cron-job.org) can hit `GET /health` every 10 minutes to keep the instance warm.
