/* Nonreacting teaching scenarios: evidence -> inventory matching / dissolution.
 * Deliberately separate from chemical equation construction and its success rules.
 */
(function(window) {
  'use strict';
  var KEY = 'tepkime_arenasi_nonreaction_v1';
  var MAX_COUNT = 999;
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function icon(name) { return window.MebiSVG ? window.MebiSVG.icon(name) : ''; }
  function label(kind) { return window.MebiExplanationModel.symbol(kind); }
  function phase(p) { return p === 'solid' ? 'katı' : p === 'gas' ? 'gaz' : 'suda'; }
  function charge(kind) { return window.MebiExplanationModel.CHARGES[kind] || 0; }
  function termKey(t) { return t.kind + ':' + t.phase; }
  function count(items) {
    var map = {};
    items.filter(function(p) { return !p.solvent; }).forEach(function(p) {
      var key = termKey(p);
      if (!map[key]) map[key] = {kind:p.kind, phase:p.phase, count:0};
      map[key].count++;
    });
    return Object.keys(map).sort().map(function(key) { return map[key]; });
  }
  function scenario(state) {
    var rx = window.MebiData.getReaction(state.selectedSlot1, state.selectedSlot2);
    // Never infer this branch from observation answers or an empty product list.
    if (!rx || rx.typeCategory !== 'none' || !window.MebiExplanationModel) return null;
    var data = window.MebiExplanationModel.build(state), model = data.model;
    if (!model || model.recipe || model.events.length) return null;
    var before = count(model.initial), after = count(model.dissolved);
    // Use the smallest common representative packet on both sides, rather than
    // making the learner copy the 3D renderer's arbitrary sampling multiplicity.
    function gcd(a,b) { return b ? gcd(b,a%b) : a; }
    var divisor=before.concat(after).reduce(function(n,t){return gcd(n,t.count);},0)||1;
    before.concat(after).forEach(function(t){t.count/=divisor;});
    var mode = model.dissolved.some(function(p) { return p.dissolving; }) ? 'dissolution' : !model.wet ? 'dry' : 'mixture';
    if (mode === 'dry') {
      before.forEach(function(t) { t.count = 1; });
      after.forEach(function(t) { t.count = 1; });
    }
    var ionic = mode === 'mixture' && after.length > 0 && after.every(function(t) { return t.phase === 'aqueous' && charge(t.kind) !== 0; });
    return {mode:mode, ionic:ionic, wet:model.wet, before:before, after:after, model:model};
  }
  function get(state) {
    var id = state.observation && state.observation.record && state.observation.record.id;
    var pair = [state.selectedSlot1, state.selectedSlot2].join('|');
    if (!state.nonReaction || state.nonReaction.observationId !== id || state.nonReaction.pair !== pair) {
      var saved;
      try { saved = JSON.parse(localStorage.getItem(KEY) || '{}')[id]; } catch(e) {}
      var d = {version:1, observationId:id, pair:pair, view:'compare', terms:[], decision:'', reason:'', interpretation:'', pairs:[], checked:false, saved:false, message:'', error:false, revisions:[]};
      var s = scenario(state);
      if (saved && saved.version === 1 && saved.pair === pair && s) {
        ['decision','reason','interpretation'].forEach(function(k) { if (typeof saved[k] === 'string') d[k] = saved[k].slice(0, 2000); });
        if (Array.isArray(saved.terms)) saved.terms.forEach(function(t) {
          if (s.after.some(function(a) { return termKey(a) === termKey(t); }) && !d.terms.some(function(a) { return termKey(a) === termKey(t); })) {
            d.terms.push({kind:t.kind, phase:t.phase, count:Math.max(1,Math.min(MAX_COUNT,parseInt(t.count,10)||1))});
          }
        });
        if (Array.isArray(saved.pairs)) d.pairs = saved.pairs.filter(function(k) { return s.before.some(function(t) { return termKey(t) === k; }); });
        if (saved.view === 'cancel' && s.ionic) d.view = 'cancel';
        if (Array.isArray(saved.revisions)) d.revisions = saved.revisions;
        d.saved = !!saved.saved;
        if(!sameInventory(s.after,d.terms)){d.saved=false;d.view='compare';d.pairs=[];}
      }
      state.nonReaction = d;
    }
    return state.nonReaction;
  }
  function persist(state) {
    var d = get(state);
    try {
      var all = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (!all || typeof all !== 'object' || Array.isArray(all)) all = {};
      all[d.observationId] = {version:1, observationId:d.observationId, pair:d.pair, view:d.view, terms:d.terms, decision:d.decision, reason:d.reason, interpretation:d.interpretation, pairs:d.pairs, saved:d.saved, revisions:d.revisions};
      localStorage.setItem(KEY,JSON.stringify(all)); d.storageError = false;
    } catch(e) { d.storageError = true; }
    return !d.storageError;
  }
  function totals(terms) {
    var atoms = {}, totalCharge = 0;
    terms.forEach(function(t) {
      window.MebiExplanationModel.template(t.kind).atoms.forEach(function(a) { atoms[a.element] = (atoms[a.element] || 0) + t.count; });
      totalCharge += charge(t.kind) * t.count;
    });
    return {atoms:atoms, charge:totalCharge};
  }
  function sameInventory(a, b) {
    return a.length === b.length && a.every(function(t) { return b.some(function(u) { return termKey(t) === termKey(u) && t.count === u.count; }); });
  }
  function validate(state) {
    var s = scenario(state), d = get(state);
    if (!s) return {ready:false, inventory:false, atoms:false, charge:false};
    var a = totals(s.before), b = totals(d.terms), elements = Object.keys(a.atoms).concat(Object.keys(b.atoms)).filter(function(k,i,list) { return list.indexOf(k) === i; }).sort();
    var atoms = elements.length > 0 && elements.every(function(k) { return (a.atoms[k] || 0) === (b.atoms[k] || 0); });
    var expectedInterpretation = s.mode === 'dissolution' ? 'dissolved' : s.mode === 'dry' ? 'dry' : s.after.some(function(t) { return t.phase === 'solid'; }) ? 'dispersed' : 'mixed';
    var inventory = sameInventory(s.after, d.terms);
    var allPairs = s.ionic && d.pairs.length === s.before.length && s.before.every(function(t) { return d.pairs.indexOf(termKey(t)) >= 0; });
    var reasonComplete = d.view === 'cancel' || d.reason.trim().length > 0;
    return {ready:true, inventory:inventory, atoms:atoms, charge:a.charge === b.charge, before:a, after:b, elements:elements,
      interpretation:d.interpretation === expectedInterpretation, expectedInterpretation:expectedInterpretation, decision:d.decision === 'no', reason:reasonComplete,
      allPairs:allPairs, valid:inventory && atoms && a.charge === b.charge && d.decision === 'no' && reasonComplete && d.interpretation === expectedInterpretation && (d.view !== 'cancel' || allPairs)};
  }
  function invalidate(d) { d.checked=false; d.saved=false; d.message=''; d.error=false; d.pairs=[]; }
  function check(state) {
    var d=get(state), v=validate(state);
    d.checked=true;
    d.error=!v.valid;
    d.message=!v.ready ? 'Tanecik modeli hazırlanıyor…' : !v.inventory ? 'Türleri, fiziksel hâllerini ve temsili sayılarını yeniden karşılaştır. Atom ve yük eşitliği tek başına eşleştirmeyi tamamlamaz.' : !v.interpretation ? 'Karışmadaki fiziksel değişimi yeniden yorumla.' : !d.decision ? 'Yeni ürün oluşumuna ilişkin kararını seç.' : !v.decision ? 'Bu öğretim modelinde yeni kimyasal ürün gösterilmiyor. Önce–sonra türlerini inceleyip kararını yeniden değerlendir.' : !v.reason ? 'Sonucunu gözlemin ve tanecik modelinle ilişkilendirerek gerekçelendir.' : d.view==='cancel'&&!v.allPairs ? 'Aynı tür ve miktardaki iyon çiftlerinin tamamını eşleştir.' : 'Türler, atomlar ve toplam yük korunuyor. Gerekçeli sonucunu kaydedebilirsin.';
    persist(state);
    return v.valid;
  }
  function save(state) {
    if (!window.MebiModel.canEnter(state) || !check(state)) return false;
    var d=get(state), s=scenario(state), explanation=window.MebiExplanation.get(state);
    var record={mode:s.mode, before:clone(s.before), after:clone(d.terms), decision:d.decision, reason:d.reason, interpretation:d.interpretation,
      cancelled:d.view==='cancel', pairs:d.pairs.slice(), explanationRevision:explanation.revisions.length, createdAt:new Date().toISOString()};
    d.revisions.push(record); d.saved=true;
    if (!persist(state)) { d.saved=false; d.error=true; d.message='Sonucun bu oturumda korunuyor; tarayıcıya kaydedilemedi. Yeniden kaydetmeyi dene.'; return false; }
    d.message='Modelin ve tepkimesiz sonucunun gerekçesi laboratuvar günlüğüne kaydedildi.';
    return record;
  }
  function action(state, type, value) {
    var s=scenario(state), d=get(state);
    if (!s || !window.MebiModel.canEnter(state) || state.screen !== 'model') return false;
    if (type==='add') {
      var t=s.after.find(function(t) { return termKey(t)===value; });
      if (!t) return false;
      invalidate(d);
      var old=d.terms.find(function(u) { return termKey(t)===termKey(u); });
      if(old) old.count=Math.min(MAX_COUNT,old.count+1); else d.terms.push({kind:t.kind,phase:t.phase,count:1});
    } else if(type==='count') {
      var split=value.split('|'), existing=d.terms.find(function(t) { return termKey(t)===split[0]; });
      if(!existing) return false;
      invalidate(d);existing.count=Math.max(1,Math.min(MAX_COUNT,parseInt(split[1],10)||1));
    } else if(type==='remove') { invalidate(d);d.terms=d.terms.filter(function(t){return termKey(t)!==value;}); }
    else if(type==='clear') { invalidate(d);d.terms=[]; }
    else if(type==='decision') { if(['yes','no','unsure'].indexOf(value)<0)return false;invalidate(d);d.decision=value;if(s.mode==='mixture'&&s.after.every(function(t){return t.phase==='aqueous';}))d.interpretation='mixed'; }
    else if(type==='interpret') { if(['dissolved','precipitate','dispersed','dry','mixed'].indexOf(value)<0)return false;invalidate(d);d.interpretation=value;d.decision=value==='precipitate'?'yes':'no'; }
    else if(type==='reason') { d.saved=false;d.checked=false;d.reason=String(value).slice(0,2000);d.message='';d.error=false; }
    else if(type==='check') return check(state);
    else if(type==='cancelView') {
      if(!s.ionic || !validate(state).inventory){d.error=true;d.message='Önce türleri ve temsili sayılarını eşleştir.';persist(state);return false;}
      d.view='cancel';d.saved=false;d.checked=false;d.message='';d.error=false;
    } else if(type==='compareView') {d.view='compare';d.saved=false;d.checked=false;d.message='';d.error=false;}
    else if(type==='pair') {
      if(!s.ionic || !validate(state).inventory || !s.before.some(function(t){return termKey(t)===value;}))return false;
      d.saved=false;d.checked=false;d.message='';d.error=false;
      if(d.pairs.indexOf(value)>=0)d.pairs=d.pairs.filter(function(k){return k!==value;});else d.pairs.push(value);
    } else if(type==='resetPairs') {d.pairs=[];d.saved=false;d.checked=false;d.message='';d.error=false;}
    else return false;
    persist(state);return true;
  }
  function number(n) {return n>0?'+'+n:String(n);}
  function formula(t) {return '<strong>'+esc(label(t.kind))+'</strong><small>('+phase(t.phase)+')</small>';}
  function compactLabel(text,short) {return '<span class="nr-button-full">'+text+'</span><span class="nr-button-short">'+short+'</span>';}
  function button(text, type, value, primary, disabled) {
    var short={clear:'Temizle',check:'Kontrol et',cancelView:'Net değişim',compareView:'← Geri dön'}[type];
    return '<button type="button" class="mebi-btn '+(primary?'mebi-btn-primary':'mebi-btn-secondary')+' mebi-btn-sm" data-nr-action="'+type+'" data-nr-value="'+esc(value||'')+'"'+(disabled?' disabled':'')+'>'+(short?compactLabel(text,short):text)+'</button>';
  }
  function header(state, stage, title, subtitle) {
    return '<header class="learning-card-header"><div class="learning-header-copy"><div class="prediction-heading arena-stage-heading"><span class="prediction-eyebrow">'+icon('beakerIc')+' '+stage+'</span><h1 id="'+(stage.indexOf('4.')===0?'explanationTitle':'modelTitle')+'">'+title+'</h1></div><p class="prediction-intro">'+subtitle+'</p></div>'+window.MebiObservation.pairHTML(state)+'</header>';
  }
  function feedback(state) {
    var d=get(state), message=d.storageError?'Bu oturumda korunuyor; tarayıcıya kaydedilemedi.':d.message;
    return '<p class="nr-feedback'+(d.error?' is-error':'')+'" id="nrFeedback" role="'+(d.error?'alert':'status')+'" aria-live="polite">'+esc(message)+'</p>';
  }
  function noticeHTML(state) {
    var d=get(state), notice=d.notice;
    if (!notice) return '';
    var success=notice.type==='success';
    return '<dialog id="nrNotice" class="nr-notice" role="'+(success?'dialog':'alertdialog')+'" aria-labelledby="nrNoticeTitle" aria-describedby="nrNoticeMessage">'+
      '<h2 id="nrNoticeTitle">'+(success?'Sonucun kaydedildi':'Modelini ve sonucunu gözden geçir')+'</h2>'+
      '<p id="nrNoticeMessage">'+esc(notice.message)+'</p>'+
      (notice.errors&&notice.errors.length?'<ul>'+notice.errors.map(function(e){return '<li>'+esc(e)+'</li>';}).join('')+'</ul>':'')+
      '<div class="nr-notice-actions">'+(success?
        '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="startNewExperiment">Yeni bir Deney Yap</button><button type="button" class="mebi-btn mebi-btn-primary mebi-btn-sm" data-action="viewCollectionFromCompletion">Laboratuvar Günlüğünü Görüntüle</button>':
        '<button type="button" class="mebi-btn mebi-btn-primary mebi-btn-sm" data-action="dismissNonReactionNotice" autofocus>Tamam</button>')+'</div></dialog>';
  }
  function showSaveNotice(state, saved) {
    var d=get(state), s=scenario(state), v=validate(state), errors=[];
    if (!saved && !d.storageError) {
      s.after.forEach(function(t){
        var found=d.terms.find(function(u){return termKey(u)===termKey(t);});
        if(!found) errors.push(label(t.kind)+' ('+phase(t.phase)+') karışım sonrası taslağında eksik. Temsili sayısı '+t.count+' olmalı.');
        else if(found.count!==t.count) errors.push(label(t.kind)+' ('+phase(t.phase)+') temsili sayısı '+found.count+'; başlangıçla eşleşmesi için '+t.count+' olmalı.');
      });
      d.terms.forEach(function(t){if(!s.after.some(function(u){return termKey(u)===termKey(t);}))errors.push(label(t.kind)+' ('+phase(t.phase)+') bu karışımın son durumuyla eşleşmiyor. Türü ve fiziksel hâlini kontrol et.');});
      if(!v.interpretation)errors.push('Karışmayı yorumlama seçimini başlangıç ve son durumdaki türlere göre yeniden değerlendir.');
      if(!v.decision)errors.push(d.decision?'Bu koşullarda yeni kimyasal ürün oluşumu gösterilmiyor. Ürün oluşumuna ilişkin kararını yeniden değerlendir.':'Yeni kimyasal ürün oluşumuna ilişkin kararını seç.');
      if(!v.reason)errors.push('Gerekçe alanı boş. Gözlemini tanecik modeliyle ilişkilendirerek sonucunu açıkla.');
      if(d.view==='cancel'&&!v.allPairs)errors.push('Önce ve sonra aynı tür ve miktarda bulunan iyon çiftlerinin tamamını eşleştir.');
    }
    d.notice={type:saved?'success':'error', message:saved?'Modelin ve tepkimesiz sonucunun gerekçesi laboratuvar günlüğüne kaydedildi.':d.storageError?'Sonucun tarayıcıya kaydedilemedi. Yeniden kaydetmeyi dene.':'Kaydetmeden önce aşağıdaki eksik veya hataları düzelt.',errors:errors};
  }
  function ledger(state, s, d) {
    var v=validate(state), rows=v.elements.map(function(el) {
      var left=v.before.atoms[el]||0,right=v.after.atoms[el]||0;
      return '<tr><th scope="row">'+esc(el)+'</th><td>'+left+'</td><td class="'+(left===right?'nr-equal':'nr-different')+'">'+right+'<span class="sr-only">'+(left===right?' · Eşit':' · Eşit değil')+'</span>'+icon(left===right?'check':'helpCircle')+'</td></tr>';
    }).join('');
    rows+='<tr class="nr-charge-row"><th scope="row">Yük</th><td>'+number(v.before.charge)+'</td><td class="'+(v.charge?'nr-equal':'nr-different')+'">'+number(v.after.charge)+'<span class="sr-only">'+(v.charge?' · Eşit':' · Eşit değil')+'</span>'+icon(v.charge?'check':'helpCircle')+'</td></tr>';
    return '<aside class="nr-ledger"><h2>Atom ve yük envanteri</h2><div class="nr-table-scroll"><table><caption class="sr-only">Önce ve öğrenci taslağındaki atom sayıları ile toplam yük</caption><thead><tr><th scope="col">Tür</th><th scope="col">Önce</th><th scope="col">Taslak</th></tr></thead><tbody>'+rows+'</tbody></table></div></aside>';
  }
  function termsHTML(terms, editable) {
    return terms.map(function(t) {
      return '<div class="nr-term'+(editable?' is-editable':'')+'">'+(editable?'<input type="number" inputmode="numeric" min="1" max="'+MAX_COUNT+'" value="'+t.count+'" data-nr-count="'+esc(termKey(t))+'" aria-label="'+esc(label(t.kind))+' temsili sayısı">':'<span class="nr-count">'+t.count+'</span>')+'<span class="nr-formula">'+formula(t)+'</span>'+(editable?'<button type="button" class="nr-remove" data-nr-action="remove" data-nr-value="'+esc(termKey(t))+'" aria-label="'+esc(label(t.kind))+' türünü kaldır" title="Türü kaldır">×</button>':'')+'</div>';
    }).join('');
  }
  function interpretationHTML(s,d) {
    var choices=s.mode==='dissolution' ? [['dissolved','Başlangıçtaki katı çözündü.'],['precipitate','Yeni bir katı çökelti oluştu.'],['dispersed','Katı yalnızca dağıldı; çözünmedi.']] : s.mode==='dry' ? [['dry','Katılar kimliklerini koruyarak karıştı.'],['dissolved','Katılar suda çözündü.'],['precipitate','Yeni bir katı çökelti oluştu.']] : s.after.some(function(t){return t.phase==='solid';}) ? [['dispersed','Başlangıçtaki katı karışımda kaldı / dağıldı.'],['precipitate','Yeni bir katı çökelti oluştu.'],['dissolved','Başlangıçtaki katı tamamen çözündü.']] : [['mixed','Başlangıçtaki çözünmüş türler karıştı.'],['precipitate','Yeni bir katı çökelti oluştu.']];
    return '<fieldset class="nr-radio-group"><legend>'+ (s.mode==='dissolution'?'Katıdaki değişimi nasıl yorumluyorum?':'Karışmayı nasıl yorumluyorum?')+'</legend>'+choices.map(function(c){return '<label><input type="radio" name="nrInterpretation" data-nr-choice="interpret" value="'+c[0]+'"'+(d.interpretation===c[0]?' checked':'')+'><span>'+c[1]+'</span></label>';}).join('')+'</fieldset>';
  }
  function decisionHTML(d) {
    return '<fieldset class="nr-radio-group nr-inline"><legend>Yeni kimyasal ürün oluştuğunu düşünüyor musun?</legend>'+[['no','Hayır'],['yes','Evet'],['unsure','Henüz karar veremedim']].map(function(c){return '<label><input type="radio" name="nrDecision" data-nr-choice="decision" value="'+c[0]+'"'+(d.decision===c[0]?' checked':'')+'><span>'+c[1]+'</span></label>';}).join('')+'</fieldset>';
  }
  function reasonHTML(d) {return '<label class="nr-reason" for="nrReason">Gerekçem<textarea id="nrReason" maxlength="2000" rows="2" placeholder="Gözleminle tanecik modelini ilişkilendirerek sonucunu açıkla.">'+esc(d.reason)+'</textarea></label>';}
  function auxiliary(s) {
    return '<div class="nr-aux">Çözücü: <strong>'+(s.wet?'H₂O':'Yok · kuru karışım')+'</strong><span>·</span>Katalizör: <strong>—</strong></div>';
  }
  function cancelHTML(s,d) {
    function row(title,terms){return '<section class="nr-inventory-row"><h3>'+title+'</h3><div class="nr-pair-terms">'+terms.map(function(t,i){var paired=d.pairs.indexOf(termKey(t))>=0;return (i?'<span class="nr-plus" aria-hidden="true">+</span>':'')+'<button type="button" class="nr-pair'+(paired?' is-paired':'')+'" data-nr-action="pair" data-nr-value="'+esc(termKey(t))+'" aria-pressed="'+paired+'" aria-label="'+esc(label(t.kind))+' iyon çiftini '+(paired?'geri al':'eşleştir')+'"><span class="nr-count">'+t.count+'</span><span class="nr-pair-formula">'+esc(label(t.kind))+'</span>'+icon(paired?'check':'helpCircle')+'</button>';}).join('')+'</div></section>';}
    var done=validateFrom(s,d)&&sameInventory(s.after,d.terms);
    return '<div class="nr-work"><div class="nr-section-heading"><h2>İyon envanterinin gösterimi</h2>'+button('Eşleştirmeyi geri al','resetPairs')+'</div><p class="nr-caption">Aynı tür ve miktardaki çiftleri seç. Bu gösterim, ürün oluşumu değildir.</p><div class="nr-pair-workspace">'+row('Karıştırmadan önce',s.before)+row('Karıştırdıktan sonra',d.terms)+'</div><section class="nr-result"><h3>Net değişim</h3><p>'+(done?'Tüm iyonlar aynı kaldı.':'Eşleştirdiğin türler net gösterimden çıkarılır.')+'</p><small>'+(done?'Bu koşullarda net iyon denklemi yazılmaz.':d.pairs.length+' / '+s.before.length+' iyon çifti eşleştirildi.')+'</small></section>'+auxiliary(s)+'</div>';
  }
  function validateFrom(s,d){return d.pairs.length===s.before.length&&s.before.every(function(t){return d.pairs.indexOf(termKey(t))>=0;});}
  function renderModel(state) {
    var s=scenario(state), d=get(state), cancelling=s.ionic&&d.view==='cancel';
    var title=cancelling?'Net bir değişim kaldı mı?':s.mode==='dissolution'?'Katı çözüldü mü, yeni ürün mü oluştu?':s.mode==='dry'?'Kuru karışımda neler aynı kaldı?':'Karışımda hangi türler aynı kaldı?';
    var subtitle=cancelling?'Önce ve sonra aynı tür ve miktarda bulunan iyonları eşleştir.':'Başlangıçtaki türleri karışım sonrasıyla karşılaştır; kararını gerekçelendir.';
    var source=cancelling?'':'<section class="nr-source"><div><h2>'+(s.mode==='dissolution'?'Tür havuzum':'Başlangıç türlerim')+'</h2><p>Sürükle veya seçip ekle.</p></div><div class="nr-source-chips">'+s.after.map(function(t){return '<button type="button" class="nr-source-chip" draggable="true" data-nr-action="add" data-nr-value="'+esc(termKey(t))+'">'+icon('grid')+'<span class="nr-formula">'+formula(t)+'</span></button>';}).join('')+'</div></section>';
    if(!cancelling&&s.mode==='dissolution')source='<details class="nr-source-fold"><summary>Tür havuzum · sürükle veya seçip ekle</summary>'+source+'</details>';
    var question=s.mode==='mixture'&&s.after.every(function(t){return t.phase==='aqueous';})?decisionHTML(d):interpretationHTML(s,d);
    var slot=s.after.every(function(t){return d.terms.some(function(u){return termKey(t)===termKey(u);});})?'':'<button type="button" class="nr-add-slot" data-nr-focus-source>Tür seçip ekle</button>';
    var workspace=cancelling?cancelHTML(s,d):'<div class="nr-work"><h2>Önce / sonra '+(s.mode==='dissolution'?'gösterimim':'eşleştirmem')+'</h2><div class="nr-comparison"><section class="nr-inventory-row"><h3>Başlangıç · temsili envanter</h3><div class="nr-terms">'+termsHTML(s.before,false)+'</div></section><div class="nr-process" aria-label="'+(s.mode==='dissolution'?'Suda çözünme ve karışma':'Karıştırma')+'"><span>'+(s.mode==='dissolution'?'Suda çözünme ve karışma':'Karıştırma')+'</span>'+icon('down')+'</div><section class="nr-inventory-row nr-dropzone" aria-label="Karışım sonrası tür ekleme alanı"><h3>Karışım sonrası · taslağım</h3><div class="nr-terms">'+termsHTML(d.terms,true)+slot+'</div></section></div>'+question+reasonHTML(d)+auxiliary(s)+'</div>';
    var v=validate(state);
    return '<section class="prediction-card explanation-card model-card nr-card" id="modelCard" data-nr-root data-nr-mode="'+s.mode+'" data-nr-view="'+(cancelling?'cancel':'compare')+'" aria-labelledby="modelTitle">'+header(state,'5. Model',title,subtitle)+'<div class="prediction-content model-content nr-body">'+source+'<div class="nr-middle">'+workspace+ledger(state,s,d)+'</div></div><footer class="prediction-footer explanation-footer nr-footer"><div class="prediction-actions">'+(cancelling?button('← Eşleştirmeme dön','compareView'):'<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="backToExplanation">← Açıklamama dön</button>')+(s.ionic&&!cancelling?button('Net değişimi incele →','cancelView',null,false,!v.inventory):'')+'<button type="button" class="mebi-btn mebi-btn-primary mebi-btn-sm" data-action="saveNonReaction">'+compactLabel('Modelimi ve sonucumu kaydet','Kaydet')+'</button></div></footer></section>'+noticeHTML(state);
  }
  function explanationHTML(state, html) {
    var record=state.observation.record, d=window.MebiExplanation.get(state);
    var options=[['physical','Yeni madde oluşmadığını düşünüyorum.'],['chemical','Yeni madde oluştuğunu düşünüyorum.'],['unsure','Henüz karar veremiyorum.']];
    var reviewModal = (window.MebiObservation && window.MebiObservation.reviewModalHTML) ? window.MebiObservation.reviewModalHTML(state) : '';

    return '<section class="prediction-card explanation-card explanation-unified nr-card" id="explanationCard" data-nr-root aria-labelledby="explanationTitle">' +
      header(state,'4. Açıkla','Gözlemim neyi destekliyor?','Gözlediğin durumla yorumunu ayır; kararını gerekçelendir.') +
      '<div class="prediction-content explanation-content nr-body">' +
        '<div class="nr-evidence-grid" style="grid-template-columns:1fr;">' +
          '<section class="nr-explanation-writing" style="border-left:none;padding-left:0;width:100%;">' +
            '<section class="nr-decision-card" id="explanationDecisionGroup" aria-labelledby="nrDecisionTitle">' +
              '<h2 id="nrDecisionTitle">Kararım ve gerekçem</h2>' +
              '<fieldset class="nr-radio-group nr-decision"><legend class="sr-only">Yeni madde oluşumuna ilişkin yorumum</legend>' +
                options.map(function(o){return '<label><input type="radio" name="explanationChangeType" data-explanation-change value="'+o[0]+'"'+(d.changeType===o[0]?' checked':'')+'><span>'+o[1]+'</span></label>';}).join('') +
              '</fieldset>' +
              '<div class="nr-decision-tools">' +
                '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="openPredictionDialog">' +
                  icon('helpCircle') + '<span>Gözlem Kaydım</span>' +
                '</button>' +
                '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="reviewExplanationExperiment">' +
                  icon('eye') + '<span>Deneyi Tekrar Gözle</span>' +
                '</button>' +
                '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="openParticleInspection" data-arg="before">' +
                  icon('eye') + '<span>3 Boyutlu Tanecik Modelini İncele</span>' +
                '</button>' +
              '</div>' +
            '</section>' +
            '<h3 id="explanationWritingTitle">Bu karara nasıl ulaştım?</h3>' +
            '<div id="explanationEditor" class="explanation-editor nr-editor" role="textbox" aria-multiline="true" aria-labelledby="explanationWritingTitle" contenteditable="true" data-placeholder="Gözlemini ve tanecik düzeyinde araştırmak istediğin durumu açıkla." data-empty="'+(!html)+'">'+html+'</div>' +
          '</section>' +
        '</div>' +
      '</div>' +
      '<footer class="prediction-footer explanation-footer nr-footer">' +
        '<div id="explanationFeedback" class="explanation-feedback"><p id="explanationStatus" role="status" aria-live="polite"></p></div>' +
        '<div class="prediction-actions">' +
          '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="backToObservation">← Gözlem Kartına Dön</button>' +
          '<button type="button" class="mebi-btn mebi-btn-primary mebi-btn-sm" id="toModelButton" data-action="toModel">Kaydet ve Model aşamasına geç →</button>' +
        '</div>' +
      '</footer>' +
    '</section>' + reviewModal;
  }
  function wire(state) {
    var host=document.querySelector('[data-nr-root]');
    if(!host)return;
    var notice=document.getElementById('nrNotice');
    if(notice&&!notice.open){notice.showModal();notice.addEventListener('cancel',function(e){e.preventDefault();window.TepkimeArenasi.dispatch('dismissNonReactionNotice');});}
    function refresh(attribute,value,choice) {
      var picker=host.querySelector('.nr-source-fold'),wasOpen=picker&&picker.open;
      window.TepkimeArenasi.render(false);
      var nextPicker=document.querySelector('.nr-source-fold');if(nextPicker&&wasOpen)nextPicker.open=true;
      var next=Array.from(document.querySelectorAll('['+attribute+']')).find(function(el){return el.getAttribute(attribute)===value&&(!choice||el.value===choice);});
      if(next)next.focus({preventScroll:true});
    }
    host.querySelectorAll('[data-nr-action]').forEach(function(b){b.addEventListener('click',function(){action(state,b.dataset.nrAction,b.dataset.nrValue);refresh('data-nr-value',b.dataset.nrValue||'');});});
    host.querySelectorAll('[data-nr-choice]').forEach(function(input){input.addEventListener('change',function(){if(input.checked){action(state,input.dataset.nrChoice,input.value);refresh('data-nr-choice',input.dataset.nrChoice,input.value);}});});
    host.querySelectorAll('[data-nr-count]').forEach(function(input){
      function updateCount(normalize){
        if(!input.value&&!normalize)return;
        action(state,'count',input.dataset.nrCount+'|'+input.value);
        if(normalize){var term=get(state).terms.find(function(t){return termKey(t)===input.dataset.nrCount;});if(term)input.value=String(term.count);}
        var oldLedger=host.querySelector('.nr-ledger');
        if(oldLedger)oldLedger.outerHTML=ledger(state,scenario(state),get(state));
        var next=host.querySelector('[data-nr-action="cancelView"]');if(next)next.disabled=!validate(state).inventory;
        var feedback=host.querySelector('#nrFeedback');if(feedback)feedback.textContent='';
        var saved=host.querySelector('.nr-saved');if(saved)saved.remove();
      }
      // Keep the edited node mounted so Tab can move to the next control.
      input.addEventListener('input',function(){updateCount(false);});
      input.addEventListener('change',function(){updateCount(true);});
    });
    var reason=host.querySelector('#nrReason');
    if(reason)reason.addEventListener('input',function(){action(state,'reason',reason.value);var feedback=host.querySelector('#nrFeedback');if(feedback)feedback.textContent='';var saved=host.querySelector('.nr-saved');if(saved)saved.remove();});
    var focusSource=host.querySelector('[data-nr-focus-source]');
    if(focusSource)focusSource.addEventListener('click',function(){var picker=host.querySelector('.nr-source-fold');if(picker)picker.open=true;var chip=host.querySelector('.nr-source-chip');if(chip)chip.focus();});
    host.querySelectorAll('.nr-source-chip').forEach(function(chip){chip.addEventListener('dragstart',function(e){if(e.dataTransfer){e.dataTransfer.setData('application/x-tepkime-inventory',chip.dataset.nrValue);e.dataTransfer.effectAllowed='copy';}});});
    var drop=host.querySelector('.nr-dropzone');
    if(drop){drop.addEventListener('dragover',function(e){e.preventDefault();drop.classList.add('is-drop-active');});drop.addEventListener('dragleave',function(){drop.classList.remove('is-drop-active');});drop.addEventListener('drop',function(e){e.preventDefault();drop.classList.remove('is-drop-active');var value=e.dataTransfer&&e.dataTransfer.getData('application/x-tepkime-inventory');if(value){action(state,'add',value);window.TepkimeArenasi.render(false);}});}
  }
  window.MebiNonReaction={scenario:scenario,get:get,persist:persist,totals:totals,validate:validate,check:check,save:save,showSaveNotice:showSaveNotice,action:action,renderModel:renderModel,explanationHTML:explanationHTML,wire:wire};
})(window);
