# Matching interface

The matching engine stays in `../match.js` and `../engine-worker.js`. These files own the matching **screen**, not scoring, data collection or contact lookups.

| File | Responsibility |
| --- | --- |
| `model.js` | Filtering, buyer tiers, new-match flags, grouped result ordering and incremental pair updates |
| `cards.js` | Individual/grouped card markup, comparison rows, explanations and details markup |
| `fast.js` | Quick buyer/offer view, contact tracking, keyboard navigation and quick-view controls |
| `controller.js` | Rendering, group dialog lifecycle, feedback, control initialization and disclosure state |
| `matches.css` | Scoped layout for `#v-matches`, with shared disclosure styling for its existing dialog |

## Loading and shared dependencies

This project uses classic scripts and shared dashboard state. The four scripts load **before** `dashboard.js`, in the order in `dashboard.html`. They define functions and register deferred event listeners; they must not read dashboard state or call dashboard helpers at script evaluation time.

`dashboard.js` calls `initMatchControls()` and `initFastMatches()` after its state and DOM bindings are ready, before the initial `load()`. Keep these calls single. Existing data attributes, event delegation, local preferences, export and message preparation remain compatible. Loading works from the extension, Electron and the authenticated localhost server without a bundler.

## Card hierarchy

Quick mode displays the buyer, request, budget and three best offers. Each offer retains its seller ID and primary action. Secondary source text, classification badges, contact links and comparison chips live inside native `details` disclosures. Open disclosures survive live result redraws. Grouped and individual modes use the same disclosure vocabulary.

Styles use the existing theme tokens, font and RTL layout. No new CSS framework or build step is required. Fast-view styles were removed from `ui64.css` so they have one owner here. Other screens retain their existing styles.

## Verification

From `alaa-deals-app/`:

```powershell
node tests/matches/model.test.js
node tests/matches/electron.test.js
npm run sync
```

Fixtures are fictitious local data. The UI test uses an isolated Electron profile and replaces the contact component with a local display stub. It does not query Facebook, the employee directory, or send messages. Screenshots are written to `output/playwright/` (ignored).
