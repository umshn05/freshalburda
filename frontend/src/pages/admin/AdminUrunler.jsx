import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export default function AdminUrunler({ seciliSehir }) {
  const [urunler, setUrunler] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [filtre, setFiltre] = useState("tumu");
  const [aktifFiltre, setAktifFiltre] = useState("aktif");
  const [arama, setArama] = useState("");
  const [modal, setModal] = useState(false);
  const [duzenleId, setDuzenleId] = useState(null);
  const [bildirim, setBildirim] = useState(null);
  const [form, setForm] = useState({
    kategori_id: "", ad: "", aciklama: "", birim_turu: "kg",
    min_siparis_miktari: 1, mensei: "", kalite_sinifi: "",
    alis_fiyati: "", satis_fiyati: "", hal_ortalama_fiyati: "",
    piyasa_min_fiyati: "", piyasa_max_fiyati: "",
  });

  useEffect(() => { verileriGetir(); }, [aktifFiltre, seciliSehir]);

  const verileriGetir = async () => {
    setYukleniyor(true);
    try {
      const aktifParam = aktifFiltre === "aktif" ? "true" : aktifFiltre === "pasif" ? "false" : "all";
      const sehirParam = seciliSehir ? `&sehir_id=${seciliSehir}` : "";
      const [urunRes, katRes] = await Promise.all([
        fetch(`${API_URL}/api/urunler?aktif=${aktifParam}${sehirParam}`),
        fetch(`${API_URL}/api/kategoriler`),
      ]);
      setUrunler(await urunRes.json());
      setKategoriler(await katRes.json());
    } catch (e) { console.error(e); }
    finally { setYukleniyor(false); }
  };

  const bildirimGoster = (mesaj, tip = "basari") => {
    setBildirim({ mesaj, tip });
    setTimeout(() => setBildirim(null), 3000);
  };

  const modalAc = (urun = null) => {
    if (urun) {
      setDuzenleId(urun.id);
      setForm({
        kategori_id: urun.kategori_id,
        ad: urun.ad,
        aciklama: urun.aciklama || "",
        birim_turu: urun.birim_turu,
        min_siparis_miktari: urun.min_siparis_miktari || 1,
        mensei: urun.mensei || "",
        kalite_sinifi: urun.kalite_sinifi || "",
        alis_fiyati: urun.alis_fiyati || "",
        satis_fiyati: urun.satis_fiyati || "",
        hal_ortalama_fiyati: urun.hal_ortalama || "",
        piyasa_min_fiyati: urun.piyasa_min || "",
        piyasa_max_fiyati: urun.piyasa_max || "",
      });
    } else {
      setDuzenleId(null);
      setForm({
        kategori_id: "", ad: "", aciklama: "", birim_turu: "kg",
        min_siparis_miktari: 1, mensei: "", kalite_sinifi: "",
        alis_fiyati: "", satis_fiyati: "", hal_ortalama_fiyati: "",
        piyasa_min_fiyati: "", piyasa_max_fiyati: "",
      });
    }
    setModal(true);
  };

  const kaydet = async () => {
    if (!form.ad.trim() || !form.kategori_id) return bildirimGoster("Ad ve kategori zorunlu", "hata");
    try {
      const urunRes = await fetch(`${API_URL}/api/urunler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kategori_id: form.kategori_id, ad: form.ad, aciklama: form.aciklama,
          birim_turu: form.birim_turu, min_siparis_miktari: parseFloat(form.min_siparis_miktari),
          mensei: form.mensei, kalite_sinifi: form.kalite_sinifi, gorsel_url: "",
          sehir_id: seciliSehir || null,
        }),
      });
      if (!urunRes.ok) throw new Error();
      const urunData = await urunRes.json();
      if (form.satis_fiyati) {
        await fetch(`${API_URL}/api/urunler/${urunData.id}/fiyat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            alis_fiyati: parseFloat(form.alis_fiyati) || 0,
            satis_fiyati: parseFloat(form.satis_fiyati),
            hal_ortalama_fiyati: parseFloat(form.hal_ortalama_fiyati) || 0,
            piyasa_min_fiyati: parseFloat(form.piyasa_min_fiyati) || 0,
            piyasa_max_fiyati: parseFloat(form.piyasa_max_fiyati) || 0,
          }),
        });
      }
      bildirimGoster("✅ Ürün eklendi");
      setModal(false);
      verileriGetir();
    } catch { bildirimGoster("Hata oluştu", "hata"); }
  };

  const fiyatGuncelle = async () => {
    if (!form.satis_fiyati) return bildirimGoster("Satış fiyatı zorunlu", "hata");
    try {
      await fetch(`${API_URL}/api/urunler/${duzenleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kategori_id: form.kategori_id, ad: form.ad, aciklama: form.aciklama,
          birim_turu: form.birim_turu, min_siparis_miktari: parseFloat(form.min_siparis_miktari),
          mensei: form.mensei, kalite_sinifi: form.kalite_sinifi, gorsel_url: "",
        }),
      });
      await fetch(`${API_URL}/api/urunler/${duzenleId}/fiyat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alis_fiyati: parseFloat(form.alis_fiyati) || 0,
          satis_fiyati: parseFloat(form.satis_fiyati),
          hal_ortalama_fiyati: parseFloat(form.hal_ortalama_fiyati) || 0,
          piyasa_min_fiyati: parseFloat(form.piyasa_min_fiyati) || 0,
          piyasa_max_fiyati: parseFloat(form.piyasa_max_fiyati) || 0,
        }),
      });
      bildirimGoster("✅ Ürün güncellendi");
      setModal(false);
      verileriGetir();
    } catch { bildirimGoster("Hata oluştu", "hata"); }
  };

  const pasifYap = async (urunId, urunAd) => {
    if (!window.confirm(`"${urunAd}" pasife alınacak. Emin misiniz?`)) return;
    try {
      await fetch(`${API_URL}/api/urunler/${urunId}/pasif`, { method: "POST" });
      bildirimGoster(`⛔ "${urunAd}" pasife alındı`);
      verileriGetir();
    } catch { bildirimGoster("Hata oluştu", "hata"); }
  };

  const aktifYap = async (urunId, urunAd) => {
    if (!window.confirm(`"${urunAd}" aktife alınacak. Emin misiniz?`)) return;
    try {
      await fetch(`${API_URL}/api/urunler/${urunId}/aktif`, { method: "POST" });
      bildirimGoster(`✅ "${urunAd}" aktife alındı`);
      verileriGetir();
    } catch { bildirimGoster("Hata oluştu", "hata"); }
  };

  const gorselYukle = async (urunId, dosya) => {
    if (!dosya) return;
    const formData = new FormData();
    formData.append("file", dosya);
    try {
      const res = await fetch(`${API_URL}/api/urunler/${urunId}/gorsel`, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      bildirimGoster("✅ Görsel yüklendi");
      verileriGetir();
    } catch { bildirimGoster("Görsel yüklenemedi", "hata"); }
  };

  const gorselSil = async (urunId) => {
    if (!window.confirm("Görseli silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`${API_URL}/api/urunler/${urunId}/gorsel`, { method: "DELETE" });
      bildirimGoster("✅ Görsel silindi");
      verileriGetir();
    } catch { bildirimGoster("Görsel silinemedi", "hata"); }
  };

  const filtreliUrunler = urunler
    .filter(u => filtre === "tumu" || u.kategori_id === filtre)
    .filter(u => u.ad.toLowerCase().includes(arama.toLowerCase()));

  return (
    <div>
      {bildirim && (
        <div style={{ ...styles.bildirim, background: bildirim.tip === "basari" ? "#f0fdf4" : "#fef2f2", color: bildirim.tip === "basari" ? "#16a34a" : "#dc2626", border: `1px solid ${bildirim.tip === "basari" ? "#bbf7d0" : "#fecaca"}` }}>
          {bildirim.mesaj}
        </div>
      )}

      {/* ARAÇ ÇUBUĞU */}
      <div style={styles.ararac}>
        <input style={styles.aramaInput} placeholder="🔍 Ürün ara..." value={arama} onChange={e => setArama(e.target.value)} />
        <div style={styles.filtreler}>
          <div style={styles.filtreBtnler}>
            <button style={{ ...styles.filtreBtn, ...(aktifFiltre === "aktif" ? styles.filtreBtnAktif : {}) }} onClick={() => setAktifFiltre("aktif")}>✅ Aktif</button>
            <button style={{ ...styles.filtreBtn, ...(aktifFiltre === "pasif" ? { ...styles.filtreBtnAktif, background: "#dc2626", border: "1.5px solid #dc2626" } : {}) }} onClick={() => setAktifFiltre("pasif")}>⛔ Pasif</button>
          </div>
          <div style={styles.filtreBtnler}>
            <button style={{ ...styles.filtreBtn, ...(filtre === "tumu" ? styles.filtreBtnAktif : {}) }} onClick={() => setFiltre("tumu")}>Tümü</button>
            {kategoriler.map(k => (
              <button key={k.id} style={{ ...styles.filtreBtn, ...(filtre === k.id ? styles.filtreBtnAktif : {}) }} onClick={() => setFiltre(k.id)}>{k.ad}</button>
            ))}
          </div>
        </div>
        <button style={styles.ekleBtn} onClick={() => modalAc()}>+ Yeni Ürün</button>
      </div>

      {/* ÜRÜN GRID */}
      {yukleniyor ? (
        <div style={styles.yukleniyor}>Yükleniyor...</div>
      ) : filtreliUrunler.length === 0 ? (
        <div style={styles.bos}>Ürün bulunamadı</div>
      ) : (
        <div style={styles.grid}>
          {filtreliUrunler.map(u => (
            <div key={u.id} style={{ ...styles.urunKart, opacity: u.aktif_mi ? 1 : 0.6 }}>
              {/* GÖRSEL */}
              <div style={styles.gorselWrap}>
                {u.gorsel_url ? (
                  <>
                    <img src={`http://localhost:8000${u.gorsel_url}`} alt={u.ad} style={styles.gorselImg} />
                    <button style={styles.gorselSilBtn} onClick={() => gorselSil(u.id)}>✕</button>
                  </>
                ) : (
                  <div style={styles.gorselYok}>🥬</div>
                )}
                <label style={styles.gorselYukleBtn}>
                  📷
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => gorselYukle(u.id, e.target.files[0])} />
                </label>
                <span style={{ ...styles.durumBadge, background: u.aktif_mi ? "#16a34a" : "#dc2626" }}>
                  {u.aktif_mi ? "Aktif" : "Pasif"}
                </span>
              </div>

              {/* BİLGİ */}
              <div style={styles.urunBilgi}>
                <div style={styles.urunAd}>{u.ad}</div>
                <div style={styles.urunKategori}>{kategoriler.find(k => k.id === u.kategori_id)?.ad} · {u.birim_turu}</div>
                {u.aciklama && <div style={styles.urunAciklama}>{u.aciklama}</div>}
                <div style={styles.urunDetaylar}>
                  {u.mensei && <span style={styles.tag}>📍 {u.mensei}</span>}
                  {u.kalite_sinifi && <span style={styles.tag}>⭐ {u.kalite_sinifi}</span>}
                </div>
              </div>

              {/* FİYATLAR */}
              <div style={styles.fiyatWrap}>
                <div style={styles.fiyatSatir}>
                  <span style={styles.fiyatLabel}>Alış:</span>
                  <span style={styles.fiyatGri}>{u.alis_fiyati ? `${u.alis_fiyati.toFixed(2)} ₺` : "-"}</span>
                </div>
                <div style={styles.fiyatSatir}>
                  <span style={styles.fiyatLabel}>Satış:</span>
                  <span style={styles.fiyatYesil}>{u.satis_fiyati ? `${u.satis_fiyati.toFixed(2)} ₺` : "Girilmedi"}</span>
                </div>
                <div style={styles.fiyatSatir}>
                  <span style={styles.fiyatLabel}>Hal:</span>
                  <span style={styles.fiyatTuruncu}>{u.hal_ortalama ? `${u.hal_ortalama.toFixed(2)} ₺` : "-"}</span>
                </div>
                {u.piyasa_min && u.piyasa_max && (
                  <div style={styles.piyasaFiyat}>{u.piyasa_min.toFixed(2)} - {u.piyasa_max.toFixed(2)} ₺</div>
                )}
              </div>

              {/* BUTONLAR */}
              <div style={styles.butonlar}>
                <button style={styles.duzenleBtn} onClick={() => modalAc(u)}>✏️ Düzenle</button>
                {u.aktif_mi ? (
                  <button style={styles.pasifBtn} onClick={() => pasifYap(u.id, u.ad)}>⛔ Pasife Al</button>
                ) : (
                  <button style={styles.aktifBtn} onClick={() => aktifYap(u.id, u.ad)}>✅ Aktife Al</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div style={styles.modalOverlay} onClick={() => setModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalBaslik}>{duzenleId ? "Ürün Düzenle" : "Yeni Ürün Ekle"}</h3>
              <button style={styles.modalKapat} onClick={() => setModal(false)}>✕</button>
            </div>

            <div style={styles.bolumBaslik}>📦 Ürün Bilgileri</div>
            <div style={styles.ikilisatir}>
              <Alan label="Kategori *">
                <select style={styles.input} value={form.kategori_id} onChange={e => setForm(f => ({ ...f, kategori_id: e.target.value }))}>
                  <option value="">Seçin</option>
                  {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
                </select>
              </Alan>
              <Alan label="Birim Türü *">
                <select style={styles.input} value={form.birim_turu} onChange={e => setForm(f => ({ ...f, birim_turu: e.target.value }))}>
                  <option value="kg">kg</option>
                  <option value="adet">adet</option>
                  <option value="demet">demet</option>
                  <option value="kasa">kasa</option>
                  <option value="koli">koli</option>
                </select>
              </Alan>
            </div>
            <Alan label="Ürün Adı *">
              <input style={styles.input} value={form.ad} onChange={e => setForm(f => ({ ...f, ad: e.target.value }))} placeholder="Domates" />
            </Alan>
            <Alan label="Açıklama">
              <input style={styles.input} value={form.aciklama} onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))} placeholder="Opsiyonel" />
            </Alan>
            <div style={styles.ikilisatir}>
              <Alan label="Menşei">
                <input style={styles.input} value={form.mensei} onChange={e => setForm(f => ({ ...f, mensei: e.target.value }))} placeholder="Antalya" />
              </Alan>
              <Alan label="Kalite Sınıfı">
                <input style={styles.input} value={form.kalite_sinifi} onChange={e => setForm(f => ({ ...f, kalite_sinifi: e.target.value }))} placeholder="1. Sınıf" />
              </Alan>
            </div>

            <div style={{ ...styles.bolumBaslik, marginTop: 20 }}>💰 Fiyat Bilgileri</div>
            <div style={styles.ikilisatir}>
              <Alan label="Alış Fiyatı (₺)">
                <input style={styles.input} type="number" step="0.01" value={form.alis_fiyati} onChange={e => setForm(f => ({ ...f, alis_fiyati: e.target.value }))} placeholder="0.00" />
              </Alan>
              <Alan label="Satış Fiyatı (₺) *">
                <input style={{ ...styles.input, borderColor: "#16a34a" }} type="number" step="0.01" value={form.satis_fiyati} onChange={e => setForm(f => ({ ...f, satis_fiyati: e.target.value }))} placeholder="0.00" />
              </Alan>
            </div>
            <Alan label="Hal Ortalaması (₺)">
              <input style={styles.input} type="number" step="0.01" value={form.hal_ortalama_fiyati} onChange={e => setForm(f => ({ ...f, hal_ortalama_fiyati: e.target.value }))} placeholder="0.00" />
            </Alan>
            <div style={styles.ikilisatir}>
              <Alan label="Piyasa Min (₺)">
                <input style={styles.input} type="number" step="0.01" value={form.piyasa_min_fiyati} onChange={e => setForm(f => ({ ...f, piyasa_min_fiyati: e.target.value }))} placeholder="0.00" />
              </Alan>
              <Alan label="Piyasa Max (₺)">
                <input style={styles.input} type="number" step="0.01" value={form.piyasa_max_fiyati} onChange={e => setForm(f => ({ ...f, piyasa_max_fiyati: e.target.value }))} placeholder="0.00" />
              </Alan>
            </div>

            <div style={styles.notKutu}>💡 Alış fiyatı müşterilere gösterilmez.</div>
            <button style={styles.kaydetBtn} onClick={duzenleId ? fiyatGuncelle : kaydet}>
              {duzenleId ? "Güncelle" : "Ürünü Ekle"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Alan({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const styles = {
  bildirim: { padding: "12px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, marginBottom: 16 },
  ararac: { display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" },
  aramaInput: { flex: 1, minWidth: 200, padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none" },
  filtreler: { display: "flex", flexDirection: "column", gap: 8 },
  filtreBtnler: { display: "flex", gap: 8, flexWrap: "wrap" },
  filtreBtn: { padding: "6px 14px", borderRadius: 20, background: "#f9fafb", border: "1.5px solid #e5e7eb", fontSize: 13, cursor: "pointer", fontWeight: 500 },
  filtreBtnAktif: { background: "#14532d", color: "#fff", border: "1.5px solid #14532d" },
  ekleBtn: { padding: "10px 20px", borderRadius: 10, background: "#16a34a", color: "#fff", border: "none", fontSize: 14, cursor: "pointer", fontWeight: 600 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
  urunKart: { background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" },
  gorselWrap: { position: "relative", height: 180, background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", display: "flex", alignItems: "center", justifyContent: "center" },
  gorselImg: { width: "100%", height: "100%", objectFit: "cover" },
  gorselYok: { fontSize: 64 },
  gorselSilBtn: { position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700 },
  gorselYukleBtn: { position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "4px 10px", borderRadius: 8, fontSize: 13, cursor: "pointer" },
  durumBadge: { position: "absolute", top: 8, left: 8, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  urunBilgi: { padding: "14px 16px 8px" },
  urunAd: { fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 2 },
  urunKategori: { fontSize: 12, color: "#9ca3af", marginBottom: 6 },
  urunAciklama: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
  urunDetaylar: { display: "flex", gap: 6, flexWrap: "wrap" },
  tag: { fontSize: 11, background: "#f3f4f6", color: "#374151", padding: "2px 8px", borderRadius: 8 },
  fiyatWrap: { padding: "8px 16px", background: "#f9fafb", margin: "0 0 0 0" },
  fiyatSatir: { display: "flex", justifyContent: "space-between", padding: "3px 0" },
  fiyatLabel: { fontSize: 12, color: "#9ca3af" },
  fiyatYesil: { fontSize: 13, fontWeight: 700, color: "#16a34a" },
  fiyatTuruncu: { fontSize: 13, fontWeight: 600, color: "#f59e0b" },
  fiyatGri: { fontSize: 13, color: "#6b7280" },
  piyasaFiyat: { fontSize: 11, color: "#9ca3af", textAlign: "right", marginTop: 2 },
  butonlar: { display: "flex", gap: 8, padding: "12px 16px" },
  duzenleBtn: { flex: 1, padding: "8px", borderRadius: 8, background: "#f3f4f6", border: "none", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  pasifBtn: { flex: 1, padding: "8px", borderRadius: 8, background: "#fee2e2", color: "#dc2626", border: "none", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  aktifBtn: { flex: 1, padding: "8px", borderRadius: 8, background: "#f0fdf4", color: "#16a34a", border: "none", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  bos: { textAlign: "center", padding: 60, color: "#9ca3af" },
  yukleniyor: { textAlign: "center", padding: 60, color: "#9ca3af" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalBaslik: { fontSize: 18, fontWeight: 700, margin: 0 },
  modalKapat: { width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", fontWeight: 700 },
  bolumBaslik: { fontSize: 13, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #dcfce7" },
  ikilisatir: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box" },
  notKutu: { background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#854d0e", marginBottom: 16 },
  kaydetBtn: { width: "100%", padding: "12px", borderRadius: 10, background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" },
};