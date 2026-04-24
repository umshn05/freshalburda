from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
from pydantic import BaseModel

from core.database import get_database
from core.auth_deps import get_current_user, get_optional_user, KullaniciBilgi
from schemas.auth import KayitIstegi, KayitCevabi, GirisIstegi, GirisCevabi
from services.auth_service import kullanici_kayit, kullanici_giris

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=KayitCevabi, status_code=status.HTTP_201_CREATED)
async def kayit_ol(istek: KayitIstegi, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        sonuc = await kullanici_kayit(db, istek)
        return sonuc
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=GirisCevabi)
async def giris_yap(istek: GirisIstegi, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        sonuc = await kullanici_giris(db, istek)
        return sonuc
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/sifre-sifirla-kontrol", tags=["Auth"])
async def sifre_sifirla_kontrol(istek: dict, db: AsyncIOMotorDatabase = Depends(get_database)):
    eposta = istek.get("eposta", "").lower().strip()
    if not eposta:
        raise HTTPException(status_code=400, detail="E-posta zorunludur")
    user = await db["users"].find_one({"eposta": eposta})
    if not user:
        raise HTTPException(status_code=404, detail="Bu e-posta adresi sistemde kayıtlı değil")
    return {"mesaj": "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi."}


@router.get("/roller", tags=["Auth"])
async def rolleri_getir(db: AsyncIOMotorDatabase = Depends(get_database)):
    roller = await db["roles"].find().to_list(100)
    return [{"id": str(r["_id"]), "slug": r["slug"], "label": r["label"],
             "aciklama": r["aciklama"], "izinler": r["izinler"], "aktif_mi": r["aktif_mi"]}
            for r in roller]


# ── ADMIN ENDPOINTS ────────────────────────────────────────────────────────


@router.get("/admin/bekleyen-musteriler", tags=["Admin"])
async def bekleyen_musteriler(
    sehir_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_database),
    kullanici: KullaniciBilgi = Depends(get_current_user),
):
    filtre = {"onay_durumu": "beklemede"}
    filtre.update(kullanici.sehir_filtresi(sehir_id))

    musteriler = await db["customers"].find(filtre).to_list(100)
    sonuc = []
    for m in musteriler:
        from bson import ObjectId
        user = await db["users"].find_one({"_id": m["user_id"]})
        adres = await db["customer_addresses"].find_one({"customer_id": m["_id"]})
        sonuc.append({
            "musteri_id": str(m["_id"]),
            "isletme_adi": m["isletme_adi"],
            "vergi_dairesi": m["vergi_dairesi"],
            "vergi_no": m["vergi_no"],
            "onay_durumu": m["onay_durumu"],
            "created_at": str(m["created_at"]),
            "ad": user["ad"] if user else "",
            "soyad": user["soyad"] if user else "",
            "eposta": user["eposta"] if user else "",
            "telefon": user["telefon"] if user else "",
            "il": adres["il"] if adres else "",
            "ilce": adres["ilce"] if adres else "",
            "acik_adres": adres["acik_adres"] if adres else "",
        })
    return sonuc


@router.post("/admin/musteri-onayla/{musteri_id}", tags=["Admin"])
async def musteri_onayla(
    musteri_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    kullanici: KullaniciBilgi = Depends(get_current_user),
):
    from bson import ObjectId
    await db["customers"].update_one(
        {"_id": ObjectId(musteri_id)},
        {"$set": {"onay_durumu": "onaylandi", "aktif_mi": True}}
    )
    return {"mesaj": "Müşteri onaylandı"}


@router.post("/admin/musteri-reddet/{musteri_id}", tags=["Admin"])
async def musteri_reddet(
    musteri_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    kullanici: KullaniciBilgi = Depends(get_current_user),
):
    from bson import ObjectId
    await db["customers"].update_one(
        {"_id": ObjectId(musteri_id)},
        {"$set": {"onay_durumu": "reddedildi", "aktif_mi": False}}
    )
    return {"mesaj": "Müşteri reddedildi"}


@router.get("/admin/musteriler", tags=["Admin"])
async def tum_musteriler(
    sehir_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_database),
    kullanici: KullaniciBilgi = Depends(get_current_user),
):
    filtre = kullanici.sehir_filtresi(sehir_id)
    musteriler = await db["customers"].find(filtre).to_list(500)
    sonuc = []
    for m in musteriler:
        user = await db["users"].find_one({"_id": m["user_id"]})
        sonuc.append({
            "musteri_id": str(m["_id"]),
            "isletme_adi": m["isletme_adi"],
            "vergi_no": m["vergi_no"],
            "onay_durumu": m["onay_durumu"],
            "aktif_mi": m["aktif_mi"],
            "cari_acik_mi": m.get("cari_acik_mi", False),
            "cari_limit": m.get("cari_limit", 0),
            "mevcut_bakiye": m.get("mevcut_bakiye", 0),
            "risk_durumu": m.get("risk_durumu", "normal"),
            "created_at": str(m["created_at"]),
            "ad": user["ad"] if user else "",
            "soyad": user["soyad"] if user else "",
            "eposta": user["eposta"] if user else "",
            "telefon": user["telefon"] if user else "",
            "sehir_id": str(m["sehir_id"]) if m.get("sehir_id") else None,
        })
    return sonuc


