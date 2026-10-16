import { readFile, realpath, lstat, open, rename, rm } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import matter from 'gray-matter';
import { z } from 'astro/zod';
import { countWords } from './content-report.mjs';
import { officialChannels } from './content.mjs';
import { legalPlatform, seriesSchema } from '../src/data/content-schema.mjs';

// CSV UTF-8: comillas dobles, comas, saltos de línea y BOM de hojas de cálculo.
export function parseCsv(source) {
  const rows = [];
  let fields = [],
    value = '',
    quoted = false,
    closed = false;
  let line = 1,
    startLine = 1;
  const field = () => {
    fields.push(value);
    value = '';
    closed = false;
  };
  const row = () => {
    field();
    if (fields.some((cell) => cell.trim()))
      rows.push({ line: startLine, fields });
    fields = [];
    startLine = line + 1;
  };
  source = source.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else {
        value += char;
        if (char === '\n') line++;
      }
    } else if (char === '"') {
      if (value || closed)
        throw new Error(`Fila ${line}: comillas CSV inesperadas.`);
      quoted = true;
    } else if (char === ',') field();
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++;
      row();
      line++;
    } else {
      if (closed)
        throw new Error(
          `Fila ${line}: hay texto después de cerrar las comillas.`,
        );
      value += char;
    }
  }
  if (quoted) throw new Error(`Fila ${startLine}: comillas CSV sin cerrar.`);
  if (fields.length || value || closed) row();
  if (rows.length < 2)
    throw new Error('El CSV necesita cabecera y al menos una fila de datos.');
  const headers = rows.shift().fields.map((cell) => cell.trim());
  if (headers.some((h) => !h) || new Set(headers).size !== headers.length)
    throw new Error('Cabecera CSV: hay columnas vacías o duplicadas.');
  const required = [
    'slug',
    'titulo_verificado',
    'subtitulo',
    'descripcion',
    'texto_serie',
    'generos',
    'anio',
    'formato',
    'estado_serie',
    'duracion',
    'portada',
    'hero',
  ];
  const missing = required.filter((h) => !headers.includes(h));
  if (missing.length)
    throw new Error(
      `Cabecera CSV: faltan columnas ${missing.join(', ')}. Usa docs/lista-series-ejemplo.csv.`,
    );
  return rows.map(({ line, fields }) => {
    if (fields.length !== headers.length)
      throw new Error(
        `Fila ${line}: tiene ${fields.length} celdas; la cabecera tiene ${headers.length}.`,
      );
    return {
      line,
      values: Object.fromEntries(headers.map((h, i) => [h, fields[i].trim()])),
    };
  });
}

const list = (value = '') =>
  value
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
const inside = (parent, child) => {
  const path = relative(parent, child);
  return path !== '..' && !path.startsWith('../') && !isAbsolute(path);
};

async function localImage(value, root, directory) {
  if (!value || !value.startsWith('../../assets/'))
    throw new Error(
      'portada y hero deben indicar archivos locales ../../assets/ con permiso revisado.',
    );
  const assets = await realpath(resolve(root, 'src/assets'));
  const file = await realpath(resolve(directory, value)).catch(() => null);
  if (!file || !inside(assets, file) || !(await lstat(file)).isFile())
    throw new Error('portada o hero inexistente o fuera de src/assets.');
  return value;
}

