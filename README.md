# Yoru · sitio-anime

Sitio estático de anime construido con **Astro 7 y TypeScript estricto**, preparado para Cloudflare Pages. `plan-sitio-anime.md` es la fuente de verdad editorial y de producto. **Yoru es un nombre provisional.**

Implementa inicio, catálogo, fichas, episodios, guías/reseñas/noticias, calendario, favoritos e historial local, temas oscuro/claro, SEO, consentimiento y espacios publicitarios. Incluye **cinco series ficticias**, diez episodios sin vídeo y cuatro artículos de demostración. No se atribuyen licencias ni se incrustan capítulos inventados.

Resultados de las pruebas y mediciones: [validación local](docs/validacion.md).

Las capacidades técnicas de las fases 0–2 están implementadas. Sus condiciones externas —publicación, veinte/cincuenta series legales, treinta artículos definitivos, indexación y tráfico— todavía requieren trabajo editorial y cuentas del equipo. No se simulan esos resultados. La fase 3 está preparada y desactivada.

## Desarrollo

Requisitos: Node.js 24 (ver `.nvmrc`) y npm. En este entorno trabaja en `/workspace/sitio-anime`; cada tarea ya está aislada, sin necesidad de un worktree.

```sh
npm ci
cp .env.example .env
npm run dev
```

`predev` prepara la caché de metadatos. El servidor de desarrollo usa el puerto 4321 y escucha en todas las interfaces. La telemetría de Astro está desactivada. `.env` está ignorado: nunca guardes claves en Git. Las variables `PUBLIC_` se incluyen en el HTML/JavaScript público y no pueden contener secretos.

```sh
npm run lint
npm run format:check
npm run check
npm run test:unit
npm run build
npm test
npm run test:ads
npm run perf
npm run verify:videos
```

