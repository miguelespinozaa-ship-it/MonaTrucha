import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { inspectPreflight } from '../scripts/preflight.mjs';
import {
  projectItems,
  pendingProjectItems,
} from '../scripts/project-board.mjs';
test('preflight describe configuración incompleta sin activar anuncios ni mostrar valores', () => {
  const env = {
    PUBLIC_SITE_URL: 'https://example.com',
    PUBLIC_CONTACT_EMAIL: 'pendiente@example.com',
  };
  const before = JSON.stringify(env);
  const result = inspectPreflight(env, '# placeholder');
  assert.equal(result.configurationComplete, false);
  assert.equal(result.adsEnabled, false);
  assert.equal(JSON.stringify(env), before);
  assert.ok(
    result.checks.find((c) => c.name === 'public/ads.txt' && !c.passed),
  );
  assert.ok(!JSON.stringify(result).includes('pendiente@example.com'));
});
test('preflight cruza cliente/ads.txt y exige CMP cuando se declara aplicable', () => {
  // Valores sintéticos de configuración para probar formato; no pertenecen a ninguna cuenta ni activan servicios.
  const env = {
    PUBLIC_SITE_URL: 'https://sitio.example.edu',
    PUBLIC_SITE_NAME: 'Nombre de prueba',
    PUBLIC_CONTACT_EMAIL: 'equipo@sitio.example.edu',
    PUBLIC_ADS_ENABLED: 'false',
    PUBLIC_ADSENSE_CLIENT_ID: 'ca-pub-1234567890123456',
    PUBLIC_CMP_REQUIRED: 'false',
  };
  for (const slot of ['NAV', 'HOME', 'SIDEBAR', 'ARTICLE', 'PLAYER'])
    env[`PUBLIC_AD_SLOT_${slot}`] = '1234567890';
  const ads = 'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0';
  assert.equal(inspectPreflight(env, ads).configurationComplete, true);
  assert.equal(
    inspectPreflight(env, ads, { requireCmp: true }).configurationComplete,
    false,
  );
  assert.equal(
    inspectPreflight(env, ads.replace('DIRECT', 'INVALID'))
      .configurationComplete,
    false,
  );
  assert.equal(
    inspectPreflight(
      { ...env, PUBLIC_SITE_URL: 'https://example.com@localhost/' },
      ads,
    ).configurationComplete,
    false,
  );
});
test('el tablero incluye todas las fases y roles; importar de nuevo omite borradores existentes', async () => {
  const tasks = JSON.parse(await readFile('docs/project-tasks.json', 'utf8'));
  const items = projectItems(tasks);
  assert.equal(items.length, 45);
  assert.deepEqual([...new Set(tasks.map((t) => t.id[1]))].sort(), [
    '0',
    '1',
    '2',
    '3',
  ]);
  assert.deepEqual([...new Set(tasks.map((t) => t.id[4]))].sort(), [
    '1',
    '2',
    '3',
  ]);
  assert.equal(
    pendingProjectItems(items, [{ content: { body: items[0].body } }]).length,
    items.length - 1,
  );
  assert.throws(() => projectItems([tasks[0], tasks[0]]));
});
