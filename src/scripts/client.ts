import {
  readStored,
  writeStored,
  stringArray,
  isConsent,
  type ConsentState,
} from './storage';
import { updateServices } from './services';
const status = document.getElementById('live-status');
function announce(message: string) {
  if (status) status.textContent = message;
}

const theme = document.getElementById('theme-toggle');
function updateThemeLabel() {
  theme?.setAttribute(
    'aria-label',
    `Cambiar a tema ${document.documentElement.dataset['theme'] === 'light' ? 'oscuro' : 'claro'}`,
  );
}
updateThemeLabel();
theme?.addEventListener('click', () => {
  const next =
    document.documentElement.dataset['theme'] === 'light' ? 'dark' : 'light';
  document.documentElement.dataset['theme'] = next;
  try {
    localStorage.setItem('yoru-theme', next);
  } catch {
    /* Preferencia solo en esta visita. */
  }
  updateThemeLabel();
});
const menu = document.getElementById('menu-toggle');
menu?.addEventListener('click', () => {
  const expanded = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(expanded));
  menu.setAttribute('aria-label', expanded ? 'Cerrar menú' : 'Abrir menú');
  document.getElementById('main-nav')?.classList.toggle('is-open', expanded);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    menu?.setAttribute('aria-expanded', 'false');
    document.getElementById('main-nav')?.classList.remove('is-open');
  }
});

let favorites = readStored('yoru-favorites', [], stringArray);
function renderFavorites() {
  document
    .querySelectorAll<HTMLButtonElement>('[data-favorite]')
    .forEach((button) => {
      const selected = favorites.includes(button.dataset['favorite'] || '');
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute(
        'aria-label',
        `${selected ? 'Quitar' : 'Guardar'} ${button.dataset['title']} ${selected ? 'de' : 'en'} favoritos`,
      );
    });
  const list = document.getElementById('favorites-list');
  if (list) {
    list.querySelectorAll<HTMLElement>('[data-series-card]').forEach((card) => {
      card.hidden = !favorites.includes(card.dataset['id'] || '');
    });
    const empty = document.getElementById('favorites-empty');
    if (empty)
      empty.hidden =
        favorites.length > 0 &&
        Array.from(
          list.querySelectorAll<HTMLElement>('[data-series-card]'),
        ).some((c) => !c.hidden);
  }
}
document
  .querySelectorAll<HTMLButtonElement>('[data-favorite]')
  .forEach((button) =>
    button.addEventListener('click', () => {
      const id = button.dataset['favorite'];
      if (!id) return;
      favorites = favorites.includes(id)
        ? favorites.filter((item) => item !== id)
        : [...favorites, id];
      const saved = writeStored('yoru-favorites', favorites);
      renderFavorites();
      announce(
        `${favorites.includes(id) ? 'Guardado en' : 'Eliminado de'} favoritos.${saved ? '' : ' Almacenamiento no disponible: solo se conserva en esta visita.'}`,
      );
    }),
  );
renderFavorites();
window.addEventListener('storage', (event) => {
  if (event.key === 'yoru-favorites') {
    favorites = readStored('yoru-favorites', [], stringArray);
    renderFavorites();
  }
  if (event.key === 'yoru-consent') window.location.reload();
});

const search = document.querySelector<HTMLInputElement>('#buscar');
document
  .getElementById('catalog-search')
  ?.addEventListener('submit', (event) => event.preventDefault());
const genre = document.querySelector<HTMLSelectElement>('#genre-filter');
const format = document.querySelector<HTMLSelectElement>('#format-filter');
const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
function filterCatalog() {
  let count = 0;
  document
    .querySelectorAll<HTMLElement>('[data-search-card]')
    .forEach((item) => {
      const matches =
        fold(item.dataset['search'] || '').includes(
          fold(search?.value.trim() || ''),
        ) &&
        (!genre?.value ||
          item.dataset['genres']?.split('|').includes(genre.value)) &&
        (!format?.value || item.dataset['format'] === format.value);
      item.hidden = !matches;
      if (matches) count++;
    });
  const result = document.getElementById('results-count');
  if (result)
    result.textContent = `${count} ${count === 1 ? 'historia' : 'historias'} para descubrir`;
  const empty = document.getElementById('search-empty');
  if (empty) empty.hidden = count > 0;
}
search?.addEventListener('input', filterCatalog);
genre?.addEventListener('change', filterCatalog);
format?.addEventListener('change', filterCatalog);
document.getElementById('reset-filters')?.addEventListener('click', () => {
  if (search) search.value = '';
  if (genre) genre.value = '';
  if (format) format.value = '';
  filterCatalog();
  search?.focus();
});

