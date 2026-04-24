import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export default function AdminDashboard({ seciliSehir }) {
  const [istatistik, setIstatistik] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    istatistikGetir();
  }, [seciliSehir]);

  const istatistikGetir = async () => {
    setYukleniyor(true);
    const q = seciliSehir ? `?sehir_id=${seciliSehir}` : "";
    try {
      const [musterilerRes, urunlerRes, kategorilerRes] = await Promise.all([
        fetch(`${API_URL}/api/auth/admin/bekleyen-musteriler${q}`),
        fetch(`${API_URL}/api/urunler`),
        fetch(`${API_URL}/api/kategoriler`),
      ]);

      const bekleyenMusteriler = await musterilerRes.json();
      const urunler = await urunlerRes.json();
      const kategoriler = await kategorilerRes.json();

      // Tüm müşterileri getir
      const tumMusterilerRes = await fetch(`${API_URL}/api/auth/admin/musteriler${q}`);
      const tumMusteriler = await tumMusterilerRes.json();

      setIstatistik({
        bekleyenOnay: bekleyenMusteriler.length,
        toplamMusteri: tumMusteriler.length,
        toplamUrun: urunler.length,
        toplamKategori: kategoriler.length,
        onayliMusteri: tumMusteriler.filter(m => m.onay_durumu === "onaylandi").length,
        reddedilenMusteri: tumMusteriler.filter(m => m.onay_durumu === "reddedildi").length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setYukleniyor(false);
    }
  };

  if (yukleniyor) return <div style={styles.yukleniyor}>Yükleniyor...</div>;

  return (
    <div>
      <div style={styles.kartGrid}>
        <IstatistikKart
          emoji="👥"
          baslik="Toplam Müşteri"
          deger={istatistik?.toplamMusteri}
          renk="#3b82f6"
          arka="#eff6ff"
        />
        <IstatistikKart
          emoji="⏳"
          baslik="Bekleyen Onay"
          deger={istatistik?.bekleyenOnay}
          renk="#f59e0b"
          arka="#fefce8"
        />
        <IstatistikKart
          emoji="✅"
          baslik="Onaylı Müşteri"
          deger={istatistik?.onayliMusteri}
          renk="#16a34a"
          arka="#f0fdf4"
        />
        <IstatistikKart
          emoji="🥬"
          baslik="Toplam Ürün"
          deger={istatistik?.toplamUrun}
          renk="#8b5cf6"
          arka="#f5f3ff"
        />
        <IstatistikKart
          emoji="📂"
          baslik="Kategori"
          deger={istatistik?.toplamKategori}
          renk="#ec4899"
          arka="#fdf2f8"
        />
        <IstatistikKart
          emoji="❌"
          baslik="Reddedilen"
          deger={istatistik?.reddedilenMusteri}
          renk="#ef4444"
          arka="#fef2f2"
        />
      </div>
    </div>
  );
}

function IstatistikKart({ emoji, baslik, deger, renk, arka }) {
  return (
    <div style={{ ...styles.istatistikKart, background: arka }}>
      <div style={{ ...styles.istatistikEmoji, background: renk }}>{emoji}</div>
      <div style={styles.istatistikDeger}>{deger ?? "-"}</div>
      <div style={styles.istatistikBaslik}>{baslik}</div>
    </div>
  );
}

const styles = {
  kartGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 },
  istatistikKart: { borderRadius: 16, padding: 20, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  istatistikEmoji: { width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 12px", color: "#fff" },
  istatistikDeger: { fontSize: 32, fontWeight: 800, color: "#111827" },
  istatistikBaslik: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  yukleniyor: { textAlign: "center", padding: 60, color: "#9ca3af" },
};