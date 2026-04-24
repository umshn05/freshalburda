from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import shutil, os
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

from core.database import get_database
from schemas.urunler import KategoriEkle, UrunEkle, FiyatEkle

router = APIRouter(prefix="/api", tags=["Ürünler"])


# ── KATEGORİLER ────────────────────────────────────────────────


@router.get("/kategoriler")
async def kategorileri_getir(db: AsyncIOMotorDatabase = Depends(get_database)):
    kategoriler = (
        await db["categories"].find({"aktif_mi": True}).sort("sira_no", 1).to_list(100)
    )
    return [
        {
            "id": str(k["_id"]),
            "ad": k["ad"],
            "slug": k["slug"],
            "sira_no": k["sira_no"],
        }
        for k in kategoriler
    ]


@router.post("/kategoriler")
async def kategori_ekle(
    veri: KategoriEkle,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    simdi = datetime.utcnow()
    doc = {
        "_id": ObjectId(),
        "ad": veri.ad,
        "slug": veri.slug,
        "ust_kategori_id": None,
        "sira_no": veri.sira_no,
        "aktif_mi": True,
        "gorsel_url": "",
        "created_at": simdi,
    }
    await db["categories"].insert_one(doc)
    return {"mesaj": "Kategori eklendi", "id": str(doc["_id"])}


# ── ÜRÜNLER ────────────────────────────────────────────────────


@router.get("/urunler")
async def urunleri_getir(
    kategori_id: str = None,
    aktif: str = None,
    sehir_id: str = None,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    filtre = {}
    if kategori_id:
        filtre["kategori_id"] = ObjectId(kategori_id)
    if sehir_id:
        filtre["sehir_id"] = ObjectId(sehir_id)
    if aktif == "false":
        filtre["aktif_mi"] = False
    elif aktif == "all":
        pass  # Hepsini getir
    else:
        filtre["aktif_mi"] = True  # Varsayılan aktif

    urunler = await db["products"].find(filtre).to_list(500)
    sonuc = []
    for u in urunler:
        bugun = datetime.utcnow().strftime("%Y-%m-%d")
        fiyat = await db["product_prices"].find_one(
            {"urun_id": u["_id"], "aktif_mi": True},
            sort=[("tarih", -1)]
        )
        sonuc.append({
            "id": str(u["_id"]),
            "ad": u["ad"],
            "aciklama": u.get("aciklama", ""),
            "kategori_id": str(u["kategori_id"]),
            "birim_turu": u["birim_turu"],
            "mensei": u.get("mensei", ""),
            "kalite_sinifi": u.get("kalite_sinifi", ""),
            "min_siparis_miktari": u.get("min_siparis_miktari", 1),
            "gorsel_url": u.get("gorsel_url", ""),
            "aktif_mi": u["aktif_mi"],
            "satis_fiyati": fiyat["satis_fiyati"] if fiyat else None,
            "alis_fiyati": fiyat["alis_fiyati"] if fiyat else None,
            "hal_ortalama": fiyat["hal_ortalama_fiyati"] if fiyat else None,
            "piyasa_min": fiyat["piyasa_min_fiyati"] if fiyat else None,
            "piyasa_max": fiyat["piyasa_max_fiyati"] if fiyat else None,
            "fiyat_tarihi": fiyat["tarih"] if fiyat else None,
        })
    return sonuc

@router.post("/urunler")
async def urun_ekle(
    veri: UrunEkle,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    simdi = datetime.utcnow()
    doc = {
        "_id": ObjectId(),
        "kategori_id": ObjectId(veri.kategori_id),
        "ad": veri.ad,
        "aciklama": veri.aciklama,
        "birim_turu": veri.birim_turu,
        "min_siparis_miktari": veri.min_siparis_miktari,
        "mensei": veri.mensei,
        "kalite_sinifi": veri.kalite_sinifi,
        "gorsel_url": veri.gorsel_url,
        "sehir_id": ObjectId(veri.sehir_id) if veri.sehir_id else None,
        "aktif_mi": True,
        "created_at": simdi,
        "updated_at": simdi,
    }
    await db["products"].insert_one(doc)
    return {"mesaj": "Ürün eklendi", "id": str(doc["_id"])}


@router.post("/urunler/{urun_id}/fiyat")
async def fiyat_ekle(
    urun_id: str,
    veri: FiyatEkle,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    bugun = datetime.utcnow().strftime("%Y-%m-%d")
    await db["product_prices"].update_one(
        {"urun_id": ObjectId(urun_id), "tarih": bugun},
        {
            "$set": {
                "urun_id": ObjectId(urun_id),
                "tarih": bugun,
                "alis_fiyati": veri.alis_fiyati,
                "satis_fiyati": veri.satis_fiyati,
                "hal_ortalama_fiyati": veri.hal_ortalama_fiyati,
                "piyasa_min_fiyati": veri.piyasa_min_fiyati,
                "piyasa_max_fiyati": veri.piyasa_max_fiyati,
                "aktif_mi": True,
            }
        },
        upsert=True,
    )
    return {"mesaj": "Fiyat güncellendi"}


@router.get("/urunler/{urun_id}/fiyat-gecmisi")
async def fiyat_gecmisini_getir(
    urun_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    kayitlar = (
        await db["product_prices"]
        .find({"urun_id": ObjectId(urun_id)})
        .sort("tarih", -1)
        .to_list(365)
    )
    return [
        {
            "tarih": k["tarih"],
            "alis_fiyati": k.get("alis_fiyati", 0),
            "satis_fiyati": k.get("satis_fiyati", 0),
            "hal_ortalama_fiyati": k.get("hal_ortalama_fiyati", 0),
            "piyasa_min_fiyati": k.get("piyasa_min_fiyati", 0),
            "piyasa_max_fiyati": k.get("piyasa_max_fiyati", 0),
        }
        for k in kayitlar
    ]


@router.put("/urunler/{urun_id}")
async def urun_guncelle(
    urun_id: str,
    veri: UrunEkle,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    await db["products"].update_one(
        {"_id": ObjectId(urun_id)},
        {"$set": {
            "kategori_id": ObjectId(veri.kategori_id),
            "ad": veri.ad,
            "aciklama": veri.aciklama,
            "birim_turu": veri.birim_turu,
            "min_siparis_miktari": veri.min_siparis_miktari,
            "mensei": veri.mensei,
            "kalite_sinifi": veri.kalite_sinifi,
            "gorsel_url": veri.gorsel_url,
            "updated_at": datetime.utcnow(),
        }}
    )
    return {"mesaj": "Ürün güncellendi"}

@router.post("/urunler/{urun_id}/pasif")
async def urun_pasif(
    urun_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    await db["products"].update_one(
        {"_id": ObjectId(urun_id)},
        {"$set": {"aktif_mi": False, "updated_at": datetime.utcnow()}}
    )
    return {"mesaj": "Ürün pasife alındı"}


@router.post("/urunler/{urun_id}/aktif")
async def urun_aktif(
    urun_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    await db["products"].update_one(
        {"_id": ObjectId(urun_id)},
        {"$set": {"aktif_mi": True, "updated_at": datetime.utcnow()}}
    )
    return {"mesaj": "Ürün aktife alındı"}

# ── ÜRÜNLERİN GÖRSELİ ────────────────────────────────────────────────────

@router.post("/urunler/{urun_id}/gorsel")
async def gorsel_yukle(
    urun_id: str,
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    upload_dir = "uploads/urunler"
    os.makedirs(upload_dir, exist_ok=True)
    
    uzanti = file.filename.split(".")[-1]
    dosya_adi = f"{urun_id}.{uzanti}"
    dosya_yolu = f"{upload_dir}/{dosya_adi}"
    
    with open(dosya_yolu, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    gorsel_url = f"/uploads/urunler/{dosya_adi}"
    
    await db["products"].update_one(
        {"_id": ObjectId(urun_id)},
        {"$set": {"gorsel_url": gorsel_url, "updated_at": datetime.utcnow()}}
    )
    return {"mesaj": "Görsel yüklendi", "gorsel_url": gorsel_url}

@router.delete("/urunler/{urun_id}/gorsel")
async def gorsel_sil(
    urun_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    urun = await db["products"].find_one({"_id": ObjectId(urun_id)})
    if urun and urun.get("gorsel_url"):
        dosya_yolu = urun["gorsel_url"].lstrip("/")
        if os.path.exists(dosya_yolu):
            os.remove(dosya_yolu)
    
    await db["products"].update_one(
        {"_id": ObjectId(urun_id)},
        {"$set": {"gorsel_url": "", "updated_at": datetime.utcnow()}}
    )
    return {"mesaj": "Görsel silindi"}