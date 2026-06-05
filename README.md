# NexoraHR - AI-Powered HRMS for K Labs India

A demo-ready intelligent Human Resource Management System built with **FastAPI**, **React**, and **Tailwind CSS**. It includes role-based access control, employee/admin dashboards, attendance tracking, leave management, payroll records, document handling, and an AI-powered HR assistant.

This project is designed as a functional prototype for **K Labs India, Chennai**, and can be run locally for evaluation and demo purposes.

---

##  Quick Start

### 1. Clone the Repository

```bash
git clone   https://github.com/Mahalaxmi1702/NexoraHR
cd nexorahr
```

---

## Backend Setup

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The backend will run at:

```txt
http://localhost:8000
```

API documentation will be available at:

```txt
http://localhost:8000/docs
```

---

## Frontend Setup

Open a new terminal and run:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at:

```txt
http://localhost:5173
```

Open this URL in your browser to use the application.

---

## Environment Variables

Create a `.env` file inside the `backend` folder if you want to use optional AI features.

Example:

```env
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_secret_key_here
```

The Gemini API key is optional. The AI assistant also works with local database intelligence without an external API key.

---

##  Demo Credentials

| Role     | Email                                                 | Password    |
| -------- | ----------------------------------------------------- | ----------- |
| Admin    | [admin@nexorahr.com](mailto:admin@nexorahr.com)       | admin123    |
| HR       | [hr@nexorahr.com](mailto:hr@nexorahr.com)             | hr12345     |
| Employee | [employee@nexorahr.com](mailto:employee@nexorahr.com) | employee123 |
| Manager  | [vikram@nexorahr.com](mailto:vikram@nexorahr.com)     | employee123 |

---

##  Project Structure

