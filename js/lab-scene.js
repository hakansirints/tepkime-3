import * as THREE from 'three';
window.THREE = THREE;
globalThis.THREE = THREE;
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { createBeakerFactory, BEAKER_RADIUS } from './beaker-model.js';
import { createPowderMotion } from './powder-motion.js';

function dismissLabLoader() {
  const loader = document.getElementById('mebiLabLoader');
  if (!loader) return;
  loader.classList.add('is-hidden');
  setTimeout(() => {
    if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
  }, 600);
}

const host = document.getElementById('labWorld');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
} catch (error) {
  console.warn('Laboratuvar WebGL görünümü başlatılamadı.', error);
  dismissLabLoader();
}

if (renderer) initialize();
else dismissLabLoader();

function initialize() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerHeight < 650 ? 1.25 : 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  host.addEventListener('contextmenu', (e) => e.preventDefault());
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e7e6dd');
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 60);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.panSpeed = 0.8;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
  };
  controls.enableZoom = true;
  controls.zoomSpeed = 0.65;
  controls.minDistance = 1.1;
  controls.maxDistance = 7.7;
  controls.minPolarAngle = 0.45;
  controls.maxPolarAngle = 1.45;
  controls.minAzimuthAngle = -1.1;
  controls.maxAzimuthAngle = 1.1;
  controls.rotateSpeed = 0.45;
  const home = new THREE.Vector3(0.10, 2.40, 2.90);
  const focus = new THREE.Vector3(0, 1.84, 0.25);
  const closeViewPosition = new THREE.Vector3(-0.03, 2.07, 1.85);
  const closeViewFocus = new THREE.Vector3(-0.02, 1.70, 0.34);
  const roomView = new THREE.Vector3(3.8, 3.45, 5.5);
  const roomFocus = new THREE.Vector3(0, 1.60, -0.9);
  const viewFov = { desk: 40, closeup: 38, wide: 52 };
  // Keep the eye inside the floor footprint and clear of walls/ceiling.
  const cameraBounds = new THREE.Box3(
    new THREE.Vector3(-5.6, 1.6, -4.4), new THREE.Vector3(5.6, 4.55, 5.5));
  camera.position.copy(roomView);
  controls.target.copy(roomFocus);
  camera.fov = viewFov.wide;
  camera.updateProjectionMatrix();
  controls.update();

  const hemisphere = new THREE.HemisphereLight(0xf2ffff, 0x8a9191, 1.7);
  scene.add(hemisphere);
  const sunlight = new THREE.DirectionalLight(0xfff4dc, 2.2);
  sunlight.position.set(-3.5, 7.5, 4);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  Object.assign(sunlight.shadow.camera, { left: -6, right: 6, top: 5, bottom: -5, near: 0.5, far: 18 });
  sunlight.shadow.normalBias = 0.035;
  sunlight.shadow.bias = -0.0002;
  scene.add(sunlight);
  const fill = new THREE.DirectionalLight(0xd9f6fa, 0.8);
  fill.position.set(5, 4, -1);
  scene.add(fill);

  const environmentCanvas = document.createElement('canvas');
  environmentCanvas.width = 512;
  environmentCanvas.height = 256;
  const environmentContext = environmentCanvas.getContext('2d');
  environmentContext.fillStyle = '#abbec5';
  environmentContext.fillRect(0, 0, 512, 256);
  environmentContext.fillStyle = '#efffff';
  environmentContext.fillRect(50, 35, 115, 100);
  environmentContext.fillRect(280, 45, 75, 60);
  environmentContext.fillStyle = '#ffffff';
  environmentContext.fillRect(0, 0, 512, 25);
  const environmentTexture = new THREE.CanvasTexture(environmentCanvas);
  environmentTexture.mapping = THREE.EquirectangularReflectionMapping;
  environmentTexture.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromEquirectangular(environmentTexture);
  scene.environment = environment.texture;
  environmentTexture.dispose();
  pmrem.dispose();

  const materials = {
    wall: standard('#efe1c8', 0.92),
    white: standard('#f5f8f6', 0.53),
    teal: standard('#a6b69a', 0.65),
    dark: standard('#34494b', 0.45),
    metal: new THREE.MeshStandardMaterial({ color: '#bccbd0', metalness: 0.82, roughness: 0.24 }),
    black: standard('#263133', 0.7),
    rubber: standard('#183e40', 0.86)
  };

  function standard(color, roughness = 0.4) {
    return new THREE.MeshStandardMaterial({ color, roughness });
  }

  function mesh(geometry, material, parent = scene, x = 0, y = 0, z = 0) {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(x, y, z);
    item.castShadow = !material.transparent;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }

  function box(w, h, d, material, parent, x, y, z) {
    return mesh(new THREE.BoxGeometry(w, h, d), material, parent, x, y, z);
  }

  function cylinder(radius, height, material, parent, x = 0, y = 0, z = 0) {
    return mesh(new THREE.CylinderGeometry(radius, radius, height, 40), material, parent, x, y, z);
  }

  // Room geometry adapted from 3b-lab/sicak-sinif-laboratuvari.
  const room = new THREE.Group(); scene.add(room);
  const selected = 'C';
  const t = {wall:'#efe1c8',floor:'#c6ad8b',cabinet:'#a6b69a',top:'#fff2d7',wood:'#aa7a49',tile:'#eee7d9',metal:'#76664f'};
  const tableColor = '#3d4547';
  let tableSurface;
  const tableY = 1.425;
