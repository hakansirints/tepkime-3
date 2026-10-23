/**
 * Tepkime Arenası - Uygulama ve Deney Motoru (app.js)
 * Tahmin, deney, gözlem ve taneciklere dayalı açıklama akışı.
 */

(function(window) {
  'use strict';

  /* ----------------- 1. UYGULAMA DURUMU (APPLICATION STATE) ----------------- */
  var S = {
    screen: 'menu',
    headerCollapsed: false,
    stageReview: null,
    particleInspection: null,
    explanationReview: null,
    isFilling: false,
    reagentPanelCollapsed: false,
    labSettingsOpen: false,
    labView: 'wide', // desk | wide
    labLighting: 'light',
    tableColor: '#3d4547',
    searchQuery: '',
    categoryFilter: 'all',
    selectedSlot1: null,
    selectedSlot2: null,
    pendingRepeatPair: null,
    activeReaction: null,
    prediction: [],
    labStep: 'predict', // predict | predictionSaved | ready | pouring | reacting | observed
    poured: false,
    currentTemp: 22.0,
    resumeScreen: null, // lab | card | pool
    resumeLabStep: null, // predict | ready | pouring | reacting | observed
    collection: []
  };

  try {
    S.labLighting = localStorage.getItem('three-faces-laboratory-lighting') || 'light';
    S.tableColor = localStorage.getItem('three-faces-table-color') || '#3d4547';
  } catch (e) {}

  window.MebiPrediction.reset(S);
  window.MebiExperiment.reset(S, false);
  window.MebiObservation.reset(S);
  var HISTORY = [];
  function fitStageHeader() {
    if (window.LabScene && window.LabScene.refreshLayout) window.LabScene.refreshLayout();
  }
  var fillToken = 0;
  function highlightSettingsGearOnce() {
    try {
      if (sessionStorage.getItem('mebi_settings_gear_highlighted')) return;
      sessionStorage.setItem('mebi_settings_gear_highlighted', 'true');
      setTimeout(function() {
        var triggers = document.querySelectorAll('.lab-settings-trigger');
        triggers.forEach(function(btn) {
          btn.classList.add('gear-attention-highlight');
        });
        setTimeout(function() {
          triggers.forEach(function(btn) {
            btn.classList.remove('gear-attention-highlight');
          });
        }, 5000);
      }, 450);
    } catch (e) {}
  }
  function enterPredictionScreen() {
    if (!S.selectedSlot1 || !S.selectedSlot2) return false;
    S.activeReaction = window.MebiData.getReaction(S.selectedSlot1, S.selectedSlot2);
    S.particleInspection = null;
    window.MebiPrediction.reset(S);
    window.MebiExperiment.reset(S, false);
    window.MebiObservation.reset(S);
    S.labStep = 'predict';
    S.poured = false;
    S.currentTemp = S.activeReaction.tempInit;







    S.screen = 'lab';
    S.reagentPanelCollapsed = true;
    highlightSettingsGearOnce();
    return true;
  }
  function finishSelection() {
    ++fillToken;
    S.isFilling = false;
    render(false);
  }

  // Koleksiyonu yerel depolamadan yükle
  try {
    var savedCol = localStorage.getItem('tepkime_arenasi_collection');
    if (savedCol) {
      S.collection = JSON.parse(savedCol);
    }
  } catch (e) {
    S.collection = [];
  }

  function saveCollectionToStorage() {
    try {
      localStorage.setItem('tepkime_arenasi_collection', JSON.stringify(S.collection));
      return true;
    } catch (e) { return false; }
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ----------------- 2. TOPBAR VE STEPPER HTML ----------------- */
  function topbarHTML(showNav, stage) {
    var totalDiscovered = S.collection.filter(function(item){return item.reaction!==false;}).length;
    var totalReactions = 36; // Aktif kimyasal tepkime sayısı
    var pct = Math.min(100, Math.round((totalDiscovered / totalReactions) * 100));

    var isAudio = window.MebiAudio ? window.MebiAudio.isEnabled() : true;
    var isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    var curTheme = document.documentElement.getAttribute('data-theme') || 'light';
    var gearIcon = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="3"></circle>' +
      '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>' +
    '</svg>';

    var showLabSettings = true;
    var settingsHTML = showLabSettings ? '<div class="lab-settings-wrap">' +
      '<button class="mebi-btn-icon mebi-btn-secondary lab-settings-trigger" data-action="toggleLabSettings" aria-expanded="' + S.labSettingsOpen + '" aria-controls="labSettingsPanel" title="Ayarlar" aria-label="Ayarlar">' +
        gearIcon +
      '</button>' +
      '<section id="labSettingsPanel" class="lab-settings-panel" aria-label="Ayarlar"' + (S.labSettingsOpen ? '' : ' hidden') + '>' +
        '<div class="lab-settings-heading"><strong>⚙️ Ayarlar</strong><button type="button" data-action="closeLabSettings" aria-label="Ayarları kapat">×</button></div>' +

        '<div class="lab-settings-section lab-settings-quick-grid">' +
          '<button type="button" class="lab-settings-btn-tile" data-action="toggleAudio" title="Sesi Aç / Kapat" aria-pressed="' + isAudio + '">' +
            '<span>' + (isAudio ? '🔊' : '🔇') + '</span><small>' + (isAudio ? 'Ses Açık' : 'Ses Kapalı') + '</small>' +
          '</button>' +
          '<button type="button" class="lab-settings-btn-tile" data-action="toggleFullscreen" title="Tam Ekran" aria-pressed="' + isFs + '">' +
            '<span>' + (isFs ? '🗗' : '⛶') + '</span><small>' + (isFs ? 'Küçült' : 'Tam Ekran') + '</small>' +
          '</button>' +
          '<button type="button" class="lab-settings-btn-tile" data-action="toggleTheme" title="Temayı Değiştir" aria-pressed="' + (curTheme === 'dark') + '">' +
            '<span>' + (curTheme === 'dark' ? '🌙' : '☀️') + '</span><small>' + (curTheme === 'dark' ? 'Karanlık' : 'Aydınlık') + '</small>' +
          '</button>' +
        '</div>' +

        '<div class="lab-settings-section"><span class="lab-settings-label">Kamera Bakış Açısı</span><div class="lab-settings-views" role="group" aria-label="Kamera bakış açısı">' +
          [['desk','Masa'],['wide','Oda']].map(function(view) { return '<button type="button" data-action="setLabView" data-arg="' + view[0] + '" aria-pressed="' + (S.labView === view[0]) + '">' + view[1] + '</button>'; }).join('') +
        '</div></div>' +

        '<div class="lab-settings-section"><span class="lab-settings-label">Laboratuvar Ortamı</span>' +
          '<button type="button" class="lab-settings-light" data-action="toggleLabLighting" aria-pressed="' + (S.labLighting === 'dark') + '">' + (S.labLighting === 'dark' ? '☾ Ortam: Karanlık' : '☀ Ortam: Aydınlık') + '</button>' +
        '</div>' +
        '<div class="lab-settings-section"><span class="lab-settings-label">Masa Rengi</span><div class="lab-settings-colors" role="group" aria-label="Masa rengi">' +
          [['#466455','Yeşil'],['#3d4547','Antrasit'],['#fff2d7','Açık']].map(function(color) { return '<button type="button" data-action="setTableColor" data-arg="' + color[0] + '" aria-pressed="' + (S.tableColor.toLowerCase() === color[0]) + '"><span style="--swatch:' + color[0] + '"></span>' + color[1] + '</button>'; }).join('') +
        '</div></div>' +
      '</section></div>' : '';
      var toolsHTML = settingsHTML +
        '<button class="mebi-btn mebi-btn-secondary mebi-btn-sm mebi-btn-icon-only' + (S.screen === 'collection' ? ' is-active' : '') + '" data-action="goCollection" title="Tepkime Koleksiyonum (' + totalDiscovered + ')" aria-label="Tepkime Koleksiyonum">' +
          '<span class="mebi-btn-badge">' + window.MebiSVG.icon('grid') + '</span>' +
        '</button>' +
        '<button class="mebi-btn mebi-btn-secondary mebi-btn-sm mebi-btn-icon-only" data-action="openGuideDrawer" title="Laboratuvar Rehberi" aria-label="Rehber">' +
          '<span class="mebi-btn-badge">' + window.MebiSVG.icon('helpCircle') + '</span>' +
        '</button>';

      var progressHTML = '<div class="mebi-progress-wrapper" title="Keşfedilen Tepkimeler: ' + totalDiscovered + ' / ' + totalReactions + ' (%' + pct + ')">' +
          '<span class="mebi-progress-star">' + window.MebiSVG.icon('star') + '</span>' +
          '<span class="mebi-progress-count">' + totalDiscovered + ' / ' + totalReactions + '<span class="mebi-progress-caption"> Keşif</span></span>' +
          '<div class="mebi-progress-bar-mini" role="progressbar" aria-label="Keşfedilen tepkimeler" aria-valuemin="0" aria-valuemax="' + totalReactions + '" aria-valuenow="' + totalDiscovered + '">' +
            '<div class="mebi-progress-fill-mini" style="width:' + pct + '%;"></div>' +
          '</div>' +
          '<span class="mebi-progress-percent">%' + pct + '</span>' +
        '</div>';
      return '<div class="mebi-top-shell has-stage is-header-compact is-unified-header' + (S.headerCollapsed ? ' is-stages-minimized' : '') + '">' + stepperHTML(stage || 'pool', toolsHTML, progressHTML) + '</div>';
  }

  function stepperHTML(step, toolsHTML, progressHTML) {
    var steps = [
      { key: 'pool', label: 'Seç' },
      { key: 'predict', label: 'Tahmin' },
      { key: 'reacting', label: 'Deney' },
      { key: 'card', label: 'Açıkla' },
      { key: 'model', label: 'Model' }
    ];
    var order = { pool: 0, predict: 1, predictionSaved: 1, ready: 2, pouring: 2, reacting: 2, observed: 2, card: 3, model: 4 };
    var available = availableStageIndex(), busy = stageNavigationBusy();
    var minimized = S.headerCollapsed;
    var idx = S.stageReview ? order[S.stageReview] : (order[step] || 0);
    var pctLine = (idx / (steps.length - 1)) * 100;

    var html = '<div class="mebi-stepper">' +
      '<div class="mebi-stepper-track" id="stageMainHeader"' + (minimized ? ' hidden' : '') + '>' +
        '<div class="mebi-step-line">' +
          '<div class="mebi-step-line-fill" style="width:' + pctLine + '%;"></div>' +
        '</div>';

    for (var i = 0; i < steps.length; i++) {
      var isDone = i < idx;
      var isActive = i === idx;
      var itemCls = isDone ? 'is-done' : (isActive ? 'is-active' : '');

      var enabled = i <= available && !busy;
      html += '<button type="button" class="mebi-step-item ' + itemCls + '" data-action="navigateStage" data-arg="' + i + '" title="' + (enabled ? steps[i].label + ' aşamasını aç' : busy ? 'Aktarım ve gözlem bekleme süresi bitince aşamalar açılır' : 'Önce önceki aşamaları tamamla') + '"' + (enabled ? '' : ' disabled') + (isActive ? ' aria-current="step"' : '') + '>' +
        '<div class="mebi-step-node">' +
          (isDone ? window.MebiSVG.icon('check') : (i + 1)) +
        '</div>' +
        '<div class="mebi-step-label">' + steps[i].label + '</div>' +
      '</button>';
    }

    html += '</div>' +
      progressHTML +
      (toolsHTML ? '<div class="mebi-stepper-inline-tools">' + toolsHTML + '</div>' : '') +
      '<button type="button" class="mebi-stage-toggle' + (minimized ? '' : ' is-compact') + '" data-action="toggleStageHeader" aria-controls="stageMainHeader" aria-expanded="' + !minimized + '" title="' + (minimized ? 'Aşamaları göster' : 'Aşamaları daralt') + '" aria-label="' + (minimized ? 'Aşamaları göster' : 'Aşamaları daralt') + '">' + window.MebiSVG.icon('down') + '</button>' +
    '</div>';
    return html;
  }
  function stageIndex() {
    if (S.screen === 'model' || S.screen === 'collection' && S.resumeScreen === 'model') return 4;
    if (S.explanationReview && S.screen === 'lab') return 3;
    if (S.particleInspection && S.particleInspection.returnScreen === 'model') return 4;
    if (S.particleInspection && S.particleInspection.returnScreen === 'card') return 3;
    if (S.screen === 'collection') return S.resumeScreen === 'card' ? 3 : S.resumeScreen === 'lab' ? 2 : 0;
    return S.screen === 'card' ? 3 : S.screen === 'lab' ? (/^(predict|predictionSaved)$/.test(S.labStep) ? 1 : 2) : 0;
  }
  function availableStageIndex() { return Math.max(stageIndex(),window.MebiModel.canEnter(S)?4:0); }
  function stageNavigationBusy() {
    return !!(S.experiment && (S.experiment.mode !== 'idle' || S.experiment.safetyOpen)) || /^(pouring|reacting)$/.test(S.labStep);
  }
  function stageReviewHTML() {
    if (S.stageReview === 'pool') {
      var html = reagentGalleryHTML().replace(/data-action="clickReagent"/g,'disabled data-action="clickReagent"').replace(/id="poolSearchInput"/,'disabled id="poolSearchInput"').replace(/data-action="setFilter"/g,'disabled data-action="setFilter"');
      return topbarHTML(true,'pool') + html.replace(/<div class="gallery-actions">[\s\S]*?<\/div><\/footer>/,'<div class="gallery-actions"><button class="gallery-clear" data-action="changeReactants">Yeni Maddeler Seç</button><button class="gallery-continue" data-action="closeStageReview">Kaldığım Aşamaya Dön</button></div></footer>');
    }
    return topbarHTML(true,'predict') + window.MebiPrediction.reviewHTML(S);
  }

  /* ----------------- 3. EKRANLAR (SCREENS) ----------------- */

  // EKRAN 1: AÇILIŞ MENÜSÜ (Görseldeki Mint Kimya Temalı 16:9 Yatay Kart)
  function entranceIcon(name) {
    return '<span class="entrance-icon" style="--entrance-icon:url(../assets/icons/phosphor/' + name + '.svg?v=02f5093fd7f5)"></span>';
  }

  function screenMenu() {
    var steps = [
      ['Maddeleri seç', 'flask'],
      ['Tahmin et ve gerekçelendir', 'chats-circle'],
      ['Karıştır', 'test-tube'],
      ['Gözle ve açıkla', 'eye'],
      ['Tanecikleri ilişkilendir', 'graph']
    ];
    var actions = [
      ['goPool', 'Arenaya Gir ve Deneye Başla', 'flask', 'is-primary'],
      ['goCollection', 'Tepkime Koleksiyonum', 'graph', 'is-white'],
      ['openGuideDrawer', 'Laboratuvar Rehberi', 'book-open', 'is-white']
    ];
    return '<section class="mebi-card arena-menu-card entrance-card" aria-labelledby="entranceTitle">' +
      '<div class="entrance-overview"><header class="entrance-brand">' +
        '<span class="entrance-brand-icon" aria-hidden="true">' + entranceIcon('flask') + '</span>' +
        '<div><h1 id="entranceTitle">Tepkime Arenası</h1>' +
        '<p>Kimyasal maddeleri seç, deney masasında birleştirerek değişimi tahmin et</p></div>' +
      '</header><ol class="entrance-journey">' + steps.map(function(step, index) {
        return '<li class="entrance-step entrance-step-' + (index + 1) + '">' +
          '<span class="entrance-step-number" aria-hidden="true">' + (index + 1) + '</span>' +
          '<span class="entrance-step-icon" aria-hidden="true">' + entranceIcon(step[1]) + '</span>' +
          '<span class="entrance-step-label">' + step[0] + '</span></li>';
      }).join('') + '</ol></div>' +
      '<nav class="entrance-menu" aria-label="Giriş menüsü">' + actions.map(function(action) {
        return '<button type="button" class="arena-mint-pill-btn ' + action[3] + '" data-action="' + action[0] + '"' +
          (action[0] === 'goPool' ? ' data-arg="fromMenu"' : '') + '>' +
          '<span class="pill-btn-icon-wrap mint-icon" aria-hidden="true">' + entranceIcon(action[2]) + '</span>' +
          '<span class="pill-btn-text">' + action[1] + '</span></button>';
      }).join('') + '<button type="button" class="arena-mint-reset-link" data-action="resetExperiment">Sıfırla</button></nav>' +
      '</section>';
  }

  // EKRAN 2: MADDE HAVUZU (POOL)
  function reagentPanelHTML() {
    var locked = S.screen !== 'pool';
    var selectionComplete = !!(S.selectedSlot1 && S.selectedSlot2);
    var compactSelection = selectionComplete && S.reagentPanelCollapsed;
    var q = window.MebiData.foldTR(S.searchQuery);
    var cards = window.MebiData.REAGENTS.filter(function(r) {
      if (compactSelection) return r.id === S.selectedSlot1 || r.id === S.selectedSlot2;
      return (S.categoryFilter === 'all' || r.category === S.categoryFilter) &&
        (compactSelection || !q || window.MebiData.foldTR(r.name + ' ' + r.f).indexOf(q) !== -1);
    }).map(function(r) {
      var slot = S.selectedSlot1 === r.id ? 1 : (S.selectedSlot2 === r.id ? 2 : 0);
      var stateText = r.solid ? 'Katı' : 'Çözelti';
      var stateClass = r.solid ? 'is-solid' : 'is-solution';
      return '<button type="button" class="lab-reagent-card chem-' + esc(r.category) + (slot ? ' is-selected' : '') + (r.solid ? ' is-solid' : ' is-liquid') +
        '" data-action="clickReagent" data-arg="' + esc(r.id) + '" aria-pressed="' + !!slot + '" ' + (locked ? 'disabled' : '') + '>' +
        '<div class="lab-card-badges">' +
          '<span class="lab-card-state ' + stateClass + '">' + stateText + '</span>' +
          (slot ? '<span class="lab-slot-badge">' + slot + '</span>' : '') +
        '</div>' +
        '<span class="lab-card-copy"><strong>' + esc(r.f) + '</strong><span>' + esc(r.name) + '</span>' +
        '<small>' + (r.solid ? 'Beyaz katı toz' : (r.id === 'Cu(NO3)2' ? 'Mavi sulu çözelti' : 'Renksiz sulu çözelti')) + '</small></span>' +
        '</button>';
    }).join('');
    return '<aside class="lab-reagent-panel' + (S.reagentPanelCollapsed ? ' is-collapsed' : '') + (compactSelection ? ' has-selection-summary' : '') + ((!S.selectedSlot1 || !S.selectedSlot2) ? ' needs-selection' : '') + '" aria-label="Madde kartları">' +
      '<div class="lab-panel-heading"><button type="button" class="lab-panel-toggle" data-action="toggleReagentPanel" aria-controls="reagentPanelContent" aria-expanded="' + !S.reagentPanelCollapsed + '"><span>Maddelerini seç</span><span class="panel-chevron" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="m5.5 12.5 4.5-4.5 4.5 4.5"/></svg></span></button>' +
      '<p class="lab-panel-hint">' + (locked ? 'Deney hazırlanmış durumda. Yeni deney için tepkenleri değiştir.' : 'İlk kart 1. behere, ikinci kart 2. behere doldurulur.') + '</p></div>' +
      '<div id="reagentPanelContent" class="lab-panel-content"' + (S.reagentPanelCollapsed && !compactSelection ? ' hidden' : '') + '>' +
      (compactSelection ? '<div class="lab-selection-summary-label">Seçilen maddeler</div>' : '<input id="poolSearchInput" class="lab-card-search" aria-label="Madde ara" placeholder="Ad veya formül ara" value="' + esc(S.searchQuery) + '" ' + (locked ? 'disabled' : '') + '>' +
      '<div class="lab-card-filters" aria-label="Madde kategorisi">' +
      [['all','Tümü'],['acid','Asit'],['base','Baz'],['salt','Tuz']].map(function(f) {
        return '<button type="button" data-action="setFilter" data-arg="' + f[0] + '" aria-pressed="' + (S.categoryFilter === f[0]) + '">' + f[1] + '</button>';
      }).join('') + '</div>') + '<div class="lab-reagent-list">' + (cards || '<p>Bu aramada madde bulunamadı.</p>') + '</div>' +
      (compactSelection && locked ? '<div class="lab-panel-footer lab-change-reactants"><button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm new-experiment-btn" data-action="changeReactants">' + window.MebiSVG.icon('undo') + '<span>Tepkenleri Değiştir</span></button></div>' : '') +
      (compactSelection ? '' : '<div class="lab-panel-footer"><span>' + ((S.selectedSlot1 ? 1 : 0) + (S.selectedSlot2 ? 1 : 0)) + ' / 2 madde seçildi</span>' +
      '<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="resetPool" title="Seçimleri temizle">Temizle</button></div>') + '</div></aside>';
  }

  function labSettingsHTML() { return ''; }

  function savedPairExists(first, second) {
    if (!first || !second || first === second) return false;
    function reagentId(value) {
      var reagent = window.MebiData.REAGENTS.find(function(r) { return r.id === value || r.f === value; });
      return reagent && reagent.id;
    }
    return S.collection.some(function(item) {
      if (!item || typeof item !== 'object') return false;
      var values = typeof item.pair === 'string' ? item.pair.split('|') : [];
      if (values.length !== 2 || !reagentId(values[0]) || !reagentId(values[1])) values = [item.r1, item.r2];
      var a = reagentId(values[0]), b = reagentId(values[1]);
      return a === first && b === second || a === second && b === first;
    });
  }

  function focusReagent(id) {
    var cards = document.querySelectorAll('.reagent-gallery-card');
    for (var i = 0; i < cards.length; i++) if (cards[i].getAttribute('data-arg') === id) { cards[i].focus({preventScroll:true}); break; }
  }

  function selectReagent(id) {
    if (window.MebiAudio) window.MebiAudio.playClick();
    if (S.selectedSlot1 === id) S.selectedSlot1 = null;
    else if (S.selectedSlot2 === id) S.selectedSlot2 = null;
    else if (!S.selectedSlot1) S.selectedSlot1 = id;
    else S.selectedSlot2 = id;
    S.reagentPanelCollapsed = false;
    finishSelection();
  }

  function repeatPairDialogHTML() {
    var pending = S.pendingRepeatPair;
    if (!pending || S.screen !== 'pool') return '';
    var anchor = window.MebiData.getReagent(pending.first || pending.second);
    var candidate = window.MebiData.getReagent(pending.candidate);
    return '<dialog id="repeatPairDialog" class="gallery-repeat-dialog" aria-labelledby="repeatPairTitle" aria-describedby="repeatPairDescription">' +
      '<h2 id="repeatPairTitle">Bu madde çiftiyle daha önce deney yaptın</h2>' +
      '<p class="gallery-repeat-formulas">' + esc(anchor.f) + ' + ' + esc(candidate.f) + '</p>' +
      '<p id="repeatPairDescription">Bu madde çiftiyle yaptığın deney Tepkime Koleksiyonuna kaydedilmiş. Aynı maddelerle yeniden deney yapmak istiyor musun?</p>' +
      '<div class="gallery-repeat-actions"><button type="button" class="mebi-btn mebi-btn-secondary" data-action="cancelRepeatPair" autofocus>Vazgeç</button>' +
      '<button type="button" class="mebi-btn mebi-btn-primary" data-action="confirmRepeatPair">Evet, yeniden deney yap</button></div></dialog>';
  }

  function reagentGalleryHTML() {
    var q = window.MebiData.foldTR(S.searchQuery);
    var anchor = S.selectedSlot1 || S.selectedSlot2;
    var cards = window.MebiData.REAGENTS.filter(function(r) {
      return (S.categoryFilter === 'all' || r.category === S.categoryFilter) &&
        (!q || window.MebiData.foldTR(r.id + ' ' + r.name + ' ' + r.f).indexOf(q) !== -1);
    }).map(function(r) {
      var slot = S.selectedSlot1 === r.id ? 1 : (S.selectedSlot2 === r.id ? 2 : 0);
      var appearance = r.solid ? 'powder' : (r.id === 'Cu(NO3)2' ? 'blue' : 'clear');
      var description = r.solid ? 'Beyaz katı toz' : (appearance === 'blue' ? 'Mavi sulu çözelti' : 'Renksiz sulu çözelti');
      var completed = savedPairExists(anchor, r.id);
      return '<button type="button" class="reagent-gallery-card' + (slot ? ' is-selected' : '') + (completed ? ' is-previously-tested' : '') +
        '" data-action="clickReagent" data-arg="' + esc(r.id) + '" aria-pressed="' + !!slot +
        '" aria-label="' + esc(r.f + ', ' + r.name + ', ' + description + (slot ? ', ' + slot + '. beher seçildi' : '') + (completed ? ', bu madde çifti daha önce denendi ve koleksiyona kaydedildi' : '')) + '">' +
        '<span class="reagent-card-visual is-' + appearance + '">' +
          '<img src="image/reagents/' + appearance + '.webp?v=02f5093fd7f5" width="640" height="440" alt="" decoding="async" draggable="false">' +
        '</span><span class="reagent-card-caption">' + (slot ? '<span class="reagent-card-selection">✓ ' + slot + '. beher</span>' : '') + '<strong>' + esc(r.f) + '</strong>' + (completed ? '<span class="reagent-card-history">Daha önce denendi</span>' : '') + '<span>' + esc(r.name) +
        ' <small>' + (r.solid ? '(katı toz)' : '(suda)') + '</small></span></span></button>';
    }).join('');
    var count = (S.selectedSlot1 ? 1 : 0) + (S.selectedSlot2 ? 1 : 0);
    var slots = [S.selectedSlot1, S.selectedSlot2].map(function(id, index) {
      var r = window.MebiData.getReagent(id);
      return '<span class="gallery-selected-slot' + (r ? ' is-filled' : '') + '"><b>' + (index + 1) + '. beher</b><span>' +
        (r ? esc(r.f) : 'Madde seçilmedi') + '</span></span>';
    }).join('');
    return '<section class="reagent-gallery" aria-labelledby="reagentGalleryTitle">' +
      '<div class="reagent-gallery-toolbar"><header class="reagent-gallery-heading arena-stage-heading"><span class="gallery-heading-icon" aria-hidden="true">' + window.MebiSVG.icon('beakerIc') +
      '<span class="gallery-heading-check">' + window.MebiSVG.icon('check') + '</span></span>' +
      '<span id="reagentGalleryTitle" class="reagent-gallery-eyebrow">1. Seç · Maddelerini Seç</span></header>' +
      '<div class="reagent-gallery-tools"><label class="gallery-search"><span class="sr-only">Madde ara</span>' +
      '<input id="poolSearchInput" type="search" placeholder="Ad veya formül ara" value="' + esc(S.searchQuery).replace(/"/g, '&quot;') + '"></label>' +
      '<div class="gallery-filters" role="group" aria-label="Madde kategorisi">' +
      [['all','Tümü'],['acid','Asit'],['base','Baz'],['salt','Tuz']].map(function(f) {
        return '<button type="button" data-action="setFilter" data-arg="' + f[0] + '" aria-pressed="' + (S.categoryFilter === f[0]) + '">' + f[1] + '</button>';
      }).join('') + '</div></div></div>' +
      '<div class="reagent-gallery-grid" aria-label="Madde kartları">' + (cards || '<p class="gallery-empty">Bu aramada madde bulunamadı.</p>') + '</div>' +
      '<footer class="reagent-gallery-footer"><div class="gallery-selected-slots" aria-label="Seçilen maddeler">' + slots + '</div>' +
      '<span class="gallery-selection-status" role="status" aria-live="polite">' + count + ' / 2 madde seçildi</span>' +
      '<div class="gallery-actions"><button type="button" class="gallery-clear" data-action="resetPool"' + (!count ? ' disabled' : '') + '>Temizle</button>' +
      '<button type="button" class="gallery-continue" data-action="startExperiment"' + (count !== 2 || S.isFilling ? ' disabled' : '') +
      '>Tahmin aşamasına geç <span aria-hidden="true">→</span></button></div></footer></section>';
  }

  function selectionLabelHTML(id, slot, elementId) {
    var r = window.MebiData.getReagent(id);
    return '<div class="' + (slot === 1 ? 'vessel-main-wrap' : 'vessel-drag-wrap') + '" id="' + elementId + '">' +
      '<div class="selection-vessel">' + window.MebiSVG.renderBeakerSVG(r, !r) + '</div>' +
    '</div>';
  }

  function screenPool() {
    return topbarHTML(true, 'pool') + reagentGalleryHTML();
  }

  function screenLab() {
    if (S.particleInspection && window.MebiParticleInspection.eligible(S)) {
      return topbarHTML(true, S.particleInspection.returnScreen === 'model' ? 'model' : S.particleInspection.returnScreen === 'card' ? 'card' : 'observed') + window.MebiParticleInspection.panelHTML(S);
    }
    if (S.labStep === 'predict' || S.labStep === 'predictionSaved') {
      return topbarHTML(true, S.labStep) + window.MebiPrediction.render(S);
    }
    if (S.labStep === 'observed' && !S.explanationReview && !window.MebiObservation.get(S).labVisible) {
      return topbarHTML(true, 'observed') + window.MebiObservation.render(S);
    }
    var r1 = window.MebiData.getReagent(S.selectedSlot1);
    var r2 = window.MebiData.getReagent(S.selectedSlot2);
    var rx = S.activeReaction || window.MebiData.getReaction(S.selectedSlot1, S.selectedSlot2);

    var isReacting = (S.labStep === 'reacting' || S.labStep === 'observed');
    var isPoured = S.poured || isReacting;
    var isR1Solid = (r1 && r1.solid);
    var isR2Solid = (r2 && r2.solid);

    // Sıvı Rengi (Gerçek Görünüm)
    var liquidColor = 'rgba(255, 255, 255, 0.16)';
    if (isReacting && rx.toColor) {
      liquidColor = rx.toColor;
    } else if (r1.id === 'Cu(NO3)2' || (isPoured && r2.id === 'Cu(NO3)2')) {
      liquidColor = '#0284c7';
    }

    var precipColor = rx.precipColor || '#ffffff';

    var thermoHeight = 25;
    if (isReacting && rx.hasTempRise) {
      thermoHeight = Math.min(85, Math.max(25, 25 + ((rx.tempFinal - 20) / 40) * 60));
    } else if (isReacting && rx.tempFinal > rx.tempInit) {
      thermoHeight = 35;
    }

    var bubblesHTML = '';
    var surfaceFizzHTML = '';
    if (isReacting && rx.obs.indexOf('gas') > -1) {
      surfaceFizzHTML = '<div class="surface-fizz"></div>';
      var bLefts = [15, 28, 42, 54, 66, 22, 35, 48, 60, 18, 32, 50, 64];
      for (var i = 0; i < bLefts.length; i++) {
        var sz = 6 + (i % 4) * 3.5;
        bubblesHTML += '<div class="bubble-item" style="left:' + bLefts[i] + '%;width:' + sz + 'px;height:' + sz + 'px;animation-delay:' + (i * 0.14) + 's;animation-duration:' + (0.9 + (i % 3) * 0.3) + 's;"></div>';
      }
    }

    var vaporHTML = '';
    if (isReacting && rx.obs.indexOf('gas') > -1) {
      vaporHTML = '<div class="gas-vapor-container">' +
        '<div class="vapor-cloud" style="--drift-x:-12px;animation-delay:0s;"></div>' +
        '<div class="vapor-cloud" style="--drift-x:8px;animation-delay:0.4s;"></div>' +
        '<div class="vapor-cloud" style="--drift-x:-5px;animation-delay:0.9s;"></div>' +
      '</div>';
    }

    var precipHTML = '';
    if (isReacting && rx.obs.indexOf('precipitate') > -1) {
      precipHTML = '<div class="precip-sludge" style="height:32%;background:' + precipColor + 'cc;"></div>';
      var pLefts = [18, 32, 45, 58, 25, 40, 52];
      for (var j = 0; j < pLefts.length; j++) {
        precipHTML += '<div class="precip-flake" style="left:' + pLefts[j] + '%;background:' + precipColor + ';animation-delay:' + (j * 0.2) + 's;"></div>';
      }
    }

    // Sabit Beher İçerik Katmanı (Katı Toz ve Sıvı Reaksiyon Modeli)
    var mainInteriorHTML = '';
    if (isR1Solid) {
      if (!isPoured) {
        mainInteriorHTML = '<div class="main-beaker-powder" id="mainPowder"></div>';
      } else {
        if (isR2Solid) {
          mainInteriorHTML = '<div class="main-beaker-powder" id="mainPowder" style="height:55%;"></div>' +
            (isReacting ? '<div id="flaskLiquid" style="position:absolute;bottom:0;left:0;right:0;height:55%;background:transparent;">' + surfaceFizzHTML + bubblesHTML + precipHTML + '</div>' : '');
        } else {
          mainInteriorHTML = '<div class="main-beaker-powder' + (isReacting && rx.obs.indexOf('gas') > -1 ? ' reacting' : '') + '" id="mainPowder"></div>' +
            '<div id="flaskLiquid" style="position:absolute;bottom:0;left:0;right:0;height:72%;background:' + liquidColor + ';transition:all 1.4s ease;box-shadow:inset 0 0 20px rgba(0,0,0,0.25);">' +
              surfaceFizzHTML + bubblesHTML + precipHTML +
            '</div>';
        }
      }
    } else {
      if (!isPoured) {
        mainInteriorHTML = '<div id="flaskLiquid" style="position:absolute;bottom:0;left:0;right:0;height:46%;background:' + liquidColor + ';transition:all 1.4s ease;box-shadow:inset 0 0 20px rgba(0,0,0,0.25);">' +
          surfaceFizzHTML + bubblesHTML + precipHTML +
        '</div>';
      } else {
        var powderSettledHTML = isR2Solid ? '<div class="main-beaker-powder settled" id="mainPowder"></div>' : '';
        mainInteriorHTML = powderSettledHTML +
          '<div id="flaskLiquid" style="position:absolute;bottom:0;left:0;right:0;height:72%;background:' + liquidColor + ';transition:all 1.4s ease;box-shadow:inset 0 0 20px rgba(0,0,0,0.25);">' +
            surfaceFizzHTML + bubblesHTML + precipHTML +
          '</div>';
      }
    }

    // Durum ve Sensör Barı Metinleri (Yönerge standartları)
    var statusTitle = '2. Aşama: Olası Değişimleri Tahmin Edin';
    var dotClass = '';
    if (S.labStep === 'ready') {
      statusTitle = '3. Aşama: Beheri Dökün veya Sürükleyin';
    } else if (S.labStep === 'pouring') {
      statusTitle = 'Maddeler Karıştırılıyor...';
      dotClass = 'dot-reacting';
    } else if (S.labStep === 'reacting') {
      statusTitle = 'Maddeler Karıştırılıyor ve Tepkime Gerçekleşiyor...';
      dotClass = 'dot-reacting';
    } else if (S.labStep === 'observed') {
      statusTitle = 'Tepkime Tamamlandı - Gözlem ve Kanıt Analizi';
      dotClass = 'dot-done';
    }

    var curDelta = (S.currentTemp - rx.tempInit).toFixed(1);
    var deltaSign = curDelta > 0 ? ('+' + curDelta) : curDelta;

    // Deney Masası Sağ Kontrol ve Gözlem Dock'u (Frosted Glass Panel)
    var dockHTML = '';

    if (S.labStep === 'ready') {
      dockHTML = '<div class="bench-dock" id="benchDock">' +
        '<div class="dock-header">' +
          '<h3 class="dock-title">Beheri Dökün veya Sürükleyin</h3>' +
          '<p class="dock-subtext">Sağdaki beheri dökerek karışımı başlat. Aktarılan ve kalan miktarları mavi çubuklardan izle.</p>' +
          '<p class="experiment-transfer-status" id="experimentTransferStatus" role="status" aria-live="polite"></p>' +
        '</div>' +
        '<div class="dock-actions">' +
          '<button class="mebi-btn mebi-btn-primary dock-btn-full" data-action="triggerPour">' +
            '<span class="mebi-btn-badge">' + window.MebiSVG.icon('flaskIc') + '</span>' +
            '<span>Beheri Dök</span>' +
          '</button>' +

        '</div>' + window.MebiExperiment.actionsHTML() +
      '</div>';
    } else if (S.labStep === 'pouring' || S.labStep === 'reacting') {
      dockHTML = '<div class="bench-dock" id="benchDock">' +
        '<div class="dock-header">' +
          '<span class="dock-badge mebi-badge-indigo">CANLI TEPKİME</span>' +
          '<h3 class="dock-title">Maddeler Karıştırılıyor...</h3>' +
          '<p class="dock-subtext">Kap içerisindeki renk, gaz, çökelti ve sıcaklık değişimlerini izleyiniz.</p>' +
        '</div>' +
        '<div class="dock-live-box" style="margin-top:4px;">' +
          '<span class="sensor-pulse-dot dot-reacting"></span>' +
          '<span>Tepkime devam ediyor...</span>' +
        '</div>' + window.MebiExperiment.actionsHTML() +
      '</div>';
    } else if (S.labStep === 'observed') {
      dockHTML = S.explanationReview ? '<aside class="bench-dock explanation-review-dock" id="benchDock"><header class="dock-header"><span class="dock-badge">KANITLARIMI İNCELİYORUM</span><h3 class="dock-title">Deneyi Tekrar Gözle</h3><p class="dock-subtext">Maddelerin karışmasını ve oluşan değişimleri yeniden izle.</p><p id="explanationReplayStatus" class="explanation-replay-status" role="status">Deney yeniden başlıyor…</p></header><button type="button" class="mebi-btn mebi-btn-primary dock-btn-full" data-action="closeExplanationExperiment">Yorum Kartına Dön</button></aside>' : window.MebiObservation.deskHTML(S);
    }

    var html = topbarHTML(true, S.explanationReview ? 'card' : S.labStep) +
      '<div class="mebi-card lab-workspace">' +
        '<div class="lab-experiment-heading">' +
          window.MebiExperiment.cardHTML(S.explanationReview ? window.MebiExperiment.replayState(S,0) : S) +
        '</div>' +

        // Deney Tezgahı
        '<div class="lab-bench" id="labBenchContainer">' +
          // Tezgah Çalışma Alanı: Solda Beherler, Sağda Gözlem Dock Paneli
          '<div class="bench-stage">' +
            '<div class="bench-items">' +
              // Sabit Beher
              '<div class="vessel-main-wrap" id="mainVessel">' +
                vaporHTML +
                '<div class="main-beaker-glass">' +
                  // 1. Gerçek Borosilikat Beher Arka Camı ve Ağız Arka Çizgisi (z-index: 2)
                  window.MebiSVG.renderRealisticMainBeakerBackSVG() +

                  // 2. Sıvı ve Reaksiyon Haznesi (z-index: 5)
                  '<div class="main-beaker-interior">' +
                    mainInteriorHTML +
                  '</div>' +

                  // 3. Dijital Laboratuvar Termometresi (Prob beherin içinde, Gösterge beherin biraz üstünde)
                  '<div class="digital-thermo-wrap" id="digitalThermoWrap">' +
                    '<div class="digital-thermo-head' + ((isReacting && rx.hasTempRise) ? ' is-heating' : '') + '" id="digitalThermoHead">' +
                      '<div class="digital-lcd-display">' +
                        '<div class="digital-head-top">' +
                          '<span class="digital-brand-label">DIGITAL TEMP</span>' +
                          '<span class="digital-status-led-wrap">REC <span class="digital-status-led" id="digitalStatusLed"></span></span>' +
                        '</div>' +
                        '<div class="digital-temp-center">' +
                          '<span class="digital-temp-value" id="digitalTempValue">' + S.currentTemp.toFixed(1) + '</span>' +
                          '<span class="digital-temp-unit">°C</span>' +
                        '</div>' +
                        '<div class="digital-head-bottom">' +
                          '<span class="digital-sub-label">MEBİ KİMYALAB - PROBE-T1</span>' +
                        '</div>' +
                      '</div>' +
                      '<div class="digital-head-screws"><div class="screw"></div><div class="screw"></div></div>' +
                    '</div>' +
                    '<div class="digital-probe-collar"></div>' +
                    '<div class="digital-probe-stem">' +
                      '<div class="digital-probe-ticks"></div>' +
                    '</div>' +
                    '<div class="digital-probe-tip"></div>' +
                  '</div>' +

                  // 4. Gerçek Borosilikat Cam Beher Ön Modeli (Ön ağız kavisi, Boro 3.3 emaye skala, parlamalar - z-index: 8)
                  window.MebiSVG.renderRealisticMainBeakerGlassSVG() +
                '</div>' +
              '</div>' +

              // Dökülecek Beher
              '<div class="vessel-drag-wrap' + (S.labStep === 'pouring' ? ' pouring' : '') + '" id="dragReagentWrap">' +
                '<div class="drag-beaker' + (S.labStep === 'pouring' ? ' pouring' : '') + '" id="dragBeaker">' +
                  (S.labStep === 'ready' ? '<div class="hand-guide-pill">' + window.MebiSVG.icon('handIc') + 'Sola Sürükle: Dök · Sağa Sürükle: Geri Al</div>' : '') +
                  (isR2Solid
                    ? '<div class="drag-powder" style="height:' + (isPoured ? '0%' : '60%') + ';"></div>'
                    : '<div class="drag-liquid" style="background:' + (r2.id === 'Cu(NO3)2' ? '#0284c7' : 'rgba(232, 244, 253, 0.55)') + ';height:' + (isPoured ? '0%' : '65%') + ';"></div>'
                  ) +
                  window.MebiSVG.renderRealisticDragBeakerGlassSVG() +
                  '<div class="pour-stream' + (isR2Solid ? ' powder-stream' : '') + (S.labStep === 'pouring' ? ' active' : '') + '" id="pourStream"></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          dockHTML + labSettingsHTML() +
        '</div>';

    html += '</div>' + window.MebiExperiment.safetyHTML(S);
    return html;
  }

  // Evidence and particle relationships replace the former report, quiz and model cards.
  function screenCard() {
    if (!window.MebiExplanation.eligible(S)) return screenLab();
    return topbarHTML(true, 'card') + window.MebiExplanation.render(S);
  }
  function screenModel() {
    if (!window.MebiModel.canEnter(S)) return screenCard();
    return topbarHTML(true,'model') + window.MebiModel.render(S);
  }

  // EKRAN 6: KOLEKSİYON (COLLECTION)
                function getCollectionCardCategory(c) {
    if (c.typeCategory) return c.typeCategory;
    var t = (c.type || '').toLowerCase();
    if (t.indexOf('çökelme') >= 0 || t.indexOf('c - çökelme') >= 0) return 'ppt';
    if (t.indexOf('asit-baz') >= 0 || t.indexOf('asit') >= 0) return 'acidbase';
    if (t.indexOf('redoks') >= 0 || t.indexOf('yükseltgenme') >= 0) return 'redox';
    if (t.indexOf('kompleks') >= 0) return 'complex';
    return 'none';
  }

  function screenCollection() {
    var totalDiscovered = S.collection.length;
    var totalReactions = 36;

    var currentFilter = S.collectionFilter || 'all';
    var filteredCollection = S.collection.filter(function(c) {
      if (currentFilter === 'all') return true;
      return getCollectionCardCategory(c) === currentFilter;
    });

    var colFilters = [
      ['all', 'Tümü'],
      ['ppt', 'Çökelme'],
      ['acidbase', 'Asit-Baz'],
      ['redox', 'Redoks'],
      ['complex', 'Kompleksleşme'],
      ['none', 'Tepkimesiz']
    ];

    var filterButtonsHTML = '<div class="gallery-filters collection-filter-bar" role="group" aria-label="Deney türü filtresi">' +
      colFilters.map(function(f) {
        var isSelected = currentFilter === f[0];
        return '<button type="button" class="collection-filter-btn' + (isSelected ? ' is-active' : '') + '" data-action="setCollectionFilter" data-arg="' + f[0] + '" aria-pressed="' + isSelected + '">' + f[1] + '</button>';
      }).join('') + '</div>';

    var bodyHtml = '';
    if (totalDiscovered === 0) {
      bodyHtml = '<div class="collection-empty" style="text-align:center;padding:40px 20px;color:var(--mebi-text-secondary);">' +
        '<p style="font-size:15px;margin:0;">Henüz kaydedilmiş bir deney modeliniz bulunmuyor. Deneylerinizi tamamladığınızda modelleriniz bu alanda listelenecektir.</p>' +
      '</div>';
    } else if (filteredCollection.length === 0) {
      bodyHtml = '<div class="collection-empty" style="text-align:center;padding:40px 20px;color:var(--mebi-text-secondary);">' +
        '<p style="font-size:15px;margin:0;">Bu filtreye uygun kaydedilmiş deney modeli bulunamadı.</p>' +
      '</div>';
    } else {
      bodyHtml = '<div class="collection-grid">' +
        filteredCollection.map(function(c, i) {
          var cat = getCollectionCardCategory(c);
          var originalIndex = S.collection.indexOf(c);
          var numStr = String(originalIndex >= 0 ? originalIndex + 1 : i + 1).padStart(3, '0');
          return '<div class="collection-card is-' + cat + '">' +
            '<div class="collection-card-num">DENEY #' + numStr + '</div>' +
            '<div class="collection-card-formula">' + esc(c.r1) + ' + ' + esc(c.r2) + '</div>' +
            '<div class="collection-card-type">' + esc(c.type) + '</div>' +
            '<div class="collection-card-eq">' + esc(c.eq) + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="collection-footer" style="display:flex;justify-content:flex-end;align-items:center;margin-top:20px;">' +
        '<button class="mebi-btn mebi-btn-ghost mebi-btn-sm" data-action="clearCollection">' +
          '<span class="mebi-btn-badge">' + window.MebiSVG.icon('reset') + '</span>' +
          '<span>Koleksiyonu Sıfırla</span>' +
        '</button>' +
      '</div>';
    }

    var resumeStage = null;
    if (S.resumeScreen && S.resumeScreen !== 'menu' && S.resumeScreen !== 'collection') {
      if (S.resumeScreen === 'model') resumeStage = 'model';
      else if (S.resumeScreen === 'card') resumeStage = 'card';
      else if (S.resumeScreen === 'lab') resumeStage = S.resumeLabStep || 'predict';
      else resumeStage = 'pool';
    }

    var html = topbarHTML(true, resumeStage) +
      '<div class="mebi-card collection-shell">' +
        '<div class="collection-heading" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">' +
          '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">' +
            '<div class="mebi-badge mebi-badge-success collection-title-badge">' +
              '<span>LABORATUVAR GÜNLÜĞÜ</span>' +
              '<span class="collection-title-sep">·</span>' +
              '<span>KAYDEDİLEN DENEY MODELLERİ (' + totalDiscovered + ')</span>' +
            '</div>' +
            filterButtonsHTML +
          '</div>' +
          (S.experimentCompleted
            ? '<button class="mebi-btn mebi-btn-primary mebi-btn-sm" data-action="startNewExperiment" title="Yeni Bir Deney Yap" aria-label="Yeni Bir Deney Yap">' +
                '<span class="mebi-btn-badge">' + window.MebiSVG.icon('flask') + '</span>' +
                '<span>Yeni Bir Deney Yap</span>' +
              '</button>'
            : '<button class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="closeCollection" title="Laboratuvar Günlüğünü Kapat" aria-label="Laboratuvar Günlüğünü Kapat">' +
                '<span class="mebi-btn-badge">' + window.MebiSVG.icon('fullscreenExit') + '</span>' +
                '<span>Kapat</span>' +
              '</button>'
          ) +
        '</div>' +
        bodyHtml +
      '</div>';

    return html;
  }

  /* ----------------- 4. SÜRÜKLE VE BIRAK MOTORU (DRAG & DROP) ----------------- */
  function wireDragAndDrop() {
    if (window.LabScene && window.LabScene.available) return;
    var dragEl = document.getElementById('dragBeaker');
    var mainVessel = document.getElementById('mainVessel');
    var bench = document.getElementById('labBenchContainer');
    if (!dragEl || !mainVessel || !bench || S.labStep !== 'ready') return;

    var isDragging = false;
    var startX = 0, startY = 0;

    function getCoords(e) {
      if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    }

    function onPointerDown(e) {
      if (!window.MebiExperiment.get(S).safetyAccepted) { dispatch('requestManualPour'); return; }
      if (e.target && e.target.closest && e.target.closest('.beaker-side-pour-btn')) {
        return;
      }
      isDragging = true;
      dragEl.classList.add('dragging');
      var coords = getCoords(e);
      startX = coords.x;
      startY = coords.y;
      try { dragEl.setPointerCapture(e.pointerId); } catch (err) {}
      if (window.MebiAudio) window.MebiAudio.playClick();
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      var coords = getCoords(e);
      var dx = coords.x - startX;
      var dy = coords.y - startY;
      dragEl.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(1.05)';
    }

    function onPointerUp(e) {
      if (!isDragging) return;
      isDragging = false;
      dragEl.classList.remove('dragging');

      var dragRect = dragEl.getBoundingClientRect();
      var mainRect = mainVessel.getBoundingClientRect();
      var dragCenter = { x: dragRect.left + dragRect.width / 2, y: dragRect.top + dragRect.height / 2 };
      var pad = 50;

      var isOverMain = (
        dragCenter.x >= mainRect.left - pad &&
        dragCenter.x <= mainRect.right + pad &&
        dragCenter.y >= mainRect.top - pad &&
        dragCenter.y <= mainRect.bottom + pad
      );

      if (isOverMain) {
        dispatch('triggerPour');
      } else {
        dragEl.style.transform = '';
      }
    }

    dragEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  /* ----------------- 5. EYLEMLER VE YÖNLENDİRİCİ (ACTIONS & ROUTER) ----------------- */
  var actions = {
    toggleStageHeader: function() {
      S.headerCollapsed = !S.headerCollapsed; render(false);
      var toggle = document.querySelector('.mebi-stage-toggle'); if (toggle) toggle.focus({preventScroll:true});
    },
    closeStageReview: function() { S.stageReview = null; render(false); },
    navigateStage: function(value) {
      var target = Number(value);
      if (!isFinite(target) || target % 1 || target < 0 || target > availableStageIndex() || stageNavigationBusy()) return;
      S.stageReview = null;
      if (target === 0 && S.screen !== 'pool') S.stageReview = 'pool';
      else if (target === 1 && window.MebiPrediction.started(S)) S.stageReview = 'predict';
      else if (target === 1) { S.screen = 'lab'; S.labStep = S.predictionRecord ? 'predictionSaved' : 'predict'; }
      else if (target === 2) { S.particleInspection = null; S.explanationReview = null; S.screen = 'lab'; }
      else if (target === 3) { S.particleInspection=null;S.explanationReview=null;S.screen='card'; }
      else if (target === 4) { actions.toModel(); return; }
      render(false);
    },
    cancelExperimentSafety: function() {
      var e = window.MebiExperiment.get(S); if (S.screen !== 'lab' || !e.safetyOpen) return; e.safetyOpen = false; e.pending = null;
      window.MebiExperiment.syncSafetyDOM(S);
      var button = document.querySelector('[data-action="triggerPour"]'); if (button) button.focus({preventScroll:true});
    },
    toggleReagentPanel: function() {
      S.reagentPanelCollapsed = !S.reagentPanelCollapsed;
      render(false);
    },
    goMenu: function() {
      if (window.MebiAudio) window.MebiAudio.playClick();
      S.screen = 'menu';
      S.resumeScreen = null;
      S.resumeLabStep = null;
      S.experimentCompleted = false;
      S.showCompletionModal = false;
      S.labView = 'wide';
      if (window.LabScene && typeof window.LabScene.setView === 'function') {
        window.LabScene.setView('wide');
      }
      render();
    },
    goPool: function(arg) {
      ++fillToken; S.isFilling = false;
      S.searchQuery = '';
      S.categoryFilter = 'all';
      if (window.MebiAudio) window.MebiAudio.playClick();
      S.reagentPanelCollapsed = false;
      S.screen = 'pool';
      S.selectedSlot1 = null;
      S.selectedSlot2 = null;
      S.activeReaction = null;
      S.poured = false;
      S.labStep = 'predict';
      window.MebiPrediction.reset(S);
      window.MebiExperiment.reset(S, false);
      window.MebiObservation.reset(S);
      S.resumeScreen = null;
      S.resumeLabStep = null;
      var viewMode = (arg === 'fromMenu') ? 'wide' : 'desk';
      S.labView = viewMode;
      if (window.LabScene && typeof window.LabScene.setView === 'function') {
        window.LabScene.setView(viewMode);
      }
      render();
    },
    changeReactants: function() {
      ++fillToken; S.isFilling = false;
      S.searchQuery = '';
      S.categoryFilter = 'all';
      if (window.MebiAudio) window.MebiAudio.playClick();
      S.reagentPanelCollapsed = false;
      S.screen = 'pool';
      S.selectedSlot1 = null;
      S.selectedSlot2 = null;
      S.activeReaction = null;
      S.poured = false;
      S.labStep = 'predict';
      window.MebiPrediction.reset(S);
      window.MebiExperiment.reset(S, false);
      window.MebiObservation.reset(S);
      S.resumeScreen = null;
      S.resumeLabStep = null;
      S.labView = 'desk';
      if (window.LabScene && typeof window.LabScene.setView === 'function') {
        window.LabScene.setView('desk');
      }
      render();
    },
    closeCollection: function() {
      if (window.MebiAudio) window.MebiAudio.playClick();
      actions.resumeExperiment();
    },
    goCollection: function() {
      if (window.MebiAudio) window.MebiAudio.playClick();
      if (S.screen === 'collection') {
        actions.resumeExperiment();
        return;
      }
      if (S.screen !== 'collection') {
        if (S.screen === 'lab' || S.screen === 'card' || S.screen === 'model' || S.screen === 'pool') {
          S.resumeScreen = S.particleInspection ? S.particleInspection.returnScreen : S.explanationReview ? 'card' : S.screen;
          S.resumeLabStep = S.labStep;
        } else {
          S.resumeScreen = null;
          S.resumeLabStep = null;
        }
      }
      S.stageReview = null;
      S.particleInspection = null;
      S.explanationReview = null;
      S.screen = 'collection';
      render();
    },
    viewCollectionItem: function(pair) {
      if (window.MebiAudio) window.MebiAudio.playClick();
      if (!pair) return;
      var parts = pair.split('|');
      if (parts.length < 2) return;
      var r1 = parts[0], r2 = parts[1];
      var reagents = window.MebiData ? window.MebiData.REAGENTS : [];
      var item1 = reagents.find(function(r) { return r.id === r1 || r.f === r1; });
      var item2 = reagents.find(function(r) { return r.id === r2 || r.f === r2; });
      if (!item1 || !item2) return;
      var rx = window.MebiData.getReaction(item1.id, item2.id);
      if (!rx) return;
      S.selectedSlot1 = item1.id;
      S.selectedSlot2 = item2.id;
      S.activeReaction = rx;
      S.stageReview = null;
      S.particleInspection = null;
      S.explanationReview = null;
      S.screen = 'card';
      render();
    },
    resumeExperiment: function() {
      if (window.MebiAudio) window.MebiAudio.playClick();
      var target = S.resumeScreen || ((S.selectedSlot1 && S.selectedSlot2) ? (S.labStep ? 'lab' : 'pool') : 'pool');
      if (target === 'collection' || target === 'menu') {
        target = (S.selectedSlot1 && S.selectedSlot2) ? (S.labStep ? 'lab' : 'pool') : 'pool';
      }
      S.screen = target;
      if (S.screen === 'lab') {
        if (S.resumeLabStep === 'pouring' || S.resumeLabStep === 'reacting') {
          S.labStep = S.poured ? 'observed' : 'ready';
        } else if (S.resumeLabStep) {
          S.labStep = S.resumeLabStep;
        } else {
          S.labStep = 'predict';
        }
      }
      render();
    },
    // Uygulama ve Laboratuvar Rehberi (Yönerge standartlarına uyarlandı)
    openGuideDrawer: function() {
      if (window.MebiUI && window.MebiUI.openWelcomeModal) {
        window.MebiUI.openWelcomeModal();
        return;
      }
      var guideContent = '<div style="display:flex;flex-direction:column;gap:16px;line-height:1.65;font-size:14px;">' +
        '<div><b>1. Tepken Bölmesi:</b> Deney masasında incelemek istediğin iki kimyasal maddeyi seçerek 1. ve 2. tepken bölmesine yerleştir.</div>' +
        '<div><b>2. Tahmin Basamağı:</b> Maddeler karıştırılmadan önce bir kimyasal tepkimenin gerçekleşip gerçekleşmeyeceğini tahmin et. Gaz çıkışı, yeni bir katının/çökeleğin oluşması, renk değişimi veya sıcaklık değişimi gibi gözlenebilir belirtilerin ortaya çıkıp çıkmayacağını öngör.</div>' +
        '<div><b>3. Beher İçeriğini Aktarma:</b> Sağdaki beheri soldaki beherin üzerine sürükleyerek maddeleri karıştır veya "Beheri Dök" butonuna tıkla.</div>' +
        '<div><b>4. Taneciklerle Açıkla:</b> Gözlem kanıtlarını seç, taneciklerin rollerini ilişkilendir ve açıklamanı yaz. 3B beherleri inceleyip aynı karta dönerek açıklamanı geliştir.</div>' +
      '</div>';
      window.MebiUI.openDrawer('Uygulama ve Laboratuvar Rehberi', guideContent);
    },
    testOrientation: function() {
      if (window.MebiUI && window.MebiUI.openOrientation) {
        window.MebiUI.openOrientation();
      }
    },
    toggleFullscreen: function() {
      if (window.MebiAudio) window.MebiAudio.playClick();
      var isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      if (!isFs) {
        var docEl = document.documentElement;
        var rfs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
        if (rfs) {
          rfs.call(docEl).catch(function(e) {
            console.warn('Tam ekran modu başlatılamadı:', e);
          });
        }
      } else {
        var efs = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
        if (efs) {
          efs.call(document).catch(function(e) {
            console.warn('Tam ekrandan çıkılamadı:', e);
          });
        }
      }
    },
    toggleTheme: function() {
      window.MebiUI.toggleTheme();
      render(false);
    },
    toggleLabSettings: function() {
      var triggers = document.querySelectorAll('.lab-settings-trigger');
      triggers.forEach(function(btn) { btn.classList.remove('gear-attention-highlight'); });
      S.labSettingsOpen = !S.labSettingsOpen;
      render(false);
    },
    closeLabSettings: function() {
      S.labSettingsOpen = false;
      render(false);
    },
    setLabView: function(view) {
      if (['desk', 'closeup', 'wide'].indexOf(view) < 0) return;
      S.labView = view;
      if (window.LabScene && window.LabScene.setView) window.LabScene.setView(view);
      render(false);
    },
    toggleLabLighting: function() {
      S.labLighting = S.labLighting === 'dark' ? 'light' : 'dark';
      if (window.LabScene && window.LabScene.setLighting) window.LabScene.setLighting(S.labLighting);
      try { localStorage.setItem('three-faces-laboratory-lighting', S.labLighting); } catch (e) {}
      render(false);
    },
    setTableColor: function(color) {
      if (['#466455', '#3d4547', '#fff2d7'].indexOf(color) < 0) return;
      S.tableColor = color;
      if (window.LabScene && window.LabScene.setTableColor) window.LabScene.setTableColor(color);
      try { localStorage.setItem('three-faces-table-color', color); } catch (e) {}
      render(false);
    },
    toggleAudio: function() {
      var isAudio = window.MebiAudio.isEnabled();
      window.MebiAudio.setEnabled(!isAudio);
      if (!isAudio) window.MebiAudio.playClick();
      window.MebiUI.showToast('info', 'Ses Ayarı', !isAudio ? 'Ses efektleri açıldı.' : 'Ses efektleri kapatıldı.', 2000);
      render(false);
    },
    setFilter: function(cat) {
      S.categoryFilter = cat;
      if (window.MebiAudio) window.MebiAudio.playClick();
      render(false);
    },
    clickReagent: function(id) {
      if (S.screen !== 'pool' || !window.MebiData.getReagent(id)) return;
      if (id !== S.selectedSlot1 && id !== S.selectedSlot2 && savedPairExists(S.selectedSlot1 || S.selectedSlot2, id)) {
        S.pendingRepeatPair = {first:S.selectedSlot1, second:S.selectedSlot2, candidate:id};
        render(false);
        return;
      }
      selectReagent(id);
    },
    cancelRepeatPair: function() {
      var pending = S.pendingRepeatPair;
      if (!pending) return;
      S.pendingRepeatPair = null;
      render(false);
      focusReagent(pending.candidate);
    },
    confirmRepeatPair: function() {
      var pending = S.pendingRepeatPair;
      if (!pending) return;
      S.pendingRepeatPair = null;
      if (S.screen === 'pool' && S.selectedSlot1 === pending.first && S.selectedSlot2 === pending.second) selectReagent(pending.candidate);
      else render(false);
      focusReagent(pending.candidate);
    },
    clearSlot: function(num) {
      if (S.screen !== 'pool') return;
      if (window.MebiAudio) window.MebiAudio.playClick();
      if (num === '1') S.selectedSlot1 = null;
      if (num === '2') S.selectedSlot2 = null;
      S.reagentPanelCollapsed = false;
      finishSelection();
    },
    resetPool: function() {
      if (S.screen !== 'pool') return;
      if (window.MebiAudio) window.MebiAudio.playClick();
      S.selectedSlot1 = null;
      S.selectedSlot2 = null;
      S.searchQuery = '';
      S.categoryFilter = 'all';
      S.reagentPanelCollapsed = false;
      finishSelection();
    },
    resetExperiment: function() {
      function doReset() {
        ++fillToken; S.isFilling = false;
        if (window.MebiAudio) window.MebiAudio.playClick();
        S.collection = [];
        saveCollectionToStorage();
        S.selectedSlot1 = null;
        S.selectedSlot2 = null;
        S.activeReaction = null;
        window.MebiPrediction.reset(S);
        window.MebiExperiment.reset(S, false);
        window.MebiObservation.reset(S);
        S.labStep = 'predict';







        S.resumeScreen = null;
        S.resumeLabStep = null;
        S.screen = 'menu';
        render();
        if (window.MebiUI && window.MebiUI.showToast) {
          window.MebiUI.showToast('İlerleme ve keşif kartları başarıyla sıfırlandı.', 'info');
        }
      }
      if (window.MebiUI && window.MebiUI.openResetModal) {
        window.MebiUI.openResetModal(S.collection.length, doReset);
      } else {
        var approved = typeof window.confirm === 'function' && window.confirm('Bu işlem yaptığınız bütün keşifleri ve mevcut deney ilerlemesini kalıcı olarak silecektir. Devam etmek istiyor musunuz?');
        if (approved) doReset();
      }
    },
    startExperiment: function() {
      if (S.screen !== 'pool' || !S.selectedSlot1 || !S.selectedSlot2 || S.isFilling) return;
      if (window.MebiAudio) window.MebiAudio.playClick();
      enterPredictionScreen();
      render();
    },
    setPredictionChoice: function(value) {
      if (window.MebiPrediction.setChoice(S, value)) render(false);
    },
    togglePredictionNone: function() {
      if (window.MebiPrediction.toggleNone(S)) render(false);
    },
    savePrediction: function() {
      window.MebiPrediction.save(S);
      render(false);
    },
    redoPrediction: function() {
      if (window.MebiPrediction.edit(S)) render(false);
    },
    beginExperiment: function(arg, btn) {
      if (S.beginExperimentTimer) return;
      if (S.labStep !== 'predictionSaved') {
        var ok = window.MebiPrediction.save(S);
        if (!ok) { render(false); return; }
      }

      function executeBegin() {
        if (!window.MebiPrediction.begin(S)) return;
        HISTORY.length = 0;
        window.MebiExperiment.reset(S, false);
        window.MebiObservation.reset(S);
        S.labView = 'desk';
        if (window.LabScene && window.LabScene.setView) window.LabScene.setView('desk');
        if (window.MebiAudio) window.MebiAudio.playClick();
        render();
      }

      animateSave(btn, executeBegin);
    },
    requestManualPour: function() {
      if (!window.MebiPrediction.started(S)) return;
      window.MebiExperiment.request(S, 'manual');
      window.MebiExperiment.syncSafetyDOM(S);
    },
    toggleSafetyCheck: function(arg) {
      if (window.MebiExperiment.toggleSafetyItem(S, arg)) {
        if (window.MebiAudio) window.MebiAudio.playClick();
        window.MebiExperiment.syncSafetyDOM(S);
      }
    },
    toggleAllSafetyChecks: function() {
      if (window.MebiExperiment.toggleAllSafetyItems(S)) {
        if (window.MebiAudio) window.MebiAudio.playClick();
        window.MebiExperiment.syncSafetyDOM(S);
      }
    },
    acceptExperimentSafety: function() {
      if (!window.MebiExperiment.allSafetyChecked(S)) return;
      if (window.MebiAudio) window.MebiAudio.playClick();
      var pending = window.MebiExperiment.accept(S);
      window.MebiExperiment.syncSafetyDOM(S);
      if (pending === 'auto') actions.triggerPour();
    },
    restartExperiment: function() {
      if (S.screen !== 'lab' || !window.MebiPrediction.started(S)) return;
      window.MebiExperiment.reset(S, true);
      window.MebiObservation.reset(S);
      S.labStep = 'ready'; S.poured = false;
      S.currentTemp = S.activeReaction.tempInit;
      render(false);
    },
    triggerPour: function() {
      if (!window.MebiPrediction.started(S)) return;
      if (!window.MebiExperiment.request(S, 'auto')) { window.MebiExperiment.syncSafetyDOM(S); return; }
      if (!window.MebiExperiment.startAuto(S)) return;
      S.labStep = 'pouring'; S.poured = false;
      if (window.MebiAudio) window.MebiAudio.playPour();
      render(false);
      // The button remains usable if WebGL is unavailable.
      if (!window.LabScene || !window.LabScene.available || !window.LabScene.handlesTransfer) {
        var run = S.experiment.run;
        var timer = setInterval(function() {
          if (!S.experiment || S.experiment.run !== run || S.screen !== 'lab' || S.experiment.mode !== 'auto') { clearInterval(timer); return; }
          var done = window.MebiExperiment.advance(S, 0.05, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
          window.MebiExperiment.paint(S);
          if (done) { clearInterval(timer); actions.finishPour(); }
        }, 50);
      }
    },
    finishPour: function() {
      if (S.screen !== 'lab' || !S.experiment || S.experiment.transfer < 1 || (S.labStep !== 'ready' && S.labStep !== 'pouring')) return;
      var reactionAtStart = S.activeReaction;
      var experimentRun = S.experiment.run;
      S.poured = true;
      S.labStep = 'reacting';
      var rx = S.activeReaction;
      if (window.MebiAudio && (rx.obs.indexOf('gas') > -1 || rx.hasTempRise)) {
        window.MebiAudio.playFizz();
      }

      var targetTemp = rx.tempFinal;
      var initTemp = rx.tempInit;
      var tempStep = (targetTemp - initTemp) / 10;
      var count = 0;
      var tempInterval = setInterval(function() {
        if (S.activeReaction !== reactionAtStart || !S.experiment || S.experiment.run !== experimentRun || (S.labStep !== 'reacting' && S.labStep !== 'observed')) {
          clearInterval(tempInterval);
          return;
        }
        count++;
        S.currentTemp += tempStep;
        var digitalValEl = document.getElementById('digitalTempValue');
        var thermoHeadEl = document.getElementById('digitalThermoHead');
        var sensorEl = document.getElementById('sensorTempDisplay');
        var textEl = document.getElementById('thermoText');

        if (digitalValEl) {
          digitalValEl.textContent = S.currentTemp.toFixed(1);
        } else if (textEl) {
          textEl.innerHTML = window.MebiSVG.icon('temp') + '<span>' + S.currentTemp.toFixed(1) + '°C</span>';
        }
        if (window.LabScene) window.LabScene.setTemperature(S.currentTemp);

        if (thermoHeadEl && rx.hasTempRise) {
          thermoHeadEl.classList.add('is-heating');
        }

        if (sensorEl) {
          var curD = (S.currentTemp - rx.tempInit).toFixed(1);
          var curSign = curD > 0 ? ('+' + curD) : curD;
          sensorEl.innerHTML = window.MebiSVG.icon('temp') + '<span>' + S.currentTemp.toFixed(1) + '°C</span><span style="font-size:11px;opacity:0.85;margin-left:4px;">(ΔT: ' + curSign + '°C)</span>';
        }

        if (count >= 10) {
          clearInterval(tempInterval);
          S.currentTemp = targetTemp;
          if (digitalValEl) digitalValEl.textContent = targetTemp.toFixed(1);
        }
        window.MebiExperiment.paint(S);
      }, 100);

      render(false);

      setTimeout(function() {
        if (S.activeReaction !== reactionAtStart || !S.experiment || S.experiment.run !== experimentRun || S.labStep !== 'reacting') return;
        S.labStep = 'observed';
        window.MebiObservation.get(S).labVisible = false;
        S.benchAttention = true;
        render();
      }, 4200);
    },
    showObservationDesk: function() {
      if (window.MebiObservation.showLab(S, true)) render(false);
    },
    saveObservationAndProceed: function(arg, btn) {
      var saved = window.MebiObservation.save(S);
      if (saved) {
        if (window.MebiAudio) window.MebiAudio.playSuccess();
        animateSave(btn, function() { S.screen = 'card'; render(false); });
      } else {
        render(false);
      }
    },
    openPredictionDialog: function() {
      var dlg = document.getElementById('explanationPredictionDialog');
      if (dlg && typeof dlg.showModal === 'function') {
        if (!dlg.open) dlg.showModal();
      }
    },
    closePredictionDialog: function() {
      var dlg = document.getElementById('explanationPredictionDialog');
      if (dlg && typeof dlg.close === 'function') {
        if (dlg.open) dlg.close();
      }
    },
    openObservationCard: function() {
      S.benchAttention = false;
      if (window.MebiFloatingCards && window.MebiFloatingCards.expand) window.MebiFloatingCards.expand(S);
      var card = document.querySelector('#app .observation-card');
      if (card) card.classList.remove('is-attention-pulse');
      if (window.MebiObservation.showLab(S, false)) render(false);
      else render(false);
    },
    setObservationChoice: function(value) {
      if (window.MebiObservation.setChoice(S, value)) render(false);
    },
    saveObservation: function() {
      var saved = window.MebiObservation.save(S);
      render(false);
      if (saved) {
        var dock = document.getElementById('benchDock');
        var tab = document.getElementById('compareObservationButton');
        if (dock) dock.scrollTop = 0;
        var panel = document.getElementById('observationPanel');
        if (panel) panel.scrollTop = 0;
        if (tab) tab.focus({ preventScroll:true });
      }
    },
    setObservationTab: function(value, btn) {
      if (value === 'compare' && btn) {
        if (S.compareTransitionTimer) return;
        var ok = window.MebiObservation.save(S);
        render(false);
        if (!ok) return;
        animateSave(btn, function() {
          window.MebiObservation.setTab(S, 'compare');
          render(false);
          var panel = document.getElementById('observationPanel');if(panel)panel.scrollTop=0;
        });
        return;
      }
      var ok = window.MebiObservation.setTab(S, value);
      render(false);
      if (!ok) return;
      var dock = document.getElementById('benchDock');
      if (dock) dock.scrollTop = 0;
      var panel = document.getElementById('observationPanel');
      if (panel) panel.scrollTop = 0;
    },
    saveObservationReflection: function() {
      window.MebiObservation.saveReflection(S);
      render(false);
    },
    backToObservation: function() {
      S.particleInspection = null; S.explanationReview = null; S.screen = 'lab'; S.labStep = 'observed';
      window.MebiObservation.get(S).tab = 'observe'; window.MebiObservation.showLab(S, false); render(false);
    },
    saveExplanation: function() {
      if (S.screen !== 'card') return;
      window.MebiExplanation.save(S);
      render(false);
    },
    toModel: function(arg, btn) {
      if (!window.MebiExplanation.eligible(S)) return;
      if (!window.MebiExplanation.save(S)) { S.screen='card'; render(false); return; }
      function executeToModel() {
        S.stageReview=null; S.particleInspection=null; S.explanationReview=null; S.screen='model'; render(false);
        var panel=document.querySelector('.model-content');if(panel)panel.scrollTop=0;
      }
      animateSave(btn, executeToModel);
    },
    backToExplanation: function() {
      if (S.screen!=='model') return;
      S.screen='card';window.MebiExplanation.setStep(S,2);render(false);
    },
    saveModel: function() {
      if(S.screen!=='model')return;
      window.MebiModel.save(S);
      render(false);
      var feedback=document.getElementById('modelStatus');if(feedback)feedback.scrollIntoView({block:'nearest'});
    },
    saveModelAndToEquation: function(arg, btn) {
      if(S.screen!=='model')return;
      var draft=window.MebiModel.get(S);
      var valid=window.MebiModel.check(S);
      if(!valid){
        render(false);
        var feedback=document.getElementById('modelStatus');
        if(feedback)feedback.scrollIntoView({block:'nearest'});
        return;
      }
      window.MebiModel.save(S);
      function executeAdvance() {
        draft.subView='equation';
        window.MebiModel.persist(S);
        render(false);
        var content=document.querySelector('.model-content');
        if(content)content.scrollTop=0;
      }
      animateSave(btn, executeAdvance);
    },
    closeModelHelpModal: function() {
      if(S.screen!=='model')return;
      var draft=window.MebiModel.get(S);
      draft.helpPopupShown=true;
      var modal=document.getElementById('modelHelpModal');
      if(modal)modal.classList.add('is-hidden');
    },
    checkModel: function() { if(S.screen==='model')window.MebiModel.check(S); },
    checkModelDock: function() { if(window.MebiAudio)window.MebiAudio.playClick(); if(window.MebiModel && window.MebiModel.checkDock)window.MebiModel.checkDock(S); },
    setModelSubView: function(arg, btn) {
      if (S.screen !== 'model') return;
      var view = arg || (btn && btn.dataset && btn.dataset.arg) || 'relationships';
      window.MebiModel.setSubView(S, view);
      render(false);
      var content = document.querySelector('.model-content');
      if (content) content.scrollTop = 0;
    },
    addEquationTerm: function(arg, btn) {
      if (S.screen !== 'model') return;
      var side = (btn && btn.dataset && btn.dataset.side) || (arg && arg.side);
      var kind = (btn && btn.dataset && btn.dataset.kind) || (arg && arg.kind);
      if (side && kind) {
        window.MebiModel.addTerm(S, side, kind);
        render(false);
      }
    },
    removeEquationTerm: function(arg, btn) {
      if (S.screen !== 'model') return;
      var side = (btn && btn.dataset && btn.dataset.side) || (arg && arg.side);
      var idx = (btn && btn.dataset && parseInt(btn.dataset.index, 10)) != null ? parseInt(btn.dataset.index, 10) : (arg && arg.index);
      if (side && !isNaN(idx)) {
        window.MebiModel.removeTerm(S, side, idx);
        render(false);
      }
    },
    stepEquationCoeff: function(arg, btn) {
      if (S.screen !== 'model') return;
      var side = (btn && btn.dataset && btn.dataset.side) || (arg && arg.side);
      var idx = (btn && btn.dataset && parseInt(btn.dataset.index, 10)) != null ? parseInt(btn.dataset.index, 10) : (arg && arg.index);
      var delta = (btn && btn.dataset && parseInt(btn.dataset.delta, 10)) || (arg && arg.delta) || 1;
      if (side && !isNaN(idx)) {
        window.MebiModel.stepCoefficient(S, side, idx, delta);
        render(false);
      }
    },
    setEquationCoeff: function(arg, btn) {
      if (S.screen !== 'model') return;
      var side = (btn && btn.dataset && btn.dataset.side) || (arg && arg.side);
      var idx = (btn && btn.dataset && parseInt(btn.dataset.index, 10)) != null ? parseInt(btn.dataset.index, 10) : (arg && arg.index);
      var val = (arg && arg.value != null ? arg.value : (btn && btn.value)) || 1;
      if (side && !isNaN(idx)) {
        window.MebiModel.setCoefficient(S, side, idx, val);
        render(false);
      }
    },
    clearEquationDraft: function() {
      if (S.screen !== 'model') return;
      window.MebiModel.clearEquation(S);
      render(false);
    },
    quickAddPlaceholder: function(arg, btn) {
      if (S.screen !== 'model') return;
      var side = (btn && btn.dataset && btn.dataset.side) || arg || 'reactants';
      window.MebiModel.quickAddPlaceholder(S, side);
      render(false);
    },
    dismissBalancedModal: function() {
      if (window.MebiAudio) window.MebiAudio.playClick();
      var draft = window.MebiModel.get(S);
      if (draft) draft.showBalancedModal = false;
      render(false);
    },
    dismissCompletionModal: function() {
      if (window.MebiAudio) window.MebiAudio.playClick();
      S.showCompletionModal = false;
      render(false);
    },
    viewCollectionFromCompletion: function() {
      if (window.MebiAudio) window.MebiAudio.playClick();
      S.showCompletionModal = false;
      actions.goCollection();
    },
    startNewExperiment: function() {
      if (window.MebiAudio) window.MebiAudio.playClick();
      S.showCompletionModal = false;
      S.experimentCompleted = false;
      var draft = window.MebiModel.get(S);
      if (draft) {
        draft.showBalancedModal = false;
        draft.hasCelebrated = false;
      }
      actions.goPool();
    },
    checkEquation: function() {
      if (S.screen !== 'model') return;
      window.MebiModel.checkEquation(S);
      render(false);
    },
    saveEquation: function(arg, btn) {
      if (S.screen !== 'model') return;
      if (window.MebiModel.saveEquation(S)) {
        var rx = S.activeReaction, draft = window.MebiModel.get(S), pair = [S.selectedSlot1, S.selectedSlot2].sort().join('|');
        var item = {
          r1: window.MebiData.getReagent(S.selectedSlot1).f,
          r2: window.MebiData.getReagent(S.selectedSlot2).f,
          type: rx.canonical,
          eq: window.MebiModel.summary(S),
          pair: pair,
          reaction: rx.typeCategory !== 'none',
          explanationId: S.observation.record.id,
          model: {
            type: 'particle-relationships',
            record: draft.revisions && draft.revisions.length ? draft.revisions[draft.revisions.length - 1] : null,
            equation: draft.equationDraft
          }
        };
        var index = S.collection.findIndex(function(c){ return c.pair === pair || c.eq === rx.eq; });
        if (index < 0) S.collection.push(item); else S.collection[index] = item;
        if (!saveCollectionToStorage()) draft.storageError = true;
        S.experimentCompleted = true;
        draft.showBalancedModal = false;
        animateSave(btn, function() { S.showCompletionModal = true; render(false); });
        return;
      }
      render(false);
      var feedback = document.getElementById('modelStatus'); if (feedback) feedback.scrollIntoView({ block: 'nearest' });
    },
    dismissNonReactionNotice: function() {
      if (!window.MebiNonReaction || !window.MebiNonReaction.scenario(S)) return;
      window.MebiNonReaction.get(S).notice=null;
      render(false);
      var button=document.querySelector('[data-action="saveNonReaction"]');if(button)button.focus({preventScroll:true});
    },
    saveNonReaction: function(arg, btn) {
      if (S.screen !== 'model' || !window.MebiNonReaction || !window.MebiNonReaction.scenario(S)) return;
      var record=window.MebiNonReaction.save(S);
      if (record) {
        var pair=[S.selectedSlot1,S.selectedSlot2].sort().join('|');
        var item={r1:window.MebiData.getReagent(S.selectedSlot1).f,r2:window.MebiData.getReagent(S.selectedSlot2).f,
          pair:pair,reaction:false,type:'Bu koşullarda net kimyasal tepkime yok',
          eq:'Yeni kimyasal ürün oluşumu gösterilmiyor. '+record.reason,
          explanationId:S.observation.record.id,model:{type:'nonreaction-inventory',record:record,equation:null}};
        var index=S.collection.findIndex(function(c){return c.pair===pair;});
        if(index<0)S.collection.push(item);else S.collection[index]=item;
        if (saveCollectionToStorage()) {
          S.experimentCompleted=true;
          animateSave(btn,function(){window.MebiNonReaction.showSaveNotice(S,true);render(false);});
          return;
        }
        else {var draft=window.MebiNonReaction.get(S);draft.storageError=true;draft.saved=false;}
      }
      window.MebiNonReaction.showSaveNotice(S,false);
      render(false);
    },
    setExplanationStep: function(value) {
      if (S.screen !== 'card' || !window.MebiExplanation.setStep(S, value)) return;
      render(false);
      var content = document.querySelector('.explanation-content'); if(content)content.scrollTop=0;
      var heading = document.getElementById('explanationTitle'); if(heading)heading.focus({preventScroll:true});
    },
    reviewExplanationExperiment: function() {
      if (S.screen !== 'card' || !window.MebiExplanation.eligible(S)) return;
      S.explanationReview = {elapsed:0,frameAt:null,observationId:S.observation.record.id,scroll:document.querySelector('.explanation-content')?.scrollTop || 0};
      S.screen = 'lab'; S.particleInspection = null; render(false);
    },
    closeExplanationExperiment: function() {
      if (!S.explanationReview) return;
      var scroll = S.explanationReview.scroll;
      S.explanationReview = null; S.screen = 'card'; render(false);
      var content = document.querySelector('.explanation-content'); if(content)content.scrollTop=scroll;
      var heading = document.getElementById('explanationTitle'); if(heading)heading.focus({preventScroll:true});
    },
    toCard: function(arg, btn) {
      if (S.screen !== 'lab' || S.labStep !== 'observed' || !window.MebiObservation.get(S).record) return;
      if (window.MebiAudio) window.MebiAudio.playClick();
      var obs = window.MebiObservation.get(S);
      if (obs && obs.reflection && obs.reflection.trim()) {
        window.MebiObservation.saveReflection(S);
      }
      animateSave(btn,function(){S.screen = 'card';render();});
    },
    openParticleInspection: function(view) {
      if (!window.MebiParticleInspection.eligible(S) || !window.LabScene || !window.LabScene.available || !/^(before|reaction)$/.test(view)) return;
      var previous = S.particleInspection;
      if (S.screen === 'card') { var draft = window.MebiExplanation.get(S); draft.visits++; window.MebiExplanation.persist(S); }
      S.particleInspection = {view:view,micro:true,time:0,revision:(previous ? previous.revision : 0)+1,returnScreen:previous ? previous.returnScreen : S.screen,cardScroll:previous ? previous.cardScroll : (document.querySelector('.explanation-content,.model-content')?.scrollTop || 0)};
      S.screen='lab'; S.labStep='observed'; render(false);
    },
    closeParticleInspection: function() {
      var inspection=S.particleInspection;if(!inspection)return;
      S.particleInspection=null;S.screen=['card','model'].includes(inspection.returnScreen)?inspection.returnScreen:'lab';
      if(S.screen==='lab')window.MebiObservation.showLab(S,false);render(false);
      if(['card','model'].includes(S.screen)){var panel=document.querySelector('.explanation-content,.model-content');if(panel)panel.scrollTop=inspection.cardScroll||0;var target=document.getElementById('modelStepTitle')||document.getElementById('explanationEditor')||document.getElementById('explanationTitle');if(target)target.focus({preventScroll:true});}
    },
    toggleParticleNormal: function() {var p=S.particleInspection;if(!p)return;p.micro=!p.micro;window.MebiParticleInspection.paint(S);},
    seekParticleInspection: function(value) {var p=S.particleInspection;if(!p||p.view!=='reaction')return;p.time=Math.max(0,Math.min(16,Number(value)||0));p.revision++;window.MebiParticleInspection.paint(S);},
    setCollectionFilter: function(filter) {
      S.collectionFilter = filter;
      render(false);
    },
    clearCollection: function() {
      function doClear() {
        if (window.MebiAudio) window.MebiAudio.playClick();
        S.collection = [];
        saveCollectionToStorage();
        render();
        if (window.MebiUI && window.MebiUI.showToast) {
          window.MebiUI.showToast('info', 'Koleksiyon Sıfırlandı', 'Kayıtlı tüm deney kartları temizlendi.', 2500);
        }
      }
      if (window.MebiUI && window.MebiUI.openResetModal) {
        window.MebiUI.openResetModal(S.collection.length, doClear);
      } else {
        var approved = typeof window.confirm === 'function' && window.confirm('Bu işlem keşfettiğiniz tüm tepkime kartlarını (' + S.collection.length + ' adet) ve mevcut laboratuvar deney ilerlemesini kalıcı olarak silecektir. Devam etmek istiyor musunuz?');
        if (approved) doClear();
      }
    },
    undoLast: function() {
      if (window.MebiAudio) window.MebiAudio.playClick();
      if (HISTORY.length > 0) {
        var prev = JSON.parse(HISTORY.pop());
        if (prev.screen === 'pool') {
          prev.selectedSlot1 = null;
          prev.selectedSlot2 = null;
          prev.activeReaction = null;
          prev.prediction = [];
        }
        ++fillToken; prev.isFilling = false;
        S = prev;
        var previousTransfer = S.experiment ? S.experiment.transfer : (S.poured ? 1 : 0);
        window.MebiExperiment.reset(S, true);
        S.experiment.transfer = previousTransfer;
        if (S.labStep === 'pouring') S.labStep = 'ready';
        render();
      } else {
        if (S.screen === 'lab') {
          if (S.labStep === 'observed') {
            actions.restartExperiment();
            return;
          } else if (S.labStep === 'ready') {
            if (!window.MebiPrediction.started(S)) S.labStep = 'predictionSaved';
          } else {
            S.screen = 'pool';
            S.selectedSlot1 = null;
            S.selectedSlot2 = null;
            S.activeReaction = null;
            S.prediction = [];
          }
        } else if (S.screen === 'model') {
          S.screen = 'card';
        } else if (S.screen === 'card') {
          S.screen = 'lab';
          S.labStep = 'observed';

        } else if (S.screen === 'pool') {
          S.screen = 'menu';
        } else if (S.screen === 'collection') {
          if (S.resumeScreen && S.resumeScreen !== 'collection' && S.resumeScreen !== 'menu') {
            S.screen = S.resumeScreen;
            if (S.screen === 'lab' && S.resumeLabStep) S.labStep = S.resumeLabStep;
          } else {
            S.screen = 'menu';
          }
        }
        render();
      }
    }
  };

  function dispatch(action, arg, btn) {
    if (!actions[action]) return;
    if (S.saveTransition) return;
    if (/^(startNewExperiment|viewCollectionFromCompletion)$/.test(action) && window.MebiNonReaction && window.MebiNonReaction.scenario(S)) window.MebiNonReaction.get(S).notice=null;
    if (S.pendingRepeatPair && action !== 'confirmRepeatPair' && action !== 'cancelRepeatPair') return;
    if (/^(goMenu|goPool|changeReactants|resumeExperiment|goCollection|viewCollectionItem|startNewExperiment|viewCollectionFromCompletion)$/.test(action)) S.stageReview = null;
    if (!/^(navigateStage|closeStageReview|toggleStageHeader|cancelExperimentSafety|setObservationChoice|saveObservation|saveObservationAndProceed|openPredictionDialog|closePredictionDialog|setCollectionFilter|setObservationTab|saveObservationReflection|showObservationDesk|openObservationCard|toggleSafetyCheck|toggleAllSafetyChecks|acceptExperimentSafety|openParticleInspection|closeParticleInspection|toggleParticleNormal|seekParticleInspection|backToObservation|saveExplanation|toModel|saveModel|checkModel|checkModelDock|backToExplanation|setExplanationStep|reviewExplanationExperiment|closeExplanationExperiment|setModelSubView|addEquationTerm|removeEquationTerm|stepEquationCoeff|setEquationCoeff|clearEquationDraft|quickAddPlaceholder|checkEquation|saveEquation|saveModelAndToEquation|closeModelHelpModal|dismissBalancedModal|dismissCompletionModal|viewCollectionFromCompletion|startNewExperiment)$/.test(action) && action !== 'undoLast' && action !== 'toggleTheme' && action !== 'toggleAudio' && action !== 'zoomParticle' && action !== 'toggleFullscreen' && action !== 'testOrientation') {
      HISTORY.push(JSON.stringify(S));
      if (HISTORY.length > 40) HISTORY.shift();
    }
    actions[action](arg, btn);
  }

  /* ----------------- 6. RENDER VE GİRDİ BAĞLANTILARI ----------------- */
  var SCREENS = {
    menu: screenMenu,
    pool: screenPool,
    lab: screenLab,
    card: screenCard,
    model: screenModel,
    collection: screenCollection
  };


  function saveProgressHTML() {
    return '<span class="mebi-saving-indicator" role="status">' +
      '<span class="mebi-saving-ring">' +
        '<svg viewBox="0 0 32 32"><circle class="ring-bg" cx="16" cy="16" r="12"></circle><circle class="ring-bar" cx="16" cy="16" r="12"></circle></svg>' +
        '<span class="ring-icon">' + window.MebiSVG.icon('save') + '</span>' +
      '</span>' +
      '<span class="ring-text">Kaydediliyor…</span>' +
    '</span>';
  }

  // Keep the same progress ring visible for every save-and-advance action.
  function animateSave(btn, complete) {
    if (!btn) { complete(); return; }
    if (S.saveTransition) return;
    S.saveTransition={action:btn.dataset.action};
    paintSaveTransition();
    setTimeout(function(){S.saveTransition=null;complete();},700);
  }
  function paintSaveTransition() {
    if(!S.saveTransition)return;
    var buttons=document.querySelectorAll('[data-action="'+S.saveTransition.action+'"]');
    buttons.forEach(function(button){
      button.disabled=true;
      button.setAttribute('aria-busy','true');
      if(!button.previousElementSibling || !button.previousElementSibling.classList.contains('mebi-saving-indicator'))button.insertAdjacentHTML('beforebegin',saveProgressHTML());
    });
  }

  function render(scrollTop) {
    var app = document.getElementById('app');
    if (!app) return;
    if(S.explanationReview && (S.screen!=='lab'||S.stageReview||!S.observation?.record||S.explanationReview.observationId!==S.observation.record.id))S.explanationReview=null;
    if(S.particleInspection && (S.screen!=='lab'||S.stageReview||!window.MebiParticleInspection.eligible(S)))S.particleInspection=null;
    document.body.dataset.particleInspection=String(!!S.particleInspection);
    var focusedCard = document.activeElement;
    var focusedReagent = focusedCard && focusedCard.matches && focusedCard.matches('.reagent-gallery-card')
      ? focusedCard.getAttribute('data-arg') : null;
    var focusedObservation = focusedCard && focusedCard.getAttribute ? focusedCard.getAttribute('data-observation-control') : null;
    var focusedPrediction = focusedCard && focusedCard.getAttribute ? focusedCard.getAttribute('data-prediction-control') : null;
    var focusedSafety = focusedCard && focusedCard.getAttribute ? focusedCard.getAttribute('data-safety-control') : null;
    var fn = S.stageReview ? stageReviewHTML : SCREENS[S.screen] || screenMenu;
    var oldList = app.querySelector('.prediction-content, .reagent-gallery-grid, .lab-reagent-list, .observation-dock');
    var listScroll = oldList ? oldList.scrollTop : 0;
    var oldObservationPanel = app.querySelector('#observationPanel');
    var observationScroll = oldObservationPanel ? oldObservationPanel.scrollTop : 0;
    app.innerHTML = fn() + repeatPairDialogHTML();
    var newList = app.querySelector('.prediction-content, .reagent-gallery-grid, .lab-reagent-list, .observation-dock');
    if (newList) newList.scrollTop = listScroll;
    var newObservationPanel = app.querySelector('#observationPanel');
    if (newObservationPanel) newObservationPanel.scrollTop = observationScroll;
    app.dataset.screen = S.stageReview === 'pool' ? 'pool' : S.stageReview ? 'lab' : S.screen;
    if (window.LabScene) window.LabScene.sync(S, dispatch);
    wireInputs();
    paintSaveTransition();
    if (focusedSafety && S.screen === 'lab') {
      var safetyControl = app.querySelector('[data-safety-control="' + focusedSafety + '"]');
      if (safetyControl && !safetyControl.disabled) safetyControl.focus({ preventScroll:true });
    }
    window.MebiExperiment.wire(S);
    wireDragAndDrop();
    if (window.MebiFloatingCards) window.MebiFloatingCards.wire(S);
    if (window.requestAnimationFrame) window.requestAnimationFrame(fitStageHeader);
    if (focusedReagent && S.screen === 'pool') {
      var replacementCard = app.querySelector('.reagent-gallery-card[data-arg="' + focusedReagent + '"]');
      if (replacementCard) replacementCard.focus({ preventScroll: true });
    }
    if (focusedObservation && S.screen === 'lab') {
      var observationControl = app.querySelector('[data-observation-control="' + focusedObservation + '"]');
      if (observationControl && !observationControl.disabled) observationControl.focus({ preventScroll:true });
    }
    if (focusedPrediction && S.screen === 'lab') {
      var predictionControl = app.querySelector('[data-prediction-control="' + focusedPrediction + '"]');
      if (predictionControl) predictionControl.focus({ preventScroll:true });
    }
    if (S.screen === 'lab' && S.labStep === 'predict') {
      highlightSettingsGearOnce();
    }

    if (scrollTop !== false) {
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    }
    var repeatDialog = document.getElementById('repeatPairDialog');
    if (repeatDialog && typeof repeatDialog.showModal === 'function') {
      repeatDialog.addEventListener('cancel', function(event) { event.preventDefault(); dispatch('cancelRepeatPair'); });
      repeatDialog.addEventListener('keydown', function(event) {
        if (event.key !== 'Tab') return;
        var buttons = repeatDialog.querySelectorAll('button:not([disabled])');
        var first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      });
      repeatDialog.showModal();
    }
  }

  function wireInputs() {
    window.MebiPrediction.wireInputs(S);
    window.MebiObservation.wireInputs(S);
    window.MebiExplanation.wire(S);
    window.MebiModel.wire(S);
    if(window.MebiNonReaction)window.MebiNonReaction.wire(S);
    if(window.MebiParticleInspection)window.MebiParticleInspection.wire(S);
    var si = document.getElementById('poolSearchInput');
    if (si) {
      si.addEventListener('input', function() {
        S.searchQuery = si.value;
        render(false);
        var nsi = document.getElementById('poolSearchInput');
        if (nsi) {
          nsi.focus();
          nsi.setSelectionRange(nsi.value.length, nsi.value.length);
        }
      });
    }
  }

  /* ----------------- 7. ETKİLEŞİM DİNLEYİCİLERİ ----------------- */
  document.addEventListener('DOMContentLoaded', function() {
    var app = document.getElementById('app');
    if (app) {
      app.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        if (btn.disabled || btn.classList.contains('is-disabled')) return;
        var action = btn.getAttribute('data-action');
        var arg = btn.getAttribute('data-arg');
        dispatch(action, arg, btn);
      });

      // Klavye ile role="button" ve role="checkbox" erişimi (Enter ve Boşluk tuşu)
      app.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          var btn = e.target.closest('[data-action][role="button"], [data-action][role="checkbox"]');
          if (btn && !btn.disabled && !btn.classList.contains('is-disabled')) {
            e.preventDefault();
            btn.click();
          }
        }
      });

      // Hover sesleri
      app.addEventListener('mouseenter', function(e) {
        var el = e.target.closest('.beaker-card, .observation-chip, .mebi-btn, .mebi-filter-chip');
        if (el && window.MebiAudio) {
          window.MebiAudio.playHover();
        }
      }, true);
    }

    document.addEventListener('click', function(e) {
      if (!S.labSettingsOpen) return;
      var target = e.target;
      if (target && target.closest && target.closest('.lab-settings-wrap')) return;
      S.labSettingsOpen = false;
      render(false);
    });

    // Tam ekran durumu değiştiğinde buton ikonunu güncelle
    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(function(evt) {
      document.addEventListener(evt, function() {
        var isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        var btn = document.querySelector('[data-action="toggleFullscreen"]');
        if (btn && window.MebiSVG) {
          btn.innerHTML = window.MebiSVG.icon(isFs ? 'fullscreenExit' : 'fullscreen');
          btn.title = isFs ? 'Tam Ekrandan Çık' : 'Tam Ekran Modu';
        }
      });
    });

    render();
  });

  // Global erişim
  function resizeStageHeader() {
    if (window.requestAnimationFrame) window.requestAnimationFrame(fitStageHeader);
  }
  window.addEventListener('resize',resizeStageHeader);
  if (window.visualViewport) window.visualViewport.addEventListener('resize',resizeStageHeader);
  window.TepkimeArenasi = {
    get state() { return S; },
    dispatch: dispatch,
    render: render
  };

})(window);
