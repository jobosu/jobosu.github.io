/** Decision Atlas: visualizes only locally generated, fully synthetic counterfactual votes. */
import {auditMockDecisionSpace,DECISION_SPACE_SCHEMA} from './decision-space.mjs';
import {inspectDecisionSensitivity,SENSITIVITY_SCHEMA} from './decision-sensitivity.mjs';
import {runProtocol,mockAdapters} from './orchestrator.mjs';

const $=id=>document.getElementById(id);
const roles=['researcher','quant','skeptic','editor'];
const validStatuses=['MOCK_VETOED','MOCK_UNRESOLVED','MOCK_RESEARCH_CANDIDATE'];
const labels={MOCK_VETOED:'VETO · HIPÒTESI BLOQUEJADA',MOCK_UNRESOLVED:'PENDENT · SENSE CONSENS',MOCK_RESEARCH_CANDIDATE:'CANDIDATA FICTÍCIA · NO VERIFICADA'};
const stanceLabels={SUPPORT:'SUPORT',ABSTAIN:'ABSTENCIÓ',VETO:'VETO'};
let audit=null,filter='all',selected=-1;
const cells=[];

function verify(value){
 if(value?.schema!==DECISION_SPACE_SCHEMA||value.mode!=='mock'||value.simulatedOnly!==true||
    value.connectedProviders!==0||value.liveTrades!==0||value.independentMarketEvidence!==false||
    value.publicationAuthorized!==false||value.tradingAuthorized!==false||
    value.totalCombinations!==81||value.outcomes?.length!==81||
    value.statusCounts?.MOCK_VETOED!==65||value.statusCounts?.MOCK_UNRESOLVED!==15||
    value.statusCounts?.MOCK_RESEARCH_CANDIDATE!==1||
    roles.some((role,i)=>value.roleOrder?.[i]!==role))throw new Error('Auditoria sintètica no validada');
 const unique=new Set();
 for(const outcome of value.outcomes){
  if(!validStatuses.includes(outcome.status)||outcome.stances?.length!==4||
     outcome.stances.some(stance=>!['SUPPORT','ABSTAIN','VETO'].includes(stance)))throw new Error('Cas no vàlid');
  const key=outcome.stances.join('/');
  if(unique.has(key))throw new Error('Combinació duplicada');
  unique.add(key);
  const expected=outcome.stances.includes('VETO')?'MOCK_VETOED':
    outcome.stances.every(stance=>stance==='SUPPORT')?'MOCK_RESEARCH_CANDIDATE':'MOCK_UNRESOLVED';
  if(outcome.status!==expected)throw new Error('Decisió incompatible amb el protocol');
 }
 return value;
}
function activeIndices(){return audit.outcomes.map((item,i)=>({item,i})).filter(({item})=>filter==='all'||item.status===filter).map(({i})=>i);}
function selectCase(index,{focus=false}={}){
 if(!audit||!Number.isInteger(index)||!audit.outcomes[index])return;
 selected=index;
 for(let i=0;i<cells.length;i++){cells[i].setAttribute('aria-pressed',String(i===index));cells[i].tabIndex=i===index?0:-1;}
 const outcome=audit.outcomes[index];
 $('case-id').textContent='CASE '+String(index+1).padStart(2,'0')+' / 81';
 $('case-verdict').textContent=labels[outcome.status];
 const list=$('case-votes');list.replaceChildren();
 for(let i=0;i<roles.length;i++){
  const item=document.createElement('li'),name=document.createElement('span'),vote=document.createElement('b');
  name.textContent=roles[i].toUpperCase();vote.textContent=stanceLabels[outcome.stances[i]];
  vote.dataset.vote=outcome.stances[i];item.append(name,vote);list.append(item);
 }
 $('case-explanation').textContent=outcome.status==='MOCK_VETOED'?
  'Un o més vetos bloquegen la hipòtesi. Cap vot representa una revisió d’IA real.':
  outcome.status==='MOCK_UNRESOLVED'?'Sense veto, però almenys una abstenció impedeix la unanimitat.':
  'Quatre suports ficticis: només una candidata de recerca, sense evidència ni autorització.';
 const sensitivity=inspectDecisionSensitivity(audit,index);
 if(sensitivity.schema!==SENSITIVITY_SCHEMA||sensitivity.mode!=='mock'||sensitivity.simulatedOnly!==true||
    sensitivity.connectedProviders!==0||sensitivity.liveTrades!==0||
    sensitivity.publicationAuthorized!==false||sensitivity.tradingAuthorized!==false)throw new Error('Sensibilitat no validada');
 const sensitivityList=$('case-sensitivity');sensitivityList.replaceChildren();
 for(const flip of sensitivity.flips){
  const li=document.createElement('li'),change=document.createElement('span'),result=document.createElement('strong');
  change.textContent=flip.role.toUpperCase()+' · '+stanceLabels[flip.from]+' → '+stanceLabels[flip.to];
  result.textContent=flip.changesOutcome?'CANVIA · '+(flip.status==='MOCK_VETOED'?'VETO':flip.status==='MOCK_UNRESOLVED'?'PENDENT':'CANDIDATA'):'SENSE CANVI';
  result.dataset.pivotal=String(flip.changesOutcome);
  li.append(change,result);sensitivityList.append(li);
 }
 $('case-sensitivity-summary').textContent=sensitivity.pivotalFlips+' de 8 canvis d’un únic vot alteren el resultat d’aquest cas fictici.';
 if(focus)cells[index].focus();
}
function applyFilter(next){
 if(!audit||!['all',...validStatuses].includes(next))return;
 filter=next;
 for(const button of document.querySelectorAll('[data-filter]'))button.setAttribute('aria-pressed',String(button.dataset.filter===filter));
 for(let i=0;i<cells.length;i++)cells[i].hidden=filter!=='all'&&audit.outcomes[i].status!==filter;
 const visible=activeIndices();
 if(!visible.includes(selected))selectCase(visible[0]);
 $('atlas-status').textContent=visible.length+' de 81 combinacions fictícies visibles · cap dada de mercat.';
}
function draw(){
 const matrix=$('decision-matrix');matrix.replaceChildren();cells.length=0;
 for(let i=0;i<audit.outcomes.length;i++){
  const outcome=audit.outcomes[i],cell=document.createElement('button');
  cell.type='button';cell.className='cell';cell.dataset.status=outcome.status;
  cell.textContent=String(i+1).padStart(2,'0');
  cell.setAttribute('aria-label','Cas '+(i+1)+': '+roles.map((role,n)=>role+' '+stanceLabels[outcome.stances[n]]).join(', ')+'. '+labels[outcome.status]);
  cell.setAttribute('aria-pressed','false');cell.tabIndex=-1;
  cell.addEventListener('click',()=>selectCase(i));
  cell.addEventListener('keydown',event=>{
   const visible=activeIndices(),position=visible.indexOf(i);
   const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:9,ArrowUp:-9};
   let next=position;
   if(Object.hasOwn(delta,event.key))next=Math.max(0,Math.min(visible.length-1,position+delta[event.key]));
   else if(event.key==='Home')next=0;
   else if(event.key==='End')next=visible.length-1;
   else return;
   event.preventDefault();selectCase(visible[next],{focus:true});
  });
  cells.push(cell);matrix.append(cell);
 }
 $('count-veto').textContent=String(audit.statusCounts.MOCK_VETOED);
 $('count-unresolved').textContent=String(audit.statusCounts.MOCK_UNRESOLVED);
 $('count-candidate').textContent=String(audit.statusCounts.MOCK_RESEARCH_CANDIDATE);
 selectCase(0);applyFilter('all');
 $('atlas-export').disabled=false;
}
for(const button of document.querySelectorAll('[data-filter]'))button.addEventListener('click',()=>applyFilter(button.dataset.filter));
$('atlas-export').addEventListener('click',()=>{
 if(!audit||audit.simulatedOnly!==true||audit.tradingAuthorized!==false||audit.publicationAuthorized!==false)return;
 const blob=new Blob([JSON.stringify(audit,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='jobosu-mock-decision-atlas.json';
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
});
try{
 const session=await runProtocol({adapters:mockAdapters(),mode:'mock'});
 if(session.mode!=='mock'||session.connectedProviders!==0||session.liveTrades!==0||
    session.provenance?.kind!=='MOCK_EVIDENCE_LEDGER')throw new Error('Sessió no simulada');
 const ref=session.provenance.uniqueSourceRefs?.[0];
 if(typeof ref!=='string'||!ref.startsWith('synthetic://'))throw new Error('Font sintètica absent');
 const proposal={id:'MOCK-ATLAS-001',hypothesis:'Counterfactual manual-vote study; no market claims.',sourceRefs:[ref],simulationOnly:true};
 audit=verify(auditMockDecisionSpace({session,proposal}));
 draw();
}catch(error){
 audit=null;selected=-1;cells.length=0;
 $('decision-matrix').replaceChildren();$('case-votes').replaceChildren();$('case-sensitivity').replaceChildren();
 $('case-sensitivity-summary').textContent='No disponible: auditoria sintètica rebutjada.';
 $('case-verdict').textContent='NO DISPONIBLE';
 $('case-explanation').textContent='La validació ha fallat; cap resultat s’ha presentat com a fiable.';
 $('atlas-export').disabled=true;
 $('atlas-status').textContent='Auditoria rebutjada: '+(error instanceof Error?error.message:'error desconegut');
}
