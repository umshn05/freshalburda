import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

const ILLER = ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kırıkkale", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"];

const IL_ILCE = {
  "Adana": ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"],
  "Adıyaman": ["Adıyaman", "Besni", "Çelikhan", "Gerger", "Gölbaşı", "Kahta", "Samsat", "Sincik", "Tut"],
  "Afyonkarahisar": ["Afyonkarahisar", "Başmakçı", "Bayat", "Bolvadin", "Çay", "Çobanlar", "Dazkırı", "Dinar", "Emirdağ", "Evciler", "Hocalar", "İhsaniye", "İscehisar", "Kızılören", "Sandıklı", "Sinanpaşa", "Sultandağı", "Şuhut"],
  "Ağrı": ["Ağrı", "Diyadin", "Doğubayazıt", "Eleşkirt", "Hamur", "Patnos", "Taşlıçay", "Tutak"],
  "Amasya": ["Amasya", "Göynücek", "Gümüşhacıköy", "Hamamözü", "Merzifon", "Suluova", "Taşova"],
  "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kahramankazan", "Kalecik", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
  "Antalya": ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"],
  "Artvin": ["Ardanuç", "Arhavi", "Artvin", "Borçka", "Hopa", "Kemalpaşa", "Murgul", "Şavşat", "Yusufeli"],
  "Aydın": ["Bozdoğan", "Buharkent", "Çine", "Didim", "Efeler", "Germencik", "İncirliova", "Karacasu", "Karpuzlu", "Koçarlı", "Köşk", "Kuşadası", "Kuyucak", "Nazilli", "Söke", "Sultanhisar", "Yenipazar"],
  "Balıkesir": ["Altıeylül", "Ayvalık", "Balya", "Bandırma", "Bigadiç", "Burhaniye", "Dursunbey", "Edremit", "Erdek", "Gömeç", "Gönen", "Havran", "İvrindi", "Karesi", "Kepsut", "Manyas", "Marmara", "Savaştepe", "Sındırgı", "Susurluk"],
  "Bilecik": ["Bozüyük", "Gölpazarı", "İnhisar", "Merkez", "Osmaneli", "Pazaryeri", "Söğüt", "Yenipazar"],
  "Bingöl": ["Adaklı", "Genç", "Karlıova", "Kiğı", "Merkez", "Solhan", "Yayladere", "Yedisu"],
  "Bitlis": ["Adilcevaz", "Ahlat", "Güroymak", "Hizan", "Merkez", "Mutki", "Tatvan"],
  "Bolu": ["Dörtdivan", "Gerede", "Göynük", "Kıbrıscık", "Mengen", "Merkez", "Mudurnu", "Seben", "Yeniçağa"],
  "Burdur": ["Ağlasun", "Altınyayla", "Bucak", "Çavdır", "Çeltikçi", "Gölhisar", "Karamanlı", "Kemer", "Merkez", "Tefenni", "Yeşilova"],
  "Bursa": ["Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey", "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli", "Orhangazi", "Osmangazi", "Yıldırım", "Yenişehir"],
  "Çanakkale": ["Ayvacık", "Bayramiç", "Biga", "Bozcaada", "Çan", "Eceabat", "Ezine", "Gelibolu", "Gökçeada", "Lapseki", "Merkez", "Yenice"],
  "Çankırı": ["Atkaracalar", "Bayramören", "Çerkeş", "Eldivan", "Ilgaz", "Khanköy", "Korgun", "Kurşunlu", "Merkez", "Orta", "Şabanözü", "Yapraklı"],
  "Çorum": ["Alaca", "Bayat", "Boğazkale", "Dodurga", "İskilip", "Kargı", "Laçin", "Mecitözü", "Merkez", "Oğuzlar", "Ortaköy", "Osmancık", "Sungurlu", "Uğurludağ"],
  "Denizli": ["Acıpayam", "Babadağ", "Baklan", "Bekilli", "Beyağaç", "Bozkurt", "Buldan", "Çal", "Çameli", "Çardak", "Çivril", "Güney", "Honaz", "Kale", "Merkez", "Pamukkale", "Sarayköy", "Serinhisar", "Tavas"],
  "Diyarbakır": ["Bağlar", "Bismil", "Çermik", "Çınar", "Çüngüş", "Dicle", "Eğil", "Ergani", "Hani", "Hazro", "Kayapınar", "Kocaköy", "Kulp", "Lice", "Merkez", "Silvan", "Sur", "Yenişehir"],
  "Edirne": ["Enez", "Havsa", "İpsala", "Keşan", "Lalapaşa", "Meriç", "Merkez", "Süloğlu", "Uzunköprü"],
  "Elazığ": ["Ağın", "Alacakaya", "Arıcak", "Baskil", "Karakoçan", "Keban", "Kovancılar", "Maden", "Merkez", "Palu", "Sivrice"],
  "Erzincan": ["Çayırlı", "İliç", "Kemah", "Kemaliye", "Merkez", "Otlukbeli", "Refahiye", "Tercan", "Üzümlü"],
  "Erzurum": ["Aşkale", "Aziziye", "Çat", "Hınıs", "Horasan", "İspir", "Karaçoban", "Karayazı", "Köprüköy", "Narman", "Oltu", "Olur", "Palandöken", "Pasinler", "Pazaryolu", "Şenkaya", "Tekman", "Tortum", "Uzundere", "Yakutiye"],
  "Eskişehir": ["Alpu", "Beylikova", "Çifteler", "Günyüzü", "Han", "İnönü", "Mahmudiye", "Mihalgazi", "Mihalıççık", "Merkez", "Odunpazarı", "Sarıcakaya", "Seyitgazi", "Sivrihisar", "Tepebaşı"],
  "Gaziantep": ["Araban", "İslahiye", "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Şahinbey", "Şehitkamil", "Yavuzeli"],
  "Giresun": ["Alucra", "Bulancak", "Çamoluk", "Çanakçı", "Dereli", "Doğankent", "Espiye", "Eynesil", "Görele", "Güce", "Keşap", "Merkez", "Piraziz", "Şebinkarahisar", "Tirebolu", "Yağlıdere"],
  "Gümüşhane": ["Kelkit", "Köse", "Kürtün", "Merkez", "Şiran", "Torul"],
  "Hakkari": ["Çukurca", "Derecik", "Merkez", "Şemdinli", "Yüksekova"],
  "Hatay": ["Altınözü", "Antakya", "Arsuz", "Belen", "Defne", "Dörtyol", "Erzin", "Hassa", "İskenderun", "Kırıkhan", "Kumlu", "Payas", "Reyhanlı", "Samandağ", "Yayladağı"],
  "Isparta": ["Aksu", "Atabey", "Eğirdir", "Gelendost", "Gönen", "Keçiborlu", "Merkez", "Senirkent", "Sütçüler", "Şarkikaraağaç", "Uluborlu", "Yalvaç", "Yenişarbademli"],
  "Mersin": ["Akdeniz", "Anamur", "Aydıncık", "Bozyazı", "Çamlıyayla", "Erdemli", "Gülnar", "Mezitli", "Mut", "Silifke", "Tarsus", "Toroslar", "Yenişehir"],
  "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
  "İzmir": ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"],
  "Kars": ["Akyaka", "Arpaçay", "Digor", "Kağızman", "Merkez", "Sarıkamış", "Selim", "Susuz"],
  "Kastamonu": ["Abana", "Ağlı", "Araç", "Azdavay", "Bozkurt", "Çatalzeytin", "Daday", "Devrekani", "Doğanyurt", "Hanönü", "İhsangazi", "İnebolu", "Küre", "Merkez", "Pınarbaşı", "Seydiler", "Şenpazar", "Taşköprü", "Tosya"],
  "Kayseri": ["Akkışla", "Bünyan", "Develi", "Felahiye", "Hacılar", "İncesu", "Kocasinan", "Melikgazi", "Özvatan", "Pınarbaşı", "Sarıoğlan", "Sarız", "Talas", "Tomarza", "Yahyalı", "Yeşilhisar"],
  "Kırklareli": ["Babaeski", "Demirköy", "Kofçaz", "Lüleburgaz", "Merkez", "Pehlivanköy", "Pınarhisar", "Vize"],
  "Kırşehir": ["Akçakent", "Akpınar", "Boztepe", "Çiçekdağı", "Kaman", "Merkez", "Mucur"],
  "Kocaeli": ["Başiskele", "Çayırova", "Darıca", "Derince", "Dilovası", "Gebze", "Gölcük", "İzmit", "Kandıra", "Karamürsel", "Kartepe", "Körfez"],
  "Konya": ["Ahırlı", "Akören", "Akşehir", "Altınekin", "Beyşehir", "Bozkır", "Cihanbeyli", "Çeltik", "Çumra", "Derbent", "Derebucak", "Doğanhisar", "Emirgazi", "Ereğli", "Güneysinir", "Hadim", "Halkapınar", "Hüyük", "Ilgın", "Kadınhanı", "Karapınar", "Karatay", "Kulu", "Meram", "Sarayönü", "Selçuklu", "Seydişehir", "Taşkent", "Tuzlukçu", "Yalıhüyük", "Yunak"],
  "Kütahya": ["Altıntaş", "Aslanapa", "Çavdarhisar", "Domaniç", "Dumlupınar", "Emet", "Gediz", "Hisarcık", "Merkez", "Pazarlar", "Simav", "Şaphane", "Tavşanlı"],
  "Malatya": ["Akçadağ", "Arapgir", "Arguvan", "Battalgazi", "Darende", "Doğanşehir", "Doğanyol", "Hekimhan", "Kale", "Kuluncak", "Pütürge", "Yazıhan", "Yeşilyurt"],
  "Manisa": ["Ahmetli", "Akhisar", "Alaşehir", "Demirci", "Gölmarmara", "Gördes", "Kırkağaç", "Köprübaşı", "Kula", "Merkez", "Salihli", "Sarıgöl", "Saruhanlı", "Selendi", "Soma", "Şehzadeler", "Turgutlu", "Yunusemre"],
  "Kahramanmaraş": ["Afşin", "Andırın", "Çağlayancerit", "Dulkadiroğlu", "Ekinözü", "Elbistan", "Göksun", "Nurhak", "Onikişubat", "Pazarcık", "Türkoğlu"],
  "Mardin": ["Artuklu", "Dargeçit", "Derik", "Kızıltepe", "Mazıdağı", "Midyat", "Nusaybin", "Ömerli", "Savur", "Yeşilli"],
  "Muğla": ["Bodrum", "Dalaman", "Datça", "Fethiye", "Kavaklıdere", "Köyceğiz", "Marmaris", "Menteşe", "Milas", "Ortaca", "Seydikemer", "Ula", "Yatağan"],
  "Muş": ["Bulanık", "Hasköy", "Korkut", "Malazgirt", "Merkez", "Varto"],
  "Nevşehir": ["Acıgöl", "Avanos", "Derinkuyu", "Gülşehir", "Hacıbektaş", "Kozaklı", "Merkez", "Ürgüp"],
  "Niğde": ["Altunhisar", "Bor", "Çamardı", "Çiftlik", "Merkez", "Ulukışla"],
  "Ordu": ["Akkuş", "Altınordu", "Aybastı", "Çamaş", "Çatalpınar", "Çaybaşı", "Fatsa", "Gölköy", "Gülyalı", "Gürgentepe", "İkizce", "Kabadüz", "Kabataş", "Korgan", "Kumru", "Mesudiye", "Perşembe", "Ulubey", "Ünye"],
  "Rize": ["Ardeşen", "Çamlıhemşin", "Çayeli", "Derepazarı", "Fındıklı", "Güneysu", "Hemşin", "İkizdere", "İyidere", "Kalkandere", "Merkez", "Pazar"],
  "Sakarya": ["Adapazarı", "Akyazı", "Arifiye", "Erenler", "Ferizli", "Geyve", "Hendek", "Karapürçek", "Karasu", "Kaynarca", "Kocaali", "Mithatpaşa", "Pamukova", "Sapanca", "Serdivan", "Söğütlü", "Taraklı"],
  "Samsun": ["Alaçam", "Asarcık", "Atakum", "Ayvacık", "Bafra", "Canik", "Çarşamba", "Havza", "İlkadım", "Kavak", "Ladik", "Ondokuzmayıs", "Salıpazarı", "Tekkeköy", "Terme", "Vezirköprü", "Yakakent"],
  "Siirt": ["Baykan", "Eruh", "Kurtalan", "Merkez", "Pervari", "Şirvan", "Tillo"],
  "Sinop": ["Ayancık", "Boyabat", "Dikmen", "Durağan", "Erfelek", "Gerze", "Merkez", "Saraydüzü", "Türkeli"],
  "Sivas": ["Akıncılar", "Altınyayla", "Divriği", "Doğanşar", "Gemerek", "Gölova", "Hafik", "İmranlı", "Kangal", "Koyulhisar", "Merkez", "Suşehri", "Şarkışla", "Ulaş", "Yıldızeli", "Zara"],
  "Tekirdağ": ["Çerkezköy", "Çorlu", "Ergene", "Hayrabolu", "Kapaklı", "Malkara", "Marmaraereğlisi", "Muratlı", "Saray", "Süleymanpaşa", "Şarköy"],
  "Tokat": ["Almus", "Artova", "Başçiftlik", "Erbaa", "Merkez", "Niksar", "Pazar", "Reşadiye", "Sulusaray", "Turhal", "Yeşilyurt", "Zile"],
  "Trabzon": ["Akçaabat", "Araklı", "Arsin", "Beşikdüzü", "Çarşıbaşı", "Çaykara", "Dernekpazarı", "Düzköy", "Hayrat", "Köprübaşı", "Maçka", "Of", "Ortahisar", "Sürmene", "Şalpazarı", "Tonya", "Vakfıkebir", "Yomra"],
  "Tunceli": ["Çemişgezek", "Hozat", "Mazgirt", "Merkez", "Nazımiye", "Ovacık", "Pertek", "Pülümür"],
  "Şanlıurfa": ["Akçakale", "Birecik", "Bozova", "Ceylanpınar", "Eyyübiye", "Halfeti", "Haliliye", "Harran", "Hilvan", "Karaköprü", "Siverek", "Suruç", "Viranşehir"],
  "Uşak": ["Banaz", "Eşme", "Karahallı", "Merkez", "Sivaslı", "Ulubey"],
  "Van": ["Bahçesaray", "Başkale", "Çaldıran", "Çatak", "Edremit", "Erciş", "Gevaş", "Gürpınar", "İpekyolu", "Merkez", "Muradiye", "Özalp", "Saray", "Tuşba"],
  "Yozgat": ["Akdağmadeni", "Aydıncık", "Boğazlıyan", "Çandır", "Çayıralan", "Çekerek", "Kadışehri", "Merkez", "Saraykent", "Sarıkaya", "Şefaatli", "Sorgun", "Yenifakılı", "Yerköy"],
  "Zonguldak": ["Alaplı", "Çaycuma", "Devrek", "Ereğli", "Gökçebey", "Kilimli", "Kozlu", "Merkez"],
  "Aksaray": ["Ağaçören", "Eskil", "Gülağaç", "Güzelyurt", "Merkez", "Ortaköy", "Sarıyahşi"],
  "Bayburt": ["Aydıntepe", "Demirözü", "Merkez"],
  "Karaman": ["Ayrancı", "Başyayla", "Ermenek", "Kazımkarabekir", "Merkez", "Sarıveliler"],
  "Kırıkkale": ["Bahşili", "Balışeyh", "Çelebi", "Delice", "Karakeçili", "Keskin", "Merkez", "Sulakyurt", "Yahşihan"],
  "Batman": ["Beşiri", "Gercüş", "Hasankeyf", "Kozluk", "Merkez", "Sason"],
  "Şırnak": ["Beytüşşebap", "Cizre", "Güçlükonak", "İdil", "Merkez", "Silopi", "Uludere"],
  "Bartın": ["Amasra", "Kurucaşile", "Merkez", "Ulus"],
  "Ardahan": ["Çıldır", "Damal", "Göle", "Hanak", "Merkez", "Posof"],
  "Iğdır": ["Aralık", "Karakoyunlu", "Merkez", "Tuzluca"],
  "Yalova": ["Altınova", "Armutlu", "Çiftlikköy", "Çınarcık", "Merkez", "Termal"],
  "Karabük": ["Eflani", "Eskipazar", "Merkez", "Ovacık", "Safranbolu", "Yenice"],
  "Kilis": ["Elbeyli", "Merkez", "Musabeyli", "Polateli"],
  "Osmaniye": ["Bahçe", "Düziçi", "Hasanbeyli", "Kadirli", "Merkez", "Sumbas", "Toprakkale"],
  "Düzce": ["Akçakoca", "Cumayeri", "Çilimli", "Gölyaka", "Gümüşova", "Kaynaşlı", "Merkez", "Yığılca"],
};


