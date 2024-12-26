from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List
import uuid
from datetime import datetime

from ...core.config import settings
from ...services.auth import auth_service
from ...services.database import get_db, SMSMessageDB, ActivationDB
from ...services.smshub_integration import SMSHubIntegration
from ...services.monitoring import modem_metrics
from ...services.websocket import manager as ws_manager
from ...schemas.sms import (
    SMSMessageCreate,
    SMSMessageUpdate,
    SMSMessageInDB,
    SMSStats
)
from ...models.models import User, SMSMessage, Activation

router = APIRouter()

@router.get("/", response_model=List[SMSMessageInDB])
async def get_messages(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all SMS messages."""
    sms_db = SMSMessageDB(SMSMessage)
    return await sms_db.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=SMSMessageInDB)
async def create_message(
    message_in: SMSMessageCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create new SMS message and send to SMS Hub."""
    # Check activation exists
    activation_db = ActivationDB(Activation)
    activation = await activation_db.get(db, message_in.activation_id)
    if not activation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activation not found"
        )
    
    # Create SMS message
    sms_db = SMSMessageDB(SMSMessage)
    message_data = message_in.model_dump()
    message_data["sms_id"] = str(uuid.uuid4())
    
    message = await sms_db.create(db, obj_in=message_data)
    
    # Send message to SMS Hub in background
    background_tasks.add_task(
        send_message_to_smshub,
        message.id,
        message.sms_id,
        message.phone_to,
        message.phone_from,
        message.text
    )
    
    return message

@router.get("/undelivered", response_model=List[SMSMessageInDB])
async def get_undelivered_messages(
    limit: int = 100,
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get undelivered SMS messages."""
    sms_db = SMSMessageDB(SMSMessage)
    return await sms_db.get_undelivered(db, limit=limit)

@router.get("/{sms_id}", response_model=SMSMessageInDB)
async def get_message(
    sms_id: str,
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get SMS message by ID."""
    sms_db = SMSMessageDB(SMSMessage)
    message = await sms_db.get_by_sms_id(db, sms_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    return message

@router.put("/{sms_id}", response_model=SMSMessageInDB)
async def update_message(
    sms_id: str,
    message_in: SMSMessageUpdate,
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update SMS message status."""
    sms_db = SMSMessageDB(SMSMessage)
    message = await sms_db.get_by_sms_id(db, sms_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Update message
    message = await sms_db.update(
        db,
        db_obj=message,
        obj_in=message_in.model_dump(exclude_unset=True)
    )
    
    # Update metrics
    if message.delivered:
        modem_metrics.record_sms("delivered")
        delivery_time = (datetime.utcnow() - message.created_at).total_seconds()
        modem_metrics.record_sms_delivery_time(delivery_time)
    elif message.delivery_attempts > 0:
        modem_metrics.record_sms("failed")
    
    # Send WebSocket update
    await ws_manager.send_sms_update(
        sms_id,
        {
            "delivered": message.delivered,
            "delivery_attempts": message.delivery_attempts,
            "last_error": message.last_error
        }
    )
    
    return message

@router.delete("/{sms_id}")
async def delete_message(
    sms_id: str,
    current_user: User = Depends(auth_service.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete SMS message (admin only)."""
    sms_db = SMSMessageDB(SMSMessage)
    message = await sms_db.get_by_sms_id(db, sms_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    await sms_db.delete(db, id=message.id)
    return {"message": "Message deleted successfully"}

@router.get("/stats/{activation_id}", response_model=SMSStats)
async def get_activation_sms_stats(
    activation_id: int,
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get SMS statistics for an activation."""
    activation_db = ActivationDB(Activation)
    activation = await activation_db.get(db, activation_id)
    if not activation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activation not found"
        )
    
    messages = activation.sms_messages
    total_messages = len(messages)
    delivered_messages = sum(1 for m in messages if m.delivered)
    failed_messages = sum(1 for m in messages if not m.delivered and m.delivery_attempts > 0)
    
    # Calculate average delivery time
    delivery_times = [
        (m.updated_at - m.created_at).total_seconds()
        for m in messages
        if m.delivered
    ]
    average_delivery_time = (
        sum(delivery_times) / len(delivery_times)
        if delivery_times else 0
    )
    
    # Calculate success rate
    success_rate = (
        (delivered_messages / total_messages) * 100
        if total_messages > 0 else 0
    )
    
    return SMSStats(
        total_messages=total_messages,
        delivered_messages=delivered_messages,
        failed_messages=failed_messages,
        average_delivery_time=average_delivery_time,
        success_rate=success_rate
    )

async def send_message_to_smshub(
    message_id: int,
    sms_id: str,
    phone: str,
    phone_from: str,
    text: str
):
    """Send SMS message to SMS Hub."""
    async with AsyncSession(engine) as db:
        sms_db = SMSMessageDB(SMSMessage)
        message = await sms_db.get(db, message_id)
        if not message:
            return
        
        try:
            async with SMSHubIntegration(settings.SMSHUB_API_KEY) as smshub:
                response = await smshub.push_sms(
                    sms_id=sms_id,
                    phone=phone,
                    phone_from=phone_from,
                    text=text
                )
                
                if response.status == "SUCCESS":
                    await sms_db.update(
                        db,
                        db_obj=message,
                        obj_in={
                            "delivered": True,
                            "delivery_attempts": message.delivery_attempts + 1
                        }
                    )
                    
                    # Update metrics
                    modem_metrics.record_sms("delivered")
                    delivery_time = (datetime.utcnow() - message.created_at).total_seconds()
                    modem_metrics.record_sms_delivery_time(delivery_time)
                    
                else:
                    await sms_db.update(
                        db,
                        db_obj=message,
                        obj_in={
                            "delivery_attempts": message.delivery_attempts + 1,
                            "last_error": response.error
                        }
                    )
                    
                    # Update metrics
                    modem_metrics.record_sms("failed")
                
                # Send WebSocket update
                await ws_manager.send_sms_update(
                    sms_id,
                    {
                        "delivered": message.delivered,
                        "delivery_attempts": message.delivery_attempts,
                        "last_error": message.last_error
                    }
                )
                
        except Exception as e:
            logger.error(f"Failed to send SMS {sms_id} to SMS Hub: {str(e)}")
            await sms_db.update(
                db,
                db_obj=message,
                obj_in={
                    "delivery_attempts": message.delivery_attempts + 1,
                    "last_error": str(e)
                }
            ) 