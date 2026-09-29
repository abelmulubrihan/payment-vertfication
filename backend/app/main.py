from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from backend.app.database.config import settings
from backend.app.database.database import Base, engine
from backend.app.api.auth import router as auth_router
from backend.app.api.qr import router as qr_router
from backend.app.api.transactions import router as transactions_router
from backend.app.api.reports import router as reports_router
from backend.app.api.users import router as users_router
from backend.app.api.branches import router as branches_router
from backend.app.api.audit_logs import router as audit_router
from backend.app.api.demo import router as demo_router

# Create DB tables automatically on startup for local dev & testing
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PayVerify Ethiopia API",
    description="QR-based payment receipt verification and transaction management system for restaurants in Ethiopia",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(qr_router, prefix=settings.API_V1_STR)
app.include_router(transactions_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(branches_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(demo_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": "PayVerify Ethiopia API",
        "status": "operational",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
