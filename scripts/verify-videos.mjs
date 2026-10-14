import { mkdir, writeFile } from 'node:fs/promises';
import { readSeries, validateEpisode } from './content.mjs';

const results = [];
for (const series of await readSeries()) {
  for (const episode of series.episodes) {
    try {
      if (!validateEpisode(series, episode)) {
        results.push({
          series: series.id,
          episode: episode.number,
          status: 'skipped',
          reason: series.placeholder
            ? 'Ficción placeholder, sin vídeo'
            : 'Solo enlace legal, sin incrustación',
        });
        continue;
      }
      const response = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${episode.youtubeId}`)}&format=json`,
        { signal: AbortSignal.timeout(15000) },
      );
      if (!response.ok)
        throw new Error(`YouTube oEmbed HTTP ${response.status}`);
      const data = await response.json();
      const author = new URL(data.author_url);
      if (
        author.hostname !== 'www.youtube.com' ||
        author.pathname.toLowerCase() !==
          `/${episode.officialChannel}`.toLowerCase()
      )
        throw new Error(
          `El autor oEmbed no coincide con ${episode.officialChannel}; requiere revisión editorial`,
        );
      results.push({
        series: series.id,
        episode: episode.number,
        status: 'passed',
        title: data.title,
        limitation:
          'No comprueba derechos, idioma ni geobloqueo; revisión humana necesaria.',
      });
    } catch (error) {
      results.push({
        series: series.id,
        episode: episode.number,
        status: 'failed',
        reason: error.message,
      });
    }
  }
}
await mkdir('.cache', { recursive: true });
await writeFile(
  '.cache/video-report.json',
  JSON.stringify({ runAt: new Date().toISOString(), results }, null, 2),
);
for (const status of ['passed', 'failed', 'skipped'])
  console.log(
    `${status}: ${results.filter((r) => r.status === status).length}`,
  );
if (results.some((r) => r.status === 'failed')) process.exitCode = 1;
