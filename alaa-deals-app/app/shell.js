// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
const A = window.alaaApp;
const $ = (id) => document.getElementById(id);
let TABS = [], ST = null;

function toast(t, ms = 3500) { const el = $("toast"); el.textContent = t; el.style.display = "block"; clearTimeout(toast.t); toast.t = setTimeout(() => (el.style.display = "none"), ms); }
const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const cleanTitle = (t) => String(t || "").replace(/^\(\d+\+?\)\s*/, "").replace(/\s*[|\-–—]\s*(Facebook|Instagram|WhatsApp|فيسبوك)\s*$/i, "").trim() || "صفحة";
function splitIcon(title) { const m = String(title || "").match(/^(\S+)\s+(.+)$/); return m && !/[\w؀-ۿ]/.test(m[1]) ? [m[1], m[2]] : ["", String(title || "")]; }
// ====== الشريط اللي فوق: صفحتين ثابتين + قايمتين منسدلتين (المنصات / الصفحات) ======
const PLAT = [{ k: "fb", ic: "📘", n: "فيسبوك", key: "Ctrl+3" }, { k: "wa", ic: "🟢", n: "واتساب", key: "Ctrl+4" }, { k: "ig", ic: "📸", n: "إنستجرام", key: "Ctrl+5" }];
const auxTitle = (t) => cleanTitle(splitIcon(t.title)[1]);
function shortUrl(u) { let x; try { x = new URL(u); } catch { return String(u || "").slice(0, 64); } let p = x.pathname + x.search; try { p = decodeURIComponent(p); } catch {} return (x.hostname.replace(/^(www|web|m)\./, "") + p).replace(/\/$/, "").slice(0, 64); }
// حالة كل منصة (لون + كلام) — بتتحسب هنا وبتتبعت للقايمة
function platState(k) {
  const s = ST;
  if (!s) return { st: "", text: "بيتحقق…" };
  if (k === "fb") return s.fb ? { st: "ok", text: "متسجّل دخول" + (s.linked ? " (على السيرفر)" : "") } : { st: "bad", text: s.linked ? "لسه ما سجّلتش دخول على السيرفر" : "لسه ما سجّلتش دخول — دوس وادخل" };
  if (k === "wa") return s.wa === "in" ? { st: "ok", text: "شغال" } : s.wa === "qr" ? { st: "bad", text: "امسح الـ QR من موبايلك" } : { st: "warn", text: "بيحمّل…" };
  return s.ig ? { st: "ok", text: "متسجّل دخول" } : { st: "", text: "مش متسجّل (اختياري)" };
}
// بنغيّر محتوى الأيقونة بس لما يتغيّر فعلًا (عشان ما يرمرمش)
function setIc(el, key, html) { if (el._k !== key) { el._k = key; el.innerHTML = html; } }
function renderTabs(list) {
  TABS = list;
  const aux = list.filter((t) => t.kind === "aux" && !t.auto); // 🕶 10.80.51: تابات السحب/النشر/الواتساب التلقائية شغّالة في الخلفية ومش بتظهر هنا خالص
  for (const [id, k] of [["tHome", "home"], ["tDash", "dash"]]) { const t = list.find((x) => x.kind === k); $(id).classList.toggle("on", !!(t && t.active)); }
  const pa = list.find((t) => t.active && PLAT.some((p) => p.k === t.kind)), pl = pa && PLAT.find((p) => p.k === pa.kind);
  $("ddPlat").classList.toggle("on", !!pl); setIc($("platIc"), pl ? pl.k : "-", pl ? platBadge(pl.k) : "🌐"); $("platTxt").textContent = pl ? pl.n : "المنصات";
  const act = aux.find((t) => t.active), manual = aux.length;
  $("pagesBox").classList.toggle("has", aux.length > 0);
  $("ddPages").classList.toggle("on", !!act);
  $("pagesTxt").textContent = act ? auxTitle(act) : "الصفحات"; $("pagesTxt").title = act ? auxTitle(act) : "";
  setIc($("pagesIc"), act && act.loading ? "l" : "p", act && act.loading ? '<span class="spin"></span>' : "📑");
  $("pagesN").textContent = String(aux.length); $("pagesN").classList.remove("auto");
  $("ddPages").title = `${aux.length} صفحة مفتوحة — دوس تشوفهم كلهم`;
  const a = list.find((t) => t.active);
  document.body.classList.toggle("compact", !!a && (a.kind === "dash" || a.kind === "home"));
  if (a) {
    const local = a.url.startsWith("file:");
    $("addr").value = local ? "" : a.url;
    $("addr").placeholder = local ? (a.kind === "dash" ? "📊 لوحة التحكم — كل الطلبات والعروض والعملاء" : "🏠 صفحة البداية") : "";
    $("addr").disabled = local;
    $("back").disabled = !a.canBack; $("fwd").disabled = !a.canFwd;
  }
  repop();
}
function fit() {
  const w = window.innerWidth;
  document.body.classList.toggle("mid", w < 1080);
  document.body.classList.toggle("narrow", w < 860);
}
window.addEventListener("resize", fit);
fit();

