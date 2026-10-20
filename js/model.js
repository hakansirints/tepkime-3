/* The particle-relationship activity moved from Explain to the final Model stage. */
(function(window){
  'use strict';
  var KEY='tepkime_arenasi_particle_models_v1',TEST_TOOLS_ENABLED=true;
  var roles=[['reactant','Tepkimeye katılan'],['solid','Oluşan çökelti / katı'],['gas','Oluşan gaz'],['water','Oluşan su'],['other','Diğer ürün / kompleks'],['spectator','Seyirci iyon'],['catalyst','Katalizör'],['unchanged','Diğer değişmeden kalan']];
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function data(state){return window.MebiExplanationModel?window.MebiExplanationModel.build(state):null;}
  function entries(){var all=JSON.parse(localStorage.getItem(KEY)||'{}');return all&&typeof all==='object'&&!Array.isArray(all)?all:{};}
  function canEnter(state){return !!(window.MebiExplanation.eligible(state)&&window.MebiExplanation.get(state).revisions.length);}
  function get(state){
    var id=state.observation&&state.observation.record&&state.observation.record.id,pair=[state.selectedSlot1,state.selectedSlot2].join('|');
    if(!state.particleModel||state.particleModel.observationId!==id||state.particleModel.pair!==pair){
      var saved;try{saved=entries()[id];}catch(e){}
      var legacy=window.MebiExplanation.get(state).legacyAssignments||{};
      var draft={version:1,observationId:id,pair:pair,assignments:{},revisions:[],message:'',error:false,storageError:false};
      var source=saved&&saved.version===1&&saved.pair===pair?saved:null;
      var assignments=source?source.assignments:legacy;
      if(assignments&&typeof assignments==='object')Object.keys(assignments).forEach(function(kind){if(roles.some(function(r){return r[0]===assignments[kind];}))draft.assignments[kind]=assignments[kind];});
      if(source&&Array.isArray(source.revisions))draft.revisions=source.revisions;
      state.particleModel=draft;
    }
    return state.particleModel;
  }
  function persist(state){var draft=get(state);try{var all=entries();all[draft.observationId]={version:1,observationId:draft.observationId,pair:draft.pair,assignments:draft.assignments,revisions:draft.revisions};localStorage.setItem(KEY,JSON.stringify(all));draft.storageError=false;}catch(e){draft.storageError=true;}}
  function validate(state){var model=data(state),draft=get(state);return {ready:!!model,missing:model?model.species.filter(function(p){return !roles.some(function(r){return r[0]===draft.assignments[p.kind];});}):[],different:model?model.species.filter(function(p){return draft.assignments[p.kind]&&draft.assignments[p.kind]!==p.role;}):[]};}
  function status(state){
    var draft=get(state),el=document.getElementById('modelStatus');if(!el)return;
    el.setAttribute('role',draft.error?'alert':'status');el.setAttribute('aria-live',draft.error?'assertive':'polite');
    el.textContent=draft.storageError?'Bu oturumda korunuyor; tarayıcıya kaydedilemedi.':draft.message||'Taneciklere rol ver; aralarındaki ilişkiyi aşağıdaki şemada incele.';
    document.getElementById('modelFeedback').classList.toggle('is-error',draft.error);
  }
  function check(state){
    var result=validate(state),draft=get(state);draft.error=!result.ready||!!(result.missing.length||result.different.length);
    draft.message=!result.ready?'Tanecik modeli hazırlanıyor…':result.missing.length?'Henüz rol vermediğin '+result.missing.length+' tanecik var.':result.different.length?result.different.map(function(p){return p.label;}).join(', ')+' için seçtiğin rolleri yeniden incele.':'Tanecik rollerin bu öğretim modeliyle uyumlu. Modelini kaydedebilirsin.';
    status(state);return !draft.error;
  }
  function save(state){
    if(!canEnter(state)||!check(state))return false;
    var draft=get(state),assignments=JSON.parse(JSON.stringify(draft.assignments)),explanation=window.MebiExplanation.get(state),last=draft.revisions[draft.revisions.length-1];
    if(!last||JSON.stringify(last.assignments)!==JSON.stringify(assignments)||last.explanationRevision!==explanation.revisions.length)draft.revisions.push({assignments:assignments,explanationRevision:explanation.revisions.length,createdAt:new Date().toISOString()});
    draft.message='Modelin kaydedildi. Açıklamana dönüp düşünceni geliştirebilirsin.';draft.error=false;persist(state);status(state);return true;
  }
  function assign(state,kind,value){var model=data(state);if(!canEnter(state)||!model||!model.species.some(function(p){return p.kind===kind;})||(value&&!roles.some(function(r){return r[0]===value;})))return false;var draft=get(state);draft.assignments[kind]=value;draft.message='';draft.error=false;persist(state);return true;}
  function autoFillForTesting(state){var model=data(state);if(!TEST_TOOLS_ENABLED||!canEnter(state)||!model)return false;var draft=get(state);model.species.forEach(function(p){draft.assignments[p.kind]=p.role;});draft.error=false;draft.message='Test için tanecik rolleri dolduruldu; inceleyip değiştirebilirsin.';persist(state);return true;}
  function badge(p){return '<span class="explanation-particle-badge">'+window.MebiExplanationModel.thumbnail(p.kind)+'<strong>'+esc(p.label)+'</strong></span>';}
  function mapHTML(state,model){
    var draft=get(state);
    function group(values,empty){var list=model.species.filter(function(p){return values.indexOf(draft.assignments[p.kind])>=0;});return list.length?list.map(badge).join(''):'<span class="explanation-map-empty">'+empty+'</span>';}
    return '<small>Türler arasındaki ilişki şeması · Tanecik sayıları gösterilmez.</small><div class="explanation-map-path"><div><small>Tepkimeye katılanlar</small><div>'+group(['reactant'],'Tanecik rollerini seç')+'</div></div><span class="explanation-map-arrow" aria-label="oluşturur">→</span><div><small>Oluştuğunu düşündüğüm ürünler</small><div>'+group(['solid','gas','water','other'],'Ürünleri ilişkilendir')+'</div></div></div><div class="explanation-map-remain"><small>Seyirci iyonlar</small><div>'+group(['spectator'],'Seyirci iyon varsa burada göster')+'</div></div>'+(model.species.some(function(p){return ['catalyst','unchanged'].indexOf(draft.assignments[p.kind])>=0;})?'<div class="explanation-map-remain"><small>Katalizör / diğer değişmeden kalanlar</small><div>'+group(['catalyst','unchanged'],'')+'</div></div>':'');
  }
  function summary(state){var model=data(state),draft=get(state);if(!model)return '';return roles.map(function(role){var labels=model.species.filter(function(p){return draft.assignments[p.kind]===role[0];}).map(function(p){return p.label;});return labels.length?role[1]+': '+labels.join(', '):'';}).filter(Boolean).join(' · ');}
  function dockHTML(state){
    if(!canEnter(state))return '';
    var model=data(state),draft=get(state);
    if(!model||!model.species||!model.species.length)return '';
    return '<aside class="particle-inspection-model-dock" id="particleInspectionModelDock" aria-label="Tanecik rolleri belirleme">' +
      '<div class="model-dock-bar">' +
        '<div class="model-dock-header">' +
          '<div class="model-dock-title-group">' +
            '<span class="model-dock-badge">5. Model</span>' +
            '<strong class="model-dock-title">Taneciklerin Tepkime İçindeki Rollerini Belirle</strong>' +
          '</div>' +
          '<div class="model-dock-actions">' +
            '<button type="button" class="model-dock-return-link model-dock-check-btn" data-action="checkModelDock">Rollerimi Gözden Geçir</button>' +
            '<button type="button" class="model-dock-return-link" data-action="closeParticleInspection">Model kartına dön ↗</button>' +
          '</div>' +
        '</div>' +
        '<div class="explanation-species model-dock-species">' +
          model.species.map(function(p){
            return '<label class="explanation-species-card" data-species-card="' + esc(p.kind) + '">' + badge(p) +
              '<select data-model-species="' + esc(p.kind) + '" aria-label="' + esc(p.label) + ' rolü">' +
                '<option value="">Rolünü seç…</option>' +
                roles.map(function(r){
                  return '<option value="' + r[0] + '"' + (draft.assignments[p.kind] === r[0] ? ' selected' : '') + '>' + r[1] + '</option>';
                }).join('') +
              '</select>' +
            '</label>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</aside>';
  }
  function checkDock(state){
    var dock=document.getElementById('particleInspectionModelDock');
    if(!dock)return;
    var model=data(state),draft=get(state);
    if(!model||!model.species)return;
    model.species.forEach(function(p){
      var card=dock.querySelector('[data-species-card="' + esc(p.kind) + '"]');
      if(!card)return;
      var userVal=draft.assignments[p.kind];
      card.classList.remove('is-correct','is-incorrect');
      if(userVal&&userVal===p.role){
        card.classList.add('is-correct');
      }else{
        card.classList.add('is-incorrect');
      }
    });
  }
  function render(state){
    var model=data(state),draft=get(state),pair=[state.selectedSlot1,state.selectedSlot2].map(function(id){return esc(window.MebiData.getReagent(id).f);}).join(' <span>+</span> ');
    var helpBox = '<details class="explanation-help" open><summary id="modelStepTitle" tabindex="-1">Rolleri ayırt ederken nelere bakmalıyım?</summary><p>Katı tepkeni başlangıçta serbest iyon gibi gösterme. Çözeltide kalan her tanecik seyirci değildir; artan tepken ve katalizörü ayırt et. Oluşan suyu çözücü sudan, katı iyonik örgüyü molekülün bağ yapısından ayır.</p></details>';
    var testBtn = TEST_TOOLS_ENABLED ? '<button type="button" class="explanation-test-button mebi-btn mebi-btn-secondary mebi-btn-sm" data-model-test data-action="autoFillModelForTesting">' + window.MebiSVG.icon('flaskOutline') + '<span>Test İçin Doldur</span></button>' : '';
    var particle3DBtn = '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="openParticleInspection" data-arg="before">' + window.MebiSVG.icon('eye') + ' 3 Boyutlu Tanecik Modellerini İncele</button>';
    var checkBtn = '<button type="button" data-action="checkModel" class="mebi-btn mebi-btn-secondary mebi-btn-sm">Rollerimi Gözden Geçir</button>';
    return '<section class="prediction-card explanation-card model-card" id="modelCard" aria-labelledby="modelTitle"><header class="learning-card-header"><div class="learning-header-copy"><div class="prediction-heading arena-stage-heading"><span class="prediction-eyebrow">'+window.MebiSVG.icon('beakerIc')+' 5. Model</span><h1 id="modelTitle">Tanecikleri ilişkilendiriyorum</h1></div><p class="prediction-intro">Hangi tanecikler tepkimeye katıldı, neler oluştu, hangileri değişmeden kaldı?</p></div>'+window.MebiObservation.pairHTML(state)+'</header><div class="prediction-content model-content"><section class="explanation-work">' + helpBox + (model?'<div class="explanation-species">'+model.species.map(function(p){return '<label class="explanation-species-card">'+badge(p)+'<select data-model-species="'+esc(p.kind)+'" aria-label="'+esc(p.label)+' rolü"><option value="">Rolünü seç…</option>'+roles.map(function(r){return '<option value="'+r[0]+'"'+(draft.assignments[p.kind]===r[0]?' selected':'')+'>'+r[1]+'</option>';}).join('')+'</select></label>';}).join('')+'</div><div class="explanation-model-caption"><span>Benim tanecik ilişkim</span></div><div class="explanation-map" id="modelMap">'+mapHTML(state,model)+'</div>':'<p role="status">Tanecik modeli hazırlanıyor…</p>')+'</section></div><footer class="prediction-footer explanation-footer"><div id="modelFeedback" class="explanation-feedback"><span class="explanation-error-icon" aria-hidden="true">!</span><p id="modelStatus" role="status" aria-live="polite"></p></div><div class="prediction-actions"><button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="backToExplanation">← Açıklamama Dön</button>' + particle3DBtn + checkBtn + testBtn + '<button type="button" class="mebi-btn mebi-btn-primary mebi-btn-sm" data-action="saveModel">Modelimi Kaydet</button></div></footer></section>';
  }
  function wire(state){var host=document.getElementById('modelCard');if(!host)return;host.querySelectorAll('[data-model-species]').forEach(function(select){select.addEventListener('change',function(){if(assign(state,select.dataset.modelSpecies,select.value)){document.getElementById('modelMap').innerHTML=mapHTML(state,data(state));status(state);}});});status(state);}
  window.MebiModel={canEnter:canEnter,get:get,render:render,wire:wire,check:check,checkDock:checkDock,save:save,persist:persist,autoFillForTesting:autoFillForTesting,summary:summary,validate:validate,assign:assign,dockHTML:dockHTML};
})(window);
