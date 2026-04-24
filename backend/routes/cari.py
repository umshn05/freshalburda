from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from typing import Optional

from core.database import get_database
from core.auth_deps import get_current_user, KullaniciBilgi
from schemas.cari import CariAyarla, CariOdemeKaydet, CariTalepGonder

router = APIRouter(prefix="/api", tags=["Cari"])

def simdi_tr():
    return datetime.now(timezone(timedelta(hours=3))).replace(tzinfo=None)


# ─── Admin: Müşterinin cari ayarlarını güncelle (aç/kapat + limit) ─────────────
@router.put("/admin/cari/{musteri_id}")
async def cari_ayarla(
    musteri_id: str,
    veri: CariAyarla,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    musteri = await db.customers.find_one({"_id": ObjectId(musteri_id)})
    if not musteri:
        raise HTTPException(status_code=404, detail="Müşteri bulunamadı")

    await db.customers.update_one(
        {"_id": ObjectId(musteri_id)},
        {"$set": {
            "cari_acik_mi": veri.cari_acik_mi,
            "cari_limit": veri.cari_limit,
            "updated_at": simdi_tr(),
        }},
    )

    if veri.cari_acik_mi:
        await db.cari_talepler.delete_many({
            "musteri_id": ObjectId(musteri_id),
            "durum": "beklemede",
        })

    return {"mesaj": "Cari ayarlar güncellendi"}


# ─── Admin: Müşteriden ödeme al (bakiyeyi düşür) ───────────────────────────────
@router.post("/admin/cari/{musteri_id}/odeme")
async def cari_odeme_kaydet(
    musteri_id: str,
    veri: CariOdemeKaydet,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    musteri = await db.customers.find_one({"_id": ObjectId(musteri_id)})
    if not musteri:
        raise HTTPException(status_code=404, detail="Müşteri bulunamadı")

    if veri.tutar <= 0:
        raise HTTPException(status_code=400, detail="Tutar sıfırdan büyük olmalıdır")

    mevcut = musteri.get("mevcut_bakiye", 0)
    yeni_bakiye = max(0.0, mevcut - veri.tutar)

    await db.customers.update_one(
        {"_id": ObjectId(musteri_id)},
        {"$set": {"mevcut_bakiye": yeni_bakiye, "updated_at": simdi_tr()}},
    )

    await db.cari_islemler.insert_one({
        "_id": ObjectId(),
        "musteri_id": ObjectId(musteri_id),
        "tur": "odeme",
        "tutar": veri.tutar,
        "aciklama": veri.aciklama or "Ödeme alındı",
        "bakiye_sonrasi": yeni_bakiye,
        "created_at": simdi_tr(),
    })

    return {"mesaj": "Ödeme kaydedildi", "yeni_bakiye": yeni_bakiye}


# ─── Cari işlem geçmişi (admin ve müşteri) ────────────────────────────────────
@router.get("/cari/{musteri_id}/islemler")
async def cari_islemleri_getir(
    musteri_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    musteri = await db.customers.find_one({"_id": ObjectId(musteri_id)})
    if not musteri:
        raise HTTPException(status_code=404, detail="Müşteri bulunamadı")

    islemler = (
        await db.cari_islemler
        .find({"musteri_id": ObjectId(musteri_id)})
        .sort("created_at", -1)
        .to_list(200)
    )

    return {
        "cari_limit": musteri.get("cari_limit", 0),
        "mevcut_bakiye": musteri.get("mevcut_bakiye", 0),
        "kalan_limit": musteri.get("cari_limit", 0) - musteri.get("mevcut_bakiye", 0),
        "islemler": [
            {
                "islem_id": str(i["_id"]),
                "tur": i["tur"],
                "tutar": i["tutar"],
                "aciklama": i.get("aciklama", ""),
                "bakiye_sonrasi": i.get("bakiye_sonrasi", 0),
                "siparis_no": i.get("siparis_no", ""),
                "created_at": str(i["created_at"]),
            }
            for i in islemler
        ],
    }


# ─── Müşteri: Cari hesap talebi gönder ────────────────────────────────────────
@router.post("/cari/talep")
async def cari_talep_gonder(
    veri: CariTalepGonder,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    musteri = await db.customers.find_one({"_id": ObjectId(veri.musteri_id)})
    if not musteri:
        raise HTTPException(status_code=404, detail="Müşteri bulunamadı")

    if musteri.get("cari_acik_mi"):
        raise HTTPException(status_code=400, detail="Cari hesabınız zaten açık")

    mevcut_talep = await db.cari_talepler.find_one({
        "musteri_id": ObjectId(veri.musteri_id),
        "durum": "beklemede",
    })
    if mevcut_talep:
        raise HTTPException(status_code=400, detail="Zaten bekleyen bir talebiniz var")

    await db.cari_talepler.insert_one({
        "_id": ObjectId(),
        "musteri_id": ObjectId(veri.musteri_id),
        "isletme_adi": musteri.get("isletme_adi", ""),
        "mesaj": veri.mesaj,
        "durum": "beklemede",
        "sehir_id": musteri.get("sehir_id"),
        "created_at": simdi_tr(),
    })

    return {"mesaj": "Cari hesap talebiniz iletildi, en kısa sürede değerlendirilecektir"}


# ─── Admin: Bekleyen cari talepleri listele ────────────────────────────────────
@router.get("/admin/cari/talepler")
async def cari_talepleri_listele(
    sehir_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_database),
    kullanici: KullaniciBilgi = Depends(get_current_user),
):
    filtre = {"durum": "beklemede"}
    filtre.update(kullanici.sehir_filtresi(sehir_id))
    talepler = (
        await db.cari_talepler
        .find(filtre)
        .sort("created_at", -1)
        .to_list(100)
    )
    return [
        {
            "talep_id": str(t["_id"]),
            "musteri_id": str(t["musteri_id"]),
            "isletme_adi": t.get("isletme_adi", ""),
            "mesaj": t.get("mesaj", ""),
            "created_at": str(t["created_at"]),
        }
        for t in talepler
    ]
