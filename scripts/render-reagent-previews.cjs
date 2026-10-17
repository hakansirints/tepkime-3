const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const crypto=require('node:crypto');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join(require('node:os').homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);});
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:process.env.LAB_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:640,height:440}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error'&&/shader|WebGL|GLSL/i.test(m.text()))errors.push(m.text());});
    await page.goto(`http://127.0.0.1:${server.address().port}/scripts/beaker-preview.html`);
    await page.waitForFunction(()=>window.renderReagentPreview);
    const output=path.join(root,'image/reagents');fs.mkdirSync(output,{recursive:true});
    const assets=[];
    for(const type of ['powder','clear','blue']){
      const data=await page.evaluate(type=>window.renderReagentPreview(type),type);
      if(!data.startsWith('data:image/webp;base64,'))throw new Error('WebP encoding failed');
      const bytes=Buffer.from(data.split(',')[1],'base64');
      fs.writeFileSync(path.join(output,type+'.webp'),bytes);assets.push({file:type+'.webp',bytes:bytes.length});
    }
    if(errors.length)throw new Error(errors.join('\n'));
    const modelHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'js/beaker-model.js'),'utf8').replace(/\r\n/g,'\n')).digest('hex');
    const solutionMl=await page.evaluate(()=>window.MebiExperiment.defaults.solutionMl);
    fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({model:'js/beaker-model.js',modelSha256:modelHash,solutionMl,width:640,height:440,assets},null,2)+'\n');
    console.log(JSON.stringify({passed:true,output,assets,errors}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
