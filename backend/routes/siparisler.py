from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from typing import Optional

from core.database import get_database
from core.auth_deps import get_current_user, get_optional_user, KullaniciBilgi

router = APIRouter(prefix="/api", tags=["Siparişler"])

IL_PLAKA = {
    "adana": "01", "adıyaman": "02", "afyonkarahisar": "03", "ağrı": "04",
    "amasya": "05", "ankara": "06", "antalya": "07", "artvin": "08",
    "aydın": "09", "balıkesir": "10", "bilecik": "11", "bingöl": "12",
    "bitlis": "13", "bolu": "14", "burdur": "15", "bursa": "16",
    "çanakkale": "17", "çankırı": "18", "çorum": "19", "denizli": "20",
    "diyarbakır": "21", "edirne": "22", "elazığ": "23", "erzincan": "24",
    "erzurum": "25", "eskişehir": "26", "gaziantep": "27", "giresun": "28",
    "gümüşhane": "29", "hakkari": "30", "hatay": "31", "isparta": "32",
    "mersin": "33", "istanbul": "34", "izmir": "35", "kars": "36",
    "kastamonu": "37", "kayseri": "38", "kırklareli": "39", "kırşehir": "40",
    "kocaeli": "41", "konya": "42", "kütahya": "43", "malatya": "44",
    "manisa": "45", "kahramanmaraş": "46", "mardin": "47", "muğla": "48",
    "muş": "49", "nevşehir": "50", "niğde": "51", "ordu": "52",
    "rize": "53", "sakarya": "54", "samsun": "55", "siirt": "56",
    "sinop": "57", "sivas": "58", "tekirdağ": "59", "tokat": "60",
    "trabzon": "61", "tunceli": "62", "şanlıurfa": "63", "uşak": "64",
    "van": "65", "yozgat": "66", "zonguldak": "67", "aksaray": "68",
    "bayburt": "69", "karaman": "70", "kırıkkale": "71", "batman": "72",
    "şırnak": "73", "bartın": "74", "ardahan": "75", "iğdır": "76",
    "yalova": "77", "karabük": "78", "kilis": "79", "osmaniye": "80",
    "düzce": "81",
}
# Sabit slotlar
SLOTLAR = [
    {"id": "slot1", "baslangic": "07:00", "bitis": "11:00", "label": "07:00 - 11:00"},
    {"id": "slot2", "baslangic": "11:00", "bitis": "14:00", "label": "11:00 - 14:00"},
    {"id": "slot3", "baslangic": "14:00", "bitis": "17:00", "label": "14:00 - 17:00"},
    {"id": "slot4", "baslangic": "17:00", "bitis": "19:00", "label": "17:00 - 19:00"},
]


@router.get("/slotlar")
async def slotlari_getir():
    simdi = datetime.now()
    simdi_dk = simdi.hour * 60 + simdi.minute

    SLOT_ICI_UCRETSIZ_DAK = 30  # Slot başladıktan kaç dk ücretsiz
    EXPRESS_BITIS_ONCESI_DAK = (
        90  # Slot bitimine kaç dk kala express kapanır (1:30 saat)
    )
    SON_SLOT_SONRASI_DAK = 30  # Son slot bittikten kaç dk sonra ertesi gün açılır

    # Son slot bitiş saati
    son_slot_bitis = 19 * 60  # 19:00

    # Ertesi gün mü göstereceğiz?
    ertesi_gun = simdi_dk >= son_slot_bitis + SON_SLOT_SONRASI_DAK

    sonuc = []
    for slot in SLOTLAR:
        bitis_h, bitis_m = map(int, slot["bitis"].split(":"))
        bitis_dk = bitis_h * 60 + bitis_m
        baslangic_h, baslangic_m = map(int, slot["baslangic"].split(":"))
        baslangic_dk = baslangic_h * 60 + baslangic_m

        if ertesi_gun:
            # Ertesi gün için tüm slotlar normal açık
            musait = True
            express = False
            gecmis = False
            etiket = "Yarın"
        else:
            gecmis = simdi_dk >= bitis_dk

            if gecmis:
                musait = False
                express = False
                etiket = "Geçti"
            elif simdi_dk < baslangic_dk:
                # Slot henüz başlamadı
                musait = True
                express = False
                etiket = "Bugün"
            elif simdi_dk <= baslangic_dk + SLOT_ICI_UCRETSIZ_DAK:
                # Slot başladı, 30 dk geçmedi → ücretsiz
                musait = True
                express = False
                etiket = "Bugün"
            elif simdi_dk <= bitis_dk - EXPRESS_BITIS_ONCESI_DAK:
                # 30 dk geçti, bitişe 1:30 saatten fazla var → express
                musait = False
                express = True
                etiket = "Bugün"
            else:
                # Bitişe 1:30 saatten az kaldı → seçilemez
                musait = False
                express = False
                etiket = "Geçti"

        sonuc.append(
            {
                **slot,
                "musait": musait,
                "express": express,
                "gecmis": gecmis if not ertesi_gun else False,
                "express_ucret": 150.0,
                "etiket": etiket if not ertesi_gun else "Yarın",
            }
        )

    return sonuc


