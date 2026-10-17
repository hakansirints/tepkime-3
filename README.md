# Tepkime Arenası

Lise kimyası için etkileşimli 3B laboratuvar. Öğrenci iki madde seçer, gözlenebilecek değişimleri gerekçeleriyle tahmin eder, maddeleri karıştırır ve gözlemini kaydeder. Ardından aynı beherlerde tanecik düzeyindeki değişimleri inceleyebilir.

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
- Taşınabilir ve küçültülebilir gözlem kartı, tahmin–gözlem karşılaştırması.
- Mevcut 3B beherlerde başlangıç ve tepkime tanecik gösterimleri; döndürme ve beher içine yakınlaşma.
- Etiketsiz tanecikler, dışarıda örnek modeller; dökme tamamlanınca tek açıklama kartı.
- Masaüstü ve mobil yatay düzen, açık/koyu tema.

Tahmin ve gözlem kayıtları kullanılan tarayıcının yerel depolamasında tutulur. Bir sunucuya veya öğretmen hesabına gönderilmez.

## Modelin sınırları

Tanecik sayıları, boyutları, hareketler ve süreler öğretim amaçlı temsillerdir; nicel moleküler dinamik veya denge hesabı değildir. Sıcaklıklar eğitim senaryosundan gelir. Tanecik dönüşümlerinde atom ve toplam yük korunumu kontrol edilir. Her karışımda kimyasal tepkime oluşmaz.

## Doğrulama

Veri ve akış kontrolleri için Node.js ile:

```sh
node scripts/verify-selection.cjs
node scripts/verify-prediction.cjs
node scripts/verify-experiment.cjs
node scripts/verify-observation.cjs
node scripts/verify-particle-models.cjs
node scripts/verify-powder-motion.cjs
```

Tarayıcı testleri Playwright ve Windows'ta Microsoft Edge kullanır. Gerekirse Playwright'ı yerel olarak `npm install --no-save playwright` ile kurun.

```sh
node scripts/verify-beaker-particles-browser.cjs
node scripts/verify-particle-visuals-browser.cjs
node scripts/verify-particle-camera-browser.cjs
node scripts/verify-lab-controls-browser.cjs
```

Tarayıcı testleri geçici bir yerel sunucu açar; ekran görüntülerini sistemin geçici klasörüne yazar. Eski `verify-chemistry.cjs` ve `verify-lab.cjs` mevcut öğrenci akışının doğrulaması değildir.

Ayrıntılı teknik notlar: [README-LAB.md](README-LAB.md).

Yerel yedekler, Word dosyaları, bağımlılık klasörleri ve geçici çıktılar Git deposuna dahil edilmez.
