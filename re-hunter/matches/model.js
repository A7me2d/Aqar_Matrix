// Copyright 2026 Alaa Ahmed - Aqar Matrix. All rights reserved.
// Classic scripts share the existing dashboard state; see matches/README.md.

const TIER_TABS = { pure: "✅ مشتري صافي", suspect: "🟡 مشتبه", office: "🏢 مكتب / سمسار", all: "الكل" };
const tierSel = (sel, t) => sel === "all" || (sel === "pure" ? t === "verified" || t === "pure" : t === sel);
const tierRank = (t) => (typeof ROLE !== "undefined" && ROLE.TIERS[t] ? ROLE.TIERS[t].ord : 2);

// 🧪 مستوى التطابق (v10.71.5): t1 صافي↔صافي · t2 مشتري صافي↔مكتب/سمسار · t3 مشتبه↔مكتب/سمسار · t4 مشتري مشتبه↔مالك (جوه «الكل» بس)
const COMBO_TABS = { all: "الكل", t1: "💎 صافي ↔ صافي", t2: "🟢 مشتري صافي ↔ مكتب / سمسار", t3: "🟠 مشتبه ↔ مكتب / سمسار" };
const comboOf = (x) => (typeof ROLE !== "undefined" ? ROLE.comboOf(x.B, x.S) : "t4");
const comboOrd = (x) => (typeof ROLE !== "undefined" ? ROLE.COMBOS[comboOf(x)].ord : 2);
function pairFiltered(ign = {}) {
  const q = qNorm(state.mq);
  return pairs.filter((x) => x.score >= state.mMin &&
    (ign.cat || state.mCat === "all" || x.u.category === state.mCat) &&
    (ign.combo || state.mCombo === "all" || comboOf(x) === state.mCombo) &&
    (ign.tier || state.mCombo !== "all" || tierSel(state.mTier, x.B.btier)) &&
    (state.mBuyer === 4 ? x.B.superHot : x.B.level >= state.mBuyer) &&
    (!state.mRegion || x.u.region === state.mRegion) &&
    (!state.mOwner || x.S.owner) && (!state.mPhones || (x.B.phones.length && x.S.phones.length)) &&
    (!state.mOnlyArea || (unitInArea(x.u) && leadInArea(x.B))) &&
    (!state.mHideDone || (!["won", "lost"].includes(stageOf(x.B)) && !x.u.done)) &&
    (!state.mNewOnly || pairIsNew(x)) &&
    (!q || qOK(q, x.B.name + " " + x.S.name + " " + (x.u.text || "") + " " + (x.u.region || "") + " " + ((x.B.want && x.B.want.text) || ""), [...(x.B.phones || []), ...(x.S.phones || [])], { cats: [x.u.category] })));
}
// 🤝 لو مفيش تطابق ظاهر: نقول السبب بالظبط ونقترح الحل (بدل شاشة فاضية)


