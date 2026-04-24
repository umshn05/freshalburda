import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

const DURUM = {
    beklemede:     { bg: "#fef9c3", color: "#854d0e",  label: "Beklemede" },
    onaylandi:     { bg: "#dbeafe", color: "#1d4ed8",  label: "Onaylandı" },
    hazirlaniyor:  { bg: "#f3e8ff", color: "#7c3aed",  label: "Hazırlanıyor" },
    dagitimda:     { bg: "#ffedd5", color: "#c2410c",  label: "Dağıtımda" },
    teslim_edildi: { bg: "#f0fdf4", color: "#16a34a",  label: "Teslim Edildi" },
    iptal:         { bg: "#fef2f2", color: "#dc2626",  label: "İptal" },
};

const DURUM_SIRASI = ["beklemede", "onaylandi", "hazirlaniyor", "dagitimda", "teslim_edildi"];

export default function AdminSiparisler({ seciliSehir }) {
    const [siparisler, setSiparisler] = useState([]);
    const [aktifTab, setAktifTab] = useState("normal");
    const [yukleniyor, setYukleniyor] = useState(true);
    const [filtre, setFiltre] = useState("tumu");
    const [arama, setArama] = useState("");
    const [drawer, setDrawer] = useState(null);
    const [bildirim, setBildirim] = useState(null);

    useEffect(() => { siparisleriGetir(); }, [seciliSehir]);

    const siparisleriGetir = async () => {
        setYukleniyor(true);
        try {
            const q = seciliSehir ? `?sehir_id=${seciliSehir}` : "";
            const res = await fetch(`${API_URL}/api/siparisler${q}`);
            setSiparisler(await res.json());
        } catch (e) { console.error(e); }
        finally { setYukleniyor(false); }
    };

    const bildirimGoster = (mesaj, tip = "basari") => {
        setBildirim({ mesaj, tip });
        setTimeout(() => setBildirim(null), 3000);
    };

    const durumGuncelle = async (siparisId, yeniDurum) => {
        try {
            await fetch(`${API_URL}/api/siparisler/${siparisId}/durum`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ durum: yeniDurum }),
            });
            bildirimGoster("Durum güncellendi");
            setSiparisler(prev => prev.map(s => s.siparis_id === siparisId ? { ...s, durum: yeniDurum } : s));
            if (drawer?.siparis_id === siparisId) setDrawer(d => ({ ...d, durum: yeniDurum }));
        } catch { bildirimGoster("Hata oluştu", "hata"); }
    };

    const filtreliSiparisler = siparisler
        .filter(s => aktifTab === "express" ? s.express_mi : !s.express_mi)
        .filter(s => filtre === "tumu" || s.durum === filtre)
        .filter(s =>
            s.siparis_no.toLowerCase().includes(arama.toLowerCase()) ||
            s.musteri_isletme.toLowerCase().includes(arama.toLowerCase())
        );

    return (
        <div style={{ position: "relative" }}>
            {bildirim && (
                <div style={{ ...st.bildirim, background: bildirim.tip === "basari" ? "#f0fdf4" : "#fef2f2", color: bildirim.tip === "basari" ? "#16a34a" : "#dc2626", border: `1px solid ${bildirim.tip === "basari" ? "#bbf7d0" : "#fecaca"}` }}>
                    {bildirim.mesaj}
                </div>
            )}

            {/* TABS */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                {[
                    { key: "normal", label: "🚚 Normal Siparişler", aktifBg: "#16a34a" },
                    { key: "express", label: "⚡ Express Siparişler", aktifBg: "#f59e0b" },
                ].map(t => (
                    <button key={t.key} onClick={() => setAktifTab(t.key)} style={{ padding: "10px 28px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15, background: aktifTab === t.key ? t.aktifBg : "#e5e7eb", color: aktifTab === t.key ? "#fff" : "#374151" }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ARAÇ ÇUBUĞU */}
            <div style={st.ararac}>
                <input style={st.aramaInput} placeholder="🔍 Sipariş no, işletme..." value={arama} onChange={e => setArama(e.target.value)} />
                <div style={st.filtreBtnler}>
                    <button style={{ ...st.filtreBtn, ...(filtre === "tumu" ? st.filtreBtnAktif : {}) }} onClick={() => setFiltre("tumu")}>Tümü</button>
                    {Object.entries(DURUM).map(([key, val]) => (
                        <button key={key} style={{ ...st.filtreBtn, ...(filtre === key ? st.filtreBtnAktif : {}) }} onClick={() => setFiltre(key)}>{val.label}</button>
                    ))}
                </div>
            </div>

            {/* TABLO */}
            {yukleniyor ? (
                <div style={st.yukleniyor}>Yükleniyor...</div>
            ) : (
                <div style={st.tablo}>
                    <table style={st.table}>
                        <thead>
                            <tr style={st.thead}>
                                <th style={st.th}>Sipariş No</th>
                                <th style={st.th}>İşletme</th>
                                <th style={st.th}>Slot</th>
                                <th style={st.th}>Ödeme</th>
                                <th style={st.th}>Tutar</th>
                                <th style={st.th}>Durum</th>
                                <th style={st.th}>Tarih</th>
                                <th style={st.th}>Detay</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtreliSiparisler.map(s => (
                                <tr key={s.siparis_id} style={{ ...st.tr, background: drawer?.siparis_id === s.siparis_id ? "#f0fdf4" : "transparent" }}>
                                    <td style={st.td}>
                                        <div style={st.siparisNo}>{s.siparis_no}</div>
                                        {s.express_mi && <span style={st.expressBadge}>⚡ Express</span>}
                                    </td>
                                    <td style={st.td}>{s.musteri_isletme}</td>
                                    <td style={st.td}>{s.slot_label}</td>
                                    <td style={st.td}>{s.odeme_yontemi === "nakit" ? "💵 Nakit" : s.odeme_yontemi === "cari" ? "📒 Cari" : "💳 Kart"}</td>
                                    <td style={st.td}><span style={st.tutar}>{s.genel_toplam.toFixed(2)} ₺</span></td>
                                    <td style={st.td}>
                                        {/* İNLINE DURUM SEÇİCİ */}
                                        <select
                                            value={s.durum}
                                            onChange={e => durumGuncelle(s.siparis_id, e.target.value)}
                                            style={{ ...st.durumSelect, background: DURUM[s.durum]?.bg, color: DURUM[s.durum]?.color }}
                                        >
                                            {Object.entries(DURUM).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={st.td}>{new Date(s.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                                    <td style={st.td}>
                                        <button style={{ ...st.detayBtn, background: drawer?.siparis_id === s.siparis_id ? "#dcfce7" : "#f3f4f6", color: drawer?.siparis_id === s.siparis_id ? "#16a34a" : "#374151" }} onClick={() => setDrawer(drawer?.siparis_id === s.siparis_id ? null : s)}>
                                            {drawer?.siparis_id === s.siparis_id ? "✕ Kapat" : "→ Detay"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtreliSiparisler.length === 0 && <div style={st.bos}>Sipariş bulunamadı</div>}
                </div>
            )}

            {/* GENİŞ ORTALANMIŞ MODAL */}
            {drawer && (
                <div style={st.modalOverlay} onClick={() => setDrawer(null)}>
                    <div style={st.modal} onClick={e => e.stopPropagation()}>
                        <SiparisDrawer siparis={drawer} onKapat={() => setDrawer(null)} onDurumGuncelle={durumGuncelle} />
                    </div>
                </div>
            )}
        </div>
    );
}

function SiparisDrawer({ siparis, onKapat, onDurumGuncelle }) {
    const aktifIndex = DURUM_SIRASI.indexOf(siparis.durum);

    return (
        <div style={{ display: "flex", flexDirection: "column", maxHeight: "85vh" }}>
            {/* HEADER */}
            <div style={st.modalHeader}>
                <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>{siparis.siparis_no}</div>
                    <div style={{ fontSize: 14, color: "#6b7280", marginTop: 3 }}>{siparis.musteri_isletme} • {new Date(siparis.created_at).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <button style={st.modalKapat} onClick={onKapat}>✕</button>
            </div>

            <div style={{ overflowY: "auto", padding: "0 24px 24px" }}>

                {/* DURUM TİMELINE */}
                <div style={{ marginBottom: 28 }}>
                    <div style={st.bolumBaslik}>Sipariş Durumu</div>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                        {DURUM_SIRASI.map((key, i) => (
                            <div key={key} style={{ display: "flex", alignItems: "center", flex: i < DURUM_SIRASI.length - 1 ? 1 : 0 }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: i <= aktifIndex ? "#16a34a" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: i <= aktifIndex ? "#fff" : "#9ca3af", fontWeight: 700, border: i === aktifIndex ? "3px solid #15803d" : "none", boxShadow: i === aktifIndex ? "0 0 0 4px #dcfce7" : "none" }}>
                                        {i < aktifIndex ? "✓" : i + 1}
                                    </div>
                                    <div style={{ fontSize: 11, color: i <= aktifIndex ? "#16a34a" : "#9ca3af", marginTop: 5, textAlign: "center", maxWidth: 64, fontWeight: i === aktifIndex ? 700 : 500 }}>{DURUM[key].label}</div>
                                </div>
                                {i < DURUM_SIRASI.length - 1 && <div style={{ flex: 1, height: 3, background: i < aktifIndex ? "#16a34a" : "#e5e7eb", margin: "0 4px", marginBottom: 22, borderRadius: 2 }} />}
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {Object.entries(DURUM).map(([key, val]) => (
                            <button key={key} onClick={() => onDurumGuncelle(siparis.siparis_id, key)}
                                style={{ padding: "7px 16px", borderRadius: 20, border: siparis.durum === key ? `2px solid ${val.color}` : "2px solid transparent", background: val.bg, color: val.color, fontSize: 13, fontWeight: siparis.durum === key ? 800 : 600, cursor: "pointer" }}>
                                {siparis.durum === key ? "● " : ""}{val.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2 KOLONLU ANA İÇERİK */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

                    {/* SOL: SİPARİŞ BİLGİLERİ */}
                    <div>
                        <div style={st.bolumBaslik}>Sipariş Bilgileri</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                            {[
                                { label: "Teslimat Slotu", val: siparis.slot_label },
                                { label: "Ödeme Yöntemi", val: siparis.odeme_yontemi === "nakit" ? "💵 Kapıda Nakit" : siparis.odeme_yontemi === "cari" ? "📒 Cari Hesap" : "💳 Online Kart" },
                                { label: "Vergi No", val: siparis.vergi_no || "—" },
                                { label: "Express", val: siparis.express_mi ? "⚡ Evet" : "Hayır" },
                                { label: "Şehir / İlçe", val: siparis.adres_sehir || "—" },
                                { label: "Genel Toplam", val: `${siparis.genel_toplam.toFixed(2)} ₺` },
                            ].map(b => (
                                <div key={b.label} style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 14px" }}>
                                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{b.label}</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginTop: 2 }}>{b.val}</div>
                                </div>
                            ))}
                        </div>
                        {siparis.acik_adres && (
                            <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px" }}>
                                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>Teslimat Adresi</div>
                                <div style={{ fontSize: 13, color: "#374151" }}>📍 {siparis.acik_adres}</div>
                            </div>
                        )}
                    </div>

                    {/* SAĞ: ÜRÜN LİSTESİ */}
                    <div>
                        <div style={st.bolumBaslik}>Ürünler ({siparis.urunler?.length || 0} kalem)</div>
                        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                            {siparis.urunler?.map((u, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderBottom: i < siparis.urunler.length - 1 ? "1px solid #f3f4f6" : "none", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", flex: 1 }}>{u.ad}</span>
                                    <span style={{ fontSize: 13, color: "#6b7280", minWidth: 72, textAlign: "center" }}>{u.miktar} {u.birim_turu}</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", minWidth: 72, textAlign: "right" }}>{u.toplam?.toFixed(2)} ₺</span>
                                </div>
                            ))}
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", background: "#f0fdf4" }}>
                                <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>Toplam</span>
                                <span style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{siparis.genel_toplam.toFixed(2)} ₺</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const st = {
    bildirim: { padding: "12px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, marginBottom: 16 },
    ararac: { display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" },
    aramaInput: { flex: 1, minWidth: 200, padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none" },
    filtreBtnler: { display: "flex", gap: 8, flexWrap: "wrap" },
    filtreBtn: { padding: "6px 12px", borderRadius: 20, background: "#f9fafb", border: "1.5px solid #e5e7eb", fontSize: 12, cursor: "pointer", fontWeight: 500 },
    filtreBtnAktif: { background: "#14532d", color: "#fff", border: "1.5px solid #14532d" },
    tablo: { background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "auto" },
    table: { width: "100%", borderCollapse: "collapse", minWidth: 800 },
    thead: { background: "#f9fafb" },
    th: { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", borderBottom: "1px solid #e5e7eb" },
    tr: { borderBottom: "1px solid #f3f4f6", transition: "background 0.15s" },
    td: { padding: "10px 16px", fontSize: 13, color: "#374151" },
    siparisNo: { fontWeight: 700, color: "#111827" },
    expressBadge: { fontSize: 10, background: "#fef9c3", color: "#854d0e", padding: "2px 6px", borderRadius: 6, fontWeight: 700 },
    tutar: { fontWeight: 700, color: "#16a34a" },
    durumSelect: { padding: "4px 10px", borderRadius: 12, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", outline: "none", appearance: "none", WebkitAppearance: "none", paddingRight: 24, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7280'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" },
    detayBtn: { padding: "5px 14px", borderRadius: 6, border: "none", fontSize: 12, cursor: "pointer", fontWeight: 700 },
    bos: { textAlign: "center", padding: 40, color: "#9ca3af" },
    yukleniyor: { textAlign: "center", padding: 60, color: "#9ca3af" },
    modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
    modal: { background: "#fff", borderRadius: 20, width: "100%", maxWidth: 900, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" },
    modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "22px 24px 18px", borderBottom: "1px solid #e5e7eb", flexShrink: 0 },
    modalKapat: { width: 34, height: 34, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15, flexShrink: 0 },
    bolumBaslik: { fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
};
