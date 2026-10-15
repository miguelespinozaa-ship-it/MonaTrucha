import { z } from 'astro/zod';
const text = () => z.string().trim().min(1);
export const legalPlatform =
  /^https:\/\/(www\.)?(youtube\.com|crunchyroll\.com|netflix\.com|disneyplus\.com|gundam\.info|hidive\.com)(\/|$)/;
/** @template {import('astro/zod').z.ZodType} T @param {() => T} image */
export function seriesSchema(image) {
  return z
    .object({
      title: text(),
      subtitle: text(),
      description: text(),
      cover: image(),
      hero: image(),
      accent: z.enum(['pink', 'blue', 'mint', 'amber', 'purple']),
      genres: z.array(text()).min(1),
      year: z.number().int().min(1900).max(2200),
      format: z.enum(['Serie', 'Película']),
      status: z.enum(['En emisión', 'Completa', 'Próximamente']),
      duration: z.number().positive(),
      placeholder: z.boolean().default(false),
      draft: z.boolean().default(false),
      featured: z.boolean().default(false),
      apiId: z.number().int().positive().nullable().default(null),
      schedule: z.object({
        day: z.number().int().min(0).max(6),
        time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        note: text(),
      }),
      episodes: z.array(
        z.object({
          number: z.number().int().positive(),
          title: text(),
          youtubeId: z
            .string()
            .regex(/^[\w-]{11}$/)
            .nullable(),
          officialChannel: text().nullable(),
          verified: z.boolean(),
          regions: z.array(text()),
          legalUrl: z
            .url()
            .refine(
              (url) => legalPlatform.test(url),
              'La alternativa debe ser una plataforma oficial HTTPS.',
            ),
        }),
      ),
    })
    .superRefine((data, ctx) => {
      const numbers = new Set();
      for (const episode of data.episodes) {
        if (numbers.has(episode.number))
          ctx.addIssue({
            code: 'custom',
            message: `Episodio duplicado: ${episode.number}`,
          });
        numbers.add(episode.number);
        if (data.placeholder && (episode.youtubeId || episode.verified))
          ctx.addIssue({
            code: 'custom',
            message: 'Un placeholder no admite vídeos ni verificación real.',
          });
        if (episode.verified && !episode.youtubeId)
          ctx.addIssue({
            code: 'custom',
            message: 'La verificación requiere un vídeo.',
          });
        if (
          episode.youtubeId &&
          (!episode.verified ||
            !episode.officialChannel ||
            !episode.regions.length)
        )
          ctx.addIssue({
            code: 'custom',
            message:
              'Un vídeo real requiere canal oficial, revisión editorial y regiones.',
          });
      }
    });
}
/** @template {import('astro/zod').z.ZodType} T @param {() => T} image */
export function articleSchema(image) {
  return z.object({
    title: text(),
    description: text(),
    category: z.enum(['Guías', 'Reseñas', 'Noticias']),
    date: z.coerce.date(),
    author: text(),
    cover: image(),
    minutes: z.number().int().positive(),
    placeholder: z.boolean().default(false),
    draft: z.boolean().default(false),
  });
}
