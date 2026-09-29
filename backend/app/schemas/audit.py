from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    restaurant_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
