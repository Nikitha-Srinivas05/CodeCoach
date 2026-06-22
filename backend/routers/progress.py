from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from database import get_db
from models import Conversation, Submission, Message

router = APIRouter()


@router.get("/conversations")
def get_conversations(db: Session = Depends(get_db)):
    conversations = db.query(Conversation).order_by(Conversation.created_at.desc()).all()
    return [
        {"id": c.id, "title": c.title, "created_at": c.created_at}
        for c in conversations
    ]


@router.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(conversation_id: int, db: Session = Depends(get_db)):
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return [
        {"id": m.id, "role": m.role, "content": m.content, "created_at": m.created_at}
        for m in messages
    ]


@router.get("/progress/streak")
def get_streak(db: Session = Depends(get_db)):
    submissions = db.query(Submission).order_by(Submission.created_at.desc()).all()

    if not submissions:
        return {"current_streak": 0, "total_submissions": 0}

    submission_dates = sorted(
        {s.created_at.date() for s in submissions}, reverse=True
    )

    today = datetime.now().date()
    streak = 0
    expected_date = today

    for date in submission_dates:
        if date == expected_date:
            streak += 1
            expected_date -= timedelta(days=1)
        elif date == expected_date + timedelta(days=1):
            continue
        else:
            break

    return {
        "current_streak": streak,
        "total_submissions": len(submissions)
    }


@router.get("/progress/stats")
def get_stats(db: Session = Depends(get_db)):
    total_conversations = db.query(Conversation).count()
    total_submissions = db.query(Submission).count()

    return {
        "total_conversations": total_conversations,
        "total_submissions": total_submissions
    }