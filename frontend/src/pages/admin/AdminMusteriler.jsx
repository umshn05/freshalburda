import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export default function AdminMusteriler({ seciliSehir }) {
  const [musteriler, setMusteriler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [filtre, setFiltre] = useState("tumu");
  const [arama, setArama] = useState("");
  const [seciliMusteri, setSeciliMusteri] = useState(null);
  const [bildirim, setBildirim] = useState(null);

  useEffect(() => {
    musterileriGetir();
  }, [seciliSehir]);

  const musterileriGetir = async () => {
    setYukleniyor(true);
    try {
      const q = seciliSehir ? `?sehir_id=${seciliSehir}` : "";
      const res = await fetch(`${API_URL}/api/auth/admin/musteriler${q}`);
      const data = await res.json();
      setMusteriler(data);
    } catch (e) { console.error(e); }
    finally { setYukleniyor(false); }
  };

  const bildirimGoster = (mesaj, tip = "basari") => {
    setBildirim({ mesaj, tip });
    setTimeout(() => setBildirim(null), 3000);
  };

  const onayla = async (musteriId, isletmeAdi) => {
    try {
      await fetch(`${API_URL}/api/auth/admin/musteri-onayla/${musteriId}`, { method: "POST" });
      bildirimGoster(`✅ "${isletmeAdi}" onaylandı`);
      musterileriGetir();
      setSeciliMusteri(null);
    } catch { bildirimGoster("Hata oluştu", "hata"); }
  };

  const reddet = async (musteriId, isletmeAdi) => {
    try {
      await fetch(`${API_URL}/api/auth/admin/musteri-reddet/${musteriId}`, { method: "POST" });
      bildirimGoster(`❌ "${isletmeAdi}" reddedildi`);
      musterileriGetir();
      setSeciliMusteri(null);
    } catch { bildirimGoster("Hata oluştu", "hata"); }
  };

  const musteriSil = async (musteriId, isletmeAdi) => {
    if (!window.confirm(`"${isletmeAdi}" kalıcı olarak silinecek. Emin misiniz?`)) return;
    try {
      await fetch(`${API_URL}/api/auth/admin/musteri-sil/${musteriId}`, { method: "DELETE" });
      bildirimGoster(`🗑️ "${isletmeAdi}" silindi`);
      setSeciliMusteri(null);
      musterileriGetir();
    } catch { bildirimGoster("Hata oluştu", "hata"); }
  };

  const filtreliMusteriler = musteriler
    .filter(m => filtre === "tumu" || m.onay_durumu === filtre)
    .filter(m =>
      m.isletme_adi.toLowerCase().includes(arama.toLowerCase()) ||
      m.ad.toLowerCase().includes(arama.toLowerCase()) ||
      m.eposta.toLowerCase().includes(arama.toLowerCase())
    );

  const ONAY_RENK = {
    "beklemede": { bg: "#fef9c3", color: "#854d0e", label: "Beklemede" },
    "onaylandi": { bg: "#f0fdf4", color: "#16a34a", label: "Onaylı" },
    "reddedildi": { bg: "#fef2f2", color: "#dc2626", label: "Reddedildi" },
  };

  return (
    <div>
      {bildirim && (
        <div style={{ ...styles.bildirim, background: bildirim.tip === "basari" ? "#f0fdf4" : "#fef2f2", color: bildirim.tip === "basari" ? "#16a34a" : "#dc2626", border: `1px solid ${bildirim.tip === "basari" ? "#bbf7d0" : "#fecaca"}` }}>
          {bildirim.mesaj}
        </div>
      )}

      {/* FİLTRE VE ARAMA */}
      <div style={styles.aramaFiltre}>
        <input
          style={styles.aramaInput}
          placeholder="🔍 İşletme adı, yetkili, e-posta..."
          value={arama}
          onChange={e => setArama(e.target.value)}
        />
        <div style={styles.filtreBtnler}>
          {[
            { key: "tumu", label: "Tümü" },
            { key: "beklemede", label: "⏳ Bekleyen" },
            { key: "onaylandi", label: "✅ Onaylı" },
            { key: "reddedildi", label: "❌ Reddedilen" },
          ].map(f => (
            <button
              key={f.key}
              style={{ ...styles.filtreBtn, ...(filtre === f.key ? styles.filtreBtnAktif : {}) }}
              onClick={() => setFiltre(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLO */}
      {yukleniyor ? (
        <div style={styles.yukleniyor}>Yükleniyor...</div>
      ) : (
        <div style={styles.tablo}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>İşletme</th>
                <th style={styles.th}>Yetkili</th>
                <th style={styles.th}>E-posta</th>
                <th style={styles.th}>Telefon</th>
                <th style={styles.th}>Durum</th>
                <th style={styles.th}>Kayıt Tarihi</th>
                <th style={styles.th}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtreliMusteriler.map(m => (
                <tr key={m.musteri_id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.isletmeAdi}>{m.isletme_adi}</div>
                    <div style={styles.vergiNo}>{m.vergi_no}</div>
                  </td>
                  <td style={styles.td}>{m.ad} {m.soyad}</td>
                  <td style={styles.td}>{m.eposta}</td>
                  <td style={styles.td}>{m.telefon}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.onayBadge, background: ONAY_RENK[m.onay_durumu]?.bg, color: ONAY_RENK[m.onay_durumu]?.color }}>
                      {ONAY_RENK[m.onay_durumu]?.label}
                    </span>
                  </td>
                  <td style={styles.td}>{new Date(m.created_at).toLocaleDateString("tr-TR")}</td>
                  <td style={styles.td}>
                    <button style={styles.detayBtn} onClick={() => setSeciliMusteri(m)}>Detay</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtreliMusteriler.length === 0 && (
            <div style={styles.bos}>Müşteri bulunamadı</div>
          )}
        </div>
      )}

      {/* DETAY MODAL */}
      {seciliMusteri && (
        <div style={styles.modalOverlay} onClick={() => setSeciliMusteri(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalBaslik}>{seciliMusteri.isletme_adi}</h3>
              <button style={styles.modalKapat} onClick={() => setSeciliMusteri(null)}>✕</button>
            </div>

            <div style={styles.modalIcerik}>
              <BilgiSatir label="Yetkili" deger={`${seciliMusteri.ad} ${seciliMusteri.soyad}`} />
              <BilgiSatir label="E-posta" deger={seciliMusteri.eposta} />
              <BilgiSatir label="Telefon" deger={seciliMusteri.telefon} />
              <BilgiSatir label="Vergi No" deger={seciliMusteri.vergi_no} />
              <BilgiSatir label="Durum" deger={ONAY_RENK[seciliMusteri.onay_durumu]?.label} />
              <BilgiSatir label="Cari Hesap" deger={seciliMusteri.cari_acik_mi ? "Açık" : "Kapalı"} />
              <BilgiSatir label="Cari Limit" deger={`${seciliMusteri.cari_limit} ₺`} />
              <BilgiSatir label="Mevcut Bakiye" deger={`${seciliMusteri.mevcut_bakiye} ₺`} />
              <BilgiSatir label="Risk Durumu" deger={seciliMusteri.risk_durumu} />
            </div>

            <div style={styles.modalBtnler}>
              {seciliMusteri.onay_durumu !== "onaylandi" && (
                <button style={styles.onaylaBtn} onClick={() => onayla(seciliMusteri.musteri_id, seciliMusteri.isletme_adi)}>
                  ✅ Onayla
                </button>
              )}
              {seciliMusteri.onay_durumu !== "reddedildi" && (
                <button style={styles.reddetBtn} onClick={() => reddet(seciliMusteri.musteri_id, seciliMusteri.isletme_adi)}>
                  ❌ Reddet
                </button>
              )}
              <button style={styles.silBtn} onClick={() => musteriSil(seciliMusteri.musteri_id, seciliMusteri.isletme_adi)}>
                🗑️ Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BilgiSatir({ label, deger }) {
  return (
    <div style={{ display: "flex", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ fontSize: 13, color: "#9ca3af", minWidth: 120 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{deger}</span>
    </div>
  );
}

const styles = {
  bildirim: { padding: "12px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, marginBottom: 16 },
  aramaFiltre: { display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" },
  aramaInput: { flex: 1, minWidth: 200, padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none" },
  filtreBtnler: { display: "flex", gap: 8 },
  filtreBtn: { padding: "8px 16px", borderRadius: 20, background: "#f9fafb", border: "1.5px solid #e5e7eb", fontSize: 13, cursor: "pointer", fontWeight: 500 },
  filtreBtnAktif: { background: "#14532d", color: "#fff", border: "1.5px solid #14532d" },
  tablo: { background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#f9fafb" },
  th: { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "12px 16px", fontSize: 13, color: "#374151" },
  isletmeAdi: { fontWeight: 700, color: "#111827" },
  vergiNo: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  onayBadge: { padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 },
  detayBtn: { padding: "5px 14px", borderRadius: 6, background: "#f3f4f6", border: "none", fontSize: 12, cursor: "pointer", fontWeight: 600 },
  bos: { textAlign: "center", padding: 40, color: "#9ca3af" },
  yukleniyor: { textAlign: "center", padding: 60, color: "#9ca3af" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 480 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalBaslik: { fontSize: 18, fontWeight: 700, margin: 0 },
  modalKapat: { width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", fontWeight: 700 },
  modalIcerik: { marginBottom: 20 },
  modalBtnler: { display: "flex", gap: 12 },
  onaylaBtn: { flex: 1, padding: "10px", borderRadius: 8, background: "#16a34a", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 },
  reddetBtn: { flex: 1, padding: "10px", borderRadius: 8, background: "#dc2626", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 },
  silBtn: { flex: 1, padding: "10px", borderRadius: 8, background: "#f3f4f6", color: "#374151", border: "none", cursor: "pointer", fontWeight: 600 },
};