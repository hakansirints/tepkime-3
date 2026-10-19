/* Evidence, particle relationships and a revisable student explanation. */
(function(window) {
  'use strict';
  var KEY = 'tepkime_arenasi_explanations_v1';
  // Temporary QA controls: switch off here to remove all three fill buttons.
  var TEST_TOOLS_ENABLED = true;
  var steps = ['Gözlemimi yorumluyorum','Tanecikleri ilişkilendiriyorum','Taneciklerle açıklıyorum'];
  var changeTypes = [['chemical','Kimyasal değişim','Yeni madde oluştuğunu düşünüyorum.'],['physical','Fiziksel değişim','Yeni madde oluşmadığını düşünüyorum.'],['unsure','Henüz karar veremedim','Tanecikleri inceleyerek kararımı geliştireceğim.']];
  function hasDecision(draft) { return changeTypes.some(function(item){return item[0]===draft.changeType;}); }
  var roles = [['reactant','Tepkimeye katılan'],['solid','Oluşan çökelti / katı'],['gas','Oluşan gaz'],['water','Oluşan su'],['other','Diğer ürün / kompleks'],['spectator','Seyirci iyon'],['catalyst','Katalizör'],['unchanged','Diğer değişmeden kalan']];
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function eligible(state) { return !!(state.predictionRecord && state.observation && state.observation.record && state.poured && state.labStep === 'observed'); }
  function entries() { var data = JSON.parse(window.localStorage.getItem(KEY) || '{}'); return data && typeof data === 'object' && !Array.isArray(data) ? data : {}; }
  function get(state) {
    var id = state.observation && state.observation.record && state.observation.record.id;
    if (!state.explanation || state.explanation.observationId !== id) {
      var saved; try { saved = entries()[id]; } catch(e) {}
      state.explanation = {observationId:id, html:'', assignments:{}, evidence:[], changeType:'', revisions:[], visits:0, step:1, message:'', storageError:false};
      if (saved && saved.observationId === id) {
        state.explanation.html = typeof saved.html === 'string' ? saved.html : '';
        state.explanation.assignments = saved.assignments && typeof saved.assignments === 'object' ? saved.assignments : {};
        state.explanation.changeType = saved.changeType;
        state.explanation.revisions = Array.isArray(saved.revisions) ? saved.revisions : [];
        state.explanation.visits = Number(saved.visits) || 0;
        state.explanation.step = saved.step;
      }
    }
    if ([1,2,3].indexOf(state.explanation.step)<0) state.explanation.step=1;
    // Observation choices belong to the immutable observation record, not this draft.
    var answers=state.observation && state.observation.record && state.observation.record.answers || {};
    state.explanation.evidence=window.MebiPrediction.items.filter(function(item){return answers[item.key]==='yes';}).map(function(item){return item.key;});
    if (!hasDecision(state.explanation)) {state.explanation.changeType='';state.explanation.step=1;}
    return state.explanation;
  }
  // Persist only text, line breaks, subscript and superscript. Pasted HTML never executes.
  function cleanHTML(value) {
    if (!value) return '';
    var source = document.createElement('template'); source.innerHTML = String(value);
    function walk(node) {
      if (node.nodeType === 3) return esc(node.textContent);
      if (node.nodeType !== 1 && node.nodeType !== 11) return '';
      var tag = node.nodeName.toLowerCase();
      if (/^(script|style|iframe|object|svg|math|img)$/.test(tag)) return '';
      if (tag === 'br') return '<br>';
      var inner = Array.from(node.childNodes).reduce(function(html,child){
        var block=child.nodeType===1 && /^(div|p)$/i.test(child.nodeName);
        return html+(block && html && !/<br>$/.test(html)?'<br>':'')+walk(child);
      },'');
      return /^(sub|sup)$/.test(tag) ? '<'+tag+'>'+inner+'</'+tag+'>' : inner + (/^(div|p)$/.test(tag) && !/<br>$/.test(inner) ? '<br>' : '');
    }
    return walk(source.content);
  }
  function plain(html) { var box=document.createElement('div');box.innerHTML=cleanHTML(html);return (box.textContent || '').trim(); }
  function persist(state) {
    var draft = get(state);
    try { var data=entries(); data[draft.observationId]={observationId:draft.observationId,html:cleanHTML(draft.html),assignments:draft.assignments,evidence:draft.evidence,changeType:draft.changeType,revisions:draft.revisions,visits:draft.visits,step:draft.step};window.localStorage.setItem(KEY,JSON.stringify(data));draft.storageError=false; }
    catch(e) { draft.storageError=true; }
  }
  function model(state) { return window.MebiExplanationModel ? window.MebiExplanationModel.build(state) : null; }
  function rolesComplete(state,data) {
    var draft=get(state);data=data||model(state);
    return !!data && data.species.every(function(p){return roles.some(function(r){return r[0]===draft.assignments[p.kind];});});
  }
  function availableStep(state,data) { return !hasDecision(get(state)) ? 1 : rolesComplete(state,data) ? 3 : 2; }
  function setStep(state,value) {
    var step=Number(value),draft=get(state);
    if (!eligible(state) || [1,2,3].indexOf(step)<0) return false;
    if (step>1 && !hasDecision(draft)) {draft.error=true;draft.message='Devam etmek için ilk yorumunu seç. Emin değilsen “Henüz karar veremedim” ile ilerleyebilirsin.';}
    else if (step===3 && !rolesComplete(state)) {draft.error=true;draft.message='Açıklama kartına geçmeden önce her taneciğin rolünü belirle. Fikrini sonra değiştirebilirsin.';}
    else {draft.step=step;draft.message='';draft.error=false;persist(state);return true;}
    status(state);
    if (!hasDecision(draft)) {var first=document.querySelector('[data-explanation-change]');if(first)first.focus();}
    return false;
  }
  function autoFillForTesting(state) {
    if (!TEST_TOOLS_ENABLED || !eligible(state)) return false;
    var draft=get(state),data=model(state),record=state.observation.record;
    if (draft.step===1) {
      if (!data) return false;
      draft.changeType=data.model.products.length?'chemical':'physical';
    } else if (draft.step===2 && data) {
      data.species.forEach(function(p){draft.assignments[p.kind]=p.role;});
    } else if (draft.step===3 && data) {
      function names(role) { return data.species.filter(function(p){return p.role===role;}).map(function(p){return p.label;}).join(', '); }
      var products=data.species.filter(function(p){return ['solid','gas','water','other'].indexOf(p.role)>=0;}).map(function(p){return p.label+' ('+({solid:'katı ürün',gas:'gaz',water:'oluşan su',other:'diğer ürün'}[p.role])+')';}).join(', ');
      var text=products ? names('reactant')+' tanecikleri yeniden düzenlenerek '+products+' oluşturur. ' : 'Bu modelde yeni kimyasal ürün oluşumu gösterilmiyor. ';
      if (names('spectator')) text+=names('spectator')+' iyonları net tepkimeye katılmadan çözeltide kalır. ';
      if (names('catalyst')) text+=names('catalyst')+' katalizör olarak görev yapar; net miktarı korunur. ';
      if (names('unchanged')) text+=names('unchanged')+' değişmeden kalan diğer taneciklerdir. ';
      text+='Gözlem kaydımla ilişkim: '+record.note+' Modelde atom türleri ve toplam yük korunur.';
      draft.html=esc(text);
    } else return false;
    get(state);draft.error=false;draft.message='Bu kartın test içeriği dolduruldu; inceleyip düzenleyebilirsin.';persist(state);return true;
  }
  function status(state) {
    var draft=get(state), el=document.getElementById('explanationStatus');
    if (el) {
      el.setAttribute('role',draft.error?'alert':'status');
      el.setAttribute('aria-live',draft.error?'assertive':'polite');
      el.textContent=draft.storageError ? 'Bu oturumda korunuyor; tarayıcıya kaydedilemedi.' : draft.message || (draft.revisions.length ? draft.revisions.length + ' açıklama kaydı · Taslağın otomatik saklanır.' : 'Taslağın bu tarayıcıda otomatik saklanır.');
    }
    var feedback=document.getElementById('explanationFeedback');if(feedback)feedback.classList.toggle('is-error',!!draft.error);
    var group=document.getElementById('explanationDecisionGroup');if(group){var invalid=!!draft.error&&!hasDecision(draft);group.classList.toggle('is-invalid',invalid);group.setAttribute('aria-invalid',String(invalid));}
  }
  function save(state) {
    if (!eligible(state)) return false;
    var draft=get(state), data=model(state);draft.error=true;
    if (!hasDecision(draft)) draft.message='Değişime ilişkin ilk yorumunu seç. Emin değilsen “Henüz karar veremedim” seçeneğini kullanabilirsin.';
    else if (!data || data.species.some(function(p){return !roles.some(function(r){return r[0]===draft.assignments[p.kind];});})) draft.message='Her taneciğin rolünü belirle. Kararsız kaldıklarını 3B beherlerde inceleyebilirsin.';
    else if (!plain(draft.html)) draft.message='Taneciklerin değişimini ve gözleminle ilişkisini kendi cümlelerinle açıkla.';
    else {
      var record={html:cleanHTML(draft.html),assignments:JSON.parse(JSON.stringify(draft.assignments)),evidence:draft.evidence.slice(),changeType:draft.changeType,createdAt:new Date().toISOString(),visits:draft.visits};
      var last=draft.revisions[draft.revisions.length-1];
      if (!last || last.html!==record.html || last.changeType!==record.changeType || JSON.stringify(last.assignments)!==JSON.stringify(record.assignments) || JSON.stringify(last.evidence)!==JSON.stringify(record.evidence)) draft.revisions.push(record);
      draft.error=false;draft.message='Açıklaman kaydedildi. 3B modeli inceleyip açıklamanı geliştirebilirsin.';persist(state);status(state);return true;
    }
    status(state);return false;
  }
  function assign(state,kind,value) {
    var data=model(state);if (!eligible(state) || !data || !data.species.some(function(p){return p.kind===kind;}) || (value && !roles.some(function(r){return r[0]===value;}))) return false;
    var draft=get(state);draft.assignments[kind]=value;draft.message='';draft.error=false;persist(state);return true;
  }
  function decide(state,value) {
    if (!eligible(state) || !changeTypes.some(function(item){return item[0]===value;})) return;
    var draft=get(state);draft.changeType=value;
    draft.message='';draft.error=false;persist(state);
  }
  function check(state) {
    var data=model(state),draft=get(state);if (!eligible(state) || !data)return;
    var missing=data.species.filter(function(p){return !draft.assignments[p.kind];});
    var different=data.species.filter(function(p){return draft.assignments[p.kind] && draft.assignments[p.kind]!==p.role;});
    draft.message=missing.length ? 'Henüz rol vermediğin '+missing.length+' tanecik var. Başlangıç ve sonuç görünümünü karşılaştır.' : different.length ?
      different.map(function(p){return p.label;}).join(', ')+' için seçtiğin rolleri yeniden incele. Ürün oluşumunu, net değişimi ve çözeltide kalanları karşılaştır.' :
      'Tanecik rollerin bu öğretim modeliyle uyumlu. Şimdi hangi taneciklerden hangi ürünlerin oluştuğunu ve bunun gözlemini nasıl açıkladığını yaz.';
    status(state);
  }
  function badge(p) { return '<span class="explanation-particle-badge">'+window.MebiExplanationModel.thumbnail(p.kind)+'<strong>'+esc(p.label)+'</strong></span>'; }
  function mapHTML(state,data) {
    var draft=get(state);
    function group(values,empty) {var list=data.species.filter(function(p){return values.indexOf(draft.assignments[p.kind])>=0;});return list.length ? list.map(badge).join('') : '<span class="explanation-map-empty">'+empty+'</span>';}
    return '<small>Türler arasındaki ilişki şeması · Tanecik sayıları gösterilmez.</small><div class="explanation-map-path"><div><small>Tepkimeye katılanlar</small><div>'+group(['reactant'],'Tanecik rollerini seç')+'</div></div><span class="explanation-map-arrow" aria-label="oluşturur">→</span><div><small>Oluştuğunu düşündüğüm ürünler</small><div>'+group(['solid','gas','water','other'],'Ürünleri ilişkilendir')+'</div></div></div><div class="explanation-map-remain"><small>Seyirci iyonlar</small><div>'+group(['spectator'],'Seyirci iyon varsa burada göster')+'</div></div>'+
      (data.species.some(function(p){return ['catalyst','unchanged'].indexOf(draft.assignments[p.kind])>=0;}) ? '<div class="explanation-map-remain"><small>Katalizör / diğer değişmeden kalanlar</small><div>'+group(['catalyst','unchanged'],'')+'</div></div>' : '');
  }
  function testButton() {
    return TEST_TOOLS_ENABLED ? '<button type="button" class="explanation-test-button" data-explanation-test data-action="autoFillExplanationForTesting" title="Geçici test aracı: yalnızca bu kartı doldurur">'+window.MebiSVG.icon('flaskOutline')+'<span>Test İçin Doldur</span></button>' : '';
  }
  function stepHeading(step,description,action) {
    return '<div class="explanation-step-heading"><div><span class="explanation-step-kicker">'+step+' / 3 · AÇIKLAMAMI GELİŞTİRİYORUM</span><h2 id="explanationStepTitle" tabindex="-1">'+steps[step-1]+'</h2><p>'+description+'</p></div><div class="explanation-step-tools">'+(action||'')+testButton()+'</div></div>';
  }
  function predictionDialogHTML(record) {
    return '<button type="button" class="explanation-prediction-trigger" aria-haspopup="dialog" aria-controls="explanationPredictionDialog">'+window.MebiSVG.icon('helpCircle')+'İlk tahminim ve gerekçelerim</button><dialog id="explanationPredictionDialog" class="explanation-prediction-dialog" aria-labelledby="explanationPredictionTitle"><header><div class="explanation-prediction-heading"><span class="explanation-prediction-emblem" aria-hidden="true">'+window.MebiSVG.icon('helpCircle')+'</span><div><span class="explanation-prediction-eyebrow">İLK DÜŞÜNCELERİM</span><h2 id="explanationPredictionTitle">Tahminim ve gerekçelerim</h2></div></div><form method="dialog"><button type="submit" aria-label="Tahmin penceresini kapat" autofocus>×</button></form></header><div class="explanation-prediction-body">'+window.MebiPrediction.items.map(function(item){var answer=record.prediction.answers[item.key];return '<article class="explanation-prediction-item is-'+item.key+'"><div class="explanation-prediction-item-heading"><span class="explanation-prediction-item-icon" aria-hidden="true">'+window.MebiSVG.icon(item.icon)+'</span><strong>'+esc(item.label)+'</strong><span class="explanation-prediction-answer is-'+answer.choice+'">'+({yes:'Evet',no:'Hayır',unsure:'Kararsızım'}[answer.choice])+'</span></div><p>'+esc(answer.reason)+'</p></article>';}).join('')+'</div></dialog>';
  }
  function evidenceHTML(state) {
    var draft=get(state),record=state.observation.record;
    var decision='<fieldset class="explanation-decision" id="explanationDecisionGroup" aria-describedby="explanationStatus"><legend>Bu değişim kimyasal mı, fiziksel mi?</legend><div class="explanation-change-options">'+changeTypes.map(function(item){return '<label class="explanation-change-option"><input type="radio" name="explanationChangeType" data-explanation-change value="'+item[0]+'"'+(draft.changeType===item[0]?' checked':'')+'><span><strong>'+item[1]+'</strong><small>'+item[2]+'</small></span></label>';}).join('')+'</div></fieldset>';
    return '<section class="explanation-evidence">'+stepHeading(1,'Kaydettiğin gözlemlere göre değişimi yorumla. Tanecikleri inceledikten sonra fikrini değiştirebilirsin.',
      '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="reviewExplanationExperiment">'+window.MebiSVG.icon('eye')+'Deneyi Tekrar Gözle</button>')+
      '<div class="explanation-evidence-layout"><div><p class="explanation-record-label">Önceki gözlem seçimlerim</p><div class="explanation-evidence-list explanation-record-list" id="explanationEvidenceGroup" role="group" aria-label="Önceki aşamada kaydettiğim gözlemler">'+window.MebiPrediction.items.map(function(item){var icon=item.key==='tempRise'?'↑':item.key==='tempFall'?'↓':window.MebiSVG.icon(item.icon),answer=record.answers[item.key];return '<label class="explanation-evidence-chip is-'+item.key+'"><span class="explanation-evidence-symbol" aria-hidden="true">'+icon+'</span><span><strong>'+esc(item.label)+'</strong><small>'+({yes:'Gözledim',no:'Gözlemedim',unsure:'Emin değilim'}[answer])+'</small></span><input type="checkbox" data-explanation-observation="'+item.key+'"'+(answer==='yes'?' checked':'')+' disabled></label>';}).join('')+'</div>'+predictionDialogHTML(record)+'</div><div class="explanation-evidence-reference">'+decision+'<div class="explanation-observation"><strong>Kaydettiğim gözlem</strong><blockquote>'+esc(record.note)+'</blockquote><small>'+record.temperature.initial.toLocaleString('tr-TR')+' °C → '+record.temperature.final.toLocaleString('tr-TR')+' °C</small></div></div></div></section>';
  }
  function particlesHTML(state,data) {
    var draft=get(state);
    return '<section class="explanation-work">'+stepHeading(2,'Hangi tanecikler tepkimeye katıldı, neler oluştu, hangileri değişmeden kaldı?',
      '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="openParticleInspection" data-arg="reaction">'+window.MebiSVG.icon('eye')+'3B Beherleri İncele</button>')+
      (data ? '<div class="explanation-species">'+data.species.map(function(p){return '<label class="explanation-species-card">'+badge(p)+'<select data-explanation-species="'+esc(p.kind)+'" aria-label="'+esc(p.label)+' rolü"><option value="">Rolünü seç…</option>'+roles.map(function(r){return '<option value="'+r[0]+'"'+(draft.assignments[p.kind]===r[0]?' selected':'')+'>'+r[1]+'</option>';}).join('')+'</select></label>';}).join('')+'</div><div class="explanation-model-caption"><span>Benim tanecik ilişkim</span><button type="button" data-action="checkExplanation" class="mebi-btn mebi-btn-secondary mebi-btn-sm">Rollerimi Gözden Geçir</button></div><div class="explanation-map" id="explanationMap">'+mapHTML(state,data)+'</div>' : '<p role="status">Tanecik modeli hazırlanıyor…</p>')+
      '<details class="explanation-help"><summary>Rolleri ayırt ederken nelere bakmalıyım?</summary><p>Katı tepkeni başlangıçta serbest iyon gibi gösterme. Çözeltide kalan her tanecik seyirci değildir; artan tepken ve katalizörü ayırt et. Oluşan suyu çözücü sudan, katı iyonik örgüyü molekülün bağ yapısından ayır. Yeni ürün oluşmadığını düşünüyorsan bunu gerekçelendir.</p></details></section>';
  }
  function formatIcon(kind) {
    if(kind==='normal')return '<svg viewBox="0 0 24 24" aria-hidden="true"><text x="3" y="16" fill="currentColor" font-family="inherit" font-size="13" font-weight="550">Aa</text><path d="M4 20h16" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
    if(kind==='correct')return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 19 11-11 3 3L7 22zM14 9l3 3M6 3v5M3.5 5.5h5M19 2v4M17 4h4m-5 13 2 2 4-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 7 9 11M13 7 4 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><text x="16" y="'+(kind==='subscript'?'22':'9')+'" fill="currentColor" font-size="9" font-family="inherit" font-weight="550">2</text></svg>';
  }
  function writingHTML(state) {
    var draft=get(state);
    return '<section class="explanation-writing">'+stepHeading(3,'Kaydettiğin gözlemlerle tanecik ilişkilerini birleştir; açıklamanı kendi cümlelerinle yaz.')+
      '<details class="explanation-help"><summary>Açıklamamı nasıl kurabilirim?</summary><p>“... tanecikleri ... oluşturacak şekilde yeniden düzenlendi. ... iyonları net tepkimeye katılmadan çözeltide kaldı. Bu, gözlediğim ... bulgusunu açıklar.”</p></details>'+
      '<div id="explanationEditor" class="explanation-editor" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="explanationStepTitle" aria-describedby="explanationEditorHelp" data-placeholder="Tanecik modeline göre…" spellcheck="false">'+cleanHTML(draft.html)+'</div>'+
      '<div class="explanation-writing-tools" role="group" aria-label="Kimyasal yazım araçları"><div class="explanation-format-buttons">'+[['subscript','Alt simge','Ctrl+='],['superscript','Üst simge','Ctrl+Shift+='],['normal','Normal yazı','Ctrl+Boşluk']].map(function(item){return '<button type="button" data-explanation-format="'+item[0]+'" aria-label="'+item[1]+'" aria-pressed="'+(item[0]==='normal')+'" title="'+item[1]+' ('+item[2]+')">'+formatIcon(item[0])+'</button>';}).join('')+'<span class="explanation-tool-divider" aria-hidden="true"></span><button type="button" data-explanation-correct aria-label="Kimyasal Yazımı Düzelt" title="Tanınan formülleri, alt simgeleri ve iyon yüklerini düzenle">'+formatIcon('correct')+'</button></div><span id="explanationFormatState">Normal yazı</span><span class="explanation-format-hint" id="explanationEditorHelp">Seçili metni biçimlendir veya simgeyi açıp yazmaya devam et.</span></div>'+
      (draft.revisions.length ? '<details class="explanation-history"><summary>Önceki açıklamalarım ('+draft.revisions.length+')</summary>'+draft.revisions.map(function(r,i){return '<article><strong>'+ (i+1)+'. açıklamam</strong><div>'+cleanHTML(r.html)+'</div></article>';}).join('')+'</details>' : '')+
      '<p class="explanation-scale-note">Tanecik çizimleri şematiktir; sayı, boyut ve süreler temsilidir. Model, gözlemini açıklamak için bir araçtır.</p></section>';
  }
  function render(state) {
    var draft=get(state),data=model(state),available=availableStep(state,data),step=draft.step;
    var pair=[state.selectedSlot1,state.selectedSlot2].map(function(id){return esc(window.MebiData.getReagent(id).f);}).join(' <span>+</span> ');
    return '<section class="prediction-card explanation-card" id="explanationCard" aria-labelledby="explanationTitle"><header class="explanation-header"><div class="explanation-heading-row"><span class="explanation-eyebrow">4. AÇIKLA</span><span class="explanation-context">Gözlemden taneciklere</span><h1 id="explanationTitle">Tepkimede ne değişti?</h1><strong class="explanation-pair" aria-label="Olası tepkime">'+pair+'<span class="explanation-pair-arrow">→</span><span class="explanation-pair-question">?</span></strong></div><p>Olası tepkimeyi iyon ve atomların yeniden düzenlenmesiyle açıklayınız.</p></header>'+
      '<nav class="explanation-steps" aria-label="Açıklama kartları">'+steps.map(function(label,index){var number=index+1;return '<button type="button" class="explanation-step-link'+(number===step?' is-active':'')+'" data-action="setExplanationStep" data-arg="'+number+'"'+(number>available?' disabled':'')+(number===step?' aria-current="true"':'')+'><span class="explanation-step-number">'+(number<step?window.MebiSVG.icon('check'):number)+'</span><span>'+label+'</span></button>';}).join('')+'</nav>'+
      '<div class="prediction-content explanation-content" data-explanation-step="'+step+'">'+(step===1?evidenceHTML(state):step===2?particlesHTML(state,data):writingHTML(state))+'</div>'+
      '<footer class="prediction-footer explanation-footer"><div id="explanationFeedback" class="explanation-feedback"><span class="explanation-error-icon" aria-hidden="true">!</span><p id="explanationStatus" role="status" aria-live="polite"></p></div><div class="prediction-actions">'+(step===1?'<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="backToObservation">Karşılaştırmaya Dön</button>':'<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="setExplanationStep" data-arg="'+(step-1)+'">← Önceki Kart</button>')+
      (step<3?'<button type="button" class="mebi-btn mebi-btn-primary mebi-btn-sm" data-action="setExplanationStep" data-arg="'+(step+1)+'">'+(step===1?'Tanecikleri İlişkilendir':'Açıklamamı Yaz')+' →</button>':'<button type="button" class="mebi-btn mebi-btn-primary mebi-btn-sm" data-action="saveExplanation">'+(draft.revisions.length?'Geliştirdiğim Açıklamayı Kaydet':'Açıklamamı Kaydet')+'</button>')+'</div></footer></section>';
  }
  var cleanupSelection=null;
  function wire(state) {
    if(cleanupSelection){cleanupSelection();cleanupSelection=null;}
    if(!document.getElementById('explanationCard'))return;
    document.querySelectorAll('[data-explanation-species]').forEach(function(select){select.addEventListener('change',function(){if(assign(state,select.dataset.explanationSpecies,select.value)){document.getElementById('explanationMap').innerHTML=mapHTML(state,model(state));syncSteps();status(state);}});});
    document.querySelectorAll('[data-explanation-observation]').forEach(function(input){input.indeterminate=state.observation.record.answers[input.dataset.explanationObservation]==='unsure';});
    document.querySelectorAll('[data-explanation-change]').forEach(function(input){input.addEventListener('change',function(){if(input.checked){decide(state,input.value);syncSteps();status(state);}});});
    function syncSteps(){var available=availableStep(state);document.querySelectorAll('.explanation-step-link').forEach(function(button){button.disabled=Number(button.dataset.arg)>available;});}
    var predictionTrigger=document.querySelector('.explanation-prediction-trigger'),predictionDialog=document.getElementById('explanationPredictionDialog');
    if(predictionTrigger&&predictionDialog){predictionTrigger.addEventListener('click',function(){predictionDialog.showModal();});predictionDialog.addEventListener('click',function(event){var r=predictionDialog.getBoundingClientRect();if(event.target===predictionDialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))predictionDialog.close();});}
    var editor=document.getElementById('explanationEditor');
    if(editor){
      var draft=get(state),range=null;
      function inside(selection){return selection.rangeCount && editor.contains(selection.anchorNode) && editor.contains(selection.focusNode);}
      function paintFormat(){
        var selection=window.getSelection();if(!inside(selection))return;
        var sub=document.queryCommandState('subscript'),sup=document.queryCommandState('superscript');
        document.querySelectorAll('[data-explanation-format]').forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.explanationFormat==='subscript'?sub:button.dataset.explanationFormat==='superscript'?sup:!sub&&!sup));});
        var label=document.getElementById('explanationFormatState');if(label)label.textContent=sub?'Alt simge açık':sup?'Üst simge açık':'Normal yazı';
      }
      function remember(){var selection=window.getSelection();if(inside(selection)){range=selection.getRangeAt(0).cloneRange();paintFormat();}}
      function update(){draft.html=cleanHTML(editor.innerHTML);draft.message='';draft.error=false;persist(state);status(state);remember();}
      function restore(){
        editor.focus({preventScroll:true});var selection=window.getSelection();
        if(!range || !editor.contains(range.commonAncestorContainer)){range=document.createRange();range.selectNodeContents(editor);range.collapse(false);}
        selection.removeAllRanges();selection.addRange(range);
      }
      function format(command){
        restore();
        if(command==='normal'){
          if(!window.getSelection().isCollapsed)document.execCommand('removeFormat',false,null);
          if(document.queryCommandState('subscript'))document.execCommand('subscript',false,null);
          if(document.queryCommandState('superscript'))document.execCommand('superscript',false,null);
        }else document.execCommand(command,false,null);
        update();
      }
      editor.addEventListener('input',update);editor.addEventListener('keyup',remember);editor.addEventListener('mouseup',remember);editor.addEventListener('focusout',remember);
      editor.addEventListener('keydown',function(event){
        if(!(event.ctrlKey||event.metaKey)||event.altKey)return;
        if(event.code==='Equal'||event.key==='='||event.key==='+'){event.preventDefault();remember();format(event.shiftKey?'superscript':'subscript');}
        else if(event.code==='Space'||event.key===' '){event.preventDefault();remember();format('normal');}
      });
      editor.addEventListener('paste',function(event){event.preventDefault();document.execCommand('insertText',false,event.clipboardData.getData('text/plain'));update();});
      editor.addEventListener('drop',function(event){event.preventDefault();});
      document.querySelectorAll('[data-explanation-format]').forEach(function(button){
        button.addEventListener('pointerdown',function(event){remember();event.preventDefault();});
        button.addEventListener('click',function(){format(button.dataset.explanationFormat);});
      });
      var correctButton=document.querySelector('[data-explanation-correct]');
      if(correctButton){
        correctButton.addEventListener('pointerdown',function(event){remember();event.preventDefault();});
        correctButton.addEventListener('click',function(){
          restore();
          var result=window.MebiChemicalWriting.fixHTML(cleanHTML(editor.innerHTML),window.MebiExplanationModel.notationAliases()),scroll=editor.scrollTop;
          if(result.count){var selection=window.getSelection(),all=document.createRange();all.selectNodeContents(editor);selection.removeAllRanges();selection.addRange(all);document.execCommand('insertHTML',false,result.html);update();editor.scrollTop=scroll;}
          draft.error=false;draft.message=result.count?result.count+' kimyasal gösterim düzenlendi. Ctrl+Z ile geri alabilirsin.':'Tanınan formül ve yük gösterimlerinde değişiklik gerekmiyor.';status(state);
        });
      }
      document.addEventListener('selectionchange',remember);
      cleanupSelection=function(){document.removeEventListener('selectionchange',remember);};
    }
    status(state);
  }
  window.MebiExplanation={eligible:eligible,get:get,render:render,wire:wire,save:save,check:check,persist:persist,cleanHTML:cleanHTML,setStep:setStep,autoFillForTesting:autoFillForTesting};
})(window);
