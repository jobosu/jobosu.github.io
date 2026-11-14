/** Deterministic, fail-closed MOCK adjudication. No external models, network or trading. */
import {buildProvenanceLedger} from './provenance.mjs';

export const DECISION_SCHEMA='jobosu.mock-decision.v1';
const ROLES=Object.freeze(['researcher','quant','skeptic','editor']);
const STANCES=Object.freeze(['SUPPORT','ABSTAIN','VETO']);
const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
const validText=(value,max=500)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
function exactKeys(value,keys,label){
 if(!isRecord(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))throw new TypeError('Invalid '+label+' fields');
}
function validateRefs(refs,allowed,label){
 if(!Array.isArray(refs)||refs.length===0||refs.length>20||new Set(refs).size!==refs.length||refs.some(ref=>typeof ref!=='string'||!allowed.has(ref)))throw new TypeError('Invalid synthetic source references for '+label);
 return [...refs];
}
/** A mock candidate is NEVER evidence, a publication approval or a trading instruction. */
export function adjudicateMockProposal({session,proposal,ballots}={}){
 const ledger=buildProvenanceLedger(session);
 exactKeys(proposal,['id','hypothesis','sourceRefs','simulationOnly'],'proposal');
 if(typeof proposal.id!=='string'||!/^MOCK-[A-Z0-9-]{3,40}$/.test(proposal.id)||!validText(proposal.hypothesis,1000)||proposal.simulationOnly!==true)throw new TypeError('Invalid synthetic proposal');
 const sourceRefs=validateRefs(proposal.sourceRefs,new Set(ledger.uniqueSourceRefs),'proposal');
 if(!Array.isArray(ballots)||ballots.length!==ROLES.length)throw new TypeError('All four mock ballots required');
 const votes=ballots.map((vote,i)=>{
  exactKeys(vote,['role','stance','reason','sourceRefs'],'ballot');
  if(vote.role!==ROLES[i]||!STANCES.includes(vote.stance)||!validText(vote.reason))throw new TypeError('Invalid ordered mock ballot');
  return {role:vote.role,stance:vote.stance,reason:vote.reason.trim(),sourceRefs:validateRefs(vote.sourceRefs,new Set(sourceRefs),vote.role)};
 });
 const vetoRoles=votes.filter(v=>v.stance==='VETO').map(v=>v.role);
 const status=vetoRoles.length?'MOCK_VETOED':votes.every(v=>v.stance==='SUPPORT')?'MOCK_RESEARCH_CANDIDATE':'MOCK_UNRESOLVED';
 return {
  schema:DECISION_SCHEMA,mode:'mock',simulatedOnly:true,
  proposal:{id:proposal.id,hypothesis:proposal.hypothesis.trim(),sourceRefs},
  ballots:votes,status,vetoRoles,
  independentMarketEvidence:false,verifiedMarketClaims:0,connectedProviders:0,liveTrades:0,
  publicationAuthorized:false,tradingAuthorized:false,
  limitations:[
   'All votes are mock inputs; this is not an actual multi-model debate or independent review.',
   'A research candidate is not verified market evidence, an investment recommendation or permission to publish.',
   'Any veto blocks the candidate; no result authorizes financial transactions.'
  ]
 };
}