// 🆕 جديد = نزل (الوحدة أو طلب المشتري) بعد آخر مرة شفت فيها شاشة التطابق، وفي آخر ٤٨ ساعة
const pairNewAt = (x) => (x._na != null ? x._na : (x._na = Math.max(x.u.ts || 0, (buyerEv(x.B, x.u) || {}).ts || 0)));
const pairIsNew = (x) => { const t = pairNewAt(x); return t > matchSeenAt && t > Date.now() - NEW_WIN; };
function markMatchesSeen() { matchSeenAt = Date.now(); try { localStorage.setItem("alaaMatchSeen", String(matchSeenAt)); } catch {} }
function cardOf(c) {
  if (c.g && c.side === "S") { // 🔢 كارت بايع: الوحدات بالترتيب (الأقوى أول) وتحت كل وحدة مشتريها مترتبين
    const ix = new Map(unitStats(c).map((r, i) => [r.u.id, i]));
    c.items = c.items.slice().sort((a, b) => ix.get(a.u.id) - ix.get(b.u.id) || (b.fb || 0) - (a.fb || 0) || b.score - a.score);
  }
  c.best = Math.max(...c.items.map((x) => x.score)); c.fb = c.items.some((x) => x.fb === 1) ? 1 : 0;
  c.newN = c.items.filter(pairIsNew).length; c.newAt = Math.max(...c.items.map(pairNewAt));
  c.head = c.g ? c.items[0][c.side === "B" ? "B" : "S"] : null;
  return c;
}
// كل طرف (مشتري أو بايع) عنده ٢ متطابقين أو أكتر = كارت واحد؛ كل تطابق في كارت واحد بس (الأكبر الأول)
function matchCards(list) {
  const tr = (c) => Math.min(...c.items.map((x) => tierRank(x.B.btier))); // «الكل»: الأنضف الأول (موثّق ← صافي ← مشتبه ← مكتب)
  const cr = (c) => Math.min(...c.items.map(comboOrd)); // 🧪 صافي↔صافي الأول ← مشتري صافي↔مكتب ← مشتري مشتبه↔مالك ← مشتبه↔مكتب (بعد اللي قيّمته انت)
  const sortFn = state.mSort === "new" ? (a, b) => b.newAt - a.newAt || b.best - a.best : (a, b) => (state.mTier === "all" && state.mCombo === "all" ? tr(a) - tr(b) : 0) || b.fb - a.fb || (state.mCombo === "all" ? cr(a) - cr(b) : 0) || b.best - a.best || b.items.length - a.items.length;
  if (!grpOn) {
    const arr = list.map((x) => cardOf({ g: false, items: [x] }));
    return state.mSort === "new" || state.mCombo === "all" ? arr.sort(sortFn) : arr;
  }
  const mk = (side) => { const m = new Map(); for (const x of list) { const k = x[side].key; let r = m.get(k); if (!r) m.set(k, (r = { side, key: k, pairs: [], best: 0 })); r.pairs.push(x); if (x.score > r.best) r.best = x.score; } return [...m.values()]; };
  const parties = [...mk("B"), ...mk("S")].sort((a, b) => b.pairs.length - a.pairs.length || b.best - a.best || (a.side === "B" ? -1 : 1));
  const taken = new Set(), cards = [];
  for (const P of parties) {
    const mine = P.pairs.filter((x) => !taken.has(x));
    if (mine.length < 2) continue;
    mine.forEach((x) => taken.add(x));
    cards.push(cardOf({ g: true, side: P.side, key: P.key, items: mine.sort((a, b) => (b.fb || 0) - (a.fb || 0) || b.score - a.score) }));
  }
  for (const x of list) if (!taken.has(x)) cards.push(cardOf({ g: false, items: [x] }));
  return cards.sort(sortFn);
}
const pkOf = (p) => p._pk || (p._pk = LEADS.personOfPost(p));
function fastPairs(keep, gone) {
  if (!FULL || !FULL.pairs || !compiledG || !LEADS.personOfPost) return;
  const comp = compiledG, wm = (learnInfo && learnInfo.wm) || null;
  let pr = FULL.pairs.filter((x) => !gone.has(x.u.id));
  const fresh = [...keep.values()].filter((p) => p.sender);
  if (!fresh.length) { FULL.pairs = pr; return; }
  const people = new Set(fresh.map(pkOf));
  const sub = FULL.items.filter((p) => p.sender && people.has(pkOf(p)));
  const okCat = (L) => !L.categories.length || L.categories.some((c) => comp.cats.includes(c));
  const Lp = LEADS.buildLeads(sub, {}, comp, leadMeta).filter((L) => okCat(L));
  const Sp = LEADS.buildSellers(sub, {}, comp, leadMeta).map((S) => ({ ...S, units: S.units.filter((u) => comp.cats.includes(u.category)) })).filter((S) => S.units.length);
  const buyerOk = MATCH.pairBuyerOk, sellerOk = (S) => S.status !== "hidden";
  const nbKeys = new Set(Lp.map((L) => L.key)), nsKeys = new Set(Sp.map((S) => S.key));
  const Bnew = Lp.filter(buyerOk), Snew = Sp.filter(sellerOk);
  const Sall = FULL.sellers.filter((S) => sellerOk(S) && !nsKeys.has(S.key)).concat(Snew);
  const Ball = FULL.leads.filter((L) => buyerOk(L) && !nbKeys.has(L.key)).concat(Bnew);
  const opt = { min: 50, perBuyer: 6, wm };
  const np = MATCH.pairUp(Bnew, Sall, opt).concat(MATCH.pairUp(Ball, Snew, opt));
  const now = Date.now(), seen = new Set(), fp = [];
  for (const x of np) { const k = MATCH.pairFbKey(x); if (seen.has(k)) continue; seen.add(k); fp.push({ ...x, fresh: now }); }
  pr = pr.filter((x) => !nbKeys.has(x.B.key) && !seen.has(MATCH.pairFbKey(x)));
  // أشخاص جداد خالص: يظهروا في قوايم المشترين/البايعين على طول
  const hasL = new Set(FULL.leads.map((L) => L.key)), hasS = new Set(FULL.sellers.map((S) => S.key));
  const addL = Lp.filter((L) => !hasL.has(L.key)), addS = Sp.filter((S) => !hasS.has(S.key));
  if (addL.length) FULL.leads = FULL.leads.concat(addL);
  if (addS.length) FULL.sellers = FULL.sellers.concat(addS);
  // كل مشتري ليه أحسن ٦ بايعين بس
  const per = new Map(), merged = pr.concat(fp).sort((a, b) => b.score - a.score || b.B.score - a.B.score), out = [];
  for (const x of merged) { const n = per.get(x.B.key) || 0; if (n >= 6 * Math.min(3, Math.max(1, (x.B.wants || []).length)) && !x.fb) continue; per.set(x.B.key, n + 1); out.push(x); } // أكتر من طلب = مساحة أكبر (زي pairUp)
  FULL.pairs = out;
}


function unitStats(c) {
  const m = new Map();
  for (const x of c.items) { let r = m.get(x.u.id); if (!r) m.set(x.u.id, (r = { u: x.u, n: 0, best: 0 })); r.n++; if (x.score > r.best) r.best = x.score; }
  return [...m.values()].sort((a, b) => b.best - a.best || b.n - a.n);
}

const FB_NAMES = { reg: "المنطقة", money: "الميزانية/الأوفر", area: "المساحة", rooms: "عدد الغرف", fin: "التشطيب", lt: "نوع الأرض", corner: "الناصية" };
