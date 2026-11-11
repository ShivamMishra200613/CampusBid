# CampusBid Mini Project: Completion Plan

Goal: finish every item on the Mini Project Evaluation checklist and be able to demo and explain each one.

Read `agents.md` first. It defines the rules, the decisions already made, and the verification commands. This file is the task list. Work top to bottom and tick boxes as you go.

## 1. Audit: where the project stands today

Repo layout today: `client/` (React 19 + Vite 8 + Tailwind 3), `server/` (Express 4, ESM), `docs/` (page specs and Lab 0 text), `server/contracts/` (OpenAPI, Postman, routes.md, schemas.js).

| Checklist item | Status | What exists | What is missing |
| --- | --- | --- | --- |
| Frontend with Tailwind | Done | 9 pages, 5 components, custom Tailwind tokens, responsive navbar, footer, toast | No 404 page (the wildcard route renders Home), no loading or error states, no price filter or sort on Home, no live countdown timers |
| React and State Management | Partial | `AuthContext` and `AuctionContext` (Context API + `useState`), React Router 7 | All data is mock and lives in `localStorage`. The client never calls the API. A default user is always logged in. No route guards. A "toggle role" button fakes admin. |
| Backend REST API | Partial | Express app, `/api/v1` router, health check, error handler, about 15 endpoints | Everything is backed by an in-memory `mockDb` in one file. `PUT` and `DELETE` for products, notification read, moderation, user management, pagination and sort are missing. `/bids/my-bids` is hardcoded. `/users/me` always returns user 0. No controllers folder although the README describes one. |
| MongoDB and Mongoose | Not started | `mongoose` is in `package.json` and `config.mongoUri` is defined | Never imported, no connection, no models, no seed data |
| Data Validation | Minimal | Register page checks password match and length 8. Server checks the `@ves.ac.in` domain on register. HTML `required` attributes. | `contracts/schemas.js` is never used. No validation of products, bids, login, or profile updates on the server. |
| Authentication and Authorization | Not started | `authenticate` and `requireAdmin` middleware exist. `bcryptjs` and `jsonwebtoken` are installed. | The middleware is not applied to any route. Login accepts any email and password. Tokens are fake strings (`token_mock_<id>`). Passwords are never stored. Admin is detected on the client by the word "admin" in the email. |
| Real-Time Features (Socket.IO) | Not started | Nothing | `socket.io` is not installed on either side. The server uses `app.listen` instead of an HTTP server. |
| Docker | Not started | Nothing | No Dockerfiles, no compose file, no `.dockerignore` |
| DevOps and Deployment | Not started | A stale `client/dist` build | No `.env.example`, no CI, no tests, no deploy config, hardcoded JWT secret fallback, CORS open to `*` |

Other problems found while reading the code:

- `AuctionDetailPage` falls back to the first auction when the id is unknown. It should show "not found".
- Auction end times are computed from `Date.now()` when the module loads and then saved to `localStorage`, so they go stale.
- Auctions never close automatically, which Module 3 of the Lab 0 spec requires ("Automatically Close Auction", "Declare Highest Bidder").
- Notifications are static seed data. Outbid, winner, and seller-ended notifications (Module 6) do not exist.
- Admin dashboard has no user management section, but Lab 0 Module 7 lists "Manage Users".
- "Forgot password" is a modal that does nothing.
- Image upload is "paste a URL" only. Lab 0 lists "Upload Product Images".
- `server/config/config.js` references Cloudflare R2, but the project moved to Cloudinary.
- `routes.md` says responses use a `data` envelope, but the code and the examples in the same file return top-level keys (`token`, `user`, `products`).

## 2. Target architecture

```
client (React, Vite, Tailwind)
   |  REST (fetch, JWT in Authorization header)
   |  Socket.IO (JWT in handshake auth)
server (Express + Socket.IO on one HTTP server)
   |  Mongoose
MongoDB (Atlas in production, Docker container locally)
```

Server layout after the refactor:

```
server/src/
  app.js, server.js
  config/        config.js, db.js
  models/        User.js, Product.js, Bid.js, Notification.js, Report.js
  validators/    schemas.js, validate.js
  middleware/    auth.js, errorHandler.js, upload.js
  controllers/   auth, users, products, bids, notifications, admin
  routes/        index.js and one router per module
  services/      auctionCloser.js, notifier.js
  sockets/       index.js
  scripts/       seed.js
server/tests/    API tests (node:test + supertest)
e2e/             Playwright tests
```

