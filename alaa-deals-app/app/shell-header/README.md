# Application tab bar

`header.css` scopes the compact application toolbar styling without removing
tab buttons, platform status, dropdown menus, shortcuts or browser navigation.
The application bar is 44 CSS pixels; the optional browser row remains 40.
`TOP_APP` and `TOP` in main.js match those heights and follow the existing zoom.

On workspace/home tabs, the small app mark stays while the repeated company
text is hidden. The workspace sidebar supplies the full brand and the Angular
header supplies the current page title. Native window controls stay integrated
through `window-chrome/`.
