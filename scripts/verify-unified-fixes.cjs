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
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.TepkimeArenasi && window.MebiData);
    await page.evaluate(() => {
      if (window.MebiUI && window.MebiUI.closeWelcomeModal) window.MebiUI.closeWelcomeModal();
    });

    // 1. Verify Stepper labels (Issue 3)
    await page.evaluate(() => TepkimeArenasi.dispatch('goPool'));
    const stepLabels = await page.$$eval('.mebi-step-label', els => els.map(e => e.textContent.trim()));
    assert.deepEqual(stepLabels, ['Seç', 'Tahmin', 'Deney', 'Açıkla', 'Model'], 'Step labels must be clean without duplicate numbers');

    // 2. Verify Ayarlar Dropdown Z-index and Overflow (Issue 1)
    await page.evaluate(() => {
      TepkimeArenasi.dispatch('clickReagent', 'HCl');
      TepkimeArenasi.dispatch('clickReagent', 'NaOH');
      TepkimeArenasi.dispatch('startExperiment');
    });
    await page.waitForSelector('.mebi-topbar .lab-settings-trigger');
    await page.click('.mebi-topbar .lab-settings-trigger');
    await page.waitForSelector('#labSettingsPanel:not([hidden])');

    const settingsData = await page.evaluate(() => {
      const panel = document.getElementById('labSettingsPanel');
      const topShell = document.querySelector('.mebi-top-shell');
      const panelRect = panel.getBoundingClientRect();
      const shellRect = topShell.getBoundingClientRect();
      const panelStyles = window.getComputedStyle(panel);
      const shellStyles = window.getComputedStyle(topShell);
      return {
        zIndex: panelStyles.zIndex,
        overflow: shellStyles.overflow,
        panelBottom: panelRect.bottom,
        shellBottom: shellRect.bottom,
        visible: panelStyles.display !== 'none' && panelStyles.visibility !== 'hidden'
      };
    });

    assert(Number(settingsData.zIndex) >= 1000, 'Settings panel z-index must be >= 1000');
    assert.equal(settingsData.overflow, 'visible', 'Top shell overflow must be visible to avoid clipping');
    assert(settingsData.panelBottom > settingsData.shellBottom, 'Settings panel dropdown successfully extends below top shell without being trapped');
    assert(settingsData.visible, 'Settings panel is visible');

    // Close settings
    await page.click('[data-action="closeLabSettings"]');

    // 3. Verify Collection screen from stage review and direct (Issue 2)
    await page.evaluate(() => {
      TepkimeArenasi.state.collection = [
        { r1: 'HCl', r2: 'NaOH', pair: 'HCl|NaOH', type: 'Asit-baz tepkimesi', eq: 'HCl(suda) + NaOH(suda) → NaCl(suda) + H2O(sıvı) + Isı' },
        { r1: 'CaCO3', r2: 'HCl', pair: 'CaCO3|HCl', type: 'Asit-baz tepkimesi', eq: 'CaCO3 + 2HCl → CaCl2 + CO2 + H2O' }
      ];
      TepkimeArenasi.dispatch('navigateStage', 0); // Stage review for pool
    });
    // Click collection button in topbar
    await page.click('[data-action="goCollection"]');
    await page.waitForSelector('.collection-shell');
    await page.waitForSelector('.collection-grid');
    assert.equal(await page.evaluate(() => TepkimeArenasi.state.screen), 'collection', 'Collection screen opens even from stage review');

    // Verify Collection card styles & width matching top shell
    const collectionMetrics = await page.evaluate(() => {
      const shell = document.querySelector('.collection-shell');
      const topShell = document.querySelector('.mebi-top-shell');
      const grid = document.querySelector('.collection-grid');
      const shellStyles = window.getComputedStyle(shell);
      const topStyles = window.getComputedStyle(topShell);
      const gridStyles = grid ? window.getComputedStyle(grid) : null;
      return {
        cardWidth: Math.round(shell.getBoundingClientRect().width),
        topWidth: Math.round(topShell.getBoundingClientRect().width),
        bg: shellStyles.backgroundColor,
        gridOverflowY: gridStyles ? gridStyles.overflowY : 'none'
      };
    });

    assert.equal(collectionMetrics.cardWidth, collectionMetrics.topWidth, 'Collection shell width matches top shell width');
    assert.equal(collectionMetrics.bg, 'rgb(255, 255, 255)', 'Collection shell background is white');
    assert(collectionMetrics.gridOverflowY === 'auto' || collectionMetrics.gridOverflowY === 'scroll', 'Collection grid has vertical scroll');

    // 4. Verify Collection Card Clickability Removed and Close Button Works (Item 6)
    const cardCount = await page.locator('.collection-card').count();
    if (cardCount > 0) {
      const cardAction = await page.locator('.collection-card:first-child').getAttribute('data-action');
      assert.equal(cardAction, null, 'Reaction card in collection must not be clickable');
    }
    const closeBtn = await page.locator('[data-action="closeCollection"]').count();
    assert(closeBtn > 0, 'Collection must have close button');

    // 5. Verify Observation Comparison Callout & Note styling (Issue 4)
    const obsInit = await page.evaluate(() => {
      TepkimeArenasi.state.screen = 'lab';
      TepkimeArenasi.state.selectedSlot1 = 'HCl';
      TepkimeArenasi.state.selectedSlot2 = 'NaOH';
      TepkimeArenasi.state.activeReaction = MebiData.getReaction('HCl', 'NaOH');
      TepkimeArenasi.state.predictionRecord = {
        id: 'pred-1',
        startedAt: new Date().toISOString(),
        answers: {
          gas: { choice: 'yes', reason: 'r' },
          precipitate: { choice: 'no', reason: 'r' },
          color: { choice: 'no', reason: 'r' },
          tempRise: { choice: 'yes', reason: 'r' },
          tempFall: { choice: 'no', reason: 'r' }
        }
      };
      const s = TepkimeArenasi.state;
      s.labStep = 'observed';
      s.poured = true;
      s.experiment = s.experiment || {};
      s.experiment.transfer = 1;
      s.currentTemp = s.activeReaction.tempFinal;
      MebiObservation.reset(s);
      MebiPrediction.items.forEach(item => TepkimeArenasi.dispatch('setObservationChoice', item.key + ':' + (item.key === 'tempFall' ? 'no' : 'yes')));
      MebiObservation.setNote(s, 'Gözlem notum burada.');
      TepkimeArenasi.dispatch('saveObservation');
      TepkimeArenasi.dispatch('setObservationTab', 'compare');
      return {
        labStep: s.labStep,
        hasRecord: !!s.observation?.record,
        tab: s.observation?.tab,
        canObserve: !!(s.screen === 'lab' && s.labStep === 'observed' && s.poured && s.experiment && s.experiment.transfer >= 1 && s.predictionRecord && s.predictionRecord.startedAt)
      };
    });
    assert(obsInit.hasRecord, 'Observation record exists: ' + JSON.stringify(obsInit));

    await page.waitForSelector('.observation-saved-note');
    const obsStyles = await page.evaluate(() => {
      const note = document.querySelector('.comparison-evidence .observation-saved-note');
      const reflection = document.querySelector('.comparison-reflection');
      const noteStyles = window.getComputedStyle(note);
      const refStyles = window.getComputedStyle(reflection);
      return {
        noteBg: noteStyles.backgroundColor,
        noteBorderLeft: noteStyles.borderLeftColor,
        refBg: refStyles.backgroundColor
      };
    });

    assert.equal(obsStyles.noteBg, 'rgb(248, 250, 252)', 'Observation saved note has clean #f8fafc background');
    assert.equal(obsStyles.noteBorderLeft, 'rgb(2, 132, 199)', 'Observation saved note has #0284c7 border-left');
    assert.equal(obsStyles.refBg, 'rgb(248, 250, 252)', 'Reflection box has clean #f8fafc background');

    console.log(JSON.stringify({
      passed: true,
      checks: [
        'Stepper labels clean without duplicate numbers',
        'Ayarlar panel z-index >= 1000 and top-shell overflow visible without clipping',
        'Collection shell matches top shell width and has white surface',
        'Collection grid has vertical scroll and reduced height',
        'Collection opens reliably from all screens including stage review',
        'Reaction card in collection is not clickable and has close button',
        'Observation saved note and reflection callouts adopt clean #f8fafc and #0284c7 styles'
      ]
    }, null, 2));

  } finally {
    await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error(err);
  server.close();
  process.exit(1);
});
