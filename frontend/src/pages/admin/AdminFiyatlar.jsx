import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export default function AdminFiyatlar({ seciliSehir }) {
  const [urunler, setUrunler] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [filtre, setFiltre] = useState("tumu");
  const [arama, setArama] = useState("");

  // Geçmiş modal
  const [gecmisModal, setGecmisModal] = useState(null);
  const [gecmis, setGecmis] = useState([]);
  const [gecmisYukleniyor, setGecmisYukleniyor] = useState(false);

  useEffect(() => { verileriGetir(); }, [seciliSehir]);

  const verileriGetir = async () => {
    setYukleniyor(true);
    try {
      const q = seciliSehir ? `?sehir_id=${seciliSehir}` : "";
      const [urunRes, katRes] = await Promise.all([
        fetch(`${API_URL}/api/urunler${q}`),
        fetch(`${API_URL}/api/kategoriler`),
      ]);
      setUrunler(await urunRes.json());
      setKategoriler(await katRes.json());
    } catch (e) { console.error(e); }
    finally { setYukleniyor(false); }
  };

  const gecmisAc = async (urun) => {
    setGecmisModal(urun);
    setGecmis([]);
    setGecmisYukleniyor(true);
    try {
      const res = await fetch(`${API_URL}/api/urunler/${urun.id}/fiyat-gecmisi`);
      setGecmis(await res.json());
    } catch (e) { console.error(e); }
    finally { setGecmisYukleniyor(false); }
  };

  const bugun = new Date().toISOString().slice(0, 10);

  const filtreliUrunler = urunler
    .filter(u => filtre === "tumu" || u.kategori_id === filtre)
    .filter(u => u.ad.toLowerCase().includes(arama.toLowerCase()));

  const katAd = (kid) => kategoriler.find(k => k.id === kid)?.ad || "—";

  return (
    <div>
      {/* ARAÇ ÇUBUĞU */}
      <div style={s.ararac}>
        <input style={s.aramaInput} placeholder="🔍 Ürün ara..." value={arama} onChange={e => setArama(e.target.value)} />
        <div style={s.filtreler}>
          <button style={{ ...s.filtreBtn, ...(filtre === "tumu" ? s.filtreBtnAktif : {}) }} onClick={() => setFiltre("tumu")}>Tümü</button>
          {kategoriler.map(k => (
            <button key={k.id} style={{ ...s.filtreBtn, ...(filtre === k.id ? s.filtreBtnAktif : {}) }} onClick={() => setFiltre(k.id)}>{k.ad}</button>
          ))}
        </div>
      </div>

      {/* TABLO */}
      {yukleniyor ? (
        <div style={s.yukleniyor}>Yükleniyor...</div>
      ) : (
        <div style={s.tablo}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>Ürün</th>
                <th style={s.th}>Kategori</th>
                <th style={s.th}>Birim</th>
                <th style={{ ...s.th, color: "#dc2626" }}>Alış</th>
                <th style={{ ...s.th, color: "#16a34a" }}>Satış</th>
                <th style={{ ...s.th, color: "#f59e0b" }}>Hal Ort.</th>
                <th style={s.th}>Piyasa Min–Max</th>
                <th style={s.th}>Bugün</th>
                <th style={s.th}>Geçmiş</th>
              </tr>
            </thead>
            <tbody>
              {filtreliUrunler.map(u => (
                <tr key={u.id} style={s.tr}>
                  <td style={s.td}><div style={s.urunAd}>{u.ad}</div></td>
                  <td style={s.td}><span style={s.katBadge}>{katAd(u.kategori_id)}</span></td>
                  <td style={s.td}>{u.birim_turu}</td>
                  <td style={s.td}>{u.alis_fiyati ? <span style={s.alisFiyat}>{u.alis_fiyati.toFixed(2)} ₺</span> : <span style={s.yok}>—</span>}</td>
                  <td style={s.td}>{u.satis_fiyati ? <span style={s.satisFiyat}>{u.satis_fiyati.toFixed(2)} ₺</span> : <span style={s.yok}>Girilmedi</span>}</td>
                  <td style={s.td}>{u.hal_ortalama ? <span style={s.halFiyat}>{u.hal_ortalama.toFixed(2)} ₺</span> : <span style={s.yok}>—</span>}</td>
                  <td style={s.td}>
                    {u.piyasa_min && u.piyasa_max
                      ? <span style={s.piyasa}>{u.piyasa_min.toFixed(2)} – {u.piyasa_max.toFixed(2)} ₺</span>
                      : <span style={s.yok}>—</span>}
                  </td>
                  <td style={s.td}>
                    {u.fiyat_tarihi ? (
                      <div>
                        <span style={{ ...s.tarihBadge, background: u.fiyat_tarihi === bugun ? "#f0fdf4" : "#fef9c3", color: u.fiyat_tarihi === bugun ? "#16a34a" : "#854d0e" }}>
                          {u.fiyat_tarihi === bugun ? "Bugün" : new Date(u.fiyat_tarihi).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </span>
                      </div>
                    ) : (
                      <span style={{ ...s.tarihBadge, background: "#fef2f2", color: "#dc2626" }}>Girilmedi</span>
                    )}
                  </td>
                  <td style={s.td}>
                    <button style={s.gecmisBtn} onClick={() => gecmisAc(u)}>📊 Geçmiş</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtreliUrunler.length === 0 && <div style={s.bos}>Ürün bulunamadı</div>}
        </div>
      )}

      {/* GEÇMİŞ FİYAT MODAL */}
      {gecmisModal && (
        <div style={s.overlay} onClick={() => setGecmisModal(null)}>
          <div style={{ ...s.modal, maxWidth: 980 }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>📊 {gecmisModal.ad} — Fiyat Geçmişi</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{katAd(gecmisModal.kategori_id)} • {gecmisModal.birim_turu}</div>
              </div>
              <button style={s.kapat} onClick={() => setGecmisModal(null)}>✕</button>
            </div>

            {gecmisYukleniyor ? (
              <div style={s.yukleniyor}>Yükleniyor...</div>
            ) : gecmis.length === 0 ? (
              <div style={s.bos}>Henüz fiyat kaydı yok</div>
            ) : (
              <div style={{ overflowY: "auto", maxHeight: 480 }}>
                <table style={{ ...s.table, fontSize: 13 }}>
                  <thead>
                    <tr style={s.thead}>
                      <th style={s.th}>Tarih</th>
                      <th style={{ ...s.th, color: "#dc2626" }}>Alış</th>
                      <th style={{ ...s.th, color: "#16a34a" }}>Satış</th>
                      <th style={{ ...s.th, color: "#f59e0b" }}>Hal Ort.</th>
                      <th style={s.th}>Piyasa Min</th>
                      <th style={s.th}>Piyasa Max</th>
                      <th style={s.th}>Marj %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gecmis.map((g) => {
                      const marj = g.alis_fiyati > 0 ? ((g.satis_fiyati - g.alis_fiyati) / g.alis_fiyati * 100).toFixed(1) : null;
                      const bugunMu = g.tarih === bugun;
                      return (
                        <tr key={g.tarih} style={{ ...s.tr, background: bugunMu ? "#f0fdf4" : "transparent" }}>
                          <td style={s.td}>
                            <div style={{ fontWeight: bugunMu ? 800 : 600, color: bugunMu ? "#16a34a" : "#111827" }}>
                              {new Date(g.tarih).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
                            </div>
                            {bugunMu && <div style={{ fontSize: 10, color: "#16a34a", fontWeight: 700 }}>BUGÜN</div>}
                          </td>
                          <td style={s.td}><span style={s.alisFiyat}>{g.alis_fiyati > 0 ? `${g.alis_fiyati.toFixed(2)} ₺` : "—"}</span></td>
                          <td style={s.td}><span style={s.satisFiyat}>{g.satis_fiyati.toFixed(2)} ₺</span></td>
                          <td style={s.td}><span style={s.halFiyat}>{g.hal_ortalama_fiyati > 0 ? `${g.hal_ortalama_fiyati.toFixed(2)} ₺` : "—"}</span></td>
                          <td style={s.td}>{g.piyasa_min_fiyati > 0 ? `${g.piyasa_min_fiyati.toFixed(2)} ₺` : "—"}</td>
                          <td style={s.td}>{g.piyasa_max_fiyati > 0 ? `${g.piyasa_max_fiyati.toFixed(2)} ₺` : "—"}</td>
                          <td style={s.td}>
                            {marj ? (
                              <span style={{ fontWeight: 700, color: parseFloat(marj) >= 20 ? "#16a34a" : parseFloat(marj) >= 10 ? "#f59e0b" : "#dc2626" }}>
                                %{marj}
                              </span>
                            ) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  ararac: { display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" },
  aramaInput: { flex: 1, minWidth: 200, padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none" },
  filtreler: { display: "flex", gap: 8, flexWrap: "wrap" },
  filtreBtn: { padding: "8px 16px", borderRadius: 20, background: "#f9fafb", border: "1.5px solid #e5e7eb", fontSize: 13, cursor: "pointer", fontWeight: 500 },
  filtreBtnAktif: { background: "#14532d", color: "#fff", border: "1.5px solid #14532d" },
  tablo: { background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 860 },
  thead: { background: "#f9fafb" },
  th: { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "11px 16px", fontSize: 13, color: "#374151" },
  urunAd: { fontWeight: 700, color: "#111827" },
  katBadge: { background: "#f3f4f6", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#374151" },
  alisFiyat: { fontWeight: 700, color: "#dc2626" },
  satisFiyat: { fontWeight: 700, color: "#16a34a" },
  halFiyat: { fontWeight: 600, color: "#f59e0b" },
  piyasa: { color: "#6b7280", fontSize: 12 },
  yok: { color: "#d1d5db", fontSize: 12 },
  tarihBadge: { padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700 },
  gecmisBtn: { padding: "5px 12px", borderRadius: 8, background: "#eff6ff", border: "1.5px solid #bfdbfe", color: "#1d4ed8", fontSize: 12, cursor: "pointer", fontWeight: 600 },
  bos: { textAlign: "center", padding: 40, color: "#9ca3af" },
  yukleniyor: { textAlign: "center", padding: 40, color: "#9ca3af" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  modal: { background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  kapat: { width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", fontWeight: 700, flexShrink: 0 },
};
