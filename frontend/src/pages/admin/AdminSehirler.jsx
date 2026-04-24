import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export default function AdminSehirler() {
  const [sehirler, setSehirler] = useState([]);
  const [istatistikler, setIstatistikler] = useState({});
  const [yukleniyor, setYukleniyor] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ad: "", slug: "", adres: "", aktif_mi: true });
  const [duzenleId, setDuzenleId] = useState(null);
  const [kaydetYukleniyor, setKaydetYukleniyor] = useState(false);

  useEffect(() => { verileriGetir(); }, []);

  const verileriGetir = async () => {
    setYukleniyor(true);
    try {
      const res = await fetch(`${API_URL}/api/sehirler`);
      const data = await res.json();
      setSehirler(data);
      // Her şehrin istatistiğini al
      const istatMap = {};
      await Promise.all(data.map(async (s) => {
        try {
          const r = await fetch(`${API_URL}/api/sehirler/${s.id}/istatistik`);
          if (r.ok) istatMap[s.id] = await r.json();
        } catch {}
      }));
      setIstatistikler(istatMap);
    } catch (e) { console.error(e); }
    finally { setYukleniyor(false); }
  };

  const kaydet = async () => {
    if (!form.ad || !form.slug) return;
    setKaydetYukleniyor(true);
    try {
      const url = duzenleId ? `${API_URL}/api/sehirler/${duzenleId}` : `${API_URL}/api/sehirler`;
      const method = duzenleId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setModal(false);
      setDuzenleId(null);
      setForm({ ad: "", slug: "", adres: "", aktif_mi: true });
      verileriGetir();
    } catch { alert("Hata oluştu"); }
    finally { setKaydetYukleniyor(false); }
  };

  const duzenle = (s) => {
    setDuzenleId(s.id);
    setForm({ ad: s.ad, slug: s.slug, adres: s.adres || "", aktif_mi: s.aktif_mi });
    setModal(true);
  };

  const toplamCiro = Object.values(istatistikler).reduce((t, i) => t + (i.toplam_ciro || 0), 0);
  const toplamSiparis = Object.values(istatistikler).reduce((t, i) => t + (i.siparis_sayisi || 0), 0);
  const toplamMusteri = Object.values(istatistikler).reduce((t, i) => t + (i.musteri_sayisi || 0), 0);

  return (
    <div>
      {/* GENEL ÖZET */}
      <div style={s.ozetGrid}>
        {[
          { label: "Toplam Şehir", deger: sehirler.length, birim: "şehir", renk: "#7c3aed", bg: "#f5f3ff" },
          { label: "Toplam Sipariş", deger: toplamSiparis, birim: "adet", renk: "#1d4ed8", bg: "#eff6ff" },
          { label: "Toplam Müşteri", deger: toplamMusteri, birim: "işletme", renk: "#16a34a", bg: "#f0fdf4" },
          { label: "Toplam Ciro", deger: toplamCiro.toFixed(2), birim: "₺", renk: "#f59e0b", bg: "#fffbeb" },
        ].map(k => (
          <div key={k.label} style={{ ...s.ozetKart, background: k.bg }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.renk }}>{k.deger} <span style={{ fontSize: 13 }}>{k.birim}</span></div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ARAÇ ÇUBUĞU */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Şehir / Tedarikçi Listesi</div>
        <button style={s.ekleBtn} onClick={() => { setDuzenleId(null); setForm({ ad: "", slug: "", adres: "", aktif_mi: true }); setModal(true); }}>
          + Yeni Şehir Ekle
        </button>
      </div>

      {/* ŞEHİR KARTLARI */}
      {yukleniyor ? (
        <div style={s.yukleniyor}>Yükleniyor...</div>
      ) : sehirler.length === 0 ? (
        <div style={s.bos}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌍</div>
          <div>Henüz şehir eklenmemiş</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>Yeni şehir ekleyerek sistemi genişletin</div>
        </div>
      ) : (
        <div style={s.sehirGrid}>
          {sehirler.map(s2 => {
            const ist = istatistikler[s2.id] || {};
            return (
              <div key={s2.id} style={{ ...s.sehirKart, opacity: s2.aktif_mi ? 1 : 0.6 }}>
                <div style={s.sehirHeader}>
                  <div>
                    <div style={s.sehirAd}>{s2.ad}</div>
                    <div style={s.sehirSlug}>/{s2.slug}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ ...s.durum, background: s2.aktif_mi ? "#f0fdf4" : "#fef2f2", color: s2.aktif_mi ? "#16a34a" : "#dc2626" }}>
                      {s2.aktif_mi ? "Aktif" : "Pasif"}
                    </span>
                    <button style={s.duzenleBtn} onClick={() => duzenle(s2)}>✏️</button>
                  </div>
                </div>

                {s2.yetkili && (
                  <div style={s.yetkili}>👤 {s2.yetkili}</div>
                )}
                {s2.adres && (
                  <div style={s.adres}>📍 {s2.adres}</div>
                )}

                <div style={s.istatGrid}>
                  {[
                    { label: "Sipariş", deger: ist.siparis_sayisi ?? "—", renk: "#1d4ed8" },
                    { label: "Müşteri", deger: ist.musteri_sayisi ?? "—", renk: "#16a34a" },
                    { label: "Ürün", deger: ist.urun_sayisi ?? "—", renk: "#7c3aed" },
                    { label: "Ciro", deger: ist.toplam_ciro ? `${ist.toplam_ciro.toFixed(0)}₺` : "—", renk: "#f59e0b" },
                  ].map(item => (
                    <div key={item.label} style={s.istatKutu}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: item.renk }}>{item.deger}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{duzenleId ? "Şehri Düzenle" : "Yeni Şehir Ekle"}</div>
              <button style={s.kapat} onClick={() => setModal(false)}>✕</button>
            </div>

            <div style={s.alan}>
              <label style={s.label}>Şehir / Bölge Adı</label>
              <input style={s.input} value={form.ad} onChange={e => setForm(f => ({ ...f, ad: e.target.value }))} placeholder="İstanbul" />
            </div>
            <div style={s.alan}>
              <label style={s.label}>Slug (URL dostu)</label>
              <input style={s.input} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s/g, "-") }))} placeholder="istanbul" />
            </div>
            <div style={s.alan}>
              <label style={s.label}>Adres / Konum</label>
              <input style={s.input} value={form.adres} onChange={e => setForm(f => ({ ...f, adres: e.target.value }))} placeholder="Sebze Hali, Büyük Çarşı..." />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 20, cursor: "pointer" }}>
              <input type="checkbox" checked={form.aktif_mi} onChange={e => setForm(f => ({ ...f, aktif_mi: e.target.checked }))} />
              Aktif
            </label>

            <button style={{ ...s.kaydetBtn, opacity: kaydetYukleniyor ? 0.7 : 1 }} onClick={kaydet} disabled={kaydetYukleniyor}>
              {kaydetYukleniyor ? "Kaydediliyor..." : (duzenleId ? "Güncelle" : "Ekle")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  ozetGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 },
  ozetKart: { borderRadius: 12, padding: "16px 18px", border: "1px solid #e5e7eb" },
  ekleBtn: { padding: "9px 20px", borderRadius: 10, background: "#14532d", color: "#fff", border: "none", fontSize: 13, cursor: "pointer", fontWeight: 700 },
  sehirGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 },
  sehirKart: { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb" },
  sehirHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  sehirAd: { fontSize: 18, fontWeight: 800, color: "#111827" },
  sehirSlug: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  durum: { padding: "2px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700 },
  duzenleBtn: { background: "#f3f4f6", border: "none", borderRadius: 8, padding: "5px 8px", cursor: "pointer" },
  yetkili: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
  adres: { fontSize: 12, color: "#6b7280", marginBottom: 12 },
  istatGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 12 },
  istatKutu: { background: "#f9fafb", borderRadius: 8, padding: "8px 6px", textAlign: "center" },
  bos: { textAlign: "center", padding: 60, color: "#9ca3af" },
  yukleniyor: { textAlign: "center", padding: 40, color: "#9ca3af" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  modal: { background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  kapat: { width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", fontWeight: 700 },
  alan: { marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box" },
  kaydetBtn: { width: "100%", padding: "11px", borderRadius: 10, background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" },
};
