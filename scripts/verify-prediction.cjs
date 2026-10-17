/* Decision/justification contracts, original-record protection and local persistence. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),storage=new Map();
function setup(blockStorage=false){
 const c={console,document:{getElementById(){return null},querySelectorAll(){return[]}},localStorage:{getItem(key){if(blockStorage)throw Error('blocked');return storage.get(key)||null},setItem(key,value){if(blockStorage)throw Error('blocked');storage.set(key,String(value))}}};c.window=c;
 vm.createContext(c);for(const file of ['data.js','prediction.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),c,{filename:file});c.MebiSVG={icon(){return ''}};
 const state={screen:'lab',labStep:'predict',selectedSlot1:'NaHCO3',selectedSlot2:'HCl',activeReaction:c.MebiData.getReaction('NaHCO3','HCl')};c.MebiPrediction.reset(state);
 return{p:c.MebiPrediction,state,c};
}
const {p,state}=setup();
assert.equal(p.complete(state),0);assert.equal(p.save(state),false);assert.equal(p.begin(state),false);
assert.equal(p.setChoice(state,'invalid:yes'),false);assert.equal(p.setChoice(state,'gas:invalid'),false);
p.setChoice(state,'gas:yes');p.setReason(state,'gas','Ön bilgime göre gaz bekliyorum.');
p.toggleNone(state);assert(p.items.every(item=>state.predictionAnswers[item.key].choice==='no'));
assert.equal(state.predictionAnswers.gas.reason,'Ön bilgime göre gaz bekliyorum.');
p.toggleNone(state);assert.equal(state.predictionAnswers.gas.choice,'yes');assert.equal(state.predictionAnswers.color.choice,null);
for(const item of p.items){p.setChoice(state,item.key+':unsure');p.setReason(state,item.key,'Bu konuda hangi bilginin gerekli olduğundan emin değilim.');}
p.setReason(state,'gas',' '.repeat(20));assert.equal(p.complete(state),4);assert.equal(p.save(state),false);
p.setReason(state,'gas','<img src=x onerror=alert(1)> & gerekçem');
p.setChoice(state,'tempRise:yes');p.setChoice(state,'tempFall:yes');assert.equal(p.save(state),false);assert(state.predictionMessage.includes('hem yüksek'));
p.setChoice(state,'tempRise:unsure');p.setChoice(state,'tempFall:unsure');
assert.equal(p.complete(state),5);assert.equal(p.save(state),true);assert.equal(state.labStep,'predictionSaved');assert.equal(state.predictionRecord.startedAt,null);
assert.equal(p.matches(state),false,'Uncertainty is preserved and not graded as an incorrect Yes/No');
const id=state.predictionRecord.id,created=state.predictionRecord.createdAt;
assert(p.render(state).includes('&lt;img'));assert(!p.render(state).includes('<img src=x'));
assert.equal(p.edit(state),true);p.setReason(state,'gas','x'.repeat(300));assert.equal(state.predictionAnswers.gas.reason.length,240);assert.equal(p.save(state),true);
assert.equal(state.predictionRecord.id,id);assert.equal(state.predictionRecord.createdAt,created);assert.equal(JSON.parse([...storage.values()][0]).length,1,'Editing before the experiment updates the same record');
const savedReference=state.predictionRecord;
assert.equal(p.begin(state),true);assert.equal(state.labStep,'ready');assert(state.predictionRecord.startedAt);
const snapshot=JSON.stringify(state.predictionRecord);
assert.equal(p.edit(state),false);assert.equal(p.setReason(state,'gas','Changed after experiment'),false);assert.equal(p.setChoice(state,'gas:no'),false);assert.equal(p.toggleNone(state),false);assert.equal(p.save(state),false);assert.equal(p.begin(state),false);
savedReference.answers.gas.reason='Mutated old reference';assert.equal(JSON.stringify(state.predictionRecord),snapshot);
state.predictionAnswers.gas.reason='Changed mutable draft';assert.equal(JSON.stringify(state.predictionRecord),snapshot);
assert.equal(JSON.stringify(JSON.parse([...storage.values()][0])[0]),snapshot);
// A restored pre-start state cannot edit a record which has already started.
const stale={...state,labStep:'predict',predictionRecord:{...state.predictionRecord,startedAt:null}};assert.equal(p.setChoice(stale,'gas:no'),false);
const storedBeforeReload=storage.get('tepkime_arenasi_predictions_v1');
const reloaded=setup();assert(!reloaded.p.render(reloaded.state).includes('Bu tarayıcıdaki tahmin kayıtları'));
assert.equal(storage.get('tepkime_arenasi_predictions_v1'),storedBeforeReload,'Hiding history preserves saved predictions');
assert.equal(p.outcomes({obs:[],tempInit:22,tempFinal:21.5}).tempFall,true);
assert.equal(p.outcomes({obs:[],tempInit:22,tempFinal:22.5}).tempRise,true,'Numerical thermometer changes remain visible even without the legacy temp flag');
assert.equal(p.outcomes({obs:['none'],tempInit:22,tempFinal:22}).tempRise,false);
for(const item of p.items)state.predictionRecord.answers[item.key].choice='no';state.predictionRecord.answers.gas.choice='no';
assert(p.feedbackHTML(state).includes('Farklı'));assert(!p.feedbackHTML(state).includes('Yanlış gerekçe'));
const blocked=setup(true);for(const item of blocked.p.items){blocked.p.setChoice(blocked.state,item.key+':unsure');blocked.p.setReason(blocked.state,item.key,'Bu bilgiye henüz sahip değilim.');}
assert.equal(blocked.p.save(blocked.state),true);assert.equal(blocked.state.predictionStorageError,true);assert(blocked.p.render(blocked.state).includes('kalıcı kayıt yapılamadı'));assert.equal(blocked.p.begin(blocked.state),true);assert.equal(blocked.p.edit(blocked.state),false);
// Automatic answers must match every supported pair, in either selection order.
const automatic=setup(),reagents=automatic.c.MebiData.REAGENTS;
let pairs=0;
for(const a of reagents)for(const b of reagents){
 if(a.id===b.id)continue;
 const s={screen:'lab',labStep:'predict',selectedSlot1:a.id,selectedSlot2:b.id,activeReaction:automatic.c.MebiData.getReaction(a.id,b.id)};
 automatic.p.reset(s);assert(automatic.p.autoFillForTesting(s));
 const actual=automatic.p.outcomes(s.activeReaction);
 for(const item of automatic.p.items){const answer=s.predictionAnswers[item.key];assert.equal(answer.choice,actual[item.key]?'yes':'no');assert(answer.reason.trim());assert(answer.reason.length<=240);assert(!/test|tes amaçlı/i.test(answer.reason));}
 assert.equal(automatic.p.complete(s),5);assert.equal(s.predictionRecord,null);
 assert.match(automatic.p.render(s),/id="beginExperimentButton"[^>]* disabled/);
 assert(automatic.p.save(s));assert(automatic.p.matches(s));
 const html=automatic.p.render(s);assert.equal((html.match(/class="prediction-row"/g)||[]).length,5);assert(!html.includes('Tahmin kaydın hazır'));
 assert(html.includes('Tahmininiz kaydedildi'));assert(!/id="beginExperimentButton"[^>]* disabled/.test(html));
 automatic.p.setReason(s,'gas',s.predictionAnswers.gas.reason+' ');assert.equal(s.labStep,'predict');assert(!automatic.p.begin(s));
 assert(automatic.p.save(s));automatic.p.setChoice(s,'gas:'+(actual.gas?'no':'yes'));assert.equal(s.labStep,'predict');assert(!automatic.p.begin(s));
 pairs++;
}
console.log(JSON.stringify({passed:true,pairs,checks:'Five decisions and reasons; all pairs automatically match outcomes without test text; inline save confirmation and unchanged form; edits invalidate experiment continuation; save/edit/start and original record protection; local persistence and unavailable storage'},null,2));
