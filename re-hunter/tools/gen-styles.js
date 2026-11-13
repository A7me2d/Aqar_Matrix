// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
/* مولّد «الستايلات» (10.80.52) — بيطلّع styles52.css + styles52-data.js
   تشغيل:  node tools/gen-styles.js
   كل ستايل = ألوان (فاتح + غامق) + شكل الأيقونات + شكل الزراير والكروت والشريط الجانبي والخلفية والخطوط. */
const fs = require("fs"), path = require("path");
const OUT = path.resolve(__dirname, "..");

/* ---------------- أدوات الألوان ---------------- */
const hx = (h) => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const toHex = (a) => "#" + a.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v * (1 - t) + B[i] * t)); };
const rgba = (c, al) => { const [r, g, b] = hx(c); return `rgba(${r},${g},${b},${al})`; };
const lum = (c) => { const [r, g, b] = hx(c).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const cr = (a, b) => { const la = lum(a), lb = lum(b); const hi = Math.max(la, lb), lo = Math.min(la, lb); return (hi + 0.05) / (lo + 0.05); };
const fit = (c, bg, min, dark) => { let x = c, i = 0; while (cr(x, bg) < min && i < 16) { x = mix(x, dark ? "#FFFFFF" : "#000000", 0.08); i++; } return x; };
const ink = (c) => (lum(c) > 0.34 ? "#07101A" : "#FFFFFF");

/* ---------------- الستايلات الـ20 ---------------- */
const MONO = '"Cascadia Mono",Consolas,"SF Mono","Liberation Mono",ui-monospace,monospace';
const CAIRO = 'Cairo,Arial,"Liberation Sans",Helvetica,sans-serif';
const TAJ = '"SgBody",Cairo,Arial,"Liberation Sans",Helvetica,sans-serif';
const LAL = '"SgDisp",Cairo,Arial,"Liberation Sans",Helvetica,sans-serif';
const HEX = "polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%)";
const GRAD_TXT = (a, b) => `.hero h2,.sg-hello h1{background:linear-gradient(100deg,${a},${b})!important;-webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important;color:transparent!important}`;
const STARS = "radial-gradient(1.6px 1.6px at 20px 30px,rgba(255,255,255,.95),transparent),radial-gradient(1px 1px at 110px 70px,rgba(255,255,255,.8),transparent),radial-gradient(1.3px 1.3px at 190px 140px,rgba(190,200,255,.9),transparent),radial-gradient(1px 1px at 60px 170px,rgba(255,255,255,.7),transparent),radial-gradient(1.6px 1.6px at 150px 20px,rgba(255,210,255,.8),transparent),radial-gradient(1px 1px at 230px 90px,rgba(255,255,255,.75),transparent)";
const CARBON = "linear-gradient(27deg,#151515 5px,transparent 5px) 0 5px,linear-gradient(207deg,#151515 5px,transparent 5px) 10px 0,linear-gradient(27deg,#222 5px,transparent 5px) 0 10px,linear-gradient(207deg,#222 5px,transparent 5px) 10px 5px,linear-gradient(90deg,#1b1b1b 10px,transparent 10px),linear-gradient(#1d1d1d 25%,#1a1a1a 25%,#1a1a1a 50%,transparent 50%,transparent 75%,#242424 75%,#242424)";
const HOLO = "linear-gradient(120deg,#FF9AD5,#9AD0FF 33%,#B5FFCF 66%,#FFE29A)";

const STYLES = [
  /* 1 */ {
    id: "neon", ar: "نيون سيبر", en: "Neon Cyber", desc: "أسود أزرق بإضاءة سيان ووردي نيون وخطوط مضيئة", tags: ["داكن", "إضاءة"],
    r: [22, 16, 12, 8], br: 10, bw: 1, tile: "glow", tp: "26%", nav: "glow", nr: 14, side: "float", kpi: "glow", plate: "tint", pbtn: "glow", bgp: "grid",
    ic: { sw: 1.6, cap: "round", join: "round", fill: "14%", glow: "0 0 5px currentColor" }, f: { disp: CAIRO, body: TAJ, num: MONO },
    D: { bg: "#080A1C", sf: "#11142E", tx: "#E9F0FF", mu: "#9AA6D0", a: "#00E5FF", b: "#FF2BD6", c: "#8B5CFF", w: "#FFD23F", g: "#2DFF9A", r: "#FF3D6E", ln: "rgba(0,229,255,.24)", ln2: "rgba(0,229,255,.46)", hl: "rgba(0,229,255,.12)",
      sh: ["0 0 0 1px rgba(0,229,255,.05),0 0 26px -12px rgba(0,229,255,.6)", "0 0 0 1px rgba(0,229,255,.14),0 0 38px -8px rgba(255,43,214,.5)", "0 0 70px -14px rgba(0,229,255,.55),0 0 0 1px rgba(0,229,255,.32)"],
      body: "radial-gradient(900px 520px at 90% -10%,rgba(255,43,214,.20),transparent 70%),radial-gradient(800px 520px at 0% 0%,rgba(0,229,255,.16),transparent 72%)" },
    L: { bg: "#EDF0FF", sf: "#FFFFFF", tx: "#0B1030", mu: "#4B5584", a: "#0073F5", b: "#CF00AE", c: "#6A3DFF", w: "#D98A00", g: "#00A862", r: "#E0204F", ln: "rgba(0,115,245,.24)", ln2: "rgba(0,115,245,.46)", hl: "rgba(255,255,255,.9)",
      sh: ["0 1px 1px rgba(0,60,200,.05),0 14px 30px -18px rgba(0,100,255,.4)", "0 2px 3px rgba(0,60,200,.06),0 26px 50px -22px rgba(0,100,255,.5)", "0 30px 70px -26px rgba(0,100,255,.5),0 6px 18px -10px rgba(207,0,174,.3)"],
      body: "radial-gradient(900px 520px at 90% -10%,rgba(207,0,174,.12),transparent 70%),radial-gradient(800px 520px at 0% 0%,rgba(0,115,245,.14),transparent 72%)" },
    extra: ".hero h2,.sg-hello h1{text-shadow:0 0 22px color-mix(in srgb,var(--a2) 45%,transparent)}.card:hover,.kpi:hover{border-color:var(--a2)!important}",
  },
  /* 2 */ {
    id: "matrix", ar: "ماتريكس", en: "Matrix", desc: "شاشة تيرمنال: أخضر فسفوري على أسود وخطوط مسح وحواف حادة", tags: ["داكن", "حاد"],
    r: [6, 4, 3, 2], br: 2, bw: 1, tile: "outline", tp: "10%", nav: "bar", nr: 3, side: "rail", kpi: "side", plate: "bar", pbtn: "outline", bgp: "scan",
    ic: { sw: 1.4, cap: "square", join: "miter", fill: "0%", glowD: "0 0 4px currentColor" }, f: { disp: CAIRO, body: TAJ, num: MONO },
    D: { bg: "#030A05", sf: "#08140B", tx: "#CFFFD9", mu: "#7DB890", a: "#00F55E", b: "#00D1B2", c: "#A3FF12", w: "#E6FF4D", g: "#00F55E", r: "#FF5A5A", ln: "rgba(0,245,94,.24)", ln2: "rgba(0,245,94,.5)", hl: "rgba(0,245,94,.06)",
      sh: ["0 0 0 1px rgba(0,245,94,.04)", "0 0 18px -8px rgba(0,245,94,.45)", "0 0 50px -14px rgba(0,245,94,.5),0 0 0 1px rgba(0,245,94,.3)"], body: "radial-gradient(900px 500px at 50% -10%,rgba(0,245,94,.10),transparent 70%)" },
    L: { bg: "#EEF5EF", sf: "#FBFFFB", tx: "#062410", mu: "#3E6B4C", a: "#008F3C", b: "#00796B", c: "#5A8F00", w: "#8A7A00", g: "#008F3C", r: "#C62828", ln: "rgba(0,100,40,.30)", ln2: "rgba(0,100,40,.55)", hl: "transparent",
      sh: ["none", "0 8px 20px -14px rgba(0,100,40,.4)", "0 24px 50px -22px rgba(0,100,40,.4)"], sd: { bg: "#06190C", tx: "#D2FFDD", mu: "#7DB890" } },
    side_dark: true,
    extra: ".hero h2::after{content:'_';margin-inline-start:4px;color:var(--a2);animation:sxblink 1.1s steps(1) infinite}@keyframes sxblink{50%{opacity:0}}@media (prefers-reduced-motion:reduce){.hero h2::after{animation:none}}",
  },
  /* 3 */ {
    id: "aurora", ar: "أورورا زجاجي", en: "Aurora Glass", desc: "زجاج شفاف فوق سحب بنفسجي وفيروزي ووردي", tags: ["داكن", "زجاجي"],
    r: [32, 26, 18, 12], br: 999, fr: 16, bw: 1, tile: "glass", tp: "36%", nav: "pill", nr: 20, side: "float", kpi: "top", plate: "tint", pbtn: "glow", bgp: "none", blur: 14,
    ic: { sw: 1.7, cap: "round", join: "round", fill: "26%" }, f: { disp: CAIRO, body: TAJ, num: CAIRO },
    D: { bg: "#0A0E24", sf: "#161C3E", tx: "#ECEEFF", mu: "#A9B1DA", a: "#8E7CFF", b: "#35E6D2", c: "#FF7ADB", w: "#FFC56E", g: "#4BE8A8", r: "#FF6C8F", ln: "rgba(255,255,255,.15)", ln2: "rgba(255,255,255,.28)", hl: "rgba(255,255,255,.13)", glassA: 0.5, panelA: 0.5,
      sh: ["0 10px 30px -16px rgba(0,0,0,.6)", "0 24px 50px -22px rgba(0,0,0,.7)", "0 40px 90px -30px rgba(0,0,0,.8)"],
      body: "radial-gradient(700px 500px at 85% -5%,rgba(142,124,255,.42),transparent 70%),radial-gradient(700px 520px at 5% 10%,rgba(53,230,210,.28),transparent 70%),radial-gradient(800px 600px at 60% 110%,rgba(255,122,219,.24),transparent 70%)" },
    L: { bg: "#EDF0FF", sf: "#FFFFFF", tx: "#151A44", mu: "#565F94", a: "#6C5CE7", b: "#00A99A", c: "#D043B0", w: "#D98200", g: "#0DA877", r: "#E5365F", ln: "rgba(255,255,255,.9)", ln2: "rgba(108,92,231,.3)", hl: "rgba(255,255,255,.95)", glassA: 0.62, panelA: 0.66,
      sh: ["0 12px 34px -16px rgba(80,70,200,.35)", "0 24px 50px -20px rgba(80,70,200,.45)", "0 40px 90px -30px rgba(80,70,200,.5)"],
      body: "radial-gradient(700px 500px at 85% -5%,rgba(142,124,255,.32),transparent 70%),radial-gradient(700px 520px at 5% 10%,rgba(53,230,210,.26),transparent 70%),radial-gradient(800px 600px at 60% 110%,rgba(255,122,219,.24),transparent 70%)" },
    extra: GRAD_TXT("var(--a2)", "var(--a3)"),
  },
  /* 4 */ {
    id: "brutal", ar: "بروتال", en: "Neo Brutal", desc: "حدود سميكة سودا وظلال صلبة وألوان فاقعة", tags: ["فاتح", "جريء"],
    r: [10, 8, 6, 4], br: 6, bw: 2, tile: "solid", tp: "16%", nav: "solid", nr: 8, side: "rail", kpi: "side", plate: "solid", pbtn: "hard", bgp: "dots", tfg: "#0D0D0D", nofit: true,
    ic: { sw: 2.4, cap: "square", join: "miter", fill: "0%" }, f: { disp: LAL, body: TAJ, num: LAL },
    L: { bg: "#F4F4EF", sf: "#FFFFFF", tx: "#0D0D0D", mu: "#454545", a: "#5B86FF", b: "#FFD60A", c: "#FF5C98", w: "#FF9F1C", g: "#00C77D", r: "#FF4538", ln: "#0D0D0D", ln2: "#0D0D0D", hl: "transparent", hard: "#0D0D0D",
      sh: ["4px 4px 0 #0D0D0D", "6px 6px 0 #0D0D0D", "8px 8px 0 #0D0D0D"] },
    D: { bg: "#131313", sf: "#1F1F1F", tx: "#F5F5F5", mu: "#B8B8B8", a: "#6C8CFF", b: "#FFD60A", c: "#FF6FA6", w: "#FFA94D", g: "#2EE6A0", r: "#FF6B5E", ln: "rgba(240,240,240,.92)", ln2: "#F0F0F0", hl: "transparent", hard: "#F0F0F0",
      sh: ["4px 4px 0 rgba(240,240,240,.92)", "6px 6px 0 rgba(240,240,240,.92)", "8px 8px 0 rgba(240,240,240,.92)"] },
    extra: ".hero h2{text-decoration:underline;text-decoration-color:var(--sg-yellow);text-decoration-thickness:.16em;text-underline-offset:.1em;text-decoration-skip-ink:none}",
  },
  /* 5 */ {
    id: "synth", ar: "سينث ويف", en: "Synthwave", desc: "غروب الثمانينات: وردي وسيان وبنفسجي بشبكة مضيئة", tags: ["داكن", "إضاءة"],
    r: [26, 20, 14, 10], br: 999, fr: 14, bw: 1, tile: "grad", tp: "30%", nav: "glow", nr: 16, side: "float", kpi: "glow", plate: "tint", pbtn: "glow", bgp: "floor",
    ic: { sw: 1.8, cap: "round", join: "round", fill: "22%", glowD: "0 0 5px currentColor" }, f: { disp: CAIRO, body: TAJ, num: CAIRO },
    D: { bg: "#120A2A", sf: "#1C1040", tx: "#F6EBFF", mu: "#BBA3E0", a: "#FF3CAC", b: "#00E1FF", c: "#B14BFF", w: "#FFB347", g: "#35FFB0", r: "#FF4D6D", ln: "rgba(255,60,172,.3)", ln2: "rgba(255,60,172,.55)", hl: "rgba(255,255,255,.08)",
      sh: ["0 0 26px -12px rgba(255,60,172,.55)", "0 0 40px -10px rgba(0,225,255,.45)", "0 0 80px -16px rgba(255,60,172,.6)"],
      body: "linear-gradient(180deg,transparent 55%,rgba(255,60,172,.18) 100%),radial-gradient(900px 500px at 50% -10%,rgba(177,75,255,.38),transparent 70%)" },
    L: { bg: "#FFEFFA", sf: "#FFFFFF", tx: "#2A0F45", mu: "#7A4C9E", a: "#D9157F", b: "#0086B3", c: "#8A2BE2", w: "#D97A00", g: "#00A878", r: "#E0214F", ln: "rgba(217,21,127,.26)", ln2: "rgba(217,21,127,.5)", hl: "rgba(255,255,255,.9)",
      sh: ["0 14px 30px -18px rgba(217,21,127,.4)", "0 26px 50px -22px rgba(138,43,226,.45)", "0 36px 80px -26px rgba(138,43,226,.5)"], body: "linear-gradient(180deg,rgba(255,227,246,.0),rgba(232,224,255,.9))" },
    extra: GRAD_TXT("var(--a2)", "var(--a3)"),
  },
  /* 6 */ {
    id: "gold", ar: "ذهب ليلي", en: "Midnight Gold", desc: "أسود فاخر وخطوط ذهبية رفيعة وحواف أنيقة", tags: ["داكن", "فخم"],
    r: [14, 10, 6, 4], br: 4, bw: 1, tile: "outline", tp: "50%", nav: "bar", nr: 8, side: "float", kpi: "top", plate: "bar", pbtn: "solid", bgp: "dots", tbw: "1px",
    ic: { sw: 1.25, cap: "round", join: "round", fill: "0%" }, f: { disp: CAIRO, body: TAJ, num: CAIRO },
    D: { bg: "#0B0A08", sf: "#15130F", tx: "#F2E9D6", mu: "#A99E86", a: "#D6B24A", b: "#F0D98A", c: "#B08A2E", w: "#E0A93B", g: "#86C79A", r: "#E07A6B", ln: "rgba(214,178,74,.26)", ln2: "rgba(214,178,74,.5)", hl: "rgba(255,235,170,.06)",
      sh: ["0 1px 1px rgba(0,0,0,.5),0 16px 34px -20px rgba(0,0,0,.8)", "0 2px 3px rgba(0,0,0,.5),0 28px 54px -24px rgba(0,0,0,.9)", "0 34px 80px -28px rgba(0,0,0,.95),0 0 0 1px rgba(214,178,74,.22)"],
      body: "radial-gradient(900px 500px at 50% -15%,rgba(214,178,74,.12),transparent 70%)" },
    L: { bg: "#F6F3EA", sf: "#FFFFFF", tx: "#1A1507", mu: "#6B5F42", a: "#8A6608", b: "#B8902A", c: "#6E560F", w: "#B8741A", g: "#2F7D4F", r: "#B5412F", ln: "rgba(138,102,8,.3)", ln2: "rgba(138,102,8,.55)", hl: "rgba(255,255,255,.9)",
      sh: ["0 1px 1px rgba(60,40,0,.04),0 14px 30px -20px rgba(60,40,0,.25)", "0 2px 3px rgba(60,40,0,.05),0 26px 50px -24px rgba(60,40,0,.32)", "0 30px 70px -28px rgba(60,40,0,.42)"], sd: { bg: "#15120C", tx: "#F2E9D6", mu: "#A99E86" } },
    side_dark: true,
    extra: ".hero h2{display:inline-block;padding-bottom:8px;border-bottom:1px solid var(--a2)}",
  },
  /* 7 */ {
    id: "ocean", ar: "محيط عميق", en: "Deep Ocean", desc: "أزرق بحري وفيروزي بتدرّجات موج هادية", tags: ["داكن", "هادي"],
    r: [26, 20, 14, 10], br: 14, bw: 1, tile: "soft", tp: "34%", nav: "tint", nr: 16, side: "float", kpi: "top", plate: "tint", pbtn: "grad", bgp: "waves",
    ic: { sw: 1.8, cap: "round", join: "round", fill: "30%" }, f: { disp: CAIRO, body: TAJ, num: CAIRO },
    D: { bg: "#041420", sf: "#0A2538", tx: "#E3F7FF", mu: "#8EB8CC", a: "#22D3EE", b: "#14B8A6", c: "#3B82F6", w: "#FBBF24", g: "#2DD4A0", r: "#FB7185", ln: "rgba(120,210,255,.17)", ln2: "rgba(120,210,255,.34)", hl: "rgba(160,230,255,.08)",
      body: "radial-gradient(900px 600px at 80% 110%,rgba(34,211,238,.2),transparent 70%),radial-gradient(800px 500px at 0% 0%,rgba(59,130,246,.22),transparent 70%)" },
    L: { bg: "#E5F5FA", sf: "#FFFFFF", tx: "#062638", mu: "#3F6B80", a: "#0284C7", b: "#0D9488", c: "#2563EB", w: "#D97706", g: "#059669", r: "#E11D48", ln: "rgba(2,100,150,.18)", ln2: "rgba(2,100,150,.34)", hl: "rgba(255,255,255,.9)",
      sh: ["0 1px 1px rgba(2,60,100,.04),0 14px 30px -20px rgba(2,100,150,.32)", "0 2px 3px rgba(2,60,100,.05),0 26px 50px -24px rgba(2,100,150,.4)", "0 30px 70px -28px rgba(2,100,150,.45)"],
      body: "radial-gradient(900px 600px at 80% 110%,rgba(2,132,199,.14),transparent 70%),radial-gradient(800px 500px at 0% 0%,rgba(13,148,136,.14),transparent 70%)" },
  },
  /* 8 */ {
    id: "sunset", ar: "غروب", en: "Sunset", desc: "تدرّجات مرجاني وبرتقالي وبنفسجي بزراير كبسولة", tags: ["فاتح", "دافي"],
    r: [30, 24, 16, 12], br: 999, fr: 16, bw: 1, tile: "grad", tp: "38%", nav: "solid", nr: 18, side: "float", kpi: "side", plate: "tint", pbtn: "glow", bgp: "none",
    ic: { sw: 2, cap: "round", join: "round", fill: "0%" }, f: { disp: CAIRO, body: TAJ, num: CAIRO },
    L: { bg: "#FFF3F1", sf: "#FFFFFF", tx: "#2A0E2E", mu: "#7A4A66", a: "#EE3F58", b: "#FF8A3D", c: "#8E3FE8", w: "#E07418", g: "#0F9D67", r: "#D92B4B", ln: "rgba(150,40,80,.14)", ln2: "rgba(150,40,80,.3)", hl: "rgba(255,255,255,.9)",
      sh: ["0 1px 1px rgba(120,20,60,.04),0 14px 30px -18px rgba(238,63,88,.35)", "0 2px 3px rgba(120,20,60,.05),0 26px 50px -22px rgba(238,63,88,.42)", "0 30px 70px -26px rgba(142,63,232,.45)"],
      body: "radial-gradient(900px 560px at 90% -10%,rgba(255,138,61,.26),transparent 70%),radial-gradient(800px 520px at 0% 0%,rgba(142,63,232,.16),transparent 72%)" },
    D: { bg: "#180A1C", sf: "#26112B", tx: "#FFEFF0", mu: "#C99BB0", a: "#FF5C70", b: "#FF9A4D", c: "#B56BFF", w: "#FFB04D", g: "#3DDCA0", r: "#FF5C70", ln: "rgba(255,160,200,.16)", ln2: "rgba(255,160,200,.32)", hl: "rgba(255,200,220,.08)",
      body: "radial-gradient(900px 560px at 90% -10%,rgba(255,138,61,.24),transparent 70%),radial-gradient(800px 520px at 0% 0%,rgba(181,107,255,.22),transparent 72%)" },
    extra: GRAD_TXT("var(--a2)", "var(--sx-g2)"),
  },
  /* 9 */ {
    id: "mint", ar: "نعناع", en: "Mint Fresh", desc: "أخضر نعناع هادي ونضيف بحواف دايرية وظلال خفيفة", tags: ["فاتح", "هادي"],
    r: [24, 18, 12, 8], br: 12, bw: 1, tile: "soft", tp: "50%", nav: "pill", nr: 14, side: "float", kpi: "none", plate: "tint", pbtn: "solid", bgp: "dots",
    ic: { sw: 1.9, cap: "round", join: "round", fill: "18%" }, f: { disp: CAIRO, body: TAJ, num: CAIRO },
    L: { bg: "#EFF9F5", sf: "#FFFFFF", tx: "#0E2B24", mu: "#4A7567", a: "#0B9A68", b: "#1FB98E", c: "#0B96DC", w: "#D97706", g: "#0B9A68", r: "#E5484D", ln: "rgba(14,100,80,.14)", ln2: "rgba(14,100,80,.3)", hl: "rgba(255,255,255,.9)",
      sh: ["0 1px 1px rgba(14,100,80,.04),0 10px 24px -18px rgba(14,100,80,.3)", "0 2px 3px rgba(14,100,80,.05),0 22px 44px -22px rgba(14,100,80,.36)", "0 30px 70px -28px rgba(14,100,80,.42)"] },
    D: { bg: "#09140F", sf: "#0F2119", tx: "#E2FAF0", mu: "#8DBBA8", a: "#34D399", b: "#6EE7B7", c: "#38BDF8", w: "#FBBF24", g: "#34D399", r: "#FB7185", ln: "rgba(110,231,183,.15)", ln2: "rgba(110,231,183,.3)", hl: "rgba(180,255,220,.07)" },
  },
  /* 10 */ {
    id: "steel", ar: "فولاذ", en: "Steel Pro", desc: "رمادي فولاذي احترافي وشريط جانبي غامق وخطوط حادة", tags: ["فاتح", "رسمي"],
    r: [14, 10, 8, 6], br: 8, bw: 1, tile: "soft", tp: "22%", nav: "tint", nr: 10, side: "float", kpi: "side", plate: "bar", pbtn: "solid", bgp: "none",
    ic: { sw: 1.7, cap: "round", join: "round", fill: "10%" }, f: { disp: CAIRO, body: TAJ, num: CAIRO },
    L: { bg: "#EDF0F4", sf: "#FFFFFF", tx: "#101828", mu: "#4B586B", a: "#2F5BEA", b: "#0788A6", c: "#6254E8", w: "#C96A00", g: "#168A3D", r: "#D42A2A", ln: "rgba(16,24,40,.12)", ln2: "rgba(16,24,40,.26)", hl: "rgba(255,255,255,.85)",
      sh: ["0 1px 2px rgba(16,24,40,.06)", "0 6px 16px -8px rgba(16,24,40,.22)", "0 24px 56px -22px rgba(16,24,40,.4)"], sd: { bg: "#0F172A", tx: "#E5EAF3", mu: "#93A0B8" } },
    D: { bg: "#0C111B", sf: "#141B29", tx: "#E6EBF5", mu: "#93A0B8", a: "#5B8CFF", b: "#22B8CF", c: "#8B7CFF", w: "#F59E0B", g: "#34D399", r: "#F87171", ln: "rgba(180,200,240,.13)", ln2: "rgba(180,200,240,.26)", hl: "rgba(255,255,255,.05)" },
    side_dark: true,
    extra: ".hero h2{border-inline-start:5px solid var(--a2);padding-inline-start:14px}",
  },
  /* 11 */ {
    id: "blueprint", ar: "مخطط هندسي", en: "Blueprint", desc: "ورقة مهندس: أزرق بخطوط بيضا وشبكة قياس وحواف حادة", tags: ["داكن", "هندسي"],
    r: [4, 3, 2, 2], br: 2, bw: 1, bs: "dashed", tile: "outline", tp: "6%", nav: "outline", nr: 3, side: "rail", kpi: "none", plate: "bar", pbtn: "outline", bgp: "cross",
    ic: { sw: 1.2, cap: "butt", join: "miter", fill: "0%" }, f: { disp: CAIRO, body: TAJ, num: MONO },
    D: { bg: "#082A63", sf: "#0C3677", tx: "#EAF3FF", mu: "#9CBDF0", a: "#FFD43B", b: "#7DD3FC", c: "#FFFFFF", w: "#FFD43B", g: "#6EE7B7", r: "#FF9A9A", ln: "rgba(190,225,255,.42)", ln2: "rgba(190,225,255,.7)", hl: "transparent",
      sh: ["none", "none", "0 24px 50px -22px rgba(0,0,0,.5)"] },
    L: { bg: "#F2F7FF", sf: "#FFFFFF", tx: "#0A2A66", mu: "#4A6AA5", a: "#1D4ED8", b: "#0E7490", c: "#B45309", w: "#B45309", g: "#047857", r: "#B91C1C", ln: "rgba(29,78,216,.42)", ln2: "rgba(29,78,216,.7)", hl: "transparent",
      sh: ["none", "none", "0 24px 50px -22px rgba(10,42,102,.35)"] },
    extra: ".hero h2{display:inline-block;border-bottom:1px dashed var(--ed-ln2);padding-bottom:6px}",
  },
  /* 12 */ {
    id: "amber", ar: "عنبري CRT", en: "Amber CRT", desc: "شاشة قديمة كهرمانية وخطوط مسح وأرقام تيرمنال", tags: ["داكن", "ريترو"],
    r: [8, 6, 4, 3], br: 3, bw: 1, tile: "outline", tp: "14%", nav: "solid", nr: 4, side: "rail", kpi: "side", plate: "bar", pbtn: "solid", bgp: "scan",
    ic: { sw: 1.5, cap: "square", join: "miter", fill: "0%", glowD: "0 0 4px currentColor" }, f: { disp: CAIRO, body: TAJ, num: MONO },
    D: { bg: "#110A03", sf: "#1B1106", tx: "#FFD9A3", mu: "#C09A63", a: "#FFB000", b: "#FF7A1A", c: "#FFD166", w: "#FFB000", g: "#8CE05C", r: "#FF5A3C", ln: "rgba(255,176,0,.26)", ln2: "rgba(255,176,0,.5)", hl: "rgba(255,176,0,.06)",
      sh: ["0 0 0 1px rgba(255,176,0,.04)", "0 0 20px -8px rgba(255,176,0,.4)", "0 0 56px -14px rgba(255,176,0,.45)"], body: "radial-gradient(1000px 600px at 50% 40%,rgba(255,150,0,.08),transparent 72%)" },
    L: { bg: "#F8F0E0", sf: "#FFFBF3", tx: "#2A1A04", mu: "#7A5A22", a: "#B25F00", b: "#C94F08", c: "#8A6200", w: "#B25F00", g: "#3F7D1E", r: "#C2381A", ln: "rgba(150,90,0,.3)", ln2: "rgba(150,90,0,.55)", hl: "transparent",
      sh: ["none", "0 8px 18px -12px rgba(120,70,0,.35)", "0 26px 56px -24px rgba(120,70,0,.4)"] },
    extra: ".hero h2::after{content:'▌';margin-inline-start:6px;font-size:.7em;color:var(--a2);animation:sxblink 1.1s steps(1) infinite}@keyframes sxblink{50%{opacity:0}}@media (prefers-reduced-motion:reduce){.hero h2::after{animation:none}}",
  },
  /* 13 */ {
    id: "holo", ar: "هولوجرام", en: "Hologram", desc: "سطوح لؤلؤية بحواف قزحية متغيّرة اللون", tags: ["فاتح", "لامع"],
    r: [28, 22, 16, 12], br: 999, fr: 16, bw: 1.5, tile: "holo", tp: "50%", nav: "pill", nr: 18, side: "float", kpi: "top", plate: "tint", pbtn: "holo", bgp: "none", blur: 8,
    ic: { sw: 1.7, cap: "round", join: "round", fill: "22%" }, f: { disp: CAIRO, body: TAJ, num: CAIRO },
    L: { bg: "#F5F3FF", sf: "#FFFFFF", tx: "#1E1A44", mu: "#5F5A94", a: "#7152F0", b: "#0FBBC6", c: "#E8409E", w: "#D98A00", g: "#0FA878", r: "#E5365F", ln: "rgba(113,82,240,.16)", ln2: "rgba(113,82,240,.32)", hl: "rgba(255,255,255,.95)", glassA: 0.7, panelA: 0.82,
      sh: ["0 12px 30px -16px rgba(113,82,240,.3)", "0 24px 50px -20px rgba(113,82,240,.4)", "0 40px 90px -30px rgba(113,82,240,.45)"],
      body: "radial-gradient(700px 480px at 90% -5%,rgba(255,154,213,.38),transparent 70%),radial-gradient(700px 500px at 5% 5%,rgba(154,208,255,.42),transparent 70%),radial-gradient(800px 500px at 60% 105%,rgba(181,255,207,.38),transparent 70%)" },
    D: { bg: "#0E0D1E", sf: "#17152E", tx: "#F1EEFF", mu: "#ADA7DD", a: "#9B85FF", b: "#3DDCE6", c: "#FF7AC0", w: "#FBBF24", g: "#34D399", r: "#FB7185", ln: "rgba(200,190,255,.18)", ln2: "rgba(200,190,255,.34)", hl: "rgba(255,255,255,.1)", glassA: 0.6, panelA: 0.7,
      body: "radial-gradient(700px 480px at 90% -5%,rgba(255,122,192,.22),transparent 70%),radial-gradient(700px 500px at 5% 5%,rgba(61,220,230,.2),transparent 70%),radial-gradient(800px 500px at 60% 105%,rgba(155,133,255,.24),transparent 70%)" },
    extra: GRAD_TXT("var(--a2)", "var(--sx-c)"),
  },
  /* 14 */ {
    id: "carbon", ar: "كربون", en: "Carbon", desc: "ألياف كربون سودا بلمسة أحمر سباق وأيقونات سداسية", tags: ["داكن", "سباق"],
    r: [12, 8, 6, 4], br: 6, bw: 1, tile: "solid", tp: "0%", tclip: HEX, nav: "bar", nr: 8, side: "rail", kpi: "side", plate: "bar", pbtn: "solid", bgp: "carbon", cut: true,
    ic: { sw: 2, cap: "butt", join: "miter", fill: "0%" }, f: { disp: CAIRO, body: TAJ, num: CAIRO },
    D: { bg: "#0D0E10", sf: "#16181B", tx: "#ECEFF3", mu: "#939CA8", a: "#FF4B2B", b: "#FFB224", c: "#9AA5B4", w: "#FFB224", g: "#2FD27A", r: "#FF4B2B", ln: "rgba(255,255,255,.12)", ln2: "rgba(255,255,255,.26)", hl: "rgba(255,255,255,.06)",
      sh: ["0 1px 1px rgba(0,0,0,.6),0 12px 26px -16px rgba(0,0,0,.9)", "0 2px 3px rgba(0,0,0,.6),0 24px 46px -22px rgba(0,0,0,.95)", "0 34px 80px -28px rgba(0,0,0,.95)"] },
    L: { bg: "#E8EAED", sf: "#FFFFFF", tx: "#121417", mu: "#565E69", a: "#D9361A", b: "#C07400", c: "#4B5563", w: "#C07400", g: "#15803D", r: "#D9361A", ln: "rgba(18,20,23,.14)", ln2: "rgba(18,20,23,.3)", hl: "rgba(255,255,255,.85)",
      sh: ["0 1px 2px rgba(18,20,23,.08)", "0 8px 20px -10px rgba(18,20,23,.28)", "0 26px 56px -22px rgba(18,20,23,.42)"], sd: { bg: "#111316", tx: "#ECEFF3", mu: "#939CA8" } },
    side_dark: true,
    extra: ".hero h2::before{content:'';display:inline-block;width:10px;height:.78em;margin-inline-end:12px;background:var(--a2);transform:skewX(-18deg)}",
  },
  /* 15 */ {
    id: "lava", ar: "لافا", en: "Lava", desc: "أسود وأحمر ناري وبرتقالي بتوهّج حراري", tags: ["داكن", "ناري"],
    r: [24, 18, 12, 8], br: 12, bw: 1, tile: "grad", tp: "30%", nav: "glow", nr: 14, side: "float", kpi: "glow", plate: "tint", pbtn: "glow", bgp: "diag",
    ic: { sw: 2, cap: "round", join: "round", fill: "0%" }, f: { disp: CAIRO, body: TAJ, num: CAIRO },
    D: { bg: "#13060A", sf: "#20090F", tx: "#FFEDE6", mu: "#CC978B", a: "#FF4D1F", b: "#FFB020", c: "#FF2E6E", w: "#FFB020", g: "#4ADE80", r: "#FF3B5C", ln: "rgba(255,100,60,.24)", ln2: "rgba(255,100,60,.46)", hl: "rgba(255,160,120,.08)",
      sh: ["0 0 0 1px rgba(255,77,31,.05),0 14px 32px -18px rgba(255,77,31,.5)", "0 0 0 1px rgba(255,77,31,.1),0 26px 50px -20px rgba(255,46,110,.5)", "0 34px 80px -26px rgba(255,77,31,.6)"],
      body: "radial-gradient(1000px 500px at 50% 120%,rgba(255,77,31,.32),transparent 70%),radial-gradient(700px 420px at 100% 0,rgba(255,46,110,.16),transparent 70%)" },
    L: { bg: "#FFF0EA", sf: "#FFFFFF", tx: "#2A0B05", mu: "#7C4A3E", a: "#E0360C", b: "#CC7A00", c: "#D1174F", w: "#CC7A00", g: "#168A4A", r: "#D1174F", ln: "rgba(200,60,20,.17)", ln2: "rgba(200,60,20,.34)", hl: "rgba(255,255,255,.9)",
      sh: ["0 1px 1px rgba(160,40,10,.05),0 14px 30px -18px rgba(224,54,12,.38)", "0 2px 3px rgba(160,40,10,.06),0 26px 50px -22px rgba(224,54,12,.45)", "0 32px 76px -26px rgba(209,23,79,.5)"],
      body: "radial-gradient(1000px 500px at 50% 120%,rgba(224,54,12,.16),transparent 70%),radial-gradient(700px 420px at 100% 0,rgba(209,23,79,.10),transparent 70%)" },
    extra: GRAD_TXT("var(--a2)", "var(--sx-g2)"),
  },
  /* 16 */ {
    id: "tonal", ar: "توني", en: "Tonal", desc: "ألوان مسطّحة دافية من غير حدود، شرائح كبسولة وزوايا كبيرة", tags: ["فاتح", "ناعم"],
    r: [32, 28, 20, 14], br: 999, fr: 14, bw: 0, tile: "tonal", tp: "50%", nav: "pill", nr: 28, side: "float", kpi: "none", plate: "none", pbtn: "solid", bgp: "none",
    ic: { sw: 1.9, cap: "round", join: "round", fill: "0%" }, f: { disp: CAIRO, body: TAJ, num: CAIRO },
    L: { bg: "#FEF7FF", sf: "#F3EDF7", tx: "#1D1B20", mu: "#4A4458", a: "#6750A4", b: "#625B71", c: "#7D5260", w: "#8D5000", g: "#1B6D2F", r: "#B3261E", ln: "rgba(29,27,32,.07)", ln2: "rgba(29,27,32,.16)", hl: "transparent", panel: "#F3EDF7", field: "#E8E0EE",
      sh: ["0 1px 2px rgba(29,27,32,.08)", "0 4px 10px -2px rgba(29,27,32,.14)", "0 16px 40px -12px rgba(29,27,32,.3)"] },
    D: { bg: "#141218", sf: "#211F26", tx: "#E6E0E9", mu: "#CAC4D0", a: "#D0BCFF", b: "#CCC2DC", c: "#EFB8C8", w: "#FFB870", g: "#7FD991", r: "#F2B8B5", ln: "rgba(230,224,233,.08)", ln2: "rgba(230,224,233,.18)", hl: "transparent", panel: "#211F26", field: "#2B2930" },
  },
  /* 17 */ {
    id: "neumo", ar: "ناعم بارز", en: "Soft Emboss", desc: "عناصر بارزة وغاطسة بظلّين ناعمين من غير حدود", tags: ["فاتح", "ناعم"],
    r: [30, 24, 18, 12], br: 16, fr: 14, bw: 0, tile: "neu", tp: "50%", nav: "neu", nr: 18, side: "float", kpi: "none", plate: "tint", pbtn: "neu", bgp: "none",
    ic: { sw: 1.8, cap: "round", join: "round", fill: "16%" }, f: { disp: CAIRO, body: TAJ, num: CAIRO },
    L: { bg: "#E4E9F1", sf: "#E4E9F1", tx: "#2A3347", mu: "#5C6780", a: "#4560E8", b: "#0FA597", c: "#7C4DE8", w: "#C47A00", g: "#0E9A6A", r: "#D83A50", ln: "transparent", ln2: "rgba(42,51,71,.14)", hl: "transparent", panel: "#E4E9F1", field: "#DDE3EC",
      neuOut: "-7px -7px 16px rgba(255,255,255,.9),7px 7px 16px rgba(160,174,198,.6)", neuOutS: "-4px -4px 9px rgba(255,255,255,.9),4px 4px 9px rgba(160,174,198,.6)", neuIn: "inset 4px 4px 8px rgba(160,174,198,.65),inset -4px -4px 8px rgba(255,255,255,.92)",
      sh: ["-7px -7px 16px rgba(255,255,255,.9),7px 7px 16px rgba(160,174,198,.6)", "-9px -9px 20px rgba(255,255,255,.95),9px 9px 20px rgba(160,174,198,.7)", "-10px -10px 24px rgba(255,255,255,.9),14px 14px 34px rgba(140,156,186,.65)"] },
    D: { bg: "#1C2030", sf: "#1C2030", tx: "#E4E9F7", mu: "#96A0BE", a: "#7C93FF", b: "#2DD4BF", c: "#A78BFA", w: "#FBBF24", g: "#34D399", r: "#FB7185", ln: "transparent", ln2: "rgba(228,233,247,.16)", hl: "transparent", panel: "#1C2030", field: "#171B29",
      neuOut: "-6px -6px 14px rgba(255,255,255,.04),7px 7px 16px rgba(0,0,0,.55)", neuOutS: "-3px -3px 8px rgba(255,255,255,.04),4px 4px 9px rgba(0,0,0,.55)", neuIn: "inset 4px 4px 8px rgba(0,0,0,.55),inset -3px -3px 7px rgba(255,255,255,.04)",
      sh: ["-6px -6px 14px rgba(255,255,255,.04),7px 7px 16px rgba(0,0,0,.55)", "-8px -8px 18px rgba(255,255,255,.05),10px 10px 22px rgba(0,0,0,.65)", "-8px -8px 20px rgba(255,255,255,.04),16px 16px 40px rgba(0,0,0,.7)"] },
    extra: ".hero h2,.sg-hello h1{text-shadow:1px 1px 1px rgba(255,255,255,.85),-1px -1px 1px rgba(0,0,0,.06)}",
  },
  /* 18 */ {
    id: "aqua", ar: "أكوا لامع", en: "Aqua Gloss", desc: "زراير وأيقونات لامعة بلمعة زجاج وتدرّجات أزرق سماوي", tags: ["فاتح", "لامع"],
    r: [20, 16, 12, 8], br: 999, fr: 10, bw: 1, tile: "gloss", tp: "50%", nav: "solid", nr: 16, side: "float", kpi: "top", plate: "tint", pbtn: "gloss", bgp: "lines",
    ic: { sw: 1.9, cap: "round", join: "round", fill: "30%" }, f: { disp: CAIRO, body: TAJ, num: CAIRO },
    L: { bg: "#E6F0FB", sf: "#FFFFFF", tx: "#0A2342", mu: "#4C6485", a: "#0A74F0", b: "#2DB9F5", c: "#5B5BE6", w: "#D98200", g: "#12A55C", r: "#E23D30", ln: "rgba(10,60,140,.18)", ln2: "rgba(10,60,140,.34)", hl: "rgba(255,255,255,.95)",
      sh: ["0 1px 2px rgba(10,60,140,.08),0 10px 22px -14px rgba(10,100,240,.35)", "0 2px 4px rgba(10,60,140,.1),0 22px 44px -22px rgba(10,100,240,.45)", "0 30px 70px -26px rgba(10,100,240,.5)"],
      body: "linear-gradient(180deg,#F4F9FF 0,rgba(221,235,250,.0) 70%)" },
    D: { bg: "#08111F", sf: "#112038", tx: "#E8F1FF", mu: "#92A9CC", a: "#3B9BFF", b: "#5CD6FF", c: "#7C7CFF", w: "#FBBF24", g: "#3DD68C", r: "#FF6B5E", ln: "rgba(120,180,255,.2)", ln2: "rgba(120,180,255,.38)", hl: "rgba(255,255,255,.14)" },
    extra: ".hero h2,.sg-hello h1{text-shadow:0 1px 0 rgba(255,255,255,.9),0 2px 6px rgba(10,100,240,.25)}",
  },
  /* 19 */ {
    id: "ink", ar: "حبر", en: "Ink Mono", desc: "أبيض وأسود صافي بخطوط رفيعة وأيقونات هيكلية من غير ألوان", tags: ["فاتح", "مينيمال"],
    r: [6, 4, 3, 2], br: 2, bw: 1, tile: "outline", tp: "50%", nav: "bar", nr: 4, side: "rail", kpi: "none", plate: "bar", pbtn: "solid", bgp: "none", tbw: "1px", mono: true,
    ic: { sw: 1.2, cap: "butt", join: "miter", fill: "0%" }, f: { disp: CAIRO, body: TAJ, num: CAIRO },
    L: { bg: "#FAFAFA", sf: "#FFFFFF", tx: "#0A0A0A", mu: "#5E5E5E", a: "#0A0A0A", b: "#3D3D3D", c: "#6E6E6E", w: "#8A5A00", g: "#15803D", r: "#B91C1C", ln: "rgba(0,0,0,.14)", ln2: "rgba(0,0,0,.42)", hl: "transparent",
      sh: ["none", "0 8px 22px -14px rgba(0,0,0,.25)", "0 26px 60px -24px rgba(0,0,0,.4)"], sd: { bg: "#0A0A0A", tx: "#F4F4F4", mu: "#A0A0A0" } },
    D: { bg: "#0A0A0A", sf: "#131313", tx: "#F4F4F4", mu: "#A0A0A0", a: "#F4F4F4", b: "#CFCFCF", c: "#9A9A9A", w: "#E5B94A", g: "#4ADE80", r: "#F87171", ln: "rgba(255,255,255,.16)", ln2: "rgba(255,255,255,.42)", hl: "transparent",
      sh: ["none", "0 8px 22px -14px rgba(0,0,0,.8)", "0 26px 60px -24px rgba(0,0,0,.9)"] },
    side_dark: true,
    extra: ".hero h2{display:inline-block;border-bottom:3px solid var(--text);padding-bottom:4px}",
  },
  /* 20 */ {
    id: "cosmos", ar: "كون", en: "Cosmos", desc: "فضاء عميق بنجوم وسدم نيلي وبنفسجي وأيقونات دايرية مضيئة", tags: ["داكن", "إضاءة"],
    r: [28, 22, 16, 12], br: 999, fr: 14, bw: 1, tile: "glow", tp: "50%", nav: "glow", nr: 18, side: "float", kpi: "glow", plate: "tint", pbtn: "glow", bgp: "stars", blur: 10,
    ic: { sw: 1.6, cap: "round", join: "round", fill: "16%", glowD: "0 0 5px currentColor" }, f: { disp: CAIRO, body: TAJ, num: CAIRO },
    D: { bg: "#050618", sf: "#0E1030", tx: "#E8EAFF", mu: "#A0A6D8", a: "#7C8CFF", b: "#B388FF", c: "#4DD0E1", w: "#FFD166", g: "#5CF2B0", r: "#FF6B9A", ln: "rgba(160,170,255,.2)", ln2: "rgba(160,170,255,.4)", hl: "rgba(255,255,255,.08)", glassA: 0.62, panelA: 0.7,
      sh: ["0 12px 30px -16px rgba(0,0,0,.8)", "0 0 40px -12px rgba(124,140,255,.4)", "0 0 80px -16px rgba(179,136,255,.5)"],
      body: "radial-gradient(900px 600px at 80% -10%,rgba(124,140,255,.26),transparent 70%),radial-gradient(800px 560px at 5% 100%,rgba(179,136,255,.2),transparent 70%)" },
    L: { bg: "#EEF0FF", sf: "#FFFFFF", tx: "#12154A", mu: "#565DA0", a: "#4F46E5", b: "#9333EA", c: "#0891B2", w: "#D97706", g: "#0D9F6E", r: "#E11D48", ln: "rgba(79,70,229,.17)", ln2: "rgba(79,70,229,.34)", hl: "rgba(255,255,255,.95)", glassA: 0.7, panelA: 0.8,
      sh: ["0 12px 30px -16px rgba(79,70,229,.3)", "0 24px 50px -20px rgba(79,70,229,.4)", "0 40px 90px -30px rgba(79,70,229,.45)"],
      body: "radial-gradient(900px 600px at 80% -10%,rgba(79,70,229,.16),transparent 70%),radial-gradient(800px 560px at 5% 100%,rgba(147,51,234,.14),transparent 70%)" },
    extra: GRAD_TXT("var(--a2)", "var(--a3)"),
  },
];

/* ---------------- حساب التوكنز ---------------- */
function tokens(s, P, mode) {
  const dark = mode === "dark", t = {};
  const { bg, sf, tx, mu, a, b, c, w, g, r } = P;
  const H = (c) => (s.nofit ? c : fit(c, sf, dark ? 4 : 3.2, dark));
  const field = P.field || (dark ? mix(sf, "#000000", 0.28) : mix(sf, "#FFFFFF", 0.55));
  const s2 = mix(sf, bg, 0.5), brd = mix(bg, tx, dark ? 0.2 : 0.18), onA = ink(a), onG = ink(g), onB = ink(b);
  Object.assign(t, {
    "--bg": bg, "--surface": sf, "--surface-2": s2, "--border": brd, "--text": tx, "--muted": mu, "--hi": P.hi || tx, "--field": field, "--sub": s2,
    "--a1": b, "--a2": a, "--a3": mix(a, c, 0.5), "--acc-lt": a, "--ring-bg": mix(bg, tx, 0.1), "--glass": rgba(bg, 0.92), "--glow": "0%", "--shell": mix(a, "#000000", 0.82),
    "--on": onA, "--req": a, "--req-bg": mix(a, sf, 0.88), "--off": g, "--off-bg": mix(g, sf, 0.88), "--hot": r, "--hot-bg": mix(r, sf, 0.88), "--violet": c,
    "--brand": a, "--brand-t": a, "--brand-soft": mix(a, sf, 0.88), "--gold-soft": mix(w, sf, 0.84), "--gold": w, "--chip": mix(a, sf, 0.88), "--chip-t": dark ? mix(a, tx, 0.3) : mix(a, "#000000", 0.25),
    "--cat-bg": mix(sf, bg, 0.3), "--cat": tx, "--info": s2, "--info-t": mu, "--ai": mix(c, sf, 0.88), "--ai-t": dark ? c : mix(c, "#000000", 0.2), "--shadow": "none",
    "--sg-line": mix(bg, tx, 0.32), "--sg-dim": tx, "--lg-a": a, "--lg-b": `linear-gradient(135deg,${mix(b, "#FFFFFF", 0.3)},${b} 60%,${a})`, "--lg-sa": a, "--lg-sb": `linear-gradient(135deg,${mix(b, "#FFFFFF", 0.3)},${b} 60%,${a})`,
    "--sg-navy": P.navy || (dark ? mix(bg, a, 0.14) : mix(a, "#000000", 0.78)), "--tb-a": mix(a, "#000000", 0.15), "--tb-b": a,
    "--sg-blue": a, "--sg-blue-d": mix(a, "#000000", 0.3), "--sg-yellow": b, "--sg-yellow-ink": onB, "--sg-green": g, "--sg-green-d": mix(g, "#000000", 0.3), "--sg-red": r, "--sg-orange": w, "--sg-slate": mu, "--sg-green-m": mix(g, "#000000", 0.5),
    /* هوية الصرح: ألوان الأقسام */
    "--ed-blue": H(a), "--ed-indigo": H(mix(a, c, 0.5)), "--ed-teal": H(b), "--ed-cyan": H(mix(b, a, 0.3)), "--ed-purple": H(c), "--ed-pink": H(mix(c, r, 0.4)), "--ed-amber": H(w), "--ed-gold": H(mix(w, b, 0.3)), "--ed-orange": H(mix(w, r, 0.4)), "--ed-green": H(g), "--ed-red": H(r), "--ed-slate": mu,
    /* أسطح الصرح */
    "--ed-ln": P.ln, "--ed-ln2": P.ln2 || P.ln, "--ed-hl": P.hl || "transparent",
    "--ed-glass": rgba(sf, P.glassA == null ? 0.78 : P.glassA), "--ed-panel": P.panel || (P.panelA != null ? rgba(sf, P.panelA) : mix(sf, bg, dark ? 0.1 : 0.06)), "--ed-field": field,
    "--sx-on": onA, "--sx-on-g": onG, "--sx-on-h": onA, "--sx-g2": b, "--sx-c": c, "--sx-hard": P.hard || tx,
  });
  if (s.mono) Object.assign(t, { "--ed-green": mix(mu, tx, 0.2), "--ed-amber": mix(mu, tx, 0.1), "--ed-orange": mix(mu, tx, 0.3), "--ed-pink": mix(mu, tx, 0.4), "--ed-gold": mix(mu, tx, 0.15), "--ed-teal": mix(mu, tx, 0.25), "--ed-cyan": mix(mu, tx, 0.35), "--ed-purple": mix(mu, tx, 0.45), "--ed-indigo": mix(mu, tx, 0.5), "--ed-blue": tx });
  if (P.sh) Object.assign(t, { "--ed-sh": P.sh[0], "--ed-sh-hi": P.sh[1], "--ed-sh-float": P.sh[2] });
  if (P.neuIn) Object.assign(t, { "--sx-neu-out": P.neuOut, "--sx-neu-outs": P.neuOutS, "--sx-neu-in": P.neuIn });
  if (P.body) t["--sx-body"] = P.body;
  return t;
}
const decl = (o) => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(";");

/* ---------------- مولّد الـCSS ---------------- */
const ROOT = 'html[data-look="edifice"][data-pal="sign"][data-skin="studio"]';
const BODY = "body.ui38.ui42.ui56.ui58.ui58.ui58";
const list = (fn) => STYLES.filter(fn).map((s) => `[data-style="${s.id}"]`);
const W = (l, css, media) => { if (!l.length) return ""; const r = `${ROOT}:is(${l.join(",")}) ${BODY}{${css}}`; return media ? `@media ${media}{${r}}\n` : r + "\n"; };
const ALL = list(() => true);
let css = `/* مولَّد بـ tools/gen-styles.js — ما تعدّلش يدويًا. 20 ستايل (10.80.52) */\n`;

/* 1) ألوان كل ستايل (فاتح/غامق) — بتتعطّل لو اخترت «ألواني» (data-scol=mine) */
for (const s of STYLES) {
  for (const mode of ["light", "dark"]) {
    const P = s[mode === "light" ? "L" : "D"]; if (!P) continue;
    css += `html[data-skin="studio"][data-pal="sign"][data-look="edifice"][data-style="${s.id}"][data-mode="${mode}"]:not([data-scol="mine"]){${decl(tokens(s, P, mode))}}\n`;
    const on = ink(P.a), onG = ink(P.g);
    if (on !== "#FFFFFF" || onG !== "#FFFFFF") {
      css += `${ROOT}[data-style="${s.id}"][data-mode="${mode}"]:not([data-scol="mine"]) ${BODY}{`;
      if (on !== "#FFFFFF") css += `:is(.btn.primary,.btn.pri,.tb-tools .btn.savebtn,.spr-btn.pri,.as-btn.p,.btn.primary.big,.cls-all.on,.pk-tab.on,.pk-segs.sm .pk-seg.on,.rm-stop.on .wa-sn,.rm-stop.on .wa-sn *){color:${on}!important}:is(.btn.primary,.btn.pri,.savebtn,.spr-btn.pri,.as-btn.p,.btn.primary.big) .i54{--hue:${on}!important}.sg-k,.sg-tile em,.topbar .nav button[data-view].on .pill{color:${on}!important}`;
      if (onG !== "#FFFFFF") css += `:is(.btn.wa,.btn.green,.rm-bot.on){color:${onG}!important}:is(.btn.wa,.btn.green) .i54{--hue:${onG}!important}`;
      css += `}\n`;
    }
  }
}

/* 2) متغيرات الشكل لكل ستايل */
for (const s of STYLES) {
  const v = {
    "--ed-r-xl": s.r[0] + "px", "--ed-r-lg": s.r[1] + "px", "--ed-r-md": s.r[2] + "px", "--ed-r-sm": s.r[3] + "px", "--sgb-r": s.br >= 999 ? "999px" : s.br + "px", "--r2": s.r[2] + "px", "--r3": s.r[1] + "px",
    "--sx-br": s.br >= 999 ? "999px" : s.br + "px", "--sx-fr": (s.fr != null ? s.fr : s.r[2]) + "px", "--sx-bw": (s.bw || 0) + "px", "--sx-bs": s.bs || "solid", "--sx-tp": s.tp, "--sx-nr": s.nr + "px", "--sx-tbw": s.tbw || "1.5px",
    "--ic-sw": s.ic.sw, "--ic-cap": s.ic.cap, "--ic-join": s.ic.join, "--ic-fill": s.ic.fill, "--f-disp": s.f.disp, "--f-body": s.f.body, "--sx-num": s.f.num,
  };
  if (s.tclip) v["--sx-tclip"] = s.tclip;
  if (s.tfg) v["--sx-tfg"] = s.tfg;
  if (s.ic.glow) v["--ic-glow"] = `drop-shadow(${s.ic.glow})`;
  if (s.blur) v["--sx-blur"] = s.blur + "px";
  css += `html[data-look="edifice"][data-pal="sign"][data-skin="studio"][data-style="${s.id}"]{${decl(v)}}\n`;
  if (s.ic.glowD) css += `html[data-look="edifice"][data-pal="sign"][data-skin="studio"][data-style="${s.id}"][data-mode="dark"]{--ic-glow:drop-shadow(${s.ic.glowD})}\n`;
  if (s.side === "rail") css += `@media (min-width:760px){html[data-look="edifice"][data-pal="sign"][data-skin="studio"][data-style="${s.id}"]{--ed-gap:0px}}\n`;
}

/* 3) الأساس العام (بيقرا من المتغيرات) */
const CARDS = ".panel,.crm-box,.crm-card,.slot,.ss-card,.hit,.mine-bar,.md-composer,.empty,.card,.pair,.sg-box,.kpi,.cls-sign,.cls-tile,.lvl-box,.rm-bots,.rm-phone,.sg-tile,.mcard,.thm-pop,.welcome";
const FIELDS = "input:not([type=checkbox],[type=radio],[type=range],[type=file],[type=color]),select,textarea";
css += W(ALL, `
  .btn,.tb-btn,.areapill,.autopill,.catchip,.btn.sm{border-radius:var(--sx-br)!important;border-width:var(--sx-bw)!important;border-style:var(--sx-bs)!important}
  :is(${FIELDS}){border-radius:var(--sx-fr)!important;border-width:var(--sx-bw)!important}
  :is(${CARDS}){border-width:var(--sx-bw)!important;border-style:var(--sx-bs)!important}
  .tabs{border-width:var(--sx-bw)!important}
  :is(.hs b,.kpi b,.kpi .n,.kpi strong,.sg-p,.ct-n b,.pair-score b,.gm-score,.score,.ring>b){font-family:var(--sx-num)!important}
  background-image:var(--sx-body,radial-gradient(1000px 560px at 88% -12%,color-mix(in srgb,var(--a2) 15%,transparent),transparent 70%),radial-gradient(820px 520px at 4% 2%,color-mix(in srgb,var(--a1) 11%,transparent),transparent 72%))!important;
  .card,.panel,.kpi,.sg-tile,.cls-sign,.sg-box{-webkit-backdrop-filter:blur(var(--sx-blur,0px));backdrop-filter:blur(var(--sx-blur,0px))}
  .topbar .nav,.thm-pop{-webkit-backdrop-filter:blur(max(22px,var(--sx-blur,0px))) saturate(1.5)!important;backdrop-filter:blur(max(22px,var(--sx-blur,0px))) saturate(1.5)!important}
`);
/* الأيقونة جوه الأزرار الصلبة: لون الخط حسب ألوان الستايل */

/* 4) الأشكال: خلفية الصفحة */
const BGP = {
  grid: "background-image:linear-gradient(color-mix(in srgb,var(--a2) 15%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--a2) 15%,transparent) 1px,transparent 1px)!important;background-size:48px 48px!important;-webkit-mask-image:linear-gradient(180deg,#000,rgba(0,0,0,.3) 50%,transparent 85%)!important;mask-image:linear-gradient(180deg,#000,rgba(0,0,0,.3) 50%,transparent 85%)!important",
  scan: "background-image:repeating-linear-gradient(0deg,color-mix(in srgb,var(--a2) 9%,transparent) 0 1px,transparent 1px 3px)!important;background-size:auto!important;-webkit-mask-image:none!important;mask-image:none!important",
  dots: "background-image:radial-gradient(color-mix(in srgb,var(--text) 22%,transparent) 1.2px,transparent 1.7px)!important;background-size:22px 22px!important;-webkit-mask-image:linear-gradient(180deg,#000,rgba(0,0,0,.4) 55%,transparent 90%)!important;mask-image:linear-gradient(180deg,#000,rgba(0,0,0,.4) 55%,transparent 90%)!important",
  lines: "background-image:repeating-linear-gradient(180deg,color-mix(in srgb,var(--text) 5%,transparent) 0 1px,transparent 1px 6px)!important;background-size:auto!important;-webkit-mask-image:linear-gradient(180deg,#000,transparent 80%)!important;mask-image:linear-gradient(180deg,#000,transparent 80%)!important",
  diag: "background-image:repeating-linear-gradient(135deg,color-mix(in srgb,var(--a2) 8%,transparent) 0 2px,transparent 2px 16px)!important;background-size:auto!important;-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,.5),#000 80%)!important;mask-image:linear-gradient(180deg,rgba(0,0,0,.5),#000 80%)!important",
  cross: "background-image:linear-gradient(color-mix(in srgb,var(--text) 22%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--text) 22%,transparent) 1px,transparent 1px),linear-gradient(color-mix(in srgb,var(--text) 9%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--text) 9%,transparent) 1px,transparent 1px)!important;background-size:96px 96px,96px 96px,16px 16px,16px 16px!important;-webkit-mask-image:none!important;mask-image:none!important",
  stars: `background-image:${STARS}!important;background-size:260px 200px!important;-webkit-mask-image:none!important;mask-image:none!important;opacity:.9`,
  carbon: `background:${CARBON}!important;background-color:#101010!important;background-size:20px 20px!important;opacity:.55;-webkit-mask-image:linear-gradient(180deg,#000,transparent 85%)!important;mask-image:linear-gradient(180deg,#000,transparent 85%)!important`,
  floor: "background-image:linear-gradient(color-mix(in srgb,var(--a2) 32%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--a2) 32%,transparent) 1px,transparent 1px)!important;background-size:56px 56px!important;-webkit-mask-image:linear-gradient(0deg,#000,rgba(0,0,0,.25) 38%,transparent 62%)!important;mask-image:linear-gradient(0deg,#000,rgba(0,0,0,.25) 38%,transparent 62%)!important",
  waves: "background-image:radial-gradient(ellipse 120% 50px at 50% 100%,color-mix(in srgb,var(--a2) 14%,transparent),transparent 70%),radial-gradient(ellipse 140% 70px at 20% 96%,color-mix(in srgb,var(--a1) 12%,transparent),transparent 70%)!important;background-size:auto!important;-webkit-mask-image:none!important;mask-image:none!important",
  none: "background-image:none!important",
};
for (const k of Object.keys(BGP)) css += W(list((s) => s.bgp === k), `&::before{${BGP[k]}}`);

/* 5) الأيقونات: شكل «الشريحة» */
function tileCss(kind, H, nav) {
  /* H = اسم متغيّر اللون (--hue للشريط الجانبي، --ed-hue للبلاطات) */
  const h = `var(${H})`;
  const K = {
    soft: ["", ""],
    solid: [`background:linear-gradient(150deg,color-mix(in srgb,${h} 80%,#fff),${h})!important;color:var(--sx-tfg,#fff)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.4)!important`, `box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 8px 16px -8px ${h}!important`],
    grad: [`background:linear-gradient(135deg,${h},color-mix(in srgb,${h} 42%,var(--sx-g2)))!important;color:#fff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 8px 16px -9px ${h}!important`, `box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 10px 20px -8px ${h}!important`],
    outline: [`background:transparent!important;color:${h}!important;box-shadow:inset 0 0 0 var(--sx-tbw) color-mix(in srgb,${h} 80%,transparent)!important`, `background:color-mix(in srgb,${h} 16%,transparent)!important;box-shadow:inset 0 0 0 var(--sx-tbw) ${h}!important`],
    glow: [`background:color-mix(in srgb,${h} 14%,var(--bg))!important;color:${h}!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,${h} 60%,transparent),0 0 14px -3px color-mix(in srgb,${h} 55%,transparent)!important`, `background:color-mix(in srgb,${h} 24%,var(--bg))!important;box-shadow:inset 0 0 0 1px ${h},0 0 22px -2px color-mix(in srgb,${h} 75%,transparent)!important`],
    flat: [`background:none!important;color:${h}!important;box-shadow:none!important`, `background:none!important;box-shadow:none!important`],
    glass: [`background:color-mix(in srgb,${h} 16%,transparent)!important;color:${h}!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,#fff 40%,transparent),inset 0 1px 0 var(--ed-hl)!important;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)`, `background:color-mix(in srgb,${h} 32%,transparent)!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,#fff 55%,transparent),0 8px 18px -8px ${h}!important`],
    tonal: [`background:color-mix(in srgb,${h} 24%,var(--surface))!important;color:color-mix(in srgb,${h} 80%,var(--text))!important;box-shadow:none!important`, `background:${h}!important;color:var(--sx-on-h)!important;box-shadow:none!important`],
    neu: [`background:var(--surface)!important;color:${h}!important;box-shadow:var(--sx-neu-in)!important`, `background:var(--surface)!important;color:${h}!important;box-shadow:var(--sx-neu-outs)!important`],
    holo: [`background:linear-gradient(var(--surface),var(--surface)) padding-box,${HOLO} border-box!important;border:1.5px solid transparent!important;color:${h}!important;box-shadow:none!important`, `box-shadow:0 8px 18px -8px ${h}!important`],
    gloss: [`background:linear-gradient(180deg,rgba(255,255,255,.62) 0,rgba(255,255,255,0) 52%),linear-gradient(180deg,color-mix(in srgb,${h} 72%,#fff),${h})!important;color:#fff!important;box-shadow:inset 0 -2px 3px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.7),0 6px 12px -6px ${h}!important`, `box-shadow:inset 0 -2px 3px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.8),0 10px 18px -6px ${h}!important`],
  };
  return K[kind] || ["", ""];
}
const TILE_KINDS = [...new Set(STYLES.map((s) => s.tile))];
for (const kind of TILE_KINDS) {
  const l = list((s) => s.tile === kind), [n0, n1] = tileCss(kind, "--hue"), [b0, b1] = tileCss(kind, "--ed-hue");
  const iconColor = ["solid", "grad", "gloss"].includes(kind) ? "inherit" : "inherit";
  const bigIcon = ["solid", "grad", "gloss"].includes(kind) ? "var(--sx-tfg,#fff)" : `var(--ed-hue)`;
  const shape = `border-radius:var(--sx-tp)!important;clip-path:var(--sx-tclip,none)`;
  css += W(l, `
    .topbar .nav button[data-view] i{${shape}${n0 ? ";" + n0 : ""}}
    .topbar .nav button[data-view].on i{${n1 || ""}}
    .topbar .nav button[data-view] i .i54,.topbar .nav button[data-view].on i .i54{color:inherit}
    .topbar .nav button[data-view].on i .i54 svg{fill:color-mix(in srgb,currentColor var(--ic-fill,20%),transparent)!important}
    .sg-tile .sg-ti,.rm-logo,.ct-ic{${shape};${kind === "soft" ? `background:linear-gradient(150deg,color-mix(in srgb,var(--ed-hue) 22%,var(--surface)),color-mix(in srgb,var(--ed-hue) 9%,var(--surface)))!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ed-hue) 30%,transparent)!important` : b0}}
    .sg-tile:hover .sg-ti{${b1}}
    .sg-tile .sg-ti .i54,.rm-logo .i54{--hue:${kind === "soft" ? "var(--ed-hue)" : bigIcon}!important;color:${kind === "soft" ? "var(--ed-hue)" : bigIcon}!important}
    .sg-tile .sg-ti .i54 svg,.rm-logo svg{stroke:currentColor!important;fill:color-mix(in srgb,currentColor 18%,transparent)!important}
    .rm-logo{--ed-hue:var(--lg)}
    .ct-ic{--ed-hue:var(--c)}
  `);
}