interface HistoryItem {
  id: string;
  title: string;
  href: string;
  episode: number;
  at: number;
}
const validHistory = (value: unknown): value is HistoryItem[] =>
  Array.isArray(value) &&
  value.every(
    (v: unknown) =>
      typeof v === 'object' &&
      v !== null &&
      'id' in v &&
      typeof v.id === 'string' &&
      'title' in v &&
      typeof v.title === 'string' &&
      'href' in v &&
      typeof v.href === 'string' &&
      /^\/episodios\/[a-z0-9-]+\/\d+\/$/.test(v.href) &&
      'episode' in v &&
      typeof v.episode === 'number' &&
      'at' in v &&
      typeof v.at === 'number',
  );
let history = readStored<HistoryItem[]>('yoru-history', [], validHistory);
const episode = document.querySelector<HTMLElement>('[data-current-episode]');
if (episode) {
  const id = episode.dataset['seriesId'] || '';
  history = [
    {
      id,
      title: episode.dataset['seriesTitle'] || '',
      href: window.location.pathname,
      episode: Number(episode.dataset['episode']),
      at: Date.now(),
    },
    ...history.filter((item) => item.id !== id),
  ].slice(0, 20);
  writeStored('yoru-history', history);
}
const historyList = document.getElementById('history-list');
if (historyList && history.length) {
  document.getElementById('history-section')?.removeAttribute('hidden');
  for (const item of history.slice(0, 4)) {
    const link = document.createElement('a');
    link.href = item.href;
    link.className = 'history-card';
    const label = document.createElement('span');
    label.className = 'eyebrow';
    label.textContent = `Episodio ${item.episode} · última visita`;
    const title = document.createElement('strong');
    title.textContent = item.title;
    const action = document.createElement('span');
    action.textContent = 'Continuar →';
    link.append(label, title, action);
    historyList.append(link);
  }
}
document.getElementById('clear-history')?.addEventListener('click', () => {
  writeStored('yoru-history', []);
  historyList?.replaceChildren();
  document.getElementById('history-section')?.setAttribute('hidden', '');
  announce('Historial borrado');
});

let consent = readStored<ConsentState | null>('yoru-consent', null, isConsent);
const banner = document.getElementById('cookie-banner');
const dialog = document.querySelector<HTMLDialogElement>('#cookie-dialog');
if (!consent) banner?.removeAttribute('hidden');
else updateServices(consent);
function saveConsent(ads: boolean, analytics: boolean) {
  const revoke = Boolean(
    consent && ((consent.ads && !ads) || (consent.analytics && !analytics)),
  );
  const next: ConsentState = {
    version: 1,
    ads,
    analytics,
    savedAt: Date.now(),
  };
  const persisted = writeStored('yoru-consent', next);
  consent = next;
  if (banner) banner.hidden = true;
  dialog?.close();
  announce('Preferencias guardadas');
  if (revoke && persisted) {
    window.location.reload();
    return;
  }
  // Cuando el almacenamiento está bloqueado, retirar consentimiento exige detener todo recurso externo.
  if (revoke && !persisted) {
    window.location.reload();
    return;
  }
  updateServices(next);
}
document
  .querySelectorAll<HTMLButtonElement>('[data-consent]')
  .forEach((button) =>
    button.addEventListener('click', () =>
      saveConsent(
        button.dataset['consent'] === 'accept',
        button.dataset['consent'] === 'accept',
      ),
    ),
  );
document
  .querySelectorAll<HTMLButtonElement>('[data-cookie-settings]')
  .forEach((button) =>
    button.addEventListener('click', () => {
      const ads = document.querySelector<HTMLInputElement>('#consent-ads');
      const analytics =
        document.querySelector<HTMLInputElement>('#consent-analytics');
      if (ads) ads.checked = consent?.ads || false;
      if (analytics) analytics.checked = consent?.analytics || false;
      dialog?.showModal();
    }),
  );
document
  .querySelector('[data-close-dialog]')
  ?.addEventListener('click', () => dialog?.close());
document
  .getElementById('save-consent')
  ?.addEventListener('click', () =>
    saveConsent(
      Boolean(
        document.querySelector<HTMLInputElement>('#consent-ads')?.checked,
      ),
      Boolean(
        document.querySelector<HTMLInputElement>('#consent-analytics')?.checked,
      ),
    ),
  );
document.querySelectorAll<HTMLElement>('[data-player]').forEach((player) =>
  player.querySelector('[data-play]')?.addEventListener('click', () => {
    const id = player.dataset['youtubeId'];
    if (!id || !/^[\w-]{11}$/.test(id)) return;
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    frame.title = player.dataset['videoTitle'] || 'Episodio oficial';
    frame.allow =
      'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    player.replaceChildren(frame);
    frame.focus();
  }),
);
