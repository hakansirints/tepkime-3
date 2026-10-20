/* Inline saving, five-step guide, floating forms and compact light/dark layouts. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
let playwright;try{playwright=require('playwright');}catch{playwright=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const output=path.join(os.tmpdir(),'tepkime-prediction-qa');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const project=path.resolve(__dirname,'..');
 const server=require('node:http').createServer((req,res)=>{
  const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(project,'.'+rel);
  if(!file.startsWith(project+path.sep)||rel.includes('/.git')||rel.includes('/yedekler/')){res.writeHead(403);res.end();return;}
  const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream';
  fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':type});res.end(error?'Not found':data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await playwright.chromium.launch({headless:true,executablePath:process.env.EDGE_BINARY||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined),args:['--enable-webgl','--ignore-gpu-blocklist']});
  const context=await browser.newContext({viewport:{width:1366,height:768},hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>localStorage.setItem('mebi_hide_welcome_modal','true'));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.TepkimeArenasi&&window.MebiUI);
  const liveData=async()=>{
   const dock=page.locator('#benchDock.observation-live-dock');
   assert(await dock.isVisible());assert.equal(await dock.locator('.experiment-live-data').count(),1);
   assert.equal(await dock.locator('h2').textContent(),'Deneyin Anlık Verileri');
   const quantities=await page.evaluate(()=>({...MebiExperiment.quantities(TepkimeArenasi.state),temperature:TepkimeArenasi.state.currentTemp}));
   const meters=await dock.locator('[data-experiment-meter]').evaluateAll(elements=>elements.map(element=>({key:element.dataset.experimentMeter,value:Number(element.getAttribute('aria-valuenow'))})));
   for(const meter of meters)assert.equal(meter.value,quantities[meter.key]);
   const bounds=await dock.boundingBox(),view=page.viewportSize();assert(bounds.x>=0&&bounds.x+bounds.width<=view.width+1&&bounds.y+bounds.height<=view.height+1);
  };
  const floating=async(kind,width,height)=>{
   await page.setViewportSize({width,height});await page.waitForTimeout(180);
   const card=page.locator('.prediction-card:not([data-floating-ghost])');
   const original=await card.boundingBox();
   const snapshot=await page.evaluate(()=>JSON.stringify({answers:TepkimeArenasi.state.predictionAnswers,prediction:TepkimeArenasi.state.predictionRecord,observation:TepkimeArenasi.state.observation}));
   const content=card.locator('.prediction-content');await content.evaluate(element=>element.scrollTop=80);
   const scroll=await content.evaluate(element=>element.scrollTop);
   await card.locator('.floating-card-minimize').click();
   assert(await page.locator('[data-floating-ghost]').count()>0,'Minimizing animates');
   await page.waitForTimeout(410);
   assert(await card.evaluate(element=>element.classList.contains('is-minimized')));
   assert.deepEqual(await card.boundingBox().then(box=>[box.width,box.height]),[92,92]);
   assert(await content.isHidden());assert(await card.locator('.floating-card-tile').isVisible());
   if(kind==='observation')await liveData();else assert.equal(await page.locator('.observation-live-dock').count(),0);
   const icon=await card.locator('.floating-card-symbol').innerHTML();assert(icon.includes(kind==='prediction'?'16.5':'3.6-7'));
   const initial=await card.boundingBox(),handle=card.locator('.floating-card-grip');
   const dx=initial.x>width/2?-180:180,dy=initial.y>height/2?-130:130;
   // Drag from the lower part of the handle, away from the restore hit target.
   await page.mouse.move(initial.x+25,initial.y+70);await page.mouse.down();
   await page.mouse.move(initial.x+25+dx,initial.y+70+dy,{steps:8});await page.mouse.up();
   const moved=await card.boundingBox();assert(Math.abs(moved.x-initial.x)>100&&Math.abs(moved.y-initial.y)>80);
   const keyboardStep=moved.x>width/2?-10:10;
   await handle.focus();await page.keyboard.press(keyboardStep<0?'ArrowLeft':'ArrowRight');assert.equal(Math.round((await card.boundingBox()).x-moved.x),keyboardStep);
   // A normal app render retains the minimized position and all draft data.
   await page.evaluate(()=>TepkimeArenasi.render(false));
   if(kind==='observation')await liveData();
   assert(await card.evaluate(element=>element.classList.contains('is-minimized')));
   assert.equal(Math.round((await card.boundingBox()).x),Math.round(moved.x+keyboardStep));
   await page.screenshot({path:path.join(output,`${kind}-minimized-${width}.png`)});
   await card.locator('.floating-card-restore').click();
   assert(await page.locator('[data-floating-ghost]').count()>0,'Restoring animates');
   await page.waitForTimeout(410);
   const restored=await card.boundingBox();
   assert.equal(await page.locator('.observation-live-dock').count(),0);
   for(const key of ['x','y','width','height'])assert(Math.abs(restored[key]-original[key])<1,kind+' returns to original '+key);
   assert.equal(await content.evaluate(element=>element.scrollTop),scroll);
   assert.equal(await page.evaluate(()=>JSON.stringify({answers:TepkimeArenasi.state.predictionAnswers,prediction:TepkimeArenasi.state.predictionRecord,observation:TepkimeArenasi.state.observation})),snapshot);
   // Touch pointer events use the same capture path and stay inside the viewport.
   await card.locator('.floating-card-minimize').click();await page.waitForTimeout(410);
   const tile=await card.boundingBox(),touch=await page.context().newCDPSession(page);
   await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tile.x+24,y:tile.y+70}]});
   await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tile.x+24+(tile.x>width/2?-94:94),y:tile.y+70+(tile.y>height/2?-95:95)}]});
   await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();
   assert(Math.abs((await card.boundingBox()).x-tile.x)>40,'Touch moves the tile');
   await page.setViewportSize({width:667,height:375});await page.waitForTimeout(180);
   const clamped=await card.boundingBox();assert(clamped.x>=8&&clamped.y>=8&&clamped.x+clamped.width<=659&&clamped.y+clamped.height<=367);
   await card.locator('.floating-card-restore').click();await page.waitForTimeout(410);
   await page.emulateMedia({reducedMotion:'reduce'});
   await card.locator('.floating-card-minimize').click();assert.equal(await page.locator('[data-floating-ghost]').count(),0);
   await card.locator('.floating-card-grip').focus();await page.keyboard.press('Escape');
   assert(await content.isVisible());await page.emulateMedia({reducedMotion:'no-preference'});
  };
  await page.evaluate(()=>TepkimeArenasi.dispatch('goPool'));
  for(const [width,height] of [[1366,768],[1024,768],[844,390],[667,375]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(180);
   for(const theme of ['light','dark']){
    await page.evaluate(theme=>MebiUI.applyTheme(theme),theme);await page.waitForTimeout(380);
    const gallery=page.locator('.reagent-gallery');assert.equal(await gallery.locator('.reagent-gallery-card').count(),12);
    const grid=await gallery.locator('.reagent-gallery-grid').evaluate(el=>({columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,overflow:el.scrollWidth>el.clientWidth+1}));
    assert.equal(grid.columns,4);assert.equal(grid.overflow,false);
    const bounds=await gallery.boundingBox();assert(bounds.x>=0&&bounds.y+bounds.height<=height+1,JSON.stringify({width,height,bounds}));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    const cardOverflow=await gallery.locator('.reagent-card-caption').evaluateAll(elements=>elements.some(el=>el.scrollWidth>el.clientWidth+1));assert.equal(cardOverflow,false,'Material names and formulas fit at '+width);
    await page.screenshot({path:path.join(output,`gallery-${width}-${theme}.png`)});
   }
  }
  await page.locator('[data-action="randomReactivePairForTesting"]').click();
  const pair=await page.evaluate(()=>{const s=TepkimeArenasi.state;return {a:s.selectedSlot1,b:s.selectedSlot2,type:MebiData.getReaction(s.selectedSlot1,s.selectedSlot2).typeCategory,screen:s.screen};});
  assert.notEqual(pair.a,pair.b);assert.notEqual(pair.type,'none');assert.equal(pair.screen,'pool');
  if(process.argv.includes('--gallery-only')){assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,output,checks:['four columns and twelve cards in four viewport sizes','no clipped names or formulas','no horizontal overflow','light and dark themes','reacting random selection without automatic continuation']}));return;}
  await page.setViewportSize({width:1366,height:768});await page.evaluate(()=>MebiUI.applyTheme('light'));
  await page.evaluate(()=>{TepkimeArenasi.dispatch('resetPool');TepkimeArenasi.dispatch('clickReagent','H2O2');TepkimeArenasi.dispatch('clickReagent','KI');});
  await page.waitForFunction(()=>!TepkimeArenasi.state.isFilling);
  await page.evaluate(()=>TepkimeArenasi.dispatch('startExperiment'));
  assert(await page.locator('#beginExperimentButton').isDisabled());
  assert.equal(await page.getByText('Bu tarayıcıdaki tahmin kayıtları',{exact:false}).count(),0);
  await page.locator('[data-action="autoFillPredictionForTesting"]').click();
  assert.equal(await page.locator('.prediction-choices [aria-pressed="true"]').count(),5);
  const before=await page.locator('.prediction-reason').evaluateAll(inputs=>inputs.map(input=>input.value));
  assert(before.every(reason=>reason&&!/test/i.test(reason)));
  await page.locator('#savePredictionButton').click();
  assert.equal(await page.locator('.prediction-row').count(),5);
  assert.equal(await page.locator('#predictionSavedStatus').textContent(),' Tahmininiz kaydedildi');
  assert(await page.locator('#beginExperimentButton').isEnabled());
  assert.deepEqual(await page.locator('.prediction-reason').evaluateAll(inputs=>inputs.map(input=>input.value)),before);
  await page.locator('[data-reason-key="gas"]').fill(before[0]+' ');
  assert(await page.locator('#beginExperimentButton').isDisabled());assert.equal(await page.locator('#predictionSavedStatus').textContent(),'');
  await page.locator('#savePredictionButton').click();
  for(const [width,height] of [[1366,768],[1024,768],[844,390],[667,375]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(180);
   for(const theme of ['light','dark']){
    await page.evaluate(theme=>MebiUI.applyTheme(theme),theme);await page.waitForTimeout(380);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    const bounds=await page.locator('.prediction-card').boundingBox();
    assert(bounds.x>=0&&bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=height+1,JSON.stringify({width,height,bounds}));
    const gap=await page.locator('.prediction-pair').evaluate(pair=>{const a=pair.children[0].getBoundingClientRect(),b=pair.children[2].getBoundingClientRect();return b.left-a.right;});
    assert(gap<50,'Selected materials stay close: '+gap);
    const content=await page.locator('.prediction-content').boundingBox();assert(content.height>40,'Scrollable decisions retain usable space');
    const continueBounds=await page.locator('#beginExperimentButton').boundingBox();assert(continueBounds.y+continueBounds.height<=height);
    await page.screenshot({path:path.join(output,`prediction-${width}-${theme}.png`)});
   }
  }
  await floating('prediction',1366,768);
  await floating('prediction',844,390);
  await page.evaluate(()=>MebiUI.openWelcomeModal());
  await page.locator('#welcomeStep1').waitFor({state:'visible',timeout:3000});
  assert.equal(await page.locator('.welcome-tab-btn').count(),5);assert.equal(await page.locator('[data-guide-view]').count(),0);
  const guideTitles=['Maddeleri seç','Tahmin et ve gerekçelendir','Karıştır','Gözle ve açıkla','Tanecikleri ilişkilendir'];
  for(let i=1;i<=5;i++){
   await page.locator('.welcome-tab-btn[data-step="'+i+'"]').click();
   assert.equal(await page.locator('#welcomeStep'+i+' .welcome-step-title').textContent(),guideTitles[i-1]);
   assert(await page.locator('#welcomeStep'+i).isVisible());
  }
  assert.match(await page.locator('#welcomeStep5 .welcome-step-desc').textContent(),/toplam yükün korunup korunmadığını/);
  await page.screenshot({path:path.join(output,'guide-667-dark.png')});
  await page.locator('#welcomeTab5').focus();await page.keyboard.press('ArrowLeft');assert(await page.locator('#welcomeStep4').isVisible());
  await page.keyboard.press('Home');assert(await page.locator('#welcomeStep1').isVisible());
  await page.setViewportSize({width:1366,height:768});await page.evaluate(()=>MebiUI.applyTheme('light'));await page.waitForTimeout(380);
  await page.screenshot({path:path.join(output,'guide-1366-light.png')});
  await page.locator('#btnCloseWelcomeModal').click();
  await page.locator('#beginExperimentButton').click();
  await page.waitForFunction(()=>TepkimeArenasi.state.labStep==='ready');
  // Complete the model instantly to inspect the genuine blank observation screen.
  await page.evaluate(()=>{const s=TepkimeArenasi.state;s.labStep='observed';s.poured=true;s.experiment.transfer=1;s.currentTemp=s.activeReaction.tempFinal;TepkimeArenasi.render(false);});
  await page.waitForTimeout(1200);
  await page.locator('#observationCard .floating-card-restore').click();await page.waitForTimeout(410);
  assert.equal(await page.locator('#observationCard').count(),1);
  assert.equal(await page.locator('.observation-peek-toggle').count(),1);
  assert.equal(await page.locator('.observation-footer [data-action="showObservationDesk"]').count(),0);
  for(const [width,height] of [[1366,768],[844,390],[667,375]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(180);
   for(const theme of ['light','dark']){
    await page.evaluate(theme=>MebiUI.applyTheme(theme),theme);await page.waitForTimeout(380);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    const bounds=await page.locator('#observationCard').boundingBox();assert(bounds.y+bounds.height<=height+1);
    await page.screenshot({path:path.join(output,`observation-${width}-${theme}.png`)});
    assert((await page.locator('#observationPanel').boundingBox()).height>40,'Observation content height at '+width+': '+JSON.stringify(await page.locator('#observationPanel').boundingBox()));
   }
  }
  await page.locator('[data-action="autoFillObservationForTesting"]').click();
  assert.equal(await page.locator('.observation-options [aria-pressed="true"]').count(),5);
  assert(!/test/i.test(await page.locator('#observationNote').inputValue()));
  assert.equal(await page.evaluate(()=>TepkimeArenasi.state.observation.record),null);
  await page.locator('#observationNote').fill('Karışımın görünüşünü ve termometredeki son sıcaklığı kaydettim.');
  await page.locator('[data-action="setObservationChoice"][data-arg="color:yes"]').click();
  for(const [width,height] of [[1366,768],[844,390],[667,375]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(180);
   for(const theme of ['light','dark']){
    await page.evaluate(theme=>MebiUI.applyTheme(theme),theme);await page.waitForTimeout(380);
    const card=page.locator('#observationCard'),panel=card.locator('#observationPanel');
    const original=await card.boundingBox();
    await panel.evaluate(element=>element.scrollTop=60);const scroll=await panel.evaluate(element=>element.scrollTop);
    const snapshot=await page.evaluate(()=>JSON.stringify(TepkimeArenasi.state.observation));
    await card.locator('.observation-peek-toggle').click();
    assert.equal(await page.locator('[data-floating-ghost]').count(),1,'Peeking animates upward');
    await page.waitForTimeout(410);
    assert(await card.evaluate(element=>element.classList.contains('is-collapsed')));
    assert.equal(await card.locator('.observation-peek-toggle').textContent(),'Gözlem kartına dön');
    assert.equal(await card.locator('.observation-peek-toggle').getAttribute('aria-expanded'),'false');
    const compact=await card.boundingBox();assert(compact.height<=60&&compact.width===original.width&&compact.y===original.y);
    assert(await panel.isHidden());assert(await card.locator('.prediction-pair').isHidden());assert(await card.locator('footer').isHidden());
    await liveData();
    assert.equal(await page.locator('#benchDock [data-experiment-value="volume"]').textContent(),'80 mL');
    assert.equal(await page.locator('#benchDock [data-experiment-value="remainingMl"]').textContent(),'0 mL');
    assert.equal(await page.locator('#benchDock details').count(),0);
    assert(await page.locator('#benchDock .experiment-model-conditions').isVisible());
    assert.equal(await page.locator('#benchDock [data-experiment-value="concentration1"]').textContent(),'0,050 mol/L');
    await liveData();
    const controls=await card.locator('.observation-peek-toggle').boundingBox(),minimize=await card.locator('.floating-card-minimize').boundingBox();assert(controls.x+controls.width<=minimize.x,'Peek and minimize controls stay separate');
    await page.evaluate(()=>TepkimeArenasi.render(false));
    assert(await card.evaluate(element=>element.classList.contains('is-collapsed')));
    await liveData();
    await page.screenshot({path:path.join(output,`observation-peek-${width}-${theme}.png`)});
    await card.locator('.observation-peek-toggle').click();await page.waitForTimeout(410);
    assert.equal(await page.locator('.observation-live-dock').count(),0);
    assert(await panel.isVisible());assert.equal(await panel.evaluate(element=>element.scrollTop),scroll);
    assert.equal(await card.locator('.observation-peek-toggle').textContent(),'Deneyi gözle');
    const restored=await card.boundingBox();for(const key of ['x','y','width','height'])assert(Math.abs(restored[key]-original[key])<1);
    assert.equal(await page.evaluate(()=>JSON.stringify(TepkimeArenasi.state.observation)),snapshot);
   }
  }
  // The separate draggable-tile action also works from the compact strip.
  await page.locator('.observation-peek-toggle').click();await page.waitForTimeout(410);
  await page.locator('.floating-card-minimize').click();await page.waitForTimeout(410);
  assert(await page.locator('#observationCard.is-minimized').count());
  await liveData();
  await page.locator('.floating-card-restore').click();await page.waitForTimeout(410);
  assert(await page.locator('#observationPanel').isVisible());
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('.observation-peek-toggle').click();assert.equal(await page.locator('[data-floating-ghost]').count(),0);
  await page.locator('.observation-peek-toggle').click();await page.emulateMedia({reducedMotion:'no-preference'});
  await floating('observation',1366,768);
  await floating('observation',844,390);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,output,checks:['pair-specific automatic choices and reasons','inline save keeps form','edits require re-save','experiment button gating','close selected materials','four viewports in light/dark with touch targets','original five-step guide and keyboard navigation','animated minimize/restore of both forms','mouse/touch/keyboard dragging','screen bounds after resize','draft and scroll preservation through render','observation peek strip in three viewports and both themes','independent peek and minimize controls','reduced motion'],errors}));
 }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
