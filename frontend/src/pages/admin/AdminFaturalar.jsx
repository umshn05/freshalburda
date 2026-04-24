import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

const ODEME_LABEL = { nakit: "Kapıda Nakit", cari: "Cari Hesap", kart: "Online Kart" };

function faturaYazdir(fatura) {
  const w = window.open("", "_blank", "width=960,height=750");
  const tarih = new Date(fatura.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const odeme = ODEME_LABEL[fatura.odeme_yontemi] || fatura.odeme_yontemi;
  const kalemlerHTML = fatura.kalemler.map((k, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f9fafb"}">
      <td style="padding:9px 14px;border-bottom:1px solid #e5e7eb">${k.urun_adi}</td>
      <td style="padding:9px 14px;border-bottom:1px solid #e5e7eb;text-align:center">${k.miktar} ${k.birim}</td>
      <td style="padding:9px 14px;border-bottom:1px solid #e5e7eb;text-align:right">${(k.birim_fiyat || 0).toFixed(2)} ₺</td>
      <td style="padding:9px 14px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700">${(k.toplam || 0).toFixed(2)} ₺</td>
    </tr>`).join("");
  const expressRow = fatura.express_ucret > 0 ? `
    <tr style="background:#fffbeb">
      <td style="padding:9px 14px;border-bottom:1px solid #e5e7eb">⚡ Express Teslimat</td>
      <td style="padding:9px 14px;border-bottom:1px solid #e5e7eb;text-align:center">1 adet</td>
      <td style="padding:9px 14px;border-bottom:1px solid #e5e7eb;text-align:right">${fatura.express_ucret.toFixed(2)} ₺</td>
      <td style="padding:9px 14px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700">${fatura.express_ucret.toFixed(2)} ₺</td>
    </tr>` : "";

  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Fatura ${fatura.fatura_no}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;padding:32px;color:#111;background:#fff}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #14532d}
  .co-name{font-size:22px;font-weight:800;color:#14532d}
  .co-sub{font-size:12px;color:#6b7280;margin-top:3px}
  .fi{text-align:right}
  .fi-no{font-size:20px;font-weight:700;color:#14532d}
  .fi-sub{font-size:12px;color:#6b7280;margin-top:3px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
  .kart{background:#f9fafb;border-radius:8px;padding:14px}
  .kart-baslik{font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
  .kart-satir{font-size:13px;color:#374151;margin-bottom:3px}
  .kart-bold{font-weight:700;color:#111;font-size:14px}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  thead th{background:#14532d;color:#fff;padding:10px 14px;font-size:12px;font-weight:600;text-align:left}
  .totals{display:flex;justify-content:flex-end;margin-bottom:28px}
  .totals-inner{width:260px}
  .ts{display:flex;justify-content:space-between;padding:7px 0;font-size:13px;border-bottom:1px solid #f3f4f6;color:#374151}
  .ts-label{color:#6b7280}
  .ts-son{border-top:2px solid #14532d;padding:10px 0;font-size:16px;font-weight:800;color:#14532d;border-bottom:none}
  .footer{margin-top:32px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center}
  .btn{display:block;margin:0 auto 24px;padding:11px 32px;background:#14532d;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer}
  @media print{.btn{display:none}body{padding:16px}}
</style></head><body>
<div class="hdr">
  <div>
    <div class="co-name">🥬 Freshalburda</div>
    <div class="co-sub">Taze Sebze & Meyve Tedariki | freshalburda.com</div>
    <div class="co-sub" style="margin-top:6px">Sebze Hali Cad. No:1 — İstanbul</div>
    <div class="co-sub">Tel: 0212 000 00 00 | info@freshalburda.com</div>
  </div>
  <div class="fi">
    <div class="fi-no">FATURA</div>
    <div class="fi-no" style="font-size:15px;margin-top:4px">${fatura.fatura_no}</div>
    <div class="fi-sub">Tarih: ${tarih}</div>
    <div class="fi-sub">Sipariş: ${fatura.siparis_no}</div>
    <div class="fi-sub">Ödeme: ${odeme}</div>
  </div>
</div>
<div class="grid">
  <div class="kart">
    <div class="kart-baslik">Satıcı</div>
    <div class="kart-satir kart-bold">Freshalburda Tarım Ürünleri</div>
    <div class="kart-satir">Vergi No: 1234567890</div>
    <div class="kart-satir">Vergi Dairesi: Merkez VD</div>
  </div>
  <div class="kart">
    <div class="kart-baslik">Alıcı</div>
    <div class="kart-satir kart-bold">${fatura.musteri_bilgi?.isletme_adi || "—"}</div>
    <div class="kart-satir">Vergi No: ${fatura.musteri_bilgi?.vergi_no || "—"}</div>
    ${fatura.musteri_bilgi?.vergi_dairesi ? `<div class="kart-satir">VD: ${fatura.musteri_bilgi.vergi_dairesi}</div>` : ""}
    ${fatura.musteri_bilgi?.telefon ? `<div class="kart-satir">Tel: ${fatura.musteri_bilgi.telefon}</div>` : ""}
    ${fatura.musteri_bilgi?.adres ? `<div class="kart-satir">${fatura.musteri_bilgi.adres}</div>` : ""}
    ${fatura.musteri_bilgi?.sehir ? `<div class="kart-satir">${fatura.musteri_bilgi.sehir}</div>` : ""}
  </div>
</div>
<table>
  <thead>
    <tr>
      <th style="width:44%">Ürün / Hizmet</th>
      <th style="width:20%;text-align:center">Miktar</th>
      <th style="width:18%;text-align:right">Birim Fiyat</th>
      <th style="width:18%;text-align:right">Tutar</th>
    </tr>
  </thead>
  <tbody>${kalemlerHTML}${expressRow}</tbody>
</table>
<div class="totals">
  <div class="totals-inner">
    <div class="ts"><span class="ts-label">KDV Matrahı</span><span>${(fatura.kdv_matrah || 0).toFixed(2)} ₺</span></div>
    <div class="ts"><span class="ts-label">KDV (%${fatura.kdv_orani})</span><span>${(fatura.kdv_tutari || 0).toFixed(2)} ₺</span></div>
    <div class="ts ts-son"><span>GENEL TOPLAM</span><span>${(fatura.genel_toplam || 0).toFixed(2)} ₺</span></div>
  </div>
</div>
<button class="btn" onclick="window.print()">🖨️ Yazdır / PDF Kaydet</button>
<div class="footer">Bu belge Freshalburda Tarım Ürünleri tarafından düzenlenmiştir. • E-arşiv entegrasyonuna hazır altyapı.</div>
</body></html>`);
  w.document.close();
}

export default function AdminFaturalar({ seciliSehir }) {
  const [faturalar, setFaturalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [arama, setArama] = useState("");

  useEffect(() => { verileriGetir(); }, [seciliSehir]);

  const verileriGetir = async () => {
    setYukleniyor(true);
    try {
      const q = seciliSehir ? `?sehir_id=${seciliSehir}` : "";
      const res = await fetch(`${API_URL}/api/faturalar${q}`);
      setFaturalar(await res.json());
    } catch (e) { console.error(e); }
    finally { setYukleniyor(false); }
  };

  const filtreliFaturalar = faturalar.filter(f =>
    f.fatura_no.toLowerCase().includes(arama.toLowerCase()) ||
    (f.musteri_bilgi?.isletme_adi || "").toLowerCase().includes(arama.toLowerCase()) ||
    f.siparis_no.toLowerCase().includes(arama.toLowerCase())
  );

  const toplamKdv = filtreliFaturalar.reduce((t, f) => t + (f.kdv_tutari || 0), 0);
  const toplamCiro = filtreliFaturalar.reduce((t, f) => t + (f.genel_toplam || 0), 0);

  return (
    <div>
      {/* ÖZET KARTLAR */}
      <div style={s.ozetGrid}>
        {[
          { label: "Toplam Fatura", deger: faturalar.length, birim: "adet", renk: "#1d4ed8", bg: "#eff6ff" },
          { label: "Toplam Ciro", deger: toplamCiro.toFixed(2), birim: "₺", renk: "#16a34a", bg: "#f0fdf4" },
          { label: "Toplam KDV", deger: toplamKdv.toFixed(2), birim: "₺", renk: "#f59e0b", bg: "#fffbeb" },
        ].map(k => (
          <div key={k.label} style={{ ...s.ozetKart, background: k.bg }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.renk }}>{k.deger} <span style={{ fontSize: 14 }}>{k.birim}</span></div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ARAÇ ÇUBUĞU */}
      <div style={s.ararac}>
        <input
          style={s.aramaInput}
          placeholder="🔍 Fatura no, müşteri veya sipariş ara..."
          value={arama}
          onChange={e => setArama(e.target.value)}
        />
        <button style={s.yenileBtn} onClick={verileriGetir}>↻ Yenile</button>
      </div>

      {/* TABLO */}
      {yukleniyor ? (
        <div style={s.yukleniyor}>Yükleniyor...</div>
      ) : (
        <div style={s.tablo}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>Fatura No</th>
                <th style={s.th}>Tarih</th>
                <th style={s.th}>Müşteri</th>
                <th style={s.th}>Sipariş No</th>
                <th style={s.th}>Ödeme</th>
                <th style={{ ...s.th, color: "#6b7280" }}>KDV Matrahı</th>
                <th style={{ ...s.th, color: "#f59e0b" }}>KDV (%10)</th>
                <th style={{ ...s.th, color: "#16a34a" }}>Genel Toplam</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtreliFaturalar.map(f => (
                <tr key={f.id} style={s.tr}>
                  <td style={s.td}><span style={s.faturaNo}>{f.fatura_no}</span></td>
                  <td style={s.td}><span style={s.tarih}>{new Date(f.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })}</span></td>
                  <td style={s.td}><div style={s.musteriAd}>{f.musteri_bilgi?.isletme_adi || "—"}</div><div style={s.vergiNo}>VKN: {f.musteri_bilgi?.vergi_no || "—"}</div></td>
                  <td style={s.td}><span style={s.siparisNo}>{f.siparis_no}</span></td>
                  <td style={s.td}><span style={{ ...s.odemeBadge, ...odemeStil(f.odeme_yontemi) }}>{ODEME_LABEL[f.odeme_yontemi] || f.odeme_yontemi}</span></td>
                  <td style={s.td}>{(f.kdv_matrah || 0).toFixed(2)} ₺</td>
                  <td style={{ ...s.td, color: "#f59e0b", fontWeight: 700 }}>{(f.kdv_tutari || 0).toFixed(2)} ₺</td>
                  <td style={{ ...s.td, color: "#16a34a", fontWeight: 800 }}>{(f.genel_toplam || 0).toFixed(2)} ₺</td>
                  <td style={s.td}>
                    <button style={s.gorBtn} onClick={() => faturaYazdir(f)}>🖨️ Görüntüle</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtreliFaturalar.length === 0 && <div style={s.bos}>Fatura bulunamadı</div>}
        </div>
      )}
    </div>
  );
}

function odemeStil(yontem) {
  if (yontem === "nakit") return { background: "#f0fdf4", color: "#16a34a" };
  if (yontem === "cari") return { background: "#eff6ff", color: "#1d4ed8" };
  return { background: "#f5f3ff", color: "#7c3aed" };
}

const s = {
  ozetGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 },
  ozetKart: { borderRadius: 12, padding: "16px 20px", border: "1px solid #e5e7eb" },
  ararac: { display: "flex", gap: 12, marginBottom: 16, alignItems: "center" },
  aramaInput: { flex: 1, padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none" },
  yenileBtn: { padding: "10px 18px", borderRadius: 10, background: "#f3f4f6", border: "1.5px solid #e5e7eb", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  tablo: { background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 900 },
  thead: { background: "#f9fafb" },
  th: { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "11px 16px", fontSize: 13, color: "#374151" },
  faturaNo: { fontWeight: 800, color: "#14532d", fontSize: 13 },
  tarih: { color: "#6b7280", fontSize: 12 },
  musteriAd: { fontWeight: 700, color: "#111827" },
  vergiNo: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  siparisNo: { fontSize: 12, color: "#6b7280", fontFamily: "monospace" },
  odemeBadge: { padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700 },
  gorBtn: { padding: "5px 12px", borderRadius: 8, background: "#14532d", color: "#fff", border: "none", fontSize: 12, cursor: "pointer", fontWeight: 600 },
  bos: { textAlign: "center", padding: 40, color: "#9ca3af" },
  yukleniyor: { textAlign: "center", padding: 40, color: "#9ca3af" },
};
