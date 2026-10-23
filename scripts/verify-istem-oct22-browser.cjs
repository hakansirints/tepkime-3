const enterStudentInputs = require('./student-inputs.cjs');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const pw = require(path.join(require('node:os').homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'artifacts/istem-oct22-qa');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep) || file.includes(path.sep + '.git' + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, body) => {
    res.writeHead(err ? 404 : 200, { 'Content-Type': ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream' });
    res.end(err ? 'Not found' : body);
  });
});
let browser;
const errors = [];
const checks = [];
async function freshPage(width = 1366, height = 768) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('mebi_hide_welcome_modal', 'true'));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  await page.waitForFunction(() => window.TepkimeArenasi && window.MebiExplanationModel);
  return page;
}
async function dispatch(page, action, arg) {
  return page.evaluate(({ action, arg }) => window.TepkimeArenasi.dispatch(action, arg), { action, arg });
}
async function advance(page, selector, ready) {
  await page.locator(selector).click();
  await page.waitForSelector('.mebi-saving-indicator', { state: 'visible' });
  assert(await page.locator(selector).first().isDisabled(), selector + ' must prevent double saves');
  await page.waitForFunction(ready);
}
async function observe(page, a, b, animate = false) {
  await dispatch(page, 'goPool');
  await dispatch(page, 'clickReagent', a);
  await dispatch(page, 'clickReagent', b);
  await page.waitForFunction(() => !window.TepkimeArenasi.state.isFilling);
  await dispatch(page, 'startExperiment');
  await enterStudentInputs(page, 'prediction');
  if (animate) await advance(page, '[data-action="beginExperiment"]', () => window.TepkimeArenasi.state.labStep === 'ready');
  else await dispatch(page, 'beginExperiment');
  await page.evaluate(() => {
    const s = window.TepkimeArenasi.state;
    s.labStep = 'observed'; s.poured = true; s.experiment.transfer = 1; s.currentTemp = s.activeReaction.tempFinal;
    window.MebiObservation.reset(s); window.TepkimeArenasi.render(false);
  });
  await enterStudentInputs(page, 'observation');
  if (animate) await advance(page, '[data-action="saveObservationAndProceed"]', () => window.TepkimeArenasi.state.screen === 'card');
  else { await dispatch(page, 'saveObservationAndProceed'); }
}
async function toModel(page, animate = false) {
  await enterStudentInputs(page, 'explanation');
  if (animate) await advance(page, '[data-action="toModel"]', () => window.TepkimeArenasi.state.screen === 'model');
  else await dispatch(page, 'toModel');
}
async function fillNonreaction(page) {
  await page.evaluate(() => {
    const s = window.TepkimeArenasi.state, nr = window.MebiNonReaction, scenario = nr.scenario(s);
    scenario.after.forEach(t => { nr.action(s, 'add', t.kind + ':' + t.phase); nr.action(s, 'count', t.kind + ':' + t.phase + '|' + t.count); });
    nr.action(s, 'interpret', nr.validate(s).expectedInterpretation);
    nr.action(s, 'reason', 'Gözlemde yeni ürün oluşmadı; başlangıç ve son durumdaki tanecik türleri aynı kaldı.');
    window.TepkimeArenasi.render(false);
  });
}
async function shot(page, name) { await page.screenshot({ path: path.join(out, name + '.png') }); }
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = await pw.chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
  const page = await freshPage();
  await observe(page, 'H2O2', 'HCl', true);
  assert.match(await page.locator('[data-action="backToObservation"]').textContent(), /Gözlem Kartına Dön/);
  await page.locator('[data-action="backToObservation"]').click();
  assert.equal(await page.evaluate(() => window.MebiObservation.get(window.TepkimeArenasi.state).tab), 'observe');
  assert(await page.locator('.observation-card:not(.is-comparing)').isVisible());
  await advance(page, '[data-action="saveObservationAndProceed"]', () => window.TepkimeArenasi.state.screen === 'card');
  await toModel(page, true);
  await enterStudentInputs(page, 'model');
  await dispatch(page, 'closeModelHelpModal');
  await advance(page, '[data-action="saveModelAndToEquation"]', () => window.MebiModel.get(window.TepkimeArenasi.state).subView === 'equation');
  checks.push('progress ring on prediction, observation, explanation and model saves; observation return');
  await page.evaluate(() => {
    const s = window.TepkimeArenasi.state, m = window.MebiModel;
    ['H2O2', 'Cl', 'H3O'].forEach(k => m.addTerm(s, 'reactants', k));
    ['Cl2', 'H2O'].forEach(k => m.addTerm(s, 'products', k));
    window.TepkimeArenasi.render(false);
  });
  const firstUp = '.equation-side.is-reactants .coeff-up';
  const bounds = await page.locator(firstUp).first().boundingBox();
  const rowBounds = await page.locator('.equation-draft-row').boundingBox();
  assert(bounds.y >= rowBounds.y && bounds.y + bounds.height <= rowBounds.y + rowBounds.height, 'first coefficient increment must be inside the scroll area');
  await page.locator(firstUp).first().click();
  assert.equal(await page.locator('.is-reactants .coeff-input').first().inputValue(), '2');
  await page.locator('[data-action="checkEquation"]').first().click();
  assert.equal((await page.locator('#modelStatus').textContent()).trim(), '');
  assert(await page.locator('.equation-inline-error').isVisible());
  await shot(page, 'equation-invalid-light');
  await page.evaluate(() => {
    const s = window.TepkimeArenasi.state, m = window.MebiModel;
    [1, 2, 2].forEach((v, i) => m.setCoefficient(s, 'reactants', i, v));
    m.setCoefficient(s, 'products', 1, 4); window.TepkimeArenasi.render(false);
  });
  assert(await page.locator('.equation-check-button.is-balanced').isVisible());
  const centers = await page.locator('.equation-check-button').evaluate(button => {
    const b = button.getBoundingClientRect(), p = button.closest('.equation-draft-container').getBoundingClientRect();
    return Math.abs(b.x + b.width / 2 - p.x - p.width / 2);
  });
  assert(centers < 2, 'check button must be centered');
  await shot(page, 'equation-balanced-light');
  await dispatch(page, 'toggleTheme');
  await shot(page, 'equation-balanced-dark');
  await advance(page, '.prediction-actions [data-action="saveEquation"]', () => !!window.TepkimeArenasi.state.showCompletionModal);
  checks.push('three-term first coefficient works; centered balanced glow; no equation error in footer; equation save ring');
  await page.close();

  for (const [a, b, mode] of [['NaHCO3', 'CaCO3', 'dry'], ['KI', 'CaCl2', 'liquid']]) {
    const p = await freshPage();
    await observe(p, a, b);
    await shot(p, mode + '-explanation-light');
    await toModel(p, true);
    assert.equal(await p.locator('[data-nr-action="check"],[data-nr-action="clear"]').count(), 0);
    if (mode === 'dry') {
      const rows = await p.locator('.nr-radio-group label').evaluateAll(els => els.map(el => ({ y: el.getBoundingClientRect().y, width: el.scrollWidth, visible: el.clientWidth })));
      assert(rows.every(r => r.width <= r.visible + 1));
      assert(Math.max(...rows.map(r => r.y)) - Math.min(...rows.map(r => r.y)) < 2, 'dry interpretations must share one row');
    }
    await p.locator('[data-action="saveNonReaction"]').click();
    assert(await p.locator('#nrNotice[open]').isVisible());
    assert.match(await p.locator('#nrNotice').textContent(), /eksik|boş/);
    assert.equal(await p.locator('.nr-footer-message').count(), 0);
    await shot(p, mode + '-error-light');
    await p.locator('[data-action="dismissNonReactionNotice"]').click();
    await fillNonreaction(p);
    // Missing rationale and an incorrect count must produce useful, separate messages.
    await p.evaluate(() => { const s = window.TepkimeArenasi.state, nr = window.MebiNonReaction, t = nr.get(s).terms[0]; nr.action(s, 'count', t.kind + ':' + t.phase + '|' + (t.count + 1)); nr.action(s, 'reason', ''); window.TepkimeArenasi.render(false); });
    await p.locator('[data-action="saveNonReaction"]').click();
    assert.match(await p.locator('#nrNotice').textContent(), /temsili sayısı/);
    assert.match(await p.locator('#nrNotice').textContent(), /Gerekçe alanı boş/);
    await p.locator('[data-action="dismissNonReactionNotice"]').click();
    await p.evaluate(() => {const s=window.TepkimeArenasi.state;window.MebiNonReaction.get(s).terms=[];});
    await fillNonreaction(p);
    await dispatch(p, 'toggleTheme');
    await shot(p, mode + '-model-dark');
    await advance(p, '[data-action="saveNonReaction"]', () => !!document.querySelector('#nrNotice[open]'));
    assert.equal(await p.locator('#nrNoticeMessage').textContent(), 'Modelin ve tepkimesiz sonucunun gerekçesi laboratuvar günlüğüne kaydedildi.');
    assert.equal(await p.locator('#nrNotice button').count(), 2);
    await shot(p, mode + '-saved-dark');
    if (mode === 'dry') {
      await p.locator('#nrNotice [data-action="viewCollectionFromCompletion"]').click();
      assert.equal(await p.evaluate(() => window.TepkimeArenasi.state.screen), 'collection');
      assert.match(await p.locator('#app').textContent(), /Gözlemde yeni ürün oluşmadı/);
    } else {
      await p.locator('#nrNotice [data-action="startNewExperiment"]').click();
      assert.equal(await p.evaluate(() => window.TepkimeArenasi.state.screen), 'pool');
      await dispatch(p, 'toggleLabSettings');
      await shot(p, 'gallery-settings-dark');
      const colors = await p.locator('.reagent-gallery-card').first().evaluate(el => ({ background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el.querySelector('strong')).color }));
      assert.equal(colors.background, 'rgb(41, 43, 53)');
      assert.equal(colors.color, 'rgb(241, 245, 249)');
      const settings = await p.locator('.lab-settings-btn-tile').first().evaluate(el => ({ background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }));
      assert.notEqual(settings.background, 'rgb(255, 255, 255)');
      assert(['rgb(226, 232, 240)', 'rgb(186, 230, 253)'].includes(settings.color));
    }
    await p.close();
    checks.push(mode + ': removed check/clear; detailed error dialog; save ring and success choices navigate correctly');
  }
  const mobile = await freshPage(844, 390);
  await observe(mobile, 'NaHCO3', 'CaCO3'); await toModel(mobile);
  await mobile.locator('[data-action="saveNonReaction"]').click();
  const dialog = await mobile.locator('#nrNotice').boundingBox();
  assert(dialog.x >= 0 && dialog.y >= 0 && dialog.x + dialog.width <= 844 && dialog.y + dialog.height <= 390);
  await mobile.locator('[data-action="dismissNonReactionNotice"]').click();
  await fillNonreaction(mobile);
  await advance(mobile, '[data-action="saveNonReaction"]', () => !!document.querySelector('#nrNotice[open]'));
  await shot(mobile, 'mobile-success-light');
  checks.push('landscape mobile error and success dialogs fit the viewport');
  assert.deepEqual(errors, [], 'browser runtime errors');
  console.log(JSON.stringify({ passed: true, checks, screenshots: out }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
