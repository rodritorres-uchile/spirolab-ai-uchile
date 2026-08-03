export const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export const round=(v,n=2)=>Number(v.toFixed(n));

export const referenceCatalog={
  gli2022:{label:'GLI 2022 Global',groups:['Global'],age:[3,95]},
  gli2012:{label:'GLI 2012',groups:['Caucásico','Afroamericano','Asia nororiental','Asia sudoriental','Otro/mixto'],age:[3,95]},
  knudson:{label:'Knudson',groups:['Referencia original'],age:[18,85]},
  gutierrez:{label:'Gutiérrez (Chile)',groups:['Población chilena'],age:[18,80]}
};

// Educational prediction engine. Coefficients are deliberately isolated so they can be
// replaced by validated equation packages without changing the UI or curve solver.
export function predict({age,height,sex,reference,group}){
  const h=height/100;
  const male=sex==='M';
  let fvc=(male?5.35:4.45)*Math.pow(h/1.72,2.45)*(1-0.0032*Math.max(0,age-25));
  let ratio=clamp((male?0.82:0.84)-0.00115*Math.max(0,age-20),0.68,0.88);
  let pef=(male?10.2:7.4)*Math.pow(h/1.72,1.85)*(1-0.0022*Math.max(0,age-30));
  const refFactor={gli2022:1,gli2012:0.99,knudson:1.035,gutierrez:0.975}[reference]||1;
  const groupFactor={
    'Caucásico':1,'Afroamericano':0.90,'Asia nororiental':0.94,
    'Asia sudoriental':0.92,'Otro/mixto':0.96,'Global':1,
    'Referencia original':1,'Población chilena':1
  }[group]||1;
  fvc*=refFactor*groupFactor;
  pef*=Math.sqrt(refFactor*groupFactor);
  const fev1=fvc*ratio;
  return {fvc:round(fvc),fev1:round(fev1),ratio:round(ratio,3),pef:round(pef,1),
    sd:{fvc:Math.max(.34,fvc*.105),fev1:Math.max(.30,fev1*.105),ratio:.055,pef:Math.max(.8,pef*.14)}};
}

function smoothstep(t){return t*t*(3-2*t)}
function baseFlow(x,pef,alpha,xPeak=.045){
  if(x<=0)return 0;
  if(x<xPeak)return pef*smoothstep(x/xPeak);
  const q=(1-x)/(1-xPeak);
  return Math.max(0,pef*Math.pow(Math.max(0,q),alpha)*(1-0.08*x));
}

function integrateCurve(flowFn,fvc,steps=1000){
  const points=[]; let t=0; let prevV=0; let prevF=Math.max(.02,flowFn(0.0001));
  for(let i=0;i<=steps;i++){
    const x=i/steps, v=x*fvc, f=Math.max(.015,flowFn(x));
    if(i>0){const dv=v-prevV; t+=dv/Math.max(.02,(f+prevF)/2)}
    points.push({x,v,flow:i===steps?0:f,t}); prevV=v; prevF=f;
  }
  return points;
}

function timeAtVolume(points,target){
  for(let i=1;i<points.length;i++){
    if(points[i].v>=target){
      const a=points[i-1],b=points[i],p=(target-a.v)/(b.v-a.v||1);
      return a.t+p*(b.t-a.t);
    }
  }
  return points.at(-1).t;
}

function interpolateSoftAnchors(x,base,anchors,blend){
  if(!anchors?.length||blend<=0)return base;
  let lo=anchors[0],hi=anchors.at(-1);
  for(let i=1;i<anchors.length;i++){if(x<=anchors[i].x){lo=anchors[i-1];hi=anchors[i];break}}
  const p=clamp((x-lo.x)/(hi.x-lo.x||1),0,1);
  const target=lo.y+(hi.y-lo.y)*smoothstep(p);
  return Math.max(0,base*(1-blend)+target*blend);
}

