import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export default function AdminOnayPaneli({ kullanici, onCikis, seciliSehir }) {
    const [musteriler, setMusteriler] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [islem, setIslem] = useState(null);
    const [bildirim, setBildirim] = useState(null);

    const musterileriGetir = async () => {
        setYukleniyor(true);
        try {
            const q = seciliSehir ? `?sehir_id=${seciliSehir}` : "";
            const res = await fetch(`${API_URL}/api/auth/admin/bekleyen-musteriler${q}`);
            const data = await res.json();
            setMusteriler(data);
        } catch (e) {
            console.error(e);
        } finally {
            setYukleniyor(false);
        }
    };

    useEffect(() => {
        musterileriGetir();
    }, [seciliSehir]);

    const onayla = async (musteriId, isletmeAdi) => {
        setIslem(musteriId);
        try {
            await fetch(`${API_URL}/api/auth/admin/musteri-onayla/${musteriId}`, {
                method: "POST",
            });
            setBildirim({ tip: "basari", mesaj: `✅ "${isletmeAdi}" onaylandı!` });
            await musterileriGetir();
        } finally {
            setIslem(null);
            setTimeout(() => setBildirim(null), 3000);
        }
    };

    const reddet = async (musteriId, isletmeAdi) => {
        setIslem(musteriId);
        try {
            await fetch(`${API_URL}/api/auth/admin/musteri-reddet/${musteriId}`, {
                method: "POST",
            });
            setBildirim({ tip: "hata", mesaj: `❌ "${isletmeAdi}" reddedildi!` });
            await musterileriGetir();
        } finally {
            setIslem(null);
            setTimeout(() => setBildirim(null), 3000);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.baslik}>🥬 Freshalburda — Admin Paneli</h1>
                    <p style={styles.altBaslik}>Bekleyen Müşteri Onayları</p>
                </div>
                <button style={styles.btnCikis} onClick={onCikis}>
                    Çıkış Yap
                </button>
            </div>

            {bildirim && (
                <div style={{
                    ...styles.bildirim,
                    background: bildirim.tip === "basari" ? "#f0fdf4" : "#fef2f2",
                    border: `1px solid ${bildirim.tip === "basari" ? "#bbf7d0" : "#fecaca"}`,
                    color: bildirim.tip === "basari" ? "#16a34a" : "#dc2626",
                }}>
                    {bildirim.mesaj}
                </div>
            )}

            {yukleniyor ? (
                <div style={styles.yukleniyor}>Yükleniyor...</div>
            ) : musteriler.length === 0 ? (
                <div style={styles.bos}>
                    <div style={{ fontSize: 48 }}>✅</div>
                    <p>Bekleyen müşteri başvurusu yok.</p>
                </div>
            ) : (
                <div style={styles.liste}>
                    {musteriler.map((m) => (
                        <div key={m.musteri_id} style={styles.kart}>
                            <div style={styles.kartUst}>
                                <div>
                                    <h3 style={styles.isletmeAdi}>{m.isletme_adi}</h3>
                                    <p style={styles.yetkili}>{m.ad} {m.soyad}</p>
                                </div>
                                <span style={styles.beklemeBadge}>Beklemede</span>
                            </div>

                            <div style={styles.bilgiler}>
                                <Bilgi label="E-posta" deger={m.eposta} />
                                <Bilgi label="Telefon" deger={m.telefon} />
                                <Bilgi label="Vergi Dairesi" deger={m.vergi_dairesi} />
                                <Bilgi label="Vergi No" deger={m.vergi_no} />
                                <Bilgi label="İl / İlçe" deger={`${m.il} / ${m.ilce}`} />
                                <Bilgi label="Adres" deger={m.acik_adres} />
                                <Bilgi label="Başvuru Tarihi" deger={new Date(m.created_at).toLocaleDateString("tr-TR")} />
                            </div>

                            <div style={styles.butonlar}>
                                <button
                                    style={{ ...styles.btnOnayla, opacity: islem === m.musteri_id ? 0.7 : 1 }}
                                    onClick={() => onayla(m.musteri_id,m.isletme_adi)}
                                    disabled={islem === m.musteri_id}
                                >
                                    ✅ Onayla
                                </button>
                                <button
                                    style={{ ...styles.btnReddet, opacity: islem === m.musteri_id ? 0.7 : 1 }}
                                    onClick={() => reddet(m.musteri_id,m.isletme_adi)}
                                    disabled={islem === m.musteri_id}
                                >
                                    ❌ Reddet
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Bilgi({ label, deger }) {
    return (
        <div style={styles.bilgiSatir}>
            <span style={styles.bilgiLabel}>{label}:</span>
            <span style={styles.bilgiDeger}>{deger}</span>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f9fafb",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        padding: "32px 24px",
    },
    header: {
        marginBottom: 32,
        borderBottom: "2px solid #dcfce7",
        paddingBottom: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    btnCikis: {
        padding: "8px 20px", borderRadius: 8,
        background: "#fee2e2", color: "#dc2626",
        fontSize: 13, fontWeight: 600,
        border: "none", cursor: "pointer",
    },
    baslik: { fontSize: 24, fontWeight: 700, color: "#14532d", margin: 0 },
    altBaslik: { fontSize: 14, color: "#6b7280", marginTop: 4 },
    yukleniyor: { textAlign: "center", color: "#6b7280", padding: 40 },
    bos: { textAlign: "center", color: "#6b7280", padding: 60 },
    liste: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
        gap: 20,
    },
    kart: {
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        padding: 24,
    },
    kartUst: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    isletmeAdi: { fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 },
    yetkili: { fontSize: 13, color: "#6b7280", marginTop: 4 },
    beklemeBadge: {
        background: "#fef9c3",
        color: "#854d0e",
        fontSize: 12,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 20,
    },
    bilgiler: { marginBottom: 20 },
    bilgiSatir: {
        display: "flex",
        gap: 8,
        padding: "6px 0",
        borderBottom: "1px solid #f3f4f6",
    },
    bilgiLabel: { fontSize: 13, color: "#6b7280", minWidth: 100 },
    bilgiDeger: { fontSize: 13, color: "#111827", fontWeight: 500 },
    butonlar: { display: "flex", gap: 12 },
    btnOnayla: {
        flex: 1, padding: "10px", borderRadius: 8,
        background: "#16a34a", color: "#fff",
        fontSize: 14, fontWeight: 600,
        border: "none", cursor: "pointer",
    },
    btnReddet: {
        flex: 1, padding: "10px", borderRadius: 8,
        background: "#dc2626", color: "#fff",
        fontSize: 14, fontWeight: 600,
        border: "none", cursor: "pointer",
    },

    bildirim: {
        padding: "12px 16px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 20,
    },



};