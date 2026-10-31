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
],{stdio:'ignore'});
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
async function waitFor(check,label){
 let lastError;
 for(let i=0;i<100;i++){
  try{if(await check())return;}catch(error){lastError=error;}
  await sleep(100);
 }
 throw new Error('Timed out waiting for '+label+(lastError?': '+lastError.message:''));
}
async function main(){
 let debugPort;
 await waitFor(async()=>{
  if(chrome.exitCode!==null)throw new Error('Chrome exited before CDP startup');
  try{debugPort=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);return Number.isInteger(debugPort)&&debugPort>0;}catch{return false;}
 },'Chrome debugging port');
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
 assert.deepEqual(errors,[],'Uncaught JavaScript errors');
 const external=requests.filter(url=>/^https?:/i.test(url)&&!url.startsWith(new URL(base).origin+'/'));
 assert.deepEqual(external,[],'Unexpected non-local network requests');
 console.log('PASS interactions: input recovery, four mock roles, zero external HTTP requests');
}
try{await main();}
catch(error){console.error(error);process.exitCode=1;}
finally{
 socket?.close();chrome.kill();
 await new Promise(resolve=>{if(chrome.exitCode!==null)return resolve();chrome.once('exit',resolve);setTimeout(resolve,2000).unref();});
 await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
