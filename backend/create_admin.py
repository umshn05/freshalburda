import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
from passlib.context import CryptContext

MONGODB_URL = "mongodb://localhost:27018"
DATABASE_NAME = "sahin_fresh"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


async def create_admin():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    ad = "Admin"
    soyad = "Sahin"
    telefon = "05001111111"
    eposta = "admin@sahinfresh.com"
    sifre = "admin1234"

    mevcut = await db["users"].find_one({"eposta": eposta})
    if mevcut:
        print(f"❌ Bu e-posta zaten kayıtlı: {eposta}")
        client.close()
        return

    simdi = datetime.utcnow()

    user_doc = {
        "_id": ObjectId(),
        "ad": ad,
        "soyad": soyad,
        "telefon": telefon,
        "eposta": eposta,
        "sifre_hash": pwd_context.hash(sifre),
        "rol_slug": "super_admin",
        "aktif_mi": True,
        "son_giris": None,
        "created_at": simdi,
        "updated_at": simdi,
    }

    await db["users"].insert_one(user_doc)
    print(f"✅ Admin kullanıcısı oluşturuldu!")
    print(f"   E-posta : {eposta}")
    print(f"   Şifre   : {sifre}")
    print(f"   Rol     : super_admin")

    client.close()


if __name__ == "__main__":
    asyncio.run(create_admin())