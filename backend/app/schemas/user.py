from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from backend.app.models.user import RoleEnum

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role: RoleEnum
    restaurant_id: Optional[str] = None
    branch_id: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[RoleEnum] = None
    branch_id: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: str
    restaurant_name: Optional[str] = None
    branch_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
