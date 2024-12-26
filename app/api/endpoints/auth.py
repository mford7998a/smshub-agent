from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any
from datetime import timedelta

from ...core.config import settings
from ...services.auth import auth_service
from ...services.database import get_db, UserDB
from ...schemas.user import (
    UserCreate,
    UserInDB,
    Token,
    LoginRequest,
    ChangePasswordRequest
)
from ...models.models import User

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Login user and return access token."""
    user = await auth_service.authenticate_user(
        db, form_data.username, form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth_service.create_access_token(
        data={"sub": user.email}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/register", response_model=UserInDB)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Register a new user."""
    user_db = UserDB(User)
    
    # Check if user already exists
    existing_user = await user_db.get_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    hashed_password = auth_service.get_password_hash(user_in.password)
    user_data = user_in.model_dump()
    user_data.pop("password")
    user_data["hashed_password"] = hashed_password
    
    return await user_db.create(db, obj_in=user_data)

@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(auth_service.get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Change user password."""
    # Verify current password
    if not auth_service.verify_password(
        password_data.current_password,
        current_user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    # Update password
    user_db = UserDB(User)
    new_hashed_password = auth_service.get_password_hash(
        password_data.new_password
    )
    await user_db.update(
        db,
        db_obj=current_user,
        obj_in={"hashed_password": new_hashed_password}
    )
    
    return {"message": "Password updated successfully"}

@router.post("/refresh-token", response_model=Token)
async def refresh_token(
    current_user: User = Depends(auth_service.get_current_user)
) -> Any:
    """Refresh access token."""
    access_token = auth_service.create_access_token(
        data={"sub": current_user.email}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout(
    current_user: User = Depends(auth_service.get_current_user)
) -> Any:
    """Logout user (client should discard token)."""
    return {"message": "Successfully logged out"} 