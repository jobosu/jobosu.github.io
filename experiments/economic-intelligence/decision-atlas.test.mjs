import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('./decision-atlas.html',import.meta.url),'utf8');
const script=readFileSync(new URL('./decision-atlas.mjs',import.meta.url),'utf8');

test('decision atlas declares synthetic-only boundaries and uses local modules',()=>{
 assert.match(page,/81 combinacions possibles/);
 assert.match(page,/0 APIs · 0 DADES DE MERCAT · 0 OPERACIONS/);
 assert.match(page,/<script type="module" src="\.\/decision-atlas\.mjs"><\/script>/);
 assert.doesNotMatch(page,/<script[^>]+src=["']https?:/i);
 assert.doesNotMatch(script,/fetch\s*\(|XMLHttpRequest|WebSocket|\.innerHTML\s*=/);
});
test('audited engine is reused, not a parallel source of decisions',()=>{
 assert.match(script,/auditMockDecisionSpace\(\{session,proposal\}\)/);
 assert.match(script,/runProtocol\(\{adapters:mockAdapters\(\),mode:'mock'\}\)/);
 assert.match(script,/value\.totalCombinations!==81/);
 assert.match(script,/value\.statusCounts\?\.MOCK_VETOED!==65/);
 assert.match(script,/value\.statusCounts\?\.MOCK_UNRESOLVED!==15/);
 assert.match(script,/value\.statusCounts\?\.MOCK_RESEARCH_CANDIDATE!==1/);
 assert.match(script,/value\.publicationAuthorized!==false\|\|value\.tradingAuthorized!==false/);
});
test('accessible filter, keyboard controls, inspector and guarded JSON export',()=>{
 assert.match(page,/href="#main">Salta al contingut/);
 assert.match(page,/role="region" tabindex="0"/);
 assert.match(page,/id="atlas-status"[^>]*role="status" aria-live="polite"/);
 assert.match(page,/id="atlas-export" disabled/);
 for(const filter of ['all','MOCK_VETOED','MOCK_UNRESOLVED','MOCK_RESEARCH_CANDIDATE'])assert.ok(page.includes('data-filter="'+filter+'"'));
 for(const key of ['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'])assert.ok(script.includes(key));
 assert.match(script,/vote\.textContent=stanceLabels/);
 assert.match(script,/audit\.tradingAuthorized!==false\|\|audit\.publicationAuthorized!==false/);
 assert.match(script,/document\.createElement\('button'\)/);
 assert.match(page,/@media\(prefers-reduced-motion:reduce\)/);
});

test('premium what-if panel is guarded, accessible and entirely local',()=>{
 assert.match(page,/id="case-sensitivity-summary"[^>]*role="status" aria-live="polite"/);
 assert.match(page,/id="case-sensitivity"[^>]*aria-label=/);
 assert.match(page,/Vuit alternatives fictícies/);
 assert.match(script,/inspectDecisionSensitivity\(audit,index\)/);
 assert.match(script,/sensitivity\.publicationAuthorized!==false\|\|sensitivity\.tradingAuthorized!==false/);
 assert.match(script,/sensitivityList\.replaceChildren\(\)/);
 assert.match(script,/change\.textContent=/);
 assert.doesNotMatch(script,/fetch\s*\(|XMLHttpRequest|WebSocket|\.innerHTML\s*=/);
});
