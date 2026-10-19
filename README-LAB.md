# Sıcak Sınıf Tepkime Laboratuvarı

Tepkime Arenası'nın 12 maddeli etkinliği, `3b-lab/sicak-sinif-laboratuvari` oda geometrisiyle birleştirildi. Eğitim akışı ve mevcut 36 tepkime senaryosu korunur; diğer 30 eşleşme belirgin tepkime olmayan karışımlar olarak ele alınır.

## Açma

Komutları depoyu indirdiğiniz proje klasöründe çalıştırın.

Windows’ta bu klasördeki `baslat.bat` dosyasına çift tıklayın (8080 portu). Yerel sunucu bu klasörden başlar ve tarayıcı açılır. Sunucu penceresi açık kalmalıdır; kapatınca önizleme durur. Python kurulu olmalıdır.

Alternatif olarak bu klasörde PowerShell açıp çalıştırın:

```powershell
py -3 scripts/start-preview.py
```

`http://127.0.0.1:8173/index.html` adresini açın. Three.js modülleri için HTTP önizleme kullanılır. Sunucu yalnızca bu bilgisayardan erişilebilir. Durdurmak için terminalde Ctrl+C kullanın.

## Deney akışı

1. Arenaya girin. Sol kart panelinden iki farklı madde seçin.
2. İlk kart 1. behere, ikinci kart 2. behere doldurulur. Doldurma tamamlanınca tahmin düğmesi açılır.
3. Beklenen değişimleri seçip tahmini kaydedin.
4. İlk beher/dökme etkileşiminde sanal deney uyarısını onaylayın. İkinci beheri sola sürükleyin veya Beheri Dök düğmesini kullanın. Sağa sürüklemek aynı hareket yolunu geri alır; aktarılan madde geri dönmez.
5. Dijital sıcaklık değerini ve gaz/çökelti/renk belirtilerini inceleyin.
6. Gözlemini kaydet, tahmininle karşılaştır ve Açıkla aşamasına geç. Kayıtlı gözlemlerini yorumla, tanecik rollerini ilişkilendir ve açıklamanı yaz. Aynı 3B beherleri inceleyip karta dönerek açıklamanı geliştir.

Kartlar deney sırasında kilitlenir. Yeni deney düğmesi seçimi ve önceki deneyi temizler. Fare tekerleğiyle yakınlaşıp uzaklaşabilirsiniz; kamera oda sınırlarının içinde tutulur. Masa yeşildir. Beherlerin en-boy oranı korunur; deneyin rahat görülebilmesi için gösterim boyutu büyütülmüştür. Katılar beyaz toz, bakır(II) nitrat mavi çözelti, diğer başlangıç çözeltileri renksizdir. İki kuru katı karıştırıldığında sıvı oluşturulmaz. Deterjan içermeyen senaryolarda gaz kabarcıkları gösterilir; sabun köpüğü oluşturulmaz.

Başlangıçta oda görünür; tahminden deneye geçiş Masa görünümünü seçer. Kart işlemlerinde kamera kendiliğinden yeniden yaklaşmaz. Maddeler beher tabanından yukarı doğru dolar. Seçili maddelerin kartları ve beherlerin önündeki isimlikler üzerine gelindiğinde parçacık animasyonu gösterilir. Otomatik ve manuel dökme aynı yaklaşma/eğilme/dönüş yolunu kullanır. Ayrı bir hedef bölgesi çizilmez. Sıvı aktarımı akış, damlacık ve yüzey dalgasıyla gösterilir.

## Dosyalar

- `js/app.js`: seçim, tahmin, deney, gözlem ve açıklama aşamalarının yönlendirmesi.
- `js/explanation.js`: kanıtlar, öğrenci rolleri, güvenli alt/üst simgeli editör, tahmin penceresi, taslaklar ve açıklama geçmişi.
- `js/chemical-writing.js`: tanınan kimyasal gösterimlerin güvenli ve geri alınabilir biçim düzeltmesi.
- `js/explanation-model.js`: laboratuvarla aynı tanecik modelinden türler, roller ve şematik atom çizimleri.
- `js/lab-scene.js`: sıcak sınıf geometrisi, iki beher, toz/sıvı aktarımı ve deney animasyonları.
- `js/chemistry-visuals.js`: başlangıç görünümü, karışım fazları ve seyirci iyon listesi.
- `js/data.js`: mevcut tepkime içerikleri, deney koşulu notları ve fiziksel karışım açıklamaları.
- `css/lab-world.css`: kart paneli, görev paneli ve ekran boyutuna göre düzen.
- `scripts/verify-selection.cjs`: 132 seçim sırasının güncel öğrenci akışı kontrolleri.

## Doğrulama

```powershell
node scripts/verify-selection.cjs
node scripts/verify-prediction.cjs
node scripts/verify-experiment.cjs
node scripts/verify-observation.cjs
node scripts/verify-particle-models.cjs
node scripts/verify-powder-motion.cjs
```

