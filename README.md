# Tepkime Arenası

Lise kimyası için etkileşimli 3B laboratuvar. Öğrenci iki madde seçer, gözlenebilecek değişimleri gerekçeleriyle tahmin eder, maddeleri karıştırır ve gözlemini kaydeder. Ardından Açıkla aşamasında kayıtlı gözlemlerini yorumlar ve açıklamasını yazar. Son Model aşamasında taneciklerin rollerini ilişkilendirir. İki aşamadan da aynı 3B beherleri inceleyip kendi kartına dönebilir.

## Çalıştırma

Python 3 kuruluysa proje klasöründe çalıştırın:

```sh
python scripts/start-preview.py
```

Tarayıcı `http://127.0.0.1:8173/index.html` adresinde açılır. Sunucuyu durdurmak için `Ctrl+C` kullanın. Windows'ta `baslat.bat` alternatifi 8080 portunu kullanır.

Uygulama statik HTML, CSS ve JavaScript dosyalarından oluşur; derleme veya sunucu tarafı uygulaması gerektirmez. Three.js ve lisansı `js/vendor/three/` içinde bulunur. ES modülleri nedeniyle dosyaları bir HTTP sunucusu üzerinden açın.

GitHub Pages yayını `main` dalının kökünden yapılır. Yayınlamadan önce `node scripts/version-assets.cjs` çalıştırın. Bu komut CSS, JavaScript, modül bağımlılıkları ve madde görsellerinin adreslerini içerikten üretilen ortak sürümle günceller; tarayıcı eski sürümün dosyalarını yeni sayfayla karıştırmaz. Yayın sürümü `index.html` içindeki `app-version` meta alanından doğrulanabilir.

## Özellikler

- 12 madde, 66 farklı eşleşme ve her iki seçim sırasının desteği.
- Gerekçeli tahmin, güvenlik onayı, otomatik veya sürükleyerek dökme.
- Hacim, katı miktarı ve sıcaklık verileri; değiştirilmeyen ilk tahmin ve gözlem kayıtları.
- Geniş gözlem kartı, laboratuvara gidip dönüş ve tahmin–gözlem karşılaştırması.
- Taneciklerin doğrudan mevcut 3B beherlerin içinde gösterildiği inceleme görünümü.
- Dökülmeden önce ve tepkime sırasında sürekli hareketli tanecikler; zaman çizgisiyle son durumu inceleme.
- İki beherin arasında yan yana duran saydam tanecik kartları; aktarımda ikinci kartın kaybolması ve ilk kartta karışım bilgilerinin gösterilmesi.
- Tek açıklama kartı: yatay gözlem özeti, değişim yorumu, kayıtlı gözlem ve açıklama yazımı.
- Gözlem yorumu kartından deneyin otomatik tekrarına; açıklama ve Model kartlarından 3B beherlere gidip dönüş.
- Önceki gözlemlerin salt okunur özeti, değişim türü yorumu ve kartı büyütmeyen tahmin penceresi.
- Word benzeri küçük alt/üst simge araçları, klavye kısayolları; otomatik taslak ve açıklama geçmişi.
- Açıklamanın sonunda **Model Aşamasına Geç** bağlantısı; tanecik rol seçimleri ve bunlarla güncellenen ilişki şeması.
- Tepkimeye katılanları, ürünleri, seyirci iyonları ve katalizörleri ayırt etme; kontrol edilen tanecik modelini koleksiyona kaydetme.
- Masaüstü ve mobil yatay düzen, açık/koyu tema.

Tahmin, gözlem, açıklama ve tanecik modeli kayıtları kullanılan tarayıcının yerel depolamasında tutulur. Bir sunucuya veya öğretmen hesabına gönderilmez.

## Modelin sınırları

Tanecik sayıları, boyutları, hareketler ve süreler öğretim amaçlı temsillerdir; nicel moleküler dinamik veya denge hesabı değildir. Sıcaklıklar eğitim senaryosundan gelir. Tanecik dönüşümlerinde atom ve toplam yük korunumu kontrol edilir. Her karışımda kimyasal tepkime oluşmaz.

## Doğrulama

Veri ve akış kontrolleri için Node.js ile:

```sh
node scripts/verify-selection.cjs
node scripts/verify-prediction.cjs
node scripts/verify-experiment.cjs
node scripts/verify-experiment-replay.cjs
node scripts/verify-observation.cjs
node scripts/verify-observation-peek.cjs
node scripts/verify-learning-touch.cjs
node scripts/verify-particle-models.cjs
node scripts/verify-powder-motion.cjs
```

Tarayıcı testleri Playwright ve Windows'ta Microsoft Edge kullanır. Gerekirse Playwright'ı yerel olarak `npm install --no-save playwright` ile kurun.

```sh
node scripts/verify-experiment-browser.cjs
node scripts/verify-learning-cards-browser.cjs
node scripts/verify-beaker-particles-browser.cjs
node scripts/verify-explanation-browser.cjs
```

Tarayıcı testleri geçici bir yerel sunucu açar. Açıklama testi görsellerini `artifacts/explanation-qa/`, beher tanecik testi `artifacts/beaker-particles-qa/` klasörüne, diğer testler sistemin geçici klasörüne yazar. Oluşturulan görseller Git deposuna alınmaz. Eski rapor/model kartlarına ait testler kaldırılmıştır.

Ayrıntılı teknik notlar: [README-LAB.md](README-LAB.md).

Yerel yedekler, Word dosyaları, bağımlılık klasörleri ve geçici çıktılar Git deposuna dahil edilmez.


## Mobil kullanım ve son uyumluluk kontrolü

Laboratuvarın mobil kullanımı yatay ekrana göre düzenlenmiştir. Dokunmatik cihaz dikey tutulduğunda mevcut ekranı döndürme yönlendirmesi korunur. Uzun formlar kartın içinde dikey kaydırılır; ana gezinme ve kaydetme düğmeleri görünür kalır. Sayfa yakınlaştırması açıktır.

Mobil düzeltmeler `css/mobile.css` içinde telefon/küçük tablet yatay ekran sorgularıyla sınırlıdır. Masaüstü kart genişlikleri ve yerleşimleri korunur. Dokunmatik giriş alanlarında otomatik yakınlaştırmayı önlemek için 16 px yazı, kaydırılabilir bölgelerde dokunmatik kaydırma, 3B incelemede içerikten ayrı dönüş düğmesi kullanılır.

2026-10-20 kontrolü: 1366×768 masaüstü ve 844×390, 667×320, 568×320 yatay telefon görünümleri; giriş, seçim, tahmin, güvenlik, deney, gözlem/karşılaştırma, açıklama, model, rehber ve koleksiyon akışı. Bunlar tarayıcı görünüm alanı kontrolleridir; fiziksel iOS/Safari ve Android cihaz testi yerine geçmez. Ayrıntılı sonuçlar: [Mobil uyumluluk kontrolü](docs/mobile-compatibility.md).
