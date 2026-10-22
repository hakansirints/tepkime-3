/* Fold observation/comparison into a translucent strip without moving the camera. */
(function(window) {
  'use strict';
  var current = null, effects = [], autoOpenTimer = null;
  var AUTO_OPEN_MS = 5000;
  function cleanup() {
    effects.forEach(function(effect) { effect.animation.cancel(); if (effect.ghost) effect.ghost.remove(); });
    effects = [];
  }
  function stopAutoOpen() {
    if (autoOpenTimer !== null) window.clearTimeout(autoOpenTimer);
    autoOpenTimer = null;
    if (current) current.autoOpenAt = 0;
  }
  function syncAutoOpen(card, state, labState) {
    var ring = card.querySelector('.observation-auto-open');
    if (!state.collapsed || labState.screen !== 'lab' || labState.labStep !== 'observed' || labState.stageReview || labState.particleInspection || labState.explanationReview) {
      stopAutoOpen();
      if (ring) ring.remove();
      return;
    }
    if (!state.autoOpenAt) state.autoOpenAt = Date.now() + AUTO_OPEN_MS;
    if (!ring) {
      card.insertAdjacentHTML('beforeend', '<span class="observation-auto-open" role="timer" aria-label="Gözlem kartı 5 saniye içinde otomatik açılacak" title="Gözlem kartı 5 saniye içinde otomatik açılır"><svg viewBox="0 0 32 32" aria-hidden="true"><circle class="observation-auto-track" cx="16" cy="16" r="13"/><circle class="observation-auto-progress" cx="16" cy="16" r="13" pathLength="100"/></svg></span>');
      ring = card.querySelector('.observation-auto-open');
      ring.style.setProperty('--auto-open-elapsed', (Date.now() - state.autoOpenAt + AUTO_OPEN_MS) * -1 + 'ms');
    }
    if (autoOpenTimer === null) autoOpenTimer = window.setTimeout(function() {
      autoOpenTimer = null;
      var liveCard = document.querySelector('#app #observationCard');
      if (current !== state || !state.collapsed || !liveCard || labState.screen !== 'lab' || labState.labStep !== 'observed' || labState.stageReview || labState.particleInspection || labState.explanationReview) return;
      state.collapsed = false; state.autoOpenAt = 0; labState.benchAttention = false;
      apply(liveCard, state, labState);
    }, Math.max(0, state.autoOpenAt - Date.now()));
  }
  function apply(card, state, labState) {
    card.classList.toggle('is-collapsed', state.collapsed);
    syncAutoOpen(card, state, labState);
    if (labState && labState.benchAttention && state.collapsed) {
      card.classList.add('is-attention-pulse');
    } else {
      card.classList.remove('is-attention-pulse');
    }
    var button = card.querySelector('.observation-peek-toggle');
    if (button) {
      button.innerHTML = window.MebiSVG.icon(state.collapsed ? 'down' : 'eye') + '<span>' + (state.collapsed ? 'Deney Gözlem Kartını Aç' : 'Deneyi gözle') + '</span>';
      button.setAttribute('aria-expanded', String(!state.collapsed));
      button.title = state.collapsed ? 'Deney gözlem kartını aç' : 'Kartı şerit hâline getir ve deneyi gözle';
      if (state.collapsed) {
        button.setAttribute('data-action', 'openObservationCard');
      } else {
        button.removeAttribute('data-action');
      }
    }
    var dock = document.querySelector('#app .observation-live-dock');
    if (!state.collapsed) { if (dock) dock.remove(); }
    else {
      if (!dock) {
        dock = document.createElement('aside'); dock.id='benchDock'; dock.className='bench-dock observation-live-dock';
        dock.setAttribute('aria-label','Deneyin anlık verileri');
        dock.innerHTML = window.MebiExperiment.cardHTML(labState);
        card.parentNode.appendChild(dock);
      }
      window.MebiExperiment.paint(labState);
    }
    if (window.LabScene && window.LabScene.refreshLayout) window.LabScene.refreshLayout();
  }
  function toggle(card, state, labState) {
    cleanup();
    var content = card.querySelector('.prediction-content');
    if (!state.collapsed) state.scroll = content ? content.scrollTop : 0;
    state.collapsed = !state.collapsed;
    if (!state.collapsed && labState) {
      labState.benchAttention = false;
    }
    apply(card, state, labState);
    if (!state.collapsed && content) content.scrollTop = state.scroll || 0;
    if (card.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var opacity = Number(getComputedStyle(card).opacity);
      var motion = card.animate([{opacity:opacity*.65},{opacity:opacity}],{duration:160,easing:'ease-out'});
      effects.push({animation:motion});
    }
    var btn = card.querySelector('.observation-peek-toggle');
    if (btn) btn.focus({preventScroll:true});
  }
  function wire(labState) {
    cleanup();
    if (labState.screen==='pool' || labState.screen==='menu') { stopAutoOpen(); current=null; }
    var card=document.querySelector('#app #observationCard');
    if (!card) { stopAutoOpen(); return; }
    var identity=labState.observation.attemptId;
    if (!current || current.identity!==identity) { stopAutoOpen(); current={identity:identity,collapsed:true,scroll:0,autoOpenAt:0}; }
    var state=current;
    card.classList.add('floating-card-enabled');
    var btn = card.querySelector('.observation-peek-toggle');
    if (!btn) {
      card.insertAdjacentHTML('afterbegin','<button type="button" class="observation-peek-toggle" data-observation-control="peek" aria-controls="observationPanel"></button>');
      btn = card.querySelector('.observation-peek-toggle');
      btn.addEventListener('click',function() {
        if (state.collapsed && labState) labState.benchAttention = false;
        toggle(card,state,labState);
      });
    }
    apply(card,state,labState);
  }
  function expand(labState) {
    if (current && current.collapsed) {
      current.collapsed = false;
      if (labState) labState.benchAttention = false;
      var card = document.querySelector('#app #observationCard');
      if (card) {
        card.classList.remove('is-attention-pulse');
        apply(card, current, labState || (window.TepkimeArenasi ? window.TepkimeArenasi.state : null));
      }
    }
  }
  function collapse(labState) {
    if (current && !current.collapsed) {
      current.collapsed = true;
      var card = document.querySelector('#app #observationCard');
      if (card) {
        apply(card, current, labState || (window.TepkimeArenasi ? window.TepkimeArenasi.state : null));
      }
    }
  }
  function isCollapsed() {
    return current ? !!current.collapsed : false;
  }
  window.MebiFloatingCards={wire:wire, expand:expand, collapse:collapse, isCollapsed:isCollapsed};
})(window);
