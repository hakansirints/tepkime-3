import * as THREE from '../js/vendor/three/three.module.js';
import { createBeakerFactory, BEAKER_RADIUS, BEAKER_HEIGHT } from '../js/beaker-model.js';

// Build-time rendering only. The selection screen loads the three finished WebPs.
const renderer = new THREE.WebGLRenderer({ antialias:true, preserveDrawingBuffer:true });
renderer.setPixelRatio(1);
renderer.setSize(640,440);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(25,640/440,.01,20);
camera.position.set(.55,1.5,3.05);
camera.lookAt(0,.54,0);
scene.add(new THREE.HemisphereLight(0xffffff,0xb2b8bd,1.65));
const key = new THREE.DirectionalLight(0xffffff,2.3);
key.position.set(-2,4,4);scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff,.65);
fill.position.set(3,2,-2);scene.add(fill);
const vessel = createBeakerFactory(renderer,scene)(BEAKER_RADIUS,BEAKER_HEIGHT);
scene.environment = vessel.group.getObjectByName('beaker-glass-100ml').material.envMap;

const backdrop = document.createElement('canvas');backdrop.width=2;backdrop.height=440;
const backdropTexture = new THREE.CanvasTexture(backdrop);
backdropTexture.colorSpace = THREE.SRGBColorSpace;
scene.background=backdropTexture;
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=256;
const shadowContext=shadowCanvas.getContext('2d');
const radial=shadowContext.createRadialGradient(128,128,12,128,128,123);
radial.addColorStop(0,'rgba(6,18,25,.35)');radial.addColorStop(.55,'rgba(6,18,25,.15)');radial.addColorStop(1,'rgba(6,18,25,0)');
shadowContext.fillStyle=radial;shadowContext.fillRect(0,0,256,256);
const contact=new THREE.Mesh(new THREE.PlaneGeometry(1.65,1.65),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
contact.rotation.x=-Math.PI/2;contact.position.y=-.002;contact.scale.y=.65;scene.add(contact);

// A granular heap is a card-only presentation of the unchanged white solid.
const radius=vessel.innerRadius-.009;
function powderHeight(x,z){
  const edge=Math.max(0,1-Math.hypot(x,z)/radius);
  return .072+.37*Math.pow(edge,1.5)+.009*Math.sin(x*137+z*23)*Math.cos(z*151)*edge;
}
const powderPositions=[],powderIndices=[],N=96,K=32;
for(let k=0;k<=K;k++)for(let j=0;j<=N;j++){
  const r=radius*k/K,a=j/N*Math.PI*2,x=Math.sin(a)*r,z=Math.cos(a)*r;
  powderPositions.push(x,powderHeight(x,z),z);
}
for(let k=0;k<K;k++)for(let j=0;j<N;j++){
  const a=k*(N+1)+j,b=a+1,c=a+N+1,d=c+1;
  powderIndices.push(a,c,b,b,c,d);
}
const lower=powderPositions.length/3;
for(let j=0;j<=N;j++){
  const a=j/N*Math.PI*2;powderPositions.push(Math.sin(a)*radius,vessel.floor,Math.cos(a)*radius);
  if(j<N){const top=K*(N+1)+j;powderIndices.push(top,lower+j,top+1,top+1,lower+j,lower+j+1);}
}
const powderGeometry=new THREE.BufferGeometry();
powderGeometry.setAttribute('position',new THREE.Float32BufferAttribute(powderPositions,3));
powderGeometry.setIndex(powderIndices);powderGeometry.computeVertexNormals();
vessel.powder.geometry.dispose();vessel.powder.geometry=powderGeometry;
vessel.powder.material.color.set('#ffffff');
const grains=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.0055,0),new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.96}),1500);
const dummy=new THREE.Object3D();let seed=37;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<1500;i++){
  const r=radius*Math.sqrt(random()),a=random()*Math.PI*2,x=r*Math.sin(a),z=r*Math.cos(a);
  dummy.position.set(x,powderHeight(x,z)+.003,z);dummy.rotation.set(random()*3,random()*3,random()*3);dummy.scale.setScalar(.55+random()*.9);dummy.updateMatrix();
  grains.setMatrixAt(i,dummy.matrix);grains.setColorAt(i,new THREE.Color().setScalar(.86+random()*.14));
}
vessel.group.add(grains);

window.renderReagentPreview = type => {
  const palettes={powder:['#43576b','#293b4d'],clear:['#adb3ba','#7d8791'],blue:['#f2e7d5','#ded0ba']};
  if(!palettes[type])throw new Error('Unknown reagent preview: '+type);
  const ctx=backdrop.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,440);
  gradient.addColorStop(0,palettes[type][0]);gradient.addColorStop(1,palettes[type][1]);
  ctx.fillStyle=gradient;ctx.fillRect(0,0,2,440);backdropTexture.needsUpdate=true;
  vessel.powder.visible=grains.visible=type==='powder';
  vessel.grains.visible=vessel.sediment.visible=false;
  vessel.liquid.visible=vessel.surface.visible=type!=='powder';
  const visual=window.MebiChemistry.appearance({id:type==='blue'?'Cu(NO3)2':'HCl',solid:false});
  const p=vessel.liquid.geometry.attributes.position;
  const floor=vessel.floor+.002,unit=BEAKER_HEIGHT/6.68;
  const depth=window.MebiExperiment.defaults.solutionMl*Math.pow(unit,3)/(Math.PI*Math.pow(vessel.innerRadius-.002,2));
  for(let i=0;i<p.count;i++)p.setY(i,vessel.liquidBaseY[i]>.45?floor+depth:floor);
  p.needsUpdate=true;vessel.liquid.geometry.computeVertexNormals();
  vessel.surface.position.y=floor+depth;
  vessel.liquid.material.color.set(visual.color);vessel.liquid.material.opacity=visual.opacity;
  vessel.liquid.material.roughness=.055;vessel.liquid.material.envMapIntensity=.9;
  renderer.render(scene,camera);
  return renderer.domElement.toDataURL('image/webp',.96);
};
