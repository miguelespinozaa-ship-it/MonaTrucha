import { readdir, readFile, stat, realpath } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { Parser } from 'htmlparser2';

export function publicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split('.').map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113)
    );
  }
  return (
    isIP(address) === 6 &&
    /^[23]/.test(address) &&
    !address.toLowerCase().startsWith('2001:db8:')
  );
}
export function displayUrl(value) {
  const url = new URL(value);
  url.username = '';
  url.password = '';
  url.search = '';
  return url.href;
}
export async function externalResponse(
  value,
  {
    fetchImpl = fetch,
    lookupHost = (host) => lookup(host, { all: true }),
    method = 'GET',
    timeout = 7000,
  } = {},
) {
  let url = new URL(value);
  for (let redirects = 0; redirects <= 5; redirects++) {
    if (url.protocol !== 'https:' || url.username || url.password)
      throw new Error(
        'Destino externo no permitido: HTTPS sin credenciales requerido',
      );
    const host = url.hostname.replace(/^\[|\]$/g, '');
    const addresses = isIP(host) ? [{ address: host }] : await lookupHost(host);
    if (
      !addresses.length ||
      addresses.some(({ address }) => !publicAddress(address))
    )
      throw new Error('Destino externo privado o reservado bloqueado');
    const response = await fetchImpl(url.href, {
      method,
      redirect: 'manual',
      signal: AbortSignal.timeout(timeout),
      credentials: 'omit',
      headers: { 'User-Agent': 'project-link-checker/1.0' },
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get('location');
    await response.body?.cancel();
    if (!location) throw new Error('Redirección sin destino');
    url = new URL(location, url);
  }
  throw new Error('Demasiadas redirecciones');
}
export async function probeExternal(url, options = {}) {
  try {
    let response = await externalResponse(url, { ...options, method: 'HEAD' });
    let status = response.status;
    await response.body?.cancel();
    if (status < 200 || status >= 400) {
      response = await externalResponse(url, options);
      status = response.status;
      await response.body?.cancel();
    }
    return {
      status:
        status >= 200 && status < 400
          ? 'passed'
          : [404, 410].includes(status)
            ? 'failed'
            : 'unknown',
      http: status,
      reason: [404, 410].includes(status)
        ? 'HEAD y GET confirman recurso no disponible'
        : status >= 400
          ? 'Requiere revisión: acceso, límite o servidor; no se declara enlace roto'
          : 'Respuesta HTTP accesible',
    };
  } catch (error) {
    return { status: 'unknown', reason: error.message };
  }
}
export function parseHtml(html) {
  const ids = new Set();
  const refs = [];
  let canonical;
  const parser = new Parser(
    {
      onopentag(name, attrs) {
        if (attrs.id) ids.add(attrs.id);
        if (name === 'a' && attrs.name) ids.add(attrs.name);
        if (name === 'link' && attrs.rel === 'canonical') {
          canonical = attrs.href;
          return;
        }
        if (attrs.href && ['a', 'link'].includes(name)) refs.push(attrs.href);
        if (
          attrs.src &&
          ['img', 'script', 'iframe', 'source', 'video', 'audio'].includes(name)
        )
          refs.push(attrs.src);
        if (attrs.srcset)
          for (const item of attrs.srcset.split(','))
            refs.push(item.trim().split(/\s+/)[0]);
      },
    },
    { decodeEntities: true },
  );
  parser.end(html);
  return { ids, refs, canonical };
}
export async function checkLinks({
  directory = 'dist',
  siteUrl,
  internalOnly = false,
  probe = probeExternal,
} = {}) {
  const root = await realpath(directory);
  const pages = new Map();
  async function walk(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const file = resolve(folder, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile() && file.endsWith('.html'))
        pages.set(file, parseHtml(await readFile(file, 'utf8')));
    }
  }
  await walk(root);
  if (!pages.size)
    throw new Error('No hay HTML compilado; ejecuta npm run build.');
  const origin = new URL(
    siteUrl ||
      pages.get(resolve(root, 'index.html'))?.canonical ||
      'https://example.com',
  ).origin;
  const results = [];
  const external = new Map();
  const seen = new Set();
  for (const [file, page] of pages) {
    const source = relative(root, file).replace(/index\.html$/, '');
    for (const ref of page.refs) {
      let destination;
      try {
        const url = new URL(ref, origin + '/' + source);
        destination = displayUrl(url.href);
        if (['mailto:', 'tel:', 'data:'].includes(url.protocol)) continue;
        if (!['http:', 'https:'].includes(url.protocol))
          throw new Error('Protocolo de enlace no permitido');
        const key = `${source}|${url.href}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (url.origin !== origin) {
          if (!external.has(url.href)) external.set(url.href, []);
          external.get(url.href).push(source);
          continue;
        }
        let target = resolve(root, '.' + decodeURIComponent(url.pathname));
        if (target !== root && !target.startsWith(root + sep))
          throw new Error('Ruta fuera de dist');
        let info;
        try {
          info = await stat(target);
        } catch {
          if (!url.pathname.endsWith('.html')) {
            target += '.html';
            info = await stat(target);
          } else throw new Error('Destino interno inexistente');
        }
        if (info.isDirectory()) target = resolve(target, 'index.html');
        const physical = await realpath(target);
        if (physical !== root && !physical.startsWith(root + sep))
          throw new Error('Enlace fuera de dist');
        if (
          url.hash &&
          pages.has(target) &&
          !pages.get(target).ids.has(decodeURIComponent(url.hash.slice(1)))
        )
          throw new Error('Ancla interna inexistente');
        results.push({
          source,
          url: displayUrl(url.href),
          kind: 'internal',
          status: 'passed',
        });
      } catch (error) {
        results.push({
          source,
          url: destination,
          kind: 'internal',
          status: 'failed',
          reason:
            error.code === 'ENOENT'
              ? 'Destino interno inexistente'
              : error.message,
        });
      }
    }
  }
  // Limita concurrencia: las caídas de red no bloquean el resto del sitio ni marcan falsos 404.
  const queue = [...external];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(4, queue.length) }, async () => {
      while (cursor < queue.length) {
        const [url, sources] = queue[cursor++];
        results.push({
          sources,
          url: displayUrl(url),
          kind: 'external',
          ...(internalOnly
            ? { status: 'skipped', reason: 'Modo solo interno' }
            : await probe(url)),
        });
      }
    }),
  );
  return {
    runAt: new Date().toISOString(),
    pages: pages.size,
    results,
    counts: Object.fromEntries(
      ['passed', 'failed', 'unknown', 'skipped'].map((status) => [
        status,
        results.filter((r) => r.status === status).length,
      ]),
    ),
  };
}
