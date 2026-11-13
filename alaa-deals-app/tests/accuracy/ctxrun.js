// v10.71.4: قايمة الكليك يمين (منطق صافي + ربط بحدث context-menu بنسخة وهمية من webContents)
const { EventEmitter } = require("events");
const path = require("path");
const cm = require(path.join(__dirname, "../../app/ctxmenu.js"));
let ok = 0, tot = 0;
const T = (name, cond) => { tot++; if (cond) ok++; else console.log("✗", name); };
const L = (t) => t.filter((x) => x.type !== "separator").map((x) => x.label + (x.enabled === false ? "-" : ""));
// خانة كتابة فاضية (فيها حافظة): لصق شغال، نسخ/قص مقفولين
let t = cm.template({ isEditable: true, selectionText: "", editFlags: { canUndo: false, canRedo: false, canCut: false, canCopy: false, canPaste: true, canDelete: false, canSelectAll: true } });
T("editable-empty", L(t).join("|") === "تراجع-|إعادة-|قص-|نسخ-|لصق|لصق كنص عادي|حذف-|تحديد الكل");
// خانة كتابة فيها نص محدد
t = cm.template({ isEditable: true, selectionText: "abc", editFlags: { canUndo: true, canRedo: false, canCut: true, canCopy: true, canPaste: true, canDelete: true, canSelectAll: true } });
T("editable-sel", L(t).join("|") === "تراجع|إعادة-|قص|نسخ|لصق|لصق كنص عادي|حذف|تحديد الكل");
// نص عادي محدد في الصفحة
t = cm.template({ isEditable: false, selectionText: "شقة 150 متر", editFlags: { canSelectAll: true } });
T("page-sel", L(t).join("|") === "نسخ|تحديد الكل");
t = cm.template({ isEditable: false, selectionText: "", editFlags: {} });
T("page-nosel", L(t).join("|") === "نسخ-|تحديد الكل");
// رابط
t = cm.template({ isEditable: false, linkURL: "https://facebook.com/groups/1", selectionText: "" });
T("link", L(t).join("|") === "نسخ-|فتح الرابط|نسخ الرابط|تحديد الكل");
t = cm.template({ isEditable: false, linkURL: "tel:01012345678" });
T("tel", L(t).includes("نسخ الرابط") && !L(t).includes("فتح الرابط") && t.find((x) => x.label === "نسخ الرابط").arg === "01012345678");
// صورة
t = cm.template({ isEditable: false, mediaType: "image", srcURL: "https://x.com/a.png" });
T("img", L(t).includes("نسخ الصورة") && L(t).includes("نسخ رابط الصورة"));
t = cm.template({ isEditable: false, mediaType: "image", srcURL: "data:image/png;base64,AAAA" });
T("img-data", !L(t).includes("نسخ رابط الصورة"));
// الربط
let popped = null, wrote = null, opened = null, called = [];
const wc = new EventEmitter(); for (const k of ["undo", "redo", "cut", "copy", "paste", "pasteAndMatchStyle", "delete", "selectAll"]) wc[k] = () => called.push(k);
wc.copyImageAt = (x, y) => called.push("img@" + x + "," + y);
const Menu = { buildFromTemplate: (items) => ({ popup: (o) => { popped = { items, o }; } }) };
cm.attach(wc, { Menu, clipboard: { writeText: (s) => { wrote = s; } }, BrowserWindow: { fromWebContents: () => "W" }, win: "M", openUrl: (u) => { opened = u; } });
wc.emit("context-menu", {}, { isEditable: true, selectionText: "x", editFlags: { canCut: true, canCopy: true, canPaste: true, canUndo: true, canRedo: true, canDelete: true, canSelectAll: true } });
T("popup", popped && popped.o.window === "W" && popped.items.length === 10);
popped.items.find((i) => i.label === "لصق").click(); popped.items.find((i) => i.label === "نسخ").click(); popped.items.find((i) => i.label === "تحديد الكل").click();
T("clicks", called.join() === "paste,copy,selectAll");
wc.emit("context-menu", {}, { isEditable: false, linkURL: "https://a.com/x", x: 5, y: 6 });
popped.items.find((i) => i.label === "نسخ الرابط").click(); popped.items.find((i) => i.label === "فتح الرابط").click();
T("link-actions", wrote === "https://a.com/x" && opened === "https://a.com/x");
wc.emit("context-menu", {}, { isEditable: false, mediaType: "image", srcURL: "https://a/i.png", x: 7, y: 8 });
popped.items.find((i) => i.label === "نسخ الصورة").click();
T("copyImage", called.includes("img@7,8"));
console.log(`قايمة الكليك يمين: ${ok}/${tot}`);
if (ok !== tot) process.exitCode = 1;
