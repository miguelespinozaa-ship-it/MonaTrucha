import './env.mjs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function publicOrigin(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === '/' &&
      !url.port &&
      !/(^|\.)(example\.(com|net|org)|localhost|test|invalid|example)$/.test(
        url.hostname,
      ) &&
      !/^[\d.]+$|:/.test(url.hostname) &&
      url.hostname.includes('.')
    );
  } catch {
    return false;
  }
}
export function inspectPreflight(
  env,
  adsTxt = '',
  { requireCmp = false } = {},
) {
  const checks = [];
  const add = (name, passed, message) =>
    checks.push({ name, passed: Boolean(passed), message });
  const client = env.PUBLIC_ADSENSE_CLIENT_ID || '';
  add(
    'PUBLIC_SITE_URL',
    publicOrigin(env.PUBLIC_SITE_URL),
    'Origen HTTPS propio, sin example.com, credenciales, rutas ni puertos.',
  );
  add(
    'PUBLIC_SITE_NAME',
    Boolean(env.PUBLIC_SITE_NAME?.trim()) &&
      env.PUBLIC_SITE_NAME.trim().toLowerCase() !== 'pendiente',
    'Elegir y declarar el nombre definitivo del sitio.',
  );
  add(
    'PUBLIC_CONTACT_EMAIL',
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.PUBLIC_CONTACT_EMAIL || '') &&
      !/@(?:.*\.)?example\.(com|net|org)$/i.test(env.PUBLIC_CONTACT_EMAIL),
    'Correo de contacto real del titular.',
  );
  add(
    'PUBLIC_ADSENSE_CLIENT_ID',
    /^ca-pub-\d{16}$/.test(client) && !/^ca-pub-0+$/.test(client),
    'ID de formato válido; la aprobación y titularidad las verifica la persona 3.',
  );
  for (const position of ['NAV', 'HOME', 'SIDEBAR', 'ARTICLE', 'PLAYER'])
    add(
      `PUBLIC_AD_SLOT_${position}`,
      /^\d{5,20}$/.test(env[`PUBLIC_AD_SLOT_${position}`] || '') &&
        !/^0+$/.test(env[`PUBLIC_AD_SLOT_${position}`]),
      'Completar el slot de esta posición con el valor del panel de AdSense.',
    );
  add(
    'PUBLIC_ADS_ENABLED',
    ['true', 'false'].includes(env.PUBLIC_ADS_ENABLED || 'false'),
    'La opción debe ser true o false; este script nunca la modifica.',
  );
  const cmpRequired = requireCmp || env.PUBLIC_CMP_REQUIRED === 'true';
  add(
    'PUBLIC_CMP_REQUIRED',
    requireCmp || ['true', 'false'].includes(env.PUBLIC_CMP_REQUIRED),
    'Declarar si la CMP aplica según país/público; no se infiere la jurisdicción.',
  );
  let cmpUrl = false;
  try {
    const url = new URL(env.PUBLIC_CMP_SCRIPT_URL);
    cmpUrl =
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !/(^|\.)example\.(com|org|net)$/.test(url.hostname);
  } catch {
    /* Ausencia de proveedor configurado. */
  }
  add(
    'PUBLIC_CMP_SCRIPT_URL',
    !cmpRequired || cmpUrl,
    'Si aplica CMP, configurar un cargador HTTPS y comprobar la certificación del proveedor manualmente.',
  );
  const publisher = client.replace(/^ca-/, '');
  const entries = adsTxt
    .split(/\r?\n/)
    .map((line) => line.split('#')[0].trim())
    .filter(Boolean)
    .map((line) => line.split(',').map((part) => part.trim()));
  add(
    'public/ads.txt',
    /^pub-\d{16}$/.test(publisher) &&
      entries.some(
        ([domain, id, relationship, authority]) =>
          domain === 'google.com' &&
          id === publisher &&
          ['DIRECT', 'RESELLER'].includes(relationship) &&
          authority === 'f08c47fec0942fa0',
      ),
    'Sustituir el placeholder por la entrada exacta de Google correspondiente al cliente.',
  );
  return {
    configurationComplete: checks.every((c) => c.passed),
    adsEnabled: env.PUBLIC_ADS_ENABLED === 'true',
    cmpRequired,
    checks,
    manual: [
      'Confirmar licencias, regiones, público y contenido definitivo.',
      'Comprobar aprobación de AdSense, slots, Auto ads desactivado y CMP certificada donde Google la exija.',
      'Revisar titular, privacidad y responsables CODEOWNERS; el script no acredita cumplimiento ni activa anuncios.',
      'Conservar noindex hasta una decisión editorial y una tarea de lanzamiento autorizada.',
    ],
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const known = new Set(['--strict', '--cmp-required', '--json']);
  if (process.argv.slice(2).some((arg) => !known.has(arg))) {
    console.error('Opciones: --strict, --cmp-required, --json');
    process.exitCode = 2;
  } else {
    let adsTxt = '';
    try {
      adsTxt = await readFile('public/ads.txt', 'utf8');
    } catch {
      /* Se informa como comprobación pendiente. */
    }
    const report = inspectPreflight(process.env, adsTxt, {
      requireCmp: process.argv.includes('--cmp-required'),
    });
    if (process.argv.includes('--json'))
      console.log(JSON.stringify(report, null, 2));
    else {
      for (const check of report.checks)
        console.log(
          `${check.passed ? 'OK' : 'PENDIENTE'} ${check.name}: ${check.message}`,
        );
      for (const item of report.manual) console.log(`HUMANO: ${item}`);
      console.log(
        'Solo diagnóstico: no se han cambiado variables, anuncios, ads.txt ni noindex.',
      );
    }
    if (process.argv.includes('--strict') && !report.configurationComplete)
      process.exitCode = 1;
  }
}
