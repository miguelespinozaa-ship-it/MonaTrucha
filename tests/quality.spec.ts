import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const templates = [
  ['inicio', '/'],
  ['catalogo', '/catalogo/'],
  ['serie', '/series/ecos-de-neon/'],
  ['episodio', '/episodios/ecos-de-neon/1/'],
  ['articulo', '/articulos/por-donde-empezar/'],
] as const;
test('teclado: banner no modal, preferencias con foco contenido y vuelta al disparador', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  const accept = page.getByRole('button', { name: 'Aceptar', exact: true });
  await accept.focus();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Rechazar', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  const configure = page.getByRole('button', {
    name: 'Configurar',
    exact: true,
  });
  await expect(configure).toBeFocused();
  const outline = await configure.evaluate(
    (el) => getComputedStyle(el).outlineStyle,
  );
  expect(outline).not.toBe('none');
  await page.keyboard.press('Enter');
  const close = page.getByRole('button', { name: 'Cerrar preferencias' });
  await expect(close).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#consent-ads')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#consent-analytics')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#save-consent')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(configure).toBeFocused();
  expect(
    await page
      .locator('[tabindex]')
      .evaluateAll((els) =>
        els.every((el) => Number(el.getAttribute('tabindex')) <= 0),
      ),
  ).toBe(true);
});
test('reduced-motion desactiva desplazamiento suave y transiciones en cinco plantillas', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [, path] of templates) {
    await page.goto(path);
    expect(
      await page
        .locator('html')
        .evaluate((el) => getComputedStyle(el).scrollBehavior),
    ).toBe('auto');
    const durations = await page
      .locator('.button, .cover-wrap img, .genre-tile')
      .evaluateAll((els) =>
        els.map((el) =>
          getComputedStyle(el)
            .transitionDuration.split(',')
            .every((s) => parseFloat(s) <= 0.0001),
        ),
      );
    expect(durations.every(Boolean)).toBe(true);
  }
});
test('cinco plantillas sin desbordamiento y capturas para revisión visual', async ({
  page,
}, testInfo) => {
  await mkdir('.cache/visual', { recursive: true });
  for (const [name, path] of templates) {
    await page.goto(path);
    const reject = page.getByRole('button', { name: 'Rechazar', exact: true });
    if (await reject.isVisible()) await reject.click();
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.locator('img').evaluateAll((elements) =>
      Promise.all(
        elements.map(async (element) => {
          const image = element as HTMLImageElement;
          image.loading = 'eager';
          await image.decode().catch(() => undefined);
        }),
      ),
    );
    await page.screenshot({
      path: `.cache/visual/${testInfo.project.name}-${name}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    if (name === 'episodio') {
      const alternative = page.locator('.player-note a');
      await alternative.focus();
      await page.keyboard.press('Tab');
      await expect(
        page.getByRole('link', { name: 'Todos los episodios' }),
      ).toBeFocused();
    }
  }
});
