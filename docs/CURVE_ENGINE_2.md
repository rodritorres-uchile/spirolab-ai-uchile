# CurveEngine 2.0

## Modelo por fases

1. Ascenso rápido al PEF.
2. Caída pos-PEF controlada por resistencia.
3. Zona media excavada controlada por el exponente morfológico y vía aérea pequeña.
4. Cola terminal controlada por compresión dinámica y pérdida de retroceso elástico.

El perfil normal usa un exponente menor que 1. Los patrones obstructivos usan exponentes mayores que 1; el enfisema utiliza el mayor exponente y la mayor caída pos-PEF.

El solver conserva el PEF y modifica únicamente una campana de flujo temprano para aproximar el VEF1, de modo que no puede borrar la excavación media-terminal.
