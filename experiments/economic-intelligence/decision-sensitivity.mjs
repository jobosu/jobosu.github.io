/** Local counterfactual sensitivity of 81 fictional ballots. No provider, market or network input. */
import {DECISION_SPACE_SCHEMA} from './decision-space.mjs';
export const SENSITIVITY_SCHEMA='jobosu.mock-decision-sensitivity.v1';
const ROLES=Object.freeze(['researcher','quant','skeptic','editor']);
const STANCES=Object.freeze(['SUPPORT','ABSTAIN','VETO']);
const STATUSES=Object.freeze(['MOCK_VETOED','MOCK_UNRESOLVED','MOCK_RESEARCH_CANDIDATE']);
const key=stances=>stances.join('/');
const statusOf=stances=>stances.includes('VETO')?'MOCK_VETOED':stances.every(s=>s==='SUPPORT')?'MOCK_RESEARCH_CANDIDATE':'MOCK_UNRESOLVED';
const same=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((value,i)=>value===b[i]);
function validateAudit(audit){
 if(!audit||audit.schema!==DECISION_SPACE_SCHEMA||audit.mode!=='mock'||audit.simulatedOnly!==true||
    audit.connectedProviders!==0||audit.liveTrades!==0||audit.independentMarketEvidence!==false||
    audit.publicationAuthorized!==false||audit.tradingAuthorized!==false||
    audit.totalCombinations!==81||!same(audit.roleOrder,ROLES)||!same(audit.stanceOrder,STANCES)||
    !Array.isArray(audit.outcomes)||audit.outcomes.length!==81)throw new TypeError('Unsafe or incomplete synthetic decision audit');
 const seen=new Map(),counts=Object.fromEntries(STATUSES.map(s=>[s,0]));
 const vetoByRole=Object.fromEntries(ROLES.map(r=>[r,0]));
 for(let i=0;i<audit.outcomes.length;i++){
  const outcome=audit.outcomes[i];
  if(!outcome||!Array.isArray(outcome.stances)||
     outcome.stances.length!==4||outcome.stances.some(s=>!STANCES.includes(s))||
     outcome.status!==statusOf(outcome.stances))throw new TypeError('Invalid counterfactual ballot');
  const vetoRoles=ROLES.filter((role,n)=>outcome.stances[n]==='VETO');
  if(!same(outcome.vetoRoles,vetoRoles))throw new TypeError('Incorrect veto attribution');
  const id=key(outcome.stances);
  if(seen.has(id))throw new TypeError('Duplicate counterfactual ballot');
  seen.set(id,i);counts[outcome.status]++;
  for(const role of vetoRoles)vetoByRole[role]++;
 }
 if(STATUSES.some(s=>counts[s]!==audit.statusCounts?.[s])||
    ROLES.some(r=>vetoByRole[r]!==audit.vetoByRole?.[r])||
    counts.MOCK_VETOED!==65||counts.MOCK_UNRESOLVED!==15||
    counts.MOCK_RESEARCH_CANDIDATE!==1||
    ROLES.some(r=>vetoByRole[r]!==27))throw new TypeError('Synthetic decision totals do not reconcile');
 return seen;
}
/** Exactly eight single-vote counterfactuals for a selected fictional case.
 * "Pivotal" means a rule-output change, not market significance or model influence.
 */
export function inspectDecisionSensitivity(audit,index){
 if(!Number.isInteger(index)||index<0||index>=81)throw new RangeError('Invalid fictional case index');
 const lookup=validateAudit(audit);
 const current=audit.outcomes[index],flips=[];
 for(let roleIndex=0;roleIndex<4;roleIndex++){
  for(const to of STANCES){
   const from=current.stances[roleIndex];
   if(to===from)continue;
   const stances=[...current.stances];stances[roleIndex]=to;
   const targetIndex=lookup.get(key(stances));
   if(targetIndex===undefined)throw new TypeError('Missing counterfactual neighbor');
   const target=audit.outcomes[targetIndex];
   flips.push({role:ROLES[roleIndex],roleIndex,from,to,targetCase:targetIndex+1,
    status:target.status,changesOutcome:target.status!==current.status});
  }
 }
 if(flips.length!==8)throw new TypeError('Incomplete sensitivity neighborhood');
 return {
  schema:SENSITIVITY_SCHEMA,mode:'mock',simulatedOnly:true,
  caseNumber:index+1,status:current.status,stances:[...current.stances],
  flips,pivotalFlips:flips.filter(f=>f.changesOutcome).length,
  connectedProviders:0,liveTrades:0,publicationAuthorized:false,tradingAuthorized:false,
  interpretation:'Rule sensitivity of eight fictional single-vote changes; not market probabilities, evidence or actual agent influence.'
 };
}