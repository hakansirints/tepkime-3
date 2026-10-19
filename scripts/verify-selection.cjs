const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
let now = 0;
let timers = [];
let frameCallback;
let renderedScene;
let renderedCamera;
let sceneControls;
const storage = new Map();
const appElement = { innerHTML: '', dataset: {}, querySelector: () => null, insertAdjacentHTML(position,html){this.innerHTML+=html;} };
function element() {
  return { style: {}, dataset: {}, classList: {add(){},remove(){},toggle(){},contains(){return false}},
    addEventListener(){},removeEventListener(){},appendChild(){},replaceChildren(){},querySelector(){return null}, querySelectorAll(){return []},
    setAttribute(){},getAttribute(){return null},getBoundingClientRect(){return {top:160,left:0,width:360,height:190}},
    getContext(){return new Proxy({}, {get:(o,k)=> k in o ? o[k] : (()=>{}),set:(o,k,v)=>(o[k]=v,true)})}};
}
const host = element();
const document = { hidden:false, documentElement:{dataset:{theme:'light'},getAttribute(){return 'light'}},
  body:element(), getElementById(id){return id==='app'?appElement:id==='labWorld'?host:null},
  querySelector(selector){return selector === '.bench-stage' ? host : null}, querySelectorAll(){return []}, createElement:element, addEventListener(){} };
