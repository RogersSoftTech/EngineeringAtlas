# Verification

## Course library integration — November 12, 2026

- 50 source snapshots validated against their catalog entries (24 Quick Courses, 26 Deep Dives across 29 topics); all are explicitly flagged as partial.
- 28 tests pass across 6 files, covering the original workflows plus section splitting and stable IDs, export parsing, active-branch selection, IndexedDB persistence, compatible progress backups, course-reader forms, learning/interview separation, sanitization and display-marker cleanup.
- GitHub Pages production build passes with lazy course assets and relative paths.
- Browser checks confirmed topic/format filtering, source-excerpt notices, readable Markdown, wrapped section navigation, and section notes/takeaways/completion surviving reload. Temporary verification text and completion were cleared afterward.
- Complete source text remains dependent on importing the user's ChatGPT export; generated illustrations and attachments remain accessible through original-chat links.

## Original application

Verified on Windows with Node.js 22.23.4, Angular 22.2.6, Angular build tooling 22.2.7 and Vitest 4.1.12.

- `npm test`: 12 tests passed in 2 test files. Covers curriculum completeness, reload persistence, mode separation, resume/recommendations, confidence assessment, legacy backup imports, merge behavior, invalid backups, storage failures, rendered search, Angular form input and route changes.
- `npm run build`: production build passed, including strict TypeScript and Angular template checks.
- `npm run build:pages`: relative-base static build passed.
- Browser smoke check: dashboard and module rendered successfully; typed notes and takeaway persisted across reload, completion persisted, switching to Interview Prep showed independent empty fields, returning to Learning restored notes. Temporary verification text was cleared afterward.

The GitHub workflows are included but have not been run in a GitHub repository or deployed to GitHub Pages. The existing private hosted site remains the original version; this deliverable is a standalone Angular project for your repository.
