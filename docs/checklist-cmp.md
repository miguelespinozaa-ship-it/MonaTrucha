# Checklist de CMP para una futura monetización

Plantilla preparada el 16 de octubre de 2026; ninguna selección, aprobación o cuenta está completada. Con anuncios apagados no se conecta la CMP. El banner propio no es una CMP certificada.

- [ ] **P3:** decidir países, idioma, titular y público; determinar qué requisitos vigentes de Google y de la jurisdicción aplican.
- [ ] **P3/P2:** verificar personalmente que el proveedor elegido figura en la lista vigente de CMP certificadas de Google. Guardar enlace, fecha y evidencia; no darlo por certificado por tener una URL HTTPS.
- [ ] **P3:** contratar/crear el proyecto real y revisar tratamiento de datos, conservación, destinatarios, idiomas, contacto y condiciones del proveedor.
- [ ] **P2:** configurar mensajes, propósitos, proveedores y señal IAB TCF con el proveedor. El código actual espera la señal de Google (vendor 755) y sus propósitos configurados; no genera una cadena TCF.
- [ ] **P1/P2:** obtener el cargador público real, enumerar todos sus dominios adicionales y revisar script-src, connect-src y frame-src de CSP. No inventar URLs ni copiar comodines amplios para eludir bloqueos.
- [ ] **P2:** comprobar en un entorno de prueba aceptar, rechazar, configurar, cerrar, teclado y retirada. Antes de aceptar anuncios no debe solicitarse la CMP; AdSense espera además la señal TCF cuando se exige.
- [ ] **P2/P3:** probar desde los países revisados y comprobar el caso donde GDPR aplica y donde no aplica. No inferir regiones por el canal de vídeo ni por el navegador local.
- [ ] **P3:** actualizar privacidad con el proveedor y los datos reales; documentar revisión de otra persona.
- [ ] **P1/P2:** ejecutar `npm run preflight -- --cmp-required --strict`, revisar los fallos reales y repetir pruebas de CSP, movimiento reducido, rendimiento y CLS con el proveedor configurado.
- [ ] **P3/P1/P2:** solicitar una tarea posterior explícita para activar anuncios. Esta checklist no cambia `PUBLIC_ADS_ENABLED=false` ni `PUBLIC_INDEXING_ENABLED=false`.

Evidencia a completar, sin datos inventados:

| Campo                                        | Valor pendiente |
| -------------------------------------------- | --------------- |
| Proveedor / proyecto real                    |                 |
| URL de certificación y fecha de consulta     |                 |
| Países e idiomas revisados                   |                 |
| Cargador y dominios CSP                      |                 |
| Referencia de mensajes y prueba TCF          |                 |
| Revisión de privacidad y responsables reales |                 |
| Capturas de rechazo, aceptación y retirada   |                 |
