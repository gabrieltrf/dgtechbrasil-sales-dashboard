import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import upload, metrics, sales, fees, operational_costs

Base.metadata.create_all(bind=engine)

app = FastAPI(title="DGTechBrasil Sales Dashboard", version="1.1.0")

_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
_origins = [o.strip() for o in _origins_env.split(",")] if _origins_env != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router,             prefix="/api")
app.include_router(metrics.router,            prefix="/api")
app.include_router(sales.router,              prefix="/api")
app.include_router(fees.router,               prefix="/api")
app.include_router(operational_costs.router,  prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
