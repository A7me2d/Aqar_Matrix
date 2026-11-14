// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
const hrsTxt = (h) => ({ 0.25: "ربع ساعة", 0.5: "نص ساعة", 1: "ساعة", 2: "ساعتين", 12: "12 ساعة", 24: "يوم" })[+h || 4] || (h + " ساعات");
const PH = globalThis.PH, MATCH = globalThis.MATCH, LEADS = globalThis.LEADS, REPORT = globalThis.REPORT;
const $ = (id) => document.getElementById(id);
// 📋 نسخ آمن: لو الصفحة مش في الفوكس (أو المتصفح مانع) بنرجع للطريقة القديمة بدل ما نرمي خطأ
async function copyText(text) {
  text = String(text == null ? "" : text);
  try { await navigator.clipboard.writeText(text); return true; } catch {}
  try { const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;opacity:0;top:0;left:0"; document.body.appendChild(ta); ta.focus(); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok; } catch { return false; }
}
const SRCS = { all: "كل المصادر", wa: "🟢 واتساب", fb: "🔵 فيسبوك", mp: "🛒 ماركت بليس", ig: "🟣 إنستجرام" };
const WEB = window.__alaaWeb && window.__alaaWeb.isWeb ? window.__alaaWeb : null; // فاتح من جهاز تاني على السيرفر
const SRC1 = { wa: "واتساب", fb: "فيسبوك", mp: "ماركت بليس", ig: "إنستجرام" };
const UNIT1 = { land: "أرض", apartment: "شقة", villa: "فيلا", other: "وحدة" };
const DEFAULT_TPLS = [
  { name: "رد على سؤاله", text: "أهلًا أستاذ {الاسم} 👋\nشفت سؤالك عن {العرض}.\nمعاك {اسمي} — تحب أبعتلك التفاصيل والسعر النهائي ونحدد معاد معاينة؟" },
  { name: "عندي بدائل", text: "أهلًا أستاذ {الاسم}، لسه بتدور على {النوع} في {المنطقة}؟\nعندي كذا اختيار مناسب في حدود {الميزانية} — أبعتلك الصور والتفاصيل؟\n{اسمي}" },
  { name: "متابعة", text: "أهلًا أستاذ {الاسم}، كنت كلمت حضرتك بخصوص {النوع} في {المنطقة} — لسه مهتم؟\nلو حابب نحدد معاينة الأسبوع ده أنا تحت أمرك 🙏\n{اسمي}" },
];
const TYPES = { all: "الكل", request: "طلبات", offer: "عروض" };
const TYPE1 = { request: "طلب", offer: "عرض" };
const CATS = { all: "كل الأنواع", land: "🌾 أراضي", apartment: "🏢 شقق", villa: "🏡 فيلا", other: "📦 أخرى" };
const CAT1 = { land: "أراضي", apartment: "شقق", villa: "فيلا", other: "أخرى" };
const DEAL1 = { sale: "بيع" };
const PAGE = 120;
// ⚡ الرسم المؤجّل للكروت اللي برا الشاشة بيتقفل في اختبارات الأتمتة (innerText بيرجّع فاضي للمخفي) — إلا لو اتفرض: localStorage.alaaCV="1"
try { if (navigator.webdriver && localStorage.getItem("alaaCV") !== "1") document.documentElement.dataset.cv = "off"; } catch {}

// 10.69: كل قسم يتفتح من الشريط الجانبي بيبدأ «كأنه عمل رفرش» — رجوعك لقسم فتحته قبل كده بيعمل رفرش للصفحة (#v=<قسم>) وميكمّلش الإجراء القديم
const ALL_VIEWS = ["home", "today", "leads", "sellers", "posts", "listings", "atlas", "pick", "extract", "publish", "spread", "funnel", "wasend", "matches", "pipe", "saved", "stats", "settings", "aitools"];
// 10.80.57: شاشات اتدمجت/اتشالت — أي لينك أو هاش أو زرار قديم بيتحوّل للمكان الجديد: المغناطيس ← تاب في رشّحلي، سجل الـCRM ← أول مرحلة في الصفقات، جواز العقار وماركتينجي اتشالوا ← الرئيسية
const VIEW_ALIAS = { magnet: ["pick", "mag"], crm: ["pipe", "crm"], passport: ["home", ""], marketing: ["home", ""] };
const VIEW_FROM_V = (() => { const m = /^#v=([a-z]+)$/.exec(location.hash || ""); return m && ALL_VIEWS.includes(m[1]) ? m[1] : ""; })();
const state = {
  view: VIEW_FROM_V || ({ "#leads": "leads", "#new": "posts", "#deals": "posts", "#today": "today", "#sellers": "sellers", "#matches": "matches", "#saved": "saved", "#pipe": "pipe", "#crm": "crm", "#pick": "pick", "#publish": "publish", "#spread": "spread", "#funnel": "funnel", "#wasend": "wasend", "#passport": "passport", "#atlas": "atlas", "#marketing": "marketing", "#extract": "extract" })[location.hash] || (() => { try { const v = localStorage.getItem("alaaSkinV"), l = localStorage.getItem("alaaLanding"); return l === "home" || (l !== "posts" && v === "56") ? "home" : "posts"; } catch { return "posts"; } })(), src: "all",
  onlyBS: false, lOnlyBS: false, guideZone: "all", postDays: 60, onlyDeals: location.hash === "#deals", hideDups: false, lStage: "active", tplFor: "", type: "all", cat: "all", q: "", region: "", deal: "", group: "", sort: "new",
  hideDone: true, withPhone: false, withMatch: false, ownF: "", pur: "all", onlyNew: location.hash === "#new", shown: PAGE,
  open: new Set(), acc: (() => { try { const v = JSON.parse(localStorage.getItem("alaaSlotAcc") || "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; } })(), mCat: "all", mTier: (() => { try { const v = localStorage.getItem("alaaMTier"); return ["pure", "suspect", "office", "all"].includes(v) ? v : "pure"; } catch { return "pure"; } })(), mCombo: (() => { try { const v = localStorage.getItem("alaaMCombo"); return ["t1", "t2", "t3"].includes(v) ? v : "all"; } catch { return "all"; } })(), mHideDone: true, mStrong: false, sSrc: "all",
  lCat: "all", lLvl: 1, lMoney: "", lq: "", lRegion: "", lSrc: "", lSort: "score", lMultiPost: false, lMultiGroup: false, lPhone: false,
  lHideContacted: true, lBrokers: false, lShown: 60, lOpen: new Set(), lDays: 30, lOwner: "", lKind: "all", bestFor: "", lsFilter: "active",
  sCat: "all", sKind: "all", sCls: "all", lCls: "all", clsOpen: false, sq: "", sRegion: "", sDays: 30, sSort: "score", sOnlyArea: false, sPhone: false, sPriced: false, sWithBuyers: false, sShown: 60, sOpen: new Set(),
  mMin: 85, mBuyer: 1, mRegion: "", mOwner: false, mPhones: false, mOnlyArea: false, mShown: 80, mSort: "best", mNewOnly: false,
  sf: {}, mdKind: "offer", mdTab: "all",
};
// 🗂 تجميع التطابقات + 🆕 الجديد (لكل جهاز)
let grpOn = (() => { try { return localStorage.getItem("alaaGrpOn") !== "0"; } catch { return true; } })();
let matchSeenAt = (() => { try { return +localStorage.getItem("alaaMatchSeen") || 0; } catch { return 0; } })();
const NEW_WIN = 48 * 36e5;
// ⚡ العرض السريع (صف لكل مشتري) — شغال افتراضيًا، وبيتقفل من «⚡ عرض سريع» فوق
let fastOn = (() => { try { return localStorage.getItem("alaaFastOn") !== "0"; } catch { return true; } })();
let fastF = (() => { try { return localStorage.getItem("alaaFastF") === "new" ? "new" : "all"; } catch { return "all"; } })(); // «new» = لسه ما كلمتوش
let fastCur = "", fastRowsNow = [], fastMetaQ = Promise.resolve();
let grpOpen = null, grpHtml = "", grpCur = null, lastCards = null, justKeys = new Set(), prevPairKeys = null, lastJustToast = 0, lastRenderView = "";
let sellers = [], pairs = [], adPosts = {}, postJob = null, area = { gov: "بني سويف", focus: [], strict: false };
let leads = [], comments = {}, leadMeta = {};
let raw = {}, items = [], byId = new Map(), matches = new Map();
let settings = null, aiCfg = {}, autoCfg = {}, autoLog = null, aiStatus = null;
const aiLive = (s) => !!(s && s.running && Date.now() - (s.at || 0) < 5 * 6e4); // «بيحلل…» لو آخر تحديث من أقل من ٥ دقايق (لو الخلفية اتقتلت كان بيفضل ظاهر للأبد)
let listings = {}, team = [], sbCfg = {}, sbStatus = null, learning = { ok: false, n: 0 }, editingListing = "";
// 🎨 شكل البرنامج: ٦ ألوان × (فاتح / غامق / تلقائي) + الأشكال القديمة — بيتطبّق قبل أي رسم عشان مفيش وميض
const PALS = { nile: ["النيل", "#F5D88A", "#E3B04B", "#B9801F"], tech: ["تقني", "#2dd4bf", "#60a5fa", "#a78bfa"], gold: ["ذهبي", "#f6c453", "#eea23e", "#e0784a"], emerald: ["زمرد", "#34d399", "#10b981", "#a3e635"],
  ocean: ["محيط", "#38bdf8", "#3b82f6", "#6366f1"], sunset: ["غروب", "#fb7185", "#fb923c", "#fbbf24"], royal: ["ملكي", "#c084fc", "#818cf8", "#f472b6"] };
// ✨ ثيمات مبدعة: [الاسم، الوصف، معاينة الغامق [خلفية، كارت، تدرّج]، معاينة الفاتح]
const GRID = (c, s) => `linear-gradient(${c} 1px,transparent 1px) 0 0/${s}px ${s}px,linear-gradient(90deg,${c} 1px,transparent 1px) 0 0/${s}px ${s}px`;
const THEMES = {
  sign: ["اللافتة 🚏", "ألوان لافتات الشوارع — مربعات كبيرة لكل أداة وأزرار واضحة وصفحة رئيسية وعرض مضغوط", ["#0D1117", "#161C25", "linear-gradient(135deg,#1F5FD6,#FFC20E 55%,#F0483C)"], ["#E6E9ED", "#FFFFFF", "linear-gradient(135deg,#0B4FC2,#FFC20E 55%,#E5382B)"], "sign"],
  aqar: ["Aqar Matrix ⭐", "كحلي وذهبي من لوجو Aqar Matrix — مسطّح وهادي وخط Cairo، تابات فوق", ["#0B1626", "#112038", "linear-gradient(135deg,#F2D88F,#D4AE5A 55%,#B8892D)"], ["#F2F5FA", "#FFFFFF", "linear-gradient(135deg,#12335E,#12335E 50%,#C9A24E 50%)"]],
  araab: ["العراب 🧭", "تركواز هادي ومسطّح — الشكل اللي قبل Aqar Matrix", ["radial-gradient(70% 90% at 90% 0%,#25BEC840,transparent),#0C1E24", "#112A31", "linear-gradient(135deg,#6FE3E8,#25BEC8 55%,#0F8E9B)"], ["radial-gradient(70% 90% at 90% 0%,#0E7C8640,transparent),#EDF3F2", "#FFFFFF", "linear-gradient(135deg,#1E9FAB,#0E7C86 55%,#0A5A63)"]],
/*T45-BEGIN*/
  lapis: ["أزرق مصري 🔷", "لازورد وذهب — هيبة وهدوء، شريط علوي بنجمة ثمانية", ["radial-gradient(70% 90% at 90% 0%,#6A9EF540,transparent),#0B1626", "#11223A", "linear-gradient(135deg,#8DB8FF,#6A9EF5 55%,#4F83DE)"], ["radial-gradient(70% 90% at 90% 0%,#1F4FA040,transparent),#EEF2F7", "#FFFFFF", "linear-gradient(135deg,#2C62BE,#1F4FA0 55%,#17376F)"], "lapis"],
  limestone: ["حجر جيري 🪨", "لون الحجر وأخضر هادي — حواف كبيرة وظلال ناعمة", ["radial-gradient(70% 90% at 90% 0%,#7DBE9B40,transparent),#141916", "#1B221E", "linear-gradient(135deg,#9BD0B3,#7DBE9B 55%,#5FA583)"], ["radial-gradient(70% 90% at 90% 0%,#2F6B4F40,transparent),#F1F0EC", "#FBFBF9", "linear-gradient(135deg,#3E8061,#2F6B4F 55%,#245640)"], "limestone"],
  horizon: ["غروب النيل 🌇", "بنفسجي ليلي وخيط أفق دافي — غامق ناعم", ["radial-gradient(70% 90% at 90% 0%,#F2B58A40,transparent),#14172A", "#1D2140", "linear-gradient(135deg,#F7C9A3,#F2B58A 55%,#E58BA0)"], ["radial-gradient(70% 90% at 90% 0%,#6A4FC040,transparent),#F6F0F3", "#FFFFFF", "linear-gradient(135deg,#7E63D1,#6A4FC0 55%,#B24A72)"], "horizon"],
  stillnight: ["ليل هادي 🌙", "رمادي مخضر مسطّح من غير زحمة — أريح حاجة للعين بالليل", ["radial-gradient(70% 90% at 90% 0%,#8FCBAE40,transparent),#171D22", "#20282E", "linear-gradient(135deg,#A8DCC2,#8FCBAE 55%,#74B696)"], ["radial-gradient(70% 90% at 90% 0%,#1C6B7240,transparent),#EEF1F3", "#FFFFFF", "linear-gradient(135deg,#1F7C85,#1C6B72 55%,#14565C)"], "stillnight"],
  buildsite: ["ورشة بناء 🏗️", "جرافيت وأصفر تحذير — شغل جاد، حواف حادة وشريط ورشة", ["radial-gradient(70% 90% at 90% 0%,#F5B80040,transparent),#16181B", "#1F2226", "linear-gradient(135deg,#FFD233,#F5B800 55%,#E39B00)"], ["radial-gradient(70% 90% at 90% 0%,#F5B80040,transparent),#E8E8E4", "#FFFFFF", "linear-gradient(135deg,#FFC823,#F5B800 55%,#E39B00)"], "buildsite"],
  redsea: ["الغردقة 🌊", "فيروزي ومرجاني — حواف دايرية وموجة تحت العنوان", ["radial-gradient(70% 90% at 90% 0%,#3CCBD040,transparent),#08242B", "#0D3039", "linear-gradient(135deg,#5EE0E0,#3CCBD0 55%,#2AAFC0)"], ["radial-gradient(70% 90% at 90% 0%,#0A748040,transparent),#EAF6F6", "#FFFFFF", "linear-gradient(135deg,#0B7E88,#0A7480 55%,#0A5F70)"], "redsea"],
  pomegranate: ["توت ورمان 🍇", "عنابي ووردي — دافي وفخم، وخط حبّات رمان تحت العنوان", ["radial-gradient(70% 90% at 90% 0%,#F58AAB40,transparent),#1B0F18", "#26141F", "linear-gradient(135deg,#FFA9C4,#F58AAB 55%,#E0689A)"], ["radial-gradient(70% 90% at 90% 0%,#94204B40,transparent),#FAF1F4", "#FFFFFF", "linear-gradient(135deg,#B02A5B,#94204B 55%,#7A183E)"], "pomegranate"],
  notebook: ["كراسة وسبورة 📓", "نهار: ورق سطور وهايلايتر · ليل: سبورة وطباشير", ["radial-gradient(70% 90% at 90% 0%,#F6E27A40,transparent),#1E2B29", "#273837", "linear-gradient(135deg,#FBEA8F,#F6E27A 55%,#E8C95A)"], ["radial-gradient(70% 90% at 90% 0%,#2F4AC040,transparent),#F2F4F7", "#FFFEFB", "linear-gradient(135deg,#3B5BDB,#2F4AC0 55%,#2438A0)"], "notebook"],
  qahwa: ["قهوة ☕", "بني دافي وكراميل — أسطح هادية من غير حدود ظاهرة وحلقات فنجان", ["radial-gradient(70% 90% at 90% 0%,#DDA56E40,transparent),#1A1411", "#251C17", "linear-gradient(135deg,#EDBF93,#DDA56E 55%,#C58A52)"], ["radial-gradient(70% 90% at 90% 0%,#75421F40,transparent),#EFE6DD", "#FAF5EF", "linear-gradient(135deg,#8A5230,#75421F 55%,#5F3416)"], "qahwa"],
  lavender: ["لافندر 💜", "بنفسجي ناعم — كروت طايرة بظلال ملوّنة", ["radial-gradient(70% 90% at 90% 0%,#B4A0FB40,transparent),#15122A", "#1D1A38", "linear-gradient(135deg,#CBBBFF,#B4A0FB 55%,#9C86F0)"], ["radial-gradient(70% 90% at 90% 0%,#6544C640,transparent),#F2F0F8", "#FFFFFF", "linear-gradient(135deg,#7A5CD6,#6544C6 55%,#5236AB)"], "lavender"],
  inkstamp: ["ختم رسمي 🔖", "حبر وورق وختم أحمر — حواف حادة وخطوط واضحة جدًا", ["radial-gradient(70% 90% at 90% 0%,#FF756640,transparent),#0F0F10", "#181819", "linear-gradient(135deg,#FF9A8D,#FF7566 55%,#EE5646)"], ["radial-gradient(70% 90% at 90% 0%,#B3261E40,transparent),#F5F5F2", "#FFFFFF", "linear-gradient(135deg,#C62F25,#B3261E 55%,#8F1A14)"], "inkstamp"],
  neon: ["نيون القاهرة 🌃", "ليل القاهرة بأنوار نيون: حواف مضيئة وشبكة وخط متوهّج", ["radial-gradient(70% 90% at 90% 0%,#A98BFF40,transparent),#0A0716", "#130E27", "linear-gradient(135deg,#FF6BD6,#A98BFF 55%,#3DDCF5)"], ["radial-gradient(70% 90% at 90% 0%,#6D3FE040,transparent),#F4F0FF", "#FFFFFF", "linear-gradient(135deg,#C71F94,#6D3FE0 55%,#0A7C99)"], "neon"],
  deco: ["ذهب ملكي 👑", "آرت ديكو: إطار ذهبي مزدوج وورق ذهب على العناوين وأسود دافي", ["radial-gradient(70% 90% at 90% 0%,#E2B94740,transparent),#0C0B09", "#15130E", "linear-gradient(135deg,#F7E19B,#E2B947 55%,#C99A2E)"], ["radial-gradient(70% 90% at 90% 0%,#8A640940,transparent),#F6F1E4", "#FFFDF7", "linear-gradient(135deg,#966A0C,#8A6409 55%,#6B4C06)"], "deco"],
  khan: ["خان الخليلي 🏮", "جواهر شرقية: فيروز وزعفران وياقوت ومشربية بنجوم ذهبية", ["radial-gradient(70% 90% at 90% 0%,#FF9A6B40,transparent),#081C24", "#0F2B36", "linear-gradient(135deg,#FFD27A,#FF9A6B 55%,#F0609B)"], ["radial-gradient(70% 90% at 90% 0%,#0B657240,transparent),#F6EEDD", "#FFFAF0", "linear-gradient(135deg,#0F7C8C,#0B6572 55%,#084E58)"], "khan"],
  nubian: ["أسوان نوبي 🎨", "ألوان البيوت النوبية: طين وأوكر وفيروز وشريط مثلثات ملوّن وحواف ورقة", ["radial-gradient(70% 90% at 90% 0%,#FF8A4C40,transparent),#17110F", "#231A16", "linear-gradient(135deg,#FFC15E,#FF8A4C 55%,#F0507F)"], ["radial-gradient(70% 90% at 90% 0%,#A8340A40,transparent),#FBF1E3", "#FFFBF4", "linear-gradient(135deg,#C2410C,#A8340A 55%,#7C2506)"], "nubian"],
  oasis: ["زمرد الواحة 🌴", "أخضر زمردي وليموني: حواف ورقة نخلة وهالات خضرا ناعمة", ["radial-gradient(70% 90% at 90% 0%,#4ADE9A40,transparent),#06201A", "#0C2D25", "linear-gradient(135deg,#C6F36B,#4ADE9A 55%,#1FB8A5)"], ["radial-gradient(70% 90% at 90% 0%,#0F744940,transparent),#EDF7F1", "#FFFFFF", "linear-gradient(135deg,#12814F,#0F7449 55%,#0A5C3A)"], "oasis"],
  carbon: ["كربون سبورت 🏁", "ألياف كربون وأحمر سباق: حواف مقصوصة بزاوية وشريط رايات", ["radial-gradient(70% 90% at 90% 0%,#FF4B3E40,transparent),#0D0E10", "#16181B", "linear-gradient(135deg,#FF7A66,#FF4B3E 55%,#F0322A)"], ["radial-gradient(70% 90% at 90% 0%,#B71C2340,transparent),#E9EBEE", "#FFFFFF", "linear-gradient(135deg,#D4232B,#B71C23 55%,#8E141A)"], "carbon"],
  frost: ["ثلج وفضة ❄️", "زجاج متجمّد: كروت شفافة بضباب وحافة لامعة وندف ثلج", ["radial-gradient(70% 90% at 90% 0%,#8EC8F540,transparent),#0C1622", "#132235", "linear-gradient(135deg,#C8E8FF,#8EC8F5 55%,#9DB6F2)"], ["radial-gradient(70% 90% at 90% 0%,#1E63B840,transparent),#E8F1FA", "#FFFFFF", "linear-gradient(135deg,#2A70C8,#1E63B8 55%,#164C93)"], "frost"],
  mango: ["مانجو 🥭", "ألوان صيفية مبهجة: برتقالي ووردي وأصفر وزراير كبسولة وكروت بتتنطط", ["radial-gradient(70% 90% at 90% 0%,#FF9A4A40,transparent),#1E0F16", "#2B1620", "linear-gradient(135deg,#FFD166,#FF9A4A 55%,#FF5C8A)"], ["radial-gradient(70% 90% at 90% 0%,#C2410C40,transparent),#FFF4E6", "#FFFFFF", "linear-gradient(135deg,#CF4909,#C2410C 55%,#A8340A)"], "mango"],
  pearl: ["لؤلؤ 🤍", "مينيمال راقي: أبيض ناصع وخطوط شعرية ولمعة لؤلؤ متدرّجة", ["radial-gradient(70% 90% at 90% 0%,#CFE0FF40,transparent),#121316", "#1A1C20", "linear-gradient(135deg,#EDE4FF,#CFE0FF 55%,#FFE3D6)"], ["radial-gradient(70% 90% at 90% 0%,#262A3340,transparent),#F6F6F8", "#FFFFFF", "linear-gradient(135deg,#3A3F4B,#262A33 55%,#14161B)"], "pearl"],
  matrix: ["ماتريكس 🟩", "كود أخضر نازل زي الشاشة وكيرسر بيرمش — أسود وفوسفور", ["radial-gradient(70% 90% at 90% 0%,#1FE87240,transparent),#020805", "#07130C", "linear-gradient(135deg,#39FF88,#1FE872 55%,#16C95E)"], ["radial-gradient(70% 90% at 90% 0%,#08723640,transparent),#EDF6F0", "#FFFFFF", "linear-gradient(135deg,#0A8440,#087236 55%,#065B2B)"], "matrix"],
  cyber: ["سايبر بانك 🌆", "أصفر نيون وسماوي على أسود بنفسجي — زوايا مقطوعة زي واجهات المستقبل", ["radial-gradient(70% 90% at 90% 0%,#00F0FF40,transparent),#0A0A12", "#12121F", "linear-gradient(135deg,#FCEE09,#00F0FF 55%,#FF2A6D)"], ["radial-gradient(70% 90% at 90% 0%,#00677A40,transparent),#FFF8D2", "#FFFFFF", "linear-gradient(135deg,#D6006B,#00677A 55%,#5E1CC4)"], "cyber"],
  redteam: ["الفريق الأحمر 🟥", "أسود وأحمر دم وشرايط تحذير — هجوم مركّز", ["radial-gradient(70% 90% at 90% 0%,#FF4D5540,transparent),#0B0708", "#160E10", "linear-gradient(135deg,#FF6B6B,#FF4D55 55%,#F04452)"], ["radial-gradient(70% 90% at 90% 0%,#A5101F40,transparent),#F6F0F0", "#FFFFFF", "linear-gradient(135deg,#C4162A,#A5101F 55%,#7F0B17)"], "redteam"],
  soc: ["غرفة العمليات 🛰️", "أزرق ليلي ورادار سماوي وأقواس HUD — لوحة مراقبة أمنية", ["radial-gradient(70% 90% at 90% 0%,#22B8F240,transparent),#050C17", "#0B1627", "linear-gradient(135deg,#3DDCFF,#22B8F2 55%,#3C93FF)"], ["radial-gradient(70% 90% at 90% 0%,#0A5E9640,transparent),#E9F1F8", "#FFFFFF", "linear-gradient(135deg,#0877B8,#0A5E96 55%,#0B4676)"], "soc"],
  crt: ["شاشة العنبر 🟧", "أمبر فوسفوري وخطوط مسح CRT زي حاسبات الثمانينات", ["radial-gradient(70% 90% at 90% 0%,#FF9A1F40,transparent),#0E0904", "#181009", "linear-gradient(135deg,#FFB000,#FF9A1F 55%,#FF8433)"], ["radial-gradient(70% 90% at 90% 0%,#8F4A0040,transparent),#F4E8D0", "#FFF8E8", "linear-gradient(135deg,#A85A00,#8F4A00 55%,#6E3800)"], "crt"],
  ghost: ["الشبح 👻", "أبيض وأسود صامت وخلل (Glitch) على العناوين وعلامات تسجيل على الحواف", ["radial-gradient(70% 90% at 90% 0%,#E2E2E240,transparent),#070707", "#101010", "linear-gradient(135deg,#FFFFFF,#E2E2E2 55%,#C8C8C8)"], ["radial-gradient(70% 90% at 90% 0%,#1B1B1B40,transparent),#F1F1F1", "#FFFFFF", "linear-gradient(135deg,#2B2B2B,#1B1B1B 55%,#000000)"], "ghost"],
  darkweb: ["الويب المظلم 🕸️", "بنفسجي سام وأخضر حمضي على خلايا سداسية — شبكة خفية", ["radial-gradient(70% 90% at 90% 0%,#A66BFF40,transparent),#09050F", "#130C21", "linear-gradient(135deg,#C79BFF,#A66BFF 55%,#7CFFB2)"], ["radial-gradient(70% 90% at 90% 0%,#5E1BB540,transparent),#F2EDFA", "#FFFFFF", "linear-gradient(135deg,#7A2CD8,#5E1BB5 55%,#3E1080)"], "darkweb"],
  code: ["محرر الكود ⌨️", "ألوان محرّر أكواد على رمادي فحمي — أقواس وتعليقات في العناوين", ["radial-gradient(70% 90% at 90% 0%,#C792EA40,transparent),#0E1016", "#171A22", "linear-gradient(135deg,#82AAFF,#C792EA 55%,#A8E070)"], ["radial-gradient(70% 90% at 90% 0%,#7B3FC440,transparent),#F3F4F8", "#FFFFFF", "linear-gradient(135deg,#2B58C4,#7B3FC4 55%,#1F7A3A)"], "code"],
  bios: ["شاشة BIOS 🟦", "أزرق DOS وإطارات مزدوجة وظلال صلبة — زي شاشات إعداد الجهاز القديمة", ["radial-gradient(70% 90% at 90% 0%,#55FFFF40,transparent),#00005E", "#00007A", "linear-gradient(135deg,#FFFF55,#55FFFF 55%,#7CFF7C)"], ["radial-gradient(70% 90% at 90% 0%,#00666640,transparent),#C6C6C6", "#E6E6E6", "linear-gradient(135deg,#0000AA,#006666 55%,#7A0A7A)"], "bios"],
  synth: ["سينث ويف 🌇", "غروب نيون بشمس مقسومة وأرضية شبكة — خيال أفلام الثمانينات", ["radial-gradient(70% 90% at 90% 0%,#FF9A3D40,transparent),#0D0221", "#180638", "linear-gradient(135deg,#FF5CCB,#FF9A3D 55%,#FFE14D)"], ["radial-gradient(70% 90% at 90% 0%,#B84A0F40,transparent),#F8EEFF", "#FFFFFF", "linear-gradient(135deg,#C2108F,#B84A0F 55%,#7A2FD0)"], "synth"],
/*T45-END*/
  cyberneon: ["سايبر ⚡", "نيون وشبكة مضيئة — روح تقنية خالصة", [GRID("rgba(0,240,255,.14)", 14) + ",#05060a", "#0b0e1a", "linear-gradient(135deg,#00f0ff,#7c3aed 55%,#ff2bd6)"], [GRID("rgba(124,58,237,.12)", 14) + ",#f2f4ff", "#fff", "linear-gradient(135deg,#00b8d4,#7c3aed 55%,#e11d9b)"]],
  glass: ["زجاج 🫧", "ألواح زجاج شفافة فوق ألوان ناعمة", ["radial-gradient(60% 90% at 90% 10%,#6366f1aa,transparent),radial-gradient(60% 90% at 10% 90%,#db2777aa,transparent),#0a0b18", "rgba(24,28,58,.6)", "linear-gradient(135deg,#8b93ff,#ff7ac6 55%,#5ee7df)"], ["radial-gradient(60% 90% at 90% 10%,#ffc6e3,transparent),radial-gradient(60% 90% at 10% 90%,#c2d9ff,transparent),#f4f1ff", "rgba(255,255,255,.6)", "linear-gradient(135deg,#7c83ff,#ff6fb8 55%,#2cc9bf)"]],
  blueprint: ["بلوبرنت 📐", "لوحة مهندس: شبكة وخطوط تقسيم", [GRID("rgba(255,255,255,.16)", 12) + ",#0b3561", "#0d3e6f", "#ffd166"], [GRID("rgba(29,78,216,.14)", 12) + ",#f5f9ff", "#fff", "#1d4ed8"]],
  luxe: ["فخامة 👑", "أسود وذهبي — لعرض المشاريع الكبيرة", ["radial-gradient(80% 70% at 50% 0%,rgba(212,169,76,.25),transparent),#0b0b0c", "#131315", "linear-gradient(135deg,#f7dc8f,#d4a94c 55%,#9c7a31)"], ["radial-gradient(80% 70% at 50% 0%,rgba(212,169,76,.25),transparent),#f8f4ea", "#fffdf7", "linear-gradient(135deg,#e2bf68,#b8892f 55%,#8c6a22)"]],
  desert: ["صحراء 🏜", "رملي دافي ومريح جدًا للعين", ["radial-gradient(70% 90% at 90% 0%,rgba(232,138,111,.3),transparent),#1a1410", "#231b15", "linear-gradient(135deg,#e88a6f,#e9b076 55%,#8cc2a7)"], ["radial-gradient(70% 90% at 90% 0%,rgba(224,122,95,.25),transparent),#f4ecdf", "#fffaf2", "linear-gradient(135deg,#e07a5f,#e9a868 55%,#81b29a)"]],
  mono: ["مينيمال 🔳", "أبيض وأسود صافي من غير زحمة ألوان", ["#0d0d0d", "#151515", "#f5f5f5"], ["#f6f6f6", "#fff", "#111"]],
  candy: ["حلوى 🍬", "باستيل ناعم ومبهج وزراير مدوّرة", ["radial-gradient(60% 90% at 90% 0%,rgba(255,143,171,.35),transparent),#1a1222", "#231830", "linear-gradient(135deg,#ff9fb8,#c9b0ff 55%,#8ad0ff)"], ["radial-gradient(60% 90% at 90% 0%,#ffd6e5,transparent),radial-gradient(60% 90% at 0% 100%,#d6efff,transparent),#fff5fa", "#fff", "linear-gradient(135deg,#ff8fab,#c3a6ff 55%,#7cc8ff)"]],
  pharaoh: ["فرعوني 🏺", "لازورد وذهب وفيروز — طابع مصري", ["radial-gradient(70% 90% at 90% 0%,rgba(240,199,94,.25),transparent),#0b1a3a", "#10244d", "repeating-linear-gradient(90deg,#f0c75e 0 10px,#2ec4b6 10px 14px,#e07a3f 14px 18px,#2ec4b6 18px 22px)"], ["repeating-linear-gradient(0deg,rgba(120,90,40,.06) 0 2px,transparent 2px 6px),#f2e7cc", "#fbf5e4", "repeating-linear-gradient(90deg,#c99a2e 0 10px,#1f9e94 10px 14px,#c25e2a 14px 18px,#1f9e94 18px 22px)"]],
};
const LEGACY = { pro: "احترافي", classic: "كلاسيك", plan: "مخطط", nile: "ليل النيل" };
const MODES = { light: "☀️ فاتح", dark: "🌙 غامق", auto: "🕒 تلقائي" };
let uiSkin = "aqar", uiMode = "dark", lastPal = "aqar";
// 🎨 10.64: عشرة أشكال للافتة (ألوان + زراير) — الأصلي «orig». الأسماء والعيّنات في sgv-data.js
const SGV_LIST = (window.SGV && Array.isArray(window.SGV.list) && window.SGV.list.length) ? window.SGV.list : [{ id: "azure", ar: "أزرق تقني", en: "Azure", desc: "الأساسي", sw: ["#1D4ED8", "#7BA8FF", "#6B8FE8", "#B7CCF8", "#0B0F1A"], br: 14 }];
const SGV_DEF = "azure"; // 10.80.49: لون واحد أو لونين بس (24 لون) — «لافتة الشارع» اتشالت
let uiSgv = SGV_DEF;
function applySgv(id) {
  if (!SGV_LIST.some((x) => x.id === id)) id = SGV_DEF;
  uiSgv = id; document.documentElement.dataset.sgv = id;
  { const cur = SGV_LIST.find((x) => x.id === id); if (cur && cur.tabs) document.documentElement.dataset.tabs = cur.tabs; else delete document.documentElement.dataset.tabs; } // 10.80.42: تبويبات متناسقة للأشكال الجديدة
  try { localStorage.setItem("alaaSgv", id); } catch {}
  paintSkinUi();
}
// 🧩 10.68: الهيئات (لافتة = الأصلي / ناعم / تقني / زجاجي) فوق أي لون من الـ16 وأي وضع. الأسماء في sgv-data.js
const LOOK_LIST = (window.SGV && Array.isArray(window.SGV.looks) && window.SGV.looks.length) ? window.SGV.looks : [{ id: "edifice", ar: "الصرح", en: "Edifice", desc: "الشكل الوحيد" }];
const LOOK_DEF = "aurora"; // 10.80.59: «أورورا» هو الشكل الأساسي (الدوك الزجاجي)
const LOOK_CLASSIC = "edifice"; // «الصرح» (الشريط الجانبي) — الستايلات الـ20 بتشتغل معاه بس
let uiLook = LOOK_DEF;
function applyLook(id) {
  if (!LOOK_LIST.some((x) => x.id === id)) id = LOOK_DEF;
  // 10.80.58: الأشكال الجديدة (الأفق/القمرة/بنتو/بلوك/أورورا) = «الصرح» + هيئة فوقه (data-form): كل المكوّنات والألوان والأوضاع بتفضل شغّالة، والهيكل والملمس بيتغيّروا جذريًا
  const cur = LOOK_LIST.find((x) => x.id === id), de = document.documentElement;
  uiLook = id; de.dataset.look = cur && cur.form ? "edifice" : id;
  if (cur && cur.form) de.dataset.form = id; else delete de.dataset.form;
  if (typeof syncStyleAttr === "function") { try { syncStyleAttr(); } catch {} }
  try { window.dispatchEvent(new Event("sb-refresh")); } catch {}
  try { localStorage.setItem("alaaLook", id); } catch {}
  paintSkinUi();
}
// تبديل ناعم: كلاس بيفعّل انتقال الألوان ~0.4 ثانية بس وقت اختيارك (مش وقت فتح البرنامج)
let lkFadeT = 0;
function lkFade() {
  const h = document.documentElement; h.classList.add("lk-fade"); clearTimeout(lkFadeT);
  lkFadeT = setTimeout(() => h.classList.remove("lk-fade"), 450);
}
const realMode = (m) => m !== "auto" ? m : ((h) => h >= 6 && h < 18 ? "light" : "dark")(new Date().getHours()); // تلقائي: فاتح بالنهار وغامق بالليل
function applySkin(s, m) {
  // 10.63: «اللافتة» هي الشكل الوحيد — أي شكل قديم (محفوظ عندك أو جاي من جهاز تاني) بيتحوّل ليها. (alaaLegacyDev=1 للاختبارات بس، مفيش زرار ولا إعداد بيفعّله)
  let legacyDev = false; try { legacyDev = localStorage.getItem("alaaLegacyDev") === "1"; } catch {}
  if (!legacyDev) s = "sign";
  if (s === "aurora") s = "nile";
  if (!PALS[s] && !THEMES[s] && !LEGACY[s]) s = "sign";
  if (!MODES[m]) m = "dark";
  uiSkin = s; uiMode = m; if (PALS[s] || THEMES[s]) lastPal = s;
  const h = document.documentElement;
  delete h.dataset.pal; delete h.dataset.mode; delete h.dataset.shape;
  if (PALS[s] || THEMES[s]) { const rm = realMode(m); h.dataset.skin = "studio"; h.dataset.pal = s; h.dataset.mode = rm; h.dataset.theme = rm; h.dataset.skinTheme = "1"; if (THEMES[s] && THEMES[s][4]) h.dataset.shape = THEMES[s][4]; }
  else if (s === "classic") { delete h.dataset.skin; if (h.dataset.skinTheme) { delete h.dataset.theme; delete h.dataset.skinTheme; } }
  else { h.dataset.skin = s; if (s === "plan" || s === "pro") { h.dataset.theme = "light"; h.dataset.skinTheme = "1"; } else if (h.dataset.skinTheme) { delete h.dataset.theme; delete h.dataset.skinTheme; } }
  try { localStorage.setItem("alaaSkin", s); localStorage.setItem("alaaMode", m); } catch {}
  paintSkinUi();
  // الرئيسية خاصة بشكل «اللافتة»: لو بدّلت لشكل تاني وانت عليها نرجعك للطلبات والعروض (مش صفحة فاضية)
  try { if (s !== "sign" && typeof state !== "undefined" && state.view === "home") { state.view = "posts"; if (typeof render === "function") render(); } } catch {}
}
// 🎭 10.80.52: الستايلات (20) — فوق «الصرح» والألوان والوضع: كل ستايل بألوانه (فاتح/غامق) وشكل الأيقونات والزراير والكروت والشريط الجانبي والخلفية والخطوط. الأسماء والعيّنات في styles52-data.js
const SX_LIST = (window.SX && Array.isArray(window.SX.list)) ? window.SX.list : [];
const SX_ORIG = { id: "", ar: "الصرح (الأصلي)", desc: "الشكل الأساسي بالـ24 لون بتاعتك", tags: ["الأساسي"], L: ["#EDEFF5", "#FAFAFC", "#10141E", "#1D4ED8", "#7BA8FF", "#153799"], D: ["#0B0F1A", "#1C202A", "#EBECEF", "#4D7BFF", "#7BA8FF", "#94A9E6"], br: 14, r: 20, bw: 1, bs: "solid", tp: "32%", tile: "soft", side: "float", clip: "", sh: "none", shD: "none", bgi: { L: "none", D: "none" } };
let uiStyle = "", uiStyleCol = "own";
function applyStyle(id) {
  if (!SX_LIST.some((x) => x.id === id)) id = "";
  uiStyle = id; syncStyleAttr();
  try { localStorage.setItem("alaaStyle", id); } catch {}
  paintStyleUi();
}
// 10.80.58: الستايلات (الـ20) متصمّمة فوق «الصرح» الأساسي — لما شكل تاني (الأفق/القمرة/…) يبقى شغّال الستايل بيقف مؤقتًا (محفوظ) ويرجع مع «الصرح»
function syncStyleAttr() { const h = document.documentElement; if (uiStyle && !h.dataset.form) h.dataset.style = uiStyle; else delete h.dataset.style; }
function applyStyleCol(v) {
  uiStyleCol = v === "mine" ? "mine" : "own"; const h = document.documentElement;
  if (uiStyleCol === "mine") h.dataset.scol = "mine"; else delete h.dataset.scol;
  try { localStorage.setItem("alaaStyleCol", uiStyleCol); } catch {}
  paintStyleUi();
}
function paintStyleUi() {
  if (!document.body) return;
  const x_ = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const card = (x) => {
    const vars = `--lbg:${x.L[0]};--lsf:${x.L[1]};--ltx:${x.L[2]};--la:${x.L[3]};--lb:${x.L[4]};--lc:${x.L[5]};--dbg:${x.D[0]};--dsf:${x.D[1]};--dtx:${x.D[2]};--da:${x.D[3]};--db:${x.D[4]};--dc:${x.D[5]};` +
      `--lsh:${x.sh};--dsh:${x.shD};--lbgi:${x.bgi.L};--dbgi:${x.bgi.D};--pr:${Math.min(14, Math.round(x.r / 2))}px;--pt:${x.tp};--pbr:${x.br >= 99 ? 9 : Math.min(9, x.br)}px;--pbw:${x.bw >= 2 ? 2 : x.bw ? 1 : 0}px;--pbs:${x.bs};--plnk:${x.bw >= 2 ? 100 : x.bs === "dashed" ? 55 : 22}%;${x.clip ? `--pcl:${x.clip};` : ""}`;
    const on = uiStyle === x.id;
    return `<button type="button" class="sx-card${on ? " on" : ""}" data-style-pick="${x_(x.id)}" aria-pressed="${on}" title="${x_(x.ar)} — ${x_(x.desc)}" style="${x_(vars)}">` +
      `<span class="sx-pv${x.side === "rail" ? " rail" : ""}${["outline", "holo", "flat"].includes(x.tile) ? " tout" : ""}${["glow", "grad"].includes(x.tile) ? " tglow" : ""}" aria-hidden="true"><span class="sx-sd"><i></i><i></i><i></i></span><span class="sx-cd"></span><span class="sx-bt"></span><span class="sx-bt"></span><span class="sx-kp"></span></span>` +
      `<span class="sx-sw" aria-hidden="true"><i></i><i></i><i></i></span><b>${x_(x.ar)}</b><small>${x_(x.desc)}</small><em>${x_(x.tags.join(" · "))}</em></button>`;
  };
  const html = [SX_ORIG, ...SX_LIST].map(card).join("");
  document.querySelectorAll("[data-styles]").forEach((box) => { if (box.dataset.sxh !== html) { box.innerHTML = html; box.dataset.sxh = html; } box.querySelectorAll(".sx-card").forEach((c) => { const on = c.dataset.stylePick === uiStyle; c.classList.toggle("on", on); c.setAttribute("aria-pressed", String(on)); }); });
  document.querySelectorAll("[data-sxcount]").forEach((e) => { e.textContent = SX_LIST.length + " ستايل"; });
  document.querySelectorAll("[data-sx-col]").forEach((b) => { const own = uiStyleCol !== "mine"; b.textContent = own ? "🎨 ألوان الستايل ✓" : "🎨 ألواني أنا"; b.classList.toggle("on", own); b.title = own ? "الستايل شغّال بألوانه — دوس عشان تستخدم لونك من قايمة الألوان" : "الستايل شغّال بلونك المختار — دوس عشان يرجع لألوانه"; });
  const sb = document.getElementById("styBtn"); if (sb) { const cur = SX_LIST.find((x) => x.id === uiStyle); sb.title = cur ? "الستايل: " + cur.ar + " — دوس تغيّره" : "الستايلات: " + SX_LIST.length + " ستايل بألوان وأيقونات وزراير وكروت مختلفة"; sb.classList.toggle("sx-on", !!cur); }
}
async function pickStyle(id) {
  lkFade();
  if (id && document.documentElement.dataset.form) { applyLook(LOOK_CLASSIC); chrome.storage.local.set({ uiLook: uiLook }); } // الستايل بيشتغل مع «الصرح» بس — اختياره بيرجّع الشكل ليه
  applyStyle(id); await chrome.storage.local.set({ uiStyle: uiStyle });
  const x = SX_LIST.find((v) => v.id === uiStyle); toast(x ? "🎭 الستايل: " + x.ar : "↩ من غير ستايل");
}
async function setStyleCol(v) { lkFade(); applyStyleCol(v); await chrome.storage.local.set({ uiStyleCol: uiStyleCol }); toast(uiStyleCol === "mine" ? "🎨 الستايل بلونك المختار" : "🎨 الستايل بألوانه"); }
// 🔠 حجم الكلام والأيقونات (الافتراضي أكبر درجة)
const SCALES = [[1, "عادي"], [1.1, "أكبر شوية"], [1.2, "كبير"], [1.3, "كبير جدًا"]];
let uiScale = 1.1;
function applyScale(v) {
  v = +v; if (!(v >= 0.9 && v <= 1.4)) v = 1.1; uiScale = v;
  // تكبير حقيقي (زي Ctrl +) عشان الترتيب يتظبط لوحده: جوه البرنامج الـ main بيعمله، وفي كروم نكبّر التاب
  if (WEB) { /* من جهاز تاني: تكبير المتصفح نفسه (Ctrl + / −، أو بصباعين على الموبايل) أحسن وأدق */ }
  else if (!window.alaaApp) {
    try { chrome.tabs.getCurrent((t) => { if (t && t.id != null) Promise.resolve(chrome.tabs.setZoom(t.id, v)).catch(() => { document.documentElement.style.zoom = String(v); }); else document.documentElement.style.zoom = String(v); }); }
    catch { document.documentElement.style.zoom = String(v); }
  }
  try { localStorage.setItem("alaaScale", String(v)); } catch {}
  paintSkinUi();
}
function paintSkinUi() {
  if (!document.body) return;
  document.querySelectorAll("[data-scales]").forEach((box) => {
    if (WEB) { box.innerHTML = `<span class="muted" style="font-size:13px">من الجهاز ده: كبّر وصغّر بـ <b>Ctrl و + / −</b> (أو بصباعين على الموبايل)</span>`; return; }
    box.innerHTML = SCALES.map(([v, l], i) => `<button data-scale-pick="${v}" class="${Math.abs(uiScale - v) < 0.01 ? "on" : ""}" title="${l}"><b style="font-size:${12 + i * 3}px">أ</b><small>${l}${v === 1.1 ? " ⭐" : ""}</small></button>`).join("");
  });
  const rm = realMode(uiMode);
  document.querySelectorAll("[data-modes]").forEach((box) => {
    box.innerHTML = Object.entries(MODES).map(([k, v]) => `<button data-mode-pick="${k}" class="${uiMode === k ? "on" : ""}">${v}</button>`).join("");
  });
  const mb = document.getElementById("modeBtn");
  if (mb) { mb.textContent = rm === "dark" ? "☀️" : "🌙"; mb.title = rm === "dark" ? "حوّل للفاتح" : "حوّل للغامق"; }
  const x_ = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  document.querySelectorAll("[data-looks]").forEach((box) => {
    box.innerHTML = LOOK_LIST.map((x) => `<button type="button" class="lk-card${uiLook === x.id ? " on" : ""}" data-look-pick="${x_(x.id)}" aria-pressed="${uiLook === x.id}" title="${x_(x.ar)} — ${x_(x.desc)}">` +
      `<span class="lk-pv lk-pv-${x_(x.id)}" aria-hidden="true"><i class="t"></i><i class="c"></i><i class="p"></i></span>` +
      `<b>${x_(x.ar)}</b>${x.id === LOOK_DEF ? `<em class="hero">★ الأساسي</em>` : x.nw ? `<em>✨ جديد</em>` : ""}<small>${x_(x.desc)}</small></button>`).join("");
  });
  document.querySelectorAll("[data-sgvs].sgv-dots").forEach((box) => {
    box.innerHTML = SGV_LIST.map((x) => `<button type="button" class="sgv-dot${uiSgv === x.id ? " on" : ""}" data-sgv-pick="${x_(x.id)}" aria-pressed="${uiSgv === x.id}" aria-label="${x_(x.ar)}" title="${x_(x.ar)} — ${x_(x.desc)}" style="--p:${x_(x.sw[0])};--a:${x_(x.sw[1])}"><span class="dd"></span></button>`).join("");
    const cap = box.parentElement && box.parentElement.querySelector("[data-sgvcap]"), cur = SGV_LIST.find((v) => v.id === uiSgv) || SGV_LIST[0];
    if (cap) cap.innerHTML = `<b>${x_(cur.ar)}</b>${x_(cur.desc)}`;
    const hn = box.parentElement && box.parentElement.querySelector("h4 small"); if (hn) hn.textContent = SGV_LIST.length + " لون";
  });
  document.querySelectorAll("[data-sgvs]:not(.sgv-dots)").forEach((box) => {
    box.innerHTML = SGV_LIST.map((x) => `<button type="button" class="sgv-card${uiSgv === x.id ? " on" : ""}" data-sgv-pick="${x_(x.id)}" aria-pressed="${uiSgv === x.id}" title="${x_(x.ar)} — ${x_(x.desc)}">` +
      `<span class="sgv-sw" style="--p:${x_(x.sw[0])};--a:${x_(x.sw[1])};--n:${x_(x.sw[4])};--sr:${x.br >= 999 ? 9 : Math.min(9, x.br)}px"><i></i><i></i><u></u></span>` +
      `<b>${x_(x.ar)}</b>${x.orig ? `<em class="sgv-orig">★ الأصلي</em>` : x.nw ? `<em class="sgv-new">✨ جديد</em>` : `<em class="sgv-en">${x_(x.en)}</em>`}<small>${x_(x.desc)}</small></button>`).join("");
  });
  const tb = document.getElementById("thmBtn"); if (tb) tb.title = "الشكل: الصرح + " + SGV_LIST.length + " لون (لون واحد أو لونين) + الوضع وحجم الكلام وصفحة البداية";
}
// 🎨 10.42: الهوية الجديدة «النيل» — مرة واحدة بس بننقل الكل ليها (وبعدها اللي تختاره بيتحفظ)
try {
  if (localStorage.getItem("alaaSkinV") !== "62") { const was = localStorage.getItem("alaaSkinV"); localStorage.setItem("alaaSkinV", "62"); localStorage.setItem("alaaSkin", "sign"); localStorage.setItem("alaaMode", "light"); if (was === "56" && !localStorage.getItem("alaaLanding")) localStorage.setItem("alaaLanding", "home"); } // 10.62: شكل «اللافتة» — مرة واحدة بس (وبعدها اللي تختاره بيتحفظ)
  applySkin(localStorage.getItem("alaaSkin") || "sign", localStorage.getItem("alaaMode") || "light");
} catch { applySkin("sign", "light"); }
try { applySgv(localStorage.getItem("alaaSgv") || SGV_DEF); } catch { applySgv(SGV_DEF); }
try { if (localStorage.getItem("alaaLookV") !== "13") { localStorage.setItem("alaaLookV", "13"); localStorage.setItem("alaaLook", LOOK_DEF); } applyLook(localStorage.getItem("alaaLook") || LOOK_DEF); } catch { applyLook(LOOK_DEF); }
try { applyScale(localStorage.getItem("alaaScale") || 1.1); } catch { applyScale(1.1); }
try { applyStyleCol(localStorage.getItem("alaaStyleCol") || "own"); applyStyle(localStorage.getItem("alaaStyle") || ""); } catch { applyStyle(""); }
chrome.storage.local.get(["uiStyle", "uiStyleCol"]).then((o) => { applyStyleCol(o.uiStyleCol || "own"); applyStyle(o.uiStyle || ""); });
chrome.storage.local.get("uiScale").then((o) => applyScale(o.uiScale == null ? 1.1 : o.uiScale));
chrome.storage.local.get(["uiSkin", "uiMode", "uiSkinPicked", "uiSkinV", "uiSgv", "uiLook", "uiLookV"]).then((o) => {
  if (o.uiSgv && !SGV_LIST.some((x) => x.id === o.uiSgv)) chrome.storage.local.set({ uiSgv: SGV_DEF }); // 10.80.49: لون قديم اتشال (لافتة الشارع وغيره) → الأساسي
  applySgv(o.uiSgv || SGV_DEF); // 10.64: اللون المختار (بيتزامن بين الأجهزة)
  if (o.uiLookV !== 13) { chrome.storage.local.set({ uiLook: LOOK_DEF, uiLookV: 13 }); applyLook(LOOK_DEF); } else applyLook(o.uiLook || LOOK_DEF); // 10.68: الهيئة — ولمرة واحدة (10.80.59) الكل بيتنقل لـ«أورورا»، وبعدها اللي تختاره بيتحفظ
  // الافتراضي «النيل» — ولمرة واحدة بس (10.42) بننقل الكل للهوية الجديدة، وبعدها اللي تختاره بيتحفظ
  if (o.uiSkinV !== 62) { chrome.storage.local.set({ uiSkin: "sign", uiMode: "light", uiSkinV: 62, uiSkinPicked: true }); applySkin("sign", "light"); return; } // 10.62: «اللافتة» الجديد
  { let dev0 = false; try { dev0 = localStorage.getItem("alaaLegacyDev") === "1"; } catch {} applySkin(dev0 && o.uiSkin ? o.uiSkin : "sign", o.uiMode || "light"); } // (علم الاختبار alaaLegacyDev=1 بس بيسيب الشكل القديم)
  if (o.uiSkin && o.uiSkin !== "sign") { let dev = false; try { dev = localStorage.getItem("alaaLegacyDev") === "1"; } catch {} if (!dev) chrome.storage.local.set({ uiSkin: "sign" }); } // 10.63: شكل قديم متخزّن → اللافتة
});
chrome.storage.onChanged.addListener((c) => { if (c.uiScale) applyScale(c.uiScale.newValue); });
chrome.storage.onChanged.addListener((c) => { if (c.viewPrefs && typeof applyViewPrefs === "function" && typeof applyView === "function") { try { applyViewPrefs(c.viewPrefs.newValue, true); } catch (e) { console.warn("viewPrefs", e); } } });
chrome.storage.onChanged.addListener((c) => { if (c.uiSgv) applySgv(c.uiSgv.newValue); });
chrome.storage.onChanged.addListener((c) => { if (c.uiLook) applyLook(c.uiLook.newValue); });
chrome.storage.onChanged.addListener((c) => { if (c.uiStyleCol) applyStyleCol(c.uiStyleCol.newValue); if (c.uiStyle) applyStyle(c.uiStyle.newValue); });
chrome.storage.onChanged.addListener((c) => { if (c.uiSkin || c.uiMode) applySkin(c.uiSkin ? c.uiSkin.newValue : uiSkin, c.uiMode ? c.uiMode.newValue : uiMode); });
setInterval(() => { if (uiMode === "auto" && (PALS[uiSkin] || THEMES[uiSkin]) && document.documentElement.dataset.mode !== realMode("auto")) applySkin(uiSkin, uiMode); }, 60000);
document.addEventListener("DOMContentLoaded", paintSkinUi);
document.addEventListener("DOMContentLoaded", paintStyleUi);
async function pickSgv(id) { lkFade(); applySgv(id); if (uiStyle && uiStyleCol !== "mine") { applyStyleCol("mine"); chrome.storage.local.set({ uiStyleCol: "mine" }); } await chrome.storage.local.set({ uiSgv: uiSgv }); const x = SGV_LIST.find((v) => v.id === uiSgv) || SGV_LIST[0]; toast("🎨 اللون: " + x.ar + (x.orig ? " (الأصلي)" : "")); }
async function pickLook(id) { lkFade(); applyLook(id); await chrome.storage.local.set({ uiLook: uiLook }); const x = LOOK_LIST.find((v) => v.id === uiLook) || LOOK_LIST[0]; toast("🧩 الشكل: " + x.ar + (uiLook === LOOK_DEF ? " (الأساسي)" : "") + (uiStyle && x.form ? " — الستايل واقف مؤقتًا ويرجع مع «الصرح»" : "")); }
async function resetLook() { lkFade(); applyLook(LOOK_DEF); applySgv(SGV_DEF); await chrome.storage.local.set({ uiLook: LOOK_DEF, uiSgv: SGV_DEF }); toast("↩ رجع الشكل واللون الأساسيين"); }
async function pickSkin(s, m, msg) { lkFade(); applySkin(s, m); await chrome.storage.local.set({ uiSkin: uiSkin, uiMode: uiMode, uiSkinPicked: true }); toast("🎨 " + msg); }
document.addEventListener("click", (e) => {
  const pop = document.getElementById("thmPop");
  if (e.target.closest("#thmBtn")) { pop.hidden = !pop.hidden; const sp0 = document.getElementById("styPop"); if (sp0) sp0.hidden = true; return; }
  if (e.target.closest("#modeBtn")) { const nm = realMode(uiMode) === "dark" ? "light" : "dark"; pickSkin("sign", nm, MODES[nm]); return; }
  { const sp = document.getElementById("styPop");
    if (e.target.closest("#styBtn")) { if (sp) sp.hidden = !sp.hidden; if (pop) pop.hidden = true; return; }
    const stp = e.target.closest("[data-style-pick]"); if (stp) { pickStyle(stp.dataset.stylePick); return; }
    if (e.target.closest("[data-style-reset]")) { pickStyle(""); return; }
    if (e.target.closest("[data-sx-rand]")) { const ids = SX_LIST.map((x) => x.id).filter((i) => i !== uiStyle); if (ids.length) pickStyle(ids[Math.floor(Math.random() * ids.length)]); return; }
    if (e.target.closest("[data-sx-col]")) { setStyleCol(uiStyleCol === "mine" ? "own" : "mine"); return; }
    if (sp && !sp.hidden && !e.target.closest("#styPop")) sp.hidden = true; }
  const sgp = e.target.closest("[data-sgv-pick]");
  if (sgp) { pickSgv(sgp.dataset.sgvPick); return; }
  const lkp = e.target.closest("[data-look-pick]");
  if (lkp) { pickLook(lkp.dataset.lookPick); return; }
  if (e.target.closest("[data-look-reset]")) { resetLook(); return; }
  const zp = e.target.closest("[data-scale-pick]");
  if (zp) { const v = +zp.dataset.scalePick; applyScale(v); chrome.storage.local.set({ uiScale: v }); toast("🔠 حجم الكلام: " + SCALES.find((x) => x[0] === v)[1]); return; }
  const mp = e.target.closest("[data-mode-pick]");
  if (mp) { const m = mp.dataset.modePick; pickSkin("sign", m, MODES[m]); return; }
  if (pop && !pop.hidden && !e.target.closest("#thmPop")) pop.hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (!WEB && (e.ctrlKey || e.metaKey) && !e.altKey && (e.key === "=" || e.key === "+" || e.key === "-")) {
    e.preventDefault(); const i = SCALES.findIndex((x) => Math.abs(x[0] - uiScale) < 0.01), n = SCALES[Math.max(0, Math.min(SCALES.length - 1, (i < 0 ? 1 : i) + (e.key === "-" ? -1 : 1)))];
    applyScale(n[0]); chrome.storage.local.set({ uiScale: n[0] }); toast("🔠 " + n[1]); return;
  }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { const p = document.getElementById("thmPop"); if (p) p.hidden = true; const q = document.getElementById("styPop"); if (q) q.hidden = true; } });
// اسم اللون ووصفه تحت النقط وانت معدّي عليها (من غير ما يتغيّر حاجة لحد ما تدوس)
(function () {
  const capOf = (el) => el.closest(".sgv-dots") && el.closest(".sgv-dots").parentElement.querySelector("[data-sgvcap]");
  const put = (cap, x) => { cap.innerHTML = ""; const b = document.createElement("b"); b.textContent = x.ar; cap.append(b, document.createTextNode(x.desc)); };
  const show = (e) => { const d = e.target.closest && e.target.closest(".sgv-dot"); if (!d) return; const cap = capOf(d), x = SGV_LIST.find((v) => v.id === d.dataset.sgvPick); if (cap && x) put(cap, x); };
  const back = (e) => { const d = e.target.closest && e.target.closest(".sgv-dot"); if (!d) return; const cap = capOf(d), x = SGV_LIST.find((v) => v.id === uiSgv); if (cap && x) put(cap, x); };
  document.addEventListener("mouseover", show); document.addEventListener("focusin", show);
  document.addEventListener("mouseout", back); document.addEventListener("focusout", back);
})();
let mineSeenCache = {};
let trustFix = {}, allItems = [], trustMemo = null;
// 🛣 مسارات السحب: fbLanes = كل المسارات الشغّالة دلوقتي [{key, kind, q}] — fbQ = مسار اللفة الكبيرة/اليدوي (للتوافق)
const LANE_KEYS = ["fbQueue", "__q.fast", "__q.mine", "__q.deep", "__q.m1", "__q.m2"];
const laneKindOf = (q) => (q && q.fast ? "fast" : q && q.mineJob ? "mine" : q && q.deepJob ? "deep" : q && q.auto ? "auto" : "manual");
const LANE_NAME = { fast: "⚡ الصياد", mine: "🏷 هاتلي مشتري", deep: "🔎 دوّر على الأرقام", auto: "📘 الدورة", manual: "✋ سحب يدوي" };
let fbLanes = [], lanesCfgV = {};
function readLanes(d) {
  const now = Date.now();
  fbLanes = LANE_KEYS.map((k) => ({ key: k, q: d[k] })).filter((x) => x.q && x.q.running && Array.isArray(x.q.list) && now - (x.q.updatedAt || x.q.startedAt || 0) < 25 * 6e4).map((x) => ({ key: x.key, q: x.q, kind: laneKindOf(x.q) }));
  fbQ = (fbLanes.find((l) => l.kind === "auto" || l.kind === "manual") || {}).q || null;
  lanesCfgV = d.lanesCfg || {};
}
const laneQ = (kind) => (fbLanes.find((l) => l.kind === kind) || {}).q || null;
let savedSearches = [], alertCfg = {}, aiLeads = {}, mineSlots = null, mineHits = {}, mineDis = {}, mineJob = {}, mineCfg = {}, fbQ = null, mineDeep = {}, mineDeepJob = {};
let crmReg = {}, pipe = {}, commCfg = {}, matchFb = {}, learnInfo = { wm: {}, n: 0, up: 0, dn: 0, on: false, detail: {} }, wmKey = "{}";
let deals = new Map(), clusters = new Map(), templates = DEFAULT_TPLS, myName = "", outCfg = {}, dealCfg = {}, reportCfg = {}, lastReport = null;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// ===== 🏠 «المالك» (10.71.3): تبريز الكلمة + تصنيف صاحب البوست — المنطق كله في ownmark.js =====
const HAS_OWN = typeof OWNMK !== "undefined";
const OH = (t) => (HAS_OWN ? OWNMK.html(t, esc) : esc(t));                                                                     // نص كامل متبرّز
const OHS = (t, n) => (HAS_OWN ? OWNMK.html(OWNMK.snip(t, n), esc) : esc(String(t ?? "").replace(/\s+/g, " ").slice(0, n)));       // مقتطف متبرّز (كلمة المالك بتبان حتى لو بعيدة)
// 🔗 رابط البوست الحقيقي (جوّا الجروب). لو لسه مش معروف: نفتح الجروب نفسه (مش صفحة بحث أبدًا)
const postLink = (p, cls = "open-link", lbl = "🔗 افتح البوست") => p && p.url
  ? `<a class="${cls}" href="${esc(p.url)}" target="_blank">${lbl}</a>`
  : p && p.groupUrl ? `<a class="${cls}" href="${esc(p.groupUrl)}" target="_blank" title="رابط البوست نفسه لسه ما ظهرش — بيفتح الجروب">👥 افتح الجروب</a>` : "";
// ⚡ فورماتر الأرقام/التواريخ بيتبني مرة واحدة (إنشاؤه كل مرة كان أبطأ بـ50 ضعف وبيتنادى آلاف المرات في كل تحديث للشاشة)
const NF_AR = new Intl.NumberFormat("ar-EG-u-nu-latn");
const ar = (n) => NF_AR.format(Number(n || 0)); // رقم بالعربي
const fmtN = (v) => NF_AR.format(Math.round(v));
const _DTF = new Map();
const dtf = (o) => { const k = o ? Object.keys(o).map((x) => x + "=" + o[x]).join(",") : ""; let f = _DTF.get(k); if (!f) { f = new Intl.DateTimeFormat("ar-EG-u-nu-latn", o || undefined); _DTF.set(k, f); } return f; };
const dts = (t, o) => { const d = new Date(t); return isNaN(d) ? "" : dtf(o).format(d); }; // تاريخ بالعربي (فاضي لو الوقت مش صالح)
function toast(t) { const e = $("toast"); e.textContent = t; e.classList.add("on"); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove("on"), 1800); }
const tOf = (p) => p.ts || p.scannedAt;
const _WD = { day: "numeric", month: "short" }, _WT = { hour: "numeric", minute: "2-digit" };
function fmtWhen(p) {
  const t = tOf(p); if (!(t > 0)) return "";
  return dts(t, _WD) + " " + dts(t, _WT);
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// ================= تحميل =================
// ⚡ الداتا التقيلة (البوستات والتعليقات) بتتحسب في «عامل» في الخلفية عشان الشاشة ما تهنّجش،
// والحاجات الخفيفة (حالة السحب، الإعدادات الصغيرة) بتتحدث لوحدها من غير ما نعيد حساب كل حاجة
const HEAVY_KEYS = ["posts", "comments", "settings", "leadMeta", "aiLeads", "dealCfg"];
const LIGHT_KEYS = ["aiCfg", "autoCfg", "autoLog", "aiStatus", "templates", "myName", "reportCfg", "lastReport", "listings", "team", "sbCfg", "sbStatus",
  "adPosts", "postJob", "savedSearches", "alertCfg", "huntCfg", "mineSlots", "mineHits", "mineDis", "mineJob", "mineCfg", "fbQueue", "__q.fast", "__q.mine", "__q.deep", "__q.m1", "__q.m2", "lanesCfg", "trustFix", "mineSeen", "mineDeep", "mineDeepJob",
  "scrapeHealth", "pipeDeals", "commCfg", "matchFb", "crmReg", "outCfg"];
let scrapeHealth = null;
let engineT = null, matchesSynced = false, heavyAt = 0, heavyMs = 0, firstHeavy = true;
async function loadLight() {
  const d = await chrome.storage.local.get(LIGHT_KEYS);
  adPosts = d.adPosts || {}; postJob = d.postJob || null;
  listings = d.listings || {}; team = d.team || []; sbCfg = d.sbCfg || {}; sbStatus = d.sbStatus || null;
  templates = d.templates && d.templates.length ? d.templates : DEFAULT_TPLS; myName = d.myName || "";
  reportCfg = d.reportCfg || {}; lastReport = d.lastReport || null;
  savedSearches = Array.isArray(d.savedSearches) ? d.savedSearches : []; alertCfg = d.alertCfg || {};
  aiCfg = d.aiCfg || {}; autoCfg = d.autoCfg || {}; autoLog = d.autoLog || null; aiStatus = d.aiStatus || null;
  mineSeenCache = d.mineSeen || {}; scrapeHealth = d.scrapeHealth || null;
  outCfg = d.outCfg || {}; pipe = d.pipeDeals || {}; commCfg = d.commCfg || {}; matchFb = d.matchFb || {}; crmReg = d.crmReg || {};
  mineSlots = d.mineSlots || null; mineHits = d.mineHits || {}; mineDis = d.mineDis || {}; trustFix = d.trustFix || {}; mineJob = d.mineJob || {}; mineCfg = d.mineCfg || {}; readLanes(d); mineDeep = d.mineDeep || {}; mineDeepJob = d.mineDeepJob || {}; applyDeepPhones(FULL.leads, FULL.sellers, FULL.pairs);
  if ($("mineFb")) $("mineFb").checked = (d.huntCfg || {}).mine !== false;
  paintLive();
}
// ⏳ شريط «بيسحب دلوقتي» — ظاهر في كل الصفحات (وفي أي جهاز فاتح على السيرفر)
function paintLive() {
  // 🕶 10.80.51: شريط «بيسحب دلوقتي» اتشال خالص — السحب والنشر والواتساب شغّالين في الخلفية من غير ما يظهر أي حاجة قدامك.
  // (حالة المسارات لسه موجودة في الإعدادات ← «مسارات السحب» لو حبيت تتابعها أو توقّفها)
  const el = $("liveBar"); if (el) { if (!el.hidden) el.hidden = true; if (el.innerHTML) el.innerHTML = ""; }
  paintLanesCard();
}
// كارت «🛣 مسارات السحب» في الإعدادات: المسارات الشغّالة + إيقاف + وضع الحماية
function paintLanesCard() {
  const box = $("lnLive"); if (!box) return;
  const now = Date.now(), prot = (lanesCfgV.protectUntil || 0) > now;
  { const h = fbLanes.length ? fbLanes.map((L) => { const q = L.q; return `<div class="lane-row" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:6px 0"><span class="lb-dot"></span><b>${LANE_NAME[L.kind] || "فيسبوك"}</b> <span class="muted">${Math.min((q.i || 0) + 1, q.list.length)} من ${q.list.length}${q.added ? ` · اتضاف ${q.added}` : ""} · من ${Math.max(0, Math.round((now - (q.startedAt || now)) / 6e4))} د</span> <button class="btn sm" data-lnstop="${esc(L.key)}">⏹ وقّف</button></div>`; }).join("") : `<div class="muted sm">مفيش سحب شغّال دلوقتي.</div>`; if (box._h !== h) { box._h = h; box.innerHTML = h; } } // مفيش إعادة رسم لو الناتج هو هو (السحب بيغيّر التخزين كتير)
  if ($("lnStopAll")) $("lnStopAll").disabled = !fbLanes.length;
  { const e = $("lnProt"); if (e) { const h = prot ? `🛡 <b>وضع الحماية شغّال</b> — ${esc(lanesCfgV.protectWhy || "فيسبوك قيّد الحساب")} · ينتهي ${new Date(lanesCfgV.protectUntil).toLocaleTimeString("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit" })}` : ""; if (e._h !== h) { e._h = h; e.innerHTML = h; } } }
  if ($("lnProtOff")) $("lnProtOff").hidden = !prot;
}
function fillLanes() {
  if (!$("lnOn")) return;
  $("lnOn").checked = lanesCfgV.on !== false; $("lnMax").value = String(Math.max(2, Math.min(6, Math.round(+lanesCfgV.max) || 4)));
  paintLanesCard();
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-lnstop]"); if (!b) return;
  const r = await chrome.runtime.sendMessage({ type: "lanesStop", key: b.dataset.lnstop }).catch(() => null); toast(r && r.ok ? "⏹ بيوقّف المسار ده…" : "❌ ما اتوقفش");
});
(() => { // السكربت في آخر الصفحة — العناصر موجودة
  const on = (id, fn) => { const x = $(id); if (x) x.onclick = fn; };
  on("lnSave", async () => { const cur = (await chrome.storage.local.get("lanesCfg")).lanesCfg || {}; const v = { ...cur, on: $("lnOn").checked, max: +$("lnMax").value || 4 }; await chrome.storage.local.set({ lanesCfg: v }); lanesCfgV = v; $("lnMsg").textContent = "✅ اتحفظ"; toast("🛣 اتحفظت إعدادات المسارات"); });
  on("lnStopAll", async () => { const r = await chrome.runtime.sendMessage({ type: "lanesStop" }).catch(() => null); toast(r && r.ok ? `⏹ بيوقّف ${r.n} مسار…` : "❌ ما اتوقفش"); });
  on("lnProtOff", async () => { await chrome.runtime.sendMessage({ type: "lanesProtectClear" }).catch(() => {}); toast("🛡 اتفك وضع الحماية — السحب يرجع"); });
})();
setInterval(paintLive, 30000);
// ارتفاع شريط «بيسحب دلوقتي» → الشرايط اللاصقة التانية (غرفة القيادة) بتنزل تحته مش فوقه
try { const lb = $("liveBar"); if (lb) { const setL = () => document.documentElement.style.setProperty("--lbh", lb.hidden ? "0px" : Math.round(lb.getBoundingClientRect().height) + "px"); new ResizeObserver(setL).observe(lb); new MutationObserver(setL).observe(lb, { attributes: true, attributeFilter: ["hidden"] }); setL(); } } catch {} // الشريط فوق خالص (فوق الهيدر اللاصق) — الهيدر والشرايط اللاصقة اللي تحته بتنزل بارتفاعه
document.addEventListener("click", (e) => { if (e.target.closest("[data-webshot]") && WEB) WEB.showScreen(""); });
// ---- العامل ----
let EW, ewSeq = 0, ewPending = null, ewWhy = "", ewRetryAt = 0;
function engine() {
  if (EW === null && ewRetryAt && Date.now() > ewRetryAt) EW = undefined; // العامل وقع قبل كده؟ نجرّب نشغّله تاني بعد دقيقتين
  if (EW !== undefined) return EW;
  try {
    EW = new Worker("engine-worker.js");
    EW.onmessage = onEngine;
    EW.onerror = (e) => { console.warn("engine worker:", e.message); ewWhy = "onerror: " + String(e.message || e.type || "").slice(0, 160); EW = null; ewRetryAt = Date.now() + 120000; matchesSynced = false; if (ewPending) { const p = ewPending; ewPending = null; p.rej(new Error("worker")); } };
  } catch (e) { EW = null; ewRetryAt = Date.now() + 120000; ewWhy = "ctor: " + String((e && e.message) || e).slice(0, 160); }
  return EW;
}
function onEngine(e) {
  const m = e.data || {};
  if (m.TT) { window.__engineTT = m.TT; console.debug("engine", m.ms, JSON.stringify(m.TT)); }
  if (m.error) { console.warn("engine:", m.error); if (ewPending && ewPending.id === m.id) { const p = ewPending; ewPending = null; p.rej(new Error(m.error)); } return; }
  if (m.phase === 0) { if (ewPending && ewPending.id === m.id && ewPending.alive) ewPending.alive(); return; }
  if (m.phase === 2) { // التطابق خلص بعد ما كل حاجة اتعرضت
    if (m.id !== ewSeq) return;
    if (m.failed) { matchesSynced = false; setBusy(false); return; } // حساب التطابق وقع ← نفضل على اللي عندنا ونحسب كامل المرة الجاية
    matches = m.matches || new Map(); matchesSynced = true; setBusy(false); render(); return;
  }
  if (ewPending && ewPending.id === m.id) { const p = ewPending; ewPending = null; p.res(m); }
}
let engineInfo = { mode: "—" };
function engineRun(payload) {
  const w = engine();
  if (!w) return Promise.reject(new Error("no worker" + (ewWhy ? " — " + ewWhy : "")));
  if (ewPending) { ewPending.rej(new Error("superseded")); ewPending = null; matchesSynced = false; } // العامل هيكمّل الطلب القديم ويقدّم حالته (ST) وراح نتجاهل دلتاه ← الطلب الجاي لازم يحسب كامل
  // ⏱ لو العامل ما ردّش في وقت معقول: نقفله ونحسب هنا (البرنامج عمره ما يفضل فاضي)
  const limit = 25000 + Object.keys(payload.posts || {}).length * 2;
  return new Promise((res, rej) => {
    const id = ++ewSeq;
    const kill = (why) => { if (ewPending && ewPending.id === id) { ewPending.rej(new Error(why)); try { w.terminate(); } catch {} EW = null; ewWhy = why; ewRetryAt = Date.now() + 120000; matchesSynced = false; } };
    const t = setTimeout(() => kill("timeout"), limit);
    const t0 = setTimeout(() => kill("worker-silent"), 8000 + Object.keys(payload.posts || {}).length * 1.5); // العامل ما بدأش خالص (الداتا الكبيرة محتاجة وقت أطول عشان توصله)
    ewPending = { id, alive: () => clearTimeout(t0), res: (m) => { clearTimeout(t); clearTimeout(t0); res(m); }, rej: (e) => { clearTimeout(t); clearTimeout(t0); ewPending = null; rej(e); } };
    try { w.postMessage({ id, needFull: !matchesSynced, ...payload }); } catch (e) { clearTimeout(t); ewPending = null; rej(e); }
  });
}
// لو العامل مش متاح لأي سبب: نحسب هنا زي زمان
function computeInline(posts, cmts, st, meta, ai, dealPct, wm, deep) {
  const errs = [], safe = (k, fn, def) => { try { return fn(); } catch (e) { errs.push(k + ": " + String((e && e.message) || e).slice(0, 160)); return def; } };
  const all = safe("enrich", () => MATCH.enrichAll(posts, st), []), compiled = PH.compile(st), cs = compiled.cats;
  let its = all.filter((p) => cs.includes(p.category));
  if (compiled.extractFocus) its = safe("focus", () => its.filter((p) => PH.focusOk(p.text, p, compiled, p.forceRegion)), its);
  let { leads: Ls, learning: lr } = safe("leads", () => LEADS.buildAll(its, cmts, compiled, meta, ai), { leads: [], learning: { ok: false, n: 0 } });
  Ls = Ls.filter((L) => !L.categories.length || L.categories.some((c) => cs.includes(c)));
  const Ss = safe("sellers", () => LEADS.buildSellers(its, cmts, compiled, meta).map((S) => ({ ...S, units: S.units.filter((u) => cs.includes(u.category)) })).filter((S) => S.units.length), []);
  safe("phones", () => { const PI = MATCH.phoneIndex(posts || {}, cmts || {}, deep || {}); PI.fill(Ls); PI.fill(Ss); }, null); // 📞 رقم الشخص من أي بوست/تعليق تاني ليه
  return { items: its, T: safe("trust", () => MATCH.trustIndex(all, cmts, {}, compiled), null), leads: Ls, learning: lr, sellers: Ss,
    pairs: safe("pairs", () => MATCH.pairUp(Ls.filter(MATCH.pairBuyerOk), Ss.filter((S) => S.status !== "hidden"), { min: 50, perBuyer: 6, wm: wm || null }), []),
    deals: safe("deals", () => MATCH.findDeals(its, dealPct), new Map()), clusters: safe("clusters", () => MATCH.clusterUnits(its), new Map()),
    matches: safe("matches", () => MATCH.buildMatches(its), new Map()), full: true, errs, stats: { posts: Object.keys(posts || {}).length, analyzed: all.length, shown: its.length } };
}
function setBusy(on, txt) {
  let el = $("busyChip");
  if (!el) { el = document.createElement("span"); el.id = "busyChip"; el.className = "busy-chip"; const t = document.querySelector(".tb-tools"); if (t) t.prepend(el); }
  el.hidden = !on; if (on) el.textContent = txt || "⏳ بيحدّث الداتا…";
}
async function loadHeavy() {
  const t0 = Date.now();
  const hv = chrome.storage.local.vers ? await chrome.storage.local.vers(["posts"]).catch(() => null) : null; // الإصدار قبل القراءة (عشان نعرف إيه اللي جه بعدها)
  const d = await chrome.storage.local.get(HEAVY_KEYS);
  heavyVer = hv ? hv.posts : null;
  comments = d.comments || {}; leadMeta = d.leadMeta || {}; raw = d.posts || {}; settings = d.settings || null; aiLeads = d.aiLeads || {}; dealCfg = d.dealCfg || {};
  const compiled = PH.compile(settings); compiledG = compiled; cats = compiled.cats;
  area = { gov: compiled.gov, focus: (settings && settings.focus) || [], strict: !!(settings && settings.strictFocus) };
  const big = Object.keys(raw).length > 1500;
  if (big || firstHeavy) setBusy(true, firstHeavy && big ? "⏳ بيجهّز الداتا…" : "⏳ بيحدّث الداتا…");
  let R;
  let mode = "worker", why = "";
  learnInfo = MATCH.learnWeights(matchFb); wmKey = JSON.stringify(learnInfo.wm); // 🧠 أوزان اتعلمناها من 👍/👎
  try { R = await engineRun({ posts: raw, comments, settings, leadMeta, aiLeads, dealPct: (dealCfg.pct || 15) / 100, wm: learnInfo.wm, deep: mineDeep || {} }); }
  catch (e) {
    if (String(e.message) === "superseded") return false;
    mode = "inline"; why = String(e.message || e);
    await PH.ancReady(); R = computeInline(raw, comments, settings, leadMeta, aiLeads, (dealCfg.pct || 15) / 100, learnInfo.wm, mineDeep || {}); matchesSynced = false;
  }
  engineInfo = { mode, why, at: Date.now(), ms: Date.now() - t0, errs: R.errs || [], stats: R.stats || {}, tt: R.TT || null, wms: R.ms || null };
  if (engineInfo.errs.length) console.warn("engine stage errors:", engineInfo.errs.join(" | "));
  R = R || {};
  items = R.items || []; allItems = []; engineT = R.T || null; trustMemo = null;
  byId = new Map(items.map((p) => [p.id, p]));
  leads = R.leads || []; learning = R.learning || { ok: false, n: 0 }; sellers = R.sellers || []; pairs = R.pairs || []; deals = R.deals || new Map(); clusters = R.clusters || new Map();
  if (R.matches) { matches = R.matches; matchesSynced = true; }
  else if (R.delta) { for (const id of R.dropped || []) matches.delete(id); for (const [k, v] of R.delta) { if (v && v.length) matches.set(k, v); else matches.delete(k); } }
  else if (R.full === true || R.phase === 1) { /* التطابق جاي في رسالة تانية */ if (!R.matches && !R.delta) { matchesSynced = false; } }
  applyDeepPhones(leads, sellers, pairs);
  FULL = { items, leads, sellers, pairs };
  applyView();
  applyAreaLabels();
  renderCatChips();
  if (R.matches || R.delta || !big) setBusy(false); else setBusy(true, "⏳ بيحسب التطابق…");
  heavyMs = Date.now() - t0; heavyAt = Date.now(); firstHeavy = false;
  fastVer = heavyVer; fastIngest(); // اللي جه والحساب شغال يتضاف على طول (نبدأ من إصدار الداتا اللي اتحسبت)
  return true;
}
// ⚡ عرض البوستات الجديدة فورًا: بنجيب الفروق بس (مش الداتا كلها)، نحللها هنا، ونضيفها للقوايم والتطابق في أقل من ثانية —
// والحساب الكامل (المشترين/البايعين/التطابق بين الناس) بيلحقها في الخلفية
let heavyVer = null, fastVer = null, fastBusy = false, fastAgain = false, fastT = null;
const FAST_MAX = 300;
let fastWaitFrom = 0;
function fastSoon() { clearTimeout(fastT); if (!fastWaitFrom) fastWaitFrom = Date.now(); const go = () => { if (window.__AQM_KEEP && __AQM_KEEP.scrolling() && Date.now() - fastWaitFrom < 8000) { fastT = setTimeout(go, 350); return; } fastWaitFrom = 0; fastIngest(); }; fastT = setTimeout(go, 60); } // بتسكرول؟ الجديد يستنى لحد ما توقف (بحد أقصى 8 ثواني)
async function fastIngest() {
  if (fastVer == null || !chrome.storage.local.delta || firstHeavy || !FULL || !compiledG) return;
  if (fastBusy) { fastAgain = true; return; }
  fastBusy = true;
  try {
    do {
      fastAgain = false;
      const dp = await chrome.storage.local.delta("posts", fastVer);
      if (!dp || dp.full || !dp.entries) return; // فرق مش معروف: الحساب الكامل هيتصرف
      const ids = Object.keys(dp.entries), rem = dp.removed || [];
      if (!ids.length && !rem.length) { fastVer = dp.ver; return; }
      if (ids.length > FAST_MAX || rem.length > FAST_MAX) return; // تغيير كبير: الحساب الكامل أنسب
      const sub = {};
      for (const id of ids) { raw[id] = dp.entries[id]; sub[id] = dp.entries[id]; }
      for (const id of rem) delete raw[id];
      fastVer = dp.ver;
      const fresh = MATCH.enrichAll(sub, settings), compiled = compiledG, catsOk = compiled.cats;
      const keep = new Map();
      for (const p of fresh) {
        if (!catsOk.includes(p.category)) continue;
        if (compiled.extractFocus && !PH.focusOk(p.text, p, compiled, p.forceRegion)) continue;
        keep.set(p.id, p);
      }
      const gone = new Set([...ids, ...rem]);
      const base = FULL.items.filter((p) => !gone.has(p.id));
      FULL.items = base.concat([...keep.values()]);
      if (matchesSynced) { const er = new Set(); MATCH.matchesDrop(matches, gone, er); const redo = new Set(keep.keys()); for (const k of er) if (!gone.has(k)) redo.add(k); MATCH.matchesInc(FULL.items, redo, matches, 10, { dedupe: er.size > 0 }); }
      try { fastPairs(keep, gone); } catch (e) { console.warn("fastPairs", e); } // ⚡ تطابق لحظي للجديد مع القديم
      applyView();
      byId = new Map(items.map((p) => [p.id, p]));
      render();
      fastCount += keep.size;
    } while (fastAgain);
  } catch (e) { console.warn("fastIngest", e); }
  finally { fastBusy = false; }
}
let fastCount = 0;
// أول تشغيل: لو الفلاتر اتحفظت قبل كده من جهاز تاني نعمل زيها، ولو لأ نبدأ بـ«اعرض كل حاجة» على كل الأجهزة (الأرقام تتطابق)
let viewPrefsInit = false;
async function initViewPrefs() {
  if (viewPrefsInit) return; viewPrefsInit = true;
  try {
    const { viewPrefs } = await chrome.storage.local.get("viewPrefs");
    if (viewPrefs) applyViewPrefs(viewPrefs, false);
    else { viewCats = null; areaOn = false; try { localStorage.setItem("alaaViewCats", "null"); localStorage.setItem("alaaAreaOn", "0"); } catch {} persistViewPrefs(); }
    try { syncAreaBoxes(); } catch {} // «منطقتك بس» (areaOn) اتغيّرت من جهاز تاني: الصناديق وstate.onlyBS لازم يتزامنوا (كان العدّاد 94 والقايمة 1367)
  } catch {}
}
async function load(opts = {}) {
  await initViewPrefs();
  await loadLight();
  if (opts.light && JSON.stringify(MATCH.learnWeights(matchFb).wm) === wmKey) { if (FULL) applyView(); render(); return; } // 🧠 لو الأوزان المتعلّمة اتغيّرت نعيد حساب التطابق
  opts.light = false;
  const ok = await loadHeavy();
  if (ok !== false) render();
}
let cats = ["land", "apartment", "villa", "other"];
const CAT_CHIPS = { land: "🌾 أراضي", apartment: "🏢 شقق", villa: "🏡 فلل", other: "📦 أخرى" };
// 👁 فلتر العرض (منفصل عن السحب): بتسحب كله وتعرض اللي انت عايزه بس — محفوظ على الجهاز ده
let FULL = { items: [], leads: [], sellers: [], pairs: [] };
let viewCats = (() => { try { const v = JSON.parse(localStorage.getItem("alaaViewCats") || "null"); return Array.isArray(v) && v.length ? new Set(v) : null; } catch { return null; } })();
// 🔁 فلاتر العرض (نوع الوحدة + «منطقتك بس») بتتزامن بين الأجهزة (viewPrefs) — عشان الويندوز والـVPS يعرضوا نفس الأرقام
let viewPrefsAt = 0;
function persistViewPrefs() { viewPrefsAt = Date.now(); try { chrome.storage.local.set({ viewPrefs: { cats: viewCats ? [...viewCats] : null, areaOn: !!areaOn, grp: !!grpOn, at: viewPrefsAt } }); } catch {} }
function applyViewPrefs(vp, rerender) {
  if (!vp || typeof vp !== "object" || (vp.at && vp.at <= viewPrefsAt)) return; // فاضي، أو ده اللي إحنا كتبناه، أو اللي عندنا أحدث
  viewPrefsAt = vp.at || Date.now();
  viewCats = Array.isArray(vp.cats) && vp.cats.length ? new Set(vp.cats) : null; areaOn = !!vp.areaOn;
  if (typeof vp.grp === "boolean") { grpOn = vp.grp; try { localStorage.setItem("alaaGrpOn", grpOn ? "1" : "0"); const gb = document.getElementById("mGroup"); if (gb) gb.checked = grpOn; } catch {} }
  try { localStorage.setItem("alaaViewCats", JSON.stringify(viewCats ? [...viewCats] : null)); localStorage.setItem("alaaAreaOn", areaOn ? "1" : "0"); } catch {}
  if (rerender) { applyView(); renderCatChips(); syncAreaBoxes(); render(); }
}
const saveVC = () => { try { localStorage.setItem("alaaViewCats", JSON.stringify(viewCats ? [...viewCats] : null)); } catch {} persistViewPrefs(); };
// الأنواع المعروضة فعلًا (null = الكل)
function vcActive() {
  if (!viewCats || !viewCats.size) return null;
  const v = new Set([...viewCats].filter((k) => cats.includes(k)));
  return v.size && v.size < cats.length ? v : null;
}
function applyView() {
  learnInfo = MATCH.learnWeights(matchFb); // العدّادات وزرار «👎 المخفي ↩️» بيتحدّثوا بعد كل تقييم (كانت متجمّدة لحد الحساب التقيل الجاي)
  const V = vcActive();
  items = V ? FULL.items.filter((p) => V.has(p.category)) : FULL.items;
  leads = V ? FULL.leads.filter((L) => (L.categories || []).some((c) => V.has(c))) : FULL.leads;
  sellers = V ? FULL.sellers.map((S) => { const units = S.units.filter((u) => V.has(u.category)); return units.length === S.units.length ? S : units.length ? { ...S, units, categories: (S.categories || []).filter((c) => V.has(c)) } : null; }).filter(Boolean) : FULL.sellers;
  pairs = V ? FULL.pairs.filter((x) => V.has(x.u.category)) : FULL.pairs;
  pairsHidden = pairs.filter((x) => (matchFb[MATCH.pairFbKey(x)] || {}).v === -1);
  pairs = MATCH.applyFb(pairs, matchFb); // 👎 بيشيل التطابق، 👍 بيرفعه ويثبّته
  for (const k of ["cat", "lCat", "sCat", "mCat"]) if (V && state[k] && state[k] !== "all" && !V.has(state[k])) state[k] = "all";
  buyersBySeller = new Map(); for (const x of pairs) { if (!buyersBySeller.has(x.S.key)) buyersBySeller.set(x.S.key, []); buyersBySeller.get(x.S.key).push(x); }
  sellersByBuyer = new Map(); for (const x of pairs) { if (!sellersByBuyer.has(x.B.key)) sellersByBuyer.set(x.B.key, []); sellersByBuyer.get(x.B.key).push(x); }
  { // 🆕 اللي ظهر من آخر حساب: بيتعلّم ويومّض في الشاشة
    const ks = new Set(FULL.pairs.map(MATCH.pairFbKey));
    if (prevPairKeys) {
      const j = new Set(); for (const k of ks) if (!prevPairKeys.has(k)) j.add(k);
      justKeys = j;
      if (j.size && state.view === "matches" && Date.now() - lastJustToast > 5000) { lastJustToast = Date.now(); toast(`🆕 ظهر ${ar(j.size)} تطابق جديد`); }
    }
    prevPairKeys = ks;
  }
}
// تابات الأنواع جوه كل صفحة: بس الأنواع المعروضة
const catsTabs = () => { const V = vcActive(); return V ? Object.fromEntries(Object.entries(CATS).filter(([k]) => k === "all" || V.has(k))) : Object.fromEntries(Object.entries(CATS).filter(([k]) => k === "all" || cats.includes(k))); };
// ⚠️ لما فلتر العرض شغال (نوع أو «منطقتك بس») نقول كده بوضوح — عشان رقم «الطلبات والعروض» ما يتفهمش إنه ناقص
function viewNote(V) {
  if (!V && !areaOn) return "";
  const all = FULL.items.length; if (!all) return "";
  const shown = items.filter(inArea).length, why = [V ? [...V].map((x) => CAT_CHIPS[x]).join(" + ") : "", areaOn ? "📍 منطقتك بس" : ""].filter(Boolean).join(" · ");
  return `<button class="viewnote" data-viewreset title="فلتر العرض شغال (وبيتزامن مع الأجهزة التانية) — دوس عشان تعرض كل حاجة">⚠️ معروض ${ar(shown)} من ${ar(all)} — ${why} · إلغاء الفلتر</button>`;
}
function renderCatChips() {
  const V = vcActive(), shown = Object.keys(CAT_CHIPS).filter((k) => cats.includes(k));
  $("catChips").innerHTML =
    `<button class="catchip scrape-btn" data-scrapepop title="📥 بيسحب إيه؟ (أراضي / شقق / فلل)">📥</button>` +
    `<span class="vf-sep" title="اعرض بس">👁</span>` +
    (shown.length > 1 ? `<button class="catchip ${!V ? "on" : ""}" data-vcat="all" title="اعرض كل اللي بيتسحب"><span class="cl">الكل</span></button>` : "") +
    shown.map((k) => `<button class="catchip ${(V ? V.has(k) : shown.length === 1) ? "on" : ""}" data-vcat="${k}" title="${V && V.has(k) ? "معروض — دوس عشان تشيله من العرض" : "اعرض " + CAT_CHIPS[k].slice(2).trim() + " بس (دوس على أكتر من نوع تجمعهم)"}">${CAT_CHIPS[k].split(" ")[0]} <span class="cl">${CAT_CHIPS[k].split(" ").slice(1).join(" ")}</span></button>`).join("") +
    viewNote(V) +
    `<div class="scrape-pop" id="scrapePop" hidden><b>📥 البرنامج بيسحب إيه؟</b><small class="muted">ده اللي بيتسحب من فيسبوك وواتساب — والعرض تتحكم فيه من 👁 جنبه</small>
      <div class="sp-row">${Object.entries(CAT_CHIPS).map(([k, v]) => `<button class="catchip ${cats.includes(k) ? "on" : ""}" data-catchip="${k}">${cats.includes(k) ? "✓ " : ""}${v}</button>`).join("")}</div></div>`;
}
let pairsHidden = [], compiledG = null, reloadT, buyersBySeller = new Map(), sellersByBuyer = new Map();
// ===== 📍 المنطقة =====
// «بني سويف الجديدة» أو «المجاورة 3» من غير حي = منطقة مش محددة (مش برا أحياءك)
const GENERIC_REG = /^(بني سويف الجديدة|شرق النيل|المجاورة)/;
// 📍 فلتر المنطقة بقى اختياري وللعرض بس (مطفي افتراضيًا) — البرنامج بيسحب ويعرض كل حاجة، وانت تفلتر لو حبيت
let areaOn = (() => { try { return localStorage.getItem("alaaAreaOn") === "1"; } catch { return false; } })();
const setAreaOn = (v) => { areaOn = !!v; try { localStorage.setItem("alaaAreaOn", areaOn ? "1" : "0"); } catch {} persistViewPrefs(); };
const inFocus = (region) => !area.focus.length || (region && !GENERIC_REG.test(region) ? area.focus.includes(region) : !area.strict);
const inArea = (p) => !areaOn || (!p.outside && (p.category !== "land" && !(settings && settings.focusAll) ? true : inFocus(p.region)));
const leadInArea = (L) => !areaOn || (!L.outside && (!area.focus.length || (!(settings && settings.focusAll) && L.categories.length && !L.categories.includes("land")) || L.regions.some((r) => area.focus.includes(r)) || (!L.regions.filter((r) => !GENERIC_REG.test(r)).length && !area.strict)));
const unitInArea = (u) => !areaOn || (!u.outside && (u.category !== "land" && !(settings && settings.focusAll) ? true : inFocus(u.region)));
function applyAreaLabels() {
  const lbl = area.focus.length ? `📍 ${area.focus.length === 1 ? area.focus[0] : area.focus.length + " مناطق"} بس` : `📍 ${area.gov} بس`;
  document.querySelectorAll(".areaLbl").forEach((e) => (e.textContent = lbl));
  $("areaPill").textContent = "📍 " + area.gov + (area.focus.length ? ` · ${area.focus.length === 1 ? area.focus[0] : area.focus.length + " مناطق"}` : "");
  $("guideTitle").textContent = `📒 دليل أسعار عقارات ${area.gov}`;
}
// وقت السحب التخزين بيتغيّر كتير — بنحدّث اللوحة بس وهي ظاهرة، وبعد ما الدنيا تهدى ثانية
let staleWhileHidden = false;
let pendHeavy = false;
// تقدّم السحب بيتحدّث لوحده على طول (حتى لو الداتا التقيلة مستنية دورها)
let liveT = null;
chrome.storage.onChanged.addListener((c) => {
  if (!c.autoLog && !c.lanesCfg && !LANE_KEYS.some((k) => c[k])) return;
  clearTimeout(liveT);
  liveT = setTimeout(async () => { try { const d = await chrome.storage.local.get([...LANE_KEYS, "autoLog", "lanesCfg"]); readLanes(d); autoLog = d.autoLog || null; paintLive(); } catch {} }, 250);
});
// ⚡ المفاتيح اللي فعلاً بتأثّر على اللي بيتعرض. غيرها (نبض واتساب، سجل الصياد، إحصائيات الجروبات…) ما يستاهلش إعادة رسم الشاشة كلها
const RENDER_KEYS = new Set([...HEAVY_KEYS, ...LIGHT_KEYS, "viewPrefs", "crmReg", "pipeDeals", "matchFb"]);
let lastLoadAt = 0;
// 🛑 أثناء السحب الداتا بتتغيّر كل كام ثانية، وإعادة الحساب والرسم الكاملة كل مرة بتخلّي الشاشة تقطّع وتترفرش وإنت شغال عليها.
// الجديد بيظهر فورًا من fastIngest (فروق بس) وتقدّم السحب بيتحدّث لوحده (liveT)، فالحساب الكامل بنباعد بينه وبين اللي قبله وقت السحب.
// أي تغيير من عندك (إعدادات، ملاحظة، عميل…) أو نهاية السحب بيتنفّذ فورًا زي الأول.
const SCRAPE_OUT = new Set(["posts", "comments", "autoLog", "fbQueue", "__q.fast", "__q.mine", "__q.deep", "__q.m1", "__q.m2", "lanesCfg", "scrapeHealth", "mineJob", "mineDeepJob", "mineHits", "mineSeen", "mineDeep", "adPosts", "aiStatus", "sbStatus", "postJob", "listings"]);
const SCRAPE_HEAVY_GAP = 20000, SCRAPE_LIGHT_GAP = 6000;
let pendUser = false;
let lastInputAt = 0; for (const ev of ["pointerdown", "keydown", "wheel", "touchstart", "input"]) window.addEventListener(ev, () => { lastInputAt = Date.now(); }, { capture: true, passive: true });
function scrapingNow() {
  const now = Date.now();
  const fbOn = fbLanes.length > 0;
  const autoOn = autoLog && !autoLog.finishedAt && autoLog.startedAt && now - autoLog.startedAt < 40 * 6e4;
  return !!(fbOn || autoOn);
}
const scrapeEnded = (c) => (c.autoLog && !((c.autoLog.oldValue || {}).finishedAt) && !!((c.autoLog.newValue || {}).finishedAt)) || LANE_KEYS.some((k) => c[k] && !!((c[k].oldValue || {}).running) && !((c[k].newValue || {}).running));
chrome.storage.onChanged.addListener((c) => {
  // huntCfg.idx بتتكتب من الخلفية بعد كل لفة ومفيش حاجة معروضة بتتأثر بيها ← مش سبب لإعادة رسم الشاشة
  const rk = Object.keys(c).filter((k) => RENDER_KEYS.has(k) && !(k === "huntCfg" && sameExcept(c[k], "idx")));
  if (!rk.length) return;
  if (rk.some((k) => !SCRAPE_OUT.has(k)) || scrapeEnded(c)) pendUser = true;
  if (Object.keys(c).some((k) => HEAVY_KEYS.includes(k))) pendHeavy = true;
  if (document.hidden) { staleWhileHidden = true; return; }
  if (c.posts) fastSoon(); // الجديد يظهر فورًا، والحساب الكامل بعده
  clearTimeout(reloadT);
  // وقت السحب الداتا بتتغير كتير: نستنى على حسب تقل الحساب عشان الشاشة تفضل مريحة
  // من جهاز تاني الداتا جاية على النت: التقيل على حسب حجمه (من 6 لـ 25 ثانية)، والخفيف (تقدّم السحب) على طول
  const wait = pendHeavy ? (WEB ? Math.max(1200, Math.min(12000, Math.max(3000, heavyMs * 1.2)) - (Date.now() - heavyAt)) : Math.max(250, Math.min(3000, heavyMs * 0.35) - (Date.now() - heavyAt))) : Math.max(300, 1500 - (Date.now() - lastLoadAt)); // التغييرات الخفيفة (تقدّم السحب…): إعادة رسم واحدة كل 1.5 ثانية بالكتير
  let waitMs = wait;
  // 🕶 10.80.51: التغيير «الخلفي» = سحب شغّال هنا، أو داتا جاية من الجهاز التاني (VPS) من غير ما تكون لسه ضغطت/كتبت حاجة (تغيير بإيدك بييجي بعد حركتك بثانية)
  if (!pendUser && !WEB && (scrapingNow() || Date.now() - lastInputAt > 1500)) { // مفيش تغيير من عندك: باعد بين إعادة الرسم
    if (pendHeavy) { if (fastVer != null && chrome.storage.local.delta) waitMs = Math.max(wait, SCRAPE_HEAVY_GAP - (Date.now() - heavyAt)); } // لو الجديد بيظهر فورًا (fastIngest) الحساب الكامل يستنى
    else waitMs = Math.max(wait, SCRAPE_LIGHT_GAP - (Date.now() - lastLoadAt));
  }
  let deferN = 0, deferS = 0; // لو بتسكرول: التحديث يستنى لحد ما توقف (بحد أقصى ~12 ثانية) — لو بتكتب جوه حقل في قايمة (ملاحظة CRM / صفقة / عميل / تعديل بيانات) وإحنا هنعيد رسم القايمة ← نستنى لحد ما تخرج من الحقل (بحد أقصى دقيقة)
  const fire = () => { if (window.__AQM_KEEP && __AQM_KEEP.scrolling() && ++deferS < 30) { reloadT = setTimeout(fire, 400); return; } if ((typingInList() || (window.__AQM_KEEP && __AQM_KEEP.typing())) && ++deferN < 30) { reloadT = setTimeout(fire, 2000); return; } const h = pendHeavy; pendHeavy = false; pendUser = false; lastLoadAt = Date.now(); load({ light: !h }); };
  reloadT = setTimeout(fire, waitMs);
});
function typingInList() {
  const a = document.activeElement;
  return !!(a && a.matches && a.matches("input,textarea,select") && a.closest && a.closest("#cList,#pList,#lList,#sList,#todayBody,#todayPlan,#mList"));
}

// 🔁 إعدادات اتغيّرت من الجهاز التاني (أو من أي مكان) والصفحة مفتوحة ← نحدّث الخانات لوحدها، من غير ما نقاطع حد بيكتب ولا نمسح كتابته اللي لسه ما اتحفظتش
const CFG_KEYS = ["settings", "autoCfg", "huntCfg", "alertCfg", "reportCfg", "aiCfg", "sbCfg", "mineCfg", "templates", "myName", "team", "commCfg", "dealCfg", "dataCfg", "ocrCfg", "fileCfg"];
let cfgDirty = false, cfgOwnAt = 0, cfgWarned = 0; const cfgTouched = new Set(); // cfgTouched: الأقسام اللي فيها كتابة لسه ما اتحفظتش
function cfgRefill() {
  if (!cfgDirty || state.view !== "settings") return;
  const a = document.activeElement;
  if ((a && a.matches && a.matches("input,textarea,select") && a.closest("#v-settings")) || cfgTouched.size) { // في كتابة لسه ما اتحفظتش: ما نمسحهاش
    if (Date.now() - cfgOwnAt > 4000 && Date.now() - cfgWarned > 20000) { cfgWarned = Date.now(); toast("⚙️ إعدادات اتغيّرت من الجهاز التاني — احفظ اللي كتبته أو افتح الإعدادات تاني عشان تتحدّث"); }
    return;
  }
  cfgDirty = false;
  try { fillSettings(); } catch (e) { console.warn("cfgRefill", e); }
}
const sameExcept = (ch, skip) => { try { const a = { ...(ch.oldValue || {}) }, b = { ...(ch.newValue || {}) }; delete a[skip]; delete b[skip]; return JSON.stringify(a) === JSON.stringify(b); } catch { return false; } };
chrome.storage.onChanged.addListener((c) => { if (CFG_KEYS.some((k) => c[k] && !(k === "huntCfg" && sameExcept(c[k], "idx")))) cfgDirty = true; }); // الخلفية بتكتب huntCfg.idx كل لفة — مش «إعدادات اتغيّرت»
document.addEventListener("input", (e) => { const p = e.target && e.target.closest && e.target.closest("#v-settings .panel"); if (p && [...p.querySelectorAll("button[id]")].some((b) => /save/i.test(b.id))) cfgTouched.add(p); }, true); // الأقسام اللي بتتحفظ تلقائي (من غير زرار حفظ) ما تتحسبش «كتابة معلّقة»
document.addEventListener("click", (e) => {
  const b = e.target && e.target.closest && e.target.closest("#v-settings button"); if (!b || !/save/i.test(b.id || "")) return;
  cfgOwnAt = Date.now(); const p = b.closest(".panel"); if (p) cfgTouched.delete(p); else cfgTouched.clear(); // حفظ القسم ده بإيدك ← مفيش كتابة معلّقة فيه
}, true);
document.addEventListener("visibilitychange", () => { if (!document.hidden && staleWhileHidden) { staleWhileHidden = false; const h = pendHeavy; pendHeavy = false; load({ light: !h }); } });

async function renderAutoPill() {
  const pill = $("autoPill");
  if (!autoCfg.enabled) { pill.className = "autopill off"; pill.textContent = "⏸ التحديث التلقائي مقفول"; return; }
  let next = null; try { const a = await chrome.alarms.get("autoScan"); next = a && a.scheduledTime; } catch {}
  const last = autoLog && (autoLog.finishedAt || autoLog.startedAt);
  const mins = (t) => Math.max(0, Math.round(Math.abs(t - Date.now()) / 6e4));
  const fmt = (m) => (m < 60 ? `${m} د` : `${Math.floor(m / 60)} س ${m % 60 ? (m % 60) + " د" : ""}`);
  pill.className = "autopill";
  pill.textContent = `🔄 كل ${hrsTxt(autoCfg.hours)}` + (last ? ` · آخر تحديث من ${fmt(mins(last))}` : "") + (next ? ` · الجاي بعد ${fmt(mins(next))}` : "");
}
setInterval(renderAutoPill, 30000);
async function doSaveAll() {
  const b = $("saveAll"); b.disabled = true; b.textContent = "⏳ بيحفظ...";
  const r = await chrome.runtime.sendMessage({ type: "saveAll" }).catch(() => null);
  b.disabled = false; b.textContent = "💾 حفظ";
  if (!r || !r.ok) return toast("⚠️ ما اتحفظش — جرّب تاني");
  const f = r.r.file;
  const { __peer: pr, fileCfg: fc } = await chrome.storage.local.get(["__peer", "fileCfg"]);
  const all = !!(pr && pr.on) && !(fc && fc.scope === "here");
  toast((f && !f.error ? `💾 اتحفظ كل حاجة — ${f.posts} طلب/عرض · ${f.comments} تعليق (التحميلات ← AlaaDealsExt)` : "💾 اتحفظ جوه الإضافة" + (f && f.error ? " (الملف: " + f.error + ")" : "")) + (all ? " — وأمر الحفظ اتبعت لباقي الأجهزة" : (pr && pr.on ? " — على الجهاز ده بس" : "")));
  if (all) { setTimeout(() => renderSaves().catch(() => {}), 4000); setTimeout(() => renderSaves().catch(() => {}), 12000); }
}
// ===== الواجهة الرئيسية لكل صفحة: عنوان + أرقام السوق الحية =====
const HERO = {
  today: ["النهارده ☀️", "ردود الواردين ومتابعاتك وصفقاتك الواقفة، والعملاء المهتمين، وأحسن اللقطات — كل حاجة محتاجة منك حركة النهارده."],
  leads: ["المشترين المحتملين", "اللي طالبين شراء أو متفاعلين على عروض أراضي وشقق وفلل بتعليقات شراء."],
  sellers: ["البايعين المحتملين", "اللي عندهم وحدات للبيع — المالك متفرّق عن السمسار، وجنب كل واحد المشترين المناسبين."],
  matches: ["التطابق", "كل مشتري قصاده أنسب بايع، بالنسبة والسبب، وتكلّم الاتنين بضغطة."],
  posts: ["الطلبات والعروض", "كل بوست اتسحب من الجروبات وماركت بليس وإنستجرام، متصنّف على منطقتك."],
  listings: ["هاتلي مشتري 🎯", "عندك عرض؟ هاتلك المشترين. عندك طلب؟ هاتلك البائعين. تطابق فوري من الداتا + سحب مخصص من فيسبوك."],
  extract: ["", ""], // العنوان والشرح جوّه صفحة «استخراج» نفسها
  pick: ["", ""], // العنوان والشرح جوّه صفحة «رشّحلي» نفسها
  atlas: ["", ""], // الأطلس له شريطه الخاص
  publish: ["", ""], // العنوان والشرح جوه «غرفة النشر» نفسها (زي بوت الواتساب) — من غير تكرار
  funnel: ["", ""], // العنوان والشرح جوّه صفحة «الواردين والقياس» نفسها
  stats: ["نبض السوق", "أسعار المتر، والطلب قدام العرض، واتجاه السعر في كل منطقة."],
  pipe: ["الصفقات 💼", "من التسجيل لحد العمولة: العروض اللي سجّلتها، وكل صفقة بدأتها بضغطة من التطابق، والمراحل، والعمولة المتوقعة، واللي اتقفل وعمولته."],
  settings: ["الإعدادات", "منطقتك، والتحديث التلقائي، والرسايل، والربط، والحفظ."],
};
function renderHero() {
  const [title, sub] = HERO[state.view] || ["", ""];
  const d1 = Date.now() - 864e5, d30 = Date.now() - 30 * 864e5;
  const inA = items.filter(inArea);
  const m = [
    [inA.filter((p) => p.type === "request" && (p.ts || p.scannedAt) >= d1).length, "طلب شراء آخر 24 ساعة"],
    [leads.filter((L) => L.superHot && !L.isBroker && leadInArea(L)).length, "مشتري مهتم جدًا"],
    [sellers.filter((S) => S.owner && S.last >= d30 && unitInAreaAny(S)).length, "مالك بيبيع"],
    [pairs.filter((x) => x.score >= 70).length, "تطابق قوي"],
  ];
  $("hero").innerHTML = `<div class="hero-txt"><div class="hero-area">📍 ${esc(area.gov)}${area.focus.length ? " · " + esc(area.focus.slice(0, 3).join("، ")) + (area.focus.length > 3 ? "…" : "") : ""}</div>
    <h2>${esc(title)}</h2><p>${esc(sub)}</p></div>
    <div class="hero-stats">${m.map(([n, l]) => `<div class="hs"><b>${Number(n).toLocaleString("en-US")}</b><span>${l}</span></div>`).join("")}</div>`;
}
const HEAVY_LISTS = { todayBody: "today", lList: "leads", sList: "sellers", list: "posts", mList: "matches" }; // حاوية القايمة الكبيرة ← الشاشة بتاعتها
// شارة «☀️ النهارده» = متابعات العملاء المستحقة + شغل الخطة (ردود الواردين ومتابعاتك وصفقاتك الواقفة — من funnelui.js)
function todayBadge() { try { const n = leads.filter((L) => isDue(L)).length + ((window.FNU && FNU.planCount && FNU.planCount()) || 0), el = $("navToday"); if (el) { el.textContent = n; el.hidden = !n; } } catch {} }
window.todayBadge = todayBadge;
const renderSoon = (() => { let t; return () => { clearTimeout(t); t = setTimeout(render, 150); }; })();
function render() {
  { const al = VIEW_ALIAS[state.view]; if (al) { state.view = al[0]; if (al[1]) { if (al[0] === "pick") window.__pkTab = al[1]; else if (al[0] === "pipe") state.pTab = al[1]; } } } // لينك/زرار قديم ← المكان الجديد
  if (state.view === "home" && uiSkin !== "sign") state.view = "posts"; // الرئيسية في شكل «اللافتة» بس
  document.body.dataset.pg = String(state.view).replace(/^tool:.*/, "tool");
  renderAutoPill();
  renderHero();
  const atlWas = !!($("v-atlas") && !$("v-atlas").hidden); // الأطلس كان ظاهر قبل إعادة الرسم دي؟
  for (const v of ALL_VIEWS) $("v-" + v).hidden = state.view !== v;
  if (state.view === "home" && window.renderHome) { try { renderHome(); } catch (e) { console.error("home", e); } }
  $("v-aitool").hidden = !String(state.view).startsWith("tool:");
  // ⚡ قوايم الشاشات المخفية بتتفرّغ من الذاكرة (كانت بتفضل ~70 ألف عنصر مفتوحين ورا بعض) — كل شاشة بتتبني من جديد لما ترجعلها
  for (const id in HEAVY_LISTS) if (state.view !== HEAVY_LISTS[id]) { const el = $(id); if (el && el.firstChild) el.textContent = ""; }
  if (window.ASSIST) { try { ASSIST.onRender(); } catch (e) { console.error("assist", e); } }
  // 🗺️ الأطلس بيحدّث نفسه (تغيير الوحدات من pickUnits، تغيير الحجم من ResizeObserver) — إعادة رسمه مع كل تغيير في الداتا كانت بتبني اللوحة الجانبية والشريط من جديد وبتخلّي الخريطة توميض
  if (state.view === "atlas" && window.renderAtlas && !(atlWas && window.ATLAS && ATLAS.isReady && ATLAS.isReady())) { try { renderAtlas(); } catch (e) { console.error("atlas", e); } }
  if (state.view === "extract" && window.renderExtract) { try { renderExtract(); } catch (e) { console.error("extract", e); } }
  if (state.view === "pick" && window.renderPick) { try { renderPick(); } catch (e) { console.error("pick", e); } }
  if (window.MAGNET) { try { MAGNET.nav(); } catch {} }
  if (state.view === "publish" && window.renderPublish) { try { renderPublish(); } catch (e) { console.error("publish", e); } }
  if (state.view === "spread" && window.renderSpread) { try { renderSpread(); } catch (e) { console.error("spread", e); } }
  if (state.view === "funnel" && window.renderFunnel) { try { renderFunnel(); } catch (e) { console.error("funnel", e); } }
  if (state.view === "wasend" && window.renderWasend) { try { renderWasend(); } catch (e) { console.error("wasend", e); } }
  const ssNew = savedSearches.reduce((a, s) => a + (s.active !== false ? s.newHits || 0 : 0), 0);
  $("navSaved").textContent = ssNew; $("navSaved").hidden = !ssNew || state.view === "saved";
  if (state.view === "saved") renderSaved();
  { const nS = sellers.filter((S) => S.owner && S.status !== "hidden" && unitInAreaAny(S) && S.last >= Date.now() - 30 * 864e5).length; $("navSellers").textContent = nS; $("navSellers").hidden = !nS; }
  if (state.view === "sellers") renderSellers();
  { let n = 0; try { for (const sl of slotsArr()) n += slotView(sl).base.length; } catch {} $("navListings").textContent = n; $("navListings").hidden = !n; }
  if (state.view === "listings") renderSlots();
  { const nL = leads.filter((L) => L.level >= 1 && !L.isBroker && L.status !== "hidden" && leadInArea(L) && stageOf(L) === "new").length; $("navLeads").textContent = nL; $("navLeads").hidden = !nL; }
  todayBadge();
  if (state.view === "today") renderToday();
  if (state.view === "leads") renderLeads();
  document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("on", b.dataset.view === state.view));
  try { const on = document.querySelector("#nav button.on"); if (on && window.matchMedia("(max-width:759px)").matches) { const nv = $("nav"); nv.scrollTo({ left: on.offsetLeft - (nv.clientWidth - on.offsetWidth) / 2, behavior: "smooth" }); } } catch {}
  $("navPosts").textContent = items.length ? ar(items.filter(inArea).length) : "0";
  $("navMatches").textContent = pairs.filter((x) => x.score >= 70).length;
  if (lastRenderView === "matches" && state.view !== "matches") markMatchesSeen(); // خرجت من الشاشة = شفت اللي كان فيها
  lastRenderView = state.view; try { visitedViews.add(state.view); } catch {} // أي طريقة دخلت بيها القسم (شريط جانبي/لينك/هاش) بتتحسب «دخلته»
  { const nn = pairs.filter((x) => x.score >= 70 && pairIsNew(x)).length, el = $("navMatchesNew"); if (el) { el.textContent = "🆕" + nn; el.hidden = !nn || state.view === "matches"; } }
  if (state.view === "posts") { renderPosts(); renderPostTool(); }
  if (state.view === "matches") renderMatches();
  { const n = Object.values(pipe).filter(pActive).length; $("navPipe").textContent = n; $("navPipe").hidden = !n; }
  if (state.view === "pipe") renderPipe();
  if (state.view === "stats") renderStats();
  if (state.view === "settings") { renderSettingsStatus(); cfgRefill(); }
  if (grpOpen) { if (state.view !== "matches") lastCards = null; refreshGroupModal(); } // نافذة التفاصيل بتتحدث لوحدها
}

// ================= الطلبات =================
// فلتر «🏠 المالك» في الطلبات والعروض: mention = أي بوست فيه الكلمة ، وبعدها التصنيف
const BROKERISH = ["broker", "office", "middleman"];
function ownPassF(p, k) {
  const r = ownOf(p);
  if (!r.mention) return false;
  return k === "mention" ? true : k === "owner" ? r.role === "owner" : k === "broker" ? BROKERISH.includes(r.role) : k === "wants" ? r.role === "wants-owner" : k === "unsure" ? ["unsure", "mention"].includes(r.role) : true;
}
// 🧪 صافي / مشتبه / مكتب لصاحب الطلب أو العرض (v10.71.5): الطلب بمستوى المشتري والعرض بمستوى البايع — من نفس التقدير اللي في خانتي المشترين والبايعين
// 🧱 مربع المستويات البارز (v10.71.6): عنوان + بلاطات كبيرة (أيقونة · اسم · عدد كبير · سطر شرح) — بيتستخدم في التطابق وفي الطلبات والعروض
// items = [{ k, ic, t, d, n }] ، attr = اسم الـdata attribute اللي الضغط بيقراه (mcombo / pur)
function lvlHtml(title, hint, items, cur, attr) {
  return `<div class="lvl-head"><span class="lvl-tt">${esc(title)}</span><span class="lvl-hint">${esc(hint)}</span></div>` +
    items.map((it) => `<button type="button" class="lvl lvl-${esc(it.k)}${cur === it.k ? " on" : ""}${it.n ? "" : " z"}" role="tab" aria-selected="${cur === it.k}" data-${attr}="${esc(it.k)}" title="${esc(it.d)}"><span class="lv-top"><span class="lv-ic" aria-hidden="true">${it.ic}</span><b class="lv-t">${esc(it.t)}</b></span><b class="lv-n">${it.n}</b><span class="lv-d">${esc(it.d)}</span></button>`).join("");
}
// ===== 🪧 لافتة التصنيف الرباعي: صافي / مشتبه / مكتب / سمسار (+ مستبعد للمشترين) — والمعيار تحت كل واحد =====
function clsOfS(S) { return typeof ROLE !== "undefined" && ROLE.sellerClass ? ROLE.sellerClass(S) : S && S.owner ? "pure" : S && S.isBroker ? "broker" : "suspect"; }
function clsOfL(L) { return typeof ROLE !== "undefined" && ROLE.buyerClass ? ROLE.buyerClass(L) : "suspect"; }
const CLS_ORDER = { seller: ["pure", "suspect", "office", "broker"], buyer: ["pure", "suspect", "office", "broker", "out"] };
function clsSignHtml(side, list, cur, attr, note) {
  if (typeof ROLE === "undefined" || !ROLE.CLS4_RULES) return "";
  const kf = side === "seller" ? clsOfS : clsOfL, RU = ROLE.CLS4_RULES[side], counts = {};
  for (const x of list) { const k = kf(x); counts[k] = (counts[k] || 0) + 1; }
  const n = list.length, lab = (k) => ROLE.CLS4[k][side === "seller" ? "sell" : "buy"];
  const order = CLS_ORDER[side].filter((k) => k !== "out" || counts.out || cur === "out");
  const tiles = order.map((k) => {
    const c = ROLE.CLS4[k], num = counts[k] || 0, pc = n ? Math.round((num / n) * 100) : 0;
    return `<button type="button" class="cls-tile cls-${k}${cur === k ? " on" : ""}${num ? "" : " z"}" role="tab" aria-selected="${cur === k}" data-${attr}="${k}" title="${esc(RU[k].items.join("\n"))}">
      <span class="ct-top"><span class="ct-ic" aria-hidden="true">${c.ic}</span><b class="ct-t">${esc(lab(k))}</b></span>
      <span class="ct-n"><b>${num}</b><small>${pc}٪</small></span>
      <span class="ct-d">${esc(RU[k].short)}</span></button>`;
  }).join("");
  const rules = order.map((k) => `<div class="cls-rule cls-${k}"><h4><span aria-hidden="true">${ROLE.CLS4[k].ic}</span> ${esc(lab(k))}</h4><ul>${RU[k].items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>`).join("");
  return `<div class="cls-head"><span class="cls-tt">🪧 ${side === "seller" ? "تصنيف البايعين" : "تصنيف المشترين"}</span><span class="cls-hint">${n} ${side === "seller" ? "بايع" : "شخص"} · دوس على لافتة تفلتر بيها${note ? " · " + esc(note) : ""}</span><button type="button" class="cls-all${cur === "all" ? " on" : ""}" data-${attr}="all">الكل</button></div>
    <div class="cls-tiles" role="tablist">${tiles}</div>
    <details class="cls-rules" ${state.clsOpen ? "open" : ""}><summary>📐 المعيار اللي بنقيس بيه كل واحد (دوس تشوف التفاصيل)</summary><div class="cls-rule-grid">${rules}</div></details>`;
}
document.addEventListener("toggle", (e) => { const d = e.target; if (d && d.classList && d.classList.contains("cls-rules")) state.clsOpen = d.open; }, true);
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
function filtered(ign = {}) {
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
const tabsHtml = (obj, cur, key, counts) => Object.entries(obj).map(([k, v]) =>
  `<button class="tab ${cur === k ? "on" : ""}" data-${key}="${k}">${v}<small>${counts(k)}</small></button>`).join("");

function renderPosts() {
  const req = items.filter((p) => p.type === "request").length;
  const pending = Object.values(raw).filter((p) => !p.ai).length;
  $("stats").innerHTML =
    `<span class="stat">الإجمالي<b>${items.length}</b></span><span class="stat">طلبات<b>${req}</b></span>` +
    `<span class="stat">عروض<b>${items.length - req}</b></span><span class="stat">ليهم مطابقة<b>${items.filter((p) => (matches.get(p.id) || []).length).length}</b></span>` +
    `<span class="stat">خلصتهم<b>${items.filter((p) => p.done).length}</b></span>` +
    (() => { const n = HAS_OWN ? items.reduce((k, p) => k + (ownOf(p).mention ? 1 : 0), 0) : 0; return n ? `<span class="stat own-stat" title="بوستات فيها كلمة «المالك»">🏠 فيها «المالك»<b>${n}</b></span>` : ""; })();

  // شريط الذكاء الاصطناعي
  const bar = $("aiBar");
  if (aiCfg.enabled && aiCfg.key) {
    bar.hidden = false;
    if (aiLive(aiStatus)) bar.innerHTML = `🤖 بيحلل... ${aiStatus.done || 0} من ${aiStatus.total || "?"}`;
    else if (aiStatus && aiStatus.error && Date.now() - aiStatus.at < 6e5) bar.innerHTML = `⚠️ التحليل وقف: ${esc(aiStatus.error)} <button class="btn sm" data-ai="run">جرّب تاني</button>`;
    else if (pending) bar.innerHTML = `🤖 فيه ${pending} بوست لسه ما اتحللش بالذكاء الاصطناعي <button class="btn sm" data-ai="run">حلّلهم دلوقتي</button>`;
    else bar.hidden = true;
  } else bar.hidden = true;

  const a = filtered({ src: true }); $("srcTabs").innerHTML = tabsHtml(SRCS, state.src, "src", (k) => k === "all" ? a.length : a.filter((p) => p.srcs.includes(k)).length);
  const b = filtered({ type: true }); $("typeTabs").innerHTML = tabsHtml(TYPES, state.type, "type", (k) => k === "all" ? b.length : b.filter((p) => p.type === k).length);
  const c = filtered({ cat: true }); $("catTabs").innerHTML = tabsHtml(catsTabs(), state.cat, "cat", (k) => k === "all" ? c.length : c.filter((p) => p.category === k).length);
  { const d = filtered({ pur: true }); // 🧪 صافي / مشتبه / مكتب (العدّادات من غير فلتر الصافي نفسه)
    const T0 = state.type, kk = ["all", "pure", "suspect", "office"], cn = (k) => (k === "all" ? d.length : d.filter((p) => purOf(p) === k).length);
    // الطلبات بمستوى المشتري، والعروض بمستوى البايع، والكل: صاحب البوست
    const PL = T0 === "request" ? { all: ["📋", "كل الطلبات", "من غير فرز"], pure: ["✅", "مشتري صافي", "كاتب طلبه بنفسه من غير علامة سمسرة"], suspect: ["🟡", "مشتري مشتبه", "مش واضح هو المشتري ولا بيجمع عروض"], office: ["🏢", "مكتب / سمسار", "تاجر أو مكتب بيطلب (أو قال إنه كده)"] }
      : T0 === "offer" ? { all: ["📋", "كل العروض", "من غير فرز"], pure: ["✅", "بايع صافي (مالك)", "قال إنه المالك أو الأدلة بتقول كده"], suspect: ["🟡", "مالك ولا وسيط؟", "محتاج تأكيد قبل ما تتواصل"], office: ["🏢", "مكتب / سمسار", "سمسار أو مكتب أو وسيط"] }
      : { all: ["📋", "الكل", "طلبات وعروض من غير فرز"], pure: ["✅", "صافي", "مشتري صافي أو بايع مالك"], suspect: ["🟡", "مشتبه", "مشتري مش واضح أو مالك ولا وسيط؟"], office: ["🏢", "مكتب / سمسار", "مكاتب وسماسرة وتجار"] };
    $("purTabs").innerHTML = lvlHtml(T0 === "request" ? "🧪 الطلبات: صافي ولا مشتبه؟" : T0 === "offer" ? "🧪 العروض: صافي ولا مشتبه؟" : "🧪 صاحب الطلب / العرض: صافي ولا مشتبه؟", "دوس على المستوى اللي عايز تشوفه", kk.map((k) => ({ k, ic: PL[k][0], t: PL[k][1], d: PL[k][2], n: cn(k) })), state.pur, "pur");
    const nk = (k) => d.filter((p) => purOf(p) === k).length;
    $("purNote").innerHTML = `<span class="muted">${state.pur === "pure" ? "الطلب: مشتري صافي · العرض: مالك — الأنضف للتواصل." : state.pur === "suspect" ? "مشتري مش واضح هو ولا بيجمع عروض · أو مالك ولا وسيط؟ — اتأكد قبل ما تضيّع وقت." : state.pur === "office" ? "مكاتب وسماسرة وتجار (طلب أو عرض)." : "التصنيف من نفس تقدير خانتي المشترين والبايعين، ومفيش حاجة بتتمسح."}</span>` +
      (state.pur !== "all" && !nk(state.pur) && d.length ? ` <b>مفيش هنا دلوقتي —</b> ${["pure", "suspect", "office"].filter((k) => k !== state.pur && nk(k)).map((k) => `<button class="btn sm" data-pur="${k}">${PURS[k]} (${ar(nk(k))})</button>`).join(" ")}` : ""); }

  const regions = countBy(items, (p) => p.region);
  if (state.region && !state.region.startsWith("z:") && !regions.has(state.region)) state.region = "";
  $("regionSel").innerHTML = `<option value="">📍 كل المناطق (${regions.size})</option>` +
    Object.entries(PH.zones()).map(([k, v]) => `<option ${state.region === "z:" + k ? "selected" : ""} value="z:${k}">${v} (${items.filter((p) => p.zone === k).length})</option>`).join("") +
    [...regions].sort((x, y) => y[1] - x[1]).map(([r, n]) => `<option ${r === state.region ? "selected" : ""} value="${esc(r)}">${esc(r)} (${n})</option>`).join("");
  const groups = [...new Set(items.flatMap((p) => p.groups))].sort();
  if (state.group && !groups.includes(state.group)) state.group = "";
  $("groupSel").innerHTML = `<option value="">👥 كل الجروبات (${groups.length})</option>` +
    groups.map((g) => `<option ${g === state.group ? "selected" : ""} value="${esc(g)}">${esc(g)}</option>`).join("");
  $("onlyNew").checked = state.onlyNew; $("onlyDeals").checked = state.onlyDeals;

  const list = filtered();
  const mc = (p) => (matches.get(p.id) || []).length;
  const sorters = {
    new: (x, y) => tOf(y) - tOf(x), old: (x, y) => tOf(x) - tOf(y),
    priceAsc: (x, y) => (x.price || Infinity) - (y.price || Infinity), priceDesc: (x, y) => (y.price || 0) - (x.price || 0),
    matches: (x, y) => mc(y) - mc(x) || tOf(y) - tOf(x),
    deal: (x, y) => ((deals.get(y.id) || {}).pct || 0) - ((deals.get(x.id) || {}).pct || 0) || tOf(y) - tOf(x),
  };
  list.sort(sorters[state.sort]);
  $("countLine").textContent = `${list.length} نتيجة`;
  const hiddenOld = state.postDays ? filtered({ days: true }).length - list.length : 0;
  $("oldNote").hidden = !hiddenOld;
  $("oldNote").innerHTML = hiddenOld ? `📦 فيه <b>${hiddenOld}</b> طلب/عرض أقدم من ${state.postDays} يوم متخزنين ومستخبيين <button class="btn sm" data-showold>اعرضهم</button>` : "";
  if (!items.length) $("list").innerHTML = `<div class="empty"><b>لسه مفيش طلبات</b>افتح واتساب ويب أو فيسبوك، دوس زرار 🏠 تحت على الشمال، واسحب جروباتك العقارية.</div>`;
  else if (!list.length) $("list").innerHTML = `<div class="empty"><b>مفيش نتايج</b>جرّب تشيل شوية فلاتر.</div>`;
  else $("list").innerHTML = list.slice(0, state.shown).map((p) => card(p, { sgn: true })).join("");
  if (window.FBID) FBID.sec("posts", $("list"), [{ label: "الطالبين", items: list.filter((p) => p.type === "request") }, { label: "العارضين", items: list.filter((p) => p.type !== "request") }]); // 🆔 نسخ كل الآيديات
  $("moreBtn").hidden = list.length <= state.shown;
  $("moreBtn").textContent = `عرض المزيد (${list.length - state.shown} كمان)`;
}

function uniqBy(arr, f) { const s = new Set(), o = []; for (const x of arr) { const k = f(x); if (!x || s.has(k)) continue; s.add(k); o.push(x); } return o; }
function countBy(arr, f) { const m = new Map(); for (const x of arr) { const k = f(x); if (k != null && k !== "") m.set(k, (m.get(k) || 0) + 1); } return m; }

function chips(p) {
  const c = [];
  const dl = deals.get(p.id);
  if (dl) c.push(`<span class="chip deal" title="المتوسط ${fmtN(dl.median) + " ج/م²"} ${dl.scope ? "في " + esc(dl.scope) : "في كل المناطق"} (${dl.n} عرض)">🎯 لقطة −${dl.pct}%</span>`);
  if (p.fixed) c.push(`<span class="chip fixd" title="انت صحّحت البيانات دي">✏️ متصحّح</span>`);
  if (p.region) c.push(`<span class="chip i">📍 ${esc(p.region)}</span>`);
  if (p.zone && PH.zones()[p.zone]) c.push(`<span class="chip z">${PH.zones()[p.zone].split(" ")[0]} ${PH.zones()[p.zone].replace(/^\S+\s/, "").replace(/\s*\(.*\)$/, "")}</span>`);
  if (p.outside) c.push(`<span class="chip deal" title="مكان خارج ${esc(area.gov)} — مش بيتطابق مع بوستات ${esc(area.gov)}">برا ${esc(area.gov)}${p.placeName ? " · " + esc(p.placeName) : ""}</span>`);
  if (p.price) c.push(`<span class="chip dup">💰 ${PH.fmtPrice(p.price)}</span>`);
  if (p.land) c.push(landChips(p.land));
  if (p.down) c.push(`<span class="chip">مقدم ${PH.fmtPrice(p.down)}</span>`);
  if (p.area) c.push(`<span class="chip dup">📐 ${esc(p.area)}</span>`);
  const m = PH.ppm(p); if (m) c.push(`<span class="chip">${fmtN(m)} ج/م²</span>`);
  if (p.rooms) c.push(`<span class="chip i">🛏 ${p.rooms} غرف</span>`);
  if (p.floor) c.push(`<span class="chip i">${esc(p.floor)}</span>`);
  if (p.finishing) c.push(`<span class="chip i">${esc(p.finishing)}</span>`);
  if (p.furnished && p.finishing !== "مفروشة") c.push(`<span class="chip i">مفروشة</span>`);
  if (p.payment) c.push(`<span class="chip i">${esc(p.payment)}</span>`);
  return c.join("");
}
function landChips(L) {
  const c = [];
  if (L.mugawra) c.push(`<span class="chip i">المجاورة ${L.mugawra}</span>`);
  if (L.plot) c.push(`<span class="chip i">قطعة ${esc(L.plot)}</span>`);
  if (L.type) c.push(`<span class="chip i">${esc(L.type)}</span>`);
  if (L.over) c.push(`<span class="chip land">الأوفر ${PH.fmtPrice(L.over)}</span>`);
  if (L.paid) c.push(`<span class="chip">مدفوع ${PH.fmtPrice(L.paid)}</span>`); else if (L.paidPct) c.push(`<span class="chip">مدفوع ${L.paidPct}%</span>`);
  if (L.remaining) c.push(`<span class="chip">باقي ${PH.fmtPrice(L.remaining)}</span>`); if (L.installmentsLeft) c.push(`<span class="chip">باقي ${L.installmentsLeft} أقساط</span>`);
  (L.status || []).forEach((x) => c.push(`<span class="chip i">${esc(x)}</span>`));
  (L.features || []).forEach((x) => c.push(`<span class="chip z">${esc(x)}</span>`));
  return c.join("");
}
function phonesHtml(p) {
  return p.phones.map((n) => `<span class="ph">${esc(n)}<a href="${PH.waLink(n)}" target="_blank" title="كلمه واتساب">💬</a><button data-copy="${esc(n)}" title="نسخ">📋</button></span>`).join("");
}
// تصنيف البوست (عرض / طلب) من نصه + تصنيف بايعه — بيتحسب مرة لكل بوست (للي فيه «المالك» بس)
let SELLER_OF_UNIT = null, SELLER_OF_SRC = null;
const sellerOfUnit = (id) => {
  if (SELLER_OF_SRC !== sellers) { SELLER_OF_SRC = sellers; SELLER_OF_UNIT = new Map(); for (const S of sellers) for (const u of S.units) SELLER_OF_UNIT.set(u.id, S); }
  return SELLER_OF_UNIT.get(id);
};
const sellerRoleCtx = (S) => (S && S.band ? (S.owner ? { sellerRole: "owner", sellerSure: !!S.rsure } : S.isBroker ? { sellerRole: S.role && S.role !== "owner" ? S.role : "broker", sellerSure: !!S.rsure } : null) : null);
const OWN_MEMO = new WeakMap();
function ownOf(p) {
  if (!HAS_OWN) return { mention: false, role: "" };
  const m = OWN_MEMO.get(p);
  if (m && m.s === sellers) return m.v;
  const v = OWNMK.roleOf(p, p.type === "offer" ? sellerRoleCtx(sellerOfUnit(p.id)) : null, true);
  OWN_MEMO.set(p, { s: sellers, v });
  return v;
}
// بادج التصنيف على كارت البوست — بس لو النص فيه «المالك»، ومن غير ما نكرر بادج الذكاء الاصطناعي (مالك/سمسار)
function ownBadge(p) {
  const r = ownOf(p);
  if (!r.mention || !r.t || r.src === "ai") return "";
  return OWNMK.badgeHtml(r, esc);
}
function head(p) {
  return `${p.srcs.map((x) => `<span class="badge b-${x}">${SRC1[x]}</span>`).join("")}
    <span class="badge b-${p.type} hd-t">${TYPE1[p.type]}</span><span class="badge b-cat hd-c">${CATS[p.category]}</span>
    ${p.ai ? `<span class="badge b-ai" title="اتحلل بالذكاء الاصطناعي">🤖</span>` : ""}
    ${p.unsure ? `<span class="badge b-cat" title="القواعد والذكاء الاصطناعي مش متفقين على النوع وفضل مش مؤكد — راجعه بنفسك (زرار «صحّح»)">⚠ مش مؤكد</span>` : ""}
    ${p.isBroker === true ? `<span class="badge b-cat">سمسار</span>` : p.isBroker === false ? `<span class="badge b-offer">مالك</span>` : ""}${ownBadge(p)}`;
}
const sgPlate = (p) => `<div class="sg-plate t-${p.type}"><b class="sg-k">${TYPE1[p.type] || ""}</b><span class="sg-c">${esc(String(CATS[p.category] || "").replace(/^\S+\s/, ""))}</span>${p.price ? `<span class="sg-p">${PH.fmtPrice(p.price)}</span>` : ""}${p.area ? `<span class="sg-a">${esc(p.area)}</span>` : ""}</div>`;
function card(p, opts = {}) {
  const more = p.groups.length > 1 ? ` <span title="${esc(p.groups.join(" ، "))}">(+${p.groups.length - 1} جروب)</span>` : "";
  const ms = dedupeMatches(matches.get(p.id) || []);
  const open = state.open.has(p.id) || opts.forceOpen;
  const cl = clusters.get(p.id);
  const dupOpen = state.open.has("d:" + p.id);
  return `<article class="card ${opts.sgn ? "sgn " : ""}${p.done ? "done" : ""} t-${p.type}" data-id="${p.id}">
    ${opts.sgn && window.FBID ? FBID.chip(p) : ""}${sgPlate(p)}<div class="c-top">${head(p)}${chips(p)}<span class="when">${fmtWhen(p)}</span></div>
    ${p.summary ? `<div class="summary">🤖 ${esc(p.summary)}</div>` : ""}
    <div class="text" title="دوس عشان تفتح النص كله">${OH(p.text)}</div>
    ${p.hasOcr ? `<details class="ocrbox"><summary>🖼 اتقرا من الصورة${p.ocrGain && p.ocrGain.length ? " — ضاف: " + esc(p.ocrGain.join("، ")) : ""}</summary><div class="ocrtxt">${esc(p.ocr || "")}</div></details>` : ""}
    <div class="c-bot">
      <div class="sgn-who"><span class="sgn-name">👤 ${esc(p.sender || "—")} ${purChip(p)}</span><span class="sgn-grp">👥 ${esc(p.groups[0])}${more}</span>
      ${postLink(p)}
      <span class="phones">${phonesHtml(p)}</span></div>
      <span class="acts">
        ${ms.length && !opts.hideMatchBtn ? `<button class="btn sm mbtn" data-act="matches">🔗 ${ms.length} ${p.type === "request" ? "عرض مناسب" : "طلب مناسب"} ${open ? "▲" : "▼"}</button>` : ""}
        ${cl ? `<button class="btn sm dupbtn" data-act="dups" title="نفس الوحدة غالبًا">👯 ${cl.count} ناشرين${cl.minPrice ? " · أقل سعر " + PH.fmtPrice(cl.minPrice) : ""} ${dupOpen ? "▲" : "▼"}</button>` : ""}
        ${p.type === "request" && (p.phones.length || p.uid) ? `<button class="btn sm" data-act="tplPost">💬 رد جاهز</button>` : ""}
        ${(p.type === "offer" || p.type === "request") && !opts.hideMatchBtn ? `<button class="btn sm" data-act="toListing" title="${p.type === "request" ? "ضيف الطلب ده في «هاتلي مشتري» وهات له البائعين" : "ضيف العرض ده في «هاتلي مشتري» وهات له المشترين"}">🎯 ${p.type === "request" ? "هاتلي بايع" : "هاتلي مشتري"}</button>` : ""}
        ${p.type === "offer" ? crmBtn(p.id) : ""}
        <button class="btn sm" data-act="fix" title="البيانات اللي اتسحبت غلط؟ صحّحها">✏️ صحّح</button>
        <button class="btn sm" data-act="copyText">نسخ</button>
        <button class="btn sm" data-act="done">${p.done ? "↩️ رجّعه" : "✓ خلصت"}</button>
        <button class="btn sm danger" data-act="del">🗑</button>
      </span>
    </div>
    ${state.tplFor === "p:" + p.id ? tplMenu("p:" + p.id) : ""}
    ${open && ms.length ? `<div class="mbox">${ms.map(miniMatch).join("")}</div>` : ""}
    ${dupOpen && cl ? `<div class="mbox"><div class="why">👯 نفس الوحدة غالبًا — ${cl.posters} ناشرين${cl.minPrice && cl.maxPrice && cl.minPrice !== cl.maxPrice ? ` · الأسعار من ${PH.fmtPrice(cl.minPrice)} لـ ${PH.fmtPrice(cl.maxPrice)}` : ""}</div>
      ${cl.ids.filter((i) => i !== p.id).map((i) => byId.get(i)).filter(Boolean).sort((a, b) => (a.price || 9e15) - (b.price || 9e15)).map((o) =>
        miniMatch({ id: o.id, score: o.id === cl.cheapestId ? "الأرخص" : o.id === cl.ownerId ? "الأصل؟" : "", why: [o.id === cl.firstId ? "أول واحد نزّلها" : "", o.isBroker === false ? "شكله المالك" : ""].filter(Boolean) })).join("")}</div>` : ""}
  </article>`;
}
// لو كذا عرض لنفس الوحدة طابقوا، نعرض الأرخص بس
function dedupeMatches(ms) {
  const seen = new Set();
  return ms.filter((m) => { const c = clusters.get(m.id); if (!c) return true; if (seen.has(c.cid)) return false; seen.add(c.cid); return true; });
}
function miniMatch(m) {
  const o = byId.get(m.id);
  if (!o) return "";
  return `<div class="mini" data-id="${o.id}">
    <div class="c-top">${m.score !== "" ? `<span class="score">${typeof m.score === "number" ? m.score + "%" : esc(m.score)}</span>` : ""}${isOwnerPost(o) ? `<span class="badge b-owner">🏠 من المالك</span>` : ""}${head(o)}${chips(o)}<span class="when">${fmtWhen(o)}</span></div>
    ${m.why.length ? `<div class="why">✔ ${m.why.map(esc).join(" · ")}</div>` : ""}
    ${o.summary ? `<div class="summary">🤖 ${esc(o.summary)}</div>` : ""}
    <div class="text">${OH(o.text)}</div>
    <div class="c-bot"><span>👤 ${esc(o.sender || "—")}</span><span>👥 ${esc(o.groups[0])}</span>
      ${postLink(o)}
      <span class="phones">${phonesHtml(o)}</span></div>
  </div>`;
}

// ================= 🤝 التطابق: مشتري ⟷ بايع =================
const unitInAreaAny = (S) => S.units.some(unitInArea);
const uLine = (u) => { const L = u.land || {}; return [(UNIT1[u.category] || "وحدة") + (L.type ? " " + L.type : ""), u.rooms ? u.rooms + " غرف" : "", u.areaM2 ? u.areaM2 + " م²" : "", u.region || "", L.mugawra ? "مج " + L.mugawra : "", L.plot ? "ق " + L.plot : "",
  u.price ? PH.fmtPrice(u.price) : "", L.over ? "أوفر " + PH.fmtPrice(L.over) : "", (L.features || []).includes("ناصية") ? "ناصية" : ""].filter(Boolean).join(" · "); };
// 📞 الرقم اتلقط من بوست/تعليق تاني للشخص نفسه: نوريه منين (ولينك يتأكد بنفسه). ولو مفيش رقم خالص: زرار «دوّر على رقمه» (يفتح بوستاته ويقرا تعليقاته)
const DEEP_REG = new Map();
const deepKeyOf = (P) => PH.deepKey({ uid: P.uid, name: P.name });
function phoneSrcTag(P) {
  const s = P.phoneSrc; if (!s || !(P.phones || []).length) return "";
  const kind = s.kind === "post" ? "بوست تاني ليه" : "تعليق ليه";
  const tip = `الرقم ده هو كاتبه بنفسه في ${kind} (${s.method === "name" ? "اتعرّف عليه باسمه الكامل" : "نفس الحساب"})${s.text ? " — «" + String(s.text).slice(0, 110) + "»" : ""}`;
  return s.url ? `<a class="btn sm lnk phsrc" href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(tip)}">📎 من ${s.kind === "post" ? "بوست" : "تعليق"} تاني</a>` : `<span class="phsrc" title="${esc(tip)}">📎 من ${s.kind === "post" ? "بوست" : "تعليق"} تاني</span>`;
}
function deepBtn(P) {
  const k = deepKeyOf(P); if (!k || k === "n:") return "";
  DEEP_REG.set(k, P);
  const d = mineDeep && mineDeep[k], tried = d && d.tried && !(d.phones && d.phones.length), run = !!(mineDeepJob && mineDeepJob.running);
  return `<button class="btn sm deepb" data-deepone="${esc(k)}"${run ? " disabled" : ""} title="يفتح بوستاته ويقرا تعليقاته وردوده ويدوّر على رقمه">${tried ? "🔎 دوّر تاني على رقمه" : "🔎 دوّر على رقمه"}</button>${tried ? `<span class="muted deepno" title="دوّرنا عليه ${esc(relDay(d.tried))} ومالقيناش رقم في تعليقاته">لسه من غير رقم</span>` : ""}`;
}
const telBtns = (P) => {
  const prof = LEADS.profileLink(P), msgr = LEADS.messengerLink(P), has = !!(P.phones && P.phones[0]);
  return (has ? `<a class="btn sm wa" href="${PH.waLink(P.phones[0])}" target="_blank">💬 ${esc(P.phones[0])}</a>${phoneSrcTag(P)}` : "") +
    (!has && prof ? `<a class="btn sm" href="${esc(prof)}" target="_blank">👤 البروفايل</a>` : "") +
    (!has && msgr ? `<a class="btn sm" href="${esc(msgr)}" target="_blank">✉️ رسالة</a>` : "") + (!has ? deepBtn(P) : "");
};
// 🔗 روابط الأصل بتاع كل طرف: بتفتح المنشور أو الكومنت نفسه (سواء كان طلب أو عرض أو تعليق على بوست)
const lnk = (href, label, cls = "btn sm lnk") => (href ? `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener">${label}</a>` : "");
function buyerLinkList(B, u) { // [{href,label}] — الطلب / تعليقه / البوست اللي علّق عليه / البروفايل
  const ev = buyerEv(B, u), a = ev.act || {}, out = [];
  if (ev.kind === "request") out.push({ href: a.postUrl || ev.url, label: "🔗 الطلب" });
  else if (ev.kind === "me2" || ev.kind === "comment") {
    const cu = a.commentUrl || ev.url;
    out.push({ href: cu, label: ev.kind === "me2" ? "🔗 تعليقه «وأنا كمان»" : "🔗 تعليقه" });
    if (a.postUrl && a.postUrl !== cu) out.push({ href: a.postUrl, label: "🔗 البوست اللي علّق عليه" });
  }
  const prof = LEADS.profileLink(B); if (prof && B.phones[0]) out.push({ href: prof, label: "👤 البروفايل" }); // من غير رقم: زرار البروفايل في telBtns
  return out.filter((x) => x.href);
}
const buyerLinks = (B, u) => buyerLinkList(B, u).map((x) => lnk(x.href, x.label)).join("");
function sellerLinkList(S, u) { // العرض (بوست) أو التعليق اللي عرض فيه + البروفايل
  const out = [], isC = u.kind === "comment";
  const href = isC ? u.commentUrl || u.url : u.url;
  if (href) out.push({ href, label: isC ? "🔗 تعليقه (عرض)" : "🔗 العرض" });
  const prof = LEADS.profileLink(S); if (prof && S.phones[0]) out.push({ href: prof, label: "👤 البروفايل" });
  return out;
}
const sellerLinks = (S, u) => sellerLinkList(S, u).map((x) => lnk(x.href, x.label)).join("");
const primaryUrl = (x, side) => (side === "S" ? ((x.u.kind === "comment" ? x.u.commentUrl || x.u.url : x.u.url) || "") : ((buyerLinkList(x.B, x.u)[0] || {}).href || ""));
function pairMini(x, side) {
  if (side === "seller") return `<div class="pm"><span class="score">${x.score}%</span><b>${esc(x.S.name)}</b>${roleBadge(x.S)}
    <span class="muted">${esc(uLine(x.u))}</span>${telBtns(x.S)}${sellerLinks(x.S, x.u)}</div>`;
  return `<div class="pm"><span class="score">${x.score}%</span><b>${esc(x.B.name)}</b>${x.B.superHot ? `<span class="l-lvl super">💎</span>` : `<span class="badge lv${x.B.level}t">${LEADS.fires(x.B.level)}</span>`}
    <span class="muted">${esc(x.B.want.text)}${x.B.range ? " · " + PH.fmtPrice(x.B.range.mid) : ""}</span>${telBtns(x.B)}${buyerLinks(x.B, x.u)}</div>`;
}
// 🔎 بحث موحّد في كل القوائم: كلمات (بمرادفاتها) أو رقم تليفون بأي صيغة (٠١٠… / +20 10… / ١٠١٢…) أو اسم أو منطقة
const qNorm = (v) => PH.norm(String(v == null ? "" : v).trim());
function qOK(q, text, phones, ctx) {
  if (!q) return true;
  if (/^[+\d\s\-().]+$/.test(q) && /\d/.test(q)) {
    let d = q.replace(/\D/g, "");
    if (d.length > 9 && d.startsWith("20")) d = d.slice(2);
    d = d.replace(/^0+/, "");
    if (d.length >= (/^[+0]/.test(q) ? 4 : 5) && (phones || []).some((ph) => String(ph).replace(/\D/g, "").includes(d))) return true;
  }
  return PH.qMatch(q, text || "", ctx || {});
}
// 🏷 خانات المشتري في التطابق: صافي (موثّق + صافي) · مشتبه · مكتب/سمسار · الكل
const TIER_TABS = { pure: "✅ مشتري صافي", suspect: "🟡 مشتبه", office: "🏢 مكتب / سمسار", all: "الكل" };
const tierSel = (sel, t) => sel === "all" || (sel === "pure" ? t === "verified" || t === "pure" : t === sel);
const tierRank = (t) => (typeof ROLE !== "undefined" && ROLE.TIERS[t] ? ROLE.TIERS[t].ord : 2);
function tierChip(L) {
  if (!L || typeof ROLE === "undefined") return "";
  const T = ROLE.tierBadge(L), why = [...(L.bwhy || []).slice(0, 3), ...(L.bneg || []).slice(0, 2)].join(" • ");
  return `<span class="badge ${T.cls} tier-chip" data-tier="${T.k}" title="${esc(why)}">${T.ic} ${esc(T.t)}${T.sub ? " · " + esc(T.sub) : ""}</span>`;
}
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
function matchEmpty() {
  const reqs = items.filter((p) => p.type === "request"), offs = items.filter((p) => p.type === "offer");
  const buyers = leads.filter((L) => !L.isBroker && L.level >= 1), sellersN = sellers.length;
  const anyMin = pairs.length; // كل التطابقات اللي المحرك طلعها (>=50%)
  const atMin = pairs.filter((x) => x.score >= state.mMin).length; // عدّت حد النسبة الحالي
  const inAreaAtMin = pairs.filter((x) => x.score >= state.mMin && unitInArea(x.u) && leadInArea(x.B)).length;
  const btn = (t, act) => `<button class="btn sm" data-mact="${act}">${t}</button>`; // (من غير onclick جوه الصفحة — الإضافة بتمنعه)
  const lowerBtn = btn("🤝 اعرض كل التطابقات (50%+)", "min50");
  let head, hint = "";
  if (!reqs.length && !buyers.length) { head = "لسه مفيش مشترين أو طلبات"; hint = "البرنامج بيلاقي المشترين من الطلبات ومن تعليقات العروض. اسحب الجروبات وفعّل «⚡ ذكي» في تعليقات فيسبوك عشان يلقط اللي بيسألوا على العروض."; }
  else if (!offs.length && !sellersN) { head = "لسه مفيش عروض أو بايعين"; hint = "التطابق بيوصّل بين مشتري وبايع — محتاج عروض بيع كمان. اسحب جروبات فيها عروض، أو فعّل ماركت بليس."; }
  else if (!anyMin) { head = `عندك ${ar(reqs.length + buyers.length)} طلب/مشتري و ${ar(offs.length + sellersN)} عرض/بايع — بس مفيش تطابق بينهم`; hint = "غالبًا المناطق أو الأنواع مختلفة (مشتري عايز أرض في حي، والعروض في حي تاني). راجع إن مناطقك في الإعدادات واسعة كفاية."; }
  else if (!atMin && state.mMin > 50) { head = `مفيش تطابق فوق ${state.mMin}% — بس فيه ${ar(anyMin)} تطابق أضعف`; hint = lowerBtn; }
  else if (!inAreaAtMin && atMin) { head = `فيه ${ar(atMin)} تطابق بس كلهم برا مناطقك المحددة`; hint = "مناطق التركيز بتخفي اللي بره. وسّعها من ⚙️ الإعدادات ← 📍 منطقتك، أو اعرض المحافظة كلها."; }
  else if (state.mBuyer > 1) { head = "مفيش تطابق مع المشترين الأقوى بس"; hint = btn("اعرض كل المشترين المهتمين", "buyer1"); }
  else if (state.mCat !== "all" || state.mRegion || state.mOwner || state.mPhones || state.mNewOnly) { head = "مفيش تطابق بالفلاتر دي"; hint = btn("🧹 شيل كل الفلاتر", "clear"); }
  else { head = "مفيش تطابقات دلوقتي"; hint = anyMin ? lowerBtn : "لما البرنامج يسحب طلبات وعروض في نفس المناطق هيوصّل بينهم هنا."; }
  return `<div class="empty"><b>${head}</b><div style="margin-top:8px">${hint}</div></div>`;
}
function renderMatches() {
  { const mi = $("mSearch"); if (mi && mi.value !== (state.mq || "")) mi.value = state.mq || ""; }
  const all = pairFiltered({ cat: true });
  const list = pairFiltered();
  $("mKpis").innerHTML = `
    <div class="kpi"><b>${pairs.filter((x) => x.score >= 70).length}</b><span>🤝 مطابقة قوية (70%+)</span></div>
    <div class="kpi"><b>${new Set(pairs.filter((x) => x.score >= 70).map((x) => x.B.key)).size}</b><span>🛒 مشتري ليه بايع مناسب</span></div>
    <div class="kpi"><b>${new Set(pairs.filter((x) => x.score >= 70).map((x) => x.S.key)).size}</b><span>🏷 بايع ليه مشتري مناسب</span></div>
    <div class="kpi"><b>${new Set(pairs.filter((x) => x.score >= 70).map((x) => x.u.id)).size}</b><span>📢 عرض ليه مشتري مناسب</span></div>
    <div class="kpi kpi-btn ${state.mOwner ? "on" : ""}" data-mownerk title="دوس عشان تعرض التطابق مع الملاك بس"><b>${pairs.filter((x) => x.score >= 70 && x.S.owner).length}</b><span>🏠 مع المالك مباشرة (من غير سمسار)</span></div>
    <div class="kpi kpi-hot"><b>${pairs.filter((x) => x.score >= 70 && x.B.superHot).length}</b><span>💎 مع مشتري مهتم جدًا</span></div>
    <div class="kpi kpi-btn kpi-new ${state.mNewOnly ? "on" : ""}" data-mnewk title="التطابقات اللي نزلت بعد آخر مرة شفت فيها الشاشة دي — دوس تعرضها بس"><b>${pairs.filter((x) => x.score >= 70 && pairIsNew(x)).length}</b><span>🆕 جديد (70%+) <button class="btn sm" data-mseen title="علّم كل الجديد إنك شفته">✔ شفته</button></span></div>`;
  { // 🧪 مستوى التطابق: العدّادات بتتحسب من غير فلتر المشتري ومن غير فلتر المستوى نفسه
    const allC = pairFiltered({ tier: true, combo: true }), cc = (k) => allC.filter((x) => comboOf(x) === k).length;
    const nAllC = pairFiltered({ combo: true }).length;
    const CD = { all: ["📋", "الكل", "كل التطابقات (حسب نوع المشتري تحت)"], t1: ["💎", "صافي ↔ صافي", "مشتري صافي مع بايع مالك — أنضف تطابق"], t2: ["🟢", "مشتري صافي ↔ مكتب/سمسار", "المشتري صافي والبايع مشتبه أو مكتب أو سمسار"], t3: ["🟠", "مشتبه ↔ مكتب/سمسار", "المشتري مشتبه أو مكتب والبايع مكتب أو سمسار"] };
    $("mComboTabs").innerHTML = lvlHtml("🧪 مستوى التطابق", "اختار تركيبة المشتري والبايع اللي عايز تشوفها", Object.keys(COMBO_TABS).map((k) => ({ k, ic: CD[k][0], t: CD[k][1], d: CD[k][2], n: k === "all" ? nAllC : cc(k) })), state.mCombo, "mcombo");
  }
  { const allT = pairFiltered({ tier: true, combo: true }), cnt = (k) => allT.filter((x) => tierSel(k, x.B.btier)).length, tOn = (k) => state.mCombo === "all" && state.mTier === k;
    $("mTierTabs").innerHTML = `<span class="tier-lbl">🛒 نوع المشتري</span>` + Object.entries(TIER_TABS).map(([k, v]) => `<button class="tab ${tOn(k) ? "on" : ""}" role="tab" aria-selected="${tOn(k)}" data-mtier="${k}">${v}<small>${cnt(k)}</small></button>`).join("");
    const note = { pure: "مشترين كاتبين طلبهم بأنفسهم من غير أي علامة سمسرة، أو أكدوا على واتساب (💎).", suspect: "مشترين مش واضح هما فعلًا المشتري ولا بيجمعوا عروض لعميل — اتأكد منهم قبل ما تضيّع وقت.", office: "ناس شكلهم مكاتب أو سماسرة أو تجار بيطلبوا بكميات (أو قالوا هما كده) — ظاهرين هنا بس مش في «صافي».", all: "كل المشترين مرتبين: موثّق ← صافي ← مشتبه ← مكتب/سمسار." }[state.mTier] || "";
    const n0 = cnt(state.mTier), others = Object.keys(TIER_TABS).filter((k) => k !== state.mTier && k !== "all" && cnt(k) > 0);
    if (state.mCombo !== "all") { // مستوى مختار: بنشرح معناه، ولو فاضي نقترح المستويات اللي فيها تطابقات
      const C = typeof ROLE !== "undefined" ? ROLE.COMBOS[state.mCombo] : null, allC2 = pairFiltered({ tier: true, combo: true }), c2 = (k) => allC2.filter((x) => comboOf(x) === k).length;
      const oth = Object.keys(COMBO_TABS).filter((k) => k !== "all" && k !== state.mCombo && c2(k) > 0);
      $("mTierNote").innerHTML = `<span class="muted">${esc(C ? C.d : "")} — بيتجاهل فلتر نوع المشتري اللي تحت.</span>` + (!c2(state.mCombo) && oth.length ? ` <b>مفيش هنا دلوقتي —</b> ${oth.map((k) => `<button class="btn sm" data-mcombo="${k}">${COMBO_TABS[k]} (${ar(c2(k))})</button>`).join(" ")}` : "");
    } else $("mTierNote").innerHTML = `<span class="muted">${esc(note)}</span>` + (!n0 && others.length ? ` <b>مفيش هنا دلوقتي —</b> ${others.map((k) => `<button class="btn sm" data-mtier="${k}">${TIER_TABS[k]} (${ar(cnt(k))})</button>`).join(" ")}` : ""); }
  $("mCatTabs").innerHTML = tabsHtml(catsTabs(), state.mCat, "mcat", (k) => k === "all" ? all.length : all.filter((x) => x.u.category === k).length);
  const regs = countBy(pairs.filter((x) => x.score >= state.mMin), (x) => x.u.region);
  $("mRegion").innerHTML = `<option value="">📍 كل المناطق</option>` + [...regs].sort((a, b) => b[1] - a[1]).map(([r, n]) => `<option ${r === state.mRegion ? "selected" : ""} value="${esc(r)}">${esc(r)} (${n})</option>`).join("");
  renderLearn();
  { const fb = $("mFastBar"); if (fb && !fastOn) { fb.hidden = true; fb.textContent = ""; } }
  if (fastOn) { lastCards = null; deepMatchUI(list); renderFast(list); return; } // ⚡ صف لكل مشتري
  const cards = matchCards(list); lastCards = cards;
  const nG = cards.filter((c) => c.g).length, nNew = list.filter(pairIsNew).length;
  $("mCount").textContent = `${list.length} مطابقة` + (grpOn ? ` في ${cards.length} كارت${nG ? ` (${nG} مجمّعين)` : ""}` : "") + (nNew ? ` · 🆕 ${nNew} جديد` : "") + (state.mq ? ` — بحث: «${state.mq}» ` : "");
  deepMatchUI(list);
  if (!list.length) {
    $("mList").innerHTML = matchEmpty();
    if (window.FBID) FBID.sec("matches", $("mList"), []);
    return;
  }
  $("mList").innerHTML = cards.slice(0, state.mShown).map((c) => (c.g ? groupCard(c) : pairCard(c.items[0]))).join("") + (cards.length > state.mShown ? `<button class="btn more" data-mmore>عرض المزيد (${cards.length - state.mShown})</button>` : "");
  if (window.FBID) FBID.sec("matches", $("mList"), [{ label: "المشترين", items: uniqBy(list.map((x) => x.B), (b) => b.key) }, { label: "البايعين", items: uniqBy(list.map((x) => x.S), (s) => s.key) }]);
}
// 🏠 «المالك» في التطابق: تصنيف نص الوحدة (البايع) ونص طلب المشتري + هل الاتنين متفقين (طالب من المالك ⟷ البايع مالك)
function ownUnitRole(u, S) {
  if (!HAS_OWN) return { mention: false };
  return OWNMK.roleOf({ type: "offer", text: u.text || "", isBroker: u.isBroker }, sellerRoleCtx(S), true);
}
function ownBuyerRole(B, u) {
  if (!HAS_OWN) return { mention: false };
  const ev = buyerEv(B, u);
  const r = OWNMK.classify(ev.text || "", { kind: "request", mentionOnly: true });
  return r.mention ? r : OWNMK.classify((B.want && B.want.text) || "", { kind: "request", mentionOnly: true });
}
const ownBadgeU = (u, S, sm) => { const r = ownUnitRole(u, S); return r.mention && r.t && r.src !== "ai" ? OWNMK.badgeHtml(r, esc) : ""; };
const ownBadgeB = (B, u) => { const r = ownBuyerRole(B, u); return r.mention && r.t ? OWNMK.badgeHtml(r, esc) : ""; };
function ownPair(x) {
  if (!HAS_OWN) return "";
  const b = ownBuyerRole(x.B, x.u);
  if (!b.wantsOwner) return "";
  const ur = ownUnitRole(x.u, x.S);
  const owner = x.S.owner || ur.role === "owner", broker = !owner && (x.S.isBroker || BROKERISH.includes(ur.role));
  return owner ? `<span class="own-pair ok" title="المشتري كاتب «المالك» في طلبه، والبايع متصنّف مالك">🏠 طالب «من المالك» والبايع مالك ✔</span>`
    : broker ? `<span class="own-pair bad" title="المشتري كاتب «المالك» في طلبه، والبايع سمسار/مكتب">⚠ طالب «من المالك» والبايع سمسار/مكتب</span>`
    : `<span class="own-pair maybe" title="المشتري كاتب «المالك» في طلبه، ومش مؤكد إن البايع مالك">🟡 طالب «من المالك» — البايع لسه مش مؤكد مالك</span>`;
}
function pairCard(x) {
  const B = x.B, S = x.S, u = x.u, ev = buyerEv(B, u);
  return `<article class="card pair${justKeys.has(MATCH.pairFbKey(x)) ? " just" : ""}" data-pair="${esc(B.key)}|${esc(u.id)}">
    <div class="pair-score" style="--p:${x.score}">${pcount(1)}<b>${x.score}%</b><span>تطابق</span>${pairIsNew(x) ? `<em class="newbadge">🆕 جديد</em>` : ""}</div>
    <div class="pair-side buyer" data-lkey="${esc(B.key)}">
      ${window.FBID ? FBID.chip(B) : ""}<div class="side-h">🛒 المشتري <small>(الطالب)</small></div>
      <div class="l-name">${esc(B.name)} ${tierChip(B)} ${B.superHot ? `<span class="l-lvl super">🔥 مهتم جدًا</span>` : `<span class="l-lvl">${LEADS.fires(B.level)} ${LEADS.levelName(B.level)}</span>`}${ownBadgeB(B, u)}</div>
      <div class="pv"><b>${esc(B.want.text)}</b>${B.matchedAct && (B.wants || []).length > 1 ? ` <small class="muted" title="المشتري ده نازل أكتر من طلب — التطابق ده لطلب واحد منهم بالذات">🎯 طلب من ${ar(B.wants.length)} طلبات</small>` : ""}</div>
      ${ev.text ? `<div class="muted ellip pq">«${OHS(ev.text, 150)}»</div>` : ""}
      <div class="muted">${B.range ? `💰 ${B.range.min === B.range.max ? "حوالي " + PH.fmtPrice(B.range.min) : PH.fmtPrice(B.range.min) + " – " + PH.fmtPrice(B.range.max)}` : "💰 ميزانيته مش واضحة"} · 🕒 ${relDay(B.last)} · ${B.posts} بوست</div>
      <div class="contact">${telBtns(B)}${buyerLinks(B, u)}<button class="btn sm primary" data-pairsend="buyer">📤 ابعتله الوحدة</button></div>
    </div>
    <div class="pair-side seller" data-skey="${esc(S.key)}">
      ${window.FBID ? FBID.chip(S) : ""}<div class="side-h">🏷 البايع <small>(العارض)</small> ${roleBadge(S)}${ownBadgeU(u, S)}</div>
      <div class="l-name">${esc(S.name)}</div>
      <div class="pv"><b>${esc(uLine(u))}</b></div>
      <div class="muted ellip">${OHS(u.text, 150)}</div>
      <div class="contact">${telBtns(S)}${sellerLinks(S, u)}<button class="btn sm" data-pairsend="seller">📤 كلّمه عن المشتري</button>${crmBtn(u.id, S.key)}</div>
    </div>
    <div class="pair-why"><span>✔ ${x.why.map(esc).join(" · ")}</span><span class="pm-cmp pair-cmp" title="ليه اتطابقوا؟ ✔ مناسب · ≈ قريب · ✖ مش مناسب · ❔ العرض ماكتبهاش">${cmpChips(x)}</span>${ownPair(x)}<span class="pair-acts">${fbBtns(x)}${dealBtn(x)}</span></div>
  </article>`;
}
// ===== 📞 دوّر على أرقام اللي من غير رقم في التطابقات =====
// أول حاجة: أي رقم الشخص كاتبه بنفسه في أي بوست/تعليق عندنا بيتجاب أوتوماتيك (المحرك). اللي لسه من غير رقم: بنفتح بوستاته ونقرا تعليقاته وردوده.
function deepTargetOf(P) {
  const urls = [], add = (u) => { if (u && !urls.includes(u)) urls.push(u); }, acts = P.acts || [];
  for (const a of acts) if (a.kind === "request") add(a.postUrl); // بوستاته هو الأول (غالبًا بيكتب رقمه في تعليق على بوسته)
  for (const u of P.units || []) if (u.kind !== "comment") add(u.url);
  for (const a of acts) if (a.kind !== "request") add(a.postUrl); // وبعدين البوستات اللي علّق عليها
  for (const u of P.units || []) if (u.kind === "comment") add(u.commentUrl || u.url);
  return { uid: P.uid || "", name: P.name || "", url: urls[0] || "", urls: urls.slice(1, 8), group: (P.groups || [])[0] || "" };
}
function deepTargetsFrom(list, max = 60) {
  const m = new Map();
  for (const x of list) for (const P of [x.B, x.S]) {
    if (!P || (P.phones && P.phones.length)) continue;
    const k = deepKeyOf(P); if (!k || k === "n:" || m.has(k)) continue;
    const t = deepTargetOf(P); if (!t.url) continue;
    m.set(k, t); if (m.size >= max) return [...m.values()];
  }
  return [...m.values()];
}
function deepMatchUI(list) {
  const b = $("mDeepAll"), ln = $("mDeepLine"); if (!b || !ln) return;
  const n = deepTargetsFrom(list || [], 60).length, dj = mineDeepJob || {}, run = !!(dj.running && laneQ("deep"));
  b.textContent = `📞 دوّر على أرقام اللي من غير رقم${n ? " (" + ar(n) + ")" : ""}`; b.disabled = run || !n;
  const txt = run ? `⏳ <b>بيدوّر على الأرقام</b> — بوست ${Math.min((dj.scanned || 0) + 1, dj.total || 1)} من ${dj.total || 1} · لقى <b>${dj.found || 0}</b> رقم — بتظهر على الكروت أول بأول`
    : dj.waiting || dj.busy ? "⏳ مستني السحب اللي شغال يخلص وهيدوّر على الأرقام على طول"
    : dj.finishedAt && Date.now() - dj.finishedAt < 6 * 36e5 ? `${dj.found ? "✅" : "ℹ️"} آخر بحث عن الأرقام ${relDay(dj.finishedAt)} — لقى ${ar(dj.found || 0)} رقم${dj.total ? ` في ${ar(dj.total)} بوست` : ""}` : "";
  ln.hidden = !txt; ln.innerHTML = txt;
}
async function deepRun(targets) {
  if (!targets.length) return toast("📞 كل الظاهرين معاهم أرقام (أو مفيش لينك بوست ليهم ينفع)");
  const r = await chrome.runtime.sendMessage({ type: "mineDeep", targets }).catch((er) => ({ ok: false, error: String(er.message || er) }));
  if (!r || !r.ok) return toast("❌ " + ((r && r.error) || "مفيش رد"));
  const x = r.r || {};
  return toast(x.started ? `🔎 بدأ يدوّر على أرقام ${ar(x.people)} شخص (${ar(x.items)} بوست) — الأرقام هتظهر على الكروت أول بأول`
    : x.busy ? "⏳ فيه سحب شغال — هيدوّر على الأرقام أول ما يخلص"
    : x.found || x.local ? `✅ لقى ${ar(x.found || x.local)} رقم من داتا قديمة من غير فتح بوستات` : "ℹ️ مفيش حد محتاج بحث (اتدوّر عليهم قبل كده ومفيش لينك بوست ينفع)");
}
document.addEventListener("click", (e) => {
  const one = e.target.closest("[data-deepone]");
  if (one) { e.preventDefault(); const P = DEEP_REG.get(one.dataset.deepone); if (P) deepRun([deepTargetOf(P)]); return; }
  if (e.target.closest("#mDeepAll")) deepRun(deepTargetsFrom(pairFiltered(), 60));
});
// ================= 🗂 تجميع التطابقات: الشخص ومعاه كل اللي متطابقين معاه في كارت واحد + نافذة التفاصيل =================
const pcount = (n, w) => `<i class="pcount" title="متطابق مع ${n}"><b>${ar(n)}</b><small>${w || "متطابق مع"}</small></i>`;
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
const uKind = (u) => { const L = u.land || {}; return [(UNIT1[u.category] || "وحدة") + (L.type ? " " + L.type : ""), u.rooms ? u.rooms + " غرف" : "", u.finishing || ""].filter(Boolean).join(" · "); };
const uShort = (u) => [u.region, u.areaM2 ? u.areaM2 + " م²" : "", u.price ? PH.fmtPrice(u.price) : ""].filter(Boolean).join(" · ");
const rngTxt = (r) => (r.min === r.max ? PH.fmtPrice(r.min) : PH.fmtPrice(r.min) + " – " + PH.fmtPrice(r.max));
// 🏷 الوحدات اللي ليها مشترين في كارت بايع: كل وحدة + عدد مشتريها + أفضل نسبة (عشان البايع اللي عنده وحدات كتير ما يتلخبطش)
function unitStats(c) {
  const m = new Map();
  for (const x of c.items) { let r = m.get(x.u.id); if (!r) m.set(x.u.id, (r = { u: x.u, n: 0, best: 0 })); r.n++; if (x.score > r.best) r.best = x.score; }
  return [...m.values()].sort((a, b) => b.best - a.best || b.n - a.n);
}
const unitUrlOf = (u) => ((u.kind === "comment" ? u.commentUrl || u.url : u.url) || "");
const unitLnk = (u, label = u.kind === "comment" ? "🔗 التعليق" : "🔗 المنشور") => lnk(unitUrlOf(u), label, "btn sm lnk pg-ulink"); // 🔗 رابط منشور كل وحدة (لو البايع نازل أكتر من وحدة)
const unitNo = (i) => `<i class="pg-un" title="ترتيب الوحدة">${ar(i + 1)}</i>`;
// الصفوف بتاعة وحدة واحدة داخل كارت بايع (c.items مترتّبة وحدة وحدة فهي متجاورة)
const rowsOfUnit = (c, id) => c.items.filter((x) => x.u.id === id);
const buyerWord = (n) => (n === 1 ? "مشتري واحد" : n === 2 ? "مشتريين" : n > 10 ? "مشتري" : "مشترين");
const unitCountHtml = (r) => `<span class="pg-uc">🛒 ${r.n === 1 ? "" : ar(r.n) + " "}${buyerWord(r.n)} · أفضل <b>${ar(r.best)}%</b></span>`;
// صف مصغّر للطرف التاني: السكور + الاسم + التفاصيل (الوحدة أو الطلب) + رقم/رابط — وبيفتح النافذة على نفس التطابق
function pmRow(c, x, rank) {
  const isB = c.side === "B", P = isB ? x.S : x.B, u = x.u, nw = pairIsNew(x);
  const lvl = (isB ? roleBadge(P) + ownBadgeU(u, P)
    : tierChip(P) + (P.superHot ? `<span class="l-lvl super">🔥 مهتم جدًا</span>` : `<span class="l-lvl">${LEADS.fires(P.level)}</span>`) + ownBadgeB(P, u));
  const multiReq = isB && c.items.some((y) => y.B.want.text !== x.B.want.text);
  const det = isB ? uLine(u) + (multiReq ? " ← لطلب «" + x.B.want.text.replace(/^عايز يشتري /, "") + "»" : "") : `${P.want.text.replace(/^عايز يشتري /, "")}${P.range ? " · 💰 " + rngTxt(P.range) : ""}`;
  const ev = isB ? null : buyerEv(P, u), txt = isB ? (u.text || "") : (ev && ev.text) || "";
  const snip = HAS_OWN ? OWNMK.snip(txt, 110) : String(txt).replace(/\s+/g, " ").slice(0, 110);
  const href = primaryUrl(x, isB ? "S" : "B");
  return `<div class="pm-row ${isB ? "seller" : "buyer"}${nw ? " new" : ""}" data-pair="${esc(x.B.key)}|${esc(u.id)}">
    <b class="pm-sc" style="--p:${x.score}">${x.score}%</b>
    <div class="pm-main">
      <div class="pm-top">${rank ? `<i class="pm-rank" title="ترتيب المشتري تحت الوحدة دي">#${ar(rank)}</i>` : ""}<span class="pm-name">${isB ? "🏷" : "🛒"} ${esc(P.name)}</span>${lvl}${nw ? `<em class="newbadge">🆕 جديد</em>` : ""}<small class="pm-time">🕒 ${relDay(P.last)}</small></div>
      <div class="pm-det">${esc(det)}</div>
      ${!isB ? `<div class="pm-cmp" title="ليه اتطابقوا؟ ✔ مناسب · ≈ قريب · ✖ مش مناسب">${cmpChips(x)}</div>` : ""}
      ${snip ? `<div class="pm-txt">«${OHS(snip, 110)}»</div>` : ""}${ownPair(x)}
    </div>
    <div class="pm-acts">${telBtns(P)}${isB ? lnk(href, u.kind === "comment" ? "🔗 التعليق" : "🔗 العرض") : buyerLinkList(P, u).filter((l) => !/البروفايل/.test(l.label)).slice(0, 2).map((l) => lnk(l.href, l.label)).join("") || lnk(href, "🔗 الطلب")}</div>
  </div>`;
}
// كارت مشتري ليه أكتر من طلب: بنكتب الطلبات اللي اتطابقت (مش طلب واحد بس)
const reqLine = (c, H) => { const ts = [...new Set(c.items.map((x) => x.B.want.text))]; return ts.length > 1 ? ts.slice(0, 3).map((t) => t.replace(/^عايز يشتري /, "")).join("  ‖  ") : H.want.text; };
function groupCard(c) {
  const H = c.head, isB = c.side === "B", n = c.items.length, SHOW = n <= 5 ? n : 4;
  const word = isB ? (n > 10 ? "بايع" : "بايعين") : (n > 10 ? "مشتري" : "مشترين");
  const st = isB ? null : unitStats(c);
  let rows, more;
  if (isB) {
    rows = `<div class="pm-list">${c.items.slice(0, SHOW).map((x) => pmRow(c, x)).join("")}</div>`;
    more = n > SHOW ? `<button class="pm-more" data-grpopen>＋ ${ar(n - SHOW)} عرض كمان — افتح النافذة وشوف الكل</button>` : "";
  } else { // 🔢 كل وحدة (بالترتيب) وتحتها مشتريها مترتّبين، وعلى كل وحدة وكل مشتري رابط منشوره
    const MAXU = 3, PERU = st.length === 1 ? SHOW : 2;
    rows = `<div class="pg-ublocks">${st.slice(0, MAXU).map((r, i) => {
      const all = rowsOfUnit(c, r.u.id), shown = all.slice(0, PERU);
      return `<div class="pg-ublock"><div class="pg-uhead">${unitNo(i)}<b>${esc(uLine(r.u))}</b>${unitCountHtml(r)}${unitLnk(r.u)}</div>
        <div class="pm-list">${shown.map((x, j) => pmRow(c, x, j + 1)).join("")}</div>
        ${all.length > shown.length ? `<button class="pm-more" data-grpopen>＋ ${ar(all.length - shown.length)} ${all.length - shown.length > 10 ? "مشتري" : "مشترين"} كمان على الوحدة دي</button>` : ""}</div>`;
    }).join("")}</div>`;
    more = st.length > MAXU ? `<button class="pm-more" data-grpopen>＋ ${ar(st.length - MAXU)} ${st.length - MAXU === 1 ? "وحدة تانية" : "وحدات تانية"} ليها مشترين — افتح النافذة وشوف الكل</button>` : "";
  }
  let head;
  if (isB) {
    const ev = buyerEv(H, c.items[0].u);
    head = `<div class="pair-side buyer pg-head">${window.FBID ? FBID.chip(H) : ""}<div class="side-h">🛒 المشتري <small>(الطالب)</small></div>
      <div class="l-name">${esc(H.name)} ${tierChip(H)} ${H.superHot ? `<span class="l-lvl super">🔥 مهتم جدًا</span>` : `<span class="l-lvl">${LEADS.fires(H.level)} ${LEADS.levelName(H.level)}</span>`}${ownBadgeB(H, c.items[0].u)}</div>
      <div class="pv"><b>${esc(reqLine(c, H))}</b></div>
      <div class="pg-fact">${c.items.some((y) => y.B.want.text !== H.want.text) ? "💰 الميزانية بتختلف حسب الطلب" : H.range ? `💰 ${rngTxt(H.range)}` : "💰 ميزانيته مش واضحة"}</div>
      ${ev.text ? `<div class="pq">«${OHS(ev.text, 160)}»</div>` : ""}
      <div class="muted">🕒 ${relDay(H.last)} · ${ar(H.posts)} بوست</div>
      <div class="contact">${telBtns(H)}${buyerLinks(H, c.items[0].u)}</div></div>`;
  } else {
    const us = st.map((r) => r.u);
    const warnL = (H.rneg || []).find((t) => /^⚠/.test(t));
    head = `<div class="pair-side seller pg-head">${window.FBID ? FBID.chip(H) : ""}<div class="side-h">🏷 البايع <small>(العارض)</small> ${roleBadge(H)}</div>
      <div class="l-name">${esc(H.name)}</div>
      ${warnL ? `<div class="pg-warn">${esc(warnL)}</div>` : ""}
      <div class="pv pg-uh"><b>🏷 ${st.length > 1 ? `${ar(st.length)} وحدات ليها مشترين — كل وحدة وتحتها مشتريها بالترتيب` : "وحدة واحدة ليها مشترين"}</b></div>
      <div class="muted">🕒 ${relDay(H.last)} · إجمالي وحداته المعروضة ${ar(H.units.length)}${st.length < H.units.length ? ` (${ar(st.length)} منها بس ليها مشترين)` : ""}</div>
      <div class="contact">${telBtns(H)}${sellerLinks(H, us[0])}</div></div>`;
  }
  return `<article class="card pair pgroup${c.items.some((x) => justKeys.has(MATCH.pairFbKey(x))) ? " just" : ""}${c.newN ? " hasnew" : ""}" data-grp="${c.side}|${esc(c.key)}" tabindex="0" role="button" title="دوس عشان تشوف تفاصيل التطابق مع الكل">
    <div class="pair-score pg-score" style="--p:${c.best}">${pcount(n, word + " متطابقين")}<b>${c.best}%</b><span>أفضل تطابق</span>${c.newN ? `<em class="newbadge">🆕 ${ar(c.newN)} جديد</em>` : ""}</div>
    ${head}
    <div class="pair-side pg-with"><div class="pg-title">${isB ? "🏷 العروض المناسبة له" : "🛒 مشتريين كل وحدة (بالأقوى الأول)"} <b>${ar(n)}</b></div>
      ${rows}${more}
      <div class="contact"><button class="btn primary sm" data-grpopen>🔍 كل التفاصيل (${ar(n)})</button></div></div>
  </article>`;
}
const CMP_KEYS = ["reg", "money", "area", "rooms", "fin", "lt", "corner"];
function cmpChips(x) {
  const c = x.comps || {};
  const u = x.unk || [];
  return CMP_KEYS.filter((k) => typeof c[k] === "number").map((k) => { const v = c[k], cl = u.includes(k) ? "unk" : v >= 0.8 ? "ok" : v >= 0.5 ? "mid" : "bad"; return `<span class="cmp ${cl}"${cl === "unk" ? ' title="الطلب حدّده والعرض ماكتبهوش — مش متأكدين"' : ""}>${cl === "ok" ? "✔" : cl === "mid" ? "≈" : cl === "unk" ? "❔" : "✖"} ${FB_NAMES[k] || k}${cl === "unk" ? " (مش مكتوب)" : ""}</span>`; }).join("");
}
const wantCols = (B) => { const o = (B.want && B.want.obj) || {}; return { det: String((B.want && B.want.text) || "").replace(/^عايز يشتري /, ""), reg: (o.regions || []).join(" / ") || "—", area: o.area ? "حوالي " + o.area + " م²" : "—", price: B.range ? rngTxt(B.range) : o.budget ? PH.fmtPrice(o.budget) : "—" }; };
const unitCols = (u) => ({ det: uKind(u), reg: u.region || "—", area: u.areaM2 ? u.areaM2 + " م²" : "—", price: u.price ? PH.fmtPrice(u.price) : "—" });
// 📦 كل وحدة في مربع: مشتريها بأرقامهم + رابط البوست/التعليق + كتب إيه + عايز إيه + الميزانية + التطابق
const phonesCell = (P) => { const ph = (P.phones || []).slice(0, 3).map((t) => `<a class="btn sm wa" href="${PH.waLink(t)}" target="_blank" rel="noopener" dir="ltr">💬 ${esc(t)}</a>`).join(""); return ph || telBtns(P) || `<span class="muted">مفيش رقم</span>`; };
function unitBoxes(c, lim = 1e9) {
  const cl = (x, k) => { const v = (x.comps || {})[k]; return typeof v !== "number" ? "" : v >= 0.8 ? "ok" : v >= 0.5 ? "mid" : "bad"; };
  const by = new Map(); for (const x of c.items.slice(0, lim)) { if (!by.has(x.u.id)) by.set(x.u.id, []); by.get(x.u.id).push(x); }
  const stM = new Map(unitStats(c).map((r) => [r.u.id, r]));
  return `<div class="gu-boxes">${[...by.values()].map((arr, i) => {
    const u = arr[0].u, r = stM.get(u.id) || { n: arr.length, best: arr[0].score, u };
    const rows = arr.map((x, j) => {
      const P = x.B, ev = buyerEv(P, u), k = wantCols(P), bl = buyerLinkList(P, u).filter((l) => l.href), snip = String(ev.text || "").replace(/\s+/g, " ").trim().slice(0, 170);
      return `<tr data-pair="${esc(P.key)}|${esc(u.id)}"><td class="gu-n">#${ar(j + 1)}</td>
        <td><b>${esc(P.name)}</b> ${P.superHot ? `<span class="l-lvl super">💎</span>` : `<span class="l-lvl">${LEADS.fires(P.level)}</span>`}<div class="gu-lk">${bl.map((l) => lnk(l.href, l.label)).join("")}</div></td>
        <td class="gu-ph">${phonesCell(P)}</td>
        <td class="${cl(x, "reg")}">${esc(k.det)}${k.reg !== "—" ? `<br><small>📍 ${esc(k.reg)}</small>` : ""}${k.area !== "—" ? `<br><small>📐 ${esc(k.area)}</small>` : ""}</td>
        <td class="gu-tx">${snip ? `«${esc(snip)}»` : `<span class="muted">—</span>`}</td>
        <td class="${cl(x, "money")}">${esc(k.price)}</td>
        <td><b>${x.score}%</b></td></tr>`;
    }).join("");
    return `<section class="gu-box"><div class="gu-h">${unitNo(i)}<b>${esc(uLine(u))}</b>${unitCountHtml(r)}${unitLnk(u)}</div>
      <div class="gtable-wrap"><table class="gtable gu"><thead><tr><th></th><th>المشتري / الرابط</th><th>رقمه</th><th>عايز إيه</th><th>كتب إيه</th><th>الميزانية</th><th>التطابق</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }).join("")}</div>`;
}
function cmpTable(c, lim = 1e9) {
  const isB = c.side === "B", H = c.head;
  const cl = (x, k) => { const v = (x.comps || {})[k]; return typeof v !== "number" ? "" : v >= 0.8 ? "ok" : v >= 0.5 ? "mid" : "bad"; };
  const uniq = (a) => [...new Set(a.filter((v) => v && v !== "—"))].join("، ") || "—";
  const hd = isB ? wantCols(H) : null;
  const row = (x) => { const P = isB ? x.S : x.B, k = isB ? unitCols(x.u) : wantCols(x.B);
    return `<tr data-pair="${esc(x.B.key)}|${esc(x.u.id)}"><td>${primaryUrl(x, isB ? "S" : "B") ? `<a href="${esc(primaryUrl(x, isB ? "S" : "B"))}" target="_blank" rel="noopener" title="افتح المنشور/التعليق"><b>${esc(P.name)}</b> 🔗</a>` : `<b>${esc(P.name)}</b>`}</td><td>${esc(k.det)}</td><td class="${cl(x, "reg")}">${esc(k.reg)}</td><td class="${cl(x, "area")}">${esc(k.area)}</td><td class="${cl(x, "money")}">${esc(k.price)}</td><td><b>${x.score}%</b></td></tr>`; };
  if (!isB) return unitBoxes(c, lim);
  return `<div class="gtable-wrap"><table class="gtable"><thead><tr><th>${isB ? "البايع" : "المشتري"}</th><th>${isB ? "الوحدة" : "بيطلب"}</th><th>المنطقة</th><th>المساحة</th><th>${isB ? "السعر" : "الميزانية"}</th><th>التطابق</th></tr></thead><tbody>
    <tr class="head"><td>🛒 ${esc(H.name)}<br><small>المطلوب</small></td><td>${esc(hd.det)}</td><td>${esc(hd.reg)}</td><td>${esc(hd.area)}</td><td>${esc(hd.price)}</td><td>—</td></tr>
    ${c.items.slice(0, lim).map(row).join("")}</tbody></table></div>`;
}
function gmRow(c, x, rank) {
  const isB = c.side === "B", B = x.B, S = x.S, u = x.u, ev = buyerEv(B, u), nw = pairIsNew(x);
  const main = isB
    ? `<div class="gm-name">🏷 <b>${esc(S.name)}</b> ${S.owner ? `<span class="badge b-owner">مالك</span>` : ""}${ownBadgeU(u, S, true)}${nw ? ` <em class="newbadge">🆕 جديد</em>` : ""}</div>
       <div class="pv"><b>${esc(uLine(u))}</b></div>
       <div class="muted ellip">${OHS(u.text, 170)}</div>`
    : `<div class="gm-name">🛒 <b>${esc(B.name)}</b> ${B.superHot ? `<span class="l-lvl super">💎</span>` : `<span class="l-lvl">${LEADS.fires(B.level)}</span>`}${ownBadgeB(B, u)}${nw ? ` <em class="newbadge">🆕 جديد</em>` : ""}</div>
       <div class="pv"><b>${esc(B.want.text)}</b></div>
       ${ev.text ? `<div class="muted ellip pq">«${OHS(ev.text, 150)}»</div>` : ""}
       <div class="muted">${B.range ? `💰 ${rngTxt(B.range)}` : "💰 ميزانيته مش واضحة"} · 🕒 ${relDay(B.last)} · 🏷 الوحدة: ${esc(uLine(u))}</div>`;
  const acts = isB
    ? `${telBtns(S)}${sellerLinks(S, u)}<button class="btn sm" data-pairsend="seller">📤 كلّمه عن المشتري</button>${crmBtn(u.id, S.key)}`
    : `${telBtns(B)}${buyerLinks(B, u)}${lnk(primaryUrl(x, "S"), "🔗 الوحدة")}<button class="btn sm primary" data-pairsend="buyer">📤 ابعتله الوحدة</button>`;
  return `<div class="gm-row ${isB ? "seller" : "buyer"}${justKeys.has(MATCH.pairFbKey(x)) ? " just" : ""}" data-pair="${esc(B.key)}|${esc(u.id)}">
    <div class="gm-score"><b>${x.score}%</b>${rank ? `<small class="gm-rank" title="ترتيب المشتري تحت الوحدة دي">#${ar(rank)}</small>` : ""}</div>
    <div class="gm-main">${main}<div class="gm-cmp">${cmpChips(x)}</div><div class="muted sm">✔ ${x.why.map(esc).join(" · ")}</div>${ownPair(x)}</div>
    <div class="gm-acts">${acts}<span class="pair-acts">${fbBtns(x)}${dealBtn(x)}</span></div></div>`;
}
function groupMsg(c) {
  const isB = c.side === "B", H = c.head, list = c.items.slice(0, 5);
  const first = (n) => (PH.extractPhones(n).length || /^[a-z0-9._]+$/i.test(n) ? "" : " أستاذ " + n.split(/\s+/)[0]);
  const sign = myName ? "\n" + myName : "";
  if (isB) return `أهلًا${first(H.name)} 👋\nبخصوص اللي بتدور عليه (${H.want.text.replace(/^عايز يشتري /, "")})، عندي ${c.items.length} وحدات مناسبة:\n${list.map((x, i) => `${i + 1}) ${uLine(x.u)}`).join("\n")}\n\nتحب أبعتلك التفاصيل ونحدد معاد معاينة؟${sign}`;
  return `أهلًا${first(H.name)} 👋\nعندي ${c.items.length} عملاء جادين بيدوروا على مواصفات زي وحداتك:\n${list.map((x, i) => `${i + 1}) ${String(x.B.want.text).replace(/^عايز يشتري /, "")}`).join("\n")}\n\nلسه متاحة؟ ينفع نتكلم في التفاصيل ونحدد معاينة؟${sign}`;
}
function groupModalHtml(c) {
  const isB = c.side === "B", H = c.head, n = c.items.length, word = isB ? "بايعين" : "مشترين";
  const newN = c.items.filter(pairIsNew).length, lim = Math.max(grpMax, 1);
  const head = isB
    ? `<div class="grp-head buyer"><div class="side-h">🛒 المشتري <small>(الطالب)</small></div>
        <div class="l-name">${esc(H.name)} ${tierChip(H)} ${H.superHot ? `<span class="l-lvl super">🔥 مهتم جدًا</span>` : `<span class="l-lvl">${LEADS.fires(H.level)} ${LEADS.levelName(H.level)}</span>`}</div>
        <div class="pv"><b>${esc(H.want.text)}</b></div>
        <div class="muted">${H.range ? `💰 ${rngTxt(H.range)}` : "💰 ميزانيته مش واضحة"} · 🕒 ${relDay(H.last)} · ${ar(H.posts)} بوست</div>
        <div class="contact">${telBtns(H)}${buyerLinks(H, c.items[0].u)}<button class="btn sm primary" data-gsendall>📤 ابعتله كل الوحدات (${ar(n)})</button></div></div>`
    : `<div class="grp-head seller"><div class="side-h">🏷 البايع <small>(العارض)</small> ${roleBadge(H)}</div>
        <div class="l-name">${esc(H.name)}</div>
        ${(H.rneg || []).find((t) => /^⚠/.test(t)) ? `<div class="pg-warn">${esc((H.rneg || []).find((t) => /^⚠/.test(t)))}</div>` : ""}
        <div class="pg-uh">${unitStats(c).length > 1 ? `الوحدات اللي ليها مشترين (${ar(unitStats(c).length)}):` : "الوحدة المتطابقة:"}</div>
        <div class="pg-units">${unitStats(c).map((r, i) => `<div class="pv pg-unit">${unitNo(i)}<b>${esc(uLine(r.u))}</b>${unitCountHtml(r)}${unitLnk(r.u)}</div>`).join("")}</div>
        <div class="muted">🕒 ${relDay(H.last)} · إجمالي وحداته المعروضة ${ar(H.units.length)}</div>
        <div class="contact">${telBtns(H)}${sellerLinks(H, c.items[0].u)}<button class="btn sm primary" data-gsendall>📤 كلّمه عن المشترين (${ar(n)})</button></div></div>`;
  return `${head}
    <div class="grp-sum"><span class="pcount-inline"><b>${ar(n)}</b> ${word} متطابقين</span><span>⭐ أفضل تطابق <b>${c.best}%</b></span>${newN ? `<span>🆕 <b>${ar(newN)}</b> جديد</span>` : ""}</div>
    <details class="how"><summary>❓ إزاي التطابق اتحسب؟ <small>(دوس تشوف)</small></summary>
      <div>كل مشتري بيتقارن بكل وحدة عند البايع، وبناخد <b>أنسب وحدة</b> ليه. النسبة من 100 بتتجمع من:
        <b>المنطقة</b> (الأهم) · <b>الميزانية مقابل السعر</b> · <b>المساحة</b> · <b>عدد الغرف</b> · <b>التشطيب</b>.
        العلامات جنب كل مشتري: <span class="cmp ok">✔ مناسب</span> <span class="cmp mid">≈ قريب</span> <span class="cmp bad">✖ مش مناسب</span>.
        حي جنب الحي المطلوب بيوقف عند 69% كحد أقصى، وحي تاني خالص مبيتطابقش. المعلومة الناقصة (مفيش مساحة مثلًا) بتاخد درجة متوسطة، وكل ما المشتري يحدد تفاصيل أكتر النسبة بتبقى أدق.
        لو الوحدة مكتوب فيها «من المالك» بتزيد نقط قليلة. وتقييمك 👍/👎 بيعلّم البرنامج يرتّب أحسن.</div></details>
    ${cmpTable(c, lim)}
    ${isB ? `<div class="gm-list">${c.items.slice(0, lim).map((x) => gmRow(c, x)).join("")}</div>` : (() => {
      const shown = c.items.slice(0, lim);
      return unitStats(c).map((r, i) => { const rs = shown.filter((x) => x.u.id === r.u.id); if (!rs.length) return "";
        return `<section class="gm-unit" data-unit="${esc(r.u.id)}"><div class="gm-uh">${unitNo(i)}<div class="gm-uhm"><b>${esc(uLine(r.u))}</b><span class="muted ellip">${esc((r.u.text || "").replace(/\s+/g, " ").slice(0, 150))}</span></div>${unitCountHtml(r)}${unitLnk(r.u)}</div>
          <div class="gm-list">${rs.map((x, j) => gmRow(c, x, j + 1)).join("")}</div></section>`; }).join("");
    })()}
    ${n > lim ? `<button class="btn more" data-gmore>عرض الباقي (${ar(n - lim)} ${isB ? "عرض" : "طلب"})</button>` : ""}
    <div class="mfoot"><span class="muted">اللي بتضغطه (👍/👎 أو ⚡ صفقة بضغطة) بيتسجل على التطابق ده بالظبط — والنافذة بتتحدث لوحدها لما يوصل داتا جديدة.</span><button class="btn" data-gclose>اقفل</button></div>`;
}
let grpFocus = "", grpMax = 40;
function openGroup(side, key, focus) { grpOpen = { side, key }; grpHtml = ""; grpFocus = focus || ""; grpMax = 40; $("grpModal").hidden = false; refreshGroupModal(); }
function closeGroup() { grpOpen = null; grpHtml = ""; $("grpModal").hidden = true; $("grpBody").innerHTML = ""; }
function refreshGroupModal() {
  if (!grpOpen) return;
  const cards = lastCards || matchCards(pairFiltered());
  let c = cards.find((k) => k.g && k.side === grpOpen.side && k.key === grpOpen.key);
  if (!c) { // الكارت اتفك (اتشال تطابق): نعرض اللي فاضل للشخص ده
    const items = pairFiltered().filter((x) => x[grpOpen.side].key === grpOpen.key).sort((a, b) => (b.fb || 0) - (a.fb || 0) || b.score - a.score);
    if (!items.length) { closeGroup(); return toast("مفيش تطابقات تانية للشخص ده"); }
    c = cardOf({ g: true, side: grpOpen.side, key: grpOpen.key, items });
  }
  if (grpFocus) { const i = c.items.findIndex((x) => x.B.key + "|" + x.u.id === grpFocus); if (i >= grpMax) grpMax = i + 10; }
  const html = groupModalHtml(c);
  if (html === grpHtml) return;
  grpHtml = html;
  const sc = $("grpModal"), top = sc.scrollTop;
  $("grpBody").innerHTML = html;
  $("grpTitle").textContent = `🤝 ${c.head.name} — متطابق مع ${ar(c.items.length)} ${c.side === "B" ? "بايعين" : "مشترين"}`;
  sc.scrollTop = top;
  if (grpFocus) { const f = [...$("grpBody").querySelectorAll(".gm-row")].find((r) => r.dataset.pair === grpFocus); grpFocus = ""; if (f) { f.classList.add("focus"); f.scrollIntoView({ block: "center" }); } }
  grpCur = c;
}
document.addEventListener("click", async (e) => {
  const t = e.target;
  const ma = t.closest("[data-mact]");
  if (ma) { // أزرار شاشة «مفيش تطابق»
    const a = ma.dataset.mact;
    if (a === "min50") { state.mMin = 50; $("mMin").value = "50"; }
    else if (a === "buyer1") { state.mBuyer = 1; $("mBuyer").value = "1"; }
    else if (a === "clear") { Object.assign(state, { mMin: 85, mCat: "all", mTier: "all", mCombo: "all", mRegion: "", mBuyer: 1, mOwner: false, mPhones: false, mNewOnly: false, mq: "" }); $("mMin").value = "85"; $("mBuyer").value = "1"; $("mOwner").checked = false; $("mPhones").checked = false; $("mNewOnly").checked = false; }
    state.mShown = 40; return render();
  }
  if (t.closest("[data-mseen]")) { e.stopPropagation(); markMatchesSeen(); render(); return toast("✔ تمام — علّمت الجديد إنك شفته"); }
  const nk = t.closest("[data-mnewk]"); if (nk) { state.mNewOnly = !state.mNewOnly; $("mNewOnly").checked = state.mNewOnly; state.mShown = 40; return render(); }
  if (!$("grpModal").hidden) {
    if (t.id === "grpModal" || t.closest("[data-gclose]")) return closeGroup();
    if (t.closest("[data-gsendall]") && grpCur) return sendTo(grpCur.head, groupMsg(grpCur));
    if (t.closest("[data-gmore]")) { grpMax += 60; grpHtml = ""; return refreshGroupModal(); }
    return;
  }
  const card = t.closest("[data-grp]");
  if (card && !t.closest("a,input,textarea,select") && (!t.closest("button") || t.closest("[data-grpopen]"))) { const [side, ...k] = card.dataset.grp.split("|"); const row = t.closest(".pm-row"); openGroup(side, k.join("|"), row ? row.dataset.pair : ""); }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && grpOpen && $("dealModal").hidden) return closeGroup();
  if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[data-grp]")) { e.preventDefault(); const [side, ...k] = e.target.dataset.grp.split("|"); openGroup(side, k.join("|")); }
});
$("mGroup").checked = grpOn;
$("mGroup").addEventListener("change", (e) => { grpOn = e.target.checked; try { localStorage.setItem("alaaGrpOn", grpOn ? "1" : "0"); } catch {} persistViewPrefs(); state.mShown = 40; render(); });
$("mNewOnly").addEventListener("change", (e) => { state.mNewOnly = e.target.checked; state.mShown = 40; render(); });
$("mSort").addEventListener("change", (e) => { state.mSort = e.target.value; state.mShown = 40; render(); });
document.addEventListener("visibilitychange", () => { if (document.hidden && state.view === "matches") markMatchesSeen(); });
window.addEventListener("pagehide", () => { if (state.view === "matches") markMatchesSeen(); });

// ⚡ تطابق لحظي: أي طلب/عرض/مشتري/بايع جديد بيتقارن بالقديم فورًا — من غير ما نستنى الحساب الكامل (اللي بيلحقه بعد ثواني ويصحّح)
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

function pairByEl(el) { const s = el.closest("[data-pair]").dataset.pair, i = s.lastIndexOf("|"), bk = s.slice(0, i), uid = s.slice(i + 1); return pairs.find((x) => x.B.key === bk && x.u.id === uid); } // مفتاح المشتري ممكن فيه | (اسم «محمد | عقارات»)، ومعرّف الوحدة hash من غير |
const uLineSafe = (u) => uLine({ ...u, land: { ...(u.land || {}), plot: "" } }); // نفس السطر بس من غير رقم القطعة (الرسالة الأولى للمشتري)
// ✉ رسالة المالك من outreach.js: الحي والنوع ومساحة الطلب من التطابق نفسه (من غير رقم القطعة ولا اسم المشتري ولا ميزانيته)، و٤ صياغات (الافتراضي بيتحدد من المالك والوحدة)
const ownerCtx = (x) => { const o = x.B && x.B.want && x.B.want.obj; return { name: x.S.name, u: x.u, want: { area: o && o.area ? o.area : 0 }, priceTxt: x.u.price ? PH.fmtPrice(x.u.price) : "", key: x.S.key + "|" + x.u.id, cfg: outCfg }; };
function pairMsg(x, to, safe, v) {
  const first = (n) => (PH.extractPhones(n).length || /^[a-z0-9._]+$/i.test(n) ? "" : " أستاذ " + n.split(/\s+/)[0]);
  if (to === "buyer") return `أهلًا${first(x.B.name)} 👋\nبخصوص اللي بتدور عليه (${x.B.want.text.replace(/^عايز يشتري /, "")})، فيه وحدة مناسبة:\n${safe ? uLineSafe(x.u) : uLine(x.u)}\n\nتحب أبعتلك التفاصيل ونحدد معاد معاينة؟${myName ? "\n" + myName : ""}`;
  if (typeof OUTR !== "undefined") return OUTR.ownerMsg(ownerCtx(x), v);
  return `أهلًا${first(x.S.name)} 👋\nبخصوص ${UNIT1[x.u.category] || "الوحدة"} اللي عندك${x.u.region ? " في " + x.u.region : ""}${x.u.price ? " (" + PH.fmtPrice(x.u.price) + ")" : ""} — عندي عميل جاد بيدور على نفس المواصفات.\nلسه متاحة؟ ينفع نتكلم في التفاصيل ونحدد معاينة؟${myName ? "\n" + myName : ""}`;
}
async function sendTo(P, text, noStage) {
  const phone = P.phones[0];
  if (phone) window.open(PH.waLink(phone) + "?text=" + encodeURIComponent(text), "_blank");
  else { await copyText(text); const alt = LEADS.messengerLink(P) || LEADS.profileLink(P); if (alt) window.open(alt, "_blank"); toast("اتنسخت الرسالة — الصقها في الشات"); }
  if (!noStage && REPORT.stageOf(leadMeta[P.key]) === "new") await setLeadMeta(P.key, { stage: "contacted", lastMsg: Date.now() });
}

// 🖼 «ابعتها»: لو القطعة معروفة في الأطلس (كود AM أو الحي + المجاورة + رقم القطعة في نص العرض) صورة ملف القطعة بتتنسخ للكليبورد قبل ما الشات يفتح — تلزقها (Ctrl+V) وتبعتها.
// true = اتنسخت · false = القطعة مش لاقيها · null = مفيش قطعة معروفة/مفيش رقم (الرسالة بس). لو المشتري من غير رقم الرسالة نفسها هي اللي بتتنسخ فمبنلمسش الكليبورد.
async function copyPlotFile(u, B) {
  try {
    if (!(B && B.phones && B.phones[0]) || !window.ATLAS || !ATLAS.plotRef || !ATLAS.plotRef(u) || !navigator.clipboard || !window.ClipboardItem) return null;
    toast("🖼 بجهّز صورة ملف القطعة…");
    const bp = ATLAS.plotFile(u).then((b) => { if (!b) throw new Error("no-plot"); return b; }); bp.catch(() => {});
    await Promise.race([navigator.clipboard.write([new ClipboardItem({ "image/png": bp })]), new Promise((_, rj) => setTimeout(() => rj(new Error("timeout")), 8000))]);
    toast("🖼 صورة ملف القطعة اتنسخت — الصقها (Ctrl+V) في الشات وابعتها");
    return true;
  } catch { toast("مش لاقي القطعة دي في الأطلس — هيفتح الشات بالرسالة من غير صورة"); return false; }
}
// ================= ⚡ العرض السريع: صف لكل مشتري + أحسن ٣ قطع + واتساب بضغطة =================
// الواتساب بيفتح الشات برسالة جاهزة (من غير رقم القطعة) — مفيش حاجة بتتبعت لوحدها، انت اللي بتدوس إرسال.
const FAST_N = 3;
const fastMeta = (B) => leadMeta[B.key] || {};
const fastTalked = (B) => { const m = fastMeta(B); return !!(m.talkedAt || REPORT.stageOf(m) !== "new"); }; // «اتكلمت» = علّمتها بإيدك أو المرحلة اتغيّرت من «جديد»
const fastTalkAt = (B) => { const m = fastMeta(B); return m.talkedAt || m.lastMsg || 0; };
// تحديث فوري على الشاشة + حفظ بالدور (عشان ضغطتين ورا بعض على مشتريين مختلفين ما يمسحوش بعض)
function fastSave(key, patch) {
  leadMeta[key] = { ...(leadMeta[key] || {}), ...patch, at: Date.now() };
  fastMetaQ = fastMetaQ.then(() => setLeadMeta(key, patch)).catch((er) => console.warn("fastSave", er));
  return fastMetaQ;
}
function fastRows(list) {
  const m = new Map();
  for (const x of list) { let r = m.get(x.B.key); if (!r) m.set(x.B.key, (r = { B: x.B, xs: [] })); r.xs.push(x); }
  const rows = [];
  for (const r of m.values()) {
    const seen = new Set();
    r.xs = r.xs.sort((a, b) => (b.fb || 0) - (a.fb || 0) || b.score - a.score || (b.u.ts || 0) - (a.u.ts || 0)).filter((x) => !seen.has(x.u.id) && seen.add(x.u.id));
    r.best = r.xs[0].score; r.fb = r.xs.some((x) => x.fb === 1) ? 1 : 0; r.talked = fastTalked(r.B); r.newN = r.xs.filter(pairIsNew).length;
    rows.push(r);
  }
  const tr = (r) => (state.mTier === "all" && state.mCombo === "all" ? tierRank(r.B.btier) : 0); // «الكل»: الأنضف الأول
  rows.sort(state.mSort === "new"
    ? (a, b) => a.talked - b.talked || (b.B.last || 0) - (a.B.last || 0) || b.best - a.best
    : (a, b) => a.talked - b.talked || tr(a) - tr(b) || b.fb - a.fb || b.best - a.best || (b.B.last || 0) - (a.B.last || 0)); // اللي اتكلمت معاهم ينزلوا تحت
  return rows;
}
function fastUnit(r, x, i) {
  const B = r.B, S = x.S, u = x.u, sent = (fastMeta(B).sentU || []).includes(u.id), nw = pairIsNew(x), hasPh = !!(B.phones && B.phones[0]);
  const href = primaryUrl(x, "S");
  return `<div class="fu${sent ? " opened" : ""}${nw ? " new" : ""}" data-pair="${esc(B.key)}|${esc(u.id)}">
    <i class="fu-k" title="دوس ${ar(i + 1)} على الكيبورد عشان تبعتها">${ar(i + 1)}</i>
    <b class="fu-sc" style="--p:${x.score}">${x.score}%</b>
    <div class="fu-m">
      <div class="fu-t">${esc(uLine(u))}${nw ? ` <em class="newbadge">🆕 جديد</em>` : ""}</div>
      <div class="fu-l2"><span class="fu-w muted">🏷 ${esc(S.name)} ${roleBadge(S)} · 🕒 ${relDay(u.ts)}</span><span class="fu-cmp" title="ليه اتطابقوا؟ ✔ مناسب · ≈ قريب · ✖ مش مناسب · ❔ العرض ماكتبهاش">${cmpChips(x)}</span></div>
    </div>
    <div class="fu-a"><button class="btn sm ${sent ? "" : hasPh ? "wa primary" : "primary"}" data-fsend="${esc(u.id)}" title="${hasPh ? "يفتح واتساب برسالة جاهزة من غير رقم القطعة — انت اللي بتدوس إرسال" : "مفيش رقم: بينسخ الرسالة ويفتح الشات/البروفايل"}">${sent ? "✔ اتفتحت — تاني؟" : hasPh ? "💬 ابعتها" : "📋 انسخ وافتح الشات"}</button>${lnk(href, u.kind === "comment" ? "🔗 تعليقه (عرض)" : "🔗 العرض", "btn sm lnk")}</div>
  </div>`;
}
function fastRow(r) {
  const B = r.B, talked = r.talked, tAt = fastTalkAt(B);
  return `<article class="fr${talked ? " talked" : ""}${r.fb ? " fbk" : ""}${B.key === fastCur ? " cur" : ""}" data-fkey="${esc(B.key)}" tabindex="-1">
    <div class="fr-b">
      <div class="fr-n"><span class="fr-name">🛒 ${esc(B.name)}</span>${window.FBID ? FBID.chip(B, { inline: true }) : ""} ${tierChip(B)} ${B.superHot ? `<span class="l-lvl super">🔥 مهتم جدًا</span>` : `<span class="l-lvl">${LEADS.fires(B.level)} ${LEADS.levelName(B.level)}</span>`}${r.newN ? ` <em class="newbadge">🆕 ${ar(r.newN)} جديد</em>` : ""}</div>
      <div class="fr-w"><b>${esc(reqLine({ items: r.xs }, B))}</b></div>
      <div class="fr-i muted">${B.range ? `💰 ${rngTxt(B.range)}` : "💰 ميزانيته مش واضحة"} · 🕒 ${relDay(B.last)}${B.posts ? ` · ${ar(B.posts)} بوست` : ""}${talked ? ` · ✅ اتكلمت${tAt ? " " + relDay(tAt) : ""}` : ""}</div>
      <div class="fr-c">${telBtns(B)}${buyerLinkList(B, r.xs[0].u).filter((l) => !/البروفايل/.test(l.label)).slice(0, 2).map((l) => lnk(l.href, l.label)).join("")}<button class="btn sm ${talked ? "" : "primary"}" data-ftalk title="الكيبورد: C">${talked ? "↩️ لسه ما كلمتوش" : "✅ اتكلمت"}</button><button class="btn sm" data-fdet title="الكيبورد: D">📋 كل التطابقات (${ar(r.xs.length)})</button></div>
    </div>
    <div class="fr-us">${r.xs.slice(0, FAST_N).map((x, i) => fastUnit(r, x, i)).join("")}${r.xs.length > FAST_N ? `<button class="pm-more" data-fdet>＋ ${ar(r.xs.length - FAST_N)} قطعة كمان — افتح كل التطابقات</button>` : ""}</div>
  </article>`;
}
function renderFast(list) {
  const all = fastRows(list), nTalk = all.filter((r) => r.talked).length, rows = fastF === "new" ? all.filter((r) => !r.talked) : all;
  fastRowsNow = rows;
  if (!rows.some((r) => r.B.key === fastCur)) fastCur = rows.length ? rows[0].B.key : ""; // أول صف متحدد من الأول (بيتبعه الكيبورد)
  const bar = $("mFastBar"); bar.hidden = false;
  bar.innerHTML = `<div class="fq-top"><span class="fq-lbl">⚡ العرض السريع</span>
      <button class="tab ${fastF === "new" ? "on" : ""}" data-ffilter="new" title="المشترين اللي لسه ما علّمتش إنك كلمتهم">لسه ما كلمتوش<small>${ar(all.length - nTalk)}</small></button>
      <button class="tab ${fastF === "all" ? "on" : ""}" data-ffilter="all">الكل<small>${ar(all.length)}</small></button>
      <span class="fq-keys muted"><kbd>↑</kbd><kbd>↓</kbd> تنقّل · <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> ابعت القطعة · <kbd>Enter</kbd> ابعت الأولى · <kbd>C</kbd> اتكلمت · <kbd>D</kbd> كل التطابقات</span></div>
    <div class="fq-note muted">الواتساب بيفتح الشات برسالة جاهزة <b>من غير رقم القطعة</b> — مفيش حاجة بتتبعت لوحدها، انت اللي بتدوس إرسال.</div>`;
  $("mCount").textContent = `${all.length} مشتري · ${list.length} مطابقة` + (nTalk ? ` · ✅ ${nTalk} اتكلمت معاهم` : "") + (state.mq ? ` — بحث: «${state.mq}» ` : "");
  if (!rows.length) {
    $("mList").innerHTML = all.length && fastF === "new" ? `<div class="empty"><b>🎉 كلمت كل المشترين اللي ظاهرين</b><div style="margin-top:8px"><button class="btn sm" data-ffilter="all">اعرض الكل (${ar(all.length)})</button></div></div>` : matchEmpty();
    if (window.FBID) FBID.sec("matches", $("mList"), [{ label: "المشترين", items: all.map((r) => r.B) }]);
    return;
  }
  $("mList").innerHTML = rows.slice(0, state.mShown).map(fastRow).join("") + (rows.length > state.mShown ? `<button class="btn more" data-mmore>عرض المزيد (${rows.length - state.mShown})</button>` : "");
  if (window.FBID) FBID.sec("matches", $("mList"), [{ label: "المشترين", items: all.map((r) => r.B) }]);
}
// تحريك التحديد (من غير إعادة رسم): الصف المتحدد عليه .cur
function fastFocus(key, scroll = true) {
  fastCur = key;
  let hit = null;
  for (const el of document.querySelectorAll("#mList .fr")) { const on = el.dataset.fkey === key; el.classList.toggle("cur", on); if (on) hit = el; }
  if (hit && scroll) hit.scrollIntoView({ block: "nearest" });
  return hit;
}
const fastRowOf = (key) => fastRowsNow.find((r) => r.B.key === key);
// 💬 افتح واتساب برسالة القطعة دي (من غير رقم القطعة) — لازم تتنادي مباشرة من الضغطة عشان المتصفح ما يمنعش فتح الشات
async function fastSend(key, uid) {
  const r0 = fastRowOf(key); if (!r0) return;
  const x0 = r0.xs.find((y) => y.u.id === uid); if (!x0) return;
  await copyPlotFile(x0.u, r0.B); // 🖼 صورة ملف القطعة (لو معروفة) قبل ما الشات يفتح
  const r = fastRowOf(key) || r0, x = r.xs.find((y) => y.u.id === uid) || x0;
  sendTo(r.B, pairMsg(x, "buyer", true), true); // true = من غير ما نغيّر مرحلة المشتري (ده بيتحدد بزرار «اتكلمت»)
  const sent = [...new Set([...(fastMeta(r.B).sentU || []), uid])].slice(-60);
  fastSave(r.B.key, { sentU: sent });
  const cur = fastCur; renderFast(pairFiltered()); fastFocus(cur, false);
}
// ✅ اتكلمت / ↩️ لسه ما كلمتوش — وبعدها التحديد بيروح على المشتري اللي بعده (اللي كان تحته بيطلع مكانه)
function fastTalk(key) {
  const r = fastRowOf(key); if (!r) return;
  const st = REPORT.stageOf(fastMeta(r.B)), idx = fastRowsNow.indexOf(r);
  if (r.talked) { // رجّعه «لسه ما كلمتوش»: ينفع بس لو المرحلة لسه «كلمته» أو «جديد»
    if (st !== "new" && st !== "contacted") return toast("المشتري ده في مرحلة «" + (REPORT.STAGES[st] || st) + "» — غيّرها من المتابعة");
    fastSave(key, { talkedAt: 0, ...(st === "contacted" ? { stage: "new" } : {}) });
    fastCur = key;
  } else {
    fastSave(key, { talkedAt: Date.now(), lastMsg: Date.now(), ...(st === "new" ? { stage: "contacted" } : {}) });
    const nx = fastRowsNow[idx + 1] || fastRowsNow[idx - 1]; fastCur = nx ? nx.B.key : key; // اللي بعده (أو اللي قبله لو ده الأخير)
  }
  renderFast(pairFiltered()); fastFocus(fastCur, true);
}
document.addEventListener("click", (e) => {
  const t = e.target;
  if (state.view !== "matches" || !fastOn) return;
  const ff = t.closest("[data-ffilter]");
  if (ff) { fastF = ff.dataset.ffilter === "new" ? "new" : "all"; try { localStorage.setItem("alaaFastF", fastF); } catch {} state.mShown = 40; return renderFast(pairFiltered()); }
  const row = t.closest("#mList .fr"); if (!row) return;
  const key = row.dataset.fkey;
  const sd = t.closest("[data-fsend]"); if (sd) { e.preventDefault(); fastFocus(key, false); return fastSend(key, sd.dataset.fsend); }
  if (t.closest("[data-ftalk]")) { e.preventDefault(); return fastTalk(key); }
  if (t.closest("[data-fdet]")) { e.preventDefault(); fastFocus(key, false); return openGroup("B", key); }
  if (!t.closest("a,button,input,textarea,select") && key !== fastCur) fastFocus(key, false); // دوسة على الصف نفسه = تحديده
});
// ⌨️ الكيبورد (مش وانت بتكتب في خانة ولا وفي نافذة مفتوحة). بنستعمل مكان الحرف (code) عشان يشتغل والكيبورد عربي كمان
document.addEventListener("keydown", (e) => {
  if (!fastOn || state.view !== "matches" || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
  const a = document.activeElement; if (a && a.matches && a.matches("input,textarea,select,[contenteditable='true']")) return;
  if (document.querySelector(".modal:not([hidden])")) return;
  const rows = fastRowsNow; if (!rows.length) return;
  const i = Math.max(0, rows.findIndex((r) => r.B.key === fastCur)), c = e.code || "";
  const go = (n) => { const r = rows[n]; if (!r) return; e.preventDefault(); fastFocus(r.B.key, true); };
  if (c === "ArrowDown" || c === "KeyJ") { if (i >= rows.length - 1 || i >= state.mShown - 1) { if (rows.length > state.mShown) { e.preventDefault(); state.mShown += 40; renderFast(pairFiltered()); fastFocus(rows[i + 1] ? rows[i + 1].B.key : fastCur, true); } return; } return go(i + 1); }
  if (c === "ArrowUp" || c === "KeyK") return go(i - 1);
  if (c === "Home") return go(0);
  const dg = /^(?:Digit|Numpad)([1-9])$/.exec(c);
  if (dg && +dg[1] <= FAST_N) { const x = rows[i].xs[+dg[1] - 1]; if (x) { e.preventDefault(); fastSend(rows[i].B.key, x.u.id); } return; }
  if (c === "Enter" || c === "NumpadEnter") { if (e.target && e.target.closest && e.target.closest("a,button")) return; const x = rows[i].xs[0]; if (x) { e.preventDefault(); fastSend(rows[i].B.key, x.u.id); } return; }
  if (c === "KeyC") { e.preventDefault(); return fastTalk(rows[i].B.key); }
  if (c === "KeyD") { e.preventDefault(); return openGroup("B", rows[i].B.key); }
});
$("mFast").checked = fastOn;
$("mFast").addEventListener("change", (e) => { fastOn = e.target.checked; try { localStorage.setItem("alaaFastOn", fastOn ? "1" : "0"); } catch {} state.mShown = 40; render(); });

// ================= 🧠 التعلّم من 👍/👎 على التطابق =================
const FB_NAMES = { reg: "المنطقة", money: "الميزانية/الأوفر", area: "المساحة", rooms: "عدد الغرف", fin: "التشطيب", lt: "نوع الأرض", corner: "الناصية" };
const fbBtns = (x) => { const r = matchFb[MATCH.pairFbKey(x)]; return `<span class="fb" title="قيّم التطابق: 👍 بيفضّله ويتعلّم منه، 👎 بيخفيه ويتعلّم منه"><button class="fbb ${x.fb === 1 ? "on" : ""}" data-pairfb="1">👍</button><button class="fbb" data-pairfb="-1">👎</button></span>`; };
async function ratePair(x, v) {
  const key = MATCH.pairFbKey(x);
  const { matchFb: m = {} } = await chrome.storage.local.get("matchFb");
  if (m[key] && m[key].v === v) { delete m[key]; toast("اتشال التقييم"); }
  else {
    m[key] = { k: "pair", v, at: Date.now(), updatedAt: Date.now(), comps: x.comps || {}, score: x.base || x.score, adj: !!x.adj, cat: x.u.category, bName: x.B.name, sName: x.S.name, unit: uLine(x.u) };
    toast(v === 1 ? "👍 تمام — هفضّل التطابقات اللي زيها" : "👎 اتشال من التطابقات — وهتعلّم منه");
  }
  await chrome.storage.local.set({ matchFb: m });
  matchFb = m; applyView(); render();
}
function renderLearn() {
  const el = $("mLearn"); if (!el) return;
  const L = learnInfo, hid = Object.entries(matchFb).filter(([, r]) => r && r.k === "pair" && r.v === -1);
  const need = L.n < 8 ? `محتاج ${8 - L.n} تقييم كمان على الأقل` : L.up < 3 ? `محتاج ${3 - L.up} 👍 كمان` : L.dn < 3 ? `محتاج ${3 - L.dn} 👎 كمان` : "";
  const det = Object.entries(L.detail || {}).map(([k, d]) => `${FB_NAMES[k] || k} ${d.m > 1 ? "⬆️" : "⬇️"}×${d.m}`).join(" · ");
  el.innerHTML = `<div class="learn-h"><b>🧠 التعلّم من تقييمك</b> <span class="muted">${L.n ? `اتعلّم من ${L.n} تقييم (👍 ${L.up} · 👎 ${L.dn})` : "قيّم التطابقات بـ 👍/👎 والبرنامج بيتعلّم ويظبط الترتيب — 👎 بيخفي التطابق، 👍 بيفضّله ويرفعه."}</span></div>
    ${L.n ? `<div class="learn-b">${L.on ? `ضبط الميزان تلقائيًا: ${det}` : `لسه ما غيّرتش الميزان — ${need || "تقييماتك لسه ما بينتش فرق واضح بين اللي بتحبه واللي بتكرهه"}`}
      ${hid.length ? ` · <button class="btn sm" data-fbshow>👎 المخفي (${hid.length}) ${state.mShowHid ? "▲" : "▼"}</button>` : ""} · <button class="btn sm danger" data-fbreset title="يمسح كل التقييمات ويرجّع الميزان الأصلي">🧹 صفّر التعلّم</button></div>` : ""}
    ${state.mShowHid && hid.length ? `<div class="learn-hid">${hid.map(([k, r]) => `<div class="hidrow"><span><b>${esc(r.bName || "")}</b> ⟷ <b>${esc(r.sName || "")}</b> · ${esc(r.unit || "")}</span><button class="btn sm" data-fbrestore="${esc(k)}">↩️ رجّعه</button></div>`).join("")}</div>` : ""}`;
}
document.addEventListener("click", async (e) => {
  const t = e.target;
  const fb = t.closest("[data-pairfb]");
  if (fb) { const x = pairByEl(fb); if (x) await ratePair(x, +fb.dataset.pairfb); return; }
  if (t.closest("[data-fbshow]")) { state.mShowHid = !state.mShowHid; return renderLearn(); }
  const rs = t.closest("[data-fbrestore]");
  if (rs) { const { matchFb: m = {} } = await chrome.storage.local.get("matchFb"); delete m[rs.dataset.fbrestore]; await chrome.storage.local.set({ matchFb: m }); matchFb = m; applyView(); render(); return toast("↩️ رجع التطابق"); }
  if (t.closest("[data-fbreset]")) {
    const n = Object.keys(matchFb).length;
    if (!n || !confirm(`تمسح كل التقييمات (${n}) وترجّع الميزان الأصلي؟ التطابقات المخفية هترجع.`)) return;
    await chrome.storage.local.set({ matchFb: {} }); matchFb = {}; applyView(); render(); toast("🧹 اتصفّر التعلّم");
  }
});

// ================= ⚡ صفقة بضغطة + 💼 الصفقات =================
// صفقة = (مشتري + بايع + وحدة). بتتسجل بضغطة من التطابق، وبتتابع مراحلها والعمولة. محفوظة في pipeDeals (متزامنة ومعمولها نسخة احتياطية)
const DSTAGES = { contacted: "كلمتهم", viewing: "معاينة", negotiating: "تفاوض", won: "اتقفلت ✅", lost: "وقعت ❌" };
const DORDER = ["new", "contacted", "viewing", "negotiating", "won"];
const dealIdOf = (x) => x.B.key + "|" + x.u.id;
const commPct = () => (commCfg.pct == null || isNaN(+commCfg.pct) ? 2.5 : +commCfg.pct);
const calcComm = (price, pct, both) => (price && pct ? Math.round(price * (+pct) / 100 * (both ? 2 : 1)) : null);
const money = (n) => (n == null || n === "" ? "—" : +n ? PH.fmtPrice(+n) : "0");
let dealX = null; // التطابق المفتوح في النافذة دلوقتي

async function saveDeal(id, patch) {
  const { pipeDeals: m = {} } = await chrome.storage.local.get("pipeDeals");
  const cur = m[id] || {};
  const next = { ...cur, ...patch, id, updatedAt: Date.now() };
  if (patch.stage && patch.stage !== cur.stage) next.history = [...(cur.history || []), { stage: patch.stage, at: Date.now() }];
  m[id] = next;
  await chrome.storage.local.set({ pipeDeals: m });
  pipe = m;
  return next;
}
// المشتري والبايع يتحركوا لنفس المرحلة (لو كانوا ورا منها)
async function moveParties(d, st) {
  if (!DORDER.includes(st)) return;
  for (const k of [d.bk, d.sk]) {
    const cur = REPORT.stageOf(leadMeta[k]);
    if (cur === "lost" || DORDER.indexOf(cur) < DORDER.indexOf(st)) await setLeadMeta(k, st === "contacted" ? { stage: st, lastMsg: Date.now() } : { stage: st });
  }
}
// بيعمل الصفقة لو مش موجودة (ويحرّك الاتنين لـ«كلمته»)، ولو موجودة بيعدّل عليها
async function startDeal(x, patch = {}) {
  const id = dealIdOf(x);
  if (pipe[id]) return Object.keys(patch).length ? saveDeal(id, patch) : pipe[id];
  const pct = commPct(), both = !!commCfg.both, price = x.u.price || null;
  const d = await saveDeal(id, { bk: x.B.key, sk: x.S.key, uid: x.u.id, bName: x.B.name, sName: x.S.name, bPhone: x.B.phones[0] || "", sPhone: x.S.phones[0] || "",
    bUid: x.B.uid || "", sUid: x.S.uid || "", bUrl: primaryUrl(x, "B"), sUrl: primaryUrl(x, "S"), unit: uLine(x.u), cat: x.u.category, region: x.u.region || "", price, score: x.score, stage: "contacted", createdAt: Date.now(),
    comm: { pct, both, expected: calcComm(price, pct, both), closed: null }, ...patch });
  await moveParties(d, "contacted");
  return d;
}
async function setDealStage(id, st) {
  const d = pipe[id]; if (!d || d.stage === st) return;
  const comm = { ...(d.comm || {}) };
  const patch = { stage: st };
  if (st === "won") { patch.wonAt = Date.now(); if (comm.closed == null) comm.closed = comm.expected || 0; patch.comm = comm; }
  else if (d.stage === "won") { patch.wonAt = null; comm.closed = null; patch.comm = comm; } // رجّعها من «اتقفلت»
  const nd = await saveDeal(id, patch);
  if (st !== "lost") await moveParties(nd, st);
  if (st === "won") { const u = byId.get(d.uid); if (u && !u.done) chrome.runtime.sendMessage({ type: "phPost", id: d.uid, op: "done" }).catch(() => {}); } // العرض اتباع — يختفي من التطابقات
  else if (d.stage === "won") { const u = byId.get(d.uid); if (u && u.done) chrome.runtime.sendMessage({ type: "phPost", id: d.uid, op: "done" }).catch(() => {}); } // رجّعناها من «اتقفلت» ← العرض يرجع يظهر في التطابقات (كان بيفضل «خلصان»)
}

// ----- النافذة -----
function dealModalHtml(x) {
  const d = pipe[dealIdOf(x)], B = x.B, S = x.S, u = x.u;
  const pct = d && d.comm ? d.comm.pct : commPct(), both = d && d.comm ? !!d.comm.both : !!commCfg.both;
  const exp = d && d.comm ? d.comm.expected : calcComm(u.price, pct, both);
  const side = (k, P, label, ico) => `<section class="deal-col ${k === "b" ? "buyer" : "seller"}">
      <h4>${ico} ${label}: <b>${esc(P.name)}</b> ${roleBadge(P)}</h4>
      <div class="muted sm">${P.phones[0] ? "📞 " + esc(P.phones[0]) : "مفيش رقم — هتنسخ الرسالة وتبعتها على الشات"}${d && d[k === "b" ? "sentB" : "sentS"] ? ` · <span class="sent">✓ اتبعتله ${relDay(d[k === "b" ? "sentB" : "sentS"])}</span>` : ""}</div>
      <div class="contact">${k === "b" ? buyerLinks(B, u) : sellerLinks(S, u)}</div>
      <textarea id="dm-${k}" rows="9" dir="auto">${esc((d && d[k === "b" ? "msgB" : "msgS"]) || pairMsg(x, k === "b" ? "buyer" : "seller"))}</textarea>
      <div class="row-actions"><button class="btn primary" data-dsend="${k}">💬 ${P.phones[0] ? "افتح واتساب" : "انسخ وافتح الشات"}</button><button class="btn" data-dcopy="${k}">📋 نسخ</button>${k === "s" && typeof OUTR !== "undefined" ? `<button class="btn" data-dvar="s" title="صياغة تانية للرسالة (٤ صياغات)">🔁 صياغة تانية</button>` : ""}</div>
    </section>`;
  return `<div class="deal-unit"><span class="score">${x.score}%</span> <b>${esc(uLine(u))}</b>${u.url ? ` · <a class="open-link" href="${esc(u.url)}" target="_blank">🔗 العرض</a>` : ""}${d ? ` <span class="chip fixd">${DSTAGES[d.stage] || d.stage}</span>` : ""}</div>
    <div class="deal-cols">${side("b", B, "المشتري", "🛒")}${side("s", S, "البايع", "🏷")}</div>
    <div class="deal-comm"><b>💰 العمولة:</b>
      <label><input id="dm-pct" class="num" inputmode="decimal" value="${pct}" style="width:60px"> %</label>
      <label><input type="checkbox" id="dm-both" ${both ? "checked" : ""}> من الطرفين (×2)</label>
      <span>← المتوقعة: <b id="dm-exp">${exp ? money(exp) : "—"}</b>${u.price ? "" : ` <span class="muted">(الوحدة من غير سعر — تقدر تكتبها بعد كده في «الصفقات»)</span>`}</span></div>
    <div class="mfoot"><span class="muted">البرنامج مابيبعتش حاجة لوحده — بيفتح واتساب والرسالة جاهزة وإنت اللي تبعت. أول ما تدوس «افتح واتساب» أو «سجّل» الصفقة بتتسجل والاتنين بيتحركوا لمرحلة «كلمته».</span>
      ${d ? `<button class="btn" data-dgo>💼 افتح في الصفقات</button>` : `<button class="btn primary" data-dstart>✅ سجّل الصفقة (من غير إرسال)</button>`}<button class="btn" data-dclose>اقفل</button></div>`;
}
let dealVarS = null;
function openDealModal(x) {
  dealX = x; dealVarS = null;
  $("dealBody").innerHTML = dealModalHtml(x);
  $("dealModal").hidden = false;
}
function dealModalVals() {
  const pct = parseFloat(PH.toEn($("dm-pct").value).replace("٫", ".")) || 0, both = $("dm-both").checked;
  return { pct, both, expected: calcComm(dealX.u.price, pct, both), msgB: $("dm-b").value, msgS: $("dm-s").value };
}
let dealSending = false;
async function dealSend(side, copyOnly) {
  const x = dealX; if (!x || dealSending) return; // ضغطتين سريعتين كانوا بيفتحوا واتساب مرتين ويسجّلوا الصفقة مرتين
  dealSending = true; try { await dealSend1(x, side, copyOnly); } finally { dealSending = false; }
}
async function dealSend1(x, side, copyOnly) {
  const v = dealModalVals(), P = side === "b" ? x.B : x.S, text = side === "b" ? v.msgB : v.msgS;
  await startDeal(x, { [side === "b" ? "sentB" : "sentS"]: Date.now(), msgB: v.msgB, msgS: v.msgS, comm: { pct: v.pct, both: v.both, expected: v.expected, closed: (pipe[dealIdOf(x)] || {}).comm ? pipe[dealIdOf(x)].comm.closed : null } });
  await chrome.storage.local.set({ commCfg: { ...commCfg, pct: v.pct, both: v.both } });
  if (copyOnly) { await copyText(text); toast("📋 اتنسخت الرسالة"); }
  else if (P.phones[0]) window.open(PH.waLink(P.phones[0]) + "?text=" + encodeURIComponent(text), "_blank");
  else { await copyText(text); const alt = LEADS.messengerLink(P) || LEADS.profileLink(P); if (alt) window.open(alt, "_blank"); toast("اتنسخت الرسالة — الصقها في الشات"); }
  if (!$("dealModal").hidden) $("dealBody").innerHTML = dealModalHtml(x);
}
document.addEventListener("click", async (e) => {
  const t = e.target;
  const pd = t.closest("[data-pairdeal]");
  if (pd) { const x = pairByEl(pd); if (x) openDealModal(x); return; }
  if (!$("dealModal").hidden) {
    if (t.id === "dealModal" || t.closest("[data-dclose]")) { $("dealModal").hidden = true; dealX = null; return; }
    const sd = t.closest("[data-dsend]"); if (sd) return dealSend(sd.dataset.dsend, false);
    const cp = t.closest("[data-dcopy]"); if (cp) return dealSend(cp.dataset.dcopy, true);
    if (t.closest("[data-dvar]") && dealX && typeof OUTR !== "undefined") { dealVarS = ((dealVarS == null ? OUTR.pickV(ownerCtx(dealX).key, 4) : dealVarS) + 1) % 4; const ta = $("dm-s"); if (ta) ta.value = pairMsg(dealX, "seller", false, dealVarS); return; }
    if (t.closest("[data-dstart]")) {
      const v = dealModalVals();
      await startDeal(dealX, { msgB: v.msgB, msgS: v.msgS, comm: { pct: v.pct, both: v.both, expected: v.expected, closed: null } });
      await chrome.storage.local.set({ commCfg: { ...commCfg, pct: v.pct, both: v.both } });
      toast("✅ اتسجلت الصفقة — الاتنين بقوا في مرحلة «كلمته»");
      $("dealBody").innerHTML = dealModalHtml(dealX); return;
    }
    if (t.closest("[data-dgo]")) { $("dealModal").hidden = true; dealX = null; if (grpOpen) closeGroup(); state.view = "pipe"; render(); return; }
  }
});
document.addEventListener("input", (e) => {
  if (!dealX || (e.target.id !== "dm-pct" && e.target.id !== "dm-both")) return;
  const v = dealModalVals(); const el = $("dm-exp"); if (el) el.textContent = v.expected ? money(v.expected) : "—";
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("dealModal") && !$("dealModal").hidden) { $("dealModal").hidden = true; dealX = null; } });
// زرار الصفقة على كارت التطابق
function dealBtn(x) {
  const d = pipe[dealIdOf(x)];
  if (!d) return `<button class="btn ${x.score >= 70 ? "primary" : ""} deal-go" data-pairdeal title="رسالتين جاهزين للمشتري والبايع + تسجيل الصفقة ومتابعتها">⚡ صفقة بضغطة</button>`;
  return `<button class="btn deal-go on" data-pairdeal title="الصفقة دي مسجّلة — افتحها">⚡ ${DSTAGES[d.stage] || d.stage}${d.comm && d.comm.expected ? " · عمولة " + money(d.comm.expected) : ""}</button>`;
}

// ----- شاشة الصفقات -----
const pActive = (d) => !["won", "lost"].includes(d.stage);
function pipeFiltered(ign = {}) {
  const q = PH.norm((state.pq || "").trim());
  const tab = state.pTab || "active";
  return Object.values(pipe).filter((d) =>
    (ign.tab || tab === "all" || (tab === "active" ? pActive(d) : d.stage === tab)) &&
    (!q || PH.norm([d.bName, d.sName, d.bPhone, d.sPhone, d.region, d.unit, d.note].join(" ")).includes(q)))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}
// خريطة صفقة→تطابق (بتتبني مرة لكل رسم) — pairs.find جوه كل كارت صفقة كان بياخد ٥٠٠ مللي مع ٦٠٠ صفقة
let _pbd = null, _pbdFor = null;
function pairByDealId(id) { if (_pbd === null || _pbdFor !== pairs) { _pbd = new Map(); _pbdFor = pairs; for (const p of pairs) { const k = dealIdOf(p); if (!_pbd.has(k)) _pbd.set(k, p); } } return _pbd.get(id); }
function renderPipe() {
  const all = Object.values(pipe), act = all.filter(pActive), won = all.filter((d) => d.stage === "won"), lost = all.filter((d) => d.stage === "lost");
  const m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
  const wonM = won.filter((d) => (d.wonAt || d.updatedAt || 0) >= m0.getTime());
  const sum = (a, f) => a.reduce((n, d) => n + (+f(d) || 0), 0);
  const conv = won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : null;
  $("pKpis").innerHTML = `
    <div class="kpi"><b>${act.length}</b><span>💼 صفقات شغالة</span></div>
    <div class="kpi"><b>${money(sum(act, (d) => d.comm && d.comm.expected))}</b><span>⏳ عمولة متوقعة (الشغالة)</span></div>
    <div class="kpi kpi-hot"><b>${wonM.length}</b><span>✅ اتقفلت الشهر ده</span></div>
    <div class="kpi kpi-hot"><b>${money(sum(wonM, (d) => d.comm && d.comm.closed))}</b><span>💰 عمولة محققة الشهر ده</span></div>
    <div class="kpi"><b>${money(sum(won, (d) => d.comm && d.comm.closed))}</b><span>🏆 عمولة محققة (الكل)</span></div>
    <div class="kpi"><b>${conv == null ? "—" : conv + "%"}</b><span>📈 نسبة القفل (اتقفل ÷ اتقفل+وقع)</span></div>`;
  const tabs = { crm: "📝 مسجّل", active: "الشغالة", ...DSTAGES, all: "الكل" }; // «📝 مسجّل» (سجل الـCRM) هي أول مرحلة
  const cnt = (k) => (k === "crm" ? Object.keys(crmReg).length : k === "all" ? all.length : k === "active" ? act.length : all.filter((d) => d.stage === k).length);
  $("pTabs").innerHTML = tabsHtml(tabs, state.pTab || "active", "ptab", cnt);
  { const crmOn = (state.pTab || "active") === "crm"; $("pDeals").hidden = crmOn; $("pCrm").hidden = !crmOn; if (crmOn) return renderCrm(); }
  if ($("pPct") && document.activeElement !== $("pPct")) $("pPct").value = commPct();
  if ($("pBoth")) $("pBoth").checked = !!commCfg.both;
  const list = pipeFiltered();
  $("pCount").textContent = `${list.length} صفقة`;
  $("pList").innerHTML = list.length ? list.map(dealCard).join("")
    : `<div class="empty"><b>${all.length ? "مفيش صفقات بالفلتر ده" : "لسه مفيش صفقات"}</b>${all.length ? "جرّب «الكل» أو شيل البحث." : "روح لشاشة «🤝 التطابق» ودوس «⚡ صفقة بضغطة» على أي تطابق — هتلاقي رسالتين جاهزين للمشتري والبايع، والصفقة بتتسجل هنا وتتابع مراحلها وعمولتها."}</div>`;
}
function dealParty(d, k) {
  const name = k === "b" ? d.bName : d.sName, phone = k === "b" ? d.bPhone : d.sPhone, uid = k === "b" ? d.bUid : d.sUid, sent = k === "b" ? d.sentB : d.sentS;
  let url = k === "b" ? d.bUrl : d.sUrl;
  if (!url) { const x = pairByDealId(d.id); if (x) url = primaryUrl(x, k === "b" ? "B" : "S"); } // صفقات قديمة: نجيب الرابط من التطابق لو لسه موجود
  const wa = (url ? lnk(url, k === "b" ? "🔗 الطلب/التعليق" : "🔗 العرض/التعليق") : "") + (phone ? `<a class="btn sm wa" href="${PH.waLink(phone)}" target="_blank">💬 ${esc(phone)}</a>` : uid ? `<a class="btn sm" href="https://m.me/${esc(uid)}" target="_blank">✉️ رسالة</a>` : "");
  return `<div class="deal-party ${k === "b" ? "buyer" : "seller"}"><span class="side-h">${k === "b" ? "🛒 المشتري" : "🏷 البايع"}</span> <b>${esc(name || "—")}</b> ${wa}${sent ? ` <span class="sent">✓ ${relDay(sent)}</span>` : ""}</div>`;
}
function dealCard(d) {
  const c = d.comm || {}, st = d.stage, hist = (d.history || []).slice(-5).map((h) => `${DSTAGES[h.stage] || h.stage} ${dts(h.at, _WD)}`).join(" ← ");
  return `<article class="card pdeal st-${st}" data-deal="${esc(d.id)}">
    <div class="deal-top"><b>${esc(d.unit || "وحدة")}</b>${d.region ? ` <span class="muted">· ${esc(d.region)}</span>` : ""}${d.price ? ` <span class="chip">${money(d.price)}</span>` : ""}<span class="muted when">بدأت ${relDay(d.createdAt)} · تطابق ${d.score || "—"}%</span></div>
    <div class="deal-parties">${dealParty(d, "b")}${dealParty(d, "s")}</div>
    <div class="deal-pipe">
      <label>المرحلة <select data-dstage>${Object.entries(DSTAGES).map(([k, v]) => `<option value="${k}" ${k === st ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label>العمولة المتوقعة <input class="num" data-dcomm="expected" inputmode="decimal" value="${c.expected == null ? "" : c.expected}" placeholder="مثلًا 25 ألف"></label>
      ${st === "won" ? `<label class="won-l">العمولة اللي اتحصّلت <input class="num" data-dcomm="closed" inputmode="decimal" value="${c.closed == null ? "" : c.closed}" placeholder="المبلغ"></label>` : ""}
      <input class="note" data-dnote value="${esc(d.note || "")}" placeholder="📝 ملاحظة (معاد المعاينة، شروط المالك…)">
      <button class="btn sm" data-dopen title="افتح الرسايل الجاهزة">💬 الرسايل</button>
      <button class="btn sm danger" data-ddel title="امسح الصفقة">🗑</button>
    </div>
    ${hist ? `<div class="muted sm">📍 ${hist}</div>` : ""}
  </article>`;
}
document.addEventListener("change", async (e) => {
  const card = e.target.closest("[data-deal]"); if (!card) return;
  const id = card.dataset.deal, d = pipe[id]; if (!d) return;
  if (e.target.matches("[data-dstage]")) { await setDealStage(id, e.target.value); toast(e.target.value === "won" ? "🎉 مبروك! اتقفلت — العمولة اتسجلت" : "اتحدثت المرحلة"); return; }
  if (e.target.matches("[data-dcomm]")) {
    const f = e.target.dataset.dcomm, v = e.target.value.trim() === "" ? null : parseMoney(e.target.value);
    await saveDeal(id, { comm: { ...(d.comm || {}), [f]: v } }); toast("💰 اتحفظت العمولة"); return;
  }
  if (e.target.matches("[data-dnote]")) { await saveDeal(id, { note: e.target.value.trim() }); toast("📝 اتحفظت الملاحظة"); }
});
document.addEventListener("click", async (e) => {
  const t = e.target;
  const tab = t.closest("[data-ptab]");
  if (tab) { state.pTab = tab.dataset.ptab; return renderPipe(); }
  const card = t.closest("[data-deal]"); if (!card) return;
  const id = card.dataset.deal, d = pipe[id]; if (!d) return;
  if (t.closest("[data-ddel]")) {
    if (!confirm("تمسح الصفقة دي؟ (المشتري والبايع مش هيتأثروا)")) return;
    const { pipeDeals: m = {} } = await chrome.storage.local.get("pipeDeals"); delete m[id]; await chrome.storage.local.set({ pipeDeals: m }); pipe = m; return renderPipe();
  }
  if (t.closest("[data-dopen]")) {
    const x = pairByDealId(id);
    if (x) return openDealModal(x);
    // التطابق مبقاش ظاهر (مثلًا العرض اتخلّص) — نفتح الرسايل المحفوظة لوحدها
    dealX = null; $("dealBody").innerHTML = `<div class="deal-unit"><b>${esc(d.unit)}</b></div><div class="deal-cols"><section class="deal-col buyer"><h4>🛒 ${esc(d.bName)}</h4><textarea rows="9" readonly>${esc(d.msgB || "")}</textarea></section><section class="deal-col seller"><h4>🏷 ${esc(d.sName)}</h4><textarea rows="9" readonly>${esc(d.msgS || "")}</textarea></section></div><div class="mfoot"><span class="muted">التطابق الأصلي مبقاش ظاهر، دي الرسايل اللي اتجهزت.</span><button class="btn" data-dclose>اقفل</button></div>`;
    $("dealModal").hidden = false;
  }
});
document.addEventListener("input", (e) => { if (e.target.id === "pSearch") { state.pq = e.target.value; renderPipe(); } });
document.addEventListener("change", async (e) => {
  if (e.target.id !== "pPct" && e.target.id !== "pBoth") return;
  const pct = parseFloat(PH.toEn($("pPct").value).replace("٫", ".")); 
  await chrome.storage.local.set({ commCfg: { ...commCfg, pct: isNaN(pct) ? 2.5 : pct, both: $("pBoth").checked } }); toast("💰 العمولة الافتراضية اتحفظت (للصفقات الجديدة)");
});
document.addEventListener("click", (e) => {
  if (!e.target.closest("#pExport")) return;
  const q = csvQ, dt = (t) => (t ? new Date(t).toLocaleDateString("ar-EG-u-nu-latn") : "");
  const rows = [["الوحدة", "المنطقة", "السعر", "المشتري", "رقم المشتري", "البايع", "رقم البايع", "المرحلة", "بدأت", "اتقفلت", "العمولة المتوقعة", "العمولة المحصّلة", "ملاحظة"].join(",")]
    .concat(Object.values(pipe).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map((d) => [d.unit, d.region, d.price, d.bName, d.bPhone ? "'" + d.bPhone : "", d.sName, d.sPhone ? "'" + d.sPhone : "", DSTAGES[d.stage], dt(d.createdAt), dt(d.wonAt),
      d.comm && d.comm.expected, d.comm && d.comm.closed, d.note].map(q).join(",")));
  download(`الصفقات_${new Date().toISOString().slice(0, 10)}.csv`, "﻿" + rows.join("\r\n"), "text/csv;charset=utf-8");
});

// ================= 📝 سجل الـCRM: العروض اللي سجّلتها =================
// زرار «سجّل في الـCRM» على أي عرض أو بايع → بيتسجل هنا (الوحدة + صاحبها + حالتها + ملاحظتك) ومعاه «أمر» جاهز تنسخه. محفوظ في crmReg (متزامن مع الويندوز والسيرفر وSupabase).
const CST = { new: "مسجّل", called: "كلمته", agency: "معايا وكالة", sold: "اتباع ✅", dropped: "مش متاح ❌" };
const crmBtn = (id, skey) => {
  const r = crmReg[id];
  return `<button class="btn sm crm-btn ${r ? "on" : ""}" data-crm="${esc(id)}"${skey ? ` data-crms="${esc(skey)}"` : ""} title="${r ? "العرض ده مسجّل في الـCRM — دوس تفتح السجل" : "سجّل العرض ده في الـCRM (الوحدة وصاحبها) عشان يفضل قدام عينك"}">${r ? "✅ في الـCRM" : "📝 سجّل في الـCRM"}</button>`;
};
// العرض (بوست أو وحدة من بايع) → {unit, name, phones, profile, group, url, ts}
function crmSource(id, skey) {
  const p = byId.get(id);
  if (p && p.type === "offer") {
    let key = ""; try { key = LEADS.personOfPost(p) || ""; } catch {}
    return { id, unit: p, name: p.sender || "", phones: p.phones || [], profile: LEADS.profileLink({ key, uid: p.uid || "", profileUrl: p.profileUrl || "" }), group: (p.groups && p.groups[0]) || "", url: p.url || p.groupUrl || "", ts: p.ts || p.scannedAt || 0 };
  }
  const S = skey ? sellers.find((x) => x.key === skey) : sellers.find((x) => x.units.some((u) => u.id === id));
  const u = S && S.units.find((x) => x.id === id);
  if (!u) return null;
  return { id, unit: u, name: S.name || "", phones: S.phones || [], profile: LEADS.profileLink(S), group: u.group || "", url: (u.kind === "comment" ? u.commentUrl || u.url : u.url) || "", ts: u.ts || 0 };
}
function crmRecord(src) {
  const u = src.unit;
  return { id: src.id, status: "new", title: uLine(u), category: u.category || "other", region: u.region || "", price: u.price || null, areaM2: u.areaM2 || null, rooms: u.rooms || null,
    text: (u.summary || u.text || "").replace(/\s+/g, " ").trim().slice(0, 600), url: src.url, group: src.group, postedAt: src.ts || null,
    owner: { name: src.name, phones: (src.phones || []).slice(0, 3), profile: src.profile || "" }, note: "" };
}
// عنوان الوحدة من حقولها (بيتعمل من جديد لما تعدّل البيانات)
const crmTitleOf = (r) => [UNIT1[r.category] || "وحدة", r.rooms ? r.rooms + " غرف" : "", r.areaM2 ? r.areaM2 + " م²" : "", r.region || "", r.price ? PH.fmtPrice(r.price) : ""].filter(Boolean).join(" · ");
const CICON = { land: "🌾", apartment: "🏢", villa: "🏡", other: "📦" };
const crmMeter = (r) => (r.price && r.areaM2 ? Math.round(r.price / r.areaM2).toLocaleString("en-US") + " ج / م²" : "");
const _CD = { day: "numeric", month: "short", year: "numeric" };
const crmDate = (t) => (t ? dts(t, _CD) : "");
// «الأمر»: نص منظّم بأقسام تنسخه وتلصقه في الـCRM
function crmCommand(r) {
  const o = r.owner || {}, ph = o.phones || [], L = "──────────────";
  const row = (k, v) => (v ? `• ${k}: ${v}` : "");
  return [
    "📝 تسجيل وحدة — Aqar Matrix", L,
    "🏠 الوحدة",
    row("النوع", `${UNIT1[r.category] || "وحدة"} · بيع`), row("المنطقة", r.region), row("المساحة", r.areaM2 ? r.areaM2 + " م²" : ""), row("الغرف", r.rooms),
    row("السعر", r.price ? PH.fmtPrice(r.price) : ""), row("سعر المتر", crmMeter(r)), L,
    "👤 المالك / البايع",
    row("الاسم", o.name || "—"), row("الموبايل", ph.join(" / ")), !ph.length ? row("بروفايله", o.profile) : "", L,
    "🔗 المصدر",
    row("رابط العرض", r.url), row("الجروب", r.group), row("تاريخ النشر", crmDate(r.postedAt)), row("الوصف", (r.text || "").slice(0, 300)), L,
    "📌 المتابعة",
    row("الحالة", CST[r.status] || r.status), row("ملاحظة", r.note), row("اتسجّل", crmDate(r.at)),
  ].filter(Boolean).join("\n");
}
async function saveCrm(id, patch) {
  const { crmReg: m = {} } = await chrome.storage.local.get("crmReg");
  const cur = m[id] || {};
  const next = { ...cur, ...patch, id, updatedAt: Date.now() };
  if (patch.status && patch.status !== cur.status) next.history = [...(cur.history || []), { status: patch.status, at: Date.now() }];
  m[id] = next;
  await chrome.storage.local.set({ crmReg: m });
  crmReg = m;
  return next;
}
async function crmRegister(id, skey) {
  if (crmReg[id]) { state.view = "crm"; state.cq = ""; state.cTab = "all"; state.cFocus = id; render(); return; } // مسجّل قبل كده: افتح السجل
  const src = crmSource(id, skey);
  if (!src) return toast("⚠️ مش لاقي العرض ده — حدّث الصفحة وجرّب تاني");
  await saveCrm(id, { ...crmRecord(src), at: Date.now() });
  toast("📝 اتسجّل في الـCRM — هتلاقيه في «سجل الـCRM»");
  render();
}
function crmFiltered(ignTab) {
  const q = qNorm(state.cq);
  return Object.values(crmReg).filter((r) => (ignTab || !state.cTab || state.cTab === "all" || r.status === state.cTab) &&
    (!q || qOK(q, [r.title, r.region, r.text, (r.owner || {}).name, r.note, r.group].join(" "), (r.owner || {}).phones || [], { cats: [r.category], types: ["offer"] })))
    .sort((a, b) => (b.at || 0) - (a.at || 0));
}
function renderCrm() {
  const all = Object.values(crmReg), n = (st) => all.filter((r) => r.status === st).length;
  const val = all.filter((r) => r.status !== "sold" && r.status !== "dropped").reduce((t, r) => t + (+r.price || 0), 0);
  $("cKpis").innerHTML = `
    <div class="kpi"><b>${all.length}</b><span>📝 مسجّل في الـCRM</span></div>
    <div class="kpi"><b>${n("new")}</b><span>⏳ لسه ما كلمتهمش</span></div>
    <div class="kpi"><b>${n("called")}</b><span>📞 كلمتهم</span></div>
    <div class="kpi kpi-hot"><b>${n("agency")}</b><span>🤝 معايا وكالة</span></div>
    <div class="kpi"><b>${n("sold")}</b><span>✅ اتباعوا</span></div>
    <div class="kpi"><b>${val ? PH.fmtPrice(val) : "0"}</b><span>💰 قيمة الشغّالين</span></div>`;
  $("cTabs").innerHTML = tabsHtml({ all: "الكل", ...CST }, state.cTab || "all", "ctab", (k) => (k === "all" ? all.length : n(k)));
  if ($("cSearch") && $("cSearch").value !== (state.cq || "")) $("cSearch").value = state.cq || "";
  const list = crmFiltered();
  $("cCount").textContent = `${list.length} عرض`;
  $("cList").innerHTML = list.length ? list.map(crmCard).join("")
    : `<div class="empty"><b>${all.length ? "مفيش نتيجة بالفلتر ده" : "لسه ما سجّلتش أي عرض"}</b>${all.length ? "جرّب «الكل» أو غيّر كلمة البحث." : "دوس «📝 سجّل في الـCRM» على أي عرض في «الطلبات والعروض» أو «البايعين» وهيظهر هنا."}</div>`;
  if (state.cFocus) { const id = state.cFocus; state.cFocus = ""; setTimeout(() => { const el = [...document.querySelectorAll("#cList [data-crmid]")].find((x) => x.dataset.crmid === id); if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1800); } }, 60); }
}
const CSTEPS = ["new", "called", "agency", "sold"];
function crmCard(r) {
  const o = r.owner || {}, ph = o.phones || [], editing = state.cEdit === r.id;
  const ci = CSTEPS.indexOf(r.status);
  const steps = Object.entries(CST).map(([k, v]) => `<button class="cstep ${k === r.status ? "on" : ""} ${ci > -1 && CSTEPS.indexOf(k) > -1 && CSTEPS.indexOf(k) < ci ? "done" : ""} ${k === "dropped" ? "drop" : ""}" data-cstatus="${esc(r.id)}" data-cval="${k}">${v}</button>`).join("");
  const F = (k, v, cls = "") => `<div class="crm-f ${cls}"><span>${k}</span><b>${v ? esc(String(v)) : "—"}</b></div>`;
  const grid = editing
    ? `<div class="crm-form" data-cform="${esc(r.id)}">
        <label>النوع<select data-cf="category">${Object.entries(UNIT1).map(([k, v]) => `<option value="${k}" ${k === r.category ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        <label>المنطقة<input data-cf="region" value="${esc(r.region || "")}"></label>
        <label>المساحة (م²)<input dir="ltr" data-cf="areaM2" inputmode="decimal" value="${esc(r.areaM2 || "")}"></label>
        <label>الغرف<input dir="ltr" data-cf="rooms" inputmode="numeric" value="${esc(r.rooms || "")}"></label>
        <label>السعر <small>(1.5 = مليون ونص · 3.200 = 3 مليون و200 · 950 = 950 ألف)</small><input dir="ltr" data-cf="price" inputmode="decimal" value="${esc(r.price || "")}"></label>
        <label>اسم المالك/البايع<input data-cf="ownerName" value="${esc(o.name || "")}"></label>
        <label>الموبايل<input dir="ltr" data-cf="ownerPhones" inputmode="tel" value="${esc(ph.join(" / "))}"></label>
        <div class="crm-form-act"><button class="btn sm primary" data-csaveedit="${esc(r.id)}">💾 حفظ التعديل</button><button class="btn sm" data-ccancel>إلغاء</button></div>
      </div>`
    : `<div class="crm-grid">${F("النوع", (UNIT1[r.category] || "وحدة") + " · بيع")}${F("المنطقة", r.region)}${F("المساحة", r.areaM2 ? r.areaM2 + " م²" : "")}${F("الغرف", r.rooms)}${F("السعر", r.price ? PH.fmtPrice(r.price) : "", "hi")}${F("سعر المتر", crmMeter(r))}</div>`;
  return `<article class="card crm-card cst-${r.status}" data-crmid="${esc(r.id)}">
    <header class="crm-h">
      <span class="crm-ico">${CICON[r.category] || "📦"}</span>
      <div class="crm-hm"><b class="crm-title">${esc(r.title || "وحدة")}</b><small>اتسجّل ${relDay(r.at)}${r.updatedAt && r.updatedAt - (r.at || 0) > 6e4 ? " · آخر تعديل " + relDay(r.updatedAt) : ""}</small></div>
      <span class="crm-st st-${r.status}">${CST[r.status] || r.status}</span>
    </header>
    <div class="crm-steps" title="حالة الوحدة — دوس على المرحلة">${steps}</div>
    ${grid}
    <div class="crm-cols">
      <section class="crm-box"><h4>👤 المالك / البايع</h4>
        <div class="crm-who">${esc(o.name || "—")}</div>
        <div class="crm-ph">${ph.length ? ph.map((n) => `<span class="ph">${esc(n)}<a href="${PH.waLink(n)}" target="_blank">💬 واتساب</a><button data-copy="${esc(n)}">📋</button></span>`).join(" ") : o.profile ? `<a class="btn sm" href="${esc(o.profile)}" target="_blank">👤 افتح بروفايله</a>` : `<span class="muted">مفيش رقم</span>`}</div>
      </section>
      <section class="crm-box"><h4>🔗 المصدر</h4>
        <div class="crm-src">${r.group ? `👥 ${esc(r.group)}` : ""}${r.postedAt ? `<small> · نُشر ${esc(crmDate(r.postedAt))}</small>` : ""}</div>
        <div>${r.url ? `<a class="btn sm" href="${esc(r.url)}" target="_blank">🔗 افتح العرض</a>` : `<span class="muted">مفيش رابط</span>`}</div>
      </section>
    </div>
    ${r.text ? `<div class="crm-desc" title="دوس عشان تفتح النص كله">${esc(r.text)}</div>` : ""}
    <div class="crm-notebox"><span>📝</span><input class="note" data-cnote="${esc(r.id)}" value="${esc(r.note || "")}" placeholder="ملاحظة (مثلاً: المالك طالب 1.4 كاش وهيوقّع الأسبوع الجاي)"></div>
    <footer class="crm-act">
      <button class="btn sm primary" data-ccopy="${esc(r.id)}" title="نص منظّم بأقسام جاهز تلصقه في الـCRM">📋 انسخ الأمر</button>
      <button class="btn sm" data-cedit="${esc(r.id)}" title="صحّح بيانات الوحدة أو المالك">✏️ عدّل البيانات</button>
      <button class="btn sm danger" data-cdel="${esc(r.id)}" title="شيله من السجل (الوحدة نفسها ما بتتمسحش)">🗑 شيل</button>
    </footer>
  </article>`;
}
document.addEventListener("click", async (e) => {
  const t = e.target;
  const ct = t.closest("[data-ctab]"); if (ct) { state.cTab = ct.dataset.ctab; return render(); }
  const cdsc = t.closest(".crm-desc"); if (cdsc) return cdsc.classList.toggle("open");
  const cs = t.closest("[data-cval]"); if (cs) { await saveCrm(cs.dataset.cstatus, { status: cs.dataset.cval }); return render(); }
  const ce = t.closest("[data-cedit]"); if (ce) { state.cEdit = ce.dataset.cedit; return render(); }
  if (t.closest("[data-ccancel]")) { state.cEdit = ""; return render(); }
  const cse = t.closest("[data-csaveedit]");
  if (cse) {
    const id = cse.dataset.csaveedit, f = {}; cse.closest("[data-cform]").querySelectorAll("[data-cf]").forEach((el) => { f[el.dataset.cf] = el.value.trim(); });
    const num = (v) => { const n = parseFloat(PH.toEn(v || "").replace(/[,٬\s]/g, "").replace("٫", ".")); return isNaN(n) || n <= 0 ? null : n; };
    // السعر: «300 ألف» / «500k» / «2.5 مليون» / «3.200» (= 3 مليون و200 ألف) / «950» (= 950 ألف) بتتفهم كلها (parseMoney بنوع total)
    let price = parseMoney(f.price, "total"); if (price && !(price > 0)) price = null;
    const cur = crmReg[id] || {};
    let phones = PH.extractPhones(PH.toEn(f.ownerPhones || "")); // بيفهم «010 1234 5678» و«+20 101 234 5678» (كان بيمسح كل الأرقام)
    if (!phones.length && String(f.ownerPhones || "").trim() && cur.owner && cur.owner.phones) phones = cur.owner.phones.slice(); // الحقل مش فاضي بس مفيهوش رقم مفهوم: ما نمسحش القديم
    const patch = { category: f.category || cur.category, region: f.region, areaM2: num(f.areaM2), rooms: num(f.rooms) ? Math.round(num(f.rooms)) : null, price, owner: { ...(cur.owner || {}), name: f.ownerName, phones } };
    const changed = ["category", "region", "areaM2", "rooms", "price"].some((k) => (patch[k] || null) !== (cur[k] || null));
    if (changed) patch.title = crmTitleOf({ ...cur, ...patch });
    state.cEdit = ""; await saveCrm(id, patch); toast("✏️ البيانات اتحدّثت"); return render();
  }
  const cc = t.closest("[data-ccopy]"); if (cc) { const r = crmReg[cc.dataset.ccopy]; if (r) { await copyText(crmCommand(r)); toast("📋 اتنسخ الأمر — الصقه في الـCRM"); } return; }
  const cd = t.closest("[data-cdel]");
  if (cd) {
    if (!confirm("تشيل الوحدة دي من سجل الـCRM؟ ملاحظاتها وتاريخ حالاتها هيتمسحوا (الوحدة نفسها في عروضك مش هتتمسح).")) return;
    const id = cd.dataset.cdel; const { crmReg: m = {} } = await chrome.storage.local.get("crmReg");
    delete m[id]; await chrome.storage.local.set({ crmReg: m }); crmReg = m; toast("اتشال من سجل الـCRM"); return render();
  }
  if (t.closest("#cCopyAll")) { const l = crmFiltered(); if (!l.length) return toast("مفيش حاجة تتنسخ"); await copyText(l.map(crmCommand).join("\n\n———\n\n")); return toast(`📋 اتنسخ ${l.length} أمر`); }
  if (t.closest("#cExport")) {
    const q = csvQ, dt = (x) => (x ? new Date(x).toLocaleDateString("ar-EG-u-nu-latn") : "");
    const rows = [["الوحدة", "النوع", "المنطقة", "المساحة", "الغرف", "السعر", "المالك/البايع", "الرقم", "الحالة", "اتسجّل", "الرابط", "الجروب", "ملاحظة"].map(q).join(",")]
      .concat(crmFiltered(true).map((r) => [r.title, UNIT1[r.category] || "", r.region, r.areaM2, r.rooms, r.price, (r.owner || {}).name, ((r.owner || {}).phones || []).map((n) => "'" + n).join(" / "), CST[r.status], dt(r.at), r.url, r.group, r.note].map(q).join(",")));
    return download(`سجل_CRM_${new Date().toISOString().slice(0, 10)}.csv`, "﻿" + rows.join("\r\n"), "text/csv;charset=utf-8");
  }
});
document.addEventListener("change", async (e) => {
  const nt = e.target.closest && e.target.closest("[data-cnote]"); if (nt) { await saveCrm(nt.dataset.cnote, { note: nt.value.trim() }); return toast("📝 الملاحظة اتحفظت"); }
});
document.addEventListener("input", (e) => { if (e.target && e.target.id === "cSearch") { state.cq = e.target.value; renderCrm(); } });

// ================= 🎯 درجة الحقيقة: نسبة المكاتب في داتاك + «حسم سريع» =================
// بيعتمد على realness.js (REAL): ملخص من القوايم اللي في الشاشة (من غير حساب تقيل) + طابور ناس تصنيفهم لسه مش واضح
function qSkipGet() { try { const o = JSON.parse(localStorage.getItem("realQSkip") || "{}"); return o.d === new Date().toDateString() ? new Set(o.k || []) : new Set(); } catch (e) { return new Set(); } }
function qSkipAdd(k) { try { const s = qSkipGet(); s.add(k); localStorage.setItem("realQSkip", JSON.stringify({ d: new Date().toDateString(), k: [...s] })); } catch (e) { state.qMem = (state.qMem || new Set()).add(k); } }
let _realSum = null;
function realSum() {
  if (typeof REAL === "undefined") return null;
  const days = Math.max(state.sDays || 0, state.lDays || 0), since = days ? Date.now() - days * 864e5 : 0;
  const k = [sellers, leads, since, clusters];
  if (_realSum && _realSum.k.every((v, i) => v === k[i]) && Date.now() - _realSum.t < 20000) return _realSum.v;
  const v = REAL.summary(sellers, leads, { since, clusters, keepS: unitInAreaAny });
  _realSum = { k, t: Date.now(), v };
  return v;
}
const pc = (n, t) => (t ? Math.round((n / t) * 100) : 0);
const rbar = (parts) => `<div class="rbar" aria-hidden="true">${parts.map((p) => `<i class="${p.cls}" style="flex:${Math.max(0, p.n)}" title="${esc(p.t)}"></i>`).join("")}</div>`;
function realHtml(side) {
  const sm = realSum(); if (!sm) return "";
  const stt = REAL.status(sellers, leads);
  const open = state.realOpen !== false ? "open" : "";
  const days = side === "seller" ? state.sDays : state.lDays;
  const per = days ? `آخر ${days} يوم` : "أي وقت";
  let head = "", body = "";
  if (side === "seller") {
    const S0 = sm.sellers;
    if (!S0.n) return "";
    const unsure = S0.n - S0.owners - S0.brokers;
    head = `🎯 مين الحقيقي في بايعينك؟ <small>(${per} · ${S0.n} بايع)</small>`;
    const lt1 = (n, p) => (n > 0 && p === 0 ? "أقل من 1" : p);
    body = `<div class="rs-line"><b>${S0.brokerPct}٪</b> من البايعين مكاتب أو سماسرة أو وسطاء${S0.distinct ? ` — وهما بيعرضوا <b>${S0.brokerUnitPct}٪</b> من الوحدات المختلفة` : ""}. الصافيين <b>${lt1(S0.owners, S0.ownerPct)}٪</b> بس${unsure ? ` (و<b>${S0.unsurePct}٪</b> لسه مش واضح)` : ""}.</div>
      ${rbar([{ n: S0.owners, cls: "own", t: "صافي" }, { n: unsure, cls: "unk", t: "مشتبه" }, { n: S0.brokers, cls: "brk", t: "مكاتب/سماسرة" }])}
      <div class="rs-legend">
        <button class="rs-seg own ${state.sKind === "owner" ? "on" : ""}" data-skind="owner">✅ صافي <b>${S0.owners}</b> (${S0.ownerPct}٪)</button>
        <button class="rs-seg unk ${state.sKind === "unsure" ? "on" : ""}" data-skind="unsure">🟠 مشتبه <b>${unsure}</b> (${S0.unsurePct}٪)</button>
        <button class="rs-seg brk ${state.sKind === "brokers" ? "on" : ""}" data-skind="brokers">🏢🤝 مكاتب وسماسرة <b>${S0.brokers}</b> (${S0.brokerPct}٪)</button>
        <button class="rs-seg ${state.sSort === "real" ? "on" : ""}" data-sortreal="s" title="رتّب القايمة بالأكتر احتمال مالك فوق">↕ رتّب بالأكتر حقيقة</button>
      </div>
      <div class="muted rs-note">${S0.units} إعلان = <b>${S0.distinct}</b> وحدة مختلفة بعد شيل إعادة النشر${S0.sharedUnits ? ` · <b>${S0.sharedUnits}</b> وحدة نازلة من أكتر من حساب (${S0.extraPosters} نسخة زيادة)` : ""}</div>`;
  } else {
    const B0 = sm.buyers;
    if (!B0.n) return "";
    head = `🎯 مين الحقيقي في مشتريك؟ <small>(${per} · ${B0.n} شخص)</small>`;
    const other = Math.max(0, B0.n - B0.real - B0.brokerish);
    body = `<div class="rs-line"><b>${B0.brokerPct}٪</b> من «المشترين» وسطاء أو تجار أو بيبيعوا كمان، و<b>${B0.realPct}٪</b> بس مشترين نهائيين حقيقيين (${B0.real}).</div>
      ${rbar([{ n: B0.real, cls: "own", t: "حقيقيين" }, { n: other, cls: "unk", t: "مش واضح" }, { n: B0.brokerish, cls: "brk", t: "وسطاء/تجار" }])}
      <div class="rs-legend">
        <button class="rs-seg own ${state.lKind === "real" ? "on" : ""}" data-lkind="real">💎 حقيقي <b>${B0.real}</b> (${B0.realPct}٪)</button>
        <button class="rs-seg brk ${state.lKind === "trader" ? "on" : ""}" data-lkind="trader">🏢 تاجر/مكتب بيطلب <b>${B0.trader}</b></button>
        <button class="rs-seg brk ${state.lKind === "swap" ? "on" : ""}" data-lkind="swap">🔄 بيبيع وبيشتري <b>${B0.swap}</b></button>
        <button class="rs-seg brk ${state.lKind === "broker" ? "on" : ""}" data-lkind="broker">🤝 وسيط بعميل <b>${B0.client}</b></button>
        <button class="rs-seg ${state.lSort === "real" ? "on" : ""}" data-sortreal="l" title="رتّب القايمة بالأكتر احتمال مشتري حقيقي فوق">↕ رتّب بالأكتر حقيقة</button>
      </div>`;
  }
  // كل جروب لوحده
  const gs = sm.groups.filter((g) => (side === "seller" ? g.sellers : g.buyers) >= 2).sort((a, b) => (side === "seller" ? b.ownerPct - a.ownerPct || b.sellers - a.sellers : b.realBuyerPct - a.realBuyerPct || b.buyers - a.buyers)).slice(0, 14);
  const gtab = gs.length ? `<details class="rs-groups"><summary>📍 كل جروب لوحده (الأحسن في الأول)</summary><div class="rs-tbl"><table><thead><tr><th>الجروب</th>${side === "seller" ? "<th>بايعين</th><th>ملّاك</th><th>مكاتب/سماسرة</th>" : "<th>أشخاص</th><th>حقيقيين</th><th>وسطاء/تجار</th>"}</tr></thead><tbody>${gs.map((g) => side === "seller"
    ? `<tr><td class="gn">${esc(g.name)}</td><td>${g.sellers}</td><td class="${g.ownerPct >= 40 ? "good" : ""}">${g.owners} <small>(${g.ownerPct}٪)</small></td><td>${g.brokers} <small>(${g.brokerPct}٪)</small></td></tr>`
    : `<tr><td class="gn">${esc(g.name)}</td><td>${g.buyers}</td><td class="${g.realBuyerPct >= 15 ? "good" : ""}">${g.realBuyers} <small>(${g.realBuyerPct}٪)</small></td><td>${g.brokerBuyers} <small>(${pc(g.brokerBuyers, g.buyers)}٪)</small></td></tr>`).join("")}</tbody></table></div></details>` : "";
  // حالة التعلّم من تصنيفاتك
  const lr = side === "seller" ? stt.sellers : stt.buyers;
  const lline = side === "seller"
    ? `🧠 التعلّم من تصنيفاتك: <b>${lr.owner}</b> مالك · <b>${lr.broker}</b> سمسار/مكتب — ${lr.on ? "شغّال ✅ (بيعدّل التقدير بإشارات صغيرة من اللي اتعلمه عندك)" : `لسه مش شغّال، محتاج ${lr.need} تصنيف كمان من النوع الأقل (أقل حاجة ${stt.min} من كل نوع)`}`
    : `🧠 التعلّم من تصنيفاتك: <b>${lr.buyer}</b> مشتري · <b>${lr.other}</b> وسيط/مش مشتري — ${lr.on ? "شغّال ✅" : `لسه مش شغّال، محتاج ${lr.need} تصنيف كمان من النوع الأقل (أقل حاجة ${stt.min} من كل نوع)`}`;
  // طابور الحسم
  const skip = qSkipGet(); if (state.qMem) state.qMem.forEach((k) => skip.add(k));
  const days2 = side === "seller" ? state.sDays : state.lDays;
  const Q = REAL.queue(sellers.filter((S) => unitInAreaAny(S)), leads, { n: 10, side, skip, since: days2 ? Date.now() - days2 * 864e5 : 0 });
  const qrow = (q) => {
    const x = q.item, isS = q.side === "seller";
    const chips = isS ? [...(x.rwhy || []).slice(0, 2).map((w) => `<span class="why-c">✔ ${esc(w)}</span>`), ...(x.rneg || []).filter((w) => !/^⚠/.test(w)).slice(0, 2).map((w) => `<span class="why-c warn">✖ ${esc(w)}</span>`)]
      : [...(x.bwhy || []).slice(0, 2).map((w) => `<span class="why-c">✔ ${esc(w)}</span>`), ...(x.bneg || []).filter((w) => !/^⚠/.test(w)).slice(0, 2).map((w) => `<span class="why-c warn">✖ ${esc(w)}</span>`)];
    if (q.share > 0) chips.push(`<span class="why-c">📞 مشترك مع ${q.share} ${q.share === 1 ? "حساب" : "حسابات"} — تصنيفك هيتعمم</span>`);
    const u = isS ? x.units[0] : null, last = isS ? null : x.acts[0];
    const line = isS ? `${esc(uLine(u))} — ${esc((u.summary || u.text || "").replace(/\s+/g, " ").slice(0, 100))}` : `${esc((x.want && x.want.text) || "")} — ${esc(((last && last.text) || "").replace(/\s+/g, " ").slice(0, 100))}`;
    const prof = LEADS.profileLink(x);
    const links = `${(x.phones || [])[0] ? `<a class="btn sm wa" href="${PH.waLink(x.phones[0])}" target="_blank" rel="noopener">💬</a>` : ""}${prof ? `<a class="btn sm" href="${esc(prof)}" target="_blank" rel="noopener" title="افتح البروفايل">👤</a>` : ""}`;
    const btns = isS
      ? `<button class="btn sm q-own" data-qset="owner">🏷 مالك</button><button class="btn sm" data-qset="broker">🤝 سمسار</button><button class="btn sm" data-qset="office">🏢 مكتب</button>`
      : `<button class="btn sm q-own" data-qset="buyer">✅ مشتري</button><button class="btn sm" data-qset="broker">🤝 وسيط</button><button class="btn sm" data-qset="not">🚫 مش مشتري</button>`;
    return `<div class="q-row" data-qkey="${esc(x.key)}" data-qside="${q.side}" data-qshare="${q.share}">
      <div class="q-main"><b>${esc(x.name)}</b> <span class="muted">${isS ? `${x.ru != null && x.ru !== x.units.length ? x.ru + " وحدة مختلفة" : x.units.length + " وحدة"} · مالك ${x.rp}%` : `مشتري ${x.bp}%`} · ${relDay(x.last)}</span>
        <div class="muted ellip">${line}</div><div class="whys">${chips.join("")}</div></div>
      <div class="q-btns">${links}${btns}<button class="btn sm" data-qskip title="هرجّعهولك بكرة">⏭ بعدين</button></div></div>`;
  };
  const queue = `<div class="real-q"><div class="rq-head"><b>⚡ حسم سريع</b> <span class="muted">${Q.length ? `${Q.length} ${side === "seller" ? "بايع" : "شخص"} لسه مش واضحين — ضغطة واحدة لكل واحد، وتصنيفك بيتعمم على نفس الرقم وبيحسّن التقدير لباقي الناس` : "مفيش حد محتاج حسم دلوقتي 👌 (كل النشطين إما مؤكدين أو واضحين)"}</span></div>${Q.map(qrow).join("")}</div>`;
  return `<details class="real-sum" ${open}><summary>${head}</summary>${body}${gtab}<div class="muted rs-learn">${lline}</div>${queue}</details>`;
}
document.addEventListener("toggle", (e) => { const d = e.target; if (d && d.matches && d.matches("details.real-sum")) state.realOpen = d.open; }, true);
document.addEventListener("click", async (e) => {
  const sr = e.target.closest("[data-sortreal]");
  if (sr) { if (sr.dataset.sortreal === "s") { state.sSort = state.sSort === "real" ? "score" : "real"; if ($("sSort")) $("sSort").value = state.sSort; } else { state.lSort = state.lSort === "real" ? "score" : "real"; if ($("lSort")) $("lSort").value = state.lSort; } return render(); }
  const b = e.target.closest("[data-qset],[data-qskip]"); if (!b) return;
  const row = b.closest("[data-qkey]"); if (!row) return;
  const key = row.dataset.qkey, side = row.dataset.qside, share = +row.dataset.qshare || 0;
  qSkipAdd(key);
  row.classList.add("done"); row.querySelectorAll("button").forEach((x) => { x.disabled = true; });
  if (b.matches("[data-qskip]")) { toast("تمام — هرجّعهولك بكرة"); return; }
  const v = b.dataset.qset;
  await setLeadMeta(key, side === "seller" ? { role: v } : { brole: v });
  toast((side === "seller" ? "اتصنّف " + ROLE.ROLES[v] : v === "buyer" ? "اتأكد إنه مشتري ✅" : v === "broker" ? "اتصنّف وسيط" : "اتستبعد (مش مشتري)") + (share ? ` — وهيتطبق على ${share} ${share === 1 ? "حساب" : "حسابات"} بنفس الرقم` : " — وهيتطبق على نفس الرقم"));
});


// ================= 🎯 تأكيد المشترين على واتساب (10.60) =================
// بدل التخمين: رسالة واحدة بأزرار لكل مشتري مشتبه فيه («حضرتك هتشتري بنفسك؟») — ردّه بيتحوّل لتصنيف (role.js) وبيتعمّم على نفس الرقم.
let QS = null, QC = null, qLast = 0, qBusy = false, qFetching = false;
const qSend = (m) => chrome.runtime.sendMessage(m).catch((e) => ({ ok: false, error: String(e && e.message || e) }));
async function qualFetch(force) {
  if (qFetching || (!force && Date.now() - qLast < 4000)) return; qFetching = true; qLast = Date.now();
  try { const r = await qSend({ type: "qualState" }); if (r && r.ok) { QS = r; if (state.view === "leads") { const el = $("lQual"); if (el && !(el.contains(document.activeElement) && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))) el.innerHTML = qualHtml(); } } } finally { qFetching = false; }
}
const Q_ST = { asked: ["⏳", "مستني رده"], buyer: ["✅", "قال: أنا المشتري"], self: ["💎", "هيعاين بنفسه"], later: ["⏳", "مشتري بس مش دلوقتي"], proxy: ["🤝", "هيبعت حد بدله"], broker: ["🏢", "عنده عميل"], office: ["🏢", "مكتب عقارات"],
  stop: ["🚫", "طلب الإيقاف"], seen: ["💎✔", "اتعاين فعلًا"], noshow: ["✖", "حجز وما حضرش"], invalid: ["📵", "الرقم مش على واتساب"] };
function qualHtml() {
  if (typeof QUAL === "undefined") return "";
  const open = state.qualOpen === false ? "" : "open", q = QS;
  if (!q) return `<details class="real-sum qual-sum" ${open}><summary class="rs-h">🎯 تأكيد المشترين على واتساب <small>(بيحمّل…)</small></summary></details>`;
  const c = q.cfg, S = q.stats, cloud = q.channel === "cloud";
  const chip = (t, cls) => `<span class="q-chip ${cls || ""}">${t}</span>`;
  const sw = (k, label, on, title) => `<label class="q-sw" title="${esc(title || "")}"><input type="checkbox" data-qcfg="${k}" ${on ? "checked" : ""}> ${label}</label>`;
  const stat = chip(c.on ? "✅ شغّال" : "⏸ مقفول", c.on ? "ok" : "") + chip(cloud ? "📨 واتساب الرسمي (API)" : "💬 واتساب ويب") + chip(`النهارده <b>${ar(S.today)}</b> من <b>${ar(c.perDay)}</b>`) +
    chip(`اتسأل <b>${ar(S.asked)}</b> · ردّوا <b>${ar(S.answered)}</b>`) + chip(`✅ مشتري <b>${ar(S.yes)}</b>`, "ok") + chip(`🏢 وسيط/مكتب <b>${ar(S.no)}</b>`) + (S.stop ? chip(`🚫 إيقاف <b>${ar(S.stop)}</b>`) : "") + (S.pending ? chip(`⏳ مستني <b>${ar(S.pending)}</b>`) : "");
  const msgs = cloud ? `<div class="q-msgs muted">${q.msgs.filter((m) => m.qual === 1).map((m) => `${esc(m.title.replace(/^🎯 تأهيل المشتري — /, "").replace(/ \(تلقائي\)$/, ""))}: <b class="${m.st === "APPROVED" ? "good" : ""}">${esc({ APPROVED: "معتمد ✅", PENDING: "مستني ميتا ⏳", REJECTED: "ميتا رفضته ❌", NONE: "لسه ما اتبعتش لميتا" }[m.st] || m.st)}</b>`).join(" · ")}
    ${q.msgs.some((m) => m.qual === 1 && m.st !== "APPROVED") ? ` <button class="btn sm" data-qact="submit">📤 ابعت القوالب لميتا</button> <button class="btn sm" data-qact="sync">🔄 اعرف حالتها</button>` : ""}</div>` : "";
  const cand = QC ? `<div class="q-cands"><div class="muted">${QC.length ? `اخترت أعلى <b>${ar(Math.min(QC.length, q.room))}</b> (اللي فاضل من سقف النهارده) — عدّل الاختيار وبعدين ضيفهم للطابور:` : "مفيش مشترين مشتبه فيهم محتاجين سؤال دلوقتي (كل اللي ليهم رقم إما اتسألوا أو متصنفين)."}</div>
    ${QC.length ? `<div class="q-list">${QC.slice(0, 40).map((x, i) => `<label class="q-cand"><input type="checkbox" data-qnum="${esc(x.num)}" ${i < q.room ? "checked" : ""}> <b>${esc(x.nm || x.num)}</b> <span class="muted">${esc(x.want || "")}${x.unit ? " · عندك: " + esc(x.unit) : ""} · ${ar(x.score)} نقطة · مشتري ${ar(x.bp)}٪ · ${relDay(x.last)}</span></label>`).join("")}</div>
    <div class="q-row2"><button class="btn sm primary" data-qact="enqueue">➕ ضيف المحدد للطابور</button> <span class="muted">هيتبعتوا على مدار اليوم بنفس فاصل وسقوف بوت واتساب، من ${ar(c.from)} لـ ${ar(c.to)}.</span></div>` : ""}</div>` : "";
  const queue = q.queue.length ? `<div class="q-queue"><b>📬 الطابور (${ar(q.queue.length)})</b> <span class="muted">${q.inHours ? "" : "— برا ساعات الإرسال، هيبدأ الساعة " + ar(c.from)}</span>
    ${q.queue.slice(0, 12).map((x) => `<span class="q-chip" title="${esc(x.num)}">${esc(x.nm || x.num)} <button class="q-x" data-qdeq="${esc(x.num)}" title="شيله من الطابور">✕</button></span>`).join("")}${q.queue.length > 12 ? `<span class="muted"> +${ar(q.queue.length - 12)}</span>` : ""}</div>` : "";
  const rec = q.recent.length ? `<details class="q-recent"><summary>📋 آخر الردود (${ar(q.recent.length)})</summary><div class="q-rows">${q.recent.slice(0, 25).map((r) => { const t = Q_ST[r.s] || ["•", r.s];
    const yes = /^(buyer|self|later)$/.test(r.s);
    return `<div class="q-r"><span>${t[0]}</span> <b>${esc(r.nm || r.num)}</b> <span class="muted">${esc(t[1])}${r.when ? " — «" + esc(r.when.slice(0, 60)) + "»" : r.note ? " — «" + esc(r.note.slice(0, 60)) + "»" : ""} · ${relDay(r.la)}</span>
      ${yes && r.k ? `<button class="btn sm" data-qmark="seen" data-qkey="${esc(r.k)}" data-qphone="${esc(r.num)}" title="لما تقابله وتتأكد إنه فعلًا عاين">✔ اتعاين فعلًا</button> <button class="btn sm" data-qmark="noshow" data-qkey="${esc(r.k)}" data-qphone="${esc(r.num)}">✖ ما حضرش</button>` : ""}
      ${(r.s === "seen" || r.s === "noshow") && r.k ? `<button class="btn sm" data-qmark="reset" data-qkey="${esc(r.k)}" data-qphone="${esc(r.num)}">↺ رجّعه</button>` : ""}</div>`; }).join("")}</div></details>` : "";
  return `<details class="real-sum qual-sum" ${open}><summary class="rs-h">🎯 تأكيد المشترين على واتساب <small>(اسأله «إنت المشتري؟» بدل ما تخمّن)</small></summary>
    <div class="rs-line">بوت واتساب بيبعت رسالة واحدة بأزرار لكل مشتري مشتبه فيه سايب رقمه بنفسه في طلبه: <b>«حضرتك هتشتري بنفسك؟»</b>. ردّه بيتحوّل لتصنيف فورًا: «أنا المشتري» ← <b>💎 موثّق</b> · «عندي عميل / مكتب» ← <b>🏢</b>. واللي قال «أنا المشتري» بيتسأل كمان «تعاين بنفسك؟» — اللي بيحجز بنفسه أقوى من اللي بيقول «هبعت حد».</div>
    <div class="q-chips">${stat}</div>${msgs}
    <div class="q-cfg">${sw("on", "تشغيل التأهيل", c.on, "شغّال = البوت بيبعت اللي في الطابور")} ${sw("auto", "جهّز قايمة النهارده تلقائي", c.auto, "كل ٣ ساعات بالكتير، لما الطابور يفضى")} ${sw("includePure", "اسأل الصافيين كمان", c.includePure, "عشان تحوّلهم 💎")} ${sw("view", "اسأل عن المعاينة", c.view)}
      <label class="q-n">حد اليوم <input type="number" min="1" max="20" data-qcfg="perDay" value="${c.perDay}"></label> <label class="q-n">من <input type="number" min="0" max="23" data-qcfg="from" value="${c.from}"></label> <label class="q-n">لـ <input type="number" min="1" max="24" data-qcfg="to" value="${c.to}"></label>
      <label class="q-n">اسمك في الرسالة <input type="text" data-qcfg="me" value="${esc(c.me)}" placeholder="علاء" maxlength="30"></label></div>
    ${!c.on && !q.botOn ? `<div class="muted">⚠ لازم تشغّل التأهيل (فوق) عشان يبدأ يبعت — مش لازم حملتك العادية تكون شغالة.</div>` : ""}
    <div class="q-row2"><button class="btn sm primary" data-qact="prepare">🔎 جهّز مرشحين النهارده</button>
      <input type="tel" id="qTestNum" class="q-test" placeholder="رقمك للتجربة 01xxxxxxxxx" value="${esc(q.testNum || "")}" inputmode="tel"> <button class="btn sm" data-qact="test" title="يبعت سؤال التأهيل لرقمك إنت بس عشان تجرّب الأزرار">🧪 جرّب على رقمي</button> <button class="btn sm" data-qact="testview" title="يبعت سؤال المعاينة لرقمك">🧪 جرّب المعاينة</button></div>
    ${cand}${queue}${rec}
    <div class="muted rs-note">⚠ مفيش حاجة ١٠٠٪: سمسار ممكن يدوس «أنا المشتري». عشان كده سؤال المعاينة موجود، وزرار «✔ اتعاين فعلًا» هو التأكيد الأقوى. البوت بيسأل كل واحد مرة واحدة بس (ومرة تانية بعد ٣ أسابيع لو ما ردّش) ومحدش بيتبعتله لو طلب الإيقاف.</div></details>`;
}
document.addEventListener("toggle", (e) => { const d = e.target; if (d && d.matches && d.matches("details.qual-sum")) state.qualOpen = d.open; }, true);
async function qualPrepare() {
  const st = await chrome.storage.local.get(["waSent", "waBlock", "waCfg", "waQual", "qualCfg"]), cfg = QUAL.cfg(st.qualCfg), wcfg = WAS.cfg(st.waCfg || {}), now = Date.now();
  const best = new Map(); for (const x of (FULL && FULL.pairs) || []) { const c0 = best.get(x.B.key); if (!c0 || x.score > c0.score) best.set(x.B.key, x); }
  QC = QUAL.pick((FULL && FULL.leads) || leads, { cfg, now, ledger: st.waQual || {}, block: st.waBlock || {}, best, ready: (n) => WAS.state(n, st.waSent || {}, st.waBlock || {}, wcfg, now) === "ready" }).slice(0, 40);
  await qualFetch(true); const el = $("lQual"); if (el) el.innerHTML = qualHtml();
}
document.addEventListener("click", async (e) => {
  const t = e.target, a = t.closest && t.closest("[data-qact]"), dq = t.closest && t.closest("[data-qdeq]"), mk = t.closest && t.closest("[data-qmark]");
  if (!a && !dq && !mk) return;
  e.preventDefault(); e.stopPropagation();
  const done = async (r, ok) => { if (r && r.ok === false) toast("⚠ " + (r.error || r.note || "حصلت مشكلة")); else if (ok) toast(ok); await qualFetch(true); const el = $("lQual"); if (el) el.innerHTML = qualHtml(); };
  if (dq) return done(await qSend({ type: "qualDequeue", nums: [dq.dataset.qdeq] }));
  if (mk) { const r = await qSend({ type: "qualMark", s: mk.dataset.qmark, key: mk.dataset.qkey, num: /^\d{10,15}$/.test(mk.dataset.qphone || "") ? mk.dataset.qphone : "" }); return done(r, mk.dataset.qmark === "seen" ? "💎 اتسجّل: اتعاين فعلًا — أقوى تصنيف" : mk.dataset.qmark === "noshow" ? "اتسجّل: ما حضرش" : "اتساب زي ما كان"); }
  const act = a.dataset.qact;
  if (act === "prepare") { await qualPrepare(); return; }
  if (act === "enqueue") {
    const nums = [...document.querySelectorAll("#lQual [data-qnum]:checked")].map((x) => x.dataset.qnum), items = (QC || []).filter((x) => nums.includes(x.num));
    if (!items.length) return toast("اختار حد الأول");
    const r = await qSend({ type: "qualEnqueue", items }); QC = (QC || []).filter((x) => !nums.includes(x.num)); return done(r, r && r.ok ? `➕ ضفت ${r.added} للطابور` : "");
  }
  if (act === "test" || act === "testview") {
    const num = ($("qTestNum") || {}).value || ""; if (!num.trim()) return toast("اكتب رقمك الأول");
    const r = await qSend({ type: "qualTest", num, step: act === "testview" ? "view" : "ask" }); return done(r, "🧪 اتبعتت لرقمك — جرّب الأزرار");
  }
  if (act === "submit") { const ids = QS.msgs.filter((m) => m.qual === 1).map((m) => m.id); const r = await qSend({ type: "wcSubmit", ids }); return done(r && r.ok === false ? { ok: false, error: r.note } : r, "📤 اتبعتت لميتا — استنى الموافقة"); }
  if (act === "sync") { const r = await qSend({ type: "wcSync" }); return done(r && r.ok === false ? { ok: false, error: r.note } : r, "🔄 اتحدّثت الحالة"); }
}, true);
document.addEventListener("change", async (e) => {
  const t = e.target; if (!t.matches || !t.matches("[data-qcfg]")) return;
  const k = t.dataset.qcfg, v = t.type === "checkbox" ? t.checked : t.type === "number" ? +t.value : t.value;
  const r = await qSend({ type: "qualSet", patch: { [k]: v } }); if (r && r.ok) { QS = r; const el = $("lQual"); if (el && !el.contains(document.activeElement)) el.innerHTML = qualHtml(); } else toast("⚠ " + ((r && r.error) || "ما اتحفظش"));
}, true);
chrome.storage.onChanged.addListener((c) => { if ((c.waQual || c.waQualQ || c.qualCfg) && state.view === "leads") { clearTimeout(qualFetch._t); qualFetch._t = setTimeout(() => qualFetch(true), 600); } });

// ================= 🏷 البايعين المحتملين =================
const SKINDS = { all: "الكل", sure: "✅ كتب «أنا المالك»", owner: "✅ صافي", unsure: "🟠 مشتبه", brokers: "🏢🤝 كل المكاتب والسماسرة", office: "🏢 مكاتب", broker: "🤝 سماسرة", middleman: "🔀 وسطاء" };
const sKindOk = (S, k) => k === "all" ? true : k === "sure" ? S.band === "sure-owner" : k === "owner" ? clsOfS(S) === "pure" : k === "unsure" ? clsOfS(S) === "suspect" : k === "brokers" ? ["office", "broker"].includes(clsOfS(S)) : clsOfS(S) === k;
// 🧭 بادج دور البايع: مالك مؤكد / غالبًا مالك / مالك ولا وسيط؟ / سمسار / مكتب / وسيط (والسبب في التلميح)
function roleBadge(S) {
  if (!S) return "";
  if (S.side === "buyer") return buyerBadge(S);
  if (!S.band || typeof ROLE === "undefined") return S.owner ? `<span class="badge b-owner">مالك</span>` : S.isBroker ? `<span class="badge b-cat">سمسار</span>` : "";
  const warns = (S.rneg || []).filter((t) => /^⚠/.test(t)), b = ROLE.sellerBadge(S);
  const why = [...warns, ...(S.rwhy || []).slice(0, 3), ...(S.rneg || []).filter((t) => !/^⚠/.test(t)).slice(0, 2)].join(" • ");
  return `<span class="badge ${b.cls} rb" data-band="${S.band}" title="${esc(why)}">${b.ic} ${esc(b.t)}${warns.length ? " ⚠" : ""}</span>`;
}
function buyerBadge(L) {
  if (!L || !L.brole || typeof ROLE === "undefined") return "";
  const b = ROLE.buyerBadge(L), why = [...(L.bwhy || []).slice(0, 3), ...(L.bneg || []).slice(0, 2)].join(" • ");
  return `<span class="badge ${b.cls} rb" data-brole="${L.brole}" title="${esc(why)}">${b.ic} ${esc(b.t)}</span>` + (L.brole !== "broker" && !L.breal && (L.brflags || []).length ? `<span class="badge b-warn rb" title="${esc("شبهات: " + L.brflags.join(" • "))}">⚠ ${esc(L.brflags[0])}</span>` : "");
}
// 🧭 «ليه اتصنّف كده؟» + قايمة التعديل اليدوي (بايع)
function roleExplain(S) {
  if (!S.band) return "";
  const chips = [...(S.rwhy || []).map((w) => `<span class="why-c">✔ ${esc(w)}</span>`), ...(S.rneg || []).map((w) => `<span class="why-c warn">✖ ${esc(w)}</span>`)].join("");
  const man = (leadMeta[S.key] || {}).role || "";
  return `<details class="role-why"><summary>🧭 ليه اتصنّف كده؟ <small>${S.rsure ? "(مؤكد)" : `(مالك ${S.rp}% · وسيط ${100 - S.rp}%)`}</small></summary>
      <div class="whys">${chips || `<span class="muted">مفيش إشارات واضحة</span>`}</div>
      ${S.rconf ? `<div class="muted">⚠ ${esc(S.rconf)}</div>` : ""}
      <div class="role-ask muted">اتأكد منه: <button class="btn sm" data-askowner="${esc(S.key)}">❓ ابعتله «حضرتك المالك؟»</button></div></details>
    <select class="role-sel" data-srole title="صنّفه بنفسك — التعديل بيكسب على التصنيف التلقائي" aria-label="صنّف البايع">
      <option value="">🧭 ${S.rsrc === "manual" ? "رجّعه تلقائي" : "تصنيف تلقائي"}</option>
      ${Object.entries(ROLE.ROLES).map(([k, v]) => `<option value="${k}" ${man === k ? "selected" : ""}>${ROLE.ROLE_ICON[k]} ${v}</option>`).join("")}
    </select>`;
}
function buyerExplain(L) {
  if (!L.brole) return "";
  const chips = [...(L.bwhy || []).map((w) => `<span class="why-c">✔ ${esc(w)}</span>`), ...(L.bneg || []).map((w) => `<span class="why-c warn">✖ ${esc(w)}</span>`)].join("");
  const man = (leadMeta[L.key] || {}).brole || "";
  return `<details class="role-why"><summary>🧭 ليه اتصنّف كده؟ <small>${L.bsure ? "(مؤكد)" : `(مشتري ${L.bp}%)`}</small></summary>
      <div class="whys">${chips || `<span class="muted">مفيش إشارات واضحة</span>`}</div>
      ${L.bconf ? `<div class="muted">⚠ ${esc(L.bconf)}</div>` : ""}</details>
    <select class="role-sel" data-brole title="صنّفه بنفسك — التعديل بيكسب على التصنيف التلقائي" aria-label="صنّف المشتري">
      <option value="">🧭 ${L.bsrc === "manual" ? "رجّعه تلقائي" : "تصنيف تلقائي"}</option>
      <option value="buyer" ${man === "buyer" ? "selected" : ""}>✅ مشتري مؤكد</option>
      <option value="broker" ${man === "broker" ? "selected" : ""}>🤝 وسيط/سمسار</option>
      <option value="not" ${man === "not" ? "selected" : ""}>🚫 مش مشتري</option>
    </select>`;
}
// ✏️ مقارنة تصنيفاتك اليدوية بالتقدير التلقائي — عشان تعرف تثق فيه قد إيه
function calibHtml(list, manKey, isMine, auto) {
  const man = list.filter((x) => x[manKey] === "manual");
  if (man.length < 3) return "";
  const ok = man.filter((x) => isMine(x) === (auto(x) >= 50)).length;
  return `✏️ صنّفت <b>${man.length}</b> بإيدك — التقدير التلقائي وافقك في <b>${ok}</b> منهم (${Math.round((ok / man.length) * 100)}%)`;
}
const BKINDS = { all: "الكل", real: "💎 مشتري نهائي حقيقي", trader: "🏢 تاجر / مكتب بيطلب", swap: "🔄 بيبيع وبيشتري", sure: "✅ مشتري مؤكد", likely: "🟢 غالبًا مشتري", maybe: "🟡 محتمل", curious: "⚪ فضولي", broker: "🤝 وسطاء بعملاء", not: "🚫 استبعدتهم (مش مشتري)" };
const bKindOk = (L, k) => k === "all" ? true : k === "real" ? L.bcat === "real" : k === "trader" ? L.bcat === "trader" : k === "swap" ? L.bcat === "swap" : k === "sure" ? L.brole === "buyer" : k === "broker" ? L.brole === "broker" : L.brole === k;
function sellerFiltered(ign = {}) {
  const q = qNorm(state.sq);
  return sellers.filter((S) => S.status !== "hidden" &&
    (ign.cat || state.sCat === "all" || S.categories.includes(state.sCat)) &&
    (ign.kind || sKindOk(S, state.sKind)) &&
    (ign.cls || state.sCls === "all" || clsOfS(S) === state.sCls) &&
    (!state.sRegion || (state.sRegion.startsWith("z:") ? S.zones.includes(state.sRegion.slice(2)) : S.regions.includes(state.sRegion))) &&
    (!state.sOnlyArea || unitInAreaAny(S)) && (!state.sPhone || S.phones.length) && (!state.sPriced || S.priceRange) &&
    (!state.sWithBuyers || (buyersBySeller.get(S.key) || []).some((x) => x.score >= 70)) &&
    (!state.sDays || S.last >= Date.now() - state.sDays * 864e5) &&
    (!q || qOK(q, S.names.join(" ") + " " + S.phones.join(" ") + " " + S.regions.join(" ") + " " + S.units.map((u) => u.text).join(" "), S.phones, { cats: S.categories, types: ["offer"] })));
}
function renderSellers() {
  const vis = sellers.filter((S) => S.status !== "hidden" && unitInAreaAny(S));
  const d30 = Date.now() - 30 * 864e5;
  $("sKpis").innerHTML = `
    <div class="kpi"><b>${vis.filter((S) => clsOfS(S) === "pure" && S.last >= d30).length}</b><span>✅ بايعين صافيين نشطين آخر 30 يوم</span></div>
    <div class="kpi kpi-btn ${state.sKind === "sure" ? "on" : ""}" data-skind="sure" title="دوس عشان تعرض المؤكدين بس"><b>${vis.filter((S) => S.band === "sure-owner").length}</b><span>✅ كتبوا «أنا المالك / من المالك»</span></div>
    <div class="kpi kpi-btn ${state.sKind === "unsure" ? "on" : ""}" data-skind="unsure" title="دوس عشان تعرضهم بس"><b>${vis.filter((S) => clsOfS(S) === "suspect").length}</b><span>🟠 مشتبه (محتاجين تأكيد)</span></div>
    <div class="kpi"><b>${vis.reduce((n, S) => n + S.units.length, 0)}</b><span>وحدة معروضة</span></div>
    <div class="kpi"><b>${vis.filter((S) => (buyersBySeller.get(S.key) || []).some((x) => x.score >= 70)).length}</b><span>🤝 ليهم مشتري مناسب</span></div>
    <div class="kpi"><b>${vis.filter((S) => S.units.some((u) => u.kind === "comment")).length}</b><span>💬 عرضوا في تعليقات</span></div>`;
  const a = sellerFiltered({ cat: true });
  $("sCatTabs").innerHTML = tabsHtml(catsTabs(), state.sCat, "scat", (k) => k === "all" ? a.length : a.filter((S) => S.categories.includes(k)).length);
  $("sCalib").innerHTML = calibHtml(sellers, "rsrc", (S) => S.role === "owner", (S) => S.rauto == null ? 50 : S.rauto);
  $("sReal").innerHTML = realHtml("seller");
  $("sClsSign").innerHTML = clsSignHtml("seller", sellerFiltered({ cls: true }), state.sCls, "scls");
  const regs = countBy(sellers.flatMap((S) => S.regions.map((r) => ({ r }))), (x) => x.r);
  $("sRegion").innerHTML = `<option value="">📍 كل المناطق</option>` + Object.entries(PH.zones()).map(([k, v]) => `<option ${state.sRegion === "z:" + k ? "selected" : ""} value="z:${k}">${v}</option>`).join("") +
    [...regs].sort((x, y) => y[1] - x[1]).map(([r, n]) => `<option ${r === state.sRegion ? "selected" : ""} value="${esc(r)}">${esc(r)} (${n})</option>`).join("");
  if (state.sRegion && $("sRegion").value !== state.sRegion) state.sRegion = "";
  const list = sellerFiltered();
  const nb = (S) => (buyersBySeller.get(S.key) || []).length;
  const sorters = { ai: (x, y) => ((y.ai && y.ai.buyer ? y.ai.score : -1) - (x.ai && x.ai.buyer ? x.ai.score : -1)) || y.score - x.score, score: (x, y) => y.score - x.score || y.last - x.last, recent: (x, y) => y.last - x.last, units: (x, y) => y.units.length - x.units.length, buyers: (x, y) => nb(y) - nb(x) || y.score - x.score, real: (x, y) => (y.rp || 0) - (x.rp || 0) || y.score - x.score };
  list.sort(sorters[state.sSort]);
  $("sCount").textContent = `${list.length} بايع`;
  $("sList").innerHTML = list.length ? list.slice(0, state.sShown).map(sellerCard).join("")
    : `<div class="empty"><b>${sellers.length ? "مفيش حد بالفلاتر دي" : "لسه مفيش بايعين"}</b>${sellers.length ? "جرّب «أي وقت» أو شيل شوية فلاتر." : "البايعين بيطلعوا من عروض البيع اللي في الجروبات، ومن التعليقات اللي فيها «عندي شقة للبيع» وزيها. اسحب جروباتك بالتعليقات."}</div>`;
  if (window.FBID) FBID.sec("sellers", $("sList"), [{ label: "كل البايعين", items: list }]);
  $("sMore").hidden = list.length <= state.sShown;
  $("sMore").textContent = `عرض المزيد (${list.length - state.sShown} كمان)`;
}
function sellerCard(S) {
  const open = state.sOpen.has(S.key), ck = clsOfS(S), CC = typeof ROLE !== "undefined" && ROLE.CLS4 ? ROLE.CLS4[ck] : { ic: "", sell: "بائع", t: "" };
  const prof = LEADS.profileLink(S), msgr = LEADS.messengerLink(S);
  const bs = buyersBySeller.get(S.key) || [];
  const st = REPORT.stageOf(leadMeta[S.key]);
  const sCat = (S.categories && S.categories[0]) ? String(CATS[S.categories[0]] || "").replace(/^\S+\s/, "") : "";
  const sPr = S.priceRange ? (S.priceRange.min === S.priceRange.max ? PH.fmtPrice(S.priceRange.min) : "من " + PH.fmtPrice(S.priceRange.min)) : "";
  return `<article class="card lead seller-card sgn cls-${ck} ${open ? "open" : ""} st-${st}" data-skey="${esc(S.key)}" data-lkey="${esc(S.key)}">
    ${window.FBID ? FBID.chip(S) : ""}<div class="sg-plate t-offer"><b class="sg-k">${CC.ic} ${CC.sell}</b>${sCat ? `<span class="sg-c">${esc(sCat)}</span>` : ""}${sPr ? `<span class="sg-p">${sPr}</span>` : ""}<span class="sg-a">${S.units.length} وحدة · ثقة ${S.score}٪</span></div>
    <div class="ring sv${S.level}" style="--p:${S.score}"><b>${S.score}</b><small>${CC.t || "بايع"}</small></div>
    <div>
      <div class="l-name">${esc(S.name)} ${roleBadge(S)}
        ${S.superHot ? `<span class="l-lvl sell">✅ نشط ومعاه سعر</span>` : ""}${S.sources.map((x) => `<span class="badge b-${x}">${SRC1[x]}</span>`).join("")}</div>
      ${typeof ROLE !== "undefined" && ROLE.sellerBasis ? `<div class="cls-basis cls-${ck}"><b>المعيار</b><span>${esc(ROLE.sellerBasis(S))}</span></div>` : ""}
      <div class="whys">${S.why.map((w) => `<span class="why-c">✔ ${esc(w)}</span>`).join("")}</div>
      <div class="profile">
        <div class="pf-row pf-want"><span class="pf-k">🏠 عنده إيه</span><div class="pf-v">${S.units.slice(0, open ? 20 : 2).map((u) => `<div class="unit-row">
          <b>${esc(uLine(u))}</b>${u.kind === "comment" ? ` <span class="tag-c">💬 في تعليق${u.onRequest ? " على طلب" : ""}</span>` : ""}
          <div class="muted ellip">${esc((u.summary || u.text || "").replace(/\s+/g, " ").slice(0, 190))}</div>
          <div class="muted">👥 ${esc(u.group || "")} · ${relDay(u.ts)}${u.url ? ` · <a class="open-link" href="${esc(u.url)}" target="_blank">🔗 افتح المنشور</a>` : ""}${u.kind === "post" ? ` · <button class="btn sm" data-stolist="${esc(u.id)}">➕ هاتلي مشتري</button>` : ""} · ${crmBtn(u.id, S.key)}</div></div>`).join("")}
          ${S.units.length > 2 && !open ? `<button class="btn sm" data-sopen>+ ${S.units.length - 2} وحدة كمان</button>` : ""}</div></div>
        <div class="pf-row pf-ph"><span class="pf-k">📞 رقمه</span><div class="pf-v">${S.phones.length ? S.phones.map((n) => `<span class="ph big">${esc(n)}<a href="${PH.waLink(n)}" target="_blank">💬 واتساب</a><button data-copy="${esc(n)}">📋</button></span>`).join(" ")
          : prof ? `<div class="noph"><a class="btn sm primary" href="${esc(prof)}" target="_blank">👤 افتح بروفايله</a>${msgr ? `<a class="btn sm" href="${esc(msgr)}" target="_blank">✉️ ابعتله رسالة</a>` : ""}<button class="btn sm" data-copy="${esc(prof)}">📋 انسخ اللينك</button></div>` : `<span class="muted">مسابش رقم — رد عليه على البوست</span>`}</div></div>
        ${S.priceRange ? `<div class="pf-row pf-bud"><span class="pf-k">💰 الأسعار</span><div class="pf-v"><b>${S.priceRange.min === S.priceRange.max ? PH.fmtPrice(S.priceRange.min) : PH.fmtPrice(S.priceRange.min) + " – " + PH.fmtPrice(S.priceRange.max)}</b></div></div>` : ""}
        <div class="pf-row pf-match"><span class="pf-k">🤝 مشترين مناسبين</span><div class="pf-v">${bs.length ? bs.slice(0, open ? 10 : 3).map((x) => pairMini(x, "buyer")).join("") + (bs.length > 3 && !open ? `<button class="btn sm" data-sopen>+ ${bs.length - 3} مشتري كمان</button>` : "") : `<span class="muted">لسه مفيش مشتري مناسب للوحدات دي</span>`}</div></div>
        <div class="pf-row pf-last"><span class="pf-k">🕒 آخر نشاط</span><div class="pf-v">${relDay(S.last)}</div></div>
      </div>
      <div class="pipe">
        ${roleExplain(S)}
        <select data-lstage title="المرحلة">${Object.entries(REPORT.STAGES).map(([k, v]) => `<option value="${k}" ${k === st ? "selected" : ""}>${v}</option>`).join("")}</select>
        <input class="note" data-lnote value="${esc((leadMeta[S.key] || {}).note || "")}" placeholder="📝 ملاحظة (مثلاً: المالك موافق على عمولة 2.5%)">
        <button class="btn sm" data-sopen>${open ? "▲ أقل" : "⋯ التفاصيل"}</button>
        <button class="btn sm danger" data-shide title="مش بايع — اخفيه">🙈</button>
      </div>
    </div>
  </article>`;
}

// ================= 💬 تعليقات بوست بلينكه (أداة صغيرة جوه الطلبات والعروض) =================
function renderPostTool() {
  const el = $("postTool"); if (!el) return;
  $("postJobMsg").textContent = postJob ? (postJob.result ? `✅ آخر سحب: ${postJob.result.people} معلّق من «${postJob.result.author}»` : "⏳ بيسحب في تاب البوست...") : "";
  const posts = Object.values(adPosts).sort((x, y) => y.scrapedAt - x.scrapedAt);
  $("postToolN").textContent = posts.length ? posts.length + " بوست" : "";
  if (!el.open) { $("postToolBody").innerHTML = ""; return; }
  $("postToolBody").innerHTML = posts.length ? `<div class="list">${posts.map((p) => {
      const open = state.open.has("ap:" + p.key);
      return `<article class="card" data-apkey="${esc(p.key)}">
        <div class="c-top"><b>💬 ${esc(p.author || "بوست")}</b><span class="badge b-cat">${p.people.length} معلّق</span><span class="when">${relDay(p.scrapedAt)}</span></div>
        <div class="text">${esc((p.text || "").slice(0, 300))}</div>
        <div class="c-bot"><a class="open-link" href="${esc(p.url)}" target="_blank">🔗 افتح البوست</a><span class="acts">
          <button class="btn sm" data-aptoggle>${open ? "▲ اخفي المعلّقين" : "👥 اعرض المعلّقين"}</button><button class="btn sm primary" data-apcsv>⬇️ المعلّقين Excel</button><button class="btn sm" data-aprerun>🔄 اسحب تاني</button></span></div>
        ${open ? `<div class="tbl-wrap"><table class="learn-t"><tr><th>الاسم</th><th>ID / اليوزر</th><th>التعليق</th><th></th></tr>${p.people.map((c) => {
          const it = c.text ? PH.interest(c.text, compiledG) : { w: 0, tags: [] };
          return `<tr><td><b>${esc(c.name)}</b>${c.reply ? ' <span class="tag-c">رد</span>' : ""}</td><td class="ltr">${esc(c.uid || "—")}</td><td>${esc((c.text || "—").slice(0, 160))}${it.w >= 25 ? ` <span class="chip hot">🔥 ${esc(it.tags.join("، "))}</span>` : ""}</td>
            <td>${c.profileUrl ? `<a class="btn sm" href="${esc(c.profileUrl)}" target="_blank">👤</a>` : ""}</td></tr>`; }).join("")}</table></div>` : ""}
      </article>`; }).join("")}</div>` : `<div class="empty"><b>لسه ما سحبتش تعليقات بوست</b>حط لينك أي بوست فوق ودوس «💬 افتحه واسحب التعليقات».</div>`;
}
function adPostCsv(p) {
  const q = csvQ;
  const rows = [["الاسم", "ID / اليوزر", "لينك البروفايل", "التعليق", "رد؟", "مهتم؟", "البوست"].join(",")]
    .concat(p.people.map((c) => { const it = c.text ? PH.interest(c.text, compiledG) : { w: 0, tags: [] }; return [c.name, c.uid ? "'" + c.uid : "", c.profileUrl, c.text, c.reply ? "رد" : "", it.w >= 25 ? it.tags.join(" · ") || "مهتم" : "", p.url].map(q).join(","); }));
  download(`معلّقين_${(p.author || "بوست").replace(/[\\/:*?"<>|\s]+/g, "-").slice(0, 40)}_${new Date().toISOString().slice(0, 10)}.csv`, "﻿" + rows.join("\r\n"), "text/csv;charset=utf-8");
}

// ================= 📍 إعدادات المنطقة =================
function fillArea() {
  const gov = PH.govOf(settings);
  $("govSel").innerHTML = PH.GOV_NAMES.map((g) => `<option ${g === gov ? "selected" : ""}>${g}</option>`).join("");
  const focus = (settings && settings.focus) || [];
  $("focusMode").value = focus.length ? "pick" : "all";
  $("strictFocus").checked = !!(settings && settings.strictFocus);
  $("extractFocus").checked = !!(settings && settings.extractFocus);
  renderFocusBox(focus);
}
function regionNamesFromText() { return $("k-regions").value.split("\n").map((l) => l.split("=")[0].trim()).filter(Boolean); }
function renderFocusBox(focus) {
  const pick = $("focusMode").value === "pick";
  $("focusBox").hidden = !pick; $("strictBox").hidden = !pick;
  if (!pick) return;
  const counts = countBy(items, (p) => p.region);
  const ordered = ["الحي السابع", "الحي الثامن", "الحي العاشر", "شمال العاشر", "الحي الحادي عشر", "الحي الثاني عشر", "الحي الثالث عشر", "مسلسل 3", "مسلسل 4"];
  const names = [...new Set([...focus, ...(PH.govOf(settings) === "بني سويف" ? ordered : []), ...regionNamesFromText(), ...[...counts.keys()].filter((r) => /^(الحي |المجاورة|مسلسل)/.test(r))])];
  $("focusBox").innerHTML = names.map((n) => `<label class="fchip"><input type="checkbox" value="${esc(n)}" ${focus.includes(n) ? "checked" : ""}> ${esc(n)} <small>${counts.get(n) || 0}</small></label>`).join("");
}

// ================= الإحصائيات =================
function hbars(rows, opts = {}) {
  if (!rows.length) return `<div class="muted">مفيش بيانات كفاية لسه</div>`;
  const max = Math.max(...rows.map((r) => (r.a || 0) + (r.b || 0)));
  return `<div class="hbars">${rows.map((r) => `<div class="hb"><span class="lbl" title="${esc(r.label)}">${esc(r.label)}</span>
    <span class="trk">${r.b != null
      ? `<span class="f req" style="width:${(r.a / max) * 100}%"></span><span class="f off" style="width:${(r.b / max) * 100}%"></span>`
      : `<span class="f one" style="width:${(r.a / max) * 100}%"></span>`}</span>
    <span class="val">${r.val ?? (r.b != null ? `${r.a} طلب · ${r.b} عرض` : r.a)}</span></div>`).join("")}</div>`;
}
const legend = `<div class="legend"><span><i style="background:var(--bar-req)"></i>طلبات</span><span><i style="background:var(--bar-off)"></i>عروض</span></div>`;
const panel = (title, sub, body) => `<div class="panel"><h3>${title}</h3>${sub ? `<div class="sub">${sub}</div>` : ""}${body}</div>`;

function renderStats() {
  renderGuide();
  const its = items.filter((p) => state.sSrc === "all" || p.srcs.includes(state.sSrc));
  $("sSrcTabs").innerHTML = tabsHtml(SRCS, state.sSrc, "ssrc", (k) => k === "all" ? items.length : items.filter((p) => p.srcs.includes(k)).length);
  if (!its.length) { $("statsGrid").innerHTML = `<div class="empty"><b>لسه مفيش بيانات</b>اسحب جروبات الأول.</div>`; return; }
  const req = its.filter((p) => p.type === "request"), off = its.filter((p) => p.type === "offer");

  // KPIs
  const aptPpm = off.filter((p) => p.category === "apartment").map(PH.ppm).filter(Boolean);
  const reqBudget = req.filter((p) => p.category === "apartment" && p.price).map((p) => p.price);
  const topRegion = [...countBy(req, (p) => p.region)].sort((a, b) => b[1] - a[1])[0];
  const kpis = `<div class="kpis" style="grid-column:1/-1">
    <div class="kpi"><b>${req.length}</b><span>طلب</span></div>
    <div class="kpi"><b>${off.length}</b><span>عرض</span></div>
    <div class="kpi"><b>${off.length ? (req.length / off.length).toFixed(2) : "—"}</b><span>طلب لكل عرض</span></div>
    <div class="kpi"><b>${aptPpm.length >= 2 ? fmtN(median(aptPpm)) : "—"}</b><span>متوسط سعر متر الشقق (ج)</span></div>
    <div class="kpi"><b>${reqBudget.length >= 2 ? PH.fmtPrice(median(reqBudget)) : "—"}</b><span>متوسط ميزانية طالبي الشقق</span></div>
    <div class="kpi"><b style="font-size:17px">${topRegion ? esc(topRegion[0]) : "—"}</b><span>أكتر منطقة عليها طلب</span></div>
  </div>`;

  // المناطق
  const regs = new Map();
  for (const p of its) if (p.region) { const r = regs.get(p.region) || { a: 0, b: 0 }; p.type === "request" ? r.a++ : r.b++; regs.set(p.region, r); }
  const regRows = [...regs].map(([label, v]) => ({ label, ...v })).sort((x, y) => y.a - x.a || y.b - x.b).slice(0, 12);
  const noReg = its.filter((p) => !p.region).length;

  // سعر المتر حسب المنطقة
  const ppmRows = (cat) => {
    const m = new Map();
    for (const p of off) if (p.category === cat && p.region) { const v = PH.ppm(p); if (v) { if (!m.has(p.region)) m.set(p.region, []); m.get(p.region).push(v); } }
    return [...m].filter(([, a]) => a.length >= 2).map(([label, a]) => ({ label, a: median(a), val: `${fmtN(median(a))} ج/م² · ${a.length} عرض` }))
      .sort((x, y) => y.a - x.a).slice(0, 12);
  };

  // النوع: طلب مقابل عرض
  const catRows = ["apartment", "land", "villa", "other"].map((k) => ({ label: CAT1[k], a: req.filter((p) => p.category === k).length, b: off.filter((p) => p.category === k).length }))
    .filter((r) => r.a + r.b);

  // ميزانيات طالبي الشقق (بيع)
  const brackets = [[0, 5e5, "أقل من 500 ألف"], [5e5, 1e6, "500 ألف – مليون"], [1e6, 1.5e6, "مليون – 1.5"], [1.5e6, 2e6, "1.5 – 2 مليون"], [2e6, 3e6, "2 – 3 مليون"], [3e6, Infinity, "أكتر من 3 مليون"]];
  const budRows = brackets.map(([lo, hi, label]) => ({ label, a: reqBudget.filter((v) => v >= lo && v < hi).length })).filter((r) => r.a);

  // الغرف المطلوبة
  const roomRows = [1, 2, 3, 4].map((n) => ({ label: n === 4 ? "4 غرف أو أكتر" : `${n} ${n === 1 ? "غرفة" : "غرف"}`, a: req.filter((p) => n === 4 ? p.rooms >= 4 : p.rooms === n).length })).filter((r) => r.a);

  // الجروبات والناشرين
  const grpRows = [...countBy(its.flatMap((p) => p.groups.map((g) => ({ g }))), (x) => x.g)].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, a]) => ({ label, a }));
  const senders = new Map();
  for (const p of its) if (p.sender) { const s = senders.get(p.sender) || { a: 0, broker: false }; s.a++; if (p.isBroker) s.broker = true; senders.set(p.sender, s); }
  const sndRows = [...senders].sort((a, b) => b[1].a - a[1].a).slice(0, 10).map(([label, v]) => ({ label: label + (v.broker ? " · سمسار" : ""), a: v.a, val: `${v.a} بوست` }));

  // آخر 14 يوم
  const days = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 13; i >= 0; i--) { const d = new Date(today); d.setDate(d.getDate() - i); days.push({ d, a: 0, b: 0 }); }
  for (const p of its) {
    const t = new Date(tOf(p)); t.setHours(0, 0, 0, 0);
    const idx = Math.round((t - days[0].d) / 864e5);
    if (idx >= 0 && idx < 14) p.type === "request" ? days[idx].a++ : days[idx].b++;
  }
  const dmax = Math.max(1, ...days.map((d) => d.a + d.b));
  const dayChart = `${legend}<div class="cols">${days.map((d) => `<div class="col" title="${d.d.toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "short" })}: ${d.a} طلب · ${d.b} عرض">
      <span class="s req" style="height:${(d.a / dmax) * 100}%"></span><span class="s off" style="height:${(d.b / dmax) * 100}%"></span></div>`).join("")}</div>
    <div class="col-l">${days.map((d, i) => `<span>${i % 2 ? "" : d.d.getDate()}</span>`).join("")}</div>`;

  $("statsGrid").innerHTML = kpis +
    panel("📍 أكتر المناطق عليها طلب", noReg ? `${noReg} بوست من غير منطقة واضحة` : "", legend + hbars(regRows)) +
    panel("🏢 متوسط سعر متر الشقق (بيع)", "من عروض البيع اللي فيها سعر ومساحة — منطقة فيها عرضين على الأقل", hbars(ppmRows("apartment"))) +
    panel("🌾 متوسط سعر متر الأراضي (بيع)", "الفدان محسوب 4200 م² والقيراط 175 م²", hbars(ppmRows("land"))) +
    panel("⚖️ الطلب مقابل العرض حسب النوع", "", legend + hbars(catRows)) +
    panel("💰 ميزانيات طالبي الشقق (شراء)", "", hbars(budRows)) +
    panel("🛏 عدد الغرف المطلوب", "", hbars(roomRows)) +
    panel("📅 النشاط آخر 14 يوم", "بتاريخ الرسالة في واتساب، وبتاريخ السحب في فيسبوك", dayChart) +
    panel("👥 أنشط الجروبات", "", hbars(grpRows)) +
    panel("🗣 أنشط الناشرين", "غالبًا دول السماسرة والمكاتب — فرصة شراكة أو منافسة", hbars(sndRows));
}

// ================= العملاء المهتمين =================
const LVLS = { 4: "💎 مهتم جدًا (آخر 30 يوم)", 3: "🔥🔥🔥 جاهزين يشتروا", 2: "🔥🔥 مهتمين جدًا وأكتر", 1: "🔥 مهتمين وأكتر", 0: "الكل" };
function leadFiltered(ign = {}) {
  const q = qNorm(state.lq);
  return leads.filter((L) =>
    (state.lBrokers || ign.kind || ign.cls || state.lCls !== "all" || state.lKind === "broker" || state.lKind === "not" || (!L.isBroker && !L.notBuyer)) && // اللي صنّفته «وسيط/مش مشتري» بإيدك لازم يفضل ليه رجوع (تاب «وسطاء»/«استبعدتهم»)
    (ign.kind || bKindOk(L, state.lKind)) &&
    (ign.cls || state.lCls === "all" || clsOfL(L) === state.lCls) &&
    (ign.cat || state.lCat === "all" || L.categories.includes(state.lCat)) &&
    (ign.lvl || (state.lLvl === 4 ? L.superHot : L.level >= state.lLvl)) &&
    (!state.lMoney || (state.lMoney === "rich" ? L.rich : state.lMoney === "high" ? L.tier && L.tier.idx === 3 : state.lMoney === "known" ? !!L.tier : !L.tier)) &&
    (!state.lRegion || (state.lRegion.startsWith("z:") ? L.zones.includes(state.lRegion.slice(2)) : L.regions.includes(state.lRegion))) &&
    (!state.lOnlyBS || leadInArea(L)) &&
    (!state.lSrc || L.sources.includes(state.lSrc)) &&
    (!state.lMultiPost || L.posts >= 2) && (!state.lMulti3 || L.posts >= 3) && (!state.lAiOnly || (L.ai && L.ai.buyer)) && (!state.lMultiGroup || L.groupsCount >= 2) &&
    (!state.lPhone || L.phones.length) &&
    (L.status !== "hidden") && stageOk(L) &&
    (!state.lDays || L.last >= Date.now() - state.lDays * 864e5) &&
    (!state.lOwner || (state.lOwner === "-" ? !(leadMeta[L.key] || {}).owner : (leadMeta[L.key] || {}).owner === state.lOwner)) &&
    (!q || qOK(q, L.names.join(" ") + " " + L.phones.join(" ") + " " + L.regions.join(" ") + " " + L.acts.map((a) => a.text).join(" "), L.phones, { cats: L.categories, types: ["request"] })));
}
const stageOf = (L) => REPORT.stageOf(leadMeta[L.key] || (L.status ? { status: L.status } : null));
const isDue = (L) => { const m = leadMeta[L.key]; return !!(m && m.nextAt && m.nextAt <= REPORT.endOfToday() && !["won", "lost"].includes(stageOf(L)) && m.status !== "hidden"); };
function stageOk(L) {
  const st = stageOf(L);
  if (state.lStage === "all") return true;
  if (state.lStage === "active") return !["won", "lost"].includes(st);
  if (state.lStage === "due") return isDue(L);
  return st === state.lStage;
}
function renderLeads() {
  $("lOwner").innerHTML = `<option value="">👤 كل الفريق</option><option value="-" ${state.lOwner === "-" ? "selected" : ""}>مش متوزع</option>` +
    team.map((t) => `<option ${state.lOwner === t ? "selected" : ""} value="${esc(t)}">👤 ${esc(t)}</option>`).join("");
  $("lOwner").hidden = !team.length;
  if (state.lOwner && $("lOwner").value !== state.lOwner) state.lOwner = ""; // عضو اتحذف من الفريق: الفلتر القديم كان شغال والـselect بيعرض «الكل» (عدّاد 0 شخص)
  const vis = leads.filter((L) => !L.isBroker && L.status !== "hidden");
  const cnt = (l) => vis.filter((L) => L.level === l).length;
  renderAiBar(vis);
  $("leadKpis").innerHTML = `
    <div class="kpi kpi-hot"><b>${vis.filter((L) => L.superHot).length}</b><span>💎 مهتم جدًا (آخر 30 يوم)</span></div>
    <div class="kpi kpi-btn ${state.lKind === "real" ? "on" : ""}" data-lkind="real" title="مؤكد أو قوي جدًا، من غير أي شبهة سمسرة، ونشط، وعنده نية فعلية — دوس عشان تعرضهم بس"><b>${vis.filter((L) => L.breal).length}</b><span>💎 مشتري نهائي حقيقي</span></div>
    <div class="kpi kpi-btn ${state.lKind === "sure" ? "on" : ""}" data-lkind="sure" title="دوس عشان تعرض المؤكدين بس"><b>${vis.filter((L) => L.brole === "buyer").length}</b><span>✅ قالوا «أنا المشتري / شاري / تفاصيل للشراء»</span></div>
    <div class="kpi"><b>${vis.filter((L) => L.rich).length}</b><span>💰 معاهم فلوس (ميزانية كويسة/عالية)</span></div>
    <div class="kpi"><b>${cnt(3)}</b><span>🔥🔥🔥 جاهزين يشتروا</span></div>
    <div class="kpi"><b>${cnt(2)}</b><span>🔥🔥 مهتمين جدًا</span></div>
    <div class="kpi"><b>${cnt(1)}</b><span>🔥 مهتمين</span></div>
    <div class="kpi kpi-btn ${state.lMulti3 ? "on" : ""}" data-lmulti3 title="دوس عشان تعرضهم بس"><b>${vis.filter((L) => L.posts >= 3).length}</b><span>🔁 متفاعلين في 3+ بوستات</span></div>
    <div class="kpi kpi-btn ${state.lAiOnly ? "on" : ""}" data-laionly title="دوس عشان تعرضهم بس"><b>${vis.filter((L) => L.ai && L.ai.buyer).length}</b><span>🧠 مشتري جاد (رأي الذكاء الاصطناعي)</span></div>
    <div class="kpi"><b>${vis.filter((L) => L.groupsCount >= 2).length}</b><span>مكررين في كذا جروب</span></div>
    <div class="kpi"><b>${vis.filter((L) => (sellersByBuyer.get(L.key) || []).some((x) => x.score >= 70)).length}</b><span>🤝 ليهم بايع مناسب</span></div>
`;
  const a = leadFiltered({ cat: true });
  $("lCatTabs").innerHTML = tabsHtml(catsTabs(), state.lCat, "lcat", (k) => k === "all" ? a.length : a.filter((L) => L.categories.includes(k)).length);
  $("lCalib").innerHTML = calibHtml(leads, "bsrc", (L) => L.brole === "buyer", (L) => L.bauto == null ? 50 : L.bauto);
  $("lReal").innerHTML = realHtml("buyer");
  { const ql = $("lQual"); if (ql) { ql.innerHTML = qualHtml(); qualFetch(); } }
  const bk = leadFiltered({ kind: true });
  { const all0 = leadFiltered({ cls: true }), hid = all0.filter((L) => L.isBroker || L.notBuyer).length; // اللي صنّفته وسيط/مستبعد بإيدك مخفيين من «الكل»
    $("lClsSign").innerHTML = clsSignHtml("buyer", all0, state.lCls, "lcls", hid && !state.lBrokers && state.lCls === "all" ? hid + " منهم مخفيين لأنك صنّفتهم وسيط/مستبعد بإيدك — دوس «سمسار» أو «مستبعد» تشوفهم" : ""); }
  $("lKindTabs").innerHTML = tabsHtml(BKINDS, state.lKind, "lkind", (k) => bk.filter((L) => (k === "broker" || k === "not" || state.lBrokers || (!L.isBroker && !L.notBuyer)) && bKindOk(L, k)).length);
  const b = leadFiltered({ lvl: true });
  $("lLvlTabs").innerHTML = [4, 3, 2, 1, 0].map((l) => `<button class="tab ${state.lLvl === l ? "on" : ""} ${l === 4 ? "tab-hot" : ""}" data-llvl="${l}">${LVLS[l]}<small>${b.filter((L) => (l === 4 ? L.superHot : L.level >= l)).length}</small></button>`).join("");
  $("lMoney").value = state.lMoney;
  const regs = countBy(leads.flatMap((L) => L.regions.map((r) => ({ r }))), (x) => x.r);
  $("lRegion").innerHTML = `<option value="">📍 كل المناطق</option>` +
    Object.entries(PH.zones()).map(([k, v]) => `<option ${state.lRegion === "z:" + k ? "selected" : ""} value="z:${k}">${v}</option>`).join("") + [...regs].sort((x, y) => y[1] - x[1]).map(([r, n]) => `<option ${r === state.lRegion ? "selected" : ""} value="${esc(r)}">${esc(r)} (${n})</option>`).join("");
  if (state.lRegion && $("lRegion").value !== state.lRegion) state.lRegion = ""; // منطقة اختفت من الداتا ← نشيل الفلتر بدل ما يفضل شغال مستخبي

  const list = leadFiltered();
  const sorters = { ai: (x, y) => ((y.ai && y.ai.buyer ? y.ai.score : -1) - (x.ai && x.ai.buyer ? x.ai.score : -1)) || y.score - x.score, score: (x, y) => y.score - x.score || y.last - x.last, recent: (x, y) => y.last - x.last, posts: (x, y) => y.posts - x.posts || y.score - x.score, real: (x, y) => (y.bp || 0) - (x.bp || 0) || y.score - x.score };
  list.sort(sorters[state.lSort]);
  $("lCount").textContent = `${list.length} شخص`;
  if (!leads.length) $("lList").innerHTML = `<div class="empty"><b>لسه مفيش عملاء</b>اسحب جروباتك تاني، والمرة دي هيتسحب معاها التعليقات في فيسبوك والردود في واتساب. في لوحة 🏠 على فيسبوك اختار «💬 يفتح كل عرض ويسحب كل تعليقاته» عشان تطلع أكبر عدد.</div>`;
  else if (!list.length) $("lList").innerHTML = state.lLvl === 4
    ? `<div class="empty"><b>مفيش عملاء «مهتم جدًا» لسه</b>دول اللي نزّلوا طلب بنفسهم آخر 30 يوم، أو اتفاعلوا في 4 بوستات أو أكتر (أو 3 ومعاهم كلام قوي زي «معاينة» أو «معايا كاش»). اسحب جروبات أكتر بالتعليقات، أو شوف تبويب «🔥🔥🔥 جاهزين».</div>`
    : `<div class="empty"><b>مفيش حد بالفلاتر دي</b>جرّب «🔥 مهتمين وأكتر» أو شيل شوية فلاتر.</div>`;
  else $("lList").innerHTML = list.slice(0, state.lShown).map(leadCard).join("");
  if (window.FBID) FBID.sec("buyers", $("lList"), [{ label: "كل المشترين", items: list }]);
  $("lMore").hidden = list.length <= state.lShown;
  $("lMore").textContent = `عرض المزيد (${list.length - state.lShown} كمان)`;
}
// 🎯 سطر التأهيل في كارت المشتري: رده على واتساب + «اتعاين فعلًا» + «اسأله دلوقتي»
function qualLine(L) {
  if (typeof QUAL === "undefined") return "";
  const q = L.qual, s = q && q.s;
  if (s && s !== "asked") {
    const t = Q_ST[s] || ["🎯", s], yes = /^(buyer|self|later)$/.test(s), ph = /^\d{10,15}$/.test(q.phone || "") ? q.phone : "";
    return `<div class="q-line"><span class="chip i" title="رده على سؤال التأهيل في واتساب">🎯 ${t[0]} ${esc(t[1])}</span>${q.when || q.note ? ` <span class="muted">«${esc(String(q.when || q.note).slice(0, 80))}»</span>` : ""}
      ${yes ? `<button class="btn sm" data-qmark="seen" data-qkey="${esc(L.key)}" data-qphone="${esc(ph)}" title="لما تقابله وتتأكد إنه فعلًا عاين">✔ اتعاين فعلًا</button><button class="btn sm" data-qmark="noshow" data-qkey="${esc(L.key)}" data-qphone="${esc(ph)}">✖ ما حضرش</button>` : ""}
      ${s === "seen" || s === "noshow" ? `<button class="btn sm" data-qmark="reset" data-qkey="${esc(L.key)}" data-qphone="${esc(ph)}">↺ رجّعه</button>` : ""}</div>`;
  }
  if (s === "asked") return `<div class="q-line"><span class="chip i">🎯 ⏳ اتسأل على واتساب — مستني رده</span></div>`;
  const num = QUAL.phoneOf(L);
  if (num && (L.btier === "suspect" || L.btier === "pure") && L.status !== "hidden") return `<div class="q-line"><button class="btn sm" data-qask="${esc(L.key)}" title="يضيفه لطابور سؤال «إنت المشتري؟» على واتساب (بيتبعت لما تشغّل التأهيل)">🎯 اسأله «إنت المشتري؟»</button></div>`;
  return "";
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest && e.target.closest("[data-qask]"); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  const L = (FULL.leads || leads).find((x) => x.key === b.dataset.qask); if (!L) return;
  const num = QUAL.phoneOf(L), pr = (sellersByBuyer.get(L.key) || [])[0];
  if (!num) return toast("مفيش رقم واتساب للشخص ده");
  const r = await qSend({ type: "qualEnqueue", items: [{ num, k: L.key, nm: L.name || "", tid: QUAL.tidFor(L.category), unit: pr && pr.u ? QUAL.unitLine(pr.u) : "", uid: pr && pr.u ? pr.u.id : "" }] });
  toast(r && r.ok ? "🎯 اتضاف لطابور التأهيل — هيتبعتله لما تشغّل التأهيل" : "⚠ " + ((r && r.error) || "ما اتضافش")); qualFetch(true);
}, true);
function leadCard(L) {
  const ck = clsOfL(L), CC = typeof ROLE !== "undefined" && ROLE.CLS4 ? ROLE.CLS4[ck] : { ic: "", buy: "مشتري", t: "" };
  const prof = LEADS.profileLink(L), msgr = LEADS.messengerLink(L);
  const open = state.lOpen.has(L.key);
  const st = stageOf(L), meta = leadMeta[L.key] || {};
  const lAct = [...(L.acts || [])].sort((a, b) => (b.ts || 0) - (a.ts || 0)).find((a) => a.postUrl || a.commentUrl), lUrl = lAct ? (lAct.postUrl || lAct.commentUrl) : "";
  const lCat = (L.categories && L.categories[0]) ? String(CATS[L.categories[0]] || "").replace(/^\S+\s/, "") : "";
  const lBud = L.range ? (L.range.min === L.range.max ? PH.fmtPrice(L.range.min) : "حتى " + PH.fmtPrice(L.range.max)) : "";
  return `<article class="card lead sgn cls-${ck} ${open ? "open" : ""} st-${st} ${isDue(L) ? "due" : ""}" data-lkey="${esc(L.key)}">
    ${window.FBID ? FBID.chip(L) : ""}<div class="sg-plate t-request"><b class="sg-k">${CC.ic} ${CC.buy}</b>${lCat ? `<span class="sg-c">${esc(lCat)}</span>` : ""}${lBud ? `<span class="sg-p">${lBud}</span>` : ""}<span class="sg-a">اهتمام ${L.score}٪ ${LEADS.fires(L.level)}</span></div>
    <div class="ring lv${L.level}" style="--p:${L.score}"><b>${L.score}</b><small>${LEADS.fires(L.level)}</small></div>
    <div>
      <div class="l-name">${L.status === "star" ? `<span class="star">⭐</span>` : ""}${esc(L.name)}
        ${L.superHot ? `<span class="l-lvl super">💎 مهتم جدًا</span>` : `<span class="l-lvl">${LEADS.levelName(L.level)}</span>`}
        ${buyerBadge(L)}${L.isBroker && !L.brole ? `<span class="badge b-cat">سمسار/بايع</span>` : ""}
        ${L.ai ? `<span class="badge b-ai" title="${esc(L.ai.summary || "")}">🧠 ${L.ai.buyer ? "مشتري " + L.ai.score + "%" : L.ai.broker ? "مش مشتري (سمسار/بايع)" : "اهتمام ضعيف"}</span>` : ""}
        ${L.merged ? `<span class="badge b-cat" title="الذكاء الاصطناعي لقى إنه نفس الشخص بأكتر من حساب/اسم">🔗 مجمّع من ${L.merged + 1}</span>` : ""}
        ${L.posts >= 3 ? `<span class="badge b-multi">🔁 ${L.posts} بوست</span>` : ""}
        ${L.sources.map((x) => `<span class="badge b-${x}">${SRC1[x]}</span>`).join("")}
        ${(() => { const alt = L.names.filter((n) => n !== L.name && !PH.extractPhones(n).length).slice(0, 2); return alt.length ? `<span class="muted">(${alt.map(esc).join("، ")})</span>` : ""; })()}
      </div>
      ${typeof ROLE !== "undefined" && ROLE.buyerBasis ? `<div class="cls-basis cls-${ck}"><b>المعيار</b><span>${esc(ROLE.buyerBasis(L))}</span></div>` : ""}
      <div class="profile">
        <div class="pf-row pf-want"><span class="pf-k">🎯 عايز إيه</span><div class="pf-v"><b>${esc(L.want.text)}</b>${L.want.parts.length ? `<div class="muted">${L.want.parts.map(esc).join(" · ")}</div>` : ""}${L.want.aiSummary ? `<div class="summary">🤖 ${esc(L.want.aiSummary)}</div>` : ""}</div></div>
        <div class="pf-row pf-ph"><span class="pf-k">📞 رقمه</span><div class="pf-v">${L.phones.length
          ? L.phones.map((n) => `<span class="ph big">${esc(n)}<a href="${PH.waLink(n)}" target="_blank" title="كلمه واتساب">💬 واتساب</a><button data-copy="${esc(n)}" title="نسخ">📋</button></span>`).join(" ")
          : (prof ? `<div class="noph"><span class="muted">مسابش رقم — كلمه من حسابه:</span>
              <a class="btn sm primary" href="${esc(prof)}" target="_blank">👤 افتح بروفايله</a>
              ${msgr ? `<a class="btn sm" href="${esc(msgr)}" target="_blank">✉️ ابعتله رسالة</a>` : ""}
              <button class="btn sm" data-copy="${esc(prof)}">📋 انسخ لينك البروفايل</button></div>
              <div class="muted ltr">${esc(prof)}</div>`
            : `<span class="muted">مسابش رقم ولا ليه لينك بروفايل — رد عليه على البوست واطلب رقمه</span>`)}</div></div>
        <div class="pf-row pf-bud"><span class="pf-k">💰 ميزانيته</span><div class="pf-v">${L.range
          ? `<b>${L.range.min === L.range.max ? "حوالي " + PH.fmtPrice(L.range.min) : `من ${PH.fmtPrice(L.range.min)} لـ ${PH.fmtPrice(L.range.max)}`}</b>
             <span class="tier t${L.tier.idx}">${L.tier.emoji} ميزانية ${L.tier.label}${L.rich ? " — معاه فلوس" : ""}</span>
             <span class="muted">(من ${L.range.from})</span>`
          : `<span class="muted">مش واضحة — مكتبش سعر ولا سأل على عروض فيها سعر. اسأله عن ميزانيته في أول رسالة.</span>`}</div></div>
        <div class="pf-row"><span class="pf-k">🔥 اهتمامه</span><div class="pf-v"><b class="lvl-t lv${L.level}t">${L.score}/100 — ${LEADS.levelName(L.level)}</b>
          <div class="whys">${L.why.map((w) => `<span class="why-c">✔ ${esc(w)}</span>`).join("")}</div></div></div>
        ${lUrl ? `<div class="pf-row pf-link"><span class="pf-k">🔗 المنشور</span><div class="pf-v">${lnk(lUrl, "🔗 افتح المنشور", "open-link")}</div></div>` : ""}
        <div class="pf-row pf-last"><span class="pf-k">🕒 آخر تفاعل</span><div class="pf-v">${relDay(L.last)} <span class="muted">(${dts(L.last, { weekday: "long", day: "numeric", month: "long" })})</span></div></div>
        ${(sellersByBuyer.get(L.key) || []).length ? `<div class="pf-row pf-match"><span class="pf-k">🤝 بايعين مناسبين</span><div class="pf-v">${(sellersByBuyer.get(L.key) || []).slice(0, open ? 6 : 2).map((x) => pairMini(x, "seller")).join("")}${(sellersByBuyer.get(L.key) || []).length > 2 && !open ? `<button class="btn sm" data-goto="matches" data-gomq="${esc(L.name)}">🤝 كل البايعين المناسبين (${(sellersByBuyer.get(L.key) || []).length})</button>` : ""}</div></div>` : ""}
        <div class="pf-row pf-asked"><span class="pf-k">💬 سأل على</span><div class="pf-v">${L.asked.length ? L.asked.slice(0, open ? 30 : 3).map(askedHtml).join("") +
          (!open && L.asked.length > 3 ? `<button class="btn sm" data-lact="tl">+ ${L.asked.length - 3} بوست كمان</button>` : "")
          : `<span class="muted">ما سألش على عروض — هو اللي نزّل الطلب${L.requests > 1 ? "ات" : ""} بنفسه:</span>${L.acts.filter((a) => a.kind === "request").slice(0, open ? 10 : 2).map((a) => `<div class="asked"><div class="ask-post">📢 ${esc(a.text.slice(0, 220))}</div><div class="muted">👥 ${esc(a.group)} · ${relDay(a.ts)}${a.postUrl ? ` · <a class="open-link" href="${esc(a.postUrl)}" target="_blank">🔗 افتح البوست</a>` : ""}</div></div>`).join("")}`}</div></div>
      </div>
      <div class="contact">
        ${prof ? `<a class="btn sm" href="${esc(prof)}" target="_blank">👤 البروفايل</a>` : ""}
        ${msgr ? `<a class="btn sm" href="${esc(msgr)}" target="_blank">✉️ ماسنجر</a>` : ""}
        <span class="acts">
          <button class="btn sm mbtn" data-lact="tl">${open ? "▲ أقل" : "⋯ التفاصيل"}</button>
          <button class="btn sm" data-lact="star">${L.status === "star" ? "☆ شيل النجمة" : "⭐ مهم"}</button>
          <button class="btn sm primary" data-lact="tpl">💬 رسالة جاهزة</button>
          <button class="btn sm" data-lact="best">🏠 ابعتله أنسب 3 عروض</button>
          <button class="btn sm" data-ssfrom="${esc(L.key)}" title="احفظ طلبه، وأول ما ينزل عرض مناسب يوصلك تنبيه">🔔 دوّرله</button>
          <button class="btn sm danger" data-lact="hidden" title="مش عميل — اخفيه">🙈</button>
        </span>
      </div>
      <div class="pipe">
        ${buyerExplain(L)}
        ${qualLine(L)}
        ${team.length ? `<select class="owner-sel" data-lowner title="المسؤول"><option value="">👤 مين المسؤول؟</option>${team.map((t) => `<option ${meta.owner === t ? "selected" : ""} value="${esc(t)}">👤 ${esc(t)}</option>`).join("")}</select>` : ""}
        <select data-lstage title="المرحلة">${Object.entries(REPORT.STAGES).map(([k, v]) => `<option value="${k}" ${k === st ? "selected" : ""}>${v}</option>`).join("")}</select>
        ${meta.nextAt ? `<span class="chip ${isDue(L) ? "deal" : "i"}">⏰ متابعة ${dts(meta.nextAt, { weekday: "short", day: "numeric", month: "short" })} <button class="x" data-lfollow="0" title="شيل">✕</button></span>`
          : `<span class="muted">⏰ تابعه:</span><button class="btn sm" data-lfollow="1">بكرة</button><button class="btn sm" data-lfollow="3">3 أيام</button><button class="btn sm" data-lfollow="7">أسبوع</button>`}
        <input class="note" data-lnote value="${esc(meta.note || "")}" placeholder="📝 ملاحظة (مثلاً: عايز دور أول، هيقبض أول الشهر)">
      </div>
      ${state.tplFor === "l:" + L.key ? tplMenu("l:" + L.key) : ""}
      ${state.bestFor === L.key ? bestBox(L) : ""}
    </div>
  </article>`;
}
// ================= 🏠 عروضي =================
const UNIT_AR = { land: "أرض", apartment: "شقة", villa: "فيلا", other: "وحدة" };
const numIn = (v) => { const n = parseFloat(PH.toEn(String(v || "")).replace(/[^\d.]/g, "")); return isNaN(n) ? null : n; };
function unitLine(u) {
  return [u.title || UNIT_AR[u.category], u.rooms ? u.rooms + " غرف" : "", u.areaM2 ? u.areaM2 + "م" : "", u.floor || "", u.finishing || "", u.region || "",
    u.price ? PH.fmtPrice(u.price) : ""].filter(Boolean).join(" — ");
}
const activeUnits = () => Object.values(listings).filter((u) => u.status !== "sold");
const activeLeads = () => leads.filter((L) => !L.isBroker && L.status !== "hidden" && !["won", "lost"].includes(stageOf(L)));
function unitsForLead(L) {
  let pool = activeUnits(), fromMine = true;
  let best = MATCH.bestUnitsFor(L.want.obj, pool, 3);
  if (!best.length) { // مفيش في عروضي — ندوّر في العروض المتسجلة من الجروبات
    fromMine = false;
    pool = items.filter((p) => p.type === "offer" && !p.done && PH.norm(p.sender || "") !== PH.norm(L.name)).map((p) => ({ ...p, title: UNIT_AR[p.category] }));
    best = MATCH.bestUnitsFor(L.want.obj, pool, 3);
  }
  return { best, fromMine };
}
function bestBox(L) {
  const { best, fromMine } = unitsForLead(L);
  if (!best.length) return `<div class="bestbox"><span class="muted">مفيش وحدات مناسبة لطلبه دلوقتي — ضيف اللي معاك من صفحة 🏷 هاتلي مشتري.</span><button class="btn sm" data-bestclose>✕</button></div>`;
  return `<div class="bestbox"><b>${fromMine ? "🏠 من عروضك" : "📋 من العروض المتسجلة في الجروبات (مش عروضك)"}:</b>
    ${best.map((x, i) => `<div class="u-lead"><span class="score">${x.m.score}%</span><b>${i + 1}) ${esc(unitLine(x.u))}</b><span class="why">✔ ${esc(x.m.why.join(" · "))}</span></div>`).join("")}
    <div class="row-actions" style="padding:0"><button class="btn sm primary" data-bestsend="${esc(L.key)}">📤 ابعتهم على واتساب</button><button class="btn sm" data-bestclose>✕</button></div></div>`;
}
function offersMsg(L, units) {
  const first = PH.extractPhones(L.name).length || /^[a-z0-9._]+$/i.test(L.name) ? "" : " أستاذ " + L.name.split(/\s+/)[0];
  return `أهلًا${first} 👋\nبخصوص طلبك (${L.want.text.replace(/^عايز /, "")})، عندي اختيارات مناسبة:\n` +
    units.map((x, i) => `${i + 1}) ${x.u.text || x.u.land ? mineLine(x.u) : unitLine(x.u)}`).join("\n") +
    `\n\nتحب أبعتلك الصور والتفاصيل ونحدد معاد معاينة؟${myName ? "\n" + myName : ""}`;
}
async function sendToLead(L, text) {
  const phone = L.phones[0];
  if (phone) window.open(PH.waLink(phone) + "?text=" + encodeURIComponent(text), "_blank");
  else { await copyText(text); const alt = LEADS.messengerLink(L) || LEADS.profileLink(L); if (alt) window.open(alt, "_blank"); toast("اتنسخت الرسالة — الصقها في الشات"); }
  if (stageOf(L) === "new") await setLeadMeta(L.key, { stage: "contacted", lastMsg: Date.now() });
}
// ===== 🏷 هاتلي مشتري =====
// الوحدة بتاعتي بشكل يفهمه ميزان التطابق
function unitObj(u) {
  const a = u.text ? PH.analyze(u.text, compiledG) : {};
  return { ...a, id: u.id, category: u.category || a.category || "land", region: u.region || a.region || null, price: u.price || a.price || null,
    areaM2: u.areaM2 || a.areaM2 || null, land: u.land || a.land || null, ppmGiven: u.ppm || a.ppmGiven || null, rooms: u.rooms || a.rooms || null, isBroker: null, type: "offer", text: u.text || u.notes || "" };
}
function mineLine(u) { const U = unitObj(u); return U.category === "land" ? ALERTS.unitLine(U) : unitLine(u); }
$("mineFb").addEventListener("change", async (e) => { const { huntCfg: h = {} } = await chrome.storage.local.get("huntCfg"); await chrome.storage.local.set({ huntCfg: { ...h, mine: e.target.checked } }); toast(e.target.checked ? "🔎 هيدوّر على مشترين لعروضك في فيسبوك كله" : "اتقفل"); });
// ================= 🎯 جمهور ميتا =================
function metaAudience() {
  const lvl = +$("maLevel").value, cat = $("maCat").value, days = +$("maDays").value, onlyC = $("maContacted").checked;
  const pick = leads.filter((L) => !L.isBroker && L.status !== "hidden" && L.level >= lvl && L.phones.length &&
    (!days || L.last >= Date.now() - days * 864e5) && (!onlyC || ["contacted", "viewing", "negotiating", "won"].includes(stageOf(L))));
  return cat === "all" ? pick : pick.filter((L) => L.categories.includes(cat));
}
function e164(p) { const d = p.replace(/\D/g, ""); return /^01\d{9}$/.test(d) ? "2" + d : d.replace(/^00/, ""); }
function audienceCsv(list) {
  const q = csvQ;
  const rows = ["phone,fn,ln,ct,country"];
  for (const L of list) {
    const nm = PH.extractPhones(L.name).length || PH.isAnon(L.name) ? [] : L.name.trim().split(/\s+/);
    for (const p of L.phones) rows.push([e164(p), nm[0] || "", nm.slice(1).join(" "), area.gov === "بني سويف" ? "Beni Suef" : area.gov, "EG"].map(q).join(","));
  }
  return rows.join("\r\n");
}

// ================= 📣 نبض السوق =================
function pulseData(days) {
  const since = Date.now() - days * 864e5;
  const its = items.filter((p) => (p.ts || p.scannedAt) >= since);
  const req = its.filter((p) => p.type === "request"), off = its.filter((p) => p.type === "offer");
  const regs = countBy(req, (p) => p.region);
  const topRegs = [...regs].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const ppmBy = new Map();
  for (const p of items.filter((p) => p.type === "offer" && p.category === "apartment" && p.region)) { const v = PH.ppm(p); if (v) { if (!ppmBy.has(p.region)) ppmBy.set(p.region, []); ppmBy.get(p.region).push(v); } }
  const ppm = [...ppmBy].filter(([, a]) => a.length >= 2).map(([r, a]) => [r, median(a)]).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const cats = ["apartment", "land", "villa", "other"].map((k) => [k, req.filter((p) => p.category === k).length]).sort((a, b) => b[1] - a[1]);
  const topCat = cats[0] && cats[0][1] ? cats[0][0] : "apartment"; // الميزانية وعدد الغرف لنفس النوع الأكتر طلبًا (كانت دايمًا الشقق: «الأراضي… ميزانية 3.7 مليون · 4 غرف»)
  const budgets = req.filter((p) => p.category === topCat && p.price && p.deal !== "rent").map((p) => p.price);
  const rooms = countBy(req.filter((p) => p.rooms && p.category === topCat && (topCat === "apartment" || topCat === "villa")), (p) => p.rooms);
  const topRooms = [...rooms].sort((a, b) => b[1] - a[1])[0];
  return { days, req: req.length, off: off.length, topRegs, ppm, cats, budget: budgets.length >= 2 ? median(budgets) : null, topRooms, leadsHot: leads.filter((L) => L.level >= 2 && !L.isBroker && L.last >= since).length };
}
function drawPulse() {
  const days = +$("pulseDays").value, brand = $("pulseBrand").value.trim() || myName || "العراب للعقارات";
  const d = pulseData(days);
  const c = $("pulseCanvas"), x = c.getContext("2d");
  const W = 1080, H = 1350;
  const grd = x.createLinearGradient(0, 0, W, H); grd.addColorStop(0, "#063f39"); grd.addColorStop(1, "#0b6b5c");
  x.fillStyle = grd; x.fillRect(0, 0, W, H);
  x.direction = "rtl"; x.textAlign = "right";
  const F = (w, s) => `${w} ${s}px Cairo, Arial, Helvetica, sans-serif`;
  x.fillStyle = "#c9f2e3"; x.font = F(600, 34); x.fillText(brand, W - 70, 100);
  x.fillStyle = "#fff"; x.font = F(800, 82); x.fillText("نبض السوق 📊", W - 70, 205);
  const from = new Date(Date.now() - days * 864e5), to = new Date();
  x.font = F(500, 34); x.fillStyle = "#a8e6cf";
  x.fillText(`عقارات ${area.gov} · ${from.toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "long" })} – ${to.toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "long" })}`, W - 70, 262);
  // كروت الأرقام
  const box = (bx, by, bw, bh, big, small) => {
    x.fillStyle = "rgba(255,255,255,.09)"; x.beginPath(); x.roundRect(bx, by, bw, bh, 28); x.fill();
    x.fillStyle = "#fff"; x.font = F(800, 64); x.fillText(big, bx + bw - 34, by + 92);
    x.fillStyle = "#bfeee0"; x.font = F(500, 30); x.fillText(small, bx + bw - 34, by + 140);
  };
  box(560, 310, 450, 180, d.req.toLocaleString("ar-EG-u-nu-latn"), "طلب شراء");
  box(70, 310, 450, 180, d.off.toLocaleString("ar-EG-u-nu-latn"), "عرض متاح");
  // أكتر المناطق طلبًا
  x.fillStyle = "#fff"; x.font = F(800, 44); x.fillText("📍 أكتر المناطق طلبًا", W - 70, 575);
  const max = Math.max(1, ...d.topRegs.map((r) => r[1]));
  d.topRegs.forEach(([r, n], i) => {
    const y = 600 + i * 62;
    x.fillStyle = "#fff"; x.font = F(600, 34); x.fillText(r, W - 70, y + 34);
    const bw = Math.round(470 * (n / max));
    x.fillStyle = "rgba(255,255,255,.12)"; x.beginPath(); x.roundRect(70, y + 6, 470, 36, 18); x.fill();
    x.fillStyle = "#2ee6a6"; x.beginPath(); x.roundRect(70 + 470 - bw, y + 6, bw, 36, 18); x.fill();
    x.fillStyle = "#063f39"; x.font = F(800, 26); x.textAlign = "left"; x.direction = "ltr"; x.fillText(n.toLocaleString("ar-EG-u-nu-latn"), 70 + 470 - bw + 14, y + 33); x.textAlign = "right"; x.direction = "rtl";
  });
  if (!d.topRegs.length) { x.fillStyle = "#bfeee0"; x.font = F(500, 30); x.fillText("محتاج بيانات أكتر — اسحب جروبات الأول", W - 70, 680); }
  // سعر المتر
  let y0 = 600 + Math.max(1, d.topRegs.length) * 62 + 55;
  if (d.ppm.length) {
    d.ppm = d.ppm.slice(0, 3);
    x.fillStyle = "#fff"; x.font = F(800, 44); x.fillText("🏢 متوسط سعر متر الشقق", W - 70, y0);
    d.ppm.forEach(([r, v], i) => {
      const yy = y0 + 58 + i * 52;
      x.fillStyle = "#e6fff6"; x.font = F(600, 32); x.fillText(r, W - 70, yy);
      x.textAlign = "left"; x.direction = "ltr"; x.fillStyle = "#2ee6a6"; x.font = F(800, 32); x.fillText(`${Math.round(v).toLocaleString("en-US")} EGP/m²`, 70, yy); x.textAlign = "right"; x.direction = "rtl";
    });
    y0 += 60 + d.ppm.length * 56 + 20;
  }
  // سطر أخير
  const top = d.cats[0] && d.cats[0][1] ? { apartment: "الشقق", land: "الأراضي", villa: "الفلل", other: "المحلات والوحدات التجارية" }[d.cats[0][0]] : null;
  x.fillStyle = "rgba(255,255,255,.09)"; x.beginPath(); x.roundRect(70, H - 180, W - 140, 125, 28); x.fill();
  x.fillStyle = "#fff"; x.font = F(700, 34);
  x.fillText(top ? `الأكتر طلبًا: ${top}${d.topRooms ? ` · ${d.topRooms[0]} غرف` : ""}${d.budget ? ` · ميزانية ~${PH.fmtPrice(d.budget)}` : ""}` : "تابعنا كل أسبوع لأحدث أرقام السوق", W - 105, H - 112);
  x.fillStyle = "#a8e6cf"; x.font = F(500, 25); x.fillText(`الأرقام من تحليل منشورات جروبات العقارات في ${area.gov}`, W - 105, H - 75);
  // الكابشن (مختلف عن الصورة ويكمّلها)
  const regLine = d.topRegs.slice(0, 3).map((r) => r[0]).join(" و");
  $("pulseCaption").value =
`لو بتفكر تشتري أو تبيع في ${area.gov} الأيام دي، الأرقام دي تهمك 👇

${regLine ? `الطلب مركّز على ${regLine}، يعني لو عندك وحدة هناك ده وقتها.` : "السوق نشط والطلب مستمر."}
${top ? `${top} هي اللي الناس بتدور عليها أكتر${d.budget ? `، ومعظم الميزانيات حوالين ${PH.fmtPrice(d.budget)}` : ""}.` : ""}
${d.req > d.off ? "الطلب أكتر من المعروض — فرصة للي بيبيع." : d.off > d.req ? "المعروض أكتر من الطلب — فرصة للي بيشتري يتفاوض." : ""}

عندك وحدة عايز تبيعها بسرعة؟ أو بتدور على حاجة بمواصفات معيّنة؟
ابعتلنا رسالة وهنوصلك بالمناسب 🤝

${brand}
${area.gov === "بني سويف" ? "#عقارات_بني_سويف #بني_سويف_الجديدة" : "#عقارات_" + area.gov.replace(/\s+/g, "_")} #شقق_للبيع #أراضي_للبيع`.replace(/\n{3,}/g, "\n\n");
}

function relDay(ts) {
  if (!ts) return "—";
  const t0 = new Date(); t0.setHours(0, 0, 0, 0); const t1 = new Date(ts); t1.setHours(0, 0, 0, 0);
  const d = Math.round((t0 - t1) / 864e5); // أيام تقويمية (بوست ١١ بالليل امبارح كان بيبان «النهارده» الساعة ٨ الصبح)
  return d <= 0 ? "النهارده" : d === 1 ? "امبارح" : d < 7 ? `من ${d} أيام` : d < 30 ? `من ${Math.round(d / 7)} أسبوع` : `من ${Math.round(d / 30)} شهر`;
}
function askedHtml(a) {
  const info = [a.category ? CATS[a.category] : "", a.region ? "📍 " + a.region : "", a.price ? "💰 " + PH.fmtPrice(a.price) : "", a.area || "", a.rooms ? a.rooms + " غرف" : ""].filter(Boolean);
  return `<div class="asked">
    <div class="ask-q">«${esc(a.comments.slice(0, 3).join("» · «"))}»${a.tags.length ? ` <span class="tag-c">${esc(a.tags.slice(0, 2).join(" · "))}</span>` : ""}</div>
    <div class="ask-post">على: ${esc((a.postText || "رسالة في الجروب").replace(/\s+/g, " ").slice(0, 170))}</div>
    <div class="muted">${info.map(esc).join(" · ")}${info.length ? " — " : ""}${a.postAuthor ? "نشره " + esc(a.postAuthor) + " · " : ""}👥 ${esc(a.group)} · ${relDay(a.ts)}${(a.commentUrls || []).slice(0, 2).map((u) => ` · <a class="open-link" href="${esc(u)}" target="_blank">💬 افتح التعليق</a>`).join("")}${a.postUrl ? ` · <a class="open-link" href="${esc(a.postUrl)}" target="_blank">🔗 افتح البوست</a>` : ""}</div>
  </div>`;
}
async function setLeadMeta(key, patch) {
  const { leadMeta: m = {} } = await chrome.storage.local.get("leadMeta");
  const cur = m[key] || {};
  const next = { ...cur, ...patch, at: Date.now() };
  if (patch.stage && patch.stage !== REPORT.stageOf(cur)) next.history = [...(cur.history || []), { stage: patch.stage, at: Date.now() }];
  if (patch.stage && cur.status === "contacted") next.status = "";
  m[key] = next;
  await chrome.storage.local.set({ leadMeta: m });
}
// ===== 💬 القوالب =====
function tplMenu(target) {
  return `<div class="tplmenu" data-tpltarget="${esc(target)}"><span class="muted">اختار الرسالة:</span>
    ${templates.map((t, i) => `<button class="btn sm" data-tpl="${i}">${esc(t.name)}</button>`).join("")}
    <button class="btn sm" data-tplclose>✕</button></div>`;
}
function fillTemplate(text, ctx) {
  const v = {
    "الاسم": (ctx.name || "").split(/\s+/)[0] || "", "اسمي": myName || "",
    "النوع": ctx.unit || "وحدة", "المنطقة": ctx.region || "المنطقة اللي تناسبك",
    "الميزانية": ctx.budget ? PH.fmtPrice(ctx.budget) : "ميزانيتك", "العرض": ctx.offer || "الإعلان", "الجروب": ctx.group || "",
  };
  if (!myName) text = text.replace(/معاك\s*\{اسمي\}\s*[—-]?\s*/g, "").replace(/^[ \t]*\{اسمي\}[ \t]*$/gm, "");
  if (!v["الاسم"]) text = text.replace(/\s*أستاذ\s*\{الاسم\}/g, "");
  return text.replace(/\{(الاسم|اسمي|النوع|المنطقة|الميزانية|العرض|الجروب)\}/g, (_, k) => v[k]).replace(/\n{3,}/g, "\n\n").replace(/\s+$/,"");
}
function leadCtx(L) {
  const a = L.acts.find((x) => x.kind === "comment" && x.postText) || L.acts[0] || {};
  const offer = a.postText ? a.postText.replace(/\s+/g, " ").slice(0, 70) + (a.postText.length > 70 ? "…" : "") : "";
  const what = UNIT1[L.category] + (L.regions[0] ? " في " + L.regions[0] : "");
  return { name: PH.extractPhones(L.name).length || /^[a-z0-9._]+$/i.test(L.name) ? "" : L.name, unit: UNIT1[L.category], region: L.regions[0],
    budget: L.budget, offer: offer || what, group: a.group };
}
async function sendTemplate(target, idx) {
  const t = templates[idx];
  if (!t) return;
  let phone = "", alt = "", text = "", leadKey = "";
  if (target.startsWith("l:")) {
    const L = leads.find((x) => x.key === target.slice(2));
    if (!L) return;
    text = fillTemplate(t.text, leadCtx(L)); phone = L.phones[0] || ""; alt = LEADS.messengerLink(L) || LEADS.profileLink(L); leadKey = L.key;
  } else {
    const p = byId.get(target.slice(2));
    if (!p) return;
    text = fillTemplate(t.text, { name: PH.extractPhones(p.sender).length ? "" : p.sender, unit: UNIT1[p.category], region: p.region, budget: p.price, offer: p.text.replace(/\s+/g, " ").slice(0, 70), group: p.groups[0] });
    phone = p.phones[0] || ""; alt = p.uid ? "https://m.me/" + p.uid : p.url;
    leadKey = LEADS.personOfPost(p); // نفس مفتاح الشخص في بناء العملاء (من غير text كان «مشارك مجهول» بياخد مفتاح عشوائي ويتكتب سجل زبالة)
  }
  if (phone) window.open(PH.waLink(phone) + "?text=" + encodeURIComponent(text), "_blank");
  else { await copyText(text); if (alt) window.open(alt, "_blank"); toast("اتنسخت الرسالة — الصقها في الشات"); }
  state.tplFor = "";
  const cur = REPORT.stageOf(leadMeta[leadKey]);
  await setLeadMeta(leadKey, cur === "new" ? { stage: "contacted", lastMsg: Date.now() } : { lastMsg: Date.now() });
}

// ================= ☀️ النهارده =================
// 🛡 حالة السحب (من حارس السحب)
function healthHtml() {
  const H = scrapeHealth; if (!H || !H.runs || !H.runs.length) return "";
  const r = H.runs[0], ago = relDay(H.at);
  const M = {
    ok: ["ok", `🛡 السحب شغال تمام — آخر مرة ${ago}: قرا ${r.seen || 0} بوست من ${r.ok || 0}/${r.items || 0} مكان`],
    empty: ["warn", `🛡 آخر سحب (${ago}) مالقاش بوستات جديدة في ${r.items || 0} مكان — عادي لو الجروبات هادية`],
    login: ["bad", "🔐 فيسبوك مش مسجّل دخول — السحب واقف. افتح فيسبوك وسجّل دخول بنفسك."],
    checkpoint: ["bad", "🔐 فيسبوك طالب تأكيد هوية — السحب واقف. افتح فيسبوك وكمّل التأكيد بنفسك."],
    broken: ["bad", `⚠️ السحب مش بيلقط بوستات (${ago}) — غالبًا فيسبوك غيّر شكل الصفحات. افتح جروب واسحب يدوي، ولو فضلت كده قولّي.`],
    errors: ["bad", `⚠️ السحب بيقابل أخطاء (${r.errors}/${r.items} مكان) — ${ago}`],
  }[H.status] || null;
  if (!M) return "";
  const runs = H.runs.slice(0, 12).reverse().map((x) => `<i class="hd ${x.loggedOut || x.checkpoint || (x.items >= 2 && !x.ok) ? "bad" : x.ok ? "ok" : "warn"}" title="${new Date(x.at).toLocaleString("ar-EG-u-nu-latn")} — ${x.ok || 0}/${x.items || 0} مكان · ${x.seen || 0} بوست"></i>`).join("");
  return `<div class="health ${M[0]}"><span>${M[1]}</span><span class="hdots" title="آخر ${Math.min(12, H.runs.length)} سحب">${runs}</span></div>`;
}
function renderToday() {
  if ($("healthBar")) { $("healthBar").innerHTML = healthHtml(); diagBanner(); }
  const r = REPORT.buildReport(items, leads, deals, leadMeta, 24);
  const k = (n, label, view, extra = "") => `<button class="kpi kbtn" ${view ? `data-goto="${view}"` : ""} ${extra}><b>${n}</b><span>${label}</span></button>`;
  $("todayKpis").innerHTML =
    k(r.due.length, "⏰ متابعات النهارده", "leads", 'data-gostage="due"') + k(r.hot.length, "🔥🔥🔥 عملاء جاهزين جداد", "leads") +
    k(r.deals.length, "🎯 لقطات جديدة", "posts", 'data-godeals="1"') + k(r.req, "📢 طلب جديد", "posts") + k(r.off, "🏷 عرض جديد", "posts") +
    k(r.topRegion ? esc(r.topRegion[0]) : "—", "📍 أكتر منطقة طلبًا", "");
  const catLine = Object.entries(r.byCat).filter(([, v]) => v.req + v.off).map(([c, v]) => `<span class="chip i">${CATS[c]}: ${v.req} طلب · ${v.off} عرض</span>`).join(" ");
  $("todayCats").innerHTML = catLine || `<span class="muted">مفيش جديد آخر 24 ساعة — شغّل السحب أو السحب التلقائي.</span>`;
  const sec = (title, body, empty) => `<section class="tsec"><h3>${title}</h3>${body || `<div class="muted">${empty}</div>`}</section>`;
  const allDeals0 = items.filter((p) => deals.has(p.id) && !p.done).sort((a, b) => deals.get(b.id).pct - deals.get(a.id).pct);
  // 🔎 سيرش النهارده: بيفلتر المتابعات والعملاء واللقطات مع بعض
  const tq = qNorm(state.tq);
  const leadQ = (L) => !tq || qOK(tq, L.names.join(" ") + " " + L.phones.join(" ") + " " + L.regions.join(" ") + " " + L.acts.map((a) => a.text).join(" "), L.phones, { cats: L.categories, types: ["request"] });
  const postQ = (p) => !tq || qOK(tq, p.text + " " + p.sender + " " + (p.summary || "") + " " + (p.region || ""), p.phones, { cats: [p.category], types: [p.type] });
  const hotAll = [...r.hot, ...r.warm], dueF = r.due.filter(leadQ), hotF = hotAll.filter(leadQ), allDeals = allDeals0.filter(postQ);
  const cn = (a, b) => (tq ? `${a} من ${b}` : a);
  const none = tq ? `مفيش نتيجة للبحث «${esc(state.tq.trim())}» هنا.` : "";
  $("todayBody").innerHTML =
    sec(`⏰ لازم تتابعهم النهارده (${cn(dueF.length, r.due.length)})`, dueF.map(leadCard).join(""), none || "مفيش متابعات النهارده. من كارت أي عميل دوس «بكرة» أو «3 أيام» وهيفكرك.") +
    sec(`🔥 عملاء مهتمين ظهروا آخر 24 ساعة (${cn(hotF.length, hotAll.length)})`, hotF.slice(0, 15).map(leadCard).join(""), none || "مفيش عملاء جداد آخر 24 ساعة.") +
    sec(`🎯 أكبر اللقطات (${cn(allDeals.length, allDeals0.length)})`, allDeals.slice(0, 10).map((p) => card(p)).join(""), "مفيش لقطات لسه — اللقطة بتظهر لما يكون فيه عروض كفاية في نفس المنطقة نقارن بيها.");
  if (team.length) {
    const rows = team.map((t) => {
      const mine = leads.filter((L) => (leadMeta[L.key] || {}).owner === t);
      const by = (st) => mine.filter((L) => stageOf(L) === st).length;
      const due = mine.filter(isDue).length;
      return `<tr><td><b>👤 ${esc(t)}</b></td><td>${mine.length}</td><td>${by("contacted")}</td><td>${by("viewing")}</td><td>${by("negotiating")}</td><td class="up">${by("won")}</td><td>${due ? `<span class="chip deal">⏰ ${due}</span>` : "—"}</td></tr>`;
    }).join("");
    const un = leads.filter((L) => L.level >= 2 && !L.isBroker && !(leadMeta[L.key] || {}).owner && !["won", "lost"].includes(stageOf(L))).length;
    $("todayBody").insertAdjacentHTML("beforeend", `<section class="tsec"><h3>👥 الفريق</h3><div class="panel"><table class="learn-t">
      <tr><th>المسؤول</th><th>عملاءه</th><th>كلمهم</th><th>معاينة</th><th>تفاوض</th><th>اتقفل</th><th>متابعات النهارده</th></tr>${rows}</table>
      ${un ? `<div class="muted" style="margin-top:6px">فيه ${un} عميل 🔥🔥 أو أكتر لسه مش متوزع على حد.</div>` : ""}</div></section>`);
  }
  try { if (window.renderTodayPlan) renderTodayPlan(); } catch (e) { console.error("todayPlan", e); }
  $("reportLine").textContent = lastReport ? `آخر تقرير اتبعت: ${new Date(lastReport.at).toLocaleString("ar-EG-u-nu-latn", { weekday: "short", hour: "numeric", minute: "2-digit" })}` : "";
}

// 🙈 على بايع: بيخفيه كبايع بس (قبل كده كان بيخفي نفس الشخص كمشتري كمان لأن status واحد للاتنين)
async function setSellerHidden(key) {
  const { leadMeta: m = {} } = await chrome.storage.local.get("leadMeta");
  m[key] = { ...(m[key] || {}), sHidden: true, at: Date.now() };
  await chrome.storage.local.set({ leadMeta: m });
  toast("اتخفى كبايع — مش هيظهر تاني");
}
async function setLeadStatus(key, status) {
  const { leadMeta: m = {} } = await chrome.storage.local.get("leadMeta");
  const cur = (m[key] && m[key].status) || "";
  m[key] = { ...(m[key] || {}), status: cur === status ? "" : status, at: Date.now() };
  await chrome.storage.local.set({ leadMeta: m });
  if (status === "hidden") toast("اتخفى — مش هيظهر تاني");
}

// ================= 📒 دليل أسعار بني سويف =================
function guideRows(zone = "all") {
  const now = Date.now(), d30 = now - 30 * 864e5, d90 = now - 90 * 864e5;
  const by = new Map();
  for (const p of items) {
    if (!p.region || !inArea(p) || (zone !== "all" && p.zone !== zone)) continue;
    if (!by.has(p.region)) by.set(p.region, { region: p.region, zone: p.zone, req: 0, off: 0, apt: [], aptNew: [], aptOld: [], land: [] });
    const r = by.get(p.region);
    p.type === "request" ? r.req++ : r.off++;
    if (p.type !== "offer") continue;
    const t = p.ts || p.scannedAt, v = PH.ppm(p);
    if (p.category === "apartment" && v) { r.apt.push(v); if (t >= d30) r.aptNew.push(v); else if (t >= d90) r.aptOld.push(v); }
    if (p.category === "land" && v) r.land.push(v);
  }
  return [...by.values()].map((r) => ({
    region: r.region, zone: r.zone, req: r.req, off: r.off, ratio: r.off ? +(r.req / r.off).toFixed(1) : r.req ? "∞" : 0,
    apt: r.apt.length >= 2 ? Math.round(median(r.apt)) : null, aptN: r.apt.length,
    trend: r.aptNew.length >= 2 && r.aptOld.length >= 2 ? Math.round((median(r.aptNew) / median(r.aptOld) - 1) * 100) : null,
    land: r.land.length >= 2 ? Math.round(median(r.land)) : null,
  })).sort((a, b) => b.req + b.off - (a.req + a.off));
}
// ===== 🌾 دليل أراضي الأحياء: سعر المتر والأوفر لكل حي ومجاورة =====
function landGuideRows() {
  const now = Date.now(), d30 = now - 30 * 864e5, d90 = now - 90 * 864e5;
  const by = new Map();
  for (const p of items) {
    if (p.category !== "land" || !p.region || !inArea(p)) continue;
    if (!by.has(p.region)) by.set(p.region, { region: p.region, req: 0, off: 0, ppm: [], ppmNew: [], ppmOld: [], over: [], cheapest: null, mug: new Map() });
    const r = by.get(p.region);
    p.type === "request" ? r.req++ : r.off++;
    const mk = p.land && p.land.mugawra ? "المجاورة " + p.land.mugawra : null;
    if (mk && !r.mug.has(mk)) r.mug.set(mk, { name: mk, req: 0, off: 0, ppm: [], over: [] });
    const M = mk ? r.mug.get(mk) : null;
    if (M) p.type === "request" ? M.req++ : M.off++;
    if (p.type !== "offer") continue;
    const v = PH.ppm(p), t = p.ts || p.scannedAt;
    if (v) { r.ppm.push(v); if (t >= d30) r.ppmNew.push(v); else if (t >= d90) r.ppmOld.push(v); if (M) M.ppm.push(v); if (!r.cheapest || v < r.cheapest.v) r.cheapest = { v, id: p.id, url: p.url }; }
    if (p.land && p.land.over) { r.over.push(p.land.over); if (M) M.over.push(p.land.over); }
  }
  const order = area.focus.length ? area.focus : [];
  return [...by.values()].map((r) => ({ ...r, ppmMed: r.ppm.length ? Math.round(median(r.ppm)) : null, overMed: r.over.length ? Math.round(median(r.over)) : null,
    trend: r.ppmNew.length >= 2 && r.ppmOld.length >= 2 ? Math.round((median(r.ppmNew) / median(r.ppmOld) - 1) * 100) : null,
    mugs: [...r.mug.values()].map((M) => ({ ...M, ppmMed: M.ppm.length ? Math.round(median(M.ppm)) : null, overMed: M.over.length ? Math.round(median(M.over)) : null })).sort((a, b) => a.name.localeCompare(b.name, "ar", { numeric: true })) }))
    .sort((a, b) => (order.indexOf(a.region) + 1 || 99) - (order.indexOf(b.region) + 1 || 99) || b.req + b.off - (a.req + a.off));
}
function renderLandGuide() {
  const box = $("landGuide");
  box.hidden = !cats.includes("land");
  if (box.hidden) return;
  const rows = landGuideRows();
  const n = (v) => (v == null ? `<span class="muted">—</span>` : Math.round(v).toLocaleString("en-US"));
  $("landGuideTable").innerHTML = `<tr><th>الحي</th><th>طلبات</th><th>عروض</th><th>طلب/عرض</th><th>متوسط سعر المتر</th><th>أرخص متر</th><th>متوسط الأوفر</th><th>الاتجاه</th><th>المجاورات</th></tr>` +
    (rows.length ? rows.map((r) => `<tr><td><b>${esc(r.region)}</b></td><td>${r.req}</td><td>${r.off}</td><td>${r.off ? (r.req / r.off).toFixed(1) : r.req ? "∞" : 0}${r.off && r.req / r.off >= 1.5 ? " 🔥" : ""}</td>
      <td>${n(r.ppmMed)}${r.ppm.length ? ` <span class="muted">(${r.ppm.length})</span>` : ""}</td><td>${r.cheapest ? `${n(r.cheapest.v)}${r.cheapest.url ? ` <a class="open-link" href="${esc(r.cheapest.url)}" target="_blank">🔗</a>` : ""}` : n(null)}</td>
      <td>${r.overMed ? PH.fmtPrice(r.overMed) : n(null)}</td><td>${r.trend == null ? `<span class="muted">—</span>` : `<bdi dir="ltr" class="${r.trend > 0 ? "trend-up" : "trend-down"}">${r.trend > 0 ? "▲ +" : "▼ "}${r.trend}%</bdi>`}</td>
      <td>${r.mugs.length ? `<button class="btn sm" data-lgmug="${esc(r.region)}">${state.open.has("lg:" + r.region) ? "▲" : "▼"} ${r.mugs.length}</button>` : "—"}</td></tr>
      ${state.open.has("lg:" + r.region) ? r.mugs.map((M) => `<tr class="subrow"><td>↳ ${esc(M.name)}</td><td>${M.req}</td><td>${M.off}</td><td></td><td>${n(M.ppmMed)}</td><td></td><td>${M.overMed ? PH.fmtPrice(M.overMed) : n(null)}</td><td></td><td></td></tr>`).join("") : ""}`).join("")
      : `<tr><td colspan="9" class="muted">لسه مفيش أراضي كفاية في أحياءك — اسحب الجروبات وهيتملى.</td></tr>`);
}
function renderGuide() {
  renderLandGuide();
  $("guideZones").innerHTML = [["all", "كل " + area.gov], ...Object.entries(PH.zones())].map(([k, v]) =>
    `<button class="tab ${state.guideZone === k ? "on" : ""}" data-gz="${k}">${v}</button>`).join("");
  const rows = guideRows(state.guideZone);
  const n = (v) => (v == null ? `<span class="muted">—</span>` : Math.round(v).toLocaleString("ar-EG-u-nu-latn"));
  $("guideTable").innerHTML = `<tr><th>المنطقة</th><th>طلبات</th><th>عروض</th><th>طلب/عرض</th><th>متر الشقق</th><th>الاتجاه</th><th>متر الأراضي</th></tr>` +
    (rows.length ? rows.slice(0, 40).map((r) => `<tr><td><b>${esc(r.region)}</b> <span class="muted">${r.zone && PH.zones()[r.zone] ? PH.zones()[r.zone].split(" ")[0] : ""}</span></td><td>${r.req}</td><td>${r.off}</td>
      <td>${r.ratio}${typeof r.ratio === "number" && r.ratio >= 1.5 ? " 🔥" : ""}</td><td>${n(r.apt)}${r.aptN ? ` <span class="muted">(${r.aptN})</span>` : ""}</td>
      <td>${r.trend == null ? `<span class="muted">—</span>` : `<bdi dir="ltr" class="${r.trend > 0 ? "trend-up" : "trend-down"}">${r.trend > 0 ? "▲ +" : "▼ "}${r.trend}%</bdi>`}</td>
      <td>${n(r.land)}</td></tr>`).join("") : `<tr><td colspan="7" class="muted">لسه مفيش بيانات كفاية — اسحب جروبات أكتر.</td></tr>`);
  $("guideNote").textContent = "🔥 = الطلب أكتر من العرض بكتير (فرصة للبياع) · الأسعار بالجنيه للمتر";
}

// ================= الإعدادات =================
const KEYS = ["request", "offer", "land", "apartment", "villa"];
function fillWords(s) {
  for (const k of KEYS) $("k-" + k).value = ((s && s[k]) || PH.DEFAULTS[k]).join("\n");
  $("k-regions").value = ((s && s.regions && s.regions.length) ? s.regions : PH.regionsFor(PH.govOf(s))).join("\n");
}
function renderTplEditor() {
  $("tplList").innerHTML = templates.map((t, i) => `<div class="tpl-row" data-i="${i}">
    <input type="text" class="tpl-name" value="${esc(t.name)}" placeholder="اسم الرسالة">
    <textarea class="tpl-text">${esc(t.text)}</textarea>
    <button class="btn sm danger" data-tpldel="${i}">🗑 حذف</button></div>`).join("");
}
function fillSettings() {
  cfgDirty = false; cfgTouched.clear();
  fixLogLine(); fillTg(); fillHunt(); fillLanes(); fillBackups(); fillKeep(); fillOcr(); accStats(); renderDiag();
  fillWords(settings);
  fillArea();
  renderTplEditor();
  $("teamNames").value = team.join("\n");
  $("sbUrl").value = sbCfg.url || ""; $("sbKey").value = sbCfg.key || ""; $("sbAuto").checked = sbCfg.auto !== false;
  $("pulseBrand").value = myName || "";
  $("myName").value = myName;
  $("dealPct").value = String(dealCfg.pct || 15); $("dealNotify").checked = dealCfg.notify !== false;
  $("reportEnabled").checked = reportCfg.enabled !== false; $("reportHour").value = String(reportCfg.hour || 9);
  $("autoEnabled").checked = !!autoCfg.enabled; $("autoHours").value = String(autoCfg.hours || 1); $("autoDepth").value = String(autoCfg.depth || 12);
  $("autoWa").checked = autoCfg.wa !== false; $("autoFb").checked = autoCfg.fb !== false;
  $("autoFbComments").value = autoCfg.fbComments || "smart";
  $("autoRevisit").value = autoCfg.revisit === false ? "off" : "on";
  $("autoNotify").checked = autoCfg.notify !== false; $("autoOnlyMatch").checked = !!autoCfg.notifyOnlyMatches;
  $("aiEnabled").checked = !!aiCfg.enabled; $("aiKey").value = aiCfg.key || ""; $("aiModel").value = aiCfg.model || "";
  $("aiAuto").checked = aiCfg.auto !== false;
  $("aiBuyers").checked = aiCfg.buyers !== false;
  $("aiAudit").checked = aiCfg.audit !== false;
}
// 💾 حالة الحفظ على كل جهاز (بتتحدّث لوحدها لما أي جهاز يحفظ)
async function renderSaves() {
  const box = $("saveLogBox"); if (!box) return;
  const d = await chrome.storage.local.get(["saveLog", "devices", "__peer", "__dev", "xsCfg"]);
  const peer = d.__peer || { on: false }, row = $("saveScopeRow");
  if (row) row.hidden = !peer.on;
  if (!peer.on) { box.innerHTML = ""; return; }
  const now = Date.now(), rows = XS.saveRows(d.saveLog, d.devices, now, (d.xsCfg || {}).t), me = (d.__dev || {}).id;
  const ago = (ms) => { const s = Math.max(0, Math.round(ms / 1e3)); return s < 90 ? "من " + s + " ثانية" : s < 5400 ? "من " + Math.round(s / 60) + " دقيقة" : s < 129600 ? "من " + Math.round(s / 3600) + " ساعة" : "من " + Math.round(s / 86400) + " يوم"; };
  box.innerHTML = rows.length ? rows.map((r) => `<div class="xs-dev ${r.online ? "on" : "off"}"><b>${esc(r.name)}</b>
    <span class="chip ${r.online ? "ok" : "bad"}">${r.online ? "🟢 شغال" : "🔴 فاصل — هيحفظ أول ما يرجع"}</span>
    ${r.state === "none" ? `<span class="chip warn">⏳ لسه ما حفظش ملف</span>` : `<span class="chip ${r.state === "ok" ? "ok" : "warn"}">${r.state === "ok" ? "💾 اتحفظ" : "⚠️ آخر حفظ قديم"} ${ago(now - r.at)}</span><small class="muted">${r.posts} طلب/عرض · ${r.comments} تعليق${r.keys ? " · " + r.keys + " نوع داتا" : ""}${r.partial ? " · (قبل ما المزامنة تخلص)" : ""}</small>`}
    ${r.id === me ? `<span class="chip info">ده الجهاز اللي بتشوف منه</span>` : ""}</div>`).join("") : "";
}
async function renderStore() {
  const d = await chrome.storage.local.get(["snapshots", "fileCfg", "fileStatus"]);
  $("fileAuto").value = (d.fileCfg && d.fileCfg.auto) || "daily";
  if ($("saveScope")) $("saveScope").value = (d.fileCfg && d.fileCfg.scope) === "here" ? "here" : "all";
  renderSaves();
  $("fileLine").textContent = d.fileStatus ? `📁 آخر ملف اتحفظ: ${new Date(d.fileStatus.at).toLocaleString("ar-EG-u-nu-latn", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} — ${d.fileStatus.posts} طلب/عرض · ${d.fileStatus.comments} تعليق (alaa-deals-latest.json)` : "📁 لسه ما اتحفظش ملف — دوس «احفظ ملف دلوقتي» أو 💾 Save";
  let bytes = 0; try { bytes = await chrome.storage.local.getBytesInUse(null); } catch {}
  $("storeBox").innerHTML = `📦 متخزن دلوقتي: <b>${Object.keys(raw).length}</b> طلب/عرض · <b>${Object.keys(comments).length}</b> تعليق/رد · <b>${leads.length}</b> عميل · <b>${Object.keys(listings).length}</b> وحدة — حجم ${(bytes / 1048576).toFixed(1)} ميجا`;
  const { archives = [] } = await chrome.storage.local.get("archives");
  $("archList").innerHTML = archives.length ? archives.slice(0, 30).map((a) => `<div class="u-lead"><b>🌅 ${new Date(a.at).toLocaleString("ar-EG-u-nu-latn", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</b>
      <span class="muted">${a.counts.posts} طلب/عرض · ${a.counts.comments} تعليق — ${esc(a.filename.split("/").pop())}</span></div>`).join("")
    : `<span class="muted">لسه ما عملتش «يوم جديد». كل مرة بتعمله، كل الداتا بتتحفظ في ملف هنا قبل ما الصفحات تفضى.</span>`;
  const snaps = (d.snapshots || []).slice().reverse();
  $("snapList").innerHTML = snaps.length ? snaps.map((x, i) => `<div class="u-lead"><b>📸 ${new Date(x.at).toLocaleString("ar-EG-u-nu-latn", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</b>
      <span class="muted">${x.reason} — ${x.counts.posts} طلب/عرض · ${x.counts.comments} تعليق · ${x.counts.listings} وحدة</span>
      <button class="btn sm" data-snaprestore="${x.at}" title="بيرجّع أي حاجة اتمسحت من النسخة دي من غير ما يمسح الجديد">↩️ رجّع منها</button></div>`).join("")
    : `<span class="muted">لسه مفيش نسخ احتياطية — أول نسخة بتتاخد لوحدها بعد شوية، أو دوس الزرار.</span>`;
}
// renderStore بتقرا كل النسخ الاحتياطية (ممكن ٣٠ ميجا) — مع كل render أثناء السحب كانت بتهنّج الشاشة ٢-٣ ثواني. دلوقتي: عند فتح الإعدادات، أو لما النسخ/الملفات تتغيّر، أو كل ٣٠ ثانية بالكتير
let storeDirty = true, storeAt = 0, settingsSeenAt = 0, sbMsgKey = -1;
chrome.storage.onChanged.addListener((c) => { if (c.snapshots || c.archives || c.fileStatus || c.fileCfg) storeDirty = true; });
function renderSettingsStatus() {
  if (window.renderXs) window.renderXs().catch(() => {});
  const entering = Date.now() - settingsSeenAt > 15000; settingsSeenAt = Date.now();
  if (entering || storeDirty || Date.now() - storeAt > 30000) { storeDirty = false; storeAt = Date.now(); renderStore(); }
  const sbKey = sbStatus ? sbStatus.at : 0; // نتيجة «اختبار الاتصال» اللي لسه ظاهرة ما تتمسحش بأي تحديث خلفية — بنكتب بس لو حالة المزامنة اتغيّرت
  if (sbKey !== sbMsgKey || !$("sbMsg").textContent) { sbMsgKey = sbKey; $("sbMsg").textContent = sbStatus ? `آخر مزامنة: ${new Date(sbStatus.at).toLocaleString("ar-EG-u-nu-latn", { weekday: "short", hour: "numeric", minute: "2-digit" })} — ${sbStatus.posts} بوست، ${sbStatus.leads} عميل، ${sbStatus.listings} وحدة${sbStatus.crm ? " · " + sbStatus.crm + " في سجل الـCRM" : ""}${sbStatus.crmErr ? " — ⚠️ سجل الـCRM محتاج تشغّل كود SQL الجديد (انسخه من الزرار اللي فوق)" : ""}` : ""; }
  const L = learning;
  $("learnBox").innerHTML = L.ok
    ? `<div class="muted">اتعلّم من ${L.n} نتيجة (${L.won} اتقفل) — نسبة القفل العامة ${L.base}%</div><table class="learn-t"><tr><th>الصفة</th><th>عدد</th><th>اتقفل منهم</th><th>تأثيرها على الدرجة</th></tr>
      ${L.table.map((r) => `<tr><td>${esc(r.label)}</td><td>${r.n}</td><td>${r.rate}%</td><td class="${r.delta > 0 ? "up" : r.delta < 0 ? "down" : ""}"><bdi dir="ltr">${r.delta > 0 ? "+" : ""}${r.delta || "—"}</bdi></td></tr>`).join("")}</table>`
    : `<div class="muted">لسه محتاج نتايج: علّم على ${Math.max(0, 6 - L.n)} عميل كمان بـ «اتقفل ✅» أو «مش مهتم» (عندك ${L.n} لحد دلوقتي، ولازم 2 منهم على الأقل يكونوا اتقفلوا). بعدها الدرجة هتبدأ تتظبط لوحدها.</div>`;
  const l = autoLog;
  if (!l) $("autoLog").textContent = autoCfg.enabled ? "لسه ما اشتغلش" : "";
  else if (l.pending && l.pending.length && !l.finishedAt && l.startedAt && Date.now() - l.startedAt < 40 * 6e4) $("autoLog").textContent = `⏳ شغال دلوقتي (${l.pending.map((s) => SRC1[s]).join(" + ")})...`;
  else {
    const s = l.summary;
    $("autoLog").textContent = `آخر تشغيل: ${new Date(l.finishedAt || l.startedAt).toLocaleString("ar-EG-u-nu-latn", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}` +
      (s ? ` — ${s.requests} طلب، ${s.offers} عرض جديد، ${s.matched} ليهم مطابقة، ${s.comments || 0} تعليق مهتم، ${s.hot || 0} عميل 🔥🔥🔥` : "") + (l.aiError ? ` — ⚠️ ${l.aiError}` : "");
  }
  if (aiLive(aiStatus)) $("aiMsg").textContent = `🤖 بيحلل... ${aiStatus.done || 0}/${aiStatus.total || "?"}`;
  else if (aiStatus && aiStatus.error) $("aiMsg").textContent = `⚠️ ${aiStatus.error}`;
  else if (aiStatus && aiStatus.total != null) $("aiMsg").textContent = `آخر تحليل: ${aiStatus.done} بوست ✅ — فاضل ${Object.values(raw).filter((p) => !p.ai).length}`;
  refreshAuditMsg();
}
// 🔁 حالة المراجعة الدورية بالذكاء الاصطناعي (القديم والجديد)
const agoTxt = (t) => { const m = Math.max(1, Math.round((Date.now() - t) / 6e4)); return m < 60 ? m + " دقيقة" : m < 1440 ? Math.round(m / 60) + " ساعة" : Math.round(m / 1440) + " يوم"; };
async function refreshAuditMsg() {
  const el = $("aiAuditMsg"); if (!el) return;
  if (!(aiCfg.enabled && aiCfg.key)) { el.textContent = "🔁 المراجعة الدورية محتاجة تفعيل الذكاء الاصطناعي وحط الـ key."; return; }
  if (aiCfg.audit === false) { el.textContent = "🔁 المراجعة الدورية متوقفة."; return; }
  const st = (await chrome.storage.local.get("aiAudit").catch(() => ({}))).aiAudit || {};
  const now = Date.now(), left = window.AI && AI.work ? Object.values(raw || {}).filter((p) => AI.work(p, now) >= 2).length : 0;
  const uns = (items || []).filter((p) => p.unsure).length;
  el.textContent = `🔁 المراجعة الدورية شغالة — فاضل ${left} بوست للمراجعة` + (st.at ? ` · آخر دورة قبل ${agoTxt(st.at)}: راجعت ${st.checked || 0}، صلّحت ${st.changed || 0}، حكّمت في ${st.judged || 0}` : "") +
    (st.totalChanged ? ` · إجمالي اللي اتصلّح: ${st.totalChanged}` : "") + (uns ? ` · ⚠ مش مؤكد: ${uns}` : "") + (st.error ? ` · ⚠️ ${st.error}` : "");
}

$("saveAuto").addEventListener("click", async () => {
  const cfg = { ...autoCfg, enabled: $("autoEnabled").checked, v91: true, hours: +$("autoHours").value, depth: +$("autoDepth").value,
    wa: $("autoWa").checked, fb: $("autoFb").checked, fbComments: $("autoFbComments").value, revisit: $("autoRevisit").value !== "off", notify: $("autoNotify").checked, notifyOnlyMatches: $("autoOnlyMatch").checked };
  await chrome.storage.local.set({ autoCfg: cfg });
  toast(cfg.enabled ? `اتحفظ — هيشتغل كل ${hrsTxt(cfg.hours)}` : "اتحفظ — السحب التلقائي متوقف");
});
$("runNow").addEventListener("click", () => { chrome.runtime.sendMessage({ type: "runAuto" }); toast("بدأ السحب... هيفتح واتساب وفيسبوك في الخلفية"); });
const readAi = () => ({ ...aiCfg, enabled: $("aiEnabled").checked, key: $("aiKey").value.trim(), model: $("aiModel").value.trim(), auto: $("aiAuto").checked, buyers: $("aiBuyers").checked, audit: $("aiAudit").checked });
$("saveAi").addEventListener("click", async () => { await chrome.storage.local.set({ aiCfg: readAi() }); toast("اتحفظ"); });
$("testAi").addEventListener("click", async () => {
  const cfg = readAi();
  if (!cfg.key) return toast("حط الـ key الأول");
  $("aiMsg").textContent = "بيجرّب...";
  const r = await chrome.runtime.sendMessage({ type: "aiTest", cfg });
  $("aiMsg").textContent = r && r.ok ? `✅ شغال — فهم: ${r.r.summary || r.r.type}` : `❌ ${r ? r.error : "مفيش رد"}`;
});
$("runAiAll").addEventListener("click", async () => {
  await chrome.storage.local.set({ aiCfg: readAi() });
  if (!readAi().key) return toast("حط الـ key الأول");
  chrome.runtime.sendMessage({ type: "aiRun" }); toast("بدأ التحليل");
});
$("saveWords").addEventListener("click", async () => {
  const s = {};
  for (const k of KEYS) s[k] = $("k-" + k).value.split(/\n|,|،/).map((x) => x.trim()).filter(Boolean);
  const { settings: old = {} } = await chrome.storage.local.get("settings");
  await chrome.storage.local.set({ settings: { ...(old || {}), ...s } });
  toast("اتحفظت الكلمات");
});
$("resetWords").addEventListener("click", () => fillWords(null));
const readTplsRaw = () => [...document.querySelectorAll("#tplList .tpl-row")].map((r) => ({ name: r.querySelector(".tpl-name").value.trim() || "رسالة", text: r.querySelector(".tpl-text").value }));
const readTpls = () => readTplsRaw().filter((t) => t.text.trim());
$("tplAdd").addEventListener("click", () => { templates = [...readTpls(), { name: "رسالة جديدة", text: "أهلًا أستاذ {الاسم}، " }]; renderTplEditor(); });
$("tplReset").addEventListener("click", () => { templates = DEFAULT_TPLS; renderTplEditor(); });
$("tplList").addEventListener("click", (e) => { const d = e.target.closest("[data-tpldel]"); if (d) { const l = readTplsRaw(); l.splice(+d.dataset.tpldel, 1); templates = l.filter((t) => t.text.trim()); renderTplEditor(); } }); // الحذف بالترتيب الحقيقي للصفوف قبل ما الفاضي يتشال (كان بيحذف الصف اللي بعده)
$("tplSave").addEventListener("click", async () => {
  await chrome.storage.local.set({ templates: readTpls(), myName: $("myName").value.trim() });
  toast("اتحفظت الرسايل");
});
$("saveDealsReport").addEventListener("click", async () => {
  await chrome.storage.local.set({ dealCfg: { pct: +$("dealPct").value, notify: $("dealNotify").checked },
    reportCfg: { enabled: $("reportEnabled").checked, hour: +$("reportHour").value } });
  toast("اتحفظ");
});
$("backupBtn").addEventListener("click", async () => {
  const d = await chrome.storage.local.get(["posts", "settings", "waGroups", "fbGroups", "comments", "leadMeta", "pipeDeals", "commCfg", "crmReg",
    "listings", "adPosts", "mineSlots", "templates", "myName", "team", "matchFb", "savedSearches", "aiLeads", "dealCfg", "pickUnits", "pickAsks", "plotMk"]); // «عروضي» والقوالب والفريق وتقييمات التطابق… كانت ناقصة والرجوع بيضيّعها
  download(`طلبات-عقارية-نسخة_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(d), "application/json");
});
$("restoreFile").addEventListener("change", async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (d && d.kind === "full-backup" && d.data) { toast(await restoreFull(d)); e.target.value = ""; return; }
    if (d && d.kind === "latest" && (d.posts || d.comments)) { const { app: _a, kind: _k, savedAt, counts, keys: _n, ...data } = d; toast(await restoreFull({ data, counts, savedAt })); e.target.value = ""; return; } // ملف «الحفظ الكامل»
    if (!d || typeof d !== "object" || (!d.posts && !d.comments)) throw new Error("bad");
    toast(await restoreData(d));
  } catch { toast("الملف مش صالح"); }
  e.target.value = "";
});
$("clearBtn").addEventListener("click", async () => {
  if (!Object.keys(raw).length) return;
  if (confirm(`هتمسح كل الـ ${Object.keys(raw).length} طلب/عرض؟ مش هتقدر ترجعهم.`)) { await chrome.storage.local.set({ posts: {}, comments: {} }); toast("اتمسح"); }
});

// ♻️ استرجاع نسخة «تنضيف كامل»: كل حاجة ترجع زي ما كانت (ومن غير ما يمسح الجديد اللي اتسحب بعدها)
const MERGE_OBJ = ["posts", "comments", "adPosts", "leadMeta", "listings", "pickUnits", "pickAsks", "mineHits", "mineDeep", "aiLeads", "alerted", "seenPosts", "seenComments", "fbGroupStats", "pipeDeals", "crmReg",
  "ads", "followupSent", "learn", "matchFb", "fbPostSeen", "trustFix", "accLearned", "dealHist", "waGroupsMeta", "mineSeen", "mineDis", "fixLog", "aiTools", "aiToolData", "aiChats", "aiDrafts"];
async function restoreFull(b) {
  const d = b.data || {}, cur = await chrome.storage.local.get(null), out = {};
  for (const [k, v] of Object.entries(d)) {
    if (k === "backups") continue;
    if (MERGE_OBJ.includes(k) && v && typeof v === "object" && !Array.isArray(v)) out[k] = { ...v, ...(cur[k] || {}) };
    else if (k === "savedSearches" && Array.isArray(v)) { const have = new Set((cur.savedSearches || []).map((s) => s.id)); out[k] = [...(cur.savedSearches || []), ...v.filter((s) => !have.has(s.id))]; }
    else if (k === "mineSlots" && Array.isArray(v)) { const curFilled = (cur.mineSlots || []).filter((s) => s && s.text); out[k] = curFilled.length ? cur.mineSlots : v; }
    else if (cur[k] == null || (b.counts && k === "settings" && !cur.settings)) out[k] = v;
    else if (["settings", "autoCfg", "huntCfg", "alertCfg", "aiCfg", "fbGroups", "waGroups", "mineCfg", "templates", "myName", "team"].includes(k) && JSON.stringify(cur[k]) !== JSON.stringify(v) && cur.backups && cur.backups[0] && cur.backups[0].wipeSettings) out[k] = v; // كانت اترجعت لأول مرة — نرجّع إعداداتك
  }
  // اللي رجع مايتعلّمش كأنه قديم
  if (out.seenPosts) Object.keys(d.posts || {}).forEach((id) => delete out.seenPosts[id]);
  if (out.seenComments) Object.keys(d.comments || {}).forEach((id) => delete out.seenComments[id]);
  await chrome.storage.local.set(out);
  const c = b.counts || {};
  return `♻️ اترجع كل حاجة من نسخة ${new Date(b.savedAt).toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "long" })} — ${c.posts || 0} طلب/عرض، ${c.comments || 0} تعليق، ${c.slots || 0} قطعة في «هاتلي مشتري» ✅`;
}
$("fullResetBtn").addEventListener("click", async () => {
  const wipe = $("resetSettings").checked;
  if (!confirm(`🧹 هيتحفظ كل حاجة في ملف، وبعدين البرنامج يتنضّف ويبدأ من جديد${wipe ? " (والإعدادات كمان ترجع زي أول مرة)" : ""}.\nتقدر ترجّع كل حاجة بعدين من «📂 استرجاع نسخة».\nنكمّل؟`)) return;
  $("fullResetBtn").disabled = true; $("fullResetBtn").textContent = "⏳ بيحفظ وبينضّف…";
  const r = await chrome.runtime.sendMessage({ type: "fullReset", wipeSettings: wipe }).catch((er) => ({ ok: false, error: String(er.message || er) }));
  $("fullResetBtn").disabled = false; $("fullResetBtn").textContent = "🧹 نضّف وابدأ من جديد";
  if (r && r.ok) { toast(`🧹 اتنضّف ✅ — النسخة اتحفظت: ${r.r.filename.split("/").pop()}`); setTimeout(() => location.reload(), 1200); }
  else toast("❌ ما اتنضّفش: " + ((r && r.error) || "حاول تاني"));
});
async function fillBackups() {
  const { backups = [] } = await chrome.storage.local.get("backups");
  $("backupList").innerHTML = backups.length ? "🗂 نسخ التنضيف المحفوظة: " + backups.slice(0, 5).map((x) => `<span class="chip i" title="${esc(x.filename)}">${new Date(x.at).toLocaleString("ar-EG-u-nu-latn", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} · ${x.counts.posts} طلب/عرض</span>`).join(" ") + ` <span>(في التحميلات/AlaaDealsExt/backups)</span>` : "";
}
// استرجاع آمن: بيدمج القديم مع الحالي من غير ما يمسح أي حاجة أحدث
async function restoreData(d) {
  const cur = await chrome.storage.local.get(["posts", "comments", "adPosts", "leadMeta", "listings", "settings", "waGroups", "fbGroups", "templates", "myName", "team", "seenPosts", "seenComments", "pipeDeals", "commCfg", "crmReg", "matchFb", "aiLeads", "savedSearches", "mineSlots", "dealCfg"]);
  const out = {};
  if (d.commCfg && cur.commCfg == null) out.commCfg = d.commCfg;
  for (const k of ["posts", "comments", "adPosts", "leadMeta", "listings", "pipeDeals", "crmReg", "matchFb", "aiLeads", "pickUnits", "pickAsks"]) if (d[k] && typeof d[k] === "object" && !Array.isArray(d[k])) out[k] = { ...d[k], ...(cur[k] || {}) };
  for (const k of ["settings", "waGroups", "fbGroups", "templates", "myName", "team", "dealCfg"]) if (d[k] != null && cur[k] == null) out[k] = d[k];
  if (Array.isArray(d.savedSearches)) { const have = new Set((cur.savedSearches || []).map((x) => x.id)); out.savedSearches = [...(cur.savedSearches || []), ...d.savedSearches.filter((x) => x && !have.has(x.id))]; }
  if (Array.isArray(d.mineSlots) && !(cur.mineSlots || []).some((x) => x && x.text)) out.mineSlots = d.mineSlots;
  const sp = { ...(cur.seenPosts || {}) }, sc = { ...(cur.seenComments || {}) };
  Object.keys(d.posts || {}).forEach((id) => delete sp[id]); Object.keys(d.comments || {}).forEach((id) => delete sc[id]);
  out.seenPosts = sp; out.seenComments = sc;
  await chrome.storage.local.set(out);
  return `اترجع ${Object.keys(d.posts || {}).length} طلب/عرض و${Object.keys(d.comments || {}).length} تعليق ✅`;
}
// ================= أحداث عامة =================
// خلية CSV آمنة: الخلايا اللي بتبدأ بـ = أو @ أو +/- متبوعة بحرف (صيغة إكسل: =HYPERLINK…) بنحط قبلها ' (أسماء الناس ونصوص البوستات جاية من غُرباء)
function csvQ(x) { let s = String(x ?? ""); if (/^[=@\t\r]/.test(s) || /^[+\-][^\d\s.,]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; }
function download(name, content, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; a.style.display = "none"; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
async function updatePost(id, fn) {
  const { posts = {} } = await chrome.storage.local.get("posts");
  if (!posts[id]) return;
  if (fn(posts[id]) === null) delete posts[id];
  await chrome.storage.local.set({ posts });
}

document.addEventListener("click", async (e) => {
  const t = e.target;
  if (uiSkin === "sign" && t.closest(".side-brand") && !t.closest("[data-view]")) { state.view = "home"; return render(); }
  const nv = t.closest("[data-view]"); if (nv) { if (await maybeRefreshInto(nv.dataset.view)) return; state.view = nv.dataset.view; if (state.view === "settings") fillSettings(); return render(); }
  const ts = t.closest("[data-src]"); if (ts) { state.src = ts.dataset.src; state.shown = PAGE; return render(); }
  const tt = t.closest("[data-type]"); if (tt) { state.type = tt.dataset.type; state.shown = PAGE; return render(); }
  const tc = t.closest("[data-cat]"); if (tc) { state.cat = tc.dataset.cat; state.shown = PAGE; return render(); }
  const mt = t.closest("[data-mtier]"); if (mt) { state.mTier = mt.dataset.mtier; state.mCombo = "all"; try { localStorage.setItem("alaaMTier", state.mTier); localStorage.setItem("alaaMCombo", "all"); } catch {} state.mShown = 40; return render(); }
  const mcb = t.closest("[data-mcombo]"); if (mcb) { state.mCombo = ["t1", "t2", "t3"].includes(mcb.dataset.mcombo) ? mcb.dataset.mcombo : "all"; try { localStorage.setItem("alaaMCombo", state.mCombo); } catch {} state.mShown = 40; return render(); }
  const tpu = t.closest("[data-pur]"); if (tpu) { state.pur = ["pure", "suspect", "office"].includes(tpu.dataset.pur) ? tpu.dataset.pur : "all"; state.shown = PAGE; return render(); }
  const mc = t.closest("[data-mcat]"); if (mc) { state.mCat = mc.dataset.mcat; return render(); }
  const sc = t.closest("[data-ssrc]"); if (sc) { state.sSrc = sc.dataset.ssrc; return render(); }
  const gz = t.closest("[data-gz]"); if (gz) { state.guideZone = gz.dataset.gz; return renderGuide(); }
  if (t.closest("[data-showold]")) { state.postDays = 0; $("postDays").value = "0"; return render(); }
  const sr = t.closest("[data-snaprestore]");
  if (sr) {
    const { snapshots = [] } = await chrome.storage.local.get("snapshots");
    const snap = snapshots.find((x) => String(x.at) === sr.dataset.snaprestore);
    if (!snap) return;
    const cur = await chrome.storage.local.get(["posts", "comments", "leadMeta", "listings", "pipeDeals", "matchFb", "crmReg"]);
    const before = Object.keys(cur.posts || {}).length + Object.keys(cur.comments || {}).length;
    await chrome.storage.local.set({ posts: { ...snap.data.posts, ...(cur.posts || {}) }, comments: { ...snap.data.comments, ...(cur.comments || {}) },
      leadMeta: { ...snap.data.leadMeta, ...(cur.leadMeta || {}) }, listings: { ...snap.data.listings, ...(cur.listings || {}) },
      crmReg: { ...(snap.data.crmReg || {}), ...(cur.crmReg || {}) }, pipeDeals: { ...(snap.data.pipeDeals || {}), ...(cur.pipeDeals || {}) }, matchFb: { ...(snap.data.matchFb || {}), ...(cur.matchFb || {}) } });
    const after = Object.keys({ ...snap.data.posts, ...(cur.posts || {}) }).length + Object.keys({ ...snap.data.comments, ...(cur.comments || {}) }).length;
    return toast(after > before ? `اترجع ${after - before} حاجة كانت ناقصة ✅` : "مفيش حاجة ناقصة — الداتا كاملة ✅");
  }
  const bs = t.closest("[data-bestsend]");
  if (bs) { const L = leads.find((x) => x.key === bs.dataset.bestsend); if (L) { const { best } = unitsForLead(L); state.bestFor = ""; return sendToLead(L, offersMsg(L, best)); } }
  if (t.closest("[data-bestclose]")) { state.bestFor = ""; return render(); }
  const tp = t.closest("[data-tpl]"); if (tp) return sendTemplate(tp.closest("[data-tpltarget]").dataset.tpltarget, +tp.dataset.tpl);
  if (t.closest("[data-tplclose]")) { state.tplFor = ""; return render(); }
  const lf = t.closest("[data-lfollow]");
  if (lf) {
    const key = lf.closest("[data-lkey]").dataset.lkey;
    const days = +lf.dataset.lfollow;
    const d = new Date(); d.setDate(d.getDate() + days); d.setHours(10, 0, 0, 0);
    await setLeadMeta(key, { nextAt: days ? d.getTime() : null });
    return toast(days ? `هفكرك ${days === 1 ? "بكرة" : "بعد " + days + " أيام"} الساعة 10 الصبح` : "اتشال التذكير");
  }
  const go = t.closest("[data-goto]");
  if (go) {
    state.view = go.dataset.goto;
    if (go.dataset.gostage) state.lStage = go.dataset.gostage;
    if (go.dataset.gostage === "due") { Object.assign(state, { lLvl: 0, lDays: 0, lKind: "all", lCat: "all", lMoney: "", lRegion: "", lOwner: "", lq: "" }); try { $("lDays").value = "0"; } catch {} } // «متابعات النهارده» بتظهر كل اللي ليهم تذكير (حتى مستوى 0 / أقدم من 30 يوم) — من غير كده الكارت يقول ٧ والشاشة ٣
    if (go.dataset.godeals) { state.onlyDeals = true; state.sort = "deal"; $("sortSel").value = "deal"; }
    if (go.dataset.gostage) $("lStage").value = go.dataset.gostage;
    return render();
  }
  if (t.closest("#sendReport")) { chrome.runtime.sendMessage({ type: "testReport" }); return toast("اتبعت إشعار التقرير"); }
  const lc = t.closest("[data-lcat]"); if (lc) { state.lCat = lc.dataset.lcat; state.lShown = 60; return render(); }
  const lk = t.closest("[data-lkind]"); if (lk) { state.lKind = state.lKind === lk.dataset.lkind && lk.classList.contains("kpi") ? "all" : lk.dataset.lkind; state.lShown = 60; return render(); }
  const ll = t.closest("[data-llvl]"); if (ll) { state.lLvl = +ll.dataset.llvl; state.lShown = 60; return render(); }
  const la = t.closest("[data-lact]");
  if (la) {
    const key = la.closest("[data-lkey]").dataset.lkey;
    if (la.dataset.lact === "tl") { state.lOpen.has(key) ? state.lOpen.delete(key) : state.lOpen.add(key); return render(); }
    if (la.dataset.lact === "best") { state.bestFor = state.bestFor === key ? "" : key; return render(); }
    if (la.dataset.lact === "tpl") { state.tplFor = state.tplFor === "l:" + key ? "" : "l:" + key; return render(); }
    return setLeadStatus(key, la.dataset.lact);
  }
  const ai = t.closest("[data-ai]"); if (ai) { chrome.runtime.sendMessage({ type: "aiRun" }); toast("بدأ التحليل"); return; }
  const cp = t.closest("[data-copy]"); if (cp) { await copyText(cp.dataset.copy); return toast("اتنسخ الرقم"); }
  const tx = t.closest(".text"); if (tx) return tx.classList.toggle("open");
  const act0 = t.closest("[data-act]"), act = act0 && act0.closest(".card") ? act0 : null; // 10.58: أزرار الشاشات التانية (جواز العقار…) ليها handler خاص ومش جوه كارت
  if (act) {
    const id = act.closest(".card").dataset.id;
    const p = byId.get(id);
    if (act.dataset.act === "fix") return openFix(id);
    if (act.dataset.act === "matches") { state.open.has(id) ? state.open.delete(id) : state.open.add(id); return render(); }
    if (act.dataset.act === "toListing") return addSlotFromPost(p, p.type === "request" ? "want" : "offer");
    if (act.dataset.act === "dups") { const k = "d:" + id; state.open.has(k) ? state.open.delete(k) : state.open.add(k); return render(); }
    if (act.dataset.act === "tplPost") { state.tplFor = state.tplFor === "p:" + id ? "" : "p:" + id; return render(); }
    if (act.dataset.act === "copyText") { await copyText(p.text); toast("اتنسخ النص"); }
    if (act.dataset.act === "done") { const r = await chrome.runtime.sendMessage({ type: "phPost", id, op: "done" }).catch(() => null); if (!r || !r.ok) await updatePost(id, (x) => { x.done = !x.done; }); }
    if (act.dataset.act === "del") { const r = await chrome.runtime.sendMessage({ type: "phPost", id, op: "del" }).catch(() => null); if (!r || !r.ok) await updatePost(id, () => null); }
  }
});
$("q").addEventListener("input", (e) => { state.q = e.target.value; state.shown = PAGE; renderSoon(); });
for (const [id, key] of [["regionSel", "region"], ["groupSel", "group"], ["sortSel", "sort"]])
  $(id).addEventListener("change", (e) => { state[key] = e.target.value; state.shown = PAGE; render(); });
$("ownF").addEventListener("change", (e) => { state.ownF = e.target.value; state.shown = PAGE; render(); });
for (const [id, key] of [["onlyDeals", "onlyDeals"], ["hideDups", "hideDups"], ["hideDone", "hideDone"], ["withPhone", "withPhone"], ["withMatch", "withMatch"], ["onlyNew", "onlyNew"], ["mHideDone", "mHideDone"]])
  $(id).addEventListener("change", (e) => { state[key] = e.target.checked; state.shown = PAGE; render(); });
$("moreBtn").addEventListener("click", () => { state.shown += PAGE; render(); });
$("lMore").addEventListener("click", () => { state.lShown += 60; render(); });
$("lFiltersBtn").addEventListener("click", () => document.querySelector("#v-leads .bar").classList.toggle("show"));
$("lq").addEventListener("input", (e) => { state.lq = e.target.value; state.lShown = 60; renderSoon(); });
for (const [id, key] of [["lRegion", "lRegion"], ["lSrc", "lSrc"], ["lSort", "lSort"]])
  $(id).addEventListener("change", (e) => { state[key] = e.target.value; render(); });
document.addEventListener("change", async (e) => {
  const t = e.target;
  if (t.matches("[data-srole]")) { const k = t.closest("[data-lkey]").dataset.lkey; await setLeadMeta(k, { role: t.value }); toast(t.value ? "اتصنّف " + ROLE.ROLES[t.value] + " — وهيتطبق على نفس الرقم كمان" : "رجع تصنيف تلقائي"); }
  if (t.matches("[data-brole]")) { const k = t.closest("[data-lkey]").dataset.lkey; await setLeadMeta(k, { brole: t.value }); toast(t.value === "buyer" ? "اتأكد إنه مشتري ✅" : t.value === "broker" ? "اتصنّف وسيط" : t.value === "not" ? "اتستبعد (مش مشتري)" : "رجع تصنيف تلقائي"); }
  if (t.matches("[data-lstage]")) { await setLeadMeta(t.closest("[data-lkey]").dataset.lkey, { stage: t.value }); toast("اتحدثت المرحلة"); }
  if (t.matches("[data-lowner]")) { await setLeadMeta(t.closest("[data-lkey]").dataset.lkey, { owner: t.value }); toast(t.value ? "اتحدد المسؤول: " + t.value : "اتشال المسؤول"); }
  if (t.matches("#maLevel, #maCat, #maDays, #maContacted")) $("maCount").textContent = `${metaAudience().length} عميل معاهم رقم`;
  if (t.matches("[data-lnote]")) { await setLeadMeta(t.closest("[data-lkey]").dataset.lkey, { note: t.value.trim() }); toast("اتحفظت الملاحظة"); }
});
$("saveAll").addEventListener("click", doSaveAll);
$("newDay").addEventListener("click", async () => {
  const nP = Object.keys(raw).length, nC = Object.keys(comments).length, nA = Object.keys(adPosts).length;
  if (!nP && !nC && !nA) return toast("مفيش داتا لسه — الصفحات فاضية أصلًا");
  if (!confirm(`🌅 يوم جديد\n\nهيتحفظ ${nP} طلب/عرض و${nC} تعليق${nA ? " و" + nA + " بوست إعلان" : ""} في ملف أرشيف (التحميلات ← AlaaDealsExt ← archive)، وبعدين الصفحات هتفضى.\n\nمش هيتمسح: عملائك ومراحلهم وملاحظاتهم، وعروضك، ومنطقتك، وجروباتك، وإعلانات المنافسين.\nواللي اتسحب قبل كده مش هيرجع يظهر كأنه جديد.\n\nتكمل؟`)) return;
  const b = $("newDay"); b.disabled = true; b.textContent = "⏳ بيأرشف...";
  const r = await chrome.runtime.sendMessage({ type: "newDay" }).catch((e) => ({ ok: false, error: String(e) }));
  b.disabled = false; b.textContent = "🌅 يوم جديد";
  if (r && r.ok && r.r && r.r.ok) toast(`✅ اتأرشف ${r.r.counts.posts} طلب/عرض و${r.r.counts.comments} تعليق — صفحة جديدة`);
  else toast("⚠️ ما اتأرشفش: " + ((r && (r.error || (r.r && r.r.empty && "مفيش داتا"))) || "جرّب تاني") + " — ومفيش حاجة اتمسحت");
});
document.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && !e.altKey && String(e.key).toLowerCase() === "s") { e.preventDefault(); doSaveAll(); } });
$("autoPill").addEventListener("click", () => { state.view = "settings"; fillSettings(); render(); });
$("onlyBS").addEventListener("change", (e) => { state.onlyBS = e.target.checked; setAreaOn(e.target.checked); syncAreaBoxes(); state.shown = PAGE; render(); });
$("lOnlyBS").addEventListener("change", (e) => { state.lOnlyBS = e.target.checked; setAreaOn(e.target.checked); syncAreaBoxes(); state.lShown = 60; render(); });
$("fileAuto").addEventListener("change", async (e) => { const { fileCfg = {} } = await chrome.storage.local.get("fileCfg"); await chrome.storage.local.set({ fileCfg: { ...fileCfg, auto: e.target.value } }); toast("اتحفظ"); });
$("saveScope").addEventListener("change", async (e) => { const { fileCfg = {} } = await chrome.storage.local.get("fileCfg"); await chrome.storage.local.set({ fileCfg: { ...fileCfg, scope: e.target.value } }); toast(e.target.value === "all" ? "✅ «💾 حفظ» هيحفظ على كل الأجهزة المتصلة" : "✅ «💾 حفظ» هيحفظ على الجهاز ده بس"); });
chrome.storage.onChanged.addListener((c) => { if (c.saveLog || c.devices || c.__peer) { const v = $("v-settings"); if (v && !v.hidden) renderSaves().catch(() => {}); } });
$("fileNow").addEventListener("click", async () => { const r = await chrome.runtime.sendMessage({ type: "saveFile" }); toast(r && r.ok && r.r ? "📁 اتحفظ الملف في التحميلات ← AlaaDealsExt" + (((await chrome.storage.local.get(["__peer", "fileCfg"])).__peer || {}).on && ((await chrome.storage.local.get("fileCfg")).fileCfg || {}).scope !== "here" ? " — وعلى باقي الأجهزة كمان" : "") : "⚠️ " + ((r && r.error) || "مفيش داتا")); renderStore(); });
$("guideCsv").addEventListener("click", () => {
  const rows = guideRows(state.guideZone);
  const q = csvQ;
  const out = [["المنطقة", "المنطقة الكبيرة", "طلبات", "عروض", "طلب لكل عرض", "سعر متر الشقق", "عدد", "اتجاه السعر %", "سعر متر الأراضي"].join(",")]
    .concat(rows.map((r) => [r.region, PH.zones()[r.zone] || "", r.req, r.off, r.ratio, r.apt || "", r.aptN, r.trend == null ? "" : r.trend, r.land || ""].map(q).join(",")));
  download(`دليل-أسعار-${area.gov.replace(/\s+/g, "-")}_${new Date().toISOString().slice(0, 10)}.csv`, "\ufeff" + out.join("\r\n"), "text/csv;charset=utf-8");
});
$("postDays").addEventListener("change", (e) => { state.postDays = +e.target.value; state.shown = PAGE; render(); });
$("snapNow").addEventListener("click", async () => { const r = await chrome.runtime.sendMessage({ type: "snapshotNow" }); toast(r && r.ok && r.r ? "اتاخدت نسخة احتياطية ✅" : "مفيش داتا لسه"); });
$("lMoney").addEventListener("change", (e) => { state.lMoney = e.target.value; state.lShown = 60; render(); });
$("lOwner").addEventListener("change", (e) => { state.lOwner = e.target.value; state.lShown = 60; render(); });
$("lMeta").addEventListener("click", () => { $("metaPanel").hidden = !$("metaPanel").hidden; $("maCount").textContent = `${metaAudience().length} عميل معاهم رقم`; });
$("maDownload").addEventListener("click", () => {
  const cat = $("maCat").value, list = metaAudience();
  if (!list.length) return toast("مفيش عملاء معاهم أرقام بالاختيارات دي");
  const d = new Date().toISOString().slice(0, 10);
  if (cat === "all") {
    let n = 0;
    for (const k of ["apartment", "land", "villa", "other"]) {
      const part = list.filter((L) => L.category === k);
      if (part.length) { setTimeout(() => download(`جمهور-ميتا_${CAT1[k]}_${d}.csv`, audienceCsv(part), "text/csv;charset=utf-8"), n * 400); n++; }
    }
    toast(`اتنزّل ${n} ملف (ملف لكل نوع)`);
  } else { download(`جمهور-ميتا_${CAT1[cat]}_${d}.csv`, audienceCsv(list), "text/csv;charset=utf-8"); toast(`اتنزّل ${list.length} عميل`); }
});
$("pulseBtn").addEventListener("click", () => { $("pulseBox").hidden = false; if (!$("pulseBrand").value) $("pulseBrand").value = myName || ""; drawPulse(); });
$("pulseRedo").addEventListener("click", drawPulse);
$("pulseDays").addEventListener("change", drawPulse);
$("pulseDl").addEventListener("click", () => { const a = document.createElement("a"); a.href = $("pulseCanvas").toDataURL("image/png"); a.download = `نبض-السوق_${new Date().toISOString().slice(0, 10)}.png`; a.click(); });
$("pulseCopy").addEventListener("click", async () => { await copyText($("pulseCaption").value); toast("اتنسخ الكابشن"); });
$("teamSave").addEventListener("click", async () => { await chrome.storage.local.set({ team: $("teamNames").value.split("\n").map((x) => x.trim()).filter(Boolean) }); toast("اتحفظ الفريق"); });
const readSb = () => ({ url: $("sbUrl").value.trim(), key: $("sbKey").value.trim(), auto: $("sbAuto").checked });
$("sbSave").addEventListener("click", async () => { await chrome.storage.local.set({ sbCfg: readSb() }); toast("اتحفظ"); });
$("sbCopySql").addEventListener("click", async () => { await copyText(globalThis.SYNC.SQL); toast("اتنسخ كود SQL — الصقه في Supabase ← SQL Editor ← Run"); });
$("sbTest").addEventListener("click", async () => { $("sbMsg").textContent = "بيجرّب..."; const r = await chrome.runtime.sendMessage({ type: "sbTest", cfg: readSb() }); $("sbMsg").textContent = r && r.ok ? "✅ الاتصال شغال والجداول موجودة" : "❌ " + (r ? r.error : "مفيش رد"); });
$("sbSyncNow").addEventListener("click", async () => {
  await chrome.storage.local.set({ sbCfg: readSb() }); $("sbMsg").textContent = "بيزامن...";
  const r = await chrome.runtime.sendMessage({ type: "sbSync" });
  $("sbMsg").textContent = r && r.ok ? `✅ اتزامن: ${r.r.posts} بوست، ${r.r.leads} عميل، ${r.r.listings} وحدة` : "❌ " + (r ? r.error : "مفيش رد");
});
$("lStage").addEventListener("change", (e) => { state.lStage = e.target.value; state.lShown = 60; render(); });
$("lDays").addEventListener("change", (e) => { state.lDays = +e.target.value; state.lShown = 60; render(); });
for (const id of ["lMultiPost", "lMultiGroup", "lPhone"])
  $(id).addEventListener("change", (e) => { state[id] = e.target.checked; state.lShown = 60; render(); });
$("lExport").addEventListener("click", () => {
  const list = leadFiltered();
  if (!list.length) return toast("مفيش حد يتصدر");
  const q = csvQ;
  const rows = [["الدرجة", "المستوى", "مهتم جدًا (آخر 30 يوم)", "الاسم", "الأرقام", "لينك البروفايل (لو مفيش رقم)", "الميزانية من", "الميزانية لـ", "نوع الميزانية", "عايز إيه", "تفاصيل", "سأل على (البوستات)", "كلامه", "روابط البوستات", "البروفايل", "ماسنجر", "بيدور على", "المناطق", "الميزانية", "عدد البوستات", "عدد الجروبات", "طلبات نزّلها", "ليه", "آخر نشاط", "المرحلة", "المسؤول", "المتابعة", "ملاحظة", "آخر كلامه"].join(",")];
  for (const L of list) rows.push([L.score, LEADS.levelName(L.level), L.superHot ? "💎 نعم" : "", L.names.join(" / "), L.phones.map((n) => "'" + n).join(" / "),
    LEADS.profileLink(L), L.range ? L.range.min : "", L.range ? L.range.max : "", L.tier ? L.tier.label : "",
    L.want.text, L.want.parts.join(" · "),
    (L.asked.length ? L.asked.map((a) => (a.postText || "").replace(/\s+/g, " ").slice(0, 120)) : L.acts.filter((a) => a.kind === "request").map((a) => "📢 " + a.text.replace(/\s+/g, " ").slice(0, 120))).join(" || "),
    L.asked.flatMap((a) => a.comments).slice(0, 8).join(" | "), L.asked.map((a) => a.postUrl).filter(Boolean).join(" "),
    LEADS.profileLink(L), LEADS.messengerLink(L),
    L.categories.map((c) => CAT1[c]).join(" / "), L.regions.join(" / "), L.budget || "", L.posts, L.groupsCount, L.requests, L.why.join(" · "),
    new Date(L.last).toLocaleDateString("ar-EG-u-nu-latn"), REPORT.STAGES[stageOf(L)], (leadMeta[L.key] || {}).owner || "", (leadMeta[L.key] || {}).nextAt ? new Date(leadMeta[L.key].nextAt).toLocaleDateString("ar-EG-u-nu-latn") : "",
    (leadMeta[L.key] || {}).note || "", (L.acts[0] && L.acts[0].text || "").slice(0, 300)].map(q).join(","));
  const d = new Date();
  download(`عملاء-مهتمين_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}.csv`, "\ufeff" + rows.join("\r\n"), "text/csv;charset=utf-8");
  toast(`اتصدر ${list.length} عميل`);
});
$("filtersBtn").addEventListener("click", () => document.querySelector("#v-posts .bar").classList.toggle("show"));

$("exportBtn").addEventListener("click", () => {
  const list = filtered();
  if (!list.length) return toast("مفيش حاجة تتصدر");
  const q = csvQ;
  const head = ["المصدر", "النوع", "التصنيف", "المنطقة", "السعر", "المقدم", "المساحة", "سعر المتر", "الغرف", "الدور", "التشطيب", "الدفع",
    "المجاورة", "رقم القطعة", "الأوفر", "المدفوع", "الباقي", "نوع الأرض", "حالة الأرض", "مميزات",
    "مطابقات", "لقطة %", "مكررة (ناشرين)", "الأرقام", "المرسل", "سمسار؟", "الجروبات", "التاريخ", "خلصت", "الرابط", "ملخص AI", "النص"];
  const rows = [head.join(",")];
  for (const p of list) rows.push([p.srcs.map((x) => SRC1[x]).join(" / "), TYPE1[p.type], CAT1[p.category], p.region || "",
    p.price || "", p.down || "", p.area || "", PH.ppm(p) || "", p.rooms || "", p.floor || "", p.finishing || "", p.payment || "",
    (p.land || {}).mugawra || "", (p.land || {}).plot || "", (p.land || {}).over || "", (p.land || {}).paid || ((p.land || {}).paidPct ? (p.land || {}).paidPct + "%" : ""), (p.land || {}).remaining || "", (p.land || {}).type || "", ((p.land || {}).status || []).join(" / "), ((p.land || {}).features || []).join(" / "),
    (matches.get(p.id) || []).length, (deals.get(p.id) || {}).pct || "", (clusters.get(p.id) || {}).count || "", p.phones.map((n) => "'" + n).join(" / "), p.sender, p.isBroker === true ? "سمسار" : p.isBroker === false ? "مالك" : "",
    p.groups.join(" / "), fmtWhen(p), p.done ? "نعم" : "", p.url || "", p.summary || "", p.text].map(q).join(","));
  const d = new Date();
  download(`طلبات-عقارية_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}.csv`, "﻿" + rows.join("\r\n"), "text/csv;charset=utf-8");
  toast(`اتصدر ${list.length} صف`);
});

// ===== 🌾 أنواع السحب والعرض + دليل الأراضي =====
document.addEventListener("click", async (e) => {
  const sp = e.target.closest("[data-scrapepop]");
  if (sp) { const pop = $("scrapePop"); if (pop) pop.hidden = !pop.hidden; return; }
  if ($("scrapePop") && !$("scrapePop").hidden && !e.target.closest("#scrapePop")) $("scrapePop").hidden = true;
  if (e.target.closest("[data-viewreset]")) { viewCats = null; saveVC(); setAreaOn(false); syncAreaBoxes(); applyView(); renderCatChips(); state.shown = PAGE; render(); return toast("👁 بتعرض كل اللي بيتسحب — من غير فلاتر"); }
  const vb = e.target.closest("[data-vcat]");
  if (vb) {
    const k = vb.dataset.vcat, V = vcActive();
    if (k === "all") viewCats = null;
    else if (!V) viewCats = new Set([k]);
    else { const nx = new Set(V); nx.has(k) ? nx.delete(k) : nx.add(k); viewCats = nx.size ? nx : null; }
    saveVC(); applyView(); renderCatChips(); state.shown = PAGE; render();
    const V2 = vcActive();
    return toast(V2 ? `👁 بتعرض: ${[...V2].map((x) => CAT_CHIPS[x]).join(" + ")} بس — السحب شغال على كله زي ما هو` : "👁 بتعرض كل اللي بيتسحب");
  }
  const cc = e.target.closest("[data-catchip]");
  if (cc) {
    const k = cc.dataset.catchip; const { settings: old = {} } = await chrome.storage.local.get("settings");
    let next = (old.cats && old.cats.length ? old.cats : ["land", "apartment", "villa", "other"]).slice();
    next = next.includes(k) ? next.filter((x) => x !== k) : [...next, k];
    if (!next.length) return toast("لازم نوع واحد على الأقل");
    await chrome.storage.local.set({ settings: { ...(old || {}), cats: next } });
    return toast(`📥 من دلوقتي بيسحب: ${next.map((x) => CAT_CHIPS[x]).join(" · ")}`);
  }
  const lg = e.target.closest("[data-lgmug]"); if (lg) { const k = "lg:" + lg.dataset.lgmug; state.open.has(k) ? state.open.delete(k) : state.open.add(k); return renderLandGuide(); }
});

// ===== أحداث المشترين/البايعين/التطابق/المنطقة =====
document.addEventListener("click", async (e) => {
  const t = e.target;
  const sc = t.closest("[data-scat]"); if (sc) { state.sCat = sc.dataset.scat; state.sShown = 60; return render(); }
  const scl = t.closest("[data-scls]"); if (scl) { state.sCls = scl.dataset.scls === "all" || state.sCls === scl.dataset.scls ? "all" : scl.dataset.scls; state.sShown = 60; return render(); }
  const lcl = t.closest("[data-lcls]"); if (lcl) { state.lCls = lcl.dataset.lcls === "all" || state.lCls === lcl.dataset.lcls ? "all" : lcl.dataset.lcls; state.lShown = 60; return render(); }
  const sk = t.closest("[data-skind]"); if (sk) { state.sKind = state.sKind === sk.dataset.skind && sk.classList.contains("kpi") ? "all" : sk.dataset.skind; state.sShown = 60; return render(); }
  const ao = t.closest("[data-askowner]"); if (ao) {
    const S = sellers.find((x) => x.key === ao.dataset.askowner); if (!S) return;
    const msg = "السلام عليكم، بخصوص إعلان الوحدة — هل حضرتك مالك الوحدة نفسها ولا بتعرضها لحساب حد؟ (بسأل عشان أعرف أتعامل مع مين في السعر والمعاينة)";
    try { await navigator.clipboard.writeText(msg); } catch {}
    const ph = S.phones[0], link = ph ? PH.waLink(ph) + "?text=" + encodeURIComponent(msg) : LEADS.messengerLink(S) || LEADS.profileLink(S);
    toast(ph ? "فتحت واتساب بالرسالة (ونسختها كمان)" : "نسخت الرسالة — الصقها في الشات"); if (link) window.open(link, "_blank"); return;
  }
  if (t.closest("[data-sopen]")) { const k = t.closest("[data-skey]").dataset.skey; state.sOpen.has(k) ? state.sOpen.delete(k) : state.sOpen.add(k); return render(); }
  if (t.closest("[data-shide]")) { const k = t.closest("[data-skey]").dataset.skey; return setSellerHidden(k); }
  const cb = t.closest("[data-crm]"); if (cb) return crmRegister(cb.dataset.crm, cb.dataset.crms || "");
  const sl = t.closest("[data-stolist]");
  if (sl) { const p = byId.get(sl.dataset.stolist); if (!p) return; return addSlotFromPost(p, "offer"); }
  const ps = t.closest("[data-pairsend]"); if (ps) { const x = pairByEl(ps); if (x) { if (ps.dataset.pairsend === "buyer") await copyPlotFile(x.u, x.B); return sendTo(ps.dataset.pairsend === "buyer" ? x.B : x.S, pairMsg(x, ps.dataset.pairsend)); } }
  if (t.closest("[data-mmore]")) { state.mShown += 40; return render(); }
  const gq = t.closest("[data-gomq]"); if (gq) { state.mq = gq.dataset.gomq; state.mMin = 50; $("mMin").value = "50"; return render(); }
  const acm = t.closest("[data-adcomments]"); if (acm) return startPostJob(acm.dataset.adcomments);
  const ap = t.closest("[data-apkey]");
  if (ap && t.closest("[data-aptoggle]")) { const k = "ap:" + ap.dataset.apkey; state.open.has(k) ? state.open.delete(k) : state.open.add(k); return render(); }
  if (ap && t.closest("[data-apcsv]")) return adPostCsv(adPosts[ap.dataset.apkey]);
  if (ap && t.closest("[data-aprerun]")) return startPostJob(adPosts[ap.dataset.apkey].url);
  if (t.closest("#areaPill")) { state.view = "settings"; fillSettings(); render(); return setTimeout(() => document.querySelector(".area-panel").scrollIntoView({ behavior: "smooth" }), 50); }
});
async function startPostJob(url) {
  if (!/^https?:\/\/(www\.|web\.|m\.)?facebook\.com\//i.test(url || "")) return toast("حط لينك بوست فيسبوك صحيح");
  url = url.replace("://m.facebook.com", "://www.facebook.com");
  await chrome.storage.local.set({ postJob: { url, at: Date.now(), done: false } });
  if (WEB) { try { await WEB.openOnServer(url); toast("🖥 السيرفر بيفتح البوست ويسحب التعليقات… ارجع هنا بعد شوية"); } catch (e) { toast("❌ " + e.message); } return; }
  (window.__AQM_KEEP && __AQM_KEEP.openBg ? __AQM_KEEP.openBg(url) : window.open(url, "_blank")); toast("بيسحب التعليقات في الخلفية من غير ما يفتح صفحة قدامك — ارجع هنا بعد شوية");
}
$("postGo").addEventListener("click", () => startPostJob($("postUrl").value.trim()));
$("postTool").addEventListener("toggle", () => renderPostTool());
$("sq").addEventListener("input", (e) => { state.sq = e.target.value; state.sShown = 60; renderSoon(); });
$("mSearch").addEventListener("input", (e) => { state.mq = e.target.value; state.mShown = 40; renderSoon(); });
$("tq").addEventListener("input", (e) => { state.tq = e.target.value; renderSoon(); });
$("mdq").addEventListener("input", (e) => { state.mdq = e.target.value; renderSlots(); });
$("ssq").addEventListener("input", (e) => { state.ssq = e.target.value; renderSaved(); });
for (const [id, key, num] of [["sRegion", "sRegion"], ["sDays", "sDays", 1], ["sSort", "sSort"], ["mMin", "mMin", 1], ["mBuyer", "mBuyer", 1], ["mRegion", "mRegion"]])
  $(id).addEventListener("change", (e) => { state[key] = num ? +e.target.value : e.target.value; state.sShown = 60; state.mShown = 40; render(); });
for (const id of ["sPhone", "sPriced", "sWithBuyers", "mOwner", "mPhones"])
  $(id).addEventListener("change", (e) => { state[id] = e.target.checked; state.sShown = 60; render(); });
$("sOnlyArea").addEventListener("change", (e) => { state.sOnlyArea = e.target.checked; setAreaOn(e.target.checked); syncAreaBoxes(); state.sShown = 60; render(); });
// كل خانات «📍 منطقتي بس» في الصفحات بتشتغل مع بعض على نفس الفلتر
function syncAreaBoxes() {
  state.onlyBS = state.lOnlyBS = state.sOnlyArea = state.mOnlyArea = areaOn; // التطابقات كمان (كان mOnlyArea مش بيتكتب في أي مكان فالتطابقات تفضل كلها)
  for (const id of ["onlyBS", "lOnlyBS", "sOnlyArea"]) { const el = $(id); if (el) el.checked = areaOn; }
  try { renderCatChips(); } catch {} // تنبيه «معروض X من Y» يتحدّث مع زرار «منطقتك بس»
}
syncAreaBoxes();
$("sMore").addEventListener("click", () => { state.sShown += 60; render(); });
$("sExport").addEventListener("click", () => {
  const list = sellerFiltered(); if (!list.length) return toast("مفيش حد يتصدر");
  const q = csvQ;
  const rows = [["الدرجة", "الاسم", "مالك/سمسار", "الأرقام", "البروفايل", "عدد الوحدات", "الأنواع", "المناطق", "الأسعار من", "لـ", "الوحدات", "روابط", "مشترين مناسبين", "آخر نشاط"].join(",")];
  for (const S of list) rows.push([S.score, S.names.join(" / "), S.band && typeof ROLE !== "undefined" ? ROLE.sellerBadge(S).t.replace(/ ✎/, "") : S.owner ? "مالك" : S.isBroker ? "سمسار" : "", S.phones.map((n) => "'" + n).join(" / "), LEADS.profileLink(S), S.units.length, S.categories.map((c) => CAT1[c]).join(" / "),
    S.regions.join(" / "), S.priceRange ? S.priceRange.min : "", S.priceRange ? S.priceRange.max : "", S.units.map(uLine).join(" || "), S.units.map((u) => u.url).filter(Boolean).join(" "), (buyersBySeller.get(S.key) || []).length, new Date(S.last).toLocaleDateString("ar-EG-u-nu-latn")].map(q).join(","));
  download(`بايعين-محتملين_${new Date().toISOString().slice(0, 10)}.csv`, "﻿" + rows.join("\r\n"), "text/csv;charset=utf-8"); toast(`اتصدر ${list.length} بايع`);
});
$("mExport").addEventListener("click", () => {
  const list = pairFiltered(); if (!list.length) return toast("مفيش تطابقات تتصدر");
  const q = csvQ;
  const rows = [["التطابق %", "المشتري", "رقم المشتري", "بروفايل المشتري", "عايز إيه", "ميزانيته", "البايع", "مالك؟", "رقم البايع", "بروفايل البايع", "الوحدة", "لينك العرض", "ليه"].join(",")];
  for (const x of list) rows.push([x.score, x.B.name, x.B.phones.map((n) => "'" + n).join(" / "), LEADS.profileLink(x.B), x.B.want.text, x.B.range ? x.B.range.mid : "", x.S.name, x.S.band && typeof ROLE !== "undefined" ? ROLE.sellerBadge(x.S).t.replace(/ ✎/, "") : x.S.owner ? "مالك" : x.S.isBroker ? "سمسار" : "",
    x.S.phones.map((n) => "'" + n).join(" / "), LEADS.profileLink(x.S), uLine(x.u), x.u.url || "", x.why.join(" · ")].map(q).join(","));
  download(`تطابقات_${new Date().toISOString().slice(0, 10)}.csv`, "﻿" + rows.join("\r\n"), "text/csv;charset=utf-8"); toast(`اتصدر ${list.length} تطابق`);
});
$("govSel").addEventListener("change", () => { $("k-regions").value = PH.regionsFor($("govSel").value).join("\n"); renderFocusBox([]); });
$("focusMode").addEventListener("change", () => renderFocusBox((settings && settings.focus) || []));
$("regionsReset").addEventListener("click", () => { $("k-regions").value = PH.regionsFor($("govSel").value).join("\n"); renderFocusBox([]); });
$("saveArea").addEventListener("click", async () => {
  const gov = $("govSel").value;
  const focus = $("focusMode").value === "pick" ? [...document.querySelectorAll("#focusBox input:checked")].map((c) => c.value) : [];
  const { settings: old = {} } = await chrome.storage.local.get("settings");
  const regions = $("k-regions").value.split("\n").map((x) => x.trim()).filter(Boolean);
  await chrome.storage.local.set({ settings: { ...(old || {}), gov, regions, focus, strictFocus: $("strictFocus").checked, extractFocus: !!focus.length && $("extractFocus").checked } });
  $("areaMsg").textContent = `✅ اتحفظ — ${gov}${focus.length ? " · " + focus.length + " منطقة" : " كلها"}`;
  toast("اتحفظت منطقتك 📍");
});

// ===== رفرش القسم لما ترجعله =====
// القسم اللي دخلته قبل كده ولما ترجعله من الشريط الجانبي: الصفحة بتتحمّل من جديد (نفس الرفرش بالظبط) من البيانات المحفوظة.
// شغل الخلفية (الحملات/السحب/النشر) مش بيتأثر، وأي حاجة لسه مكتوبة وما اتحفظتش بتتحفظ الأول (window.AQM_FLUSH).
// بس: لو فيه شغلانة شغالة جوه الصفحة نفسها (window.AQM_BUSY) بنكمّل من غير رفرش عشان ما نقطعهاش.
window.AQM_FLUSH = window.AQM_FLUSH || []; window.AQM_BUSY = window.AQM_BUSY || [];
const visitedViews = new Set([state.view]);
let refreshing = false;
async function refreshInto(view, hash) {
  if (refreshing) return true; refreshing = true;
  try {
    const busy = (window.AQM_BUSY || []).map((f) => { try { return f(); } catch { return ""; } }).find(Boolean);
    if (busy) { refreshing = false; toast("⏳ " + busy + " — كمّلنا من غير رفرش عشان ما نقطعهاش"); return false; }
    try { if (window.__AQM_KEEP) __AQM_KEEP.release(); const a = document.activeElement; if (a && a.blur) a.blur(); } catch {}
    await new Promise((r) => setTimeout(r, 40));
    const jobs = (window.AQM_FLUSH || []).map((f) => { try { return Promise.resolve(f()); } catch { return null; } });
    await Promise.race([Promise.allSettled(jobs), new Promise((r) => setTimeout(r, 2500))]);
    // «رفرش» حقيقي = القسم يبدأ من أول شاشة فيه: بننسى التاب الفرعي المحفوظ (واتساب/النشر/واتساب الرسمي) وبعدين نحمّل الصفحة
    try { for (const k of ["wa_tab", "pub_tab", "wc_tab", "wc_step"]) localStorage.removeItem(k); } catch {}
    location.hash = hash || "#v=" + view; location.reload(); return true;
  } catch (e) { refreshing = false; console.warn("refreshInto", e); return false; }
}
async function maybeRefreshInto(view) {
  if (!view || view === state.view) return false;
  if (!ALL_VIEWS.includes(view)) { visitedViews.add(view); return false; }
  const again = visitedViews.has(view); visitedViews.add(state.view);
  if (!again) { visitedViews.add(view); return false; }
  return await refreshInto(view);
}

window.addEventListener("hashchange", () => {
  const h = location.hash;
  if (h === "#settings-area") { state.view = "settings"; fillSettings(); render(); setTimeout(() => document.querySelector(".area-panel").scrollIntoView({ behavior: "smooth" }), 80); return; }
  const v = ({ "#leads": "leads", "#new": "posts", "#deals": "posts", "#today": "today", "#sellers": "sellers", "#matches": "matches", "#saved": "saved", "#pipe": "pipe", "#crm": "crm", "#pick": "pick", "#publish": "publish", "#spread": "spread", "#funnel": "funnel", "#wasend": "wasend", "#passport": "passport", "#atlas": "atlas", "#marketing": "marketing", "#extract": "extract" })[h];
  if (v) { if (v !== state.view && visitedViews.has(v)) { refreshInto(v, h); return; } state.view = v; render(); }
});
load().then(() => { if (location.hash === "#settings-area") window.dispatchEvent(new HashChangeEvent("hashchange")); else if (VIEW_FROM_V === "settings") { try { fillSettings(); } catch {} } });


// ================= ✏️ صحّح =================
const FEATS = ["ناصية", "على شارعين", "بحري", "قبلي", "على الرئيسي", "قدام خدمات"];
const FX_NUM = ["areaM2", "price", "ppm", "over", "paid", "remaining"];
let fixId = null, fixBase = null;
// "2.5 مليون" / "٢٫٥م" / "300 ألف" / "300k" / "2,500,000" → رقم
// kind: من غير نوع = الرقم زي ما هو (عمولة «5.000» = 5000) · "total"/"budget" سعر كلي · "part" أوفر/مدفوع/باقي — الرقم من غير وحدة بيتقرا بالعُرف: «3.200» = 3 مليون و200 ألف، «950» = 950 ألف (PH.shortMoney)
function parseMoney(v, kind) {
  const t = PH.toEn(String(v || "")).replace(/[٬,]/g, "").replace("٫", ".").replace(/\s+/g, " ").trim();
  if (!t) return null;
  const NOAL = "(?![\\u0621-\\u064Aa-z])"; // مفيش حرف بعد اللاحقة (عشان «م» ماتتلقطش من جوه كلمة)
  // «2 مليون و400 ألف» / «مليون ونص» / «مليونين» / «1.5m» / «300k»
  const mm = t.match(new RegExp("(\\d+(?:\\.\\d+)?)?\\s*(مليونين|مليون|ملايين|million|m|م)" + NOAL, "i"));
  let total = 0, found = false;
  if (mm) { found = true; total += (mm[1] ? parseFloat(mm[1]) : /^مليونين$/.test(mm[2]) ? 2 : 1) * 1e6; }
  const rest = mm ? t.replace(mm[0], " ") : t;
  const km = rest.match(new RegExp("(\\d+(?:\\.\\d+)?)\\s*(الف|ألف|آلاف|k)" + NOAL, "i"));
  if (km) { found = true; total += parseFloat(km[1]) * 1e3; }
  else if (mm && /(^|\s)و\s*ن(ص|صف)(?![\u0621-\u064A])/.test(rest)) total += 5e5; // «مليون ونص»
  if (found) return isFinite(total) && total > 0 ? Math.round(total) : null;
  if (kind && /^[\d.]+$/.test(t)) { const raw = PH.toEn(String(v)).replace(/\s+/g, "").replace(/٬/g, ","), sm = PH.shortMoney(raw, kind); if (sm != null) return Math.round(sm); }
  let d = t.replace(/[^\d.]/g, "");
  if (!d) return null;
  if ((d.match(/\./g) || []).length >= 2 || /^\d{1,3}\.\d{3}$/.test(d)) d = d.replace(/\./g, ""); // «1.600.000» / «1.600» = فواصل آلاف مش كسور
  const n = parseFloat(d); return isFinite(n) ? Math.round(n) : null;
}
function fixVals(p) {
  const L = p.land || {};
  return { type: p.type || "", category: p.category || "", region: p.region || "", areaM2: p.areaM2 || "", price: p.price || "", ppm: p.ppmGiven || "",
    mugawra: L.mugawra || "", plot: L.plot || "", over: L.over || "", paid: L.paid || "", remaining: L.remaining || "", landType: L.type || "", features: (L.features || []).slice() };
}
function openFix(id) {
  const p = byId.get(id); if (!p) return;
  fixId = id;
  // الأساس = الاستخراج التلقائي من غير التصحيح القديم (عشان نعرف إيه اللي اتغير)
  const auto = MATCH.enrichAll({ [id]: { ...raw[id], fix: null } }, settings)[0];
  fixBase = auto ? fixVals(auto) : { ...fixVals(p), type: "" }; // الاستخراج التلقائي ما لقاش نوع (البوست ظاهر بس بسبب التصحيح القديم): الأساس من غير نوع عشان النوع يفضل في الـdiff ومايتمسحش
  const cur = fixVals(p);
  $("fixText").textContent = p.text;
  const regs = new Set([...(area.focus || []), ...PH.compile(settings).regions.map((r) => r.name), ...ORD_REG]);
  $("fxRegions").innerHTML = [...regs].map((r) => `<option value="${esc(r)}">`).join("");
  for (const k of Object.keys(cur)) { if (k === "features") continue; const el = $("fx-" + k); if (el) el.value = cur[k] === "" ? "" : FX_NUM.includes(k) ? Number(cur[k]).toLocaleString("en-US") : cur[k]; }
  $("fx-feats").innerHTML = FEATS.map((f) => `<label><input type="checkbox" value="${f}" ${cur.features.includes(f) ? "checked" : ""}> ${f}</label>`).join("");
  $("fixReset").hidden = !(raw[id] && raw[id].fix);
  fixLandVis(); fixMarks();
  $("fixModal").hidden = false;
  setTimeout(() => $("fx-type").focus(), 30);
}
const ORD_REG = ["الحي الأول", "الحي الثاني", "الحي الثالث", "الحي الرابع", "الحي الخامس", "الحي السادس", "الحي السابع", "الحي الثامن", "الحي التاسع", "الحي العاشر", "شمال العاشر", "الحي الحادي عشر", "الحي الثاني عشر", "الحي الثالث عشر", "مسلسل 3", "مسلسل 4"];
function fixLandVis() { document.querySelector(".fix-land").hidden = $("fx-category").value !== "land"; }
function readFix() {
  const v = {};
  for (const k of ["type", "category", "region", "mugawra", "plot", "landType"]) v[k] = $("fx-" + k).value.trim();
  for (const k of FX_NUM) { const raw0 = $("fx-" + k).value.trim(); v[k] = raw0 ? (k === "areaM2" ? parseFloat(PH.toEn(raw0).replace(/[^\d.]/g, "")) || "" : parseMoney(raw0, k === "price" ? "total" : k === "ppm" ? null : "part") || "") : ""; }
  v.features = [...document.querySelectorAll("#fx-feats input:checked")].map((c) => c.value);
  return v;
}
function fixMarks() {
  const v = readFix();
  for (const k of Object.keys(v)) { if (k === "features") continue; const el = $("fx-" + k); if (el) el.classList.toggle("changed", String(v[k]) !== String(fixBase[k])); }
}
// بس الحاجات اللي اختلفت عن التلقائي بتتحفظ
function fixDiff(v) {
  const f = {};
  for (const k of Object.keys(v)) {
    if (k === "features") { if (v.features.slice().sort().join("|") !== fixBase.features.slice().sort().join("|")) f.features = v.features; continue; }
    if (String(v[k]) !== String(fixBase[k]) && v[k] !== "") f[k] = v[k];
  }
  if (f.type === "none") return { type: "none" };
  return f;
}
async function saveFix(fix) {
  const before = fixBase;
  const r = await chrome.runtime.sendMessage({ type: "phPost", id: fixId, op: "fix", fix, before }).catch(() => null);
  if (!r || !r.ok) await updatePost(fixId, (x) => { if (fix && Object.keys(fix).length) x.fix = fix; else delete x.fix; });
  $("fixModal").hidden = true;
  if (accAwait) accAfterFix(fix);
  toast(fix && Object.keys(fix).length ? (fix.type === "none" ? "🚫 اتخفى — مش هيظهر تاني" : "✏️ اتحفظ التصحيح") : "↺ رجع للاستخراج التلقائي");
}
$("fixModal").addEventListener("input", fixMarks);
$("fixModal").addEventListener("change", (e) => { if (e.target.id === "fx-category") fixLandVis(); fixMarks(); });
// قفل نافذة التصحيح (زرار ✕ / الضغط على الخلفية / ESC) — كلها لازم ترجّع نافذة مراجعة الدقة، وإلا accAwait يفضل معلّق ويسجّل مراجعة مزيّفة لبوست تاني
function closeFix() { $("fixModal").hidden = true; if (accAwait) { accAwait = null; $("accModal").hidden = false; accRender(); } }
$("fixModal").addEventListener("click", (e) => { if (e.target.id === "fixModal") closeFix(); });
$("fixClose").onclick = closeFix;
$("fixSave").onclick = () => saveFix(fixDiff(readFix()));
$("fixReset").onclick = () => saveFix(null);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("fixModal").hidden) closeFix(); });
async function fixLogLine() { const { fixLog = [] } = await chrome.storage.local.get("fixLog"); $("fixLogLine").textContent = `✏️ تصحيحاتك: ${fixLog.length} تصحيح`; }
$("fixExport").onclick = async () => {
  const { fixLog = [] } = await chrome.storage.local.get("fixLog");
  if (!fixLog.length) return toast("لسه مفيش تصحيحات");
  const last = new Map(); for (const x of fixLog) last.set(x.id, x); // آخر تصحيح لكل بوست
  const cases = [...last.values()].filter((x) => x.fix).map((x) => ({ text: x.text, expect: { ...x.before, ...x.fix }, auto: x.before, at: new Date(x.at).toISOString() }));
  download(`تصحيحات_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(cases, null, 1), "application/json");
};


// ================= 🔔 دوّرلي على =================
let ssEdit = null, ssExtra = {};
const ssOpen = new Set();
const SS_NUM = ["areaMin", "areaMax", "priceMax", "ppmMax", "overMax"];
function ssRegionNames() {
  const base = ["الحي السابع", "الحي الثامن", "الحي العاشر", "شمال العاشر", "الحي الحادي عشر", "الحي الثاني عشر", "الحي الثالث عشر", "مسلسل 3", "مسلسل 4"];
  return [...new Set([...(area.focus || []), ...(area.gov === "بني سويف" ? base : [])])];
}
function ssFill(s) {
  s = s || { type: "offer", category: cats.length === 1 ? cats[0] : "land", regions: [] };
  $("ssFormTitle").textContent = ssEdit ? "✏️ عدّل البحث" : "➕ بحث جديد";
  for (const k of ["name", "phone", "type", "category", "landType", "words"]) $("ss-" + k).value = s[k] || "";
  $("ss-desc").value = s.desc || ""; $("ss-min").value = String(+s.minScore || 70); $("ss-fb").checked = s.fbSearch !== false;
  ssExtra = { rooms: s.rooms || null, finishing: s.finishing || null, outside: !!s.outside, place: s.place || null, placeName: s.placeName || null };
  $("ss-queries").value = (s.queries || []).join("\n"); $("ssMore").open = !s.desc && !!ssEdit; ssParsedChips(s.desc ? s : null);
  $("ss-type").value = s.type || "offer"; $("ss-category").value = s.category == null ? "land" : s.category;
  for (const k of SS_NUM) $("ss-" + k).value = s[k] ? (/price|over/.test(k) ? PH.fmtPrice(s[k]) : s[k]) : "";
  $("ss-corner").checked = !!s.corner;
  const names = [...new Set([...ssRegionNames(), ...(s.regions || [])])];
  $("ss-regions").innerHTML = names.map((n) => `<label class="fchip"><input type="checkbox" value="${esc(n)}" ${(s.regions || []).includes(n) ? "checked" : ""}> ${esc(n)}</label>`).join("");
  $("ssForm").hidden = false; ssPreview();
  $("ssForm").scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => $("ss-name").focus(), 200);
}
function ssRead() {
  const s = { name: $("ss-name").value.trim(), phone: PH.toEn($("ss-phone").value).replace(/[^\d+]/g, ""), type: $("ss-type").value, category: $("ss-category").value,
    landType: $("ss-landType").value, words: $("ss-words").value.trim(), corner: $("ss-corner").checked,
    regions: [...document.querySelectorAll("#ss-regions input:checked")].map((c) => c.value) };
  for (const k of SS_NUM) { const v = $("ss-" + k).value.trim(); s[k] = v ? (/area/.test(k) ? parseFloat(PH.toEn(v).replace(/[^\d.]/g, "")) || null : parseMoney(v, k === "priceMax" ? "total" : k === "overMax" ? "part" : null)) : null; }
  s.desc = $("ss-desc").value.trim(); s.minScore = +$("ss-min").value || 70; s.fbSearch = $("ss-fb").checked;
  if (ssExtra.outside) { s.outside = true; s.place = ssExtra.place; s.placeName = ssExtra.placeName; s.regions = []; }
  if (ssExtra.rooms && s.category !== "land") s.rooms = ssExtra.rooms; if (ssExtra.finishing && s.category !== "land") s.finishing = ssExtra.finishing;
  s.queries = $("ss-queries").value.split("\n").map((x) => x.trim()).filter(Boolean);
  if (s.category !== "land") { s.landType = ""; s.overMax = null; s.corner = false; }
  return s;
}
// كاش نتايج كل بحث (٥٠ بحث × ١٨ ألف عنصر = ١.٣ ثانية في كل رسم أثناء السحب): بيتجدد لما العناصر أو البحث نفسه يتغيّروا
const _hitsCache = new Map();
function hitsForCached(s) {
  if (!s || !s.id) return ALERTS.hitsFor(s, items);
  const sig = JSON.stringify(s), c = _hitsCache.get(s.id);
  if (c && c.items === items && c.n === items.length && c.sig === sig) return c.hits;
  const hits = ALERTS.hitsFor(s, items); if (_hitsCache.size > 300) _hitsCache.clear();
  _hitsCache.set(s.id, { items, n: items.length, sig, hits }); return hits;
}
function ssPreview() {
  const s = ssRead();
  const h = ALERTS.hitsFor(s, items);
  $("ssPreview").textContent = `${ALERTS.describe(s) || "—"}  ←  فيه ${h.length} نتيجة دلوقتي${h.length ? ` (أعلى تطابق ${h[0].score}%)` : ""}`;
}
function ssParsedChips(s) {
  if (!s) { $("ssParsed").innerHTML = ""; return; }
  const CAT = { land: "🟫 أرض", apartment: "🏢 شقة", villa: "🏡 فيلا", other: "🏬 تاني" };
  const ch = [s.type === "request" ? "🔵 بيدوّر على مشترين" : "🟢 بيدوّر على عروض", CAT[s.category] || "", ...(s.regions || []).map((r) => "📍 " + r),
    s.areaMin || s.areaMax ? `📐 ${s.areaMin || 0}–${s.areaMax || "∞"} م²` : "", s.priceMax ? "💰 لحد " + PH.fmtPrice(s.priceMax) : "", s.ppmMax ? "المتر ≤ " + fmtN(s.ppmMax) : "",
    s.overMax ? "أوفر ≤ " + PH.fmtPrice(s.overMax) : "", s.landType || "", s.corner ? "ناصية" : "", s.words ? "«" + s.words + "»" : ""].filter(Boolean);
  if (s.outside) ch.splice(2, 0, "📍 " + (s.placeName || s.place || "برا") + " (برا " + area.gov + ")");
  if (!s.outside && !(s.regions || []).length && !s.areaMin && !s.areaMax && !s.priceMax && !s.ppmMax && !s.overMax && !s.landType && !s.corner && !s.words && !s.rooms) ch.push("⚠️ حدد حي أو مساحة أو سعر — من غير كده مش هيبلّغك بحاجة");
  $("ssParsed").innerHTML = "✨ فهمت: " + ch.map((x) => `<span class="chip">${esc(x)}</span>`).join("");
}
// بيملا الخانات من الوصف
function ssApplyDesc(force) {
  const d = $("ss-desc").value.trim(); if (!d) return false;
  const p = ALERTS.parseDesc(d, PH.compile(settings));
  const cur = ssRead();
  const s = { ...cur, ...p, name: cur.name || p.name, phone: cur.phone || (PH.extractPhones(d)[0] || ""), minScore: cur.minScore, fbSearch: cur.fbSearch };
  s.queries = ALERTS.queriesFor(s, area.gov);
  const keepEdit = ssEdit; ssFill(s); ssEdit = keepEdit; $("ssFormTitle").textContent = ssEdit ? "✏️ عدّل البحث" : "➕ بحث جديد";
  if (force) $("ssMore").open = true;
  return true;
}
$("ssParse").onclick = () => { if (!ssApplyDesc(true)) { $("ss-desc").focus(); toast("اكتب طلب العميل الأول"); } };
async function ssPersist(list) { savedSearches = list; await chrome.storage.local.set({ savedSearches: list }); }
function renderSaved() {
  // أول ما تفتح الصفحة، الجديد بيتعلّم إنه اتشاف
  for (const s of savedSearches) if (s.newHits || (savedSearches.length === 1 && !ssOpen.has("_init"))) ssOpen.add(s.id);
  ssOpen.add("_init");
  if (savedSearches.some((s) => s.newHits)) { const l = savedSearches.map((s) => ({ ...s, seenNew: s.newHits || 0, newHits: 0 })); chrome.storage.local.set({ savedSearches: l }); savedSearches = l; }
  if (!savedSearches.length) {
    $("ssList").innerHTML = `<div class="ss-empty"><b>لسه مفيش بحث محفوظ</b>دوس «➕ بحث جديد» واكتب اللي عميلك عايزه — أو من صفحة 🛒 المشترين دوس «🔔 دوّرله» على أي عميل.</div>`;
    return;
  }
  const tgOk = alertCfg.tgToken && alertCfg.tgChat && alertCfg.tgOn !== false;
  // 🔎 سيرش «دوّرلي على»: اسم العميل / رقمه / وصف البحث / حي — أو أي نتيجة فيها الكلمة
  const sq = qNorm(state.ssq);
  const ssRows = savedSearches.map((s) => {
    const hitsAll = hitsForCached(s);
    if (!sq) return { s, hitsAll, hits: hitsAll, qOpen: false };
    const sm = qOK(sq, [s.name, s.desc, ALERTS.describe(s), (s.regions || []).join(" ")].filter(Boolean).join(" "), [s.phone]);
    const hq = hitsAll.filter(({ p, why }) => qOK(sq, [p.text, p.sender, p.region, ALERTS.unitLine(p), (why || []).join(" ")].filter(Boolean).join(" "), p.phones, { cats: [p.category] }));
    return sm || hq.length ? { s, hitsAll, hits: sm ? hitsAll : hq, qOpen: !sm && hq.length > 0 } : null;
  }).filter(Boolean);
  { const si = $("ssq"); if (si && si.value !== (state.ssq || "")) si.value = state.ssq || ""; }
  if (sq && !ssRows.length) { $("ssList").innerHTML = `<div class="ss-empty"><b>مفيش نتيجة للبحث «${esc(state.ssq.trim())}»</b>جرّب اسم العميل أو رقمه أو الحي أو كلمة من الطلب.</div>`; return; }
  $("ssList").innerHTML = (tgOk ? "" : `<div class="ss-empty" style="padding:12px;margin-bottom:12px;text-align:start">📞 عايز التنبيهات توصلك على الموبايل؟ <a href="#" data-gotg>فعّل تليجرام من الإعدادات</a> (دقيقتين).</div>`) +
    ssRows.map(({ s, hitsAll, hits, qOpen }) => {
      const open = ssOpen.has(s.id) || qOpen;
      const newer = hitsAll.filter((h) => (h.p.scannedAt || 0) > (s.createdAt || 0)).length;
      return `<div class="ss-card ${s.active === false ? "off" : ""}" data-ss="${s.id}">
        <div class="ss-top"><h3>🔔 ${esc(s.name || "بحث")}${s.seenNew ? ` <span class="ss-new">🆕 ${s.seenNew} جديد</span>` : ""}</h3>
          <span class="ss-n" title="النتايج في الداتا دلوقتي">${hitsAll.length} نتيجة${sq ? ` · 🔍 ${hits.length}` : ""}</span>
          <button class="btn sm" data-ssact="open">${open ? "▲ اخفي" : "👁 النتايج"}</button>
          <button class="btn sm" data-ssact="toggle">${s.active === false ? "▶ شغّل" : "⏸ وقّف"}</button>
          <button class="btn sm" data-ssact="edit">✏️</button>
          <button class="btn sm danger" data-ssact="del">🗑</button></div>
        <div class="ss-desc">${esc(ALERTS.describe(s))}${s.phone ? " · 📞 " + esc(s.phone) : ""}${s.lastHit ? " · آخر تنبيه " + fmtAgo(s.lastHit) : ""}${newer ? ` · ${newer} جديدة من ساعة ما حفظته` : ""}</div>
        ${s.desc ? `<div class="ss-desc muted">📝 «${esc(s.desc.slice(0, 200))}»</div>` : ""}
        ${open ? `<div class="ss-hits">${hits.slice(0, 40).map(({ p, why, score }) => `<div class="ss-hit" data-id="${p.id}">
            <div class="l1"><span class="ss-score ${score < 85 ? "mid" : ""}">${score}%</span> ${p.type === "request" ? "🔵" : "🟢"} ${esc(ALERTS.unitLine(p))}<span class="muted" style="font-weight:400">📌 ${esc((p.groups && p.groups[0]) || "")}</span><span class="when muted" style="font-weight:400">${fmtWhen(p)}</span></div>
            <div class="why">✔ ${esc(why.join(" · ") || "مطابق")}</div>
            <div class="tx">${esc(p.text)}</div>
            <div class="acts">${postLink(p, "btn sm", "🔗 البوست")}${phonesHtml(p)}
              ${s.phone ? `<a class="btn sm wa" target="_blank" href="${PH.waLink(PH.normPhone(s.phone) || s.phone)}?text=${encodeURIComponent(ssMsg(s, p))}">💬 ابعتها لـ ${esc((s.name || "").split(/[—-]/)[0].trim() || "العميل")}</a>` : ""}</div>
          </div>`).join("") || `<div class="muted">لسه مفيش — أول ما ينزل حاجة مناسبة هيوصلك تنبيه 🔔</div>`}${hits.length > 40 ? `<div class="muted">+${hits.length - 40} كمان</div>` : ""}</div>` : ""}
      </div>`;
    }).join("");
}
const fmtAgo = (t) => { const m = Math.round((Date.now() - t) / 6e4); return m < 60 ? `من ${Math.max(1, m)} د` : m < 1440 ? `من ${Math.round(m / 60)} س` : `من ${Math.round(m / 1440)} يوم`; };
function ssMsg(s, p) {
  const nm = (s.name || "").split(/[—-]/)[0].trim();
  return `أهلًا${nm ? " " + nm : ""} 👋\nلقيتلك ${ALERTS.unitLine(p)}${p.url ? "\n" + p.url : ""}\nلو مناسبة كلمني نرتب معاينة.${myName ? "\n" + myName : ""}`;
}
$("ssNew").onclick = () => { ssEdit = null; ssFill(null); };
$("ssCancel").onclick = () => { $("ssForm").hidden = true; ssEdit = null; };
$("ssForm").addEventListener("input", (e) => { if (e.target.id === "ss-desc") $("ssParsed").innerHTML = ""; ssPreview(); });
$("ssForm").addEventListener("change", ssPreview);
let ssSaving = false;
$("ssSave").onclick = async () => {
  if (ssSaving) return; ssSaving = true; try { await ssSave1(); } finally { ssSaving = false; } // ضغطتين سريعتين كانوا بيعملوا بحثين وتنبيهات مكررة
};
async function ssSave1() {
  // كتب وصف وما دوسش «افهم»؟ نفهمه احنا
  if ($("ss-desc").value.trim() && !$("ssParsed").innerHTML) ssApplyDesc(false);
  const s = ssRead();
  if (!s.name) { $("ss-name").focus(); return toast("اكتب اسم العميل (أو اسم للبحث)"); }
  if (s.fbSearch && !s.queries.length) s.queries = ALERTS.queriesFor(s, area.gov);
  // حي برا مناطق التركيز؟ نضيفه عشان السحب مايتجاهلوش
  const { settings: st0 = {} } = await chrome.storage.local.get("settings");
  const miss = (s.regions || []).filter((r) => st0.extractFocus && !(st0.focus || []).includes(r));
  if (miss.length) { await chrome.storage.local.set({ settings: { ...st0, focus: [...(st0.focus || []), ...miss] } }); toast("📍 ضفت " + miss.join("، ") + " لمناطق السحب"); }
  const { savedSearches: cur = [] } = await chrome.storage.local.get("savedSearches");
  if (ssEdit) { const i = cur.findIndex((x) => x.id === ssEdit); if (i >= 0) cur[i] = { ...cur[i], ...s }; }
  else cur.unshift({ id: "s" + Date.now().toString(36), createdAt: Date.now(), active: true, hits: 0, ...s });
  await ssPersist(cur);
  // اللي موجود دلوقتي ميتبعتش كتنبيه — التنبيه للجديد بس
  const { alerted = {} } = await chrome.storage.local.get("alerted");
  const sid = ssEdit || cur[0].id;
  for (const h of ALERTS.hitsFor(s, items)) alerted["s:" + sid + ":" + h.p.id] = Date.now();
  await chrome.storage.local.set({ alerted });
  $("ssForm").hidden = true; ssOpen.add(sid); ssEdit = null;
  toast("🔔 اتحفظ — أول ما ينزل حاجة مناسبة هيوصلك تنبيه");
  render();
}
document.addEventListener("click", async (e) => {
  const g = e.target.closest("[data-gotg]"); if (g) { e.preventDefault(); state.view = "settings"; fillSettings(); render(); setTimeout(() => document.querySelector(".tg-panel").scrollIntoView({ behavior: "smooth" }), 80); return; }
  const f = e.target.closest("[data-ssfrom]");
  if (f) {
    const L = leads.find((x) => x.key === f.dataset.ssfrom); if (!L) return;
    const w = (L.want && L.want.obj) || {};
    ssEdit = null; state.view = "saved"; render();
    ssFill({ name: L.name, phone: L.phones[0] || "", desc: L.want.aiSummary || [L.want.text, ...L.want.parts].join("، "), type: "offer", category: (w.cats && w.cats[0]) || "land", regions: w.regions || [],
      areaMin: w.area ? Math.round(w.area * 0.85) : null, areaMax: w.area ? Math.round(w.area * 1.15) : null, priceMax: typeof w.budget === "number" ? w.budget : (w.budget && w.budget.max) || null,
      landType: w.landType || "", corner: !!w.corner, overMax: w.over || null });
    return;
  }
  const b = e.target.closest("[data-ssact]"); if (!b) return;
  const id = b.closest("[data-ss]").dataset.ss, s = savedSearches.find((x) => x.id === id); if (!s) return;
  const act = b.dataset.ssact;
  if (act === "open") { ssOpen.has(id) ? ssOpen.delete(id) : ssOpen.add(id); return renderSaved(); }
  if (act === "edit") { ssEdit = id; return ssFill(s); }
  if (act === "toggle") { await ssPersist(savedSearches.map((x) => (x.id === id ? { ...x, active: x.active === false } : x))); return renderSaved(); }
  if (act === "del") { if (!confirmDel(s.name)) return; await ssPersist(savedSearches.filter((x) => x.id !== id)); return renderSaved(); }
});
function confirmDel(name) { return window.confirm(`امسح البحث «${name}»؟`); }

// ================= 📞 تليجرام =================
function fillTg() {
  const c = alertCfg || {}, on = { saved: true, deals: true, hot: true, pairs: true, ...(c.on || {}) };
  $("tgToken").value = c.tgToken || ""; $("tgChat").value = c.tgChat || "";
  $("tgOn").checked = c.tgOn !== false;
  $("tgReqs").checked = c.on ? c.on.reqs !== false : true;
  $("tgMine").checked = c.on ? c.on.mine !== false : true;
  $("tgSaved").checked = on.saved; $("tgDeals").checked = on.deals; $("tgHot").checked = on.hot; $("tgPairs").checked = on.pairs; $("tgPure").checked = (c.on || {}).pure !== false;
  $("tgPairMin").value = c.pairMin || 85;
  $("tgPairOwner").checked = !!c.pairOwner;
  const on2 = { summary: true, offers: false, morning: true, follow: true, mineDone: true, ...(c.on || {}) };
  $("tgSummary").checked = on2.summary; $("tgOffers").checked = on2.offers; $("tgMorning").checked = on2.morning; $("tgFollow").checked = on2.follow; $("tgMineDone").checked = on2.mineDone;
  $("tgCmd").checked = c.tgCmd !== false;
  $("tgMsg").textContent = c.tgToken && c.tgChat ? `✅ متوصّل${c.tgName ? " بـ " + c.tgName : ""}${c.tgBot ? " (@" + c.tgBot + ")" : ""}` : "لسه مش متوصّل";
}
function readTg() {
  return { ...(alertCfg || {}), tgToken: $("tgToken").value.trim(), tgChat: $("tgChat").value.trim(), tgOn: $("tgOn").checked, pairMin: Math.min(100, Math.max(60, +$("tgPairMin").value || 85)), pairOwner: $("tgPairOwner").checked,
    tgCmd: $("tgCmd").checked, tgCmdsSet: false,
    on: { mine: $("tgMine").checked, reqs: $("tgReqs").checked, saved: $("tgSaved").checked, deals: $("tgDeals").checked, hot: $("tgHot").checked, pairs: $("tgPairs").checked, pure: $("tgPure").checked,
      summary: $("tgSummary").checked, offers: $("tgOffers").checked, morning: $("tgMorning").checked, follow: $("tgFollow").checked, mineDone: $("tgMineDone").checked } };
}
$("tgSave").onclick = async () => { alertCfg = readTg(); await chrome.storage.local.set({ alertCfg }); $("tgMsg").textContent = "✅ اتحفظ"; toast("📞 اتحفظت إعدادات تليجرام"); };
// 🔗 ربط بخطوة واحدة: نتأكد من التوكن، نفتح البوت، ونستنى «Start» ونلقط الشات لوحده
let tgLinking = false;
$("tgLink").onclick = async () => {
  if (tgLinking) return; // ضغطتين كانوا بيشغّلوا حلقتين getUpdates ويبعتوا رسالة التأكيد مرتين
  tgLinking = true; try { await tgLink1(); } finally { tgLinking = false; }
};
async function tgLink1() {
  const token = $("tgToken").value.trim(); if (!token) { $("tgToken").focus(); return ($("tgMsg").textContent = "حط توكن البوت الأول (من @BotFather)"); }
  $("tgMsg").textContent = "⏳ بيتأكد من التوكن…";
  const me = await chrome.runtime.sendMessage({ type: "tgMe", token }).catch((e) => ({ ok: false, error: String(e.message || e) }));
  if (!me || !me.ok) return ($("tgMsg").textContent = "❌ التوكن غلط — انسخه تاني من @BotFather");
  const link = `https://t.me/${me.r.username}?start=alaa`;
  $("tgLinkBox").hidden = false;
  $("tgLinkBox").innerHTML = `✅ البوت بتاعك: <b>@${esc(me.r.username)}</b> — <a class="btn sm primary" href="${link}" target="_blank">📲 افتح البوت ودوس Start</a> <span class="muted" id="tgWait">⏳ مستني تدوس Start…</span>`;
  window.open(link, "_blank");
  for (let i = 0; i < 45; i++) { // لحد دقيقة ونص
    await new Promise((r) => setTimeout(r, 2000));
    const r = await chrome.runtime.sendMessage({ type: "tgChatId", token }).catch(() => null);
    if (r && r.ok && r.r) {
      $("tgChat").value = r.r.id;
      alertCfg = { ...readTg(), tgToken: token, tgChat: r.r.id, tgName: r.r.name, tgBot: me.r.username, tgOn: true };
      await chrome.storage.local.set({ alertCfg }); cfgOwnAt = Date.now(); cfgTouched.clear();
      await chrome.runtime.sendMessage({ type: "tgTest", cfg: alertCfg }).catch(() => null);
      $("tgLinkBox").innerHTML = `🎉 <b>اتربط</b> بـ ${esc(r.r.name || r.r.id)} عن طريق @${esc(me.r.username)} — بصّ على تليجرام، بعتلك رسالة تأكيد. ابعت للبوت <code>/help</code> تشوف الأوامر.`;
      $("tgMsg").textContent = "✅ متوصّل"; toast("📞 تليجرام اتربط ✅"); return;
    }
  }
  const w = $("tgWait"); if (w) w.textContent = "❗ ما وصلش Start — افتح البوت ودوس Start وبعدين «🔗 اربط» تاني";
}
$("tgGetChat").onclick = async () => {
  const token = $("tgToken").value.trim(); if (!token) return ($("tgMsg").textContent = "حط التوكن الأول");
  $("tgMsg").textContent = "⏳ بدوّر…";
  const r = await chrome.runtime.sendMessage({ type: "tgChatId", token }).catch((e) => ({ ok: false, error: String(e.message || e) }));
  if (!r || !r.ok) return ($("tgMsg").textContent = "❌ " + ((r && r.error) || "مفيش رد"));
  if (!r.r) return ($("tgMsg").textContent = "❗ ابعت أي رسالة للبوت بتاعك على تليجرام الأول، وبعدين دوس تاني");
  $("tgChat").value = r.r.id; alertCfg = { ...readTg(), tgName: r.r.name }; await chrome.storage.local.set({ alertCfg }); cfgOwnAt = Date.now(); cfgTouched.clear();
  $("tgMsg").textContent = `✅ لقيته: ${r.r.name || r.r.id} — دوس «📨 جرّب»`;
};
$("tgTest").onclick = async () => {
  const cfg = readTg(); if (!cfg.tgToken || !cfg.tgChat) return ($("tgMsg").textContent = "حط التوكن ورقم الشات الأول");
  $("tgMsg").textContent = "⏳ ببعت…";
  const r = await chrome.runtime.sendMessage({ type: "tgTest", cfg }).catch((e) => ({ ok: false, error: String(e.message || e) }));
  $("tgMsg").textContent = r && r.ok ? "✅ وصلت؟ بص على تليجرام" : "❌ " + ((r && r.error) || "مفيش رد");
  if (r && r.ok) { alertCfg = cfg; await chrome.storage.local.set({ alertCfg }); cfgOwnAt = Date.now(); cfgTouched.clear(); }
};
document.querySelectorAll("#nav button").forEach((b) => { const s = b.querySelector("span"); if (s && !b.title) b.title = s.textContent; });
document.querySelectorAll("#nav button[data-view]").forEach((b) => { const s = b.querySelector("span"); if (s && !b.title) b.title = s.textContent.trim(); });
if (window.alaaApp) document.documentElement.classList.add("in-app"); // جوه البرنامج: اللوجو موجود فوق في شريط البرنامج


// ================= 🎯 مصادر زيادة + ⚡ الصياد السريع =================
const HUNT_UI_DEF = {
  search: { on: true, perRun: 5, queries: ["مطلوب ارض بني سويف الجديدة", "ارض للبيع بني سويف الجديدة", "مطلوب قطعة ارض الحي العاشر بني سويف",
    "ارض للبيع الحي الحادي عشر بني سويف", "ارض للبيع الحي الثاني عشر بني سويف", "ارض مسلسل بني سويف", "ارض شمال العاشر بني سويف", "ارض الحي السابع بني سويف الجديدة",
    "مطلوب شقة بني سويف الجديدة", "شقة للبيع بني سويف الجديدة", "مطلوب شقة تمليك بني سويف", "فيلا للبيع بني سويف الجديدة", "مطلوب فيلا بني سويف"] },
  mp: { on: true, perRun: 3, queries: ["", "ارض بني سويف الجديدة", "قطعة ارض بني سويف", "شقة للبيع بني سويف", "فيلا للبيع بني سويف"] },
  fast: { on: true, live: true, minutes: 10, slugs: [], maxGroups: 6, extra: 4, gap: 60, withSearch: true, maxPerHour: 140, night: true },
};
const MP_ALL = "عقارات للبيع";
let huntRaw = {};
async function fillHunt() {
  const d = await chrome.storage.local.get(["huntCfg", "fbGroups", "fbGroupStats", "fastLog", "mpIssue"]);
  $("hMpWarn").hidden = !(d.mpIssue && d.mpIssue.why === "page");
  huntRaw = d.huntCfg || {};
  const h = { search: { ...HUNT_UI_DEF.search, ...(huntRaw.search || {}) }, mp: { ...HUNT_UI_DEF.mp, ...(huntRaw.mp || {}) }, fast: { ...HUNT_UI_DEF.fast, ...(huntRaw.fast || {}) } };
  $("hSearchOn").checked = h.search.on; $("hSearchQ").value = h.search.queries.join("\n"); $("hSearchN").value = String(h.search.perRun);
  $("hMpOn").checked = h.mp.on; $("hMpQ").value = h.mp.queries.map((q) => q || MP_ALL).join("\n"); $("hMpN").value = String(h.mp.perRun);
  $("hFastOn").checked = h.fast.on; $("hFastMin").value = h.fast.live !== false ? "0" : String(h.fast.minutes); $("hFastSearch").checked = h.fast.withSearch;
  const st = d.fbGroupStats || {};
  const rate = (x) => (x ? (x.hist && x.hist.length ? x.hist.reduce((a, b) => a + b, 0) / x.hist.length : x.found || 0) : 0); // متوسط الجديد في الزيارة — بيرتّب الصياد على أساسه
  const groups = (d.fbGroups || []).filter((g) => g.checked).sort((a, b) => rate(st[b.slug]) - rate(st[a.slug]) || ((st[b.slug] || {}).total || 0) - ((st[a.slug] || {}).total || 0));
  $("hFastGroups").innerHTML = groups.length ? groups.map((g) => `<label class="fchip"><input type="checkbox" value="${esc(g.slug)}" ${h.fast.slugs.includes(g.slug) ? "checked" : ""}> ${esc(g.name.slice(0, 40))} <small title="متوسط الجديد في الزيارة">${(Math.round(rate(st[g.slug]) * 10) / 10) || 0}</small></label>`).join("")
    : `<span class="muted sm">لسه مفيش جروبات — اجمعها من لوحة فيسبوك الأول</span>`;
  const fl = d.fastLog || {};
  const WHY = { checkpoint: "فيسبوك طالب تأكيد هوية — افتحه وكمّل بنفسك", login: "فيسبوك مش مسجّل دخول", empty: "السحب مش بيلقط بوستات — بيرجع لوحده بعد شوية", restricted: "🛡 وضع الحماية — فيسبوك قيّد الحساب مؤقتًا، بيرجع لوحده بعد شوية" };
  const paused = fl.pause && fl.pause.until > Date.now();
  const laps = (fl.runs || 0) + (fl.hotPasses || 0), lastAt = Math.max(fl.finishedAt || 0, fl.lastHotAt || 0);
  $("hFastLog").textContent = paused ? `⏸ واقف: ${WHY[fl.pause.why] || fl.pause.why}`
    : fl.running ? "⏳ شغال دلوقتي…"
    : lastAt ? `آخر لفة ${fmtAgo(lastAt)}${fl.lastPassSec ? ` (خدت ${Math.round(fl.lastPassSec / 60 * 10) / 10} د)` : ""} — جاب ${fl.added || 0} جديد · إجمالي ${fl.total || 0} من ${laps} لفة${fl.lastFoundAt ? ` · آخر لقطة ${fmtAgo(fl.lastFoundAt)}` : ""}` : "لسه ماشتغلش";
}
function readHunt() {
  const lines = (id) => $(id).value.split("\n").map((x) => x.trim()).filter(Boolean);
  return { ...huntRaw,
    search: { on: $("hSearchOn").checked, perRun: +$("hSearchN").value, queries: lines("hSearchQ") },
    mp: { on: $("hMpOn").checked, perRun: +$("hMpN").value, queries: lines("hMpQ").map((q) => (PH.norm(q) === PH.norm(MP_ALL) ? "" : q)) },
    fast: { ...(huntRaw.fast || {}), on: $("hFastOn").checked, live: +$("hFastMin").value === 0, minutes: +$("hFastMin").value || 10, withSearch: $("hFastSearch").checked,
      slugs: [...document.querySelectorAll("#hFastGroups input:checked")].map((c) => c.value) } };
}
$("hSave").onclick = async () => {
  const h = readHunt(); huntTouched = false;
  if (h.fast.slugs.length > 8) return ($("hMsg").textContent = "⚠️ اختار 8 جروبات بالكتير للصياد السريع");
  const { huntCfg: cur = {} } = await chrome.storage.local.get("huntCfg");
  huntRaw = { ...h, idx: cur.idx || {} };
  await chrome.storage.local.set({ huntCfg: huntRaw });
  $("hMsg").textContent = "✅ اتحفظ"; toast("🎯 اتحفظت المصادر والصياد السريع");
};
$("hFastNow").onclick = async () => {
  $("hMsg").textContent = "⏳ بيبدأ…";
  const r = await chrome.runtime.sendMessage({ type: "fastNow" }).catch((e) => ({ ok: false, error: String(e.message || e) }));
  $("hMsg").textContent = r && r.ok ? "⚡ بدأ — هتلاقي تابة 🔄 بتشتغل، وأي طلب جديد هيوصلك" : "❌ " + ((r && r.error) || "مفيش رد");
  if (!huntTouched) setTimeout(fillHunt, 1500); // لو كتبت حاجة في الخانات ولسه ما حفظتش ← ما نمسحهاش
};
let huntTouched = false;
document.addEventListener("input", (e) => { if (e.target && e.target.id && /^h[A-Z]/.test(e.target.id) && e.target.closest("#v-settings")) huntTouched = true; });


// ================= 🧠 المشترين بالذكاء الاصطناعي =================
function renderAiBar(vis) {
  const el = $("lAiBar"); if (!el) return;
  if (!aiCfg.key) { el.innerHTML = `🧠 <b>خلّي الذكاء الاصطناعي يجمع المشترين ويحكم عليهم</b> — بيقرا كل تعليقات الشخص في كل البوستات، ويقولك جاد ولا لأ وعايز إيه بالظبط، ويجمع نفس الشخص لو ليه أكتر من حساب. <a href="#" data-gotoai>فعّله من الإعدادات</a>`; return; }
  const todo = AI.buyerCandidates(leads, aiLeads, 999).length, done = Object.keys(aiLeads).length;
  const st = aiStatus && aiStatus.kind === "buyers" ? aiStatus : null;
  el.innerHTML = aiLive(st) ? `🧠 بيحلل المشترين… ${st.done || 0} من ${st.total || "?"}`
    : `🧠 الذكاء الاصطناعي حلّل <b>${done}</b> شخص — <b>${vis.filter((L) => L.ai && L.ai.buyer).length}</b> مشتري جاد${todo ? ` · ${todo} محتاجين تحليل` : " · كله متحلل ✅"}
       ${todo ? `<button class="btn sm primary" data-aibuyers>🧠 حلّلهم دلوقتي</button>` : ""}${st && st.error ? ` <span class="muted">⚠️ ${esc(st.error)}</span>` : ""}`;
}
document.addEventListener("click", async (e) => {
  if (e.target.closest("[data-lmulti3]")) { state.lMulti3 = !state.lMulti3; state.lShown = 60; return render(); }
  if (e.target.closest("[data-laionly]")) { state.lAiOnly = !state.lAiOnly; state.lSort = state.lAiOnly ? "ai" : state.lSort; $("lSort").value = state.lSort; state.lShown = 60; return render(); }
  if (e.target.closest("[data-gotoai]")) { e.preventDefault(); state.view = "settings"; fillSettings(); render(); setTimeout(() => { const p = $("aiKey"); if (p) p.scrollIntoView({ behavior: "smooth", block: "center" }); }, 80); return; }
  const b = e.target.closest("[data-aibuyers]"); if (!b) return;
  b.disabled = true; b.textContent = "⏳ بيحلل…";
  const r = await chrome.runtime.sendMessage({ type: "aiBuyers" }).catch((er) => ({ ok: false, error: String(er.message || er) }));
  toast(r && r.ok ? `🧠 خلص — حلّل ${r.r.done} شخص` : "❌ " + ((r && r.error) || "مفيش رد"));
});

document.addEventListener("click", (e) => { if (e.target.closest("[data-mownerk]")) { state.mOwner = !state.mOwner; $("mOwner").checked = state.mOwner; state.mShown = 40; render(); } });


// ================= 📋 الطلب ⟷ العرض: كل طلب شراء قصاده أنسب العروض =====
// العرض ده من المالك؟ (الذكاء الاصطناعي، أو تصنيف البايعين، أو مكتوب «من المالك»)
let OWNER_IDS = null, OWNER_SRC = null;
function isOwnerPost(o) {
  if (OWNER_SRC !== sellers) { OWNER_SRC = sellers; OWNER_IDS = new Set(sellers.filter((S) => S.owner).flatMap((S) => S.units.map((u) => u.id))); }
  if (o.isBroker === true) return false;
  return o.isBroker === false || OWNER_IDS.has(o.id) || /(من المالك|انا المالك|المالك مباشره|بدون سمسار|بدون وسيط)/.test(PH.norm(o.text || ""));
}
// ================= 🎯 هاتلي مشتري: عرض ⟶ مشترين · طلب ⟶ بائعين =================
// كل خانة إما «عرض» (عندك حاجة وعايز مشتري) أو «طلب» (عايز حاجة وعايز بايع). النتايج بتيجي من مصدرين:
//   1) الداتا اللي اتسحبت قبل كده (فوري — من المشترين والبائعين اللي عند البرنامج)   2) السحب المخصص من فيسبوك (أول بأول)
const SLOTS = 40;
const KIND_AR = { request: "📢 نازل طلب", comment: "💬 علّق على عرض شبه عرضك", me2: "🙋 قال «وانا كمان» على طلب", offer: "🟢 نازل عرض بيع", sellerc: "💬 قال «عندي» على طلب شبه طلبك" };
const slotKind = (s) => (s && s.kind === "want" ? "want" : "offer");
const newSlotId = () => "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function slotsArr() {
  let s = mineSlots;
  if (!s) { // أول مرة: ناخد اللي كان في «عروضي»
    const old = Object.values(listings || {}).filter((u) => u.status !== "sold").sort((a, b) => a.createdAt - b.createdAt).slice(0, SLOTS);
    s = old.map((u, i) => ({ id: "m" + i + Date.now().toString(36), text: u.text || u.title || unitLine(u), createdAt: u.createdAt || Date.now() }));
  }
  const out = s.filter((x) => x && x.text && x.text.trim()).slice(0, SLOTS);
  const migrated = !mineSlots && out.length > 0;
  mineSlots = out;
  if (migrated) chrome.storage.local.set({ mineSlots: out }).catch(() => {}); // خانات اتنقلت من «عروضي» ← نخزّنها فعلًا (الخلفية بتقرا mineSlots من التخزين؛ كانت بتلاقيه فاضي فـ«دوّر الكل» بيقول اكتب قطعة)
  return out;
}
async function saveSlots(arr) { mineSlots = arr; await chrome.storage.local.set({ mineSlots: arr }); }
// ➕ بوست (عرض أو طلب) ⟵ خانة جديدة في «هاتلي مشتري» بضغطة واحدة
async function addSlotFromPost(p, kind) {
  const text = String(p.text || "").replace(/\s+/g, " ").trim().slice(0, 320);
  if (!text) return toast("البوست من غير نص");
  const arr = slotsArr();
  if (arr.some((x) => x.text === text && slotKind(x) === kind)) return toast("الخانة دي موجودة قبل كده في 🎯 هاتلي مشتري");
  if (arr.length >= SLOTS) return toast(`وصلت للحد الأقصى (${SLOTS}) — امسح حاجة قديمة الأول`);
  arr.push({ id: newSlotId(), text, kind, label: String(p.sender || "").slice(0, 40), createdAt: Date.now(), lastRun: null, from: p.url || "" });
  await saveSlots(arr);
  toast(kind === "want" ? "✅ اتضافت — البائعين المناسبين ظاهرين في 🎯 هاتلي مشتري" : "✅ اتضافت — المشترين المناسبين ظاهرين في 🎯 هاتلي مشتري");
}
const profOf = (h) => (h.uid ? (/^\d+$/.test(h.uid) ? `https://www.facebook.com/profile.php?id=${h.uid}` : `https://www.facebook.com/${h.uid}`) : "");
function slotMsg(s, h) {
  const nm = (h.name || "").split(/\s+/)[0], hi = `أهلًا${nm && !/\d/.test(nm) ? " " + nm : ""} 👋\n`;
  if (slotKind(s) === "want") {
    const u = h.unit || {};
    return `${hi}شفت إعلانك${u.category ? " عن " + (UNIT1[u.category] || "الوحدة") : ""}${u.region ? " في " + u.region : ""}${u.price ? " (" + PH.fmtPrice(u.price) + ")" : ""} — وأنا بدوّر على: ${s.text.replace(/\s+/g, " ").slice(0, 150)}\nلسه متاحة؟ ينفع نتكلم في التفاصيل ونحدد معاينة؟${myName ? "\n" + myName : ""}`;
  }
  const w = ({ land: "أرض", apartment: "شقة", villa: "فيلا" })[(unitObj({ text: s.text }) || {}).category] || "وحدة";
  return `${hi}شفت إنك بتدوّر على ${w}، وعندي: ${s.text.replace(/\s+/g, " ").slice(0, 160)}\nتحب أبعتلك التفاصيل ونحدد معاينة؟${myName ? "\n" + myName : ""}`;
}
// 🕵️ مشتري حقيقي ولا سمسار — الفهرس بيتبني مرة واحدة لكل تحديث داتا
function trustIdx() {
  if (trustMemo && trustMemo.b === engineT && trustMemo.h === mineHits) return trustMemo.T;
  const T = engineT ? MATCH.trustIndex([], {}, mineHits, PH.compile(settings), engineT) : MATCH.trustIndex(allItems, comments, mineHits, PH.compile(settings));
  trustMemo = { b: engineT, h: mineHits, T }; return T;
}
const trustOf = (h) => MATCH.trust(h, trustIdx(), trustFix[MATCH.trustPK(h)]);
// البايع: مالك ولا مكتب (من نص العرض واسم الناشر)
// 🏠 «المالك» في وصف الخانة (10.71.3): نصنّف كل نتيجة من نصها (تصريح صريح > علامة المالك من البرنامج > ذكر المالك بس)
const slotOwn = (s) => HAS_OWN && OWNMK.has((s && s.text) || "");
function ownHit(h, kind) {
  if (!HAS_OWN) return null;
  if (kind === "want") { // نتيجة = عرض بايع
    const c = OWNMK.classify(h.text || "", { kind: "offer", isBroker: h.owner ? false : undefined });
    return c.src === "ai" && h.owner ? { ...c, src: "seller", why: "البرنامج صنّفه مالك" + (c.mention ? " + ذكر «المالك» في النص" : " (من كل وحداته)") } : c;
  }
  return OWNMK.classify([h.text, ...(h.more || []).map((m) => m.text)].filter(Boolean).join(" · "), { kind: "request", mentionOnly: true }); // نتيجة = طلب مشتري (نصه هو بس، مش نص البوست اللي علّق عليه)
}
const sellerTr = (h, oi) => {
  const c = oi ? h.oc : null;
  if (c && c.role) {
    if (c.role === "owner") return { s: c.sure ? 90 : 80, level: "real", label: "🏠 مالك" + (c.sure ? " ✓" : ""), why: [c.why], neg: [] };
    if (BROKERISH.includes(c.role)) return { s: 20, level: "broker", label: c.ic + " " + c.t, why: [], neg: [c.why] };
    return { s: 50, level: "maybe", label: c.ic + " " + c.t, why: [], neg: [c.why] };
  }
  return h.owner ? { s: 80, level: "real", label: "🏠 مالك", why: ["من المالك مباشرة"], neg: [] } : { s: 40, level: "maybe", label: "🏢 مكتب/سمسار؟", why: [], neg: [] };
};
const TRUST_SHOW = { all: () => true, noBroker: (t) => t.level !== "broker", real: (t) => t.level === "real" };
const personKey = (h) => (h.uid ? "u:" + h.uid : "n:" + PH.norm(h.name || ""));

// ---- شكل الخانة كما فهمها البرنامج (شرائح) ----
function slotChips(text, kind) {
  const U = unitObj({ text }), L = U.land || {};
  return { U, chips: [(UNIT1[U.category] || "وحدة") + (L.type ? " " + L.type : ""), U.region || "", L.mugawra ? "مجاورة " + L.mugawra : "", L.plot ? "قطعة " + L.plot : "",
    U.outside ? "📍 " + (U.placeName || U.place || "مكان تاني") + " (برا " + area.gov + ")" : "", U.areaM2 ? U.areaM2 + " م²" : "", U.rooms ? U.rooms + " غرف" : "", U.price ? (kind === "want" ? "ميزانية " : "") + PH.fmtPrice(U.price) : "", L.over ? "أوفر " + PH.fmtPrice(L.over) : "",
    (L.features || []).includes("ناصية") ? "ناصية" : ""].filter(Boolean) };
}

// ---- 1) تطابق فوري من الداتا الموجودة ----
const localCache = new Map();
function buyerEv(L, U) {
  if (L.matchedAct) { // 🎯 التطابق ده لطلب بعينه (من طلباته) — نعرض نصه ورابطه هو مش أي طلب تاني ليه
    const m = (L.acts || []).find((a) => a.id === L.matchedAct);
    if (m) return m.kind === "request" ? { kind: "request", text: m.text, url: m.postUrl, ts: m.ts, act: m }
      : m.sameReq ? { kind: "me2", text: m.text, post: m.postText, url: m.commentUrl || m.postUrl, ts: m.ts, act: m }
      : { kind: "comment", text: m.text, post: m.postText, url: m.commentUrl || m.postUrl, ts: m.ts, act: m };
  }
  const sim = (a) => (a.region && a.region === U.region ? 2 : 0) + (a.category === U.category ? 1 : 0) + (a.areaM2 && U.areaM2 && Math.abs(a.areaM2 - U.areaM2) / U.areaM2 < 0.25 ? 1 : 0);
  const acts = L.acts || [];
  const req = acts.filter((a) => a.kind === "request").sort((x, y) => sim(y) - sim(x))[0];
  if (req) return { kind: "request", text: req.text, url: req.postUrl, ts: req.ts, act: req };
  const me2 = acts.find((a) => a.sameReq);
  if (me2) return { kind: "me2", text: me2.text, post: me2.postText, url: me2.commentUrl || me2.postUrl, ts: me2.ts, act: me2 };
  const c = acts.filter((a) => a.kind === "comment").sort((x, y) => sim(y) - sim(x) || (y.ts || 0) - (x.ts || 0))[0];
  return c ? { kind: "comment", text: c.text, post: c.postText, url: c.commentUrl || c.postUrl, ts: c.ts, act: c } : { kind: "request", text: "" };
}
function localBuyers(s) { // عرضي ⟵ المشترين اللي عند البرنامج
  const U = unitObj({ text: s.text }), out = [];
  for (const L of leads) {
    if (L.status === "hidden" || !L.want || !L.want.obj || ["won", "lost"].includes(stageOf(L))) continue;
    const m = MATCH.scoreWant(L.want.obj, U);
    if (!m || m.score < 50) continue;
    const ev = buyerEv(L, U);
    out.push({ key: "L:" + L.key, src: "data", kind: ev.kind, name: L.name, uid: L.uid || "", phones: L.phones || [], score: m.score, why: m.why, text: ev.text || (L.want && L.want.text) || "", postText: ev.post || "",
      url: ev.url || "", group: (L.groups || [])[0] || "", at: L.last || 0, ts: ev.ts || L.last || 0, tags: L.tags || [], hot: !!L.superHot });
  }
  return out;
}
function localSellers(s) { // طلبي ⟵ البائعين (العارضين) اللي عند البرنامج
  const a = PH.analyze(s.text, compiledG), W = MATCH.wantOf(a), out = [];
  for (const S of sellers) {
    if (S.status === "hidden") continue;
    let best = null;
    for (const u of S.units) { if (!u.category || u.done) continue; const m = MATCH.scoreWant(W, u); if (m && (!best || m.score > best.m.score)) best = { u, m }; }
    if (!best || best.m.score < 50) continue;
    const sc0 = S.owner && best.u.isBroker !== false ? Math.min(100, best.m.score + 5) : best.m.score, sc = best.m.adj ? Math.min(sc0, 69) : sc0; // حي جنب = «قريب» حتى لو مالك
    out.push({ key: "S:" + S.key, src: "data", kind: "offer", name: S.name, uid: S.uid || "", phones: S.phones || [], score: sc, why: best.m.why, text: best.u.text || "", postText: "", url: best.u.url || "",
      group: (best.u.groups && best.u.groups[0]) || best.u.group || "", at: S.last || 0, ts: best.u.ts || S.last || 0, owner: !!S.owner, unit: best.u });
  }
  return out;
}
function localHits(s) {
  const kind = slotKind(s), c = localCache.get(s.id);
  if (c && c.text === s.text && c.kind === kind && c.L === leads && c.S === sellers) return c.hits;
  let hits = [];
  try { hits = kind === "want" ? localSellers(s) : localBuyers(s); } catch (e) { console.warn("localHits", e); }
  localCache.set(s.id, { text: s.text, kind, L: leads, S: sellers, hits });
  return hits;
}
// ---- 2) الدمج: نفس الشخص = كارت واحد (الأعلى نسبة) ----
function slotHits(s) {
  const dis = mineDis[s.id] || {}, map = new Map(), kind = slotKind(s);
  const add = (h) => {
    const k = personKey(h); if (dis[k]) return;
    const cur = map.get(k);
    if (!cur) return map.set(k, h);
    const best = h.score > cur.score ? h : cur, other = best === h ? cur : h;
    map.set(k, { ...best, src: "both", phones: [...new Set([...(best.phones || []), ...(other.phones || [])])], more: [...(best.more || []), ...(other.more || [])], owner: best.owner || other.owner });
  };
  localHits(s).forEach(add);
  (mineHits[s.id] || []).filter((h) => !h.hidden).forEach((h) => add({ ...h, src: "fb" }));
  const out = [...map.values()], oi = slotOwn(s);
  for (const h of out) {
    h.oc = oi ? ownHit(h, kind) : null; h.tr = kind === "want" ? sellerTr(h, oi) : trustOf(h);
    const dp = mineDeep[personKey(h)]; // 🔎 رقم اتلقط من تعليقاته (دوّر على الأرقام)
    h.deep = dp || null;
    if (dp && dp.phones && dp.phones.length) { h.phones = [...new Set([...(h.phones || []), ...dp.phones])]; }
  }
  return out;
}
const HIT_FILTERS = {
  all: () => true,
  real: (h) => h.tr.level === "real",
  phone: (h) => (h.phones || []).length > 0,
  fresh: (h) => (h.ts || h.at || 0) > Date.now() - 864e5,
  owner: (h) => !!h.owner || !!(h.oc && h.oc.role === "owner"),
  wantsOwner: (h) => !!(h.oc && h.oc.wantsOwner),
};
// 🔎 سيرش «هاتلي مشتري»: اسم / رقم / حي / كلام النتيجة — ولو الكلمة في نص الطلب نفسه نعرض كل نتايجه
const hitQ = (q, h) => qOK(q, [h.name, h.text, h.postText, h.group, h.tier, h.unit && h.unit.region, h.unit && h.unit.category, (h.why || []).join(" ")].filter(Boolean).join(" "), h.phones, { cats: [h.unit && h.unit.category].filter(Boolean) });
function slotView(s, noQ) {
  const kind = slotKind(s), min = mineCfg.min || 70, W = { real: 8, maybe: 0, broker: -30 };
  const all = slotHits(s).filter((h) => h.score >= min);
  const show = TRUST_SHOW[mineCfg.trust || "real"] || TRUST_SHOW.real, hidN = all.filter((h) => !show(h.tr)).length;
  const oi = slotOwn(s), base0 = all.filter((h) => show(h.tr));
  // خانة فيها «المالك» ← الافتراضي يعرض الملّاك (أو اللي بيطلبوا من المالك) لو فيه، واختيارك بيكسب
  const dflt = oi ? (kind === "want" ? (base0.some(HIT_FILTERS.owner) ? "owner" : "all") : (base0.some(HIT_FILTERS.wantsOwner) ? "wantsOwner" : "all")) : "all";
  const fk = state.sf[s.id] || dflt, f = HIT_FILTERS[fk] || HIT_FILTERS.all;
  const ob = (h) => (!oi || !h.oc ? 0 : kind === "want" ? (h.oc.role === "owner" ? (h.oc.sure ? 10 : 6) : 0) : (h.oc.wantsOwner ? 8 : 0));
  const mq = noQ ? "" : qNorm(state.mdq), sTxt = !!mq && qOK(mq, (s.text || "") + " " + (s.label || ""));
  const base = mq && !sTxt ? base0.filter((h) => hitQ(mq, h)) : base0;
  for (const h of all) h.pin = (matchFb["hit|" + s.id + "|" + personKey(h)] || {}).v === 1;
  const hits = base.filter(f).sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || (b.score + ob(b) + (kind === "want" ? (b.owner ? 6 : 0) : W[b.tr.level] || 0)) - (a.score + ob(a) + (kind === "want" ? (a.owner ? 6 : 0) : W[a.tr.level] || 0)) || (b.ts || b.at || 0) - (a.ts || a.at || 0));
  return { kind, all, base, hits, hidN, mq, matchQ: !mq || sTxt || base.length > 0, nReal: all.filter((h) => h.tr.level === "real").length, nBro: all.filter((h) => h.tr.level === "broker").length,
    nPhone: base.filter(HIT_FILTERS.phone).length, nFresh: base.filter(HIT_FILTERS.fresh).length, nOwner: base.filter(HIT_FILTERS.owner).length,
    oi, fk, nWOwner: base.filter(HIT_FILTERS.wantsOwner).length, ownTally: oi ? OWNMK.tally(all.map((h) => h.oc)) : null };
}

// ---- العرض ----
// بادج تصنيف «المالك» على النتيجة: بايع (مالك/سمسار/مش متأكد) أو مشتري (بيطلب من المالك) — بس لو الخانة فيها «المالك»
function ownHitBadge(h, kind) {
  const c = h.oc;
  if (!c) return "";
  if (kind === "want") return ""; // التصنيف ظاهر بالفعل في بادج الثقة (tr-b) وسببه في سطر «🧭» تحته
  return c.wantsOwner ? OWNMK.badgeHtml(c, esc) : "";
}
// 🔎 الأرقام اللي «دوّر على الأرقام» لقطها بتتضاف كمان على المشتري/البائع في تبويباتهم
function applyDeepPhones(Ls, Ss, Ps) {
  if (!mineDeep || !Object.keys(mineDeep).length) return;
  const put = (X) => { const d = X && mineDeep[personKey({ uid: X.uid, name: X.name })]; if (d && d.phones && d.phones.length) { if (!(X.phones || []).length) X.phoneSrc = { kind: "comment", method: "deep", url: d.commentUrl || d.url || "", text: d.text || "", ts: d.at || 0 }; X.phones = [...new Set([...(X.phones || []), ...d.phones])]; } };
  (Ls || []).forEach(put); (Ss || []).forEach(put); (Ps || []).forEach((x) => { put(x.B); put(x.S); }); // 📞 كروت التطابق (نسخ المشتري/البايع جوه كل تطابق)
}
// 🔎 سطر «دوّر على الرقم»: لقيناه في تعليق / دوّرنا ومالقيناش
function deepNote(h) {
  const d = h.deep; if (!d) return "";
  if (d.phones && d.phones.length) return `<div class="deep-note ok">🔎 الرقم اتلقط من ${d.src === "local" ? "داتا قديمة" : "تعليق"} ${d.at ? relDay(d.at) : ""}${d.text ? ` — «${OHS(d.text, 90)}»` : ""}${d.commentUrl ? ` <a target="_blank" href="${esc(d.commentUrl)}">🔗 التعليق</a>` : ""}</div>`;
  if (!(h.phones && h.phones.length) && d.tried) return `<div class="deep-note no">🔎 دوّرت في تعليقاته ${d.tried ? relDay(d.tried) : ""} ومالقيتش رقم${mineCfg.deep !== false ? " — هيتدوّر عليه تاني بعد يوم" : ""}</div>`;
  return "";
}
function hitHtml(s, h, kind) {
  const open = h.score >= 85;
  const ev = (txt) => (txt ? `«${OHS(txt, 220)}»` : "");
  const unit = h.unit && (h.unit.category || h.unit.region) ? uLine({ land: {}, ...h.unit, category: h.unit.category || "land" }) : "";
  return `<div class="hit lv-${h.tr.level}${h.pin ? " pinned" : ""}" data-hkey="${esc(h.key || personKey(h))}">
    <span class="ss-score ${h.score < 85 ? "mid" : ""}" title="${esc(h.tier || "")}">${h.score}%</span>
    <div class="hit-m"><div class="hit-n">${h.tier ? `<span class="tier-b">${esc(h.tier)}</span> ` : ""}<b>${esc(h.name || "—")}</b>${window.FBID ? FBID.chip(h, { inline: true }) : ""}
      ${kind === "want" ? `<span class="tr-b tr-${h.tr.level}">${h.tr.label}</span>` : `<button class="tr-b tr-${h.tr.level}" data-trfix title="دوس لو البرنامج غلط — هتغيّرها بنفسك (حقيقي ⟵ سمسار ⟵ تلقائي)">${h.tr.label}</button>`}
      ${h.hot ? `<span class="l-lvl super">💎</span>` : ""}<span class="badge b-cat">${KIND_AR[h.kind] || ""}</span>${ownHitBadge(h, kind)}
      <span class="muted">· ${h.src === "data" ? "من الداتا" : h.src === "both" ? "داتا + سحب" : "سحب مخصص"}${h.group ? " · 📌 " + esc(h.group) : ""}${h.ts || h.at ? " · " + relDay(h.ts || h.at) : ""}</span></div>
      ${unit ? `<div class="hit-u">🧱 ${esc(unit)}</div>` : ""}
      <div class="mb-ev">${ev(h.text)}${h.postText ? `<div class="muted">↩️ على: ${OHS(h.postText, 120)}…</div>` : ""}</div>
      ${(h.more || []).length ? `<div class="muted sm">➕ ${h.more.length === 1 ? "اتفاعل مرة كمان" : `اتفاعل ${h.more.length} مرات كمان`}: ${h.more.slice(0, 3).map((m) => "«" + esc(String(m.text || "").slice(0, 60)) + "»").join(" · ")}</div>` : ""}
      ${h.why && h.why.length ? `<div class="why">✔ ${esc(h.why.join(" · "))}</div>` : ""}
      ${kind === "want" && h.oc && h.oc.why ? `<div class="own-why">🧭 ${esc(h.oc.why)}</div>` : ""}
      ${kind !== "want" && (h.tr.why.length || h.tr.neg.length) ? `<div class="tr-why">🕵️ ${[...(h.tr.level === "broker" ? [] : h.tr.why.map((w) => `<span class="ok">${esc(w)}</span>`)), ...h.tr.neg.map((w) => `<span class="no">${esc(w)}</span>`)].join(" · ")}</div>` : ""}
      ${(h.tags || []).filter((x) => /معاينه|معاينة|يشتري|تواصل|التقسيط|الاوفر|نفس الطلب/.test(x)).length ? `<div class="hit-tags">${h.tags.filter((x) => /معاينه|معاينة|يشتري|تواصل|التقسيط|الاوفر|نفس الطلب/.test(x)).map((x) => `<span class="chip hot">🔥 ${esc(x)}</span>`).join("")}</div>` : ""}
      ${h.warn && h.warn.length ? `<div class="muted sm">⚠️ ${esc(h.warn.join(" · "))}</div>` : ""}
      ${deepNote(h)}</div>
    <div class="mb-act">${h.phones && h.phones[0] ? `<a class="btn sm wa" target="_blank" href="${PH.waLink(h.phones[0])}?text=${encodeURIComponent(slotMsg(s, h))}">💬 ${esc(h.phones[0])}</a>` : ""}
      ${profOf(h) ? `<a class="btn sm" target="_blank" href="${esc(profOf(h))}">👤 البروفايل</a>` : ""}${h.url ? `<a class="btn sm" target="_blank" href="${esc(h.url)}">🔗 ${kind === "want" ? "العرض" : "البوست"}</a>` : ""}
      <button class="btn sm" data-hcopy title="انسخ رسالة جاهزة">📋</button><span class="fb"><button class="fbb ${h.pin ? "on" : ""}" data-hup title="مناسب — ثبّته فوق">👍</button><button class="fbb" data-hhide title="مش مناسب — اخفيه وافتكر ده">👎</button></span></div></div>`;
}
// ===== 🪗 أكورديون «هاتلي مشتري» (10.68): كل طلب/عرض شريط واحد بملخصه، والنتايج بتتفتح بالدوس عليه =====
const saccSave = () => { try { localStorage.setItem("alaaSlotAcc", JSON.stringify(state.acc)); } catch {} };
// اختيار المستخدم هو اللي بيكسب؛ من غير اختيار: مقفول لو فيه أكتر من خانة، ومفتوح لو الخانة لوحدها
const saccIsOpen = (id, total) => (state.acc[id] != null ? !!state.acc[id] : total <= 1);
function saccSet(sl, id, want) {
  state.acc[id] = want ? 1 : 0; saccSave();
  if (!sl) return;
  sl.classList.toggle("acc-open", want);
  sl.querySelectorAll("[data-slottg][aria-expanded]").forEach((b) => b.setAttribute("aria-expanded", String(want)));
}
// 🏠 سطر تصنيف نتايج خانة فيها «المالك»
function ownSummary(V, kind) {
  if (kind === "want") {
    const t = V.ownTally;
    return `<div class="own-sum" title="تصنيف نتايج الخانة حسب كلام صاحب كل بوست"><span>🏠 تصنيف النتايج:</span> <b class="o">${ar(t.owner)}</b> مالك · <b class="b">${ar(t.broker)}</b> سمسار/مكتب · <b class="u">${ar(t.unsure + t.none)}</b> مش مؤكد</div>`;
  }
  return `<div class="own-sum" title="مشترين كاتبين «المالك» في طلبهم"><span>🏠 تصنيف النتايج:</span> <b class="o">${ar(V.nWOwner)}</b> من ${ar(V.base.length)} بيطلبوا «من المالك»</div>`;
}
function slotCard(s, i, running, total = 2) {
  const kind = slotKind(s), V = slotView(s), { chips, U } = slotChips(s._draft != null ? s._draft : s.text, kind);
  const editing = state.open.has("e:" + s.id), isRun = running && (mineJob.slots || []).includes(s.id);
  const accOpen = editing || !!V.mq || saccIsOpen(s.id, total); // البحث والتعديل بيفتحوا الخانة لوحدهم
  const open = state.open.has("s:" + s.id) || !!V.mq;
  const cur = V.fk;
  const pill = (k, label, n) => `<button class="sf ${cur === k ? "on" : ""}" data-sf="${k}">${label}${n != null ? ` <b>${n}</b>` : ""}</button>`;
  const who = kind === "want" ? "بائع" : "مشتري";
  const top = V.all.reduce((m, h) => Math.max(m, h.score || 0), 0);
  const sm = isRun ? `<span class="sm-p run">⏳ بيدوّر دلوقتي…</span>`
    : V.all.length ? `<span class="sm-p n">${kind === "want" ? "🏷" : "🛒"} <b>${V.all.length}</b> ${who} متطابق</span>${V.nFresh ? `<span class="sm-p new">🆕 ${V.nFresh} آخر 24 ساعة</span>` : ""}${V.nPhone ? `<span class="sm-p ph">📞 ${V.nPhone} بأرقام</span>` : ""}<span class="sm-p top" title="أعلى نسبة تطابق">🏆 ${top}%</span>`
    : `<span class="sm-p none">${s.lastRun ? "لسه مفيش متطابقين" : "لسه ما دوّرتش"}</span>`;
  const body = !V.all.length
    ? `<div class="muted slot-empty">${isRun ? "⏳ بيدوّر دلوقتي… النتايج هتظهر هنا أول بأول" : V.hidN ? "" : s.lastRun ? `لسه ما لقاش ${who} مناسب بالنسبة دي — هيدوّر تاني لوحده` : `دوس «🔎 دوّر» عشان يسحب لك من فيسبوك كمان (النتايج اللي في الداتا بتظهر هنا لوحدها)`}</div>`
    : `<div class="slot-sum"><b>${kind === "want" ? "🏷" : "🛒"} ${V.all.length} ${who}</b>
        ${kind === "want" ? "" : `<span class="tr-b tr-real">✅ ${V.nReal} حقيقي</span>`}${V.mq ? `<span class="muted"> · 🔍 ${V.base.length} مطابق للبحث</span>` : ""}
        <div class="sfs">${pill("all", "الكل", V.base.length)}${kind === "want" ? pill("owner", "🏠 ملّاك", V.nOwner) : pill("real", "✅ حقيقي", V.nReal)}${V.oi && kind !== "want" ? pill("wantsOwner", "🏠 بيطلب من المالك", V.nWOwner) : ""}${pill("phone", "📞 بأرقام", V.nPhone)}${pill("fresh", "🆕 آخر 24 ساعة", V.nFresh)}</div></div>
      ${V.oi ? ownSummary(V, kind) : ""}
      ${V.hidN ? `<div class="muted slot-empty">🏢 فيه ${V.hidN} متخفيين (${kind === "want" ? "مكاتب أو مش مالك" : "سماسرة أو مش متأكد منهم"}) — <button class="linkbtn" data-trustall>اعرضهم</button></div>` : ""}
      <div class="slot-hits">${V.hits.slice(0, open ? 300 : 6).map((h) => hitHtml(s, h, kind)).join("") || `<div class="muted slot-empty">مفيش نتايج بالفلتر ده</div>`}
        ${V.hits.length > 6 ? `<button class="btn sm" data-slotopen>${open ? "▲ أقل" : `كل النتايج (${V.hits.length})`}</button>` : ""}</div>`;
  const tg = editing ? "" : " data-slottg"; // الدوس على النص أو الملخص بيفتح/يقفل (مش وقت التعديل)
  return `<section class="slot kind-${kind}${accOpen ? " acc-open" : ""}" data-slot="${s.id}">
    <div class="slot-h">
      <span class="slot-k"${tg}>${kind === "want" ? "🔵 طلب" : "🟢 عرض"}</span>
      <div class="slot-main">
        ${editing ? `<textarea class="slot-t" rows="2">${esc(s._draft != null ? s._draft : s.text)}</textarea>` : `<div class="slot-txt"${tg}>${OH(s.text)}</div>`}
        <div class="slot-p"${tg}>${chips.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}${V.oi ? `<span class="chip own-chip" title="الوصف فيه «المالك» — بيجيب نفس البوستات (من المالك) ويصنّفها: مالك / سمسار / مش متأكد">🏠 «المالك» — بيصنّف النتايج</span>` : ""}${!U.region && !U.outside ? `<span class="chip deal">⚠️ اكتب الحي عشان النتايج تبقى أدق</span>` : ""}${s.label ? `<span class="chip lbl">🏷 ${esc(s.label)}</span>` : ""}</div>
        <div class="slot-sm"${tg}>${sm}</div>
      </div>
      <div class="slot-btns"><button class="btn sm slot-chev" data-slottg aria-expanded="${accOpen}" title="افتح / اقفل النتايج"><span class="chev" aria-hidden="true">▾</span><span class="chev-l">النتايج</span></button>
        <button class="btn sm primary" data-slotrun ${running ? "disabled" : ""}>${isRun ? "⏳ بيدوّر…" : "🔎 دوّر في فيسبوك"}</button>
        <button class="btn sm" data-slotedit title="عدّل النص">${editing ? "✔ تم" : "✏️"}</button><button class="btn sm" data-slotflip title="غيّر النوع (عرض ⟷ طلب)">⇄</button><button class="btn sm danger" data-slotdel title="امسح">🗑</button></div></div>
    <div class="slot-bd"><div class="slot-bd-in">${body}</div></div></section>`;
}
function renderMdKpis(arr) {
  let nO = 0, nW = 0, tot = 0, ph = 0, fr = 0;
  for (const s of arr) { const V = slotView(s, true); V.kind === "want" ? nW++ : nO++; tot += V.base.length; ph += V.nPhone; fr += V.nFresh; }
  $("mdKpis").innerHTML = `<div class="kpi"><b>${nO}</b><span>🟢 عرض عندي</span></div><div class="kpi"><b>${nW}</b><span>🔵 طلب عندي</span></div>
    <div class="kpi"><b>${tot}</b><span>🤝 تطابق (${mineCfg.min || 70}%+)</span></div><div class="kpi"><b>${ph}</b><span>📞 معاهم رقم</span></div><div class="kpi kpi-hot"><b>${fr}</b><span>🆕 آخر 24 ساعة</span></div>`;
}
function renderSlots() {
  // اللي بتكتبه ميتمسحش لما النتايج تتحدّث وانت بتكتب
  const typing = {}, act = document.activeElement;
  document.querySelectorAll(".slot-t").forEach((t) => { typing[t.closest("[data-slot]").dataset.slot] = t.value; });
  const focusId = act && act.classList && act.classList.contains("slot-t") ? act.closest("[data-slot]").dataset.slot : null;
  const sel = focusId ? [act.selectionStart, act.selectionEnd] : null;
  const all = slotsArr().map((s) => (typing[s.id] != null && typing[s.id] !== (s.text || "") ? { ...s, _draft: typing[s.id] } : s));
  $("mineMinS").value = String(mineCfg.min || 70); $("mineTrust").value = mineCfg.trust || "real"; $("mineEvery").value = String(mineCfg.every == null ? -1 : mineCfg.every);
  const mq = laneQ("mine"), running = mineJob.running && mq;
  $("mineJobLine").innerHTML = running ? `⏳ <b>بيسحب مخصص دلوقتي</b> — ${Math.min((mq.i || 0) + 1, mq.list.length)} من ${mq.list.length} (${esc((mq.list[mq.i] || {}).name || "")}) · لقى <b>${mineJob.found || 0}</b> جديد`
    : mineJob.waiting ? "⏳ مستني السحب اللي شغال يخلص وهيبدأ على طول"
    : mineJob.finishedAt ? `✅ آخر سحب مخصص ${relDay(mineJob.finishedAt)} ${new Date(mineJob.finishedAt).toLocaleTimeString("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit" })} — لقى ${mineJob.found || 0} جديد` : "لسه ما اتعملش سحب مخصص — ضيف طلب أو عرض ودوس «🔎 دوّر»";
  $("mineAll").disabled = !!running || !all.length;
  { // 🔎 دوّر على أرقام الصافيين
    const dj = mineDeepJob || {}, dRun = !!(dj.running && laneQ("deep"));
    $("mineDeep").checked = mineCfg.deep !== false;
    $("mineDeepBtn").disabled = dRun || !all.length;
    $("mineDeepLine").innerHTML = dRun ? `⏳ <b>بيدوّر على أرقام الصافيين</b> — بوست ${Math.min((dj.scanned || 0) + 1, dj.total || 1)} من ${dj.total || 1} · لقى <b>${dj.found || 0}</b> رقم`
      : dj.waiting || dj.busy ? "⏳ مستني السحب اللي شغال يخلص وهيدوّر على الأرقام على طول"
      : dj.finishedAt ? `${dj.total || dj.found ? "✅" : "ℹ️"} آخر بحث عن الأرقام ${relDay(dj.finishedAt)} ${new Date(dj.finishedAt).toLocaleTimeString("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit" })} — لقى ${dj.found || 0} رقم${dj.total ? ` في ${dj.total} بوست` : ""}` : "";
  }
  const nO = all.filter((s) => slotKind(s) !== "want").length, nW = all.length - nO, tf = state.mdTab || "all";
  $("mdTabs").innerHTML = all.length ? [["all", "الكل", all.length], ["offer", "🟢 عروضي", nO], ["want", "🔵 طلباتي", nW]].map(([k, l, n]) => `<button class="tab ${tf === k ? "on" : ""}" data-mdtab="${k}">${l}<small>${n}</small></button>`).join("")
    + (all.length >= 2 ? `<span class="md-acc"><button class="btn sm" data-mdacc="open" title="افتح كل الخانات">⬇ افتح الكل</button><button class="btn sm" data-mdacc="close" title="اقفل كل الخانات">⬆ اقفل الكل</button></span>` : "") : "";
  const arr = all.filter((s) => (tf === "all" || slotKind(s) === tf) && slotView(s).matchQ);
  renderMdKpis(all);
  { const mi = $("mdq"); if (mi && mi.value !== (state.mdq || "")) mi.value = state.mdq || ""; }
  $("slots").innerHTML = arr.length ? arr.map((s, i) => slotCard(s, i, running, all.length)).join("")
    : all.length ? `<div class="empty"><b>${qNorm(state.mdq) ? `مفيش نتيجة للبحث «${esc(state.mdq.trim())}»` : "مفيش حاجة في التبويب ده"}</b></div>`
    : `<div class="md-empty"><div class="md-big">🎯</div><b>ابدأ بإضافة أول طلب أو عرض</b>
        <p class="muted">عندك أرض أو شقة للبيع؟ هاتلك المشترين المناسبين. بتدوّر على حاجة؟ هاتلك البائعين اللي عارضين زيها. التطابق بيطلع فورًا من الداتا اللي عندك، وبعدها يسحب لك من فيسبوك.</p>
        <div class="row-actions" style="justify-content:center"><button class="btn primary" data-mdnew="offer">🟢 عندي عرض</button><button class="btn primary" data-mdnew="want">🔵 عندي طلب</button></div></div>`;
  if (HAS_OWN) document.querySelectorAll("#slots .slot-t").forEach((t) => OWNMK.attach(t)); // تبريز «المالك» وانت بتعدّل الخانة
  if (focusId) { const t = document.querySelector(`[data-slot="${focusId}"] .slot-t`); if (t) { t.focus(); try { t.setSelectionRange(sel[0], sel[1]); } catch {} } }
}
function mineSeenMap() { return mineSeenCache; }
async function slotUpdate(id, patch) {
  const arr = slotsArr().map((s) => (s.id === id ? { ...s, ...patch } : s));
  await saveSlots(arr);
}
// ---- المُضيف (إضافة طلب أو عرض) ----
const MD_PH = {
  offer: ["مثلًا: ارض 300 متر الحي العاشر مجاورة 3 ناصية بسعر 2.4 مليون الاوفر 300 الف", "أو شقة: شقة 3 غرف 150 متر الحي الأول دور تالت سوبر لوكس 1.6 مليون", "أو فيلا: فيلا 400 متر منطقة الفيلات 6 مليون"],
  want: ["مثلًا: مطلوب قطعة ارض مسلسل 4 في حدود 2 مليون", "أو شقة: عايز شقة 3 غرف الحي الأول في حدود مليون ونص", "أو فيلا: محتاج فيلا الحي الثالث عشر ميزانية 5 مليون"],
};
function mdParse() {
  const text = $("mdText").value.trim(), kind = state.mdKind || "offer";
  $("mdText").placeholder = MD_PH[kind].join("\n");
  document.querySelectorAll("#mdKind [data-mkind]").forEach((b) => b.classList.toggle("on", b.dataset.mkind === kind));
  $("mdSave").disabled = $("mdSaveRun").disabled = !text;
  if (!text) { $("mdParse").innerHTML = ""; return; }
  const list = window.PUB ? PUB.splitList(text) : []; // 📋 قايمة مرقّمة؟ كل عنصر = خانة
  if (list.length >= 2) {
    const room = SLOTS - slotsArr().length;
    $("mdParse").innerHTML = `<span class="muted">فهمت:</span> <span class="chip deal">📋 قايمة فيها ${list.length} عنصر</span> <span class="muted">كل عنصر هيتضاف كخانة لوحده${list.length > room ? ` — المتاح ${Math.max(0, room)} خانة بس` : ""}</span>
      <div class="md-list">${list.slice(0, 12).map((it, i) => `<div><b>${i + 1}</b> ${esc(PUB.slotText(it, { kind })).slice(0, 150)}</div>`).join("")}${list.length > 12 ? `<div class="muted">… و${list.length - 12} كمان</div>` : ""}</div>`;
    $("mdSave").textContent = `➕ ضيف ${Math.min(list.length, Math.max(0, room))} خانة`;
    return;
  }
  $("mdSave").textContent = "➕ ضيف";
  const a = PH.analyze(text, compiledG), { chips, U } = slotChips(text, kind);
  const mismatch = (a.type === "request" && kind === "offer") ? "want" : (a.type === "offer" && kind === "want") ? "offer" : "";
  $("mdParse").innerHTML = `<span class="muted">فهمت:</span> ${chips.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}${HAS_OWN && OWNMK.has(text) ? `<span class="chip own-chip">🏠 فيه «المالك» — هيتبرّز، وهيدوّر لك على نفس البوستات (من المالك) ويصنّفها</span>` : ""}${!U.region && !U.outside ? `<span class="chip deal">⚠️ مفيش حي — النتايج هتبقى أوسع</span>` : ""}${U.category === "other" || !a.category ? `<span class="chip deal">⚠️ مش واضح النوع (أرض/شقة/فيلا) — هعتبرها أرض</span>` : ""}
    ${mismatch ? `<button class="linkbtn" data-mdflip="${mismatch}">الكلام شكله ${mismatch === "want" ? "طلب" : "عرض"} — غيّر النوع؟</button>` : ""}`;
}
function mdOpen(kind) {
  state.mdKind = kind || state.mdKind || "offer";
  $("mdComposer").hidden = false; mdParse(); $("mdText").focus();
  $("mdComposer").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
let mdAdding = false;
async function mdAdd(run) {
  if (mdAdding) return; mdAdding = true; try { await mdAdd1(run); } finally { mdAdding = false; }
}
async function mdAdd1(run) {
  const text = $("mdText").value.trim(); if (!text) return;
  const list = window.PUB ? PUB.splitList(text) : [];
  if (list.length >= 2) { // 📋 قايمة: خانة لكل عنصر
    const arr0 = slotsArr(), room = SLOTS - arr0.length, kind = state.mdKind || "offer";
    if (room <= 0) return toast(`وصلت للحد الأقصى (${SLOTS}) — امسح حاجة قديمة الأول`);
    const take = list.slice(0, room), ids = [];
    take.forEach((it, i) => { const id = newSlotId() + i; ids.push(id); arr0.push({ id, text: PUB.slotText(it, { kind }), kind, label: "", createdAt: Date.now() + i, lastRun: run ? Date.now() : null }); });
    await saveSlots(arr0);
    $("mdText").value = ""; HAS_OWN && OWNMK.repaint($("mdText")); $("mdLabel").value = ""; $("mdComposer").hidden = true; state.mdTab = "all";
    renderSlots();
    const cut = list.length > take.length ? ` (${list.length - take.length} اتساب — الحد ${SLOTS})` : "";
    if (!run) return toast(`✅ اتضافت ${take.length} خانة — التطابق من الداتا ظهر على طول${cut}`);
    const r = await chrome.runtime.sendMessage({ type: "mineRun", ids }).catch((er) => ({ ok: false, error: String(er.message || er) }));
    return toast(r && r.ok ? (r.r.waiting ? `⏳ اتضافت ${take.length} خانة — فيه سحب شغال، هيبدأ أول ما يخلص` : `🔎 اتضافت ${take.length} خانة وبدأ السحب المخصص (${r.r.items} مكان)${cut}`) : "❌ " + ((r && r.error) || "مفيش رد"));
  }
  const id = newSlotId(), arr = slotsArr();
  if (arr.length >= SLOTS) return toast(`وصلت للحد الأقصى (${SLOTS}) — امسح حاجة قديمة الأول`);
  arr.push({ id, text, kind: state.mdKind || "offer", label: $("mdLabel").value.trim().slice(0, 40), createdAt: Date.now(), lastRun: run ? Date.now() : null });
  state.acc[id] = 1; saccSave(); // الخانة الجديدة بتتفتح لوحدها
  await saveSlots(arr);
  $("mdText").value = ""; HAS_OWN && OWNMK.repaint($("mdText")); $("mdLabel").value = ""; $("mdComposer").hidden = true; state.mdTab = "all";
  renderSlots();
  if (!run) return toast("✅ اتضافت — التطابق من الداتا ظهر على طول");
  const r = await chrome.runtime.sendMessage({ type: "mineRun", ids: [id] }).catch((er) => ({ ok: false, error: String(er.message || er) }));
  toast(r && r.ok ? (r.r.waiting ? "⏳ فيه سحب شغال — هيبدأ أول ما يخلص" : `🔎 بدأ السحب المخصص (${r.r.items} مكان) — والتطابق من الداتا ظاهر دلوقتي`) : "❌ " + ((r && r.error) || "مفيش رد"));
}
$("mineAdd").addEventListener("click", () => ($("mdComposer").hidden ? mdOpen() : ($("mdComposer").hidden = true)));
$("mdCancel").addEventListener("click", () => { $("mdComposer").hidden = true; });
$("mdText").addEventListener("input", mdParse);
if (HAS_OWN) OWNMK.attach($("mdText")); // 🏠 تبريز «المالك» وانت بتكتب الوصف
$("mdSave").addEventListener("click", () => mdAdd(false));
$("mdSaveRun").addEventListener("click", () => mdAdd(true));
$("mdText").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); mdAdd(true); } });

document.addEventListener("change", async (e) => {
  const t = e.target.closest(".slot-t"); if (!t) return;
  const id = t.closest("[data-slot]").dataset.slot, text = t.value.trim();
  if (!text) return;
  await slotUpdate(id, { text, createdAt: Date.now() });
  toast("💾 اتحفظت — التطابق اتحدّث، ودوس «🔎 دوّر» لو عايز يسحب من فيسبوك تاني");
});
document.addEventListener("click", async (e) => {
  const nk = e.target.closest("[data-mdnew]"); if (nk) return mdOpen(nk.dataset.mdnew);
  const mk = e.target.closest("#mdKind [data-mkind]"); if (mk) { state.mdKind = mk.dataset.mkind; return mdParse(); }
  const mf = e.target.closest("[data-mdflip]"); if (mf) { state.mdKind = mf.dataset.mdflip; return mdParse(); }
  const tb = e.target.closest("[data-mdtab]"); if (tb) { state.mdTab = tb.dataset.mdtab; return renderSlots(); }
  const sl = e.target.closest("[data-slot]");
  { const ma = e.target.closest("[data-mdacc]"); if (ma) { // ⬇ افتح الكل / ⬆ اقفل الكل
      const want = ma.dataset.mdacc === "open", ids = slotsArr().map((x) => x.id);
      ids.forEach((id) => { state.acc[id] = want ? 1 : 0; }); saccSave();
      document.querySelectorAll("#slots .slot[data-slot]").forEach((el) => { if (want || !state.open.has("e:" + el.dataset.slot)) saccSet(el, el.dataset.slot, want); });
      return toast(want ? "⬇ اتفتحت كل الخانات" : "⬆ اتقفلت كل الخانات"); } }
  if (e.target.closest("#mineDeepBtn")) { // 📞 دوّر على أرقام الصافيين الظاهرين من غير رقم
    const targets = [], seenK = new Set(), minS = mineCfg.min || 70;
    for (const s of slotsArr()) for (const h of slotHits(s)) {
      if (h.score < minS || !TRUST_SHOW.real(h.tr) || (h.phones && h.phones.length)) continue; // صافي ومن غير رقم بس
      const k = personKey(h); if (seenK.has(k)) continue; seenK.add(k);
      targets.push({ uid: h.uid || "", name: h.name || "", url: h.url || "", urls: (h.more || []).map((m) => m.url).filter(Boolean), group: h.group || "" });
    }
    if (!targets.length) return toast("📞 كل الصافيين الظاهرين معاهم أرقام (أو مفيش صافيين من غير رقم)");
    const r = await chrome.runtime.sendMessage({ type: "mineDeep", targets }).catch((er) => ({ ok: false, error: String(er.message || er) }));
    if (!r || !r.ok) return toast("❌ " + ((r && r.error) || "مفيش رد"));
    const x = r.r || {};
    return toast(x.started ? `🔎 بدأ يدوّر على أرقام ${x.people} شخص (${x.items} بوست) — الأرقام هتظهر على الكروت أول بأول`
      : x.busy ? "⏳ فيه سحب شغال — هيدوّر على الأرقام أول ما يخلص"
      : x.found || x.local ? `✅ لقى ${x.found || x.local} رقم من داتا قديمة من غير فتح بوستات` : "ℹ️ مفيش حد محتاج بحث (اتدوّر عليهم قبل كده ومفيش لينك بوست ينفع)");
  }
  if (e.target.closest("#mineAll")) {
    const r = await chrome.runtime.sendMessage({ type: "mineRun" }).catch((er) => ({ ok: false, error: String(er.message || er) }));
    return toast(r && r.ok ? (r.r.waiting ? "⏳ فيه سحب شغال — هيبدأ أول ما يخلص" : `🔎 بدأ السحب المخصص (${r.r.items} مكان) — النتايج هتظهر تحت كل خانة أول بأول`) : "❌ " + ((r && r.error) || "مفيش رد"));
  }
  if (e.target.closest("[data-trustall]")) { mineCfg = { ...mineCfg, trust: "all" }; await chrome.storage.local.set({ mineCfg }); return toast("👁 بيعرض الكل"); }
  if (!sl) return;
  const id = sl.dataset.slot;
  { const tg = e.target.closest("[data-slottg]"); if (tg) { // 🪗 فتح/قفل الخانة من غير ما نرسم الصفحة تاني (عشان الحركة تبقى سلسة)
      if (state.open.has("e:" + id) || (state.mdq && state.mdq.trim())) return; // وقت التعديل أو البحث الخانة مفتوحة لوحدها
      return saccSet(sl, id, !sl.classList.contains("acc-open")); } }
  const sf = e.target.closest("[data-sf]"); if (sf) { state.sf[id] = sf.dataset.sf; return renderSlots(); }
  const s0 = slotsArr().find((x) => x.id === id); if (!s0) return;
  if (e.target.closest("[data-slotedit]")) {
    const k = "e:" + id;
    if (state.open.has(k)) { const ta = sl.querySelector(".slot-t"); if (ta && ta.value.trim() && ta.value.trim() !== s0.text) await slotUpdate(id, { text: ta.value.trim(), createdAt: Date.now() }); state.open.delete(k); }
    else state.open.add(k);
    return renderSlots();
  }
  if (e.target.closest("[data-slotflip]")) { await slotUpdate(id, { kind: slotKind(s0) === "want" ? "offer" : "want", lastRun: null }); localCache.delete(id);
    { const { mineHits: H = {}, mineDis: D = {} } = await chrome.storage.local.get(["mineHits", "mineDis"]); delete H[id]; delete D[id]; await chrome.storage.local.set({ mineHits: H, mineDis: D }); } return toast(slotKind(s0) === "want" ? "🟢 بقت «عرض» — هتدوّر على مشترين" : "🔵 بقت «طلب» — هتدوّر على بائعين"); }
  if (e.target.closest("[data-slotrun]")) {
    saccSet(sl, id, true); // عشان تشوف النتايج وهي بتنزل
    await slotUpdate(id, { lastRun: Date.now() });
    const r = await chrome.runtime.sendMessage({ type: "mineRun", ids: [id] }).catch((er) => ({ ok: false, error: String(er.message || er) }));
    return toast(r && r.ok ? (r.r.waiting ? "⏳ فيه سحب شغال — هيبدأ أول ما يخلص" : `🔎 بدأ يدوّر (${r.r.items} مكان)`) : "❌ " + ((r && r.error) || "مفيش رد"));
  }
  if (e.target.closest("[data-slotdel]")) {
    if (!confirm("تمسح الخانة دي بنتايجها؟")) return;
    await saveSlots(slotsArr().filter((x) => x.id !== id)); localCache.delete(id);
    const { mineHits: H = {}, mineDis: D = {} } = await chrome.storage.local.get(["mineHits", "mineDis"]); delete H[id]; delete D[id]; await chrome.storage.local.set({ mineHits: H, mineDis: D });
    return;
  }
  if (e.target.closest("[data-slotopen]")) { const k = "s:" + id; state.open.has(k) ? state.open.delete(k) : state.open.add(k); return renderSlots(); }
  const hk = e.target.closest("[data-hkey]"); if (!hk) return;
  const h = slotHits(s0).find((x) => (x.key || personKey(x)) === hk.dataset.hkey); if (!h) return;
  if (e.target.closest("[data-trfix]")) {
    const pk = MATCH.trustPK(h); if (!pk) return toast("مش قادر أميّز الشخص ده");
    const cur = trustFix[pk], nx = cur === "real" ? "broker" : cur === "broker" ? "" : "real";
    const { trustFix: TF = {} } = await chrome.storage.local.get("trustFix");
    if (nx) TF[pk] = nx; else delete TF[pk];
    await chrome.storage.local.set({ trustFix: TF });
    return toast(nx === "real" ? "✅ اتعلّم: مشتري حقيقي (في كل الخانات)" : nx === "broker" ? "🏢 اتعلّم: سمسار (في كل الخانات)" : "🔄 رجع البرنامج يحدد لوحده");
  }
  if (e.target.closest("[data-hup]")) { // 👍 ثبّته فوق (ويتخزن كتقييم متزامن)
    const { matchFb: m = {} } = await chrome.storage.local.get("matchFb"), key = "hit|" + id + "|" + personKey(h);
    if (m[key] && m[key].v === 1) { delete m[key]; toast("اتشال التثبيت"); } else { m[key] = { k: "hit", v: 1, at: Date.now(), updatedAt: Date.now(), slot: id, name: h.name || "", score: h.score }; toast("👍 اتثبّت فوق"); }
    await chrome.storage.local.set({ matchFb: m }); matchFb = m; return render();
  }
  if (e.target.closest("[data-hhide]")) {
    { const { matchFb: m = {} } = await chrome.storage.local.get("matchFb"); m["hit|" + id + "|" + personKey(h)] = { k: "hit", v: -1, at: Date.now(), updatedAt: Date.now(), slot: id, name: h.name || "", score: h.score }; await chrome.storage.local.set({ matchFb: m }); matchFb = m; }
    const { mineDis: D = {} } = await chrome.storage.local.get("mineDis"); (D[id] = D[id] || {})[personKey(h)] = Date.now(); await chrome.storage.local.set({ mineDis: D });
    const { mineHits: H = {} } = await chrome.storage.local.get("mineHits"); let ch = false; for (const x of H[id] || []) if (personKey(x) === personKey(h)) { x.hidden = true; ch = true; } if (ch) await chrome.storage.local.set({ mineHits: H });
    return;
  }
  if (e.target.closest("[data-hcopy]")) { await copyText(slotMsg(s0, h)); toast("📋 اتنسخت الرسالة"); }
});
$("mineTrust").addEventListener("change", async (e) => { mineCfg = { ...mineCfg, trust: e.target.value }; await chrome.storage.local.set({ mineCfg }); toast({ all: "👁 بيعرض الكل", noBroker: "🏢 السماسرة اتخفوا", real: "✅ الصافي بس: مشتري صافي للعرض، بائع صافي للطلب" }[e.target.value] || ""); });
$("mineDeep").addEventListener("change", async (e) => { mineCfg = { ...mineCfg, deep: e.target.checked }; await chrome.storage.local.set({ mineCfg }); toast(e.target.checked ? "🔎 بعد كل بحث هيدوّر على أرقام الصافيين في تعليقاتهم" : "⏸ البحث التلقائي عن الأرقام اتقفل (لسه تقدر تدوس الزرار)"); });
$("mineMinS").addEventListener("change", async (e) => { mineCfg = { ...mineCfg, min: +e.target.value }; await chrome.storage.local.set({ mineCfg }); });
$("mineEvery").addEventListener("change", async (e) => { mineCfg = { ...mineCfg, every: +e.target.value }; await chrome.storage.local.set({ mineCfg }); toast(+e.target.value === -1 ? `🔄 هيدوّر مع الدورة الكاملة (مرة كل ٣ ساعات)` : +e.target.value === 0 ? "⏸ الدوران التلقائي مقفول" : `🔁 هيدوّر لوحده كل ${hrsTxt(+e.target.value)}`); });

// ⚡ أرشفة القديم + حجم الداتا
async function fillKeep() {
  const { dataCfg = {} } = await chrome.storage.local.get("dataCfg");
  const sel = $("keepDays"); if (!sel) return;
  sel.value = String(dataCfg.keepDays == null ? 120 : dataCfg.keepDays);
  const np = Object.keys(raw || {}).length, nc = Object.keys(comments || {}).length;
  $("dataSize").textContent = `دلوقتي في البرنامج: ${np.toLocaleString("ar-EG-u-nu-latn")} بوست · ${nc.toLocaleString("ar-EG-u-nu-latn")} تعليق` +
    (dataCfg.lastPrune ? ` · آخر أرشفة ${relDay(dataCfg.lastPrune)} (${(dataCfg.lastPruneCounts || {}).posts || 0} بوست)` : "");
}
// 🖼 قراءة الصور (OCR)
async function fillOcr() {
  const box = $("ocrBox"); if (!box) return;
  const { ocrCfg = {} } = await chrome.storage.local.get("ocrCfg");
  $("ocrOnBox").checked = ocrCfg.on !== false;
  const r = await chrome.runtime.sendMessage({ type: "ocrStats" }).catch(() => null);
  const st = r && r.ok ? r.r : null;
  $("ocrRunBtn").disabled = !st || !st.available;
  $("ocrStat").textContent = !st ? "—" : !st.available ? "مش متاحة هنا (بتشتغل في برنامج ويندوز/السيرفر — والنتايج بتيجي بالمزامنة)"
    : `اتقرا ${st.done.toLocaleString("ar-EG-u-nu-latn")} بوست (${st.withText.toLocaleString("ar-EG-u-nu-latn")} فيهم كلام) · مستني ${st.pending.toLocaleString("ar-EG-u-nu-latn")}` + (st.hold ? ` · معلّق ${st.hold.toLocaleString("ar-EG-u-nu-latn")}` : "") + (st.info && st.info.lastError ? ` · آخر مشكلة: ${st.info.lastError}` : "");
}
document.addEventListener("change", async (e) => {
  if (e.target.id !== "ocrOnBox") return;
  const { ocrCfg = {} } = await chrome.storage.local.get("ocrCfg");
  await chrome.storage.local.set({ ocrCfg: { ...ocrCfg, on: e.target.checked } });
  toast(e.target.checked ? "🖼 هيقرا الصور اللي فيها تفاصيل" : "🖼 قراءة الصور اتقفلت");
  fillOcr();
});
document.addEventListener("click", async (e) => {
  if (!e.target.closest("#ocrRunBtn")) return;
  toast("⏳ بيقرا الصور…");
  const r = await chrome.runtime.sendMessage({ type: "ocrRun", rounds: 40 }).catch((er) => ({ ok: false, error: String(er.message || er) }));
  toast(r && r.ok ? (r.n ? `✅ قرا ${r.n} بوست` : "✅ مفيش صور معلّقة") : "❌ " + ((r && r.error) || "مفيش رد"));
  fillOcr();
});
document.addEventListener("change", async (e) => {
  if (e.target.id !== "keepDays") return;
  const { dataCfg = {} } = await chrome.storage.local.get("dataCfg");
  await chrome.storage.local.set({ dataCfg: { ...dataCfg, keepDays: +e.target.value } });
  toast(+e.target.value ? `🗂 هيحتفظ بآخر ${e.target.value} يوم — والأقدم يتأرشف لوحده` : "🗂 مش هيأرشف حاجة");
});
document.addEventListener("click", async (e) => {
  if (!e.target.closest("#pruneNow")) return;
  toast("⏳ بيأرشف القديم…");
  const r = await chrome.runtime.sendMessage({ type: "pruneOld" }).catch((er) => ({ ok: false, error: String(er.message || er) }));
  if (!r || !r.ok) return toast("❌ " + ((r && r.error) || "مفيش رد"));
  toast(r.r.off ? "الأرشفة مقفولة (اختار مدة الأول)" : r.r.none ? "✅ مفيش داتا أقدم من المدة دي" : `✅ اتأرشف ${r.r.counts.posts} بوست و${r.r.counts.comments} تعليق`);
  fillKeep();
});

// التاريخ جنب الأدوات (بيبان في شكل «احترافي» جوه البرنامج)
try { $("tbDate").innerHTML = `<b>لوحة التحكم</b><span>${new Date().toLocaleDateString("ar-EG-u-nu-latn", { weekday: "long", day: "numeric", month: "long" })}</span>`; } catch {}

// ================= 🎯 مراجعة الدقة على الداتا الحقيقية =================
// عينة عشوائية: بوستات اتعرضت + بوستات البرنامج شايفها «مش عقارية» + تعليقات — وانت تحكم صح ولا غلط
const ACC_T = { request: "📢 طلب شراء", offer: "🏷 عرض بيع", none: "🚫 مش طلب ولا عرض" };
const ACC_C = { land: "🌾 أرض", apartment: "🏢 شقة", villa: "🏡 فيلا", other: "📦 أخرى" };
let accQ = [], accI = 0, accAwait = null, accTeach = null;
const accShuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
async function accGet() { const { accReview = { items: {} } } = await chrome.storage.local.get("accReview"); accReview.items = accReview.items || {}; return accReview; }
async function accSave(key, rec) { const R = await accGet(); R.items[key] = { ...rec, at: Date.now() }; await chrome.storage.local.set({ accReview: R }); }
function accRead(p) { // قراءة البرنامج لبوست (حتى لو مش معروض)
  if (byId.has(p.id)) return byId.get(p.id);
  const c = PH.compile(settings), a = PH.merge(PH.analyze(PH.fullText(p), c), p.ai);
  return { ...p, ...a, type: a.rent ? null : a.type };
}
async function accBuild(n = 20) {
  const R = await accGet(), done = new Set(Object.keys(R.items));
  const since = Date.now() - 30 * 864e5, recent = (x) => (x.ts || x.scannedAt || 0) >= since;
  const A = accShuffle(items.filter((p) => recent(p) && !done.has("p:" + p.id)));
  const B = accShuffle(Object.values(raw).filter((p) => !byId.has(p.id) && recent(p) && !done.has("p:" + p.id) && p.text && p.text.length > 12));
  const C = accShuffle(Object.values(comments).filter((c) => recent(c) && !done.has("c:" + c.id)));
  const want = { A: Math.round(n * 0.55), B: Math.round(n * 0.2), C: n - Math.round(n * 0.55) - Math.round(n * 0.2) };
  const out = [...A.slice(0, want.A).map((p) => ({ k: "p", p })), ...B.slice(0, want.B).map((p) => ({ k: "p", p, dropped: true })), ...C.slice(0, want.C).map((c) => ({ k: "c", c }))];
  // لو نوع ناقص نكمّل من التاني
  const extra = [...A.slice(want.A).map((p) => ({ k: "p", p })), ...C.slice(want.C).map((c) => ({ k: "c", c })), ...B.slice(want.B).map((p) => ({ k: "p", p, dropped: true }))];
  while (out.length < n && extra.length) out.push(extra.shift());
  return accShuffle(out);
}
function accChip(label, val) { return `<span class="acc-chip"><small>${label}</small><b>${val}</b></span>`; }
function accCmtRead(c) {
  const it = PH.interest(c.text, PH.compile(settings));
  const v = it.broker || it.seller ? "seller" : it.w >= 15 ? "buyer" : "weak";
  return { v, it };
}
const ACC_CV = { buyer: "🙋 مهتم بالشراء", seller: "🏢 بايع أو سمسار", weak: "😐 مش مهتم قوي" };
function accRender() {
  const b = $("accBody");
  $("accProg").textContent = accQ.length ? `(${Math.min(accI + 1, accQ.length)} من ${accQ.length})` : "";
  if (accTeach) return accRenderTeach();
  if (accI >= accQ.length) {
    b.innerHTML = `<div class="acc-done"><b>✅ خلصت المراجعة — شكرًا!</b><p class="muted">النتيجة اتحدثت في الإعدادات. كل ما تراجع أكتر، الرقم يبقى أدق.</p>
      <div class="row-actions"><button class="btn primary" id="accMore">🎯 راجع 20 كمان</button><button class="btn" id="accClose2">تمام</button></div></div>`;
    return;
  }
  const s = accQ[accI];
  if (s.k === "p") {
    const r = accRead(s.p);
    const t = r.type || "none";
    b.innerHTML = `<div class="fix-text">${esc(s.p.text)}</div>
      <div class="acc-read"><div class="muted sm">البرنامج فهمه كده:</div>
        ${accChip("النوع", ACC_T[t])}${t !== "none" ? accChip("العقار", ACC_C[r.category] || "—") + accChip("المنطقة", esc(r.region || "—")) + accChip("المساحة", r.areaM2 ? fmtN(r.areaM2) + " م²" : "—") + accChip("السعر", r.price ? esc(PH.fmtPrice(r.price)) : "—") : ""}</div>
      ${s.dropped ? `<div class="acc-q">هل البرنامج صح إنه <b>مش</b> طلب ولا عرض عقار؟</div>
        <div class="acc-btns"><button class="btn primary" data-acc="ok">✅ صح، مش طلب ولا عرض</button><button class="btn" data-acc="as-request">📢 لأ — ده طلب شراء</button><button class="btn" data-acc="as-offer">🏷 لأ — ده عرض بيع</button><button class="btn sm" data-acc="skip">⏭ تخطّي</button></div>`
      : `<div class="acc-btns"><button class="btn primary" data-acc="ok">✅ كله صح</button><button class="btn" data-acc="wrong">✏️ فيه غلط — صحّحه</button><button class="btn sm" data-acc="skip">⏭ تخطّي</button></div>`}
      <div class="muted sm acc-keys">⌨️ اختصارات: <b>1</b> صح · <b>2</b> غلط · <b>Space</b> تخطّي</div>`;
  } else {
    const c = s.c, r = accCmtRead(c);
    b.innerHTML = `<div class="fix-text"><b>💬 ${esc(c.name || "")}:</b> ${esc(c.text)}${c.postText ? `<div class="muted sm" style="margin-top:6px">↩️ على بوست: ${esc(c.postText.slice(0, 220))}…</div>` : ""}</div>
      <div class="acc-read"><div class="muted sm">البرنامج شايف صاحب التعليق:</div>${accChip("", ACC_CV[r.v])}</div>
      <div class="acc-btns"><button class="btn primary" data-acc="ok">✅ صح</button>
        ${["buyer", "seller", "weak"].filter((v) => v !== r.v).map((v) => `<button class="btn" data-acc="c-${v}">لأ — ${ACC_CV[v]}</button>`).join("")}
        <button class="btn sm" data-acc="skip">⏭ تخطّي</button></div>
      <div class="muted sm acc-keys">⌨️ اختصارات: <b>1</b> صح · <b>Space</b> تخطّي</div>`;
  }
}
// 🎓 علّم البرنامج: اختار الكلمة/الكلمات اللي في النص بتدل على الحاجة اللي فاتته
function accRenderTeach() {
  const T = accTeach, toks = T.text.replace(/[\n\r]+/g, " ").split(/\s+/).filter(Boolean).slice(0, 120);
  const what = T.kind === "region" ? `المنطقة «${esc(T.value)}»` : T.value === "request" ? "إنه <b>طلب شراء</b>" : "إنه <b>عرض بيع</b>";
  $("accBody").innerHTML = `<div class="acc-q">🎓 <b>علّم البرنامج:</b> دوس على الكلمة (أو كلمتين/تلاتة ورا بعض) اللي في الكلام بتقول ${what} — عشان يفهمها لوحده المرة الجاية في كل البوستات</div>
    <div class="acc-toks">${toks.map((w, i) => `<button class="acc-tok ${T.sel.includes(i) ? "on" : ""}" data-tok="${i}">${esc(w)}</button>`).join(" ")}</div>
    ${T.sel.length ? `<div class="muted sm">الكلام ده موجود في ${Object.values(raw).filter((p) => PH.norm(p.text).includes(PH.norm(T.sel.map((i) => toks[i]).join(" ")))).length} بوست من بوستاتك</div>` : ""}
    <div class="acc-btns"><button class="btn primary" data-acc="teach-save" ${T.sel.length ? "" : "disabled"}>🎓 علّمه «${esc(T.sel.map((i) => toks[i]).join(" "))}»</button><button class="btn" data-acc="teach-skip">مش لازم — كمّل</button></div>`;
  T.toks = toks;
}
async function accTeachSave() {
  const T = accTeach; if (!T || !T.sel.length) return;
  let phrase = T.sel.map((i) => T.toks[i]).join(" ").replace(/[.,،؟?!:؛"«»()]/g, "").trim();
  // «بالتاسع» → «تاسع» (البرنامج بيفهم البادئات لوحده)
  const pm = phrase.match(/^(وبال|بال|وال|فال|كال|لل|ال|وب|و|ب|ف)(.+)$/);
  if (pm && pm[2].replace(/\s.*$/, "").length >= 3) phrase = pm[2];
  const np = PH.norm(phrase);
  const STOP = /^(ارض|اراضي|قطعه|شقه|شقق|فيلا|فيلات|متر|م|مليون|الف|جنيه|للبيع|بيع|مطلوب|شراء|في|من|علي|عايز|محتاج|كاش|تقسيط|سعر|حي|منطقه|مجاوره|دور|غرف|غرفه)$/;
  if (np.length < 3 || STOP.test(np)) return toast("⚠️ الكلمة دي عامة قوي — هتلخبط البرنامج. اختار كلمة مميزة أكتر");
  if (/^[\d\s.,]+$/.test(PH.toEn(np)) || /\d{4,}/.test(PH.toEn(np))) return toast("⚠️ الأرقام (والتليفونات) ما ينفعش تتعلّم — اختار كلمة");
  if (/^(اول|الاول|ثاني|تاني|التاني|ثالث|تالت|رابع|خامس|سادس|سابع|ثامن|تامن|تاسع|عاشر|حادي|عشر|اتناشر|حداشر)$/.test(np)) return toast("⚠️ دي كلمة رقم (أول/تاني…) — اختار الكلمة كاملة زي «الحي الخامس» أو اسم المكان");
  if (T.kind === "region") {
    const C0 = PH.compile(settings);
    const other = C0.regions.find((r) => r.name !== T.value && r.kws.some((k) => k.join(" ") === np));
    if (other) return toast(`⚠️ «${phrase}» متعلّمة أصلًا على «${other.name}»`);
    const rr = PH.analyze("ارض في " + phrase, C0).region;
    if (rr && rr === T.value) { toast(`👍 البرنامج فاهم «${phrase}» = ${rr} أصلًا`); accTeach = null; accI++; return accRender(); }
    if (rr && !/^(بني سويف الجديدة|شرق النيل)$/.test(rr)) return toast(`⚠️ البرنامج فاهم «${phrase}» على إنها «${rr}» — اختار كلمة تانية`);
  }
  const { settings: st0 } = await chrome.storage.local.get("settings"); const st = { ...(st0 || {}) };
  if (T.kind === "region") {
    const lines = (st.regions && st.regions.length ? st.regions : PH.regionsFor(PH.compile(st).gov)).slice();
    const i = lines.findIndex((l) => String(l).split("=")[0].trim() === T.value);
    if (i >= 0) { const [nm, syn = ""] = String(lines[i]).split("="); const s = syn.split(/[،,]/).map((x) => x.trim()).filter(Boolean); if (!s.includes(phrase)) s.push(phrase); lines[i] = nm.trim() + " = " + s.join("، "); }
    else lines.push(`${T.value} = ${phrase}`);
    st.regions = lines;
  } else {
    const k = T.value; const list = (st[k] && st[k].length ? st[k] : PH.DEFAULTS[k]).slice();
    if (!list.includes(phrase)) list.push(phrase);
    st[k] = list;
  }
  await chrome.storage.local.set({ settings: st });
  const { accLearned = [] } = await chrome.storage.local.get("accLearned");
  accLearned.push({ at: Date.now(), kind: T.kind, value: T.value, phrase }); await chrome.storage.local.set({ accLearned: accLearned.slice(-500) });
  toast(`🎓 اتعلّم «${phrase}» — هيطبّقه على كل البوستات`);
  accTeach = null; accI++; accRender();
}
async function accAnswer(a) {
  const s = accQ[accI]; if (!s) return;
  if (a === "skip") { accI++; return accRender(); }
  if (s.k === "c") {
    const r = accCmtRead(s.c), truth = a === "ok" ? r.v : a.slice(2);
    await accSave("c:" + s.c.id, { k: "c", id: s.c.id, ok: truth === r.v, prog: r.v, truth, text: s.c.text.slice(0, 300), post: (s.c.postText || "").slice(0, 200) });
    accI++; return accRender();
  }
  const r = accRead(s.p), prog = { type: r.type || "none", category: r.category || "", region: r.region || "", areaM2: r.areaM2 || "", price: r.price || "" };
  if (a === "ok") { await accSave("p:" + s.p.id, { k: "p", id: s.p.id, ok: true, wrong: [], prog, dropped: !!s.dropped, text: s.p.text.slice(0, 300) }); accI++; return accRender(); }
  if (a === "as-request" || a === "as-offer") {
    const type = a === "as-request" ? "request" : "offer";
    { const fx = { ...((raw[s.p.id] || {}).fix || {}), type }; // عن طريق طابور الخلفية (updatePost بتقرا posts كلها وتكتبها كلها وممكن تكتب فوق بوستات الصياد الجديدة)
      const r0 = await chrome.runtime.sendMessage({ type: "phPost", id: s.p.id, op: "fix", fix: fx, before: null }).catch(() => null);
      if (!r0 || !r0.ok) await updatePost(s.p.id, (x) => { x.fix = fx; }); }
    await accSave("p:" + s.p.id, { k: "p", id: s.p.id, ok: false, wrong: ["type"], prog, truth: { type }, dropped: true, text: s.p.text.slice(0, 300) });
    accTeach = { kind: "type", value: type, text: s.p.text, sel: [] }; return accRender();
  }
  if (a === "wrong") { // نفتح شاشة «صحّح» العادية ونرجع بعدها
    accAwait = { key: "p:" + s.p.id, id: s.p.id, prog, text: s.p.text };
    $("accModal").hidden = true; openFix(s.p.id);
  }
}
// بيتنادى من saveFix لما التصحيح يتحفظ وانت في المراجعة
async function accAfterFix(fix) {
  const w = accAwait; accAwait = null; if (!w) return;
  const wrong = Object.keys(fix || {}).filter((k) => ["type", "category", "region", "areaM2", "price", "ppm", "landType", "mugawra", "plot", "over"].includes(k));
  await accSave(w.key, { k: "p", id: w.id, ok: !wrong.length, wrong, prog: w.prog, truth: fix || {}, text: w.text.slice(0, 300) });
  $("accModal").hidden = false;
  if (fix && fix.region) accTeach = { kind: "region", value: fix.region, text: w.text, sel: [] };
  else if (fix && (fix.type === "request" || fix.type === "offer")) accTeach = { kind: "type", value: fix.type, text: w.text, sel: [] };
  else accI++;
  accRender();
}
async function accStats() {
  const el = $("accStats"); if (!el) return;
  const R = await accGet(), L = Object.values(R.items);
  const P = L.filter((x) => x.k === "p"), Pshown = P.filter((x) => !x.dropped), Pdrop = P.filter((x) => x.dropped), C = L.filter((x) => x.k === "c");
  if (!L.length) { el.innerHTML = `<div class="muted">لسه ما راجعتش حاجة — دوس «🎯 راجع 20 عينة».</div>`; return; }
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);
  const bar = (label, p, n, hint = "") => p == null ? "" : `<div class="acc-bar"><span>${label}</span><i><b style="width:${p}%" class="${p >= 90 ? "g" : p >= 75 ? "y" : "r"}"></b></i><em>${p}%</em><small class="muted">${n}${hint}</small></div>`;
  const fieldOk = (f) => pct(Pshown.filter((x) => !(x.wrong || []).includes(f)).length, Pshown.length);
  const { accLearned = [] } = await chrome.storage.local.get("accLearned");
  el.innerHTML = `<div class="acc-total"><b>${pct(L.filter((x) => x.ok).length, L.length)}%</b><span>الدقة الكلية على ${L.length} عينة راجعتها</span></div>` +
    bar("البوستات (كله صح)", pct(Pshown.filter((x) => x.ok).length, Pshown.length), Pshown.length + " بوست") +
    bar("· النوع (طلب/عرض)", fieldOk("type"), "") + bar("· نوع العقار", fieldOk("category"), "") + bar("· المنطقة", fieldOk("region"), "") +
    bar("· المساحة", fieldOk("areaM2"), "") + bar("· السعر", fieldOk("price"), "") +
    bar("مش بيفوّت طلبات/عروض", pct(Pdrop.filter((x) => x.ok).length, Pdrop.length), Pdrop.length + " بوست اتشال") +
    bar("التعليقات (مهتم/سمسار)", pct(C.filter((x) => x.ok).length, C.length), C.length + " تعليق") +
    (accLearned.length ? `<div class="muted sm" style="margin-top:6px">🎓 علّمت البرنامج ${accLearned.length} كلمة: ${accLearned.slice(-6).map((x) => "«" + esc(x.phrase) + "»").join(" · ")}</div>` : "");
}
document.addEventListener("click", async (e) => {
  const t = e.target;
  if (t.closest("#accStart") || t.closest("#accMore")) {
    accQ = await accBuild(20); accI = 0; accTeach = null;
    if (!accQ.length) return toast("مفيش داتا كفاية لسه — اسحب الأول");
    $("accModal").hidden = false; accRender(); return;
  }
  if (t.closest("#accClose") || t.closest("#accClose2")) { $("accModal").hidden = true; accStats(); return; }
  if (t.closest("#accReset")) { if (!confirm("تصفّر عدّاد المراجعة؟ (التصحيحات والكلمات اللي علّمتها بتفضل)")) return; await chrome.storage.local.set({ accReview: { items: {} } }); accStats(); return; }
  if (t.closest("#accExport")) {
    const R = await accGet(); const { fixLog = [], accLearned = [] } = await chrome.storage.local.get(["fixLog", "accLearned"]);
    if (!Object.keys(R.items).length && !fixLog.length) return toast("لسه مفيش مراجعات");
    download(`مراجعة-الدقة_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: "Alaa Deals", kind: "accuracy-review", at: new Date().toISOString(), reviews: Object.values(R.items), learned: accLearned, fixes: fixLog.slice(-1000) }, null, 1), "application/json");
    return;
  }
  const tk = t.closest("[data-tok]");
  if (tk && accTeach) { const i = +tk.dataset.tok, S = accTeach.sel; if (S.includes(i)) accTeach.sel = S.filter((x) => x !== i); else { const nx = [...S, i].sort((a, b) => a - b); accTeach.sel = nx.length <= 3 && nx[nx.length - 1] - nx[0] === nx.length - 1 ? nx : [i]; } accRender(); return; }
  const b = t.closest("[data-acc]"); if (!b) return;
  const a = b.dataset.acc;
  if (a === "teach-save") return accTeachSave();
  if (a === "teach-skip") { accTeach = null; accI++; return accRender(); }
  accAnswer(a);
});
document.addEventListener("keydown", (e) => {
  if ($("accModal").hidden || accTeach || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || "")) return;
  const s = accQ[accI]; if (!s) return;
  if (e.key === "1") { e.preventDefault(); accAnswer("ok"); }
  else if (e.key === "2" && s.k === "p" && !s.dropped) { e.preventDefault(); accAnswer("wrong"); }
  else if (e.key === " ") { e.preventDefault(); accAnswer("skip"); }
  else if (e.key === "Escape") { $("accModal").hidden = true; accStats(); }
});

// ================= 🩺 فحص البرنامج =================
const isNightHour = () => { const h = new Date().getHours(); return h >= 1 && h < 6; };
async function diagnose() {
  const g = await chrome.storage.local.get(["autoCfg", "autoLog", "scrapeHealth", "fbGroups", "waGroups", "mineSlots", "mineJob", "mineHits", "settings", "fbQueue", "archives", "huntCfg", "fastLog", "lanesCfg"]);
  g.posts = raw || {}; g.comments = comments || {}; // من الذاكرة (قراءة posts+comments كاملة عند كل فتح للإعدادات كانت 240ms+ ومرتبطة بتحديثات huntCfg.idx)
  const out = [], add = (lvl, title, msg, fix) => out.push({ lvl, title, msg, fix });
  const np = Object.keys(g.posts || {}).length, nc = Object.keys(g.comments || {}).length;
  const ago = (t) => (t ? relDay(t) + " " + new Date(t).toLocaleTimeString("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit" }) : "—");
  // 1) الداتا
  if (!np) add("bad", "الداتا المحفوظة", "مفيش ولا بوست محفوظ لسه — لازم دورة سحب تخلص الأول.", "cycle");
  else add("ok", "الداتا المحفوظة", `${np.toLocaleString("ar-EG-u-nu-latn")} بوست · ${nc.toLocaleString("ar-EG-u-nu-latn")} تعليق محفوظين`);
  // 2) الظاهر
  const st = engineInfo.stats || {}, shown = items.length;
  if (np && !shown) {
    const c = PH.compile(g.settings), all = MATCH.enrichAll(g.posts || {}, g.settings);
    const byCat = all.filter((p) => c.cats.includes(p.category)).length;
    add("bad", "الظاهر في البرنامج", `محفوظ ${np} بوست والبرنامج فهم منهم ${all.length} طلب/عرض، بس الظاهر 0 — ${!all.length ? "التحليل نفسه مالقاش طلبات أو عروض" : !byCat ? "أنواع العقارات المختارة فوق (أراضي/شقق/فلل) مخبية كل حاجة" : "فلتر المنطقة (أحياء التركيز) مخبي كل حاجة"}.`, all.length ? "filters" : null);
  } else if (np) add("ok", "الظاهر في البرنامج", `${shown.toLocaleString("ar-EG-u-nu-latn")} طلب وعرض ظاهرين (${items.filter((p) => p.type === "request").length} طلب · ${items.filter((p) => p.type === "offer").length} عرض) · ${leads.filter((L) => !L.isBroker).length} مشتري · ${sellers.length} مالك/بايع`);
  // 3) المحرك
  if (engineInfo.errs && engineInfo.errs.length) add("bad", "حسابات البرنامج", "فيه خطوة وقعت: " + engineInfo.errs.join(" · "), "fix");
  else add(engineInfo.mode === "inline" ? "warn" : "ok", "حسابات البرنامج", `${engineInfo.mode === "worker" ? "شغالة في الخلفية ✅" : engineInfo.mode === "inline" ? "شغالة بالطريقة الاحتياطية (" + (engineInfo.why || "") + ")" : "—"} · آخر حساب ${engineInfo.ms ? Math.round(engineInfo.ms / 100) / 10 + " ثانية" : "—"}`, engineInfo.mode === "inline" ? "fix" : null);
  // 4) التطابق
  {
    const reqN = items.filter((p) => p.type === "request").length, offN = items.filter((p) => p.type === "offer").length;
    const buyN = leads.filter((L) => !L.isBroker && L.level >= 1).length;
    const strong = pairs.filter((x) => x.score >= 70).length;
    if (matches.size || pairs.length) add("ok", "التطابق", `${ar(pairs.length)} تطابق مشتري ⟷ بايع (منهم ${ar(strong)} قوي 70%+) · ${ar(matches.size)} طلب/عرض ليهم تطابق مباشر · المشترين: ${ar(buyN)} · العروض: ${ar(offN)}`);
    else if (!reqN && !buyN) add("warn", "التطابق", "لسه مفيش مشترين ولا طلبات — فعّل «⚡ ذكي» في تعليقات فيسبوك واسحب جروبات فيها طلبات.");
    else if (!offN && !sellers.length) add("warn", "التطابق", "فيه مشترين بس لسه مفيش عروض بيع يتطابقوا معاها — اسحب جروبات فيها عروض أو فعّل ماركت بليس.");
    else add("warn", "التطابق", `عندك ${ar(reqN + buyN)} مشتري/طلب و ${ar(offN + sellers.length)} عرض/بايع بس مفيش تطابق — غالبًا مناطق أو أنواع مختلفة؛ راجع «📍 منطقتك» في الإعدادات.`);
  }
  // 5) السحب
  const cfg = g.autoCfg || {}, lg = g.autoLog || {}, H = g.scrapeHealth || {};
  let next = null; try { const a = await chrome.alarms.get("autoScan"); next = a && a.scheduledTime; } catch {}
  if (!cfg.enabled) add("bad", "التحديث التلقائي", "مقفول — البرنامج مش هيسحب لوحده.", "enable");
  else add("ok", "التحديث التلقائي", `كل ${hrsTxt(cfg.hours)} · الدورة الجاية ${next ? ago(next) : "—"}`);
  const groups = (g.fbGroups || []).filter((x) => x.checked).length, wag = (g.waGroups || []).filter((x) => x.checked).length;
  if (!groups && !wag) add("bad", "الجروبات", "مفيش ولا جروب معلّم عليه — افتح فيسبوك وعلّم الجروبات من الزرار 🏠 العائم.", null);
  else add("ok", "الجروبات", `${groups} جروب فيسبوك · ${wag} جروب واتساب`);
  if (lg.startedAt) {
    const s = lg.summary || {};
    add(lg.finishedAt ? "ok" : (Date.now() - lg.startedAt > 95 * 6e4 ? "bad" : "warn"), "آخر دورة سحب", lg.finishedAt ? `خلصت ${ago(lg.finishedAt)} — ${s.requests || 0} طلب · ${s.offers || 0} عرض · ${s.comments || 0} تعليق مهتم جديد${lg.timedOut ? " (اتقفلت لوحدها بعد ما " + lg.timedOut.join("،") + " علّق)" : ""}` : `شغالة من ${ago(lg.startedAt)} (فاضل: ${(lg.pending || []).join("، ") || "—"})`, lg.finishedAt ? null : "cycle");
  } else add("warn", "آخر دورة سحب", "لسه ولا دورة اشتغلت.", "cycle");
  const hm = { ok: ["ok", "شغال تمام"], empty: ["warn", "آخر سحب مالقاش جديد"], login: ["bad", "فيسبوك مش مسجّل دخول — سجّل دخول بنفسك"], checkpoint: ["bad", "فيسبوك طالب تأكيد هوية — كمّله بنفسك"], broken: ["bad", "السحب مش بيلقط بوستات — افتح جروب واسحب يدوي"], errors: ["bad", "السحب بيقابل أخطاء"] }[H.status];
  if (hm) add(hm[0], "حارس السحب", hm[1] + (H.at ? ` (${ago(H.at)})` : ""));
  { // ⚡ الصياد المستمر
    const hf = { on: true, live: true, ...((g.huntCfg || {}).fast || {}) }, fl = g.fastLog || {}, now = Date.now();
    const lastAt = Math.max(fl.finishedAt || 0, fl.lastHotAt || 0);
    if (!hf.on) add("warn", "⚡ الصياد", "مقفول — البوستات الجديدة بتستنى الدورة الكبيرة (كل " + hrsTxt(cfg.hours) + ").", null);
    else if (cfg.enabled === false || cfg.fb === false) add("warn", "⚡ الصياد", "التحديث التلقائي أو سحب فيسبوك مقفول — الصياد مش هيشتغل.", null);
    else if (fl.pause && fl.pause.until > now) add("bad", "⚡ الصياد", ({ checkpoint: "واقف: فيسبوك طالب تأكيد هوية — افتحه وكمّل بنفسك", login: "واقف: فيسبوك مش مسجّل دخول", empty: "واقف شوية: السحب مش بيلقط بوستات", restricted: "واقف: 🛡 وضع الحماية — فيسبوك قيّد الحساب مؤقتًا" })[fl.pause.why] || "واقف", null);
    else if (!lastAt) add("warn", "⚡ الصياد", hf.live === false ? "لسه ماشتغلش." : "مستمر — لسه ماعملش أول لفة (بيبدأ خلال دقيقة من فتح البرنامج).", null);
    else if (hf.live !== false && now - lastAt > 25 * 6e4 && !isNightHour()) add("warn", "⚡ الصياد", `آخر لفة ${ago(lastAt)} — أقدم من المتوقع؛ تأكد إن فيسبوك مفتوح ومسجّل دخول.`, null);
    else add("ok", "⚡ الصياد", `${hf.live === false ? `كل ${hf.minutes || 10} د` : "مستمر"} · آخر لفة ${ago(lastAt)} · جاب ${fl.total || 0} جديد من ${(fl.runs || 0) + (fl.hotPasses || 0)} لفة`);
  }
  if (g.fbQueue && g.fbQueue.lastError) add("warn", "آخر خطأ في السحب", String(g.fbQueue.lastError).slice(0, 200));
  if (g.lanesCfg && (g.lanesCfg.protectUntil || 0) > Date.now()) add("bad", "🛡 وضع الحماية", `شغّال — ${g.lanesCfg.protectWhy || "فيسبوك قيّد الحساب"}؛ السحب كله واقف لحد ${new Date(g.lanesCfg.protectUntil).toLocaleTimeString("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit" })}. ممكن تفكه من «🛣 مسارات السحب» في الإعدادات.`);
  const autoArch = (g.archives || []).filter((a) => a.auto && a.counts);
  if (autoArch.length) add("warn", "أرشفة تلقائية", `اتأرشف ${autoArch.reduce((s, a) => s + (a.counts.posts || 0), 0)} بوست قديم في ملفات (${autoArch.slice(0, 2).map((a) => a.filename.split("/").pop()).join("، ")}). لو عايزهم يرجعوا: «📂 استرجاع نسخة» في البيانات واختار الملف.`);
  // 6) هاتلي مشتري
  const slots = (g.mineSlots || []).filter((s) => s && s.text).length, mj = g.mineJob || {}, mh = Object.entries(g.mineHits || {}).filter(([k]) => !k.startsWith("pu:")).reduce((a, [, v]) => a + v.length, 0);
  if (!slots) add("warn", "هاتلي مشتري", "مفيش قطع مكتوبة — اكتب قطعك في «🏷 هاتلي مشتري».");
  else add(mj.running ? "warn" : "ok", "هاتلي مشتري", `${slots} قطعة · ${mh} مشتري لقاهم · آخر تدوير ${mj.finishedAt ? ago(mj.finishedAt) : mj.running ? "شغال دلوقتي" : "لسه"}`);
  const ord = { bad: 0, warn: 1, ok: 2 };
  out.sort((a, b) => ord[a.lvl] - ord[b.lvl]);
  return out;
}
const DIAG_FIX = { cycle: "▶ ابدأ دورة", filters: "👁 اعرض كل الأنواع والمناطق", fix: "🔧 إصلاح تلقائي", enable: "✅ شغّل التحديث التلقائي" };
async function renderDiag() {
  const el = $("diagOut"); if (!el) return;
  el.innerHTML = `<div class="muted">⏳ بيفحص…</div>`;
  const L = await diagnose();
  el.innerHTML = L.map((x) => `<div class="diag-row ${x.lvl}"><i>${x.lvl === "ok" ? "✅" : x.lvl === "warn" ? "⚠️" : "❌"}</i><div><b>${esc(x.title)}</b><span>${esc(x.msg)}</span></div>${x.fix ? `<button class="btn sm" data-dfix="${x.fix}">${DIAG_FIX[x.fix]}</button>` : ""}</div>`).join("");
  el._report = `Aqar Matrix ${chrome.runtime.getManifest ? chrome.runtime.getManifest().version : ""} — ${new Date().toLocaleString("ar-EG-u-nu-latn")}\n` + L.map((x) => `${x.lvl === "ok" ? "✅" : x.lvl === "warn" ? "⚠️" : "❌"} ${x.title}: ${x.msg}`).join("\n") + `\nengine: ${JSON.stringify(engineInfo)}`;
}
async function diagFix(kind) {
  if (kind === "cycle") { chrome.runtime.sendMessage({ type: "runAuto" }); toast("▶ بدأت دورة سحب — هتاخد كام دقيقة"); return; }
  if (kind === "enable") { const { autoCfg: a = {} } = await chrome.storage.local.get("autoCfg"); await chrome.storage.local.set({ autoCfg: { ...a, enabled: true } }); toast("✅ اتشغّل"); return renderDiag(); }
  if (kind === "filters") { const { settings: s = {} } = await chrome.storage.local.get("settings"); await chrome.storage.local.set({ settings: { ...s, cats: ["land", "apartment", "villa"], strictFocus: false, extractFocus: false } }); toast("👁 بيعرض كل الأنواع والمناطق"); return; } // extractFocus هو اللي بيخبّي بوستات المناطق التانية فعلًا
  // 🔧 إصلاح: نمسح الكاش ونعيد كل الحسابات من الأول
  toast("🔧 بيصلّح… (بيمسح الكاش ويعيد الحسابات)");
  try { if (EW) EW.terminate(); } catch {} EW = undefined; matchesSynced = false;
  await PH.ancClear();
  await new Promise((r) => { try { const q = indexedDB.deleteDatabase("alaa-derived"); q.onsuccess = q.onerror = q.onblocked = () => r(); } catch { r(); } setTimeout(r, 3000); });
  await chrome.runtime.sendMessage({ type: "engineReset" }).catch(() => {});
  setTimeout(() => location.reload(), 600);
}
document.addEventListener("click", async (e) => {
  if (e.target.closest("#diagRun")) return renderDiag();
  if (e.target.closest("#diagFix")) return diagFix("fix");
  if (e.target.closest("#diagCycle")) return diagFix("cycle");
  if (e.target.closest("#diagCopy")) { if (!$("diagOut")._report) await renderDiag(); await copyText($("diagOut")._report).catch(() => {}); return toast("📋 اتنسخ — ابعتهولي"); }
  const f = e.target.closest("[data-dfix]"); if (f) return diagFix(f.dataset.dfix);
});
// تنبيه في «النهارده» لو فيه حاجة غلط واضحة
async function diagBanner() {
  const el = $("healthBar"); if (!el) return;
  const np = Object.keys(raw || {}).length;
  let msg = "";
  if (np && !items.length && engineInfo.at) msg = `❌ فيه ${np} بوست محفوظ بس مفيش حاجة ظاهرة — دوس «🩺 افحص» في الإعدادات وهيقولك السبب ويصلّحه.`;
  else if (engineInfo.errs && engineInfo.errs.length) msg = "⚠️ فيه جزء من الحسابات وقع — دوس «🩺 افحص» في الإعدادات.";
  const old = el.querySelector(".diag-alert"); if (old) old.remove();
  if (msg) el.insertAdjacentHTML("afterbegin", `<div class="health bad diag-alert"><span>${msg}</span><button class="btn sm" data-goto-diag>🩺 افحص</button></div>`);
}
document.addEventListener("click", (e) => { if (e.target.closest("[data-goto-diag]")) { state.view = "settings"; fillSettings(); render(); setTimeout(() => { $("diagPanel").scrollIntoView({ behavior: "smooth" }); renderDiag(); }, 100); } });

// ================= 📱 واجهة الموبايل (البرنامج على السيرفر بيرد على الموبايل من هنا) =================
// main بيستدعيها: __remoteApi({ op, ... }) — وبترجع داتا خفيفة جاهزة للعرض
window.__remoteApi = async (req = {}) => {
  if (staleWhileHidden || !engineInfo.at) { staleWhileHidden = false; pendHeavy = false; await load(); }
  const { items, leads, sellers } = FULL, pairs = MATCH.applyFb(FULL.pairs, matchFb); // الموبايل بياخد كل الأنواع (فلتر الأنواع للشاشة دي بس)؛ «منطقتك بس» (areaOn) متزامن بين الأجهزة فبيتطبق على القوايم
  const sellersByBuyer = new Map(); for (const x of pairs) { if (!sellersByBuyer.has(x.B.key)) sellersByBuyer.set(x.B.key, []); sellersByBuyer.get(x.B.key).push(x); }
  const op = req.op || "summary", lim = Math.min(200, +req.limit || 60), cat = req.cat && req.cat !== "all" ? req.cat : "";
  const q = PH.norm(String(req.q || "").trim());
  const tsOf2 = (p) => p.ts || p.scannedAt || 0;
  const txt = (s, n = 280) => String(s || "").replace(/\s+/g, " ").slice(0, n);
  const P = (p) => ({ id: p.id, type: p.type, category: p.category, region: p.region || "", area: p.areaM2 || null, price: p.price ? PH.fmtPrice(p.price) : "",
    text: txt(p.text, 400), who: p.sender || "", phones: (p.phones || []).slice(0, 2), url: p.url || "", group: (p.groups || [])[0] || "", at: tsOf2(p),
    matches: (matches.get(p.id) || []).length, deal: (deals.get(p.id) || {}).pct || 0, owner: p.isBroker === false });
  const Lw = (L) => ({ key: L.key, name: L.name, level: L.level, hot: !!L.superHot, score: L.score, phones: (L.phones || []).slice(0, 2), profile: LEADS.profileLink(L) || "",
    want: L.want ? L.want.text : "", money: L.range ? PH.fmtPrice(L.range.mid) : "", last: L.last || 0, regions: L.regions || [], cats: L.categories || [],
    stage: stageOf(L), stageAr: REPORT.STAGES[stageOf(L)] || "", acts: (L.acts || []).slice(0, 3).map((a) => ({ kind: a.kind, text: txt(a.text, 160), post: txt(a.postText, 120), at: a.ts || 0 })),
    sellers: (sellersByBuyer.get(L.key) || []).slice(0, 3).map((x) => ({ name: x.S.name, score: x.score, phones: (x.S.phones || []).slice(0, 1), unit: txt(x.u.text, 140) })) });
  const hit = (s) => (p) => !q || PH.qMatch(q, (p.text || "") + " " + (s(p) || ""), { cats: [p.category], types: [p.type] });
  if (op === "ping") return { ok: true, version: chrome.runtime.getManifest ? chrome.runtime.getManifest().version : "" };
  if (op === "summary") {
    const r = REPORT.buildReport(items, leads, deals, leadMeta, 24);
    const vis = leads.filter((L) => !L.isBroker && L.status !== "hidden");
    let next = null; try { const a = await chrome.alarms.get("autoScan"); next = a && a.scheduledTime; } catch {}
    const mh = Object.entries(mineHits || {}).filter(([k]) => !k.startsWith("pu:")).reduce((a, [, v]) => a + v.filter((h) => !h.hidden).length, 0);
    return { version: chrome.runtime.getManifest ? chrome.runtime.getManifest().version : "", at: Date.now(),
      counts: { requests: items.filter((p) => p.type === "request").length, offers: items.filter((p) => p.type === "offer").length, buyers: vis.length,
        hot: vis.filter((L) => L.superHot).length, interested: vis.filter((L) => L.level >= 2).length, sellers: sellers.length, pairs: pairs.filter((x) => x.score >= 70).length, mine: mh,
        req24: r.req, off24: r.off, due: r.due.length },
      last: autoLog ? { started: autoLog.startedAt || 0, finished: autoLog.finishedAt || 0, summary: autoLog.summary || null } : null, next, every: autoCfg.hours || 1,
      health: scrapeHealth ? { status: scrapeHealth.status, at: scrapeHealth.at } : null,
      hotList: [...r.hot, ...r.warm].slice(0, 8).map(Lw), due: r.due.slice(0, 8).map(Lw), deals: r.deals.slice(0, 6).map(P) };
  }
  if (op === "posts") {
    const t = req.type === "offer" ? "offer" : req.type === "request" ? "request" : "";
    const L = items.filter((p) => (!t || p.type === t) && (!cat || p.category === cat) && inArea(p) && hit((p) => p.sender)(p)).sort((a, b) => tsOf2(b) - tsOf2(a));
    return { total: L.length, list: L.slice(0, lim).map(P) };
  }
  if (op === "buyers") {
    const L = leads.filter((L) => !L.isBroker && L.status !== "hidden" && L.level >= (+req.min || 1) && (!cat || L.categories.includes(cat)) && leadInArea(L) && (!q || PH.qMatch(q, L.name + " " + ((L.want && L.want.text) || ""), { cats: L.categories, types: ["request"] })))
      .sort((a, b) => (b.superHot - a.superHot) || b.score - a.score || b.last - a.last);
    return { total: L.length, list: L.slice(0, lim).map(Lw) };
  }
  if (op === "sellers") {
    const L = sellers.filter((S) => S.status !== "hidden" && (!cat || S.units.some((u) => u.category === cat)) && (!q || PH.qMatch(q, S.name + " " + S.units.map((u) => u.text).join(" "), { cats: S.categories, types: ["offer"] }))).sort((a, b) => (b.owner - a.owner) || b.score - a.score);
    return { total: L.length, list: L.slice(0, lim).map((S) => ({ key: S.key, name: S.name, owner: !!S.owner, broker: !!S.isBroker, role: S.role || "", ownerProb: S.rp, band: S.band || "", phones: (S.phones || []).slice(0, 2), profile: LEADS.profileLink(S) || "",
      units: S.units.slice(0, 3).map((u) => ({ category: u.category, region: u.region || "", area: u.areaM2 || null, price: u.price ? PH.fmtPrice(u.price) : "", text: txt(u.text, 200), url: u.url || "" })),
      buyers: (buyersBySeller.get(S.key) || []).slice(0, 3).map((x) => ({ name: x.B.name, score: x.score, phones: (x.B.phones || []).slice(0, 1) })) })) };
  }
  if (op === "pairs") {
    const A = pairs.filter((x) => x.score >= (+req.min || 70) && (!cat || x.u.category === cat)), L = A.slice(0, lim);
    // 🔗 لينك بوست/تعليق كل طرف (المشتري: طلبه أو تعليقه والبوست اللي علّق عليه · البايع: عرضه أو تعليقه) + صافي/مشتبه/مكتب — لكل التطابقات من غير استثناء
    const lk = (a) => a.filter((l) => l.href && !/البروفايل/.test(l.label)).slice(0, 2).map((l) => ({ href: l.href, label: l.label })), gp = (f, o) => { try { return typeof ROLE !== "undefined" ? f(o) || "" : ""; } catch { return ""; } };
    return { total: A.length, list: L.map((x) => ({ score: x.score, why: (x.why || []).slice(0, 4), buyer: { name: x.B.name, phones: (x.B.phones || []).slice(0, 2), want: x.B.want ? x.B.want.text : "", hot: !!x.B.superHot, profile: LEADS.profileLink(x.B) || "", grp: gp(ROLE.buyerGroup, x.B), links: lk(buyerLinkList(x.B, x.u)) },
      seller: { name: x.S.name, owner: !!x.S.owner, phones: (x.S.phones || []).slice(0, 2), profile: LEADS.profileLink(x.S) || "", grp: gp(ROLE.sellerGroup, x.S), links: lk(sellerLinkList(x.S, x.u)) }, unit: { text: txt(x.u.text, 220), category: x.u.category, region: x.u.region || "", price: x.u.price ? PH.fmtPrice(x.u.price) : "", url: x.u.url || "" } })) };
  }
  if (op === "mine") {
    return { slots: slotsArr().filter((s) => s.text).map((s) => ({ id: s.id, text: s.text, kind: slotKind(s),
      hits: slotHits(s).filter((h) => h.score >= (mineCfg.min || 70)).sort((a, b) => (b.tr.level === "real") - (a.tr.level === "real") || b.score - a.score).slice(0, 40)
        .map((h) => ({ key: h.key, name: h.name, score: h.score, kind: KIND_AR[h.kind] || "", text: txt(h.text, 200), post: txt(h.postText, 120), phones: (h.phones || []).slice(0, 2), profile: profOf(h), url: h.url || "", trust: h.tr.label, trustLevel: h.tr.level, at: h.at || 0, msg: slotMsg(s, h) })) })),
      job: { running: !!mineJob.running, finished: mineJob.finishedAt || 0 } };
  }
  // ===== أفعال =====
  if (op === "run") { const r = await chrome.runtime.sendMessage({ type: req.what === "mine" ? "mineRun" : "runAuto" }).catch((e) => ({ ok: false, error: String(e.message || e) })); return { ok: true, r }; }
  if (op === "stage" && req.key) { await setLeadMeta(req.key, { stage: String(req.stage || "contacted") }); return { ok: true }; }
  if (op === "slot") {
    const arr = slotsArr().map((s) => ({ ...s })); const i = arr.findIndex((s) => s.id === req.id), txt = String(req.text || "").slice(0, 500).trim();
    if (!txt) return { error: "اكتب النص" };
    if (i >= 0) { arr[i].text = txt; if (req.kind) arr[i].kind = req.kind === "want" ? "want" : "offer"; }
    else if (arr.length < SLOTS) arr.push({ id: newSlotId(), text: txt, kind: req.kind === "want" ? "want" : "offer", createdAt: Date.now() });
    await saveSlots(arr); return { ok: true };
  }
  if (op === "hideHit" && req.slot && req.key) {
    const { mineHits: H = {} } = await chrome.storage.local.get("mineHits"); const h = (H[req.slot] || []).find((x) => x.key === req.key);
    if (h) { h.hidden = true; await chrome.storage.local.set({ mineHits: H }); } return { ok: true };
  }
  return { error: "unknown op" };
};

// 🛡 حارس السكرول (10.57): لو الصفحة قصرت فجأة (قايمة فضيت لحظة وقت سحب/تحديث) المتصفح بيرمي السكرول لفوق وما بيرجعش لما القايمة ترجع.
// بنرجّعك لمكانك أول ما الصفحة تطول تاني — إلا لو انت اللي اتحركت (عجلة/لمس/كيبورد/ضغط) أو غيّرت الصفحة.
(() => {
  const DE = document.documentElement;
  let prevY = window.scrollY, lastIn = 0, down = false, pend = null, tm = 0;
  const hist = []; // أعلى مكان كنت فيه في آخر 4 ثواني (لو الصفحة قصرت على خطوتين، المرجع هو القمة مش الخطوة الأولى)
  const user = (extra) => () => { lastIn = Date.now() + (extra || 0); pend = null; };
  for (const [ev, extra] of [["wheel", 0], ["keydown", 0], ["click", 0], ["touchstart", 2500], ["touchmove", 2500], ["touchend", 2500]]) addEventListener(ev, user(extra), { passive: true, capture: true });
  addEventListener("pointerdown", () => { down = true; lastIn = Date.now(); pend = null; }, { passive: true, capture: true });
  for (const ev of ["pointerup", "pointercancel", "dragend"]) addEventListener(ev, () => { down = false; lastIn = Date.now(); }, { passive: true, capture: true });
  addEventListener("hashchange", () => { pend = null; lastIn = Date.now(); });
  window.__scrollGuard = () => ({ prevY, pend, lastIn, down, ago: Date.now() - lastIn });
  const stop = () => { clearInterval(tm); tm = 0; };
  const step = () => {
    if (!pend) return stop();
    if (state.view !== pend.view || Date.now() - pend.at > 10 * 6e4) { pend = null; prevY = window.scrollY; return stop(); }
    if (DE.scrollHeight - innerHeight >= pend.to - 2) { // الصفحة رجعت تطول
      window.scrollTo({ top: pend.to, behavior: "instant" });
      if (Math.abs(window.scrollY - pend.to) < 4) { prevY = window.scrollY; pend = null; stop(); }
    }
  };
  const check = () => {
    const y = window.scrollY, now = Date.now();
    // القمة بتتحسب من فترات الهدوء بس (من غير لمس/عجلة/سحب) — عشان لو انت اللي طلعت لفوق مارجّعكش لتحت
    if (down || now - lastIn <= 1200) hist.length = 0; else { hist.push([now, y]); while (hist.length > 1 && now - hist[0][0] > 4000) hist.shift(); }
    let peak = prevY; for (const h of hist) if (h[1] > peak) peak = h[1];
    if (!pend && peak - y > 300 && !down && now - lastIn > 1200) { pend = { to: peak, view: state.view, at: now }; clearInterval(tm); tm = setInterval(step, 300); setTimeout(step, 0); }
    if (!pend) prevY = y;
  };
  addEventListener("scroll", check, { passive: true });
  setInterval(check, 250); // لو أحداث السكرول اتأخرت (صفحة مش بتترسم) نلحق القفزة برضه
})();
