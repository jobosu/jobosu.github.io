/** Deterministic orchestration contract. MOCK ONLY: no external model is called. */
export const ROLES=Object.freeze(['researcher','quant','skeptic','editor']);
const fixtures=Object.freeze({
 researcher:{summary:'Les trajectòries sintètiques no permeten identificar oportunitats reals de mercat.',sources:['synthetic://prices/seed-20261026'],limitations:['No hi ha dades de mercat ni notícies externes.']},
 quant:{summary:'Podem avaluar EMA 12/26 en una finestra sintètica reproduïble, sense optimitzar-la.',sources:['synthetic://prices/seed-20261026'],limitations:['Un únic escenari no té significació estadística per als mercats reals.']},
 skeptic:{summary:'Rebutgem afirmacions de rendibilitat: els resultats sintètics no demostren cap avantatge inversor.',sources:['synthetic://prices/seed-20261026'],limitations:['No hi ha validació amb dades independents ni execució real.']},
 editor:{summary:'Publiquem el mètode i les limitacions, mai una promesa de rendibilitat.',sources:['synthetic://prices/seed-20261026'],limitations:['Demostració de recerca; no constitueix una recomanació financera.']}
});
function validate(role,message){
 if(!message||typeof message!=='object'||typeof message.summary!=='string'||!message.summary.trim()||message.summary.length>1000)throw new TypeError('invalid summary from '+role);
 if(!Array.isArray(message.sources)||!message.sources.length||message.sources.some(s=>typeof s!=='string'||s.length>300))throw new TypeError('sources required for '+role);
 if(message.sources.some(s=>!/^synthetic:\/\/[a-z0-9/_-]+$/i.test(s)))throw new TypeError('mock sources must use synthetic:// for '+role);
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
