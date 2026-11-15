// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 📱🖥 سيرفر البرنامج: البرنامج (على جهازك أو على VPS) بيفتح بورت، وأي جهاز تاني يدخل عليه بكود سري
// - /m           صفحة الموبايل المختصرة
// - /d/          لوحة التحكم الكاملة من أي متصفح (نفس الداتا ومتزامنة لحظة بلحظة، وبتشوف السحب وهو شغال)
// - /apk         تطبيق الأندرويد
// - /api/...     الطلبات (كلها بالكود)
const http = require("http");
const os = require("os");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");

const CODE_ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // من غير حروف بتتلخبط (O/0، I/1)
const newCode = () => Array.from(crypto.randomBytes(8), (b) => CODE_ABC[b % CODE_ABC.length]).join("");
const BOOT = Date.now().toString(36) + crypto.randomBytes(3).toString("hex"); // بيتغيّر مع كل تشغيل للبرنامج
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json; charset=utf-8", ".ico": "image/x-icon", ".woff2": "font/woff2" };

const { isMap, mergeMap, dropArchived, pickEntries, syncable } = require("./delta.js");

module.exports = function remote({ appDir, engineDir, getSettings, saveSettings, getDash, version, net, kv, rt, alarm, open, shot, status, chlog, mesh, device, files, localOnly = false }) {
  const releaseUpdates = require('./release-updates')({version,fetch:(...args)=>net.fetch(...args)});
  let server = null, lastErr = "", publicIp = "";
  const fails = new Map(); // ip → { t0, toks:Set, until } — بنعدّ التوكنات المختلفة بس (جهاز قديم بيعيد نفس الكود كل كام ثانية = محاولة واحدة)
  const clients = new Set(); // اتصالات اللوحة المفتوحة (SSE)
  const localConfig = { enabled:true, port:0, code:newCode() };
  const hasAngular = fs.existsSync(path.join(engineDir,'angular','index.html'));

  const cfg = () => {
    if (localOnly) return localConfig;
    const s = getSettings();
    if (!s.remote) s.remote = { enabled: false, port: 8787, code: newCode() };
    if (!s.remote.code) s.remote.code = newCode();
    if (!s.remote.port || !Number.isInteger(+s.remote.port) || +s.remote.port < 1 || +s.remote.port > 65535) s.remote.port = 8787;
    return s.remote;
  };
  const same = (a, b) => { const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || "")); return x.length === y.length && crypto.timingSafeEqual(x, y); };
  const cookieOf = (req) => { const m = /(?:^|;\s*)alaa_t=([A-Za-z0-9]+)/.exec(req.headers.cookie || ""); return m ? m[1] : ""; };
  const setCookie = (code, age = 30 * 86400) => `alaa_t=${code}; Path=/; Max-Age=${age}; HttpOnly; SameSite=Lax`;

  function send(res, code, body, type = "application/json; charset=utf-8", extra = {}) {
    if (res.headersSent) { try { res.end(); } catch {} return; }
    const buf = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
    res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, X-Token, Content-Encoding", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", ...extra });
    res.end(buf);
  }
  // ردود كبيرة (الداتا) بتتضغط — النت بتاعك بيسحب أقل بكتير
  function sendBig(req, res, obj) {
    const json = Buffer.from(JSON.stringify(obj));
    if (json.length < 2048 || !/\bgzip\b/.test(req.headers["accept-encoding"] || "")) return send(res, 200, json);
    zlib.gzip(json, { level: 6 }, (err, gz) => { if (err) return send(res, 200, json); send(res, 200, gz, "application/json; charset=utf-8", { "Content-Encoding": "gzip", Vary: "Accept-Encoding" }); });
  }
  function authed(req, url, ip) {
    const f = fails.get(ip);
    if (f && f.until > Date.now()) return "locked";
    const tok = req.headers["x-token"] || url.searchParams.get("t") || cookieOf(req) || "";
    if (!tok) return "none";
    if (same(String(tok).toUpperCase().trim(), cfg().code)) { fails.delete(ip); return "ok"; }
    const now = Date.now();
    let g = f && now - f.t0 < 6e5 ? f : null; // نافذة 10 دقايق من أول محاولة غلط
    if (!g) g = { t0: now, toks: new Set(), until: 0 };
    if (g.toks.size < 64) g.toks.add(String(tok).slice(0, 64));
    if (g.toks.size >= 8) g.until = now + 10 * 6e4; // 8 أكواد مختلفة غلط = قفل 10 دقايق
    fails.set(ip, g);
    if (fails.size > 2000) for (const [k, v] of fails) { if (v.until < now && now - v.t0 > 6e5) fails.delete(k); if (fails.size <= 1500) break; }
    return "bad";
  }
  async function callDash(payload) {
    const wc = await getDash();
    if (!wc) throw new Error("لوحة التحكم مش جاهزة");
    const js = `(async()=>{ for (let i=0;i<60 && typeof window.__remoteApi!=="function";i++) await new Promise(r=>setTimeout(r,250)); return window.__remoteApi(${JSON.stringify(payload)}); })()`;
    return await Promise.race([wc.executeJavaScript(js, true), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 60000))]);
  }
  function readBody(req, max = 64 * 1024) {
    return new Promise((resolve, reject) => {
      let n = 0; const chunks = [];
      req.on("data", (c) => { n += c.length; if (n > max) { reject(new Error("too big")); req.destroy(); } else chunks.push(c); });
      req.on("end", () => {
        let buf = Buffer.concat(chunks);
        const done = (b) => { try { resolve(b.length ? JSON.parse(b.toString("utf8")) : {}); } catch { resolve({}); } };
        if (/gzip/i.test(req.headers["content-encoding"] || "")) zlib.gunzip(buf, { maxOutputLength: 400 * 1024 * 1024 }, (e, out) => (e ? reject(e) : done(out)));
        else done(buf);
      });
      req.on("error", reject);
    });
  }

  // نص الطلب الخام (بيتوقّع عليه توقيع ميتا) — لحد ٢ ميجا
  function readRaw(req, max = 2 * 1024 * 1024) {
    return new Promise((resolve, reject) => {
      let n = 0; const chunks = [];
      req.on("data", (c) => { n += c.length; if (n > max) { reject(new Error("too big")); req.destroy(); } else chunks.push(c); });
      req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      req.on("error", reject);
    });
  }
  // 📨 Webhook واتساب الرسمي (عام — مأمّن بكود التحقق وتوقيع ميتا مش بكود السيرفر): GET بيتحقق من الرابط، POST بيوصّل الإشعارات للمحرك
  async function waHook(req, res, url) {
    if (req.method === "GET") {
      const q = {}; for (const [k, v] of url.searchParams) q[k] = v;
      const r = await rt({ type: "wcVerify", q });
      return r && r.challenge != null ? send(res, 200, String(r.challenge), "text/plain; charset=utf-8") : send(res, 403, "forbidden", "text/plain");
    }
    if (req.method === "POST") {
      let raw; try { raw = await readRaw(req); } catch { return send(res, 413, "too big", "text/plain"); }
      const r = await rt({ type: "wcHook", raw, sig: String(req.headers["x-hub-signature-256"] || ""), wait: false });
      if (!r) return send(res, 503, "engine not ready", "text/plain"); // ميتا هتعيد المحاولة
      if (r.ok) return send(res, 200, "ok", "text/plain");
      return send(res, r.code === 403 ? 403 : 400, "rejected", "text/plain");
    }
    return send(res, 405, "method not allowed", "text/plain");
  }

  // ===== لوحة التحكم الكاملة =====
  const verOf = (k) => kv.ver(k);
  function loginPage(msg = "") {
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aqar Matrix — دخول</title>
<style>body{margin:0;background:#0b1220;color:#e6ecf7;font:16px/1.7 Arial,sans-serif;min-height:100vh;display:grid;place-items:center}
.w{width:min(380px,92vw);background:#111a2e;border:1px solid #22304d;border-radius:20px;padding:26px}.l{font-size:42px;text-align:center}h1{text-align:center;margin:4px 0 2px;font-size:22px}
p{color:#93a1bd;text-align:center;margin:0 0 16px;font-size:14px}input{width:100%;box-sizing:border-box;border:1px solid #22304d;background:#0b1220;color:#e6ecf7;border-radius:12px;padding:13px;font:inherit;font-size:20px;letter-spacing:4px;text-align:center;text-transform:uppercase;direction:ltr}
button{width:100%;margin-top:14px;border:0;border-radius:12px;padding:13px;font:inherit;font-weight:800;color:#06121f;background:linear-gradient(135deg,#2dd4bf,#60a5fa 55%,#a78bfa);cursor:pointer}.e{color:#fca5a5;text-align:center;margin-top:10px;font-size:14px}</style></head>
<body><form class="w" onsubmit="event.preventDefault();location.href='/d/?t='+encodeURIComponent(document.getElementById('c').value.trim().toUpperCase())">
<div class="l">👑</div><h1>Aqar Matrix</h1><p>لوحة التحكم من السيرفر — اكتب الكود اللي في البرنامج (صفحة البداية ← «📱 الموبايل والسيرفر»)</p>
<input id="c" autocomplete="off" autofocus placeholder="K7Q2M9XA"><button>🔓 دخول</button>${msg ? `<div class="e">${msg}</div>` : ""}</form></body></html>`;
  }
  function serveDash(req, res, rel) {
    if ((!rel || rel === '/') && hasAngular) return send(res,302,'','text/plain',{Location:'/d/angular/index.html'});
    rel = rel.replace(/^\/+/, "") || "dashboard.html";
    if (rel === "web-shim.js") return send(res, 200, fs.readFileSync(path.join(appDir, "web-shim.js")), TYPES[".js"]);
    const full = path.normalize(path.join(engineDir, rel));
    if (!full.startsWith(path.normalize(engineDir) + path.sep) || !TYPES[path.extname(full).toLowerCase()]) return send(res, 404, "not found", "text/plain");
    let buf; try { buf = fs.readFileSync(full); } catch { return send(res, 404, "not found", "text/plain"); }
    if (rel === "dashboard.html") {
      const inj = `<script>window.__alaaWeb={version:${JSON.stringify(version)},boot:${JSON.stringify(BOOT)}};</script><script src="angular-bridge/desktop.js"></script><script src="web-shim.js"></script>`;
      buf = Buffer.from(buf.toString("utf8").replace(/<link rel="stylesheet" href="dashboard\.css">/, (m) => m + "\n" + inj));
    }
    send(res, 200, buf, TYPES[path.extname(full).toLowerCase()]);
  }
  function sse(req, res) {
    res.writeHead(200, { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    res.write(`event: hello\ndata: ${JSON.stringify({ boot: BOOT, version })}\n\n`);
    const c = { res, ka: setInterval(() => { try { res.write(": ka\n\n"); } catch {} }, 20000) };
    clients.add(c);
    const bye = () => { clearInterval(c.ka); clients.delete(c); };
    req.on("close", bye); res.on("error", bye);
  }
  // البرنامج بيبلّغنا بأي تغيير في الداتا → يوصل لكل الأجهزة المفتوحة
  function changed(light) {
    if (!clients.size) return;
    const vers = {}; for (const k of Object.keys(light)) vers[k] = verOf(k);
    let msg; try { msg = `event: kv\ndata: ${JSON.stringify({ ch: light, vers })}\n\n`; } catch { return; }
    for (const c of clients) { try { c.res.write(msg); } catch {} }
  }

  // 🔔 تنبيه جديد (مشتري، تطابق، هاتلي مشتري…) → يوصل لكل الأجهزة المفتوحة
  function notify(n) {
    if (!clients.size || !n) return;
    const msg = `event: notif\ndata: ${JSON.stringify({ id: n.id || "", title: String(n.title || ""), message: String(n.message || ""), at: n.at || Date.now() })}\n\n`;
    for (const c of clients) { try { c.res.write(msg); } catch {} }
  }
  async function api(req, res, url) {
    const p = url.pathname;
    if (p === '/api/updates' && req.method === 'GET') {
      return send(res,200,await releaseUpdates.check(),'application/json; charset=utf-8',{'Cache-Control':'no-store'});
    }
    if (p === '/api/updates/download' && req.method === 'GET') {
      const info = await releaseUpdates.check();
      if (info.state !== 'available' || !releaseUpdates.trustedDownload(info.downloadUrl)) return send(res,409,{error:'لا يوجد ملف تحديث متاح للتنزيل.'});
      return send(res,302,'','text/plain',{Location:info.downloadUrl,'Cache-Control':'no-store'});
    }
    if (p === "/api/ping") { const d = device ? device() : {}; return send(res, 200, { ok: true, app: "Alaa Deals", version, boot: BOOT, dev: d.id || "", name: d.name || "" }); }
    if (p === "/api/call" && req.method === "POST") {
      try { const body = await readBody(req); const r = await callDash(body); return send(res, 200, r == null ? {} : r); }
      catch (e) { return send(res, 500, { error: String((e && e.message) || e).slice(0, 200) }); }
    }
    if (p === "/api/events") return sse(req, res);
    if (p === "/api/kv/get" && req.method === "POST") {
      const b = await readBody(req, 1024 * 1024);
      if (b.keys == null) return sendBig(req, res, { boot: BOOT, vals: kv.get(null), vers: null });
      const keys = (Array.isArray(b.keys) ? b.keys : [b.keys]).map(String), have = b.have || {};
      const need = keys.filter((k) => !(have[k] != null && have[k] === verOf(k) && b.boot === BOOT));
      const data = kv.get(need), vers = {}; for (const k of need) vers[k] = verOf(k);
      return sendBig(req, res, { boot: BOOT, vals: data, vers });
    }
    if (p === "/api/kv/set" && req.method === "POST") {
      const b = await readBody(req, 300 * 1024 * 1024);
      if (!b.obj || typeof b.obj !== "object") return send(res, 400, { error: "bad" });
      kv.set(b.obj); const vers = {}; for (const k of Object.keys(b.obj)) vers[k] = verOf(k);
      return send(res, 200, { ok: true, boot: BOOT, vers });
    }
    if (p === "/api/kv/remove" && req.method === "POST") { const b = await readBody(req); kv.remove(b.keys); return send(res, 200, { ok: true }); }
    if (p === "/api/kv/bytes" && req.method === "POST") { const b = await readBody(req); return send(res, 200, { n: kv.bytes(b.keys == null ? null : b.keys) }); }
    if (p === "/api/rt" && req.method === "POST") {
      const b = await readBody(req, 4 * 1024 * 1024);
      try { const r = await rt(b.msg); return send(res, 200, { resp: r === undefined ? null : r }); }
      catch (e) { return send(res, 200, { resp: null, error: String((e && e.message) || e).slice(0, 200) }); }
    }
    if (p === "/api/alarm") return send(res, 200, { alarm: alarm(url.searchParams.get("n") || "") || null });
    if (p === "/api/open" && req.method === "POST") {
      const b = await readBody(req);
      if (!/^https:\/\/(www\.|web\.)?facebook\.com\//i.test(String(b.url || ""))) return send(res, 400, { error: "لينك فيسبوك بس" });
      open(String(b.url)); return send(res, 200, { ok: true });
    }
    // ===== 🔁 المزامنة الكاملة (نسختين كاملتين): فروق بس =====
    if (p === "/api/sync/pull" && req.method === "POST") {
      if (mesh) mesh.peerContact();
      const b = await readBody(req, 8 * 1024 * 1024);
      const vers = b.vers || {}, sameBoot = b.boot === BOOT;
      const all = kv.get(null), items = {}, missing = [];
      for (const k of Object.keys(all)) {
        if (!syncable(k)) continue;
        const v = verOf(k), val = all[k];
        if (sameBoot && vers[k] === v) continue;
        const d = sameBoot && vers[k] && chlog && isMap(k, val) && chlog.ver.get(k) === v ? chlog.since(k, vers[k]) : { full: true };
        items[k] = d.full ? { ver: v, full: val } : { ver: v, entries: pickEntries(val, d.ids), removed: d.removed };
        if (d.full && mesh && !isMap(k, val)) items[k].st = mesh.st(k) || [0, ""]; // 🕸 ختم القيمة المفردة
      }
      for (const k of (b.keys || [])) if (syncable(k) && !(k in all)) missing.push(k);
      return sendBig(req, res, { boot: BOOT, now: Date.now(), items, missing, version, counts: { posts: Object.keys(all.posts || {}).length, comments: Object.keys(all.comments || {}).length } }); // counts+version: عشان الطرف التاني يقارن نفسه بالسيرفر ويقول «متزامن ٤٤١ = ٤٤١» أو «بيزامن ٣٠٠ من ٤٤١»
    }
    if (p === "/api/sync/push" && req.method === "POST") {
      const b = await readBody(req, 300 * 1024 * 1024);
      const set = {}; let n = 0;
      const stSet = {};
      const SEEN = { posts: "seenPosts", comments: "seenComments" };
      const arch = (k, ents, cur) => { // الأرشفة التلقائية شالتها عندنا؟ النسخة القديمة اللي جاية من جهاز كان مقفول ما ترجعش (delta.dropArchived)
        if (!SEEN[k] || !ents) return ents;
        try { const dc = (kv.get("dataCfg") || {}).dataCfg || {}; return dropArchived(ents, cur, (kv.get(SEEN[k]) || {})[SEEN[k]], dc.keepDays == null ? 120 : dc.keepDays); } catch { return ents; }
      };
      for (const [k, v] of Object.entries(b.full || {})) { if (!syncable(k)) continue;
        if (isMap(k, v)) { const cur = kv.get(k)[k]; const m = mergeMap(cur, arch(k, v, cur), []); if (m.changed) { set[k] = m.value; n += Object.keys(v).length; } }
        else if (mesh && (b.stamps || {})[k]) { const inc = b.stamps[k]; if (mesh.decide(k, inc, v) === "apply") { set[k] = v; stSet[k] = inc; n++; } } // 🕸 الأحدث يكسب (القديم بيتتجاهل — والطرف التاني هياخد النسخة الأحدث في السحب)
        else set[k] = v; }
      for (const [k, entries] of Object.entries(b.entries || {})) { if (!syncable(k)) continue;
        const cur = kv.get(k)[k]; const m = mergeMap(cur, arch(k, entries, cur), (b.removed || {})[k] || []);
        if (m.changed) { set[k] = m.value; n += Object.keys(entries).length; } }
      if (process.env.ALAA_SYNC_DEBUG) console.log("[sync] srv push got @" + (Date.now() % 1e6), JSON.stringify({ full: Object.keys(b.full || {}), set: Object.keys(set) }), set.viewPrefs ? JSON.stringify(set.viewPrefs) : "");
      if (Object.keys(set).length) { if (mesh) mesh.applySynced(set, stSet); else kv.set(set); }
      if (mesh) mesh.peerPushed(Object.entries(b.full || {}).some(([k, v]) => syncable(k) && !isMap(k, v)));
      const rk = (b.removeKeys || []).filter(syncable); if (rk.length) kv.remove(rk);
      const vers = {}; for (const k of [...Object.keys(set), ...rk]) vers[k] = verOf(k);
      return send(res, 200, { ok: true, boot: BOOT, vers, applied: n });
    }
    // ===== 📁 ملفات الحفظ (أرشيف / نسخ كاملة / ملفات الأيام) بين الأجهزة المربوطة =====
    if (p === "/api/files/list" && files) return send(res, 200, { ok: true, files: files.list() });
    if (p === "/api/files/get" && files) return files.serve(url.searchParams.get("rel") || "", req, res);
    if (p === "/api/files/put" && req.method === "POST" && files) {
      const r = await files.receive(url.searchParams.get("rel") || "", req);
      return send(res, r.ok ? 200 : (r.code || 500), r);
    }
    if (p === "/api/status") { try { return send(res, 200, await status()); } catch (e) { return send(res, 500, { error: String(e.message || e) }); } }
    if (p === "/api/shot") {
      try {
        const s = await shot(url.searchParams.get("w") || "");
        if (!s) return send(res, 204, "");
        return send(res, 200, s.jpg, "image/jpeg", { "X-Title": encodeURIComponent(s.title || ""), "X-Url": encodeURIComponent(s.url || "") });
      } catch (e) { return send(res, 500, { error: String(e.message || e) }); }
    }
    return send(res, 404, { error: "not found" });
  }

  async function handle(req, res) {
    const ip = (req.socket.remoteAddress || "").replace(/^::ffff:/, "");
    const url = new URL(req.url, "http://x");
    const p = url.pathname;
    if (req.method === "OPTIONS") return send(res, 204, "");
    if (p === "/") return send(res, 302, "", "text/plain", { Location: "/m" + url.search });
    if (p === "/m" || p === "/m/") {
      try { // 10.64: شكل اللافتة اللي مختاره على الكمبيوتر بيبقى الافتراضي على الموبايل
        let sg = "azure"; try { const v = (kv.get("uiSgv") || {}).uiSgv; if (typeof v === "string" && /^[a-z]{2,12}$/.test(v)) sg = v; } catch {}
        return send(res, 200, fs.readFileSync(path.join(appDir, "mobile.html"), "utf8").replace("/*PC_SGV*/", `window.PC_SGV=${JSON.stringify(sg)};`), "text/html; charset=utf-8", { "Cache-Control": "no-cache" });
      } catch (e) { return send(res, 500, "missing mobile.html", "text/plain"); }
    }
    if (p === "/apk" || p === "/AlaaDeals.apk" || p === "/AqarMatrix.apk") { // تطبيق الأندرويد: يتحمّل من الموبايل مباشرة
      try { return send(res, 200, fs.readFileSync(path.join(appDir, "AqarMatrix.apk")), "application/vnd.android.package-archive", { "Content-Disposition": 'attachment; filename="AqarMatrix.apk"' }); } catch { return send(res, 404, "", "text/plain"); }
    }
    if (p === "/m/icons54.js" || p === "/m/icons54.css" || p === "/m/icons56.css" || p === "/m/welcome56.js" || p === "/m/sgv-data.js") { // أيقونات الشكل الجديد لصفحة الموبايل (مش سرّية)
      try { return send(res, 200, fs.readFileSync(path.join(engineDir, path.basename(p))), TYPES[path.extname(p)] || "text/plain", { "Cache-Control": "no-cache" }); } catch { return send(res, 404, ""); }
    }
    if (p === "/m/cairo-arabic-wght-normal.woff2" || p === "/m/cairo-latin-wght-normal.woff2") { // خط Cairo لصفحة الموبايل (ملف خط عام مش سرّي)
      try { return send(res, 200, fs.readFileSync(path.join(engineDir, "fonts", path.basename(p))), "font/woff2", { "Cache-Control": "max-age=86400" }); } catch { return send(res, 404, ""); }
    }
    if (p === "/wa/hook" || p === "/wa/hook/") return waHook(req, res, url);
    if (p === "/icon.png") { try { return send(res, 200, fs.readFileSync(path.join(appDir, "icon.png")), "image/png", { "Cache-Control": "max-age=86400" }); } catch { return send(res, 404, ""); } }
    if (p === "/d" || p.startsWith("/d/")) {
      const a = authed(req, url, ip);
      if (a === "locked") return send(res, 429, loginPage("محاولات كتير غلط — استنى 10 دقايق"), "text/html; charset=utf-8");
      if (a !== "ok") return send(res, a === "none" ? 200 : 401, loginPage(a === "bad" ? "الكود غلط" : ""), "text/html; charset=utf-8", a === "bad" ? { "Set-Cookie": setCookie("", 0) } : {});
      // أول دخول بالكود في اللينك: نحفظه في الجهاز ونشيله من العنوان
      if (url.searchParams.get("t")) return send(res, 302, "", "text/plain", { Location: "/d/" + url.hash, "Set-Cookie": setCookie(cfg().code) });
      if (p === "/d") return send(res, 302, "", "text/plain", { Location: "/d/" });
      return serveDash(req, res, decodeURIComponent(p.slice(3)));
    }
    if (p.startsWith("/api/")) {
      const a = authed(req, url, ip);
      if (a === "locked") return send(res, 429, { error: "محاولات كتير غلط — استنى 10 دقايق" });
      if (a !== "ok") return send(res, 401, { error: "الكود غلط" });
      return api(req, res, url);
    }
    send(res, 404, "not found", "text/plain");
  }
  function addresses() {
    const out = [];
    for (const [name, list] of Object.entries(os.networkInterfaces())) for (const a of list || []) if (a.family === "IPv4" && !a.internal) out.push({ ip: a.address, name });
    if (publicIp && !out.some((x) => x.ip === publicIp)) out.unshift({ ip: publicIp, name: "public" });
    return out;
  }
  async function findPublicIp() {
    try { const r = await Promise.race([net.fetch("https://api.ipify.org"), new Promise((_, rej) => setTimeout(() => rej(new Error("t")), 6000))]); const t = (await r.text()).trim(); if (/^\d+\.\d+\.\d+\.\d+$/.test(t)) publicIp = t; } catch {}
  }
  function start() {
    stop();
    const c = cfg();
    lastErr = "";
    server = http.createServer((req, res) => { handle(req, res).catch((e) => { try { send(res, 500, { error: String(e.message || e) }); } catch {} }); });
    server.requestTimeout = 0; server.keepAliveTimeout = 30000; // اتصالات اللوحة المفتوحة بتفضل شغالة
    return new Promise(resolve => {
      server.on("error", (e) => { lastErr = e.code === "EADDRINUSE" ? `البورت ${c.port} مستخدم — غيّره` : String(e.message || e); server = null; resolve(info()); });
      server.listen(localOnly ? 0 : +c.port, localOnly ? '127.0.0.1' : '0.0.0.0', () => {
        if (localOnly) localConfig.port = server.address().port;
        resolve(info());
      });
      if (!localOnly) findPublicIp();
    });
  }
  function stop() {
    for (const cl of clients) { try { clearInterval(cl.ka); cl.res.end(); } catch {} }
    clients.clear();
    if (server) { try { server.close(); server.closeAllConnections && server.closeAllConnections(); } catch {} server = null; }
  }
  function info() {
    const c = cfg();
    return { enabled: !!c.enabled, running: !!(server && server.listening), port: c.port, code: c.code, error: lastErr, viewers: clients.size,
      addresses: addresses().map((x) => ({ ...x, url: `http://${x.ip}:${c.port}` })) };
  }
  function set(patch = {}) {
    const c = cfg();
    if (patch.regen) c.code = newCode();
    if (patch.port && Number.isInteger(+patch.port) && +patch.port >= 1024 && +patch.port <= 65535) c.port = +patch.port;
    if (patch.enabled != null) c.enabled = !!patch.enabled;
    saveSettings();
    if (c.enabled) start(); else stop();
    return new Promise((r) => setTimeout(() => r(info()), 400));
  }
  return { start, stop, info, set, changed, notify, autoStart() { if (cfg().enabled) start(); } };
};
