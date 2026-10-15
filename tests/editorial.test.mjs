import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import matter from 'gray-matter';
import { analyzeContent, countWords } from '../scripts/content-report.mjs';
import { createContent } from '../scripts/new-content.mjs';
const text =
  'Este texto ficticio prueba únicamente herramientas editoriales. '.repeat(25);
async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'editorial-'));
  try {
    for (const kind of ['series', 'article']) {
      const path = await createContent(kind, 'muestra-prueba', root);
      const parsed = matter(await readFile(path, 'utf8'));
      parsed.data.draft = false;
      for (const key of kind === 'series' ? ['cover', 'hero'] : ['cover']) {
        const asset = resolve(dirname(path), parsed.data[key]);
        await mkdir(dirname(asset), { recursive: true });
        await writeFile(asset, 'fixture de existencia; no se renderiza');
      }
      await writeFile(path, matter.stringify(text, parsed.data));
    }
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
test('informe: las muestras no cuentan para metas ni acreditan vídeos reales', async () =>
  fixture(async (root) => {
    const report = await analyzeContent(root);
    assert.equal(report.invalid, 0);
    assert.equal(report.counts.realSeries, 0);
    assert.equal(report.counts.placeholderSeries, 1);
    assert.equal(report.counts.definitiveArticles, 0);
    assert.equal(report.counts.verifiedVideos, 0);
    assert.deepEqual(
      report.goals.map((g) => g.target),
      [20, 50, 30],
    );
    assert.equal(
      countWords(
        '<!-- comentario --> ## Hola [mundo](https://example.com) ![no cuenta](x.png)',
      ),
      2,
    );
  }));
test('CLI permite metas pendientes pero rechaza texto inválido y episodios duplicados', async () =>
  fixture(async (root) => {
    const cli = resolve('scripts/content-report.mjs');
    const run = () =>
      spawnSync(process.execPath, [cli], { cwd: root, encoding: 'utf8' });
    assert.equal(run().status, 0);
    const path = join(root, 'src/content/series/muestra-prueba.md');
    const original = await readFile(path, 'utf8');
    const parsed = matter(original);
    await writeFile(path, matter.stringify('Breve.', parsed.data));
    assert.equal(run().status, 1);
    const episode = {
      number: 1,
      title: 'Muestra sin vídeo',
      youtubeId: null,
      officialChannel: null,
      verified: false,
      regions: [],
      legalUrl: 'https://www.crunchyroll.com/',
    };
    await writeFile(
      path,
      matter.stringify(text, { ...parsed.data, episodes: [episode, episode] }),
    );
    assert.equal((await analyzeContent(root)).invalid, 1);
  }));
test('generadores no sobrescriben ni escapan de la carpeta y sus borradores no cuentan', async () =>
  fixture(async (root) => {
    const series = await createContent('series', 'nueva-ficha', root);
    const article = await createContent('article', 'nueva-guia', root);
    assert.match(await readFile(series, 'utf8'), /draft: true/);
    assert.match(await readFile(article, 'utf8'), /placeholder: true/);
    await assert.rejects(createContent('series', 'nueva-ficha', root), {
      code: 'EEXIST',
    });
    await assert.rejects(createContent('series', '../../escape', root));
    const report = await analyzeContent(root);
    assert.equal(report.invalid, 0);
    assert.equal(report.counts.drafts, 2);
    assert.equal(report.counts.placeholderSeries, 1);
  }));