Kontroller 66 eşleşmenin her iki seçim sırasında güncel seçim, tahmin, dökme, gözlem ve tanecik verilerini sınar. Gerçek 3B görünüm ve etkileşim kontrolleri için `verify-particle-lens-browser.cjs`, `verify-explanation-browser.cjs` ve `verify-experiment-browser.cjs` kullanılır. Bu betikler Playwright ve Windows Microsoft Edge gerektirir; ekran görüntülerini yerel QA veya sistemin geçici klasörlerine yazar; bu çıktılar Git deposuna dahil edilmez.

Sıcaklıklar, derişimler ve tepkime hızları nicel fizik hesaplamasıyla üretilmez. Mevcut sıcaklık değerleri eğitim senaryosundan alınmıştır. Laboratuvar tanecik incelemesi aynı 3B beherleri kullanır; açıklama kartındaki küçük şematik çizimler aynı atom şablonlarını kullanır. 36 senaryonun tümü bu değişiklik kapsamında bağımsız bilimsel doğrulamadan geçirilmemiştir.

## Görselli madde seçimi

Madde seçimi masaüstünde 4 × 3 beher kartıyla açılır. Seçilen kartlar 1. ve 2. beher olarak işaretlenir; seçim yeniden tıklanarak kaldırılabilir. İki farklı madde seçilip doldurma tamamlandığında **Tahmin aşamasına geç** düğmesi etkinleşir. Geçiş öğrenci bu düğmeye bastığında gerçekleşir. Deney sırasında küçük seçim özeti kaldırılır; yerini anlık hacim, kütle ve nominal derişim kartı alır.

İlerleme sırası **1. Seç → 2. Tahmin → 3. Deney → 4. Açıkla** şeklindedir. Tanecik modeli incelemesi Açıkla aşamasının içindedir; ayrı bir Model kartı yoktur. 3B inceleme sırasında Açıkla adımı etkin kalır. İlk tahmin ve gözlem kayıtları korunur.

## Gerekçeli tahmin

Tahmin, geniş ana kartta beş belirtiyi birlikte gösterir: gaz, yeni katı/çökelti, renk, sıcaklık artışı ve sıcaklık düşmesi. Her biri için Evet/Hayır/Kararsızım ve en fazla 240 karakterlik gerekçe alınır. İlk durumda bütün kararlar boştur. Hiçbiri seçimi beş kararı Hayır yapar; gerekçeleri silmez. Tüm gerekçeler tamamlanmadan veya hem artış hem düşüş beklenirken kayıt yapılamaz.

`js/prediction.js` bu kararları, yerel kayıtları ve sonuç karşılaştırmasını; `css/prediction.css` yalnızca ilgili kartı biçimlendirir. **Tahminimi kaydet** mevcut kartta kaydı onaylar ve **Deney aşamasına geç** düğmesini etkinleştirir. **Deney aşamasına geç** üçüncü adımı açar; maddeleri karıştırmak için mevcut Beheri Dök/sürükleme etkileşimi kullanılır. Üçüncü adıma geçildikten sonra özgün karar ve gerekçeler değiştirilemez. Yanlış veya kararsız tahminler Açıkla adımına geçişi engellemez; gerekçelerin bilimsel niteliği otomatik puanlanmaz.

Kayıtlar `tepkime_arenasi_predictions_v1` anahtarıyla bu tarayıcının localStorage alanında saklanır; maddeleri, kararları, gerekçeleri ve kayıt/deneye geçiş zamanlarını içerir. Tahmin kartındaki geçmiş kayıt listesi şu anda gösterilmez. Sunucuya veya öğretmen hesabına aktarılmaz. Tarayıcı depolamasına erişilemezse kayıt oturum belleğinde tutulur ve bu sınırlama kartta açıkça belirtilir. Tarayıcı verilerinin temizlenmesi yerel kayıtları da kaldırır.

Sıcaklık artış/düşüş karşılaştırması, simülasyonun başlangıç ve son termometre değerlerine dayanır. Önceki tek `temp` bayrağına bağlı değildir; böylece termometrede gösterilen küçük artışlar da karşılaştırmada korunur. Mevcut senaryolarda sıcaklık düşüşü yoktur; yeni bir soğuma senaryosu eklenmemiştir. Gaz, çökelti ve renk için mevcut senaryo gözlemleri kullanılır.

Doğrulama: `node scripts/verify-prediction.cjs` karar/gerekçe doğrulamasını, belirsizliği, yerel kayıtların okunmasını, ilk kayıt korumasını, depolama hatasını ve sıcaklık yönünü kontrol eder. `node scripts/verify-selection.cjs` 132 seçim sırasını yeni kaydet/deneye geç akışı üzerinden sonuç ve Açıkla adımına kadar doğrular.

