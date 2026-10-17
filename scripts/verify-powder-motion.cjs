const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const root=path.resolve(__dirname,'..'),THREE=await import(pathToFileURL(path.join(root,'js/vendor/three/three.module.js')).href);
 const {createPowderMotion}=await import(pathToFileURL(path.join(root,'js/powder-motion.js')).href);
 const unit=1.1/6.68,group=new THREE.Group(),powder=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,1,32),new THREE.MeshStandardMaterial()),grains=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.02),new THREE.MeshStandardMaterial(),60);group.add(powder,grains);
 const vessel={group,powder,grains,innerRadius:2.47*unit,floor:.285*unit,rimHeight:6.585*unit,spoutPoint:new THREE.Vector3(-(2.615+.79)*unit,(6.635-.145+.005)*unit,0)};
 const model=createPowderMotion(vessel),initial=model.update(.52,0),side=model.update(.52,1.25),lip=model.update(.4,1.48),inverted=model.update(.2,1.85);
 assert(side.centroid.x<initial.centroid.x-.1,'The heap slides to the spout side as the vessel tilts');assert(lip.centroid.y>initial.centroid.y+.2,'Material climbs the receiving side wall toward the lip');assert(lip.lipMaterial,'At the start of transfer the granular bed reaches the lip');assert(inverted.centroid.y>lip.centroid.y,'Further inversion moves the remainder to the open rim');
 for(const angle of [0,.4,.8,1.25,1.48,1.57,1.7,1.95])for(const amount of [.52,.3,.05]){const s=model.update(amount,angle);assert(Math.abs(s.meanDepth-amount*.35)<.00003,'Visible bed volume is preserved');assert(Array.from(vessel.powder.geometry.attributes.position.array).every(Number.isFinite));}
 model.update(0,1.9);assert.equal(vessel.powder.visible,false);assert.equal(vessel.grains.visible,false);
 console.log(JSON.stringify({passed:true,initial:initial.centroid,side:side.centroid,lip:lip.centroid,inverted:inverted.centroid,checks:['heap slides toward spout','granules reach the lip before transfer','remaining solids approach open rim','bed volume preserved','no invalid vertices','empty vessel has no powder']}));
})().catch(e=>{console.error(e);process.exitCode=1;});
