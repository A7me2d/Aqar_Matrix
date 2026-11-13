// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved. Proprietary & confidential.
// اختبار تكامل: برنامج Electron الحقيقي + فيسبوك مزيّف ← الخلفية → جسر app:fbid → ses.fetch → الكاش.  لينكس: xvfb-run -a node tests/fbid/electron-run.js (بعد npm run sync)
const { _electron: electron } = require("playwright") /* npm i -D playwright */;
const path = require("path");
(async () => {
  const ud = "/tmp/claude-0/elec-ud-" + Date.now();
  const app = await electron.launch({ executablePath: require("electron"), args: ["--no-sandbox", "--user-data-dir=" + ud, path.join(__dirname, "../../app/main.js")],
    env: { ...process.env, ALAA_TEST: "1", ALAA_TEST_SCRIPT: path.join(__dirname, "electron-hook.js"), ALAA_PARTITION: "persist:fbtest" + Date.now() }, timeout: 60000 });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let bg = null;
  for (let i = 0; i < 40 && !bg; i++) { await wait(500); for (const w of app.windows()) { if (/bg\.html/.test(w.url())) bg = w; } }
  console.log("bg window:", !!bg);
  if (!bg) { console.log(app.windows().map((w) => w.url())); await app.close(); return; }
  await wait(2500);
  const has = await bg.evaluate(() => typeof fbidWant + "/" + typeof FBIDCORE + "/" + typeof alaaApp);
  console.log("bg globals:", has);
  const q = await bg.evaluate(async () => { const n = await fbidWant(["alice.smith", "bob.private", "nobody.here"], { urgent: true }); return n; });
  console.log("queued", q);
  await wait(6000);
  const r = await bg.evaluate(async () => { const d = await chrome.storage.local.get(["extractIdCache", "__fbidMiss", "__fbidSt"]); return d; });
  console.log(JSON.stringify(r));
  const hits = await app.evaluate(() => globalThis.__fbHits || []);
  console.log("fake FB hits:", hits);
  await app.close();
})().catch((e) => { console.log("FAIL", e.message.slice(0, 400)); process.exit(1); });
