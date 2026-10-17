/* Manual observation opening, recurring safety, responsive header and horizontal thermometer. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
let pw;try{pw=require('playwright');}catch{pw=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const root=path.resolve(__dirname,'..'),output=path.join(os.tmpdir(),'tepkime-controls-qa');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const server=require('node:http').createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)||name.includes('/.git')||name.includes('/yedekler/')){res.writeHead(403);res.end();return;}fs.readFile(file,(err,body)=>{res.writeHead(err?404:200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'});res.end(err?'Not found':body);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await pw.chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-webgl','--ignore-gpu-blocklist']});
  const page=await browser.newPage({viewport:{width:1366,height:768},hasTouch:true}),errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.addInitScript(()=>{localStorage.setItem('mebi_hide_welcome_modal','true');localStorage.setItem('mebi_hide_safety_warning','true');});
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.LabScene?.available&&window.TepkimeArenasi);
  const state=()=>page.evaluate(()=>TepkimeArenasi.state),camera=()=>page.evaluate(()=>LabScene.getCameraState());
  const dispatch=async(action,arg)=>page.evaluate(({action,arg})=>TepkimeArenasi.dispatch(action,arg),{action,arg});
  await dispatch('goPool');await dispatch('clickReagent','HCl');await dispatch('clickReagent','NaOH');await page.waitForFunction(()=>!TepkimeArenasi.state.isFilling);await dispatch('startExperiment');await dispatch('autoFillPredictionForTesting');await dispatch('savePrediction');await dispatch('beginExperiment');
  const initialThermometer=await page.locator('.experiment-thermometer').evaluate(el=>({value:Number(el.getAttribute('aria-valuenow')),maximum:Number(el.getAttribute('aria-valuemax')),width:parseFloat(el.querySelector('.experiment-amount-fill').style.width)}));assert(initialThermometer.width>0);assert(Math.abs(initialThermometer.width-initialThermometer.value/initialThermometer.maximum*100)<.01,'Ambient temperature already fills the thermometer from zero');
  await page.locator('[data-action="triggerPour"]').click();assert(await page.locator('#experimentSafetyAccept').isDisabled());
  assert.equal(await page.locator('[data-safety-control="dont-show"]').count(),0);assert.equal(await page.evaluate(()=>localStorage.getItem('mebi_hide_safety_warning')),null);
  for(const [width,height] of [[1366,768],[844,390],[667,375]]){
   await page.setViewportSize({width,height});
   for(const theme of ['light','dark']){await page.evaluate(theme=>MebiUI.applyTheme(theme),theme);await page.waitForTimeout(360);const dialog=await page.locator('.experiment-safety-card').boundingBox();assert(dialog.x>=0&&dialog.y>=0&&dialog.y+dialog.height<=height+1);assert(await page.locator('[data-action="cancelExperimentSafety"]').isVisible());await page.screenshot({path:path.join(output,`safety-${width}-${theme}.png`)});}
  }
  await page.keyboard.press('Escape');assert.equal(await page.locator('.experiment-safety-card').count(),0);assert.equal((await state()).experiment.transfer,0);
  await page.setViewportSize({width:1366,height:768});await page.evaluate(()=>MebiUI.applyTheme('light'));await page.locator('[data-action="triggerPour"]').click();
  for(let i=0;i<4;i++)await page.locator('[data-safety-control="item-'+i+'"]').click();assert(await page.locator('#experimentSafetyAccept').isEnabled());
  await page.locator('#experimentSafetyAccept').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.dataset.safetyControl),'check-all');
  await page.locator('#experimentSafetyAccept').click();assert(await page.locator('[data-action="navigateStage"][data-arg="0"]').isDisabled());
  await page.waitForFunction(()=>TepkimeArenasi.state.labStep==='reacting');const reactionStart=Date.now();await page.waitForTimeout(2400);assert.equal((await state()).labStep,'reacting');assert.equal(await page.locator('#observationCard').count(),0);
  await page.waitForFunction(()=>TepkimeArenasi.state.labStep==='observed');assert(Date.now()-reactionStart>=4000);
  const tile=await page.locator('#observationCard').boundingBox();assert.equal(tile.width,92);assert.equal(tile.height,92);
  await page.waitForTimeout(2000);assert(await page.locator('#observationCard.is-minimized.is-awaiting-observation').isVisible());assert(await page.locator('.observation-open-hint').isVisible());
  assert.equal(await page.locator('#observationCard').evaluate(el=>getComputedStyle(el).animationName),'observation-attention');
  await page.screenshot({path:path.join(output,'observation-invitation.png')});
  for(const [width,height] of [[1366,768],[844,390],[667,375]]){
   await page.setViewportSize({width,height});
   for(const theme of ['light','dark']){
    await page.evaluate(theme=>MebiUI.applyTheme(theme),theme);await page.waitForTimeout(380);
    assert(await page.locator('#observationCard.is-minimized').isVisible());const hint=await page.locator('.observation-open-hint').boundingBox();assert(hint.x>=0&&hint.y>=0&&hint.x+hint.width<=width&&hint.y+hint.height<=height);
    const thermometer=await page.locator('.experiment-thermometer').boundingBox();assert(thermometer.x>=0&&thermometer.x+thermometer.width<=width);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.screenshot({path:path.join(output,`invitation-${width}-${theme}.png`)});
   }
  }
  await page.setViewportSize({width:1366,height:768});await page.evaluate(()=>MebiUI.applyTheme('light'));await page.waitForTimeout(380);
  await page.locator('.observation-open-hint').click();assert(await page.locator('[data-floating-ghost]').count());await page.waitForTimeout(400);assert.equal(await page.locator('.observation-open-hint').count(),0);
  const full=await page.locator('#observationCard').boundingBox();assert(Math.abs(full.x-tile.x)<1&&Math.abs(full.y-tile.y)<1);
  await dispatch('autoFillObservationForTesting');const draft=JSON.stringify((await state()).observation);const fixedCamera=await camera();
  for(let i=0;i<2;i++){await page.locator('.observation-peek-toggle').click();await page.waitForTimeout(410);assert.deepEqual(await camera(),fixedCamera);assert(await page.locator('#benchDock .experiment-thermometer').isVisible());await page.locator('.observation-peek-toggle').click();await page.waitForTimeout(410);assert.deepEqual(await camera(),fixedCamera);}
  await page.locator('.floating-card-minimize').click();await page.waitForTimeout(410);let small=await page.locator('#observationCard').boundingBox();assert(Math.abs(small.x-full.x)<1&&Math.abs(small.y-full.y)<1);
  await page.mouse.move(small.x+24,small.y+70);await page.mouse.down();await page.mouse.move(small.x+144,small.y+120,{steps:8});await page.mouse.up();assert((await page.locator('#observationCard').boundingBox()).x>small.x+80);
  await page.locator('.floating-card-restore').click();await page.waitForTimeout(410);assert.equal(JSON.stringify((await state()).observation),draft);
  await page.locator('.floating-card-minimize').click();await page.waitForTimeout(410);small=await page.locator('#observationCard').boundingBox();assert(Math.abs(small.x-full.x)<1&&Math.abs(small.y-full.y)<1);await page.locator('.floating-card-restore').click();await page.waitForTimeout(410);
  await page.locator('.observation-peek-toggle').click();await page.waitForTimeout(410);assert(!/0[–-]100\s*°C/.test(await page.locator('.experiment-temperature').textContent()));assert.equal(await page.locator('[data-experiment-temperature-end]').textContent(),'Son '+(await state()).currentTemp.toLocaleString('tr-TR',{minimumFractionDigits:1,maximumFractionDigits:1})+' °C');
  const heating=await page.locator('.experiment-thermometer').evaluate(el=>({value:Number(el.getAttribute('aria-valuenow')),maximum:Number(el.getAttribute('aria-valuemax')),width:parseFloat(el.querySelector('.experiment-amount-fill').style.width),left:parseFloat(el.querySelector('.experiment-amount-fill').style.left)}));assert.equal(heating.left,0);assert(Math.abs(heating.width-heating.value/heating.maximum*100)<.01);
  await page.screenshot({path:path.join(output,'thermometer-heating.png')});
  await page.evaluate(()=>{TepkimeArenasi.state.currentTemp=18.5;MebiExperiment.paint(TepkimeArenasi.state);});const cooling=await page.locator('.experiment-thermometer').evaluate(el=>({start:parseFloat(el.style.getPropertyValue('--temperature-start')),current:parseFloat(el.style.getPropertyValue('--temperature-current')),width:parseFloat(el.querySelector('.experiment-amount-fill').style.width)}));assert(cooling.start>cooling.current);assert(cooling.width>0&&cooling.width<heating.width);await page.screenshot({path:path.join(output,'thermometer-cooling.png')});await page.evaluate(()=>{TepkimeArenasi.state.currentTemp=TepkimeArenasi.state.activeReaction.tempFinal;MebiExperiment.paint(TepkimeArenasi.state);});
  await page.locator('.observation-peek-toggle').click();await page.waitForTimeout(410);await dispatch('saveObservation');await dispatch('toCard');const records=await page.evaluate(()=>JSON.stringify([TepkimeArenasi.state.predictionRecord,TepkimeArenasi.state.observation]));
  await page.locator('[data-action="navigateStage"][data-arg="1"]').click();assert(await page.locator('#predictionReviewTitle').isVisible());assert.equal(await page.locator('[data-reason-key]').count(),0);await page.locator('[data-action="closeStageReview"]').click();assert.equal((await state()).screen,'card');
  await page.locator('[data-action="navigateStage"][data-arg="0"]').click();assert.equal(await page.locator('.reagent-gallery-card:disabled').count(),12);await page.locator('[data-action="closeStageReview"]').click();assert.equal(await page.evaluate(()=>JSON.stringify([TepkimeArenasi.state.predictionRecord,TepkimeArenasi.state.observation])),records);
  await dispatch('navigateStage','2');assert.equal((await state()).labStep,'observed');
  for(const [width,height] of [[1366,768],[844,390],[667,375]]){
   await page.setViewportSize({width,height});
   for(const compact of [true,false]){
    await page.evaluate(compact=>{TepkimeArenasi.state.headerCollapsed=compact;TepkimeArenasi.render(false);},compact);await page.waitForTimeout(180);
    if(compact)assert.equal(await page.locator('#stageMainHeader').isVisible(),false);const card=await page.locator('#observationCard').boundingBox();assert(card.y+card.height<=height+1,JSON.stringify({width,height,compact,card}));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.screenshot({path:path.join(output,`observation-${width}-${compact?'compact':'expanded'}.png`)});
   }
  }
  await page.setViewportSize({width:1366,height:768});await page.evaluate(()=>{TepkimeArenasi.state.headerCollapsed=false;TepkimeArenasi.render(false);});await page.waitForTimeout(180);assert(await page.locator('#stageMainHeader').isVisible());
  await page.locator('.mebi-stage-toggle').click();assert.equal((await state()).headerCollapsed,true);assert.equal(await page.locator('.mebi-stage-toggle svg polyline').getAttribute('points'),'6 9 12 15 18 9');await page.locator('.mebi-stage-toggle').click();assert(await page.locator('#stageMainHeader').isVisible());
  await page.setViewportSize({width:667,height:375});await page.waitForTimeout(180);assert(await page.locator('#stageMainHeader').isHidden(),'Shrinking a manually expanded header automatically collapses it');
  await page.locator('.floating-card-minimize').click();await page.waitForTimeout(410);await page.locator('.floating-card-grip').tap();await page.waitForTimeout(410);assert(await page.locator('#observationPanel').isVisible(),'A tap opens the tile');
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.floating-card-minimize').click();assert.equal(await page.locator('[data-floating-ghost]').count(),0);await page.locator('.floating-card-grip').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Escape');assert(await page.locator('#observationPanel').isVisible());
  await dispatch('restartExperiment');assert.equal((await state()).labStep,'ready');await page.waitForTimeout(4500);assert.equal((await state()).labStep,'ready');assert.equal(await page.locator('#observationCard').count(),0);await page.locator('[data-action="triggerPour"]').click();assert(await page.locator('.experiment-safety-card').isVisible());assert(await page.locator('#experimentSafetyAccept').isDisabled());
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,output,checks:['4.2-second observation delay','tile stays closed until explicit click','attention glow and opening prompt','mouse dragging and touch opening','unchanged camera through peek and minimize','thermometer filled from zero at initial warm and cool temperatures','review navigation preserves first records','chevron header control and automatic collapse on shrink','old safety skip preference retired','fresh safety confirmation after restart','reduced motion']}));
 }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
