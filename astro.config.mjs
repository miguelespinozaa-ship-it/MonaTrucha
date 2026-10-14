import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import './scripts/env.mjs';
import { readSeries } from './scripts/content.mjs';
import { readdir, readFile } from 'node:fs/promises';
import matter from 'gray-matter';

const site = process.env.PUBLIC_SITE_URL || 'https://example.com';
const excluded = new Set(['/favoritos/', '/404.html']);
for (const item of await readSeries())
  if (item.placeholder) {
    excluded.add(`/series/${item.id}/`);
    for (const episode of item.episodes)
      excluded.add(`/episodios/${item.id}/${episode.number}/`);
  }
for (const file of await readdir('src/content/articles'))
  if (
    file.endsWith('.md') &&
    matter(await readFile(`src/content/articles/${file}`, 'utf8')).data
      .placeholder
  )
    excluded.add(`/articulos/${file.slice(0, -3)}/`);
export default defineConfig({
  site,
  output: 'static',
  outDir: process.env.BUILD_OUTPUT_DIR || './dist',
  integrations: [
    sitemap({ filter: (page) => !excluded.has(new URL(page).pathname) }),
  ],
  image: { service: { entrypoint: 'astro/assets/services/sharp' } },
});
