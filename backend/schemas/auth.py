from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
import re


class KayitIstegi(BaseModel):
    ad: str
    soyad: str
    telefon: str
    eposta: EmailStr
    sifre: str
    sifre_tekrar: str
    isletme_adi: str
    vergi_dairesi: str
    vergi_no: str
    il: str
    ilce: str
    acik_adres: str
    teslimat_notu: Optional[str] = ""
    sozlesme_onaylandi: bool
    sehir_id: Optional[str] = None

    @field_validator("telefon")
    @classmethod
    def telefon_dogrula(cls, v):
        temiz = re.sub(r"\D", "", v)
        if len(temiz) not in (10, 11):
            raise ValueError("Geçerli bir telefon numarası girin")
        return temiz

    @field_validator("vergi_no")
    @classmethod
    def vergi_no_dogrula(cls, v):
        if not v.isdigit() or len(v) not in (10, 11):
            raise ValueError("Vergi numarası 10 veya 11 haneli olmalıdır")
        return v

    @field_validator("sifre")
    @classmethod
    def sifre_guclu_mu(cls, v):
        if len(v) < 8:
            raise ValueError("Şifre en az 8 karakter olmalıdır")
        return v

    @field_validator("sozlesme_onaylandi")
    @classmethod
    def sozlesme_kontrol(cls, v):
        if not v:
            raise ValueError("Kullanım sözleşmesini onaylamanız zorunludur")
        return v

    def sifreleri_eslestir(self):
        if self.sifre != self.sifre_tekrar:
            raise ValueError("Şifreler eşleşmiyor")


class KayitCevabi(BaseModel):
    mesaj: str
    kullanici_id: str
    musteri_id: str
    onay_durumu: str


class GirisIstegi(BaseModel):
    eposta: EmailStr
    sifre: str


class GirisCevabi(BaseModel):
    access_token: str
    token_type: str = "bearer"
    kullanici_id: str
    ad: str
    soyad: str
    rol: str
    musteri_id: Optional[str] = None
    onay_durumu: Optional[str] = None
    sehir_id: Optional[str] = None
    
    
class RolCevabi(BaseModel):
    id: str
    slug: str
    label: str
    aciklama: str
    izinler: list
    aktif_mi: bool