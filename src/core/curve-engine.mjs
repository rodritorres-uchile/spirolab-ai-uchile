export function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
export function smoothstep(t){return t*t*(3-2*t);}
export function morphologyFor({disease='normal',severity=0,airwayResistance=25,smallAirways=15,elasticRecoil=56}={}){
  const catalog={normal:[.78,0,0],asthma:[2.25,.18,.10],bronchitis:[2.75,.24,.14],emphysema:[4.65,.38,.24],bronchiectasis:[2.95,.25,.16],mixedDisease:[3.25,.29,.18],fibrosis:[.66,0,0],obesity:[.82,.02,.01],neuromuscular:[.84,.01,0]};
  const n=catalog.normal,t=catalog[disease]||n,w=clamp(severity/4,0,1),mix=(a,b)=>a+(b-a)*w;
  let exponent=mix(n[0],t[0]),postPeakDrop=mix(n[1],t[1]),terminalCompression=mix(n[2],t[2]);
  const obstructive=['asthma','bronchitis','emphysema','bronchiectasis','mixedDisease'].includes(disease);
  if(obstructive){const r=clamp((airwayResistance/100-.35)/.65,0,1),s=clamp((smallAirways/100-.20)/.80,0,1),e=clamp((.50-elasticRecoil/100)/.50,0,1);exponent+=.45*r+.85*s+1.15*e;postPeakDrop=clamp(postPeakDrop+.08*r+.10*s+.13*e,0,.62);terminalCompression=clamp(terminalCompression+.08*s+.12*e,0,.48);}
  return {exponent,postPeakDrop,terminalCompression,obstructive};
}
export function normalizedExpiratoryFlow(x,settings={}){
  const xPeak=.045;if(x<=0)return 0;if(x<xPeak)return smoothstep(x/xPeak);const u=clamp((x-xPeak)/(1-xPeak),0,1),q=1-u,m=morphologyFor(settings);const drop=1-m.postPeakDrop*smoothstep(clamp(u/.15,0,1));const terminal=1-m.terminalCompression*smoothstep(clamp((u-.48)/.42,0,1));return Math.pow(q,m.exponent)*drop*terminal;
}
