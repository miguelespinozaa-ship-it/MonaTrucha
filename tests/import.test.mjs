import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  readdir,
  rm,
  symlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import matter from 'gray-matter';
import { z } from 'astro/zod';
import { importContent, parseCsv } from '../scripts/import-content.mjs';
import { analyzeContent } from '../scripts/content-report.mjs';
import { seriesSchema } from '../src/data/content-schema.mjs';

// Datos sintéticos aislados: ningún ID, canal o región acredita una obra real.
const base = {
  slug: 'fixture-importacion',
  titulo_verificado: 'Muestra ficticia, solo prueba',
  subtitulo: 'Un subtítulo de prueba',
  descripcion: 'Descripción de prueba sin obra real.',
  texto_serie: 'palabra '.repeat(180).trim(),
  generos: 'Prueba;Fixture',
  anio: '2026',
  formato: 'Serie',
  estado_serie: 'Próximamente',
  duracion: '24',
  portada: '../../assets/fixture.png',
  hero: '../../assets/fixture.png',
  episodio_numero: '',
  episodio_titulo: '',
  alternativa_legal_url: '',
  youtube_id: '',
  canal_oficial: '',
  regiones_verificadas: '',
  verified: '',
};
const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;
const csv = (rows) =>
  `${Object.keys(base).join(',')}\r\n${rows
    .map((row) =>
      Object.keys(base)
        .map((key) => quote(row[key] ?? ''))
        .join(','),
    )
    .join('\r\n')}\r\n`;
