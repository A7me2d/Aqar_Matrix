// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 📨 لوحة «واتساب الرسمي» (Cloud API) جوه تبويب واتساب — بيانات الحساب، القوالب وموافقة ميتا، رابط الـWebhook، تجربة على رقمك.
// المنطق في wacloud.js، والتنفيذ في background.js (wc*). التوكن بيتخزّن على الجهاز اللي بيبعت بس.
(() => {
  const $$ = (id) => document.getElementById(id);
  const E = (s) => (typeof esc === "function" ? esc(s) : String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const T = (m) => (typeof toast === "function" ? toast(m) : console.log(m));
  const msg = (m) => chrome.runtime.sendMessage(m).catch((e) => ({ ok: false, error: String(e.message || e) }));
  const num = (n) => Number(n || 0).toLocaleString("en-US");
  const C = { v: null, busy: "", out: "", phone: null, res: null, open: true };
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem("wc_" + k) || ""; localStorage.setItem("wc_" + k, v); } catch { return ""; } };
  const ST = { APPROVED: ["ok", "معتمد ✅"], PENDING: ["warn", "مستني موافقة ميتا ⏳"], IN_APPEAL: ["warn", "في استئناف ⏳"], REJECTED: ["bad", "ميتا رفضته ❌"], PAUSED: ["bad", "موقوف مؤقتًا ⏸"], DISABLED: ["bad", "متعطّل ❌"], FLAGGED: ["warn", "تحت المراجعة ⚠️"], MISSING: ["bad", "اتحذف من ميتا"], NONE: ["info", "لسه ما اتبعتش لميتا"] };
  const REASON = { INVALID_FORMAT: "تنسيق النص غلط", ABUSIVE_CONTENT: "محتوى مرفوض", TAG_CONTENT_MISMATCH: "التصنيف مش مناسب للمحتوى (جرّب تسويقي)", PROMOTIONAL: "المحتوى ترويجي ومصنّف خدمي", SCAM: "اشتباه احتيال" };
  const TIER = { TIER_50: 50, TIER_250: 250, TIER_1K: 1000, TIER_10K: 10000, TIER_100K: 100000, TIER_UNLIMITED: "غير محدود" };

  async function load() { const r = await msg({ type: "wcGet" }); if (r && r.ok) C.v = r; window.__wcOn = r && r.ok && r.on ? { gapSec: r.cfg.gapSec, perDay: r.cfg.perDay, ok: Object.fromEntries((r.list || []).map((m) => [m.id, m.st])) } : null; return r; }
  function hookUrl() { const d = (LS("domain") || "").trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, ""); return d ? "https://" + d + "/wa/hook" : ""; }
  const ago = (t) => { const d = Math.max(0, Math.round((Date.now() - t) / 1000)); return d < 60 ? "من " + d + " ثانية" : d < 3600 ? "من " + Math.round(d / 60) + " دقيقة" : d < 86400 ? "من " + Math.round(d / 3600) + " ساعة" : "من " + Math.round(d / 86400) + " يوم"; };
  const cnt = (v) => { const L = v.list || []; const g = (s) => L.filter((m) => m.st === s).length; return { all: L.length, ok: g("APPROVED"), pend: g("PENDING") + g("IN_APPEAL"), rej: g("REJECTED") + g("DISABLED") + g("PAUSED"), none: g("NONE") + g("MISSING") }; };

  function fieldsHtml(v) {
    const c = v.cfg;
    return `<div class="pub-grid">
      <label class="pub-f"><span>Phone number ID (رقم تعريف الرقم)</span><input type="text" dir="ltr" inputmode="numeric" data-wc="phoneId" maxlength="40" value="${E(c.phoneId)}" placeholder="1098765432109876"></label>
      <label class="pub-f"><span>WhatsApp Business Account ID</span><input type="text" dir="ltr" inputmode="numeric" data-wc="wabaId" maxlength="40" value="${E(c.wabaId)}" placeholder="1234567890123456"></label>
      <label class="pub-f wide"><span>Access Token (توكن دائم من System User — بيتخزّن على الجهاز ده بس)</span><input type="text" dir="ltr" autocomplete="off" spellcheck="false" data-wc="token" maxlength="600" value="${E(c.token)}" placeholder="EAAG…"></label>
      <label class="pub-f wide"><span>App Secret (اختياري بس مهم — بيتأكد إن الإشعارات جاية من ميتا فعلًا)</span><input type="text" dir="ltr" autocomplete="off" spellcheck="false" data-wc="appSecret" maxlength="80" value="${E(c.appSecret)}" placeholder="32 حرف من إعدادات التطبيق ← Basic"></label>
      <label class="pub-f"><span>لغة القالب</span><input type="text" dir="ltr" data-wc="lang" maxlength="8" value="${E(c.lang)}"></label>
      <label class="pub-f"><span>تصنيف القالب عند ميتا</span><select data-wc="category"><option value="MARKETING" ${c.category === "MARKETING" ? "selected" : ""}>تسويقي (الأنسب للعروض — أغلى)</option><option value="UTILITY" ${c.category === "UTILITY" ? "selected" : ""}>خدمي (أرخص — ميتا بترفض العروض فيه)</option></select></label>
      <label class="pub-f"><span>الفاصل بين رسالتين (ثانية)</span><input type="number" data-wc="gapSec" min="0.5" max="600" step="any" value="${c.gapSec}"></label>
      <label class="pub-f"><span>سقف اليوم (حسب حدك عند ميتا)</span><input type="number" data-wc="perDay" min="1" max="5000" value="${c.perDay}"></label>
      <label class="pub-f"><span>يستنى قبل ما يرد على الزرار (ثانية — ٠ = فوري)</span><input type="number" data-wc="replyDelay" min="0" max="120" step="any" value="${c.replyDelay}"></label>
      <label class="pub-f"><span>عميل جديد كلّمك الأول (من إعلان مثلًا)</span><select data-wc="welcomeTid"><option value="">ما يردش برسالة ترحيب</option>${(v.list || []).filter((m) => m.buttons > 0).map((m) => `<option value="${E(m.id)}" ${v.welcome === m.id ? "selected" : ""}>ابعتله «${E(m.title || m.body.slice(0, 24))}» بأزرارها (${m.buttons})</option>`).join("")}</select></label>
      <label class="pub-f"><span>لو العميل كتب كلام مش مفهوم</span><select data-wc="menu"><option value="1" ${v.menu !== false ? "selected" : ""}>ابعتله الأزرار كقايمة يدوس منها</option><option value="0" ${v.menu !== false ? "" : "selected"}>ما يبعتش قايمة (الرد النصي بس)</option></select></label></div>`;
  }
  function phoneHtml() {
    const p = C.phone; if (!p) return "";
    if (!p.ok) return `<div class="pub-note bad">❌ ${E(p.note || "ميتا رفضت الطلب")}</div>`;
    const i = p.info || {}, q = { GREEN: "🟢 ممتازة", YELLOW: "🟡 متوسطة", RED: "🔴 ضعيفة" }[i.quality_rating] || i.quality_rating || "—", t = TIER[i.messaging_limit_tier];
    return `<div class="pub-note ok">✅ <b>${E(i.verified_name || "—")}</b> · <bdi dir="ltr">${E(i.display_phone_number || "")}</bdi> · جودة الرقم: ${q} · الحد عند ميتا: ${t ? (typeof t === "number" ? num(t) + " عميل/٢٤ ساعة" : t) : E(i.messaging_limit_tier || "—")}${i.account_mode === "SANDBOX" ? " · ⚠️ حساب تجريبي (Sandbox): بيبعت للأرقام المضافة في لوحة ميتا بس" : ""}</div>`;
  }
  function tplHtml(v) {
    const L = v.list || []; if (!L.length) return `<div class="muted">ضيف رسالة الأول (من قسم «الرسايل» تحت) وبعدين ابعتها لميتا.</div>`;
    return `<div class="wc-tpls">${L.map((m) => {
      const [c, t] = ST[m.st] || ["info", m.st]; const bad = m.issues.filter((x) => x.lvl === "bad"), warn = m.issues.filter((x) => x.lvl === "warn");
      return `<div class="wc-t" data-id="${E(m.id)}"><div class="wc-th"><b>${E(m.title || m.body.slice(0, 30) || "رسالة")}</b> <span class="chip ${c}">${t}</span> <span class="chip info">🔘 ${m.buttons} ${m.buttons === 1 ? "زرار" : "أزرار"}</span>${m.cat ? ` <span class="chip info">${m.cat === "MARKETING" ? "تسويقي" : m.cat === "UTILITY" ? "خدمي" : E(m.cat)}</span>` : ""}</div>
        ${m.reason ? `<div class="pub-note bad">سبب الرفض: ${E(REASON[m.reason] || m.reason)}</div>` : ""}
        ${bad.map((x) => `<div class="pub-note bad">❌ ${E(x.t)}</div>`).join("")}${warn.map((x) => `<div class="pub-note">⚠️ ${E(x.t)}</div>`).join("")}
        <details><summary>👁 شكل القالب عند ميتا</summary><pre class="wc-pre">${E(m.body)}</pre></details></div>`;
    }).join("")}</div>`;
  }
  function resultHtml() {
    if (!C.res) return "";
    return `<div class="wc-res">${C.res.map((r) => `<div class="pub-lr"><span class="chip ${r.ok ? (r.skipped ? "info" : "ok") : "bad"}">${r.ok ? (r.skipped ? "↷ موجود" : "📤 اتبعت") : "❌"}</span> <b>${E(r.title || r.id)}</b> ${r.note ? `<span class="muted">— ${E(r.note)}</span>` : r.status ? `<span class="muted">— ${E((ST[r.status] || [0, r.status])[1])}</span>` : ""}</div>`).join("")}</div>`;
  }

  function paint() {
    const host = $$("wcPanel"); if (!host) return;
    const v = C.v; if (!v || !v.ok) { host.innerHTML = `<div class="pub-h"><div><h3>📨 واتساب الرسمي (أزرار حقيقية)</h3><div class="sub">${v && v.error ? "❌ " + E(v.error) : "بيحمّل…"}</div></div></div>`; return; }
    if (host.contains(document.activeElement) && document.activeElement.matches("input,textarea,select") && host.dataset.painted) return; // ما نقطعش الكتابة
    const n = cnt(v), hu = hookUrl(), dom = LS("domain"), cl = v.cl || {};
    const botChip = !v.reply ? `<span class="chip info">⚪ البوت مقفول (بيسجّل بس)</span>` : v.ready ? `<span class="chip ok">🟢 البوت شغّال — بيرد على ضغطات الأزرار</span>` : `<span class="chip warn">⚠️ البوت مفعّل بس ناقصه بيانات الحساب</span>`;
    const sendChip = v.on ? `<span class="chip ok">📤 الحملة بتتبعت بالـAPI</span>` : `<span class="chip info">📤 الحملة بتتبعت بواتساب ويب</span>`;
    const hookChip = v.hook && v.hook.at ? `<span class="chip ${Date.now() - v.hook.at < 864e5 ? "ok" : "warn"}">📡 آخر إشعار من ميتا ${ago(v.hook.at)}${v.hook.msgs ? " (" + v.hook.msgs + " رسالة)" : ""}</span>` : `<span class="chip warn">📡 ميتا لسه ما بعتتش أي إشعار — راجع خطوة ٣ (Webhook)</span>`;
    host.innerHTML = `<div class="pub-h"><div><h3>🟢 بوت واتساب الـAPI — أزرار رد حقيقية بضغطة واحدة</h3>
        <div class="sub">بوت مستقل عن بوت الأعمال: بيرد على الإشعارات اللي ميتا بتبعتها (Webhook) <b>في نفس اللحظة</b>. العميل بيدوس على زرار حقيقي (من غير ما يكتب) فيوصله الرد المحفوظ فورًا. تقدر تشغّله لوحده أو مع بوت الأعمال. بيحتاج برنامج الويندوز أو السيرفر عشان يستقبل الإشعارات.</div></div>
        <div class="row-actions">${botChip}<button class="btn ${v.reply ? "danger" : "primary"}" id="wcBot">${v.reply ? "⏸ قفّل البوت" : "▶ شغّل البوت"}</button></div></div>
      <div class="pub-chips">${hookChip}${v.queued ? `<span class="chip info">⏳ ${v.queued} رد مستني</span>` : ""}${sendChip}<button class="btn sm" id="wcToggle" ${!v.ready && !v.on ? "disabled title=\"اكتب الـPhone number ID والتوكن واحفظ الأول\"" : ""}>${v.on ? "⏸ ابعت الحملة بواتساب ويب" : "▶ ابعت الحملة بالـAPI"}</button></div>
      <details ${C.open ? "open" : ""} id="wcDet"><summary><b>⚙️ الإعداد والقوالب</b> <span class="muted">— ${n.ok}/${n.all} قالب معتمد${n.pend ? " · " + n.pend + " مستني" : ""}${n.rej ? " · " + n.rej + " مرفوض" : ""}</span></summary>
        <div class="wc-step"><b>١) بيانات الحساب</b> <span class="muted">من Meta for Developers ← تطبيقك ← WhatsApp ← API Setup</span></div>
        ${fieldsHtml(v)}
        <div class="row-actions"><button class="btn primary" id="wcSave">💾 احفظ</button><button class="btn" id="wcPhone">🔌 اختبر الاتصال</button></div>${phoneHtml()}
        <div class="wc-step"><b>٢) القوالب</b> <span class="muted">أول رسالة لعميل جديد لازم تبقى قالب معتمد. ميتا بتراجعه (دقايق لحد يوم). لو غيّرت نص الرسالة أو أزرارها بيتعمل قالب جديد ومحتاج موافقة تانية.</span></div>
        <div class="row-actions"><button class="btn primary" id="wcSubmit">📤 ابعت القوالب لميتا</button><button class="btn" id="wcSync">🔄 حدّث حالة الموافقة</button>${C.busy ? `<span class="chip warn">⏳ ${E(C.busy)}</span>` : ""}</div>
        ${C.out ? `<div class="pub-note ${/^❌/.test(C.out) ? "bad" : ""}">${E(C.out)}</div>` : ""}${resultHtml()}${tplHtml(v)}
        <div class="wc-step"><b>٣) الرد على الأزرار (Webhook)</b> <span class="muted">${v.app ? "" : "⚠️ ده بيحتاج برنامج الويندوز أو السيرفر (VPS) — الإضافة لوحدها مش بتستقبل إشعارات."}</span></div>
        <div class="pub-note">ميتا بتبعت الإشعار لرابط <b>HTTPS عام</b>. على السيرفر: شغّل «الموبايل والسيرفر» وحط قدامه دومين بـHTTPS (Nginx/Caddy أو Cloudflare Tunnel) يوصّل للبورت اللي في البرنامج. بعدها في لوحة ميتا ← WhatsApp ← Configuration ← Webhook: حط الرابط وكود التحقق واشترك في حقل <code>messages</code>.</div>
        <div class="pub-grid"><label class="pub-f"><span>دومين السيرفر (من غير https://)</span><input type="text" dir="ltr" id="wcDomain" value="${E(dom)}" placeholder="deals.example.com"></label>
          <label class="pub-f"><span>رابط الـWebhook (Callback URL)</span><input type="text" dir="ltr" readonly id="wcHookUrl" value="${E(hu)}" placeholder="اكتب الدومين الأول"></label>
          <label class="pub-f"><span>كود التحقق (Verify token)</span><input type="text" dir="ltr" readonly id="wcVerify" value="${E(v.cfg.verify)}"></label></div>
        <div class="row-actions"><button class="btn sm" id="wcCopyUrl">📋 انسخ الرابط</button><button class="btn sm" id="wcCopyVer">📋 انسخ كود التحقق</button></div>
        ${!v.has.secret ? `<div class="pub-note">⚠️ من غير App Secret أي حد يعرف الرابط يقدر يبعت إشعارات مزيّفة. اكتبه فوق.</div>` : ""}
        <div class="wc-step"><b>٤) جرّب على رقمك</b> <span class="muted">بيبعت القالب لرقمك بالأزرار — دوس على زرار من موبايلك وشوف الرد التلقائي.</span></div>
        <div class="row-actions"><input type="text" dir="ltr" inputmode="tel" id="wcTestNum" maxlength="20" placeholder="010xxxxxxxx" value="${E(LS("test"))}"><select id="wcTestTpl">${(v.list || []).filter((m) => m.st === "APPROVED").map((m) => `<option value="${E(m.id)}">${E(m.title || m.body.slice(0, 24))}</option>`).join("") || `<option value="">مفيش قالب معتمد لسه</option>`}</select><button class="btn" id="wcTest" ${n.ok ? "" : "disabled"}>📲 جرّب على رقمي</button></div>
        <div class="wc-step"><b>التكلفة والحدود</b></div>
        <div class="pub-note">• ميتا بتحاسب على <b>كل رسالة قالب اتسلّمت</b> حسب التصنيف والدولة (جدول أسعار ميتا هو المرجع). تقدير <b>غير رسمي</b> لمصر: تسويقي ≈ $${v.estimate.MARKETING} لكل ١٠٠٠ رسالة، وخدمي ≈ $${v.estimate.UTILITY} — راجع جدول ميتا الحالي قبل أي حملة كبيرة. الرد على العميل جوه ٢٤ ساعة من رسالته (ردود الأزرار) ليه حصة مجانية شهرية بعدها بيتحاسب.<br>• الحساب الجديد عليه حد يومي من ميتا (غالبًا ٢٥٠ عميل/٢٤ ساعة ويكبر مع الجودة والتوثيق). عدّ سقف اليوم فوق على قد حدك.<br>• ميتا بتقيّد الرقم لو العملاء بلّغوا أو حظروا كتير: ابعت لناس وافقت تستقبل منك، وخلّي زرار «مش عايز رسائل» في كل قالب.</div>
        <div class="kpis wc-k"><div class="kpi"><b>${num(cl.d)}</b><span>وصلت</span></div><div class="kpi"><b>${num(cl.r)}</b><span>اتقرأت</span></div><div class="kpi"><b>${num(cl.f)}</b><span>فشلت</span></div></div>
      </details>`;
    host.dataset.painted = "1";
    const det = $$("wcDet"); if (det) det.ontoggle = () => { C.open = det.open; };
  }

  function collect() {
    const p = {}; for (const el of document.querySelectorAll("#wcPanel [data-wc]")) p[el.dataset.wc] = el.value;
    if (p.reply !== undefined) p.reply = p.reply === "1"; if (p.menu !== undefined) p.menu = p.menu === "1"; return p;
  }
  async function act(name, fn) { C.busy = name; paint(); try { return await fn(); } finally { C.busy = ""; } }
  async function onClick(e) {
    const b = e.target.closest("button"); if (!b || !b.id) return;
    if (b.id === "wcBot") { const v = C.v; const r = await msg({ type: "wcSet", patch: { reply: !v.reply } }); T(r && r.ok ? (r.reply ? "🟢 بوت الـAPI شغّال" : "⏸ بوت الـAPI اتقفل (بيسجّل بس)") : "❌ " + ((r && r.error) || "فشل")); $$("wcPanel").dataset.painted = ""; await refresh(); return; }
    if (b.id === "wcToggle") {
      const v = C.v; if (v.on) { await msg({ type: "wcSet", patch: { on: false } }); T("⏸ الحملة هتتبعت بواتساب ويب (بوت الـAPI فضل شغّال)"); }
      else {
        const n = cnt(v); if (!v.ready) return T("اكتب الـPhone number ID والتوكن واحفظ الأول");
        if (!confirm(`تفعّل واتساب الرسمي؟\n\n• الحملة هتبعت قوالب معتمدة من ميتا بدل واتساب ويب\n• ${n.ok ? n.ok + " قالب معتمد" : "⚠️ مفيش قالب معتمد لسه — الحملة هتستنى لحد ما واحد يتعتمد"}\n• ميتا بتحاسب على كل رسالة اتسلّمت\n• الردود على الأزرار محتاجة Webhook شغّال على السيرفر${v.app ? "" : " (الإضافة لوحدها مش بتستقبله)"}`)) return;
        const r = await msg({ type: "wcSet", patch: { ...collect(), on: true } }); T(r && r.on ? "🟢 الحملة هتتبعت بالـAPI الرسمي" : "❌ مش قادر يفعّلها — راجع البيانات");
      }
      await refresh(); return;
    }
    if (b.id === "wcSave") { const r = await msg({ type: "wcSet", patch: collect() }); if (r && r.ok) { C.v = r; T("💾 اتحفظ"); } else T("❌ " + ((r && r.error) || "فشل")); $$("wcPanel").dataset.painted = ""; await refresh(); return; }
    if (b.id === "wcPhone") { await msg({ type: "wcSet", patch: collect() }); C.phone = await act("بيتصل بميتا…", () => msg({ type: "wcPhone" })); $$("wcPanel").dataset.painted = ""; paint(); return; }
    if (b.id === "wcSubmit") {
      await msg({ type: "wcSet", patch: collect() });
      const r = await act("بيبعت القوالب لميتا…", () => msg({ type: "wcSubmit" }));
      C.out = r && r.ok ? "📤 خلص — ميتا بتراجع القوالب. دوس «حدّث حالة الموافقة» بعد شوية." : "❌ " + ((r && (r.note || r.error)) || "فشل"); C.res = r && r.res || null; $$("wcPanel").dataset.painted = ""; await refresh(); return;
    }
    if (b.id === "wcSync") {
      const r = await act("بيسأل ميتا…", () => msg({ type: "wcSync" }));
      C.out = r && r.ok ? `🔄 معتمد ${r.approved} · مستني ${r.pending} · مرفوض ${r.rejected}` : "❌ " + ((r && (r.note || r.error)) || "فشل"); C.res = null; $$("wcPanel").dataset.painted = ""; await refresh(); return;
    }
    if (b.id === "wcCopyUrl" || b.id === "wcCopyVer") { const t = $$(b.id === "wcCopyUrl" ? "wcHookUrl" : "wcVerify").value; if (!t) return T("اكتب الدومين الأول"); try { await navigator.clipboard.writeText(t); T("📋 اتنسخ"); } catch { T(t); } return; }
    if (b.id === "wcTest") {
      const ph = WAS.phone($$("wcTestNum").value), tid = $$("wcTestTpl").value; if (!ph.num) return T("اكتب رقم موبايلك صح");
      if (!tid) return T("مفيش قالب معتمد لسه"); LS("test", $$("wcTestNum").value);
      if (!confirm(`تبعت القالب لرقم ${WAS.show(ph.num)} فعليًا؟\n(ميتا هتحاسب عليها زي أي رسالة)`)) return;
      const r = await msg({ type: "waDry", test: true, num: ph.num, tid, name: "أحمد" });
      T(r && r.ok ? "📲 بدأت التجربة — هتوصلك في ثواني (النتيجة في السجل)" : "❌ " + ((r && r.error) || "مفيش رد")); return;
    }
  }
  async function refresh() { await load(); paint(); }
  function mount() {
    const root = $$("waRoot"); if (!root || $$("wcPanel")) return;
    const p = document.createElement("div"); p.className = "panel wc"; p.id = "wcPanel"; p.addEventListener("click", onClick);
    p.addEventListener("input", (e) => { if (e.target.id === "wcDomain") { LS("domain", e.target.value); const u = $$("wcHookUrl"); if (u) u.value = hookUrl(); } });
    const host = $$("waApiHost"); if (host) host.appendChild(p); // 10.58: جوه تاب «بوت الـAPI»
    else { const top = $$("waTop"); if (top && top.parentNode === root) top.after(p); else root.prepend(p); }
  }
  const orig = window.renderWasend;
  window.renderWasend = async function () { if (orig) await orig(); mount(); await refresh(); };
  chrome.storage.onChanged.addListener((c) => { if (c.__waCloud || c.__waCloudTpl || c.__waCloudHook || c.__waCloudQ || c.waState) { clearTimeout(window.__wcT); window.__wcT = setTimeout(() => { if ($$("wcPanel") && !$$("v-wasend").hidden) refresh().catch(() => {}); }, 500); } });
  document.addEventListener("DOMContentLoaded", () => { load().catch(() => {}); });
})();
