// Copyright 2026 Alaa Ahmed - Aqar Matrix. All rights reserved.
// node tests/matches/model.test.js
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const fixtures = require("./fixtures.js");
const engine = path.resolve(__dirname, "../../../re-hunter");
const acorn = require(path.join(engine, "acorn.min.js"));
const html = fs.readFileSync(path.join(engine, "dashboard.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
const modules = ["model", "cards", "fast", "controller"].map((n) => "matches/" + n + ".js");
assert.ok(modules.every((m) => scripts.indexOf(m) >= 0 && scripts.indexOf(m) < scripts.indexOf("dashboard.js")));
acorn.parse([...modules, "dashboard.js"].map((f) => fs.readFileSync(path.join(engine, f), "utf8")).join("\n"), { ecmaVersion: "latest" });
const f = fixtures();
const ctx = { console, Date, Map, Set, document: { addEventListener() {} }, window: {},
  state: { mMin: 50, mCat: "all", mCombo: "all", mTier: "all", mBuyer: 1, mHideDone: true, mSort: "best" },
  pairs: f.pairs, leads: f.buyers, sellers: f.sellers, leadMeta: {}, grpOn: true, matchSeenAt: 0, NEW_WIN: 48 * 36e5,
  REPORT: { stageOf: (m) => m?.stage || "new" }, UNIT1: { apartment: "شقة" },
  PH: { fmtPrice: String }, ar: String, buyerEv: (B) => B.acts[0], qNorm: (s) => s || "", qOK: () => true,
  stageOf: () => "new", unitInArea: () => true, leadInArea: () => true };
vm.createContext(ctx);
for (const file of modules.slice(0, 3)) vm.runInContext(fs.readFileSync(path.join(engine, file), "utf8"), ctx, { filename: file });
const run = (s) => vm.runInContext(s, ctx);
assert.equal(run("pairFiltered().length"), 5);
assert.equal(run("state.mMin = 90; pairFiltered().length"), 2);
assert.equal(run("state.mMin = 50; state.mRegion = 'الجزيرة'; pairFiltered().length"), 1);
run("state.mRegion = ''; state.mOnlyArea = true");
assert.equal(run("pairFiltered().length"), 5);
run("state.mOnlyArea = false");
const grouped = run("matchCards(pairFiltered())");
assert.equal(grouped.reduce((n, c) => n + c.items.length, 0), 5);
assert.equal(new Set(grouped.flatMap((c) => c.items.map((x) => x.B.key + "|" + x.u.id))).size, 5);
assert.ok(grouped.some((c) => c.g));
run("grpOn = false");
assert.equal(run("matchCards(pairFiltered()).length"), 5);
const rows = run("fastRows(pairFiltered())");
assert.equal(rows.length, 2);
assert.equal(rows[0].xs.length, 4);
assert.deepEqual(Array.from(rows[0].xs, (x) => x.score), [96, 92, 88, 84]);
ctx.leadMeta[rows[0].B.key] = { stage: "contacted" };
assert.equal(run("fastRows(pairFiltered())[1].talked"), true);
console.log("PASS: script load order, shared declarations, filters, unique grouping, quick sorting and contacted state");
