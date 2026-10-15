import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
export async function createContent(kind, slug, root = process.cwd()) {
  if (
    !['series', 'article'].includes(kind) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '') ||
    slug.length > 80
  )
    throw new Error(
      'Uso: npm run new:series -- <slug> o npm run new:article -- <slug>. Slug: letras minúsculas ASCII, números y guiones; máximo 80 caracteres.',
    );
  const template = await readFile(
    new URL(`../templates/${kind}.md`, import.meta.url),
    'utf8',
  );
  const directory = resolve(
    root,
    'src/content',
    kind === 'series' ? 'series' : 'articles',
  );
  await mkdir(directory, { recursive: true });
  const path = resolve(directory, `${slug}.md`);
  await writeFile(
    path,
    template
      .replaceAll('{{slug}}', slug)
      .replaceAll('{{date}}', new Date().toISOString().slice(0, 10)),
    { flag: 'wx' },
  );
  return path;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    console.log(
      `Borrador creado: ${await createContent(process.argv[2], process.argv[3])}`,
    );
  } catch (error) {
    console.error(
      error.code === 'EEXIST'
        ? 'La ficha ya existe; no se ha sobrescrito.'
        : error.message,
    );
    process.exitCode = 1;
  }
}
