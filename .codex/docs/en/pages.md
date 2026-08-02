# Pages

[简体中文](../zh-cn/pages.md) | English

## Route shell

`app/page.tsx` remains a thin App Router entry that renders the single-route
client workspace in `components/stitch-app.tsx`. This keeps uploads, active
stitches, and unsaved edits alive while switching between workspace views.

## Authentication UI

`components/modals/auth-modal.tsx` contains one Google sign-in action. There are
no registration tabs, email inputs, or password inputs. The Better Auth React
client supplies session loading, user profile, sign-in, and sign-out state.

Protected navigation records the requested view in the OAuth callback URL.
After a successful callback, the workspace consumes the `view` parameter once
and resumes the requested action. The header shows the Google avatar or profile
initial. During session discovery it shows a disabled loading state.

Anonymous visitors may open a `/?share=<id>` link. The embedded `patternJson`
must pass shared Zod validation before the read-only studio state is restored.

## View modules

- `home-page.tsx` — introduction and curated pattern preview.
- `gallery-page.tsx` — pattern search and selection.
- `upload-page.tsx` — local image selection and conversion entry.
- `projects-page.tsx` — authenticated D1-backed project cards.
- `studio-page.tsx` — stitch canvas, progress controls, and autosave status.

`components/layout/` owns the shared header and footer. `components/modals/`
owns Google authentication and sharing dialogs. `components/pattern/` owns
reusable pattern rendering.
