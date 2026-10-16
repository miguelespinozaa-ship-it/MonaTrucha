# Entrega manual en un repositorio nuevo

Estado local integrado y preparado el 16 de octubre de 2026. Este código funciona sin `.git`, historial, PR ni `gh`. El zip contiene directamente la raíz del proyecto, incluidos sus archivos ocultos; **GitHub no descomprime un zip subido como archivo**. Descomprimirlo en una carpeta vacía y subir el contenido fuente, no el propio zip.

## Inventario del zip

La entrega tiene ****TOTAL** archivos**, sin directorios generados ni configuración privada. Ningún archivo supera el límite conservador de **25 000 000 bytes (25 MB)** de la subida web. El mayor es `package-lock.json`, con **MAX_TAM** bytes. El límite de 100 archivos por operación requiere ****LOTES** subidas**: **TAMANOS_LOTES**. Los directorios del zip no cuentan como archivos.

Desde la raíz del proyecto, sin Git ni acceso remoto:

```sh
node scripts/source-files.mjs
# Destinos nuevos o vacíos; .cache queda fuera de cualquier exportación.
node scripts/source-files.mjs --copy .cache/fuente-limpia
node scripts/source-files.mjs --json > .cache/inventario.json
node scripts/source-files.mjs --batches .cache/lotes-web
```

El modo JSON muestra cada ruta, tamaño y SHA-256, los lotes de hasta 100 archivos y cualquier archivo demasiado grande. La copia conserva las rutas y comprueba hashes; no sobrescribe destinos. El inventario excluye `.git`, node_modules, dist, .cache, .astro, resultados de pruebas, archivos .env privados y descargas de portadas. También detiene la exportación ante enlaces simbólicos o patrones reconocibles de credenciales; esto complementa la revisión humana, no garantiza detectar cualquier secreto posible.

Los lotes están en `.cache/lotes-web/lote-01`, `lote-02`, etc. Cada uno replica parte de la estructura fuente. Subir **el contenido** de cada lote a la raíz del nuevo repositorio, conservando subcarpetas; no subir la carpeta `lote-01` como un nivel adicional.

Sin ejecutar scripts, otra selección válida para la subida web es: **primera operación**, los 16 archivos de raíz y las carpetas `.github`, `docs`, `public`, `scripts` y `templates` (61 archivos en total); **segunda operación**, `src` y `tests` (65 archivos). Arrastrar las carpetas con sus nombres originales para conservar sus rutas y mostrar los ocultos. Ambos grupos quedan por debajo de 100.

## Archivos ocultos que deben estar

Mostrar archivos ocultos en el sistema operativo. Verificar que aparecen en el árbol del repositorio después de subirlos:

- `.github/workflows/ci.yml`, `daily.yml` y `weekly.yml`.
- `.github/CODEOWNERS`, `.github/dependabot.yml` y `.github/labels.json`.
- `.github/ISSUE_TEMPLATE/content.yml` y `episode-verification.yml`.
- `.env.example` (plantilla pública), `.gitignore`, `.nvmrc` y `.npmrc`.
- `.prettierrc.json` y `.prettierignore`.

Conservar también `package-lock.json`, LICENSE, `public/_headers`, `public/ads.txt`, fuentes/licencias, assets, contenido, scripts y pruebas. Nunca subir `.env`, node_modules, dist ni .cache como código fuente. `.env.example` es la excepción pública a las reglas de entorno; sus campos sensibles están vacíos.

## Subida web — P1

1. Crear un repositorio vacío con el propietario, nombre y visibilidad que decida el equipo. No introducir aquí cuentas inventadas ni depender del repositorio anterior.
2. Descomprimir y ejecutar el inventario. Preparar los lotes con el comando anterior; usar **Add file → Upload files** desde la raíz del repositorio nuevo.
3. Arrastrar el contenido del primer lote con sus subcarpetas y ocultos, revisar rutas y confirmar la subida. Repetir con los demás lotes; cada operación tiene como máximo 100 archivos. Los commits intermedios pueden tener un árbol incompleto: ejecutar o revisar CI cuando termine el último lote.
4. Confirmar el total de archivos y los ocultos. Si el navegador omite alguno o aplana rutas, usar la alternativa con Git. No poner otra carpeta del proyecto encima de package.json ni mover `.github` a docs.
5. La subida web **no elimina archivos que ya existan**. En un repositorio usado, comparar el árbol actual con el inventario; borrar expresamente los archivos obsoletos del proyecto desde la web y revisar el resultado. La opción más sencilla para esta entrega es un repositorio nuevo y vacío.

