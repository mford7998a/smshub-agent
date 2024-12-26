from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Optional, Union
from enum import Enum
from datetime import datetime

class Status(str, Enum):
    SUCCESS = "SUCCESS"
    ERROR = "ERROR"
    NO_NUMBERS = "NO_NUMBERS"

class ActivationStatus(int, Enum):
    CANCEL_SERVICE = 1    # No longer provide numbers for that service
    SUCCESS = 3          # Successfully sold
    CANCEL = 4          # Cancelled
    REFUND = 5          # Returned

class Currency(int, Enum):
    RUB = 643
    USD = 840

# Request Models
class GetServicesRequest(BaseModel):
    action: str = Field(..., pattern="^GET_SERVICES$")
    key: str

class GetNumberRequest(BaseModel):
    action: str = Field(..., pattern="^GET_NUMBER$")
    key: str
    country: str
    service: str
    operator: str
    sum: float
    currency: Currency
    exceptionPhoneSet: Optional[List[str]] = None

class FinishActivationRequest(BaseModel):
    action: str = Field(..., pattern="^FINISH_ACTIVATION$")
    key: str
    activationId: int
    status: ActivationStatus

# Response Models
class BaseResponse(BaseModel):
    status: Status
    error: Optional[str] = None

class ServiceQuantity(Dict[str, int]):
    """Maps service name to quantity (e.g., {"vk": 10, "ok": 15})"""
    pass

class OperatorMap(Dict[str, Dict[str, int]]):
    """Maps operator to service quantities (e.g., {"beeline": {"vk": 10}})"""
    pass

class CountryServices(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    country: str
    operatorMap: OperatorMap

class GetServicesResponse(BaseResponse):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    countryList: List[CountryServices]

class GetNumberResponse(BaseResponse):
    number: Optional[int] = None
    activationId: Optional[int] = None

class FinishActivationResponse(BaseResponse):
    pass

# SMS Push Models
class PushSmsRequest(BaseModel):
    action: str = Field(..., pattern="^PUSH_SMS$")
    key: str
    smsId: int
    phone: int
    phoneFrom: str
    text: str

class PushSmsResponse(BaseModel):
    status: Status
    error: Optional[str] = None 