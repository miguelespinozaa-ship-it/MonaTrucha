# Plan: sitio de anime con anuncios (equipo de 3)

9 de octubre de 2026

## Resumen y decisión clave

Construimos un sitio estático de anime, sin login, con catálogo, fichas y reproductor incrustado de fuentes oficiales, alojado gratis y monetizado con anuncios cuando haya contenido propio y tráfico.

**La decisión que condiciona todo: de dónde sale el vídeo.** Solo hay un camino que permite monetizar:

- **Sí:** incrustar episodios que los propios licenciatarios publican gratis (canales oficiales de YouTube como Muse Asia, Ani-One Asia, Crunchyroll, TMS Anime o Gundam.info) y enlazar a plataformas legales para el resto.
- **No:** subir episodios propios o incrustar reproductores de sitios pirata. Las redes de anuncios serias rechazan o expulsan esos sitios, el hosting gratuito los da de baja ante la primera reclamación de derechos, y los responsables legales sois vosotros tres.

El valor del sitio, y lo que hace que aprueben los anuncios, es el contenido propio alrededor del vídeo: fichas, reseñas, guías de orden de visionado, calendario de estrenos y noticias.

Sin login no significa sin funciones: favoritos e historial se guardan en el navegador del visitante (localStorage), sin base de datos ni cuentas.

## Stack gratuito

Todo es gratis salvo el dominio propio (unos 10 USD al año), que solo hace falta al pedir anuncios en la fase 3.

| Necesidad | Herramienta | Por qué |
| --- | --- | --- |
| Código y tareas | GitHub (repositorio + Projects) | Gratis, y el tablero de tareas vive junto al código |
| Sitio web | Astro (generador estático) | Páginas HTML rápidas, buen SEO, casi sin JavaScript |
| Hosting | Cloudflare Pages | Plan gratuito con ancho de banda ilimitado y uso comercial permitido |
| Datos de anime | API de AniList o Jikan, leída al compilar | Títulos, sinopsis, portadas y géneros sin mantener base de datos |
| Vídeo | Incrustación oficial de YouTube | Cero coste de ancho de banda y contenido con licencia |
| Contenido propio | Archivos Markdown en el repositorio | Sin CMS ni panel que mantener |
| Favoritos e historial | localStorage del navegador | Funciona sin login ni servidor |
| Analítica | Cloudflare Web Analytics y Google Search Console | Gratis y sin cookies propias |
| Diseño | Figma (plan gratuito) | Maquetas compartidas entre los tres |

No usar Vercel en plan Hobby: sus condiciones excluyen el uso comercial, y un sitio con anuncios lo es.

Lo que se deja fuera a propósito: base de datos, backend, cuentas de usuario, comentarios y app móvil. Se añaden solo cuando el tráfico lo pida (ver Escalabilidad).

## Roles

Cada persona es dueña de un área y decide dentro de ella; las otras dos revisan.

| Persona | Área | Responsable de | Entregable principal |
| --- | --- | --- | --- |
| Persona 1 | Infraestructura y datos | Repositorio, despliegue, dominio, carga de datos desde la API, rendimiento | El sitio se publica solo con cada cambio |
| Persona 2 | Frontend y diseño | Maquetas, páginas, reproductor, buscador, favoritos, versión móvil | Lo que el visitante ve y usa |
| Persona 3 | Contenido, SEO y monetización | Lista de series legales, textos propios, páginas legales, redes de anuncios, redes sociales | Tráfico e ingresos |

Reglas de trabajo: una rama por tarea, revisión de otra persona antes de fusionar, y una reunión corta por semana para repasar el tablero.

## Plan por fases

Cinco fases en orden de prioridad; no se empieza una hasta cumplir la condición de salida de la anterior. Las duraciones suponen unas 8 a 10 horas por persona a la semana.

### Fase 0: Base (semana 1)

Condición de salida: una página "Hola" publicada en una URL de Cloudflare Pages y 20 series legales elegidas.

**Persona 1**

1. Crear la organización y el repositorio en GitHub e invitar a las otras dos personas.
2. Crear el proyecto Astro vacío y subirlo.
3. Conectar el repositorio a Cloudflare Pages para que cada cambio en la rama principal se publique solo.
4. Proteger la rama principal: nadie fusiona sin revisión.

**Persona 2**

