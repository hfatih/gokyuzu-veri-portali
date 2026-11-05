// Yasal sayfaların künye bilgileri: YAYINDAN ÖNCE BURAYI DOLDUR.
// owner/address/email dışında null kalan her alan sayfalarda sarı [YER TUTUCU] olarak görünür. draft true iken her yasal
// sayfanın başında "taslak" uyarısı çıkar; metinler hukukçuya kontrol ettirildikten sonra false yap.

export const SITE_INFO = {
  draft: true,
  owner: 'hfatih',      // Veri sorumlusu / site sahibi (astronews ile aynı: GitHub kullanıcı adı)
  repo: 'https://github.com/hfatih/gokyuzu-veri-portali',   // e-posta yoksa iletişim GitHub üzerinden
  address: null,        // Tebligat adresi (boşsa sayfalarda hiç gösterilmez)
  email: null,          // İletişim ve KVKK başvuru e-postası (boşsa GitHub kanalları gösterilir)
  kep: null,            // KEP adresi (şirketse)
  registry: null,       // MERSİS no / vergi no (şirketse)
  host: null,           // Barındırma (yer) sağlayıcısı ve ülkesi, ör. "Örnek Hosting A.Ş., Türkiye"
  logRetention: null,   // Sunucu kayıtlarının saklama süresi, ör. "2 yıl"
  mailRetention: null,  // Yazışmaların saklama süresi, ör. "3 yıl"
  court: null,          // Kullanım Koşulları'nda yetkili mahkeme ili, ör. "Ankara"
  updated: '2026-11-05',
};
