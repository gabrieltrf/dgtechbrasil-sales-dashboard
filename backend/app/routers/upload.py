from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..crud import bulk_insert_sales, log_upload, get_upload_logs
from ..services.excel_parser import parse_excel
from ..schemas import UploadResult, UploadLogOut

router = APIRouter()


@router.post("/upload", response_model=UploadResult)
async def upload_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Apenas arquivos .xlsx ou .xls são aceitos.")

    content = await file.read()
    try:
        records = parse_excel(content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    inserted, skipped = bulk_insert_sales(db, records)
    log_upload(db, file.filename, len(records), inserted, skipped)

    return UploadResult(
        filename=file.filename,
        rows_parsed=len(records),
        rows_inserted=inserted,
        rows_skipped=skipped,
    )


@router.get("/uploads", response_model=list[UploadLogOut])
def list_uploads(db: Session = Depends(get_db)):
    return get_upload_logs(db)
