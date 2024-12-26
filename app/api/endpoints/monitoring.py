from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Dict, List
from datetime import datetime, timedelta

from ...core.config import settings
from ...services.auth import auth_service
from ...services.database import get_db, ModemDB, ActivationDB, SMSMessageDB
from ...services.monitoring import system_metrics, health_check, modem_metrics
from ...models.models import (
    User,
    Modem,
    Activation,
    SMSMessage,
    ModemStatus,
    ActivationStatus
)

router = APIRouter()

@router.get("/metrics")
async def get_metrics(
    current_user: User = Depends(auth_service.get_current_active_superuser)
) -> Dict[str, Any]:
    """Get system metrics."""
    return {
        "system": system_metrics.get_system_metrics(),
        "process": system_metrics.get_process_metrics()
    }

@router.get("/health")
async def get_health_status(
    current_user: User = Depends(auth_service.get_current_user)
) -> Dict[str, Any]:
    """Get system health status."""
    return await health_check.run_checks()

@router.get("/stats/modems")
async def get_modem_stats(
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get modem statistics."""
    modem_db = ModemDB(Modem)
    modems = await modem_db.get_multi(db)
    
    total_modems = len(modems)
    active_modems = sum(1 for m in modems if m.status == ModemStatus.ACTIVE)
    busy_modems = sum(1 for m in modems if m.status == ModemStatus.BUSY)
    error_modems = sum(1 for m in modems if m.status == ModemStatus.ERROR)
    
    # Calculate average signal quality
    signal_qualities = [
        m.signal_quality for m in modems
        if m.signal_quality is not None
    ]
    avg_signal_quality = (
        sum(signal_qualities) / len(signal_qualities)
        if signal_qualities else 0
    )
    
    return {
        "total": total_modems,
        "active": active_modems,
        "busy": busy_modems,
        "error": error_modems,
        "average_signal_quality": avg_signal_quality,
        "status_distribution": {
            "active": active_modems / total_modems if total_modems > 0 else 0,
            "busy": busy_modems / total_modems if total_modems > 0 else 0,
            "error": error_modems / total_modems if total_modems > 0 else 0,
            "offline": (total_modems - active_modems - busy_modems - error_modems) / total_modems if total_modems > 0 else 0
        }
    }

@router.get("/stats/activations")
async def get_activation_stats(
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get activation statistics."""
    activation_db = ActivationDB(Activation)
    activations = await activation_db.get_multi(db)
    
    total_activations = len(activations)
    status_counts = {
        status.name.lower(): sum(1 for a in activations if a.status == status)
        for status in ActivationStatus
    }
    
    # Calculate success rate
    completed = status_counts.get("completed", 0)
    success_rate = (completed / total_activations * 100) if total_activations > 0 else 0
    
    # Calculate average completion time for successful activations
    completion_times = [
        (a.updated_at - a.created_at).total_seconds()
        for a in activations
        if a.status == ActivationStatus.COMPLETED
    ]
    avg_completion_time = (
        sum(completion_times) / len(completion_times)
        if completion_times else 0
    )
    
    return {
        "total": total_activations,
        "status_distribution": {
            status: count / total_activations if total_activations > 0 else 0
            for status, count in status_counts.items()
        },
        "status_counts": status_counts,
        "success_rate": success_rate,
        "average_completion_time": avg_completion_time
    }

@router.get("/stats/sms")
async def get_sms_stats(
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get SMS statistics."""
    sms_db = SMSMessageDB(SMSMessage)
    messages = await sms_db.get_multi(db)
    
    total_messages = len(messages)
    delivered_messages = sum(1 for m in messages if m.delivered)
    failed_messages = sum(
        1 for m in messages
        if not m.delivered and m.delivery_attempts > 0
    )
    
    # Calculate delivery times
    delivery_times = [
        (m.updated_at - m.created_at).total_seconds()
        for m in messages
        if m.delivered
    ]
    avg_delivery_time = (
        sum(delivery_times) / len(delivery_times)
        if delivery_times else 0
    )
    
    # Calculate retry statistics
    retry_counts = [
        m.delivery_attempts for m in messages
        if m.delivery_attempts > 0
    ]
    avg_retries = (
        sum(retry_counts) / len(retry_counts)
        if retry_counts else 0
    )
    
    return {
        "total": total_messages,
        "delivered": delivered_messages,
        "failed": failed_messages,
        "pending": total_messages - delivered_messages - failed_messages,
        "success_rate": (delivered_messages / total_messages * 100) if total_messages > 0 else 0,
        "average_delivery_time": avg_delivery_time,
        "average_retries": avg_retries,
        "delivery_distribution": {
            "delivered": delivered_messages / total_messages if total_messages > 0 else 0,
            "failed": failed_messages / total_messages if total_messages > 0 else 0,
            "pending": (total_messages - delivered_messages - failed_messages) / total_messages if total_messages > 0 else 0
        }
    }

@router.get("/stats/hourly")
async def get_hourly_stats(
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get hourly statistics for the last 24 hours."""
    now = datetime.utcnow()
    start_time = now - timedelta(hours=24)
    
    # Get all records for the last 24 hours
    activation_db = ActivationDB(Activation)
    sms_db = SMSMessageDB(SMSMessage)
    
    activations = await activation_db.get_multi(
        db,
        query=select(Activation).where(Activation.created_at >= start_time)
    )
    messages = await sms_db.get_multi(
        db,
        query=select(SMSMessage).where(SMSMessage.created_at >= start_time)
    )
    
    # Initialize hourly buckets
    hours = range(24)
    stats = {hour: {
        "activations": 0,
        "sms_received": 0,
        "sms_delivered": 0
    } for hour in hours}
    
    # Process activations
    for activation in activations:
        hour = activation.created_at.hour
        stats[hour]["activations"] += 1
    
    # Process SMS messages
    for message in messages:
        hour = message.created_at.hour
        stats[hour]["sms_received"] += 1
        if message.delivered:
            stats[hour]["sms_delivered"] += 1
    
    return {
        "hourly_stats": stats,
        "current_hour": now.hour
    }

@router.get("/stats/errors")
async def get_error_stats(
    current_user: User = Depends(auth_service.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get error statistics."""
    # Get modems in error state
    modem_db = ModemDB(Modem)
    error_modems = await modem_db.get_multi(
        db,
        query=select(Modem).where(Modem.status == ModemStatus.ERROR)
    )
    
    # Get failed SMS messages
    sms_db = SMSMessageDB(SMSMessage)
    failed_messages = await sms_db.get_multi(
        db,
        query=select(SMSMessage).where(
            SMSMessage.delivered == False,
            SMSMessage.delivery_attempts > 0
        )
    )
    
    # Analyze error patterns
    error_patterns = {}
    for message in failed_messages:
        if message.last_error:
            error_patterns[message.last_error] = (
                error_patterns.get(message.last_error, 0) + 1
            )
    
    return {
        "error_modems": len(error_modems),
        "failed_messages": len(failed_messages),
        "error_patterns": error_patterns,
        "error_rate": {
            "messages": len(failed_messages) / len(messages) if messages else 0,
            "modems": len(error_modems) / len(modems) if modems else 0
        }
    } 