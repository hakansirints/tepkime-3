/* Reasoned predictions: draft decisions, local records and post-experiment evidence. */
(function(window) {
  'use strict';
  var STORAGE_KEY = 'tepkime_arenasi_predictions_v1';
  var items = [
    { key:'gas', label:'Gaz çıkışı', detail:'Yeni gaz oluşumu', icon:'gas', prompt:'Bu maddelerle ilgili hangi bilgin kararını destekliyor?' },
    { key:'precipitate', label:'Çökelti oluşumu', detail:'Yeni bir katı oluşumu', icon:'precipitate', prompt:'Yeni bir katı bekliyor musun? Neden?' },
    { key:'color', label:'Renk değişimi', detail:'Başlangıca göre değişim', icon:'color', prompt:'Başlangıç renklerini ve karışımı nasıl düşünüyorsun?' },
    { key:'tempRise', label:'Sıcaklık artışı', detail:'Son sıcaklık > ilk sıcaklık', icon:'temp', prompt:'Sıcaklığın artacağını neden düşünüyor veya düşünmüyorsun?' },
    { key:'tempFall', label:'Sıcaklık düşmesi', detail:'Son sıcaklık < ilk sıcaklık', icon:'temp', prompt:'Sıcaklığın düşeceğini neden düşünüyor veya düşünmüyorsun?' }
  ];
  var options = [{value:'yes',label:'Evet'},{value:'no',label:'Hayır'},{value:'unsure',label:'Kararsızım'}];
  function esc(value) { return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function label(value) { return value === 'yes' ? 'Evet' : value === 'no' ? 'Hayır' : value === 'unsure' ? 'Kararsızım' : 'Yanıt yok'; }
  function empty() {
    var answers = {};
    items.forEach(function(item) { answers[item.key] = { choice:null, reason:'' }; });
    return answers;
  }
  function reset(state) {
    state.predictionAnswers = empty();
    state.predictionRecord = null;
    state.predictionNonePrevious = null;
    state.predictionMessage = '';
    state.predictionStorageError = false;
    state.prediction = [];
  }
  function validRecord(record) {
    return record && record.version === 1 && typeof record.id === 'string' && Array.isArray(record.pair) && record.pair.length === 2 &&
      record.pair.every(function(id) { return !!window.MebiData.getReagent(id); }) &&
      typeof record.createdAt === 'string' && isFinite(Date.parse(record.createdAt)) &&
      (!record.startedAt || (typeof record.startedAt === 'string' && isFinite(Date.parse(record.startedAt)))) &&
      record.answers && items.every(function(item) {
        var answer = record.answers[item.key];
        return answer && /^(yes|no|unsure)$/.test(answer.choice) && typeof answer.reason === 'string' && answer.reason.trim() && answer.reason.length <= 240;
      });
  }
  function readRecords() {
    var records = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(records)) throw new Error('Invalid prediction records');
    return records.filter(validRecord);
  }
  function writeRecord(state, record) {
    try {
      var records = readRecords();
      var existing = records.findIndex(function(value) { return value.id === record.id; });
      // An experiment's original prediction is never replaced by a later draft.
      if (existing !== -1 && records[existing].startedAt) return;
      if (existing === -1) records.push(copy(record)); else records[existing] = copy(record);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      state.predictionStorageError = false;
    } catch (error) { state.predictionStorageError = true; }
  }
  function started(state) {
    if (state.predictionRecord && state.predictionRecord.startedAt) return true;
    try {
      return !!(state.predictionRecord && readRecords().some(function(record) { return record.id === state.predictionRecord.id && record.startedAt; }));
    } catch (error) { return false; }
  }
  function editable(state) { return state.screen === 'lab' && (state.labStep === 'predict' || state.labStep === 'predictionSaved') && !started(state); }
  function invalidateSave(state) { state.labStep = 'predict'; state.predictionMessage = ''; }
  function complete(state) {
    return items.filter(function(item) {
      var answer = state.predictionAnswers && state.predictionAnswers[item.key];
      return answer && /^(yes|no|unsure)$/.test(answer.choice) && answer.reason.trim();
    }).length;
  }
  function contradiction(state) {
    var answers = state.predictionAnswers;
    return answers && answers.tempRise.choice === 'yes' && answers.tempFall.choice === 'yes';
  }
  function allNo(state) { return items.every(function(item) { return state.predictionAnswers[item.key].choice === 'no'; }); }
  function setChoice(state, value) {
    if (!editable(state)) return false;
    var parts = String(value).split(':');
    if (!items.some(function(item) { return item.key === parts[0]; }) || !/^(yes|no|unsure)$/.test(parts[1])) return false;
    if (state.predictionAnswers[parts[0]].choice !== parts[1]) invalidateSave(state);
    state.predictionAnswers[parts[0]].choice = parts[1];
    if (parts[0] === 'tempRise' && parts[1] === 'yes') {
      if (state.predictionAnswers.tempFall && state.predictionAnswers.tempFall.choice === 'yes') {
        state.predictionAnswers.tempFall.choice = null;
      }
    } else if (parts[0] === 'tempFall' && parts[1] === 'yes') {
      if (state.predictionAnswers.tempRise && state.predictionAnswers.tempRise.choice === 'yes') {
        state.predictionAnswers.tempRise.choice = null;
      }
    }
    if (state.predictionMessage && state.predictionMessage.indexOf('sıcaklık') !== -1) {
      state.predictionMessage = '';
    }
    return true;
  }
  function setReason(state, key, value) {
    if (!editable(state) || !items.some(function(item) { return item.key === key; })) return false;
    value = String(value).slice(0,240);
    if (state.predictionAnswers[key].reason !== value) invalidateSave(state);
    state.predictionAnswers[key].reason = value;
    return true;
  }
  // Temporary shortcut for testing the experiment flow; never saves or starts it.
  function autoFillForTesting(state) {
    if (!editable(state) || !state.activeReaction) return false;
    var reaction = state.activeReaction, actual = outcomes(reaction);
    var pair = [state.selectedSlot1,state.selectedSlot2].map(function(id) { return window.MebiData.getReagent(id).f; }).join(' ve ');
    var gas = (reaction.products || '').match(/(?:CO₂|O₂|Cl₂|H₂|CO2|O2|Cl2|H2)(?=\(gaz)/);
    var reasons = {
      gas:actual.gas ? pair + ' karışımında ' + (gas ? gas[0] + ' gazı' : 'gaz ürünü') + ' oluştuğu için kabarcık çıkışı bekliyorum.' : pair + ' karışımında gaz ürünü oluşması öngörülmediği için yeni gaz kabarcıkları beklemiyorum.',
      precipitate:actual.precipitate ? 'Bu karışımda suda çözünmeyen yeni bir katı oluşması öngörüldüğü için çökelti bekliyorum. ' + reaction.mainProductSymbol + ' katı ürünler arasında yer alır.' : 'Bu karışımda yeni, çözünmeyen bir katı ürün oluşması öngörülmüyor. Başlangıçta bulunan katı madde tek başına çökelti sayılmaz.',
      color:actual.color ? 'Başlangıçtaki maddelerden farklı renkte ürünler oluşacağı için renk değişimi bekliyorum. Beklenen ürünler: ' + reaction.products : 'Bu karışım için başlangıçtaki madde renklerinden farklı, yeni bir renk oluşması öngörülmediği için belirgin renk değişimi beklemiyorum.'
    };
    var initial = Number(reaction.tempInit), final = Number(reaction.tempFinal);
    var temperature = 'Bu karışımın eğitim modelinde sıcaklık ' + (final === initial ? initial.toLocaleString('tr-TR') + ' °C’de değişmeden kalır.' : initial.toLocaleString('tr-TR') + ' °C’den ' + final.toLocaleString('tr-TR') + ' °C’ye ' + (final > initial ? 'yükselir.' : 'düşer.'));
    reasons.tempRise = temperature + (actual.tempRise ? ' Son değer daha yüksek olduğu için sıcaklık artışı bekliyorum.' : ' Son değer daha yüksek olmadığı için sıcaklık artışı beklemiyorum.');
    reasons.tempFall = temperature + (actual.tempFall ? ' Son değer daha düşük olduğu için sıcaklık düşmesi bekliyorum.' : ' Son değer daha düşük olmadığı için sıcaklık düşmesi beklemiyorum.');
    invalidateSave(state);
    items.forEach(function(item) {
      state.predictionAnswers[item.key] = { choice:actual[item.key] ? 'yes' : 'no', reason:reasons[item.key] };
    });
    state.predictionNonePrevious = null;
    state.predictionMessage = '';
    return true;
  }
  function toggleNone(state) {
    if (!editable(state)) return false;
    invalidateSave(state);
    if (allNo(state)) {
      items.forEach(function(item) { state.predictionAnswers[item.key].choice = state.predictionNonePrevious ? state.predictionNonePrevious[item.key] : null; });
      state.predictionNonePrevious = null;
    } else {
      state.predictionNonePrevious = {};
      items.forEach(function(item) {
        state.predictionNonePrevious[item.key] = state.predictionAnswers[item.key].choice;
        state.predictionAnswers[item.key].choice = 'no';
      });
    }
    state.predictionMessage = '';
    return true;
  }
  function legacyChoices(answers) {
    var selected = [];
    items.forEach(function(item) { if (answers[item.key].choice === 'yes') { var key = /^temp/.test(item.key) ? 'temp' : item.key; if (selected.indexOf(key) === -1) selected.push(key); } });
    if (items.every(function(item) { return answers[item.key].choice === 'no'; })) selected.push('none');
    return selected;
  }
  function save(state) {
    if (!editable(state) || !state.activeReaction) return false;
    if (contradiction(state)) { state.predictionMessage = 'Son sıcaklık, ilk sıcaklıktan hem yüksek hem düşük olamaz. Sıcaklık kararlarını gözden geçir.'; return false; }
    if (complete(state) !== 5) { state.predictionMessage = 'Her belirti için bir karar seç ve kısa gerekçeni yaz. Kararsızım geçerli bir yanıttır.'; return false; }
    var answers = copy(state.predictionAnswers);
    items.forEach(function(item) { answers[item.key].reason = answers[item.key].reason.trim(); });
    var now = new Date().toISOString();
    state.predictionRecord = { version:1, id:state.predictionRecord ? state.predictionRecord.id : (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2)),
      pair:[state.selectedSlot1,state.selectedSlot2], answers:answers, createdAt:state.predictionRecord ? state.predictionRecord.createdAt : now, updatedAt:now, startedAt:null };
    state.prediction = legacyChoices(answers);
    writeRecord(state, state.predictionRecord);
    state.labStep = 'predictionSaved';
    state.predictionMessage = '';
    return true;
  }
  function edit(state) {
    if (state.screen !== 'lab' || (state.labStep !== 'predictionSaved' && state.labStep !== 'ready') || started(state)) return false;
    state.labStep = 'predict';
    return true;
  }
  function begin(state) {
    if (state.screen !== 'lab' || state.labStep !== 'predictionSaved' || !validRecord(state.predictionRecord) || started(state)) return false;
    state.predictionRecord = copy(state.predictionRecord);
    state.predictionRecord.startedAt = new Date().toISOString();
    writeRecord(state, state.predictionRecord);
    state.labStep = 'ready';
    return true;
  }
  function outcomes(reaction) {
    return { gas:reaction.obs.indexOf('gas') !== -1, precipitate:reaction.obs.indexOf('precipitate') !== -1, color:reaction.obs.indexOf('color') !== -1,
      tempRise:Number(reaction.tempFinal) > Number(reaction.tempInit), tempFall:Number(reaction.tempFinal) < Number(reaction.tempInit) };
  }
  function matches(state) {
    var answers = state.predictionRecord && state.predictionRecord.answers;
    var actual = outcomes(state.activeReaction);
    return !!answers && items.every(function(item) { return answers[item.key].choice === (actual[item.key] ? 'yes' : 'no'); });
  }
  function materialHTML(id) {
    var reagent = window.MebiData.getReagent(id);
    var kind = reagent.solid ? 'powder' : reagent.id === 'Cu(NO3)2' ? 'blue' : 'clear';
    return '<div class="prediction-material"><span class="prediction-material-image is-' + kind + '"><img src="image/reagents/' + kind + '.webp?v=910bef9ae690" width="640" height="440" alt=""></span><span><strong>' + esc(reagent.f) + '</strong><small>' + esc(reagent.name) + ' · ' + (reagent.solid ? 'katı toz' : 'suda') + '</small></span></div>';
  }
  function answersHTML(answers) {
    return items.map(function(item) { return '<div class="prediction-summary-row"><strong>' + item.label + '</strong><span class="prediction-answer">' + label(answers[item.key].choice) + '</span><p>' + esc(answers[item.key].reason) + '</p></div>'; }).join('');
  }
  function historyHTML() {
    var records;
    try { records = readRecords(); } catch (error) { return ''; }
    if (!records.length) return '';
    return '<details class="prediction-history"><summary>Bu tarayıcıdaki tahmin kayıtları (' + records.length + ')</summary>' + records.slice().reverse().map(function(record) {
      return '<details class="prediction-history-record"><summary>' + record.pair.map(function(id) { return esc(window.MebiData.getReagent(id).f); }).join(' + ') + ' · ' + esc(new Date(record.createdAt).toLocaleString('tr-TR')) + ' · ' + (record.startedAt ? 'Deney öncesi kayıt' : 'Deney henüz başlamadı') + '</summary>' + answersHTML(record.answers) + '</details>';
    }).join('') + '</details>';
  }
  function feedbackHTML(state) {
    var actual = outcomes(state.activeReaction);
    var answers = state.predictionRecord && state.predictionRecord.answers;
    if (!answers) return '';
    return '<div class="prediction-comparison"><div class="prediction-comparison-head"><span>Belirti</span><span>Tahminim</span><span>Gözlem</span></div>' + items.map(function(item) {
      var choice = answers[item.key].choice;
      var feedback = choice === 'unsure' ? 'Kararsızdım' : (choice === (actual[item.key] ? 'yes' : 'no') ? 'Uyumlu' : 'Farklı');
      return '<div class="prediction-comparison-row"><strong>' + item.label + '</strong><span>' + label(choice) + '</span><span>' + (actual[item.key] ? 'Var' : 'Yok') + '</span><small class="' + (feedback === 'Uyumlu' ? 'is-match' : feedback === 'Farklı' ? 'is-different' : '') + '">' + feedback + '</small></div>';
    }).join('') + '</div><p class="prediction-temperature">Termometre: ' + Number(state.activeReaction.tempInit).toFixed(1) + ' → ' + Number(state.activeReaction.tempFinal).toFixed(1) + ' °C</p><details class="prediction-reasons"><summary>Kaydettiğim gerekçeler</summary>' + answersHTML(answers) + '</details><p class="prediction-reflection">Düşünceni hangi gözlem değiştirdi? Açıkla adımında değerlendir.</p>';
  }
  function decisionListHTML(state) {
    var answers = state.predictionRecord.answers;
    return items.map(function(item) { return '<div class="dock-obs-chip is-locked"><span class="dock-chip-left"><span class="dock-chip-icon">' + window.MebiSVG.icon(item.icon) + '</span><span class="dock-chip-label">' + item.label + '</span></span><span class="dock-chip-status status-neutral">' + label(answers[item.key].choice) + '</span></div>'; }).join('');
  }
  function render(state) {
    var saved = state.labStep === 'predictionSaved';
    var content = '<table class="learning-matrix prediction-matrix"><caption class="sr-only">Her belirti için bir karar seç ve kısa gerekçeni yaz.</caption><colgroup><col class="learning-sign-col"><col class="learning-choice-col" span="3"><col></colgroup><thead><tr><th scope="col">Olası Belirti</th>' + options.map(function(option) { return '<th scope="col" class="learning-choice-heading">' + option.label + '</th>'; }).join('') + '<th scope="col">Kısa Gerekçem <small>· en fazla 240 karakter</small></th></tr></thead><tbody>' + items.map(function(item) {
        var answer = state.predictionAnswers[item.key];
        return '<tr class="prediction-row"><th scope="row"><div class="prediction-label"><span class="prediction-icon">' + window.MebiSVG.icon(item.icon) + '</span><div><strong>' + item.label + '</strong><small>' + esc(item.detail) + '</small></div></div></th>' + options.map(function(option) {
          return '<td class="prediction-choices"><button type="button" class="learning-mark" data-prediction-control="' + item.key + '-' + option.value + '" data-action="setPredictionChoice" data-arg="' + item.key + ':' + option.value + '" aria-label="' + item.label + ': ' + option.label + '" title="' + option.label + '" aria-pressed="' + (answer.choice === option.value) + '"><span class="learning-tick" aria-hidden="true">' + window.MebiSVG.icon('check') + '</span></button></td>';
        }).join('') + '<td><label class="prediction-reason-label"><span class="sr-only">' + item.label + ' için kısa gerekçem</span><textarea class="prediction-reason" data-prediction-control="reason-' + item.key + '" data-reason-key="' + item.key + '" rows="2" maxlength="240" placeholder="' + item.prompt + '">' + esc(answer.reason) + '</textarea></label></td></tr>';
      }).join('') + '</tbody></table><div class="prediction-none"><label><input type="checkbox" data-prediction-control="none" data-action="togglePredictionNone"' + (allNo(state) ? ' checked' : '') + '>Hiçbiri: Belirgin bir değişim beklemiyorum</label></div>';
    return '<section class="prediction-card" aria-labelledby="predictionTitle"><header class="learning-card-header"><div class="learning-header-copy"><div class="prediction-heading arena-stage-heading"><span class="prediction-eyebrow">' + window.MebiSVG.icon('helpCircle') + ' 2. Tahmin</span><h1 id="predictionTitle">Tepkime Belirtilerini Tahmin Et</h1></div><p class="prediction-intro">Her belirti için kararını seç, düşünceni bir cümleyle açıkla.</p></div>' +
      '<div class="prediction-pair" aria-label="Seçilen maddeler">' + materialHTML(state.selectedSlot1) + '<span aria-hidden="true">+</span>' + materialHTML(state.selectedSlot2) + '</div></header>' +
      '<div class="prediction-content">' + content + '</div><p id="predictionMessage" class="prediction-message" role="alert">' + esc(state.predictionMessage) + '</p>' +
      '<footer class="prediction-footer"><div class="prediction-actions prediction-actions-full">' +
      '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm prediction-autofill" data-action="autoFillPredictionForTesting">Test İçin Otomatik Doldur</button>' +
      '<div class="prediction-save-group">' +
      '<span id="predictionSavedStatus" class="prediction-saved-status" role="status" aria-live="polite">' + (saved ? window.MebiSVG.icon('check') + ' Tahmininiz kaydedildi' : '') + '</span>' +
      '<button type="button" id="beginExperimentButton" class="mebi-btn mebi-btn-primary mebi-btn-sm" data-action="beginExperiment" title="' + (complete(state) === 5 || saved ? 'Deney aşamasına geç' : 'Önce 5 belirti kararını tamamla') + '"' + (complete(state) !== 5 && !saved ? ' disabled' : '') + '>' + window.MebiSVG.icon('save') + ' Kaydet ve Deney Aşamasına Geç</button></div></div></footer></section>';
  }
  function reviewHTML(state) {
    var record = state.predictionRecord;
    return '<section class="prediction-card prediction-review" aria-labelledby="predictionReviewTitle"><header class="learning-card-header"><div class="learning-header-copy"><div class="prediction-heading arena-stage-heading"><span class="prediction-eyebrow">2. Tahmin</span><h1 id="predictionReviewTitle">Kaydettiğim İlk Tahmin</h1></div><p class="prediction-intro">Deneyden önceki tahminin korunur. Yeni değerlendirmeni gözlem kartındaki karşılaştırma alanına yazabilirsin.</p></div>' +
      '<div class="prediction-pair">' + materialHTML(state.selectedSlot1) + '<span aria-hidden="true">+</span>' + materialHTML(state.selectedSlot2) + '</div></header><div class="prediction-content">' + (record ? answersHTML(record.answers) : '<p>Henüz tahmin kaydı yok.</p>') + '</div><footer class="prediction-footer"><button type="button" class="mebi-btn mebi-btn-primary mebi-btn-sm" data-action="closeStageReview">Kaldığım Aşamaya Dön</button></footer></section>';
  }
  function updateStatus(state) {
    var count = document.getElementById('predictionCompletion');
    var button = document.getElementById('savePredictionButton');
    var message = document.getElementById('predictionMessage');
    var beginButton = document.getElementById('beginExperimentButton');
    var savedStatus = document.getElementById('predictionSavedStatus');
    var saved = state.labStep === 'predictionSaved';
    var isComplete = complete(state) === 5;
    if (count) count.textContent = complete(state) + ' / 5 karar ve gerekçe tamamlandı';
    if (button) { button.disabled = !isComplete || contradiction(state) || saved; button.title = saved ? 'Tahmininiz kaydedildi. Bir yanıtı değiştirirsen yeniden kaydedebilirsin.' : 'Beş kararını ve gerekçeni tamamlayıp kaydet'; }
    if (beginButton) { beginButton.disabled = !isComplete && !saved; beginButton.title = (isComplete || saved) ? 'Deney aşamasına geç' : 'Önce 5 belirti kararını tamamla'; }
    if (savedStatus) savedStatus.innerHTML = saved ? window.MebiSVG.icon('check') + ' Tahmininiz kaydedildi' : '';
    if (message) message.textContent = contradiction(state) ? 'Son sıcaklık, ilk sıcaklıktan hem yüksek hem düşük olamaz. Sıcaklık kararlarını gözden geçir.' : state.predictionMessage;
  }
  function wireInputs(state) {
    document.querySelectorAll('.prediction-reason').forEach(function(input) {
      input.addEventListener('input', function() { if (setReason(state,input.dataset.reasonKey,input.value)) updateStatus(state); });
    });
    if (editable(state)) updateStatus(state);
  }
  window.MebiPrediction = { items:items, reset:reset, setChoice:setChoice, setReason:setReason, toggleNone:toggleNone, complete:complete, save:save, edit:edit, begin:begin,
    started:started, outcomes:outcomes, matches:matches, render:render, reviewHTML:reviewHTML, wireInputs:wireInputs, feedbackHTML:feedbackHTML, decisionListHTML:decisionListHTML, autoFillForTesting:autoFillForTesting };
})(window);
