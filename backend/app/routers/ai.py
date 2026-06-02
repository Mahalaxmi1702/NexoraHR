from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
from collections import Counter
import os

from app.database import get_db
from app.models import User, Attendance, Leave, Payroll, Document
from app.routers.auth import get_current_user
from app.schemas import AIChatRequest, AIChatResponse

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
gemini_available = False

try:
    if GEMINI_API_KEY:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_available = True
except Exception:
    gemini_available = False


YEARLY_LEAVE_POLICY = {
    "sick": 10,
    "casual": 12,
    "annual": 15,
    "other": 5,
}


def get_leave_policy_response() -> str:
    return (
        "K Labs India Leave Policy:\n\n"
        "1. Sick Leave: 10 days per year\n"
        "   - Used for illness, medical rest, or health emergencies.\n"
        "   - For more than 2 continuous days, HR may request medical proof.\n\n"
        "2. Casual Leave: 12 days per year\n"
        "   - Used for personal work, family needs, or short planned breaks.\n"
        "   - Apply at least 2 days in advance whenever possible.\n\n"
        "3. Annual Leave: 15 days per year\n"
        "   - Used for vacation or planned long leave.\n"
        "   - Apply at least 1 week in advance for better approval planning.\n\n"
        "4. Other Regular Leave: 5 days per year\n"
        "   - Used for special short leave cases approved by HR.\n\n"
        "5. Special Leave Types\n"
        "   - Maternity leave, paternity leave, and unpaid leave are handled separately by HR.\n"
        "   - These are not counted inside normal paid leave balance.\n\n"
        "All leave requests must be submitted through NexoraHR and are subject to HR/admin approval."
    )


def get_sick_leave_draft(user: User) -> str:
    return (
        "Here is a professional sick leave request draft:\n\n"
        "Subject: Sick Leave Request\n\n"
        "Dear HR,\n\n"
        "I am writing to request sick leave as I am currently unwell and need time to rest and recover. "
        "Kindly grant me leave from [Start Date] to [End Date]. I will make sure that any urgent work is "
        "updated or handed over before my leave, if required.\n\n"
        "Please let me know if any medical document is needed.\n\n"
        "Thank you for your understanding.\n\n"
        "Regards,\n"
        f"{user.name}"
    )


