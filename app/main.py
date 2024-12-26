from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from prometheus_client import make_asgi_app
import logging
import logging.config
import yaml
from pathlib import Path
from typing import List

from .core.config import settings
from .api import api_router
from .services.websocket import manager
from .services.monitoring import health_check, system_metrics
from .services.auth import auth_service
from .models import models
from .services.database import engine

# Configure logging
logging_config = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": settings.LOG_FORMAT
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "stream": "ext://sys.stdout"
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "default",
            "filename": settings.LOG_FILE,
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5
        }
    },
    "root": {
        "level": settings.LOG_LEVEL,
        "handlers": ["console", "file"]
    }
}

logging.config.dictConfig(logging_config)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SMS Hub Physical Modem Integration System",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Mount Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Mount static files for frontend
app.mount("/static", StaticFiles(directory="frontend/build"), name="static")

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    try:
        # Create database tables
        async with engine.begin() as conn:
            await conn.run_sync(models.Base.metadata.create_all)
            
        # Load modem configuration
        if settings.MODEM_CONFIG_PATH.exists():
            with open(settings.MODEM_CONFIG_PATH) as f:
                modem_config = yaml.safe_load(f)
                logger.info(f"Loaded modem configuration: {modem_config}")
                
        # Add health checks
        health_check.add_check("database", check_database)
        health_check.add_check("redis", check_redis)
        health_check.add_check("sms_hub", check_sms_hub, critical=False)
        
        logger.info("Application startup complete")
        
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown."""
    try:
        # Close database connections
        await engine.dispose()
        logger.info("Application shutdown complete")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str,
    current_user = Depends(auth_service.get_current_user)
):
    """WebSocket endpoint for real-time updates."""
    try:
        await manager.handle_client(websocket, current_user.id)
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {current_user.id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")

@app.get("/health")
async def health():
    """Health check endpoint."""
    results = await health_check.run_checks()
    if results["status"] != "healthy":
        raise HTTPException(status_code=503, detail=results)
    return results

@app.get("/metrics/system")
async def get_system_metrics(
    current_user = Depends(auth_service.get_current_active_superuser)
):
    """Get system metrics."""
    return {
        "system": system_metrics.get_system_metrics(),
        "process": system_metrics.get_process_metrics()
    }

# Health check functions
async def check_database():
    """Check database connection."""
    async with engine.begin() as conn:
        await conn.execute("SELECT 1")

async def check_redis():
    """Check Redis connection."""
    # TODO: Implement Redis health check
    pass

async def check_sms_hub():
    """Check SMS Hub API connection."""
    # TODO: Implement SMS Hub API health check
    pass 