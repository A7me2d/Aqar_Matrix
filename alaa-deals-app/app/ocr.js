// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🖼 قراءة الصور (OCR عربي + أرقام) — بتشتغل جوه البرنامج من غير إنترنت (tesseract.js + نموذج عربي)
// بتتنده من المحرك عن طريق app:ocr، وبترجّع النص المقروء من صورة بوست فيسبوك.
const path = require("path");
const { net, nativeImage } = require("electron");

// جوه حزمة asar الملفات التنفيذية (worker/wasm) لازم تتقري من الفولدر المفكوك
const unpacked = (p) => p.replace(/app\.asar([\\/])/, "app.asar.unpacked$1");
const DATA = unpacked(path.join(__dirname, "ocr-data"));
const HOST_OK = /(^|\.)(fbcdn\.net|facebook\.com|fbsbx\.com|cdninstagram\.com)$/i; // صور فيسبوك/إنستجرام بس
const MAX_BYTES = 10 * 1024 * 1024, MAX_W = 2000, IDLE_MS = 90 * 1000, TIMEOUT_MS = 60 * 1000;

let worker = null, starting = null, idleT = null, chain = Promise.resolve();
const stats = { ok: 0, fail: 0, ms: 0, lastError: "", since: Date.now() };

async function getWorker() {
  if (worker) return worker;
  if (starting) return starting;
  starting = (async () => {
    const T = require("tesseract.js");
    const tjsDir = path.dirname(unpacked(require.resolve("tesseract.js/package.json")));
    const w = await T.createWorker(["ara", "eng"], 1, {
      langPath: DATA, gzip: true, cacheMethod: "none",
      workerPath: path.join(tjsDir, "src", "worker-script", "node", "index.js"),
      logger: () => {}, errorHandler: (e) => { stats.lastError = String((e && e.message) || e).slice(0, 200); },
    });
    worker = w;
    return w;
  })().finally(() => { starting = null; });
  return starting;
}

function scheduleIdle() {
  clearTimeout(idleT);
  idleT = setTimeout(async () => { const w = worker; worker = null; if (w) { try { await w.terminate(); } catch {} } }, IDLE_MS);
  if (idleT.unref) idleT.unref();
}

const kind = (b) => (b[0] === 0xff && b[1] === 0xd8 ? "jpg" : b[0] === 0x89 && b[1] === 0x50 ? "png" : b.slice(0, 4).toString() === "RIFF" && b.slice(8, 12).toString() === "WEBP" ? "webp" : b.slice(0, 2).toString() === "BM" ? "bmp" : "");

async function fetchImage(url) {
  let u;
  try { u = new URL(url); } catch { throw new Error("رابط غلط"); }
  const testOk = process.env.ALAA_TEST === "1" && u.protocol === "http:" && u.hostname === "127.0.0.1"; // للاختبارات بس
  if (!testOk && (u.protocol !== "https:" || !HOST_OK.test(u.hostname))) throw new Error("مصدر الصورة مش مسموح");
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 25000);
  try {
    // من غير webp في الـ Accept عشان فيسبوك يرجّع JPEG (اللي بنقدر نقراه)
    const r = await net.fetch(url, { headers: { Accept: "image/jpeg,image/png,image/*;q=0.5" }, referrer: "https://www.facebook.com/", signal: ctl.signal });
    if (!r.ok) throw new Error("الصورة مش متاحة (" + r.status + ") — الرابط ممكن يكون انتهى");
    const len = +r.headers.get("content-length") || 0;
    if (len > MAX_BYTES) throw new Error("الصورة كبيرة");
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX_BYTES) throw new Error("الصورة كبيرة");
    return buf;
  } finally { clearTimeout(t); }
}

// الصورة الكبيرة جدًا بتتصغّر (أسرع من غير ما الدقة تتأثر)، والـ WebP بيتحوّل لـ PNG لو الجهاز يقدر
function prep(buf) {
  const k = kind(buf);
  let img = null;
  if (k === "webp" || !k) { img = nativeImage.createFromBuffer(buf); if (img.isEmpty()) throw new Error("صيغة الصورة مش مدعومة"); }
  else if (k === "jpg" || k === "png") {
    try { const i = nativeImage.createFromBuffer(buf); const s = i.getSize(); if (s.width > MAX_W) img = i; } catch {}
  }
  if (img) {
    const s = img.getSize();
    const out = s.width > MAX_W ? img.resize({ width: MAX_W, quality: "best" }) : img;
    return out.toPNG();
  }
  return buf;
}

function run(job) {
  const p = chain.then(job, job);
  chain = p.catch(() => {});
  return p;
}

// url → { ok, text, conf, ms } | { ok:false, error }
function read(url) {
  return run(async () => {
    const t0 = Date.now();
    try {
      const raw = await fetchImage(url);
      const png = prep(raw);
      const w = await getWorker();
      const res = await Promise.race([w.recognize(png), new Promise((_, rej) => setTimeout(() => rej(new Error("القراية خدت وقت طويل")), TIMEOUT_MS))]);
      scheduleIdle();
      const ms = Date.now() - t0;
      stats.ok++; stats.ms += ms;
      return { ok: true, text: String((res.data && res.data.text) || ""), conf: Math.round((res.data && res.data.confidence) || 0), ms };
    } catch (e) {
      stats.fail++; stats.lastError = String(e.message || e).slice(0, 200);
      if (/القراية خدت|worker|terminated/i.test(stats.lastError)) { const w = worker; worker = null; if (w) { try { await w.terminate(); } catch {} } }
      return { ok: false, error: stats.lastError };
    }
  });
}

// تجربة من ملف/بفر مباشر (للاختبارات)
function readBuffer(buf) {
  return run(async () => {
    const t0 = Date.now();
    const w = await getWorker();
    const res = await w.recognize(prep(buf));
    scheduleIdle();
    return { ok: true, text: String(res.data.text || ""), conf: Math.round(res.data.confidence || 0), ms: Date.now() - t0 };
  });
}

async function stop() { clearTimeout(idleT); const w = worker; worker = null; if (w) { try { await w.terminate(); } catch {} } }

module.exports = { read, readBuffer, stop, info: () => ({ ...stats, running: !!worker }) };
