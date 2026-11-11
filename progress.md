# Progress

## Status
Phase: Phase 2: Authentication and Authorization   Last finished task: 2.5   Next task: 2.6

## Log
- 2026-11-11 2.5: Applied authenticate and requireAdmin middleware across routes per routes.md contract specification | checks: verified 401 on unauthenticated access to /users/me, 403 on student accessing /admin/stats, 200 on public /products
- 2026-11-11 2.4: Implemented optionalAuth middleware to populate req.user when valid Bearer token exists without rejecting anonymous requests | checks: verified null on missing/bad tokens and valid user object on authenticated tokens
- 2026-11-11 2.3: Updated authenticate middleware to verify sub/role payload and load user directly from MongoDB, enforcing immediate invalidation on suspension or deletion | checks: verified student authentication, admin authorization, and 403 blocking on requireAdmin
- 2026-11-11 2.2: Implemented POST /auth/login with constant-time password comparison, 401 INVALID_CREDENTIALS for wrong password or email, and 403 ACCOUNT_SUSPENDED for suspended accounts | checks: verified 200 on valid credentials, 401 on wrong email/pass, and 403 on suspended account
- 2026-11-11 2.1: Implemented POST /auth/register with bcrypt hashing, JWT issuance, duplicate check (409), and enforced student role | checks: verified 201 creation with token and student role, duplicate 409 USER_ALREADY_EXISTS
- 2026-11-11 1.9: Authored docs/database.md with ER diagram, collections, indexing strategies, and viva defense rationale | checks: verified 5 collections in MongoDB with relationships, client lint/build, server test
- 2026-11-11 1.8: Implemented scripts/seed.js (npm run seed) with admin, 4 students, 8 products, bids, notifications, and reports; verified production environment block | checks: npm run seed executed successfully, production refusal test passed
- 2026-11-11 1.7: Created Report model with status/resolutionAction enums and toJSON transform | checks: verified model validation and status enforcement
- 2026-11-11 1.6: Created Notification model with enum types, compound index, and toJSON transform | checks: verified model validation and type constraint enforcement
- 2026-11-11 1.5: Created Bid model with compound product + amount index and toJSON transform | checks: verified model validation and indexing
- 2026-11-11 1.4: Created Product model with status/endTime, category, and text indexes, enums, and toJSON mapping | checks: verified model validation, default bid logic, and schema indexing
- 2026-11-11 1.3: Implemented Mongoose User model with @ves.ac.in validator, hidden passwordHash, and toJSON id mapping | checks: verified schema validation and toJSON transform
- 2026-11-11 1.2: Updated server.js to connect to MongoDB before listening, kept app.js side-effect free | checks: verified clean app.js import and server.js start + /health 200 OK
- 2026-11-11 1.1: Created config/db.js with connectDB() retry logic and credential-safe host logging | checks: verified connectDB() connection and disconnection to local MongoDB
- 2026-11-11 0.6: Verified server test script runs node --test, adjusted client oxlint config to achieve 0 warnings and 0 errors | checks: cd client && npm run lint && npm run build; cd server && npm test
- 2026-11-11 0.5: Verified root progress.md exists and adheres to agents.md section 11 format | checks: format check against agents.md
- 2026-11-11 0.4: Removed hardcoded JWT secret fallback and R2 config from config.js; enforced production failure on missing JWT_SECRET or MONGO_URI | checks: verified node execution in production and dev modes
- 2026-11-11 0.3: Created server/.env.example and client/.env.example with documented env vars; ensured real .env is ignored | checks: git status, .gitignore verification
- 2026-11-11 0.2: Initialized git repository with origin https://github.com/ShivamMishra200613/CampusBid.git and added root .gitignore | checks: git status, git remote -v
- 2026-11-11 0.1: Verified project runs as-is; client and server npm install, client build, and server health check passed | checks: client npm run build, server /health 200 OK

## Blocked

## Questions for the owner

## Notes for the viva
- Baseline Express server responds on /health and mounts mock API at /api/v1.
- Initial client uses React 19 + Vite 8 + Tailwind 3.
