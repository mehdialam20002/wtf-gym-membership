# WTF GYMS - Elite Fitness Membership Platform

A production-ready full-stack gym membership platform with dark/neon UI, membership purchase, freeze/unfreeze system, and admin dashboard.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (Admin + User) |
| Cron Jobs | node-cron (auto-unfreeze, membership expiry) |
| UI Icons | Lucide React |
| Notifications | React Hot Toast |

## Project Structure

```
gym-platform/
├── backend/
│   ├── prisma/schema.prisma           # DB schema (Admin, User, Gym, Plan, Membership, MembershipFreeze)
│   ├── src/
│   │   ├── app.js                     # Express entry point + cron init
│   │   ├── controllers/
│   │   │   ├── authController.js      # Admin login/profile
│   │   │   ├── userAuthController.js  # User signup/login/profile
│   │   │   ├── gymController.js       # Gym CRUD
│   │   │   ├── planController.js      # Plan CRUD
│   │   │   ├── membershipController.js # Membership purchase/view/access
│   │   │   └── freezeController.js    # Freeze/unfreeze/cancel/history
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js      # protect (admin) + protectUser (user)
│   │   │   ├── validateMiddleware.js  # All validations
│   │   │   └── errorMiddleware.js     # Error handler
│   │   ├── routes/
│   │   │   ├── authRoutes.js          # /api/admin/*
│   │   │   ├── userAuthRoutes.js      # /api/user/*
│   │   │   ├── gymRoutes.js           # /api/gyms/*
│   │   │   ├── planRoutes.js          # /api/plans/*
│   │   │   ├── membershipRoutes.js    # /api/memberships/*
│   │   │   └── freezeRoutes.js        # /api/memberships/*/freeze*
│   │   └── utils/
│   │       ├── seed.js                # DB seeder (10 gyms, 12 plans, 2 admins)
│   │       ├── freezeCron.js          # Auto-unfreeze + scheduled freeze activation + membership expiry
│   │       └── testFreeze.js          # Freeze system test suite (9 tests)
│   └── .env                           # Environment config
└── frontend/
    └── src/
        ├── components/
        │   ├── landing/               # Navbar, Hero, GymSection, PlansSection, CTA, Footer
        │   ├── admin/                 # Sidebar, PlanForm, PlansTable, GymsTable, GymForm, MembersTab, FreezesTab
        │   ├── user/                  # MembershipCard, FreezeModal, FreezeHistory
        │   └── ui/                    # Modal, ProtectedRoute, UserProtectedRoute
        ├── context/
        │   ├── AuthContext.jsx        # Admin auth state
        │   └── UserAuthContext.jsx    # User auth state
        ├── hooks/
        │   ├── usePlans.js            # Plans CRUD hook
        │   └── useGyms.js             # Gyms CRUD hook
        ├── pages/
        │   ├── LandingPage.jsx        # Public landing page
        │   ├── GymDetailPage.jsx      # Gym detail + plan purchase
        │   ├── admin/
        │   │   ├── LoginPage.jsx      # Admin login
        │   │   └── DashboardPage.jsx  # Admin dashboard (Plans, Gyms, Members, Freezes tabs)
        │   └── user/
        │       ├── UserLoginPage.jsx  # User login
        │       ├── UserSignupPage.jsx # User signup
        │       └── UserDashboard.jsx  # User dashboard (memberships + freeze management)
        └── services/api.js            # Axios instance with smart token routing
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### 1. Setup Backend

```bash
cd backend
npm install

# Configure your database URL in .env
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/gym_platform"

npx prisma db push        # Create tables
npx prisma generate       # Generate Prisma client
npm run db:seed            # Seed admin + gyms + plans
npm run dev                # Start server on :5000
```

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev               # Start on :5173
```

### 3. Open in browser

