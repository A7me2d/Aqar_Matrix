// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🎙 الصوت (فويس أوفر) + محوّل الفيديو — بيشتغل في العملية الرئيسية للبرنامج
// • tts: أصوات مايكروسوفت العصبية — Edge (من غير مفتاح) أو Azure (بمفتاحك). بيرجّع MP3.
// • mux: ffmpeg جوه البرنامج بيطلّع MP4 (H.264 + صوت AAC) يتقبّله واتساب وإنستجرام وفيسبوك.
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), crypto = require("crypto"), { spawn } = require("child_process");
let WS = null; try { WS = require("ws"); } catch {}
const { gecV2 } = require("./edgedrm");

const TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4", CHROMIUM = "143.0.3650.75", WIN_EPOCH = 11644473600;
let skew = 0; // فرق ساعة الجهاز عن سيرفر مايكروسوفت (ثواني) — بيتظبط لوحده لو الساعة غلط

// توكن الاتصال النسخة 2 (مايكروسوفت رفضت القديم من 13/10/2026 بـ403) — الخوارزمية في edgedrm.js
const gec2 = () => gecV2(Date.now() / 1000 + skew, TOKEN);
// التوكن القديم (النسخة 1): SHA-256 لوقت الويندوز (متقرّب لـ5 دقايق) + التوكن — بنستخدمه بس في الخطة البديلة
function gec() {
  const sec = Math.floor(Date.now() / 1000 + skew) + WIN_EPOCH, t = sec - (sec % 300);
  return crypto.createHash("sha256").update(String(BigInt(t) * 10000000n) + TOKEN, "ascii").digest("hex").toUpperCase();
}
const D3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], M3 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], p2 = (n) => String(n).padStart(2, "0");
const stamp = () => { const d = new Date(); return `${D3[d.getUTCDay()]} ${M3[d.getUTCMonth()]} ${p2(d.getUTCDate())} ${d.getUTCFullYear()} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())} GMT+0000 (Coordinated Universal Time)`; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
const sgn = (n) => (n >= 0 ? "+" : "") + n;
function ssml(text, voice, rate, pitch, lang) {
  const r = Math.max(-50, Math.min(100, Math.round(+rate || 0))), p = Math.max(-50, Math.min(50, Math.round(+pitch || 0)));
  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang || "en-US"}'><voice name='${voice}'><prosody pitch='${sgn(p)}Hz' rate='${sgn(r)}%' volume='+0%'>${esc(text)}</prosody></voice></speak>`;
}

