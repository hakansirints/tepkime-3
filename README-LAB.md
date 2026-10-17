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
6. Rapor ve çoklu tepkime türü değerlendirmesine, ardından tanecik incelemesine geçin.

Kartlar deney sırasında kilitlenir. Yeni deney düğmesi seçimi ve önceki deneyi temizler. Fare tekerleğiyle yakınlaşıp uzaklaşabilirsiniz; kamera oda sınırlarının içinde tutulur. Masa yeşildir. Beherlerin en-boy oranı korunur; deneyin rahat görülebilmesi için gösterim boyutu büyütülmüştür. Katılar beyaz toz, bakır(II) nitrat mavi çözelti, diğer başlangıç çözeltileri renksizdir. İki kuru katı karıştırıldığında sıvı oluşturulmaz. Deterjan içermeyen senaryolarda gaz kabarcıkları gösterilir; sabun köpüğü oluşturulmaz.

Laboratuvara girildiğinde önce oda görünür, ardından kamera deney düzeneğine yaklaşır. Maddeler beher tabanından yukarı doğru dolar. Seçili maddelerin kartları ve beherlerin önündeki isimlikler üzerine gelindiğinde parçacık animasyonu gösterilir. Otomatik ve manuel dökme aynı yaklaşma/eğilme/dönüş yolunu kullanır. Ayrı bir hedef bölgesi çizilmez. Sıvı aktarımı akış, damlacık ve yüzey dalgasıyla gösterilir.

## Dosyalar

- `js/app.js`: seçim, doldurma bekleme durumu, tahmin, rapor ve değerlendirme.
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

Kontroller 66 eşleşmenin her iki seçim sırasında güncel seçim, tahmin, dökme, gözlem ve tanecik verilerini sınar. Gerçek 3B görünüm ve etkileşim kontrolleri için `verify-beaker-particles-browser.cjs`, `verify-particle-visuals-browser.cjs`, `verify-particle-camera-browser.cjs` ve `verify-lab-controls-browser.cjs` kullanılır. Bu betikler Playwright ve Windows Microsoft Edge gerektirir; ekran görüntülerini geçici klasöre yazar.

Sıcaklıklar, derişimler ve tepkime hızları nicel fizik hesaplamasıyla üretilmez. Mevcut sıcaklık değerleri eğitim senaryosundan alınmıştır. Laboratuvar tanecik incelemesi aynı 3B beherleri kullanır; ayrıca açıklama ekranında SVG modeller bulunur. 36 senaryonun tümü bu değişiklik kapsamında bağımsız bilimsel doğrulamadan geçirilmemiştir.

## Görselli madde seçimi

Madde seçimi masaüstünde 4 × 3 beher kartıyla açılır. Seçilen kartlar 1. ve 2. beher olarak işaretlenir; seçim yeniden tıklanarak kaldırılabilir. İki farklı madde seçilip doldurma tamamlandığında **Tahmin aşamasına geç** düğmesi etkinleşir. Geçiş öğrenci bu düğmeye bastığında gerçekleşir. Deney sırasında küçük seçim özeti kaldırılır; yerini anlık hacim, kütle ve nominal derişim kartı alır.

İlerleme sırası **1. Seç → 2. Tahmin → 3. Deney → 4. Açıkla → 5. Model** şeklindedir. Madde seçimi boyunca ilk adım etkindir; devam düğmesi ikinci adımı etkinleştirir. Deney aşamasına geçişten deney sonucuna kadar üçüncü adım, rapor ekranında dördüncü adım, tanecik ekranında beşinci adım gösterilir.

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

Yeni seçim akışı ve model/görsel eşleşmesi için `node scripts/verify-selection.cjs` çalıştırılır. Bu test 66 eşleşmeyi her iki seçim sırasında, toplam 132 senaryoda tahmin, dökme ve sonuç aşamalarından geçirir. Görsel test yerine geçmez. Önceki `verify-chemistry.cjs` ve `verify-lab.cjs` betikleri eski otomatik geçişi ve eski panel düzenini varsayar; yeni seçim ekranının doğrulaması için kullanılmamalıdır. `verify-chemistry.cjs` eski açılış başlığı, bağımlılık yüklemesi ve etkileşim akışını varsaydığı için güncel arayüzün kontrolü değildir.

