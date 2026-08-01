const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function rawFlow(x,p){
  const [a,b,c]=p; const poly=Math.max(.025,1+b*x+c*x*x);
  return Math.max(.003,Math.pow(Math.max(0,1-x),a)*poly);
}
function normalizeFlow(x,p,pef){return x>=1?0:pef*rawFlow(x,p)/rawFlow(0,p)}
function integrateTimeline(fvc,pef,p,n=1300){
  const arr=[{v:0,t:0,q:pef}];let t=0;const dv=fvc/n;
  for(let i=1;i<=n;i++){const v=i*dv,x=v/fvc;const q=Math.max(.025,normalizeFlow(x,p,pef));t+=dv/q;arr.push({v,t,q:x>=1?0:q});}
  return arr;
}
function volumeAtTime(timeline,target){
  for(let i=1;i<timeline.length;i++)if(timeline[i].t>=target){const a=timeline[i-1],b=timeline[i];const u=(target-a.t)/(b.t-a.t);return a.v+u*(b.v-a.v)}
  return timeline.at(-1).v;
}
function evaluate(input,p){
  const tl=integrateTimeline(input.fvc,input.pef,p); const generatedFEV1=volumeAtTime(tl,1);
  const generated={fef25:normalizeFlow(.25,p,input.pef),fef50:normalizeFlow(.50,p,input.pef),fef75:normalizeFlow(.75,p,input.pef)};
  const e1=(generatedFEV1-input.fev1)/Math.max(.2,input.fev1);
  const ef25=(generated.fef25-input.fef25)/Math.max(.4,input.fef25);
  const ef50=(generated.fef50-input.fef50)/Math.max(.4,input.fef50);
  const ef75=(generated.fef75-input.fef75)/Math.max(.3,input.fef75);
  const regular=Math.max(0,-(1+p[1]*.25+p[2]*.0625))**2+Math.max(0,-(1+p[1]*.5+p[2]*.25))**2;
  return {loss:80*e1*e1+5*ef25*ef25+3*ef50*ef50+2*ef75*ef75+20*regular,tl,generatedFEV1,generated};
}
export function solveCurve(input){
  let p=[1.4,-.25,.05],best=evaluate(input,p),iterations=0;let steps=[.7,.7,.7];
  for(let epoch=0;epoch<18;epoch++){
    let improved=false;
    for(let j=0;j<3;j++)for(const dir of [-1,1]){const cand=[...p];cand[j]+=steps[j]*dir;cand[0]=clamp(cand[0],.25,8);cand[1]=clamp(cand[1],-3,3);cand[2]=clamp(cand[2],-3,4);const ev=evaluate(input,cand);iterations++;if(ev.loss<best.loss){p=cand;best=ev;improved=true;}}
    if(!improved)steps=steps.map(s=>s*.55);
  }
  const exp=[];for(let i=0;i<=220;i++){const v=input.fvc*i/220;exp.push({v,q:i===220?0:normalizeFlow(i/220,p,input.pef)});}
  const insp=[];for(let i=0;i<=90;i++){const u=i/90;insp.push({v:input.fvc*(1-u),q:-input.pif*Math.sin(Math.PI*u)**.72});}
  const fet=best.tl.at(-1).t;
  return {params:p,exp,insp,timeline:best.tl,generatedFEV1:best.generatedFEV1,generatedFEFs:best.generated,fet,loss:best.loss,iterations,coherence:Math.max(0,100-Math.sqrt(best.loss)*7)};
}
