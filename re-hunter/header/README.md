# Workspace header

- `view.js` groups the existing `tb-row` controls before dashboard handlers bind. It moves the original DOM nodes, retaining IDs and listeners.
- `controller.js` handles the native tools disclosure, outside click and Escape. It does not handle business actions, navigation or saving.
- `header.css` owns the header layout and overrides older theme spacing locally.

The main row keeps the brand, working area, day/night switch and save action visible. Tools contains the date, automatic update status, property categories, workspace actions and appearance controls. On small screens the area moves to a second row.
