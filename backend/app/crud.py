from datetime import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session
from .models import UploadLog


def bulk_insert_sales(db: Session, records: list[dict]) -> tuple[int, int]:
    if not records:
        return 0, 0

    insert_sql = text("""
        INSERT OR IGNORE INTO sales
            (uf, sale_date, platform, sku, quantity, unit_price,
             total_value, cost_price, shipping,
             gross_profit, net_profit, gross_margin, net_margin)
        VALUES
            (:uf, :sale_date, :platform, :sku, :quantity, :unit_price,
             :total_value, :cost_price, :shipping,
             :gross_profit, :net_profit, :gross_margin, :net_margin)
    """)

    # convert date objects to ISO strings for SQLite
    for r in records:
        if hasattr(r.get("sale_date"), "isoformat"):
            r["sale_date"] = r["sale_date"].isoformat()

    result = db.execute(insert_sql, records)
    db.commit()
    inserted = result.rowcount
    skipped = len(records) - inserted
    return inserted, skipped


def log_upload(db: Session, filename: str, rows_parsed: int, rows_inserted: int, rows_skipped: int) -> UploadLog:
    entry = UploadLog(
        filename=filename,
        uploaded_at=datetime.utcnow(),
        rows_parsed=rows_parsed,
        rows_inserted=rows_inserted,
        rows_skipped=rows_skipped,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_upload_logs(db: Session, limit: int = 20) -> list[UploadLog]:
    return db.query(UploadLog).order_by(UploadLog.uploaded_at.desc()).limit(limit).all()


_FEE_JOIN  = "LEFT JOIN fee_configs f ON f.sku = s.sku AND f.platform = s.platform"
_TAXA_EXPR = "COALESCE(f.fee_percent, 0) * s.total_value / 100.0 + COALESCE(f.fee_fixed, 0) * s.quantity"


def get_sales_page(db: Session, filters: dict, page: int, page_size: int):
    from .services.metrics_service import _build_where
    where, params = _build_where(filters, prefix="s")

    total_row = db.execute(
        text(f"SELECT COUNT(*) FROM sales s {_FEE_JOIN} {where}"), params
    ).fetchone()
    total = total_row[0]

    params["limit"]  = page_size
    params["offset"] = (page - 1) * page_size

    rows = db.execute(text(f"""
        SELECT
            s.*,
            ({_TAXA_EXPR})                                 AS taxa_plataforma,
            s.gross_profit - ({_TAXA_EXPR})                AS lucro_real,
            CASE WHEN s.total_value > 0
                 THEN (s.gross_profit - ({_TAXA_EXPR})) / s.total_value * 100
                 ELSE 0 END                                AS margem_real
        FROM sales s {_FEE_JOIN} {where}
        ORDER BY s.sale_date DESC, s.id DESC
        LIMIT :limit OFFSET :offset
    """), params).fetchall()

    return total, [dict(r._mapping) for r in rows]


def export_sales_csv(db: Session, filters: dict) -> str:
    from .services.metrics_service import _build_where
    import csv, io
    where, params = _build_where(filters, prefix="s")
    rows = db.execute(text(f"""
        SELECT s.uf, s.sale_date, s.platform, s.sku, s.quantity, s.unit_price,
               s.total_value, s.cost_price, s.shipping,
               s.gross_profit, s.net_profit,
               ({_TAXA_EXPR}) AS taxa_plataforma,
               s.gross_profit - ({_TAXA_EXPR}) AS lucro_real,
               s.gross_margin,
               CASE WHEN s.total_value > 0
                    THEN (s.gross_profit - ({_TAXA_EXPR})) / s.total_value * 100
                    ELSE 0 END AS margem_real
        FROM sales s {_FEE_JOIN} {where}
        ORDER BY s.sale_date DESC
    """), params).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["UF", "Data", "Plataforma", "SKU", "Qtd", "Preço Unit.",
                     "Total", "Custo", "Frete", "Lucro Bruto", "Lucro c/ Frete",
                     "Taxa Plataforma", "Lucro Real", "Margem Bruta %", "Margem Real %"])
    for r in rows:
        writer.writerow(list(r))
    return output.getvalue()
