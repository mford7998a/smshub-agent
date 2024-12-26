from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base
from datetime import datetime

class Modem(Base):
    __tablename__ = 'modems'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=False, unique=True)
    operator = Column(String(50), nullable=False)  # beeline, megafon, mts, etc.
    country = Column(String(50), nullable=False)   # russia, ukraine, etc.
    status = Column(String(20), default='active')  # active, inactive, busy
    port = Column(String(100), nullable=False)
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    activations = relationship("Activation", back_populates="modem")
    messages = relationship("Message", back_populates="modem")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone_number': self.phone_number,
            'operator': self.operator,
            'country': self.country,
            'status': self.status,
            'port': self.port,
            'is_online': self.is_online,
            'last_seen': self.last_seen.isoformat() if self.last_seen else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 