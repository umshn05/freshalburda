from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import Optional

from core.database import get_database
from core.auth_deps import get_current_user, KullaniciBilgi

router = APIRouter(prefix="/api", tags=["Faturalar"])


@router.get("/faturalar")
async def faturalari_getir(
    sehir_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_database),
    kullanici: KullaniciBilgi = Depends(get_current_user),
):
    filtre = kullanici.sehir_filtresi(sehir_id)
    faturalar = await db["faturalar"].find(filtre).sort("created_at", -1).to_list(500)
    return [_format(f) for f in faturalar]


@router.get("/faturalar/siparis/{siparis_id}")
async def siparis_faturasi(siparis_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    f = await db["faturalar"].find_one({"siparis_id": ObjectId(siparis_id)})
    if not f:
        raise HTTPException(status_code=404, detail="Bu siparişe ait fatura bulunamadı")
    return _format(f)


@router.get("/faturalar/musteri/{musteri_id}")
async def musteri_faturalari(musteri_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    faturalar = (
        await db["faturalar"]
        .find({"musteri_id": ObjectId(musteri_id)})
        .sort("created_at", -1)
        .to_list(100)
    )
    return [_format(f) for f in faturalar]


@router.get("/faturalar/{fatura_id}")
async def fatura_getir(fatura_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    f = await db["faturalar"].find_one({"_id": ObjectId(fatura_id)})
    if not f:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    return _format(f)


def _format(f):
    return {
        "id": str(f["_id"]),
        "fatura_no": f["fatura_no"],
        "siparis_id": str(f["siparis_id"]),
        "siparis_no": f["siparis_no"],
        "musteri_id": str(f["musteri_id"]),
        "musteri_bilgi": f["musteri_bilgi"],
        "kalemler": f["kalemler"],
        "ara_toplam": f["ara_toplam"],
        "express_ucret": f.get("express_ucret", 0),
        "kdv_matrah": f["kdv_matrah"],
        "kdv_orani": f["kdv_orani"],
        "kdv_tutari": f["kdv_tutari"],
        "genel_toplam": f["genel_toplam"],
        "odeme_yontemi": f["odeme_yontemi"],
        "durum": f["durum"],
        "e_arsiv_uuid": f.get("e_arsiv_uuid"),
        "e_arsiv_url": f.get("e_arsiv_url"),
        "gib_durum": f.get("gib_durum"),
        "created_at": str(f["created_at"]),
    }
