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

Kontroller 66 eşleşmenin her iki seçim sırasında güncel seçim, tahmin, dökme, gözlem ve tanecik verilerini sınar. Gerçek 3B görünüm ve etkileşim kontrolleri için `verify-beaker-particles-browser.cjs`, `verify-explanation-browser.cjs` ve `verify-experiment-browser.cjs` kullanılır. Bu betikler Playwright ve Windows Microsoft Edge gerektirir; ekran görüntülerini yerel QA veya sistemin geçici klasörlerine yazar; bu çıktılar Git deposuna dahil edilmez.

Sıcaklıklar, derişimler ve tepkime hızları nicel fizik hesaplamasıyla üretilmez. Mevcut sıcaklık değerleri eğitim senaryosundan alınmıştır. Laboratuvar tanecik incelemesi aynı 3B beherleri kullanır; açıklama kartındaki küçük şematik çizimler aynı atom şablonlarını kullanır. 36 senaryonun tümü bu değişiklik kapsamında bağımsız bilimsel doğrulamadan geçirilmemiştir.

## Görselli madde seçimi

Madde seçimi masaüstünde 4 × 3 beher kartıyla açılır. Seçilen kartlar 1. ve 2. beher olarak işaretlenir; seçim yeniden tıklanarak kaldırılabilir. İki farklı madde seçildiği anda **Tahmin aşamasına geç** düğmesi etkinleşir; görsel dolum geçişi gezinmeyi bekletmez. Geçiş öğrenci bu düğmeye bastığında gerçekleşir. Deney sırasında küçük seçim özeti kaldırılır; yerini anlık hacim, kütle ve nominal derişim kartı alır.

İlerleme sırası **1. Seç → 2. Tahmin → 3. Deney → 4. Açıkla → 5. Model** şeklindedir. Açıklamanın son kartındaki **Model Aşamasına Geç** düğmesi açıklamayı kaydeder ve tanecik ilişkilendirme kartını açar. 3B incelemeden dönüş, açıldığı Açıkla veya Model kartına yapılır. İlk tahmin ve gözlem kayıtları korunur.

## Tanecik modeli

Model aşaması, Açıkla’dan taşınan **Tanecikleri ilişkilendiriyorum** etkinliğidir. `js/model.js` türlerin rol seçimlerini, bu seçimlerle güncellenen ilişki şemasını ve 3B beherlere gidip aynı karta dönüşü yönetir. Denklem kurma, katsayı/faz alanları ve korunumu gösteren terazi kaldırılmıştır. Mevcut tanecik şablonları ve öğretim modeli `js/explanation-model.js` üzerinden ortak kullanılır; bağımsız kimya kuralları üretilmez.

**Modelimi Kaydet**, bütün tanecik rolleri öğretim modeliyle uyumlu olduğunda modeli kaydeder. Eksik veya farklı roller için geri bildirim gösterilir. Doğrulanan tanecik modeli laboratuvar günlüğüne kaydedilir; aynı içerik yeni sürüm oluşturmaz.

Taslaklar gözlem kimliği ve madde çiftiyle `tepkime_arenasi_particle_models_v1` anahtarında tutulur. Önceki Açıkla taslaklarındaki rol seçimleri ilk açılışta Model’e aktarılır; açıklama metni ve geçmişi korunur. Geçici **Test İçin Doldur** düğmesi yalnızca Model rollerini doldurur; kaydetmez. `js/model.js` içindeki `TEST_TOOLS_ENABLED` ile kapatılır. `node scripts/verify-explanation-browser.cjs` iki aşamanın ayrımını, gidiş/dönüşü, kayıtları ve 132 sıralı çiftin rollerini doğrular.

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

