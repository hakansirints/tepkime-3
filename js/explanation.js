/* Observe and explain here; particle roles belong to the separate Model stage. */
(function(window) {
  'use strict';
  var KEY = 'tepkime_arenasi_explanations_v1';
  // Temporary QA control for the combined explanation card.
  var TEST_TOOLS_ENABLED = true;
  var writingPrompt='“... gözledim. Bunun, taneciklerin ... değişimiyle ilişkili olduğunu düşünüyorum; çünkü ... .” Gözlemini ve bu gözlemin nedenine ilişkin düşünceni birlikte yaz.';
  var changeTypes = [['chemical','Kimyasal değişim','Yeni madde oluştuğunu düşünüyorum.'],['physical','Fiziksel değişim','Yeni madde oluşmadığını düşünüyorum.'],['unsure','Henüz karar veremedim','Tanecikleri inceleyerek kararımı geliştireceğim.']];
  function hasDecision(draft) { return changeTypes.some(function(item){return item[0]===draft.changeType;}); }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function eligible(state) { return !!(state.predictionRecord && state.observation && state.observation.record && state.poured && state.labStep === 'observed'); }
  function entries() { var data = JSON.parse(window.localStorage.getItem(KEY) || '{}'); return data && typeof data === 'object' && !Array.isArray(data) ? data : {}; }
  function get(state) {
    var id = state.observation && state.observation.record && state.observation.record.id;
    if (!state.explanation || state.explanation.observationId !== id) {
      var saved; try { saved = entries()[id]; } catch(e) {}
      state.explanation = {observationId:id, layoutVersion:3, html:'', legacyAssignments:{}, evidence:[], changeType:'', revisions:[], visits:0, step:1, message:'', storageError:false};
      if (saved && saved.observationId === id) {
        state.explanation.html = typeof saved.html === 'string' ? saved.html : '';
        state.explanation.legacyAssignments = saved.legacyAssignments || saved.assignments || {};
        state.explanation.changeType = saved.changeType;
        state.explanation.revisions = Array.isArray(saved.revisions) ? saved.revisions : [];
        state.explanation.visits = Number(saved.visits) || 0;
        state.explanation.step = saved.layoutVersion>=2 ? saved.step : saved.step===1 ? 1 : 2;
      }
    }
    if(state.explanation.layoutVersion!==3){state.explanation.legacyAssignments=state.explanation.assignments||state.explanation.legacyAssignments||{};delete state.explanation.assignments;state.explanation.step=state.explanation.step===1?1:2;state.explanation.layoutVersion=3;}
    if ([1,2].indexOf(state.explanation.step)<0) state.explanation.step=1;
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
    try { var data=entries(); data[draft.observationId]={observationId:draft.observationId,layoutVersion:3,html:cleanHTML(draft.html),legacyAssignments:draft.legacyAssignments,evidence:draft.evidence,changeType:draft.changeType,revisions:draft.revisions,visits:draft.visits,step:draft.step};window.localStorage.setItem(KEY,JSON.stringify(data));draft.storageError=false; }
    catch(e) { draft.storageError=true; }
  }
  function model(state) { return window.MebiExplanationModel ? window.MebiExplanationModel.build(state) : null; }
  function setStep(state,value) {
    if(!eligible(state)||[1,2].indexOf(Number(value))<0)return false;
    get(state).step=Number(value);persist(state);return true;
  }
  function autoFillForTesting(state) {
    if (!TEST_TOOLS_ENABLED || !eligible(state)) return false;
    var draft=get(state),data=model(state),record=state.observation.record;
    if(!data)return false;
    draft.changeType=data.model.products.length?'chemical':'physical';
    function names(role) { return data.species.filter(function(p){return p.role===role;}).map(function(p){return p.label;}).join(', '); }
    var products=data.species.filter(function(p){return ['solid','gas','water','other'].indexOf(p.role)>=0;}).map(function(p){return p.label+' ('+({solid:'katı ürün',gas:'gaz',water:'oluşan su',other:'diğer ürün'}[p.role])+')';}).join(', ');
    var text=products ? names('reactant')+' tanecikleri yeniden düzenlenerek '+products+' oluşturur. ' : 'Bu modelde yeni kimyasal ürün oluşumu gösterilmiyor. ';
    text+='Gözlem kaydımla ilişkim: '+record.note+' Modelde atom türleri ve toplam yük korunur.';
    draft.html=esc(text);
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
    var draft=get(state);draft.error=true;
    if (!hasDecision(draft)) draft.message='Değişime ilişkin ilk yorumunu seç. Emin değilsen “Henüz karar veremedim” seçeneğini kullanabilirsin.';
    else if (!plain(draft.html)) draft.message='Taneciklerin değişimini ve gözleminle ilişkisini kendi cümlelerinle açıkla.';
    else {
      var record={html:cleanHTML(draft.html),evidence:draft.evidence.slice(),changeType:draft.changeType,createdAt:new Date().toISOString(),visits:draft.visits};
      var last=draft.revisions[draft.revisions.length-1];
      if (!last || last.html!==record.html || last.changeType!==record.changeType || JSON.stringify(last.evidence)!==JSON.stringify(record.evidence)) draft.revisions.push(record);
      draft.error=false;draft.message='Açıklaman kaydedildi. 3B modeli inceleyip açıklamanı geliştirebilirsin.';persist(state);status(state);return true;
    }
    status(state);return false;
  }
  function decide(state,value) {
    if (!eligible(state) || !changeTypes.some(function(item){return item[0]===value;})) return;
    var draft=get(state);draft.changeType=value;
    draft.message='';draft.error=false;persist(state);
  }
  function testButton() {
    return TEST_TOOLS_ENABLED ? '<button type="button" class="explanation-test-button" data-explanation-test data-action="autoFillExplanationForTesting" title="Geçici test aracı: yalnızca bu kartı doldurur">'+window.MebiSVG.icon('flaskOutline')+'<span>Test İçin Doldur</span></button>' : '';
  }
    function changeIconSVG(type) {
    if (type === 'chemical') {
      return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-chemical" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2h6M10 2v6.2L4.8 18a2 2 0 0 0 1.8 3h10.8a2 2 0 0 0 1.8-3L14 8.2V2"/><circle cx="9.5" cy="16" r="1.1" fill="currentColor"/><circle cx="14" cy="14.5" r="1.3" fill="currentColor"/><path d="M17.5 4l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1 1.5-1z" fill="currentColor"/></svg>';
    }
    if (type === 'physical') {
      return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-physical" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><path d="M14 6.5h7m-3.5-3.5 3.5 3.5-3.5 3.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 17.5H3m3.5-3.5L3 17.5l3.5 3.5"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-unsure" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.5a2.8 2.8 0 0 1 5.4.8c0 1.8-2.6 2.2-2.6 3.7"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>';
  }

    function changeIconSVG(type) {
    if (type === 'chemical') {
      return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-chemical" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2h6M10 2v6.2L4.8 18a2 2 0 0 0 1.8 3h10.8a2 2 0 0 0 1.8-3L14 8.2V2"/><circle cx="9.5" cy="16" r="1.1" fill="currentColor"/><circle cx="14" cy="14.5" r="1.3" fill="currentColor"/><path d="M17.5 4l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1 1.5-1z" fill="currentColor"/></svg>';
    }
    if (type === 'physical') {
      return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-physical" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><path d="M14 6.5h7m-3.5-3.5 3.5 3.5-3.5 3.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 17.5H3m3.5-3.5L3 17.5l3.5 3.5"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-unsure" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.5a2.8 2.8 0 0 1 5.4.8c0 1.8-2.6 2.2-2.6 3.7"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>';
  }

    function changeIconSVG(type) {
    if (type === 'chemical') {
      return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-chemical" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2h6M10 2v6.2L4.8 18a2 2 0 0 0 1.8 3h10.8a2 2 0 0 0 1.8-3L14 8.2V2"/><circle cx="9.5" cy="16" r="1.1" fill="currentColor"/><circle cx="14" cy="14.5" r="1.3" fill="currentColor"/><path d="M17.5 4l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1 1.5-1z" fill="currentColor"/></svg>';
    }
    if (type === 'physical') {
      return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-physical" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><path d="M14 6.5h7m-3.5-3.5 3.5 3.5-3.5 3.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 17.5H3m3.5-3.5L3 17.5l3.5 3.5"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-unsure" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.5a2.8 2.8 0 0 1 5.4.8c0 1.8-2.6 2.2-2.6 3.7"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>';
  }

    function changeIconSVG(type) {
    if (type === 'chemical') {
      return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-chemical" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2h6M10 2v6.2L4.8 18a2 2 0 0 0 1.8 3h10.8a2 2 0 0 0 1.8-3L14 8.2V2"/><circle cx="9.5" cy="16" r="1.1" fill="currentColor"/><circle cx="14" cy="14.5" r="1.3" fill="currentColor"/><path d="M17.5 4l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1 1.5-1z" fill="currentColor"/></svg>';
    }
    if (type === 'physical') {
      return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-physical" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><path d="M14 6.5h7m-3.5-3.5 3.5 3.5-3.5 3.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 17.5H3m3.5-3.5L3 17.5l3.5 3.5"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-unsure" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.5a2.8 2.8 0 0 1 5.4.8c0 1.8-2.6 2.2-2.6 3.7"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>';
  }

    function changeIconSVG(type) {
    if (type === 'chemical') {
      return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-chemical" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2h6M10 2v6.2L4.8 18a2 2 0 0 0 1.8 3h10.8a2 2 0 0 0 1.8-3L14 8.2V2"/><circle cx="9.5" cy="16" r="1.1" fill="currentColor"/><circle cx="14" cy="14.5" r="1.3" fill="currentColor"/><path d="M17.5 4l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1 1.5-1z" fill="currentColor"/></svg>';
    }
    if (type === 'physical') {
      return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-physical" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><path d="M14 6.5h7m-3.5-3.5 3.5 3.5-3.5 3.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 17.5H3m3.5-3.5L3 17.5l3.5 3.5"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-unsure" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.5a2.8 2.8 0 0 1 5.4.8c0 1.8-2.6 2.2-2.6 3.7"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>';
  }

    function changeIconSVG(type) {
    if (type === 'chemical') {
      return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-chemical" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2h6M10 2v6.2L4.8 18a2 2 0 0 0 1.8 3h10.8a2 2 0 0 0 1.8-3L14 8.2V2"/><circle cx="9.5" cy="16" r="1.1" fill="currentColor"/><circle cx="14" cy="14.5" r="1.3" fill="currentColor"/><path d="M17.5 4l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1 1.5-1z" fill="currentColor"/></svg>';
    }
    if (type === 'physical') {
      return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-physical" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><path d="M14 6.5h7m-3.5-3.5 3.5 3.5-3.5 3.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 17.5H3m3.5-3.5L3 17.5l3.5 3.5"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-unsure" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.5a2.8 2.8 0 0 1 5.4.8c0 1.8-2.6 2.2-2.6 3.7"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>';
  }

    function changeIconSVG(type) {
    if (type === 'chemical') {
      return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-chemical" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2h6M10 2v6.2L4.8 18a2 2 0 0 0 1.8 3h10.8a2 2 0 0 0 1.8-3L14 8.2V2"/><circle cx="9.5" cy="16" r="1.1" fill="currentColor"/><circle cx="14" cy="14.5" r="1.3" fill="currentColor"/><path d="M17.5 4l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1 1.5-1z" fill="currentColor"/></svg>';
    }
    if (type === 'physical') {
      return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-physical" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><path d="M14 6.5h7m-3.5-3.5 3.5 3.5-3.5 3.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 17.5H3m3.5-3.5L3 17.5l3.5 3.5"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-unsure" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.5a2.8 2.8 0 0 1 5.4.8c0 1.8-2.6 2.2-2.6 3.7"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>';
  }

    function changeIconSVG(type) {
    if (type === 'chemical') {
      return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-chemical" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2h6M10 2v6.2L4.8 18a2 2 0 0 0 1.8 3h10.8a2 2 0 0 0 1.8-3L14 8.2V2"/><circle cx="9.5" cy="16" r="1.1" fill="currentColor"/><circle cx="14" cy="14.5" r="1.3" fill="currentColor"/><path d="M17.5 4l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1 1.5-1z" fill="currentColor"/></svg>';
    }
    if (type === 'physical') {
      return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-physical" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><path d="M14 6.5h7m-3.5-3.5 3.5 3.5-3.5 3.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 17.5H3m3.5-3.5L3 17.5l3.5 3.5"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" class="change-type-icon change-type-unsure" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.5a2.8 2.8 0 0 1 5.4.8c0 1.8-2.6 2.2-2.6 3.7"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>';
  }

  function predictionDialogHTML(record) {
    var obsLabels = { yes:'Gözledim', no:'Gözlemedim', unsure:'Emin Değilim' };
    var predLabels = { yes:'Evet', no:'Hayır', unsure:'Kararsızım' };
    var tempInit = Number(record.temperature && record.temperature.initial).toLocaleString('tr-TR', { minimumFractionDigits:1, maximumFractionDigits:1 });
    var tempFinal = Number(record.temperature && record.temperature.final).toLocaleString('tr-TR', { minimumFractionDigits:1, maximumFractionDigits:1 });
    var delta = (Number(record.temperature && record.temperature.final) - Number(record.temperature && record.temperature.initial)).toLocaleString('tr-TR', { minimumFractionDigits:1, maximumFractionDigits:1 });

    return '<button type="button" class="explanation-prediction-trigger" aria-haspopup="dialog" aria-controls="explanationPredictionDialog">' +
      window.MebiSVG.icon('helpCircle') + 'İlk tahminim ve gerekçelerim</button>' +
      '<dialog id="explanationPredictionDialog" class="explanation-prediction-dialog" aria-labelledby="explanationPredictionTitle">' +
        '<header>' +
          '<div class="explanation-prediction-heading">' +
            '<span class="explanation-prediction-emblem" aria-hidden="true">' + window.MebiSVG.icon('helpCircle') + '</span>' +
            '<div>' +
              '<span class="explanation-prediction-eyebrow">İLK DÜŞÜNCELERİM VE GÖZLEMLERİM</span>' +
              '<h2 id="explanationPredictionTitle">Tahmin, Gerekçe ve Gözlem Kaydı</h2>' +
            '</div>' +
          '</div>' +
          '<form method="dialog"><button type="submit" aria-label="Tahmin penceresini kapat" autofocus>×</button></form>' +
        '</header>' +
        '<div class="explanation-prediction-body">' +
          '<section class="explanation-dialog-section explanation-section-predictions">' +
            '<h3 class="explanation-dialog-subtitle">1. Bölüm: Tahmin ve Gerekçeler</h3>' +
            '<div class="explanation-prediction-grid">' +
              window.MebiPrediction.items.map(function(item) {
                var answer = record.prediction.answers[item.key];
                return '<article class="explanation-prediction-item is-' + item.key + '">' +
                  '<div class="explanation-prediction-item-heading">' +
                    '<span class="explanation-prediction-item-icon" aria-hidden="true">' + window.MebiSVG.icon(item.icon) + '</span>' +
                    '<strong>' + esc(item.label) + '</strong>' +
                    '<span class="explanation-prediction-answer is-' + answer.choice + '">' + (predLabels[answer.choice] || 'Kararsızım') + '</span>' +
                  '</div>' +
                  '<p class="explanation-prediction-reason">' + esc(answer.reason) + '</p>' +
                '</article>';
              }).join('') +
            '</div>' +
          '</section>' +
          '<section class="explanation-dialog-section explanation-section-observations">' +
            '<h3 class="explanation-dialog-subtitle">2. Bölüm: Kaydettiğim Gözlemlerim</h3>' +
            '<div class="explanation-observation-grid">' +
              window.MebiPrediction.items.map(function(item) {
                var answer = record.answers[item.key];
                return '<article class="explanation-prediction-item is-' + item.key + '">' +
                  '<div class="explanation-prediction-item-heading">' +
                    '<span class="explanation-prediction-item-icon" aria-hidden="true">' + window.MebiSVG.icon(item.icon) + '</span>' +
                    '<strong>' + esc(item.label) + '</strong>' +
                    '<span class="explanation-prediction-answer is-' + answer + '">' + (obsLabels[answer] || 'Emin Değilim') + '</span>' +
                  '</div>' +
                '</article>';
              }).join('') +
            '</div>' +
            '<div class="explanation-dialog-note">' +
              '<div class="explanation-dialog-temp"><span>İlk Sıcaklık: <strong>' + tempInit + ' °C</strong></span><span>Son Sıcaklık: <strong>' + tempFinal + ' °C</strong></span><span>ΔT: <strong>' + delta + ' °C</strong></span></div>' +
              '<strong>Gözlem Notum:</strong>' +
              '<blockquote>' + esc(record.note) + '</blockquote>' +
            '</div>' +
          '</section>' +
        '</div>' +
      '</dialog>';
  }

  function evidenceHTML(state) {
    var draft=get(state),record=state.observation.record;
    var decision='<fieldset class="explanation-decision is-horizontal" id="explanationDecisionGroup" aria-describedby="explanationStatus">' +
      '<legend><span class="explanation-legend-icon" aria-hidden="true">' + window.MebiSVG.icon('atom') + '</span>Bu değişim kimyasal mı, fiziksel mi?</legend>' +
      '<div class="explanation-change-options is-horizontal">' + changeTypes.map(function(item){
        var isChecked = draft.changeType === item[0];
        return '<label class="explanation-change-option is-horizontal' + (isChecked ? ' is-selected' : '') + '">' +
          '<input type="radio" name="explanationChangeType" data-explanation-change value="'+item[0]+'"'+(isChecked ? ' checked' : '')+'>' +
          '<span class="explanation-change-icon-badge is-' + item[0] + '" aria-hidden="true">' + changeIconSVG(item[0]) + '</span>' +
          '<span class="explanation-change-content"><strong>'+item[1]+'</strong><small>'+item[2]+'</small></span>' +
        '</label>';
      }).join('') + '</div></fieldset>';

    return '<section class="explanation-evidence">' +
      '<div class="explanation-evidence-heading">' +
        '<button type="button" class="explanation-replay-link" data-action="reviewExplanationExperiment">' + window.MebiSVG.icon('eye') + '<span>Deneyi Tekrar Gözle</span></button>' +
        predictionDialogHTML(record) +
      '</div>' +
      '<div class="explanation-interpretation-grid is-horizontal">' + decision + '</div>' +
    '</section>';
  }
  function formatIcon(kind) {
    if(kind==='normal')return '<svg viewBox="0 0 24 24" aria-hidden="true"><text x="3" y="16" fill="currentColor" font-family="inherit" font-size="13" font-weight="550">Aa</text><path d="M4 20h16" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 7 9 11M13 7 4 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><text x="16" y="'+(kind==='subscript'?'22':'9')+'" fill="currentColor" font-size="9" font-family="inherit" font-weight="550">2</text></svg>';
  }
  function writingHTML(state) {
    var draft=get(state);
    return '<section class="explanation-writing" aria-labelledby="explanationWritingTitle"><h2 id="explanationWritingTitle">Açıklamam</h2>'+
      '<div id="explanationEditor" class="explanation-editor" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="explanationTitle" aria-describedby="explanationEditorHelp" data-placeholder="'+esc(writingPrompt)+'" aria-placeholder="'+esc(writingPrompt)+'" data-empty="'+!plain(draft.html)+'" spellcheck="false">'+cleanHTML(draft.html)+'</div>'+
      '<div class="explanation-writing-tools" role="group" aria-label="Kimyasal yazım araçları"><div class="explanation-format-buttons">'+[['subscript','Alt simge','Ctrl+='],['superscript','Üst simge','Ctrl+Shift+='],['normal','Normal yazı','Ctrl+Boşluk']].map(function(item){return '<button type="button" data-explanation-format="'+item[0]+'" aria-label="'+item[1]+'" aria-pressed="'+(item[0]==='normal')+'" title="'+item[1]+' ('+item[2]+')">'+formatIcon(item[0])+'</button>';}).join('')+'</div><span id="explanationFormatState">Normal yazı</span><span class="explanation-format-hint" id="explanationEditorHelp">Seçili metni biçimlendir veya simgeyi açıp yazmaya devam et.</span></div>'+
      (draft.revisions.length ? '<details class="explanation-history"><summary>Önceki açıklamalarım ('+draft.revisions.length+')</summary>'+draft.revisions.map(function(r,i){return '<article><strong>'+ (i+1)+'. açıklamam</strong><div>'+cleanHTML(r.html)+'</div></article>';}).join('')+'</details>' : '')+
      '<p class="explanation-scale-note">Tanecik çizimleri şematiktir; sayı, boyut ve süreler temsilidir. Model, gözlemini açıklamak için bir araçtır.</p></section>';
  }
  function render(state) {
    var draft=get(state);
    return '<section class="prediction-card explanation-card explanation-unified" id="explanationCard" aria-labelledby="explanationTitle"><header class="learning-card-header"><div class="learning-header-copy"><div class="prediction-heading arena-stage-heading"><span class="prediction-eyebrow">'+window.MebiSVG.icon('beakerIc')+' 4. Açıkla</span><h1 id="explanationTitle" tabindex="-1">Açıklamamı yazıyorum</h1></div><p class="prediction-intro">Gözlemini yorumla ve değişimin nedenini tanecik düzeyinde açıkla.</p></div>'+window.MebiObservation.pairHTML(state)+'</header><div class="prediction-content explanation-content"><section class="explanation-combined">'+evidenceHTML(state)+writingHTML(state)+'</section></div><footer class="prediction-footer explanation-footer"><div id="explanationFeedback" class="explanation-feedback"><span class="explanation-error-icon" aria-hidden="true">!</span><p id="explanationStatus" role="status" aria-live="polite"></p></div><div class="prediction-actions"><button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="backToObservation">← Karşılaştırmaya Dön</button><button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="openParticleInspection" data-arg="before">'+window.MebiSVG.icon('eye')+' 3 Boyutlu Tanecik Modellerini İncele</button>'+testButton()+'<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="saveExplanation">'+(draft.revisions.length?'Geliştirdiğim Açıklamayı Kaydet':'Açıklamamı Kaydet')+'</button><button type="button" class="mebi-btn mebi-btn-primary mebi-btn-sm" data-action="toModel">Model Aşamasına Geç →</button></div></footer></section>';
  }
  var cleanupSelection=null;
  function wire(state) {
    if(cleanupSelection){cleanupSelection();cleanupSelection=null;}
    if(!document.getElementById('explanationCard'))return;
    document.querySelectorAll('[data-explanation-observation]').forEach(function(input){input.indeterminate=state.observation.record.answers[input.dataset.explanationObservation]==='unsure';});
    document.querySelectorAll('[data-explanation-change]').forEach(function(input){input.addEventListener('change',function(){if(input.checked){decide(state,input.value);status(state);}});});
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
      function update(){editor.dataset.empty=String(!plain(editor.innerHTML));draft.html=cleanHTML(editor.innerHTML);draft.message='';draft.error=false;persist(state);status(state);remember();}
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
      editor.addEventListener('input',update);editor.addEventListener('keyup',remember);editor.addEventListener('mouseup',remember);editor.addEventListener('focusout',function(){remember();if(!plain(editor.innerHTML)){editor.innerHTML='';update();}});
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
      document.addEventListener('selectionchange',remember);
      cleanupSelection=function(){document.removeEventListener('selectionchange',remember);};
    }
    status(state);
  }
  window.MebiExplanation={eligible:eligible,get:get,render:render,wire:wire,save:save,persist:persist,cleanHTML:cleanHTML,setStep:setStep,autoFillForTesting:autoFillForTesting};
})(window);
