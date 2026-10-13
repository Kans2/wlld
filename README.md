# 🎭 Meme'd — Campaign Payout Tracker

> A production-grade **creator marketplace & campaign payout tracker** where brands run viral campaigns with milestone-based payout ladders, and creators earn incrementally as views grow, protected by atomic budget caps and anomaly detection.

🚀 **Live App:** [https://wlld-4ffde7cgm-kannan-s-projects.vercel.app/](https://wlld-fnutebfxv-kannan-s-projects.vercel.app/)

[![Live App](https://img.shields.io/badge/Live%20App-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://wlld-fnutebfxv-kannan-s-projects.vercel.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-43853D?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Optional%20Cache-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Jest Tests](https://img.shields.io/badge/Jest%20Tests-30%20Passed-brightgreen?style=flat-square&logo=jest&logoColor=white)](https://jestjs.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 📖 Table of Contents
1. [Overview & Core Value](#-overview--core-value)
2. [Key Features](#-key-features)
3. [Architecture & Payout Logic](#-architecture--payout-logic)
4. [Concurrency & Budget Safety](#-concurrency--budget-safety)
5. [Bonus Features](#-bonus-features)
6. [Tech Stack](#-tech-stack)
7. [Repository Structure](#-repository-structure)
8. [Getting Started Locally](#-getting-started-locally)
9. [Running Tests](#-running-tests)
10. [API Reference](#-api-reference)
11. [Assumptions & Design Decisions](#-assumptions--design-decisions)
12. [Docker Deployment](#-docker-deployment)
13. [Scaling to 10K+ Creators](#-scaling-to-10k-creators)

---

## 🎯 Overview & Core Value

**Meme'd** connects brands running meme marketing and short-form video campaigns (Instagram Reels & YouTube Shorts) with creators. Instead of fixed upfront retainers, payouts are performance-driven and milestone-based.

### The Problem
- **Brands** risk overspending when campaigns go viral without strict budget caps or when concurrent view updates race against the database.
- **Creators** need transparent tracking of milestones crossed and incremental earnings without clawbacks.
- **Fraud/Bots** can artificially inflate view counts rapidly to drain campaign budgets.

### The Solution
- **Dynamic Milestone Ladder**: Brands set multiple tiers (e.g., 5K views → ₹250, 10K views → ₹600, 50K views → ₹3,500).
- **Highest Milestone Payout**: Payout is determined by the highest milestone crossed (not a cumulative sum). Creators earn the incremental delta as their posts reach higher tiers.
- **Strict Atomic Budget Cap**: Total payouts will **never exceed** the brand's total budget. Once depleted, the campaign automatically completes.
- **Real-Time Simulation Suite**: Both Brand and Creator dashboards feature an interactive live view simulator to test view updates, milestone triggers, and budget exhaustion in real-time.

---

## ✨ Key Features

### For Brands
- **Brand Dashboard**: Instant bird's-eye metrics: Total Campaigns, Active Campaigns, Budget Allocated, Budget Spent, Remaining Budget.
- **Campaign Creator**: Intuitive form to launch campaigns for Instagram or YouTube with custom or preset milestone ladders (Standard vs Viral).
- **Campaign Deep Dive**: Visual `BudgetBar` tracking spent vs remaining funds, milestone ladder breakdown, and submission list with creator details.
- **Live Simulator**: Directly test view increases (+5K, +25K, +100K, or custom) to verify payout calculations and budget cap enforcement.

### For Creators
- **Creator Dashboard**: Live summary of total earnings (₹), submitted posts, and active campaign participation.
- **Campaign Discovery**: Browse live campaigns with instant search and platform filtering (Instagram / YouTube).
- **Post Submission**: Join campaigns by submitting post URLs (enforces one submission per creator per campaign).
- **Earnings Tracker**: Transparent view of current views, milestone reached, next milestone goal, and payouts credited.

---

## 💰 Architecture & Payout Logic

```
   ┌───────────────────────┐
   │ View Count Update     │
   └───────────┬───────────┘
               │
               ▼
   ┌────────────────────────────────────────────────────────┐
   │ Calculate Highest Crossed Milestone Index (Tiers 0..N) │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ newPayout = milestone[highestIndex].payout              │
   │ delta     = max(0, newPayout - submission.totalPaid)   │
   └───────────────────────────┬────────────────────────────┘
                               │
                delta == 0 ?   ├─────────► No Payout (Same milestone)
                               │
                               ▼ (delta > 0)
   ┌────────────────────────────────────────────────────────┐
   │ remainingBudget = totalBudget - budgetSpent            │
   │ actualPayout    = min(delta, max(0, remainingBudget))  │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ ATOMIC MongoDB Update with Guard Condition             │
   │ budgetSpent + actualPayout <= totalBudget              │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ Update Submission (totalPaid += actualPayout)          │
   │ If budget fully spent -> Mark Campaign "completed"     │
   └────────────────────────────────────────────────────────┘
```

### Edge Cases Handled
1. **Multiple Milestones in One Update**: If a post jumps from 1,000 views to 60,000 views in a single update, it pays the highest crossed tier payout (incremental delta), not individual milestone sums.
2. **Budget Depletion Mid-Payout**: If a creator is owed ₹1,500 but the campaign only has ₹800 remaining, they receive ₹800 (partial payout), and the campaign is marked `completed`.
3. **No Double Payout**: Subsequent view updates that remain within the same milestone produce `delta = 0`.
4. **No Clawbacks**: In the rare case of view drops, `delta` is clamped to 0 (`Math.max(0, ...)`), preserving creator earnings.

---

## 🛡️ Concurrency & Budget Safety

To ensure that simultaneous view updates from multiple creators cannot cause budget overspend (race condition), the backend uses **atomic MongoDB conditional expressions**:

```typescript
const updatedCampaign = await Campaign.findOneAndUpdate(
  {
    _id: campaign._id,
    $expr: {
      $lte: [{ $add: ['$budgetSpent', actualPayout] }, '$totalBudget']
    }
  },
  { $inc: { budgetSpent: actualPayout } },
  { new: true }
);
```

If another request exhausted the budget moments before, `updatedCampaign` returns `null` and the payout is aborted safely without overdrawing the budget pool.

---

## 🚀 Bonus Features

### 1. ⚠️ View Spike Detection (Fraud / Bot Defense)
Tracks the velocity of views between updates:
$$\text{velocity} = \frac{\Delta\text{views}}{\Delta\text{seconds}}$$
If the velocity exceeds **100 views/second**, the submission is automatically flagged (`flagged: true`) with a visual warning badge on the dashboard.

### 2. ⚡ Multi-Tier Redis Caching
- Caches campaign discovery lists with automatic TTL and resilient fallback to MongoDB when Redis is unavailable.
- Cache invalidation triggers automatically whenever a new campaign is created or when a campaign budget is exhausted.

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Vanilla CSS Modules |
| **Backend** | Node.js, Express 5, TypeScript, Mongoose 9, Zod validation |
| **Database** | MongoDB Atlas / Local MongoDB (Mongoose schemas with indexes) |
| **Caching** | Redis (ioredis) with automatic offline fallback |
| **Authentication** | Stateless JWT (jsonwebtoken + bcryptjs) |
| **Testing** | Jest 30, SWC, ts-jest, Supertest |
| **Containerization** | Docker, Docker Compose |

---

## 📁 Repository Structure

```
wlld/
├── backend/
│   ├── src/
│   │   ├── config/             # DB, Redis, and environment configs
│   │   ├── middleware/         # Auth JWT, role guards, error handler, Zod validator
│   │   ├── models/             # User, Campaign, Submission (Mongoose)
│   │   ├── routes/             # Auth, Campaign, Submission routes
│   │   ├── services/           # Payout calculation, budget enforcement, auth, campaign
│   │   ├── utils/              # Custom ApiError class
│   │   ├── app.ts              # Express application setup
│   │   └── server.ts           # Server bootstrap
│   ├── tests/
│   │   ├── payout.test.ts      # 16 unit tests for payout calculations & edge cases
│   │   └── budget.test.ts      # 14 unit tests for budget capping & concurrent safety
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── brand/          # Brand dashboard, campaign creator, campaign detail
│   │   │   ├── creator/        # Creator dashboard, campaign browse, submission & simulator
│   │   │   ├── login/          # Auth login page
│   │   │   ├── signup/         # Auth signup page with role selector
│   │   │   ├── layout.tsx      # Root layout
│   │   │   └── page.tsx        # Role-based landing redirect
│   │   ├── components/         # Navbar, BudgetBar, MilestoneForm, EarningsCard, SubmissionList
│   │   ├── context/            # AuthContext (React Context API)
│   │   ├── lib/                # API client with token management
│   │   └── types/              # Shared TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml          # One-command full-stack container orchestration
├── SCALING_NOTES.md            # In-depth architectural guide for 10K+ creators
└── README.md
```

---

## 🛠️ Getting Started Locally

### Prerequisites
- Node.js 18+ & npm
- A running MongoDB instance (or free MongoDB Atlas connection string)
- (Optional) Redis server for caching

### 1. Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT_SECRET

# Run in development mode
npm run dev
# Backend starts on http://localhost:5000
```

### 2. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Run in development mode
npm run dev
# Frontend starts on http://localhost:3000
```

---

## 🧪 Running Tests

The test suite covers all payout algorithms, boundary conditions, edge cases, and budget cap constraints:

```bash
cd backend
npm test
```

### Test Coverage Highlights
- ✅ Highest milestone crossed detection
- ✅ Out-of-bounds view counts & empty milestone handling
- ✅ Jumping multiple milestones in a single update
- ✅ Zero delta on repeated view updates (no double-pay)
- ✅ Non-negative delta enforcement (no clawbacks)
- ✅ Capping payouts when remaining budget is less than delta
- ✅ Zero payout when campaign budget is 100% exhausted
- ✅ Spike velocity detection for anti-fraud
- **30 / 30 Tests Passing**

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Register user (`name`, `email`, `password`, `role: 'brand' \| 'creator'`) |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT |
| `GET` | `/api/auth/me` | User | Get current profile |

### Campaigns
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/campaigns` | Brand | Create campaign with budget & milestone ladder |
| `GET` | `/api/campaigns` | Public | List live campaigns (Redis cached) |
| `GET` | `/api/campaigns/my` | Brand | List brand's own campaigns |
| `GET` | `/api/campaigns/:id` | Public | Retrieve campaign details & remaining budget |

### Submissions
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/submissions` | Creator | Submit post link to a campaign |
| `GET` | `/api/submissions/my` | Creator | Get creator's submissions & total earnings |
| `GET` | `/api/submissions/campaign/:id` | Brand | Get all submissions for a campaign |
| `PATCH` | `/api/submissions/:id/views` | Public/Sim | Update view count, recalculate payout & check budget |

---

## ⚖️ Assumptions & Design Decisions

1. **Highest Milestone Rule**: Payout is based on the single highest milestone achieved, not the sum of all previous milestones crossed.
2. **Incremental Delta**: When crossing from Milestone 1 (₹250) to Milestone 2 (₹600), the creator is paid the difference of ₹350.
3. **Partial Payout on Budget Depletion**: If remaining budget < milestone delta, the creator receives whatever remains in the budget pool.
4. **No Clawbacks**: If a view count decreases or fluctuates, previously awarded payouts are retained by the creator.
5. **One Submission Per Campaign**: Each creator can submit only one post URL per campaign.
6. **Currency Standard**: All monetary values are represented in Indian Rupees (₹).

---

## 🐳 Docker Deployment

To launch the complete production stack (Frontend + Backend + MongoDB + Redis) in isolated containers:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`

---

## 📈 Scaling to 10K+ Creators

For an in-depth architectural breakdown on scaling to **10,000+ creators**, queue-based asynchronous ingestion, Redis Lua budget reservation, database sharding, and anti-fraud pipelines, see [SCALING_NOTES.md](./SCALING_NOTES.md).