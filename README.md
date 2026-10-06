# 🎓 EduCanvas — GenAI Curriculum Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://saianish14.github.io/Educanvas/)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSaiAnish14%2FEducanvas)

> 🌐 **Live URL for Resume & Portfolio:**  
> **[https://saianish14.github.io/Educanvas/](https://saianish14.github.io/Educanvas/)**

EduCanvas is a premium, AI-powered curriculum design and student access portal. It enables faculty members to generate complete, semester-wise, and college-scoped curricula in seconds using advanced Groq LLaMA models, export them instantly to PDF, and track student enrollments. Students can browse and enroll in curricula specific to their institution, track progress, and download study guides.

Built with **React (Vite)**, **Tailwind CSS**, **Node.js/Express**, **Firebase Authentication**, **Cloud Firestore**, and the **Groq API**.

---

## 🎨 Newly Redesigned UI/UX Features

We have recently refreshed the entire authentication and landing portal with modern web design aesthetics:
- **Unified Split-Screen Landing**: The Cover Page (`/`) embeds a stunning dark blue-to-purple gradient hero on the left with cyan/purple radial ambient glow rings, and a clean, interactive 3-step registration wizard on the right.
- **Unified Brand Identity**: A new network-nodes logo mark and split typography styling (`EduCanvas`) are featured consistently across all landing, login, and dashboard navigation headers.
- **Wizard Stepper Animation**: A modern step indicator utilizing custom borders, fills, and transition effects to guide users through selecting an account type (Faculty vs. Student), entering personal details, and specifying their academic institution.
- **Polished Login Screen**: The sign-in page (`/login`) mirrors the cover page gradient, card layout, and button shadow states for a seamless visual flow.

---

## 🛠️ Tech Stack

- **Frontend:** React 18 (Vite), Tailwind CSS, Lucide React (Icons), Recharts (Analytics Charts)
- **Backend:** Node.js + Express (Groq API securely proxied with CORS and auth middleware)
- **Database & Security:** Firebase Firestore (Structured collections + custom security rules)
- **Authentication:** Firebase Authentication (Email & password provider)
- **AI Engine:** Groq API (`llama3-70b-8192` model)
- **Document Export:** jsPDF & jsPDF-AutoTable for professional layout exports

---

## ⚙️ Quick Start & Setup

### 1. Firebase Configuration

1. Create a new project in the [Firebase Console](https://console.firebase.google.com).
2. Register a web application and copy the configuration details.
3. Enable **Email/Password** authentication in the Firebase Authentication settings.
4. Create a Firestore database in production mode.
5. Copy the security rules from `firestore.rules` in this project, paste them into the Firestore Rules tab, and click **Publish**.

### 2. Groq API Setup

1. Obtain a free API key from the [Groq Console](https://console.groq.com).
2. Set it up in your backend environment configuration (see below).

### 3. Environment Variables Configuration

Copy the template environment files and configure your keys:

```bash
# Set up backend env
cp server/.env.example server/.env
# Edit server/.env to fill in your:
# - GROQ_API_KEY
# - PORT (Defaults to 5000)

# Set up frontend env
cp client/.env.example client/.env
# Edit client/.env to populate your Firebase Web App configuration:
# - VITE_FIREBASE_API_KEY
# - VITE_FIREBASE_AUTH_DOMAIN
# - VITE_FIREBASE_PROJECT_ID
# - VITE_FIREBASE_STORAGE_BUCKET
# - VITE_FIREBASE_MESSAGING_SENDER_ID
# - VITE_FIREBASE_APP_ID
```

### 4. Installation & Local Development

Run the backend and frontend servers:

```bash
# 1. Start the Backend Proxy Server (Port 5000)
cd server
npm install
npm run dev

# 2. Start the React Frontend App (Port 3000) — in a new terminal window
cd client
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 User Roles & Features

| Faculty (Teacher) 🎓 | Student 📚 |
| :--- | :--- |
| **AI Generation**: Prompt-to-syllabus generation grouped by semesters. | **Institutional Browse**: Browse published curricula scoped specifically to their college. |
| **Syllabus Manager**: Publish, edit, and delete curriculum paths. | **Enrollment**: Sign up for courses and track completion milestones. |
| **PDF Export**: Generate high-quality offline PDF syllabi. | **History Logs**: Retain snapshots of enrolled course materials. |
| **Student Analytics**: Track class enrollment counts and progression charts. | **AI Chatbot Helper**: Access chatbot assistant logs for learning help. |

---

## 🔒 Security & College Scoping

EduCanvas features strict institutional isolation:
- **College-Scoped Access**: Students only see, search, and register for curricula where the course's `college` field matches the student's profile configuration.
- **Firestore Security Rules**: Rules configured in `firestore.rules` validate write operations, verify roles, and ensure teachers can only modify their own institutional curriculum data.

---

## 📁 Directory Architecture

```text
genai-curriculum-platform/
├── client/              # React frontend (Vite configuration)
│   ├── public/          # Static files & assets
│   └── src/
│       ├── components/  # Reusable shared, teacher, student & auth views
│       ├── context/     # Firebase Authentication Context providers
│       ├── hooks/       # Custom React Firestore hooks
│       ├── styles/      # Global styling rules & css transitions
│       └── utils/       # PDF export, Groq API, and stats helpers
├── server/              # Express API (Groq API endpoints & middleware)
├── firestore.rules      # Production Firestore Security Rules
└── README.md            # Project Documentation
```

---

*Powered by SmartBridge / Skill Wallet · version 1.0.0*
