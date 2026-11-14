// Copyright 2026 Alaa Ahmed - Aqar Matrix. All rights reserved.
// Classic scripts share the existing dashboard state; see matches/README.md.

// Secondary information is disclosed inline; keys preserve expansion during live updates.
function matchDetails(key, label, body) {
  return `<details class="match-details" data-match-detail="${esc(key)}"><summary>${esc(label)}</summary><div class="match-detail-body">${body}</div></details>`;
}
function ownUnitRole(u, S) {
  if (!HAS_OWN) return { mention: false };
  return OWNMK.roleOf({ type: "offer", text: u.text || "", isBroker: u.isBroker }, sellerRoleCtx(S), true);
}
function ownBuyerRole(B, u) {
  if (!HAS_OWN) return { mention: false };
  const ev = buyerEv(B, u);
  const r = OWNMK.classify(ev.text || "", { kind: "request", mentionOnly: true });
  return r.mention ? r : OWNMK.classify((B.want && B.want.text) || "", { kind: "request", mentionOnly: true });
}
const ownBadgeU = (u, S, sm) => { const r = ownUnitRole(u, S); return r.mention && r.t && r.src !== "ai" ? OWNMK.badgeHtml(r, esc) : ""; };
const ownBadgeB = (B, u) => { const r = ownBuyerRole(B, u); return r.mention && r.t ? OWNMK.badgeHtml(r, esc) : ""; };
function ownPair(x) {
  if (!HAS_OWN) return "";
  const b = ownBuyerRole(x.B, x.u);
  if (!b.wantsOwner) return "";
  const ur = ownUnitRole(x.u, x.S);
  const owner = x.S.owner || ur.role === "owner", broker = !owner && (x.S.isBroker || BROKERISH.includes(ur.role));
  return owner ? `<span class="own-pair ok" title="المشتري كاتب «المالك» في طلبه، والبايع متصنّف مالك">🏠 طالب «من المالك» والبايع مالك ✔</span>`
    : broker ? `<span class="own-pair bad" title="المشتري كاتب «المالك» في طلبه، والبايع سمسار/مكتب">⚠ طالب «من المالك» والبايع سمسار/مكتب</span>`
    : `<span class="own-pair maybe" title="المشتري كاتب «المالك» في طلبه، ومش مؤكد إن البايع مالك">🟡 طالب «من المالك» — البايع لسه مش مؤكد مالك</span>`;
}
function pairCard(x) {
  const B = x.B, S = x.S, u = x.u, ev = buyerEv(B, u);
  return `<article class="card pair${justKeys.has(MATCH.pairFbKey(x)) ? " just" : ""}" data-pair="${esc(B.key)}|${esc(u.id)}">
    <div class="pair-score" style="--p:${x.score}">${pcount(1)}<b>${x.score}%</b><span>تطابق</span>${pairIsNew(x) ? `<em class="newbadge">🆕 جديد</em>` : ""}</div>
    <div class="pair-side buyer" data-lkey="${esc(B.key)}">
      ${window.FBID ? FBID.chip(B) : ""}<div class="side-h">🛒 المشتري <small>(الطالب)</small></div>
      <div class="l-name">${esc(B.name)} ${tierChip(B)} ${B.superHot ? `<span class="l-lvl super">🔥 مهتم جدًا</span>` : `<span class="l-lvl">${LEADS.fires(B.level)} ${LEADS.levelName(B.level)}</span>`}${ownBadgeB(B, u)}</div>
      <div class="pv"><b>${esc(B.want.text)}</b>${B.matchedAct && (B.wants || []).length > 1 ? ` <small class="muted" title="المشتري ده نازل أكتر من طلب — التطابق ده لطلب واحد منهم بالذات">🎯 طلب من ${ar(B.wants.length)} طلبات</small>` : ""}</div>
      ${matchDetails("pair-buyer:" + B.key + "|" + u.id, "نص الطلب ومصادره", `${ev.text ? `<p class="match-source">${OHS(ev.text, 450)}</p>` : ""}<div class="contact">${buyerLinks(B, u)}</div>`)}
      <div class="muted">${B.range ? `💰 ${B.range.min === B.range.max ? "حوالي " + PH.fmtPrice(B.range.min) : PH.fmtPrice(B.range.min) + " – " + PH.fmtPrice(B.range.max)}` : "💰 ميزانيته مش واضحة"} · 🕒 ${relDay(B.last)} · ${B.posts} بوست</div>
      <div class="contact">${telBtns(B)}<button class="btn sm primary" data-pairsend="buyer">📤 ابعتله الوحدة</button></div>
    </div>
    <div class="pair-side seller" data-skey="${esc(S.key)}">
      ${window.FBID ? FBID.chip(S) : ""}<div class="side-h">🏷 البايع <small>(العارض)</small> ${roleBadge(S)}${ownBadgeU(u, S)}</div>
      <div class="l-name">${esc(S.name)}</div>
      <div class="pv"><b>${esc(uLine(u))}</b></div>
      ${matchDetails("pair-seller:" + B.key + "|" + u.id, "نص العرض وروابطه", `<p class="match-source">${OHS(u.text, 450)}</p><div class="contact">${sellerLinks(S, u)}${crmBtn(u.id, S.key)}</div>`)}
      <div class="contact">${telBtns(S)}<button class="btn sm" data-pairsend="seller">📤 كلّمه عن المشتري</button></div>
    </div>
    <div class="pair-why">${matchDetails("pair-why:" + B.key + "|" + u.id, "ليه التطابق ده مناسب؟", `<p>${x.why.map(esc).join(" · ")}</p><div class="pm-cmp pair-cmp">${cmpChips(x)}</div>${ownPair(x)}`)}<span class="pair-acts">${fbBtns(x)}${dealBtn(x)}</span></div>
  </article>`;
}
// ===== 📞 دوّر على أرقام اللي من غير رقم في التطابقات =====
// أول حاجة: أي رقم الشخص كاتبه بنفسه في أي بوست/تعليق عندنا بيتجاب أوتوماتيك (المحرك). اللي لسه من غير رقم: بنفتح بوستاته ونقرا تعليقاته وردوده.
const uKind = (u) => { const L = u.land || {}; return [(UNIT1[u.category] || "وحدة") + (L.type ? " " + L.type : ""), u.rooms ? u.rooms + " غرف" : "", u.finishing || ""].filter(Boolean).join(" · "); };
const uShort = (u) => [u.region, u.areaM2 ? u.areaM2 + " م²" : "", u.price ? PH.fmtPrice(u.price) : ""].filter(Boolean).join(" · ");
const rngTxt = (r) => (r.min === r.max ? PH.fmtPrice(r.min) : PH.fmtPrice(r.min) + " – " + PH.fmtPrice(r.max));
// 🏷 الوحدات اللي ليها مشترين في كارت بايع: كل وحدة + عدد مشتريها + أفضل نسبة (عشان البايع اللي عنده وحدات كتير ما يتلخبطش)

