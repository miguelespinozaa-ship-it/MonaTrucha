# Validación de la implementación

Validación local de la versión de demostración: cinco series ficticias, diez episodios sin vídeo y cuatro artículos. El plan original permanece intacto.

## Comprobaciones realizadas

- Instalación repetible con `npm ci`: correcta.
- ESLint y Prettier: correctos.
- TypeScript/Astro: cero errores, advertencias o hints.
- Build estático: correcto, imágenes WebP, sitemap y cabeceras CSP generados.
- Pruebas unitarias/de integración de contenido, caché, enlaces, lanzamiento y mantenimiento: **15 aprobadas**. Incluyen descarga simulada de una portada Jikan, reutilización de caché y rechazo de caché de más de siete días sin API.
- Pruebas de navegador: **26 aprobadas**, móvil y escritorio. Búsqueda, géneros, favoritos, historial, temas, almacenamiento bloqueado, navegación, SEO y carga del iframe solo al pulsar, con fuente simulada.
- Pruebas de anuncios: **10 aprobadas**, móvil y escritorio. Consentimiento, rechazo, revocación, señal TCF, carga diferida, cambio de viewport durante la carga, reserva de tamaños y separación del reproductor. Proveedores y IDs simulados en un build aislado.
- Axe: sin incidencias A/AA en doce páginas representativas, ambos temas y anchos de 360 y 1280 px. También se inspeccionó visualmente el inicio en móvil y escritorio.
- Verificador de vídeos: **0 verificados, 0 fallidos, 0 desconocidos, 10 omitidos** por ser placeholders sin vídeo.
- Servidor de desarrollo: inicio, catálogo y episodio responden HTTP 200 con el contenido esperado.

## Lighthouse móvil local

Build de producción, anuncios desactivados, servidor local con CSP. Puntuaciones sobre 100; CLS es el desplazamiento acumulado del diseño.

| Ruta                          | Rendimiento | Accesibilidad | CLS |
| ----------------------------- | ----------: | ------------: | --: |
| /                             |          99 |           100 |   0 |
| /catalogo/                    |         100 |           100 |   0 |
| /series/ecos-de-neon/         |          99 |           100 |   0 |
| /episodios/ecos-de-neon/1/    |         100 |           100 |   0 |
| /articulos/por-donde-empezar/ |         100 |           100 |   0 |

Informes completos en `.cache/performance/`; se regeneran con `npm run perf`. Estos resultados no son PageSpeed Insights sobre Cloudflare ni una medición con proveedores reales activos.

## Publicación y conexiones externas

La petición real a Jikan recibió un rechazo HTTP 403 del proxy de salida. Se guardaron en el borrador del entorno los dominios `api.jikan.moe`, `cdn.myanimelist.net` y `www.youtube.com`, junto con `install_script` y `start_skill`. Hace falta aplicar y publicar esos ajustes para comprobar la conexión real; las muestras funcionan sin API.

La publicación en Cloudflare Pages, indexación en Google, fuentes de vídeo reales, aprobación de AdSense y configuración de una CMP certificada pertenecen al lanzamiento descrito en el README. Las acciones de GitHub están preparadas en el repositorio; los PR de cada bloque se han subido y se comprobará su CI por separado; la ejecución programada depende de fusionarlos en main. Los objetivos editoriales de veinte/cincuenta series legales y treinta artículos definitivos siguen pendientes.

## Bloque 1: preparación editorial

`content:report` informa 0 series reales, 5 muestras, 0 artículos definitivos, 4 muestras editoriales y 0 vídeos verificados. Las series tienen entre 208 y 221 palabras con el contador editorial. Las metas 20/50/30 están pendientes y el comando termina correctamente.

Se añadieron pruebas del informe, rechazo de textos cortos y episodios duplicados, creación de borradores, exclusión de metas y prevención de sobrescritura/escape de rutas. La comprobación humana se prepara con un issue específico y un CSV sin datos reales inventados.

## Bloque 2: calidad

Se amplió axe a doce rutas, en ambos temas y en anchos exactos de 360 y 1280 px. Se añadieron recorridos con teclado, foco del iframe simulado, respeto a movimiento reducido, ausencia de desbordamiento y capturas de las cinco plantillas principales. Se corrigió la vuelta del foco desde el último control de preferencias, el foco recortado de portadas y el contraste transitorio al cambiar de tema (el color de los botones cambia sin interpolación), y se reorganizaron los CTA de fichas en móvil.

El comprobador de enlaces recorrió 29 páginas: 682 referencias internas accesibles, cero fallos y cuatro destinos externos con estado desconocido por fallo de red. No se contaron como éxitos. Las pruebas cubren rutas/anclas inexistentes, HEAD frente a GET, 404/410, 403/429/5xx, timeout y bloqueo de destinos privados/redirecciones.

La suite ampliada completa 26 pruebas de navegador aprobadas y nueve pruebas unitarias/de integración. Lighthouse móvil local tras el pulido mantiene 99–100 en rendimiento, 100 en accesibilidad y CLS 0 en cinco rutas.

## Bloque 3: lanzamiento

Se probó `preflight` con configuración ausente, datos sintéticos aislados, ads.txt incompatible y CMP obligatoria. El modo normal avisa sin cambiar archivos ni variables; el modo estricto falla si falta configuración. No se han activado anuncios ni quitado noindex.

El tablero contiene las 45 tareas de las fases 0–3, con los tres roles y condiciones de salida del plan. Se verificaron identificadores únicos y exclusión de duplicados al reimportar. Se validó la vista previa; no se importó un tablero remoto ni se inventaron responsables. Las capturas de `lanzamiento.md` describen evidencia esperada en cuentas del equipo, no resultados externos obtenidos aquí.

Se compiló una variante aislada con un origen distinto de example.com y `PUBLIC_INDEXING_ENABLED=false`: inicio conserva `noindex,follow` y robots conserva `Disallow: /`. Esto separa la preparación de dominio de una futura autorización de indexación.

## Bloque 4: mantenimiento

Se añadieron Dependabot y un workflow semanal con jobs separados para diagnóstico y publicación de issues. Actionlint validó los workflows; el binario de validación se descargó del release oficial y se comprobó su SHA-256. El publicador se probó con una API simulada: crea un issue por semana, actualiza su bloque generado al repetir, conserva notas humanas y no cambia el estado de un issue cerrado. No se abrió un issue semanal real durante esta tarea.

Las pruebas distinguen 404/410, autor cambiado, fallos de acceso/red, informes ausentes y resultados antiguos. El workflow usa la hora de inicio de cada ejecución y conserva fallos de los comandos. Los informes se suben explícitamente aunque estén en `.cache`; el job de publicación no instala dependencias. Las pruebas editoriales usan fixtures aisladas para que incorporar series reales no falle por un contador fijo de cinco muestras.

Estado editorial actual: cinco muestras, cero series reales, cero artículos definitivos y diez episodios omitidos. Las metas del plan siguen siendo trabajo del equipo. Anuncios apagados e indexación desactivada por defecto.

Verificación final: las 29 páginas HTML del build conservan noindex y `adsEnabled=false`; robots permanece bloqueado. Los PR 1–3 tienen CI remota aprobada tras corregir el contraste transitorio; el bloque 4 incluye los informes y la validación final del conjunto.
