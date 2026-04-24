import { useState, useEffect } from "react";

const MENU_ITEMS = [
  { key: "dashboard", label: "📊 Dashboard" },
  { key: "musteri-onay", label: "⏳ Müşteri Onayları" },
  { key: "musteriler", label: "👥 Müşteri Yönetimi" },
  { key: "urunler", label: "🥬 Ürün Yönetimi" },
  { key: "kategoriler", label: "📂 Kategori Yönetimi" },
  { key: "fiyatlar", label: "💰 Fiyat Yönetimi" },
  { key: "siparisler", label: "📦 Sipariş Yönetimi" },
  { key: "faturalar", label: "🧾 Fatura Yönetimi" },
  { key: "cari", label: "💳 Cari Yönetimi" },
];

const SUPER_ADMIN_MENU = [
  { key: "sehirler", label: "🌍 Şehir Yönetimi" },
  { key: "kullanicilar", label: "👥 Kullanıcı Yönetimi" },
];

export default function AdminLayout({ kullanici, onCikis, children, aktifSekme, setAktifSekme, seciliSehir, setSeciliSehir }) {
  const [menuAcik, setMenuAcik] = useState(true);
  const [sehirler, setSehirler] = useState([]);
  const [sehirDropAcik, setSehirDropAcik] = useState(false);

  const superAdmin = kullanici?.rol === "super_admin";
  const sehirAdmin = kullanici?.rol === "sehir_admin";

  useEffect(() => {
    if (superAdmin) {
      fetch("http://localhost:8000/api/sehirler")
        .then(r => r.json())
        .then(data => setSehirler(data.filter(s => s.aktif_mi)))
        .catch(() => {});
    }
  }, [superAdmin]);

  const menuItems = superAdmin
    ? [...MENU_ITEMS, ...SUPER_ADMIN_MENU]
    : MENU_ITEMS;

  return (
    <div style={styles.page}>
      {/* SOL SIDEBAR */}
      <div style={{ ...styles.sidebar, width: menuAcik ? 240 : 60 }}>
        <div style={styles.logo}>
          <span style={styles.logoEmoji}>🥬</span>
          {menuAcik && <span style={styles.logoText}>Freshalburda</span>}
        </div>

        {/* ŞEHİR GÖSTERGE */}
        {menuAcik && (
          <div style={styles.sehirWrap}>
            {superAdmin ? (
              <div style={{ position: "relative" }}>
                <div
                  style={styles.sehirSelect}
                  onClick={() => setSehirDropAcik(v => !v)}
                >
                  {seciliSehir ? (sehirler.find(s => s.id === seciliSehir)?.ad || "Şehir") : "🌍 Tüm Şehirler"}
                  <span style={{ marginLeft: "auto", opacity: 0.7 }}>▾</span>
                </div>
                {sehirDropAcik && (
                  <div style={styles.sehirDropMenu}>
                    {[{ id: "", ad: "🌍 Tüm Şehirler" }, ...sehirler].map(s => (
                      <div
                        key={s.id}
                        style={{
                          ...styles.sehirDropItem,
                          background: (seciliSehir || "") === s.id ? "rgba(255,255,255,0.25)" : "transparent",
                        }}
                        onClick={() => { setSeciliSehir && setSeciliSehir(s.id || null); setSehirDropAcik(false); }}
                      >
                        {s.ad}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : sehirAdmin && kullanici?.sehir_adi ? (
              <div style={styles.sehirBadge}>📍 {kullanici.sehir_adi}</div>
            ) : null}
          </div>
        )}

        <nav style={styles.nav}>
          {menuItems.map(item => (
            <button
              key={item.key}
              style={{
                ...styles.navBtn,
                ...(aktifSekme === item.key ? styles.navBtnAktif : {}),
                ...(item.key === "sehirler" ? styles.navBtnSehir : {}),
              }}
              onClick={() => setAktifSekme(item.key)}
            >
              <span style={styles.navEmoji}>{item.label.split(" ")[0]}</span>
              {menuAcik && <span style={styles.navLabel}>{item.label.split(" ").slice(1).join(" ")}</span>}
            </button>
          ))}
        </nav>

        <button style={styles.menuToggle} onClick={() => setMenuAcik(!menuAcik)}>
          {menuAcik ? "◀" : "▶"}
        </button>
      </div>

      {/* SAĞ İÇERİK */}
      <div style={{ ...styles.main, marginLeft: menuAcik ? 240 : 60 }}>
        {/* HEADER */}
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={styles.headerBaslik}>
              {menuItems.find(m => m.key === aktifSekme)?.label}
            </h1>
            {superAdmin && seciliSehir && sehirler.length > 0 && (
              <span style={styles.sehirFiltreBadge}>
                📍 {sehirler.find(s => s.id === seciliSehir)?.ad}
              </span>
            )}
            {superAdmin && !seciliSehir && (
              <span style={styles.tumSehirBadge}>🌍 Tüm Şehirler</span>
            )}
          </div>
          <div style={styles.headerSag}>
            <div style={styles.adminInfo}>
              <div style={styles.adminAvatar}>
                {kullanici?.ad?.[0]}{kullanici?.soyad?.[0]}
              </div>
              <div>
                <div style={styles.adminAd}>{kullanici?.ad} {kullanici?.soyad}</div>
                <div style={styles.adminRol}>
                  {kullanici?.rol === "super_admin" ? "Süper Admin" : kullanici?.rol === "sehir_admin" ? "Şehir Admin" : "Admin"}
                </div>
              </div>
            </div>
            <button style={styles.cikisBtn} onClick={onCikis}>Çıkış</button>
          </div>
        </div>

        {/* İÇERİK */}
        <div style={styles.icerik}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", minHeight: "100vh", background: "#f9fafb", fontFamily: "'Segoe UI', sans-serif" },
  sidebar: { background: "#14532d", minHeight: "100vh", display: "flex", flexDirection: "column", transition: "width 0.2s", position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100 },
  logo: { display: "flex", alignItems: "center", gap: 10, padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" },
  logoEmoji: { fontSize: 28, flexShrink: 0 },
  logoText: { fontSize: 18, fontWeight: 800, color: "#fff" },
  sehirWrap: { padding: "10px 10px 0" },
  sehirSelect: { width: "100%", padding: "7px 10px", borderRadius: 8, border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", userSelect: "none" },
  sehirDropMenu: { position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#166534", borderRadius: 8, overflow: "hidden", zIndex: 200, boxShadow: "0 4px 16px rgba(0,0,0,0.3)" },
  sehirDropItem: { padding: "8px 12px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background 0.15s" },
  sehirBadge: { padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 12, fontWeight: 600 },
  nav: { flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" },
  navBtn: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 500, textAlign: "left", width: "100%" },
  navBtnAktif: { background: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 700 },
  navBtnSehir: { borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 8, paddingTop: 14 },
  navEmoji: { fontSize: 18, flexShrink: 0 },
  navLabel: { fontSize: 14 },
  menuToggle: { margin: "12px 8px", padding: "8px", borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", color: "#fff", fontSize: 12 },
  main: { flex: 1, display: "flex", flexDirection: "column", transition: "margin-left 0.2s" },
  header: { background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 },
  headerBaslik: { fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 },
  sehirFiltreBadge: { padding: "4px 12px", borderRadius: 12, background: "#dbeafe", color: "#1d4ed8", fontSize: 12, fontWeight: 700 },
  tumSehirBadge: { padding: "4px 12px", borderRadius: 12, background: "#f0fdf4", color: "#16a34a", fontSize: 12, fontWeight: 700 },
  headerSag: { display: "flex", alignItems: "center", gap: 16 },
  adminInfo: { display: "flex", alignItems: "center", gap: 10 },
  adminAvatar: { width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #16a34a, #f59e0b)", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" },
  adminAd: { fontSize: 13, fontWeight: 600, color: "#111827" },
  adminRol: { fontSize: 11, color: "#9ca3af" },
  cikisBtn: { padding: "7px 16px", borderRadius: 8, background: "#fee2e2", color: "#dc2626", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" },
  icerik: { padding: "24px", flex: 1 },
};
