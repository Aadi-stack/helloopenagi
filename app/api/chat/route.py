from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from logging_config import logger

from database import get_db
from models import User, Stack
from openagi_integration import OpenAGI
import json

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from app import get_current_user as app_get_current_user
    return await app_get_current_user(token, db)

@router.post("/chat")
async def process_chat(
    chat_request: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Extract data from request
        stack_id = chat_request.get("stack_id")
        message = chat_request.get("message")
        history = chat_request.get("history", [])
        
        logger.info(f"Processing chat message for stack {stack_id}", extra={"user_id": current_user.id})
        
        # Verify stack belongs to user
        if stack_id != "temp-workflow":
            stack = db.query(Stack).filter(Stack.id == stack_id, Stack.user_id == current_user.id).first()
            if not stack:
                raise HTTPException(status_code=404, detail="Stack not found")
            
            # Parse nodes and edges from JSON
            nodes = json.loads(stack.nodes)
            edges = json.loads(stack.edges)
            
            # Extract configuration for OpenAGI
            config = extract_openagi_config(nodes, edges)
        else:
            # Use default configuration for temp workflow
            config = {
                "llm": {
                    "type": "openai-gpt-4",
                    "model": "gpt-4",
                    "temperature": 0.7
                },
                "agent": {
                    "type": "conversational-agent",
                    "system_prompt": "You are a helpful assistant."
                },
                "tools": []
            }
        
        # Initialize OpenAGI with the extracted configuration
        openagi = OpenAGI(config)
        
        # Process the message
        response = openagi.process(message, history)
        
        return {
            "response": response,
            "stack_id": stack_id
        }
    except Exception as e:
        logger.error(f"Error processing chat message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process chat message: {str(e)}")

def extract_openagi_config(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Extract OpenAGI configuration from nodes and edges"""
    config = {
        "llm": {},
        "agent": {},
        "tools": []
    }
    
    # Extract LLM configuration
    llm_nodes = [node for node in nodes if node.get("type") == "llmNode"]
    if llm_nodes:
        llm_node = llm_nodes[0]
        llm_data = llm_node.get("data", {})
        
        config["llm"] = {
            "type": llm_data.get("id", "openai-gpt-4"),
            "model": llm_data.get("model"),
            "model_id": llm_data.get("modelId"),
            "api_key": llm_data.get("apiKey"),
            "huggingface_token": llm_data.get("huggingFaceToken"),
            "temperature": llm_data.get("temperature", 0.7),
            "max_tokens": llm_data.get("maxTokens", 1000)
        }
    
    # Extract agent configuration
    agent_nodes = [node for node in nodes if node.get("type") == "agentNode"]
    if agent_nodes:
        agent_node = agent_nodes[0]
        agent_data = agent_node.get("data", {})
        
        config["agent"] = {
            "type": agent_data.get("id", "conversational-agent"),
            "system_prompt": agent_data.get("systemPrompt", "You are a helpful assistant."),
            "verbose": agent_data.get("verbose", False),
            "memory": agent_data.get("memory", False)
        }
    
    # Extract tool configurations
    tool_nodes = [node for node in nodes if node.get("type") == "toolNode"]
    for tool_node in tool_nodes:
        tool_data = tool_node.get("data", {})
        
        tool_config = {
            "type": tool_data.get("id"),
            "name": tool_data.get("name"),
            "description": tool_data.get("description")
        }
        
        # Add tool-specific configuration
        if "duckduckgo" in tool_data.get("id", ""):
            tool_config["max_results"] = tool_data.get("maxResults", 5)
        elif "github" in tool_data.get("id", ""):
            tool_config["github_token"] = tool_data.get("githubToken")
        elif "gmail" in tool_data.get("id", ""):
            tool_config["gmail_credentials"] = tool_data.get("gmailCredentials")
            tool_config["read_only"] = tool_data.get("readOnly", True)
        elif "weather" in tool_data.get("id", ""):
            tool_config["api_key"] = tool_data.get("weatherApiKey")
        
        config["tools"].append(tool_config)
    
    return config

