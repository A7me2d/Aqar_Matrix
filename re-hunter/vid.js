// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🎬 مساعد رفع الفيديو في لوحة التحكم (واتساب + نشر الجروبات): فحص النوع والحجم، قراءة الملف، صورة معاينة.
// الفيديو بيتخزّن في مفتاح لوحده لكل رسالة/بوست (waVD:<id> / pubVD:<id>) عشان قراءة وكتابة الصور والإعدادات تفضل خفيفة،
// ومعاينته الصغيرة (صورة) في خريطة خفيفة waVids / pubVids.
(function (root) {
  const VID = {};
  VID.MAX = 30 * 1024 * 1024;      // أقصى حجم للفيديو (واتساب ويب وفيسبوك بيشتغلوا كويس لحد كده، وبعده الرفع بيعلّق)
  VID.MAX_MB = 30;
  VID.ACCEPT = "video/mp4,video/quicktime,video/3gpp,.mp4,.mov,.m4v,.3gp";
  const EXT = { mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime", "3gp": "video/3gpp", "3gpp": "video/3gpp" };
  VID.typeOf = function (f) {
    const t = String((f && f.type) || "").toLowerCase(); if (/^video\/(mp4|quicktime|3gpp)$/.test(t)) return t;
    const m = /\.([a-z0-9]+)$/i.exec((f && f.name) || ""); return (m && EXT[m[1].toLowerCase()]) || "";
  };
  VID.size = (n) => { n = +n || 0; return n >= 1048576 ? (n / 1048576).toFixed(n >= 10485760 ? 0 : 1) + " ميجا" : Math.max(1, Math.round(n / 1024)) + " كيلو"; };
  VID.dur = (s) => { s = Math.round(+s || 0); return s > 0 ? Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") : ""; };
  VID.isData = (d) => typeof d === "string" && /^data:video\/(mp4|quicktime|3gpp);base64,/.test(d);
  // رسالة الخطأ بالعربي لو الملف مش مناسب (أو "" لو تمام)
  VID.check = function (f) {
    if (!f) return "مفيش ملف";
    if (!VID.typeOf(f)) return "نوع الفيديو مش مدعوم — استخدم MP4 أو MOV (واتساب وفيسبوك مبيقبلوش غيرهم بثبات)";
    if (f.size > VID.MAX) return `الفيديو حجمه ${VID.size(f.size)} — الحد الأقصى ${VID.MAX_MB} ميجا. صغّره الأول (من الموبايل أو أي برنامج ضغط فيديو) وجرّب تاني`;
    if (!f.size) return "الملف فاضي";
    return "";
  };
  VID.read = (f) => new Promise((res, rej) => {
    const r = new FileReader(); r.onload = () => { const d = String(r.result || ""), t = VID.typeOf(f); res(d.replace(/^data:[^;,]*/, "data:" + t)); }; r.onerror = () => rej(new Error("مقدرتش أقرا الملف")); r.readAsDataURL(f);
  });
  // صورة معاينة صغيرة + المدة والأبعاد (مبترفضش أبدًا — لو الكودك مش مدعوم بترجع من غير صورة)
  VID.poster = (f) => new Promise((res) => {
    const out = { poster: "", dur: 0, w: 0, h: 0 }; let done = false, url = "", v = null, tm = 0;
    const fin = () => { if (done) return; done = true; clearTimeout(tm); try { if (v) { v.removeAttribute("src"); v.load(); } } catch {} try { if (url) URL.revokeObjectURL(url); } catch {} res(out); };
    try {
      url = URL.createObjectURL(f); v = document.createElement("video"); v.muted = true; v.playsInline = true; v.preload = "metadata"; tm = setTimeout(fin, 9000);
      v.onloadedmetadata = () => { out.dur = isFinite(v.duration) ? v.duration : 0; out.w = v.videoWidth || 0; out.h = v.videoHeight || 0; try { v.currentTime = Math.min(1, (out.dur || 2) / 2); } catch { fin(); } };
      v.onseeked = () => { try { const k = Math.min(1, 320 / Math.max(v.videoWidth || 1, v.videoHeight || 1)), c = document.createElement("canvas"); c.width = Math.max(1, Math.round(v.videoWidth * k)); c.height = Math.max(1, Math.round(v.videoHeight * k)); c.getContext("2d").drawImage(v, 0, 0, c.width, c.height); out.poster = c.toDataURL("image/jpeg", 0.7); } catch {} fin(); };
      v.onerror = fin; v.src = url;
    } catch { fin(); }
  });
  // ملف ← { meta, data } جاهزين للتخزين (بيرمي Error بالعربي لو الملف مرفوض)
  VID.make = async function (f) {
    const bad = VID.check(f); if (bad) throw new Error(bad);
    const [data, p] = await Promise.all([VID.read(f), VID.poster(f)]);
    return { meta: { name: String(f.name || "video").slice(0, 80), type: VID.typeOf(f), size: f.size, dur: Math.round(p.dur * 10) / 10, w: p.w, h: p.h, poster: p.poster }, data };
  };
  // مفاتيح التخزين
  VID.wKey = (id) => "waVD:" + id;
  VID.pKey = (id) => "pubVD:" + id;
  VID.isKey = (k) => /^(waVD|pubVD):/.test(String(k));
  root.VID = VID;
})(typeof self !== "undefined" ? self : window);