`js/beaker-model.js`, deney masasıyla kart görsellerinin kullandığı ortak 100 ml cam modelidir. `image/reagents/` altındaki üç WebP; beyaz katı, renksiz çözelti ve mavi çözelti için bu modelden üretilir. Kartlar ek WebGL sahnesi açmaz. Model değişirse, Playwright bulunan bir Node.js ortamında görselleri yeniden üretin:

```powershell
node scripts/render-reagent-previews.cjs
```

Yeni seçim akışı ve model/görsel eşleşmesi için `node scripts/verify-selection.cjs` çalıştırılır. Bu test 66 eşleşmeyi her iki seçim sırasında, toplam 132 senaryoda tahmin, dökme ve sonuç aşamalarından geçirir. Görsel test yerine geçmez. Eski rapor/model testleri kaldırılmıştır; güncel açıklama kontrolü `node scripts/verify-explanation-browser.cjs` ile çalışır.

## Deney aşaması: aynı yol üzerinde manuel aktarım

`js/experiment.js`, özgün 5 saniyelik otomatik hareketin anahtar konumlarını ve aktarım durumunu paylaşır. İkinci beher sola sürüklendikçe aynı yol ilerletilir, sağa sürüklendikçe geri alınır. Eğilme bölümünde sola ilerlemek akışı hızlandırır. Daha önce aktarılan madde geri alınmaz. Bırakılan beher aynı yoldan masaya döner; kısmi miktar korunur ve tekrar tutularak devam edilir. Mevcut sağ deney/gözlem kartı korunur. Tepkime, sıcaklık ve sonuç karşılaştırması yalnızca aktarımın tamamı bitip beher masaya döndükten sonra başlar.

İlk beher veya Beheri Dök etkileşimi güvenlik onayını açar. Otomatik işlem onaydan sonra sürer; manuel işlem için beher tekrar tutulur. Deneyi Yeniden Başlat aynı maddeleri ve kilitli özgün tahmini korur, miktarları/sıcaklığı sıfırlar ve eski sonuç zamanlayıcılarını geçersiz kılar. Tepkenleri Değiştir madde galerisine döner. Bu kontroller anlık veri kartındadır. `css/experiment.css` yalnızca bu aşamadaki veri/güvenlik kartlarını ve yerleşimini düzenler.

Örnek başlangıç koşulları: her sulu çözelti **50 mL, 0,10 mol/L**; kuru NaHCO₃, CaCO₃ ve susuz Na₂CO₃ maddelerinin her biri **1,000 g**. Katılar, beherdeki yığınların daha görünür olması için aynı başlangıç kütlesini kullanır. Bunlar `MebiExperiment.defaults` içinde tanımlanmış eğitim koşullarıdır. Mol miktarları her maddenin kendi mol kütlesiyle hesaplanır; tanecik modeli de bu oranları kullanır. `MebiExperiment.initialAmount` canlı miktarlar, gözlem özeti ve nitel tanecik modelinin ortak başlangıç kaynağıdır; tanecik sayıları bu mol oranlarından sınırlı sayıda temsili birime yuvarlanır. Çözeltiler için hacim ve giren madde miktarı hesabı korunur; kuru katılara molar derişim veya sıvı hacmi atanmaz. Birinci beherdeki nominal giriş derişimleri C₀V₀/V ve C₀Vaktarılan/V ile hesaplanır; tepkimede tüketilen miktarı, serbest iyonu veya ürün derişimini ifade etmez. Çözelti hacimleri yaklaşık toplanır; katıların hacim etkisi ve tepkime nedeniyle hacim değişimi hesaplanmaz. Mevcut senaryo sıcaklıkları ve nitel tepkime sonuçları korunur. Katı ve sıvı görselleri bu sınırlamalarla eğitim modelidir.

Doğrulama:

```powershell
node scripts/verify-experiment.cjs
node scripts/verify-powder-motion.cjs
node scripts/verify-prediction.cjs
node scripts/verify-selection.cjs
node scripts/verify-experiment-browser.cjs
```

Tarayıcı dışındaki betikler yerel durum/veri ve katı geometrisi testleridir; sonuncusu Playwright ve Edge/Chromium kullanır, kendisi geçici bir yerel sunucu açar ve kapatır. Tarayıcı testi güvenlik onayını, özgün otomatik/manuel yol eşleşmesini, sağa sararken miktarın korunmasını, kısmi bırakma ve dönüşü, tamamını boşaltmayı, eski zamanlayıcıların iptalini, katıları ve masaüstü/telefon yatay görünümünü denetler. Ekran görüntüleri sistemin geçici `tepkime-experiment-qa` klasörüne yazılır.

Değişiklik öncesi tam proje yedeği: `yedekler/2026-10-15_15-02-30_deney-asamasi-oncesi/`. 437 dosya SHA-256 ile doğrulandı; özet dosyası `YEDEK-DOGRULAMA.json` içindedir. Yedekler Git'e dahil edilmez.

