import './env.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { checkLinks } from './link-checker.mjs';
try {
  const report = await checkLinks({
    internalOnly: process.argv.includes('--internal-only'),
    siteUrl: process.env.PUBLIC_SITE_URL,
  });
  await mkdir('.cache', { recursive: true });
  await writeFile('.cache/link-report.json', JSON.stringify(report, null, 2));
  console.log(`${report.pages} páginas; ${JSON.stringify(report.counts)}`);
  for (const result of report.results.filter((r) =>
    ['failed', 'unknown'].includes(r.status),
  ))
    console.log(
      `${result.status}: ${result.url || result.source} · ${result.reason}`,
    );
  if (report.counts.failed) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
