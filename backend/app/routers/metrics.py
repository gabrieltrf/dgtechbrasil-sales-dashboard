from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..services import metrics_service as svc
from ..schemas import MetricsSummary, RevenueByMonth, RevenueByPlatform, TopSku, SalesByState

router = APIRouter(prefix="/metrics")


def _filters(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    platform: Optional[str] = None,
    uf: Optional[str] = None,
    sku: Optional[str] = None,
) -> dict:
    return {k: v for k, v in locals().items() if v is not None}


@router.get("/summary", response_model=MetricsSummary)
def summary(filters: dict = Depends(_filters), db: Session = Depends(get_db)):
    return svc.get_summary(db, filters)


@router.get("/revenue-by-month", response_model=list[RevenueByMonth])
def revenue_by_month(filters: dict = Depends(_filters), db: Session = Depends(get_db)):
    return svc.get_revenue_by_month(db, filters)


@router.get("/revenue-by-platform", response_model=list[RevenueByPlatform])
def revenue_by_platform(filters: dict = Depends(_filters), db: Session = Depends(get_db)):
    return svc.get_revenue_by_platform(db, filters)


@router.get("/top-skus", response_model=list[TopSku])
def top_skus(limit: int = 10, filters: dict = Depends(_filters), db: Session = Depends(get_db)):
    return svc.get_top_skus(db, filters, limit)


@router.get("/sales-by-state", response_model=list[SalesByState])
def sales_by_state(filters: dict = Depends(_filters), db: Session = Depends(get_db)):
    return svc.get_sales_by_state(db, filters)


@router.get("/filter-options")
def filter_options(db: Session = Depends(get_db)):
    return svc.get_filter_options(db)
