# Shared presentation primitives

## Typography

`typography/typography.css` is the common local Cairo font definition and Arabic/Latin typography baseline. Angular imports it into global SCSS; the dashboard and Electron shell/home/popup link it directly. It uses bundled variable WOFF2 files with font-display swap and keeps code/monospace-specific styles available. No external font service is required.

## Card grid

`card-grid/card-grid.css` defines the opt-in class `aqm-card-grid`. It uses three desktop columns, two below 1100px, one below 640px. Use `--aqm-grid-gap` to adjust spacing. It is loaded in both the engine dashboard and Angular's global SCSS, so future pages can enable the same grid by class alone.

It owns the outer layout only. Each feature owns its own card internals and actions. A fixed page size of six means six records per results page, not a forced fixed height that cuts off expanded details.

## Pagination

- `pagination/pagination.js`: framework-independent page clamping, visible range and numbered-page window. `AQMPagination.getState(total,page,pageSize)` returns the serializable state.
- `pagination/pagination.d.ts`: the shared TypeScript transport contract used by Angular.
- `AQMPagination.mount(element,state,onChange)`: optional controls for standalone legacy pages. Event delegation attaches once per element.
- `frontend/src/app/shared/pagination/`: controlled Angular HTML/SCSS/TS component. Supply `[state]` and handle `(pageChange)` in any page. It knows nothing about matches, Facebook, WhatsApp or storage.

Matches supplies page size six via `matches/pagination.js`. It caches the current filtered/ordered card collection. Page changes slice and render only six cards, without rerunning all filters, sorting, summary counters or bulk section setup. A filter change resets page one; data changes clamp the current page. Empty lists hide the controls. All original matching modes use this same page owner.

In embedded mode Angular renders the controls below the persistent frame. Standalone mode uses the shared legacy controls below the list. Quick-view arrow keys move between pages too.
