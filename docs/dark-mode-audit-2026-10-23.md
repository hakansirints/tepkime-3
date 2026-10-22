# Tepkime Arenası karanlık tema denetimi

23 Ekim 2026

Karanlık temada kartların içindeki açık yüzeyler ve okunmayan metinler düzeltildi. Uygulama içi tarayıcıda 42 masaüstü durumu ile 6 yatay mobil görünüm incelendi. Son masaüstü taramasında denetim kapsamındaki görünür metinlerde kontrast eşiğinin altında sonuç ve açık tema yüzeyi saptanmadı.

## İncelenen adımlar ve sonuçlar

| Adım | Bölüm | Bulgu ve yapılan düzeltme | Son durum |
| --- | --- | --- | --- |
| 1 | Giriş, seçim ve ayarlar | Beyaz kalan yol kartları ve soluk menü yazıları koyu zemin/açık metinle eşleştirildi. Seçili madde etiketleri, etkin adım ve mobil üst çubuk düzeltildi. | Geçti |
| 2 | Tahmin | Tablo başlıkları, açıklamalar, seçim işaretleri ve hata mesajları karanlık temaya uyarlandı. | Geçti |
| 3 | Deney ve güvenlik | Beyaz canlı veri paneli, formül rozetleri, miktar/sıcaklık göstergeleri ve sürükleme ipucu düzeltildi. Güvenlik onayının yeşil durumundaki yazı kontrastı artırıldı. | Geçti |
| 4 | Gözlem ve karşılaştırma | Belirti adları koyu zeminde koyu yazılıyordu. Sıcaklık kutusu, kayıt özeti, karşılaştırma rozetleri, hata alanları ve daraltılmış gözlem kartı düzeltildi. | Geçti |
| 5 | Açıklama | Değişim seçimi, iç düğmeler ve alt/üst simge araç çubuğunda kalan beyaz yüzeyler ve beyaz üstüne beyaz yazılar giderildi. | Geçti |
| 6 | Model ve denklem | Rol seçimi, boş/dolu ilişki şeması, hata/başarı metinleri, denklem uyarısı, korunum tablosu ve tepkimesiz akış kontrol edildi. Soluk yardımcı yazılar ve model rozeti düzeltildi. | Geçti |
| 7 | Üç boyutlu tanecik inceleme | Aydınlık laboratuvar üzerinde kaybolan etiketlere yeterli koyu yarı saydam zemin eklendi. Madde çiftinin rozeti ve zaman çizgisi düzeltildi. | Geçti |
| 8 | Günlük, rehber ve sistem pencereleri | Günlük dış/iç yüzeyleri, beş deney türünün renkleri, filtreler, rehberin beş sekmesi, sıfırlama ve kapatma düğmeleri kontrol edilip düzeltildi. Boş günlük, tekrar deneyi, yönlendirme ve bildirim durumları da geçti. | Geçti |

## Doğrulama

- Masaüstü: 1280 × 720 görünüm alanında 42 ayrı durumun ekran görüntüsü ve hesaplanan CSS renkleri incelendi.
- Yatay mobil: 844 × 390 görünüm alanında açıklama, gözlem, karşılaştırma, kuru karışım modeli, rehber ve günlük görsel olarak kontrol edildi.
- Normal boyuttaki görünür düz metinlerde en az 4,5:1; büyük metinlerde en az 3:1 kontrast hedeflendi. Son taramadaki bu kapsama giren metinlerde eşik altı sonuç kalmadı.
- Tema düğmesiyle açık → karanlık ve karanlık → açık geçişleri kontrol edildi. Açık temanın mevcut açık yüzeyleri korunuyor. Yeniden açılışta karanlık tema tercihi geri yükleniyor.
- Tepkimesiz model kaydetme düğmesiyle gerçek tıklama yapılarak başarılı sonuç kartı ve iki yönlendirme seçeneği doğrulandı.
- Kimyasal atom/tanecik renkleri korunuyor. Üç boyutlu odanın aydınlatması, mevcut bağımsız laboratuvar ortamı ayarıyla yönetilmeye devam ediyor.

## Uygulama

`css/dark-mode.css`, mevcut bileşen stillerinden sonra yüklenen ve yalnızca karanlık temada etkinleşen ortak düzeltme katmanıdır. Form denetimlerinde tarayıcının karanlık renk şeması kullanılır. Açık tema stilleri değiştirilmedi. Dosya adresleri `scripts/version-assets.cjs` ile yeni yayın sürümüne göre güncellenir.

## Kapsamın sınırları

Bu çalışma tam WCAG uygunluk belgesi değildir. Kontrast taraması, bu durumlarda görünen düz metinleri ve hesaplanan CSS arka planlarını kapsar; ekran okuyucu testi, her işletim sistemi/tarayıcı kombinasyonu ve fiziksel telefon testi yapılmadı. Nadir hata/başarı durumları yerel denetim örnekleriyle açıldı; ekran görüntüleri aynı gerçek uygulama bileşenlerinden alındı. Bilimsel görsellerin renkleri, üç boyutlu aydınlatma ve görüntü içi metinler otomatik metin taramasına dahil değildir.

Önce/sonra ekranları, durum başına ölçümler ve görsel rapor çalışma alanındaki `artifacts/dark-mode-audit/` klasöründedir; geçici görseller GitHub yayınına eklenmez.
