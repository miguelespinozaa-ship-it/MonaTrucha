import { readdir, readFile, access, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { z } from 'astro/zod';
import { seriesSchema, articleSchema } from '../src/data/content-schema.mjs';
import { validateEpisode } from './content.mjs';

export function countWords(markdown) {
  const plain = markdown
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, '');
  return [
    ...new Intl.Segmenter('es', { granularity: 'word' }).segment(plain),
  ].filter((segment) => segment.isWordLike).length;
}
export async function analyzeContent(root = process.cwd()) {
  const entries = [];
  for (const kind of ['series', 'articles']) {
    const directory = resolve(root, 'src/content', kind);
    for (const file of (await readdir(directory))
      .filter((name) => name.endsWith('.md'))
      .sort()) {
      const path = resolve(directory, file);
      const entry = {
        file: `src/content/${kind}/${file}`,
        kind,
        words: 0,
        draft: false,
        placeholder: true,
        verifiedVideos: 0,
        errors: [],
        warnings: [],
      };
      try {
        const { data, content } = matter(await readFile(path, 'utf8'));
        const schema = (kind === 'series' ? seriesSchema : articleSchema)(() =>
          z.string().min(1),
        );
        const parsed = schema.parse(data);
        entry.draft = parsed.draft;
        entry.placeholder = parsed.placeholder;
        entry.words = countWords(content);
        for (const name of kind === 'series' ? ['cover', 'hero'] : ['cover']) {
          const asset = resolve(dirname(path), parsed[name]);
          if (
            !relative(resolve(root, 'src/assets'), asset).startsWith('..') &&
            !relative(resolve(root, 'src/assets'), asset).includes(':')
          )
            await access(asset);
          else throw new Error(`${name}: la imagen debe estar en src/assets`);
        }
        if (kind === 'series') {
          if (entry.words < 150 || entry.words > 300)
            (entry.draft ? entry.warnings : entry.errors).push(
              `Texto de ${entry.words} palabras; se requieren 150–300.`,
            );
          for (const episode of parsed.episodes)
            if (
              !entry.draft &&
              validateEpisode({ ...parsed, id: file }, episode)
            )
              entry.verifiedVideos++;
        } else if (!entry.words)
          (entry.draft ? entry.warnings : entry.errors).push(
            'El artículo no tiene texto.',
          );
      } catch (error) {
        entry.errors.push(error.message);
      }
      entries.push(entry);
    }
  }
  const publishable = entries.filter((e) => !e.draft && !e.errors.length);
  const real = publishable.filter(
    (e) => e.kind === 'series' && !e.placeholder,
  ).length;
  const articles = publishable.filter(
    (e) => e.kind === 'articles' && !e.placeholder,
  ).length;
  return {
    entries,
    counts: {
      realSeries: real,
      placeholderSeries: publishable.filter(
        (e) => e.kind === 'series' && e.placeholder,
      ).length,
      definitiveArticles: articles,
      placeholderArticles: publishable.filter(
        (e) => e.kind === 'articles' && e.placeholder,
      ).length,
      drafts: entries.filter((e) => e.draft).length,
      verifiedVideos: publishable.reduce((n, e) => n + e.verifiedVideos, 0),
    },
    goals: [
      { label: 'Fases 0–1: series reales', current: real, target: 20 },
      { label: 'Fase 2: series reales', current: real, target: 50 },
      { label: 'Fase 2: artículos definitivos', current: articles, target: 30 },
    ],
    invalid: entries.filter((e) => e.errors.length).length,
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const report = await analyzeContent();
    await mkdir('.cache', { recursive: true });
    await writeFile(
      '.cache/content-report.json',
      JSON.stringify(report, null, 2),
    );
    if (process.argv.includes('--json'))
      console.log(JSON.stringify(report, null, 2));
    else {
      console.log(JSON.stringify(report.counts, null, 2));
      for (const e of report.entries)
        console.log(
          `${e.file}: ${e.words} palabras · ${e.draft ? 'borrador' : e.placeholder ? 'placeholder' : 'definitivo'}${e.errors.length ? ` · ERROR ${e.errors.join('; ')}` : ''}${e.warnings.length ? ` · AVISO ${e.warnings.join('; ')}` : ''}`,
        );
      for (const goal of report.goals)
        console.log(
          `${goal.label}: ${goal.current}/${goal.target} (${Math.min(100, Math.round((goal.current / goal.target) * 100))} %)`,
        );
    }
    if (report.invalid) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
