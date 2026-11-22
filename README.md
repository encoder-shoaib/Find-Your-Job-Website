# FindYourJob - Role-Based MERN SaaS Platform 🌐💼

A modern, production-grade **Role-Based MERN Stack SaaS Platform** engineered for the **YourFindJob** autonomous AI job-hunting ecosystem.

---

## 📌 Features & Architecture Overview

The platform bridges real-time job aggregation, autonomous AI scoring, and multi-tier persistence with a sleek, responsive user experience designed for both job candidates and platform administrators.

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, and Framer Motion.
- **Backend**: Node.js & Express REST API with JWT security and role-based access control (RBAC).
- **Primary Database**: MongoDB (`yourfindjob_db`) with indexed queries and zero-fail offline fallback.
- **Live Deployment**: Hosted on Vercel Serverless Architecture with client-side anti-flicker protection.

---

## 👥 Two Dedicated User Roles

### 1. Candidate / Job Seeker View
- **Interactive Job Cards**: SaaS job cards displaying company avatar, job title, company name, location, posting date, salary, experience, category, and tech skills chips.
- **AI Fit Badging**: Prominent inline badges for **Match Score** (e.g. `9/10 Match`) and **Priority** (`High Priority` / `Medium Priority`).
- **Dynamic Search & Multi-Level Filtering**:
  - Live full-text search by title, company, or skills.
  - Interactive category filter pills (*Software Development, AI & Data, IT & Networking, etc.*).
  - Dropdown filters for priority, minimum match score, and sort order (*Highest Match, Latest Date, Job Title*).
- **Bookmarks & Direct Apply**: 1-click bookmarking to save jobs and direct external links to official Bdjobs application portals.
- **Saved Opportunities Tab**: Filter view strictly showing bookmarked jobs.

### 2. Super Admin Panel
- **Overview & Intelligence Analytics**: Real-time counter metrics for Total Jobs, New Today, High Priority, and Saved Jobs, along with 3-tier storage pipeline health indicators (MongoDB, JSON Backup, Excel Export).
- **Comprehensive Job Management (Full CRUD)**:
  - Tabular and card views of all discovered jobs.
  - **Edit Job**: Update title, salary, experience, priority, and description (`PUT /api/jobs/:id`).
  - **Delete Job**: Permanently remove jobs from MongoDB and local storage (`DELETE /api/jobs/:id`).
  - **Status Management**: Toggle between `New`, `Reviewed`, `Saved`, `Applied`, and `Archived`.
- **User Account Management**: View all registered accounts, create users, and perform 1-click role toggles (`User` $\leftrightarrow$ `Admin`) via `/api/users`.
- **Autonomous Agent Control**:
  - Unified action bar: **Limit selector** (3 to 50 jobs), **Dry Run checkbox**, **Run Agent Now**, and **Clear All Jobs** in a single non-wrapping row.
  - Live execution streaming terminal logs and recent crawl search history audit.
- **Platform Configuration**: Configure target tech keywords, job categories, experience thresholds, and daily schedule preferences synchronized with `config.yaml` and MongoDB.

---

## 🔑 Default Access Credentials

| Account Type | Email / Username | Password | Role | Permissions |
|---|---|---|---|---|
| **Super Admin** | `admin@yourfindjob.com` (or `admin`) | **`Admin@2026#Jobs`** | `admin` | Full CRUD, Agent Trigger, User Management, System Settings |
| **Candidate User** | `candidate@ufirst.com` (or `candidate`) | **`User@2026#Jobs`** | `user` | Job Exploration, Search, Filters, Bookmarks, Direct Apply |

> **💡 Quick Testing Tip:** The navigation bar features a **"1-Click Role Switcher"** button that lets you instantly toggle between Admin and Candidate views without having to re-authenticate manually.

---

## 🛡️ Secure RBAC & Protected API Endpoints

The backend is secured using standard JSON Web Token (JWT) authentication with bcrypt password hashing. Admin-only routes are protected by the `requireAdmin` middleware, which automatically rejects unauthorized requests with `403 Forbidden`.

| HTTP Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticates candidate or administrator credentials |
| `POST` | `/api/auth/register` | Public | Registers a new job seeker account |
| `GET` | `/api/auth/me` | Authenticated | Retrieves current session user details |
| `GET` | `/api/dashboard/stats` | Public / User | Returns platform summary metrics and category distributions |
| `GET` | `/api/jobs` | Public / User | Fetches paginated, filtered, and searched job listings |
| `PATCH`| `/api/jobs/:id/status`| Public / User | Updates bookmark state or application status |
| `PUT` | `/api/jobs/:id` | **Admin Only** | Modifies job details and requirements |
| `DELETE`| `/api/jobs/:id` | **Admin Only** | Deletes a job from MongoDB and fallback stores |
| `POST` | `/api/jobs/clear-all` | **Admin Only** | Wipes all jobs across storage tiers for clean testing |
| `GET` | `/api/users` | **Admin Only** | Lists all registered platform users |
| `PATCH`| `/api/users/:id/role` | **Admin Only** | Toggles user roles (`user` $\leftrightarrow$ `admin`) |
| `GET` | `/api/agent/status` | Authenticated | Checks agent runtime status and 3-tier storage health |
| `GET` | `/api/agent/logs` | Authenticated | Retrieves real-time execution stream logs |
| `POST` | `/api/agent/run` | **Admin Only** | Dispatches the autonomous crawler agent |
| `GET` | `/api/search/history` | Authenticated | Retrieves historical crawler search logs |
| `GET` | `/api/settings` | **Admin Only** | Reads settings from `config.yaml` and MongoDB |
| `PUT` | `/api/settings` | **Admin Only** | Updates skills, keywords, and email preferences |

---

## 🚀 Local Development & Execution

### Prerequisites
- Node.js 18.x or later
- npm or yarn
- MongoDB (optional, local or cloud instance on port 27017)

### 1. Start the Backend API Server (Port 5000)
```bash
cd backend
npm install
npm start
```
*The server will start on `http://localhost:5000` with active zero-fail storage fallback.*

### 2. Start the Frontend Development Client (Port 3000)
```bash
cd frontend
npm install
npm run dev
```
*Open your browser and navigate to `http://localhost:3000`.*

### 3. Production Build
```bash
# Build the React frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm start
```

---

## 🌐 Live Production Deployments

- **Live Frontend (Vercel)**: [https://frontend-eight-omega-44.vercel.app](https://frontend-eight-omega-44.vercel.app)
- **Live Backend API (Vercel)**: [https://backend-beta-six-21.vercel.app](https://backend-beta-six-21.vercel.app)
- **Health Check Endpoint**: [https://backend-beta-six-21.vercel.app/api/health](https://backend-beta-six-21.vercel.app/api/health)
