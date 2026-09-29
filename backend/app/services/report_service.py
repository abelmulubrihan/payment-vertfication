from typing import Optional, List, Dict, Any
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.app.models.transaction import Transaction, ReceiptStatusEnum
from backend.app.models.user import User, RoleEnum
from backend.app.models.organization import Restaurant, Branch
from backend.app.schemas.report import (
    ReportResponse, DashboardMetricsResponse, ProviderReportSummary,
    WaiterReportSummary, TimeSeriesPoint
)
from backend.app.services.transaction_service import get_transactions_query

def calculate_period_report(
    db: Session,
    current_user: User,
    period_type: str,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    branch_id: Optional[str] = None,
    provider: Optional[str] = None,
    waiter_id: Optional[str] = None,
    status: Optional[str] = None
) -> ReportResponse:
    today = date.today()
    
    if period_type == "daily":
        date_from = date_from or today
        date_to = date_to or today
    elif period_type == "weekly":
        date_from = date_from or (today - timedelta(days=today.weekday()))  # Monday
        date_to = date_to or today
    elif period_type == "monthly":
        date_from = date_from or today.replace(day=1)
        date_to = date_to or today
    elif period_type == "yearly":
        date_from = date_from or today.replace(month=1, day=1)
        date_to = date_to or today
    elif period_type == "custom":
        date_from = date_from or (today - timedelta(days=30))
        date_to = date_to or today

    # Base query for all matching transactions
    query = get_transactions_query(
        db=db,
        current_user=current_user,
        branch_id=branch_id,
        scanned_by_user_id=waiter_id,
        provider=provider,
        date_from=date_from,
        date_to=date_to,
        status=status
    )
    
    transactions = query.all()
    
    total_transactions = len(transactions)
    total_amount = sum(float(tx.amount or 0.0) for tx in transactions)
    average_amount = (total_amount / total_transactions) if total_transactions > 0 else 0.0

    # 1. Provider Breakdown
    provider_map: Dict[str, Dict[str, Any]] = {}
    for tx in transactions:
        p_code = tx.provider or "GENERIC"
        p_name = tx.provider_display_name or p_code
        if p_code not in provider_map:
            provider_map[p_code] = {
                "provider": p_code,
                "provider_display_name": p_name,
                "count": 0,
                "total_amount": 0.0
            }
        provider_map[p_code]["count"] += 1
        provider_map[p_code]["total_amount"] += float(tx.amount or 0.0)

    providers_breakdown: List[ProviderReportSummary] = []
    for p_code, p_data in provider_map.items():
        pct_amt = (p_data["total_amount"] / total_amount * 100) if total_amount > 0 else 0.0
        pct_cnt = (p_data["count"] / total_transactions * 100) if total_transactions > 0 else 0.0
        providers_breakdown.append(
            ProviderReportSummary(
                provider=p_data["provider"],
                provider_display_name=p_data["provider_display_name"],
                transaction_count=p_data["count"],
                total_amount=round(p_data["total_amount"], 2),
                percentage_amount=round(pct_amt, 1),
                percentage_count=round(pct_cnt, 1)
            )
        )
    # Sort providers by highest total amount
    providers_breakdown.sort(key=lambda x: x.total_amount, reverse=True)

    # 2. Waiter Breakdown
    waiter_map: Dict[str, Dict[str, Any]] = {}
    for tx in transactions:
        w_id = tx.scanned_by_user_id or "unknown"
        w_name = tx.scanned_by_user.full_name if tx.scanned_by_user else "Unknown Waiter"
        if w_id not in waiter_map:
            waiter_map[w_id] = {
                "user_id": w_id if w_id != "unknown" else None,
                "waiter_name": w_name,
                "count": 0,
                "total_amount": 0.0
            }
        waiter_map[w_id]["count"] += 1
        waiter_map[w_id]["total_amount"] += float(tx.amount or 0.0)

    waiters_breakdown = [
        WaiterReportSummary(
            user_id=v["user_id"],
            waiter_name=v["waiter_name"],
            transaction_count=v["count"],
            total_amount=round(v["total_amount"], 2)
        )
        for v in waiter_map.values()
    ]
    waiters_breakdown.sort(key=lambda x: x.total_amount, reverse=True)

    # 3. Timeline Breakdown for Charts
    timeline_map: Dict[str, Dict[str, Any]] = {}
    for tx in transactions:
        date_str = str(tx.payment_date) if tx.payment_date else "Unknown"
        if date_str not in timeline_map:
            timeline_map[date_str] = {"label": date_str, "date_key": date_str, "count": 0, "total": 0.0}
        timeline_map[date_str]["count"] += 1
        timeline_map[date_str]["total"] += float(tx.amount or 0.0)

    timeline_breakdown = [
        TimeSeriesPoint(
            label=v["label"],
            date_key=v["date_key"],
            transaction_count=v["count"],
            total_amount=round(v["total"], 2)
        )
        for v in sorted(timeline_map.values(), key=lambda x: x["date_key"])
    ]

    restaurant_name = current_user.restaurant.name if current_user.restaurant else "PayVerify Restaurant"
    branch_name = None
    if branch_id:
        br = db.query(Branch).filter(Branch.id == branch_id).first()
        if br:
            branch_name = br.name

    return ReportResponse(
        period_type=period_type,
        date_from=str(date_from),
        date_to=str(date_to),
        restaurant_name=restaurant_name,
        branch_name=branch_name,
        total_transactions=total_transactions,
        total_amount=round(total_amount, 2),
        average_amount=round(average_amount, 2),
        providers_breakdown=providers_breakdown,
        waiters_breakdown=waiters_breakdown,
        timeline_breakdown=timeline_breakdown
    )