1. Mirar tres sitios de anime legales y anotar qué funciona en móvil.
2. Maquetar en Figma cuatro pantallas: inicio, catálogo, ficha de serie y página de episodio.
3. Fijar colores, tipografía y nombre provisional con el equipo.

**Persona 3**

1. Listar los canales oficiales que publican episodios completos gratis y comprobar en qué países se ven.
2. Elegir las 20 primeras series con todos sus episodios disponibles y guardar los enlaces en una hoja compartida.
3. Elegir el público inicial (país e idioma), porque muchos vídeos oficiales tienen bloqueo regional.
4. Crear el tablero en GitHub Projects con las tareas de este plan.

### Fase 1: Producto mínimo (semanas 2 a 4)

Condición de salida: cualquiera entra sin registrarse, encuentra una de las 20 series y ve un episodio en el móvil.

**Persona 1**

1. Definir el formato de datos: un archivo por serie con el identificador de la API y la lista de episodios con su enlace oficial.
2. Escribir el script que, al compilar, pide a la API título, sinopsis, portada y géneros de cada serie.
3. Guardar las respuestas en caché para no superar el límite de peticiones de la API.
4. Generar el sitemap y el archivo robots.txt.

**Persona 2**

1. Construir la plantilla común: cabecera, pie y menú móvil.
2. Construir inicio y catálogo con filtro por género.
3. Construir la ficha de serie con su lista de episodios.
4. Construir la página de episodio con el reproductor incrustado, cargado solo al pulsar para no frenar la página.
5. Dejar reservados los huecos de anuncios con tamaño fijo, vacíos por ahora.

**Persona 3**

1. Rellenar los archivos de las 20 series con los enlaces de la fase 0.
2. Escribir para cada serie un texto propio de 150 a 300 palabras (de qué va, para quién es, por dónde empezar).
3. Redactar las páginas Acerca de, Contacto, Política de privacidad y Aviso de derechos de autor con un correo para reclamaciones.

### Fase 2: Lanzamiento y tráfico (semanas 5 a 8)

Condición de salida: sitio indexado en Google, 50 series, 30 artículos propios y visitas orgánicas diarias.

**Persona 1**

1. Dar de alta el sitio en Google Search Console y enviar el sitemap.
2. Activar Cloudflare Web Analytics.
3. Llevar la puntuación de rendimiento móvil por encima de 90 en PageSpeed Insights.
4. Programar una recompilación diaria para refrescar datos y detectar vídeos retirados.

**Persona 2**

1. Añadir buscador en el propio navegador sobre un índice generado al compilar.
2. Añadir favoritos y "seguir viendo" con localStorage.
3. Añadir la sección de artículos y el calendario de estrenos.
4. Añadir datos estructurados y etiquetas para compartir en redes en cada ficha.

**Persona 3**

1. Subir el catálogo a 50 series.
2. Publicar tres artículos por semana: guías de orden de visionado, listas por género y reseñas.
3. Abrir una o dos cuentas sociales (TikTok o Instagram, y un servidor de Discord) y publicar a diario.
4. Revisar cada semana en Search Console qué búsquedas traen visitas y escribir sobre ellas.

### Fase 3: Monetización (desde la semana 9)

Condición de salida: anuncios aprobados y primeros ingresos registrados.

**Persona 1**

1. Comprar el dominio y apuntarlo a Cloudflare Pages.
2. Redirigir la URL antigua al dominio nuevo y actualizar Search Console.
3. Publicar el archivo ads.txt que entregue la red de anuncios.

**Persona 2**

1. Integrar el código de anuncios en los huecos reservados, nunca encima ni pegado al reproductor.
2. Integrar el aviso de consentimiento de cookies que exige la red.
3. Comprobar que la página no salta al cargar los anuncios y que la velocidad se mantiene.

**Persona 3**

1. Solicitar el alta en la red de anuncios (ver Monetización) y corregir lo que pidan si rechazan.
2. Actualizar la política de privacidad con los datos de la red.
3. Abrir la cuenta de cobro y acordar por escrito el reparto de ingresos entre los tres.
4. Llevar una hoja mensual de visitas, ingresos e ingreso por mil visitas.

### Fase 4: Escalar (continuo)

**Persona 1:** aplicar los cambios de la sección Escalabilidad cuando se alcance cada umbral.

**Persona 2:** probar posiciones de anuncios y mejorar las páginas con más visitas.

