// Yasal ve kurumsal sayfalar (?page=…). Metinler Türkçedir; künye bilgileri site-info.js'ten gelir.
// Bu metinler hukuki görüş değildir: yayından önce bir KVKK uzmanına kontrol ettirilmelidir.

import { SITE_INFO as S } from './site-info.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** Künye alanı ya da sarı yer tutucu. */
const f = (v, label) => (v ? esc(v) : `<mark class="ph">[${label}]</mark>`);
const owner = () => f(S.owner, 'VERİ SORUMLUSU ADI / UNVANI');
const mail = () => (S.email ? `<a href="mailto:${esc(S.email)}">${esc(S.email)}</a>` : f(null, 'E-POSTA'));

const CDS = 'CDS (Centre de Données astronomiques de Strasbourg, Fransa)';
const HOSTS = [
  ['simbad.cds.unistra.fr, vizier.cds.unistra.fr, alasky.cds.unistra.fr', CDS, 'katalog verisi ve gökyüzü görüntüleri'],
  ['query.wikidata.org', 'Wikimedia Vakfı (ABD)', 'adlar, gezegen ve kara delik değerleri'],
  ['api.ssodnet.imcce.fr, ssp.imcce.fr', 'IMCCE (Paris Gözlemevi, Fransa)', 'asteroit ve kuyruklu yıldız verisi'],
  ['services.swpc.noaa.gov', 'NOAA Uzay Havası Tahmin Merkezi (ABD)', 'Güneş\'teki güncel leke bölgeleri (ana sayfa ve Güneş kartı)'],
];
const hostTable = () => `<div class="tbl"><table><thead><tr><th scope="col">Sunucu</th><th scope="col">Kuruluş</th><th scope="col">Ne için</th></tr></thead>
  <tbody>${HOSTS.map(([h, o, w]) => `<tr><td><code>${h}</code></td><td>${o}</td><td>${w}</td></tr>`).join('')}</tbody></table></div>`;

const RIGHTS = [
  'Kişisel verinin işlenip işlenmediğini öğrenme',
  'İşlenmişse buna ilişkin bilgi talep etme',
  'İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme',
  'Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme',
  'Eksik veya yanlış işlenmişse düzeltilmesini isteme',
  'KVKK m. 7 çerçevesinde silinmesini veya yok edilmesini isteme',
  'Düzeltme, silme ve yok etme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme',
  'Münhasıran otomatik sistemlerle analiz sonucu aleyhine bir sonuca itiraz etme',
  'Kanuna aykırı işleme nedeniyle zarara uğrarsan zararın giderilmesini talep etme',
];

