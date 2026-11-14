// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 📇 دليل الموظفين — المصدر المرخّص التاني للتواصل (بعد الرقم المنشور في البوست نفسه).
// بنحتفظ برقم التواصل فقط، من غير باقي بيانات الرد.
// الحالات (مهمّة): { ok:true, phone:"…" } = الرقم اتلقط · { ok:true, phone:"" } = مفيش داتا · { ok:false, error } = فشل الاتصال (مش «مفيش داتا»)
// ⚠️ مفيش أي مصدر تاني: من غير دليل الموظفين ومن غير أرقام الناس اللي هما كاتبينها في بوستاتهم.
(() => {
  const cache = new Map(), pending = new Map();
  const TMO = Number(globalThis.EMPLOYEE_PHONE_TIMEOUT || 12000);      // مهلة الطلب (ms)
  const TTL = { phone: 36e5, none: 3e5, err: 6e4 };   // مدة الكاش لكل حالة
  const ENDPOINT = () => String(globalThis.EMPLOYEE_PHONE_URL || "https://lap.wzila.com/alaa-data.php");
  const IS_PAGE = typeof document !== "undefined";     // في صفحة (لوحة/إضافة) — مش في خلفية
  
  function parse(text) {
    let data;
    try { data = JSON.parse(text); } catch {}
    if (data && typeof data === "object") {
      const arr = Array.isArray(data) ? data : null;
      const one = arr ? (arr.find((x) => x && typeof x === "object" && (x.Phone ?? x.phone)) || arr[0]) : data;
      if (one && typeof one === "object") return phone(one.Phone ?? one.phone ?? "");
    }
    const plain = String(text).replace(/<[^>]*>/g, "").trim();
    const m = /\[Phone\][ \t]*=>[ \t]*([^\r\n]*)/i.exec(plain);
    if (m) return phone(m[1]);
    if (!plain || /^(?:Array\s*\(\s*\)|null|false|\[\]|\{\}|no data(?: found)?|not found)$/i.test(plain)) return "";
    throw new Error("رد غير معروف من دليل الموظفين");
  }
  function phone(value) {
    const s = String(value == null ? "" : value).trim();
    if (!s || /^(?:none|null|false|0|n\/a)$/i.test(s)) return "";
    if (!/^\+?[\d\s().-]+$/.test(s)) throw new Error("رقم غير صالح في دليل الموظفين");
    const digits = s.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) throw new Error("رقم غير صالح في دليل الموظفين");
    return (s.startsWith("+") ? "+" : "") + digits;
  }
  const withTmo = (p, ms) => Promise.race([Promise.resolve(p), new Promise((_, rej) => setTimeout(() => rej(new Error("انتهت المهلة")), ms))]);
  // 🌐 طلب مباشر للدليل (خلفية كروم، أو صفحة عندها صلاحية المضيف)
  async function fetchText(id) {
    const r = await fetch(ENDPOINT() + "?id=" + encodeURIComponent(id), { signal: AbortSignal.timeout(TMO), credentials: "omit", redirect: "error", cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.text();
  }
  // 📬 عن طريق الخلفية (إضافة كروم · برنامج ويندوز · لوحة على السيرفر/localhost)
  function askBg(id) {
    return new Promise((res, rej) => {
      let done = false;
      const fin = (v) => { if (done) return; done = true; (v && v.error) ? rej(new Error(v.error)) : res(v || {}); };
      try {
        const p = chrome.runtime.sendMessage({ type: "employeePhone", id }, fin);
        if (p && typeof p.then === "function") p.then(fin, (e) => { if (!done) { done = true; rej(e); } });
      } catch (e) { done = true; rej(e); }
      setTimeout(() => { if (!done) { done = true; rej(new Error("مفيش رد من الخلفية")); } }, TMO);
    });
  }
  async function lookup(id) {
    id = String(id || "");
    if (!/^\d{5,25}$/.test(id)) return { ok: false, error: "آيدي غير صالح" };
    const hit = cache.get(id);
    if (hit && hit.until > Date.now()) return hit.result;
    if (pending.has(id)) return pending.get(id);
    const task = (async () => {
      try {
        let text = "";
        if (globalThis.alaaApp && typeof globalThis.alaaApp.call === "function") {
          // 🖥 برنامج ويندوز: الطلب بيطلع من البرنامج نفسه (من غير قيود المتصفح)
          const r = await withTmo(globalThis.alaaApp.call("employeePhone", { id }), TMO);
          if (!r || r.error) throw new Error(r?.error || "تعذر الاتصال");
          text = r.text == null ? "" : String(r.text);
        } else if (IS_PAGE && globalThis.chrome && chrome.runtime && chrome.runtime.sendMessage) {
          // 🖥 صفحة اللوحة: الأول عن طريق الخلفية (شغّال في الإضافة والبرنامج والسيرفر)
          const r = await askBg(id);
          if (r && r.ok === false) throw new Error(r.error || "تعذر الاتصال");
          if (r && typeof r.phone === "string") { const res = { ok: true, phone: r.phone }; remember(id, res); return res; }
          text = r && r.text != null ? String(r.text) : "";
        }
        if (!text) text = await fetchText(id);   // 🔁 احتياطي: طلب مباشر (لو الخلفية مش ردت)
        const result = { ok: true, phone: parse(text) };
        remember(id, result);
        return result;
      } catch (err) {
        const result = { ok: false, error: "تعذر الاتصال", detail: String((err && err.message) || err).slice(0, 120) };
        remember(id, result);
        return result;
      } finally { pending.delete(id); }
    })();
    pending.set(id, task);
    return task;
  }
  function remember(id, result) {
    cache.set(id, { result, until: Date.now() + (result.ok ? (result.phone ? TTL.phone : TTL.none) : TTL.err) });
    if (cache.size > 2000) cache.delete(cache.keys().next().value);
  }
  globalThis.EMPLOYEEPHONE = { lookup, parse, endpoint: ENDPOINT };
})();
