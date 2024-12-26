from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .base import Base
from datetime import datetime

class Message(Base):
    __tablename__ = 'messages'

    id = Column(Integer, primary_key=True)
    modem_id = Column(Integer, ForeignKey('modems.id'), nullable=False)
    activation_id = Column(Integer, ForeignKey('activations.id'), nullable=True)
    phone_from = Column(String(100), nullable=False)
    phone_to = Column(String(20), nullable=False)
    text = Column(String(1000), nullable=False)
    is_delivered = Column(Boolean, default=False)
    delivery_attempts = Column(Integer, default=0)
    last_attempt = Column(DateTime)
    delivered_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    modem = relationship("Modem", back_populates="messages")
    activation = relationship("Activation", back_populates="messages")

    def to_dict(self):
        return {
            'id': self.id,
            'modem_id': self.modem_id,
            'activation_id': self.activation_id,
            'phone_from': self.phone_from,
            'phone_to': self.phone_to,
            'text': self.text,
            'is_delivered': self.is_delivered,
            'delivery_attempts': self.delivery_attempts,
            'last_attempt': self.last_attempt.isoformat() if self.last_attempt else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 