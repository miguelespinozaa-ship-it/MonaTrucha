import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
const port = 4323;
const server = spawn(process.execPath, ['scripts/serve-test.mjs'], {
  env: { ...process.env, SITE_TEST_PORT: String(port) },
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((resolve, reject) => {
  server.stdout.once('data', resolve);
  server.once('error', reject);
  server.once('exit', () =>
    reject(new Error('No se pudo iniciar el servidor')),
  );
});
let chrome;
try {
  chrome = await launch({
    ...(process.env.CHROME_PATH ? { chromePath: process.env.CHROME_PATH } : {}),
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'],
  });
  await mkdir('.cache/performance', { recursive: true });
  const summary = [];
  for (const path of [
    '/',
    '/catalogo/',
    '/series/ecos-de-neon/',
    '/episodios/ecos-de-neon/1/',
    '/articulos/por-donde-empezar/',
  ]) {
    const result = await lighthouse(`http://127.0.0.1:${port}${path}`, {
      port: chrome.port,
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      logLevel: 'error',
    });
    if (!result) throw new Error('Lighthouse no devolvió resultados');
    const report = result.lhr;
    const entry = {
      path,
      performance: Math.round(report.categories.performance.score * 100),
      accessibility: Math.round(report.categories.accessibility.score * 100),
      cls: report.audits['cumulative-layout-shift'].numericValue,
      lcp: report.audits['largest-contentful-paint'].numericValue,
    };
    summary.push(entry);
    console.log(JSON.stringify(entry));
    await writeFile(
      `.cache/performance/${path.replace(/\//g, '-') || 'home'}.json`,
      result.report,
    );
  }
  await writeFile(
    '.cache/performance/summary.json',
    JSON.stringify(
      {
        runAt: new Date().toISOString(),
        mode: 'Lighthouse mobile simulated, local server, ads disabled',
        results: summary,
      },
      null,
      2,
    ),
  );
  if (summary.some((r) => r.performance <= 90 || r.cls > 0.05))
    process.exitCode = 1;
} finally {
  await Promise.resolve(chrome?.kill());
  server.kill();
}
