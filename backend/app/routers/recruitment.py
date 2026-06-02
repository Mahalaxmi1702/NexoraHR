from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from io import BytesIO
import re
import uuid
from datetime import datetime

from app.database import get_db
from app.models import User
from app.routers.auth import get_current_user

router = APIRouter()

# In-memory candidate store for demo/project use.
# Later this can be converted to a database table.
CANDIDATES = []

ROLE_SKILLS = {
    "AI Engineer": [
        "python", "machine learning", "deep learning", "nlp", "llm",
        "langchain", "rag", "vector database", "faiss", "tensorflow",
        "pytorch", "scikit-learn", "opencv", "api", "git", "github"
    ],
    "ML Engineer": [
        "python", "machine learning", "deep learning", "tensorflow",
        "pytorch", "scikit-learn", "numpy", "pandas", "opencv",
        "model training", "data preprocessing", "git", "github"
    ],
    "Frontend Developer": [
        "html", "css", "javascript", "typescript", "react", "redux",
        "tailwind", "bootstrap", "vite", "next.js", "api", "figma",
        "responsive design"
    ],
    "Backend Developer": [
        "python", "fastapi", "django", "flask", "node.js", "express",
        "sql", "postgresql", "mysql", "mongodb", "rest api", "api",
        "docker", "authentication", "jwt"
    ],
    "Full Stack Developer": [
        "html", "css", "javascript", "typescript", "react", "node.js",
        "python", "fastapi", "sql", "postgresql", "mongodb", "rest api",
        "tailwind", "git", "github"
    ],
    "Data Analyst": [
        "python", "sql", "excel", "power bi", "tableau", "pandas",
        "numpy", "statistics", "data visualization", "dashboard",
        "data cleaning"
    ],
    "HR Executive": [
        "recruitment", "screening", "onboarding", "payroll", "attendance",
        "employee engagement", "hrms", "communication", "interview",
        "documentation"
    ],
}

EXTRA_SKILLS = [
    "java", "c++", "c", "git", "github", "linux", "aws", "azure",
    "communication", "leadership", "problem solving", "teamwork",
    "oops", "dsa", "data structures", "algorithms", "react.js",
    "fastapi", "sqlalchemy", "chroma", "chromadb", "gemini",
    "openai", "semantic search", "embeddings", "resume analyzer",
    "speech-to-text", "text-to-speech"
]

COMMON_SKILLS = sorted(set(
    skill for skills in ROLE_SKILLS.values() for skill in skills
).union(EXTRA_SKILLS))


