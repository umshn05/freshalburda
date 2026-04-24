import { useState } from "react";
import AdminLayout from "./AdminLayout";
import AdminDashboard from "./AdminDashboard";
import AdminMusteriler from "./AdminMusteriler";
import AdminUrunler from "./AdminUrunler";
import AdminKategoriler from "./AdminKategoriler";
import AdminFiyatlar from "./AdminFiyatlar";
import AdminOnayPaneli from "./AdminOnayPaneli";
import AdminSiparisler from "./AdminSiparisler";
import AdminCari from "./AdminCari";
import AdminFaturalar from "./AdminFaturalar";
import AdminSehirler from "./AdminSehirler";
import AdminKullanicilar from "./AdminKullanicilar";

export default function AdminPanel({ kullanici, onCikis }) {
  const [aktifSekme, setAktifSekme] = useState("dashboard");
  const [seciliSehir, setSeciliSehir] = useState(
    kullanici?.sehir_id || null
  );

  const renderIcerik = () => {
    switch (aktifSekme) {
      case "dashboard": return <AdminDashboard seciliSehir={seciliSehir} />;
      case "musteri-onay": return <AdminOnayPaneli kullanici={kullanici} onCikis={onCikis} seciliSehir={seciliSehir} />;
      case "musteriler": return <AdminMusteriler seciliSehir={seciliSehir} />;
      case "urunler": return <AdminUrunler seciliSehir={seciliSehir} />;
      case "kategoriler": return <AdminKategoriler seciliSehir={seciliSehir} />;
      case "fiyatlar": return <AdminFiyatlar seciliSehir={seciliSehir} />;
      case "siparisler": return <AdminSiparisler seciliSehir={seciliSehir} />;
      case "faturalar": return <AdminFaturalar seciliSehir={seciliSehir} />;
      case "cari": return <AdminCari seciliSehir={seciliSehir} />;
      case "sehirler": return <AdminSehirler />;
      case "kullanicilar": return <AdminKullanicilar />;
      default: return <AdminDashboard seciliSehir={seciliSehir} />;
    }
  };

  return (
    <AdminLayout
      kullanici={kullanici}
      onCikis={onCikis}
      aktifSekme={aktifSekme}
      setAktifSekme={setAktifSekme}
      seciliSehir={seciliSehir}
      setSeciliSehir={setSeciliSehir}
    >
      {renderIcerik()}
    </AdminLayout>
  );
}
