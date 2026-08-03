import test from 'node:test';
import assert from 'node:assert/strict';
import {predictReference,REFERENCE_CATALOG} from '../src/core/reference-engine.mjs';
test('all references return finite predictions',()=>{
 for(const [reference,cfg] of Object.entries(REFERENCE_CATALOG)){
  const p=predictReference({age:45,height:172,sex:'M',reference,group:cfg.groups[0]});
  for(const key of ['fvc','fev1','ratio','pef']) assert.equal(Number.isFinite(p[key]),true,`${reference}.${key}`);
 }
});
test('unknown reference fails clearly',()=>assert.throws(()=>predictReference({age:45,height:172,sex:'M',reference:'x',group:'Global'}),/desconocida/));