/* 6) بنود الشريط الجانبي */
const NAVK = {
  bar: `.topbar .nav button[data-view].on{background:color-mix(in srgb,var(--hue) 9%,transparent)!important;box-shadow:none!important}
        .topbar .nav button[data-view].on::before{display:block!important;content:"";position:absolute;inset-block:8px;inset-inline-start:0;width:3px;border-radius:3px;background:var(--hue)}`,
  solid: `.topbar .nav button[data-view].on{background:linear-gradient(135deg,var(--hue),color-mix(in srgb,var(--hue) 55%,var(--sx-g2)))!important;color:var(--sx-on-h)!important;box-shadow:0 10px 20px -12px var(--hue)!important}
        .topbar .nav button[data-view].on span{color:var(--sx-on-h)!important}
        .topbar .nav button[data-view].on i{background:rgba(255,255,255,.2)!important;box-shadow:none!important;color:var(--sx-on-h)!important}
        .topbar .nav button[data-view].on i .i54{color:var(--sx-on-h)!important}
        .topbar .nav button[data-view].on .pill{background:rgba(255,255,255,.26)!important;color:var(--sx-on-h)!important}`,
  glow: `.topbar .nav button[data-view].on{background:color-mix(in srgb,var(--hue) 10%,transparent)!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--hue) 55%,transparent),0 0 22px -6px color-mix(in srgb,var(--hue) 65%,transparent)!important}`,
  pill: `.topbar .nav button[data-view].on{background:color-mix(in srgb,var(--hue) 16%,var(--surface))!important;box-shadow:none!important}`,
  outline: `.topbar .nav button[data-view].on{background:transparent!important;box-shadow:inset 0 0 0 1.5px var(--hue)!important}`,
  neu: `.topbar .nav button[data-view]:hover{background:transparent!important}.topbar .nav button[data-view].on{background:var(--surface)!important;box-shadow:var(--sx-neu-in)!important}`,
};
for (const k of Object.keys(NAVK)) css += W(list((s) => s.nav === k), NAVK[k], "(min-width:760px)");
css += W(ALL, `.topbar .nav button[data-view]{border-radius:var(--sx-nr)!important}`, "(min-width:760px)");

