# CampusBid Server & API Contracts

This directory contains the backend API server contracts and implementation for **CampusBid**, the VESIT Online Auction System (FSD Experiment 0).

## 📁 Directory Structure

```
server/
├── contracts/
│   ├── openapi.yaml           # Full OpenAPI 3.1 Contract Specification
│   ├── routes.md              # Complete Route & Schema Reference Guide
│   ├── types.d.ts             # Domain & Payload TypeScript Interfaces
│   ├── schemas.js             # JSON Schema Definitions & Validation
│   └── postman_collection.json # Ready-to-import Postman Collection
├── src/
│   ├── app.js                 # Express Application Configuration
│   ├── server.js              # Server Startup & Entry Point
│   ├── config/                # Environment & Service Configuration
│   ├── middleware/            # Auth, Role Guard, & Error Middleware
│   ├── routes/                # Module API Routers (v1)
│   └── controllers/           # Business Logic Controllers
├── package.json
└── README.md
```

## 🚀 Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Explore the API at `http://localhost:5000/api/v1` or import `contracts/postman_collection.json` into Postman / ThunderClient.