class AdminKullaniciEkle(BaseModel):
    ad: str
    soyad: str
    eposta: str
    telefon: str
    sifre: str
    rol_slug: str  # super_admin | sehir_admin
    sehir_id: Optional[str] = None


@router.post("/admin/kullanici-ekle", tags=["Admin"])
async def admin_kullanici_ekle(
    veri: AdminKullaniciEkle,
    db: AsyncIOMotorDatabase = Depends(get_database),
    kullanici: KullaniciBilgi = Depends(get_current_user),
):
    from bson import ObjectId
    from datetime import datetime
    from core.security import hash_password

    if not kullanici.super_admin_mi:
        raise HTTPException(status_code=403, detail="Sadece süper admin kullanıcı ekleyebilir")

    if await db["users"].find_one({"eposta": veri.eposta.lower().strip()}):
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")

    if veri.rol_slug == "sehir_admin" and not veri.sehir_id:
        raise HTTPException(status_code=400, detail="Şehir admin için şehir seçilmeli")

    simdi = datetime.utcnow()
    user_doc = {
        "_id": ObjectId(),
        "ad": veri.ad.strip(),
        "soyad": veri.soyad.strip(),
        "eposta": veri.eposta.lower().strip(),
        "telefon": veri.telefon.strip(),
        "sifre_hash": hash_password(veri.sifre),
        "rol_slug": veri.rol_slug,
        "sehir_id": ObjectId(veri.sehir_id) if veri.sehir_id else None,
        "aktif_mi": True,
        "son_giris": None,
        "created_at": simdi,
        "updated_at": simdi,
    }
    await db["users"].insert_one(user_doc)
    return {"mesaj": "Kullanıcı oluşturuldu", "id": str(user_doc["_id"])}


@router.get("/admin/kullanicilar", tags=["Admin"])
async def admin_kullanicilari_getir(
    db: AsyncIOMotorDatabase = Depends(get_database),
    kullanici: KullaniciBilgi = Depends(get_current_user),
):
    from bson import ObjectId

    if not kullanici.super_admin_mi:
        raise HTTPException(status_code=403, detail="Yetkisiz")

    adminler = await db["users"].find(
        {"rol_slug": {"$in": ["super_admin", "sehir_admin", "finans"]}}
    ).sort("created_at", -1).to_list(200)

    sonuc = []
    for u in adminler:
        sehir_ad = None
        if u.get("sehir_id"):
            s = await db["sehirler"].find_one({"_id": u["sehir_id"]})
            if s:
                sehir_ad = s["ad"]
        sonuc.append({
            "id": str(u["_id"]),
            "ad": u["ad"],
            "soyad": u["soyad"],
            "eposta": u["eposta"],
            "telefon": u.get("telefon", ""),
            "rol_slug": u["rol_slug"],
            "sehir_id": str(u["sehir_id"]) if u.get("sehir_id") else None,
            "sehir_ad": sehir_ad,
            "aktif_mi": u.get("aktif_mi", True),
            "son_giris": str(u["son_giris"]) if u.get("son_giris") else None,
            "created_at": str(u["created_at"]),
        })
    return sonuc


@router.put("/admin/kullanici/{user_id}/aktif", tags=["Admin"])
async def kullanici_aktif_pasif(
    user_id: str,
    istek: dict,
    db: AsyncIOMotorDatabase = Depends(get_database),
    kullanici: KullaniciBilgi = Depends(get_current_user),
):
    from bson import ObjectId
    if not kullanici.super_admin_mi:
        raise HTTPException(status_code=403, detail="Yetkisiz")
    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"aktif_mi": istek.get("aktif_mi", True)}}
    )
    return {"mesaj": "Güncellendi"}


@router.delete("/admin/musteri-sil/{musteri_id}", tags=["Admin"])
async def musteri_sil(
    musteri_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    kullanici: KullaniciBilgi = Depends(get_current_user),
):
    from bson import ObjectId
    musteri = await db["customers"].find_one({"_id": ObjectId(musteri_id)})
    if not musteri:
        raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
    await db["customers"].delete_one({"_id": ObjectId(musteri_id)})
    await db["users"].delete_one({"_id": musteri["user_id"]})
    await db["customer_addresses"].delete_many({"customer_id": ObjectId(musteri_id)})
    return {"mesaj": "Müşteri silindi"}
