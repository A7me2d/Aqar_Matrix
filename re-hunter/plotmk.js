// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// plotmk.js — تسويق القطعة (منطق نقي، من غير DOM): كود مرجعي بدل رقم القطعة + عنوان تسويقي من بيانات المخطط +
// صفحة ويب لوحدها (ملف HTML واحد) + حزمة إعلان «كليك تو واتساب» + اختيار المشترين. كل جملة في العنوان والصفحة مبنية على رقم/مسافة من الأطلس؛
// مفيش «الأفضل/الأرخص/فرصة مش هتتكرر/ضمان». المنصة بتصدّر الملف بس — الاستضافة عليك.
(function (g) {
  "use strict";
  const AL = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // من غير 0/O/1/I/L عشان ما يتلخبطوش في القراية
  const en = (n) => Number(n || 0).toLocaleString("en-US");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DIG = "٠١٢٣٤٥٦٧٨٩", latin = (s) => String(s || "").replace(/[٠-٩]/g, (d) => DIG.indexOf(d));

  // ===== الكود المرجعي =====
  function cyrb53(str, seed) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507); h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507); h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  function newSalt() {
    let s = ""; try { const a = new Uint32Array(3); (g.crypto || {}).getRandomValues(a); s = Array.from(a).map((x) => x.toString(36)).join(""); } catch {}
    return s || (Math.random().toString(36).slice(2) + Date.now().toString(36));
  }
  // الكود بيتحسب من (ملح سري + هوية القطعة) — مينفعش حد يعرف منه الرقم، ومفيش طريقة يتخمّن
  function refCode(salt, key, nonce) {
    let h = cyrb53(String(salt) + "|" + String(key) + "|" + (nonce | 0), 7), out = "";
    for (let i = 0; i < 6; i++) { out = AL[h % AL.length] + out; h = Math.floor(h / AL.length); }
    return "AM-" + out;
  }
  function normCode(s) {
    let t = latin(s).toUpperCase().replace(/[^A-Z0-9]/g, ""); if (t.startsWith("AM") && t.length === 8) t = t.slice(2);
    if (t.length !== 6) return ""; for (const c of t) if (!AL.includes(c)) return ""; return "AM-" + t;
  }
  const isCode = (s) => !!normCode(s);
  // سجل الأكواد: { salt, byKey: { key: {code, at} } } — بيرجّع كود ثابت للقطعة ويمنع التكرار
  function codeFor(reg, key) {
    reg.salt = reg.salt || newSalt(); reg.byKey = reg.byKey || {}; reg.byCode = reg.byCode || {};
    const e = reg.byKey[key]; if (e && e.code) { reg.byCode[e.code] = key; return e.code; }
    let n = 0, c = refCode(reg.salt, key, n); while (reg.byCode[c] && reg.byCode[c] !== key && n < 50) c = refCode(reg.salt, key, ++n);
    reg.byKey[key] = { ...(e || {}), code: c, at: Date.now() }; reg.byCode[c] = key; return c;
  }
  const keyOfCode = (reg, code) => { const c = normCode(code); return c && reg && reg.byCode ? reg.byCode[c] || "" : ""; };

  // ===== واتساب =====
  function phoneIntl(p) {
    let d = latin(p).replace(/\D/g, ""); if (d.startsWith("0020")) d = d.slice(2); else if (d.startsWith("00")) d = d.slice(2);
    if (/^20(1[0125]\d{8})$/.test(d)) return d; if (/^0(1[0125]\d{8})$/.test(d)) return "2" + d; if (/^(1[0125]\d{8})$/.test(d)) return "20" + d; return "";
  }
  const waLink = (phone, msg) => { const p = phoneIntl(phone); return p ? "https://wa.me/" + p + (msg ? "?text=" + encodeURIComponent(msg) : "") : ""; };
  const waMsg = (code, title) => `السلام عليكم 👋\nمهتم بالقطعة كود ${code}${title ? "\n" + title : ""}\nممكن التفاصيل وميعاد معاينة؟`;

  // ===== العنوان التسويقي =====
  const r10 = (d) => (d < 15 ? 0 : d < 100 ? Math.round(d / 10) * 10 : Math.round(d / 50) * 50);
  const dTxt = (d) => (d < 15 ? "جنبها" : "حوالي " + en(r10(d)) + " م");
  const minsOf = (d) => Math.max(1, Math.round(d / 80));
  const minTxt = (m) => (m <= 1 ? "دقيقة" : m === 2 ? "دقيقتين" : en(m) + " دقايق");
  // f = { dn, m, area, approx, cor, fr:{svc,gar,edu,com}, nb:{ road:{adj,d}, uni:{d,name}, edu:{d,name}, gar:{d}, svcMain:{d,name}, svcMin:{d,name}, med:{d}, mos:{d}, com:{d} }, price:{ppm,cmp,scope} }
  // كل claim = {k, s: درجة، short: للعنوان، long: للصفحة والإعلان}
  function claims(f) {
    const C = [], nb = f.nb || {}, fr = f.fr || {}, add = (k, s, short, long) => C.push({ k, s, short, long });
    const mt = (d) => `${minTxt(minsOf(d))} مشي`;
    if (f.cor) add("cor", 92, "ناصية بواجهتين", "ناصية على شارعين (واجهتين)");
    if (fr.svc) add("svcF", 88, "واجهة على منطقة خدمات", "واجهتها على منطقة خدمات مباشرة");
    if (fr.gar) add("garF", 82, "واجهة على حديقة", "واجهتها على حديقة / منتزه");
    if (fr.edu) add("eduF", 76, "واجهة على منطقة تعليمية", "واجهتها على منطقة تعليمية / جامعات");
    if (fr.com) add("comF", 60, "واجهة على منطقة تجارية", "واجهتها على منطقة تجارية");
    const rd = nb.road;
    if (rd) { if (rd.adj || rd.d <= 4) add("road", 86, "على الطريق الرئيسي مباشرة", "مطلّة على الطريق الرئيسي مباشرة"); else if (rd.d <= 300) add("road", 72 - rd.d / 20, `على بعد ${en(r10(rd.d))} م من الرئيسي`, `الطريق الرئيسي ${dTxt(rd.d)} — ${mt(rd.d)}`); }
    if (nb.uni && nb.uni.d <= 800) { const un = nb.uni.name || "منطقة الجامعات"; add("uni", 74 - nb.uni.d / 40, `${nb.uni.name || "الجامعات"} على ${en(r10(nb.uni.d))} م`, `${un} ${dTxt(nb.uni.d)} — ${mt(nb.uni.d)}`); }
    else if (nb.edu && nb.edu.d <= 500 && !fr.edu) { const un = nb.edu.name || "منطقة تعليمية"; add("edu", 50 - nb.edu.d / 40, `${un} على ${en(r10(nb.edu.d))} م`, `${un} ${dTxt(nb.edu.d)} — ${mt(nb.edu.d)}`); }
    if (nb.gar && nb.gar.d <= 400 && !fr.gar) add("gar", 66 - nb.gar.d / 30, `حديقة على ${en(r10(nb.gar.d))} م`, `حديقة / منتزه ${dTxt(nb.gar.d)} — ${mt(nb.gar.d)}`);
    if (nb.svcMain && nb.svcMain.d <= 500 && !fr.svc) add("svcM", 64 - nb.svcMain.d / 30, `خدمات على ${en(r10(nb.svcMain.d))} م`, `منطقة خدمات رئيسية ${dTxt(nb.svcMain.d)}`);
    if (nb.svcMin && nb.svcMin.d <= 300 && !fr.svc && !(nb.svcMain && nb.svcMain.d <= 500)) add("svcm", 46 - nb.svcMin.d / 30, `خدمات على ${en(r10(nb.svcMin.d))} م`, `منطقة خدمات فرعية ${dTxt(nb.svcMin.d)}`);
    if (nb.med && nb.med.d <= 600) add("med", 44 - nb.med.d / 60, `مركز طبي على ${en(r10(nb.med.d))} م`, `مركز طبي ${dTxt(nb.med.d)}`);
    if (nb.com && nb.com.d <= 400 && !fr.com) add("com", 45 - nb.com.d / 40, `سوق على ${en(r10(nb.com.d))} م`, `منطقة تجارية ${dTxt(nb.com.d)}`);
    if (nb.mos && nb.mos.d <= 400) add("mos", 40 - nb.mos.d / 40, `مسجد على ${en(r10(nb.mos.d))} م`, `مسجد ${dTxt(nb.mos.d)}`);
    return C.sort((a, b) => b.s - a.s);
  }
  // ===== مسميات الأماكن: قصيرة ومفهومة عشان تتحط جوه التصميم (كروت الصورة، كبسولات الخريطة) من غير ما تتقصّ بـ «…» =====
  // [الاسم الكامل للقايمة والكارت، الاسم المختصر للكبسولة]
  const PLACE = { road: ["الطريق الرئيسي", "الرئيسي"], uni: ["منطقة الجامعات", "الجامعات"], edu: ["منطقة تعليمية", "منطقة تعليمية"], gar: ["حديقة ومنتزه", "حديقة"], svcM: ["خدمات رئيسية", "خدمات رئيسية"], svcm: ["خدمات فرعية", "خدمات فرعية"], med: ["مركز طبي", "مركز طبي"], com: ["منطقة تجارية", "سوق"], mos: ["مسجد", "مسجد"] };
  const placeName = (k, sp) => (k === "uni" && sp ? sp : (PLACE[k] || ["", ""])[0]);
  // كبسولة الخريطة: «خدمات على 100 م» / «الرئيسي على 90 م» / «على الرئيسي مباشرة»
  const pillTxt = (k, d, adj, sp) => { if (k === "road" && adj) return "على الرئيسي مباشرة"; const n = k === "uni" && sp ? sp : (PLACE[k] || ["", ""])[1]; return d < 15 ? n + " جنب القطعة" : n + " على " + en(r10(d)) + " م"; };
  // قيمة الكارت (تحت اسم المكان): «90 م» / «جنبها» / «مطلّة عليه»
  const valTxt = (k, d, adj) => (adj ? "مطلّة عليه" : d < 15 ? "جنبها" : en(r10(d)) + " م");
  const money = (n) => (n >= 1e6 ? String(Math.round((n / 1e6) * 100) / 100).replace(/\.0+$/, "") + " مليون" : n >= 1000 ? en(Math.round(n / 1000)) + " ألف" : en(Math.round(n)));
  function headline(f) {
    const C = claims(f), area = Math.round(f.area), ap = f.approx ? "حوالي " : "", dn = f.dn || "", kind = `أرض ${ap}${en(area)} م²`;
    const where = `${dn}${f.m ? " · مجاورة " + f.m : ""}`.trim(), city = "ببني سويف الجديدة";
    const best = (arr, n) => { const t = arr.slice(0, n).map((c) => c.short); return t.length > 1 ? t[0] + " و" + t.slice(1).join(" و") : t[0] || ""; };
    // العنوان الأساسي: نوع القطعة + أقوى ميزة (أو اتنين لو دخلوا) + الحي — مش أكتر من اتنين عشان يفضل مقروء
    let used = 0, title = "";
    for (let n = Math.min(2, C.length); n >= 0; n--) { const lead = best(C, n), t = lead ? `${kind} في ${dn} — ${lead}` : `${kind} في ${dn} ${city}`; if (t.length <= 78 || n === 0) { title = t; used = n; break; } }
    const sub = C.slice(used).slice(0, 3).map((c) => c.long).join(" · ") || `${where} ${city}`;
    // صيغ بديلة بنبرات مختلفة (كلها من نفس الحقايق)
    const alts = [], pr = f.price, below = pr && pr.cmp && pr.cmp.level === "below" && pr.cmp.p >= 8;
    if (C[0]) alts.push({ t: "موقع", h: `${where} — ${C[0].long}${C[1] ? " و" + C[1].short : ""}` });
    if (below) alts.push({ t: "سعر", h: `سعر المتر أقل من متوسط ${pr.scope === "mugawra" ? "المجاورة" : "الحي"} بحوالي ${pr.cmp.p}% — ${kind} في ${dn}` });
    else if (f.ask > 0) alts.push({ t: "سعر", h: `${kind} في ${dn} بـ ${money(f.ask)} جنيه` });
    const fam = C.filter((c) => ["gar", "garF", "edu", "eduF", "med", "mos", "uni"].includes(c.k)).slice(0, 2);
    if (fam.length) alts.push({ t: "بيتك", h: `ابني بيتك في ${dn} — ${kind}، ${fam.map((c) => c.short).join(" و")}` });
    const inv = C.filter((c) => ["road", "svcF", "svcM", "svcm", "comF", "com", "cor"].includes(c.k)).slice(0, 2);
    if (inv.length) alts.push({ t: "حركة", h: `${kind} في ${dn} — ${inv.map((c) => c.short).join(" و")}` });
    return { title, sub, claims: C, alts: alts.filter((a, i, arr) => a.h !== title && arr.findIndex((b) => b.h === a.h) === i).slice(0, 4), kind, where };
  }

  // ===== الإعلان =====
  const tokens = (s) => String(s || "").replace(/[^؀-ۿa-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);
  const overlap = (a, b) => { const A = new Set(tokens(a)); if (!A.size) return 0; let c = 0; for (const w of new Set(tokens(b))) if (A.has(w)) c++; return c / A.size; };
  const cut = (s, n) => { if (s.length <= n) return s; const t = s.slice(0, n), i = t.lastIndexOf(" "); return (i > n * 0.5 ? t.slice(0, i) : t).trim(); }; // احتياطي بس: بيقطع عند آخر كلمة كاملة من غير «…»
  // o = { code, hl (headline()), f (facts), phone, pageUrl, pixel }
  // كل إعلان = عنوان + نص أساسي + وصف، والنص الأساسي ما بيعيدش كلام العنوان (بنشيل أي سطر بيتشابه معاه 60%+)
  function adPack(o) {
    const H = o.hl, f = o.f, code = o.code, C = H.claims, dn = f.dn || "", ks = `${en(Math.round(f.area))} م²`, pr = f.price;
    const cta = `ابعت الكود ${code} على واتساب ويوصلك ملف القطعة بالخريطة والمسافات.`;
    const sc = pr && pr.scope === "mugawra" ? "المجاورة" : "الحي", below = !!(pr && pr.cmp && pr.cmp.level === "below" && pr.cmp.p >= 8);
    const keep = (head, lines) => lines.filter((l) => l && overlap(head, l) < 0.6);
    const fitHead = (c, max) => { for (const h of c) if (h && h.length <= max) return h; return cut(c[c.length - 1], max); };
    const ads = [];
    { const head = fitHead([C[0] && `${C[0].short} — ${dn}`, C[0] && C[0].short, `أرض ${ks} في ${dn}`, `أرض ${ks} — ${dn}`], 40);
      ads.push({ t: "موقع", head, desc: "الخريطة والمسافات على واتساب", primary: [...keep(head, [C[1] && C[1].long, C[2] && C[2].long, `${ks} في ${dn} ببني سويف الجديدة.`]), cta].join("\n") }); }
    { const head = below ? fitHead([`سعر المتر أقل من ${sc} — ${dn}`, `سعر المتر أقل من ${sc}`], 40) : fitHead([`سعر المتر في ${dn} كام؟`, `اعرف سعر المتر في ${sc}`], 40);
      const body = below ? `سعر المتر هنا أقل من متوسط ${sc} بحوالي ${pr.cmp.p}% (من عروض معروضة، مش أسعار صفقات).` : `هتعرف القطعة بعيدة قد إيه عن الخدمات والطريق الرئيسي، ومتوسط سعر المتر في ${sc} كام.`;
      ads.push({ t: "قيمة", head, desc: "مسافات من مخطط المدينة", primary: [...keep(head, [body, `أرض ${ks} في ${dn}.`]), cta].join("\n") }); }
    { const fam = C.find((c) => ["gar", "garF", "edu", "eduF", "med", "mos", "uni"].includes(c.k)), head = fitHead([fam && `${fam.short} — ${dn}`, fam && fam.short, "ابني بيتك في بني سويف الجديدة"], 40), oth = C.filter((c) => c !== fam && c !== C[0]);
      ads.push({ t: "بيتك", head, desc: "ابعت الكود واستلم الملف", primary: [...keep(head, [oth[0] && oth[0].long, "بتفكر تبني بيتك أو تستثمر في بني سويف الجديدة؟ شوف مكان القطعة على الخريطة وبعدها قد إيه عن كل حاجة."]), cta].join("\n") }); }
    const greet = waMsg(code, ""), link = waLink(o.phone, greet), px = /^\d{8,20}$/.test(String(o.pixel || "").trim());
    return {
      code, link, greet, ads, cta: "إرسال رسالة واتساب (WhatsApp Message)", url: o.pageUrl || "",
      utm: o.pageUrl ? o.pageUrl + (o.pageUrl.includes("?") ? "&" : "?") + "utm_source=facebook&utm_medium=paid&utm_campaign=" + encodeURIComponent(code) : "",
      target: {
        note: "اقتراحات للتجربة — مش متحقق منها من حساب إعلانات حقيقي (مفيش اتصال بمدير إعلانات ميتا وقت التجهيز). أسماء الاهتمامات في ميتا بتتغيّر، دوّر عليها بالاسم في «الاستهداف التفصيلي».",
        geo: ["محافظة بني سويف (كل المدن)", "تجربة منفصلة: القاهرة الكبرى (أهالي بني سويف المقيمين هناك — فرضية)"],
        age: "28 – 55",
        interests: ["العقارات / Real estate", "الاستثمار العقاري", "بناء وتشييد المنازل / Home construction", "التمويل العقاري (لو متاح)"],
        sets: ["أ) بني سويف · 28–55 · من غير اهتمامات (سيب ميتا تختار)", "ب) بني سويف · نفس العمر · اهتمام عقارات", "ج) القاهرة الكبرى · نفس العمر · اهتمام عقارات"],
        special: "ميتا ممكن تطلب تحدد «فئة إعلانية خاصة: إسكان» لإعلانات العقارات، وده بيقيّد خيارات الاستهداف في بعض الدول. اتأكد من مدير الإعلانات قبل ما تحجز ميزانية.",
      },
      test: ["الهدف: «رسائل / Messages» والوجهة واتساب (محتاج صفحة فيسبوك مربوطة برقم الواتساب).", "ابدأ بـ3 مجموعات إعلانية × إعلانين، وميزانية صغيرة لمدة 3 أيام (مثلًا 100 ج/يوم لكل مجموعة — رقم للتجربة مش توصية).", "قيّم بـ«تكلفة الرسالة» وعدد الرسائل اللي فيها الكود، مش الإعجابات.", "بعد 3 أيام: وقّف الأعلى تكلفة، وكبّر الأرخص تدريجيًا (حوالي 20% كل يومين — قاعدة تجريبية شائعة)."],
      retarget: px ? ["Pixel " + String(o.pixel).trim() + " متحط في الصفحة (حدث «Contact» لما حد يدوس واتساب).", "في ميتا: جمهور مخصص «زوار الموقع» آخر 30 يوم، واستبعد اللي راسلوك.", "اعمل إعلان تاني للجمهور ده بنص «لسه بتفكر؟» ونفس كود القطعة."] : ["مفيش Pixel ID متحط — اكتبه في خانة «Pixel» (أرقام بس) وهيتحط في الصفحة تلقائي، وبعدها تقدر تعمل إعادة استهداف لزوار الصفحة."],
    };
  }
  const adText = (A) => [
    `📣 حزمة إعلان — كود ${A.code}`, "", ...A.ads.flatMap((a, i) => [`— إعلان ${i + 1} (${a.t}) —`, "العنوان: " + a.head, "النص:\n" + a.primary, "الوصف: " + a.desc, ""]),
    "— رسالة الترحيب في واتساب —", A.greet, A.link ? "\nرابط الواتساب: " + A.link : "", A.utm ? "\nرابط الصفحة مع UTM: " + A.utm : "",
    "", "— استهداف مقترح —", A.target.note, "المكان: " + A.target.geo.join(" | "), "العمر: " + A.target.age, "اهتمامات للتجربة: " + A.target.interests.join("، "), ...A.target.sets, A.target.special,
    "", "— خطة الاختبار —", ...A.test.map((t) => "• " + t), "", "— إعادة الاستهداف —", ...A.retarget.map((t) => "• " + t)].join("\n");

  // ===== صفحة الويب (ملف HTML واحد) =====
  // o = { code, brand, phone, hl, f, svg, rows:[{k, ic, name, dtxt, mins, tier}], price:{ask, ppm, st, cmp}, pixel, pageTitle }
  // خط Cairo (SIL OFL) متضمّن جوه الملف المصدَّر عشان يظهر بنفس الشكل على أي موبايل من غير إنترنت
  const UR_AR = "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC", UR_LAT = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
  function fontCss() {
    const B = g.CAIRO_B64; if (!B || !B.ar || !B.lat) return "";
    const ff = (b64, ur) => '@font-face{font-family:"Cairo";font-style:normal;font-weight:200 1000;font-display:swap;src:url(data:font/woff2;base64,' + b64 + ') format("woff2");unicode-range:' + ur + '}';
    return ff(B.ar, UR_AR) + ff(B.lat, UR_LAT);
  }

  function pageHtml(o) {
    const H = o.hl, f = o.f, code = o.code, brand = o.brand || "العراب للعقارات", wa = waLink(o.phone, waMsg(code, H.title)), tel = phoneIntl(o.phone), px = /^\d{8,20}$/.test(String(o.pixel || "").trim()) ? String(o.pixel).trim() : "";
    const area = Math.round(f.area), ap = f.approx ? "حوالي " : "";
    const rows = (o.rows || []).map((r) => `<li data-k="${esc(r.k)}"><i>${esc(r.ic)}</i><b>${esc(r.name)}</b><span>${esc(r.dtxt)}${r.mins ? `<small>${esc(minTxt(r.mins))} مشي</small>` : ""}</span></li>`).join("");
    const feats = H.claims.filter((c) => /^(cor|svcF|garF|eduF|comF)$/.test(c.k) || (c.k === "road" && /مباشرة/.test(c.short))).map((c) => `<li>${esc(c.long)}</li>`).join(""); // الواجهات والناصية بس — المسافات ليها قايمتها فوق
    const pr = o.price, st = pr && pr.st, ppm = pr && pr.ppm;
    let priceBlock = "";
    if (st) {
      const lo = Math.min(st.lo * 0.8, ppm ? ppm * 0.95 : st.lo * 0.8), hi = Math.max(st.hi * 1.2, ppm ? ppm * 1.05 : st.hi * 1.2), P = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100)).toFixed(1), sc = st.scope === "mugawra" ? "المجاورة" : "الحي";
      const cm = pr.cmp, lv = cm ? cm.level : "";
      priceBlock = `<section class="card"><h2>السعر بالنسبة للمنطقة</h2>${pr.ask ? `<div class="pr"><div><small>السعر المطلوب</small><strong>${esc(money(pr.ask))} ج</strong></div><div><small>سعر المتر</small><strong>${esc(en(ppm))} ج/م²</strong></div></div>` : ""}
      <p class="sub">متوسط سعر المتر المعروض في ${sc}: <b>${esc(en(st.med))} ج/م²</b> (الأغلب بين ${esc(en(st.lo))} و${esc(en(st.hi))}) — من ${esc(en(st.n))} عروض.</p>
      <div class="bar"><u style="right:${P(st.lo)}%;left:${(100 - P(st.hi)).toFixed(1)}%"></u><s style="right:${P(st.med)}%"></s>${ppm ? `<em class="${esc(lv)}" style="right:${P(ppm)}%"></em>` : ""}</div>
      ${cm ? `<p class="cmp ${esc(lv)}">${esc(cm.text)}</p>` : ""}<p class="fn">المقارنة بأسعار معروضة في الجروبات (مش أسعار صفقات). المعاينة على الطبيعة هي اللي بتأكّد.</p></section>`;
    } else if (pr && pr.ask) priceBlock = `<section class="card"><h2>السعر</h2><div class="pr"><div><small>السعر المطلوب</small><strong>${esc(money(pr.ask))} ج</strong></div><div><small>سعر المتر</small><strong>${esc(en(ppm))} ج/م²</strong></div></div></section>`;
    const cta = wa ? `<a class="wa" id="wa" href="${esc(wa)}" target="_blank" rel="noopener">💬 كلّمنا على واتساب</a>` : "";
    const call = tel ? `<a class="tel" href="tel:+${esc(tel)}">📞 اتصل بينا</a>` : "";
    const pixelJs = px ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${px}');fbq('track','PageView');</script>` : "";
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(H.title)}</title><meta name="description" content="${esc(H.sub)}"><meta property="og:title" content="${esc(H.title)}"><meta property="og:description" content="${esc(H.sub)}">
<style>
${fontCss()}
:root{--ink:#0e2233;--mut:#5b6b7b;--paper:#f3f5f7;--card:#fff;--line:#d9e0e6;--acc:#0b7285;--wa:#16a34a;--warn:#c2410c;--good:#15803d}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.7 Cairo,Tahoma,Arial,sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:0 16px 96px}
.top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 0}.top b{font-size:17px;letter-spacing:.2px}
.code{border:1.5px solid var(--ink);border-radius:999px;background:transparent;color:var(--ink);font:700 14px/1 Cairo,Arial,sans-serif;padding:9px 14px;cursor:pointer;direction:ltr}
.code:focus-visible,.wa:focus-visible,.tel:focus-visible{outline:3px solid var(--acc);outline-offset:2px}
h1{font-size:clamp(26px,6.4vw,40px);line-height:1.28;margin:10px 0 8px;font-weight:800;letter-spacing:-.2px;text-wrap:balance}
.lead{color:var(--mut);font-size:17px;margin:0 0 18px;max-width:60ch;text-wrap:balance}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1.5px solid var(--ink);border-radius:14px;background:var(--card);overflow:hidden;margin-bottom:18px}
.stats div{padding:12px 10px;text-align:center}.stats div+div{border-right:1.5px solid var(--ink)}.stats strong{display:block;font:800 clamp(18px,5vw,26px)/1.2 Cairo,Arial,Tahoma,sans-serif}.stats small{color:var(--mut);font-size:13px}
.map{background:#0d1524;border-radius:16px;overflow:hidden;margin:0 0 12px;border:1px solid #1d2a40}.map svg{display:block;width:100%;height:auto}
.map svg [data-k]{transition:opacity .15s}.map.dim svg [data-k]{opacity:.22}.map.dim svg [data-k].on{opacity:1}
ul.rows{list-style:none;margin:0 0 18px;padding:0;background:var(--card);border:1px solid var(--line);border-radius:14px}
ul.rows li{display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;border-bottom:1px solid var(--line)}ul.rows li:last-child{border:0}ul.rows li.on{background:#e7f3f5}
ul.rows i{font-style:normal;font-size:22px;width:30px;text-align:center}ul.rows b{flex:1;font-weight:700}ul.rows span{font:800 17px Cairo,Arial,Tahoma,sans-serif;color:var(--acc);text-align:left;white-space:nowrap}ul.rows small{display:block;font:400 12px Cairo,Tahoma,sans-serif;color:var(--mut)}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:16px}.card h2{font-size:19px;margin:0 0 10px}
.card ul{margin:0;padding:0 18px 0 0}.card li{margin:4px 0}
.pr{display:flex;gap:12px;margin-bottom:8px}.pr div{flex:1;background:var(--paper);border-radius:10px;padding:10px 12px}.pr small{display:block;color:var(--mut);font-size:13px}.pr strong{font:800 20px Cairo,Arial,Tahoma,sans-serif}
.sub{color:var(--mut);margin:6px 0 12px}.bar{position:relative;height:10px;background:#e3e9ee;border-radius:6px;margin:16px 4px}.bar u{position:absolute;top:0;bottom:0;background:var(--acc);border-radius:6px;opacity:.85}.bar s{position:absolute;top:-6px;width:3px;height:22px;background:var(--ink);transform:translateX(50%)}
.bar em{position:absolute;top:-5px;width:20px;height:20px;border-radius:50%;background:var(--ink);border:3px solid #fff;box-shadow:0 0 0 1.5px var(--ink);transform:translateX(50%)}.bar em.below{background:var(--good)}.bar em.above{background:var(--warn)}
.cmp{font-weight:700;margin:0}.cmp.below{color:var(--good)}.cmp.above{color:var(--warn)}.fn{font-size:13px;color:var(--mut);margin:10px 0 0}
.ctas{display:flex;gap:10px;position:sticky;bottom:0;padding:12px 0 14px;background:linear-gradient(to top,var(--paper) 70%,transparent)}
.wa,.tel{display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:14px;font:800 18px Cairo,Tahoma,Arial,sans-serif;text-decoration:none}.wa{flex:1;background:var(--wa);color:#fff}.tel{padding:0 20px;background:var(--ink);color:#fff}
footer{color:var(--mut);font-size:13px;margin-top:8px}footer p{margin:6px 0}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>${pixelJs}</head><body><div class="wrap">
<div class="top"><b>${esc(brand)}</b><button class="code" id="cc" type="button" aria-label="نسخ كود القطعة">${esc(code)}</button></div>
<h1>${esc(H.title)}</h1><p class="lead">${esc(H.sub)}</p>
<div class="stats"><div><strong>${esc(ap)}${esc(en(area))} م²</strong><small>المساحة</small></div><div><strong>${esc(f.dn || "")}</strong><small>${f.m ? "مجاورة " + esc(f.m) : "بني سويف الجديدة"}</small></div><div><strong>${f.cor ? "ناصية" : "عادية"}</strong><small>نوع القطعة</small></div></div>
${o.svg ? `<div class="map" id="mp">${o.svg}</div>` : ""}${rows ? `<ul class="rows" id="rows">${rows}</ul>` : ""}
${feats ? `<section class="card"><h2>واجهة القطعة</h2><ul>${feats}</ul></section>` : ""}
${priceBlock}
<footer><p>الكود <b dir="ltr">${esc(code)}</b> هو مرجع القطعة — اذكره في أي رسالة.</p><p>المساحة والمسافات من مخطط جهاز المدينة وتقريبية (المشي ≈ 80 م/دقيقة). المعاينة على الطبيعة هتأكّد كل حاجة.</p></footer>
</div><div class="wrap" style="padding:0 16px"><div class="ctas">${cta}${call}</div></div>
<script>(function(){var c=document.getElementById('cc');if(c)c.addEventListener('click',function(){var t=c.textContent;try{navigator.clipboard.writeText(t)}catch(e){}c.textContent='اتنسخ ✓';setTimeout(function(){c.textContent=t},1400)});
var m=document.getElementById('mp'),ls=document.querySelectorAll('#rows li');function set(k){if(!m)return;var on=m.querySelectorAll('[data-k]');for(var i=0;i<on.length;i++)on[i].classList.toggle('on',k&&on[i].getAttribute('data-k')===k);m.classList.toggle('dim',!!k);for(var j=0;j<ls.length;j++)ls[j].classList.toggle('on',!!k&&ls[j].getAttribute('data-k')===k)}
for(var i=0;i<ls.length;i++)ls[i].addEventListener('click',function(){var k=this.getAttribute('data-k');set(this.classList.contains('on')?'':k)});
var w=document.getElementById('wa');if(w)w.addEventListener('click',function(){try{if(window.fbq)fbq('track','Contact')}catch(e){}})})();</script></body></html>`;
  }

  // ===== الكتالوج (ملف HTML واحد لكل القطع) =====
  // ترتيب «الأنسب»: أقوى ميزة في الموقع + شوية من التانية + السعر تحت متوسط المنطقة يرفع، وفوقه بيخفض، ومن غير سعر أقل شوية. بيتحسب من حقايق الأطلس بس.
  function rank(it) {
    const C = it.claims || [], c = it.cmp; let sc = (C[0] ? C[0].s : 0) + (C[1] ? C[1].s * 0.3 : 0);
    if (c && c.level === "below") sc += Math.min(c.p, 25); else if (c && c.level === "above") sc -= Math.min(c.p, 30);
    if (!(it.ask > 0)) sc -= 5; return Math.round(sc * 10) / 10;
  }
  // o = { brand, phone, pixel, date, items:[{ code, d, dn, m, area, approx, cor, ask, ppm, cmp, chips:[], rows:[{k,ic,name,dtxt,mins}], svg, score }] }
  function catalogHtml(o) {
    const items = (o.items || []).slice(), brand = o.brand || "العراب للعقارات", phone = o.phone || "", tel = phoneIntl(phone), waBase = tel ? "https://wa.me/" + tel : "", px = /^\d{8,20}$/.test(String(o.pixel || "").trim()) ? String(o.pixel).trim() : "";
    const dists = [...new Map(items.map((i) => [i.d, i.dn])).entries()].sort((a, b) => a[0] - b[0]);
    const asks = items.map((i) => i.ask).filter((v) => v > 0), maxAsk = asks.length ? Math.max(...asks) : 0, minAsk = asks.length ? Math.min(...asks) : 0;
    const BUD = [500000, 1000000, 1500000, 2000000, 3000000, 5000000, 8000000].filter((v) => asks.length && v >= minAsk && v < maxAsk * 1.05 + 1);
    const areas = items.map((i) => Math.round(i.area)).filter((v) => v > 0), AR = [["0-250", "لحد 250 م²"], ["250-400", "من 250 لـ400 م²"], ["400-99999", "400 م² وأكتر"]].filter(([k]) => { const [a, b] = k.split("-").map(Number); return areas.some((v) => v >= a && v <= b); });
    const attr = (v) => esc(String(v));
    const cards = items.map((it, k) => {
      const area = Math.round(it.area), ap = it.approx ? "حوالي " : "", cm = it.cmp && it.cmp.level === "below" && it.cmp.p >= 8 ? it.cmp : null;
      const wa = waBase ? waLink(phone, waMsg(it.code, `أرض ${ap}${en(area)} م² — ${it.dn}`)) : "";
      const rows = (it.rows || []).map((r) => `<li data-k="${attr(r.k)}"><i>${esc(r.ic)}</i><b>${esc(r.name)}</b><span>${esc(r.dtxt)}${r.mins ? `<small>${esc(minTxt(r.mins))} مشي</small>` : ""}</span></li>`).join("");
      return `<article class="c" data-d="${attr(it.d)}" data-ask="${attr(it.ask > 0 ? Math.round(it.ask) : 0)}" data-area="${area}" data-cor="${it.cor ? 1 : 0}" data-sc="${attr(it.score || 0)}" data-o="${k}">
<div class="c-top"><span>${esc(it.dn)}${it.m ? " · مجاورة " + esc(it.m) : ""}</span><button class="code" type="button" data-cp aria-label="نسخ الكود">${esc(it.code)}</button></div>
<div class="c-area"><strong>${esc(ap)}${esc(en(area))} م²</strong>${it.cor ? `<em class="tag">ناصية</em>` : ""}</div>
<div class="c-price">${it.ask > 0 ? `<b>${esc(money(it.ask))} ج</b><small>${esc(en(it.ppm))} ج/م²</small>` : `<b class="nop">السعر على واتساب</b>`}</div>
${cm ? `<p class="cm">أقل من متوسط سعر المتر المعروض في ${it.cmp.scope === "mugawra" ? "المجاورة" : "الحي"} بحوالي ${esc(cm.p)}%</p>` : ""}
${it.chips && it.chips.length ? `<ul class="chips">${it.chips.slice(0, 2).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
<div class="c-act"><button class="more" type="button" aria-expanded="false">التفاصيل والخريطة</button>${wa ? `<a class="wa" href="${attr(wa)}" target="_blank" rel="noopener">💬 واتساب</a>` : ""}</div>
<div class="c-det" hidden><div class="map"></div>${rows ? `<ul class="rows">${rows}</ul>` : ""}<template>${it.svg || ""}</template></div></article>`;
    }).join("\n");
    const chipsD = dists.length > 1 ? `<div class="grp" role="group" aria-label="الحي"><button type="button" class="on" data-fd="all">كل الأحياء</button>${dists.map(([d, n]) => `<button type="button" data-fd="${attr(d)}" data-n="${attr(n)}">${esc(n)}</button>`).join("")}</div>` : "";
    const pixelJs = px ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${px}');fbq('track','PageView');</script>` : "";
    const title = `أراضي بني سويف الجديدة — ${en(items.length)} قطعة`, lead = `اختار الحي والميزانية، وابعتلنا كود القطعة على واتساب.`;
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(lead)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(lead)}">
<style>
${fontCss()}
:root{--ink:#0e2233;--mut:#5b6b7b;--paper:#f3f5f7;--card:#fff;--line:#d9e0e6;--acc:#0b7285;--wa:#16a34a;--good:#15803d}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.7 Cairo,Tahoma,Arial,sans-serif}
[hidden]{display:none!important}
.wrap{max-width:1080px;margin:0 auto;padding:0 16px}
.top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 0}.top b{font-size:17px}.cnt{color:var(--mut);font-size:14px}
h1{font-size:clamp(26px,6vw,38px);line-height:1.28;margin:6px 0 6px;font-weight:800;text-wrap:balance}.lead{color:var(--mut);font-size:17px;margin:0 0 16px;max-width:60ch;text-wrap:balance}
.flt{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:16px;display:flex;flex-direction:column;gap:10px}
.grp{display:flex;flex-wrap:wrap;gap:8px}.grp button{border:1.5px solid var(--line);background:var(--paper);color:var(--ink);border-radius:999px;padding:7px 14px;font:700 15px Cairo,Tahoma,Arial,sans-serif;cursor:pointer;min-height:40px}.grp button.on{border-color:var(--ink);background:var(--ink);color:#fff}
.sel{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;align-items:end}
.sel label{display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--mut)}.sel select{height:44px;border:1.5px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);font:16px Cairo,Tahoma,Arial,sans-serif;padding:0 10px}
.chk{flex-direction:row!important;align-items:center;gap:8px!important;height:44px;font-size:15px!important;color:var(--ink)!important}.chk input{width:20px;height:20px}
button:focus-visible,a:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid var(--acc);outline-offset:2px}
.res{display:flex;justify-content:space-between;align-items:center;color:var(--mut);font-size:14px;margin:0 2px 10px}
.list{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px;align-items:start;padding-bottom:110px}
.c{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:8px}
.c-top{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--mut);font-size:14px}
.code{border:1.5px solid var(--ink);border-radius:999px;background:transparent;color:var(--ink);font:700 13px/1 Cairo,Arial,sans-serif;padding:7px 11px;cursor:pointer;direction:ltr}
.c-area{display:flex;align-items:center;gap:8px}.c-area strong{font:800 28px/1.2 Cairo,Arial,Tahoma,sans-serif}.tag{font-style:normal;font-size:13px;font-weight:700;border:1.5px solid var(--acc);color:var(--acc);border-radius:999px;padding:1px 9px}
.c-price{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}.c-price b{font:800 21px Cairo,Arial,Tahoma,sans-serif}.c-price .nop{font:700 16px Cairo,Tahoma,Arial,sans-serif;color:var(--mut)}.c-price small{color:var(--mut);font-size:13.5px}
.cm{margin:0;color:var(--good);font-weight:700;font-size:14px}
.chips{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px;color:var(--mut);font-size:14.5px}.chips li:before{content:"• ";color:var(--acc)}
.c-act{display:flex;gap:8px;margin-top:4px}.more{flex:1;min-height:46px;border:1.5px solid var(--ink);background:transparent;color:var(--ink);border-radius:12px;font:700 15px Cairo,Tahoma,Arial,sans-serif;cursor:pointer}
.wa{flex:1;display:flex;align-items:center;justify-content:center;min-height:46px;border-radius:12px;background:var(--wa);color:#fff;text-decoration:none;font:800 16px Cairo,Tahoma,Arial,sans-serif}
.map{background:#0d1524;border-radius:12px;overflow:hidden;margin:6px 0 8px;border:1px solid #1d2a40}.map svg{display:block;width:100%;height:auto}.map.dim svg [data-k]{opacity:.22}.map.dim svg [data-k].on{opacity:1}
ul.rows{list-style:none;margin:0;padding:0;border:1px solid var(--line);border-radius:12px}ul.rows li{display:flex;align-items:center;gap:8px;padding:9px 11px;cursor:pointer;border-bottom:1px solid var(--line);font-size:15px}ul.rows li:last-child{border:0}ul.rows li.on{background:#e7f3f5}
ul.rows i{font-style:normal;font-size:20px;width:26px;text-align:center}ul.rows b{flex:1;font-weight:700}ul.rows span{font:800 15px Cairo,Arial,Tahoma,sans-serif;color:var(--acc);text-align:left;white-space:nowrap}ul.rows small{display:block;font:400 11.5px Tahoma;color:var(--mut)}
.none{background:var(--card);border:1px dashed var(--line);border-radius:14px;padding:22px;text-align:center;color:var(--mut);margin-bottom:20px}.none button{margin-top:10px;min-height:44px;padding:0 18px;border:1.5px solid var(--ink);border-radius:12px;background:transparent;font:700 15px Cairo,Tahoma,Arial,sans-serif;cursor:pointer}
footer{color:var(--mut);font-size:13px;padding:0 0 120px}footer p{margin:6px 0}
.cta{position:fixed;right:0;left:0;bottom:0;padding:12px 16px 14px;background:linear-gradient(to top,var(--paper) 70%,transparent)}.cta .wa{max-width:520px;margin:0 auto}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>${pixelJs}</head><body>${o.defs || ""}<div class="wrap">
<div class="top"><b>${esc(brand)}</b>${o.date ? `<span class="cnt">تحديث: ${esc(o.date)}</span>` : ""}</div>
<h1>أراضي بني سويف الجديدة</h1><p class="lead">${esc(lead)}</p>
<section class="flt" aria-label="تصفية القطع">${chipsD}<div class="sel">
${BUD.length ? `<label>الميزانية<select id="fb"><option value="0">أي ميزانية</option>${BUD.map((v) => `<option value="${v}">لحد ${esc(money(v))} ج</option>`).join("")}</select></label>` : ""}
${AR.length > 1 ? `<label>المساحة<select id="fa"><option value="">أي مساحة</option>${AR.map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select></label>` : ""}
<label>الترتيب<select id="fs"><option value="sc">الأنسب</option>${asks.length ? `<option value="pa">الأقل سعرًا</option>` : ""}<option value="aa">الأكبر مساحة</option><option value="ad">الأصغر مساحة</option></select></label>
<label class="chk"><input type="checkbox" id="fc">ناصية بس</label></div></section>
<div class="res"><span id="rc"></span></div>
<div class="none" id="none" hidden><p>مفيش قطعة بالفلتر ده دلوقتي.</p><p>غيّر الحي أو الميزانية، أو ابعتلنا اللي محتاجه ونرشّحلك.</p><button type="button" id="rst">رجّع الفلتر</button></div>
<div class="list" id="list">
${cards}
</div>
<footer><p>الكود مرجع القطعة — اذكره في أي رسالة.</p><p>المساحة والمسافات من مخطط جهاز المدينة وتقريبية (المشي ≈ 80 م/دقيقة). الأسعار هي المطلوبة من أصحاب القطع وبتتغيّر، فاسأل عن القطعة قبل المعاينة. المقارنة بالمتوسط مبنية على أسعار معروضة مش أسعار صفقات.</p></footer>
</div>${waBase ? `<div class="cta"><a class="wa" id="gwa" href="${esc(waBase)}" data-wa="${esc(waBase)}" target="_blank" rel="noopener">💬 ابعتلنا ميزانيتك ونرشّحلك</a></div>` : ""}
<script>(function(){var L=document.getElementById('list'),cs=[].slice.call(L.querySelectorAll('.c')),fd='all',fdn='';
function v(id){var e=document.getElementById(id);return e?e.value:''}
function ap(){var b=+v('fb')||0,a=v('fa'),cor=document.getElementById('fc').checked,s=v('fs'),n=0;
cs.sort(function(x,y){function g(c,k){return +c.getAttribute(k)}if(s==='pa'){var px=g(x,'data-ask')||9e12,py=g(y,'data-ask')||9e12;return px-py||g(y,'data-sc')-g(x,'data-sc')}if(s==='aa')return g(y,'data-area')-g(x,'data-area');if(s==='ad')return g(x,'data-area')-g(y,'data-area');return g(y,'data-sc')-g(x,'data-sc')||g(x,'data-o')-g(y,'data-o')});
cs.forEach(function(c){var ok=true,ask=+c.getAttribute('data-ask'),ar=+c.getAttribute('data-area');if(fd!=='all'&&c.getAttribute('data-d')!==fd)ok=false;if(ok&&b&&!(ask>0&&ask<=b))ok=false;if(ok&&a){var r=a.split('-');if(ar<+r[0]||ar>+r[1])ok=false}if(ok&&cor&&c.getAttribute('data-cor')!=='1')ok=false;c.hidden=!ok;if(ok)n++;L.appendChild(c)});
document.getElementById('rc').textContent=n+' قطعة';document.getElementById('none').hidden=n>0;L.hidden=n===0;
var g=document.getElementById('gwa');if(g){var m='السلام عليكم 👋\\nشفت كتالوج أراضي بني سويف الجديدة.';if(fdn)m+='\\nعايز أرض في '+fdn;var bs=document.getElementById('fb');if(b&&bs)m+='\\nميزانيتي '+bs.options[bs.selectedIndex].text;m+='\\nممكن ترشّحلي الأنسب؟';g.href=g.getAttribute('data-wa')+'?text='+encodeURIComponent(m)}}
[].forEach.call(document.querySelectorAll('[data-fd]'),function(b){b.addEventListener('click',function(){fd=b.getAttribute('data-fd');fdn=fd==='all'?'':b.getAttribute('data-n');[].forEach.call(document.querySelectorAll('[data-fd]'),function(x){x.classList.toggle('on',x===b)});ap()})});
['fb','fa','fs','fc'].forEach(function(id){var e=document.getElementById(id);if(e)e.addEventListener('change',ap)});
document.getElementById('rst').addEventListener('click',function(){fd='all';fdn='';[].forEach.call(document.querySelectorAll('[data-fd]'),function(x){x.classList.toggle('on',x.getAttribute('data-fd')==='all')});['fb','fa'].forEach(function(id){var e=document.getElementById(id);if(e)e.selectedIndex=0});document.getElementById('fc').checked=false;ap()});
L.addEventListener('click',function(e){var t=e.target,c=t.closest?t.closest('.c'):null;if(!c)return;
var cp=t.closest('[data-cp]');if(cp){var x=cp.textContent;try{var pr=navigator.clipboard.writeText(x);if(pr&&pr.catch)pr.catch(function(){})}catch(_){}cp.textContent='اتنسخ ✓';setTimeout(function(){cp.textContent=x},1300);return}
var mb=t.closest('.more');if(mb){var d=c.querySelector('.c-det'),open=d.hidden;if(open){var mp=d.querySelector('.map'),tp=d.querySelector('template');if(mp&&tp&&!mp.firstChild)mp.innerHTML=tp.innerHTML}d.hidden=!open;mb.setAttribute('aria-expanded',open?'true':'false');mb.textContent=open?'إخفاء التفاصيل':'التفاصيل والخريطة';return}
var li=t.closest('ul.rows li');if(li){var k=li.getAttribute('data-k'),mp2=c.querySelector('.map'),was=li.classList.contains('on'),all=c.querySelectorAll('ul.rows li');[].forEach.call(all,function(q){q.classList.remove('on')});var on=mp2?mp2.querySelectorAll('[data-k]'):[];[].forEach.call(on,function(q){q.classList.toggle('on',!was&&q.getAttribute('data-k')===k)});if(mp2)mp2.classList.toggle('dim',!was);if(!was)li.classList.add('on')}});
document.addEventListener('click',function(e){var a=e.target.closest?e.target.closest('a.wa'):null;if(a){try{if(window.fbq)fbq('track','Contact')}catch(_){}}});
ap()})();</script></body></html>`;
  }

  g.PMK = { placeName, pillTxt, valTxt, catalogHtml, rank, newSalt, refCode, normCode, isCode, codeFor, keyOfCode, phoneIntl, waLink, waMsg, claims, headline, adPack, adText, pageHtml, money, overlap, dTxt, minsOf, minTxt, r10, fontCss, esc, en };
})(typeof globalThis !== "undefined" ? globalThis : window);
