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
    await page.goto(`http://127.0.0.1:${port}/index.html`);
    await page.waitForLoadState('networkidle');

    await page.waitForFunction(() => window.LabScene?.available && window.MebiExplanationModel);

    const dispatch = (action, arg) => page.evaluate(({action, arg}) => window.TepkimeArenasi.dispatch(action, arg), {action, arg});

    // Complete flow to reach Model stage
    await dispatch('goPool');
    await dispatch('clickReagent', 'CaCl2');
    await dispatch('clickReagent', 'NaOH');
    await dispatch('startExperiment');
    await dispatch('autoFillPredictionForTesting');
    await dispatch('beginExperiment');
    await page.evaluate(() => {
      const s = window.TepkimeArenasi.state;
      s.labStep = 'observed';
      s.poured = true;
      s.experiment.transfer = 1;
      s.currentTemp = s.activeReaction.tempFinal;
      window.MebiObservation.reset(s);
      window.TepkimeArenasi.render(false);
    });
    await dispatch('autoFillObservationForTesting');
    await dispatch('saveObservation');
    await dispatch('setObservationTab', 'compare');
    await dispatch('toCard');
    await page.waitForSelector('#explanationCard');

    // Fill and save explanation
    await page.locator('#explanationEditor').fill('Ca(OH)2 çökeltisi oluştu.');
    await page.locator('[data-explanation-change][value="unsure"]').check();
    await dispatch('saveExplanation');

    // Now navigate to Model stage
    await dispatch('toModel');
    await page.waitForSelector('#modelCard');

    // Open 3D particle inspection from Model card
    await page.locator('#modelCard [data-action="openParticleInspection"]').click();
    await page.waitForSelector('#particleInspectionModelDock');
    await page.waitForTimeout(600);

    const dock = page.locator('#particleInspectionModelDock');
    const checkBtn = dock.locator('[data-action="checkModelDock"]');
    const returnBtn = dock.locator('[data-action="closeParticleInspection"]');

    // 1. Verify existence and label
    const checkCount = await checkBtn.count();
    assert.equal(checkCount, 1, 'Rollerimi Gözden Geçir butonu dock içinde bulunmalı');
    const checkText = (await checkBtn.innerText()).trim();
    console.log('Check button text:', checkText);
    assert.equal(checkText, 'Rollerimi Gözden Geçir');
    passedChecks.push('Rollerimi Gözden Geçir butonu dock kartına eklendi');

    // 2. Verify position: checkBtn must be immediately to the left of returnBtn
    const checkBBox = await checkBtn.boundingBox();
    const returnBBox = await returnBtn.boundingBox();
    console.log('checkBtn bbox:', checkBBox);
    console.log('returnBtn bbox:', returnBBox);

    assert(checkBBox.x < returnBBox.x, 'Rollerimi Gözden Geçir butonu Model kartına dön butonunun solunda olmalı');
    assert(Math.abs(checkBBox.y - returnBBox.y) < 5, 'İki buton aynı yatay hizada olmalı');
    passedChecks.push('Rollerimi Gözden Geçir butonu Model kartına dön butonunun hemen solunda konumlandırıldı');

    // 3. Verify styles: must match return link style
    const checkStyles = await checkBtn.evaluate(el => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
        borderRadius: cs.borderRadius
      };
    });
    const returnStyles = await returnBtn.evaluate(el => {
      const cs = window.getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
        borderRadius: cs.borderRadius
      };
    });
    console.log('checkBtn styles:', checkStyles);
    console.log('returnBtn styles:', returnStyles);
    assert.equal(checkStyles.fontSize, returnStyles.fontSize);
    assert.equal(checkStyles.color, returnStyles.color);
    assert.equal(checkStyles.borderRadius, returnStyles.borderRadius);
    passedChecks.push('Rollerimi Gözden Geçir butonu Model kartına dön butonuyla aynı stilde tasarlandı');

    // 4. Test review feedback:
    const speciesData = await page.evaluate(() => {
      const model = window.MebiExplanationModel.build(window.TepkimeArenasi.state);
      return model.species.map(s => ({ kind: s.kind, role: s.role, label: s.label }));
    });
    console.log('Species in reaction:', speciesData);

    const first = speciesData[0];
    const second = speciesData[1];

    // Set first species to correct role
    await dock.locator(`select[data-model-species="${first.kind}"]`).selectOption(first.role);
    // Set second species to a wrong role
    const wrongRole = first.role === 'gas' ? 'solid' : 'gas';
    await dock.locator(`select[data-model-species="${second.kind}"]`).selectOption(wrongRole);

    // Click "Rollerimi Gözden Geçir"
    await checkBtn.click();
    await page.waitForTimeout(300);

    // Verify first species has .is-correct
    const firstCard = dock.locator(`[data-species-card="${first.kind}"]`);
    const firstHasCorrect = await firstCard.evaluate(el => el.classList.contains('is-correct'));
    const firstBg = await firstCard.evaluate(el => window.getComputedStyle(el).backgroundColor);
    console.log('First card is-correct:', firstHasCorrect, firstBg);
    assert.equal(firstHasCorrect, true, 'Doğru seçilen tanecik kartı is-correct sınıfına sahip olmalı');

    // Verify second species has .is-incorrect
    const secondCard = dock.locator(`[data-species-card="${second.kind}"]`);
    const secondHasIncorrect = await secondCard.evaluate(el => el.classList.contains('is-incorrect'));
    const secondBg = await secondCard.evaluate(el => window.getComputedStyle(el).backgroundColor);
    console.log('Second card is-incorrect:', secondHasIncorrect, secondBg);
    assert.equal(secondHasIncorrect, true, 'Hatalı seçilen tanecik kartı is-incorrect sınıfına sahip olmalı');
    passedChecks.push('Rolü doğru seçilen kartlar yeşil (is-correct), hatalı/boş seçilen kartlar kırmızı (is-incorrect) ile vurgulanıyor');

    // 5. Verify changing a selection removes the status class
    await dock.locator(`select[data-model-species="${second.kind}"]`).selectOption('');
    const secondHasIncorrectAfterChange = await secondCard.evaluate(el => el.classList.contains('is-incorrect'));
    assert.equal(secondHasIncorrectAfterChange, false, 'Seçim değiştirildiğinde durum sınıfı temizlenmeli');
    passedChecks.push('Seçim değiştirildiğinde kartın inceleme durumu temizleniyor');

    // Re-check with one correct and one incorrect for screenshot
    await dock.locator(`select[data-model-species="${second.kind}"]`).selectOption(wrongRole);
    await checkBtn.click();
    await page.waitForTimeout(300);

    // Capture screenshot of dock
    const artifactPath = 'C:\\Users\\hakan\\.gemini\\antigravity\\brain\\6e3cd5d1-81b1-4f45-ad92-2c9cc6a52f4f\\model-dock-reviewed-states.png';
    await page.screenshot({ path: artifactPath, fullPage: false });
    console.log('Screenshot saved to ' + artifactPath);

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
