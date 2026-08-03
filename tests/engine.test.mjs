import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
let src=readFileSync(new URL('../src/core/engine.js',import.meta.url),'utf8').replace(/export\s+/g,'');
const fn=new Function(src+';return {predict,solveSpirometry,interpret};')();
test('solver reproduces target FEV1',()=>{const r=fn.solveSpirometry({fvc:4.4,fev1:3.45,pef:9.2,mode:'linked'});assert.ok(Math.abs(r.generatedFev1-3.45)<0.04)});
test('mixed is probable',()=>{const p=fn.predict({age:45,height:172,sex:'M',reference:'gli2022',group:'Global'});const i=fn.interpret({fvc:2.2,fev1:1.1},p);assert.equal(i.pattern,'Patrón mixto probable')});
