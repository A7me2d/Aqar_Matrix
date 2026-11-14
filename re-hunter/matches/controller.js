// Copyright 2026 Alaa Ahmed - Aqar Matrix. All rights reserved.
// Classic scripts share the existing dashboard state; see matches/README.md.

const matchExpanded = new Set();
function setMatchList(html) {
  const list = $("mList");
  list.innerHTML = html;
  list.querySelectorAll("details[data-match-detail]").forEach((el) => { el.open = matchExpanded.has(el.dataset.matchDetail); });
}
document.addEventListener("toggle", (e) => {
  const el = e.target;
  if (!el.matches || !el.matches("#mList details[data-match-detail]") || !el.isConnected) return;
  if (el.open) matchExpanded.add(el.dataset.matchDetail); else matchExpanded.delete(el.dataset.matchDetail);
}, true);
function renderMatchSummary() {
  const strong = pairs.filter((x) => x.score >= 70);
  const metric = (n, label) => `<div class="match-metric"><b>${ar(n)}</b><span>${label}</span></div>`;
  $("mKpis").innerHTML = `<div class="match-metrics">${metric(strong.length, "تطابق قوي · ٧٠٪ فأكثر")}${metric(new Set(strong.map((x) => x.B.key)).size, "مشتري ليه عروض مناسبة")}${metric(new Set(strong.map((x) => x.S.key)).size, "بايع ليه مشترين مناسبين")}${metric(new Set(strong.map((x) => x.u.id)).size, "عرض متطابق")}</div>
    <div class="match-kpi-actions"><button type="button" class="btn sm ${state.mOwner ? "on" : ""}" data-mownerk aria-pressed="${state.mOwner}">مع المالك: ${ar(strong.filter((x) => x.S.owner).length)}</button><span class="muted">مهتمين جدًا: ${ar(strong.filter((x) => x.B.superHot).length)}</span><button type="button" class="btn sm ${state.mNewOnly ? "on" : ""}" data-mnewk aria-pressed="${state.mNewOnly}">الجديد: ${ar(strong.filter(pairIsNew).length)}</button><button type="button" class="btn sm" data-mseen>علّم الجديد كمقروء</button></div>`;
}
function renderMatches() {
  $("mGroup").disabled = fastOn;
  $("mClassSummary").textContent = "تصنيف الأطراف: " + (state.mCombo !== "all" ? COMBO_TABS[state.mCombo] : TIER_TABS[state.mTier]);
  { const mi = $("mSearch"); if (mi && mi.value !== (state.mq || "")) mi.value = state.mq || ""; }
  const all = pairFiltered({ cat: true });
  const list = pairFiltered();
  renderMatchSummary();
  { // 🧪 مستوى التطابق: العدّادات بتتحسب من غير فلتر المشتري ومن غير فلتر المستوى نفسه
    const allC = pairFiltered({ tier: true, combo: true }), cc = (k) => allC.filter((x) => comboOf(x) === k).length;
    const nAllC = pairFiltered({ combo: true }).length;
    const CD = { all: ["📋", "الكل", "كل التطابقات (حسب نوع المشتري تحت)"], t1: ["💎", "صافي ↔ صافي", "مشتري صافي مع بايع مالك — أنضف تطابق"], t2: ["🟢", "مشتري صافي ↔ مكتب/سمسار", "المشتري صافي والبايع مشتبه أو مكتب أو سمسار"], t3: ["🟠", "مشتبه ↔ مكتب/سمسار", "المشتري مشتبه أو مكتب والبايع مكتب أو سمسار"] };
    $("mComboTabs").innerHTML = lvlHtml("🧪 مستوى التطابق", "اختار تركيبة المشتري والبايع اللي عايز تشوفها", Object.keys(COMBO_TABS).map((k) => ({ k, ic: CD[k][0], t: CD[k][1], d: CD[k][2], n: k === "all" ? nAllC : cc(k) })), state.mCombo, "mcombo");
  }
  { const allT = pairFiltered({ tier: true, combo: true }), cnt = (k) => allT.filter((x) => tierSel(k, x.B.btier)).length, tOn = (k) => state.mCombo === "all" && state.mTier === k;
    $("mTierTabs").innerHTML = `<span class="tier-lbl">🛒 نوع المشتري</span>` + Object.entries(TIER_TABS).map(([k, v]) => `<button class="tab ${tOn(k) ? "on" : ""}" role="tab" aria-selected="${tOn(k)}" data-mtier="${k}">${v}<small>${cnt(k)}</small></button>`).join("");
    const note = { pure: "مشترين كاتبين طلبهم بأنفسهم من غير أي علامة سمسرة، أو أكدوا على واتساب (💎).", suspect: "مشترين مش واضح هما فعلًا المشتري ولا بيجمعوا عروض لعميل — اتأكد منهم قبل ما تضيّع وقت.", office: "ناس شكلهم مكاتب أو سماسرة أو تجار بيطلبوا بكميات (أو قالوا هما كده) — ظاهرين هنا بس مش في «صافي».", all: "كل المشترين مرتبين: موثّق ← صافي ← مشتبه ← مكتب/سمسار." }[state.mTier] || "";
    const n0 = cnt(state.mTier), others = Object.keys(TIER_TABS).filter((k) => k !== state.mTier && k !== "all" && cnt(k) > 0);
    if (state.mCombo !== "all") { // مستوى مختار: بنشرح معناه، ولو فاضي نقترح المستويات اللي فيها تطابقات
      const C = typeof ROLE !== "undefined" ? ROLE.COMBOS[state.mCombo] : null, allC2 = pairFiltered({ tier: true, combo: true }), c2 = (k) => allC2.filter((x) => comboOf(x) === k).length;
      const oth = Object.keys(COMBO_TABS).filter((k) => k !== "all" && k !== state.mCombo && c2(k) > 0);
      $("mTierNote").innerHTML = `<span class="muted">${esc(C ? C.d : "")} — بيتجاهل فلتر نوع المشتري اللي تحت.</span>` + (!c2(state.mCombo) && oth.length ? ` <b>مفيش هنا دلوقتي —</b> ${oth.map((k) => `<button class="btn sm" data-mcombo="${k}">${COMBO_TABS[k]} (${ar(c2(k))})</button>`).join(" ")}` : "");
    } else $("mTierNote").innerHTML = `<span class="muted">${esc(note)}</span>` + (!n0 && others.length ? ` <b>مفيش هنا دلوقتي —</b> ${others.map((k) => `<button class="btn sm" data-mtier="${k}">${TIER_TABS[k]} (${ar(cnt(k))})</button>`).join(" ")}` : ""); }
  $("mCatTabs").innerHTML = tabsHtml(catsTabs(), state.mCat, "mcat", (k) => k === "all" ? all.length : all.filter((x) => x.u.category === k).length);
  const regs = countBy(pairs.filter((x) => x.score >= state.mMin), (x) => x.u.region);
  $("mRegion").innerHTML = `<option value="">📍 كل المناطق</option>` + [...regs].sort((a, b) => b[1] - a[1]).map(([r, n]) => `<option ${r === state.mRegion ? "selected" : ""} value="${esc(r)}">${esc(r)} (${n})</option>`).join("");
  renderLearn();
  { const fb = $("mFastBar"); if (fb && !fastOn) { fb.hidden = true; fb.textContent = ""; } }
  if (fastOn) { lastCards = null; deepMatchUI(list); renderFast(list); return; } // ⚡ صف لكل مشتري
  const cards = matchCards(list); lastCards = cards;
  const nG = cards.filter((c) => c.g).length, nNew = list.filter(pairIsNew).length;
  $("mCount").textContent = `${list.length} مطابقة` + (grpOn ? ` في ${cards.length} كارت${nG ? ` (${nG} مجمّعين)` : ""}` : "") + (nNew ? ` · 🆕 ${nNew} جديد` : "") + (state.mq ? ` — بحث: «${state.mq}» ` : "");
  deepMatchUI(list);
  if (!list.length) {
    setMatchList(matchEmpty());
    if (window.FBID) FBID.sec("matches", $("mList"), []);
    return;
  }
  setMatchList(cards.slice(0, state.mShown).map((c) => (c.g ? groupCard(c) : pairCard(c.items[0]))).join("") + (cards.length > state.mShown ? `<button class="btn more" data-mmore>عرض المزيد (${cards.length - state.mShown})</button>` : ""));
  if (window.FBID) FBID.sec("matches", $("mList"), [{ label: "المشترين", items: uniqBy(list.map((x) => x.B), (b) => b.key) }, { label: "البايعين", items: uniqBy(list.map((x) => x.S), (s) => s.key) }]);
}
// 🏠 «المالك» في التطابق: تصنيف نص الوحدة (البايع) ونص طلب المشتري + هل الاتنين متفقين (طالب من المالك ⟷ البايع مالك)
let grpFocus = "", grpMax = 40;
function openGroup(side, key, focus) { grpOpen = { side, key }; grpHtml = ""; grpFocus = focus || ""; grpMax = 40; $("grpModal").hidden = false; refreshGroupModal(); }
function closeGroup() { grpOpen = null; grpHtml = ""; $("grpModal").hidden = true; $("grpBody").innerHTML = ""; }
function refreshGroupModal() {
  if (!grpOpen) return;
  const cards = lastCards || matchCards(pairFiltered());
  let c = cards.find((k) => k.g && k.side === grpOpen.side && k.key === grpOpen.key);
  if (!c) { // الكارت اتفك (اتشال تطابق): نعرض اللي فاضل للشخص ده
    const items = pairFiltered().filter((x) => x[grpOpen.side].key === grpOpen.key).sort((a, b) => (b.fb || 0) - (a.fb || 0) || b.score - a.score);
    if (!items.length) { closeGroup(); return toast("مفيش تطابقات تانية للشخص ده"); }
    c = cardOf({ g: true, side: grpOpen.side, key: grpOpen.key, items });
  }
  if (grpFocus) { const i = c.items.findIndex((x) => x.B.key + "|" + x.u.id === grpFocus); if (i >= grpMax) grpMax = i + 10; }
  const html = groupModalHtml(c);
  if (html === grpHtml) return;
  grpHtml = html;
  const sc = $("grpModal"), top = sc.scrollTop;
  $("grpBody").innerHTML = html;
  $("grpTitle").textContent = `🤝 ${c.head.name} — متطابق مع ${ar(c.items.length)} ${c.side === "B" ? "بايعين" : "مشترين"}`;
  sc.scrollTop = top;
  if (grpFocus) { const f = [...$("grpBody").querySelectorAll(".gm-row")].find((r) => r.dataset.pair === grpFocus); grpFocus = ""; if (f) { f.classList.add("focus"); f.scrollIntoView({ block: "center" }); } }
  grpCur = c;
}
document.addEventListener("click", async (e) => {
  const t = e.target;
  const ma = t.closest("[data-mact]");
  if (ma) { // أزرار شاشة «مفيش تطابق»
    const a = ma.dataset.mact;
    if (a === "min50") { state.mMin = 50; $("mMin").value = "50"; }
    else if (a === "buyer1") { state.mBuyer = 1; $("mBuyer").value = "1"; }
    else if (a === "clear") { Object.assign(state, { mMin: 85, mCat: "all", mTier: "all", mCombo: "all", mRegion: "", mBuyer: 1, mOwner: false, mPhones: false, mNewOnly: false, mq: "" }); $("mMin").value = "85"; $("mBuyer").value = "1"; $("mOwner").checked = false; $("mPhones").checked = false; $("mNewOnly").checked = false; }
    state.mShown = 40; return render();
  }
  if (t.closest("[data-mseen]")) { e.stopPropagation(); markMatchesSeen(); render(); return toast("✔ تمام — علّمت الجديد إنك شفته"); }
  const nk = t.closest("[data-mnewk]"); if (nk) { state.mNewOnly = !state.mNewOnly; $("mNewOnly").checked = state.mNewOnly; state.mShown = 40; return render(); }
  if (!$("grpModal").hidden) {
    if (t.id === "grpModal" || t.closest("[data-gclose]")) return closeGroup();
    if (t.closest("[data-gsendall]") && grpCur) return sendTo(grpCur.head, groupMsg(grpCur));
    if (t.closest("[data-gmore]")) { grpMax += 60; grpHtml = ""; return refreshGroupModal(); }
    return;
  }
  const card = t.closest("[data-grp]");
  if (card && !t.closest("a,input,textarea,select,summary,details") && (!t.closest("button") || t.closest("[data-grpopen]"))) { const [side, ...k] = card.dataset.grp.split("|"); const row = t.closest(".pm-row"); openGroup(side, k.join("|"), row ? row.dataset.pair : ""); }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && grpOpen && $("dealModal").hidden) return closeGroup();
  if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[data-grp]")) { e.preventDefault(); const [side, ...k] = e.target.dataset.grp.split("|"); openGroup(side, k.join("|")); }
});
document.addEventListener("visibilitychange", () => { if (document.hidden && state.view === "matches") markMatchesSeen(); });
window.addEventListener("pagehide", () => { if (state.view === "matches") markMatchesSeen(); });

