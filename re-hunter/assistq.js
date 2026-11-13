// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🔎 استعلامات داتا المساعد الذكي (منطق نقي من غير DOM ولا chrome) — بتتستخدم في شات المساعد وفي جسر أدوات الصندوق الآمن.
// بتاخد المصفوفات الجاهزة (منشورات متحللة / مشترين / بائعين) وبترجّع سجلات مختصرة، عشان الموديل ما ياخدش داتا أكتر من اللازم.
(function (g) {
  "use strict";
  const DAY = 864e5;
  const AD = { "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9", "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9" };
  // تطبيع عربي بسيط: أرقام لاتينية، من غير تشكيل/تطويل، أ/إ/آ ← ا، ى ← ي، ة ← ه
  const nrm = (s) => String(s == null ? "" : s).replace(/[٠-٩۰-۹]/g, (c) => AD[c]).replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").toLowerCase().replace(/\s+/g, " ").trim();
  const num = (v) => { const n = typeof v === "number" ? v : parseFloat(String(v == null ? "" : v).replace(/[,،\s]/g, "")); return Number.isFinite(n) ? n : null; };
  const clampInt = (v, lo, hi, d) => { const x = num(v); if (x == null) return d; const n = Math.round(x); return Math.max(lo, Math.min(hi, n)); };
  const tsOf = (p) => +p.ts || +p.scannedAt || +p.last || 0;
  const ago = (t, now) => (t ? Math.round(((now - t) / DAY) * 10) / 10 : null);
  const pct = (arr, q) => { if (!arr.length) return null; const a = arr.slice().sort((x, y) => x - y), i = (a.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return Math.round(a[lo] + (a[hi] - a[lo]) * (i - lo)); };
  const med = (arr) => pct(arr, 0.5);
  const cut = (s, n) => { s = String(s == null ? "" : s).replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
  const words = (q) => nrm(q).split(" ").filter(Boolean);
  const hasAll = (hay, ws) => ws.every((w) => hay.includes(w));
  const ppmOf = (p) => { const a = +p.areaM2, pr = +p.price; return a > 0 && pr > 0 && p.deal !== "rent" && p.category !== "other" ? Math.round(pr / a) : null; };

  // ===== المنشورات =====
  // f: { type, category, deal, region, minPrice, maxPrice, minArea, maxArea, rooms, days, text, withPhone, includeDone, onlyOwners, sort, limit, offset }
  function postFilter(f, now) {
    f = f || {};
    const rg = f.region ? words(f.region) : null, tx = f.text ? words(f.text) : null, days = num(f.days), rooms = num(f.rooms);
    const minP = num(f.minPrice), maxP = num(f.maxPrice), minA = num(f.minArea), maxA = num(f.maxArea);
    return (p) => {
      if (!p) return false;
      if (f.type && p.type !== f.type) return false;
      if (f.category && p.category !== f.category) return false;
      if (f.deal && p.deal !== f.deal) return false;
      if (!f.includeDone && p.done) return false;
      if (f.withPhone && !(p.phones && p.phones.length)) return false;
      if (f.onlyOwners && p.isBroker) return false;
      if (rg && !hasAll(nrm((p.region || "") + " " + (p.place || "")), rg)) return false;
      if (rooms != null && +p.rooms !== rooms) return false;
      if (days != null && days > 0) { const t = tsOf(p); if (!t || now - t > days * DAY) return false; }
      const pr = +p.price || 0;
      if (minP != null && !(pr >= minP)) return false;
      if (maxP != null && !(pr > 0 && pr <= maxP)) return false;
      const ar = +p.areaM2 || 0;
      if (minA != null && !(ar >= minA)) return false;
      if (maxA != null && !(ar > 0 && ar <= maxA)) return false;
      if (tx && !hasAll(nrm(p.text || "") + " " + nrm(p.sender || "") + " " + nrm(p.region || ""), tx)) return false;
      return true;
    };
  }
  const SORTS = {
    new: (a, b) => tsOf(b) - tsOf(a),
    old: (a, b) => tsOf(a) - tsOf(b),
    price_asc: (a, b) => (a.price > 0 ? a.price : Infinity) - (b.price > 0 ? b.price : Infinity),
    price_desc: (a, b) => (b.price || 0) - (a.price || 0),
    ppm_asc: (a, b) => (ppmOf(a) || Infinity) - (ppmOf(b) || Infinity),
    ppm_desc: (a, b) => (ppmOf(b) || 0) - (ppmOf(a) || 0),
  };
  function postRow(p, now, full) {
    const r = { id: p.id, type: p.type, cat: p.category || null, deal: p.deal || null, region: p.region || null, price: +p.price || null, area: +p.areaM2 || null, rooms: p.rooms == null ? null : +p.rooms,
      floor: p.floor || null, fin: p.finishing || null, pay: p.payment || null, ppm: ppmOf(p), ago: ago(tsOf(p), now), who: p.sender || null, ph: (p.phones || []).slice(0, 3), src: (p.srcs && p.srcs[0]) || p.source || null, brk: p.isBroker == null ? null : !!p.isBroker };
    if (full) { r.text = cut(p.text, 1500); r.url = p.url || null; r.group = (p.groups && p.groups[0]) || p.group || null; r.ts = tsOf(p) || null; r.down = p.down || null; r.outside = !!p.outside; }
    else { r.txt = cut(p.text, 180); r.url = p.url || null; }
    return r;
  }
  function posts(items, f, o) {
    o = o || {}; const now = o.now || Date.now(), max = o.max || 30, ok = postFilter(f, now), list = (items || []).filter(ok);
    const sort = SORTS[(f && f.sort) || "new"] || SORTS.new; list.sort(sort);
    const off = clampInt(f && f.offset, 0, 1e6, 0), lim = clampInt(f && f.limit, 1, max, Math.min(10, max));
    const rows = list.slice(off, off + lim).map((p) => postRow(p, now, !!o.full));
    return { total: list.length, shown: rows.length, offset: off, rows };
  }
  // إحصائيات السوق على نفس الفلاتر
  function stats(items, f, o) {
    o = o || {}; const now = o.now || Date.now(), ok = postFilter(Object.assign({}, f, { sort: undefined }), now), list = (items || []).filter(ok);
    const prices = [], ppms = [], reg = new Map(), cat = new Map(); let req = 0, off = 0, newest = 0;
    for (const p of list) {
      if (p.type === "request") req++; else if (p.type === "offer") off++;
      const t = tsOf(p); if (t > newest) newest = t;
      const pr = +p.price || 0, pp = ppmOf(p);
      if (p.type === "offer" && pr > 0) prices.push(pr);
      if (p.type === "offer" && pp) ppms.push(pp);
      for (const [m, key] of [[reg, p.region || "(مش محددة)"], [cat, p.category || "other"]]) {
        const e = m.get(key) || { n: 0, req: 0, off: 0, ppm: [], price: [] }; e.n++; if (p.type === "request") e.req++; else if (p.type === "offer") e.off++;
        if (p.type === "offer" && pp) e.ppm.push(pp); if (p.type === "offer" && pr > 0) e.price.push(pr); m.set(key, e);
      }
    }
    const roll = (m, k) => [...m.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 12).map(([name, e]) => ({ [k]: name, n: e.n, requests: e.req, offers: e.off, medPpm: med(e.ppm), medPrice: med(e.price) }));
    return { n: list.length, requests: req, offers: off, newestAgo: ago(newest, now),
      offerPrice: { n: prices.length, median: med(prices), p25: pct(prices, 0.25), p75: pct(prices, 0.75), min: prices.length ? prices.reduce((m, x) => (x < m ? x : m), Infinity) : null, max: prices.length ? prices.reduce((m, x) => (x > m ? x : m), -Infinity) : null },
      offerPpm: { n: ppms.length, median: med(ppms), p25: pct(ppms, 0.25), p75: pct(ppms, 0.75) },
      byRegion: roll(reg, "region"), byCategory: roll(cat, "cat") };
  }

  // نص «عايز إيه» عند المشتري: ممكن يكون نص مباشر أو كائن {text, aiSummary, …} (leads.js → wantOf)
  function wantText(l) {
    const w = l && l.want;
    if (typeof w === "string") return w;
    if (w && typeof w === "object") return String(w.text || w.aiSummary || "");
    return "";
  }

  // ===== المشترين =====
  function leads(list, f, o) {
    o = o || {}; f = f || {}; const now = o.now || Date.now(), max = o.max || 30, rg = f.region ? words(f.region) : null, tx = f.text ? words(f.text) : null, days = num(f.days);
    const minB = num(f.minBudget), maxB = num(f.maxBudget), minL = num(f.minLevel);
    const rows = (list || []).filter((l) => {
      if (!l) return false;
      if (l.status === "hidden") return false; // المخفيين مبيظهروش للمساعد زي ما مبيظهروش في الداشبورد
      if (!f.includeBrokers && l.isBroker) return false;
      if (f.category && !(l.categories || [l.category]).includes(f.category)) return false;
      if (minL != null && !(l.level >= minL)) return false;
      if (rg && !hasAll(nrm((l.regions || []).join(" ")), rg)) return false;
      if (days != null && days > 0 && !(l.last && now - l.last <= days * DAY)) return false;
      if (minB != null && !(l.budget >= minB)) return false;
      if (maxB != null && !(l.budget > 0 && l.budget <= maxB)) return false;
      if (f.status && l.status !== f.status) return false;
      if (tx && !hasAll(nrm((l.name || "") + " " + wantText(l) + " " + (l.tags || []).join(" ")), tx)) return false;
      return true;
    });
    const so = { score: (a, b) => b.score - a.score || (b.last || 0) - (a.last || 0), last: (a, b) => (b.last || 0) - (a.last || 0), budget: (a, b) => (b.budget || 0) - (a.budget || 0) }[f.sort || "score"] || ((a, b) => b.score - a.score);
    rows.sort(so);
    const lim = clampInt(f.limit, 1, max, Math.min(10, max)), full = !!o.full;
    return { total: rows.length, shown: Math.min(lim, rows.length), rows: rows.slice(0, lim).map((l) => ({ key: l.key, name: l.name, level: l.level, score: l.score, budget: l.budget || null, regions: (l.regions || []).slice(0, 3), cats: l.categories || [l.category], want: cut(wantText(l), full ? 400 : 120), ago: ago(l.last, now), status: l.status || null, brk: !!l.isBroker, ph: (l.phones || []).slice(0, 3), src: (l.sources || []).slice(0, 2), posts: l.posts == null ? null : l.posts, requests: l.requests == null ? null : l.requests })) };
  }

  // ===== البائعين =====
  function sellers(list, f, o) {
    o = o || {}; f = f || {}; const now = o.now || Date.now(), max = o.max || 30, rg = f.region ? words(f.region) : null, tx = f.text ? words(f.text) : null, days = num(f.days);
    const rows = (list || []).filter((s) => {
      if (!s) return false;
      if (f.owners && (s.owner === undefined ? s.isBroker : !s.owner)) return false;
      if (f.brokers && !s.isBroker) return false;
      if (f.category && !(s.categories || [s.category]).includes(f.category)) return false;
      if (rg && !((s.units || []).some((u) => hasAll(nrm(u.region || ""), rg)) || hasAll(nrm((s.regions || []).join ? [].concat(s.regions).join(" ") : String(s.regions || "")), rg))) return false;
      if (days != null && days > 0 && !(s.last && now - s.last <= days * DAY)) return false;
      if (f.minUnits && (s.units || []).length < num(f.minUnits)) return false;
      if (f.status && s.status !== f.status) return false;
      if (tx && !hasAll(nrm((s.name || "") + " " + (s.units || []).map((u) => u.summary || u.text || "").join(" ")), tx)) return false;
      return true;
    });
    const so = { score: (a, b) => b.score - a.score || (b.last || 0) - (a.last || 0), last: (a, b) => (b.last || 0) - (a.last || 0), units: (a, b) => (b.units || []).length - (a.units || []).length }[f.sort || "score"] || ((a, b) => b.score - a.score);
    rows.sort(so);
    const lim = clampInt(f.limit, 1, max, Math.min(10, max));
    return { total: rows.length, shown: Math.min(lim, rows.length), rows: rows.slice(0, lim).map((s) => ({ key: s.key, name: s.name, level: s.level, score: s.score, role: s.role || (s.isBroker ? "broker" : s.owner ? "owner" : "unknown"), sure: s.rsure !== undefined ? !!s.rsure : (s.owner === undefined ? null : !!s.owner), units: (s.units || []).length, priceRange: s.priceRange || null, regions: [].concat(s.regions || []).slice(0, 3), cats: s.categories || [s.category], ago: ago(s.last, now), status: s.status || null, ph: (s.phones || []).slice(0, 3), src: (s.sources || []).slice(0, 2), unitsSample: (s.units || []).slice(0, o.full ? 8 : 3).map((u) => ({ id: u.id, cat: u.category, region: u.region || null, price: u.price || null, area: u.areaM2 || null, rooms: u.rooms == null ? null : u.rooms, txt: cut(u.summary || u.text, o.full ? 300 : 110) })) })) };
  }

  // ===== مساعدين =====
  // الأقسام اللي الموديل/الأداة تقدر تفتحها
  const VIEWS = { posts: "الطلبات والعروض", sellers: "البائعين", leads: "المشترين", matches: "التطابق", listings: "هاتلي مشتري", pick: "رشّحلي (فيه تاب المغناطيس)", publish: "نشر فيس بوك", wasend: "بوت واتساب", funnel: "الواردين والقياس", pipe: "الصفقات (فيها مرحلة «مسجّل» = سجل الـCRM)", today: "النهارده", saved: "دوّرلي على", stats: "نبض السوق", settings: "الإعدادات" };

  g.ASQ = { nrm, num, clampInt, pct, med, cut, ppmOf, tsOf, posts, stats, leads, sellers, VIEWS, postFilter };
  if (typeof module !== "undefined" && module.exports) module.exports = g.ASQ;
})(typeof globalThis !== "undefined" ? globalThis : this);
