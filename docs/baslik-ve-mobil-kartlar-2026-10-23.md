# Başlık ve mobil kart düzeni

## Uygulanan değişiklikler

- Başlığın sağındaki ok, pencere simgesiyle değiştirildi. Simge bütün başlığı sol üstteki 44 × 44 piksel saydam düğmeye toplar. Düğme uygulama kartlarının üzerinde kalır; tıklanarak başlık geri açılır.
- Mobilde yeni ekran/aşama başlangıcında başlık simge halinde; masaüstünde açık başlar. Cihaz görünümü değiştiğinde uygun varsayılan uygulanır. Mobil tanecik incelemelerinde başlığı koşulsuz gizleyen eski kural kaldırıldı.
- Başlık açma/kapatma işlemi formu yeniden oluşturmaz. Metin alanı, seçimler ve kaydırma korunur; klavye odağı aç/kapat simgesine aktarılır. Kart konumları görünür başlığın ölçülen alt kenarına göre hesaplanır. Toplanmış simge için yalnızca başlık alanında yer ayrılır; kart gövdeleri daraltılmaz.
- Tepkimesiz model kontrol penceresi 920 piksele kadar genişleyen, daha kısa bir düzene geçti. Başlık ve düğmeler sabit; uzun hata listesi ayrı kayar. Geniş görünümde maddeler iki sütundur. Açık ve koyu tema düzenlendi.
- Mobil koleksiyon ekran yüksekliğine bağlandı. Başlık/filtre ve alt düğmeler sabit; içerik 2 sütun halinde kendi alanında kayar. Eski sabit yükseklik ve kenar boşluğu kurallarının içeriği kesmesi giderildi.
- Yüzen Kapsül çubuklarının bazı yüksek öncelikli eski stillerle birlikte çift görünmesi düzeltildi. Yerel `dialog` pencerelerinin çubukları pencerenin kendi katmanında oluşturulur; arka sayfada kalmaz.

## Kontroller

- 50 tarayıcı görünümü: 844 × 390 ve 1280 × 720; açık/koyu temalar; başlık açık/simge durumları; seçim, tahmin, model, koleksiyon ve tanecik incelemesi.
- Ek kısa mobil görünümler: 568 × 320 ve 956 × 320 koleksiyon; 568 × 320, 956 × 352 ve 1280 × 720 hata pencereleri.
- JavaScript hatası, yatay sayfa taşması, simgenin kartların arkasında kalması ve başlığın ana kartı örtmesi bulunmadı. Kısa koleksiyon ekranlarında kaydırılabilir alanın yeterli yüksekliği doğrulandı.
- Gerçek formda başlığı açıp kapatırken aynı metin alanının DOM'da kaldığı, değerin ve kaydırmanın korunduğu doğrulandı. Mobilde varsayılan simge ve masaüstünde varsayılan açık durum ayrıca denetlendi.
- 956 × 352 görünümde beş maddeli kontrol penceresi 920 × 253 piksel oldu. 568 × 320 görünümde son hata maddesine kapsül sürüklenerek erişildi; `Tamam` düğmesi görünür kaldı.
- Tahmin, gözlem, dokunmatik seçim, gözlem kartı açma/kapatma ve tepkimesiz model testleri geçti.

Eski `verify-selection.cjs` testi daha önce kaldırılmış `randomReactivePairForTesting` üretim komutunu beklediği için duruyor. Bu görevde eski test dosyası değiştirilmedi; seçim ve başlık yerleşimi gerçek tarayıcıda denetlendi.

Yayın varlık sürümü: `e8aaf3d3a426`.
