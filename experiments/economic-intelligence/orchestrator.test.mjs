import test from 'node:test';
import assert from 'node:assert/strict';
import {ROLES,mockAdapters,runProtocol} from './orchestrator.mjs';
test('mock debate visits all roles in order',async()=>{const result=await runProtocol({adapters:mockAdapters()});assert.deepEqual(result.transcript.map(m=>m.role),ROLES);assert.equal(result.connectedProviders,0);assert.ok(result.transcript.every(m=>m.mock));});
test('refuses real provider mode',async()=>{await assert.rejects(runProtocol({adapters:mockAdapters(),mode:'live'}),/disabled/);});
test('refuses missing adapter and uncited claims',async()=>{await assert.rejects(runProtocol({adapters:{}}),/missing adapter/);const adapters=mockAdapters();adapters.quant=async()=>({summary:'Claim',sources:[],limitations:['none']});await assert.rejects(runProtocol({adapters}),/sources required/);});
test('passes prior transcript without mutating it',async()=>{const adapters=mockAdapters();let count=0;for(const role of ROLES){const base=adapters[role];adapters[role]=async input=>{assert.equal(input.history.length,count++);return base(input);};}await runProtocol({adapters});assert.equal(count,4);});
