from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
import json

from ..database import get_db
from ..models import Modem, Activation, Message
from ..schemas.dashboard import DashboardResponse, ModemStats, ActivationStats, MessageStats, RevenueStats
from ..schemas.smshub import Currency, ActivationStatus

router = APIRouter(prefix="/api/dashboard")

def get_date_range(days: int = 30):
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    return start_date, end_date

@router.get("", response_model=DashboardResponse)
async def get_dashboard(db: Session = Depends(get_db)):
    # Get date range for daily stats
    start_date, end_date = get_date_range()

    # Modem Statistics
    modem_stats = db.query(
        func.count().label('total'),
        func.sum(case((Modem.status == 'active', 1), else_=0)).label('active'),
        func.sum(case((Modem.status == 'busy', 1), else_=0)).label('busy'),
        func.sum(case((Modem.is_online == False, 1), else_=0)).label('offline')
    ).first()

    modem_by_country = dict(
        db.query(
            Modem.country,
            func.count()
        ).group_by(Modem.country).all()
    )

    modem_by_operator = dict(
        db.query(
            Modem.operator,
            func.count()
        ).group_by(Modem.operator).all()
    )

    # Activation Statistics
    activation_stats = db.query(
        func.count().label('total'),
        func.sum(case((Activation.is_completed == False, 1), else_=0)).label('pending'),
        func.sum(case((Activation.is_completed == True, 1), else_=0)).label('completed')
    ).first()

    success_count = db.query(func.count()).filter(
        Activation.status == ActivationStatus.SUCCESS
    ).scalar()

    activation_by_service = dict(
        db.query(
            Activation.service,
            func.count()
        ).group_by(Activation.service).all()
    )

    activation_by_status = dict(
        db.query(
            Activation.status,
            func.count()
        ).group_by(Activation.status).all()
    )

    daily_activations = dict(
        db.query(
            func.date(Activation.created_at),
            func.count()
        ).filter(
            Activation.created_at.between(start_date, end_date)
        ).group_by(
            func.date(Activation.created_at)
        ).all()
    )

    # Message Statistics
    message_stats = db.query(
        func.count().label('total'),
        func.sum(case((Message.is_delivered == True, 1), else_=0)).label('delivered'),
        func.sum(case((Message.is_delivered == False, 1), else_=0)).label('pending')
    ).first()

    daily_messages = dict(
        db.query(
            func.date(Message.created_at),
            func.count()
        ).filter(
            Message.created_at.between(start_date, end_date)
        ).group_by(
            func.date(Message.created_at)
        ).all()
    )

    # Calculate average delivery time for delivered messages
    avg_delivery_time = db.query(
        func.avg(
            func.extract('epoch', Message.delivered_at - Message.created_at)
        )
    ).filter(
        Message.is_delivered == True
    ).scalar() or 0

    # Revenue Statistics
    revenue_by_currency = {
        Currency.RUB: db.query(func.sum(Activation.amount)).filter(
            Activation.currency == Currency.RUB,
            Activation.status == ActivationStatus.SUCCESS
        ).scalar() or 0,
        Currency.USD: db.query(func.sum(Activation.amount)).filter(
            Activation.currency == Currency.USD,
            Activation.status == ActivationStatus.SUCCESS
        ).scalar() or 0
    }

    daily_revenue = {}
    for date_str, activations in daily_activations.items():
        daily_revenue[str(date_str)] = {
            'RUB': db.query(func.sum(Activation.amount)).filter(
                func.date(Activation.created_at) == date_str,
                Activation.currency == Currency.RUB,
                Activation.status == ActivationStatus.SUCCESS
            ).scalar() or 0,
            'USD': db.query(func.sum(Activation.amount)).filter(
                func.date(Activation.created_at) == date_str,
                Activation.currency == Currency.USD,
                Activation.status == ActivationStatus.SUCCESS
            ).scalar() or 0
        }

    revenue_by_service = {}
    for service in activation_by_service.keys():
        revenue_by_service[service] = {
            'RUB': db.query(func.sum(Activation.amount)).filter(
                Activation.service == service,
                Activation.currency == Currency.RUB,
                Activation.status == ActivationStatus.SUCCESS
            ).scalar() or 0,
            'USD': db.query(func.sum(Activation.amount)).filter(
                Activation.service == service,
                Activation.currency == Currency.USD,
                Activation.status == ActivationStatus.SUCCESS
            ).scalar() or 0
        }

    return DashboardResponse(
        modems=ModemStats(
            total=modem_stats.total,
            active=modem_stats.active,
            busy=modem_stats.busy,
            offline=modem_stats.offline,
            by_country=modem_by_country,
            by_operator=modem_by_operator
        ),
        activations=ActivationStats(
            total=activation_stats.total,
            pending=activation_stats.pending,
            completed=activation_stats.completed,
            success_rate=success_count / activation_stats.total if activation_stats.total > 0 else 0,
            by_service=activation_by_service,
            by_status=activation_by_status,
            daily_activations={str(k): v for k, v in daily_activations.items()}
        ),
        messages=MessageStats(
            total=message_stats.total,
            delivered=message_stats.delivered,
            pending=message_stats.pending,
            delivery_rate=message_stats.delivered / message_stats.total if message_stats.total > 0 else 0,
            daily_messages={str(k): v for k, v in daily_messages.items()},
            avg_delivery_time=avg_delivery_time
        ),
        revenue=RevenueStats(
            total_rub=revenue_by_currency[Currency.RUB],
            total_usd=revenue_by_currency[Currency.USD],
            daily_revenue=daily_revenue,
            by_service=revenue_by_service
        ),
        last_updated=datetime.utcnow()
    ) 