# 23 Ekim 2026 mobil etkileşim düzeltmeleri

11.17'de güncellenen istem belgesindeki altı istek uygulandı.

1. **Kaydet ve Deney Aşamasına Geç** düğmesi mobilde sağa hizalandı ve metin ile simgenin gerektirdiği genişlikle sınırlandı. Onay işaretleri 36 piksel boyutunda, çevresinde ek dokunma payı bulunan tek kutular olarak düzenlendi. Dokunuş bir kez işlenir; kaydırma ve iptal edilen dokunuşlar seçim yapmaz. Fare ve klavye yolları korunur. Koyu tema renkleri ayrıca düzenlendi.
2. Mobil deney masası bilgi ve işlem kartları sabit ekran koordinatlarında, ölçülen başlık çubuğunun altına yerleştirilir. Başlık boyutu değiştiğinde ve mobil görünür alan yeniden boyutlandığında yerleşim tekrar ölçülür.
3. **Tahminim ve Gözlemim** penceresinin içerik alanını sıfır yüksekliğe düşüren mobil esneklik kuralı ana kartlarla sınırlandı. Pencere ekran yüksekliğine uyar; beş belirti satırı, kaydedilen gözlem ve sıcaklık verileri görünür. Gerektiğinde yalnızca pencere içeriği kayar.
4. Mobilde tüm 3B tanecik incelemeleri ana aşama çubuğunu gizler. Deney maddeleri özeti üst sol bölüme geçer. İncelemeden çıkıldığında olağan başlık tekrar görünür.
5. Aktarım tamamlandıktan sonra birleşen karışım tanecik kartı mobilde ekranın soluna alınır. Genişliği ekran boyutuna uyar; üstteki madde özeti, alttaki rol kartı ve ekran sınırı için yer ayrılır. Uzun listeler kart içinde kaydırılır. Masaüstündeki konumlandırma korunur.
6. Mobil **Açıklamam** metin alanı 14 piksel yazı ve 1,45 satır yüksekliğiyle düzenlendi. **Kaydet ve Model Aşamasına Geç** düğmesi sağa hizalandı; metin ve simgeden daha geniş alan kaplamaz.

## Kontroller

- Yerel tarayıcıda 38 yerleşim görünümü: 568 × 320, 667 × 375, 844 × 390 ve 1280 × 720 boyutları; açık ve koyu temalar.
- Tahmin, gözlem, deney masası, açıklama, karşılaştırma, başlangıç tanecikleri, karışım ve modelin deney masası görünümleri.
- Kaydetme düğmelerinin genişliği ve sağ hizası; karşılaştırmanın beş satırı ve görünür içerik yüksekliği; deney kartlarının başlık altında kalması; 3B başlığın gizlenmesi; karışım kartının sol konumu ve alt sınırı ölçüldü.
- Tikler tarayıcıda sırayla seçildi; satırda yalnızca son seçimin kaldığı doğrulandı. Dokunma olaylarının tek işlenmesi, uyumluluk tıklaması, kaydırma, iptal, fare, klavye ve art arda dokunuşlar `verify-learning-touch.cjs` ile sınandı.
- Tahmin, gözlem ve gözlem kartı sayacı testleri geçti.

Yayın dosyası sürümü: `43e372203aa1`.
