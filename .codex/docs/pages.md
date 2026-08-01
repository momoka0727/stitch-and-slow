# Pages

## Home workspace

`app/page.tsx` is the client-side cross-stitch workspace. It provides the
pattern gallery, image conversion, stitch progress, project persistence, and
share-link loading.

On initial load, the page reads an optional `share` query parameter and requests
`GET /api/share`. Treat the response body as untrusted JSON: parse it before
narrowing it to the expected share payload, and keep the existing null check
before restoring the shared pattern.

## Metadata and shell

`app/layout.tsx` generates request-aware metadata and owns the Chinese document
language, fonts, favicon, and social preview metadata.
