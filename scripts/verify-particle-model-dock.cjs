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

    // 1. Select NaHCO3 and CaCl2 (matches the reaction from user's Image 2 & 3)
    await dispatch('goPool');
    await dispatch('clickReagent', 'NaHCO3');
    await dispatch('clickReagent', 'CaCl2');
    await dispatch('startExperiment');
    await dispatch('autoFillPredictionForTesting');
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
    await dispatch('autoFillObservationForTesting');
    await dispatch('saveObservation');
    await dispatch('setObservationTab', 'compare');
    await dispatch('toCard');
    await page.waitForSelector('#explanationCard');

    // Complete explanation step
    await page.locator('#explanationEditor').fill('Karışım sonucunda çökelme ve gaz çıkışı gözlendi.');
    await page.locator('[data-explanation-change][value="unsure"]').check();
    await dispatch('saveExplanation');

    // Go to Model stage
    await dispatch('toModel');
    await page.waitForSelector('#modelCard');
    passedChecks.push('Model kartı başarıyla açıldı');

    // Verify "3 Boyutlu Tanecik Modellerini İncele" button exists and has data-arg="before"
    const inspectBtn = page.locator('#modelCard [data-action="openParticleInspection"]');
    assert.equal(await inspectBtn.count(), 1, '3 Boyutlu Tanecik Modellerini İncele butonu mevcut olmalı');
    const arg = await inspectBtn.getAttribute('data-arg');
    assert.equal(arg, 'before', 'Buton data-arg="before" taşımalı');
    passedChecks.push('3 Boyutlu Tanecik Modellerini İncele butonu data-arg="before" olarak ayarlı');

    // Click "3 Boyutlu Tanecik Modellerini İncele"
    await inspectBtn.click();
    await page.waitForTimeout(500);

    // Verify 3D Particle Inspection state
    const state = await page.evaluate(() => TepkimeArenasi.state);
    assert.equal(state.screen, 'lab', 'Ekran lab (3B) olmalı');
    assert.equal(state.particleInspection.view, 'before', 'particleInspection.view "before" (dökülmeden önce) olmalı');
    assert.equal(state.particleInspection.returnScreen, 'model', 'returnScreen "model" olmalı');
    passedChecks.push('3B Tanecik görünümü deney öncesi (before) durumunda açıldı');

    // Verify docked card appears at the bottom
    const dock = page.locator('#particleInspectionModelDock');
    assert.equal(await dock.count(), 1, '#particleInspectionModelDock bulunmalı');
    assert.equal(await dock.isVisible(), true, '#particleInspectionModelDock görünür olmalı');
    passedChecks.push('Sayfanın altında tanecik rol belirleme kartı göründü');

    // Verify species cards inside the dock
    const speciesCards = dock.locator('.explanation-species-card');
    const count = await speciesCards.count();
    console.log(`Docked species card count: ${count}`);
    assert(count >= 4, 'En az 4 tanecik türü kartı olmalı');
    passedChecks.push(`${count} adet tanecik kartı dock içinde listelendi`);

    // Capture screenshot of the 3D particle view with the bottom dock
    const artifactDir = 'C:/Users/hakan/.gemini/antigravity/brain/6e3cd5d1-81b1-4f45-ad92-2c9cc6a52f4f';
    const screenshot1Path = path.join(artifactDir, '3d-particle-view-with-dock.png');
    await page.screenshot({ path: screenshot1Path, fullPage: true });
    console.log(`Screenshot saved to ${screenshot1Path}`);

    // Assign roles in the dock
    // For NaHCO3 + CaCl2: species are Na+, HCO3-, Ca2+, Cl-, CaCO3, CO2, H2O
    const speciesAssignments = {
      'Na': 'spectator',
      'HCO3': 'reactant',
      'Ca': 'reactant',
      'Cl': 'spectator',
      'CaCO3': 'solid',
      'CO2': 'gas',
      'H2O': 'water'
    };

    for (const [speciesKind, role] of Object.entries(speciesAssignments)) {
      const select = dock.locator(`select[data-model-species="${speciesKind}"]`);
      if (await select.count() > 0) {
        await select.selectOption(role);
      }
    }
    await page.waitForTimeout(200);

    // Verify assignments in state
    const currentAssignments = await page.evaluate(() => TepkimeArenasi.state.particleModel.assignments);
    console.log('Current assignments after dock selection:', currentAssignments);
    assert.equal(currentAssignments['Na'], 'spectator');
    assert.equal(currentAssignments['HCO3'], 'reactant');
    assert.equal(currentAssignments['Ca'], 'reactant');
    assert.equal(currentAssignments['CaCO3'], 'solid');
    passedChecks.push('Dock üzerinden seçilen roller başarıyla kaydedildi');

    // Click "Model Kartına Dön"
    const returnBtn = page.locator('.beaker-particle-panel [data-action="closeParticleInspection"]');
    assert.equal((await returnBtn.innerText()).toUpperCase(), 'MODEL KARTINA DÖN');
    await returnBtn.click();
    await page.waitForSelector('#modelCard');
    passedChecks.push('Model Kartına Dön butonu ile Model kartına geri dönüldü');

    // Verify "Benim tanecik ilişkim" section reflects the chosen roles
    const modelMap = page.locator('#modelMap');
    const modelMapText = await modelMap.innerText();
    console.log('Model map text:\n', modelMapText);

    // Check that reactant group contains HCO3- and Ca2+
    const reactantText = await modelMap.locator('.explanation-map-path > div:first-child').innerText();
    assert(reactantText.includes('HCO3') || reactantText.includes('HCO₃'), 'Tepkimeye katılanlarda HCO3- olmalı');
    assert(reactantText.includes('Ca'), 'Tepkimeye katılanlarda Ca2+ olmalı');

    // Check that products group contains CaCO3, CO2, H2O
    const productsText = await modelMap.locator('.explanation-map-path > div:last-child').innerText();
    assert(productsText.includes('CaCO3') || productsText.includes('CaCO₃'), 'Ürünlerde CaCO3 olmalı');
    assert(productsText.includes('CO2') || productsText.includes('CO₂'), 'Ürünlerde CO2 olmalı');

    // Check that spectator group contains Na+ and Cl-
    const spectatorText = await modelMap.locator('.explanation-map-remain').innerText();
    assert(spectatorText.includes('Na'), 'Seyirci iyonlarda Na+ olmalı');
    assert(spectatorText.includes('Cl'), 'Seyirci iyonlarda Cl- olmalı');
    passedChecks.push('Benim tanecik ilişkim şemasında seçilen tüm roller doğru gruplarda gösterildi');

    // Verify the dropdowns in Model Card also reflect the assigned roles
    for (const [speciesKind, role] of Object.entries(speciesAssignments)) {
      const select = page.locator(`#modelCard select[data-model-species="${speciesKind}"]`);
      if (await select.count() > 0) {
        const val = await select.inputValue();
        assert.equal(val, role, `${speciesKind} için seçili rol ${role} olmalı`);
      }
    }
    passedChecks.push('Model kartındaki seçim kutuları da seçilen rolleri korudu');

    // Capture screenshot of the Model Card with the populated schema
    const screenshot2Path = path.join(artifactDir, 'model-card-with-roles.png');
    await page.screenshot({ path: screenshot2Path, fullPage: true });
    console.log(`Screenshot saved to ${screenshot2Path}`);

    console.log('\n--- TÜM KONTROLLER BAŞARIYLA GEÇTİ ---');
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
