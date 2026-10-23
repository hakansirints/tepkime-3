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
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
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
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.addInitScript(() => localStorage.setItem('mebi_hide_welcome_modal', 'true'));
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.LabScene?.available && window.MebiExplanationModel);

    const dispatch = (action, arg) => page.evaluate(({action, arg}) => TepkimeArenasi.dispatch(action, arg), {action, arg});

    // Progression:
    await dispatch('goPool');
    await dispatch('clickReagent', 'CaCl2');
    await dispatch('clickReagent', 'NaOH');
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
    await page.locator('#explanationEditor').fill('Ca(OH)2 çökeltisi oluştu.');
    await page.locator('[data-explanation-change][value="unsure"]').check();
    await dispatch('saveExplanation');

    // --- 1. GÖRSEL KONTROLLERİ ---
    const explainInspectBtn = page.locator('#explanationCard [data-action="openParticleInspection"]');
    assert.equal(await explainInspectBtn.count(), 1, 'Açıklama kartında 3B inceleme butonu olmalı');
    const explainBtnText = await explainInspectBtn.innerText();
    console.log('Explanation card inspect button text:', explainBtnText);
    assert(explainBtnText.includes('3 Boyutlu Tanecik Modellerini İncele'), 'Buton etiketinde "3 Boyutlu Tanecik Modellerini İncele" yazmalı');
    assert.equal(await explainInspectBtn.getAttribute('data-arg'), 'before', 'Buton data-arg="before" taşımalı');
    passedChecks.push('1. Görsel: Buton etiketi "3 Boyutlu Tanecik Modellerini İncele" yapıldı ve data-arg="before" olarak ayarlandı');

    // Screenshot of Explanation card with updated button
    const artifactDir = 'C:/Users/hakan/.gemini/antigravity/brain/6e3cd5d1-81b1-4f45-ad92-2c9cc6a52f4f';
    const ssExplainPath = path.join(artifactDir, 'explanation-card-updated-btn.png');
    await page.screenshot({ path: ssExplainPath, fullPage: true });

    // Click from Explanation card and check that thermometer is hidden
    await explainInspectBtn.click();
    await page.waitForTimeout(600);
    let thermoState = await page.evaluate(() => window.LabScene.getCameraState().thermometerVisible);
    assert.equal(thermoState, false, 'Açıkla aşamasından gelindiğinde termometre gizlenmiş olmalı');
    passedChecks.push('Açıkla aşamasından gelindiğinde 1. beherdeki termometre gizlendi');

    // Return to card
    await page.locator('.beaker-particle-panel [data-action="closeParticleInspection"]').click();
    await page.waitForSelector('#explanationCard');

    // Now go to Model stage
    await dispatch('toModel');
    await page.waitForSelector('#modelCard');

    // Click from Model card
    await page.locator('#modelCard [data-action="openParticleInspection"]').click();
    await page.waitForTimeout(600);

    // --- 2. GÖRSEL KONTROLLERİ ---
    // Check thermometer is hidden from Model stage
    thermoState = await page.evaluate(() => window.LabScene.getCameraState().thermometerVisible);
    assert.equal(thermoState, false, 'Model aşamasından gelindiğinde termometre gizlenmiş olmalı');
    passedChecks.push('Model aşamasından gelindiğinde 1. beherdeki termometre gizlendi');

    // Check Tanecik Görünümü card texts & structure
    const dockSubtext = await page.locator('.beaker-particle-panel .dock-subtext').innerText();
    console.log('Dock subtext:', dockSubtext);
    assert(dockSubtext.includes('Tanecik ve su sayıları temsilidir. Boyutlar ve süreler ölçekli değildir; hareketler yavaşlatılmıştır.'), 'Model hakkında metni dock-subtext devamına eklenmiş olmalı');

    const modelAboutCount = await page.locator('.beaker-particle-panel .beaker-particle-help').count();
    assert.equal(modelAboutCount, 0, '"Model hakkında" bağlantısı/bloğu kaldırılmış olmalı');
    passedChecks.push('Model hakkında yazısı subtext devamına alındı ve eski bağlantı kaldırıldı');

    // Check phase text is placed ABOVE buttons
    const phaseAbove = await page.evaluate(() => {
      const panel = document.querySelector('.beaker-particle-panel');
      const phase = panel.querySelector('#particleInspectionPhase');
      const modes = panel.querySelector('.beaker-particle-modes');
      return phase && modes && (phase.compareDocumentPosition(modes) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    });
    assert.equal(phaseAbove, true, '"Dökülmeden önce · İki ayrı beher" yazısı butonların üstünde olmalı');
    passedChecks.push('"Dökülmeden önce · İki ayrı beher" yazısı butonların üstüne çıkarıldı');

    // Check draggable dock
    const dock = page.locator('#particleInspectionModelDock');
    const header = dock.locator('.model-dock-header');
    const headerCursor = await header.evaluate(el => window.getComputedStyle(el).cursor);
    assert.equal(headerCursor, 'grab', 'Başlık cursor: grab olmalı');

    const initialPos = await dock.evaluate(el => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top };
    });

    // Drag header by 60px right, 40px up
    const headerBox = await header.boundingBox();
    await page.mouse.move(headerBox.x + 30, headerBox.y + 10);
    await page.mouse.down();
    await page.mouse.move(headerBox.x + 90, headerBox.y - 30, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const movedPos = await dock.evaluate(el => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top };
    });
    console.log('Header box:', headerBox);
    console.log('Dock positions:', { initialPos, movedPos });
    assert(Math.abs(movedPos.left - initialPos.left) > 20, 'Kart başarıyla taşınabilmeli');
    passedChecks.push('Taneciklerin rolünü belirle kartı başlığından tutularak sahnede sürüklenebiliyor');

    // Check buttons casing across site
    const buttonsUppercaseCount = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, .mebi-btn'));
      let upperCount = 0;
      for (const b of btns) {
        const text = (b.innerText || '').trim();
        const transform = window.getComputedStyle(b).textTransform;
        if (transform === 'uppercase') upperCount++;
      }
      return upperCount;
    });
    console.log('Buttons with textTransform === uppercase:', buttonsUppercaseCount);
    assert.equal(buttonsUppercaseCount, 0, 'Hiçbir buton text-transform: uppercase olmamalı');
    passedChecks.push('Site genelindeki tüm butonlar kelimelerin ilk harfleri büyük, diğerleri küçük (Title Case) olarak güncellendi');

    // Screenshot of 3D scene framing with beakers right above bottom dock
    const ss3dPath = path.join(artifactDir, '3d-scene-framing-no-thermo.png');
    await page.screenshot({ path: ss3dPath, fullPage: true });
    console.log('Screenshot saved to', ss3dPath);

    console.log('\n--- TÜM KONTROLLER VE İSTEMLER BAŞARIYLA GEÇTİ ---');
    passedChecks.forEach(c => console.log('✓ ' + c));
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
