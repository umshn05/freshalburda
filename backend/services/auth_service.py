from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.security import hash_password, verify_password, create_access_token
from schemas.auth import KayitIstegi, GirisIstegi


async def kullanici_kayit(db: AsyncIOMotorDatabase, istek: KayitIstegi) -> dict:
    istek.sifreleri_eslestir()

    mevcut = await db["users"].find_one({"eposta": istek.eposta})
    if mevcut:
        raise ValueError("Bu e-posta adresi zaten kayıtlı")

    mevcut = await db["users"].find_one({"telefon": istek.telefon})
    if mevcut:
        raise ValueError("Bu telefon numarası zaten kayıtlı")

    mevcut = await db["customers"].find_one({"vergi_no": istek.vergi_no})
    if mevcut:
        raise ValueError("Bu vergi numarası zaten kayıtlı")

    simdi = datetime.utcnow()

    user_doc = {
        "_id": ObjectId(),
        "ad": istek.ad.strip(),
        "soyad": istek.soyad.strip(),
        "telefon": istek.telefon,
        "eposta": istek.eposta.lower().strip(),
        "sifre_hash": hash_password(istek.sifre),
        "rol_slug": "musteri_yetkilisi",
        "aktif_mi": True,
        "son_giris": None,
        "created_at": simdi,
        "updated_at": simdi,
    }
    await db["users"].insert_one(user_doc)

    customer_doc = {
        "_id": ObjectId(),
        "user_id": user_doc["_id"],
        "isletme_adi": istek.isletme_adi.strip(),
        "vergi_dairesi": istek.vergi_dairesi.strip(),
        "vergi_no": istek.vergi_no,
        "onay_durumu": "beklemede",
        "aktif_mi": False,
        "cari_acik_mi": False,
        "cari_limit": 0,
        "mevcut_bakiye": 0,
        "risk_durumu": "normal",
        "sehir_id": ObjectId(istek.sehir_id) if istek.sehir_id else None,
        "sozlesme_onaylandi": istek.sozlesme_onaylandi,
        "sozlesme_onay_tarihi": simdi,
        "created_at": simdi,
        "updated_at": simdi,
    }
    await db["customers"].insert_one(customer_doc)

    address_doc = {
        "_id": ObjectId(),
        "customer_id": customer_doc["_id"],
        "il": istek.il.strip(),
        "ilce": istek.ilce.strip(),
        "acik_adres": istek.acik_adres.strip(),
        "teslimat_notu": istek.teslimat_notu.strip() if istek.teslimat_notu else "",
        "varsayilan_mi": True,
        "aktif_mi": True,
        "created_at": simdi,
    }
    await db["customer_addresses"].insert_one(address_doc)

    return {
        "mesaj": "Kayıt başarılı. Admin onayı bekleniyor.",
        "kullanici_id": str(user_doc["_id"]),
        "musteri_id": str(customer_doc["_id"]),
        "onay_durumu": "beklemede",
    }


async def kullanici_giris(db: AsyncIOMotorDatabase, istek: GirisIstegi) -> dict:
    user = await db["users"].find_one({"eposta": istek.eposta.lower().strip()})
    if not user:
        raise ValueError("E-posta veya şifre hatalı")

    if not verify_password(istek.sifre, user["sifre_hash"]):
        raise ValueError("E-posta veya şifre hatalı")

    if not user.get("aktif_mi"):
        raise ValueError("Hesabınız aktif değil")

    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"son_giris": datetime.utcnow()}}
    )

    musteri_id = None
    onay_durumu = None
    sehir_id = None

    if user["rol_slug"] == "musteri_yetkilisi":
        customer = await db["customers"].find_one({"user_id": user["_id"]})
        if customer:
            musteri_id = str(customer["_id"])
            onay_durumu = customer["onay_durumu"]
            if customer.get("sehir_id"):
                sehir_id = str(customer["sehir_id"])

    if user["rol_slug"] == "sehir_admin" and user.get("sehir_id"):
        sehir_id = str(user["sehir_id"])

    jwt_payload = {
        "sub": str(user["_id"]),
        "rol": user["rol_slug"],
    }
    if sehir_id:
        jwt_payload["sehir_id"] = sehir_id

    token = create_access_token(jwt_payload)

    return {
        "access_token": token,
        "token_type": "bearer",
        "kullanici_id": str(user["_id"]),
        "ad": user["ad"],
        "soyad": user["soyad"],
        "rol": user["rol_slug"],
        "musteri_id": musteri_id,
        "onay_durumu": onay_durumu,
        "sehir_id": sehir_id,
    }