// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة. Proprietary & confidential.
// اختبار شارة التواصل الموحّدة: دليل الموظفين (نجاح · مفيش داتا · فشل اتصال · مهلة) + الشارة في كل الأقسام.
// التشغيل:  node tests/fbid/contact.test.js
const fs = require("fs"), vm = require("vm"), path = require("path"), http = require("http");
const ENG = process.env.ENG || path.join(__dirname, "../../../re-hunter"); // فولدر المحرك (re-hunter)
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let bad = 0;
const ok = (c, m) => { console.log((c ? "✅ " : "❌ ") + m); if (!c) bad++; };

// ===== 🖥️ سيرفر محلي (localhost) بيحاكي دليل الموظفين المرخّص =====
const DIR = {
  "100012345678901": JSON.stringify([{ Phone: "01000000001" }]), // رقم
  "100022222222222": "[]",                                        // مفيش داتا (JSON)
  "100033333333333": "no data found",                             // مفيش داتا (نص)
};
const server = http.createServer((req, res) => {
  const id = new URL(req.url, "http://127.0.0.1").searchParams.get("id") || "";
  if (id === "100044444444444") return;                           // 🕓 ردّ مش هيوصل (اختبار المهلة)
  const body = DIR[id];
  if (body == null) { res.writeHead(500); return res.end("boom"); }
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" }); res.end(body);
});
// تحميل ملف جوه بيئة معزولة (من غير DOM ولا chrome) — زي الكود الحقيقي
function load(file, ctx) {
  vm.runInContext(fs.readFileSync(path.join(ENG, file), "utf8"), ctx, { filename: file });
  return ctx;
}
function baseCtx(extra) {
  const ctx = { console, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask,
    Promise, Date, Math, JSON, Object, String, Number, Boolean, Array, Set, Map, RegExp, Error, URL, fetch, AbortSignal };
  Object.assign(ctx, extra || {});
  vm.createContext(ctx);
  return ctx;
}

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}/alaa-data.php`;

  // ===== 1) دليل الموظفين: الحالات الأربعة =====
  const ec = baseCtx({ EMPLOYEE_PHONE_URL: base, EMPLOYEE_PHONE_TIMEOUT: 600 });
  load("employee-phone.js", ec);
  const EP = ec.EMPLOYEEPHONE;
  let r = await EP.lookup("100012345678901");
  ok(r.ok === true && r.phone === "01000000001", "الدليل: الرقم اتلقط (نجاح)");
  r = await EP.lookup("100022222222222");
  ok(r.ok === true && r.phone === "", "الدليل: مفيش داتا (مش خطأ)");
  r = await EP.lookup("100033333333333");
  ok(r.ok === true && r.phone === "", "الدليل: مفيش داتا (رد نصي)");
  r = await EP.lookup("100099999999999");
  ok(r.ok === false && !!r.error, "الدليل: فشل الاتصال (HTTP 500) ← ظاهر كخطأ مش «مفيش داتا»");
  const t0 = Date.now();
  r = await EP.lookup("100044444444444");
  ok(r.ok === false && Date.now() - t0 < 3000, "الدليل: المهلة بتوقّف الطلب (مفيش تحميل بلا نهاية)");
  const r2 = await EP.lookup("abc");
  ok(r2.ok === false && /آيدي/.test(r2.error || ""), "الدليل: آيدي غير صالح مرفوض");

  // ===== 2) الشارة الموحّدة (fbid.js) في بيئة صفحة =====
  const calls = [];
  const fc = baseCtx({
    document: { addEventListener() {}, querySelectorAll: () => [], createElement: () => ({ setAttribute() {}, classList: { add() {}, remove() {} } }), body: { appendChild() {} } },
    navigator: { clipboard: { writeText: async () => {} } },
    chrome: { storage: { local: { get: async () => ({}) }, onChanged: { addListener() {} } }, runtime: { sendMessage: async (m) => { calls.push(m); if (m.type !== "employeePhone") return {}; if (m.id === "100012345678901") return { ok: true, phone: "01000000001" }; if (m.id === "100022222222222") return { ok: true, phone: "" }; return { ok: false, error: "تعذر الاتصال" }; } } },
  });
  load("fbid-core.js", fc); load("employee-phone.js", fc); load("fbid.js", fc);
  const FBID = fc.FBID;
  await wait(60);

  // أ) رقم منشور في البوست → بيتعرض على طول (ومن غير ما نطلب الدليل)
  const before = calls.length;
  const hPost = FBID.chip({ uid: "100099999999999", phones: ["01099999999"] });
  ok(/01099999999/.test(hPost) && /data-phone="1"/.test(hPost), "الرقم المنشور في البوست: بيتعرض على طول");
  ok(calls.length === before, "الرقم المنشور في البوست: من غير استعلام الدليل");

  // ب) آيدي + الدليل رجّع رقم → التليفون يظهر مكان الآيدي
  const hLoad = FBID.chip({ uid: "100012345678901" });
  ok(/جاري الجلب/.test(hLoad) && /100012345678901/.test(hLoad), "الدليل شغّال: حالة تحميل واضحة (مش دايمة)");
  await wait(250);
  const hPhone = FBID._contactInner("100012345678901");
  ok(/01000000001/.test(hPhone) && /data-fbnum="01000000001"/.test(hPhone) && /data-phone="1"/.test(hPhone), "نجاح: التليفون ظهر مكان الآيدي (والدوسة بتنسخه)");

  // ج) الدليل قال مفيش داتا → الآيدي + «معندوش داتا»
  FBID.chip({ uid: "100022222222222" }); await wait(250);
  const hNone = FBID._contactInner("100022222222222");
  ok(/data-fbnum="100022222222222"/.test(hNone) && /معندوش داتا/.test(hNone) && !/تعذر الاتصال/.test(hNone), "مفيش داتا: الآيدي + «معندوش داتا»");

  // د) فشل الاتصال → «تعذر الاتصال» (مختلف عن «مفيش داتا»)
  FBID.chip({ uid: "100033333333333" }); await wait(250);
  const hErr = FBID._contactInner("100033333333333");
  ok(/data-fbnum="100033333333333"/.test(hErr) && /تعذر الاتصال/.test(hErr) && !/معندوش داتا/.test(hErr), "فشل الاتصال: «تعذر الاتصال» مختلف عن «معندوش داتا»");

  // هـ) مش مسجّل دخول فيسبوك (يوزر) → رسالة واضحة مش تحميل أبد
  FBID._S.st = { why: "login" };
  const hLogin = FBID._contactInner("some.handle");
  ok(/تسجيل دخول/.test(hLogin) && !/جاري الجلب/.test(hLogin), "مش مسجّل دخول: رسالة واضحة (مش تحميل)");

  // و) اليوزر العادي: في انتظار التحويل (ومفيش تليفون مخترع)
  FBID._S.st = {};
  const hWait = FBID._contactInner("some.handle");
  ok(/في انتظار/.test(hWait), "يوزر: في انتظار التحويل (من غير رقم مخترع)");

  // ز) يوزر اتحوّل لرقم → الشارة بتكمّل بالدليل على طول
  FBID._S.cache["some.handle"] = "100012345678901";
  const hConv = FBID._contactInner("some.handle");
  ok(/01000000001/.test(hConv), "يوزر اتحوّل لرقم: الشارة بتكمّل بالدليل (من غير ما تفضل «في انتظار»)");
  delete FBID._S.cache["some.handle"];

  // ===== 3) توحيد الشارة في الأقسام الخمسة =====
  const dash = ["dashboard.js", "matches/cards.js", "matches/fast.js"].map((file) => fs.readFileSync(path.join(ENG, file), "utf8")).join("\n");
  const bodyOf = (name) => { const i = dash.indexOf("function " + name); if (i < 0) return ""; const j = dash.indexOf("\nfunction ", i + 10); return dash.slice(i, j < 0 ? dash.length : j); };
  ok(/FBID\.chip\(/.test(bodyOf("card")), "الطلبات والعروض: الشارة موجودة");
  ok(/FBID\.chip\(/.test(bodyOf("pairCard")), "التطابق: الشارة موجودة (المشتري والبايع)");
  ok(/FBID\.chip\(/.test(bodyOf("leadCard")), "المشترين المحتملين: الشارة موجودة");
  ok(/FBID\.chip\(/.test(bodyOf("sellerCard")), "البايعين المحتملين: الشارة موجودة");
  ok(/FBID\.chip\(/.test(bodyOf("hitHtml")), "هاتلي مشتري: الشارة موجودة");
  const chips = dash.match(/FBID\.chip\([^)]*\)/g) || [];
  ok(chips.length >= 8 && chips.every((c) => /FBID\.chip/.test(c)), "كل الأقسام بتستخدم نفس الشارة الموحّدة (API واحد)");

  server.close();
  console.log(bad ? `\n❌ ${bad} حالة فشلت` : "\n✅ كل الحالات تمام");
  if (bad) process.exitCode = 1;
})().catch((e) => { console.log("FAIL", (e && e.stack) || e); process.exitCode = 1; });
