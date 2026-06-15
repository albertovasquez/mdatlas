import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config();

export const ROOT        = resolve(process.argv[2] || '.');
export const PORT        = Number(process.argv[3] || 3344);
export const PROJECT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Filenames to hide from the tree, override with MDATLAS_EXCLUDE=A.md,B.md
const raw = process.env.MDATLAS_EXCLUDE ?? 'README.md,CHANGELOG.md,LICENSE.md,CODE_OF_CONDUCT.md';
export const EXCLUDE_NAMES = new Set(raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));

// Directory names to skip entirely, override with MDATLAS_EXCLUDE_DIRS=node_modules,dist
const rawDirs = process.env.MDATLAS_EXCLUDE_DIRS ?? 'node_modules';
export const EXCLUDE_DIRS = new Set(rawDirs.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));

// here.now API key for creating share URLs, optional
export const HERE_NOW_API_KEY = process.env.HERE_NOW_API_KEY ?? null;
