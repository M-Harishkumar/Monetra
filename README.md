# NEXORA – Subscription & Revenue Intelligence Platform

> Enterprise-grade SaaS subscription management, automated calendar-aware recurring billing, 10-rule revenue leakage sentinel, predictive subscription health scoring, and payment reconciliation.

---

## 🌟 Executive Overview

**NEXORA** is a full-stack, enterprise-grade revenue operations platform designed to eliminate billing leakages, automate recurring subscription lifecycles, and provide explainable revenue intelligence. Built for high-velocity B2B SaaS and subscription businesses, NEXORA addresses the common failure points in billing infrastructure: missed renewal cycles, month-end date drifts, unallocated wire transfers, and unmonitored customer churn.

---

## 🚀 Key Modules & Capabilities

### 1. Calendar-Aware Recurring Billing Engine
- **Month-End & Leap Year Capping**: Intelligently handles cycle dates (e.g., contracts originating on January 31 correctly roll to February 28/29, then back to March 31 without drifting).
- **Daily Proration Math**: Exact financial calculations for mid-cycle plan upgrades, downgrades, and seat adjustments with credit note reconciliation.
- **Idempotent Billing Runs**: Database-level unique composite constraints `[subscriptionId, billingPeriod]` prevent duplicate charge execution.
- **Batch Processing**: Run scheduled or on-demand billing cycles with real-time audit logging and detailed invoice breakdown.

### 2. Revenue Guard – 10-Rule Leakage Sentinel
Automated 24/7 audit sentinel actively detecting 10 distinct cash leak vectors:
1. **Unbilled Active Subscriptions**: Contracts past their next billing date without an invoice generated.
2. **Missed Renewals**: Contracts expired without a renewal quote or extension.
3. **Duplicate Invoices**: Multiple invoices detected for the exact same billing cycle.
4. **Item Calculation Mismatch**: Line items plus taxes/discounts deviating from invoice total.
5. **Overdue Invoices**: Outstanding invoices exceeding grace periods without payment or dunning action.
6. **Unallocated Payments**: Cash received in bank ledger without invoice allocation.
7. **Expired Discounts**: Invoices continuing to receive promotional discounts past expiration dates.
8. **Failed Billing Runs**: Invoices stuck in failure state during automated cycle executions.
9. **Zero-Priced Active Subscriptions**: Active enterprise tiers with $0 billable amounts without recorded fee waivers.
10. **Ghost Subscriptions**: Subscriptions tied to archived or suspended customer accounts.

Each detection includes an **Investigation Drawer** allowing staff assignment, status updates (`new` → `investigating` → `resolved`), and resolution audit notes.

### 3. Subscription Health Scoring (0–100)
Rule-based, fully explainable health scoring system that evaluates customer risk across 4 weighted pillars:
- **Payment Regularity (35%)**: On-time payment history and outstanding overdue days.
- **Usage & Seat Velocity (25%)**: Seat allocation ratio and activity trends.
- **Contract Tenure (20%)**: Length of subscription relationship and renewal frequency.
- **Support & Sentiment (20%)**: Open escalation tickets and unresolved dunning notices.
- Categorizes accounts into **Healthy (80–100)**, **At Risk (50–79)**, and **Critical (0–49)** with actionable next steps.

### 4. Renewal Center & Dunning Workflow
- **Cadence Stages**: Automated lifecycle tracking from `Upcoming (T-30d)` → `Notice Sent (T-7d)` → `Due Today (T-0)` → `Grace Period (T+7d)` → `Suspension Warning (T+15d)`.
- **Automated Dispatch**: One-click reminder email dispatch with built-in deduplication guards.
- **Direct Renewal Execution**: Advance next cycle dates directly from the renewal dashboard.

### 5. Change Simulator & What-If Studio
- **Mid-Cycle Change Simulator**: Real-time preview of prorated credits, pro-rata charges, and net invoice adjustment before committing plan changes.
- **What-If Portfolio Modeler**: Sensitivity analysis for pricing hikes/cuts (+/-%), customer acquisition velocity, and churn reduction targets on MRR/ARR.

### 6. Payment Reconciliation Assistant
- **Bank Statement CSV Ingestion**: Import external bank statements (UTR, wire, IMPS, Stripe).
- **Auto-Matching Engine**: Automatic matching by transaction reference, customer name, and invoice amount.
- **Manual Invoice Allocation**: Interactive allocation workflow for partial payments and unmatched bank deposits.

### 7. Customer Self-Service Portal & Quotation Flow
- **Dedicated Client View**: Customers can review active subscriptions, download official PDF tax invoices, review quotes, and request plan upgrades.
- **Quotation Workflow**: Create quotes with custom line items, generate PDF proposals, and convert accepted quotes into live active subscriptions.
- **PDF Generation**: Client-side vector PDF invoice and quotation generator built with `jspdf`.

