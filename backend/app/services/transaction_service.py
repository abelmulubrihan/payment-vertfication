from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func, desc
from fastapi import HTTPException, status

from backend.app.models.transaction import (
    Transaction, TransactionProviderData, QRStatusEnum, ReceiptStatusEnum
)
from backend.app.models.user import User, RoleEnum
from backend.app.schemas.transaction import TransactionCreate, TransactionUpdate
from backend.app.services.audit_service import log_audit
from backend.app.models.audit_log import AuditActionEnum

def find_duplicate_transaction(
    db: Session,
    restaurant_id: str,
    provider: str,
    reference_number: Optional[str]
) -> Optional[Transaction]:
    """
    Checks for an existing transaction with the same provider and reference number in the same restaurant.
    """
    if not reference_number or not reference_number.strip():
        return None
        
    query = db.query(Transaction).filter(
        Transaction.restaurant_id == restaurant_id,
        Transaction.reference_number == reference_number.strip(),
        Transaction.is_duplicate == False
    )
    
    # Check same provider if specified
    if provider and provider != "GENERIC":
        query = query.filter(Transaction.provider == provider)
        
    return query.first()

def create_transaction(
    db: Session,
    tx_in: TransactionCreate,
    current_user: User,
    ip_address: Optional[str] = None
) -> Tuple[Transaction, Optional[Dict[str, Any]]]:
    """
    Creates a new transaction with idempotency and duplicate checking.
    """
    # 1. Idempotency Check
    if tx_in.idempotency_key:
        existing_tx = db.query(Transaction).filter(
            Transaction.idempotency_key == tx_in.idempotency_key
        ).first()
        if existing_tx:
            return existing_tx, None

    # Determine restaurant and branch
    restaurant_id = current_user.restaurant_id
    if not restaurant_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is not assigned to a restaurant.")
        
    branch_id = tx_in.branch_id or current_user.branch_id

    # 2. Duplicate Detection
    duplicate_info = None
    existing_duplicate = None
    if tx_in.reference_number:
        existing_duplicate = find_duplicate_transaction(
            db=db,
            restaurant_id=restaurant_id,
            provider=tx_in.provider,
            reference_number=tx_in.reference_number
        )
        
    if existing_duplicate:
        duplicate_info = {
            "is_duplicate": True,
            "existing_transaction_id": existing_duplicate.id,
            "reference_number": existing_duplicate.reference_number,
            "provider": existing_duplicate.provider_display_name,
            "amount": float(existing_duplicate.amount) if existing_duplicate.amount else None,
            "payment_date": str(existing_duplicate.payment_date) if existing_duplicate.payment_date else None,
            "payment_time": existing_duplicate.payment_time,
            "scanned_by": existing_duplicate.scanned_by_user.full_name if existing_duplicate.scanned_by_user else "Unknown",
            "recorded_at": existing_duplicate.created_at.strftime("%d %b %Y %I:%M %p")
        }
        
        # If user is a waiter and didn't / couldn't allow duplicate override
        if not tx_in.allow_duplicate:
            if current_user.role == RoleEnum.WAITER:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "message": "Duplicate Transaction Detected",
                        "duplicate_info": duplicate_info
                    }
                )

    # 3. Create Transaction Record
    is_dup = bool(existing_duplicate and tx_in.allow_duplicate)
    rec_status = ReceiptStatusEnum.DUPLICATE if is_dup else (tx_in.receipt_status or ReceiptStatusEnum.RECEIPT_RECORDED)

    # Parse payment_date if needed
    p_date = tx_in.payment_date
    if isinstance(p_date, str):
        try:
            p_date = datetime.strptime(p_date, "%Y-%m-%d").date()
        except Exception:
            p_date = date.today()
    elif p_date is None:
        p_date = date.today()

    p_time = tx_in.payment_time or datetime.now().strftime("%I:%M %p")

    transaction = Transaction(
        restaurant_id=restaurant_id,
        branch_id=branch_id,
        scanned_by_user_id=current_user.id,
        provider=tx_in.provider,
        provider_display_name=tx_in.provider_display_name or tx_in.provider,
        reference_number=tx_in.reference_number,
        transaction_number=tx_in.transaction_number or tx_in.reference_number,
        invoice_number=tx_in.invoice_number,
        payer_name=tx_in.payer_name,
        payer_account_masked=tx_in.payer_account_masked,
        receiver_name=tx_in.receiver_name,
        receiver_account_masked=tx_in.receiver_account_masked,
        payment_type=tx_in.payment_type,
        payment_method=tx_in.payment_method,
        payment_channel=tx_in.payment_channel,
        amount=tx_in.amount,
        service_charge=tx_in.service_charge or 0.0,
        vat=tx_in.vat or 0.0,
        total_debited=tx_in.total_debited or tx_in.amount,
        currency=tx_in.currency or "ETB",
        payment_date=p_date,
        payment_time=p_time,
        qr_payload=tx_in.qr_payload,
        verification_url=tx_in.verification_url,
        qr_status=tx_in.qr_status or QRStatusEnum.QR_DECODED,
        receipt_status=rec_status,
        is_duplicate=is_dup,
        duplicate_of_id=existing_duplicate.id if existing_duplicate else None,
        idempotency_key=tx_in.idempotency_key,
        notes=tx_in.notes,
        receipt_image_path=tx_in.receipt_image_path
    )
    db.add(transaction)
    db.flush()

    # Create Provider raw data record
    provider_data = TransactionProviderData(
        transaction_id=transaction.id,
        raw_payload=tx_in.qr_payload,
        extracted_fields=tx_in.raw_metadata or {}
    )
    db.add(provider_data)
    db.commit()
    db.refresh(transaction)

    # 4. Audit Log
    log_audit(
        db=db,
        action=AuditActionEnum.TRANSACTION_DUPLICATE_FLAGGED if is_dup else AuditActionEnum.TRANSACTION_CREATED,
        entity_type="transaction",
        entity_id=transaction.id,
        user_id=current_user.id,
        restaurant_id=restaurant_id,
        new_value={
            "reference_number": transaction.reference_number,
            "provider": transaction.provider,
            "amount": float(transaction.amount) if transaction.amount else None,
            "receipt_status": transaction.receipt_status.value
        },
        details=f"Transaction scanned by {current_user.full_name} ({current_user.role.value})",
        ip_address=ip_address
    )

    return transaction, duplicate_info

