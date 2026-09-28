from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    app_secret: str = "live-board-dev-secret-change-me"
    database_url: str = "sqlite:///./live_board.db"
    access_minutes: int = 30
    cors_origins: str = "http://localhost:3010,http://127.0.0.1:3010"
    def origin_list(self) -> list[str]:
        return [p.strip() for p in self.cors_origins.split(",") if p.strip()]
