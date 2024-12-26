from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
import logging
import sys
import gzip

from .api import smshub, dashboard
from .database import engine, Base
from .config import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(settings.LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SMSHUB Agent",
    description="SMSHUB Agent API for handling SMS activations",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def gzip_middleware(request: Request, call_next):
    """Add gzip compression to responses"""
    response = await call_next(request)
    
    if "gzip" in request.headers.get("Accept-Encoding", ""):
        content = await response.body()
        compressed_content = gzip.compress(content)
        
        return Response(
            content=compressed_content,
            headers={
                **response.headers,
                "Content-Encoding": "gzip",
                "Content-Length": str(len(compressed_content))
            },
            status_code=response.status_code
        )
    
    return response

# Include routers
app.include_router(smshub)
app.include_router(dashboard)

# Error handling
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error handler caught: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "ERROR",
            "error": "Internal server error"
        }
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    ) 