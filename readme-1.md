# 🚀 YourFindJob: Professional Production Hosting & 24/7 Cloud Architecture Guide

> **Live URLs (লাইভ লিংকসমূহ):**
> - 🌐 **Production Frontend (Website):** [https://frontend-eight-omega-44.vercel.app](https://frontend-eight-omega-44.vercel.app)
> - ⚙️ **Production Backend API:** [https://backend-beta-six-21.vercel.app](https://backend-beta-six-21.vercel.app)
> - 🏥 **API Health Check Status:** [https://backend-beta-six-21.vercel.app/api/health](https://backend-beta-six-21.vercel.app/api/health)
> - 📦 **Website GitHub Repository:** [https://github.com/encoder-shoaib/YourFindJob-Website](https://github.com/encoder-shoaib/YourFindJob-Website)
> - 🤖 **AI Agent GitHub Repository:** [https://github.com/encoder-shoaib/YourFindJob-AI-agent](https://github.com/encoder-shoaib/YourFindJob-AI-agent)

---

## ১. কিভাবে সম্পূর্ণ প্রজেক্টটি ২৪/৭ পিসি বন্ধ থাকলেও চলবে (Cloud Architecture)

প্রজেক্টটিকে পেশাদারভাবে ক্লাউডে বিভক্ত করে হোস্ট করা হয়েছে যাতে আপনার পার্সোনাল কম্পিউটার সম্পূর্ণ বন্ধ থাকলেও ওয়েবসাইট ও ব্যাকএন্ড সবসময় সচল থাকে এবং AI এজেন্ট প্রতিদিন নির্দিষ্ট সময়ে স্বয়ংক্রিয়ভাবে ক্লাউডে রান হয়:

```
┌────────────────────────────────────────────────────────┐
│               🌐 Vercel Edge Global CDN                │
│  Frontend: https://frontend-eight-omega-44.vercel.app │
└──────────────────────────┬─────────────────────────────┘
                           │ (HTTPS REST API Requests)
┌──────────────────────────▼─────────────────────────────┐
│             ⚙️ Vercel Serverless Backend API           │
│   Backend: https://backend-beta-six-21.vercel.app      │
└──────────────────────────┬─────────────────────────────┘
                           │ (Central Cloud Database)
┌──────────────────────────▼─────────────────────────────┐
│           🍃 MongoDB Atlas (Cloud Database - Free)      │
│            cluster0.mongodb.net/yourfindjob_db        │
└──────────────────────────▲─────────────────────────────┘
                           │ (Crawls & Saves Jobs Daily)
┌──────────────────────────┴─────────────────────────────┐
│     🤖 GitHub Actions Cloud Runner (Ubuntu VM)         │
│     Daily Cron Hunt: Runs every morning @ 08:00 AM BST │
└────────────────────────────────────────────────────────┘
```

---

## ২. আমি কিভাবে সম্পূর্ণ প্রজেক্ট হোস্ট করেছি (Detailed Step-by-Step)

### ধাপ ১: ফ্রন্টএন্ড ক্লাউড হোস্টিং (Vercel)
1. ফ্রন্টএন্ড কোডে `import.meta.env.VITE_API_URL` কনফিগারেশন যোগ করা হয়েছে, যাতে লোকাল ও প্রোডাকশন এপিআই স্বাধীনভাবে কাজ করতে পারে।
2. `YourFindJob-Website/frontend/.env.production` ফাইলে প্রোডাকশন ব্যাকএন্ড এপিআই লিংক যুক্ত করা হয়েছে:
   ```env
   VITE_API_URL=https://backend-beta-six-21.vercel.app/api
   ```
3. Vite দিয়ে প্রোডাকশন বিল্ড অপ্টিমাইজেশন সম্পন্ন করা হয়েছে (`npm run build`).
4. Vercel সিএলআই-এর মাধ্যমে ডিপ্লয় করা হয়েছে:
   ```bash
   cd YourFindJob-Website/frontend
   vercel deploy --prod --yes
   ```
   **ফলাফল:** লাইভ ফ্রন্টএন্ড প্রস্তুত: `https://frontend-eight-omega-44.vercel.app`

---

### ধাপ ২: ব্যাকএন্ড সার্ভারলেস ক্লাউড হোস্টিং (Vercel Serverless)
1. `backend/server.js` ফাইলটিকে সার্ভারলেস ও ডেডিকেটেড উভয় মোডে রান করার উপযোগী করা হয়েছে (`module.exports = app` এক্সপোর্ট ও অটো-রিকানেক্ট মিডলওয়্যার যুক্ত করা হয়েছে)।
2. `backend/vercel.json` তৈরি করে রাউটিং কনফিগারেশন সম্পন্ন করা হয়েছে:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```
3. Vercel সিএলআই দিয়ে ব্যাকএন্ড ডিপ্লয় করা হয়েছে:
   ```bash
   cd YourFindJob-Website/backend
   vercel deploy --yes
   ```
   **ফলাফল:** লাইভ ব্যাকএন্ড প্রস্তুত: `https://backend-beta-six-21.vercel.app`

---

### ধাপ ৩: ক্লাউড ডাটাবেস সেটআপ (MongoDB Atlas - 100% Free)
পিসি বন্ধ থাকলে লোকাল `localhost:27017` ডাটাবেস বন্ধ থাকে। তাই ক্লাউডে ডেটা রাখার জন্য:
1. **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)** এ গিয়ে একটি ফ্রি M0 ক্লাস্টার তৈরি করুন।
2. **Network Access** ট্যাবে গিয়ে `0.0.0.0/0` (Allow Access from Anywhere) অনুমোদন করুন।
3. **Database Access** এ একটি ডাটাবেস ইউজার ও পাসওয়ার্ড তৈরি করুন।
4. **Connect** বোতামে ক্লিক করে কানেকশন স্ট্রিং সংগ্রহ করুন:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/yourfindjob_db?retryWrites=true&w=majority
   ```
5. **Vercel ড্যাশবোর্ডে যুক্ত করার নিয়ম:**
   - [Vercel Dashboard](https://vercel.com/dashboard) এ যান -> `backend` প্রজেক্টে ক্লিক করুন।
   - **Settings** -> **Environment Variables** এ গিয়ে `MONGODB_URI` এর ভ্যালু হিসেবে আপনার Atlas কানেকশন স্ট্রিং যোগ করে সেভ দিন।

---

### ধাপ ৪: স্বয়ংক্রিয় ক্লাউড AI এজেন্ট রানার (GitHub Actions)
আপনার পিসি সম্পূর্ণ বন্ধ থাকলেও যেন প্রতিদিন সকালে AI এজেন্ট নতুন চাকরি খুঁজে এনে ডাটাবেসে সেভ করে এবং আপনাকে ইমেইল পাঠায়:
1. `YourFindJob-AI-agent/.github/workflows/daily_agent_hunt.yml` তৈরি করে গিটহাবে পুশ করা হয়েছে।
2. এটি প্রতিদিন বাংলাদেশ সময় সকাল ৮:০০ টায় (`cron: '0 2 * * *'`) স্বয়ংক্রিয়ভাবে ক্লাউডে রান হয়।
3. **গিটহাবে সিক্রেটস সেট করার নিয়ম:**
   - GitHub-এ [YourFindJob-AI-agent](https://github.com/encoder-shoaib/YourFindJob-AI-agent) রিপোজিটরিতে যান।
   - **Settings** -> **Secrets and variables** -> **Actions** এ যান।
   - **New repository secret** এ ক্লিক করে নিচের কী-গুলো যুক্ত করুন:
     - `MONGODB_URI`: (আপনার MongoDB Atlas ক্লাউড ইউআরএল)
     - `OPENAI_API_KEY`: (আপনার OpenAI এপিআই কি)
     - `GMAIL_SENDER_EMAIL`: (আপনার জিমেইল এড্রেস)
     - `GMAIL_APP_PASSWORD`: (গুগল একাউন্টের 16-সংখ্যার App Password)
     - `GMAIL_RECIPIENT_EMAIL`: (যে ইমেইলে নোটিফিকেশন পেতে চান)
4. আপনি চাইলে যেকোনো সময় GitHub Actions ট্যাবে গিয়ে **"Run workflow"** বোতামে ক্লিক করে সাথে সাথে ক্লাউডে এজেন্ট রান করাতে পারবেন!

---

## ৩. সেলফ-টেস্টিং ও ভ্যালিডেশন রিপোর্ট (Self-Test Verification)

আমি ক্লাউড ডিপ্লয়মেন্টটি সরাসরি পরীক্ষা করেছি:

| কম্পোনেন্ট | টেস্ট কমান্ড / এন্ডপয়েন্ট | টেস্ট ফলাফল | স্ট্যাটাস |
|---|---|---|---|
| **Frontend CDN** | `GET https://frontend-eight-omega-44.vercel.app` | `HTTP/1.1 200 OK` (Vite SPA Load) | ✅ PASSED |
| **Backend Root** | `GET https://backend-beta-six-21.vercel.app/` | `{"success":true,"status":"running","service":"YourFindJob Backend API"}` | ✅ PASSED |
| **Backend Health** | `GET https://backend-beta-six-21.vercel.app/api/health` | `{"status":"healthy","service":"YourFindJob API Server"}` | ✅ PASSED |
| **Auth Credentials** | `GET https://backend-beta-six-21.vercel.app/api/auth/demo-credentials` | `{"success":true, accounts: {...}}` | ✅ PASSED |
| **CORS Policy** | Cross-Origin Header verification | `Access-Control-Allow-Origin: *` | ✅ PASSED |
| **Automation** | GitHub Actions Workflow syntax & push | `.github/workflows/daily_agent_hunt.yml` | ✅ PASSED |

---

## ৪. লাইভ ড্যাশবোর্ড ব্যবহারের ক্রেডেনশিয়াল

- **Super Admin Panel:**
  - ইউজারনেম / ইমেইল: `admin@yourfindjob.com` বা `admin`
  - পাসওয়ার্ড: `Admin@2026#Jobs`
- **Candidate User Panel:**
  - ইউজারনেম / ইমেইল: `candidate@ufirst.com` বা `candidate`
  - পাসওয়ার্ড: `User@2026#Jobs`
- *ওয়েবসাইটে ১-ক্লিকে রোল সুইচার বোতাম দিয়েও মুহূর্তে অ্যাডমিন ও ক্যান্ডিডেট ভিউ সুইচ করা যায়।*
