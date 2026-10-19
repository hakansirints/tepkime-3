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
    var content = card.querySelector('.prediction-content'), before = card.getBoundingClientRect();
    if (!state.collapsed) state.scroll = content.scrollTop;
    var animate = card.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ghost = animate ? card.cloneNode(true) : null;
    var wasCollapsed = state.collapsed;
    state.collapsed = !state.collapsed;
    apply(card,state,labState);
    if (!state.collapsed) content.scrollTop = state.scroll || 0;
    if (ghost) {
      if (wasCollapsed) {ghost.classList.remove('is-collapsed');ghost.setAttribute('data-peek-strip','');}
      ghost.removeAttribute('id');ghost.querySelectorAll('[id]').forEach(function(el) {el.removeAttribute('id');});
      ghost.setAttribute('aria-hidden','true');ghost.setAttribute('data-floating-ghost','');ghost.inert=true;
      Object.assign(ghost.style,{position:'fixed',left:before.left+'px',top:before.top+'px',width:before.width+'px',height:before.height+'px',maxHeight:'none',margin:'0',transformOrigin:'top left',pointerEvents:'none'});
      card.parentNode.appendChild(ghost);
      ghost.querySelector('.prediction-content').scrollTop = state.scroll || 0;
      var after = card.getBoundingClientRect();
      var motion = ghost.animate([{transform:'none',opacity:1},{transform:'translate('+(after.left-before.left)+'px,'+(after.top-before.top)+'px) scale('+after.width/before.width+','+after.height/before.height+')',opacity:0}],{duration:320,easing:'cubic-bezier(.22,.8,.25,1)'});
      effects.push({animation:motion,ghost:ghost});motion.onfinish=function() {ghost.remove();};
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