## 3. Phases and tasks

Each task has a checkbox. A task is finished only when its "Done when" line is true and the verification commands from `agents.md` pass. Do not start a phase until the previous one is finished, except where a phase says it can run in parallel.

### Phase 0: Baseline and repo hygiene

- [x] 0.1 Confirm the project runs as-is. Run `npm install` in `client/` and `server/`, then `npm run build` in `client/` and `npm start` in `server/`. Record any failure in `progress.md`.
- [x] 0.2 Check whether the folder is inside a git repository (`git rev-parse --is-inside-work-tree`). If it is, use it. If not, run `git init` in the project root. Add a root `.gitignore` (`node_modules`, `dist`, `.env`, `uploads`, `playwright-report`, `test-results`).
- [x] 0.3 Create `server/.env.example` and `client/.env.example` listing every variable used (see `agents.md`, section "Environment variables"). Never commit a real `.env`.
- [x] 0.4 Remove the hardcoded JWT secret fallback from `config.js`. In `production`, the server must refuse to start without `JWT_SECRET` and `MONGO_URI`. In development, use a clearly named dev default and log a warning.
- [x] 0.5 Create `progress.md` at the project root (format in `agents.md`).
- [x] 0.6 Add `"test"` scripts: server uses `node --test`, client has none yet. Add an `npm run lint` that passes in `client/` (oxlint already configured). Fix existing lint errors.

Done when: both apps install, build, and start from a clean clone, lint passes, and `progress.md` exists.

### Phase 1: MongoDB and Mongoose

- [x] 1.1 Install `mongoose` (already a dependency; verify the version works) and create `config/db.js` with a `connectDB()` that retries once and logs the host (never the password).
- [x] 1.2 Update `server.js` to connect to the database before listening. Keep `app.js` free of side effects so tests can import it.
- [x] 1.3 Create the `User` model: `fullName`, `email` (unique, lowercase, `@ves.ac.in` match), `passwordHash` (`select: false`), `classBranch`, `rollNo`, `role` (`student` | `admin`), `isVerifiedStudent`, `isSuspended`, `phone`, `bio`, `avatarUrl`, `notificationPreferences`, timestamps. Add a `toJSON` transform that removes `passwordHash` and `__v` and maps `_id` to `id`.
- [x] 1.4 Create the `Product` model: `title`, `category` (enum), `condition`, `description`, `seller` (ref User), `startingBid`, `currentBid`, `minIncrement`, `bidCount`, `highestBidder` (ref User), `status` (`draft` | `pending_approval` | `live` | `ended` | `removed`), `endTime`, `images` (array), `winner` (ref User), timestamps. Indexes: `status + endTime`, `category`, text index on `title` and `description`.
- [x] 1.5 Create the `Bid` model: `product` (ref), `bidder` (ref), `amount`, timestamps. Index on `product + amount`.
- [x] 1.6 Create the `Notification` model: `user` (ref), `type` (`outbid` | `auction_won` | `auction_ended` | `listing_approved` | `listing_rejected`), `title`, `message`, `product` (ref), `read`, timestamps.
- [x] 1.7 Create the `Report` model: `product` (ref), `reportedBy` (ref), `reason`, `status` (`open` | `resolved`), `resolutionAction`, `notes`, timestamps.
- [x] 1.8 Write `scripts/seed.js` (`npm run seed`) that wipes and recreates: one admin (credentials from env), four students, 8 products across all categories (mix of live and ended, with bids), a few notifications and reports. All seeded passwords must be documented in `README.md` as demo-only.
- [x] 1.9 Write a short `docs/database.md` with the collections, fields, relationships, and indexes, plus a Mermaid ER diagram. This is what you explain in the evaluation.

Done when: `npm run seed` fills the database, and a Mongo shell or Compass shows the five collections with relationships.

### Phase 2: Authentication and Authorization

