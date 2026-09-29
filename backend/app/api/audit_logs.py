from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from backend.app.database.database import get_db
from backend.app.models.audit_log import AuditLog
from backend.app.models.user import User, RoleEnum
from backend.app.auth.dependencies import require_roles
from backend.app.schemas.audit import AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["Audit Trail"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_roles([RoleEnum.OWNER, RoleEnum.MANAGER, RoleEnum.ACCOUNTANT])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog).options(joinedload(AuditLog.user)).filter(
        AuditLog.restaurant_id == current_user.restaurant_id
    )
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
        
    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    
    res = []
    for log in logs:
        res.append(AuditLogResponse(
            id=log.id,
            user_id=log.user_id,
            user_name=log.user.full_name if log.user else "System",
            restaurant_id=log.restaurant_id,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            old_value=log.old_value,
            new_value=log.new_value,
            details=log.details,
            ip_address=log.ip_address,
            timestamp=log.timestamp
        ))
    return res
