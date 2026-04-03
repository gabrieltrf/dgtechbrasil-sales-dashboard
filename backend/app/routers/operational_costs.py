from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import OperationalCost
from ..schemas import OperationalCostIn, OperationalCostOut

router = APIRouter(prefix="/operational-costs", tags=["operational-costs"])


@router.get("", response_model=list[OperationalCostOut])
def list_costs(db: Session = Depends(get_db)):
    return db.query(OperationalCost).order_by(OperationalCost.id).all()


@router.post("", response_model=OperationalCostOut, status_code=201)
def create_cost(payload: OperationalCostIn, db: Session = Depends(get_db)):
    obj = OperationalCost(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{cost_id}", response_model=OperationalCostOut)
def update_cost(cost_id: int, payload: OperationalCostIn, db: Session = Depends(get_db)):
    obj = db.get(OperationalCost, cost_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Custo não encontrado")
    for k, v in payload.model_dump().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{cost_id}", status_code=204)
def delete_cost(cost_id: int, db: Session = Depends(get_db)):
    obj = db.get(OperationalCost, cost_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Custo não encontrado")
    db.delete(obj)
    db.commit()