- [x] 2.1 `POST /auth/register`: validate, reject duplicate email with `409 USER_ALREADY_EXISTS`, hash the password with bcrypt (cost 10), create the user, return a signed JWT and the user. Role is always `student`; ignore any `role` in the body.
- [x] 2.2 `POST /auth/login`: look up by email, compare the hash, reject with a generic `401 INVALID_CREDENTIALS` for both unknown email and wrong password, reject suspended users with `403 ACCOUNT_SUSPENDED`. Return JWT and user.
- [ ] 2.3 JWT payload: `sub` (user id), `role`. Expiry from `JWT_EXPIRES_IN`. Update `authenticate` to load the user from the database, so suspended or deleted users lose access immediately. Keep `requireAdmin`.
- [ ] 2.4 Add `optionalAuth` middleware for public routes that behave differently when a user is present.
- [ ] 2.5 Apply middleware to every route according to the table in `server/contracts/routes.md`. Public: register, login, `GET /products`, `GET /products/:id`. Student: create product, bid, my-bids, notifications, profile. Owner-only: edit or delete own listing. Admin-only: everything under `/admin`.
- [ ] 2.6 `GET /users/me` and `PUT /users/me` use `req.user`, never user 0. `PUT /users/me` may only change `fullName`, `phone`, `classBranch`, `bio`, `avatarUrl`, and `notificationPreferences`. It must not allow `role`, `email`, or `isSuspended`.
- [ ] 2.7 Password reset: `POST /auth/forgot-password` (always returns 200, generates a short-lived reset token, logs the reset link to the server console when `NODE_ENV` is not production) and `POST /auth/reset-password`. No email provider is needed.
- [ ] 2.8 Add rate limiting on `/auth/*` using `express-rate-limit` (for example 20 requests per 15 minutes per IP). Add `helmet`. Restrict CORS to `CLIENT_ORIGIN`.
- [ ] 2.9 Server tests (`server/tests/auth.test.js`): register, duplicate register, login success, login wrong password, access without a token returns 401, student on an admin route returns 403, student editing another user's listing returns 403.

Done when: all tests in 2.9 pass and a request with a student token to `/admin/stats` returns 403.

### Phase 3: Data validation

- [ ] 3.1 Install `zod` on the server. Convert `contracts/schemas.js` into Zod schemas in `validators/schemas.js`: register, login, update profile, create product, update product, place bid, moderate listing, resolve report, report listing, forgot and reset password.
- [ ] 3.2 Create `validators/validate.js`, a middleware factory `validate(schema, source = 'body')` that replaces `req[source]` with the parsed value and returns `400 VALIDATION_ERROR` with `details` as a list of `{ field, message }`.
- [ ] 3.3 Password rule: at least 8 characters, at least one letter and one number. Email rule: valid email ending in `@ves.ac.in`, lowercased and trimmed. Bid amount: a positive number. Reject unknown fields (`.strict()`) on create and update schemas.
- [ ] 3.4 Validate route params that are ObjectIds (`400 INVALID_ID`) so a bad id never reaches Mongoose as a cast error. Map Mongoose `ValidationError`, `CastError`, and duplicate key (`11000`) errors in `errorHandler` to clean API errors.
- [ ] 3.5 Client side: add `client/src/utils/validators.js` with the same rules (email domain, password strength, price greater than zero, title length). Show inline field errors on Login, Register, Create Listing, Profile, and the bid form. Keep HTML `required`, but do not rely on it.
- [ ] 3.6 Server tests (`server/tests/validation.test.js`): bad email domain, weak password, missing fields, extra unknown field, negative bid, invalid ObjectId.

Done when: every write endpoint rejects bad input with a `400` and a field-level message, and the client shows those messages next to the right field.

### Phase 4: Complete the REST API

All endpoints follow `server/contracts/routes.md` and `openapi.yaml`. Response shape: top-level keys, as described in `agents.md`.