/* 7) شكل الشريط الجانبي: مسطّح ملزوق + غامق */
css += W(list((s) => s.side === "rail"), `
  .topbar .nav{top:0!important;bottom:64px!important;border-radius:0!important;border-width:0!important;border-inline-end:var(--sx-bw) var(--sx-bs) var(--ed-ln2)!important;box-shadow:none!important}
  .as-fab{border-radius:0!important;height:64px!important;bottom:0!important;inset-inline-start:0!important;width:var(--ed-nw)!important;border-inline-end:var(--sx-bw) var(--sx-bs) var(--ed-ln2)!important}
  .side-brand{top:16px!important}
`, "(min-width:760px)");
{ const l = list((s) => s.side === "rail"); if (l.length) css += `@media (min-width:760px){html.sb-rail:not(.sb-peek)[data-look="edifice"][data-pal="sign"][data-skin="studio"]:is(${l.join(",")}) ${BODY} .as-fab{border-radius:14px!important;height:52px!important;bottom:6px!important;inset-inline-start:calc((var(--ed-nw) - 52px)/2)!important;width:52px!important;border-width:var(--sx-bw)!important}}\n`; }
for (const s of STYLES.filter((x) => x.side_dark && x.L && x.L.sd)) {
  const sd = s.L.sd;
  const dk = tokens(s, s.D || s.L, "dark"), hues = Object.entries(dk).filter(([k]) => /^--ed-(blue|indigo|teal|cyan|purple|pink|amber|gold|orange|green|red|slate)$/.test(k)).map(([k, v]) => `${k}:${v}`).join(";");
  css += `@media (min-width:760px){${ROOT}[data-style="${s.id}"][data-mode="light"]:not([data-scol="mine"]) ${BODY}{.topbar .nav,.side-brand{${hues};--text:${sd.tx};--hi:${sd.tx};--muted:${sd.mu};--surface:${mix(sd.bg, sd.tx, 0.08)};--ed-ln:${rgba(sd.tx, 0.14)};--ed-ln2:${rgba(sd.tx, 0.26)};--ed-hl:${rgba(sd.tx, 0.06)}}
    .topbar .nav{background:${sd.bg}!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}\n    .topbar .nav button[data-view].on .pill{color:${ink(dk['--ed-blue'])}!important}.topbar .nav button[data-view].on{--sx-on-h:${ink(dk['--ed-blue'])}}}}\n`;
}

