const env = import.meta.env;
export const site = {
  name: env.PUBLIC_SITE_NAME || 'Yoru',
  url: env.PUBLIC_SITE_URL || 'https://example.com',
  description:
    'Descubre tu próxima historia. Anime, guías y fuentes oficiales, sin cuentas y a tu ritmo.',
  contact: env.PUBLIC_CONTACT_EMAIL || '',
  verification: env.PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  analyticsToken: env.PUBLIC_CF_ANALYTICS_TOKEN || '',
};

export const ADS_ENABLED = env.PUBLIC_ADS_ENABLED === 'true';
export const ADSENSE_CLIENT_ID = env.PUBLIC_ADSENSE_CLIENT_ID || '';
export const adSlots = {
  nav: env.PUBLIC_AD_SLOT_NAV || '',
  home: env.PUBLIC_AD_SLOT_HOME || '',
  sidebar: env.PUBLIC_AD_SLOT_SIDEBAR || '',
  article: env.PUBLIC_AD_SLOT_ARTICLE || '',
  player: env.PUBLIC_AD_SLOT_PLAYER || '',
};
export type AdPosition = keyof typeof adSlots;
export const adsReady =
  ADS_ENABLED && /^ca-pub-\d{16}$/.test(ADSENSE_CLIENT_ID);
if (ADS_ENABLED && !adsReady)
  throw new Error(
    'ADS_ENABLED requiere un ID de AdSense válido (ca-pub- seguido de 16 dígitos).',
  );
const cmpRequired = env.PUBLIC_CMP_REQUIRED === 'true';
const cmpScriptUrl = env.PUBLIC_CMP_SCRIPT_URL || '';
if (cmpScriptUrl && !/^https:\/\/[a-z0-9.-]+\//i.test(cmpScriptUrl))
  throw new Error('La CMP requiere una URL HTTPS válida.');
if (adsReady && cmpRequired && !cmpScriptUrl)
  throw new Error(
    'Configura la CMP certificada antes de activar anuncios con PUBLIC_CMP_REQUIRED=true.',
  );
export const clientConfig = {
  adsEnabled: adsReady,
  clientId: ADSENSE_CLIENT_ID,
  analyticsToken: site.analyticsToken,
  cmpRequired,
  cmpScriptUrl,
};
