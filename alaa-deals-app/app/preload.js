// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// طبقة بتعمل نفس شغل واجهات كروم (chrome.*) جوه البرنامج — عشان محرك الإضافة يشتغل زي ما هو
const { ipcRenderer, webFrame } = require("electron");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const arg = (n) => { const a = process.argv.find((x) => x.startsWith(`--alaa-${n}=`)); return a ? a.slice(n.length + 8) : ""; };
const ROLE = arg("role");            // bg | dash | page | shell | pop
const ENGINE = arg("engine");        // فولدر ملفات المحرك
const APPDIR = arg("appdir");
const runFile = (f) => vm.runInThisContext(fs.readFileSync(path.join(ENGINE, f), "utf8"), { filename: path.join(ENGINE, f) });

const L = { changed: [], message: [], alarm: [], installed: [], startup: [], notifClick: [], command: [], action: [] };
const ev = (list) => ({ addListener: (f) => { list.push(f); if (list === L.message) ipcRenderer.send("rt:listening", list.length); }, removeListener: (f) => { const i = list.indexOf(f); if (i >= 0) list.splice(i, 1); }, hasListener: (f) => list.includes(f) });
const fire = (list, ...a) => { for (const f of [...list]) { try { f(...a); } catch (e) { console.error(e); } } };

ipcRenderer.on("kv:changed", (_, ch) => fire(L.changed, ch, "local"));
ipcRenderer.on("alarm:fire", (_, a) => fire(L.alarm, a));
ipcRenderer.on("notif:click", (_, id) => fire(L.notifClick, id));
ipcRenderer.on("cmd", (_, c) => fire(L.command, c));
ipcRenderer.on("rt:deliver", (_, { id, msg, sender }) => {
  let done = false, wait = false;
  const sendResponse = (resp) => { if (done) return; done = true; ipcRenderer.send("rt:reply", { id, resp }); };
  for (const f of [...L.message]) {
    try { const r = f(msg, sender, sendResponse); if (r === true) wait = true; } catch (e) { console.error(e); }
  }
  if (!done && !wait) ipcRenderer.send("rt:reply", { id, none: true, count: L.message.length });
});

const inv = (ch, ...a) => ipcRenderer.invoke(ch, ...a);
const cb = (p, f) => { if (typeof f === "function") p.then((r) => f(r), () => f()); return p; };

const chromeShim = {
  storage: {
    local: {
      get: (k, f) => cb(inv("kv:get", k === undefined ? null : k), f),
      set: (o, f) => cb(inv("kv:set", o), f),
      remove: (k, f) => cb(inv("kv:remove", k), f),
      clear: (f) => cb(inv("kv:clear"), f),
      getBytesInUse: (k, f) => cb(inv("kv:bytes", k === undefined ? null : k), f),
      vers: (keys) => inv("kv:vers", keys),
      delta: (key, since) => inv("kv:delta", key, since),
    },
    onChanged: ev(L.changed),
  },
  runtime: {
    id: "alaa-deals",
    getURL: (p) => require("url").pathToFileURL(path.join(ENGINE, p)).href,
    sendMessage: (msg, f) => cb(inv("rt:send", msg), f),
    onMessage: ev(L.message),
    onInstalled: ev(L.installed),
    onStartup: ev(L.startup),
    getManifest: () => ({ version: arg("version"), name: "Aqar Matrix" }),
    lastError: undefined,
  },
  tabs: {
    create: (o, f) => cb(inv("tabs:create", o), f),
    update: (id, o, f) => cb(inv("tabs:update", id, o), f),
    remove: (id, f) => cb(inv("tabs:remove", id), f),
    reload: (id, f) => cb(inv("tabs:reload", id), f),
    get: (id, f) => cb(inv("tabs:get", id), f),
    query: (q, f) => cb(inv("tabs:query", q), f),
    sendMessage: (id, msg, f) => cb(inv("tabs:send", id, msg), f),
  },
  alarms: {
    create: (name, info) => { if (typeof name === "object") { info = name; name = ""; } return inv("alarms:create", name, info); },
    get: (n, f) => cb(inv("alarms:get", n), f),
    getAll: (f) => cb(inv("alarms:getAll"), f),
    clear: (n, f) => cb(inv("alarms:clear", n), f),
    clearAll: (f) => cb(inv("alarms:clearAll"), f),
    onAlarm: ev(L.alarm),
  },
  notifications: {
    create: (id, o, f) => { if (typeof id === "object") { o = id; id = "n" + Date.now(); } return cb(inv("notif:create", id, o).then(() => id), f); },
    clear: (id, f) => cb(Promise.resolve(true), f),
    onClicked: ev(L.notifClick),
  },
  downloads: { download: (o, f) => cb(inv("dl:download", o), f) },
  commands: { onCommand: ev(L.command) },
  action: { onClicked: ev(L.action) },
};

