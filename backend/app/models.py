from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, date
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    hr = "hr"
    manager = "manager"
    employee = "employee"


class UserStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    on_leave = "on_leave"


class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"
    late = "late"
    half_day = "half_day"
    checked_out = "checked_out"


class LeaveType(str, enum.Enum):
    sick = "sick"
    casual = "casual"
    annual = "annual"
    maternity = "maternity"
    paternity = "paternity"
    unpaid = "unpaid"
    other = "other"


class LeaveStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class PayrollStatus(str, enum.Enum):
    paid = "paid"
    pending = "pending"
    processing = "processing"


class DocumentType(str, enum.Enum):
    resume = "resume"
    id_proof = "id_proof"
    contract = "contract"
    certificate = "certificate"
    tax_form = "tax_form"
    other = "other"


class WorkMode(str, enum.Enum):
    onsite = "onsite"
    remote = "remote"
    hybrid = "hybrid"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    name = Column(String, nullable=False)
    role = Column(String, default=UserRole.employee.value)

    department = Column(String, default="General")
    designation = Column(String, default="Employee")
    phone = Column(String, default="")

    employee_id = Column(String, unique=True, index=True, nullable=True)
    joining_date = Column(Date, default=date.today)

    status = Column(String, default=UserStatus.active.value)
    work_mode = Column(String, default=WorkMode.onsite.value)

    created_at = Column(DateTime, default=datetime.utcnow)

    attendances = relationship(
        "Attendance",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    leaves = relationship(
        "Leave",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    payrolls = relationship(
        "Payroll",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # Documents that belong to this employee/user
    documents = relationship(
        "Document",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="Document.user_id"
    )

    # Documents uploaded by this user/admin/hr
    uploaded_documents = relationship(
        "Document",
        back_populates="uploader",
        foreign_keys="Document.uploaded_by"
    )

    chat_messages = relationship(
        "ChatMessage",
        back_populates="user",
        cascade="all, delete-orphan"
    )


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    date = Column(Date, default=date.today)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)

    work_mode = Column(String, default=WorkMode.onsite.value)
    work_hours = Column(Float, default=0.0)
    status = Column(String, default=AttendanceStatus.absent.value)
    location = Column(String, default="Office")
    notes = Column(Text, default="")

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship(
        "User",
        back_populates="attendances"
    )


class Leave(Base):
    __tablename__ = "leaves"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    leave_type = Column(String, default=LeaveType.casual.value)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    reason = Column(Text, default="")
    status = Column(String, default=LeaveStatus.pending.value)
    admin_reply = Column(Text, default="")
    days = Column(Integer, default=1)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship(
        "User",
        back_populates="leaves"
    )


class Payroll(Base):
    __tablename__ = "payrolls"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    month = Column(String, nullable=False)
    period = Column(String, default="")

    basic_salary = Column(Float, default=0.0)
    allowances = Column(Float, default=0.0)
    deductions = Column(Float, default=0.0)
    net_salary = Column(Float, default=0.0)

    status = Column(String, default=PayrollStatus.pending.value)
    pay_date = Column(Date, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship(
        "User",
        back_populates="payrolls"
    )


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    # Employee/user this document belongs to
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String, nullable=False)
    doc_type = Column(String, default=DocumentType.other.value)
    file_path = Column(String, default="")
    notes = Column(Text, default="")

    # User/admin/hr who uploaded this document
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship(
        "User",
        back_populates="documents",
        foreign_keys=[user_id]
    )

    uploader = relationship(
        "User",
        back_populates="uploaded_documents",
        foreign_keys=[uploaded_by]
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    role = Column(String, default="user")
    message = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship(
        "User",
        back_populates="chat_messages"
    )