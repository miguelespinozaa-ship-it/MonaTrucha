import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import './env.mjs';
const template = await readFile('public/_headers', 'utf8');
const policy = template.match(/ {2}Content-Security-Policy: (.+)/)?.[1];
if (!policy) throw new Error('Falta CSP en public/_headers');
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory()
          ? walk(join(directory, e.name))
          : [join(directory, e.name)],
      ),
    )
  ).flat();
}
const directory = process.env.BUILD_OUTPUT_DIR || 'dist';
const hashes = new Set();
for (const file of (await walk(directory)).filter((f) => f.endsWith('.html'))) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (!/\bsrc=|type="application\//.test(match[1]) && match[2])
      hashes.add(
        `'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`,
      );
  }
}
let csp = policy.replace(
  "script-src 'self'",
  `script-src 'self' ${[...hashes].join(' ')}`,
);
if (process.env.PUBLIC_CMP_SCRIPT_URL) {
  const cmp = new URL(process.env.PUBLIC_CMP_SCRIPT_URL);
  if (cmp.protocol !== 'https:' || cmp.username || cmp.password)
    throw new Error('CMP: solo HTTPS sin credenciales');
  for (const directive of ['script-src', 'connect-src'])
    csp = csp.replace(
      `${directive} 'self'`,
      `${directive} 'self' ${cmp.origin}`,
    );
  csp = csp.replace('frame-src ', `frame-src ${cmp.origin} `);
}
if (Buffer.byteLength(`Content-Security-Policy: ${csp}`) > 2000)
  throw new Error('CSP supera el límite de Cloudflare Pages');
await writeFile(join(directory, '_headers'), template.replace(policy, csp));
console.log(
  `Cabeceras generadas: ${hashes.size} hashes CSP de scripts ejecutables.`,
);