/* 8) مربعات الأرقام */
css += W(list((s) => s.kpi === "side"), `.kpi::before{inset-inline:auto!important;inset-inline-start:0!important;top:0!important;bottom:0!important;width:5px!important;height:auto!important;border-radius:0!important;background:var(--ed-hue)!important}.kpi{padding-inline-start:24px!important}`);
css += W(list((s) => s.kpi === "none"), `.kpi::before{display:none!important}`);
css += W(list((s) => s.kpi === "glow"), `.kpi,.kpi:first-child,.rm-kpis .kpi{border-color:color-mix(in srgb,var(--ed-hue) 52%,transparent)!important;box-shadow:inset 0 1px 0 var(--ed-hl),0 0 24px -8px color-mix(in srgb,var(--ed-hue) 55%,transparent)!important}.kpi::before{height:2px!important;box-shadow:0 0 12px var(--ed-hue)}`);

/* 9) ترويسة كارت الإعلان */
css += W(list((s) => s.plate === "solid"), `
  .sg-plate,.sg-plate.t-offer,.sg-plate.t-request{background:var(--ed-hue)!important;border-bottom:var(--sx-bw) solid var(--ed-ln)!important}
  .sg-plate :is(.sg-p,.sg-a,.sg-c){color:var(--sx-tfg,#fff)!important}
  .sg-plate .sg-k{background:var(--surface)!important;color:var(--text)!important;box-shadow:none!important}
  .sg-plate .sg-c{background:rgba(255,255,255,.2)!important;border-color:rgba(255,255,255,.4)!important}
  .sg-plate .sg-a{background:rgba(0,0,0,.14)!important}`);
