# SpiroLab AI-UCH v0.5.1

Versión estable del simulador educativo de espirometría. La raíz contiene un `index.html` autocontenido para GitHub Pages. El código científico nuevo se conserva en `src/core` y tiene pruebas automáticas en `tests`.

## Publicar
Copiar todo el contenido de esta carpeta al repositorio local, hacer commit y push. GitHub Pages debe publicar `main` desde `/(root)`.

## Verificar
Con Node.js instalado:

```bash
npm test
npm run check
```

## Alcance
Las ecuaciones predictivas incluidas siguen siendo aproximaciones educativas y no sustituyen implementaciones GLI oficiales validadas ni software clínico certificado.


## v0.5.1
- Corrige la morfología obstructiva de la rama espiratoria.
- La excavación emerge de resistencia, compromiso de vía aérea pequeña y pérdida de retroceso elástico.
- Mantiene CVF, VEF1 y PEF como restricciones prioritarias.
