// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🎨 10.54 — أيقونات المنصات (فيسبوك / واتساب / إنستجرام) كبلاطات ملوّنة مجسّمة بنفس لغة icons54.
// الرسومات: Feather (MIT) + Lucide (ISC). الإيموجي الأصلي بيفضل جوه الأيقونة مخفي بصريًا (للنسخ والاختبارات).
(function (g) {
  const P = {
    fb: ["c-fb fill", "📘", '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'],
    wa: ["c-wa", "🟢", '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9.2 8.6c-.5 1.3.1 3 1.6 4.5s3.2 2.1 4.5 1.6l.9-1.3-1.9-1-.8.6a3.6 3.6 0 0 1-1.7-1.7l.6-.8-1-1.9z"/>'],
    ig: ["c-ig", "📸", '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>'],
  };
  g.platBadge = function (k) {
    const p = P[k]; if (!p) return "";
    return '<x-ic class="i54 ' + p[0] + '" data-e="' + p[1] + '"><x-t class="i54-t">' + p[1] + '</x-t><svg viewBox="0 0 24 24" aria-hidden="true">' + p[2] + "</svg></x-ic>";
  };
})(window);
