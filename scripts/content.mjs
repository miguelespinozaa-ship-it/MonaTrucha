import { readFile, readdir } from 'node:fs/promises';
import matter from 'gray-matter';
export async function readSeries({ includeDrafts = false } = {}) {
  const files = (await readdir('src/content/series')).filter((f) =>
    f.endsWith('.md'),
  );
  const entries = await Promise.all(
    files.map(async (file) => ({
      id: file.slice(0, -3),
      ...matter(await readFile(`src/content/series/${file}`, 'utf8')).data,
    })),
  );
  return includeDrafts ? entries : entries.filter((entry) => !entry.draft);
}
export const officialChannels = new Set([
  '@MuseAsia',
  '@AniOneAsia',
  '@crunchyroll',
  '@TMSanime',
  '@GundamInfo',
]);
export function validateEpisode(series, episode) {
  if (series.placeholder) {
    if (episode.youtubeId)
      throw new Error(`${series.id}: un placeholder no admite vídeos reales`);
    return false;
  }
  if (!episode.youtubeId) return false;
  if (
    !/^[\w-]{11}$/.test(episode.youtubeId) ||
    !episode.verified ||
    !officialChannels.has(episode.officialChannel) ||
    !episode.regions?.length
  )
    throw new Error(
      `${series.id}/${episode.number}: vídeo sin verificación, canal oficial o regiones`,
    );
  return true;
}
