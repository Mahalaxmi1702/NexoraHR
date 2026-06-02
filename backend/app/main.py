from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, employees, attendance, leave, payroll, documents, dashboard, ai, notifications, recruitment
from app.seed import seed_data

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NexoraHR API",
    description="AI-Powered HRMS for K Labs India",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(employees.router, prefix="/api/employees", tags=["Employees"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(leave.router, prefix="/api/leave", tags=["Leave"])
app.include_router(payroll.router, prefix="/api/payroll", tags=["Payroll"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(recruitment.router, prefix="/api/recruitment", tags=["Recruitment"])


@app.on_event("startup")
async def startup_event():
    seed_data()


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "NexoraHR API is running"
    }