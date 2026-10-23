# 23 Ekim 2026 istemlerinin uygulanması

Değişikliklerden önce mevcut site 110 dosya olarak aşağıdaki klasöre kopyalandı. Her dosyanın SHA-256 özeti kaynakla karşılaştırıldı. `yedek-bilgisi.json` dosyasında dosya listesi, özetler ve kaynak Git kaydı bulunur.

`C:\Users\hakan\OneDrive\Masaüstü\tepkime-arenasi\2026-10-23_10-21-52_istem-oncesi`

Yedeğin kaynak kaydı: `86b72f5f82206b16516de6466e1fee32d8c6c558`. Git iç dosyaları, eski yedekler ve üretilmiş yerel kontrol görüntüleri yedeğe dahil edilmedi.

## Uygulanan istekler

1. Mobil kartların içerik alanları ayrılmış kaydırma çubuklarıyla kaydırılır. Üst ve alt bölümler sabit kalır; içerik yüksekliğe sığdırılmak için sıkıştırılmaz. Tanecik rol seçenekleri de dar alanda kendi yatay kaydırma bölgesini kullanır.
2. Kullanıcı **Deneyi gözle** düğmesiyle kartı kapattığında beş saniyelik sayaç başlatılmaz. Kart kullanıcı yeniden açana kadar kapalı kalır. Deney tamamlandıktan sonraki ilk otomatik açılma korunur. Düğmenin aynı tıklamada uygulama komutuna da aktarılıp kartı yeniden açması engellendi.
3. Açıklama kartındaki üç inceleme düğmesi ortalandı. Tepkimesiz açıklama kartındaki düğmelerle ortak yuvarlak biçim, boyut ve renkler kullanılır: tahmin/gözlem için mavi, deney tekrarı için sarı, tanecik incelemesi için mor. Koyu tema karşılıkları da ortaklaştırıldı.
4. Mobil madde seçiminde başlık, daraltılmış arama alanı ve filtreler tek satıra alındı. Dört sütun korundu; madde satırları 116 pikselden 96 piksele, beher görseli genişliği 80 pikselden 48 piksele indirildi. 844 × 390 kontrolünde görünür madde alanı 142 pikselden 204 piksele çıktı.
5. Mobil tahmin başlığının 18 piksellik sabit yazı boyutu düzeltildi. Aşama etiketi, başlık ve seçilen madde özeti aynı üst satıra sığar.
6. Mobil kart başlıklarındaki seçilen madde özeti daha dar ve küçük görsellerle gösterilir.
7. Mobil ana kartların üst konumu, başlık çubuğunun ölçülen alt kenarına bağlandı. Model ve tepkimesiz kartlardaki ayrı yükseklik kuralları da bu yerleşime uyar. Alt düğmeler ekran içinde kalır.
8. Mobil modelin deney masasında rol belirleme görünümünde atom önizlemeleri ve okları gizlenir; formüller ve rol seçimleri korunur. 844 × 390 örneğinde rol kartı 152 pikselden 106 piksele düşer. Bu görünümde ana aşama çubuğu gizlenir, seçilen maddeler üstte gösterilir. Model kartına dönüldüğünde olağan başlık yeniden görünür. Masaüstündeki önizlemeler ve aşama çubuğu korunur.

## Doğrulama

- Yerel tarayıcıda açık ve koyu temaları kapsayan 38 görünüm kontrolü: 568 × 320, 667 × 375, 844 × 390, 1024 × 600 ve 1280 × 720 boyutları.
- Tepkimeli ve tepkimesiz açıklama/model akışları; uzun kompleks formülleri; dar alanda yatay rol kaydırması; kartın alt içeriğine dikey kaydırma.
- Sayfa yatay taşması, başlık/kart çakışması, kartın ekran altına taşması ve ortak düğme stilleri ölçüldü.
- `verify-prediction.cjs`: 132 madde sırası ve normal tahmin kayıt akışı geçti.
- `verify-observation.cjs`: gözlem, karşılaştırma ve kalıcı kayıt kontrolleri geçti.
- `verify-observation-peek.cjs`: ilk otomatik açılma, elle kapatma, yeniden çizim, kaydırma konumu ve yeni deney sayacı kontrolleri geçti.

Yayın dosyası sürümü: `6849fe5248cf`.
