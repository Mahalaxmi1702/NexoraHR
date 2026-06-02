from app.database import SessionLocal
from app.models import User, Attendance, Leave, Payroll, Document
from app.auth import get_password_hash
from datetime import datetime, date, timedelta
import random


DEMO_USERS = [
    {
        "email": "admin@nexorahr.com",
        "password": "Admin@123",
        "name": "Admin User",
        "role": "admin",
        "department": "Administration",
        "designation": "System Administrator",
        "employee_id": "ADM001",
        "status": "active",
        "work_mode": "onsite",
        "phone": "+91-9000000001",
    },
    {
        "email": "hr@nexorahr.com",
        "password": "Hr@123",
        "name": "HR Manager",
        "role": "hr",
        "department": "HR",
        "designation": "HR Manager",
        "employee_id": "HR001",
        "status": "active",
        "work_mode": "hybrid",
        "phone": "+91-9000000002",
    },
    {
        "email": "employee@nexorahr.com",
        "password": "Employee@123",
        "name": "Rahul Sharma",
        "role": "employee",
        "department": "Engineering",
        "designation": "Software Engineer",
        "employee_id": "EMP001",
        "status": "active",
        "work_mode": "remote",
        "phone": "+91-9000000003",
    },
]


EXTRA_EMPLOYEES = [
    {
        "email": "priya@nexorahr.com",
        "password": "employee123",
        "name": "Priya Patel",
        "role": "employee",
        "department": "Design",
        "designation": "UI/UX Designer",
        "employee_id": "EMP002",
        "status": "active",
        "work_mode": "onsite",
    },
    {
        "email": "arjun@nexorahr.com",
        "password": "employee123",
        "name": "Arjun Kumar",
        "role": "employee",
        "department": "Engineering",
        "designation": "Senior Developer",
        "employee_id": "EMP003",
        "status": "active",
        "work_mode": "hybrid",
    },
    {
        "email": "sneha@nexorahr.com",
        "password": "employee123",
        "name": "Sneha Reddy",
        "role": "employee",
        "department": "Marketing",
        "designation": "Marketing Lead",
        "employee_id": "EMP004",
        "status": "active",
        "work_mode": "onsite",
    },
    {
        "email": "vikram@nexorahr.com",
        "password": "employee123",
        "name": "Vikram Iyer",
        "role": "manager",
        "department": "Engineering",
        "designation": "Engineering Manager",
        "employee_id": "MGR001",
        "status": "active",
        "work_mode": "hybrid",
    },
]


def create_or_update_user(db, user_data):
    user = db.query(User).filter(User.email == user_data["email"]).first()

    if user:
        user.password_hash = get_password_hash(user_data["password"])
        user.name = user_data["name"]
        user.role = user_data["role"]
        user.department = user_data["department"]
        user.designation = user_data["designation"]
        user.employee_id = user_data["employee_id"]
        user.status = user_data["status"]
        user.work_mode = user_data["work_mode"]
        user.phone = user_data.get("phone", user.phone or "")
        return user

    user = User(
        email=user_data["email"],
        password_hash=get_password_hash(user_data["password"]),
        name=user_data["name"],
        role=user_data["role"],
        department=user_data["department"],
        designation=user_data["designation"],
        employee_id=user_data["employee_id"],
        status=user_data["status"],
        work_mode=user_data["work_mode"],
        joining_date=date(2023, random.randint(1, 12), random.randint(1, 28)),
        phone=user_data.get("phone", f"+91-{random.randint(7000000000, 9999999999)}"),
    )
    db.add(user)
    db.flush()
    return user


def seed_attendance_if_empty(db, users):
    existing = db.query(Attendance).first()
    if existing:
        return

    for user in users:
        if user.role == "admin":
            continue

        for i in range(30):
            d = date.today() - timedelta(days=i)

            if d.weekday() >= 5:
                continue

            status = random.choice(["present", "present", "present", "late", "absent"])
            check_in = None
            check_out = None
            work_hours = 0.0

            if status != "absent":
                hour = 9 if status == "present" else random.randint(9, 11)
                check_in = datetime(d.year, d.month, d.day, hour, random.randint(0, 30), 0)
                check_out = datetime(d.year, d.month, d.day, random.randint(17, 19), random.randint(0, 59), 0)
                work_hours = round((check_out - check_in).seconds / 3600, 1)

            att = Attendance(
                user_id=user.id,
                date=d,
                check_in=check_in,
                check_out=check_out,
                work_mode=user.work_mode,
                work_hours=work_hours,
                status=status,
                location="Office" if user.work_mode == "onsite" else "Home",
            )
            db.add(att)


def seed_leaves_if_empty(db, users):
    existing = db.query(Leave).first()
    if existing:
        return

    leave_types = ["sick", "casual", "annual"]

    for user in users:
        if user.role == "admin":
            continue

        for _ in range(random.randint(1, 3)):
            start = date.today() - timedelta(days=random.randint(5, 60))
            end = start + timedelta(days=random.randint(1, 3))
            status = random.choice(["approved", "approved", "pending", "rejected"])

            lv = Leave(
                user_id=user.id,
                leave_type=random.choice(leave_types),
                start_date=start,
                end_date=end,
                reason=f"Personal {random.choice(['work', 'family', 'health'])} reason",
                status=status,
                admin_reply="Approved" if status == "approved" else ("Rejected - insufficient balance" if status == "rejected" else ""),
                days=(end - start).days + 1,
            )
            db.add(lv)


def seed_payroll_if_empty(db, users):
    existing = db.query(Payroll).first()
    if existing:
        return

    months = ["January 2026", "February 2026", "March 2026", "April 2026", "May 2026"]

    for user in users:
        if user.role == "admin":
            continue

        for month in months:
            basic = random.randint(40000, 80000)
            allowances = basic * 0.2
            deductions = basic * 0.1

            pr = Payroll(
                user_id=user.id,
                month=month,
                period=month,
                basic_salary=basic,
                allowances=allowances,
                deductions=deductions,
                net_salary=basic + allowances - deductions,
                status="paid",
                pay_date=date(2026, random.randint(1, 5), random.randint(1, 28)),
            )
            db.add(pr)


def seed_documents_if_empty(db, users):
    existing = db.query(Document).first()
    if existing:
        return

    doc_types = ["resume", "id_proof"]

    admin_user = db.query(User).filter(User.email == "admin@nexorahr.com").first()
    uploaded_by = admin_user.id if admin_user else 1

    for user in users:
        for doc_type in doc_types:
            doc = Document(
                user_id=user.id,
                title=f"{user.name} {doc_type.replace('_', ' ').title()}",
                doc_type=doc_type,
                file_path=f"/uploads/{user.employee_id}_{doc_type}.pdf",
                notes=f"Uploaded {doc_type} for {user.name}",
                uploaded_by=uploaded_by,
            )
            db.add(doc)


def seed_data():
    db = SessionLocal()

    try:
        created_users = []

        for user_data in DEMO_USERS + EXTRA_EMPLOYEES:
            user = create_or_update_user(db, user_data)
            created_users.append(user)

        db.commit()

        seed_attendance_if_empty(db, created_users)
        seed_leaves_if_empty(db, created_users)
        seed_payroll_if_empty(db, created_users)
        seed_documents_if_empty(db, created_users)

        db.commit()

        print("Seed data checked/updated successfully!")
        print("Demo Admin: admin@nexorahr.com / Admin@123")
        print("Demo HR: hr@nexorahr.com / Hr@123")
        print("Demo Employee: employee@nexorahr.com / Employee@123")

    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")

    finally:
        db.close()