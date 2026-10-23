const enterStudentInputs = require('./student-inputs.cjs');
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

  const passedChecks = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.addInitScript(() => localStorage.setItem('mebi_hide_welcome_modal', 'true'));
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.LabScene?.available && window.MebiExplanationModel);

    const dispatch = (action, arg) => page.evaluate(({action, arg}) => TepkimeArenasi.dispatch(action, arg), {action, arg});

    // Step by step progression:
    await dispatch('goPool');
    await dispatch('clickReagent', 'NaOH');
    await dispatch('clickReagent', 'HCl');
    await dispatch('startExperiment');
    await enterStudentInputs(page, 'prediction');
    await dispatch('beginExperiment');
    await page.evaluate(() => {
      const s = TepkimeArenasi.state;
      s.labStep = 'observed';
      s.poured = true;
      s.experiment.transfer = 1;
      s.currentTemp = s.activeReaction.tempFinal;
      MebiObservation.reset(s);
      TepkimeArenasi.render(false);
    });
    await enterStudentInputs(page, 'observation');
    await dispatch('saveObservation');
    await dispatch('setObservationTab', 'compare');
    await dispatch('toCard');
    await page.waitForSelector('#explanationCard');

    // Fill and save explanation so Model becomes eligible
    await page.locator('#explanationEditor').fill('Atomlar yeniden düzenlendi.');
    await page.locator('[data-explanation-change][value="unsure"]').check();
    await dispatch('saveExplanation');

    // Now go to Model stage
    await dispatch('toModel');
    await page.waitForSelector('#modelCard');

    // 1. "Taneciklerin rollerini belirle" ve "Seçimlerinle kendi tanecik ilişki şemanı oluştur." yazıları kaldırılmış olmalı
    const modelWorkText = await page.locator('.model-content .explanation-work').innerText();
    assert.equal(modelWorkText.includes('Taneciklerin rollerini belirle'), false, '"Taneciklerin rollerini belirle" başlığı kaldırılmış olmalı');
    assert.equal(modelWorkText.includes('Seçimlerinle kendi tanecik ilişki şemanı oluştur.'), false, '"Seçimlerinle kendi tanecik ilişki şemanı oluştur." alt başlığı kaldırılmış olmalı');
    passedChecks.push('Eski başlık ve alt başlık yazıları kaldırıldı');

    // 2. "Rolleri ayırt ederken nelere bakmalıyım?" en üstte ve AÇIK halde olmalı
    const helpDetails = page.locator('.model-content .explanation-help');
    assert(await helpDetails.isVisible(), 'Yardım kutusu görünür olmalı');
    const isOpen = await helpDetails.evaluate(el => el.hasAttribute('open'));
    assert.equal(isOpen, true, 'Yardım kutusu AÇIK (open) halde olmalı');
    const summaryText = await helpDetails.locator('summary').innerText();
    assert(summaryText.includes('Rolleri ayırt ederken nelere bakmalıyım?'), 'Başlık doğru olmalı');
    const helpContent = await helpDetails.locator('p').innerText();
    assert(helpContent.includes('Katı tepkeni başlangıçta serbest iyon gibi gösterme'), 'Yardım metni içeriği bulunmalı');
    
    // Altta yinelenen yardım kutusu olmamalı (sadece 1 adet olmalı)
    const helpCount = await page.locator('.model-card .explanation-help').count();
    assert.equal(helpCount, 1, 'Yardım kutusu sadece en üstte 1 adet olmalı');
    passedChecks.push('"Rolleri ayırt ederken nelere bakmalıyım?" bağlantısı ve içeriği en üstte AÇIK halde getirildi');

    // 3. Üst alanda buton kalmamış olmalı, hepsi footer prediction-actions içine taşınmış olmalı
    const stepToolsCount = await page.locator('.explanation-step-tools').count();
    assert.equal(stepToolsCount, 0, 'Üstteki explanation-step-tools alanı tamamen kaldırılmış olmalı');

    // "Benim tanecik ilişkim" yanında "Rollerimi Gözden Geçir" butonu kalmamış olmalı
    const captionBtnCount = await page.locator('.explanation-model-caption button').count();
    assert.equal(captionBtnCount, 0, 'Rollerimi gözden geçir butonu başlıktan kaldırılmış olmalı');

    // 4. Footer kontrolleri
    const footerActions = page.locator('#modelCard .explanation-footer .prediction-actions');
    assert(await footerActions.isVisible(), 'Footer prediction-actions görünür olmalı');

    // 4.1 "3 Boyutlu Tanecik Modellerini İncele" butonu
    const particle3DBtn = footerActions.locator('[data-action="openParticleInspection"]');
    assert(await particle3DBtn.isVisible(), '3B İncele butonu footer içinde olmalı');
    const particle3DText = await particle3DBtn.evaluate(el => el.textContent);
    assert(particle3DText.includes('3 Boyutlu Tanecik Modellerini İncele'), `Buton metni "3 Boyutlu Tanecik Modellerini İncele" olmalı, mevcut: "${particle3DText}"`);
    passedChecks.push('"3b beheri incele" butonu footer\'a taşındı ve adı "3 Boyutlu Tanecik Modellerini İncele" yapıldı');

    // 4.2 "Rollerimi Gözden Geçir" butonu
    const checkModelBtn = footerActions.locator('[data-action="checkModel"]');
    assert(await checkModelBtn.isVisible(), 'Rollerimi Gözden Geçir butonu footer içinde olmalı');
    passedChecks.push('"Rollerimi Gözden Geçir" butonu footer\'a taşındı');

    assert.equal(await page.getByText('Test İçin Doldur', {exact:true}).count(), 0);
    passedChecks.push('Model kartında test doldurma düğmesi bulunmuyor');

    // 4.4 "Açıklamama Dön" ve "Modelimi Kaydet" butonları
    const backBtn = footerActions.locator('[data-action="backToExplanation"]');
    const saveBtn = footerActions.locator('[data-action="saveModel"]');
    assert(await backBtn.isVisible(), 'Açıklamama Dön butonu mevcut olmalı');
    assert(await saveBtn.isVisible(), 'Modelimi Kaydet butonu mevcut olmalı');
    passedChecks.push('Footer eylem butonları tam ve eksiksiz');

    // 5. Fonksiyonel kontroller
    await enterStudentInputs(page, 'model');

    // Rollerimi Gözden Geçir'e tıklayalım
    await checkModelBtn.click();
    await page.waitForTimeout(100);
    const checkFeedback = await page.locator('#modelStatus').innerText();
    assert(checkFeedback.includes('Tanecik rollerin bu öğretim modeliyle uyumlu'), 'Rollerimi gözden geçir doğrulamayı tetiklemeli');

    // Ekran görüntüsü kaydedelim
    const screenshotDir = path.join(root, 'artifacts');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    const screenshotPath = path.join(screenshotDir, 'model-card-updated.png');
    await page.screenshot({ path: screenshotPath });
    passedChecks.push(`Ekran görüntüsü kaydedildi: ${screenshotPath}`);

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
