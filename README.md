# SpiroLab AI-UCH v1.0 alpha4

Versión completa para GitHub Pages con dos correcciones principales:

1. **CVIF correctamente orientada**: la rama inspiratoria comienza en el final de la espiración (CVF, extremo derecho) y avanza hacia la izquierda.
2. **CurveEngine por cuatro regiones restaurado**: ascenso al PEF, caída pos-PEF, zona media excavada y cola terminal. La excavación aumenta automáticamente al disminuir VEF1/CVF y el solver no puede enderezar la zona media/terminal.

## Publicación

Copiar todo el contenido de esta carpeta a la raíz del repositorio, hacer commit y push. GitHub Pages debe apuntar a `main` y `/(root)`.

## Validación incluida

`npm test` ejecuta comprobaciones de dirección de CVIF, límite de PEF y excavación dependiente del VEF1.

> Herramienta educativa en desarrollo. No usar para decisiones clínicas.
