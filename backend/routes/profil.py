from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional

from core.database import get_database
from core.security import hash_password, verify_password

router = APIRouter(prefix="/api/profil", tags=["Profil"])


# ── PROFİL GETİR ──────────────────────────────────────────────
@router.get("/{user_id}")
async def profil_getir(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    customer = await db["customers"].find_one({"user_id": ObjectId(user_id)})
    adresler = await db["customer_addresses"].find(
        {"customer_id": customer["_id"], "aktif_mi": True}
    ).to_list(20) if customer else []

    return {
        "kullanici_id": str(user["_id"]),
        "ad": user["ad"],
        "soyad": user["soyad"],
        "eposta": user["eposta"],
        "telefon": user["telefon"],
        "musteri": {
            "musteri_id": str(customer["_id"]),
            "isletme_adi": customer["isletme_adi"],
            "vergi_dairesi": customer["vergi_dairesi"],
            "vergi_no": customer["vergi_no"],
            "onay_durumu": customer["onay_durumu"],
            "cari_acik_mi": customer["cari_acik_mi"],
            "cari_limit": customer["cari_limit"],
            "mevcut_bakiye": customer["mevcut_bakiye"],
        } if customer else None,
        "adresler": [
            {
                "adres_id": str(a["_id"]),
                "il": a["il"],
                "ilce": a["ilce"],
                "acik_adres": a["acik_adres"],
                "teslimat_notu": a.get("teslimat_notu", ""),
                "varsayilan_mi": a["varsayilan_mi"],
            }
            for a in adresler
        ],
    }


# ── KİŞİSEL BİLGİ GÜNCELLE ───────────────────────────────────
class KisiselGuncelle(BaseModel):
    ad: str
    soyad: str
    telefon: str


@router.put("/{user_id}/kisisel")
async def kisisel_guncelle(
    user_id: str,
    veri: KisiselGuncelle,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "ad": veri.ad,
            "soyad": veri.soyad,
            "telefon": veri.telefon,
            "updated_at": datetime.utcnow(),
        }}
    )
    return {"mesaj": "Bilgiler güncellendi"}


# ── İŞLETME BİLGİSİ GÜNCELLE ─────────────────────────────────
class IsletmeGuncelle(BaseModel):
    isletme_adi: str
    vergi_dairesi: str


@router.put("/{user_id}/isletme")
async def isletme_guncelle(
    user_id: str,
    veri: IsletmeGuncelle,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    await db["customers"].update_one(
        {"user_id": ObjectId(user_id)},
        {"$set": {
            "isletme_adi": veri.isletme_adi,
            "vergi_dairesi": veri.vergi_dairesi,
            "updated_at": datetime.utcnow(),
        }}
    )
    return {"mesaj": "İşletme bilgileri güncellendi"}


# ── ŞİFRE DEĞİŞTİR ───────────────────────────────────────────
class SifreDegistir(BaseModel):
    mevcut_sifre: str
    yeni_sifre: str


@router.put("/{user_id}/sifre")
async def sifre_degistir(
    user_id: str,
    veri: SifreDegistir,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    if not verify_password(veri.mevcut_sifre, user["sifre_hash"]):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı")

    if len(veri.yeni_sifre) < 8:
        raise HTTPException(status_code=400, detail="Yeni şifre en az 8 karakter olmalı")

    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"sifre_hash": hash_password(veri.yeni_sifre), "updated_at": datetime.utcnow()}}
    )
    return {"mesaj": "Şifre güncellendi"}


# ── ADRES EKLE ────────────────────────────────────────────────
class AdresEkle(BaseModel):
    il: str
    ilce: str
    acik_adres: str
    teslimat_notu: Optional[str] = ""
    varsayilan_mi: Optional[bool] = False


@router.post("/{user_id}/adres")
async def adres_ekle(
    user_id: str,
    veri: AdresEkle,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    customer = await db["customers"].find_one({"user_id": ObjectId(user_id)})
    if not customer:
        raise HTTPException(status_code=404, detail="Müşteri bulunamadı")

    if veri.varsayilan_mi:
        await db["customer_addresses"].update_many(
            {"customer_id": customer["_id"]},
            {"$set": {"varsayilan_mi": False}}
        )

    doc = {
        "_id": ObjectId(),
        "customer_id": customer["_id"],
        "il": veri.il,
        "ilce": veri.ilce,
        "acik_adres": veri.acik_adres,
        "teslimat_notu": veri.teslimat_notu,
        "varsayilan_mi": veri.varsayilan_mi,
        "aktif_mi": True,
        "created_at": datetime.utcnow(),
    }
    await db["customer_addresses"].insert_one(doc)
    return {"mesaj": "Adres eklendi", "adres_id": str(doc["_id"])}


# ── ADRES GÜNCELLE ────────────────────────────────────────────
@router.put("/{user_id}/adres/{adres_id}")
async def adres_guncelle(
    user_id: str,
    adres_id: str,
    veri: AdresEkle,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    customer = await db["customers"].find_one({"user_id": ObjectId(user_id)})

    if veri.varsayilan_mi:
        await db["customer_addresses"].update_many(
            {"customer_id": customer["_id"]},
            {"$set": {"varsayilan_mi": False}}
        )

    await db["customer_addresses"].update_one(
        {"_id": ObjectId(adres_id)},
        {"$set": {
            "il": veri.il,
            "ilce": veri.ilce,
            "acik_adres": veri.acik_adres,
            "teslimat_notu": veri.teslimat_notu,
            "varsayilan_mi": veri.varsayilan_mi,
        }}
    )
    return {"mesaj": "Adres güncellendi"}


# ── ADRES SİL ─────────────────────────────────────────────────
@router.delete("/{user_id}/adres/{adres_id}")
async def adres_sil(
    user_id: str,
    adres_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    await db["customer_addresses"].update_one(
        {"_id": ObjectId(adres_id)},
        {"$set": {"aktif_mi": False}}
    )
    return {"mesaj": "Adres silindi"}