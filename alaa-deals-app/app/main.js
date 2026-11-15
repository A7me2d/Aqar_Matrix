// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// ===== Aqar Matrix (اسمه القديم Alaa Deals) — منصة العقارات (برنامج ويندوز) =====
const { app, BrowserWindow, WebContentsView, ipcMain, session, Notification, Tray, Menu, shell, dialog, nativeImage, webContents, net, powerSaveBlocker, clipboard } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { pathToFileURL } = require("url");
const { Store, Alarms } = require("./store");
const ctxmenu = require("./ctxmenu"); // قايمة الكليك يمين (قص/نسخ/لصق/تحديد الكل/نسخ الرابط)
const OCR = require("./ocr");
const VOICE = require("./voice"); // فويس أوفر الريلز (أصوات مايكروسوفت) + محوّل الفيديو (ffmpeg)

// أي استثناء مش متمسك ما يطلعش نافذة خطأ تجمّد البرنامج (خصوصاً على سيرفر مفيش حد قدامه) — نسجّله بس
process.on("uncaughtException", (e) => { try { console.error("[uncaught]", (e && e.stack) || e); } catch {} });
process.on("unhandledRejection", (e) => { try { console.error("[unhandled]", (e && e.stack) || e); } catch {} });
// 🔋 10.80.51: الأتمتة (سحب/نشر/واتساب) شغّالة في الخلفية — كروميوم بيعلّق ويبطّأ الصفحات المخفية/المغطّاة/المصغّرة (خصوصًا على ويندوز) فكان الشغل بيقف أو يتأخر لما النافذة تتقفل جنب الساعة أو الشاشة تتقفل على الـVPS.
// دي علامات رسمية بتمنع ده من غير ما تزوّد حمل على الشاشة (أولوية المعالجة اتظبطت تحت).
try {
  for (const f of ["disable-renderer-backgrounding", "disable-background-timer-throttling", "disable-backgrounding-occluded-windows"]) app.commandLine.appendSwitch(f);
  app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion,IntensiveWakeUpThrottling");
} catch {}
const VERSION = app.getVersion();
const releaseUpdates = require('./release-updates')({version:VERSION,fetch:(...args)=>net.fetch(...args)});
const APPDIR = __dirname;
const ENGINE = path.join(APPDIR, "engine");
// 📇 دليل الموظفين (المصدر المرخّص لأرقام التواصل) — ممكن يتغيّر لـlocalhost/self-hosted في الاختبارات
const EMPLOYEE_PHONE_URL = String(process.env.EMPLOYEE_PHONE_URL || "https://lap.wzila.com/alaa-data.php");
const ICON = path.join(APPDIR, "icon.png");
const AUMID = "com.alaa.deals";
// أيقونة النافذة على ويندوز: ملف ICO القياسي (BMP للأحجام الصغيرة + PNG لـ256) — مش PNG. ده اللي بيمنع «الورقة البيضا» في شريط المهام
const ICO_PATH = (() => { try { return [path.join(process.resourcesPath || "", "icon.ico"), path.join(APPDIR, "..", "build", "icon.ico")].find((x) => fs.existsSync(x)) || ""; } catch { return ""; } })();
const WIN_ICON = (() => { try { if (process.platform === "win32" && ICO_PATH) { const i = nativeImage.createFromPath(ICO_PATH); if (!i.isEmpty()) return i; } } catch {} return ICON; })();
const TOP = 96; // ارتفاع الشريط اللي فوق (للمواقع)
const TOP_APP = 56; // لوحة التحكم وصفحة البداية: من غير شريط العنوان
// 🔠 حجم الكلام (من لوحة التحكم) — بيكبّر شريط البرنامج وصفحة البداية بنفس النسبة
let SCALE = 1.1;
const sc = (n) => Math.round(n * SCALE);
const topOf = (t) => (t && (t.kind === "dash" || t.kind === "home") ? sc(TOP_APP) : sc(TOP));
function applyScale(s) {
  s = Math.max(0.9, Math.min(1.4, +s || 1.1)); SCALE = s;
  if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.setZoomFactor(s);
  popClose();
  for (const t of tabs.values()) if ((t.kind === "home" || t.kind === "dash") && !t.view.webContents.isDestroyed()) t.view.webContents.setZoomFactor(s);
  layout();
}
const START_HIDDEN = process.argv.includes("--hidden");
const TEST = process.env.ALAA_TEST === "1";

app.setName("Aqar Matrix");
// 🔒 فولدر بيانات المستخدم يفضل «Alaa Deals» زي ما هو — لو الاسم الجديد غيّره، البيانات (الدخول والبوستات والإعدادات) كانت هتختفي
function legacyUserData() {
  try {
    const base = app.getPath("appData");
    for (const n of ["Alaa Deals", "alaa-deals"]) { const d = path.join(base, n); try { if (fs.existsSync(path.join(d, "data")) || fs.existsSync(path.join(d, "app-settings.json"))) return d; } catch {} }
    return path.join(base, "Alaa Deals");
  } catch { return null; }
}
if (!process.env.ALAA_USERDATA) { const ud = legacyUserData(); if (ud) app.setPath("userData", ud); }
if (process.platform === "win32") app.setAppUserModelId(AUMID);
if (process.env.ALAA_USERDATA) app.setPath("userData", process.env.ALAA_USERDATA);
if (process.env.ALAA_DOWNLOADS) app.setPath("downloads", process.env.ALAA_DOWNLOADS); // للاختبارات: فولدر تحميلات مستقل لكل نسخة
if (!TEST && !app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }

