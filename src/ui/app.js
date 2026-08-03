import {referenceCatalog,predict,solveSpirometry,interpret,round,clamp} from '../core/engine.js';

const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const state={age:45,height:172,sex:'M',population:'adult',reference:'gli2022',group:'Global',
  fvc:4.4,fev1:3.45,pef:9.2,mode:'linked',fef25:7.2,fef50:4.5,fef75:1.7,pattern:'normal',showPred:true};

const presets={
 normal:{fvc:4.4,fev1:3.45,pef:9.2},
 mild:{fvc:4.25,fev1:2.75,pef:7.4},
 moderate:{fvc:3.9,fev1:1.95,pef:5.7},
 severe:{fvc:3.35,fev1:1.15,pef:3.8},
 restrictive:{fvc:2.65,fev1:2.25,pef:7.5},
 mixed:{fvc:2.75,fev1:1.35,pef:4.6},
 prism:{fvc:3.15,fev1:2.45,pef:7.0}
};

function setState(k,v){state[k]=v;render()}
function fmt(v,n=2){return Number(v).toFixed(n)}
function path(points,x,y){return points.map((p,i)=>(i?'L':'M')+x(p).toFixed(1)+','+y(p).toFixed(1)).join(' ')}

function drawChart(svg,data,pred,kind){
  const w=720,h=360,m={l:55,r:20,t:24,b:42}; svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const parts=[]; parts.push(`<rect width="${w}" height="${h}" rx="14" class="chart-bg"/>`);
  if(kind==='fv'){
    const maxV=Math.max(6,state.fvc*1.25,pred.fvc*1.2),maxF=Math.max(12,state.pef*1.3,pred.pef*1.2),minF=-Math.max(7,state.pef*.8);
    const x=v=>m.l+v/maxV*(w-m.l-m.r), y=f=>m.t+(maxF-f)/(maxF-minF)*(h-m.t-m.b);
    for(let i=0;i<=6;i++){const v=maxV*i/6;parts.push(`<line x1="${x(v)}" y1="${m.t}" x2="${x(v)}" y2="${h-m.b}" class="grid"/><text x="${x(v)}" y="${h-15}" class="tick" text-anchor="middle">${v.toFixed(1)}</text>`)}
    for(let i=0;i<=6;i++){const f=minF+(maxF-minF)*i/6;parts.push(`<line x1="${m.l}" y1="${y(f)}" x2="${w-m.r}" y2="${y(f)}" class="grid"/><text x="${m.l-10}" y="${y(f)+4}" class="tick" text-anchor="end">${f.toFixed(0)}</text>`)}
    parts.push(`<line x1="${m.l}" y1="${y(0)}" x2="${w-m.r}" y2="${y(0)}" class="axis"/>`);
    if(state.showPred){const pp=solveSpirometry({fvc:pred.fvc,fev1:pred.fev1,pef:pred.pef,mode:'linked'});parts.push(`<path d="${path(pp.flowVolume,x,y)}" class="pred-line"/>`)}
    parts.push(`<path d="${path(data.flowVolume,x,y)}" class="main-line"/><path d="${path(data.inspiration,x,y)}" class="main-line inspiration"/>`);
    [['FEF25',.25,data.fef25],['FEF50',.5,data.fef50],['FEF75',.75,data.fef75]].forEach(([lab,fr,f])=>parts.push(`<circle cx="${x(state.fvc*fr)}" cy="${y(f)}" r="4" class="point"><title>${lab}: ${fmt(f)} L/s</title></circle>`));
    parts.push(`<text x="${w/2}" y="${h-2}" class="label" text-anchor="middle">Volumen (L)</text><text x="15" y="${h/2}" class="label" transform="rotate(-90 15 ${h/2})" text-anchor="middle">Flujo (L/s)</text>`);
  } else {
    const maxT=Math.max(6,Math.min(15,data.fet*1.1)),maxV=Math.max(5.5,state.fvc*1.25,pred.fvc*1.15);
    const x=t=>m.l+t/maxT*(w-m.l-m.r), y=v=>h-m.b-v/maxV*(h-m.t-m.b);
    for(let i=0;i<=6;i++){const t=maxT*i/6;parts.push(`<line x1="${x(t)}" y1="${m.t}" x2="${x(t)}" y2="${h-m.b}" class="grid"/><text x="${x(t)}" y="${h-15}" class="tick" text-anchor="middle">${t.toFixed(0)}</text>`)}
    for(let i=0;i<=5;i++){const v=maxV*i/5;parts.push(`<line x1="${m.l}" y1="${y(v)}" x2="${w-m.r}" y2="${y(v)}" class="grid"/><text x="${m.l-10}" y="${y(v)+4}" class="tick" text-anchor="end">${v.toFixed(1)}</text>`)}
    parts.push(`<path d="${path(data.timeSeries,x,y)}" class="main-line"/><line x1="${x(1)}" y1="${m.t}" x2="${x(1)}" y2="${h-m.b}" class="marker"/><circle cx="${x(1)}" cy="${y(data.generatedFev1)}" r="5" class="point"/><text x="${x(1)+8}" y="${y(data.generatedFev1)-8}" class="annotation">VEF₁ ${fmt(data.generatedFev1)} L</text>`);
    parts.push(`<text x="${w/2}" y="${h-2}" class="label" text-anchor="middle">Tiempo (s)</text><text x="15" y="${h/2}" class="label" transform="rotate(-90 15 ${h/2})" text-anchor="middle">Volumen (L)</text>`);
  }
  svg.innerHTML=parts.join('');
}

