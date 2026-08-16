# IntelliHire 🚀

An AI-powered placement preparation, proctoring, and recruitment platform tailored for colleges and enterprise HR teams.

---

## 📁 Project Directory Structure

```text
intellihire/
├── frontend/                 # React.js Client Application
│   ├── public/               # Public static assets & index.html
│   ├── src/                  # React components, pages, routes & state
│   │   ├── components/       # Pages & UI components
│   │   ├── config.js         # API endpoint base configuration
│   │   └── App.js            # Wouter Router setup
│   ├── package.json          # Node dependencies & scripts
│   └── tailwind.config.js    # Tailwind CSS design system
│
├── backend/                  # FastAPI (Python 3.12+) Backend Application
│   ├── app/                  # Main FastAPI Application Package
│   │   ├── core/             # Configuration & JWT/Bcrypt security
│   │   ├── db/               # Database engine & SQLModel session helpers
│   │   ├── models/           # Relational Database Models (SQLModel)
│   │   ├── schemas/          # Strict Pydantic Data Validation Schemas
│   │   ├── routes/           # API Endpoints (Auth, Tests, Quiz, Results)
│   │   └── main.py           # FastAPI app entry point
│   ├── tests/                # Pytest automated test suite
│   ├── requirements.txt      # Python dependencies
│   └── intellihire.db        # SQLite local database (or PostgreSQL via DATABASE_URL)
│
├── legacy_express_server/    # Legacy Node/Express backend (Archived)
└── README.md                 # Project Overview & Quickstart Guide
```

---

## ⚡ Quickstart: Running the Project

### 1. Backend Setup (FastAPI)

Navigate to the `backend/` directory:

```bash
cd backend
```

Create and activate virtual environment (if not already created):

```bash
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Start the FastAPI development server:

```bash
uvicorn app.main:app --reload --port 8000
```

> 🌐 **Interactive API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

Run automated tests:

```bash
python -m pytest tests/
```

---

### 2. Frontend Setup (React.js)

Navigate to the `frontend/` directory:

```bash
cd frontend
```

Install dependencies and start dev server:

```bash
npm install
npm start
```

> 🌐 **Application Web Interface**: [http://localhost:3000](http://localhost:3000)

---

## 🛡️ Enterprise Features Implemented

1. **Relational Database Stack**: Strict Pydantic payloads mapped to SQLModel schemas with PostgreSQL & SQLite support.
2. **Academic Integrity Proctoring**:
   - Tab-switching detection via Page Visibility API.
   - Forced Fullscreen enforcement.
   - Disabled copy, paste, and right-click context menus during assessments.
   - Question and option randomization per student session.
   - Periodic 10-second autosaving heartbeat for crash recovery.
3. **Single-Session JWT Security**: Invalidates previous login sessions if a user logs in from another browser/device.
4. **Granular Performance Analytics**: Speed-vs-accuracy tracking and detailed proctoring violation logs for HR/Admin dashboards.
