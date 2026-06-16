# mdatlas

A zero-dependency Node.js markdown browser and editor. Run it against any directory and get a local web UI to browse and edit your `.md` files.

---

Modern projects accumulate a lot of markdown: architecture decision records, module READMEs, runbooks, API specs, onboarding guides. In a monorepo this gets scattered across dozens of packages, and it's easy to lose track of what documentation exists, let alone keep it up to date.

AI coding assistants have made this even more relevant. Tools like Claude Code, Copilot, and Cursor read your markdown to understand context, your `CLAUDE.md` files, your `ARCHITECTURE.md`, your per-package READMEs. The quality of that documentation directly affects the quality of the code they help you write. But editing raw markdown files one at a time through a file tree or a terminal is friction that makes it easy to skip.

`mdatlas` removes that friction. Point it at your repo root and you get a clean, browsable interface to all your markdown files, across every package, every service, every layer of your monorepo, in your browser, in seconds, with no install and no config. Edit any file in place and save. Symlinks to directories and `.md` files are followed, so you can surface docs from elsewhere (e.g. `.claude/agents/`) without duplicating them. Use it as your documentation hub while you work, or leave it running alongside your AI assistant so your context docs are always one tab away.

---

## Usage

No install needed, run directly with `npx`:

```bash
npx mdatlas [dir] [port]
```

| Argument | Default | Description |
|---|---|---|
| `dir` | `.` (current directory) | Root directory to serve |
| `port` | `3344` | Port to listen on |

**Example:**

```bash
npx mdatlas ~/notes 4000
```

Then open the URL printed in the terminal:

```
mdatlas running at http://localhost:4000/?token=<session-token>
root: /Users/you/notes
```

## Install globally

```bash
npm install -g mdatlas
mdatlas ~/notes
```

## Security

Each server process generates a random session token. Every request must include it, either as a URL query parameter (`?token=…`) or as a `Bearer` token in the `Authorization` header. The URL printed on startup includes the token, so just open it in your browser.

The server only serves `.md` files and prevents path traversal, all file access is sandboxed to the root directory you specify.

## Configuration

| Environment variable | Default | Description |
|---|---|---|
| `MDATLAS_EXCLUDE` | `README.md,CHANGELOG.md,LICENSE.md,CODE_OF_CONDUCT.md` | Comma-separated filenames to hide from the tree |
| `MDATLAS_EXCLUDE_DIRS` | `node_modules` | Comma-separated directory names to skip entirely |

```bash
MDATLAS_EXCLUDE=CONTRIBUTING.md MDATLAS_EXCLUDE_DIRS=node_modules,dist npx mdatlas .
```

## Roadmap

`mdatlas` is intentionally scoped to reading and editing existing files. This keeps it safe to run in any project as it won't create, rename, or delete anything you didn't already have.

Future versions may expand on this with opt-in capabilities:

- **Create files** add a new `.md` file directly from the UI, at any path within the root
- **Delete files** remove a file with a confirmation step, for cleanup workflows

These are deliberately left out for now. In a shared repo or alongside an AI assistant that's already writing files, a read-and-edit-only tool is the right default it respects the structure the project already has and doesn't step outside its lane.

## Requirements

Node.js >= 18. No dependencies.

## License

MIT
