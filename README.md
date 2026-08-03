# SpiroLab AI-UCH v1.0 alpha

Repositorio completo de la plataforma educativa de simulación de espirometría.

## Publicar en GitHub Pages

La raíz ya contiene `index.html`, `src/` y `styles/`. Configure Pages como **Deploy from a branch → main → /(root)**.

## Pruebas y compilación

No requiere instalar dependencias:

```bash
npm test
npm run build
```

`dist/` contiene una copia lista para publicación.

## Advertencia

Las ecuaciones de referencia son aproximaciones educativas aisladas en `src/core/reference-engine.js`. No usar para decisiones clínicas hasta sustituirlas por implementaciones oficiales y validar todo el motor.


## Corrección alpha 2 — dirección de la CVIF

La rama inspiratoria comienza en el extremo final de la curva espiratoria (CVF, lado derecho) y progresa de derecha a izquierda. Si CVIF = CVF, termina en 0 L. Si CVIF difiere de CVF, el extremo inspiratorio queda desplazado respecto del origen por CVF − CVIF.
