import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const series = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/series' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        subtitle: z.string(),
        description: z.string(),
        cover: image(),
        hero: image(),
        accent: z.enum(['pink', 'blue', 'mint', 'amber', 'purple']),
        genres: z.array(z.string()).min(1),
        year: z.number(),
        format: z.enum(['Serie', 'Película']),
        status: z.enum(['En emisión', 'Completa', 'Próximamente']),
        duration: z.number(),
        placeholder: z.boolean().default(false),
        featured: z.boolean().default(false),
        apiId: z.number().int().positive().nullable().default(null),
        schedule: z.object({
          day: z.number().min(0).max(6),
          time: z.string(),
          note: z.string(),
        }),
        episodes: z.array(
          z.object({
            number: z.number().int().positive(),
            title: z.string(),
            youtubeId: z
              .string()
              .regex(/^[a-zA-Z0-9_-]{11}$/)
              .nullable(),
            officialChannel: z.string().nullable(),
            verified: z.boolean(),
            regions: z.array(z.string()),
            legalUrl: z.url(),
          }),
        ),
      })
      .superRefine((data, ctx) => {
        for (const episode of data.episodes) {
          if (data.placeholder && episode.youtubeId)
            ctx.addIssue({
              code: 'custom',
              message: 'Los placeholders no pueden contener vídeos.',
            });
          if (
            !data.placeholder &&
            episode.youtubeId &&
            (!episode.verified ||
              !episode.officialChannel ||
              episode.regions.length === 0)
          )
            ctx.addIssue({
              code: 'custom',
              message:
                'Un vídeo real requiere canal oficial, revisión editorial y regiones.',
            });
          if (
            !/^https:\/\/(www\.)?(youtube\.com|crunchyroll\.com|netflix\.com|disneyplus\.com|gundam\.info|hidive\.com)(\/|$)/.test(
              episode.legalUrl,
            )
          )
            ctx.addIssue({
              code: 'custom',
              message: 'La alternativa debe ser una plataforma oficial HTTPS.',
            });
        }
      }),
});
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.enum(['Guías', 'Reseñas', 'Noticias']),
      date: z.coerce.date(),
      author: z.string(),
      cover: image(),
      minutes: z.number(),
      placeholder: z.boolean().default(false),
    }),
});
export const collections = { series, articles };
