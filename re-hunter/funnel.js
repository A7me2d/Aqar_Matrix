// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 📥 الواردين والقياس (10.80.53) — منطق نقي: من غير DOM ومن غير شبكة ومن غير chrome.*.
//  ١) تاج المصدر جوه الكود: AM-K7Q2XM-C2 = القطعة + القناة (C = قناة واتساب) + رقم الصياغة (2). العميل بيداس على لينك فيه الكود ← الرسالة بتوصل بالتاج.
//  ٢) تسجيل الرسايل الواردة اللي فيها كود (من واتساب ويب) كـ«وارد»: مين + أنهي قطعة + جه من فين + مرحلته.
//  ٣) القياس: بوستات ← واردين ← كلّمتهم ← معاينة ← صفقة لكل قناة ولكل صياغة + أحسن ساعة + توصيات بأرقام (وبحد أدنى للعيّنة).
//  ٤) صياغات بوستات القناة اليومية: «نبض الحي» و«طلبات الأسبوع» — أرقام من داتا المنصة بس، ومن غير أسماء ولا أرقام قطع ولا مبالغة.
(function (g) {
  "use strict";
  const F = {};
  const AL = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // نفس حروف أكواد الأطلس والانتشار (من غير 0/O/1/I/L)
  const latin = (s) => String(s == null ? "" : s).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
  const en = (n) => Number(n || 0).toLocaleString("en-US");
  const clip = (s, n) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);
  const DAY = 864e5;
  const median = (a) => { const x = a.filter((v) => isFinite(v)).sort((p, q) => p - q); if (!x.length) return null; const m = x.length >> 1; return x.length % 2 ? x[m] : (x[m - 1] + x[m]) / 2; };

  // ===== القنوات: k = مفتاح منصة «الانتشار» · t = حرف التاج في الكود =====
  F.CH = [
    { k: "wch", t: "C", n: "قناة واتساب", ic: "📢" }, { k: "fbg", t: "G", n: "جروبات فيسبوك", ic: "👥" }, { k: "fbp", t: "P", n: "صفحة فيسبوك", ic: "📄" },
    { k: "fbm", t: "M", n: "ماركت بليس", ic: "🛍" }, { k: "ig", t: "I", n: "إنستجرام", ic: "📸" }, { k: "igs", t: "S", n: "ستوري / حالة", ic: "⏱" },
    { k: "tt", t: "T", n: "تيك توك", ic: "🎵" }, { k: "yt", t: "Y", n: "يوتيوب شورتس", ic: "▶️" }, { k: "wa", t: "W", n: "جروبات واتساب", ic: "💬" },
    { k: "tg", t: "Z", n: "تيليجرام", ic: "✈️" }, { k: "x", t: "X", n: "X", ic: "𝕏" }, { k: "th", t: "E", n: "ثريدز", ic: "🧵" }, { k: "li", t: "L", n: "لينكد إن", ic: "💼" },
    { k: "pin", t: "N", n: "بنترست", ic: "📌" }, { k: "gbp", t: "B", n: "جوجل بيزنس", ic: "📍" }, { k: "dub", t: "D", n: "دوبيزل", ic: "🏷" }, { k: "aqm", t: "R", n: "عقار ماب", ic: "🏘" },
    { k: "qr", t: "Q", n: "QR / ملصق", ic: "🔳" }, { k: "web", t: "H", n: "صفحة / كتالوج", ic: "🌐" }, { k: "ad", t: "A", n: "إعلان ممول", ic: "🎯" },
  ];
  F.MIX = "mix"; // أكتر من قناة نشرت نفس الكود ومفيش تاج يفرّق
  F.chByKey = (k) => F.CH.find((c) => c.k === k) || null;
  F.chByTag = (t) => F.CH.find((c) => c.t === String(t || "").toUpperCase()) || null;
  F.chName = (k) => (k === F.MIX ? "أكتر من قناة" : k ? (F.chByKey(k) || { n: k }).n : "مش معروف");
  F.chIcon = (k) => (k === F.MIX ? "🔀" : k ? (F.chByKey(k) || { ic: "•" }).ic : "❔");

  F.STAGES = [["new", "جديد", "🆕"], ["contacted", "كلمته", "💬"], ["viewing", "معاينة", "🏗"], ["won", "اتقفل", "✅"], ["lost", "مش مهتم", "🚫"]];
  F.stageName = (s) => (F.STAGES.find((x) => x[0] === s) || [0, s])[1];

  // ===== الكود + التاج =====
  // AM-K7Q2XM · AM K7Q2XM · AMK7Q2XM · AM-K7Q2XM-C2 · AM-K7Q2XM.C — بأرقام عربي أو لاتيني وبأي حالة حروف
  const RE = /(?<![A-Z0-9])AM[\s\-_]?([2-9A-HJ-NP-Z]{6})(?![A-Z0-9])(?:[\-.]([A-Z])([0-9])?(?![A-Z0-9]))?/g;
  F.parse = function (text) {
    const t = latin(text).toUpperCase(); RE.lastIndex = 0; const m = RE.exec(t); if (!m) return null;
    const c = m[2] ? F.chByTag(m[2]) : null;
    return { code: "AM-" + m[1], tag: m[2] ? m[2] + (m[3] || "") : "", ch: c ? c.k : "", v: c && m[3] != null ? +m[3] : null };
  };
  F.parseAll = function (text) { const t = latin(text).toUpperCase(), out = [], seen = new Set(); RE.lastIndex = 0; let m; while ((m = RE.exec(t))) { const c = "AM-" + m[1]; if (!seen.has(c)) { seen.add(c); out.push(c); } } return out; };
  F.tagOf = (chKey, v) => { const c = F.chByKey(chKey); return c ? c.t + (v == null || v === "" ? "" : String(Math.max(0, Math.min(9, v | 0)))) : ""; };
  F.tagCode = (code, chKey, v) => { const t = F.tagOf(chKey, v); return t ? String(code) + "-" + t : String(code); };
  F.phoneIntl = (p) => { let d = latin(p).replace(/\D/g, ""); if (d.startsWith("00")) d = d.slice(2); if (/^01\d{9}$/.test(d)) d = "2" + d; else if (/^1\d{9}$/.test(d)) d = "20" + d; return d.length >= 10 && d.length <= 15 ? d : ""; };
  // لينك واتساب برسالة جاهزة فيها الكود المتعلّم (العميل هو اللي يبدأ المحادثة)
  F.waLink = function (phone, code, chKey, v, o) {
    const p = F.phoneIntl(phone); if (!p || !code) return ""; o = o || {};
    return "https://wa.me/" + p + "?text=" + encodeURIComponent(`${o.lead || "عايز تفاصيل"} كود ${F.tagCode(code, chKey, v)}`);
  };
  F.newCode = function (taken) {
    for (let n = 0; n < 80; n++) {
      let t = ""; try { const a = new Uint32Array(6); (g.crypto || {}).getRandomValues(a); t = Array.from(a).map((x) => AL[x % AL.length]).join(""); } catch { for (let i = 0; i < 6; i++) t += AL[Math.floor(Math.random() * AL.length)]; }
      const c = "AM-" + t; if (!taken || !taken[c]) return c;
    }
    return "AM-" + Date.now().toString(36).toUpperCase().replace(/[^2-9A-HJ-NP-Z]/g, "").padEnd(6, "K").slice(-6);
  };

  // ===== مخزن البوستات (اللي نشرتها) والواردين =====
  const capMap = (m, n, key) => { const ks = Object.keys(m); if (ks.length <= n) return m; ks.sort((a, b) => (m[a][key] || 0) - (m[b][key] || 0)); for (const k of ks.slice(0, ks.length - n)) delete m[k]; return m; };
  F.addPost = function (P, ev, now) {
    const m = { ...(P || {}) }, t = +ev.t || now || Date.now(), id = ev.id || "p" + t.toString(36) + Math.random().toString(36).slice(2, 6);
    const pc = F.parse(ev.code); m[id] = { id, t, code: pc ? pc.code : "", ch: ev.ch || "", v: Math.max(0, ev.v | 0), kind: ev.kind || "plot", title: clip(ev.title, 90), dn: clip(ev.dn, 40) };
    return { map: capMap(m, 600, "t"), id };
  };
  // بيانات القطعة من آخر بوستات الكود: أحدث عنوان/حي/نوع مش فاضي (بوست منصة تانية ممكن يبقى من غير عنوان)
  F.EVAL_CODE = "AM-EVAL22"; // كود صفحة «قيّم عقارك»: اللي يبعته مالك عايز يعرف سعر عقاره (مش مشتري)
  F.metaOf = function (P, code) {
    const L = Object.values(P || {}).filter((p) => p.code === code).sort((a, b) => b.t - a.t); if (!L.length) return null;
    const f = (k) => (L.find((p) => p[k]) || {})[k] || ""; return { title: f("title"), dn: f("dn"), kind: f("kind"), t: L[0].t };
  };
  // الإسناد: التاج أوّلًا · وإلا لو قناة واحدة بس نشرت الكود قبل الرسالة بآخر ٢١ يوم ← هي · أكتر من قناة ← «مختلط»
  F.attribute = function (P, hit, t) {
    if (hit.ch) return { ch: hit.ch, v: hit.v, via: "tag" };
    const chs = new Set(); for (const id in P || {}) { const p = P[id]; if (p.code === hit.code && p.ch && p.t <= t + 6e4 && t - p.t <= 21 * DAY) chs.add(p.ch); }
    if (chs.size === 1) return { ch: [...chs][0], v: null, via: "infer" };
    if (chs.size > 1) return { ch: F.MIX, v: null, via: "infer", chs: [...chs] };
    return { ch: "", v: null, via: "none" };
  };
  // ev = { mid, sid, num, body, t (ثواني أو مللي) } ← { map, added, id, dup?, again? }
  F.addInbound = function (I, P, ev, now) {
    I = I || {}; const hit = F.parse(ev && ev.body); if (!hit) return { map: I, added: false, nocode: true };
    let t = +ev.t || now || Date.now(); if (t < 1e12) t *= 1000;
    const raw = String(ev.sid || ev.mid || "").replace(/[^A-Za-z0-9]/g, "").slice(-24), id = "i" + (raw || t.toString(36) + Math.random().toString(36).slice(2, 6));
    if (I[id]) return { map: I, added: false, id, dup: true };
    const num = String(ev.num || "").replace(/\D/g, "");
    if (num) for (const k in I) { const e = I[k]; if (e.num === num && e.code === hit.code && Math.abs(t - e.t) < DAY) { const m = { ...I }; m[k] = { ...e, n: (e.n || 1) + 1, last: Math.max(e.last || e.t, t) }; return { map: m, added: false, id: k, again: true }; } }
    const at = F.attribute(P, hit, t), meta = F.metaOf(P, hit.code) || (hit.code === F.EVAL_CODE ? { title: "تقييم عقار", dn: "", kind: "owner" } : {});
    const entry = { id, t, last: t, n: 1, num, code: hit.code, ch: at.ch, v: at.v, via: at.via, st: "new", title: meta.title || "", dn: meta.dn || "", kind: meta.kind || "", txt: clip(ev.body, hit.code === F.EVAL_CODE ? 320 : 140), note: "" };
    if (at.chs) entry.chs = at.chs;
    const m = { ...I, [id]: entry };
    return { map: capMap(m, 800, "t"), added: true, id, entry };
  };
  F.setStage = function (I, id, st, now) {
    if (!I || !I[id] || !F.STAGES.some((x) => x[0] === st)) return I; now = now || Date.now(); const e = I[id], at = { ...(e.stAt || {}) };
    if (st !== "new") at[st] = now; else delete at.contacted;
    return { ...I, [id]: { ...e, st, stAt: at } };
  };
  F.setNote = (I, id, note) => (I && I[id] ? { ...I, [id]: { ...I[id], note: clip(note, 300) } } : I);
  // أول مرة اتحرّك فيها الوارد من «جديد» = وقت أول رد منك
  const firstTouch = (e) => { const v = Object.values(e.stAt || {}).filter((x) => x > 0); return v.length ? Math.min(...v) : 0; };

  // ===== القياس =====
  // posts / inb = الخرايط المخزّنة · o = { now, days (آخر كام يوم؛ 0 = الكل) }
  F.stats = function (P, I, o) {
    o = o || {}; const now = o.now || Date.now(), from = o.days ? now - o.days * DAY : 0;
    const ps = Object.values(P || {}).filter((p) => p.t >= from), es = Object.values(I || {}).filter((e) => e.t >= from);
    const rows = new Map(), get = (ch) => { if (!rows.has(ch)) rows.set(ch, { ch, posts: 0, inb: 0, contacted: 0, viewing: 0, won: 0, lost: 0, reply: [] }); return rows.get(ch); };
    for (const p of ps) get(p.ch || "").posts++;
    const vars = new Map(), vget = (ch, v) => { const k = ch + "|" + v; if (!vars.has(k)) vars.set(k, { ch, v, posts: 0, inb: 0 }); return vars.get(k); };
    for (const p of ps) if (p.ch) vget(p.ch, p.v | 0).posts++;
    const hours = Array(24).fill(0), wdays = Array(7).fill(0), byCode = new Map(), reply = [], unanswered = [];
    for (const e of es) {
      const r = get(e.ch || ""); r.inb++;
      if (e.st !== "new") r.contacted++; if (e.st === "viewing" || e.st === "won") r.viewing++; if (e.st === "won") r.won++; if (e.st === "lost") r.lost++;
      const ft = firstTouch(e); if (ft && ft >= e.t) { const mn = (ft - e.t) / 6e4; r.reply.push(mn); reply.push(mn); }
      if (e.ch && e.ch !== F.MIX && e.v != null) vget(e.ch, e.v).inb++;
      const d = new Date(e.t); hours[d.getHours()]++; wdays[d.getDay()]++;
      const c = byCode.get(e.code) || { code: e.code, title: e.title, dn: e.dn, inb: 0 }; c.inb++; if (e.title && !c.title) { c.title = e.title; c.dn = e.dn; } byCode.set(e.code, c);
      if (e.st === "new" && now - e.t > 30 * 6e4) unanswered.push(e);
    }
    const byCh = [...rows.values()].map((r) => ({ ...r, rate: r.posts ? r.inb / r.posts : 0, med: median(r.reply), name: F.chName(r.ch), ic: F.chIcon(r.ch) })).sort((a, b) => b.inb - a.inb || b.posts - a.posts);
    const n = { posts: ps.length, inb: es.length, fresh: es.filter((e) => e.st === "new").length, contacted: es.filter((e) => e.st !== "new").length, viewing: es.filter((e) => e.st === "viewing" || e.st === "won").length, won: es.filter((e) => e.st === "won").length, lost: es.filter((e) => e.st === "lost").length };
    unanswered.sort((a, b) => a.t - b.t);
    return { n, byCh, byVar: [...vars.values()].map((v) => ({ ...v, rate: v.posts ? v.inb / v.posts : 0 })).sort((a, b) => a.ch.localeCompare(b.ch) || a.v - b.v), hours, wdays,
      top: [...byCode.values()].sort((a, b) => b.inb - a.inb).slice(0, 5), replyMed: median(reply), replyN: reply.length, unanswered };
  };
  const hourTxt = (h) => (h === 0 ? "12 بالليل" : h < 12 ? h + " الصبح" : h === 12 ? "12 الضهر" : h < 17 ? h - 12 + " العصر" : h < 20 ? h - 12 + " المغرب" : h - 12 + " بالليل");
  F.hourTxt = hourTxt;
  const durTxt = (m) => (m < 1 ? "أقل من دقيقة" : m < 60 ? Math.round(m) + " دقيقة" : m < 1440 ? (Math.round(m / 6) / 10).toString().replace(/\.0$/, "") + " ساعة" : Math.round(m / 144) / 10 + " يوم");
  F.durTxt = durTxt;
  // توصيات بأرقام — ومن غير ما نحكم على عيّنة صغيرة
  // عدّاد بالمفرد/المثنى/الجمع المصري: ١ رسالة · ٢ رسالتين · ٣–١٠ رسايل · ١١+ رسالة
  const cnt = (n, one, two, few, many) => (n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? en(n) + " " + few : en(n) + " " + many);
  const RS = (n) => cnt(n, "رسالة", "رسالتين", "رسايل", "رسالة"), PS = (n) => cnt(n, "بوست", "بوستين", "بوستات", "بوست");
  F.cnt = cnt;
  F.advice = function (st) {
    const A = [], N = st.n;
    if (N.inb < 5) A.push({ k: "info", t: `لسه الداتا قليلة (${RS(N.inb)} واردة بكود). التوصيات بتبقى أدق بعد ~15 رسالة — كمّل نشر بالتاج.` });
    const known = st.byCh.filter((r) => r.ch && r.ch !== F.MIX);
    const best = known.filter((r) => r.posts >= 3 && r.inb >= 2).sort((a, b) => b.rate - a.rate)[0];
    if (best) A.push({ k: "good", t: `${best.ic} ${best.name} أحسن قناة: ${RS(best.inb)} من ${PS(best.posts)} (${(Math.round(best.rate * 100) / 100).toString()} لكل بوست).` });
    for (const r of known.filter((x) => x.posts >= 8 && x.inb === 0)) A.push({ k: "warn", t: `${r.ic} ${r.name}: ${PS(r.posts)} ومفيش ولا رسالة جت بالكود. قلّل النشر هناك أو غيّر الصياغة${r.ch === "fbg" ? " (وجروبات فيسبوك أعلى خطر حظر)" : ""}.` });
    for (const c of known) {
      const vs = st.byVar.filter((v) => v.ch === c.ch && v.posts >= 3); if (vs.length < 2) continue;
      const b = [...vs].sort((x, y) => y.rate - x.rate)[0], w = [...vs].sort((x, y) => x.rate - y.rate)[0];
      if (b !== w && b.inb >= 2 && b.rate >= 2 * Math.max(w.rate, 0.01)) A.push({ k: "good", t: `${c.ic} ${c.name}: الصياغة رقم ${en(b.v + 1)} جابت ${RS(b.inb)} من ${PS(b.posts)} مقابل ${RS(w.inb)} من ${PS(w.posts)} للصياغة رقم ${en(w.v + 1)} — اعتمد على الأولى.` });
    }
    const tot = st.hours.reduce((a, b) => a + b, 0);
    if (tot >= 8) { const hi = st.hours.indexOf(Math.max(...st.hours)); if (st.hours[hi] >= 3 && st.hours[hi] / tot >= 0.25) A.push({ k: "info", t: `أكتر رسايل بتيجي حوالين ${hourTxt(hi)} (${en(st.hours[hi])} من ${en(tot)}) — انشر قبلها بنص ساعة.` }); }
    if (st.unanswered.length) A.push({ k: "warn", t: `${en(st.unanswered.length)} ${st.unanswered.length === 1 ? "حد لسه" : "ناس لسه"} ماردّيتش عليهم — أقدمهم من ${durTxt((Date.now() - st.unanswered[0].t) / 6e4)}. السرعة بتفرّق.` });
    if (st.replyN >= 3 && st.replyMed > 60) A.push({ k: "warn", t: `متوسط ردّك على الواردين ${durTxt(st.replyMed)} — الرد في أول ساعة بيرفع فرصة المعاينة.` });
    if (N.inb >= 10 && N.contacted && !N.viewing) A.push({ k: "info", t: `${en(N.inb)} واردين و${en(N.contacted)} كلمتهم ولسه ولا معاينة — راجع الرد الأول: اسأل عن الميزانية وحدّد ميعاد.` });
    return A;
  };

  // ===== صياغات بوستات القناة اليومية =====
  const money = (n) => { n = +n || 0; return n >= 1e6 ? String(Math.round((n / 1e6) * 100) / 100).replace(/\.0+$/, "") + " مليون" : n >= 1000 ? en(Math.round(n / 1000)) + " ألف" : en(Math.round(n)); };
  F.money = money;
  const pickV = (arr, v) => arr[((v | 0) % arr.length + arr.length) % arr.length];
  const trendTxt = (t) => (t == null ? "" : t > 0 ? ` ▲ +${t}%` : t < 0 ? ` ▼ ${t}%` : " ◀▶ ثابت");
  // rows: [{ region, ppmMed, np (عدد العروض اللي حسبنا منها), trend }] — حي بأقل من 3 عروض مابيدخلش (رقم من عرضين مش نبض)
  F.pulseRows = (rows, max) => (rows || []).filter((r) => r && r.region && r.ppmMed > 0 && (r.np || 0) >= 3).sort((a, b) => b.np - a.np).slice(0, max || 5);
  F.pulsePost = function (rows, o) {
    o = o || {}; const R = F.pulseRows(rows, o.max), v = o.v | 0, city = o.city || "بني سويف الجديدة", link = o.link || "";
    if (!R.length) return "";
    const r100 = (x) => en(Math.round(x / 100) * 100), line = [
      (r) => `📍 ${r.region}: المتر حوالي ${r100(r.ppmMed)} جنيه${trendTxt(r.trend)} — من ${en(r.np)} عرض`,
      (r) => `• ${r.region} — ${r100(r.ppmMed)} ج/م²${trendTxt(r.trend)} (${en(r.np)} عرض)`,
      (r) => `${r.region} ${r100(r.ppmMed)}${trendTxt(r.trend)}`,
    ][v % 3];
    const head = pickV([`📊 نبض أراضي ${city} — آخر 30 يوم`, `💰 سعر المتر في أراضي ${city}`, `أسعار المتر في ${city} آخر 30 يوم:`], v);
    const body = v % 3 === 2 ? [R.map(line).join(" · ")] : R.map(line);
    const hasT = R.some((r) => r.trend != null), arrows = hasT ? " الأسهم = مقارنة بالفترة اللي قبل الـ30 يوم." : "";
    const note = pickV(["الأرقام من عروض اتنشرت فعلًا في الجروبات، والمتر بيختلف حسب الموقع والمساحة.", "ده وسيط عروض فعلية مش سعر ثابت — كل قطعة ليها حساباتها.", "وسيط عروض آخر 30 يوم. السعر الفعلي بيتحدد بالموقع والمساحة."], v) + arrows;
    const ask = pickV(["عايز تعرف المتاح في حي معيّن؟ ابعتلي الحي والمساحة:", "ابعتلي الحي والمساحة اللي بتدوّر عليها وأرجعلك بالمتاح:", "للاستفسار عن قطعة في حي معيّن:"], v);
    return [head, "", ...body, "", note, "", link ? `${ask} ${link}` : ask].join("\n").replace(/\n{3,}/g, "\n\n").trim();
  };
  // rows: [{ region, n (طلبات آخر 7 أيام), nb (كام طلب فيه ميزانية), lo, hi }]
  F.demandRows = (rows, max) => (rows || []).filter((r) => r && r.region && r.n >= 2).sort((a, b) => b.n - a.n).slice(0, max || 5);
  F.demandPost = function (rows, o) {
    o = o || {}; const R = F.demandRows(rows, o.max), v = o.v | 0, city = o.city || "بني سويف الجديدة", link = o.link || "";
    if (!R.length) return "";
    const bud = (r) => (r.nb >= 2 && r.hi > 0 ? (r.lo === r.hi || money(r.lo) === money(r.hi) ? ` — ميزانية حوالي ${money(r.hi)}` : ` — ميزانيات من ${money(r.lo)} لـ ${money(r.hi)}`) : "");
    const ln = (r) => `• ${r.region}: ${r.n === 2 ? "طلبين" : en(r.n) + (r.n <= 10 ? " طلبات" : " طلب")}${bud(r)}`;
    const seller = v % 2 === 0;
    const head = seller ? pickV([`🔎 طلبات شراء أراضي آخر 7 أيام — ${city}`, `طلبات الأسبوع على أراضي ${city}`], v >> 1) : pickV([`🔎 الطلب على الأراضي الأسبوع ده — ${city}`, `الأحياء اللي عليها طلب أراضي آخر 7 أيام`], v >> 1);
    const note = "الأرقام من طلبات اتنشرت في الجروبات (طلب = بوست، مش بالضرورة مشتري مختلف).";
    const ask = seller ? pickV(["عندك قطعة في الأحياء دي وعايز تعرضها؟ كلمني:", "لو ناوي تبيع قطعة في أي حي منهم ابعتلي التفاصيل:"], v >> 1) : pickV(["لو بتدوّر في أي حي منهم ابعتلي ميزانيتك والمساحة:", "عايز تعرف المتاح في الأحياء دي؟ كلمني:"], v >> 1);
    return [head, "", ...R.map(ln), "", note, "", link ? `${ask} ${link}` : ask].join("\n").replace(/\n{3,}/g, "\n\n").trim();
  };
  F.HYPE = /(?:ال)?(?:أفضل|افضل|أحسن|احسن|أرخص|ارخص)(?![ء-ي])|فرصة\s*(?:لن|لا|مش|ما)\s*(?:تتكرر|تتعوض|هتتكرر)|لن\s*تتكرر|(?<![ء-ي])(?:ضمان|مضمون|لقطة)(?![ء-ي])|اغتنم|بدون\s*منافس|آخر\s*فرصة|الحق\s*نفسك/;

  if (typeof module !== "undefined" && module.exports) module.exports = F; else g.FNL = F;
})(typeof globalThis !== "undefined" ? globalThis : this);