- [ ] 4.1 Split `routes/index.js` into one router per module and move logic into controllers.
- [ ] 4.2 Products: `GET /products` with `search`, `category`, `condition`, `status`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`. Return `total`, `page`, `pages`. Public listing shows only `live` and `ended` products. `GET /products/:id` returns the product, seller summary, and the 5 most recent bids. `POST /products`, `PUT /products/:id` (owner, only before the first bid), `DELETE /products/:id` (owner or admin; soft delete by setting `status: removed`).
- [ ] 4.3 `GET /products/mine` (own listings including drafts) and `POST /products/:id/publish` for drafts.
- [ ] 4.4 Moderation: new listings go to `pending_approval` unless `isDraft`. `GET /admin/listings/pending` and `POST /admin/listings/:id/moderate` (`approve` makes it `live` and sets `endTime` from the duration at approval time; `reject` stores a reason and notifies the seller).
- [ ] 4.5 Bids: `POST /products/:id/bids` implements all four contract rules (listing is live, now is before `endTime`, amount at least `currentBid + minIncrement`, bidder is not the seller). Use one atomic `findOneAndUpdate` with those conditions in the filter so two simultaneous bids cannot both win. Create the `Bid` document, set `highestBidder`, increment `bidCount`.
- [ ] 4.6 `GET /products/:id/bids` (full history, paginated) and `GET /bids/my-bids?filter=all|winning|outbid|ended` computed from real data, with status `Winning`, `Outbid`, `Won`, or `Lost`.
- [ ] 4.7 Notifications: `GET /notifications?unreadOnly=true`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`. A user can only touch their own.
- [ ] 4.8 Reports: `POST /products/:id/report` (any student) and the admin side `GET /admin/reports`, `POST /admin/reports/:id/resolve` with the four resolution actions actually applied (`remove_listing` sets the product to `removed`, `suspend_user` sets `isSuspended` on the seller).
- [ ] 4.9 Admin users: `GET /admin/users` (search and pagination), `PATCH /admin/users/:id/suspend` and `PATCH /admin/users/:id/unsuspend`. An admin cannot suspend themselves or another admin.
- [ ] 4.10 `GET /admin/stats` computed from the database (active users, total volume of ended auctions, pending approvals, flagged listings, live auctions, completed auctions).
- [ ] 4.11 Update `openapi.yaml`, `routes.md`, and `postman_collection.json` to match what is implemented, including the Bearer auth on each request in Postman.
- [ ] 4.12 Server tests for products, bids, notifications, and admin (`server/tests/*.test.js`). Include the concurrency test: fire 10 bids at once at the same price and assert exactly one succeeds.

Done when: every endpoint in `routes.md` exists, behaves as documented, and the server test suite passes against a real MongoDB.

### Phase 5: Auction lifecycle

- [ ] 5.1 `services/auctionCloser.js`: a sweeper that runs every 10 seconds (interval from `AUCTION_SWEEP_MS`) and closes every `live` product whose `endTime` has passed. Closing sets `status: ended` and `winner` from `highestBidder`. It must be safe to run twice (use a filter on `status: live` in the update).
- [ ] 5.2 On close, call `services/notifier.js` to create notifications: winner gets `auction_won`, seller gets `auction_ended` (with the winning amount or "no bids"). Outbid notifications are created inside the bid controller for the previous highest bidder, respecting `notificationPreferences.outbidAlerts`.
- [ ] 5.3 Start the sweeper from `server.js` only, never from `app.js`, so tests do not start timers.
- [ ] 5.4 Add a server test that creates a product with an `endTime` a second in the future, waits, runs the sweeper function directly, and asserts the winner and the two notifications.

Done when: a short auction ends by itself, the winner and seller get notifications, and no manual action is needed.

### Phase 6: Image upload

- [ ] 6.1 Install `multer`. Add `POST /uploads` (authenticated) that accepts up to 5 images, `image/jpeg|png|webp` only, 5 MB each, and returns an array of URLs.
- [ ] 6.2 Storage driver chosen by env: if `CLOUDINARY_URL` is set, upload to Cloudinary; otherwise save to `server/uploads/` and serve it from `/uploads`. The local path is the default for development and Docker.
- [ ] 6.3 Client: replace the "paste URL" flow on Create Listing with a file picker, previews, remove buttons, and an upload progress state. Keep the URL option as a secondary choice.
- [ ] 6.4 Server test: reject a text file, reject an oversized file, accept a small PNG.

Done when: a student can pick image files on Create Listing and see them on the detail page after publishing.

### Phase 7: Frontend integration (React and state management)

