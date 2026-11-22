# YourFiendJob-Website

# YourFiendJob - Role-Based MERN SaaS Platform 🌐💼

MERN Stack Role-Based SaaS প্ল্যাটফর্ম for YourFiendJob AI Job Hunting Agent.

---

## ১. দুইটি ভিন্ন ইউজার রোল (Two User Roles)

### ১. Candidate / User Dashboard (চাকরিপ্রার্থী ভিউ)
- **Attractive Job Cards**: প্রতিটি চাকরির জন্য প্রিমিয়াম SaaS জব কার্ড (কোম্পানি লোগো, টাইটেল, লোকেশন, বেতন, অভিজ্ঞতা, AI ম্যাচ স্কোর ও প্রায়োরিটি)।
- **AI Fit Breakdown**: OpenAI Agent-এর স্কোরিংয়ের সুনির্দিষ্ট কারণ ও সুপারিশ।
- **সার্চ ও মাল্টি-লেভেল ফিল্টারিং**: টাইটেল, কোম্পানি ও স্কিল দিয়ে সার্চ, ক্যাটাগরি পিলস, প্রায়োরিটি, মিনিমাম ম্যাচ স্কোর ও সর্টিং।
- **বুকমার্ক / সেভ ও অ্যাপ্লাই**: ১-ক্লিকে চাকরি সেভ করা এবং সরাসরি Bdjobs-এ আবেদন করা।
- **My Saved Jobs**: সংরক্ষিত চাকরির ডেডিকেটেড ট্যাব।

### ২. Super Admin Dashboard (অ্যাডমিন প্যানেল)
- **Analytics & Storage Metrics**: Total Jobs, New Today, High Priority, Saved Jobs, ৩-টায়ার স্টোরেজ হেলথ (MongoDB, JSON, Excel)।
- **Job Listings Management (CRUD)**:
  - View all jobs with full specifications.
  - **Edit Job**: যেকোনো চাকরির টাইটেল, বেতন, অভিজ্ঞতা, প্রায়োরিটি ও ডেসক্রিপশন পরিবর্তন (`PUT /api/jobs/:id`).
  - **Delete Job**: MongoDB এবং লোকাল ব্যাকআপ থেকে সরাসরি চাকরি ডিলিট করা (`DELETE /api/jobs/:id`).
  - **Status Changer**: New, Reviewed, Saved, Applied, Archived.
- **User Management**: MongoDB-তে সংরক্ষিত সকল ইউজার তালিকা, ১-ক্লিকে Role Toggle (User <-> Admin), এবং নতুন ইউজার তৈরি (`/api/users`).
- **AI Agent Monitoring**: অন-ডিমান্ড 'Run Agent Hunt' ট্রিগার, লাইভ টার্মিনাল লগস ও সার্চ হিস্ট্রি অডিট।
- **Platform Settings**: টার্গেট স্কিলস, ক্যাটাগরি, লোকেশন ও দৈনিক ইমেইল শিডিউল সরাসরি `config.yaml` এবং MongoDB-তে সংরক্ষণ।

---

## ২. লগইন ক্রেডেনশিয়াল (Default Access Accounts)

| অ্যাকাউন্ট টাইপ | ইমেইল / ইউজারনেম | পাসওয়ার্ড | রোল | পারমিশনস |
|---|---|---|---|---|
| **Super Admin** | `admin@yourfiendjob.com` (বা `admin`) | **`Admin@2026#Jobs`** | `admin` | Full CRUD, Agent Run, User Manage, Settings |
| **Candidate User** | `candidate@ufirst.com` (বা `candidate`) | **`User@2026#Jobs`** | `user` | Job Cards, Search, Filters, Bookmark, Apply |

*ওয়েবসাইটের উপরের Navbar-এ **"1-Click Role Switcher"** বোতাম রয়েছে, যা দিয়ে কোনো পাসওয়ার্ড টাইপ না করেই মুহূর্তের মধ্যে দুটি রোলের ড্যাশবোর্ড সুইচ করে পরীক্ষা করা যায়!*

---

## ৩. সিকিউর RBAC ও সুরক্ষিত এপিআই (Protected Endpoints)

- **JWT Authentication**: `jsonwebtoken` ও `bcryptjs` দিয়ে নিরাপদ পাসওয়ার্ড হ্যাশিং ও টোকেন ভ্যালিডেশন।
- **Role Guards**: `requireAdmin` মিডলওয়্যার দিয়ে অ্যাডমিন এপিআই সুরক্ষিত। সাধারণ ইউজার এক্সেস করতে গেলে **403 Forbidden** ফেরত দেয়।

| মেথড | এন্ডপয়েন্ট | পারমিশন | বিবরণ |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | ইউজার ও অ্যাডমিন লগইন |
| `POST` | `/api/auth/register` | Public | নতুন ক্যান্ডিডেট অ্যাকাউন্ট তৈরি |
| `GET` | `/api/jobs` | Public / User | চাকরির তালিকা ব্রাউজিং |
| `PATCH` | `/api/jobs/:id/status` | Public / User | স্ট্যাটাস ও বুকমার্ক আপডেট |
| `PUT` | `/api/jobs/:id` | **Admin Only** | চাকরির তথ্য এডিট করা |
| `DELETE` | `/api/jobs/:id` | **Admin Only** | চাকরি ডিলিট করা |
| `GET` | `/api/users` | **Admin Only** | সকল ইউজার তালিকা |
| `PATCH` | `/api/users/:id/role` | **Admin Only** | রোল পরিবর্তন (User <-> Admin) |
| `POST` | `/api/agent/run` | **Admin Only** | ব্রাউজার থেকে পাইথন এজেন্ট চালানো |
| `PUT` | `/api/settings` | **Admin Only** | `config.yaml` সেটিংস পরিবর্তন |

---

## ৪. চালানোর নির্দেশিকা (How to Run)

### ব্যাকএন্ড চালু করা (Express.js - Port 5000):
```powershell
cd backend
npm start
```

### ফ্রন্টএন্ড চালু করা (React.js + Vite - Port 3000):
```powershell
cd frontend
npm run dev
```

ব্রাউজারে খুলুন: **http://localhost:3000**