## Deney aşaması: aynı yol üzerinde manuel aktarım

`js/experiment.js`, özgün 5 saniyelik otomatik hareketin anahtar konumlarını ve aktarım durumunu paylaşır. İkinci beher sola sürüklendikçe aynı yol ilerletilir, sağa sürüklendikçe geri alınır. Eğilme bölümünde sola ilerlemek akışı hızlandırır. Daha önce aktarılan madde geri alınmaz. Bırakılan beher aynı yoldan masaya döner; kısmi miktar korunur ve tekrar tutularak devam edilir. Mevcut sağ deney/gözlem kartı korunur. Tepkime, sıcaklık ve sonuç karşılaştırması yalnızca aktarımın tamamı bitip beher masaya döndükten sonra başlar.

İlk beher veya Beheri Dök etkileşimi güvenlik onayını açar. Otomatik işlem onaydan sonra sürer; manuel işlem için beher tekrar tutulur. Deneyi Yeniden Başlat aynı maddeleri ve kilitli özgün tahmini korur, miktarları/sıcaklığı sıfırlar ve eski sonuç zamanlayıcılarını geçersiz kılar. Tepkenleri Değiştir madde galerisine döner. Bu kontroller anlık veri kartındadır. `css/experiment.css` yalnızca bu aşamadaki veri/güvenlik kartlarını ve yerleşimini düzenler.

Örnek başlangıç koşulları: her sulu çözelti **40 mL, 0,10 mol/L**, her kuru katı **1,00 g**. Bunlar `MebiExperiment.defaults` içinde açıkça tanımlanmış eğitim koşullarıdır; gerçek deney reçetesi değildir. Çözeltiler için hacim ve giren madde miktarı hesabı korunur; kuru katılara molar derişim veya sıvı hacmi atanmaz. Birinci beherdeki nominal giriş derişimleri C₀V₀/V ve C₀Vaktarılan/V ile hesaplanır; tepkimede tüketilen miktarı, serbest iyonu veya ürün derişimini ifade etmez. Çözelti hacimleri yaklaşık toplanır; katıların hacim etkisi ve tepkime nedeniyle hacim değişimi hesaplanmaz. Mevcut senaryo sıcaklıkları ve nitel tepkime sonuçları korunur. Katı ve sıvı görselleri bu sınırlamalarla eğitim modelidir.

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

Madde kartlarında hâl bilgisi adın yanında gösterilir; görsel alanı büyütülmüştür. Kart ve deney çözeltileri 40 mL seviyesini kullanır. `js/powder-motion.js`, katı yığınını yerçekimine göre yeniden şekillendirir, iç duvar boyunca dökme ucuna taşır ve taneli akışla bağlar. Katı aktarımı, yığın ağza ulaşacak kadar eğildikten sonra başlar; kuru katıyı tamamen boşaltmak için beher sıvılara göre daha fazla eğilir. Bu, yoğunluk veya gerçek toz akış hızı hesabı değil, hacmini koruyan bir görsel modeldir.

## Deney aşamasında öğrencinin gözlem kaydı

Karışım tamamlanınca tahmin aşamasındaki gibi geniş ana kartta beş belirti için Gözledim / Gözlemedim / Emin Değilim seçenekleri ve en fazla 400 karakterlik ortak gözlem notu açılır. Başlangıç ve son sıcaklıkları sanal termometreden alınır. Form hazır tepkime sonuçlarıyla doldurulmaz. Beş seçim ve boş olmayan bir not olmadan kayıt yapılamaz; başlangıç/son sıcaklığına göre artış ve düşüş aynı anda işaretlenemez.

`js/observation.js` kaydı deneme kimliğine ve kilitli ilk tahmine bağlar; öğrenci yanıtlarını, miktarları, sıcaklıkları ve ilk tahminin kopyasını saklar. Kayıt sonrasında Karşılaştır sekmesi yalnızca öğrencinin ilk tahmini ile kendi gözlemini karşılaştırır; senaryodaki beklenen sonuçları öğrencinin gözlemi olarak sunmaz. İlk gözlem değiştirilmez; isteğe bağlı karşılaştırma notu ayrı güncellenir. Kayıt tek başına 4. Açıkla aşamasına geçirmez; mevcut geçiş düğmesi kayıttan sonra açılır. Açıkla ve Model içerikleri değiştirilmemiştir.

