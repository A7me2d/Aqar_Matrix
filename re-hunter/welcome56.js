// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 👑 رسالة الترحيب بالمؤسس (Aqar Matrix 10.56) — «أهلاً وسهلاً بيك يا بوص علاء» + جملة نرجسية بتتبدّل
(() => {
  const HI = "أهلاً وسهلاً بيك يا بوص علاء";
  const LINES = [
    "السوق مش بيتحرك لوحده يا بوص… السوق بيستنّى إنت تدخل الأول.",
    "الصفقات كتير، بس مفيش غير علاء ماتريكس اللي بيشوف الصفقة قبل ما تتنشر.",
    "لو الشطارة كانت عقار، كان علاء ماتريكس بقى برج باسمه.",
    "كل السماسرة بيدوّروا على اللقطة… واللقطة بتدوّر على علاء.",
    "أنا مش بنافس حد، أنا بس بسبق نفسي والباقيين بيتفرجوا.",
    "الحاجة الوحيدة اللي أغلى من أحسن أرض في بني سويف: وقت علاء ماتريكس.",
    "فيه مؤسسين كتير في الدنيا، بس واحد بس فيهم عنده Aqar Matrix.",
    "النجاح بيعدّي على كل الناس… وعند علاء بيقعد يشرب شاي.",
    "العميل بيسأل: مين أحسن واحد في السوق؟ والسوق كله بيرد: علاء.",
    "الأرقام مش بتكدّب، وعلاء مش محتاج يكدّب أصلاً.",
    "لو علاء قال الصفقة هتتقفل… جهّز القلم.",
    "مش أي حد يقدر يبقى علاء ماتريكس — ربنا خلق واحد وكسر القالب.",
    "الشاشة دي اتصممت عشان تليق بيك، مش إنت اللي بتليق بيها.",
    "النهارده هيبقى يوم ربح تاني… ما إنت فيه.",
  ];
  const SIG = "Alaa Matrix — مؤسس Aqar Matrix";
  let last = -1;
  try { last = +localStorage.getItem("aqLine") || -1; } catch {}
  const pick = () => { let i; do { i = Math.floor(Math.random() * LINES.length); } while (i === last && LINES.length > 1); last = i; try { localStorage.setItem("aqLine", String(i)); } catch {} return LINES[i]; };
  globalThis.AQW = { HI, LINES, SIG, pick };
  const doc = document;
  function mount() {
    const box = doc.getElementById("welcome"); if (!box) return;
    const line = doc.getElementById("wLine"), hi = doc.getElementById("wHi"), sig = doc.getElementById("wSig");
    if (hi) hi.textContent = HI + " 👑"; if (sig) sig.textContent = SIG;
    const show = () => { if (line) line.textContent = pick(); box.hidden = false; clearTimeout(box._t); box._t = setTimeout(() => { box.hidden = true; }, 20000); try { sessionStorage.setItem("aqW", "1"); } catch {} };
    doc.getElementById("wClose")?.addEventListener("click", () => { box.hidden = true; clearTimeout(box._t); });
    line?.addEventListener("click", () => { line.textContent = pick(); clearTimeout(box._t); box._t = setTimeout(() => { box.hidden = true; }, 20000); });
    doc.querySelector(".side-brand")?.addEventListener("click", show);
    let seen = false; try { seen = sessionStorage.getItem("aqW") === "1"; } catch {}
    if (!seen && !/[?&]nowelcome\b/.test(location.search)) show();
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", mount); else mount();
})();
