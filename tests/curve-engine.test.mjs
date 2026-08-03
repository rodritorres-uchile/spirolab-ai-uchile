import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizedExpiratoryFlow,morphologyFor} from '../src/core/curve-engine.mjs';

test('emphysema is markedly more scooped than normal',()=>{
 const normal={disease:'normal',severity:0};
 const emph={disease:'emphysema',severity:4,airwayResistance:80,smallAirways:90,elasticRecoil:20};
 assert.ok(normalizedExpiratoryFlow(.50,emph)<normalizedExpiratoryFlow(.50,normal)*.25);
 assert.ok(normalizedExpiratoryFlow(.75,emph)<normalizedExpiratoryFlow(.75,normal)*.08);
});

test('asthma has intermediate scooping',()=>{
 const normal={disease:'normal',severity:0};
 const asthma={disease:'asthma',severity:3,airwayResistance:70,smallAirways:70,elasticRecoil:55};
 const n=normalizedExpiratoryFlow(.50,normal),a=normalizedExpiratoryFlow(.50,asthma);
 assert.ok(a<n*.55 && a>n*.05);
});

test('fibrosis does not receive obstructive morphology',()=>{assert.equal(morphologyFor({disease:'fibrosis',severity:4}).obstructive,false);});