Madde kartlarında hâl bilgisi adın yanında gösterilir; görsel alanı büyütülmüştür. Kart ve deney çözeltileri 50 mL seviyesini kullanır; iki sıvının tam aktarımı yaklaşık 100 mL karışım verir. Tanecik görünümünün sıvı yüzeyleri de aynı hacmi kullanır. Katıların sahne yığını başlangıç kütlesiyle orantılı olarak küçülür; bu görünüm gerçek yığın yoğunluğunu temsil etmez. `js/powder-motion.js`, katı yığınını yerçekimine göre yeniden şekillendirir, iç duvar boyunca dökme ucuna taşır ve taneli akışla bağlar. Katı aktarımı, yığın ağza ulaşacak kadar eğildikten sonra başlar; kuru katıyı tamamen boşaltmak için beher sıvılara göre daha fazla eğilir. Bu, yoğunluk veya gerçek toz akış hızı hesabı değil, hacmini koruyan bir görsel modeldir.

## Deney aşamasında öğrencinin gözlem kaydı

Karışım tamamlanınca tahmin aşamasındaki gibi geniş ana kartta beş belirti için Gözledim / Gözlemedim / Emin Değilim seçenekleri ve en fazla 400 karakterlik ortak gözlem notu açılır. Başlangıç ve son sıcaklıkları sanal termometreden alınır. Canlı kartın termometresi 0–100 °C ölçeğinde dolarak 22 °C başlangıcı %22 konumunda gösterir. Form hazır tepkime sonuçlarıyla doldurulmaz. Beş seçim ve boş olmayan bir not olmadan kayıt yapılamaz; başlangıç/son sıcaklığına göre artış ve düşüş aynı anda işaretlenemez.

`js/observation.js` kaydı deneme kimliğine ve kilitli ilk tahmine bağlar; öğrenci yanıtlarını, miktarları, sıcaklıkları ve ilk tahminin kopyasını saklar. Kayıttan sonra aynı gözlem kartı açık kalır ve Tahmin ve Gözlemi Karşılaştır düğmesi etkinleşir. Karşılaştırma yalnızca öğrencinin ilk tahmini ile kendi gözlemini karşılaştırır; uyumlu sonuçlar yeşil tikle, farklı sonuçlar kırmızı çarpıyla, kararsız yanıtlar sarı soru işaretiyle gösterilir. Bunlar öğrencinin iki kaydı arasındaki uyumu gösterir; senaryodaki beklenen sonuçları öğrencinin gözlemi olarak sunmaz. Karşılaştırma kartındaki gözlem kaydedildi bildirimi kaldırılmıştır. Kaydettiğim Gözlem ve Tahminimde Ne Değişti alanları ayrı vurgulu panellerdedir. İlk gözlem değiştirilmez; isteğe bağlı karşılaştırma notu ayrı güncellenir. Kayıt tek başına 4. Açıkla aşamasına geçirmez; Açıkla geçiş düğmesi yalnızca karşılaştırma kartında görünür ve yeni açıklama kartını açar.

Kayıtlar yalnızca kullanılan tarayıcıda `tepkime_arenasi_observations_v1` anahtarında tutulur; sunucuya gönderilmez. Yerel depolama kullanılamıyorsa kayıt oturumda korunur ve kartta uyarı gösterilir. Deneyi Yeniden Başlat yeni deneme kimliği ve boş gözlem formu oluşturur; önceki yerel kaydı ve özgün tahmini korur. Seçimler ve notlar kayıt öncesinde mevcut deney oturumunda taslaktır.

Deney tamamlandıktan sonra gözlem kartı gecikme sonunda doğrudan ana kart olarak açılır. Tahmin, gözlem ve karşılaştırmada simge durumuna küçültme ve sürükleme kaldırılmıştır. Gözlem seçimleri, ortak not ve karşılaştırma bu geniş kartta yapılır; ilerleme 3. Deney olarak kalır. `css/observation.css` bu kartın iç yerleşimini düzenler. Masaüstünde belirtiler ve gözlem notu yan yanadır; dar ekranda alt alta gelir. Başlık ve alt eylemler görünür kalır; sekmeler kaldırılmıştır. gerektiğinde içerik kart içinde kaydırılır. Deney Masasını İncele karışımın bulunduğu laboratuvara döner, Gözlem Kartına Dön kayıt veya taslağı kaybetmeden ana kartı tekrar açar. Yeniden başlatma ana karttan da yapılabilir. Laboratuvar ve mevcut dökme yolu korunur.

