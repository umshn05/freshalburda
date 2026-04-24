import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export default function AdminCari({ seciliSehir }) {
  const [musteriler, setMusteriler] = useState([]);
  const [talepler, setTalepler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [bildirim, setBildirim] = useState(null);
  const [arama, setArama] = useState("");
  const [aktifSekme, setAktifSekme] = useState("musteriler");

  // Cari ayar modal
  const [ayarModal, setAyarModal] = useState(null);
  const [ayarForm, setAyarForm] = useState({ cari_acik_mi: false, cari_limit: 0 });

  // Ödeme modal
  const [odemeModal, setOdemeModal] = useState(null);
  const [odemeForm, setOdemeForm] = useState({ tutar: "", aciklama: "" });

  // İşlem geçmişi modal
  const [gecmisModal, setGecmisModal] = useState(null);
  const [islemler, setIslemler] = useState(null);
  const [acikSiparis, setAcikSiparis] = useState(null);
  const [siparisDetay, setSiparisDetay] = useState({});

  useEffect(() => {
    verileriGetir();
  }, [seciliSehir]);

  const verileriGetir = async () => {
    setYukleniyor(true);
    try {
      const q = seciliSehir ? `?sehir_id=${seciliSehir}` : "";
      const [mRes, tRes] = await Promise.all([
        fetch(`${API_URL}/api/auth/admin/musteriler${q}`),
        fetch(`${API_URL}/api/admin/cari/talepler${q}`),
      ]);
      setMusteriler(await mRes.json());
      setTalepler(await tRes.json());
    } catch (e) { console.error(e); }
    finally { setYukleniyor(false); }
  };

  const bildirimGoster = (mesaj, tip = "basari") => {
    setBildirim({ mesaj, tip });
    setTimeout(() => setBildirim(null), 3000);
  };

  const cariAyarKaydet = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/cari/${ayarModal.musteri_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ayarForm),
      });
      if (!res.ok) throw new Error();
      bildirimGoster(`"${ayarModal.isletme_adi}" cari ayarları güncellendi`);
      setAyarModal(null);
      verileriGetir();
    } catch { bildirimGoster("Hata oluştu", "hata"); }
  };

  const odemeKaydet = async () => {
    const tutar = parseFloat(odemeForm.tutar);
    if (!tutar || tutar <= 0) return bildirimGoster("Geçerli bir tutar girin", "hata");
    try {
      const res = await fetch(`${API_URL}/api/admin/cari/${odemeModal.musteri_id}/odeme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutar, aciklama: odemeForm.aciklama }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      bildirimGoster(`Ödeme kaydedildi. Yeni bakiye: ${data.yeni_bakiye.toFixed(2)} ₺`);
      setOdemeModal(null);
      setOdemeForm({ tutar: "", aciklama: "" });
      verileriGetir();
    } catch (e) { bildirimGoster(e.message || "Hata oluştu", "hata"); }
  };

  const gecmisGoster = async (musteri) => {
    setGecmisModal(musteri);
    setIslemler(null);
    setAcikSiparis(null);
    setSiparisDetay({});
    try {
      const res = await fetch(`${API_URL}/api/cari/${musteri.musteri_id}/islemler`);
      setIslemler(await res.json());
    } catch (e) { console.error(e); }
  };

  const siparisDetayGetir = async (siparisNo) => {
    if (acikSiparis === siparisNo) { setAcikSiparis(null); return; }
    setAcikSiparis(siparisNo);
    if (siparisDetay[siparisNo]) return;
    try {
      const res = await fetch(`${API_URL}/api/siparisler/no/${siparisNo}`);
      const data = await res.json();
      setSiparisDetay(prev => ({ ...prev, [siparisNo]: data }));
    } catch (e) { console.error(e); }
  };

  const onaylaMusteriyiCari = async (musteri) => {
    setAyarModal(musteri);
    setAyarForm({
      cari_acik_mi: musteri.cari_acik_mi || false,
      cari_limit: musteri.cari_limit || 0,
    });
  };

  const filtreliMusteriler = musteriler
    .filter(m => m.onay_durumu === "onaylandi")
    .filter(m =>
      m.isletme_adi.toLowerCase().includes(arama.toLowerCase()) ||
      m.ad.toLowerCase().includes(arama.toLowerCase())
    );

  return (
    <div>
      {bildirim && (
        <div style={{ ...s.bildirim, background: bildirim.tip === "basari" ? "#f0fdf4" : "#fef2f2", color: bildirim.tip === "basari" ? "#16a34a" : "#dc2626", border: `1px solid ${bildirim.tip === "basari" ? "#bbf7d0" : "#fecaca"}` }}>
          {bildirim.mesaj}
        </div>
      )}

      {/* SEKMELER */}
      <div style={s.sekmeler}>
        <button style={{ ...s.sekmeBtn, ...(aktifSekme === "musteriler" ? s.sekmeBtnAktif : {}) }} onClick={() => setAktifSekme("musteriler")}>
          💳 Cari Hesaplar
        </button>
        <button style={{ ...s.sekmeBtn, ...(aktifSekme === "talepler" ? s.sekmeBtnAktif : {}) }} onClick={() => setAktifSekme("talepler")}>
          📋 Bekleyen Talepler {talepler.length > 0 && <span style={s.taleplBadge}>{talepler.length}</span>}
        </button>
      </div>

      {/* MÜŞTERİ CARİ LİSTESİ */}
      {aktifSekme === "musteriler" && (
        <>
          <div style={s.aramaRow}>
            <input
              style={s.aramaInput}
              placeholder="🔍 İşletme adı veya yetkili..."
              value={arama}
              onChange={e => setArama(e.target.value)}
            />
          </div>

          {yukleniyor ? (
            <div style={s.yukleniyor}>Yükleniyor...</div>
          ) : (
            <div style={s.tablo}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>İşletme</th>
                    <th style={s.th}>Cari Durumu</th>
                    <th style={s.th}>Limit</th>
                    <th style={s.th}>Bakiye</th>
                    <th style={s.th}>Kalan</th>
                    <th style={s.th}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filtreliMusteriler.map(m => {
                    const kalan = (m.cari_limit || 0) - (m.mevcut_bakiye || 0);
                    const dolulukOran = m.cari_limit > 0 ? ((m.mevcut_bakiye || 0) / m.cari_limit) * 100 : 0;
                    return (
                      <tr key={m.musteri_id} style={s.tr}>
                        <td style={s.td}>
                          <div style={s.isletmeAdi}>{m.isletme_adi}</div>
                          <div style={s.altBilgi}>{m.ad} {m.soyad}</div>
                        </td>
                        <td style={s.td}>
                          <span style={{ ...s.cariBadge, background: m.cari_acik_mi ? "#f0fdf4" : "#f3f4f6", color: m.cari_acik_mi ? "#16a34a" : "#6b7280" }}>
                            {m.cari_acik_mi ? "✅ Açık" : "⚪ Kapalı"}
                          </span>
                        </td>
                        <td style={s.td}>{m.cari_limit > 0 ? `${(m.cari_limit).toLocaleString("tr-TR")} ₺` : "—"}</td>
                        <td style={s.td}>
                          {m.cari_acik_mi && m.mevcut_bakiye > 0 ? (
                            <div>
                              <div style={{ color: "#dc2626", fontWeight: 700 }}>{(m.mevcut_bakiye).toLocaleString("tr-TR")} ₺</div>
                              <div style={s.barWrap}><div style={{ ...s.barDolu, width: `${Math.min(dolulukOran, 100)}%`, background: dolulukOran > 80 ? "#dc2626" : "#f59e0b" }} /></div>
                            </div>
                          ) : <span style={{ color: "#9ca3af" }}>0 ₺</span>}
                        </td>
                        <td style={s.td}>
                          {m.cari_acik_mi ? (
                            <span style={{ fontWeight: 700, color: kalan > 0 ? "#16a34a" : "#dc2626" }}>
                              {kalan.toLocaleString("tr-TR")} ₺
                            </span>
                          ) : "—"}
                        </td>
                        <td style={s.td}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button style={s.ayarBtn} onClick={() => onaylaMusteriyiCari(m)}>⚙️ Ayarla</button>
                            {m.cari_acik_mi && m.mevcut_bakiye > 0 && (
                              <button style={s.odemeBtn} onClick={() => { setOdemeModal(m); setOdemeForm({ tutar: "", aciklama: "" }); }}>
                                💰 Ödeme Al
                              </button>
                            )}
                            <button style={s.gecmisBtn} onClick={() => gecmisGoster(m)}>📋 Geçmiş</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtreliMusteriler.length === 0 && (
                <div style={s.bos}>Onaylı müşteri bulunamadı</div>
              )}
            </div>
          )}
        </>
      )}

      {/* BEKLEYEN TALEPLER */}
      {aktifSekme === "talepler" && (
        <div style={s.tablo}>
          {talepler.length === 0 ? (
            <div style={s.bos}>Bekleyen cari hesap talebi yok</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>İşletme</th>
                  <th style={s.th}>Mesaj</th>
                  <th style={s.th}>Tarih</th>
                  <th style={s.th}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {talepler.map(t => (
                  <tr key={t.talep_id} style={s.tr}>
                    <td style={s.td}><div style={s.isletmeAdi}>{t.isletme_adi}</div></td>
                    <td style={s.td}>{t.mesaj || "—"}</td>
                    <td style={s.td}>{new Date(t.created_at).toLocaleDateString("tr-TR")}</td>
                    <td style={s.td}>
                      <button
                        style={s.ayarBtn}
                        onClick={() => {
                          const musteri = musteriler.find(m => m.musteri_id === t.musteri_id);
                          if (musteri) { onaylaMusteriyiCari(musteri); setAktifSekme("musteriler"); }
                        }}
                      >
                        ⚙️ Cari Ayarla
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CARİ AYAR MODAL */}
      {ayarModal && (
        <div style={s.overlay} onClick={() => setAyarModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalBaslik}>💳 Cari Ayarları</h3>
              <button style={s.kapat} onClick={() => setAyarModal(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 20, padding: "12px 16px", background: "#f9fafb", borderRadius: 10 }}>
              <div style={{ fontWeight: 700, color: "#111827" }}>{ayarModal.isletme_adi}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{ayarModal.ad} {ayarModal.soyad}</div>
            </div>
            <div style={s.formGrup}>
              <label style={s.formLabel}>Cari Hesap Durumu</label>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  style={{ ...s.durumBtn, background: ayarForm.cari_acik_mi ? "#16a34a" : "#f3f4f6", color: ayarForm.cari_acik_mi ? "#fff" : "#374151" }}
                  onClick={() => setAyarForm(f => ({ ...f, cari_acik_mi: true }))}
                >Açık</button>
                <button
                  style={{ ...s.durumBtn, background: !ayarForm.cari_acik_mi ? "#dc2626" : "#f3f4f6", color: !ayarForm.cari_acik_mi ? "#fff" : "#374151" }}
                  onClick={() => setAyarForm(f => ({ ...f, cari_acik_mi: false }))}
                >Kapalı</button>
              </div>
            </div>
            <div style={s.formGrup}>
              <label style={s.formLabel}>Cari Limit (₺)</label>
              <input
                style={s.input}
                type="number"
                min="0"
                value={ayarForm.cari_limit || ""}
                placeholder="0"
                onFocus={e => e.target.select()}
                onChange={e => setAyarForm(f => ({ ...f, cari_limit: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <button style={s.kaydetBtn} onClick={cariAyarKaydet}>Kaydet</button>
          </div>
        </div>
      )}

      {/* ÖDEME MODAL */}
      {odemeModal && (
        <div style={s.overlay} onClick={() => setOdemeModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalBaslik}>💰 Ödeme Al</h3>
              <button style={s.kapat} onClick={() => setOdemeModal(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 20, padding: "12px 16px", background: "#f9fafb", borderRadius: 10 }}>
              <div style={{ fontWeight: 700 }}>{odemeModal.isletme_adi}</div>
              <div style={{ fontSize: 13, color: "#dc2626", marginTop: 4 }}>
                Mevcut Bakiye: {(odemeModal.mevcut_bakiye || 0).toLocaleString("tr-TR")} ₺
              </div>
            </div>
            <div style={s.formGrup}>
              <label style={s.formLabel}>Ödeme Tutarı (₺)</label>
              <input
                style={s.input}
                type="number"
                min="0"
                placeholder="0.00"
                value={odemeForm.tutar}
                onFocus={e => e.target.select()}
                onChange={e => setOdemeForm(f => ({ ...f, tutar: e.target.value }))}
              />
            </div>
            <div style={s.formGrup}>
              <label style={s.formLabel}>Açıklama</label>
              <input
                style={s.input}
                placeholder="İsteğe bağlı"
                value={odemeForm.aciklama}
                onChange={e => setOdemeForm(f => ({ ...f, aciklama: e.target.value }))}
              />
            </div>
            <button style={s.kaydetBtn} onClick={odemeKaydet}>Ödemeyi Kaydet</button>
          </div>
        </div>
      )}

      {/* İŞLEM GEÇMİŞİ MODAL */}
      {gecmisModal && (
        <div style={s.overlay} onClick={() => setGecmisModal(null)}>
          <div style={{ ...s.modal, maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalBaslik}>📋 Cari İşlem Geçmişi</h3>
              <button style={s.kapat} onClick={() => setGecmisModal(null)}>✕</button>
            </div>
            <div style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>{gecmisModal.isletme_adi}</div>

            {!islemler ? (
              <div style={s.yukleniyor}>Yükleniyor...</div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  <div style={s.ozet}><div style={s.ozetDeger}>{islemler.cari_limit.toLocaleString("tr-TR")} ₺</div><div style={s.ozetLabel}>Limit</div></div>
                  <div style={s.ozet}><div style={{ ...s.ozetDeger, color: "#dc2626" }}>{islemler.mevcut_bakiye.toLocaleString("tr-TR")} ₺</div><div style={s.ozetLabel}>Bakiye</div></div>
                  <div style={s.ozet}><div style={{ ...s.ozetDeger, color: "#16a34a" }}>{islemler.kalan_limit.toLocaleString("tr-TR")} ₺</div><div style={s.ozetLabel}>Kalan</div></div>
                </div>
                {islemler.islemler.length === 0 ? (
                  <div style={s.bos}>Henüz işlem yok</div>
                ) : (
                  <div style={{ maxHeight: 420, overflowY: "auto" }}>
                    {islemler.islemler.map(i => {
                      const detay = siparisDetay[i.siparis_no];
                      const acik = acikSiparis === i.siparis_no;
                      return (
                        <div key={i.islem_id}>
                          <div style={{ ...s.islemSatir, cursor: i.siparis_no ? "pointer" : "default", background: acik ? "#f0fdf4" : "transparent" }} onClick={() => i.siparis_no && siparisDetayGetir(i.siparis_no)}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                                {i.aciklama}
                                {i.siparis_no && <span style={{ fontSize: 11, color: "#2563eb", marginLeft: 6 }}>{acik ? "▲ kapat" : "▼ detay"}</span>}
                              </div>
                              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{new Date(i.created_at).toLocaleString("tr-TR")}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontWeight: 700, color: i.tur === "borc" ? "#dc2626" : "#16a34a" }}>
                                {i.tur === "borc" ? "+" : "-"}{i.tutar.toLocaleString("tr-TR")} ₺
                              </div>
                              <div style={{ fontSize: 11, color: "#9ca3af" }}>Bakiye: {i.bakiye_sonrasi.toLocaleString("tr-TR")} ₺</div>
                            </div>
                          </div>
                          {acik && (
                            <div style={{ background: "#f9fafb", borderRadius: 10, padding: 14, margin: "0 0 4px", borderLeft: "3px solid #16a34a" }}>
                              {!detay ? (
                                <div style={{ fontSize: 12, color: "#9ca3af" }}>Yükleniyor...</div>
                              ) : (
                                <>
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                                    <div><div style={{ fontSize: 10, color: "#9ca3af" }}>Slot</div><div style={{ fontSize: 12, fontWeight: 700 }}>{detay.slot_label}</div></div>
                                    <div><div style={{ fontSize: 10, color: "#9ca3af" }}>Durum</div><div style={{ fontSize: 12, fontWeight: 700 }}>{detay.durum}</div></div>
                                    <div><div style={{ fontSize: 10, color: "#9ca3af" }}>Toplam</div><div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>{detay.genel_toplam?.toFixed(2)} ₺</div></div>
                                  </div>
                                  {detay.urunler?.map((u, idx) => (
                                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid #e5e7eb" }}>
                                      <span style={{ fontWeight: 600 }}>{u.ad}</span>
                                      <span style={{ color: "#6b7280" }}>{u.miktar} {u.birim_turu}</span>
                                      <span style={{ fontWeight: 700, color: "#16a34a" }}>{u.toplam?.toFixed(2)} ₺</span>
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  bildirim: { padding: "12px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, marginBottom: 16 },
  sekmeler: { display: "flex", gap: 8, marginBottom: 20 },
  sekmeBtn: { padding: "8px 20px", borderRadius: 20, background: "#f9fafb", border: "1.5px solid #e5e7eb", fontSize: 13, cursor: "pointer", fontWeight: 500 },
  sekmeBtnAktif: { background: "#14532d", color: "#fff", border: "1.5px solid #14532d" },
  taleplBadge: { background: "#dc2626", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, marginLeft: 6, fontWeight: 700 },
  aramaRow: { marginBottom: 16 },
  aramaInput: { width: "100%", maxWidth: 360, padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box" },
  tablo: { background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#f9fafb" },
  th: { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "12px 16px", fontSize: 13, color: "#374151" },
  isletmeAdi: { fontWeight: 700, color: "#111827" },
  altBilgi: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  cariBadge: { padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 },
  barWrap: { height: 4, background: "#e5e7eb", borderRadius: 2, marginTop: 4, width: 80 },
  barDolu: { height: 4, borderRadius: 2 },
  ayarBtn: { padding: "5px 12px", borderRadius: 6, background: "#f3f4f6", border: "none", fontSize: 12, cursor: "pointer", fontWeight: 600, color: "#374151" },
  odemeBtn: { padding: "5px 12px", borderRadius: 6, background: "#fef9c3", border: "none", fontSize: 12, cursor: "pointer", fontWeight: 600, color: "#854d0e" },
  gecmisBtn: { padding: "5px 12px", borderRadius: 6, background: "#eff6ff", border: "none", fontSize: 12, cursor: "pointer", fontWeight: 600, color: "#1d4ed8" },
  bos: { textAlign: "center", padding: 40, color: "#9ca3af" },
  yukleniyor: { textAlign: "center", padding: 40, color: "#9ca3af" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalBaslik: { fontSize: 18, fontWeight: 700, margin: 0 },
  kapat: { width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", fontWeight: 700 },
  formGrup: { marginBottom: 16 },
  formLabel: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box" },
  durumBtn: { flex: 1, padding: "9px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  kaydetBtn: { width: "100%", marginTop: 8, padding: "12px", borderRadius: 8, background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" },
  ozet: { flex: 1, background: "#f9fafb", borderRadius: 10, padding: "12px 16px", textAlign: "center" },
  ozetDeger: { fontSize: 18, fontWeight: 800, color: "#111827" },
  ozetLabel: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  islemSatir: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6" },
};
