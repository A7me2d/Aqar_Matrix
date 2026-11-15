// Runtime compatibility snapshot. Edit posts/ts sources; build:posts regenerates this file.
const BROKERISH = ["broker", "office", "middleman"];
function ownPassF(p, k) {
  const r = ownOf(p);
  if (!r.mention) return false;
  return k === "mention" ? true : k === "owner" ? r.role === "owner" : k === "broker" ? BROKERISH.includes(r.role) : k === "wants" ? r.role === "wants-owner" : k === "unsure" ? ["unsure", "mention"].includes(r.role) : true;
}
const PURS = { all: "الكل", pure: "✅ صافي", suspect: "🟠 مشتبه", office: "🏢🤝 مكتب / سمسار" };
const PUR_LBL = { request: { pure: "مشتري صافي", suspect: "مشتري مشتبه", office: "مكتب / سمسار" }, offer: { pure: "بائع صافي", suspect: "بائع مشتبه", office: "مكتب / سمسار" } };
let purLeads = null, purSellers = null, purMaps = null, purMemo = new WeakMap();
function purOf(p) {
  if (typeof ROLE === "undefined") return "suspect";
  if (purLeads !== leads || purSellers !== sellers || !purMaps) { purLeads = leads; purSellers = sellers; purMaps = { L: new Map(leads.map((L) => [L.key, L])), S: new Map(sellers.map((S) => [S.key, S])) }; purMemo = new WeakMap(); }
  let g = purMemo.get(p);
  if (g) return g;
  const k = PH.personKey({ uid: p.uid, name: p.sender, source: p.source || "wa", text: p.text });
  g = ROLE.postGroup(p, p.type === "offer" ? purMaps.S.get(k) : p.type === "request" ? purMaps.L.get(k) : null);
  purMemo.set(p, g);
  return g;
}
const purChip = (p) => { const k = purOf(p), l = (PUR_LBL[p.type] || PUR_LBL.request)[k], cls = k === "pure" ? "b-owner" : k === "suspect" ? "b-warn" : "b-cat", ic = k === "pure" ? "✅" : k === "suspect" ? "🟠" : "🏢"; return `<span class="badge ${cls} pur-chip" data-purk="${k}" title="${p.type === "offer" ? "تصنيف صاحب العرض (نفس تقدير خانة البايعين)" : "تصنيف صاحب الطلب (نفس تقدير خانة المشترين)"}">${ic} ${l}</span>`; };
function filtered(ign = {}) {
  const q = qNorm(state.q);
  const fresh = state.onlyNew && autoLog ? new Set(autoLog.newIds || []) : null;
  return items.filter((p) =>
    (ign.src || state.src === "all" || p.srcs.includes(state.src)) &&
    (ign.type || state.type === "all" || p.type === state.type) &&
    (ign.cat || state.cat === "all" || p.category === state.cat) &&
    (!state.region || (state.region.startsWith("z:") ? p.zone === state.region.slice(2) : p.region === state.region)) &&
    (!state.onlyBS || inArea(p)) &&
    (!state.group || p.groups.includes(state.group)) &&
    (!state.hideDone || !p.done) &&
    (!state.withPhone || p.phones.length) &&
    (!state.withMatch || (matches.get(p.id) || []).length) &&
    (!state.ownF || ownPassF(p, state.ownF)) &&
    (ign.pur || state.pur === "all" || purOf(p) === state.pur) &&
    (!fresh || fresh.has(p.id)) &&
    (ign.days || !state.postDays || (p.ts || p.scannedAt) >= Date.now() - state.postDays * 864e5) &&
    (!state.onlyDeals || deals.has(p.id)) &&
    (!state.hideDups || !clusters.has(p.id) || clusters.get(p.id).cheapestId === p.id) &&
    (!q || qOK(q, p.text + " " + p.sender + " " + (p.summary || "") + " " + (p.region || ""), p.phones, { cats: [p.category], types: [p.type] })));
}

// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة.
// Posts-screen presentation and search controls. Filtering itself stays in dashboard.js.
function renderPostsOverview(requests) {
  const metrics = [
    [items.length, "كل المنشورات", "total"],
    [requests, "طلبات شراء", "request"],
    [items.length - requests, "عروض بيع", "offer"],
    [items.filter((p) => (matches.get(p.id) || []).length).length, "ليها تطابق", "matched"],
    [items.filter((p) => p.done).length, "خلصتهم", "done"],
  ];
  $("stats").innerHTML = metrics.map(([n, label, kind]) => `<div class="posts-metric ${kind}"><span>${label}</span><b>${ar(n)}</b></div>`).join("");
}
function togglePostsFilters(force) {
  const panel = $("postsAdvancedFilters");
  const open = typeof force === "boolean" ? force : panel.hidden;
  panel.hidden = !open;
  $("filtersBtn").setAttribute("aria-expanded", String(open));
}
function postsChosenFilters() {
  const chosen = [], add = (key, label) => chosen.push({ key, label });
  const optionText = (id) => $(id).selectedOptions[0]?.textContent || "";
  if (state.q) add("q", "بحث: " + state.q);
  if (state.type !== "all") add("type", TYPES[state.type] || state.type);
  if (state.cat !== "all") add("cat", CATS[state.cat] || state.cat);
  if (state.src !== "all") add("src", SRC1[state.src] || state.src);
  if (state.region) add("region", optionText("regionSel"));
  if (state.group) add("group", state.group);
  if (state.postDays !== 60) add("postDays", state.postDays ? "آخر " + ar(state.postDays) + " يوم" : "كل الفترات");
  if (state.pur !== "all") add("pur", "صاحب المنشور: " + (PURS[state.pur] || state.pur));
  if (state.ownF) add("ownF", optionText("ownF"));
  for (const [key, label] of [["onlyDeals", "لقطات بس"], ["hideDups", "من غير مكرر"], ["withPhone", "فيها رقم"], ["withMatch", "ليها مطابقة"], ["onlyNew", "آخر سحب بس"]]) {
    if (state[key]) add(key, label);
  }
  if (!state.hideDone) add("hideDone", "المنتهي ظاهر");
  return chosen;
}
function updatePostsScreen(list) {
  $("countLine").textContent = ar(list.length) + " نتيجة من " + ar(items.length) + " منشور";
  if (document.activeElement !== $("q")) $("q").value = state.q || "";
  $("postDays").value = String(state.postDays);
  $("sortSel").value = state.sort;
  $("ownF").value = state.ownF;
  for (const id of ["onlyDeals", "hideDups", "hideDone", "withPhone", "withMatch", "onlyNew"]) $(id).checked = !!state[id];
  const chosen = postsChosenFilters();
  const chips = $("postsFilterChips");
  chips.hidden = !chosen.length;
  chips.innerHTML = chosen.map(({ key, label }) => `<button type="button" class="posts-filter-chip" data-post-clear="${key}" aria-label="إلغاء فلتر ${esc(label)}"><span>${esc(label)}</span><span aria-hidden="true">×</span></button>`).join("");
  const advancedKeys = new Set(["group", "pur", "ownF", "onlyDeals", "hideDups", "withPhone", "withMatch", "onlyNew", "hideDone"]);
  const count = chosen.filter((x) => advancedKeys.has(x.key)).length + (state.onlyBS ? 1 : 0);
  $("postsActiveCount").hidden = !count;
  $("postsActiveCount").textContent = ar(count);
  document.querySelectorAll("#v-posts [data-post-reset]").forEach((button) => { button.disabled = !chosen.length; });
}
function resetPostsSearch(key) {
  const defaults = { q: "", type: "all", cat: "all", src: "all", region: "", group: "", postDays: 60, pur: "all", ownF: "",
    onlyDeals: false, hideDups: false, withPhone: false, withMatch: false, onlyNew: false, hideDone: true };
  if (key) {
    if (!Object.prototype.hasOwnProperty.call(defaults, key)) return;
    state[key] = defaults[key];
  } else {
    Object.assign(state, defaults, { sort: "new" });
  }
  // The shared working-area preference is intentionally independent of search reset.
  state.shown = PAGE;
  render();
}

// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة.
// Presentation for the posts screen. Existing data-act handlers remain in dashboard.js.
function postCard(p, opts, { more, ms, open, cl, dupOpen }) {
  const text = String(p.text || "");
  const preview = text.length > 240 ? text.slice(0, 240).trimEnd() + "…" : text;
  const specs = [
    p.price ? [p.type === "request" ? "الميزانية" : "السعر", PH.fmtPrice(p.price)] : null,
    p.areaM2 ? ["المساحة", p.areaM2 + " م²"] : p.area ? ["المساحة", p.area] : null,
    p.rooms ? ["الغرف", p.rooms] : null,
  ].filter(Boolean);
  const sources = (p.srcs || []).map((x) => `<span class="post-source">${esc(SRC1[x] || x)}</span>`).join("");
  return `<article class="card sgn post-card${p.done ? " done" : ""} t-${p.type}" data-id="${esc(p.id)}">
    <header class="post-card-head">
      <div class="post-card-heading"><span class="post-kind ${p.type}">${esc(TYPE1[p.type] || "بوست")}</span><h3>${esc(CATS[p.category] || "عقار")}${p.region ? `<span class="post-region">${esc(p.region)}</span>` : ""}</h3>${p.done ? `<span class="post-finished">خلصت</span>` : ""}</div>
      <div class="post-card-meta">${sources}<span class="when">${fmtWhen(p)}</span></div>
    </header>
    ${specs.length ? `<dl class="post-facts">${specs.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>` : ""}
    <div class="post-card-body">${p.summary ? `<p class="post-summary"><span class="post-summary-label">ملخص الإعلان</span>${esc(p.summary)}</p>` : `<p class="post-preview">${OH(preview)}</p>`}</div>
    <div class="post-person"><div class="post-person-name"><span class="post-eyebrow">${p.type === "request" ? "صاحب الطلب" : "صاحب العرض"}</span><b>${esc(p.sender || "الاسم غير متاح")}</b>${purChip(p)}</div><div class="post-person-contact">${window.FBID ? FBID.chip(p, { inline: true }) : ""}</div></div>
    <details class="post-details"><summary>تفاصيل المنشور</summary><div class="post-detail-body">
      <div class="post-classification">${head(p)}${chips(p)}</div>
      ${text ? `<div class="post-original"><span class="post-eyebrow">النص الأصلي</span><div>${OH(text)}</div></div>` : ""}
      ${p.hasOcr ? `<details class="ocrbox"><summary>النص المستخرج من الصورة${p.ocrGain && p.ocrGain.length ? " · " + esc(p.ocrGain.join("، ")) : ""}</summary><div class="ocrtxt">${esc(p.ocr || "")}</div></details>` : ""}
      <div class="post-source-links"><span class="muted">${esc(p.groups[0] || "المصدر غير محدد")}${more}</span>${postLink(p)}</div>
      ${p.phones.length ? `<div class="phones">${phonesHtml(p)}</div>` : ""}
    </div></details>
    <footer class="post-card-footer">
      <div class="post-primary-actions">
        ${ms.length && !opts.hideMatchBtn ? `<button type="button" class="btn sm primary" data-act="matches">${ms.length} ${p.type === "request" ? "عرض مناسب" : "طلب مناسب"} ${open ? "▲" : "▼"}</button>` : ""}
        ${(p.type === "offer" || p.type === "request") && !opts.hideMatchBtn ? `<button type="button" class="btn sm" data-act="toListing">${p.type === "request" ? "هاتلي بايع" : "هاتلي مشتري"}</button>` : ""}
        ${p.type === "request" && (p.phones.length || p.uid) ? `<button type="button" class="btn sm" data-act="tplPost">رد جاهز</button>` : ""}
      </div>
      <details class="post-more-actions"><summary>إجراءات إضافية</summary><div class="post-secondary-actions">
        ${cl ? `<button type="button" class="btn sm" data-act="dups">${cl.count} ناشرين لنفس الوحدة${cl.minPrice ? " · أقل سعر " + PH.fmtPrice(cl.minPrice) : ""} ${dupOpen ? "▲" : "▼"}</button>` : ""}
        ${p.type === "offer" ? crmBtn(p.id) : ""}
        <button type="button" class="btn sm" data-act="fix">تصحيح البيانات</button>
        <button type="button" class="btn sm" data-act="copyText">نسخ النص</button>
        <button type="button" class="btn sm" data-act="done">${p.done ? "رجّعه للقائمة" : "✓ خلصت"}</button>
        <button type="button" class="btn sm danger" data-act="del" aria-label="حذف البوست">حذف</button>
      </div></details>
    </footer>
    ${state.tplFor === "p:" + p.id ? tplMenu("p:" + p.id) : ""}
    ${open && ms.length ? `<div class="mbox">${ms.map(miniMatch).join("")}</div>` : ""}
    ${dupOpen && cl ? `<div class="mbox"><div class="why">نفس الوحدة غالبًا · ${cl.posters} ناشرين${cl.minPrice && cl.maxPrice && cl.minPrice !== cl.maxPrice ? ` · الأسعار من ${PH.fmtPrice(cl.minPrice)} لـ ${PH.fmtPrice(cl.maxPrice)}` : ""}</div>${cl.ids.filter((id) => id !== p.id).map((id) => byId.get(id)).filter(Boolean).sort((a, b) => (a.price || 9e15) - (b.price || 9e15)).map((o) => miniMatch({ id: o.id, score: o.id === cl.cheapestId ? "الأرخص" : o.id === cl.ownerId ? "الأصل؟" : "", why: [o.id === cl.firstId ? "أول واحد نزّلها" : "", o.isBroker === false ? "شكله المالك" : ""].filter(Boolean) })).join("")}</div>` : ""}
  </article>`;
}

function renderPosts() {
  const req = items.filter((p) => p.type === "request").length;
  const pending = Object.values(raw).filter((p) => !p.ai).length;
  renderPostsOverview(req);

  // شريط الذكاء الاصطناعي
  const bar = $("aiBar");
  if (aiCfg.enabled && aiCfg.key) {
    bar.hidden = false;
    if (aiLive(aiStatus)) bar.innerHTML = `🤖 بيحلل... ${aiStatus.done || 0} من ${aiStatus.total || "?"}`;
    else if (aiStatus && aiStatus.error && Date.now() - aiStatus.at < 6e5) bar.innerHTML = `⚠️ التحليل وقف: ${esc(aiStatus.error)} <button class="btn sm" data-ai="run">جرّب تاني</button>`;
    else if (pending) bar.innerHTML = `🤖 فيه ${pending} بوست لسه ما اتحللش بالذكاء الاصطناعي <button class="btn sm" data-ai="run">حلّلهم دلوقتي</button>`;
    else bar.hidden = true;
  } else bar.hidden = true;

  const a = filtered({ src: true }); $("srcTabs").innerHTML = tabsHtml(SRCS, state.src, "src", (k) => k === "all" ? a.length : a.filter((p) => p.srcs.includes(k)).length);
  const b = filtered({ type: true }); $("typeTabs").innerHTML = tabsHtml(TYPES, state.type, "type", (k) => k === "all" ? b.length : b.filter((p) => p.type === k).length);
  const c = filtered({ cat: true }); $("catTabs").innerHTML = tabsHtml(catsTabs(), state.cat, "cat", (k) => k === "all" ? c.length : c.filter((p) => p.category === k).length);
  { const d = filtered({ pur: true }); // 🧪 صافي / مشتبه / مكتب (العدّادات من غير فلتر الصافي نفسه)
    const T0 = state.type, kk = ["all", "pure", "suspect", "office"], cn = (k) => (k === "all" ? d.length : d.filter((p) => purOf(p) === k).length);
    // الطلبات بمستوى المشتري، والعروض بمستوى البايع، والكل: صاحب البوست
    const PL = T0 === "request" ? { all: ["📋", "كل الطلبات", "من غير فرز"], pure: ["✅", "مشتري صافي", "كاتب طلبه بنفسه من غير علامة سمسرة"], suspect: ["🟡", "مشتري مشتبه", "مش واضح هو المشتري ولا بيجمع عروض"], office: ["🏢", "مكتب / سمسار", "تاجر أو مكتب بيطلب (أو قال إنه كده)"] }
      : T0 === "offer" ? { all: ["📋", "كل العروض", "من غير فرز"], pure: ["✅", "بايع صافي (مالك)", "قال إنه المالك أو الأدلة بتقول كده"], suspect: ["🟡", "مالك ولا وسيط؟", "محتاج تأكيد قبل ما تتواصل"], office: ["🏢", "مكتب / سمسار", "سمسار أو مكتب أو وسيط"] }
      : { all: ["📋", "الكل", "طلبات وعروض من غير فرز"], pure: ["✅", "صافي", "مشتري صافي أو بايع مالك"], suspect: ["🟡", "مشتبه", "مشتري مش واضح أو مالك ولا وسيط؟"], office: ["🏢", "مكتب / سمسار", "مكاتب وسماسرة وتجار"] };
    $("purTabs").innerHTML = lvlHtml(T0 === "request" ? "🧪 الطلبات: صافي ولا مشتبه؟" : T0 === "offer" ? "🧪 العروض: صافي ولا مشتبه؟" : "🧪 صاحب الطلب / العرض: صافي ولا مشتبه؟", "دوس على المستوى اللي عايز تشوفه", kk.map((k) => ({ k, ic: PL[k][0], t: PL[k][1], d: PL[k][2], n: cn(k) })), state.pur, "pur");
    const nk = (k) => d.filter((p) => purOf(p) === k).length;
    $("purNote").innerHTML = `<span class="muted">${state.pur === "pure" ? "الطلب: مشتري صافي · العرض: مالك — الأنضف للتواصل." : state.pur === "suspect" ? "مشتري مش واضح هو ولا بيجمع عروض · أو مالك ولا وسيط؟ — اتأكد قبل ما تضيّع وقت." : state.pur === "office" ? "مكاتب وسماسرة وتجار (طلب أو عرض)." : "التصنيف من نفس تقدير خانتي المشترين والبايعين، ومفيش حاجة بتتمسح."}</span>` +
      (state.pur !== "all" && !nk(state.pur) && d.length ? ` <b>مفيش هنا دلوقتي —</b> ${["pure", "suspect", "office"].filter((k) => k !== state.pur && nk(k)).map((k) => `<button class="btn sm" data-pur="${k}">${PURS[k]} (${ar(nk(k))})</button>`).join(" ")}` : ""); }

  const regions = countBy(items, (p) => p.region);
  if (state.region && !state.region.startsWith("z:") && !regions.has(state.region)) state.region = "";
  $("regionSel").innerHTML = `<option value="">📍 كل المناطق (${regions.size})</option>` +
    Object.entries(PH.zones()).map(([k, v]) => `<option ${state.region === "z:" + k ? "selected" : ""} value="z:${k}">${v} (${items.filter((p) => p.zone === k).length})</option>`).join("") +
    [...regions].sort((x, y) => y[1] - x[1]).map(([r, n]) => `<option ${r === state.region ? "selected" : ""} value="${esc(r)}">${esc(r)} (${n})</option>`).join("");
  const groups = [...new Set(items.flatMap((p) => p.groups))].sort();
  if (state.group && !groups.includes(state.group)) state.group = "";
  $("groupSel").innerHTML = `<option value="">👥 كل الجروبات (${groups.length})</option>` +
    groups.map((g) => `<option ${g === state.group ? "selected" : ""} value="${esc(g)}">${esc(g)}</option>`).join("");
  $("onlyNew").checked = state.onlyNew; $("onlyDeals").checked = state.onlyDeals;

  const list = filtered();
  const mc = (p) => (matches.get(p.id) || []).length;
  const sorters = {
    new: (x, y) => tOf(y) - tOf(x), old: (x, y) => tOf(x) - tOf(y),
    priceAsc: (x, y) => (x.price || Infinity) - (y.price || Infinity), priceDesc: (x, y) => (y.price || 0) - (x.price || 0),
    matches: (x, y) => mc(y) - mc(x) || tOf(y) - tOf(x),
    deal: (x, y) => ((deals.get(y.id) || {}).pct || 0) - ((deals.get(x.id) || {}).pct || 0) || tOf(y) - tOf(x),
  };
  list.sort(sorters[state.sort]);
  updatePostsScreen(list);
  const hiddenOld = state.postDays ? filtered({ days: true }).length - list.length : 0;
  $("oldNote").hidden = !hiddenOld;
  $("oldNote").innerHTML = hiddenOld ? `📦 فيه <b>${hiddenOld}</b> طلب/عرض أقدم من ${state.postDays} يوم متخزنين ومستخبيين <button class="btn sm" data-showold>اعرضهم</button>` : "";
  if (!items.length) $("list").innerHTML = `<div class="empty posts-empty"><span class="posts-empty-symbol" aria-hidden="true">▤</span><h3>لسه مفيش طلبات أو عروض</h3><p>البوستات اللي بتسحبها من مصادر العقارات هتظهر هنا، وتقدر تبحث فيها وتراجع تفاصيلها.</p></div>`;
  else if (!list.length) $("list").innerHTML = `<div class="empty posts-empty"><span class="posts-empty-symbol" aria-hidden="true">⌕</span><h3>مفيش منشورات مطابقة للبحث</h3><p>جرّب كلمة تانية، أو وسّع المنطقة والفترة، أو شيل بعض الفلاتر.</p><div><button type="button" class="btn primary" data-post-reset>تصفير البحث</button><button type="button" class="btn" data-post-filters-open>راجع الفلاتر</button></div></div>`;
  AQMPagedViews.set("posts",{listId:"list",items:list,renderItem:(p) => card(p,{sgn:true}),signature:AQMPagedViews.signature(state),emptyHTML:list.length ? "" : $("list").innerHTML});
  if (window.FBID) FBID.sec("posts", $("list"), [{ label: "الطالبين", items: list.filter((p) => p.type === "request") }, { label: "العارضين", items: list.filter((p) => p.type !== "request") }]); // 🆔 نسخ كل الآيديات
  $("moreBtn").hidden = true;
}


function renderPostTool() {
  const el = $("postTool"); if (!el) return;
  $("postJobMsg").textContent = postJob ? (postJob.result ? `✅ آخر سحب: ${postJob.result.people} معلّق من «${postJob.result.author}»` : "⏳ بيسحب في تاب البوست...") : "";
  const posts = Object.values(adPosts).sort((x, y) => y.scrapedAt - x.scrapedAt);
  $("postToolN").textContent = posts.length ? posts.length + " بوست" : "";
  if (!el.open) { $("postToolBody").innerHTML = ""; return; }
  $("postToolBody").innerHTML = posts.length ? `<div class="list">${posts.map((p) => {
      const open = state.open.has("ap:" + p.key);
      return `<article class="card" data-apkey="${esc(p.key)}">
        <div class="c-top"><b>💬 ${esc(p.author || "بوست")}</b><span class="badge b-cat">${p.people.length} معلّق</span><span class="when">${relDay(p.scrapedAt)}</span></div>
        <div class="text">${esc((p.text || "").slice(0, 300))}</div>
        <div class="c-bot"><a class="open-link" href="${esc(p.url)}" target="_blank">🔗 افتح البوست</a><span class="acts">
          <button class="btn sm" data-aptoggle>${open ? "▲ اخفي المعلّقين" : "👥 اعرض المعلّقين"}</button><button class="btn sm primary" data-apcsv>⬇️ المعلّقين Excel</button><button class="btn sm" data-aprerun>🔄 اسحب تاني</button></span></div>
        ${open ? `<div class="tbl-wrap"><table class="learn-t"><tr><th>الاسم</th><th>ID / اليوزر</th><th>التعليق</th><th></th></tr>${p.people.map((c) => {
          const it = c.text ? PH.interest(c.text, compiledG) : { w: 0, tags: [] };
          return `<tr><td><b>${esc(c.name)}</b>${c.reply ? ' <span class="tag-c">رد</span>' : ""}</td><td class="ltr">${esc(c.uid || "—")}</td><td>${esc((c.text || "—").slice(0, 160))}${it.w >= 25 ? ` <span class="chip hot">🔥 ${esc(it.tags.join("، "))}</span>` : ""}</td>
            <td>${c.profileUrl ? `<a class="btn sm" href="${esc(c.profileUrl)}" target="_blank">👤</a>` : ""}</td></tr>`; }).join("")}</table></div>` : ""}
      </article>`; }).join("")}</div>` : `<div class="empty"><b>لسه ما سحبتش تعليقات بوست</b>حط لينك أي بوست فوق ودوس «💬 افتحه واسحب التعليقات».</div>`;
}
function adPostCsv(p) {
  const q = csvQ;
  const rows = [["الاسم", "ID / اليوزر", "لينك البروفايل", "التعليق", "رد؟", "مهتم؟", "البوست"].join(",")]
    .concat(p.people.map((c) => { const it = c.text ? PH.interest(c.text, compiledG) : { w: 0, tags: [] }; return [c.name, c.uid ? "'" + c.uid : "", c.profileUrl, c.text, c.reply ? "رد" : "", it.w >= 25 ? it.tags.join(" · ") || "مهتم" : "", p.url].map(q).join(","); }));
  download(`معلّقين_${(p.author || "بوست").replace(/[\\/:*?"<>|\s]+/g, "-").slice(0, 40)}_${new Date().toISOString().slice(0, 10)}.csv`, "﻿" + rows.join("\r\n"), "text/csv;charset=utf-8");
}

async function startPostJob(url) {
  if (!/^https?:\/\/(www\.|web\.|m\.)?facebook\.com\//i.test(url || "")) return toast("حط لينك بوست فيسبوك صحيح");
  url = url.replace("://m.facebook.com", "://www.facebook.com");
  await chrome.storage.local.set({ postJob: { url, at: Date.now(), done: false } });
  if (WEB) { try { await WEB.openOnServer(url); toast("🖥 السيرفر بيفتح البوست ويسحب التعليقات… ارجع هنا بعد شوية"); } catch (e) { toast("❌ " + e.message); } return; }
  (window.__AQM_KEEP && __AQM_KEEP.openBg ? __AQM_KEEP.openBg(url) : window.open(url, "_blank")); toast("بيسحب التعليقات في الخلفية من غير ما يفتح صفحة قدامك — ارجع هنا بعد شوية");
}

async function handlePostCardAction(act) {
    const id = act.closest(".card").dataset.id;
    const p = byId.get(id);
    if (act.dataset.act === "fix") return openFix(id);
    if (act.dataset.act === "matches") { state.open.has(id) ? state.open.delete(id) : state.open.add(id); return render(); }
    if (act.dataset.act === "toListing") return addSlotFromPost(p, p.type === "request" ? "want" : "offer");
    if (act.dataset.act === "dups") { const k = "d:" + id; state.open.has(k) ? state.open.delete(k) : state.open.add(k); return render(); }
    if (act.dataset.act === "tplPost") { state.tplFor = state.tplFor === "p:" + id ? "" : "p:" + id; return render(); }
    if (act.dataset.act === "copyText") { await copyText(p.text); toast("اتنسخ النص"); }
    if (act.dataset.act === "done") { const r = await chrome.runtime.sendMessage({ type: "phPost", id, op: "done" }).catch(() => null); if (!r || !r.ok) await updatePost(id, (x) => { x.done = !x.done; }); }
    if (act.dataset.act === "del") { const r = await chrome.runtime.sendMessage({ type: "phPost", id, op: "del" }).catch(() => null); if (!r || !r.ok) await updatePost(id, () => null); }
}

function exportPosts() {
  const list = filtered();
  if (!list.length) return toast("مفيش حاجة تتصدر");
  const q = csvQ;
  const head = ["المصدر", "النوع", "التصنيف", "المنطقة", "السعر", "المقدم", "المساحة", "سعر المتر", "الغرف", "الدور", "التشطيب", "الدفع",
    "المجاورة", "رقم القطعة", "الأوفر", "المدفوع", "الباقي", "نوع الأرض", "حالة الأرض", "مميزات",
    "مطابقات", "لقطة %", "مكررة (ناشرين)", "الأرقام", "المرسل", "سمسار؟", "الجروبات", "التاريخ", "خلصت", "الرابط", "ملخص AI", "النص"];
  const rows = [head.join(",")];
  for (const p of list) rows.push([p.srcs.map((x) => SRC1[x]).join(" / "), TYPE1[p.type], CAT1[p.category], p.region || "",
    p.price || "", p.down || "", p.area || "", PH.ppm(p) || "", p.rooms || "", p.floor || "", p.finishing || "", p.payment || "",
    (p.land || {}).mugawra || "", (p.land || {}).plot || "", (p.land || {}).over || "", (p.land || {}).paid || ((p.land || {}).paidPct ? (p.land || {}).paidPct + "%" : ""), (p.land || {}).remaining || "", (p.land || {}).type || "", ((p.land || {}).status || []).join(" / "), ((p.land || {}).features || []).join(" / "),
    (matches.get(p.id) || []).length, (deals.get(p.id) || {}).pct || "", (clusters.get(p.id) || {}).count || "", p.phones.map((n) => "'" + n).join(" / "), p.sender, p.isBroker === true ? "سمسار" : p.isBroker === false ? "مالك" : "",
    p.groups.join(" / "), fmtWhen(p), p.done ? "نعم" : "", p.url || "", p.summary || "", p.text].map(q).join(","));
  const d = new Date();
  download(`طلبات-عقارية_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}.csv`, "﻿" + rows.join("\r\n"), "text/csv;charset=utf-8");
  toast(`اتصدر ${list.length} صف`);
}
// Page events bind once, after the dashboard's state and services initialize.
let postsControlsReady = false;
function initPostsControls() {
  if (postsControlsReady) return;
  const root = document.getElementById("v-posts");
  if (!root) return;
  postsControlsReady = true;
  $("q").addEventListener("input", () => { state.q = $("q").value; state.shown = PAGE; renderSoon(); });
  for (const [id, key] of [["regionSel", "region"], ["groupSel", "group"], ["sortSel", "sort"], ["ownF", "ownF"]]) {
    $(id).addEventListener("change", () => { state[key] = $(id).value; state.shown = PAGE; render(); });
  }
  for (const id of ["onlyDeals", "hideDups", "hideDone", "withPhone", "withMatch", "onlyNew"]) {
    $(id).addEventListener("change", () => { state[id] = $(id).checked; state.shown = PAGE; render(); });
  }
  $("onlyBS").addEventListener("change", () => { state.onlyBS = $("onlyBS").checked; setAreaOn(state.onlyBS); syncAreaBoxes(); state.shown = PAGE; render(); });
  $("postDays").addEventListener("change", () => { state.postDays = Number($("postDays").value); state.shown = PAGE; render(); });
  $("filtersBtn").addEventListener("click", () => togglePostsFilters());
  $("exportBtn").addEventListener("click", exportPosts);
  $("postGo").addEventListener("click", () => startPostJob($("postUrl").value.trim()));
  $("postTool").addEventListener("toggle", renderPostTool);
  root.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target;
    const clear = target.closest("[data-post-clear]");
    if (clear) { event.stopPropagation(); resetPostsSearch(clear.getAttribute("data-post-clear")); return; }
    if (target.closest("[data-post-reset]")) { event.stopPropagation(); resetPostsSearch(); return; }
    if (target.closest("[data-post-filters-open]")) { event.stopPropagation(); togglePostsFilters(true); $("filtersBtn").focus(); return; }
    const filter = target.closest("[data-src],[data-type],[data-cat],[data-pur]");
    if (filter) {
      event.stopPropagation();
      for (const key of ["src", "type", "cat", "pur"]) if (filter.hasAttribute("data-" + key)) state[key] = filter.getAttribute("data-" + key);
      state.shown = PAGE; render(); return;
    }
    if (target.closest("[data-showold]")) { event.stopPropagation(); state.postDays = 0; render(); return; }
    const ad = target.closest("[data-apkey]");
    if (!ad) return;
    const key = ad.getAttribute("data-apkey");
    if (target.closest("[data-aptoggle]")) { event.stopPropagation(); const openKey = "ap:" + key; state.open.has(openKey) ? state.open.delete(openKey) : state.open.add(openKey); renderPostTool(); }
    else if (target.closest("[data-apcsv]")) { event.stopPropagation(); adPostCsv(adPosts[key]); }
    else if (target.closest("[data-aprerun]")) { event.stopPropagation(); startPostJob(adPosts[key].url); }
  });
}


window.AQMPostsPage = { render() { renderPosts(); renderPostTool(); }, init: initPostsControls, card: postCard };
