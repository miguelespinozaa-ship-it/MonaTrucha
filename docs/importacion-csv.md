# Importar la lista editorial como borradores

P3 completa una copia de `docs/lista-series-ejemplo.csv`; P1/P2 revisan el diff. La fila vacía es una guía sin datos declarados y no se puede importar sin completar datos. El importador no consulta YouTube ni identifica obras, licencias o regiones. Una fila representa una serie y, opcionalmente, un primer episodio. Los demás episodios se añaden al Markdown revisado.

```sh
npm run content:import -- /ruta/lista-revisada.csv --dry-run
npm run content:import -- /ruta/lista-revisada.csv
# Solo tras revisar el archivo que se sustituirá:
npm run content:import -- /ruta/lista-revisada.csv --force
npm run content:report
npm run build
```

Se conservan las 17 columnas de evidencia anteriores y se añaden campos editoriales. Exportar CSV UTF-8 con coma como separador: las comas, comillas y saltos de línea dentro de una celda requieren comillas dobles; una comilla interna se duplica. Las listas usan `;`. No subir datos personales innecesarios.

| Columna                                                       | Requisito                                                                                                                                                               |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slug`                                                        | Único por CSV; minúsculas, números y guiones, hasta 96 caracteres. Sin rutas ni extensión.                                                                              |
| `titulo_verificado`, `subtitulo`, `descripcion`               | Textos propios no vacíos, aportados por el equipo.                                                                                                                      |
| `texto_serie`                                                 | Texto original de 150–300 palabras; mismo contador que `content:report`.                                                                                                |
| `generos`                                                     | Uno o varios valores separados por `;`.                                                                                                                                 |
| `anio`, `duracion`                                            | Año comprobado (1900–2200) y duración positiva en minutos.                                                                                                              |
| `formato`                                                     | `Serie` o `Película`.                                                                                                                                                   |
| `estado_serie`                                                | `En emisión`, `Completa` o `Próximamente`.                                                                                                                              |
| `portada`, `hero`                                             | Archivos existentes bajo `../../assets/`, relativos a la ficha. Verificar derechos antes de importar. No se descargan imágenes.                                         |
| `episodio_numero`, `episodio_titulo`, `alternativa_legal_url` | Si hay episodio: número positivo, título explícito y enlace HTTPS a una plataforma admitida en el esquema.                                                              |
| `youtube_id`, `canal_oficial`                                 | Opcionales; se copian exclusivamente de estas celdas. ID de 11 caracteres y canal de `scripts/content.mjs`. No se deducen de `episodio_url` ni de `canal_oficial_url`.  |
| `regiones_verificadas`                                        | Lista explícita con `;`; obligatoria si se aporta vídeo. No se infieren regiones por el canal ni se comprueba geobloqueo.                                               |
| `verified`                                                    | Solo `true`, `false` o vacío. Vacío significa `false`; `true` exige vídeo, canal y regiones explícitos. Es una declaración humana, no una certificación del importador. |
| Otras columnas originales                                     | Evidencia de titular, idioma, permisos, revisión y enlaces: se conserva en `revisionEditorial` sin atribuirle validación automática.                                    |

Todas las fichas salen con **`draft: true`**, `placeholder: false` y fuera de rutas, búsquedas, API, sitemap, metas y verificación de vídeos publicados. No cambia ninguna ficha publicada sin `--force`. La revisión de `verified` es independiente de publicar una ficha: un ID con revisión pendiente puede conservarse en un borrador; el esquema impide publicarlo con `verified: false`.

El estilo visual usa `accent: pink`, sin destacado ni API asignada. El horario es un marcador explícito «PENDIENTE», no un estreno anunciado: completarlo o retirarlo durante la revisión. No se inventan año, duración, imágenes, vídeo, canal, regiones ni evidencia para rellenar una fila.

Primero se validan todas las filas y destinos. Si hay errores de datos, no se escribe ninguna ficha. Cada mensaje indica su fila física de CSV (incluidos campos multilínea). `--dry-run` valida y muestra las creaciones/sustituciones sin escribir archivos, carpetas ni informes. Sin `--force` se usa creación exclusiva; incluso con `--force` se rechazan destinos simbólicos. Las comprobaciones incluyen rutas maliciosas, duplicados, imágenes externas al directorio y CSV malformado. Un fallo de disco durante la escritura debe resolverse y revisarse antes de repetir; no se promete una transacción de varios archivos.

Antes de retirar `draft`, revisar el issue de cada episodio, contenido, portada/hero, horario, fuente legal específica y metadatos. `placeholder: false` por sí solo no acredita una obra. Una importación no demuestra licencias ni disponibilidad real.
