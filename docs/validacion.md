# Validación de la implementación

Validación local de la versión de demostración: cinco series ficticias, diez episodios sin vídeo y cuatro artículos. El plan original permanece intacto.

## Comprobaciones realizadas

- Instalación repetible con `npm ci`: correcta.
- ESLint y Prettier: correctos.
- TypeScript/Astro: cero errores, advertencias o hints.
- Build estático: correcto, imágenes WebP, sitemap y cabeceras CSP generados.
- Pruebas de contenido y caché: **3 aprobadas**. Incluyen descarga simulada de una portada Jikan, reutilización de caché y rechazo de caché de más de siete días sin API.
- Pruebas de navegador: **20 aprobadas**, móvil y escritorio. Búsqueda, géneros, favoritos, historial, temas, almacenamiento bloqueado, navegación, SEO y carga del iframe solo al pulsar, con fuente simulada.
- Pruebas de anuncios: **10 aprobadas**, móvil y escritorio. Consentimiento, rechazo, revocación, señal TCF, carga diferida, cambio de viewport durante la carga, reserva de tamaños y separación del reproductor. Proveedores y IDs simulados en un build aislado.
- Axe: sin incidencias A/AA en siete páginas representativas, ambos temas y ambos tamaños de pantalla. También se inspeccionó visualmente el inicio en móvil y escritorio.
- Verificador de vídeos: **0 verificados, 0 fallidos, 10 omitidos** por ser placeholders sin vídeo.
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

La publicación en Cloudflare Pages, indexación en Google, fuentes de vídeo reales, aprobación de AdSense y configuración de una CMP certificada pertenecen al lanzamiento descrito en el README. Las acciones de GitHub están preparadas en el repositorio; su ejecución remota depende de subir estos cambios. Los objetivos editoriales de veinte/cincuenta series legales y treinta artículos definitivos siguen pendientes.
