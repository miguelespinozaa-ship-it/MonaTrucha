# Lista de lanzamiento y responsables

Este documento prepara el trabajo externo; no declara un despliegue, aprobación de anuncios ni indexación. **En este bloque se conservan anuncios desactivados y noindex.** Las capturas indicadas son evidencias que debe obtener el equipo en sus propias cuentas, no capturas fabricadas del resultado.

Roles del plan: **P1** infraestructura/datos; **P2** frontend/diseño; **P3** contenido/SEO/monetización. Otra persona revisa cada entrega. Completar usuarios reales en `.github/CODEOWNERS`: las reglas comentadas son marcadores inactivos, no protección efectiva.

## 1. Identidad y fuentes — P3, revisión de P1/P2

- [ ] Decidir nombre, país/idioma del público, dominio, titular y correo de contacto.
- [ ] Abrir un issue «Verificación manual de un episodio» por revisión y completar `docs/lista-series-ejemplo.csv`.
- [ ] Comprobar titular/licenciatario, canal, episodio completo, idioma/subtítulos, regiones, fecha y permiso de incrustación. Revisar por separado los permisos de portada y metadatos.
- [ ] Escribir textos propios y retirar `draft` únicamente después de revisión. No inventar fuentes para cubrir metas.
- [ ] Ejecutar `npm run content:report`. Metas del plan: 20 series en fases 0/1, 50 series y 30 artículos definitivos en fase 2. Las cinco ficciones no cuentan.

**Evidencia esperada:** CSV con enlaces a pruebas e issues revisados; informe editorial con palabras y avance real. Un cero actual es un resultado válido, no un lanzamiento terminado. Captura del issue con checklist y personas responsables, sin datos privados innecesarios.

## 2. GitHub y comprobaciones — P1/P2, revisión de P3

- [ ] Fusionar los PR de cada bloque en orden, después de revisión; no trasladar directamente commits no revisados a producción.
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
# Primero revisar el JSON de vista previa. Después, con propietario y número reales:
npm run project:import -- --owner PROPIETARIO --project NUMERO --apply
```

El archivo `project-tasks.json` contiene las **45 tareas** de las fases 0–3 del plan, con su rol y condición de salida. El importador usa `gh project item-create`, conserva un identificador por tarea y omite duplicados. Crea borradores del tablero, no issues, responsables ni estados falsos. Requiere `gh` autenticado con permiso de Projects; no guardar tokens en el repositorio. Ejecutarlo otra vez debe crear cero tareas si el listado está completo.

**Evidencia esperada:** check `validate` verde, informe sin referencias internas rotas y capturas de las cinco plantillas a 360/1280 px. Los externos `unknown` requieren revisión humana; no equivalen a enlaces comprobados. Captura del tablero con títulos `F0 · P1 · …`, roles asignados y estados revisados por el equipo.

## 3. Cloudflare Pages de prueba — P1, revisión de P2

- [ ] Crear Pages y conectar el repositorio GitHub; autorizar solo las cuentas/proyectos necesarios.
- [ ] Configurar rama `main`, framework Astro, Node 24, comando `npm run build`, salida `dist` y raíz del repositorio.
- [ ] Definir las variables de `.env.example` por entorno de preview/producción. Mantener `PUBLIC_ADS_ENABLED=false`. Usar correo y nombre aprobados; ningún secreto puede llevar `PUBLIC_`.
- [ ] Confirmar build y publicar una versión de prueba sin quitar noindex. Comprobar inicio, catálogo, ficha, episodio, artículo y 404.
- [ ] Verificar que `_headers` generado se publica y que CSP no bloquea los scripts propios. Rechazar cookies debe impedir conexiones a anuncios/analítica.

```sh
# Cambiar el origen por la URL de Pages del equipo; no hay URL creada por este documento.
curl --fail --head https://PROYECTO.pages.dev/
curl --fail --head https://PROYECTO.pages.dev/catalogo/
curl --silent https://PROYECTO.pages.dev/robots.txt
curl --silent https://PROYECTO.pages.dev/ | rg 'noindex|canonical'
```

**Evidencia esperada:** captura de Settings/Build con esos valores y Deployments con build correcto; HTTP 200 y HTML con noindex. El catálogo de muestra seguirá sin vídeos; una verificación real necesitará fuentes del equipo. Captura de Network al rechazar consentimiento, sin solicitudes a Google Ads o Cloudflare Analytics. No incluir valores de hooks ni credenciales en capturas.

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
- [ ] Comprobar Actions, el workflow `weekly.yml`, Dependabot e Issues habilitados. El informe semanal crea o actualiza un issue por semana después de fusionar el bloque 4. Revisar vídeos/enlaces semanalmente, especialmente 404/410; los bloqueos regionales y de red requieren comprobación humana.
- [ ] P3 atiende avisos de derechos, revisa fuentes y amplía el catálogo; P2 comprueba móvil/accesibilidad; P1 mantiene dependencias, build y despliegue.
- [ ] Conservar evidencia de cada condición de salida: publicación + 20 series legales; experiencia móvil con episodios oficiales; 50 series + 30 artículos + indexación/tráfico; aprobación e ingresos reales en fase 3.

**Evidencia esperada:** ejecuciones recientes de CI/actualización, informes y tablero actualizado. No marcar cumplidas condiciones del plan basándose solo en comandos que pasan con muestras ficticias.
