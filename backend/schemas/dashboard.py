from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime

class ModemStats(BaseModel):
    total: int
    active: int
    busy: int
    offline: int
    by_country: Dict[str, int]
    by_operator: Dict[str, int]

class ActivationStats(BaseModel):
    total: int
    pending: int
    completed: int
    success_rate: float
    by_service: Dict[str, int]
    by_status: Dict[str, int]
    daily_activations: Dict[str, int]  # Date string to count

class MessageStats(BaseModel):
    total: int
    delivered: int
    pending: int
    delivery_rate: float
    daily_messages: Dict[str, int]  # Date string to count
    avg_delivery_time: float  # in seconds

class RevenueStats(BaseModel):
    total_rub: float
    total_usd: float
    daily_revenue: Dict[str, Dict[str, float]]  # Date string to currency:amount
    by_service: Dict[str, Dict[str, float]]  # Service to currency:amount

class DashboardResponse(BaseModel):
    modems: ModemStats
    activations: ActivationStats
    messages: MessageStats
    revenue: RevenueStats
    last_updated: datetime 