Tahmin, gözlem ve karşılaştırma kartlarında iki maddenin özeti başlık alanında yan yana yer alır. Tahmin ve gözlem belirtileri, ortak sütun başlıkları altında tek seçimli tik kutularıyla kompakt tablolardır; karşılaştırma tablosu ilk tahmin ile öğrencinin kayıtlı gözlemini gösterir. Gerekçe, gözlem ve yeniden değerlendirme metin kutuları iki görünür satır yüksekliğinde kalır; uzun içerik kutunun içinde kaydırılır, mevcut 240/400 karakter sınırları ve kayıtlar korunur. Mobil yatayda giriş metinleri 11 px, seçim alanları en az 32 px olarak düzenlenir. `css/learning-cards.css` bu ortak yerleşimi yönetir; küçültme kaldırılmıştır; Deneyi Gözle şeridi ve kamera sabitliği korunur. `node scripts/verify-learning-cards-browser.cjs` dört ekran boyutu ve iki temada 24 görünümü, klavyeyi, tek seçim davranışını, uzun metinlerin korunmasını, değişmez kayıtları ve kamera sabitliğini denetler.

Gözlem doğrulaması: `node scripts/verify-observation.cjs`. `verify-selection.cjs` 132 madde sırasını gözlem kaydından geçirir; `verify-experiment-browser.cjs` gerçek dökme sonrası kayıt, karşılaştırma, değişmez ilk kayıt, karşılaştırmaya klavye/düğmeyle geçiş, yeniden başlatma ve farklı ekran boyutlarını da sınar.

Bu değişiklikten önceki tam proje yedeği: `yedekler/2026-10-15_17-27-11_gozlem-kaydi-oncesi/`. 486 dosya (20.032.463 bayt), SHA-256 ile doğrulandı. Döküm `YEDEK-DOGRULAMA.json` içindedir; yedek klasörü Git'e dahil edilmez.

Sol üstteki **Deney Masası Düzeneği**, masaüstü ve mobil yatayda tek satır başlıkla, birinci maddenin başlangıç miktarını, ikinci beherde kalan miktarı, karışımı ve yatay termometreyi dikey sırada gösterir. İlk/anlık/son sıcaklık ve ΔT korunur; son sıcaklık deney bitene kadar gösterilmez. Formüller verideki kimyasal harf düzenini korur. Derişimler C₁/C₂ sırasıyla giriş esaslı nominal değerlerdir; tepkime sonrası kalan tepken derişimleri değildir. Bu uyarı kartta gösterilmez. Mavi miktar çubukları ve 50 mL/1 g katı miktarları korunur. Kimyasal formüller açık mavi oval rozetlerde gösterilir; eğitim modeli alt yazısı kaldırılmıştır. Sağ aktarım kartı soldaki veri kartıyla aynı genişliktedir; Yeniden Başlat ve Tepkenleri Değiştir eylemleri alt alta, aynı ikincil düğme stilindedir. Aktarım kartındaki 3. Aşama: Deney etiketi kaldırılmıştır. Kart `css/experiment-card.css` içindedir. Deneyi Gözle seçildiğinde anlık veri kartı solda görünür. Gözlem/karşılaştırma kartı yatayda ekranın ortasındaki cam şeride katlanır; şerit kamera kontrol barıyla aynı cam renklerini, kenarlığı, bulanıklığı ve %44 opaklığı kullanır; üzerine gelince veya klavye odağında görünür hâle gelir. Kart işlemleri kamerayı değiştirmez. Termometre sabit 0–100 °C ölçeği ve başlangıç işareti kullanır.

Kamera, kartların açılması, yenilenmesi, küçültülmesi, geri açılması, taşınması, ayarlar, aşama başlığının sıkıştırılması ve kayıt/kart gezinmesi nedeniyle yeniden çerçevelenmez. `refreshLayout` yalnızca arayüz konumlarını günceller; kamera perspektifini gerçek ekran boyutu değişimi günceller. Tahminden deney aşamasına geçiş, istenen açık istisna olarak Masa görünümünü seçer. Sağ alttaki kalıcı bar +/− yakınlık düğmelerini ve Beherleri Merkeze Al komutunu sunar; düşük opaklıktadır, üzerine gelince veya klavye odağında belirginleşir. Tam tahmin/gözlem kartı ve güvenlik penceresinde gizlenir. Her +/− tıklaması uzaklığı 1,2 oranıyla değiştirir; hareket yumuşak gerçekleşir ve art arda tıklamalar hedef uzaklık üzerinden birikir. Fare, dokunma ve klavye etkinleştirmesi desteklenir; fare tekerleğiyle gezinme korunur. Merkezleme yalnızca düğmeye basılınca görünür yan kartları ve üst başlığı ölçer; iki beheri ve görünür termometreyi kalan boş alana, tanecik örneklerine de kenar payı bırakarak yumuşakça sığdırır. Dökme ağzı da beher sınırına dahildir. Küçültülmüş gözlem simgesi, taşındığı konumdan bağımsız olarak merkezleme hesabına katılmaz; gerçek yan paneller hesaba katılmaya devam eder. Kart işlemleri sonrasında bu hesap otomatik tekrarlanmaz. Hareketi azalt tercihi geçişleri anlık yapar. Tanecik merceği açıldığında beherler soldaki boş alana sığdırılır; bu yerleşim ekran boyutu değişince yenilenir. Odak veya evre değişimi kamerayı oynatmaz. Kartına dönüşte merceğe girmeden önceki kamera konumu, hedefi ve görüş açısı geri yüklenir. `node scripts/verify-learning-cards-browser.cjs` güncel kart düzenlerini ve kamera sabitliğini, `node scripts/verify-particle-lens-browser.cjs` merceğe giriş/çıkışı ve kayıtların korunmasını sınar.

