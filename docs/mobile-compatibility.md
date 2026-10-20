# Mobil uyumluluk kontrolü

Tarih: 2026-10-20. Sonuç: geçti.

## Kapsam

Mevcut yatay laboratuvar akışı korunarak girişten model kaydına kadar uygulama içi tarayıcıda kontrol edildi. Masaüstü karşılaştırma boyutu 1366×768; yatay telefon boyutları 844×390, 667×320 ve 568×320 idi. Ayrıca yazı girişi için 844×240 kısa ekran denendi. Dikey dokunmatik kullanımda mevcut cihazı yataya çevirme yönlendirmesi korunur.

## Akış sonuçları

| Adım | Kontrol | Sonuç |
| --- | --- | --- |
| 1 | Giriş ekranı ve menü bağlantıları | Geçti; yatay taşma yok. |
| 2 | Madde seçimi, iki maddeyi seçme ve tahmine geçiş | Geçti; dar ekranda arama/filtreler başlığın altına alınır, madde adları görünür. |
| 3 | Tahmin, karar/gerekçe girişi ve kayıt | Geçti; içerik kartın içinde kayar, devam düğmesi görünür. |
| 4 | Güvenlik, onay, dökme ve deneyin tamamlanması | Geçti; amaç ve çıkış düğmeleri görünür, mevcut zaman çizelgesi korunur. |
| 5 | Gözlem kaydı, küçültme/geri açma ve karşılaştırma | Geçti; tek gözlem kartı kalır, kayıtlar korunur, alt gezinme görünür. |
| 6 | Açıklama, ilk gerekçeler penceresi ve öğrenci metni | Geçti; alanlar erişilebilir, metin kaydedilir, mobilde kontroller taşmaz. |
| 7 | 3B tanecik incelemesi, görünüm/mod değiştirme ve zaman sürgüsü | Geçti; dönüş düğmesi kayan içerikten ayrılır ve içerikle üst üste binmez. |
| 8 | Model rolleri, seçim kutusu ve model kaydı | Geçti; model kaydedildi onayı ve koleksiyon kaydı görüldü. |
| 9 | Rehberin beş sekmesi ve gezinme | Üç yatay telefon boyutunda toplam 15 durum geçti; rehberde yatay/dikey kaydırma gerekmedi. |
| 10 | Koleksiyon, aktif deneye dönüş ve ayarlar | Geçti; kayıt listesi kendi içinde kayar, alttaki düğmeler ekran içinde kalır. |

## Düzeltilen sorunlar

- 568×320 seçim kartındaki başlık/filtre taşması giderildi. Telefonlarda madde görselleri kısaltılarak formüllere ve adlara yer açıldı.
- Mobil öğrenme kartlarının başlığında madde formülleri ve küçük görseller tutuldu; uzun madde adları masaüstünde korunur. Küçük yatay ekranlarda giriş açıklaması gizlenerek forma yer açıldı.
- Gözlem alt düğmeleri eşit sütunlara alındı. 568×320 ekranında içerik alanı 26 px yerine 131 px oldu.
- Açıklama alt araçları iki sıraya, model türleri dört sütuna düzenlendi. Uzun içerik dikey kayar; kart dışında yatay kaydırma oluşmaz.
- 3B inceleme kontrollerine ayrı bir kaydırma bölgesi eklendi. Geri dönüş düğmesi bu bölgenin dışında kalır.
- Koleksiyon kartı mobil ekran yüksekliğine sınırlandı; kayıt listesi kayarken başlık ve alt kontroller korunur. Önceden 468 px'e uzanan kart 568×320 ekranına sığar.
- Dokunmatik metin girişleri 16 px kullanır. Sayfa yakınlaştırmasını engelleyen viewport kısıtları kaldırıldı. Güvenlik ve uzun formlarda mevcut dikey kaydırma korunur.

## Masaüstünün korunması

Yeni yerleşim kuralları `css/mobile.css` içinde en fazla 1024 px genişlik ve 650 px yükseklikteki yatay ekranlara sınırlandı. Dokunmatik giriş yazı boyutu ayrı bir dar ekran sorgusundadır. 3B incelemenin yeni içerik sarmalayıcısı masaüstünde `display: contents` kullanır; koleksiyona eklenen sınıfların masaüstü stili yoktur.

Seçim, tahmin, gözlem, karşılaştırma, açıklama, model ve 3B inceleme için değişiklik öncesi/sonrası masaüstü panel konumları ve boyutları karşılaştırıldı: yedi ekranın tamamı geçti (1 px ölçüm toleransı). Masaüstü renk, yazı boyutu ve kart düzeni bu mobil düzenlemede değiştirilmedi.

## Teknik doğrulama ve kanıtlar

- Son tarayıcı ölçümleri: 42 ekran/durum kaydı, 15 rehber durumu; model kaydına kadar gerçek menü ve form etkileşimleri.
- Kayıt sonrası koleksiyonun saklandığı, yeni deneyden koleksiyona geçildiği ve aktif deneye dönüldüğü görüldü.
- Son tarayıcı konsolunda hata görülmedi.
- Sekiz Node doğrulama paketi geçti: seçim, tahmin, gözlem, deney, tekrar oynatma, tanecik modelleri, katı akışı ve sıvı yüzeyi. Akış/model paketleri 132 sıralı madde eşleşmesini kapsar; bu sayı tarayıcıda fiziksel cihaz testi sayısı değildir.
- `node --check` ile değiştirilen JavaScript dosyaları ve Git satır sonu duyarlı whitespace kontrolü geçti.
- Yerel kanıtlar `artifacts/mobile-qa/` altında: `all-metrics.json`, `desktop-comparison.json`, `mobile-flow-contact.jpg`, ekran görüntüleri. Bu üretilen dosyalar Git'e dahil edilmez.

## Sınırlar

Kontroller tarayıcı görünüm alanı değişiklikleri ve DOM ölçümleridir. Fiziksel Android/iOS, Safari, ekran okuyucu ve gerçek sanal klavye testi yapılmadı. 844×240 kontrolü yalnızca daralan düzeni ve metin girişini doğrular. Tam erişilebilirlik uygunluğu iddia edilmez. Uzun formların kart içindeki dikey kaydırması bilinçli olarak korunur.
