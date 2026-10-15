import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { readSeries, validateEpisode } from './content.mjs';
import { externalResponse } from './link-checker.mjs';

export async function checkVideo(
  series,
  episode,
  { request = externalResponse } = {},
) {
  const identity = { series: series.id, episode: episode.number };
  try {
    if (!validateEpisode(series, episode))
      return {
        ...identity,
        status: 'skipped',
        reason: series.placeholder
          ? 'Ficción placeholder, sin vídeo'
          : 'Solo enlace legal, sin incrustación',
      };
  } catch (error) {
    return {
      ...identity,
      status: 'failed',
      kind: 'invalid-data',
      reason: error.message,
    };
  }
  try {
    const response = await request(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${episode.youtubeId}`)}&format=json`,
    );
    if ([404, 410].includes(response.status)) {
      await response.body?.cancel();
      return {
        ...identity,
        status: 'failed',
        kind: 'unavailable-video',
        reason: `YouTube oEmbed HTTP ${response.status}. Posible retirada/restricción: requiere revisión humana.`,
      };
    }
    if (!response.ok) {
      await response.body?.cancel();
      return {
        ...identity,
        status: 'unknown',
        reason: `YouTube HTTP ${response.status}: acceso, límite o servidor sin confirmar.`,
      };
    }
    const data = await response.json();
    const author = new URL(data.author_url);
    if (
      author.hostname !== 'www.youtube.com' ||
      author.pathname.toLowerCase().replace(/\/$/, '') !==
        `/${episode.officialChannel}`.toLowerCase()
    )
      return {
        ...identity,
        status: 'failed',
        kind: 'author-mismatch',
        reason:
          'El autor oEmbed no coincide con el canal documentado; revisar la fuente.',
      };
    return {
      ...identity,
      status: 'passed',
      limitation:
        'Accesibilidad técnica; no acredita derechos, idioma, permiso de incrustación ni regiones.',
    };
  } catch (error) {
    return { ...identity, status: 'unknown', reason: error.message };
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const results = [];
  for (const series of await readSeries())
    for (const episode of series.episodes)
      results.push(await checkVideo(series, episode));
  await mkdir('.cache', { recursive: true });
  await writeFile(
    '.cache/video-report.json',
    JSON.stringify({ runAt: new Date().toISOString(), results }, null, 2),
  );
  for (const status of ['passed', 'failed', 'unknown', 'skipped'])
    console.log(
      `${status}: ${results.filter((r) => r.status === status).length}`,
    );
  if (results.some((r) => r.status === 'failed')) process.exitCode = 1;
}
