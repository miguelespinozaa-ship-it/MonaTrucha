# Lista de lanzamiento y responsables

Este documento prepara el trabajo externo; no declara un despliegue, aprobación de anuncios ni indexación. **En este bloque se conservan anuncios desactivados y noindex.** Las capturas indicadas son evidencias que debe obtener el equipo en sus propias cuentas, no capturas fabricadas del resultado.

Roles del plan: **P1** infraestructura/datos; **P2** frontend/diseño; **P3** contenido/SEO/monetización. Otra persona revisa cada entrega. Completar usuarios reales en `.github/CODEOWNERS`: las reglas comentadas son marcadores inactivos, no protección efectiva.

La lista copiable está en [variables-cloudflare.md](variables-cloudflare.md), la revisión de CMP en [checklist-cmp.md](checklist-cmp.md) y la verificación offline de episodios en [verificacion-episodio.md](verificacion-episodio.md). Los valores vacíos y capturas pendientes no representan cuentas creadas.

## 1. Identidad y fuentes — P3, revisión de P1/P2

- [ ] Decidir nombre, país/idioma del público, dominio, titular y correo de contacto.
- [ ] Completar una revisión offline por episodio; crear el issue en el repositorio nuevo cuando exista, y rellenar `docs/lista-series-ejemplo.csv`.
- [ ] Comprobar titular/licenciatario, canal, episodio completo, idioma/subtítulos, regiones, fecha y permiso de incrustación. Revisar por separado los permisos de portada y metadatos.
- [ ] Escribir textos propios y retirar `draft` únicamente después de revisión. No inventar fuentes para cubrir metas.
- [ ] Ejecutar `npm run content:report`. Metas del plan: 20 series en fases 0/1, 50 series y 30 artículos definitivos en fase 2. Las cinco ficciones no cuentan.

**Evidencia esperada:** CSV con enlaces a pruebas e issues revisados; informe editorial con palabras y avance real. Un cero actual es un resultado válido, no un lanzamiento terminado. Captura del issue con checklist y personas responsables, sin datos privados innecesarios.

## 2. GitHub y comprobaciones — P1/P2, revisión de P3

- [ ] Revisar y subir el estado integrado del zip al repositorio nuevo siguiendo `subida-manual.md`; comprobar el árbol completo y su primer validate. No se necesitan los PR ni ramas anteriores.
- [ ] Rellenar/descomentar CODEOWNERS con los tres usuarios o equipos reales. Configurar `main` protegida y el check `validate` obligatorio.
- [ ] Preparar un tablero Projects existente con estados «Por revisar», «Pendiente», «En curso», «Revisión» y «Hecho». El importador no cambia campos ajenos.

```sh
npm ci
npm run content:report
npm run lint
npm run format:check
npm run check
npm run test:unit
npm run build
npm run check:links
npm test
npm run test:ads
npm run perf
npm run project:plan
# La importación remota se prepara en subida-manual.md para el nuevo repositorio.
```

El archivo `project-tasks.json` contiene las **45 tareas** de las fases 0–3 del plan, con su rol y condición de salida. La herramienta opcional, solo para el repositorio nuevo y con gh instalado, usa `gh project item-create`, conserva un identificador por tarea y omite duplicados. Crea borradores del tablero, no issues, responsables ni estados falsos. Requiere `gh` autenticado con permiso de Projects; no guardar tokens en el repositorio. Ejecutarlo otra vez debe crear cero tareas si el listado está completo.

**Evidencia esperada:** check `validate` verde, informe sin referencias internas rotas y capturas de las cinco plantillas y favoritos a 360/768/1280 px, ambos temas. Los externos `unknown` requieren revisión humana; no equivalen a enlaces comprobados. Captura del tablero con títulos `F0 · P1 · …`, roles asignados y estados revisados por el equipo.

## 3. Cloudflare Pages de prueba — P1, revisión de P2

### 3.1. Artefacto local comprobado, antes de abrir el panel

```sh
npm ci
node scripts/test-pages-build.mjs
cat .cache/pages-validation.json
```

