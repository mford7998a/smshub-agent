from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./smshub.db"
    
    # SMSHUB Settings
    SMSHUB_API_KEY: str
    USER_AGENT: str = "SMSHUB-Agent/1.0"
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "smshub.log"
    
    # SMS Settings
    SMS_RETRY_INTERVAL: int = 10  # seconds
    SMS_MAX_RETRIES: int = 0  # 0 means infinite retries
    
    class Config:
        env_file = ".env"

settings = Settings() 