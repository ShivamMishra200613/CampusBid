# agents.md: Rules for the coding agent on CampusBid

You are finishing the CampusBid mini project (VESIT Online Auction System) so it can be demonstrated and explained in a Mini Project Evaluation. The task list is `docs/development/plan.md`. This file is the rulebook. If the two ever seem to disagree, stop and ask (see "When to stop and ask").

## 1. Mission

Complete every item of the evaluation checklist: Frontend with Tailwind, React and State Management, Backend REST API, MongoDB and Mongoose, Data Validation, Authentication and Authorization, Real-Time Features (Socket.IO), Docker, DevOps and Deployment.

The owner has to explain the code in a viva. Write code a second-year student can read and defend: small files, clear names, comments only where the reason is not obvious, no clever abstractions, no extra libraries beyond those named in `docs/development/plan.md`.

## 2. Repository map

```
Auction/
  client/            React 19, Vite 8, Tailwind 3, React Router 7 (JavaScript, JSX, ESM)
  server/            Express 4, Mongoose 8, ESM ("type": "module")
    contracts/       openapi.yaml, routes.md, postman_collection.json, schemas.js, types.d.ts
  docs/              Lab 0 spec text, per-page specs (docs/pages/*.md), database & evaluation guides
    development/     plan.md (the task list), progress.md (your running log)
  e2e/               Playwright tests (created in Phase 11)
  agents.md          this file
```

Sources of truth, in order: the Lab 0 requirements in `docs/lab0_extracted.txt`, then `server/contracts/routes.md` and `openapi.yaml`, then `docs/pages/*.md`, then the existing code. When you change behaviour, update the contract files in the same task.

## 3. Decisions already made

Do not re-open these. Follow them.

- Language: JavaScript with ES modules on both sides. No TypeScript migration.
- Server validation: Zod. Passwords: bcryptjs (cost 10). Tokens: jsonwebtoken (HS256).
- Token storage on the client: `localStorage`, key `campusbid_token`. Only the token is stored, never the user object.
- API base path: `/api/v1`. Response shape: top-level keys exactly as in the examples of `routes.md` (for example `{ success: true, token, user }`, `{ success: true, total, products }`). Errors always use `{ success: false, error: { code, message, details } }`. Where the prose of `routes.md` mentions a `data` envelope, ignore that sentence and fix it.
- Money is stored as integer rupees. Format with `toLocaleString('en-IN')` on the client only.
- IDs on the wire are strings named `id` (map from Mongo `_id` in a `toJSON` transform).
- State management: React Context plus hooks (`useReducer` where it helps). No Redux, no Zustand.
- HTTP on the client: the built-in `fetch` through one wrapper (`client/src/api/client.js`). No axios.
- Image storage: Cloudinary when `CLOUDINARY_URL` is set, otherwise local disk under `server/uploads` served at `/uploads`. R2 is dropped; remove its config.
- Auction closing: an interval sweeper in the server process (`AUCTION_SWEEP_MS`, default 10000), not per-auction timers.
- Moderation: new non-draft listings start as `pending_approval` and need admin approval.
- Password reset: token logged to the server console outside production. No email service.
- Deployment target (config only, the human performs it): MongoDB Atlas, server on Render, client on Vercel.
- Testing: server tests use `node:test` and `supertest` against a real MongoDB (`MONGO_URI_TEST`). Browser tests use Playwright (`@playwright/test`), Chromium only.

## 4. Working loop

Repeat until `docs/development/plan.md` has no unchecked boxes:

1. Read `docs/development/plan.md` and `docs/development/progress.md`. Pick the first unchecked task whose phase prerequisites are met.
2. Read the files that task touches before editing them. Do not rewrite a file you have not read.
3. Implement only that task. Keep the change small enough to review in one sitting.
4. Run the verification commands in section 6 that apply. Fix failures before moving on. Do not tick a box on a failing or unrun check.
5. For any frontend change, check it in a real browser with Playwright (see section 7) and look at the result, not only at the test exit code.
6. Tick the box in `docs/development/plan.md` (`- [x]`), append an entry to `docs/development/progress.md`, and make one git commit with a message like `phase 4.5: atomic bid placement`. Commit locally only.
7. Go back to step 1.

Never skip a task silently. If you cannot finish one, leave it unchecked, write why in `docs/development/progress.md` under "Blocked", and continue with the next task that does not depend on it. If every remaining task depends on it, stop and report.

## 5. Conventions

Server:

- One router and one controller file per module. Controllers contain no Express setup. Models contain no HTTP code.
- Every write route goes through `validate(schema)`. Every protected route has `authenticate`. Admin routes have `requireAdmin`. Owner checks happen in the controller by comparing `product.seller` with `req.user.id`.
- Throw errors with `statusCode` and `code` and let `errorHandler` format them. Do not call `res.status(500)` by hand.
- Never return `passwordHash`. Never log tokens, passwords, or full connection strings.
- `app.js` must not connect to the database, open ports, or start timers. Only `server.js` does that.
- Bids must be placed with one atomic `findOneAndUpdate` whose filter contains the status, end time, and minimum amount conditions.

Client:

