// Servidor local de validación que aplica _headers; Astro preview no aplica la CSP de Pages.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.env.SITE_TEST_DIR || 'dist');
const rules = [];
let current;
for (const line of (await readFile(resolve(root, '_headers'), 'utf8')).split(
  '\n',
)) {
  if (!line.trim() || line.startsWith('#')) continue;
  if (!line.startsWith(' ')) {
    current = { path: line.trim(), headers: {} };
    rules.push(current);
  } else {
    const i = line.indexOf(':');
    if (current && i > 0)
      current.headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
}
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};
const server = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost');
  let file = resolve(root, '.' + decodeURIComponent(url.pathname));
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403).end();
    return;
  }
  let code = 200;
  try {
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    await stat(file);
  } catch {
    file = resolve(root, '404.html');
    code = 404;
  }
  const headers = {
    'Content-Type': types[extname(file)] || 'application/octet-stream',
  };
  for (const rule of rules)
    if (
      rule.path === '/*' ||
      rule.path === url.pathname ||
      (rule.path.endsWith('*') &&
        url.pathname.startsWith(rule.path.slice(0, -1)))
    )
      Object.assign(headers, rule.headers);
  response.writeHead(code, headers).end(await readFile(file));
});
server.listen(Number(process.env.SITE_TEST_PORT || 4321), '127.0.0.1', () =>
  console.log('Validation server ready'),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.close(() => process.exit(0)));
