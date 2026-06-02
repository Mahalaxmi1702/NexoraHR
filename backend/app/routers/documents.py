from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path
import shutil
import uuid
import mimetypes

from app.database import get_db
from app.models import User, Document
from app.schemas import DocumentOut
from app.routers.auth import get_current_user

router = APIRouter()

UPLOAD_DIR = Path("uploads/documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def can_access_document(current_user: User, document: Document) -> bool:
    if current_user.role in ["admin", "hr"]:
        return True

    return document.user_id == current_user.id


@router.get("/", response_model=List[DocumentOut])
def get_documents(
    user_id: Optional[int] = None,
    doc_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Document)

    if current_user.role == "employee":
        query = query.filter(Document.user_id == current_user.id)
    elif user_id:
        query = query.filter(Document.user_id == user_id)

    if doc_type:
        query = query.filter(Document.doc_type == doc_type)

    if search:
        query = query.filter(Document.title.ilike(f"%{search}%"))

    return query.order_by(Document.created_at.desc()).all()


@router.get("/my", response_model=List[DocumentOut])
def get_my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )


@router.get("/employee/{user_id}", response_model=List[DocumentOut])
def get_employee_documents(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "hr"] and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return (
        db.query(Document)
        .filter(Document.user_id == user_id)
        .order_by(Document.created_at.desc())
        .all()
    )


@router.post("/upload", response_model=DocumentOut)
def upload_document(
    user_id: int = Form(...),
    title: str = Form(...),
    doc_type: str = Form("other"),
    notes: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "employee" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Can only upload your own documents")

    target_user = db.query(User).filter(User.id == user_id).first()

    if not target_user:
        raise HTTPException(status_code=404, detail="Employee not found")

    original_name = file.filename or "document"
    safe_name = original_name.replace(" ", "_")
    unique_name = f"{user_id}_{uuid.uuid4().hex}_{safe_name}"
    file_path = UPLOAD_DIR / unique_name

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc = Document(
        user_id=user_id,
        title=title,
        doc_type=doc_type,
        file_path=str(file_path),
        notes=notes,
        uploaded_by=current_user.id
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)

    return doc


@router.get("/{doc_id}", response_model=DocumentOut)
def get_document_details(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not can_access_document(current_user, doc):
        raise HTTPException(status_code=403, detail="Access denied")

    return doc


@router.get("/{doc_id}/download")
def download_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not can_access_document(current_user, doc):
        raise HTTPException(status_code=403, detail="Access denied")

    if not doc.file_path:
        raise HTTPException(status_code=404, detail="No file path saved for this document")

    path = Path(doc.file_path)

    if not path.exists():
        raise HTTPException(status_code=404, detail="File missing on server")

    media_type, _ = mimetypes.guess_type(str(path))

    return FileResponse(
        path=str(path),
        filename=path.name,
        media_type=media_type or "application/octet-stream"
    )


@router.delete("/{doc_id}")
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not can_access_document(current_user, doc):
        raise HTTPException(status_code=403, detail="Access denied")

    if doc.file_path:
        path = Path(doc.file_path)
        if path.exists():
            path.unlink()

    db.delete(doc)
    db.commit()

    return {"message": "Document deleted successfully"}