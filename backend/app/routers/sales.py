from typing import Optional
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..crud import get_sales_page, export_sales_csv
from ..schemas import SalesPage

router = APIRouter(prefix="/sales")


def _filters(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    platform: Optional[str] = None,
    uf: Optional[str] = None,
    sku: Optional[str] = None,
) -> dict:
    return {k: v for k, v in locals().items() if v is not None}


@router.get("", response_model=SalesPage)
def list_sales(
    page: int = 1,
    page_size: int = 50,
    filters: dict = Depends(_filters),
    db: Session = Depends(get_db),
):
    total, items = get_sales_page(db, filters, page, page_size)
    return SalesPage(total=total, page=page, page_size=page_size, items=items)


@router.get("/export")
def export_csv(filters: dict = Depends(_filters), db: Session = Depends(get_db)):
    csv_data = export_sales_csv(db, filters)
    return Response(
        content=csv_data.encode("utf-8-sig"),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vendas.csv"},
    )
