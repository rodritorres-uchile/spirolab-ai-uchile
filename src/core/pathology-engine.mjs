import { predictReference } from './reference-engine.mjs';
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export const DISEASE_PROFILES=Object.freeze({
 normal:{base:{fvc:1,ratio:.82,pef:1,r:25,s:12,e:56}},
 asthma:{base:{fvc:.95,ratio:.72,pef:.82,r:48,s:48,e:55}},
 emphysema:{base:{fvc:.88,ratio:.57,pef:.62,r:70,s:76,e:30}},
 bronchitis:{base:{fvc:.88,ratio:.60,pef:.66,r:78,s:68,e:46}},
 fibrosis:{base:{fvc:.63,ratio:.86,pef:.83,r:18,s:12,e:82}},
 obesity:{base:{fvc:.80,ratio:.82,pef:.85,r:30,s:22,e:55}},
 neuromuscular:{base:{fvc:.68,ratio:.84,pef:.58,r:22,s:15,e:52}},
 bronchiectasis:{base:{fvc:.84,ratio:.65,pef:.68,r:62,s:72,e:48}},
 mixedDisease:{base:{fvc:.64,ratio:.60,pef:.60,r:72,s:72,e:48}},
});
export function applyPathology(state,{randomize=false,random=Math.random}={}){
 const profile=DISEASE_PROFILES[state.disease]??DISEASE_PROFILES.normal;
 const p=predictReference(state);
 const strength=clamp(Number(state.diseaseSeverity)||0,0,4)/4;
 const jitter=(v)=>randomize?v*(.94+random()*.12):v;
 const ratio=clamp(.82+(profile.base.ratio-.82)*strength,.28,.92);
 return {...state,
  fvc:clamp(jitter(p.fvc*(1+(profile.base.fvc-1)*strength)),.45,8),
  fev1:0,pef:clamp(jitter(p.pef*(1+(profile.base.pef-1)*strength)),1,14),
  airwayResistance:Math.round(25+(profile.base.r-25)*strength),
  smallAirways:Math.round(12+(profile.base.s-12)*strength),
  elasticRecoil:Math.round(56+(profile.base.e-56)*strength),mode:'linked',
  __ratio:ratio,
 };
}
export function finalizePathology(state){const s={...state};s.fev1=clamp(s.fvc*s.__ratio,.2,s.fvc*.98);delete s.__ratio;return s;}
