# CampusBid - VESIT Online Auction System API Contracts

This document contains the complete REST API contract specifications for the **CampusBid** collegiate auction platform designed for VESIT students, adhering to the requirements outlined in **FSD Experiment 0 (Web Application Design and Planning)** and project evaluation guidelines.

---

## Global Standards

- **Base URL (Local)**: `http://localhost:5000/api/v1`
- **Base URL (Production)**: `https://api.campusbid.ves.ac.in/v1`
- **Data Format**: `application/json`
- **Authentication**: JWT Bearer Token passed via `Authorization: Bearer <token>` header
- **Domain Constraint**: Student email must end with `@ves.ac.in`
- **Currency Standard**: Indian Rupee (`₹` / INR), stored as integer rupees in the database, formatted on the client using `.toLocaleString('en-IN')`
- **Entity IDs**: String IDs named `id` on the wire (mapped from MongoDB `_id` via Mongoose `toJSON`)

---

## Response Envelope Structure

### Success Response
All successful responses return top-level keys directly (never wrapped in a `data` envelope):
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": { ... }
}
```
or for list responses:
```json
{
  "success": true,
  "total": 42,
  "page": 1,
  "pages": 4,
  "products": [ ... ]
}
```

### Error Response
All error responses consistently return:
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
For validation errors (`VALIDATION_ERROR`), `details` contains an array of `{ field, message }` items:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed.",
    "details": [
      { "field": "email", "message": "Email must belong to @ves.ac.in domain" },
      { "field": "password", "message": "Password must be at least 8 characters long" }
    ]
  }
}
```

---

## Module 1: User Management & Authentication

### 1.1 Register New Student
- **Endpoint**: `POST /auth/register`
- **Auth**: Public
- **Description**: Registers a student account. Enforces `@ves.ac.in` email and academic metadata. Role is always `student`.
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
    "id": "64b0f1a2c3d4e5f6a7b8c9d0",
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
  - `400 VALIDATION_ERROR`: Field validation failure.
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
    "id": "64b0f1a2c3d4e5f6a7b8c9d0",
    "fullName": "Alex Mercer",
    "email": "alex.mercer@ves.ac.in",
    "classBranch": "D12C / EXTC",
    "rollNo": "2021EXTC042",
    "role": "student",
    "isVerifiedStudent": true
  }
}
```
- **Errors**:
  - `401 INVALID_CREDENTIALS`: "Invalid email or password."
  - `403 ACCOUNT_SUSPENDED`: "Your account has been suspended by campus administration."

### 1.3 Forgot Password
- **Endpoint**: `POST /auth/forgot-password`
- **Auth**: Public
- **Request Body**:
```json
{
  "email": "alex.mercer@ves.ac.in"
}
```
- **Success (200 OK)**:
```json
{
  "success": true,
  "message": "If this email is registered, password reset instructions have been dispatched."
}
```

### 1.4 Reset Password
- **Endpoint**: `POST /auth/reset-password`
- **Auth**: Public
- **Request Body**:
```json
{
  "token": "jwt_reset_token_here",
  "newPassword": "NewSecurePassword123!",
  "confirmPassword": "NewSecurePassword123!"
}
```
- **Success (200 OK)**:
```json
{
  "success": true,
  "message": "Password reset successfully. You may now login."
}
```

### 1.5 Get Current Profile
- **Endpoint**: `GET /users/me`
- **Auth**: Required (Bearer Token)
- **Success (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "64b0f1a2c3d4e5f6a7b8c9d0",
    "fullName": "Alex Mercer",
    "email": "alex.mercer@ves.ac.in",
    "classBranch": "D12C / EXTC",
    "rollNo": "2021EXTC042",
    "role": "student",
    "isVerifiedStudent": true,
    "phone": "+91 98765 43210",
    "bio": "Engineering student interested in electronics.",
    "avatarUrl": "https://images.unsplash.com/...",
    "notificationPreferences": {
      "outbidAlerts": true,
      "auctionEndingAlerts": true,
      "newMessageAlerts": false
    },
    "stats": {
      "activeBids": 2,
      "auctionsWon": 1,
      "activeListings": 1
    }
  }
}
```