// المتصفح جوه البرنامج بيعرّف نفسه إنه كروم عادي على ويندوز (واتساب ويب بيرفض غير كده)
const CHROME_MAJOR = process.versions.chrome.split(".")[0];
const UA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME_MAJOR}.0.0.0 Safari/537.36`;
app.userAgentFallback = UA;

let store, alarms, ses, mainWin, bgWin, tray, remoteSrv, workspaceSrv;
let workspaceBase = '', workspaceCode = '';
// ===== 🔄 التحديث التلقائي (من GitHub Releases) =====
let autoUpdater = null;
try { ({ autoUpdater } = require("electron-updater")); } catch {}
const IS_PORTABLE = !!process.env.PORTABLE_EXECUTABLE_DIR;
let updState = { state: "idle", msg: "" };
function setUpd(state, msg, extra = {}) {
  updState = { state, msg, at: Date.now(), ...extra, repo: appSettings.updateRepo || "", version: VERSION };
  for (const wc of allWC()) { try { wc.send("app:update", updState); } catch {} }
}
function setupUpdates() {
  if (!autoUpdater || TEST) return;
  if (!app.isPackaged) return setUpd("off", "التحديث التلقائي بيشتغل في النسخة المثبّتة بس");
  if (IS_PORTABLE) return setUpd("off", "النسخة المحمولة مش بتتحدث لوحدها — استخدم برنامج التثبيت");
  const repo = (appSettings.updateRepo || "").trim();
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return setUpd("off", "حط اسم مستودع GitHub (owner/repo) عشان التحديث التلقائي يشتغل");
  const [owner, name] = repo.split("/");
  autoUpdater.setFeedURL({ provider: "github", owner, repo: name });
  autoUpdater.autoDownload = false; // Downloads start only when the user requests one.
  autoUpdater.autoInstallOnAppQuit = false;
  if (!setupUpdates.wired) {
    setupUpdates.wired = true;
    autoUpdater.on("checking-for-update", () => setUpd("checking", "بيدوّر على تحديث..."));
    autoUpdater.on("update-available", (i) => setUpd("available", `يوجد تحديث ${i.version} جاهز للتنزيل`, { latestVersion: i.version }));
    autoUpdater.on("update-not-available", () => setUpd("latest", `معاك آخر نسخة (${VERSION})`));
    autoUpdater.on("download-progress", (p) => setUpd("downloading", `بينزّل التحديث ${Math.round(p.percent || 0)}%`));
    autoUpdater.on("update-downloaded", (i) => {
      setUpd("ready", `النسخة ${i.version} جاهزة — دوس «ثبّت دلوقتي» لتطبيق التحديث`, { latestVersion: i.version });
      if (Notification.isSupported()) new Notification({ title: "🔄 تحديث Aqar Matrix جاهز", body: `النسخة ${i.version} نزلت وجاهزة للتثبيت.`, icon: ICON }).show();
    });
    autoUpdater.on("error", (e) => setUpd("error", "ما قدرش يدوّر على تحديث: " + String((e && e.message) || e).slice(0, 140)));
  }
}
const checkUpdates = () => { if (autoUpdater && updState.state !== "off" && app.isPackaged && !IS_PORTABLE && appSettings.updateRepo) autoUpdater.checkForUpdates().catch(() => {}); };
let quitting = false;
// 🐢 شغل الخلفية (المحرك + تابات السحب/النشر/الواتساب التلقائية) بأولوية معالجة أقل من الشاشة اللي قدامك ← مفيش تقطيع، ومفيش وقوف (بنفس السرعة لما الجهاز فاضي)
const PRIO = { low: os.constants.priority.PRIORITY_BELOW_NORMAL, normal: os.constants.priority.PRIORITY_NORMAL };
function setPrio(wc, level) {
  try {
    if (!wc || wc.isDestroyed()) return;
    const pid = wc.getOSProcessId(); if (!(pid > 0)) return;
    if (level === "low") for (const t of tabs.values()) { // البروسيس ده بيخدم تاب إنت بتستخدمه (فيسبوك/واتساب/لوحة التحكم)؟ ما نبطّأوش
      if (t.auto) continue; const w = t.view.webContents; if (w !== wc && !w.isDestroyed() && w.getOSProcessId() === pid) return;
    }
    os.setPriority(pid, PRIO[level] || PRIO.normal);
  } catch {}
}
let settingsPath, appSettings = {};
const tabs = new Map(); // id → tab
let activeId = 1, nextId = 10;
const listening = new Map(); // webContents.id → عدد مستقبلي الرسايل
const DASH_FILE = path.join(ENGINE, "dashboard.html");
const HAS_ANGULAR = fs.existsSync(path.join(ENGINE,'angular','index.html'));
const HOME_FILE = path.join(APPDIR, "home.html");
const PERM = {
  home: { id: 5, title: "🏠 البداية", file: HOME_FILE, role: "dash" },
  dash: { id: 1, title: "📊 لوحة التحكم", file: DASH_FILE, role: "dash" },
  fb: { id: 2, title: "📘 فيسبوك", url: "https://www.facebook.com/", role: "page" },
  wa: { id: 3, title: "🟢 واتساب", url: "https://web.whatsapp.com/", role: "page" },
  ig: { id: 4, title: "📸 إنستجرام", url: "https://www.instagram.com/", role: "page" },
};
const ORDER = ["home", "dash", "fb", "wa", "ig"];

function loadSettings() {
  settingsPath = path.join(app.getPath("userData"), "app-settings.json");
  const rd = (f) => { const o = JSON.parse(fs.readFileSync(f, "utf8")); if (!o || typeof o !== "object" || Array.isArray(o)) throw new Error("bad"); return o; };
  try { appSettings = rd(settingsPath); }
  catch (e) { try { appSettings = rd(settingsPath + ".bak"); console.warn("[settings] رجعنا من النسخة الاحتياطية"); } catch { appSettings = {}; } } // ملف اتقطع؟ ما نصفّرش الأجهزة والكود
  appSettings = { closeToTray: true, openAtLogin: true, ...appSettings };
}
const saveSettings = () => { // كتابة ذرّية (ملف مؤقت ثم rename) + نسخة .bak — القطع في النص ما يضيّعش الإعدادات
  try {
    const tmp = settingsPath + ".tmp", txt = JSON.stringify(appSettings, null, 1);
    fs.writeFileSync(tmp, txt);
    try { if (fs.existsSync(settingsPath)) fs.copyFileSync(settingsPath, settingsPath + ".bak"); } catch {}
    fs.renameSync(tmp, settingsPath);
  } catch (e) { try { fs.writeFileSync(settingsPath, JSON.stringify(appSettings, null, 1)); } catch {} }
};
function applyLogin() {
  if (process.platform !== "win32" || TEST) return;
  // النسخة المحمولة بتتفك في فولدر مؤقت: التشغيل التلقائي لازم يشاور على الملف الأصلي (PORTABLE_EXECUTABLE_FILE) مش المؤقت
  const o = { openAtLogin: !!appSettings.openAtLogin, args: ["--hidden"] };
  if (process.env.PORTABLE_EXECUTABLE_FILE) o.path = process.env.PORTABLE_EXECUTABLE_FILE;
  app.setLoginItemSettings(o);
}

// إطار أدوات المساعد المعزول؟ (إطار فرعي صفحته sandbox.html)
const SBX_RX = /\/sandbox\.html(?:[?#]|$)/i;
function isSandboxFrame(fr) { try { return !!fr && !!fr.parent && SBX_RX.test(String(fr.url || "")); } catch { return false; } }
// ================= الجلسة: تسجيل الدخول بيتحفظ على الجهاز =================
function setupSession() {
  ses = session.fromPartition(process.env.ALAA_PARTITION || "persist:alaa");
  ses.setUserAgent(UA);
  const brands = `"Chromium";v="${CHROME_MAJOR}", "Google Chrome";v="${CHROME_MAJOR}", "Not?A_Brand";v="99"`;
  ses.webRequest.onBeforeSendHeaders((d, cb) => {
    const h = d.requestHeaders;
    for (const k of Object.keys(h)) if (k.toLowerCase() === "sec-ch-ua") h[k] = brands;
    cb({ requestHeaders: h });
  });
  // نشيل قيود Trusted Types بس (عشان لوحاتنا جوه الصفحة تشتغل) — باقي حماية الصفحة زي ما هي
  ses.webRequest.onHeadersReceived({ urls: ["https://*.facebook.com/*", "https://*.instagram.com/*", "https://web.whatsapp.com/*"] }, (d, cb) => {
    const h = d.responseHeaders || {};
    for (const k of Object.keys(h)) {
      const lk = k.toLowerCase();
      if (lk === "content-security-policy" || lk === "content-security-policy-report-only") {
        h[k] = h[k].map((v) => v.split(";").filter((p) => !/^\s*(require-trusted-types-for|trusted-types)\b/i.test(p)).join(";"));
      }
    }
    cb({ responseHeaders: h });
  });
  // 🧩 أدوات المساعد بتشتغل في إطار معزول (sandbox.html) من غير نت — وده خط دفاع تاني: أي طلب شبكة طالع من إطار الصندوق بيتلغي (http/https/ws/ftp)
  try {
    ses.webRequest.onBeforeRequest({ urls: ["http://*/*", "https://*/*", "ws://*/*", "wss://*/*", "ftp://*/*"] }, (d, cb) => {
      let block = false; try { block = isSandboxFrame(d.frame); } catch {}
      if (block) global.__sbxBlocked = (global.__sbxBlocked || 0) + 1;
      cb({ cancel: block });
    });
  } catch (e) { console.warn("sandbox net guard:", e && e.message); }
  const PERM_HOST = /(^|\.)(facebook\.com|fb\.com|messenger\.com|fbcdn\.net|whatsapp\.com|whatsapp\.net|instagram\.com|cdninstagram\.com)$/i;
  const permOk = (u) => { try { const x = new URL(String(u || "")); return x.protocol === "file:" || (x.protocol === "https:" && PERM_HOST.test(x.hostname)); } catch { return false; } };
  // الصلاحيات (كاميرا/مايك/كليبورد/إشعارات) لمواقع المنصات وملفات البرنامج بس — أي موقع تاني يتفتح جوه تاب ما ياخدش حاجة
  ses.setPermissionRequestHandler((wc, perm, cb, details) => cb(["notifications", "clipboard-sanitized-write", "clipboard-read", "media", "fullscreen"].includes(perm) && permOk((details && details.requestingUrl) || (wc && !wc.isDestroyed() && wc.getURL()))));
  // أي تحميل من جوه البرنامج (CSV، صور البوست، النسخ الاحتياطية) يروح لفولدر التحميلات/AlaaDealsExt
  ses.on("will-download", (e, item) => {
    const dir = path.join(app.getPath("downloads"), "AlaaDealsExt", "exports");
    fs.mkdirSync(dir, { recursive: true });
    const name = item.getFilename() || "download";
    let p = path.join(dir, name), i = 1;
    while (fs.existsSync(p)) { const ext = path.extname(name); p = path.join(dir, `${path.basename(name, ext)} (${i++})${ext}`); }
    item.setSavePath(p);
    item.once("done", (ev, st) => { if (st === "completed") toShell("toast", `✅ اتحفظ: ${path.basename(p)} — في التحميلات/AlaaDealsExt/exports`, p); });
  });
}

// ================= بث التغييرات =================
const BIG = new Set(["posts", "comments", "snapshots", "listings", "leadMeta", "followupSent", "learn", "ads", "adPosts", "seenPosts", "seenComments", "archives", "adWatchLog", "pubImgs", "waImgs"]);
function allWC() {
  const out = [];
  if (bgWin && !bgWin.isDestroyed()) out.push(bgWin.webContents);
  if (mainWin && !mainWin.isDestroyed()) out.push(mainWin.webContents);
  for (const t of tabs.values()) if (t.view && !t.view.webContents.isDestroyed()) out.push(t.view.webContents);
  return out;
}
const { ChangeLog, isMap: isMapKey, pickEntries } = require("./delta.js");
const chlog = new ChangeLog(); // 🔁 سجل التغييرات (للمزامنة الكاملة بالفروق)
let xf = null; // 📁 مزامنة ملفات الحفظ (أرشيف/نسخ كاملة/ملفات الأيام) بين الأجهزة (xfiles.js)
let peerSync = null; // 🕸 مدير شبكة الأجهزة (mesh.js) — موجود دايمًا، حتى لو مفيش أجهزة مربوطة (بيختم الإعدادات ويخدم الأجهزة اللي بتدخل علينا)
function broadcast(changes) {
  if (!Object.keys(changes).length) return;
  try { for (const k of Object.keys(changes)) { const v = store.get(k)[k]; if (v === undefined) chlog.forget(k); else chlog.record(k, v, (store.ver && store.ver.get(k)) || 0); } } catch (e) { console.error("chlog", e); }
  if (peerSync) { try { peerSync.onLocal(changes); } catch {} }
  const light = {};
  for (const [k, v] of Object.entries(changes)) light[k] = BIG.has(k) || /^(waVD|pubVD):/.test(k) ? { big: true } : v; // 🎬 مفاتيح الفيديو (waVD:/pubVD:) كبيرة — مبنبثّش قيمتها
  for (const wc of allWC()) { try { wc.send("kv:changed", light); } catch {} }
  if (remoteSrv) { try { remoteSrv.changed(light); } catch {} } // الأجهزة التانية المفتوحة على السيرفر
  if (workspaceSrv) { try { workspaceSrv.changed(light); } catch {} }
}
const toShell = (ch, ...a) => { if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send("app:" + ch, ...a); };

// ================= الرسايل بين الأجزاء (زي chrome.runtime) =================
let msgSeq = 0;
const pending = new Map();
function deliver(targets, msg, sender) {
  targets = targets.filter((wc) => wc && !wc.isDestroyed());
  if (!targets.length) return Promise.reject(new Error("Could not establish connection. Receiving end does not exist."));
  return new Promise((resolve, reject) => {
    const id = ++msgSeq;
    const p = { left: targets.length, listeners: 0, resolve, reject, timer: setTimeout(() => { pending.delete(id); resolve(undefined); }, 15 * 6e4) };
    pending.set(id, p);
    for (const wc of targets) wc.send("rt:deliver", { id, msg, sender });
  });
}
ipcMain.on("rt:reply", (e, r) => {
  const p = pending.get(r.id); if (!p) return;
  if (!r.none) { clearTimeout(p.timer); pending.delete(r.id); return p.resolve(r.resp); }
  p.left--; p.listeners += r.count || 0;
  if (p.left <= 0) {
    clearTimeout(p.timer); pending.delete(r.id);
    if (!p.listeners) p.reject(new Error("Could not establish connection. Receiving end does not exist."));
    else p.resolve(undefined);
  }
});
ipcMain.on("rt:listening", (e, n) => listening.set(e.sender.id, n));
const tabOf = (wc) => [...tabs.values()].find((t) => t.view && t.view.webContents === wc);
const extTargets = () => [bgWin && bgWin.webContents, tabs.get(PERM.dash.id) && tabs.get(PERM.dash.id).view.webContents, tabs.get(PERM.home.id) && tabs.get(PERM.home.id).view.webContents];
const toBg = (msg) => deliver([bgWin && bgWin.webContents], msg, { id: "alaa-deals" });

function setupIpc() {
  ipcMain.handle("kv:get", (e, k) => store.get(k));
  // ⚡ إصدارات المفاتيح + «إيه اللي اتغيّر من إصدار كذا» — اللوحة بتستخدمهم عشان تعرض الجديد فورًا من غير ما تقرا الداتا كلها
  ipcMain.handle("kv:vers", (e, keys) => { const o = {}; for (const k of keys || []) o[k] = (store.ver && store.ver.get(k)) || 0; return o; });
  ipcMain.handle("kv:delta", (e, key, since) => {
    const ver = (store.ver && store.ver.get(key)) || 0, v = store.get(key)[key];
    if (since === ver) return { ver, entries: {}, removed: [] };
    if (!since || !isMapKey(key, v) || chlog.ver.get(key) !== ver) return { ver, full: true }; // التغيير ما اتسجلش في السجل؟ نبعت الكل (أمان)
    const d = chlog.since(key, since);
    if (d.full) return { ver, full: true };
    return { ver, entries: pickEntries(v, d.ids), removed: d.removed };
  });
  ipcMain.handle("kv:set", (e, o) => { broadcast(store.set(o)); if (o && o.uiScale != null) applyScale(o.uiScale); });
  ipcMain.handle("kv:remove", (e, k) => { broadcast(store.remove(k)); });
  ipcMain.handle("kv:clear", () => { broadcast(store.clear()); });
  ipcMain.handle("kv:bytes", (e, k) => store.bytes(k));

  ipcMain.handle("rt:send", (e, msg) => {
    const t = tabOf(e.sender);
    const sender = { id: "alaa-deals", url: e.sender.getURL(), tab: t ? { id: t.id, url: e.sender.getURL() } : undefined };
    return deliver(extTargets().filter((wc) => wc && wc !== e.sender), msg, sender).catch(() => undefined);
  });
  ipcMain.handle("rt:boot", () => {
    const first = !appSettings.lastVersion;
    const installed = appSettings.lastVersion !== VERSION;
    appSettings.lastVersion = VERSION; saveSettings();
    return { installed, firstRun: first };
  });
  ipcMain.on("bg:ready", () => { bgReady = true; });
  ipcMain.on("page:scripts", (e, which) => { const t = tabOf(e.sender); if (t) t.engine = which; });

  // tabs
  ipcMain.handle("tabs:create", (e, o = {}) => openUrl(o.url || "about:blank", { active: o.active !== false, auto: o.active === false }));
  ipcMain.handle("tabs:update", (e, id, o = {}) => {
    const t = tabs.get(id); if (!t) throw new Error("No tab with id: " + id);
    if (o.url) t.view.webContents.loadURL(o.url).catch(() => {});
    if (o.active && !t.auto) activate(id); // 🕶 تابات الأتمتة (سحب/نشر/واتساب) عمرها ما بتتفعّل ولا بتظهر قدامك — بتشتغل في الخلفية بس
    return info(t);
  });
  ipcMain.handle("tabs:remove", (e, id) => { closeTab(id); });
  ipcMain.handle("tabs:reload", (e, id) => { const t = tabs.get(id); if (t) t.view.webContents.reload(); });
  ipcMain.handle("tabs:get", (e, id) => { const t = tabs.get(id); if (!t) throw new Error("No tab with id: " + id); return info(t); });
  ipcMain.handle("tabs:query", (e, q = {}) => {
    let list = [...tabs.values()];
    if (q.url) {
      const pats = (Array.isArray(q.url) ? q.url : [q.url]).map((p) => new RegExp("^" + p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"));
      list = list.filter((t) => pats.some((r) => r.test(t.view.webContents.getURL())));
    }
    if (q.active) list = list.filter((t) => t.id === activeId);
    return list.map(info);
  });
  ipcMain.handle("tabs:send", (e, id, msg) => {
    const t = tabs.get(id); if (!t) throw new Error("No tab with id: " + id);
    return deliver([t.view.webContents], msg, { id: "alaa-deals" });
  });

  // alarms
  ipcMain.handle("alarms:create", (e, n, i) => { alarms.create(n, i); });
  ipcMain.handle("alarms:get", (e, n) => alarms.get(n));
  ipcMain.handle("alarms:getAll", () => alarms.getAll());
  ipcMain.handle("alarms:clear", (e, n) => alarms.clear(n));
  ipcMain.handle("alarms:clearAll", () => alarms.clearAll());

  // notifications
  ipcMain.handle("notif:create", (e, id, o = {}) => {
    lastNotif = { id, title: o.title, message: o.message, at: Date.now() };
    if (remoteSrv) { try { remoteSrv.notify(lastNotif); } catch {} } // 🔔 يوصل لكل الأجهزة المربوطة
    if (workspaceSrv) { try { workspaceSrv.notify(lastNotif); } catch {} }
    if (!Notification.isSupported()) return;
    const n = new Notification({ title: o.title || "Aqar Matrix", body: o.message || "", icon: ICON });
    n.on("click", () => { showMain(); if (bgWin) bgWin.webContents.send("notif:click", id); });
    n.show();
  });

  // downloads (ملفات النسخ الاحتياطية بتاعة المحرك)
  ipcMain.handle("dl:download", (e, o = {}) => {
    const base = app.getPath("downloads");
    let full = path.normalize(path.join(base, o.filename || "download"));
    if (full !== base && !full.startsWith(base.replace(/[\\/]+$/, "") + path.sep)) throw new Error("bad path");
    fs.mkdirSync(path.dirname(full), { recursive: true });
    let buf;
    const u = String(o.url || "");
    if (u.startsWith("data:")) {
      const i = u.indexOf(",");
      const head = u.slice(5, i), body = u.slice(i + 1);
      buf = /;base64/i.test(head) ? Buffer.from(body, "base64") : Buffer.from(decodeURIComponent(body), "utf8");
    } else throw new Error("unsupported url");
    if (o.conflictAction !== "overwrite") { let n = 1; const ext = path.extname(full), b = full.slice(0, -ext.length || undefined); while (fs.existsSync(full)) full = `${b} (${n++})${ext}`; }
    const tmp = full + ".part"; fs.writeFileSync(tmp, buf); fs.renameSync(tmp, full);
    if (xf && /[\\/](archive|backups|daily)[\\/][^\\/]+\.json$/.test(full)) { clearTimeout(xf._t); xf._t = setTimeout(() => xf.sync().catch(() => {}), 5000); } // 📁 ملف جديد اتحفظ ← يتبعت للأجهزة التانية
    return Date.now();
  });

  // ===== واجهة البرنامج =====
  ipcMain.handle("app:tabs", () => tabList());
  ipcMain.handle("app:activate", (e, id) => { activate(id); });
  ipcMain.handle("app:openPerm", (e, kind) => { activate(ensurePerm(kind).id); });
  ipcMain.handle("app:openDash", async (e, hash) => {
    const t = ensurePerm('dash'); activate(t.id);
    const frame = await dashboardEngine();
    return frame.executeJavaScript(`location.hash=${JSON.stringify(hash || '')};window.dispatchEvent(new HashChangeEvent('hashchange'))`).catch(() => {});
  });
  ipcMain.handle("app:close", (e, id) => closeTab(id));
  // 📞 تليجرام: من البرنامج نفسه (من غير قيود المتصفح) — لـ api.telegram.org بس
  ipcMain.handle("app:tg", async (e, method, { token, data } = {}) => {
    if (!/^[A-Za-z]{3,40}$/.test(method) || !/^\d+:[\w-]{20,}$/.test(String(token || ""))) return { ok: false, description: "التوكن شكله غلط" };
    try {
      const r = await ses.fetch(`https://api.telegram.org/bot${token}/${method}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data || {}) });
      return await r.json();
    } catch (err) { return { ok: false, description: "مفيش اتصال بتليجرام: " + (err.message || err) }; }
  });
  // 📨 واتساب الرسمي (Cloud API): النداء لـgraph.facebook.com بيعدّي من هنا (من غير قيود CORS) — لينكات ميتا بس (والمحلي في الاختبارات)
  // 📇 دليل الموظفين: نفس مصدر التوحيد (الرقم المنشور في البوست أو الدليل المرخّص) — من غير قيود المتصفح
  ipcMain.handle("app:employeePhone", async (e, o = {}) => {
    const id = String(o.id || "");
    if (!/^\d{5,25}$/.test(id)) return { error: "آيدي غير صالح" };
    try {
      const r = await net.fetch(EMPLOYEE_PHONE_URL + "?id=" + encodeURIComponent(id), { signal: AbortSignal.timeout(12000), credentials: "omit", redirect: "error", cache: "no-store" });
      if (!r.ok) return { error: "HTTP " + r.status };
      return { text: (await r.text()).slice(0, 16000) };
    } catch { return { error: "تعذر الاتصال" }; }
  });
  ipcMain.handle("app:graph", async (e, o = {}) => {
    const url = String(o.url || ""), ok = /^https:\/\/graph\.facebook\.com\/v\d{1,2}\.\d\/[A-Za-z0-9_\/.?=&,%+:-]{1,400}$/.test(url) || (TEST && /^http:\/\/127\.0\.0\.1:\d{2,5}\/[A-Za-z0-9_\/.?=&,%+:-]{1,400}$/.test(url));
    if (!ok) return { error: "لينك مش مسموح" };
    const method = /^(GET|POST|DELETE)$/.test(o.method) ? o.method : "GET", h = {};
    for (const k of ["Authorization", "Content-Type"]) if (o.headers && o.headers[k]) h[k] = String(o.headers[k]).slice(0, 700);
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 25000);
    try { const r = await ses.fetch(url, { method, headers: h, body: method === "GET" ? undefined : String(o.body || "").slice(0, 200000), signal: ctl.signal }); return { status: r.status, text: (await r.text()).slice(0, 400000) }; }
    catch (err) { return { error: "مفيش اتصال بميتا: " + String((err && err.message) || err).slice(0, 120) }; }
    finally { clearTimeout(to); }
  });
  // 🆔 تحويل يوزر فيسبوك لآيدي رقم (زي findidfb) — بجلسة فيسبوك المسجّل دخولها هنا، من غير أي تابة ظاهرة
  ipcMain.handle("app:fbid", async (e, handle) => {
    try {
      const FB = require(path.join(ENGINE, "fbid-core.js"));
      if (!FB.isHandle(handle)) return { err: "none" };
      let viewer = ""; try { const c = await ses.cookies.get({ url: "https://www.facebook.com", name: "c_user" }); viewer = (c[0] && c[0].value) || ""; } catch {}
      if (!viewer) return { err: "login" }; // مش مسجّل دخول فيسبوك في البرنامج
      return await FB.fetchId(handle, { viewer, fetch: (u, o) => ses.fetch(u, o) });
    } catch (err) { return { err: "net" }; }
  });
  ipcMain.handle("app:resync", () => (peerSync ? peerSync.resync() : false));
  ipcMain.handle("app:peers", (e, action, arg) => peersApi(action, arg));
  ipcMain.handle("app:ocr", (e, url) => OCR.read(String(url || "")));
  ipcMain.handle("app:ocrInfo", () => OCR.info());
  ipcMain.handle("app:tts", (e, o) => VOICE.tts(o || {}, (u, op) => ses.fetch(u, op)));
  ipcMain.handle("app:mux", (e, o) => VOICE.mux(o || {}));
  ipcMain.handle("app:voiceInfo", () => VOICE.info());
  // 🔽 القوايم المنسدلة (المنصات / الصفحات) — نافذة طافية فوق الصفحات
  ipcMain.handle("app:popOpen", (e, o) => popOpen(o || {}));
  ipcMain.handle("app:popClose", (e, refocus) => popClose(!!refocus));
  ipcMain.on("app:popData", (e, d) => { if (popKind && pop && !pop.webContents.isDestroyed()) pop.webContents.send("app:popData", d); });
  ipcMain.on("app:popSize", (e, s) => { if (popKind && pop && e.sender === pop.webContents) popPlace(s || {}); });
  ipcMain.handle("app:popAct", (e, o = {}) => {
    popClose();
    if (o.act === "plat" && PERM[o.kind] && ["fb", "wa", "ig"].includes(o.kind)) {
      if (LINK()) return toShell("toast", "📡 فيسبوك وواتساب شغالين على السيرفر نفسه — تقدر تشوف شاشته من «👁 شوف الشاشة» في لوحة التحكم");
      activate(ensurePerm(o.kind).id);
    }
  });
  ipcMain.handle("app:closeAux", () => { let n = 0; for (const t of [...tabs.values()]) if (t.kind === "aux" && !t.auto) { closeTab(t.id); n++; } return n; });
  ipcMain.handle("app:nav", (e, cmd) => {
    const t = tabs.get(activeId); if (!t) return;
    const wc = t.view.webContents;
    if (cmd === "back" && wc.navigationHistory.canGoBack()) wc.navigationHistory.goBack();
    if (cmd === "forward" && wc.navigationHistory.canGoForward()) wc.navigationHistory.goForward();
    if (cmd === "reload") wc.reload();
    if (cmd === "home") { const p = PERM[t.kind]; if (p && p.url) wc.loadURL(p.url); else if (p && p.file) wc.loadFile(p.file); }
  });
  ipcMain.handle("app:go", (e, url) => { const t = tabs.get(activeId); if (t && /^https:\/\//.test(url)) t.view.webContents.loadURL(url); });
  ipcMain.handle("app:status", () => status());
  ipcMain.handle("app:save", () => (LINK() ? linkRt({ type: "saveAll" }) : toBg({ type: "saveAll" })).catch((err) => ({ ok: false, error: String(err.message || err) })));
  ipcMain.handle("app:runNow", () => { (LINK() ? linkRt({ type: "runAuto" }) : toBg({ type: "runAuto" })).catch(() => {}); return true; });
  ipcMain.handle("app:settings", () => ({ ...appSettings, version: VERSION, dataDir: store.dir, downloads: path.join(app.getPath("downloads"), "AlaaDealsExt") }));
  ipcMain.handle("app:setSetting", (e, k, v) => { if (!["closeToTray", "openAtLogin", "welcomeDone"].includes(k)) return; appSettings[k] = v; saveSettings(); applyLogin(); return appSettings; });
  ipcMain.handle("app:findImport", () => findImport());
  ipcMain.handle("app:link", (e, o) => (o ? ((o.off || o.mode === "remote") ? setLink(o) : peersApi("add", o)) : linkInfo()));
  ipcMain.handle("app:firewall", () => openFirewall(remoteSrv ? remoteSrv.info().port : 8787));
  ipcMain.handle("app:remote", (e, patch) => (remoteSrv ? (patch ? remoteSrv.set(patch) : remoteSrv.info()) : null));
  ipcMain.handle('app:release', async (event, action) => {
    const info = await releaseUpdates.check();
    if (action === 'download' && info.state === 'available' && releaseUpdates.trustedDownload(info.downloadUrl)) {
      // Download to this Electron client's download manager. Never run the installer silently.
      event.sender.downloadURL(info.downloadUrl);
    }
    return info;
  });
  ipcMain.handle("app:update", (e, action, repo) => {
    if (action === "setRepo") {
      const nr = String(repo || "").trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$|\/$/g, "");
      let okGo = true;
      if (!TEST && nr !== (appSettings.updateRepo || "")) { // تغيير مصدر التحديثات = تغيير اللي هيتنزّل ويتشغّل — لازم موافقة صريحة من نافذة البرنامج نفسها
        try { okGo = dialog.showMessageBoxSync(mainWin && !mainWin.isDestroyed() ? mainWin : undefined, { type: "question", buttons: ["تغيير", "إلغاء"], defaultId: 1, cancelId: 1, title: "مصدر التحديثات", message: "هتغيّر مصدر تحديثات البرنامج إلى:\n" + (nr || "(فاضي)") + "\n\nالنسخ الجاية هتتنزّل من هناك وتتشغّل. متأكد؟" }) === 0; } catch { okGo = false; }
      }
      if (okGo) { appSettings.updateRepo = nr; saveSettings(); setupUpdates(); checkUpdates(); }
    }
    if (action === "check") checkUpdates();
    if (action === 'download' && autoUpdater && updState.state === 'available') {
      setUpd('downloading','جاري تنزيل التحديث…');
      autoUpdater.downloadUpdate().catch(() => {});
    }
    if (action === "install" && updState.state === "ready") { quitting = true; setImmediate(() => autoUpdater.quitAndInstall(true, true)); }
    return { ...updState, repo: appSettings.updateRepo || "", version: VERSION, portable: IS_PORTABLE };
  });
  ipcMain.handle("app:import", async (e, file) => {
    if (!file) {
      const r = await dialog.showOpenDialog(mainWin, { title: "اختار ملف داتا الإضافة", defaultPath: (findImport() || {}).path || app.getPath("downloads"), filters: [{ name: "JSON", extensions: ["json"] }], properties: ["openFile"] });
      if (r.canceled || !r.filePaths[0]) return { canceled: true };
      file = r.filePaths[0];
    }
    return importFile(file);
  });
  ipcMain.handle("app:openFolder", (e, which) => shell.openPath(which === "data" ? store.dir : path.join(app.getPath("downloads"), "AlaaDealsExt")));
  ipcMain.handle("app:menu", () => { popClose(); showMenu(); });
  ipcMain.handle("app:logout", (e, site) => logout(site));
}
async function logout(site) {
  const name = { fb: "فيسبوك", ig: "إنستجرام", wa: "واتساب" }[site];
  const r = await dialog.showMessageBox(mainWin, { type: "question", buttons: ["أيوه، اخرج", "لا"], defaultId: 1, cancelId: 1, title: "تسجيل خروج", message: `تسجّل خروج من ${name} جوه البرنامج؟`, detail: "هتحتاج تسجّل دخول تاني عشان السحب يشتغل." });
  if (r.response !== 0) return false;
  const origins = { fb: ["https://www.facebook.com", "https://web.facebook.com", "https://m.facebook.com"], ig: ["https://www.instagram.com"], wa: ["https://web.whatsapp.com"] }[site];
  for (const o of origins) await ses.clearStorageData({ origin: o });
  const t = tabs.get(PERM[site].id); if (t) t.view.webContents.loadURL(PERM[site].url);
  return true;
}
let bgReady = false;
let lastNotif = null;

// ================= التابات =================
function info(t) { return { id: t.id, url: t.view.webContents.getURL(), title: t.title, active: t.id === activeId, pinned: !!PERM[t.kind] }; }
function tabList() {
  return [...tabs.values()].sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.id - b.id).map((t) => ({
    id: t.id, kind: t.kind, title: t.title, url: t.view.webContents.getURL(), active: t.id === activeId,
    closable: t.kind === "aux", auto: !!t.auto, loading: t.view.webContents.isLoading(),
    canBack: t.view.webContents.navigationHistory.canGoBack(), canFwd: t.view.webContents.navigationHistory.canGoForward(),
  }));
}
// ⚡ دفع قايمة التابات للشريط: بحد أقصى مرة كل 150ms ومن غير تكرار — وتابات السحب التلقائي (اللي في الخلفية) مبتحرّكش الشريط خالص
let pushLast = "", pushT = null, pushDirty = false;
function pushTabsNow() {
  pushDirty = false;
  let l; try { l = tabList(); } catch { return; }
  const sig = JSON.stringify(l.map((t) => (t.auto ? { id: t.id, kind: t.kind, auto: 1, active: t.active } : t)));
  if (sig === pushLast) return;
  pushLast = sig; toShell("tabs", l);
}
const pushTabs = () => { if (pushT) { pushDirty = true; return; } pushTabsNow(); pushT = setTimeout(() => { pushT = null; if (pushDirty) pushTabsNow(); }, 150); };
let linkSes = null;
function prefs(role) {
  if (role === 'desktop-ui') return {
    session:ses,preload:path.join(APPDIR,'preload.js'),
    additionalArguments:[`--alaa-role=dash`,`--alaa-engine=${ENGINE}`,`--alaa-appdir=${APPDIR}`,`--alaa-version=${VERSION}`],
    contextIsolation:false,sandbox:false,nodeIntegration:false,backgroundThrottling:false,spellcheck:false,
  };
  if (role === "remote") {
    if (!linkSes) { linkSes = session.fromPartition("persist:alaa-link"); linkSes.setUserAgent(UA + " AlaaDealsLinked/" + VERSION); }
    return { session: linkSes, contextIsolation: true, sandbox: true, nodeIntegration: false, backgroundThrottling: false, spellcheck: false };
  }
  return {
    session: ses, preload: path.join(APPDIR, "preload.js"),
    additionalArguments: [`--alaa-role=${role}`, `--alaa-engine=${ENGINE}`, `--alaa-appdir=${APPDIR}`, `--alaa-version=${VERSION}`],
    contextIsolation: role === "page", nodeIntegration: false, sandbox: false,
    backgroundThrottling: false, spellcheck: false,
  };
}
function makeTab(kind, { url, file, role = "page", title, auto, order, bg } = {}) {
  const id = PERM[kind] ? PERM[kind].id : nextId++;
  const view = new WebContentsView({ webPreferences: prefs(role) });
  view.setBackgroundColor("#ffffff");
  const t = { id, kind, view, title: title || "…", auto, order, loaded: false };
  tabs.set(id, t);
  // 🕶 تاب خلفية (سحب/نشر/واتساب): بيتحط في القاع تحت كل حاجة — من غير ما التاب اللي قدامك يتحرّك أو يرمش، ومن غير إعادة ترتيب
  if (bg) { try { mainWin.contentView.addChildView(view, 0); } catch { mainWin.contentView.addChildView(view); } layoutOne(t); }
  else { mainWin.contentView.addChildView(view); layout(); }
  const wc = view.webContents;
  wc.setWindowOpenHandler(({ url }) => { if (role === "remote") { if (/^https?:\/\//.test(url)) shell.openExternal(url); } else openUrl(url, { active: t.id === activeId && !t.auto, auto: t.id !== activeId || !!t.auto }); return { action: "deny" }; }); // صفحة بتفتح من تاب شغّال في الخلفية ← تفتح في الخلفية برضه
  wc.on("will-navigate", (e, u) => {
    if (role === 'desktop-ui') {
      try { if (new URL(u).origin === workspaceBase) return; } catch {}
      e.preventDefault(); if (/^https?:\/\//.test(u)) shell.openExternal(u); return;
    }
    if (role === "remote") { const L = LINK(); if (!L || !u.startsWith(L.base)) { e.preventDefault(); if (/^https?:\/\//.test(u)) shell.openExternal(u); } return; }
    if (role !== "page" && !u.startsWith("file:")) { e.preventDefault(); openUrl(u, { active: true }); }
  });
  // إطار أداة المساعد ما يتنقلش لأي صفحة تانية (ولا حتى file:// غير sandbox.html)
  wc.on("will-frame-navigate", (e) => { try { if (isSandboxFrame(e.frame) && !SBX_RX.test(String(e.url || ""))) { e.preventDefault(); global.__sbxNav = (global.__sbxNav || 0) + 1; } } catch {} });
  wc.on("page-title-updated", (e, ti) => { if (kind === "aux") { t.title = (auto ? "🔄 " : "") + ti.slice(0, 40); pushTabs(); } });
  wc.on("did-start-loading", pushTabs);
  wc.on("did-stop-loading", () => { t.loaded = true; pushTabs(); });
  if (auto) { const lo = () => setPrio(wc, "low"); wc.on("did-start-navigation", lo); wc.on("did-finish-load", lo); setTimeout(lo, 800); } // 🐢 تابات الأتمتة (بتتنقل بين مواقع = بروسيس جديد) بأولوية أقل
  if (kind === "home" || kind === "dash") wc.on("did-finish-load", () => wc.setZoomFactor(SCALE));
  wc.on("did-navigate", pushTabs);
  wc.on("did-navigate-in-page", pushTabs);
  wc.on("render-process-gone", (e, d) => { console.error("tab crashed", kind, d.reason); setTimeout(() => { if (!wc.isDestroyed()) wc.reload(); }, 3000); });
  wc.on("before-input-event", (e, input) => keys(e, input));
  ctxmenu.attach(wc, { Menu, clipboard, BrowserWindow, win: mainWin, openUrl: (u) => (role === "remote" ? (/^https?:\/\//.test(u) && shell.openExternal(u)) : openUrl(u, { active: true })) });
  wc.on("focus", () => { if (popKind && Date.now() - popAt > 300) popClose(); });
  if (file) view.webContents.loadFile(file).catch(() => {}); else if (url) view.webContents.loadURL(url).catch(() => {});
  pushTabs();
  return t;
}
function ensurePerm(kind, bg) {
  const p = PERM[kind];
  let t = tabs.get(p.id);
  const L = LINK();
  if (!t && kind === "dash" && L) t = makeTab(kind, { ...p, file: undefined, role: "remote", url: `${L.base}/d/?t=${encodeURIComponent(L.code)}`, order: ORDER.indexOf(kind), bg });
  if (!t && kind === 'dash' && workspaceBase) t = makeTab(kind, {...p,file:undefined,role:'desktop-ui',url:`${workspaceBase}/d/?t=${encodeURIComponent(workspaceCode)}`,order:ORDER.indexOf(kind),bg});
  if (!t) t = makeTab(kind, { ...p, order: ORDER.indexOf(kind), bg });
  return t;
}
// Dashboard commands still belong to the embedded engine, not the Angular shell.
async function dashboardEngine() {
  const t = ensurePerm('dash'), wc = t.view.webContents;
  for (let i=0; i<100; i++) {
    if (wc.isDestroyed()) throw Error('Dashboard was closed');
    if (!wc.isLoading() && t.loaded) {
      const frame = wc.mainFrame.framesInSubtree.find(frame => {
        try { const url=new URL(frame.url); return url.origin === new URL(wc.getURL()).origin && url.pathname === '/d/dashboard.html'; } catch { return false; }
      });
      if (frame) return frame;
      if (wc.getURL().startsWith('file:') || /\/d\/(?:dashboard\.html)?(?:[?#]|$)/.test(wc.getURL())) return wc;
    }
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  throw Error('Dashboard engine is not ready');
}
function activate(id, keepPop) {
  const t = tabs.get(id); if (!t) return;
  if (!keepPop) popClose();
  activeId = id;
  layout(); // الأول نظبط المقاسات وبعدين نجيب التاب لفوق (من غير ما حاجة تبان من ورا)
  // كل التابات بتفضل شغالة ورا بعض (عشان السحب يكمل)، والتاب المختار بيتحط فوق
  mainWin.contentView.addChildView(t.view);
  if (keepPop && popKind && pop && !pop.webContents.isDestroyed()) mainWin.contentView.addChildView(pop); // قفل صفحة من القايمة: القايمة تفضل مفتوحة فوق
  pushTabs();
  if (!keepPop && !t.view.webContents.isDestroyed()) t.view.webContents.focus();
  if (t.auto) { t.auto = false; } // (احتياط) تاب اتفتح من الأتمتة وإنت فعّلته بنفسك ← بقى تابك
  setPrio(t.view.webContents, "normal");
}
function closeTab(id) {
  const t = tabs.get(id); if (!t || t.kind !== "aux") return;
  const list = tabList(), i = list.findIndex((x) => x.id === id);
  const near = list.slice(i + 1).concat(list.slice(0, i).reverse()).find((x) => x.kind === "aux" && !x.auto);
  tabs.delete(id);
  try { mainWin.contentView.removeChildView(t.view); } catch {}
  try { t.view.webContents.close(); } catch {}
  if (activeId === id) activate(near && tabs.has(near.id) ? near.id : PERM.dash.id, !!popKind);
  pushTabs();
}
// ================= القوايم المنسدلة =================
// نافذة (WebContentsView) فوق كل الصفحات — لازم تكون كده عشان صفحات فيسبوك/واتساب بتغطي الشريط. بتتقفل لو ضغطت برّاها أو Esc.
let pop = null, popKind = null, popAnchor = null, popAt = 0, popClosed = { kind: "", t: 0 }, popLoaded = false, popPending = null;
function ensurePop() {
  if (pop && !pop.webContents.isDestroyed()) return pop;
  const view = new WebContentsView({ webPreferences: prefs("pop") });
  view.setBackgroundColor("#0c1e24");
  view.setVisible(false);
  view.setBounds({ x: 0, y: 0, width: 1, height: 1 });
  mainWin.contentView.addChildView(view);
  const wc = view.webContents;
  wc.loadFile(path.join(APPDIR, "popup.html")).catch(() => {});
  // الصفحة لسه بتحمّل (سكربتات الأيقونات) ⟵ بنستنى تخلص وبعدين نبعتلها البيانات (من غير كده أول فتحة كانت بتضيع)
  wc.on("did-finish-load", () => { popLoaded = true; wc.setZoomFactor(SCALE); if (popPending && popKind) { wc.send("app:popData", popPending); popPending = null; } });
  wc.on("blur", () => { if (popKind && Date.now() - popAt > 300) popClose(); });
  wc.on("render-process-gone", () => { popLoaded = false; popClose(); setTimeout(() => { if (!wc.isDestroyed()) wc.reload(); }, 500); });
  wc.on("before-input-event", (e, input) => { if (input.type === "keyDown" && input.key === "Escape") { e.preventDefault(); popClose(true); } else keys(e, input); });
  pop = view;
  return view;
}
function popOpen(o) {
  if (!mainWin || mainWin.isDestroyed() || !o.kind || !o.rect) return false;
  if (popKind === o.kind) { popClose(); return false; } // دوسة تانية على نفس الزرار = قفل
  if (!popKind && popClosed.kind === o.kind && Date.now() - popClosed.t < 400) return false; // نفس الدوسة اللي قفلتها (blur) متفتحهاش تاني
  const v = ensurePop();
  popKind = o.kind; popAnchor = o.rect; popAt = Date.now();
  v.webContents.setZoomFactor(SCALE);
  const payload = { ...(o.data || {}), kind: o.kind, maxH: o.maxH, fresh: true };
  if (popLoaded) { popPending = null; v.webContents.send("app:popData", payload); } else popPending = payload;
  toShell("popState", o.kind);
  return true;
}
function popPlace(s) {
  if (!popKind || !pop || pop.webContents.isDestroyed() || !popAnchor) return;
  const [w, h] = mainWin.getContentSize(), z = SCALE;
  const pw = Math.min(Math.round((s.w || 320) * z), w - 16), y = Math.round(popAnchor.bottom * z) + 4;
  const ph = Math.max(60, Math.min(Math.round((s.h || 200) * z), h - y - 8));
  // RTL: حافة القايمة اليمين على حافة الزرار اليمين، ولو خرجت برّه الشاشة بنزحزحها لجوه
  let x = Math.round(popAnchor.right * z) - pw;
  x = Math.max(8, Math.min(x, w - pw - 8));
  pop.setBounds({ x, y, width: pw, height: ph });
  if (!pop.getVisible()) { pop.setVisible(true); pop.webContents.focus(); }
  mainWin.contentView.addChildView(pop); // فوق كل التابات
}
function popClose(refocus) {
  if (!popKind) return false;
  popClosed = { kind: popKind, t: Date.now() };
  popKind = null; popAnchor = null;
  if (pop && !pop.webContents.isDestroyed()) { pop.setVisible(false); pop.setBounds({ x: 0, y: 0, width: 1, height: 1 }); }
  toShell("popState", null);
  if (refocus) { const t = tabs.get(activeId); if (t && !t.view.webContents.isDestroyed()) t.view.webContents.focus(); }
  return true;
}
function layoutOne(t) {
  if (!mainWin || mainWin.isDestroyed() || !t || t.view.webContents.isDestroyed()) return;
  const [w, h] = mainWin.getContentSize(); const y = t.id === activeId ? topOf(t) : sc(TOP);
  t.view.setBounds({ x: 0, y, width: w, height: Math.max(100, h - y) });
}
function layout() {
  if (!mainWin || mainWin.isDestroyed()) return;
  const [w, h] = mainWin.getContentSize();
  // التابات اللي ورا بتبدأ تحت الشريط كله (88) — عشان لوحة التحكم (اللي بتبدأ من 48) ماتبانش من ورا شريط العنوان لما تفتح فيسبوك
  for (const t of tabs.values()) { const y = t.id === activeId ? topOf(t) : sc(TOP); t.view.setBounds({ x: 0, y, width: w, height: Math.max(100, h - y) }); }
  if (popKind && pop && !pop.webContents.isDestroyed()) mainWin.contentView.addChildView(pop);
}
function waSend(url, active = true) {
  const u = new URL(url);
  let phone = "", text = u.searchParams.get("text") || "";
  if (u.hostname === "wa.me") phone = u.pathname.replace(/\D/g, "");
  else phone = (u.searchParams.get("phone") || "").replace(/\D/g, "");
  const t = ensurePerm("wa", !active);
  t.view.webContents.loadURL(`https://web.whatsapp.com/send?phone=${phone}${text ? "&text=" + encodeURIComponent(text) : ""}`).catch(() => {});
  if (active) activate(t.id); // بوت واتساب/الإرسال التلقائي (active:false) بيشتغل في الخلفية من غير ما يسحبك لتاب واتساب
  return info(t);
}
function openUrl(url, { active = true, auto = false } = {}) {
  let u; try { u = new URL(url); } catch { u = null; }
  if (u && u.protocol === "file:") {
    const f = decodeURIComponent(u.pathname).replace(/^\/([A-Za-z]:)/, "$1");
    if (path.normalize(f) === path.normalize(DASH_FILE)) {
      const t = ensurePerm("dash");
      if (u.hash) dashboardEngine().then(frame=>frame.executeJavaScript(`location.hash=${JSON.stringify(u.hash)}`)).catch(() => {});
      activate(t.id);
      return info(t);
    }
    return null;
  }
  if (u && (u.hostname === "wa.me" || u.hostname === "api.whatsapp.com" || (u.hostname === "web.whatsapp.com" && u.pathname.startsWith("/send")))) return waSend(url, active);
  const inApp = !u || url === "about:blank" || /(^|\.)(facebook\.com|instagram\.com|messenger\.com|m\.me|fb\.com|fb\.me|whatsapp\.com)$/i.test(u.hostname);
  if (!inApp) { if (/^https?:$/.test(u.protocol)) shell.openExternal(url); return null; }
  const t = makeTab("aux", { url, role: "page", title: auto ? "🔄 سحب تلقائي" : "📄 صفحة", auto, bg: !active });
  if (active) activate(t.id); // لو مش active: التاب بيتفتح في القاع وشغّال، والتاب اللي قدامك ما بيتلمسش
  return info(t);
}
function keys(e, input) {
  if (input.type !== "keyDown") return;
  const altGr = input.control && input.alt; // AltGr على ويندوز = Ctrl+Alt ← بيكتب حروف (مش اختصار)
  const c = (input.control || input.meta) && !altGr;
  if (c && input.shift && input.key.toLowerCase() === "s") { e.preventDefault(); if (bgWin) bgWin.webContents.send("cmd", "save-all"); }
  else if (input.key === "F5") { e.preventDefault(); const t = tabs.get(activeId); if (t) t.view.webContents.reload(); }
  else if (c && input.key.toLowerCase() === "w") { e.preventDefault(); closeTab(activeId); }
  else if (c && input.key === "Tab") { e.preventDefault(); const l = tabList(); const i = l.findIndex((t) => t.active); const n = l[(i + (input.shift ? l.length - 1 : 1)) % l.length]; if (n) activate(n.id); }
  else if (c && /^[1-5]$/.test(input.key)) { e.preventDefault(); activate(PERM[ORDER[+input.key - 1]].id); }
  else if (input.alt && !input.control && input.key === "ArrowLeft") { const t = tabs.get(activeId); if (t && t.view.webContents.navigationHistory.canGoBack()) t.view.webContents.navigationHistory.goBack(); }
}

// ================= الحالة: تسجيل الدخول + التحديث التلقائي =================
let waState = "off";
// 🔗 وضع الربط: البرنامج على الجهاز ده بيبقى «شاشة» للبرنامج اللي على السيرفر (VPS)
// الداتا والسحب كلهم هناك وشغالين 24 ساعة — هنا بس بنعرض ونتحكم، والتنبيهات بتوصل هنا كمان
const LINKRAW = () => { const l = appSettings && appSettings.link; return l && l.on && l.base && l.code ? l : null; };
const LINK = () => { const l = LINKRAW(); return l && l.mode !== "sync" ? l : null; }; // 🖥 وضع العرض من السيرفر (البرنامج هنا شاشة بس)
// 🕸 الأجهزة المربوطة بالمزامنة الكاملة: أي عدد (كل واحد {id, base, code, name, on})
const PEERS = () => (Array.isArray(appSettings.peers) ? appSettings.peers : []).filter((p) => p && p.on !== false && p.base && p.code);
const SYNC = () => PEERS()[0] || null;
const normBase = (addr) => {
  let a = String(addr || "").trim().replace(/\s+/g, "").replace(/\/+$/, "").replace(/\/(d|m)$/, "");
  if (!a) return "";
  if (!/^https?:\/\//i.test(a)) a = "http://" + a;
  try { const u = new URL(a); if (!u.port && u.protocol === "http:" && !/^http:\/\/[^/?#]*:80(?=[/?#]|$)/i.test(a)) u.port = "8787"; return u.origin; } catch { return ""; } // «:80» مكتوبة صراحة = بورت 80 (new URL بيشيله لأنه الافتراضي)
};
async function linkFetch(p, { method = "GET", body, base, code, timeout = 15000 } = {}) {
  const L = LINKRAW() || {}; base = base || L.base; code = code || L.code;
  // المهلة بتغطي الرد كله (الهيدر + قراءة الداتا) — لو السيرفر وقف في النص الطلب يتقفل بدل ما يفضل معلّق
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await net.fetch(base + p, { method, headers: { "X-Token": code, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: ctl.signal });
    if (r.status === 401) throw new Error("الكود غلط أو اتغيّر");
    if (r.status === 429) throw new Error("محاولات كتير غلط — استنى 10 دقايق");
    if (!r.ok) throw new Error("السيرفر رد بخطأ " + r.status);
    return await r.json();
  } catch (e) {
    if (ctl.signal.aborted) throw new Error("السيرفر مش بيرد");
    throw e;
  } finally { clearTimeout(to); }
}
const linkRt = (msg) => linkFetch("/api/rt", { method: "POST", body: { msg }, timeout: 60000 }).then((r) => r.resp);
// ليه مش قادر يوصل؟ رسالة واضحة على حسب نوع المشكلة
function linkWhy(e, base) {
  const m = String((e && e.message) || e || "");
  if (/الكود|محاولات/.test(m)) return m;
  if (/REFUSED/i.test(m)) return `السيرفر ${base.replace(/^http:\/\//, "")} رد بس البرنامج مش فاتح البورت — اتأكد إن البرنامج شغال هناك و«📱 الموبايل والسيرفر» متعلّم عليه، وإن البورت نفسه (8787)`;
  if (/NAME_NOT_RESOLVED|ENOTFOUND/i.test(m)) return "العنوان ده مش موجود — راجع الـIP (أرقام بس زي 185.20.30.40) وبعده :8787";
  if (/TIMED_OUT|بيرد|ADDRESS_UNREACHABLE|timeout/i.test(m)) return "السيرفر مش بيرد — غالبًا البورت 8787 مقفول في الفايروول: على السيرفر دوس «🧱 افتح البورت في الفايروول» في كارت «📱 الموبايل والسيرفر»، ولو شركة الـVPS عندها Firewall في لوحتها افتح فيه TCP 8787";
  return "مش قادر يوصل للسيرفر — اتأكد من العنوان والبورت، وإن البرنامج شغال هناك و«📱 الموبايل والسيرفر» متفعّل (" + m.slice(0, 60) + ")";
}
// 🧱 فتح البورت في فايروول الويندوز (بيطلب موافقة الأدمن مرة واحدة)
function openFirewall(port) {
  if (process.platform !== "win32") return Promise.resolve({ ok: false, error: "الخطوة دي للويندوز بس" });
  port = +port || 8787;
  const rule = `Remove-NetFirewallRule -DisplayName 'Alaa Deals ${port}' -ErrorAction SilentlyContinue; Remove-NetFirewallRule -DisplayName 'Aqar Matrix ${port}' -ErrorAction SilentlyContinue; New-NetFirewallRule -DisplayName 'Aqar Matrix ${port}' -Direction Inbound -Protocol TCP -LocalPort ${port} -Action Allow -Profile Any`;
  const inner = Buffer.from(rule, "utf16le").toString("base64");
  const outer = `Start-Process powershell -Verb RunAs -WindowStyle Hidden -Wait -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-EncodedCommand','${inner}'; Get-NetFirewallRule -DisplayName 'Aqar Matrix ${port}' -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Enabled`;
  return new Promise((resolve) => {
    require("child_process").execFile("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", outer], { windowsHide: true, timeout: 120000 }, (err, out) => {
      if (/True/i.test(String(out || ""))) resolve({ ok: true });
      else resolve({ ok: false, error: err && /canceled|ألغيت|1223/i.test(String(err.message)) ? "اتلغت الموافقة — دوس تاني ووافق على رسالة الويندوز" : "ما اتفتحش — جرّب تاني ووافق على رسالة الويندوز (Yes)" });
    });
  });
}
// 🔁 هوية الجهاز + حالة الوصلة بالجهاز التاني — المحرك (التزامن العكسي للأوامر + الجهاز الأساسي) بيقراهم من __dev و__peer
function devInfo() {
  if (!appSettings.deviceId) { appSettings.deviceId = "d" + crypto.randomBytes(5).toString("hex"); saveSettings(); }
  const client = PEERS().length > 0, server = !client && !!(appSettings.remote && appSettings.remote.enabled);
  const role = client ? "client" : server ? "server" : "solo";
  let host = ""; try { host = os.hostname(); } catch {}
  const custom = String(((store.get("xsCfg") || {}).xsCfg || {}).name || "").trim().slice(0, 40);
  return { id: appSettings.deviceId, name: custom || (client ? "ويندوز" : server ? "VPS" : "الجهاز") + (host ? " · " + host.slice(0, 20) : ""), role, ver: VERSION };
}
let peerEverOk = false;
function peerInfo() {
  if (PEERS().length) { const i = peerSync ? peerSync.info() : {}; const ok = !!(i.connected && Date.now() - (i.lastPull || 0) < (TEST ? 20000 : 45000)); if (ok) peerEverOk = true; return { on: true, role: "client", ok, everOk: peerEverOk, n: PEERS().length, up: i.up || 0, syncing: joiningNow() }; } // everOk: أول مزامنة نجحت (قبلها الجهاز ده مايرشّحش نفسه أساسي)
  if (appSettings.remote && appSettings.remote.enabled) return { on: true, role: "server", ok: true, everOk: true, syncing: false };
  return { on: false };
}
let xsStateJ = "";
function pushXsState() {
  try {
    const d = devInfo(), p = peerInfo(), j = JSON.stringify([d, p]);
    if (j === xsStateJ) return; xsStateJ = j;
    broadcast(store.set({ __dev: d, __peer: p }));
  } catch (e) { console.error("xsState", e); }
}
let linkState = { ok: false, error: "", at: 0 };
// 🕸 مدير الشبكة: بيتعمل مرة واحدة بعد ما الـstore يجهز، وبيفتح وصلة لكل جهاز في القايمة (وبيتحدّث لايف من غير ما البرنامج يتقفل)
function createMesh() {
  if (peerSync) return;
  peerSync = require("./mesh.js")({ store, chlog, net, devId: () => devInfo().id, getPeers: () => PEERS(), fetchJson: (p, o) => linkFetch(p, o),
    apply: (obj) => broadcast(store.set(obj)), removeKeys: (ks) => broadcast(store.remove(ks)), log: (...a) => console.log("[sync]", ...a) });
}
const peerKey = (base) => String(base || "").replace(/^https?:\/\//, "");
// «كود الانضمام» بأي شكل: 45.12.33.10:8787#K7Q2M9XA · 45.12.33.10:8787 K7Q2M9XA · http://ip:port/#CODE · alaa://join/ip:port/CODE
function parseJoin(str) {
  let t = String(str || "").trim().replace(/^alaa:\/\/join\//i, "").replace(/\s+/g, " ");
  const m = /^(\S+?)[\s#,;|\/]+([A-Za-z0-9]{6,16})\s*$/.exec(t);
  return m ? { addr: m[1], code: m[2].toUpperCase() } : null;
}
function migratePeers() {
  if (!Array.isArray(appSettings.peers)) appSettings.peers = [];
  const l = appSettings.link; let ch = false;
  if (l && l.mode === "sync") { // نسخة قديمة: وصلة واحدة → تبقى أول جهاز في القايمة
    if (l.on && l.base && l.code && !appSettings.peers.some((p) => p.base === l.base)) appSettings.peers.push({ id: peerKey(l.base), base: l.base, code: l.code, on: true, at: l.at || Date.now() });
    delete appSettings.link; ch = true;
  }
  if (ch) saveSettings();
}
// ➕ جهاز جديد في الشبكة: بنتأكد إنه بيرد وبالكود الصح وإنه مش الجهاز ده نفسه، وبعدين يتفتح له وصلة فورًا (من غير ما البرنامج يتقفل)
async function addPeer(o = {}) {
  if (LINK()) return { ok: false, error: "الجهاز ده في وضع «عرض من السيرفر» — فك الربط الأول عشان يشتغل بالمزامنة الكاملة" };
  let addr = o.addr, code = o.code;
  if (!code || /[\s#]/.test(String(addr || ""))) { const j = parseJoin(o.join || (code ? addr + " " + code : addr)); if (j) { addr = j.addr; code = j.code; } }
  const base = normBase(addr); code = String(code || "").trim().toUpperCase();
  if (!base) return { ok: false, error: "اكتب عنوان الجهاز صح، مثلًا 45.12.33.10:8787 — أو الصق «كود الانضمام» كله (العنوان#الكود)" };
  if (!code) return { ok: false, error: "اكتب الكود" };
  const host = new URL(base).hostname;
  if (host === "45.12.33.10") return { ok: false, error: "ده عنوان مثال بس — اكتب الـIP بتاع الجهاز/السيرفر الحقيقي" };
  let ping;
  try { ping = await linkFetch("/api/ping", { base, code, timeout: 9000 }); }
  catch (e) {
    const lan = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
    return { ok: false, error: linkWhy(e, base) + (lan && !/الكود|محاولات/.test(String(e.message)) ? ` — ملحوظة: ${host} عنوان داخلي، بيشتغل بس لو الجهازين على نفس الشبكة؛ لو سيرفر VPS استخدم الـIP العام بتاعه` : "") };
  }
  const me = devInfo();
  if (ping && ping.dev && ping.dev === me.id) return { ok: false, error: "ده الجهاز ده نفسه — اكتب عنوان جهاز تاني" };
  const dup = (appSettings.peers || []).find((p) => p.base === base || (ping && ping.dev && p.devId === ping.dev));
  if (dup) { dup.code = code; dup.base = base; dup.on = true; if (ping && ping.dev) dup.devId = ping.dev; if (ping && ping.name) dup.name = ping.name; }
  else (appSettings.peers = appSettings.peers || []).push({ id: peerKey(base), base, code, on: true, name: (ping && ping.name) || "", devId: (ping && ping.dev) || "", at: Date.now() });
  saveSettings();
  if (!peerSync.isJoined() && (o.settings === "adopt" || o.settings === "mine") && !PEERS().filter((p) => p.base !== base).length) peerSync.setMode(o.settings); // أول جهاز بيتربط بيه: مين الأساس في الإعدادات؟
  peerSync.reconcile(); pushXsState();
  return { ok: true, peers: peersState(), restarting: false };
}
function removePeer(id) { appSettings.peers = (appSettings.peers || []).filter((p) => p.id !== id && p.base !== id); saveSettings(); peerSync.reconcile(); pushXsState(); return { ok: true, peers: peersState() }; }
function peersState() {
  const live = new Map((peerSync ? peerSync.list() : []).map((x) => [x.id, x]));
  return (appSettings.peers || []).map((p) => ({ id: p.id, addr: peerKey(p.base), name: p.name || "", on: p.on !== false, at: p.at || 0, ...(live.get(p.id) || {}), ...(live.get(p.id) ? {} : { connected: false }) }));
}
// بيانات الانضمام الخاصة بالجهاز ده (للصقها على جهاز جديد)
function joinInfo() {
  const r = remoteSrv ? remoteSrv.info() : null; if (!r) return { enabled: false, strings: [] };
  const addrs = (r.addresses || []).slice().sort((a, b) => (b.name === "public") - (a.name === "public"));
  return { enabled: !!r.enabled, running: !!r.running, port: r.port, code: r.code, error: r.error, strings: addrs.map((a) => `${a.ip}:${r.port}#${r.code}`), addrs: addrs.map((a) => ({ ip: a.ip, name: a.name })) };
}
async function peersApi(action, arg) {
  if (action === "list" || !action) return { peers: peersState(), mesh: peerSync ? peerSync.info() : null, join: joinInfo(), me: devInfo(), files: xf ? xf.info() : null };
  if (action === "add") return addPeer(arg || {});
  if (action === "remove") return removePeer(arg);
  if (action === "toggle") { const p = (appSettings.peers || []).find((x) => x.id === arg); if (p) { p.on = p.on === false; saveSettings(); peerSync.reconcile(); pushXsState(); } return { ok: true, peers: peersState() }; }
  if (action === "rename") { const p = (appSettings.peers || []).find((x) => x.id === (arg || {}).id); if (p) { p.name = String((arg || {}).name || "").slice(0, 40); saveSettings(); } return { ok: true, peers: peersState() }; }
  if (action === "resync") return { ok: !!(peerSync && peerSync.resync()) };
  if (action === "join") return joinInfo();
  return { ok: false, error: "أمر مش معروف" };
}
// 📥 انضمام تلقائي: ملف join.txt (في فولدر البيانات أو جنب البرنامج) أو متغير ALAA_JOIN أو --join=… — للسيرفر الجديد اللي بيتركّب من غير ما حد يفتح شاشته
function autoJoin() {
  const list = [];
  const add = (txt) => { for (const line of String(txt || "").split(/[\r\n]+/)) { const j = parseJoin(line.replace(/^\uFEFF/, "")); if (j) list.push(j); } };
  if (process.env.ALAA_JOIN) add(process.env.ALAA_JOIN);
  for (const a of process.argv) if (/^--join=/.test(a)) add(a.slice(7));
  const files = [path.join(app.getPath("userData"), "join.txt")]; try { files.push(path.join(path.dirname(process.env.PORTABLE_EXECUTABLE_FILE || process.execPath), "join.txt")); } catch {}
  const used = [];
  for (const f of files) { try { if (fs.existsSync(f)) { add(fs.readFileSync(f, "utf8")); used.push(f); } } catch {} }
  let n = 0;
  for (const j of list) {
    const base = normBase(j.addr); if (!base || (appSettings.peers || []).some((p) => p.base === base)) continue;
    (appSettings.peers = appSettings.peers || []).push({ id: peerKey(base), base, code: j.code, on: true, name: "", devId: "", at: Date.now(), auto: true }); n++;
  }
  if (n) saveSettings();
  for (const f of used) { try { fs.renameSync(f, f.replace(/join\.txt$/, "join.done.txt")); } catch {} }
  return n;
}
// أول ما الجهاز ينضم لشبكة وهو فاضي: محرك السحب يستنى لحد ما ياخد الداتا القديمة (بحد أقصى 10 دقايق لو الأجهزة التانية مش بترد)
let meshT0 = 0;
const joiningNow = () => !!(peerSync && PEERS().length && peerSync.fresh() && !peerSync.isJoined() && Date.now() - meshT0 < 10 * 6e4);
function linkInfo() { const L = LINKRAW(); return { on: !!L, mode: L ? L.mode || "remote" : ((appSettings.link || {}).mode || "sync"), addr: L ? L.base.replace(/^http:\/\//, "") : ((appSettings.link || {}).base || "").replace(/^http:\/\//, ""), ...linkState, sync: peerSync ? peerSync.info() : null }; }
async function setLink(o = {}) {
  if (o.off) {
    appSettings.link = { ...(appSettings.link || {}), on: false }; saveSettings();
  } else {
    const base = normBase(o.addr), code = String(o.code || "").trim().toUpperCase();
    if (!base) return { ok: false, error: "اكتب عنوان السيرفر صح، مثلًا 45.12.33.10:8787" };
    if (!code) return { ok: false, error: "اكتب الكود" };
    const host = new URL(base).hostname;
    if (host === "45.12.33.10") return { ok: false, error: "ده عنوان مثال بس — اكتب الـIP بتاع السيرفر بتاعك (اللي جالك في إيميل شركة الـVPS)" };
    try { await linkFetch("/api/ping", { base, code, timeout: 9000 }); }
    catch (e) {
      // عنوان داخلي (192.168…) بيشتغل بس لو الجهازين على نفس الواي فاي
      const lan = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
      return { ok: false, error: linkWhy(e, base) + (lan && !/الكود|محاولات/.test(String(e.message)) ? ` — ملحوظة: ${host} عنوان داخلي، بيشتغل بس لو الجهازين على نفس الواي فاي؛ لو السيرفر VPS استخدم الـIP العام بتاعه` : "") };
    }
    appSettings.link = { on: true, base, code, mode: o.mode === "remote" ? "remote" : "sync", at: Date.now() }; saveSettings();
  }
  // نعيد فتح البرنامج عشان يشتغل بالوضع الجديد
  if (!TEST) setTimeout(() => { quitting = true; try { store && store.flush(); } catch {} try { remoteSrv && remoteSrv.stop(); } catch {} app.relaunch({ execPath: process.env.PORTABLE_EXECUTABLE_FILE || process.execPath, args: process.argv.slice(1).filter((x) => x !== "--hidden") }); app.exit(0); }, 1200);
  return { ok: true, restarting: !TEST };
}
// 🔔 نسمع من السيرفر: أي تنبيه جديد → إشعار على الجهاز ده، وأي تغيير → الشريط اللي فوق يتحدّث
let linkReq = null, linkRetry = null;
function linkEvents() {
  const L = LINK(); if (!L) return;
  clearTimeout(linkRetry);
  const again = (ms = 5000) => { clearTimeout(linkRetry); linkRetry = setTimeout(linkEvents, ms); };
  const { StringDecoder } = require("string_decoder");
  const dec = new StringDecoder("utf8"); let buf = "", statusT = null;
  const onBlock = (block) => {
    let ev = "message", data = "";
    for (const line of block.split("\n")) { if (line.startsWith("event:")) ev = line.slice(6).trim(); else if (line.startsWith("data:")) data += line.slice(5).trim(); }
    if (ev === "notif") {
      let n = {}; try { n = JSON.parse(data); } catch {}
      lastNotif = { ...n, at: Date.now() };
      if (Notification.isSupported()) { const x = new Notification({ title: n.title || "Aqar Matrix", body: n.message || "", icon: ICON }); x.on("click", () => { showMain(); activate(PERM.dash.id); }); x.show(); }
    } else if (ev === "kv" || ev === "hello") {
      linkState = { ok: true, error: "", at: Date.now() };
      clearTimeout(statusT); statusT = setTimeout(async () => toShell("status", await status()), 600);
    }
  };
  try {
    const req = net.request({ url: L.base + "/api/events", method: "GET" });
    req.setHeader("X-Token", L.code);
    linkReq = req;
    req.on("response", (res) => {
      if (res.statusCode !== 200) { linkState = { ok: false, error: res.statusCode === 401 ? "الكود اتغيّر — اربط تاني بالكود الجديد" : "السيرفر رد بخطأ " + res.statusCode, at: Date.now() }; return again(res.statusCode === 401 ? 60000 : 8000); }
      res.on("data", (c) => { buf += dec.write(c); let i; while ((i = buf.indexOf("\n\n")) >= 0) { const b = buf.slice(0, i); buf = buf.slice(i + 2); onBlock(b); } });
      res.on("end", () => { linkState = { ...linkState, ok: false, error: "الاتصال بالسيرفر اتقطع — بيحاول تاني" }; again(); });
      res.on("error", () => again());
    });
    req.on("error", (e) => { linkState = { ok: false, error: "مش قادر يوصل للسيرفر — بيحاول تاني", at: Date.now() }; again(8000); });
    req.end();
  } catch { again(10000); }
}
// 👁 صورة لحظية من الصفحة اللي بتتسحب دلوقتي (للأجهزة التانية)
async function screenOf(which) {
  const LQ = store.get(["fbQueue", "__q.fast", "__q.mine", "__q.deep", "__q.m1", "__q.m2"]); // مسارات السحب — نصوّر أول مسار شغّال
  const fbQueue = ["fbQueue", "__q.fast", "__q.mine", "__q.deep", "__q.m1", "__q.m2"].map((k) => LQ[k]).find((q) => q && q.running && q.tabId != null && tabs.get(q.tabId)) || null;
  let t = null;
  if (which === "wa") t = tabs.get(PERM.wa.id);
  else if (which === "fb") t = tabs.get(PERM.fb.id);
  else {
    if (fbQueue && fbQueue.running && fbQueue.tabId != null) t = tabs.get(fbQueue.tabId);
    if (!t) t = [...tabs.values()].filter((x) => x.kind === "aux" && x.view && !x.view.webContents.isDestroyed() && /facebook\.com|instagram\.com/.test(x.view.webContents.getURL())).pop();
    if (!t) t = tabs.get(PERM.fb.id);
  }
  if (!t || !t.view || t.view.webContents.isDestroyed()) return null;
  const wc = t.view.webContents;
  const meta = { title: t.title || wc.getTitle() || "", url: wc.getURL() };
  // 1) التصوير العادي
  try {
    let img = await Promise.race([wc.capturePage(), new Promise((_, rej) => setTimeout(() => rej(new Error("t")), 4000))]);
    if (img && !img.isEmpty()) { if (img.getSize().width > 1280) img = img.resize({ width: 1280 }); return { jpg: img.toJPEG(62), ...meta }; }
  } catch {}
  // 2) التابة ورا تابات تانية؟ نصوّرها من جوه (من غير ما نغيّر حاجة في الشاشة)
  const dbg = wc.debugger; let mine = false;
  try {
    if (!dbg.isAttached()) { dbg.attach("1.3"); mine = true; }
    const r = await Promise.race([dbg.sendCommand("Page.captureScreenshot", { format: "jpeg", quality: 60, captureBeyondViewport: false, fromSurface: true }), new Promise((_, rej) => setTimeout(() => rej(new Error("t")), 6000))]);
    if (r && r.data) return { jpg: Buffer.from(r.data, "base64"), ...meta };
  } catch {} finally { if (mine) { try { dbg.detach(); } catch {} } }
  return null;
}
async function status() {
  const L = LINK();
  if (L) {
    try { const r = await linkFetch("/api/status", { timeout: 12000 }); linkState = { ok: true, error: "", at: Date.now() }; return { ...r, linked: { addr: L.base.replace(/^http:\/\//, ""), ok: true } }; }
    catch (e) { linkState = { ok: false, error: e.message, at: Date.now() }; return { fb: false, ig: false, wa: "loading", auto: { enabled: false }, counts: { posts: 0, comments: 0 }, lastNotif, linked: { addr: L.base.replace(/^http:\/\//, ""), ok: false, error: e.message } }; }
  }
  const ck = async (url, name) => (await ses.cookies.get({ url, name })).length > 0;
  const fb = (await ck("https://www.facebook.com", "c_user")) || (await ck("https://web.facebook.com", "c_user"));
  const ig = await ck("https://www.instagram.com", "sessionid");
  const { autoCfg = {}, autoLog = null } = store.get(["autoCfg", "autoLog"]);
  const a = alarms.get("autoScan");
  const counts = { posts: Object.keys(store.get("posts").posts || {}).length, comments: Object.keys(store.get("comments").comments || {}).length };
  const { fbGroups = [], waGroups = [], settings: stg = {} } = store.get(["fbGroups", "waGroups", "settings"]);
  const groups = { fb: (fbGroups || []).filter((g) => g && g.checked).length, wa: (waGroups || []).filter((g) => g && g.checked).length };
  const sync = PEERS().length && peerSync ? { ...peerSync.info(), pending: peerSync.info().pending } : null; // 🕸 ملخّص كل الأجهزة المربوطة (+ sync.peers = كل وصلة لوحدها)
  return { version: VERSION, sync, groups, gov: (stg && stg.gov) || "", focus: ((stg && stg.focus) || []).length, fb, ig, wa: waState, auto: { enabled: !!autoCfg.enabled, hours: autoCfg.hours, next: a ? a.scheduledTime : null, last: autoLog, running: !!(autoLog && !autoLog.finishedAt && Date.now() - autoLog.startedAt < 40 * 6e4) }, counts, lastNotif };
}
async function checkWa() {
  const t = tabs.get(PERM.wa.id);
  if (!t || t.view.webContents.isDestroyed() || t.view.webContents.isLoading()) return;
  try {
    waState = await t.view.webContents.executeJavaScript(`(()=>{if(document.querySelector('#pane-side,[data-testid="chat-list"],#side'))return 'in';if(document.querySelector('canvas[aria-label],div[data-ref],canvas'))return 'qr';return 'loading'})()`);
  } catch { waState = "loading"; }
}

// ================= استيراد داتا الإضافة =================
function findImport() {
  const p = path.join(app.getPath("downloads"), "AlaaDealsExt", "alaa-deals-latest.json");
  try { const s = fs.statSync(p); return { path: p, mtime: s.mtimeMs, size: s.size }; } catch { return null; }
}
function importFile(file) {
  let d;
  try { d = JSON.parse(fs.readFileSync(file, "utf8")); } catch { return { ok: false, error: "الملف مش ملف داتا صالح" }; }
  if (!d || typeof d !== "object" || Array.isArray(d) || !["posts", "comments", "adPosts", "pipeDeals", "crmReg"].some((k) => d[k] && typeof d[k] === "object")) return { ok: false, error: "الملف ده مفيهوش طلبات أو تعليقات" };
  const cur = store.get(null);
  const out = {};
  // نفس قايمة «استرجاع الداتا» في لوحة الإضافة — اللي عندنا هنا يكسب لو الاتنين فيهم نفس المفتاح
  const mergeObj = (k) => { if (d[k] && typeof d[k] === "object" && !Array.isArray(d[k])) out[k] = { ...d[k], ...(cur[k] || {}) }; };
  ["posts", "comments", "listings", "leadMeta", "adPosts", "pipeDeals", "crmReg", "matchFb", "aiLeads", "dealHist"].forEach(mergeObj);
  const mergeArr = (k, keyOf) => {
    if (!Array.isArray(d[k])) return;
    const seen = new Set((cur[k] || []).map(keyOf));
    out[k] = [...(cur[k] || []), ...d[k].filter((x) => !seen.has(keyOf(x)))];
  };
  mergeArr("fbGroups", (g) => g.slug || g.key || g.name);
  mergeArr("waGroups", (g) => g.title || g.name);
  for (const k of ["settings", "templates", "myName", "team", "dealCfg", "reportCfg", "commCfg"]) if (d[k] != null && cur[k] == null) out[k] = d[k];
  if (Array.isArray(d.savedSearches)) { const have = new Set((cur.savedSearches || []).map((x) => x && x.id)); out.savedSearches = [...(cur.savedSearches || []), ...d.savedSearches.filter((x) => x && !have.has(x.id))]; }
  if (Array.isArray(d.mineSlots) && !(cur.mineSlots || []).some((x) => x && x.text)) out.mineSlots = d.mineSlots;
  // اللي اتستورد يتشال من «اتشافت» عشان يظهر جديد (زي الاسترجاع في الإضافة)
  const un = (k, ids) => { const o = { ...(cur[k] || {}) }; let ch = false; for (const id of Object.keys(ids || {})) if (id in o) { delete o[id]; ch = true; } if (ch || !(k in cur)) out[k] = o; };
  un("seenPosts", d.posts); un("seenComments", d.comments);
  broadcast(store.set(out));
  store.flush();
  const n = (o) => Object.keys(o || {}).length;
  const res = { ok: true, posts: n(d.posts), comments: n(d.comments), listings: n(d.listings), deals: n(d.pipeDeals), ads: n(d.adPosts), total: n(out.posts) };
  appSettings.imported = { at: Date.now(), file, ...res }; saveSettings();
  return res;
}

// ================= هوية البرنامج في شريط مهام ويندوز =================
// بيحدّد أيقونة النافذة وأمر إعادة التشغيل عشان «تثبيت في الشريط» يثبّت البرنامج الصح بأيقونته (حتى النسخة المحمولة)
function applyWinIdentity(win) {
  if (process.platform !== "win32" || !win || win.isDestroyed()) return;
  try { win.setIcon(WIN_ICON); } catch {}
  if (!app.isPackaged || TEST) return;
  try {
    const exe = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath;
    win.setAppDetails({ appId: AUMID, appIconPath: exe, appIconIndex: 0, relaunchCommand: `"${exe}"`, relaunchDisplayName: "Aqar Matrix" });
  } catch (e) { console.log("[icon] setAppDetails:", e && e.message); }
}
// 🔧 إصلاح اختصارات ويندوز المكسورة (ورقة بيضا في الشريط/القايمة/سطح المكتب) — manual=true من الزرار (بيشتغل حتى للنسخة المحمولة)
function repairShortcuts(manual) {
  const out = { checked: 0, fixed: 0, files: [], errors: [] };
  if (process.platform !== "win32" || !app.isPackaged || TEST) return out;
  if (IS_PORTABLE && !manual) return out; // المحمولة: تلقائي لأ (مسارها يتغيّر) — بس بالزرار
  try {
    const exe = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath, ad = app.getPath("appData");
    const r = require("./shortcuts.js").repair({
      exe, aumid: AUMID,
      dirs: [
        { dir: path.join(ad, "Microsoft", "Internet Explorer", "Quick Launch", "User Pinned", "TaskBar"), depth: 0 },
        { dir: path.join(ad, "Microsoft", "Windows", "Start Menu", "Programs"), depth: 2 },
        { dir: app.getPath("desktop"), depth: 0 },
      ],
      readdir: (d) => fs.readdirSync(d, { withFileTypes: true }).map((e) => ({ name: e.name, isDir: e.isDirectory() })),
      read: (f) => shell.readShortcutLink(f), write: (f, op, d) => shell.writeShortcutLink(f, op, d),
      exists: (x) => { try { return fs.existsSync(x); } catch { return false; } },
      log: (...a) => console.log("[shortcuts]", ...a),
    });
    Object.assign(out, r);
    if (r.fixed) { try { require("child_process").execFile(path.join(process.env.SystemRoot || "C:\\Windows", "System32", "ie4uinit.exe"), ["-show"], { windowsHide: true }, () => {}); } catch {} }
    try { fs.appendFileSync(path.join(app.getPath("userData"), "shortcut-repair.log"), `${new Date().toISOString()} manual=${!!manual} exe=${exe} checked=${r.checked} fixed=${r.fixed} ${JSON.stringify(r.files)} ${r.errors.length ? "errors=" + JSON.stringify(r.errors) : ""}\n`); } catch {}
  } catch (e) { out.errors.push(String(e && e.message)); console.log("[shortcuts] failed:", e && e.message); }
  return out;
}
function repairShortcutsUi() {
  const r = repairShortcuts(true);
  const msg = r.fixed ? `اتصلّح ${r.fixed} اختصار. لو الأيقونة لسه بيضا في الشريط: كليك يمين عليها ← «إلغاء التثبيت من شريط المهام»، وبعدين ثبّتها تاني والبرنامج شغّال.`
    : r.checked ? "الاختصارات سليمة. لو الأيقونة لسه بيضا في الشريط: كليك يمين عليها ← «إلغاء التثبيت من شريط المهام»، وبعدين ثبّتها تاني والبرنامج شغّال."
    : "ما لقيتش اختصارات قديمة للبرنامج. لو شايف أيقونة بيضا في الشريط: كليك يمين عليها ← «إلغاء التثبيت من شريط المهام»، وبعدين ثبّت البرنامج تاني وهو شغّال.";
  try { if (Notification.isSupported()) new Notification({ title: "🔧 إصلاح أيقونة الشريط", body: msg, icon: ICON }).show(); } catch {}
  try { toShell("toast", msg); } catch {}
  return r;
}

// ================= النوافذ =================
function createMain() {
  mainWin = new BrowserWindow({
    width: 1400, height: 900, minWidth: 900, minHeight: 600, show: false, title: "Aqar Matrix — منصة العقارات",
    icon: WIN_ICON, backgroundColor: "#ffffff", autoHideMenuBar: true,
    webPreferences: { preload: path.join(APPDIR, "preload.js"), additionalArguments: ["--alaa-role=shell", `--alaa-engine=${ENGINE}`, `--alaa-version=${VERSION}`], contextIsolation: false, sandbox: false, backgroundThrottling: false },
  });
  Menu.setApplicationMenu(null);
  applyWinIdentity(mainWin);
  mainWin.loadFile(path.join(APPDIR, "shell.html"));
  mainWin.webContents.on("did-finish-load", () => { const v = store.get(["uiScale"]).uiScale; applyScale(v == null ? 1.1 : v); });
  mainWin.on("resize", () => { popClose(); layout(); });
  mainWin.on("blur", () => { if (popKind && Date.now() - popAt > 300) popClose(); });
  mainWin.on("maximize", layout);
  mainWin.on("unmaximize", layout);
  mainWin.webContents.on("before-input-event", keys);
  ctxmenu.attach(mainWin.webContents, { Menu, clipboard, BrowserWindow, win: mainWin, openUrl: (u) => openUrl(u, { active: true }) });
  mainWin.once("ready-to-show", () => { if (!START_HIDDEN || TEST) { mainWin.show(); if (!TEST) mainWin.maximize(); } layout(); });
  mainWin.on("session-end", () => { try { store && store.flush(); } catch {} }); // إطفاء/تسجيل خروج ويندوز: before-quit مش بيتبعت
  mainWin.on("close", (e) => {
    if (quitting) return;
    if (!appSettings.closeToTray) { quitting = true; setImmediate(() => { try { app.quit(); } catch {} }); return; } // من غير tray: نقفل البرنامج كله مش النافذة بس
    e.preventDefault();
    mainWin.hide();
    if (!appSettings.trayTipShown && Notification.isSupported()) {
      new Notification({ title: "Aqar Matrix لسه شغال 👑", body: "البرنامج اتصغّر جنب الساعة وبيكمل التحديث التلقائي. عشان تقفله خالص: كليك يمين على الأيقونة ← خروج.", icon: ICON }).show();
      appSettings.trayTipShown = true; saveSettings();
    }
  });

  // التابات الثابتة
  ensurePerm("home"); ensurePerm("dash");
  if (!LINK()) { ensurePerm("fb"); ensurePerm("wa"); ensurePerm("ig"); } // مربوط بسيرفر؟ السحب هناك، مش هنا
  activate(appSettings.welcomeDone ? PERM.dash.id : PERM.home.id);
}
function createBg() {
  bgWin = new BrowserWindow({ show: false, width: 400, height: 300, webPreferences: prefs("bg") });
  bgWin.loadFile(path.join(APPDIR, "bg.html"));
  { const lo = () => setPrio(bgWin.webContents, "low"); bgWin.webContents.on("did-finish-load", lo); bgWin.webContents.on("render-process-gone", () => setTimeout(lo, 3000)); setTimeout(lo, 1500); setInterval(lo, 60e3); }
  bgWin.webContents.on("render-process-gone", () => setTimeout(() => { if (!bgWin.isDestroyed()) bgWin.reload(); }, 2000));
}
function showMain() { if (!mainWin || mainWin.isDestroyed()) return; if (mainWin.isMinimized()) mainWin.restore(); mainWin.show(); mainWin.focus(); }
function createTray() {
  if (TEST) return;
  tray = new Tray(nativeImage.createFromPath(path.join(APPDIR, "tray.png")));
  tray.setToolTip("Aqar Matrix — منصة العقارات");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "افتح Aqar Matrix", click: showMain },
    { label: "🔄 حدّث دلوقتي", click: () => (LINK() ? linkRt({ type: "runAuto" }) : toBg({ type: "runAuto" })).catch(() => {}) },
    { label: "💾 احفظ كل حاجة", click: () => (LINK() ? linkRt({ type: "saveAll" }) : toBg({ type: "saveAll" })).catch(() => {}) },
    { label: "🔧 إصلاح أيقونة الشريط", click: repairShortcutsUi },
    { type: "separator" },
    { label: "خروج", click: () => { quitting = true; app.quit(); } },
  ]));
  tray.on("click", showMain);
  tray.on("double-click", showMain);
}
function showMenu() {
  Menu.buildFromTemplate([
    { label: "📥 استورد داتا الإضافة…", click: async () => { const r = await dialog.showOpenDialog(mainWin, { defaultPath: (findImport() || {}).path || app.getPath("downloads"), filters: [{ name: "JSON", extensions: ["json"] }], properties: ["openFile"] }); if (!r.canceled && r.filePaths[0]) { const x = importFile(r.filePaths[0]); toShell("toast", x.ok ? `✅ اتنقل ${x.posts} طلب/عرض و${x.comments} تعليق` : "❌ " + x.error); } } },
    { label: "📂 افتح فولدر النسخ الاحتياطية", click: () => shell.openPath(path.join(app.getPath("downloads"), "AlaaDealsExt")) },
    { label: "🗄 افتح فولدر الداتا", click: () => shell.openPath(store.dir) },
    { type: "separator" },
    { label: "يشتغل مع تشغيل الويندوز", type: "checkbox", checked: !!appSettings.openAtLogin, click: (m) => { appSettings.openAtLogin = m.checked; saveSettings(); applyLogin(); } },
    { label: "لما أقفل النافذة يفضل شغال جنب الساعة", type: "checkbox", checked: !!appSettings.closeToTray, click: (m) => { appSettings.closeToTray = m.checked; saveSettings(); } },
    { type: "separator" },
    { label: "تسجيل خروج فيسبوك", click: () => logout("fb") },
    { label: "تسجيل خروج إنستجرام", click: () => logout("ig") },
    { label: "تسجيل خروج واتساب", click: () => logout("wa") },
    { type: "separator" },
    { label: "🔧 إصلاح أيقونة الشريط (ورقة بيضا)", click: repairShortcutsUi },
    { label: "🔄 دوّر على تحديث", click: () => { checkUpdates(); toShell("toast", updState.msg || "بيدوّر..."); } },
    { label: `Aqar Matrix v${VERSION}`, enabled: false },
    { label: "خروج من البرنامج", click: () => { quitting = true; app.quit(); } },
  ]).popup({ window: mainWin });
}

app.on("second-instance", showMain);
// 👋 قفل البرنامج على جهاز في شبكة مزامنة: بنعلن للجهاز التاني (VPS) إننا مشينا وبنبعتله ده فورًا، فبياخد النشر/الواتساب/تليجرام في ثواني بدل ما يستنى ينتبه إننا وقعنا (كان دقيقة ونص)
let byeState = 0;
app.on("before-quit", (e) => {
  quitting = true;
  if (!byeState && !TEST && peerSync && bgWin && !bgWin.isDestroyed()) {
    let on = false; try { on = !!(PEERS().length || (appSettings.remote && appSettings.remote.enabled)); } catch {}
    if (on) {
      byeState = 1; e.preventDefault();
      const finish = () => { if (byeState === 2) return; byeState = 2; try { app.quit(); } catch {} };
      const cap = setTimeout(finish, 4000);
      (async () => {
        try { await Promise.race([toBg({ type: "xsBye" }), new Promise((r) => setTimeout(r, 1500))]); } catch {}
        try { peerSync.now(); } catch {}
        for (let i = 0; i < 24; i++) { await new Promise((r) => setTimeout(r, 150)); try { const inf = peerSync.info(); if (!inf.connected || !inf.pending) break; } catch { break; } }
        if (!PEERS().length) await new Promise((r) => setTimeout(r, 1500)); // سيرفر: الأجهزة المربوطة بتسحب منه بالبث (SSE) — نستنى لحظة يوصلهم
      })().finally(() => { clearTimeout(cap); finish(); });
      return;
    }
  }
 try { xf && xf.stop(); } catch {} try { store && store.flush(); } catch {} try { remoteSrv && remoteSrv.stop(); } catch {} try { workspaceSrv && workspaceSrv.stop(); } catch {} try { OCR.stop(); } catch {} });
app.on("window-all-closed", () => { if (quitting || TEST) app.quit(); });

app.whenReady().then(async () => {
  loadSettings();
  store = new Store(path.join(app.getPath("userData"), "data"));
  migratePeers(); const autoJoined = autoJoin();
  createMesh();
  if (autoJoined && !peerSync.isJoined()) peerSync.setMode("adopt"); // سيرفر جديد اتركّب بـjoin.txt/--join: ياخد كل حاجة من الشبكة
  alarms = new Alarms(path.join(app.getPath("userData"), "alarms.json"), function fire(a) {
    if (joiningNow()) return void setTimeout(() => fire(a), 15e3); // 🕸 جهاز جديد لسه بياخد الداتا القديمة من الشبكة — السحب يستنى
    const send = () => bgWin && !bgWin.isDestroyed() && bgWin.webContents.send("alarm:fire", a);
    if (bgReady) send(); else setTimeout(send, 5000);
  });
  setupSession();
  const testHook = TEST && process.env.ALAA_TEST_SCRIPT ? require(process.env.ALAA_TEST_SCRIPT) : null;
  if (testHook && testHook.setup) testHook.setup({ ses, app });
  setupIpc();
  applyLogin();
  if (!LINK()) createBg(); // مربوط بسيرفر: مفيش سحب ولا محرك على الجهاز ده — كله على السيرفر
  // 📱 سيرفر الموبايل (لو مفعّل)
  xf = require("./xfiles.js")({ dir: path.join(app.getPath("downloads"), "AlaaDealsExt"), net, getPeers: () => PEERS(), log: (...a) => console.log("[files]", ...a) });
  const workspaceOptions = { appDir: APPDIR, engineDir: ENGINE, version: VERSION, net, files: xf,
    getSettings: () => appSettings, saveSettings, status, chlog, mesh: peerSync, device: () => { const d = devInfo(); return { id: d.id, name: d.name }; },
    kv: { get: (k) => store.get(k), set: (o) => broadcast(store.set(o)), remove: (k) => broadcast(store.remove(k)), bytes: (k) => store.bytes(k), ver: (k) => (store.ver && store.ver.get(k)) || 0 },
    rt: (msg) => deliver(extTargets(), msg, { id: "alaa-deals", url: "remote://web" }).catch(() => undefined),
    alarm: (n) => alarms.get(n),
    open: (url) => openUrl(url, { active: false }),
    shot: screenOf,
    getDash: dashboardEngine };
  remoteSrv = require('./remote.js')(workspaceOptions);
  if (HAS_ANGULAR && !LINK()) {
    // A private loopback listener is independent of the optional LAN/mobile server.
    workspaceSrv = require('./remote.js')({...workspaceOptions,localOnly:true});
    const local = await workspaceSrv.start();
    if (!local.running) {
      dialog.showErrorBox('تعذّر فتح مساحة العمل',local.error || 'تعذّر تشغيل واجهة البرنامج المحلية.');
      quitting = true; app.quit(); return;
    }
    workspaceBase = `http://127.0.0.1:${local.port}`; workspaceCode = local.code;
  }
  createMain();
  createTray();
  setTimeout(() => { try { repairShortcuts(false); } catch {} }, 6000);
  if (LINK()) linkEvents(); else remoteSrv.autoStart();
  meshT0 = Date.now(); peerSync.start(); xf.start(); // 🕸 مزامنة كاملة مع كل الأجهزة المربوطة (أي عدد) — البرنامج شغال بالكامل هنا، والداتا والإعدادات والأوامر متزامنة
  pushXsState(); setInterval(pushXsState, 4000); // 🔁 هوية الجهاز + الوصلة (للتزامن العكسي للأوامر)
  // 🖥 على الـVPS/الجهاز: منع الويندوز يعلّق البرنامج وهو في الخلفية
  try { powerSaveBlocker.start("prevent-app-suspension"); } catch {}
  setInterval(checkWa, 15e3);
  setupUpdates();
  setTimeout(checkUpdates, 45e3);
  setInterval(checkUpdates, 6 * 36e5);
  setInterval(async () => toShell("status", await status()), 20e3);
  if (TEST) global.__alaa = { tabs, store, alarms, openUrl, activate, status, importFile, toBg, get remote() { return remoteSrv; }, setLink, addPeer, removePeer, peersApi, joinInfo, parseJoin, PEERS, linkRt, LINK, SYNC, get peer() { return peerSync; }, get mesh() { return peerSync; }, chlog, get lastNotif() { return lastNotif; }, notifCreate: (id, o) => { lastNotif = { id, title: o.title, message: o.message, at: Date.now() }; if (remoteSrv) remoteSrv.notify(lastNotif); }, get mainWin() { return mainWin; }, get bgWin() { return bgWin; } };
  if (testHook) testHook.run(global.__alaa, { ses, app }).then(() => { store.flush(); app.exit(0); }, (e) => { console.error('TEST FAIL', e); app.exit(1); });
});
