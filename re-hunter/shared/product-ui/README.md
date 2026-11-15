# Core workflow presentation

The restrained matching screen is the visual reference for matches, buyers, sellers and recommendations. All four opt into `aqm-product-view`; `product-ui.css` owns shared surfaces, fields, buttons, tabs, metrics, classification tiles, person-card presentation and recommendation panels.

Presentation only: no action handlers, storage calls, filters, button text, IDs, data attributes or business logic change. Native details/open state, hidden/team-dependent fields, mobile filter toggles, disabled controls and feature-specific grids remain owned by their original screens. Only decorative pseudo-elements are removed.

Defaults: 12px surface radius, 8px controls, 36px buttons, 38px fields, Cairo, neutral surfaces and one accent. Semantic labels/icons and percentage/progress data remain. Matching retains six-card pagination; people cards retain contact/CRM/follow-up controls; recommendation retains every internal tab and unit action.

This file uses native CSS nesting supported by the project's Chromium/Electron target. Angular imports the same CSS via global SCSS; the dashboard links it directly. No duplicate theme copies or runtime style injection.
