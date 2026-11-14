# Navigation

- `items.js`: section labels, primary links, groups and existing badge IDs.
- `view.js`: builds `#nav` before `dashboard.js` starts, preserving `data-view` and dynamic tool slots.
- `controller.js`: active state, More panel, focus handling, responsive home placement, assistant placement and appearance preference compatibility.
- `navigation.css`: layout and scoped overrides for legacy theme rules.

`dashboard.js` still owns screen selection and counts. It calls `AQMNavigation.refresh(state.view)` when rendering. Assistant tools continue to populate `#navTools`. Existing counter IDs remain available even when counts are hidden from the primary bar.

The home button moves into More on small screens, without cloning controls or IDs. Secondary views keep a visible active label on More. The panel closes on navigation, outside click or Escape. Ctrl+B and existing `sb_mode` appearance choices control optional icon-only mode on desktop.

`ui58.js` has been replaced by this controller. Other theme stylesheets keep their existing non-navigation styles; the navigation layout now has one owner.
