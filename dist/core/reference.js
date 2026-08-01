const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export const systems={
  gli2022:{label:'GLI 2022 Global',groups:['Global']},
  gli2012:{label:'GLI 2012',groups:['Caucásico','Afroamericano','Asiático nororiental','Asiático sudoriental','Otro/mixto']},
  knudson:{label:'Knudson',groups:['Referencia original']},
  gutierrez:{label:'Gutiérrez (Chile)',groups:['Población chilena']}
};
const ethnicFactors={'Caucásico':1,'Afroamericano':.88,'Asiático nororiental':.94,'Asiático sudoriental':.91,'Otro/mixto':.96,'Global':1,'Referencia original':1,'Población chilena':1};
export function predict({age,height,sex,system,group}){
  const male=sex==='M'; const h=height/100; const ef=ethnicFactors[group]??1;
  let fvc,fev1,ratio,pef;
  if(system==='gutierrez'){
    fvc=(male?5.35:3.65)*(h/1.70)**2.25*(1-Math.max(0,age-25)*.0062);
    fev1=fvc*(male?.79:.81)*(1-Math.max(0,age-30)*.0018);
  }else if(system==='knudson'){
    fvc=(male?5.15:3.55)*(h/1.70)**2.35*(1-Math.max(0,age-25)*.0068);
    fev1=fvc*(male?.78:.80)*(1-Math.max(0,age-25)*.0019);
  }else if(system==='gli2012'){
    fvc=(male?5.05:3.55)*(h/1.70)**2.45*Math.exp(-Math.max(0,age-25)*.0060)*ef;
    fev1=fvc*(male?.80:.82)*Math.exp(-Math.max(0,age-25)*.0019);
  }else{
    fvc=(male?5.10:3.60)*(h/1.70)**2.40*Math.exp(-Math.max(0,age-25)*.0058);
    fev1=fvc*(male?.80:.82)*Math.exp(-Math.max(0,age-25)*.0018);
  }
  if(age<18){const growth=clamp((age-3)/15,.08,1);fvc*=growth;fev1*=growth;}
  ratio=fev1/fvc; pef=(male?9.6:7.1)*(h/1.70)**2*(1-Math.max(0,age-35)*.004);
  const sd={fvc:fvc*.12,fev1:fev1*.12,ratio:.055,pef:pef*.18};
  return {fvc,fev1,ratio,pef,sd,lln:{fvc:fvc-1.645*sd.fvc,fev1:fev1-1.645*sd.fev1,ratio:ratio-1.645*sd.ratio,pef:pef-1.645*sd.pef}};
}
export const z=(measured,pred,sd)=>(measured-pred)/sd;
