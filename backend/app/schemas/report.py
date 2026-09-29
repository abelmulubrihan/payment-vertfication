from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date

class ProviderReportSummary(BaseModel):
    provider: str
    provider_display_name: str
    transaction_count: int
    total_amount: float
    percentage_amount: float
    percentage_count: float

class WaiterReportSummary(BaseModel):
    user_id: Optional[str] = None
    waiter_name: str
    transaction_count: int
    total_amount: float

class TimeSeriesPoint(BaseModel):
    label: str  # e.g. "10:00 AM", "Monday", "2026-09-28", "September"
    date_key: Optional[str] = None
    transaction_count: int
    total_amount: float

class ReportResponse(BaseModel):
    period_type: str  # daily, weekly, monthly, yearly, custom
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    restaurant_name: Optional[str] = None
    branch_name: Optional[str] = None
    
    total_transactions: int
    total_amount: float
    average_amount: float
    
    providers_breakdown: List[ProviderReportSummary]
    waiters_breakdown: List[WaiterReportSummary]
    timeline_breakdown: List[TimeSeriesPoint]

class DashboardMetricsResponse(BaseModel):
    today_total: float
    today_count: int
    
    this_week_total: float
    this_week_count: int
    
    this_month_total: float
    this_month_count: int
    
    this_year_total: float
    this_year_count: int
    
    provider_summary_today: List[ProviderReportSummary]
    recent_transactions: List[Any] = []