class SiparisOlustur(BaseModel):
    musteri_id: str
    adres_id: str
    slot_id: str
    slot_label: str
    odeme_yontemi: str
    express_mi: bool
    express_ucret: float
    siparis_notu: str
    eksik_urun_tercihi: str
    urunler: list
    ara_toplam: float
    genel_toplam: float


@router.post("/siparisler")
async def siparis_olustur(
    veri: SiparisOlustur,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    simdi = datetime.now(timezone(timedelta(hours=3))).replace(tzinfo=None)
    import random, string

    # ── Cari ödeme kontrolü ──────────────────────────────────────────────────
    if veri.odeme_yontemi == "cari":
        musteri_cari = await db.customers.find_one({"_id": ObjectId(veri.musteri_id)})
        if not musteri_cari or not musteri_cari.get("cari_acik_mi"):
            raise HTTPException(status_code=400, detail="Cari hesabınız aktif değil")
        kalan = musteri_cari.get("cari_limit", 0) - musteri_cari.get("mevcut_bakiye", 0)
        if veri.genel_toplam > kalan:
            raise HTTPException(
                status_code=400,
                detail=f"Cari limitiniz yetersiz. Kalan limit: {kalan:.2f} ₺",
            )

    try:
        customer = await db.customers.find_one({"_id": ObjectId(veri.musteri_id)})
        if customer:
            musteri_customer_id = customer["_id"]
            adres = await db.customer_addresses.find_one({"customer_id": musteri_customer_id})
            if adres:
               il_adi = (adres.get("il") or "").lower().strip()
               musteri_il = IL_PLAKA.get(il_adi, "00")
            else:
               musteri_il = "99"  # adres bulunamadı
        else:
            musteri_il = "98"  # customer bulunamadı
    except Exception as e:
        print(f"PLAKA HATA: {e}")
        musteri_il = "97"

    rastgele = ''.join(random.choices(string.digits, k=3)) + ''.join(random.choices(string.ascii_uppercase, k=2))
    siparis_no = f"SF{musteri_il}{int(simdi.timestamp()) % 10000:04d}{rastgele}"

    musteri_sehir_id = customer.get("sehir_id") if customer else None

    doc = {
        "_id": ObjectId(),
        "siparis_no": siparis_no,
        "musteri_id": ObjectId(veri.musteri_id),
        "adres_id": ObjectId(veri.adres_id),
        "slot_id": veri.slot_id,
        "slot_label": veri.slot_label,
        "odeme_yontemi": veri.odeme_yontemi,
        "express_mi": veri.express_mi,
        "express_ucret": veri.express_ucret,
        "siparis_notu": veri.siparis_notu,
        "eksik_urun_tercihi": veri.eksik_urun_tercihi,
        "urunler": veri.urunler,
        "ara_toplam": veri.ara_toplam,
        "genel_toplam": veri.genel_toplam,
        "sehir_id": musteri_sehir_id,
        "durum": "beklemede",
        "created_at": simdi,
        "updated_at": simdi,
    }

    await db["orders"].insert_one(doc)

    # ── Fatura oluştur ──────────────────────────────────────────────────────
    try:
        fatura_yil = simdi.year
        fatura_sayac = await db["counters"].find_one_and_update(
            {"_id": f"fatura_{fatura_yil}"},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=True,
        )
        fatura_no = f"FAB-{fatura_yil}-{fatura_sayac['seq']:05d}"

        _musteri = await db.customers.find_one({"_id": ObjectId(veri.musteri_id)})
        _adres = await db.customer_addresses.find_one({"_id": ObjectId(veri.adres_id)}) if veri.adres_id else None

        musteri_bilgi = {
            "isletme_adi": _musteri.get("isletme_adi", "") if _musteri else "",
            "vergi_no": _musteri.get("vergi_no", "") if _musteri else "",
            "vergi_dairesi": _musteri.get("vergi_dairesi", "") if _musteri else "",
            "telefon": _musteri.get("telefon", "") if _musteri else "",
            "adres": _adres.get("acik_adres", "") if _adres else "",
            "sehir": f"{_adres.get('il', '')} / {_adres.get('ilce', '')}" if _adres else "",
        }

        kalemler = [
            {
                "urun_adi": u.get("ad", u.get("name", "")),
                "miktar": u.get("miktar", u.get("quantity", 1)),
                "birim": u.get("birim_turu", u.get("birim", "adet")),
                "birim_fiyat": u.get("fiyat", u.get("satis_fiyati", 0)),
                "toplam": u.get("toplam", round(u.get("miktar", 1) * u.get("fiyat", 0), 2)),
            }
            for u in veri.urunler
        ]

        kdv_orani = 10
        kdv_tutari = round(veri.genel_toplam * kdv_orani / (100 + kdv_orani), 2)
        kdv_matrah = round(veri.genel_toplam - kdv_tutari, 2)

        await db["faturalar"].insert_one({
            "_id": ObjectId(),
            "fatura_no": fatura_no,
            "siparis_id": doc["_id"],
            "siparis_no": siparis_no,
            "musteri_id": ObjectId(veri.musteri_id),
            "sehir_id": doc.get("sehir_id"),
            "musteri_bilgi": musteri_bilgi,
            "kalemler": kalemler,
            "ara_toplam": veri.ara_toplam,
            "express_ucret": veri.express_ucret,
            "kdv_matrah": kdv_matrah,
            "kdv_orani": kdv_orani,
            "kdv_tutari": kdv_tutari,
            "genel_toplam": veri.genel_toplam,
            "odeme_yontemi": veri.odeme_yontemi,
            "durum": "aktif",
            "e_arsiv_uuid": None,
            "e_arsiv_url": None,
            "gib_durum": None,
            "created_at": simdi,
        })
    except Exception as e:
        print(f"FATURA OLUŞTURMA HATA: {e}")

    # ── Cari ise bakiyeyi artır ve işlem kaydı oluştur ──────────────────────
    if veri.odeme_yontemi == "cari":
        musteri_doc = await db.customers.find_one({"_id": ObjectId(veri.musteri_id)})
        yeni_bakiye = musteri_doc.get("mevcut_bakiye", 0) + veri.genel_toplam
        await db.customers.update_one(
            {"_id": ObjectId(veri.musteri_id)},
            {"$set": {"mevcut_bakiye": yeni_bakiye, "updated_at": simdi}},
        )
        await db.cari_islemler.insert_one({
            "_id": ObjectId(),
            "musteri_id": ObjectId(veri.musteri_id),
            "tur": "borc",
            "tutar": veri.genel_toplam,
            "aciklama": f"Sipariş #{siparis_no}",
            "siparis_no": siparis_no,
            "bakiye_sonrasi": yeni_bakiye,
            "created_at": simdi,
        })

    return {
        "mesaj": "Sipariş oluşturuldu",
        "siparis_no": siparis_no,
        "siparis_id": str(doc["_id"]),
    }


@router.get("/siparisler")
async def siparisleri_getir(
    sehir_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_database),
    kullanici: KullaniciBilgi = Depends(get_current_user),
):
    filtre = kullanici.sehir_filtresi(sehir_id)
    siparisler = await db["orders"].find(filtre).sort("created_at", -1).to_list(500)
    sonuc = []
    for s in siparisler:
        musteri = await db["customers"].find_one({"_id": s["musteri_id"]})
        adres = (
            await db["customer_addresses"].find_one({"_id": s["adres_id"]})
            if s.get("adres_id")
            else None
        )
        sonuc.append(
            {
                "siparis_id": str(s["_id"]),
                "siparis_no": s["siparis_no"],
                "musteri_isletme": musteri["isletme_adi"] if musteri else "",
                "vergi_no": musteri["vergi_no"] if musteri else "",
                "slot_label": s["slot_label"],
                "odeme_yontemi": s["odeme_yontemi"],
                "express_mi": s["express_mi"],
                "genel_toplam": s["genel_toplam"],
                "durum": s["durum"],
                "created_at": str(s["created_at"]),
                "urunler": s["urunler"],
                "acik_adres": adres["acik_adres"] if adres else "",
                "adres_sehir": f"{adres['il']} / {adres['ilce']}" if adres else "",
            }
        )
    return sonuc


