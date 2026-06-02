from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: Optional[str] = "employee"
    department: Optional[str] = "General"
    designation: Optional[str] = "Employee"
    phone: Optional[str] = ""
    employee_id: Optional[str] = None
    status: Optional[str] = "active"
    work_mode: Optional[str] = "onsite"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    work_mode: Optional[str] = None
    role: Optional[str] = None

class UserOut(UserBase):
    id: int
    joining_date: Optional[date] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class AttendanceBase(BaseModel):
    date: Optional[date] = None
    work_mode: Optional[str] = "onsite"
    location: Optional[str] = "Office"
    notes: Optional[str] = ""

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceOut(BaseModel):
    id: int
    user_id: int
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    work_mode: str
    work_hours: float
    status: str
    location: str
    notes: str
    created_at: Optional[datetime] = None
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True

class LeaveBase(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: Optional[str] = ""
    days: Optional[int] = 1

class LeaveCreate(LeaveBase):
    pass

class LeaveUpdate(BaseModel):
    status: Optional[str] = None
    admin_reply: Optional[str] = None

class LeaveOut(BaseModel):
    id: int
    user_id: int
    leave_type: str
    start_date: date
    end_date: date
    reason: str
    status: str
    admin_reply: str
    days: int
    created_at: Optional[datetime] = None
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True

class PayrollBase(BaseModel):
    month: str
    period: Optional[str] = ""
    basic_salary: float
    allowances: Optional[float] = 0.0
    deductions: Optional[float] = 0.0
    net_salary: Optional[float] = None
    status: Optional[str] = "pending"
    pay_date: Optional[date] = None

class PayrollCreate(PayrollBase):
    user_id: int

class PayrollOut(BaseModel):
    id: int
    user_id: int
    month: str
    period: str
    basic_salary: float
    allowances: float
    deductions: float
    net_salary: float
    status: str
    pay_date: Optional[date] = None
    created_at: Optional[datetime] = None
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True

class DocumentBase(BaseModel):
    title: str
    doc_type: Optional[str] = "other"
    notes: Optional[str] = ""

class DocumentCreate(DocumentBase):
    user_id: int

class DocumentOut(BaseModel):
    id: int
    user_id: int
    title: str
    doc_type: str
    file_path: str
    notes: str
    uploaded_by: int
    created_at: Optional[datetime] = None
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True

class ChatMessageBase(BaseModel):
    message: str

class ChatMessageOut(BaseModel):
    id: int
    user_id: int
    role: str
    message: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DashboardMetrics(BaseModel):
    total_employees: int
    active_employees: int
    present_today: int
    absent_today: int
    late_today: int
    pending_leaves: int
    approved_leaves: int
    total_payroll_month: float
    document_count: int
    attendance_health: float
    remote_count: int
    hybrid_count: int
    onsite_count: int

class AIChatRequest(BaseModel):
    message: str

class AIChatResponse(BaseModel):
    reply: str
    data_used: Optional[str] = None
