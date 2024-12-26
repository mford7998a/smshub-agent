from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from enum import Enum
from datetime import datetime

class ModemStatus(str, Enum):
    ACTIVE = "active"
    BUSY = "busy"
    ERROR = "error"
    OFFLINE = "offline"

class ModemBase(BaseModel):
    port: str = Field(..., description="COM port or device path")
    phone_number: Optional[str] = Field(None, description="Phone number associated with the modem")
    operator: Optional[str] = Field(None, description="Network operator")
    country: Optional[str] = Field(None, description="Country code")
    config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional configuration")

class ModemCreate(ModemBase):
    pass

class ModemUpdate(ModemBase):
    status: Optional[ModemStatus] = None
    signal_quality: Optional[int] = Field(None, ge=0, le=100, description="Signal quality percentage")
    imei: Optional[str] = None
    iccid: Optional[str] = None

class ModemInDB(ModemBase):
    id: int
    status: ModemStatus
    signal_quality: Optional[int]
    imei: Optional[str]
    iccid: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ModemStats(BaseModel):
    total_activations: int
    active_activations: int
    total_sms_sent: int
    total_sms_received: int
    uptime_minutes: float
    signal_quality_avg: float

class ModemWithStats(ModemInDB):
    stats: ModemStats

    class Config:
        from_attributes = True 