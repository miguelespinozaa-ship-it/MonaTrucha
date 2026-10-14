import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

test('actualización Jikan: portada local, caché y fallo al superar siete días sin API', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'anime-metadata-'));
  try {
    await mkdir(join(directory, 'src/content/series'), { recursive: true });
    await writeFile(
      join(directory, 'src/content/series/fixture.md'),
      '---\nplaceholder: false\napiId: 1\nepisodes: []\n---\nPrueba de integración, sin publicación.',
    );
    const png = await sharp({
      create: { width: 20, height: 30, channels: 3, background: '#334466' },
    })
      .png()
      .toBuffer();
    await writeFile(
      join(directory, 'mock.mjs'),
      `import {appendFileSync} from 'node:fs';
      globalThis.fetch=async(url)=>{
        appendFileSync('calls.log', String(url)+'\\n');
        if(process.env.API_FAIL==='true') throw new Error('API no disponible');
        if(String(url).includes('api.jikan.moe')) return new Response(JSON.stringify({data:{title:'Título API',synopsis:'Sinopsis API',genres:[{name:'Adventure'}],images:{jpg:{large_image_url:'https://cdn.myanimelist.net/fixture.png'}}}}));
        return new Response(Buffer.from('${png.toString('base64')}','base64'),{headers:{'content-type':'image/png'}});
      };`,
    );
    const run = () =>
      spawnSync(
        process.execPath,
        [
          '--import',
          join(directory, 'mock.mjs'),
          resolve('scripts/refresh-metadata.mjs'),
        ],
        {
          cwd: directory,
          env: { ...process.env, API_FAIL: 'false' },
          encoding: 'utf8',
        },
      );
    assert.equal(run().status, 0);
    const cachePath = join(directory, '.cache/anime-metadata.json');
    const cache = JSON.parse(await readFile(cachePath, 'utf8'));
    assert.equal(cache['1'].title, 'Título API');
    assert.equal(
      (await sharp(join(directory, 'src/assets/remote/1.jpg')).metadata())
        .format,
      'jpeg',
    );
    const calls = await readFile(join(directory, 'calls.log'), 'utf8');
    assert.equal(calls.trim().split('\n').length, 2);
    assert.equal(run().status, 0);
    assert.equal(await readFile(join(directory, 'calls.log'), 'utf8'), calls);
    cache['1'].fetchedAt = new Date(Date.now() - 2 * 86400000).toISOString();
    await writeFile(cachePath, JSON.stringify(cache));
    const failedFetch = () =>
      spawnSync(
        process.execPath,
        [
          '--import',
          join(directory, 'mock.mjs'),
          resolve('scripts/refresh-metadata.mjs'),
        ],
        {
          cwd: directory,
          env: { ...process.env, API_FAIL: 'true' },
          encoding: 'utf8',
        },
      );
    assert.equal(
      failedFetch().status,
      0,
      'La caché reciente conserva la compilación sin API',
    );
    cache['1'].fetchedAt = new Date(Date.now() - 8 * 86400000).toISOString();
    await writeFile(cachePath, JSON.stringify(cache));
    assert.notEqual(
      failedFetch().status,
      0,
      'Los datos demasiado antiguos no se publican silenciosamente',
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
