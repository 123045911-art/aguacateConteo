---
trigger: always_on
---

Actúa como un Arquitecto de Software Senior y Lead de Ciberseguridad. Realiza una auditoría exhaustiva de TODO el Workspace actual siguiendo estos ejes:

1. ESTRUCTURA Y ARQUITECTURA: Identifica el patrón de diseño predominante (ej. Hexagonal, Capas, Microservicios). Evalúa si la separación de responsabilidades es adecuada o si hay acoplamiento excesivo.

2. INCONSISTENCIAS TÉCNICAS: Busca discrepancias en estilos de programación, convenciones de nombres (naming conventions) y patrones de diseño entre diferentes módulos o carpetas.

3. ANÁLISIS DE DEPENDENCIAS: Revisa archivos de configuración (package.json, requirements.txt, go.mod, etc.). Detecta librerías redundantes, obsoletas o que presenten riesgos conocidos.

4. PUNTOS CRÍTICOS Y DEUDA: Identifica los "God Objects" (clases/archivos demasiado grandes) y lógica de negocio excesivamente compleja (complejidad ciclomática alta).

5. VULNERABILIDADES: Escanea patrones de código que sugieran fallos de seguridad (inyecciones, exposición de secretos en texto plano, falta de validación de entradas).

6. ESCALAMIENTO Y OPTIMIZACIÓN: Proyecta cuellos de botella ante un incremento de x10 en tráfico o datos. Sugiere mejoras en algoritmos, manejo de memoria y estrategias de caché.

7. MANTENIBILIDAD (EL FACTOR EXTRA): Evalúa la calidad de los comentarios, la cobertura de pruebas (si existen archivos de test) y qué tan fácil sería para un nuevo desarrollador integrarse al proyecto.

SALIDA ESPERADA:
- Un resumen ejecutivo con los 3 hallazgos más urgentes.
- Detalle por cada punto solicitado arriba.
- Un "Plan de Acción" priorizado por impacto (Alto/Medio/Bajo).


Las aplicaciones conectadas como ves, es supabase, vercel y render.