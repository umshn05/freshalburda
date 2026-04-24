from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware

from core.database import connect_to_mongo, close_mongo_connection
from routes.auth import router as auth_router
from routes.urunler import router as urunler_router
from routes.profil import router as profil_router
from routes.siparisler import router as siparisler_router
from routes.cari import router as cari_router
from routes.faturalar import router as faturalar_router
from routes.sehirler import router as sehirler_router

app = FastAPI(
    title="Freshalburda API",
    description="B2B Sebze-Meyve Tedarik ve Dağıtım Platformu",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    
)

# Uploads klasörü oluştur ve statik dosya sunumu
os.makedirs("uploads/urunler", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.on_event("startup")
async def startup():
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown():
    await close_mongo_connection()


app.include_router(auth_router)
app.include_router(urunler_router)
app.include_router(profil_router)
app.include_router(siparisler_router)
app.include_router(cari_router)
app.include_router(faturalar_router)
app.include_router(sehirler_router)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "mesaj": "Sahin Fresh API çalışıyor"}