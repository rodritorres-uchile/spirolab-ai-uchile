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