def get_transactions_query(
    db: Session,
    current_user: User,
    branch_id: Optional[str] = None,
    scanned_by_user_id: Optional[str] = None,
    provider: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    status: Optional[str] = None
):
    query = db.query(Transaction).options(
        joinedload(Transaction.restaurant),
        joinedload(Transaction.branch),
        joinedload(Transaction.scanned_by_user)
    )

    # Filter by user scope
    if current_user.restaurant_id:
        query = query.filter(Transaction.restaurant_id == current_user.restaurant_id)

    # Waiter can view only their own transactions by default if specified or forced
    if current_user.role == RoleEnum.WAITER:
        # If waiter is fetching their own list or we scope to their branch
        if scanned_by_user_id:
            query = query.filter(Transaction.scanned_by_user_id == scanned_by_user_id)
        elif current_user.branch_id:
            query = query.filter(Transaction.branch_id == current_user.branch_id)
    else:
        if scanned_by_user_id:
            query = query.filter(Transaction.scanned_by_user_id == scanned_by_user_id)
            
    if branch_id:
        query = query.filter(Transaction.branch_id == branch_id)
        
    if provider and provider != "ALL":
        query = query.filter(Transaction.provider == provider)
        
    if date_from:
        query = query.filter(Transaction.payment_date >= date_from)
        
    if date_to:
        query = query.filter(Transaction.payment_date <= date_to)
        
    if status and status != "ALL":
        query = query.filter(Transaction.receipt_status == status)
        
    if min_amount is not None:
        query = query.filter(Transaction.amount >= min_amount)
        
    if max_amount is not None:
        query = query.filter(Transaction.amount <= max_amount)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.reference_number.ilike(term),
                Transaction.invoice_number.ilike(term),
                Transaction.payer_name.ilike(term),
                Transaction.receiver_name.ilike(term),
                Transaction.payer_account_masked.ilike(term)
            )
        )

    return query
