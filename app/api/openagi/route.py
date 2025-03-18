from fastapi import APIRouter, Depends, HTTPException

HTTPException
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any
from sqlalchemy.orm import Session
from logging_config import logger

from database import get_db
from models import User
from openagi_integration import OpenAGI

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from app import get_current_user as app_get_current_user
    return await app_get_current_user(token, db)

@router.post("/openagi")
async def process_openagi_request(
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    try:
        # Extract config and input from request
        config = request_data.get("config", {})
        input_text = request_data.get("input", "")
        history = request_data.get("history", [])
        
        # Initialize OpenAGI with the provided configuration
        openagi = OpenAGI(config)
        
        # Process the input
        response = openagi.process(input_text, history)
        
        return {
            "response": response,
            "config": config
        }
    except Exception as e:
        logger.error(f"Error processing OpenAGI request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process OpenAGI request: {str(e)}")