Eski taşınabilir gözlem simgesi ve tam beher tanecik görünümüne ait tarayıcı beklentileri güncel akıştan kaldırılmıştır; geçerli kontroller yukarıdaki öğrenme kartı, deney, açıklama ve mercek betikleridir.

## Normal beherler ve yüzen tanecik merceği

Açıkla kartındaki 3B Beherleri İncele düğmesi aynı laboratuvarı açar. Beherler daha uzaktan çerçevelenerek normal sıvı, katı, çökelti ve cam görünümüyle soldadır; beherlerin içinde atom küreleri çizilmez. Seçili bölgeye kesikli çizgiyle bağlı büyük dairesel tanecik kesiti bağımsız olarak beherlerin yakınında yüzer. Mercek zemini laboratuvarı hafif gösteren, arka planı bulanıklaştırarak tanecikleri ayıran yarı saydam cam görünümündedir. Evre, zaman çizgisi, mercek yakınlığı ve diğer kontroller en sağdaki karttadır. 1. Beher ve 2. Beher aktarım öncesini, Karışırken aktarımı, Son durum karışım sonrasını açar. Dört görünümde de tanecik hareketi sürekli sürer; duraklatma düğmesi yoktur. İlk iki görünüm aktarım öncesi bileşimi, son görünüm ürün bileşimini canlı hareketle gösterir. Karışırken görünümünde aktarım ve ürün oluşumu kendiliğinden ilerler; zaman çizgisi istenen ana götürür ve canlı gösterim oradan sürer. Merceği gizlemek deneyi durdurmaz.

Odak halkası fare, dokunma veya yön tuşlarıyla beherde kesintisiz taşınır; sıvıya dokunmak da odağı o bölgeye alır. Home odağı ortalar. Hareket zaman çizgisini veya laboratuvar kamerasını değiştirmez. Merceğin kenarı fare veya dokunmayla sürüklenerek ekran üzerinde taşınır; merceğin herhangi bir noktasında sağ fare tuşuyla sürüklemek de aynı taşıma işlevini yapar. Merceğin içindeki sağ tık menüsü bu işlem için kapatılır; kenara klavyeyle odaklanınca yön tuşları taşır, Home başlangıç konumuna döndürür. Mercek, sağ kontrolleri kapatmayacak ve ekrandan çıkmayacak şekilde sınırlandırılır; ekran boyutu değişince konumu uyarlanır. Mercek içindeki sürükleme 3B kesiti döndürür; tekerlek yalnızca mercekteki görüş alanını büyütüp küçültür. Kesit seçeneklerinde döndürme ve yakınlık düğmeleri ile çözücü suyu gösterme seçeneği bulunur. Atomu izle düğmesi kaldırılmıştır. Bir atoma doğrudan dokunmak onu işaretler, elementini, bulunduğu türü ve hangi beherden geldiğini gösterir; Seçimi temizle bu işareti kaldırır. Kamera atomu takip etmez. Su seçeneği çözücüyü gizler; tepkimede oluşan su ürünleri görünür kalır. Formül rozetleri yalnızca o kesitteki türleri listeler; boş kesitte odağı taşıma önerisi görünür.

`js/particle-inspection.js` arayüzü, `js/beaker-particles.js` ortak 3B atom konumlarını ve oynatma saatini, `js/particle-lens.js` bu konumların dairesel tuvalde ikinci izdüşümünü yönetir. İkinci WebGL bağlamı veya ayrı kimyasal model oluşturulmaz. Küreler derinlik sırasıyla, bağlarla ve küresel ışık yansımasıyla çizilir; taneciklerin sağ altına ek oval gölge çizilmez. Gösterim nitel bir tanecik modelidir; gerçek mikroskop görüntüsü değildir. Çıkışta mercek verileri ve olay dinleyicileri bırakılır; öğrenci açıklaması, etkin açıklama kartı, tahmin/gözlem kayıtları ve gerçek deney miktarları korunur.

`js/particle-models.js` 12 maddenin 132 sıralı çifti için dengeli nitel modeller üretir. Su açıkça fakat seyreltilmiş sayıda çizilir. Başlangıç miktar oranları sınırlı bir tam sayı kesitiyle temsil edilir; görünen tanecik adetleri gerçek derişim veya denge hesabı değildir. HCl suda H₃O⁺ ve Cl⁻ ile, güçlü elektrolitler ayrılmış iyonlarla, zayıf baz NH₃ çoğunlukla moleküllerle gösterilir. Kuru iyonik katılar başlangıçta örgü kesiti olarak durur; çözünebilen katılar suya temas edince dağılır. Gaz molekülleri yükselir, katı örgüler çökelip titreşir, seyirci iyonlar ve katalizörler korunur. Her çekirdeğin kimliği dönüşüm boyunca korunur. Tepkime olmayan çiftlerde ürün üretilmez.

