const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({console});c.window=c;
for(const file of ['data.js','experiment.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',file),'utf8'),c);
let pairs=0;
for(const a of c.MebiData.REAGENTS)for(const b of c.MebiData.REAGENTS){
 if(a===b)continue;
 const rx=c.MebiData.getReaction(a.id,b.id),state={screen:'lab',labStep:'observed',selectedSlot1:a.id,selectedSlot2:b.id,activeReaction:rx,currentTemp:rx.tempFinal,poured:true,predictionRecord:{id:'original-prediction'},observation:{record:{temperature:{initial:rx.tempInit,final:rx.tempFinal},note:'Original observation'}},explanationReview:{elapsed:0}};
 c.MebiExperiment.reset(state);state.experiment.transfer=1;state.experiment.completionNotified=true;
 const original=JSON.stringify([state.experiment,state.observation,state.predictionRecord,state.currentTemp,state.labStep]);let previous=0,transfer=0;
 for(const time of [0,1,2.5,4,5,8,9]){
  const display=c.MebiExperiment.replayState(state,time-previous);previous=time;
  assert(display.experiment.transfer>=transfer);transfer=display.experiment.transfer;
  if(time===0){assert.equal(transfer,0);assert.equal(display.currentTemp,rx.tempInit);}
  if(time===2.5)assert.equal(display.experiment.mode,'explanation-replay');
  if(time===2.5 && b.solid){assert.equal(display.currentTemp,rx.tempInit);assert.equal(display.explanationReplayProgress,0,'No reaction before solid reaches the mixture');}
  if(time>=5){assert.equal(transfer,1);assert.equal(display.experiment.mode,'idle');}
  if(time===9){assert.equal(display.currentTemp,rx.tempFinal);assert.equal(display.labStep,'observed');}
  assert.equal(JSON.stringify([state.experiment,state.observation,state.predictionRecord,state.currentTemp,state.labStep]),original,'Replay must never mutate the actual attempt');
 }
 state.explanationReview={elapsed:0};assert.equal(c.MebiExperiment.replayState(state,0).experiment.transfer,0,'A new replay starts from the beginning');pairs++;
}
console.log(JSON.stringify({passed:true,pairs,checks:['automatic initial/transfer/reaction/end timeline','monotonic transfer for liquids and solids','same scenario temperature endpoints','immutable experiment, prediction and observation','replay restarts from zero']}));
