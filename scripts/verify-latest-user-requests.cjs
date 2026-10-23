const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const os = require('node:os');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const { chromium } = playwright;

const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const file = path.join(root, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
  const ext = path.extname(file);
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
  res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
  fs.createReadStream(file).pipe(res);
});

async function run() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.EDGE_BINARY || (process.platform === 'win32' ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : undefined),
  });

  const passedChecks = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' });

    // Close welcome modal
    await page.evaluate(() => {
      window.localStorage.setItem('tepkime_arenasi_welcomed', '1');
      const overlay = document.getElementById('welcomeModalOverlay');
      if (overlay) overlay.remove();
      TepkimeArenasi.dispatch('goPool');
      TepkimeArenasi.dispatch('clickReagent', 'HCl');
      TepkimeArenasi.dispatch('clickReagent', 'NaOH');
      TepkimeArenasi.dispatch('startExperiment');
    });
    await page.waitForTimeout(300);

    // ==========================================
    // 1. GÖRSEL 1 KONTROLLERİ (Tahmin Ekranı)
    // ==========================================
    // 1.1 Tahminini kaydet butonu kaldırılmış olmalı
    const savePredBtnCount = await page.locator('#savePredictionButton').count();
    assert.equal(savePredBtnCount, 0, 'Tahminini kaydet butonu kaldırılmış olmalı');

    // 1.2 "4 / 5 karar ve gerekçe tamamlandı" ve "Deneye geçmek için tahminini kaydet..." metinleri kaldırılmış olmalı
    const footerText = await page.locator('.prediction-footer').innerText();
    assert.equal(footerText.includes('karar ve gerekçe tamamlandı'), false, 'Tamamlandı sayısı metni kaldırılmış olmalı');
    assert.equal(footerText.includes('Deneye geçmek için tahminini kaydet'), false, 'Yeniden kaydet yönlendirme metni kaldırılmış olmalı');

    // 1.3 Sıcaklık seçenekleri: yükselir seçilirse düşer kalkmalı, düşer seçilirse yükselir kalkmalı, hata mesajı olmamalı
    await page.click('[data-prediction-control="tempRise-yes"]');
    assert.equal(await page.locator('[data-prediction-control="tempRise-yes"]').getAttribute('aria-pressed'), 'true');

    await page.click('[data-prediction-control="tempFall-yes"]');
    assert.equal(await page.locator('[data-prediction-control="tempFall-yes"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-prediction-control="tempRise-yes"]').getAttribute('aria-pressed'), 'false', 'Düşer seçildiğinde yükselir seçimi kalkmalı');

    await page.click('[data-prediction-control="tempRise-yes"]');
    assert.equal(await page.locator('[data-prediction-control="tempRise-yes"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-prediction-control="tempFall-yes"]').getAttribute('aria-pressed'), 'false', 'Yükselir seçildiğinde düşer seçimi kalkmalı');

    const predMsg = await page.locator('#predictionMessage').innerText();
    assert.equal(predMsg.includes('yüksek hem düşük olamaz'), false, 'Sıcaklık seçiminde hata mesajı verilmemeli');
    passedChecks.push('1. Görsel: Sıcaklık seçimleri birbirini otomatik kaldırıyor ve hata mesajı vermiyor');

    // 1.4 Deney aşamasına geç butonuna basıldığında kart üzerinde mesaj görünmeli ve 2 sn sonra deney aşamasına geçmeli
    await page.evaluate(() => {
      MebiPrediction.items.forEach(i=>{MebiPrediction.setChoice(TepkimeArenasi.state,i.key+':unsure');MebiPrediction.setReason(TepkimeArenasi.state,i.key,'Bu belirtiyi deneyde gözlemleyeceğim.');});TepkimeArenasi.render(false);
    });
    await page.waitForTimeout(200);

    const beginBtn = page.locator('#beginExperimentButton');
    assert.equal(await beginBtn.isEnabled(), true, 'Tüm kararlar verilince Deney aşamasına geç butonu aktif olmalı');

    await beginBtn.click();
    await page.waitForTimeout(100);

    // Kart üzerinde Tahmininiz kaydedildi mesajı ve buton pasifliği kontrolü
    const savedStatusText = await page.locator('#predictionSavedStatus').innerText();
    assert(savedStatusText.includes('Tahmininiz kaydedildi'), 'Deney aşamasına geç tıklandığında hemen Tahmininiz kaydedildi mesajı görünmeli');
    assert.equal(await beginBtn.isDisabled(), true, 'Geçiş süresince buton pasif olmalı');

    // 2 saniye sonra deney aşamasına geçmiş olmalı
    await page.waitForFunction(() => TepkimeArenasi.state.labStep === 'ready', { timeout: 4000 });
    passedChecks.push('1. Görsel: Deney aşamasına geç butonuna tıklandığında kartta mesaj göründü ve 2 saniye sonra deneye geçti');

    // ==========================================
    // 2. GÖRSEL 2 KONTROLLERİ (Gözlem Ekranı)
    // ==========================================
    // Deneyi dök ve güvenlik protokolünü onayla
    await page.evaluate(() => {
      TepkimeArenasi.dispatch('triggerPour');
    });
    await page.waitForSelector('.experiment-safety-card');
    await page.click('.experiment-safety-check-all');
    await page.click('#experimentSafetyAccept');

    await page.evaluate(() => {
      const s = TepkimeArenasi.state;
      s.labStep = 'observed';
      s.poured = true;
      s.experiment.transfer = 1;
      s.currentTemp = s.activeReaction.tempFinal;
      TepkimeArenasi.render(false);
    });
    await page.waitForSelector('#observationCard');

    // 2.0 "5 / 5 belirti seçildi" ve "Emin Değilim geçerli bir yanıttır." ifadeleri kaldırılmış olmalı
    const obsFooterText = await page.locator('.observation-footer').innerText();
    assert.equal(obsFooterText.includes('belirti seçildi'), false, '"5 / 5 belirti seçildi" yazısı kaldırılmış olmalı');
    assert.equal(obsFooterText.includes('Emin Değilim geçerli bir yanıttır'), false, '"Emin Değilim geçerli bir yanıttır." yazısı kaldırılmış olmalı');
    passedChecks.push('2. Görsel: "5 / 5 belirti seçildi" ve "Emin Değilim geçerli bir yanıttır." ifadeleri kaldırıldı');

    // 2.1 Sıcaklık barı başlık kenarından aşağıda olmalı (margin-top >= 12px)
    const tempMarginTop = await page.locator('.observation-card .observation-temperature').evaluate(el => {
      return parseInt(window.getComputedStyle(el).marginTop, 10);
    });
    assert(tempMarginTop >= 12, 'Sıcaklık barı başlık kenarından aşağıya alınmış olmalı (margin-top >= 12px)');

    // 2.2 Gözlem notu metin kutusu yüksekliği biraz azaltılmış olmalı (yaklaşık 100-110px)
    const obsNoteHeight = await page.locator('#observationNote').evaluate(el => el.clientHeight);
    assert(obsNoteHeight <= 120 && obsNoteHeight >= 80, `Gözlem notu yüksekliği azaltılmış olmalı (~100px), mevcut: ${obsNoteHeight}px`);

    // 2.3 Boş bırakıldığında soft kırmızı uyarısı hem satırlara hem de gözlem notu metin kutusuna uygulanmalı
    await page.click('#compareObservationButton');
    await page.waitForTimeout(100);

    const noteHasError = await page.locator('#observationNote').evaluate(el => el.classList.contains('has-error'));
    assert.equal(noteHasError, true, 'Boş bırakılan gözlem notuna has-error sınıfı gelmeli');
    const noteBg = await page.locator('#observationNote').evaluate(el => window.getComputedStyle(el).backgroundColor);
    assert.equal(noteBg, 'rgb(254, 242, 242)', 'Gözlem notu soft kırmızı (#fef2f2) arka plana sahip olmalı');

    // 2.4 Sıcaklık onay kutuları birbirini kaldırmalı ve butonlar disabled olmamalı
    await page.click('[data-observation-control="tempRise-yes"]');
    assert.equal(await page.locator('[data-observation-control="tempRise-yes"]').getAttribute('aria-pressed'), 'true');

    await page.click('[data-observation-control="tempFall-yes"]');
    assert.equal(await page.locator('[data-observation-control="tempFall-yes"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-observation-control="tempRise-yes"]').getAttribute('aria-pressed'), 'false', 'Gözlemde düşer seçilince yükselir seçimi kalkmalı');

    await page.click('[data-observation-control="tempRise-yes"]');
    assert.equal(await page.locator('[data-observation-control="tempRise-yes"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-observation-control="tempFall-yes"]').getAttribute('aria-pressed'), 'false', 'Gözlemde yükselir seçilince düşer seçimi kalkmalı');

    const tempRiseDisabled = await page.locator('[data-observation-control="tempRise-yes"]').isDisabled();
    const tempFallDisabled = await page.locator('[data-observation-control="tempFall-yes"]').isDisabled();
    assert.equal(tempRiseDisabled, false, 'Sıcaklık kutusu pasif/disabled olmamalı');
    assert.equal(tempFallDisabled, false, 'Sıcaklık kutusu pasif/disabled olmamalı');
    passedChecks.push('2. Görsel: Sıcaklık onay kutuları pasif olmadan birbirini kaldırıyor ve gözlem notuna soft kırmızı uygulanıyor');

    // 2.5 Tahmin ve gözlemi karşılaştır butonuna tıklandığında mesaj görünmeli ve 2 saniye sonra geçmeli
    await page.evaluate(() => {
      MebiPrediction.items.forEach(i=>MebiObservation.setChoice(TepkimeArenasi.state,i.key+':no'));MebiObservation.setNote(TepkimeArenasi.state,'Karışımın görünüşünü ve termometreyi gözlemledim.');TepkimeArenasi.render(false);
    });
    await page.waitForTimeout(200);

    const compareBtn = page.locator('#compareObservationButton');
    await compareBtn.click();
    await page.waitForTimeout(100);

    const obsSavedText = await page.locator('#observationSavedStatus').innerText();
    assert(obsSavedText.includes('Tahmininiz kaydedildi'), 'Karşılaştır tıklandığında hemen Tahmininiz kaydedildi mesajı görünmeli');
    assert.equal(await compareBtn.isDisabled(), true, 'Geçiş süresince karşılaştır butonu pasif olmalı');

    await page.waitForFunction(() => TepkimeArenasi.state.observation.tab === 'compare', { timeout: 4000 });
    passedChecks.push('2. Görsel: Karşılaştır butonuna tıklandığında kartta mesaj göründü ve 2 saniye sonra karşılaştırma kartına geçti');

    // ==========================================
    // 3. GÖRSEL 3 KONTROLLERİ (Karşılaştırma Ekranı)
    // ==========================================
    // 3.1 Sıcaklık barı başlık kenarından aşağıda olmalı
    const compareTempMarginTop = await page.locator('.observation-card .observation-temperature').evaluate(el => {
      return parseInt(window.getComputedStyle(el).marginTop, 10);
    });
    assert(compareTempMarginTop >= 12, 'Karşılaştırma ekranında da sıcaklık barı aşağıda olmalı');

    // 3.2 "Tahmininde ne değişti" metin kutusunun yüksekliği yarıya inmiş olmalı (rows="3", ~60-75px)
    const reflectionTextarea = page.locator('#observationReflection');
    assert.equal(await reflectionTextarea.getAttribute('rows'), '3', 'Tahmininde ne değişti metin kutusu rows="3" olmalı');
    const reflectionHeight = await reflectionTextarea.evaluate(el => el.clientHeight);
    assert(reflectionHeight <= 80 && reflectionHeight >= 50, `Tahmininde ne değişti yüksekliği yarıya inmiş olmalı (~60-70px), mevcut: ${reflectionHeight}px`);

    // 3.3 "Gözlem kaydedildi." kırmızı/uyarı yazısı kaldırılmış olmalı
    const comparisonText = await page.locator('#observationCard').innerText();
    assert.equal(comparisonText.includes('Gözlem kaydedildi.'), false, '"Gözlem kaydedildi." yazısı kaldırılmış olmalı');
    const obsMsgText = await page.locator('#observationMessage').innerText();
    assert.equal(obsMsgText, '', 'Hata/mesaj alanında "Gözlem kaydedildi." yazısı olmamalı');

    // 3.4 Sıcaklık bilgileri ile Kaydettiğim gözlem kartı arasındaki boşluk yarıya indirilmiş ve kartlar yukarı taşınmış olmalı
    const compGaps = await page.evaluate(() => {
      const temp = document.querySelector('.observation-notes.comparison-evidence .observation-temperature');
      const saved = document.querySelector('.observation-notes.comparison-evidence .observation-saved-note');
      const reflect = document.querySelector('.comparison-reflection');
      const tempRect = temp.getBoundingClientRect();
      const savedRect = saved.getBoundingClientRect();
      const reflectRect = reflect.getBoundingClientRect();
      return {
        gapTempToSaved: savedRect.top - tempRect.bottom,
        gapSavedToReflect: reflectRect.top - savedRect.bottom
      };
    });
    assert(compGaps.gapTempToSaved <= 14, `Sıcaklık ve kaydettiğim gözlem arasındaki boşluk yarıya inmiş olmalı (<= 14px), mevcut: ${compGaps.gapTempToSaved}px`);
    assert.equal(compGaps.gapTempToSaved, compGaps.gapSavedToReflect, 'Kartlar eşit ve dengeli boşlukla yukarı taşınmış olmalı');
    passedChecks.push('3. Görsel: Sıcaklık barı ile kaydettiğim gözlem arasındaki boşluk yarıya indi ve kartlar yukarı taşındı');
    passedChecks.push('3. Görsel: Sıcaklık barı aşağıda, tahmininde ne değişti yüksekliği yarıya indi ve "Gözlem kaydedildi." yazısı kaldırıldı');

    console.log(JSON.stringify({
      passed: true,
      checks: passedChecks
    }, null, 2));

  } finally {
    await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
