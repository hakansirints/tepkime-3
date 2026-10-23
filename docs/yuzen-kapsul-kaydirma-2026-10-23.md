# Yüzen Kapsül kaydırma çubukları

Seçilen model mobil ve masaüstünde ortak olarak uygulanır. Ana öğrenme kartları, madde galerisi, koleksiyon, güvenlik ve karşılaştırma pencereleri, rehber, tanecik listeleri ve kart içindeki metin alanları kaydırma ihtiyacına göre otomatik izlenir.

- Saydam kapsül mevcut içeriğin üzerinde, sağ kenarda görünür. Yerleşime sütun, kenar payı veya ek genişlik eklemez; sabit kaydırma boşluğu kaldırılır.
- Taşma yokken görünmez. Gerektiğinde yatay yönde de aynı model kullanılır; aşama ve rehber sekmeleri bu uygulamaya dahil değildir.
- Fare tekerleği ve olağan dokunmatik kaydırma korunur. Tutamaç sürüklenebilir; oklar, Page Up/Down, Home/End ve boşluk tuşu desteklenir.
- Koyu tema için cam, kenarlık ve tutuş işareti renkleri uyarlanır. Üst pencere arkasındaki ve görünür alan dışında kalan çubuklar gizlenir.
- Boyut, içerik, görünürlük ve kart değişiklikleri otomatik izlenir. Kaldırılan kartların çubukları da kaldırılır. Gerekli tarayıcı API'leri yoksa olağan tarayıcı çubukları korunur.

## Doğrulama

46 tarayıcı görünümü denetlendi: 844 × 390 ve 1280 × 720 boyutlarında açık/koyu temalarla 10 akış; ayrıca 568 × 320 ve 1280 × 580 boyutlarında güvenlik, karşılaştırma, rehber, tanecik incelemesi, açıklama ve model kartları. Kaydırılabilir alanların tamamı yönetildi; yeni yatay sayfa taşması ve JavaScript hatası bulunmadı.

Gerçek model kartında sürükleme ve End tuşuyla sona erişim doğrulandı. Ayrı davranış denetiminde yatay kaydırma, içeriğin büyümesi/küçülmesi, üst pencerenin açılması, kartın yeniden oluşturulması ve kaldırılması sınandı. İçeriğin sığdığı durumda çubuklar gizlendi; kaldırılan karttan artık çubuk kalmadı.

Önce/sonra ölçümünde mobil model içerik alanının dış genişliği 786 piksel olarak korundu. Kullanılabilir iç genişlik 776 pikselden 786 piksele çıktı; içerik yüksekliği ve kart konumu değişmedi.

Tahmin, gözlem ve dokunmatik seçim regresyon testleri geçti. Yayında bütün CSS/JavaScript varlıkları içerikten üretilen ortak sürümle yenilenir.

Yayın varlık sürümü: `f1bb324965c5`.