El comando se ejecutó con **`https://proyecto-de-prueba.pages.dev` como origen ficticio**, sin consultar esa URL ni crear un proyecto. Compila a `.cache/pages-build/`, conserva `dist/` y fuerza anuncios, indexación, analítica y CMP desactivados solo en ese proceso. También se ejecuta en CI. El resultado comprobado contiene 29 páginas con noindex, canónicas/Open Graph del origen de prueba, dos hashes CSP ejecutables, dos archivos de sitemap con ocho URL públicas y robots bloqueado. Las muestras, borradores y favoritos quedan fuera del sitemap.

Revisa los artefactos que sí se publicarán: `_headers` con CSP de scripts sin unsafe-inline y con hashes coincidentes; permisos de frames YouTube normal/privacidad mejorada y AdSense; caché inmutable de assets; `robots.txt` con `Disallow: /`; sitemap del origen elegido; `404.html` real. Astro usa `/404/` como canónica interna del documento de error, que conserva noindex y queda fuera del sitemap. El servidor local comprobó HTTP 200 en inicio/catálogo y 404 para una ruta inexistente, con CSP aplicada. Es una simulación local de entrega, no evidencia de infraestructura Cloudflare.

### 3.2. Crear el proyecto conectado a GitHub

Estos pasos se contrastaron con la [guía oficial de Astro en Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/) y con el build estático de este repositorio. No ejecutar create-cloudflare, cambiar el stack ni añadir un adaptador SSR.

1. P1 revisa el estado integrado y lo sube completo al repositorio nuevo. Anotar la fecha de entrega y, después de la subida, el identificador del primer commit nuevo si se quiere trazabilidad; no se requiere el historial anterior.
2. En Cloudflare: **Workers & Pages → Create application → Pages → Import an existing Git repository**. Autorizar el repositorio `REEMPLAZAR_PROPIETARIO/REEMPLAZAR_REPOSITORIO` y pulsar **Begin setup**.
3. Elegir el nombre aprobado del proyecto; determina `https://NOMBRE.pages.dev`. La URL ficticia anterior no reserva ese nombre.
4. En **Set up builds and deployments** configurar estos valores:

| Campo                  | Valor                                       |
| ---------------------- | ------------------------------------------- |
| Production branch      | `main`                                      |
| Framework preset       | Astro                                       |
| Root directory         | Raíz del repositorio, sin subcarpeta        |
| Build command          | `npm run build`                             |
| Build output directory | `dist`                                      |
| Node                   | `NODE_VERSION=24`; `.nvmrc` también fija 24 |

5. Definir las variables siguientes en producción **y previews**, antes del primer build. No copiar la URL de Deploy Hook en variables públicas.

| Variable                                                       | Primera prueba                                                    |
| -------------------------------------------------------------- | ----------------------------------------------------------------- |
| `PUBLIC_SITE_URL`                                              | Origen HTTPS exacto del proyecto, sin barra final ni ruta         |
| `PUBLIC_SITE_NAME`                                             | Nombre acordado; Yoru sigue siendo provisional                    |
| `PUBLIC_CONTACT_EMAIL`                                         | Correo real revisado por P3, o vacío y aviso visible de pendiente |
| `PUBLIC_INDEXING_ENABLED`                                      | `false`                                                           |
| `PUBLIC_ADS_ENABLED`                                           | `false`                                                           |
| `PUBLIC_ADSENSE_CLIENT_ID` y cinco `PUBLIC_AD_SLOT_*`          | Vacíos                                                            |
| `PUBLIC_CF_ANALYTICS_TOKEN`, `PUBLIC_GOOGLE_SITE_VERIFICATION` | Vacíos en esta primera prueba                                     |
| `PUBLIC_CMP_REQUIRED`                                          | `false` para esta prueba sin anuncios                             |
| `PUBLIC_CMP_SCRIPT_URL`                                        | Vacío                                                             |

6. Pulsar **Save and Deploy**. Pages instala las dependencias y ejecuta el build; conservar el log, SHA y URL de Deployment. Para cambios posteriores en variables, iniciar otro deployment: el HTML estático no cambia sin recompilar.
7. No habilitar la inyección automática de Web Analytics desde el panel de Pages: cuando se autorice analítica se usará el cargador del sitio, sujeto a consentimiento. No configurar Auto ads, Functions ni fallback SPA. El `404.html` generado permite un error 404 real; una redirección global a index con estado 200 lo anularía.

