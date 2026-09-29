import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from backend.app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class RoleEnum(str, enum.Enum):
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    WAITER = "WAITER"
    ACCOUNTANT = "ACCOUNTANT"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=True, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="SET NULL"), nullable=True, index=True)
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.WAITER, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    restaurant = relationship("Restaurant", back_populates="users")
    branch = relationship("Branch", back_populates="users")
    scanned_transactions = relationship("Transaction", back_populates="scanned_by_user")
    audit_logs = relationship("AuditLog", back_populates="user")
