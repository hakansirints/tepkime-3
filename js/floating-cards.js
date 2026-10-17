/* Minimize laboratory forms without discarding their draft inputs or scroll. */
(function(window) {
  'use strict';
  var states = {}, effects = [], activeCard = null, drag = null;
  var size = 92, margin = 8;
  function viewport() {
    var view = window.visualViewport;
    return { left:view ? view.offsetLeft : 0, top:view ? view.offsetTop : 0,
      width:view ? view.width : window.innerWidth, height:view ? view.height : window.innerHeight };
  }
  function place(card, state, x, y) {
    var view = viewport();
    state.x = Math.max(view.left + margin, Math.min(x, view.left + view.width - size - margin));
    state.y = Math.max(view.top + margin, Math.min(y, view.top + view.height - size - margin));
    card.style.setProperty('--floating-left', state.x + 'px');
    card.style.setProperty('--floating-top', state.y + 'px');
    positionPrompt(card);
  }
  function positionPrompt(card) {
    var prompt = document.querySelector('.observation-open-hint');
    if (!prompt || !card.classList.contains('observation-card')) return;
    var view = viewport(), box = card.getBoundingClientRect(), hint = prompt.getBoundingClientRect();
    var right = box.right + 12, left = box.left - hint.width - 12;
    var x = right + hint.width <= view.left + view.width - margin ? right : left >= view.left + margin ? left : box.left;
    var y = box.top + (size - hint.height) / 2;
    if (right + hint.width > view.left + view.width - margin && left < view.left + margin) y = box.bottom + 10;
    x = Math.max(view.left + margin,Math.min(x,view.left + view.width - hint.width - margin));
    y = Math.max(view.top + margin,Math.min(y,view.top + view.height - hint.height - margin));
    prompt.style.left = x + 'px'; prompt.style.top = y + 'px';
  }
  function syncPrompt(card,state) {
    var prompt = document.querySelector('.observation-open-hint');
    var waiting = card.classList.contains('observation-card') && state.minimized && !state.labState.observation.record;
    card.classList.toggle('is-awaiting-observation',waiting);
    if (!waiting) { if (prompt) prompt.remove(); return; }
    if (!prompt) {
      prompt = document.createElement('button'); prompt.type = 'button'; prompt.className = 'observation-open-hint';
      prompt.setAttribute('aria-controls','observationCard');
      prompt.innerHTML = window.MebiSVG.icon('eye') + '<span>Gözlemini kaydetmek için<br><strong>buraya tıkla</strong></span>';
      prompt.addEventListener('click',function() { transition(card,state,'expanded'); });
      card.parentNode.appendChild(prompt);
    }
    positionPrompt(card);
  }
  function cleanup() {
    effects.forEach(function(effect) { effect.animation.cancel(); if (effect.ghost) effect.ghost.remove(); });
    effects = [];
  }
  function positionLiveData(card, state, dock) {
    var shell = document.querySelector('#app .mebi-top-shell');
    var stepper = document.querySelector('#app .mebi-stepper');
    var top = Math.max(shell ? shell.getBoundingClientRect().bottom : 0, stepper ? stepper.getBoundingClientRect().bottom : 0);
    if (state.collapsed) top = Math.max(top, card.getBoundingClientRect().bottom);
    dock.style.setProperty('--observation-data-top', Math.ceil(top + 12) + 'px');
  }
  function syncLiveData(card, state) {
    var dock = document.querySelector('#app .observation-live-dock');
    var visible = card.classList.contains('observation-card') && (state.collapsed || state.minimized);
    var changed = false;
    if (!visible) {
      if (dock) { dock.remove(); changed = true; }
    } else {
      if (!dock) {
        dock = document.createElement('aside');
        dock.id = 'benchDock';
        dock.className = 'bench-dock observation-live-dock';
        dock.setAttribute('aria-label', 'Deneyin anlık verileri');
        dock.innerHTML = window.MebiExperiment.cardHTML(state.labState) + (window.MebiParticleInspection ? window.MebiParticleInspection.entryHTML(state.labState) : '');
        card.parentNode.appendChild(dock);
        changed = true;
      }
      positionLiveData(card,state,dock);
      window.MebiExperiment.paint(state.labState);
    }
    if (changed && window.LabScene && window.LabScene.refreshLayout) window.LabScene.refreshLayout();
  }
  function apply(card, state) {
    card.classList.toggle('is-minimized', state.minimized);
    card.classList.toggle('is-collapsed', !!state.collapsed);
    card.querySelector('.floating-card-tile').hidden = !state.minimized;
    var peek = card.querySelector('.observation-peek-toggle');
    if (peek) {
      peek.innerHTML = window.MebiSVG.icon(state.collapsed ? 'down' : 'eye') + '<span>' + (state.collapsed ? 'Gözlem kartına dön' : 'Deneyi gözle') + '</span>';
      peek.setAttribute('aria-expanded', String(!state.collapsed));
      peek.title = state.collapsed ? 'Gözlem kartını yeniden aç' : 'Kartı yukarı toparla ve deney masasını gözle';
    }
    if (state.minimized) {
      var view = viewport();
      place(card, state, state.x == null ? view.left + view.width - size - 20 : state.x,
        state.y == null ? view.top + view.height - size - 20 : state.y);
    }
    syncLiveData(card,state);
    syncPrompt(card,state);
  }
  function transition(card, state, mode, focusSelector) {
    cleanup();
    var before = card.getBoundingClientRect();
    if (mode === 'minimized' && !state.minimized && card.classList.contains('observation-card')) {
      state.x = before.left; state.y = before.top;
    }
    var content = card.querySelector('.prediction-content');
    if (!state.minimized && !state.collapsed && mode !== 'expanded') state.scroll = content.scrollTop;
    var animate = typeof card.animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ghost = animate ? card.cloneNode(true) : null;
    state.minimized = mode === 'minimized';
    state.collapsed = mode === 'collapsed';
    apply(card, state);
    if (mode === 'expanded') content.scrollTop = state.scroll || 0;
    if (ghost) {
      ghost.removeAttribute('id');
      ghost.querySelectorAll('[id]').forEach(function(element) { element.removeAttribute('id'); });
      ghost.setAttribute('aria-hidden', 'true');
      ghost.setAttribute('data-floating-ghost', '');
      ghost.inert = true;
      Object.assign(ghost.style, { position:'fixed', left:before.left + 'px', top:before.top + 'px',
        width:before.width + 'px', height:before.height + 'px', maxHeight:'none', margin:'0', transformOrigin:'top left' });
      card.parentNode.appendChild(ghost);
      ghost.querySelector('.prediction-content').scrollTop = state.scroll || 0;
      var after = card.getBoundingClientRect();
      var motion = ghost.animate([
        { transform:'translate(0,0) scale(1,1)', opacity:1 },
        { transform:'translate(' + (after.left - before.left) + 'px,' + (after.top - before.top) + 'px) scale(' + after.width / before.width + ',' + after.height / before.height + ')', opacity:0 }
      ], { duration:360, easing:'cubic-bezier(.22,.8,.25,1)' });
      var fade = card.animate([{opacity:0},{opacity:1}], {duration:260,delay:80,fill:'backwards'});
      effects.push({animation:motion,ghost:ghost},{animation:fade});
      motion.onfinish = function() { ghost.remove(); };
    }
    card.querySelector(focusSelector || (state.minimized ? '.floating-card-restore' : '.floating-card-minimize')).focus({preventScroll:true});
  }
  function stopDrag() {
    if (!drag) return;
    var previous = drag; drag = null;
    previous.card.classList.remove('is-dragging');
    if (previous.handle.hasPointerCapture(previous.pointerId)) previous.handle.releasePointerCapture(previous.pointerId);
  }
  function wire(state) {
    cleanup(); stopDrag(); activeCard = null;
    if (state.screen === 'pool' || state.screen === 'menu') states = {};
    var card = document.querySelector('#app .prediction-card');
    if (!card) return;
    var kind = card.classList.contains('observation-card') ? 'observation' : 'prediction';
    var identity = kind === 'observation' ? state.observation.attemptId : [state.selectedSlot1,state.selectedSlot2].join('|');
    var fresh = !states[kind] || states[kind].identity !== identity;
    if (fresh) states[kind] = {identity:identity,minimized:false,collapsed:false,x:null,y:null};
    var current = states[kind], title = kind === 'observation' ? 'Gözlem' : 'Tahmin';
    current.labState = state;
    activeCard = {card:card,state:current};
    card.classList.add('floating-card-enabled');
    if (!card.querySelector('.floating-card-minimize')) {
      card.insertAdjacentHTML('afterbegin', '<button type="button" class="floating-card-minimize" title="Simge durumuna küçült" aria-label="' + title + ' kartını simge durumuna küçült">' + window.MebiSVG.icon('none') + '</button>');
      card.insertAdjacentHTML('beforeend', '<div class="floating-card-tile" hidden><button type="button" class="floating-card-grip" title="' + (kind === 'observation' ? 'Gözlem kartını açmak için tıkla; taşımak için sürükle' : 'Taşımak için sürükle; klavyede ok tuşlarını kullan') + '" aria-label="' + title + (kind === 'observation' ? ' kartını aç veya sürükleyerek taşı' : ' kartını taşı') + '" aria-describedby="floatingCardHint"><span class="floating-card-symbol" aria-hidden="true">' + window.MebiSVG.icon(kind === 'observation' ? 'eye' : 'helpCircle') + '</span><span>' + title + '</span></button><button type="button" class="floating-card-restore" title="Eski boyutuna getir" aria-label="' + title + ' kartını eski boyutuna getir">' + window.MebiSVG.icon('fullscreen') + '</button><span class="sr-only" id="floatingCardHint">Kartı sürükleyerek veya ok tuşlarıyla taşı. Escape tuşuyla eski boyutuna getir.' + (kind === 'observation' ? ' Tıklayarak veya Enter tuşuyla gözlem kartını aç.' : '') + '</span></div>');
      card.querySelector('.floating-card-minimize').addEventListener('click', function() { transition(card,current,'minimized'); });
      card.querySelector('.floating-card-restore').addEventListener('click', function() { transition(card,current,'expanded'); });
      if (kind === 'observation') {
        card.insertAdjacentHTML('afterbegin', '<button type="button" class="observation-peek-toggle" data-observation-control="peek" aria-controls="observationPanel"></button>');
        card.querySelector('.observation-peek-toggle').addEventListener('click', function() {
          transition(card,current,current.collapsed ? 'expanded' : 'collapsed','.observation-peek-toggle');
        });
      }
      var handle = card.querySelector('.floating-card-grip');
      handle.addEventListener('pointerdown', function(event) {
        if (!event.isPrimary || event.button !== 0) return;
        event.preventDefault(); event.stopPropagation(); cleanup();
        current.suppressClick = false;
        handle.focus({preventScroll:true});
        drag = {card:card,handle:handle,pointerId:event.pointerId,x:event.clientX,y:event.clientY,left:current.x,top:current.y};
        card.classList.add('is-dragging'); handle.setPointerCapture(event.pointerId);
      });
      handle.addEventListener('pointermove', function(event) {
        if (!drag || drag.pointerId !== event.pointerId) return;
        event.preventDefault();
        if (Math.abs(event.clientX-drag.x) + Math.abs(event.clientY-drag.y) > 6) current.suppressClick = true;
        place(card,current,drag.left + event.clientX - drag.x,drag.top + event.clientY - drag.y);
      });
      ['pointerup','pointercancel','lostpointercapture'].forEach(function(name) { handle.addEventListener(name,stopDrag); });
      if (kind === 'observation') handle.addEventListener('click',function(event) {
        if (current.suppressClick && event.detail !== 0) { current.suppressClick = false; return; }
        transition(card,current,'expanded');
      });
      handle.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); transition(card,current,'expanded'); return; }
        var direction = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
        if (!direction) return;
        event.preventDefault(); event.stopPropagation();
        var step = event.shiftKey ? 40 : 10;
        place(card,current,current.x + direction[0] * step,current.y + direction[1] * step);
      });
    }
    if (fresh && kind === 'observation' && !state.observation.record) {
      var origin = card.getBoundingClientRect();
      current.x = origin.left; current.y = origin.top; current.minimized = true;
    }
    apply(card,current);
  }
  function resize() {
    cleanup(); stopDrag();
    if (activeCard && activeCard.card.isConnected && activeCard.state.minimized) place(activeCard.card,activeCard.state,activeCard.state.x,activeCard.state.y);
    var dock = document.querySelector('#app .observation-live-dock');
    if (dock && activeCard && activeCard.card.isConnected) positionLiveData(activeCard.card,activeCard.state,dock);
  }
  window.addEventListener('resize',resize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize',resize);
  window.MebiFloatingCards = {wire:wire};
})(window);
