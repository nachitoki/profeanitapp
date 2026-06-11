# Memorias y Apuntes del Proyecto: Plataforma Educativa

Este documento servirá como bitácora y registro de nuestras conversaciones, ideas y decisiones sobre la herramienta educativa para las clases particulares.

## Sesión 1: 10 de Junio de 2026 - Ideación Inicial

**Objetivo Principal:** Ayudar a gestionar clases particulares mediante una plataforma que ofrezca herramientas de estudio, ejercitación y automonitoreo para los estudiantes.

**Características Clave Solicitadas:**
- **Explicaciones:** Módulos de teoría que el estudiante pueda repasar.
- **Ejercitación:** Actividades interactivas tipo juegos.
- **Automonitoreo y Gamificación:** Medición de avances y sistema de logros/recompensas.
- **Personalización:** Cada estudiante tiene su propia experiencia y progreso.
- **Extensibilidad Asistida por IA:** La profesora debe poder usar Antigravity en el futuro para crear y agregar nuevos módulos personalizados según lo que necesite reforzar cada alumno.

**Acciones Tomadas:**
- Se creó este documento de memorias para organizar el progreso.
- Se elaboró un Plan de Implementación (`implementation_plan.md`) y una Hoja de Ruta (Roadmap) inicial.

**Pendientes / Próximos Pasos:**
- [x] Definir la edad de los estudiantes y las materias para ajustar el diseño. (7mo básico a 4to medio, 12-18 años).
- [x] Definir si la aplicación será web pública o de uso local. (100% Online, acceso desde PC/Móvil).
- [x] Elegir el método de autenticación. (Simple y seguro, a definir detalles en implementación).
- [x] Aprobar el Roadmap para iniciar el desarrollo técnico (Aprobado).

**Decisiones de Diseño Adicionales:**
- **Estética:** Juvenil (12-18 años), moderna y responsiva (para móviles).
- **Personalización por Intereses:** El perfil del alumno guardará sus "intereses" (ej: fútbol, espacio) y la IA generará los módulos utilizando esas temáticas para hacerlos más atractivos.
- **Mecánicas de Ejercitación Variadas:** El sistema será modular. Antigravity no solo generará preguntas de alternativa, sino que podrá seleccionar el "tipo de juego" (ej: agrupar elementos, grillas interactivas, rellenar espacios, problemas de planteo) y el Frontend renderizará el componente interactivo correspondiente.
- **Economía Dual y Modo Infinito:** Las misiones principales (creadas por la profesora) otorgan Puntos de Experiencia (XP) para subir de Nivel. El modo de "Práctica Infinita" otorga "Monedas" para evitar la inflación de niveles.
- **Generación de Ejercicios:** La práctica infinita NO utilizará IA en tiempo real (para evitar alucinaciones y perder control de calidad). En su lugar, utilizará scripts de generación matemática procedimental integrados en la aplicación (o bancos de preguntas pre-cargados).
- **Panel de Profesora:** Se incluirá un dashboard para la profesora con seguimiento de avance detallado.
- **Flujo de Creación de Contenido:** La creación de módulos con IA (Antigravity) se realizará fuera de la plataforma (ej. localmente), y el JSON resultante se asignará a los estudiantes a través del panel de control de la profesora. La profesora podrá usar este panel para otorgar recompensas manuales (Monedas/Regalos).
- **Tienda y Avatares (PAUSADO):** Queda pendiente conversar con la profesora sobre la estética y los ítems que se podrán comprar con las monedas (avatares, personalización, etc.) antes de implementarlo.
- **Evaluación Diagnóstica (Modo Campaña):** La plataforma soporta exámenes de entrada. Las preguntas estarán etiquetadas (ej: Cálculo, Comprensión Lectora) y generarán un gráfico de Radar/Barras visible tanto para la profesora (estadísticas duras) como para el alumno (perfil de habilidades).
- **Ingesta de Conocimiento (Syllabus):** Los programas de estudio oficiales se desglosarán en archivos Markdown puros. Antigravity leerá estos archivos como contexto para generar los módulos de diagnóstico y estudio de manera precisa y acorde al curso.
- **Aula Virtual (Recursos Externos):** Para minimizar costos, los PDFs, Videos y sitios web se compartirán incrustando URLs (ej. Drive, YouTube) en vez de subir los archivos al servidor. El alumno recibirá XP al hacer clic y estudiar el material, y la profesora recibirá una confirmación de lectura en su panel.