async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'csv-import-'));
  try {
    for (const dir of [
      'src/content/series',
      'src/content/articles',
      'src/assets',
    ])
      await mkdir(join(root, dir), { recursive: true });
    await writeFile(
      join(root, 'src/assets/fixture.png'),
      'fixture de existencia, sin renderizado',
    );
    const input = join(root, 'entrada.csv');
    const save = (rows) => writeFile(input, csv(rows));
    await save([base]);
    await run({
      root,
      input,
      save,
      output: join(root, 'src/content/series/fixture-importacion.md'),
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('CSV: BOM, comas, comillas escapadas, CRLF y texto multilínea', () => {
  const row = {
    ...base,
    titulo_verificado: 'Muestra "A", prueba',
    texto_serie: `${base.texto_serie}\nOtro párrafo.`,
  };
  const parsed = parseCsv(`\uFEFF${csv([row])}`);
  assert.equal(parsed[0].values.titulo_verificado, row.titulo_verificado);
  assert.equal(parsed[0].values.texto_serie, row.texto_serie);
  assert.throws(() => parseCsv('slug,slug\na,b'), /duplicadas/);
  assert.throws(() => parseCsv('slug\na'), /faltan columnas/);
  assert.throws(() => parseCsv('"sin cerrar'), /sin cerrar/);
  assert.throws(() => parseCsv('slug\n"a"texto'), /después de cerrar/);
  assert.throws(
    () => parseCsv(`${Object.keys(base).join(',')}\na,b`),
    /Fila 2.*celdas/,
  );
});
test('importar solo crea borradores; dry-run no escribe ni crea cachés', async () =>
  fixture(async ({ root, input, output }) => {
    const before = await readdir(root, { recursive: true });
    const preview = await importContent(input, { root, dryRun: true });
    assert.deepEqual(await readdir(root, { recursive: true }), before);
    assert.equal(preview[0].action, 'crear');
    await importContent(input, { root });
    const { data } = matter(await readFile(output, 'utf8'));
    assert.equal(data.draft, true);
    assert.equal(data.placeholder, false);
    assert.deepEqual(data.episodes, []);
    const report = await analyzeContent(root);
    assert.equal(report.invalid, 0);
    assert.equal(report.counts.drafts, 1);
    assert.equal(report.counts.realSeries, 0);
  }));
test('verified se copia solo del CSV; vídeo pendiente permanece borrador y no es publicable', async () =>
  fixture(async ({ root, input, save, output }) => {
    const pending = {
      ...base,
      episodio_numero: '1',
      episodio_titulo: 'Fixture aislada',
      alternativa_legal_url: 'https://www.crunchyroll.com/',
      youtube_id: 'abcdefghijk',
      canal_oficial: '@MuseAsia',
      regiones_verificadas: 'SOLO_FIXTURE',
      verified: 'false',
    };
    await save([pending]);
    await importContent(input, { root });
    let { data } = matter(await readFile(output, 'utf8'));
    assert.equal(data.episodes[0].verified, false);
    assert.equal(data.episodes[0].youtubeId, pending.youtube_id);
    assert.deepEqual(data.episodes[0].regions, ['SOLO_FIXTURE']);
    assert.equal((await analyzeContent(root)).invalid, 0);
    assert.equal(
      seriesSchema(() => z.string()).safeParse({ ...data, draft: false })
        .success,
      false,
    );
    await save([{ ...pending, verified: 'true' }]);
    await importContent(input, { root, force: true });
    data = matter(await readFile(output, 'utf8')).data;
    assert.equal(data.episodes[0].verified, true);
    assert.equal((await analyzeContent(root)).counts.verifiedVideos, 0);
  }));
test('rechaza texto, canales, ID, regiones, verified y metadatos con mensajes por fila', async () =>
  fixture(async ({ root, input, save }) => {
    const episode = {
      ...base,
      episodio_numero: '1',
      episodio_titulo: 'Prueba',
      alternativa_legal_url: 'https://www.crunchyroll.com/',
      youtube_id: 'abcdefghijk',
      canal_oficial: '@MuseAsia',
      regiones_verificadas: 'SOLO_FIXTURE',
    };
    for (const [patch, message] of [
      [{ texto_serie: 'Breve' }, /150 y 300/],
      [{ texto_serie: 'palabra '.repeat(301) }, /301 palabras/],
      [{ canal_oficial: '@NO_ADMITIDO_FIXTURE' }, /canal_oficial no admitido/],
      [{ youtube_id: 'corto' }, /11 caracteres/],
      [{ regiones_verificadas: '' }, /faltan regiones/],
      [{ canal_oficial: '' }, /falta canal_oficial/],
      [{ verified: 'sí' }, /verified solo admite/],
      [{ verified: 'true', youtube_id: '' }, /requiere youtube_id explícito/],
      [{ anio: 'no numérico' }, /campos de ficha inválidos/],
      [{ portada: '../../assets/../../fuera.png' }, /inexistente o fuera/],
    ]) {
      await save([{ ...episode, ...patch }]);
      await assert.rejects(
        importContent(input, { root }),
        (error) => /Fila 2/.test(error.message) && message.test(error.message),
      );
    }
    assert.deepEqual(await readdir(join(root, 'src/content/series')), []);
  }));
test('no sobrescribe sin force; duplicados y rutas maliciosas no escriben fichas parciales', async () =>
  fixture(async ({ root, input, save, output }) => {
    await importContent(input, { root });
    const original = await readFile(output, 'utf8');
    await save([{ ...base, titulo_verificado: 'Cambio de fixture' }]);
    await assert.rejects(importContent(input, { root }), /ya existe.*--force/);
    assert.equal(await readFile(output, 'utf8'), original);
    await importContent(input, { root, force: true });
    assert.match(await readFile(output, 'utf8'), /Cambio de fixture/);
    await save([base, base]);
    await assert.rejects(
      importContent(input, { root, force: true }),
      /Fila 3.*slug duplicado/,
    );
    for (const slug of [
      '../fuera',
      '/tmp/fuera',
      '..\\fuera',
      '%2e%2e',
      'otra.md',
      'a/b',
      'a\u0000b',
    ]) {
      await save([
        { ...base, slug: 'otra-valida' },
        { ...base, slug },
      ]);
      await assert.rejects(importContent(input, { root }), /slug inválido/);
    }
    assert.deepEqual(await readdir(join(root, 'src/content/series')), [
      'fixture-importacion.md',
    ]);
  }));
test('ni force sigue enlaces simbólicos y el CLI mantiene dry-run sin escrituras', async () =>
  fixture(async ({ root, input, output }) => {
    const victim = join(root, 'no-tocar.md');
    await writeFile(victim, 'original');
    await symlink(victim, output);
    await assert.rejects(
      importContent(input, { root, force: true }),
      /enlaces simbólicos/,
    );
    assert.equal(await readFile(victim, 'utf8'), 'original');
    await rm(output);
    const cli = resolve('scripts/import-content.mjs');
    const run = spawnSync(process.execPath, [cli, input, '--dry-run'], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /no se ha escrito ningún archivo/);
    assert.deepEqual(await readdir(join(root, 'src/content/series')), []);
  }));