- [ ] 7.1 Create `client/src/api/client.js`: a `fetch` wrapper that reads the base URL from `VITE_API_URL` (default `/api/v1`), attaches the Bearer token, parses the error envelope into a thrown `ApiError`, and on `401` clears the session and redirects to `/login`.
- [ ] 7.2 Rewrite `AuthContext`: real `login`, `register`, `logout`, `updateProfile`, `loadMe` on startup. Store only the token in `localStorage`. No default user: a fresh visitor is logged out. Remove `toggleRole`, `DEFAULT_STUDENT`, and `DEFAULT_ADMIN`.
- [ ] 7.3 Add `ProtectedRoute` and `AdminRoute` components. Redirect logged-out users to `/login` and remember where they were going. Redirect non-admins away from `/admin`. Admins who log in land on `/admin`.
- [ ] 7.4 Rewrite `AuctionContext` into focused pieces: listings (fetch with filters and pagination), single auction, my bids, my listings, notifications. Each exposes `loading`, `error`, and a `refetch`. Use `useReducer` where a state has several related transitions (for example the listings filter state). Move the toast out into its own `ToastContext`.
- [ ] 7.5 Delete `client/src/data/auctions.js` and every mock array in the contexts. No page may import mock data.
- [ ] 7.6 Home: server-side search, category, status, price range, sort, and pagination. Show skeleton cards while loading and an empty state when there are no results.
- [ ] 7.7 Auction detail: load from the API, show a real "not found" for unknown ids, a live countdown (a `useCountdown` hook that ticks every second and stops at zero), full bid history, a working bid form with validation and server error display, and a working report form.
- [ ] 7.8 Create Listing, My Listings, My Bids, Profile: wire to the API. Edit and delete on My Listings call the API. Publishing a draft calls the API.
- [ ] 7.9 Admin dashboard: stats, pending listings (approve or reject with reason), reports (resolve with an action), and a new users table with suspend and unsuspend.
- [ ] 7.10 Login: remove the prefilled credentials. Wire "Forgot password" to the real endpoints with a reset page at `/reset-password/:token`.
- [ ] 7.11 Add a proper 404 page and replace the wildcard route that renders Home. Add an error boundary at the app root.
- [ ] 7.12 Set `vite.config.js` proxy to forward `/api`, `/socket.io`, and `/uploads` to the server in development.

Done when: with the server running, the whole app works with no mock data, and refreshing any page keeps the session.

### Phase 8: Real-time features (Socket.IO)

