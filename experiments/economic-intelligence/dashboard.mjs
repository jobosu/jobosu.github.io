import {syntheticPrices,backtest,ENGINE_VERSION} from './engine.mjs';
import {mockAdapters,runProtocol} from './orchestrator.mjs';
const $=id=>document.getElementById(id);
const format=(v,d=2)=>new Intl.NumberFormat('ca-ES',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v);
const pct=v=>(v>0?'+':'')+format(v)+'%';
const NS='http://www.w3.org/2000/svg';
function el(tag,attrs={}){const node=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));return node;}
function plot(result){
 const svg=$('ei-chart');svg.replaceChildren();
 const arrays=[result.equity,result.benchmarkEquity],values=arrays.flat();
 const min=Math.min(...values),max=Math.max(...values),pad=Math.max(10,(max-min)*.12),lo=min-pad,hi=max+pad;
 for(let i=0;i<5;i++){const y=18+i*69;svg.append(el('line',{x1:0,x2:800,y1:y,y2:y,stroke:'#26424a','stroke-dasharray':'3 6'}));const t=el('text',{x:10,y:y-6,fill:'#8ca9b0','font-size':11});t.textContent=format(hi-i*(hi-lo)/4,0);svg.append(t);}
 const path=arr=>arr.map((v,i)=>(i?'L':'M')+(800*i/(arr.length-1)).toFixed(2)+','+(18+(1-(v-lo)/(hi-lo))*276).toFixed(2)).join(' ');
 svg.append(el('path',{d:path(result.benchmarkEquity),fill:'none',stroke:'#e1b47a','stroke-width':2.2,'vector-effect':'non-scaling-stroke'}));
 svg.append(el('path',{d:path(result.equity),fill:'none',stroke:'#79f2d3','stroke-width':2.8,'vector-effect':'non-scaling-stroke'}));
 const title=el('title');title.textContent='Capital simulat final: estratègia '+format(result.metrics.endingEquity)+' unitats; referència '+format(result.benchmarkEquity.at(-1))+' unitats. Dades sintètiques.';svg.prepend(title);
}
function render(){
 const status=$('ei-run-status');
 try{
  const prices=syntheticPrices({seed:Number($('ei-seed').value),scenario:$('ei-scenario').value}),result=backtest(prices);
  plot(result);
  for(const [id,value] of [['ei-strategy',result.metrics.strategyReturnPct],['ei-benchmark',result.metrics.benchmarkReturnPct]]){
   const node=$(id);node.textContent=pct(value);node.className=value>=0?'ei-positive':'ei-negative';
  }
  $('ei-drawdown').textContent=format(result.metrics.maxDrawdownPct)+'%';
  $('ei-trades').textContent=result.metrics.trades+' execucions';
  $('ei-fees').textContent='Comissions: '+format(result.metrics.feesPaid)+' unitats';
  status.textContent='Simulació local completada · motor v'+ENGINE_VERSION+'.';
 }catch(error){status.textContent='No executat: '+(error instanceof Error?error.message:'error desconegut');}
}
$('ei-run').addEventListener('click',render);
render();

/* A reproducible multi-seed audit, deliberately separate from the single-path demo. */
import {robustnessAudit} from './robustness.mjs';
const audit=robustnessAudit({seeds:32,startSeed:20261027});
const scenarioNames={regimes:'Canvis de règim',trend:'Tendència',chop:'Lateral volàtil'};
const tbody=$('ei-robustness-body');
for(const group of audit.groups){
 const tr=document.createElement('tr');
 const values=[scenarioNames[group.scenario],String(group.runs),format(group.medianExcessPct)+' pp',format(group.outperformPct)+'%',format(group.worstExcessPct)+' pp',format(group.worstDrawdownPct)+'%'];
 for(let i=0;i<values.length;i++){
  const cell=document.createElement(i===0?'th':'td');
  if(i===0)cell.scope='row';
  cell.textContent=values[i];
  tr.append(cell);
 }
 tbody.append(tr);
}
$('ei-audit-status').textContent=audit.totalRuns+' execucions reproduïbles · '+audit.seedsPerScenario+' llavors per escenari · només dades sintètiques.';
$('ei-audit-export').addEventListener('click',()=>{
 const blob=new Blob([JSON.stringify(audit,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='jobosu-synthetic-robustness-audit.json';
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
});

/* A click-to-run, explicitly fictional protocol demonstration. No API calls. */
const mockRoleNames={researcher:'01 / RESEARCHER',quant:'02 / QUANT',skeptic:'03 / SKEPTIC',editor:'04 / EDITOR'};
let lastMockProvenance=null;
const provenanceExport=$('ei-debate-export');
$('ei-debate-run').addEventListener('click',async()=>{
 const button=$('ei-debate-run'),status=$('ei-debate-status'),list=$('ei-debate-transcript');
 button.disabled=true;
 provenanceExport.disabled=true;
 lastMockProvenance=null;
 status.textContent='Executant únicament adaptadors locals simulats...';
 try{
  const session=await runProtocol({adapters:mockAdapters(),mode:'mock'});
  if(session.mode!=='mock'||session.connectedProviders!==0||session.liveTrades!==0||session.transcript.some(m=>m.mock!==true)||session.provenance?.kind!=='MOCK_EVIDENCE_LEDGER'||session.provenance.entries.length!==session.transcript.length)throw new Error('Protocol de simulació no verificat');
  lastMockProvenance=session.provenance;
  provenanceExport.disabled=false;
  list.replaceChildren();
  for(const message of session.transcript){
   const item=document.createElement('li'),heading=document.createElement('h4'),summary=document.createElement('p'),sources=document.createElement('small'),limits=document.createElement('small');
   heading.textContent=mockRoleNames[message.role]||message.role.toUpperCase();
   summary.textContent=message.summary;
   sources.textContent='FONT SIMULADA: '+message.sources.join(' · ');
   limits.textContent='LIMITACIONS: '+message.limitations.join(' · ');
   item.append(heading,summary,sources,limits);list.append(item);
  }
  status.textContent=session.transcript.length+' rols simulats · procedència sintètica auditada · 0 proveïdors connectats · 0 operacions.';
 }catch(error){
  list.replaceChildren();
  status.textContent='Demostració no completada: '+(error instanceof Error?error.message:'error desconegut');
 }finally{button.disabled=false;}
});
provenanceExport.addEventListener('click',()=>{
 if(!lastMockProvenance||lastMockProvenance.simulatedOnly!==true)return;
 const blob=new Blob([JSON.stringify(lastMockProvenance,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='jobosu-mock-provenance.json';
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
});
