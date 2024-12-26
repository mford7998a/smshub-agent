from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from typing import List
import httpx
import json
from datetime import datetime
import asyncio

from ..database import get_db
from ..models import Modem, Activation, Message
from ..schemas.smshub import (
    GetServicesRequest, GetServicesResponse,
    GetNumberRequest, GetNumberResponse,
    FinishActivationRequest, FinishActivationResponse,
    PushSmsRequest, PushSmsResponse,
    Status, ActivationStatus
)
from ..config import settings

router = APIRouter(prefix="/api/smshub")

async def verify_api_key(key: str, db: Session):
    if key != settings.SMSHUB_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

@router.post("/services", response_model=GetServicesResponse)
async def get_services(
    request: GetServicesRequest,
    db: Session = Depends(get_db)
):
    await verify_api_key(request.key, db)

    # Get available modems grouped by country and operator
    result = {}
    modems = db.query(Modem).filter(
        Modem.status == 'active',
        Modem.is_online == True
    ).all()

    for modem in modems:
        if modem.country not in result:
            result[modem.country] = {}
        
        if modem.operator not in result[modem.country]:
            result[modem.country][modem.operator] = {
                "vk": 0, "ok": 0, "wa": 0  # Add more services as needed
            }
        
        # Increment available count for all services
        # In a real implementation, you might want to check which services each modem supports
        for service in result[modem.country][modem.operator]:
            result[modem.country][modem.operator][service] += 1

    # Format response
    country_list = [
        {
            "country": country,
            "operatorMap": operators
        }
        for country, operators in result.items()
    ]

    return GetServicesResponse(
        status=Status.SUCCESS,
        countryList=country_list
    )

@router.post("/number", response_model=GetNumberResponse)
async def get_number(
    request: GetNumberRequest,
    db: Session = Depends(get_db)
):
    await verify_api_key(request.key, db)

    # Find available modem
    query = db.query(Modem).filter(
        Modem.status == 'active',
        Modem.is_online == True,
        Modem.country == request.country,
        Modem.operator == request.operator
    )

    # Apply phone number exceptions
    if request.exceptionPhoneSet:
        for prefix in request.exceptionPhoneSet:
            query = query.filter(~Modem.phone_number.startswith(prefix))

    modem = query.first()

    if not modem:
        return GetNumberResponse(status=Status.NO_NUMBERS)

    # Create activation
    activation = Activation(
        modem_id=modem.id,
        service=request.service,
        phone_number=modem.phone_number,
        amount=request.sum,
        currency=request.currency
    )
    
    # Mark modem as busy
    modem.status = 'busy'
    
    db.add(activation)
    db.commit()

    return GetNumberResponse(
        status=Status.SUCCESS,
        number=int(modem.phone_number),
        activationId=activation.id
    )

@router.post("/finish", response_model=FinishActivationResponse)
async def finish_activation(
    request: FinishActivationRequest,
    db: Session = Depends(get_db)
):
    await verify_api_key(request.key, db)

    # Find activation
    activation = db.query(Activation).filter(
        Activation.id == request.activationId
    ).first()

    if not activation:
        return FinishActivationResponse(
            status=Status.ERROR,
            error="Activation not found"
        )

    # If already completed, return success (idempotency)
    if activation.is_completed:
        return FinishActivationResponse(status=Status.SUCCESS)

    # Update activation status
    activation.status = request.status
    activation.is_completed = True
    activation.completed_at = datetime.utcnow()

    # Free up the modem if activation is complete
    if activation.modem:
        activation.modem.status = 'active'

    db.commit()

    return FinishActivationResponse(status=Status.SUCCESS)

async def push_sms_with_retry(sms: Message, db: Session):
    """Push SMS to SMSHUB server with retry logic"""
    headers = {
        'Content-Type': 'application/json',
        'User-Agent': settings.USER_AGENT,
        'Accept-Encoding': 'gzip'
    }

    request_data = {
        'action': 'PUSH_SMS',
        'key': settings.SMSHUB_API_KEY,
        'smsId': sms.id,
        'phone': int(sms.phone_to),
        'phoneFrom': sms.phone_from,
        'text': sms.text
    }

    while not sms.is_delivered:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    'https://agent.unerio.com/agent/api/sms',
                    json=request_data,
                    headers=headers
                )
                
                data = response.json()
                
                if data.get('status') == 'SUCCESS':
                    sms.is_delivered = True
                    sms.delivered_at = datetime.utcnow()
                    db.commit()
                    return
                
        except Exception as e:
            pass  # Log error but continue retrying
        
        finally:
            sms.delivery_attempts += 1
            sms.last_attempt = datetime.utcnow()
            db.commit()
        
        # Wait 10 seconds before retrying
        await asyncio.sleep(10) 