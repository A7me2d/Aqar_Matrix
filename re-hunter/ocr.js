// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// ===== 🖼 قراءة صور البوستات (OCR عربي) — المحرك بيطلب، والبرنامج هو اللي بيقرا =====
// بتشتغل بس جوه برنامج Alaa Deals (ويندوز / السيرفر). في إضافة كروم لوحدها مش متاحة — والنتايج بتيجي بالمزامنة.
(function (g) {
  const available = () => !!(g.alaaApp && typeof g.alaaApp.call === "function");
  async function readUrl(url) {
    if (!available()) return { ok: false, error: "القراية مش متاحة هنا" };
    // مهلة ٦٠ ثانية للصورة الواحدة — من غير مهلة قراية معلّقة كانت بتسيب ocrBusy=true للأبد
    try { return (await Promise.race([g.alaaApp.call("ocr", url), new Promise((r) => setTimeout(() => r({ ok: false, error: "القراية خدت أكتر من ٦٠ ثانية" }), 60000))])) || { ok: false, error: "مفيش رد" }; } catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
  }
  // بنشيل الأسطر الزبالة (رموز وحروف مقطّعة) ونسيب الكلام المفهوم
  function clean(raw) {
    const lines = String(raw || "").split(/\n+/).map((l) => l.replace(/[|_~`^\\<>{}[\]]+/g, " ").replace(/\s+/g, " ").trim()).filter((l) => {
      if (l.length < 3) return false;
      const good = (l.match(/[؀-ۿa-zA-Z0-9]/g) || []).length;
      return good / l.length >= 0.6 && good >= 3;
    });
    return lines.join("\n").slice(0, 1500);
  }
  // البوست محتاج صورته تتقري؟ (لو كل المعلومات في الكلام نفسه مش لازم)
  function worth(p, PH, compiled) {
    if (p.pend) return true;
    const a = PH.analyze(p.text || "", compiled);
    const full = a.phones.length && a.region && (a.price || a.areaM2) && a.category && a.category !== "other";
    return !full;
  }
  g.OCR = { available, readUrl, clean, worth };
})(globalThis);
