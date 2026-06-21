from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json

from database import get_db
from models import Conversation, Message, Submission
from services.ast_analyser import analyse_python
from services.ai_service import get_ai_feedback

router = APIRouter()


class ChatRequest(BaseModel):
    conversation_id: int | None = None
    content: str
    is_code: bool = False


@router.post("/chat")
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    # Step 1: Get or create conversation
    if request.conversation_id:
        conversation = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()
    else:
        conversation = Conversation(title="New Chat")
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Step 2: Save the user's message
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.content
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # Step 3: If it's code, run AST analysis and save submission
    ast_results = {}
    if request.is_code:
        ast_results = analyse_python(request.content)
        submission = Submission(
            message_id=user_message.id,
            code=request.content,
            ast_results=json.dumps(ast_results)
        )
        db.add(submission)
        db.commit()

    # Step 4: Get AI feedback
    ai_response = get_ai_feedback(request.content, ast_results)

    # Step 5: Save assistant's message
    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=ai_response
    )
    db.add(assistant_message)
    db.commit()

    return {
        "conversation_id": conversation.id,
        "response": ai_response,
        "ast_results": ast_results
    }