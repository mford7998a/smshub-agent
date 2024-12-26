from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List

from ...core.config import settings
from ...services.auth import auth_service
from ...services.database import get_db, UserDB, AuditLogDB
from ...schemas.user import (
    UserCreate,
    UserUpdate,
    UserInDB,
    UserWithAuditLogs,
    AuditLogCreate
)
from ...models.models import User, AuditLog

router = APIRouter()

@router.get("/me", response_model=UserInDB)
async def get_current_user_info(
    current_user: User = Depends(auth_service.get_current_user)
) -> Any:
    """Get current user information."""
    return current_user

@router.put("/me", response_model=UserInDB)
async def update_current_user(
    user_in: UserUpdate,
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update current user information."""
    user_db = UserDB(User)
    
    # Check email uniqueness if changing email
    if user_in.email and user_in.email != current_user.email:
        existing_user = await user_db.get_by_email(db, user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Update user
    user_data = user_in.model_dump(exclude_unset=True)
    if user_in.password:
        user_data["hashed_password"] = auth_service.get_password_hash(
            user_in.password
        )
        user_data.pop("password", None)
    
    user = await user_db.update(db, db_obj=current_user, obj_in=user_data)
    
    # Create audit log
    audit_db = AuditLogDB(AuditLog)
    await audit_db.create(
        db,
        obj_in=AuditLogCreate(
            user_id=user.id,
            action="update_profile",
            entity_type="user",
            entity_id=str(user.id),
            details={"updated_fields": list(user_data.keys())}
        ).model_dump()
    )
    
    return user

@router.get("/", response_model=List[UserInDB])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(auth_service.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all users (admin only)."""
    user_db = UserDB(User)
    return await user_db.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=UserInDB)
async def create_user(
    user_in: UserCreate,
    current_user: User = Depends(auth_service.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create new user (admin only)."""
    user_db = UserDB(User)
    
    # Check if user exists
    existing_user = await user_db.get_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_data = user_in.model_dump()
    user_data["hashed_password"] = auth_service.get_password_hash(
        user_data.pop("password")
    )
    
    user = await user_db.create(db, obj_in=user_data)
    
    # Create audit log
    audit_db = AuditLogDB(AuditLog)
    await audit_db.create(
        db,
        obj_in=AuditLogCreate(
            user_id=current_user.id,
            action="create_user",
            entity_type="user",
            entity_id=str(user.id)
        ).model_dump()
    )
    
    return user

@router.get("/{user_id}", response_model=UserWithAuditLogs)
async def get_user(
    user_id: int,
    current_user: User = Depends(auth_service.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get user by ID with audit logs (admin only)."""
    user_db = UserDB(User)
    user = await user_db.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/{user_id}", response_model=UserInDB)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(auth_service.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update user (admin only)."""
    user_db = UserDB(User)
    user = await user_db.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check email uniqueness if changing email
    if user_in.email and user_in.email != user.email:
        existing_user = await user_db.get_by_email(db, user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Update user
    user_data = user_in.model_dump(exclude_unset=True)
    if user_in.password:
        user_data["hashed_password"] = auth_service.get_password_hash(
            user_in.password
        )
        user_data.pop("password", None)
    
    user = await user_db.update(db, db_obj=user, obj_in=user_data)
    
    # Create audit log
    audit_db = AuditLogDB(AuditLog)
    await audit_db.create(
        db,
        obj_in=AuditLogCreate(
            user_id=current_user.id,
            action="update_user",
            entity_type="user",
            entity_id=str(user.id),
            details={"updated_fields": list(user_data.keys())}
        ).model_dump()
    )
    
    return user

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(auth_service.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete user (admin only)."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete own user account"
        )
    
    user_db = UserDB(User)
    user = await user_db.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Create audit log before deletion
    audit_db = AuditLogDB(AuditLog)
    await audit_db.create(
        db,
        obj_in=AuditLogCreate(
            user_id=current_user.id,
            action="delete_user",
            entity_type="user",
            entity_id=str(user.id)
        ).model_dump()
    )
    
    # Delete user
    await user_db.delete(db, id=user_id)
    
    return {"message": "User deleted successfully"} 