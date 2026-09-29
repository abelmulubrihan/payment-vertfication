from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.app.providers.base import TransactionDraft

class QRDecodeRequest(BaseModel):
    qr_payload: str
    branch_id: Optional[str] = None

class QRDecodeResponse(BaseModel):
    success: bool
    draft: TransactionDraft
    is_duplicate: bool = False
    duplicate_info: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
