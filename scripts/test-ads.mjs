import { spawnSync } from 'node:child_process';
const env = {
  ...process.env,
  BUILD_OUTPUT_DIR: '.cache/ads-build',
  PUBLIC_ADS_ENABLED: 'true',
  PUBLIC_ADSENSE_CLIENT_ID: 'ca-pub-0000000000000000',
  PUBLIC_CF_ANALYTICS_TOKEN: 'test-token',
  PUBLIC_CMP_REQUIRED: 'true',
  PUBLIC_CMP_SCRIPT_URL: 'https://cmp.example.com/loader.js',
  SITE_TEST_DIR: '.cache/ads-build',
  SITE_TEST_PORT: '4322',
  ADS_TEST_MODE: 'true',
};
for (const position of ['NAV', 'HOME', 'SIDEBAR', 'ARTICLE', 'PLAYER'])
  env[`PUBLIC_AD_SLOT_${position}`] = '1234567890';
for (const [command, args] of [
  ['npm', ['run', 'build']],
  ['npx', ['playwright', 'test']],
]) {
  const result = spawnSync(command, args, { env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status) process.exit(result.status);
}
