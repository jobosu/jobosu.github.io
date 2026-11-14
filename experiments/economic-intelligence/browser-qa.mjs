/** Real Chrome/CDP responsive and interaction checks. No npm dependencies or external APIs. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const base=process.env.JOBOSU_BASE_URL||'http://127.0.0.1:8765/experiments/economic-intelligence/';
const screenshots=process.env.JOBOSU_SCREENSHOT_DIR||'browser-screenshots';
const profile=await mkdtemp(join(tmpdir(),'jobosu-chrome-'));
const chrome=spawn(process.env.CHROME_BIN||'google-chrome',[
 '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
 '--disable-extensions','--disable-background-networking','--no-first-run',
 '--remote-allow-origins=*','--remote-debugging-port=0',
 '--user-data-dir='+profile,'about:blank'
],{stdio:['ignore','ignore','pipe']});
let chromeStderr='';
chrome.stderr?.on('data',chunk=>{chromeStderr=(chromeStderr+chunk.toString()).slice(-12000);});
let chromeSpawnError;
chrome.on('error',error=>{chromeSpawnError=error;});
let socket,sequence=0;
const pending=new Map(),errors=[],requests=[];
function send(method,params={}){
 const id=++sequence;
 return new Promise((resolve,reject)=>{
  pending.set(id,{resolve,reject});
  socket.send(JSON.stringify({id,method,params}));
  const timer=setTimeout(()=>{if(pending.delete(id))reject(new Error('CDP timeout: '+method));},15000);
  timer.unref();
 });
}
async function evaluate(expression){
 const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(result.exceptionDetails)throw new Error('Browser JS evaluation failed: '+result.exceptionDetails.text);
 return result.result?.value;
}
async function waitFor(check,label,{fatal=()=>false}={}){
 let lastError;
 for(let i=0;i<200;i++){
  try{if(await check())return;}catch(error){if(fatal(error))throw error;lastError=error;}
  await sleep(100);
 }
 throw new Error('Timed out waiting for '+label+(lastError?': '+lastError.message:''));
}
async function main(){
 let debugPort;
 await waitFor(async()=>{
  if(chromeSpawnError)throw chromeSpawnError;
  if(chrome.exitCode!==null)throw new Error('Chrome exited before CDP startup (exit '+chrome.exitCode+')');
  try{debugPort=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);return Number.isInteger(debugPort)&&debugPort>0;}catch{return false;}
 },'Chrome debugging port',{fatal:()=>Boolean(chromeSpawnError)||chrome.exitCode!==null});
 const tabs=await (await fetch('http://127.0.0.1:'+debugPort+'/json/list')).json();
 const page=tabs.find(tab=>tab.type==='page');
 assert.ok(page?.webSocketDebuggerUrl,'Chrome page target missing');
 socket=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  socket.addEventListener('open',resolve,{once:true});
  socket.addEventListener('error',reject,{once:true});
 });
 socket.addEventListener('message',event=>{
  const message=JSON.parse(event.data);
  if(message.method==='Runtime.exceptionThrown')errors.push(message.params?.exceptionDetails?.text||'Uncaught JavaScript error');
  if(message.method==='Network.requestWillBeSent')requests.push(message.params?.request?.url||'');
  if(message.id){const task=pending.get(message.id);if(task){pending.delete(message.id);message.error?task.reject(new Error(message.error.message)):task.resolve(message.result);}}
 });
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 await mkdir(screenshots,{recursive:true});
 for(const width of [320,375,768,1280]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:base});
  await waitFor(async()=>await evaluate("document.readyState==='complete' && document.getElementById('ei-run-status')?.textContent.includes('Simulació local completada') && document.getElementById('ei-audit-status')?.textContent.includes('96 execucions reproduïbles')"),'dashboard initialization at '+width+'px');
  const result=await evaluate("(()=>{const h=document.querySelector('h1'),r=document.createRange();r.selectNodeContents(h);const box=r.getBoundingClientRect(),p=document.documentElement;return {viewport:innerWidth,pageWidth:p.scrollWidth,headingLeft:box.left,headingRight:box.right,mockButtonHeight:document.getElementById('ei-debate-run').getBoundingClientRect().height,simButtonHeight:document.getElementById('ei-run').getBoundingClientRect().height};})()");
  const downside=await evaluate("(()=>{const id=x=>document.getElementById(x)?.textContent||'';return {cards:document.querySelectorAll('.ei-risk-stat').length,underperform:id('ei-risk-underperform'),p10:id('ei-risk-p10'),p90:id('ei-risk-p90'),drawdown:id('ei-risk-drawdown')}})()");
  assert.equal(downside.cards,4,'Downside lens must render four metrics at '+width+'px');
  assert.match(downside.underperform,/^\d+ \/ 96$/,'Synthetic underperformance count must reconcile');
  assert.match(downside.p10,/^[+-]?\d+,\d{2} pp$/,'P10 must be a formatted percentile');
  assert.match(downside.p90,/^[+-]?\d+,\d{2} pp$/,'P90 must be a formatted percentile');
  assert.match(downside.drawdown,/^\d+,\d{2}%$/,'Worst synthetic drawdown must be visible');
  assert.equal(result.viewport,width,'Chrome viewport mismatch');
  assert.ok(result.pageWidth<=width+1,'Horizontal overflow at '+width+'px: '+JSON.stringify(result));
  assert.ok(result.headingRight<=width+1&&result.headingLeft>=-1,'Clipped heading at '+width+'px: '+JSON.stringify(result));
  if(width<=375){
   assert.ok(result.mockButtonHeight>=44,'Mock button too small at '+width+'px');
   assert.ok(result.simButtonHeight>=44,'Simulation button too small at '+width+'px');
  }
  const layout=await send('Page.getLayoutMetrics');
  const height=Math.min(10000,Math.ceil(layout.cssContentSize.height));
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height,scale:1}});
  const bytes=Buffer.from(shot.data,'base64');
  assert.equal(bytes.readUInt32BE(16),width,'Screenshot width mismatch');
  await writeFile(join(screenshots,'dashboard-'+width+'-full.png'),bytes);
  console.log('PASS '+width+'px: real viewport, no overflow, heading fits; full screenshot '+width+'x'+height);
 }
 await evaluate("document.getElementById('ei-seed').value='0';document.getElementById('ei-run').click()");
 const invalid=await evaluate("({status:document.getElementById('ei-run-status').textContent,value:document.getElementById('ei-strategy').textContent})");
 assert.match(invalid.status,/No executat/);assert.equal(invalid.value,'—');
 await evaluate("document.getElementById('ei-seed').value='20261026';document.getElementById('ei-run').click()");
 assert.notEqual(await evaluate("document.getElementById('ei-strategy').textContent"),'—');
 await evaluate("document.getElementById('ei-debate-run').click()");
 await waitFor(async()=>await evaluate("document.querySelectorAll('#ei-debate-transcript li').length===4 && !document.getElementById('ei-debate-export').disabled"),'mock debate completion');

 assert.equal(await evaluate("document.getElementById('ei-decision-run').disabled"),false,'Decision gate must unlock only after validated mock session');
 await evaluate("document.getElementById('ei-decision-run').click()");
 const veto=await evaluate("({status:document.getElementById('ei-decision-outcome').dataset.result,text:document.getElementById('ei-decision-outcome').textContent,exportDisabled:document.getElementById('ei-decision-export').disabled})");
 assert.equal(veto.status,'MOCK_VETOED','Skeptic veto must block');
 assert.match(veto.text,/BLOQUEJADA/);
 assert.equal(veto.exportDisabled,false,'Validated mock result must be exportable');
 await evaluate("document.getElementById('ei-vote-skeptic').value='SUPPORT';document.getElementById('ei-vote-skeptic').dispatchEvent(new Event('change'))");
 assert.equal(await evaluate("document.getElementById('ei-decision-export').disabled"),true,'Changing a vote invalidates previous export');
 await evaluate("document.getElementById('ei-decision-run').click()");
 const candidate=await evaluate("({status:document.getElementById('ei-decision-outcome').dataset.result,text:document.getElementById('ei-decision-status').textContent})");
 assert.equal(candidate.status,'MOCK_RESEARCH_CANDIDATE');
 assert.match(candidate.text,/cap autorització/,'Research candidate must never authorize publication or trades');
 await evaluate("document.getElementById('ei-vote-quant').value='ABSTAIN';document.getElementById('ei-vote-quant').dispatchEvent(new Event('change'));document.getElementById('ei-decision-run').click()");
 assert.equal(await evaluate("document.getElementById('ei-decision-outcome').dataset.result"),'MOCK_UNRESOLVED','Abstention must remain unresolved');
 console.log('PASS mock decision gate: skeptic veto, abstention, stale-result invalidation, research-only candidate');


 // A11Y release gate: inspect the actual accessibility tree and keyboard behavior.
 const ax=await send('Accessibility.getFullAXTree');
 const nodes=(ax.nodes||[]).filter(node=>!node.ignored);
 const buttonNames=nodes.filter(node=>node.role?.value==='button').map(node=>node.name?.value||'');
 assert.ok(buttonNames.some(name=>name.includes('EXECUTAR SIMULACIÓ')),'Simulation button has no accessible name');
 assert.ok(buttonNames.some(name=>name.includes('EXECUTAR DEBAT SIMULAT')),'Mock debate button has no accessible name');
 assert.ok(nodes.some(node=>node.role?.value==='image' && (node.name?.value||'').includes('Gràfic de capital simulat')),'Chart is missing from the accessibility tree');
 const semantics=await evaluate("(()=>{const skip=document.querySelector('.ei-skip'),chart=document.getElementById('ei-chart'),table=document.querySelector('.ei-table-scroll'),controls=[...document.querySelectorAll('input,select')];return {lang:document.documentElement.lang,skipTarget:document.querySelector(skip?.getAttribute('href'))?.id,chartDescription:document.getElementById(chart?.getAttribute('aria-describedby'))?.textContent||'',tableFocus:table?.tabIndex,unlabelledControls:controls.filter(el=>!el.labels?.length&&!el.getAttribute('aria-label')).map(el=>el.id)}})()");
 assert.equal(semantics.lang,'ca','Document language must be Catalan');
 assert.equal(semantics.skipTarget,'ei-main','Skip link must point to the main landmark');
 assert.match(semantics.chartDescription,/Gràfic amb dades sintètiques/,'Chart must have a live textual summary');
 assert.equal(semantics.tableFocus,0,'Scrollable audit must be keyboard focusable');
 assert.deepEqual(semantics.unlabelledControls,[],'Every input/select needs an accessible label');
 await send('Page.bringToFront');
 await evaluate("document.querySelector('.ei-skip').focus()");
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});
 await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});
 assert.equal(await evaluate("document.activeElement?.getAttribute('href')"),'../../labs/','Tab from skip link must reach navigation');
 // Conservative WCAG AA spot-checks on representative normal-size text and controls.
 // For gradient-backed content, #124037 is the brightest declared backdrop.
 const contrast=await evaluate(`(()=>{
  const rgb=value=>{if(value.startsWith('#'))return [1,3,5].map(i=>parseInt(value.slice(i,i+2),16));return (value.match(/\\d+(?:\\.\\d+)?/g)||[]).slice(0,3).map(Number)};
  const luminance=value=>rgb(value).map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[0.2126,0.7152,0.0722][i],0);
  const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)};
  return [['.lead','#124037'],['.ei-kicker','#124037'],['.ei-controls button',getComputedStyle(document.querySelector('.ei-controls button')).backgroundColor],['#ei-debate-run','#071219'],['.ei-audit-table thead th','#0a151c'],['#ei-debate-status','#071219']].map(([selector,bg])=>({selector,ratio:ratio(getComputedStyle(document.querySelector(selector)).color,bg)}));
 })()`);
 for(const item of contrast)assert.ok(item.ratio>=4.5,'WCAG AA contrast under 4.5:1 for '+item.selector+' ('+item.ratio.toFixed(2)+')');
 console.log('PASS accessibility: named controls/chart in Chrome AX tree, Catalan labels, keyboard Tab, chart summary, six contrast spot-checks');

 assert.deepEqual(errors,[],'Uncaught JavaScript errors');
 const external=requests.filter(url=>/^https?:/i.test(url)&&!url.startsWith(new URL(base).origin+'/'));
 assert.deepEqual(external,[],'Unexpected non-local network requests');
 console.log('PASS interactions: input recovery, four mock roles, zero external HTTP requests');
}
try{await main();}
catch(error){console.error(error);if(chromeStderr)console.error('Chrome startup diagnostics (last 12KB):\n'+chromeStderr);process.exitCode=1;}
finally{
 socket?.close();chrome.kill();
 await new Promise(resolve=>{if(chrome.exitCode!==null)return resolve();chrome.once('exit',resolve);setTimeout(resolve,2000).unref();});
 await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
