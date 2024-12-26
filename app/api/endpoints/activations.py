from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List
import uuid

from ...core.config import settings
from ...services.auth import auth_service
from ...services.database import get_db, ActivationDB, ModemDB
from ...services.smshub_integration import SMSHubIntegration
from ...services.monitoring import modem_metrics
from ...services.websocket import manager as ws_manager
from ...schemas.activation import (
    ActivationCreate,
    ActivationUpdate,
    ActivationInDB,
    ActivationWithMessages
)
from ...models.models import User, Activation, Modem, ModemStatus, ActivationStatus

router = APIRouter()

@router.get("/", response_model=List[ActivationInDB])
async def get_activations(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all activations."""
    activation_db = ActivationDB(Activation)
    return await activation_db.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=ActivationInDB)
async def create_activation(
    activation_in: ActivationCreate,
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create new activation."""
    # Check modem availability
    modem_db = ModemDB(Modem)
    modem = await modem_db.get(db, activation_in.modem_id)
    if not modem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modem not found"
        )
    
    if modem.status != ModemStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Modem is not active"
        )
    
    # Get number from SMS Hub
    async with SMSHubIntegration(settings.SMSHUB_API_KEY) as smshub:
        response = await smshub.get_number(
            country=activation_in.country,
            service=activation_in.service,
            operator=activation_in.operator
        )
        
        if response.status != "SUCCESS":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=response.error or "Failed to get number"
            )
    
    # Create activation
    activation_db = ActivationDB(Activation)
    activation_data = activation_in.model_dump()
    activation_data.update({
        "activation_id": response.activationId,
        "phone_number": response.number,
        "status": ActivationStatus.WAITING
    })
    
    activation = await activation_db.create(db, obj_in=activation_data)
    
    # Update modem status
    await modem_db.update(
        db,
        db_obj=modem,
        obj_in={"status": ModemStatus.BUSY}
    )
    
    # Update metrics
    modem_metrics.record_activation("waiting")
    modem_metrics.update_modem_status(
        modem.id,
        modem.port,
        ModemStatus.BUSY.value
    )
    
    # Send WebSocket updates
    await ws_manager.send_modem_update(
        modem.id,
        {"status": ModemStatus.BUSY.value}
    )
    await ws_manager.send_activation_update(
        activation.activation_id,
        {"status": ActivationStatus.WAITING.value}
    )
    
    return activation

@router.get("/{activation_id}", response_model=ActivationWithMessages)
async def get_activation(
    activation_id: str,
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get activation by ID with messages."""
    activation_db = ActivationDB(Activation)
    activation = await activation_db.get_by_activation_id(db, activation_id)
    if not activation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activation not found"
        )
    
    return activation

@router.put("/{activation_id}", response_model=ActivationInDB)
async def update_activation(
    activation_id: str,
    activation_in: ActivationUpdate,
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update activation status."""
    activation_db = ActivationDB(Activation)
    activation = await activation_db.get_by_activation_id(db, activation_id)
    if not activation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activation not found"
        )
    
    # Update SMS Hub
    async with SMSHubIntegration(settings.SMSHUB_API_KEY) as smshub:
        response = await smshub.finish_activation(
            activation_id=activation_id,
            status=activation_in.status
        )
        
        if response.status != "SUCCESS":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=response.error or "Failed to update activation"
            )
    
    # Update activation
    activation = await activation_db.update(
        db,
        db_obj=activation,
        obj_in={"status": activation_in.status}
    )
    
    # Update modem status if activation is completed/cancelled
    if activation_in.status in [
        ActivationStatus.COMPLETED,
        ActivationStatus.CANCELLED,
        ActivationStatus.REFUNDED
    ]:
        modem_db = ModemDB(Modem)
        modem = await modem_db.get(db, activation.modem_id)
        if modem:
            await modem_db.update(
                db,
                db_obj=modem,
                obj_in={"status": ModemStatus.ACTIVE}
            )
            
            # Update metrics
            modem_metrics.update_modem_status(
                modem.id,
                modem.port,
                ModemStatus.ACTIVE.value
            )
            
            # Send WebSocket update
            await ws_manager.send_modem_update(
                modem.id,
                {"status": ModemStatus.ACTIVE.value}
            )
    
    # Update metrics
    modem_metrics.record_activation(activation_in.status.name.lower())
    
    # Send WebSocket update
    await ws_manager.send_activation_update(
        activation_id,
        {"status": activation_in.status.value}
    )
    
    return activation

@router.delete("/{activation_id}")
async def delete_activation(
    activation_id: str,
    current_user: User = Depends(auth_service.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete activation (admin only)."""
    activation_db = ActivationDB(Activation)
    activation = await activation_db.get_by_activation_id(db, activation_id)
    if not activation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activation not found"
        )
    
    # Delete activation
    await activation_db.delete(db, id=activation.id)
    
    return {"message": "Activation deleted successfully"} 