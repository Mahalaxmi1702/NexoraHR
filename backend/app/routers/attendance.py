from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, date, timedelta
from app.database import get_db
from app.models import User, Attendance
from app.schemas import AttendanceOut, AttendanceCreate
from app.routers.auth import get_current_user

router = APIRouter()

@router.post("/check-in")
def check_in(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    existing = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.date == today
    ).first()

    if existing and existing.check_in:
        raise HTTPException(status_code=400, detail="Already checked in today")

    now = datetime.now()
    status = "present" if now.hour < 10 else "late"

    if existing:
        existing.check_in = now
        existing.status = status
        existing.work_mode = data.work_mode or current_user.work_mode
        existing.location = data.location or "Office"
        db.commit()
        db.refresh(existing)
        return existing
    else:
        att = Attendance(
            user_id=current_user.id,
            date=today,
            check_in=now,
            status=status,
            work_mode=data.work_mode or current_user.work_mode,
            location=data.location or "Office",
            notes=data.notes or ""
        )
        db.add(att)
        db.commit()
        db.refresh(att)
        return att

@router.post("/check-out")
def check_out(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    att = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.date == today
    ).first()

    if not att:
        raise HTTPException(status_code=400, detail="No check-in found for today")
    if att.check_out:
        raise HTTPException(status_code=400, detail="Already checked out today")

    att.check_out = datetime.now()
    if att.check_in:
        hours = round((att.check_out - att.check_in).seconds / 3600, 1)
        att.work_hours = hours
    att.status = "checked_out"
    db.commit()
    db.refresh(att)
    return att

@router.get("/my-attendance", response_model=List[AttendanceOut])
def my_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Attendance).filter(
        Attendance.user_id == current_user.id
    ).order_by(Attendance.date.desc()).all()

@router.get("/today")
def today_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    att = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.date == today
    ).first()

    if not att:
        return {"status": "not_checked_in", "message": "You have not checked in today"}
    if att.check_out:
        return {"status": "checked_out", "check_in": att.check_in, "check_out": att.check_out, "work_hours": att.work_hours}
    return {"status": "checked_in", "check_in": att.check_in, "work_hours": att.work_hours}

@router.get("/team-attendance", response_model=List[AttendanceOut])
def team_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "hr", "manager"]:
        raise HTTPException(status_code=403, detail="Access denied")

    today = date.today()
    return db.query(Attendance).filter(Attendance.date == today).all()

@router.get("/all")
def all_attendance(
    start_date: date = None,
    end_date: date = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")

    query = db.query(Attendance)
    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)
    return query.order_by(Attendance.date.desc()).all()
