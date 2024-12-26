from pydantic import BaseModel, Field
from typing import Optional
from enum import IntEnum
from datetime import datetime

class ActivationStatus(IntEnum):
    WAITING = 1
    READY = 2
    COMPLETED = 3
    CANCELLED = 4
    REFUNDED = 5
    ERROR = 6

class ActivationBase(BaseModel):
    activation_id: str = Field(..., description="Unique activation ID from SMS Hub")
    phone_number: str = Field(..., description="Phone number for activation")
    service: str = Field(..., description="Service code (e.g., 'vk', 'wa')")
    operator: str = Field(..., description="Network operator")
    country: str = Field(..., description="Country code")
    price: float = Field(..., description="Price for activation")
    currency: int = Field(..., description="Currency code (ISO 4217)")

class ActivationCreate(ActivationBase):
    modem_id: int = Field(..., description="ID of the modem to use")

class ActivationUpdate(BaseModel):
    status: ActivationStatus = Field(..., description="New activation status")

class ActivationInDB(ActivationBase):
    id: int
    modem_id: int
    status: ActivationStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ActivationWithMessages(ActivationInDB):
    sms_messages: list["SMSMessageInDB"] = []

    class Config:
        from_attributes = True

# Response models for SMS Hub API
class GetServicesResponse(BaseModel):
    status: str
    countryList: list[dict]

class GetNumberResponse(BaseModel):
    status: str
    number: Optional[str]
    activationId: Optional[str]
    error: Optional[str]

class FinishActivationResponse(BaseModel):
    status: str
    error: Optional[str] 