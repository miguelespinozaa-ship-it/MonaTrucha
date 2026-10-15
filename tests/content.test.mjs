import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import matter from 'gray-matter';
import { countWords } from '../scripts/content-report.mjs';
import { readSeries, validateEpisode } from '../scripts/content.mjs';
test('contenido publicable: muestras sin vídeos y textos editoriales completos', async () => {
  const series = await readSeries();
  for (const s of series) {
    for (const e of s.episodes) {
      const verified = validateEpisode(s, e);
      if (s.placeholder) assert.equal(verified, false);
    }
    const text = matter(
      await readFile(`src/content/series/${s.id}.md`, 'utf8'),
    ).content;
    const words = countWords(text);
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