function expose(name, val) {
  try { globalThis[name] = val; } catch {}
  if (globalThis[name] !== val) Object.defineProperty(globalThis, name, { value: val, configurable: true, writable: true });
}
expose("chrome", chromeShim);

// واجهة البرنامج نفسه (للشريط اللي فوق وصفحة البداية)
const appApi = {
  call: (name, ...a) => inv("app:" + name, ...a),
  on: (ch, f) => ipcRenderer.on("app:" + ch, (_, ...a) => f(...a)),
  send: (ch, ...a) => ipcRenderer.send("app:" + ch, ...a),
};

if (ROLE === "bg") {
  // ملف الخلفية بيستخدم importScripts — نعملها بنفس الطريقة
  expose("importScripts", (...files) => files.forEach(runFile));
  window.addEventListener("DOMContentLoaded", async () => {
    try { runFile("background.js"); } catch (e) { console.error("background.js", e); }
    const boot = await inv("rt:boot");
    if (boot.installed) fire(L.installed, { reason: boot.firstRun ? "install" : "update" });
    else fire(L.startup);
    ipcRenderer.send("bg:ready");
  });
}

if (ROLE === "shell" || ROLE === "dash" || ROLE === "bg" || ROLE === "pop") expose("alaaApp", appApi);

if (ROLE === "page") {
  // زي content_scripts في المانيفست
  const CS = [
    { re: /^https:\/\/web\.whatsapp\.com\//, js: ["classify.js", "content.js", "wasend.js", "wabtnc.js", "wasender.js"], main: ["wabtn-cfg.js", "vendor/wppconnect-wa.js", "wabtn.js"] },
    { re: /^https:\/\/(www|web)\.facebook\.com\//, js: ["classify.js", "match.js", "fb.js", "poster.js"] },
    { re: /^https:\/\/www\.instagram\.com\//, js: ["classify.js", "ig.js"] },
  ];
  // سكربتاتنا مش بتتأثر بقيود الصفحة (زي إضافات كروم)
  try { webFrame.setIsolatedWorldInfo && webFrame.setIsolatedWorldInfo(999, { securityOrigin: location.origin, csp: "script-src 'self' 'unsafe-eval' 'unsafe-inline'", name: "Aqar Matrix" }); } catch {}
  // 🔘 جسر الأزرار الحقيقية: wa-js + wabtn.js لازم يشتغلوا جوه عالم الصفحة نفسه (MAIN world) — زي "world":"MAIN" في مانيفست الإضافة. بيتحقنوا فورًا (قبل سكربتات واتساب)
  try {
    const hit = CS.find((cs) => cs.main && cs.re.test(location.href));
    if (hit) for (const f of hit.main) { try { webFrame.executeJavaScript(fs.readFileSync(path.join(ENGINE, f), "utf8"), false); } catch (e) { console.error("main-world script", f, e); } }
  } catch (e) { console.error("main-world inject", e); }
  let ran = false;
  const run = () => {
    if (ran) return; ran = true;
    const href = location.href;
    for (const cs of CS) if (cs.re.test(href)) {
      for (const f of cs.js) { try { runFile(f); } catch (e) { console.error("content script", f, e); } }
      ipcRenderer.send("page:scripts", cs.js[1]);
      break;
    }
  };
  window.addEventListener("DOMContentLoaded", () => setTimeout(run, 50));
}
