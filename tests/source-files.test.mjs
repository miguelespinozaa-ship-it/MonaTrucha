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
import { join } from 'node:path';
import { sourceInventory, copySources } from '../scripts/source-files.mjs';

async function fixture(run) {
  const temp = await mkdtemp(join(tmpdir(), 'source-export-'));
  const root = join(temp, 'source');
  await mkdir(root);
  const put = async (path, data = 'fixture sin datos reales') => {
    await mkdir(join(root, path, '..'), { recursive: true });
    await writeFile(join(root, path), data);
  };
  try {
    await run({ temp, root, put });
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
test('inventario sin Git conserva ocultos necesarios y excluye cachés, entorno y archivos generados', async () =>
  fixture(async ({ root, put }) => {
    for (const path of [
      'README.md',
      '.env.example',
      '.github/workflows/ci.yml',
    ])
      await put(path);
    for (const path of [
      '.env',
      '.env.local',
      '.git/config',
      'node_modules/pkg/index.js',
      '.cache/report.json',
      '.astro/types.d.ts',
      'dist/index.html',
      'test-results/trace.zip',
      'archivo.zip',
    ])
      await put(path);
    const result = await sourceInventory(root);
    assert.deepEqual(
      result.files.map((f) => f.path),
      ['.env.example', '.github/workflows/ci.yml', 'README.md'],
    );
    assert.equal(result.overWebLimit.length, 0);
    assert.equal(result.batches.length, 1);
    assert.ok(result.files.every((f) => /^[a-f0-9]{64}$/.test(f.sha256)));
  }));
test('copia limpia y lotes conservan rutas; no sobrescriben ni devuelven la salida al código', async () =>
  fixture(async ({ temp, root, put }) => {
    for (let i = 0; i < 105; i++) await put(`docs/archivo-${i}.md`);
    await put('.env.example', 'PUBLIC_ADS_ENABLED=false');
    const inventory = await sourceInventory(root);
    const copy = join(temp, 'clean'),
      batches = join(temp, 'batches');
    await copySources(root, copy, inventory);
    assert.equal(
      await readFile(join(copy, '.env.example'), 'utf8'),
      'PUBLIC_ADS_ENABLED=false',
    );
    await copySources(root, batches, inventory, true);
    const counts = [];
    for (const name of await readdir(batches)) {
      const files = await readdir(join(batches, name), {
        recursive: true,
        withFileTypes: true,
      });
      counts.push(files.filter((f) => f.isFile()).length);
    }
    assert.deepEqual(counts, [100, 6]);
    await assert.rejects(copySources(root, copy, inventory), /nueva o vacía/);
    await assert.rejects(
      copySources(root, join(root, 'src/export'), inventory),
      /fuera del árbol/,
    );
    await put('docs/cambio.md');
    await writeFile(join(root, '.env.example'), 'cambio');
    await assert.rejects(
      copySources(root, join(temp, 'changed'), inventory),
      /Cambió/,
    );
  }));
test('detiene exportaciones con credenciales detectables o enlaces simbólicos', async () =>
  fixture(async ({ root, put }) => {
    await put('credencial.txt', 'ghp_' + 'X'.repeat(36));
    await assert.rejects(
      sourceInventory(root),
      /Posible secreto en credencial.txt/,
    );
    await rm(join(root, 'credencial.txt'));
    await put('README.md');
    await symlink(join(root, 'README.md'), join(root, 'enlace'));
    await assert.rejects(sourceInventory(root), /Enlace simbólico/);
  }));
