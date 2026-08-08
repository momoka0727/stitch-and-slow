# Pages

[简体中文](../zh-cn/pages.md) | English

## Route shell

`app/page.tsx` remains a thin App Router entry that renders the single-route
client workspace in `components/stitch-app.tsx`. This keeps uploads, active
stitches, and unsaved edits alive while switching between workspace views.

## Authentication UI

`components/modals/auth-modal.tsx` provides email sign-in, two-step email signup,
and Google sign-in. The login form contains email, password, and a Turnstile
challenge with the `email-login` action. Signup first collects name, email, and
password, then obtains an SMTP code after an `email-signup-send` challenge. The
second step accepts the six-digit code and a fresh `email-signup` token.
`components/auth/turnstile-widget.tsx` explicitly loads and removes the widget;
tokens are never persisted in browser storage.

Forms use the appropriate email, current-password, new-password, and
one-time-code autocomplete semantics. Switching mode or completing a request
resets Turnstile. Errors use an alert and code-delivery status uses a polite live
region. A 60-second resend countdown mirrors the server cooldown. The dialog
traps keyboard focus, supports arrow-key tab switching, and restores focus to its
trigger when closed. Google sign-in remains available when email configuration
is unavailable.

Protected navigation records the requested view in the authentication callback
URL. After Google returns or email authentication refreshes the page, the
workspace consumes the `view` parameter once
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
owns authentication and sharing dialogs, while `components/auth/` owns
authentication-specific components. `components/pattern/` owns reusable pattern
rendering.
