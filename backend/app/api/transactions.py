from typing import Optional, List
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.transaction import Transaction, ReceiptStatusEnum
from backend.app.models.user import User, RoleEnum
from backend.app.auth.dependencies import get_current_user, require_roles
from backend.app.schemas.transaction import (
    TransactionCreate, TransactionUpdate, TransactionResponse,
    TransactionListResponse, SyncBatchRequest, SyncBatchResponse
)
from backend.app.schemas.qr import QRDecodeRequest
from backend.app.services.transaction_service import (
    create_transaction, get_transactions_query, find_duplicate_transaction
)
from backend.app.providers.detector import detector
from backend.app.services.audit_service import log_audit
from backend.app.models.audit_log import AuditActionEnum

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("", response_model=TransactionResponse)
def record_transaction(
    tx_in: TransactionCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates and records a transaction from QR scan preview.
    Handles duplicate prevention and idempotency.
    """
    client_ip = request.client.host if request.client else None
    tx, dup_info = create_transaction(
        db=db,
        tx_in=tx_in,
        current_user=current_user,
        ip_address=client_ip
    )
    return tx

@router.post("/from-qr", response_model=TransactionResponse)
def record_from_qr_direct(
    req: QRDecodeRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Convenience endpoint: decodes QR and immediately creates transaction draft and records it.
    """
    draft = detector.decode_and_parse(req.qr_payload)
    tx_in = TransactionCreate(
        branch_id=req.branch_id or current_user.branch_id,
        provider=draft.provider,
        provider_display_name=draft.provider_display_name,
        reference_number=draft.reference_number,
        transaction_number=draft.transaction_number,
        invoice_number=draft.invoice_number,
        payer_name=draft.payer_name,
        payer_account_masked=draft.payer_account_masked,
        receiver_name=draft.receiver_name,
        receiver_account_masked=draft.receiver_account_masked,
        payment_type=draft.payment_type,
        payment_method=draft.payment_method,
        payment_channel=draft.payment_channel,
        amount=draft.amount,
        service_charge=draft.service_charge,
        vat=draft.vat,
        total_debited=draft.total_debited,
        currency=draft.currency,
        payment_date=draft.payment_date, # parsed in service
        payment_time=draft.payment_time,
        qr_payload=draft.qr_payload,
        verification_url=draft.verification_url,
        qr_status=draft.qr_status,
        raw_metadata=draft.raw_metadata
    )
    client_ip = request.client.host if request.client else None
    tx, _ = create_transaction(db=db, tx_in=tx_in, current_user=current_user, ip_address=client_ip)
    return tx

@router.post("/sync", response_model=SyncBatchResponse)
def sync_offline_transactions(
    batch: SyncBatchRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Synchronizes locally queued offline transactions safely with idempotency.
    """
    client_ip = request.client.host if request.client else None
    synced = 0
    failed = 0
    duplicates = 0
    results = []

    for item in batch.transactions:
        try:
            tx, dup_info = create_transaction(
                db=db,
                tx_in=item,
                current_user=current_user,
                ip_address=client_ip
            )
            if dup_info:
                duplicates += 1
                results.append({
                    "idempotency_key": item.idempotency_key,
                    "status": "duplicate",
                    "transaction_id": tx.id
                })
            else:
                synced += 1
                results.append({
                    "idempotency_key": item.idempotency_key,
                    "status": "success",
                    "transaction_id": tx.id
                })
        except Exception as e:
            failed += 1
            results.append({
                "idempotency_key": item.idempotency_key,
                "status": "failed",
                "error": str(e)
            })

    return SyncBatchResponse(
        synced_count=synced,
        failed_count=failed,
        duplicates_count=duplicates,
        results=results
    )

@router.get("", response_model=TransactionListResponse)
def get_transactions(
    branch_id: Optional[str] = None,
    scanned_by_user_id: Optional[str] = None,
    provider: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = get_transactions_query(
        db=db,
        current_user=current_user,
        branch_id=branch_id,
        scanned_by_user_id=scanned_by_user_id,
        provider=provider,
        date_from=date_from,
        date_to=date_to,
        search=search,
        min_amount=min_amount,
        max_amount=max_amount,
        status=status
    )
    
    total_count = query.count()
    all_items = query.all()
    total_amount = sum(float(tx.amount or 0.0) for tx in all_items)
    
    paginated_items = query.order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()

    return TransactionListResponse(
        total_count=total_count,
        total_amount=round(total_amount, 2),
        items=paginated_items
    )

@router.get("/daily", response_model=TransactionListResponse)
def get_daily_transactions(
    target_date: Optional[date] = None,
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target = target_date or date.today()
    query = get_transactions_query(
        db=db,
        current_user=current_user,
        branch_id=branch_id,
        date_from=target,
        date_to=target
    )
    items = query.order_by(Transaction.created_at.desc()).all()
    total_amount = sum(float(tx.amount or 0.0) for tx in items)
    return TransactionListResponse(
        total_count=len(items),
        total_amount=round(total_amount, 2),
        items=items
    )

@router.get("/weekly", response_model=TransactionListResponse)
def get_weekly_transactions(
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    query = get_transactions_query(
        db=db,
        current_user=current_user,
        branch_id=branch_id,
        date_from=monday,
        date_to=today
    )
    items = query.order_by(Transaction.created_at.desc()).all()
    total_amount = sum(float(tx.amount or 0.0) for tx in items)
    return TransactionListResponse(
        total_count=len(items),
        total_amount=round(total_amount, 2),
        items=items
    )

@router.get("/monthly", response_model=TransactionListResponse)
def get_monthly_transactions(
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    first_day = today.replace(day=1)
    query = get_transactions_query(
        db=db,
        current_user=current_user,
        branch_id=branch_id,
        date_from=first_day,
        date_to=today
    )
    items = query.order_by(Transaction.created_at.desc()).all()
    total_amount = sum(float(tx.amount or 0.0) for tx in items)
    return TransactionListResponse(
        total_count=len(items),
        total_amount=round(total_amount, 2),
        items=items
    )

@router.get("/yearly", response_model=TransactionListResponse)
def get_yearly_transactions(
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    jan_first = today.replace(month=1, day=1)
    query = get_transactions_query(
        db=db,
        current_user=current_user,
        branch_id=branch_id,
        date_from=jan_first,
        date_to=today
    )
    items = query.order_by(Transaction.created_at.desc()).all()
    total_amount = sum(float(tx.amount or 0.0) for tx in items)
    return TransactionListResponse(
        total_count=len(items),
        total_amount=round(total_amount, 2),
        items=items
    )

@router.get("/{id}", response_model=TransactionResponse)
def get_transaction_detail(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tx = db.query(Transaction).filter(Transaction.id == id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    # Access scoping
    if current_user.restaurant_id and tx.restaurant_id != current_user.restaurant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return tx

@router.patch("/{id}", response_model=TransactionResponse)
def update_transaction(
    id: str,
    update_in: TransactionUpdate,
    current_user: User = Depends(require_roles([RoleEnum.OWNER, RoleEnum.MANAGER])),
    db: Session = Depends(get_db)
):
    """
    Allows Managers/Owners to update notes or status.
    Financial values (amount, reference, provider, date) are immutable!
    """
    tx = db.query(Transaction).filter(Transaction.id == id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    old_val = {"receipt_status": tx.receipt_status.value, "notes": tx.notes}

    if update_in.receipt_status is not None:
        tx.receipt_status = update_in.receipt_status
    if update_in.notes is not None:
        tx.notes = update_in.notes

    db.commit()
    db.refresh(tx)

    log_audit(
        db=db,
        action=AuditActionEnum.TRANSACTION_CORRECTED,
        entity_type="transaction",
        entity_id=tx.id,
        user_id=current_user.id,
        restaurant_id=current_user.restaurant_id,
        old_value=old_val,
        new_value={"receipt_status": tx.receipt_status.value, "notes": tx.notes},
        details=f"Transaction note/status updated by manager {current_user.full_name}"
    )

    return tx
