# Integrated window controls

Windows uses Electron's native Window Controls Overlay in the compact 44px
application toolbar. The OS title bar is hidden; minimize, maximize/restore,
Snap Layouts and close stay native. Other platforms retain their standard frame.

`main.js` owns BrowserWindow options and validated overlay colors. `chrome.js`
reads the toolbar's resolved theme colors, and sends changes only from the shell
renderer. `chrome.css` reserves the native caption area using Electron's titlebar
environment variables and defines drag/no-drag areas without intercepting tabs
or buttons. Overlay height follows the existing UI scale in the main process.

Reference: https://www.electronjs.org/docs/latest/tutorial/custom-title-bar
