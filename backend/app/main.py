from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import invoices, settings

app = FastAPI(title="SVTL Billing System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    invoices.router,
    prefix="/api/invoices",
    tags=["Invoices"],
)

app.include_router(
    settings.router,
    prefix="/api/settings",
    tags=["Settings"],
)


@app.get("/")
def root():
    return {"message": "SVTL Billing System API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}