// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// ===== 🏠 «المالك» — تبريز الكلمة + تصنيف صاحب البوست (10.71.3) =====
// الفكرة: لما كلمة «المالك» (أو «من المالك» / «بدون سمسار» …) تظهر في وصف طلب أو عرض:
//   1) الكلمة تتبروز (علامة مميّزة) في كل مكان بيتعرض فيه النص: هاتلي مشتري ، الطلبات والعروض ، التطابق.
//   2) صاحب البوست يتصنّف: 🏠 مالك / 🤝 سمسار / 🏢 مكتب / 🔀 وسيط / 🟡 «ذكر المالك» بس (من غير تعريف نفسه).
//   3) في «هاتلي مشتري»: لو الوصف فيه «المالك» البرنامج بيدوّر في فيسبوك على نفس البوستات (من المالك) ويصنّفها.
// الملف ده لوحده (مفيش اعتماد على الصفحة) — بيستخدم PH.say من classify.js للتصريحات الصريحة لو موجود.
(function (g) {
  "use strict";
  const TASHKEEL = /[ً-ٰٟـ]/; // تشكيل + تطويل

  // نص مطبّع بنفس ترتيب الحروف + map لمكان الحرف الأصلي (عشان نبرّز في النص الأصلي بالظبط)
  function fold(text) {
    const t = String(text == null ? "" : text);
    let s = "";
    const map = [];
    for (let i = 0; i < t.length; i++) {
      let c = t[i];
      if (TASHKEEL.test(c)) continue;
      if (c === "أ" || c === "إ" || c === "آ" || c === "ٱ") c = "ا";
      else if (c === "ى") c = "ي";
      else if (c === "ة") c = "ه";
      else c = c.toLowerCase();
      s += c;
      map.push(i);
    }
    return { t, s, map };
  }

  const B0 = "(?<![ء-يa-z0-9])", B1 = "(?![ء-يa-z0-9])";
  const UNITW = "(?:وحده|ارض|اراضي|شقه|شقق|قطعه|فيلا|عقار|محل|مبني|بيت|دور)";
  // أداة التعريف بكل أشكالها: ال / بال / وال / فال / كال / لل / ولل
  const ART = "(?:[وفب]?لل|[وفبك]?ال)";
  // كل نمط = [النوع ، regex على النص المطبّع]
  // ملحوظة: «مالك» لوحدها ممكن تبقى اسم شخص (مالك أحمد) — فمش بتتبرّز إلا مع «ال» أو في سياق واضح
  const PATS = [
    ["owner", new RegExp(`${B0}(?:${ART}(?:مالك(?:ين|ه|ها|هم)?|ملاك)|مالك(?:ها|ه|هم))${B1}`, "g")],         // المالك / للمالك / المالكين / مالكها / الملاك
    ["owner", new RegExp(`${B0}(?:من|انا|عن|لدي)\\s+مالك${B1}`, "g")],                                      // من مالك / انا مالك
    ["owner", new RegExp(`${B0}مالك\\s+${ART}?${UNITW}${B1}`, "g")],                                         // مالك الوحدة / مالك الأرض
    ["owner", new RegExp(`${B0}(?:من\\s+)?(?:صاحبها|صاحب\\s+${ART}?(?:${UNITW}|ملك))${B1}`, "g")],       // صاحب الوحدة / من صاحبها
    ["direct", new RegExp(`${B0}(?:بدون|من\\s+غير|بلا)\\s+(?:ال)?(?:سمسار|سماسره|وسيط|وسطاء|وساطه|عموله|عمولات)${B1}`, "g")], // بدون سمسار
    ["direct", new RegExp(`${B0}مباشر(?:ه)?\\s+من\\s+${ART}(?:مالك|صاحب)${B1}`, "g")],
    ["owner", /(?<![a-z])(?:direct\s+from\s+owner|from\s+owner|by\s+owner|the\s+owner|owner)(?![a-z])/g],
  ];

  // أماكن الكلمة في النص الأصلي: [{s, e, kind}] (مدموجة وبدون تداخل)
  function find(text) {
    if (text == null || text === "") return [];
    const F = fold(text), out = [];
    if (!/[مصبملaow]/.test(F.s)) return [];
    for (const [kind, re] of PATS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(F.s))) {
        if (!m[0]) { re.lastIndex++; continue; }
        let s = F.map[m.index], e = F.map[m.index + m[0].length - 1] + 1;
        while (e < F.t.length && TASHKEEL.test(F.t[e])) e++; // تشكيل بعد آخر حرف
        out.push({ s, e, kind });
      }
    }
    out.sort((a, b) => a.s - b.s || b.e - a.e);
    const res = [];
    for (const r of out) {
      const last = res[res.length - 1];
      if (last && r.s < last.e) { if (r.e > last.e) { last.e = r.e; if (r.kind === "owner") last.kind = "owner"; } continue; }
      res.push({ ...r });
    }
    return res;
  }
  const has = (text) => find(text).length > 0;

  const escHtml = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  // النص كله HTML متهرّب منه ، والكلمة جوّه <mark class="own-mk">
  function html(text, esc) {
    const e = esc || escHtml, t = String(text == null ? "" : text), rs = find(t);
    if (!rs.length) return e(t);
    let out = "", p = 0;
    for (const r of rs) {
      out += e(t.slice(p, r.s)) + `<mark class="own-mk" data-own="${r.kind}">` + e(t.slice(r.s, r.e)) + "</mark>";
      p = r.e;
    }
    return out + e(t.slice(p));
  }

  // مقتطف بطول ≈ n حرف ومضمون إن أول «المالك» تبان فيه (لو بعيدة عن الأول نقصّ الأول ونوصل بيها)
  function snip(text, n) {
    const t = String(text == null ? "" : text).replace(/\s+/g, " ").trim();
    if (t.length <= n) return t;
    const rs = find(t);
    if (!rs.length || rs[0].e <= n) return t.slice(0, n);
    const head = Math.max(20, Math.floor(n * 0.4)), from = Math.max(head, rs[0].s - 25);
    return t.slice(0, head).trim() + " … " + t.slice(from, from + (n - head));
  }

  // ---------- التصنيف ----------
  const BR = { broker: ["🤝", "سمسار"], office: ["🏢", "مكتب"], middleman: ["🔀", "وسيط"] };
  const sayOf = (text, c) => { try { return g.PH && g.PH.say ? g.PH.say(String(text || ""), c ? { c: true } : undefined) || {} : {}; } catch (e) { return {}; } };

  // opts: { kind: "offer"|"request", isBroker: true|false|null|undefined (من الذكاء الاصطناعي / تصنيف البايعين), comment: bool }
  function classify(text, opts) {
    opts = opts || {};
    const mention = has(text), req = opts.kind === "request";
    const base = { mention, wantsOwner: req && mention, role: "", sure: false, src: "", ic: "", t: "", cls: "", why: "" };
    if (opts.mentionOnly && !mention) return base; // سريع: القوايم الكبيرة بتصنّف اللي فيه «المالك» بس
    const sy = sayOf(text, opts.comment);
    if (req) { // طلب: المهم هو الطالب نفسه (مشتري حقيقي ولا وسيط) + هل بيطلب «من المالك»
      if (sy.broker || sy.client) {
        const ph = (sy.broker && sy.broker.phrase) || sy.client || "";
        return { ...base, role: "middleman", sure: true, src: "say", ic: "🔀", t: "وسيط عنده عميل", cls: "b-cat", why: ph ? `كاتب «${ph}»` : "بيعرّف نفسه وسيط" };
      }
      if (sy.buyer) return { ...base, role: "buyer", sure: true, src: "say", ic: "✅", t: "مشتري", cls: "b-owner", why: `كاتب «${sy.buyer}»` };
      if (mention) return { ...base, role: "wants-owner", src: "text", ic: "🏠", t: "عايز من المالك", cls: "own-amber", why: "الطلب فيه «المالك» — بيدوّر على وحدة من صاحبها" };
      return base;
    }
    // عرض / بايع
    const ai = opts.isBroker === true ? "broker" : opts.isBroker === false ? "owner" : "";
    if (sy.broker && sy.owner) return { ...base, role: "unsure", src: "say", ic: "🟡", t: "مالك ولا وسيط؟", cls: "own-amber", why: `كاتب «${sy.owner}» و«${sy.broker.phrase}» مع بعض` };
    if (sy.broker) {
      const k = BR[sy.broker.kind] ? sy.broker.kind : "broker", [ic, nm] = BR[k];
      return { ...base, role: k, sure: true, src: "say", ic, t: nm, cls: "b-cat", why: `كاتب «${sy.broker.phrase}»` };
    }
    if (sy.owner) {
      if (ai === "broker") return { ...base, role: "unsure", src: "say+ai", ic: "🟡", t: "مالك ولا وسيط؟", cls: "own-amber", why: `كاتب «${sy.owner}» بس الذكاء الاصطناعي شافه سمسار` };
      return { ...base, role: "owner", sure: true, src: "say", ic: "🏠", t: "مالك", cls: "b-owner", why: `كاتب «${sy.owner}»` };
    }
    if (ai === "broker") return { ...base, role: "broker", sure: false, src: "ai", ic: "🤝", t: "سمسار", cls: "b-cat", why: "تحليل الذكاء الاصطناعي" };
    if (ai === "owner") return { ...base, role: "owner", sure: false, src: "ai", ic: "🏠", t: "مالك", cls: "b-owner", why: mention ? "تحليل الذكاء الاصطناعي + ذكر المالك في النص" : "تحليل الذكاء الاصطناعي" };
    if (mention) return { ...base, role: "mention", src: "text", ic: "🟡", t: "ذكر «المالك»", cls: "own-amber", why: "كاتب كلمة المالك من غير ما يقول إنه هو المالك — اتأكد منه" };
    return base;
  }

  // أنسب دور لوحدة (بوست عرض / طلب): بيدمج تصنيف البايع (لو معروف) مع النص
  // ctx: { sellerRole: "owner"|"broker"|"office"|"middleman"|"" , sellerSure: bool }
  function roleOf(p, ctx, mentionOnly) {
    p = p || {};
    const kind = p.type === "request" ? "request" : "offer";
    const r = classify(p.text || "", { kind, isBroker: p.isBroker, mentionOnly: !!mentionOnly });
    // مفيش تصريح صريح (أو مجرد «ذكر المالك») ← نستعين بتصنيف البايع من كل وحداته
    if (kind === "offer" && (!r.role || r.role === "mention") && ctx && ctx.sellerRole) {
      const k = ctx.sellerRole, [ic, nm] = k === "owner" ? ["🏠", "مالك"] : (BR[k] || BR.broker);
      return { ...r, role: k, sure: !!ctx.sellerSure, src: "seller", ic, t: nm, cls: k === "owner" ? "b-owner" : "b-cat", why: "من تصنيف البايع (كل وحداته)" + (r.mention ? " + ذكر «المالك» في النص" : "") };
    }
    return r;
  }

  const badgeHtml = (r, esc) => (r && r.t ? `<span class="badge own-b ${r.cls}" data-ownrole="${r.role}" title="${(esc || escHtml)(r.why || "")}">${r.ic} ${(esc || escHtml)(r.t)}</span>` : "");

  // عدّاد تصنيفات لقايمة: { owner, broker, unsure, none }
  function tally(list) {
    const t = { owner: 0, broker: 0, unsure: 0, none: 0 };
    for (const r of list) {
      if (!r || !r.role) t.none++;
      else if (r.role === "owner") t.owner++;
      else if (r.role === "unsure" || r.role === "mention" || r.role === "wants-owner") t.unsure++;
      else t.broker++;
    }
    return t;
  }

  // ---------- جمل بحث فيسبوك (هاتلي مشتري) ----------
  // عندي طلب (بدوّر على بايع): «ارض للبيع من المالك الحي العاشر بني سويف» — عندي عرض: «مطلوب ارض من المالك …»
  function queryFor(kind, w, region, gov) {
    const r = region ? ` ${region}` : "";
    return kind === "want" ? `${w} للبيع من المالك${r} ${gov}`.replace(/\s+/g, " ").trim() : `مطلوب ${w} من المالك${r} ${gov}`.replace(/\s+/g, " ").trim();
  }

  // ---------- تبريز جوّه الـ textarea وانت بتكتب (طبقة شفافة فوق الصندوق) ----------
  const COPY = ["fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "wordSpacing", "textAlign", "direction", "textIndent", "tabSize",
    "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "textTransform"];
  function attach(ta) {
    if (!ta || ta._ownBd || typeof document === "undefined") return ta && ta._ownBd;
    const wrap = document.createElement("div");
    wrap.className = "own-wrap";
    ta.parentNode.insertBefore(wrap, ta);
    wrap.appendChild(ta);
    const bd = document.createElement("div");
    bd.className = "own-bd";
    bd.setAttribute("aria-hidden", "true");
    wrap.appendChild(bd);
    ta._ownBd = bd;
    const paint = () => {
      const cs = getComputedStyle(ta);
      for (const k of COPY) bd.style[k] = cs[k];
      bd.style.boxSizing = "border-box";
      bd.style.top = ta.offsetTop + "px";
      bd.style.left = ta.offsetLeft + "px";
      bd.style.width = ta.offsetWidth + "px";
      bd.style.height = ta.offsetHeight + "px";
      bd.innerHTML = html(ta.value) + "\n";
      bd.scrollTop = ta.scrollTop;
      wrap.classList.toggle("has-own", has(ta.value));
    };
    ta.addEventListener("input", paint);
    ta.addEventListener("scroll", () => { bd.scrollTop = ta.scrollTop; });
    ta.addEventListener("focus", paint);
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(paint).observe(ta);
    ta._ownPaint = paint;
    paint();
    return bd;
  }
  const repaint = (ta) => { if (ta && ta._ownPaint) ta._ownPaint(); };

  g.OWNMK = { find, has, html, snip, classify, roleOf, badgeHtml, tally, queryFor, attach, repaint, fold, escHtml };
})(typeof globalThis !== "undefined" ? globalThis : self);
