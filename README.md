# 🔧 Servigo — Home Services API

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb"/>
  <img src="https://img.shields.io/badge/Socket.io-4.x-black?style=for-the-badge&logo=socket.io"/>
  <img src="https://img.shields.io/badge/Firebase-FCM-orange?style=for-the-badge&logo=firebase"/>
  <img src="https://img.shields.io/badge/Railway-Deployed-purple?style=for-the-badge"/>
</p>

> An InDrive-style home services platform — users request a service, nearby workers receive the request and can accept or make a counter offer. Once agreed, a booking is created with full chat, payment, and real-time tracking support.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Socket Events](#-socket-events)
- [Database Models](#-database-models)
- [Roles](#-roles)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Real-time | Socket.io |
| Push Notifications | Firebase FCM |
| File Upload | Cloudinary |
| AI Chatbot | Servigo AI API |
| Authentication | JWT + Refresh Token |
| Maps | Google Maps API |
| Deployment | Railway |

---

## ✨ Features

### 👤 Auth System
- User / worker registration with MongoDB transactions
- Login with JWT + Refresh token
- Email OTP verification
- Password reset via OTP

### 📦 Booking System (InDrive-style)
- User requests a service → system automatically finds nearby workers
- Workers can accept / reject / make a counter offer
- User can raise the fare
- Full timeline for every status change
- Admin can complete bookings with a full DB transaction

### 💬 Chat System
- 3 room types: user↔worker / support / AI bot
- Text, image, and file messages + reactions + soft delete
- Typing indicators + per-user unread count
- AI Chatbot powered by the Servigo AI API
- Local fallback reply if the API is unavailable

### 🔔 Notification System
- Saves to DB + emits via Socket + sends FCM push
- 20+ notification types (booking / payment / withdrawal / chat / tickets)

### 💳 Payment System
- 3 payment methods: card / InstaPay / cash
- AI verification for InstaPay receipts
- Platform fee 10% — worker earnings 90%
- Admin approve / reject for payments

### 👛 Wallet System
- credit / debit / pending earnings / release earnings
- Full transaction history (WalletTransaction)
- Withdrawal requests (Visa / InstaPay) + admin approval

### 📍 Real-time Tracking
- Worker sends GPS every 5 seconds via Socket
- User sees the worker's location on the map in real time
- Security: requires an active booking between the two parties

### 🎫 Support Tickets
- User opens a ticket → support chat room opens automatically
- assign / resolve / close / rate
- Admin internal notes

### 🔐 Roles & Permissions
- Dynamic permission system from DB (RolePermission model)
- `checkPermission` middleware
- Roles: owner / admin / moderator / worker / user

---

## 🗂 Project Structure

```
src/
├── core/
│   ├── config/          # DB connection
│   ├── firebase/        # FCM setup
│   ├── middleware/      # auth, permissions, error handler
│   ├── services/        # booking chat integration, cloudinary
│   └── utils/           # ApiResponse, errors, helpers
│
├── modules/
│   ├── auth/
│   ├── bookings/
│   ├── bookingAssignment/
│   ├── chats/
│   ├── notifications/
│   ├── payments/
│   ├── reviews/
│   ├── services/
│   ├── subscriptions/
│   ├── supportTickets/
│   ├── tracking/
│   ├── users/
│   ├── wallet/
│   ├── withdrawal/
│   └── workers/
│
├── socket/
│   ├── socket.js        # Socket.io init + events
│   └── socket.events.js # Event constants
│
└── app.js
```

---

## ⚙️ Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Firebase project (for FCM)
- Cloudinary account (for image uploads)
- Google Maps API key (for location search)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/rawdamohamed2/home-services-api
cd home-services-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values — see [Environment Variables](#-environment-variables) for details.

### 4. Run the server

```bash
# Development
npm run dev

# Production
npm start
```

The server will start at `http://localhost:3000`

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# ── Server ────────────────────────────────────────
PORT=3000
NODE_ENV=development

# ── MongoDB ───────────────────────────────────────
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/servigo

# ── JWT ───────────────────────────────────────────
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your_refresh_secret_here
REFRESH_TOKEN_EXPIRE=30d

# ── Firebase FCM ──────────────────────────────────
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ── Cloudinary ────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Google Maps ───────────────────────────────────
GOOGLE_MAPS_API_KEY=your_maps_key

# ── AI Chatbot ────────────────────────────────────
AI_API_URL=https://servigo-ai-api--marogamil1750.replit.app/chat

# ── Email ─────────────────────────────────────────
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# ── Booking Config ────────────────────────────────
WORKER_SEARCH_RADIUS_METERS=10000
MAX_SEARCH_RADIUS_METERS=80000
MAX_WORKERS_PER_BOOKING=5

# ── Client ────────────────────────────────────────
CLIENT_URL=http://localhost:3001
```

---

## 📡 API Endpoints

### Auth
```
POST   /api/auth/register/user         Register a new user
POST   /api/auth/register/worker       Register a new worker
POST   /api/auth/login                 Login
POST   /api/auth/logout                Logout
POST   /api/auth/send-verify-otp       Send verification OTP
POST   /api/auth/verify-email          Verify email
POST   /api/auth/send-reset-otp        Send password reset OTP
POST   /api/auth/verify-reset-otp      Verify reset OTP
POST   /api/auth/reset-password        Reset password
POST   /api/auth/refresh-token         Refresh access token
```

### Bookings
```
POST   /api/bookings                   Create a new booking
GET    /api/bookings                   List bookings
GET    /api/bookings/:id               Get booking details
PATCH  /api/bookings/:id               Update booking
DELETE /api/bookings/:id/cancel        Cancel booking
PATCH  /api/bookings/:id/status        Update status (admin)
PATCH  /api/bookings/:id/complete      Complete booking (admin)
GET    /api/bookings/:id/timeline      Get booking timeline
GET    /api/bookings/nearby            Get nearby bookings (worker)
POST   /api/bookings/search-workers    Search available workers
```

### Booking Assignments
```
GET    /api/assignments/my                   Worker's assignments
GET    /api/assignments/:id                  Assignment details
PATCH  /api/assignments/:id/view             Mark as viewed
PATCH  /api/assignments/:id/accept           Accept at original price
PATCH  /api/assignments/:id/reject           Reject assignment
POST   /api/assignments/:id/counter          Send counter offer
POST   /api/assignments/:id/accept-counter   User accepts counter offer
POST   /api/assignments/:id/reject-counter   User rejects counter offer
POST   /api/assignments/:id/raise-fare       User raises the fare
```

### Chat
```
GET    /api/chat/rooms                       Get all my rooms
GET    /api/chat/rooms/bot                   Get or create bot room
GET    /api/chat/rooms/support               Get or create support room
GET    /api/chat/rooms/:id                   Get room details
PATCH  /api/chat/rooms/:id/read              Mark room as read
GET    /api/chat/rooms/:id/messages          Get messages (paginated)
POST   /api/chat/rooms/:id/messages          Send a message
DELETE /api/chat/messages/:id                Delete a message
POST   /api/chat/messages/:id/react          Add a reaction
```

### Support Tickets
```
POST   /api/chat/tickets                     Open a new ticket
GET    /api/chat/tickets                     My tickets
GET    /api/chat/tickets/:id                 Ticket details
PATCH  /api/chat/tickets/:id/rate            Rate a resolved ticket
GET    /api/chat/tickets/admin/open          All open tickets (admin)
GET    /api/chat/tickets/admin/stats         Statistics (admin)
PATCH  /api/chat/tickets/:id/assign          Assign to agent (admin)
PATCH  /api/chat/tickets/:id/resolve         Resolve ticket (admin)
PATCH  /api/chat/tickets/:id/close           Close ticket (admin)
PATCH  /api/chat/tickets/:id/note            Add internal note (admin)
```

### Payments
```
POST   /api/payments/methods/card            Add a card
POST   /api/payments/methods/instapay        Add InstaPay account
GET    /api/payments/methods                 Get payment methods
DELETE /api/payments/methods/:id             Delete payment method
POST   /api/payments/initiate                Initiate payment
POST   /api/payments/:id/confirm             Confirm payment
GET    /api/payments/:id/receipt             Get receipt
POST   /api/payments/:id/verify-receipt      Upload InstaPay receipt
GET    /api/payments/admin/instapay          InstaPay payments (admin)
PATCH  /api/payments/admin/:id/approve       Approve payment (admin)
PATCH  /api/payments/admin/:id/reject        Reject payment (admin)
```

### Wallet & Withdrawal
```
GET    /api/wallet                           Get my wallet
GET    /api/wallet/transactions              Transaction history
GET    /api/wallet/pending                   Pending earnings
POST   /api/withdrawals/methods/card         Add withdrawal card
POST   /api/withdrawals/methods/instapay     Add withdrawal InstaPay
GET    /api/withdrawals/methods              Get withdrawal methods
DELETE /api/withdrawals/methods/:id          Delete withdrawal method
POST   /api/withdrawals/request              Request withdrawal
POST   /api/withdrawals/withdraw-all         Withdraw full balance
GET    /api/withdrawals/admin                All withdrawal requests (admin)
PATCH  /api/withdrawals/admin/:id/approve    Approve withdrawal (admin)
PATCH  /api/withdrawals/admin/:id/reject     Reject withdrawal (admin)
PATCH  /api/withdrawals/admin/:id/mark-paid  Mark as paid (admin)
```

### Tracking
```
POST   /api/tracking/location                Worker sends location update
DELETE /api/tracking/location                Stop location sharing
PATCH  /api/tracking/status                  Update availability status
GET    /api/tracking/worker/:workerId        Get worker's last location
```

---

## 🔌 Socket Events

### Client → Server
```
room:join                  { roomId }
room:leave                 { roomId }
typing:start               { roomId }
typing:stop                { roomId }
messages:read              { roomId }
worker:update_location     { longitude, latitude }
tracking:subscribe         { workerId }
tracking:unsubscribe       { workerId }
```

### Server → Client
```
message:new                New message received
message:deleted            Message was deleted
message:reaction           Reaction added to a message
typing:start               User started typing
typing:stop                User stopped typing
messages:read              Messages marked as read
worker:location            Worker location update
offer:new                  New booking offer (worker)
offer:counter              Counter offer received (user)
offer:user_accepted        User accepted the counter offer
offer:user_rejected        User rejected the counter offer
booking:accepted           Booking accepted
booking:cancelled          Booking cancelled
booking:completed          Booking completed
booking:assigned           Worker assigned to booking
booking:updated            Booking details updated
payment:received           Payment successful
payment:pending            Payment under review
payment:failed             Payment failed
earnings:pending           Earnings pending approval
earnings:released          Earnings released to balance
withdrawal:approved        Withdrawal approved
withdrawal:rejected        Withdrawal rejected
withdrawal:paid            Withdrawal paid out
notification:new           General notification
```

---

## 📊 Database Models

```
User              WorkerProfile      Booking
BookingAssignment Review             ChatRoom
Message           SupportTicket      Notification
Payment           PaymentMethod      Wallet
WalletTransaction Withdrawal         RolePermission
```

---

## 👥 Roles

| Role | Permissions |
|---|---|
| `owner` | Full access to everything |
| `admin` | Manage bookings, payments, and workers |
| `moderator` | Access based on assigned permissions |
| `worker` | Receive requests, chat, and location tracking |
| `user` | Request services, pay, and leave reviews |

---

## 📝 License

MIT
