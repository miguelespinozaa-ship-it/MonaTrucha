# Revisión de las dependencias integradas

Revisión técnica original del 15 de octubre de 2026; actualizaciones aplicadas y revalidadas localmente en main el **16 de octubre de 2026**. El zip incluye este informe y las versiones revisadas, sin requerir PR, historial o acceso al repositorio anterior. No se recomendó esperar por una incompatibilidad conocida. Las notas oficiales se conservan como fuentes externas.

## Parser: htmlparser2 10.1.0 → 12.0.0

Riesgo **medio**, por dos versiones mayores en la herramienta de comprobación de enlaces.

- [v11](https://github.com/fb55/htmlparser2/releases/tag/v11.0.0): solo ESM, Node mínimo 20.19, retirada de `parseDOM` y nuevas versiones mayores de domhandler/domutils/entities. El sitio usa Node 24 e `import { Parser }`, sin `require`, `parseDOM` ni acceso a esas estructuras internas.
- [v12](https://github.com/fb55/htmlparser2/releases/tag/v12.0.0): ajusta el análisis HTML a WHATWG. Cambia raw-text/RCDATA, textarea, comentarios, SVG/MathML y cierres implícitos. Estos cambios pueden variar qué enlaces descubre una herramienta; las pruebas y las 682 referencias del build actual pasan. No se afirma compatibilidad con cualquier HTML futuro.
- La actualización directa es de desarrollo: no modifica el código del navegador ni autoriza contenido, vídeo o derechos. El saneamiento de Markdown conserva sus propias dependencias del lockfile.

**Estado:** aplicado. No hizo falta adaptar el uso de Parser; se regeneró el lockfile y la batería completa pasa con la actualización.

## Automatización: grupo de GitHub Actions

Riesgo **medio**, por seis acciones con cambios mayores y efectos en CI, caché y el informe semanal.

| Actualización y fuentes oficiales                                                                                                                                                                                                       | Incompatibilidad o riesgo revisado                                                                                                                                                            | Aplicación al repositorio                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [checkout 4→7](https://github.com/actions/checkout/releases/tag/v7.0.0), [migración 6](https://github.com/actions/checkout/releases/tag/v6.0.0), [requisitos](https://github.com/actions/checkout/tree/v7#whats-new)                    | Node 24; runner ≥2.327.1. Credenciales en RUNNER_TEMP; Git autenticado desde una acción Docker necesita ≥2.329.0. v7 bloquea código de forks en pull_request_target/workflow_run por defecto. | Ubuntu alojado, sin esas combinaciones de Docker ni triggers privilegiados. Los dos jobs semanales conservan persist-credentials:false; no se habilita allow-unsafe-pr-checkout. |
| [setup-node 4→7](https://github.com/actions/setup-node/releases/tag/v7.0.0), [5](https://github.com/actions/setup-node/releases/tag/v5.0.0), [6](https://github.com/actions/setup-node/releases/tag/v6.0.0)                             | Node 24, ESM, detección automática de caché y retirada de NODE_AUTH_TOKEN ficticio.                                                                                                           | Node 24 en .nvmrc, cache:npm explícito y sin publicación npm ni dependencia de ese token.                                                                                        |
| [cache 4→6](https://github.com/actions/cache/releases/tag/v6.0.0), [5](https://github.com/actions/cache/releases/tag/v5.0.0)                                                                                                            | Node 24 y ESM; runner ≥2.327.1.                                                                                                                                                               | Se conservan las rutas y claves de metadatos; no cambia el ámbito de los triggers.                                                                                               |
| [upload-artifact 4→7](https://github.com/actions/upload-artifact/releases/tag/v7.0.0), [6](https://github.com/actions/upload-artifact/releases/tag/v6.0.0)                                                                              | Node 24 y ESM; archive:false limita subidas directas a un archivo y cambia su nombre.                                                                                                         | No se configura archive:false: siguen los ZIP, nombres y include-hidden-files:true explícito.                                                                                    |
| [download-artifact 4→8](https://github.com/actions/download-artifact/releases/tag/v8.0.0), [5](https://github.com/actions/download-artifact/releases/tag/v5.0.0), [7](https://github.com/actions/download-artifact/releases/tag/v7.0.0) | Cambio de rutas para un único artifact-id; Node 24, ESM y fallo ante digest incorrecto.                                                                                                       | Se descarga por nombre a reports/, por lo que no aplica el cambio por ID. Se conserva la comprobación estricta de integridad.                                                    |
| [github-script 7→9](https://github.com/actions/github-script/releases/tag/v9.0.0), [8](https://github.com/actions/github-script/releases/tag/v8.0.0)                                                                                    | Node 24; require('@actions/github') deja de funcionar; getOctokit es ahora un parámetro inyectado.                                                                                            | El script usa require de node:fs/promises, import dinámico local y el cliente github inyectado. No importa @actions/github ni declara getOctokit.                                |

**Estado:** aplicado a los tres workflows, conservando sus pasos locales y el comprobador Pages. La validación local confirma instalación, formatos, código, build y pruebas; no ejecuta las Actions alojadas. Caché, descarga/publicación y permisos del repositorio nuevo deben observarse en su primera ejecución real. No se lanzó el workflow semanal ni se creó un issue remoto para simular evidencia operativa.

## Comandos y resultados por actualización

En la revisión inicial, cada actualización se probó por separado con npm ci y su lockfile; en esta entrega se revalidó después de integrarla en main:

```sh
npm run lint
npm run check
npm run test:unit
npm run build
npm test
npm run check:links -- --internal-only
npm run perf
```

Los seis comandos solicitados pasan en **ambas** revisiones iniciales: Astro/TypeScript sin diagnósticos, 15 pruebas unitarias/de integración, 26 de navegador (360/1280 px y temas claro/oscuro), build de 29 páginas y 682 referencias internas correctas. La comprobación adicional de enlaces no consulta destinos externos; sus cuatro destinos se registran como omitidos, no como verificados. Los ensayos Lighthouse se ejecutaron por separado para evitar competencia de CPU.

| Ruta                          | Rendimiento parser | Rendimiento Actions | Accesibilidad ambos | CLS ambos |
| ----------------------------- | -----------------: | ------------------: | ------------------: | --------: |
| /                             |                 99 |                  99 |                 100 |         0 |
| /catalogo/                    |                100 |                 100 |                 100 |         0 |
| /series/ecos-de-neon/         |                100 |                  99 |                 100 |         0 |
| /episodios/ecos-de-neon/1/    |                100 |                 100 |                 100 |         0 |
| /articulos/por-donde-empezar/ |                100 |                 100 |                 100 |         0 |

Son mediciones móviles locales con muestras ficticias, sin anuncios ni proveedores de vídeo activos; no equivalen a PageSpeed Insights desplegado. No se añadieron obras, canales, licencias o regiones a producción. Anuncios e indexación conservan su configuración desactivada.

Las cantidades de la tabla son evidencia de la revisión inicial. El resultado actualizado de integración y exportación figura en `validacion.md`. El saneamiento HTML conserva su dependencia propia; la actualización directa del parser es una herramienta de desarrollo, sin cambios de stack ni proveedores activos.
