# CampusBid - VESIT Online Auction System API Contracts

This document contains the complete REST API contract specifications for the **CampusBid** collegiate auction platform designed for VESIT students, adhering to the requirements outlined in **FSD Experiment 0 (Web Application Design and Planning)**.

---

## Global Standards

- **Base URL (Local)**: `http://localhost:5000/api/v1`
- **Base URL (Production)**: `https://api.campusbid.ves.ac.in/v1`
- **Data Format**: `application/json`
- **Authentication**: JWT Bearer Token passed via `Authorization: Bearer <token>` header
- **Domain Constraint**: Student email must end with `@ves.ac.in`
- **Currency Standard**: Indian Rupee (`₹` / INR)

---

## Response Envelope Structure

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_ENUM",
    "message": "Descriptive message for UI or client consumption",
    "details": null
  }
}
```

---

## Module 1: User Management & Authentication

### 1.1 Register New Student
- **Endpoint**: `POST /auth/register`
- **Auth**: Public
- **Description**: Registers a student account. Enforces `@ves.ac.in` email and academic metadata.
- **Request Body**:
```json
{
  "fullName": "Jane Doe",
  "email": "jane.doe@ves.ac.in",
  "classBranch": "D12C / CMPN",
  "rollNo": "42",
  "password": "StrongPassword123!",
  "confirmPassword": "StrongPassword123!",
  "agreeTerms": true
}
```
- **Success (201 Created)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "usr_68201",
    "fullName": "Jane Doe",
    "email": "jane.doe@ves.ac.in",
    "classBranch": "D12C / CMPN",
    "rollNo": "42",
    "role": "student",
    "isVerifiedStudent": true
  }
}
```
- **Errors**:
  - `400 INVALID_EMAIL_DOMAIN`: "Only @ves.ac.in emails are accepted."
  - `400 PASSWORDS_DO_NOT_MATCH`: "Passwords do not match."
  - `409 USER_ALREADY_EXISTS`: "An account with this email already exists."

### 1.2 User Login
- **Endpoint**: `POST /auth/login`
- **Auth**: Public
- **Request Body**:
```json
{
  "email": "alex.mercer@ves.ac.in",
  "password": "CollegePass#123"
}
```
- **Success (200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "usr_68201",
    "fullName": "Alex Mercer",
    "email": "alex.mercer@ves.ac.in",
    "classBranch": "D12C / EXTC",
    "rollNo": "2021EXTC042",
    "role": "student",
    "isVerifiedStudent": true
  }
}
```

### 1.3 User Profile Management
- **Endpoint**: `GET /users/me` (Auth: Student / Admin)
- **Endpoint**: `PUT /users/me` (Auth: Student / Admin)
- **Update Request Body**:
```json
{
  "fullName": "Alex Mercer",
  "phone": "+91 98765 43210",
  "classBranch": "D12C / EXTC",
  "bio": "Engineering student interested in electronics and vintage books.",
  "notificationPreferences": {
    "outbidAlerts": true,
    "auctionEndingAlerts": true,
    "newMessageAlerts": false
  }
}
```

---

## Module 2 & 3: Product & Auction Management

### 2.1 List / Create New Auction
- **Endpoint**: `POST /products`
- **Auth**: Required (Student)
- **Request Body**:
```json
{
  "title": "Vintage Smith-Corona Typewriter",
  "category": "electronics",
  "condition": "like-new",
  "description": "A meticulously maintained mid-century Smith-Corona portable typewriter. Working carriage and fresh ribbon.",
  "startingBid": 2000,
  "minIncrement": 100,
  "duration": "3d",
  "images": [
    "https://r2.campusbid.ves.ac.in/uploads/typewriter_1.webp",
    "https://r2.campusbid.ves.ac.in/uploads/typewriter_2.webp"
  ],
  "isDraft": false
}
```
- **Success (201 Created)**: Returns the newly created `ProductItem` with status `live` (or `pending_approval` based on moderation policy).

### 2.2 Browse & Search Auctions
- **Endpoint**: `GET /products`
- **Auth**: Public
- **Query Parameters**:
  - `search` (string): e.g. `Calculus`
  - `category` (string): `all | electronics | books | furniture | fashion | sports | others`
  - `condition` (string): `new | like-new | good | fair | vintage`
  - `status` (string): `live | ended | all`
  - `minPrice` (number), `maxPrice` (number)
  - `sort` (string): `ending_soonest | newly_listed | price_asc | price_desc | most_bids`
  - `page` (int, default 1), `limit` (int, default 12)

### 2.3 Product Details
- **Endpoint**: `GET /products/:id`
- **Auth**: Public
- **Returns**: Full product metadata, seller verification details, current bid, time remaining, and top 5 recent bids.

### 2.4 Edit & Delete Listing
- **Endpoint**: `PUT /products/:id` (Auth: Listing Owner)
- **Endpoint**: `DELETE /products/:id` (Auth: Listing Owner or Admin)

---

## Module 4: Bidding System

### 4.1 Place Bid
- **Endpoint**: `POST /products/:id/bids`
- **Auth**: Required (Student)
- **Request Body**:
```json
{
  "amount": 2600
}
```
- **Contract Rules Enforced**:
  1. Product auction must be `status === 'live'`.
  2. Current time must be `< endTime`.
  3. `amount >= currentHighestBid + minBidIncrement`.
  4. Bidder ID must NOT be equal to Seller ID (Self-bidding prohibited).
- **Side Effects**:
  - Sets new `currentBid` and increments `bidCount`.
  - Dispatches `outbid` notification to the previous highest bidder.

### 4.2 My Bids
- **Endpoint**: `GET /bids/my-bids?filter=all|winning|outbid|ended`
- **Auth**: Required (Student)
- **Returns**: Array of all bids placed by the authenticated student with real-time status (`Winning`, `Outbid`, `Ended`, `Won`).

---

## Module 6: Notifications

### 6.1 Get Notifications
- **Endpoint**: `GET /notifications?unreadOnly=true`
- **Auth**: Required
- **Returns**:
```json
{
  "success": true,
  "unreadCount": 1,
  "notifications": [
    {
      "id": "notif_1",
      "type": "outbid",
      "title": "You have been outbid!",
      "message": "A higher bid of ₹2,700 was placed on Vintage Film Camera.",
      "productId": "prod_101",
      "read": false,
      "createdAt": "2026-08-25T09:15:00Z"
    }
  ]
}
```

### 6.2 Mark as Read
- **Endpoint**: `PATCH /notifications/:id/read`
- **Endpoint**: `PATCH /notifications/read-all`

---

## Module 7: Admin Module

### 7.1 Platform Analytics
- **Endpoint**: `GET /admin/stats`
- **Auth**: Required (Role: `admin`)
- **Returns**:
```json
{
  "success": true,
  "stats": {
    "activeUsers": 1240,
    "totalVolumeInr": 485000,
    "pendingApprovals": 14,
    "flaggedListings": 3,
    "liveAuctions": 86,
    "completedAuctions": 412
  }
}
```

### 7.2 Moderate Listings (Approve / Reject)
- **Endpoint**: `GET /admin/listings/pending`
- **Endpoint**: `POST /admin/listings/:id/moderate`
- **Body**:
```json
{
  "action": "approve | reject",
  "reason": "Optional rejection reason"
}
```

### 7.3 Dispute & Report Resolution
- **Endpoint**: `GET /admin/reports`
- **Endpoint**: `POST /admin/reports/:id/resolve`
- **Body**:
```json
{
  "resolutionAction": "dismiss | remove_listing | suspend_user | warn_seller",
  "notes": "Seller warned regarding duplicate photos"
}
```
