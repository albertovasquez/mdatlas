import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildTree, guardPath } from '../src/fs.js';

let root;

before(async () => {
  root = join(tmpdir(), `mdatlas-test-${Date.now()}`);
  await mkdir(join(root, 'docs'), { recursive: true });
  await mkdir(join(root, 'empty-dir'), { recursive: true });
  await mkdir(join(root, '.hidden-dir'), { recursive: true });
  await writeFile(join(root, 'intro.md'),        '# Intro');
  await writeFile(join(root, 'notes.md'),        '# Notes');
  await writeFile(join(root, 'ignore.txt'),      'not markdown');
  await writeFile(join(root, 'README.md'),       '# Readme');
  await writeFile(join(root, 'changelog.md'),    '# Changelog');
  await writeFile(join(root, '.hidden.md'),      'hidden');
  await writeFile(join(root, 'docs', 'guide.md'), '# Guide');
  await writeFile(join(root, 'docs', 'api.md'),   '# API');
  await mkdir(join(root, 'linked'), { recursive: true });
  await writeFile(join(root, 'linked', 'agent.md'), '# Agent');
  await symlink(join(root, 'linked'), join(root, 'agents'), 'dir');
  await symlink(join(root, 'intro.md'), join(root, 'welcome.md'));
});

after(() => rm(root, { recursive: true, force: true }));

describe('guardPath', () => {
  it('returns the resolved absolute path for a valid relative path', () => {
    assert.equal(guardPath('readme.md', root), join(root, 'readme.md'));
  });

  it('resolves nested relative paths', () => {
    assert.equal(guardPath('docs/guide.md', root), join(root, 'docs', 'guide.md'));
  });

  it('throws 403 for a ../ traversal', () => {
    assert.throws(() => guardPath('../outside.md', root), { message: 'Path outside root' });
  });

  it('sets status 403 on the thrown error', () => {
    try {
      guardPath('../../etc/passwd', root);
      assert.fail('expected an error');
    } catch (e) {
      assert.equal(e.status, 403);
    }
  });
});

describe('buildTree', () => {
  it('includes .md files at the root level', async () => {
    const tree = await buildTree(root, root);
    const names = tree.filter(n => n.type === 'file').map(n => n.name).sort();
    assert.deepEqual(names, ['intro.md', 'notes.md', 'welcome.md']);
  });

  it('excludes non-markdown files', async () => {
    const tree = await buildTree(root, root);
    assert.ok(!tree.some(n => n.name === 'ignore.txt'));
  });

  it('excludes hidden files (dot-prefixed)', async () => {
    const tree = await buildTree(root, root);
    assert.ok(!tree.some(n => n.name === '.hidden.md'));
  });

  it('excludes hidden directories', async () => {
    const tree = await buildTree(root, root);
    assert.ok(!tree.some(n => n.name === '.hidden-dir'));
  });

  it('omits empty directories', async () => {
    const tree = await buildTree(root, root);
    assert.ok(!tree.some(n => n.name === 'empty-dir'));
  });

  it('sorts directories before files', async () => {
    const tree = await buildTree(root, root);
    const firstDir = tree.findIndex(n => n.type === 'dir');
    const firstFile = tree.findIndex(n => n.type === 'file');
    assert.ok(firstDir < firstFile, 'dirs should come before files');
  });

  it('recursively includes files in subdirectories', async () => {
    const tree = await buildTree(root, root);
    const docs = tree.find(n => n.name === 'docs');
    assert.ok(docs, 'docs directory should be present');
    assert.deepEqual(docs.children.map(f => f.name).sort(), ['api.md', 'guide.md']);
  });

  it('uses paths relative to root', async () => {
    const tree = await buildTree(root, root);
    const docs = tree.find(n => n.name === 'docs');
    const guide = docs.children.find(f => f.name === 'guide.md');
    assert.equal(guide.path, join('docs', 'guide.md'));
  });

  it('excludes filenames in EXCLUDE_NAMES regardless of case', async () => {
    const tree = await buildTree(root, root);
    const names = tree.map(n => n.name);
    assert.ok(!names.includes('README.md'),    'README.md should be excluded');
    assert.ok(!names.includes('changelog.md'), 'changelog.md should be excluded');
  });

  it('returns an empty array for a non-existent directory', async () => {
    assert.deepEqual(await buildTree('/no/such/path', '/no/such/path'), []);
  });

  it('follows directory symlinks', async () => {
    const tree = await buildTree(root, root);
    const agents = tree.find(n => n.name === 'agents');
    assert.ok(agents, 'agents symlink directory should be present');
    assert.deepEqual(agents.children.map(f => f.name), ['agent.md']);
    assert.equal(agents.children[0].path, join('agents', 'agent.md'));
  });

  it('follows file symlinks to markdown files', async () => {
    const tree = await buildTree(root, root);
    const welcome = tree.find(n => n.name === 'welcome.md');
    assert.ok(welcome, 'welcome.md symlink should be present');
    assert.equal(welcome.path, 'welcome.md');
  });
});