- Pages live in `src/pages`, shared pieces in `src/components`, state in `src/context`, API calls in `src/api`, hooks in `src/hooks`, helpers in `src/utils`.
- Use Tailwind utility classes and the existing custom tokens in `tailwind.config.js`. Do not add another CSS framework or component library. Keep the current visual design; extend it, do not redesign it.
- Every data-loading component handles three states: loading, error, empty.
- Pages never import mock data. Components never call `fetch` directly; they use `src/api`.
- Every interactive element that a test needs gets a `data-testid` (kebab-case, for example `bid-amount-input`, `place-bid-button`, `auction-card`).

General:

- No new dependency without a line in `docs/development/progress.md` giving the reason. Prefer what `docs/development/plan.md` already names.
- No secrets in the repository. `.env` files are ignored by git; `.env.example` files are committed.
- Keep file and folder names consistent with the layout in `docs/development/plan.md`, section 2.

## 6. Verification commands

Run the ones that apply to what you changed, every time, without being asked. Run all of them at the end of each phase.

```bash
# Database for local work and tests (needs Docker)
docker compose -f docker-compose.dev.yml up -d mongo

# Server
cd server && npm run lint --if-present && npm test

# Client
cd client && npm run lint && npm run build

# End to end (from the repo root, after Phase 11 exists)
npm run e2e

# Full stack in containers (after Phase 9 exists)
docker compose up --build -d
curl -fsS http://localhost:8080/api/v1/products
curl -fsS http://localhost:8080/health
docker compose down
```

If Docker is not available in your environment, use a MongoDB instance reachable through `MONGO_URI_TEST` (for example an Atlas test database) and say so in `docs/development/progress.md`. Do not skip the tests.

## 7. Using Playwright for the frontend

1. Start the dependencies: MongoDB, then the server with `NODE_ENV=test` on port 5001 and the test database, then the client dev server (the Playwright config's `webServer` entries do this for the suite).
2. Seed the test database before the run. Seed data and demo accounts are documented in `README.md` once Phase 1 and Phase 12 are done.
3. While building a page, write a short script or spec that opens it, performs the main action, and takes a screenshot into `e2e/screenshots/` (ignored by git). Open the screenshot and check the layout against the Tailwind design. Repeat at a 375 px wide viewport for any page you changed.
4. Prefer role and label selectors (`getByRole`, `getByLabel`) and the `data-testid` attributes above. Never use fixed `waitForTimeout` sleeps; wait for a visible element or a response.
5. Real-time behaviour needs two browser contexts in one test (two users, two pages).
6. A failing test is a finding. Decide whether the app or the test is wrong, fix the right one, and note it in `docs/development/progress.md`. Never delete or weaken a test just to get a green run.

## 8. Environment variables

Server (`server/.env.example`):

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/campusbid
MONGO_URI_TEST=mongodb://127.0.0.1:27017/campusbid_test
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@ves.ac.in
ADMIN_PASSWORD=change-me-admin
AUCTION_SWEEP_MS=10000
CLOUDINARY_URL=
```

Client (`client/.env.example`):

```
VITE_API_URL=/api/v1
```

## 9. Safety and scope limits

- Work only inside the project folder. Do not touch files outside it.
- Never run `git push`, never force anything, never rewrite history. Local commits only.
- Never run destructive commands against any database except the local or test one named in the environment. Check the connection string before any seed or reset command. The seed script must refuse to run when `NODE_ENV=production`.
- Do not create cloud accounts, enter payment details, or deploy. The human does that using `DEPLOY.md`.
- Do not remove features that already work to make a task easier.

## 10. When to stop and ask

Stop, write the question in `docs/development/progress.md` under "Questions for the owner", and wait for the owner's reply before you continue, when:

- A task needs a choice about architecture, scope, or product behaviour that this file and `docs/development/plan.md` do not already settle (for example a new user role, a payment flow, or a different database).
- A task would change the public API contract in a way that breaks the frontend or the Postman collection beyond what the task describes.
- Two instructions in the repo contradict each other and the order of precedence in section 2 does not resolve it.
- You reach the HUMAN CHECKPOINT in Phase 10.
- You have failed the same verification three times with different fixes. Report what you tried and what you saw.

Do not stop for small things you can decide yourself: names of helpers, file splits inside a module, wording of error messages, styling details that follow the existing design.

## 11. docs/development/progress.md format

Keep it short and current. Newest entries at the top of "Log".

```markdown
# Progress

## Status

Phase: <number and name> Last finished task: <id> Next task: <id>

## Log

- <date> <task id>: <one line of what changed> | checks: <what you ran and the result>

## Blocked

- <task id>: <why, what was tried>

## Questions for the owner

- <question>

## Notes for the viva

- <anything non-obvious worth explaining later>
```

## 12. Definition of done

The project is done when all of these are true:

- Every box in `docs/development/plan.md` is ticked, and the table in `docs/development/plan.md` section 5 is filled in.
- Server tests, client lint and build, and the Playwright suite pass from a clean database, three times in a row for the Playwright suite.
- `docker compose up --build` serves the full app and the real-time demo works across two windows.
- CI workflow files exist and `DEPLOY.md` is complete.
- `README.md`, `docs/database.md`, `docs/evaluation.md`, and `docs/demo-script.md` exist and match the code.
- No mock data, hardcoded users, hardcoded secrets, or role-toggle hacks remain in the code.