Las pruebas de navegador requieren Chromium. Se usa `/usr/bin/chromium` si está disponible; fuera de este entorno ejecuta `npx playwright install chromium` o configura `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. `npm test` necesita un `dist/` recién compilado. El servidor de pruebas aplica las cabeceras CSP de Cloudflare; `astro preview` no las aplica. Las pruebas publicitarias compilan una variante aislada en `.cache/ads-build`, con identificadores ficticios y proveedores simulados; no sirven anuncios reales.

`npm run perf` usa Chromium/Lighthouse en modo móvil simulado y guarda informes en `.cache/performance`. Comprueba rendimiento >90 y CLS ≤0,05 en cinco rutas representativas. No equivale a PageSpeed Insights sobre una web desplegada ni predice el coste de anuncios y vídeos reales. El sitio de muestra usa `noindex` y `robots.txt` bloqueado mientras el dominio sea `example.com`.

## Estructura

```text
src/
  assets/                  ilustraciones originales y portadas locales
  components/              tarjetas, navegación, Player, AdSlot, Consent
  content/series/*.md       una ficha por serie y sus episodios
  content/articles/*.md     artículos propios
  content.config.ts        esquemas validados al compilar
  data/                    configuración y acceso al catálogo
  layouts/                 plantilla común, SEO y páginas legales
  pages/                   rutas estáticas y search-index.json
  scripts/                 búsqueda, almacenamiento, consentimiento y servicios
  styles/global.css        tokens, temas, responsive y movimiento reducido
scripts/                   metadatos, vídeos, CSP y validación
public/                    ads.txt, _headers, favicon y Open Graph
.github/workflows/         CI por PR/main y actualización diaria
.cache/                    metadatos e informes locales, ignorados
```

No hay backend, base de datos, cuentas, comentarios ni sincronización. Las búsquedas usan los datos del HTML generado; `search-index.json` ofrece también el índice completo para futuras integraciones. Favoritos, tema y hasta veinte últimos episodios visitados viven en localStorage. El historial registra visitas, no minutos vistos. Si el navegador bloquea el almacenamiento, las funciones básicas siguen disponibles sin persistencia.

## Añadir una serie

Copia una ficha de `src/content/series/` con un nombre de archivo único en kebab-case. Su nombre determina `/series/<nombre>/`. Conserva todos los campos del esquema:

```yaml
---
title: Título real
subtitle: Una frase editorial propia
description: Resumen breve para SEO
cover: ../../assets/mi-portada.jpg
hero: ../../assets/mi-hero.jpg
accent: pink # pink, blue, mint, amber o purple
genres: [Aventura, Fantasía]
year: 2026
format: Serie # o Película
status: Completa # En emisión, Completa o Próximamente
duration: 24
placeholder: false
featured: true
apiId: null # ID numérico de MyAnimeList si usas Jikan
schedule:
  day: 1 # 0 domingo, 1 lunes … 6 sábado
  time: '20:00'
  note: 'Hora de Ciudad de México · disponibilidad revisada'
episodes:
  - number: 1
    title: Título del episodio
    youtubeId: null # ID real de 11 caracteres, solo tras revisión
    officialChannel: null
    verified: false
    regions: []
    legalUrl: https://www.crunchyroll.com/
---
Texto original de entre 150 y 300 palabras: de qué va, para quién es y por dónde empezar.
```

Un episodio puede tener solo enlace legal y ningún vídeo. Para incrustar un capítulo, registra `youtubeId`, `officialChannel`, `verified: true` y regiones revisadas. Los canales admitidos están en `scripts/content.mjs`: `@MuseAsia`, `@AniOneAsia`, `@crunchyroll`, `@TMSanime`, `@GundamInfo`. Cualquier ampliación debe revisarse editorialmente. Usa un enlace a la obra o temporada específica como alternativa; el ejemplo genérico anterior debe sustituirse.

**Un canal oficial no garantiza que un vídeo sea un episodio completo ni que pueda verse en todos los países.** Verifica titular, episodio, idioma, regiones y permiso de incrustación manualmente. Nunca subas episodios ni uses reproductores de sitios pirata. El build rechaza vídeos sin revisión o asignados a fichas ficticias. `npm run verify:videos` consulta YouTube oEmbed, comprueba disponibilidad y coincidencia de autor y guarda `.cache/video-report.json`. No demuestra derechos ni geobloqueo; los skips se distinguen de los vídeos verificados.

El reproductor usa YouTube en modo de privacidad mejorada y solo crea un iframe al pulsar. Antes de esa acción no carga miniaturas remotas ni recursos de YouTube. Las muestras ficticias no ofrecen un botón activo de reproducción.

### Metadatos y portadas

Con `placeholder: false` y `apiId` numérico, el build consulta **Jikan v4**, guarda título, sinopsis, géneros y portada en `.cache/anime-metadata.json`, y descarga la portada desde `cdn.myanimelist.net`. Astro optimiza esa imagen local. La ficha mantiene su título y reseña editorial; los datos de API se muestran aparte como referencia atribuida. `cover` sigue siendo el fallback local y `hero` es una imagen editorial que debe tener permiso de uso.

La caché dura 24 horas. Si la API falla, se permite una copia de hasta siete días; una copia más antigua hace fallar la compilación. Las consultas se espacian un segundo y `--force` fuerza actualización. No se consulta Jikan para ficciones. Las portadas remotas descargadas están ignoradas y se regeneran en cada entorno nuevo.

Dominios necesarios al incorporar series reales: `api.jikan.moe`, `cdn.myanimelist.net` y `www.youtube.com`. En entornos con red restringida, añádelos a la configuración sin sustituir otras reglas. Revisa las condiciones vigentes de Jikan/MyAnimeList y los permisos de las imágenes antes del uso comercial.

## Añadir un artículo

Crea `src/content/articles/<slug>.md`:

```yaml
---
title: Una guía original
description: Un resumen para buscadores y redes
category: Guías # Guías, Reseñas o Noticias
date: 2026-10-09
author: Tu nombre o equipo
cover: ../../assets/mi-hero.jpg
minutes: 5
placeholder: false
---
## Un primer apartado
Texto original en Markdown.
```

El contenido se sanitiza al generar HTML y admite párrafos, encabezados, listas y enlaces. Se intercalan `AdSlot` in-article cada tres párrafos, salvo después del último bloque. Las fichas y artículos `placeholder` usan `noindex` y se excluyen del sitemap. Los artículos definitivos deben aportar información propia y comprobable; no multipliques muestras para aparentar un catálogo real.

## Anuncios y consentimiento

Configuración central: `src/data/site.ts`, leída desde `.env` o las variables de Cloudflare. `AdSlot` admite `banner`, `rectangle`, `vertical` e `in-article`, reserva dimensiones y etiqueta «Publicidad». Con `PUBLIC_ADS_ENABLED=false` muestra un hueco discreto en desarrollo y **no genera ningún anuncio en producción**.

Para activar después de la aprobación:

1. Configura dominio propio, contenido definitivo, titular y páginas legales.
2. Introduce `PUBLIC_ADSENSE_CLIENT_ID=ca-pub-...` y los cinco `PUBLIC_AD_SLOT_*` de `.env.example`.
3. Desactiva **Auto ads, anuncios ancla y viñetas** en AdSense. El límite de este sitio controla sus slots manuales; no puede controlar anuncios que Google añada automáticamente desde su panel.
4. Donde Google lo exija —por ejemplo EEE, Reino Unido y Suiza— elige una **CMP certificada por Google** con IAB TCF v2. Configura su proyecto, mensajes, vendor Google (755) y propósitos; define `PUBLIC_CMP_REQUIRED=true` y `PUBLIC_CMP_SCRIPT_URL` con el cargador público del proveedor.
5. Revisa los dominios adicionales de la CMP y sus recursos en `_headers`. El generador añade el origen de su cargador a script/connect/frame; otros orígenes del proveedor requieren reglas explícitas. Prueba el consentimiento en el dominio real.
6. Activa `PUBLIC_ADS_ENABLED=true`, recompila y sustituye la línea comentada de `public/ads.txt` por la entrada exacta de Google.

El banner propio permite aceptar/rechazar/configurar anuncios y analítica, pero **no es una CMP certificada**. El adaptador de `src/scripts/cmp.ts` impide cargar AdSense, cuando `CMP_REQUIRED=true`, hasta recibir señal TCF válida de la CMP (o `gdprApplies=false`). Su criterio conservador exige consentimiento a Google y a los propósitos 1, 2, 3, 4, 7, 9 y 10. No inventa una cadena TCF ni certifica un proveedor. La URL por sí sola tampoco sustituye configurar los mensajes del proveedor. Antes de cada carga se exige además aceptación en nuestro banner.

La CMP se solicita solo después de aceptar anuncios; AdSense espera su señal. Cloudflare Web Analytics, configurado con `PUBLIC_CF_ANALYTICS_TOKEN`, espera aceptación separada. Las preferencias caducan a los 180 días. Retirarlas recarga la página para detener scripts activos; no puede borrar cookies ajenas del proveedor.

Las posiciones son bajo el menú (excepto páginas de episodio), entre secciones del inicio, lateral sticky de escritorio, cada tres párrafos y debajo del bloque de reproducción y navegación. Nunca hay un anuncio delante del reproductor, superpuesto ni adyacente: existe una separación de al menos 48 px además del contenido intermedio. Se cargan al acercarse al viewport y se limita a tres slots visibles por pantalla. El espacio se conserva aunque el proveedor esté bloqueado para evitar saltos.

## Cloudflare Pages

1. Sube los cambios al repositorio y crea un proyecto **Pages** conectado a GitHub.
2. Rama de producción: `main`. Framework: Astro. Comando de build: `npm run build`. Directorio de salida: `dist`. Node: `24` (la fijación `.nvmrc` también está incluida).
3. Define las variables públicas de `.env.example` en el proyecto. Establece `PUBLIC_SITE_URL` con el origen HTTPS definitivo, sin ruta ni barra final.
4. Prueba una URL de Pages, las rutas, `404`, CSP, canónicas y vídeo antes de conectar el dominio propio. No hay adaptador de servidor ni Workers necesarios.
5. Conecta el dominio y configura la redirección permanente desde el subdominio anterior mediante Cloudflare. Actualiza canónicas/Search Console si cambia el origen.

`public/_headers` declara CSP, protección de iframes del sitio, tipos MIME y política de referencia. El build genera `dist/_headers` con hashes de los scripts inline ejecutables; **publica siempre el resultado completo de `npm run build`**. Permite YouTube, AdSense y analítica, sin `unsafe-inline` para scripts; los estilos inline se permiten para el proveedor publicitario. Los assets con hash se cachean durante un año. Las fuentes Outfit y DM Sans se autoalojan con sus licencias Fontsource; no se conecta con Google Fonts.

## CI, recompilación y lanzamiento

`ci.yml` ejecuta instalación con lockfile, ESLint, Prettier, chequeo TypeScript/Astro, pruebas de contenido, build y navegador por PR y en `main`. `daily.yml` actualiza metadatos, verifica vídeos, compila y conserva un informe **cada día a las 06:20 UTC**. Un error de vídeo hace fallar la acción; configura notificaciones de GitHub para revisar el informe.

Para que esa acción publique también, crea un Deploy Hook de Pages y guarda la URL como secreto de GitHub **`CLOUDFLARE_DEPLOY_HOOK`**. Sin ese secreto, la acción valida el build pero no publica. Las compilaciones de Pages al recibir un push siguen funcionando a través de la integración GitHub. No pongas el hook en una variable `PUBLIC_`.

Configura protección de `main` con revisión de otra persona y el check `validate` requerido. Usa la plantilla de issue de contenido y crea el tablero de GitHub Projects con las fases del plan. Ninguna de esas configuraciones administrativas se ha cambiado desde el entorno.

Para indexar, publica primero contenido definitivo y configura el dominio. Verifica la propiedad en Google Search Console con DNS o `PUBLIC_GOOGLE_SITE_VERIFICATION`, y envía `/sitemap-index.xml`. Activar Cloudflare Web Analytics requiere un token público de beacon. Vuelve a medir con PageSpeed Insights en el dominio real y después de activar cada proveedor.

## Lo que depende del equipo

- **Nombre del sitio:** cambiar `PUBLIC_SITE_NAME` (provisional: Yoru) y la autoría de los artículos.
- **Dominio:** comprar/conectar el dominio y fijar `PUBLIC_SITE_URL`.
- **AdSense:** aprobación, ID, cinco slots, ads.txt definitivo y CMP certificada donde corresponda.
- **Correo de contacto:** `PUBLIC_CONTACT_EMAIL`, titular y responsable de reclamaciones. Sin correo la página explica que todavía no existe canal público.
- **Editorial:** público/país, veinte series legales en fase 0/1; cincuenta series y treinta artículos definitivos en fase 2. Revisar licencias, idioma, portadas y regiones.
- **Cuentas y lanzamiento:** Cloudflare Pages, protección de rama, Projects, Search Console, token de analítica, Deploy Hook y cuentas sociales.
- **Monetización:** titular de cobros, reparto escrito y política de privacidad adaptada a los proveedores reales.

El plan original permanece intacto. La publicación del sitio en Pages es distinta de publicar la configuración del entorno de Codex.
