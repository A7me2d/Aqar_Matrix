// Copyright 2026 Alaa Ahmed - Aqar Matrix. All rights reserved.
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const fixtures = require("./fixtures.js");
exports.run = async (alaa, { ses }) => {
  const { BrowserWindow } = require("electron");
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  alaa.mainWin.hide();
  // No external traffic from the test session, even if a new startup task is added later.
  ses.webRequest.onBeforeRequest({ urls: ["https://*/*"] }, (_, cb) => cb({ cancel: true }));
  await alaa.mainWin.webContents.executeJavaScript('alaaApp.call("openDash")');
  let dash;
  for (let i = 0; i < 50 && !dash; i++) {
    for (const t of alaa.tabs.values()) if (t.kind === "dash") dash = t.view.webContents;
    if (!dash) await wait(100);
  }
  assert.ok(dash, "Electron dashboard exists");
  async function ready(wc) {
    for (let i = 0; i < 100; i++) {
      if (await wc.executeJavaScript('typeof renderMatches === "function" && typeof state === "object" && typeof engineInfo === "object" && !!engineInfo.at').catch(() => false)) return;
      await wait(100);
    }
    throw new Error("Dashboard did not initialize: inspect module loading and bootstrap");
  }
  const setup = `(() => { try {
    FBID = { chip: () => '', sec: () => {}, raw: (p) => ({num:p.key === 'fixture-s1' ? '100000000000001' : '100000000000002'}), numOf: r => r.num };
    const data = (${fixtures.toString()})();
    pairs=data.pairs; leads=data.buyers; sellers=data.sellers; leadMeta={}; justKeys=new Set();
    FULL={pairs,leads,sellers,items:[]};
    Object.assign(state,{view:'matches',mMin:50,mCat:'all',mCombo:'all',mTier:'all',mBuyer:1,mRegion:'',mOwner:false,mPhones:false,mOnlyArea:false,mHideDone:true,mNewOnly:false,mq:'',mShown:80,mSort:'best'});
    fastOn=true;grpOn=true;fastF='all';matchSeenAt=Date.now();
    render(); return true;
  } catch(e) { return String(e.stack); } })()`;
  async function check(wc, label) {
    async function captureMode(name) {
      if (!wc.getURL().startsWith("http:")) return;
      const out = path.resolve(__dirname, "../../../output/playwright"); fs.mkdirSync(out, { recursive: true });
      await wc.executeJavaScript(`window.dispatchEvent(new Event('wheel'));window.scrollTo(0,document.getElementById('mList').getBoundingClientRect().top+window.scrollY-100);new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
      fs.writeFileSync(path.join(out, "matches-" + name + ".png"), (await wc.capturePage()).toPNG());
    }
    await ready(wc); assert.equal(await wc.executeJavaScript(setup), true, label + ": fixture renders");
    const result = await wc.executeJavaScript(`(() => ({rows:document.querySelectorAll('#mList .fr').length, offers:document.querySelector('#mList .fr')?.querySelectorAll('.fu').length, id:document.querySelector('.fu-seller-id')?.textContent, groupedDisabled:document.getElementById('mGroup').disabled}))()`);
    assert.equal(result.rows, 2, label + ": both buyers render");
    assert.equal(result.offers, 3, label + ": only three offers previewed");
    assert.ok(result.id.includes("100000000000001"), label + ": seller ID retained");
    assert.equal(result.groupedDisabled, true, label + ": grouped option is inactive during quick mode");
    assert.equal(await wc.executeJavaScript(`document.getElementById('mMin').value='85';document.getElementById('mMin').dispatchEvent(new Event('change'));pairFiltered().length`), 4, label + ": score control filters actual results");
    await wc.executeJavaScript(`document.getElementById('mMin').value='50';document.getElementById('mMin').dispatchEvent(new Event('change'))`);
    await wc.executeJavaScript(`document.querySelector('#mList details').open=true; new Promise(r=>setTimeout(r,80))`);
    assert.equal(await wc.executeJavaScript(`renderMatches(); document.querySelector('#mList details').open`), true, label + ": disclosure survives redraw");
    // Keyboard navigation and summaries must not prepare or open a message.
    const keyboard = await wc.executeJavaScript(`(() => {
      const first=fastCur;const ev=new KeyboardEvent('keydown',{code:'ArrowDown',bubbles:true,cancelable:true});document.body.dispatchEvent(ev);
      const moved=fastCur!==first;
      const summary=document.querySelector('#mList summary');summary.focus();
      const enter=new KeyboardEvent('keydown',{code:'Enter',key:'Enter',bubbles:true,cancelable:true});summary.dispatchEvent(enter);
      return {moved, intercepted:enter.defaultPrevented};
    })()`);
    assert.equal(keyboard.moved, true, label + ": arrow navigation works");
    assert.equal(keyboard.intercepted, false, label + ": summary Enter is not treated as send");
    await wc.executeJavaScript(`document.getElementById('mFast').checked=false;document.getElementById('mFast').dispatchEvent(new Event('change'))`);
    assert.ok(await wc.executeJavaScript(`!!document.querySelector('#mList [data-grp]')`), label + ": grouped mode works");
    await captureMode("grouped");
    await wc.executeJavaScript(`document.querySelector('#mList [data-grpopen]').click()`);
    assert.equal(await wc.executeJavaScript(`document.getElementById('grpModal').hidden`), false, label + ": group dialog opens");
    await wc.executeJavaScript(`closeGroup();document.getElementById('mGroup').checked=false;document.getElementById('mGroup').dispatchEvent(new Event('change'))`);
    assert.equal(await wc.executeJavaScript(`document.querySelectorAll('#mList .pair').length`), 5, label + ": individual mode works");
    await captureMode("individual");
    const exported = await wc.executeJavaScript(`(() => {const original=download;let value='';download=(name,body)=>{value=body};document.getElementById('mExport').click();download=original;return value;})()`);
    assert.equal(exported.split('\r\n').length, 6, label + ": export includes every filtered match");
    await wc.executeJavaScript(`state.mq='no-match-fixture-xyz';renderMatches()`);
    assert.ok(await wc.executeJavaScript(`!!document.querySelector('#mList .empty')`), label + ": empty state works");
    await wc.executeJavaScript(setup);
    console.log("PASS: " + label + " quick/grouped/individual views, filters, seller IDs, disclosure state and keyboard");
  }
  await check(dash, "Electron");
  const remote = await alaa.remote.set({ enabled: true, port: Number(process.env.MATCH_TEST_PORT) });
  assert.ok(remote.running, "isolated localhost server starts");
  const browser = new BrowserWindow({ show: false, width: 1440, height: 1100, webPreferences: { session: ses, contextIsolation: true, backgroundThrottling: false } });
  const errors = [];
  browser.webContents.on("console-message", (event) => { if (event.level === "error" && /ReferenceError|SyntaxError|TypeError/.test(event.message)) errors.push(event.message); });
  await browser.loadURL(`http://127.0.0.1:${remote.port}/d/?t=${encodeURIComponent(remote.code)}#v=matches`);
  await check(browser.webContents, "localhost browser");
  assert.equal(await browser.webContents.executeJavaScript('state.view === "matches" && !document.getElementById("v-matches").hidden'), true, "matching screen is visible");
  const out = path.resolve(__dirname, "../../../output/playwright"); fs.mkdirSync(out, { recursive: true });
  await browser.webContents.executeJavaScript(`window.scrollTo(0,document.getElementById('mFastBar').getBoundingClientRect().top+window.scrollY-25)`);
  await browser.webContents.executeJavaScript('matchExpanded.clear();renderMatches();new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  fs.writeFileSync(path.join(out, "matches-desktop.png"), (await browser.webContents.capturePage()).toPNG());
  browser.setSize(390, 1100); await wait(150);
  await browser.webContents.executeJavaScript(`window.dispatchEvent(new Event('wheel'));window.scrollTo(0,document.getElementById('mList').getBoundingClientRect().top+window.scrollY-100);new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
  const overflow = await browser.webContents.executeJavaScript(`({page:document.documentElement.scrollWidth>innerWidth+2,cards:[...document.querySelectorAll('#mList .fr')].some(el=>el.scrollWidth>el.clientWidth+2)})`);
  assert.equal(overflow.page, false, "mobile page has no horizontal overflow");
  assert.equal(overflow.cards, false, "mobile cards have no horizontal overflow");
  fs.writeFileSync(path.join(out, "matches-mobile.png"), (await browser.webContents.capturePage()).toPNG());
  browser.setSize(1440, 1100);
  await browser.webContents.executeJavaScript(`applySkin(uiSkin,'dark')`);
  await browser.webContents.executeJavaScript(`window.dispatchEvent(new Event('wheel'));window.scrollTo(0,document.getElementById('mList').getBoundingClientRect().top+window.scrollY-100);new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
  await wait(250);
  assert.equal(await browser.webContents.executeJavaScript(`document.documentElement.dataset.mode`), "dark", "dark theme activates");
  fs.writeFileSync(path.join(out, "matches-dark.png"), (await browser.webContents.capturePage()).toPNG());
  assert.deepEqual(errors, [], "no module/runtime errors in browser");
  console.log("PASS: responsive layout and screenshots in output/playwright");
  browser.destroy(); await alaa.remote.set({ enabled: false });
};