// alt = العنوان الجديد (api.msedgeservices.com) بالتوكن القديم — خطة بديلة لو الأساسي اترفض
function edgeOnce(text, o, alt) {
  return new Promise((resolve, reject) => {
    if (!WS) return reject(new Error("مكتبة الصوت مش موجودة في النسخة دي"));
    const id = crypto.randomUUID().replace(/-/g, ""), major = CHROMIUM.split(".")[0];
    const url = alt
      ? `wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1?Ocp-Apim-Subscription-Key=${TOKEN}&ConnectionId=${id}&Sec-MS-GEC=${gec()}&Sec-MS-GEC-Version=1-${CHROMIUM}`
      : `${process.env.AQAR_TTS_URL || "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1"}?TrustedClientToken=${TOKEN}&ConnectionId=${id}&Sec-MS-GEC=${gec2()}&Sec-MS-GEC-Version=2-${CHROMIUM}`;
    let ws; try {
      ws = new WS(url, { handshakeTimeout: 12000, headers: { Pragma: "no-cache", "Cache-Control": "no-cache", Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold", "Accept-Encoding": "gzip, deflate, br", "Accept-Language": "en-US,en;q=0.9", "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36 Edg/${major}.0.0.0`, Cookie: "muid=" + crypto.randomBytes(16).toString("hex").toUpperCase() + ";" } });
    } catch (e) { return reject(e); }
    const chunks = []; let done = false;
    const timer = setTimeout(() => fail(new Error("الصوت اتأخر — مفيش رد من مايكروسوفت")), 30000);
    const fail = (e) => { if (done) return; done = true; clearTimeout(timer); try { ws.terminate(); } catch {} reject(e); };
    const ok = () => { if (done) return; done = true; clearTimeout(timer); try { ws.close(); } catch {} const b = Buffer.concat(chunks); b.length ? resolve(b) : reject(new Error("الصوت رجع فاضي")); };
    ws.on("unexpected-response", (req, res) => { const sd = Date.parse(res.headers && res.headers.date); if (sd) skew = (sd - Date.now()) / 1000; const e = new Error("مايكروسوفت رفضت الاتصال (" + res.statusCode + ")"); e.status = res.statusCode; fail(e); });
    ws.on("error", (e) => fail(new Error("مفيش اتصال بسيرفر الصوت: " + ((e && e.message) || e))));
    ws.on("close", () => { if (!done) fail(new Error("الاتصال اتقفل قبل ما الصوت يكمّل")); });
    ws.on("open", () => {
      ws.send(`X-Timestamp:${stamp()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`);
      ws.send(`X-RequestId:${id}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${stamp()}Z\r\nPath:ssml\r\n\r\n${ssml(text, o.voice, o.rate, o.pitch)}`);
    });
    ws.on("message", (data, isBinary) => {
      if (!isBinary) { if (/Path:turn\.end/.test(data.toString())) ok(); return; }
      const b = Buffer.from(data); if (b.length < 2) return; const hl = b.readUInt16BE(0); if (b.length < 2 + hl) return;
      if (/Path:audio/.test(b.slice(2, 2 + hl).toString())) chunks.push(b.slice(2 + hl));
    });
  });
}
async function edge(text, o) {
  let first;
  try { return await edgeOnce(text, o); } catch (e) { first = e; }
  if (first && first.status === 403) { try { return await edgeOnce(text, o); } catch (e) { first = e; } } // 403 ممكن تكون الساعة: اتظبطت من رد السيرفر، نجرّب تاني
  if (!process.env.AQAR_TTS_URL && first && first.status) { try { return await edgeOnce(text, o, true); } catch {} } // خطة بديلة (العنوان الجديد)؛ لو فشلت بنرجّع الخطأ الأساسي
  throw first;
}
async function azure(text, o, fetchFn) {
  const region = String(o.azRegion || "").trim(), key = String(o.azKey || "").trim();
  if (!/^[a-z0-9-]{3,30}$/i.test(region) || key.length < 20) throw new Error("حط مفتاح Azure Speech والمنطقة (مثلًا uaenorth) في إعدادات الصوت");
  const r = await fetchFn(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3", "User-Agent": "AqarMatrix" }, body: ssml(text, o.voice, o.rate, o.pitch, o.voice.slice(0, 5)) });
  if (!r.ok) throw new Error("Azure رجّع " + r.status + (r.status === 401 || r.status === 403 ? " — المفتاح أو المنطقة غلط" : r.status === 429 ? " — عدّيت الحد المجاني" : ""));
  return Buffer.from(await r.arrayBuffer());
}
async function tts(o, fetchFn) {
  const text = String(o.text || "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ").trim().slice(0, 1800), voice = String(o.voice || "");
  if (!text) return { ok: false, error: "النص فاضي" };
  if (!/^ar-[A-Z]{2}-[A-Za-z]{3,20}Neural$/.test(voice)) return { ok: false, error: "الصوت ده مش مدعوم" };
  const engine = o.engine === "azure" ? "azure" : "edge";
  let last = null;
  for (let k = 0; k < 2; k++) {
    try { const data = engine === "azure" ? await azure(text, { ...o, voice }, fetchFn || fetch) : await edge(text, { ...o, voice }); return { ok: true, data, mime: "audio/mpeg", engine }; }
    catch (e) { last = e; if (/مفتاح|المنطقة|غلط|الحد|النص/.test(String(e.message))) break; await new Promise((r) => setTimeout(r, 400)); }
  }
  const msg = String((last && last.message) || last).slice(0, 200);
  return { ok: false, error: msg + (engine === "edge" && /\((?:403|404|410)\)/.test(msg) ? " — سيرفر الصوت المجاني اتغيّر: حدّث البرنامج، أو حط مفتاح Azure من إعدادات الصوت" : "") };
}

// ===== ffmpeg =====
function ffbin() {
  const exe = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  for (let p of [process.env.AQAR_FFMPEG, path.join(__dirname, "..", "node_modules", "ffmpeg-static", exe)]) {
    if (!p) continue; p = p.replace(/app\.asar([\\/])/, "app.asar.unpacked$1");
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return null;
}
function run(bin, args, ms) {
  return new Promise((resolve, reject) => {
    let err = "", p; try { p = spawn(bin, args, { windowsHide: true }); } catch (e) { return reject(e); }
    const to = setTimeout(() => { try { p.kill("SIGKILL"); } catch {} reject(new Error("المحوّل أخد وقت طويل وقفته")); }, ms);
    p.stderr.on("data", (d) => { err = (err + d).slice(-1500); }); p.on("error", (e) => { clearTimeout(to); reject(e); });
    p.on("close", (c) => { clearTimeout(to); c === 0 ? resolve() : reject(new Error("المحوّل فشل: " + err.trim().split("\n").slice(-2).join(" ").slice(0, 240))); });
  });
}
// o: { video: Uint8Array (mp4/webm), audio?: Uint8Array (wav), copy?: bool (الفيديو أصلًا H.264), secs?: number }
async function mux(o) {
  const bin = ffbin(); if (!bin) return { ok: false, error: "محوّل الفيديو مش موجود في النسخة دي" };
  if (!o || !o.video || !o.video.length) return { ok: false, error: "مفيش فيديو" };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aqmux-")), vi = path.join(dir, "v.mp4"), ai = path.join(dir, "a.wav"), out = path.join(dir, "out.mp4"), hasA = !!(o.audio && o.audio.length);
  try {
    fs.writeFileSync(vi, Buffer.from(o.video.buffer ? o.video.buffer.slice(o.video.byteOffset, o.video.byteOffset + o.video.byteLength) : o.video)); if (hasA) fs.writeFileSync(ai, Buffer.from(o.audio.buffer ? o.audio.buffer.slice(o.audio.byteOffset, o.audio.byteOffset + o.audio.byteLength) : o.audio));
    const a = ["-y", "-hide_banner", "-loglevel", "error", "-i", vi, ...(hasA ? ["-i", ai] : []), "-map", "0:v:0", ...(hasA ? ["-map", "1:a:0"] : []),
      ...(o.copy ? ["-c:v", "copy"] : ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", "30"]),
      ...(hasA ? ["-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "1"] : ["-an"]), ...(o.secs > 0 ? ["-t", (+o.secs).toFixed(3)] : []), "-movflags", "+faststart", out];
    await run(bin, a, 5 * 60 * 1000);
    return { ok: true, data: fs.readFileSync(out) };
  } catch (e) { return { ok: false, error: String((e && e.message) || e).slice(0, 300) }; }
  finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} }
}
const info = () => ({ edge: !!WS, ffmpeg: !!ffbin() });
module.exports = { tts, mux, info, ssml, gec, gec2, _edge: edge };
