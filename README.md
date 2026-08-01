# SpiroLab AI-UCH Platform 1.1 FIX

La raíz contiene un `index.html` autocontenido (CSS + JavaScript integrados) para evitar fondos blancos o rutas rotas en GitHub Pages.

## Publicación simple
En Settings → Pages seleccione **Deploy from a branch**, rama `main`, carpeta `/(root)`.

## Desarrollo
Las carpetas `spirolab-core`, `spirolab-ui`, `tests`, `validation`, `docs` y `examples` conservan la arquitectura profesional. La carpeta `dist` también contiene la versión autocontenida.

# SpiroLab AI-UCH

Plataforma modular para simulación, docencia e investigación en espirometría.

## Estructura

- `spirolab-core/`: motor fisiológico, referencias e interpretación.
- `spirolab-ui/`: interfaz web.
- `docs/`: arquitectura y hoja de ruta.
- `validation/`: vectores y protocolo de validación.
- `examples/`: casos clínicos simulados.
- `tests/`: pruebas de integración.
- `dist/`: aplicación lista para publicar.

## Publicación en GitHub Pages

### Método recomendado: GitHub Actions

1. Sube todo el contenido de este proyecto a la raíz del repositorio.
2. Ve a **Settings → Pages**.
3. En **Source**, selecciona **GitHub Actions**.
4. Cada cambio en `main` ejecutará pruebas, construirá `dist` y publicará automáticamente.

### Método manual

Publica el contenido de `dist/` en la raíz o en una rama destinada a Pages.

## Desarrollo local

```bash
npm test
npm run build
npm run dev
```

Abre `http://localhost:8080`.

## Estado clínico

La implementación actual es educativa. Las ecuaciones de referencia son aproximaciones y deben reemplazarse por implementaciones validadas antes de cualquier uso clínico.
