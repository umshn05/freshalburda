import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export default function AdminKategoriler({ seciliSehir }) {
  const [kategoriler, setKategoriler] = useState([]);
  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliKategori, setSeciliKategori] = useState(null);
  const [modal, setModal] = useState(false);
  const [bildirim, setBildirim] = useState(null);
  const [form, setForm] = useState({ ad: "", slug: "", sira_no: 99 });

  useEffect(() => {
    verileriGetir();
  }, [seciliSehir]);

  const verileriGetir = async () => {
    setYukleniyor(true);
    try {
      const q = seciliSehir ? `?sehir_id=${seciliSehir}` : "";
      const [katRes, urunRes] = await Promise.all([
        fetch(`${API_URL}/api/kategoriler`),
        fetch(`${API_URL}/api/urunler${q}`),
      ]);
      setKategoriler(await katRes.json());
      setUrunler(await urunRes.json());
    } catch (e) { console.error(e); }
    finally { setYukleniyor(false); }
  };

  const bildirimGoster = (mesaj, tip = "basari") => {
    setBildirim({ mesaj, tip });
    setTimeout(() => setBildirim(null), 3000);
  };

  const slugOlustur = (ad) => {
    return ad.toLowerCase()
      .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
      .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  };

  const kaydet = async () => {
    if (!form.ad.trim()) return bildirimGoster("Kategori adı zorunlu", "hata");
    try {
      const res = await fetch(`${API_URL}/api/kategoriler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug: slugOlustur(form.ad) }),
      });
      if (!res.ok) throw new Error();
      bildirimGoster("Kategori eklendi");
      setModal(false);
      setForm({ ad: "", slug: "", sira_no: 99 });
      verileriGetir();
    } catch { bildirimGoster("Hata oluştu", "hata"); }
  };

  const kategoriUrunleri = seciliKategori
    ? urunler.filter(u => u.kategori_id === seciliKategori.id)
    : [];

  return (
    <div>
      {bildirim && (
        <div style={{ ...styles.bildirim, background: bildirim.tip === "basari" ? "#f0fdf4" : "#fef2f2", color: bildirim.tip === "basari" ? "#16a34a" : "#dc2626", border: `1px solid ${bildirim.tip === "basari" ? "#bbf7d0" : "#fecaca"}` }}>
          {bildirim.mesaj}
        </div>
      )}

      <div style={styles.ararac}>
        <h3 style={styles.toplamText}>{kategoriler.length} kategori</h3>
        <button style={styles.ekleBtn} onClick={() => setModal(true)}>+ Yeni Kategori</button>
      </div>

      {yukleniyor ? (
        <div style={styles.yukleniyor}>Yükleniyor...</div>
      ) : (
        <div style={styles.icerik}>
          {/* KATEGORİ LİSTESİ */}
          <div style={styles.kategoriListe}>
            {kategoriler.map(k => {
              const kUrunler = urunler.filter(u => u.kategori_id === k.id);
              return (
                <div
                  key={k.id}
                  style={{ ...styles.kategoriKart, ...(seciliKategori?.id === k.id ? styles.kategoriKartAktif : {}) }}
                  onClick={() => setSeciliKategori(k)}
                >
                  <div style={styles.kategoriKartIcerik}>
                    <div style={styles.kategoriEmoji}>📂</div>
                    <div>
                      <div style={styles.kategoriAd}>{k.ad}</div>
                      <div style={styles.kategoriUrunSayisi}>{kUrunler.length} ürün</div>
                    </div>
                  </div>
                  <div style={styles.okIsareti}>→</div>
                </div>
              );
            })}
          </div>

          {/* KATEGORİ DETAY */}
          {seciliKategori ? (
            <div style={styles.detay}>
              <div style={styles.detayHeader}>
                <h3 style={styles.detayBaslik}>📂 {seciliKategori.ad}</h3>
                <span style={styles.detayUrunSayisi}>{kategoriUrunleri.length} ürün</span>
              </div>

              {kategoriUrunleri.length === 0 ? (
                <div style={styles.bos}>Bu kategoride henüz ürün yok</div>
              ) : (
                <div style={styles.urunListe}>
                  {kategoriUrunleri.map(u => (
                    <div key={u.id} style={styles.urunKart}>
                      <div style={styles.urunGorsel}>
                        {u.gorsel_url ? (
                          <img src={`http://localhost:8000${u.gorsel_url}`} alt={u.ad} style={styles.gorselImg} />
                        ) : (
                          <div style={styles.gorselYok}>🥬</div>
                        )}
                      </div>
                      <div style={styles.urunBilgi}>
                        <div style={styles.urunAd}>{u.ad}</div>
                        {u.aciklama && <div style={styles.urunAciklama}>{u.aciklama}</div>}
                        <div style={styles.urunDetay}>
                          {u.mensei && <span style={styles.detayTag}>📍 {u.mensei}</span>}
                          {u.kalite_sinifi && <span style={styles.detayTag}>⭐ {u.kalite_sinifi}</span>}
                          <span style={styles.detayTag}>📦 {u.birim_turu}</span>
                        </div>
                      </div>
                      <div style={styles.urunFiyat}>
                        {u.satis_fiyati ? (
                          <>
                            <div style={styles.satisFiyati}>{u.satis_fiyati.toFixed(2)} ₺</div>
                            {u.hal_ortalama && <div style={styles.halFiyat}>Hal: {u.hal_ortalama.toFixed(2)} ₺</div>}
                            {u.piyasa_min && u.piyasa_max && (
                              <div style={styles.piyasaFiyat}>{u.piyasa_min.toFixed(2)} - {u.piyasa_max.toFixed(2)} ₺</div>
                            )}
                          </>
                        ) : (
                          <div style={styles.fiyatYok}>Fiyat girilmedi</div>
                        )}
                        <span style={{ ...styles.durumBadge, background: u.aktif_mi ? "#f0fdf4" : "#fef2f2", color: u.aktif_mi ? "#16a34a" : "#dc2626" }}>
                          {u.aktif_mi ? "Aktif" : "Pasif"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={styles.secimBekleniyor}>
              <div style={{ fontSize: 48 }}>📂</div>
              <p>Sol taraftan bir kategori seçin</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div style={styles.modalOverlay} onClick={() => setModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalBaslik}>Yeni Kategori Ekle</h3>
              <button style={styles.modalKapat} onClick={() => setModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Kategori Adı *</label>
              <input style={styles.input} value={form.ad} onChange={e => setForm(f => ({ ...f, ad: e.target.value }))} placeholder="Sebzeler" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Sıra No</label>
              <input style={styles.input} type="number" value={form.sira_no} onChange={e => setForm(f => ({ ...f, sira_no: parseInt(e.target.value) }))} />
            </div>
            <button style={styles.kaydetBtn} onClick={kaydet}>Ekle</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  bildirim: { padding: "12px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, marginBottom: 16 },
  ararac: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  toplamText: { fontSize: 15, color: "#6b7280", margin: 0 },
  ekleBtn: { padding: "10px 20px", borderRadius: 10, background: "#16a34a", color: "#fff", border: "none", fontSize: 14, cursor: "pointer", fontWeight: 600 },
  icerik: { display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 },
  kategoriListe: { display: "flex", flexDirection: "column", gap: 8 },
  kategoriKart: { background: "#fff", borderRadius: 12, padding: "14px 16px", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", border: "2px solid transparent" },
  kategoriKartAktif: { border: "2px solid #16a34a", background: "#f0fdf4" },
  kategoriKartIcerik: { display: "flex", alignItems: "center", gap: 12 },
  kategoriEmoji: { fontSize: 28 },
  kategoriAd: { fontSize: 15, fontWeight: 700, color: "#111827" },
  kategoriUrunSayisi: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  okIsareti: { fontSize: 18, color: "#9ca3af" },
  detay: { background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  detayHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  detayBaslik: { fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 },
  detayUrunSayisi: { background: "#f3f4f6", color: "#6b7280", padding: "3px 10px", borderRadius: 12, fontSize: 13 },
  urunListe: { display: "flex", flexDirection: "column", gap: 12 },
  urunKart: { display: "flex", gap: 16, padding: 16, borderRadius: 12, background: "#f9fafb", alignItems: "center" },
  urunGorsel: { width: 64, height: 64, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" },
  gorselImg: { width: "100%", height: "100%", objectFit: "cover" },
  gorselYok: { fontSize: 32 },
  urunBilgi: { flex: 1 },
  urunAd: { fontSize: 15, fontWeight: 700, color: "#111827" },
  urunAciklama: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  urunDetay: { display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" },
  detayTag: { fontSize: 11, background: "#f3f4f6", color: "#374151", padding: "2px 8px", borderRadius: 8 },
  urunFiyat: { textAlign: "right" },
  satisFiyati: { fontSize: 18, fontWeight: 800, color: "#16a34a" },
  halFiyat: { fontSize: 12, color: "#f59e0b" },
  piyasaFiyat: { fontSize: 11, color: "#9ca3af" },
  fiyatYok: { fontSize: 12, color: "#d1d5db" },
  durumBadge: { display: "inline-block", marginTop: 6, padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600 },
  secimBekleniyor: { background: "#fff", borderRadius: 16, padding: 60, textAlign: "center", color: "#9ca3af", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  bos: { textAlign: "center", padding: 40, color: "#9ca3af" },
  yukleniyor: { textAlign: "center", padding: 60, color: "#9ca3af" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalBaslik: { fontSize: 18, fontWeight: 700, margin: 0 },
  modalKapat: { width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", fontWeight: 700 },
  label: { display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box" },
  kaydetBtn: { width: "100%", padding: "12px", borderRadius: 10, background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" },
};