/** Exhaustive counterfactual audit of all 3^4 fictional ballot combinations.
 * This is combinatorial coverage, NOT probabilities, independent evidence or AI consensus.
 * No network, providers, money, broker or market inputs are used.
 */
import {adjudicateMockProposal} from './decision-gate.mjs';

export const DECISION_SPACE_SCHEMA='jobosu.mock-decision-space.v1';
const ROLES=Object.freeze(['researcher','quant','skeptic','editor']);
const STANCES=Object.freeze(['SUPPORT','ABSTAIN','VETO']);
const STATUSES=Object.freeze(['MOCK_VETOED','MOCK_UNRESOLVED','MOCK_RESEARCH_CANDIDATE']);

/** Enumerates every possible set of four manual mock votes (81 combinations).
 * Each case is adjudicated by the production mock decision gate, not a duplicated rule.
 * Invalid/non-mock sessions and non-synthetic references fail closed.
 */
export function auditMockDecisionSpace({session,proposal}={}){
 const counts=Object.fromEntries(STATUSES.map(status=>[status,0]));
 const vetoByRole=Object.fromEntries(ROLES.map(role=>[role,0]));
 const outcomes=[];
 for(let index=0;index<STANCES.length**ROLES.length;index++){
  let code=index;
  const ballots=ROLES.map(role=>{
   const stance=STANCES[code%STANCES.length];
   code=Math.floor(code/STANCES.length);
   return {role,stance,reason:'Fictional counterfactual vote; no market analysis.',sourceRefs:proposal?.sourceRefs};
  });
  const decision=adjudicateMockProposal({session,proposal,ballots});
  if(!STATUSES.includes(decision.status)||decision.mode!=='mock'||decision.simulatedOnly!==true||
     decision.connectedProviders!==0||decision.liveTrades!==0||decision.independentMarketEvidence!==false||
     decision.publicationAuthorized!==false||decision.tradingAuthorized!==false){
   throw new Error('Unsafe or unrecognized counterfactual decision');
  }
  counts[decision.status]++;
  for(const role of decision.vetoRoles)vetoByRole[role]++;
  outcomes.push({stances:ballots.map(vote=>vote.stance),status:decision.status,vetoRoles:[...decision.vetoRoles]});
 }
 return {
  schema:DECISION_SPACE_SCHEMA,mode:'mock',simulatedOnly:true,
  roleOrder:[...ROLES],stanceOrder:[...STANCES],totalCombinations:outcomes.length,
  statusCounts:counts,vetoByRole,outcomes,
  independentMarketEvidence:false,connectedProviders:0,liveTrades:0,
  publicationAuthorized:false,tradingAuthorized:false,
  interpretation:'Exhaustive combinations of fictional votes, NOT probabilities or model agreement.',
  limitations:[
   'All 81 cases are synthetic manual-vote permutations, not independent agent deliberations.',
   'The counts do not estimate market outcomes, reliability, likelihood or investment performance.',
   'No result authorizes publishing factual claims or executing transactions.'
  ]
 };
}
