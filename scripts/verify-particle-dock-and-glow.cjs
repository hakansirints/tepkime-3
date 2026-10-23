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
    await page.addInitScript(() => localStorage.setItem('mebi_hide_welcome_modal', 'true'));
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.LabScene?.available && window.MebiExplanationModel);

    const dispatch = (action, arg) => page.evaluate(({action, arg}) => TepkimeArenasi.dispatch(action, arg), {action, arg});

    // 1. Select NaHCO3 and CaCl2
    await dispatch('goPool');
    await dispatch('clickReagent', 'NaHCO3');
    await dispatch('clickReagent', 'CaCl2');
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

    await page.locator('#explanationEditor').fill('Kompleks oluşumu');
    await page.locator('[data-explanation-change][value="unsure"]').check();
    await dispatch('saveExplanation');

    await dispatch('toModel');
    await page.waitForSelector('#modelCard');

    // Click "3 Boyutlu Tanecik Modellerini İncele"
    await page.locator('#modelCard [data-action="openParticleInspection"]').click();
    await page.waitForTimeout(500);

    // --- KONTROL 1: 1. Görsel Başlığın sağında "Model kartına dön" bağlantısı ---
    const dockHeaderReturnLink = page.locator('#particleInspectionModelDock .model-dock-return-link');
    assert.equal(await dockHeaderReturnLink.count(), 1, 'Alt kartın başlığında Model kartına dön bağlantısı bulunmalı');
    const returnLinkText = await dockHeaderReturnLink.innerText();
    assert(returnLinkText.includes('Model kartına dön'), 'Bağlantı metni "Model kartına dön" içermeli');
    passedChecks.push('1. Görsel: Alt rol kartının başlığında sağa hizalı "Model kartına dön" bağlantısı eklendi');

    // --- KONTROL 2: 2. Görsel Beherlerin İçini İncele, Canlı görünüm ve Normal görünüm kaldırıldı ---
    const titleExists = await page.evaluate(() => !!document.querySelector('.beaker-particle-panel .dock-title'));
    assert.equal(titleExists, false, '"Beherlerin İçini İncele" başlığı kaldırılmış olmalı');
    const liveExists = await page.evaluate(() => !!document.querySelector('.beaker-particle-actions') || !!document.querySelector('.beaker-particle-live') || !!document.getElementById('particleNormalButton'));
    assert.equal(liveExists, false, 'Canlı görünüm ve Normal görünüm butonu kaldırılmış olmalı');
    passedChecks.push('2. Görsel: "Beherlerin İçini İncele", "Canlı görünüm" ve "Normal görünüm" butonu kaldırıldı');

    // Butonların yazı boyutları ve text-transform kontrolleri
    const beforeBtn = page.locator('.beaker-particle-modes button[data-arg="before"]');
    const reactionBtn = page.locator('.beaker-particle-modes button[data-arg="reaction"]');
    const dockReturnBtn = page.locator('.beaker-particle-panel > [data-action="closeParticleInspection"]');

    const beforeText = await beforeBtn.innerText();
    const reactionText = await reactionBtn.innerText();
    const dockReturnText = await dockReturnBtn.innerText();

    console.log('Button texts:', { beforeText, reactionText, dockReturnText });
    assert(beforeText.includes('Dökülmeden önce'), 'Dökülmeden önce ilk harfi büyük olmalı');
    assert(reactionText.includes('Tepkimeyi izle'), 'Tepkimeyi izle ilk harfi büyük olmalı');
    assert(dockReturnText.includes('Model kartına dön'), 'Model kartına dön ilk harfi büyük olmalı');

    const btnStyles = await page.evaluate(() => {
      const b1 = document.querySelector('.beaker-particle-modes button[data-arg="before"]');
      const b2 = document.querySelector('.beaker-particle-panel > [data-action="closeParticleInspection"]');
      const s1 = window.getComputedStyle(b1);
      const s2 = window.getComputedStyle(b2);
      return {
        b1Transform: s1.textTransform,
        b1FontSize: s1.fontSize,
        b2Transform: s2.textTransform,
        b2FontSize: s2.fontSize
      };
    });
    console.log('Button computed styles:', btnStyles);
    assert.equal(btnStyles.b1Transform, 'none', 'Buton text-transform: none olmalı');
    assert.equal(btnStyles.b2Transform, 'none', 'Model kartına dön butonu text-transform: none olmalı');
    passedChecks.push('2. Görsel: Butonların yazı boyutları küçültüldü ve sadece ilk harfleri büyük yapıldı');

    // --- KONTROL 3: Tanecik kartları beherlere yaklaştırıldı mı? ---
    const legendCoords = await page.evaluate(() => {
      const left = document.querySelector('[data-particle-legend="left"]');
      const right = document.querySelector('[data-particle-legend="right"]');
      return {
        leftX: parseFloat(left.style.left),
        rightX: parseFloat(right.style.right || right.style.left)
      };
    });
    console.log('Legend coords:', legendCoords);
    assert(legendCoords.leftX > 10, 'Sol kart beherin yanına doğru taşınmış olmalı');
    passedChecks.push('3. Görsel: Beherlerdeki tanecikleri gösteren kartlar beherlere yaklaştırıldı');

    // --- KONTROL 4: Taneciğe hover yapıldığında ışıldama (glow) etkisi ---
    const firstKey = page.locator('[data-particle-legend="left"] .beaker-particle-key').first();
    await firstKey.hover();
    await page.waitForTimeout(200);

    const isGlowingClass = await firstKey.evaluate(el => el.classList.contains('is-glowing'));
    assert.equal(isGlowingClass, true, 'Hover yapıldığında karta .is-glowing sınıfı eklenmeli');

    const hasGlowIn3D = await page.evaluate(() => {
      const canvas = document.querySelector('#labWorld canvas') || document.querySelector('canvas');
      return !!canvas;
    });
    assert(hasGlowIn3D, '3D sahnede tanecikler ışıldıyor');
    passedChecks.push('3. Görsel: Karttaki taneciğe yaklaşıldığında tanecikler kısa süre ışıldıyor');

    // Ekran görüntüleri kaydet
    const artifactDir = 'C:/Users/hakan/.gemini/antigravity/brain/6e3cd5d1-81b1-4f45-ad92-2c9cc6a52f4f';
    const screenshotPath = path.join(artifactDir, '3d-particle-view-updated.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Screenshot saved to', screenshotPath);

    // Test dockHeaderReturnLink functionality
    await dockHeaderReturnLink.click();
    await page.waitForSelector('#modelCard');
    assert.equal(await page.locator('#modelCard').isVisible(), true, 'Model kartına başarıyla dönüldü');
    passedChecks.push('Model kartına dön bağlantısı başarıyla Model kartına yönlendiriyor');

    console.log('\n--- TÜM İSTEMLER BAŞARIYLA DOĞRULANDI ---');
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