### 8. Portfolio Financial Intelligence & Audit Trail
- **Cash vs Invoiced Revenue**: Clear separation between Cash Collected, Invoiced Revenue, and Accounts Receivable (AR).
- **Cohort Retention**: Monthly cohort retention tables tracking retention percentages over 12 months.
- **Immutable Audit Trail**: Chronological logging of all financial actions, lifecycle changes, and user operations.

---

## 🛠️ Architecture & Tech Stack

```
nexora-platform/
├── server.ts                       # Full-stack entry point (Express + Vite middlewares on port 3000)
├── server/
│   ├── routes/api.ts               # Complete REST API (Auth, Subscriptions, Invoices, Reconciliation, etc.)
│   ├── db/database.ts              # Persistent ACID JSON relational engine with audit logging
│   ├── data/nexora_db.json         # Persistent database file storing all entities across restarts
│   └── prisma/schema.prisma        # Complete 38-table MySQL production schema with relations & indexes
├── src/
│   ├── components/                 # Reusable UI components (Sidebar, Header, Badge, StatCard, Modal, etc.)
│   ├── context/AuthContext.tsx     # Role-based state management (ADMIN, STAFF, CUSTOMER) with 1-click switch
│   ├── pages/                      # 15+ comprehensive page modules
│   ├── services/api.ts             # Typed REST client with error handling & currency formatting
│   ├── utils/
│   │   ├── billing-math.ts         # Pure billing cycle & proration math engine
│   │   ├── health-score.ts         # Rule-based health scoring engine
│   │   └── revenue-guard.ts        # 10-rule leakage detection sentinel
│   ├── App.tsx                     # React Router 7 setup
│   └── main.tsx                    # React client entry point
├── test/
│   ├── billing-math.test.ts        # Unit tests for billing math & leap year cycles
│   ├── health-score.test.ts        # Unit tests for 0-100 scoring algorithm
│   └── revenue-guard.test.ts       # Unit tests for 10 leakage detection checks
└── metadata.json                   # Applet configuration & metadata
```

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React icons, jsPDF.
- **Backend**: Express.js, TypeScript (`tsx`), CORS, bcryptjs, jsonwebtoken, Decimal.js.
- **Testing**: Built-in `node:test` runner executed with `npx --yes tsx --test`.
- **Database**:
  - **Runtime Engine**: File-backed relational ACID database in `server/data/nexora_db.json` ensuring full data persistence across container restarts without mock fallbacks.
  - **Production Schema**: Comprehensive 38-table MySQL schema in `server/prisma/schema.prisma` with foreign keys, indexes, and unique constraints.

---

## 🔑 Demo Access Accounts

The platform includes a **1-Click Quick Role Switcher** in the top navigation bar and login screen:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Platform Admin** | `admin@nexora.io` | `AdminPass123!` | Full unrestricted access to billing engine, financial ledgers, staff provisioning, settings |
| **Finance Staff** | `staff.sarah@nexora.io` | `StaffPass123!` | Invoices, payments, reconciliation, subscriptions, revenue guard investigation |
| **Customer / Client** | `customer@nexora.io` | `ClientPass123!` | Customer portal, active subscriptions, PDF invoice downloads, plan change requests |

---

## 💻 Local Installation & Setup

### Prerequisites
- Node.js 18+ or Node.js 20+
- npm 9+

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd nexora
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure the following variables are present:
```env
PORT=3000
JWT_SECRET="nexora-enterprise-jwt-super-secret-key-2026"
DATABASE_URL="mysql://nexora_user:nexora_password@localhost:3306/nexora_db"
```

### 3. Running the Test Suite
Run unit tests for pure financial logic and billing engines:
```bash
npm test
# Or directly:
npx --yes tsx --test test/*.test.ts
```

### 4. Running the Application
Start the full-stack server on port 3000:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Production MySQL Setup (Prisma)

To migrate the schema to a dedicated MySQL or Cloud SQL database:

1. Update `DATABASE_URL` in `.env` with your MySQL connection string:
   ```env
   DATABASE_URL="mysql://username:password@hostname:3306/nexora_db"
   ```
2. Run Prisma migration:
   ```bash
   npx prisma migrate dev --name init --schema=server/prisma/schema.prisma
   ```
3. Generate the Prisma Client:
   ```bash
   npx prisma generate --schema=server/prisma/schema.prisma
   ```

---

## 🛡️ License & Credits

Built for high-precision SaaS revenue management and financial governance. All rights reserved.
