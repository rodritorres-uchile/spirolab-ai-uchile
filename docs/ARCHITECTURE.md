# Arquitectura

- `index.html`: bundle autocontenido estable para publicación.
- `src/core/reference-engine.mjs`: contrato único para las ecuaciones de referencia.
- `src/core/pathology-engine.mjs`: generación de perfiles fisiopatológicos sin acoplamiento con la interfaz.
- `tests`: pruebas de regresión para impedir errores como llamadas inexistentes a `predict`.

La siguiente migración separará el motor de curvas, la interpretación y la calidad técnica manteniendo la interfaz pública compatible.
