from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from services.habit_tracker import calculate_streak
from database import get_db
from models import Conversation, Submission, Message, User
from dependencies import get_current_user

router = APIRouter()


@router.get("/conversations")
def get_conversations(
    limit: int = Query(20, ge=1, le=100, description="Max conversations to return"),
    offset: int = Query(0, ge=0, description="Number of conversations to skip"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base_query = db.query(Conversation).filter(Conversation.user_id == current_user.id)

    # total_count lets the sidebar show "showing 20 of 143" and know when
    # to stop offering a "load more" button, without a second round trip.
    total_count = base_query.count()

    conversations = (
        base_query
        .order_by(Conversation.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "items": [
            {"id": c.id, "title": c.title, "created_at": c.created_at}
            for c in conversations
        ],
        "total_count": total_count,
        "limit": limit,
        "offset": offset,
    }


@router.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    
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