const roomMat=(color,roughness=.7)=>new THREE.MeshStandardMaterial({color,roughness});
function roomBox(w,h,d,x,y,z,m,parent=room){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function roomCylinder(rt,rb,h,x,y,z,m,parent=room){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,64),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function roomRing(r,t,x,y,z,m,parent){const o=new THREE.Mesh(new THREE.TorusGeometry(r,t,10,80),m);o.rotation.x=Math.PI/2;o.position.set(x,y,z);parent.add(o);return o}
function roomLabel(text,w,h,color,bg){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 50px Segoe UI, "Plus Jakarta Sans", sans-serif';ctx.fillText(text,512,128);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex}));}
function roomCabinet(x,z,w,t){roomBox(w,1.13,.64,x,.62,z,roomMat(t.cabinet));roomBox(w+.08,.1,.76,x,1.23,z,roomMat(t.top,.33));const n=Math.round(w/.85);for(let i=0;i<n;i++){let cx=x-w/2+(i+.5)*w/n;roomBox(w/n-.025,.96,.026,cx,.66,z+.334,roomMat(t.cabinet));roomBox(.24,.032,.045,cx,1.02,z+.369,roomMat(t.wood,.4));}roomBox(w,.09,.6,x,.095,z,roomMat(t.metal));}
roomBox(12,.12,12,0,-.06,0,roomMat(t.floor));for(let x=-6;x<=6;x+=1.2)roomBox(.014,.003,12,x,.003,0,roomMat(selected==='C'?'#b79b79':'#aab3b1'));for(let z=-6;z<=6;z+=1.2)roomBox(12,.003,.014,0,.004,z,roomMat(selected==='C'?'#b79b79':'#aab3b1'));
roomBox(12,4.8,.15,0,2.4,-4.8,roomMat(t.wall));roomBox(.15,4.8,10,-6,2.4,.1,roomMat(t.wall));roomBox(12,.11,.12,0,.1,-4.68,roomMat(t.metal));
roomBox(9.2,1.55,.035,0,2.03,-4.69,roomMat(t.tile));for(let x=-4.6;x<4.7;x+=selected==='B'?.8:.32)roomBox(.009,1.55,.01,x,2.03,-4.663,roomMat('#c2c9c4'));for(let y=1.3;y<2.8;y+=selected==='B'?.38:.32)roomBox(9.2,.009,.01,0,y,-4.66,roomMat('#c2c9c4'));
roomCabinet(-3,-4.25,2.8,t);roomCabinet(0,-4.25,2.8,t);roomCabinet(3,-4.25,2.8,t);
for(let y of [2.85,3.5]){roomBox(7.8,.075,.36,0,y,-4.48,roomMat(t.wood,.4));for(let x of [-3.2,3.2]){roomBox(.035,.28,.035,x,y-.15,-4.57,roomMat(t.metal));}} // deliberately empty wall shelves
if(selected==='B'){for(let x of [-3,0,3]){roomBox(2.68,.74,.33,x,3.98,-4.49,roomMat(t.cabinet));roomBox(.016,.7,.025,x,3.98,-4.31,roomMat(t.metal));}}
if(selected==='C'){for(let i=0;i<16;i++)roomBox(.07,2.9,.06,4.75+i*.064,2.45,-4.65,roomMat(t.wood));}
// Window on the left wall, with a daylight panel and deep frames.
roomBox(.03,2.05,3.1,-5.905,2.82,-1.2,new THREE.MeshBasicMaterial({color:selected==='C'?'#e9f2e4':'#d5ebf3'}));for(let z of [-2.79,.39])roomBox(.19,2.22,.085,-5.83,2.82,z,roomMat('#f9f8f0'));for(let y of [1.72,3.91])roomBox(.19,.085,3.25,-5.83,y,-1.2,roomMat('#f9f8f0'));roomBox(.19,2.17,.055,-5.81,2.82,-1.2,roomMat('#f9f8f0'));roomBox(.19,.055,3.16,-5.81,2.8,-1.2,roomMat('#f9f8f0'));roomBox(.38,.09,3.4,-5.76,1.68,-1.2,roomMat(t.top));
const sign=roomLabel('M E B İ   K İ M Y A   L A B O R A T U V A R I',5.4,.42,selected==='B'?'#44616c':'#536a53',t.wall);sign.position.set(0,4.23,-4.7);room.add(sign);
// Central island from the warm classroom reference.
tableSurface=roomBox(7,.15,2.2,0,1.34,0,roomMat(tableColor,.28));roomBox(6.95,.035,2.16,0,1.255,0,roomMat(t.wood,.4));
if(selected==='B'){for(let x of [-3.1,3.1]){for(let z of [-.83,.83])roomBox(.085,1.21,.085,x,.63,z,roomMat(t.metal,.4));roomBox(.09,.08,1.77,x,.17,0,roomMat(t.metal));}roomBox(6.2,.07,.07,0,.39,-.83,roomMat(t.metal));}
else {roomBox(6.5,1.13,1.75,0,.65,0,roomMat(selected==='C'?t.wood:t.cabinet));for(let i=0;i<7;i++){const x=-2.79+i*.93;roomBox(.89,.96,.025,x,.69,.889,roomMat(t.cabinet));roomBox(.28,.025,.04,x,1.03,.918,roomMat(t.wood,.45));}roomBox(6.28,.1,1.56,0,.13,0,roomMat(t.metal));}
// Two interactive experiment beakers replace the six decorative samples.
// Ceiling pendant fixtures give the room scale without cluttering the table.
for(let x of [-2,2]){roomBox(.022,.7,.022,x,4.4,.05,roomMat(t.metal));roomBox(1.45,.065,.38,x,4.04,.05,roomMat(t.metal));roomBox(1.34,.012,.3,x,4,.05,new THREE.MeshBasicMaterial({color:'#fff9dc'}));}
  const roomMaterialColors = [];
  const seenRoomMaterials = new Set();
  room.traverse(object => {
    const list = Array.isArray(object.material) ? object.material : [object.material];
    list.filter(Boolean).forEach(material => {
      if (!material.color || seenRoomMaterials.has(material) || material === tableSurface.material) return;
      seenRoomMaterials.add(material);
      roomMaterialColors.push({ material, color: material.color.clone() });
    });
  });
  let laboratoryLighting = '';

  function setLaboratoryLighting(mode) {
    const dark = mode === 'dark';
    laboratoryLighting = dark ? 'dark' : 'light';
    roomMaterialColors.forEach(entry => {
      entry.material.color.copy(entry.color);
      if (dark) entry.material.color.multiplyScalar(0.30);
    });
    scene.background.set(dark ? '#181b21' : '#e7e6dd');
    hemisphere.intensity = dark ? 0.65 : 1.7;
    sunlight.intensity = dark ? 0.50 : 2.2;
    fill.intensity = dark ? 0.35 : 0.8;
    renderer.toneMappingExposure = dark ? 0.80 : 0.92;
    renderer.shadowMap.needsUpdate = true;
  }

  function setTableColor(color) {
    if (!/^#[0-9a-f]{6}$/i.test(color || '')) return;
    tableSurface.material.color.set(color);
    renderer.shadowMap.needsUpdate = true;
  }
  const createBeaker = createBeakerFactory(renderer, scene);
  // Keep the existing display height, positions, contents and experiment timing.
  const beakerScale = 0.42 / 1.1;
  const beakerRadius = BEAKER_RADIUS;
  const main = createBeaker(beakerRadius, 1.1);
  main.group.scale.setScalar(beakerScale);
  main.group.name = 'experiment-beaker-1';
  main.group.position.set(-0.4, tableY, 0.48);
  const secondary = createBeaker(beakerRadius, 1.1);
  secondary.group.scale.setScalar(beakerScale);
  secondary.group.name = 'experiment-beaker-2';
  const secondaryHome = new THREE.Vector3(0.15, tableY, 0.48);
  secondary.group.position.copy(secondaryHome);
  main.powderMotion = createPowderMotion(main);
  secondary.powderMotion = createPowderMotion(secondary);

  function createBenchNameplate(x, slot) {
    const group = new THREE.Group();
    group.position.set(x, tableY + 0.009, 0.73);
    group.name = 'beaker-nameplate-' + slot;
    scene.add(group);
    const canvas = document.createElement('canvas');
    canvas.width = 768; canvas.height = 320;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const card = mesh(new THREE.PlaneGeometry(0.34, 0.19), new THREE.MeshBasicMaterial({ map: texture }), group);
    card.rotation.x = -Math.PI / 2;
    return { group, canvas, texture, key: '' };
  }

  function updateBenchNameplate(plate, id, slot) {
    const reagent = window.MebiData.getReagent(id);
    const key = slot + '|' + (id || 'empty');
    if (plate.key === key) return;
    plate.key = key;
    const ctx = plate.canvas.getContext('2d');
    ctx.fillStyle = '#f4f2df'; ctx.fillRect(0, 0, 768, 320);
    ctx.strokeStyle = '#718171'; ctx.lineWidth = 12; ctx.strokeRect(6, 6, 756, 308);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#294536'; ctx.font = '700 44px Segoe UI, sans-serif';
    ctx.fillText(slot + '. BEHER' + (reagent ? '  ·  ' + reagent.f : ''), 384, 70);
    ctx.fillStyle = '#30453a'; ctx.font = '600 34px Segoe UI, sans-serif';
    ctx.fillText(reagent ? reagent.name : 'Madde seçimini bekliyor', 384, 160);
    ctx.fillStyle = '#41735b'; ctx.font = '500 26px Segoe UI, sans-serif';
    ctx.fillText(reagent ? reagent.state : 'Boş beher', 384, 242);
    plate.texture.needsUpdate = true;
  }

  const mainNameplate = createBenchNameplate(main.group.position.x, 1);
  const secondaryNameplate = createBenchNameplate(secondaryHome.x, 2);


  // Modern Dijital Daldırma Termometresi (Beherin kenarına monte, 2. görsel ile birebir uyumlu)
  const probeX = main.group.position.x - 0.082;
  const probeZ = main.group.position.z - 0.035;
  const thermometer = new THREE.Group();
  thermometer.name = 'experiment-thermometer';
  scene.add(thermometer);
  // 1. Metalik Daldırma Probu (Paslanmaz çelik çubuk - beherin içine uzanır)
  cylinder(0.0055, 0.46, materials.metal, thermometer, probeX, tableY + 0.24, probeZ);
  mesh(new THREE.SphereGeometry(0.0055, 10, 8), materials.metal, thermometer, probeX, tableY + 0.012, probeZ);
  // 2. Yaka Boğaz Halkası (Collar Ring - Beherin üst ağız hizasında)
  const collarRing = mesh(new THREE.TorusGeometry(0.016, 0.005, 8, 24), materials.dark, thermometer, probeX, tableY + 0.455, probeZ);
  collarRing.rotation.x = Math.PI / 2;
  // 3. Dijital Termometre Gövdesi (Beher kenarında ileriye bakan koyu gövde - %40 küçültülmüş)
  const thermoHead = new THREE.Group();
  thermoHead.scale.setScalar(0.60);
  thermoHead.position.set(probeX, tableY + 0.51, probeZ);
  thermometer.add(thermoHead);
  box(0.24, 0.15, 0.035, materials.dark, thermoHead, 0, 0, 0);
  // Yüksek Çözünürlüklü Dijital LCD Ekran
  const displayCanvas = document.createElement('canvas');
  displayCanvas.width = 512; displayCanvas.height = 320;
  const displayTexture = new THREE.CanvasTexture(displayCanvas);
  displayTexture.colorSpace = THREE.SRGBColorSpace;
  displayTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  mesh(new THREE.PlaneGeometry(0.21, 0.125), new THREE.MeshBasicMaterial({ map: displayTexture }), thermoHead, 0, 0.004, 0.0185);
  // Alt çerçevedeki iki cyan montaj noktası/v Второй (2. görsel)
  const screw1 = cylinder(0.008, 0.005, standard('#38bdf8'), thermoHead, -0.075, -0.055, 0.0185);
  screw1.rotation.x = Math.PI / 2;
  const screw2 = cylinder(0.008, 0.005, standard('#38bdf8'), thermoHead, 0.075, -0.055, 0.0185);
  screw2.rotation.x = Math.PI / 2;

  // Pour visuals and motion adapted from tepkimenin-uc-yuzu's LabGlassware.
  const pourVisualScale = main.height * beakerScale / 0.57;
  const streamMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff', transparent: true, opacity: 0.6, roughness: 0.2
  });
  const streamMesh = new THREE.Mesh(new THREE.CylinderGeometry(
    0.008 * pourVisualScale, 0.011 * pourVisualScale, 1, 12, 20), streamMaterial);
  const streamBase = streamMesh.geometry.attributes.position.array.slice();
  streamMesh.renderOrder = 3;
  streamMesh.visible = false;
  scene.add(streamMesh);
  const splashRings = Array.from({ length: 3 }, (_, index) => {
    const ring = mesh(new THREE.TorusGeometry(0.03 * pourVisualScale,
      0.0018 * pourVisualScale, 6, 48), new THREE.MeshBasicMaterial({
      color: '#e5f0e9', transparent: true, opacity: 0.3, depthWrite: false
    }));
    ring.name = index === 0 ? 'surface-ripple' : 'surface-ripple-' + (index + 1);
    ring.rotation.x = -Math.PI / 2;
    ring.renderOrder = 3;
    ring.visible = false;
    return ring;
  });
  const pourDrops = Array.from({ length: 4 }, () => {
    const drop = mesh(new THREE.SphereGeometry(0.006 * pourVisualScale, 8, 6), streamMaterial);
    drop.visible = false;
    return drop;
  });
  const fillStreams = [main, secondary].map(vessel => {
    const flow = cylinder(0.008, 0.15, vessel.liquid.material.clone()); flow.visible = false;
    const grains = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.0054, 0), standard('#ffffff', 0.95), 30);
    scene.add(grains); grains.visible = false;
    return { flow, grains, vessel, started: -Infinity, id: null };
  });
  const powderStreamCount = 180;
  const pourGrains = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.0035, 0), standard('#ffffff', 0.95), powderStreamCount);
  scene.add(pourGrains); pourGrains.visible = false;
  const impactGrains = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.0045, 0), standard('#ffffff', 0.95), 24);
  scene.add(impactGrains); impactGrains.visible = false;
  const bubbleCount = 56;
  const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(0.025, 14, 10),
    new THREE.MeshPhysicalMaterial({ color: '#e8fbff', roughness: 0.02, metalness: 0, transmission: 0.18,
      thickness: 0.012, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.48,
      side: THREE.DoubleSide, depthWrite: false }), bubbleCount);
  main.group.add(bubbles);
  bubbles.visible = false;
  const gasSurfaceRings = Array.from({ length: 7 }, (_, index) => {
    const ring = mesh(new THREE.TorusGeometry(0.027 + index % 2 * 0.006, 0.0038, 7, 32),
      new THREE.MeshBasicMaterial({ color:'#dff8fb', transparent:true, opacity:0, depthWrite:false }), main.group);
    ring.rotation.x = Math.PI / 2;
    ring.visible = false;
    return ring;
  });
  const flakes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.016, 0), standard('#ffffff', 0.85), 80);
  flakes.name = 'precipitate-flakes';
  main.group.add(flakes);
  flakes.visible = false;
  const foam = cylinder(main.radius - 0.035, 0.028,
    new THREE.MeshStandardMaterial({ color: '#edf8f5', transparent: true, opacity: 0.62, roughness: 0.9 }), main.group);
  foam.visible = false;
  const dummy = new THREE.Object3D();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const projection = new THREE.Vector3();
  const clock = new THREE.Clock();
  let state = null;
  let particleLayer = null;
  let particleLoading = null;
  let particleLoadError = false;
  function ensureParticleLayer() {
    if (particleLayer || particleLoading || particleLoadError) return;
    particleLoading = import('./beaker-particles.js?v=2.3').then(module => {
      particleLayer = module.createBeakerParticles({THREE,scene,renderer,camera,main,secondary,secondaryHome,setTemperature});
      particleLayer.sync(state);resize();renderFrame();
    }).catch(error => {
      particleLoadError = true;
      console.error('Tanecik görünümü yüklenemedi.',error);
      const status = document.getElementById('particleInspectionPhase');
      if (status) status.textContent='Tanecik görünümü açılamadı. Kartına dönüp yeniden deneyebilirsin.';
    }).finally(() => {particleLoading=null;});
  }
  let dispatch = null;
  let lastPair = '';
  let lastStep = '';
  let motionRun = 0;
  let motionAt = performance.now();
  let completionQueued = false;
  let previousFlow = 0;
  let reactionStarted = 0;
  let temperature = 22;
  let drag = null;
  let cameraTransition = null;
  let zoomMotion = null;
  let cameraFraming = null;
  let hasPlayedIntro = false;
  let closeView = false;
  let panelWasCompact = false;
  let activeView = 'wide';
  let frame = 0;
  let lastFrameAt = 0;
  let overlay = null;
  let dragButton = null;
  let handGuide = null;
  let thermo = null;
  let mainLabel = null;
  let secondaryLabel = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let viewportWidth = 0, viewportHeight = 0;
  const cameraTools = document.createElement('div');
  cameraTools.id = 'labCameraTools';
  cameraTools.className = 'lab-camera-tools';
  cameraTools.setAttribute('role','toolbar');
  cameraTools.setAttribute('aria-label','Laboratuvar Kamera Kontrolleri');
  cameraTools.hidden = true;
  cameraTools.innerHTML = [['out','Uzaklaştır','−'],['in','Yakınlaştır','+'],['center','Beherleri Merkeze Al',null]].map(([action,label,symbol]) => '<button type="button" data-lab-camera="' + action + '" aria-label="' + label + '" title="' + label + '">' + (symbol ? '<span class="lab-zoom-symbol" aria-hidden="true">' + symbol + '</span>' : window.MebiSVG.icon('focus')) + '</button>').join('');
  cameraTools.addEventListener('click',event => {
    const button = event.target.closest('[data-lab-camera]');
    if (!button || cameraTools.hidden) return;
    if (button.dataset.labCamera === 'center') centerBeakers();
    else zoomCamera(button.dataset.labCamera === 'in');
  });
  document.body.appendChild(cameraTools);

  function updateCameraTools() {
    const card = document.querySelector('#app .prediction-card:not([data-floating-ghost])');
    const focused = state && state.screen === 'lab' && !state.stageReview && !window.MebiExperiment.get(state).safetyOpen && (!card || card.classList.contains('is-minimized') || card.classList.contains('is-collapsed'));
    cameraTools.hidden = !focused;
  }

  function zoomCamera(nearer) {
    const distance = zoomMotion ? zoomMotion.distance : camera.position.distanceTo(controls.target);
    if (!zoomMotion) stopCameraInertia();
    cameraTransition = null;
    // Rapid taps accumulate from the pending destination, retaining a smooth dolly.
    zoomMotion = {distance:THREE.MathUtils.clamp(distance * (nearer ? 1 / 1.2 : 1.2),controls.minDistance,controls.maxDistance),at:performance.now()};
  }

  function stopCameraInertia() {
    // Drain OrbitControls' pending drag through its public API without showing
    // that extra movement. A deliberate toolbar command takes over this pose.
    const position = camera.position.clone(), target = controls.target.clone(), damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = damping;
    camera.position.copy(position);controls.target.copy(target);camera.lookAt(target);
  }

  function visibleRect(node) {
    if (!node || !node.getClientRects().length || getComputedStyle(node).visibility === 'hidden') return null;
    const r = node.getBoundingClientRect();
    return r.width && r.height ? {left:Math.max(0,r.left),right:Math.min(innerWidth,r.right),top:Math.max(0,r.top),bottom:Math.min(innerHeight,r.bottom)} : null;
  }

  function freeCameraRect() {
    // Explicit centering and the lens layout reserve room for visible overlays.
    const gap = innerHeight < 650 ? 8 : 14;
    const top = Math.max(...['.mebi-top-shell','.mebi-stepper'].map(s => visibleRect(document.querySelector(s))?.bottom || 0)) + gap;
    const base = {left:gap,right:innerWidth-gap,top,bottom:(visibleRect(cameraTools)?.top || innerHeight)-gap};
    const lensWindow = state?.particleInspection && visibleRect(document.querySelector('.particle-lens-window'));
    if (lensWindow && lensWindow.left > base.left + 140 && innerWidth > 600) return {...base,right:lensWindow.left-gap};
    const selectors = '.lab-experiment-heading,.observation-live-dock>.experiment-live-data,#benchDock:not(.observation-live-dock),.particle-lens-window,.observation-live-dock>.beaker-particle-entry,.prediction-card.is-minimized:not(.observation-card),.observation-card.is-collapsed';
    const obstacles = [...document.querySelectorAll(selectors)].filter(n => !n.closest('[data-floating-ghost]')).map(visibleRect).filter(r => r && r.right>base.left && r.left<base.right && r.bottom>base.top && r.top<base.bottom);
    const xs = [base.left,base.right], ys = [base.top,base.bottom];
    for (const r of obstacles) {
      xs.push(THREE.MathUtils.clamp(r.left-gap,base.left,base.right),THREE.MathUtils.clamp(r.right+gap,base.left,base.right));
      ys.push(THREE.MathUtils.clamp(r.top-gap,base.top,base.bottom),THREE.MathUtils.clamp(r.bottom+gap,base.top,base.bottom));
    }
    const x = [...new Set(xs)].sort((a,b)=>a-b), y = [...new Set(ys)].sort((a,b)=>a-b);
    let best = null, score = -1;
    for (let l=0;l<x.length-1;l++) for (let r=l+1;r<x.length;r++) for (let t=0;t<y.length-1;t++) for (let b=t+1;b<y.length;b++) {
      const rect = {left:x[l],right:x[r],top:y[t],bottom:y[b]};
      if (rect.right-rect.left<60 || rect.bottom-rect.top<60 || obstacles.some(o => rect.left<o.right+gap && rect.right>o.left-gap && rect.top<o.bottom+gap && rect.bottom>o.top-gap)) continue;
      const area = (rect.right-rect.left)*(rect.bottom-rect.top);
      if (area>score) {best=rect;score=area;}
    }
    return best || base;
  }

  function vesselCorners(vessel) {
    vessel.group.updateWorldMatrix(true,false);
    const points = [];
    for (const x of [-vessel.radius-.015,vessel.radius+.015]) for (const y of [0,vessel.height+.015]) for (const z of [-vessel.radius-.015,vessel.radius+.015]) points.push(vessel.group.localToWorld(new THREE.Vector3(x,y,z)));
    points.push(vessel.group.localToWorld(vessel.spoutPoint.clone()));
    return points;
  }

  function projectedBounds(points, viewCamera = camera) {
    const p = points.map(point => point.clone().project(viewCamera));
    return {left:(Math.min(...p.map(v=>v.x))+1)*innerWidth/2,right:(Math.max(...p.map(v=>v.x))+1)*innerWidth/2,top:(1-Math.max(...p.map(v=>v.y)))*innerHeight/2,bottom:(1-Math.min(...p.map(v=>v.y)))*innerHeight/2};
  }

  function centerBeakers() {
    const safeRect = freeCameraRect(), rect = {...safeRect};
    const padding = Math.min(24,Math.max(6,(rect.right-rect.left)*.035));
    rect.left+=padding;rect.right-=padding;rect.top+=padding;rect.bottom-=padding;
    if (state?.particleInspection) {
      const width=rect.right-rect.left,height=rect.bottom-rect.top;
      rect.left+=width*.04;rect.right-=width*.12;
      rect.top+=height*(innerHeight<650?.18:.38);rect.bottom-=height*.06;
    }
    const points = [...vesselCorners(main),...vesselCorners(secondary)];
    if (thermometer.visible) {
      const box = new THREE.Box3().setFromObject(thermometer);
      for (const x of [box.min.x,box.max.x]) for (const y of [box.min.y,box.max.y]) for (const z of [box.min.z,box.max.z]) points.push(new THREE.Vector3(x,y,z));
    }
    const center = new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3());
    const direction = home.clone().sub(focus).normalize();
    const right = new THREE.Vector3().crossVectors(camera.up,direction).normalize(), up = new THREE.Vector3().crossVectors(direction,right);
    const fitCamera = camera.clone();fitCamera.fov=viewFov.desk;fitCamera.updateProjectionMatrix();
    const tangent = Math.tan(THREE.MathUtils.degToRad(fitCamera.fov/2));
    const ndcX = (rect.left+rect.right)/innerWidth-1, ndcY = 1-(rect.top+rect.bottom)/innerHeight;
    function pose(distance) {
      const shift = right.clone().multiplyScalar(-ndcX*distance*tangent*camera.aspect).addScaledVector(up,-ndcY*distance*tangent);
      const target = center.clone().add(shift), position = target.clone().addScaledVector(direction,distance);
      fitCamera.position.copy(position);fitCamera.lookAt(target);fitCamera.updateMatrixWorld();
      return {target,position,bounds:projectedBounds(points,fitCamera)};
    }
    let low = controls.minDistance, high = controls.maxDistance;
    for (let i=0;i<32;i++) {
      const middle=(low+high)/2, b=pose(middle).bounds;
      if (b.left>=rect.left && b.right<=rect.right && b.top>=rect.top && b.bottom<=rect.bottom) high=middle;
      else low=middle;
    }
    const fit = pose(high);
    cameraFraming = {safeRect,frameRect:rect};
    activeView = 'desk'; closeView = false;
    if (state) state.labView = 'desk';
    moveCamera(fit.position,fit.target,reducedMotion.matches ? 1 : 650,viewFov.desk);
  }

  function setTemperature(value) {
    temperature = value;
    const ctx = displayCanvas.getContext('2d');
    const isHeating = state && state.activeReaction && state.activeReaction.hasTempRise && value > 22.5;
    const accentColor = isHeating ? '#f59e0b' : '#38bdf8';
    const numColor = isHeating ? '#fbbf24' : '#22d3ee';
    // Koyu LCD arka planı
    ctx.fillStyle = isHeating ? '#1a0f02' : '#0a1017';
    ctx.fillRect(0, 0, 512, 320);
    // İnce iç çerçeve
    ctx.strokeStyle = isHeating ? '#78350f' : '#1e293b';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 308);
    // Üst şerit: DIGITAL TEMP ve REC ●
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('DIGITAL TEMP', 24, 46);
    ctx.textAlign = 'right';
    ctx.fillText('REC ●', 488, 46);
    // Orta alan: Büyük ve parlak dijital sıcaklık değeri
    ctx.fillStyle = numColor;
    ctx.font = 'bold 98px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = numColor;
    ctx.shadowBlur = 14;
    ctx.fillText(value.toFixed(1) + ' °C', 256, 178);
    ctx.shadowBlur = 0;
    // Alt şerit: MEBİ KİMYALAB - PROBE-T1
    ctx.fillStyle = isHeating ? '#d97706' : '#0284c7';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('MEBİ KİMYALAB - PROBE-T1', 256, 275);
    displayTexture.needsUpdate = true;
    displayTexture.userData.drawn = true;
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Only a real viewport resize changes projection; the lens also adapts its framing.
    if (w !== viewportWidth || h !== viewportHeight) {
      viewportWidth = w; viewportHeight = h;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, h < 650 ? 1.25 : 1.75));
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
    }
    refreshLayout();
  }

  let particleFramingSnapshot = null, particleFramingSize = "";
  function refreshLayout() {
    const h = window.innerHeight;
    const dock = document.getElementById('benchDock');
    const left = document.querySelector('.lab-live-card, .lab-reagent-panel');
    const app = document.getElementById('app');
    if (app) {
      const shell = document.querySelector('.mebi-top-shell'), stepper = document.querySelector('.mebi-stepper');
      const headerBottom = Math.max(shell ? shell.getBoundingClientRect().bottom : 0,stepper ? stepper.getBoundingClientRect().bottom : 0);
      app.style.setProperty('--lab-card-top', Math.ceil(headerBottom + (h < 650 ? 8 : 12)) + 'px');
    }
    if (left && !left.classList.contains('is-collapsed')) {
      const heading = left.querySelector('.lab-panel-heading');
      const content = left.querySelector('.lab-panel-content');
      const available = Math.max(180, h - left.getBoundingClientRect().top - 18);
      const needed = (heading ? heading.scrollHeight : 0) + (content ? content.scrollHeight : 0) + 38;
      const compact = needed > available;
      document.body.dataset.panelCompact = String(compact);
      if (compact && !panelWasCompact) {
        const list = left.querySelector('.lab-reagent-list');
        if (list) list.scrollTop = 0;
      }
      panelWasCompact = compact;
    } else {
      document.body.dataset.panelCompact = 'false';
      panelWasCompact = false;
    }
    if (dock && !dock.classList.contains('observation-live-dock')) {
      const topOffset = dock.getBoundingClientRect().top || 86;
      dock.style.maxHeight = Math.max(100, h - topOffset - 12) + 'px';
    }
    const inspection = !!state?.particleInspection && state.screen === 'lab' && document.querySelector('.particle-lens-window');
    const frameSize = innerWidth + 'x' + innerHeight;
    if (inspection) {
      window.MebiParticleInspection.positionWindow(state);
      if (!particleFramingSnapshot) particleFramingSnapshot = {position:camera.position.clone(),target:controls.target.clone(),fov:camera.fov,view:activeView,close:closeView};
      if (particleFramingSize !== frameSize) {
        particleFramingSize = frameSize;
        centerBeakers();
      }
    } else if (particleFramingSnapshot) {
      const previous = particleFramingSnapshot;
      particleFramingSnapshot = null;particleFramingSize = '';
      activeView = previous.view;closeView = previous.close;
      if(state)state.labView = previous.view;
      moveCamera(previous.position,previous.target,1,previous.fov);
    }
    updateCameraTools();
  }

  function moveCamera(position, target = focus, duration = 650, fov = 40) {
    stopCameraInertia();
    zoomMotion = null;
    cameraTransition = { from: camera.position.clone(), to: position.clone(),
      targetFrom: controls.target.clone(), targetTo: target.clone(), fromFov: camera.fov, toFov: fov,
      started: performance.now(), duration };
  }

  function setView(view, duration = 650) {
    activeView = Object.prototype.hasOwnProperty.call(viewFov, view) ? view : 'desk';
    closeView = activeView === 'closeup';
    const position = activeView === 'wide' ? roomView : activeView === 'closeup' ? closeViewPosition : home;
    const target = activeView === 'wide' ? roomFocus : activeView === 'closeup' ? closeViewFocus : focus;
    moveCamera(position, target, reducedMotion.matches ? 1 : duration, viewFov[activeView]);
  }

  function sync(nextState, nextDispatch) {
    const wasInLab = state && (state.screen === 'lab' || state.screen === 'pool');
    state = nextState;
    dispatch = nextDispatch;
    if (!state.particleInspection) particleLoadError=false;
    if (particleLayer) particleLayer.sync(state);
    if (state.particleInspection) ensureParticleLayer();
    setLaboratoryLighting(state.labLighting || 'light');
    setTableColor(state.tableColor || '#3d4547');
    const experiment = window.MebiExperiment.get(state);
    if (drag && (state.screen !== 'lab' || state.labStep !== 'ready' || experiment.run !== motionRun || experiment.safetyOpen || experiment.mode !== 'manual')) {
      const oldDrag = drag; drag = null;
      if (oldDrag.capture.hasPointerCapture(oldDrag.pointerId)) oldDrag.capture.releasePointerCapture(oldDrag.pointerId);
    }
    const inLab = state.screen === 'lab' || state.screen === 'pool';
    mainNameplate.group.visible = false;
    secondaryNameplate.group.visible = false;
    document.body.dataset.labScreen = state.screen;
    const predictionStage = state.screen === 'pool' || (state.screen === 'lab' && state.labStep === 'predict');
    document.body.dataset.predictionStage = String(predictionStage);
    if (state.screen !== 'lab' && experiment.mode !== 'idle') window.MebiExperiment.park(state);
    host.inert = experiment.safetyOpen;
    host.style.pointerEvents = inLab && !experiment.safetyOpen ? 'auto' : 'none';
    controls.enabled = inLab && experiment.mode === 'idle' && !experiment.safetyOpen;
    overlay = document.querySelector('.bench-stage');
    mainLabel = document.getElementById('mainVessel');
    secondaryLabel = document.getElementById('dragReagentWrap');
    thermo = document.getElementById('digitalThermoWrap'); if (thermo) thermo.style.display = 'none';
    dragButton = null;
    handGuide = null;
    if (overlay && thermo) overlay.appendChild(thermo);
    if (inLab) {
      document.querySelectorAll('[data-lab-view]').forEach(button => {
        button.addEventListener('click', () => {
          const view = button.dataset.labView;
          if (view === 'close') {
            setView(activeView === 'closeup' ? 'desk' : 'closeup');
            button.setAttribute('aria-pressed', String(activeView === 'closeup'));
          } else if (view === 'general') {
            setView('wide');
          } else {
            setView('desk');
          }
        });
      });
      if (state.labStep === 'ready') {
        dragButton = document.createElement('button');
        dragButton.className = 'lab-beaker-target';
        dragButton.type = 'button';
        dragButton.setAttribute('aria-label', 'İkinci beheri sola sürükleyerek dök');
        dragButton.addEventListener('pointerdown', event => beginDrag(event, true));
        dragButton.addEventListener('lostpointercapture', event => { if (drag) endDrag(event); });
        dragButton.addEventListener('click', event => {
          if (event.detail === 0 && state.labStep === 'ready') dispatch('triggerPour');
        });
        overlay.appendChild(dragButton);
        const originalGuide = document.querySelector('.hand-guide-pill');
        if (originalGuide) {
          handGuide = document.createElement('div');
          handGuide.className = 'lab-hand-guide';
          handGuide.innerHTML = originalGuide.innerHTML;
          overlay.appendChild(handGuide);
        }
      }
    }
    if (!hasPlayedIntro) {
      hasPlayedIntro = true;
      camera.position.copy(roomView);
      controls.target.copy(roomFocus);
      camera.fov = viewFov.wide;
      camera.updateProjectionMatrix();
      controls.update();
      activeView = 'wide';
    }
    [state.selectedSlot1, state.selectedSlot2].forEach((id, index) => {
      const filling = fillStreams[index];
      if (id !== filling.id) { filling.id = id; filling.started = performance.now(); }
    });
    const pair = state.selectedSlot1 + '|' + state.selectedSlot2;
    if (pair !== lastPair || motionRun !== experiment.run) {
      motionRun = experiment.run; motionAt = performance.now(); previousFlow = 0;
      lastPair = pair;
      main.group.position.set(-0.4, tableY, 0.48);
      secondary.group.position.copy(secondaryHome);
      secondary.group.rotation.set(0, 0, 0);
      main.level = 0.42;
      secondary.level = 0.52;
    }
    if (state.labStep !== lastStep) {
      if (state.labStep === 'reacting') reactionStarted = performance.now();
      if (state.labStep === 'predict' || state.labStep === 'ready') {
        secondary.group.position.copy(secondaryHome);
        secondary.group.rotation.set(0, 0, 0);
        main.level = 0.42; secondary.level = 0.52;
        if (streamMesh) streamMesh.visible = false;
        if (splashRings) splashRings.forEach(r => { r.visible = false; });
      }
      lastStep = state.labStep;
    }
    setTemperature(state.currentTemp);
    renderer.shadowMap.needsUpdate = true;
    resize();
    renderFrame();
  }

  function pointerRay(event) {
    pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
    // View offsets are included by the projection matrix used by Raycaster.
    raycaster.setFromCamera(pointer, camera);
  }

  function beginDrag(event, force = false) {
    if (!state || state.screen !== 'lab' || state.labStep !== 'ready' || event.button > 0) return;
    const experiment = window.MebiExperiment.get(state);
    if (experiment.mode !== 'idle' || experiment.transfer >= 1) return;
    pointerRay(event);
    if (!force && !raycaster.intersectObject(secondary.group, true).length) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (!experiment.safetyAccepted) { dispatch('requestManualPour'); return; }
    if (!window.MebiExperiment.startManual(state)) return;
    cameraTransition = null; controls.enabled = false;
    const from = screenPoint(secondaryHome), to = screenPoint(main.group.position);
    drag = { startX:event.clientX, pointerId:event.pointerId, capture:event.currentTarget,
      travel:Math.max(110, Math.min(300, Math.abs(from.x - to.x) * 1.05)) };
    drag.capture.setPointerCapture(event.pointerId);
    if (window.MebiAudio) window.MebiAudio.playClick();
  }

  function dragMove(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    // Scrub the original automatic timeline. Rewinding changes the vessel pose,
    // while already transferred matter stays in the receiving beaker.
    window.MebiExperiment.scrub(state, (drag.startX - event.clientX) / drag.travel * 0.80);
  }

  function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const active = drag; drag = null;
    if (active.capture.hasPointerCapture(event.pointerId)) active.capture.releasePointerCapture(event.pointerId);
    window.MebiExperiment.release(state);
    controls.enabled = false;
  }

  renderer.domElement.addEventListener('pointerdown', event => beginDrag(event), true);
  window.addEventListener('pointermove', dragMove);
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  window.addEventListener('blur', () => { if (drag) endDrag({ pointerId:drag.pointerId }); });

  function screenPoint(point) {
    projection.copy(point).project(camera);
    return { x: (projection.x + 1) * window.innerWidth / 2, y: (1 - projection.y) * window.innerHeight / 2 };
  }

  function place(element, point, dy = 0) {
    if (!element) return;
    const p = screenPoint(point);
    element.style.left = p.x.toFixed(1) + 'px';
    element.style.top = (p.y + dy).toFixed(1) + 'px';
  }

  function updateOverlays() {
    if (!state || (state.screen !== 'lab' && state.screen !== 'pool')) return;
    const mainPoint = screenPoint(main.group.position);
    const secondaryPoint = screenPoint(secondaryHome);
    const labelWidth = Math.min(window.innerWidth <= 1100 ? 176 : 210, Math.max(90, Math.abs(secondaryPoint.x - mainPoint.x) - 18));
    if (mainLabel) mainLabel.style.width = labelWidth + 'px';
    if (secondaryLabel) secondaryLabel.style.width = labelWidth + 'px';
    place(mainLabel, main.group.position.clone().add(new THREE.Vector3(0, 0.025, 0.22)), -2);
    place(secondaryLabel, secondaryHome.clone().add(new THREE.Vector3(0, 0.025, 0.22)), -2);
    // 3D dijital termometre artık beherin kenarına doğrudan 3B olarak monte edilmiştir.
    if (dragButton) {
      const top = screenPoint(secondary.group.position.clone().add(new THREE.Vector3(0, secondary.height * beakerScale, 0)));
      const base = screenPoint(secondary.group.position);
      const edge = screenPoint(secondary.group.position.clone().add(new THREE.Vector3(secondary.radius * beakerScale, 0, 0)));
      const width = Math.max(54, Math.abs(edge.x - base.x) * 2.3);
      Object.assign(dragButton.style, { left: (base.x - width / 2) + 'px', top: (top.y - 8) + 'px',
        width: width + 'px', height: Math.max(50, base.y - top.y + 18) + 'px' });
      place(handGuide, secondary.group.position.clone().add(new THREE.Vector3(0, secondary.height * beakerScale, 0)), -18);
      const moving = window.MebiExperiment.get(state).mode !== 'idle';
      dragButton.style.visibility = moving && !drag ? 'hidden' : 'visible';
      if (handGuide) handGuide.style.visibility = moving || state.experiment.transfer >= 1 ? 'hidden' : 'visible';
    }

  }

  function setVesselContents(vessel, liquid, powder, color, opacity, angle = 0) {
    vessel.liquid.visible = liquid > 0.005;
    vessel.surface.visible = liquid > 0.005 && angle < 0.05;
    vessel.powder.visible = vessel.grains.visible = powder > 0.005;
    const positions = vessel.liquid.geometry.attributes.position;
    const floor = vessel.floor + 0.002;
    const slope = Math.tan(angle);
    let plane = liquid;
    if (angle > 0.01 && liquid > 0) {
      const radius = vessel.innerRadius - 0.002, height = vessel.rimHeight - floor - 0.018;
      const samples = vessel.volumeSamples || (vessel.volumeSamples = Array.from({length:64}, (_, i) => Math.sqrt((i + .5) / 64) * Math.cos(i * 2.399963) * radius));
      let low = -radius * Math.abs(slope), high = height + radius * Math.abs(slope);
      for (let i = 0; i < 17; i++) {
        const mid = (low + high) / 2;
        const average = samples.reduce((sum, x) => sum + THREE.MathUtils.clamp(mid - x * slope, 0, height), 0) / samples.length;
        if (average < liquid) low = mid; else high = mid;
      }
      plane = (low + high) / 2;
    }
    for (let vertex = 0; vertex < positions.count; vertex++) {
      const baseY = vessel.liquidBaseY[vertex];
      const y = baseY > 0.45
        ? floor + THREE.MathUtils.clamp(plane - positions.getX(vertex) * slope, 0.002, vessel.rimHeight - floor - 0.018)
        : floor;
      positions.setY(vertex, y);
    }
    positions.needsUpdate = true;
    vessel.liquid.geometry.computeVertexNormals();
    vessel.liquid.geometry.computeBoundingSphere();
    vessel.liquid.position.y = 0;
    vessel.liquid.scale.y = 1;
    vessel.surface.position.y = floor + liquid;
    vessel.surface.rotation.z = -angle;
    vessel.powderMotion.update(powder, angle);
    vessel.liquid.material.color.set(color);
    vessel.liquid.material.opacity = opacity;
    vessel.surface.material.color.set(color);
    vessel.powder.material.color.set(color);
    vessel.grains.material.color.set(color);
  }

  function updateContents(vessel, reagent, level, angle = 0) {
    const visual = window.MebiChemistry.appearance(reagent);
    setVesselContents(vessel, reagent && !reagent.solid ? level : 0,
      reagent && reagent.solid ? level : 0, visual.color, visual.opacity, angle);
  }

  function updateFilling(vessel, reagent, index, time) {
    const filling = fillStreams[index];
    const elapsed = performance.now() - filling.started;
    const duration = reducedMotion.matches ? 1 : 750;
    const p = Math.min(1, elapsed / duration);
    const active = !!reagent && p < 1 && state && state.screen === 'pool';
    // Selection fills emerge inside the vessel from the base upward.
    filling.flow.visible = false;
    filling.grains.visible = false;
    return active ? p : 1;
  }

  function updateExperiment(time) {
    const r1 = window.MebiData.getReagent(state && state.selectedSlot1);
    const r2 = window.MebiData.getReagent(state && state.selectedSlot2);
    const rx = state && state.activeReaction;
    const step = state ? state.labStep : 'predict';
    const reacting = !!rx && (step === 'reacting' || step === 'observed');
    const experiment = state ? window.MebiExperiment.get(state) : null;
    const now = performance.now(), dt = Math.min(.10, Math.max(0, (now - motionAt) / 1000)); motionAt = now;
    if (experiment && state.screen === 'lab' && (step === 'ready' || step === 'pouring')) {
      const complete = window.MebiExperiment.advance(state, document.hidden ? 0 : dt, reducedMotion.matches);
      if (experiment.flow > 0 && previousFlow === 0 && experiment.mode === 'manual' && window.MebiAudio) window.MebiAudio.playPour();
      previousFlow = experiment.flow;
      if (experiment.mode === 'idle' && !experiment.safetyOpen) controls.enabled = true;
      window.MebiExperiment.paint(state);
      if (complete && !completionQueued) {
        completionQueued = true;
        const run = experiment.run;
        setTimeout(() => {
          completionQueued = false;
          if (!state.experiment || state.experiment.run !== run) return;
          if (state.screen === 'lab') dispatch('finishPour');
          else state.experiment.completionNotified = false;
        }, 0);
      }
    }
    const pouring = !!experiment && experiment.mode !== 'idle' && state.screen === 'lab';
    const progress = pouring ? experiment.path : 0;
    const transfer = experiment ? experiment.transfer : (reacting ? 1 : 0);
    const reactionProgress = state?.particleInspection && state.particleReplayProgress != null ? state.particleReplayProgress : state?.explanationReview ? state.explanationReplayProgress || 0 : reacting ? THREE.MathUtils.clamp((performance.now() - reactionStarted) / 1200, 0, 1) : 0;
    const fill1 = updateFilling(main, r1, 0, time);
    const fill2 = updateFilling(secondary, r2, 1, time);
    const mlDepth = (vessel, ml) => ml * Math.pow(vessel.height / 6.68, 3) / (Math.PI * Math.pow(vessel.innerRadius - .002, 2));
    const amount = window.MebiExperiment.defaults.solutionMl;
    updateContents(main, r1, (r1 && r1.solid ? .42 * window.MebiExperiment.initialAmount(r1).solidGrams : mlDepth(main, amount)) * fill1);
    const pose = window.MebiExperiment.sample(progress, r2 && r2.solid);
    const lift = pose.lift, returnPhase = pose.returning, pourAngle = pouring ? pose.angle : 0;
    updateContents(secondary, r2, (r2 && r2.solid ? .52 * window.MebiExperiment.initialAmount(r2).solidGrams : mlDepth(secondary, amount)) * fill2 * (1 - transfer), pourAngle);
    const mix = window.MebiChemistry.mixture(r1, r2, rx, transfer, reactionProgress);
    if (state && r1 && r2) mix.liquid = mlDepth(main, window.MebiExperiment.quantities(state).volume);
    if (transfer > 0) {
      setVesselContents(main, mix.liquid, mix.powder, mix.color, mix.opacity);
      main.liquid.material.color.lerp(new THREE.Color(mix.targetColor), reactionProgress);
    }
    const transferring = pouring && experiment.flow > 0 && transfer < 1 && r2;
    streamMesh.visible = !!(transferring && !r2.solid);
    pourGrains.visible = !!(transferring && r2.solid);
    impactGrains.visible = pourGrains.visible;
    splashRings.forEach(ring => { ring.visible = false; });
    pourDrops.forEach(drop => { drop.visible = false; });
    main.surface.scale.set(1, 1, 1);
    main.surface.rotation.set(-Math.PI / 2, 0, 0);
    if (pouring && r2) {
      secondary.group.rotation.z = pourAngle;
      const spoutLocal = secondary.spoutPoint.clone();
      const spoutOffset = spoutLocal.clone().multiplyScalar(beakerScale)
        .applyAxisAngle(new THREE.Vector3(0, 0, 1), pourAngle);
      const restSpout = secondaryHome.clone().add(spoutLocal.clone().multiplyScalar(beakerScale));
      const targetSpout = main.group.position.clone().add(new THREE.Vector3(
        main.radius * beakerScale * 0.30,
        main.height * beakerScale + 0.18 * pourVisualScale, 0));
      let desiredSpout;
      if (progress < 0.22) {
        desiredSpout = restSpout.clone().lerp(targetSpout, lift);
        desiredSpout.y += Math.sin(lift * Math.PI) * 0.16 * pourVisualScale;
      } else if (progress < 0.80) {
        desiredSpout = targetSpout.clone();
      } else {
        desiredSpout = targetSpout.clone().lerp(restSpout, returnPhase);
        desiredSpout.y += Math.sin(returnPhase * Math.PI) * 0.12 * pourVisualScale;
      }
      secondary.group.position.copy(desiredSpout).sub(spoutOffset);
      const start = secondary.group.localToWorld(spoutLocal.clone());
      const end = main.group.position.clone();
      end.x += main.radius * beakerScale * 0.30;

      // Beher 1 içindeki anlık sıvı/katı yüzeyi (Dökme akışı yüzeye çarpar ve sıvı doldukça yükselir)
      let localSurfaceY = 0.07;
      if (mix && mix.liquid > 0.005) {
        localSurfaceY = main.floor + .002 + mix.liquid;
      } else if (mix && mix.powder > 0.005) {
        localSurfaceY = 0.065 + (mix.powder * 0.35);
      } else if (r1 && !r1.solid) {
        localSurfaceY = main.floor + .002 + mlDepth(main, amount) * fill1;
      } else if (r1 && r1.solid) {
        localSurfaceY = 0.065 + (0.42 * window.MebiExperiment.initialAmount(r1).solidGrams * fill1 * 0.35);
      }
      end.y = main.group.position.y + (localSurfaceY * beakerScale);
      end.z = main.group.position.z;

      const visual = window.MebiChemistry.appearance(r2);
      streamMaterial.color.set(visual.color);
      if (streamMesh.visible) {
        const direction = end.clone().sub(start);
        streamMesh.position.copy(start).add(end).multiplyScalar(0.5);
        streamMesh.scale.y = direction.length();
        streamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
        const positions = streamMesh.geometry.attributes.position;
        const strength = Math.sin(transfer * Math.PI) ** 0.4;
        for (let i = 0; i < positions.count; i++) {
          const x = streamBase[i * 3], y = streamBase[i * 3 + 1], z = streamBase[i * 3 + 2];
          const t = 0.5 - y;
          const taper = (0.45 + 0.55 * strength) * (1 - 0.25 * t);
          positions.setXYZ(i, x * taper + Math.sin(t * Math.PI) * 0.008 * pourVisualScale
            * Math.sin(progress * 65 + t * 8), y, z * taper);
        }
        positions.needsUpdate = true;
        streamMesh.geometry.computeVertexNormals();
        streamMesh.geometry.computeBoundingSphere();
      }
      const active = !r2.solid && transferring;
      splashRings.forEach((ring, index) => {
        ring.visible = active;
        if (!active) return;
        const phase = (progress * 12 + index / 3) % 1;
        ring.position.copy(end).add(new THREE.Vector3(0, 0.003 * pourVisualScale, 0));
        ring.scale.setScalar(0.3 + phase * 3.2);
        ring.material.opacity = (1 - phase) * 0.32;
      });
      pourDrops.forEach((drop, index) => {
        drop.visible = !r2.solid && transferring && progress > 0.765;
        if (!drop.visible) return;
        const t = THREE.MathUtils.clamp((progress - 0.765 - index * 0.009) / 0.035, 0, 1);
        drop.position.copy(targetSpout).lerp(end, t * t);
        drop.scale.set(1, 1.5, 1);
        drop.visible = t > 0 && t < 1;
      });
      if (active) main.surface.rotation.set(-Math.PI / 2 + 0.006 * Math.sin(progress * 95),
        0, 0.008 * Math.cos(progress * 80));
      const fallingGrains = Math.round(35 + (powderStreamCount - 35) * Math.min(1, experiment.flow / .5));
      pourGrains.count = fallingGrains;
      for (let i = 0; i < fallingGrains; i++) {
        const fall = (time * (2.6 + i % 5 * .13) + i / fallingGrains) % 1;
        dummy.position.set(THREE.MathUtils.lerp(start.x, end.x, fall),THREE.MathUtils.lerp(start.y, end.y, fall * fall),THREE.MathUtils.lerp(start.z,end.z,fall));
        dummy.position.x += Math.sin(i * 5.1 + time * 4) * (0.002 + .007 * fall);
        dummy.position.z += Math.cos(i * 3.3) * (0.002 + .005 * fall);
        dummy.rotation.set(time * 3 + i, time * 2 + i * 0.4, i);
        dummy.scale.setScalar(0.55 + i % 4 * 0.18); dummy.updateMatrix(); pourGrains.setMatrixAt(i, dummy.matrix);
      }
      pourGrains.instanceMatrix.needsUpdate = true;
      pourGrains.material.color.set(visual.color);
      for (let i = 0; i < 24; i++) {
        const phase = (time * 1.6 + i / 24) % 1;
        const angle = i * 2.39996;
        const radius = phase * 0.045;
        dummy.position.copy(end).add(new THREE.Vector3(Math.cos(angle) * radius, 0.012 + Math.sin(phase * Math.PI) * 0.02, Math.sin(angle) * radius));
        dummy.rotation.set(i, phase * 4, time);
        dummy.scale.setScalar((1 - phase) * 0.75); dummy.updateMatrix(); impactGrains.setMatrixAt(i, dummy.matrix);
      }
      impactGrains.instanceMatrix.needsUpdate = true;
      impactGrains.material.color.set(visual.color);
    } else if (!drag) {
      splashRings.forEach(ring => { ring.visible = false; });
      pourDrops.forEach(drop => { drop.visible = false; });
      if (streamMesh) streamMesh.visible = false;
      pourGrains.visible = false;
      impactGrains.visible = false;
      main.surface.scale.set(1, 1, 1);
      secondary.group.position.lerp(secondaryHome, 0.12);
      secondary.group.rotation.z *= 0.82;
    }
    const gas = reacting && mix.gas;
    const precipitate = reacting && mix.precipitate;
    bubbles.visible = gas;
    gasSurfaceRings.forEach(ring => { ring.visible = gas; });
    foam.visible = false; // No detergent is present: show bubbles, not stable soap foam.
    flakes.visible = main.sediment.visible = precipitate;
    const liquidHeight = main.floor + .002 + mix.liquid;
    if (gas) {
      foam.position.y = liquidHeight + 0.006;
      for (let i = 0; i < bubbleCount; i++) {
        const phase = (time * (step === 'observed' ? 0.34 : 0.72) + i * 0.137) % 1;
        const a = i * 2.39996;
        const bubbleScale = 0.34 + phase * 0.92 + (i % 4) * 0.10;
        const safeRadius = Math.max(0.05, main.radius - 0.055 - 0.025 * bubbleScale);
        const radialSeed = Math.sqrt((((i * 29) % bubbleCount) + 0.5) / bubbleCount);
        const r = radialSeed * safeRadius;
        const wobble = Math.sin(time * (2.8 + i % 3 * 0.35) + i * 1.7) * 0.008 * phase;
        const verticalSpan = Math.max(0.02, liquidHeight - 0.145);
        dummy.position.set(Math.cos(a) * r + wobble, 0.105 + phase * verticalSpan, Math.sin(a) * r + wobble * 0.55);
        dummy.scale.setScalar(bubbleScale);
        dummy.updateMatrix(); bubbles.setMatrixAt(i, dummy.matrix);
      }
      bubbles.instanceMatrix.needsUpdate = true;
      gasSurfaceRings.forEach((ring, index) => {
        const phase = (time * (step === 'observed' ? 0.30 : 0.62) + index / gasSurfaceRings.length) % 1;
        const angle = index * 2.39996;
        const radial = 0.045 + (index % 3) * 0.052;
        ring.position.set(Math.cos(angle) * radial, liquidHeight + 0.005 + index * 0.0004, Math.sin(angle) * radial);
        ring.scale.setScalar(0.35 + phase * 1.75);
        ring.material.opacity = Math.sin(phase * Math.PI) * 0.42;
      });
    } else {
      gasSurfaceRings.forEach(ring => { ring.visible = false; ring.material.opacity = 0; });
    }
    if (precipitate) {
      const color = rx.precipColor || '#ffffff';
      flakes.material.color.set(color);
      main.sediment.material.color.set(color);
      const settled = state?.particleInspection && state.particleReplayProgress != null ? THREE.MathUtils.clamp(state.particleReplayProgress*2,0.05,1) : state?.explanationReview ? THREE.MathUtils.clamp(state.explanationReplayProgress*2,0.05,1) : THREE.MathUtils.clamp((performance.now() - reactionStarted) / 1800, 0.05, 1);
      main.sediment.scale.y = 0.08 * settled;
      main.sediment.position.y = 0.065 + 0.04 * settled;
      const maxY = Math.max(0.12, liquidHeight - 0.045);
      const minY = 0.088 + 0.035 * settled;
      for (let i = 0; i < 80; i++) {
        const phase = (time * 0.22 + i * 0.117) % 1;
        const angle = i * 2.39996;
        const flakeScale = 0.55 + (i % 3) * 0.12;
        const safeRadius = Math.max(0.025, (main.radius - 0.085) * (0.8 + 0.2 * (1 - settled)));
        const r = Math.sqrt((i + 0.5) / 80) * safeRadius;
        const fallProgress = (1 - phase) * (1 - settled * 0.75);
        const yPos = minY + fallProgress * (maxY - minY);
        dummy.position.set(Math.cos(angle) * r, yPos, Math.sin(angle) * r);
        dummy.scale.setScalar(flakeScale);
        dummy.updateMatrix(); flakes.setMatrixAt(i, dummy.matrix);
      }
      flakes.instanceMatrix.needsUpdate = true;
    }
  }

  function renderFrame() {
    const time = clock.getElapsedTime();
    if (cameraTransition) {
      const t = reducedMotion.matches ? 1 : Math.min(1, (performance.now() - cameraTransition.started) / cameraTransition.duration);
      const eased = t * t * (3 - 2 * t);
      camera.position.lerpVectors(cameraTransition.from, cameraTransition.to, eased);
      controls.target.lerpVectors(cameraTransition.targetFrom, cameraTransition.targetTo, eased);
      camera.fov = THREE.MathUtils.lerp(cameraTransition.fromFov, cameraTransition.toFov, eased);
      camera.updateProjectionMatrix();
      if (t === 1) cameraTransition = null;
    }
    if (zoomMotion) {
      const now = performance.now(), offset = camera.position.clone().sub(controls.target), distance = offset.length();
      const desired = THREE.MathUtils.clamp(zoomMotion.distance,controls.minDistance,controls.maxDistance);
      const next = reducedMotion.matches ? desired : THREE.MathUtils.lerp(distance,desired,1-Math.exp(-Math.min(120,now-zoomMotion.at)/65));
      zoomMotion.at = now;
      offset.setLength(Math.abs(next-desired)<.00001 ? desired : next);
      camera.position.copy(controls.target).add(offset);
      if (Math.abs(next-desired)<.00001) zoomMotion = null;
    }
    controls.update();
    const cameraFloor = tableY + .008;
    if ((!state || !state.particleInspection) && controls.minDistance < 1.1) controls.minDistance = Math.min(1.1,camera.position.distanceTo(controls.target));
    // A dolly ends at the room boundary instead of chasing an unreachable target.
    if (zoomMotion && (camera.position.x < cameraBounds.min.x || camera.position.x > cameraBounds.max.x || camera.position.y < cameraFloor || camera.position.y > cameraBounds.max.y || camera.position.z < cameraBounds.min.z || camera.position.z > cameraBounds.max.z)) zoomMotion = null;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, cameraBounds.min.x, cameraBounds.max.x);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, cameraFloor, cameraBounds.max.y);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, cameraBounds.min.z, cameraBounds.max.z);
    camera.lookAt(controls.target);
    camera.updateMatrixWorld();
    const recordedState = state;
    thermometer.visible = true;
    if (recordedState?.explanationReview) {
      const replay=recordedState.explanationReview,now=performance.now();
      const delta=replay.frameAt==null?0:Math.min(.1,Math.max(0,(now-replay.frameAt)/1000));replay.frameAt=now;
      state=window.MebiExperiment.replayState(recordedState,document.hidden?0:delta);
      window.MebiExperiment.paint(state);setTemperature(state.currentTemp);
      const label=document.getElementById('explanationReplayStatus');
      if(label)label.textContent=replay.elapsed>=9?'Tekrar tamamlandı. Karışımın son durumunu inceleyebilirsin.':replay.elapsed<5?'Deney yeniden oynatılıyor · Maddeler karıştırılıyor…':'Deney yeniden oynatılıyor · Değişimleri gözle…';
    } else if (particleLayer) state = particleLayer.displayState(recordedState);
    const displayState = state;
    updateExperiment(time);
    state = recordedState;
    if (particleLayer) particleLayer.update(recordedState,displayState);
    renderer.render(scene, camera);
    updateOverlays();
  }

  function animate() {
    frame = requestAnimationFrame(animate);
    const now = performance.now();
    if (state && state.screen !== 'lab' && state.screen !== 'pool' && now - lastFrameAt < 100) return;
    lastFrameAt = now;
    renderFrame();
  }

  function resume() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (!document.hidden) animate();
  }

  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    cancelAnimationFrame(frame); frame = 0;
    document.body.classList.remove('lab-3d-active');
    window.LabScene.available = false;
    host.style.visibility = 'hidden';
    if (window.TepkimeArenasi) window.TepkimeArenasi.render(false);
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    host.style.visibility = '';
    window.LabScene.available = true;
    document.body.classList.add('lab-3d-active');
    if (window.TepkimeArenasi) window.TepkimeArenasi.render(false);
    resume();
  });
  window.addEventListener('resize', () => requestAnimationFrame(resize));
  // User input takes priority over a preset-camera transition.
  controls.addEventListener('start', () => { cameraTransition = null; zoomMotion = null; });
  document.addEventListener('visibilitychange', resume);
  window.LabScene = {
    available: true,
    handlesTransfer: true,
    // Read-only scene values also allow the shared trajectory to be verified.
    getTransferPose: () => ({ path:state && state.experiment ? state.experiment.path : 0, angle:secondary.group.rotation.z, position:secondary.group.position.toArray(), home:secondaryHome.toArray(), screen:screenPoint(secondary.group.position.clone().add(new THREE.Vector3(0,.20,0))), powder:secondary.powderMotion.summary, powderFlow:pourGrains.visible, spout:secondary.group.localToWorld(secondary.spoutPoint.clone()).toArray() }),
    sync,
    refreshLayout,
    getCameraState: () => ({position:camera.position.toArray(),target:controls.target.toArray(),projection:camera.projectionMatrix.toArray(),fov:camera.fov,view:activeView,near:camera.near,minDistance:controls.minDistance,zoomToCursor:controls.zoomToCursor,thermometerVisible:thermometer.visible}),
    getCameraFraming: () => ({...cameraFraming,beakers:[projectedBounds(vesselCorners(main)),projectedBounds(vesselCorners(secondary))]}),
    getParticleState: () => particleLayer && particleLayer.enabled ? particleLayer.getSummary() : null,
    pickParticleLens: (x,y) => particleLayer?.pickLens(x,y) || null,
    moveParticleLens: (x,y,index) => particleLayer?.moveLens(x,y,index) || false,
    selectParticleLens: (x,y) => particleLayer?.selectLens(x,y),
    getReplayState: () => {
      if(!state?.explanationReview)return null;
      const display=window.MebiExperiment.replayState(state,0);
      return {elapsed:state.explanationReview.elapsed,transfer:display.experiment.transfer,path:display.experiment.path,temperature:display.currentTemp,quantities:window.MebiExperiment.quantities(display),finished:state.explanationReview.elapsed>=9};
    },
    setTemperature,
    setView,
    setLighting: setLaboratoryLighting,
    setTableColor
  };
  document.body.classList.add('lab-3d-active');
  resize();
  setTemperature(22);
  if (window.TepkimeArenasi) sync(window.TepkimeArenasi.state, window.TepkimeArenasi.dispatch);
  animate();
  requestAnimationFrame(() => {
    requestAnimationFrame(dismissLabLoader);
  });
  setTimeout(dismissLabLoader, 2500);
}
