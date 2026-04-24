import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = "mongodb://localhost:27018"
DATABASE_NAME = "sahin_fresh"

async def temizle():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    collections = [
        "customers", "customer_addresses",
        "orders", "order_items",
        "faturalar", "counters",
        "cari_islemler", "cari_talepler",
    ]

    # Sadece musteri rolündeki kullanıcıları sil (admin hesapları kalsın)
    result = await db["users"].delete_many({"rol_slug": "musteri_yetkilisi"})
    print(f"users (musteri): {result.deleted_count} silindi")

    for col in collections:
        result = await db[col].delete_many({})
        print(f"{col}: {result.deleted_count} silindi")

    client.close()
    print("\nTemizlik tamamlandı. Admin hesapları korundu.")

asyncio.run(temizle())