### 1.6 Update Current Profile
- **Endpoint**: `PUT /users/me`
- **Auth**: Required (Bearer Token)
- **Update Request Body**:
```json
{
  "fullName": "Alex Mercer",
  "phone": "+91 98765 43210",
  "classBranch": "D12C / EXTC",
  "bio": "Engineering student interested in electronics and vintage books.",
  "avatarUrl": "https://images.unsplash.com/...",
  "notificationPreferences": {
    "outbidAlerts": true,
    "auctionEndingAlerts": true,
    "newMessageAlerts": false
  }
}
```
- **Success (200 OK)**: Returns updated `{ success: true, user: { ... } }`.

---

## Module 2 & 3: Product & Auction Management

### 2.1 Browse & Search Auctions
- **Endpoint**: `GET /products`
- **Auth**: Public (optional Bearer token)
- **Query Parameters**:
  - `search` (string)
  - `category` (string: `all | electronics | books | notes | stationery | sports | others`)
  - `condition` (string: `new | like-new | good | fair`)
  - `status` (string: `live | ended | all`, default `live` and `ended`)
  - `minPrice` (number), `maxPrice` (number)
  - `sort` (string: `ending_soon | newly_listed | price_low | price_high | most_bids`)
  - `page` (int, default 1), `limit` (int, default 12)
- **Success (200 OK)**:
```json
{
  "success": true,
  "total": 8,
  "page": 1,
  "pages": 1,
  "products": [
    {
      "id": "64b0f1a2c3d4e5f6a7b8c9d1",
      "title": "Vintage Smith-Corona Typewriter",
      "category": "electronics",
      "condition": "like-new",
      "description": "Mid-century Smith-Corona portable typewriter.",
      "startingBid": 2000,
      "currentBid": 2600,
      "minIncrement": 100,
      "bidCount": 4,
      "status": "live",
      "endTime": "2026-08-30T15:00:00.000Z",
      "images": ["https://..."],
      "seller": {
        "id": "64b0f1a2c3d4e5f6a7b8c9d0",
        "name": "Alex Mercer",
        "isVerified": true,
        "avatar": "https://..."
      }
    }
  ]
}
```

### 2.2 Get Product Details
- **Endpoint**: `GET /products/:id`
- **Auth**: Public
- **Success (200 OK)**:
```json
{
  "success": true,
  "product": {
    "id": "64b0f1a2c3d4e5f6a7b8c9d1",
    "title": "Vintage Smith-Corona Typewriter",
    "category": "electronics",
    "condition": "like-new",
    "description": "Mid-century Smith-Corona portable typewriter.",
    "startingBid": 2000,
    "currentBid": 2600,
    "minIncrement": 100,
    "bidCount": 4,
    "status": "live",
    "endTime": "2026-08-30T15:00:00.000Z",
    "images": ["https://..."],
    "seller": {
      "id": "64b0f1a2c3d4e5f6a7b8c9d0",
      "name": "Alex Mercer",
      "isVerified": true,
      "avatar": "https://..."
    }
  },
  "recentBids": [
    {
      "id": "64b0f1a2c3d4e5f6a7b8c9d2",
      "productId": "64b0f1a2c3d4e5f6a7b8c9d1",
      "bidderId": "64b0f1a2c3d4e5f6a7b8c9d3",
      "bidderName": "Priya Sharma",
      "amount": 2600,
      "createdAt": "2026-08-25T10:00:00.000Z"
    }
  ]
}
```

### 2.3 Get My Listings
- **Endpoint**: `GET /products/mine`
- **Auth**: Required (Bearer Token)
- **Description**: Returns all listings created by the authenticated user across all statuses (draft, pending_approval, live, ended).
- **Success (200 OK)**:
```json
{
  "success": true,
  "total": 3,
  "products": [ ... ]
}
```

### 2.4 Create New Listing
- **Endpoint**: `POST /products`
- **Auth**: Required (Student)
- **Request Body**:
```json
{
  "title": "Arduino Mega 2560 R3 Kit",
  "category": "electronics",
  "condition": "like-new",
  "description": "Complete kit with jumper wires, sensors, and breadboard.",
  "startingBid": 1200,
  "minIncrement": 50,
  "duration": "3d",
  "images": ["https://..."],
  "isDraft": false
}
```
- **Success (201 Created)**:
Returns `{ success: true, product: { ... } }` with `status: 'pending_approval'` (or `'draft'` if `isDraft: true`).

