/* Shared transfer timeline and explicit educational starting quantities. */
(function(window) {
  'use strict';
  var serial = 0;
  // Solid transfer starts at this shared tilt phase.
  var SOLID_FLOW_START = 0.58;
  // Educational sample sizes, not a universal practical-laboratory recipe.
  // Each solid starts at 1 g so its bed remains visible in the laboratory.
  var DEFAULTS = Object.freeze({ solutionMl:50, molarity:0.10,
    solidGrams:Object.freeze({ NaHCO3:1, CaCO3:1, Na2CO3:1 }) });
  var SOLID_MOLAR_MASS = Object.freeze({ NaHCO3:84.01, CaCO3:100.09, Na2CO3:105.99 });
  function initialAmount(id) {
    var reagent = typeof id === 'string' ? window.MebiData.getReagent(id) : id;
    if (!reagent) return { solutionMl:0, solidGrams:0, moles:0 };
    var grams = reagent.solid ? DEFAULTS.solidGrams[reagent.id] : 0;
    if (reagent.solid && !(grams > 0)) throw new Error('Missing solid sample size: ' + reagent.id);
    return { solutionMl:reagent.solid ? 0 : DEFAULTS.solutionMl, solidGrams:grams,
      moles:reagent.solid ? grams / SOLID_MOLAR_MASS[reagent.id] : DEFAULTS.solutionMl / 1000 * DEFAULTS.molarity };
  }
  // Retire the old preference so previously hidden reminders also return.
  try { window.localStorage.removeItem('mebi_hide_safety_warning'); } catch (e) {}
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function ease(p) { return 0.5 - Math.cos(clamp(p, 0, 1) * Math.PI) / 2; }
  function reset(state) {
    state.experiment = { run:++serial, transfer:0, path:0, target:0, mode:'idle', elapsed:0,
      flow:0, safetyAccepted:false, safetyOpen:false,
      safetyChecks:[false, false, false, false],
      pending:null, completionNotified:false };
    return state.experiment;
  }
  function get(state) { return state.experiment || reset(state, false); }
  function allSafetyChecked(state) {
    var e = get(state), c = e.safetyChecks;
    return Array.isArray(c) && c.length === 4 && !!(c[0] && c[1] && c[2] && c[3]);
  }
  function toggleSafetyItem(state, index) {
    var e = get(state), idx = Number(index);
    if (!e.safetyOpen || isNaN(idx) || idx < 0 || idx > 3) return false;
    if (!Array.isArray(e.safetyChecks) || e.safetyChecks.length !== 4) e.safetyChecks = [false, false, false, false];
    e.safetyChecks[idx] = !e.safetyChecks[idx];
    return true;
  }
  function toggleAllSafetyItems(state) {
    var e = get(state);
    if (!e.safetyOpen) return false;
    var next = !allSafetyChecked(state);
    e.safetyChecks = [next, next, next, next];
    return true;
  }
  // These are the original laboratory's approach, tilt and return keyframes.
  function sample(path, solid) {
    path = clamp(Number(path) || 0, 0, 1);
    var lift = ease(path / 0.22), returning = ease((path - 0.80) / 0.20);
    var tiltFraction = clamp((path - 0.22) / 0.58, 0, 1);
    var start = solid ? SOLID_FLOW_START : 0.22, endAngle = solid ? 1.95 : 1.32;
    var fraction = clamp((path - start) / (0.80 - start), 0, 1);
    return { path:path, lift:lift, returning:returning, fraction:fraction,
      angle:path < 0.22 ? lift * 0.80 : path < 0.80 ? 0.80 + (endAngle - 0.80) * ease(tiltFraction) : endAngle * (1 - returning) };
  }
  function allowed(state) { return state.screen === 'lab' && state.labStep === 'ready'; }
  function request(state, kind) {
    if (!allowed(state)) return false;
    var e = get(state);
    if (e.mode !== 'idle' || e.transfer >= 1) return false;
    if (e.safetyAccepted) return true;
    e.safetyOpen = true; e.pending = kind;
    if (!Array.isArray(e.safetyChecks) || e.safetyChecks.length !== 4) e.safetyChecks = [false, false, false, false];
    return false;
  }
  function accept(state) {
    var e = get(state);
    if (!allSafetyChecked(state)) return null;
    var pending = e.pending;
    e.safetyAccepted = true; e.safetyOpen = false; e.pending = null;
    return pending;
  }
  function startManual(state) {
    var e = get(state);
    if (!allowed(state) || !e.safetyAccepted || e.safetyOpen || e.mode !== 'idle' || e.transfer >= 1) return false;
    e.mode = 'manual'; e.path = e.target = 0; e.flow = 0;
    return true;
  }
  function scrub(state, path) {
    var e = get(state);
    if (e.mode === 'manual') e.target = clamp(Number(path) || 0, 0, 0.80);
  }
  function release(state) {
    var e = get(state);
    if (e.mode !== 'manual') return;
    e.mode = 'returning'; e.returnFrom = e.path; e.elapsed = 0; e.flow = 0;
  }
  function startAuto(state) {
    var e = get(state);
    if (!allowed(state) || !e.safetyAccepted || e.safetyOpen || e.mode !== 'idle' || e.transfer >= 1) return false;
    e.mode = 'auto'; e.elapsed = 0; e.path = 0; e.autoFrom = e.transfer; e.flow = 0;
    return true;
  }
  function park(state) {
    var e = get(state);
    e.mode = 'idle'; e.path = e.target = 0; e.flow = 0;
  }
  function advance(state, dt, reduced) {
    var e = get(state);
    dt = clamp(Number(dt) || 0, 0, 0.10);
    var reagent = window.MebiData.getReagent(state.selectedSlot2), solid = !!(reagent && reagent.solid);
    var flowStart = solid ? SOLID_FLOW_START : 0.22;
    e.flow = 0;
    if (e.mode === 'auto') {
      var duration = reduced ? 0.16 : 5;
      e.elapsed += dt; e.path = clamp(e.elapsed / duration, 0, 1);
      var amount = e.autoFrom + (1 - e.autoFrom) * sample(e.path, solid).fraction;
      e.flow = dt > 0 ? Math.max(0, amount - e.transfer) / dt : 0;
      e.transfer = Math.max(e.transfer, amount);
      if (e.path >= 1) { e.transfer = 1; e.mode = 'idle'; e.path = 0; e.flow = 0; }
    } else if (e.mode === 'manual') {
      e.path += (e.target - e.path) * (reduced ? 1 : 1 - Math.exp(-dt * 15));
      if (Math.abs(e.path - e.target) < 0.0001) e.path = e.target;
      if (e.path > flowStart && e.transfer < 1) {
        var tilt = clamp((e.path - flowStart) / (0.80 - flowStart), 0, 1);
        e.flow = 0.04 + 0.46 * tilt * tilt;
        e.transfer = Math.min(1, e.transfer + e.flow * dt);
        if (e.transfer >= 0.9999) e.transfer = 1;
      }
    } else if (e.mode === 'returning') {
      e.elapsed += dt;
      var t = clamp(e.elapsed / (reduced ? 0.12 : 0.65), 0, 1);
      e.path = e.returnFrom * (1 - ease(t));
      if (t >= 1) { e.path = 0; e.mode = 'idle'; }
    }
    if (e.transfer >= 1 && e.mode === 'idle' && !e.completionNotified) {
      e.completionNotified = true; return true;
    }
    return false;
  }
  function quantities(state) {
    var a = window.MebiData.getReagent(state.selectedSlot1), b = window.MebiData.getReagent(state.selectedSlot2);
    var amounts = [initialAmount(a),initialAmount(b)], f = get(state).transfer, v1 = amounts[0].solutionMl;
    var v2 = amounts[1].solutionMl, volume = v1 + v2 * f, m1 = amounts[0].solidGrams, m2 = amounts[1].solidGrams;
    return { initialMl:v1, initialGrams:m1, volume:volume, remainingMl:v2 * (1 - f), remainingGrams:m2 * (1 - f),
      inputGrams:m1 + m2 * f,
      concentration1:volume && v1 ? DEFAULTS.molarity * v1 / volume : null,
      concentration2:volume && v2 ? DEFAULTS.molarity * v2 * f / volume : null,
      sourceConcentration:v2 && f < 1 ? DEFAULTS.molarity : null,
      transferredMl:v2 * f, transferredGrams:m2 * f };
  }
  // Replay owns a presentation clock, never the student's recorded experiment.
  function replayState(state, delta) {
    var replay=state.explanationReview;
    if (!replay) return state;
    replay.elapsed=clamp((replay.elapsed||0)+Math.max(0,Number(delta)||0),0,9);
    var time=replay.elapsed,path=clamp(time/5,0,1),solid=!!window.MebiData.getReagent(state.selectedSlot2).solid;
    var pose=sample(path,solid),contact=(solid?SOLID_FLOW_START:.22)*5,progress=clamp((time-contact)/(9-contact),0,1);
    var initial=Number(state.activeReaction.tempInit),final=Number(state.observation.record.temperature.final);
    return Object.assign({},state,{labStep:time<=contact?'predict':time<9?'reacting':'observed',
      currentTemp:initial+(final-initial)*ease(progress),explanationReplayProgress:progress,
      experiment:Object.assign({},get(state),{mode:time>0&&time<5?'explanation-replay':'idle',path:time<5?path:0,
        transfer:pose.fraction,flow:time>0&&time<4&&pose.fraction>0?1:0,completionNotified:true})});
  }
  function esc(value) { return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function number(value, digits) { return Number(value).toLocaleString('tr-TR', { minimumFractionDigits:digits || 0, maximumFractionDigits:digits == null ? 1 : digits }); }
  function concentration(value) { return value == null ? '—' : number(value, 3) + ' mol/L'; }
  function temperature(state) {
    var initial = state.activeReaction ? Number(state.activeReaction.tempInit) : 22;
    var current = Number(state.currentTemp);
    if (!isFinite(initial)) initial = 22;
    if (!isFinite(current)) current = initial;
    var delta = Math.round((current - initial) * 10) / 10;
    var minimum = 0, maximum = 100;
    return { initial:initial, current:current, delta:delta, minimum:minimum, maximum:maximum,
      zeroPercent:(0 - minimum) / (maximum - minimum) * 100,
      startPercent:clamp(initial,minimum,maximum), currentPercent:clamp(current,minimum,maximum),
      trend:delta > 0 ? '↑ Artış' : delta < 0 ? '↓ Düşüş' : 'Sabit',
      change:(delta > 0 ? '+' : '') + number(delta,1) + ' °C' };
  }
  function field(key, label, value) { return '<div class="experiment-reading"><span>' + label + '</span><strong data-experiment-value="' + key + '">' + value + '</strong></div>'; }
  function meterHTML(key, label, value, maximum, unit) {
    var percent = clamp(value / maximum, 0, 1) * 100;
    return '<div class="experiment-amount-meter" role="meter" aria-label="' + esc(label) + '" aria-valuemin="0" aria-valuemax="' + maximum + '" aria-valuenow="' + value + '" aria-valuetext="' + number(value,unit === 'g' ? 3 : 1) + ' ' + unit + '" data-experiment-meter="' + key + '" data-meter-unit="' + unit + '"><span class="experiment-amount-fill" style="width:' + percent + '%"></span></div><small class="experiment-meter-scale">0–' + number(maximum,unit === 'g' ? 3 : 0) + ' ' + unit + '</small>';
  }
  function cardHTML(state) {
    var a = window.MebiData.getReagent(state.selectedSlot1), b = window.MebiData.getReagent(state.selectedSlot2), q = quantities(state), t = temperature(state);
    var m1 = initialAmount(a).solidGrams, m2 = initialAmount(b).solidGrams, massScale = m1 + m2;
    var initialKey = a.solid ? 'initialGrams' : 'initialMl', sourceKey = b.solid ? 'remainingGrams' : 'remainingMl';
    var initialUnit = a.solid ? 'g' : 'mL', sourceUnit = b.solid ? 'g' : 'mL';
    var finished = state.labStep === 'observed';
    var mixtureValue = !a.solid || !b.solid ? 'volume' : 'inputGrams';
    var mixtureUnit = mixtureValue === 'volume' ? 'mL' : 'g';
    var nominal = (!a.solid || !b.solid) ? '<div class="experiment-concentrations" aria-label="Giriş Esaslı Nominal Derişim"><span>' + (!a.solid && !b.solid ? 'C₁ / C₂' : !a.solid ? 'C₁' : 'C₂') + ' · mol/L</span><strong>' + (!a.solid ? '<span data-experiment-value="concentration1">' + (q.concentration1 == null ? '—' : number(q.concentration1,3)) + '</span>' : '') + (!a.solid && !b.solid ? ' / ' : '') + (!b.solid ? '<span data-experiment-value="concentration2">' + (q.concentration2 == null ? '—' : number(q.concentration2,3)) + '</span>' : '') + '</strong></div>' : '';
    return '<section class="experiment-live-data" data-layout="vertical" aria-labelledby="experimentLiveTitle"><header class="experiment-card-heading">' + window.MebiSVG.icon('beakerIc') + '<strong id="experimentLiveTitle">Deney Masası Düzeneği</strong></header>' +
      '<section class="experiment-card-vessel"><div class="experiment-vessel-title"><span>1. Beher</span><strong class="experiment-formula">' + esc(a.f) + '</strong></div>' + field(initialKey,'Başlangıç',number(q[initialKey],a.solid ? 3 : undefined) + ' ' + initialUnit) + meterHTML(initialKey,'Birinci Maddenin Başlangıç Miktarı',q[initialKey],a.solid ? m1 : 100,initialUnit) + '</section>' +
      '<section class="experiment-card-vessel"><div class="experiment-vessel-title"><span>2. Beher</span><strong class="experiment-formula">' + esc(b.f) + '</strong></div>' + field(sourceKey,'Kalan',number(q[sourceKey],b.solid ? 3 : undefined) + ' ' + sourceUnit) + meterHTML(sourceKey,'İkinci Beherde Kalan Miktar',q[sourceKey],b.solid ? m2 : 100,sourceUnit) + '</section>' +
      '<section class="experiment-card-vessel experiment-card-mixture"><div class="experiment-vessel-title"><span>' + window.MebiSVG.icon('flaskOutline') + 'Karışım</span><strong data-experiment-value="' + mixtureValue + '">' + number(q[mixtureValue],mixtureValue === 'inputGrams' ? 3 : undefined) + ' ' + mixtureUnit + '</strong></div><small class="experiment-mixture-caption">' + (mixtureValue === 'volume' ? 'Çözelti Hacmi · 1. Beherde' : 'Toplam Katı · Sıvı Eklenmedi') + '</small>' + meterHTML(mixtureValue,'Karışım Miktarı',q[mixtureValue],mixtureValue === 'volume' ? 100 : massScale,mixtureUnit) +
      (mixtureValue === 'volume' && massScale ? field('inputGrams','Eklenen Katı',number(q.inputGrams,3) + ' g') : '') + nominal + '</section>' +
      '<section class="experiment-temperature" aria-label="Sıcaklık Verileri"><div class="experiment-temperature-heading"><span>' + window.MebiSVG.icon('temp') + 'Sıcaklık</span><small data-experiment-temperature-trend>' + t.trend + '</small></div><div class="experiment-temperature-values"><span><small>İlk</small><strong>' + number(t.initial,1) + ' °C</strong></span><span class="is-current"><small>Anlık</small><strong data-experiment-value="temperature">' + number(t.current,1) + ' °C</strong></span><span><small>Son</small><strong data-experiment-temperature-end>' + (finished ? number(t.current,1) + ' °C' : '—') + '</strong></span></div>' +
      '<div class="experiment-thermometer" role="meter" aria-label="Karışımın Anlık Sıcaklığı" aria-valuemin="' + t.minimum + '" aria-valuemax="' + t.maximum + '" aria-valuenow="' + t.current + '" aria-valuetext="Başlangıç ' + number(t.initial,1) + ' °C; anlık ' + number(t.current,1) + ' °C" data-experiment-meter="temperature" data-meter-unit="°C" style="--temperature-start:' + t.startPercent + '%;--temperature-current:' + t.currentPercent + '%"><span class="experiment-thermometer-bulb" aria-hidden="true"></span><div class="experiment-thermometer-track"><span class="experiment-amount-fill" style="left:' + Math.min(t.zeroPercent,t.currentPercent) + '%;width:' + Math.abs(t.currentPercent-t.zeroPercent) + '%"></span><span class="experiment-start-mark" aria-hidden="true"></span></div></div><div class="experiment-thermometer-range" aria-hidden="true"><span>0 °C</span><span>100 °C</span></div><div class="experiment-temperature-change"><span>Değişim</span><strong data-experiment-temperature-delta>ΔT: ' + t.change + '</strong></div></section></section>';
  }

  function actionsHTML() {
    return '<div class="experiment-live-actions"><button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="restartExperiment">' + window.MebiSVG.icon('reset') + '<span>Deneyi Yeniden Başlat</span></button><button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="changeReactants">' + window.MebiSVG.icon('undo') + '<span>Tepkenleri Değiştir</span></button></div>';
  }
  function safetyIconSVG(kind) {
    if (kind === 'headerWarn') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13.2"/><circle cx="12" cy="16.8" r="0.6" fill="currentColor"/></svg>';
    }
    if (kind === 'ppeWarn') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M7.5 11h2.2a1.6 1.6 0 0 1 4.6 0h2.2"/><circle cx="9.3" cy="11.5" r="1.7"/><circle cx="14.7" cy="11.5" r="1.7"/></svg>';
    }
    if (kind === 'chemicalWarn') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M10.4 9.5h3.2"/><path d="M11.1 9.5v2.2l-2 3.3a.75.75 0 0 0 .64 1.15h4.52a.75.75 0 0 0 .64-1.15l-2-3.3V9.5"/></svg>';
    }
    if (kind === 'envWarn') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9c-1.35 1.75-2.1 2.8-2.1 3.85a2.1 2.1 0 0 0 4.2 0c0-1.05-.75-2.1-2.1-3.85z"/><line x1="8.6" y1="17.2" x2="15.4" y2="17.2"/></svg>';
    }
    if (kind === 'emergencyWarn') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="7.8" x2="12" y2="12.6"/><circle cx="12" cy="16.2" r="0.7" fill="currentColor"/></svg>';
    }
    if (kind === 'miniWarn') {
      return '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M7.13 2.3a1 1 0 0 1 1.74 0l5.4 9.5A1 1 0 0 1 13.4 13.3H2.6a1 1 0 0 1-.87-1.5l5.4-9.5zM8 5.5a.65.65 0 0 0-.65.65v2.7a.65.65 0 0 0 1.3 0v-2.7A.65.65 0 0 0 8 5.5zm0 5.6a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z"/></svg>';
    }
    return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3.2 8.4 6.5 11.7 12.8 4.6"/></svg>';
  }
  function safetyHTML(state) {
    var e = get(state);
    if (!e.safetyOpen) return '';
    var checks = Array.isArray(e.safetyChecks) && e.safetyChecks.length === 4 ? e.safetyChecks : [false, false, false, false];
    var checkedCount = checks.filter(Boolean).length;
    var allDone = checkedCount === 4;
    var rows = [
      ['chemicalWarn', 'Tehlikeyi tanı', 'Gerçek laboratuvarda kimyasal etiketlerini ve tehlike işaretlerini öğretmeninle incele. Maddelere doğrudan dokunma; onları tatma veya koklama.'],
      ['envWarn', 'Riski değerlendir', 'Yalnızca öğretmenin onayladığı madde ve miktarlarla çalış. Dökülme, sıçrama ve atıklarla ilgili önlemleri başlamadan öğren.'],
      ['ppeWarn', 'Önlemini al', 'Gerçek deneyde uygun gözlük, önlük ve gereken eldiveni öğretmeninin yönlendirmesiyle kullan. Çalışma alanını düzenli tut.'],
      ['emergencyWarn', 'Beklenmedik duruma hazırlan', 'Dökülme veya beklenmedik bir durumda işlemi durdur, öğretmenine haber ver. Kendi başına müdahale etme.']
    ];
    var acceptTitle = allDone
      ? 'Tüm güvenlik kuralları onaylandı, deneye başlayabilirsiniz.'
      : 'Devam etmek için lütfen 4 güvenlik uyarısının tamamını işaretleyerek onaylayın (' + checkedCount + '/4).';
    return '<div class="experiment-safety-backdrop">' +
      '<section class="experiment-safety-card" role="dialog" aria-modal="true" aria-labelledby="experimentSafetyTitle" aria-describedby="experimentSafetyNote">' +
        '<header class="experiment-safety-header">' +
          '<div class="experiment-safety-header-main">' +
            '<div class="experiment-safety-header-icon" aria-hidden="true">' + safetyIconSVG('headerWarn') + '</div>' +
            '<div class="experiment-safety-title-wrap">' +
              '<div class="experiment-safety-badges">' +
                '<span class="mebi-badge-sunken mebi-badge-warning">' + safetyIconSVG('miniWarn') + '<span>LABORATUVAR GÜVENLİK PROTOKOLÜ</span></span>' +
                '<span id="experimentSafetyProgress" role="status" class="experiment-safety-progress-pill' + (allDone ? ' is-complete' : '') + '">' + checkedCount + ' / 4 Okundu</span>' +
              '</div>' +
              '<h2 id="experimentSafetyTitle">Deneyden Önce Güvenlik</h2><p class="experiment-safety-intro">Dört hatırlatmayı oku ve okuduklarını işaretle. Bu simülasyon, gerçek laboratuvarda deney yapma izni yerine geçmez.</p>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="experiment-safety-check-all' + (allDone ? ' is-all-checked' : '') + '" data-action="toggleAllSafetyChecks" data-safety-control="check-all">' +
            safetyIconSVG('tick') +
            '<span>' + (allDone ? 'İşaretleri Kaldır' : 'Hepsini Okudum') + '</span>' +
          '</button>' +
        '</header>' +
        '<div class="experiment-safety-content" role="group" aria-label="Güvenlik uyarıları onay listesi">' +
          rows.map(function(row, idx) {
            var isChecked = !!checks[idx];
            return '<div class="experiment-safety-row' + (isChecked ? ' is-checked' : '') + '" role="checkbox" aria-checked="' + (isChecked ? 'true' : 'false') + '" tabindex="0" data-action="toggleSafetyCheck" data-arg="' + idx + '" data-safety-control="item-' + idx + '">' +
              '<div class="experiment-safety-icon-badge" aria-hidden="true">' +
                safetyIconSVG(row[0]) +
                '<span class="experiment-safety-warn-corner">' + safetyIconSVG('miniWarn') + '</span>' +
              '</div>' +
              '<div class="experiment-safety-row-body">' +
                '<div class="experiment-safety-row-title">' +
                  '<strong>' + row[1] + '</strong>' +
                  '<span class="experiment-safety-status-tag">' + (isChecked ? '✓ Okundu' : 'Okunacak') + '</span>' +
                '</div>' +
                '<p>' + row[2] + '</p>' +
              '</div>' +
              '<div class="experiment-safety-check-box" aria-hidden="true">' +
                safetyIconSVG('tick') +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div class="experiment-safety-note" id="experimentSafetyNote">' +
          '<span class="experiment-safety-note-icon" aria-hidden="true">' + safetyIconSVG('headerWarn') + '</span>' +
          '<p><strong>Sanal Laboratuvar Hatırlatması:</strong> Bu deney sanaldır. Gerçek kimyasallarla evde veya öğretmen gözetimi dışında denemeyin. Gösterilen hacimler, akış ve sıcaklıklar eğitim modeline aittir.</p>' +
        '</div>' +
        '<footer class="experiment-safety-footer">' +
          '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="cancelExperimentSafety">Şimdilik Geri Dön</button>' +
          '<button type="button" class="experiment-safety-accept' + (allDone ? ' is-ready' : ' is-disabled') + '" id="experimentSafetyAccept" data-action="acceptExperimentSafety" data-safety-control="accept" aria-describedby="experimentSafetyProgress"' + (allDone ? '' : ' disabled') + ' title="' + esc(acceptTitle) + '">' +
            '<span>Okudum · Sanal Deneye Geç</span>' +
            window.MebiSVG.icon('check') +
          '</button>' +
        '</footer>' +
      '</section>' +
    '</div>';
  }
  function syncSafetyDOM(state) {
    if (window.LabScene && window.LabScene.refreshLayout) window.LabScene.refreshLayout();
    var app = document.getElementById('app');
    if (!app) return false;
    var e = get(state);
    var open = !!(state.screen === 'lab' && e.safetyOpen);
    var existing = app.querySelector('.experiment-safety-backdrop');
    if (!open) {
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
      wire(state);
      return true;
    }
    if (!existing) {
      app.insertAdjacentHTML('beforeend', safetyHTML(state));
      wire(state);
      return true;
    }
    var checks = Array.isArray(e.safetyChecks) && e.safetyChecks.length === 4 ? e.safetyChecks : [false, false, false, false];
    var checkedCount = checks.filter(Boolean).length;
    var allDone = checkedCount === 4;
    var acceptTitle = allDone
      ? 'Tüm güvenlik kuralları onaylandı, deneye başlayabilirsiniz.'
      : 'Devam etmek için lütfen 4 güvenlik uyarısının tamamını işaretleyerek onaylayın (' + checkedCount + '/4).';

    var pill = existing.querySelector('.experiment-safety-progress-pill');
    if (pill) {
      pill.classList.toggle('is-complete', allDone);
      pill.textContent = checkedCount + ' / 4 Okundu';
    }
    var checkAllBtn = existing.querySelector('.experiment-safety-check-all');
    if (checkAllBtn) {
      checkAllBtn.classList.toggle('is-all-checked', allDone);
      var checkAllSpan = checkAllBtn.querySelector('span');
      if (checkAllSpan) checkAllSpan.textContent = allDone ? 'İşaretleri Kaldır' : 'Hepsini Okudum';
    }
    existing.querySelectorAll('.experiment-safety-row').forEach(function(rowEl) {
      var idx = Number(rowEl.getAttribute('data-arg'));
      var isChecked = !!checks[idx];
      rowEl.classList.toggle('is-checked', isChecked);
      rowEl.setAttribute('aria-checked', isChecked ? 'true' : 'false');
      var tag = rowEl.querySelector('.experiment-safety-status-tag');
      if (tag) tag.textContent = isChecked ? '✓ Okundu' : 'Okunacak';
    });
    var acceptBtn = existing.querySelector('#experimentSafetyAccept');
    if (acceptBtn) {
      acceptBtn.disabled = !allDone;
      acceptBtn.classList.toggle('is-disabled', !allDone);
      acceptBtn.classList.toggle('is-ready', allDone);
      acceptBtn.setAttribute('title', acceptTitle);
    }
    return true;
  }
  function paint(state) {
    var e = get(state), q = quantities(state), t = temperature(state);
    ['initialMl','initialGrams','volume','remainingMl','remainingGrams','inputGrams','concentration1','concentration2','sourceConcentration'].forEach(function(key) {
      var el = document.querySelector('[data-experiment-value="' + key + '"]');
      if (!el) return;
      var text = /[Cc]oncentration/.test(key) ? (q[key] == null ? '—' : number(q[key],3)) : /Grams/.test(key) ? number(q[key],3) + ' g' : number(q[key]) + ' mL';
      if (el.textContent !== text) el.textContent = text;
    });
    document.querySelectorAll('[data-experiment-meter]').forEach(function(meter) {
      var value = meter.dataset.experimentMeter === 'temperature' ? t.current : q[meter.dataset.experimentMeter], max = Number(meter.getAttribute('aria-valuemax'));
      var isTemperature = meter.dataset.experimentMeter === 'temperature';
      var width = (isTemperature ? Math.abs(t.currentPercent-t.zeroPercent) : clamp(value / max, 0, 1) * 100) + '%';
      var fill = meter.querySelector('.experiment-amount-fill');
      if (fill && fill.style.width !== width) fill.style.width = width;
      if (isTemperature) {
        meter.style.setProperty('--temperature-start',t.startPercent + '%'); meter.style.setProperty('--temperature-current',t.currentPercent + '%');
        if (fill) fill.style.left = Math.min(t.zeroPercent,t.currentPercent) + '%';
        meter.setAttribute('aria-valuemin',String(t.minimum)); meter.setAttribute('aria-valuemax',String(t.maximum));
      }
      meter.setAttribute('aria-valuenow',String(value));
      meter.setAttribute('aria-valuetext',(isTemperature ? 'Başlangıç ' + number(t.initial,1) + ' °C; anlık ' : '') + number(value,meter.dataset.meterUnit === 'g' ? 3 : 1) + ' ' + meter.dataset.meterUnit);
    });
    [['[data-experiment-value="temperature"]',number(t.current,1) + ' °C'],['[data-experiment-temperature-trend]',t.trend],['[data-experiment-temperature-delta]','ΔT: ' + t.change],['[data-experiment-temperature-end]',(state.labStep === 'observed' ? number(t.current,1) + ' °C' : '—')]].forEach(function(row) {
      var el = document.querySelector(row[0]); if (el && el.textContent !== row[1]) el.textContent = row[1];
    });
    var button = document.querySelector('#benchDock [data-action="triggerPour"]');
    if (button) button.disabled = e.mode !== 'idle' || e.transfer >= 1 || e.safetyOpen;
    var label = document.getElementById('experimentTransferStatus');
    if (label) {
      var status = e.mode === 'returning' ? 'Beher masadaki yerine dönüyor.' : e.mode === 'manual' ? (e.transfer >= 1 ? 'Tamamı aktarıldı. Sağa sürükleyerek yerine getir veya bırak.' : 'Sola sürükle: dök · Sağa sürükle: akışı azalt ve geri al.') : e.transfer > 0 ? 'Kısmi aktarım korundu. Yeniden tutarak devam edebilirsin.' : 'Sağ beheri sola sürükle veya Beheri Dök düğmesine bas.';
      if (label.textContent !== status) label.textContent = status;
    }
  }
  function wire(state) {
    var open = !!(state.screen === 'lab' && get(state).safetyOpen);
    document.querySelectorAll('#app > :not(.experiment-safety-backdrop)').forEach(function(node) { node.inert = open; });
    var world = document.getElementById('labWorld'); if (world) world.inert = open;
    if (open) {
      var card = document.querySelector('.experiment-safety-card');
      var active = document.activeElement;
      if (card && (!active || !card.contains(active))) {
        var acceptButton = document.getElementById('experimentSafetyAccept');
        var firstItem = card.querySelector('[data-safety-control="item-0"]');
        if (acceptButton && !acceptButton.disabled) acceptButton.focus({ preventScroll:true });
        else if (firstItem) firstItem.focus({ preventScroll:true });
      }
    }
    if (state.screen === 'lab' && state.selectedSlot1 && state.selectedSlot2) paint(state.explanationReview ? replayState(state,0) : state);
  }
  if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('keydown',function(event) {
    var dialog = document.querySelector('.experiment-safety-card');
    if (!dialog) return;
    if (event.key === 'Escape') { event.preventDefault(); if (window.TepkimeArenasi) window.TepkimeArenasi.dispatch('cancelExperimentSafety'); return; }
    if (event.key !== 'Tab') return;
    var controls = Array.prototype.filter.call(dialog.querySelectorAll('button:not(:disabled),[role="checkbox"][tabindex="0"]'),function(el) { return el.getClientRects().length; });
    var first = controls[0], last = controls[controls.length-1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.MebiExperiment = { defaults:DEFAULTS, initialAmount:initialAmount, reset:reset, get:get, sample:sample, request:request, accept:accept,
    allSafetyChecked:allSafetyChecked, toggleSafetyItem:toggleSafetyItem, toggleAllSafetyItems:toggleAllSafetyItems, syncSafetyDOM:syncSafetyDOM,
    startManual:startManual, scrub:scrub, release:release, startAuto:startAuto, park:park, advance:advance,
    quantities:quantities, replayState:replayState, temperature:temperature, cardHTML:cardHTML, actionsHTML:actionsHTML, safetyHTML:safetyHTML, paint:paint, wire:wire };
})(window);
