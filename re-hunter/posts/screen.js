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
document.addEventListener("click", (event) => {
  const target = event.target;
  if (!target.closest || !target.closest("#v-posts")) return;
  const clear = target.closest("[data-post-clear]");
  if (clear) return resetPostsSearch(clear.dataset.postClear);
  if (target.closest("[data-post-reset]")) return resetPostsSearch();
  if (target.closest("[data-post-filters-open]")) { togglePostsFilters(true); $("filtersBtn").focus(); }
});
