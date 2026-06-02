from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from app.database import get_db
from app.models import User, Attendance, Leave, Payroll, Document
from app.routers.auth import get_current_user

router = APIRouter()


def safe_amount(value):
    try:
        return float(value or 0)
    except Exception:
        return 0.0


def month_matches_current(payroll_month: str, today: date) -> bool:
    if not payroll_month:
        return False

    raw = payroll_month.strip().lower()

    possible_formats = [
        today.strftime("%B %Y").lower(),   # June 2026
        today.strftime("%b %Y").lower(),   # Jun 2026
        today.strftime("%B").lower(),      # June
        today.strftime("%b").lower(),      # Jun
        today.strftime("%Y-%m").lower(),   # 2026-06
        today.strftime("%m-%Y").lower(),   # 06-2026
    ]

    return raw in possible_formats or today.strftime("%B").lower() in raw


def get_payroll_summary(db: Session, today: date):
    all_payrolls = db.query(Payroll).all()

    current_month_payrolls = [
        payroll for payroll in all_payrolls
        if month_matches_current(payroll.month, today)
    ]

    current_month_total = sum(safe_amount(p.net_salary) for p in current_month_payrolls)

    # Fallback: if current month is empty, show latest payroll created.
    latest_payroll = (
        db.query(Payroll)
        .order_by(Payroll.created_at.desc())
        .first()
    )

    latest_month = latest_payroll.month if latest_payroll else ""

    latest_month_payrolls = []
    if latest_month:
        latest_month_payrolls = [
            payroll for payroll in all_payrolls
            if str(payroll.month).strip().lower() == str(latest_month).strip().lower()
        ]

    latest_month_total = sum(safe_amount(p.net_salary) for p in latest_month_payrolls)

    total_all_time = sum(safe_amount(p.net_salary) for p in all_payrolls)

    if current_month_total > 0:
        display_total = current_month_total
        display_label = today.strftime("%B %Y")
    elif latest_month_total > 0:
        display_total = latest_month_total
        display_label = f"Latest payroll: {latest_month}"
    else:
        display_total = 0
        display_label = "No payroll records"

    return {
        "total_payroll": display_total,
        "total_payroll_month": display_total,
        "current_month_payroll": current_month_total,
        "latest_month_payroll": latest_month_total,
        "all_time_payroll": total_all_time,
        "payroll_label": display_label,
        "payroll_records_count": len(all_payrolls),
    }