css += W(list((s) => s.plate === "bar"), `
  .sg-plate,.sg-plate.t-offer,.sg-plate.t-request{background:none!important;border-inline-start:4px solid var(--ed-hue)!important;padding-inline-start:16px!important}`);
css += W(list((s) => s.plate === "none"), `
  .sg-plate,.sg-plate.t-offer,.sg-plate.t-request{background:none!important;border-bottom:0!important}`);

/* 10) الزرار الأساسي */
const PB = ".btn.primary,.btn.pri,.tb-tools .btn.savebtn,.spr-btn.pri,.as-btn.p,.btn.primary.big";
const PBH = ".btn.primary:hover,.btn.pri:hover,.tb-tools .btn.savebtn:hover,.spr-btn.pri:hover,.as-btn.p:hover,.btn.primary.big:hover";
const PBA = ".btn.wa,.btn.green";
const PBK = {
  solid: `${PB}{background:var(--sg-blue)!important;border-color:var(--sg-blue)!important;box-shadow:none!important}${PBH}{background:color-mix(in srgb,var(--sg-blue) 88%,#000)!important}
    ${PBA}{background:var(--sg-green)!important;border-color:var(--sg-green)!important;box-shadow:none!important}`,
  outline: `${PB}{background:transparent!important;color:var(--sg-blue)!important;border-color:var(--sg-blue)!important;box-shadow:none!important}${PBH}{background:color-mix(in srgb,var(--sg-blue) 14%,transparent)!important}${PB} .i54{--hue:var(--sg-blue)!important}
    ${PBA}{background:transparent!important;color:var(--sg-green)!important;border-color:var(--sg-green)!important;box-shadow:none!important}${PBA} .i54{--hue:var(--sg-green)!important}`,
  glow: `${PB}{background:linear-gradient(135deg,var(--sg-blue),var(--sx-c))!important;border-color:transparent!important;box-shadow:0 0 22px -4px color-mix(in srgb,var(--sg-blue) 65%,transparent)!important}${PBH}{box-shadow:0 0 32px -2px color-mix(in srgb,var(--sg-blue) 80%,transparent)!important;background:linear-gradient(135deg,var(--sg-blue),var(--sx-c))!important}
    ${PBA}{box-shadow:0 0 20px -4px color-mix(in srgb,var(--sg-green) 60%,transparent)!important}`,
  hard: `${PB},${PBA}{border:var(--sx-bw) solid var(--sx-hard)!important;box-shadow:3px 3px 0 var(--sx-hard)!important;color:var(--sx-on)!important}${PB}{background:var(--sg-blue)!important}${PBA}{background:var(--sg-green)!important;color:var(--sx-on-g)!important}
    ${PB} .i54{--hue:var(--sx-on)!important}.btn:hover,.tb-btn:hover{transform:translate(-1px,-1px)!important;box-shadow:4px 4px 0 var(--sx-hard)!important}.btn:active,.tb-btn:active{transform:translate(2px,2px)!important;box-shadow:0 0 0 var(--sx-hard)!important}
    .btn:not(.primary,.pri,.wa,.green,.danger),.tb-btn{box-shadow:2px 2px 0 var(--sx-hard)!important}`,
  gloss: `${PB}{background:linear-gradient(180deg,rgba(255,255,255,.55) 0,rgba(255,255,255,0) 52%),linear-gradient(180deg,color-mix(in srgb,var(--sg-blue) 70%,#fff),var(--sg-blue))!important;border-color:color-mix(in srgb,var(--sg-blue) 70%,#000)!important;box-shadow:inset 0 -2px 4px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.7),0 8px 16px -8px var(--sg-blue)!important}
    ${PBH}{background:linear-gradient(180deg,rgba(255,255,255,.6) 0,rgba(255,255,255,0) 52%),linear-gradient(180deg,color-mix(in srgb,var(--sg-blue) 64%,#fff),var(--sg-blue))!important}
    ${PBA}{background:linear-gradient(180deg,rgba(255,255,255,.55) 0,rgba(255,255,255,0) 52%),linear-gradient(180deg,color-mix(in srgb,var(--sg-green) 70%,#fff),var(--sg-green))!important;box-shadow:inset 0 -2px 4px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.7)!important}`,
  neu: `.btn,.tb-btn,.catchip,.areapill,.autopill{background:var(--surface)!important;border-color:transparent!important;box-shadow:var(--sx-neu-outs)!important}.btn:active,.tb-btn:active{box-shadow:var(--sx-neu-in)!important;transform:none!important}
    ${PB}{color:var(--sg-blue)!important;background:var(--surface)!important;box-shadow:var(--sx-neu-outs)!important}${PB} .i54{--hue:var(--sg-blue)!important}${PBA}{color:var(--sg-green)!important;background:var(--surface)!important;box-shadow:var(--sx-neu-outs)!important}${PBA} .i54{--hue:var(--sg-green)!important}
    ${PBH}{background:var(--surface)!important}`,
  holo: `${PB}{background:linear-gradient(var(--sg-blue),var(--sg-blue)) padding-box,${HOLO} border-box!important;border:1.5px solid transparent!important;background-image:linear-gradient(135deg,var(--sg-blue),var(--sx-c)),${HOLO}!important;background-clip:padding-box,border-box!important;background-origin:border-box!important;box-shadow:0 10px 22px -10px var(--sg-blue)!important}`,
};
for (const k of Object.keys(PBK)) css += W(list((s) => s.pbtn === k), PBK[k]);

