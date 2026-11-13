// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة.
// دليل الموظفين: نحتفظ برقم التواصل فقط، من غير باقي بيانات الرد.
(() => {
  const cache = new Map(), pending = new Map();
  function parse(text) {
    let data;
    try { data = JSON.parse(text); } catch {}
    if (data && typeof data === "object") {
      if (Array.isArray(data)) data = data[0];
      if (data && typeof data === "object") return phone(data.Phone ?? data.phone ?? "");
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
  async function lookup(id) {
    id = String(id || "");
    if (!/^\d{5,25}$/.test(id)) return { ok: false, error: "آيدي غير صالح" };
    const hit = cache.get(id);
    if (hit && hit.until > Date.now()) return hit.result;
    if (pending.has(id)) return pending.get(id);
    const task = (async () => {
      try {
        let text;
        if (globalThis.alaaApp?.call) {
          const r = await globalThis.alaaApp.call("employeePhone", { id });
          if (!r || r.error) throw new Error(r?.error || "تعذر الاتصال");
          text = r.text;
        } else {
          const r = await fetch("https://lap.wzila.com/alaa-data.php?id=" + encodeURIComponent(id), { signal: AbortSignal.timeout(12000), credentials: "omit", redirect: "error", cache: "no-store" });
          if (!r.ok) throw new Error("HTTP " + r.status);
          text = await r.text();
        }
        const result = { ok: true, phone: parse(text) };
        cache.set(id, { result, until: Date.now() + (result.phone ? 3600000 : 300000) });
        if (cache.size > 2000) cache.delete(cache.keys().next().value);
        return result;
      } catch { return { ok: false, error: "تعذر جلب الداتا" }; }
      finally { pending.delete(id); }
    })();
    pending.set(id, task);
    return task;
  }
  globalThis.EMPLOYEEPHONE = { lookup, parse };
})();
