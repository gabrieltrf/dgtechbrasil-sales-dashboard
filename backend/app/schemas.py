from datetime import date, datetime
from pydantic import BaseModel


class UploadResult(BaseModel):
    filename: str
    rows_parsed: int
    rows_inserted: int
    rows_skipped: int


class UploadLogOut(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    rows_parsed: int
    rows_inserted: int
    rows_skipped: int

    model_config = {"from_attributes": True}


class MetricsSummary(BaseModel):
    faturamento: float
    custo_produtos: float
    lucro_bruto: float
    lucro_liquido: float
    taxa_plataforma: float
    lucro_real: float
    custo_operacional: float
    margem_bruta: float
    margem_liquida: float
    margem_real: float
    ticket_medio: float
    unidades_vendidas: int
    num_vendas: int


class RevenueByMonth(BaseModel):
    mes: str
    faturamento: float
    lucro_bruto: float
    lucro_liquido: float
    lucro_real: float


class RevenueByPlatform(BaseModel):
    platform: str
    faturamento: float
    lucro_bruto: float
    lucro_real: float
    num_vendas: int


class TopSku(BaseModel):
    sku: str
    faturamento: float
    lucro_bruto: float
    lucro_real: float
    unidades: int


class SalesByState(BaseModel):
    uf: str
    faturamento: float
    num_vendas: int


class SaleRow(BaseModel):
    id: int
    uf: str
    sale_date: date
    platform: str
    sku: str
    quantity: int
    unit_price: float
    total_value: float
    cost_price: float
    shipping: float
    gross_profit: float
    net_profit: float
    gross_margin: float
    net_margin: float

    model_config = {"from_attributes": True}


class SalesPage(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[SaleRow]


class OperationalCostIn(BaseModel):
    name: str
    cost_type: str = "per_unit"
    amount: float
    active: bool = True


class OperationalCostOut(OperationalCostIn):
    id: int

    model_config = {"from_attributes": True}


class MonthComparison(BaseModel):
    current: dict | None
    previous: dict | None
    faturamento_change: float | None
    lucro_real_change: float | None


class SkuMarginRanking(BaseModel):
    sku: str
    faturamento: float
    unidades: int
    lucro_real: float
    margem_real: float
