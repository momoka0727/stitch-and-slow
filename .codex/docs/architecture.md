# Architecture

## Dependency direction

The workspace follows a one-way dependency flow:

```text
app routes -> components -> lib/api -> shared validation
                    |             -> constants
                    -> utils      -> shared validation
```

- `app/` contains framework entries and API routes.
- `components/` contains the workspace orchestrator and reusable UI modules.
- `constants/` contains product data and named runtime limits or calibration.
- `lib/validation/` contains the shared Zod source of truth for domain and API
  types.
- `lib/api/` contains the validated browser API client.
- `utils/` contains reusable pattern generation, color, image conversion,
  form-data, and download helpers.
- `db/` owns Drizzle bindings and schema declarations.

Components may import constants, schemas, and utils. Shared modules must not
import components or App Router entries.

## State boundaries

`components/stitch-app.tsx` owns cross-view state, timers, persistence, and
navigation. Page components receive typed data and callbacks and should remain
presentational. Canvas rendering and browser image processing stay client-side.

The active stitch collection uses `Set<number>` in memory. API and storage
boundaries convert it to a validated integer array.

## Constants

Operational limits and UI timings live in `constants/stitch.ts`. Thread and
pattern catalogs live in `constants/threads.ts` and `constants/patterns.ts`.
Algorithm geometry remains next to the relevant pure utility when its values
describe the shape itself; reusable thresholds and public limits belong in the
constants module.