Yollar, bağ çizgileri, kristal kesitleri ve zamanlama öğretim şemasıdır; gerçek moleküler dinamik, kristalografi, çözünürlük dengesi veya hız hesabı değildir. Kısmi dönüşümler nitel gösterimdir. Fazla amonyak/yüksek klorür gibi mevcut senaryo varsayımları ilgili görünümde açıkça belirtilir. Net iyon ve korunuma ilişkin başvuru: [OpenStax Chemistry 2e, 4.1](https://openstax.org/books/chemistry-2e/pages/4-1-writing-and-balancing-chemical-equations). Mevcut makroskobik deneyin senaryo sonuçları değiştirilmemiştir.

Güncel kontroller: `node scripts/verify-particle-models.cjs` tüm 132 çiftte atom/yük korunumunu, tepkimesiz çiftleri ve katalizörleri sınar. `node scripts/verify-particle-lens-browser.cjs` aynı 132 çiftte gerçek merceği, dört canlı evreyi, fare/dokunma/klavye odağını, merceğin kenarından taşınmasını ve merceğe özel tekerlek yakınlığını, normal beher görünümünü, ayrı mercek/kontrol yerleşimini, kesit dönüşünü, su seçeneğini, atom kimliklerini ve değişmez öğrenci kayıtlarını sınar. Beş ekran boyutunda iki tema denetlenir; görüntüler `artifacts/particle-lens-qa` altındadır. `--layout-only` yalnızca yerleşim ve temel etkileşimleri çalıştırır. Önceki tam beher tanecik görünümüne ait detail/visuals/camera/beaker betikleri ve eski gözlem simgesi kontrolleri kaldırılmıştır. Mercek kontrollerinin yerini bu test, gözlem ve güvenlik kontrollerinin yerini güncel deney/açıklama/öğrenme kartı testleri alır.

Uygulama öncesi tam yedek: `Masaüstü/tepkime-arenasi/tepkime-arenasi-tanecik-oncesi-20261017-191409`. Açık Word dosyasının geçici kilit dosyası hariç 1.900 dosya (80.094.444 bayt) SHA-256 ile doğrulandı; `backup-manifest.json` yedek klasöründedir. Önceki masaüstü yedekleri korunmuştur.




## Taneciklerle açıklama çalışma alanı

Açıklama alanı üç ilerlemeli karttan oluşur: Gözlemimi yorumluyorum → Tanecikleri ilişkilendiriyorum → Taneciklerle açıklıyorum. Her seferinde tek kart görünür. İlk kartta önceki gözlem seçimleri değiştirilemeden gösterilir. Öğrenci kimyasal değişim, fiziksel değişim veya henüz karar veremedim seçeneklerinden biriyle ilk yorumunu yapınca ikinci kart açılır; ikinci kartta her taneciğe bir rol seçilince yazı kartı açılır; önceki kartlara dönülebilir. Etkin kart taslakla birlikte saklanır. İlk kartın Deneyi Tekrar Gözle düğmesi deneyi otomatik olarak baştan oynatır ve Yorum Kartına Dön düğmesiyle aynı karta döndürür. Tekrar, ayrı bir sunum saati ve deney kopyası kullanır: 5 saniyelik aktarım ve 9 saniyeye kadar değişim gösterimi; gerçek deney, tahmin, gözlem, sıcaklık kaydı ve açıklama değişmez. Katı ve sıvıların akış başlangıcı ortak dökme modeliyle eşleşir. Tekrar her açılışta sıfırdan başlar. İkinci kartta 3B Beherleri İncele bağlantısı bulunur; dönüşte aynı tanecik kartı, roller ve açıklama metni korunur. Her tür tepkimeye katılan, katı/çökelti, gaz, oluşan su, diğer ürün, seyirci iyon, katalizör veya diğer değişmeden kalan olarak atanabilir. Şema öğrencinin seçimlerini gösterir; dengelenmiş denklem yerine türler arasındaki nitel ilişkiyi temsil eder. Artan tepkenler seyirci diye sınıflandırılmaz; katalizör ayrı tutulur. Kuru çözünmeyen katılar serbest iyonlara ayrılmaz.

Rollerimi Gözden Geçir, mevcut 3B modelle rol uyumunu kontrol eder; öğrencinin metnine otomatik bilimsel doğruluk puanı vermez. Kayıt için bir ilk yorum, her taneciğe rol ve boş olmayan açıklama gerekir. Hiçbir belirti gözlenmediğinde veya kararsız gözlemlerde de ilerlenebilir. İlk yorum, tanecik modeli incelendikten sonra değiştirilebilir; taslak ve açıklama sürümleriyle saklanır. Eski taslaklarda gözlemler asıl kayıttan alınır, ilk yorum ilk kartta tamamlanırken metin, roller ve geçmiş korunur. Hatalı fikirler kayda engel değildir. İlk açıklama ve sonraki değişen sürümler ayrı korunur; aynı içerik tekrar kaydedildiğinde kopya sürüm oluşmaz. Tamamlanan tepkime koleksiyona eklenir.

Editör yalnızca metin, satır sonları, `sub` ve `sup` biçimini saklar; yapıştırılan içerik düz metne çevrilir. Simgeli alt/üst simge araçları Word benzeri aç/kapa davranışı kullanır: seçili metni biçimlendirir; seçim yoksa sonraki yazılacak karakterlerin biçimini değiştirir. Alt ve üst simge birbirini dışlar. Normal yazı aracı seçili metni veya imlecin yazım biçimini normalleştirir. Düğmelerin basılı durumu imlece göre güncellenir. Editörde Ctrl+= alt simge, Ctrl+Shift+= üst simge ve Ctrl+Boşluk normal yazı kısayolları vardır. Taslak, roller, kanıtlar ve açıklama geçmişi `tepkime_arenasi_explanations_v1` yerel deposunda gözlem kimliğiyle tutulur; etkin kart numarası da kaydedilir. Depolama engellenirse oturum içi içerik korunur ve durum mesajı gösterilir. Deney oturumunun tamamı sayfa yenilenmesinden sonra otomatik geri yüklenmez.

`node scripts/verify-explanation-browser.cjs`: 132 sıralı çiftin model/rol ayrımları; karttan 3B'ye gidiş ve dönüş, biçimlendirme, klavye seçimi, değişmez tahmin/gözlem, açıklama geçmişi, HTML temizleme, beş ekran boyutu, iki tema ve üç kartta toplam 30 görünüm. Görseller `artifacts/explanation-qa/` altındadır.


### Geçici açıklama test araçları

Her açıklama kartındaki Test İçin Doldur düğmesi yalnızca etkin kartı doldurur: ilk değişim yorumu, modeldeki tanecik rolleri veya seçilen deneye ait örnek açıklama. Kartı otomatik ilerletmez, açıklamayı göndermez ve ilk tahmin/gözlem kaydını değiştirmez. Bu üç düğmeyi tek yerden kapatmak için `js/explanation.js` içindeki `TEST_TOOLS_ENABLED` değerini `false` yapın.


### Açıklama kartının kanıt ve yazım araçları

Başlık, aşama bilgisi ve `tepken + tepken → ?` ovali tek satırdadır. Önceki gözlemler kompakt simgeli, salt okunur kutularda gösterilir: gözledim yanıtları seçili, gözlemedim yanıtları seçilmemiş, emin değilim yanıtları ara işaretlidir. İlk yorum için üç seçenekten biri seçilir; kimyasal ve fiziksel değişim seçeneklerinin ikisi birden seçilemez. Henüz karar veremedim seçeneği de ilerlemeye izin verir. Yorum seçmeden devam edilirse yorum grubu kırmızı vurgulanır, ilk seçeneğe odaklanılır ve hata ikonu içeren erişilebilir uyarı gösterilir. İlk tahmin ve gerekçeler, kartın boyunu değiştirmeyen ortalanmış, kaydırılabilir yerel `dialog` penceresinde açılır; Escape veya kapat düğmesiyle kapanır.

Küçük yazım araçlarındaki sihirli değnek simgesi, tüm açıklamada tanınan formüllerin büyük/küçük harf, alt/üst simge ve açıkça yazılmış iyon yükü biçimlerini düzenler. Örnekler: `H2O → H₂O`, `Cu+2 → Cu²⁺`, `NO3- → NO₃⁻`, `CO3-2 → CO₃²⁻`. Bilinen formüle çözümlenen O/0 karışıklıkları da düzeltilir (`H20 → H₂O`). Katsayılar, sıcaklıklar, normal metin ve tanınmayan ifadeler korunur; eksik iyon yükü tahmin edilmez, denklem denkleştirilmez ve bilimsel açıklama otomatik notlanmaz. Düzeltme Ctrl+Z ile tek işlemde geri alınabilir. Aynı düzeltmenin tekrar uygulanması yeni değişiklik oluşturmaz.

`node scripts/verify-experiment-replay.cjs`, 132 sıralı çiftte tekrarın başlangıç/aktarım/son durumunu ve kayıtların korunmasını kontrol eder. Açıklama tarayıcı testi otomatik tekrarı, tahmin penceresinin masaüstü/mobil merkezlenmesini, hata görünümünü, gözlem seçimlerinin asıl kayıttan salt okunur gelmesini, üç ilk yorumun ilerlemeye izin vermesini, yorumun sürümlenmesini, eski taslakların korunmasını ve kimyasal düzeltme/geri alma davranışını da doğrular.