// ⚡ تطابق لحظي: أي طلب/عرض/مشتري/بايع جديد بيتقارن بالقديم فورًا — من غير ما نستنى الحساب الكامل (اللي بيلحقه بعد ثواني ويصحّح)

const fbBtns = (x) => { const r = matchFb[MATCH.pairFbKey(x)]; return `<span class="fb" title="قيّم التطابق: 👍 بيفضّله ويتعلّم منه، 👎 بيخفيه ويتعلّم منه"><button class="fbb ${x.fb === 1 ? "on" : ""}" data-pairfb="1">👍</button><button class="fbb" data-pairfb="-1">👎</button></span>`; };
async function ratePair(x, v) {
  const key = MATCH.pairFbKey(x);
  const { matchFb: m = {} } = await chrome.storage.local.get("matchFb");
  if (m[key] && m[key].v === v) { delete m[key]; toast("اتشال التقييم"); }
  else {
    m[key] = { k: "pair", v, at: Date.now(), updatedAt: Date.now(), comps: x.comps || {}, score: x.base || x.score, adj: !!x.adj, cat: x.u.category, bName: x.B.name, sName: x.S.name, unit: uLine(x.u) };
    toast(v === 1 ? "👍 تمام — هفضّل التطابقات اللي زيها" : "👎 اتشال من التطابقات — وهتعلّم منه");
  }
  await chrome.storage.local.set({ matchFb: m });
  matchFb = m; applyView(); render();
}
function renderLearn() {
  const el = $("mLearn"); if (!el) return;
  const L = learnInfo, hid = Object.entries(matchFb).filter(([, r]) => r && r.k === "pair" && r.v === -1);
  const need = L.n < 8 ? `محتاج ${8 - L.n} تقييم كمان على الأقل` : L.up < 3 ? `محتاج ${3 - L.up} 👍 كمان` : L.dn < 3 ? `محتاج ${3 - L.dn} 👎 كمان` : "";
  const det = Object.entries(L.detail || {}).map(([k, d]) => `${FB_NAMES[k] || k} ${d.m > 1 ? "⬆️" : "⬇️"}×${d.m}`).join(" · ");
  el.innerHTML = `<div class="learn-h"><b>🧠 التعلّم من تقييمك</b> <span class="muted">${L.n ? `اتعلّم من ${L.n} تقييم (👍 ${L.up} · 👎 ${L.dn})` : "قيّم التطابقات بـ 👍/👎 والبرنامج بيتعلّم ويظبط الترتيب — 👎 بيخفي التطابق، 👍 بيفضّله ويرفعه."}</span></div>
    ${L.n ? `<div class="learn-b">${L.on ? `ضبط الميزان تلقائيًا: ${det}` : `لسه ما غيّرتش الميزان — ${need || "تقييماتك لسه ما بينتش فرق واضح بين اللي بتحبه واللي بتكرهه"}`}
      ${hid.length ? ` · <button class="btn sm" data-fbshow>👎 المخفي (${hid.length}) ${state.mShowHid ? "▲" : "▼"}</button>` : ""} · <button class="btn sm danger" data-fbreset title="يمسح كل التقييمات ويرجّع الميزان الأصلي">🧹 صفّر التعلّم</button></div>` : ""}
    ${state.mShowHid && hid.length ? `<div class="learn-hid">${hid.map(([k, r]) => `<div class="hidrow"><span><b>${esc(r.bName || "")}</b> ⟷ <b>${esc(r.sName || "")}</b> · ${esc(r.unit || "")}</span><button class="btn sm" data-fbrestore="${esc(k)}">↩️ رجّعه</button></div>`).join("")}</div>` : ""}`;
}
document.addEventListener("click", async (e) => {
  const t = e.target;
  const fb = t.closest("[data-pairfb]");
  if (fb) { const x = pairByEl(fb); if (x) await ratePair(x, +fb.dataset.pairfb); return; }
  if (t.closest("[data-fbshow]")) { state.mShowHid = !state.mShowHid; return renderLearn(); }
  const rs = t.closest("[data-fbrestore]");
  if (rs) { const { matchFb: m = {} } = await chrome.storage.local.get("matchFb"); delete m[rs.dataset.fbrestore]; await chrome.storage.local.set({ matchFb: m }); matchFb = m; applyView(); render(); return toast("↩️ رجع التطابق"); }
  if (t.closest("[data-fbreset]")) {
    const n = Object.keys(matchFb).length;
    if (!n || !confirm(`تمسح كل التقييمات (${n}) وترجّع الميزان الأصلي؟ التطابقات المخفية هترجع.`)) return;
    await chrome.storage.local.set({ matchFb: {} }); matchFb = {}; applyView(); render(); toast("🧹 اتصفّر التعلّم");
  }
});

