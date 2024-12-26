from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List
import asyncio

from ...core.config import settings
from ...services.auth import auth_service
from ...services.database import get_db, ModemDB
from ...services.modem_manager import ModemManager, ModemError
from ...services.monitoring import modem_metrics
from ...services.websocket import manager as ws_manager
from ...schemas.modem import (
    ModemCreate,
    ModemUpdate,
    ModemInDB,
    ModemWithStats,
    ModemStats
)
from ...models.models import User, Modem, ModemStatus

router = APIRouter()

@router.get("/", response_model=List[ModemInDB])
async def get_modems(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all modems."""
    modem_db = ModemDB(Modem)
    return await modem_db.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=ModemInDB)
async def create_modem(
    modem_in: ModemCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(auth_service.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create new modem."""
    modem_db = ModemDB(Modem)
    
    # Check if modem with same port exists
    existing_modem = await modem_db.get_by_port(db, modem_in.port)
    if existing_modem:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Modem with port {modem_in.port} already exists"
        )
    
    # Create modem
    modem = await modem_db.create(db, obj_in=modem_in.model_dump())
    
    # Start modem initialization in background
    background_tasks.add_task(
        initialize_modem,
        modem.id,
        modem.port
    )
    
    return modem

@router.get("/{modem_id}", response_model=ModemWithStats)
async def get_modem(
    modem_id: int,
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get modem by ID with stats."""
    modem_db = ModemDB(Modem)
    modem = await modem_db.get(db, modem_id)
    if not modem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modem not found"
        )
    
    # Get modem stats
    stats = await get_modem_stats(modem, db)
    
    return ModemWithStats(
        **modem.__dict__,
        stats=stats
    )

@router.put("/{modem_id}", response_model=ModemInDB)
async def update_modem(
    modem_id: int,
    modem_in: ModemUpdate,
    current_user: User = Depends(auth_service.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update modem."""
    modem_db = ModemDB(Modem)
    modem = await modem_db.get(db, modem_id)
    if not modem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modem not found"
        )
    
    # Update modem
    modem = await modem_db.update(
        db,
        db_obj=modem,
        obj_in=modem_in.model_dump(exclude_unset=True)
    )
    
    # Update metrics
    modem_metrics.update_modem_status(
        modem.id,
        modem.port,
        modem.status.value
    )
    if modem.signal_quality is not None:
        modem_metrics.update_signal_quality(
            modem.id,
            modem.port,
            modem.signal_quality
        )
    
    # Send WebSocket update
    await ws_manager.send_modem_update(
        modem.id,
        {"status": modem.status.value}
    )
    
    return modem

@router.delete("/{modem_id}")
async def delete_modem(
    modem_id: int,
    current_user: User = Depends(auth_service.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete modem."""
    modem_db = ModemDB(Modem)
    modem = await modem_db.get(db, modem_id)
    if not modem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modem not found"
        )
    
    # Delete modem
    await modem_db.delete(db, id=modem_id)
    
    return {"message": "Modem deleted successfully"}

@router.post("/{modem_id}/connect")
async def connect_modem(
    modem_id: int,
    current_user: User = Depends(auth_service.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Connect to modem."""
    modem_db = ModemDB(Modem)
    modem = await modem_db.get(db, modem_id)
    if not modem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modem not found"
        )
    
    try:
        # Initialize modem
        await initialize_modem(modem.id, modem.port)
        return {"message": "Modem connected successfully"}
        
    except ModemError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{modem_id}/disconnect")
async def disconnect_modem(
    modem_id: int,
    current_user: User = Depends(auth_service.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Disconnect from modem."""
    modem_db = ModemDB(Modem)
    modem = await modem_db.get(db, modem_id)
    if not modem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modem not found"
        )
    
    try:
        manager = ModemManager(modem.port)
        await manager.disconnect()
        
        # Update modem status
        await modem_db.update(
            db,
            db_obj=modem,
            obj_in={"status": ModemStatus.OFFLINE}
        )
        
        # Update metrics
        modem_metrics.update_modem_status(
            modem.id,
            modem.port,
            ModemStatus.OFFLINE.value
        )
        
        # Send WebSocket update
        await ws_manager.send_modem_update(
            modem.id,
            {"status": ModemStatus.OFFLINE.value}
        )
        
        return {"message": "Modem disconnected successfully"}
        
    except ModemError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

async def initialize_modem(modem_id: int, port: str):
    """Initialize modem and update its status."""
    modem_db = ModemDB(Modem)
    async with AsyncSession(engine) as db:
        modem = await modem_db.get(db, modem_id)
        if not modem:
            return
        
        try:
            manager = ModemManager(port)
            if await manager.connect():
                # Update modem info
                modem_info = manager.info
                await modem_db.update(
                    db,
                    db_obj=modem,
                    obj_in={
                        "status": ModemStatus.ACTIVE,
                        "signal_quality": modem_info["signal_quality"],
                        "imei": modem_info["imei"],
                        "iccid": modem_info["iccid"],
                        "operator": modem_info["operator"],
                        "phone_number": modem_info["phone_number"]
                    }
                )
                
                # Update metrics
                modem_metrics.update_modem_status(
                    modem.id,
                    port,
                    ModemStatus.ACTIVE.value
                )
                modem_metrics.update_signal_quality(
                    modem.id,
                    port,
                    modem_info["signal_quality"]
                )
                
                # Send WebSocket update
                await ws_manager.send_modem_update(
                    modem.id,
                    modem_info
                )
                
            else:
                await modem_db.update(
                    db,
                    db_obj=modem,
                    obj_in={"status": ModemStatus.ERROR}
                )
                
        except Exception as e:
            logger.error(f"Failed to initialize modem {port}: {str(e)}")
            await modem_db.update(
                db,
                db_obj=modem,
                obj_in={"status": ModemStatus.ERROR}
            )

async def get_modem_stats(modem: Modem, db: AsyncSession) -> ModemStats:
    """Get modem statistics."""
    total_activations = len(modem.activations)
    active_activations = sum(
        1 for a in modem.activations
        if a.status in [1, 2]  # WAITING or READY
    )
    total_sms = len(modem.sms_messages)
    total_sms_received = sum(
        1 for s in modem.sms_messages
        if s.delivered
    )
    
    # Calculate uptime (if modem is active)
    uptime_minutes = 0
    if modem.status == ModemStatus.ACTIVE:
        uptime = datetime.utcnow() - modem.updated_at
        uptime_minutes = uptime.total_seconds() / 60
    
    # Calculate average signal quality
    signal_qualities = [
        s.signal_quality for s in modem.signal_qualities
        if s.signal_quality is not None
    ]
    signal_quality_avg = (
        sum(signal_qualities) / len(signal_qualities)
        if signal_qualities else 0
    )
    
    return ModemStats(
        total_activations=total_activations,
        active_activations=active_activations,
        total_sms_sent=total_sms,
        total_sms_received=total_sms_received,
        uptime_minutes=uptime_minutes,
        signal_quality_avg=signal_quality_avg
    ) 