import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export function projectItems(tasks) {
  const ids = new Set();
  return tasks.map((task) => {
    if (
      !/^f[0-3]-p[1-3]-\d{2}$/.test(task.id) ||
      ids.has(task.id) ||
      !task.title?.trim() ||
      !task.condition?.trim()
    )
      throw new Error(
        'Tarea sin identificador único, título o condición de salida',
      );
    ids.add(task.id);
    const phase = Number(task.id[1]),
      role = Number(task.id[4]);
    return {
      id: task.id,
      title: `F${phase} · P${role} · ${task.title}`,
      body: `<!-- project-task:${task.id} -->\n\nFuente: plan-sitio-anime.md, fase ${phase}, persona ${role}.\n\n${task.title}\n\nCondición de salida de la fase: ${task.condition}\n\n- [ ] Revisar lo ya implementado en el repositorio y la evidencia externa.\n- [ ] Asignar responsable real y revisión de otra persona.\n- [ ] Adjuntar evidencia y actualizar estado.\n\nPlantilla: el importador no declara que esta tarea esté hecha.`,
    };
  });
}
export function pendingProjectItems(items, existing) {
  const bodies = existing
    .map((item) => item.content?.body || item.body || '')
    .join('\n');
  return items.filter(
    (item) => !bodies.includes(`<!-- project-task:${item.id} -->`),
  );
}
function gh(args) {
  const result = spawnSync('gh', args, { encoding: 'utf8' });
  if (result.error || result.status)
    throw new Error(
      'gh no pudo completar la operación. Revisa autenticación, permiso de Projects y propietario/número del tablero.',
    );
  return JSON.parse(result.stdout);
}
export async function main(args) {
  const tasks = JSON.parse(
    await readFile(
      new URL('../docs/project-tasks.json', import.meta.url),
      'utf8',
    ),
  );
  const items = projectItems(tasks);
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const key = args[index];
    if (key === '--apply') options.apply = true;
    else if (['--owner', '--project'].includes(key))
      options[key.slice(2)] = args[++index];
    else
      throw new Error(
        'Opciones: --owner <cuenta> --project <número> [--apply]',
      );
  }
  if (!options.apply) {
    console.log(
      JSON.stringify({ mode: 'preview', total: items.length, items }, null, 2),
    );
    return;
  }
  if (
    !/^[a-zA-Z0-9-]+$/.test(options.owner || '') ||
    !/^[1-9]\d*$/.test(options.project || '')
  )
    throw new Error('--apply requiere --owner y --project válidos.');
  const existing = gh([
    'project',
    'item-list',
    options.project,
    '--owner',
    options.owner,
    '--limit',
    '1000',
    '--format',
    'json',
  ]);
  if (
    existing.items.length >= 1000 ||
    (existing.totalCount && existing.totalCount > existing.items.length)
  )
    throw new Error(
      'Listado incompleto del tablero: se detiene para no duplicar tareas.',
    );
  const pending = pendingProjectItems(items, existing.items);
  for (const item of pending)
    gh([
      'project',
      'item-create',
      options.project,
      '--owner',
      options.owner,
      '--title',
      item.title,
      '--body',
      item.body,
      '--format',
      'json',
    ]);
  console.log(
    `${pending.length} borradores creados; ${items.length - pending.length} ya existían. No se han creado issues, asignado personas ni cambiado campos remotos.`,
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
