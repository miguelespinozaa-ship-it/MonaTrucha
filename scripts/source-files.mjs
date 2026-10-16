import {
  readdir,
  readFile,
  lstat,
  realpath,
  mkdir,
  writeFile,
} from 'node:fs/promises';
import { resolve, relative, dirname, sep, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const requiredFiles = [
  '.github/workflows/ci.yml',
  '.github/workflows/daily.yml',
  '.github/workflows/weekly.yml',
  '.github/CODEOWNERS',
  '.github/dependabot.yml',
  '.github/labels.json',
  '.github/ISSUE_TEMPLATE/content.yml',
  '.github/ISSUE_TEMPLATE/episode-verification.yml',
  '.env.example',
  '.gitignore',
  '.nvmrc',
  '.npmrc',
  '.prettierrc.json',
  '.prettierignore',
];
const ignored = new Set([
  '.git',
  'node_modules',
  'dist',
  '.cache',
  '.astro',
  'test-results',
  'playwright-report',
  'coverage',
  '.nyc_output',
  '.npm',
  '.vscode',
  '.idea',
  '.aws',
  '.ssh',
  '.codex',
  '.agents',
  '.DS_Store',
  'Thumbs.db',
]);
const hash = (data) => createHash('sha256').update(data).digest('hex');
const portable = (path) => path.split(sep).join('/');
const within = (root, path) => {
  const rel = relative(root, path);
  return !isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`);
};
function isExcluded(name, path) {
  return (
    ignored.has(name) ||
    (name.startsWith('.env') && name !== '.env.example') ||
    /\.(zip|tgz|log|pem|key|p12|pfx|kdbx)$/i.test(name) ||
    path === 'src/assets/remote' ||
    name.endsWith('.tsbuildinfo')
  );
}
function checkSecrets(data, path) {
  if (data.includes(0)) return;
  const text = data.toString('utf8');
  if (
    /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{30,}|\bAKIA[A-Z0-9]{16}\b/.test(
      text,
    ) ||
    /(?:_authToken|aws_secret_access_key)\s*[=:]\s*[A-Za-z0-9/+_-]{20,}/i.test(
      text,
    )
  )
    throw new Error(
      `Posible secreto en ${path}; no se exporta ni se muestra su contenido.`,
    );
}
export async function sourceInventory(root = process.cwd()) {
  root = await realpath(root);
  const files = [],
    excluded = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = resolve(directory, entry.name),
        path = portable(relative(root, file));
      if (isExcluded(entry.name, path)) {
        excluded.push(path);
        continue;
      }
      if (entry.isSymbolicLink())
        throw new Error(`Enlace simbólico no exportable: ${path}`);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile()) {
        const data = await readFile(file);
        checkSecrets(data, path);
        files.push({ path, bytes: data.length, sha256: hash(data) });
      }
    }
  }
  await walk(root);
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return {
    total: files.length,
    bytes: files.reduce((n, f) => n + f.bytes, 0),
    overWebLimit: files.filter((f) => f.bytes > 25_000_000),
    batches: Array.from({ length: Math.ceil(files.length / 100) }, (_, i) =>
      files.slice(i * 100, i * 100 + 100).map((f) => f.path),
    ),
    requiredMissing: requiredFiles.filter(
      (path) => !files.some((f) => f.path === path),
    ),
    files,
    excluded: excluded.sort(),
  };
}
async function emptyDestination(root, destination) {
  root = await realpath(root);
  destination = resolve(destination);
  if (
    within(root, destination) &&
    !within(resolve(root, '.cache'), destination)
  )
    throw new Error(
      'Usa un destino fuera del árbol fuente o dentro de .cache.',
    );
  const existing = await lstat(destination).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (
    existing &&
    (existing.isSymbolicLink() ||
      !existing.isDirectory() ||
      (await readdir(destination)).length)
  )
    throw new Error(
      'El destino debe ser una carpeta nueva o vacía, sin enlace simbólico.',
    );
  await mkdir(destination, { recursive: true });
  // Evitar padres simbólicos que devuelvan el destino al árbol fuente.
  const actual = await realpath(destination);
  if (within(root, actual) && !within(resolve(root, '.cache'), actual))
    throw new Error('El destino resuelto apunta al árbol fuente.');
  return destination;
}
export async function copySources(
  root,
  destination,
  inventory,
  batches = false,
) {
  const target = await emptyDestination(root, destination);
  for (let index = 0; index < inventory.files.length; index++) {
    const file = inventory.files[index];
    const data = await readFile(resolve(root, file.path));
    if (hash(data) !== file.sha256)
      throw new Error(
        `Cambió ${file.path}; repite el inventario antes de copiar.`,
      );
    const prefix = batches
      ? `lote-${String(Math.floor(index / 100) + 1).padStart(2, '0')}`
      : '';
    const output = resolve(target, prefix, file.path);
    if (!within(target, output)) throw new Error('Ruta de destino inválida.');
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, data, { flag: 'wx' });
  }
  return target;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const args = process.argv.slice(2);
    let destination,
      batches = false,
      json = false;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--json') json = true;
      else if (
        ['--copy', '--batches'].includes(args[i]) &&
        args[i + 1] &&
        !destination
      ) {
        batches = args[i] === '--batches';
        destination = args[++i];
      } else
        throw new Error(
          'Uso: node scripts/source-files.mjs [--json] [--copy DESTINO | --batches DESTINO]',
        );
    }
    const inventory = await sourceInventory();
    if (inventory.requiredMissing.length)
      throw new Error(
        `Faltan archivos necesarios: ${inventory.requiredMissing.join(', ')}`,
      );
    if (destination)
      await copySources(process.cwd(), destination, inventory, batches);
    if (json) console.log(JSON.stringify(inventory, null, 2));
    else {
      console.log(
        `${inventory.total} archivos fuente; ${inventory.bytes} bytes; ${inventory.batches.length} lotes web de hasta 100 archivos.`,
      );
      console.log(
        `Archivos por encima de 25 MB: ${inventory.overWebLimit.length}. Archivos ocultos necesarios: completos.`,
      );
      if (destination)
        console.log(
          `Copia preparada en ${resolve(destination)}${batches ? ' (subir el contenido de cada lote)' : ''}.`,
        );
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
