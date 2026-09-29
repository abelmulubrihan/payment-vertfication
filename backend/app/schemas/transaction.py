from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from backend.app.models.transaction import QRStatusEnum, ReceiptStatusEnum

class TransactionCreate(BaseModel):
    branch_id: Optional[str] = None
    provider: str = "GENERIC"
    provider_display_name: Optional[str] = None
    reference_number: Optional[str] = None
    transaction_number: Optional[str] = None
    invoice_number: Optional[str] = None
    payer_name: Optional[str] = None
    payer_account_masked: Optional[str] = None
    receiver_name: Optional[str] = None
    receiver_account_masked: Optional[str] = None
    payment_type: Optional[str] = None
    payment_method: Optional[str] = None
    payment_channel: Optional[str] = None
    amount: Optional[float] = None
    service_charge: Optional[float] = 0.0
    vat: Optional[float] = 0.0
    total_debited: Optional[float] = None
    currency: str = "ETB"
    payment_date: Optional[date] = None
    payment_time: Optional[str] = None
    qr_payload: str
    verification_url: Optional[str] = None
    qr_status: Optional[QRStatusEnum] = QRStatusEnum.QR_DECODED
    receipt_status: Optional[ReceiptStatusEnum] = ReceiptStatusEnum.RECEIPT_RECORDED
    idempotency_key: Optional[str] = None
    notes: Optional[str] = None
    receipt_image_path: Optional[str] = None
    raw_metadata: Optional[Dict[str, Any]] = None
    allow_duplicate: Optional[bool] = False  # Managers can override

class TransactionUpdate(BaseModel):
    # Only managers/owners can update notes/status; financial values remain immutable
    receipt_status: Optional[ReceiptStatusEnum] = None
    notes: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    transaction_uuid: str
    restaurant_id: str
    restaurant_name: Optional[str] = None
    branch_id: Optional[str] = None
    branch_name: Optional[str] = None
    scanned_by_user_id: Optional[str] = None
    scanned_by_user_name: Optional[str] = None
    
    provider: str
    provider_display_name: str
    reference_number: Optional[str] = None
    transaction_number: Optional[str] = None
    invoice_number: Optional[str] = None
    
    payer_name: Optional[str] = None
    payer_account_masked: Optional[str] = None
    receiver_name: Optional[str] = None
    receiver_account_masked: Optional[str] = None
    
    payment_type: Optional[str] = None
    payment_method: Optional[str] = None
    payment_channel: Optional[str] = None
    
    amount: Optional[float] = None
    service_charge: Optional[float] = 0.0
    vat: Optional[float] = 0.0
    total_debited: Optional[float] = None
    currency: str = "ETB"
    
    payment_date: Optional[date] = None
    payment_time: Optional[str] = None
    
    qr_payload: str
    verification_url: Optional[str] = None
    
    qr_status: QRStatusEnum
    receipt_status: ReceiptStatusEnum
    
    is_duplicate: bool
    duplicate_of_id: Optional[str] = None
    idempotency_key: Optional[str] = None
    notes: Optional[str] = None
    receipt_image_path: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TransactionListResponse(BaseModel):
    total_count: int
    total_amount: float
    items: List[TransactionResponse]

class SyncBatchRequest(BaseModel):
    transactions: List[TransactionCreate]

class SyncBatchResponse(BaseModel):
    synced_count: int
    failed_count: int
    duplicates_count: int
    results: List[Dict[str, Any]]
