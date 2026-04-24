import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

const ILLER = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya",
  "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir",
  "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis",
  "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum",
  "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan",
  "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane",
  "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir",
  "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu",
  "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis",
  "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin",
  "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu",
  "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop",
  "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon",
  "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak",
];


const IL_ILCE = {
  "Adana": ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"],
  "Adıyaman": ["Adıyaman", "Besni", "Çelikhan", "Gerger", "Gölbaşı", "Kahta", "Samsat", "Sincik", "Tut"],
  "Afyonkarahisar": ["Afyonkarahisar", "Başmakçı", "Bayat", "Bolvadin", "Çay", "Çobanlar", "Dazkırı", "Dinar", "Emirdağ", "Evciler", "Hocalar", "İhsaniye", "İscehisar", "Kızılören", "Sandıklı", "Sinanpaşa", "Sultandağı", "Şuhut"],
  "Ağrı": ["Ağrı", "Diyadin", "Doğubayazıt", "Eleşkirt", "Hamur", "Patnos", "Taşlıçay", "Tutak"],
  "Amasya": ["Amasya", "Göynücek", "Gümüşhacıköy", "Hamamözü", "Merzifon", "Suluova", "Taşova"],
  "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kahramankazan", "Kalecik", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
  "Antalya": ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"],
  "Ardahan": ["Ardahan", "Çıldır", "Damal", "Göle", "Hanak", "Posof"],
  "Artvin": ["Ardanuç", "Arhavi", "Artvin", "Borçka", "Hopa", "Kemalpaşa", "Murgul", "Şavşat", "Yusufeli"],
  "Aydın": ["Bozdoğan", "Buharkent", "Çine", "Didim", "Efeler", "Germencik", "İncirliova", "Karacasu", "Karpuzlu", "Koçarlı", "Köşk", "Kuşadası", "Kuyucak", "Nazilli", "Söke", "Sultanhisar", "Yenipazar"],
  "Balıkesir": ["Altıeylül", "Ayvalık", "Balya", "Bandırma", "Bigadiç", "Burhaniye", "Dursunbey", "Edremit", "Erdek", "Gömeç", "Gönen", "Havran", "İvrindi", "Karesi", "Kepsut", "Manyas", "Marmara", "Savaştepe", "Sındırgı", "Susurluk"],
  "Bartın": ["Amasra", "Bartın", "Kurucaşile", "Ulus"],
  "Batman": ["Batman", "Beşiri", "Gercüş", "Hasankeyf", "Kozluk", "Sason"],
  "Bayburt": ["Aydıntepe", "Bayburt", "Demirözü"],
  "Bilecik": ["Bilecik", "Bozöyük", "Gölpazarı", "İnhisar", "Osmaneli", "Pazaryeri", "Söğüt", "Yenipazar"],
  "Bingöl": ["Adaklı", "Bingöl", "Genç", "Karlıova", "Kiğı", "Solhan", "Yayladere", "Yedisu"],
  "Bitlis": ["Adilcevaz", "Ahlat", "Bitlis", "Güroymak", "Hizan", "Mutki", "Tatvan"],
  "Bolu": ["Bolu", "Dörtdivan", "Gerede", "Göynük", "Kıbrıscık", "Mengen", "Mudurnu", "Seben", "Yeniçağa"],
  "Burdur": ["Ağlasun", "Altınyayla", "Bucak", "Burdur", "Çavdır", "Çeltikçi", "Gölhisar", "Karamanlı", "Kemer", "Tefenni", "Yeşilova"],
  "Bursa": ["Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey", "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli", "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"],
  "Çanakkale": ["Ayvacık", "Bayramiç", "Biga", "Bozcaada", "Çan", "Çanakkale", "Eceabat", "Ezine", "Gelibolu", "Gökçeada", "Lapseki", "Merkez", "Yenice"],
  "Çankırı": ["Atkaracalar", "Bayramören", "Çankırı", "Eldivan", "Ilgaz", "Kızılırmak", "Korgun", "Kurşunlu", "Orta", "Şabanözü", "Yapraklı"],
  "Çorum": ["Alaca", "Bayat", "Boğazkale", "Dodurga", "İskilip", "Kargı", "Laçin", "Mecitözü", "Merkez", "Oğuzlar", "Ortaköy", "Osmancık", "Sungurlu", "Uğurludağ"],
  "Denizli": ["Acıpayam", "Babadağ", "Baklan", "Bekilli", "Beyağaç", "Bozkurt", "Buldan", "Çal", "Çameli", "Çardak", "Çivril", "Güney", "Honaz", "Kale", "Merkezefendi", "Pamukkale", "Sarayköy", "Serinhisar", "Tavas"],
  "Diyarbakır": ["Bağlar", "Bismil", "Çermik", "Çınar", "Çüngüş", "Dicle", "Eğil", "Ergani", "Hani", "Hazro", "Kayapınar", "Kocaköy", "Kulp", "Lice", "Silvan", "Sur", "Yenişehir"],
  "Düzce": ["Akçakoca", "Cumayeri", "Çilimli", "Düzce", "Gölköy", "Gölyaka", "Kaynaşlı", "Yığılca"],
  "Edirne": ["Edirne", "Enez", "Havsa", "İpsala", "Keşan", "Lalapaşa", "Meriç", "Süloğlu", "Uzunköprü"],
  "Elazığ": ["Ağın", "Alacakaya", "Arıcak", "Baskil", "Elazığ", "Karakoçan", "Keban", "Kovancılar", "Maden", "Palu", "Sivrice"],
  "Erzincan": ["Çayırlı", "Erzincan", "İliç", "Kemah", "Kemaliye", "Otlukbeli", "Refahiye", "Tercan", "Üzümlü"],
  "Erzurum": ["Aşkale", "Aziziye", "Çat", "Hınıs", "Horasan", "İspir", "Karaçoban", "Karayazı", "Köprüköy", "Narman", "Oltu", "Olur", "Palandöken", "Pasinler", "Pazaryolu", "Şenkaya", "Tekman", "Tortum", "Uzundere", "Yakutiye"],
  "Eskişehir": ["Alpu", "Beylikova", "Çifteler", "Günyüzü", "Han", "İnönü", "Mahmudiye", "Mihalgazi", "Mihalıççık", "Odunpazarı", "Sarıcakaya", "Sayıt", "Sivrihisar", "Tepebaşı"],
  "Gaziantep": ["Araban", "İslahiye", "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Şahinbey", "Şehitkamil", "Yavuzeli"],
  "Giresun": ["Alucra", "Bulancak", "Çamoluk", "Çanakçı", "Dereli", "Doğankent", "Espiye", "Eynesil", "Giresun", "Görele", "Güce", "Keşap", "Piraziz", "Şebinkarahisar", "Tirebolu", "Yağlıdere"],
  "Gümüşhane": ["Gümüşhane", "Kelkit", "Köse", "Kürtün", "Şiran", "Torul"],
  "Hakkari": ["Çukurca", "Hakkari", "Şemdinli", "Yüksekova"],
  "Hatay": ["Altınözü", "Antakya", "Arsuz", "Belen", "Defne", "Dörtyol", "Erzin", "Hassa", "İskenderun", "Kırıkhan", "Kumlu", "Mandacı", "Payas", "Reyhanlı", "Samandağ", "Yayladağı"],
  "Iğdır": ["Aralık", "Iğdır", "Karakoyunlu", "Tuzluca"],
  "Isparta": ["Aksu", "Atabey", "Eğirdir", "Gelendost", "Gönen", "Keçiborlu", "Merkez", "Senirkent", "Sütçüler", "Şarkikaraağaç", "Uluborlu", "Yalvaç", "Yenişarbademli"],
  "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
  "İzmir": ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"],
  "Kahramanmaraş": ["Afşin", "Andırın", "Çağlayancerit", "Dulkadiroğlu", "Ekinözü", "Elbistan", "Göksun", "Nurhak", "Onikişubat", "Pazarcık", "Türkoğlu"],
  "Karabük": ["Eflani", "Eskipazar", "Karabük", "Ovacık", "Safranbolu", "Yenice"],
  "Karaman": ["Ayrancı", "Başyayla", "Ermenek", "Karaman", "Kazımkarabekir", "Sarıveliler"],
  "Kars": ["Akyaka", "Arpaçay", "Digor", "Kağızman", "Kars", "Sarıkamış", "Selim", "Susuz"],
  "Kastamonu": ["Abana", "Ağlı", "Araç", "Azdavay", "Bozkurt", "Cide", "Çatalzeytin", "Daday", "Devrekani", "Doğanyurt", "Hanönü", "İhsangazi", "İnebolu", "Kastamonu", "Küre", "Pınarbaşı", "Seydiler", "Şenpazar", "Taşköprü", "Tosya"],
  "Kayseri": ["Akkışla", "Bünyan", "Develi", "Felahiye", "Hacılar", "İncesu", "Kocasinan", "Melikgazi", "Özvatan", "Pınarbaşı", "Sarıoğlan", "Sarız", "Talas", "Tomarza", "Yahyalı", "Yeşilhisar"],
  "Kilis": ["Elbeyli", "Kilis", "Musabeyli", "Polateli"],
  "Kırıkkale": ["Bahşılı", "Balışeyh", "Çelebi", "Delice", "Karakeçili", "Keskin", "Kırıkkale", "Sulakyurt", "Yahşihan"],
  "Kırklareli": ["Babaeski", "Demirköy", "Kırklareli", "Kofçaz", "Lüleburgaz", "Pehlivanköy", "Pınarhisar", "Vize"],
  "Kırşehir": ["Akçakent", "Akpınar", "Boztepe", "Çiçekdağı", "Kaman", "Kırşehir", "Mucur"],
  "Kocaeli": ["Başiskele", "Çayırova", "Darıca", "Derince", "Dilovası", "Gebze", "Gölcük", "İzmit", "Kandıra", "Karamürsel", "Kartepe", "Körfez"],
  "Konya": ["Ahırlı", "Akören", "Akşehir", "Altınekin", "Beyşehir", "Bozkır", "Cihanbeyli", "Çeltik", "Çumra", "Derbent", "Derebucak", "Doğanhisar", "Emirgazi", "Ereğli", "Güneysınır", "Hadim", "Halkapınar", "Hüyük", "Ilgın", "Kadınhanı", "Karapınar", "Karatay", "Kulu", "Meram", "Sarayönü", "Selçuklu", "Seydişehir", "Taşkent", "Tuzlukçu", "Yalıhüyük", "Yunak"],
  "Kütahya": ["Altıntaş", "Aslanapa", "Çavdarhisar", "Domaniç", "Dumlupınar", "Emet", "Gediz", "Hisarcık", "Kütahya", "Pazarlar", "Şaphane", "Simav", "Tavşanlı"],
  "Malatya": ["Akçadağ", "Arapgir", "Arguvan", "Battalgazi", "Darende", "Doğanşehir", "Doğanyol", "Hekimhan", "Kale", "Kuluncak", "Pütürge", "Yazıhan", "Yeşilyurt"],
  "Manisa": ["Ahmetli", "Akhisar", "Alaşehir", "Demirci", "Gölmarmara", "Gördes", "Kırkağaç", "Köprübaşı", "Kula", "Merkez", "Salihli", "Sarıgöl", "Saruhanlı", "Selendi", "Soma", "Şehzadeler", "Turgutlu", "Yunusemre"],
  "Mardin": ["Artuklu", "Dargeçit", "Derik", "Kızıltepe", "Mazıdağı", "Midyat", "Nusaybin", "Ömerli", "Savur", "Yeşilli"],
  "Mersin": ["Akdeniz", "Anamur", "Aydıncık", "Bozyazı", "Çamlıyayla", "Erdemli", "Gülnar", "Mezitli", "Mut", "Silifke", "Tarsus", "Toroslar", "Yenişehir"],
  "Muğla": ["Bodrum", "Dalaman", "Datça", "Fethiye", "Kavaklıdere", "Köyceğiz", "Marmaris", "Menteşe", "Milas", "Ortaca", "Seydikemer", "Ula", "Yatağan"],
  "Muş": ["Bulanık", "Hasköy", "Korkut", "Malazgirt", "Merkez", "Varto"],
  "Nevşehir": ["Acıgöl", "Avanos", "Derinkuyu", "Gülşehir", "Hacıbektaş", "Kozaklı", "Merkez", "Ürgüp"],
  "Niğde": ["Altunhisar", "Bor", "Çamardı", "Çiftlik", "Merkez", "Ulukışla"],
  "Ordu": ["Akkuş", "Altınordu", "Aybastı", "Çamaş", "Çatalpınar", "Çaybaşı", "Fatsa", "Gölköy", "Gülyalı", "Gürgentepe", "İkizce", "Kabadüz", "Kabataş", "Korgan", "Kumru", "Mesudiye", "Perşembe", "Ulubey", "Ünye"],
  "Osmaniye": ["Bahçe", "Düziçi", "Hasanbeyli", "Kadirli", "Merkez", "Sumbas", "Toprakkale"],
  "Rize": ["Ardeşen", "Çamlıhemşin", "Çayeli", "Derepazarı", "Fındıklı", "Güneysu", "Hemşin", "İkizdere", "İyidere", "Kalkandere", "Merkez", "Pazar"],
  "Sakarya": ["Adapazarı", "Akyazı", "Arifiye", "Erenler", "Ferizli", "Geyve", "Hendek", "Karapürçek", "Karasu", "Kaynarca", "Kocaali", "Mithatpaşa", "Pamukova", "Sapanca", "Serdivan", "Söğütlü", "Taraklı"],
  "Samsun": ["Alaçam", "Asarcık", "Atakum", "Ayvacık", "Bafra", "Canik", "Çarşamba", "Havza", "İlkadım", "Kavak", "Ladik", "Ondokuzmayıs", "Salıpazarı", "Tekkeköy", "Terme", "Vezirköprü", "Yakakent"],
  "Siirt": ["Baykan", "Eruh", "Kurtalan", "Merkez", "Pervari", "Şirvan", "Tillo"],
  "Sinop": ["Ayancık", "Boyabat", "Dikmen", "Durağan", "Erfelek", "Gerze", "Merkez", "Saraydüzü", "Türkeli"],
  "Sivas": ["Akıncılar", "Altınyayla", "Divriği", "Doğanşar", "Gemerek", "Gölova", "Hafik", "İmranlı", "Kangal", "Koyulhisar", "Merkez", "Suşehri", "Şarkışla", "Ulaş", "Yıldızeli", "Zara"],
  "Şanlıurfa": ["Akçakale", "Birecik", "Bozova", "Ceylanpınar", "Eyyübiye", "Halfeti", "Haliliye", "Harran", "Hilvan", "Karaköprü", "Siverek", "Suruç", "Viranşehir"],
  "Şırnak": ["Beytüşşebap", "Cizre", "Güçlükonak", "İdil", "Merkez", "Silopi", "Uludere"],
  "Tekirdağ": ["Çerkezköy", "Çorlu", "Ergene", "Hayrabolu", "Kapaklı", "Malkara", "Marmaraereğlisi", "Muratlı", "Saray", "Süleymanpaşa", "Şarköy"],
  "Tokat": ["Almus", "Artova", "Başçiftlik", "Erbaa", "Merkez", "Niksar", "Pazar", "Reşadiye", "Sulusaray", "Turhal", "Yeşilyurt", "Zile"],
  "Trabzon": ["Akçaabat", "Araklı", "Arsin", "Beşikdüzü", "Çarşıbaşı", "Çaykara", "Dernekpazarı", "Düzköy", "Hayrat", "Köprübaşı", "Maçka", "Of", "Ortahisar", "Sürmene", "Şalpazarı", "Tonya", "Vakfıkebir", "Yomra"],
  "Tunceli": ["Çemişgezek", "Hozat", "Mazgirt", "Merkez", "Nazimiye", "Ovacık", "Pertek", "Pülümür"],
  "Uşak": ["Banaz", "Eşme", "Karahallı", "Merkez", "Sivaslı", "Ulubey"],
  "Van": ["Bahçesaray", "Başkale", "Çaldıran", "Çatak", "Edremit", "Erciş", "Gevaş", "Gürpınar", "İpekyolu", "Merkez", "Muradiye", "Özalp", "Saray", "Tuşba"],
  "Yalova": ["Altınova", "Armutlu", "Çiftlikköy", "Çınarcık", "Merkez", "Termal"],
  "Yozgat": ["Akdağmadeni", "Aydıncık", "Boğazlıyan", "Çandır", "Çayıralan", "Çekerek", "Kadışehri", "Merkez", "Saraykent", "Sarıkaya", "Şefaatli", "Sorgun", "Yenifakılı", "Yerköy"],
  "Zonguldak": ["Alaplı", "Çaycuma", "Devrek", "Ereğli", "Gökçebey", "Kilimli", "Kozlu", "Merkez"],
};

