from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, UniqueConstraint
from .database import Base


class Sale(Base):
    __tablename__ = "sales"

    id           = Column(Integer, primary_key=True, index=True)
    uf           = Column(String(2), nullable=False)
    sale_date    = Column(Date, nullable=False)
    platform     = Column(String(80), nullable=False)
    sku          = Column(String(100), nullable=False)
    quantity     = Column(Integer, nullable=False)
    unit_price   = Column(Float, nullable=False)
    total_value  = Column(Float, nullable=False)
    cost_price   = Column(Float, nullable=False)
    shipping     = Column(Float, nullable=False)
    gross_profit = Column(Float, nullable=False)
    net_profit   = Column(Float, nullable=False)
    gross_margin = Column(Float, nullable=False)
    net_margin   = Column(Float, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "sale_date", "sku", "uf", "platform",
            "quantity", "unit_price", "total_value",
            "cost_price", "shipping",
            name="uq_sale_composite",
        ),
    )


class FeeConfig(Base):
    """Taxa de plataforma por SKU × plataforma.
    fee_percent: percentual sobre o valor total da venda (ex: 11.5 para 11,5%)
    fee_fixed:   valor fixo por UNIDADE vendida (ex: 6.65)
    """
    __tablename__ = "fee_configs"

    id          = Column(Integer, primary_key=True, index=True)
    sku         = Column(String(100), nullable=False)
    platform    = Column(String(80), nullable=False)
    fee_percent = Column(Float, default=0.0, nullable=False)
    fee_fixed   = Column(Float, default=0.0, nullable=False)

    __table_args__ = (
        UniqueConstraint("sku", "platform", name="uq_fee_sku_platform"),
    )


class UploadLog(Base):
    __tablename__ = "upload_logs"

    id            = Column(Integer, primary_key=True, index=True)
    filename      = Column(String, nullable=False)
    uploaded_at   = Column(DateTime, default=datetime.utcnow)
    rows_parsed   = Column(Integer)
    rows_inserted = Column(Integer)
    rows_skipped  = Column(Integer)
