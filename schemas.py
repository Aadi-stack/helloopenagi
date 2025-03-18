from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True


# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# Stack schemas
class StackBase(BaseModel):
    name: str
    description: Optional[str] = None


class StackCreate(StackBase):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]


class StackUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None


class StackResponse(StackBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class StackDetail(StackResponse):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]


# Chat schemas
class ChatRequest(BaseModel):
    stack_id: str
    message: str
    history: Optional[List[Dict[str, str]]] = None


class ChatResponse(BaseModel):
    response: str
    stack_id: str


# Tool schemas
class SearchRequest(BaseModel):
    query: str
    max_results: Optional[int] = 5


class SearchResult(BaseModel):
    title: str
    snippet: str
    url: str


class SearchResponse(BaseModel):
    results: List[SearchResult]
    query: str


class WeatherRequest(BaseModel):
    location: str
    units: Optional[str] = "metric"


class WeatherCurrent(BaseModel):
    temp: float
    feels_like: float
    humidity: int
    wind_speed: float
    weather: str


class WeatherForecastItem(BaseModel):
    date: str
    temp_max: float
    temp_min: float
    weather: str


class WeatherResponse(BaseModel):
    location: str
    current: WeatherCurrent
    forecast: List[WeatherForecastItem]


# OpenAGI schemas
class OpenAGIRequest(BaseModel):
    config: Dict[str, Any]
    input: str


class OpenAGIResponse(BaseModel):
    response: str
    config: Dict[str, Any]

