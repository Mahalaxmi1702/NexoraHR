from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Payroll
from app.schemas import PayrollOut, PayrollCreate
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/my-payslips", response_model=List[PayrollOut])
def my_payslips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Payroll).filter(Payroll.user_id == current_user.id).order_by(Payroll.created_at.desc()).all()

@router.get("/my-history")
def my_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payrolls = db.query(Payroll).filter(Payroll.user_id == current_user.id).order_by(Payroll.created_at.desc()).all()
    total_earned = sum(p.net_salary for p in payrolls)
    return {"payrolls": payrolls, "total_earned": total_earned}

@router.get("/employee/{employee_id}", response_model=List[PayrollOut])
def employee_payroll(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "hr"] and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(Payroll).filter(Payroll.user_id == employee_id).order_by(Payroll.created_at.desc()).all()

@router.get("/all")
def all_payroll(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(Payroll).order_by(Payroll.created_at.desc()).all()

@router.post("/")
def create_payroll(
    data: PayrollCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")

    net = data.net_salary or (data.basic_salary + data.allowances - data.deductions)
    pr = Payroll(
        user_id=data.user_id,
        month=data.month,
        period=data.period,
        basic_salary=data.basic_salary,
        allowances=data.allowances,
        deductions=data.deductions,
        net_salary=net,
        status=data.status,
        pay_date=data.pay_date
    )
    db.add(pr)
    db.commit()
    db.refresh(pr)
    return pr
