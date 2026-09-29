from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.organization import Branch, Restaurant
from backend.app.models.user import User, RoleEnum
from backend.app.auth.dependencies import get_current_user, require_roles
from backend.app.schemas.organization import BranchCreate, BranchResponse
from backend.app.services.audit_service import log_audit
from backend.app.models.audit_log import AuditActionEnum

router = APIRouter(prefix="/branches", tags=["Branch Management"])

@router.get("", response_model=List[BranchResponse])
def get_branches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Branch).filter(Branch.restaurant_id == current_user.restaurant_id)
    return query.order_by(Branch.name.asc()).all()

@router.post("", response_model=BranchResponse)
def create_branch(
    branch_in: BranchCreate,
    current_user: User = Depends(require_roles([RoleEnum.OWNER, RoleEnum.MANAGER])),
    db: Session = Depends(get_db)
):
    restaurant_id = branch_in.restaurant_id or current_user.restaurant_id
    if not restaurant_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No restaurant found.")

    branch = Branch(
        restaurant_id=restaurant_id,
        name=branch_in.name,
        code=branch_in.code,
        address=branch_in.address,
        phone=branch_in.phone
    )
    db.add(branch)
    db.commit()
    db.refresh(branch)

    log_audit(
        db=db,
        action=AuditActionEnum.BRANCH_CREATED,
        entity_type="branch",
        entity_id=branch.id,
        user_id=current_user.id,
        restaurant_id=restaurant_id,
        details=f"Created branch {branch.name}"
    )

    return branch