const kvkk = () => `
  <section class="summary"><h2>Kısaca</h2><ul>
    <li>Üyelik, hesap ya da form yok; adını ve e-postanı yalnız bize yazarsan öğreniriz.</li>
    <li>“Konumumu kullan” dediğinde konumun tarayıcında hesaplanır, bize gelmez.</li>
    <li>Reklam, istatistik ya da izleme aracı kullanmıyoruz. Yazı tipleri dahil sitenin tüm dosyaları kendi sunucumuzdan gelir.</li>
    <li>Bilimsel kataloglar ve Güneş'in güncel leke raporu ilgili kuruluşlarda durduğu için tarayıcın onları doğrudan ister.</li>
  </ul></section>
  <h2>1. Veri sorumlusu</h2>
  <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca veri sorumlusu ${owner()}'dır.
    Adres: ${f(S.address, 'ADRES')} · E-posta: ${mail()}${S.kep ? ` · KEP: ${esc(S.kep)}` : ''}${S.registry ? ` · ${esc(S.registry)}` : ''}.</p>
  <h2>2. İşlenen kişisel veriler</h2>
  <div class="tbl"><table><thead><tr><th scope="col">Kategori</th><th scope="col">Veriler</th><th scope="col">Ne zaman</th></tr></thead><tbody>
    <tr><td>İşlem güvenliği</td><td>IP adresi, tarih-saat, istenen sayfa, tarayıcı bilgisi (sunucu kayıtları)</td><td>Her ziyarette</td></tr>
    <tr><td>İletişim</td><td>Ad, e-posta, mesaj ve başvuru içeriği</td><td>Bize yazarsan ya da başvurursan</td></tr>
  </tbody></table></div>
  <p>Gözlem konumun ve ölçek karşılaştırma listen yalnız cihazında, tarayıcı depolamasında tutulur; bize iletilmez (bkz. <a href="?page=cerez">Çerez Politikası</a>).</p>
  <h2>3. Amaçlar ve hukuki sebepler</h2>
  <ul>
    <li><strong>Sitenin güvenli çalışması, kötüye kullanımın önlenmesi:</strong> KVKK m. 5/2 (ç) hukuki yükümlülük ve (f) meşru menfaat.</li>
    <li><strong>Sorularına ve başvurularına yanıt:</strong> KVKK m. 5/2 (c) ve (f).</li>
  </ul>
  <h2>4. Aktarım ve doğrudan bağlantılar</h2>
  <p>Sunucu kayıtları yalnız barındırma hizmeti aldığımız ${f(S.host, 'BARINDIRMA SAĞLAYICISI, ÜLKE')} ile paylaşılır.</p>
  <p>Bilimsel katalog verisi ve gökyüzü görüntüleri ilgili kuruluşların sunucularında durur. Bir cisim açtığında tarayıcın
    bunları aşağıdaki sunuculardan doğrudan ister; bu sırada IP adresin ve tarayıcı bilgin, her internet bağlantısında olduğu gibi
    bu sunuculara ulaşır. Biz bu kuruluşlara ayrıca kişisel veri göndermeyiz; kendi gizlilik politikaları geçerlidir.</p>
  ${hostTable()}
  <h2>5. Toplama yöntemi ve saklama süresi</h2>
  <p>Veriler otomatik yollarla (sunucu kayıtları) ve iletişim kanallarıyla toplanır. Sunucu kayıtları ${f(S.logRetention, 'SÜRE')},
    yazışmalar ${f(S.mailRetention, 'SÜRE')} saklanır; süre bitince silinir ya da anonim hale getirilir.</p>
  <h2>6. KVKK m. 11 kapsamındaki hakların</h2>
  <ol type="a">${RIGHTS.map((r) => `<li>${r}</li>`).join('')}</ol>
  <h2>7. Başvuru</h2>
  <p>Haklarını kullanmak için <a href="?page=basvuru">Veri Sahibi Başvuru Formu</a> sayfasındaki yollardan birini kullanabilirsin.
    Başvurun en geç 30 gün içinde ücretsiz yanıtlanır.</p>`;

const gizlilik = () => `
  <p>Bu sayfa, sitenin hangi bilgilere dokunduğunu sade bir dille anlatır. Hukuki ayrıntı <a href="?page=kvkk">KVKK Aydınlatma Metni</a>'ndedir.</p>
  <h2>Yapmadıklarımız</h2>
  <ul><li>Hesap açtırmıyor, kimlik bilgisi istemiyoruz.</li><li>Reklam göstermiyor, seni izleyen istatistik ya da pazarlama aracı kullanmıyoruz.</li>
    <li>Kişisel verini satmıyor, kimseyle pazarlama amacıyla paylaşmıyoruz.</li><li>Google Fonts gibi üçüncü taraf yazı tipi ya da betik sunucularına bağlanmıyoruz.</li></ul>
  <h2>Cihazında kalanlar</h2>
  <p>Gözlem konumun ve karşılaştırma listen tarayıcı depolamasında tutulur. Tercih onayı vermediysen sekme kapanınca silinir.
    Konumun 0,1°'ye (yaklaşık 10 km) yuvarlanır ve yalnız gökyüzü hesabı için kullanılır. Konum izni tarayıcının kendi penceresiyle sorulur.</p>
  <h2>Doğrudan bağlanılan sunucular</h2>
  <p>Bir cisim açtığında tarayıcın aşağıdaki bilimsel veri sunucularına bağlanır ve IP adresin bu sunuculara ulaşır.</p>
  ${hostTable()}
  <h2>Dış bağlantılar</h2>
  <p>Kartlardaki “Kaynaklarda ara” bağlantıları (SIMBAD, NASA ADS, Wikipedia…) başka sitelere gider; onların gizlilik politikaları geçerlidir.</p>
  <h2>Çocuklar</h2>
  <p>Site her yaştan meraklı için açıktır ve kimseden kişisel veri istemez.</p>
  <h2>Değişiklikler ve iletişim</h2>
  <p>Bu politika değişirse sayfanın başındaki tarih güncellenir. Soruların için: ${mail()}.</p>`;

