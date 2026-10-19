import {buildModel,template} from './particle-models.js?v=1.1';
import {createParticleLens} from './particle-lens.js?v=1.3';

/* Shared 3D atom coordinates for the lens; laboratory vessels stay macroscopic. */
export function createBeakerParticles({THREE,scene,renderer,camera,main,secondary,secondaryHome,setTemperature}){
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v)},mix=(a,b,u)=>a+(b-a)*u;
 let model=null,enabled=false,pairKey='',command=-1,time=0,motion=0,last=performance.now(),lastDraw=-1,stamp='',view='before',graph=null,lastTemperature=null;
 const w=new THREE.Vector3(),rot=new THREE.Quaternion(),euler=new THREE.Euler();
 let positions=[],summary=null,atomScales=[],hiddenAtoms=new Set();
 const lens=createParticleLens({THREE,camera,main,secondary});
 let lensGroups=[],atomOrigins=[];
 function active(state){return !!(state?.particleInspection&&state.screen==='lab'&&!state.stageReview&&state.labStep==='observed'&&window.MebiParticleInspection.eligible(state))}
 function project(p){const a=p.clone().project(camera);return{x:(a.x+1)*innerWidth/2,y:(1-a.y)*innerHeight/2}}
 function depth(ml){return ml*Math.pow(main.height/6.68,3)/(Math.PI*Math.pow(main.innerRadius-.002,2))}
 function mixedDepth(fraction=1){return depth((window.MebiData.getReagent(model.pair[0]).solid?0:window.MebiExperiment.defaults.solutionMl)+(window.MebiData.getReagent(model.pair[1]).solid?0:window.MebiExperiment.defaults.solutionMl*fraction))}
 function solidScale(p){return p.product&&p.phase==='solid'?1.4:1}
 function extent(kind,scale=1){const t=template(kind);return{radius:Math.max(...t.atoms.map(a=>Math.hypot(...a.position)+a.radius))*scale,bottom:Math.max(...t.atoms.map(a=>a.radius-a.position[1]))*scale+.008}}
 function hash(n){const v=Math.sin(n*127.13+78.233)*43758.5453;return v-Math.floor(v)}
 function noise(seed,t){const i=Math.floor(t),u=ease(t-i);return mix(hash(seed+i*17),hash(seed+(i+1)*17),u)-.5}
 function clear(){lens.stop();lensGroups=[];atomOrigins=[];model=graph=null;positions=[];pairKey='';stamp=''}
 function stop(){if(!enabled)return;enabled=false;clear();}
 function compile(){
   const atoms=[];for(const p of model.initial){p.atomIDs=template(p.kind).atoms.map(atom=>{atoms.push({element:atom.element,radius:atom.radius});atomOrigins.push(p.source);return atoms.length-1})}
   const parentPools=new Map(model.initial.map(p=>{const pools={};p.atomIDs.forEach(id=>(pools[atoms[id].element]??=[]).push(id));return[p.id,pools]}));
   for(const p of model.dissolved)p.atomIDs=template(p.kind).atoms.map(atom=>parentPools.get(p.parent)[atom.element].shift());
   for(const event of model.events){const pools={};for(const p of event.reactants)for(const id of p.atomIDs)(pools[atoms[id].element]??=[]).push(id);for(const p of event.products)p.atomIDs=template(p.kind).atoms.map(atom=>pools[atom.element].shift());if(Object.values(pools).some(ids=>ids.length))throw new Error('Reaction atom mapping failed')}
   const sources=[model.initial.filter(p=>p.source===0),model.initial.filter(p=>p.source===1)];
   for(const source of sources)source.forEach((p,i)=>{p.rank=i/source.length*.94;p.order=i;p.seed=p.id*19+3});
   for(const p of model.dissolved){const parent=model.initial[p.parent];p.rank=parent.rank;p.order=parent.order;p.seed=parent.seed+(p.kind===parent.kind?0:p.id*.31)}
   model.products.forEach((p,i)=>{p.order=i;p.seed=p.id*19+3});
   for(const event of model.events){let arrival=0;for(const p of event.reactants)if(p.source===1){let a=0,b=1;for(let i=0;i<18;i++){const mid=(a+b)/2;if(window.MebiExperiment.sample(mid,!!window.MebiData.getReagent(model.pair[1]).solid).fraction<p.rank+.04)a=mid;else b=mid}arrival=Math.max(arrival,b*5)}event.start=Math.max(2.8+event.index/Math.max(1,model.events.length)*5,arrival+.15);event.duration=1.3}
   positions=atoms.map(()=>new THREE.Vector3());atomScales=new Float32Array(atoms.length).fill(1);hiddenAtoms.clear();return{atoms};
 }
 function sync(state){
   const wanted=active(state);if(!wanted){stop();return}
   if(!enabled){enabled=true;last=performance.now();lastTemperature=null}
   const key=state.selectedSlot1+'|'+state.selectedSlot2+'|'+state.experiment.run;
   if(pairKey!==key){clear();model=buildModel(state.selectedSlot1,state.selectedSlot2,[state.selectedSlot1,state.selectedSlot2].map(id=>window.MebiExperiment.initialAmount(id)));graph=compile();pairKey=key;command=-1;motion=0}
   const p=state.particleInspection;if(command!==p.revision||view!==p.view){view=p.view;time=p.time||0;command=p.revision;stamp=''}
 }
 function displayState(state){
   sync(state);if(!enabled)return state;
   const p=state.particleInspection,now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;
   if(!document.hidden){motion+=dt;if(view==='reaction')time=Math.min(16,time+dt)}
   const path=view==='reaction'?clamp(time/5):0,pose=window.MebiExperiment.sample(path,!!window.MebiData.getReagent(state.selectedSlot2).solid);
   if(!view||path===0||path>=1){secondary.group.position.copy(secondaryHome);secondary.group.rotation.set(0,0,0)}
   return{...state,labStep:view==='reaction'&&time>2.5?'observed':'predict',particleReplayProgress:view==='reaction'?ease((time-2.8)/6):0,experiment:{...state.experiment,mode:path>0&&path<1?'particle-replay':'idle',path,transfer:view==='reaction'?pose.fraction:0,flow:pose.fraction>0&&path<.8?1:0}};
 }
 function center(p,fraction,clock){
   const vessel=p.source?secondary:main,h=p.source?depth(window.MebiExperiment.defaults.solutionMl*(1-fraction)):mixedDepth(fraction),seed=p.seed||p.id*19+3;
   const size=extent(p.kind),radius=size.radius,safe=Math.max(.10,vessel.innerRadius-radius-.018);
   let x,y,z;
   if(p.phase==='solid'){
     const index=p.order||0,step=.12;x=((index%3)-1)*step;z=((Math.floor(index/3)%3)-1)*step;y=vessel.floor+size.bottom+Math.floor(index/9)*.09;
     x+=noise(seed,clock*7)*.0018;y+=noise(seed+2,clock*6)*.0018;
   }else{
     const angle=hash(seed+1)*Math.PI*2,r=Math.sqrt(hash(seed+4))*.94*safe;x=Math.cos(angle)*r+noise(seed+5,clock*.6)*.026;z=Math.sin(angle)*r+noise(seed+8,clock*.6)*.026;
     const range=Math.max(.02,h-radius*2-.018);y=vessel.floor+radius+.008+(hash(seed+6)*.88+.06)*range+noise(seed+9,clock*.7)*Math.min(.018,range*.12);
   }
   let local=new THREE.Vector3(x,y,z),position=vessel.group.localToWorld(local);
   if(view==='reaction'&&p.source){
     const u=fraction>=.9999?1:ease((fraction-p.rank)/.04),targetLocal=new THREE.Vector3(x,p.phase==='solid'?main.floor+size.bottom+Math.floor((p.order||0)/9)*.09:main.floor+radius+.008+(hash(seed+6)*.88+.06)*Math.max(.02,mixedDepth(fraction)-radius*2-.018),z),target=main.group.localToWorld(targetLocal);
     if(u>=1)position=target;else if(u>0){const exit=secondary.group.localToWorld(secondary.spoutPoint.clone()),entry=main.group.localToWorld(new THREE.Vector3(-.025,main.floor+mixedDepth(fraction)+.025,0));if(u<.2)position.lerp(exit,u/.2);else if(u<.8)position.copy(exit).lerp(entry,(u-.2)/.6);else position.copy(entry).lerp(target,(u-.8)/.2)}
   }
   return position;
 }
 function productCenter(p,clock){
   const h=mixedDepth(),local=new THREE.Vector3(),age=Math.max(0,time-model.events[p.event].start-1),i=p.order,seed=p.seed,size=extent(p.kind,solidScale(p));
   if(p.phase==='solid'){
     const count=model.products.filter(x=>x.phase==='solid').indexOf(p),columns=3,salt=['AgCl','AgI','CuI'].includes(p.kind),spacing=salt?.235:.16,settle=ease((time-9)/5);
     local.set((count%columns-1)*spacing,mix(main.floor+h*.45,main.floor+size.bottom+Math.floor(count/9)*.12,settle),(Math.floor(count/3)%3-1)*.115);local.x+=noise(seed,clock*7)*.002;local.y+=noise(seed+1,clock*7)*.002;
   }else if(p.phase==='gas'){
     const rise=ease(age/4);local.set(noise(seed,clock*.7)*.36,main.floor+h*.62+rise*(main.height-h*.62+.20)+noise(seed+3,clock*.8)*.035,noise(seed+4,clock*.7)*.30);
   }else{
     const a=hash(seed)*Math.PI*2,r=Math.sqrt(hash(seed+3))*.90*Math.max(.06,main.innerRadius-size.radius-.018);local.set(Math.cos(a)*r+noise(seed+5,clock*.6)*.025,main.floor+size.radius+.009+hash(seed+4)*Math.max(.015,h-size.radius*2-.018)+noise(seed+7,clock*.6)*.006,Math.sin(a)*r+noise(seed+9,clock*.6)*.025);
   }
   return main.group.localToWorld(local);
 }
 function particleAtoms(p,position,clock){const t=template(p.kind),moving=p.phase!=='solid',salt=p.product&&['AgCl','AgI','CuI'].includes(p.kind),solidIndex=salt?model.products.filter(x=>x.phase==='solid').indexOf(p):0,parity=(Math.floor(solidIndex/3)%3+Math.floor(solidIndex/9))%2;euler.set(moving?clock*.31+p.seed:0,moving?clock*.37+p.seed*.7:salt?parity*Math.PI:0,moving?clock*.25:0);rot.setFromEuler(euler);return t.atoms.map(a=>new THREE.Vector3(...a.position).applyQuaternion(rot).multiplyScalar(main.group.scale.x*solidScale(p)).add(position))}
 function update(state,display){
   if(!enabled)return;const p=state.particleInspection;if(!p)return;
   const visible=p.micro;
   if(!visible){lens.update({state,model,display,view,time});last=performance.now();const value=Math.round((state.activeReaction.tempInit+(state.currentTemp-state.activeReaction.tempInit)*(view==='reaction'?ease((time-3)/8):0))*10)/10;if(lastTemperature!==value){lastTemperature=value;setTemperature(value)}window.MebiParticleInspection.paint(state,{phase:'Mercek gizli · Canlı deney sürüyor',time,notes:model.notes});return}
   main.group.updateMatrixWorld(true);secondary.group.updateMatrixWorld(true);
   const sourceNormal=view==='reaction'&&display.experiment.path>0&&display.experiment.path<1;
   const f=display.experiment.transfer,now=performance.now(),key=view+'|'+time+'|'+motion+'|'+f,shouldDraw=key!==stamp&&(innerHeight>=650&&innerWidth>=950||now-lastDraw>=33);
   if(shouldDraw){stamp=key;lastDraw=now;atomScales.fill(1);hiddenAtoms.clear();
     for(const item of model.initial){const coords=particleAtoms(item,center(item,f,motion),motion);item.atomIDs.forEach((id,i)=>positions[id].copy(coords[i]))}
     if(view!=='before'){
       const dissolution=ease((time-1.5)/2);
       for(const item of model.dissolved){const coords=particleAtoms(item,center(item,f,motion),motion);item.atomIDs.forEach((id,i)=>{if(item.dissolving){w.copy(coords[i]);coords[i].copy(positions[id]).lerp(w,dissolution)}positions[id].copy(coords[i])})}
       for(const event of model.events){const u=ease((time-event.start)/event.duration);if(u===0)continue;for(const item of event.products){const coords=particleAtoms(item,productCenter(item,motion),motion);item.atomIDs.forEach((id,i)=>{positions[id].lerp(coords[i],u);atomScales[id]=mix(1,solidScale(item),u)});}}
     }
     if(view==='before'||time<2.5)lensGroups=model.initial;
     else{
       const consumed=new Set(),products=[];
       for(const event of model.events){const u=ease((time-event.start)/event.duration);if(u>=.5){event.reactants.forEach(item=>consumed.add(item.id));products.push(...event.products.map(item=>({...item,bondWeight:(u-.5)*2})));}}
       lensGroups=[...model.dissolved.filter(item=>!consumed.has(item.id)),...products];
     }
   }
   const noReaction=!model.events.length,phase=view==='before'?'Dökülmeden önce · İki ayrı beher':time<1.1?'Aktarım başlıyor':time<3?'İkinci beher birinciye aktarılıyor':noReaction?'Tanecikler karışıyor; yeni kimyasal ürün oluşmuyor':time<9?'Atomlar ve iyonlar yeniden düzenleniyor':time<15.95?'Ürünler oluşuyor; gaz yükselir, katı çökelir':'Son durum · Tanecik hareketi sürer';
   window.MebiParticleInspection.paint(state,{phase,time,notes:model.notes});
   lens.update({state,model,display,view,time,motion,groups:lensGroups,positions,atoms:graph.atoms,scales:atomScales,hiddenAtoms,origins:atomOrigins});
   const value=state.activeReaction.tempInit+(state.currentTemp-state.activeReaction.tempInit)*(view==='reaction'?ease((time-3)/8):0),rounded=Math.round(value*10)/10;if(lastTemperature!==rounded){lastTemperature=rounded;setTemperature(rounded)}
   summary={macroAtomsVisible:!!scene.getObjectByName('laboratory-particle-atoms'),mergedLegend:view==='reaction'&&time>=5,sourceNormal,hiddenSourceAtoms:hiddenAtoms.size,visibleAtoms:graph.atoms.length-hiddenAtoms.size,solidParticleScale:1.4,vesselVisuals:[main,secondary].map(vessel=>({opacity:vessel.liquid.material.opacity,powder:vessel.powder.visible,liquid:vessel.liquid.visible})),pair:model.pair,startingAmounts:model.amounts,view,time,motion,atoms:graph.atoms.length,initialParticles:model.initial.length,finalParticles:model.spectators.length+model.products.length,balanced:model.balanced,initialInventory:model.startInventory,finalInventory:model.endInventory,gasProducts:model.products.filter(x=>x.phase==='gas').length,solidProducts:model.products.filter(x=>x.phase==='solid').length,recipe:!!model.recipe,drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,notes:model.notes,beakerUUIDs:[main.group.uuid,secondary.group.uuid]};
 }
 function getSummary(){
   if(!enabled||!model||!summary)return null;
   const bounds=vessel=>{const points=[];for(const x of[-vessel.radius,vessel.radius])for(const y of[0,vessel.height])for(const z of[-vessel.radius,vessel.radius])points.push(project(vessel.group.localToWorld(new THREE.Vector3(x,y,z))));return{left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))}};
   let outsideVessel=0;const tested=view==='before'?model.initial:time>=15.95?[...model.spectators,...model.products]:[];for(const item of tested){if(item.phase==='gas')continue;const vessel=view==='before'&&item.source?secondary:main;for(const id of item.atomIDs){const local=vessel.group.worldToLocal(positions[id].clone()),radius=graph.atoms[id].radius*atomScales[id];if(Math.hypot(local.x,local.z)+radius>vessel.innerRadius+.003||local.y-radius<vessel.floor-.003||local.y+radius>vessel.rimHeight+.003)outsideVessel++}}
   const cameraInBeakers=[main,secondary].map(vessel=>{const local=vessel.group.worldToLocal(camera.position.clone());return Math.hypot(local.x,local.z)<vessel.innerRadius&&local.y>vessel.floor&&local.y<vessel.rimHeight});
   return{...summary,time,motion,lens:lens.getSummary(),glassTransmission:[main,secondary].map(v=>v.group.getObjectByName('beaker-glass-100ml').material.transmission),outsideVessel,cameraInBeakers,beakerBounds:[bounds(main),bounds(secondary)]};
 }
 return{sync,displayState,update,stop,pickLens:lens.pick,moveLens:lens.move,selectLens:lens.select,get enabled(){return enabled},getSummary};
}
