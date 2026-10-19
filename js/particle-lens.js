import {template, COLORS, symbol, unique} from './particle-models.js?v=1.1';

// A second projection of the laboratory's actual atom positions, with no extra
// WebGL context, chemical model, playback clock or independently moving atoms.
export function createParticleLens({THREE,camera,main,secondary}) {
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const vessels=[main,secondary],raycaster=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),0);
 const inverse=new THREE.Matrix4(),ray=new THREE.Ray(),point=new THREE.Vector3(),local=new THREE.Vector3(),rotation=new THREE.Euler();
 let frame=null,lastDraw=0,lastKey='',canvas=null,context=null,hits=[],report=null,legendKey='';
 function lens(){return frame?.state.particleInspection?.lens;}
 function dimensions(index){
  const vessel=vessels[index],isSolid=window.MebiData.getReagent(frame.model.pair[index]).solid;
  const fraction=frame.view==='reaction'?frame.display.experiment.transfer:0,amount=window.MebiExperiment.defaults.solutionMl;
  const ml=index===1?(isSolid?0:amount*(1-fraction)):(isSolid?0:amount)+(window.MebiData.getReagent(frame.model.pair[1]).solid?0:amount*fraction);
  const height=ml*Math.pow(main.height/6.68,3)/(Math.PI*Math.pow(main.innerRadius-.002,2));
  // A dry sample is inspected in its occupied solid layer, not in imaginary water.
  const layer=height>.008?height:isSolid&&!(index===1&&fraction>.99)?.21:0;
  return {vessel,height:layer,liquid:height>.008,radius:vessel.innerRadius-.018};
 }
 function center(index){
  const d=dimensions(index),focus=lens().focus,margin=Math.min(.045,d.height*.18);
  return new THREE.Vector3((focus.x-.5)*d.radius*1.5,d.vessel.floor+margin+focus.y*Math.max(.005,d.height-margin*2),0);
 }
 function screen(world){const p=world.clone().project(camera);return{x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2,visible:p.z>-1&&p.z<1};}
 function intersect(x,y,index,allowOutside=false){
  if(!frame||!lens()||!frame.state.particleInspection.micro)return null;
  const d=dimensions(index);if(d.height<.005)return null;
  d.vessel.group.updateWorldMatrix(true,false);camera.updateMatrixWorld();
  raycaster.setFromCamera({x:x/innerWidth*2-1,y:1-y/innerHeight*2},camera);
  inverse.copy(d.vessel.group.matrixWorld).invert();ray.copy(raycaster.ray).applyMatrix4(inverse);
  if(!ray.intersectPlane(plane,point))return null;
  if(!allowOutside&&(Math.abs(point.x)>d.radius||point.y<d.vessel.floor||point.y>d.vessel.floor+d.height))return null;
  const margin=Math.min(.045,d.height*.18);
  return{x:clamp(point.x/(d.radius*1.5)+.5),y:clamp((point.y-d.vessel.floor-margin)/Math.max(.005,d.height-margin*2)),vessel:index};
 }
 function pick(x,y){
  const selected=lens()?.vessel||0;
  return intersect(x,y,selected)||intersect(x,y,1-selected);
 }
 function move(x,y,index){const value=intersect(x,y,index,true);if(!value)return false;Object.assign(lens(),{focus:{x:value.x,y:value.y},vessel:index});lastKey='';return true;}
 function projectMarkers(){
  const settings=lens(),host=document.getElementById('particleLensTargets');if(!host)return;
  host.hidden=!frame.state.particleInspection.micro;
  for(const marker of host.querySelectorAll('[data-lens-target]')){
   const index=Number(marker.dataset.lensTarget),d=dimensions(index),active=index===settings.vessel;
   const world=d.vessel.group.localToWorld(center(index)),p=screen(world);
   marker.hidden=!active||d.height<.005||!p.visible;
   marker.style.left=p.x+'px';marker.style.top=p.y+'px';
   marker.setAttribute('aria-label',(index+1)+'. beherdeki odak noktasını taşı');
  }
  const svg=document.getElementById('particleLensConnector'),windowNode=document.getElementById('particleLensViewport');if(!svg||!windowNode)return;
  const d=dimensions(settings.vessel),p=screen(d.vessel.group.localToWorld(center(settings.vessel))),rect=windowNode.getBoundingClientRect();
  svg.toggleAttribute('hidden',!frame.state.particleInspection.micro||rect.width===0||d.height<.005||!p.visible);
  svg.setAttribute('viewBox','0 0 '+innerWidth+' '+innerHeight);
  const ex=rect.left+8,ey=clamp(p.y,rect.top+rect.height*.22,rect.bottom-rect.height*.22);
  svg.querySelector('path').setAttribute('d',`M ${p.x+17} ${p.y} C ${p.x+45} ${p.y}, ${ex-35} ${ey}, ${ex} ${ey}`);
 }
 function sphere(ctx,p,color,r){
  const g=ctx.createRadialGradient(p.x-r*.3,p.y-r*.35,r*.06,p.x,p.y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.32,color);g.addColorStop(1,color);
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
 }
 function render(now){
  const settings=lens(),node=document.getElementById('particleLensCanvas');if(!node)return;
  if(canvas!==node){canvas=node;context=canvas.getContext('2d');lastKey='';legendKey='';}
  const rect=canvas.getBoundingClientRect();if(!rect.width)return;
  const key=[frame.time,frame.motion,settings.vessel,settings.focus.x,settings.focus.y,settings.yaw,settings.pitch,settings.zoom,settings.water,settings.selectedAtom,rect.width,document.documentElement.dataset.theme].join('|');
  if(key===lastKey)return;
  // Position changes from an intentional drag paint immediately; playback is capped.
  const focusKey=[settings.vessel,settings.focus.x,settings.focus.y,settings.yaw,settings.pitch,settings.zoom,settings.water,settings.selectedAtom,rect.width].join('|');
  if(focusKey===render.focusKey&&now-lastDraw<66)return;
  render.focusKey=focusKey;lastKey=key;lastDraw=now;
  const w=rect.width,h=rect.height,dpr=Math.min(devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  const ctx=context;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const d=dimensions(settings.vessel),target=center(settings.vessel),radius=d.radius*.67/settings.zoom;
  inverse.copy(d.vessel.group.matrixWorld).invert();rotation.set(settings.pitch,settings.yaw,0);
  const scale=Math.min(w,h)*.35/radius,clipRadius=Math.min(w,h)/2-4;
  function project(position){local.copy(position).sub(target).applyEuler(rotation);const k=radius*5/(radius*5+local.z);return{x:w/2+local.x*scale*k,y:h/2-local.y*scale*k,z:local.z,k};}
  const visible=[],marks=[];hits=[];
  for(const group of frame.groups){
   if(!settings.water&&group.solvent)continue;
   if(group.atomIDs.some(id=>frame.hiddenAtoms.has(id)))continue;
   const coords=group.atomIDs.map(id=>frame.positions[id].clone().applyMatrix4(inverse));
   const midpoint=coords.reduce((sum,p)=>sum.add(p),new THREE.Vector3()).divideScalar(coords.length);
   if(Math.hypot(midpoint.x,midpoint.z)>d.radius+.07||midpoint.y<d.vessel.floor-.015||midpoint.y>d.vessel.floor+d.height+.09||midpoint.distanceTo(target)>radius)continue;
   visible.push(group);const projected=coords.map(project);
   const t=template(group.kind);
   for(const [a,b,order=1]of t.bonds)for(let line=0;line<order;line++)marks.push({bond:true,a:projected[a],b:projected[b],z:(projected[a].z+projected[b].z)/2,offset:(line-(order-1)/2)*2,alpha:group.bondWeight??1});
   group.atomIDs.forEach((id,i)=>{const p=projected[i],r=Math.max(3,frame.atoms[id].radius*frame.scales[id]*scale*p.k);marks.push({...p,id,r,color:COLORS[frame.atoms[id].element]});if(Math.hypot(p.x-w/2,p.y-h/2)<clipRadius)hits.push({...p,id,r,kind:group.kind});});
  }
  ctx.save();ctx.beginPath();ctx.arc(w/2,h/2,clipRadius,0,Math.PI*2);ctx.clip();
  marks.sort((a,b)=>b.z-a.z).forEach(mark=>{if(mark.bond){ctx.globalAlpha=mark.alpha;ctx.strokeStyle='#899c99';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(mark.a.x,mark.a.y+mark.offset);ctx.lineTo(mark.b.x,mark.b.y+mark.offset);ctx.stroke();ctx.globalAlpha=1;}else sphere(ctx,mark,mark.color,mark.r);});
  const chosen=hits.find(hit=>hit.id===settings.selectedAtom);
  if(chosen){ctx.strokeStyle=getComputedStyle(canvas).color;ctx.lineWidth=2;ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(chosen.x,chosen.y,chosen.r+5,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();
  const legend=document.getElementById('particleLensSpecies'),sampleKinds=unique(visible),nextLegend=sampleKinds.map(p=>p.kind+'|'+p.phase).join(',');
  if(legend&&legendKey!==nextLegend){legendKey=nextLegend;legend.replaceChildren();for(const group of sampleKinds){const label=document.createElement('span');label.textContent=symbol(group.kind)+(group.phase==='solid'?' · katı':group.phase==='gas'?' · gaz':'');legend.append(label);}if(!sampleKinds.length){const empty=document.createElement('span');empty.textContent='Bu kesitte tanecik görünmüyor; halkayı yakın bir noktaya taşı.';legend.append(empty);}}
  const info=document.getElementById('particleLensSelection');if(info){
   const id=settings.selectedAtom,origin=id==null?null:frame.origins[id],found=frame.groups.find(g=>g.atomIDs.includes(id));
   const text=id==null?'Bir atoma dokun: türünü ve hangi beherden geldiğini gör.':`${frame.atoms[id]?.element||''} · ${(origin??0)+1}. beherden · `+(chosen?symbol(found?.kind||'')+(found?.phase==='solid'?' · katı örgü kesiti':''):'şu an bu kesitin dışında; odağı taşıyınca tekrar görünebilir.');
   if(info.textContent!==text)info.textContent=text;
  }
  report={vessel:settings.vessel,focus:{...settings.focus},center:target.toArray(),radius,atomIDs:hits.map(p=>p.id),species:sampleKinds.map(p=>p.kind),selectedAtom:settings.selectedAtom,selectedVisible:!!chosen,time:frame.time,motion:frame.motion,zoom:settings.zoom,hitTargets:hits.map(({x,y,id,r})=>({x,y,id,r}))};
 }
 function update(next){frame=next;if(!lens())return;projectMarkers();if(next.state.particleInspection.micro)render(performance.now());}
 function select(x,y){if(!canvas||!lens())return;const rect=canvas.getBoundingClientRect(),hitsInRange=hits.map(p=>({...p,d:Math.hypot(x-rect.left-p.x,y-rect.top-p.y)})).filter(p=>p.d<Math.max(18,p.r+6)).sort((a,b)=>a.d-b.d);if(hitsInRange.length){lens().selectedAtom=lens().selectedAtom===hitsInRange[0].id?null:hitsInRange[0].id;document.querySelector('.particle-lens-settings').open=true;}lastKey='';}
 function stop(){frame=null;canvas=context=null;hits=[];report=null;lastKey=legendKey='';}
 return{update,pick,move,select,stop,getSummary:()=>report};
}
