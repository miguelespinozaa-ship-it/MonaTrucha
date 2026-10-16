# Estado y pendientes del equipo

Actualizado el **16 de octubre de 2026**. P1 = infraestructura/datos; P2 = frontend/diseño; P3 = contenido/SEO/monetización. Son roles, no usuarios asignados. El estado entregado mantiene anuncios apagados, noindex y robots bloqueado. No se publican fuentes reales ni se simulan licencias o cuentas.

## Trabajo que se puede completar desde código

- [x] **P1 — 2026-10-16:** integrar localmente importador CSV, build Pages, pulido/legales e informe de dependencias en main. README y guías ya no dependen de PR ni del historial remoto.
- [x] **P1 — 2026-10-16:** aplicar las actualizaciones revisadas de parser y Actions, regenerar el lockfile y validar cada etapa con los ocho comandos solicitados.
- [x] **P1/P2 — 2026-10-16:** ejecutar la suite final y revisar noindex, anuncios apagados, robots, CSP/hashes, canónicas, sitemap y 404 del artefacto local.
- [x] **P1 — 2026-10-16:** preparar exportación sin Git ni datos generados, auditar rutas/credenciales detectables, verificar ocultos y contar archivos/lotes para subida manual.
- [x] **P1 — 2026-10-16:** validar instalación, lint, check, build y unitarias desde una copia limpia sin .git ni .env; comprobar el zip contra el inventario.
- [x] **P2 — 2026-10-16:** revisar las cinco plantillas y favoritos en 360/768/1280 px, ambos temas, axe, foco, movimiento reducido, rendimiento >90 y CLS.
- [x] **P2/P3 — 2026-10-16:** cotejar privacidad, derechos y contacto con el almacenamiento y los cargadores reales del código; el titular y los proveedores reales siguen pendientes.

## Preparado sin dar por completado el trabajo externo

- [x] **P1 — preparado 2026-10-16:** lista copiable de variables en `docs/variables-cloudflare.md`, con anuncios/indexación en false, campos de cuentas vacíos y origen reservado pendiente.
- [x] **P1 — preparado 2026-10-16:** guía de subida con ocultos, lotes de 100, límites de tamaño, opción Git, borrados y ajustes del nuevo repositorio en `docs/subida-manual.md`.
- [x] **P1/P3 — preparado 2026-10-16:** 45 tareas de fases 0–3 en `docs/project-tasks.json`; `npm run project:plan` funciona localmente. La importación al tablero requiere el nuevo propietario/proyecto y, opcionalmente, gh autorizado allí.
- [x] **P1 — preparado 2026-10-16:** CODEOWNERS comentado con marcadores de los tres roles, plantillas de issues y `.github/labels.json` para crear etiquetas en el destino. No se han asignado cuentas ni creado issues/etiquetas remotos.
- [x] **P3 — preparado 2026-10-16:** CSV con encabezados y una fila vacía en `docs/lista-series-ejemplo.csv`; guía del importador y plantilla offline en `docs/verificacion-episodio.md`.
- [x] **P2/P3 — preparado 2026-10-16:** `docs/checklist-cmp.md` con campos de proveedor/evidencia vacíos y pruebas de aceptación/rechazo/retirada. No implica certificación ni contrato.
- [x] **P1/P2 — preparado 2026-10-16:** procedimiento de primer Pages en `docs/lanzamiento.md`, con build ficticio verificado, comandos y capturas esperadas. La cuenta y publicación reales no están completadas.

## Decisiones y acciones que requieren personas

### P1 — Infraestructura y datos

- [ ] Elegir con el equipo propietario/repositorio nuevo, visibilidad y colaboradores reales; subir la fuente completa, habilitar Actions y comprobar el primer validate.
- [ ] Proteger main, exigir validate y revisión; completar/descomentar CODEOWNERS con cuentas del destino. Crear las etiquetas y el tablero; importar o copiar las tareas solo en el repositorio nuevo.
- [ ] Crear/conectar Cloudflare Pages y configurar las variables reales. Guardar evidencia del build y URL pública; probar TLS, CSP, canónicas, sitemap, 404, teclado y consentimiento en el dominio real.
- [ ] Decidir/comprar dominio con P3 y configurar DNS y redirecciones que preserven ruta/consulta. Mantener PUBLIC_INDEXING_ENABLED=false y PUBLIC_ADS_ENABLED=false.
- [ ] Obtener el hook real y guardarlo como secreto del repo nuevo si se quiere publicar a diario. Observar la primera ejecución diaria/semanal, sus artefactos y el issue de mantenimiento.
- [ ] Confirmar condiciones y conectividad de Jikan/MyAnimeList con datos revisados por P3; comprobar permisos de imágenes. Las muestras compilan sin API, pero no acreditan una conexión real.
- [ ] Crear la propiedad Search Console con P3 y medir PageSpeed Insights sobre el deployment. Mantener la inyección automática de Web Analytics del panel apagada; preparar analítica del sitio únicamente si se autoriza.

### P2 — Frontend y diseño

- [ ] Revisar con el equipo identidad, maquetas y nombre definitivos. Asignar personas reales a las revisiones de diseño y accesibilidad.
- [ ] Validar navegador, lector de pantalla, almacenamiento bloqueado y dispositivos reales sobre el despliegue, además de las pruebas Chromium simuladas.
- [ ] Probar vídeos, alternativas y portadas reales aportados por P3 desde los países e idiomas revisados; repetir rendimiento/CLS cuando haya proveedores reales.
- [ ] Configurar con P3 la CMP real cuando corresponda: proveedor certificado, mensajes, idiomas, TCF, dominios CSP y pruebas completas. El código no selecciona ni certifica una CMP.

### P3 — Contenido, SEO y monetización

- [ ] Decidir nombre del sitio, país/idioma del público, dominio, titular y correo real de contacto/reclamaciones. Completar identidad, jurisdicción, conservación y derechos de privacidad.
- [ ] Aportar series reales, textos propios de 150–300 palabras, metadatos, portadas/hero y prueba de permiso. Revisar el dry-run del CSV; no publicar automáticamente sus borradores.
- [ ] Verificar por episodio titular, canal y prueba de relación, vídeo completo, audio/subtítulos, permiso de incrustación, regiones realmente revisadas, fecha y alternativa legal específica. Solicitar segunda revisión antes de verified=true.
- [ ] Alcanzar metas del plan con evidencia real: 20 series en fases 0/1 y luego 50 series y 30 artículos definitivos. Las cinco ficciones y cuatro artículos de muestra no cuentan.
- [ ] Asignar quién atiende reclamaciones y correcciones en 24 horas; revisar semanalmente enlaces/vídeos, redes sociales y tráfico real con el equipo.
- [ ] Solicitar y obtener aprobación AdSense, cliente/slots y entrada exacta de ads.txt cuando corresponda. Decidir aplicabilidad y cuenta de CMP con P2; actualizar privacidad con proveedores reales.
- [ ] Acordar titular de cobros, reparto de ingresos y registro mensual de visitas/ingresos. Conservar Auto ads, anclas y viñetas apagados para respetar los slots manuales.

### P1/P2/P3 — Decisión posterior conjunta

- [ ] Asignar nombres reales a los tres roles y la dedicación semanal; registrar revisiones y condiciones de salida con evidencia.
- [ ] Autorizar explícitamente una futura activación de anuncios o retirada de noindex cuando haya contenido, permisos y configuración completos. Esta entrega no ejecuta esas acciones.
