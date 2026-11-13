// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 📁 ملفات الحفظ متزامنة بين كل الأجهزة المربوطة: الأرشيف القديم + النسخ الكاملة + ملفات الأيام
// الفكرة: كل جهاز عنده فولدر (التحميلات/AlaaDealsExt). أي ملف في archive / backups / daily موجود على جهاز ومش موجود على التاني
// بيتنقل (سحب + دفع) — فأي جهاز جديد بياخد التاريخ كله من أول مرة، ولو جهاز كان فاصل وقت الأرشفة ياخد الملف لما يرجع.
// - مبنقلش latest (كل جهاز له نسخته) ولا exports (تحميلاتك الشخصية).
// - مبنكتبش فوق ملف موجود بنفس الاسم (ملفات اليوم بنفس التاريخ بتفضل نسخة كل جهاز).
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { pipeline } = require("stream/promises");
const { Readable } = require("stream");

const FOLDERS = ["archive", "backups", "daily"];
const NAME_OK = /^[\w .()؀-ۿ\-]{1,160}\.json$/;

module.exports = function xfiles({ dir, net, getPeers, log = () => {}, maxBytes = 800 * 1024 * 1024, every = 3 * 60e3 }) {
  const S = { at: 0, got: 0, sent: 0, err: "", running: false, peers: 0, lastRel: "" };
  let timer = null, again = false;
  const base = path.resolve(dir);

  // مسار الملف الآمن (فولدر من التلاتة + اسم .json عادي) — غير كده null
  function safe(rel) {
    const parts = String(rel || "").split("/");
    if (parts.length !== 2 || !FOLDERS.includes(parts[0]) || !NAME_OK.test(parts[1]) || parts[1].includes("..")) return null;
    const full = path.resolve(base, parts[0], parts[1]);
    return full.startsWith(base + path.sep) ? full : null;
  }
  function list() {
    const out = [];
    for (const f of FOLDERS) {
      let names = []; try { names = fs.readdirSync(path.join(base, f)); } catch { continue; }
      for (const n of names) {
        if (!NAME_OK.test(n)) continue;
        try { const st = fs.statSync(path.join(base, f, n)); if (st.isFile() && st.size > 0) out.push({ rel: f + "/" + n, size: st.size, mtime: Math.round(st.mtimeMs) }); } catch {}
      }
    }
    return out;
  }
  // للسيرفر: ابعت ملف (بيتضغط)
  function serve(rel, req, res) {
    const full = safe(rel); let st; try { st = full && fs.statSync(full); } catch {}
    if (!st || !st.isFile()) { res.writeHead(404, { "Content-Type": "application/json" }); return res.end('{"error":"not found"}'); }
    const gz = /\bgzip\b/.test(req.headers["accept-encoding"] || "");
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...(gz ? { "Content-Encoding": "gzip" } : { "Content-Length": st.size }) });
    const rs = fs.createReadStream(full);
    (gz ? pipeline(rs, zlib.createGzip({ level: 3 }), res) : pipeline(rs, res)).catch(() => { try { res.destroy(); } catch {} });
  }
  // للسيرفر: استلم ملف جاي من جهاز تاني (مش بنكتب فوق موجود)
  async function receive(rel, req) {
    const full = safe(rel); if (!full) return { ok: false, code: 400, error: "bad name" };
    if (fs.existsSync(full)) return { ok: true, exists: true };
    fs.mkdirSync(path.dirname(full), { recursive: true });
    const tmp = full + ".part", ws = fs.createWriteStream(tmp);
    let n = 0;
    const cap = new (require("stream").Transform)({ transform(c, e, cb) { n += c.length; cb(n > maxBytes ? new Error("too big") : null, c); } });
    const gz = /gzip/i.test(req.headers["content-encoding"] || "");
    try {
      await (gz ? pipeline(req, zlib.createGunzip(), cap, ws) : pipeline(req, cap, ws));
      if (fs.existsSync(full)) { fs.rmSync(tmp, { force: true }); return { ok: true, exists: true }; }
      fs.renameSync(tmp, full); return { ok: true, size: n };
    } catch (e) { try { fs.rmSync(tmp, { force: true }); } catch {} return { ok: false, code: 500, error: String(e.message || e) }; }
  }

  // مهلة تغطي الطلب كله (لو الجهاز التاني وقف في النص نقفل ونكمّل بعدين)
  async function guard(ms, fn) { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); try { return await fn(c.signal); } finally { clearTimeout(t); } }
  async function pullFile(p, rel) {
    const full = safe(rel); if (!full || fs.existsSync(full)) return false;
    return guard(20 * 60e3, async (signal) => {
      const r = await net.fetch(p.base + "/api/files/get?rel=" + encodeURIComponent(rel), { headers: { "X-Token": p.code, "Accept-Encoding": "gzip" }, signal });
      if (!r.ok || !r.body) throw new Error("get " + r.status);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      const tmp = full + ".part";
      try { await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(tmp)); if (fs.existsSync(full)) fs.rmSync(tmp, { force: true }); else fs.renameSync(tmp, full); }
      catch (e) { try { fs.rmSync(tmp, { force: true }); } catch {} throw e; }
      return true;
    });
  }
  async function pushFile(p, rel) {
    const full = safe(rel); if (!full) return false;
    const buf = zlib.gzipSync(fs.readFileSync(full), { level: 3 });
    return guard(20 * 60e3, async (signal) => {
      const r = await net.fetch(p.base + "/api/files/put?rel=" + encodeURIComponent(rel), { method: "POST", headers: { "X-Token": p.code, "Content-Type": "application/octet-stream", "Content-Encoding": "gzip" }, body: buf, signal });
      if (!r.ok) throw new Error("put " + r.status);
      const j = await r.json().catch(() => ({}));
      return !!(j && j.ok && !j.exists);
    });
  }

  // مزامنة مع كل الأجهزة المربوطة: نسحب اللي ناقصنا وندفع اللي ناقصهم
  async function sync() {
    if (S.running) { again = true; return S; }
    S.running = true;
    try {
      const peers = (getPeers() || []).filter((p) => p && p.base && p.code && p.on !== false);
      S.peers = peers.length; let err = "";
      for (const p of peers) {
        try {
          const theirs = new Map((await guard(30e3, async (signal) => {
            const r = await net.fetch(p.base + "/api/files/list", { headers: { "X-Token": p.code }, signal });
            if (!r.ok) throw new Error("list " + r.status);
            return (await r.json()).files || [];
          })).map((f) => [f.rel, f]));
          const mine = new Map(list().map((f) => [f.rel, f]));
          for (const [rel, f] of theirs) if (!mine.has(rel) && f.size <= maxBytes) { try { if (await pullFile(p, rel)) { S.got++; S.lastRel = rel; log("file in", rel); } } catch (e) { err = "سحب " + rel + ": " + (e.message || e); } }
          for (const [rel, f] of mine) if (!theirs.has(rel) && f.size <= maxBytes) { try { if (await pushFile(p, rel)) { S.sent++; log("file out", rel); } } catch (e) { err = "دفع " + rel + ": " + (e.message || e); } }
        } catch (e) { err = String((e && e.message) || e); }
      }
      S.err = err; S.at = Date.now();
    } finally { S.running = false; }
    if (again) { again = false; setTimeout(() => sync().catch(() => {}), 500); }
    return S;
  }
  function start() { stop(); timer = setInterval(() => sync().catch(() => {}), every); setTimeout(() => sync().catch(() => {}), 8000); }
  function stop() { clearInterval(timer); timer = null; }
  const info = () => ({ at: S.at, got: S.got, sent: S.sent, err: S.err, peers: S.peers, files: list().length, running: S.running, last: S.lastRel });
  return { FOLDERS, safe, list, serve, receive, sync, start, stop, info };
};
