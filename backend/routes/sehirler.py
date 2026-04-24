from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

from core.database import get_database
from core.auth_deps import get_current_user, KullaniciBilgi

router = APIRouter(prefix="/api", tags=["Şehirler"])


class SehirEkle(BaseModel):
    ad: str
    slug: str
    adres: Optional[str] = ""
    aktif_mi: bool = True


@router.get("/sehirler")
async def sehirleri_getir(
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    sehirler = await db["sehirler"].find().sort("ad", 1).to_list(100)
    sonuc = []
    for s in sehirler:
        yetkili = None
        if s.get("yetkili_id"):
            u = await db["users"].find_one({"_id": s["yetkili_id"]})
            if u:
                yetkili = f"{u['ad']} {u['soyad']}"
        sonuc.append({
            "id": str(s["_id"]),
            "ad": s["ad"],
            "slug": s["slug"],
            "adres": s.get("adres", ""),
            "aktif_mi": s["aktif_mi"],
            "yetkili": yetkili,
            "created_at": str(s["created_at"]),
        })
    return sonuc


@router.post("/sehirler")
async def sehir_ekle(
    veri: SehirEkle,
    db: AsyncIOMotorDatabase = Depends(get_database),
    kullanici: KullaniciBilgi = Depends(get_current_user),
):
    if not kullanici.super_admin_mi:
        raise HTTPException(status_code=403, detail="Sadece süper admin şehir ekleyebilir")
    simdi = datetime.utcnow()
    doc = {
        "_id": ObjectId(),
        "ad": veri.ad,
        "slug": veri.slug,
        "adres": veri.adres,
        "aktif_mi": veri.aktif_mi,
        "yetkili_id": None,
        "created_at": simdi,
    }
    await db["sehirler"].insert_one(doc)
    return {"mesaj": "Şehir eklendi", "id": str(doc["_id"])}


@router.put("/sehirler/{sehir_id}")
async def sehir_guncelle(
    sehir_id: str,
    veri: SehirEkle,
    db: AsyncIOMotorDatabase = Depends(get_database),
    kullanici: KullaniciBilgi = Depends(get_current_user),
):
    if not kullanici.super_admin_mi:
        raise HTTPException(status_code=403, detail="Sadece süper admin şehir güncelleyebilir")
    await db["sehirler"].update_one(
        {"_id": ObjectId(sehir_id)},
        {"$set": {"ad": veri.ad, "slug": veri.slug, "adres": veri.adres, "aktif_mi": veri.aktif_mi}},
    )
    return {"mesaj": "Şehir güncellendi"}


@router.post("/sehirler/{sehir_id}/yetkili/{user_id}")
async def yetkili_ata(
    sehir_id: str,
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    kullanici: KullaniciBilgi = Depends(get_current_user),
):
    if not kullanici.super_admin_mi:
        raise HTTPException(status_code=403, detail="Sadece süper admin yetkili atayabilir")
    await db["sehirler"].update_one(
        {"_id": ObjectId(sehir_id)},
        {"$set": {"yetkili_id": ObjectId(user_id)}},
    )
    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"rol_slug": "sehir_admin", "sehir_id": ObjectId(sehir_id)}},
    )
    return {"mesaj": "Yetkili atandı"}


@router.get("/sehirler/{sehir_id}/istatistik")
async def sehir_istatistik(
    sehir_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    kullanici: KullaniciBilgi = Depends(get_current_user),
):
    if not kullanici.super_admin_mi:
        raise HTTPException(status_code=403, detail="Yetkisiz")
    oid = ObjectId(sehir_id)
    siparis_sayisi = await db["orders"].count_documents({"sehir_id": oid})
    musteri_sayisi = await db["customers"].count_documents({"sehir_id": oid})
    urun_sayisi = await db["products"].count_documents({"sehir_id": oid, "aktif_mi": True})
    siparisler = await db["orders"].find({"sehir_id": oid}).to_list(1000)
    ciro = sum(s.get("genel_toplam", 0) for s in siparisler)
    return {
        "siparis_sayisi": siparis_sayisi,
        "musteri_sayisi": musteri_sayisi,
        "urun_sayisi": urun_sayisi,
        "toplam_ciro": ciro,
    }