def calculate_leave_summary(user: User, db: Session):
    current_year = date.today().year

    approved_leaves = (
        db.query(Leave)
        .filter(
            Leave.user_id == user.id,
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
            days = lv.days or ((lv.end_date - lv.start_date).days + 1)
            used[leave_type] += max(days, 1)

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

    return {
        "total_allowed": total_allowed,
        "total_used": total_used,
        "total_remaining": max(total_allowed - total_used, 0),
        "breakdown": breakdown
    }


def build_employee_context(user: User, db: Session) -> str:
    today = date.today()
    month_start = today.replace(day=1)

    leave_summary = calculate_leave_summary(user, db)

    today_attendance = (
        db.query(Attendance)
        .filter(
            Attendance.user_id == user.id,
            Attendance.date == today
        )
        .first()
    )

    attendance_this_month = (
        db.query(Attendance)
        .filter(
            Attendance.user_id == user.id,
            Attendance.date >= month_start
        )
        .all()
    )

    late_count = len([a for a in attendance_this_month if a.status == "late"])
    present_count = len([a for a in attendance_this_month if a.status in ["present", "checked_out"]])

    latest_payroll = (
        db.query(Payroll)
        .filter(Payroll.user_id == user.id)
        .order_by(Payroll.created_at.desc())
        .first()
    )

    documents = (
        db.query(Document)
        .filter(Document.user_id == user.id)
        .order_by(Document.created_at.desc())
        .all()
    )

    doc_types = [doc.doc_type for doc in documents]
    required_docs = ["resume", "id_proof", "contract"]
    missing_docs = [doc for doc in required_docs if doc not in doc_types]

    return f"""
User Profile:
- Name: {user.name}
- Email: {user.email}
- Role: {user.role}
- Department: {user.department}
- Designation: {user.designation}
- Work mode: {user.work_mode}
- Status: {user.status}

Leave Balance:
- Total allowed regular paid leave: {leave_summary["total_allowed"]}
- Total used: {leave_summary["total_used"]}
- Total remaining: {leave_summary["total_remaining"]}
- Breakdown: {leave_summary["breakdown"]}

Attendance:
- Today checked in: {"yes" if today_attendance and today_attendance.check_in else "no"}
- Today checked out: {"yes" if today_attendance and today_attendance.check_out else "no"}
- This month present/checked-out count: {present_count}
- This month late count: {late_count}

Payroll:
- Latest payroll month: {latest_payroll.month if latest_payroll else "No payroll found"}
- Latest net salary: {latest_payroll.net_salary if latest_payroll else "N/A"}
- Latest payroll status: {latest_payroll.status if latest_payroll else "N/A"}

Documents:
- Uploaded document count: {len(documents)}
- Uploaded document types: {doc_types}
- Missing required documents: {missing_docs}

Company HR Policy:
- Sick leave: 10 days/year
- Casual leave: 12 days/year
- Annual leave: 15 days/year
- Other regular leave: 5 days/year
- Maternity, paternity, and unpaid leave are special HR-approved leave types.
"""


def build_admin_context(user: User, db: Session) -> str:
    today = date.today()
    month_start = today.replace(day=1)
    last_30_days = today - timedelta(days=30)

    total_users = db.query(User).count()
    employees = db.query(User).filter(User.role == "employee").all()
    active_employees = db.query(User).filter(User.role == "employee", User.status == "active").count()

    pending_leaves = db.query(Leave).filter(Leave.status == "pending").count()
    approved_leaves = db.query(Leave).filter(Leave.status == "approved").count()
    rejected_leaves = db.query(Leave).filter(Leave.status == "rejected").count()

    today_attendance = db.query(Attendance).filter(Attendance.date == today).all()
    checked_in_ids = [a.user_id for a in today_attendance]

    absent_today = [
        employee.name
        for employee in employees
        if employee.id not in checked_in_ids and employee.status == "active"
    ]

    monthly_late_records = (
        db.query(Attendance)
        .filter(
            Attendance.date >= month_start,
            Attendance.status == "late"
        )
        .all()
    )

    late_counter = Counter([record.user_id for record in monthly_late_records])
    frequently_late = []

    for user_id, count in late_counter.most_common(5):
        employee = db.query(User).filter(User.id == user_id).first()
        if employee:
            frequently_late.append(f"{employee.name}: {count} late marks")

    employees_missing_docs = []

    for employee in employees:
        doc_count = db.query(Document).filter(Document.user_id == employee.id).count()
        if doc_count == 0:
            employees_missing_docs.append(employee.name)

    recent_attendance = db.query(Attendance).filter(Attendance.date >= last_30_days).all()
    present_count = len([a for a in recent_attendance if a.status in ["present", "checked_out"]])
    total_attendance_records = len(recent_attendance)
    attendance_health = round((present_count / max(total_attendance_records, 1)) * 100, 1)

    return f"""
Admin/HR Profile:
- Name: {user.name}
- Role: {user.role}

Workforce Summary:
- Total users: {total_users}
- Total employees: {len(employees)}
- Active employees: {active_employees}

Leave Summary:
- Pending leave requests: {pending_leaves}
- Approved leave requests: {approved_leaves}
- Rejected leave requests: {rejected_leaves}

Attendance:
- Employees checked in today: {len(checked_in_ids)}
- Employees absent/not checked in today: {absent_today}
- Frequently late employees this month: {frequently_late}
- Attendance health score for last 30 days: {attendance_health}%

Documents:
- Employees with no uploaded documents: {employees_missing_docs}

HR Policy:
- Sick leave: 10 days/year
- Casual leave: 12 days/year
- Annual leave: 15 days/year
- Other regular leave: 5 days/year
- Special leave types are handled by HR separately.
"""


def local_ai_response(message: str, user: User, db: Session) -> str:
    msg = message.lower()

    if "leave policy" in msg or ("explain" in msg and "leave" in msg and "policy" in msg) or msg.strip() == "policy":
        return get_leave_policy_response()

    if "draft" in msg and ("sick leave" in msg or "leave request" in msg or "sick" in msg):
        return get_sick_leave_draft(user)

    if user.role == "employee":
        leave_summary = calculate_leave_summary(user, db)

        if "leave" in msg and ("left" in msg or "balance" in msg or "remaining" in msg):
            b = leave_summary["breakdown"]
            return (
                f"You have {leave_summary['total_remaining']} regular paid leave days remaining "
                f"out of {leave_summary['total_allowed']} for this year.\n\n"
                f"Breakdown:\n"
                f"- Sick: {b['sick']['remaining']} left out of {b['sick']['allowed']}\n"
                f"- Casual: {b['casual']['remaining']} left out of {b['casual']['allowed']}\n"
                f"- Annual: {b['annual']['remaining']} left out of {b['annual']['allowed']}\n"
                f"- Other: {b['other']['remaining']} left out of {b['other']['allowed']}\n\n"
                f"Maternity, paternity, and unpaid leave are handled separately by HR."
            )

        if "document" in msg or "missing" in msg:
            docs = db.query(Document).filter(Document.user_id == user.id).all()
            doc_types = [d.doc_type for d in docs]
            missing = [d for d in ["resume", "id_proof", "contract"] if d not in doc_types]

            if missing:
                return f"You have uploaded {len(docs)} document(s). Missing required documents: {', '.join(missing)}."
            return f"You have uploaded {len(docs)} document(s), and all required document types are present."

        if "salary" in msg or "payroll" in msg or "payslip" in msg:
            payroll = (
                db.query(Payroll)
                .filter(Payroll.user_id == user.id)
                .order_by(Payroll.created_at.desc())
                .first()
            )

            if not payroll:
                return "I could not find any payroll record for you yet."

            return (
                f"Your latest payroll record is for {payroll.month}. "
                f"Net salary: ₹{payroll.net_salary:,.0f}. "
                f"Status: {payroll.status}."
            )

        if "attendance" in msg or "check in" in msg or "checked in" in msg:
            today_record = (
                db.query(Attendance)
                .filter(Attendance.user_id == user.id, Attendance.date == date.today())
                .first()
            )

            if not today_record or not today_record.check_in:
                return "You have not checked in today."

            if today_record.check_out:
                return (
                    f"You checked in at {today_record.check_in.strftime('%H:%M')} "
                    f"and checked out at {today_record.check_out.strftime('%H:%M')}. "
                    f"Work hours: {today_record.work_hours}."
                )

            return f"You checked in at {today_record.check_in.strftime('%H:%M')}. Current status: {today_record.status}."

        return (
            f"Hi {user.name}, I can help with your leave balance, attendance, payroll, "
            f"documents, and HR policies. Try asking: 'How many leaves do I have left?'"
        )

    if user.role in ["admin", "hr"]:
        if "pending leave" in msg or "leave request" in msg:
            pending = db.query(Leave).filter(Leave.status == "pending").count()
            return f"There are {pending} pending leave request(s) waiting for HR action."

        if "missing document" in msg or "document" in msg:
            employees = db.query(User).filter(User.role == "employee").all()
            missing = []

            for employee in employees:
                count = db.query(Document).filter(Document.user_id == employee.id).count()
                if count == 0:
                    missing.append(employee.name)

            if missing:
                return f"Employees with no uploaded documents: {', '.join(missing)}."
            return "All employees have at least one uploaded document."

        if "attendance" in msg or "absent" in msg:
            today = date.today()
            employees = db.query(User).filter(User.role == "employee", User.status == "active").all()
            attendance = db.query(Attendance).filter(Attendance.date == today).all()
            checked_ids = [a.user_id for a in attendance]
            absent = [e.name for e in employees if e.id not in checked_ids]

            if absent:
                return f"Employees not checked in today: {', '.join(absent)}."
            return "All active employees have checked in today."

        if "employee" in msg or "workforce" in msg or "summary" in msg:
            total = db.query(User).filter(User.role == "employee").count()
            active = db.query(User).filter(User.role == "employee", User.status == "active").count()
            return f"Workforce summary: {total} employees in total, {active} currently active."

        return (
            f"Hi {user.name}, I can analyze employee records, pending leaves, attendance, "
            f"documents, and payroll. Try asking: 'Who has missing documents?'"
        )

    return "I am NexoraAI, your HR assistant."


@router.post("/chat", response_model=AIChatResponse)
def chat(
    request: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = request.message.strip()

    if not message:
        return AIChatResponse(
            reply="Please type a question so I can help you.",
            data_used="Validation"
        )

    lower_message = message.lower()

    if "leave policy" in lower_message or ("explain" in lower_message and "leave" in lower_message and "policy" in lower_message):
        return AIChatResponse(
            reply=get_leave_policy_response(),
            data_used="K Labs HR Policy"
        )

    if "draft" in lower_message and ("sick leave" in lower_message or "leave request" in lower_message or "sick" in lower_message):
        return AIChatResponse(
            reply=get_sick_leave_draft(current_user),
            data_used="NexoraAI Draft Assistant"
        )

    if current_user.role in ["admin", "hr"]:
        hr_context = build_admin_context(current_user, db)
    else:
        hr_context = build_employee_context(current_user, db)

    if gemini_available:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""
You are NexoraAI, an intelligent HRMS assistant for K Labs India, Chennai.

Rules:
1. Answer like a professional HR assistant.
2. Use the HRMS database context below.
3. Do not invent employee data.
4. If the answer is not in the context, say what information is missing.
5. If the user is an employee, only answer using their own data.
6. If the user is admin/hr, you may answer using workforce-level context.
7. Keep answers helpful, clear, and conversational.

HRMS DATABASE CONTEXT:
{hr_context}

USER QUESTION:
{message}

FINAL ANSWER:
"""

            response = model.generate_content(prompt)

            return AIChatResponse(
                reply=response.text,
                data_used="Gemini + HRMS Database Context"
            )

        except Exception:
            pass

    return AIChatResponse(
        reply=local_ai_response(message, current_user, db),
        data_used="Local HR Database"
    )