| Page | URL |
|------|-----|
| Landing Page | http://localhost:5173 |
| User Signup | http://localhost:5173/signup |
| User Login | http://localhost:5173/login |
| User Dashboard | http://localhost:5173/dashboard |
| Admin Login | http://localhost:5173/admin/login |
| Admin Dashboard | http://localhost:5173/admin |

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@wtfgyms.com` | `admin123` |
| Admin | `admin@gym.com` | `admin123` |

---

## Features

### Public Pages
- Dark + neon green aesthetic with animations
- Gym listing with amenities, ratings, location
- Plan browsing with tier-based styling (Starter/Plus/Ultra)
- Duration categories (Monthly/Quarterly/Half-Yearly/Annual)
- Login/Signup buttons in navbar

### User System
- Signup with name, email, phone, password
- Login with JWT token
- Browse gyms and purchase memberships (Buy Now button)
- User dashboard with active/past memberships
- Freeze/unfreeze membership
- View freeze history and remaining quota

### Membership Freeze System
- Freeze membership immediately or schedule for a future date
- Manual unfreeze (early end) - only actual frozen days count
- Auto-unfreeze via daily cron job when freeze period ends
- Cancel scheduled freezes before they start
- Membership end date extends by actual freeze days
- Overlap detection (same-day boundary allowed)
- Per-plan freeze policy (admin configurable)
- Full freeze history tracking

### Admin Dashboard
- **Plans Tab:** Create/edit/delete plans, toggle visibility, manage benefits, assign to gyms, set freeze policy (maxFreezeCount, maxFreezeDays)
- **Gyms Tab:** Create/edit/delete gyms, toggle active status, assign plans
- **Members Tab:** View all memberships with status, search/filter, force unfreeze
- **Freezes Tab:** View all freeze records with status filters, search, analytics

---

## API Endpoints

### Admin Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/login` | Public | Admin login |
| GET | `/api/admin/me` | Admin | Get current admin |

### User Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/user/signup` | Public | User registration |
| POST | `/api/user/login` | Public | User login |
| GET | `/api/user/profile` | User | Get profile with memberships |
| PUT | `/api/user/profile` | User | Update name/phone |

### Plans
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/plans` | Public | Get visible plans |
| GET | `/api/plans/all` | Admin | Get all plans |
| GET | `/api/plans/:id` | Public | Get single plan |
| POST | `/api/plans` | Admin | Create plan (includes freeze policy) |
| PUT | `/api/plans/:id` | Admin | Update plan |
| DELETE | `/api/plans/:id` | Admin | Delete plan |

### Gyms
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/gyms` | Public | Get active gyms |
| GET | `/api/gyms/all` | Admin | Get all gyms |
| GET | `/api/gyms/:slug/details` | Public | Gym detail with plans |
| POST | `/api/gyms` | Admin | Create gym |
| PUT | `/api/gyms/:id` | Admin | Update gym |
| DELETE | `/api/gyms/:id` | Admin | Delete gym |

### Memberships
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/memberships/purchase` | User | Purchase membership |
| GET | `/api/memberships/my` | User | Get user's memberships |
| GET | `/api/memberships/my/:id` | User | Get single membership detail |
| GET | `/api/memberships/my/:id/access` | User | Check gym access (blocked if frozen/expired) |
| GET | `/api/memberships/all` | Admin | Get all memberships |
| POST | `/api/memberships/admin-create` | Admin | Create membership for a user |

### Freeze System
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/memberships/:id/freeze` | User | Request freeze (immediate or scheduled) |
| POST | `/api/memberships/:id/unfreeze` | User | Manual unfreeze (early end) |
| POST | `/api/memberships/cancel/:freezeId` | User | Cancel scheduled freeze |
| GET | `/api/memberships/:id/freeze-status` | User | Get freeze quota + active/scheduled freezes |
| GET | `/api/memberships/:id/freeze-history` | User | Get all freeze records |
| POST | `/api/memberships/admin/:id/force-unfreeze` | Admin | Force unfreeze any membership |
| GET | `/api/memberships/admin/all` | Admin | Get all freeze records |

---

## Membership Freeze — Business Rules

### Freeze Policy (per plan, admin configurable)

| Plan Duration | Max Freeze Count | Max Freeze Days |
|---------------|-----------------|-----------------|
| Monthly (30d) | 2 | 15 |
| Quarterly (90d) | 2 | 20 |
| Half-Yearly (180d) | 3 | 30 |
| Annual (365d) | 3 | 45 |

