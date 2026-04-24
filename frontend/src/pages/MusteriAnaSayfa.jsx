import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

const KATEGORI_EMOJILERI = {
    "Sebzeler": "🥦", "Meyveler": "🍎", "Yeşillikler": "🌿",
};

export default function MusteriAnaSayfa({ kullanici, onCikis, onProfil, onSiparis }) {
    const [kategoriler, setKategoriler] = useState([]);
    const [tumUrunler, setTumUrunler] = useState([]);
    const [seciliKategori, setSeciliKategori] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [arama, setArama] = useState("");
    const [sepet, setSepet] = useState(() => {
        try {
            const kayitli = localStorage.getItem(`sepet_${kullanici?.musteri_id}`);
            if (!kayitli) return [];
            const parsed = JSON.parse(kayitli);
            // Eski format kontrolü
            if (Array.isArray(parsed)) return parsed;
            const { urunler, zaman } = parsed;
            const ucSaat = 3 * 60 * 60 * 1000;
            if (Date.now() - zaman > ucSaat) {
                localStorage.removeItem(`sepet_${kullanici?.musteri_id}`);
                return [];
            }
            return urunler || [];
        } catch {
            return [];
        }
    });
    const [sepetAcik, setSepetAcik] = useState(false);

    useEffect(() => {
        kategorileriGetir();
        urunleriGetir();
    }, []);

    useEffect(() => {
        if (kullanici?.musteri_id) {
            const sepetVerisi = {
                urunler: sepet,
                zaman: Date.now(),
            };
            localStorage.setItem(`sepet_${kullanici.musteri_id}`, JSON.stringify(sepetVerisi));
        }
    }, [sepet]);

    const [fiyatUyari, setFiyatUyari] = useState([]);

    const kategorileriGetir = async () => {
        try {
            const res = await fetch(`${API_URL}/api/kategoriler`);
            const data = await res.json();
            setKategoriler(data);
        } catch (e) { console.error(e); }
    };

    const urunleriGetir = async () => {
        setYukleniyor(true);
        try {
            const q = kullanici?.sehir_id ? `?sehir_id=${kullanici.sehir_id}` : "";
            const res = await fetch(`${API_URL}/api/urunler${q}`);
            const data = await res.json();
            setTumUrunler(data);
        } catch (e) { console.error(e); }
        finally { setYukleniyor(false); }
    };

    const sepeteEkle = (urun, miktar) => {
        setSepet(prev => {
            const mevcut = prev.find(s => s.id === urun.id);
            if (mevcut) return prev.map(s => s.id === urun.id ? { ...s, miktar: s.miktar + miktar } : s);
            return [...prev, { ...urun, miktar }];
        });
    };

    const fiyatlariKontrolEt = async () => {
        try {
            const q = kullanici?.sehir_id ? `?sehir_id=${kullanici.sehir_id}` : "";
            const res = await fetch(`${API_URL}/api/urunler${q}`);
            const guncelUrunler = await res.json();
            const uyarilar = [];
            sepet.forEach(s => {
                const guncel = guncelUrunler.find(u => u.id === s.id);
                if (guncel && guncel.satis_fiyati && s.satis_fiyati !== guncel.satis_fiyati) {
                    uyarilar.push({
                        ad: s.ad,
                        eskiFiyat: s.satis_fiyati,
                        yeniFiyat: guncel.satis_fiyati,
                    });
                    setSepet(prev => prev.map(p => p.id === s.id ? { ...p, satis_fiyati: guncel.satis_fiyati } : p));
                }
            });
            setFiyatUyari(uyarilar);
        } catch (e) { console.error(e); }
    };

    const sepetToplam = sepet.reduce((acc, s) => acc + (s.satis_fiyati || 0) * s.miktar, 0);
    const sepetAdet = sepet.length;

    // Arama filtresi
    const aramaFiltreliUrunler = arama
        ? tumUrunler.filter(u => u.ad.toLowerCase().includes(arama.toLowerCase()))
        : null;

    // Seçili kategori filtresi
    const kategoriFiltreli = seciliKategori
        ? tumUrunler.filter(u => u.kategori_id === seciliKategori)
        : null;

    return (
        <div style={styles.page}>
            {/* HEADER */}
            <header style={styles.header}>
                <div style={styles.headerIcerik}>
                    <div style={styles.logoWrap}>
                        <span style={styles.logoEmoji}>🥬</span>
                        <div>
                            <div style={styles.logoText}>Freshalburda</div>
                            <div style={styles.logoAlt}>Taze & Doğal</div>
                        </div>
                    </div>

                    <div style={styles.aramaWrap}>
                        <span style={styles.aramaIcon}>🔍</span>
                        <input
                            style={styles.aramaInput}
                            placeholder="Ürün ara..."
                            value={arama}
                            onChange={e => { setArama(e.target.value); setSeciliKategori(null); }}
                        />
                        {arama && (
                            <button style={styles.aramaTemizle} onClick={() => setArama("")}>✕</button>
                        )}
                    </div>

                    <div style={styles.headerSag}>
                        <div style={{ ...styles.kullaniciWrap, cursor: "pointer" }} onClick={onProfil}>
                            <div style={styles.kullaniciAvatar}>
                                {kullanici?.ad?.[0]}{kullanici?.soyad?.[0]}
                            </div>
                            <div>
                                <div style={styles.kullaniciAd}>{kullanici?.ad} {kullanici?.soyad}</div>
                                <div style={styles.kullaniciRol}>Müşteri</div>
                            </div>
                        </div>
                        <button style={styles.sepetBtn} onClick={() => {
                            setSepetAcik(!sepetAcik);
                            if (!sepetAcik) fiyatlariKontrolEt();
                        }}>
                            🛒
                            {sepetAdet > 0 && <span style={styles.sepetBadge}>{sepetAdet}</span>}
                        </button>
                        <button style={styles.cikisBtn} onClick={onCikis}>Çıkış</button>
                    </div>
                </div>
            </header>

            {/* KATEGORİ BAR */}
            <div style={styles.kategoriBar}>
                <div style={styles.kategoriIcerik}>
                    <button
                        style={{ ...styles.kategoriBtn, ...(seciliKategori === null && !arama ? styles.kategoriAktif : {}) }}
                        onClick={() => { setSeciliKategori(null); setArama(""); }}
                    >
                        🌟 Tümü
                    </button>
                    {kategoriler.map(k => (
                        <button
                            key={k.id}
                            style={{ ...styles.kategoriBtn, ...(seciliKategori === k.id ? styles.kategoriAktif : {}) }}
                            onClick={() => { setSeciliKategori(k.id); setArama(""); }}
                        >
                            {KATEGORI_EMOJILERI[k.ad] || "🛒"} {k.ad}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN İÇERİK */}
            <main style={styles.main}>
                {yukleniyor ? (
                    <div style={styles.yukleniyor}>
                        <div style={{ fontSize: 48 }}>⏳</div>
                        <p>Yükleniyor...</p>
                    </div>
                ) : arama ? (
                    // ARAMA SONUÇLARI
                    <div>
                        <h2 style={styles.bolumBaslik}>
                            🔍 "{arama}" için sonuçlar
                            <span style={styles.urunSayisi}>{aramaFiltreliUrunler.length} ürün</span>
                        </h2>
                        {aramaFiltreliUrunler.length === 0 ? (
                            <div style={styles.bos}>
                                <div style={{ fontSize: 48 }}>😕</div>
                                <p>Ürün bulunamadı</p>
                            </div>
                        ) : (
                            <div style={styles.urunGrid}>
                                {aramaFiltreliUrunler.map(u => (
                                    <UrunKart key={u.id} urun={u} onSepeteEkle={sepeteEkle} />
                                ))}
                            </div>
                        )}
                    </div>
                ) : seciliKategori ? (
                    // SEÇİLİ KATEGORİ
                    <div>
                        <div style={styles.geriSatir}>
                            <button style={styles.geriBtn} onClick={() => setSeciliKategori(null)}>← Geri</button>
                            <h2 style={styles.bolumBaslik}>
                                {KATEGORI_EMOJILERI[kategoriler.find(k => k.id === seciliKategori)?.ad]} {kategoriler.find(k => k.id === seciliKategori)?.ad}
                                <span style={styles.urunSayisi}>{kategoriFiltreli.length} ürün</span>
                            </h2>
                        </div>
                        <div style={styles.urunGrid}>
                            {kategoriFiltreli.map(u => (
                                <UrunKart key={u.id} urun={u} onSepeteEkle={sepeteEkle} />
                            ))}
                        </div>
                    </div>
                ) : (
                    // ANA SAYFA — HER KATEGORİDEN 4 ÜRÜN
                    kategoriler.map(k => {
                        const kategoriUrunleri = tumUrunler.filter(u => u.kategori_id === k.id);
                        if (kategoriUrunleri.length === 0) return null;
                        const onizleme = kategoriUrunleri.slice(0, 5);
                        return (
                            <div key={k.id} style={styles.kategoriBlok}>
                                <div style={styles.kategoriBlokHeader}>
                                    <h2 style={styles.bolumBaslik}>
                                        {KATEGORI_EMOJILERI[k.ad] || "🛒"} {k.ad}
                                    </h2>
                                    {kategoriUrunleri.length > 4 && (
                                        <button
                                            style={styles.tumunuGorBtn}
                                            onClick={() => setSeciliKategori(k.id)}
                                        >
                                            {k.ad} — Tümünü Gör ({kategoriUrunleri.length} ürün) →
                                        </button>
                                    )}
                                </div>
                                <div style={styles.urunGrid}>
                                    {onizleme.map(u => (
                                        <UrunKart key={u.id} urun={u} onSepeteEkle={sepeteEkle} />
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </main>

            {/* SEPET PANELİ */}
            {sepetAcik && (
                <div style={styles.sepetOverlay} onClick={() => setSepetAcik(false)}>
                    <div style={styles.sepetPanel} onClick={e => e.stopPropagation()}>
                        <div style={styles.sepetHeader}>
                            <h3 style={styles.sepetBaslik}>🛒 Sepetim</h3>
                            <button style={styles.sepetKapat} onClick={() => setSepetAcik(false)}>✕</button>
                        </div>
                        {fiyatUyari.length > 0 && (
                            <div style={styles.fiyatUyariWrap}>
                                {fiyatUyari.map((u, i) => (
                                    <div key={i} style={styles.fiyatUyariSatir}>
                                        ⚠️ <strong>{u.ad}</strong> fiyatı güncellendi:
                                        <span style={styles.eskiFiyat}>{u.eskiFiyat?.toFixed(2)} ₺</span>
                                        →
                                        <span style={styles.yeniFiyat}>{u.yeniFiyat?.toFixed(2)} ₺</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {sepet.length === 0 ? (
                            <div style={styles.sepetBos}>
                                <div style={{ fontSize: 48 }}>🛒</div>
                                <p>Sepetiniz boş</p>
                            </div>
                        ) : (
                            <>
                                <div style={styles.sepetListe}>
                                    {sepet.map(s => (
                                        <div key={s.id} style={styles.sepetItem}>
                                            <div style={styles.sepetItemGorsel}>
                                                {s.gorsel_url
                                                    ? <img src={`http://localhost:8000${s.gorsel_url}`} alt={s.ad} style={styles.sepetItemImg} />
                                                    : <div style={styles.sepetItemEmoji}>🥬</div>
                                                }
                                            </div>
                                            <div style={styles.sepetItemBilgi}>
                                                <div style={styles.sepetItemAd}>{s.ad}</div>
                                                <div style={styles.sepetItemFiyat}>
                                                    {(s.satis_fiyati || 0).toFixed(2)} ₺/{s.birim_turu}
                                                </div>
                                                <div style={styles.sepetItemMiktar}>
                                                    <button style={styles.sepetMiktarBtn}
                                                        onClick={() => setSepet(prev =>
                                                            prev.map(p => p.id === s.id ? { ...p, miktar: Math.max(1, p.miktar - 1) } : p)
                                                        )}>−</button>
                                                    <input
                                                        style={styles.sepetMiktarInput}
                                                        type="number" min="1"
                                                        value={s.miktar}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            if (val === "") {
                                                                setSepet(prev => prev.map(p => p.id === s.id ? { ...p, miktar: "" } : p));
                                                            } else {
                                                                const num = parseInt(val);
                                                                if (!isNaN(num) && num >= 1) {
                                                                    setSepet(prev => prev.map(p => p.id === s.id ? { ...p, miktar: num } : p));
                                                                }
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            setSepet(prev => prev.map(p => p.id === s.id ? { ...p, miktar: p.miktar === "" || p.miktar < 1 ? 1 : p.miktar } : p));
                                                        }}
                                                    />
                                                    <button style={styles.sepetMiktarBtn}
                                                        onClick={() => setSepet(prev =>
                                                            prev.map(p => p.id === s.id ? { ...p, miktar: p.miktar + 1 } : p)
                                                        )}>+</button>
                                                </div>
                                            </div>
                                            <div style={styles.sepetItemSag}>
                                                <div style={styles.sepetItemToplam}>
                                                    {((s.satis_fiyati || 0) * s.miktar).toFixed(2)} ₺
                                                </div>
                                                <button style={styles.sepetSilBtn}
                                                    onClick={() => setSepet(prev => prev.filter(p => p.id !== s.id))}>
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={styles.sepetAlt}>
                                    <div style={styles.sepetToplam}>
                                        <span>Toplam:</span>
                                        <span style={styles.sepetToplamFiyat}>{sepetToplam.toFixed(2)} ₺</span>
                                    </div>
                                    <button style={styles.siparisBtn} onClick={() => { setSepetAcik(false); onSiparis(sepet); }}>Sipariş Ver →</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function UrunKart({ urun, onSepeteEkle }) {
    const [miktar, setMiktar] = useState(1);
    const [eklendi, setEklendi] = useState(false);
    const [detayAcik, setDetayAcik] = useState(false);

    const handleEkle = () => {
        onSepeteEkle(urun, miktar);
        setEklendi(true);
        setTimeout(() => setEklendi(false), 1500);
    };

    return (
        <>
            <div style={styles.urunKart}>
                <div style={styles.urunGorsel} onClick={() => setDetayAcik(true)}>
                    {urun.gorsel_url ? (
                        <img src={`http://localhost:8000${urun.gorsel_url}`} alt={urun.ad} style={styles.gorselImg} />
                    ) : (
                        <div style={styles.gorselPlaceholder}>🥬</div>
                    )}
                    {urun.hal_ortalama && (
                        <div style={styles.halBadge}>Hal: {urun.hal_ortalama.toFixed(2)}₺</div>
                    )}
                    {urun.piyasa_min && urun.piyasa_max && (
                        <div style={styles.piyasaBadge}>Piyasa Fiyat Aralığı:
                            {urun.piyasa_min.toFixed(2)}₺ - {urun.piyasa_max.toFixed(2)}₺
                        </div>
                    )}
                    <div style={styles.detayHint}>👆 Detay</div>
                </div>

                <div style={styles.urunBilgi}>
                    <h3 style={styles.urunAd}>{urun.ad}</h3>
                    <p style={styles.urunBirim}>/{urun.birim_turu}</p>

                    {urun.satis_fiyati ? (
                        <div style={styles.satisFiyati}>{urun.satis_fiyati.toFixed(2)} ₺</div>
                    ) : (
                        <div style={styles.fiyatYok}>Fiyat bekleniyor</div>
                    )}

                    <div style={styles.miktarWrap}>
                        <button style={styles.miktarBtn} onClick={() => setMiktar(m => Math.max(1, m - 1))}>−</button>
                        <input
                            style={styles.miktarInput}
                            type="number"
                            min="1"
                            value={miktar}
                            onChange={e => {
                                const val = e.target.value;
                                if (val === "") {
                                    setMiktar("");
                                } else {
                                    const num = parseInt(val);
                                    if (!isNaN(num) && num >= 1) setMiktar(num);
                                }
                            }}
                            onBlur={() => {
                                if (miktar === "" || miktar < 1) setMiktar(1);
                            }}
                        />
                        <button style={styles.miktarBtn} onClick={() => setMiktar(m => m + 1)}>+</button>
                    </div>

                    <button
                        style={{ ...styles.sepeteEkleBtn, ...(eklendi ? styles.sepeteEkleBtnAktif : {}) }}
                        onClick={handleEkle}
                    >
                        {eklendi ? "✓ Eklendi!" : "Sepete Ekle"}
                    </button>
                </div>
            </div>

            {/* DETAY MODAL */}
            {detayAcik && (
                <div style={styles.modalOverlay} onClick={() => setDetayAcik(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <button style={styles.modalKapat} onClick={() => setDetayAcik(false)}>✕</button>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: 480 }}>
                            {/* SOL GÖRSEL */}
                            <div style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", overflow: "hidden" }}>
                                {urun.gorsel_url
                                    ? <img src={`http://localhost:8000${urun.gorsel_url}`} alt={urun.ad} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <div style={{ fontSize: 80 }}>🥬</div>
                                }
                            </div>

                            {/* SAĞ BİLGİ */}
                            <div style={{ padding: 24, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
                                <h2 style={styles.modalAd}>{urun.ad}</h2>
                                {urun.aciklama && <p style={styles.modalAciklama}>{urun.aciklama}</p>}

                                <div style={styles.modalDetaylar}>
                                    {urun.mensei && <DetayRow label="Menşei" deger={urun.mensei} />}
                                    {urun.kalite_sinifi && <DetayRow label="Kalite" deger={urun.kalite_sinifi} />}
                                    <DetayRow label="Birim" deger={urun.birim_turu} />
                                </div>

                                <div style={styles.modalFiyatlar}>
                                    {urun.satis_fiyati && (
                                        <div style={styles.modalFiyatKart}>
                                            <div style={styles.modalFiyatLabel}>Satış Fiyatı</div>
                                            <div style={styles.modalFiyatDeger}>{urun.satis_fiyati.toFixed(2)} ₺</div>
                                        </div>
                                    )}
                                    {urun.hal_ortalama && (
                                        <div style={styles.modalFiyatKart}>
                                            <div style={styles.modalFiyatLabel}>Hal Ortalaması</div>
                                            <div style={{ ...styles.modalFiyatDeger, color: "#f59e0b" }}>{urun.hal_ortalama.toFixed(2)} ₺</div>
                                        </div>
                                    )}
                                    {urun.piyasa_min && urun.piyasa_max && (
                                        <div style={{ ...styles.modalFiyatKart, gridColumn: "span 2" }}>
                                            <div style={styles.modalFiyatLabel}>Piyasa Fiyat Aralığı</div>
                                            <div style={{ ...styles.modalFiyatDeger, color: "#6b7280", fontSize: 16 }}>
                                                {urun.piyasa_min.toFixed(2)} ₺ — {urun.piyasa_max.toFixed(2)} ₺
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={styles.modalMiktarWrap}>
                                    <button style={styles.miktarBtn} onClick={() => setMiktar(m => Math.max(1, m - 1))}>−</button>
                                    <span style={{ fontSize: 18, fontWeight: 700, minWidth: 40, textAlign: "center" }}>{miktar} {urun.birim_turu}</span>
                                    <button style={styles.miktarBtn} onClick={() => setMiktar(m => m + 1)}>+</button>
                                </div>

                                <button
                                    style={{ ...styles.sepeteEkleBtn, ...(eklendi ? styles.sepeteEkleBtnAktif : {}) }}
                                    onClick={() => { handleEkle(); setDetayAcik(false); }}
                                >
                                    {eklendi ? "✓ Eklendi!" : "🛒 Sepete Ekle"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function DetayRow({ label, deger }) {
    return (
        <div style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
            <span style={{ fontSize: 13, color: "#9ca3af", minWidth: 80 }}>{label}:</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{deger}</span>
        </div>
    );
}

const styles = {
    page: { minHeight: "100vh", background: "#fffbf0", fontFamily: "'Segoe UI', sans-serif" },
    header: { background: "#fff", borderBottom: "2px solid #f59e0b", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
    headerIcerik: { maxWidth: 1400, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", gap: 20 },
    logoWrap: { display: "flex", alignItems: "center", gap: 10, minWidth: 160 },
    logoEmoji: { fontSize: 36 },
    logoText: { fontSize: 20, fontWeight: 800, color: "#14532d", lineHeight: 1 },
    logoAlt: { fontSize: 11, color: "#f59e0b", fontWeight: 600, letterSpacing: 1 },
    aramaWrap: { flex: 1, position: "relative", display: "flex", alignItems: "center" },
    aramaIcon: { position: "absolute", left: 14, fontSize: 16 },
    aramaInput: { width: "100%", padding: "10px 40px", borderRadius: 24, border: "2px solid #e5e7eb", fontSize: 14, outline: "none", background: "#f9fafb", boxSizing: "border-box" },
    aramaTemizle: { position: "absolute", right: 14, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#9ca3af" },
    headerSag: { display: "flex", alignItems: "center", gap: 16, minWidth: 220 },
    kullaniciWrap: { display: "flex", alignItems: "center", gap: 8 },
    kullaniciAvatar: { width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #16a34a, #f59e0b)", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" },
    kullaniciAd: { fontSize: 13, fontWeight: 600, color: "#111827" },
    kullaniciRol: { fontSize: 11, color: "#9ca3af" },
    sepetBtn: { position: "relative", width: 42, height: 42, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #16a34a", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
    sepetBadge: { position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" },
    cikisBtn: { padding: "7px 16px", borderRadius: 8, background: "#fee2e2", color: "#dc2626", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" },
    kategoriBar: { background: "#fff", borderBottom: "1px solid #f3f4f6" },
    kategoriIcerik: { maxWidth: 1400, margin: "0 auto", display: "flex", gap: 8, padding: "12px 24px", overflowX: "auto" },
    kategoriBtn: { padding: "8px 20px", borderRadius: 20, whiteSpace: "nowrap", background: "#f9fafb", border: "1.5px solid #e5e7eb", fontSize: 14, fontWeight: 500, cursor: "pointer", color: "#374151" },
    kategoriAktif: { background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", border: "1.5px solid #16a34a" },
    main: { maxWidth: 1400, margin: "0 auto", padding: "24px" },
    kategoriBlok: { marginBottom: 40 },
    kategoriBlokHeader: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20, gap: 12 },
    bolumBaslik: { fontSize: 20, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 10, margin: 0 },
    urunSayisi: { fontSize: 13, fontWeight: 400, color: "#9ca3af", background: "#f3f4f6", padding: "2px 10px", borderRadius: 12 },
    tumunuGorBtn: {
        padding: "12px 40px", borderRadius: 24,
        background: "linear-gradient(135deg, #16a34a, #15803d)",
        color: "#fff", fontSize: 15, fontWeight: 700,
        border: "none", cursor: "pointer",
        boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
    },
    geriSatir: { display: "flex", alignItems: "center", gap: 16, marginBottom: 20 },
    geriBtn: { padding: "8px 16px", borderRadius: 8, background: "#f3f4f6", border: "none", fontSize: 14, cursor: "pointer", fontWeight: 600 },
    urunGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 },
    urunKart: { background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" },
    urunGorsel: { height: 160, background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer" },
    gorselPlaceholder: { fontSize: 56 },
    gorselImg: { width: "100%", height: "100%", objectFit: "cover" },
    halBadge: { position: "absolute", top: 8, right: 8, background: "#f59e0b", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 8 },
    piyasaBadge: {
        position: "absolute", bottom: 8, right: 8,
        background: "#ea580c", color: "#fff",
        fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 8,
    },
    detayHint: { position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 11, padding: "3px 10px", borderRadius: 10, opacity: 0 },
    urunBilgi: { padding: "14px" },
    urunAd: { fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 2px" },
    urunBirim: { fontSize: 12, color: "#9ca3af", margin: "0 0 10px" },
    satisFiyati: { fontSize: 22, fontWeight: 800, color: "#16a34a", marginBottom: 12 },
    fiyatYok: { fontSize: 13, color: "#d1d5db", marginBottom: 12 },
    miktarWrap: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
    miktarBtn: { width: 30, height: 30, borderRadius: 8, background: "#f3f4f6", border: "none", fontSize: 18, cursor: "pointer", fontWeight: 700, color: "#374151" },
    miktarDeger: { fontSize: 15, fontWeight: 700, minWidth: 24, textAlign: "center" },
    miktarInput: {
        width: 52, height: 30, borderRadius: 8,
        border: "1.5px solid #e5e7eb",
        textAlign: "center", fontSize: 15,
        fontWeight: 700, outline: "none",
        background: "#f9fafb",
    },
    sepeteEkleBtn: { width: "100%", padding: "10px", borderRadius: 10, background: "linear-gradient(135deg, #f59e0b, #ea580c)", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" },
    sepeteEkleBtnAktif: { background: "linear-gradient(135deg, #16a34a, #15803d)" },
    sepetOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", justifyContent: "flex-end" },
    sepetPanel: { width: 380, background: "#fff", height: "100%", display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)" },
    sepetHeader: { padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" },
    sepetBaslik: { fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 },
    sepetKapat: { width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6", border: "none", fontSize: 14, cursor: "pointer", fontWeight: 700 },
    sepetBos: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af" },
    sepetListe: { flex: 1, overflowY: "auto", padding: "16px 24px" },
    sepetItemAlt: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
    sepetAlt: { padding: "20px 24px", borderTop: "2px solid #f3f4f6" },
    sepetToplam: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, fontSize: 16, fontWeight: 600, color: "#111827" },
    sepetToplamFiyat: { fontSize: 22, fontWeight: 800, color: "#16a34a" },
    siparisBtn: { width: "100%", padding: "14px", borderRadius: 12, background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer" },
    yukleniyor: { textAlign: "center", padding: 60, color: "#9ca3af" },
    bos: { textAlign: "center", padding: 60, color: "#9ca3af" },
    modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
    modal: { background: "#fff", borderRadius: 20, maxWidth: 760, width: "100%", overflow: "hidden", position: "relative", maxHeight: "90vh" },
    modalKapat: { position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.1)", border: "none", fontSize: 14, cursor: "pointer", fontWeight: 700, zIndex: 1 },
    modalGorsel: { background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", minHeight: 400 },
    modalAd: { fontSize: 22, fontWeight: 800, color: "#111827", margin: "0 0 8px" },
    modalAciklama: { fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "0 0 16px" },
    modalDetaylar: { marginBottom: 16 },
    modalFiyatlar: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 },
    modalFiyatKart: { background: "#f9fafb", borderRadius: 10, padding: 12, textAlign: "center" },
    modalFiyatLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 4 },
    modalFiyatDeger: { fontSize: 20, fontWeight: 800, color: "#16a34a" },
    modalMiktarWrap: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16, justifyContent: "center" },
    sepetItem: { display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid #f3f4f6", alignItems: "center" },
    sepetItemGorsel: { width: 52, height: 52, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
    sepetItemImg: { width: "100%", height: "100%", objectFit: "cover" },
    sepetItemEmoji: { fontSize: 28 },
    sepetItemBilgi: { flex: 1 },
    sepetItemAd: { fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 2 },
    sepetItemFiyat: { fontSize: 12, color: "#9ca3af", marginBottom: 6 },
    sepetItemMiktar: { display: "flex", alignItems: "center", gap: 6 },
    sepetMiktarBtn: { width: 24, height: 24, borderRadius: 6, background: "#f3f4f6", border: "none", fontSize: 14, cursor: "pointer", fontWeight: 700 },
    sepetMiktarInput: { width: 42, height: 24, borderRadius: 6, border: "1.5px solid #e5e7eb", textAlign: "center", fontSize: 13, fontWeight: 700, outline: "none" },
    sepetItemSag: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 },
    sepetItemToplam: { fontSize: 15, fontWeight: 700, color: "#16a34a" },
    sepetSilBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 16 },
    fiyatUyariWrap: { background: "#fef9c3", border: "1px solid #fde68a", margin: "0 16px 12px", borderRadius: 8, padding: "10px 12px" },
    fiyatUyariSatir: { fontSize: 12, color: "#854d0e", marginBottom: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
    eskiFiyat: { textDecoration: "line-through", color: "#9ca3af" },
    yeniFiyat: { fontWeight: 700, color: "#16a34a" },
};