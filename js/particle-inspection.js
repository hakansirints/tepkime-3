/* The lens and the laboratory share one playback clock and immutable records. */
(function(window){
 'use strict';
 let cleanup=null;
 function eligible(state){return !!(state.predictionRecord&&state.observation&&state.observation.record&&state.selectedSlot1&&state.selectedSlot2)}
 function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 function settings(state){const p=state.particleInspection;if(!p)return null;if(!p.lens)p.lens={vessel:0,focus:{x:.5,y:.5},yaw:.25,pitch:.15,water:false,selectedAtom:null,zoom:1,windowPosition:null};p.lens.zoom=p.lens.zoom||1;return p.lens;}
 function buttons(view){return '<div class="beaker-particle-modes" role="group" aria-label="Beherlerde tanecik görünümü">'+[['before','Dökülmeden önce'],['reaction','Tepkimeyi izle']].map(([key,label])=>'<button type="button" class="mebi-btn mebi-btn-sm '+(key===view?'mebi-btn-primary':'mebi-btn-secondary')+'" data-action="openParticleInspection" data-arg="'+key+'" aria-pressed="'+(key===view)+'">'+window.MebiSVG.icon(key==='before'?'beakerIc':'eye')+label+'</button>').join('')+'</div>'}
 function panelHTML(state){
  settings(state);const p=state.particleInspection,stages=[['before','1. Beher'],['second','2. Beher'],['reaction','Karışırken'],['after','Son durum']];
  return '<aside class="bench-dock beaker-particle-panel particle-lens-panel" id="benchDock" aria-label="Tanecik merceği ve inceleme kontrolleri"><div class="particle-lens-controls">'+
   '<header class="dock-header"><span class="dock-badge">TANECİK MERCEĞİ</span><h3 class="dock-title">Beherden taneciklere</h3><p class="dock-subtext" id="particleLensHelp">Beherdeki halkayı sürükle veya sıvıya dokun. Yön tuşlarıyla da taşıyabilirsin.</p></header>'+
   '<nav class="beaker-particle-modes particle-lens-stages" aria-label="Tanecik inceleme evreleri">'+stages.map(([value,label])=>'<button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="setParticleLensStage" data-arg="'+value+'" aria-pressed="false">'+label+'</button>').join('')+'</nav>'+
   '<p class="beaker-particle-phase" id="particleInspectionPhase" role="status">Tanecik modelleri hazırlanıyor…</p>'+
   '<div class="beaker-particle-actions"><span class="particle-lens-live"><i aria-hidden="true"></i>Canlı görünüm</span><button type="button" class="mebi-btn mebi-btn-secondary mebi-btn-sm" data-action="toggleParticleNormal" id="particleNormalButton">Merceği gizle</button></div>'+
   '<div class="beaker-particle-timeline"><label for="particleInspectionTime">Karışma ve ürün oluşumu</label><input id="particleInspectionTime" type="range" min="0" max="1600" value="0" step="1" aria-label="Tanecik gösteriminin ilerlemesi"></div>'+
   '<details class="particle-lens-settings"><summary>Kesit seçenekleri</summary><div class="particle-lens-camera" role="group" aria-label="Tanecik kesitini döndür"><button type="button" data-lens-rotate="-1" aria-label="Kesiti sola döndür">↶</button><span>Kesiti döndür</span><button type="button" data-lens-rotate="1" aria-label="Kesiti sağa döndür">↷</button></div><div class="particle-lens-options"><label><input type="checkbox" id="particleLensWater">Çözücü suyu göster</label><button type="button" data-lens-clear disabled>Seçimi temizle</button></div><div class="particle-lens-zoom" role="group" aria-label="Mercek yakınlığı"><button type="button" data-lens-zoom="out" aria-label="Mercekte uzaklaştır">−</button><output id="particleLensZoom" aria-live="polite">1,0×</output><button type="button" data-lens-zoom="in" aria-label="Mercekte yakınlaştır">+</button><button type="button" data-lens-zoom="reset" aria-label="Mercek yakınlığını sıfırla">Sıfırla</button></div><p class="particle-lens-selection" id="particleLensSelection" role="status">Bir atoma dokun: türünü ve hangi beherden geldiğini gör.</p></details>'+
   '<details class="beaker-particle-help"><summary>Model ve deney koşulları</summary><p class="beaker-particle-condition" id="particleInspectionCondition"></p><p class="beaker-particle-note">Gerçek mikroskop görüntüsü değildir. Tanecik sayıları, boyutlar ve süreler temsilîdir. Kesite tanecikler girip çıkabilir.</p></details>'+
   '</div><button type="button" class="mebi-btn mebi-btn-primary dock-btn-full" data-action="closeParticleInspection">'+(p.returnScreen==='card'?'Açıklama Kartına Dön':'Gözlem Kartına Dön')+'</button></aside>'+
   '<section class="particle-lens-display particle-lens-window" aria-label="Seçilen bölgenin tanecik modeli"><div class="particle-lens-caption"><span id="particleLensOrigin">1. BEHER</span><span>TANECİK KESİTİ</span></div><div class="particle-lens-viewport" id="particleLensViewport" title="Sol tuş: kesiti döndür · Sağ tuş veya kenar: merceği taşı · Tekerlek: yakınlaş"><canvas id="particleLensCanvas" role="img" aria-label="Seçilen bölgenin döndürülebilir 3B tanecik kesiti"></canvas><svg class="particle-lens-rim" id="particleLensRim" viewBox="0 0 100 100" role="button" tabindex="0" aria-label="Merceği kenarından taşı; yön tuşlarıyla da taşıyabilirsin"><circle cx="50" cy="50" r="48"/></svg></div><div class="particle-lens-species" id="particleLensSpecies" aria-label="Kesitteki tanecik türleri"></div><p class="particle-lens-hint">Kenardan / sağ tuşla taşı · Tekerlekle yakınlaş</p></section>'+
   '<div class="particle-lens-targets" id="particleLensTargets" aria-label="Beher üzerinde odak seçimi"><svg id="particleLensConnector" aria-hidden="true"><path/></svg>'+[0,1].map(index=>'<button type="button" class="particle-lens-target" data-lens-target="'+index+'" aria-label="'+(index+1)+'. beherdeki odak noktasını taşı" aria-describedby="particleLensHelp" hidden><span aria-hidden="true">✥</span></button>').join('')+'</div>';
 }
 function stage(state,value){
  const p=state.particleInspection;if(!p||!['before','second','reaction','after'].includes(value))return false;
  const l=settings(state);l.vessel=value==='second'?1:0;
  p.view=value==='before'||value==='second'?'before':'reaction';p.time=value==='after'?16:value==='reaction'?3:0;p.micro=true;p.revision++;
  paint(state);return true;
 }
 function paint(state,summary){
  const p=state.particleInspection;if(!p)return;const l=settings(state),time=summary?.time??p.time??0;
  const normal=document.getElementById('particleNormalButton');
  if(normal){normal.textContent=p.micro?'Merceği gizle':'Merceği göster';normal.setAttribute('aria-pressed',String(!p.micro));}
  const active=p.view==='before'?(l.vessel?'second':'before'):time>=15.95?'after':'reaction';
  document.querySelectorAll('.particle-lens-stages button').forEach(button=>{const selected=button.dataset.arg===active;button.setAttribute('aria-pressed',String(selected));button.classList.toggle('mebi-btn-primary',selected);button.classList.toggle('mebi-btn-secondary',!selected);});
  const origin=document.getElementById('particleLensOrigin');if(origin)origin.textContent=(l.vessel+1)+'. BEHER';
  const display=document.querySelector('.particle-lens-display');if(display)display.hidden=!p.micro;
  const timeline=document.querySelector('.beaker-particle-timeline');if(timeline)timeline.hidden=p.view==='before';
  const water=document.getElementById('particleLensWater');if(water)water.checked=l.water;
  const zoom=document.getElementById('particleLensZoom');if(zoom)zoom.textContent=l.zoom.toFixed(1).replace('.',',')+'×';
  const clear=document.querySelector('[data-lens-clear]');if(clear)clear.disabled=l.selectedAtom==null;
  if(summary){const phase=document.getElementById('particleInspectionPhase'),range=document.getElementById('particleInspectionTime');if(phase&&phase.textContent!==summary.phase)phase.textContent=summary.phase;if(range){range.value=Math.round(time*100);range.setAttribute('aria-valuetext',summary.phase);}const condition=document.getElementById('particleInspectionCondition'),note=summary.notes.join(' ');if(condition&&condition.textContent!==note)condition.textContent=note;}
 }
 function windowBounds(){
  const element=document.querySelector('.particle-lens-window');if(!element)return null;
  const box=element.getBoundingClientRect(),panel=document.querySelector('.particle-lens-panel')?.getBoundingClientRect(),gap=8;
  const top=Math.max(...['.mebi-top-shell','.mebi-stepper'].map(selector=>document.querySelector(selector)?.getBoundingClientRect().bottom||0))+gap;
  const right=panel&&panel.width<innerWidth*.65?panel.left-gap:innerWidth-gap;
  return{element,box,left:gap,right:Math.max(gap,right-box.width),top,bottom:Math.max(top,innerHeight-box.height-gap)};
 }
 function positionWindow(state){
  const p=state?.particleInspection;if(!p)return;const l=settings(state),element=document.querySelector('.particle-lens-window');if(!element)return;
  if(!l.windowPosition){element.style.removeProperty('left');element.style.removeProperty('top');element.style.removeProperty('right');return;}
  const bounds=windowBounds();element.style.right='auto';element.style.left=(bounds.left+l.windowPosition.x*(bounds.right-bounds.left))+'px';element.style.top=(bounds.top+l.windowPosition.y*(bounds.bottom-bounds.top))+'px';
 }
 function wire(state){
  if(cleanup){cleanup();cleanup=null;}if(!state.particleInspection)return;
  const controller=new AbortController(),signal=controller.signal,l=settings(state),lab=document.querySelector('#labWorld canvas'),canvas=document.getElementById('particleLensCanvas'),viewport=document.getElementById('particleLensViewport');let drag=null,spin=null,windowDrag=null;
  const on=(element,event,handler,options={})=>element?.addEventListener(event,handler,{...options,signal});
  const range=document.getElementById('particleInspectionTime');on(range,'input',()=>window.TepkimeArenasi.dispatch('seekParticleInspection',Number(range.value)/100));
  on(document.getElementById('particleLensWater'),'change',event=>{l.water=event.target.checked;});
  for(const button of document.querySelectorAll('[data-lens-rotate]'))on(button,'click',()=>{l.yaw+=Number(button.dataset.lensRotate)*.25;});
  on(document.querySelector('[data-lens-clear]'),'click',()=>{l.selectedAtom=null;});
  function zoomBy(factor){l.zoom=Math.max(.6,Math.min(2.8,l.zoom*factor));paint(state);}
  for(const button of document.querySelectorAll('[data-lens-zoom]'))on(button,'click',()=>{if(button.dataset.lensZoom==='reset'){l.zoom=1;paint(state);}else zoomBy(button.dataset.lensZoom==='in'?1.2:1/1.2);});
  on(viewport,'wheel',event=>{event.preventDefault();event.stopPropagation();const pixels=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);zoomBy(Math.exp(-Math.max(-250,Math.min(250,pixels))*.002));},{passive:false});
  function setPosition(x,y){const b=windowBounds();if(!b)return;const clamp=(n,a,z)=>Math.max(a,Math.min(z,n));l.windowPosition={x:b.right===b.left?0:(clamp(x,b.left,b.right)-b.left)/(b.right-b.left),y:b.bottom===b.top?0:(clamp(y,b.top,b.bottom)-b.top)/(b.bottom-b.top)};positionWindow(state);}
  const rim=document.getElementById('particleLensRim');
  function beginWindowDrag(event){if(!event.isPrimary||![0,2].includes(event.button))return;spin=null;event.preventDefault();event.stopImmediatePropagation();const box=windowBounds().box;windowDrag={id:event.pointerId,x:event.clientX,y:event.clientY,left:box.left,top:box.top};rim.setPointerCapture(event.pointerId);rim.classList.add('is-dragging');}
  on(viewport,'pointerdown',event=>{const b=viewport.getBoundingClientRect(),radius=b.width/2;if(event.button===2||Math.hypot(event.clientX-b.left-radius,event.clientY-b.top-b.height/2)>radius-22)beginWindowDrag(event);},{capture:true});
  on(rim,'pointerdown',beginWindowDrag);
  on(viewport,'contextmenu',event=>event.preventDefault());
  on(rim,'pointermove',event=>{if(windowDrag?.id!==event.pointerId)return;event.preventDefault();setPosition(windowDrag.left+event.clientX-windowDrag.x,windowDrag.top+event.clientY-windowDrag.y);});
  const endWindowDrag=()=>{windowDrag=null;rim?.classList.remove('is-dragging');};
  for(const event of ['pointerup','pointercancel','lostpointercapture'])on(rim,event,endWindowDrag);
  on(rim,'keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;event.preventDefault();if(event.key==='Home'){l.windowPosition=null;positionWindow(state);return;}const b=windowBounds().box,d=event.shiftKey?40:12;setPosition(b.left+(event.key==='ArrowRight'?d:event.key==='ArrowLeft'?-d:0),b.top+(event.key==='ArrowDown'?d:event.key==='ArrowUp'?-d:0));});
  on(window,'resize',()=>positionWindow(state));positionWindow(state);
  function start(event,index,element){event.preventDefault();event.stopImmediatePropagation();drag={id:event.pointerId,index,element};element.setPointerCapture(event.pointerId);window.LabScene.moveParticleLens(event.clientX,event.clientY,index);document.getElementById('particleLensTargets')?.classList.add('is-dragging');}
  function move(event){if(!drag||drag.id!==event.pointerId)return;event.preventDefault();event.stopImmediatePropagation();window.LabScene.moveParticleLens(event.clientX,event.clientY,drag.index);}
  function end(event){if(!drag||drag.id!==event.pointerId)return;event.preventDefault();drag=null;document.getElementById('particleLensTargets')?.classList.remove('is-dragging');}
  for(const marker of document.querySelectorAll('[data-lens-target]')){
   on(marker,'pointerdown',event=>{if(event.isPrimary&&event.button===0)start(event,Number(marker.dataset.lensTarget),marker);});on(marker,'pointermove',move);on(marker,'pointerup',end);on(marker,'pointercancel',end);on(marker,'lostpointercapture',end);
   on(marker,'keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;event.preventDefault();const d=event.shiftKey ? .12 : .04;l.focus=event.key==='Home'?{x:.5,y:.5}:{x:Math.max(0,Math.min(1,l.focus.x+(event.key==='ArrowRight'?d:event.key==='ArrowLeft'?-d:0))),y:Math.max(0,Math.min(1,l.focus.y+(event.key==='ArrowUp'?d:event.key==='ArrowDown'?-d:0)))};});
  }
  on(lab,'pointerdown',event=>{if(!event.isPrimary||event.button!==0)return;const hit=window.LabScene.pickParticleLens(event.clientX,event.clientY);if(hit)start(event,hit.vessel,lab);},{capture:true});on(lab,'pointermove',move,{capture:true});on(lab,'pointerup',end,{capture:true});on(lab,'pointercancel',end,{capture:true});on(lab,'lostpointercapture',end);
  on(canvas,'pointerdown',event=>{if(!event.isPrimary||event.button!==0)return;event.preventDefault();spin={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false};canvas.setPointerCapture(event.pointerId);});
  on(canvas,'pointermove',event=>{if(!spin||spin.id!==event.pointerId)return;spin.moved=spin.moved||Math.hypot(event.clientX-spin.startX,event.clientY-spin.startY)>5;l.yaw+=(event.clientX-spin.x)*.012;l.pitch=Math.max(-1,Math.min(1,l.pitch+(event.clientY-spin.y)*.008));spin.x=event.clientX;spin.y=event.clientY;});
  on(canvas,'pointerup',event=>{if(spin?.id!==event.pointerId)return;if(!spin.moved)window.LabScene.selectParticleLens(event.clientX,event.clientY);spin=null;});on(canvas,'pointercancel',()=>{spin=null;});
  on(window,'blur',()=>{windowDrag=null;rim?.classList.remove('is-dragging');drag=spin=null;document.getElementById('particleLensTargets')?.classList.remove('is-dragging');});cleanup=()=>{controller.abort();windowDrag=drag=spin=null;};paint(state);
 }
 window.MebiParticleInspection={eligible,buttons,panelHTML,paint,wire,stage,settings,positionWindow,esc};
})(window);
