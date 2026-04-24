import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGODB_URL = "mongodb://localhost:27018"
DATABASE_NAME = "sahin_fresh"
SEHIR_ID = ObjectId("69e69669c620d513e410541e")

async def migrate():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    collections = ["customers", "orders", "products", "faturalar", "cari_islemler", "cari_talepler"]
    for col in collections:
        result = await db[col].update_many(
            {"sehir_id": {"$in": [None, ""]}},
            {"$set": {"sehir_id": SEHIR_ID}}
        )
        print(f"{col}: {result.modified_count} kayıt güncellendi")

    client.close()
    print("Migration tamamlandı.")

asyncio.run(migrate())