// ================= ⚡ صفقة بضغطة + 💼 الصفقات =================
// صفقة = (مشتري + بايع + وحدة). بتتسجل بضغطة من التطابق، وبتتابع مراحلها والعمولة. محفوظة في pipeDeals (متزامنة ومعمولها نسخة احتياطية)

function initMatchControls() {
$("mGroup").checked = grpOn;
$("mGroup").addEventListener("change", (e) => { grpOn = e.target.checked; try { localStorage.setItem("alaaGrpOn", grpOn ? "1" : "0"); } catch {} persistViewPrefs(); state.mShown = 40; render(); });
$("mNewOnly").addEventListener("change", (e) => { state.mNewOnly = e.target.checked; state.mShown = 40; render(); });
$("mSort").addEventListener("change", (e) => { state.mSort = e.target.value; state.mShown = 40; render(); });
$("mSearch").addEventListener("input", (e) => { state.mq = e.target.value; state.mShown = 40; renderSoon(); });
$("mExport").addEventListener("click", () => {
  const list = pairFiltered(); if (!list.length) return toast("مفيش تطابقات تتصدر");
  const q = csvQ;
  const rows = [["التطابق %", "المشتري", "رقم المشتري", "بروفايل المشتري", "عايز إيه", "ميزانيته", "البايع", "مالك؟", "رقم البايع", "بروفايل البايع", "الوحدة", "لينك العرض", "ليه"].join(",")];
  for (const x of list) rows.push([x.score, x.B.name, x.B.phones.map((n) => "'" + n).join(" / "), LEADS.profileLink(x.B), x.B.want.text, x.B.range ? x.B.range.mid : "", x.S.name, x.S.band && typeof ROLE !== "undefined" ? ROLE.sellerBadge(x.S).t.replace(/ ✎/, "") : x.S.owner ? "مالك" : x.S.isBroker ? "سمسار" : "",
    x.S.phones.map((n) => "'" + n).join(" / "), LEADS.profileLink(x.S), uLine(x.u), x.u.url || "", x.why.join(" · ")].map(q).join(","));
  download(`تطابقات_${new Date().toISOString().slice(0, 10)}.csv`, "﻿" + rows.join("\r\n"), "text/csv;charset=utf-8"); toast(`اتصدر ${list.length} تطابق`);
});
  for (const [id, numeric] of [["mMin", true], ["mBuyer", true], ["mRegion", false]]) {
    $(id).addEventListener("change", (e) => { state[id] = numeric ? +e.target.value : e.target.value; state.mShown = 40; render(); });
  }
  for (const id of ["mOwner", "mPhones", "mHideDone"]) {
    $(id).addEventListener("change", (e) => { state[id] = e.target.checked; state.mShown = 40; render(); });
  }

}

