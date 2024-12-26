from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .base import Base
from datetime import datetime

class Activation(Base):
    __tablename__ = 'activations'

    id = Column(Integer, primary_key=True)
    modem_id = Column(Integer, ForeignKey('modems.id'), nullable=False)
    service = Column(String(50), nullable=False)  # vk, ok, wa, etc.
    status = Column(Integer, default=0)  # See Appendix 4 in documentation
    phone_number = Column(String(20), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(Integer, nullable=False)  # 643 for RUB, 840 for USD
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    modem = relationship("Modem", back_populates="activations")
    messages = relationship("Message", back_populates="activation")

    def to_dict(self):
        return {
            'id': self.id,
            'modem_id': self.modem_id,
            'service': self.service,
            'status': self.status,
            'phone_number': self.phone_number,
            'amount': self.amount,
            'currency': self.currency,
            'is_completed': self.is_completed,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 