# API contracts

## Shared validation

`lib/validation/stitch.ts` is the source of truth for browser and server data.
Types such as `Pattern`, `ThreadColor`, and `SavedProjectRow` are inferred from
Zod schemas rather than duplicated by hand.

The browser API client in `lib/api/stitch-client.ts` validates outgoing payloads
and incoming JSON. API routes validate query parameters and request bodies
before accessing D1. Persisted `patternJson` and `stitchedJson` are parsed and
validated again when restored.

## Progress

- `GET /api/progress?user=<email>&pattern=<id>` returns one matching progress.
- `GET /api/progress?user=<email>&all=1` returns up to the configured project
  limit, most recently updated first.
- `POST /api/progress` accepts a validated email, pattern id, complete pattern,
  and active-cell stitch indices.

## Sharing

- `GET /api/share?id=<id>` returns one shared project or `null`.
- `POST /api/share` accepts a sender name, recipient email, and validated
  pattern.

Malformed query/body data returns `400`. A serialized pattern that exceeds the
configured storage limit returns `413`; JSON is never truncated before being
stored. Unexpected storage failures return `500`.

## Known identity boundary

The current prototype associates progress with the email supplied by the
browser. This is validation, not authentication. A production identity upgrade
must derive the user identity from a trusted server-side session or signed
request context rather than query/body fields.
