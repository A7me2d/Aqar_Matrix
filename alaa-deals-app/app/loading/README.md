# Loading surfaces

- `welcome.html` displays the company logo and greeting once per local app profile.
  `app-settings.json` stores `startupWelcomeSeen`; this flag is local to the device.
  The five-second timer starts after the surface loads and the main window becomes
  visible, including when the app initially starts hidden in the tray.
- `page.html` covers native tab content only while that tab is actually loading.
  Cached tabs show immediately. A short reveal delay avoids flashing a spinner
  on fast navigation. Load completion/failure removes the overlay.
- `surfaces.js` owns timers, view stacking, resizing and cleanup. These surfaces
  use sandboxed WebContentsViews so they can cover other native tab views.

Angular navigation uses `shared/view-loader` and request IDs in `aqm:bridge:v1`.
The bridge waits for asynchronous feature renderers and a paint before confirming
navigation. Older navigation replies without request IDs remain compatible.
Browser-only welcome behavior uses `StartupWelcomeService` and localStorage;
Electron uses the native welcome surface to avoid showing two introductions.

No fake navigation percentages or fixed waiting time are used for page loading.
