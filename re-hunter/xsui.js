// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🔁 كارت «الأجهزة والأوامر» (الإعدادات) + إشعارات الأوامر اللي بتروح/بتيجي من الجهاز التاني. المنطق في xs.js، والمحرك في background.js.
(() => {
  const $$ = (id) => document.getElementById(id);
  const E = (s) => (typeof esc === "function" ? esc(s) : String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const T = (m) => (typeof toast === "function" ? toast(m) : console.log(m));
  const KEYS = ["devices", "cmds", "cmdAck", "__dev", "__peer", "xsCfg"];
  const X = { devices: {}, cmds: {}, acks: {}, dev: null, peer: { on: false }, cfg: {}, seen: new Set(), seenAck: new Set(), primed: false, built: false };
  const ROLE = { client: "ويندوز", server: "سيرفر / VPS", solo: "جهاز لوحده" };
  const ST = { ok: ["ok", "✅ اتنفذ"], run: ["info", "⏳ بيتنفذ"], wait: ["info", "📨 اتبعت"], queued: ["info", "🕓 للأساسي"], late: ["warn", "⌛ فات (الجهاز كان فاصل)"], err: ["bad", "❌ فشل"], declined: ["warn", "🚫 مرفوض هنا"] };
  const ago = (ms) => { const s = Math.max(0, Math.round(ms / 1e3)); return s < 60 ? s + " ثانية" : s < 3600 ? Math.round(s / 60) + " دقيقة" : Math.round(s / 3600) + " ساعة"; };
  const fmtT = (t) => new Date(t).toLocaleTimeString("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit", second: "2-digit" });

  async function read() {
    const d = await chrome.storage.local.get(KEYS);
    X.devices = d.devices || {}; X.cmds = d.cmds || {}; X.acks = d.cmdAck || {}; X.dev = d.__dev || null; X.peer = d.__peer || { on: false }; X.cfg = d.xsCfg || {};
  }
  const tcfg = () => XS.tcfg(X.cfg.t);
  const nameOf = (id) => (X.devices[id] && X.devices[id].name) || (X.dev && X.dev.id === id ? X.dev.name : "") || id;

  function view() {
    const el = $$("xsPanel"); if (!el) return;
    const now = Date.now(), T0 = tcfg();
    const me = X.dev || { id: "", name: "الجهاز ده" };
    const devs = XS.devList(X.devices, now, T0);
    const solo = !X.peer.on;
    let h = "";
    if (solo) h += `<div class="xs-note">الجهاز ده شغال لوحده (مش مربوط بجهاز تاني). اربطه بالـVPS من صفحة البداية ← «📱 الموبايل والسيرفر» وساعتها أي أمر هتديه هنا هيتنفذ على الاتنين.</div>`;
    else {
      if (X.peer.role === "client" && X.peer.ok === false) h += `<div class="xs-note bad">⚠️ الوصلة بالسيرفر مقطوعة دلوقتي — الجهاز ده بيكمل شغله لوحده وأوامرك بتتنفذ هنا. لو السيرفر وقع هتكمّل منه النشر وتليجرام بعد حوالي دقيقتين، ولما الوصلة ترجع كل حاجة بتتزامن لوحدها.</div>`;
      h += `<div class="xs-devs">` + (devs.length ? devs.map((d) => `<div class="xs-dev ${d.online ? "on" : "off"}"><b>${E(d.name)}</b>
        <span class="chip ${d.online ? "ok" : "bad"}">${d.online ? "🟢 شغال" : "🔴 فاصل من " + ago(now - (X.devices[d.id].beat || 0))}</span>
        <span class="chip info">${E(ROLE[d.role] || d.role || "")}</span>${d.primary ? `<span class="chip warn">⭐ الأساسي (ينشر ويرد على تليجرام)</span>` : d.standby ? `<span class="chip info">🔁 جاهز يكمل مكانه</span>` : ""}${d.id === me.id ? `<span class="chip info">ده الجهاز اللي بتشوف منه</span>` : ""}${d.ver ? `<small class="muted">نسخة ${E(d.ver)}</small>` : ""}</div>`).join("")
        : `<div class="muted">لسه مفيش جهاز بلّغ عن نفسه — ثواني وتظهر.</div>`) + `</div>`;
    }
    $$("xsTop").innerHTML = h;
    const rows = XS.recent(X.cmds, X.acks, X.devices, now, 10, T0);
    $$("xsCmds").innerHTML = solo ? "" : (rows.length ? `<h3 class="skin-sub">آخر الأوامر</h3>` + rows.map((r) => `<div class="xs-cmd"><div><b>${E(r.label)}</b> <small class="muted">من «${E(r.fromName || nameOf(r.from))}» · ${fmtT(r.at)}</small></div>
      <div class="xs-per">${r.per.map((p) => { const s = ST[p.st] || ST.wait; return `<span class="chip ${s[0]}" title="${E(p.note)}">${E(p.name)}: ${s[1]}</span>`; }).join("")}</div></div>`).join("")
      : `<div class="muted" style="margin-top:8px">لسه مفيش أوامر اتبعتت. جرّب «🧪 جرّب الأمر على الجهازين».</div>`);
    const acc = $$("xsAccept"), sol = $$("xsSolo"), nm = $$("xsName");
    if (acc && document.activeElement !== acc) acc.checked = X.cfg.accept !== false;
    if (sol && document.activeElement !== sol) sol.checked = !!X.cfg.solo;
    if (nm && document.activeElement !== nm) nm.value = X.cfg.name || "";
    $$("xsActs").hidden = solo;
  }
  const live = () => $$("v-settings") && !$$("v-settings").hidden;
  let tmr = null;
  function later() { clearTimeout(tmr); tmr = setTimeout(async () => { if (!live()) return; await read(); view(); }, 250); }

  // ===== إشعارات: أمر جه من التاني / التاني نفّذ أمري =====
  function notify(newCmds, newAcks) {
    const me = X.dev && X.dev.id; if (!me) return;
    for (const e of Object.values(X.cmds)) {
      if (!e || !e.id || X.seen.has(e.id)) continue; X.seen.add(e.id);
      if (!X.primed || e.from === me || Date.now() - (e.at || 0) > 60e3) continue;
      T(`📥 جالك أمر من «${e.fromName || nameOf(e.from)}»: ${XS.label(e.type)} — بيتنفذ هنا كمان`);
    }
    for (const [k, a] of Object.entries(X.acks)) {
      const [id, dev] = k.split("|"); const e = X.cmds[id]; const key = k + ":" + (a && a.st);
      if (X.seenAck.has(key)) continue; X.seenAck.add(key);
      if (!X.primed || !e || e.from !== me || dev === me || !a || Date.now() - (a.at || 0) > 60e3) continue;
      if (a.st === "ok") T(`✅ «${nameOf(dev)}» نفّذ: ${XS.label(e.type)}${a.note ? " — " + a.note : ""}`);
      else if (a.st === "err") T(`❌ «${nameOf(dev)}» ماقدرش ينفذ: ${XS.label(e.type)} — ${a.note || ""}`);
    }
  }

  async function init() {
    await read();
    notify(); X.primed = true;
    chrome.storage.onChanged.addListener(async (c, area) => {
      if (!KEYS.some((k) => c[k])) return;
      await read();
      if (c.cmds || c.cmdAck) notify();
      if (live()) later();
    });
    if (!$$("xsPanel")) return;
    $$("xsTake").onclick = async () => { const r = await chrome.runtime.sendMessage({ type: "xsTakeover" }).catch((e) => ({ ok: false, error: String(e.message || e) })); T(r && r.ok ? "⭐ الجهاز ده بقى الأساسي — النشر وتليجرام هيكملوا من هنا" : "❌ " + ((r && r.error) || "ماحصلش")); later(); };
    $$("xsPing").onclick = async () => { const r = await chrome.runtime.sendMessage({ type: "xsPing" }).catch((e) => ({ ok: false, error: String(e.message || e) })); T(r && r.ok ? "🧪 اتبعت الأمر للجهازين — شوف الحالة تحت" : "❌ " + ((r && r.error) || "ماحصلش")); later(); };
    $$("xsAccept").onchange = (e) => chrome.storage.local.set({ xsCfg: { ...X.cfg, accept: e.target.checked } }).then(() => T(e.target.checked ? "✅ الجهاز ده هينفذ أوامر الجهاز التاني" : "⏸ الجهاز ده مش هينفذ أوامر الجهاز التاني"));
    $$("xsSolo").onchange = (e) => chrome.storage.local.set({ xsCfg: { ...X.cfg, solo: e.target.checked } }).then(() => T(e.target.checked ? "⚠️ شغّلت «اشتغل لوحدك» — الجهاز ده هينشر ويرد على تليجرام حتى لو التاني شغال. ارجع وقفله لما التاني يرجع" : "✅ رجع التنسيق مع الجهاز التاني"));
    $$("xsName").onchange = (e) => chrome.storage.local.set({ xsCfg: { ...X.cfg, name: e.target.value.trim().slice(0, 40) } }).then(() => T("✅ الاسم اتحفظ"));
    setInterval(() => { if (live()) later(); }, 5000);
    view();
  }
  window.renderXs = async () => { await read(); view(); };
  window.XSUI = { read: async () => { await read(); return X; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
