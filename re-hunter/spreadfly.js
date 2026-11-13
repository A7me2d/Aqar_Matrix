// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🌐 الانتشار — فلاير الإدخال اليدوي (شقة / فيلا / أرض / محل…): بيرسم 1080×1350 على canvas من اللي كتبته + أول صورة رفعتها.
// مفيش رقم قطعة ولا ادّعاء خارج اللي اتكتب — كله من الباقة (SPR.manualPack). بيرجّع نفس شكل ATLAS.spread.flyer: { png (4:5), story (9:16), jpeg dataURL }.
(function (g) {
  "use strict";
  const W = 1080, H = 1350, FONT = 'Cairo, Arial, "Liberation Sans", Helvetica, sans-serif';
  const C = { bg0: "#0b1220", bg1: "#101c33", card: "#16233b", line: "rgba(255,255,255,.10)", text: "#f1f5f9", mute: "#9fb0c7", acc: "#22d3ee", ok: "#34d399" };
  const FLY = {};
  const rr = (c, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  const font = (w, s) => `${w} ${Math.round(s)}px ${FONT}`;
  // بيصغّر الخط لحد ما النص يدخل في العرض، ولو لسه مدخلش بيقصّه بنقط
  function fit(c, t, w, size, maxW, minK) {
    t = String(t); let s = size; c.font = font(w, s); const lo = size * (minK || 0.7);
    while (c.measureText(t).width > maxW && s > lo) { s -= 2; c.font = font(w, s); }
    if (c.measureText(t).width > maxW) { while (t.length > 2 && c.measureText(t + "…").width > maxW) t = t.slice(0, -1); t = t.trim() + "…"; }
    return { t, s };
  }
  function wrap(c, t, maxW, maxLines) {
    const words = String(t).split(/\s+/).filter(Boolean), out = []; let cur = "";
    for (const w of words) { const x = cur ? cur + " " + w : w; if (c.measureText(x).width <= maxW || !cur) cur = x; else { out.push(cur); cur = w; } }
    if (cur) out.push(cur);
    if (out.length > maxLines) { const keep = out.slice(0, maxLines); let l = keep[maxLines - 1]; while (l.length > 2 && c.measureText(l + "…").width > maxW) l = l.slice(0, -1); keep[maxLines - 1] = l.trim() + "…"; return keep; }
    return out;
  }
  function cover(c, img, x, y, w, h) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height; if (!iw || !ih) return;
    const k = Math.max(w / iw, h / ih), sw = w / k, sh = h / k; c.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
  }
  const fontsReady = (() => { let p = null; return () => p || (p = (g.document && document.fonts && document.fonts.load ? Promise.all(["700 20px Cairo", "400 20px Cairo", "800 20px Cairo"].map((f) => document.fonts.load(f, "أبت"))).then(() => document.fonts.load("700 20px Cairo", "AB 12")).catch(() => 0) : Promise.resolve())); })();

  // الرسم نفسه (متزامن) — لازم الخط يكون اتحمّل قبله (make بتتكفّل بده)
  FLY.draw = function (cv, p, photo) {
    cv.width = W; cv.height = H; const c = cv.getContext("2d"), K = (g.SPR && SPR.KINDS[p.kindKey]) || { n: "وحدة" }, rent = p.deal === "rent";
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, C.bg0); gr.addColorStop(1, C.bg1); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.direction = "rtl"; c.textBaseline = "alphabetic";
    const R = W - 40, L = 40, IW = W - 80;
    // الهيدر: الاسم يمين، الكود شمال
    c.textAlign = "right"; c.fillStyle = C.text; { const f = fit(c, p.brand || "العراب للعقارات", 800, 38, 560); c.font = font(800, f.s); c.fillText(f.t, R, 78); }
    c.fillStyle = C.acc; c.fillRect(R - 64, 92, 64, 5);
    if (p.code) { c.direction = "ltr"; c.font = font(700, 30); const tw = c.measureText(p.code).width + 44; rr(c, L, 44, tw, 56, 28); c.fillStyle = "rgba(34,211,238,.13)"; c.fill(); c.strokeStyle = "rgba(34,211,238,.55)"; c.lineWidth = 2; c.stroke(); c.fillStyle = C.acc; c.textAlign = "center"; c.fillText(p.code, L + tw / 2, 83); c.direction = "rtl"; }
    // العنوان والمكان
    const area = p.area ? SPR.en(p.area) : "", title = `${K.n}${area ? " " + area + " م²" : ""} ${rent ? "للإيجار" : "للبيع"}`, where = String(p.where || p.dn || "");
    const stats = (p.stats || []).slice(0, 4), feats = (p.claims || []).filter((x) => x.k !== "rooms" && x.k !== "floor").slice(0, 6), rows = Math.ceil(feats.length / 2);
    const hasPrice = p.ask > 0, phone = String(p.phone || "").trim(), bottom = H - 86, rowH = hasPrice || phone ? 132 : 0;
    const featH = rows ? rows * 62 + 14 : 0, statH = stats.length ? 124 + 22 : 0, titleH = 74 + 52 + 18;
    const free = bottom - rowH - (rowH ? 22 : 0) - 130 - titleH - statH - featH - 26;
    const heroH = Math.max(260, Math.min(600, free)), y0 = 130;
    // الصورة الرئيسية (أو لوحة بديلة لو مفيش صورة)
    c.save(); rr(c, L, y0, IW, heroH, 26); c.clip();
    if (photo) { cover(c, photo, L, y0, IW, heroH); const og = c.createLinearGradient(0, y0 + heroH * 0.55, 0, y0 + heroH); og.addColorStop(0, "rgba(11,18,32,0)"); og.addColorStop(1, "rgba(11,18,32,.72)"); c.fillStyle = og; c.fillRect(L, y0, IW, heroH); }
    else { const pg = c.createLinearGradient(L, y0, R, y0 + heroH); pg.addColorStop(0, "#14405c"); pg.addColorStop(1, "#0d2238"); c.fillStyle = pg; c.fillRect(L, y0, IW, heroH);
      c.strokeStyle = "rgba(255,255,255,.05)"; c.lineWidth = 2; for (let x = L - heroH; x < R + heroH; x += 70) { c.beginPath(); c.moveTo(x, y0 + heroH); c.lineTo(x + heroH, y0); c.stroke(); }
      c.textAlign = "center"; c.fillStyle = "rgba(255,255,255,.10)"; c.font = font(800, Math.min(230, heroH * 0.62)); c.fillText(K.n, W / 2, y0 + heroH * 0.7); }
    c.restore();
    // شارة بيع/إيجار
    { c.textAlign = "center"; c.font = font(800, 36); const t = rent ? "للإيجار" : "للبيع", bw = c.measureText(t).width + 56; rr(c, R - 20 - bw, y0 + 22, bw, 62, 31); c.fillStyle = C.acc; c.fill(); c.fillStyle = "#04202a"; c.fillText(t, R - 20 - bw / 2, y0 + 65); }
    let y = y0 + heroH + 26;
    c.textAlign = "right"; c.fillStyle = C.text; { const f = fit(c, title, 800, 62, IW); c.font = font(800, f.s); c.fillText(f.t, R, y + 56); } y += 74;
    c.fillStyle = C.mute; { const f = fit(c, where, 600, 35, IW); c.font = font(600, f.s); c.fillText(f.t, R, y + 34); } y += 52 + 18;
    // الإحصائيات
    if (stats.length) { const gap = 16, bw = (IW - gap * (stats.length - 1)) / stats.length;
      stats.forEach((s, i) => { const x = R - (i + 1) * bw - i * gap; rr(c, x, y, bw, 124, 20); c.fillStyle = C.card; c.fill(); c.strokeStyle = C.line; c.lineWidth = 2; c.stroke();
        c.textAlign = "center"; c.fillStyle = C.text; { const f = fit(c, s.v, 800, 46, bw - 24); c.font = font(800, f.s); c.fillText(f.t, x + bw / 2, y + 62); } c.fillStyle = C.mute; c.font = font(600, 26); c.fillText(s.l, x + bw / 2, y + 102); });
      y += 124 + 22; }
    // المميزات (عمودين)
    if (rows) { const cw = (IW - 24) / 2;
      feats.forEach((f, i) => { const col = i % 2, r = Math.floor(i / 2), x = R - col * (cw + 24), yy = y + r * 62;
        c.fillStyle = "rgba(52,211,153,.18)"; c.beginPath(); c.arc(x - 16, yy + 22, 16, 0, Math.PI * 2); c.fill();
        c.strokeStyle = C.ok; c.lineWidth = 4; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath(); c.moveTo(x - 24, yy + 22); c.lineTo(x - 17, yy + 29); c.lineTo(x - 7, yy + 15); c.stroke();
        c.textAlign = "right"; c.fillStyle = C.text; const t = fit(c, f.short, 600, 32, cw - 54); c.font = font(600, t.s); c.fillText(t.t, x - 44, yy + 33); });
      y += featH; }
    // السعر + التواصل
    if (rowH) { const ry = bottom - rowH, pw = hasPrice && phone ? 600 : IW, cwid = hasPrice && phone ? IW - pw - 16 : IW;
      if (hasPrice) { const pg = c.createLinearGradient(R - pw, ry, R, ry + rowH); pg.addColorStop(0, "#0ea5c4"); pg.addColorStop(1, "#22d3ee"); rr(c, R - pw, ry, pw, rowH, 24); c.fillStyle = pg; c.fill();
        c.textAlign = "center"; c.fillStyle = "rgba(4,32,42,.78)"; c.font = font(700, 28); c.fillText(rent ? "الإيجار" : "السعر المطلوب", R - pw / 2, ry + 40); c.fillStyle = "#04202a"; { const f = fit(c, `${SPR.money(p.ask)} جنيه${rent ? " / شهريًا" : ""}`, 800, 54, pw - 40); c.font = font(800, f.s); c.fillText(f.t, R - pw / 2, ry + 100); } }
      if (phone) { const x = hasPrice ? L : L; rr(c, x, ry, cwid, rowH, 24); c.fillStyle = C.card; c.fill(); c.strokeStyle = "rgba(34,211,238,.5)"; c.lineWidth = 2; c.stroke();
        c.textAlign = "center"; c.fillStyle = C.mute; c.font = font(700, 26); c.fillText("واتساب / اتصال", x + cwid / 2, ry + 40); c.direction = "ltr"; c.fillStyle = C.text; { const f = fit(c, phone, 800, 46, cwid - 32); c.font = font(800, f.s); c.fillText(f.t, x + cwid / 2, ry + 100); } c.direction = "rtl"; } }
    // الفوتر
    c.strokeStyle = C.line; c.lineWidth = 2; c.beginPath(); c.moveTo(L, H - 70); c.lineTo(R, H - 70); c.stroke();
    c.textAlign = "center"; c.fillStyle = C.mute; { const f = fit(c, p.code ? `ابعت كود ${p.code} للتفاصيل وميعاد المعاينة` : "ابعتلنا رسالة للتفاصيل وميعاد المعاينة", 600, 29, IW); c.font = font(600, f.s); c.fillText(f.t, W / 2, H - 24); }
    return true;
  };
  const toBlob = (c, t, q) => new Promise((res) => { try { c.toBlob((b) => res(b), t, q); } catch { res(null); } });
  // { png, story, jpeg } — photo = عنصر صورة (HTMLImageElement) أو null
  FLY.make = async function (p, photo) {
    await fontsReady(); const cv = document.createElement("canvas"); FLY.draw(cv, p, photo);
    const sc = document.createElement("canvas"); sc.width = 1080; sc.height = 1920; const x = sc.getContext("2d"), gr = x.createLinearGradient(0, 0, 0, 1920); gr.addColorStop(0, C.bg0); gr.addColorStop(1, C.bg1); x.fillStyle = gr; x.fillRect(0, 0, 1080, 1920); x.drawImage(cv, 0, 262, 1080, 1350);
    const [png, story] = await Promise.all([toBlob(cv, "image/png"), toBlob(sc, "image/png")]); let jpeg = ""; try { jpeg = cv.toDataURL("image/jpeg", 0.88); } catch {}
    return { png, story, jpeg, w: cv.width, h: cv.height };
  };
  FLY.loadImg = (url) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("img")); i.src = url; });
  // ملف صورة من الجهاز ← JPEG صغير (أقصى ضلع 1600) كـ dataURL عشان يتخزّن ويتنشر بخفة
  FLY.shrink = async function (file, max) {
    max = max || 1600; const url = URL.createObjectURL(file);
    try { const im = await FLY.loadImg(url), k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), cv = document.createElement("canvas"); cv.width = Math.max(1, Math.round(im.naturalWidth * k)); cv.height = Math.max(1, Math.round(im.naturalHeight * k));
      const c = cv.getContext("2d"); c.fillStyle = "#fff"; c.fillRect(0, 0, cv.width, cv.height); c.drawImage(im, 0, 0, cv.width, cv.height); return cv.toDataURL("image/jpeg", 0.85); }
    finally { URL.revokeObjectURL(url); }
  };
  g.SPRFLY = FLY;
})(typeof globalThis !== "undefined" ? globalThis : this);
