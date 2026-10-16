# Revisión de un episodio sin depender de issues

Copiar esta plantilla por episodio y guardar la evidencia junto a la lista editorial. P3 completa datos comprobados; P1/P2 u otra persona del equipo revisa. Al crear el repositorio nuevo puede copiarse a la plantilla de issue de `.github/ISSUE_TEMPLATE/episode-verification.yml`. Ningún campo está verificado por esta entrega.

| Campo                                             | Evidencia pendiente |
| ------------------------------------------------- | ------------------- |
| Serie, slug, episodio y título                    |                     |
| Titular/licenciatario                             |                     |
| URL del canal y prueba de relación con el titular |                     |
| URL del episodio completo                         |                     |
| Idioma de audio y subtítulos                      |                     |
| Regiones realmente comprobadas y limitaciones     |                     |
| Permiso y prueba de incrustación                  |                     |
| Alternativa legal específica                      |                     |
| Permisos de portada y hero                        |                     |
| Fecha y persona revisora real                     |                     |
| Segunda revisión y referencia de evidencia        |                     |

- [ ] Es el episodio completo correcto, publicado por un titular o licenciatario comprobado.
- [ ] Audio, subtítulos y cada región declarada se han revisado manualmente.
- [ ] El titular permite la incrustación y el reproductor funciona en la región revisada.
- [ ] Existe una alternativa oficial específica y se han revisado los permisos de imágenes.
- [ ] Otra persona ha revisado la evidencia antes de publicar o declarar `verified: true`.

El importador conserva declaraciones del CSV, pero no convierte una URL, un nombre de canal, oEmbed o una respuesta HTTP 200 en una licencia. Usar `--dry-run`, mantener `draft: true` y consultar `importacion-csv.md` antes de incorporar la ficha. No escribir IDs, países, canales ni licencias para rellenar huecos.
