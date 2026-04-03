# WTF GYMS — Complete Project Guide

> Internal documentation for developers working on the WTF Gyms platform.
> Covers architecture, all features, freeze system deep-dive, API contracts, and testing.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Setup & Installation](#setup--installation)
5. [Authentication System](#authentication-system)
6. [Database Schema](#database-schema)
7. [Gym & Plan Management](#gym--plan-management)
8. [User Flow — Signup to Purchase](#user-flow--signup-to-purchase)
9. [Membership Freeze System (Deep Dive)](#membership-freeze-system-deep-dive)
10. [Cron Jobs](#cron-jobs)
11. [Admin Dashboard](#admin-dashboard)
12. [API Reference](#api-reference)
13. [Frontend Architecture](#frontend-architecture)
14. [Testing](#testing)
15. [Environment Variables](#environment-variables)
16. [Common Issues & Fixes](#common-issues--fixes)

---

## Overview

WTF Gyms is a full-stack gym membership platform where:

- **Users** can sign up, browse gyms, purchase memberships, and freeze/unfreeze their memberships
- **Admins** can manage gyms, plans (with freeze policies), view all members, and monitor freeze activity

The platform has two separate auth systems (Admin JWT + User JWT), a complete membership lifecycle, and an automated freeze system with cron jobs.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + Vite | SPA with fast HMR |
| Styling | Tailwind CSS | Utility-first CSS |
| Animations | Framer Motion | Page transitions, modals |
| Icons | Lucide React | Consistent icon set |
| Toasts | React Hot Toast | Admin notifications |
| Backend | Node.js + Express | REST API server |
| Database | PostgreSQL | Relational data store |
| ORM | Prisma 5 | Type-safe database queries |
| Auth | JWT (jsonwebtoken) | Stateless authentication |
| Password | bcryptjs | Password hashing (12 salt rounds) |
| Validation | express-validator | Request body validation |
| Scheduling | node-cron | Daily freeze/expiry jobs |
| Security | Helmet + CORS + Rate Limiting | HTTP security headers |
| Logging | Morgan | HTTP request logging (dev mode) |

---

## Project Structure

```
gym-platform/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma                 # All models, enums, relations
│   ├── src/
│   │   ├── app.js                        # Express server, middleware, routes, cron init
│   │   ├── controllers/
│   │   │   ├── authController.js         # Admin login, getMe
│   │   │   ├── userAuthController.js     # User signup, login, profile, updateProfile
│   │   │   ├── gymController.js          # Gym CRUD, plan assignment
│   │   │   ├── planController.js         # Plan CRUD (includes freeze policy fields)
│   │   │   ├── membershipController.js   # Purchase, view, access check, admin CRUD
│   │   │   └── freezeController.js       # Freeze, unfreeze, cancel, history, admin force-unfreeze
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js         # protect (admin) + protectUser (user)
│   │   │   ├── validateMiddleware.js     # All validation rules
│   │   │   └── errorMiddleware.js        # 404 + global error handler
│   │   ├── routes/
│   │   │   ├── authRoutes.js             # POST /login, GET /me
│   │   │   ├── userAuthRoutes.js         # POST /signup, POST /login, GET/PUT /profile
│   │   │   ├── gymRoutes.js              # Full gym CRUD + plan assignment
│   │   │   ├── planRoutes.js             # Full plan CRUD + gym assignment
│   │   │   ├── membershipRoutes.js       # Purchase, my memberships, admin endpoints
│   │   │   └── freezeRoutes.js           # Freeze/unfreeze/cancel/history, admin endpoints
│   │   └── utils/
│   │       ├── seed.js                   # Seeds 10 gyms, 12 plans, 2 admins
│   │       ├── freezeCron.js             # 3 daily cron jobs
│   │       └── testFreeze.js             # 9 automated freeze tests
│   ├── .env                              # Environment config
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                       # All routes (public, user, admin)
│   │   ├── components/
│   │   │   ├── landing/
│   │   │   │   ├── Navbar.jsx            # Nav with Login/Dashboard button
│   │   │   │   ├── HeroSection.jsx       # Animated hero
│   │   │   │   ├── GymSection.jsx        # Gym cards listing
│   │   │   │   ├── CTASection.jsx        # Call to action
│   │   │   │   └── Footer.jsx            # Footer
│   │   │   ├── admin/
│   │   │   │   ├── Sidebar.jsx           # 4 tabs: Plans, Gyms, Members, Freezes
│   │   │   │   ├── PlanForm.jsx          # Plan create/edit with freeze policy fields
│   │   │   │   ├── PlansTable.jsx        # Plans listing table
│   │   │   │   ├── GymsTable.jsx         # Gyms listing table
│   │   │   │   ├── GymForm.jsx           # Gym create/edit form
│   │   │   │   ├── MembersTab.jsx        # All memberships with filters + force unfreeze
│   │   │   │   ├── FreezesTab.jsx        # All freeze records with filters
│   │   │   │   ├── PlanAssignGyms.jsx    # Assign plan to multiple gyms
│   │   │   │   ├── PlanGymAssign.jsx     # Assign plans to a gym
│   │   │   │   └── BenefitsEditor.jsx    # Edit plan benefits
│   │   │   ├── user/
│   │   │   │   ├── MembershipCard.jsx    # Membership display with freeze info + actions
│   │   │   │   ├── FreezeModal.jsx       # Date picker + duration slider + confirmation
│   │   │   │   └── FreezeHistory.jsx     # Freeze history timeline modal
│   │   │   └── ui/
│   │   │       ├── Modal.jsx             # Reusable modal (admin)
│   │   │       ├── ProtectedRoute.jsx    # Admin route guard
│   │   │       └── UserProtectedRoute.jsx # User route guard
│   │   ├── context/
│   │   │   ├── AuthContext.jsx           # Admin auth (gym_admin_token)
│   │   │   └── UserAuthContext.jsx       # User auth (gym_user_token)
│   │   ├── hooks/
│   │   │   ├── usePlans.js              # Plans state + CRUD methods
│   │   │   └── useGyms.js               # Gyms state + CRUD methods
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx          # Public homepage
│   │   │   ├── GymDetailPage.jsx        # Gym info + plan cards + Buy Now
│   │   │   ├── admin/
│   │   │   │   ├── LoginPage.jsx        # Admin login form
│   │   │   │   └── DashboardPage.jsx    # 4-tab admin dashboard
│   │   │   └── user/
│   │   │       ├── UserLoginPage.jsx    # User login form
│   │   │       ├── UserSignupPage.jsx   # User registration form
│   │   │       └── UserDashboard.jsx    # Memberships + freeze management
│   │   ├── services/
│   │   │   └── api.js                   # Axios with smart token routing
│   │   └── utils/
│   │       └── duration.js              # Duration formatting helper
│   ├── tailwind.config.js               # Neon theme colors + animations
│   └── package.json
│
├── README.md                             # Quick start guide
└── project_guide.md                      # This file (detailed docs)
```

---

## Detailed File-by-File Explanation

### Database Schema (`backend/prisma/schema.prisma`)

| Model | Kya hai |
|-------|---------|
| **Admin** | Admin users (email, password) |
| **Gym** | Gyms - name, slug, area, city, address, phone, hours, rating, seats, amenities (JSON), category |
| **Plan** | Membership plans - name, duration, price, discounted price, deferred payments (3 options), benefits (JSON), freeze limits |
| **GymPlan** | Many-to-many junction table between Gym & Plan |
| **User** | Registered users - name, email, phone, password |
| **Membership** | User ka membership - userId, planId, gymId, startDate, endDate, status (ACTIVE/FROZEN/EXPIRED/CANCELLED), freeze usage tracking |
| **MembershipFreeze** | Freeze records - start/end date, requested days, actual days, reason, status (SCHEDULED/ACTIVE/COMPLETED/AUTO_COMPLETED/CANCELLED) |

---

### Backend — `app.js` (Main Server)
- Express server with Helmet (security), CORS, Morgan (logging), Rate limiting
- Rate limit: 100 req/15min general, 10 req/15min for login endpoints
- Registers all routes and starts freeze cron jobs
- Port 5000

---

### Backend — Controllers

| File | Kya karta hai |
|------|---------------|
| `authController.js` | **Admin login** (email+password → JWT token) + `getMe` for admin profile |
| `userAuthController.js` | **User signup/login** + `getProfile` (with recent memberships & freezes) + `updateProfile` (name/phone) |
| `gymController.js` | **Gym CRUD** — public: `getGyms`, `getGymBySlug`, `getGymPlans` / admin: `createGym`, `updateGym`, `deleteGym`, `setGymPlans` |
| `planController.js` | **Plan CRUD** — public: `getPlans` (filter by gym) / admin: `createPlan`, `updatePlan`, `deletePlan`, `updatePlanGyms` |
| `membershipController.js` | **Membership management** — user: `purchaseMembership`, `getMyMemberships`, `checkAccess` / admin: `getAllMemberships`, `adminCreateMembership` |
| `freezeController.js` | **Freeze system** — user: `requestFreeze` (validates limits, overlaps, dates), `cancelFreeze`, `unfreeze` / admin: `adminForceUnfreeze`, `adminGetAllFreezes` |

---

### Backend — Middleware

| File | Kya karta hai |
|------|---------------|
| `authMiddleware.js` | `protect` — Admin JWT verify / `protectUser` — User JWT verify + active account check |
| `errorMiddleware.js` | 404 handler + global error handler (dev me stack trace dikhata hai) |
| `validateMiddleware.js` | Express-validator rules — login, plans, users (Indian phone format), memberships, freezes |

---

### Backend — Routes (API Endpoints)

| File | Base Path | Key Endpoints |
|------|-----------|---------------|
| `authRoutes.js` | `/api/admin` | POST `/login`, GET `/me` |
| `userAuthRoutes.js` | `/api/user` | POST `/signup`, POST `/login`, GET/PUT `/profile` |
| `gymRoutes.js` | `/api/gyms` | GET `/` (public), GET `/all` (admin), POST/PUT/DELETE (admin), GET `/:slug/details`, GET `/:id/plans` |
| `planRoutes.js` | `/api/plans` | GET `/` (public), GET `/all` (admin), POST/PUT/DELETE (admin), PUT `/:id/gyms` |
| `membershipRoutes.js` | `/api/memberships` | POST `/purchase`, GET `/my`, GET `/all` (admin), POST `/admin-create` |
| `freezeRoutes.js` | `/api/memberships` | POST `/:id/freeze`, POST `/:id/unfreeze`, POST `/cancel/:freezeId`, GET `/:id/freeze-status`, GET `/admin/all` |

---

### Backend — Utils

| File | Kya karta hai |
|------|---------------|
| `freezeCron.js` | **3 cron jobs** — Daily 00:05 scheduled freezes activate karta hai, 00:10 expired freezes auto-unfreeze karta hai (membership extend hoti hai), 00:15 expired memberships mark karta hai |
| `seed.js` | **DB seeding** — 2 admin accounts (`admin@wtfgyms.com` / `admin123`), 10 WTF gyms (Delhi/NCR), 12 plans (Starter/Plus/Ultra x 30/90/180/365 days), sab plans sab gyms ko assign |
| `testFreeze.js` | **Test script** — 9 test scenarios for freeze feature (immediate freeze, unfreeze, schedule, cancel, limits, overlaps) |

---

### Frontend — Core Files

| File | Kya karta hai |
|------|---------------|
| `main.jsx` | App mount karta hai, Toaster configure karta hai (dark theme, neon green accents) |
| `App.jsx` | **All routes define** — Landing `/`, Gym detail `/:slug`, Admin login `/admin/login`, Admin dashboard `/admin/dashboard`, User login/signup/dashboard. Lazy loading + AnimatePresence |
| `services/api.js` | **Axios client** — auto token attach (admin vs user routes ke liye alag token), 401 pe auto logout + redirect |

---

### Frontend — Context (State Management)

| File | Kya karta hai |
|------|---------------|
| `context/AuthContext.jsx` | **Admin auth** — login/logout, token localStorage me store, session restore on reload |
| `context/UserAuthContext.jsx` | **User auth** — signup/login/logout, profile refresh, token persistence |

---

### Frontend — Hooks

| File | Kya karta hai |
|------|---------------|
| `hooks/useGyms.js` | Gym fetch/create/update/delete + gym-plan associations manage karta hai |
| `hooks/usePlans.js` | Plan fetch/create/update/delete + plan-gym assignments, gym ID se filter support |

---

### Frontend — Pages

| File | Kya hai |
|------|---------|
| `pages/LandingPage.jsx` | **Home page** — Navbar + Hero + Gyms + CTA + Footer compose karta hai |
| `pages/GymDetailPage.jsx` | **Gym detail** — Gym info (name, address, rating, hours, amenities) + sticky plans panel right side pe, purchase flow with color-coded duration pills |
| `pages/admin/LoginPage.jsx` | Admin login form (dark theme, demo credentials hint) |
| `pages/admin/DashboardPage.jsx` | **Admin dashboard** — 4 tabs: Plans / Gyms / Members / Freezes. Full CRUD modals + toasts |
| `pages/user/UserLoginPage.jsx` | User login form |
| `pages/user/UserSignupPage.jsx` | User registration (name, email, phone, password + confirm) |
| `pages/user/UserDashboard.jsx` | **User dashboard** — Active/past memberships, freeze/unfreeze controls, freeze history modal |

---

### Frontend — Admin Components

| File | Kya hai |
|------|---------|
| `components/admin/Sidebar.jsx` | Responsive sidebar — logo, admin badge, 4 nav tabs, logout |
| `components/admin/PlansTable.jsx` | Plans table — name, category, price, visibility toggle, gym count, edit/delete/assign actions |
| `components/admin/PlanForm.jsx` | Plan create/edit form — name, duration, category, pricing (discount + 3 deferred options), freeze policy, benefits |
| `components/admin/GymsTable.jsx` | Gyms table — name, category, location, seats, plans, active toggle |
| `components/admin/GymForm.jsx` | Gym create/edit form — name, slug, location, contact, hours, rating, seats, amenities checkboxes |
| `components/admin/PlanAssignGyms.jsx` | Modal — plan ko gyms assign karo (category filter + select all) |
| `components/admin/PlanGymAssign.jsx` | Gym-centric view — gym ko plans assign karo with duration tabs |
| `components/admin/PlanMatrix.jsx` | **Matrix view** — gym x plan grid, bulk toggles, unsaved changes tracking |
| `components/admin/BenefitsEditor.jsx` | Plan benefits edit modal — add/remove/edit inline |
| `components/admin/MembersTab.jsx` | Members + memberships table, search/filter by status, force-unfreeze action |
| `components/admin/FreezesTab.jsx` | All freeze records, status filters, search |

---

### Frontend — Landing Page Components

| File | Kya hai |
|------|---------|
| `components/landing/Navbar.jsx` | Fixed navbar — logo, location badge, nav links, auth buttons, mobile hamburger |
| `components/landing/HeroSection.jsx` | Big animated hero — "STOP WASTING TIME" headline, CTAs, stats row |
| `components/landing/GymSection.jsx` | Filterable gym grid — city filter + search, GymCard components |
| `components/landing/GymCard.jsx` | Gym card — name, rating, location, hours, amenities, plan count |
| `components/landing/PlansSection.jsx` | 3-plan preview, "select gym for pricing" nudge |
| `components/landing/PlanCard.jsx` | Plan card — duration badge, name, price, benefits, CTA |
| `components/landing/BenefitsSection.jsx` | Feature cards + comparison table (Base/Plus/Ultra tiers) |
| `components/landing/CTASection.jsx` | "Your Transformation Starts Now" CTA + contact info |
| `components/landing/Footer.jsx` | Multi-column footer — brand, links, contact, admin login link |

---

### Frontend — User Components

| File | Kya hai |
|------|---------|
| `components/user/MembershipCard.jsx` | Membership details card — plan, gym, dates, days left, active freezes, freeze quota, action buttons |
| `components/user/FreezeModal.jsx` | Freeze request modal — start date, duration, reason, preview summary |
| `components/user/FreezeHistory.jsx` | Freeze history modal — status badges + timestamps |

---

### Frontend — UI Components

| File | Kya hai |
|------|---------|
| `components/ui/Badge.jsx` | Reusable badge (variants: popular, bestValue, duration, tiers) |
| `components/ui/Modal.jsx` | Reusable animated modal — backdrop, size options, light/dark themes |
| `components/ui/ProtectedRoute.jsx` | Admin route guard — unauthenticated to admin login redirect |
| `components/ui/UserProtectedRoute.jsx` | User route guard — unauthenticated to user login redirect |
| `components/ui/LoadingSkeleton.jsx` | Skeleton loaders for plan cards and table rows |

---

### Frontend — Utils

| File | Kya hai |
|------|---------|
| `utils/duration.js` | Days ko readable label me convert karta hai (30→Monthly, 90→Quarterly, etc.) + duration-based color utilities |

---

### Root Files

| File | Kya hai |
|------|---------|
| `setup.bat` / `setup-dev.bat` / `db-setup.bat` | Windows batch scripts for project setup & DB initialization |
| `README.md` | Quick start guide |
| `project_guide.md` | This file (detailed docs) |

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL running locally
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
# Edit .env with your DATABASE_URL
npx prisma db push          # Create/sync tables
npx prisma generate         # Generate Prisma client (stop server first)
npm run db:seed              # Seed: 10 gyms, 12 plans, 2 admins
npm run dev                  # Start on port 5000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev                  # Start on port 5173
```

### URLs

| Page | URL | Access |
|------|-----|--------|
| Landing | http://localhost:5173 | Public |
| User Signup | http://localhost:5173/signup | Public |
| User Login | http://localhost:5173/login | Public |
| User Dashboard | http://localhost:5173/dashboard | User only |
| Admin Login | http://localhost:5173/admin/login | Public |
| Admin Dashboard | http://localhost:5173/admin | Admin only |

### Default Admin Credentials

| Email | Password |
|-------|----------|
| `admin@wtfgyms.com` | `admin123` |
| `admin@gym.com` | `admin123` |

---

## Authentication System

The platform has **two separate JWT auth systems**:

### Admin Auth
- Token stored in `localStorage` as `gym_admin_token`
- Middleware: `protect` in authMiddleware.js
- Sets `req.adminId` on protected routes
- Used for: Plan/Gym CRUD, Members management, Freeze management

### User Auth
- Token stored in `localStorage` as `gym_user_token`
- Middleware: `protectUser` in authMiddleware.js
- Sets `req.userId` on protected routes
- Token includes `role: 'user'` in JWT payload
- Used for: Membership purchase, Freeze/unfreeze, Profile

### Token Routing (api.js)
The Axios interceptor uses `isAdminRoute()` to decide which token to attach:
- Admin routes: `/admin/*`, `/plans/*`, `/gyms/*`, `/memberships/all`, `/memberships/admin/*`
- User routes: `/user/*`, `/memberships/my`, `/memberships/purchase`, `/memberships/:id/freeze`, etc.

### Rate Limiting
- General API: 100 requests / 15 min
- Login endpoints only (`/admin/login`, `/user/login`, `/user/signup`): 10 requests / 15 min

---

## Database Schema

### Models

#### Admin
```
id        String   @id @default(cuid())
email     String   @unique
password  String   (bcrypt hashed)
```

#### User
```
id        String   @id @default(cuid())
name      String
email     String   @unique
phone     String   @unique
password  String   (bcrypt hashed)
isActive  Boolean  @default(true)
```

#### Gym
```
id         String   @id @default(cuid())
name       String
slug       String   @unique
area       String
city       String
address    String
phone      String
hours      String
rating     Float    @default(5.0)
totalSeats Int
seatsLeft  Int
amenities  Json     (array of strings)
category   String
isActive   Boolean
```

#### Plan
```
id              String   @id @default(cuid())
name            String
category        String   (WTF Starter / WTF Plus / WTF Ultra)
durationDays    Int      (30 / 90 / 180 / 365)
price           Float
discountedPrice Float?
isVisible       Boolean
benefits        Json     (array of strings)
maxFreezeCount  Int      @default(0)   ← freeze policy
maxFreezeDays   Int      @default(0)   ← freeze policy
```

#### GymPlan (Junction)
```
gymId   String   → Gym
planId  String   → Plan
@@unique([gymId, planId])
```

#### Membership
```
id                    String           @id @default(cuid())
userId                String           → User
planId                String           → Plan
gymId                 String           → Gym
startDate             DateTime
endDate               DateTime         ← gets extended when freeze completes
originalEndDate       DateTime         ← never changes, for reference
status                MembershipStatus (ACTIVE / FROZEN / EXPIRED / CANCELLED)
totalFreezeDaysUsed   Int    @default(0)
totalFreezeCountUsed  Int    @default(0)
```

#### MembershipFreeze
```
id              String       @id @default(cuid())
membershipId    String       → Membership
freezeStartDate DateTime
freezeEndDate   DateTime
requestedDays   Int          ← how many days user requested
actualDays      Int          ← how many days actually frozen (set on unfreeze)
reason          String?      ← optional reason
status          FreezeStatus (SCHEDULED / ACTIVE / COMPLETED / AUTO_COMPLETED / CANCELLED)
```

### Enums

```
MembershipStatus: ACTIVE | FROZEN | EXPIRED | CANCELLED
FreezeStatus:     SCHEDULED | ACTIVE | COMPLETED | AUTO_COMPLETED | CANCELLED
```

### Relations
```
User        → has many Memberships
Membership  → has many MembershipFreezes
Membership  → belongs to User, Plan, Gym
Plan        → has many GymPlans, Memberships
Gym         → has many GymPlans, Memberships
```

---

## Gym & Plan Management

### Admin creates Plans with:
- Name, category (Starter/Plus/Ultra), duration (days), price
- Optional discounted price
- Benefits list (dynamic add/remove)
- **Freeze Policy**: maxFreezeCount + maxFreezeDays
- Visibility toggle (show/hide on website)

### Admin creates Gyms with:
- Name, slug (auto/manual), area, city, address
- Phone, hours, rating, seats
- Amenities (JSON array)
- Active/inactive toggle

### Plan-Gym Assignment:
- Many-to-many via GymPlan junction table
- Admin can assign from Plan side (plan → multiple gyms) or Gym side (gym → multiple plans)

---

## User Flow — Signup to Purchase

```
1. User visits landing page (/)
2. Clicks "Login" in navbar → /login
3. Signs up at /signup (name, email, phone, password)
4. JWT token saved in localStorage as gym_user_token
5. Redirected to /dashboard (empty, no memberships yet)
6. Goes back to landing → clicks a gym → /gym/:slug
7. Sees all plans for that gym
8. Each plan card shows freeze policy: "Freeze: 2 times, up to 15 days"
9. Clicks "Buy Now" on a plan
10. API: POST /api/memberships/purchase {planId, gymId}
11. Membership created: status=ACTIVE, startDate=now, endDate=now+durationDays
12. Redirected to /dashboard → membership card visible
13. If user already has active membership at same gym → error with "Go to Dashboard" link
```

---

## Membership Freeze System (Deep Dive)

### What is Freeze?
Freeze = temporarily pause a membership. During freeze, the member cannot use the gym. When freeze ends, the membership end date extends by the number of days frozen, so the member doesn't lose any paid days.

### Freeze Policy (Admin Configurable per Plan)

| Plan Duration | Recommended Freeze Count | Recommended Freeze Days |
|---------------|-------------------------|------------------------|
| Monthly (30d) | 2 | 15 |
| Quarterly (90d) | 2 | 20 |
| Half-Yearly (180d) | 3 | 30 |
| Annual (365d) | 3 | 45 |

Admin sets `maxFreezeCount` and `maxFreezeDays` when creating/editing a plan. These values are enforced by the API.

### Freeze Statuses — Lifecycle

```
User requests freeze
        |
        |-- Start date = today --> ACTIVE (membership status -> FROZEN)
        |
        +-- Start date = future --> SCHEDULED
                                        |
                                        |-- User cancels before start --> CANCELLED
                                        |
                                        +-- Cron activates on start date --> ACTIVE
                                                                                |
                                                |-------------------------------+
                                                |
                                                |-- User manually unfreezes --> COMPLETED
                                                |     (actualDays = days since start)
                                                |
                                                +-- Freeze end date passes --> AUTO_COMPLETED
                                                      (cron job, actualDays = requestedDays)
```

### Freeze Request — Validations (freezeController.js)

When user requests a freeze, these checks run in order:

1. Membership exists and belongs to user
2. Membership status is ACTIVE (not frozen, expired, or cancelled)
3. Plan has freeze enabled (maxFreezeCount > 0 and maxFreezeDays > 0)
4. Freeze count not exceeded: `totalFreezeCountUsed < maxFreezeCount`
5. Freeze days not exceeded: `freezeDays <= (maxFreezeDays - totalFreezeDaysUsed)`
6. Start date is today or future (not past)
7. Start date is before membership end date
8. No overlapping freeze exists (uses exclusive boundary check)

### Overlap Detection Logic

```
-- A new freeze (newStart -> newEnd) overlaps if:
WHERE freezeStartDate < newEnd AND freezeEndDate > newStart

-- This means:
-- Existing: June 1-5, New: June 5-10 -> NOT overlapping (allowed)
-- Existing: June 1-5, New: June 4-10 -> OVERLAPPING (blocked)
```

Same-day boundary is allowed: freeze ending June 5 and new freeze starting June 5 = OK.

### Manual Unfreeze (Early End)

When user clicks "Unfreeze Now":
1. `actualDays = ceil(today - freezeStartDate)` -> only actual days count
2. `membership.endDate += actualDays` -> extend by actual, not requested
3. `membership.totalFreezeDaysUsed += actualDays`
4. `membership.status = ACTIVE`
5. `freeze.status = COMPLETED`

**Example:** User requested 20 days, unfreezes after 12 days:
- actualDays = 12
- Membership extends by 12 days (not 20)
- 12 days consumed from freeze quota
- Remaining 8 days are lost (user chose to end early)

### Auto-Unfreeze (Cron)

When freeze period ends naturally (cron job):
1. `actualDays = requestedDays` -> full requested period used
2. `membership.endDate += requestedDays`
3. `membership.totalFreezeDaysUsed += requestedDays`
4. `membership.status = ACTIVE`
5. `freeze.status = AUTO_COMPLETED`

### Edge Case: Expiry Boundary (TC10)

**Scenario:** Membership ends June 30. User freezes June 25 for 10 days.

**What happens:**
- Freeze runs June 25 -> July 5
- Membership endDate is still June 30 while frozen
- Membership does NOT expire during freeze (cron only expires ACTIVE memberships)
- On July 5, auto-unfreeze: endDate = June 30 + 10 = July 10
- Membership continues until July 10

**Key:** End date extension happens AFTER freeze completes, not when freeze is created.

### Freeze Quota Tracking

Each membership tracks:
- `totalFreezeCountUsed` — incremented when freeze becomes ACTIVE (not scheduled)
- `totalFreezeDaysUsed` — incremented when freeze completes (actual days)

Remaining quota shown to user:
- `remainingFreezes = plan.maxFreezeCount - membership.totalFreezeCountUsed`
- `remainingDays = plan.maxFreezeDays - membership.totalFreezeDaysUsed`

### Frontend Freeze UI

**User Dashboard (MembershipCard.jsx):**
- Shows freeze quota: "Freezes Left: 2/3" and "Freeze Days Left: 30/45"
- "Freeze Membership" button (disabled if no freezes remaining)
- Active freeze info box (blue) with "Unfreeze Now" button
- Scheduled freeze info box (yellow) with "Cancel" button
- "Freeze History" button

**FreezeModal.jsx:**
- Date picker for start date (min = today)
- Number input + slider for freeze days (max = remaining days)
- Optional reason field
- Freeze summary preview (from, to, duration, type: immediate/scheduled)
- Error display inside modal for limit/validation errors
- Scrollable modal (max-h-90vh) for small screens

**FreezeHistory.jsx:**
- Modal with all freeze records
- Each record shows: dates, requested vs actual days, status, reason

### Admin Freeze Management

**Members Tab (MembersTab.jsx):**
- All memberships with user info, plan, gym, dates
- Freeze usage: "2/3 freezes, 15/45 days"
- Status filter (ACTIVE, FROZEN, EXPIRED, CANCELLED)
- Search by name, email, phone, gym
- "Force Unfreeze" button on frozen memberships

**Freezes Tab (FreezesTab.jsx):**
- All freeze records across all memberships
- Filter by status (SCHEDULED, ACTIVE, COMPLETED, AUTO_COMPLETED, CANCELLED)
- Stats cards: total, scheduled, active, completed, cancelled
- Search by member name, email, gym, plan

---

## Cron Jobs

File: `backend/src/utils/freezeCron.js`

Three cron jobs run daily:

### 1. Activate Scheduled Freezes (00:05 AM)
```
Finds: MembershipFreeze WHERE status=SCHEDULED AND freezeStartDate <= today
Action:
  - If membership is ACTIVE -> freeze.status = ACTIVE, membership.status = FROZEN, increment freezeCount
  - If membership is NOT active -> freeze.status = CANCELLED (skip)
```

### 2. Auto-Unfreeze (00:10 AM)
```
Finds: MembershipFreeze WHERE status=ACTIVE AND freezeEndDate <= now
Action:
  - actualDays = requestedDays
  - membership.endDate += actualDays
  - membership.totalFreezeDaysUsed += actualDays
  - membership.status = ACTIVE
  - freeze.status = AUTO_COMPLETED
```

### 3. Expire Memberships (00:15 AM)
```
Finds: Membership WHERE status=ACTIVE AND endDate < now
Action: membership.status = EXPIRED
Note: Only ACTIVE memberships expire. FROZEN ones are protected.
```

---

## Admin Dashboard

### Plans Tab
- Create/edit plans with all fields including freeze policy
- Toggle visibility (show/hide on website)
- Delete plans
- Assign plans to gyms
- Manage benefits list
- Search + category filter

### Gyms Tab
- Create/edit gyms with all details
- Toggle active/inactive
- Delete gyms
- Assign plans to gym
- Search by name, city, area

### Members Tab
- View all memberships (user, plan, gym, dates, status)
- See freeze usage per membership
- Filter by status
- Search by member name/email/phone/gym
- Force unfreeze frozen memberships
- Stats: total, active, frozen, expired

### Freezes Tab
- View all freeze records
- Filter by freeze status
- Search by member/gym/plan
- Stats: total, scheduled, active, completed, cancelled

---

## API Reference

### Admin Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/login` | Public | Login, returns JWT |
| GET | `/api/admin/me` | Admin | Get admin profile |

### User Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/user/signup` | Public | Register (name, email, phone, password) |
| POST | `/api/user/login` | Public | Login, returns JWT |
| GET | `/api/user/profile` | User | Profile + memberships + recent freezes |
| PUT | `/api/user/profile` | User | Update name, phone |

### Plans
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/plans` | Public | Visible plans (optional `?gymId=`) |
| GET | `/api/plans/all` | Admin | All plans including hidden |
| GET | `/api/plans/:id` | Public | Single plan |
| POST | `/api/plans` | Admin | Create plan (name, durationDays, price, benefits, maxFreezeCount, maxFreezeDays) |
| PUT | `/api/plans/:id` | Admin | Update plan fields |
| PUT | `/api/plans/:id/gyms` | Admin | Assign plan to gyms |
| DELETE | `/api/plans/:id` | Admin | Delete plan |

### Gyms
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/gyms` | Public | Active gyms |
| GET | `/api/gyms/all` | Admin | All gyms |
| GET | `/api/gyms/:slug/details` | Public | Gym detail with plans |
| GET | `/api/gyms/:id/plans` | Public | Plans at a gym |
| POST | `/api/gyms` | Admin | Create gym |
| PUT | `/api/gyms/:id` | Admin | Update gym |
| PUT | `/api/gyms/:id/plans` | Admin | Set gym's plans |
| DELETE | `/api/gyms/:id` | Admin | Delete gym |

### Memberships
| Method | Endpoint | Auth | Request Body | Description |
|--------|----------|------|-------------|-------------|
| POST | `/api/memberships/purchase` | User | `{planId, gymId}` | Purchase membership |
| GET | `/api/memberships/my` | User | — | User's memberships with freezes |
| GET | `/api/memberships/my/:id` | User | — | Single membership detail |
| GET | `/api/memberships/my/:id/access` | User | — | Check gym access (blocked if frozen/expired) |
| GET | `/api/memberships/all` | Admin | `?status=&gymId=&userId=` | All memberships |
| POST | `/api/memberships/admin-create` | Admin | `{userId, planId, gymId, startDate?}` | Create membership for user |

### Freeze System
| Method | Endpoint | Auth | Request Body | Description |
|--------|----------|------|-------------|-------------|
| POST | `/api/memberships/:id/freeze` | User | `{startDate, freezeDays, reason?}` | Request freeze |
| POST | `/api/memberships/:id/unfreeze` | User | — | Manual unfreeze |
| POST | `/api/memberships/cancel/:freezeId` | User | — | Cancel scheduled freeze |
| GET | `/api/memberships/:id/freeze-status` | User | — | Quota + active/scheduled freezes |
| GET | `/api/memberships/:id/freeze-history` | User | — | All freeze records |
| POST | `/api/memberships/admin/:id/force-unfreeze` | Admin | — | Force unfreeze |
| GET | `/api/memberships/admin/all` | Admin | `?status=` | All freeze records |

### Freeze Request Example
```json
POST /api/memberships/clxyz123/freeze
{
  "startDate": "2026-04-10",
  "freezeDays": 7,
  "reason": "Travelling"
}
```

### Freeze Response Example
```json
{
  "freeze": {
    "id": "clxyz...",
    "membershipId": "clxyz...",
    "freezeStartDate": "2026-04-10T00:00:00.000Z",
    "freezeEndDate": "2026-04-17T00:00:00.000Z",
    "requestedDays": 7,
    "status": "SCHEDULED"
  },
  "message": "Freeze scheduled for 2026-04-10",
  "remainingFreezes": 1,
  "remainingFreezeDays": 8
}
```

### Freeze Error Responses
```json
{ "error": "Freeze limit reached. Maximum 3 freezes allowed for WTF Plus", "remainingFreezes": 0 }
{ "error": "Only 8 freeze days remaining out of 45", "remainingDays": 8 }
{ "error": "Cannot freeze a frozen membership" }
{ "error": "This freeze overlaps with an existing freeze" }
{ "error": "Freeze start date cannot be in the past" }
{ "error": "Freeze start date must be before membership expiry" }
{ "error": "Freeze is not available for this plan" }
```

---

## Frontend Architecture

### Routing (App.jsx)
```
/                    -> LandingPage (public)
/gym/:slug           -> GymDetailPage (public, plan purchase)
/login               -> UserLoginPage (public)
/signup              -> UserSignupPage (public)
/dashboard           -> UserDashboard (UserProtectedRoute)
/admin/login         -> AdminLoginPage (public)
/admin               -> AdminDashboardPage (ProtectedRoute)
*                    -> Redirect to /
```

### Auth Contexts
- `AuthContext` — Admin state, login/logout, `gym_admin_token`
- `UserAuthContext` — User state, signup/login/logout, `gym_user_token`, refreshProfile

### API Service (api.js)
- Axios instance with baseURL `/api`
- Request interceptor: attaches correct token based on `isAdminRoute(url)`
- Response interceptor: on 401, clears relevant token and redirects

### Theme
- Dark mode (neon green) for user-facing pages
- Light mode (white/gray) for admin dashboard
- Colors: `neon-green (#39FF14)`, `neon-cyan (#00FFFF)`, `dark-900 (#050508)`

---

## Testing

### Automated Freeze Test Suite

```bash
cd backend
node src/utils/testFreeze.js
```

Runs 9 tests in ~2 seconds by manipulating dates directly in the database (no waiting):

| # | Test | What it verifies |
|---|------|-----------------|
| 1 | Immediate freeze | Status changes to FROZEN, freeze count incremented |
| 2 | Manual unfreeze (early) | Only actual days count (3 of 5), endDate extends by 3 |
| 3 | Schedule future freeze | Status = SCHEDULED, membership stays ACTIVE |
| 4 | Cancel scheduled freeze | Status = CANCELLED, no impact on membership |
| 5 | Auto-unfreeze (cron) | Cron completes freeze, extends membership by requested days |
| 6 | Freeze count limit | Blocks when totalFreezeCountUsed >= maxFreezeCount |
| 7 | Overlap detection | Blocks overlapping dates, allows same-day boundary |
| 8 | Expired membership | Freeze blocked on EXPIRED membership |
| 9 | Expiry boundary (TC10) | End date extends past original expiry correctly |

Test auto-cleans up — no leftover data in database.

### Manual Testing via UI

1. Admin: Login -> Edit plans -> Set freeze policy (count + days) -> Save
2. User: Signup -> Buy membership on gym page -> Go to dashboard
3. Freeze: Click "Freeze Membership" -> Set date + days -> Confirm
4. Unfreeze: Click "Unfreeze Now" -> Check end date extended
5. Schedule: Set future date -> See "Upcoming Freeze" -> Cancel it
6. Limits: Try freezing beyond count/days limit -> See error in modal
7. Admin: Check Members tab + Freezes tab -> Force unfreeze

### Manual Cron Trigger
```bash
cd backend
node -e "require('./src/utils/freezeCron').autoUnfreeze().then(() => process.exit())"
node -e "require('./src/utils/freezeCron').activateScheduledFreezes().then(() => process.exit())"
node -e "require('./src/utils/freezeCron').expireMemberships().then(() => process.exit())"
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:admin@localhost:5432/gym_platform"

# JWT
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:5173"
```

---

## Common Issues & Fixes

### "EPERM: operation not permitted" on prisma generate
**Cause:** Server (nodemon) is running and has Prisma client file locked.
**Fix:** Stop the server first, then run `npx prisma generate`, then restart.

### "Too many login attempts"
**Cause:** Rate limiter on login endpoints (10 requests / 15 min).
**Fix:** Wait 15 minutes, or restart server (clears in-memory rate limit store).

### User gets logged out when clicking freeze
**Cause:** API interceptor sending wrong token (admin token instead of user token).
**Fix:** Check `isAdminRoute()` in api.js covers all admin membership routes.

### Freeze days showing negative
**Cause:** Auto-unfreeze was calculating `freezeEndDate - freezeStartDate` which could be negative if dates were manipulated.
**Fix:** Auto-unfreeze uses `requestedDays` instead of date calculation.

### Plan edit not saving freeze policy
**Cause:** planController.js `updatePlan` wasn't extracting `maxFreezeCount` / `maxFreezeDays` from request body.
**Fix:** Added both fields to create and update functions in planController.

### Membership not expiring
**Cause:** Cron only expires `ACTIVE` memberships. `FROZEN` ones are protected.
**Fix:** This is intentional. Frozen memberships don't expire until unfrozen.

### Freeze modal not scrollable
**Cause:** Modal had no max-height or overflow set.
**Fix:** Added `max-h-[90vh] overflow-y-auto` to modal container.

### Freeze error shows behind modal
**Cause:** API error was going to dashboard toast instead of modal's internal error state.
**Fix:** `handleFreeze` now throws error so FreezeModal's catch block handles it internally.

---

## Interview / Viva Questions & Answers

---

### General Project Questions

**Q1: Ye project kya hai? Ek line me batao.**
A: Ye ek gym membership platform hai jahan users gym plans purchase kar sakte hain, aur apni membership ko freeze/unfreeze kar sakte hain, with a full admin dashboard for management.

**Q2: Tech stack kya use kiya hai aur kyun?**
A: Frontend me React + Vite (fast dev, component-based), Tailwind CSS (rapid styling), Framer Motion (animations). Backend me Node.js + Express (fast API), PostgreSQL + Prisma (type-safe ORM, relational data). JWT for stateless auth, node-cron for scheduled jobs. Ye stack isliye choose kiya kyunki ye modern, scalable, aur full-stack JavaScript hai — ek hi language frontend + backend dono me.

**Q3: Database me kitne models hain? Kaunse?**
A: 7 models hain: Admin, User, Gym, Plan, GymPlan (junction), Membership, MembershipFreeze. Plus 2 enums: MembershipStatus aur FreezeStatus.

**Q4: Admin aur User ka auth alag kyun hai?**
A: Security ke liye. Admin ka JWT me koi role nahi hai (legacy), User ka JWT me `role: 'user'` hai. Dono alag middleware se protect hote hain (`protect` vs `protectUser`). Agar ek compromised ho to doosra safe rahe. Tokens bhi alag localStorage keys me store hote hain (`gym_admin_token` vs `gym_user_token`).

**Q5: Prisma kyun use kiya? Sequelize ya raw SQL kyun nahi?**
A: Prisma ka schema declarative hai (easy to read), migrations automatic hain, TypeScript-like type safety milti hai JavaScript me bhi. Raw SQL error-prone hai, Sequelize ka syntax verbose hai. Prisma Studio bhi milta hai free me database browse karne ke liye.

**Q6: Rate limiting kaise implement ki hai?**
A: `express-rate-limit` package se. General API pe 100 req/15 min. Login endpoints pe strict 10 req/15 min (brute-force protection). Rate limiter sirf login pe lagta hai, `/admin/me` jaisi frequent calls pe nahi.

---

### Membership System Questions

**Q7: User membership kaise purchase karta hai?**
A: User signup karta hai → gym page pe jaata hai → plan select karta hai → "Buy Now" click karta hai → API call: `POST /api/memberships/purchase {planId, gymId}` → Membership create hoti hai with status=ACTIVE, startDate=today, endDate=today+durationDays.

**Q8: Ek user ek gym me do active membership le sakta hai kya?**
A: Nahi. API check karta hai ki us user ki us gym me already ACTIVE ya FROZEN membership toh nahi hai. Agar hai to error: "You already have an active membership at this gym".

**Q9: Membership expire kaise hoti hai?**
A: Daily cron job (00:15 AM) chalti hai jo check karti hai: kaunsi ACTIVE memberships ki endDate beet chuki hai. Unka status EXPIRED kar deti hai. FROZEN memberships ko skip karti hai — wo protected hain.

**Q10: originalEndDate aur endDate me kya farak hai?**
A: `originalEndDate` kabhi change nahi hota — ye reference ke liye hai ki membership originally kab expire hone wali thi. `endDate` freeze ke baad extend hota hai. Isse pata chalta hai ki freeze se kitne din extend hue.

---

### Freeze System Questions (Most Important)

**Q11: Freeze system kya hai? Simple me samjhao.**
A: Freeze matlab membership ko temporarily pause karna. Jab freeze active ho, member gym nahi ja sakta. Jab freeze khatam ho, membership ki expiry date utne din aage badh jaati hai jitne din freeze tha. Isse member ke paid days waste nahi hote.

**Q12: Freeze policy kaise set hoti hai?**
A: Admin plan create/edit karte waqt `maxFreezeCount` (kitni baar freeze allowed) aur `maxFreezeDays` (total kitne din freeze allowed) set karta hai. Ye per-plan basis pe hota hai — monthly plan me 2 baar 15 din, yearly me 3 baar 45 din, etc.

**Q13: Immediate freeze aur scheduled freeze me kya farak hai?**
A: Agar user aaj ki date select kare → immediate freeze (status = ACTIVE, membership turant FROZEN). Agar future date select kare → scheduled freeze (status = SCHEDULED, membership ACTIVE rahe). Cron job scheduled freeze ko start date aane pe ACTIVE karti hai.

**Q14: User 20 din ka freeze lagaye aur 12 din baad khud unfreeze kare to kya hoga?**
A: Sirf 12 din count honge. actualDays = 12. Membership endDate 12 din extend hogi (20 nahi). totalFreezeDaysUsed me 12 add hoga. Baaki 8 din waste — user ne khud jaldi unfreeze kiya.

**Q15: Auto-unfreeze kaise kaam karta hai?**
A: Daily cron job (00:10 AM) check karti hai: kaunsi ACTIVE freezes ki freezeEndDate beet chuki hai. Unke liye: actualDays = requestedDays (poora period), membership endDate += requestedDays, freeze status = AUTO_COMPLETED, membership status = ACTIVE.

**Q16: Agar membership 5 din me expire ho rahi hai aur user 10 din ka freeze lagaye to kya hoga?**
A: Freeze lag jayega. Membership FROZEN ho jayegi. FROZEN membership expire nahi hoti (cron sirf ACTIVE ko expire karti hai). Jab 10 din baad auto-unfreeze hoga, endDate = originalEnd + 10 days. So membership expire nahi hogi freeze ke dauran — ye TC10 edge case hai.

**Q17: Overlapping freeze kaise detect hote hain?**
A: Query: `freezeStartDate < newEnd AND freezeEndDate > newStart`. Agar koi existing SCHEDULED/ACTIVE freeze overlap kare to block. But same-day boundary allowed hai — agar existing June 5 pe end ho aur new June 5 pe start ho to overlap nahi maana jayega.

**Q18: Scheduled freeze cancel kaise hota hai?**
A: User cancel button click karta hai → API: `POST /api/memberships/cancel/:freezeId`. Sirf SCHEDULED status wale freeze cancel ho sakte hain. ACTIVE freeze cancel nahi hota — uske liye "Unfreeze Now" use karna padta hai. Cancel hone pe membership pe koi impact nahi — count/days use nahi hote.

**Q19: Admin force unfreeze kaise karta hai?**
A: Admin Members tab me frozen membership pe "Unfreeze" click karta hai → API: `POST /api/memberships/admin/:id/force-unfreeze`. Ye same logic follow karta hai — actualDays calculate hota hai, endDate extend hoti hai, status ACTIVE hota hai.

**Q20: Freeze count kab increment hota hai?**
A: Jab freeze ACTIVE hota hai (immediately ya cron se). SCHEDULED pe increment nahi hota. Cancel karne pe bhi count wapas nahi aata. Ye intentional hai — scheduling bhi ek freeze count use karti hai jab activate hoti hai.

**Q21: Freeze days kab increment hote hain?**
A: Jab freeze COMPLETE/AUTO_COMPLETE hota hai — actual days tab count hote hain. Scheduled ya cancelled freezes me days count nahi hote.

**Q22: Kya user freeze ke dauran gym ja sakta hai?**
A: Nahi. `checkAccess` API check karti hai — agar membership status FROZEN hai to `accessAllowed = false` return hota hai with message "Membership is currently frozen".

---

### Frontend Questions

**Q23: Admin aur User ka UI alag kyun hai?**
A: Design choice. User-facing pages dark neon theme me hain (gym vibe), admin dashboard clean white/gray me hai (professional). Dono alag React contexts use karte hain, alag routes, alag tokens.

**Q24: API interceptor me token routing kaise kaam karti hai?**
A: `isAdminRoute(url)` function check karta hai: agar URL `/admin`, `/plans`, `/gyms`, `/memberships/all`, ya `/memberships/admin` se start hota hai to admin token bhejta hai. Baaki sab URLs pe user token. Ye isliye zaroori hai kyunki dono auth systems ek hi `/api` base URL share karte hain.

**Q25: Freeze modal me error kaise dikhta hai?**
A: FreezeModal ka `handleSubmit` API call karta hai. Agar error aaye to `catch` block me `setError(err.message)` hota hai — error modal ke andar red box me dikhta hai with heading "Freeze Not Allowed". Dashboard pe toast nahi jaata.

**Q26: ProtectedRoute aur UserProtectedRoute me kya farak hai?**
A: `ProtectedRoute` admin auth check karta hai (`useAuth` context se `isAuthenticated`). `UserProtectedRoute` user auth check karta hai (`useUserAuth` context se `isAuthenticated`). Dono redirect karte hain — admin ko `/admin/login` pe, user ko `/login` pe.

**Q27: Plan card pe freeze info kaise dikhti hai?**
A: GymDetailPage ke PlanCard component me: agar `plan.maxFreezeCount > 0` hai to ek line dikhti hai — "Freeze: 2 times, up to 15 days". Isse user ko purchase se pehle pata chalta hai ki is plan me kitna freeze milega.

---

### Backend / Database Questions

**Q28: Cron jobs kab chalti hain? Agar server restart ho to?**
A: 3 cron jobs hain — 00:05, 00:10, 00:15 AM daily. `app.js` me server start hote hi `startFreezeCron()` call hota hai jo sabhi cron jobs schedule karti hai. Server restart pe cron re-schedule ho jaati hai. In-memory state koi nahi hai — sab database se read hota hai har run pe.

**Q29: Prisma transaction kyun use ki hai freeze me?**
A: Freeze activate/deactivate me 2 operations hote hain — freeze record update + membership record update. Dono ek saath hone chahiye. Agar ek fail ho to doosra bhi rollback ho. `prisma.$transaction([...])` ensure karta hai atomic operation.

**Q30: Password kaise store hota hai?**
A: bcryptjs se hash hota hai with 12 salt rounds. Plain password kabhi database me nahi jaata. Login pe `bcrypt.compare()` se match hota hai. API response me password field kabhi return nahi hoti.

**Q31: Membership purchase me kya kya validate hota hai?**
A: 5 checks: (1) Plan exists and isVisible, (2) Gym exists and isActive, (3) Plan is available at that gym (GymPlan junction), (4) User doesn't already have active/frozen membership at that gym, (5) Valid planId and gymId in request body.

**Q32: Agar do users ek saath same plan purchase karein to race condition hoga kya?**
A: Practically nahi, kyunki har user ki apni membership banti hai — koi shared resource nahi hai (seats tracking abhi implement nahi hai purchase me). Agar seatsLeft tracking add karein future me to pessimistic locking lagani padegi.

---

### Security Questions

**Q33: XSS protection kaise hai?**
A: React by default JSX me sab kuch escape karta hai (no `dangerouslySetInnerHTML` used). Backend pe Helmet security headers set karta hai. User input validated hota hai express-validator se.

**Q34: SQL Injection se kaise bachte hain?**
A: Prisma ORM use karte hain — sab queries parameterized hain. Raw SQL kahi nahi likhte. Prisma internally prepared statements use karta hai.

**Q35: JWT secret leak ho jaaye to?**
A: Sab tokens invalid ho jayenge naya secret set karne pe. `.env` file gitignore me honi chahiye. Production me environment variable se set hota hai, code me hardcode nahi.

**Q36: CORS kaise configured hai?**
A: `CORS_ORIGIN` env variable se. Development me `http://localhost:5173` allowed hai. Production me actual domain set karna padega. `credentials: true` hai for cookie support.

---

### Scalability / Future Questions

**Q37: Payment gateway kaise integrate karenge?**
A: Membership purchase API me Razorpay/Stripe integration hogi. Flow: Frontend pe payment initiate → Razorpay checkout → webhook/callback pe verify → then membership create. `membershipController.js` ke `purchaseMembership` me payment verification add hoga before creating membership.

**Q38: Multi-gym membership kaise handle hoga?**
A: Already handled hai. User har gym me alag membership le sakta hai. Restriction sirf hai ki ek gym me ek time pe ek hi active membership ho.

**Q39: Notification system kaise add karenge?**
A: Freeze events pe webhooks/email triggers add kar sakte hain. Jaise: freeze activate hone pe email, auto-unfreeze pe notification, membership expire hone se 3 din pehle reminder. node-cron me already daily jobs chal rahi hain — wahi me notification logic add hoga.

**Q40: Agar 10,000 members ho jaayein to cron slow hoga kya?**
A: Cron me Prisma `findMany` + `updateMany` use hota hai jo batched SQL queries generate karta hai. 10K records me bhi seconds me ho jayega. Agar 100K+ ho to pagination add karni padegi cron me (batch processing). But current scale ke liye sufficient hai.

**Q41: Mobile app banana ho to backend change karna padega?**
A: Nahi. Backend already REST API hai — same APIs mobile app (React Native / Flutter) se call ho sakti hain. Sirf frontend change hoga. CORS me mobile app ka origin add karna padega.

**Q42: Agar user apna account delete karna chahe to?**
A: Abhi implement nahi hai. But schema me `onDelete: Cascade` hai User → Membership → MembershipFreeze pe. So user delete hone pe sab related data auto-delete ho jayega.

---

### Tricky / Edge Case Questions

**Q43: Agar cron job miss ho jaaye (server down tha raat ko) to kya hoga?**
A: Next run pe catch up ho jayega. Cron `freezeEndDate <= now` check karti hai — agar kal ki freeze aaj process ho to bhi sahi days calculate honge. Koi data loss nahi hoga, sirf delay hoga.

**Q44: User ne freeze lagaya, phir plan admin ne delete kar diya — kya hoga?**
A: Plan delete hone pe membership orphan nahi hogi — Prisma schema me Plan → Membership relation pe `onDelete` Cascade nahi hai (default: Restrict). So admin plan delete nahi kar payega jab tak memberships linked hain. Error aayega.

**Q45: Do users same email se signup kar sakte hain?**
A: Nahi. User model me `email` field `@unique` hai. Phone bhi `@unique` hai. Dono pe duplicate check hai signup API me.

**Q46: Agar user freeze lagaye aur immediately password change kare to freeze affected hoga?**
A: Nahi. Freeze aur auth independent hain. Freeze membership se linked hai, password user se. Token refresh hoga but freeze record database me safe hai.

**Q47: Admin ne plan ka maxFreezeCount 3 se 1 kar diya — jo user already 2 freeze use kar chuka hai uska kya hoga?**
A: Wo user ab aur freeze nahi laga payega (2 >= 1). Already used freezes rollback nahi honge. Ye intentional hai — policy change forward-looking hoti hai, retroactive nahi.

**Q48: Agar freeze start date aur end date same ho (0 days freeze) to?**
A: API me validation hai: `freezeDays` minimum 1 hona chahiye. 0 days freeze request reject hogi. Frontend me bhi slider minimum 1 pe hai.
