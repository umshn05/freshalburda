import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

const ROL_LABEL = {
  super_admin: { label: "Süper Admin", bg: "#fef9c3", color: "#854d0e" },
  sehir_admin: { label: "Şehir Admin", bg: "#dbeafe", color: "#1d4ed8" },
  finans: { label: "Finans", bg: "#f3e8ff", color: "#7c3aed" },
};

export default function AdminKullanicilar() {
  const [kullanicilar, setKullanicilar] = useState([]);
  const [sehirler, setSehirler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ad: "", soyad: "", eposta: "", telefon: "", sifre: "", rol_slug: "sehir_admin", sehir_id: "" });
  const [kaydetYukleniyor, setKaydetYukleniyor] = useState(false);
  const [hata, setHata] = useState(null);

  useEffect(() => { verileriGetir(); }, []);

  const verileriGetir = async () => {
    setYukleniyor(true);
    try {
      const [kulRes, sehRes] = await Promise.all([
        fetch(`${API_URL}/api/auth/admin/kullanicilar`),
        fetch(`${API_URL}/api/sehirler`),
      ]);
      setKullanicilar(await kulRes.json());
      setSehirler(await sehRes.json());
    } catch (e) { console.error(e); }
    finally { setYukleniyor(false); }
  };

  const kaydet = async () => {
    setHata(null);
    if (!form.ad || !form.soyad || !form.eposta || !form.sifre) {
      setHata("Ad, soyad, e-posta ve şifre zorunludur");
      return;
    }
    if (form.rol_slug === "sehir_admin" && !form.sehir_id) {
      setHata("Şehir admin için şehir seçilmeli");
      return;
    }
    if (form.sifre.length < 8) {
      setHata("Şifre en az 8 karakter olmalı");
      return;
    }
    setKaydetYukleniyor(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/admin/kullanici-ekle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sehir_id: form.sehir_id || null,
          telefon: form.telefon || "05000000000",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setModal(false);
      setForm({ ad: "", soyad: "", eposta: "", telefon: "", sifre: "", rol_slug: "sehir_admin", sehir_id: "" });
      verileriGetir();
    } catch (e) { setHata(e.message || "Hata oluştu"); }
    finally { setKaydetYukleniyor(false); }
  };

  const aktifPasif = async (id, aktif) => {
    await fetch(`${API_URL}/api/auth/admin/kullanici/${id}/aktif`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktif_mi: aktif }),
    });
    verileriGetir();
  };

  return (
    <div>
      {/* ARAÇ ÇUBUĞU */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: "#6b7280" }}>Toplam {kullanicilar.length} admin kullanıcı</div>
        <button style={s.ekleBtn} onClick={() => { setHata(null); setModal(true); }}>
          + Yeni Admin Ekle
        </button>
      </div>

      {/* TABLO */}
      {yukleniyor ? (
        <div style={s.yukleniyor}>Yükleniyor...</div>
      ) : (
        <div style={s.tablo}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>Ad Soyad</th>
                <th style={s.th}>E-posta</th>
                <th style={s.th}>Rol</th>
                <th style={s.th}>Şehir</th>
                <th style={s.th}>Son Giriş</th>
                <th style={s.th}>Durum</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {kullanicilar.map(u => (
                <tr key={u.id} style={s.tr}>
                  <td style={s.td}>
                    <div style={s.avatar}>{u.ad[0]}{u.soyad[0]}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: "#111827" }}>{u.ad} {u.soyad}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{u.telefon}</div>
                    </div>
                  </td>
                  <td style={s.td}>{u.eposta}</td>
                  <td style={s.td}>
                    <span style={{ ...s.rolBadge, background: ROL_LABEL[u.rol_slug]?.bg, color: ROL_LABEL[u.rol_slug]?.color }}>
                      {ROL_LABEL[u.rol_slug]?.label || u.rol_slug}
                    </span>
                  </td>
                  <td style={s.td}>
                    {u.sehir_ad ? (
                      <span style={s.sehirBadge}>📍 {u.sehir_ad}</span>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: 12 }}>Tüm şehirler</span>
                    )}
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                      {u.son_giris ? new Date(u.son_giris).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "Hiç giriş yapılmadı"}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.durumBadge, background: u.aktif_mi ? "#f0fdf4" : "#fef2f2", color: u.aktif_mi ? "#16a34a" : "#dc2626" }}>
                      {u.aktif_mi ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td style={s.td}>
                    <button
                      style={{ ...s.akifBtn, background: u.aktif_mi ? "#fee2e2" : "#f0fdf4", color: u.aktif_mi ? "#dc2626" : "#16a34a" }}
                      onClick={() => aktifPasif(u.id, !u.aktif_mi)}
                    >
                      {u.aktif_mi ? "Pasife Al" : "Aktife Al"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {kullanicilar.length === 0 && <div style={s.bos}>Henüz admin kullanıcı yok</div>}
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Yeni Admin Kullanıcı Ekle</div>
              <button style={s.kapat} onClick={() => setModal(false)}>✕</button>
            </div>

            <div style={s.ikiKolon}>
              <div style={s.alan}>
                <label style={s.label}>Ad</label>
                <input style={s.input} value={form.ad} onChange={e => setForm(f => ({ ...f, ad: e.target.value }))} placeholder="Ali" />
              </div>
              <div style={s.alan}>
                <label style={s.label}>Soyad</label>
                <input style={s.input} value={form.soyad} onChange={e => setForm(f => ({ ...f, soyad: e.target.value }))} placeholder="Demir" />
              </div>
            </div>

            <div style={s.alan}>
              <label style={s.label}>E-posta</label>
              <input style={s.input} type="email" value={form.eposta} onChange={e => setForm(f => ({ ...f, eposta: e.target.value }))} placeholder="ali@freshalburda.com" />
            </div>

            <div style={s.alan}>
              <label style={s.label}>Telefon</label>
              <input style={s.input} value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))} placeholder="05001234567" />
            </div>

            <div style={s.alan}>
              <label style={s.label}>Şifre</label>
              <input style={s.input} type="password" value={form.sifre} onChange={e => setForm(f => ({ ...f, sifre: e.target.value }))} placeholder="En az 8 karakter" />
            </div>

            <div style={s.alan}>
              <label style={s.label}>Rol</label>
              <select style={s.input} value={form.rol_slug} onChange={e => setForm(f => ({ ...f, rol_slug: e.target.value, sehir_id: "" }))}>
                <option value="sehir_admin">Şehir Admin</option>
                <option value="super_admin">Süper Admin</option>
                <option value="finans">Finans</option>
              </select>
            </div>

            {form.rol_slug === "sehir_admin" && (
              <div style={s.alan}>
                <label style={s.label}>Şehir</label>
                <select style={s.input} value={form.sehir_id} onChange={e => setForm(f => ({ ...f, sehir_id: e.target.value }))}>
                  <option value="">Şehir seçin</option>
                  {sehirler.filter(s2 => s2.aktif_mi).map(s2 => (
                    <option key={s2.id} value={s2.id}>{s2.ad}</option>
                  ))}
                </select>
              </div>
            )}

            {hata && (
              <div style={{ padding: "10px 14px", background: "#fef2f2", color: "#dc2626", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                {hata}
              </div>
            )}

            <button style={{ ...s.kaydetBtn, opacity: kaydetYukleniyor ? 0.7 : 1 }} onClick={kaydet} disabled={kaydetYukleniyor}>
              {kaydetYukleniyor ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  ekleBtn: { padding: "9px 20px", borderRadius: 10, background: "#14532d", color: "#fff", border: "none", fontSize: 13, cursor: "pointer", fontWeight: 700 },
  tablo: { background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 800 },
  thead: { background: "#f9fafb" },
  th: { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "12px 16px", fontSize: 13, color: "#374151", display: "table-cell", verticalAlign: "middle" },
  avatar: { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#f59e0b)", color: "#fff", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0, verticalAlign: "middle" },
  rolBadge: { padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700 },
  sehirBadge: { fontSize: 12, color: "#1d4ed8", fontWeight: 600 },
  durumBadge: { padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700 },
  akifBtn: { padding: "5px 12px", borderRadius: 8, border: "none", fontSize: 12, cursor: "pointer", fontWeight: 600 },
  bos: { textAlign: "center", padding: 40, color: "#9ca3af" },
  yukleniyor: { textAlign: "center", padding: 40, color: "#9ca3af" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  modal: { background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  kapat: { width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", fontWeight: 700 },
  ikiKolon: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  alan: { marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box" },
  kaydetBtn: { width: "100%", padding: "11px", borderRadius: 10, background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" },
};