@router.get("/siparisler/no/{siparis_no}")
async def siparis_no_ile_getir(
    siparis_no: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    s = await db["orders"].find_one({"siparis_no": siparis_no})
    if not s:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    musteri = await db["customers"].find_one({"_id": s["musteri_id"]})
    adres = (
        await db["customer_addresses"].find_one({"_id": s["adres_id"]})
        if s.get("adres_id") else None
    )
    return {
        "siparis_id": str(s["_id"]),
        "siparis_no": s["siparis_no"],
        "musteri_isletme": musteri["isletme_adi"] if musteri else "",
        "vergi_no": musteri["vergi_no"] if musteri else "",
        "slot_label": s["slot_label"],
        "odeme_yontemi": s["odeme_yontemi"],
        "express_mi": s["express_mi"],
        "genel_toplam": s["genel_toplam"],
        "ara_toplam": s.get("ara_toplam", s["genel_toplam"]),
        "express_ucret": s.get("express_ucret", 0),
        "durum": s["durum"],
        "siparis_notu": s.get("siparis_notu", ""),
        "created_at": str(s["created_at"]),
        "urunler": s["urunler"],
        "acik_adres": adres["acik_adres"] if adres else "",
        "adres_sehir": f"{adres['il']} / {adres['ilce']}" if adres else "",
    }


@router.get("/siparisler/musteri/{musteri_id}")
async def musteri_siparisleri(
    musteri_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    siparisler = (
        await db["orders"]
        .find({"musteri_id": ObjectId(musteri_id)})
        .sort("created_at", -1)
        .to_list(100)
    )

    return [
        {
            "siparis_id": str(s["_id"]),
            "siparis_no": s["siparis_no"],
            "slot_label": s["slot_label"],
            "odeme_yontemi": s["odeme_yontemi"],
            "express_mi": s["express_mi"],
            "genel_toplam": s["genel_toplam"],
            "durum": s["durum"],
            "created_at": str(s["created_at"]),
            "urunler": s["urunler"],
        }
        for s in siparisler
    ]


class DurumGuncelle(BaseModel):
    durum: str


@router.put("/siparisler/{siparis_id}/durum")
async def siparis_durum_guncelle(
    siparis_id: str,
    veri: DurumGuncelle,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    await db["orders"].update_one(
        {"_id": ObjectId(siparis_id)},
        {"$set": {"durum": veri.durum, "updated_at": datetime.now(timezone.utc).replace(tzinfo=None)}},
    )
    return {"mesaj": "Durum güncellendi"}
