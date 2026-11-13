// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved. Proprietary & confidential.
// اختبار وحدة لمحرك تحويل اليوزر→آيدي رقم (الطابور/الاستراحة/إعادة المحاولة/الكنس) بفيسبوك مزيّف.  التشغيل:  node tests/fbid/bg.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const ENG = process.env.ENG || path.join(__dirname, "../../../re-hunter"); // فولدر المحرك (re-hunter)
const core = require(path.join(ENG, "fbid-core.js"));
let bg = fs.readFileSync(path.join(ENG, "background.js"), "utf8");
const i = bg.indexOf("// ===== 🆔 آيدي فيسبوك الرقمي لكل شخص");
let code = bg.slice(i).replace("700 + Math.random() * 900", "1").replace('chrome.alarms.create("fbidTick", { periodInMinutes: 1, delayInMinutes: 0.7 });', "");
const store = new Map(), logs = [];
const html = (id) => `<html><head><meta property="al:android:url" content="fb://profile/${id}"></head><body>x</body></html>`;
const pages = { "alice.smith": { id: "100012345678901" }, "bob.private": { body: "<html><head></head><body>no id here</body></html>" },
  "redirect.me": { url: "https://www.facebook.com/profile.php?id=100099999999999" }, "gone.user": { status: 404 } };
let rateOnce = true, loginMode = false;
const fakeFetch = async (u) => {
  const h = decodeURIComponent(u.replace("https://www.facebook.com/", ""));
  if (loginMode) return { status: 200, ok: true, url: "https://www.facebook.com/login/?next=x", text: async () => "" };
  if (h === "rate.limited" && rateOnce) { rateOnce = false; return { status: 429, ok: false, url: u }; }
  const pg = pages[h] || (h === "rate.limited" ? { id: "100077777777777" } : null);
  if (!pg) return { status: 404, ok: false, url: u, text: async () => "" };
  if (pg.status) return { status: pg.status, ok: false, url: u, text: async () => "" };
  return { status: 200, ok: true, url: pg.url || u, text: async () => pg.body || html(pg.id) };
};
const ctx = { console, setTimeout, clearTimeout, Date, Math, Promise, Object, Set, Map, String, Number, JSON, Array, Infinity,
  FBIDCORE: { ...core, fetchId: (h, o) => core.fetchId(h, { ...o, fetch: fakeFetch, viewer: "100000000000001" }) },
  get: async (k) => store.get(k), set: async (k, v) => { store.set(k, JSON.parse(JSON.stringify(v))); },
  kvQueued: (fn) => fn(), FBQ: { q: new Map(), busy: false, pauseUntil: 0, lastSweep: 0, dirty: true, why: "", done: 0, fail: 0 },
  chrome: { alarms: { create() {} }, storage: { local: { get: async (k) => { const o = {}; (Array.isArray(k) ? k : [k]).forEach((x) => (o[x] = store.get(x))); return o; } } } } };
vm.createContext(ctx); vm.runInContext(code + "\nthis.fbidWant=fbidWant;this.fbidSweep=fbidSweep;this.fbidSt=fbidSt;this.fbidTick=fbidTick;", ctx);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const ok = (c, m) => console.log((c ? "✅ " : "❌ ") + m);
  // 1) أرقام مباشرة من meta + redirect + مفيش + 404
  let n = await ctx.fbidWant(["alice.smith", "bob.private", "redirect.me", "gone.user", "12345", "profile.php", "x"], { urgent: true });
  ok(n === 4, "queued only valid handles (" + n + ")");
  await wait(300);
  const cache = store.get("extractIdCache") || {}, miss = store.get("__fbidMiss") || {};
  ok(cache["alice.smith"] === "100012345678901", "meta tag → numeric id");
  ok(cache["redirect.me"] === "100099999999999", "redirect to profile.php?id → numeric id");
  ok(miss["bob.private"] && miss["bob.private"].why === "none", "no id on page → miss(none)");
  ok(miss["gone.user"] && miss["gone.user"].why === "none", "404 → miss(none)");
  // 2) أول 429 → استراحة ورجوع للطابور
  await ctx.fbidWant(["rate.limited"], { urgent: true }); await wait(200);
  ok(ctx.FBQ.pauseUntil > Date.now() && ctx.FBQ.why === "rate" && ctx.FBQ.q.has("rate.limited"), "429 → paused 10min, handle requeued");
  // 3) بعد الاستراحة يكمّل
  ctx.FBQ.pauseUntil = 0; await ctx.fbidTick(); await wait(300);
  ok((store.get("extractIdCache") || {})["rate.limited"] === "100077777777777", "resumes after pause and resolves");
  // 4) مش مسجّل دخول → استراحة وبيرجع للطابور
  loginMode = true; await ctx.fbidWant(["alice2.test"], { urgent: true }); await wait(200);
  ok(ctx.FBQ.why === "login" && ctx.FBQ.q.has("alice2.test"), "login wall → pause 5min with why=login");
  loginMode = false; ctx.FBQ.pauseUntil = 0; ctx.FBQ.q.clear(); ctx.FBQ.why = "";
  // 5) المحاولة تاني للمفقود: مش قبل 6 ساعات، ولا مع retry
  n = await ctx.fbidWant(["bob.private"], { urgent: true }); ok(n === 0, "recent miss not retried");
  n = await ctx.fbidWant(["bob.private"], { urgent: true, retry: true }); await wait(100); ok(n === 1, "retry:true re-queues");
  // 6) sweep من البوستات والتعليقات
  store.set("posts", { a: { uid: "sara.hassan.bs", source: "fb", ts: 5 }, b: { uid: "100012300000000", source: "fb" }, c: { uid: "", profileUrl: "https://www.facebook.com/walid.salah.1", source: "fb", ts: 9 }, d: { uid: "igguy", source: "ig" }, e: { uid: "wauser", source: "wa" } });
  store.set("comments", { x: { uid: "yasser.gamal", source: "fb", ts: 7 }, y: { uid: "alice.smith", source: "fb" } });
  ctx.FBQ.q.clear(); const before = ctx.FBQ.q.size; await ctx.fbidSweep();
  await wait(400); const all = new Set([...ctx.FBQ.q.keys(), ...Object.keys(store.get("extractIdCache")), ...Object.keys(store.get("__fbidMiss") || {})]);
  ok(["sara.hassan.bs", "walid.salah.1", "yasser.gamal"].every((h) => all.has(h)), "sweep collects handles from posts+comments+profileUrl");
  ok(!all.has("igguy") && !all.has("wauser") && !all.has("100012300000000"), "sweep skips IG/WA/numeric");
  console.log("status", JSON.stringify(ctx.fbidSt()));
})();