Kayıtlar yalnızca kullanılan tarayıcıda `tepkime_arenasi_observations_v1` anahtarında tutulur; sunucuya gönderilmez. Yerel depolama kullanılamıyorsa kayıt oturumda korunur ve kartta uyarı gösterilir. Deneyi Yeniden Başlat yeni deneme kimliği ve boş gözlem formu oluşturur; önceki yerel kaydı ve özgün tahmini korur. Seçimler ve notlar kayıt öncesinde mevcut deney oturumunda taslaktır.

Deney tamamlandıktan sonra gözlem kartı dikkat çeken taşınabilir bir simge olarak belirir; öğrenci simgeye tıklayınca tahmin aşamasıyla aynı `prediction-card` ana kartında açılır. Gözlem seçimleri, ortak not ve karşılaştırma bu geniş kartta yapılır; ilerleme 3. Deney olarak kalır. `css/observation.css` bu kartın iç yerleşimini düzenler. Masaüstünde belirtiler ve gözlem notu yan yanadır; dar ekranda alt alta gelir. Başlık, sekmeler ve alt eylemler görünür kalır; gerektiğinde içerik kart içinde kaydırılır. Deney Masasını İncele karışımın bulunduğu laboratuvara döner, Gözlem Kartına Dön kayıt veya taslağı kaybetmeden ana kartı tekrar açar. Yeniden başlatma ana karttan da yapılabilir. Laboratuvar ve mevcut dökme yolu korunur.

Gözlem doğrulaması: `node scripts/verify-observation.cjs`. `verify-selection.cjs` 132 madde sırasını gözlem kaydından geçirir; `verify-experiment-browser.cjs` gerçek dökme sonrası kayıt, karşılaştırma, değişmez ilk kayıt, klavye sekmeleri, yeniden başlatma ve farklı ekran boyutlarını da sınar.

Bu değişiklikten önceki tam proje yedeği: `yedekler/2026-10-15_17-27-11_gozlem-kaydi-oncesi/`. 486 dosya (20.032.463 bayt), SHA-256 ile doğrulandı. Döküm `YEDEK-DOGRULAMA.json` içindedir; yedek klasörü Git'e dahil edilmez.

Deney masasında miktarlar ve dökme kontrolleri tek sağ kartta birleştirilmiştir; ayrı sol veri kartı ve deney sırasındaki tekrar tahmin listesi kaldırılmıştır. Karışım ve kaynak beherinin mavi çubukları aktarım miktarıyla birlikte güncellenir. Çözelti çubukları ortak 0–100 mL ölçeğini kullanır; katılar için açıkça belirtilen gram ölçeği kullanılır. Sıvı/katı karışımında hacim ve eklenen katı ayrı çubuklardır. Derişimler ve model koşulları aynı kartta açılır bölümde korunur. Yeniden başlatma başlangıç miktarlarına ve çubuklarına döner. Deney sonundaki geniş gözlem kartı, kayıt ve karşılaştırma akışı korunur; masayı yeniden inceleyince de miktarlar aynı birleşik karttadır.

## Aynı 3B beherlerde tanecik incelemesi

Tahmin ve gözlem kayıtları tamamlanınca gözlem kartında ve Açıkla kartının süreç analizi bölümünde **Dökülmeden önce** ve **Tepkimeyi izle** düğmeleri açılır. Bu görünüm özgün laboratuvar sahnesindeki aynı iki beheri kullanır. Beherlerin içindeki tanecikler etiketsizdir; aynı renk ve atom düzenindeki etiketli örnekler sol beherin solunda ve sağ beherin sağında bulunur. Tekrar oynatmada dökme tamamlanınca sağdaki örnek kartı kapanır; karışımda kalanlar ve karışım ürünleri, sol beherin yanındaki tek kartın iki bölümünde gösterilir. Tanecik modunda cam kırılması kapatılarak taneciklerin etrafındaki çift siluetler önlenir; saydam sıvı yüzeyleri hafif dalgalanır. Normal görünüm özgün cam malzemelerini geri getirir. Normal görünüm, duraklatma, zaman çizgisi ve geldiği karta dönüş vardır. Kamera görünüm değişimleri arasında korunur; çıkışta önceki kamera geri yüklenir.

