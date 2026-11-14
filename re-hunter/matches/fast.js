// Copyright 2026 Alaa Ahmed - Aqar Matrix. All rights reserved.
// Classic scripts share the existing dashboard state; see matches/README.md.

const FAST_N = 3;
const fastMeta = (B) => leadMeta[B.key] || {};
const fastTalked = (B) => { const m = fastMeta(B); return !!(m.talkedAt || REPORT.stageOf(m) !== "new"); }; // «اتكلمت» = علّمتها بإيدك أو المرحلة اتغيّرت من «جديد»
const fastTalkAt = (B) => { const m = fastMeta(B); return m.talkedAt || m.lastMsg || 0; };
// تحديث فوري على الشاشة + حفظ بالدور (عشان ضغطتين ورا بعض على مشتريين مختلفين ما يمسحوش بعض)
function fastSave(key, patch) {
  leadMeta[key] = { ...(leadMeta[key] || {}), ...patch, at: Date.now() };
  fastMetaQ = fastMetaQ.then(() => setLeadMeta(key, patch)).catch((er) => console.warn("fastSave", er));
  return fastMetaQ;
}
function fastRows(list) {
  const m = new Map();
  for (const x of list) { let r = m.get(x.B.key); if (!r) m.set(x.B.key, (r = { B: x.B, xs: [] })); r.xs.push(x); }
  const rows = [];
  for (const r of m.values()) {
    const seen = new Set();
    r.xs = r.xs.sort((a, b) => (b.fb || 0) - (a.fb || 0) || b.score - a.score || (b.u.ts || 0) - (a.u.ts || 0)).filter((x) => !seen.has(x.u.id) && seen.add(x.u.id));
    r.best = r.xs[0].score; r.fb = r.xs.some((x) => x.fb === 1) ? 1 : 0; r.talked = fastTalked(r.B); r.newN = r.xs.filter(pairIsNew).length;
    rows.push(r);
  }
  const tr = (r) => (state.mTier === "all" && state.mCombo === "all" ? tierRank(r.B.btier) : 0); // «الكل»: الأنضف الأول
  rows.sort(state.mSort === "new"
    ? (a, b) => a.talked - b.talked || (b.B.last || 0) - (a.B.last || 0) || b.best - a.best
    : (a, b) => a.talked - b.talked || tr(a) - tr(b) || b.fb - a.fb || b.best - a.best || (b.B.last || 0) - (a.B.last || 0)); // اللي اتكلمت معاهم ينزلوا تحت
  return rows;
}
function fastUnit(r, x, i) {
  const B = r.B, S = x.S, u = x.u, sent = (fastMeta(B).sentU || []).includes(u.id), nw = pairIsNew(x), hasPh = !!(B.phones && B.phones[0]);
  const href = primaryUrl(x, "S");
  const sellerRef = window.FBID ? FBID.raw(S) : null;
  const sellerId = sellerRef ? FBID.numOf(sellerRef) : /^\d{5,}$/.test(String(S.uid || "")) ? String(S.uid) : "";
  return `<div class="fu${sent ? " opened" : ""}${nw ? " new" : ""}" data-pair="${esc(B.key)}|${esc(u.id)}">
    <div class="fu-rank"><i class="fu-k" title="اختصار إرسال العرض: ${ar(i + 1)}">${ar(i + 1)}</i><span class="fu-sc" style="--p:${x.score}"><b>${x.score}%</b><small>تطابق</small></span></div>
    <div class="fu-m">
      <div class="fu-t">${esc(uLine(u))}${nw ? ` <em class="newbadge">🆕 جديد</em>` : ""}</div>
      <div class="fu-l2"><span class="fu-w">البايع: <b>${esc(S.name)}</b></span><span class="muted">${relDay(u.ts)}</span>${sent ? `<span class="match-opened">اتفتح للتواصل</span>` : ""}</div>
      <div class="fu-seller-id muted">آيدي البايع: ${sellerId ? `<bdi dir="ltr">${esc(sellerId)}</bdi>` : "غير متاح"}</div>
      ${matchDetails("unit:" + B.key + "|" + u.id, "أسباب التطابق وتفاصيل العرض", `<div class="fu-cmp">${cmpChips(x)}</div><div class="match-badges">${roleBadge(S)}${ownBadgeU(u, S)}</div>${u.text ? `<p class="match-source">${OHS(u.text, 450)}</p>` : ""}${ownPair(x)}`)}
    </div>
    <div class="fu-a"><button class="btn sm ${sent ? "" : hasPh ? "wa primary" : "primary"}" data-fsend="${esc(u.id)}" title="${hasPh ? "يفتح واتساب برسالة جاهزة من غير رقم القطعة — انت اللي بتدوس إرسال" : "مفيش رقم: بينسخ الرسالة ويفتح الشات/البروفايل"}">${sent ? "✔ اتفتحت — تاني؟" : hasPh ? "💬 ابعتها" : "📋 انسخ وافتح الشات"}</button>${lnk(href, u.kind === "comment" ? "🔗 تعليقه (عرض)" : "🔗 العرض", "btn sm lnk")}</div>
  </div>`;
}
function fastRow(r) {
  const B = r.B, talked = r.talked, tAt = fastTalkAt(B);
  return `<article class="fr${talked ? " talked" : ""}${r.fb ? " fbk" : ""}${B.key === fastCur ? " cur" : ""}" data-fkey="${esc(B.key)}" tabindex="-1">
    <div class="fr-b">
      <div class="match-eyebrow">المشتري${talked ? `<span class="match-opened">اتكلمت معاه</span>` : ""}</div>
      <div class="fr-n"><span class="fr-name">${esc(B.name)}</span>${r.newN ? ` <em class="newbadge">${ar(r.newN)} جديد</em>` : ""}</div>
      ${window.FBID ? `<div class="fr-contact">${FBID.chip(B, { inline: true })}</div>` : ""}
      <div class="fr-w"><b>${esc(reqLine({ items: r.xs }, B))}</b></div>
      <dl class="match-facts"><div><dt>الميزانية</dt><dd>${B.range ? rngTxt(B.range) : "مش محددة"}</dd></div><div><dt>آخر نشاط</dt><dd>${relDay(B.last)}</dd></div></dl>
      ${matchDetails("buyer:" + B.key, "بيانات المشتري وروابطه", `<div class="match-badges">${tierChip(B)}${B.superHot ? `<span class="l-lvl super">مهتم جدًا</span>` : `<span class="l-lvl">${LEADS.levelName(B.level)}</span>`}</div><p class="muted">${B.posts ? ar(B.posts) + " بوست" : ""}${talked && tAt ? " · آخر تواصل " + relDay(tAt) : ""}</p><div class="contact">${telBtns(B)}${buyerLinks(B, r.xs[0].u)}</div>`)}
      <div class="fr-c"><button class="btn sm ${talked ? "" : "primary"}" data-ftalk title="اختصار C">${talked ? "↩ لسه ما كلمتوش" : "✓ اتكلمت معاه"}</button><button class="btn sm" data-fdet title="اختصار D">كل التطابقات (${ar(r.xs.length)})</button></div>
    </div>
    <div class="fr-us"><div class="fr-offers-heading"><b>أنسب العروض</b><span>${ar(Math.min(FAST_N, r.xs.length))} من ${ar(r.xs.length)}</span></div>${r.xs.slice(0, FAST_N).map((x, i) => fastUnit(r, x, i)).join("")}${r.xs.length > FAST_N ? `<button class="pm-more" data-fdet>عرض ${ar(r.xs.length - FAST_N)} قطعة كمان</button>` : ""}</div>
  </article>`;
}
function renderFast(list) {
  const all = fastRows(list), nTalk = all.filter((r) => r.talked).length, rows = fastF === "new" ? all.filter((r) => !r.talked) : all;
  fastRowsNow = rows;
  if (!rows.some((r) => r.B.key === fastCur)) fastCur = rows.length ? rows[0].B.key : ""; // أول صف متحدد من الأول (بيتبعه الكيبورد)
  const bar = $("mFastBar"); bar.hidden = false;
  bar.innerHTML = `<div class="fq-top"><span class="fq-lbl">⚡ العرض السريع</span>
      <button class="tab ${fastF === "new" ? "on" : ""}" data-ffilter="new" title="المشترين اللي لسه ما علّمتش إنك كلمتهم">لسه ما كلمتوش<small>${ar(all.length - nTalk)}</small></button>
      <button class="tab ${fastF === "all" ? "on" : ""}" data-ffilter="all">الكل<small>${ar(all.length)}</small></button>
      <span class="fq-keys muted"><kbd>↑</kbd><kbd>↓</kbd> تنقّل · <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> ابعت القطعة · <kbd>Enter</kbd> ابعت الأولى · <kbd>C</kbd> اتكلمت · <kbd>D</kbd> كل التطابقات</span></div>
    <div class="fq-note muted">الواتساب بيفتح الشات برسالة جاهزة <b>من غير رقم القطعة</b> — مفيش حاجة بتتبعت لوحدها، انت اللي بتدوس إرسال.</div>`;
  $("mCount").textContent = `${all.length} مشتري · ${list.length} مطابقة` + (nTalk ? ` · ✅ ${nTalk} اتكلمت معاهم` : "") + (state.mq ? ` — بحث: «${state.mq}» ` : "");
  if (!rows.length) {
    setMatchList(all.length && fastF === "new" ? `<div class="empty"><b>🎉 كلمت كل المشترين اللي ظاهرين</b><div style="margin-top:8px"><button class="btn sm" data-ffilter="all">اعرض الكل (${ar(all.length)})</button></div></div>` : matchEmpty());
    if (window.FBID) FBID.sec("matches", $("mList"), [{ label: "المشترين", items: all.map((r) => r.B) }]);
    return;
  }
  setMatchList(rows.slice(0, state.mShown).map(fastRow).join("") + (rows.length > state.mShown ? `<button class="btn more" data-mmore>عرض المزيد (${rows.length - state.mShown})</button>` : ""));
  if (window.FBID) FBID.sec("matches", $("mList"), [{ label: "المشترين", items: all.map((r) => r.B) }]);
}
// تحريك التحديد (من غير إعادة رسم): الصف المتحدد عليه .cur
function fastFocus(key, scroll = true) {
  fastCur = key;
  let hit = null;
  for (const el of document.querySelectorAll("#mList .fr")) { const on = el.dataset.fkey === key; el.classList.toggle("cur", on); if (on) hit = el; }
  if (hit && scroll) hit.scrollIntoView({ block: "nearest" });
  return hit;
}
const fastRowOf = (key) => fastRowsNow.find((r) => r.B.key === key);
// 💬 افتح واتساب برسالة القطعة دي (من غير رقم القطعة) — لازم تتنادي مباشرة من الضغطة عشان المتصفح ما يمنعش فتح الشات
async function fastSend(key, uid) {
  const r0 = fastRowOf(key); if (!r0) return;
  const x0 = r0.xs.find((y) => y.u.id === uid); if (!x0) return;
  await copyPlotFile(x0.u, r0.B); // 🖼 صورة ملف القطعة (لو معروفة) قبل ما الشات يفتح
  const r = fastRowOf(key) || r0, x = r.xs.find((y) => y.u.id === uid) || x0;
  sendTo(r.B, pairMsg(x, "buyer", true), true); // true = من غير ما نغيّر مرحلة المشتري (ده بيتحدد بزرار «اتكلمت»)
  const sent = [...new Set([...(fastMeta(r.B).sentU || []), uid])].slice(-60);
  fastSave(r.B.key, { sentU: sent });
  const cur = fastCur; renderFast(pairFiltered()); fastFocus(cur, false);
}
// ✅ اتكلمت / ↩️ لسه ما كلمتوش — وبعدها التحديد بيروح على المشتري اللي بعده (اللي كان تحته بيطلع مكانه)
function fastTalk(key) {
  const r = fastRowOf(key); if (!r) return;
  const st = REPORT.stageOf(fastMeta(r.B)), idx = fastRowsNow.indexOf(r);
  if (r.talked) { // رجّعه «لسه ما كلمتوش»: ينفع بس لو المرحلة لسه «كلمته» أو «جديد»
    if (st !== "new" && st !== "contacted") return toast("المشتري ده في مرحلة «" + (REPORT.STAGES[st] || st) + "» — غيّرها من المتابعة");
    fastSave(key, { talkedAt: 0, ...(st === "contacted" ? { stage: "new" } : {}) });
    fastCur = key;
  } else {
    fastSave(key, { talkedAt: Date.now(), lastMsg: Date.now(), ...(st === "new" ? { stage: "contacted" } : {}) });
    const nx = fastRowsNow[idx + 1] || fastRowsNow[idx - 1]; fastCur = nx ? nx.B.key : key; // اللي بعده (أو اللي قبله لو ده الأخير)
  }
  renderFast(pairFiltered()); fastFocus(fastCur, true);
}
document.addEventListener("click", (e) => {
  const t = e.target;
  if (state.view !== "matches" || !fastOn) return;
  const ff = t.closest("[data-ffilter]");
  if (ff) { fastF = ff.dataset.ffilter === "new" ? "new" : "all"; try { localStorage.setItem("alaaFastF", fastF); } catch {} state.mShown = 40; return renderFast(pairFiltered()); }
  const row = t.closest("#mList .fr"); if (!row) return;
  const key = row.dataset.fkey;
  const sd = t.closest("[data-fsend]"); if (sd) { e.preventDefault(); fastFocus(key, false); return fastSend(key, sd.dataset.fsend); }
  if (t.closest("[data-ftalk]")) { e.preventDefault(); return fastTalk(key); }
  if (t.closest("[data-fdet]")) { e.preventDefault(); fastFocus(key, false); return openGroup("B", key); }
  if (!t.closest("a,button,input,textarea,select,summary,details") && key !== fastCur) fastFocus(key, false); // دوسة على الصف نفسه = تحديده
});
// ⌨️ الكيبورد (مش وانت بتكتب في خانة ولا وفي نافذة مفتوحة). بنستعمل مكان الحرف (code) عشان يشتغل والكيبورد عربي كمان
document.addEventListener("keydown", (e) => {
  if (!fastOn || state.view !== "matches" || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
  const a = document.activeElement; if (a && a.matches && a.matches("input,textarea,select,[contenteditable='true']")) return;
  if (a && a.closest && a.closest("summary")) return;
  if (document.querySelector(".modal:not([hidden])")) return;
  const rows = fastRowsNow; if (!rows.length) return;
  const i = Math.max(0, rows.findIndex((r) => r.B.key === fastCur)), c = e.code || "";
  const go = (n) => { const r = rows[n]; if (!r) return; e.preventDefault(); fastFocus(r.B.key, true); };
  if (c === "ArrowDown" || c === "KeyJ") { if (i >= rows.length - 1 || i >= state.mShown - 1) { if (rows.length > state.mShown) { e.preventDefault(); state.mShown += 40; renderFast(pairFiltered()); fastFocus(rows[i + 1] ? rows[i + 1].B.key : fastCur, true); } return; } return go(i + 1); }
  if (c === "ArrowUp" || c === "KeyK") return go(i - 1);
  if (c === "Home") return go(0);
  const dg = /^(?:Digit|Numpad)([1-9])$/.exec(c);
  if (dg && +dg[1] <= FAST_N) { const x = rows[i].xs[+dg[1] - 1]; if (x) { e.preventDefault(); fastSend(rows[i].B.key, x.u.id); } return; }
  if (c === "Enter" || c === "NumpadEnter") { if (e.target && e.target.closest && e.target.closest("a,button")) return; const x = rows[i].xs[0]; if (x) { e.preventDefault(); fastSend(rows[i].B.key, x.u.id); } return; }
  if (c === "KeyC") { e.preventDefault(); return fastTalk(rows[i].B.key); }
  if (c === "KeyD") { e.preventDefault(); return openGroup("B", rows[i].B.key); }
});

function initFastMatches() {
$("mFast").checked = fastOn;
$("mFast").addEventListener("change", (e) => { fastOn = e.target.checked; try { localStorage.setItem("alaaFastOn", fastOn ? "1" : "0"); } catch {} state.mShown = 40; render(); });
}
