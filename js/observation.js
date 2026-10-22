/* Student observations belong to an attempt, independently of model outcomes. */
(function(window) {
  'use strict';
  var STORAGE_KEY = 'tepkime_arenasi_observations_v1';
  var serial = 0;
  var choices = [{ value:'yes', label:'Gözledim' }, { value:'no', label:'Gözlemedim' }, { value:'unsure', label:'Emin Değilim' }];
  function items() { return window.MebiPrediction.items; }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function esc(value) { return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function empty() { var answers = {}; items().forEach(function(item) { answers[item.key] = null; }); return answers; }
  function reset(state) {
    state.observation = { attemptId:window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now() + '-observation-' + (++serial),
      answers:empty(), note:'', record:null, tab:'observe', labVisible:false, reflection:'', savedReflection:'', reflectionSaved:false, message:'', storageError:false, errors:{ rows:{}, note:false } };
    return state.observation;
  }
  function validRecord(record) {
    return record && record.version === 1 && typeof record.id === 'string' && typeof record.predictionId === 'string' &&
      typeof record.createdAt === 'string' && isFinite(Date.parse(record.createdAt)) && Array.isArray(record.pair) && record.pair.length === 2 &&
      record.pair.every(function(id) { return !!window.MebiData.getReagent(id); }) &&
      record.answers && items().every(function(item) { return /^(yes|no|unsure)$/.test(record.answers[item.key]); }) &&
      typeof record.note === 'string' && record.note.trim().length > 0 && record.note.length <= 400 &&
      record.prediction && record.prediction.id === record.predictionId && record.prediction.answers &&
      items().every(function(item) { var a = record.prediction.answers[item.key]; return a && /^(yes|no|unsure)$/.test(a.choice) && typeof a.reason === 'string'; }) &&
      record.temperature && typeof record.temperature.initial === 'number' && isFinite(record.temperature.initial) &&
      typeof record.temperature.final === 'number' && isFinite(record.temperature.final);
  }
  function readEntries() {
    var entries = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(entries)) throw new Error('Invalid observation records');
    return entries.filter(function(entry) { return entry && validRecord(entry.record); });
  }
  function applyEntry(observation, entry) {
    observation.record = copy(entry.record); observation.answers = copy(entry.record.answers); observation.note = entry.record.note;
    observation.reflection = typeof entry.reflection === 'string' ? entry.reflection.slice(0,400) : '';
    observation.savedReflection = observation.reflection; observation.reflectionSaved = !!entry.reflectionUpdatedAt;
  }
  function get(state) {
    var observation = state.observation || reset(state);
    // A restored navigation snapshot cannot replace an already saved first record.
    if (!observation.record) {
      try { var entry = readEntries().find(function(entry) { return entry.record.id === observation.attemptId; }); if (entry) applyEntry(observation, entry); } catch (error) {}
    }
    return observation;
  }
  function canObserve(state) {
    return state.screen === 'lab' && state.labStep === 'observed' && state.poured && state.experiment && state.experiment.transfer >= 1 &&
      state.predictionRecord && state.predictionRecord.startedAt && state.activeReaction;
  }
  function editable(state) { return !!canObserve(state); }
  function complete(state) { var o = get(state); return items().filter(function(item) { return /^(yes|no|unsure)$/.test(o.answers[item.key]); }).length; }
  function setChoice(state, value) {
    if (!editable(state)) return false;
    var parts = String(value).split(':');
    if (!items().some(function(item) { return item.key === parts[0]; }) || !/^(yes|no|unsure)$/.test(parts[1])) return false;
    var o = get(state);
    o.answers[parts[0]] = parts[1];
    if (parts[0] === 'tempRise' && parts[1] === 'yes') {
      if (o.answers.tempFall === 'yes') {
        o.answers.tempFall = null;
      }
    } else if (parts[0] === 'tempFall' && parts[1] === 'yes') {
      if (o.answers.tempRise === 'yes') {
        o.answers.tempRise = null;
      }
    }
    if (o.errors && o.errors.rows) delete o.errors.rows[parts[0]];
    o.message = ''; return true;
  }
  function setNote(state, value) {
    if (!editable(state)) return false;
    var o = get(state);
    o.note = String(value).slice(0,400);
    if (o.note.trim() && o.errors) o.errors.note = false;
    o.message = ''; return true;
  }
  function writeEntry(state, reflectionOnly) {
    var o = get(state);
    try {
      var entries = readEntries(), index = entries.findIndex(function(entry) { return entry.record.id === o.record.id; });
      var entry = index < 0 ? { record:copy(o.record), reflection:'', reflectionUpdatedAt:null } : entries[index];
      if (reflectionOnly) { entry.reflection = o.reflection.trim(); entry.reflectionUpdatedAt = new Date().toISOString(); }
      else { entry.record = copy(o.record); }
      if (index < 0) entries.push(entry); else entries[index] = entry;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); o.storageError = false;
    } catch (error) { o.storageError = true; }
  }
  function save(state) {
    if (!editable(state)) return false;
    var o = get(state);
    o.errors = { rows:{}, note:false };
    items().forEach(function(item) {
      if (!/^(yes|no|unsure)$/.test(o.answers[item.key])) {
        o.errors.rows[item.key] = true;
      }
    });
    if (!o.note.trim()) o.errors.note = true;
    if (complete(state) !== items().length) { o.message = 'Her belirti için bir gözlem seçeneği belirle. Emin Değilim geçerli bir yanıttır.'; return false; }
    if (!o.note.trim()) { o.message = 'Gördüğün bulguyu anlatan kısa bir gözlem notu ekle.'; return false; }
    if (o.answers.tempRise === 'yes' && o.answers.tempFall === 'yes') { o.message = 'Son sıcaklık ilk sıcaklıktan hem yüksek hem düşük olamaz. Sıcaklık gözlemlerini gözden geçir.'; return false; }
    var temperature = { initial:Number(state.activeReaction.tempInit), final:Number(state.currentTemp) };
    if (!isFinite(temperature.initial) || !isFinite(temperature.final)) { o.message = 'Sıcaklık verisi henüz hazır değil.'; return false; }
    o.record = { version:1, id:o.attemptId, predictionId:state.predictionRecord.id, pair:[state.selectedSlot1,state.selectedSlot2],
      createdAt:(o.record && o.record.createdAt) || new Date().toISOString(), answers:copy(o.answers), note:o.note.trim(), temperature:temperature,
      quantities:copy(window.MebiExperiment.quantities(state)), conditions:copy(window.MebiExperiment.defaults), prediction:copy(state.predictionRecord) };
    o.note = o.record.note; o.message = ''; writeEntry(state, false); return true;
  }
  function setTab(state, tab) {
    if (!canObserve(state) || (tab !== 'observe' && tab !== 'compare')) return false;
    var o = get(state);
    if (tab === 'compare') {
      if (!save(state)) return false;
    }
    o.tab = tab;
    return true;
  }
  function showLab(state, visible) { if (!canObserve(state)) return false; get(state).labVisible = !!visible; return true; }
  function setReflection(state, value) { if (!canObserve(state) || !get(state).record) return false; var o = get(state); o.reflection = String(value).slice(0,400); o.reflectionSaved = false; o.message = ''; return true; }
  function saveReflection(state) {
    if (!canObserve(state) || !get(state).record) return false;
    var o = get(state); if (!o.reflection.trim()) { o.message = 'Not eklemek istersen düşünceni yaz; bu alanı boş bırakarak da devam edebilirsin.'; return false; }
    o.reflection = o.reflection.trim(); o.savedReflection = o.reflection; o.reflectionSaved = true; o.message = ''; writeEntry(state, true); return true;
  }
  function number(value) { return Number(value).toLocaleString('tr-TR', { minimumFractionDigits:1, maximumFractionDigits:1 }); }
  function autoFillForTesting(state) {
    if (!canObserve(state)) return false;
    var o = get(state);
    if (o.tab === 'compare' && o.record) {
      var changed = [], confirmed = [], uncertain = [];
      items().forEach(function(item) {
        var predicted = o.record.prediction.answers[item.key].choice, observed = o.record.answers[item.key];
        if (predicted === 'unsure' || observed === 'unsure') uncertain.push(item.label.toLocaleLowerCase('tr-TR'));
        else (predicted === observed ? confirmed : changed).push(item.label.toLocaleLowerCase('tr-TR'));
      });
      return setReflection(state, (changed.length ? 'Gözlem kaydımda ' + changed.join(', ') + ' ile ilgili bulgular tahminimden farklıydı; bu tahminlerimi kaydettiğim verilere göre yeniden değerlendiriyorum. ' : '') +
        (confirmed.length ? confirmed.join(', ') + ' ile ilgili tahminlerim gözlem kaydımla uyumlu. ' : '') +
        (uncertain.length ? uncertain.join(', ') + ' konusunda karara varmak için ek gözleme ihtiyacım var.' : ''));
    }
    var actual = window.MebiPrediction.outcomes(state.activeReaction);
    var initial = Number(state.activeReaction.tempInit), current = Number(state.currentTemp);
    if (!isFinite(initial) || !isFinite(current)) return false;
    actual.tempRise = current > initial; actual.tempFall = current < initial;
    items().forEach(function(item) { o.answers[item.key] = actual[item.key] ? 'yes' : 'no'; });
    var observations = [actual.gas ? 'Kabarcık oluştu.' : 'Kabarcık gözlemedim.',
      actual.precipitate ? 'Çökelti oluştu.' : 'Çökelti gözlemedim.',
      actual.color ? 'Karışımın rengi değişti.' : 'Renk değişimi gözlemedim.',
      actual.tempRise || actual.tempFall ? 'Sıcaklık ' + number(initial) + ' °C’den ' + number(current) + ' °C’ye ' + (actual.tempRise ? 'yükseldi.' : 'düştü.') : 'Sıcaklık ' + number(current) + ' °C’de sabit kaldı.'];
    o.note = observations.join(' '); o.message = ''; return true;
  }
  function temperatureHTML(state) {
    var o = get(state), t = o.record ? o.record.temperature : { initial:state.activeReaction.tempInit, final:state.currentTemp };
    return '<div class="observation-temperature" aria-label="Sanal deney sıcaklık verileri"><span>İlk: <strong>' + number(t.initial) + ' °C</strong></span><span>Son: <strong>' + number(t.final) + ' °C</strong></span><span>ΔT: <strong>' + number(t.final - t.initial) + ' °C</strong></span></div>';
  }
  function observationLabel(value) { return value === 'yes' ? 'Gözledim' : value === 'no' ? 'Gözlemedim' : 'Emin Değilim'; }
  function comparisonHTML(state, reviewOnly) {
    var o = get(state), record = o.record;
    return '<div class="observation-compare-layout"><div class="comparison-table-wrap"><h2 class="comparison-section-title">Tahminim ve Gözlemim</h2><table class="learning-matrix observation-comparison-table"><caption class="sr-only">İlk tahminin ve kaydettiğin gözlemin karşılaştırması.</caption><thead><tr><th scope="col">Belirti</th><th scope="col">İlk Tahminim</th><th scope="col">Gözlemim</th><th scope="col">Karşılaştırma</th></tr></thead><tbody>' + items().map(function(item) {
      var prediction = record.prediction.answers[item.key], answer = record.answers[item.key];
      var result = prediction.choice === 'unsure' ? 'İlk tahminimde kararsızdım' : answer === 'unsure' ? 'Gözlemimden emin değilim' : prediction.choice === answer ? 'Tahminimle uyumlu' : 'Tahminimden farklı';
      var predictionLabel = prediction.choice === 'yes' ? 'Evet' : prediction.choice === 'no' ? 'Hayır' : 'Kararsızdım';
      var status = prediction.choice === 'unsure' || answer === 'unsure' ? 'uncertain' : prediction.choice === answer ? 'match' : 'different';
      var statusLabel = status === 'match' ? 'Uyumlu' : status === 'different' ? 'Farklı' : 'Kararsız';
      var statusIcon = status === 'different' ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>' : window.MebiSVG.icon(status === 'match' ? 'check' : 'helpCircle');
      return '<tr class="observation-comparison-row" data-comparison="' + status + '"><th scope="row">' + item.label + '<details class="observation-reason"><summary>İlk gerekçem</summary><div>' + esc(prediction.reason) + '</div></details></th><td>' + predictionLabel + '</td><td>' + observationLabel(answer) + '</td><td><span class="comparison-result is-' + status + '" aria-label="' + esc(result) + '" title="' + esc(result) + '">' + statusIcon + '<span>' + statusLabel + '</span></span></td></tr>';
    }).join('') + '</tbody></table></div><div class="observation-notes comparison-evidence">' + temperatureHTML(state) + '<div class="observation-saved-note"><strong>' + window.MebiSVG.icon('eye') + 'Kaydettiğim Gözlem</strong><blockquote>' + esc(record.note) + '</blockquote></div>' +
      (reviewOnly ? '' : '<div class="comparison-reflection"><label class="observation-label" for="observationReflection">' + window.MebiSVG.icon('helpCircle') + 'Tahminimde Ne Değişti? <span>(İsteğe bağlı)</span></label><textarea id="observationReflection" class="observation-textarea" rows="3" maxlength="400" data-observation-control="reflection" placeholder="Hangi tahmininle gözlemin farklıydı? Hangi bulguya dayandın?">' + esc(o.reflection) + '</textarea>' +
      '<p class="observation-saved" id="observationReflectionStatus" role="status">' + (o.reflectionSaved ? 'Karşılaştırma notun kaydedildi.' : '') + '</p></div>') + '</div></div>';
  }
  function formHTML(state) {
    var o = get(state);
    var errRows = (o.errors && o.errors.rows) || {};
    var errNote = !!(o.errors && o.errors.note);
    return '<div class="observation-form-layout"><div class="observation-signs"><table class="learning-matrix observation-matrix"><caption class="sr-only">Her belirti için gözlemini kaydet. Emin Değilim geçerli bir yanıttır.</caption><colgroup><col class="obs-sign-col"><col class="obs-col-yes"><col class="obs-col-no"><col class="obs-col-unsure"></colgroup><thead><tr><th scope="col">Belirti</th>' + choices.map(function(choice) { return '<th scope="col" class="learning-choice-heading obs-heading-' + choice.value + '">' + choice.label + '</th>'; }).join('') + '</tr></thead><tbody>' + items().map(function(item) {
      var rowError = !!errRows[item.key];
      return '<tr class="observation-row' + (rowError ? ' has-error' : '') + '"><th scope="row">' + item.label + '</th>' + choices.map(function(choice) {
        return '<td class="observation-options"><button type="button" class="learning-mark" data-action="setObservationChoice" data-arg="' + item.key + ':' + choice.value + '" data-observation-control="' + item.key + '-' + choice.value + '" aria-label="' + item.label + ': ' + choice.label + '" title="' + choice.label + '" aria-pressed="' + (o.answers[item.key] === choice.value) + '"><span class="learning-tick" aria-hidden="true">' + window.MebiSVG.icon('check') + '</span></button></td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody></table></div><div class="observation-notes">' + temperatureHTML(state) + '<label class="observation-label" for="observationNote">Gözlem Notum</label><textarea class="observation-textarea' + (errNote ? ' has-error' : '') + '" id="observationNote" data-observation-control="note" rows="4" maxlength="400" placeholder="Karışımın görünüşünde, sıcaklığında veya kabarcıklarda ne gözledin?">' + esc(o.note) + '</textarea>' +
      '<div class="observation-note-meta"><span>Gördüğün bulguyu kendi cümlenle yaz.</span><span id="observationNoteCount">' + o.note.length + ' / 400</span></div></div></div>';
  }
  function pairHTML(state) {
    return '<div class="prediction-pair" aria-label="Deneyde karıştırılan maddeler">' + [state.selectedSlot1,state.selectedSlot2].map(function(id, index) {
      var reagent = window.MebiData.getReagent(id), kind = reagent.solid ? 'powder' : reagent.id === 'Cu(NO3)2' ? 'blue' : 'clear';
      return (index ? '<span aria-hidden="true">+</span>' : '') + '<div class="prediction-material"><span class="prediction-material-image is-' + kind + '"><img src="image/reagents/' + kind + '.webp?v=56b7ccbc1a23" width="640" height="440" alt=""></span><span><strong>' + esc(reagent.f) + '</strong><small>' + esc(reagent.name) + ' · ' + (reagent.solid ? 'katı toz · ' + window.MebiExperiment.initialAmount(reagent).solidGrams.toLocaleString('tr-TR',{minimumFractionDigits:3,maximumFractionDigits:3}) + ' g' : 'suda · ' + window.MebiExperiment.defaults.solutionMl + ' mL') + '</small></span></div>';
    }).join('') + '</div>';
  }
  function deskHTML(state) {
    var attentionClass = state && state.benchAttention ? ' is-attention-pulse' : '';
    return '<aside class="bench-dock' + attentionClass + '" id="benchDock"><header class="dock-header"><span class="dock-badge">3. Deney · Gözlem</span><h3 class="dock-title">Karışımı İncele</h3><p class="dock-subtext">Deney masasında karışımı yeniden inceleyebilirsin. Gözlem ve karşılaştırma işlemleri ana gözlem kartındadır.</p></header>' + '<button type="button" class="mebi-btn mebi-btn-primary dock-btn-full" data-action="openObservationCard">Deney Gözlem Kartını Aç →</button>' + window.MebiExperiment.actionsHTML() + '</aside>';
  }
  function reviewModalHTML(state) {
    var o = get(state), record = o.record;
    if (!record) return '';
    return '<dialog id="explanationPredictionDialog" class="explanation-prediction-dialog mebi-comparison-dialog prediction-card observation-card is-comparing is-modal-view" aria-labelledby="predictionReviewTitle">' +
        '<header class="learning-card-header">' +
          '<button type="button" class="modal-close-btn-topright" data-action="closePredictionDialog" aria-label="Kapat" title="Kapat">✕</button>' +
          '<div class="learning-header-copy">' +
            '<div class="prediction-heading arena-stage-heading">' +
              '<span class="prediction-eyebrow">' + window.MebiSVG.icon('beakerIc') + ' 3. Deney</span>' +
              '<h1 id="predictionReviewTitle">Tahminim ve Gözlemim</h1>' +
            '</div>' +
            '<p class="prediction-intro">İlk tahminin ile kendi gözlem kaydını karşılaştır.</p>' +
          '</div>' +
          pairHTML(state) +
        '</header>' +
        '<div id="observationPanelModal" class="prediction-content">' +
          comparisonHTML(state, true) +
        '</div>' +
        '<footer class="prediction-footer observation-footer">' +
          '<div class="prediction-actions">' +
            '<button type="button" class="mebi-btn mebi-btn-primary mebi-btn-sm" data-action="closePredictionDialog">Açıklama Aşamasına Devam Et</button>' +
          '</div>' +
        '</footer>' +
    '</dialog>';
  }

  function render(state) {
    var o = get(state), comparing = o.tab === 'compare' && o.record;
    var message = o.storageError ? 'Bu oturumda kaydedildi; tarayıcıda kalıcı kayıt yapılamadı.' : o.message || 'Emin Değilim geçerli bir yanıttır.';
    var leftActions = '<div class="prediction-footer-left"><button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="restartExperiment">Deneyi Yeniden Başlat</button>' +
      '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="autoFillObservationForTesting">Test İçin Otomatik Doldur</button></div>';
    var rightActions = comparing ?
      '<div class="prediction-actions"><button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="setObservationTab" data-arg="observe" data-observation-control="back-observe">Gözlem Kartına Dön</button>' +
      '<button type="button" class="mebi-btn mebi-btn-primary mebi-btn-sm" data-action="toCard">Açıklama Aşamasına Devam Et</button></div>' :
      '<div class="prediction-actions"><span id="observationSavedStatus" class="prediction-saved-status" role="status" aria-live="polite"></span><button type="button" id="saveAndProceedButton" class="mebi-btn mebi-btn-primary mebi-btn-sm" data-action="saveObservationAndProceed">' + window.MebiSVG.icon('save') + ' Gözlemi Kaydet ve Açıkla Aşamasına Geç →</button></div>';
    var centerInfo = !comparing && o.storageError ?
      '<div><p class="is-storage-error">Bu oturumda kaydedildi; tarayıcıda kalıcı kayıt yapılamadı.</p></div>' : '';

    return '<section class="prediction-card observation-card' + (comparing ? ' is-comparing' : '') + (o.record ? ' is-recorded' : '') + '" id="observationCard" aria-labelledby="observationTitle"><header class="learning-card-header"><div class="learning-header-copy"><div class="prediction-heading arena-stage-heading"><span class="prediction-eyebrow">' + window.MebiSVG.icon('beakerIc') + ' 3. Deney</span><h1 id="observationTitle">' + (comparing ? 'Tahminim ve Gözlemim' : 'Gözlemini Kaydet') + '</h1></div><p class="prediction-intro">' + (comparing ? 'İlk tahminin ile kendi gözlem kaydını karşılaştır.' : 'Karıştırma sonrası gördüklerini işaretle ve kısa bir not ekle.') + '</p></div>' + pairHTML(state) + '</header>' +
      '<div id="observationPanel" class="prediction-content" role="region" aria-labelledby="observationTitle">' + (comparing ? comparisonHTML(state) : formHTML(state)) + '</div>' +
      '<p class="observation-message' + (o.message === 'Gözlem kaydedildi.' ? ' is-success' : '') + '" id="observationMessage" role="alert">' + (comparing ? '' : esc(o.message)) + '</p>' +
      '<footer class="prediction-footer observation-footer">' + leftActions + centerInfo + rightActions + '</footer></section>';
  }
  function wireInputs(state) {
    var note = document.getElementById('observationNote'), reflection = document.getElementById('observationReflection');
    if (note) note.addEventListener('input', function() {
      if (setNote(state, note.value)) {
        note.classList.remove('has-error');
        var cnt = document.getElementById('observationNoteCount');
        if (cnt) cnt.textContent = get(state).note.length + ' / 400';
        var msg = document.getElementById('observationMessage');
        if (msg) msg.textContent = '';
      }
    });
    if (reflection) reflection.addEventListener('input', function() {
      if (setReflection(state, reflection.value)) {
        var st = document.getElementById('observationReflectionStatus');
        if (st) st.textContent = '';
        var msg = document.getElementById('observationMessage');
        if (msg) msg.textContent = '';
      }
    });
  }

  window.MebiObservation = { pairHTML:pairHTML, reset:reset, get:get, editable:editable, complete:complete, setChoice:setChoice, setNote:setNote, save:save,
    setTab:setTab, showLab:showLab, setReflection:setReflection, saveReflection:saveReflection, autoFillForTesting:autoFillForTesting, render:render, deskHTML:deskHTML, reviewModalHTML:reviewModalHTML, wireInputs:wireInputs };
})(window);
