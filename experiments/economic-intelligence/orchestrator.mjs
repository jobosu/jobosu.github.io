/** Deterministic orchestration contract. MOCK ONLY: no external model is called. */
export const ROLES=Object.freeze(['researcher','quant','skeptic','editor']);
const fixtures=Object.freeze({
 researcher:{summary:'Synthetic prices alone cannot establish a real market opportunity.',sources:['synthetic://prices/seed-20261026'],limitations:['No market data or external news.']},
 quant:{summary:'EMA 12/26 can be evaluated on a fixed out-of-sample synthetic window.',sources:['synthetic://prices/seed-20261026'],limitations:['A single scenario is not statistically meaningful.']},
 skeptic:{summary:'Reject profitability claims: synthetic returns are not evidence of an edge.',sources:['synthetic://prices/seed-20261026'],limitations:['No independent data or execution model validation.']},
 editor:{summary:'Publish the methodology, not a claim of financial performance.',sources:['synthetic://prices/seed-20261026'],limitations:['Research-only demonstration; no investment recommendation.']}
});
function validate(role,message){
 if(!message||typeof message!=='object'||typeof message.summary!=='string'||!message.summary.trim()||message.summary.length>1000)throw new TypeError('invalid summary from '+role);
 if(!Array.isArray(message.sources)||!message.sources.length||message.sources.some(s=>typeof s!=='string'||s.length>300))throw new TypeError('sources required for '+role);
 if(!Array.isArray(message.limitations)||!message.limitations.length||message.limitations.some(s=>typeof s!=='string'||!s.trim()))throw new TypeError('limitations required for '+role);
 return {role,summary:message.summary.trim(),sources:[...message.sources],limitations:[...message.limitations]};
}
export function mockAdapters(){return Object.fromEntries(ROLES.map(role=>[role,async()=>structuredClone(fixtures[role])]));}
/** Sequential, auditable message handoff. Caller must supply adapters explicitly. */
export async function runProtocol({adapters,scenario='synthetic',mode='mock'}={}){
 if(mode!=='mock')throw new Error('External providers disabled until credentials, cost limits and security review are configured.');
 if(!adapters||typeof adapters!=='object')throw new TypeError('adapters required');
 const transcript=[];
 for(const role of ROLES){
  if(typeof adapters[role]!=='function')throw new TypeError('missing adapter '+role);
  const response=await adapters[role]({role,scenario,history:structuredClone(transcript)});
  transcript.push({...validate(role,response),mock:true});
 }
 return {mode:'mock',connectedProviders:0,liveTrades:0,transcript,verifiedMarketClaims:0};
}