### 3.3. Verificar el deployment real y guardar evidencia

P1 sustituye el origen de ejemplo de estos comandos por la URL asignada **después de crear el proyecto**. Ninguno de estos resultados remotos se ha obtenido durante esta tarea.

```sh
SITIO_PREVIEW_ORIGIN='https://nombre-elegido.pages.dev'
curl --fail --head "$SITIO_PREVIEW_ORIGIN/"
curl --fail --head "$SITIO_PREVIEW_ORIGIN/catalogo/"
curl --fail --silent "$SITIO_PREVIEW_ORIGIN/robots.txt"
curl --fail --silent "$SITIO_PREVIEW_ORIGIN/sitemap-index.xml"
curl --fail --silent "$SITIO_PREVIEW_ORIGIN/sitemap-0.xml"
curl --fail --silent "$SITIO_PREVIEW_ORIGIN/" | rg 'noindex|canonical|adsEnabled'
curl --silent --output /dev/null --write-out '%{http_code}\n' \
  "$SITIO_PREVIEW_ORIGIN/ruta-inexistente-de-prueba/"
```

Resultados esperados: HTTP 200 para páginas existentes, `Content-Security-Policy` con hashes en la respuesta (se sirve como cabecera; `_headers` no es una página pública), canónicas y sitemap del origen elegido, `noindex,follow`, `adsEnabled:false`, `Disallow: /` y **404** para la ruta inexistente. `ads.txt` permanece como placeholder comentado. Si se recibe 200 en la ruta inventada, revisar redirecciones/fallback antes de aprobar el despliegue.

P2 abre inicio, catálogo, ficha, episodio, artículo, favoritos y páginas legales a 360/768/1280 px, ambos temas. Comprobar carga de fuentes e imágenes, consola sin bloqueos CSP, navegación con teclado y ausencia de solicitudes a Google Ads, YouTube, CMP y Web Analytics. Aceptar o rechazar en esta primera prueba sin proveedores configurados tampoco debe cargarlos. Las muestras siguen sin vídeos: la reproducción real necesita las fuentes del equipo.

**Capturas que debe guardar el equipo:** Settings/Build con valores y SHA, variables no secretas con anuncios/indexación en false, Deployments con build correcto y URL, cabeceras de una respuesta, salida de robots/sitemap y vista Network después de aceptar/rechazar. No incluir hooks ni credenciales. El build local aprobado no marca por sí solo esta sección como desplegada.

## 4. Dominio, TLS y redirecciones — P1, revisión de P3

- [ ] Comprar/conectar dominio y confirmar DNS/TLS en Pages. Establecer `PUBLIC_SITE_URL` al origen HTTPS definitivo sin ruta y mantener `PUBLIC_INDEXING_ENABLED=false`; reconstruir y comprobar canónicas/sitemap.
- [ ] Preparar redirección permanente desde el subdominio anterior hacia el dominio propio, preservando ruta y consulta. Evitar bucles y la redirección inversa.
- [ ] Medir en el dominio real con PageSpeed Insights; conservar informes antes de configurar proveedores.

```sh
curl --head https://SUBDOMINIO-ANTERIOR.pages.dev/catalogo/
curl --fail --head https://DOMINIO-DEL-EQUIPO/catalogo/
```

**Evidencia esperada:** panel de dominio activo/TLS, redirección 301/308 con `Location` hacia `/catalogo/` del origen nuevo y respuesta final 200. Captura de canónica y sitemap con el origen real. **El cambio de dominio no activa la indexación: `PUBLIC_INDEXING_ENABLED=false` mantiene noindex y robots bloqueado en todo el sitio**; permanecen protegidas por su marca placeholder. La futura indexación requiere una revisión editorial y una tarea explícita.

## 5. Search Console y analítica — P1/P3, revisión de P2

