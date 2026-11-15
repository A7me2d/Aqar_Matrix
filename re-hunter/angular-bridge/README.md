# Angular transition adapter

`bridge.js` runs only when the dashboard is framed with `aqm-embedded=1`. The parent and child must have the same origin. Messages are accepted only from `window.parent`, with channel `aqm:bridge:v1`. Allowed operations are `ping` and `navigate` to the explicit feature allowlist.

Readiness is published after the dashboard's initial `load()` completes. Internal view changes are reported back to Angular so its route follows the actual tool. Parent-requested navigation is acknowledged without echoing a user route change. Context messages provide the current working-area label and theme. The action allowlist forwards only the existing save, working-area, theme and tools controls; it never accepts selectors or executable code from messages.

`embedded.css` removes duplicate navigation and headings only in embedded mode, and gives legacy tools flat surfaces consistent with the Angular shell. Workspace actions are exposed in the native Angular header. The existing tools disclosure is revealed inline when requested. The parent owns one persistent iframe; route changes call `AQMOpenView`, without resetting the iframe URL.

This adapter is temporary. It is not a port of the tools' DOM or business logic to Angular.

Pagination messages carry the shared `PageState` contract from matching to Angular. The `page` operation accepts only integer page numbers while matching is active; the matching page owner clamps them. It changes the six mounted cards without reloading the frame or rerunning all page filters.
