// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🆔 تحويل يوزر فيسبوك (facebook.com/اسم) لآيدي رقم — نفس فكرة findidfb / lookup-id لكن من جوه البرنامج.
// بيقرا صفحة البروفايل بجلسة فيسبوك المسجّل دخولها (من غير تابة ظاهرة) ويطلّع الآيدي الرقمي من بيانات الصفحة.
// ملف نقي (من غير أي اعتماد على الصفحة) — بيشتغل في الخلفية (إضافة كروم) وفي البرنامج (Electron) وفي لوحة التحكم.
(function (g) {
  const isNum = (s) => /^\d{5,}$/.test(String(s == null ? "" : s));
  // يوزر فيسبوك: حروف/أرقام/نقط — مش بيبدأ بـ«profile.php» ومش كلمة محجوزة
  const RESERVED = new Set(["groups", "photo", "photos", "watch", "events", "marketplace", "pages", "hashtag", "stories", "reel", "reels", "share", "sharer",
    "login", "help", "settings", "notifications", "messages", "friends", "permalink.php", "story.php", "ajax", "profile.php", "people", "public"]);
  const isHandle = (s) => { s = String(s == null ? "" : s); return /^[A-Za-z0-9.]{3,80}$/.test(s) && !isNum(s) && !/^\d+$/.test(s) && !RESERVED.has(s.toLowerCase()); };

  // آيدي رقم من لينك بروفايل (من غير أي طلب شبكة): groups/x/user/123 · profile.php?id=123 · people/x/123
  function numFromUrl(href) {
    try {
      const u = new URL(String(href || ""), "https://www.facebook.com");
      if (!/(^|\.)facebook\.com$/i.test(u.hostname)) return "";
      let m = u.pathname.match(/^\/groups\/[^\/]+\/user\/(\d{5,})/); if (m) return m[1];
      if (u.pathname === "/profile.php" && isNum(u.searchParams.get("id"))) return u.searchParams.get("id");
      m = u.pathname.match(/^\/people\/[^\/]+\/(\d{5,})/); if (m) return m[1];
    } catch {}
    return "";
  }
  // يوزر من لينك بروفايل (facebook.com/اسم)
  function handleFromUrl(href) {
    try {
      const u = new URL(String(href || ""), "https://www.facebook.com");
      if (!/(^|\.)facebook\.com$/i.test(u.hostname)) return "";
      const m = u.pathname.match(/^\/([A-Za-z0-9.]{3,80})\/?$/);
      return m && isHandle(m[1]) ? m[1] : "";
    } catch { return ""; }
  }

  // strict=true: مصادر دقيقة بس (ميتا تاج التطبيق / canonical) — غير كده بنجرّب باقي الأنماط ونختار الأكتر تكرارًا (من غير آيدي صاحب الحساب نفسه)
  function numericIdFromHtml(html, viewer, strict) {
    const ok = (id) => !!id && id !== viewer && id !== "0" && id.length >= 5;
    let m, re = /<meta\b[^>]*>/gi;
    while ((m = re.exec(html))) { if (!/al:(?:android|ios):url/i.test(m[0])) continue; const x = /fb:\\?\/\\?\/(?:profile|page|group|user)\\?\/(?:\?id=)?(\d{5,})/.exec(m[0]); if (x && ok(x[1])) return x[1]; }
    m = /<link[^>]+rel="canonical"[^>]+href="[^"]*\/profile\.php\?id=(\d{5,})/i.exec(html) || /<meta[^>]+property="og:url"[^>]+content="[^"]*\/profile\.php\?id=(\d{5,})/i.exec(html);
    if (m && ok(m[1])) return m[1];
    if (strict || !viewer) return ""; // من غير ما نعرف آيدي صاحب الحساب مينفعش نعدّ المفاتيح (ممكن نطلّع آيديه هو)
    const cnt = new Map(), hit = (id) => { if (ok(id)) cnt.set(id, (cnt.get(id) || 0) + 1); };
    re = /"(?:profile_id|entity_id|pageID|page_id|profileID|userID|owner_id)"\s*:\s*"?(\d{5,})/g; while ((m = re.exec(html))) hit(m[1]);
    re = /fb:\\?\/\\?\/(?:profile|page|user)\\?\/(?:\?id=)?(\d{5,})/g; while ((m = re.exec(html))) hit(m[1]);
    let best = "", bn = 0; cnt.forEach((n, id) => { if (n > bn) { best = id; bn = n; } });
    return best;
  }

  // o.fetch = دالة الفetch (الإضافة: fetch العادي، البرنامج: ses.fetch بجلسة فيسبوك) · o.viewer = آيدي صاحب الحساب
  // الرجوع: { id } أو { err: "rate" | "login" | "checkpoint" | "none" | "http" | "timeout" | "net" }
  async function fetchId(handle, o = {}) {
    const f = o.fetch || (typeof fetch === "function" ? fetch.bind(g) : null), viewer = o.viewer || "";
    if (!f) return { err: "net" };
    if (!isHandle(handle)) return { err: "none" };
    const ac = typeof AbortController === "function" ? new AbortController() : null, to = ac ? setTimeout(() => ac.abort(), o.timeout || 25000) : 0;
    try {
      const res = await f("https://www.facebook.com/" + encodeURIComponent(handle), { credentials: "include", redirect: "follow", signal: ac ? ac.signal : undefined, headers: { Accept: "text/html" } });
      if (res.status === 429) return { err: "rate" };
      let u = null; try { u = new URL(res.url); } catch {}
      if (u && /^\/login(\/|\.php|$)/.test(u.pathname)) return { err: "login" };
      if (u && /^\/checkpoint(\/|$)/.test(u.pathname)) return { err: "checkpoint" };
      if (u && u.pathname === "/profile.php" && isNum(u.searchParams.get("id"))) { const id = u.searchParams.get("id"); if (id !== viewer) return { id }; }
      if (!res.ok) return { err: res.status >= 500 ? "http" : "none" };
      let html = "";
      const rd = res.body && res.body.getReader ? res.body.getReader() : null;
      if (rd) { // بنقرا من الأول ونوقف أول ما نلاقي الآيدي (الميتا تاج في الـhead) — من غير ما نحمّل الصفحة كلها
        const dec = new TextDecoder(); let n = 0;
        for (;;) {
          const { done, value } = await rd.read(); if (done) break;
          n += value.length; html += dec.decode(value, { stream: true });
          const id = numericIdFromHtml(html, viewer, true); if (id) { try { rd.cancel(); } catch {} return { id }; }
          if (n > 1.8e6) { try { rd.cancel(); } catch {} break; }
        }
      } else html = await res.text();
      const id = numericIdFromHtml(html, viewer, false);
      return id ? { id } : { err: "none" };
    } catch (e) { return { err: e && e.name === "AbortError" ? "timeout" : "net" }; }
    finally { if (to) clearTimeout(to); }
  }

  g.FBIDCORE = { isNum, isHandle, numFromUrl, handleFromUrl, numericIdFromHtml, fetchId };
  if (typeof module !== "undefined" && module.exports) module.exports = g.FBIDCORE;
})(typeof globalThis !== "undefined" ? globalThis : this);
