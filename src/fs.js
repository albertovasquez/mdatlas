import { readdir, stat } from 'fs/promises';
import { join, relative, extname, resolve } from 'path';
import { ROOT, EXCLUDE_NAMES, EXCLUDE_DIRS } from './config.js';

async function resolveEntryKind(fullPath, entry) {
  if (entry.isDirectory()) return 'dir';
  if (entry.isFile()) return extname(entry.name).toLowerCase() === '.md' ? 'file' : null;
  if (!entry.isSymbolicLink()) return null;

  let target;
  try {
    target = await stat(fullPath);
  } catch {
    return null;
  }

  if (target.isDirectory()) return 'dir';
  if (target.isFile() && extname(entry.name).toLowerCase() === '.md') return 'file';
  return null;
}

export async function buildTree(dir = ROOT, root = ROOT) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const items = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (EXCLUDE_NAMES.has(entry.name.toLowerCase())) continue;
    const fullPath = join(dir, entry.name);
    const relPath  = relative(root, fullPath);
    const kind = await resolveEntryKind(fullPath, entry);

    if (kind === 'dir') {
      if (EXCLUDE_DIRS.has(entry.name.toLowerCase())) continue;
      const children = await buildTree(fullPath, root);
      if (children.length)
        items.push({ type: 'dir', name: entry.name, path: relPath, children });
    } else if (kind === 'file') {
      items.push({ type: 'file', name: entry.name, path: relPath });
    }
  }

  return items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function guardPath(rel, root = ROOT) {
  const rootResolved = resolve(root);
  const full = resolve(rootResolved, rel);
  const relToRoot = relative(rootResolved, full);
  if (relToRoot.startsWith('..') || relToRoot === '..')
    throw Object.assign(new Error('Path outside root'), { status: 403 });
  return full;
}
