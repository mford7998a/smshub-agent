from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SMSMessageBase(BaseModel):
    sms_id: str = Field(..., description="Unique SMS ID")
    phone_from: str = Field(..., description="Sender phone number or name")
    phone_to: str = Field(..., description="Recipient phone number")
    text: str = Field(..., description="SMS message content")

class SMSMessageCreate(SMSMessageBase):
    modem_id: int
    activation_id: int

class SMSMessageUpdate(BaseModel):
    delivered: bool = Field(..., description="Delivery status")
    delivery_attempts: Optional[int] = Field(None, description="Number of delivery attempts")
    last_error: Optional[str] = Field(None, description="Last error message if delivery failed")

class SMSMessageInDB(SMSMessageBase):
    id: int
    modem_id: int
    activation_id: int
    delivered: bool
    delivery_attempts: int
    last_error: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# SMS Hub API Request/Response models
class PushSMSRequest(BaseModel):
    action: str = "PUSH_SMS"
    key: str
    smsId: str
    phone: str
    phoneFrom: str
    text: str

class PushSMSResponse(BaseModel):
    status: str
    error: Optional[str]

class SMSStats(BaseModel):
    total_messages: int
    delivered_messages: int
    failed_messages: int
    average_delivery_time: float  # in seconds
    success_rate: float  # percentage 