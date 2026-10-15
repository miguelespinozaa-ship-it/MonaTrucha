import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  checkLinks,
  probeExternal,
  externalResponse,
  publicAddress,
} from '../scripts/link-checker.mjs';
const lookupHost = async () => [{ address: '93.184.216.34' }];
const response = (status, headers = {}) =>
  new Response(null, { status, headers });
test('detecta rutas y anclas rotas, y tolera red desconocida sin inventar éxitos', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'links-'));
  try {
    await writeFile(
      join(directory, 'index.html'),
      '<link rel="canonical" href="https://example.com/"><h1 id="inicio">Inicio</h1><a href="#inicio">OK</a><a href="#ausente">Mal</a><a href="/ausente/">Mal</a><a href="https://external.test/path">Externo</a>',
    );
    const report = await checkLinks({
      directory,
      probe: async () => ({ status: 'unknown', reason: 'Sin red' }),
    });
    assert.equal(report.counts.passed, 1);
    assert.equal(report.counts.failed, 2);
    assert.equal(report.counts.unknown, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
test('HEAD rechazado permite GET; solo 404/410 confirmados fallan', async () => {
  for (const [head, get, expected] of [
    [405, 200, 'passed'],
    [404, 404, 'failed'],
    [410, 410, 'failed'],
    [403, 403, 'unknown'],
    [503, 503, 'unknown'],
    [429, 429, 'unknown'],
  ]) {
    const result = await probeExternal('https://external.test/', {
      lookupHost,
      fetchImpl: async (_, options) =>
        response(options.method === 'HEAD' ? head : get),
    });
    assert.equal(result.status, expected);
  }
  assert.equal(
    (
      await probeExternal('https://external.test/', {
        lookupHost,
        fetchImpl: async () => {
          throw new Error('Timeout');
        },
      })
    ).status,
    'unknown',
  );
});
test('no consulta redes privadas, credenciales ni destinos privados tras redirigir', async () => {
  for (const ip of [
    '127.0.0.1',
    '10.0.0.1',
    '169.254.169.254',
    '::1',
    '::ffff:127.0.0.1',
    '192.168.1.1',
  ])
    assert.equal(publicAddress(ip), false);
  let calls = 0;
  await assert.rejects(
    externalResponse('https://external.test/', {
      lookupHost,
      fetchImpl: async () => {
        calls++;
        return response(302, { location: 'https://127.0.0.1/private' });
      },
    }),
    /privado/,
  );
  assert.equal(calls, 1);
  await assert.rejects(
    externalResponse('https://user:password@external.test/', { lookupHost }),
    /credenciales/,
  );
});