const unitUrlOf = (u) => ((u.kind === "comment" ? u.commentUrl || u.url : u.url) || "");
const unitLnk = (u, label = u.kind === "comment" ? "🔗 التعليق" : "🔗 المنشور") => lnk(unitUrlOf(u), label, "btn sm lnk pg-ulink"); // 🔗 رابط منشور كل وحدة (لو البايع نازل أكتر من وحدة)
const unitNo = (i) => `<i class="pg-un" title="ترتيب الوحدة">${ar(i + 1)}</i>`;
// الصفوف بتاعة وحدة واحدة داخل كارت بايع (c.items مترتّبة وحدة وحدة فهي متجاورة)
const rowsOfUnit = (c, id) => c.items.filter((x) => x.u.id === id);
const buyerWord = (n) => (n === 1 ? "مشتري واحد" : n === 2 ? "مشتريين" : n > 10 ? "مشتري" : "مشترين");
const unitCountHtml = (r) => `<span class="pg-uc">🛒 ${r.n === 1 ? "" : ar(r.n) + " "}${buyerWord(r.n)} · أفضل <b>${ar(r.best)}%</b></span>`;
// صف مصغّر للطرف التاني: السكور + الاسم + التفاصيل (الوحدة أو الطلب) + رقم/رابط — وبيفتح النافذة على نفس التطابق
function pmRow(c, x, rank) {
  const isB = c.side === "B", P = isB ? x.S : x.B, u = x.u, nw = pairIsNew(x);
  const lvl = (isB ? roleBadge(P) + ownBadgeU(u, P)
    : tierChip(P) + (P.superHot ? `<span class="l-lvl super">🔥 مهتم جدًا</span>` : `<span class="l-lvl">${LEADS.fires(P.level)}</span>`) + ownBadgeB(P, u));
  const multiReq = isB && c.items.some((y) => y.B.want.text !== x.B.want.text);
  const det = isB ? uLine(u) + (multiReq ? " ← لطلب «" + x.B.want.text.replace(/^عايز يشتري /, "") + "»" : "") : `${P.want.text.replace(/^عايز يشتري /, "")}${P.range ? " · 💰 " + rngTxt(P.range) : ""}`;
  const ev = isB ? null : buyerEv(P, u), txt = isB ? (u.text || "") : (ev && ev.text) || "";
  const snip = HAS_OWN ? OWNMK.snip(txt, 110) : String(txt).replace(/\s+/g, " ").slice(0, 110);
  const href = primaryUrl(x, isB ? "S" : "B");
  return `<div class="pm-row ${isB ? "seller" : "buyer"}${nw ? " new" : ""}" data-pair="${esc(x.B.key)}|${esc(u.id)}">
    <b class="pm-sc" style="--p:${x.score}">${x.score}%</b>
    <div class="pm-main">
      <div class="pm-top">${rank ? `<i class="pm-rank" title="ترتيب المشتري تحت الوحدة دي">#${ar(rank)}</i>` : ""}<span class="pm-name">${isB ? "🏷" : "🛒"} ${esc(P.name)}</span>${nw ? `<em class="newbadge">جديد</em>` : ""}<small class="pm-time">${relDay(P.last)}</small></div>
      <div class="pm-det">${esc(det)}</div>
      ${matchDetails("group-row:" + c.side + "|" + x.B.key + "|" + u.id, "التفاصيل وأسباب التطابق", `<div class="match-badges">${lvl}</div><div class="pm-cmp">${cmpChips(x)}</div>${snip ? `<p class="match-source">${OHS(snip, 110)}</p>` : ""}${ownPair(x)}`)}
    </div>
    <div class="pm-acts">${telBtns(P)}${isB ? lnk(href, u.kind === "comment" ? "🔗 التعليق" : "🔗 العرض") : buyerLinkList(P, u).filter((l) => !/البروفايل/.test(l.label)).slice(0, 2).map((l) => lnk(l.href, l.label)).join("") || lnk(href, "🔗 الطلب")}</div>
  </div>`;
}
// كارت مشتري ليه أكتر من طلب: بنكتب الطلبات اللي اتطابقت (مش طلب واحد بس)
const reqLine = (c, H) => { const ts = [...new Set(c.items.map((x) => x.B.want.text))]; return ts.length > 1 ? ts.slice(0, 3).map((t) => t.replace(/^عايز يشتري /, "")).join("  ‖  ") : H.want.text; };
function groupCard(c) {
  const H = c.head, isB = c.side === "B", n = c.items.length, SHOW = n <= 5 ? n : 4;
  const word = isB ? (n > 10 ? "بايع" : "بايعين") : (n > 10 ? "مشتري" : "مشترين");
  const st = isB ? null : unitStats(c);
  let rows, more;
  if (isB) {
    rows = `<div class="pm-list">${c.items.slice(0, SHOW).map((x) => pmRow(c, x)).join("")}</div>`;
    more = n > SHOW ? `<button class="pm-more" data-grpopen>＋ ${ar(n - SHOW)} عرض كمان — افتح النافذة وشوف الكل</button>` : "";
  } else { // 🔢 كل وحدة (بالترتيب) وتحتها مشتريها مترتّبين، وعلى كل وحدة وكل مشتري رابط منشوره
    const MAXU = 3, PERU = st.length === 1 ? SHOW : 2;
    rows = `<div class="pg-ublocks">${st.slice(0, MAXU).map((r, i) => {
      const all = rowsOfUnit(c, r.u.id), shown = all.slice(0, PERU);
      return `<div class="pg-ublock"><div class="pg-uhead">${unitNo(i)}<b>${esc(uLine(r.u))}</b>${unitCountHtml(r)}${unitLnk(r.u)}</div>
        <div class="pm-list">${shown.map((x, j) => pmRow(c, x, j + 1)).join("")}</div>
        ${all.length > shown.length ? `<button class="pm-more" data-grpopen>＋ ${ar(all.length - shown.length)} ${all.length - shown.length > 10 ? "مشتري" : "مشترين"} كمان على الوحدة دي</button>` : ""}</div>`;
    }).join("")}</div>`;
    more = st.length > MAXU ? `<button class="pm-more" data-grpopen>＋ ${ar(st.length - MAXU)} ${st.length - MAXU === 1 ? "وحدة تانية" : "وحدات تانية"} ليها مشترين — افتح النافذة وشوف الكل</button>` : "";
  }
  let head;
  if (isB) {
    const ev = buyerEv(H, c.items[0].u);
    head = `<div class="pair-side buyer pg-head">${window.FBID ? FBID.chip(H) : ""}<div class="side-h">🛒 المشتري <small>(الطالب)</small></div>
      <div class="l-name">${esc(H.name)} ${tierChip(H)} ${H.superHot ? `<span class="l-lvl super">🔥 مهتم جدًا</span>` : `<span class="l-lvl">${LEADS.fires(H.level)} ${LEADS.levelName(H.level)}</span>`}${ownBadgeB(H, c.items[0].u)}</div>
      <div class="pv"><b>${esc(reqLine(c, H))}</b></div>
      <div class="pg-fact">${c.items.some((y) => y.B.want.text !== H.want.text) ? "💰 الميزانية بتختلف حسب الطلب" : H.range ? `💰 ${rngTxt(H.range)}` : "💰 ميزانيته مش واضحة"}</div>
      ${ev.text ? matchDetails("group-buyer:" + H.key, "نص الطلب الأصلي", `<p class="match-source">${OHS(ev.text, 450)}</p>`) : ""}
      <div class="muted">🕒 ${relDay(H.last)} · ${ar(H.posts)} بوست</div>
      <div class="contact">${telBtns(H)}${buyerLinks(H, c.items[0].u)}</div></div>`;
  } else {
    const us = st.map((r) => r.u);
    const warnL = (H.rneg || []).find((t) => /^⚠/.test(t));
    head = `<div class="pair-side seller pg-head">${window.FBID ? FBID.chip(H) : ""}<div class="side-h">🏷 البايع <small>(العارض)</small> ${roleBadge(H)}</div>
      <div class="l-name">${esc(H.name)}</div>
      ${warnL ? `<div class="pg-warn">${esc(warnL)}</div>` : ""}
      <div class="pv pg-uh"><b>🏷 ${st.length > 1 ? `${ar(st.length)} وحدات ليها مشترين — كل وحدة وتحتها مشتريها بالترتيب` : "وحدة واحدة ليها مشترين"}</b></div>
      <div class="muted">🕒 ${relDay(H.last)} · إجمالي وحداته المعروضة ${ar(H.units.length)}${st.length < H.units.length ? ` (${ar(st.length)} منها بس ليها مشترين)` : ""}</div>
      <div class="contact">${telBtns(H)}${sellerLinks(H, us[0])}</div></div>`;
  }
  return `<article class="card pair pgroup${c.items.some((x) => justKeys.has(MATCH.pairFbKey(x))) ? " just" : ""}${c.newN ? " hasnew" : ""}" data-grp="${c.side}|${esc(c.key)}">
    <div class="pair-score pg-score" style="--p:${c.best}">${pcount(n, word + " متطابقين")}<b>${c.best}%</b><span>أفضل تطابق</span>${c.newN ? `<em class="newbadge">🆕 ${ar(c.newN)} جديد</em>` : ""}</div>
    ${head}
    <div class="pair-side pg-with"><div class="pg-title">${isB ? "🏷 العروض المناسبة له" : "🛒 مشتريين كل وحدة (بالأقوى الأول)"} <b>${ar(n)}</b></div>
      ${rows}${more}
      <div class="contact"><button class="btn primary sm" data-grpopen>🔍 كل التفاصيل (${ar(n)})</button></div></div>
  </article>`;
}
const CMP_KEYS = ["reg", "money", "area", "rooms", "fin", "lt", "corner"];
function cmpChips(x) {
  const c = x.comps || {};
  const u = x.unk || [];
  return CMP_KEYS.filter((k) => typeof c[k] === "number").map((k) => { const v = c[k], cl = u.includes(k) ? "unk" : v >= 0.8 ? "ok" : v >= 0.5 ? "mid" : "bad"; return `<span class="cmp ${cl}"${cl === "unk" ? ' title="الطلب حدّده والعرض ماكتبهوش — مش متأكدين"' : ""}>${cl === "ok" ? "✔" : cl === "mid" ? "≈" : cl === "unk" ? "❔" : "✖"} ${FB_NAMES[k] || k}${cl === "unk" ? " (مش مكتوب)" : ""}</span>`; }).join("");
}
const wantCols = (B) => { const o = (B.want && B.want.obj) || {}; return { det: String((B.want && B.want.text) || "").replace(/^عايز يشتري /, ""), reg: (o.regions || []).join(" / ") || "—", area: o.area ? "حوالي " + o.area + " م²" : "—", price: B.range ? rngTxt(B.range) : o.budget ? PH.fmtPrice(o.budget) : "—" }; };
const unitCols = (u) => ({ det: uKind(u), reg: u.region || "—", area: u.areaM2 ? u.areaM2 + " م²" : "—", price: u.price ? PH.fmtPrice(u.price) : "—" });
// 📦 كل وحدة في مربع: مشتريها بأرقامهم + رابط البوست/التعليق + كتب إيه + عايز إيه + الميزانية + التطابق
const phonesCell = (P) => { const ph = (P.phones || []).slice(0, 3).map((t) => `<a class="btn sm wa" href="${PH.waLink(t)}" target="_blank" rel="noopener" dir="ltr">💬 ${esc(t)}</a>`).join(""); return ph || telBtns(P) || `<span class="muted">مفيش رقم</span>`; };
function unitBoxes(c, lim = 1e9) {
  const cl = (x, k) => { const v = (x.comps || {})[k]; return typeof v !== "number" ? "" : v >= 0.8 ? "ok" : v >= 0.5 ? "mid" : "bad"; };
  const by = new Map(); for (const x of c.items.slice(0, lim)) { if (!by.has(x.u.id)) by.set(x.u.id, []); by.get(x.u.id).push(x); }
  const stM = new Map(unitStats(c).map((r) => [r.u.id, r]));
  return `<div class="gu-boxes">${[...by.values()].map((arr, i) => {
    const u = arr[0].u, r = stM.get(u.id) || { n: arr.length, best: arr[0].score, u };
    const rows = arr.map((x, j) => {
      const P = x.B, ev = buyerEv(P, u), k = wantCols(P), bl = buyerLinkList(P, u).filter((l) => l.href), snip = String(ev.text || "").replace(/\s+/g, " ").trim().slice(0, 170);
      return `<tr data-pair="${esc(P.key)}|${esc(u.id)}"><td class="gu-n">#${ar(j + 1)}</td>
        <td><b>${esc(P.name)}</b> ${P.superHot ? `<span class="l-lvl super">💎</span>` : `<span class="l-lvl">${LEADS.fires(P.level)}</span>`}<div class="gu-lk">${bl.map((l) => lnk(l.href, l.label)).join("")}</div></td>
        <td class="gu-ph">${phonesCell(P)}</td>
        <td class="${cl(x, "reg")}">${esc(k.det)}${k.reg !== "—" ? `<br><small>📍 ${esc(k.reg)}</small>` : ""}${k.area !== "—" ? `<br><small>📐 ${esc(k.area)}</small>` : ""}</td>
        <td class="gu-tx">${snip ? `«${esc(snip)}»` : `<span class="muted">—</span>`}</td>
        <td class="${cl(x, "money")}">${esc(k.price)}</td>
        <td><b>${x.score}%</b></td></tr>`;
    }).join("");
    return `<section class="gu-box"><div class="gu-h">${unitNo(i)}<b>${esc(uLine(u))}</b>${unitCountHtml(r)}${unitLnk(u)}</div>
      <div class="gtable-wrap"><table class="gtable gu"><thead><tr><th></th><th>المشتري / الرابط</th><th>رقمه</th><th>عايز إيه</th><th>كتب إيه</th><th>الميزانية</th><th>التطابق</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }).join("")}</div>`;
}
function cmpTable(c, lim = 1e9) {
  const isB = c.side === "B", H = c.head;
  const cl = (x, k) => { const v = (x.comps || {})[k]; return typeof v !== "number" ? "" : v >= 0.8 ? "ok" : v >= 0.5 ? "mid" : "bad"; };
  const uniq = (a) => [...new Set(a.filter((v) => v && v !== "—"))].join("، ") || "—";
  const hd = isB ? wantCols(H) : null;
  const row = (x) => { const P = isB ? x.S : x.B, k = isB ? unitCols(x.u) : wantCols(x.B);
    return `<tr data-pair="${esc(x.B.key)}|${esc(x.u.id)}"><td>${primaryUrl(x, isB ? "S" : "B") ? `<a href="${esc(primaryUrl(x, isB ? "S" : "B"))}" target="_blank" rel="noopener" title="افتح المنشور/التعليق"><b>${esc(P.name)}</b> 🔗</a>` : `<b>${esc(P.name)}</b>`}</td><td>${esc(k.det)}</td><td class="${cl(x, "reg")}">${esc(k.reg)}</td><td class="${cl(x, "area")}">${esc(k.area)}</td><td class="${cl(x, "money")}">${esc(k.price)}</td><td><b>${x.score}%</b></td></tr>`; };
  if (!isB) return unitBoxes(c, lim);
  return `<div class="gtable-wrap"><table class="gtable"><thead><tr><th>${isB ? "البايع" : "المشتري"}</th><th>${isB ? "الوحدة" : "بيطلب"}</th><th>المنطقة</th><th>المساحة</th><th>${isB ? "السعر" : "الميزانية"}</th><th>التطابق</th></tr></thead><tbody>
    <tr class="head"><td>🛒 ${esc(H.name)}<br><small>المطلوب</small></td><td>${esc(hd.det)}</td><td>${esc(hd.reg)}</td><td>${esc(hd.area)}</td><td>${esc(hd.price)}</td><td>—</td></tr>
    ${c.items.slice(0, lim).map(row).join("")}</tbody></table></div>`;
}
function gmRow(c, x, rank) {
  const isB = c.side === "B", B = x.B, S = x.S, u = x.u, ev = buyerEv(B, u), nw = pairIsNew(x);
  const main = isB
    ? `<div class="gm-name">🏷 <b>${esc(S.name)}</b> ${S.owner ? `<span class="badge b-owner">مالك</span>` : ""}${ownBadgeU(u, S, true)}${nw ? ` <em class="newbadge">🆕 جديد</em>` : ""}</div>
       <div class="pv"><b>${esc(uLine(u))}</b></div>
       <div class="muted ellip">${OHS(u.text, 170)}</div>`
    : `<div class="gm-name">🛒 <b>${esc(B.name)}</b> ${B.superHot ? `<span class="l-lvl super">💎</span>` : `<span class="l-lvl">${LEADS.fires(B.level)}</span>`}${ownBadgeB(B, u)}${nw ? ` <em class="newbadge">🆕 جديد</em>` : ""}</div>
       <div class="pv"><b>${esc(B.want.text)}</b></div>
       ${ev.text ? `<div class="muted ellip pq">«${OHS(ev.text, 150)}»</div>` : ""}
       <div class="muted">${B.range ? `💰 ${rngTxt(B.range)}` : "💰 ميزانيته مش واضحة"} · 🕒 ${relDay(B.last)} · 🏷 الوحدة: ${esc(uLine(u))}</div>`;
  const acts = isB
    ? `${telBtns(S)}${sellerLinks(S, u)}<button class="btn sm" data-pairsend="seller">📤 كلّمه عن المشتري</button>${crmBtn(u.id, S.key)}`
    : `${telBtns(B)}${buyerLinks(B, u)}${lnk(primaryUrl(x, "S"), "🔗 الوحدة")}<button class="btn sm primary" data-pairsend="buyer">📤 ابعتله الوحدة</button>`;
  return `<div class="gm-row ${isB ? "seller" : "buyer"}${justKeys.has(MATCH.pairFbKey(x)) ? " just" : ""}" data-pair="${esc(B.key)}|${esc(u.id)}">
    <div class="gm-score"><b>${x.score}%</b>${rank ? `<small class="gm-rank" title="ترتيب المشتري تحت الوحدة دي">#${ar(rank)}</small>` : ""}</div>
    <div class="gm-main">${main}<div class="gm-cmp">${cmpChips(x)}</div><div class="muted sm">✔ ${x.why.map(esc).join(" · ")}</div>${ownPair(x)}</div>
    <div class="gm-acts">${acts}<span class="pair-acts">${fbBtns(x)}${dealBtn(x)}</span></div></div>`;
}
function groupMsg(c) {
  const isB = c.side === "B", H = c.head, list = c.items.slice(0, 5);
  const first = (n) => (PH.extractPhones(n).length || /^[a-z0-9._]+$/i.test(n) ? "" : " أستاذ " + n.split(/\s+/)[0]);
  const sign = myName ? "\n" + myName : "";
  if (isB) return `أهلًا${first(H.name)} 👋\nبخصوص اللي بتدور عليه (${H.want.text.replace(/^عايز يشتري /, "")})، عندي ${c.items.length} وحدات مناسبة:\n${list.map((x, i) => `${i + 1}) ${uLine(x.u)}`).join("\n")}\n\nتحب أبعتلك التفاصيل ونحدد معاد معاينة؟${sign}`;
  return `أهلًا${first(H.name)} 👋\nعندي ${c.items.length} عملاء جادين بيدوروا على مواصفات زي وحداتك:\n${list.map((x, i) => `${i + 1}) ${String(x.B.want.text).replace(/^عايز يشتري /, "")}`).join("\n")}\n\nلسه متاحة؟ ينفع نتكلم في التفاصيل ونحدد معاينة؟${sign}`;
}
function groupModalHtml(c) {
  const isB = c.side === "B", H = c.head, n = c.items.length, word = isB ? "بايعين" : "مشترين";
  const newN = c.items.filter(pairIsNew).length, lim = Math.max(grpMax, 1);
  const head = isB
    ? `<div class="grp-head buyer"><div class="side-h">🛒 المشتري <small>(الطالب)</small></div>
        <div class="l-name">${esc(H.name)} ${tierChip(H)} ${H.superHot ? `<span class="l-lvl super">🔥 مهتم جدًا</span>` : `<span class="l-lvl">${LEADS.fires(H.level)} ${LEADS.levelName(H.level)}</span>`}</div>
        <div class="pv"><b>${esc(H.want.text)}</b></div>
        <div class="muted">${H.range ? `💰 ${rngTxt(H.range)}` : "💰 ميزانيته مش واضحة"} · 🕒 ${relDay(H.last)} · ${ar(H.posts)} بوست</div>
        <div class="contact">${telBtns(H)}${buyerLinks(H, c.items[0].u)}<button class="btn sm primary" data-gsendall>📤 ابعتله كل الوحدات (${ar(n)})</button></div></div>`
    : `<div class="grp-head seller"><div class="side-h">🏷 البايع <small>(العارض)</small> ${roleBadge(H)}</div>
        <div class="l-name">${esc(H.name)}</div>
        ${(H.rneg || []).find((t) => /^⚠/.test(t)) ? `<div class="pg-warn">${esc((H.rneg || []).find((t) => /^⚠/.test(t)))}</div>` : ""}
        <div class="pg-uh">${unitStats(c).length > 1 ? `الوحدات اللي ليها مشترين (${ar(unitStats(c).length)}):` : "الوحدة المتطابقة:"}</div>
        <div class="pg-units">${unitStats(c).map((r, i) => `<div class="pv pg-unit">${unitNo(i)}<b>${esc(uLine(r.u))}</b>${unitCountHtml(r)}${unitLnk(r.u)}</div>`).join("")}</div>
        <div class="muted">🕒 ${relDay(H.last)} · إجمالي وحداته المعروضة ${ar(H.units.length)}</div>
        <div class="contact">${telBtns(H)}${sellerLinks(H, c.items[0].u)}<button class="btn sm primary" data-gsendall>📤 كلّمه عن المشترين (${ar(n)})</button></div></div>`;
  return `${head}
    <div class="grp-sum"><span class="pcount-inline"><b>${ar(n)}</b> ${word} متطابقين</span><span>⭐ أفضل تطابق <b>${c.best}%</b></span>${newN ? `<span>🆕 <b>${ar(newN)}</b> جديد</span>` : ""}</div>
    <details class="how"><summary>❓ إزاي التطابق اتحسب؟ <small>(دوس تشوف)</small></summary>
      <div>كل مشتري بيتقارن بكل وحدة عند البايع، وبناخد <b>أنسب وحدة</b> ليه. النسبة من 100 بتتجمع من:
        <b>المنطقة</b> (الأهم) · <b>الميزانية مقابل السعر</b> · <b>المساحة</b> · <b>عدد الغرف</b> · <b>التشطيب</b>.
        العلامات جنب كل مشتري: <span class="cmp ok">✔ مناسب</span> <span class="cmp mid">≈ قريب</span> <span class="cmp bad">✖ مش مناسب</span>.
        حي جنب الحي المطلوب بيوقف عند 69% كحد أقصى، وحي تاني خالص مبيتطابقش. المعلومة الناقصة (مفيش مساحة مثلًا) بتاخد درجة متوسطة، وكل ما المشتري يحدد تفاصيل أكتر النسبة بتبقى أدق.
        لو الوحدة مكتوب فيها «من المالك» بتزيد نقط قليلة. وتقييمك 👍/👎 بيعلّم البرنامج يرتّب أحسن.</div></details>
    <details class="match-details"><summary>عرض جدول المقارنة</summary><div class="match-detail-body">${cmpTable(c, lim)}</div></details>
    ${isB ? `<div class="gm-list">${c.items.slice(0, lim).map((x) => gmRow(c, x)).join("")}</div>` : (() => {
      const shown = c.items.slice(0, lim);
      return unitStats(c).map((r, i) => { const rs = shown.filter((x) => x.u.id === r.u.id); if (!rs.length) return "";
        return `<section class="gm-unit" data-unit="${esc(r.u.id)}"><div class="gm-uh">${unitNo(i)}<div class="gm-uhm"><b>${esc(uLine(r.u))}</b><span class="muted ellip">${esc((r.u.text || "").replace(/\s+/g, " ").slice(0, 150))}</span></div>${unitCountHtml(r)}${unitLnk(r.u)}</div>
          <div class="gm-list">${rs.map((x, j) => gmRow(c, x, j + 1)).join("")}</div></section>`; }).join("");
    })()}
    ${n > lim ? `<button class="btn more" data-gmore>عرض الباقي (${ar(n - lim)} ${isB ? "عرض" : "طلب"})</button>` : ""}
    <div class="mfoot"><span class="muted">اللي بتضغطه (👍/👎 أو ⚡ صفقة بضغطة) بيتسجل على التطابق ده بالظبط — والنافذة بتتحدث لوحدها لما يوصل داتا جديدة.</span><button class="btn" data-gclose>اقفل</button></div>`;
}

function matchEmpty() {
  const reqs = items.filter((p) => p.type === "request"), offs = items.filter((p) => p.type === "offer");
  const buyers = leads.filter((L) => !L.isBroker && L.level >= 1), sellersN = sellers.length;
  const anyMin = pairs.length; // كل التطابقات اللي المحرك طلعها (>=50%)
  const atMin = pairs.filter((x) => x.score >= state.mMin).length; // عدّت حد النسبة الحالي
  const inAreaAtMin = pairs.filter((x) => x.score >= state.mMin && unitInArea(x.u) && leadInArea(x.B)).length;
  const btn = (t, act) => `<button class="btn sm" data-mact="${act}">${t}</button>`; // (من غير onclick جوه الصفحة — الإضافة بتمنعه)
  const lowerBtn = btn("🤝 اعرض كل التطابقات (50%+)", "min50");
  let head, hint = "";
  if (!reqs.length && !buyers.length) { head = "لسه مفيش مشترين أو طلبات"; hint = "البرنامج بيلاقي المشترين من الطلبات ومن تعليقات العروض. اسحب الجروبات وفعّل «⚡ ذكي» في تعليقات فيسبوك عشان يلقط اللي بيسألوا على العروض."; }
  else if (!offs.length && !sellersN) { head = "لسه مفيش عروض أو بايعين"; hint = "التطابق بيوصّل بين مشتري وبايع — محتاج عروض بيع كمان. اسحب جروبات فيها عروض، أو فعّل ماركت بليس."; }
  else if (!anyMin) { head = `عندك ${ar(reqs.length + buyers.length)} طلب/مشتري و ${ar(offs.length + sellersN)} عرض/بايع — بس مفيش تطابق بينهم`; hint = "غالبًا المناطق أو الأنواع مختلفة (مشتري عايز أرض في حي، والعروض في حي تاني). راجع إن مناطقك في الإعدادات واسعة كفاية."; }
  else if (!atMin && state.mMin > 50) { head = `مفيش تطابق فوق ${state.mMin}% — بس فيه ${ar(anyMin)} تطابق أضعف`; hint = lowerBtn; }
  else if (!inAreaAtMin && atMin) { head = `فيه ${ar(atMin)} تطابق بس كلهم برا مناطقك المحددة`; hint = "مناطق التركيز بتخفي اللي بره. وسّعها من ⚙️ الإعدادات ← 📍 منطقتك، أو اعرض المحافظة كلها."; }
  else if (state.mBuyer > 1) { head = "مفيش تطابق مع المشترين الأقوى بس"; hint = btn("اعرض كل المشترين المهتمين", "buyer1"); }
  else if (state.mCat !== "all" || state.mRegion || state.mOwner || state.mPhones || state.mNewOnly) { head = "مفيش تطابق بالفلاتر دي"; hint = btn("🧹 شيل كل الفلاتر", "clear"); }
  else { head = "مفيش تطابقات دلوقتي"; hint = anyMin ? lowerBtn : "لما البرنامج يسحب طلبات وعروض في نفس المناطق هيوصّل بينهم هنا."; }
  return `<div class="empty"><b>${head}</b><div style="margin-top:8px">${hint}</div></div>`;
}

function tierChip(L) {
  if (!L || typeof ROLE === "undefined") return "";
  const T = ROLE.tierBadge(L), why = [...(L.bwhy || []).slice(0, 3), ...(L.bneg || []).slice(0, 2)].join(" • ");
  return `<span class="badge ${T.cls} tier-chip" data-tier="${T.k}" title="${esc(why)}">${T.ic} ${esc(T.t)}${T.sub ? " · " + esc(T.sub) : ""}</span>`;
}

const pcount = (n, w) => `<i class="pcount" title="متطابق مع ${n}"><b>${ar(n)}</b><small>${w || "متطابق مع"}</small></i>`;
