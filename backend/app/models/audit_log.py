import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class AuditActionEnum(str, enum.Enum):
    TRANSACTION_CREATED = "TRANSACTION_CREATED"
    TRANSACTION_DUPLICATE_FLAGGED = "TRANSACTION_DUPLICATE_FLAGGED"
    TRANSACTION_CORRECTED = "TRANSACTION_CORRECTED"
    TRANSACTION_VIEWED = "TRANSACTION_VIEWED"
    REPORT_GENERATED = "REPORT_GENERATED"
    REPORT_EXPORTED = "REPORT_EXPORTED"
    USER_CREATED = "USER_CREATED"
    USER_DISABLED = "USER_DISABLED"
    USER_UPDATED = "USER_UPDATED"
    BRANCH_CREATED = "BRANCH_CREATED"

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=True, index=True)
    
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False, index=True)  # transaction, user, branch, report
    entity_id = Column(String(100), nullable=True, index=True)
    
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    details = Column(Text, nullable=True)
    
    ip_address = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="audit_logs")