- [ ] Crear propiedad del dominio en Search Console y verificar DNS, o configurar `PUBLIC_GOOGLE_SITE_VERIFICATION` para una propiedad de URL.
- [ ] Inspeccionar una URL y registrar que ahora sigue bloqueada por noindex. Preparar `/sitemap-index.xml`; enviarlo para indexación cuando el equipo autorice contenido definitivo indexable.
- [ ] Si se desea analítica, obtener el token público de Cloudflare Web Analytics y configurar `PUBLIC_CF_ANALYTICS_TOKEN`. Probar aceptar/rechazar/configurar y retirar consentimiento en ambos temas.

**Evidencia esperada:** captura de propiedad verificada, prueba de etiqueta/DNS y estado real de inspección (con noindex mientras siga aplicando). Una propiedad verificada o sitemap enviado no prueba indexación ni tráfico. Captura de Network mostrando el beacon solo después de aceptar analítica y su ausencia tras retirar/reload.

## 6. AdSense, ads.txt y CMP — P3/P1/P2

- [ ] **P3:** completar contenido definitivo, páginas legales y dominio; solicitar aprobación y revisar condiciones vigentes. Acordar por escrito titular de cobros y reparto.
- [ ] **P1/P3:** obtener el cliente y los cinco IDs de slots del panel y la entrada exacta de ads.txt. La versión del repositorio permanece comentada hasta recibir los datos reales.
- [ ] **P2/P3:** determinar si Google exige CMP para el público objetivo; comprobar la certificación del proveedor y configurar su proyecto/mensajes/TCF. Si aplica, usar `PUBLIC_CMP_REQUIRED=true` y el cargador público HTTPS del proveedor; revisar CSP y dominios de todos sus recursos.
- [ ] **P2:** desactivar Auto ads, anclas y viñetas en el panel para conservar el límite de tres slots por pantalla. Probar manualmente tamaños, separación del reproductor y ausencia de CLS con los slots reales.
- [ ] **P3:** adaptar privacidad a titular, jurisdicción, proveedores y conservación reales, con revisión del equipo.

```sh
npm run preflight
# Solo diagnóstico; actualmente mostrará lo pendiente y terminará con 0.
npm run preflight -- --strict
# --strict termina con 1 si faltan requisitos de configuración.
npm run preflight -- --cmp-required --json
```

`preflight` lee `.env` y las variables inyectadas sin mostrar sus valores, comprueba origen, correo, cliente/slots, CMP si se declara aplicable y coherencia de ads.txt. No consulta cuentas externas ni demuestra aprobación, licencias, certificación o funcionamiento. No modifica anuncios, ads.txt ni noindex.

**Evidencia esperada:** captura de aprobación y slots en AdSense, archivo ads.txt público con la línea entregada por Google, certificación/configuración del proveedor y señal TCF en herramientas del navegador. Datos de prueba o IDs con formato correcto no acreditan una cuenta. Tras completarlos, la activación de publicidad será una tarea autorizada aparte; **este bloque no la realiza**.

## 7. Operación y evidencias — P1, revisión de P2/P3

- [ ] Configurar `CLOUDFLARE_DEPLOY_HOOK` como secreto de GitHub para publicar la recompilación diaria; sin hook se valida el build sin desplegar.
- [ ] Comprobar Actions, el workflow `weekly.yml`, Dependabot e Issues habilitados. El informe semanal crea o actualiza un issue por semana cuando sus archivos estén en la rama predeterminada nueva. Revisar vídeos/enlaces semanalmente, especialmente 404/410; los bloqueos regionales y de red requieren comprobación humana.
- [ ] P3 atiende avisos de derechos, revisa fuentes y amplía el catálogo; P2 comprueba móvil/accesibilidad; P1 mantiene dependencias, build y despliegue.
- [ ] Conservar evidencia de cada condición de salida: publicación + 20 series legales; experiencia móvil con episodios oficiales; 50 series + 30 artículos + indexación/tráfico; aprobación e ingresos reales en fase 3.

**Evidencia esperada:** ejecuciones recientes de CI/actualización, informes y tablero actualizado. No marcar cumplidas condiciones del plan basándose solo en comandos que pasan con muestras ficticias.
