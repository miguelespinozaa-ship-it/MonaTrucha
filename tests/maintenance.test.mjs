import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeMaintenanceReport,
  publishMaintenanceIssue,
  isoWeek,
} from '../scripts/maintenance-report.mjs';
import { checkVideo } from '../scripts/verify-videos.mjs';
const date = new Date('2026-10-14T12:00:00Z');
const report = (results) => ({ runAt: date.toISOString(), results });
const build = (overrides = {}) =>
  makeMaintenanceReport({
    videos: report([{ status: 'skipped' }]),
    links: report([
      {
        status: 'unknown',
        url: 'https://example.com/',
        reason: 'Sin conexión',
      },
    ]),
    date,
    notBefore: date.getTime() - 1000,
    ...overrides,
  });
test('informe conserva desconocidos/omitidos y detecta informes ausentes o antiguos', () => {
  const result = build();
  assert.equal(result.sections.links.counts.unknown, 1);
  assert.equal(result.sections.videos.counts.skipped, 1);
  const stale = build({
    videos: { runAt: '2020-01-01', results: [] },
    links: null,
    steps: { build: 'failure' },
  });
  assert.equal(stale.problems.length, 3);
  assert.ok(build({ links: report([null]) }).problems.length);
  const large = build({
    links: report(
      Array.from({ length: 120 }, () => ({
        status: 'failed',
        url: 'https://example.com/' + 'a'.repeat(400),
        reason: 'b'.repeat(400),
      })),
    ),
  });
  assert.ok(large.body.length < 60000);
  const markers = build({
    links: report([
      { status: 'unknown', reason: '<!-- maintenance-report:end -->' },
    ]),
  });
  assert.equal(markers.body.split('<!-- maintenance-report:end -->').length, 2);
  assert.match(stale.body, /Ejecución incompleta/);
  assert.equal(isoWeek(new Date('2021-01-01T12:00:00Z')), '2020-W53');
});
test('publicación crea un solo issue por semana y conserva notas y estado al repetir', async () => {
  const existing = [];
  const calls = [];
  const github = {
    paginate: async () => existing,
    rest: {
      issues: {
        listForRepo: () => {},
        create: async (args) => {
          calls.push(['create', args]);
          existing.push({
            ...args,
            number: 7,
            state: 'closed',
            user: { login: 'github-actions[bot]' },
            body: args.body + '\nNotas humanas que conservar.',
          });
          return { data: { number: 7 } };
        },
        update: async (args) => {
          calls.push(['update', args]);
          return { data: { number: args.issue_number } };
        },
      },
    },
  };
  await publishMaintenanceIssue(
    github,
    { owner: 'fixture', repo: 'fixture' },
    build(),
  );
  await publishMaintenanceIssue(
    github,
    { owner: 'fixture', repo: 'fixture' },
    build(),
  );
  assert.deepEqual(
    calls.map(([kind]) => kind),
    ['create', 'update'],
  );
  assert.match(calls[1][1].body, /Notas humanas que conservar/);
  assert.equal(calls[1][1].state, undefined);
  await assert.rejects(
    publishMaintenanceIssue(
      github,
      { owner: 'fixture', repo: 'fixture' },
      { ...build(), week: 'invalid' },
    ),
  );
});
test('vídeos: una muestra no hace peticiones; 403/timeout no se declaran retiradas', async () => {
  // Se reutilizan los datos sintéticos ya presentes en las pruebas originales; nunca se publican ni se consulta YouTube.
  const episode = {
    number: 1,
    title: 'Fixture',
    youtubeId: 'abcdefghijk',
    verified: true,
    officialChannel: '@MuseAsia',
    regions: ['JP'],
  };
  const series = { id: 'fixture', placeholder: false };
  let calls = 0;
  assert.equal(
    (
      await checkVideo(
        { ...series, placeholder: true },
        { ...episode, youtubeId: null, verified: false },
        {
          request: async () => {
            calls++;
          },
        },
      )
    ).status,
    'skipped',
  );
  assert.equal(calls, 0);
  for (const [http, expected] of [
    [404, 'failed'],
    [410, 'failed'],
    [403, 'unknown'],
    [429, 'unknown'],
    [503, 'unknown'],
  ])
    assert.equal(
      (
        await checkVideo(series, episode, {
          request: async () => new Response(null, { status: http }),
        })
      ).status,
      expected,
    );
  assert.equal(
    (
      await checkVideo(series, episode, {
        request: async () => {
          throw new Error('Timeout');
        },
      })
    ).status,
    'unknown',
  );
  assert.equal(
    (
      await checkVideo(series, episode, {
        request: async () =>
          new Response(
            JSON.stringify({ author_url: 'https://www.youtube.com/@MuseAsia' }),
          ),
      })
    ).status,
    'passed',
  );
  assert.equal(
    (
      await checkVideo(series, episode, {
        request: async () =>
          new Response(
            JSON.stringify({
              author_url: 'https://www.youtube.com/@crunchyroll',
            }),
          ),
      })
    ).kind,
    'author-mismatch',
  );
});
