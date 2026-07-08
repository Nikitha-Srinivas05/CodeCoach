import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator

from database import get_db
from models import Conversation, Message, Submission, User
from dependencies import get_current_user
from services.ast_analyser import analyse_python
from services.ai_service import get_ai_feedback, AIServiceError

logger = logging.getLogger("codecoach")
router = APIRouter()

MAX_CODE_LENGTH = 6000


class ChatRequest(BaseModel):
    conversation_id: int | None = None
    content: str
    is_code: bool = False

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Message content cannot be empty.")
        if len(v) > MAX_CODE_LENGTH:
            raise ValueError(
                f"Submission is too long ({len(v)} chars). "
                f"Please keep it under {MAX_CODE_LENGTH} characters."
            )
        return v


@router.post("/chat")
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Step 1: Get or create conversation, scoped to the logged-in user
    if request.conversation_id:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == request.conversation_id,
                Conversation.user_id == current_user.id,
            )
            .first()
        )
        if conversation is None:
            raise HTTPException(status_code=404, detail="Conversation not found.")
    else:
        conversation = Conversation(title="New Chat", user_id=current_user.id)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Step 2: Save the user's message
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.content,
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # Step 3: If it's code, run AST analysis and save submission.
    ast_results = {}
    if request.is_code:
        try:
            ast_results = analyse_python(request.content)
            submission = Submission(
                message_id=user_message.id,
                code=request.content,
                ast_results=json.dumps(ast_results),
            )
            db.add(submission)
            db.commit()
        except Exception:
            logger.exception("AST analysis failed for message %s", user_message.id)
            db.rollback()
            ast_results = {"error": "Static analysis failed for this submission."}

    # Step 4: Get AI feedback
    try:
        ai_response = get_ai_feedback(request.content, ast_results)
    except AIServiceError:
        logger.exception("AI feedback failed for message %s", user_message.id)
        ai_response = (
            "I couldn't generate feedback right now — the AI service may be "
            "temporarily unavailable. Please try sending your code again in "
            "a moment."
        )

    # Step 5: Save assistant's message
    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=ai_response,
    )
    db.add(assistant_message)
    db.commit()

    return {
        "conversation_id": conversation.id,
        "response": ai_response,
        "ast_results": ast_results,
    }
