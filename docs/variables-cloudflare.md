# Variables para el primer Cloudflare Pages

Preparado el 16 de octubre de 2026. P1 copia estas claves en producción y previews del **proyecto nuevo**. P3 decide nombre, origen y correo. Los valores vacíos son pendientes reales; `example.com` es un marcador reservado y Yoru sigue siendo provisional. No hay secretos en esta lista.

```dotenv
NODE_VERSION=24
PUBLIC_SITE_NAME=Yoru
PUBLIC_SITE_URL=https://example.com
PUBLIC_INDEXING_ENABLED=false
PUBLIC_CONTACT_EMAIL=
PUBLIC_ADS_ENABLED=false
PUBLIC_ADSENSE_CLIENT_ID=
PUBLIC_AD_SLOT_NAV=
PUBLIC_AD_SLOT_HOME=
PUBLIC_AD_SLOT_SIDEBAR=
PUBLIC_AD_SLOT_ARTICLE=
PUBLIC_AD_SLOT_PLAYER=
PUBLIC_CF_ANALYTICS_TOKEN=
PUBLIC_GOOGLE_SITE_VERIFICATION=
PUBLIC_CMP_REQUIRED=false
PUBLIC_CMP_SCRIPT_URL=
```

P1 sustituye el origen por la URL HTTPS que asigne Pages antes de desplegar; usa el mismo origen para canónicas y sitemap. Mantener anuncios e indexación en false. El primer despliegue no requiere AdSense, CMP ni analítica; sus campos permanecen vacíos. Cualquier cambio de variables requiere recompilar.

El secreto `CLOUDFLARE_DEPLOY_HOOK` se obtiene del proyecto real y se guarda exclusivamente en **Settings → Secrets and variables → Actions** del repositorio nuevo si se quiere publicar la recompilación diaria. No ponerlo en variables `PUBLIC_`, en archivos ni en capturas. Sin ese secreto, la tarea diaria solo valida.

Preparar no equivale a configurar cuentas: seguir `lanzamiento.md`, completar los pendientes humanos de `TODO.md` y verificar `preflight`. No habilitar la inyección automática de Web Analytics del panel; se usa el cargador del sitio sujeto a consentimiento.
