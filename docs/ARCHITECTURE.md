# Arquitectura

SpiroLab AI-UCH está dividido en dos productos reutilizables:

## `spirolab-core`
Motor independiente de la interfaz. Contiene:

- `solver.js`: genera las curvas y minimiza la discrepancia entre VEF₁ objetivo, PEF y flujos instantáneos.
- `reference.js`: interfaz común para ecuaciones de referencia.
- `interpretation.js`: árbol interpretativo basado en LLN.
- `index.js`: API pública del motor.

CVF, VEF₁ y PEF se tratan como objetivos prioritarios. FEF₂₅, FEF₅₀ y FEF₇₅ son restricciones blandas.

## `spirolab-ui`
Interfaz web desacoplada. Puede reemplazarse por React, una aplicación móvil o escritorio sin modificar el motor.

## `dist`
Versión construida y publicable. GitHub Pages solo necesita esta carpeta.

## Flujo de datos

Paciente virtual → referencia → solver → curvas → interpretación → interfaz.
