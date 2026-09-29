import enum
import uuid
from datetime import datetime, date, time
from sqlalchemy import Column, String, DateTime, Date, Numeric, ForeignKey, Enum, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class QRStatusEnum(str, enum.Enum):
    QR_DECODED = "QR_DECODED"
    DATA_EXTRACTED = "DATA_EXTRACTED"
    VERIFICATION_PAGE_AVAILABLE = "VERIFICATION_PAGE_AVAILABLE"
    INVALID_QR = "INVALID_QR"

class ReceiptStatusEnum(str, enum.Enum):
    RECEIPT_RECORDED = "RECEIPT_RECORDED"
    DUPLICATE = "DUPLICATE"
    NEEDS_REVIEW = "NEEDS_REVIEW"

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    transaction_uuid = Column(String(36), default=generate_uuid, unique=True, index=True, nullable=False)
    
    restaurant_id = Column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="SET NULL"), nullable=True, index=True)
    scanned_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    provider = Column(String(50), nullable=False, default="GENERIC", index=True)  # TELEBIRR, CBE, BOA, AWASH, GENERIC
    provider_display_name = Column(String(100), nullable=False, default="Generic QR")
    
    reference_number = Column(String(100), nullable=True, index=True)
    transaction_number = Column(String(100), nullable=True, index=True)
    invoice_number = Column(String(100), nullable=True, index=True)
    
    payer_name = Column(String(255), nullable=True)
    payer_account_masked = Column(String(100), nullable=True)
    
    receiver_name = Column(String(255), nullable=True)
    receiver_account_masked = Column(String(100), nullable=True)
    
    payment_type = Column(String(100), nullable=True)
    payment_method = Column(String(100), nullable=True)
    payment_channel = Column(String(100), nullable=True)
    
    amount = Column(Numeric(12, 2), nullable=True)
    service_charge = Column(Numeric(12, 2), nullable=True, default=0.0)
    vat = Column(Numeric(12, 2), nullable=True, default=0.0)
    total_debited = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(10), nullable=False, default="ETB")
    
    payment_date = Column(Date, nullable=True, index=True)
    payment_time = Column(String(50), nullable=True)  # "10:15 AM" or "10:15:00"
    
    qr_payload = Column(Text, nullable=False)
    verification_url = Column(String(1000), nullable=True)
    
    qr_status = Column(Enum(QRStatusEnum), nullable=False, default=QRStatusEnum.QR_DECODED)
    receipt_status = Column(Enum(ReceiptStatusEnum), nullable=False, default=ReceiptStatusEnum.RECEIPT_RECORDED, index=True)
    
    is_duplicate = Column(Boolean, default=False, nullable=False, index=True)
    duplicate_of_id = Column(String(36), ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    
    idempotency_key = Column(String(255), unique=True, nullable=True, index=True)
    notes = Column(Text, nullable=True)
    receipt_image_path = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    restaurant = relationship("Restaurant", back_populates="transactions")
    branch = relationship("Branch", back_populates="transactions")
    scanned_by_user = relationship("User", back_populates="scanned_transactions")
    provider_data = relationship("TransactionProviderData", back_populates="transaction", uselist=False, cascade="all, delete-orphan")


class TransactionProviderData(Base):
    __tablename__ = "transaction_provider_data"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    transaction_id = Column(String(36), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    raw_payload = Column(Text, nullable=False)
    extracted_fields = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("Transaction", back_populates="provider_data")
