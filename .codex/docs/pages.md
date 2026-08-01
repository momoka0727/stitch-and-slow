# Pages

## Route shell

`app/page.tsx` is intentionally a thin App Router entry. It renders
`components/stitch-app.tsx`, the client-side workspace orchestrator.

The current product remains a single-route workspace so that an uploaded image,
the active stitch set, and unsaved edits survive navigation between views. The
orchestrator owns state and side effects; it does not own page markup.

## View modules

Each workspace view is isolated under `components/pages/`:

- `home-page.tsx` — introduction and curated pattern preview.
- `gallery-page.tsx` — pattern search and selection.
- `upload-page.tsx` — local image selection and conversion entry.
- `projects-page.tsx` — validated saved-project cards.
- `studio-page.tsx` — stitch canvas, progress controls, and thread board.

`components/layout/` owns the shared header and footer. `components/modals/`
owns authentication and sharing dialogs. `components/pattern/` owns reusable
pattern rendering.

View changes are represented by the `WorkspaceView` and `WorkspaceAction`
types in `components/pages/types.ts`. Keep navigation logic in the orchestrator
and presentational markup in the matching page component.

## Shared links

On initial load, the workspace reads an optional `share` query parameter and
requests `GET /api/share`. The response row and its embedded `patternJson` are
both untrusted. They must pass the shared Zod contracts before the studio state
is restored. Preserve compatibility with existing `/?share=<id>` links.

## Metadata and shell

`app/layout.tsx` generates request-aware metadata and owns the Chinese document
language, fonts, favicon, and social preview metadata.
