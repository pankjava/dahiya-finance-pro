# Dahiya Finance Pro

Full-stack online finance management software with a modern, responsive dashboard system

## How to run

1. **Install dependencies** (first time only)
   ```bash
   cd "D Drive/Dahiya Finance"
   npm install
   ```

2. **Create `.env.local`** in the project folder with:
   ```
   MONGODB_URI=your-mongodb-atlas-uri-with-dahiya-finance-database
   JWT_SECRET=any-long-random-string
   ```

3. **Start the app**
   ```bash
   npm run dev
   ```

4. **Open in browser:** [http://localhost:3000](http://localhost:3000)  
   - Click **Register** → create admin (name, email, password)  
   - Then **Sign in** and use the dashboard.

---

## Features

- **Client Management** – Add clients with name, address, mobile, alternate mobile, and optional Google Map link (paste link from Maps—no API key needed). Client list with search, total loans, contact info, and location link.
- **Loan Management** – Four loan types: Daily, Meter, Weekly, Monthly. Auto-generated payment schedules with due dates.
- **Payment Scheduling** – Status colors: Paid (green), Upcoming (gray), Missed (red).
- **Payment Tracking** – Record payments with amount, date/time, method (Cash / UPI). For UPI: bank account, transaction time, reference note.
- **Bank Accounts** – Add bank name, UPI ID, optional QR code URL; link payments to accounts.
- **Dashboard** – Total received, pending, late payments, today’s collection, filter by date, charts by loan type and payment mode.
- **Reports** – Daily / Weekly / Monthly collection, loan type-wise, payment mode (Cash vs UPI), bank-wise UPI. Export CSV.
- **Calculator** – Loan calculator: amount, duration, interest rate, loan type → daily/weekly/monthly payment, total interest, total payable.
- **Auth** – Admin login and registration.
- **Dark mode** – Toggle in dashboard.
- **Mobile responsive** – Sidebar collapses to menu on small screens.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Recharts, Lucide icons
- **Backend:** Next.js API routes
- **Database:** MongoDB with Mongoose
- **Auth:** JWT in HTTP-only cookie

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables**

   Copy `.env.local.example` to `.env.local` and set:

   - `MONGODB_URI` – MongoDB connection string (e.g. `mongodb://localhost:27017/dahiya-finance`)
   - `JWT_SECRET` – Secret for signing JWTs (use a long random string in production)
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` – Optional; not needed for Add Client. You can paste a Google Maps link in the “Google Map link” field when adding a client.

3. **Run MongoDB** (required for registration and login)

   - **Option A – Local:** Install [MongoDB Community](https://www.mongodb.com/docs/manual/installation/) and start it (e.g. `brew services start mongodb-community` on macOS, or run `mongod`).
   - **Option B – Cloud:** Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), get the connection string, and set it as `MONGODB_URI` in `.env.local` (replace `<password>` with your DB user password).

   If MongoDB is not running or `MONGODB_URI` is wrong, registration will fail with a connection error.

4. **Start the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Register an admin account from the Register page, then sign in.

## Loan Calculation Rules (example)

- **Loan:** ₹20,000, 2 months (60 days), 10% per month  
- **Daily:** Fixed daily amount (principal + interest), e.g. ₹400/day for 60 days.  
- **Meter:** Daily interest only (e.g. ₹67/day); full principal at end (₹20,000).  
- **Weekly:** Weekly installment (e.g. ₹3,000/week).  
- **Monthly:** Monthly installment (e.g. ₹12,000/month).

## Project structure

- `src/app/` – Next.js App Router pages and API routes
- `src/components/` – Reusable UI (layout, theme toggle, map picker)
- `src/lib/` – DB connection, auth, loan calculations, utils
- `src/models/` – Mongoose models (User, Client, Loan, PaymentSchedule, Payment, BankAccount)
- `src/middleware.ts` – Auth redirect (login/dashboard)

## Optional: Notifications

For due-payment reminders, you can add a cron job or background task that queries `PaymentSchedule` for `status: 'upcoming'` and `dueDate` within the next 1–2 days and sends email/push or in-app alerts. The data model and APIs already support this.
