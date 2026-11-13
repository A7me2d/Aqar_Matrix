// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🔁 حارس الحلقات: بيضيف __lg() أول كل حلقة (while/for/do/for-in/for-of) في كود أدوات الذكاء الاصطناعي، عشان لو الحلقة مالهاش نهاية
// الصندوق يرمي خطأ بعد 3 ثواني بدل ما يعلّق البرنامج. بيستخدم acorn للتحليل (مش regex) فمابيتلخبطش في النصوص والتعليقات والـregex.
(function (g) {
  "use strict";
  const LOOPS = new Set(["WhileStatement", "DoWhileStatement", "ForStatement", "ForInStatement", "ForOfStatement"]);
  const parser = () => g.acorn || (typeof require === "function" ? require("acorn") : null);
  function instrument(js) {
    const A = parser(); js = String(js == null ? "" : js);
    if (!A) return { ok: false, code: js, loops: 0, error: "acorn غير متاح" };
    let ast; try { ast = A.parse(js, { ecmaVersion: "latest", allowAwaitOutsideFunction: true, allowReturnOutsideFunction: true, sourceType: "script" }); }
    catch (e) { return { ok: false, code: js, loops: 0, error: String((e && e.message) || e) }; }
    const ins = []; let loops = 0;
    (function walk(n) {
      if (!n || typeof n.type !== "string") return;
      if (LOOPS.has(n.type) && n.body) {
        loops++;
        if (n.body.type === "BlockStatement") ins.push({ pos: n.body.start + 1, text: "__lg();" });
        else { ins.push({ pos: n.body.start, text: "{__lg();" }); ins.push({ pos: n.body.end, text: "}" }); }
      }
      for (const k in n) {
        if (k === "type" || k === "start" || k === "end") continue;
        const v = n[k];
        if (Array.isArray(v)) { for (const x of v) walk(x); } else if (v && typeof v === "object" && typeof v.type === "string") walk(v);
      }
    })(ast);
    ins.sort((a, b) => a.pos - b.pos || (a.text === "}" ? -1 : 0) - (b.text === "}" ? -1 : 0));
    let out = "", last = 0;
    for (const i of ins) { out += js.slice(last, i.pos) + i.text; last = i.pos; }
    out += js.slice(last);
    return { ok: true, code: out, loops };
  }
  g.AIGUARD = { instrument };
  if (typeof module !== "undefined" && module.exports) module.exports = g.AIGUARD;
})(typeof globalThis !== "undefined" ? globalThis : this);
