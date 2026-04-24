from fastapi import Depends, HTTPException, Header
from typing import Optional
from core.security import decode_access_token


class KullaniciBilgi:
    def __init__(self, kullanici_id: str, rol: str, sehir_id: Optional[str] = None):
        self.kullanici_id = kullanici_id
        self.rol = rol
        self.sehir_id = sehir_id

    @property
    def super_admin_mi(self) -> bool:
        return self.rol == "super_admin"

    @property
    def sehir_admin_mi(self) -> bool:
        return self.rol == "sehir_admin"

    @property
    def admin_mi(self) -> bool:
        return self.rol in ("super_admin", "sehir_admin", "finans")

    def sehir_filtresi(self, override_sehir_id: Optional[str] = None) -> dict:
        """Sorgu filtresi döner. super_admin tüm şehirleri görür veya override ile filtreler."""
        if self.super_admin_mi:
            if override_sehir_id:
                from bson import ObjectId
                return {"sehir_id": ObjectId(override_sehir_id)}
            return {}
        if self.sehir_id:
            from bson import ObjectId
            return {"sehir_id": ObjectId(self.sehir_id)}
        return {}


async def get_current_user(authorization: Optional[str] = Header(None)) -> KullaniciBilgi:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Yetkilendirme gerekli")
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token")
    return KullaniciBilgi(
        kullanici_id=payload.get("sub"),
        rol=payload.get("rol"),
        sehir_id=payload.get("sehir_id"),
    )


async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[KullaniciBilgi]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    if not payload:
        return None
    return KullaniciBilgi(
        kullanici_id=payload.get("sub"),
        rol=payload.get("rol"),
        sehir_id=payload.get("sehir_id"),
    )
