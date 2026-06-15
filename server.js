#!/usr/bin/env node
import http from 'http';
import readline from 'readline';
import { exec } from 'child_process';
import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';

import './src/routes/auth.js';
import './src/routes/tree.js';
import './src/routes/files.js';
import './src/routes/events.js';
import './src/routes/share.js';

import { router } from './src/router.js';
import { PORT, ROOT, HERE_NOW_API_KEY } from './src/config.js';
import { SESSION_TOKEN } from './src/auth.js';
import { publishToHereNow } from './src/herenow.js';

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? 'start' :
              process.platform === 'darwin' ? 'open' : 'xdg-open';
  exec(`${cmd} "${url}"`);
}

async function generateShareUrl() {
  if (!HERE_NOW_API_KEY) return;

  try {
    const files = await readdir(ROOT, { recursive: true });
    const mdFiles = files.filter(f => extname(f).toLowerCase() === '.md');
    if (mdFiles.length === 0) return;

    const content = await readFile(join(ROOT, mdFiles[0]), 'utf-8');
    const siteUrl = await publishToHereNow(content);
    console.log(`  🔗 here.now: ${siteUrl}\n`);
  } catch (err) {
    console.log(`  ⚠️  here.now publish skipped: ${err.message}\n`);
  }
}

const server = http.createServer((req, res) => router.handle(req, res));

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is already in use.\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, async () => {
  const url = `http://localhost:${PORT}/?token=${SESSION_TOKEN}`;
  console.log(`\n  mdatlas running at ${url}`);
  console.log(`  root: ${ROOT}\n`);

  await generateShareUrl();

  if (!process.stdin.isTTY) return;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('  Press ENTER to open in the browser… ', () => {
    rl.close();
    openBrowser(url);
  });
});
