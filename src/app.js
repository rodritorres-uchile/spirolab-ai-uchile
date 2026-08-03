import { state } from './state.js';
import { appTemplate } from './ui/template.js';
import { drawFlowChart, drawTimeChart } from './ui/charts.js';
import { REFERENCE_CATALOG, predictReference } from './core/reference-engine.js';
import { DISEASES, applyPathology } from './core/pathology-engine.js';
import { generateFlowVolume, integrateVolumeTime, interpolateVolumeAtTime, flowsAtFractions } from './core/curve-engine.js';
import { interpret } from './core/interpretation-engine.js';
import { evaluateFivc } from './core/quality-engine.js';
import { round } from './core/math.js';

document.querySelector('#app').innerHTML = appTemplate();
const $ = id => document.getElementById(id);
function updateGroups(){ const ref=REFERENCE_CATALOG[state.reference]; $('group').innerHTML=ref.groups.map(g=>`<option>${g}</option>`).join(''); state.group=ref.groups[0]; }
function syncControls(){ for(const id of ['fvc','fev1','pef','fivc','resistance','smallAirways','elasticRecoil']){ $(id).value=state[id]; $(`${id}Out`).textContent=id==='resistance'||id==='smallAirways'||id==='elasticRecoil'?`${state[id]}/100`:state[id].toFixed(id==='pef'?1:2); } }
function render(){
  const predicted=predictReference(state); const curve=generateFlowVolume({ ...state, predictedRatio: predicted.ratio, points:220 }); const time=integrateVolumeTime(curve.expiration);
  const generatedFev1=interpolateVolumeAtTime(time,1); const flows=flowsAtFractions(curve.expiration,state.fvc);
  const measured={...state,ratio:state.fev1/state.fvc}; const interpretation=interpret({measured,predicted}); const quality=evaluateFivc(state);
  drawFlowChart($('flowChart'),curve,predicted,{showPredicted:state.showPredicted,showPoints:state.showPoints}); drawTimeChart($('timeChart'),time,state.fvc);
  $('morphologyBadge').textContent=`Excavación ${curve.morphology.scoop.toFixed(2)} · ${DISEASES[state.disease].label}`;
  $('metrics').innerHTML=`${metric('VEF₁/CVF',(state.fev1/state.fvc).toFixed(3))}${metric('FET',`${(time.at(-1)?.time??0).toFixed(1)} s`)}${metric('VEF₁ generado',`${generatedFev1.toFixed(2)} L`)}${metric('Error',`${Math.round(Math.abs(generatedFev1-state.fev1)*1000)} mL`)}`;
  $('interpretation').innerHTML=`<h3>${interpretation.title}</h3><b>Grado funcional por VEF₁: ${interpretation.severity}</b><p>${interpretation.explanation}</p>`;
  const rows=[['CVF',state.fvc,predicted.fvc,interpretation.z.fvc,'L'],['VEF₁',state.fev1,predicted.fev1,interpretation.z.fev1,'L'],['VEF₁/CVF',state.fev1/state.fvc,predicted.ratio,interpretation.z.ratio,''],['PEF',state.pef,predicted.pef,interpretation.z.pef,'L/s'],['CVIF',state.fivc,null,null,'L'],['FEF₂₅',flows.fef25,null,null,'L/s'],['FEF₅₀',flows.fef50,null,null,'L/s'],['FEF₇₅',flows.fef75,null,null,'L/s']];
  $('resultsBody').innerHTML=rows.map(([n,m,p,z,u])=>`<tr><td>${n}</td><td>${Number(m).toFixed(n.includes('/')?3:2)} ${u}</td><td>${p==null?'—':Number(p).toFixed(n.includes('/')?3:2)}</td><td>${p==null?'—':`${Math.round(m/p*100)}%`}</td><td>${z==null?'—':Number(z).toFixed(2)}</td></tr>`).join('');
  $('qualityBox').className=`quality ${quality.acceptable?'good':'bad'}`; $('qualityBox').innerHTML=`<b>Calidad CVIF: ${quality.acceptable?'Aceptable':'Revisar'}</b><p>${quality.message}</p>`;
}
const metric=(label,value)=>`<div><small>${label}</small><b>${value}</b></div>`;
function applyProfile(){ const predicted=predictReference(state); Object.assign(state,applyPathology(predicted,state.disease,state.severity)); state.fivc=round(state.fvc*1.01); syncControls(); $('diseaseNote').textContent=DISEASES[state.disease].description; render(); }
$('reference').addEventListener('change',e=>{state.reference=e.target.value;updateGroups();applyProfile();}); $('group').addEventListener('change',e=>{state.group=e.target.value;render();});
for(const id of ['sex','age','height','disease','severity']) $(id).addEventListener('change',e=>{state[id]=['age','height','severity'].includes(id)?Number(e.target.value):e.target.value; if(id==='disease')$('diseaseNote').textContent=DISEASES[state.disease].description; render();});
for(const id of ['fvc','fev1','pef','fivc','resistance','smallAirways','elasticRecoil']) $(id).addEventListener('input',e=>{state[id]=Number(e.target.value);$(`${id}Out`).textContent=['resistance','smallAirways','elasticRecoil'].includes(id)?`${state[id]}/100`:state[id].toFixed(id==='pef'?1:2);render();});
$('showPredicted').addEventListener('change',e=>{state.showPredicted=e.target.checked;render();}); $('showPoints').addEventListener('change',e=>{state.showPoints=e.target.checked;render();}); $('applyProfile').addEventListener('click',applyProfile);
$('shareBtn').addEventListener('click',async()=>{try{await navigator.share({title:'SpiroLab AI-UCH',url:location.href});}catch{await navigator.clipboard.writeText(location.href);alert('Enlace copiado');}});
updateGroups(); $('reference').value=state.reference; $('sex').value=state.sex; $('age').value=state.age; $('height').value=state.height; $('disease').value=state.disease; $('severity').value=state.severity; $('diseaseNote').textContent=DISEASES[state.disease].description; syncControls(); render();
