# Engineering Atlas — Angular

PrimeNG controls and the blue Aura theme are configured. See [PRIMENG.md](PRIMENG.md) for component details and local/CI license setup.

The **Course library** connects 50 Deep Dive and Quick Course chat excerpts to your roadmaps, with section progress, notes, takeaways, original-chat links and full-export import. See [COURSES.md](COURSES.md) for coverage limits and how to replace excerpts with complete source replies.

A standalone Angular 22 application for technical and engineering leadership development. Includes all 13 roadmaps and 39 modules from the original workspace, responsive layouts, real Angular templates, typed curriculum, signals, forms, routing and a shared progress service.

## Run locally

Install Node.js 22.22.3 or newer in the 22.x line (the project uses 22.23.4), or a compatible version listed in [Angular's compatibility table](https://angular.dev/reference/versions).

```sh
npm ci
npm start
```

Open **http://localhost:4200**. Stop the server with Ctrl+C.

```sh
npm test                 # Angular/Vitest functional and component tests
npm run build           # Production build with strict template checking
npm run build:pages     # Relative asset paths for GitHub Pages
```

The deployable files are in `dist/engineering-atlas/browser/`. Hash-based routes support static hosting without server rewrite configuration. You must serve the build through an HTTP server rather than opening index.html directly.

## Save to GitHub

1. Extract the source ZIP, then open this folder in your editor or terminal.
2. Create an **empty repository** on GitHub (skip generated README/license/gitignore to avoid an initial merge).
3. Run the following, replacing `YOUR-ACCOUNT` with your GitHub account:

```sh
git init
git add .
git commit -m "Create Angular engineering learning workspace"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/engineering-atlas.git
git push -u origin main
```

The included `.gitignore` excludes dependencies, build output, caches and environment secrets. Commit `package-lock.json` so local and GitHub builds use the same dependency versions. GitHub Actions runs tests and a production build for pushes to main and pull requests.

### Optional: publish using GitHub Pages

In repository **Settings → Pages**, select **GitHub Actions** as the source. Then choose **Actions → Deploy to GitHub Pages → Run workflow**. The deployment workflow is manual; saving the code does not publish the app. GitHub Pages availability depends on your repository/account plan, and Pages may make the site publicly accessible. There is no ChatGPT sign-in gate in this standalone app. Personal notes remain local to the browser and are never committed or uploaded by this app.

## Use the workspace

- Choose a roadmap, then start a module. Each contains a lesson, contextual example, practical exercise and interview prompt with an answer guide.
- Technical modules include a reference architecture diagram and Azure/AWS comparisons; leadership modules include a practice-cycle diagram.
- Switch **Learning / Interview Prep** in the header. Each mode has independent notes, exercise or answer evidence, takeaways, confidence and completion.
- Changes save as you type using browser local storage. The dashboard resumes the last unfinished module and recommends started and low-confidence work first.
- Confidence 4–5 appears as a strength; 1–2 appears as a gap. Unassessed modules remain unknown. Completion does not imply mastery.
- **Export my progress** creates a JSON backup. **Import backup** merges records after confirmation and replaces matching records.

### Bring progress from the previous site

Export a backup from the original site, then import it into this Angular app. The module IDs and `engineering-atlas-v1` format are preserved. Storage belongs to a browser and site address: localhost, GitHub Pages and the original hosted site do **not** automatically share progress. Export before changing origin, browser, or clearing site data.

There is no backend, login, telemetry, database, or cross-device synchronization. The curriculum is a starting point; cloud mappings represent capabilities rather than exact equivalents. Confirm current implementation details in official vendor documentation.

## Project structure

```text
src/app/curriculum.ts          13 typed roadmaps / 39 modules
src/app/models.ts             Shared domain models
src/app/progress.service.ts    Persistence, backups and recommendations
src/app/app.routes.ts          Hash-based navigation
src/app/*component.*           Angular pages and reusable topic card
src/app/*.spec.ts              Functional and component tests
src/styles.css                Responsive design
.github/workflows/ci.yml       Build and test on GitHub
.github/workflows/pages.yml    Optional manual Pages deployment
```

Extend the roadmap content in `curriculum.ts`. Keep existing IDs stable to retain saved progress. The architecture and leadership diagrams are reusable contextual references shared across the corresponding modules.
