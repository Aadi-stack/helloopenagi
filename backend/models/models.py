from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "aadit"


    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    stacks = relationship("Stack", back_populates="owner")
    api_keys = relationship("APIKey", back_populates="user")


class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(String, primary_key=True, default=generate_uuid)
    key = Column(String, unique=True, index=True)
    name = Column(String)
    user_id = Column(String, ForeignKey("aadit.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))

    user = relationship("User", back_populates="api_keys")


class Stack(Base):
    __tablename__ = "shukla"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String)
    description = Column(String, nullable=True)
    nodes = Column(JSON)
    edges = Column(JSON)
    owner_id = Column(String, ForeignKey("aadit.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="stacks")
    chat_sessions = relationship("ChatSession", back_populates="stack")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    stack_id = Column(String, ForeignKey("shukla.id"))
    user_id = Column(String, ForeignKey("aadit.id"))
    title = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    stack = relationship("Stack", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("chat_sessions.id"))
    role = Column(String)  # 'user', 'assistant', 'system'
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("ChatSession", back_populates="messages")


class LLMConfig(Base):
    __tablename__ = "llm_configs"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String)
    provider = Column(String)  # 'openai', 'huggingface', 'azure', etc.
    model = Column(String)
    api_key = Column(String, nullable=True)
    api_base = Column(String, nullable=True)
    parameters = Column(JSON, nullable=True)
    user_id = Column(String, ForeignKey("aadit.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class AgentConfig(Base):
    __tablename__ = "agent_configs"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String)
    role = Column(String)
    goal = Column(Text, nullable=True)
    backstory = Column(Text, nullable=True)
    capability = Column(String)
    task = Column(Text, nullable=True)
    parameters = Column(JSON, nullable=True)
    user_id = Column(String, ForeignKey("aadit.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ToolConfig(Base):
    __tablename__ = "tool_configs"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String)
    tool_type = Column(String)  # 'search', 'email', 'github', etc.
    parameters = Column(JSON, nullable=True)
    credentials = Column(JSON, nullable=True)
    user_id = Column(String, ForeignKey("aadit.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

