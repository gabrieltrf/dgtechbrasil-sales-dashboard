# DGTechBrasil Sales Dashboard

## Visão Geral

Dashboard web para análise de vendas da DGTechBrasil. Importa relatórios Excel do ERP, acumula histórico no banco e exibe métricas de faturamento, lucro, margens e taxas de plataforma (Mercado Livre, Amazon).

## Stack

| Camada    | Tecnologia                              |
|-----------|-----------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS + Recharts |
| Backend   | FastAPI + SQLAlchemy + SQLite           |
| Parser    | pandas + openpyxl                       |
| Deploy    | Docker Compose (Oracle VPS)             |

## Estrutura

```
sales-dashboard/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI + CORS + routers
│   │   ├── database.py          # SQLAlchemy engine/session
│   │   ├── models.py            # Sale, FeeConfig, UploadLog
│   │   ├── schemas.py           # Pydantic I/O schemas
│   │   ├── crud.py              # bulk insert, paginação, CSV export
│   │   ├── routers/
│   │   │   ├── upload.py        # POST /api/upload
│   │   │   ├── metrics.py       # GET /api/metrics/*
│   │   │   ├── sales.py         # GET /api/sales
│   │   │   └── fees.py          # GET/PUT /api/fees
│   │   └── services/
│   │       ├── excel_parser.py  # pandas: parse + métricas derivadas
│   │       └── metrics_service.py # SQL com JOIN fee_configs
│   ├── data/                    # SQLite (volume bind-mount no Docker)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Router + Sidebar
│   │   ├── api/client.js        # axios + endpoints
│   │   ├── utils/formatters.js  # formatBRL, formatPct, formatDate
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # KPIs + 4 gráficos + filtros
│   │   │   ├── Tabela.jsx       # Tabela paginada + filtros + CSV
│   │   │   ├── Taxas.jsx        # Configuração de taxas por SKU
│   │   │   └── Upload.jsx       # Drag & drop + histórico
│   │   └── components/
│   │       ├── cards/KpiCard.jsx
│   │       ├── charts/          # Recharts: line, pie, bar
│   │       └── upload/          # UploadZone, UploadHistory
│   ├── nginx.conf               # Proxy /api/ → backend + SPA fallback
│   └── Dockerfile               # Multi-stage: build → nginx
└── docker-compose.yml
```

## Banco de Dados

### `sales`
Vendas importadas do ERP. Unique constraint em (date, sku, uf, platform, qty, prices) para deduplicação automática.

Campos computados armazenados na inserção: `gross_profit`, `net_profit`, `gross_margin`, `net_margin`.

### `fee_configs`
Taxa de plataforma por SKU × plataforma.
- `fee_percent`: % sobre o valor total da venda
- `fee_fixed`: valor fixo por **unidade** vendida (ex: R$ 6,65)

### `upload_logs`
Histórico de uploads com contagem de linhas inseridas/duplicatas.

## Métricas Principais

| Métrica | Fórmula |
|---------|---------|
| Faturamento | `SUM(total_value)` |
| Custo dos Produtos | `SUM(cost_price × quantity)` |
| Lucro Bruto | `total_value − custo` |
| Lucro Líquido | `lucro_bruto − shipping` |
| Taxa de Plataforma | `total_value × fee% + quantity × fee_fixed` |
| **Lucro Real** | `lucro_bruto − shipping − taxa_plataforma` |
| Margem Real | `lucro_real / faturamento × 100` |

## Formato do Excel (ERP)

Colunas esperadas (ordem não importa, nomes exatos):
- `UF`, `Data da venda` (DD/MM/YYYY), `E-commerce`, `Código (SKU)`
- `Quantidade de produtos`, `Preço unitário`, `Valor total da venda`
- `Preço de custo`, `Frete no e-commerce`

Plataformas reconhecidas: `Mercado Livre`, `Mercado Livre Fulfillment`, `Amazon`

## Rodando Localmente

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (outro terminal)
cd frontend
npm install
npm run dev   # porta 3000 — proxy /api/ → :8000
```

## Deploy no Oracle VPS

```bash
# Instalar Docker (uma vez)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Abrir porta 80 no Security List do Oracle Cloud Console

# Deploy
git clone <repo> && cd sales-dashboard
docker compose up -d --build

# Atualizar
git pull && docker compose up -d --build

# Backup do banco
cp ./backend/data/sales.db ./backup/sales-$(date +%Y%m%d).db
```

## Variáveis de Ambiente

| Variável | Default | Descrição |
|----------|---------|-----------|
| `DATABASE_URL` | `sqlite:///./data/sales.db` | Conexão SQLite |

## Notas de Implementação

- **Parser decimal**: o Excel do ERP usa ponto como decimal (float nativo). A função `_clean_numeric` só converte vírgula→ponto se houver vírgula na string — evita corromper valores como `38.9 → 389`.
- **Deduplicação**: `INSERT OR IGNORE` com unique constraint composta — seguro para uploads repetidos do mesmo período.
- **Taxas no SQL**: calculadas via `LEFT JOIN fee_configs` em todas as queries de métricas — sem dados estáticos no banco de vendas.
- **nginx**: frontend proxeia `/api/` para o container backend — sem CORS em produção.
