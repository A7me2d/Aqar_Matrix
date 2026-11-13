// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🔘 جسر الأزرار الحقيقية — بيشتغل جوه صفحة واتساب ويب نفسها (MAIN world) فوق مكتبة wa-js (WPPConnect، Apache-2.0).
// بيعمل حاجتين بس:
//  ١) يبعت رسالة تفاعلية حقيقية (زراير رد سريع «Button Text» / صورة+زراير / فيديو+زراير / قايمة / تصويت / حدث) لمحادثة رقم واحد.
//  ٢) يسمع ردود العملاء على الزراير (ضغطة زرار أو اختيار من قايمة) ويبلّغ بيها سكربت الإضافة (wasender.js).
// الاتصال مع سكربت الإضافة (العالم المعزول) بـ window.postMessage بس — مفيش أي اتصال بالإنترنت من هنا.
(() => {
  if (window.__aqmBridge) return; window.__aqmBridge = 1;
  const TAG = "__aqm", ORIGIN = location.origin;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const post = (m) => { try { window.postMessage({ [TAG]: 1, dir: "out", ...m }, ORIGIN); } catch {} };
  const clip = (s, n) => String(s == null ? "" : s).slice(0, n);
  class PreErr extends Error { constructor(m, code) { super(m); this.pre = true; this.code = code || "pre"; } } // فشل قبل ما أي حاجة تتبعت (آمن نعيد بطريقة تانية)
  const W = () => window.WPP;
  const isReady = () => { try { const w = W(); return !!(w && w.isReady && w.conn && w.conn.isAuthenticated && w.conn.isAuthenticated()); } catch { return false; } };
  async function ready(ms) { const t0 = Date.now(); for (;;) { if (isReady()) return true; if (Date.now() - t0 > ms) return false; await sleep(300); } }
  const meNum = () => { try { const w = W().conn.getMyUserId(); return String((w && (w.user || w._serialized)) || "").replace(/\D/g, ""); } catch { return ""; } };

  // رقم الرسالة المختصر (الجزء الأخير من «true_<jid>_<ID>_out») — ده اللي العميل بيرجّعه في quotedStanzaID
  const sid = (mid) => { const m = String(mid || "").match(/@[a-z.]+_([A-Za-z0-9]+)(?:_[A-Za-z]+)?$/); return m ? m[1] : ""; };

  // ===== حدود واتساب للرسائل التفاعلية =====
  const LIM = { btns: 3, btnText: 20, body: 1024, footer: 60, title: 60, rowsMax: 10, rowTitle: 24, rowDesc: 72, listBtn: 20, pollMin: 2, pollMax: 12, pollOpt: 100, pollName: 255 };
  const cleanBtns = (arr) => (Array.isArray(arr) ? arr : []).filter((b) => b && String(b.text || "").trim()).slice(0, LIM.btns).map((b) => ({ id: clip(b.id, 200), text: clip(String(b.text).replace(/\s+/g, " ").trim(), LIM.btnText) }));
  function dataBlob(d) { const m = /^data:([^;,]+)?(;base64)?,/.exec(d || ""); return m ? { mime: m[1] || "", b64: !!m[2] } : null; }

  // ===== الإرسال =====
  // بيرجّع { id, ack } أو بيرمي (PreErr = فشل قبل الإرسال)
  async function sendSpec(num, spec, typing, readyMs) {
    if (!spec || typeof spec !== "object") throw new PreErr("مفيش مواصفات رسالة", "spec");
    if (!(await ready(Math.min(60000, +readyMs || 25000)))) throw new PreErr("مكتبة الأزرار لسه مش جاهزة في صفحة واتساب (أو واتساب مش مسجّل دخول)", "notready");
    const P = W(), chat = String(num).replace(/\D/g, "") + "@c.us", kind = String(spec.kind || "buttons");
    if (!/^\d{8,15}@c\.us$/.test(chat)) throw new PreErr("رقم مش مفهوم", "num");
    const ex = await P.contact.queryExists(chat).catch(() => null); if (!ex) return { invalid: true };
    const text = clip(spec.text, LIM.body), footer = clip(spec.footer, LIM.footer);
    let r, leadSent = false;
    try {
    if (+typing > 0) { try { P.chat.markIsComposing(chat, +typing + 300).catch(() => {}); } catch {} await sleep(+typing); } // «بيكتب…» عند العميل
    if (spec.lead && String(spec.lead).trim()) { await P.chat.sendTextMessage(chat, String(spec.lead).slice(0, 20000)); leadSent = true; await sleep(2500 + Math.random() * 2000); } // كلام أطول من حد رسالة الأزرار: بيتبعت الأول كرسالة عادية
    if (kind === "buttons") {
      const buttons = cleanBtns(spec.buttons); if (!buttons.length) throw new PreErr("مفيش زراير", "spec"); if (!text.trim()) throw new PreErr("نص الرسالة فاضي", "spec");
      const o = { buttons }; if (footer) o.footer = footer; if (spec.title) o.title = clip(spec.title, LIM.title);
      r = await P.chat.sendTextMessage(chat, text, o);
    } else if (kind === "buttonimg" || kind === "buttonvid") {
      const buttons = cleanBtns(spec.buttons); if (!buttons.length) throw new PreErr("مفيش زراير", "spec");
      const md = spec.media; if (!md || !dataBlob(md.data)) throw new PreErr("مفيش صورة/فيديو للرسالة", "media");
      const o = { type: kind === "buttonvid" ? "video" : "image", caption: text, buttons }; if (footer) o.footer = footer; if (md.filename) o.filename = clip(md.filename, 80);
      r = await P.chat.sendFileMessage(chat, md.data, o);
    } else if (kind === "video" || kind === "image") {
      const md = spec.media; if (!md || !dataBlob(md.data)) throw new PreErr("مفيش صورة/فيديو للرسالة", "media");
      const o = { type: kind, caption: text }; if (md.filename) o.filename = clip(md.filename, 80);
      r = await P.chat.sendFileMessage(chat, md.data, o);
    } else if (kind === "list") {
      const L = spec.list || {}; let left = LIM.rowsMax;
      const sections = (Array.isArray(L.sections) ? L.sections : []).map((s) => ({ title: clip(s.title || "الاختيارات", 24), rows: (Array.isArray(s.rows) ? s.rows : []).filter((x) => x && String(x.title || "").trim()).map((x) => ({ rowId: clip(x.id, 200), title: clip(String(x.title).replace(/\s+/g, " ").trim(), LIM.rowTitle), description: clip(x.desc || "", LIM.rowDesc) })) }))
        .map((s) => { s.rows = s.rows.slice(0, Math.max(0, left)); left -= s.rows.length; return s; }).filter((s) => s.rows.length);
      if (!sections.length) throw new PreErr("القايمة فاضية", "spec"); if (!text.trim()) throw new PreErr("نص الرسالة فاضي", "spec");
      const o = { buttonText: clip(L.button || "اختار", LIM.listBtn), description: text, sections }; if (footer) o.footer = footer; if (spec.title) o.title = clip(spec.title, LIM.title);
      r = await P.chat.sendListMessage(chat, o);
    } else if (kind === "poll") {
      const Pl = spec.poll || {}, name = clip(Pl.name || text, LIM.pollName), opts = [...new Set((Array.isArray(Pl.options) ? Pl.options : []).map((x) => clip(String(x || "").replace(/\s+/g, " ").trim(), LIM.pollOpt)).filter(Boolean))].slice(0, LIM.pollMax);
      if (!name.trim()) throw new PreErr("سؤال التصويت فاضي", "spec"); if (opts.length < LIM.pollMin) throw new PreErr("التصويت محتاج اختيارين على الأقل", "spec");
      r = await P.chat.sendCreatePollMessage(chat, name, opts, { selectableCount: Pl.multi ? 0 : 1 });
    } else if (kind === "event") {
      const E = spec.event || {}, st = Math.floor(+E.start || 0);
      if (!clip(E.name, 100).trim()) throw new PreErr("اسم الحدث فاضي", "spec"); if (!(st > Date.now() / 1000 + 60)) throw new PreErr("موعد الحدث عدّى أو مش متحدد", "spec");
      const o = { name: clip(E.name, 100), description: clip(E.desc || text, 2048), startTime: st }; if (+E.end > st) o.endTime = Math.floor(+E.end);
      if (E.loc && E.loc.name && isFinite(+E.loc.lat) && isFinite(+E.loc.lng)) o.location = { degreesLatitude: +E.loc.lat, degreesLongitude: +E.loc.lng, name: clip(E.loc.name, 100) };
      if (E.call === "video" || E.call === "voice") o.callType = E.call;
      r = await P.chat.sendEventMessage(chat, o);
    } else throw new PreErr("نوع رسالة مش مدعوم: " + kind, "kind");
    } catch (e) { if (leadSent && e) e.pre = false; throw e; } // لو الجزء الأول اتبعت يبقى مش «فشل قبل الإرسال»
    const mid = r && (typeof r.id === "string" ? r.id : r.id && r.id._serialized) || "";
    return { id: mid, ack: r && typeof r.ack === "number" ? r.ack : null, res: r && r.sendMsgResult && (r.sendMsgResult.messageSendResult || "") };
  }
  // بعد الإرسال: نستنى علامة «اتبعتت» (ack ≥ 1) لحد ms
  async function waitAck(mid, ms) {
    if (!mid) return null; const t0 = Date.now(); let ack = null;
    while (Date.now() - t0 < ms) {
      try { const m = await W().chat.getMessageById(mid); if (m && typeof m.ack === "number") { ack = m.ack; if (ack >= 1 || ack < 0) return ack; } } catch {}
      await sleep(700);
    }
    return ack;
  }

  // ===== ردود العملاء على الزراير =====
  const seen = []; const REPLY_T = /^(template_button_reply|buttons_response|list_response|interactive_response|native_flow_response)$/;
  async function numOf(jid) {
    const j = String(jid || ""); let m = j.match(/^(\d{8,15})(?::\d+)?@(?:c\.us|s\.whatsapp\.net)$/); if (m) return m[1];
    if (/@lid$/.test(j)) { try { const e = await W().contact.getPnLidEntry(j); const pn = e && e.phoneNumber && e.phoneNumber._serialized; m = String(pn || "").match(/^(\d{8,15})@/); if (m) return m[1]; } catch {} }
    return "";
  }
  function selOf(m) {
    const lr = m.listResponse && m.listResponse.singleSelectReply && m.listResponse.singleSelectReply.selectedRowId;
    return String(m.selectedId || m.selectedButtonId || lr || "");
  }
  // رسالة واردة ⟵ بيانات الرد (من غير الرقم) أو null لو مش رد على زرار/قايمة. allowSelf للاختبار بس (رد من نفس الحساب)
  function parseReply(m, allowSelf) {
    if (!m || !m.id || (m.id.fromMe && !allowSelf)) return null;
    const type = String(m.type || ""); if (!REPLY_T.test(type)) return null;
    const mid = m.id._serialized || ""; if (!mid) return null;
    const chat = (m.id.remote && m.id.remote._serialized) || (m.from && m.from._serialized) || "";
    if (/@(g\.us|broadcast|newsletter)$/.test(chat)) return null; // محادثات فردية بس
    return { mid, sid: sid(mid), chat, type, selectedId: selOf(m), body: clip(m.body, 300), quoted: String(m.quotedStanzaID || (m.quotedMsgKey && m.quotedMsgKey.id) || ""), t: +m.t || Math.floor(Date.now() / 1000) };
  }
  window.__aqmParse = parseReply; // للاختبارات
  // 📥 رسالة واردة فيها كود قطعة (AM-XXXXXX أو AM-XXXXXX-C2) ← الإضافة بتسجّلها «وارد» في تبويب «الواردين والقياس». كشف مبدئي بس — التحقق الكامل في الخلفية.
  // نص عادي ← m.body · وسائط (صورة/فيديو/ملف) ← الكابشن بس (m.body فيها صورة مصغّرة base64 ممكن تطابق بالصدفة)
  const CODE_RE = /(?<![A-Za-z0-9])AM[\s\-_]?[A-Za-z0-9٠-٩۰-۹]{6}(?![A-Za-z0-9])/i;
  function parseCode(m, allowSelf) {
    if (!m || !m.id || (m.id.fromMe && !allowSelf)) return null;
    const type = String(m.type || ""); if (!/^(chat|image|video|document)$/.test(type)) return null;
    const text = type === "chat" ? String(m.body || "") : String(m.caption || ""); if (!text || !CODE_RE.test(text)) return null;
    const mid = m.id._serialized || ""; if (!mid) return null;
    const chat = (m.id.remote && m.id.remote._serialized) || (m.from && m.from._serialized) || "";
    if (/@(g\.us|broadcast|newsletter)$/.test(chat)) return null;
    return { mid, sid: sid(mid), chat, body: clip(text, 300), t: +m.t || Math.floor(Date.now() / 1000) };
  }
  window.__aqmParseCode = parseCode; // للاختبارات
  async function onMsg(m) {
    try {
      const r = parseReply(m, false);
      if (r) { if (seen.includes(r.mid)) return; seen.push(r.mid); if (seen.length > 300) seen.shift(); post({ ev: "reply", ...r, num: await numOf(r.chat) }); return; }
      const c = parseCode(m, false); if (!c || seen.includes(c.mid)) return;
      seen.push(c.mid); if (seen.length > 300) seen.shift();
      post({ ev: "code", ...c, num: await numOf(c.chat) });
    } catch {}
  }
  let hooked = false;
  async function hook() {
    for (let i = 0; !hooked; i++) { // نحاول كل ٣٠٠ مللي لحد ما المكتبة تجهز (~٢ دقيقة) — بعدها كل ٣٠ ثانية
      if (isReady()) { try { W().on("chat.new_message", onMsg); hooked = true; post({ ev: "ready", me: meNum(), ver: String(W().version || "") }); } catch {} }
      if (!hooked) await sleep(i < 400 ? 300 : 30000);
    }
  }
  hook();
  setInterval(() => { if (hooked) OPS.scan({ sec: 900 }).catch(() => {}); }, 45000); // احتياطي: ردود وصلت والصفحة بتتحمّل

  // ===== أوامر من سكربت الإضافة =====
  const OPS = {
    async ping() { return { ok: true, ready: isReady(), hooked, me: isReady() ? meNum() : "", lib: !!W() }; },
    async ready(a) { return { ok: true, ready: await ready(Math.min(60000, +a.ms || 0)), me: isReady() ? meNum() : "" }; },
    async send(a) {
      const r = await sendSpec(a.num, a.spec, Math.min(8000, +a.typing || 0), a.readyMs);
      if (r.invalid) return { ok: true, invalid: true };
      const ack = await waitAck(r.id, Math.min(60000, +a.ackMs || 30000));
      return { ok: true, id: r.id, sid: sid(r.id), ack: ack == null ? r.ack : ack, res: r.res };
    },
    // رد نصي عادي على عميل (بعد ما داس زرار): «بيكتب…» شوية وبعدين يبعت ويعلّم المحادثة مقروءة
    async reply(a) {
      if (!(await ready(20000))) throw new PreErr("مكتبة الأزرار لسه مش جاهزة", "notready");
      const P = W(), chat = String(a.chat || ""), text = clip(a.text, 4000);
      if (!/^[\w.-]+@(c\.us|lid)$/.test(chat)) throw new PreErr("محادثة مش مفهومة", "chat"); if (!text.trim()) throw new PreErr("الرد فاضي", "spec");
      const typing = Math.min(+a.maxTyping || 6000, 700 + text.length * 22);
      try { P.chat.markIsComposing(chat, typing + 400).catch(() => {}); } catch {}
      await sleep(typing);
      const btns = cleanBtns(a.buttons), o = btns.length ? { buttons: btns } : undefined;
      const r = o ? await P.chat.sendTextMessage(chat, text, o) : await P.chat.sendTextMessage(chat, text);
      const mid = r && (typeof r.id === "string" ? r.id : r.id && r.id._serialized) || "";
      try { await P.chat.markIsRead(chat); } catch {}
      const ack = await waitAck(mid, 20000);
      return { ok: true, id: mid, sid: sid(mid), ack: ack == null ? (r && typeof r.ack === "number" ? r.ack : null) : ack };
    },
    // آخر ردود زراير/قايمة وصلت في آخر sec ثانية (احتياطي لو الصفحة كانت بتتحمّل وقت الضغطة) — الخلفية بتمنع التكرار بمعرّف الرسالة
    async scan(a) {
      if (!isReady()) return { ok: true, n: 0 };
      const P = W(), since = Date.now() / 1000 - Math.min(3600, +a.sec || 900); let n = 0;
      const chats = (await P.chat.list({ onlyUsers: true, count: 40 }).catch(() => [])) || [];
      for (const c of chats) {
        if (!c || !c.id || !(+c.t > since)) continue;
        const ms = await P.chat.getMessages(c.id._serialized, { count: 6 }).catch(() => []);
        for (const m of ms || []) {
          if (!(+m.t > since)) continue; const r = parseReply(m, false);
          if (r) { if (seen.includes(r.mid)) continue; seen.push(r.mid); if (seen.length > 300) seen.shift(); n++; post({ ev: "reply", ...r, num: await numOf(r.chat), late: true }); continue; }
          const c = parseCode(m, false); if (!c || seen.includes(c.mid)) continue; seen.push(c.mid); if (seen.length > 300) seen.shift(); n++; post({ ev: "code", ...c, num: await numOf(c.chat), late: true });
        }
      }
      return { ok: true, n };
    },
    async check(a) { // تجربة جافة: نتأكد إن المكتبة جاهزة والمواصفات صالحة والرقم على واتساب — من غير ما نبعت حاجة
      if (!(await ready(Math.min(60000, +a.readyMs || 25000)))) throw new PreErr("مكتبة الأزرار لسه مش جاهزة", "notready");
      const spec = a.spec || {}, kind = String(spec.kind || ""); if (!/^(buttons|buttonimg|buttonvid|list|poll|event|video|image)$/.test(kind)) throw new PreErr("نوع رسالة مش مدعوم", "kind");
      const ex = await W().contact.queryExists(String(a.num).replace(/\D/g, "") + "@c.us").catch(() => null);
      return { ok: true, exists: !!ex };
    },
  };
  window.addEventListener("message", async (e) => {
    const d = e.data; if (e.source !== window || e.origin !== ORIGIN || !d || d[TAG] !== 1 || d.dir !== "in" || !OPS[d.op]) return;
    let res;
    try { res = await OPS[d.op](d.args || {}); }
    catch (err) { res = { ok: false, error: String((err && err.message) || err).slice(0, 300), pre: !!(err && err.pre), code: (err && err.code) || "" }; }
    post({ id: d.id, res });
  });
  post({ ev: "loaded" });
})();
