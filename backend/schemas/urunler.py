from typing import Optional
from pydantic import BaseModel


class KategoriEkle(BaseModel):
    ad: str
    slug: str
    sira_no: Optional[int] = 99


class UrunEkle(BaseModel):
    kategori_id: str
    ad: str
    aciklama: Optional[str] = ""
    birim_turu: str  # kg, adet, demet, kasa
    min_siparis_miktari: Optional[float] = 1
    mensei: Optional[str] = ""
    kalite_sinifi: Optional[str] = ""
    gorsel_url: Optional[str] = ""
    sehir_id: Optional[str] = None


class FiyatEkle(BaseModel):
    alis_fiyati: float
    satis_fiyati: float
    hal_ortalama_fiyati: Optional[float] = 0
    piyasa_min_fiyati: Optional[float] = 0
    piyasa_max_fiyati: Optional[float] = 0