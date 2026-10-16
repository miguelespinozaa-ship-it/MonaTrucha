# Validación del estado final portable

Estado integrado y verificado localmente el **16 de octubre de 2026**. La entrega incluye código fuente y archivos ocultos; no necesita el repositorio anterior, PR, historial ni gh. La instalación mínima se probó con Node 24 y npm desde una copia sin Git, node_modules, dist, .cache ni .env.

## Fusiones y dependencias

Se integraron en main, en este orden: importador CSV, verificador/guía Pages, pulido/legales e informe de dependencias. Después se aplicaron las actualizaciones revisadas de htmlparser2 y de seis Actions. No hubo conflictos que obligaran a descartar cambios: permanecen los comandos del importador, verificación Pages en CI, tres viewports, CSS, textos legales y el informe de dependencias.

Tras **cada una de esas seis fusiones** pasaron lint, format:check, check, test:unit, build, test, test:ads y perf. Desde la etapa Pages también se ejecutó el comprobador aislado de Pages.

| Etapa                   | Unitarias | Navegador | Anuncios simulados | Rendimiento móvil     | CLS |
| ----------------------- | --------: | --------: | -----------------: | --------------------- | --: |
| Importador              |        21 |        26 |                 10 | 99–100                |   0 |
| Pages                   |        21 |        26 |                 10 | 99–100                |   0 |
| Pulido/legales          |        21 |        39 |                 15 | 99–100                |   0 |
| Informe de dependencias |        21 |        39 |                 15 | 99–100                |   0 |
| htmlparser2 12          |        21 |        39 |                 15 | 99–100                |   0 |
| Actions actualizadas    |        21 |        39 |                 15 | 99–100                |   0 |
| Fuente final portable   |        24 |        39 |                 15 | **RENDIMIENTO_FINAL** |   0 |

El informe `revision-dependabot.md` está dentro del zip. El parser directo es 12.0.0; el saneamiento HTML conserva sus dependencias propias. El package-lock se regeneró y npm ci lo instala correctamente. Los workflows conservan validate, comprobación Pages, artefactos ocultos y permisos de jobs; se actualizaron checkout/setup-node/upload a v7, cache a v6, download a v8 y github-script a v9. No se ejecutaron las Actions alojadas ni se publicaron issues o cambios remotos durante esta entrega: P1 debe observarlos en el nuevo repositorio.

## Suite final

- ESLint, Prettier y Astro/TypeScript: correctos, sin diagnósticos.
- **78 pruebas**: 24 unitarias/de integración, 39 de navegador y 15 publicitarias simuladas.
- CSV: comillas/BOM/CRLF/multilínea, texto de 150–300 palabras, campos de vídeo explícitos, verified solo desde el CSV, regiones, duplicados, rutas maliciosas, dry-run, protección de sobrescritura/symlinks y borradores excluidos de publicación.
- Exportación: archivos ocultos conservados, datos generados y entorno privado excluidos, lotes de hasta 100, copia con hash, destinos protegidos y rechazo de credenciales reconocibles/symlinks. Las pruebas usan datos sintéticos aislados y no crean fuentes reales.
- Axe A/AA en doce rutas, temas claro/oscuro y anchos 360/768/1280. Se comprueban teclado, foco, preferencias, reproductor simulado, almacenamiento bloqueado y prefers-reduced-motion.
- 36 capturas de seis vistas × dos temas × tres tamaños. Favoritos conserva espacio y devuelve foco al retirar entradas; los assets mantienen dimensiones y no requieren nuevos proveedores.
- Los anuncios se prueban solo en `.cache/ads-build`, con IDs/proveedores sintéticos interceptados. Ese build no es el artefacto de producción.

## Build y controles de publicación

El build normal tiene **29 HTML**. Todos conservan `noindex,follow` y `adsEnabled:false`; robots contiene `Disallow: /`. `.env.example` mantiene ambas opciones desactivadas. Sitemap, canónicas, Open Graph, imágenes y `_headers` se generan correctamente.

`node scripts/test-pages-build.mjs` compila aparte con el origen **ficticio** `https://proyecto-de-prueba.pages.dev`: 29 páginas, dos hashes CSP ejecutables exactos, dos XML de sitemap y ocho URL públicas del mismo origen. Comprueba permisos YouTube/AdSense en CSP, exclusión de muestras/borradores/favoritos y HTTP local 200/404 con cabeceras. La canónica interna de 404 es `/404/` y permanece noindex. No consulta esa URL ficticia ni publica un proyecto.

El consentimiento y los textos legales se cotejaron con storage/client/services/cmp: localStorage, renovación de preferencias a 180 días, YouTube tras clic separado, analítica por categoría, CMP después de aceptar anuncios cuando se requiere y AdSense sujeto además a TCF. No se completan identidad, contactos o proveedores por inferencia.

## Rendimiento y contenido

Lighthouse móvil local en las cinco rutas del script: ****RENDIMIENTO_FINAL****, accesibilidad 100 y CLS 0, con proveedores desactivados y fuentes autoalojadas. Se conservan los informes en la caché local de validación; no se incluyen en el zip porque son datos generados. No equivalen a PageSpeed Insights sobre un despliegue real ni al coste de anuncios/vídeos reales.

El informe editorial mantiene cinco series ficticias, cuatro artículos de muestra, cero series reales, cero artículos definitivos y cero vídeos verificados. Los diez episodios de demostración se omiten del verificador. Las metas 20/50/30 siguen pendientes y no hacen fallar el informe. No se han inventado fuentes, países, licencias, canales, correos ni usuarios para completar esas metas.

Las referencias internas del build pasan. Los destinos externos inaccesibles por la red se registran como desconocidos, no como enlaces correctos; esa comprobación no acredita derechos ni disponibilidad regional.

## Copia limpia y zip

El inventario se obtuvo sin Git con `scripts/source-files.mjs`. Una copia temporal incluyó todos los archivos fuente/ocultos y excluyó entorno privado y resultados generados. Desde ella pasaron exactamente:

```sh
npm ci && npm run lint && npm run check && npm run build && npm run test:unit
```

No requirió gh, .env, otra rama ni cuentas. La muestra no consultó APIs de anime durante build. El inventario también verifica hashes y límites de tamaño; el zip se contrastó archivo por archivo y no contiene .git, node_modules, dist, .cache, .astro, informes de navegador ni secretos detectables. Cuenta y lotes exactos en `subida-manual.md`.

Pendiente humano: configuración efectiva del repositorio nuevo, Pages, dominio/nombre/correo, Search Console, fuentes/imagen/vídeo con regiones y permisos, AdSense/CMP y decisiones de indexación. `TODO.md` distingue completado, preparado y pendiente por P1/P2/P3.
