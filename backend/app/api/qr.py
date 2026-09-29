from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.user import User
from backend.app.auth.dependencies import get_current_user
from backend.app.providers.detector import detector
from backend.app.schemas.qr import QRDecodeRequest, QRDecodeResponse
from backend.app.services.transaction_service import find_duplicate_transaction

router = APIRouter(prefix="/qr", tags=["QR Processing"])

@router.post("/decode", response_model=QRDecodeResponse)
def decode_qr(
    req: QRDecodeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Decodes the QR payload, identifies payment provider, extracts transaction fields,
    and checks for duplicate transactions in the restaurant.
    """
    try:
        draft = detector.decode_and_parse(req.qr_payload)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"QR Parsing error: {str(e)}"
        )

    # Check for duplicates in current restaurant
    is_duplicate = False
    duplicate_info = None

    if current_user.restaurant_id and draft.reference_number:
        existing = find_duplicate_transaction(
            db=db,
            restaurant_id=current_user.restaurant_id,
            provider=draft.provider,
            reference_number=draft.reference_number
        )
        if existing:
            is_duplicate = True
            duplicate_info = {
                "existing_transaction_id": existing.id,
                "reference_number": existing.reference_number,
                "provider": existing.provider_display_name,
                "amount": float(existing.amount) if existing.amount else None,
                "payment_date": str(existing.payment_date) if existing.payment_date else None,
                "payment_time": existing.payment_time,
                "scanned_by": existing.scanned_by_user.full_name if existing.scanned_by_user else "Unknown",
                "recorded_at": existing.created_at.strftime("%d %b %Y %I:%M %p")
            }

    message = None
    if is_duplicate:
        message = "Duplicate Transaction: This reference number has already been recorded."
    elif draft.missing_fields_warning:
        message = draft.missing_fields_warning

    return QRDecodeResponse(
        success=True,
        draft=draft,
        is_duplicate=is_duplicate,
        duplicate_info=duplicate_info,
        message=message
    )
