import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    restaurants = relationship("Restaurant", back_populates="organization", cascade="all, delete-orphan")


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="restaurants")
    branches = relationship("Branch", back_populates="restaurant", cascade="all, delete-orphan")
    users = relationship("User", back_populates="restaurant")
    transactions = relationship("Transaction", back_populates="restaurant")


class Branch(Base):
    __tablename__ = "branches"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    restaurant = relationship("Restaurant", back_populates="branches")
    users = relationship("User", back_populates="branch")
    transactions = relationship("Transaction", back_populates="branch")