/* 11) زوايا مقصوصة */
css += W(list((s) => s.cut), `
  .btn,.tb-btn,.catchip,.areapill,.autopill,.kpi{border-radius:0!important;clip-path:polygon(0 0,calc(100% - 9px) 0,100% 9px,100% 100%,9px 100%,0 calc(100% - 9px))}
  .kpi{clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px))}`);

/* 12) هولوجرام: حواف قزحية للكروت */
css += W(list((s) => s.id === "holo"), `
  :is(.panel,.crm-box,.card,.pair,.sg-box,.kpi,.cls-sign,.sg-tile,.mcard,.rm-bots,.rm-phone,.welcome){background:linear-gradient(var(--ed-panel),var(--ed-panel)) padding-box,${HOLO} border-box!important;border:1.5px solid transparent!important}
  .kpi::before{background:${HOLO}!important}`);

/* 13) إضافات كل ستايل */
for (const s of STYLES) if (s.extra) css += W([`[data-style="${s.id}"]`], s.extra);

/* 14) واجهة اختيار الستايل */
css += `
/* ===== اختيار الستايل ===== */
html[data-pal="sign"][data-skin="studio"] body .sx-pop{position:absolute;inset-inline-end:0;top:calc(100% + 10px);z-index:90;width:min(560px,calc(100vw - 32px));max-height:min(74vh,640px);overflow:auto;padding:14px 14px 12px;border:1px solid var(--ed-ln2,var(--sg-line));border-radius:24px;background:color-mix(in srgb,var(--surface) 92%,transparent);-webkit-backdrop-filter:blur(22px) saturate(1.5);backdrop-filter:blur(22px) saturate(1.5);box-shadow:var(--ed-sh-float,0 30px 70px -28px rgba(0,0,0,.45))}
html[data-pal="sign"][data-skin="studio"] body .sx-pop[hidden]{display:none}
html[data-pal="sign"][data-skin="studio"] body .sx-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 10px}
html[data-pal="sign"][data-skin="studio"] body .sx-head h4{margin:0;font:800 17px/1.3 var(--f-disp);color:var(--hi)}
html[data-pal="sign"][data-skin="studio"] body .sx-head small{color:var(--muted);font-weight:600;font-size:13.5px}
html[data-pal="sign"][data-skin="studio"] body .sx-head .sx-acts{margin-inline-start:auto;display:flex;gap:6px;flex-wrap:wrap}
html[data-pal="sign"][data-skin="studio"] body .sx-acts button{min-height:32px;padding:0 12px;border:1px solid var(--ed-ln);border-radius:999px;background:var(--surface);color:var(--text);font:700 13.6px/1 var(--f-body);cursor:pointer}
html[data-pal="sign"][data-skin="studio"] body .sx-acts button:hover{border-color:var(--sg-blue);color:var(--hi)}
html[data-pal="sign"][data-skin="studio"] body .sx-acts button.on{background:color-mix(in srgb,var(--sg-blue) 14%,var(--surface));border-color:var(--sg-blue);color:var(--hi)}
html[data-pal="sign"][data-skin="studio"] body .sx-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
html[data-pal="sign"][data-skin="studio"] body .skin-panel .sx-grid{grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;max-width:1100px}
html[data-pal="sign"][data-skin="studio"] body .sx-card{position:relative;display:flex;flex-direction:column;gap:6px;padding:7px 7px 9px;text-align:start;border:2px solid var(--ed-ln);border-radius:16px;background:var(--surface);color:var(--text);cursor:pointer;font-family:var(--f-body);transition:transform .14s ease,border-color .14s ease,box-shadow .14s ease}
html[data-pal="sign"][data-skin="studio"] body .sx-card:hover{transform:translateY(-2px);border-color:var(--sg-blue)}
html[data-pal="sign"][data-skin="studio"] body .sx-card.on{border-color:var(--sg-blue);box-shadow:0 0 0 3px color-mix(in srgb,var(--sg-blue) 24%,transparent)}
html[data-pal="sign"][data-skin="studio"] body .sx-card.on::after{content:"✓";position:absolute;top:10px;inset-inline-end:10px;width:22px;height:22px;border-radius:50%;background:var(--sg-blue);color:var(--sx-on,#fff);font:800 13px/22px var(--f-body);text-align:center;z-index:3}
html[data-pal="sign"][data-skin="studio"] body .sx-card b{font:800 16.4px/1.25 var(--f-disp);color:var(--hi);padding-inline:3px}
html[data-pal="sign"][data-skin="studio"] body .sx-card small{font:500 13.2px/1.4 var(--f-body);color:var(--muted);padding-inline:3px}
html[data-pal="sign"][data-skin="studio"] body .sx-pop .sx-card small{display:none}
html[data-pal="sign"][data-skin="studio"] body .sx-card em{align-self:flex-start;font-style:normal;font:800 12px/18px var(--f-body);padding:0 8px;border-radius:99px;margin-inline:3px;background:color-mix(in srgb,var(--sg-blue) 14%,transparent);color:var(--hi)}
/* المعاينة المصغّرة */
.sx-pv{--pln:color-mix(in srgb,var(--ptx) var(--plnk,20%),transparent);position:relative;height:92px;border-radius:calc(var(--pr) + 4px);overflow:hidden;background:var(--pbg);border:var(--pbw) var(--pbs) var(--pln);direction:rtl}
html[data-mode="dark"] .sx-pv{--pbg:var(--dbg);--psf:var(--dsf);--pa:var(--da);--pb:var(--db);--pc:var(--dc);--ptx:var(--dtx);--pbgi:var(--dbgi);--psh:var(--dsh)}
html:not([data-mode="dark"]) .sx-pv{--pbg:var(--lbg);--psf:var(--lsf);--pa:var(--la);--pb:var(--lb);--pc:var(--lc);--ptx:var(--ltx);--pbgi:var(--lbgi);--psh:var(--lsh)}
.sx-pv{background:var(--pbgi,none),var(--pbg)}
.sx-pv .sx-sd{position:absolute;inset-block:5px;inset-inline-start:5px;width:20px;border-radius:calc(var(--pr) - 2px);background:var(--psf);border:1px solid var(--pln);display:flex;flex-direction:column;gap:4px;align-items:center;padding-top:6px}
.sx-pv.rail .sx-sd{inset-block:0;inset-inline-start:0;border-radius:0;border-width:0 0 0 1px;width:22px}
.sx-pv .sx-sd i{display:block;width:11px;height:11px;border-radius:var(--pt);background:var(--pa);clip-path:var(--pcl,none)}
.sx-pv .sx-sd i:nth-child(2){background:var(--pb)}.sx-pv .sx-sd i:nth-child(3){background:var(--pc)}
.sx-pv.tout .sx-sd i{background:transparent;box-shadow:inset 0 0 0 1.5px var(--pa)}
.sx-pv.tout .sx-sd i:nth-child(2){box-shadow:inset 0 0 0 1.5px var(--pb)}.sx-pv.tout .sx-sd i:nth-child(3){box-shadow:inset 0 0 0 1.5px var(--pc)}
.sx-pv.tglow .sx-sd i{box-shadow:0 0 7px var(--pa)}
.sx-pv .sx-cd{position:absolute;inset-block-start:7px;inset-inline-start:34px;inset-inline-end:7px;height:36px;border-radius:var(--pr);background:var(--psf);border:var(--pbw) var(--pbs) var(--pln);box-shadow:var(--psh,none)}
.sx-pv .sx-cd::before{content:"";position:absolute;inset-block-start:7px;inset-inline-start:8px;width:46%;height:5px;border-radius:3px;background:var(--ptx);opacity:.75}
.sx-pv .sx-cd::after{content:"";position:absolute;inset-block-start:17px;inset-inline-start:8px;width:30%;height:4px;border-radius:3px;background:var(--ptx);opacity:.3}
.sx-pv .sx-bt{position:absolute;inset-block-end:8px;inset-inline-start:34px;width:44px;height:16px;border-radius:var(--pbr);background:var(--pa);box-shadow:var(--pbs2,none)}
.sx-pv .sx-bt+.bt{inset-inline-start:84px;width:32px;background:transparent;box-shadow:inset 0 0 0 var(--pbw) var(--pb)}
.sx-pv .sx-kp{position:absolute;inset-block-end:8px;inset-inline-end:8px;width:44px;height:30px;border-radius:var(--pr);background:var(--psf);border:var(--pbw) var(--pbs) var(--pln);overflow:hidden}
.sx-pv .sx-kp::before{content:"";position:absolute;inset-inline:0;top:0;height:4px;background:var(--pb)}
.sx-sw{display:flex;gap:3px;padding-inline:3px;margin-top:-1px}.sx-sw i{flex:1;height:7px;border-radius:99px;background:var(--pa)}.sx-sw i:nth-child(2){background:var(--pb)}.sx-sw i:nth-child(3){background:var(--pc)}
html[data-mode="dark"] .sx-sw i{background:var(--da)}html[data-mode="dark"] .sx-sw i:nth-child(2){background:var(--db)}html[data-mode="dark"] .sx-sw i:nth-child(3){background:var(--dc)}
html:not([data-mode="dark"]) .sx-sw i{background:var(--la)}html:not([data-mode="dark"]) .sx-sw i:nth-child(2){background:var(--lb)}html:not([data-mode="dark"]) .sx-sw i:nth-child(3){background:var(--lc)}
`;

