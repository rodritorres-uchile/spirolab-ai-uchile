# SpiroLab AI-UCH v0.1

Primera base funcional del software profesional de simulación de espirometría.

## Publicación inmediata
El archivo `index.html` de la raíz es autocontenido. Para GitHub Pages use:

- Source: Deploy from a branch
- Branch: main
- Folder: /(root)

## Desarrollo
- `src/core/engine.js`: predicción educativa, solver, curvas e interpretación.
- `src/ui/app.js`: estado e interfaz.
- `src/ui/styles.css`: sistema visual.
- `scripts-build.mjs`: genera el `index.html` autocontenido.
- `tests/`: pruebas automáticas.

```bash
npm test
npm run build
```

> Las ecuaciones predictivas incluidas son demostrativas y no están validadas para uso clínico.
