import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export default function SiparisEkrani({ kullanici, sepet, onGeri, onSiparisVerildi }) {
    const [adimlar, setAdimlar] = useState(1); // 1: Adres, 2: Slot, 3: Ödeme
    const [adresler, setAdresler] = useState([]);
    const [slotlar, setSlotlar] = useState([]);
    const [kalanSure, setKalanSure] = useState({});
    const [seciliAdres, setSeciliAdres] = useState(null);
    const [seciliSlot, setSeciliSlot] = useState(null);
    const [odemeYontemi, setOdemeYontemi] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [siparisnotu, setSiparisNotu] = useState("");
    const [eksikUrunTercihi, setEksikUrunTercihi] = useState("bekle");
    const [siparisBasarili, setSiparisBasarili] = useState(false);
    const [siparisNo, setSiparisNo] = useState(null);
    const [siparisYukleniyor, setSiparisYukleniyor] = useState(false);
    const [cariYok, setCariYok] = useState(false);
    const [cariTalepGonderildi, setCariTalepGonderildi] = useState(false);

    const expressUcret = seciliSlot?.express ? seciliSlot.express_ucret : 0;
    const sepetToplam = sepet.reduce((acc, s) => acc + (s.satis_fiyati || 0) * s.miktar, 0);
    const genelToplam = sepetToplam + expressUcret;

    useEffect(() => {
        verileriGetir();
    }, []);

    const verileriGetir = async () => {
        setYukleniyor(true);
        try {
            const [adresRes, slotRes] = await Promise.all([
                fetch(`${API_URL}/api/profil/${kullanici.kullanici_id}`),
                fetch(`${API_URL}/api/slotlar`),
            ]);
            const profilData = await adresRes.json();
            const slotData = await slotRes.json();
            setAdresler(profilData.adresler || []);
            setSlotlar(slotData);

            // Varsayılan adresi seç
            const varsayilan = profilData.adresler?.find(a => a.varsayilan_mi);
            if (varsayilan) setSeciliAdres(varsayilan);
        } catch (e) { console.error(e); }
        finally { setYukleniyor(false); }
    };

    useEffect(() => {
        const timer = setInterval(() => {
            const simdi = new Date();
            const simdi_dk = simdi.getHours() * 60 + simdi.getMinutes();
            const simdi_sn = simdi.getSeconds();

            const yeniKalan = {};
            slotlar.forEach(slot => {
                if (slot.express) {
                    const bitis_h = parseInt(slot.bitis.split(":")[0]);
                    const bitis_m = parseInt(slot.bitis.split(":")[1]);
                    const bitis_dk = bitis_h * 60 + bitis_m;
                    const express_bitis_dk = bitis_dk - 90; // 1:30 saat önce kapanır

                    const kalan_toplam_sn = (express_bitis_dk - simdi_dk) * 60 - simdi_sn;
                    if (kalan_toplam_sn > 0) {
                        const dk = Math.floor(kalan_toplam_sn / 60);
                        const sn = kalan_toplam_sn % 60;
                        yeniKalan[slot.id] = { dk, sn };
                    } else {
                        yeniKalan[slot.id] = null;
                    }
                }
            });
            setKalanSure(yeniKalan);
        }, 1000);

        return () => clearInterval(timer);
    }, [slotlar]);

    const siparisOlustur = async () => {
        if (odemeYontemi === "cari") {
            const profilRes = await fetch(`${API_URL}/api/profil/${kullanici.kullanici_id}`);
            const profilData = await profilRes.json();
            if (!profilData.musteri?.cari_acik_mi) {
                setCariYok(true);
                return;
            }
        }

        setSiparisYukleniyor(true);
        try {
            const res = await fetch(`${API_URL}/api/siparisler`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    musteri_id: kullanici.musteri_id,
                    adres_id: seciliAdres.adres_id,
                    slot_id: seciliSlot.id,
                    slot_label: seciliSlot.label,
                    odeme_yontemi: odemeYontemi,
                    express_mi: seciliSlot.express || false,
                    express_ucret: seciliSlot.express ? seciliSlot.express_ucret : 0,
                    siparis_notu: siparisnotu,
                    eksik_urun_tercihi: eksikUrunTercihi,
                    urunler: sepet.map(s => ({
                        urun_id: s.id,
                        ad: s.ad,
                        miktar: s.miktar,
                        birim_turu: s.birim_turu,
                        satis_fiyati: s.satis_fiyati,
                        toplam: (s.satis_fiyati || 0) * s.miktar,
                    })),
                    ara_toplam: sepetToplam,
                    genel_toplam: genelToplam,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail);
            setSiparisNo(data.siparis_no);
            setSiparisBasarili(true);
        } catch (e) {
            console.error(e);
        } finally {
            setSiparisYukleniyor(false);
        }
    };
    const cariTalepGonder = async () => {
        try {
            const res = await fetch(`${API_URL}/api/cari/talep`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ musteri_id: kullanici.musteri_id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail);
            setCariTalepGonderildi(true);
        } catch (e) {
            setCariTalepGonderildi(true);
        }
    };

    if (yukleniyor) return <div style={styles.yukleniyor}>Yükleniyor...</div>;

    // SİPARİŞ BAŞARILI
    if (siparisBasarili) {
        return (
            <div style={styles.page}>
                <div style={styles.basariSayfa}>
                    <div style={styles.basariKart}>
                        <div style={styles.basariEmoji}>🎉</div>
                        <h2 style={styles.basariBaslik}>Siparişiniz Alındı!</h2>
                        <p style={styles.basariAciklama}>
                            Siparişiniz başarıyla oluşturuldu. En kısa sürede hazırlanacak.
                        </p>
                        <div style={styles.siparisNoKutu}>
                            <div style={styles.siparisNoLabel}>Sipariş Numaranız</div>
                            <div style={styles.siparisNoValue}>{siparisNo}</div>
                        </div>
                        <div style={styles.basariBilgiler}>
                            <div style={styles.basariBilgiSatir}>
                                <span>📍</span>
                                <span>{seciliAdres?.il} / {seciliAdres?.ilce}</span>
                            </div>
                            <div style={styles.basariBilgiSatir}>
                                <span>🕐</span>
                                <span>{seciliSlot?.label}</span>
                            </div>
                            <div style={styles.basariBilgiSatir}>
                                <span>💳</span>
                                <span>{odemeYontemi === "nakit" ? "Kapıda Nakit" : "Cari Hesap"}</span>
                            </div>
                            <div style={styles.basariBilgiSatir}>
                                <span>💰</span>
                                <span style={{ fontWeight: 700, color: "#16a34a" }}>{genelToplam.toFixed(2)} ₺</span>
                            </div>
                        </div>
                        <button style={styles.anaSayfaBtn} onClick={onSiparisVerildi}>
                            Ana Sayfaya Dön
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // CARİ YOK
    if (cariYok) {
        return (
            <div style={styles.page}>
                <div style={styles.basariSayfa}>
                    <div style={styles.basariKart}>
                        <div style={styles.basariEmoji}>📒</div>
                        <h2 style={styles.basariBaslik}>Cari Hesabınız Yok</h2>
                        <p style={styles.basariAciklama}>
                            Cari hesap ile ödeme yapabilmek için önce cari hesap açılması gerekiyor.
                            Talebinizi iletebilirsiniz, ekibimiz en kısa sürede size ulaşacak.
                        </p>
                        {cariTalepGonderildi ? (
                            <div style={styles.talepBasari}>
                                ✅ Talebiniz alındı! Ekibimiz sizinle iletişime geçecek.
                            </div>
                        ) : (
                            <button style={styles.talepBtn} onClick={cariTalepGonder}>
                                📩 Cari Hesap Talebi Gönder
                            </button>
                        )}
                        <button style={{ ...styles.anaSayfaBtn, marginTop: 12, background: "#f3f4f6", color: "#374151" }} onClick={() => setCariYok(false)}>
                            ← Geri Dön
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* HEADER */}
            <div style={styles.header}>
                <button style={styles.geriBtn} onClick={onGeri}>← Sepete Dön</button>
                <h1 style={styles.baslik}>Sipariş Ver</h1>
                <div />
            </div>

            <div style={styles.icerik}>
                {/* SOL - ADIMLAR */}
                <div style={styles.sol}>
                    {/* ADIM GÖSTERGESİ */}
                    <div style={styles.adimGostergesi}>
                        {["Adres", "Teslimat", "Ödeme"].map((ad, i) => (
                            <div key={i} style={styles.adimWrap}>
                                <div style={{ ...styles.adimNumara, background: adimlar > i + 1 ? "#16a34a" : adimlar === i + 1 ? "#f59e0b" : "#e5e7eb", color: adimlar >= i + 1 ? "#fff" : "#9ca3af" }}>
                                    {adimlar > i + 1 ? "✓" : i + 1}
                                </div>
                                <span style={{ ...styles.adimLabel, color: adimlar === i + 1 ? "#111827" : "#9ca3af" }}>{ad}</span>
                            </div>
                        ))}
                    </div>

                    {/* ADIM 1 - ADRES */}
                    {adimlar === 1 && (
                        <div style={styles.adimIcerik}>
                            <h2 style={styles.adimBaslik}>📍 Teslimat Adresi Seçin</h2>
                            {adresler.length === 0 ? (
                                <div style={styles.bos}>Kayıtlı adres bulunamadı. Profilden adres ekleyin.</div>
                            ) : (
                                adresler.map(a => (
                                    <div
                                        key={a.adres_id}
                                        style={{ ...styles.adresKart, ...(seciliAdres?.adres_id === a.adres_id ? styles.adresKartSecili : {}) }}
                                        onClick={() => setSeciliAdres(a)}
                                    >
                                        <div style={styles.adresRadio}>
                                            <div style={{ ...styles.radioCircle, ...(seciliAdres?.adres_id === a.adres_id ? styles.radioCircleSecili : {}) }} />
                                        </div>
                                        <div style={styles.adresBilgi}>
                                            <div style={styles.adresSehir}>{a.il} / {a.ilce}</div>
                                            <div style={styles.adresDetay}>{a.acik_adres}</div>
                                            {a.teslimat_notu && <div style={styles.adresNot}>📝 {a.teslimat_notu}</div>}
                                            {a.varsayilan_mi && <span style={styles.varsayilanBadge}>⭐ Varsayılan</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                            <button
                                style={{ ...styles.devamBtn, opacity: seciliAdres ? 1 : 0.5 }}
                                disabled={!seciliAdres}
                                onClick={() => setAdimlar(2)}
                            >
                                Devam Et →
                            </button>
                        </div>
                    )}

                    {/* ADIM 2 - SLOT */}
                    {adimlar === 2 && (
                        <div style={styles.adimIcerik}>
                            <h2 style={styles.adimBaslik}>🕐 Teslimat Saati Seçin</h2>
                            <p style={styles.adimAciklama}>Bugün için uygun teslimat saatlerini seçin.</p>
                            <div style={styles.slotGrid}>
                                {slotlar.map(slot => (
                                    <div
                                        key={slot.id}
                                        style={{
                                            ...styles.slotKart,
                                            ...(seciliSlot?.id === slot.id ? styles.slotKartSecili : {}),
                                            ...((!slot.musait && !slot.express) || slot.gecmis ? styles.slotKartPasif : {}),
                                            cursor: (slot.musait || slot.express) && !slot.gecmis ? "pointer" : "not-allowed",
                                        }}
                                        onClick={() => (slot.musait || slot.express) && !slot.gecmis && setSeciliSlot(slot)}
                                    >
                                        <div style={styles.slotSaat}>{slot.label}</div>
                                        {slot.express && !slot.gecmis && (
                                            <div>
                                                <div style={styles.expressBadge}>⚡ Express +{slot.express_ucret} ₺</div>
                                                {kalanSure[slot.id] && (
                                                    <div style={styles.timerBadge}>
                                                        ⏱ {kalanSure[slot.id].dk}dk {kalanSure[slot.id].sn}sn kaldı
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div style={{ ...styles.slotDurum, color: slot.gecmis ? "#dc2626" : slot.express ? "#f59e0b" : slot.musait ? "#16a34a" : "#9ca3af" }}>
                                            {slot.etiket || (slot.gecmis ? "Geçti" : slot.express ? "Express" : slot.musait ? "Müsait" : "Yakında")}                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={styles.notWrap}>
                                <label style={styles.notLabel}>Sipariş Notu (isteğe bağlı)</label>
                                <textarea
                                    style={styles.notArea}
                                    placeholder="Özel isteklerinizi yazabilirsiniz..."
                                    value={siparisnotu}
                                    onChange={e => setSiparisNotu(e.target.value)}
                                />
                            </div>

                            {seciliSlot?.express && kalanSure[seciliSlot.id] && (
                                <div style={styles.timerKutu}>
                                    ⚡ Express teslimat için <strong>{kalanSure[seciliSlot.id].dk} dakika {kalanSure[seciliSlot.id].sn} saniye</strong> kaldı!
                                </div>
                            )}

                            <div style={styles.eksikWrap}>
                                <label style={styles.notLabel}>Eksik ürün durumunda:</label>
                                <div style={styles.eksikSecenekler}>
                                    {[
                                        { key: "bekle", label: "⏳ Bekleyin, arayın" },
                                        { key: "muadil", label: "🔄 Muadil gönderin" },
                                        { key: "eksik", label: "📦 Eksik gönderin" },
                                    ].map(e => (
                                        <div
                                            key={e.key}
                                            style={{ ...styles.eksikSecenek, ...(eksikUrunTercihi === e.key ? styles.eksikSecenekSecili : {}) }}
                                            onClick={() => setEksikUrunTercihi(e.key)}
                                        >
                                            {e.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={styles.btnler}>
                                <button style={styles.geriAdimBtn} onClick={() => setAdimlar(1)}>← Geri</button>
                                <button
                                    style={{ ...styles.devamBtn, opacity: seciliSlot ? 1 : 0.5 }}
                                    disabled={!seciliSlot}
                                    onClick={() => setAdimlar(3)}
                                >
                                    Devam Et →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ADIM 3 - ÖDEME */}
                    {adimlar === 3 && (
                        <div style={styles.adimIcerik}>
                            <h2 style={styles.adimBaslik}>💳 Ödeme Yöntemi</h2>
                            <div style={styles.odemeSecenekler}>
                                {[
                                    { key: "kart", emoji: "💳", label: "Online Kredi Kartı", aciklama: "Yakında • İyzico entegrasyonu", disabled: true },
                                    { key: "nakit", emoji: "💵", label: "Kapıda Nakit", aciklama: "Teslimatta öde" },
                                    { key: "cari", emoji: "📒", label: "Cari Hesap", aciklama: "Ay sonunda öde" },
                                ].map(o => (
                                    <div
                                        key={o.key}
                                        style={{ ...styles.odemeKart, ...(odemeYontemi === o.key ? styles.odemeKartSecili : {}), ...(o.disabled ? styles.odemeKartPasif : {}) }}
                                        onClick={() => !o.disabled && setOdemeYontemi(o.key)}
                                    >
                                        <div style={styles.odemeEmoji}>{o.emoji}</div>
                                        <div>
                                            <div style={styles.odemeLabel}>{o.label}</div>
                                            <div style={styles.odemeAciklama}>{o.aciklama}</div>
                                        </div>
                                        {!o.disabled && <div style={{ ...styles.radioCircle, marginLeft: "auto", ...(odemeYontemi === o.key ? styles.radioCircleSecili : {}) }} />}
                                        {o.disabled && <span style={styles.yakindaBadge}>Yakında</span>}
                                    </div>
                                ))}
                            </div>

                            <div style={styles.btnler}>
                                <button style={styles.geriAdimBtn} onClick={() => setAdimlar(2)}>← Geri</button>
                                <button
                                    style={{ ...styles.siparisBtn, opacity: odemeYontemi ? 1 : 0.5 }}
                                    disabled={!odemeYontemi || siparisYukleniyor}
                                    onClick={siparisOlustur}
                                >
                                    {siparisYukleniyor ? "İşleniyor..." : "🛒 Siparişi Tamamla"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* SAĞ - SİPARİŞ ÖZETİ */}
                <div style={styles.sag}>
                    <div style={styles.ozet}>
                        <h3 style={styles.ozetBaslik}>📋 Sipariş Özeti</h3>
                        <div style={styles.ozetListe}>
                            {sepet.map(s => (
                                <div key={s.id} style={styles.ozetItem}>
                                    <div style={styles.ozetGorsel}>
                                        {s.gorsel_url
                                            ? <img src={`http://localhost:8000${s.gorsel_url}`} alt={s.ad} style={styles.ozetGorselImg} />
                                            : <div style={styles.ozetEmoji}>🥬</div>
                                        }
                                    </div>
                                    <div style={styles.ozetBilgi}>
                                        <div style={styles.ozetAd}>{s.ad}</div>
                                        <div style={styles.ozetMiktar}>{s.miktar} {s.birim_turu}</div>
                                    </div>
                                    <div style={styles.ozetFiyat}>{((s.satis_fiyati || 0) * s.miktar).toFixed(2)} ₺</div>
                                </div>
                            ))}
                        </div>
                        <div style={styles.ozetAlt}>
                            {expressUcret > 0 && (
                                <div style={{ ...styles.ozetBilgiSatir, marginBottom: 8 }}>
                                    <span>⚡ Express Teslimat</span>
                                    <span style={{ fontWeight: 700, color: "#f59e0b" }}>+{expressUcret.toFixed(2)} ₺</span>
                                </div>
                            )}
                            <div style={styles.ozetToplam}>
                                <span>Toplam</span>
                                <span style={styles.ozetToplamFiyat}>{genelToplam.toFixed(2)} ₺</span>
                            </div>
                            {seciliAdres && (
                                <div style={styles.ozetBilgiSatir}>
                                    <span>📍</span>
                                    <span>{seciliAdres.il} / {seciliAdres.ilce}</span>
                                </div>
                            )}
                            {seciliSlot && (
                                <div style={styles.ozetBilgiSatir}>
                                    <span>🕐</span>
                                    <span>{seciliSlot.label}</span>
                                </div>
                            )}
                            {odemeYontemi && (
                                <div style={styles.ozetBilgiSatir}>
                                    <span>💳</span>
                                    <span>{odemeYontemi === "kart" ? "Online Kart" : odemeYontemi === "nakit" ? "Kapıda Nakit" : "Cari Hesap"}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "#f9fafb", fontFamily: "'Segoe UI', sans-serif" },
    header: { background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    geriBtn: { padding: "8px 16px", borderRadius: 8, background: "#f3f4f6", border: "none", fontSize: 14, cursor: "pointer", fontWeight: 600 },
    baslik: { fontSize: 20, fontWeight: 700, color: "#14532d", margin: 0 },
    icerik: { maxWidth: 1100, margin: "24px auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 },
    sol: {},
    adimGostergesi: { display: "flex", alignItems: "center", gap: 8, marginBottom: 24, background: "#fff", padding: 16, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
    adimWrap: { display: "flex", alignItems: "center", gap: 8, flex: 1 },
    adimNumara: { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 },
    adimLabel: { fontSize: 14, fontWeight: 600 },
    adimIcerik: { background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
    adimBaslik: { fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 16 },
    adimAciklama: { fontSize: 13, color: "#6b7280", marginBottom: 16 },
    adresKart: { display: "flex", gap: 12, padding: 16, borderRadius: 12, border: "2px solid #e5e7eb", marginBottom: 12, cursor: "pointer" },
    adresKartSecili: { border: "2px solid #16a34a", background: "#f0fdf4" },
    adresRadio: { paddingTop: 2 },
    radioCircle: { width: 18, height: 18, borderRadius: "50%", border: "2px solid #d1d5db" },
    radioCircleSecili: { border: "5px solid #16a34a" },
    adresBilgi: {},
    adresSehir: { fontSize: 15, fontWeight: 700, color: "#111827" },
    adresDetay: { fontSize: 13, color: "#6b7280", marginTop: 2 },
    adresNot: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
    varsayilanBadge: { fontSize: 11, background: "#fef9c3", color: "#854d0e", padding: "2px 8px", borderRadius: 8, fontWeight: 600, display: "inline-block", marginTop: 4 },
    slotGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 },
    slotKart: { padding: 16, borderRadius: 12, border: "2px solid #e5e7eb", textAlign: "center", cursor: "pointer" },
    slotKartSecili: { border: "2px solid #16a34a", background: "#f0fdf4" },
    slotKartPasif: { background: "#f9fafb", opacity: 0.6 },
    slotSaat: { fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 },
    slotDurum: { fontSize: 12, fontWeight: 600 },
    notWrap: { marginBottom: 16 },
    notLabel: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 },
    notArea: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", resize: "vertical", minHeight: 80, boxSizing: "border-box" },
    eksikWrap: { marginBottom: 20 },
    eksikSecenekler: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 },
    eksikSecenek: { padding: "8px 16px", borderRadius: 20, border: "1.5px solid #e5e7eb", fontSize: 13, cursor: "pointer", background: "#f9fafb" },
    eksikSecenekSecili: { border: "1.5px solid #16a34a", background: "#f0fdf4", color: "#16a34a", fontWeight: 600 },
    odemeSecenekler: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 },
    odemeKart: { display: "flex", alignItems: "center", gap: 16, padding: 16, borderRadius: 12, border: "2px solid #e5e7eb", cursor: "pointer" },
    odemeKartSecili: { border: "2px solid #16a34a", background: "#f0fdf4" },
    odemeEmoji: { fontSize: 28 },
    odemeLabel: { fontSize: 15, fontWeight: 700, color: "#111827" },
    odemeAciklama: { fontSize: 12, color: "#9ca3af" },
    btnler: { display: "flex", gap: 12 },
    geriAdimBtn: { padding: "12px 20px", borderRadius: 10, background: "#f3f4f6", border: "none", fontSize: 14, cursor: "pointer", fontWeight: 600 },
    devamBtn: { flex: 1, padding: "12px", borderRadius: 10, background: "linear-gradient(135deg, #f59e0b, #ea580c)", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" },
    siparisBtn: { flex: 1, padding: "12px", borderRadius: 10, background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" },
    ozet: { background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", position: "sticky", top: 24 },
    ozetBaslik: { fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16 },
    ozetListe: { marginBottom: 16 },
    ozetItem: { display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" },
    ozetGorsel: { width: 44, height: 44, borderRadius: 8, overflow: "hidden", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    ozetGorselImg: { width: "100%", height: "100%", objectFit: "cover" },
    ozetEmoji: { fontSize: 24 },
    ozetBilgi: { flex: 1 },
    ozetAd: { fontSize: 13, fontWeight: 600, color: "#111827" },
    ozetMiktar: { fontSize: 12, color: "#9ca3af" },
    ozetFiyat: { fontSize: 14, fontWeight: 700, color: "#16a34a" },
    ozetAlt: { paddingTop: 16 },
    ozetToplam: { display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, marginBottom: 12 },
    ozetToplamFiyat: { color: "#16a34a", fontSize: 20 },
    ozetBilgiSatir: { display: "flex", gap: 8, fontSize: 13, color: "#6b7280", marginTop: 6 },
    bos: { textAlign: "center", padding: 40, color: "#9ca3af" },
    yukleniyor: { textAlign: "center", padding: 60, color: "#9ca3af" },
    odemeKartPasif: { opacity: 0.6, cursor: "not-allowed" },
    yakindaBadge: { marginLeft: "auto", background: "#fef9c3", color: "#854d0e", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12 },
    basariSayfa: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" },
    basariKart: { background: "#fff", borderRadius: 20, padding: 40, maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
    basariEmoji: { fontSize: 64, marginBottom: 16 },
    basariBaslik: { fontSize: 24, fontWeight: 800, color: "#111827", margin: "0 0 8px" },
    basariAciklama: { fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "0 0 24px" },
    siparisNoKutu: { background: "#f0fdf4", border: "2px solid #bbf7d0", borderRadius: 12, padding: 16, marginBottom: 20 },
    siparisNoLabel: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
    siparisNoValue: { fontSize: 28, fontWeight: 800, color: "#16a34a", letterSpacing: 2 },
    basariBilgiler: { textAlign: "left", marginBottom: 24, background: "#f9fafb", borderRadius: 12, padding: 16 },
    basariBilgiSatir: { display: "flex", gap: 10, fontSize: 14, color: "#374151", padding: "6px 0", borderBottom: "1px solid #f3f4f6" },
    anaSayfaBtn: { width: "100%", padding: "14px", borderRadius: 12, background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer" },
    talepBtn: { width: "100%", padding: "14px", borderRadius: 12, background: "linear-gradient(135deg, #f59e0b, #ea580c)", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", marginBottom: 12 },
    talepBasari: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", borderRadius: 10, padding: 16, fontSize: 14, fontWeight: 600, marginBottom: 16 },
    expressBadge: { background: "#fef9c3", color: "#854d0e", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 8, marginBottom: 4, display: "inline-block" },
    timerBadge: { background: "#fef2f2", color: "#dc2626", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 8, marginTop: 4, display: "inline-block" },
    timerKutu: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#dc2626", fontWeight: 600, marginBottom: 16, textAlign: "center" },
};
