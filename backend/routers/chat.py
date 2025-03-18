from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
from backend.models import models, schemas
from backend.database import get_db
from backend.routers.auth import get_current_user
from backend.services.chat_service import process_message

router = APIRouter()


@router.post("/sessions", response_model=schemas.ChatSessionResponse)
def create_chat_session(
        session: schemas.ChatSessionCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    # Verify stack exists and belongs to user
    db_stack = db.query(models.Stack).filter(
        models.Stack.id == session.stack_id,
        models.Stack.owner_id == current_user.id
    ).first()

    if db_stack is None:
        raise HTTPException(status_code=404, detail="Stack not found")

    # Create new chat session
    db_session = models.ChatSession(
        stack_id=session.stack_id,
        user_id=current_user.id,
        title=session.title or "New Chat"
    )

    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    # Add system message
    system_message = models.ChatMessage(
        session_id=db_session.id,
        role="system",
        content="I'm your GenAI Stack assistant. How can I help you today?"
    )

    db.add(system_message)
    db.commit()

    # Include messages in response
    db_session.messages = [system_message]

    return db_session


@router.get("/sessions", response_model=List[schemas.ChatSessionResponse])
def list_chat_sessions(
        stack_id: str = None,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.ChatSession).filter(models.ChatSession.user_id == current_user.id)

    if stack_id:
        query = query.filter(models.ChatSession.stack_id == stack_id)

    sessions = query.all()

    # Include messages for each session
    for session in sessions:
        session.messages = db.query(models.ChatMessage).filter(
            models.ChatMessage.session_id == session.id
        ).all()

    return sessions


@router.get("/sessions/{session_id}", response_model=schemas.ChatSessionResponse)
def get_chat_session(
        session_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id
    ).first()

    if db_session is None:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # Include messages
    db_session.messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.session_id == session_id
    ).all()

    return db_session


@router.post("/message", response_model=schemas.ChatResponse)
async def send_message(
        chat_request: schemas.ChatRequest,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    # Verify chat session exists and belongs to user
    db_session = db.query(models.ChatSession).filter(
        models.ChatSession.id == chat_request.session_id,
        models.ChatSession.user_id == current_user.id
    ).first()

    if db_session is None:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # Get stack configuration
    db_stack = db.query(models.Stack).filter(models.Stack.id == db_session.stack_id).first()
    if db_stack is None:
        raise HTTPException(status_code=404, detail="Stack not found")

    # Get stack configuration
    stack_config = json.loads(db_stack.nodes)

    # Add user message to database
    user_message = models.ChatMessage(
        session_id=chat_request.session_id,
        role="user",
        content=chat_request.message
    )

    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # Process message with stack configuration
    # This will be handled asynchronously
    response_content, thinking = await process_message(
        chat_request.message,
        stack_config,
        db_session.id,
        db
    )

    # Add assistant response to database
    assistant_message = models.ChatMessage(
        session_id=chat_request.session_id,
        role="assistant",
        content=response_content
    )

    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    return {
        "message": assistant_message,
        "thinking": thinking
    }


@router.delete("/sessions/{session_id}")
def delete_chat_session(
        session_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id
    ).first()

    if db_session is None:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # Delete all messages in the session
    db.query(models.ChatMessage).filter(
        models.ChatMessage.session_id == session_id
    ).delete()

    # Delete the session
    db.delete(db_session)
    db.commit()

    return {"detail": "Chat session deleted successfully"}

