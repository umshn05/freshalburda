import { useState } from "react";
import KayitEkrani from "./pages/KayitEkrani";
import GirisEkrani from "./pages/GirisEkrani";
import MusteriAnaSayfa from "./pages/MusteriAnaSayfa";
import ProfilEkrani from "./pages/ProfilEkrani";
import AdminPanel from "./pages/admin/AdminPanel";
import SiparisEkrani from "./pages/SiparisEkrani";

// ── Fetch interceptor: tüm API isteklerine otomatik Authorization header ekler ──
(function () {
  const _fetch = window.fetch;
  window.fetch = function (url, options = {}) {
    if (typeof url === "string" && url.includes("localhost:8000")) {
      const token = localStorage.getItem("token");
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }
    return _fetch(url, options);
  };
})();

function App() {
  const [ekran, setEkran] = useState("giris");
  const [kullanici, setKullanici] = useState(null);
  const [sepetVerisi, setSepetVerisi] = useState([]);

  const girisBasarili = (data) => {
    setKullanici(data);
    localStorage.setItem("token", data.access_token);
    if (data.sehir_id) localStorage.setItem("sehir_id", data.sehir_id);
    else localStorage.removeItem("sehir_id");

    if (data.rol === "super_admin" || data.rol === "sehir_admin" || data.rol === "finans") {
      setEkran("admin");
    } else if (data.rol === "kurye") {
      setEkran("kurye");
    } else if (data.rol === "musteri_yetkilisi") {
      if (data.onay_durumu === "onaylandi") {
        setEkran("musteri");
      } else if (data.onay_durumu === "reddedildi") {
        setEkran("reddedildi");
      } else {
        setEkran("beklemede");
      }
    }
  };

  if (ekran === "beklemede") {
    return (
      <div style={styles.page}>
        <div style={styles.kart}>
          <div style={{ fontSize: 64, textAlign: "center" }}>⏳</div>
          <h2 style={styles.baslik}>Onay Bekleniyor</h2>
          <p style={styles.aciklama}>
            Hesabınız inceleniyor. Admin ekibimiz onayladıktan sonra
            sisteme giriş yapabileceksiniz. Onay sonrasında e-posta
            ile bilgilendirileceksiniz.
          </p>
          <button style={styles.btn} onClick={() => setEkran("giris")}>
            Giriş Ekranına Dön
          </button>
        </div>
      </div>
    );
  }

  if (ekran === "reddedildi") {
    return (
      <div style={styles.page}>
        <div style={styles.kart}>
          <div style={{ fontSize: 64, textAlign: "center" }}>❌</div>
          <h2 style={{ ...styles.baslik, color: "#dc2626" }}>Hesap Reddedildi</h2>
          <p style={styles.aciklama}>
            Hesabınız onaylanmadı. Daha fazla bilgi için bizimle
            iletişime geçebilirsiniz.
          </p>
          <button style={styles.btn} onClick={() => setEkran("giris")}>
            Giriş Ekranına Dön
          </button>
        </div>
      </div>
    );
  }

  if (ekran === "admin") {
    return <AdminPanel kullanici={kullanici} onCikis={() => { setEkran("giris"); localStorage.removeItem("token"); localStorage.removeItem("sehir_id"); }} />;
  }

  if (ekran === "kurye") {
    return (
      <div style={styles.page}>
        <div style={styles.kart}>
          <div style={{ fontSize: 64, textAlign: "center" }}>🚚</div>
          <h2 style={styles.baslik}>Kurye Paneli</h2>
          <p style={styles.aciklama}>Hoş geldiniz, {kullanici?.ad}! Kurye paneli yapım aşamasında.</p>
          <button style={styles.btn} onClick={() => setEkran("giris")}>
            Çıkış Yap
          </button>
        </div>
      </div>
    );
  }

  if (ekran === "musteri") {
    return <MusteriAnaSayfa kullanici={kullanici} onCikis={() => setEkran("giris")} onProfil={() => setEkran("profil")} onSiparis={(sepet) => { setSepetVerisi(sepet); setEkran("siparis"); }} />;
  }

  if (ekran === "siparis") {
    return <SiparisEkrani kullanici={kullanici} sepet={sepetVerisi} onGeri={() => setEkran("musteri")} onSiparisVerildi={() => setEkran("musteri")} />;
  }

  if (ekran === "profil") {
    return <ProfilEkrani kullanici={kullanici} onGeri={() => setEkran("musteri")} />;
  }
  return (
    <>
      {ekran === "giris" && (
        <GirisEkrani
          onKayitOl={() => setEkran("kayit")}
          onGirisBasarili={girisBasarili}
        />
      )}
      {ekran === "kayit" && (
        <KayitEkrani onGirise={() => setEkran("giris")} />
      )}
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  kart: {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
    textAlign: "center",
  },
  baslik: { fontSize: 24, fontWeight: 700, color: "#14532d", margin: "16px 0 8px" },
  aciklama: { fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "0 0 24px" },
  btn: {
    width: "100%", padding: "12px", borderRadius: 10,
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff", fontSize: 15, fontWeight: 600,
    border: "none", cursor: "pointer",
  },
};

export default App;