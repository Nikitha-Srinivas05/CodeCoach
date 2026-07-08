from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from services.habit_tracker import calculate_streak
from database import get_db
from models import Conversation, Submission, Message, User
from dependencies import get_current_user

router = APIRouter()


@router.get("/conversations")
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
        .all()
    )
    return [
        {"id": c.id, "title": c.title, "created_at": c.created_at}
        for c in conversations
    ]


@router.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Confirm the conversation actually belongs to this user before returning
    # its messages — otherwise user A could read user B's messages just by
    # guessing a conversation_id.
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found.")

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
def get_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    submissions = (
        db.query(Submission)
        .join(Message, Submission.message_id == Message.id)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Submission.created_at.desc())
        .all()
    )

    return {
        "current_streak": calculate_streak(submissions),
        "total_submissions": len(submissions),
    }


@router.get("/progress/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_conversations = (
        db.query(Conversation).filter(Conversation.user_id == current_user.id).count()
    )
    total_submissions = (
        db.query(Submission)
        .join(Message, Submission.message_id == Message.id)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(Conversation.user_id == current_user.id)
        .count()
    )

    return {
        "total_conversations": total_conversations,
        "total_submissions": total_submissions,
    }
