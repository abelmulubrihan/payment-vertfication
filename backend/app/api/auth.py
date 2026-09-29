from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.database.config import settings
from backend.app.models.user import User, RoleEnum
from backend.app.auth.security import (
    verify_password, create_access_token, create_refresh_token, decode_token
)
from backend.app.auth.dependencies import get_current_user
from backend.app.schemas.auth import (
    Token, LoginRequest, RefreshRequest, UserProfile
)
from backend.app.services.audit_service import log_audit
from backend.app.models.audit_log import AuditActionEnum

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(
    request: Request,
    login_data: Optional[LoginRequest] = None,
    form_data: Optional[OAuth2PasswordRequestForm] = Depends(lambda: None),
    db: Session = Depends(get_db)
):
    # Support both JSON LoginRequest and form-data OAuth2PasswordRequestForm
    username_or_email = None
    password = None

    if login_data:
        username_or_email = login_data.username_or_email
        password = login_data.password
    elif form_data:
        username_or_email = form_data.username
        password = form_data.password
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide login credentials."
        )

    user = db.query(User).filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )

    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        restaurant_id=user.restaurant_id,
        branch_id=user.branch_id
    )
    refresh_token = create_refresh_token(
        subject=user.id,
        role=user.role.value,
        restaurant_id=user.restaurant_id,
        branch_id=user.branch_id
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    token_data = decode_token(payload.refresh_token)
    if not token_data or token_data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = token_data.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        restaurant_id=user.restaurant_id,
        branch_id=user.branch_id
    )
    new_refresh_token = create_refresh_token(
        subject=user.id,
        role=user.role.value,
        restaurant_id=user.restaurant_id,
        branch_id=user.branch_id
    )

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserProfile)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        role=current_user.role,
        restaurant_id=current_user.restaurant_id,
        restaurant_name=current_user.restaurant.name if current_user.restaurant else None,
        branch_id=current_user.branch_id,
        branch_name=current_user.branch.name if current_user.branch else None,
        is_active=current_user.is_active
    )
