const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const root=path.resolve(__dirname,'..'),THREE=await import(pathToFileURL(path.join(root,'js/vendor/three/three.module.js')).href),{createLiquidSurface}=await import(pathToFileURL(path.join(root,'js/liquid-surface.js')).href);
 const vessel={innerRadius:.4,surface:new THREE.Mesh(new THREE.CircleGeometry(.4,48),new THREE.MeshPhysicalMaterial({transparent:true,opacity:.24}))},surface=createLiquidSurface(vessel);
 let cases=0;
 for(const angle of[0,.25,.7,1.1,1.32])for(const plane of[.02,.2,.7,1.3]){
  const slope=Math.tan(angle),s=surface.update(plane,slope,.05,1,.24),p=vessel.surface.geometry.attributes.position;
  let min=Infinity,max=-Infinity;
  for(let i=0;i<s.vertices;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i);assert(Number.isFinite(x+y+z));assert(Math.hypot(x,z)<=.40001);assert(y>=.04999&&y<=1.05001);
   const worldHeight=x*Math.sin(angle)+y*Math.cos(angle);min=Math.min(min,worldHeight);max=Math.max(max,worldHeight);
  }
  if(s.vertices)assert(max-min<1e-6,'Free surface must remain level under beaker rotation');
  assert(s.vertices<=p.count);cases++;
 }
 console.log(JSON.stringify({passed:true,cases,checks:['level surface under tilt','vertices stay within beaker radius and height','valid empty clipped surfaces','buffer capacity']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