// ====== القوايم المنسدلة: بتتفتح كنافذة طافية فوق الصفحة (main.js) وبنفس ألوان الثيم ======
let POP = null;
function themePayload() {
  const cs = getComputedStyle(document.body), vars = {};
  for (const v of ["--bg", "--bg2", "--line", "--ink", "--mute", "--gold", "--brand", "--green", "--red", "--amber", "--a1", "--a2", "--a3", "--on", "--acc", "--soft", "--sgb", "--sgy", "--sgg", "--sgr", "--sgi", "--sgp", "--sgp2", "--lga", "--lgb"]) { const x = cs.getPropertyValue(v).trim(); if (x) vars[v] = x; }
  return { cls: document.body.className, vars };
}
function popData(kind) {
  const th = themePayload();
  if (kind === "plat") { const cur = (TABS.find((t) => t.active) || {}).kind; return { kind, th, items: PLAT.map((p) => ({ k: p.k, ic: p.ic, n: p.n, key: p.key, on: cur === p.k, ...platState(p.k) })) }; }
  return { kind, th, items: TABS.filter((t) => t.kind === "aux" && !t.auto).map((t) => ({ id: t.id, title: auxTitle(t), url: shortUrl(t.url), auto: !!t.auto, on: !!t.active, loading: !!t.loading })) };
}
function repop() {
  if (!POP) return;
  if (POP === "pages" && !TABS.some((t) => t.kind === "aux" && !t.auto)) { A.call("popClose"); return; }
  A.send("popData", popData(POP));
}
function openDd(kind) {
  const r = $(kind === "plat" ? "ddPlat" : "ddPages").getBoundingClientRect();
  return A.call("popOpen", { kind, rect: { left: r.left, right: r.right, top: r.top, bottom: r.bottom }, maxH: Math.max(180, window.innerHeight - r.bottom - 14), data: popData(kind) });
}
A.on("popState", (k) => {
  POP = k;
  for (const [id, kk] of [["ddPlat", "plat"], ["ddPages", "pages"]]) { $(id).classList.toggle("open", k === kk); $(id).setAttribute("aria-expanded", String(k === kk)); }
});
for (const id of ["ddPlat", "ddPages"]) $(id).addEventListener("keydown", (e) => { if (e.key === "ArrowDown") { e.preventDefault(); openDd($(id).dataset.dd); } });
const mins = (t) => Math.max(0, Math.round((t - Date.now()) / 6e4));
const ago = (t) => { const m = Math.round((Date.now() - t) / 6e4); return m < 1 ? "لسه حالًا" : m < 60 ? `من ${m} د` : `من ${Math.round(m / 60)} س`; };
const hrs = (h) => ({ 0.5: "نص ساعة", 1: "ساعة", 2: "ساعتين" })[+h] || `${esc(h)} ساعات`;
function renderStatus(s) {
  ST = s;
  const dot = (id, k) => { const p = platState(k); $(id).className = p.st; };
  dot("dFb", "fb"); dot("dWa", "wa"); dot("dIg", "ig");
  $("ddPlat").title = PLAT.map((p) => `${p.n}: ${platState(p.k).text}`).join("\n");
  const a = s.auto;
  let t;
  if (!a.enabled) t = "⏸ التحديث التلقائي متوقف";
  else t = `🔄 كل <b>${hrs(a.hours || 0.5)}</b>` + (a.last && a.last.startedAt ? ` · آخر تحديث ${ago(a.last.finishedAt || a.last.startedAt)}` : "") + (a.next ? ` · الجاي بعد <b>${mins(a.next)} د</b>` : "");
  if (s.linked) t = (s.linked.ok ? `<span title="البرنامج ده مربوط بالسيرفر ${esc(s.linked.addr)} — السحب والداتا هناك">🔗 <b>السيرفر</b></span> · ` : `<span title="${esc(s.linked.error)}">🔴 <b>السيرفر مش متصل</b></span> · `) + t;
  if (s.sync) { const sy = s.sync, sp = sy.srvPosts, lp = s.counts.posts, N = (n) => Number(n || 0).toLocaleString("ar-EG-u-nu-latn"), vdiff = sy.srvVersion && s.version && sy.srvVersion !== s.version;
    const mesh = sy.total > 1 ? `🕸 ${sy.up}/${sy.total} · ` : "", state = sy.connected ? (!sy.synced ? "⏳ <b>بياخد الداتا القديمة من الشبكة…</b>" : sp == null ? mesh + "🔁 <b>متزامن</b>" : sp - lp > 2 ? mesh + `🔁 <b>بيزامن ${N(lp)} من ${N(sp)}</b>` : mesh + `🔁 <b>متزامن ✅ ${N(lp)}</b>`) : "";
    t = (sy.connected ? `<span data-resync style="cursor:pointer" title="مزامنة كاملة مع ${sy.total > 1 ? esc(sy.total) + " أجهزة" : esc(sy.addr)} — السيرفر ${sp == null ? "؟" : N(sp)} بوست · هنا ${N(lp)} بوست — دوس عشان تعمل مزامنة كاملة من الأول">${state}</span> · ` : `<span title="${esc(sy.error)}">🟠 <b>المزامنة واقفة</b></span> · `)
      + (vdiff ? `<span title="نسخة السيرفر ${esc(sy.srvVersion)} ونسخة البرنامج ${esc(s.version)} — لازم يتساووا عشان الأرقام والتطابق يطلعوا زي بعض">⚠️ <b>نسخة السيرفر ${esc(sy.srvVersion)}</b></span> · ` : "") + t; }
  $("autoTxt").innerHTML = t;
  repop();
  $("counts").innerHTML = `📦 <b>${s.counts.posts.toLocaleString("ar-EG-u-nu-latn")}</b> طلب/عرض · 💬 <b>${s.counts.comments.toLocaleString("ar-EG-u-nu-latn")}</b> تعليق`;
}
async function refreshStatus() { refreshStatus.at = Date.now(); renderStatus(await A.call("status")); }