function populateRefs(){
  const ref=$('#reference'); ref.innerHTML=Object.entries(referenceCatalog).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('');ref.value=state.reference;
  const groups=referenceCatalog[state.reference].groups; $('#groupWrap').hidden=groups.length===1; $('#group').innerHTML=groups.map(g=>`<option>${g}</option>`).join(''); if(!groups.includes(state.group))state.group=groups[0];$('#group').value=state.group;
}

function render(){
  populateRefs();
  const pred=predict(state);
  const linked=state.mode==='linked';
  const solver=solveSpirometry({...state,fef25:state.fef25,fef50:state.fef50,fef75:state.fef75});
  if(linked){state.fef25=solver.fef25;state.fef50=solver.fef50;state.fef75=solver.fef75}
  const result=interpret(state,pred);
  const ratio=state.fev1/state.fvc;
  $('#ratioValue').textContent=fmt(ratio,3); $('#solverStatus').textContent=`${fmt(solver.coherence,0)}%`;
  $('#solverStatus').className='status '+(solver.coherence>94?'ok':solver.coherence>80?'warn':'bad');
  $('#interpretation').innerHTML=`<div class="diagnosis">${result.pattern}</div><div class="severity">Grado funcional por VEF₁: ${result.severity}</div><p>${result.detail}</p>`;
  const rows=[
    ['CVF',state.fvc,pred.fvc,result.z.fvc,'L'],['VEF₁',state.fev1,pred.fev1,result.z.fev1,'L'],
    ['VEF₁/CVF',ratio,pred.ratio,result.z.ratio,''],['PEF',state.pef,pred.pef,(state.pef-pred.pef)/pred.sd.pef,'L/s'],
    ['FEF₂₅',solver.fef25,null,null,'L/s'],['FEF₅₀',solver.fef50,null,null,'L/s'],['FEF₇₅',solver.fef75,null,null,'L/s'],['FEF₂₅–₇₅',solver.fef2575,null,null,'L/s']
  ];
  $('#resultsBody').innerHTML=rows.map(r=>`<tr><td>${r[0]}</td><td>${fmt(r[1],r[0].includes('/')?3:2)} ${r[4]}</td><td>${r[2]==null?'—':fmt(r[2],r[0].includes('/')?3:2)}</td><td>${r[2]==null?'—':fmt(r[1]/r[2]*100,0)+'%'}</td><td>${r[3]==null?'—':fmt(r[3],2)}</td></tr>`).join('');
  ['fvc','fev1','pef','fef25','fef50','fef75'].forEach(k=>{const el=$(`#${k}`);if(document.activeElement!==el)el.value=state[k];const out=$(`#${k}Out`);if(out)out.textContent=fmt(state[k],k==='pef'?1:2)});
  $$('.advanced-only').forEach(el=>el.hidden=linked); $('#modeLinked').classList.toggle('active',linked);$('#modeAdvanced').classList.toggle('active',!linked);
  $('#consistency').innerHTML=`<b>Coherencia interna:</b> ${fmt(solver.coherence,0)}% · VEF₁ generado ${fmt(solver.generatedFev1)} L · error ${fmt(solver.error*1000,0)} mL · α ${fmt(solver.alpha,2)}`;
  drawChart($('#flowChart'),solver,pred,'fv');drawChart($('#timeChart'),solver,pred,'vt');
}

function bind(){
  ['age','height','fvc','fev1','pef','fef25','fef50','fef75'].forEach(k=>$('#'+k).addEventListener('input',e=>{state[k]=Number(e.target.value);render()}));
  ['sex','population','reference','group'].forEach(k=>$('#'+k).addEventListener('change',e=>{state[k]=e.target.value;if(k==='reference')state.group=referenceCatalog[state.reference].groups[0];render()}));
  $('#modeLinked').onclick=()=>setState('mode','linked');$('#modeAdvanced').onclick=()=>setState('mode','advanced');
  $('#showPred').onchange=e=>setState('showPred',e.target.checked);
  $$('.preset').forEach(b=>b.onclick=()=>{Object.assign(state,presets[b.dataset.preset]);render()});
  $('#fullscreen').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
  $('#print').onclick=()=>window.print();
  $('#share').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('#share').textContent='Enlace copiado';setTimeout(()=>$('#share').textContent='Compartir',1400)}catch{}}
  $$('.nav-btn').forEach(b=>b.onclick=()=>{$$('.nav-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.module').forEach(x=>x.hidden=true);$('#'+b.dataset.module).hidden=false});
}

bind();render();
window.addEventListener('error',e=>{const box=document.createElement('div');box.className='fatal';box.textContent='Error de aplicación: '+e.message;document.body.append(box)});
