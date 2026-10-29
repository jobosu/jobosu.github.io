import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const page=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const menu=readFileSync(new URL('../../labs/index.html',import.meta.url),'utf8');
const dashboard=readFileSync(new URL('./dashboard.mjs',import.meta.url),'utf8');

test('menu links to the research tracker and the module exists',()=>{
 assert.match(menu,/href="\.\.\/experiments\/economic-intelligence\/"/);
 assert.match(page,/<script type="module" src="\.\/dashboard\.mjs"><\/script>/);
});
test('every dashboard and audit element has a unique HTML id',()=>{
 const ids=['ei-chart','ei-scenario','ei-seed','ei-run','ei-run-status','ei-strategy','ei-benchmark','ei-drawdown','ei-trades','ei-fees','ei-robustness-body','ei-audit-status','ei-audit-export','ei-debate-run','ei-debate-export','ei-debate-status','ei-debate-transcript'];
 for(const id of ids){
  const occurrences=page.match(new RegExp('id="'+id+'"','g'))||[];
  assert.equal(occurrences.length,1,'missing or duplicate '+id);
  assert.ok(dashboard.includes("'"+id+"'"),'unused element '+id);
 }
});
test('static UI is honest about simulation and does not load third-party scripts',()=>{
 assert.match(page,/SENSE OPERACIONS REALS/);
 assert.match(page,/trajectòries sintètiques/);
 assert.match(page,/No hi ha debats reals executats/);
 assert.doesNotMatch(page,/<script[^>]+src=["']https?:/i);
 assert.doesNotMatch(dashboard,/fetch\s*\(|XMLHttpRequest|WebSocket/);
});

test('mock debate is clearly disclosed and renders external-shaped content as text',()=>{
 assert.match(page,/MOCK ONLY · 0 APIs · 0 TRADES/);
 assert.match(page,/No són converses entre IA reals/);
 assert.match(dashboard,/runProtocol\(\{adapters:mockAdapters\(\),mode:'mock'\}\)/);
 assert.match(dashboard,/summary\.textContent=message\.summary/);
 assert.doesNotMatch(dashboard,/\.innerHTML\s*=/);
});

test('mock provenance can only be exported after a validated local session',()=>{
 assert.match(page,/id="ei-debate-export" disabled/);
 assert.match(page,/A transparent mock protocol/);
 assert.match(dashboard,/session\.provenance\?\.kind!==\x27MOCK_EVIDENCE_LEDGER\x27/);
 assert.match(dashboard,/provenanceExport\.disabled=false/);
 assert.match(dashboard,/lastMockProvenance\.simulatedOnly!==true/);
 assert.match(dashboard,/jobosu-mock-provenance\.json/);
});
