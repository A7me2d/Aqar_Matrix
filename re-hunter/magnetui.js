// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🧲 المغناطيس (10.80.34 — من 10.80.57 تاب جوّه «رشّحلي») — كل وحدة سجّلتها في «رشّحلي» بتتوصّل لوحدها بباقي المنصة:
//  • 🛒 مشترين متطابقين (من عملاء المنصة + نتايج «هاتلي مشتري» اللي الخلفية بتلقطها من السحب)
//  • 🏷 عروض شبه وحدتك (منافسين / نفس القطعة عند حد تاني) مع فرق السعر
//  • 🔥 «شغل جاهز»: رسالة واتساب جاهزة من غير رقم القطعة (بكود AM لو موجود) — انت اللي بتدوس إرسال
// مفيش بحث جديد في فيسبوك: بيشتغل على الداتا اللي عندك، والتنبيهات بتيجي من الخلفية (background.js ← خانات pu:).
(() => {
  "use strict";
  const $$ = (id) => document.getElementById(id);
  const E = (s) => (typeof esc === "function" ? esc(s) : String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const T = (m) => { try { toast(m); } catch { console.log(m); } };
  // 10.80.57: المغناطيس بقى تاب «🧲 المغناطيس» جوّه «رشّحلي» — يبقى «ظاهر» لما شاشة رشّحلي مفتوحة والتاب ده مختار (الحاوية magRoot موجودة جواها)
  const live = () => { const v = $$("v-pick"), r = $$("magRoot"); return !!(v && !v.hidden && r && r.isConnected && v.contains(r)); };
  const ls = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  const uniq = (a) => [...new Set(a.filter(Boolean))];
  const cut = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
  const money = (v) => (globalThis.PICK ? PICK.fmtMoney(v) : String(v));
  const DAY = 864e5;

  const S = { units: {}, loaded: false, fil: "all", q: "", allTrust: false, shown: 30, open: new Set(), more: new Set(), seen: ls.get("alaaMagSeen", {}), talk: ls.get("alaaMagTalk", {}), base: ls.get("alaaMagBase", 0), lastShown: new Set(), built: false, wasLive: false, navT: 0 };
  const CACHE = new Map();

  // ===== الوحدات (من «رشّحلي») =====
  async function load() {
    try { const d = await chrome.storage.local.get("pickUnits"); const o = d.pickUnits; S.units = o && typeof o === "object" && !Array.isArray(o) ? o : {}; } catch { S.units = {}; }
    S.loaded = true;
  }
  const list = () => Object.values(S.units).filter((u) => u && u.status !== "sold" && String(u.text || "").trim());
  try { chrome.storage.onChanged.addListener((ch, area) => { if (area === "local" && ch.pickUnits) load().then(() => { CACHE.clear(); if (live()) paint(); schedNav(); }); }); } catch {}

  // ===== مساعدين =====
  const pk = (h) => (typeof personKey === "function" ? personKey(h) : h.uid ? "u:" + h.uid : "n:" + String(h.name || ""));
  const hid = (u, h, r) => u.id + "|" + (r ? "r" : "b") + "|" + pk(h);
  const myFirst = () => String(typeof myName !== "undefined" ? myName : "").trim().split(/\s+/).slice(0, 2).join(" ");
  const phonesOfText = (t) => { try { return PH.extractPhones(String(t || "")); } catch { return []; } };
  function isMine(u, name, phones) { // إعلان بتاعك انت (نفس الاسم أو نفس الرقم اللي في نص الوحدة) — مش منافس
    const me = myFirst(); if (me && me.length > 3 && PH.norm(String(name || "")).startsWith(PH.norm(me))) return true;
    const mp = phonesOfText(u.text); return !!(mp.length && (phones || []).some((p) => mp.includes(p)));
  }
  function unitU(u) { // تحليل الوحدة بتفاصيل التسجيل (السعر والمساحة والنوع اللي انت أكّدتها)
    return unitObj({ text: u.text, category: u.category && u.category !== "other" ? u.category : undefined, price: u.price || undefined, areaM2: u.areaM2 || undefined, rooms: u.rooms || undefined });
  }
  const amCode = (u) => { const m = /AM[\s\-_]*([A-Z0-9]{6})(?![A-Z0-9])/i.exec(String(u.text || "")); return m ? "AM-" + m[1].toUpperCase() : ""; };
  const title = (u) => u.title || (globalThis.PICK ? PICK.unitTitle(u) : "وحدة");
  const priceTxt = (u) => (u.price ? money(u.price) : u.over ? "أوفر " + money(u.over) : "من غير سعر");

  // ===== المشترين المتطابقين (نفس منطق «هاتلي مشتري» بس بالتفاصيل المسجّلة) =====
  function buyersLocal(Uo) {
    const out = [];
    for (const L of leads || []) {
      if (L.status === "hidden" || !L.want || !L.want.obj || ["won", "lost"].includes(stageOf(L))) continue;
      const m = MATCH.scoreWant(L.want.obj, Uo); if (!m || m.score < 50) continue;
      const ev = buyerEv(L, Uo);
      out.push({ key: "L:" + L.key, lead: L, src: "data", kind: ev.kind, name: L.name, uid: L.uid || "", phones: L.phones || [], score: m.score, why: m.why || [], text: ev.text || (L.want && L.want.text) || "", postText: ev.post || "",
        url: ev.url || "", group: (L.groups || [])[0] || "", at: L.last || 0, ts: ev.ts || L.last || 0, tags: L.tags || [], hot: !!L.superHot });
    }
    return out;
  }
  // ===== عروض شبه وحدتك =====
  function rivalsLocal(Uo) {
    const out = [];
    for (const Sx of sellers || []) {
      if (Sx.status === "hidden") continue;
      let best = null;
      for (const x of Sx.units || []) { if (!x.category || x.done) continue; const m = ALERTS.unitSim(Uo, x); if (m && (!best || m.score > best.m.score)) best = { u: x, m }; }
      if (!best || best.m.score < 50) continue;
      out.push({ key: "S:" + Sx.key, src: "data", kind: "offer", name: Sx.name, uid: Sx.uid || "", phones: Sx.phones || [], score: best.m.score, why: best.m.why || [], text: best.u.text || "", url: best.u.url || "",
        group: (best.u.groups && best.u.groups[0]) || best.u.group || "", at: Sx.last || 0, ts: best.u.ts || Sx.last || 0, owner: !!Sx.owner, unit: best.u });
    }
    return out;
  }
  const merge = (map, h, dis) => {
    const k = pk(h); if (dis[k]) return;
    const cur = map.get(k); if (!cur) return map.set(k, h);
    const best = h.score > cur.score ? h : cur, other = best === h ? cur : h;
    map.set(k, { ...best, src: "both", lead: best.lead || other.lead, unit: best.unit || other.unit, phones: uniq([...(best.phones || []), ...(other.phones || [])]), more: [...(best.more || []), ...(other.more || [])], owner: best.owner || other.owner });
  };
  function rivalInfo(u, Uo, h) { // فرق السعر + هل هي نفس القطعة تقريبًا
    const x = h.unit || {}, mine = +u.price || +Uo.price || 0, rp = +x.price || 0, L = x.land || {}, ML = Uo.land || {};
    const diff = mine && rp ? Math.round(((rp - mine) / mine) * 100) : null;
    const sameReg = !x.region || !Uo.region || x.region === Uo.region;
    const sameArea = u.areaM2 && x.areaM2 && Math.abs(u.areaM2 - x.areaM2) <= Math.max(2, 0.02 * u.areaM2);
    const mp = String(u.plot || ML.plot || ""), rpn = String(L.plot || "");
    const samePlot = !!(mp && rpn && mp === rpn && sameReg && x.region);
    const close = !samePlot && !!(sameArea && sameReg && x.region && (diff == null || Math.abs(diff) <= 5));
    return { diff, rp, samePlot, close, cheaper: diff != null && diff <= -3, pricier: diff != null && diff >= 3 };
  }

  function model(u) {
    const refs = [leads, sellers, mineHits, mineDis, mineCfg], sig = [u.text, u.price, u.areaM2, u.category, u.rooms, u.status, myFirst()].join("|"), c = CACHE.get(u.id);
    if (c && c.sig === sig && c.refs.every((r, i) => r === refs[i])) return c.m;
    const Uo = unitU(u), sid = "pu:" + u.id, dis = (mineDis && mineDis[sid]) || {}, min = +(mineCfg && mineCfg.min) || 70, W = { real: 8, maybe: 0, broker: -30 };
    const bm = new Map(), rm = new Map(), H = (mineHits && mineHits[sid]) || [];
    try { for (const h of buyersLocal(Uo)) merge(bm, h, dis); } catch (e) { console.warn("magnet buyers", e); }
    for (const h of H) if (!h.hidden && h.kind !== "offer") merge(bm, { ...h, src: "fb" }, dis);
    try { for (const h of rivalsLocal(Uo)) merge(rm, h, dis); } catch (e) { console.warn("magnet rivals", e); }
    for (const h of H) if (!h.hidden && h.kind === "offer") merge(rm, { ...h, src: "fb" }, dis);
    const buyers = [...bm.values()].filter((h) => h.score >= min);
    for (const h of buyers) {
      try { h.tr = trustOf(h); } catch { h.tr = { level: "maybe", label: "مش متأكد", why: [], neg: [] }; }
      const dp = typeof mineDeep !== "undefined" ? mineDeep[pk(h)] : null; if (dp && dp.phones && dp.phones.length) h.phones = uniq([...(h.phones || []), ...dp.phones]);
    }
    const show = (typeof TRUST_SHOW !== "undefined" && TRUST_SHOW[(mineCfg && mineCfg.trust) || "real"]) || ((t) => t.level === "real");
    buyers.sort((a, b) => (b.score + (W[b.tr.level] || 0)) - (a.score + (W[a.tr.level] || 0)) || (b.ts || b.at || 0) - (a.ts || a.at || 0));
    const rivals = [...rm.values()].filter((h) => h.score >= min && !isMine(u, h.name, h.phones)).map((h) => ({ ...h, ri: rivalInfo(u, Uo, h) }));
    rivals.sort((a, b) => (b.ri.samePlot ? 1 : 0) - (a.ri.samePlot ? 1 : 0) || (b.ri.close ? 1 : 0) - (a.ri.close ? 1 : 0) || (b.ri.cheaper ? 1 : 0) - (a.ri.cheaper ? 1 : 0) || b.score - a.score);
    const m = { u, Uo, buyers, show, vis: buyers.filter((h) => show(h.tr)), rivals };
    CACHE.set(u.id, { sig, refs, m });
    return m;
  }
  const isFresh = (h) => (h.ts || h.at || 0) > Date.now() - DAY;
  const isHot = (h) => !!h.hot || h.score >= 85 || isFresh(h);
  const talked = (h) => !!S.talk[pk(h)] || !!(h.lead && typeof fastTalked === "function" && fastTalked(h.lead));
  const isNew = (u, h, r) => !S.seen[hid(u, h, r)];
  function stats(m) {
    const buyers = S.allTrust ? m.buyers : m.vis;
    const nNew = buyers.filter((h) => isNew(m.u, h)).length + m.rivals.filter((h) => isNew(m.u, h, 1)).length;
    return { buyers, nNew, nHot: buyers.filter((h) => isHot(h) && !talked(h)).length, nPhone: buyers.filter((h) => (h.phones || []).length).length, nCheap: m.rivals.filter((h) => h.ri.cheaper).length, nSame: m.rivals.filter((h) => h.ri.samePlot || h.ri.close).length,
      top: buyers.reduce((a, h) => Math.max(a, h.score || 0), 0), nHid: m.buyers.length - m.vis.length };
  }

  // ===== «شغل جاهز»: الرسالة والأزرار =====
  const firstNm = (n) => (phonesOfText(n).length || /^[a-z0-9._]+$/i.test(String(n || "")) ? "" : " أستاذ " + String(n || "").split(/\s+/)[0]);
  function magMsg(m, h) {
    const line = typeof uLineSafe === "function" ? uLineSafe(m.Uo) : title(m.u), code = amCode(m.u), me = myFirst();
    return `أهلًا${firstNm(h.name)} 👋\n${h.kind === "request" ? "بخصوص طلبك" : "بخصوص اللي بتدور عليه"}، عندي ${line}${code ? "\nكود الوحدة: " + code : ""}\n\nتحب أبعتلك التفاصيل ونحدد معاد معاينة؟${me ? "\n" + me : ""}`;
  }
  const find = (uid, hk, rival) => {
    const u = S.units[uid]; if (!u) return null; const m = model(u), h = (rival ? m.rivals : m.buyers).find((x) => pk(x) === hk); return h ? { u, m, h } : null;
  };
  function seenAdd(ids) { for (const i of ids) S.seen[i] = 1; const ks = Object.keys(S.seen); if (ks.length > 4000) for (const k of ks.slice(0, ks.length - 3000)) delete S.seen[k]; ls.set("alaaMagSeen", S.seen); }
  function baseline() { // أول مرة: كل اللي موجود دلوقتي «اتشاف» — الجديد بعد كده هو اللي يتعلّم 🆕
    if (S.base) return; const ids = [];
    for (const u of list()) { const m = model(u); m.buyers.forEach((h) => ids.push(hid(u, h))); m.rivals.forEach((h) => ids.push(hid(u, h, 1))); }
    seenAdd(ids); S.base = Date.now(); ls.set("alaaMagBase", S.base);
  }

  // ===== العرض =====
  const KIND = { request: "📢 طلب", comment: "💬 علّق على عرض شبهها", me2: "🙋 «وأنا كمان»", offer: "🟢 عرض" };
  function hitRow(m, h, o = {}) {
    const u = m.u, rv = !!o.rival, nw = isNew(u, h, rv), tk = !rv && talked(h), ph = (h.phones || [])[0];
    const ri = h.ri;
    const flags = rv
      ? `${ri.samePlot ? `<b class="mg-f bad">⚠ نفس القطعة عند حد تاني</b>` : ri.close ? `<b class="mg-f bad">⚠ شبهها جدًا (نفس المساحة والحي)</b>` : ""}${ri.diff != null ? `<b class="mg-f ${ri.cheaper ? "bad" : ri.pricier ? "ok" : ""}">${ri.cheaper ? `أرخص منك ${Math.abs(ri.diff)}%` : ri.pricier ? `أغلى منك ${ri.diff}%` : "نفس سعرك تقريبًا"} (${money(ri.rp)})</b>` : ri.rp ? `<b class="mg-f">${money(ri.rp)}</b>` : `<b class="mg-f">من غير سعر</b>`}${h.owner ? `<b class="mg-f">🏠 مالك</b>` : ""}`
      : `${h.tr ? `<b class="mg-f tr-${h.tr.level}">${E(h.tr.label || "")}</b>` : ""}${isFresh(h) ? `<b class="mg-f hot">🔥 آخر 24 ساعة</b>` : ""}${h.hot ? `<b class="mg-f hot">💎 مهتم جدًا</b>` : ""}${ph ? "" : `<b class="mg-f">من غير رقم</b>`}`;
    const acts = rv
      ? `${ph ? `<a class="btn sm" target="_blank" rel="noopener" href="${E(PH.waLink(ph))}">💬 ${E(ph)}</a>` : ""}${h.url ? `<a class="btn sm" target="_blank" rel="noopener" href="${E(h.url)}">🔗 العرض</a>` : ""}`
      : `<button class="btn sm ${ph ? "wa primary" : "primary"}" data-mact="wa" title="${ph ? "بيفتح واتساب برسالة جاهزة من غير رقم القطعة — انت اللي بتدوس إرسال" : "مفيش رقم: بينسخ الرسالة ويفتح الشات/البروفايل"}">${ph ? "💬 ابعتلها" : "✉️ رسالة"}</button><button class="btn sm" data-mact="copy" title="انسخ الرسالة">📋</button>${h.url ? `<a class="btn sm" target="_blank" rel="noopener" href="${E(h.url)}">🔗 ${h.kind === "request" ? "الطلب" : "البوست"}</a>` : ""}<button class="btn sm ${tk ? "" : "primary"}" data-mact="talk">${tk ? "↩️ لسه" : "✅ اتكلمت"}</button>`;
    return `<div class="mg-h${nw ? " new" : ""}${tk ? " talked" : ""}${rv ? " rv" : ""}" data-mu="${E(u.id)}" data-hk="${E(pk(h))}" data-rv="${rv ? 1 : 0}">
      <b class="mg-sc${h.score < 85 ? " mid" : ""}">${h.score}%</b>
      <div class="mg-hm"><div class="mg-hn"><b>${E(h.name || "—")}</b>${nw ? `<em class="mg-new">🆕 جديد</em>` : ""}${tk ? `<span class="mg-tk">✅ اتكلمت</span>` : ""} <span class="muted">${E(KIND[h.kind] || "")}${h.group ? " · 📌 " + E(cut(h.group, 28)) : ""}${h.ts || h.at ? " · " + E(relDay(h.ts || h.at)) : ""}</span></div>
        <div class="mg-fl">${flags}</div>
        ${h.text ? `<div class="mg-ev">«${E(cut(h.text, rv ? 150 : 170))}»</div>` : ""}
        ${(h.why || []).length ? `<div class="mg-why">✔ ${E(h.why.slice(0, 4).join(" · "))}</div>` : ""}</div>
      <div class="mg-ha">${o.tag ? `<span class="mg-tag">${o.tag}</span>` : ""}${acts}</div></div>`;
  }
  function chipsOf(u, st, m) {
    return `<span class="mg-b buy" title="مشترين متطابقين">🛒 <b>${st.buyers.length}</b></span>${st.nNew ? `<span class="mg-b new">🆕 ${st.nNew}</span>` : ""}${st.nHot ? `<span class="mg-b hot" title="سخنين ولسه ما كلمتهمش">🔥 ${st.nHot}</span>` : ""}${m.rivals.length ? `<span class="mg-b riv" title="عروض شبه وحدتك">🏷 <b>${m.rivals.length}</b></span>` : ""}${st.nCheap ? `<span class="mg-b bad">⚠ ${st.nCheap} أرخص منك</span>` : ""}${st.nSame ? `<span class="mg-b bad">👀 ${st.nSame} نفس القطعة/شبهها</span>` : ""}`;
  }
  function unitCard(m, ix, total) {
    const u = m.u, st = stats(m), open = S.open.has(u.id) || (!S.open.has("-" + u.id) && (total <= 3 || st.nNew > 0 || st.nHot > 0)), moreB = S.more.has("b" + u.id), moreR = S.more.has("r" + u.id);
    const bs = st.buyers, rs = m.rivals, ageD = Math.max(0, Math.floor((Date.now() - (u.createdAt || Date.now())) / DAY));
    const shB = moreB ? bs.slice(0, 60) : bs.slice(0, 4), shR = moreR ? rs.slice(0, 30) : rs.slice(0, 3);
    if (open) { for (const h of shB) S.lastShown.add(hid(u, h)); for (const h of shR) S.lastShown.add(hid(u, h, 1)); }
    const body = !open ? "" : `<div class="mg-bd">
      ${bs.length ? `<div class="mg-sec"><h4>🛒 مشترين متطابقين مع الوحدة دي</h4>${shB.map((h) => hitRow(m, h)).join("")}${bs.length > 4 ? `<button class="btn sm" data-mact="more" data-mk="b">${moreB ? "▲ أقل" : `كل المشترين (${bs.length})`}</button>` : ""}</div>` : `<p class="mg-none">لسه مفيش مشتري متطابق${st.nHid ? "" : " — لما يظهر طلب شبهها هيجيلك تنبيه"}.</p>`}
      ${st.nHid && !S.allTrust ? `<p class="muted mg-hid">🏢 فيه ${st.nHid} متخفيين (سماسرة أو مش متأكد منهم) — <button class="linkbtn" data-mact="trust">اعرضهم</button></p>` : ""}
      ${rs.length ? `<div class="mg-sec"><h4>🏷 عروض شبه وحدتك (منافسة)</h4>${shR.map((h) => hitRow(m, h, { rival: true })).join("")}${rs.length > 3 ? `<button class="btn sm" data-mact="more" data-mk="r">${moreR ? "▲ أقل" : `كل العروض الشبيهة (${rs.length})`}</button>` : ""}</div>` : ""}
      <div class="mg-ua"><button class="btn sm" data-mact="atlas" title="افتح القطعة على الخريطة">🗺 الأطلس</button><button class="btn sm" data-mact="seen">✓ شفتهم</button><button class="btn sm" data-mact="pick" title="افتح الوحدة في رشّحلي">⭐ رشّحلي</button></div></div>`;
    return `<section class="mg-u k-${E(u.category || "other")}${st.nNew ? " has-new" : ""}" data-mu="${E(u.id)}">
      <div class="mg-uh" data-mact="toggle" role="button" tabindex="0" aria-expanded="${open}">
        <div class="mg-ut"><b>${E(title(u))}</b><span class="mg-pr">${E(priceTxt(u))}</span>${u.status === "reserved" ? `<span class="mg-b">محجوزة</span>` : ""}${u.featured ? `<span class="mg-b">⭐</span>` : ""}<span class="muted mg-age">${ageD ? "من " + ar(ageD) + " يوم" : "النهارده"}</span></div>
        <div class="mg-uc">${chipsOf(u, st, m)}${!bs.length && !rs.length ? `<span class="mg-b none">لسه مفيش</span>` : ""}<span class="mg-chev" aria-hidden="true">▾</span></div></div>${body}</section>`;
  }
  function allModels() { return list().map((u) => { const m = model(u); return { u, m, st: stats(m) }; }); }
  function sortCards(a, b) { return (b.st.nNew ? 1 : 0) - (a.st.nNew ? 1 : 0) || b.st.nHot - a.st.nHot || b.st.top - a.st.top || b.st.buyers.length - a.st.buyers.length || (b.u.createdAt || 0) - (a.u.createdAt || 0); }
  const FILS = [["all", "الكل"], ["new", "🆕 جديد"], ["hot", "🔥 سخّن"], ["riv", "⚠ فيها منافس"], ["none", "من غير مشترين"]];
  const passFil = (x) => ({ all: true, new: x.st.nNew > 0, hot: x.st.nHot > 0, riv: x.m.rivals.length > 0, none: !x.st.buyers.length })[S.fil];
  function passQ(x) {
    const q = String(S.q || "").trim(); if (!q) return true;
    const hay = PH.norm([title(x.u), x.u.text, x.u.note, x.u.districtLabel].join(" ")); return PH.norm(q).split(/\s+/).every((w) => hay.includes(w));
  }
  // الشغل الجاهز: أحسن المشترين اللي لسه ما اتكلمش معاهم (من كل الوحدات)
  function readyWork(all) {
    const rows = [];
    for (const x of all) for (const h of x.st.buyers) if (!talked(h) && (isHot(h) || isNew(x.u, h))) rows.push({ x, h });
    rows.sort((a, b) => (isNew(b.x.u, b.h) ? 1 : 0) - (isNew(a.x.u, a.h) ? 1 : 0) || ((b.h.phones || []).length ? 1 : 0) - ((a.h.phones || []).length ? 1 : 0) || b.h.score - a.h.score || (b.h.ts || b.h.at || 0) - (a.h.ts || a.h.at || 0));
    const seenP = new Set(), out = [];
    for (const r of rows) { const k = pk(r.h); if (seenP.has(k)) continue; seenP.add(k); out.push(r); if (out.length >= 6) break; }
    return out;
  }
  function paint() {
    const root = $$("magRoot"); if (!root) return;
    if (!S.loaded) { root.innerHTML = `<p class="mg-none">⏳ بيحمّل وحداتك…</p>`; return; }
    if (!S.built || !$$("magB")) {
      root.innerHTML = `<div class="mg-top"><h2>🧲 المغناطيس</h2><p class="muted">كل وحدة سجّلتها في «رشّحلي» بتتوصّل لوحدها بالمشترين والعروض الشبيهة — وبيجيلك تنبيه أول ما يظهر جديد.</p></div>
        <div class="kpis" id="magK"></div><div class="mg-tools"><div class="mg-fils" id="magF"></div><input id="magQ" class="mg-q" type="search" placeholder="🔍 دوّر في وحداتك (حي / مساحة / كلمة)" autocomplete="off"><button class="btn sm" data-mact="seenall">✓ شفت كل الجديد</button></div>
        <div id="magW"></div><div id="magB"></div>`;
      S.built = true; $$("magQ").addEventListener("input", (e) => { S.q = e.target.value; S.shown = 30; paintBody(); });
    }
    paintBody();
  }
  function paintBody() {
    const units = list();
    if (!units.length) { $$("magK").innerHTML = ""; $$("magF").innerHTML = ""; $$("magW").innerHTML = ""; $$("magB").innerHTML = `<div class="empty"><b>🧲 لسه مفيش وحدات مسجّلة</b><p class="muted">سجّل وحداتك في «⭐ رشّحلي» (لصق أو استيراد من واتساب) وهتظهر هنا لوحدها متوصّلة بالمشترين والعروض الشبيهة.</p><button class="btn primary" data-mact="gopick">⭐ افتح رشّحلي</button></div>`; return; }
    baseline(); S.lastShown = new Set();
    const all = allModels().sort(sortCards), tot = { b: 0, n: 0, r: 0, c: 0, h: 0 };
    for (const x of all) { tot.b += x.st.buyers.length; tot.n += x.st.nNew; tot.r += x.m.rivals.length; tot.c += x.st.nCheap; tot.h += x.st.nHot; }
    $$("magK").innerHTML = `<div class="kpi"><b>${ar(units.length)}</b><span>🏠 وحدة مسجّلة</span></div><div class="kpi"><b>${ar(tot.b)}</b><span>🛒 مشتري متطابق</span></div><div class="kpi kpi-hot"><b>${ar(tot.n)}</b><span>🆕 جديد من آخر زيارة</span></div><div class="kpi"><b>${ar(tot.h)}</b><span>🔥 سخّن ولسه ما كلمتوش</span></div><div class="kpi"><b>${ar(tot.r)}</b><span>🏷 عرض شبه وحداتك</span></div>${tot.c ? `<div class="kpi mg-kbad"><b>${ar(tot.c)}</b><span>⚠ أرخص منك</span></div>` : ""}`;
    $$("magF").innerHTML = FILS.map(([k, l]) => `<button class="tab ${S.fil === k ? "on" : ""}" data-mact="fil" data-k="${k}">${l}</button>`).join("");
    const rw = readyWork(all);
    $$("magW").innerHTML = rw.length ? `<section class="mg-ready"><h3>🔥 شغل جاهز — ابدأ بيهم <small class="muted">(كل واحد فيه رسالة جاهزة بتفتح واتساب — انت اللي بتدوس إرسال)</small></h3>${rw.map(({ x, h }) => { S.lastShown.add(hid(x.u, h)); return hitRow(x.m, h, { tag: E(cut(title(x.u), 30)) }); }).join("")}</section>` : "";
    const rows = all.filter((x) => passFil(x) && passQ(x));
    $$("magB").innerHTML = rows.length ? rows.slice(0, S.shown).map((x, i) => unitCard(x.m, i, rows.length)).join("") + (rows.length > S.shown ? `<button class="btn more" data-mact="showmore">عرض المزيد (${rows.length - S.shown})</button>` : "") : `<div class="empty"><b>مفيش وحدات بالفلتر ده</b></div>`;
  }
  window.renderMagnet = function () { load().then(paint); };

  // ===== الأزرار =====
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("#magRoot [data-mact]"); if (!b) return;
    const act = b.dataset.mact, card = b.closest("[data-mu]"), uid = card && card.dataset.mu, row = b.closest(".mg-h"), hk = row && row.dataset.hk, rv = !!(row && row.dataset.rv === "1");
    if (act === "toggle") {
      if (e.target.closest("a,button")) return;
      const isOpen = !!card.querySelector(".mg-bd"); S.open.delete(uid); S.open.delete("-" + uid); S.open.add(isOpen ? "-" + uid : uid); return paintBody();
    }
    if (act === "fil") { S.fil = b.dataset.k; S.shown = 30; return paintBody(); }
    if (act === "showmore") { S.shown += 30; return paintBody(); }
    if (act === "trust") { S.allTrust = true; return paintBody(); }
    if (act === "more") { const k = b.dataset.mk + uid; S.more.has(k) ? S.more.delete(k) : S.more.add(k); return paintBody(); }
    if (act === "seenall") { seenAdd(allIds()); T("✓ كل الجديد اتعلّم «اتشاف»"); schedNav(0); return paintBody(); }
    if (act === "seen") { const u = S.units[uid]; if (u) { const m = model(u); seenAdd([...m.buyers.map((h) => hid(u, h)), ...m.rivals.map((h) => hid(u, h, 1))]); } schedNav(0); return paintBody(); }
    if (act === "gopick") { window.__pkTab = "add"; state.view = "pick"; return render(); }
    if (act === "pick") { window.__pkTab = "list"; state.view = "pick"; render(); try { setTimeout(() => { const el = document.querySelector(`.pk-unit[data-pkid="${CSS.escape(uid)}"]`); if (el) el.scrollIntoView({ block: "center" }); }, 250); } catch {} return; }
    if (act === "atlas") return openAtlas(S.units[uid]);
    const f = find(uid, hk, rv); if (!f) return;
    if (act === "copy") { await copyText(magMsg(f.m, f.h)); seenAdd([hid(f.u, f.h, rv)]); T("📋 الرسالة اتنسخت"); return paintBody(); }
    if (act === "talk") {
      const on = !talked(f.h);
      if (on) S.talk[pk(f.h)] = Date.now(); else delete S.talk[pk(f.h)];
      ls.set("alaaMagTalk", S.talk);
      const L = f.h.lead; if (L && typeof setLeadMeta === "function") { try { await setLeadMeta(L.key, on ? { talkedAt: Date.now(), lastMsg: Date.now(), ...(stageOf(L) === "new" ? { stage: "contacted" } : {}) } : { talkedAt: 0 }); } catch (er) { console.warn(er); } }
      seenAdd([hid(f.u, f.h, rv)]); return paintBody();
    }
    if (act === "wa") {
      const { u, m, h } = f, P = h.lead || { key: "mg|" + pk(h), name: h.name, uid: h.uid, phones: h.phones || [] };
      const P2 = (P.phones && P.phones[0]) || !(h.phones || []).length ? P : { ...P, phones: h.phones };
      try { if (typeof copyPlotFile === "function") await copyPlotFile(m.Uo, P2); } catch {} // 🖼 صورة ملف القطعة (لو معروفة في الأطلس)
      await sendTo(P2, magMsg(m, h), true);
      seenAdd([hid(u, h)]);
      T("💬 فتحت الشات — ابعت من واتساب وبعدين دوس «✅ اتكلمت»"); return paintBody();
    }
  });
  document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("#magRoot .mg-uh")) { e.preventDefault(); e.target.click(); } });
  function allIds() { const ids = []; for (const u of list()) { const m = model(u); m.buyers.forEach((h) => ids.push(hid(u, h))); m.rivals.forEach((h) => ids.push(hid(u, h, 1))); } return ids; }
  function openAtlas(u) {
    if (!u) return; const pl = globalThis.PICK ? PICK.plotOf(u) : "", dm = /^h:(\d+)$/.exec(u.districtKey || ""), n = /^\d{1,5}$/.test(String(pl)) ? +pl : null;
    state.view = "atlas"; render();
    try { if (window.ATLAS) setTimeout(() => ATLAS.open(dm ? { d: +dm[1], m: +u.mugawra || 0, n } : null), 60); } catch {}
  }

  // ===== شارة الشريط الجانبي + «شفت» عند الخروج من الشاشة =====
  const leaveMark = () => { if (S.lastShown.size) { seenAdd([...S.lastShown]); S.lastShown = new Set(); } };
  // الانتقال لقسم اتفتح قبل كده بيعمل رفرش للصفحة (dashboard.js ← refreshInto): لازم «اتشاف» يتحفظ قبلها
  (window.AQM_FLUSH = window.AQM_FLUSH || []).push(() => { if (live()) leaveMark(); });
  window.addEventListener("pagehide", () => { if (live()) leaveMark(); });
  function navUpdate() {
    const el = $$("navMagnet"); if (!el) return;
    if (!S.loaded) { load().then(navUpdate); return; }
    const is = live();
    if (S.wasLive && !is) leaveMark(); // خرجت من الشاشة = شفت اللي كان ظاهر
    S.wasLive = is;
    if (!list().length) { el.hidden = true; return; }
    let n = 0; try { baseline(); for (const u of list()) n += stats(model(u)).nNew; } catch (er) { console.warn("magnet nav", er); }
    el.textContent = n; el.hidden = !n || is;
  }
  function schedNav(ms) { clearTimeout(S.navT); S.navT = setTimeout(navUpdate, ms == null ? 400 : ms); }

  // ===== للربط مع باقي المنصة =====
  window.MAGNET = {
    nav: schedNav,
    // شارة صغيرة على كارت الوحدة في «رشّحلي» (بتفتح المغناطيس على الوحدة دي)
    chip(u) {
      try {
        if (!u || u.status === "sold" || typeof leads === "undefined") return "";
        const m = model(u), st = stats(m); if (!st.buyers.length && !m.rivals.length) return "";
        return `<button type="button" class="mg-link" data-mglink="${E(u.id)}" title="افتح المغناطيس على الوحدة دي">🧲 ${st.buyers.length ? `${ar(st.buyers.length)} مشتري` : ""}${st.buyers.length && m.rivals.length ? " · " : ""}${m.rivals.length ? `${ar(m.rivals.length)} عرض شبهها` : ""}${st.nNew ? ` · 🆕${ar(st.nNew)}` : ""}</button>`;
      } catch { return ""; }
    },
    model, list, stats, magMsg, _S: S,
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-mglink]"); if (!b) return;
    const id = b.dataset.mglink; S.open.delete("-" + id); S.open.add(id); S.fil = "all"; S.q = ""; window.__pkTab = "mag"; state.view = "pick"; render();
    setTimeout(() => { const el = document.querySelector(`#magB [data-mu="${CSS.escape(id)}"]`); if (el) el.scrollIntoView({ block: "start" }); }, 200);
  });
  load().then(() => schedNav(1500));
})();
