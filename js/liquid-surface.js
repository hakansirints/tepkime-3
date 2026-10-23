import * as THREE from './vendor/three/three.module.js?v=f1bb324965c5';

// Clip the free surface to the tilted cylinder; keep it level in world space.
export function createLiquidSurface(vessel) {
  const radius=vessel.innerRadius-.002,segments=64;
  const positions=new Float32Array((segments+4)*9);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  vessel.surface.geometry.dispose();vessel.surface.geometry=geometry;
  vessel.surface.material=vessel.surface.material.clone();
  vessel.surface.material.roughness=.16;
  let key='',summary=null;
  function clip(points,bound,minimum){
    const out=[];
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length],inside=p=>minimum?p.x>=bound:p.x<=bound;
      if(inside(a))out.push(a);
      if(inside(a)!==inside(b)){const t=(bound-a.x)/(b.x-a.x);out.push({x:bound,z:a.z+(b.z-a.z)*t});}
    }
    return out;
  }
  function update(plane,slope,floor,height,opacity){
    vessel.surface.position.set(0,0,0);vessel.surface.rotation.set(0,0,0);
    vessel.surface.material.opacity=Math.max(.30,Math.min(.78,opacity+.12));
    const stamp=[plane,slope,floor,height].join('|');if(stamp===key)return summary;key=stamp;
    let polygon=Array.from({length:segments},(_,i)=>({x:Math.cos(i/segments*Math.PI*2)*radius,z:Math.sin(i/segments*Math.PI*2)*radius}));
    if(Math.abs(slope)>.00001){
      const cuts=[plane/slope,(plane-height)/slope].sort((a,b)=>a-b);
      polygon=clip(clip(polygon,cuts[0],true),cuts[1],false);
    }
    let vertices=0;
    if(polygon.length>=3){
      const center=polygon.reduce((c,p)=>({x:c.x+p.x/polygon.length,z:c.z+p.z/polygon.length}),{x:0,z:0});
      for(let i=0;i<polygon.length;i++)for(const p of[center,polygon[i],polygon[(i+1)%polygon.length]]){
        positions[vertices*3]=p.x;positions[vertices*3+1]=floor+THREE.MathUtils.clamp(plane-p.x*slope,0,height);positions[vertices*3+2]=p.z;vertices++;
      }
    }
    geometry.setDrawRange(0,vertices);geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
    summary={vertices,plane,slope,floor,height};return summary;
  }
  return {update,get summary(){return summary;}};
}
