from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import date

from app.database import get_db
from app.models import User, Leave
from app.schemas import LeaveOut, LeaveCreate, LeaveUpdate
from app.routers.auth import get_current_user

router = APIRouter()

# Professional yearly leave policy for normal employees.
# Maternity/paternity/unpaid are special-case leaves and should NOT be added into normal balance.
YEARLY_LEAVE_POLICY: Dict[str, int] = {
    "sick": 10,
    "casual": 12,
    "annual": 15,
    "other": 5,
}

SPECIAL_LEAVE_TYPES = {
    "maternity": "Special leave handled by HR approval. Not counted in regular leave balance.",
    "paternity": "Special leave handled by HR approval. Not counted in regular leave balance.",
    "unpaid": "Unpaid leave requires HR approval. Not counted as paid leave balance.",
}


def calculate_leave_days(start_date: date, end_date: date) -> int:
    return max((end_date - start_date).days + 1, 1)


@router.get("/my-leaves", response_model=List[LeaveOut])
def my_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(Leave)
        .filter(Leave.user_id == current_user.id)
        .order_by(Leave.created_at.desc())
        .all()
    )


@router.post("/apply", response_model=LeaveOut)
def apply_leave(
    leave: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if leave.start_date > leave.end_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    leave_type = str(leave.leave_type).lower()
    days = calculate_leave_days(leave.start_date, leave.end_date)

    if leave_type in YEARLY_LEAVE_POLICY:
        balance_data = get_leave_balance_data(db, current_user)
        remaining = balance_data["breakdown"][leave_type]["remaining"]

        if days > remaining:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient {leave_type} leave balance. Requested {days}, remaining {remaining}."
            )

    lv = Leave(
        user_id=current_user.id,
        leave_type=leave_type,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        days=days,
        status="pending",
        admin_reply=""
    )

    db.add(lv)
    db.commit()
    db.refresh(lv)
    return lv


@router.get("/requests", response_model=List[LeaveOut])
def leave_requests(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")

    query = db.query(Leave)

    if status:
        query = query.filter(Leave.status == status)

    return query.order_by(Leave.created_at.desc()).all()


@router.get("/pending-approvals", response_model=List[LeaveOut])
def pending_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return (
        db.query(Leave)
        .filter(Leave.status == "pending")
        .order_by(Leave.created_at.desc())
        .all()
    )


@router.patch("/{leave_id}/approve", response_model=LeaveOut)
def approve_leave(
    leave_id: int,
    data: LeaveUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")

    lv = db.query(Leave).filter(Leave.id == leave_id).first()

    if not lv:
        raise HTTPException(status_code=404, detail="Leave request not found")

    lv.status = "approved"
    lv.admin_reply = data.admin_reply or "Approved by HR"
    db.commit()
    db.refresh(lv)

    return lv


@router.patch("/{leave_id}/reject", response_model=LeaveOut)
def reject_leave(
    leave_id: int,
    data: LeaveUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")

    lv = db.query(Leave).filter(Leave.id == leave_id).first()

    if not lv:
        raise HTTPException(status_code=404, detail="Leave request not found")

    lv.status = "rejected"
    lv.admin_reply = data.admin_reply or "Rejected by HR"
    db.commit()
    db.refresh(lv)

    return lv


def get_leave_balance_data(db: Session, current_user: User):
    current_year = date.today().year

    approved_leaves = (
        db.query(Leave)
        .filter(
            Leave.user_id == current_user.id,
            Leave.status == "approved"
        )
        .all()
    )

    used = {leave_type: 0 for leave_type in YEARLY_LEAVE_POLICY.keys()}

    for lv in approved_leaves:
        leave_type = str(lv.leave_type).lower()

        if leave_type not in YEARLY_LEAVE_POLICY:
            continue

        if lv.start_date and lv.start_date.year == current_year:
            days = lv.days or calculate_leave_days(lv.start_date, lv.end_date)
            used[leave_type] += days

    breakdown = {}

    for leave_type, allowed in YEARLY_LEAVE_POLICY.items():
        used_days = used.get(leave_type, 0)
        breakdown[leave_type] = {
            "allowed": allowed,
            "used": used_days,
            "remaining": max(allowed - used_days, 0)
        }

    total_allowed = sum(YEARLY_LEAVE_POLICY.values())
    total_used = sum(used.values())
    total_remaining = max(total_allowed - total_used, 0)

    return {
        "year": current_year,
        "total_allowed": total_allowed,
        "total_used": total_used,
        "total_remaining": total_remaining,
        "breakdown": breakdown,
        "special_leave_note": SPECIAL_LEAVE_TYPES
    }


@router.get("/balance")
def leave_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_leave_balance_data(db, current_user)