const context = vm.createContext({ console, document, innerWidth:1440, innerHeight:900,
  devicePixelRatio:1, performance:{now:()=>now},
  localStorage:{getItem(key){return storage.get(key)||null},setItem(key,value){storage.set(key,String(value))}},
  confirm(){return true},
  matchMedia:()=>({matches:false}), addEventListener(){}, scrollTo(){},
  setTimeout(fn,ms){timers.push({fn,at:now+ms});return timers.length},
  setInterval(fn,ms){const timer={fn,at:now+ms,interval:ms};timers.push(timer);return timer},
  clearInterval(timer){timer.cancelled=true},
  requestAnimationFrame(fn){frameCallback=fn;return 1}, cancelAnimationFrame(){},
  MutationObserver:class{observe(){}},
  ResizeObserver:class{constructor(fn){this.fn=fn}observe(){this.fn()}disconnect(){}},
});
context.window=context;
const load = name => vm.runInContext(fs.readFileSync(path.join(root,'js',name),'utf8'),context,{filename:name});
function advance(ms) {
  const target=now+ms;
  for (;;) {
    timers.sort((a,b)=>a.at-b.at);
    const timer=timers.find(t=>!t.cancelled && t.at<=target);
    if(!timer)break;
    timers.splice(timers.indexOf(timer),1); now=timer.at; timer.fn();
    if(timer.interval && !timer.cancelled){timer.at=now+timer.interval;timers.push(timer)}
  }
  now=target;
  if(frameCallback)frameCallback();
}
load('data.js'); load('chemistry-visuals.js'); load('svg-models.js'); load('prediction.js'); load('experiment.js'); load('observation.js'); load('explanation.js');
context.LabScene={available:true,sync(){},setTemperature(){}};
load('app.js');
const app=context.TepkimeArenasi,data=context.MebiData;
const prediction=context.MebiPrediction;
function fillPrediction(choices) {
  prediction.items.forEach(item=>{app.dispatch('setPredictionChoice',item.key+':'+(choices ? choices[item.key] : 'unsure'));prediction.setReason(app.state,item.key,'Bu belirtiyi önceki bilgilerime göre değerlendiriyorum.');});
  app.render(false);
}
const progressLabels=['1. Seç','2. Tahmin','3. Deney','4. Açıkla'];
function assertProgress(index) {
  assert.deepEqual(Array.from(appElement.innerHTML.matchAll(/class="mebi-step-label">([^<]+)</g),m=>m[1]),progressLabels);
  const items=Array.from(appElement.innerHTML.matchAll(/class="mebi-step-item ([^"]*)"([^>]*)>/g));
  assert.equal(items.length,4);
  items.forEach((item,i)=>{
    assert.equal(item[1],i<index?'is-done':i===index?'is-active':'');
    assert.equal(item[2].includes('aria-current="step"'),i===index);
  });
  assert(appElement.innerHTML.includes('class="mebi-step-line-fill" style="width:'+(index/3*100)+'%;"'));
}
assert.equal(app.state.screen,'menu','Existing opening menu is preserved');
app.dispatch('goPool');
assertProgress(0);
app.dispatch('goCollection');assertProgress(0);app.dispatch('resumeExperiment');assertProgress(0);
const galleryCount=()=> (appElement.innerHTML.match(/class="reagent-gallery-card/g)||[]).length;
const continuationDisabled=()=> /class="gallery-continue"[^>]*disabled/.test(appElement.innerHTML);
assert.equal(galleryCount(),12);
assert(continuationDisabled());
assert(!appElement.innerHTML.includes('class="lab-reagent-panel'));
assert(!appElement.innerHTML.includes('Maddelerin Gerçek Görünümü'));
assert(!appElement.innerHTML.includes('Sulu çözeltilerin çoğu renksizdir'));
assert(appElement.innerHTML.includes('id="reagentGalleryTitle"'));
assert.equal((appElement.innerHTML.match(/src="image\/reagents\/powder\.webp/g)||[]).length,3);
assert.equal((appElement.innerHTML.match(/src="image\/reagents\/blue\.webp/g)||[]).length,1);
assert.equal((appElement.innerHTML.match(/src="image\/reagents\/clear\.webp/g)||[]).length,8);
app.dispatch('startExperiment');assert.equal(app.state.screen,'pool');
app.dispatch('clickReagent','NaHCO3');advance(810);
assert.equal(app.state.selectedSlot1,'NaHCO3');assert(continuationDisabled());
app.dispatch('clickReagent','HCl');
app.dispatch('startExperiment');assert.equal(app.state.screen,'pool','Continue waits for fill completion');
advance(810);
assert.equal(app.state.screen,'pool','Two selections do not auto-advance');
assertProgress(0);
assert.equal(galleryCount(),12,'All cards stay visible until explicit continuation');
assert.equal(app.state.reagentPanelCollapsed,false);
assert(!continuationDisabled());
assert(appElement.innerHTML.includes('✓ 1. beher')&&appElement.innerHTML.includes('✓ 2. beher'));
app.dispatch('clickReagent','HCl');advance(810);assert.equal(app.state.selectedSlot2,null);assert(continuationDisabled());
app.dispatch('clickReagent','KI');advance(810);assert.equal(app.state.selectedSlot2,'KI');
app.dispatch('clickReagent','H2O2');advance(810);assert.equal(app.state.selectedSlot2,'H2O2','Third distinct card replaces slot 2');
app.dispatch('resetPool');advance(810);assert.equal(app.state.selectedSlot1,null);assert.equal(app.state.selectedSlot2,null);
app.dispatch('setFilter','acid');assert.equal(galleryCount(),2);
app.dispatch('setFilter','all');app.state.searchQuery='bakır';app.render(false);assert.equal(galleryCount(),1);
app.state.searchQuery='H2O2';app.render(false);assert.equal(galleryCount(),1);assert(appElement.innerHTML.includes('Hidrojen Peroksit'));
app.state.searchQuery='eşleşmeyen-madde';app.render(false);assert.equal(galleryCount(),0);assert(appElement.innerHTML.includes('Bu aramada madde bulunamadı.'));
app.state.searchQuery='';app.render(false);assert.equal(galleryCount(),12);
for(let trial=0;trial<60;trial++){
  app.dispatch('setFilter','acid');app.state.searchQuery='eşleşmeyen-madde';
  app.dispatch('randomReactivePairForTesting');
  assert.notEqual(app.state.selectedSlot1,app.state.selectedSlot2);
  assert.notEqual(data.getReaction(app.state.selectedSlot1,app.state.selectedSlot2).typeCategory,'none');
  assert.equal(galleryCount(),12);assert.equal(app.state.searchQuery,'');assert.equal(app.state.categoryFilter,'all');
  assert.equal(app.state.screen,'pool');assert(continuationDisabled());advance(810);assert(!continuationDisabled());
}
app.dispatch('resetPool');advance(810);
app.dispatch('clickReagent','HCl');app.dispatch('setFilter','base');app.dispatch('clickReagent','NaOH');advance(810);app.dispatch('startExperiment');
assert.equal((appElement.innerHTML.match(/class="prediction-material"/g)||[]).length,2,'Both selected materials are present in the main prediction card');
app.dispatch('changeReactants');assert.equal(galleryCount(),12);assert.equal(app.state.categoryFilter,'all');assert.equal(app.state.searchQuery,'');
let pairs=0;
for(let i=0;i<data.REAGENTS.length;i++)for(let j=i+1;j<data.REAGENTS.length;j++){
  for(const [a,b] of [[data.REAGENTS[i],data.REAGENTS[j]],[data.REAGENTS[j],data.REAGENTS[i]]]){
    app.dispatch('goPool');app.dispatch('clickReagent',a.id);app.dispatch('clickReagent',b.id);advance(810);
    assert.equal(app.state.screen,'pool');app.dispatch('startExperiment');
    assert.equal(app.state.screen,'lab');assert.equal(app.state.labStep,'predict');
    assertProgress(1);
    assert.equal(app.state.selectedSlot1,a.id);assert.equal(app.state.selectedSlot2,b.id);
    assert.equal(app.state.activeReaction.canonical,data.getReaction(a.id,b.id).canonical);
    assert.equal(app.state.reagentPanelCollapsed,true);
    assert.equal((appElement.innerHTML.match(/class="prediction-material"/g)||[]).length,2);
    assert(!appElement.innerHTML.includes('class="bench-dock'));
    assert.equal(prediction.complete(app.state),0);
    app.dispatch('savePrediction');assert.equal(app.state.labStep,'predict','Unanswered predictions cannot be saved');
    app.dispatch('beginExperiment');assert.equal(app.state.labStep,'predict');
    const actual=prediction.outcomes(app.state.activeReaction);
    fillPrediction(Object.fromEntries(prediction.items.map(item=>[item.key,actual[item.key]?'yes':'no'])));
    app.dispatch('clickReagent','invalid');assert.equal(app.state.selectedSlot2,b.id);
    app.dispatch('savePrediction');assertProgress(1);assert.equal(app.state.labStep,'predictionSaved');
    assert.equal(app.state.poured,false);assert(prediction.matches(app.state));
    const recordId=app.state.predictionRecord.id;
    app.dispatch('redoPrediction');assertProgress(1);app.dispatch('savePrediction');assert.equal(app.state.predictionRecord.id,recordId);
    app.dispatch('beginExperiment');assertProgress(2);
    const snapshot=JSON.stringify(app.state.predictionRecord);
    app.dispatch('redoPrediction');assert.equal(app.state.labStep,'ready','Original prediction is locked once the experiment starts');
    app.dispatch('setPredictionChoice','gas:no');assert.equal(JSON.stringify(app.state.predictionRecord),snapshot);
    assert(!appElement.innerHTML.includes('class="lab-reagent-panel'));
    assert(!appElement.innerHTML.includes('class="lab-live-card"'));assert(appElement.innerHTML.includes('class="experiment-live-data"'));assert(!appElement.innerHTML.includes('class="dock-obs-grid"'));
    app.dispatch('triggerPour');assert.equal(app.state.labStep,'ready');assert.equal(app.state.experiment.safetyOpen,true);
    assert(appElement.innerHTML.includes('Deneyden Önce Güvenlik') || app.state.experiment.safetyOpen);
    app.dispatch('toggleAllSafetyChecks');app.dispatch('acceptExperimentSafety');assert.equal(app.state.labStep,'pouring');assertProgress(2);advance(5100);assertProgress(2);advance(4400);
    assert.equal(app.state.labStep,'observed');assert.equal(app.state.currentTemp,app.state.activeReaction.tempFinal);
    assertProgress(2);
    assert.equal(JSON.stringify(app.state.predictionRecord),snapshot);
    assert(appElement.innerHTML.includes('Gözlemini Kaydet'));
    assert(!appElement.innerHTML.includes('observation-comparison-head'));
    app.dispatch('toCard');assertProgress(2);
    prediction.items.forEach(item=>app.dispatch('setObservationChoice',item.key+':unsure'));
    context.MebiObservation.setNote(app.state,'Bu denemede gözlediğim bulguları kaydettim.');
    app.dispatch('saveObservation');assertProgress(2);
    assert(appElement.innerHTML.includes('Gözlemin kaydedildi.'));app.dispatch('setObservationTab','compare');assert(appElement.innerHTML.includes('Tahminim ve Gözlemim'));assert(appElement.innerHTML.includes('data-action="toCard"'));
    app.dispatch('toCard');assertProgress(3);
    pairs++;
  }
}
app.dispatch('changeReactants');assert.equal(app.state.screen,'pool');assert.equal(galleryCount(),12);
assertProgress(0);
const crypto=require('node:crypto');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'image/reagents/manifest.json'),'utf8'));
assert.equal(manifest.solutionMl,context.MebiExperiment.defaults.solutionMl,'Gallery and experiment use the same starting solution volume');
assert.equal(manifest.modelSha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'js/beaker-model.js'),'utf8').replace(/\r\n/g,'\n')).digest('hex'),'Preview images correspond to the shared laboratory model');
for(const asset of manifest.assets)assert.equal(fs.statSync(path.join(root,'image/reagents',asset.file)).size,asset.bytes);
assert.equal(JSON.parse(storage.get('tepkime_arenasi_predictions_v1')).filter(record=>record.startedAt).length,132);
console.log(JSON.stringify({passed:true,pairs,checks:'Opening preserved; 12 cards in 3 appearance groups; selection/deselection/reset/search/filter; explicit continuation; five decisions and reasons; saved summary stays in step 2; explicit step 3; locked local records; all 66 pairs in both orders through prediction/pour/result/explanation; shared model asset hash'},null,2));
