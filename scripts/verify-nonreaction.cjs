const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
async function main(){
  const api=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'js/particle-models.js'),'utf8')).toString('base64'));
  const storage=new Map();
  const c={console,document:{getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return[];},createElement(){return{innerHTML:'',textContent:''};}},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout,clearTimeout};
  c.window=c;vm.createContext(c);
  const load=name=>vm.runInContext(fs.readFileSync(path.join(root,'js',name),'utf8'),c,{filename:name});
  load('data.js');load('experiment.js');load('prediction.js');load('svg-models.js');
  c.MebiExplanation={get:s=>s.explanation,eligible:()=>true};
  c.MebiObservation={pairHTML:()=>'<span>Selected pair</span>'};
  c.MebiExplanationModel={...api,thumbnail:()=>'',build(s){const model=api.buildModel(s.selectedSlot1,s.selectedSlot2,[s.selectedSlot1,s.selectedSlot2].map(id=>c.MebiExperiment.initialAmount(id)));const consume=model.recipe?.consume||{};return{model,species:api.unique([...model.dissolved.filter(p=>!p.solvent||consume[p.kind]),...model.products]).map(p=>({kind:p.kind,label:api.symbol(p.kind),phase:p.phase,role:consume[p.kind]?'reactant':model.products.some(t=>t.kind===p.kind)?p.phase==='solid'?'solid':p.phase==='gas'?'gas':p.kind==='H2O'?'water':'other':model.recipe?.catalyst===p.kind?'catalyst':api.CHARGES[p.kind]&&p.phase==='aqueous'?'spectator':'unchanged'}))};}};
  load('model.js');load('nonreaction.js');
  const currentModel=c.MebiModel;
  let baselineModel,baselineExplanation,currentExplanation;
  if(process.argv[2]){
    vm.runInContext(fs.readFileSync(path.join(process.argv[2],'js/model.js'),'utf8'),c);baselineModel=c.MebiModel;c.MebiModel=currentModel;
    const explanationStub=c.MebiExplanation;
    load('explanation.js');currentExplanation=c.MebiExplanation;
    vm.runInContext(fs.readFileSync(path.join(process.argv[2],'js/explanation.js'),'utf8'),c);baselineExplanation=c.MebiExplanation;c.MebiExplanation=explanationStub;
  }
  const nr=c.MebiNonReaction;
  let serial=0,reactive=0,none=0,ionic=0,dissolution=0,dry=0;
  function state(a,b,id){return {screen:'model',selectedSlot1:a,selectedSlot2:b,activeReaction:c.MebiData.getReaction(a,b),observation:{record:{id:id||'nr-'+(++serial),answers:Object.fromEntries(c.MebiPrediction.items.map(i=>[i.key,'no'])),prediction:{answers:Object.fromEntries(c.MebiPrediction.items.map(i=>[i.key,{choice:'no',reason:'Test rationale'}]))},temperature:{initial:22,final:22},note:''}},explanation:{legacyAssignments:{},revisions:[{}]}};}
  function fill(s){const x=nr.scenario(s);x.after.forEach(t=>{const key=t.kind+':'+t.phase;assert(nr.action(s,'add',key));assert(nr.action(s,'count',key+'|'+t.count));});assert(nr.action(s,'decision','no'));assert(nr.action(s,'interpret',nr.validate(s).expectedInterpretation));nr.action(s,'reason','Gözlemimdeki karışmayı başlangıç ve son durumdaki türlerle ilişkilendirdim.');}
  const ids=c.MebiData.REAGENTS.map(r=>r.id);
  for(const a of ids)for(const b of ids){if(a===b)continue;const s=state(a,b),x=nr.scenario(s);
    if(s.activeReaction.typeCategory!=='none'){
      reactive++;assert.equal(x,null,a+' + '+b+' must retain reactive flow');
      assert(!c.MebiModel.render(s).includes('data-nr-root'));
      if(baselineModel)assert.equal(c.MebiModel.render(s),baselineModel.render(s),'Reactive markup drift: '+a+' + '+b);
      if(baselineExplanation)assert.equal(currentExplanation.render(s),baselineExplanation.render(s),'Reactive explanation drift: '+a+' + '+b);
      continue;
    }
    none++;assert(x);assert.equal(x.model.recipe,null);assert.equal(x.model.products.length,0);
    if(x.ionic)ionic++;if(x.mode==='dissolution')dissolution++;if(x.mode==='dry')dry++;
    assert(!nr.check(s),'Empty inventory cannot pass');
    assert.equal(nr.action(s,'cancelView'),false,'Cancellation requires completed inventory');
    assert.equal(nr.action(s,'add','fake:aqueous'),false);
    fill(s);
    let v=nr.validate(s);assert(v.inventory&&v.atoms&&v.charge&&v.valid,a+' + '+b);
    const html=c.MebiModel.render(s);assert(html.includes('data-nr-root'));assert(!html.includes('Denklemimi Kur'));assert(!html.includes('Ürün ekle'));
    assert(html.includes('class="nr-remove"'));assert(!html.includes('>Sil</button>'));
    assert(!html.includes('gerçek tanecik sayısı değildir'));assert(!html.includes('Korunum sağlanması tek başına'));assert(!html.includes('Önceki açıklamamı gör'));
    if(x.mode==='dry'){assert(!x.wet);assert(x.after.every(t=>t.phase==='solid'));assert(html.includes('Yok · kuru karışım'));}
    if(x.mode==='dissolution')assert(x.model.dissolved.some(t=>t.dissolving));
    assert(nr.check(s));assert(nr.save(s));assert.equal(c.MebiModel.checkEquation(s),false);assert.equal(c.MebiModel.saveEquation(s),false);
    const restored=state(a,b,s.observation.record.id);assert(nr.get(restored).saved);assert(nr.validate(restored).valid);
    const first=x.after[0];nr.action(restored,'count',first.kind+':'+first.phase+'|'+(first.count+1));assert(!nr.validate(restored).valid);assert(!nr.get(restored).saved);
    if(x.ionic){
      assert(nr.action(s,'cancelView'));assert(!nr.check(s),'Unmatched pairs must not save in cancellation view');
      x.before.forEach(t=>assert(nr.action(s,'pair',t.kind+':'+t.phase)));
      assert(nr.check(s));assert(nr.save(s));assert(nr.renderModel(s).includes('Bu koşullarda net iyon denklemi yazılmaz.'));
      assert(!nr.renderModel(s).includes('id="nrReason"'),'Cancellation has no second rationale field');
      const originalReason=nr.get(s).reason;nr.action(s,'reason','');assert(nr.check(s),'Cancellation must not require a hidden rationale field');nr.action(s,'reason',originalReason);
      nr.action(s,'pair',x.before[0].kind+':'+x.before[0].phase);assert(!nr.check(s));
      nr.action(s,'compareView');assert(nr.check(s),'Advanced cancellation remains optional');
    }else assert.equal(nr.action(s,'cancelView'),false);
  }
  assert.equal(reactive,72);assert.equal(none,60);assert(ionic>0&&dissolution>0&&dry===6);
  assert.equal(nr.scenario(state('AgNO3','NH3')),null,'A reaction with obs:none must not enter nonreaction flow');
  const molecular=state('H2O2','NH3');assert(!nr.scenario(molecular).ionic);
  // Equal atoms and charge are insufficient if species or phases do not match.
  const wrongPhase=state('KI','CaCl2');fill(wrongPhase);nr.get(wrongPhase).terms[0].phase='solid';
  assert(nr.validate(wrongPhase).atoms&&nr.validate(wrongPhase).charge);assert(!nr.validate(wrongPhase).valid);
  const badDecision=state('KI','CaCl2');fill(badDecision);nr.action(badDecision,'decision','yes');assert(!nr.check(badDecision));
  nr.action(badDecision,'decision','no');nr.action(badDecision,'reason','');assert(!nr.check(badDecision));
  fill(badDecision);const oldSet=c.localStorage.setItem;c.localStorage.setItem=()=>{throw Error('quota');};assert.equal(nr.save(badDecision),false);assert(nr.get(badDecision).storageError);c.localStorage.setItem=oldSet;
  // Attempt and pair isolation: a completed result must never populate another experiment.
  assert.equal(nr.get(state('KI','CaCl2')).terms.length,0);
  const isolated=state('KI','CaCl2');fill(isolated);nr.persist(isolated);isolated.selectedSlot1='Na2CO3';assert.equal(nr.get(isolated).terms.length,0);
  // A number change must not rebuild/refocus the input while the learner tabs out.
  const keyboard=state('KI','CaCl2');fill(keyboard);const target=nr.scenario(keyboard).after[0],listeners={};
  const input={value:'3',dataset:{nrCount:target.kind+':'+target.phase},addEventListener:(name,fn)=>listeners[name]=fn};
  const host={querySelectorAll:selector=>selector==='[data-nr-count]'?[input]:[],querySelector:()=>null};
  c.document.querySelector=selector=>selector==='[data-nr-root]'?host:null;
  c.TepkimeArenasi={render(){throw Error('Number editing rebuilt the focused input');}};
  nr.wire(keyboard);listeners.input();listeners.change();
  assert.equal(nr.get(keyboard).terms.find(t=>t.kind===target.kind).count,3);
  console.log(JSON.stringify({passed:true,orderedPairs:132,reactiveUnchanged:reactive,baselineMarkupCompared:!!baselineModel,nonreaction:none,ionic,dissolution,dry,
    checks:['explicit scenario routing','no obs:none shortcut','phase and species-aware inventory','atom and charge conservation','optional cancellation','dry/soluble/molecular cases','no fake products or net equations','save/reload isolation','quota failure handling','numeric edits keep the input mounted for Tab navigation']}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
