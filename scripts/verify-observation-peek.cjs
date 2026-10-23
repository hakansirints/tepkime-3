/* First-arrival countdown and a student's deliberate, persistent bench peek. */
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
let now = 0, nextTimer = 0, ring, button, dock, card;
const timers = new Map();
const classes = new Set();
const content = {scrollTop:27};
const document = {
  querySelector(selector) {
    if (selector === '#app #observationCard') return card;
    if (selector === '#app .observation-live-dock') return dock;
    return null;
  },
  createElement() {return {setAttribute(){}, remove(){dock=null;}};}
};
card = {
  classList:{toggle(k,on){on?classes.add(k):classes.delete(k);},add:k=>classes.add(k),remove:k=>classes.delete(k)},
  parentNode:{appendChild(el){dock=el;}},
  querySelector(selector) {
    return selector === '.observation-auto-open' ? ring : selector === '.observation-peek-toggle' ? button : selector === '.prediction-content' ? content : null;
  },
  insertAdjacentHTML(position, html) {
    if (html.includes('observation-auto-open')) ring={style:{setProperty(){}},remove(){ring=null;}};
    if (html.includes('observation-peek-toggle')) button={listeners:{},setAttribute(){},removeAttribute(){},focus(){},addEventListener(type,fn){this.listeners[type]=fn;}};
  }
};
const c={document,Date:{now:()=>now},MebiSVG:{icon:()=>''},MebiExperiment:{cardHTML:()=>'',paint(){}},
  setTimeout(fn,delay){const id=++nextTimer;timers.set(id,{fn,at:now+delay});return id;},clearTimeout:id=>timers.delete(id)};
c.window=c;
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../js/floating-cards.js'),'utf8'),c);
function advance(ms) {
  now+=ms;
  for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.fn();}
}
let stopped = 0;
function clickPeek(){button.listeners.click({stopPropagation(){stopped++;}});}
const s={screen:'lab',labStep:'observed',observation:{attemptId:'first'},benchAttention:true};
const api=c.MebiFloatingCards;
api.wire(s);assert(api.isCollapsed());assert(ring);assert.equal(timers.size,1);
advance(4999);assert(api.isCollapsed());advance(1);assert(!api.isCollapsed());assert(!ring);
clickPeek();assert(api.isCollapsed());assert(!ring);assert.equal(timers.size,0);assert.equal(stopped,1,'One peek must not bubble into the app reopen action');
api.wire(s);advance(10000);assert(api.isCollapsed());assert(!ring,'A rerender must not restart a manual countdown');
clickPeek();assert(!api.isCollapsed());assert.equal(content.scrollTop,27);
api.collapse(s);advance(10000);assert(api.isCollapsed());assert(!ring);
api.expand(s);assert(!api.isCollapsed());assert(!ring);
s.observation.attemptId='second';button=null;api.wire(s);assert(api.isCollapsed());assert(ring,'A new experiment gets its own initial countdown');
clickPeek();assert(!api.isCollapsed());assert(!ring);advance(5000);assert(!api.isCollapsed());
s.screen='pool';api.wire(s);assert.equal(timers.size,0);
console.log(JSON.stringify({passed:true,checks:['first arrival opens after five seconds','manual collapse has no timer and stays collapsed','click handled once','rerender preserves the manual choice','scroll restored','new attempt has a fresh countdown','manual early opening cancels countdown']}));