fs.writeFileSync(path.join(OUT, "styles52.css"), css);

/* ---------------- بيانات الواجهة ---------------- */
const data = STYLES.map((s) => {
  const L = s.L || s.D, D = s.D || s.L;
  const pv = (P) => [P.bg, P.sf, P.tx, P.a, P.b, P.c];
  const gl = (P) => (P.body ? `radial-gradient(70% 90% at 92% 0%,${rgba(P.a, 0.42)},transparent),radial-gradient(60% 80% at 0% 100%,${rgba(P.b, 0.32)},transparent)` : "none");
  return { id: s.id, ar: s.ar, en: s.en, desc: s.desc, tags: s.tags, L: pv(L), D: pv(D), br: s.br >= 999 ? 99 : s.br, r: s.r[1], bw: s.bw || 0, bs: s.bs || "solid", tp: s.tp, tile: s.tile, side: s.side, clip: s.tclip || "",
    sh: (s.L && s.L.sh ? s.L.sh[0] : "none"), shD: (s.D && s.D.sh ? s.D.sh[0] : "none"), bgi: { L: gl(L), D: gl(D) } };
});
fs.writeFileSync(path.join(OUT, "styles52-data.js"), "/* مولَّد بـ tools/gen-styles.js */\nwindow.SX=" + JSON.stringify({ list: data }) + ";\n");
console.log("styles52.css", (css.length / 1024).toFixed(1) + "KB", "·", STYLES.length, "ستايل");
