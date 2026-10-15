import { getCollection } from 'astro:content';
import { readFileSync } from 'node:fs';
import type { ImageMetadata } from 'astro';
interface Metadata {
  title: string;
  synopsis: string;
  genres: string[];
  cover: string;
  fetchedAt: string;
}
let metadata: Record<string, Metadata> = {};
try {
  metadata = JSON.parse(readFileSync('.cache/anime-metadata.json', 'utf8'));
} catch {
  /* Las muestras no necesitan caché. */
}
const covers = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/remote/*.jpg',
);

export async function getSeries() {
  const entries = await getCollection('series', ({ data }) => !data.draft);
  for (const entry of entries) {
    if (entry.data.placeholder || !entry.data.apiId) continue;
    const load = covers[`../assets/remote/${entry.data.apiId}.jpg`];
    if (load) entry.data.cover = (await load()).default;
  }
  return entries.sort(
    (a, b) =>
      Number(b.data.featured) - Number(a.data.featured) ||
      a.data.title.localeCompare(b.data.title, 'es'),
  );
}
export async function getArticles() {
  return (await getCollection('articles', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
}
export function getMetadata(id: number | null) {
  return id ? metadata[String(id)] : undefined;
}
export const days = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];
