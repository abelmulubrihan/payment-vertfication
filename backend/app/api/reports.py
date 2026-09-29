from typing import Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.user import User, RoleEnum
from backend.app.models.transaction import Transaction
from backend.app.auth.dependencies import get_current_user, require_roles
from backend.app.schemas.report import (
    ReportResponse, DashboardMetricsResponse
)
from backend.app.services.report_service import (
    calculate_period_report, get_dashboard_metrics
)
from backend.app.services.transaction_service import get_transactions_query
from backend.app.services.export_service import (
    generate_csv_report, generate_excel_report, generate_pdf_report
)
from backend.app.services.audit_service import log_audit
from backend.app.models.audit_log import AuditActionEnum

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/dashboard", response_model=DashboardMetricsResponse)
def get_dashboard(
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns dashboard overview metrics (today, week, month, year totals and today's provider breakdown).
    """
    return get_dashboard_metrics(db=db, current_user=current_user, branch_id=branch_id)

@router.get("/daily", response_model=ReportResponse)
def get_daily_report(
    target_date: Optional[date] = None,
    branch_id: Optional[str] = None,
    provider: Optional[str] = None,
    waiter_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target = target_date or date.today()
    return calculate_period_report(
        db=db,
        current_user=current_user,
        period_type="daily",
        date_from=target,
        date_to=target,
        branch_id=branch_id,
        provider=provider,
        waiter_id=waiter_id,
        status=status
    )

@router.get("/weekly", response_model=ReportResponse)
def get_weekly_report(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    branch_id: Optional[str] = None,
    provider: Optional[str] = None,
    waiter_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return calculate_period_report(
        db=db,
        current_user=current_user,
        period_type="weekly",
        date_from=date_from,
        date_to=date_to,
        branch_id=branch_id,
        provider=provider,
        waiter_id=waiter_id,
        status=status
    )

@router.get("/monthly", response_model=ReportResponse)
def get_monthly_report(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    branch_id: Optional[str] = None,
    provider: Optional[str] = None,
    waiter_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return calculate_period_report(
        db=db,
        current_user=current_user,
        period_type="monthly",
        date_from=date_from,
        date_to=date_to,
        branch_id=branch_id,
        provider=provider,
        waiter_id=waiter_id,
        status=status
    )

@router.get("/yearly", response_model=ReportResponse)
def get_yearly_report(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    branch_id: Optional[str] = None,
    provider: Optional[str] = None,
    waiter_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return calculate_period_report(
        db=db,
        current_user=current_user,
        period_type="yearly",
        date_from=date_from,
        date_to=date_to,
        branch_id=branch_id,
        provider=provider,
        waiter_id=waiter_id,
        status=status
    )

@router.get("/custom", response_model=ReportResponse)
def get_custom_report(
    date_from: date,
    date_to: date,
    branch_id: Optional[str] = None,
    provider: Optional[str] = None,
    waiter_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return calculate_period_report(
        db=db,
        current_user=current_user,
        period_type="custom",
        date_from=date_from,
        date_to=date_to,
        branch_id=branch_id,
        provider=provider,
        waiter_id=waiter_id,
        status=status
    )

# ==================== EXPORT ENDPOINTS ====================

@router.get("/export/csv")
def export_csv(
    period_type: str = "custom",
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    branch_id: Optional[str] = None,
    provider: Optional[str] = None,
    waiter_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_roles([RoleEnum.OWNER, RoleEnum.MANAGER, RoleEnum.ACCOUNTANT])),
    db: Session = Depends(get_db)
):
    query = get_transactions_query(
        db=db,
        current_user=current_user,
        branch_id=branch_id,
        scanned_by_user_id=waiter_id,
        provider=provider,
        date_from=date_from,
        date_to=date_to,
        search=search,
        status=status
    )
    transactions = query.order_by(Transaction.created_at.desc()).all()
    
    csv_stream = generate_csv_report(transactions)
    
    filename = f"PayVerify_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    log_audit(
        db=db,
        action=AuditActionEnum.REPORT_EXPORTED,
        entity_type="report",
        user_id=current_user.id,
        restaurant_id=current_user.restaurant_id,
        details=f"Exported CSV report with {len(transactions)} rows"
    )
    
    return StreamingResponse(
        csv_stream,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/excel")
def export_excel(
    period_type: str = "custom",
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    branch_id: Optional[str] = None,
    provider: Optional[str] = None,
    waiter_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_roles([RoleEnum.OWNER, RoleEnum.MANAGER, RoleEnum.ACCOUNTANT])),
    db: Session = Depends(get_db)
):
    query = get_transactions_query(
        db=db,
        current_user=current_user,
        branch_id=branch_id,
        scanned_by_user_id=waiter_id,
        provider=provider,
        date_from=date_from,
        date_to=date_to,
        search=search,
        status=status
    )
    transactions = query.order_by(Transaction.created_at.desc()).all()
    
    rest_name = current_user.restaurant.name if current_user.restaurant else "PayVerify Restaurant"
    period_title = f"{date_from or 'All'} to {date_to or 'Today'}"
    
    excel_stream = generate_excel_report(
        transactions=transactions,
        restaurant_name=rest_name,
        period_title=period_title
    )
    
    filename = f"PayVerify_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    log_audit(
        db=db,
        action=AuditActionEnum.REPORT_EXPORTED,
        entity_type="report",
        user_id=current_user.id,
        restaurant_id=current_user.restaurant_id,
        details=f"Exported Excel report with {len(transactions)} rows"
    )
    
    return StreamingResponse(
        excel_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/pdf")
def export_pdf(
    period_type: str = "custom",
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    branch_id: Optional[str] = None,
    provider: Optional[str] = None,
    waiter_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_roles([RoleEnum.OWNER, RoleEnum.MANAGER, RoleEnum.ACCOUNTANT])),
    db: Session = Depends(get_db)
):
    query = get_transactions_query(
        db=db,
        current_user=current_user,
        branch_id=branch_id,
        scanned_by_user_id=waiter_id,
        provider=provider,
        date_from=date_from,
        date_to=date_to,
        search=search,
        status=status
    )
    transactions = query.order_by(Transaction.created_at.desc()).all()
    
    rest_name = current_user.restaurant.name if current_user.restaurant else "PayVerify Restaurant"
    branch_name = current_user.branch.name if current_user.branch else None
    period_title = f"{date_from or 'All'} to {date_to or 'Today'}"
    
    pdf_stream = generate_pdf_report(
        transactions=transactions,
        restaurant_name=rest_name,
        branch_name=branch_name,
        period_title=period_title
    )
    
    filename = f"PayVerify_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    
    log_audit(
        db=db,
        action=AuditActionEnum.REPORT_EXPORTED,
        entity_type="report",
        user_id=current_user.id,
        restaurant_id=current_user.restaurant_id,
        details=f"Exported PDF report with {len(transactions)} rows"
    )
    
    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