Tanecik görünümünde termometrenin gövdesi ve probu gizlenir; normal görünüme dönünce geri gelir. İşaretçinin bulunduğu noktaya yakınlaşma, beherin içine kadar incelemeye izin verir; yakın kesme düzlemi ve gezinme sınırları çıkışta geri yüklenir. Tekrar dökme sırasında kaynak beherde sıvı veya toz normal görünür; tanecikler alıcı behere ulaştıklarında görünür olur. Dipte oluşan katı kesitleri ayırt edilebilmeleri için 1,4 kat büyük çizilir; atom ve iyon sayıları değişmez. `verify-particle-detail-browser.cjs` bu davranışları, `verify-particle-camera-browser.cjs` fare ve mobil dokunma hareketlerini sınar.

`js/particle-inspection.js` kayıt şartını ve arayüzü yönetir. `js/beaker-particles.js` yalnızca ilk kullanımda yüklenir; var olan çizim motorunda iki `InstancedMesh` ile çalışır. Yeni WebGL çizim yüzeyi açılmaz. Mobilde küre ayrıntısı ve tanecik konumu güncelleme sıklığı düşürülür. Normal görünüme dönüldüğünde tanecik hesabı durur; çıkışta GPU kaynakları bırakılır. Bu tekrar gösterimi gerçek aktarım miktarlarını, ilk tahmin/gözlem kayıtlarını veya kayıtlı sıcaklığı değiştirmez.

`js/particle-models.js` 12 maddenin 132 sıralı çifti için dengeli nitel modeller üretir. Su açıkça fakat seyreltilmiş sayıda çizilir. Başlangıç miktar oranları sınırlı bir tam sayı kesitiyle temsil edilir; görünen tanecik adetleri gerçek derişim veya denge hesabı değildir. HCl suda H₃O⁺ ve Cl⁻ ile, güçlü elektrolitler ayrılmış iyonlarla, zayıf baz NH₃ çoğunlukla moleküllerle gösterilir. Kuru iyonik katılar başlangıçta örgü kesiti olarak durur; çözünebilen katılar suya temas edince dağılır. Gaz molekülleri yükselir, katı örgüler çökelip titreşir, seyirci iyonlar ve katalizörler korunur. Her çekirdeğin kimliği dönüşüm boyunca korunur. Tepkime olmayan çiftlerde ürün üretilmez.

Yollar, bağ çizgileri, kristal kesitleri ve zamanlama öğretim şemasıdır; gerçek moleküler dinamik, kristalografi, çözünürlük dengesi veya hız hesabı değildir. Kısmi dönüşümler nitel gösterimdir. Fazla amonyak/yüksek klorür gibi mevcut senaryo varsayımları ilgili görünümde açıkça belirtilir. Net iyon ve korunuma ilişkin başvuru: [OpenStax Chemistry 2e, 4.1](https://openstax.org/books/chemistry-2e/pages/4-1-writing-and-balancing-chemical-equations). Mevcut makroskobik deneyin senaryo sonuçları değiştirilmemiştir.

Kontroller: `node scripts/verify-particle-models.cjs` tüm 132 çiftte atom/yük korunumunu, tepkimesiz çiftleri ve katalizörleri sınar. `node scripts/verify-beaker-particles-browser.cjs` gerçek 3B sahnede yoğunluğu, dış örnekleri, kayıtlardan bağımsız oynatmayı, kamera/karta dönüşü, açık/koyu temayı ve yatay telefon düzenlerini denetler; bütün çiftlerde taneciklerin cam ve taban sınırlarını kontrol eder. Görüntüler geçici `tepkime-beaker-particles-qa` klasöründedir.

Uygulama öncesi tam yedek: `Masaüstü/tepkime-arenasi/tepkime-arenasi-tanecik-oncesi-20261017-191409`. Açık Word dosyasının geçici kilit dosyası hariç 1.900 dosya (80.094.444 bayt) SHA-256 ile doğrulandı; `backup-manifest.json` yedek klasöründedir. Önceki masaüstü yedekleri korunmuştur.

Tanecik görünümü için görsel kontroller: `node scripts/verify-particle-visuals-browser.cjs` kırılmasız camı, yüzeyleri, dökme sonrası tek kartı, geriye sarma ve normal görünüme dönüşü açık/koyu tema ile masaüstü ve yatay telefon düzenlerinde sınar.