document.addEventListener("click", async (e) => {
  if (e.target.closest("[data-resync]")) { toast("🔄 بيعمل مزامنة كاملة مع السيرفر…"); const ok = await A.call("resync").catch(() => false); setTimeout(refreshStatus, 3000); return toast(ok ? "🔄 المزامنة الكاملة بدأت — الأرقام هتتساوى خلال ثواني" : "المزامنة مش شغالة — اربط البرنامج بالسيرفر الأول"); }
  const dd = e.target.closest("[data-dd]"); if (dd) return openDd(dd.dataset.dd);
  const t = e.target.closest(".tab[data-id]"); if (t) return A.call("activate", +t.dataset.id);
});
$("back").onclick = () => A.call("nav", "back");
$("fwd").onclick = () => A.call("nav", "forward");
$("reload").onclick = () => A.call("nav", "reload");
$("home").onclick = () => A.call("nav", "home");
$("menu").onclick = () => A.call("menu");
$("addr").addEventListener("keydown", (e) => { if (e.key === "Enter") { let u = e.target.value.trim(); if (!/^https?:\/\//.test(u)) u = "https://" + u; A.call("go", u.replace(/^http:/, "https:")); } });
$("runNow").onclick = async () => { await A.call("runNow"); toast(ST && ST.linked ? "🔄 السيرفر بدأ يسحب الجديد — تقدر تقفل الجهاز ده عادي" : "🔄 بدأ يسحب الجديد من الجروبات…"); setTimeout(refreshStatus, 1500); };
$("save").onclick = async () => {
  $("save").disabled = true; $("save").innerHTML = "⏳ <span class=lb>بيحفظ…</span>";
  const r = await A.call("save");
  $("save").disabled = false; $("save").innerHTML = "💾 <span class=lb>Save</span>";
  if (r && r.ok) { const f = r.r && r.r.file; toast(f && !f.error ? `💾 اتحفظ كل حاجة — ${f.posts} طلب/عرض · ${f.comments} تعليق (التحميلات ← AlaaDealsExt)` : "💾 اتحفظ"); }
  else toast("❌ ما اتحفظش: " + ((r && r.error) || "حاول تاني"));
};

A.on("tabs", renderTabs);
A.on("status", renderStatus);
A.on("toast", (t) => toast(t, 5000));
// 🕶 السحب بيغيّر posts/comments/autoLog كل ثانية — مش هنحسب الحالة كل مرة (كان بيسحب من معالج البرنامج ويقطّع)، مرة كل ١٠ ثواني بالكتير
chrome.storage.onChanged.addListener((c) => {
  if (!(c.autoLog || c.autoCfg || c.posts || c.comments)) return;
  const wait = c.autoCfg ? 400 : Math.max(400, 10e3 - (Date.now() - (refreshStatus.at || 0)));
  clearTimeout(refreshStatus.t); refreshStatus.t = setTimeout(refreshStatus, wait);
});
A.call("tabs").then(renderTabs);
refreshStatus();
setInterval(refreshStatus, 30e3);

// 🎨 نفس شكل لوحة التحكم
const SHELL_PALS = { nile: ["#F5D88A", "#E3B04B", "#B9801F", "#8A5A06", ["#061116", "#0A1D24", "#1F414C"], ["#061116", "#0A1D24", "#1F414C"]], tech: ["#2dd4bf", "#60a5fa", "#a78bfa", "#0f766e"], gold: ["#f6c453", "#eea23e", "#e0784a", "#a15c07"], emerald: ["#34d399", "#10b981", "#a3e635", "#047857"],
  ocean: ["#38bdf8", "#3b82f6", "#6366f1", "#1d4ed8"], sunset: ["#fb7185", "#fb923c", "#fbbf24", "#be123c"], royal: ["#c084fc", "#818cf8", "#f472b6", "#7e22ce"],
  // الثيمات: + [خلفية/خلفية2/خط] للغامق و[...] للفاتح + لون الكلام على الزرار
  cyberneon: ["#00f0ff", "#7c3aed", "#ff2bd6", "#6d28d9", ["#05060a", "#0b0e1a", "#16233a"], ["#ffffff", "#f2f4ff", "#dcd8fb"]],
  glass: ["#8b93ff", "#ff7ac6", "#5ee7df", "#4f46e5", ["#0d0f22", "#151933", "#262b52"], ["#fbfaff", "#f4f1ff", "#e3defa"], "#fff"],
  blueprint: ["#ffd166", "#ffe29a", "#fff4cf", "#1d4ed8", ["#0a3159", "#0d3e6f", "#2a5f94"], ["#ffffff", "#f2f7ff", "#c6d9f2"], "#0b2545"],
  luxe: ["#f7dc8f", "#d4a94c", "#9c7a31", "#8a6516", ["#0b0b0c", "#131315", "#2b2720"], ["#fffdf7", "#f7f1e3", "#e8dcc1"]],
  desert: ["#e07a5f", "#e9a868", "#81b29a", "#b4532e", ["#1a1410", "#231b15", "#3a2e23"], ["#fffaf2", "#f4ecdf", "#e9dbc5"]],
  mono: ["#f5f5f5", "#d4d4d4", "#f5f5f5", "#111111", ["#0d0d0d", "#151515", "#2a2a2a"], ["#ffffff", "#f3f3f3", "#e4e4e4"]],
  candy: ["#ff8fab", "#c3a6ff", "#7cc8ff", "#c2185b", ["#1a1222", "#231830", "#3b2a4d"], ["#ffffff", "#fff0f6", "#f5d8e7"]],
  pharaoh: ["#f0c75e", "#2ec4b6", "#e07a3f", "#1f3a8a", ["#0b1a3a", "#10244d", "#23407a"], ["#fbf5e4", "#f2e7cc", "#e0cfa3"]],
/*T45-BEGIN*/
  lapis: ["#8DB8FF", "#6A9EF5", "#4F83DE", "#1F4FA0", ["#0B1626", "#11223A", "#243C5E"], ["#EEF2F7", "#FFFFFF", "#D5DEEA"], ["#07132A", "#FFFFFF"], ["#2C62BE", "#1F4FA0", "#17376F"]],
  limestone: ["#9BD0B3", "#7DBE9B", "#5FA583", "#2F6B4F", ["#141916", "#1B221E", "#2E3A33"], ["#F1F0EC", "#FBFBF9", "#E2E0D8"], ["#0E1B14", "#FFFFFF"], ["#3E8061", "#2F6B4F", "#245640"]],
  horizon: ["#F7C9A3", "#F2B58A", "#E58BA0", "#5A3FB0", ["#14172A", "#1D2140", "#2E3460"], ["#F6F0F3", "#FFFFFF", "#E6DCEA"], ["#2A1A12", "#FFFFFF"], ["#7E63D1", "#6A4FC0", "#B24A72"]],
  stillnight: ["#A8DCC2", "#8FCBAE", "#74B696", "#1C6B72", ["#171D22", "#20282E", "#2F3A42"], ["#EEF1F3", "#FFFFFF", "#D8E0E3"], ["#0F2119", "#FFFFFF"], ["#1F7C85", "#1C6B72", "#14565C"]],
  buildsite: ["#FFD233", "#F5B800", "#E39B00", "#7A5300", ["#16181B", "#1F2226", "#353A41"], ["#E8E8E4", "#FFFFFF", "#CFCFC8"], ["#1A1400", "#1A1400"], ["#FFC823", "#F5B800", "#E39B00"]],
  redsea: ["#5EE0E0", "#3CCBD0", "#2AAFC0", "#0A6A75", ["#08242B", "#0D3039", "#1B4C59"], ["#EAF6F6", "#FFFFFF", "#CFE6E7"], ["#06262B", "#FFFFFF"], ["#0B7E88", "#0A7480", "#0A5F70"]],
  pomegranate: ["#FFA9C4", "#F58AAB", "#E0689A", "#8E1B4A", ["#1B0F18", "#26141F", "#46263A"], ["#FAF1F4", "#FFFFFF", "#EBD3DB"], ["#2A0A18", "#FFFFFF"], ["#B02A5B", "#94204B", "#7A183E"]],
  notebook: ["#FBEA8F", "#F6E27A", "#E8C95A", "#2438A0", ["#1E2B29", "#273837", "#3C5654"], ["#F2F4F7", "#FFFEFB", "#D9DDE6"], ["#1F2A10", "#FFFFFF"], ["#3B5BDB", "#2F4AC0", "#2438A0"]],
  qahwa: ["#EDBF93", "#DDA56E", "#C58A52", "#74411E", ["#1A1411", "#251C17", "#35291F"], ["#EFE6DD", "#FAF5EF", "#E3D6C8"], ["#2A1608", "#FFFFFF"], ["#8A5230", "#75421F", "#5F3416"]],
  lavender: ["#CBBBFF", "#B4A0FB", "#9C86F0", "#553AB3", ["#15122A", "#1D1A38", "#36315E"], ["#F2F0F8", "#FFFFFF", "#DEDAEE"], ["#1B1040", "#FFFFFF"], ["#7A5CD6", "#6544C6", "#5236AB"]],
  inkstamp: ["#FF9A8D", "#FF7566", "#EE5646", "#B3261E", ["#0F0F10", "#181819", "#3A3A3E"], ["#F5F5F2", "#FFFFFF", "#C9C9C2"], ["#220806", "#FFFFFF"], ["#C62F25", "#B3261E", "#8F1A14"]],
  neon: ["#FF6BD6", "#A98BFF", "#3DDCF5", "#7B2FD6", ["#0A0716", "#130E27", "#3A2A66"], ["#F4F0FF", "#FFFFFF", "#DCD2F5"], ["#10061E", "#FFFFFF"], ["#C71F94", "#6D3FE0", "#0A7C99"]],
  deco: ["#F7E19B", "#E2B947", "#C99A2E", "#7A5707", ["#0C0B09", "#15130E", "#4A3E1E"], ["#F6F1E4", "#FFFDF7", "#DCCFA9"], ["#1A1203", "#FFFFFF"], ["#966A0C", "#8A6409", "#6B4C06"]],
  khan: ["#FFD27A", "#FF9A6B", "#F0609B", "#0B6572", ["#081C24", "#0F2B36", "#24526A"], ["#F6EEDD", "#FFFAF0", "#E3D2AE"], ["#1E0E06", "#FFFFFF"], ["#0F7C8C", "#0B6572", "#084E58"]],
  nubian: ["#FFC15E", "#FF8A4C", "#F0507F", "#A8340A", ["#17110F", "#231A16", "#4A3528"], ["#FBF1E3", "#FFFBF4", "#EAD3B4"], ["#230E04", "#FFFFFF"], ["#C2410C", "#A8340A", "#7C2506"]],
  oasis: ["#C6F36B", "#4ADE9A", "#1FB8A5", "#0F7449", ["#06201A", "#0C2D25", "#1F5646"], ["#EDF7F1", "#FFFFFF", "#CDE6D8"], ["#04170F", "#FFFFFF"], ["#12814F", "#0F7449", "#0A5C3A"]],
  carbon: ["#FF7A66", "#FF4B3E", "#F0322A", "#B71C23", ["#0D0E10", "#16181B", "#30343A"], ["#E9EBEE", "#FFFFFF", "#CBD0D6"], ["#1A0504", "#FFFFFF"], ["#D4232B", "#B71C23", "#8E141A"]],
  frost: ["#C8E8FF", "#8EC8F5", "#9DB6F2", "#1E63B8", ["#0C1622", "#132235", "#2C4666"], ["#E8F1FA", "#FFFFFF", "#CFE0F1"], ["#07182A", "#FFFFFF"], ["#2A70C8", "#1E63B8", "#164C93"]],
  mango: ["#FFD166", "#FF9A4A", "#FF5C8A", "#B03A08", ["#1E0F16", "#2B1620", "#55293D"], ["#FFF4E6", "#FFFFFF", "#FFE0BF"], ["#2A0C05", "#FFFFFF"], ["#CF4909", "#C2410C", "#A8340A"]],
  pearl: ["#EDE4FF", "#CFE0FF", "#FFE3D6", "#262A33", ["#121316", "#1A1C20", "#2E3238"], ["#F6F6F8", "#FFFFFF", "#E4E6EB"], ["#14161A", "#FFFFFF"], ["#3A3F4B", "#262A33", "#14161B"]],
  matrix: ["#39FF88", "#1FE872", "#16C95E", "#087236", ["#020805", "#07130C", "#16623A"], ["#EDF6F0", "#FFFFFF", "#B9D6C4"], ["#02140A", "#FFFFFF"], ["#0A8440", "#087236", "#065B2B"]],
  cyber: ["#FCEE09", "#00F0FF", "#FF2A6D", "#A8005A", ["#0A0A12", "#12121F", "#3B3B63"], ["#FFF8D2", "#FFFFFF", "#E3D68A"], ["#0A0A12", "#FFFFFF"], ["#D6006B", "#00677A", "#5E1CC4"]],
  redteam: ["#FF6B6B", "#FF4D55", "#F04452", "#A5101F", ["#0B0708", "#160E10", "#552128"], ["#F6F0F0", "#FFFFFF", "#E2CED0"], ["#1A0507", "#FFFFFF"], ["#C4162A", "#A5101F", "#7F0B17"]],
  soc: ["#3DDCFF", "#22B8F2", "#3C93FF", "#0A5E96", ["#050C17", "#0B1627", "#1F3D66"], ["#E9F1F8", "#FFFFFF", "#C6D8E9"], ["#04101E", "#FFFFFF"], ["#0877B8", "#0A5E96", "#0B4676"]],
  crt: ["#FFB000", "#FF9A1F", "#FF8433", "#8F4A00", ["#0E0904", "#181009", "#61400F"], ["#F4E8D0", "#FFF8E8", "#DDC697"], ["#1A0F00", "#FFFFFF"], ["#A85A00", "#8F4A00", "#6E3800"]],
  ghost: ["#FFFFFF", "#E2E2E2", "#C8C8C8", "#111111", ["#070707", "#101010", "#303030"], ["#F1F1F1", "#FFFFFF", "#D6D6D6"], ["#0A0A0A", "#FFFFFF"], ["#2B2B2B", "#1B1B1B", "#000000"]],
  darkweb: ["#C79BFF", "#A66BFF", "#7CFFB2", "#5E1BB5", ["#09050F", "#130C21", "#3F2770"], ["#F2EDFA", "#FFFFFF", "#D9CBF0"], ["#0C0618", "#FFFFFF"], ["#7A2CD8", "#5E1BB5", "#3E1080"]],
  code: ["#82AAFF", "#C792EA", "#A8E070", "#2B58C4", ["#0E1016", "#171A22", "#323849"], ["#F3F4F8", "#FFFFFF", "#D8DDE8"], ["#0B0E16", "#FFFFFF"], ["#2B58C4", "#7B3FC4", "#1F7A3A"]],
  bios: ["#FFFF55", "#55FFFF", "#7CFF7C", "#0000AA", ["#00005E", "#00007A", "#5A5AFF"], ["#C6C6C6", "#E6E6E6", "#00007A"], ["#00003A", "#FFFFFF"], ["#0000AA", "#006666", "#7A0A7A"]],
  synth: ["#FF5CCB", "#FF9A3D", "#FFE14D", "#A8127F", ["#0D0221", "#180638", "#5A2299"], ["#F8EEFF", "#FFFFFF", "#E0C8F5"], ["#1A0630", "#FFFFFF"], ["#C2108F", "#B84A0F", "#7A2FD0"]],
  aqar: ["#EBCB78", "#D4AE5A", "#B8892D", "#8A6417", ["#0B1626", "#112038", "#2A3E5F"], ["#F2F5FA", "#FFFFFF", "#D3DBE8"], ["#0B1626", "#FFFFFF"], ["#12335E", "#B8892D", "#8A6417"]],
  araab: ["#6FE3E8", "#25BEC8", "#0F8E9B", "#0E7C86", ["#0C1E24", "#112A31", "#26474F"], ["#EDF3F2", "#FFFFFF", "#D2E0DE"], ["#032A30", "#FFFFFF"], ["#1E9FAB", "#0E7C86", "#0A5A63"]],
  sign: ["#FFD25A", "#5B94F2", "#2F6FDE", "#0B4FC2", ["#0D1117", "#161C25", "#3A4658"], ["#E6E9ED", "#FFFFFF", "#C2C9D2"], ["#0D1117", "#FFFFFF"], ["#FFC20E", "#0B4FC2", "#083A91"]],
/*T45-END*/
};
let shSkin = "sign", shMode = "light", shSgv = "azure"; // 10.80.49: لون واحد/لونين (24 لون) — الأساسي azure
const sgvNorm = (id) => { try { const L = (window.SGV && window.SGV.list) || []; return L.some((v) => v.id === id) ? id : ((window.SGV && window.SGV.def) || "azure"); } catch { return "azure"; } };
const sgvTok = (rm) => { try { const L = (window.SGV && window.SGV.list) || []; const x = L.find((v) => v.id === shSgv) || L[0]; return x && x.tok ? x.tok[rm] : null; } catch { return null; } };
function shellSkin(s, m) {
  if (m !== undefined) shMode = m || "light"; // الشكل ثابت «اللافتة»: أي شكل قديم متخزّن بيتتجاهل
  const k = "sign"; shSkin = k; const b = document.body;
  const p = SHELL_PALS[k], rm = shMode === "auto" ? ((h) => h >= 6 && h < 18 ? "light" : "dark")(new Date().getHours()) : shMode;
  for (const x of ["plan", "nile", "pro", "studio"]) b.classList.toggle("skin-" + x, p ? x === "studio" : x === k);
  b.classList.toggle("m-light", !!p && rm === "light" && k !== "nile"); b.classList.toggle("pal-nile", k === "nile"); b.classList.toggle("pal-araab", k === "araab"); b.classList.toggle("pal-aqar", false); b.classList.toggle("sign", true);
  const V = ["--a1", "--a2", "--a3", "--acc", "--bg", "--bg2", "--line", "--on", "--ink", "--mute", "--soft", "--sgb", "--sgy", "--sgg", "--sgr", "--sgi", "--sgp", "--sgp2", "--lga", "--lgb"]; V.forEach((v) => b.style.removeProperty(v));
  if (p) {
    let [a1, a2, a3] = rm === "light" && p[7] ? p[7] : p; if (k === "mono" && rm === "light") a1 = a2 = a3 = "#111111";
    b.style.setProperty("--a1", a1); b.style.setProperty("--a2", a2); b.style.setProperty("--a3", a3); b.style.setProperty("--acc", p[3]);
    if (Array.isArray(p[6])) b.style.setProperty("--on", p[6][rm === "dark" ? 0 : 1]);
    const bg = p[rm === "dark" ? 4 : 5]; if (bg) { b.style.setProperty("--bg", bg[0]); b.style.setProperty("--bg2", bg[1]); b.style.setProperty("--line", bg[2]); }
  }
  // 10.64: شكل اللافتة المختار (الأصلي مفيهوش تغيير — بيفضل زي ما كان بالظبط)
  const tk = sgvTok(rm);
  if (tk) { const S = (k, v) => b.style.setProperty(k, v); S("--a1", tk.a[0]); S("--a2", tk.a[1]); S("--a3", tk.a[2]); S("--acc", tk.acc); S("--bg", tk.bg); S("--bg2", tk.bg2); S("--line", tk.line); S("--on", tk.on); S("--ink", tk.ink); S("--mute", tk.mute); S("--soft", tk.soft); S("--sgb", tk.sgb); S("--sgy", tk.sgy); S("--sgg", tk.sgg); S("--sgr", tk.sgr); S("--sgi", tk.sgi); S("--sgp", tk.sgb); S("--sgp2", tk.pd); S("--lga", tk.lga); S("--lgb", tk.lgb); }
  b.dataset.sgv = shSgv;
}
chrome.storage.local.get(["uiSkin", "uiMode", "uiSkinPicked", "uiSkinV", "uiSgv"]).then((o) => { shSgv = sgvNorm(o.uiSgv); shellSkin("sign", o.uiMode || "light"); });
chrome.storage.onChanged.addListener((c) => { if (c.uiSgv) { shSgv = sgvNorm(c.uiSgv.newValue); shellSkin(); } });
chrome.storage.onChanged.addListener((c) => { if (c.uiSkin || c.uiMode) shellSkin(c.uiSkin ? c.uiSkin.newValue : undefined, c.uiMode ? c.uiMode.newValue : undefined); });
setInterval(() => { if (shMode === "auto") shellSkin(); }, 60000);
