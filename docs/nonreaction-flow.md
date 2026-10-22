# Tepkime oluşmayan senaryoların öğrenme akışı

## Dallanma

Seç, Tahmin ve Deney aşamaları mevcut davranışını korur. Yeni bir aşama eklenmez.

Yeni yol yalnızca seçilen çiftin `MebiData.getReaction(...).typeCategory === 'none'` olması ve ortak tanecik modelinde kimyasal tepkime tarifinin bulunmaması durumunda açılır. Öğrencinin gözlem yanıtları veya `obs: ['none']` değeri yönlendirme ölçütü değildir. Örneğin AgNO₃–NH₃ kompleksleşmesi mevcut kimyasal akışta kalır.

- **Sulu iyon karışımı:** Kanıt ve karar (4. Açıkla) → önce/sonra eşleştirme (5. Model) → isteğe bağlı iyon sadeleştirme (5. Model alt görünümü).
- **Katının çözündüğü karışım:** Kanıt ve karar → çözünme/çökelti ayrımı ve önce/sonra gösterimi.
- **Kuru katılar:** Kanıt ve karar → katı türlerinin aynı kaldığı karşılaştırma. Su veya sulu iyon eklenmez.
- **Çözünmeyen katı veya nötr molekül içeren diğer karışımlar:** Genel karşılaştırma kullanılır; tüm türler iyon gibi sunulmaz ve iyon sadeleştirmesi açılmaz.

Mevcut 30 tepkimesiz çiftin dağılımı: 8 sulu iyon, 7 çözünme, 3 kuru katı, 12 diğer karşılaştırma. Her iki seçim sırası desteklenir.

## Öğrenci etkileşimi

1. Açıkla ekranı değiştirilmeyen gözlem kaydını, ilk tahmini, üç karar seçeneğini ve öğrencinin gerekçesini gösterir. Kararsızlık bu aşamada geçerli bir yanıttır.
2. Model başlangıç envanterini gösterir; son durum taslağı boş başlar. Türler sürüklenebilir, tıklanabilir veya klavyeyle eklenebilir. Temsili sayılar düzenlenebilir ve türler kaldırılabilir.
3. Çözünme ve mevcut katının karışımda kalması farklı yorumlarla değerlendirilir. Başlangıçtaki bir katı yeni çökelti sayılmaz.
4. Atom ve yük tablosu yazılan sayılarla güncellenir. Başlangıç/son durum envanteri 3B örnekleme çokluğundan arındırılmış ortak bir temsili paketle gösterilir; gerçek tanecik sayısı değildir. Çözücü her iki tarafın sayımından aynı biçimde çıkarılır.
5. Doğrulama tür, fiziksel hâl, temsili sayı, atomlar, yük, fiziksel yorum, yeni ürün kararı ve gerekçeyi birlikte denetler. Sadece toplamların eşit olması yeterli değildir.
6. İyon sadeleştirmesi sadece tam eşleşen sulu iyon envanterlerinde açılır. Bir çift seçildiğinde iki gösterimde birlikte işaretlenir. Tüm çiftler çıkarıldığında “Bu koşullarda net iyon denklemi yazılmaz” sonucu görünür. `0 → 0` veya uydurma ürün yazılmaz.
7. “Modelimi ve sonucumu kaydet” tepkimesiz sonucu laboratuvar günlüğüne ekler. Eksik veya hatalı girişler “Tamam” düğmeli bir kartta açıklanır. Başarılı kayıtta yeni deney ve laboratuvar günlüğü seçeneklerini içeren sonuç kartı açılır. `reaction: false` ve `equation: null` saklanır; tepkime keşif sayacı artmaz.

## Uygulama sınırları

- `js/nonreaction.js` ve `css/nonreaction.css` yeni yolun mantığını ve kapsamlı stillerini içerir.
- Açıkla ve Model modüllerindeki yönlendirme korumaları tepkimeli ekranları değiştirmez.
- Yeni taslaklar gözlem kimliği ve seçilen çifte bağlı `tepkime_arenasi_nonreaction_v1` anahtarında saklanır. Eski kimyasal denklem kayıtları değiştirilmez.
- Kartın masaüstü genişliği mevcut 1188 px sınırını korur. Yükseklik tür sayısına göre büyümez. Liste ve tablo taşmaları içeride kaydırılır, işlem satırı kartın altında kalır.
- Dar yatay ekranlarda düğme adları kısalır; masaüstü adları korunur.

## Doğrulama

`node scripts/verify-nonreaction.cjs` 132 sıralı eşleşmeyi kontrol eder. İsteğe bağlı ikinci argüman değişiklik öncesi yedek klasörüdür; bu durumda 72 tepkimeli seçim sırasının Açıkla ve Model HTML çıktıları yedekle birebir karşılaştırılır.

Tanecik modeli, Deney ve Gözlem kontrolleri de 132 sıralı eşleşmede geçti. Gerçek tarayıcıda KI–CaCl₂ ve Na₂CO₃–KI yolları, yanlış çökelti yorumu, eksik iyon, anlık sayı değişimi, isteğe bağlı sadeleştirme ve laboratuvar günlüğü kaydı denendi. Konsolda hata görülmedi.

İki eski test (`verify-selection.cjs:159`, `verify-prediction.cjs:20`) mevcut arayüz metni beklentilerinde başarısızdır. Aynı hatalar değiştirilmemiş yedekte de tekrarlandı; bu çalışma kapsamında testlerin beklentileri değiştirilmedi.

Görsel kanıtlar `output/nonreaction-qa/` klasöründedir. Kaynak görseller ile uygulama aynı karşılaştırma görüntülerinde, kart genişlikleri normalize edilerek incelenmiştir. Telefon kontrolleri yatay 844×390 ve 568×320 ölçülerinde yapılmıştır; fiziksel telefon/ekran klavyesi testi değildir.
