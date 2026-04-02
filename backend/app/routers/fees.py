from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import FeeConfig

router = APIRouter(prefix="/fees")


class FeeIn(BaseModel):
    sku: str
    platform: str
    fee_percent: float = 0.0
    fee_fixed: float = 0.0


class FeeOut(FeeIn):
    id: int
    model_config = {"from_attributes": True}


@router.get("", response_model=list[FeeOut])
def list_fees(db: Session = Depends(get_db)):
    return db.query(FeeConfig).order_by(FeeConfig.sku, FeeConfig.platform).all()


@router.put("", response_model=list[FeeOut])
def upsert_fees(fees: list[FeeIn], db: Session = Depends(get_db)):
    """Recebe a lista completa de taxas e faz upsert."""
    for f in fees:
        existing = (
            db.query(FeeConfig)
            .filter(FeeConfig.sku == f.sku, FeeConfig.platform == f.platform)
            .first()
        )
        if existing:
            existing.fee_percent = f.fee_percent
            existing.fee_fixed   = f.fee_fixed
        else:
            db.add(FeeConfig(
                sku=f.sku,
                platform=f.platform,
                fee_percent=f.fee_percent,
                fee_fixed=f.fee_fixed,
            ))
    db.commit()
    return db.query(FeeConfig).order_by(FeeConfig.sku, FeeConfig.platform).all()


@router.get("/skus-platforms")
def skus_platforms(db: Session = Depends(get_db)):
    """Lista todas as combinações únicas de SKU × plataforma presentes nas vendas."""
    rows = db.execute(text(
        "SELECT DISTINCT sku, platform FROM sales ORDER BY sku, platform"
    )).fetchall()
    result = []
    for sku, platform in rows:
        fee = (
            db.query(FeeConfig)
            .filter(FeeConfig.sku == sku, FeeConfig.platform == platform)
            .first()
        )
        result.append({
            "sku": sku,
            "platform": platform,
            "fee_percent": fee.fee_percent if fee else 0.0,
            "fee_fixed":   fee.fee_fixed   if fee else 0.0,
        })
    return result