def require_admin_hr(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Admin or HR access required")
    return current_user


def extract_text_from_pdf(content: bytes) -> str:
    try:
        from pypdf import PdfReader
    except Exception:
        raise HTTPException(status_code=500, detail="pypdf not installed. Run: pip install pypdf")

    reader = PdfReader(BytesIO(content))
    parts = []

    for page in reader.pages:
        parts.append(page.extract_text() or "")

    return "\n".join(parts)


def extract_text_from_docx(content: bytes) -> str:
    try:
        from docx import Document
    except Exception:
        raise HTTPException(status_code=500, detail="python-docx not installed. Run: pip install python-docx")

    document = Document(BytesIO(content))
    return "\n".join([p.text for p in document.paragraphs])


def extract_resume_text(filename: str, content: bytes) -> str:
    lower = filename.lower()

    if lower.endswith(".pdf"):
        return extract_text_from_pdf(content)

    if lower.endswith(".docx"):
        return extract_text_from_docx(content)

    if lower.endswith(".txt"):
        return content.decode("utf-8", errors="ignore")

    raise HTTPException(
        status_code=400,
        detail=f"Unsupported file type for {filename}. Use PDF, DOCX, or TXT."
    )


def normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def extract_email(text: str) -> str:
    match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
    return match.group(0) if match else ""


def extract_phone(text: str) -> str:
    match = re.search(r"(\+91[\s-]?)?[6-9]\d{9}", text)
    return match.group(0) if match else ""


def is_location_line(line: str) -> bool:
    location_words = [
        "tamil nadu", "india", "chennai", "bangalore", "bengaluru",
        "coimbatore", "hosur", "vellore", "salem", "kerala",
        "karnataka", "andhra", "hyderabad", "mumbai", "delhi",
        "pune", "address", "location"
    ]
    lower = line.lower()
    return any(word in lower for word in location_words)


def is_contact_or_link_line(line: str) -> bool:
    lower = line.lower()
    bad_words = [
        "email", "phone", "mobile", "linkedin", "github", "http",
        "www", "@", "portfolio", "contact", "resume", "curriculum vitae",
        "cv"
    ]
    return any(word in lower for word in bad_words)


def is_title_or_summary_line(line: str) -> bool:
    lower = line.lower()
    title_words = [
        "student", "engineer", "developer", "enthusiast", "intern",
        "professional summary", "summary", "career objective",
        "b.tech", "computer science", "artificial intelligence",
        "machine learning", "software development"
    ]
    return any(word in lower for word in title_words)


def looks_like_person_name(line: str) -> bool:
    clean = re.sub(r"[^a-zA-Z\s.]", "", line)
    clean = normalize_spaces(clean)

    if not clean:
        return False

    if is_location_line(clean):
        return False

    if is_contact_or_link_line(clean):
        return False

    if is_title_or_summary_line(clean):
        return False

    words = clean.split()

    # Accept names like "R.MAHALAXMI", "R MAHALAXMI", "Mahalaxmi Rajendran"
    if len(words) < 1 or len(words) > 4:
        return False

    # Reject lines that are too long to be a name
    if len(clean) > 45:
        return False

    # Must contain letters
    if not re.search(r"[A-Za-z]", clean):
        return False

    # Strong pattern: initials + name
    if re.match(r"^[A-Za-z]\.?\s?[A-Za-z]{2,}$", clean):
        return True

    # Normal 2-4 word names
    if all(re.match(r"^[A-Za-z.]+$", word) for word in words):
        return True

    return False


def fallback_name_from_email_or_filename(email: str, filename: str) -> str:
    if email:
        prefix = email.split("@")[0]
        prefix = re.sub(r"[^a-zA-Z]+", " ", prefix)
        return normalize_spaces(prefix).title() or "Candidate"

    fallback = filename.rsplit(".", 1)[0]
    fallback = fallback.replace("_", " ").replace("-", " ")
    fallback = re.sub(r"resume|cv|profile", "", fallback, flags=re.IGNORECASE)
    fallback = normalize_spaces(fallback)
    return fallback.title() if fallback else "Candidate"


def extract_candidate_name(text: str, filename: str = "resume") -> str:
    lines = [normalize_spaces(line) for line in text.splitlines() if normalize_spaces(line)]

    # Most resumes keep name in first 10 lines.
    for line in lines[:12]:
        clean = re.sub(r"^[^\wA-Za-z]+", "", line)
        clean = normalize_spaces(clean)

        if looks_like_person_name(clean):
            return clean

    # Second pass: check entire document lightly
    for line in lines[:30]:
        clean = normalize_spaces(line)
        if looks_like_person_name(clean):
            return clean

    return fallback_name_from_email_or_filename(extract_email(text), filename)


def extract_skills(text: str) -> List[str]:
    lower = text.lower()
    found = []

    aliases = {
        "react": ["react", "react.js", "reactjs"],
        "node.js": ["node.js", "nodejs", "node"],
        "rest api": ["rest api", "restful api", "api"],
        "scikit-learn": ["scikit-learn", "sklearn"],
        "vector database": ["vector database", "vector db", "chromadb", "chroma"],
        "rag": ["rag", "retrieval augmented generation"],
        "llm": ["llm", "large language model", "large language models"],
        "opencv": ["opencv", "cv2"],
        "machine learning": ["machine learning", "ml"],
        "deep learning": ["deep learning", "dl"],
        "data structures": ["data structures"],
        "c++": ["c++", "cpp"],
    }

    for skill in COMMON_SKILLS:
        search_terms = aliases.get(skill, [skill])
        if any(term in lower for term in search_terms):
            found.append(skill)

    return sorted(set(found))


def get_role_required_skills(role: str, job_description: Optional[str] = None) -> List[str]:
    role_skills = ROLE_SKILLS.get(role, [])

    if not job_description:
        return role_skills

    jd_skills = extract_skills(job_description)
    merged = sorted(set(role_skills).union(jd_skills))
    return merged


def detect_best_role(skills: List[str], text: str) -> str:
    lower = text.lower()
    best_role = "AI Engineer"
    best_score = 0

    for role, role_skills in ROLE_SKILLS.items():
        score = 0

        for skill in role_skills:
            if skill in skills or skill in lower:
                score += 1

        if role.lower() in lower:
            score += 3

        if score > best_score:
            best_score = score
            best_role = role

    return best_role


def calculate_ats_score(
    skills: List[str],
    role: str,
    text: str,
    job_description: Optional[str] = None
) -> int:
    required_skills = get_role_required_skills(role, job_description)
    lower = text.lower()

    if not required_skills:
        return max(35, min(85, 35 + len(skills) * 4))

    matched = [skill for skill in required_skills if skill in skills or skill in lower]

    # 45% skills match
    skill_score = (len(matched) / max(len(required_skills), 1)) * 45

    # 20% project relevance
    project_terms = [
        "project", "built", "developed", "implemented", "created",
        "integrated", "designed", "semantic search", "ai", "dashboard",
        "assistant", "analyzer", "system"
    ]
    project_score = min(20, sum(2 for term in project_terms if term in lower))

    # 10% education relevance
    education_terms = [
        "b.tech", "btech", "computer science", "cse",
        "artificial intelligence", "machine learning", "ai", "ml"
    ]
    education_score = min(10, sum(2 for term in education_terms if term in lower))

    # 10% experience/internship relevance
    experience_terms = [
        "internship", "intern", "experience", "hackathon",
        "achievement", "award", "certification", "training"
    ]
    experience_score = min(10, sum(2 for term in experience_terms if term in lower))

    # 10% contact/profile completeness
    contact_score = 0
    if extract_email(text):
        contact_score += 3
    if extract_phone(text):
        contact_score += 3
    if "linkedin" in lower:
        contact_score += 2
    if "github" in lower:
        contact_score += 2

    # 5% formatting/readability
    formatting_terms = [
        "professional summary", "skills", "projects", "education",
        "experience", "certifications"
    ]
    formatting_score = min(5, sum(1 for term in formatting_terms if term in lower))

    total = round(
        skill_score +
        project_score +
        education_score +
        experience_score +
        contact_score +
        formatting_score
    )

    return max(20, min(total, 98))


def get_matched_and_missing_skills(
    skills: List[str],
    role: str,
    job_description: Optional[str] = None
):
    required_skills = get_role_required_skills(role, job_description)

    matched = [skill for skill in required_skills if skill in skills]
    missing = [skill for skill in required_skills if skill not in skills]

    return matched, missing


def classify_resume_status(score: int) -> str:
    if score >= 75:
        return "Strong Match"
    if score >= 55:
        return "Moderate Match"
    return "Weak Match"


def get_recommendation(score: int) -> str:
    if score >= 75:
        return "Shortlist"
    if score >= 55:
        return "Review"
    return "Reject"


def generate_resume_summary(
    candidate_name: str,
    role: str,
    score: int,
    matched_skills: List[str],
    missing_skills: List[str],
    skills: List[str]
) -> str:
    match_level = classify_resume_status(score)

    matched_text = ", ".join(matched_skills[:6]) if matched_skills else "limited required skills"
    missing_text = ", ".join(missing_skills[:5]) if missing_skills else "no major required skills"

    return (
        f"{candidate_name} is a {match_level.lower()} for the {role} role with an ATS score of {score}%. "
        f"The resume matches skills such as {matched_text}. "
        f"Missing or weaker areas include {missing_text}. "
        f"Total extracted skills: {len(skills)}."
    )


@router.get("/roles")
def get_roles(current_user: User = Depends(require_admin_hr)):
    return {
        "roles": list(ROLE_SKILLS.keys()),
        "role_skills": ROLE_SKILLS
    }


@router.get("/candidates")
def get_candidates(
    role: Optional[str] = None,
    skill: Optional[str] = None,
    min_score: Optional[int] = None,
    status: Optional[str] = None,
    sort_by: str = "ats_score",
    current_user: User = Depends(require_admin_hr)
):
    data = CANDIDATES.copy()

    if role:
        data = [c for c in data if c["role"].lower() == role.lower()]

    if skill:
        data = [c for c in data if skill.lower() in [s.lower() for s in c["skills"]]]

    if min_score is not None:
        data = [c for c in data if c["ats_score"] >= min_score]

    if status:
        data = [c for c in data if c["status"].lower() == status.lower()]

    if sort_by == "ats_score":
        data = sorted(data, key=lambda x: x["ats_score"], reverse=True)
    elif sort_by == "name":
        data = sorted(data, key=lambda x: x["name"])
    elif sort_by == "role":
        data = sorted(data, key=lambda x: x["role"])

    return data


@router.post("/upload-resumes")
def upload_resumes(
    files: List[UploadFile] = File(...),
    target_role: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
    current_user: User = Depends(require_admin_hr)
):
    if not files:
        raise HTTPException(status_code=400, detail="Please upload at least one resume")

    selected_role = role or target_role

    processed = []
    failed = []

    for file in files:
        try:
            content = file.file.read()

            if not content:
                failed.append({
                    "filename": file.filename,
                    "reason": "Empty file"
                })
                continue

            text = extract_resume_text(file.filename or "resume", content)
            skills = extract_skills(text)

            final_role = selected_role if selected_role else detect_best_role(skills, text)

            if final_role not in ROLE_SKILLS:
                final_role = "AI Engineer"

            ats_score = calculate_ats_score(
                skills=skills,
                role=final_role,
                text=text,
                job_description=job_description
            )

            matched_skills, missing_skills = get_matched_and_missing_skills(
                skills=skills,
                role=final_role,
                job_description=job_description
            )

            candidate_name = extract_candidate_name(text, file.filename or "Candidate")
            email = extract_email(text)
            phone = extract_phone(text)
            match_level = classify_resume_status(ats_score)
            recommendation = get_recommendation(ats_score)

            candidate = {
                "id": str(uuid.uuid4()),

                # Frontend-friendly fields
                "candidate_name": candidate_name,
                "name": candidate_name,
                "email": email,
                "phone": phone,
                "role": final_role,
                "selected_role": final_role,

                # ATS fields
                "ats_score": ats_score,
                "match_percentage": ats_score,
                "match_level": match_level,
                "extracted_skills": skills,
                "skills": skills,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "recommendation": recommendation,

                # Resume metadata
                "resume_name": file.filename,
                "status": "New",
                "summary": generate_resume_summary(
                    candidate_name=candidate_name,
                    role=final_role,
                    score=ats_score,
                    matched_skills=matched_skills,
                    missing_skills=missing_skills,
                    skills=skills
                ),
                "uploaded_at": datetime.utcnow().isoformat(),
            }

            CANDIDATES.append(candidate)
            processed.append(candidate)

        except Exception as e:
            failed.append({
                "filename": file.filename,
                "reason": str(e)
            })

    return {
        "message": "Resume processing completed",
        "processed_count": len(processed),
        "failed_count": len(failed),
        "processed": processed,
        "failed": failed
    }


@router.post("/analyze-resume")
def analyze_resume(
    file: UploadFile = File(...),
    role: Optional[str] = Form(None),
    target_role: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
    current_user: User = Depends(require_admin_hr)
):
    result = upload_resumes(
        files=[file],
        target_role=target_role,
        role=role,
        job_description=job_description,
        current_user=current_user
    )

    if result["processed_count"] == 0:
        raise HTTPException(status_code=400, detail=result["failed"])

    return result["processed"][0]


@router.patch("/candidates/{candidate_id}/status")
def update_candidate_status(
    candidate_id: str,
    status: str = Form(...),
    current_user: User = Depends(require_admin_hr)
):
    allowed = ["New", "Shortlisted", "Called", "Rejected"]

    if status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")

    for candidate in CANDIDATES:
        if candidate["id"] == candidate_id:
            candidate["status"] = status
            return candidate

    raise HTTPException(status_code=404, detail="Candidate not found")


@router.delete("/candidates/{candidate_id}")
def delete_candidate(
    candidate_id: str,
    current_user: User = Depends(require_admin_hr)
):
    global CANDIDATES

    before = len(CANDIDATES)
    CANDIDATES = [candidate for candidate in CANDIDATES if candidate["id"] != candidate_id]

    if len(CANDIDATES) == before:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return {"message": "Candidate deleted"}