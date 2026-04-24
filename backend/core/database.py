from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27018"
    DATABASE_NAME: str = "sahin_fresh"
    SECRET_KEY: str = "gizli-anahtar-buraya"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"


settings = Settings()


class Database:
    client: AsyncIOMotorClient = None


db = Database()


async def get_database():
    return db.client[settings.DATABASE_NAME]


async def connect_to_mongo():
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = db.client[settings.DATABASE_NAME]
    await database["users"].create_index("eposta", unique=True)
    await database["users"].create_index("telefon", unique=True)
    await database["customers"].create_index("vergi_no", unique=True)
    await database["cari_islemler"].create_index("musteri_id")
    await database["cari_talepler"].create_index([("musteri_id", 1), ("durum", 1)])
    await database["product_prices"].create_index([("urun_id", 1), ("tarih", -1)])
    await database["faturalar"].create_index([("musteri_id", 1), ("created_at", -1)])
    await database["faturalar"].create_index("siparis_id", unique=True)
    await database["faturalar"].create_index("fatura_no", unique=True)
    await database["sehirler"].create_index("slug", unique=True)
    print("✅ MongoDB bağlantısı kuruldu")


async def close_mongo_connection():
    db.client.close()
    print("❌ MongoDB bağlantısı kapatıldı")