Kamera, kartların açılması, yenilenmesi, küçültülmesi, geri açılması, taşınması, ayarlar, aşama başlığının sıkıştırılması ve kayıt/kart gezinmesi nedeniyle yeniden çerçevelenmez. `refreshLayout` yalnızca arayüz konumlarını günceller; kamera perspektifini gerçek ekran boyutu değişimi günceller. Tahminden deney aşamasına geçiş, istenen açık istisna olarak Masa görünümünü seçer. Sağ alttaki kalıcı bar +/− yakınlık düğmelerini ve Beherleri Merkeze Al komutunu sunar; düşük opaklıktadır, üzerine gelince veya klavye odağında belirginleşir. Tam tahmin/gözlem kartı ve güvenlik penceresinde gizlenir. Her +/− tıklaması uzaklığı 1,2 oranıyla değiştirir; hareket yumuşak gerçekleşir ve art arda tıklamalar hedef uzaklık üzerinden birikir. Fare, dokunma ve klavye etkinleştirmesi desteklenir; fare tekerleğiyle gezinme korunur. Merkezleme yalnızca düğmeye basılınca görünür yan kartları ve üst başlığı ölçer; iki beheri ve görünür termometreyi kalan boş alana, tanecik örneklerine de kenar payı bırakarak yumuşakça sığdırır. Dökme ağzı da beher sınırına dahildir. Küçültülmüş gözlem simgesi, taşındığı konumdan bağımsız olarak merkezleme hesabına katılmaz; gerçek yan paneller hesaba katılmaya devam eder. Kart işlemleri sonrasında bu hesap otomatik tekrarlanmaz. Hareketi azalt tercihi geçişleri anlık yapar. Tanecik incelemesi açıldığında iki beher ve dış tanecik örnekleri, sağ kontrol kartının dışında kalan alana sığdırılır. Gerçek ekran boyutu değişince bu çerçeve yenilenir; evre değişimi kamerayı oynatmaz. Dönüşte önceki kamera konumu, hedefi, görüş açısı ve yakınlık sınırları geri yüklenir. `node scripts/verify-learning-cards-browser.cjs` kart düzenlerini ve kamera sabitliğini, `node scripts/verify-beaker-particles-browser.cjs` 3B incelemeyi ve kayıtların korunmasını sınar.

Eski taşınabilir gözlem simgesi ve mercek görünümüne ait kodlar ve testler kaldırılmıştır; geçerli kontroller öğrenme kartı, deney, açıklama ve beher tanecik betikleridir.

## Beherlerde 3B tanecik incelemesi

Açıkla ve Model kartlarındaki **3B Beherleri İncele**, aynı laboratuvarın beherlerinde atom ve bağ modellerini gösterir. Tanecikler mevcut WebGL sahnesindeki küre ve bağ örnekleridir; ikinci tuval veya büyütülmüş dairesel kesit bulunmaz. Başlangıçta ilk beherin kartı birinci beherin solunda, ikinci beherin kartı ikinci beherin sağında durur. Aktarım tamamlandığında tek karışım kartı iki beherin ortasında gösterilir. Zeminleri kamera yakınlık araçlarıyla aynı cam rengini ve bulanıklığı kullanır; metinler okunur kalırken zemin %44 yoğunluktadır. İkinci kartın opaklığı aktarılan miktarla azalır; aktarım tamamlandığında gizlenir. İlk kart karışma sırasında “Karışımda kalanlar” ve “Karışım ürünleri” başlıklarıyla güncellenir. Zaman çizgisinde geri gidildiğinde veya başlangıç görünümü seçildiğinde iki kart da geri gelir. Etiketli örnekler içerideki taneciklerle aynı atom şablonlarını ve renkleri kullanır. İnceleme boyunca camın geçirgenliği değiştirilerek taneciklerin koyu yansımalarla tekrarlanması önlenir; çıkışta cam malzemeleri geri yüklenir.

**Dökülmeden önce**, iki beherin ilk bileşimini; **Tepkimeyi izle**, aktarımı ve ürün oluşumunu gösterir. Zaman çizgisi istenen ana götürür; son konumda hareket sürer. Duraklatma düğmesi yoktur. **Normal görünüm** tanecikleri gizler; canlı zaman ve hareket sürer. Normal/tanecik görünümü düğmesiyle geri dönülür. Kamera fare, dokunma ve mevcut yakınlık araçlarıyla incelenir; ayrı bir odak halkası veya mercek kontrolü bulunmaz.

