import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { seriesSchema, articleSchema } from './data/content-schema.mjs';
const series = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/series' }),
  schema: ({ image }) => seriesSchema(image),
});
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: ({ image }) => articleSchema(image),
});
export const collections = { series, articles };
