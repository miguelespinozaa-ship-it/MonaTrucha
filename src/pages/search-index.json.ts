import type { APIRoute } from 'astro';
import { getSeries } from '../data/catalog';
export const GET: APIRoute = async () =>
  new Response(
    JSON.stringify(
      (await getSeries()).map((s) => ({
        id: s.id,
        title: s.data.title,
        genres: s.data.genres,
        format: s.data.format,
        url: `/series/${s.id}/`,
        placeholder: s.data.placeholder,
      })),
    ),
    { headers: { 'Content-Type': 'application/json' } },
  );
