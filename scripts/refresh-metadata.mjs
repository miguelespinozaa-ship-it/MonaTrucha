import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import sharp from 'sharp';
import { readSeries, validateEpisode } from './content.mjs';

await mkdir('.cache', { recursive: true });
let cache = {};
try {
  cache = JSON.parse(await readFile('.cache/anime-metadata.json', 'utf8'));
} catch {
  /* Primera instalación. */
}
const series = await readSeries();
for (const item of series)
  for (const episode of item.episodes) validateEpisode(item, episode);
for (const item of series.filter((s) => !s.placeholder && s.apiId)) {
  const key = String(item.apiId);
  if (
    cache[key] &&
    Date.now() - Date.parse(cache[key].fetchedAt) < 86400000 &&
    !process.argv.includes('--force')
  )
    continue;
  try {
    const response = await fetch(
      `https://api.jikan.moe/v4/anime/${item.apiId}`,
      { signal: AbortSignal.timeout(15000) },
    );
    if (!response.ok) throw new Error(`Jikan HTTP ${response.status}`);
    const { data } = await response.json();
    if (typeof data?.title !== 'string' || !Array.isArray(data.genres))
      throw new Error('Respuesta Jikan inválida');
    cache[key] = {
      title: data.title,
      synopsis: data.synopsis || '',
      genres: data.genres.map((g) => g.name),
      cover: data.images?.jpg?.large_image_url || '',
      fetchedAt: new Date().toISOString(),
    };
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    if (
      !cache[key] ||
      Date.now() - Date.parse(cache[key].fetchedAt) > 7 * 86400000
    )
      throw error;
    console.warn(
      `Jikan ${key}: usando caché de menos de 7 días: ${error.message}`,
    );
  }
}
// Download API covers at build time, then let astro:assets resize them locally.
for (const item of series.filter((s) => !s.placeholder && s.apiId)) {
  const entry = cache[String(item.apiId)];
  if (!entry?.cover) continue;
  const url = new URL(entry.cover);
  if (url.protocol !== 'https:' || url.hostname !== 'cdn.myanimelist.net')
    throw new Error('Host de portada no autorizado');
  await mkdir('src/assets/remote', { recursive: true });
  const path = `src/assets/remote/${item.apiId}.jpg`;
  let exists = true;
  try {
    await access(path);
  } catch {
    exists = false;
  }
  if (exists && entry.downloadedCover === entry.cover) continue;
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (
    !response.ok ||
    !response.headers.get('content-type')?.startsWith('image/')
  )
    throw new Error(`Portada ${item.apiId}: respuesta inválida`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 5 * 1024 * 1024) throw new Error('Portada mayor de 5 MB');
  await sharp(bytes, { limitInputPixels: 20000000 })
    .rotate()
    .resize({ width: 900, withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toFile(path);
  entry.downloadedCover = entry.cover;
}
await writeFile('.cache/anime-metadata.json', JSON.stringify(cache, null, 2));
console.log(
  `Metadatos: ${Object.keys(cache).length} series reales; ${series.filter((s) => s.placeholder).length} muestras ficticias sin llamadas API.`,
);
