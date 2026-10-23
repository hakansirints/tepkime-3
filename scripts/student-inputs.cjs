/* Browser-test fixtures only. Exercise the same input events as a student;
   this file is never loaded by the site. */
async function enterStudentInputs(page, stage) {
  if (stage === 'prediction') {
    for (const key of ['gas', 'precipitate', 'color', 'tempRise', 'tempFall']) {
      await page.locator('[data-prediction-control="' + key + '-unsure"]').click();
      await page.locator('[data-reason-key="' + key + '"]').fill('Bu belirtiyi deneyde gözlemleyerek değerlendireceğim.');
    }
  } else if (stage === 'observation') {
    const answers = await page.evaluate(() => {
      const s = window.TepkimeArenasi.state;
      const observed = window.MebiPrediction.outcomes(s.activeReaction);
      observed.tempRise = s.currentTemp > s.activeReaction.tempInit;
      observed.tempFall = s.currentTemp < s.activeReaction.tempInit;
      return observed;
    });
    for (const [key, value] of Object.entries(answers)) {
      await page.locator('[data-observation-control="' + key + '-' + (value ? 'yes' : 'no') + '"]').click();
    }
    await page.locator('#observationNote').fill('Karışımın görünüşünü ve termometredeki son sıcaklığı gözlemledim.');
  } else if (stage === 'explanation') {
    await page.locator('[data-explanation-change][value="chemical"]').check();
    await page.locator('#explanationEditor').fill('Gözlemimi taneciklerin yeniden düzenlenmesiyle ilişkilendiriyorum; atom türleri korunur.');
  } else if (stage === 'model') {
    const species = await page.evaluate(() => window.MebiModel.data(window.TepkimeArenasi.state).species.map(p => ({kind:p.kind, role:p.role})));
    for (const p of species) await page.locator('select[data-model-species="' + p.kind + '"]').selectOption(p.role);
  } else throw Error('Unknown student-input stage: ' + stage);
}
module.exports = enterStudentInputs;