def get_dashboard_metrics(db: Session, current_user: User, branch_id: Optional[str] = None) -> DashboardMetricsResponse:
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)
    year_start = today.replace(month=1, day=1)

    # Scoped queries
    def get_period_stats(d_from: date, d_to: date):
        q = get_transactions_query(
            db=db,
            current_user=current_user,
            branch_id=branch_id,
            date_from=d_from,
            date_to=d_to
        )
        txs = q.all()
        return len(txs), sum(float(tx.amount or 0.0) for tx in txs)

    today_count, today_total = get_period_stats(today, today)
    week_count, week_total = get_period_stats(week_start, today)
    month_count, month_total = get_period_stats(month_start, today)
    year_count, year_total = get_period_stats(year_start, today)

    # Today's providers summary
    today_txs = get_transactions_query(
        db=db,
        current_user=current_user,
        branch_id=branch_id,
        date_from=today,
        date_to=today
    ).all()

    today_provider_map: Dict[str, Dict[str, Any]] = {}
    for tx in today_txs:
        p_code = tx.provider or "GENERIC"
        p_name = tx.provider_display_name or p_code
        if p_code not in today_provider_map:
            today_provider_map[p_code] = {"provider": p_code, "provider_display_name": p_name, "count": 0, "amount": 0.0}
        today_provider_map[p_code]["count"] += 1
        today_provider_map[p_code]["amount"] += float(tx.amount or 0.0)

    provider_summary_today = [
        ProviderReportSummary(
            provider=v["provider"],
            provider_display_name=v["provider_display_name"],
            transaction_count=v["count"],
            total_amount=round(v["amount"], 2),
            percentage_amount=round((v["amount"] / today_total * 100), 1) if today_total > 0 else 0.0,
            percentage_count=round((v["count"] / today_count * 100), 1) if today_count > 0 else 0.0
        )
        for v in sorted(today_provider_map.values(), key=lambda x: x["amount"], reverse=True)
    ]

    return DashboardMetricsResponse(
        today_total=round(today_total, 2),
        today_count=today_count,
        this_week_total=round(week_total, 2),
        this_week_count=week_count,
        this_month_total=round(month_total, 2),
        this_month_count=month_count,
        this_year_total=round(year_total, 2),
        this_year_count=year_count,
        provider_summary_today=provider_summary_today
    )
