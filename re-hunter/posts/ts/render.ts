function renderPosts(): void {
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
  else $("list").innerHTML = list.slice(0, state.shown).map((p) => card(p, { sgn: true })).join("");
  if (window.FBID) FBID.sec("posts", $("list"), [{ label: "الطالبين", items: list.filter((p) => p.type === "request") }, { label: "العارضين", items: list.filter((p) => p.type !== "request") }]); // 🆔 نسخ كل الآيديات
  $("moreBtn").hidden = list.length <= state.shown;
  $("moreBtn").textContent = `عرض المزيد (${list.length - state.shown} كمان)`;
}