export default function ProfilEkrani({ kullanici, onGeri }) {
  const [aktifSekme, setAktifSekme] = useState("kisisel");
  const [profil, setProfil] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [bildirim, setBildirim] = useState(null);


  // Kişisel form
  const [kisiselForm, setKisiselForm] = useState({ ad: "", soyad: "", telefon: "" });
  const [kisiselDuzenle, setKisiselDuzenle] = useState(false);

  // İşletme form
  const [isletmeForm, setIsletmeForm] = useState({ isletme_adi: "", vergi_dairesi: "" });
  const [isletmeDuzenle, setIsletmeDuzenle] = useState(false);

  // Şifre form
  const [sifreForm, setSifreForm] = useState({ mevcut_sifre: "", yeni_sifre: "", yeni_sifre_tekrar: "" });

  // Adres
  const [adresModal, setAdresModal] = useState(false);
  const [adresForm, setAdresForm] = useState({ il: "", ilce: "", acik_adres: "", teslimat_notu: "", varsayilan_mi: false });
  const [duzenleAdresId, setDuzenleAdresId] = useState(null);

  useEffect(() => {
    profilGetir();
  }, []);

  const profilGetir = async () => {
    setYukleniyor(true);
    try {
      const res = await fetch(`${API_URL}/api/profil/${kullanici.kullanici_id}`);
      const data = await res.json();
      setProfil(data);
      setKisiselForm({ ad: data.ad, soyad: data.soyad, telefon: data.telefon });
      setIsletmeForm({ isletme_adi: data.musteri?.isletme_adi || "", vergi_dairesi: data.musteri?.vergi_dairesi || "" });
    } catch (e) { console.error(e); }
    finally { setYukleniyor(false); }
  };

  const bildirimGoster = (mesaj, tip = "basari") => {
    setBildirim({ mesaj, tip });
    setTimeout(() => setBildirim(null), 3000);
  };

  const kisiselKaydet = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profil/${kullanici.kullanici_id}/kisisel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kisiselForm),
      });
      if (!res.ok) throw new Error();
      bildirimGoster("Kişisel bilgiler güncellendi");
      setKisiselDuzenle(false);
      profilGetir();
    } catch { bildirimGoster("Hata oluştu", "hata"); }
  };

  const isletmeKaydet = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profil/${kullanici.kullanici_id}/isletme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isletmeForm),
      });
      if (!res.ok) throw new Error();
      bildirimGoster("İşletme bilgileri güncellendi");
      setIsletmeDuzenle(false);
      profilGetir();
    } catch { bildirimGoster("Hata oluştu", "hata"); }
  };

  const sifreKaydet = async () => {
    if (sifreForm.yeni_sifre !== sifreForm.yeni_sifre_tekrar) return bildirimGoster("Yeni şifreler eşleşmiyor", "hata");
    if (sifreForm.yeni_sifre.length < 8) return bildirimGoster("Şifre en az 8 karakter olmalı", "hata");
    try {
      const res = await fetch(`${API_URL}/api/profil/${kullanici.kullanici_id}/sifre`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mevcut_sifre: sifreForm.mevcut_sifre, yeni_sifre: sifreForm.yeni_sifre }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      bildirimGoster("Şifre güncellendi");
      setSifreForm({ mevcut_sifre: "", yeni_sifre: "", yeni_sifre_tekrar: "" });
    } catch (e) { bildirimGoster(e.message || "Hata oluştu", "hata"); }
  };

  const adresKaydet = async () => {
    try {
      const url = duzenleAdresId
        ? `${API_URL}/api/profil/${kullanici.kullanici_id}/adres/${duzenleAdresId}`
        : `${API_URL}/api/profil/${kullanici.kullanici_id}/adres`;
      const method = duzenleAdresId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adresForm),
      });
      if (!res.ok) throw new Error();
      bildirimGoster(duzenleAdresId ? "Adres güncellendi" : "Adres eklendi");
      setAdresModal(false);
      setDuzenleAdresId(null);
      setAdresForm({ il: "", ilce: "", acik_adres: "", teslimat_notu: "", varsayilan_mi: false });
      profilGetir();
    } catch { bildirimGoster("Hata oluştu", "hata"); }
  };

  const adresSil = async (adresId) => {
    if (!window.confirm("Bu adresi silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`${API_URL}/api/profil/${kullanici.kullanici_id}/adres/${adresId}`, { method: "DELETE" });
      bildirimGoster("Adres silindi");
      profilGetir();
    } catch { bildirimGoster("Hata oluştu", "hata"); }
  };

  if (yukleniyor) return <div style={styles.yukleniyor}>Yükleniyor...</div>;

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <button style={styles.geriBtn} onClick={onGeri}>← Ana Sayfa</button>
        <h1 style={styles.baslik}>Profilim</h1>
        <div />
      </div>

      {/* BİLDİRİM */}
      {bildirim && (
        <div style={{ ...styles.bildirim, background: bildirim.tip === "basari" ? "#f0fdf4" : "#fef2f2", color: bildirim.tip === "basari" ? "#16a34a" : "#dc2626", border: `1px solid ${bildirim.tip === "basari" ? "#bbf7d0" : "#fecaca"}` }}>
          {bildirim.mesaj}
        </div>
      )}

      <div style={styles.icerik}>
        {/* SOL - Avatar ve Menü */}
        <div style={styles.sol}>
          <div style={styles.avatarWrap}>
            <div style={styles.avatar}>{profil?.ad?.[0]}{profil?.soyad?.[0]}</div>
            <div style={styles.avatarAd}>{profil?.ad} {profil?.soyad}</div>
            <div style={styles.avatarIsletme}>{profil?.musteri?.isletme_adi}</div>
            <div style={{ ...styles.onayBadge, background: profil?.musteri?.onay_durumu === "onaylandi" ? "#f0fdf4" : "#fef9c3", color: profil?.musteri?.onay_durumu === "onaylandi" ? "#16a34a" : "#854d0e" }}>
              {profil?.musteri?.onay_durumu === "onaylandi" ? "✅ Onaylı Hesap" : "⏳ Onay Bekliyor"}
            </div>
          </div>

          <div style={styles.menu}>
            {[
              { key: "kisisel", label: "👤 Kişisel Bilgiler" },
              { key: "isletme", label: "🏢 İşletme Bilgileri" },
              { key: "adresler", label: "📍 Adreslerim" },
              { key: "sifre", label: "🔒 Şifre Değiştir" },
              { key: "cari", label: "💳 Cari Hesap" },
              { key: "siparislerim", label: "📦 Siparişlerim" },
              { key: "faturalarim", label: "🧾 Faturalarım" },
            ].map(m => (
              <button
                key={m.key}
                style={{ ...styles.menuBtn, ...(aktifSekme === m.key ? styles.menuBtnAktif : {}) }}
                onClick={() => setAktifSekme(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* SAĞ - İçerik */}
        <div style={styles.sag}>

          {/* KİŞİSEL BİLGİLER */}
          {aktifSekme === "kisisel" && (
            <div style={styles.kart}>
              <div style={styles.kartHeader}>
                <h2 style={styles.kartBaslik}>👤 Kişisel Bilgiler</h2>
                <button style={styles.duzenleBtn} onClick={() => setKisiselDuzenle(!kisiselDuzenle)}>
                  {kisiselDuzenle ? "İptal" : "✏️ Düzenle"}
                </button>
              </div>
              {kisiselDuzenle ? (
                <div>
                  <Alan label="Ad">
                    <input style={styles.input} value={kisiselForm.ad} onChange={e => setKisiselForm(f => ({ ...f, ad: e.target.value }))} />
                  </Alan>
                  <Alan label="Soyad">
                    <input style={styles.input} value={kisiselForm.soyad} onChange={e => setKisiselForm(f => ({ ...f, soyad: e.target.value }))} />
                  </Alan>
                  <Alan label="Telefon">
                    <input style={styles.input} value={kisiselForm.telefon} onChange={e => setKisiselForm(f => ({ ...f, telefon: e.target.value }))} />
                  </Alan>
                  <button style={styles.kaydetBtn} onClick={kisiselKaydet}>Kaydet</button>
                </div>
              ) : (
                <div>
                  <BilgiSatir label="Ad Soyad" deger={`${profil?.ad} ${profil?.soyad}`} />
                  <BilgiSatir label="E-posta" deger={profil?.eposta} />
                  <BilgiSatir label="Telefon" deger={profil?.telefon} />
                </div>
              )}
            </div>
          )}

          {/* İŞLETME BİLGİLERİ */}
          {aktifSekme === "isletme" && (
            <div style={styles.kart}>
              <div style={styles.kartHeader}>
                <h2 style={styles.kartBaslik}>🏢 İşletme Bilgileri</h2>
                <button style={styles.duzenleBtn} onClick={() => setIsletmeDuzenle(!isletmeDuzenle)}>
                  {isletmeDuzenle ? "İptal" : "✏️ Düzenle"}
                </button>
              </div>
              {isletmeDuzenle ? (
                <div>
                  <Alan label="İşletme Adı">
                    <input style={styles.input} value={isletmeForm.isletme_adi} onChange={e => setIsletmeForm(f => ({ ...f, isletme_adi: e.target.value }))} />
                  </Alan>
                  <Alan label="Vergi Dairesi">
                    <input style={styles.input} value={isletmeForm.vergi_dairesi} onChange={e => setIsletmeForm(f => ({ ...f, vergi_dairesi: e.target.value }))} />
                  </Alan>
                  <button style={styles.kaydetBtn} onClick={isletmeKaydet}>Kaydet</button>
                </div>
              ) : (
                <div>
                  <BilgiSatir label="İşletme Adı" deger={profil?.musteri?.isletme_adi} />
                  <BilgiSatir label="Vergi Dairesi" deger={profil?.musteri?.vergi_dairesi} />
                  <BilgiSatir label="Vergi Numarası" deger={profil?.musteri?.vergi_no} />
                </div>
              )}
            </div>
          )}

          {/* ADRESLER */}
          {aktifSekme === "adresler" && (
            <div style={styles.kart}>
              <div style={styles.kartHeader}>
                <h2 style={styles.kartBaslik}>📍 Adreslerim</h2>
                <button style={styles.ekleBtn} onClick={() => { setAdresModal(true); setDuzenleAdresId(null); setAdresForm({ il: "", ilce: "", acik_adres: "", teslimat_notu: "", varsayilan_mi: false }); }}>
                  + Adres Ekle
                </button>
              </div>
              {profil?.adresler?.length === 0 ? (
                <div style={styles.bos}>Kayıtlı adres yok</div>
              ) : (
                profil?.adresler?.map(a => (
                  <div key={a.adres_id} style={styles.adresKart}>
                    <div style={styles.adresIcerik}>
                      <div style={styles.adresBaslik}>
                        {a.varsayilan_mi && <span style={styles.varsayilanBadge}>⭐ Varsayılan</span>}
                        <span style={styles.adresSehir}>{a.il} / {a.ilce}</span>
                      </div>
                      <div style={styles.adresDetay}>{a.acik_adres}</div>
                      {a.teslimat_notu && <div style={styles.adresNot}>📝 {a.teslimat_notu}</div>}
                    </div>
                    <div style={styles.adresBtnler}>
                      <button style={styles.adresDuzenleBtn} onClick={() => {
                        setDuzenleAdresId(a.adres_id);
                        setAdresForm({ il: a.il, ilce: a.ilce, acik_adres: a.acik_adres, teslimat_notu: a.teslimat_notu, varsayilan_mi: a.varsayilan_mi });
                        setAdresModal(true);
                      }}>✏️</button>
                      <button style={styles.adresSilBtn} onClick={() => adresSil(a.adres_id)}>🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ŞİFRE DEĞİŞTİR */}
          {aktifSekme === "sifre" && (
            <div style={styles.kart}>
              <h2 style={styles.kartBaslik}>🔒 Şifre Değiştir</h2>
              <Alan label="Mevcut Şifre">
                <input style={styles.input} type="password" value={sifreForm.mevcut_sifre} onChange={e => setSifreForm(f => ({ ...f, mevcut_sifre: e.target.value }))} />
              </Alan>
              <Alan label="Yeni Şifre">
                <input style={styles.input} type="password" value={sifreForm.yeni_sifre} onChange={e => setSifreForm(f => ({ ...f, yeni_sifre: e.target.value }))} />
              </Alan>
              <Alan label="Yeni Şifre Tekrar">
                <input style={styles.input} type="password" value={sifreForm.yeni_sifre_tekrar} onChange={e => setSifreForm(f => ({ ...f, yeni_sifre_tekrar: e.target.value }))} />
              </Alan>
              <button style={styles.kaydetBtn} onClick={sifreKaydet}>Şifreyi Güncelle</button>
            </div>
          )}

          {/* SİPARİŞLERİM */}
          {aktifSekme === "siparislerim" && (
            <SiparislerimSekmesi musteriId={kullanici.musteri_id} />
          )}


          {/* CARİ HESAP */}
          {aktifSekme === "cari" && (
            <CariSekmesi musteri={profil?.musteri} kullaniciId={kullanici.kullanici_id} />
          )}

          {/* FATURALARIM */}
          {aktifSekme === "faturalarim" && (
            <FaturalarSekmesi musteriId={kullanici.musteri_id} />
          )}
        </div>
      </div>

      {/* ADRES MODAL */}
      {adresModal && (
        <div style={styles.modalOverlay} onClick={() => setAdresModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalBaslik}>{duzenleAdresId ? "Adresi Düzenle" : "Yeni Adres Ekle"}</h3>
              <button style={styles.modalKapat} onClick={() => setAdresModal(false)}>✕</button>
            </div>
            <Alan label="İl">
              <select style={styles.input} value={adresForm.il} onChange={e => setAdresForm(f => ({ ...f, il: e.target.value, ilce: "" }))}>
                <option value="">İl seçin</option>
                {ILLER.map(il => <option key={il} value={il}>{il}</option>)}
              </select>
            </Alan>
            <Alan label="İlçe">
              <select
                style={styles.input}
                value={adresForm.ilce}
                onChange={e => setAdresForm(f => ({ ...f, ilce: e.target.value }))}
              >
                <option value="">İlçe seçin</option>
                {(IL_ILCE[adresForm.il] || []).map(ilce => (
                  <option key={ilce} value={ilce}>{ilce}</option>
                ))}
              </select>
            </Alan>
            <Alan label="Açık Adres">
              <input style={styles.input} value={adresForm.acik_adres} onChange={e => setAdresForm(f => ({ ...f, acik_adres: e.target.value }))} placeholder="Cadde, sokak, bina no..." />
            </Alan>
            <Alan label="Teslimat Notu">
              <input style={styles.input} value={adresForm.teslimat_notu} onChange={e => setAdresForm(f => ({ ...f, teslimat_notu: e.target.value }))} placeholder="İsteğe bağlı" />
            </Alan>
            <label style={styles.checkLabel}>
              <input type="checkbox" checked={adresForm.varsayilan_mi} onChange={e => setAdresForm(f => ({ ...f, varsayilan_mi: e.target.checked }))} />
              Varsayılan adres olarak ayarla
            </label>
            <button style={styles.kaydetBtn} onClick={adresKaydet}>
              {duzenleAdresId ? "Güncelle" : "Ekle"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BilgiSatir({ label, deger }) {
  return (
    <div style={{ display: "flex", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ fontSize: 13, color: "#9ca3af", minWidth: 140 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{deger}</span>
    </div>
  );
}

function Alan({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function SiparislerimSekmesi({ musteriId }) {
  const [siparisler, setSiparisler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliSiparis, setSeciliSiparis] = useState(null);
  const [takipSiparis, setTakipSiparis] = useState(null);

  const DURUM_RENK = {
    "beklemede": { bg: "#fef9c3", color: "#854d0e", label: "Beklemede" },
    "onaylandi": { bg: "#dbeafe", color: "#1d4ed8", label: "Onaylandı" },
    "hazirlaniyor": { bg: "#f3e8ff", color: "#7c3aed", label: "Hazırlanıyor" },
    "dagitimda": { bg: "#ffedd5", color: "#c2410c", label: "Dağıtımda" },
    "teslim_edildi": { bg: "#f0fdf4", color: "#16a34a", label: "Teslim Edildi" },
    "iptal": { bg: "#fef2f2", color: "#dc2626", label: "İptal" },
  };

  useEffect(() => {
    siparisleriGetir();
  }, []);

  const siparisleriGetir = async () => {
    setYukleniyor(true);
    try {
      const res = await fetch(`http://localhost:8000/api/siparisler/musteri/${musteriId}`);
      setSiparisler(await res.json());
    } catch (e) { console.error(e); }
    finally { setYukleniyor(false); }
  };

  if (yukleniyor) return <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Yükleniyor...</div>;

  return (
    <div style={spStyles.kart}>
      <h2 style={spStyles.baslik}>📦 Siparişlerim</h2>

      {siparisler.length === 0 ? (
        <div style={spStyles.bos}>
          <div style={{ fontSize: 48 }}>📦</div>
          <p>Henüz sipariş vermediniz.</p>
        </div>
      ) : (
        <div>
          {siparisler.map(s => (
            <div key={s.siparis_id} style={spStyles.siparisKart}>
              <div style={spStyles.siparisUst}>
                <div>
                  <div style={spStyles.siparisNo}>{s.siparis_no}</div>
                  <div style={spStyles.siparisTarih}>{new Date(s.created_at).toLocaleDateString("tr-TR", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                  })}
                  </div>
                </div>
                <span style={{ ...spStyles.durumBadge, background: DURUM_RENK[s.durum]?.bg, color: DURUM_RENK[s.durum]?.color }}>
                  {DURUM_RENK[s.durum]?.label}
                </span>
              </div>

              <div style={spStyles.siparisBilgi}>
                <span>🕐 {s.slot_label}</span>
                <span>{s.odeme_yontemi === "nakit" ? "💵 Nakit" : s.odeme_yontemi === "cari" ? "📒 Cari" : "💳 Kart"}</span>
                {s.express_mi && <span style={spStyles.expressBadge}>⚡ Express</span>}
                <span style={spStyles.tutar}>{s.genel_toplam.toFixed(2)} ₺</span>
              </div>

              <button style={spStyles.detayBtn} onClick={() => setSeciliSiparis(seciliSiparis?.siparis_id === s.siparis_id ? null : s)}>
                {seciliSiparis?.siparis_id === s.siparis_id ? "▲ Kapat" : "▼ Ürünleri Gör"}
              </button>
              <button
                style={{ ...spStyles.detayBtn, background: "#dcfce7", color: "#16a34a", marginLeft: 8 }}
                onClick={() => { console.log("takip tıklandı", s); setTakipSiparis(s); }}
              >
                📍 Takip Et
              </button>

              {seciliSiparis?.siparis_id === s.siparis_id && (
                <div style={spStyles.urunListe}>
                  {s.urunler?.map((u, i) => (
                    <div key={i} style={spStyles.urunSatir}>
                      <span style={spStyles.urunAd}>{u.ad}</span>
                      <span style={spStyles.urunMiktar}>{u.miktar} {u.birim_turu}</span>
                      <span style={spStyles.urunFiyat}>{u.toplam?.toFixed(2)} ₺</span>
                    </div>
                  ))}
                  <div style={spStyles.toplamSatir}>
                    <span>Toplam</span>
                    <span style={{ fontWeight: 800, color: "#16a34a" }}>{s.genel_toplam.toFixed(2)} ₺</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}


      {/* SİPARİŞ TAKİP MODALI */}
      {takipSiparis && (
        <div style={spStyles.modalOverlay} onClick={() => setTakipSiparis(null)}>
          <div style={{ ...spStyles.modal, maxWidth: 560 }} onClick={e => e.stopPropagation()}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{takipSiparis.siparis_no}</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{takipSiparis.slot_label} • Tahmini Teslimat</div>
              </div>
              <button style={spStyles.modalKapat} onClick={() => setTakipSiparis(null)}>✕</button>
            </div>

            {(() => {
              const adimlar = [
                { key: "beklemede", label: "Beklemede", icon: "🕐" },
                { key: "onaylandi", label: "Onaylandı", icon: "✅" },
                { key: "hazirlaniyor", label: "Hazırlanıyor", icon: "📦" },
                { key: "dagitimda", label: "Dağıtımda", icon: "🚚" },
                { key: "teslim_edildi", label: "Teslim Edildi", icon: "🎉" },
              ];
              const aktifIndex = adimlar.findIndex(a => a.key === takipSiparis.durum);
              return (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {adimlar.map((adim, i) => (
                      <div key={adim.key} style={{ display: "flex", alignItems: "center", flex: i < adimlar.length - 1 ? 1 : 0 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 60 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 20,
                            background: i <= aktifIndex ? "#16a34a" : "#f3f4f6",
                            border: i === aktifIndex ? "3px solid #15803d" : "3px solid transparent",
                            boxShadow: i === aktifIndex ? "0 0 0 4px #dcfce7" : "none",
                          }}>
                            {i <= aktifIndex ? adim.icon : "○"}
                          </div>
                          <div style={{ fontSize: 10, color: i <= aktifIndex ? "#16a34a" : "#9ca3af", fontWeight: i === aktifIndex ? 700 : 500, marginTop: 6, textAlign: "center" }}>
                            {adim.label}
                          </div>
                        </div>
                        {i < adimlar.length - 1 && (
                          <div style={{ flex: 1, height: 3, background: i < aktifIndex ? "#16a34a" : "#e5e7eb", margin: "0 4px", marginBottom: 20, borderRadius: 2 }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div style={{ background: "#f9fafb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>🕐 Teslimat Saati</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{takipSiparis.slot_label}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>💳 Ödeme</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{takipSiparis.odeme_yontemi === "nakit" ? "Kapıda Nakit" : takipSiparis.odeme_yontemi === "cari" ? "Cari Hesap" : "Online Kart"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>💰 Toplam</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{takipSiparis.genel_toplam?.toFixed(2)} ₺</span>
              </div>
              {takipSiparis.express_mi && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>⚡ Express</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>Evet</span>
                </div>
              )}
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", marginBottom: 8 }}>📦 Sipariş İçeriği</div>
            <div style={{ background: "#f9fafb", borderRadius: 12, padding: 12 }}>
              {takipSiparis.urunler?.map((u, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < takipSiparis.urunler.length - 1 ? "1px solid #e5e7eb" : "none" }}>
                  <span style={{ fontSize: 13, color: "#374151" }}>{u.ad}</span>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>{u.miktar} {u.birim_turu}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{u.toplam?.toFixed(2)} ₺</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  );

}

function CariSekmesi({ musteri, kullaniciId }) {
  const [islemler, setIslemler] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [talepGonderildi, setTalepGonderildi] = useState(false);
  const [talepYukleniyor, setTalepYukleniyor] = useState(false);
  const [hata, setHata] = useState(null);

  useEffect(() => {
    if (musteri?.cari_acik_mi) islemleriGetir();
  }, [musteri]);

  const islemleriGetir = async () => {
    setYukleniyor(true);
    try {
      const res = await fetch(`http://localhost:8000/api/cari/${musteri.musteri_id}/islemler`);
      setIslemler(await res.json());
    } catch (e) { console.error(e); }
    finally { setYukleniyor(false); }
  };

  const talepGonder = async () => {
    setTalepYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch("http://localhost:8000/api/cari/talep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musteri_id: musteri.musteri_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setTalepGonderildi(true);
    } catch (e) { setHata(e.message || "Hata oluştu"); }
    finally { setTalepYukleniyor(false); }
  };

  if (!musteri?.cari_acik_mi) {
    return (
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>💳</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Cari Hesap Aktif Değil</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
          Cari hesap ile siparişlerinizin bedelini sonradan ödeyebilirsiniz. Talep gönderin, yetkilimiz en kısa sürede değerlendirecektir.
        </div>
        {talepGonderildi ? (
          <div style={{ padding: "12px 20px", background: "#f0fdf4", color: "#16a34a", borderRadius: 10, fontWeight: 600, fontSize: 14 }}>
            ✅ Talebiniz iletildi, en kısa sürede değerlendirilecektir.
          </div>
        ) : (
          <>
            {hata && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{hata}</div>}
            <button
              onClick={talepGonder}
              disabled={talepYukleniyor}
              style={{ padding: "12px 28px", borderRadius: 10, background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}
            >
              {talepYukleniyor ? "Gönderiliyor..." : "Cari Hesap Talep Et"}
            </button>
          </>
        )}
      </div>
    );
  }

  const limit = islemler?.cari_limit ?? musteri.cari_limit ?? 0;
  const bakiye = islemler?.mevcut_bakiye ?? musteri.mevcut_bakiye ?? 0;
  const kalan = islemler?.kalan_limit ?? (limit - bakiye);
  const doluluk = limit > 0 ? (bakiye / limit) * 100 : 0;

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 20 }}>💳 Cari Hesap</h2>

      {/* ÖZET KARTLAR */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Cari Limit", deger: `${limit.toLocaleString("tr-TR")} ₺`, renk: "#111827" },
          { label: "Ödenecek Bakiye", deger: `${bakiye.toLocaleString("tr-TR")} ₺`, renk: "#dc2626" },
          { label: "Kalan Limit", deger: `${kalan.toLocaleString("tr-TR")} ₺`, renk: "#16a34a" },
        ].map(k => (
          <div key={k.label} style={{ background: "#f9fafb", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.renk }}>{k.deger}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* KULLANIM BARRI */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
          <span>Limit Kullanımı</span>
          <span>%{doluluk.toFixed(0)}</span>
        </div>
        <div style={{ height: 8, background: "#e5e7eb", borderRadius: 4 }}>
          <div style={{ height: 8, borderRadius: 4, width: `${Math.min(doluluk, 100)}%`, background: doluluk > 80 ? "#dc2626" : doluluk > 50 ? "#f59e0b" : "#16a34a" }} />
        </div>
      </div>

      {/* İŞLEM GEÇMİŞİ */}
      <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>İşlem Geçmişi</div>
      {yukleniyor ? (
        <div style={{ textAlign: "center", padding: 24, color: "#9ca3af" }}>Yükleniyor...</div>
      ) : !islemler?.islemler?.length ? (
        <div style={{ textAlign: "center", padding: 24, color: "#9ca3af" }}>Henüz işlem yok</div>
      ) : (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          {islemler.islemler.map((i, idx) => (
            <div key={i.islem_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: idx < islemler.islemler.length - 1 ? "1px solid #f3f4f6" : "none" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{i.tur === "odeme" ? "Ödeme yapıldı" : i.aciklama}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  {new Date(i.created_at).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: i.tur === "borc" ? "#dc2626" : "#16a34a" }}>
                  {i.tur === "borc" ? "+" : "-"}{i.tutar.toLocaleString("tr-TR")} ₺
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>Bakiye: {i.bakiye_sonrasi.toLocaleString("tr-TR")} ₺</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  .co-name{font-size:22px;font-weight:800;color:#14532d}.co-sub{font-size:12px;color:#6b7280;margin-top:3px}
  .fi{text-align:right}.fi-no{font-size:20px;font-weight:700;color:#14532d}.fi-sub{font-size:12px;color:#6b7280;margin-top:3px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
  .kart{background:#f9fafb;border-radius:8px;padding:14px}
  .kart-baslik{font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
  .kart-satir{font-size:13px;color:#374151;margin-bottom:3px}.kart-bold{font-weight:700;color:#111;font-size:14px}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  thead th{background:#14532d;color:#fff;padding:10px 14px;font-size:12px;font-weight:600;text-align:left}
  .totals{display:flex;justify-content:flex-end;margin-bottom:28px}
  .totals-inner{width:260px}
  .ts{display:flex;justify-content:space-between;padding:7px 0;font-size:13px;border-bottom:1px solid #f3f4f6;color:#374151}
  .ts-label{color:#6b7280}.ts-son{border-top:2px solid #14532d;padding:10px 0;font-size:16px;font-weight:800;color:#14532d;border-bottom:none}
  .footer{margin-top:32px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center}
  .btn{display:block;margin:0 auto 24px;padding:11px 32px;background:#14532d;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer}
  @media print{.btn{display:none}body{padding:16px}}
</style></head><body>
<div class="hdr">
  <div><div class="co-name">🥬 Freshalburda</div><div class="co-sub">Taze Sebze & Meyve Tedariki | freshalburda.com</div>
  <div class="co-sub" style="margin-top:6px">Sebze Hali Cad. No:1 — İstanbul</div>
  <div class="co-sub">Tel: 0212 000 00 00 | info@freshalburda.com</div></div>
  <div class="fi"><div class="fi-no">FATURA</div><div class="fi-no" style="font-size:15px;margin-top:4px">${fatura.fatura_no}</div>
  <div class="fi-sub">Tarih: ${tarih}</div><div class="fi-sub">Sipariş: ${fatura.siparis_no}</div>
  <div class="fi-sub">Ödeme: ${odeme}</div></div>
</div>
<div class="grid">
  <div class="kart"><div class="kart-baslik">Satıcı</div>
    <div class="kart-satir kart-bold">Freshalburda Tarım Ürünleri</div>
    <div class="kart-satir">Vergi No: 1234567890</div><div class="kart-satir">Vergi Dairesi: Merkez VD</div></div>
  <div class="kart"><div class="kart-baslik">Alıcı</div>
    <div class="kart-satir kart-bold">${fatura.musteri_bilgi?.isletme_adi || "—"}</div>
    <div class="kart-satir">Vergi No: ${fatura.musteri_bilgi?.vergi_no || "—"}</div>
    ${fatura.musteri_bilgi?.vergi_dairesi ? `<div class="kart-satir">VD: ${fatura.musteri_bilgi.vergi_dairesi}</div>` : ""}
    ${fatura.musteri_bilgi?.telefon ? `<div class="kart-satir">Tel: ${fatura.musteri_bilgi.telefon}</div>` : ""}
    ${fatura.musteri_bilgi?.adres ? `<div class="kart-satir">${fatura.musteri_bilgi.adres}</div>` : ""}
    ${fatura.musteri_bilgi?.sehir ? `<div class="kart-satir">${fatura.musteri_bilgi.sehir}</div>` : ""}
  </div>
</div>
<table>
  <thead><tr>
    <th style="width:44%">Ürün / Hizmet</th>
    <th style="width:20%;text-align:center">Miktar</th>
    <th style="width:18%;text-align:right">Birim Fiyat</th>
    <th style="width:18%;text-align:right">Tutar</th>
  </tr></thead>
  <tbody>${kalemlerHTML}${expressRow}</tbody>
</table>
<div class="totals"><div class="totals-inner">
  <div class="ts"><span class="ts-label">KDV Matrahı</span><span>${(fatura.kdv_matrah || 0).toFixed(2)} ₺</span></div>
  <div class="ts"><span class="ts-label">KDV (%${fatura.kdv_orani})</span><span>${(fatura.kdv_tutari || 0).toFixed(2)} ₺</span></div>
  <div class="ts ts-son"><span>GENEL TOPLAM</span><span>${(fatura.genel_toplam || 0).toFixed(2)} ₺</span></div>
</div></div>
<button class="btn" onclick="window.print()">🖨️ Yazdır / PDF Kaydet</button>
<div class="footer">Bu belge Freshalburda Tarım Ürünleri tarafından düzenlenmiştir. • E-arşiv entegrasyonuna hazır altyapı.</div>
</body></html>`);
  w.document.close();
}

function FaturalarSekmesi({ musteriId }) {
  const [faturalar, setFaturalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    if (!musteriId) return;
    setYukleniyor(true);
    fetch(`http://localhost:8000/api/faturalar/musteri/${musteriId}`)
      .then(r => r.json())
      .then(setFaturalar)
      .catch(console.error)
      .finally(() => setYukleniyor(false));
  }, [musteriId]);

  if (yukleniyor) return <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Yükleniyor...</div>;

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 20 }}>🧾 Faturalarım</h2>

      {faturalar.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
          <div>Henüz fatura bulunmuyor</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {faturalar.map(f => (
            <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#f9fafb" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#14532d", fontSize: 14 }}>{f.fatura_no}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                  {new Date(f.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })} • {f.siparis_no}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, color: "#16a34a", fontSize: 15 }}>{(f.genel_toplam || 0).toFixed(2)} ₺</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>KDV dahil</div>
                </div>
                <button
                  style={{ padding: "7px 14px", borderRadius: 8, background: "#14532d", color: "#fff", border: "none", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                  onClick={() => faturaYazdir(f)}
                >
                  🖨️ Görüntüle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const spStyles = {
  kart: { background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  baslik: { fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 20 },
  bos: { textAlign: "center", padding: 40, color: "#9ca3af" },
  siparisKart: { border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12 },
  siparisUst: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  siparisNo: { fontSize: 15, fontWeight: 700, color: "#111827" },
  siparisTarih: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  durumBadge: { padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 },
  siparisBilgi: { display: "flex", gap: 12, fontSize: 13, color: "#6b7280", marginBottom: 10, flexWrap: "wrap" },
  expressBadge: { background: "#fef9c3", color: "#854d0e", fontWeight: 700, fontSize: 12, padding: "1px 6px", borderRadius: 6 },
  tutar: { fontWeight: 700, color: "#16a34a" },
  detayBtn: { background: "#f3f4f6", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600, color: "#374151" },
  urunListe: { marginTop: 12, borderTop: "1px solid #f3f4f6", paddingTop: 12 },
  urunSatir: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f9fafb" },
  urunAd: { fontSize: 13, fontWeight: 600, color: "#111827", flex: 1 },
  urunMiktar: { fontSize: 13, color: "#6b7280", minWidth: 80, textAlign: "center" },
  urunFiyat: { fontSize: 13, fontWeight: 700, color: "#16a34a", minWidth: 80, textAlign: "right" },
  toplamSatir: { display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: 15, fontWeight: 700, color: "#111827" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" },
  modalKapat: { width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", fontWeight: 700 },
};

const styles = {
  page: { minHeight: "100vh", background: "#f9fafb", fontFamily: "'Segoe UI', sans-serif" },
  header: { background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  geriBtn: { padding: "8px 16px", borderRadius: 8, background: "#f3f4f6", border: "none", fontSize: 14, cursor: "pointer", fontWeight: 600 },
  baslik: { fontSize: 20, fontWeight: 700, color: "#14532d", margin: 0 },
  bildirim: { margin: "16px 24px", padding: "12px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600 },
  icerik: { maxWidth: 1100, margin: "24px auto", padding: "0 24px", display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 },
  sol: {},
  avatarWrap: { background: "#fff", borderRadius: 16, padding: 24, textAlign: "center", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  avatar: { width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #16a34a, #f59e0b)", color: "#fff", fontSize: 24, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" },
  avatarAd: { fontSize: 16, fontWeight: 700, color: "#111827" },
  avatarIsletme: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  onayBadge: { display: "inline-block", marginTop: 10, padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600 },
  menu: { background: "#fff", borderRadius: 16, padding: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  menuBtn: { display: "block", width: "100%", padding: "12px 16px", borderRadius: 10, background: "none", border: "none", fontSize: 14, cursor: "pointer", textAlign: "left", color: "#374151", fontWeight: 500 },
  menuBtnAktif: { background: "#f0fdf4", color: "#16a34a", fontWeight: 700 },
  sag: {},
  kart: { background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  kartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  kartBaslik: { fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 },
  duzenleBtn: { padding: "6px 16px", borderRadius: 8, background: "#f3f4f6", border: "none", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  ekleBtn: { padding: "6px 16px", borderRadius: 8, background: "#16a34a", color: "#fff", border: "none", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box" },
  kaydetBtn: { marginTop: 8, padding: "10px 24px", borderRadius: 8, background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" },
  adresKart: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: 16, borderRadius: 10, background: "#f9fafb", marginBottom: 12 },
  adresIcerik: { flex: 1 },
  adresBaslik: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 },
  varsayilanBadge: { fontSize: 11, background: "#fef9c3", color: "#854d0e", padding: "2px 8px", borderRadius: 8, fontWeight: 600 },
  adresSehir: { fontSize: 14, fontWeight: 700, color: "#111827" },
  adresDetay: { fontSize: 13, color: "#6b7280" },
  adresNot: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
  adresBtnler: { display: "flex", gap: 8 },
  adresDuzenleBtn: { background: "#f3f4f6", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" },
  adresSilBtn: { background: "#fee2e2", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" },
  bos: { textAlign: "center", padding: 40, color: "#9ca3af" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 480 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalBaslik: { fontSize: 18, fontWeight: 700, margin: 0 },
  modalKapat: { width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6", border: "none", cursor: "pointer", fontWeight: 700 },
  checkLabel: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 16, cursor: "pointer" },
  yukleniyor: { textAlign: "center", padding: 60, color: "#9ca3af" },
};