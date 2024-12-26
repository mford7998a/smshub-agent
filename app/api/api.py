from fastapi import APIRouter
from .endpoints import auth, modems, activations, sms, users, monitoring

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(modems.router, prefix="/modems", tags=["Modems"])
api_router.include_router(activations.router, prefix="/activations", tags=["Activations"])
api_router.include_router(sms.router, prefix="/sms", tags=["SMS"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["Monitoring"]) 