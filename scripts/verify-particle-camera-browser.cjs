const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');let pw;try{pw=require('playwright')}catch{pw=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const root=path.resolve(__dirname,'..'),output=path.join(os.tmpdir(),'tepkime-beaker-particles-qa');fs.mkdirSync(output,{recursive:true});
(async()=>{let browser;const server=require('node:http').createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)||!/^\/(js|css|image)\/|^\/index.html$/.test(name)){res.writeHead(403);res.end();return}fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'});res.end(e?'Not found':b)})});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{browser=await pw.chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-webgl','--ignore-gpu-blocklist']});const page=await browser.newPage({viewport:{width:1366,height:768},hasTouch:true}),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));await page.addInitScript(()=>localStorage.setItem('mebi_hide_welcome_modal','true'));await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.LabScene?.available&&window.TepkimeArenasi);
const dispatch=(action,arg)=>page.evaluate(({action,arg})=>TepkimeArenasi.dispatch(action,arg),{action,arg}),state=()=>page.evaluate(()=>TepkimeArenasi.state),particles=()=>page.evaluate(()=>LabScene.getParticleState());
await dispatch('goPool');await dispatch('clickReagent','HCl');await dispatch('clickReagent','AgNO3');await page.waitForFunction(()=>!TepkimeArenasi.state.isFilling);await dispatch('startExperiment');assert.equal(await page.locator('.beaker-particle-entry').count(),0);assert(!requests.some(x=>x.includes('/beaker-particles.js')));await dispatch('autoFillPredictionForTesting');await dispatch('savePrediction');await dispatch('beginExperiment');await dispatch('triggerPour');await dispatch('toggleAllSafetyChecks');await dispatch('acceptExperimentSafety');await page.waitForFunction(()=>TepkimeArenasi.state.labStep==='observed',{timeout:20000});
await page.locator('.observation-open-hint').click();await page.waitForTimeout(400);await dispatch('autoFillObservationForTesting');await page.locator('[data-action="saveObservation"]').click();assert.equal(await page.locator('#observationCard [data-action="openParticleInspection"]').count(),2);


await page.locator('#observationCard [data-action="openParticleInspection"][data-arg="before"]').click();await page.waitForFunction(()=>LabScene.getParticleState()?.view==='before');await page.waitForTimeout(300);
const camera=()=>page.evaluate(()=>LabScene.getCameraState());
const records=()=>page.evaluate(()=>JSON.stringify([TepkimeArenasi.state.predictionRecord,TepkimeArenasi.state.observation.record,TepkimeArenasi.state.experiment]));
const originalRecords=await records(),originalBeakers=(await particles()).beakerUUIDs;
async function point(){
 const b=(await particles()).beakerBounds[0],p={x:(b.left+b.right)/2,y:(b.top+b.bottom)/2};
 assert(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName==='CANVAS',p),'A gesture over the beaker must reach the existing 3D canvas');return p;
}
async function orbit(){
 const p=await point(),from=await camera();await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+65,p.y+18,{steps:12});await page.mouse.up();await page.waitForTimeout(350);
 assert.notDeepEqual((await camera()).position,from.position,'Dragging must rotate the camera');
}
await orbit();
let before=await camera();const distance=c=>Math.hypot(...c.position.map((v,i)=>v-c.target[i]));
let p=await point();await page.mouse.move(p.x,p.y);await page.mouse.wheel(0,130);await page.waitForTimeout(350);
assert(distance(await camera())>distance(before)+.02,'The mouse wheel must zoom out');
before=await camera();p=await point();await page.mouse.move(p.x,p.y);await page.mouse.down({button:'right'});await page.mouse.move(p.x+25,p.y+10,{steps:8});await page.mouse.up({button:'right'});await page.waitForTimeout(350);
assert.notDeepEqual((await camera()).target,before.target,'Right dragging must pan the view');
await page.locator('[data-action="openParticleInspection"][data-arg="reaction"]').click();await dispatch('seekParticleInspection',3);await page.waitForTimeout(200);await orbit();assert.equal((await particles()).time,3,'Camera movement must not seek or resume the reaction');
await page.setViewportSize({width:844,height:390});await dispatch('seekParticleInspection',8);await page.waitForTimeout(250);
const cdp=await page.context().newCDPSession(page);p=await point();before=await camera();
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1,radiusX:6,radiusY:6,force:1}]});
for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x+55*i/12,y:p.y+10*i/12,id:1,radiusX:6,radiusY:6,force:1}]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(350);
assert.notDeepEqual((await camera()).position,before.position,'A single-finger drag must rotate on mobile landscape');
await dispatch('toggleParticlePlayback');const at=(await particles()).time;await orbit();assert((await particles()).time>at,'Playback continues during camera gestures');
assert.deepEqual((await particles()).beakerUUIDs,originalBeakers);assert.equal(await records(),originalRecords);assert.equal(await page.locator('#labWorld canvas').count(),1);
await page.screenshot({path:path.join(output,'camera-mobile-landscape.png')});
assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,checks:['transparent legend overlay passes gestures to canvas','mouse orbit, wheel zoom and right-button pan','camera works during paused transfer and active playback','single-finger mobile landscape orbit','same original scene and beakers','prediction, observation and actual experiment records unchanged'],output}));
}finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}})().catch(e=>{console.error(e);process.exitCode=1});
