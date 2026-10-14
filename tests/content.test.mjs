import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import matter from 'gray-matter';
import { readSeries, validateEpisode } from '../scripts/content.mjs';
test('ninguna ficción publica un vídeo y todas tienen texto editorial', async () => {
  const series = await readSeries();
  assert.equal(series.length, 5);
  for (const s of series) {
    assert.equal(s.placeholder, true);
    for (const e of s.episodes) assert.equal(validateEpisode(s, e), false);
    const text = matter(
      await readFile(`src/content/series/${s.id}.md`, 'utf8'),
    ).content;
    const words = text.trim().split(/\s+/).length;
    assert.ok(words >= 150 && words <= 300, `${s.id}: ${words} palabras`);
  }
});
test('rechaza episodios sin revisión o procedentes de canales desconocidos', () => {
  const real = { id: 'test', placeholder: false };
  const episode = {
    number: 1,
    youtubeId: 'abcdefghijk',
    verified: true,
    officialChannel: '@MuseAsia',
    regions: ['JP'],
  };
  assert.equal(validateEpisode(real, episode), true);
  assert.throws(() => validateEpisode(real, { ...episode, verified: false }));
  assert.throws(() =>
    validateEpisode(real, { ...episode, officialChannel: '@reuploads' }),
  );
  assert.throws(() => validateEpisode(real, { ...episode, regions: [] }));
  assert.throws(() => validateEpisode({ ...real, placeholder: true }, episode));
});
