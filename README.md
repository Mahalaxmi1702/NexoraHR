# NexoraHR - AI-Powered HRMS for K Labs India

A production-grade, intelligent Human Resource Management System built with FastAPI + React + Tailwind CSS. Features a stunning modern UI with dark/light theme toggle, role-based access control, and an AI-powered HR assistant.

## 🚀 Quick Start

### Backend
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nexorahr.com | admin123 |
| HR | hr@nexorahr.com | hr12345 |
| Employee | employee@nexorahr.com | employee123 |
| Manager | vikram@nexorahr.com | employee123 |

## 📁 Project Structure

```
nexorahr/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── models.py            # All DB models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── auth.py              # JWT auth utilities
│   │   ├── seed.py              # Demo data seeder
│   │   └── routers/
│   │       ├── auth.py          # Login, register, me
│   │       ├── employees.py     # CRUD employees
│   │       ├── attendance.py    # Check-in/out, history
│   │       ├── leave.py         # Apply, approve, reject
│   │       ├── payroll.py       # Salary records
│   │       ├── documents.py     # Upload, manage docs
│   │       ├── dashboard.py     # Admin metrics
│   │       └── ai.py            # NexoraAI chat
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── index.css
    │   ├── context/
    │   │   ├── AuthContext.tsx
    │   │   └── ThemeContext.tsx
    │   ├── api/
    │   │   └── client.ts
    │   ├── components/
    │   │   ├── Layout.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── Topbar.tsx
    │   │   └── ProtectedRoute.tsx
    │   └── pages/
    │       ├── LandingPage.tsx
    │       ├── Login.tsx
    │       ├── Register.tsx
    │       ├── Dashboard.tsx
    │       ├── Employees.tsx
    │       ├── Attendance.tsx
    │       ├── Leave.tsx
    │       ├── Payroll.tsx
    │       ├── Documents.tsx
    │       ├── AIAssistant.tsx
    │       └── Settings.tsx
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── index.html
```

## ✅ What's Fully Working

### Authentication & Roles
- [x] JWT-based login/register with secure password hashing
- [x] Role-based access: admin, hr, manager, employee
- [x] Route protection and redirects
- [x] Demo account seeder (runs automatically on startup)

### Employee Portal
- [x] Personal dashboard with attendance, leave balance, salary
- [x] Check-in / Check-out with today status
- [x] Attendance history with work hours
- [x] Leave application with type, dates, reason
- [x] Leave status tracking with HR replies
- [x] Leave balance display
- [x] Salary/payroll history with payslip details
- [x] Document upload and viewing
- [x] AI Assistant with contextual queries

### Admin/HR Portal
- [x] Full dashboard with workforce metrics, charts
- [x] Employee CRUD with search, filter, department filter
- [x] All attendance records view
- [x] Team attendance for today
- [x] Leave request approval/rejection with reply messages
- [x] Payroll management - add records for any employee
- [x] All employee documents with search/filter
- [x] AI Assistant with workforce analytics queries

### AI Assistant (NexoraAI)
- [x] Role-aware responses (employee vs admin)
- [x] Local intelligence analyzing real database data
- [x] Gemini API integration (optional, via env var)
- [x] Contextual suggestions
- [x] Professional, data-backed responses

### UI/UX
- [x] Modern glassmorphism design with gradients
- [x] Dark/Light theme toggle (persisted in localStorage)
- [x] Responsive layout (mobile + desktop)
- [x] Animated transitions with Framer Motion
- [x] Charts and visual metrics on dashboard
- [x] Loading states and empty states
- [x] Professional landing page
- [x] Collapsible sidebar
- [x] Mobile bottom navigation

## ⚠️ Honest Limitations

1. **File Upload**: Document upload creates metadata but stores files locally in `uploads/` folder. For production, integrate S3/cloud storage.
2. **Real-time**: No WebSocket real-time updates. Refresh page for latest data.
3. **Email**: No email notifications for leave approvals.
4. **Password Change**: Settings page has UI but backend password update endpoint is not implemented (can be added easily).
5. **Gemini Key**: AI works fully with local intelligence. To use Gemini, set `GEMINI_API_KEY` environment variable.
6. **Database**: SQLite for demo. For production, switch to PostgreSQL.
7. **Payroll PDF**: No PDF payslip generation yet.

## 🛠️ Tech Stack

- **Backend**: FastAPI, SQLAlchemy, SQLite, JWT, Passlib, Pydantic
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Framer Motion, Lucide React
- **AI**: Local intelligence + optional Gemini 1.5 Flash

## 📝 API Endpoints

All endpoints prefixed with `/api`:

- `POST /auth/register` - Create employee account
- `POST /auth/login` - Login (OAuth2 form)
- `GET /auth/me` - Current user
- `GET /employees/` - List employees (admin/hr)
- `POST /employees/` - Create employee
- `GET /employees/{id}` - Get employee
- `PATCH /employees/{id}` - Update employee
- `DELETE /employees/{id}` - Delete employee
- `GET /dashboard/metrics` - Dashboard metrics
- `POST /attendance/check-in` - Check in
- `POST /attendance/check-out` - Check out
- `GET /attendance/my-attendance` - My history
- `GET /attendance/team-attendance` - Team today
- `GET /attendance/today` - Today status
- `GET /leave/my-leaves` - My leaves
- `POST /leave/apply` - Apply leave
- `GET /leave/requests` - All requests (admin)
- `GET /leave/pending-approvals` - Pending (admin)
- `PATCH /leave/{id}/approve` - Approve
- `PATCH /leave/{id}/reject` - Reject
- `GET /leave/balance` - Leave balance
- `GET /payroll/my-payslips` - My payslips
- `GET /payroll/all` - All payroll (admin)
- `POST /payroll/` - Create payroll (admin)
- `GET /documents/` - List documents
- `POST /documents/upload` - Upload document
- `DELETE /documents/{id}` - Delete document
- `POST /ai/chat` - AI assistant chat

## 🎯 Demo Ready For K Labs

The project is fully functional for a demo with:
- 7 pre-seeded employees with realistic data
- 30 days of attendance history
- Multiple leave requests (pending/approved/rejected)
- 5 months of payroll records
- Documents for each employee
- Working AI assistant with contextual answers

Built with ❤️ for K Labs India, Chennai.
