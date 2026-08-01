export function interpret(m,p){
  const obstruction=m.ratio<p.lln.ratio, lowFvc=m.fvc<p.lln.fvc;
  if(obstruction&&lowFvc)return {title:'Patrón mixto probable',detail:'VEF₁/CVF bajo y CVF bajo. Puede corresponder a defecto mixto o a obstrucción con atrapamiento aéreo; confirmar con TLC.',tone:'yellow'};
  if(obstruction)return {title:'Patrón ventilatorio obstructivo',detail:'El cociente VEF₁/CVF se encuentra bajo el límite inferior de normalidad.',tone:'red'};
  if(lowFvc)return {title:'Restricción probable / patrón no específico',detail:'CVF reducida con cociente conservado. La restricción requiere confirmación mediante TLC.',tone:'yellow'};
  return {title:'Espirometría dentro de límites esperados',detail:'VEF₁/CVF y CVF se encuentran sobre sus límites inferiores de normalidad.',tone:'green'};
}
