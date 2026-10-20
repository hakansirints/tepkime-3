/* Fold observation/comparison into a translucent strip without moving the camera. */
(function(window) {
  'use strict';
  var current = null, effects = [];
  function cleanup() {
    effects.forEach(function(effect) { effect.animation.cancel(); if (effect.ghost) effect.ghost.remove(); });
    effects = [];
  }
  function apply(card, state, labState) {
    card.classList.toggle('is-collapsed',state.collapsed);
    var button = card.querySelector('.observation-peek-toggle');
    button.innerHTML = window.MebiSVG.icon(state.collapsed ? 'down' : 'eye') + '<span>' + (state.collapsed ? 'Gözlem kartına dön' : 'Deneyi gözle') + '</span>';
    button.setAttribute('aria-expanded',String(!state.collapsed));
    button.title = state.collapsed ? 'Gözlem ve karşılaştırma kartını yeniden aç' : 'Kartı şerit hâline getir ve deneyi gözle';
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
    if (!state.collapsed) state.scroll = content.scrollTop;
    state.collapsed = !state.collapsed;
    apply(card,state,labState);
    if (!state.collapsed) content.scrollTop = state.scroll || 0;
    if (card.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var opacity=Number(getComputedStyle(card).opacity);
      var motion=card.animate([{opacity:opacity*.65},{opacity:opacity}],{duration:160,easing:'ease-out'});
      effects.push({animation:motion});
    }
    card.querySelector('.observation-peek-toggle').focus({preventScroll:true});
  }
  function wire(labState) {
    cleanup();
    if (labState.screen==='pool' || labState.screen==='menu') current=null;
    var card=document.querySelector('#app .observation-card');
    if (!card) return;
    var identity=labState.observation.attemptId;
    if (!current || current.identity!==identity) current={identity:identity,collapsed:false,scroll:0};
    var state=current;
    card.classList.add('floating-card-enabled');
    card.insertAdjacentHTML('afterbegin','<button type="button" class="observation-peek-toggle" data-observation-control="peek" aria-controls="observationPanel"></button>');
    card.querySelector('.observation-peek-toggle').addEventListener('click',function() {toggle(card,state,labState);});
    apply(card,state,labState);
  }
  window.MebiFloatingCards={wire:wire};
})(window);
