from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from pydantic import BaseModel
from decimal import Decimal
import datetime

class TransactionDraft(BaseModel):
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
    payment_date: Optional[str] = None  # YYYY-MM-DD
    payment_time: Optional[str] = None  # HH:MM AM/PM or HH:MM:SS
    qr_payload: str
    verification_url: Optional[str] = None
    qr_status: str  # QR_DECODED, DATA_EXTRACTED, VERIFICATION_PAGE_AVAILABLE, INVALID_QR
    raw_metadata: Dict[str, Any] = {}
    missing_fields_warning: Optional[str] = None

class PaymentProviderParser(ABC):
    """
    Abstract Base Class for payment receipt QR parsers.
    Extensible for future official provider APIs and adapters.
    """

    @property
    @abstractmethod
    def provider_code(self) -> str:
        """Provider identifier code (e.g. TELEBIRR, CBE)"""
        pass

    @property
    @abstractmethod
    def provider_display_name(self) -> str:
        """Human-readable provider name"""
        pass

    @abstractmethod
    def detect(self, payload: str) -> bool:
        """
        Returns True if this parser recognizes the payload format or provider signatures.
        """
        pass

    @abstractmethod
    def parse(self, payload: str) -> TransactionDraft:
        """
        Parses the QR payload into a standardized TransactionDraft.
        Must NOT fabricate missing data.
        """
        pass

    def validate(self, payload: str) -> bool:
        """
        Basic validation of payload sanity.
        """
        if not payload or not isinstance(payload, str):
            return False
        if len(payload.strip()) == 0 or len(payload) > 8192:
            return False
        return True
