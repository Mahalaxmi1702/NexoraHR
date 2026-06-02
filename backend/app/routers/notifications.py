from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from app.database import get_db
from app.models import User, Leave, Attendance, Document
from app.routers.auth import get_current_user

router = APIRouter()


@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifications = []

    if current_user.role in ["admin", "hr"]:
        pending_leaves = db.query(Leave).filter(Leave.status == "pending").count()

        if pending_leaves > 0:
            notifications.append({
                "id": "pending-leaves",
                "title": "Pending Leave Requests",
                "message": f"{pending_leaves} leave request(s) are waiting for approval.",
                "type": "leave",
                "read": False
            })

        employees_without_docs = 0
        employees = db.query(User).filter(User.role == "employee").all()

        for employee in employees:
            doc_count = db.query(Document).filter(Document.user_id == employee.id).count()
            if doc_count == 0:
                employees_without_docs += 1

        if employees_without_docs > 0:
            notifications.append({
                "id": "missing-documents",
                "title": "Missing Employee Documents",
                "message": f"{employees_without_docs} employee(s) have not uploaded documents.",
                "type": "documents",
                "read": False
            })

        today_attendance = db.query(Attendance).filter(Attendance.date == date.today()).count()

        notifications.append({
            "id": "today-attendance",
            "title": "Today Attendance",
            "message": f"{today_attendance} attendance record(s) found today.",
            "type": "attendance",
            "read": True
        })

    else:
        today_attendance = (
            db.query(Attendance)
            .filter(
                Attendance.user_id == current_user.id,
                Attendance.date == date.today()
            )
            .first()
        )

        if not today_attendance:
            notifications.append({
                "id": "checkin-reminder",
                "title": "Check-in Reminder",
                "message": "You have not checked in today.",
                "type": "attendance",
                "read": False
            })

        pending_leave = (
            db.query(Leave)
            .filter(
                Leave.user_id == current_user.id,
                Leave.status == "pending"
            )
            .count()
        )

        if pending_leave > 0:
            notifications.append({
                "id": "leave-pending",
                "title": "Leave Request Pending",
                "message": f"You have {pending_leave} leave request(s) awaiting approval.",
                "type": "leave",
                "read": False
            })

        doc_count = db.query(Document).filter(Document.user_id == current_user.id).count()

        if doc_count == 0:
            notifications.append({
                "id": "upload-documents",
                "title": "Upload Documents",
                "message": "Please upload your required employee documents.",
                "type": "documents",
                "read": False
            })

    if not notifications:
        notifications.append({
            "id": "all-good",
            "title": "All caught up",
            "message": "No new notifications right now.",
            "type": "info",
            "read": True
        })

    return notifications


@router.post("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    return {
        "message": "Notification marked as read",
        "notification_id": notification_id
    }