async function draftFromRow(row, root, directory) {
  const v = row.values;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.slug) || v.slug.length > 96)
    throw new Error(
      'slug inválido: usa minúsculas, números y guiones, sin rutas ni extensiones.',
    );
  const words = countWords(v.texto_serie);
  if (words < 150 || words > 300)
    throw new Error(
      `texto_serie tiene ${words} palabras; debe tener entre 150 y 300.`,
    );
  if (v.verified && !['true', 'false'].includes(v.verified))
    throw new Error('verified solo admite true, false o una celda vacía.');
  const verified = v.verified === 'true';
  const youtubeId = v.youtube_id || null;
  const officialChannel = v.canal_oficial || null;
  const regions = list(v.regiones_verificadas);
  if (youtubeId && !/^[\w-]{11}$/.test(youtubeId))
    throw new Error(
      'youtube_id debe tener exactamente 11 caracteres: letras, números, _ o -.',
    );
  if (officialChannel && !officialChannels.has(officialChannel))
    throw new Error(
      'canal_oficial no admitido: revisar scripts/content.mjs con el equipo.',
    );
  if (youtubeId && !officialChannel)
    throw new Error('falta canal_oficial admitido para el vídeo.');
  if (youtubeId && !regions.length)
    throw new Error(
      'faltan regiones_verificadas para el vídeo, separadas por ;.',
    );
  if (verified && !youtubeId)
    throw new Error('verified=true requiere youtube_id explícito en el CSV.');
  if (
    !v.episodio_numero &&
    (youtubeId || officialChannel || regions.length || verified)
  )
    throw new Error('falta episodio_numero para los datos de vídeo.');
  const episodes = [];
  if (v.episodio_numero) {
    if (!/^[1-9]\d*$/.test(v.episodio_numero))
      throw new Error('episodio_numero debe ser un entero positivo.');
    if (!v.episodio_titulo)
      throw new Error('falta episodio_titulo comprobado.');
    if (!legalPlatform.test(v.alternativa_legal_url || ''))
      throw new Error(
        'alternativa_legal_url debe ser HTTPS de una plataforma admitida.',
      );
    episodes.push({
      number: Number(v.episodio_numero),
      title: v.episodio_titulo,
      youtubeId,
      officialChannel,
      verified,
      regions,
      legalUrl: v.alternativa_legal_url,
    });
  }
  const data = {
    draft: true,
    placeholder: false,
    title: v.titulo_verificado,
    subtitle: v.subtitulo,
    description: v.descripcion,
    cover: await localImage(v.portada, root, directory),
    hero: await localImage(v.hero, root, directory),
    accent: 'pink',
    genres: list(v.generos),
    year: Number(v.anio),
    format: v.formato,
    status: v.estado_serie,
    duration: Number(v.duracion),
    featured: false,
    apiId: null,
    schedule: {
      day: 1,
      time: '00:00',
      note: 'PENDIENTE: horario y zona; no es un estreno anunciado',
    },
    episodes,
  };
  const parsed = seriesSchema(() => z.string().min(1)).safeParse(data);
  if (!parsed.success)
    throw new Error(
      `campos de ficha inválidos: ${parsed.error.issues.map((issue) => issue.path.join('.') || 'ficha').join(', ')}. Revisa docs/importacion-csv.md.`,
    );
  // Conservar la evidencia proporcionada, sin tratarla como prueba automática.
  const evidence = Object.fromEntries(
    Object.entries(v).filter(
      ([key]) => !['texto_serie', 'portada', 'hero'].includes(key),
    ),
  );
  return {
    slug: v.slug,
    line: row.line,
    markdown: matter.stringify(`\n${v.texto_serie}\n`, {
      ...data,
      revisionEditorial: evidence,
    }),
  };
}

export async function importContent(
  file,
  { root = process.cwd(), dryRun = false, force = false } = {},
) {
  const source = await readFile(file, 'utf8');
  if (Buffer.byteLength(source) > 5 * 1024 * 1024)
    throw new Error('El CSV supera el límite de 5 MiB.');
  const rows = parseCsv(source);
  if (rows.length > 1000)
    throw new Error('El CSV supera el límite de 1000 filas.');
  const directory = resolve(root, 'src/content/series');
  if (
    !inside(await realpath(root), await realpath(directory)) ||
    (await realpath(directory)) !== directory
  )
    throw new Error(
      'La carpeta de series debe ser local, sin enlaces simbólicos.',
    );
  const drafts = [],
    errors = [],
    slugs = new Set();
  for (const row of rows) {
    try {
      if (slugs.has(row.values.slug))
        throw new Error('slug duplicado en el CSV: una fila por serie.');
      slugs.add(row.values.slug);
      const draft = await draftFromRow(row, root, directory);
      draft.path = resolve(directory, `${draft.slug}.md`);
      const existing = await lstat(draft.path).catch((error) => {
        if (error.code === 'ENOENT') return null;
        throw error;
      });
      if (existing && (!force || !existing.isFile()))
        throw new Error(
          'la ficha ya existe; usa --force para sustituir un archivo normal. No se siguen enlaces simbólicos.',
        );
      draft.action = existing ? 'sustituir' : 'crear';
      drafts.push(draft);
    } catch (error) {
      errors.push(
        `Fila ${row.line} (${row.values.slug || 'sin slug'}): ${error.message}`,
      );
    }
  }
  if (errors.length)
    throw new Error(`${errors.join('\n')}\nNo se ha escrito ninguna ficha.`);
  if (!dryRun) {
    for (const draft of drafts) {
      // wx impide sobrescribir archivos por accidente; rename no sigue symlinks.
      const target = force
        ? resolve(directory, `.import-${randomUUID()}.tmp`)
        : draft.path;
      try {
        const handle = await open(target, 'wx');
        try {
          await handle.writeFile(draft.markdown);
        } finally {
          await handle.close();
        }
        if (force) await rename(target, draft.path);
      } finally {
        if (force) await rm(target, { force: true });
      }
    }
  }
  return drafts.map(({ slug, line, action }) => ({
    slug,
    line,
    action,
    draft: true,
  }));
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const args = process.argv.slice(2);
    const files = args.filter((arg) => !arg.startsWith('--'));
    if (
      files.length !== 1 ||
      args.some(
        (arg) =>
          arg.startsWith('--') && !['--dry-run', '--force'].includes(arg),
      )
    )
      throw new Error(
        'Uso: npm run content:import -- archivo.csv [--dry-run] [--force]',
      );
    const dryRun = args.includes('--dry-run');
    const result = await importContent(files[0], {
      dryRun,
      force: args.includes('--force'),
    });
    for (const item of result)
      console.log(
        `Fila ${item.line}: ${dryRun ? 'se propone' : 'completado'} ${item.action} src/content/series/${item.slug}.md (draft=true).`,
      );
    console.log(
      dryRun
        ? 'Simulación: no se ha escrito ningún archivo.'
        : 'Importación terminada. Revisar fuentes y metadatos antes de publicar.',
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
