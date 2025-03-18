from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import uuid

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None

# API Key schemas
class APIKeyCreate(BaseModel):
    name: str

class APIKeyResponse(BaseModel):
    id: str
    key: str
    name: str
    created_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# Stack schemas
class NodeData(BaseModel):
    id: str
    type: str
    position: Dict[str, float]
    data: Dict[str, Any]

class EdgeData(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None

class StackBase(BaseModel):
    name: str
    description: Optional[str] = None

class StackCreate(StackBase):
    nodes: List[NodeData]
    edges: List[EdgeData]

class StackResponse(StackBase):
    id: str
    owner_id: str
    nodes: List[NodeData]
    edges: List[EdgeData]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# Chat schemas
class ChatMessageCreate(BaseModel):
    role: str
    content: str

class ChatMessageResponse(ChatMessageCreate):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True

class ChatSessionCreate(BaseModel):
    stack_id: str
    title: Optional[str] = None

class ChatSessionResponse(BaseModel):
    id: str
    stack_id: str
    user_id: str
    title: Optional[str] = None
    created_at: datetime
    messages: List[ChatMessageResponse] = []

    class Config:
        orm_mode = True

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    message: ChatMessageResponse
    thinking: Optional[str] = None

# LLM schemas
class LLMConfigBase(BaseModel):
    name: str
    provider: str
    model: str
    api_key: Optional[str] = None
    api_base: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class LLMConfigCreate(LLMConfigBase):
    pass

class LLMConfigResponse(LLMConfigBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# Agent schemas
class AgentConfigBase(BaseModel):
    name: str
    role: str
    goal: Optional[str] = None
    backstory: Optional[str] = None
    capability: str
    task: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class AgentConfigCreate(AgentConfigBase):
    pass

class AgentConfigResponse(AgentConfigBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# Tool schemas
class ToolConfigBase(BaseModel):
    name: str
    tool_type: str
    parameters: Optional[Dict[str, Any]] = None
    credentials: Optional[Dict[str, Any]] = None

class ToolConfigCreate(ToolConfigBase):
    pass

class ToolConfigResponse(ToolConfigBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

