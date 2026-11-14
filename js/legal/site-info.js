// Yasal sayfaların künye bilgileri: YAYINDAN ÖNCE BURAYI DOLDUR.
// owner/address/email dışında null kalan her alan sayfalarda sarı [YER TUTUCU] olarak görünür. draft true iken her yasal
// sayfanın başında "taslak" uyarısı çıkar; metinler hukukçuya kontrol ettirildikten sonra false yap.

export const SITE_INFO = {
  draft: false,   // Fatih 2026-11-14: metin yayımlandı; hukukçu incelemesi yapılmadı (yapılınca bu not güncellenir)
  owner: 'hfatih',      // GitHub kullanıcı adı (iletişim bağlantıları için)
  name: 'Fatih Han',           // Veri sorumlusunun / yayıncının adı soyadı (KVKK m. 10/1-a: kimlik). Boşsa GitHub adı gösterilir
  site: 'gokyuzuveriportali.com.tr',
  repo: 'https://github.com/hfatih/gokyuzu-veri-portali',   // e-posta yoksa iletişim GitHub üzerinden
  address: null,        // Tebligat adresi (boşsa sayfalarda hiç gösterilmez)
  email: 'kvkk@gokyuzuveriportali.com.tr',   // İletişim ve KVKK başvuru e-postası (YunoHost'ta posta takma adı)
  kep: null,            // KEP adresi (şirketse)
  registry: null,       // MERSİS no / vergi no (şirketse)
  host: 'Keyubu, Türkiye',   // Barındırma (yer) sağlayıcısı ve ülkesi (sunucu 45.155.124.197, RIPE: TR-KEYUBU)
  logRetention: '14 gün',   // nginx erişim kayıtları: logrotate günlük, 14 kopya, sonra silinir
  mailRetention: null,  // Yazışmaların saklama süresi, ör. "3 yıl"
  court: null,          // Kullanım Koşulları'nda yetkili mahkeme ili, ör. "Ankara"
  updated: '2026-11-14',
};
