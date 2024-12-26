from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Text, Enum, JSON
from sqlalchemy.orm import relationship
import enum
from .base import Base

class ModemStatus(enum.Enum):
    ACTIVE = "active"
    BUSY = "busy"
    ERROR = "error"
    OFFLINE = "offline"

class ActivationStatus(enum.Enum):
    WAITING = 1
    READY = 2
    COMPLETED = 3
    CANCELLED = 4
    REFUNDED = 5
    ERROR = 6

class Modem(Base):
    __tablename__ = "modems"
    
    id = Column(Integer, primary_key=True, index=True)
    port = Column(String, unique=True, nullable=False)
    phone_number = Column(String)
    imei = Column(String)
    iccid = Column(String)
    status = Column(Enum(ModemStatus), default=ModemStatus.OFFLINE)
    signal_quality = Column(Integer)
    operator = Column(String)
    country = Column(String)
    config = Column(JSON)
    
    activations = relationship("Activation", back_populates="modem")
    sms_messages = relationship("SMSMessage", back_populates="modem")

class Activation(Base):
    __tablename__ = "activations"
    
    id = Column(Integer, primary_key=True, index=True)
    activation_id = Column(String, unique=True, nullable=False)
    modem_id = Column(Integer, ForeignKey("modems.id"))
    phone_number = Column(String, nullable=False)
    service = Column(String, nullable=False)
    status = Column(Enum(ActivationStatus), default=ActivationStatus.WAITING)
    operator = Column(String)
    country = Column(String)
    price = Column(Float)
    currency = Column(Integer)
    
    modem = relationship("Modem", back_populates="activations")
    sms_messages = relationship("SMSMessage", back_populates="activation")

class SMSMessage(Base):
    __tablename__ = "sms_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    sms_id = Column(String, unique=True, nullable=False)
    modem_id = Column(Integer, ForeignKey("modems.id"))
    activation_id = Column(Integer, ForeignKey("activations.id"))
    phone_from = Column(String, nullable=False)
    phone_to = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    delivered = Column(Boolean, default=False)
    delivery_attempts = Column(Integer, default=0)
    last_error = Column(Text)
    
    modem = relationship("Modem", back_populates="sms_messages")
    activation = relationship("Activation", back_populates="sms_messages")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    audit_logs = relationship("AuditLog", back_populates="user")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, nullable=False)
    entity_type = Column(String)
    entity_id = Column(String)
    details = Column(JSON)
    ip_address = Column(String)
    
    user = relationship("User", back_populates="audit_logs") 