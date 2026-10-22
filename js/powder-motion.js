import * as THREE from './vendor/three/three.module.js?v=910bef9ae690';

// A granular bed clipped by the vessel and gravity, with a small repose offset.
// It is a visual model, rather than a powder-density or particle-dynamics solver.
export function createPowderMotion(vessel) {
  const radius = vessel.innerRadius - .008, floor = vessel.floor + .004;
  const height = vessel.rimHeight - floor - .012;
  const sectors = 64, rings = 18, layerSize = (rings + 1) * (sectors + 1);
  const points = [], indices = [], colors = [];
  for (let k = 0; k <= rings; k++) for (let j = 0; j <= sectors; j++) {
    const r = radius * k / rings, a = j / sectors * Math.PI * 2;
    points.push({x:r * Math.cos(a), z:r * Math.sin(a)});
  }
  for (let side = 0; side < 2; side++) for (let k = 0; k < rings; k++) for (let j = 0; j < sectors; j++) {
    const a = side * layerSize + k * (sectors + 1) + j, b = a + 1, c = a + sectors + 1, d = c + 1;
    if (side) indices.push(a,b,c,b,d,c); else indices.push(a,c,b,b,c,d);
  }
  for (let j = 0; j < sectors; j++) {
    const a = rings * (sectors + 1) + j, b = a + 1;
    indices.push(a,b,a+layerSize,b,b+layerSize,a+layerSize);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(layerSize * 6),3));
  for (let i = 0; i < layerSize * 2; i++) {
    const shade = .92 + .07 * ((Math.sin(i * 37.13) + 1) / 2);
    colors.push(shade,shade,shade);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  vessel.powder.geometry.dispose(); vessel.powder.geometry = geometry;
  vessel.powder.material.vertexColors = true; vessel.powder.material.side = THREE.DoubleSide;
  vessel.powder.material.needsUpdate = true;
  vessel.powder.position.set(0,0,0); vessel.powder.scale.set(1,1,1);
  vessel.group.remove(vessel.grains); vessel.grains.geometry.dispose(); vessel.grains.material.dispose();
  const grainSeeds = Array.from({length:950},(_,i)=>{
    const r = Math.sqrt((i + .5) / 950) * radius, a = i * 2.399963;
    return {x:r * Math.cos(a),z:r * Math.sin(a),p:(i * .6180339) % 1};
  });
  const grains = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.0055,0),new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.98}),grainSeeds.length);
  grains.name = 'moving-powder-grains'; grains.frustumCulled = false;
  vessel.group.add(grains); vessel.grains = grains;
  const samples = Array.from({length:256},(_,i)=>{
    const r = Math.sqrt((i + .5) / 256) * radius, a = i * 2.399963;
    return {x:r * Math.cos(a),z:r * Math.sin(a)};
  });
  const dummy = new THREE.Object3D(), slideTarget=new THREE.Vector3();
  let previous = '', summary = {amount:0,centroid:{x:0,y:floor},lipMaterial:false};
  function update(amount, angle = 0) {
    amount = Math.max(0,amount);
    const key = amount.toFixed(5) + ':' + angle.toFixed(4);
    vessel.powder.visible = grains.visible = amount > .001;
    if (key === previous) return summary;
    previous = key;
    if (amount <= .001) { summary = {amount:0,centroid:{x:0,y:floor},lipMaterial:false}; return summary; }
    const effective = Math.max(0,angle - .12 * Math.min(1,angle / .35));
    const sine = Math.sin(effective), cosine = Math.cos(effective), depth = Math.min(height,amount * .35);
    const heapScale = .22 * Math.cbrt(Math.min(1,amount / .52));
    function heap(x,z) {
      const edge = Math.max(0,1 - Math.hypot(x,z) / radius);
      return Math.max(0,cosine) * (heapScale * Math.pow(edge,1.4) + .004 * Math.sin(x * 191 + z * 37) * edge);
    }
    function span(x,z,plane) {
      const limit = plane + heap(x,z) - sine * x;
      if (Math.abs(cosine) < .0001) return limit >= 0 ? [0,height] : [0,0];
      const cut = THREE.MathUtils.clamp(limit / cosine,0,height);
      return cosine > 0 ? [0,cut] : [cut,height];
    }
    let lo = -radius - height - heapScale, hi = radius + height + heapScale;
    for (let i = 0; i < 19; i++) {
      const mid = (lo + hi) / 2;
      const occupied = samples.reduce((sum,p)=>{const s=span(p.x,p.z,mid);return sum+s[1]-s[0];},0)/samples.length;
      if (occupied < depth) lo = mid; else hi = mid;
    }
    const plane = (lo + hi) / 2;
    // The upper left wall flares into the actual beaker spout.
    function flare(x,z,y) {
      const edge = Math.pow(Math.max(0,-x / radius),16) * Math.exp(-Math.pow(z / .11,2));
      const rise = THREE.MathUtils.smoothstep(y,vessel.rimHeight * .77,vessel.rimHeight * .98);
      return x - (Math.abs(vessel.spoutPoint.x) - radius - .006) * edge * rise;
    }
    // At a steep tilt, the remainder becomes a sparse granular slide, not a solid cap at the mouth.
    const loose=THREE.MathUtils.smoothstep(angle,1.30,1.60);
    vessel.powder.material.transparent=loose>0;vessel.powder.material.opacity=1-loose;
    vessel.powder.material.depthWrite=loose===0;vessel.powder.visible=amount>.001&&loose<.999;
    const position = geometry.attributes.position;
    points.forEach((p,i)=>{
      const s = span(p.x,p.z,plane);
      for (let side = 0; side < 2; side++) {
        const y = floor + s[side];
        position.setXYZ(i + side * layerSize,flare(p.x,p.z,y),y,p.z);
      }
    });
    position.needsUpdate = true; geometry.computeVertexNormals(); geometry.computeBoundingSphere();
    let visible = 0;
    grainSeeds.forEach((p,i)=>{
      const s = span(p.x,p.z,plane), thickness = s[1] - s[0];
      const remaining=Math.min(1,amount/.52);
      if(loose>.5 ? i>=Math.ceil(grainSeeds.length*remaining) : thickness<.003)return;
      const y = floor + (cosine > .15 ? s[1] : cosine < -.15 ? s[0] : s[0] + thickness * p.p);
      dummy.position.set(flare(p.x,p.z,y),y + .0015,p.z);
      if(loose>0){
        const slide=(i*.6180339)%1;
        const target=slideTarget.set(THREE.MathUtils.lerp(-radius*.68,vessel.spoutPoint.x+.008,slide),THREE.MathUtils.lerp(floor+height*.32,vessel.spoutPoint.y-.008,slide),p.z*(1-slide)*.40);
        dummy.position.lerp(target,loose);
      }
      dummy.rotation.set(i * .71,i * .37,i * .19);
      dummy.scale.setScalar(.55 + .7 * p.p); dummy.updateMatrix(); grains.setMatrixAt(visible++,dummy.matrix);
    });
    grains.count = visible; grains.instanceMatrix.needsUpdate = true;
    let weight = 0, cx = 0, cy = 0;
    samples.forEach(p=>{const s=span(p.x,p.z,plane),w=s[1]-s[0];weight+=w;cx+=p.x*w;cy+=(floor+(s[0]+s[1])/2)*w;});
    const lip = span(-radius,0,plane);
    summary = {amount:amount,bulkOpacity:1-loose,looseGrains:loose>0,visibleGrains:visible,centroid:{x:cx/Math.max(weight,.0001),y:cy/Math.max(weight,.0001)},lipMaterial:lip[1]>height-.025&&lip[1]-lip[0]>.002,meanDepth:weight/samples.length};
    return summary;
  }
  return { update, get summary() { return summary; } };
}
