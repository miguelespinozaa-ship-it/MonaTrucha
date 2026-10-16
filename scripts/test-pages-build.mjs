import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout, clearTimeout } from 'node:timers';
import { Parser } from 'htmlparser2';
import matter from 'gray-matter';
import { readSeries } from './content.mjs';

export const previewOrigin = 'https://proyecto-de-prueba.pages.dev';
const output = '.cache/pages-build';
async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(file)));
    else files.push(file);
  }
  return files;
}
const locations = (xml) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

export async function verifyPagesBuild(directory = output) {
  const headers = await readFile(resolve(directory, '_headers'), 'utf8');
  const policy = headers.match(/^\s+Content-Security-Policy: (.+)$/m)?.[1];
  assert.ok(policy, 'Falta CSP generada en _headers.');
  assert.ok(
    Buffer.byteLength(`Content-Security-Policy: ${policy}`) <= 2000,
    'CSP supera 2000 bytes.',
  );
  const directives = Object.fromEntries(
    policy.split(';').map((part) => {
      const [name, ...values] = part.trim().split(/\s+/);
      return [name, values];
    }),
  );
  assert.ok(directives['script-src'].includes("'self'"));
  assert.ok(
    !directives['script-src'].includes("'unsafe-inline'"),
    'No permitir unsafe-inline en script-src.',
  );
  for (const domain of [
    'https://www.youtube-nocookie.com',
    'https://www.youtube.com',
    'https://*.googlesyndication.com',
    'https://*.doubleclick.net',
  ])
    assert.ok(
      directives['frame-src'].includes(domain),
      `Falta permiso de frame: ${domain}`,
    );
  assert.ok(
    directives['script-src'].includes('https://pagead2.googlesyndication.com'),
    'Falta permiso de script AdSense.',
  );
  assert.ok(
    directives['connect-src'].includes('https://*.googlesyndication.com'),
    'Falta permiso de conexión AdSense.',
  );
  assert.deepEqual(directives['frame-ancestors'], ["'none'"]);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /Cache-Control: public, max-age=31536000, immutable/);
  const files = (await walk(resolve(directory))).filter((file) =>
    file.endsWith('.html'),
  );
  assert.ok(files.length > 0, 'El build no contiene HTML.');
  const hashes = new Set();
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const tags = [];
    new Parser({ onopentag: (name, attrs) => tags.push({ name, attrs }) }).end(
      html,
    );
    const canonical = tags.filter(
      (tag) => tag.name === 'link' && tag.attrs.rel === 'canonical',
    );
    const path = file.endsWith('/404.html')
      ? '/404/'
      : '/' + relative(resolve(directory), file).replace(/index\.html$/, '');
    assert.deepEqual(
      canonical.map((tag) => tag.attrs.href),
      [new URL(path, previewOrigin).href],
      `Canónica incorrecta: ${path}`,
    );
    assert.ok(
      tags.some(
        (tag) =>
          tag.name === 'meta' &&
          tag.attrs.name === 'robots' &&
          tag.attrs.content === 'noindex,follow',
      ),
      `Falta noindex: ${path}`,
    );
    assert.ok(
      tags.some(
        (tag) =>
          tag.name === 'meta' &&
          tag.attrs.property === 'og:url' &&
          tag.attrs.content === new URL(path, previewOrigin).href,
      ),
      `Open Graph incorrecto: ${path}`,
    );
    const config = JSON.parse(
      html.match(
        /<script\b[^>]*id="site-config"[^>]*>([\s\S]*?)<\/script>/,
      )?.[1] || 'null',
    );
    assert.ok(
      config &&
        config.adsEnabled === false &&
        !config.analyticsToken &&
        !config.cmpScriptUrl,
      `Proveedor activado en ${path}`,
    );
    assert.ok(
      !tags.some(
        (tag) =>
          (tag.name === 'script' && /^https?:/.test(tag.attrs.src || '')) ||
          tag.name === 'iframe' ||
          (tag.attrs.class || '').split(/\s+/).includes('ad-slot'),
      ),
      `Recurso externo o anuncio activo en ${path}`,
    );
    for (const match of html.matchAll(
      /<script\b([^>]*)>([\s\S]*?)<\/script>/g,
    )) {
      if (!/\bsrc=|type="application\//.test(match[1]) && match[2]) {
        const hash = `'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`;
        assert.ok(
          directives['script-src'].includes(hash),
          `Hash CSP ausente: ${path}`,
        );
        hashes.add(hash);
      }
    }
  }
  assert.ok(hashes.size > 0, 'No se comprobaron scripts inline ejecutables.');
  assert.deepEqual(
    new Set(
      directives['script-src'].filter((token) => token.startsWith("'sha256-")),
    ),
    hashes,
    'CSP contiene hashes obsoletos.',
  );
  const robots = await readFile(resolve(directory, 'robots.txt'), 'utf8');
  assert.match(robots, /^Disallow: \/$/m);
  assert.ok(
    !/^Allow:/m.test(robots),
    'Robots no debe permitir rastreo en la prueba.',
  );
  assert.ok(robots.includes(`Sitemap: ${previewOrigin}/sitemap-index.xml`));
  const index = locations(
    await readFile(resolve(directory, 'sitemap-index.xml'), 'utf8'),
  );
  assert.ok(index.length > 0, 'Sitemap index vacío.');
  const urls = [];
  for (const location of index) {
    const url = new URL(location);
    assert.equal(url.origin, previewOrigin, 'Origen incorrecto del sitemap.');
    assert.match(url.pathname, /^\/sitemap-[\w-]+\.xml$/);
    urls.push(
      ...locations(
        await readFile(resolve(directory, '.' + url.pathname), 'utf8'),
      ),
    );
  }
  assert.ok(urls.includes(`${previewOrigin}/`), 'Falta inicio en sitemap.');
  const excluded = new Set(['/favoritos/', '/404.html', '/404/']);
  for (const series of await readSeries({ includeDrafts: true })) {
    if (series.placeholder || series.draft) {
      excluded.add(`/series/${series.id}/`);
      for (const episode of series.episodes)
        excluded.add(`/episodios/${series.id}/${episode.number}/`);
    }
  }
  for (const name of await readdir('src/content/articles')) {
    if (!name.endsWith('.md')) continue;
    const data = matter(
      await readFile(`src/content/articles/${name}`, 'utf8'),
    ).data;
    if (data.placeholder || data.draft)
      excluded.add(`/articulos/${name.slice(0, -3)}/`);
  }
  for (const location of urls) {
    const url = new URL(location);
    assert.equal(url.origin, previewOrigin);
    assert.ok(
      !excluded.has(url.pathname),
      `Muestra/borrador/ruta privada en sitemap: ${url.pathname}`,
    );
    await readFile(resolve(directory, '.' + url.pathname, 'index.html'));
  }
  for (const file of [
    'index.html',
    'catalogo/index.html',
    'series/ecos-de-neon/index.html',
    'episodios/ecos-de-neon/1/index.html',
    'articulos/por-donde-empezar/index.html',
    '404.html',
  ])
    await readFile(resolve(directory, file));
  return {
    origin: previewOrigin,
    pages: files.length,
    inlineHashes: hashes.size,
    sitemapFiles: index.length + 1,
    sitemapUrls: urls.length,
    noindex: true,
    adsEnabled: false,
    analyticsEnabled: false,
  };
}