- [ ] 8.1 Install `socket.io` on the server and `socket.io-client` on the client. Create an `http.Server` in `server.js`, attach Socket.IO to it, and export the `io` instance through `sockets/index.js` so controllers and the sweeper can emit.
- [ ] 8.2 Socket authentication: verify the JWT from `socket.handshake.auth.token` in a middleware. Anonymous sockets are allowed but may only join auction rooms, not user rooms.
- [ ] 8.3 Rooms: `auction:<id>` (anyone viewing that auction) and `user:<id>` (the logged-in user's private room, joined automatically on connect).
- [ ] 8.4 Server events: `bid:new` to `auction:<id>` with `{ productId, bid, currentBid, bidCount, highestBidder }` after every accepted bid. `auction:ended` to `auction:<id>` with the winner when the sweeper closes it. `notification:new` to `user:<id>` whenever a notification is created. `auction:viewers` to `auction:<id>` with the current viewer count.
- [ ] 8.5 Client events: `auction:join` and `auction:leave` with the product id.
- [ ] 8.6 Client `SocketContext`: connect after login (and for anonymous visitors on detail pages), reconnect with the new token after login or logout, expose `subscribe` helpers, and show a small "Live" or "Reconnecting" indicator.
- [ ] 8.7 Detail page: join the room on mount and leave on unmount. On `bid:new`, update the price, bid count, and bid history without a refresh, and flash the price. On `auction:ended`, switch to the ended state and disable the bid form. Show the viewer count.
- [ ] 8.8 Navbar: on `notification:new`, increment the unread badge and show a toast, for example "You have been outbid on X".
- [ ] 8.9 Home: update the current bid shown on cards in real time for live items.
- [ ] 8.10 Server test (`server/tests/socket.test.js`) using `socket.io-client`: two clients join the same auction, one bids over REST, both receive `bid:new`. A client with no token cannot join a `user:` room.

Done when: two browser windows on the same auction see each other's bids instantly, and the outbid user gets a notification without refreshing.

### Phase 9: Docker

- [ ] 9.1 `server/Dockerfile`: multi-stage build on `node:22-alpine`, production dependencies only, runs as the non-root `node` user, has a `HEALTHCHECK` that calls `/health`, exposes 5000.
- [ ] 9.2 `client/Dockerfile`: multi-stage build that runs `npm run build` and serves `dist/` with nginx. `client/nginx.conf` serves the single-page app (fallback to `index.html`) and proxies `/api`, `/socket.io` (with the WebSocket upgrade headers), and `/uploads` to the `server` service.
- [ ] 9.3 Add `.dockerignore` files in both folders (`node_modules`, `dist`, `.env`, `uploads`).
- [ ] 9.4 Root `docker-compose.yml` with three services: `mongo` (official image, named volume, healthcheck), `server` (depends on healthy `mongo`, env from `server/.env`, volume for `uploads`), and `client` (nginx, published on port 8080). A `seed` step available through `docker compose run --rm server npm run seed`.
- [ ] 9.5 Root `docker-compose.dev.yml` override (or a `docker-compose.test.yml`) that starts only `mongo` on port 27017 for local development and for the test suites.
- [ ] 9.6 Verify: `docker compose up --build` from a clean state serves the app at `http://localhost:8080`, registration and login work, a bid placed in one window appears in another, and `docker compose down` followed by `up` keeps the data.

Done when: one command starts the whole stack and the Playwright suite passes against `http://localhost:8080`.

### Phase 10: DevOps and deployment

- [ ] 10.1 GitHub Actions workflow `.github/workflows/ci.yml`: on push and pull request, run client lint and build, start a MongoDB service container, run server tests, install Playwright browsers, run the e2e suite against the dev servers, and upload the Playwright report as an artifact on failure.
- [ ] 10.2 A second workflow `.github/workflows/docker.yml` that builds both images on pushes to `main` to prove the Dockerfiles work (no registry push required).
- [ ] 10.3 Deployment configuration, prepared but not executed by the agent: `render.yaml` for the server (build and start commands, health check path, env var names without values), and `client/vercel.json` with a rewrite to `index.html` for the single-page app. Frontend env var `VITE_API_URL` points at the deployed server.
- [ ] 10.4 `server` must read `CLIENT_ORIGIN` for CORS and Socket.IO CORS, so the deployed frontend origin is the only one allowed in production.
- [ ] 10.5 Write `DEPLOY.md` with exact manual steps for the human: create a MongoDB Atlas free cluster and a database user, allow network access, copy the connection string; deploy the server on Render with the env vars; deploy the client on Vercel; run the seed script once against Atlas; smoke-test with the checklist at the end of the file. Include a section on free-tier cold starts and WebSockets.
- [ ] 10.6 Add a `GET /health` that also reports database connection state (`connected` or `disconnected`) and returns `503` when disconnected. Add structured request logging (`morgan` in dev format, combined format in production).
- [ ] 10.7 Add a root `README.md` that covers: what the project is, the stack, how to run it three ways (dev, Docker, deployed), the env vars, the test commands, the demo accounts, and the evaluation checklist mapping from section 5 of this file.

Done when: CI is green on a push, `DEPLOY.md` is complete, and the human has the exact steps to put it live.

HUMAN CHECKPOINT: the agent cannot create Atlas, Render, or Vercel accounts. When Phase 10 is finished, stop and tell the human to follow `DEPLOY.md`. After the human reports the live URLs, the agent may run the Playwright suite against them (`E2E_BASE_URL`) and fix what fails.

### Phase 11: Playwright end-to-end tests

Frontend testing uses Playwright. Write the suite as you build, not only at the end: every frontend task in Phases 6 to 8 should end with a Playwright check (screenshot or spec) before it is ticked off.

- [ ] 11.1 Create `e2e/` with `@playwright/test`, `playwright.config.js` (Chromium only, `baseURL` from `E2E_BASE_URL` with a default of `http://localhost:5173`, `webServer` entries that start the server on port 5001 with `NODE_ENV=test` and the test database, and the client dev server), and `npx playwright install chromium`.
- [ ] 11.2 Test helpers: `resetDb` (calls `npm run seed` or a test-only reset script against the test database), `loginAs(page, role)` that logs in through the API and stores the token, and a `bidViaApi` helper for real-time tests.
- [ ] 11.3 `auth.spec.js`: register with a non-`@ves.ac.in` email shows an error, register success lands on Home, login with a wrong password shows an error, logout works, visiting `/create` logged out redirects to `/login`, a student visiting `/admin` is redirected.
- [ ] 11.4 `browse.spec.js`: Home lists seeded auctions, search narrows results, category filter works, price filter and sort work, pagination moves, clicking a card opens the detail page, an unknown id shows "not found".
- [ ] 11.5 `listing.spec.js`: a student creates a listing with an uploaded image, it shows as pending (or live, per the moderation rule), appears in My Listings, can be edited before bids, and can be deleted.
- [ ] 11.6 `bidding.spec.js`: a bid below the minimum shows an error, a valid bid updates the price and bid history, the seller cannot bid on their own item, My Bids shows `Winning` and then `Outbid` after another user bids.
- [ ] 11.7 `realtime.spec.js`: use two browser contexts. User A and user B open the same auction. B bids. A sees the new price and history without reloading. A receives the outbid notification toast and badge. The countdown reaches zero on a short auction and both pages flip to the ended state.
- [ ] 11.8 `admin.spec.js`: admin sees stats, approves a pending listing (it then appears on Home), rejects one with a reason, resolves a report with `remove_listing` (the listing disappears), suspends a user (that user can no longer log in).
- [ ] 11.9 `responsive.spec.js`: run the Home and detail pages at a 375 px wide viewport and check that the mobile menu opens and nothing overflows horizontally.
- [ ] 11.10 Add `npm run e2e` at the repo root and make sure the suite is stable: run it three times in a row with no flaky failures.

Done when: `npm run e2e` passes three times in a row from a clean database.

### Phase 12: Evaluation readiness

- [ ] 12.1 Write `docs/evaluation.md`: for each of the nine checklist items, one paragraph on how it is implemented, the exact files to open in the demo, and three likely viva questions with short answers (for example: why JWT and not sessions, how the bid race condition is prevented, why Socket.IO rooms, what the multi-stage Docker build saves, how Mongoose references differ from embedding).
- [ ] 12.2 Write `docs/demo-script.md`: a 10 minute demo order with the demo accounts, which two windows to open for the real-time part, and what to say at each step.
- [ ] 12.3 Make sure the seeded demo data tells a good story: one auction ending in about 2 minutes after seed (for the live ending demo), one with active bidding, one already won by the demo student, and one pending approval for the admin.
- [ ] 12.4 Final sweep: run every verification command from `agents.md`, fix everything, update the checklist table in section 1 of this file to show final status, and update `progress.md`.

Done when: a person who has never seen the project can follow `README.md` and `docs/demo-script.md` and run the full demo.

## 4. Order and parallelism

1. Phases 0 to 5 run strictly in order (they build on each other).
2. Phase 6 can run any time after Phase 4.
3. Phase 7 needs Phases 2, 3 and 4. Do the Phase 7 tasks that depend on an endpoint right after that endpoint exists, so the frontend never runs ahead of the server.
4. Phase 8 needs Phases 5 and 7.
5. Phase 9 can start once Phase 1 is done (the server image only needs the app to boot), but it is only finished after Phase 8.
6. Phase 10 needs Phase 9. Phase 11 grows throughout and finishes after Phase 8.
7. Phase 12 is last.

## 5. Evaluation checklist: final mapping

Fill the last column in during Phase 12.

| Checklist item | Where it lives | Proof in the demo | Status |
| --- | --- | --- | --- |
| Frontend with Tailwind | `client/src`, `tailwind.config.js` | Responsive pages at desktop and 375 px | |
| React and State Management | `client/src/context`, `api/`, hooks | Login persists, filters, live updates | |
| Backend REST API | `server/src/routes`, `controllers` | Postman collection run | |
| MongoDB and Mongoose | `server/src/models`, `docs/database.md` | Compass view of the collections | |
| Data Validation | `validators/`, `client/src/utils/validators.js` | Bad input rejected on both sides | |
| Authentication and Authorization | `middleware/auth.js`, route guards | Student blocked from admin routes | |
| Real-Time Features (Socket.IO) | `sockets/`, `SocketContext` | Two windows, instant bid and notification | |
| Docker | Dockerfiles, `docker-compose.yml` | `docker compose up --build` | |
| DevOps and Deployment | `.github/workflows`, `DEPLOY.md`, live URLs | Green CI run and the live site | |