### 2.5 Update Listing
- **Endpoint**: `PUT /products/:id`
- **Auth**: Required (Listing Owner only, bids must be 0)
- **Success (200 OK)**: Returns updated `{ success: true, product: { ... } }`.
- **Errors**:
  - `403 FORBIDDEN_OWNER_ONLY`: User is not the listing owner.
  - `400 LISTING_HAS_BIDS`: "Cannot edit a listing once bids have been placed."

### 2.6 Delete Listing
- **Endpoint**: `DELETE /products/:id`
- **Auth**: Required (Listing Owner or Admin)
- **Description**: Soft deletes the product by setting `status: 'removed'`.
- **Success (200 OK)**:
```json
{
  "success": true,
  "message": "Listing removed successfully."
}
```

### 2.7 Publish Draft Listing
- **Endpoint**: `POST /products/:id/publish`
- **Auth**: Required (Listing Owner only)
- **Description**: Transitions a draft listing to `pending_approval` for admin moderation.
- **Success (200 OK)**:
```json
{
  "success": true,
  "product": { ... },
  "message": "Listing submitted for admin moderation."
}
```

### 2.8 Report Listing
- **Endpoint**: `POST /products/:id/report`
- **Auth**: Required (Student)
- **Request Body**:
```json
{
  "reason": "Suspected counterfeit or prohibited campus item."
}
```
- **Success (201 Created)**:
```json
{
  "success": true,
  "report": { ... },
  "message": "Report submitted successfully. Administrators have been notified."
}
```

---

## Module 4: Bidding System

### 4.1 Place Bid
- **Endpoint**: `POST /products/:id/bids`
- **Auth**: Required (Student)
- **Request Body**:
```json
{
  "amount": 2700
}
```
- **Contract Rules Enforced Atomically**:
  1. Product auction must be `status === 'live'`.
  2. Current time must be `< endTime`.
  3. `amount >= currentBid + minIncrement`.
  4. Bidder ID must not equal Seller ID.
- **Success (201 Created)**:
```json
{
  "success": true,
  "message": "Bid placed successfully!",
  "bid": {
    "id": "64b0f1a2c3d4e5f6a7b8c9d4",
    "productId": "64b0f1a2c3d4e5f6a7b8c9d1",
    "bidderId": "64b0f1a2c3d4e5f6a7b8c9d5",
    "bidderName": "Rohan Gupta",
    "amount": 2700,
    "createdAt": "2026-08-25T10:15:00.000Z"
  },
  "updatedCurrentBid": 2700
}
```
- **Errors**:
  - `400 BID_TOO_LOW`: Amount less than required minimum.
  - `400 BID_OUTDATED`: A concurrent bid landed first.
  - `400 AUCTION_NOT_ACTIVE`: Listing is not live.
  - `400 AUCTION_ENDED`: Auction end time has passed.
  - `403 BID_ON_OWN_LISTING`: Sellers cannot bid on their own listings.

### 4.2 Get Product Bids History
- **Endpoint**: `GET /products/:id/bids?page=1&limit=20`
- **Auth**: Public
- **Success (200 OK)**:
```json
{
  "success": true,
  "total": 5,
  "page": 1,
  "pages": 1,
  "bids": [ ... ]
}
```

### 4.3 My Bids
- **Endpoint**: `GET /bids/my-bids?filter=all|winning|outbid|ended`
- **Auth**: Required (Student)
- **Returns**: Array of unique auctions the student has bid on with dynamic status (`Winning`, `Outbid`, `Won`, `Lost`).
- **Success (200 OK)**:
```json
{
  "success": true,
  "total": 3,
  "bids": [
    {
      "id": "64b0f1a2c3d4e5f6a7b8c9d4",
      "productId": "64b0f1a2c3d4e5f6a7b8c9d1",
      "productTitle": "Vintage Smith-Corona Typewriter",
      "productImage": "https://...",
      "sellerName": "Alex Mercer",
      "sellerVerified": true,
      "yourBid": 2700,
      "highestBid": 2700,
      "status": "Winning",
      "timeLeft": "02h : 15m : 00s",
      "endTime": "2026-08-30T15:00:00.000Z"
    }
  ]
}
```

