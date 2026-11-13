// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🎙 فويس أوفر الريلز: نص مصري من بيانات القطعة + أرقام بالعامية + أصوات عصبية (من جوه البرنامج) + ميكس الصوت
// الصوت بييجي من مايكروسوفت (Edge) من غير مفتاح، أو Azure بمفتاحك — والاتنين عن طريق برنامج الويندوز (alaaApp.call("tts"))
(function (g) {
  "use strict";
  // ===== أرقام بالعامية المصرية =====
  const ONES = ["صفر", "واحد", "اتنين", "تلاتة", "أربعة", "خمسة", "ستة", "سبعة", "تمانية", "تسعة", "عشرة", "احداشر", "اتناشر", "تلتاشر", "أربعتاشر", "خمستاشر", "ستاشر", "سبعتاشر", "تمنتاشر", "تسعتاشر"];
  const TENS = ["", "", "عشرين", "تلاتين", "أربعين", "خمسين", "ستين", "سبعين", "تمانين", "تسعين"];
  const HUND = ["", "مية", "ميتين", "تلتمية", "ربعمية", "خمسمية", "ستمية", "سبعمية", "تمنمية", "تسعمية"];
  const TH = ["", "ألف", "ألفين", "تلات تلاف", "أربع تلاف", "خمس تلاف", "ست تلاف", "سبع تلاف", "تمن تلاف", "تسع تلاف", "عشر تلاف"];
  const j = (a) => a.filter(Boolean).join(" و");
  function b1000(n) { // 1..999
    const h = Math.floor(n / 100), r = n % 100;
    return j([HUND[h], r ? (r < 20 ? ONES[r] : r % 10 ? ONES[r % 10] + " و" + TENS[Math.floor(r / 10)] : TENS[r / 10]) : ""]);
  }
  function thou(n) { // 1..999 ألف
    if (n <= 10) return TH[n];
    const r = n % 100; if (r >= 3 && r <= 10) return j([n >= 100 ? HUND[Math.floor(n / 100)] : "", TH[r]]);
    return b1000(n) + " ألف";
  }
  function mill(n) { return n === 1 ? "مليون" : n === 2 ? "مليونين" : b1000(n) + " مليون"; }
  function numAr(v) {
    let n = Math.round(Number(v)); if (!isFinite(n)) return ""; if (n < 0) return "ناقص " + numAr(-n); if (n === 0) return "صفر";
    if (n >= 1e9) return String(n);
    const M = Math.floor(n / 1e6), K = Math.floor((n % 1e6) / 1e3), R = n % 1e3;
    if (M && K === 500 && !R) return mill(M) + " ونص"; // مليون ونص
    return j([M ? mill(M) : "", K ? thou(K) : "", R ? b1000(R) : ""]);
  }
  const DIG = ["صفر", "واحد", "اتنين", "تلاتة", "أربعة", "خمسة", "ستة", "سبعة", "تمانية", "تسعة"];
  // رقم تليفون: أرقام واحد واحد في مجموعات (3-4-4) وبينها وقفة
  function phoneAr(p) {
    let d = String(p || "").replace(/[٠-٩]/g, (c) => "٠١٢٣٤٥٦٧٨٩".indexOf(c)).replace(/\D/g, ""); if (/^20\d{10}$/.test(d)) d = "0" + d.slice(2); if (!d) return "";
    const gs = d.length === 11 ? [3, 4, 4] : d.length === 10 ? [3, 3, 4] : [3, 3, 3, 4]; const out = []; let k = 0;
    for (const n of d.length === 11 || d.length === 10 ? gs : []) { out.push(d.slice(k, k + n)); k += n; } if (!out.length) for (let q = 0; q < d.length; q += 3) out.push(d.slice(q, q + 3));
    return out.map((s) => s.split("").map((c) => DIG[+c]).join(" ")).join("، ");
  }
  const r10 = (d) => (d < 50 ? Math.max(10, Math.round(d / 10) * 10) : d < 1000 ? Math.round(d / 10) * 10 : Math.round(d / 50) * 50);
  const metersAr = (d) => numAr(r10(d)) + " متر";
  const priceAr = (v) => numAr(v) + " جنيه";
  // نص → كلام: بيشيل الإيموجي والرموز ويكتب الأرقام بالحروف (م² = متر / ج = جنيه / % = في المية)
  function spoken(t, dict) {
    let s = String(t == null ? "" : t);
    for (const [a, b] of dict || []) if (a) s = s.split(a).join(b);
    s = s.replace(/AM-[A-Z0-9]{4,8}/gi, "").replace(/[‎‏‪-‮]/g, "");
    s = s.replace(/(\d[\d,.]*)\s*(?:مليون)(?![ء-ي])/g, (m, a) => numAr(parseFloat(a.replace(/,/g, "")) * 1e6));
    s = s.replace(/(\d[\d,.]*)\s*(?:م²|م2|متر مربع)/g, (m, a) => numAr(parseFloat(a.replace(/,/g, ""))) + " متر").replace(/(\d[\d,.]*)\s*م(?![ء-ي])/g, (m, a) => numAr(parseFloat(a.replace(/,/g, ""))) + " متر");
    s = s.replace(/(\d[\d,.]*)\s*ج(?![ء-ي])/g, (m, a) => numAr(parseFloat(a.replace(/,/g, ""))) + " جنيه");
    s = s.replace(/(\d[\d,.]*)\s*%/g, (m, a) => numAr(parseFloat(a.replace(/,/g, ""))) + " في المية");
    s = s.replace(/\d[\d,]*(?:\.\d+)?/g, (m) => { const v = parseFloat(m.replace(/,/g, "")); return isFinite(v) ? (Number.isInteger(v) ? numAr(v) : numAr(Math.floor(v)) + " فاصلة " + m.split(".")[1].split("").map((c) => DIG[+c]).join(" ")) : m; });
    s = s.replace(/[·•|—–]/g, "، ").replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}]/gu, " ").replace(/[«»"“”<>*_#~^\\\/]/g, " ").replace(/\s*،\s*(?:،\s*)+/g, "، ").replace(/\s+/g, " ").replace(/\s+([،.؟!])/g, "$1").trim();
    return s.replace(/^[،.\s]+|[،\s]+$/g, "");
  }
  // قاموس النطق: سطر لكل قاعدة «الكلمة = نطقها»
  const parseDict = (txt) => String(txt || "").split(/\n/).map((l) => l.split("=")).filter((a) => a.length >= 2 && a[0].trim()).map((a) => [a[0].trim(), a.slice(1).join("=").trim()]);

  // ===== الأصوات (لهجات) =====
  const VOICES = [
    { id: "ar-EG-SalmaNeural", d: "مصري", n: "سلمى", f: 1 }, { id: "ar-EG-ShakirNeural", d: "مصري", n: "شاكر", f: 0 },
    { id: "ar-SA-ZariyahNeural", d: "سعودي", n: "زارية", f: 1 }, { id: "ar-SA-HamedNeural", d: "سعودي", n: "حامد", f: 0 },
    { id: "ar-AE-FatimaNeural", d: "إماراتي", n: "فاطمة", f: 1 }, { id: "ar-AE-HamdanNeural", d: "إماراتي", n: "حمدان", f: 0 },
    { id: "ar-JO-SanaNeural", d: "أردني", n: "سناء", f: 1 }, { id: "ar-JO-TaimNeural", d: "أردني", n: "تيم", f: 0 },
    { id: "ar-LB-LaylaNeural", d: "لبناني", n: "ليلى", f: 1 }, { id: "ar-LB-RamiNeural", d: "لبناني", n: "رامي", f: 0 },
    { id: "ar-KW-NouraNeural", d: "كويتي", n: "نورة", f: 1 }, { id: "ar-KW-FahedNeural", d: "كويتي", n: "فهد", f: 0 },
    { id: "ar-QA-AmalNeural", d: "قطري", n: "أمل", f: 1 }, { id: "ar-QA-MoazNeural", d: "قطري", n: "معاذ", f: 0 },
    { id: "ar-IQ-RanaNeural", d: "عراقي", n: "رنا", f: 1 }, { id: "ar-IQ-BasselNeural", d: "عراقي", n: "باسل", f: 0 },
    { id: "ar-SY-AmanyNeural", d: "سوري", n: "أماني", f: 1 }, { id: "ar-SY-LaithNeural", d: "سوري", n: "ليث", f: 0 },
    { id: "ar-LY-ImanNeural", d: "ليبي", n: "إيمان", f: 1 }, { id: "ar-LY-OmarNeural", d: "ليبي", n: "عمر", f: 0 },
    { id: "ar-MA-MounaNeural", d: "مغربي", n: "منى", f: 1 }, { id: "ar-MA-JamalNeural", d: "مغربي", n: "جمال", f: 0 },
    { id: "ar-TN-ReemNeural", d: "تونسي", n: "ريم", f: 1 }, { id: "ar-TN-HediNeural", d: "تونسي", n: "هادي", f: 0 },
    { id: "ar-DZ-AminaNeural", d: "جزائري", n: "أمينة", f: 1 }, { id: "ar-DZ-IsmaelNeural", d: "جزائري", n: "إسماعيل", f: 0 },
  ];
  // أنماط جاهزة (سرعة ونبرة) — وكل رقم ممكن تعدّله بعدها
  const PRESETS = { hot: { n: "حماسي (بيّاع)", rate: 8, pitch: 4 }, calm: { n: "هادي ورسمي", rate: -6, pitch: -2 }, friendly: { n: "ودود", rate: 0, pitch: 2 }, fast: { n: "سريع (ريلز)", rate: 16, pitch: 2 } };
  const DEF = { on: true, engine: "edge", voice: "ar-EG-SalmaNeural", rate: 4, pitch: 0, vol: 100, gap: 0.25, phone: true, dict: "", azKey: "", azRegion: "", preset: "friendly" };
  async function loadCfg() { try { const { rvVoice } = await chrome.storage.local.get("rvVoice"); return { ...DEF, on: native(), ...(rvVoice || {}) }; } catch { return { ...DEF, on: native() }; } }
  async function saveCfg(c) { try { await chrome.storage.local.set({ rvVoice: c }); } catch {} }

  // ===== جلب الصوت =====
  const cache = new Map(); let ctx = null;
  const actx = () => (ctx && ctx.state !== "closed" ? ctx : (ctx = new (g.AudioContext || g.webkitAudioContext)({ sampleRate: 48000 })));
  const native = () => !!(g.alaaApp && g.alaaApp.call);
  const keyOf = (t, c) => JSON.stringify([c.engine, c.voice, c.rate, c.pitch, String(t || "").trim()]);
  const peek = (t, c) => cache.get(keyOf(t, c)) || null; // مقطع اتولّد قبل كده (بنستخدمه في حساب التوقيت من غير نداء)
  function ssmlOf(text, c) { return null; } // الـSSML بيتبني في برنامج الويندوز (voice.js)
  async function synth(text, c) {
    const t = String(text || "").trim(); if (!t) return null;
    const key = keyOf(t, c);
    if (cache.has(key)) return cache.get(key);
    let r; const o = { engine: c.engine, voice: c.voice, rate: c.rate, pitch: c.pitch, text: t, azKey: c.azKey, azRegion: c.azRegion };
    if (native()) r = await g.alaaApp.call("tts", o);
    else if (c.engine === "azure" && c.azKey && c.azRegion && g.fetch) { // من الإضافة: Azure بس (بمفتاحك)
      const v = VOICES.find((x) => x.id === c.voice) || VOICES[0], lang = v.id.slice(0, 5), pr = `rate='${c.rate >= 0 ? "+" : ""}${c.rate}%' pitch='${c.pitch >= 0 ? "+" : ""}${c.pitch}Hz'`;
      const esc = t.replace(/[<>&'"]/g, (x) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[x]));
      const res = await fetch(`https://${c.azRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": c.azKey, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3" }, body: `<speak version='1.0' xml:lang='${lang}'><voice name='${v.id}'><prosody ${pr}>${esc}</prosody></voice></speak>` });
      r = res.ok ? { ok: true, data: new Uint8Array(await res.arrayBuffer()) } : { ok: false, error: "Azure رجّع " + res.status };
    } else throw new Error("الفويس بيشتغل من برنامج الويندوز (أو Azure بمفتاحك من الإضافة)");
    if (!r || !r.ok) throw new Error((r && r.error) || "الصوت مجاش");
    const u8 = r.data instanceof Uint8Array ? r.data : new Uint8Array(r.data), ab = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
    const buf = await actx().decodeAudioData(ab); const out = trim(buf); cache.set(key, out); if (cache.size > 80) cache.delete(cache.keys().next().value); return out;
  }
  // قص الصمت من أول وآخر المقطع (بيخلّي التزامن مضبوط) + ضبط الارتفاع
  function trim(b) {
    const d = b.getChannelData(0), n = d.length, th = 0.012; let a = 0, z = n - 1; while (a < n && Math.abs(d[a]) < th) a++; while (z > a && Math.abs(d[z]) < th) z--;
    const pad = Math.round(b.sampleRate * 0.05); a = Math.max(0, a - pad); z = Math.min(n - 1, z + pad); const len = Math.max(1, z - a + 1);
    const out = actx().createBuffer(1, len, b.sampleRate), o = out.getChannelData(0); let pk = 0; for (let i = 0; i < len; i++) { const v = d[a + i]; o[i] = v; const m = Math.abs(v); if (m > pk) pk = m; }
    const k = pk > 0.001 ? 0.89 / pk : 1; for (let i = 0; i < len; i++) o[i] *= k; return out;
  }
  // ميكس: كل مقطع في وقته على مسار واحد (مدة الفيديو) — بيرجّع Float32 مونو 48k
  async function mix(clips, T, vol) {
    const sr = 48000, N = Math.max(1, Math.ceil(T * sr)), oc = new (g.OfflineAudioContext || g.webkitOfflineAudioContext)(1, N, sr), gn = oc.createGain(); gn.gain.value = Math.max(0, Math.min(2, (vol == null ? 100 : vol) / 100)); gn.connect(oc.destination);
    for (const c of clips) { if (!c.buf) continue; const s = oc.createBufferSource(); s.buffer = c.buf; s.connect(gn); s.start(Math.max(0, c.at)); }
    return (await oc.startRendering()).getChannelData(0);
  }
  function wavOf(f32, sr) {
    const n = f32.length, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) { const s = Math.max(-1, Math.min(1, f32[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); } return new Uint8Array(b);
  }
  g.RVV = { peek, keyOf, numAr, phoneAr, metersAr, priceAr, spoken, parseDict, VOICES, PRESETS, DEF, loadCfg, saveCfg, synth, mix, wavOf, native, clearCache: () => cache.clear(), r10 };
})(globalThis);
