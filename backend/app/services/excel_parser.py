import io
import pandas as pd

COLUMN_MAP = {
    "UF": "uf",
    "Data da venda": "sale_date",
    "E-commerce": "platform",
    "Código (SKU)": "sku",
    "Código": "sku",
    "Quantidade de produtos": "quantity",
    "Preço unitário": "unit_price",
    "Valor total da venda": "total_value",
    "Preço de custo": "cost_price",
    "Frete no e-commerce": "shipping",
}

NUMERIC_COLS = ["quantity", "unit_price", "total_value", "cost_price", "shipping"]


def _clean_numeric(series: pd.Series) -> pd.Series:
    s = series.astype(str).str.strip().str.replace(r"\s", "", regex=True).str.replace("R$", "", regex=False)
    # Brazilian format (e.g. "1.234,56"): has comma as decimal separator
    br_mask = s.str.contains(",", regex=False)
    s = s.copy()
    s[br_mask]  = s[br_mask].str.replace(".", "", regex=False).str.replace(",", ".", regex=False)
    # Remove any remaining non-numeric chars except dot and minus
    s = s.str.replace(r"[^\d\.\-]", "", regex=True)
    return s


def parse_excel(file_bytes: bytes) -> list[dict]:
    df = pd.read_excel(
        io.BytesIO(file_bytes),
        engine="openpyxl",
        dtype=str,
        keep_default_na=False,
    )

    df.columns = df.columns.str.strip()

    # rename columns (try exact match first, then partial)
    rename = {}
    for orig, mapped in COLUMN_MAP.items():
        if orig in df.columns:
            rename[orig] = mapped
    df = df.rename(columns=rename)

    required = ["uf", "sale_date", "platform", "sku", "quantity",
                "unit_price", "total_value", "cost_price", "shipping"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Colunas não encontradas no Excel: {missing}")

    # parse dates — DD/MM/YYYY text or Excel serial numbers
    raw_dates = df["sale_date"].copy()
    df["sale_date"] = pd.to_datetime(raw_dates, dayfirst=True, errors="coerce")

    # fallback: Excel date serials (5-digit integers stored as text)
    serial_mask = df["sale_date"].isna() & raw_dates.str.match(r"^\d{5}$", na=False)
    if serial_mask.any():
        df.loc[serial_mask, "sale_date"] = pd.to_datetime(
            pd.to_numeric(raw_dates[serial_mask]),
            unit="D",
            origin="1899-12-30",
        )

    df = df.dropna(subset=["sale_date"])
    df["sale_date"] = df["sale_date"].dt.tz_localize(None).dt.date

    for col in NUMERIC_COLS:
        df[col] = pd.to_numeric(_clean_numeric(df[col]), errors="coerce").fillna(0.0)

    df["quantity"] = df["quantity"].astype(int)

    df["uf"]       = df["uf"].str.strip().str.upper()
    df["platform"] = df["platform"].str.strip()
    df["sku"]      = df["sku"].str.strip()

    df["gross_profit"] = df["total_value"] - (df["cost_price"] * df["quantity"])
    df["net_profit"]   = df["gross_profit"] - df["shipping"]

    denom = df["total_value"].replace(0, float("nan"))
    df["gross_margin"] = (df["gross_profit"] / denom * 100).fillna(0.0)
    df["net_margin"]   = (df["net_profit"]   / denom * 100).fillna(0.0)

    return df[required + ["gross_profit", "net_profit", "gross_margin", "net_margin"]].to_dict(orient="records")
