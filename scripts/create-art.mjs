// Ilustraciones vectoriales originales para las historias ficticias, sin material de terceros.
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
const works = [
  ['ecos-de-neon', '#261349', '#c04d8c', '#fa8c9e', 'city'],
  ['el-jardin-de-las-nubes', '#103b45', '#67aaa0', '#ffdcab', 'garden'],
  ['ultimo-tren-a-kioto', '#49293e', '#c77957', '#ffd6a1', 'train'],
  ['orbita-cero', '#091b45', '#457caf', '#bcdaf9', 'space'],
  ['la-chica-del-mar', '#282355', '#9f86c9', '#edbcd2', 'sea'],
];
function art(top, bottom, light, kind, wide) {
  const w = wide ? 1600 : 600,
    h = wide ? 900 : 840;
  let shapes = '';
  if (kind === 'city' || kind === 'train') {
    for (let i = 0; i < 22; i++) {
      const x = (i * w) / 20,
        height = 120 + ((i * 73) % 210);
      shapes += `<rect x="${x}" y="${h - height}" width="${w / 22}" height="${height}" fill="${i % 2 ? '#171b35' : '#232641'}"/>`;
      for (let j = 0; j < 6; j++)
        for (let k = 0; k < 3; k++)
          shapes += `<rect x="${x + 8 + k * 12}" y="${h - height + 18 + j * 30}" width="5" height="11" fill="${light}" opacity="${(i + j + k) % 3 ? '.45' : '.1'}"/>`;
    }
    shapes += `<path d="M0 ${h * 0.8} Q ${w * 0.4} ${h * 0.69} ${w} ${h * 0.83}" fill="none" stroke="#292c43" stroke-width="22"/><path d="M0 ${h * 0.79} Q ${w * 0.4} ${h * 0.68} ${w} ${h * 0.82}" fill="none" stroke="${light}" stroke-width="2" opacity=".7"/>`;
    if (kind === 'train')
      shapes += `<path d="M${w * 0.1} ${h * 0.72}h${w * 0.7}v65H${w * 0.1}z" fill="#363449"/><path d="M${w * 0.14} ${h * 0.73}h${w * 0.59}v22H${w * 0.14}z" fill="${light}" opacity=".7"/>`;
  } else if (kind === 'garden') {
    for (let i = 0; i < 5; i++)
      shapes += `<path d="M${(i * w) / 4 - 60} ${h * 0.62 + (i % 2) * 70}q110 -80 230 0l-110 90z" fill="#193f43"/><ellipse cx="${(i * w) / 4 + 40}" cy="${h * 0.61 + (i % 2) * 70}" rx="112" ry="28" fill="#528b75"/>`;
    shapes += `<path d="M${w * 0.62} ${h * 0.68}q-40 -150 20 -290q50 170 -20 290" fill="#153d40"/><circle cx="${w * 0.67}" cy="${h * 0.37}" r="80" fill="#68a58a" opacity=".7"/>`;
  } else if (kind === 'space') {
    shapes += `<circle cx="${w * 0.68}" cy="${h * 0.43}" r="${w * 0.25}" fill="#7d98c4" opacity=".65"/><ellipse cx="${w * 0.68}" cy="${h * 0.43}" rx="${w * 0.36}" ry="${w * 0.055}" fill="none" stroke="${light}" stroke-width="13" transform="rotate(-24 ${w * 0.68} ${h * 0.43})" opacity=".65"/><path d="M0 ${h * 0.79}q${w * 0.45} -130 ${w} 0v300H0" fill="#111a36"/>`;
  } else {
    shapes += `<path d="M0 ${h * 0.65}q${w * 0.3} -45 ${w} 0v${h}H0" fill="#7686b3"/><path d="M0 ${h * 0.7}q${w * 0.4} -30 ${w} 0" stroke="${light}" stroke-width="3" fill="none"/>`;
    for (let i = 0; i < 8; i++)
      shapes += `<path d="M${i * 91} ${h * 0.74 + i * 13}h${80 + i * 12}" stroke="${light}" stroke-width="2" opacity=".35"/>`;
    shapes += `<path d="M0 ${h * 0.82}h${w * 0.75}v20H0" fill="#24283f"/><path d="M30 ${h * 0.82}v140M${w * 0.6} ${h * 0.82}v140" stroke="#24283f" stroke-width="12"/>`;
  }
  const cx = wide ? w * 0.73 : w * 0.47,
    cy = h * 0.72;
  shapes += `<g fill="#14182c"><circle cx="${cx}" cy="${cy - 95}" r="18"/><path d="M${cx - 17} ${cy - 82}q18 -14 34 0l12 64h-56z"/><path d="M${cx - 15} ${cy - 22}l-8 100h15l11-74l7 74h15l-9-100z"/><path d="M${cx - 18} ${cy - 74}l-27 52l9 5l29-43M${cx + 18} ${cy - 74}l29 47l-8 6l-31-39"/></g><path d="M${cx - 13} ${cy - 91}q5-30 29-6l6 18" stroke="#15172c" stroke-width="9" fill="none"/>`;
  let stars = '';
  for (let i = 0; i < 65; i++)
    stars += `<circle cx="${(i * 137 + 23) % w}" cy="${(i * 79 + 18) % (h * 0.61)}" r="${i % 4 === 0 ? 2 : 1}" fill="${light}" opacity="${i % 2 ? '.5' : '.8'}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient><radialGradient id="glow"><stop stop-color="${light}" stop-opacity=".4"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#sky)"/><circle cx="${w * 0.63}" cy="${h * 0.34}" r="${h * 0.32}" fill="url(#glow)"/><circle cx="${w * 0.63}" cy="${h * 0.34}" r="${h * 0.085}" fill="${light}" opacity=".85"/>${stars}<path d="M0 ${h * 0.53}q${w * 0.25} -35 ${w * 0.55} 0t${w * 0.5} 0" stroke="${light}" stroke-opacity=".2" stroke-width="2" fill="none"/>${shapes}<rect width="${w}" height="${h}" fill="#0a1020" opacity=".06"/></svg>`;
}
for (const [name, top, bottom, light, kind] of works) {
  for (const wide of [false, true])
    await sharp(Buffer.from(art(top, bottom, light, kind, wide)))
      .png()
      .toFile(`src/assets/${name}${wide ? '-hero' : ''}.png`);
}
await sharp('src/assets/ecos-de-neon-hero.png')
  .resize(1200, 630)
  .png()
  .toFile('public/og.png');
await writeFile(
  'public/favicon.svg',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#13121c"/><path d="M19 16l13 20 13-20h-9l-4 8-4-8zm9 20v13h8V36" fill="#ec72a7"/></svg>',
);