async function verifyHttp() {
  const port = '4363';
  const server = spawn(process.execPath, ['scripts/serve-test.mjs'], {
    env: { ...process.env, SITE_TEST_DIR: output, SITE_TEST_PORT: port },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  try {
    await new Promise((resolveReady, reject) => {
      const timer = setTimeout(
        () => reject(new Error('El servidor de prueba no arrancó en 10 s.')),
        10000,
      );
      const ready = () => {
        clearTimeout(timer);
        resolveReady();
      };
      server.stdout.once('data', ready);
      server.once('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      server.once('exit', () => {
        clearTimeout(timer);
        reject(new Error('El servidor terminó antes de la prueba.'));
      });
    });
    for (const [path, status] of [
      ['/', 200],
      ['/catalogo/', 200],
      ['/404.html', 200],
      ['/ruta-inexistente-de-prueba/', 404],
    ]) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(
        response.status,
        status,
        `Estado HTTP local incorrecto: ${path}`,
      );
      assert.ok(
        response.headers.get('content-security-policy')?.includes('sha256-'),
        'Falta CSP en la respuesta local.',
      );
      assert.match(await response.text(), /noindex,follow/);
    }
  } finally {
    server.kill();
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    // Origen ficticio para validar artefactos; no publica ni consulta una cuenta Pages.
    const env = {
      ...process.env,
      BUILD_OUTPUT_DIR: output,
      PUBLIC_SITE_URL: previewOrigin,
      PUBLIC_SITE_NAME: 'Yoru',
      PUBLIC_ADS_ENABLED: 'false',
      PUBLIC_INDEXING_ENABLED: 'false',
      PUBLIC_ADSENSE_CLIENT_ID: '',
      PUBLIC_CF_ANALYTICS_TOKEN: '',
      PUBLIC_CMP_SCRIPT_URL: '',
      PUBLIC_CMP_REQUIRED: 'false',
      PUBLIC_CONTACT_EMAIL: '',
      PUBLIC_GOOGLE_SITE_VERIFICATION: '',
    };
    for (const position of ['NAV', 'HOME', 'SIDEBAR', 'ARTICLE', 'PLAYER'])
      env[`PUBLIC_AD_SLOT_${position}`] = '';
    const build = spawnSync('npm', ['run', 'build'], { env, stdio: 'inherit' });
    if (build.error || build.status !== 0)
      throw build.error || new Error('Falló el build de prueba Pages.');
    const report = await verifyPagesBuild();
    await verifyHttp();
    await writeFile(
      '.cache/pages-validation.json',
      JSON.stringify(
        {
          ...report,
          localHttp: '200/404 con CSP comprobados',
          published: false,
        },
        null,
        2,
      ),
    );
    console.log(JSON.stringify(report));
    console.log(
      'Prueba local correcta. No se ha creado ni publicado un proyecto de Cloudflare.',
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
