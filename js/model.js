/* The particle-relationship activity and equation-balancing builder in Model stage (5. Model). */
(function(window){
  'use strict';
  var KEY='tepkime_arenasi_particle_models_v1';
  var roles=[
    ['reactant','Tepkimeye katılan'],
    ['solid','Oluşan çökelti / katı'],
    ['gas','Oluşan gaz'],
    ['water','Oluşan su'],
    ['other','Diğer ürün / kompleks'],
    ['spectator','Seyirci iyon'],
    ['solvent','Çözücü'],
    ['catalyst','Katalizör'],
    ['unchanged','Diğer değişmeden kalan']
  ];

  function esc(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function data(state){
    return window.MebiExplanationModel ? window.MebiExplanationModel.build(state) : null;
  }

  function entries(){
    var all = JSON.parse(localStorage.getItem(KEY) || '{}');
    return all && typeof all === 'object' && !Array.isArray(all) ? all : {};
  }

  function canEnter(state){
    return !!(window.MebiExplanation.eligible(state) && window.MebiExplanation.get(state).revisions.length);
  }

  function get(state){
    var id = state.observation && state.observation.record && state.observation.record.id;
    var pair = [state.selectedSlot1, state.selectedSlot2].join('|');
    if (!state.particleModel || state.particleModel.observationId !== id || state.particleModel.pair !== pair) {
      var saved;
      try { saved = entries()[id]; } catch(e){}
      var legacy = window.MebiExplanation.get(state).legacyAssignments || {};
      var draft = {
        version: 1,
        observationId: id,
        pair: pair,
        subView: 'relationships',
        assignments: {},
        equationDraft: { reactants: [], products: [] },
        equationFeedback: { message: '', error: false },
        equationSaved: false,
        revisions: [],
        message: '',
        error: false,
        storageError: false
      };
      var source = saved && saved.version === 1 && saved.pair === pair ? saved : null;
      var assignments = source ? source.assignments : legacy;
      if (assignments && typeof assignments === 'object') {
        Object.keys(assignments).forEach(function(kind){
          if (roles.some(function(r){ return r[0] === assignments[kind]; })) {
            draft.assignments[kind] = assignments[kind];
          }
        });
      }
      if (source && Array.isArray(source.revisions)) draft.revisions = source.revisions;
      if (source && source.subView) draft.subView = source.subView;
      if (source && source.equationDraft && Array.isArray(source.equationDraft.reactants) && Array.isArray(source.equationDraft.products)) {
        draft.equationDraft = source.equationDraft;
      }
      if (source && source.equationFeedback) draft.equationFeedback = source.equationFeedback;
      if (source && source.equationSaved) draft.equationSaved = source.equationSaved;
      state.particleModel = draft;
    }
    return state.particleModel;
  }

  function persist(state){
    var draft = get(state);
    try {
      var all = entries();
      all[draft.observationId] = {
        version: 1,
        observationId: draft.observationId,
        pair: draft.pair,
        subView: draft.subView || 'relationships',
        assignments: draft.assignments,
        revisions: draft.revisions,
        equationDraft: draft.equationDraft || { reactants: [], products: [] },
        equationFeedback: draft.equationFeedback || { message: '', error: false },
        equationSaved: !!draft.equationSaved
      };
      localStorage.setItem(KEY, JSON.stringify(all));
      draft.storageError = false;
    } catch(e) {
      draft.storageError = true;
    }
  }

  function setSubView(state, view){
    var draft = get(state);
    draft.subView = (view === 'equation') ? 'equation' : 'relationships';
    if (state.modelHelpTimeout) { clearTimeout(state.modelHelpTimeout); state.modelHelpTimeout = null; }
    persist(state);
    return true;
  }

  function validate(state){
    var model = data(state), draft = get(state);
    return {
      ready: !!model,
      missing: model ? model.species.filter(function(p){ return !roles.some(function(r){ return r[0] === draft.assignments[p.kind]; }); }) : [],
      different: model ? model.species.filter(function(p){ return draft.assignments[p.kind] && draft.assignments[p.kind] !== p.role; }) : []
    };
  }

  function status(state){
    var draft = get(state);
    var el = document.getElementById('modelStatus');
    if (!el) return;
    el.setAttribute('role', draft.error ? 'alert' : 'status');
    el.setAttribute('aria-live', draft.error ? 'assertive' : 'polite');
    if (draft.subView === 'equation') {
      // Equation validation belongs beside the draft and conservation table.
      el.textContent = draft.storageError ? 'Bu oturumda korunuyor; tarayıcıya kaydedilemedi.' : '';
    } else {
      el.textContent = draft.storageError
        ? 'Bu oturumda korunuyor; tarayıcıya kaydedilemedi.'
        : draft.message || '';
    }
    var feedbackEl = document.getElementById('modelFeedback');
    if (feedbackEl) feedbackEl.classList.toggle('is-error', draft.subView === 'equation' ? !!draft.storageError : draft.error);
  }

  function check(state){
    var result = validate(state), draft = get(state);
    draft.error = !result.ready || !!(result.missing.length || result.different.length);
    draft.message = !result.ready
      ? 'Tanecik modeli hazırlanıyor…'
      : result.missing.length
        ? 'Henüz rol vermediğin ' + result.missing.length + ' tanecik var.'
        : result.different.length
          ? result.different.map(function(p){ return p.label; }).join(', ') + ' için seçtiğin rolleri yeniden incele.'
          : 'Tanecik rollerin bu öğretim modeliyle uyumlu. Modelini kaydedebilirsin.';
    status(state);
    return !draft.error;
  }

  function save(state){
    if (!canEnter(state) || !check(state)) return false;
    var draft = get(state), assignments = JSON.parse(JSON.stringify(draft.assignments)), explanation = window.MebiExplanation.get(state), last = draft.revisions[draft.revisions.length - 1];
    if (!last || JSON.stringify(last.assignments) !== JSON.stringify(assignments) || last.explanationRevision !== explanation.revisions.length) {
      draft.revisions.push({
        assignments: assignments,
        explanationRevision: explanation.revisions.length,
        createdAt: new Date().toISOString()
      });
    }
    draft.message = 'Modelin kaydedildi. Açıklamana dönüp düşünceni geliştirebilir veya denklemini kurabilirsin.';
    draft.error = false;
    persist(state);
    status(state);
    return true;
  }

  function assign(state, kind, value){
    var model = data(state);
    if (!canEnter(state) || !model || !model.species.some(function(p){ return p.kind === kind; }) || (value && !roles.some(function(r){ return r[0] === value; }))) return false;
    var draft = get(state);
    draft.assignments[kind] = value;
    draft.message = '';
    draft.error = false;
    persist(state);
    return true;
  }


  function isSpeciesFormulaTooLong(p){
    if (!p) return false;
    var kind = p.kind || '';
    if (['malachite', 'CuNH3', 'AgNH3', 'CuCl4', 'Pb(OH)2', 'Ca(OH)2', 'Cu(OH)2', 'Ag2CO3'].indexOf(kind) >= 0) return true;
    var lbl = String(p.label || kind).replace(/<[^>]+>/g, '').trim();
    if (lbl.length >= 7) return true;
    return false;
  }

  function badge(p){
    var tooLong = isSpeciesFormulaTooLong(p);
    if (tooLong) {
      return '<div class="species-card-visual is-formula-only" title="' + esc(p.label) + '">' +
        '<div class="species-card-symbol">' +
          '<strong>' + esc(p.label) + '</strong>' +
        '</div>' +
      '</div>';
    }
    var thumb = window.MebiExplanationModel && window.MebiExplanationModel.thumbnail ? window.MebiExplanationModel.thumbnail(p.kind) : '';
    return '<div class="species-card-visual">' +
      '<div class="species-card-symbol">' +
        '<strong>' + esc(p.label) + '</strong>' +
      '</div>' +
      '<div class="species-card-arrow" aria-hidden="true" title="Sembolün modeli">' +
        '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M6 10h8M10 6l4 4-4 4"/>' +
        '</svg>' +
      '</div>' +
      '<div class="species-card-model" title="' + esc(p.label) + ' tanecik modeli">' +
        thumb +
      '</div>' +
    '</div>';
  }

  function formatFormula(label){
    if (!label) return '';
    var str = String(label);
    var subMap = {'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'};
    var supMap = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','−':'⁻'};
    str = str.replace(/<sub>(.*?)<\/sub>/gi, function(_, val){ return val.split('').map(function(c){ return subMap[c] || c; }).join(''); });
    str = str.replace(/<sup>(.*?)<\/sup>/gi, function(_, val){ return val.split('').map(function(c){ return supMap[c] || c; }).join(''); });
    str = str.replace(/([0-9]*)([+-])$/, function(_, num, sign){
      var res = '';
      if (num) res += num.split('').map(function(c){ return supMap[c] || c; }).join('');
      res += supMap[sign] || sign;
      return res;
    });
    return esc(str);
  }

  /* ----------------- SPECIES PHASE & CANONICAL ORDER ----------------- */
  function getSpeciesPhaseTag(kindOrItem, model, state) {
    if (!kindOrItem) return '';
    var kind = '';
    var label = '';
    var role = '';
    var phase = '';

    if (typeof kindOrItem === 'string') {
      kind = kindOrItem;
    } else if (kindOrItem) {
      kind = kindOrItem.kind || '';
      label = kindOrItem.label || '';
      role = kindOrItem.role || '';
      phase = kindOrItem.phase || '';
    }

    if (model && model.species) {
      var found = model.species.find(function(p){
        return p.kind === kind || (label && p.label === label);
      });
      if (found) {
        if (!role) role = found.role;
        if (!phase) phase = found.phase;
        if (!label) label = found.label;
      }
    }

    // Role / Phase direct checks
    if (phase === 'gas' || role === 'gas') return '(g)';
    if (phase === 'solid' || role === 'solid') return '(k)';
    if (kind === 'H2O' || label === 'H₂O') return '(s)';
    if (['CO2', 'O2', 'Cl2'].indexOf(kind) >= 0 || ['CO₂', 'O₂', 'Cl₂'].indexOf(label) >= 0) return '(g)';
    if (['PbI2', 'AgCl', 'AgI', 'PbCl2', 'CaCO3', 'Ag2CO3', 'Cu2CO3(OH)2', 'malachite', 'Ag2O', 'Ca(OH)2', 'Cu(OH)2', 'Pb(OH)2', 'PbCO3', 'CuI', 'AgMetal', 'Ag'].indexOf(kind) >= 0) return '(k)';

    // Search active reaction netIonic
    var rx = (state && state.activeReaction) || (window.MebiData && state && window.MebiData.getReaction(state.selectedSlot1, state.selectedSlot2));
    if (rx && rx.netIonic) {
      var searchName = (label || kind).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var re = new RegExp(searchName + '\\s*\\(([^)]+)\\)');
      var m = rx.netIonic.match(re);
      if (m) {
        var tag = m[1].toLowerCase();
        if (tag.indexOf('katı') >= 0 || tag === 'k') return '(k)';
        if (tag.indexOf('gaz') >= 0 || tag === 'g') return '(g)';
        if (tag.indexOf('sıvı') >= 0 || tag === 's') return '(s)';
        if (tag.indexOf('suda') >= 0 || tag === 'aq') return '(suda)';
      }
    }

    if (phase === 'aqueous' || role === 'water' || role === 'spectator' || role === 'reactant') return '(suda)';
    return '(suda)';
  }

  function sortSpeciesOrder(a, b, state, side) {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;

    var kindA = typeof a === 'string' ? a : (a.kind || a.label || '');
    var kindB = typeof b === 'string' ? b : (b.kind || b.label || '');
    var labelA = (typeof a === 'object' && a.label) ? a.label : ((window.MebiExplanationModel && window.MebiExplanationModel.symbol && window.MebiExplanationModel.symbol(kindA)) || kindA);
    var labelB = (typeof b === 'object' && b.label) ? b.label : ((window.MebiExplanationModel && window.MebiExplanationModel.symbol && window.MebiExplanationModel.symbol(kindB)) || kindB);

    var rx = (state && state.activeReaction) || (window.MebiData && state && window.MebiData.getReaction(state.selectedSlot1, state.selectedSlot2));
    if (rx && rx.netIonic) {
      var parts = rx.netIonic.split(/→|⇌/);
      var sideStr = side === 'products' ? (parts[1] || '') : (parts[0] || '');

      function findPos(kind, label) {
        if (!sideStr) return -1;
        var cleanKind = String(kind).replace(/[^A-Za-z0-9]/g, '');
        var cleanLabel = String(label).replace(/[⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '');
        var idx = sideStr.indexOf(label);
        if (idx >= 0) return idx;
        idx = sideStr.indexOf(kind);
        if (idx >= 0) return idx;
        if (cleanLabel && sideStr.indexOf(cleanLabel) >= 0) return sideStr.indexOf(cleanLabel);
        if (cleanKind && sideStr.indexOf(cleanKind) >= 0) return sideStr.indexOf(cleanKind);
        return -1;
      }

      var posA = findPos(kindA, labelA);
      var posB = findPos(kindB, labelB);

      if (posA >= 0 && posB >= 0) {
        if (posA !== posB) return posA - posB;
      } else if (posA >= 0) {
        return -1;
      } else if (posB >= 0) {
        return 1;
      }
    }

    var chargeMap = (window.MebiExplanationModel && window.MebiExplanationModel.CHARGES) || {
      Pb: 2, Ca: 2, Cu: 2, Ag: 1, Na: 1, K: 1, H3O: 1, NH4: 1,
      I: -1, Cl: -1, OH: -1, NO3: -1, HCO3: -1, CO3: -2, HO2: -1
    };
    var chA = chargeMap[kindA] !== undefined ? chargeMap[kindA] : (String(labelA).indexOf('⁺') >= 0 || String(kindA).indexOf('+') >= 0 ? 1 : (String(labelA).indexOf('⁻') >= 0 || String(kindA).indexOf('-') >= 0 ? -1 : 0));
    var chB = chargeMap[kindB] !== undefined ? chargeMap[kindB] : (String(labelB).indexOf('⁺') >= 0 || String(kindB).indexOf('+') >= 0 ? 1 : (String(labelB).indexOf('⁻') >= 0 || String(kindB).indexOf('-') >= 0 ? -1 : 0));

    if (side !== 'products') {
      if (chA !== chB) return chB - chA;
    } else {
      var isSolidA = ['PbI2','AgCl','AgI','PbCl2','CaCO3','Ag2CO3','Ag2O','Pb(OH)2','Ca(OH)2','Cu(OH)2','PbCO3','CuI','malachite'].indexOf(kindA) >= 0;
      var isSolidB = ['PbI2','AgCl','AgI','PbCl2','CaCO3','Ag2CO3','Ag2O','Pb(OH)2','Ca(OH)2','Cu(OH)2','PbCO3','CuI','malachite'].indexOf(kindB) >= 0;
      if (isSolidA && !isSolidB) return -1;
      if (!isSolidA && isSolidB) return 1;
    }

    return String(labelA).localeCompare(String(labelB));
  }

  /* ----------------- CHEMICAL FORMULA PARSER & CONSERVATION ----------------- */
  function parseFormulaFallback(str) {
    if (!str) return { atoms: {}, charge: 0 };
    var charge = 0;
    var clean = String(str).trim();

    // Check for superscript charge at end: e.g. ⁺, ⁻, ²⁺, ²⁻
    var supCharge = clean.match(/([⁰¹²³⁴⁵⁶⁷⁸⁹]*)([⁺⁻])$/);
    if (supCharge) {
      var numMap = {'⁰':0,'¹':1,'²':2,'³':3,'⁴':4,'⁵':5,'⁶':6,'⁷':7,'⁸':8,'⁹':9};
      var num = 1;
      if (supCharge[1]) {
        num = supCharge[1].split('').reduce(function(acc, c){ return acc * 10 + (numMap[c] || 0); }, 0);
      }
      charge = supCharge[2] === '⁺' ? num : -num;
      clean = clean.slice(0, -supCharge[0].length);
    } else {
      var stdCharge = clean.match(/([0-9]*)([+-])$/);
      if (stdCharge) {
        var numStd = stdCharge[1] ? parseInt(stdCharge[1], 10) : 1;
        charge = stdCharge[2] === '+' ? numStd : -numStd;
        clean = clean.slice(0, -stdCharge[0].length);
      }
    }

    var subMap = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'};
    clean = clean.replace(/[₀-₉]/g, function(c){ return subMap[c] || c; }).replace(/[\[\]]/g, '');

    function parseSegment(seg) {
      var counts = {};
      var regex = /\(([^)]+)\)(\d*)|([A-Z][a-z]*)(\d*)/g;
      var m;
      while ((m = regex.exec(seg)) !== null) {
        if (m[1]) {
          var groupCount = m[2] ? parseInt(m[2], 10) : 1;
          var inner = parseSegment(m[1]);
          for (var el in inner) {
            counts[el] = (counts[el] || 0) + inner[el] * groupCount;
          }
        } else if (m[3]) {
          var element = m[3];
          var count = m[4] ? parseInt(m[4], 10) : 1;
          counts[element] = (counts[element] || 0) + count;
        }
      }
      return counts;
    }

    return { atoms: parseSegment(clean), charge: charge };
  }

  function getSpeciesAtoms(kind) {
    if (window.MebiExplanationModel && window.MebiExplanationModel.template) {
      try {
        var t = window.MebiExplanationModel.template(kind);
        if (t && t.atoms && Array.isArray(t.atoms)) {
          var counts = {};
          t.atoms.forEach(function(a){
            counts[a.element] = (counts[a.element] || 0) + 1;
          });
          return counts;
        }
      } catch(e) {}
    }
    var label = (window.MebiExplanationModel && window.MebiExplanationModel.symbol && window.MebiExplanationModel.symbol(kind)) || kind;
    return parseFormulaFallback(label).atoms;
  }

  function getSpeciesCharge(kind) {
    if (window.MebiExplanationModel && window.MebiExplanationModel.CHARGES && typeof window.MebiExplanationModel.CHARGES[kind] === 'number') {
      return window.MebiExplanationModel.CHARGES[kind];
    }
    var label = (window.MebiExplanationModel && window.MebiExplanationModel.symbol && window.MebiExplanationModel.symbol(kind)) || kind;
    return parseFormulaFallback(label).charge;
  }

  function calculateConservation(state) {
    var draft = get(state);
    var eq = draft.equationDraft || { reactants: [], products: [] };
    var reactants = eq.reactants || [];
    var products = eq.products || [];

    var leftAtoms = {}, rightAtoms = {};
    var leftCharge = 0, rightCharge = 0;

    reactants.forEach(function(term){
      var coeff = Math.max(1, parseInt(term.coeff, 10) || 1);
      var atoms = getSpeciesAtoms(term.kind);
      for (var el in atoms) {
        leftAtoms[el] = (leftAtoms[el] || 0) + atoms[el] * coeff;
      }
      leftCharge += getSpeciesCharge(term.kind) * coeff;
    });

    products.forEach(function(term){
      var coeff = Math.max(1, parseInt(term.coeff, 10) || 1);
      var atoms = getSpeciesAtoms(term.kind);
      for (var el in atoms) {
        rightAtoms[el] = (rightAtoms[el] || 0) + atoms[el] * coeff;
      }
      rightCharge += getSpeciesCharge(term.kind) * coeff;
    });

    var allElements = [];
    for (var el1 in leftAtoms) { if (allElements.indexOf(el1) < 0) allElements.push(el1); }
    for (var el2 in rightAtoms) { if (allElements.indexOf(el2) < 0) allElements.push(el2); }
    allElements.sort();

    var atomRows = allElements.map(function(el){
      var l = leftAtoms[el] || 0;
      var r = rightAtoms[el] || 0;
      return {
        element: el,
        left: l,
        right: r,
        isEqual: (l === r && l > 0)
      };
    });

    var isComplete = (reactants.length > 0 && products.length > 0);
    var allAtomsEqual = isComplete && atomRows.length > 0 && atomRows.every(function(row){ return row.isEqual; });
    var chargeEqual = isComplete && (leftCharge === rightCharge);

    return {
      atomRows: atomRows,
      chargeRow: {
        left: leftCharge,
        right: rightCharge,
        isEqual: chargeEqual
      },
      isComplete: isComplete,
      allAtomsEqual: allAtomsEqual,
      chargeEqual: chargeEqual,
      isBalanced: isComplete && allAtomsEqual && chargeEqual
    };
  }

  /* ----------------- EQUATION ACTIONS ----------------- */
  function checkAutoCelebration(state) {
    if (window.MebiNonReaction && window.MebiNonReaction.scenario(state)) return;
    var cons = calculateConservation(state);
    var draft = get(state);
    var model = data(state);
    if (cons.isBalanced) {
      var hasSpectator = false;
      if (model && model.species && draft.equationDraft) {
        var allTerms = (draft.equationDraft.reactants || []).concat(draft.equationDraft.products || []);
        hasSpectator = allTerms.some(function(t){
          return model.species.some(function(p){
            return p.kind === t.kind && p.role === 'spectator';
          });
        });
      }
      if (!hasSpectator) {
        // Do NOT auto open modal when balanced by coefficient/term editing.
        // Modal opens strictly when clicking "Denklemi Kontrol Et"!
        draft.showBalancedModal = false;
        draft.equationFeedback = {
          message: 'Tebrikler! Atom sayıları ve toplam elektriksel yük tam olarak korunuyor. Denkleminiz denkleştirildi.',
          error: false
        };
        draft.error = false;
        return;
      }
    }
    draft.hasCelebrated = false;
  }

  function addTerm(state, side, kind) {
    if (!side || !kind) return false;
    var draft = get(state);
    if (!draft.equationDraft) draft.equationDraft = { reactants: [], products: [] };
    var list = side === 'products' ? draft.equationDraft.products : draft.equationDraft.reactants;
    var existing = list.find(function(item){ return item.kind === kind; });
    if (existing) {
      existing.coeff = (existing.coeff || 1) + 1;
    } else {
      list.push({ kind: kind, coeff: 1 });
    }
    draft.equationFeedback = { message: '', error: false };
    draft.equationSaved = false;
    checkAutoCelebration(state);
    persist(state);
    return true;
  }

  function removeTerm(state, side, index) {
    var draft = get(state);
    if (!draft.equationDraft) return false;
    var list = side === 'products' ? draft.equationDraft.products : draft.equationDraft.reactants;
    if (index >= 0 && index < list.length) {
      list.splice(index, 1);
      draft.equationFeedback = { message: '', error: false };
      draft.equationSaved = false;
      draft.showBalancedModal = false;
      draft.hasCelebrated = false;
      checkAutoCelebration(state);
      persist(state);
      return true;
    }
    return false;
  }

  function setCoefficient(state, side, index, coeff) {
    var draft = get(state);
    if (!draft.equationDraft) return false;
    var list = side === 'products' ? draft.equationDraft.products : draft.equationDraft.reactants;
    if (index >= 0 && index < list.length) {
      var val = Math.max(1, Math.min(99, parseInt(coeff, 10) || 1));
      list[index].coeff = val;
      draft.equationSaved = false;
      checkAutoCelebration(state);
      persist(state);
      return true;
    }
    return false;
  }

  function stepCoefficient(state, side, index, delta) {
    var draft = get(state);
    if (!draft.equationDraft) return false;
    var list = side === 'products' ? draft.equationDraft.products : draft.equationDraft.reactants;
    if (index >= 0 && index < list.length) {
      var cur = list[index].coeff || 1;
      return setCoefficient(state, side, index, cur + delta);
    }
    return false;
  }

  function clearEquation(state) {
    var draft = get(state);
    draft.equationDraft = { reactants: [], products: [] };
    draft.equationFeedback = { message: 'Denklem taslağı temizlendi.', error: false };
    draft.equationSaved = false;
    draft.showBalancedModal = false;
    draft.hasCelebrated = false;
    persist(state);
    return true;
  }

  function quickAddPlaceholder(state, side) {
    var model = data(state);
    if (!model || !model.species) return false;
    var draft = get(state);
    var list = side === 'products' ? draft.equationDraft.products : draft.equationDraft.reactants;
    var candidates;
    if (side === 'reactants') {
      candidates = model.species.filter(function(p){
        return draft.assignments[p.kind] === 'reactant' || p.role === 'reactant';
      });
    } else {
      candidates = model.species.filter(function(p){
        return ['solid','gas','water','other'].indexOf(draft.assignments[p.kind]) >= 0 || ['solid','gas','water','other'].indexOf(p.role) >= 0;
      });
    }
    if (!candidates.length) candidates = model.species;
    var unadded = candidates.find(function(c){
      return !list.some(function(item){ return item.kind === c.kind; });
    });
    var target = unadded || candidates[0];
    if (target) {
      return addTerm(state, side, target.kind);
    }
    return false;
  }

  function checkEquation(state) {
    if (window.MebiNonReaction && window.MebiNonReaction.scenario(state)) return false;
    var cons = calculateConservation(state);
    var draft = get(state);
    var model = data(state);

    if (!cons.isComplete) {
      draft.equationFeedback = {
        message: 'Denklem henüz tamamlanmadı. Katılanlar ve ürünler tarafına türleri ekle.',
        error: true
      };
      draft.error = true;
      draft.showBalancedModal = false;
      persist(state);
      status(state);
      return false;
    }

    if (cons.isBalanced) {
      // Check if net ionic reaction has extraneous spectator ions:
      var hasSpectator = false;
      if (model && model.species) {
        var allTerms = (draft.equationDraft.reactants || []).concat(draft.equationDraft.products || []);
        hasSpectator = allTerms.some(function(t){
          return model.species.some(function(p){
            return p.kind === t.kind && p.role === 'spectator';
          });
        });
      }
      if (hasSpectator) {
        draft.equationFeedback = {
          message: 'Atom sayıları ve yükler korunuyor; ancak net tepkime denkleminde seyirci iyonlar yer almaz. Seyirci iyonları denklem taslağından çıkarın.',
          error: true
        };
        draft.error = true;
        draft.showBalancedModal = false;
      } else {
        draft.equationFeedback = {
          message: 'Tebrikler! Atom sayıları ve toplam elektriksel yük tam olarak korunuyor. Denkleminiz denkleştirildi.',
          error: false
        };
        draft.error = false;
        draft.showBalancedModal = true;
        draft.hasCelebrated = true;
        if (window.MebiUI && window.MebiUI.fireConfetti) {
          window.MebiUI.fireConfetti();
        }
        if (window.MebiAudio && window.MebiAudio.playSuccess) {
          window.MebiAudio.playSuccess();
        }
      }
    } else if (cons.chargeEqual && !cons.allAtomsEqual) {
      draft.equationFeedback = {
        message: 'Toplam elektriksel yük korunuyor (+ / -); ancak atom sayıları henüz eşit değil. Katsayıları düzenleyin.',
        error: true
      };
      draft.error = true;
      draft.showBalancedModal = false;
    } else if (!cons.chargeEqual && cons.allAtomsEqual) {
      draft.equationFeedback = {
        message: 'Atom sayıları eşit; ancak toplam elektriksel yük korunmuyor. İyon yüklerini kontrol edin.',
        error: true
      };
      draft.error = true;
      draft.showBalancedModal = false;
    } else {
      draft.equationFeedback = {
        message: 'Denklemde atom sayıları veya elektriksel yükler henüz eşit değil. Katsayıları düzenleyin.',
        error: true
      };
      draft.error = true;
      draft.showBalancedModal = false;
    }

    persist(state);
    status(state);
    return !draft.error;
  }

  function saveEquation(state) {
    if (!checkEquation(state)) return false;
    var draft = get(state);
    draft.equationSaved = true;
    draft.equationFeedback = {
      message: 'Kimyasal denkleminiz ve atom/yük korunum analizi başarıyla kaydedildi.',
      error: false
    };
    persist(state);
    status(state);
    // Info toast removed per requirement 1 ("1. Görseldeki bilgi kartını gösterme.")
    return true;
  }

  /* ----------------- RELATIONSHIP MAP (SCHEMA) HTML ----------------- */
  function mapHTML(state, model){
    var draft = get(state);
    function getFormulas(roleKeys, isPlus, side){
      var list = model.species.filter(function(p){ return roleKeys.indexOf(draft.assignments[p.kind]) >= 0; });
      if (!list.length) return '<span class="model-map-empty">—</span>';
      if (side) {
        list = list.slice().sort(function(a, b){ return sortSpeciesOrder(a, b, state, side); });
      }
      if (isPlus) {
        return list.map(function(p){
          var phaseTag = getSpeciesPhaseTag(p, model, state);
          var phaseHTML = phaseTag ? '<sub class="equation-phase">' + phaseTag + '</sub>' : '';
          return '<span class="model-map-formula">' + formatFormula(p.label) + phaseHTML + '</span>';
        }).join('<span class="model-map-plus">+</span>');
      }
      return list.map(function(p, i){
        return '<span class="model-map-formula">' + formatFormula(p.label) + (i < list.length - 1 ? '<span class="model-map-comma">,</span>' : '') + '</span>';
      }).join('');
    }
    var reactantsHTML = getFormulas(['reactant'], true, 'reactants');
    var productsHTML = getFormulas(['solid','gas','water','other'], true, 'products');
    var spectatorsHTML = getFormulas(['spectator'], false);
    var solventsHTML = getFormulas(['solvent'], false);
    var remainingsHTML = getFormulas(['catalyst','unchanged'], false);

    return '<div class="model-relationship-panel">' +
      '<div class="model-map-strip">' +
        '<div class="model-map-side is-reactants">' +
          '<span class="model-map-strip-badge">Tepkimeye katılanlar</span>' +
          '<div class="model-map-items">' + reactantsHTML + '</div>' +
        '</div>' +
        '<div class="model-map-arrow-wrap" aria-label="oluşturur">' +
          '<span class="model-map-arrow-circle">' +
            '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<path d="M5 12h14M12 5l7 7-7 7"/>' +
            '</svg>' +
          '</span>' +
        '</div>' +
        '<div class="model-map-side is-products">' +
          '<span class="model-map-strip-badge">Oluştuğunu düşündüğüm ürünler</span>' +
          '<div class="model-map-items">' + productsHTML + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="model-map-bottom-row">' +
        '<div class="model-map-group">' +
          '<div class="model-map-group-title">' +
            '<span class="model-map-dot is-blue" aria-hidden="true"></span>' +
            '<span>Seyirci iyonlar</span>' +
          '</div>' +
          '<div class="model-map-group-content">' + spectatorsHTML + '</div>' +
        '</div>' +
        '<div class="model-map-group">' +
          '<div class="model-map-group-title">' +
            '<span class="model-map-dot is-teal" aria-hidden="true"></span>' +
            '<span>Çözücü</span>' +
          '</div>' +
          '<div class="model-map-group-content">' + solventsHTML + '</div>' +
        '</div>' +
        '<div class="model-map-group">' +
          '<div class="model-map-group-title">' +
            '<span class="model-map-dot is-purple" aria-hidden="true"></span>' +
            '<span>Değişmeden kalanlar / katalizör</span>' +
          '</div>' +
          '<div class="model-map-group-content">' + remainingsHTML + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function summary(state){
    var model = data(state), draft = get(state);
    if (!model) return '';
    return roles.map(function(role){
      var labels = model.species.filter(function(p){
        return draft.assignments[p.kind] === role[0];
      }).map(function(p){ return p.label; });
      return labels.length ? role[1] + ': ' + labels.join(', ') : '';
    }).filter(Boolean).join(' · ');
  }

  function dockHTML(state){
    if (!canEnter(state)) return '';
    var model = data(state), draft = get(state);
    if (!model || !model.species || !model.species.length) return '';
    return '<aside class="particle-inspection-model-dock" id="particleInspectionModelDock" aria-label="Tanecik rolleri belirleme">' +
      '<div class="model-dock-bar">' +
        '<div class="model-dock-header">' +
          '<div class="model-dock-title-group">' +
            '<span class="model-dock-badge">5. Model</span>' +
            '<strong class="model-dock-title">Taneciklerin Tepkime İçindeki Rollerini Belirle</strong>' +
          '</div>' +
          '<div class="model-dock-actions">' +
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

  function updateSpeciesFeedback(container, state){
    if (!container) return;
    var model = data(state), draft = get(state);
    if (!model || !model.species) return;
    model.species.forEach(function(p){
      var cards = container.querySelectorAll('[data-species-card="' + esc(p.kind) + '"]');
      cards.forEach(function(card){
        var userVal = draft.assignments[p.kind];
        card.classList.remove('is-correct', 'is-incorrect');
        if (userVal) {
          if (userVal === p.role) {
            card.classList.add('is-correct');
          } else {
            card.classList.add('is-incorrect');
          }
        }
      });
    });
    // Karta sığmayan uzun tanecik sembol ve modelleri için çalışma zamanı koruması:
    container.querySelectorAll('.explanation-species-card').forEach(function(card){
      var visual = card.querySelector('.species-card-visual');
      if (!visual || visual.classList.contains('is-formula-only')) return;
      var sym = visual.querySelector('.species-card-symbol strong');
      var arrow = visual.querySelector('.species-card-arrow');
      var mod = visual.querySelector('.species-card-model');
      if (sym && arrow) {
        var symRect = sym.getBoundingClientRect();
        var arrowRect = arrow.getBoundingClientRect();
        if (symRect.right >= (arrowRect.left - 2)) {
          visual.classList.add('is-formula-only');
          arrow.style.display = 'none';
          if (mod) mod.style.display = 'none';
        }
      }
    });
  }

  function checkDock(state){
    var dock = document.getElementById('particleInspectionModelDock');
    if (dock) updateSpeciesFeedback(dock, state);
  }

  /* ----------------- MODAL POPUPS (CELEBRATION & COMPLETION) ----------------- */
  function getModalsHTML(state, draft) {
    var celebrationModalHTML = '';
    if (draft && draft.showBalancedModal && !state.showCompletionModal) {
      celebrationModalHTML = '<div class="equation-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="equationCelebrationTitle">' +
        '<div class="equation-modal-card is-celebration">' +
          '<button type="button" class="equation-modal-close" data-action="dismissBalancedModal" aria-label="Kapat" title="Kapat">✕</button>' +
          '<div class="equation-modal-badge" aria-hidden="true">🎉</div>' +
          '<h3 id="equationCelebrationTitle" class="equation-modal-title">Denklem Başarıyla Denkleştirildi!</h3>' +
          '<div class="equation-modal-text">' +
            '<p class="equation-modal-message"><strong class="equation-modal-check-pill">✓ Tebrikler!</strong> Atom sayıları ve toplam elektriksel yük tam olarak korunuyor. Denkleminiz denkleştirildi. Şimdi Denklemi Tepkime Koleksiyonunuza Kaydedebilirsiniz.</p>' +
          '</div>' +
          '<div class="equation-modal-actions">' +
            '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-md" data-action="dismissBalancedModal">Denklemi İncele</button>' +
            '<button type="button" class="mebi-btn mebi-btn-primary mebi-btn-md is-ready-to-collect" data-action="saveEquation">' +
              '<span class="mebi-btn-badge">' + window.MebiSVG.icon('grid') + '</span>' +
              '<span>Denklemi Tepkime Koleksiyonuma Kaydet</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    var completionModalHTML = '';
    if (state && state.showCompletionModal) {
      completionModalHTML = '<div class="equation-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="equationCompletionTitle">' +
        '<div class="equation-modal-card is-completion">' +
          '<button type="button" class="equation-modal-close" data-action="dismissCompletionModal" aria-label="Kapat" title="Kapat">✕</button>' +
          '<div class="equation-modal-badge is-saved" aria-hidden="true">' + window.MebiSVG.icon('check') + '</div>' +
          '<h3 id="equationCompletionTitle" class="equation-modal-title">Denklem Koleksiyonunuza Kaydedildi</h3>' +
          '<p class="equation-modal-question">Şimdi ne yapmak istersiniz?</p>' +
          '<div class="equation-modal-actions is-choice-row">' +
            '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-md" data-action="viewCollectionFromCompletion">' +
              '<span class="mebi-btn-badge">' + window.MebiSVG.icon('grid') + '</span>' +
              '<span>Laboratuvar Günlüğünü Görüntüle</span>' +
            '</button>' +
            '<button type="button" class="mebi-btn mebi-btn-primary mebi-btn-md" data-action="startNewExperiment">' +
              '<span class="mebi-btn-badge">' + window.MebiSVG.icon('flask') + '</span>' +
              '<span>Yeni Bir Deney Yap</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    return celebrationModalHTML + completionModalHTML;
  }

  /* ----------------- SUB-VIEW SWITCHER ----------------- */
  function renderViewSwitcher(subView){
    return '<div class="model-view-switcher" role="group" aria-label="5. Model görünüm seçimi">' +
      '<button type="button" class="model-view-btn' + (subView === 'relationships' ? ' is-active' : '') + '" data-action="setModelSubView" data-arg="relationships" title="Tanecik modeli görünümüne geç">' +
        '<span>Tanecik modeli</span>' +
        '<span class="model-view-tick" aria-hidden="true">✓</span>' +
      '</button>' +
      '<span class="model-view-arrow" aria-hidden="true">→</span>' +
      '<button type="button" class="model-view-btn' + (subView === 'equation' ? ' is-active' : '') + '" data-action="setModelSubView" data-arg="equation" title="Kimyasal denklem kurma görünümüne geç">' +
        '<span>Denklem</span>' +
      '</button>' +
    '</div>';
  }

  /* ----------------- EQUATION BUILDER VIEW HTML ----------------- */
  function equationViewHTML(state, model){
    var draft = get(state);
    var eq = draft.equationDraft || { reactants: [], products: [] };
    var cons = calculateConservation(state);

    // Filter species from previous model
    var reactantsPool = model ? model.species.filter(function(p){
      return draft.assignments[p.kind] === 'reactant' || (p.role === 'reactant' && !draft.assignments[p.kind]);
    }).sort(function(a, b){ return sortSpeciesOrder(a, b, state, 'reactants'); }) : [];
    if (!reactantsPool.length && model) {
      reactantsPool = model.species.filter(function(p){ return p.role === 'reactant'; }).sort(function(a, b){ return sortSpeciesOrder(a, b, state, 'reactants'); });
    }

    var productsPool = model ? model.species.filter(function(p){
      var r = draft.assignments[p.kind] || p.role;
      return ['solid','gas','water','other'].indexOf(r) >= 0;
    }).sort(function(a, b){ return sortSpeciesOrder(a, b, state, 'products'); }) : [];

    function renderSourceChips(list, side){
      if (!list.length) return '<span class="equation-empty-chip">—</span>';
      return list.map(function(p){
        return '<button type="button" class="equation-source-chip" draggable="true" data-action="addEquationTerm" data-side="' + side + '" data-kind="' + esc(p.kind) + '" title="' + (side === 'reactants' ? 'Katılanlara ekle' : 'Ürünlere ekle') + '">' +
          '<span class="equation-chip-drag" aria-hidden="true">' +
            '<svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor">' +
              '<circle cx="5" cy="4" r="1.3"/><circle cx="11" cy="4" r="1.3"/>' +
              '<circle cx="5" cy="8" r="1.3"/><circle cx="11" cy="8" r="1.3"/>' +
              '<circle cx="5" cy="12" r="1.3"/><circle cx="11" cy="12" r="1.3"/>' +
            '</svg>' +
          '</span>' +
          '<strong>' + formatFormula(p.label) + '</strong>' +
        '</button>';
      }).join('');
    }

    function renderSideTerms(side, terms){
      var isReactants = (side === 'reactants');
      var placeholderLabel = isReactants ? 'Katılan ekle' : 'Ürün ekle';
      var html = '';

      if (!terms || !terms.length) {
        return '<button type="button" class="equation-add-placeholder is-empty" data-action="quickAddPlaceholder" data-side="' + side + '">' +
          '<span class="equation-add-icon">+</span>' +
          '<span>' + placeholderLabel + '</span>' +
        '</button>';
      }

      html = terms.map(function(term, idx){
        var found = model && model.species && model.species.find(function(p){ return p.kind === term.kind; });
        var sym = found ? found.label : ((window.MebiExplanationModel && window.MebiExplanationModel.symbol && window.MebiExplanationModel.symbol(term.kind)) || term.kind);
        var phaseTag = getSpeciesPhaseTag(found || term.kind, model, state);
        var phaseHTML = phaseTag ? '<sub class="equation-phase">' + phaseTag + '</sub>' : '';
        return '<div class="equation-term-card" data-side="' + side + '" data-index="' + idx + '">' +
          '<div class="equation-coeff-spinner">' +
            '<input type="number" class="coeff-input" min="1" max="99" value="' + (term.coeff || 1) + '" data-side="' + side + '" data-index="' + idx + '" aria-label="' + formatFormula(sym) + ' katsayısı">' +
            '<div class="coeff-arrows">' +
              '<button type="button" class="coeff-arrow coeff-up" data-action="stepEquationCoeff" data-side="' + side + '" data-index="' + idx + '" data-delta="1" aria-label="Katsayıyı arttır">▲</button>' +
              '<button type="button" class="coeff-arrow coeff-down" data-action="stepEquationCoeff" data-side="' + side + '" data-index="' + idx + '" data-delta="-1" aria-label="Katsayıyı azalt">▼</button>' +
            '</div>' +
          '</div>' +
          '<span class="equation-term-formula">' + formatFormula(sym) + phaseHTML + '</span>' +
          '<button type="button" class="equation-term-remove" data-action="removeEquationTerm" data-side="' + side + '" data-index="' + idx + '" aria-label="' + formatFormula(sym) + ' terimini kaldır" title="Terimi kaldır">' +
            '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>' +
          '</button>' +
        '</div>';
      }).join('<span class="equation-plus">+</span>');

      // Add placeholder button at the end
      html += '<span class="equation-plus">+</span>' +
        '<button type="button" class="equation-add-placeholder is-compact" data-action="quickAddPlaceholder" data-side="' + side + '" title="Yeni ' + (isReactants ? 'katılan' : 'ürün') + ' ekle">' +
          '<span class="equation-add-icon">+</span>' +
          '<span>' + placeholderLabel + '</span>' +
        '</button>';

      return html;
    }

    // Auxiliary species line:
    function getAuxSpecies(roleKeys){
      if (!model) return '—';
      var list = model.species.filter(function(p){
        var assigned = draft.assignments[p.kind];
        return roleKeys.indexOf(assigned) >= 0 || (!assigned && roleKeys.indexOf(p.role) >= 0);
      });
      if (!list.length) return '—';
      return list.map(function(p){ return formatFormula(p.label); }).join(', ');
    }
    var spectatorsStr = getAuxSpecies(['spectator']);
    var solventsStr = getAuxSpecies(['solvent']);
    var remainingsStr = getAuxSpecies(['catalyst', 'unchanged']);

    // Guidance text
    var guidanceText = !cons.isComplete
      ? 'Önce denklemini tamamla, sonra katsayıları düzenle.'
      : cons.isBalanced
        ? 'Tebrikler! Atom sayıları ve toplam elektriksel yük tam olarak korunuyor. Denkleminiz denkleştirildi.'
        : 'Türler eklendi; katsayıları düzenleyerek sol ve sağ toplamları eşitle.';

    // Table rows
    var tableRowsHTML = '';
    if (cons.atomRows.length > 0) {
      tableRowsHTML = cons.atomRows.map(function(row){
        var isEq = row.isEqual;
        var pillCls = isEq ? 'is-equal' : 'is-unequal';
        var statusWord = isEq ? 'Eşit' : 'Eşit değil';
        return '<tr>' +
          '<th scope="row" class="equation-el-symbol">' + esc(row.element) + '</th>' +
          '<td><span class="equation-stat-pill ' + pillCls + '" title="' + statusWord + '" aria-label="Sol ' + row.left + ' (' + statusWord + ')">' + row.left + '</span></td>' +
          '<td><span class="equation-stat-pill ' + pillCls + '" title="' + statusWord + '" aria-label="Sağ ' + row.right + ' (' + statusWord + ')">' + row.right + '</span></td>' +
        '</tr>';
      }).join('');
    } else {
      tableRowsHTML = '<tr><td colspan="3" style="text-align:center;color:#64748b;padding:12px;">Henüz tür eklenmedi.</td></tr>';
    }

    // Charge row:
    var chargeEqual = cons.chargeRow.isEqual;
    var chargeCls = chargeEqual ? 'is-equal' : 'is-unequal';
    var chargeStatusWord = chargeEqual ? 'Eşit' : 'Eşit değil';
    var leftChargeStr = (cons.chargeRow.left > 0 ? '+' : '') + cons.chargeRow.left;
    var rightChargeStr = (cons.chargeRow.right > 0 ? '+' : '') + cons.chargeRow.right;

    var chargeRowHTML = '<tr class="is-charge-row">' +
      '<th scope="row" class="equation-el-symbol">Yük</th>' +
      '<td><span class="equation-stat-pill ' + chargeCls + '" title="' + chargeStatusWord + '" aria-label="Sol yük ' + leftChargeStr + ' (' + chargeStatusWord + ')">' + leftChargeStr + '</span></td>' +
      '<td><span class="equation-stat-pill ' + chargeCls + '" title="' + chargeStatusWord + '" aria-label="Sağ yük ' + rightChargeStr + ' (' + chargeStatusWord + ')">' + rightChargeStr + '</span></td>' +
    '</tr>';

    // Status message under table
    var statusIconClass = 'is-warning';
    var statusIconSymbol = '!';
    var statusText = 'Denklem henüz tamamlanmadı.';

    if (draft.equationFeedback && draft.equationFeedback.message) {
      statusText = draft.equationFeedback.message;
      statusIconClass = draft.equationFeedback.error ? 'is-warning' : 'is-success';
      statusIconSymbol = draft.equationFeedback.error ? '!' : '✓';
    } else if (cons.isComplete) {
      if (cons.isBalanced) {
        statusIconClass = 'is-success';
        statusIconSymbol = '✓';
        statusText = 'Atom sayıları ve yükler korunuyor.';
      } else if (cons.chargeEqual && !cons.allAtomsEqual) {
        statusIconClass = 'is-warning';
        statusIconSymbol = '!';
        statusText = 'Yük korunuyor ancak atom sayıları eşit değil.';
      } else if (!cons.chargeEqual && cons.allAtomsEqual) {
        statusIconClass = 'is-warning';
        statusIconSymbol = '!';
        statusText = 'Atomlar korunuyor ancak yükler eşit değil.';
      } else {
        statusIconClass = 'is-warning';
        statusIconSymbol = '!';
        statusText = 'Atom sayıları veya yükler eşit değil.';
      }
    }

    var isReadyToSave = cons.isBalanced && !draft.equationFeedback.error;

    function buildLiveEquationSide(terms, side) {
      if (!terms || !terms.length) {
        return '<span class="equation-live-empty">—</span>';
      }
      var sortedTerms = terms.slice().sort(function(a, b){
        return sortSpeciesOrder(a, b, state, side);
      });
      return sortedTerms.map(function(term){
        var found = model && model.species && model.species.find(function(p){ return p.kind === term.kind; });
        var sym = found ? found.label : ((window.MebiExplanationModel && window.MebiExplanationModel.symbol && window.MebiExplanationModel.symbol(term.kind)) || term.kind);
        var coeff = term.coeff && term.coeff > 1 ? '<span class="equation-live-coeff">' + term.coeff + '</span>' : '';
        var phaseTag = getSpeciesPhaseTag(found || term.kind, model, state);
        var phaseHTML = phaseTag ? '<sub class="equation-phase">' + phaseTag + '</sub>' : '';
        return '<span class="equation-live-term">' + coeff + '<span class="equation-live-formula">' + formatFormula(sym) + phaseHTML + '</span></span>';
      }).join('<span class="equation-live-plus">+</span>');
    }

    var liveReactantsHTML = buildLiveEquationSide(eq.reactants, 'reactants');
    var liveProductsHTML = buildLiveEquationSide(eq.products, 'products');
    var hasAnyTerms = (eq.reactants && eq.reactants.length > 0) || (eq.products && eq.products.length > 0);
    var liveEquationCls = 'equation-live-display' + (cons.isBalanced ? ' is-balanced' : (hasAnyTerms ? ' is-active' : ' is-empty'));

    var liveEquationHTML = '<div class="' + liveEquationCls + '" aria-label="Kimyasal denklem önizlemesi">' +
      '<div class="equation-live-badge-label">Kimyasal Denklem:</div>' +
      '<div class="equation-live-expression">' +
        '<span class="equation-live-side is-reactants">' + liveReactantsHTML + '</span>' +
        '<span class="equation-live-arrow" aria-label="oluşturur">→</span>' +
        '<span class="equation-live-side is-products">' + liveProductsHTML + '</span>' +
      '</div>' +
    '</div>';

    return '<section class="prediction-card explanation-card model-card is-equation-view" id="modelCard" aria-labelledby="modelTitle">' +
      '<header class="learning-card-header model-unified-header">' +
        '<div class="learning-header-copy">' +
          '<div class="prediction-heading arena-stage-heading">' +
            '<span class="prediction-eyebrow">' + window.MebiSVG.icon('beakerIc') + ' 5. Model</span>' +
            '<h1 id="modelTitle">Kimyasal denklemimi kuruyorum</h1>' +
          '</div>' +
          '<p class="prediction-intro">Türleri önceki modelinden seç, denklemini kur ve korunumu kontrol et.</p>' +
        '</div>' +
        '<div class="model-header-tools">' +
          window.MebiObservation.pairHTML(state) +
        '</div>' +
      '</header>' +

      '<div class="prediction-content model-content equation-page-content">' +
        '<!-- 1. ÜST BÖLÜM: ÖNCEKİ MODELİMDEN TÜRLER -->' +
        '<section class="equation-source-box" aria-labelledby="equationSourceTitle">' +
          '<div class="equation-source-meta">' +
            '<strong id="equationSourceTitle" class="equation-source-title">Önceki modelimden</strong>' +
            '<span class="equation-source-hint">Sürükle veya seçip ekle.</span>' +
          '</div>' +
          '<div class="equation-source-divider" aria-hidden="true"></div>' +
          '<div class="equation-source-group">' +
            '<span class="equation-source-label">Katılanlar</span>' +
            '<div class="equation-source-chips" data-source-group="reactants">' +
              renderSourceChips(reactantsPool, 'reactants') +
            '</div>' +
          '</div>' +
          '<div class="equation-source-divider" aria-hidden="true"></div>' +
          '<div class="equation-source-group">' +
            '<span class="equation-source-label">Ürünler</span>' +
            '<div class="equation-source-chips" data-source-group="products">' +
              renderSourceChips(productsPool, 'products') +
            '</div>' +
          '</div>' +
        '</section>' +

        '<!-- 2. ORTA BÖLÜM: DENKLEM TASLAĞI (70%) VE KORUNUM KONTROLÜ (30%) -->' +
        '<div class="equation-middle-split">' +
          '<!-- SOL: DENKLEM TASLAĞIM -->' +
          '<div class="equation-workspace-col">' +
            '<div class="equation-section-header">' +
              '<strong>Denklem taslağım</strong>' +
            '</div>' +
            '<div class="equation-draft-container" id="equationDraftDropzone">' +
              '<div class="equation-draft-row">' +
                '<div class="equation-side is-reactants" data-side="reactants" aria-label="Tepkimeye katılanlar tarafı">' +
                  renderSideTerms('reactants', eq.reactants) +
                '</div>' +
                '<div class="equation-arrow-wrap" aria-label="oluşturur">' +
                  '<span class="equation-arrow-circle">' +
                    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                      '<path d="M5 12h14M13 6l6 6-6 6"/>' +
                    '</svg>' +
                  '</span>' +
                '</div>' +
                '<div class="equation-side is-products" data-side="products" aria-label="Oluşan ürünler tarafı">' +
                  renderSideTerms('products', eq.products) +
                '</div>' +
              '</div>' +
              liveEquationHTML +
              '<div class="equation-action-row">' +
                '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm equation-check-button' + (isReadyToSave ? ' is-balanced' : '') + '" data-action="checkEquation">' +
                  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                    '<polyline points="20 6 9 17 4 12"></polyline>' +
                  '</svg>' +
                  '<span>Denklemi kontrol et</span>' +
                '</button>' +
                (draft.error && draft.equationFeedback && draft.equationFeedback.error && draft.equationFeedback.message
                  ? '<span class="equation-inline-error" style="display:inline-flex;align-items:center;gap:6px;color:#dc2626;font-size:12.5px;font-weight:600;background:#fef2f2;border:1px solid #fecaca;padding:5px 12px;border-radius:8px;">' +
                      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>' +
                      '<span>' + draft.equationFeedback.message + '</span>' +
                    '</span>'
                  : '') +
              '</div>' +
            '</div>' +
            '<div class="equation-aux-summary">' +
              '<span class="equation-aux-item">Seyirci: <strong>' + spectatorsStr + '</strong></span>' +
              '<span class="equation-aux-sep">·</span>' +
              '<span class="equation-aux-item">Çözücü: <strong>' + solventsStr + '</strong></span>' +
              '<span class="equation-aux-sep">·</span>' +
              '<span class="equation-aux-item">Değişmeden kalan: <strong>' + remainingsStr + '</strong></span>' +
            '</div>' +
          '</div>' +

          '<div class="equation-split-divider" aria-hidden="true"></div>' +

          '<!-- SAĞ: KORUNUM KONTROLÜ TABLOSU -->' +
          '<div class="equation-conservation-col">' +
            '<div class="equation-section-header">' +
              '<strong>Korunum kontrolü</strong>' +
            '</div>' +
            '<div class="equation-conservation-table-card">' +
              '<div class="equation-table-scroll">' +
                '<table class="equation-conservation-table" aria-label="Atom ve yük korunum kontrolü tablosu">' +
                  '<thead>' +
                    '<tr>' +
                      '<th scope="col">Tür</th>' +
                      '<th scope="col">Sol</th>' +
                      '<th scope="col">Sağ</th>' +
                    '</tr>' +
                  '</thead>' +
                  '<tbody>' +
                    tableRowsHTML +
                    chargeRowHTML +
                  '</tbody>' +
                '</table>' +
              '</div>' +
              (!cons.isBalanced && statusText ? ('<div class="equation-conservation-status">' +
                '<span class="equation-status-icon ' + statusIconClass + '" aria-hidden="true">' + statusIconSymbol + '</span>' +
                '<span class="equation-status-text">' + statusText + '</span>' +
              '</div>') : '') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<footer class="prediction-footer explanation-footer">' +
        '<div id="modelFeedback" class="explanation-feedback">' +
          '<p id="modelStatus" role="status" aria-live="polite">' + (draft.storageError ? 'Bu oturumda korunuyor; tarayıcıya kaydedilemedi.' : '') + '</p>' +
        '</div>' +
        '<div class="prediction-actions">' +
          '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="setModelSubView" data-arg="relationships">← Tanecik modelime dön</button>' +
          (isReadyToSave
            ? '<button type="button" class="mebi-btn mebi-btn-primary mebi-btn-sm is-ready-to-collect" data-action="saveEquation">Denklemi Tepkime Koleksiyonuma Kaydet</button>'
            : '<button type="button" class="mebi-btn mebi-btn-primary mebi-btn-sm" data-action="checkEquation" disabled aria-disabled="true" title="Önce denkleminizi kurup atom ve yük korunumunu sağlayın">Denklemi Tepkime Koleksiyonuma Kaydet</button>') +
        '</div>' +
      '</footer>' +
      getModalsHTML(state, draft) +
    '</section>';
  }

  /* ----------------- MAIN RENDER DISPATCHER ----------------- */
  function render(state){
    if (window.MebiNonReaction && window.MebiNonReaction.scenario(state)) return window.MebiNonReaction.renderModel(state);
    var model = data(state), draft = get(state);

    if (draft.subView === 'equation') {
      return equationViewHTML(state, model);
    }

    var helpBox = '<details class="explanation-help" open><summary id="modelStepTitle" tabindex="-1">Rolleri ayırt ederken nelere bakmalıyım?</summary><p>Katı tepkeni başlangıçta serbest iyon gibi gösterme. Çözeltide kalan her tanecik seyirci değildir; artan tepken ve katalizörü ayırt et. Oluşan suyu çözücü sudan, katı iyonik örgüyü molekülün bağ yapısından ayır.</p></details>';
    var toEquationBtn = '<button type="button" data-action="setModelSubView" data-arg="equation" class="mebi-btn mebi-btn-secondary mebi-btn-sm">Denklemimi Kur →</button>';

    return '<section class="prediction-card explanation-card model-card" id="modelCard" aria-labelledby="modelTitle">' +
      '<header class="learning-card-header model-unified-header">' +
        '<div class="learning-header-copy">' +
          '<div class="prediction-heading arena-stage-heading">' +
            '<span class="prediction-eyebrow">' + window.MebiSVG.icon('beakerIc') + ' 5. Model</span>' +
            '<h1 id="modelTitle">Tanecikleri ilişkilendiriyorum</h1>' +
          '</div>' +
          '<p class="prediction-intro">Hangi tanecikler tepkimeye katıldı, neler oluştu, hangileri değişmeden kaldı?</p>' +
        '</div>' +
        '<div class="model-header-tools">' +
          window.MebiObservation.pairHTML(state) +
        '</div>' +
      '</header>' +
      '<div class="prediction-content model-content">' +
        '<section class="explanation-work">' +
          (model
            ? '<div class="explanation-species">' +
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
              '<div class="model-desk-action-wrap">' +
                '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm model-desk-action-btn is-attention-glowing" data-action="openParticleInspection" data-arg="before">' +
                  window.MebiSVG.icon('eye') + '<span>Tanecik İlişkilendirmeni Deney Masasında Yap</span>' +
                '</button>' +
              '</div>' +
              '<div class="model-relationship-caption-row">' +
                '<span class="model-caption-title">Benim tanecik ilişkim</span>' +
              '</div>' +
              '<div class="explanation-map" id="modelMap">' + mapHTML(state, model) + '</div>'
            : '<p role="status">Tanecik modeli hazırlanıyor…</p>') +
        '</section>' +
      '</div>' +
      '<footer class="prediction-footer explanation-footer">' +
        '<div id="modelFeedback" class="explanation-feedback">' +
          '<span class="explanation-error-icon" aria-hidden="true">!</span>' +
          '<p id="modelStatus" role="status" aria-live="polite"></p>' +
        '</div>' +
        '<div class="prediction-actions">' +
          '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="backToExplanation">← Açıklamama Dön</button>' +
          '<button type="button" class="mebi-btn mebi-btn-primary mebi-btn-sm" data-action="saveModelAndToEquation" id="saveModelToEquationBtn">Tanecik Modelini Kaydet ve Denklemi Kur →</button>' +
        '</div>' +
      '</footer>' +
      '<div id="modelHelpModal" class="model-info-modal-overlay is-hidden" role="dialog" aria-modal="true" aria-labelledby="modelHelpTitle">' +
        '<div class="model-info-modal-card">' +
          '<header class="model-info-modal-header">' +
            '<div class="model-info-modal-title-group">' +
              '<span class="model-info-icon" aria-hidden="true">💡</span>' +
              '<h2 id="modelHelpTitle">Rolleri ayırt ederken nelere bakmalıyım?</h2>' +
            '</div>' +
            '<button type="button" class="model-info-close" data-action="closeModelHelpModal" aria-label="Bilgi kartını kapat" title="Kapat">×</button>' +
          '</header>' +
          '<div class="model-info-modal-body">' +
            '<p>Katı tepkeni başlangıçta serbest iyon gibi gösterme. Çözeltide kalan her tanecik seyirci değildir; artan tepken ve katalizörü ayırt et. Oluşan suyu çözücü sudan, katı iyonik örgüyü molekülün bağ yapısından ayır.</p>' +
          '</div>' +
          '<footer class="model-info-modal-footer">' +
            '<button type="button" class="mebi-btn mebi-btn-primary mebi-btn-sm" data-action="closeModelHelpModal">Anladım, Tamam</button>' +
          '</footer>' +
        '</div>' +
      '</div>' +
      getModalsHTML(state, draft) +
    '</section>';
  }

  /* ----------------- EVENT WIRING ----------------- */
  function wire(state){
    if (window.MebiNonReaction && window.MebiNonReaction.scenario(state)) return;
    var host = document.getElementById('modelCard');
    if (!host) return;
    var draft = get(state);

    // 1. Role dropdowns in relationship view:
    updateSpeciesFeedback(host, state);

    var deskBtn = host.querySelector('.model-desk-action-btn');
    if (deskBtn) {
      deskBtn.classList.remove('is-attention-glowing');
      void deskBtn.offsetWidth;
      deskBtn.classList.add('is-attention-glowing');
      setTimeout(function(){
        if (deskBtn) deskBtn.classList.remove('is-attention-glowing');
      }, 5000);
    }

    host.querySelectorAll('[data-model-species]').forEach(function(select){
      select.addEventListener('change', function(){
        if (assign(state, select.dataset.modelSpecies, select.value)) {
          var mapEl = document.getElementById('modelMap');
          if (mapEl) mapEl.innerHTML = mapHTML(state, data(state));
          updateSpeciesFeedback(host, state);
          var dock = document.getElementById('particleInspectionModelDock');
          if (dock) updateSpeciesFeedback(dock, state);
          status(state);
        }
      });
    });

    // 2. Drag and drop for equation view:
    host.querySelectorAll('.equation-source-chip[draggable="true"]').forEach(function(chip){
      chip.addEventListener('dragstart', function(e){
        var side = chip.dataset.side;
        var kind = chip.dataset.kind;
        chip.classList.add('is-dragging');
        if (e.dataTransfer) {
          e.dataTransfer.setData('text/plain', JSON.stringify({ side: side, kind: kind }));
          e.dataTransfer.effectAllowed = 'copy';
        }
      });
      chip.addEventListener('dragend', function(){
        chip.classList.remove('is-dragging');
      });
    });

    var dropzones = host.querySelectorAll('.equation-side');
    dropzones.forEach(function(zone){
      zone.addEventListener('dragover', function(e){
        e.preventDefault();
        zone.classList.add('is-drop-active');
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      });
      zone.addEventListener('dragleave', function(){
        zone.classList.remove('is-drop-active');
      });
      zone.addEventListener('drop', function(e){
        e.preventDefault();
        zone.classList.remove('is-drop-active');
        var dataStr = e.dataTransfer ? e.dataTransfer.getData('text/plain') : null;
        if (!dataStr) return;
        try {
          var payload = JSON.parse(dataStr);
          var targetSide = zone.dataset.side || payload.side;
          if (payload.kind && targetSide) {
            addTerm(state, targetSide, payload.kind);
            if (window.TepkimeArenasi && window.TepkimeArenasi.render) {
              window.TepkimeArenasi.render(false);
            }
          }
        } catch(err){}
      });
    });

    // 3. Numeric input change:
    host.querySelectorAll('.coeff-input').forEach(function(inp){
      inp.addEventListener('change', function(){
        var side = inp.dataset.side;
        var idx = parseInt(inp.dataset.index, 10);
        var val = parseInt(inp.value, 10) || 1;
        setCoefficient(state, side, idx, val);
        if (window.TepkimeArenasi && window.TepkimeArenasi.render) {
          window.TepkimeArenasi.render(false);
        }
      });
    });

    // Auto-open help modal after 1.5s if not yet shown:
    if (draft.subView !== 'equation' && !draft.helpPopupShown) {
      if (state.modelHelpTimeout) clearTimeout(state.modelHelpTimeout);
      state.modelHelpTimeout = setTimeout(function(){
        var modal = document.getElementById('modelHelpModal');
        if (modal && !draft.helpPopupShown && draft.subView !== 'equation') {
          modal.classList.remove('is-hidden');
        }
      }, 1500);
    }

    status(state);
  }

  window.MebiModel = {
    canEnter: canEnter,
    get: get,
    render: render,
    wire: wire,
    check: check,
    checkDock: checkDock,
    updateSpeciesFeedback: updateSpeciesFeedback,
    save: save,
    persist: persist,
    summary: summary,
    validate: validate,
    assign: assign,
    dockHTML: dockHTML,
    setSubView: setSubView,
    addTerm: addTerm,
    removeTerm: removeTerm,
    setCoefficient: setCoefficient,
    stepCoefficient: stepCoefficient,
    clearEquation: clearEquation,
    quickAddPlaceholder: quickAddPlaceholder,
    calculateConservation: calculateConservation,
    checkEquation: checkEquation,
    saveEquation: saveEquation,
    data: data
  };
})(window);
