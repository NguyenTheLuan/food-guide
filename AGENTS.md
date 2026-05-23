# Cline Rules — Food Tour SG

## Tech Stack
- **Language**: TypeScript only — no `.js` files in `src/`
- **Bundler**: Vite (multi-page: `index.html` + `dev/index.html`)
- **Data**: Google Apps Script API (main) / xlsx static file (dev preview)
- **Deploy**: GitHub Pages via `peaceiris/actions-gh-pages@v4` from `gh-pages` branch

## Code Style
- **Classes only** — one exported class per file, logic lives in classes
- **Interfaces for data** (`types.ts`), classes for behavior
- **No `any`** — every method has explicit return types, every param typed
- **Private members** prefixed with `_` (methods and fields)
- **Named exports only** — no `export default`
- **`const` over `let`** — never use `var`
- **No hardcoded strings** — reuse variables, extract to `config.ts` when shared

## Project Structure
```
src/
  types.ts    — interfaces (Place, PlaceFormData, Filters)
  config.ts   — constants (PAGE_SIZE, API URLs)
  api.ts      — Google Apps Script API calls, returns typed results, never throws
  search.ts   — search/filter logic (SearchEngine class)
  render.ts   — all DOM rendering (TableRenderer, PaginationRenderer, FilterRenderer, ModalManager, NotificationManager, LoadingIndicator, ConfirmDialog)
  main.ts     — main app entry (edit/add/delete)
  dev-main.ts — dev preview entry (read-only, xlsx source)
```

- **Separation of concerns**: API → Search → Render → Main
- **New features**: add class to `render.ts` if it touches DOM, `search.ts` if it filters data, `api.ts` if it talks to the backend

## API Layer (`api.ts`)
- All methods return `ApiResponse<T>` — never throw to the caller
- Errors are caught internally, returned as `{ success: false, message, data: [] }`
- Uses native `fetch` — no axios or other HTTP libs

## DOM Rendering (`render.ts`)
- All classes take zero constructor arguments unless truly needed
- `render()` methods accept data and callbacks, never store DOM references as fields
- Use `_esc()` for all user-generated text (XSS prevention via `textContent`)

## Dependencies
- **Minimal** — prefer native Web APIs (`fetch`, `URL`, `Set`, `Map`)
- Current deps: `xlsx` (dev page only), `vite`, `typescript`, `@types/node`
- Do NOT add lodash, moment, axios, jQuery, or CSS frameworks

## Git
- Commits in English, imperative mood, ≤ 72 chars
- Example: `fix mobile card layout — label on top, value full width`

## Mobile / Responsive
- CSS breakpoint at 768px: table becomes cards
- Labels stack on top of values (not side-by-side) so long text gets full width
- Bottom-sheet modal on mobile
- Test both `index.html` (main) and `dev/index.html` (preview) on mobile viewports

## Before Committing
- `npx tsc --noEmit` must pass (exit 0)
- `npm run build` must pass and produce `dist/` with both pages
- CSS changes: verify on 375px viewport (iPhone) and 768px (iPad)