import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export function isoWeek(date = new Date()) {
  const value = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  value.setUTCDate(value.getUTCDate() + 4 - (value.getUTCDay() || 7));
  const start = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  return `${value.getUTCFullYear()}-W${String(Math.ceil(((value.getTime() - start.getTime()) / 86400000 + 1) / 7)).padStart(2, '0')}`;
}
const code = (value) =>
  '`' +
  String(value)
    .replace(/`/g, "'")
    .replace(/</g, '‹')
    .replace(/>/g, '›')
    .replace(/[\r\n]/g, ' ')
    .slice(0, 350) +
  '`';
const START = '<!-- maintenance-report:start -->';
const END = '<!-- maintenance-report:end -->';
export function makeMaintenanceReport({
  videos,
  links,
  steps = {},
  notBefore = Date.now() - 86400000,
  date = new Date(),
}) {
  const sections = {};
  const problems = [];
  for (const [name, report] of Object.entries({ videos, links })) {
    const valid =
      report &&
      Array.isArray(report.results) &&
      Number.isFinite(Date.parse(report.runAt)) &&
      Date.parse(report.runAt) >= Number(notBefore) &&
      report.results.every(
        (r) =>
          r &&
          typeof r === 'object' &&
          ['passed', 'failed', 'unknown', 'skipped'].includes(r.status),
      );
    if (!valid) {
      sections[name] = {
        counts: { passed: 0, failed: 0, unknown: 1, skipped: 0 },
        results: [],
      };
      problems.push(
        `${name}: informe ausente, inválido o anterior a esta ejecución.`,
      );
    } else
      sections[name] = {
        results: report.results,
        counts: Object.fromEntries(
          ['passed', 'failed', 'unknown', 'skipped'].map((status) => [
            status,
            report.results.filter((r) => r.status === status).length,
          ]),
        ),
      };
  }
  for (const [step, outcome] of Object.entries(steps))
    if (outcome !== 'success')
      problems.push(`Paso ${step}: ${outcome}; revisar el log de Actions.`);
  const week = isoWeek(date);
  const marker = `<!-- project-maintenance:${week} -->`;
  const lines = [
    marker,
    START,
    '## Revisión semanal',
    '',
    `Semana ${week}. Observaciones técnicas; la verificación de licencias y regiones es humana.`,
    '',
    '| Informe | Accesibles | Fallidos | Desconocidos | Omitidos |',
    '| --- | ---: | ---: | ---: | ---: |',
  ];
  for (const [name, section] of Object.entries(sections))
    lines.push(
      `| ${name} | ${['passed', 'failed', 'unknown', 'skipped'].map((s) => section.counts[s]).join(' | ')} |`,
    );
  if (problems.length)
    lines.push(
      '',
      '### Ejecución incompleta',
      ...problems.map((p) => `- ${code(p)}`),
    );
  for (const status of ['failed', 'unknown']) {
    lines.push(
      '',
      status === 'failed'
        ? '### Incidencias que requieren revisión'
        : '### Sin confirmar por red o respuesta del proveedor',
    );
    const entries = Object.entries(sections).flatMap(([name, section]) =>
      section.results
        .filter((r) => r.status === status)
        .map(
          (r) =>
            `- ${name}: ${code(r.url || `${r.series || r.source || 'recurso'} / episodio ${r.episode || '—'}`)} — ${code(r.reason || 'Revisar informe JSON')}`,
        ),
    );
    lines.push(
      ...(entries.length
        ? entries.slice(0, 30)
        : ['Sin entradas en esta categoría.']),
    );
    if (entries.length > 30)
      lines.push(
        `Otras ${entries.length - 30} entradas en el artefacto completo.`,
      );
  }
  lines.push(
    '',
    '- [ ] P1: revisar fallos de build/red y enlaces internos.',
    '- [ ] P3: comprobar posibles vídeos retirados, canales, regiones y alternativas legales.',
    '- [ ] P2: verificar las fichas afectadas tras corregir.',
    '',
    '404/410 no demuestra retirada mundial ni pérdida de licencia. Un estado desconocido no es un enlace correcto. Las muestras sin vídeo se omiten.',
    '',
    'Artefacto de Actions: maintenance-reports (JSON y Markdown). El rerun actualiza solo este bloque generado y conserva notas externas al bloque.',
    END,
  );
  return {
    schemaVersion: 1,
    week,
    marker,
    title: `Mantenimiento semanal · ${week}`,
    body: lines.join('\n'),
    sections,
    problems,
  };
}
export async function publishMaintenanceIssue(github, { owner, repo }, report) {
  if (
    report.schemaVersion !== 1 ||
    report.title !== `Mantenimiento semanal · ${report.week}` ||
    !/^\d{4}-W\d{2}$/.test(report.week) ||
    report.marker !== `<!-- project-maintenance:${report.week} -->` ||
    !report.body.startsWith(report.marker + '\n' + START) ||
    !report.body.endsWith(END) ||
    report.body.length > 60000
  )
    throw new Error('Informe no válido para publicar');
  const issues = await github.paginate(github.rest.issues.listForRepo, {
    owner,
    repo,
    state: 'all',
    per_page: 100,
  });
  const existing = issues.find(
    (issue) =>
      !issue.pull_request &&
      issue.user?.login === 'github-actions[bot]' &&
      issue.body?.includes(report.marker),
  );
  if (!existing)
    return github.rest.issues.create({
      owner,
      repo,
      title: report.title,
      body: report.body,
    });
  const from = existing.body.indexOf(START),
    to = existing.body.indexOf(END);
  if (from < 0 || to < from)
    throw new Error(
      'El bloque generado fue editado o eliminado; se conserva el issue sin sobrescribirlo',
    );
  const generated = report.body.slice(report.body.indexOf(START));
  const body =
    existing.body.slice(0, from) +
    generated +
    existing.body.slice(to + END.length);
  return github.rest.issues.update({
    owner,
    repo,
    issue_number: existing.number,
    body,
  });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const read = async (name) => {
    try {
      return JSON.parse(await readFile(`.cache/${name}-report.json`, 'utf8'));
    } catch {
      return null;
    }
  };
  const report = makeMaintenanceReport({
    videos: await read('video'),
    links: await read('link'),
    ...(process.env.REPORT_STARTED_AT
      ? { notBefore: Date.parse(process.env.REPORT_STARTED_AT) }
      : {}),
    steps: Object.fromEntries(
      ['BUILD', 'VIDEOS', 'LINKS']
        .filter((s) => process.env[`REPORT_${s}_OUTCOME`])
        .map((s) => [s.toLowerCase(), process.env[`REPORT_${s}_OUTCOME`]]),
    ),
  });
  await mkdir('.cache', { recursive: true });
  await writeFile(
    '.cache/maintenance-report.json',
    JSON.stringify(report, null, 2),
  );
  await writeFile('.cache/maintenance-report.md', report.body);
  console.log(
    `${report.title}: ${report.problems.length} problemas de ejecución; informe generado, sin publicar issues desde este comando.`,
  );
}