*These are default recommendations. Admin can set any values per plan.*

### Freeze Statuses

| Status | Meaning |
|--------|---------|
| `SCHEDULED` | Freeze set for future date, not yet active |
| `ACTIVE` | Freeze is currently active, membership paused |
| `COMPLETED` | User manually unfroze early |
| `AUTO_COMPLETED` | Freeze period ended, cron auto-unfroze |
| `CANCELLED` | Scheduled freeze cancelled before start |

### Key Rules
1. Only `ACTIVE` memberships can be frozen
2. Freeze can start today (immediate) or a future date (scheduled)
3. Scheduled freezes can be cancelled before start date
4. Manual unfreeze counts only actual frozen days (not requested days)
5. Auto-unfreeze counts full requested days
6. Membership end date extends AFTER freeze completes (not when created)
7. Overlapping freezes are blocked; same-day boundary is allowed
8. Frozen membership blocks gym access
9. Membership cannot expire while frozen (expiry boundary safe)

### Edge Case: Expiry Boundary (TC10)
If membership ends June 30 and user freezes June 25 for 10 days:
- Freeze runs June 25 → July 5
- On July 5, auto-unfreeze extends end date by 10 days
- New end date = June 30 + 10 = July 10
- Membership does NOT expire during freeze

---

## Cron Jobs

Three daily cron jobs run automatically:

| Time | Job | What it does |
|------|-----|-------------|
| 00:05 AM | Activate Scheduled Freezes | SCHEDULED → ACTIVE when start date arrives |
| 00:10 AM | Auto-Unfreeze | ACTIVE → AUTO_COMPLETED when end date passes, extends membership |
| 00:15 AM | Expire Memberships | ACTIVE → EXPIRED when end date passes (not frozen ones) |

---

## Testing

### Run Freeze Test Suite
```bash
cd backend
node src/utils/testFreeze.js
```

This runs 9 automated tests in ~2 seconds (no waiting for actual days):

| # | Test | What it verifies |
|---|------|-----------------|
| 1 | Immediate freeze | Status changes to FROZEN |
| 2 | Manual unfreeze (early) | Only actual days count, not requested |
| 3 | Schedule future freeze | Status = SCHEDULED |
| 4 | Cancel scheduled freeze | Status = CANCELLED, no impact |
| 5 | Auto-unfreeze (cron) | Cron completes freeze, extends membership |
| 6 | Freeze count limit | Blocks when max count reached |
| 7 | Overlap detection | Blocks overlapping, allows boundary |
| 8 | Expired membership | Freeze blocked on expired plan |
| 9 | Expiry boundary (TC10) | End date extends past original expiry |

---

## Database Models

### Core Models
- **Admin** — email, password (admin dashboard access)
- **User** — name, email, phone, password (member accounts)
- **Gym** — name, slug, area, city, address, phone, hours, rating, amenities, seats
- **Plan** — name, category, durationDays, price, benefits, maxFreezeCount, maxFreezeDays
- **GymPlan** — many-to-many junction (gym ↔ plan)

### Membership Models
- **Membership** — userId, planId, gymId, startDate, endDate, originalEndDate, status, totalFreezeDaysUsed, totalFreezeCountUsed
- **MembershipFreeze** — membershipId, freezeStartDate, freezeEndDate, requestedDays, actualDays, reason, status

### Enums
- **MembershipStatus:** ACTIVE, FROZEN, EXPIRED, CANCELLED
- **FreezeStatus:** SCHEDULED, ACTIVE, COMPLETED, AUTO_COMPLETED, CANCELLED

---

## Pricing Structure (seeded data)

| Category | Starter | Plus | Ultra |
|----------|---------|------|-------|
| Monthly (30d) | ₹1,999 | ₹2,499 | ₹3,499 |
| Quarterly (90d) | ₹4,499 | ₹5,999 | ₹7,999 |
| Half-Yearly (180d) | ₹6,999 | ₹8,999 | ₹12,999 |
| Annual (365d) | ₹9,999 | ₹13,999 | ₹19,999 |

---

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:admin@localhost:5432/gym_platform"
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```
