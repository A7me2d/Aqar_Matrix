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
function filtered(ign: PostsFilterIgnores = {}): PostRecord[] {
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
