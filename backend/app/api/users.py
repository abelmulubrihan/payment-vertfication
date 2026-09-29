from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.user import User, RoleEnum
from backend.app.models.organization import Restaurant, Branch
from backend.app.auth.security import get_password_hash
from backend.app.auth.dependencies import get_current_user, require_roles
from backend.app.schemas.user import UserCreate, UserUpdate, UserResponse
from backend.app.services.audit_service import log_audit
from backend.app.models.audit_log import AuditActionEnum

router = APIRouter(prefix="/users", tags=["User Management"])

@router.get("", response_model=List[UserResponse])
def get_users(
    branch_id: Optional[str] = None,
    role: Optional[RoleEnum] = None,
    current_user: User = Depends(require_roles([RoleEnum.OWNER, RoleEnum.MANAGER, RoleEnum.ACCOUNTANT])),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.restaurant_id == current_user.restaurant_id)
    if branch_id:
        query = query.filter(User.branch_id == branch_id)
    if role:
        query = query.filter(User.role == role)
        
    users = query.order_by(User.created_at.desc()).all()
    
    result = []
    for u in users:
        result.append(UserResponse(
            id=u.id,
            email=u.email,
            username=u.username,
            full_name=u.full_name,
            role=u.role,
            restaurant_id=u.restaurant_id,
            restaurant_name=u.restaurant.name if u.restaurant else None,
            branch_id=u.branch_id,
            branch_name=u.branch.name if u.branch else None,
            is_active=u.is_active,
            created_at=u.created_at,
            updated_at=u.updated_at
        ))
    return result

@router.post("", response_model=UserResponse)
def create_user(
    user_in: UserCreate,
    current_user: User = Depends(require_roles([RoleEnum.OWNER, RoleEnum.MANAGER])),
    db: Session = Depends(get_db)
):
    # Check duplicate username/email
    existing = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists."
        )

    # If manager creates user, cannot create OWNER role
    if current_user.role == RoleEnum.MANAGER and user_in.role == RoleEnum.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Managers cannot create Owner accounts."
        )

    restaurant_id = current_user.restaurant_id
    branch_id = user_in.branch_id or current_user.branch_id

    new_user = User(
        restaurant_id=restaurant_id,
        branch_id=branch_id,
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=user_in.is_active if user_in.is_active is not None else True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit(
        db=db,
        action=AuditActionEnum.USER_CREATED,
        entity_type="user",
        entity_id=new_user.id,
        user_id=current_user.id,
        restaurant_id=restaurant_id,
        details=f"Created user {new_user.username} ({new_user.role.value})"
    )

    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        username=new_user.username,
        full_name=new_user.full_name,
        role=new_user.role,
        restaurant_id=new_user.restaurant_id,
        restaurant_name=new_user.restaurant.name if new_user.restaurant else None,
        branch_id=new_user.branch_id,
        branch_name=new_user.branch.name if new_user.branch else None,
        is_active=new_user.is_active,
        created_at=new_user.created_at,
        updated_at=new_user.updated_at
    )

@router.patch("/{id}", response_model=UserResponse)
def update_user(
    id: str,
    user_in: UserUpdate,
    current_user: User = Depends(require_roles([RoleEnum.OWNER, RoleEnum.MANAGER])),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(
        User.id == id,
        User.restaurant_id == current_user.restaurant_id
    ).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user_in.email:
        target_user.email = user_in.email
    if user_in.full_name:
        target_user.full_name = user_in.full_name
    if user_in.role:
        if current_user.role != RoleEnum.OWNER and user_in.role == RoleEnum.OWNER:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot assign OWNER role.")
        target_user.role = user_in.role
    if user_in.branch_id is not None:
        target_user.branch_id = user_in.branch_id
    if user_in.is_active is not None:
        target_user.is_active = user_in.is_active
    if user_in.password:
        target_user.hashed_password = get_password_hash(user_in.password)

    db.commit()
    db.refresh(target_user)

    log_audit(
        db=db,
        action=AuditActionEnum.USER_UPDATED,
        entity_type="user",
        entity_id=target_user.id,
        user_id=current_user.id,
        restaurant_id=current_user.restaurant_id,
        details=f"Updated user profile for {target_user.username}"
    )

    return UserResponse(
        id=target_user.id,
        email=target_user.email,
        username=target_user.username,
        full_name=target_user.full_name,
        role=target_user.role,
        restaurant_id=target_user.restaurant_id,
        restaurant_name=target_user.restaurant.name if target_user.restaurant else None,
        branch_id=target_user.branch_id,
        branch_name=target_user.branch.name if target_user.branch else None,
        is_active=target_user.is_active,
        created_at=target_user.created_at,
        updated_at=target_user.updated_at
    )
