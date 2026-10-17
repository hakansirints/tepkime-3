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
const original=await records(),initial=await particles();
assert.equal((await camera()).thermometerVisible,false);assert((await camera()).near<.01);assert((await camera()).minDistance<.03);assert((await camera()).zoomToCursor);
assert.equal(initial.sourceNormal,false);assert.equal(initial.hiddenSourceAtoms,0);
await dispatch('openParticleInspection','reaction');
for(const time of[.5,2,3.5,4.5]){
 await dispatch('seekParticleInspection',time);await page.waitForFunction(t=>LabScene.getParticleState()?.time===t,time);
 const m=await particles();assert(m.sourceNormal);assert(m.vesselVisuals[1].opacity>.1,'Source liquid keeps its normal appearance');assert.equal(m.vesselVisuals[0].opacity,.065);if(time<=2)assert(m.hiddenSourceAtoms>0);assert.equal((await camera()).thermometerVisible,false);
 if(time===2)await page.screenshot({path:path.join(output,'detail-transfer.png')});
}
await dispatch('seekParticleInspection',16);await page.waitForFunction(()=>LabScene.getParticleState()?.time===16);let end=await particles();assert(!end.sourceNormal);assert.equal(end.hiddenSourceAtoms,0);assert(end.solidProducts>0);assert.equal(end.solidParticleScale,1.4);assert.equal(end.outsideVessel,0);assert.deepEqual(end.initialInventory,end.finalInventory);
await page.screenshot({path:path.join(output,'detail-precipitate.png')});
// Zoom along a fixed pointer ray aimed at the receiving beaker.
let entered=false;const bounds=(await particles()).beakerBounds[0],zoomX=(bounds.left+bounds.right)/2,zoomY=(bounds.top+bounds.bottom)/2;
for(let i=0;i<40;i++){
 const isCanvas=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName==='CANVAS',{x:zoomX,y:zoomY});
 assert(isCanvas,'Zoom target remains interactive');
 await page.mouse.move(zoomX,zoomY);await page.mouse.wheel(0,-400);await page.waitForTimeout(80);
 if((await particles()).cameraInBeakers[0]){entered=true;break}
}
if(!entered)console.log('Zoom failed',JSON.stringify(await camera()),JSON.stringify((await particles()).cameraInBeakers));
assert(entered,'A user can enter the receiving beaker using wheel zoom');assert.equal((await camera()).thermometerVisible,false);await page.screenshot({path:path.join(output,'detail-inside-beaker.png')});
await dispatch('toggleParticleNormal');await page.waitForFunction(()=>LabScene.getCameraState().thermometerVisible);assert.equal((await camera()).thermometerVisible,true);await dispatch('closeParticleInspection');assert.equal((await camera()).near,.1);assert.equal((await camera()).minDistance,1.1);assert.equal((await camera()).zoomToCursor,false);assert.equal((await camera()).thermometerVisible,true);assert.equal(await records(),original);
// A powder source must also remain macroscopic during transfer.
await page.evaluate(()=>{const s=TepkimeArenasi.state;s.selectedSlot1='HCl';s.selectedSlot2='NaHCO3';s.activeReaction=MebiData.getReaction(s.selectedSlot1,s.selectedSlot2);TepkimeArenasi.render(false)});await dispatch('openParticleInspection','reaction');await dispatch('seekParticleInspection',2);await page.waitForFunction(()=>LabScene.getParticleState()?.time===2);const powder=await particles();assert(powder.sourceNormal);assert(powder.vesselVisuals[1].powder);assert(powder.hiddenSourceAtoms>0);await page.screenshot({path:path.join(output,'detail-powder-transfer.png')});
assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,checks:['complete thermometer hidden only in particle view','ordinary wheel zoom enters original beaker','camera clipping and navigation limits restored on exit','source solution and powder remain macroscopic during transfer','receiver keeps particle view; transferred atoms reappear','larger precipitate retains exact atoms and stays in glass','saved records unchanged'],initial,end,output}));
}finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}})().catch(e=>{console.error(e);process.exitCode=1});