export default function KayitEkrani({ onGirise }) {
  const [form, setForm] = useState({
    ad: "", soyad: "", telefon: "", eposta: "",
    sifre: "", sifre_tekrar: "",
    isletme_adi: "", vergi_dairesi: "", vergi_no: "",
    il: "", ilce: "", acik_adres: "", teslimat_notu: "",
    sozlesme_onaylandi: false,
    sehir_id: "",
  });
  const [sehirler, setSehirler] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/sehirler`)
      .then(r => r.json())
      .then(data => setSehirler(data.filter(s => s.aktif_mi)))
      .catch(() => {});
  }, []);

  const [hatalar, setHatalar] = useState({});
  const [yukleniyor, setYukleniyor] = useState(false);
  const [basarili, setBasarili] = useState(false);
  const [sunucuHata, setSunucuHata] = useState("");

  const guncelle = (alan, deger) => {
    setForm((f) => ({ ...f, [alan]: deger }));
    setHatalar((h) => ({ ...h, [alan]: "" }));
    setSunucuHata("");
  };

  const dogrula = () => {
    const h = {};
    if (!form.ad.trim()) h.ad = "Ad zorunludur";
    if (!form.soyad.trim()) h.soyad = "Soyad zorunludur";
    if (!form.telefon.trim()) h.telefon = "Telefon zorunludur";
    if (!form.telefon.trim()) h.telefon = "Telefon zorunludur";
    else if (!/^[0-9]{10,11}$/.test(form.telefon.replace(/\s/g, ""))) h.telefon = "Geçerli bir telefon numarası girin (10-11 hane)";
    if (!form.eposta.trim()) h.eposta = "E-posta zorunludur";
    if (form.sifre.length < 8) h.sifre = "En az 8 karakter olmalı";
    if (form.sifre !== form.sifre_tekrar) h.sifre_tekrar = "Şifreler eşleşmiyor";
    if (!form.isletme_adi.trim()) h.isletme_adi = "İşletme adı zorunludur";
    if (!form.vergi_dairesi.trim()) h.vergi_dairesi = "Vergi dairesi zorunludur";
    if (!form.vergi_no.trim()) h.vergi_no = "Vergi numarası zorunludur";
    if (!form.sehir_id) h.sehir_id = "Şehir seçiniz";
    if (!form.il) h.il = "İl seçiniz";
    if (!form.ilce.trim()) h.ilce = "İlçe zorunludur";
    if (!form.acik_adres.trim()) h.acik_adres = "Adres zorunludur";
    if (!form.sozlesme_onaylandi) h.sozlesme_onaylandi = "Sözleşmeyi onaylamalısınız";
    setHatalar(h);
    return Object.keys(h).length === 0;
  };

  const kayitOl = async () => {
    if (!dogrula()) return;
    setYukleniyor(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const mesaj = typeof data.detail === "string"
          ? data.detail
          : Array.isArray(data.detail)
            ? data.detail.map(e => e.msg).join(", ")
            : "Bir hata oluştu";
        throw new Error(mesaj);
      }
      setBasarili(true);
    } catch (e) {
      setSunucuHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  };

  if (basarili) {
    return (
      <div style={styles.page}>
        <div style={styles.kart}>
          <div style={styles.basariIcon}>✅</div>
          <h2 style={styles.basariBaslik}>Kayıt Tamamlandı!</h2>
          <p style={styles.basariAciklama}>
            Başvurunuz alındı. Admin ekibimiz hesabınızı inceleyip onaylayacak.
            Onay sonrasında e-posta ile bilgilendirileceksiniz.
          </p>
          <button style={styles.btnPrimary} onClick={onGirise}>
            Giriş Ekranına Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.kart}>
        <div style={styles.header}>
          <div style={styles.logo}>🥬</div>
          <h1 style={styles.baslik}>Freshalburda</h1>
          <p style={styles.altBaslik}>İşletme Kaydı</p>
        </div>

        {sunucuHata && <div style={styles.sunucuHata}>{sunucuHata}</div>}

        <Bolum baslik="Yetkili Kişi Bilgileri">
          <SatirIkili>
            <Alan label="Ad" hata={hatalar.ad}>
              <input style={gInput(hatalar.ad)} placeholder="Ahmet"
                value={form.ad} onChange={e => guncelle("ad", e.target.value)} />
            </Alan>
            <Alan label="Soyad" hata={hatalar.soyad}>
              <input style={gInput(hatalar.soyad)} placeholder="Yılmaz"
                value={form.soyad} onChange={e => guncelle("soyad", e.target.value)} />
            </Alan>
          </SatirIkili>
          <SatirIkili>
            <Alan label="Telefon" hata={hatalar.telefon}>
              <input style={gInput(hatalar.telefon)} placeholder="05001234567"
                value={form.telefon} onChange={e => guncelle("telefon", e.target.value)} />
            </Alan>
            <Alan label="E-posta" hata={hatalar.eposta}>
              <input style={gInput(hatalar.eposta)} placeholder="info@restoran.com" type="email"
                value={form.eposta} onChange={e => guncelle("eposta", e.target.value)} />
            </Alan>
          </SatirIkili>
          <SatirIkili>
            <Alan label="Şifre" hata={hatalar.sifre}>
              <input style={gInput(hatalar.sifre)} placeholder="En az 8 karakter" type="password"
                value={form.sifre} onChange={e => guncelle("sifre", e.target.value)} />
            </Alan>
            <Alan label="Şifre Tekrar" hata={hatalar.sifre_tekrar}>
              <input style={gInput(hatalar.sifre_tekrar)} placeholder="Şifrenizi tekrar girin" type="password"
                value={form.sifre_tekrar} onChange={e => guncelle("sifre_tekrar", e.target.value)} />
            </Alan>
          </SatirIkili>
        </Bolum>

        <Bolum baslik="İşletme Bilgileri">
          <Alan label="Hizmet Şehri" hata={hatalar.sehir_id}>
            <select style={gInput(hatalar.sehir_id)}
              value={form.sehir_id} onChange={e => guncelle("sehir_id", e.target.value)}>
              <option value="">Şehir seçin</option>
              {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
            </select>
          </Alan>
          <Alan label="İşletme Adı" hata={hatalar.isletme_adi}>
            <input style={gInput(hatalar.isletme_adi)} placeholder="Lezzet Restoran"
              value={form.isletme_adi} onChange={e => guncelle("isletme_adi", e.target.value)} />
          </Alan>
          <SatirIkili>
            <Alan label="Vergi Dairesi" hata={hatalar.vergi_dairesi}>
              <input style={gInput(hatalar.vergi_dairesi)} placeholder="Kadıköy VD"
                value={form.vergi_dairesi} onChange={e => guncelle("vergi_dairesi", e.target.value)} />
            </Alan>
            <Alan label="Vergi Numarası" hata={hatalar.vergi_no}>
              <input style={gInput(hatalar.vergi_no)} placeholder="1234567890"
                value={form.vergi_no} onChange={e => guncelle("vergi_no", e.target.value)} />
            </Alan>
          </SatirIkili>
        </Bolum>

        <Bolum baslik="Teslimat Adresi">
          <SatirIkili>
            <Alan label="İl" hata={hatalar.il}>
              <select style={gInput(hatalar.il)}
                value={form.il} onChange={e => guncelle("il", e.target.value)}>
                <option value="">İl seçin</option>
                {ILLER.map(il => <option key={il} value={il}>{il}</option>)}
              </select>
            </Alan>
            <Alan label="İlçe" hata={hatalar.ilce}>
              <select style={gInput(hatalar.ilce)}
                value={form.ilce} onChange={e => guncelle("ilce", e.target.value)}>
                <option value="">İlçe seçin</option>
                {(IL_ILCE[form.il] || []).map(ilce => (
                  <option key={ilce} value={ilce}>{ilce}</option>
                ))}
              </select>
            </Alan>
          </SatirIkili>
          <Alan label="Açık Adres" hata={hatalar.acik_adres}>
            <input style={gInput(hatalar.acik_adres)} placeholder="Cadde, sokak, bina no..."
              value={form.acik_adres} onChange={e => guncelle("acik_adres", e.target.value)} />
          </Alan>
          <Alan label="Teslimat Notu (isteğe bağlı)">
            <input style={gInput()} placeholder="Örn: Arka kapıdan giriniz"
              value={form.teslimat_notu} onChange={e => guncelle("teslimat_notu", e.target.value)} />
          </Alan>
        </Bolum>

        <div style={styles.sozlesmeWrap}>
          <label style={styles.sozlesmeLabel}>
            <input type="checkbox" style={styles.checkbox}
              checked={form.sozlesme_onaylandi}
              onChange={e => guncelle("sozlesme_onaylandi", e.target.checked)} />
            <span>Kullanım Sözleşmesi'ni okudum ve kabul ediyorum.</span>
          </label>
          {hatalar.sozlesme_onaylandi && (
            <p style={styles.hataMetin}>{hatalar.sozlesme_onaylandi}</p>
          )}
        </div>

        <button style={{ ...styles.btnPrimary, opacity: yukleniyor ? 0.7 : 1 }}
          onClick={kayitOl} disabled={yukleniyor}>
          {yukleniyor ? "Kaydediliyor..." : "Kayıt Ol"}
        </button>

        <p style={styles.girisLink}>
          Zaten hesabınız var mı?{" "}
          <span style={styles.link} onClick={onGirise}>Giriş yapın</span>
        </p>
      </div>
    </div>
  );
}

function Bolum({ baslik, children }) {
  return (
    <div style={styles.bolum}>
      <h3 style={styles.bolumBaslik}>{baslik}</h3>
      {children}
    </div>
  );
}

function SatirIkili({ children }) {
  return <div style={styles.satirIkili}>{children}</div>;
}

function Alan({ label, hata, children }) {
  return (
    <div style={styles.alan}>
      <label style={styles.label}>{label}</label>
      {children}
      {hata && <p style={styles.hataMetin}>{hata}</p>}
    </div>
  );
}

const gInput = (hata) => ({
  ...styles.input,
  borderColor: hata ? "#e53e3e" : "#d1d5db",
});

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    display: "flex",
    alignItems: "flex-start",
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
    maxWidth: 680,
  },
  header: { textAlign: "center", marginBottom: 32 },
  logo: { fontSize: 48, marginBottom: 8 },
  baslik: { fontSize: 28, fontWeight: 700, color: "#14532d", margin: 0 },
  altBaslik: { fontSize: 15, color: "#6b7280", marginTop: 4 },
  bolum: { marginBottom: 24 },
  bolumBaslik: {
    fontSize: 13, fontWeight: 600, color: "#16a34a",
    textTransform: "uppercase", letterSpacing: 1,
    marginBottom: 12, borderBottom: "2px solid #dcfce7", paddingBottom: 6,
  },
  satirIkili: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  alan: { marginBottom: 12 },
  label: { display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4 },
  input: {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: "1.5px solid #d1d5db", fontSize: 14, color: "#111827",
    outline: "none", boxSizing: "border-box", background: "#fafafa",
  },
  hataMetin: { color: "#e53e3e", fontSize: 12, marginTop: 2, margin: 0 },
  sunucuHata: {
    background: "#fef2f2", border: "1px solid #fecaca",
    color: "#dc2626", borderRadius: 8, padding: "12px 16px",
    fontSize: 14, marginBottom: 20,
  },
  sozlesmeWrap: { marginBottom: 24 },
  sozlesmeLabel: { display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#374151", cursor: "pointer" },
  checkbox: { marginTop: 2, width: 16, height: 16, accentColor: "#16a34a" },
  link: { color: "#16a34a", fontWeight: 600, cursor: "pointer" },
  btnPrimary: {
    width: "100%", padding: "14px", borderRadius: 10,
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff", fontSize: 16, fontWeight: 600,
    border: "none", cursor: "pointer",
  },
  basariIcon: { fontSize: 64, textAlign: "center", marginBottom: 16 },
  basariBaslik: { textAlign: "center", fontSize: 22, fontWeight: 700, color: "#14532d" },
  basariAciklama: { textAlign: "center", color: "#4b5563", fontSize: 14, lineHeight: 1.6, margin: "12px 0 24px" },
  girisLink: { textAlign: "center", fontSize: 14, color: "#6b7280", marginTop: 16 },
};