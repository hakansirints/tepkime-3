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
    args: ['--enable-webgl', '--ignore-gpu-blocklist']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const passedChecks = [];

  try {
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.TepkimeArenasi && window.MebiData);
    await page.evaluate(() => {
      if (window.MebiUI && window.MebiUI.closeWelcomeModal) window.MebiUI.closeWelcomeModal();
    });

    // ==========================================
    // 1. İSTEM 2: GÜVENLİK PROTOKOLÜ ONAYLANDIĞINDA YEŞİL RENK
    // ==========================================
    await page.evaluate(() => {
      TepkimeArenasi.dispatch('goPool');
      TepkimeArenasi.dispatch('clickReagent', 'HCl');
      TepkimeArenasi.dispatch('clickReagent', 'NaOH');
      TepkimeArenasi.dispatch('startExperiment');
      MebiPrediction.items.forEach(i=>{MebiPrediction.setChoice(TepkimeArenasi.state,i.key+':unsure');MebiPrediction.setReason(TepkimeArenasi.state,i.key,'Bu belirtiyi deneyde gözlemleyeceğim.');});TepkimeArenasi.render(false);
      TepkimeArenasi.dispatch('savePrediction');
      TepkimeArenasi.dispatch('beginExperiment');
      TepkimeArenasi.dispatch('triggerPour');
    });

    await page.waitForSelector('.experiment-safety-card');
    // Başlangıçta 4 uyarı okunmadı
    const cardEl = page.locator('.experiment-safety-card');
    assert.equal(await cardEl.evaluate(el => el.classList.contains('is-all-approved')), false);

    // Hepsini okudum butonuna tıkla
    await page.click('.experiment-safety-check-all');
    await page.waitForTimeout(100);

    // is-all-approved sınıfı eklenmiş olmalı
    assert.equal(await cardEl.evaluate(el => el.classList.contains('is-all-approved')), true, 'Tüm uyarılar işaretlendiğinde is-all-approved eklenmeli');

    // Sarı renkler kalmamış, açık yeşil tonlar gelmiş olmalı
    const safetyColors = await page.evaluate(() => {
      const headerIcon = document.querySelector('.experiment-safety-header-icon');
      const badge = document.querySelector('.experiment-safety-badges .mebi-badge-sunken');
      const note = document.querySelector('.experiment-safety-note');
      return {
        headerIconBg: window.getComputedStyle(headerIcon).backgroundColor,
        badgeBg: window.getComputedStyle(badge).backgroundColor,
        noteBg: window.getComputedStyle(note).backgroundColor
      };
    });
    // #dcfce7 = rgb(220, 252, 231), #f0fdf4 = rgb(240, 253, 244)
    assert.equal(safetyColors.headerIconBg, 'rgb(220, 252, 231)', 'Header ikonu açık yeşil olmalı');
    assert.equal(safetyColors.badgeBg, 'rgb(220, 252, 231)', 'Protokol rozeti açık yeşil olmalı');
    assert.equal(safetyColors.noteBg, 'rgb(240, 253, 244)', 'Not alanı açık yeşil olmalı');
    passedChecks.push('İstem 2: Güvenlik protokolü onaylandığında tüm sarı uyarı renkleri açık yeşile dönüştü');

    // Deneye geç
    await page.click('#experimentSafetyAccept');
    await page.waitForTimeout(200);

    // Deneyi dök ve tamamla
    await page.evaluate(() => {
      TepkimeArenasi.dispatch('triggerPour');
    });
    await page.waitForFunction(() => TepkimeArenasi.state.labStep === 'observed', { timeout: 15000 });

    // ==========================================
    // 2. İSTEM 1 & 3: GÖZLEM KARTI, SICAKLIK NOTU, EMİN DEĞİLİM, HATA VURGUSU, SICAKLIK KISITLAMASI
    // ==========================================
    await page.waitForSelector('#observationCard');

    // İstem 3 Kontrol: "Sıcaklıklar sanal deney modeline aittir" yazısı kaldırılmış olmalı
    const obsText = await page.locator('#observationCard').innerText();
    assert.equal(obsText.includes('Sıcaklıklar sanal deney modeline aittir'), false, 'Gözlem kartında sanal model notu bulunmamalı');
    passedChecks.push('İstem 3: Sıcaklık altındaki "Sıcaklıklar sanal deney modeline aittir" yazısı kaldırıldı');

    // İstem 1 Kontrol: "Emin Değilim" başlığı tek satırda ve white-space: nowrap
    const unsureHeader = await page.locator('th.obs-heading-unsure');
    const unsureStyle = await unsureHeader.evaluate(el => window.getComputedStyle(el).whiteSpace);
    assert.equal(unsureStyle, 'nowrap', 'Emin değilim başlığı tek satırda (nowrap) olmalı');
    passedChecks.push('İstem 1: "Emin değilim" başlığı tek satıra yerleştirildi');

    // İstem 1 & Güncel İstek Kontrol: Sıcaklık artışı seçilirse sıcaklık azalışı seçimi kalkmalı (pasif olmadan)
    await page.click('[data-observation-control="tempRise-yes"]');
    await page.waitForTimeout(50);
    const tempFallYesBtn = page.locator('[data-observation-control="tempFall-yes"]');
    await page.click('[data-observation-control="tempFall-yes"]');
    await page.waitForTimeout(50);
    assert.equal(await page.locator('[data-observation-control="tempRise-yes"]').getAttribute('aria-pressed'), 'false', 'Düşer seçilince yükselir seçimi kalkmalı');
    assert.equal(await page.locator('[data-observation-control="tempFall-yes"]').getAttribute('aria-pressed'), 'true', 'Düşer seçili olmalı');
    passedChecks.push('İstem 1: Sıcaklık artışı ve azalışı karşılıklı seçimi kaldırır');

    // İstem 1 Kontrol: Hata bildiriminde boş bırakılan yerlerin soft kırmızı vurgulanması
    await page.click('#compareObservationButton');
    await page.waitForTimeout(100);

    const errorRows = await page.locator('.observation-row.has-error').count();
    assert(errorRows > 0, 'Boş bırakılan satırlara has-error sınıfı eklenmeli');
    const errorBg = await page.locator('.observation-row.has-error').first().evaluate(el => window.getComputedStyle(el).backgroundColor);
    // #fef2f2 = rgb(254, 242, 242)
    assert.equal(errorBg, 'rgb(254, 242, 242)', 'Boş bırakılan yerler soft kırmızı (#fef2f2) ile vurgulanmalı');

    const noteHasError = await page.locator('#observationNote').evaluate(el => el.classList.contains('has-error'));
    assert.equal(noteHasError, true, 'Boş bırakılan gözlem notu textarea soft kırmızı ile vurgulanmalı');
    passedChecks.push('İstem 1: Boş bırakılan alanlar soft kırmızı hata hissi veren renkle vurgulandı');

    // İstem 1 & Güncel İstek Kontrol: Gözlem notu alanının dengeli boyutta olması (~100px)
    const noteHeight = await page.locator('#observationNote').evaluate(el => el.clientHeight);
    assert(noteHeight >= 80 && noteHeight <= 120, 'Gözlem notu alanı dengeli boyutta (~100px) olmalı');
    passedChecks.push('İstem 1: Sıcaklık ve gözlem notu alanı dengeli boyuta ayarlandı');

    // Otomatik doldur ve Karşılaştır aşamasına geç
    await page.evaluate(() => {
      MebiPrediction.items.forEach(i=>MebiObservation.setChoice(TepkimeArenasi.state,i.key+':no'));MebiObservation.setNote(TepkimeArenasi.state,'Karışımın görünüşünü ve termometreyi gözlemledim.');TepkimeArenasi.render(false);
      TepkimeArenasi.dispatch('setObservationTab', 'compare');
    });
    await page.waitForTimeout(200);

    // İstem 3 & Güncel İstek Kontrol: Karşılaştırma görünümünde "Tahmininde ne değişti" metin kutusu yarıya indirilmiş (rows="3", ~60-70px)
    const reflectionTextarea = page.locator('#observationReflection');
    assert.equal(await reflectionTextarea.getAttribute('rows'), '3', 'Tahmininde ne değişti metin kutusu rows="3" olmalı');
    const reflectionHeight = await reflectionTextarea.evaluate(el => el.clientHeight);
    assert(reflectionHeight <= 80 && reflectionHeight >= 50, 'Tahmininde ne değişti metin kutusunun yüksekliği yarıya indirilmiş olmalı');

    const compareText = await page.locator('.observation-notes.comparison-evidence').innerText();
    assert.equal(compareText.includes('Sıcaklıklar sanal deney modeline aittir'), false, 'Sağdaki sıcaklık altında sanal model yazısı bulunmamalı');
    passedChecks.push('İstem 3: Tahmininde ne değişti kutusu yüksekliği yarıya indirildi ve sağdaki sıcaklık altındaki yazı kaldırıldı');

    // ==========================================
    // 3. İSTEM 4 & 5: AÇIKLA KARTI & TAHMİN-GÖZLEM DİALOGU
    // ==========================================
    await page.evaluate(() => {
      TepkimeArenasi.dispatch('toCard');
    });
    await page.waitForSelector('#explanationCard');

    // İstem 5 Kontrol: Açıkla kartında "Kaydettiğim Gözlem" kartı kaldırılmış olmalı
    const obsInExplCount = await page.locator('.explanation-observation').count();
    assert.equal(obsInExplCount, 0, 'Açıkla kartında Kaydettiğim Gözlem kartı kaldırılmış olmalı');

    // İstem 5 Kontrol: "Bu değişim kimyasal mı, fiziksel mi?" kartı yatay yayılmış olmalı
    const decisionGroup = page.locator('#explanationDecisionGroup');
    assert.equal(await decisionGroup.evaluate(el => el.classList.contains('is-horizontal')), true);

    const changeOptionsCount = await page.locator('.explanation-change-option').count();
    assert.equal(changeOptionsCount, 3, '3 seçenek bulunmalı');

    // İkon kontrolü: kimyasal, fiziksel ve kararsızlık ikonları
    const chemIcon = await page.locator('.explanation-change-icon-badge.is-chemical svg').count();
    const physIcon = await page.locator('.explanation-change-icon-badge.is-physical svg').count();
    const unsureIcon = await page.locator('.explanation-change-icon-badge.is-unsure svg').count();
    assert(chemIcon > 0 && physIcon > 0 && unsureIcon > 0, 'Kimyasal, fiziksel ve kararsızlık ikonları bulunmalı');
    passedChecks.push('İstem 5: Açıkla kartından Kaydettiğim Gözlem kaldırıldı, karar kartı yatay yayıldı, yüksekliği azaltıldı ve şık ikonlar eklendi');

    // İstem 4 Kontrol: Dialog iki bölümlü (1. Bölüm: Tahmin ve Gerekçeler, 2. Bölüm: Kaydettiğim Gözlemlerim)
    await page.click('.explanation-prediction-trigger');
    await page.waitForSelector('#explanationPredictionDialog[open]');

    const sec1Title = await page.locator('.explanation-section-predictions .explanation-dialog-subtitle').innerText();
    const sec2Title = await page.locator('.explanation-section-observations .explanation-dialog-subtitle').innerText();
    assert(sec1Title.includes('1.') && sec1Title.includes('Tahmin'), 'Birinci bölümde tahmin ve gerekçeler bulunmalı');
    assert(sec2Title.includes('2.') && sec2Title.includes('Gözlem'), 'İkinci bölümde kaydettiğim gözlemlerim bulunmalı');

    // Dialog boyutu Açıkla kartının %20 küçük boyutunda ve en-boy oranında
    const dialogMetrics = await page.locator('#explanationPredictionDialog').evaluate(el => {
      const r = el.getBoundingClientRect();
      return { width: r.width, height: r.height, ratio: r.width / r.height };
    });
    assert(dialogMetrics.width <= 950 && dialogMetrics.width >= 700, 'Dialog genişliği Açıkla kartından yaklaşık %20 küçük olmalı');
    assert(dialogMetrics.ratio > 1.2, 'Dialog yatay en-boy oranına sahip olmalı');
    passedChecks.push('İstem 4: Tahmin ve gözlem kartı iki bölümlü hale getirildi, %20 küçük boyutta ve şık bir şekilde sığacak şekilde tasarlandı');

    // Dialogu kapat
    await page.click('#explanationPredictionDialog button[type="submit"]');
    await page.waitForTimeout(100);

    // ==========================================
    // 4. İSTEM 6: LABORATUVAR GÜNLÜĞÜ (COLLECTION) İSTEMLERİ
    // ==========================================
    // Bir deney kaydedip koleksiyona geç
    await page.evaluate(() => {
      Object.assign(MebiExplanation.get(TepkimeArenasi.state),{changeType:'chemical',html:'Gözlemimi taneciklerin yeniden düzenlenmesiyle ilişkilendiriyorum.'});TepkimeArenasi.render(false);
      TepkimeArenasi.dispatch('saveExplanation');
      TepkimeArenasi.dispatch('toModel');
      MebiModel.data(TepkimeArenasi.state).species.forEach(p=>MebiModel.assign(TepkimeArenasi.state,p.kind,p.role));TepkimeArenasi.render(false);
      TepkimeArenasi.dispatch('saveModel');
      TepkimeArenasi.dispatch('goCollection');
    });
    await page.waitForSelector('.collection-shell');

    // 1. "Kaydedilen Deney Modelleri (X)" yazısı Laboratuvar Günlüğü rozeti/kartı içinde
    const titleBadge = page.locator('.collection-title-badge');
    const badgeText = await titleBadge.innerText();
    assert(badgeText.includes('LABORATUVAR GÜNLÜĞÜ') && badgeText.includes('KAYDEDİLEN DENEY MODELLERİ'), 'Kaydedilen Deney Modelleri yazısı Laboratuvar Günlüğü kartı içinde olmalı');

    // 2. "Menüye Dön" kaldırılmış, "Kapat" bağlantısı eklenmiş
    const goMenuCount = await page.locator('.collection-shell [data-action="goMenu"]').count();
    const closeBtnCount = await page.locator('.collection-shell [data-action="closeCollection"]').count();
    assert.equal(goMenuCount, 0, 'Menüye dön bağlantısı kaldırılmış olmalı');
    assert(closeBtnCount > 0, 'Kartı kapatma bağlantısı eklenmiş olmalı');

    // 3. "Deneye devam et" ve "Yeni deney başlat" bağlantıları kaldırılmış
    const resumeCount = await page.locator('.collection-shell [data-action="resumeExperiment"]').count();
    const goPoolCount = await page.locator('.collection-shell [data-action="goPool"]').count();
    assert.equal(resumeCount, 0, 'Deneye devam et bağlantısı kaldırılmış olmalı');
    assert.equal(goPoolCount, 0, 'Yeniden başlat bağlantısı kaldırılmış olmalı');

    // 4. Deney kartlarına tıklanabilme özelliği kaldırılmış
    const firstColCard = page.locator('.collection-card').first();
    const cardAction = await firstColCard.getAttribute('data-action');
    const cardCursor = await firstColCard.evaluate(el => window.getComputedStyle(el).cursor);
    assert.equal(cardAction, null, 'Deney kartlarında data-action bulunmamalı');
    assert.equal(cardCursor, 'default', 'Deney kartları imleci default olmalı (tıklanamaz)');

    // 5. Koleksiyonu sıfırla bilgi penceresi standart stil ve renk tonlarında
    await page.click('[data-action="clearCollection"]');
    await page.waitForSelector('#resetModalOverlay.is-active');

    const resetBadge = page.locator('.reset-modal-badge');
    assert.equal(await resetBadge.evaluate(el => el.classList.contains('mebi-badge-amber')), false, 'Sıfırla modalında sarı (amber) rozet kalmamalı');

    const resetColors = await page.evaluate(() => {
      const card = document.getElementById('resetModalCard');
      const header = card.querySelector('.reset-modal-header');
      return {
        cardBg: window.getComputedStyle(card).backgroundColor,
        headerBg: window.getComputedStyle(header).backgroundColor
      };
    });
    assert.equal(resetColors.cardBg, 'rgb(255, 255, 255)', 'Sıfırla penceresi standart beyaz arka plana sahip olmalı');
    assert.equal(resetColors.headerBg, 'rgb(248, 250, 252)', 'Sıfırla penceresi başlığı standart açık gri (#f8fafc) olmalı');

    await page.click('#btnCancelResetModal');
    passedChecks.push('İstem 6: Laboratuvar günlüğü başlığı birleştirildi, menü/devam et/yeniden başlat bağlantıları kaldırıldı, kapatma eklendi, kart tıklanabilirliği kaldırıldı, sıfırlama penceresi standart tonlara dönüştürüldü');

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