const STORE = [
  ['gvp.consent', 'Zorunlu', 'Bu tercih panelindeki seçimini hatırlamak', '12 ay', 'localStorage'],
  ['gvp.location', 'Tercih', '“Gökyüzünde” hesabı için seçtiğin konum', 'Onay varsa sen silene kadar; yoksa sekme kapanınca', 'localStorage / sessionStorage'],
  ['gvp.compare', 'Tercih', 'Ölçek karşılaştırma listen', 'Onay varsa sen silene kadar; yoksa sekme kapanınca', 'localStorage / sessionStorage'],
];
const cerez = () => `
  <p><strong>Bu site HTTP çerezi kullanmaz.</strong> Benzer bir teknoloji olan tarayıcı depolamasını (localStorage, sessionStorage)
    yalnız aşağıdaki üç kayıt için kullanır. Hepsi cihazında kalır, sunucumuza gönderilmez.</p>
  <div class="tbl"><table><thead><tr><th scope="col">Ad</th><th scope="col">Tür</th><th scope="col">Amaç</th><th scope="col">Süre</th><th scope="col">Yer</th></tr></thead>
    <tbody>${STORE.map((r) => `<tr>${r.map((c, i) => `<td>${i === 0 ? `<code>${c}</code>` : c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
  <h2>Türler</h2>
  <ul><li><strong>Zorunlu:</strong> sitenin senin seçimine uyması için gerekir; KVKK Çerez Uygulamaları Rehberi'ne göre onaya tabi değildir.</li>
    <li><strong>Tercih:</strong> yalnız onay verirsen kalıcı olur. Onay vermezsen özellikler yine çalışır ama sekme kapanınca unutulur.</li>
    <li><strong>İstatistik ve reklam:</strong> kullanılmıyor.</li></ul>
  <h2>Seçimini değiştirmek</h2>
  <p>Her sayfanın altındaki <button type="button" class="linkbtn" data-open-consent>Çerez tercihleri</button> düğmesiyle istediğin an değiştirebilirsin.
    Onayını geri alırsan tercih kayıtları kalıcı depodan silinir. Tarayıcının site verilerini temizleyerek de hepsini silebilirsin.</p>
  <h2>Üçüncü taraf sunucular</h2>
  <p>Gökyüzü görüntüleri ve katalog verisi bilimsel kuruluşların sunucularından gelir (bkz. <a href="?page=gizlilik">Gizlilik Politikası</a>).
    Bu sunucuların kendi çerez uygulamaları kendi politikalarına tabidir.</p>`;

const basvuru = () => `
  <p>KVKK m. 11'deki haklarını kullanmak için başvurunu Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'e uygun olarak iletebilirsin:</p>
  <ul><li><strong>Yazılı:</strong> ıslak imzalı dilekçeyle ${f(S.address, 'ADRES')} adresine,</li>
    <li><strong>KEP, güvenli e-imza ya da mobil imza</strong> ile${S.kep ? ` ${esc(S.kep)} adresine` : ''},</li>
    <li>daha önce bize bildirdiğin ve sistemimizde kayıtlı <strong>e-posta adresinden</strong> ${mail()} adresine.</li></ul>
  <p>Başvuruda adın soyadın, T.C. kimlik numaran (yabancıysan uyruğun ve pasaport / kimlik numaran), tebligata esas adresin,
    varsa e-posta ve telefonun ile talebinin açıkça yer alması gerekir. Başvurun en geç 30 gün içinde ücretsiz yanıtlanır.</p>
  <h2>Başvuru taslağı oluştur</h2>
  <p class="muted">Bu form hiçbir yere veri göndermez; yalnız e-posta uygulamanda doldurulmuş bir taslak açar.</p>
  <form class="form" data-kvkk-form>
    <label>Ad soyad<input name="name" required autocomplete="name"></label>
    <label>T.C. kimlik no ya da pasaport no<input name="id" required></label>
    <label>Tebligat adresi<input name="address" required autocomplete="street-address"></label>
    <label>E-posta<input name="email" type="email" required autocomplete="email"></label>
    <label>Talep<select name="right">${RIGHTS.map((r) => `<option>${r}</option>`).join('')}</select></label>
    <label>Açıklama<textarea name="detail" rows="4"></textarea></label>
    <button type="submit" class="btn"${S.email ? '' : ' disabled'}>E-posta taslağını aç</button>
    ${S.email ? '' : '<p class="muted">E-posta adresi henüz tanımlanmadı (site-info.js).</p>'}
  </form>`;

const kosullar = () => `
  <h2>1. Hizmet</h2>
  <p>Gökyüzü Veri Portalı, bilimsel kataloglardaki verileri gösteren ve bu verilerden modeller üreten ücretsiz bir bilgi sitesidir.
    Siteyi kullanarak bu koşulları kabul etmiş sayılırsın.</p>
  <h2>2. Bilgi amaçlıdır</h2>
  <p>Değerler kaynak kataloglardan anlık alınır ve tarayıcıda hesaplanır; her değerin yanında ölçülen, hesaplanan ya da tahmini olduğu yazar.
    Doğruluğu garanti edilmez; bilimsel çalışmalarda kaynak kataloglar esas alınmalıdır. Modeller fiziksel değerlerden üretilir, gözlem görüntüsü değildir.</p>
  <h2>3. Fikri mülkiyet</h2>
  <p>Sitenin tasarımı, kodu ve metinleri ${owner()}'a aittir. Bilimsel veriler ve görüntüler kendi kaynaklarının lisanslarına tabidir
    (bkz. <a href="?page=kaynaklar">Veri Kaynakları ve Lisanslar</a>).</p>
  <h2>4. Kullanım</h2>
  <p>Siteyi otomatik araçlarla aşırı yükleyecek ya da kaynak sunucuları zorlayacak biçimde kullanmamalısın.</p>
  <h2>5. Dış bağlantılar</h2>
  <p>Başka sitelere verilen bağlantıların içeriğinden o siteler sorumludur.</p>
  <h2>6. Değişiklik ve uygulanacak hukuk</h2>
  <p>Koşullar güncellenebilir; geçerli sürüm bu sayfadadır. Uyuşmazlıklarda Türkiye Cumhuriyeti hukuku uygulanır ve
    ${f(S.court, 'İL')} mahkemeleri ile icra daireleri yetkilidir.</p>`;

const SOURCES = [
  ['SIMBAD', 'CDS, Strasbourg, Fransa', 'Bu sitede CDS tarafından işletilen SIMBAD veritabanı kullanılmaktadır. Wenger vd. 2000, A&amp;AS 143, 9.'],
  ['VizieR', 'CDS, Strasbourg, Fransa', 'Ochsenbein, Bauer &amp; Marcout 2000, A&amp;AS 143, 23. Kataloglar: ATNF Pulsar Kataloğu (Manchester vd. 2005, AJ 129, 1993), Altıncı Görsel Çift Yıldız Yörünge Kataloğu ORB6 (Hartkopf, Mason &amp; Worley 2001, AJ 122, 3472), AAVSO VSX (Watson, Henden &amp; Price 2006).'],
  ['hips2fits ve Aladin', 'CDS, Strasbourg, Fransa', 'Gökyüzü görüntüleri Pan-STARRS1 (Chambers vd. 2016) ve Digitized Sky Survey 2 (STScI) taramalarından anlık kesilir.'],
  ['Wikidata', 'Wikimedia Vakfı', 'Yapılandırılmış veriler CC0 kamu malı adanmasıyla kullanılır.'],
  ['SsODNet', 'IMCCE, Paris Gözlemevi', 'Berthier vd. 2023, A&amp;A 671, A151.'],
  ['Gezegen dokuları', 'NASA / USGS', 'Merkür (MESSENGER MDIS), Dünya (Blue Marble, Terra/MODIS) ve Mars (Viking MDIM 2.1) haritaları ABD hükümeti eseri olarak kamu malıdır.'],
  ['Güneş aktif bölgeleri', 'NOAA SWPC', 'Günlük aktif bölge raporu (ABD hükümeti verisi, kamu malı). Leke modeli: Hathaway vd. 1994, Hathaway 2011, Stenflo &amp; Kosovichev 2012, Snodgrass &amp; Ulrich 1990, Gnevyshev–Waldmeier kuralı.'],
  ['Kuasar tayfı', 'SDSS', 'Bileşik kuasar tayfı: Vanden Berk vd. 2001, AJ 122, 549.'],
  ['Yazı tipleri', 'Indestructible Type, IBM', 'Jost ve IBM Plex Mono, SIL Open Font License 1.1 ile kendi sunucumuzdan verilir.'],
];
const kaynaklar = () => `
  <p>Bu sitedeki veriler aşağıdaki kuruluşların açık hizmetlerinden anlık alınır, saklanmaz. Emekleri için teşekkür ederiz.</p>
  <dl class="srcs">${SOURCES.map(([n, o, t]) => `<div><dt>${n} <span class="muted">· ${o}</span></dt><dd>${t}</dd></div>`).join('')}</dl>
  <p>Fizik yöntemleri ve kullanılan bağıntılar her kartta değerin yanındaki işaretin üzerine gelince görünür.</p>`;

const kunye = () => `
  <p>Gökyüzü Veri Portalı, gök cisimlerinin bilimsel kataloglardaki verilerini Türkçe ve İngilizce sunan, bu verilerden canlı modeller
    üreten ve gökyüzünde ne zaman görüleceklerini hesaplayan bir <a href="https://astronews.com.tr/">Astronews</a> projesidir.</p>
  <h2>Künye</h2>
  <dl class="srcs">
    <div><dt>Site sahibi ve içerik sağlayıcı</dt><dd>${owner()}</dd></div>
    <div><dt>Adres</dt><dd>${f(S.address, 'ADRES')}</dd></div>
    <div><dt>E-posta</dt><dd>${mail()}</dd></div>
    ${S.kep ? `<div><dt>KEP</dt><dd>${esc(S.kep)}</dd></div>` : ''}
    ${S.registry ? `<div><dt>MERSİS / vergi no</dt><dd>${esc(S.registry)}</dd></div>` : ''}
    <div><dt>Yer sağlayıcı</dt><dd>${f(S.host, 'BARINDIRMA SAĞLAYICISI, ÜLKE')}</dd></div>
  </dl>
  <p class="muted">5651 sayılı Kanun uyarınca içerik sağlayıcının tanıtıcı bilgileridir.</p>`;

const erisilebilirlik = () => `
  <p>Sitenin herkes tarafından kullanılabilmesini istiyoruz. Şu an sağlananlar:</p>
  <ul><li>Arama kutusu ve öneri listesi klavyeyle kullanılabilir (yön tuşları, Enter, Esc); ekran okuyucular için ARIA ile işaretlidir.</li>
    <li>3D görünümden Esc ile çıkılır; diyaloglar klavyeyle kapanır.</li>
    <li>İşletim sisteminde “hareketi azalt” açıksa animasyonlar ve kayan yıldızlar durur.</li>
    <li>Metinler siyah zemin üzerinde yüksek kontrastlıdır; ölçülen / hesaplanan / tahmini etiketleri renkle birlikte yazıyla da belirtilir.</li>
    <li>Grafikler (yörünge, yükseklik eğrisi, ışık eğrisi) metin açıklamasıyla gelir.</li></ul>
  <h2>Bilinen sınırlar</h2>
  <p>WebGL modelleri görseldir; aynı bilgiler kartta metin olarak yer alır. Bir sorunla karşılaşırsan ${mail()} adresine yaz.</p>`;

export const PAGES = [
  { slug: 'kvkk', tr: 'KVKK Aydınlatma Metni', en: 'Privacy notice (KVKK)', body: kvkk },
  { slug: 'gizlilik', tr: 'Gizlilik Politikası', en: 'Privacy policy', body: gizlilik },
  { slug: 'cerez', tr: 'Çerez Politikası', en: 'Cookie policy', body: cerez },
  { slug: 'basvuru', tr: 'Veri Sahibi Başvuru Formu', en: 'Data subject request', body: basvuru },
  { slug: 'kosullar', tr: 'Kullanım Koşulları', en: 'Terms of use', body: kosullar },
  { slug: 'kaynaklar', tr: 'Veri Kaynakları ve Lisanslar', en: 'Data sources and licences', body: kaynaklar },
  { slug: 'kunye', tr: 'Hakkında ve Künye', en: 'About and imprint', body: kunye },
  { slug: 'erisilebilirlik', tr: 'Erişilebilirlik', en: 'Accessibility', body: erisilebilirlik },
];

export const pageBySlug = (slug) => PAGES.find((p) => p.slug === slug) ?? null;

/** Başvuru formundan e-posta taslağı (mailto) adresi. */
export function kvkkMailto(data) {
  const body = [`Ad soyad: ${data.name}`, `T.C. kimlik / pasaport no: ${data.id}`, `Tebligat adresi: ${data.address}`,
    `E-posta: ${data.email}`, '', `Talep: ${data.right}`, '', data.detail ?? ''].join('\n');
  return `mailto:${encodeURIComponent(S.email ?? '')}?subject=${encodeURIComponent('KVKK m. 11 kapsamında başvuru')}&body=${encodeURIComponent(body)}`;
}

export const siteInfo = S;
