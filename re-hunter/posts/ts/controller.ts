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
  $("moreBtn").addEventListener("click", () => { state.shown += PAGE; render(); });
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
