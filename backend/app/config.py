from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database Configuration (supports both local and AWS RDS)
    database_hostname: str = "localhost"
    database_port: str = "5432"
    database_password: str = "postgres"
    database_name: str = "streamify"
    database_username: str = "postgres"
    
    # AWS RDS Configuration (optional - overrides local if provided)
    aws_rds_endpoint: Optional[str] = None
    aws_rds_port: Optional[str] = None
    aws_rds_database: Optional[str] = None
    aws_rds_username: Optional[str] = None
    aws_rds_password: Optional[str] = None
    
    # TMDB API Configuration
    tmdb_api_key: Optional[str] = None
    tmdb_language: str = "en-US"
    
    # JWT Configuration
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours instead of 30 minutes
    
    # AWS Configuration
    aws_region: str = "us-east-1"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    
    # Pinecone Configuration
    pinecone_api_key: Optional[str] = None
    pinecone_environment: str = "us-east-1-aws"
    pinecone_index_name: str = "streamify-movies"
    
    # OpenAI Configuration
    openai_api_key: Optional[str] = None
    embedding_model: str = "text-embedding-ada-002"
    embedding_dimension: int = 1536
    
    # Email Configuration (for user verification)
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    email_from: Optional[str] = None
    email_from_name: str = "Streamify"
    frontend_url: str = "http://localhost:8081"

    class Config:
        env_file = ".env"
        extra = "ignore"  # Allow extra fields from .env
    
    @property
    def database_url(self) -> str:
        """Returns the database URL, preferring AWS RDS if configured"""
        if self.aws_rds_endpoint:
            return f"postgresql://{self.aws_rds_username}:{self.aws_rds_password}@{self.aws_rds_endpoint}:{self.aws_rds_port}/{self.aws_rds_database}"
        return f"postgresql://{self.database_username}:{self.database_password}@{self.database_hostname}:{self.database_port}/{self.database_name}"

settings = Settings()