`js/particle-inspection.js` paneli, `js/beaker-particles.js` 3B atom/bağ örneklerini ve salt okunur deney tekrarını yönetir. Atom kimlikleri dönüşüm boyunca korunur. İlk tahmin, gözlem, deney miktarları, sıcaklık kaydı, açıklama metni ve Model rol seçimleri değiştirilmez. İncelemeden çıkış açıldığı Açıkla veya Model kartına döner; kamera, cam malzemeleri ve GPU kaynakları bırakılır/geri yüklenir.

`js/particle-models.js` 12 maddenin 132 sıralı çifti için dengeli nitel modeller üretir. Su açıkça fakat seyreltilmiş sayıda çizilir. Başlangıç miktar oranları sınırlı bir tam sayı kesitiyle temsil edilir; görünen tanecik adetleri gerçek derişim veya denge hesabı değildir. HCl suda H₃O⁺ ve Cl⁻ ile, güçlü elektrolitler ayrılmış iyonlarla, zayıf baz NH₃ çoğunlukla moleküllerle gösterilir. Kuru iyonik katılar başlangıçta örgü kesiti olarak durur; çözünebilen katılar suya temas edince dağılır. Gaz molekülleri yükselir, katı örgüler çökelip titreşir, seyirci iyonlar ve katalizörler korunur. Her çekirdeğin kimliği dönüşüm boyunca korunur. Tepkime olmayan çiftlerde ürün üretilmez.