```txt
nexorahr/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── models.py            # Database models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── auth.py              # JWT authentication utilities
│   │   ├── seed.py              # Demo data seeder
│   │   └── routers/
│   │       ├── auth.py          # Login, register, current user
│   │       ├── employees.py     # Employee CRUD
│   │       ├── attendance.py    # Check-in, check-out, history
│   │       ├── leave.py         # Leave apply, approve, reject
│   │       ├── payroll.py       # Payroll and salary records
│   │       ├── documents.py     # Document upload and management
│   │       ├── dashboard.py     # Dashboard metrics
│   │       └── ai.py            # NexoraAI assistant
│   └── requirements.txt
│
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

---

##  Features Implemented

### Authentication and Role Management

* JWT-based login and registration
* Secure password hashing
* Role-based access for Admin, HR, Manager, and Employee
* Protected routes
* Automatic redirects based on authentication status
* Demo account seeding on backend startup

---

### Employee Portal

* Personal employee dashboard
* Attendance check-in and check-out
* Today’s attendance status
* Attendance history with work hours
* Leave application with leave type, dates, and reason
* Leave status tracking with HR replies
* Leave balance display
* Salary and payroll history
* Payslip details
* Document upload and viewing
* AI assistant for employee-related queries

---

### Admin and HR Portal

* Admin dashboard with workforce metrics
* Employee management with create, view, update, and delete functionality
* Employee search and department filtering
* Attendance records view
* Team attendance overview
* Leave request approval and rejection
* HR reply messages for leave decisions
* Payroll record creation and management
* Employee document management
* AI assistant for workforce and HR analytics

---

### NexoraAI Assistant

* Role-aware AI responses
* Employee-side contextual answers
* Admin/HR-side workforce insights
* Local intelligence using real database records
* Optional Gemini API integration
* Contextual HR suggestions
* Professional and data-backed responses

---

### UI and User Experience

* Modern responsive interface
* Dark and light theme toggle
* Theme preference stored in local storage
* Dashboard cards and visual metrics
* Charts using Recharts
* Animated transitions using Framer Motion
* Collapsible sidebar
* Mobile-friendly layout
* Loading states
* Empty states
* Professional landing page

---

##  Demo Notes

This project is configured for local demo usage.

On backend startup, demo users and sample HR data are automatically seeded so reviewers can test the system immediately without manual setup.

For evaluation, login using any of the demo credentials above and test both employee-side and admin/HR-side workflows.

Recommended demo flow:

1. Login as Admin or HR.
2. View dashboard metrics.
3. Manage employees.
4. Review attendance records.
5. Approve or reject leave requests.
6. Add or view payroll records.
7. Open the AI assistant and ask HR-related questions.
8. Login as Employee and test check-in, check-out, leave, payroll, and AI assistant features.

---

##  API Endpoints

All backend endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint         | Description             |
| ------ | ---------------- | ----------------------- |
| POST   | `/auth/register` | Create employee account |
| POST   | `/auth/login`    | Login user              |
| GET    | `/auth/me`       | Get current user        |

### Employees

| Method | Endpoint          | Description          |
| ------ | ----------------- | -------------------- |
| GET    | `/employees/`     | List employees       |
| POST   | `/employees/`     | Create employee      |
| GET    | `/employees/{id}` | Get employee details |
| PATCH  | `/employees/{id}` | Update employee      |
| DELETE | `/employees/{id}` | Delete employee      |

### Dashboard

| Method | Endpoint             | Description           |
| ------ | -------------------- | --------------------- |
| GET    | `/dashboard/metrics` | Get dashboard metrics |

### Attendance

| Method | Endpoint                      | Description                             |
| ------ | ----------------------------- | --------------------------------------- |
| POST   | `/attendance/check-in`        | Employee check-in                       |
| POST   | `/attendance/check-out`       | Employee check-out                      |
| GET    | `/attendance/my-attendance`   | Get current employee attendance history |
| GET    | `/attendance/team-attendance` | Get team attendance                     |
| GET    | `/attendance/today`           | Get today’s attendance status           |

### Leave

| Method | Endpoint                   | Description                        |
| ------ | -------------------------- | ---------------------------------- |
| GET    | `/leave/my-leaves`         | Get current employee leave history |
| POST   | `/leave/apply`             | Apply for leave                    |
| GET    | `/leave/requests`          | Get all leave requests             |
| GET    | `/leave/pending-approvals` | Get pending leave approvals        |
| PATCH  | `/leave/{id}/approve`      | Approve leave request              |
| PATCH  | `/leave/{id}/reject`       | Reject leave request               |
| GET    | `/leave/balance`           | Get leave balance                  |

### Payroll

| Method | Endpoint               | Description                   |
| ------ | ---------------------- | ----------------------------- |
| GET    | `/payroll/my-payslips` | Get current employee payslips |
| GET    | `/payroll/all`         | Get all payroll records       |
| POST   | `/payroll/`            | Create payroll record         |

### Documents

| Method | Endpoint            | Description     |
| ------ | ------------------- | --------------- |
| GET    | `/documents/`       | List documents  |
| POST   | `/documents/upload` | Upload document |
| DELETE | `/documents/{id}`   | Delete document |

### AI Assistant

| Method | Endpoint   | Description                  |
| ------ | ---------- | ---------------------------- |
| POST   | `/ai/chat` | Chat with NexoraAI assistant |

---

##  Tech Stack

### Backend

* FastAPI
* SQLAlchemy
* SQLite
* JWT Authentication
* Passlib
* Pydantic
* Uvicorn

### Frontend

* React 18
* Vite
* TypeScript
* Tailwind CSS
* Recharts
* Framer Motion
* Lucide React

### AI

* Local database intelligence
* Optional Gemini 1.5 Flash integration

---

## Current Limitations

This project is demo-ready and functional for local evaluation. The following features can be improved for production deployment:

1. Document files are stored locally in the `uploads/` folder. For production, cloud storage such as AWS S3 or Cloudinary can be integrated.
2. Real-time updates are not implemented yet. Users may need to refresh the page to see the latest updates.
3. Email notifications for leave approvals and HR updates are not implemented yet.
4. Password change UI exists, but the backend password update endpoint is not implemented yet.
5. Gemini API integration is optional. Without the API key, the AI assistant continues to work using local database intelligence.
6. SQLite is used for demo purposes. For production, PostgreSQL is recommended.
7. PDF payslip generation is not implemented yet.

---

## Demo Data Included

The project includes seeded demo data for easier evaluation:

* 7 sample employees
* 30 days of attendance history
* Multiple leave requests with pending, approved, and rejected statuses
* 5 months of payroll records
* Sample document records
* Working AI assistant with contextual HR answers

---

## Security Note

For security reasons, do not upload real environment files or sensitive credentials to GitHub.

The repository should include:

```txt
.env.example
```

The repository should not include:

```txt
.env
venv/
node_modules/
__pycache__/
```

---

## Developed For

**K Labs India, Chennai**

This project was built as a demo-ready HRMS and employee management system with AI-assisted HR workflows.

---

## Developer

**R. Mahalaxmi**
B.Tech CSE - Artificial Intelligence and Machine Learning
VIT Vellore
