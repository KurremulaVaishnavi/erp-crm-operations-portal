# Production-Ready Mini ERP + CRM Operations Portal

A complete, full-featured operations portal designed for wholesale and distribution companies. This software integrates Customer Relationship Management (CRM) pipelines, Product Catalogs, Stock Movements Ledger Audits, and Sales Challan generation workflows into a single system.

---

## Technical Architecture

- **Backend**: Node.js, TypeScript, Express, Prisma ORM, PostgreSQL, Zod request verification, JWT Authentication, and Role-Based Access Control (RBAC).
- **Frontend**: React (Vite template), TypeScript, React Router, Tailwind CSS, Axios, and React Hook Form.

---

## Directory Structure

```text
erp-crm/
├── backend/
│   ├── src/
│   │   ├── controllers/    # API Request Handlers
│   │   ├── routes/         # Express endpoint definitions
│   │   ├── middleware/     # Auth checks, validate schema, error logger
│   │   ├── prisma/         # Prisma DB client setup
│   │   ├── validations/    # Zod payload schemas
│   │   └── app.ts          # Server entry wrapper
│   ├── prisma/
│   │   └── schema.prisma   # DB schemas & constraints
│   ├── package.json
│   └── .env                # Environmental configurations
├── frontend/
│   ├── src/
│   │   ├── components/     # Toast, status flags
│   │   ├── context/        # Auth status wrappers
│   │   ├── layouts/        # Responsive header / side navigation
│   │   ├── pages/          # Login, Dashboard, CRM lists, Spares, Challan
│   │   ├── services/       # Axios client setup
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── App.tsx         # Route router
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
└── README.md
```

---

## Local Development Setup

### 1. Database Setup
The application uses SQLite as its default database engine for simple local setup. 
The database connection string in `/backend/.env` is configured as:
```env
DATABASE_URL="file:./dev.db"
```

### 2. Backend Installation & Run
Navigate to the backend directory and install all required modules:
```bash
cd backend
npm install
```

Generate the Prisma client code and push the database schema:
```bash
npx prisma generate
npx prisma db push
```
*(Optionally, run `npx ts-node src/utils/seed.ts` to force-reset and seed data).*

Start the TypeScript development server (will run on Port 5000):
```bash
npm run dev
```

### 3. Frontend Installation & Run
Navigate to the frontend directory and install dependencies:
```bash
cd ../frontend
npm install
```

Start the Vite dev server (will run on Port 3000 and proxy `/api/*` requests to port 5000):
```bash
npm run dev
```

---

## User Credentials for Testing

The following credentials are automatically generated via the database seeding script:

| Role | Username (Email) | Password | Access Level / Dashboard Views |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@erpcrm.com` | `admin123` | Full Dashboard & Permissions |
| **Sales** | `sales@erpcrm.com` | `sales123` | CRM + Sales Challans Dashboard |
| **Warehouse** | `warehouse@erpcrm.com` | `warehouse123` | Products Inventory + Stock Movements Dashboard |
| **Accounts** | `accounts@erpcrm.com` | `accounts123` | General Invoicing + Stock Overview Dashboard |

---

## Core Features & Business Logic

1. **Role-Based Access (RBAC)**:
   - **Admin**: Full access across all portal directories.
   - **Sales**: Access to CRM Customer catalog + Create/Draft Sales Challans.
   - **Warehouse**: Access to Products Inventory catalog + Stock Movements ledger adjustments.
   - **Accounts**: View-only access to customer listings, products, and sales challans.

2. **Inventory Stock Deductions**:
   - Creating a Challan assigns it a **DRAFT** state.
   - Changing the state of a Challan to **CONFIRMED** triggers an atomic transaction block that decrements the product's `currentStock` level.
   - If stock is insufficient, the transaction fails and returns a 400 error.
