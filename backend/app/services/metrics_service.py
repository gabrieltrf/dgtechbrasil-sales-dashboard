from sqlalchemy import text
from sqlalchemy.orm import Session

# Subquery que calcula taxa de plataforma via LEFT JOIN com fee_configs
_FEE_JOIN = """
    LEFT JOIN fee_configs f ON f.sku = s.sku AND f.platform = s.platform
"""

_TAXA_EXPR  = "COALESCE(f.fee_percent, 0) * s.total_value / 100.0 + COALESCE(f.fee_fixed, 0) * s.quantity"
_OP_EXPR    = "(SELECT COALESCE(SUM(amount), 0) FROM operational_costs WHERE cost_type='per_unit' AND active=1)"
_LUCRO_REAL = f"s.gross_profit - ({_TAXA_EXPR}) - ({_OP_EXPR}) * s.quantity"


def _build_where(filters: dict, prefix: str = "") -> tuple[str, dict]:
    clauses = []
    params  = {}
    p = f"{prefix}." if prefix else ""
    if filters.get("date_from"):
        clauses.append(f"{p}sale_date >= :date_from")
        params["date_from"] = filters["date_from"]
    if filters.get("date_to"):
        clauses.append(f"{p}sale_date <= :date_to")
        params["date_to"] = filters["date_to"]
    if filters.get("platform"):
        clauses.append(f"{p}platform = :platform")
        params["platform"] = filters["platform"]
    if filters.get("uf"):
        clauses.append(f"{p}uf = :uf")
        params["uf"] = filters["uf"]
    if filters.get("sku"):
        clauses.append(f"{p}sku = :sku")
        params["sku"] = filters["sku"]
    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    return where, params


def get_summary(db: Session, filters: dict) -> dict:
    where, params = _build_where(filters, prefix="s")
    row = db.execute(text(f"""
        SELECT
            COALESCE(SUM(s.total_value), 0)                    AS faturamento,
            COALESCE(SUM(s.cost_price * s.quantity), 0)        AS custo_produtos,
            COALESCE(SUM(s.gross_profit), 0)                   AS lucro_bruto,
            COALESCE(SUM(s.net_profit), 0)                     AS lucro_liquido,
            COALESCE(SUM({_TAXA_EXPR}), 0)                     AS taxa_plataforma,
            COALESCE(SUM({_LUCRO_REAL}), 0)                    AS lucro_real,
            CASE WHEN SUM(s.total_value) > 0
                 THEN SUM(s.gross_profit) / SUM(s.total_value) * 100 ELSE 0
            END AS margem_bruta,
            CASE WHEN SUM(s.total_value) > 0
                 THEN SUM(s.net_profit) / SUM(s.total_value) * 100 ELSE 0
            END AS margem_liquida,
            CASE WHEN SUM(s.total_value) > 0
                 THEN SUM({_LUCRO_REAL}) / SUM(s.total_value) * 100 ELSE 0
            END AS margem_real,
            CASE WHEN COUNT(*) > 0
                 THEN SUM(s.total_value) / COUNT(*) ELSE 0
            END AS ticket_medio,
            COALESCE(SUM(s.quantity), 0) AS unidades_vendidas,
            COUNT(*) AS num_vendas,
            COALESCE(SUM(({_OP_EXPR}) * s.quantity), 0) AS custo_operacional
        FROM sales s {_FEE_JOIN} {where}
    """), params).fetchone()
    return dict(row._mapping)


def get_revenue_by_month(db: Session, filters: dict) -> list[dict]:
    where, params = _build_where(filters, prefix="s")
    rows = db.execute(text(f"""
        SELECT
            strftime('%Y-%m', s.sale_date)  AS mes,
            SUM(s.total_value)              AS faturamento,
            SUM(s.gross_profit)             AS lucro_bruto,
            SUM(s.net_profit)               AS lucro_liquido,
            SUM({_LUCRO_REAL})              AS lucro_real
        FROM sales s {_FEE_JOIN} {where}
        GROUP BY mes
        ORDER BY mes ASC
    """), params).fetchall()
    return [dict(r._mapping) for r in rows]


