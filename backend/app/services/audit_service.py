from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.audit_log import AuditLog, AuditActionEnum

def log_audit(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    restaurant_id: Optional[str] = None,
    old_value: Optional[Dict[str, Any]] = None,
    new_value: Optional[Dict[str, Any]] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    log_entry = AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        restaurant_id=restaurant_id,
        old_value=old_value,
        new_value=new_value,
        details=details,
        ip_address=ip_address
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