## Alternativa con Git — P1

Reemplazar los dos marcadores de la URL por los datos reales **del repositorio nuevo**. Estos comandos son instrucciones para el equipo; no se ejecutaron contra ningún remoto durante la preparación.

```sh
git init -b main
git add .
git diff --cached --stat
git commit -m "Importar estado final del sitio"
git remote add origin 'https://github.com/REEMPLAZAR_PROPIETARIO/REEMPLAZAR_REPOSITORIO.git'
git push -u origin main
```

Si el remoto ya tiene commits, clonarlo primero y trabajar en ese checkout. Sustituir su contenido fuente por el del zip, conservando `.git`, y retirar los archivos obsoletos comparando con el inventario. Revisar `git status` y `git diff --stat`; `git add -A` registra tanto los nuevos/cambiados como los borrados. Hacer commit y push sobre ese historial, después de revisión. No resolver un rechazo de push reemplazando a ciegas el historial remoto.

## Ajustes que no viajan en el zip

| Responsable  | Repetir en el repositorio nuevo                                                                                                                                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1           | Habilitar Actions y permitir las Actions oficiales incluidas. Ejecutar CI una vez; después proteger main, exigir revisión y el check **validate**.                                                                                                   |
| P1 con P2/P3 | Rellenar CODEOWNERS con usuarios/equipos reales con acceso. Las reglas están comentadas: no asignan a nadie hasta completarlas y descomentarlas.                                                                                                     |
| P1           | Revisar Dependabot y sus permisos; `.github/dependabot.yml` prepara actualizaciones, pero el historial de avisos/PR anteriores no se traslada.                                                                                                       |
| P1           | Guardar el secreto real **CLOUDFLARE_DEPLOY_HOOK** solo si se desea publicar la recompilación diaria. Sin él, se valida sin publicar.                                                                                                                |
| P1/P3        | Habilitar Issues y revisar los permisos acotados del workflow semanal. Observar su primera ejecución, caché, artefactos, integridad y un único issue por semana. No se han creado issues remotos en esta entrega.                                    |
| P1           | Crear etiquetas desde Issues → Labels usando `.github/labels.json`. Ese JSON es una plantilla: GitHub no crea las etiquetas automáticamente al subirlo.                                                                                              |
| P1/P3        | Crear el tablero Projects del nuevo propietario y sus estados. `npm run project:plan` produce 45 tareas locales; pueden copiarse manualmente al tablero.                                                                                             |
| P1           | Solo si se instala y autoriza `gh` en el nuevo repo, usar el importador opcional con `--owner REEMPLAZAR_PROPIETARIO --project NUMERO_REAL --apply`. Su ejecución sin --apply es una vista previa local. No es requisito de instalación ni de build. |
| P1/P2/P3     | Configurar Pages, variables, identidad, contenido y proveedores siguiendo `lanzamiento.md`, `variables-cloudflare.md`, `checklist-cmp.md` y `TODO.md`.                                                                                               |

Dependen del destino: propietario/repositorio y su URL remota; cuentas de CODEOWNERS y acceso de colaboradores; proyecto/IDs de Projects y permisos de Actions/Issues; secreto de despliegue; proyecto Pages y su conexión GitHub; nombre, dominio, contacto y cuentas de proveedores reales. Los workflows obtienen el repositorio de su contexto y no contienen una cuenta fija.

Las URLs oficiales de changelogs de Actions y del parser se conservan como fuentes externas, no como destino del proyecto. `plan-sitio-anime.md` conserva su nombre porque es un documento local de referencia, independiente del nombre del repo. Los marcadores internos de tareas e informes son genéricos. LICENSE conserva la atribución MIT original y no se sustituye por una persona inventada.

## Prueba desde una copia limpia

Con Node 24 y acceso al registro npm, sin .git, gh, .env ni cuentas externas:

```sh
node scripts/source-files.mjs --copy .cache/comprobacion-limpia
cd .cache/comprobacion-limpia
npm ci && npm run lint && npm run check && npm run build && npm run test:unit
```

`.npmrc` usa una caché relativa `.cache/npm`; no requiere rutas de este entorno ni una carpeta personal escribible. Las cinco series de muestra compilan sin consultar APIs de anime. Las pruebas de navegador y rendimiento son adicionales: instalar Chromium con `npx playwright install chromium` o indicar una ruta local disponible; no forman parte de la instalación mínima anterior.

La copia debe conservar anuncios apagados, noindex y robots bloqueado. Preparar esta entrega no crea un proyecto Cloudflare, una propiedad Search Console, una aprobación AdSense ni licencias de vídeo.