export function solveSpirometry(input){
  const fvc=Math.max(.3,input.fvc), fev1=clamp(input.fev1,.1,fvc*.99), pef=Math.max(.5,input.pef);
  let lo=.12,hi=8,alpha=1.4,best=null;
  const anchors=input.mode==='advanced' ? [
    {x:.045,y:pef},{x:.25,y:input.fef25},{x:.50,y:input.fef50},
    {x:.75,y:input.fef75},{x:1,y:0}
  ]:null;
  const blend=input.mode==='advanced'?.42:0;
  for(let n=0;n<48;n++){
    alpha=(lo+hi)/2;
    const fn=x=>interpolateSoftAnchors(x,baseFlow(x,pef,alpha),anchors,blend);
    const pts=integrateCurve(fn,fvc);
    const t1=timeAtVolume(pts,fev1);
    best={pts,t1,alpha,fn};
    // More alpha lowers late flows and increases time to FEV1.
    if(t1<1)lo=alpha; else hi=alpha;
  }
  const pts=best.pts;
  const volumeAtTime=t=>{
    for(let i=1;i<pts.length;i++)if(pts[i].t>=t){
      const a=pts[i-1],b=pts[i],p=(t-a.t)/(b.t-a.t||1);return a.v+p*(b.v-a.v)
    }
    return fvc;
  };
  const flowAtFrac=frac=>best.fn(frac);
  const generatedFev1=volumeAtTime(1);
  const fef25=flowAtFrac(.25),fef50=flowAtFrac(.50),fef75=flowAtFrac(.75);
  const mid=pts.filter(p=>p.x>=.25&&p.x<=.75);
  const fef2575=mid.reduce((s,p)=>s+p.flow,0)/Math.max(1,mid.length);
  const timeSeries=[]; const maxT=Math.min(15,Math.max(6,pts.at(-1).t));
  for(let i=0;i<=240;i++){const t=maxT*i/240;timeSeries.push({t,v:volumeAtTime(t)})}
  const insp=[]; for(let i=0;i<=120;i++){
    const x=1-i/120; const u=i/120; const flow=-Math.max(0,pef*.58*Math.sin(Math.PI*u)*(.9+.1*Math.cos(Math.PI*u)));
    insp.push({x,v:x*fvc,flow});
  }
  const error=Math.abs(generatedFev1-fev1);
  const targetErrors=input.mode==='advanced' ? [
    Math.abs(fef25-input.fef25)/(input.fef25||1),Math.abs(fef50-input.fef50)/(input.fef50||1),Math.abs(fef75-input.fef75)/(input.fef75||1)
  ]:[0,0,0];
  const coherence=clamp(100-(error/fvc*900)-targetErrors.reduce((a,b)=>a+b,0)*18,0,100);
  return {flowVolume:pts,timeSeries,inspiration:insp,generatedFev1,fef25,fef50,fef75,fef2575,
    fet:pts.at(-1).t,alpha:best.alpha,coherence,error};
}

export function interpret(measured,pred){
  const zFvc=(measured.fvc-pred.fvc)/pred.sd.fvc;
  const zFev1=(measured.fev1-pred.fev1)/pred.sd.fev1;
  const ratio=measured.fev1/measured.fvc;
  const zRatio=(ratio-pred.ratio)/pred.sd.ratio;
  const lowRatio=zRatio<-1.645,lowFvc=zFvc<-1.645;
  let pattern='Dentro de límites de referencia',detail='No se identifican alteraciones ventilatorias con las variables simuladas.';
  if(lowRatio&&lowFvc){pattern='Patrón mixto probable';detail='La relación VEF₁/CVF y la CVF están bajo el LLN. Debe confirmarse con TLC para diferenciar un defecto mixto de obstrucción con atrapamiento aéreo.'}
  else if(lowRatio){pattern='Patrón obstructivo';detail='La relación VEF₁/CVF está bajo el LLN.'}
  else if(lowFvc){pattern='Restricción probable';detail='La CVF está bajo el LLN con relación conservada. La restricción requiere confirmación mediante TLC.'}
  const sev=zFev1>=-1.645?'Sin reducción':zFev1>=-2.5?'Leve':zFev1>=-4?'Moderada':'Severa';
  return {pattern,detail,severity:sev,z:{fvc:zFvc,fev1:zFev1,ratio:zRatio},ratio};
}