Yollar, bağ çizgileri, kristal kesitleri ve zamanlama öğretim şemasıdır; gerçek moleküler dinamik, kristalografi, çözünürlük dengesi veya hız hesabı değildir. Kısmi dönüşümler nitel gösterimdir. Fazla amonyak/yüksek klorür gibi mevcut senaryo varsayımları ilgili görünümde açıkça belirtilir. Net iyon ve korunuma ilişkin başvuru: [OpenStax Chemistry 2e, 4.1](https://openstax.org/books/chemistry-2e/pages/4-1-writing-and-balancing-chemical-equations). Mevcut makroskobik deneyin senaryo sonuçları değiştirilmemiştir.

Güncel kontroller: `node scripts/verify-particle-models.cjs` 132 sıralı çiftte atom/yük korunumunu sınar. `node scripts/verify-beaker-particles-browser.cjs` aynı çiftlerde beher içindeki atomların sınırlarını, tek WebGL sahnesini, sürekli hareketi, kamera/kart geri dönüşlerini ve öğrenci kayıtlarını doğrular. Beş ekran boyutunda iki tema denetlenir; görüntüler `artifacts/beaker-particles-qa` altındadır. `--layout-only` yerleşim ve temel etkileşimleri çalıştırır.

Uygulama öncesi tam yedek: `Masaüstü/tepkime-arenasi/tepkime-arenasi-tanecik-oncesi-20261017-191409`. Açık Word dosyasının geçici kilit dosyası hariç 1.900 dosya (80.094.444 bayt) SHA-256 ile doğrulandı; `backup-manifest.json` yedek klasöründedir. Önceki masaüstü yedekleri korunmuştur.




## Taneciklerle açıklama çalışma alanı

Açıkla tek karttır. Başlıkta **4. Açıkla · Açıklamamı yazıyorum** ve iki maddenin görselli özeti bulunur. Model kartı aynı başlık, yazım, renk ve madde özeti stilini kullanır. Önceki beş gözlem masaüstü/mobil yatayda tek sırada, salt okunur tikler olarak gösterilir; emin değilim yanıtı ara işaretlidir. İlk tahmin ve gerekçeler bağlantısı bu satırın üstündeki kaydırılabilir yerel `dialog` penceresini açar. Değişim yorumu ve kaydedilen gözlem iki yan yana karttır; kısa açıklama alanı alttadır. Dar dikey ekranda bu bölümler alt alta gelir.

Öğrenci kimyasal/fiziksel değişim veya henüz karar veremedim seçeneklerinden birini ve kendi açıklamasını kaydeder. Metin alanının örnek açıklama ipucu, yalnızca alan boş ve odak başka yerdeyken gösterilir; odaklanınca kaybolur. Bu metin DOM içeriğine, taslağa veya açıklama geçmişine öğrenci yanıtı olarak eklenmez. Boş yanıt kaydedilemez. Metin alanı 112 px, mobil yatayda 88 px; yazı boyutu 13/12 px'dir. Alt/üst simge ve normal yazı araçları ile Ctrl+=, Ctrl+Shift+= ve Ctrl+Boşluk korunur. Otomatik kimyasal yazım düzeltme düğmesi kaldırılmıştır.

**3B Beherleri İncele** ve **Test İçin Doldur**, alt gezinme ve kayıt düğmeleriyle aynı alandadır. Test aracı tek kartın hem yorumunu hem örnek açıklamasını doldurur; kaydetmez. **Deneyi Tekrar Gözle** kayıtlı gözlem kartından salt okunur deney tekrarını açar. Deney/3B incelemeden birleşik karta dönüş, açıklama metnini, yorumu ve kaydırmayı korur. İlk tahmin, gözlem ve gerçek deney kayıtları değişmez. Model’e geçiş yorum ve boş olmayan açıklama gerektirir; açıklamanın bilimsel niteliği otomatik puanlanmaz.

Taslak, yorum, geçmiş ve eski tanecik rol kayıtları `tepkime_arenasi_explanations_v1` içinde gözlem kimliğiyle saklanır. `layoutVersion:3` önceki tek/iki/üç kartlı taslakların metnini, yorumunu ve geçmişini korur. Depolama engellenirse oturum içi taslak korunur ve durum mesajı gösterilir. Editör yalnızca metin, satır sonu, `sub` ve `sup` saklar; yapıştırılan içerik düz metne çevrilir. Deney oturumunun tamamı sayfa yenilenmesinden sonra otomatik geri yüklenmez.

`node scripts/verify-explanation-browser.cjs`, 132 sıralı çiftte tek kartın doldurulup kaydedilmesini ve Model’e geçişi; boş/odaklı/odaksız ipucunu, biçimlendirme/kısayolları, eski taslakları, değişmez kayıtları, kayıt geçmişini, depolama engelini ve 12 tema/ekran görünümünü sınar. Görseller `artifacts/explanation-qa/combined-*` altındadır. `node scripts/verify-experiment-replay.cjs` 132 sıralı çiftte salt okunur deney tekrarını doğrular.

## Kart ve aktarım görünümü iyileştirmeleri

Açıkla ve Model, Deney ile aynı başlık ve madde özetlerini kullanır. Gözlem yorumu ve açıklama yazımı birleşik Açıkla kartında gösterilir. Gözlem kartı açılıp kapanırken etkileşimli DOM kopyalanmaz; tek kartın odağı, kaydırması ve öğrenci verileri korunur. Masaüstü seçim kartı yaklaşık %10 daraltılmıştır ve düğme etiketleri 12 px'dir. Okundu işaretli güvenlik maddelerinin simgeleri de olumlu renge geçer.

`js/liquid-surface.js` eğilen beherdeki sıvı yüzeyini silindirin sınırlarına kırpar ve dünya uzayında yatay tutar. Renksiz sıvı ve akış görünürlüğü artırılmıştır. `js/powder-motion.js` yüksek eğimde kalan katıyı ağızda opak bir tabaka yerine azalan sayıda ayrı granül olarak gösterir; deney miktarları ve aktarım zamanlaması değişmez. `node scripts/verify-liquid-surface.cjs`, `node scripts/verify-powder-motion.cjs` ve `node scripts/verify-requested-fixes-browser.cjs` bu davranışları denetler; son betiğin görselleri `artifacts/requested-fixes-qa/` altındadır.