@router.get("/metrics")
def dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "hr"]:
        # Employee dashboard can still show limited employee-specific data.
        today = date.today()

        my_payrolls = (
            db.query(Payroll)
            .filter(Payroll.user_id == current_user.id)
            .order_by(Payroll.created_at.desc())
            .all()
        )

        latest_payroll = my_payrolls[0] if my_payrolls else None
        latest_salary = safe_amount(latest_payroll.net_salary) if latest_payroll else 0

        my_attendance_today = (
            db.query(Attendance)
            .filter(
                Attendance.user_id == current_user.id,
                Attendance.date == today
            )
            .first()
        )

        document_count = (
            db.query(Document)
            .filter(Document.user_id == current_user.id)
            .count()
        )

        pending_leaves = (
            db.query(Leave)
            .filter(
                Leave.user_id == current_user.id,
                Leave.status == "pending"
            )
            .count()
        )

        approved_leaves = (
            db.query(Leave)
            .filter(
                Leave.user_id == current_user.id,
                Leave.status == "approved"
            )
            .count()
        )

        return {
            "total_employees": 1,
            "active_employees": 1 if current_user.status == "active" else 0,
            "present_today": 1 if my_attendance_today and my_attendance_today.status in ["present", "checked_out", "late"] else 0,
            "absent_today": 0 if my_attendance_today else 1,
            "late_today": 1 if my_attendance_today and my_attendance_today.status == "late" else 0,
            "pending_leaves": pending_leaves,
            "approved_leaves": approved_leaves,
            "rejected_leaves": db.query(Leave).filter(Leave.user_id == current_user.id, Leave.status == "rejected").count(),
            "total_payroll": latest_salary,
            "total_payroll_month": latest_salary,
            "payroll_label": latest_payroll.month if latest_payroll else "No payroll records",
            "total_documents": document_count,
            "document_count": document_count,
            "attendance_rate": 100 if my_attendance_today else 0,
            "department_distribution": {},
            "work_mode_distribution": {},
            "leave_summary": {
                "pending": pending_leaves,
                "approved": approved_leaves,
            },
            "open_positions": 0,
        }

    today = date.today()

    total_employees = db.query(User).count()
    active_employees = db.query(User).filter(User.status == "active").count()

    today_attendance = db.query(Attendance).filter(Attendance.date == today).all()

    present_today = len([
        a for a in today_attendance
        if a.status in ["present", "checked_out"]
    ])

    late_today = len([
        a for a in today_attendance
        if a.status == "late"
    ])

    absent_today = total_employees - present_today - late_today

    pending_leaves = db.query(Leave).filter(Leave.status == "pending").count()
    approved_leaves = db.query(Leave).filter(Leave.status == "approved").count()
    rejected_leaves = db.query(Leave).filter(Leave.status == "rejected").count()

    payroll_summary = get_payroll_summary(db, today)

    document_count = db.query(Document).count()

    last_30_days = today - timedelta(days=30)
    recent_attendance = db.query(Attendance).filter(Attendance.date >= last_30_days).all()

    total_possible = len(recent_attendance)
    present_count = len([
        a for a in recent_attendance
        if a.status in ["present", "checked_out", "late"]
    ])

    attendance_rate = round((present_count / max(total_possible, 1)) * 100, 1)

    remote_count = db.query(User).filter(User.work_mode == "remote").count()
    hybrid_count = db.query(User).filter(User.work_mode == "hybrid").count()
    onsite_count = db.query(User).filter(User.work_mode == "onsite").count()

    departments = (
        db.query(User.department, func.count(User.id))
        .group_by(User.department)
        .all()
    )

    leave_summary = {
        "pending": pending_leaves,
        "approved": approved_leaves,
        "rejected": rejected_leaves,
    }

    return {
        "total_employees": total_employees,
        "active_employees": active_employees,
        "present_today": present_today,
        "absent_today": max(absent_today, 0),
        "late_today": late_today,
        "pending_leaves": pending_leaves,
        "approved_leaves": approved_leaves,
        "rejected_leaves": rejected_leaves,

        # Important: frontend uses total_payroll.
        "total_payroll": payroll_summary["total_payroll"],

        # Kept for older frontend compatibility.
        "total_payroll_month": payroll_summary["total_payroll_month"],

        "current_month_payroll": payroll_summary["current_month_payroll"],
        "latest_month_payroll": payroll_summary["latest_month_payroll"],
        "all_time_payroll": payroll_summary["all_time_payroll"],
        "payroll_label": payroll_summary["payroll_label"],
        "payroll_records_count": payroll_summary["payroll_records_count"],

        # Frontend uses total_documents, old schema used document_count.
        "total_documents": document_count,
        "document_count": document_count,

        "attendance_health": attendance_rate,
        "attendance_rate": attendance_rate,

        "remote_count": remote_count,
        "hybrid_count": hybrid_count,
        "onsite_count": onsite_count,

        "work_mode_distribution": {
            "remote": remote_count,
            "hybrid": hybrid_count,
            "onsite": onsite_count,
        },

        "department_distribution": {
            department or "General": count
            for department, count in departments
        },

        "leave_summary": leave_summary,
        "open_positions": 0,
        "attendance_trend": [],
    }


@router.get("/employee-summary")
def employee_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")

    departments = db.query(User.department, func.count(User.id)).group_by(User.department).all()
    designations = db.query(User.designation, func.count(User.id)).group_by(User.designation).all()

    return {
        "departments": [{"name": d[0], "count": d[1]} for d in departments],
        "designations": [{"name": d[0], "count": d[1]} for d in designations]
    }