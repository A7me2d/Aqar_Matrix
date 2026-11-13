// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🔘 عميل جسر الأزرار (العالم المعزول): بيكلّم wabtn.js اللي جوه صفحة واتساب ويب بـ window.postMessage
// WABR.call(op, args, ms) ⟵ { ok, … } (لو عدّى الوقت: { ok:false, timeout:true }) · WABR.onReply(fn) ⟵ ردود العملاء على الزراير/القايمة
(() => {
  if (globalThis.WABR) return;
  const TAG = "__aqm", ORIGIN = location.origin, waiting = new Map(), handlers = [], codeHandlers = []; let seq = 0;
  window.addEventListener("message", (e) => {
    const d = e.data; if (e.source !== window || e.origin !== ORIGIN || !d || d[TAG] !== 1 || d.dir !== "out") return;
    if (d.id) { const w = waiting.get(d.id); if (w) { waiting.delete(d.id); clearTimeout(w.t); w.r(d.res); } return; }
    if (d.ev === "reply") for (const h of handlers) { try { h(d); } catch (er) { console.warn("WABR handler", er); } }
    if (d.ev === "code") for (const h of codeHandlers) { try { h(d); } catch (er) { console.warn("WABR code handler", er); } } // 📥 رسالة واردة فيها كود قطعة
  });
  function call(op, args, ms) {
    return new Promise((r) => {
      const id = "r" + (++seq) + Math.random().toString(36).slice(2, 6);
      const t = setTimeout(() => { waiting.delete(id); r({ ok: false, timeout: true, error: "الجسر ما ردّش (" + op + ")" }); }, ms || 30000);
      waiting.set(id, { r, t });
      try { window.postMessage({ [TAG]: 1, dir: "in", id, op, args: args || {} }, ORIGIN); } catch (er) { clearTimeout(t); waiting.delete(id); r({ ok: false, error: String((er && er.message) || er) }); }
    });
  }
  globalThis.WABR = { call, onReply: (f) => { handlers.push(f); }, onCode: (f) => { codeHandlers.push(f); }, ping: () => call("ping", {}, 4000) };
})();
