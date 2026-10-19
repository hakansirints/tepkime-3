# Tepkime Arenası

Lise kimyası için etkileşimli 3B laboratuvar. Öğrenci iki madde seçer, gözlenebilecek değişimleri gerekçeleriyle tahmin eder, maddeleri karıştırır ve gözlemini kaydeder. Ardından kayıtlı gözlemlerini kimyasal veya fiziksel değişim olarak yorumlar, taneciklerin rollerini ilişkilendirir ve açıklamasını yazar. Aynı 3B beherlere gidip açıklama kartına dönerek düşüncesini geliştirebilir.

## Çalıştırma

Python 3 kuruluysa proje klasöründe çalıştırın:

```sh
python scripts/start-preview.py
```

Tarayıcı `http://127.0.0.1:8173/index.html` adresinde açılır. Sunucuyu durdurmak için `Ctrl+C` kullanın. Windows'ta `baslat.bat` alternatifi 8080 portunu kullanır.

Uygulama statik HTML, CSS ve JavaScript dosyalarından oluşur; derleme veya sunucu tarafı uygulaması gerektirmez. Three.js ve lisansı `js/vendor/three/` içinde bulunur. ES modülleri nedeniyle dosyaları bir HTTP sunucusu üzerinden açın.

## Özellikler

- 12 madde, 66 farklı eşleşme ve her iki seçim sırasının desteği.
- Gerekçeli tahmin, güvenlik onayı, otomatik veya sürükleyerek dökme.
- Hacim, katı miktarı ve sıcaklık verileri; değiştirilmeyen ilk tahmin ve gözlem kayıtları.
- Geniş gözlem kartı, laboratuvara gidip dönüş ve tahmin–gözlem karşılaştırması.
- Normal görünümlü 3B beherler ve seçili bölgeyi gösteren yarı saydam tanecik merceği.
- Dört canlı görünüm; kesiti döndürme, tekerlekle yakınlaşma ve merceği kenarından veya sağ tuşla taşıma.
- Taneciğe dokunarak türünü ve başlangıç beherini inceleme; çözücü suyu gösterme seçeneği.
- Sırayla açılan üç açıklama kartı: gözlemleri yorumlama, tanecik ilişkileri ve açıklama yazımı.
- Kanıt kartından deneyin otomatik tekrarına, tanecik kartından 3B modellere gidip dönüş.
- Önceki gözlemlerin salt okunur özeti, değişim türü yorumu ve kartı büyütmeyen tahmin penceresi.
- Her açıklama kartında geçici Test İçin Doldur düğmesi.
- Word benzeri küçük alt/üst simge araçları, kimyasal yazım düzeltmesi ve klavye kısayolları; otomatik taslak ve açıklama geçmişi.
- Model incelemesi Açıkla aşamasına entegredir; eski rapor, tür sorusu ve ayrı model kartları kaldırılmıştır.
- Masaüstü ve mobil yatay düzen, açık/koyu tema.

Tahmin, gözlem ve açıklama kayıtları kullanılan tarayıcının yerel depolamasında tutulur. Bir sunucuya veya öğretmen hesabına gönderilmez.

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
node scripts/verify-particle-models.cjs
node scripts/verify-powder-motion.cjs
```

Tarayıcı testleri Playwright ve Windows'ta Microsoft Edge kullanır. Gerekirse Playwright'ı yerel olarak `npm install --no-save playwright` ile kurun.

```sh
node scripts/verify-experiment-browser.cjs
node scripts/verify-learning-cards-browser.cjs
node scripts/verify-particle-lens-browser.cjs
node scripts/verify-explanation-browser.cjs
```

Tarayıcı testleri geçici bir yerel sunucu açar. Açıklama testi görsellerini `artifacts/explanation-qa/`, mercek testi `artifacts/particle-lens-qa/` klasörüne, diğer testler sistemin geçici klasörüne yazar. Oluşturulan görseller Git deposuna alınmaz. Eski rapor/model kartlarına ait testler kaldırılmıştır.

Ayrıntılı teknik notlar: [README-LAB.md](README-LAB.md).

Yerel yedekler, Word dosyaları, bağımlılık klasörleri ve geçici çıktılar Git deposuna dahil edilmez.
