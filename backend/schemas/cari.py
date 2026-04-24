from pydantic import BaseModel
from typing import Optional


class CariAyarla(BaseModel):
    cari_acik_mi: bool
    cari_limit: float


class CariOdemeKaydet(BaseModel):
    tutar: float
    aciklama: Optional[str] = ""


class CariTalepGonder(BaseModel):
    musteri_id: str
    mesaj: Optional[str] = ""
