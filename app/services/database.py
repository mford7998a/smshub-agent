from typing import Optional, List, Type, TypeVar, Generic
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update, delete
from sqlalchemy.sql.expression import Select
from ..core.config import settings
from ..models.base import Base

# Generic type for models
ModelType = TypeVar("ModelType", bound=Base)

class DatabaseService(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model
        
    async def get(self, db: AsyncSession, id: int) -> Optional[ModelType]:
        """Get a single record by ID."""
        result = await db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()
        
    async def get_multi(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
        query: Optional[Select] = None
    ) -> List[ModelType]:
        """Get multiple records with optional filtering."""
        if query is None:
            query = select(self.model)
            
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()
        
    async def create(self, db: AsyncSession, *, obj_in: dict) -> ModelType:
        """Create a new record."""
        db_obj = self.model(**obj_in)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
        
    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: dict
    ) -> ModelType:
        """Update an existing record."""
        for field, value in obj_in.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
                
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
        
    async def delete(self, db: AsyncSession, *, id: int) -> bool:
        """Delete a record by ID."""
        result = await db.execute(
            delete(self.model).where(self.model.id == id)
        )
        await db.commit()
        return result.rowcount > 0

# Database engine and session factory
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.LOG_LEVEL == "DEBUG",
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10
)

async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_db() -> AsyncSession:
    """Dependency for getting database sessions."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

# Specific database services
class ModemDB(DatabaseService["Modem"]):
    async def get_by_port(self, db: AsyncSession, port: str) -> Optional["Modem"]:
        """Get modem by port."""
        result = await db.execute(
            select(self.model).where(self.model.port == port)
        )
        return result.scalar_one_or_none()
        
    async def get_available(self, db: AsyncSession) -> List["Modem"]:
        """Get all available modems."""
        result = await db.execute(
            select(self.model).where(self.model.status == "active")
        )
        return result.scalars().all()

class ActivationDB(DatabaseService["Activation"]):
    async def get_by_activation_id(
        self,
        db: AsyncSession,
        activation_id: str
    ) -> Optional["Activation"]:
        """Get activation by SMS Hub activation ID."""
        result = await db.execute(
            select(self.model).where(self.model.activation_id == activation_id)
        )
        return result.scalar_one_or_none()
        
    async def get_active_by_modem(
        self,
        db: AsyncSession,
        modem_id: int
    ) -> List["Activation"]:
        """Get active activations for a modem."""
        result = await db.execute(
            select(self.model).where(
                self.model.modem_id == modem_id,
                self.model.status.in_([1, 2])  # WAITING or READY
            )
        )
        return result.scalars().all()

class SMSMessageDB(DatabaseService["SMSMessage"]):
    async def get_undelivered(
        self,
        db: AsyncSession,
        limit: int = 100
    ) -> List["SMSMessage"]:
        """Get undelivered SMS messages."""
        result = await db.execute(
            select(self.model)
            .where(self.model.delivered == False)
            .order_by(self.model.created_at)
            .limit(limit)
        )
        return result.scalars().all()
        
    async def get_by_sms_id(
        self,
        db: AsyncSession,
        sms_id: str
    ) -> Optional["SMSMessage"]:
        """Get SMS message by SMS ID."""
        result = await db.execute(
            select(self.model).where(self.model.sms_id == sms_id)
        )
        return result.scalar_one_or_none()

class UserDB(DatabaseService["User"]):
    async def get_by_email(
        self,
        db: AsyncSession,
        email: str
    ) -> Optional["User"]:
        """Get user by email."""
        result = await db.execute(
            select(self.model).where(self.model.email == email)
        )
        return result.scalar_one_or_none()

class AuditLogDB(DatabaseService["AuditLog"]):
    async def get_by_user(
        self,
        db: AsyncSession,
        user_id: int,
        limit: int = 100
    ) -> List["AuditLog"]:
        """Get audit logs for a user."""
        result = await db.execute(
            select(self.model)
            .where(self.model.user_id == user_id)
            .order_by(self.model.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all() 