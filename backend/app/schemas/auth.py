from pydantic import BaseModel, EmailStr
from typing import Optional
from backend.app.models.user import RoleEnum

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
    restaurant_id: Optional[str] = None
    branch_id: Optional[str] = None

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class UserProfile(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    role: RoleEnum
    restaurant_id: Optional[str] = None
    restaurant_name: Optional[str] = None
    branch_id: Optional[str] = None
    branch_name: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True
