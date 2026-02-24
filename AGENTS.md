# AGENTS.md

## Cursor Cloud specific instructions

**OSI Trainer** — purely static single-page web app (vanilla HTML + CSS + JS, no frameworks, no build tools, no package manager). All code lives in `index.html`, `css/style.css`, `js/data.js`, and `js/app.js`.

### Running the app

Serve the repo root with any static HTTP server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/` in Chrome.

### Linting / Tests / Build

There are no configured linters, test frameworks, or build steps. The project has zero npm/pip dependencies. To validate correctness, open the app in a browser and interact with the features (encapsulation simulator, drag & drop quiz, terminal, labs).

### Key gotchas

- File drag-and-drop features (encapsulation simulator file upload) require a proper HTTP server; `file://` protocol will fail for those.
- The app uses `localStorage` for XP/gamification state; clearing it resets progress.
- All UI text is in Russian.
