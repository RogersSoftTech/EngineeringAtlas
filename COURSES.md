# Deep Dive and Quick Course library

The app now includes a searchable **Course library** with 50 source conversations across 29 topics: 24 Quick Courses and 26 Deep Dives. The original 13 roadmaps and 39 modules remain available, with links to related source courses.

## Source coverage

All 50 source replies exceeded the connected chat reader's 20,000-character limit. The packaged files therefore contain **excerpts**, not complete courses. Every course is marked accordingly, including the reader's last section, which may end mid-explanation. The app does not invent missing text or claim that finishing an excerpt completes the original course. Source diagrams or attached media that were not included as text remain in the original chat.

The exact conversation title and original chat link are retained in `src/app/course-catalog.ts`. The assistant text available from each chat is packaged in `public/courses/<conversation-id>.json`; user prompts are excluded. Content is loaded on demand, rather than bundled into the initial application JavaScript.

## Read, resume, and reflect

1. Open **Course library** from the sidebar or dashboard.
2. Search by topic and choose Quick Course or Deep Dive.
3. Select a section. Notes, practical application, takeaways, confidence and completion save in the browser.
4. Resume from the dashboard or library. Course takeaways appear in **My takeaways** in Learning mode.

Course records are separate from roadmap records. Original module progress and interview answers are preserved. Courses are learning content and prompt a switch to Learning when Interview Prep is active. The dashboard's original completion percentage continues to describe the 39 roadmap modules; course-section progress is shown separately.

## Import complete replies

Get a ChatGPT data export and extract its **conversations.json** file. In **Course library**, choose **Import full chat export** and select that JSON file (up to 100 MB). The app matches the 50 known courses by conversation ID or exact title, reads assistant text from the current conversation branch, and replaces those excerpts in this browser. Other chats, prompts, and inactive answer branches are not imported.

The file is parsed in the browser. Matching assistant course text is saved through the authenticated API to private Azure Blob Storage, with an account-scoped IndexedDB device copy. Unrelated chats and user prompts are not uploaded. Existing chapter IDs are based on their headings, so replacing an excerpt with the matching full reply preserves section progress and notes for unchanged headings. Rewriting headings can produce new section IDs.

Alternatively import one Atlas course JSON document shaped like the bundled files. Its `truncated` flags are preserved; only an actually complete source should have `truncated: false`.

Imported course text follows your invited sign-in across devices after Azure confirms the upload. It does not update the repository or original chats. Your progress export still **does not include imported source text**; keep the original ChatGPT export as an additional backup. Clearing site storage removes device copies but does not delete cloud records. See AZURE_STORAGE.md for migration and offline/conflict behavior.

## Rendering and hosting

Markdown includes headings, tables, lists, links and fenced code. Raw HTML is displayed as text, external source images are replaced by a source-reference notice, and Angular sanitizes rendered HTML. Code examples are displayed, never executed. Diagrams expressed as plain text remain readable code/text; missing generated visuals are not reconstructed as if they were the original.

Assets use the document base URL and work with the existing GitHub Pages relative-base build. The deployed app uses its own Azure/GitHub sign-in and managed storage API; it does not need ChatGPT sign-in or live chat access to read packaged excerpts. Opening original chats requires your own ChatGPT access.
