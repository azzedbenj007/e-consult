"""Pydantic schemas for API validation."""

import uuid
from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# --- Auth ---

class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = None
    role: str = Field(default="technicien", pattern="^(technicien|ingenieur|chef_service|admin)$")
    service: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


# --- Chat ---

class ChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: Optional[str] = None


class ChatMessageResponse(BaseModel):
    message_id: str
    content: str
    conversation_id: str
    metadata: Optional[dict] = None


class ConversationResponse(BaseModel):
    id: str
    title: Optional[str]
    created_at: datetime
    updated_at: datetime


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    metadata: Optional[dict] = None
    created_at: datetime


class ConversationDetailResponse(BaseModel):
    id: str
    title: Optional[str]
    messages: list[MessageResponse]
    created_at: datetime


# --- Equipment ---

class EquipmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    category_id: Optional[int] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    location: Optional[str] = None
    service: Optional[str] = None
    status: str = "actif"
    installation_date: Optional[date] = None
    description: Optional[str] = None
    specifications: Optional[dict] = None
    follow_up_link: Optional[str] = None


class EquipmentResponse(BaseModel):
    id: str
    name: str
    brand: Optional[str]
    model: Optional[str]
    serial_number: Optional[str]
    location: Optional[str]
    service: Optional[str]
    status: str
    installation_date: Optional[date]
    last_maintenance: Optional[date]
    next_maintenance: Optional[date]
    description: Optional[str]
    specifications: Optional[dict]
    follow_up_link: Optional[str]


class EquipmentSearchRequest(BaseModel):
    keyword: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    limit: int = Field(default=20, le=100)


# --- Maintenance ---

class MaintenanceCreate(BaseModel):
    equipment_id: str
    type: str = Field(pattern="^(preventive|corrective|urgente)$")
    description: str
    performed_at: datetime
    next_due: Optional[date] = None
    cost: Optional[float] = None
    parts_used: Optional[dict] = None
    notes: Optional[str] = None


# --- Dashboard ---

class DashboardStatsResponse(BaseModel):
    total_equipment: int
    active: int
    broken: int
    in_maintenance: int
    categories: list[dict]
    upcoming_maintenance: list[dict]


# --- RAG ---

class RAGQueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    category: Optional[str] = None
    n_results: int = Field(default=5, le=20)
