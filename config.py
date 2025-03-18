from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/openagi_builder"

    # Authentication
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Email
    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    EMAIL_USER: str = ""
    EMAIL_PASSWORD: str = ""
    EMAIL_FROM: str = ""

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # Redis (for rate limiting)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""

    # OpenAI
    OPENAI_API_KEY: str = ""

    # Hugging Face
    HF_API_KEY: str = ""

    # OpenWeather
    OPENWEATHER_API_KEY: str = ""

    # NextAuth (Add these missing fields)
    NEXTAUTH_SECRET: str = ""
    NEXTAUTH_URL: str = ""

    # GitHub OAuth
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""

    # Facebook OAuth
    FACEBOOK_CLIENT_ID: str = ""
    FACEBOOK_CLIENT_SECRET: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
