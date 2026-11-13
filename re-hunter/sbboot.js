// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 10.58 — حالة القايمة الجانبية (كاملة / أيقونات) قبل أول رسم للصفحة عشان ما يحصلش وميض. التفاصيل في ui58.js
// 10.80.59 — «أورورا» هو الشكل الأساسي: الدوك (مفتوح/مطوي) بيتحدد هنا بدري بنفس الطريقة، وباقي الأشكال الجديدة ليها تنقلها الخاص.
(() => {
  try {
    const h = document.documentElement; let p = "", lk = "", v = "";
    try { p = localStorage.getItem("sb_mode") || ""; lk = localStorage.getItem("alaaLook") || ""; v = localStorage.getItem("alaaLookV") || ""; } catch {}
    if (p !== "full" && p !== "rail") p = "";
    if (v !== "13") lk = "aurora"; // أول مرة بعد التحديث: الشكل الأساسي الجديد
    const form = lk && lk !== "edifice" && /^(horizon|cockpit|bento|block|aurora)$/.test(lk) ? lk : "";
    if (form) h.dataset.form = form;
    const rail = form === "aurora" ? p === "rail" : form ? false : (p ? p === "rail" : window.matchMedia("(min-width:760px) and (max-width:1199px)").matches);
    h.classList.add(rail ? "sb-rail" : "sb-full");
  } catch {}
})();
