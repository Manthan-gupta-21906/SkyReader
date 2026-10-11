# Deployment Guide

## Build and Deploy

```bash
# From repo root
npm run --prefix web build
```

## GitHub Pages

```bash
# 1. Build the web app
npm run --prefix web build

# 2. Add base path (set by CI workflow via VITE_BASE env var)
#    Local default: /  (change to repo name for GH Pages, e.g. /SkyReader/)

# 3. Deploy dist/ to GitHub Pages
npx gh-pages -d web/dist -b main
```

## CI/CD Workflow

The `.github/workflows/ci.yml` and `.github/workflows/deploy.yml` workflows handle:

- **CI**: Lint, typecheck, test, build on every push
- **Deploy**: GitHub Pages from `main` branch, `working-directory: web`
- **Base path**: Set via `VITE_BASE` environment variable in the workflow

## Local Development

```bash
# Start dev server
npm run --prefix web dev

# Run checks
npm run --prefix web check

# Format code
npm run --prefix web format
```