# AGENTS.md

## Cursor Cloud specific instructions

### Current repository state

This repository is currently a **placeholder**. The only tracked file is `README.md`
(`# Joyce Ren Portfolio`). There is no application code, dependency manifest
(`package.json`, `requirements.txt`, etc.), build system, test suite, or runnable service yet.

Because there is nothing to run, there are currently **no lint / test / build / dev commands**.
Once a stack is chosen (e.g. Vite, Next.js, Astro, or plain HTML/CSS) and a
`package.json` is added, document the real `dev`, `build`, `lint`, and `test`
commands here.

### Environment / tooling available on the VM

- Node.js `v22.14.0`, npm `10.9.7`
- Python `3.12.3`
- git `2.43.0`

### Update script behavior

The startup update script is intentionally guarded: it installs Node dependencies
only if a manifest exists (`npm ci` when `package-lock.json` is present, otherwise
`npm install` when `package.json` is present), and is a no-op while the repo has no
manifest. This keeps startup robust both now and after application code is added.