def get_revenue_by_platform(db: Session, filters: dict) -> list[dict]:
    where, params = _build_where(filters, prefix="s")
    rows = db.execute(text(f"""
        SELECT
            s.platform,
            SUM(s.total_value)   AS faturamento,
            SUM(s.gross_profit)  AS lucro_bruto,
            SUM({_LUCRO_REAL})   AS lucro_real,
            COUNT(*)             AS num_vendas
        FROM sales s {_FEE_JOIN} {where}
        GROUP BY s.platform
        ORDER BY faturamento DESC
    """), params).fetchall()
    return [dict(r._mapping) for r in rows]


def get_top_skus(db: Session, filters: dict, limit: int = 10) -> list[dict]:
    where, params = _build_where(filters, prefix="s")
    params["limit"] = limit
    rows = db.execute(text(f"""
        SELECT
            s.sku,
            SUM(s.total_value)   AS faturamento,
            SUM(s.gross_profit)  AS lucro_bruto,
            SUM({_LUCRO_REAL})   AS lucro_real,
            SUM(s.quantity)      AS unidades
        FROM sales s {_FEE_JOIN} {where}
        GROUP BY s.sku
        ORDER BY faturamento DESC
        LIMIT :limit
    """), params).fetchall()
    return [dict(r._mapping) for r in rows]


def get_sales_by_state(db: Session, filters: dict) -> list[dict]:
    where, params = _build_where(filters, prefix="s")
    rows = db.execute(text(f"""
        SELECT
            s.uf,
            SUM(s.total_value) AS faturamento,
            COUNT(*)           AS num_vendas
        FROM sales s {_FEE_JOIN} {where}
        GROUP BY s.uf
        ORDER BY faturamento DESC
    """), params).fetchall()
    return [dict(r._mapping) for r in rows]


def get_filter_options(db: Session) -> dict:
    platforms = [r[0] for r in db.execute(text("SELECT DISTINCT platform FROM sales ORDER BY platform")).fetchall()]
    ufs       = [r[0] for r in db.execute(text("SELECT DISTINCT uf FROM sales ORDER BY uf")).fetchall()]
    skus      = [r[0] for r in db.execute(text("SELECT DISTINCT sku FROM sales ORDER BY sku")).fetchall()]
    date_row  = db.execute(text("SELECT MIN(sale_date), MAX(sale_date) FROM sales")).fetchone()
    return {
        "platforms": platforms,
        "ufs": ufs,
        "skus": skus,
        "date_min": str(date_row[0]) if date_row[0] else None,
        "date_max": str(date_row[1]) if date_row[1] else None,
    }


def get_month_comparison(db: Session, filters: dict) -> dict:
    """Retorna comparativo entre o mês mais recente e o anterior."""
    rows = get_revenue_by_month(db, filters)
    if not rows:
        return {"current": None, "previous": None, "faturamento_change": None, "lucro_real_change": None}
    current  = rows[-1]
    previous = rows[-2] if len(rows) >= 2 else None

    def pct_change(cur, prev, key):
        if prev is None or prev.get(key, 0) == 0:
            return None
        return round((cur[key] - prev[key]) / abs(prev[key]) * 100, 2)

    return {
        "current":           current,
        "previous":          previous,
        "faturamento_change": pct_change(current, previous, "faturamento"),
        "lucro_real_change":  pct_change(current, previous, "lucro_real"),
    }


def get_margin_ranking(db: Session, filters: dict) -> list[dict]:
    """Todos os SKUs ordenados por margem real ASC (piores primeiro)."""
    where, params = _build_where(filters, prefix="s")
    rows = db.execute(text(f"""
        SELECT
            s.sku,
            SUM(s.total_value)   AS faturamento,
            SUM(s.quantity)      AS unidades,
            SUM({_LUCRO_REAL})   AS lucro_real,
            CASE WHEN SUM(s.total_value) > 0
                 THEN SUM({_LUCRO_REAL}) / SUM(s.total_value) * 100
                 ELSE 0 END      AS margem_real
        FROM sales s {_FEE_JOIN} {where}
        GROUP BY s.sku
        ORDER BY margem_real ASC
    """), params).fetchall()
    return [dict(r._mapping) for r in rows]
