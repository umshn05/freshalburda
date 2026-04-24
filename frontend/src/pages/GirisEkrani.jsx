import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export default function GirisEkrani({ onKayitOl, onGirisBasarili }) {
    const [ekran, setEkran] = useState("giris"); // giris | sifremi_unuttum
    const [form, setForm] = useState({ eposta: "", sifre: "", beni_hatirla: false });
    const [sifirlaEposta, setSifirlaEposta] = useState("");
    const [hata, setHata] = useState("");
    const [basari, setBasari] = useState("");
    const [yukleniyor, setYukleniyor] = useState(false);

    // Beni hatırla — sayfa açılınca e-postayı doldur
    useEffect(() => {
        const kayitliEposta = localStorage.getItem("hatirla_eposta");
        if (kayitliEposta) {
            setForm(f => ({ ...f, eposta: kayitliEposta, beni_hatirla: true }));
        }
    }, []);

    const guncelle = (alan, deger) => {
        setForm((f) => ({ ...f, [alan]: deger }));
        setHata("");
    };

    const girisYap = async () => {
        if (!form.eposta.trim()) return setHata("E-posta zorunludur");
        if (!/\S+@\S+\.\S+/.test(form.eposta)) return setHata("Geçerli bir e-posta girin");
        if (!form.sifre.trim()) return setHata("Şifre zorunludur");
        if (form.sifre.length < 8) return setHata("Şifre en az 8 karakter olmalı");

        setYukleniyor(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eposta: form.eposta, sifre: form.sifre }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Giriş başarısız");

            // Beni hatırla
            if (form.beni_hatirla) {
                localStorage.setItem("hatirla_eposta", form.eposta);
            } else {
                localStorage.removeItem("hatirla_eposta");
            }

            localStorage.setItem("token", data.access_token);
            localStorage.setItem("kullanici", JSON.stringify({
                kullanici_id: data.kullanici_id,
                ad: data.ad,
                soyad: data.soyad,
                rol: data.rol,
                musteri_id: data.musteri_id,
                onay_durumu: data.onay_durumu,
            }));

            onGirisBasarili(data);
        } catch (e) {
            setHata(e.message);
        } finally {
            setYukleniyor(false);
        }
    };

    const sifreSifirla = async () => {
        if (!sifirlaEposta.trim()) return setHata("E-posta zorunludur");
        if (!/\S+@\S+\.\S+/.test(sifirlaEposta)) return setHata("Geçerli bir e-posta girin");

        setYukleniyor(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/sifre-sifirla-kontrol`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eposta: sifirlaEposta }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Bir hata oluştu");
            setBasari(data.mesaj);
        } catch (e) {
            setHata(e.message);
        } finally {
            setYukleniyor(false);
        }
    };

    // Şifremi Unuttum Ekranı
    if (ekran === "sifremi_unuttum") {
        return (
            <div style={styles.page}>
                <div style={styles.kart}>
                    <div style={styles.header}>
                        <div style={styles.logo}>🥬</div>
                        <h1 style={styles.baslik}>Freshalburda</h1>
                        <p style={styles.altBaslik}>Şifre Sıfırlama</p>
                    </div>

                    {hata && <div style={styles.hataKutu}>{hata}</div>}
                    {basari && <div style={styles.basariKutu}>{basari}</div>}

                    {!basari && (
                        <>
                            <p style={styles.aciklama}>
                                Kayıtlı e-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
                            </p>
                            <div style={styles.alan}>
                                <label style={styles.label}>E-posta</label>
                                <input
                                    style={styles.input}
                                    placeholder="info@restoran.com"
                                    type="email"
                                    value={sifirlaEposta}
                                    onChange={e => { setSifirlaEposta(e.target.value); setHata(""); }}
                                />
                            </div>
                            <button
                                style={{ ...styles.btnPrimary, opacity: yukleniyor ? 0.7 : 1 }}
                                onClick={sifreSifirla}
                                disabled={yukleniyor}
                            >
                                {yukleniyor ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
                            </button>
                        </>
                    )}

                    <p style={styles.kayitLink}>
                        <span style={styles.link} onClick={() => { setEkran("giris"); setHata(""); setBasari(""); }}>
                            ← Giriş ekranına dön
                        </span>
                    </p>
                </div>
            </div>
        );
    }

    // Giriş Ekranı
    return (
        <div style={styles.page}>
            <div style={styles.kart}>
                <div style={styles.header}>
                    <div style={styles.logo}>🥬</div>
                    <h1 style={styles.baslik}>Freshalburda</h1>
                    <p style={styles.altBaslik}>İşletme Girişi</p>
                </div>

                {hata && <div style={styles.hataKutu}>{hata}</div>}

                <div style={styles.alan}>
                    <label style={styles.label}>E-posta</label>
                    <input
                        style={styles.input}
                        placeholder="info@restoran.com"
                        type="email"
                        value={form.eposta}
                        onChange={e => guncelle("eposta", e.target.value)}
                    />
                </div>

                <div style={styles.alan}>
                    <label style={styles.label}>Şifre</label>
                    <input
                        style={styles.input}
                        placeholder="Şifreniz"
                        type="password"
                        value={form.sifre}
                        onChange={e => guncelle("sifre", e.target.value)}
                        onKeyDown={e => e.key === "Enter" && girisYap()}
                    />
                </div>

                <div style={styles.altSatir}>
                    <label style={styles.beniHatirlaLabel}>
                        <input
                            type="checkbox"
                            checked={form.beni_hatirla}
                            onChange={e => guncelle("beni_hatirla", e.target.checked)}
                            style={styles.checkbox}
                        />
                        Beni hatırla
                    </label>
                    <span style={styles.link} onClick={() => { setEkran("sifremi_unuttum"); setHata(""); }}>
                        Şifremi unuttum
                    </span>
                </div>

                <button
                    style={{ ...styles.btnPrimary, opacity: yukleniyor ? 0.7 : 1 }}
                    onClick={girisYap}
                    disabled={yukleniyor}
                >
                    {yukleniyor ? "Giriş yapılıyor..." : "Giriş Yap"}
                </button>

                <p style={styles.kayitLink}>
                    Henüz hesabınız yok mu?{" "}
                    <span style={styles.link} onClick={onKayitOl}>Kayıt olun</span>
                </p>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },
    kart: {
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        padding: "40px 36px",
        width: "100%",
        maxWidth: 420,
    },
    header: { textAlign: "center", marginBottom: 32 },
    logo: { fontSize: 48, marginBottom: 8 },
    baslik: { fontSize: 28, fontWeight: 700, color: "#14532d", margin: 0 },
    altBaslik: { fontSize: 15, color: "#6b7280", marginTop: 4 },
    alan: { marginBottom: 16 },
    label: { display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4 },
    input: {
        width: "100%", padding: "10px 12px", borderRadius: 8,
        border: "1.5px solid #d1d5db", fontSize: 14, color: "#111827",
        outline: "none", boxSizing: "border-box", background: "#fafafa",
    },
    altSatir: {
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 20,
    },
    beniHatirlaLabel: {
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 13, color: "#374151", cursor: "pointer",
    },
    checkbox: { width: 15, height: 15, accentColor: "#16a34a" },
    hataKutu: {
        background: "#fef2f2", border: "1px solid #fecaca",
        color: "#dc2626", borderRadius: 8, padding: "12px 16px",
        fontSize: 14, marginBottom: 20,
    },
    basariKutu: {
        background: "#f0fdf4", border: "1px solid #bbf7d0",
        color: "#16a34a", borderRadius: 8, padding: "12px 16px",
        fontSize: 14, marginBottom: 20,
    },
    btnPrimary: {
        width: "100%", padding: "14px", borderRadius: 10,
        background: "linear-gradient(135deg, #16a34a, #15803d)",
        color: "#fff", fontSize: 16, fontWeight: 600,
        border: "none", cursor: "pointer", marginTop: 8,
    },
    link: { color: "#16a34a", fontWeight: 600, cursor: "pointer", fontSize: 13 },
    kayitLink: { textAlign: "center", fontSize: 14, color: "#6b7280", marginTop: 16 },
    aciklama: { fontSize: 14, color: "#6b7280", marginBottom: 20, lineHeight: 1.6 },
};