document.addEventListener("click", (e) => { if (e.target.closest("[data-mownerk]")) { state.mOwner = !state.mOwner; $("mOwner").checked = state.mOwner; state.mShown = 40; render(); } });
document.addEventListener("click", async (e) => {
  const t = e.target;
  const mt = t.closest("[data-mtier]"); if (mt) { state.mTier = mt.dataset.mtier; state.mCombo = "all"; try { localStorage.setItem("alaaMTier", state.mTier); localStorage.setItem("alaaMCombo", "all"); } catch {} state.mShown = 40; return render(); }
  const mcb = t.closest("[data-mcombo]"); if (mcb) { state.mCombo = ["t1", "t2", "t3"].includes(mcb.dataset.mcombo) ? mcb.dataset.mcombo : "all"; try { localStorage.setItem("alaaMCombo", state.mCombo); } catch {} state.mShown = 40; return render(); }
  const mc = t.closest("[data-mcat]"); if (mc) { state.mCat = mc.dataset.mcat; return render(); }
  const ps = t.closest("[data-pairsend]"); if (ps) { const x = pairByEl(ps); if (x) { if (ps.dataset.pairsend === "buyer") await copyPlotFile(x.u, x.B); return sendTo(ps.dataset.pairsend === "buyer" ? x.B : x.S, pairMsg(x, ps.dataset.pairsend)); } }
  if (t.closest("[data-mmore]")) { state.mShown += 40; return render(); }
  const gq = t.closest("[data-gomq]"); if (gq) { state.mq = gq.dataset.gomq; state.mMin = 50; $("mMin").value = "50"; return render(); }
});
