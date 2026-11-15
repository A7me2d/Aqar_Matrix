# Workspace tools

Angular route: `/#/workspace-tools`. The feature shell lives in
`frontend/src/app/features/workspace-tools/` with separate HTML, SCSS and TS.

`header/view.js` moves the existing controls into `#v-workspace-tools` before
the dashboard attaches handlers. IDs and storage remain unchanged. This view is
registered in `ALL_VIEWS` and the same-origin bridge allowlist, so refresh,
direct navigation and browser history use the normal routing path.

Appearance tokens come from the engine's selected palette, mode and style.
The bridge publishes validated color values to Angular. The embedded CSS keeps
the established default Azure colors while other selections inherit their own
tokens. Do not impose a fixed accent or surface over all appearance choices.
