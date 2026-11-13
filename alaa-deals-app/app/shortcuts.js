// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
"use strict";
// 🔧 إصلاح اختصارات ويندوز بتاعة البرنامج (شريط المهام / قايمة ابدأ / سطح المكتب)
// المشكلة: بعد تغيير الاسم من «Alaa Deals» لـ«Aqar Matrix» الاختصارات القديمة (خصوصاً اللي متثبّتة في الشريط)
// كانت بتفضل بتشاور على الـexe القديم المحذوف، وبما إن معرّف التطبيق (AppUserModelID) واحد، النافذة الجديدة
// بتتجمّع تحت الاختصار المكسور وويندوز بيرسم «ورقة بيضا» بدل الأيقونة.
// الإصلاح: أي اختصار بتاعنا (بالمعرّف أو باسم الـexe) هدفه مش موجود على الجهاز → نوجّهه للبرنامج الحالي بأيقونته.
// الملف ده منطق صافي (كل حاجة بتتحقن) عشان يتختبر على أي نظام من غير ويندوز.
const path = require("path");
const P = path.win32; // مسارات ويندوز دايماً
const MINE = /^(alaa deals|aqar matrix)\.exe$/i;

// بيرجّع سبب الكسر ("" = سليم)
function brokenReason(d, exists) {
  const tgt = String((d && d.target) || "");
  if (!tgt) return "no-target";
  if (!exists(tgt)) return "target-missing";
  const ic = String((d && d.icon) || "").replace(/,\s*-?\d+$/, "");
  if (ic && !exists(ic)) return "icon-missing";
  return "";
}

function isMine(d, aumid) {
  if (!d) return false;
  if (aumid && d.appUserModelId === aumid) return true;
  return MINE.test(P.basename(String(d.target || "")));
}

// بيلف على فولدر (وفولدراته الفرعية لحد عمق معيّن) ويرجّع كل ملفات .lnk
function collect(dir, depth, deps, out) {
  let ents;
  try { ents = deps.readdir(dir) || []; } catch { return out; }
  for (const e of ents) {
    const f = P.join(dir, e.name);
    if (e.isDir) { if (depth > 0) collect(f, depth - 1, deps, out); }
    else if (/\.lnk$/i.test(e.name)) out.push(f);
  }
  return out;
}

// deps: { dirs:[{dir,depth}], exe, aumid, readdir, read, write, exists, log? }
function repair(deps) {
  const res = { checked: 0, fixed: 0, files: [], errors: [] };
  const exe = String(deps.exe || "");
  if (!exe) { res.errors.push("no-exe"); return res; }
  const files = [];
  for (const d of deps.dirs || []) collect(d.dir, d.depth || 0, deps, files);
  for (const f of files) {
    let d;
    try { d = deps.read(f); } catch (e) { continue; }
    if (!isMine(d, deps.aumid)) continue;
    res.checked++;
    const why = brokenReason(d, deps.exists);
    if (!why) continue;
    try {
      const ok = deps.write(f, "update", { target: exe, cwd: P.dirname(exe), icon: exe, iconIndex: 0, appUserModelId: deps.aumid, description: "Aqar Matrix" });
      if (ok) { res.fixed++; res.files.push({ file: f, was: String(d.target || ""), why }); if (deps.log) deps.log("fixed", f, why, "was:", d.target); }
      else res.errors.push(f + ": write returned false");
    } catch (e) { res.errors.push(f + ": " + (e && e.message)); }
  }
  return res;
}

module.exports = { repair, brokenReason, isMine, collect };
