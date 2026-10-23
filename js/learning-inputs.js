/* Handle a phone tap before a rerender can discard its compatibility click. */
(function(window) {
  'use strict';
  function wire(app, activate) {
    var gesture = null, handled = null;
    function choice(event) {
      var button = event.target.closest && event.target.closest('button.learning-mark[data-action]');
      return button && app.contains(button) && !button.disabled ? button : null;
    }
    function mobileTouch(event) {
      return event.pointerType === 'touch' && event.isPrimary !== false &&
        window.matchMedia('(max-width:1024px) and (max-height:650px) and (orientation:landscape)').matches;
    }
    app.addEventListener('pointerdown', function(event) {
      var button = choice(event);
      if (!mobileTouch(event) || !button) return;
      var scroller = button.closest('.prediction-content');
      gesture = {id:event.pointerId, button:button, x:event.clientX, y:event.clientY,
        scroller:scroller, scroll:scroller ? scroller.scrollTop : 0, moved:false};
    });
    app.addEventListener('pointermove', function(event) {
      if (gesture && event.pointerId === gesture.id &&
        Math.hypot(event.clientX - gesture.x,event.clientY - gesture.y) > 8) gesture.moved = true;
    });
    app.addEventListener('pointercancel', function(event) {
      if (gesture && event.pointerId === gesture.id) gesture = null;
    });
    app.addEventListener('pointerup', function(event) {
      if (!gesture || event.pointerId !== gesture.id) return;
      var tap = gesture; gesture = null;
      if (tap.moved || choice(event) !== tap.button ||
        Math.hypot(event.clientX - tap.x,event.clientY - tap.y) > 8 ||
        (tap.scroller && tap.scroller.scrollTop !== tap.scroll)) return;
      if (event.cancelable) event.preventDefault();
      handled = {x:event.clientX,y:event.clientY,at:Date.now()};
      tap.button.focus({preventScroll:true});
      activate(tap.button);
    });
    return {
      suppressClick:function(event) {
        if (event.pointerType === 'mouse' && !(event.sourceCapabilities && event.sourceCapabilities.firesTouchEvents)) return false;
        return !!(handled && event.detail !== 0 && Date.now() - handled.at < 700 &&
          Math.hypot(event.clientX - handled.x,event.clientY - handled.y) <= 12);
      }
    };
  }
  window.MebiLearningInputs = {wire:wire};
})(window);
