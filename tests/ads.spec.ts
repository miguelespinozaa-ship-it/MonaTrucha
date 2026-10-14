import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.route('https://pagead2.googlesyndication.com/**', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: 'window.adsbygoogle=window.adsbygoogle||[];',
    }),
  );
  await page.route('https://static.cloudflareinsights.com/**', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: 'window.analyticsTestLoaded=true;',
    }),
  );
  await page.route('https://cmp.example.com/**', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: "window.__tcfapi=function(command,version,callback){callback({eventStatus:'useractioncomplete',gdprApplies:false},true)};",
    }),
  );
});
test('la señal TCF de una CMP certificada bloquea anuncios hasta autorizar Google', async ({
  page,
}) => {
  await page.route('https://cmp.example.com/**', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: "window.__tcfapi=function(command,version,callback){window.cmpTestCallback=callback;callback({eventStatus:'tcloaded',gdprApplies:true,tcString:'test',vendor:{consents:{755:false}},purpose:{consents:{}}},true)};",
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();
  await expect(page.locator('#certified-cmp')).toHaveCount(1);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          typeof (window as Window & { cmpTestCallback?: unknown })
            .cmpTestCallback,
      ),
    )
    .toBe('function');
  await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
  await page.evaluate(() => {
    const callback = (
      window as Window & {
        cmpTestCallback?: (data: unknown, success: boolean) => void;
      }
    ).cmpTestCallback;
    if (!callback) throw new Error('La CMP simulada no está inicializada');
    callback(
      {
        eventStatus: 'useractioncomplete',
        gdprApplies: true,
        tcString: 'test',
        vendor: { consents: { 755: true } },
        purpose: {
          consents: {
            1: true,
            2: true,
            3: true,
            4: true,
            7: true,
            9: true,
            10: true,
          },
        },
      },
      true,
    );
  });
  await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(1);
});
test('AdSense y analítica solo tras aceptar, revocación detiene recursos', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
  await expect(page.locator('script[src*="beacon.min.js"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Rechazar', exact: true }).click();
  await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Preferencias de cookies' }).click();
  await page.locator('#consent-ads').check();
  await page.locator('#consent-analytics').check();
  await page.getByRole('button', { name: 'Guardar preferencias' }).click();
  await page.locator('.ad-slot').first().scrollIntoViewIfNeeded();
  await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(1);
  await expect(page.locator('script[src*="beacon.min.js"]')).toHaveCount(1);
  await expect(page.locator('ins.adsbygoogle').first()).toBeAttached();
  await page.getByRole('button', { name: 'Preferencias de cookies' }).click();
  await page.locator('#consent-ads').uncheck();
  await page.locator('#consent-analytics').uncheck();
  await page.getByRole('button', { name: 'Guardar preferencias' }).click();
  await page.waitForLoadState();
  await expect(page.locator('script[src*="adsbygoogle"]')).toHaveCount(0);
  await expect(page.locator('script[src*="beacon.min.js"]')).toHaveCount(0);
});
test('anuncios en artículos: reserva, carga diferida y límite por pantalla', async ({
  page,
}) => {
  await page.goto('/articulos/por-donde-empezar/');
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();
  await expect(page.locator('.ad-in-article')).toHaveCount(2);
  const sizes = await page
    .locator('.ad-in-article')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
  expect(sizes.every((h) => h >= 280)).toBe(true);
  await page.locator('.ad-in-article').first().scrollIntoViewIfNeeded();
  await expect(
    page.locator('.ad-in-article').first().locator('ins'),
  ).toBeAttached();
  const visible = await page.locator('.ad-slot:has(ins)').evaluateAll(
    (els) =>
      els.filter((el) => {
        const rect = el.getBoundingClientRect();
        return (
          rect.top < window.innerHeight &&
          rect.bottom > 0 &&
          (el as HTMLElement).dataset['adSuppressed'] !== 'true'
        );
      }).length,
  );
  expect(visible).toBeLessThanOrEqual(3);
});
test('desplazarse durante la carga de AdSense no pierde el nuevo slot visible', async ({
  page,
}) => {
  let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    'https://pagead2.googlesyndication.com/**',
    async (route) => {
      await gate;
      await route.fulfill({
        contentType: 'application/javascript',
        body: 'window.adsbygoogle=window.adsbygoogle||[];',
      });
    },
  );
  await page.goto('/articulos/por-donde-empezar/');
  const requested = page.waitForRequest((request) =>
    request.url().includes('adsbygoogle.js'),
  );
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();
  await requested;
  await page.locator('.ad-in-article').first().scrollIntoViewIfNeeded();
  release?.();
  await expect(
    page.locator('.ad-in-article').first().locator('ins'),
  ).toBeAttached();
});
test('ningún anuncio encima o pegado al reproductor', async ({ page }) => {
  await page.goto('/episodios/ecos-de-neon/1/');
  await expect(page.locator('.nav-ad .ad-slot')).toHaveCount(0);
  await expect(page.locator('.ad-slot')).toHaveCount(1);
  const player = await page.locator('[data-player]').boundingBox();
  const ad = await page.locator('.ad-slot').boundingBox();
  expect(ad!.y - (player!.y + player!.height)).toBeGreaterThanOrEqual(64);
});
