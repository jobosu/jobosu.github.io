/** Independent, fail-closed audit of the deterministic mock transcript.
 * No network, provider credentials, financial data or real market claims.
 * This is a provenance manifest, NOT an independent verification of claims.
 */
export const PROVENANCE_SCHEMA='jobosu.synthetic-provenance.v1';
const ROLES=['researcher','quant','skeptic','editor'];
const SOURCE=/^synthetic:\/\/[a-z0-9/_-]+$/i;
function validText(value){return typeof value==='string'&&value.trim().length>0&&value.length<=1000;}
export function buildProvenanceLedger(session){
 if(!session||session.mode!=='mock'||session.connectedProviders!==0||session.liveTrades!==0||session.verifiedMarketClaims!==0)throw new TypeError('Only zero-provider, zero-trade mock sessions can be audited');
 if(!Array.isArray(session.transcript)||session.transcript.length!==ROLES.length)throw new TypeError('Incomplete mock transcript');
 const entries=[];
 for(let i=0;i<ROLES.length;i++){
  const m=session.transcript[i];
  if(!m||m.role!==ROLES[i]||m.mock!==true||!validText(m.summary))throw new TypeError('Invalid mock role or claim');
  if(!Array.isArray(m.sources)||m.sources.length===0||m.sources.some(s=>typeof s!=='string'||s.length>300||!SOURCE.test(s)))throw new TypeError('Unverified or external source in mock session');
  if(!Array.isArray(m.limitations)||m.limitations.length===0||m.limitations.some(s=>!validText(s)))throw new TypeError('Explicit limitations required');
  entries.push({
   id:'MOCK-'+String(i+1).padStart(2,'0'),role:m.role,
   claim:m.summary,claimStatus:'UNVERIFIED_SYNTHETIC',
   sourceRefs:[...m.sources],sourceType:'SYNTHETIC_FIXTURE',
   limitations:[...m.limitations],marketEvidence:false
  });
 }
 return {
  schema:PROVENANCE_SCHEMA,kind:'MOCK_EVIDENCE_LEDGER',mode:'mock',
  generatedFrom:'DETERMINISTIC_LOCAL_FIXTURES',simulatedOnly:true,
  connectedProviders:0,liveTrades:0,verifiedMarketClaims:0,
  entries,uniqueSourceRefs:[...new Set(entries.flatMap(e=>e.sourceRefs))].sort(),
  limitations:[
   'All claims and references are fictional demonstrations, not independent market evidence.',
   'No external model, source retrieval, broker, payment or live operation is performed.',
   'This manifest records mock provenance only; it does not certify financial validity.'
  ]
 };
}
