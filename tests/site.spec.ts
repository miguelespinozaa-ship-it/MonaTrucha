import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('inicio, tema y consentimiento sin recursos externos', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://127.0.0.1:')) external.push(r.url());
  });
  const violations: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') violations.push(m.text());
  });
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Ecos de neón');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Cambiar a tema claro' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Rechazar', exact: true }).click();
  await expect(page.locator('#cookie-banner')).toBeHidden();
  expect(external).toEqual([]);
  expect(violations).toEqual([]);
  await expect(page.locator('.ad-slot')).toHaveCount(0);
});
test('búsqueda, género y estado vacío', async ({ page }) => {
  await page.goto('/catalogo/');
  await page.getByRole('button', { name: 'Rechazar', exact: true }).click();
  await page.getByRole('searchbox').fill('neon');
  await expect(page.locator('[data-search-card]:visible')).toHaveCount(1);
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await page.locator('#genre-filter').selectOption('Fantasía');
  await expect(page.locator('[data-search-card]:visible')).toHaveCount(1);
  await page.getByRole('searchbox').fill('inexistente');
  await expect(page.locator('#search-empty')).toBeVisible();
  await page.goto('/catalogo/?genero=Drama');
  await expect(page.locator('[data-search-card]:visible')).toHaveCount(2);
});
test('favoritos persistentes y eliminación', async ({ page }) => {
  await page.goto('/catalogo/');
  await page.getByRole('button', { name: 'Rechazar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Guardar Ecos de neón en favoritos' })
    .click();
  await page.goto('/favoritos/');
  await expect(page.locator('[data-series-card]:visible')).toHaveCount(1);
  await expect(
    page.locator('[data-series-card]:visible .card-title'),
  ).toHaveText('Ecos de neón');
  await page
    .getByRole('button', { name: 'Quitar Ecos de neón de favoritos' })
    .click();
  await expect(page.locator('#favorites-empty')).toBeVisible();
});
test('episodios sin vídeo falso e historial local', async ({ page }) => {
  await page.goto('/episodios/ecos-de-neon/1/');
  await page.getByRole('button', { name: 'Rechazar', exact: true }).click();
  await expect(page.locator('[data-player]')).toContainText(
    'Placeholder · sin vídeo',
  );
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByRole('link', { name: 'Siguiente' }).click();
  await expect(page.locator('h1')).toHaveText('Señales al otro lado');
  await page.goto('/');
  await expect(page.locator('#history-section')).toBeVisible();
  await expect(page.locator('#history-list')).toContainText('Episodio 2');
  await page.getByRole('button', { name: 'Borrar historial' }).click();
  await page.reload();
  await expect(page.locator('#history-section')).toBeHidden();
});
test('el reproductor conecta con YouTube solo al pulsar, usando fixture aislada', async ({
  page,
}) => {
  await page.route('**/episodios/ecos-de-neon/1/', async (route) => {
    const response = await route.fetch();
    // La fuente publicada no tiene vídeos; esta fixture solo prueba el comportamiento del reproductor.
    const html = (await response.text())
      .replace('data-player', 'data-player data-youtube-id="abcdefghijk"')
      .replace(
        /<span class="pill">Placeholder · sin vídeo<\/span>/,
        '<button class="button button-primary" data-play>Reproducir desde YouTube</button>',
      );
    await route.fulfill({ response, body: html });
  });
  const videos: string[] = [];
  await page.route('https://www.youtube-nocookie.com/embed/**', (route) => {
    videos.push(route.request().url());
    return route.fulfill({
      contentType: 'text/html',
      body: '<html lang="es"><title>Vídeo simulado</title><body>Fuente simulada solo para pruebas</body></html>',
    });
  });
  await page.goto('/episodios/ecos-de-neon/1/');
  await page.getByRole('button', { name: 'Rechazar', exact: true }).click();
  expect(videos).toEqual([]);
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reproducir desde YouTube' }).click();
  await expect(page.locator('iframe')).toHaveAttribute(
    'src',
    'https://www.youtube-nocookie.com/embed/abcdefghijk?autoplay=1&rel=0',
  );
  await expect.poll(() => videos.length).toBe(1);
});
test('preferencias granulares y revocación', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Configurar', exact: true }).click();
  await page.locator('#consent-analytics').check();
  await page.getByRole('button', { name: 'Guardar preferencias' }).click();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('yoru-consent') || '{}'),
    ),
  ).toMatchObject({ ads: false, analytics: true });
  await page.getByRole('button', { name: 'Preferencias de cookies' }).click();
  await page.locator('#consent-analytics').uncheck();
  await page.getByRole('button', { name: 'Guardar preferencias' }).click();
  await page.waitForLoadState();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('yoru-consent') || '{}'),
    ),
  ).toMatchObject({ ads: false, analytics: false });
});
test('navegación, calendario y SEO', async ({ page, request, isMobile }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Rechazar', exact: true }).click();
  if (isMobile) {
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await expect(page.locator('#main-nav')).toBeVisible();
  }
  await page.getByRole('link', { name: 'Calendario', exact: true }).click();
  await expect(page.locator('.schedule-day')).toHaveCount(7);
  await page.goto('/articulos/por-donde-empezar/');
  await expect(page.locator('.prose h2')).toHaveCount(3);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    'https://example.com/articulos/por-donde-empezar/',
  );
  const json = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  expect(JSON.parse(json || '[]')[1]['@type']).toBe('Article');
  expect((await request.get('/sitemap-index.xml')).status()).toBe(200);
  expect((await request.get('/search-index.json')).status()).toBe(200);
  expect((await request.get('/inexistente/')).status()).toBe(404);
});
test('almacenamiento bloqueado y ausencia de desbordamiento', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Blocked');
      },
    });
  });
  await page.goto('/catalogo/');
  await page.getByRole('button', { name: 'Rechazar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Guardar Ecos de neón en favoritos' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Quitar Ecos de neón de favoritos' }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
for (const theme of ['dark', 'light'])
  test(`accesibilidad AA en ${theme}`, async ({ page }) => {
    for (const path of [
      '/',
      '/catalogo/',
      '/series/ecos-de-neon/',
      '/episodios/ecos-de-neon/1/',
      '/articulos/por-donde-empezar/',
      '/calendario/',
      '/contacto/',
    ]) {
      await page.goto(path);
      await page.evaluate((value) => {
        document.documentElement.dataset['theme'] = value;
      }, theme);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        results.violations,
        `${path}: ${JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))}`,
      ).toEqual([]);
    }
  });
