import test from 'node:test';
import assert from 'node:assert/strict';
import {applyPathology,finalizePathology,DISEASE_PROFILES} from '../src/core/pathology-engine.mjs';
const base={age:45,height:172,sex:'M',reference:'gli2022',group:'Global',diseaseSeverity:3};
test('every disease profile produces coherent finite outputs',()=>{
 for(const disease of Object.keys(DISEASE_PROFILES)){
  const s=finalizePathology(applyPathology({...base,disease}));
  assert.ok(s.fvc>0);assert.ok(s.fev1>0&&s.fev1<s.fvc);assert.ok(s.pef>0);
  assert.ok(s.airwayResistance>=0&&s.airwayResistance<=100);
 }
});