**Persona 3:** ampliar catálogo y artículos, sumar enlaces de afiliado y pasar a redes de anuncios mejor pagadas.

## Monetización

Los anuncios se piden cuando el sitio ya tiene dominio propio, páginas legales y al menos 30 textos originales; antes, la solicitud se rechaza por "contenido de poco valor".

Requisitos habituales antes de solicitar:

- Dominio propio (un subdominio gratuito del hosting no suele aceptarse).
- Contenido original en cada página: una página que solo tiene un vídeo incrustado no cuenta.
- Páginas de privacidad, contacto y acerca de, visibles en el pie.
- Navegación clara y sitio funcional en móvil.
- Ningún contenido sin licencia ni enlaces a sitios que lo distribuyan.

Escalera de ingresos, de menor a mayor exigencia:

| Etapa | Opción | Cuándo |
| --- | --- | --- |
| 1 | Google AdSense | Primera solicitud, sin mínimo oficial de tráfico |
| 2 | Enlaces de afiliado (manga, figuras, suscripciones a plataformas legales) | En paralelo desde el primer artículo de recomendaciones |
| 3 | Ezoic u otra red gestionada | Cuando el tráfico sea estable y AdSense rinda poco |
| 4 | Mediavine, Raptive o similares | Con decenas de miles de sesiones al mes; pagan bastante más por visita |

Evitar las redes de ventanas emergentes y redirecciones: aceptan cualquier sitio, pero espantan a los visitantes, dañan el posicionamiento y cierran la puerta a las redes de las etapas 3 y 4.

Expectativa realista: con anuncios de display, un sitio en español suele ingresar del orden de 1 a 3 USD por cada mil páginas vistas (cifra aproximada). Los primeros meses cubren el dominio y poco más; el ingreso crece con el catálogo y los artículos.

## Escalabilidad

Un sitio estático servido por CDN aguanta picos de tráfico sin tocar nada, así que lo que escala es el catálogo y el equipo, no los servidores.

| Señal | Qué añadir | Quién |
| --- | --- | --- |
| Más de 500 series y la compilación tarda más de 10 minutos | Compilación incremental o páginas generadas bajo demanda con Cloudflare Workers | Persona 1 |
| Los visitantes piden sincronizar favoritos entre dispositivos | Login opcional con Supabase o Cloudflare D1; ver anime sigue sin exigir cuenta | Personas 1 y 2 |
| El buscador en el navegador se vuelve lento | Índice estático con Pagefind | Persona 2 |
| Editar Markdown frena a quien escribe | Un CMS sobre el repositorio, como Decap | Persona 3 |
| Los ingresos cubren costes de sobra | Colaboradores de contenido pagados por artículo | Persona 3 |
| Tráfico relevante desde otro idioma | Versión traducida con sus propios vídeos oficiales | Los tres |

Nada de esta tabla se construye antes de ver su señal.

## Riesgos y puntos a verificar

Las condiciones de terceros citadas aquí están escritas de memoria, sin consultar las páginas oficiales; cada responsable debe confirmarlas antes de depender de ellas.

| Riesgo | Efecto | Qué hacer | Quién |
| --- | --- | --- | --- |
| Bloqueo regional de los vídeos oficiales | El visitante ve "vídeo no disponible" | Elegir público inicial según disponibilidad y mostrar un enlace alternativo legal | Persona 3 |
| Un canal retira un episodio | Enlaces rotos | Comprobación automática diaria y aviso en el tablero | Persona 1 |
| La API de datos limita el uso comercial | Hay que cambiar de fuente | Leer las condiciones de AniList y Jikan antes de la fase 3 | Persona 1 |
| Rechazo de la red de anuncios | Retraso en ingresos | Más texto propio por página y volver a solicitar | Persona 3 |
| Normas de consentimiento de cookies | Anuncios desactivados para parte del público | Usar un aviso de consentimiento certificado por la red | Persona 2 |
| Reclamación de derechos de autor | Baja del hosting | Solo fuentes oficiales y retirada en 24 horas ante cualquier aviso | Persona 3 |
| Reparto de dinero sin acordar | Conflicto en el equipo | Acuerdo escrito antes del primer cobro | Los tres |

Pendiente de decidir entre los tres:

- [ ] País e idioma del público inicial
- [ ] Nombre del sitio y dominio
- [ ] Quién es titular de la cuenta de anuncios y cómo se reparte el ingreso
- [ ] Horas semanales que compromete cada persona