---

## Module 5: Notifications

### 5.1 Get Notifications
- **Endpoint**: `GET /notifications?unreadOnly=true`
- **Auth**: Required
- **Success (200 OK)**:
```json
{
  "success": true,
  "unreadCount": 1,
  "notifications": [
    {
      "id": "64b0f1a2c3d4e5f6a7b8c9d6",
      "type": "outbid",
      "title": "You were outbid!",
      "message": "A higher bid of ₹2,700 was placed on Vintage Smith-Corona Typewriter.",
      "product": "64b0f1a2c3d4e5f6a7b8c9d1",
      "read": false,
      "createdAt": "2026-08-25T10:15:00.000Z"
    }
  ]
}
```

### 5.2 Mark Notification as Read
- **Endpoint**: `PATCH /notifications/:id/read`
- **Auth**: Required (Owner of notification only)
- **Success (200 OK)**:
```json
{
  "success": true,
  "notification": { ... }
}
```

### 5.3 Mark All Notifications as Read
- **Endpoint**: `PATCH /notifications/read-all`
- **Auth**: Required
- **Success (200 OK)**:
```json
{
  "success": true,
  "message": "All notifications marked as read."
}
```

---

## Module 6: Admin Management & Platform Analytics

### 6.1 Platform Analytics
- **Endpoint**: `GET /admin/stats`
- **Auth**: Required (Role: `admin`)
- **Success (200 OK)**:
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

### 6.2 Get Pending Listings
- **Endpoint**: `GET /admin/listings/pending`
- **Auth**: Required (Role: `admin`)
- **Success (200 OK)**:
```json
{
  "success": true,
  "count": 2,
  "listings": [ ... ]
}
```

### 6.3 Moderate Listing
- **Endpoint**: `POST /admin/listings/:id/moderate`
- **Auth**: Required (Role: `admin`)
- **Request Body**:
```json
{
  "action": "approve",
  "reason": ""
}
```
or
```json
{
  "action": "reject",
  "reason": "Does not comply with college regulations regarding electronics."
}
```
- **Success (200 OK)**: Returns `{ success: true, product: { ... } }`.

### 6.4 Get Reports
- **Endpoint**: `GET /admin/reports`
- **Auth**: Required (Role: `admin`)
- **Success (200 OK)**:
```json
{
  "success": true,
  "reports": [ ... ]
}
```

### 6.5 Resolve Report
- **Endpoint**: `POST /admin/reports/:id/resolve`
- **Auth**: Required (Role: `admin`)
- **Request Body**:
```json
{
  "resolutionAction": "remove_listing",
  "notes": "Inappropriate content; listing removed and seller warned."
}
```
- **Success (200 OK)**:
```json
{
  "success": true,
  "report": { ... },
  "message": "Report resolved successfully."
}
```

### 6.6 List Users
- **Endpoint**: `GET /admin/users?search=alex&page=1&limit=20`
- **Auth**: Required (Role: `admin`)
- **Success (200 OK)**:
```json
{
  "success": true,
  "total": 1,
  "page": 1,
  "pages": 1,
  "users": [ ... ]
}
```

### 6.7 Suspend User
- **Endpoint**: `PATCH /admin/users/:id/suspend`
- **Auth**: Required (Role: `admin`)
- **Success (200 OK)**:
```json
{
  "success": true,
  "message": "User account suspended successfully.",
  "user": { ... }
}
```
- **Errors**:
  - `400 CANNOT_SUSPEND_SELF`: Admin cannot suspend self.
  - `403 CANNOT_SUSPEND_ADMIN`: Admin cannot suspend another admin.

### 6.8 Unsuspend User
- **Endpoint**: `PATCH /admin/users/:id/unsuspend`
- **Auth**: Required (Role: `admin`)
- **Success (200 OK)**:
```json
{
  "success": true,
  "message": "User account reactivated successfully.",
  "user": { ... }
}
```
